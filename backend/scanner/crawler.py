import urllib.parse
import re
from typing import List, Dict, Any, Set
import httpx
from bs4 import BeautifulSoup
from backend.core.config import (
    REQUEST_TIMEOUT,
    MAX_CRAWL_URLS,
    MAX_PARAMS_PER_URL,
    MAX_JS_FILES_TO_SCAN,
    DEFAULT_HEADERS,
)

# Biểu thức chính quy trích xuất endpoints từ HTML và mã JavaScript
ENDPOINT_REGEXES = [
    r'["\']([a-zA-Z0-9_\-\./]+\.(?:aspx|ashx|php|json|api|action|do)[^"\'\s]*)["\']',
    r'["\'](/(?:api|v1|v2|v3|graphql|rest|ajax|auth|user|admin|service|webajax)/[^"\'\s]+)["\']',
    r'url\s*:\s*["\']([^"\'\s]+)["\']',
    r'(?:fetch|\$\.ajax|\$\.get|\$\.post|axios\.(?:get|post|put|delete))\s*\(\s*["\']([^"\'\s]+)["\']',
]

async def crawl_target(base_url: str, client: httpx.AsyncClient) -> Dict[str, Any]:
    """
    Thu thập bề mặt tấn công trực tiếp từ trang chủ và các tệp mã nguồn (Depth = 1).
    Phân tích:
    1. Liên kết nội bộ và query parameters.
    2. Biểu mẫu HTML (Forms & Inputs).
    3. Tệp JavaScript tĩnh và inline scripts.
    4. Trích xuất tự động các AJAX/API endpoints và tham số tiềm năng.
    """
    parsed_base = urllib.parse.urlparse(base_url)
    base_domain = parsed_base.netloc.lower()

    result: Dict[str, Any] = {
        "base_url": base_url,
        "urls_with_params": [],
        "forms": [],
        "js_scripts": [],
        "discovered_endpoints": [],
    }

    try:
        response = await client.get(base_url, timeout=REQUEST_TIMEOUT, follow_redirects=True)
    except Exception:
        # Nếu trang chủ không phản hồi, trả về cấu trúc rỗng
        return result

    html_content = response.text
    soup = BeautifulSoup(html_content, "html.parser")
    found_urls: Set[str] = set()
    discovered_endpoints_set: Set[str] = set()

    # Thêm chính URL trang chủ nếu có query param
    if parsed_base.query:
        found_urls.add(base_url)

    # 1. Trích xuất tất cả thẻ <a href="...">
    for a_tag in soup.find_all("a", href=True):
        raw_href = a_tag["href"].strip()
        if not raw_href or raw_href.startswith(("javascript:", "mailto:", "tel:", "#")):
            continue

        absolute_url = urllib.parse.urljoin(base_url, raw_href)
        parsed_target = urllib.parse.urlparse(absolute_url)

        # STRICT SAME-ORIGIN: Chỉ nhận link cùng domain chính
        if parsed_target.netloc.lower() == base_domain:
            if parsed_target.query:
                found_urls.add(absolute_url)

    # 2. Trích xuất thẻ <form>
    for form in soup.find_all("form")[:5]:
        action = form.get("action", "").strip()
        form_url = urllib.parse.urljoin(base_url, action) if action else base_url
        method = form.get("method", "GET").upper()
        inputs = []
        for inp in form.find_all(["input", "textarea", "select"]):
            name = inp.get("name")
            if name and inp.get("type") not in ("hidden", "submit", "button"):
                inputs.append(name)
            elif name and inp.get("type") == "hidden" and not inputs:
                # Lưu lại 1 hidden input nếu không có input text nào
                inputs.append(name)

        if inputs:
            result["forms"].append({
                "action": form_url,
                "method": method,
                "inputs": inputs[:MAX_PARAMS_PER_URL],
            })

    # 3. Trích xuất các tệp JavaScript tĩnh <script src="...">
    js_set: Set[str] = set()
    for script in soup.find_all("script"):
        src = script.get("src", "").strip()
        if src and not src.startswith("data:"):
            js_url = urllib.parse.urljoin(base_url, src)
            js_set.add(js_url)
        elif script.string:
            # Quét inline script để tìm endpoints
            for pattern in ENDPOINT_REGEXES:
                for match in re.findall(pattern, script.string):
                    cleaned = match.strip()
                    if cleaned and len(cleaned) < 200 and not cleaned.startswith(("data:", "javascript:")):
                        discovered_endpoints_set.add(cleaned)

    # Quét toàn bộ HTML để tìm endpoints tiềm năng
    for pattern in ENDPOINT_REGEXES:
        for match in re.findall(pattern, html_content):
            cleaned = match.strip()
            if cleaned and len(cleaned) < 200 and not cleaned.startswith(("data:", "javascript:")):
                discovered_endpoints_set.add(cleaned)

    result["js_scripts"] = list(js_set)[:MAX_JS_FILES_TO_SCAN]

    # 4. Trích xuất URL endpoints có query params từ discovered_endpoints
    for ep in list(discovered_endpoints_set):
        full_ep_url = urllib.parse.urljoin(base_url, ep)
        p = urllib.parse.urlparse(full_ep_url)
        if p.netloc.lower() == base_domain and p.query:
            found_urls.add(full_ep_url)

    # 5. Xử lý các URL có tham số query (giới hạn tối đa MAX_CRAWL_URLS)
    for u in list(found_urls)[:MAX_CRAWL_URLS]:
        p = urllib.parse.urlparse(u)
        query_dict = urllib.parse.parse_qs(p.query)
        param_names = list(query_dict.keys())[:MAX_PARAMS_PER_URL]
        if param_names:
            clean_base = urllib.parse.urlunparse((p.scheme, p.netloc, p.path, "", "", ""))
            result["urls_with_params"].append({
                "full_url": u,
                "endpoint": clean_base,
                "params": param_names,
            })

    result["discovered_endpoints"] = sorted(list(discovered_endpoints_set))[:50]
    return result
