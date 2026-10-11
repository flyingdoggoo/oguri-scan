import re
import urllib.parse
from typing import List, Dict, Any, Set
import httpx
from backend.core.config import REQUEST_TIMEOUT

# Danh sách biểu thức chính quy nhận diện khóa bí mật trong mã JavaScript
SECRET_RULES = [
    {
        "id": "F1",
        "title": "Rò Rỉ Khóa AWS Access Key ID trong JavaScript",
        "pattern": r"AKIA[0-9A-Z]{16}",
        "severity": "CRITICAL",
        "name": "AWS Access Key",
        "impact": "Khóa truy cập đám mây AWS bị nhúng trực tiếp vào file JS frontend. Bất kỳ ai cũng có thể dùng khóa này để đăng nhập vào tài khoản AWS của bạn, trộm dữ liệu S3 hoặc đào coin.",
        "cwe": "CWE-798 / OWASP A07:2021",
        "good_code": "// Lưu vào Environment Variables ở Backend, gọi qua API trung gian\nconst awsKey = process.env.AWS_ACCESS_KEY_ID;",
    },
    {
        "id": "F2",
        "title": "Rò Rỉ Mã JWT Token Tĩnh trong JavaScript",
        "pattern": r"eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}",
        "severity": "HIGH",
        "name": "JWT Token",
        "impact": "Token xác thực hoặc quyền truy cập cố định bị hardcode trong mã nguồn, có nguy cơ bị kẻ xấu dùng để truy cập trái phép API.",
        "cwe": "CWE-798 / OWASP A07:2021",
        "good_code": "// Tạo JWT động khi người dùng đăng nhập, lưu vào HttpOnly cookie",
    },
    {
        "id": "F3",
        "title": "Rò Rỉ Khóa Bí Mật Private Key (RSA / EC)",
        "pattern": r"-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----",
        "severity": "CRITICAL",
        "name": "Private Key",
        "impact": "Khóa mã hóa riêng tư (Private Key) dùng để ký số hoặc kết nối SSH bị lộ hoàn toàn.",
        "cwe": "CWE-312 / OWASP A02:2021",
        "good_code": "// Lưu trữ an toàn trong AWS Secrets Manager hoặc HashiCorp Vault",
    },
    {
        "id": "F4",
        "title": "Rò Rỉ Khóa Stripe Live API Key trong JavaScript",
        "pattern": r"sk_live_[0-9a-zA-Z]{24}",
        "severity": "CRITICAL",
        "name": "Stripe Live Secret Key",
        "impact": "Khóa Secret Stripe có quyền thực hiện giao dịch hoàn tiền, xem thông tin thanh toán của khách hàng trên tài khoản cổng thanh toán.",
        "cwe": "CWE-798 / OWASP A07:2021",
        "good_code": "// Chỉ đưa 'pk_live_...' (Publishable Key) ra Frontend; 'sk_live_...' tuyệt đối chỉ nằm ở Backend",
    },
    {
        "id": "F5",
        "title": "Rò Rỉ Khóa Google API Key trong JavaScript",
        "pattern": r"AIza[0-9A-Za-z_-]{35}",
        "severity": "HIGH",
        "name": "Google API Key",
        "impact": "Khóa Google Cloud API không bị giới hạn HTTP referer có thể bị kẻ khác lợi dụng gọi API làm tiêu hao ngân sách của bạn.",
        "cwe": "CWE-798 / OWASP A07:2021",
        "good_code": "// Cấu hình Application Restrictions (HTTP referrers) trên Google Cloud Console",
    },
    {
        "id": "F6",
        "title": "Rò Rỉ Chuỗi Kết Nối Cơ Sở Dữ Liệu (DB Connection String)",
        "pattern": r'(?:mongodb(?:\+srv)?|postgres(?:ql)?|mysql)://[a-zA-Z0-9_\-]+:[^@\s"\'<>]+@[a-zA-Z0-9_\-\.]+:[0-9]+/[a-zA-Z0-9_\-]+',
        "severity": "CRITICAL",
        "name": "Database Connection String",
        "impact": "Chuỗi kết nối trực tiếp đến cơ sở dữ liệu kèm username và password bị nhúng trong JavaScript.",
        "cwe": "CWE-312 / OWASP A02:2021",
        "good_code": "// Quản lý chuỗi kết nối qua file .env ở server backend",
    },
]

# Thư viện Frontend phổ biến kèm phiên bản chứa lỗ hổng đã công bố
VULNERABLE_LIBRARIES = [
    {
        "id": "F-VULN-BOOTSTRAP",
        "name": "Bootstrap",
        "pattern": r"(?:Bootstrap\s*v|bootstrap\.js\s*v)([0-9\.]+)",
        "title": "Thư Viện Bootstrap Lỗi Thời (Nguy Cơ XSS CVE-2019-8331 / CVE-2018-14041)",
        "min_safe_version": "4.3.1",
        "severity": "HIGH",
        "impact": "Phiên bản Bootstrap 3.x chứa các lỗ hổng XSS đã công bố trong component tooltip và popover cho phép chèn mã HTML độc hại qua data-template.",
        "cwe": "CWE-79 / OWASP A06:2021 (Vulnerable Components)",
        "remediation": "Nâng cấp thư viện lên Bootstrap 4.3.1+ hoặc Bootstrap 5.x. Nếu bắt buộc dùng v3, hãy tích hợp DOMPurify để lọc dữ liệu HTML đưa vào tooltip.",
    },
    {
        "id": "F-VULN-JQUERY",
        "name": "jQuery",
        "pattern": r"(?:jQuery\s*(?:JavaScript Library\s*)?v|jquery\/)([0-9\.]+)",
        "title": "Thư Viện jQuery Lỗi Thời (Nguy Cơ XSS CVE-2020-11022 / CVE-2020-11023)",
        "min_safe_version": "3.5.0",
        "severity": "HIGH",
        "impact": "Phiên bản jQuery < 3.5.0 gặp lỗ hổng xử lý regex khi thực thi phương thức html() hoặc load(), cho phép kẻ tấn công vượt qua bộ lọc XSS.",
        "cwe": "CWE-79 / OWASP A06:2021 (Vulnerable Components)",
        "remediation": "Nâng cấp lên jQuery phiên bản 3.5.0 trở lên hoặc chuyển sang sử dụng Vanilla JavaScript DOM APIs.",
    },
]

def mask_secret(secret_str: str) -> str:
    """Che giấu một phần chuỗi nhạy cảm để đảm bảo an toàn khi hiển thị báo cáo."""
    if len(secret_str) <= 8:
        return "****"
    return secret_str[:4] + "*" * (len(secret_str) - 8) + secret_str[-4:]

def is_version_lower(ver: str, min_ver: str) -> bool:
    """So sánh phiên bản semver cơ bản."""
    try:
        v_parts = [int(p) for p in re.findall(r"\d+", ver)]
        m_parts = [int(p) for p in re.findall(r"\d+", min_ver)]
        return v_parts < m_parts
    except Exception:
        return False

async def scan_js_secrets(
    crawler_data: Dict[str, Any],
    client: httpx.AsyncClient
) -> List[Dict[str, Any]]:
    """
    Kiểm tra Nhóm F: Rà Soát Sâu Toàn Bộ Tệp Bundle JavaScript:
    1. Rò rỉ Khóa Bí Mật (AWS, JWT, Private Keys, Stripe, Google, Database).
    2. Rò rỉ Tệp Source Map (.js.map) làm lộ toàn bộ mã nguồn gốc.
    3. Phát hiện Thư Viện Frontend Lỗi Thời Chứa CVE XSS (Bootstrap 3.x, jQuery < 3.5).
    4. Trích xuất Tuyến Đường AJAX/API và Lộ Endpoint Quản Trị Nhạy Cảm.
    """
    findings: List[Dict[str, Any]] = []
    js_urls = crawler_data.get("js_scripts", [])
    base_url = crawler_data.get("base_url", "")
    parsed_base = urllib.parse.urlparse(base_url)
    base_domain = parsed_base.netloc.lower()

    discovered_endpoints_set: Set[str] = set(crawler_data.get("discovered_endpoints", []))
    js_bundles_metadata: List[Dict[str, Any]] = []

    for js_url in js_urls:
        bundle_meta = {
            "url": js_url,
            "filename": js_url.split("/")[-1].split("?")[0] or "script.js",
            "size": 0,
            "status": 0,
            "has_sourcemap": False,
            "libraries": [],
            "endpoints_count": 0,
        }

        try:
            res = await client.get(js_url, timeout=REQUEST_TIMEOUT, follow_redirects=True)
            bundle_meta["status"] = res.status_code
            if res.status_code != 200 or not res.text:
                js_bundles_metadata.append(bundle_meta)
                continue

            content = res.text
            bundle_meta["size"] = len(content)

            # -----------------------------------------------------------------
            # 1. RÀ SOÁT KHÓA BÍ MẬT (SECRET SCANNING)
            # -----------------------------------------------------------------
            for rule in SECRET_RULES:
                matches = re.findall(rule["pattern"], content)
                if matches:
                    unique_matches = list(set(matches))
                    masked_samples = [mask_secret(str(m)) for m in unique_matches[:3]]

                    findings.append({
                        "id": rule["id"],
                        "title": rule["title"],
                        "category": "Rò rỉ Khóa & Trinh Sát JS",
                        "severity": rule["severity"],
                        "target": f"Tệp JS: {js_url}",
                        "impact": rule["impact"],
                        "evidence": f"Phát hiện {len(matches)} khóa '{rule['name']}'. Mẫu bị che: {', '.join(masked_samples)}",
                        "remediation": {
                            "explanation": "Thu hồi (Revoke/Rotate) ngay lập tức khóa đã bị lộ và chuyển cấu hình vào biến môi trường phía máy chủ.",
                            "bad_code": f"const apiKey = '{masked_samples[0]}'; // Nhúng trực tiếp vào bundle JS",
                            "good_code": rule["good_code"],
                        },
                        "cwe": rule["cwe"],
                    })

            # -----------------------------------------------------------------
            # 2. KIỂM TRA RÒ RỈ SOURCE MAP (.map)
            # -----------------------------------------------------------------
            # Chỉ kiểm tra source map cho script thuộc cùng domain để tối ưu thời gian
            parsed_js = urllib.parse.urlparse(js_url)
            if parsed_js.netloc.lower() == base_domain:
                map_url = js_url.split("?")[0] + ".map"
                try:
                    map_res = await client.get(map_url, timeout=REQUEST_TIMEOUT, follow_redirects=True)
                    if map_res.status_code == 200 and ("sources" in map_res.text or "mappings" in map_res.text):
                        bundle_meta["has_sourcemap"] = True
                        findings.append({
                            "id": "F-SOURCEMAP",
                            "title": "Lộ Tệp Source Map (.js.map) Chứa Toàn Bộ Mã Nguồn Gốc Frontend",
                            "category": "Rò rỉ Khóa & Trinh Sát JS",
                            "severity": "CRITICAL",
                            "target": map_url,
                            "impact": "Tệp .map chứa toàn bộ mã nguồn gốc chưa qua rút gọn/minify, bao gồm biến số, comment lập trình viên, cấu trúc thư mục và logic nghiệp vụ nội bộ.",
                            "evidence": f"Tệp source map công khai: {map_url}\nKích thước: {len(map_res.text)} bytes.",
                            "remediation": {
                                "explanation": "Tắt cấu hình sinh source map trên môi trường Production (ví dụ: sourcemap: false trong vite.config.ts hoặc devtool: false trong webpack.config.js).",
                                "bad_code": "// vite.config.ts\nbuild: { sourcemap: true } // Lộ source map ra public",
                                "good_code": "// vite.config.ts\nbuild: { sourcemap: false } // Tắt trên production",
                            },
                            "cwe": "CWE-540 / OWASP A05:2021",
                        })
                except Exception:
                    pass

            # -----------------------------------------------------------------
            # 3. PHÁT HIỆN THƯ VIỆN FRONTEND LỖI THỜI CHỨA CVE
            # -----------------------------------------------------------------
            for lib in VULNERABLE_LIBRARIES:
                match = re.search(lib["pattern"], content, re.IGNORECASE)
                if match:
                    detected_ver = match.group(1)
                    bundle_meta["libraries"].append(f"{lib['name']} v{detected_ver}")

                    if is_version_lower(detected_ver, lib["min_safe_version"]):
                        # Tránh trùng lặp finding cùng 1 thư viện
                        if not any(f.get("id") == lib["id"] for f in findings):
                            findings.append({
                                "id": lib["id"],
                                "title": f"{lib['title']} (Phát hiện v{detected_ver})",
                                "category": "Rò rỉ Khóa & Trinh Sát JS",
                                "severity": lib["severity"],
                                "target": js_url,
                                "impact": f"{lib['impact']} (Phiên bản mục tiêu đang sử dụng: {detected_ver}, yêu cầu tối thiểu an toàn: {lib['min_safe_version']}).",
                                "evidence": f"Tệp JS: {js_url}\nKhớp chữ ký thư viện: {match.group(0)}",
                                "remediation": {
                                    "explanation": lib["remediation"],
                                    "bad_code": f"<script src=\".../{lib['name'].lower()}/{detected_ver}/...\"></script>",
                                    "good_code": f"<script src=\".../{lib['name'].lower()}/{lib['min_safe_version']}/...\"></script>",
                                },
                                "cwe": lib["cwe"],
                            })

            # -----------------------------------------------------------------
            # 4. TRÍCH XUẤT ENDPOINTS AJAX / API TỪ FILE JS
            # -----------------------------------------------------------------
            ep_patterns = [
                r'["\']([a-zA-Z0-9_\-\./]+\.(?:aspx|ashx|php|json|api|action|do)[^"\'\s]*)["\']',
                r'["\'](/(?:api|v1|v2|v3|graphql|rest|ajax|auth|user|admin|service|webajax)/[^"\'\s]+)["\']',
                r'url\s*:\s*["\']([^"\'\s]+)["\']',
            ]
            local_eps = set()
            for p in ep_patterns:
                for ep_match in re.findall(p, content):
                    cleaned = ep_match.strip()
                    if cleaned and len(cleaned) < 180 and not cleaned.startswith(("data:", "javascript:")):
                        local_eps.add(cleaned)
                        discovered_endpoints_set.add(cleaned)

            bundle_meta["endpoints_count"] = len(local_eps)

            # Cảnh báo nếu phát hiện endpoint admin/debug nhạy cảm trong JS
            sensitive_keywords = ["admin", "debug", "backup", "secret", "internal_api", "superuser"]
            sensitive_found = [ep for ep in local_eps if any(kw in ep.lower() for kw in sensitive_keywords)]
            if sensitive_found and not any(f.get("id") == "F-SENSITIVE-ENDPOINT" for f in findings):
                findings.append({
                    "id": "F-SENSITIVE-ENDPOINT",
                    "title": "Lộ Tuyến Đường API / AJAX Quản Trị Nhạy Cảm Trong Tệp JavaScript",
                    "category": "Rò rỉ Khóa & Trinh Sát JS",
                    "severity": "HIGH",
                    "target": js_url,
                    "impact": "Mã nguồn JavaScript để lộ các đường dẫn API nội bộ hoặc trang quản trị (Admin/Internal/Debug), tạo điều kiện cho hacker thăm dò và thực hiện tấn công leo thang đặc quyền.",
                    "evidence": f"Các endpoints nhạy cảm tìm thấy: {', '.join(sensitive_found[:5])}",
                    "remediation": {
                        "explanation": "Bảo vệ các endpoint quản trị bằng cơ chế phân quyền (RBAC) nghiêm ngặt ở tầng backend và không nhúng các URL nội bộ vào mã nguồn client.",
                        "bad_code": "const ADMIN_URL = '/admin/api/users/delete';",
                        "good_code": "// Backend bảo vệ qua middleware xác thực JWT / Session",
                    },
                    "cwe": "CWE-200 / OWASP A01:2021",
                })

            js_bundles_metadata.append(bundle_meta)
        except Exception:
            js_bundles_metadata.append(bundle_meta)

    # Cập nhật ngược lại crawler_data để các module khác và frontend có dữ liệu trinh sát đầy đủ
    crawler_data["discovered_endpoints"] = sorted(list(discovered_endpoints_set))[:80]
    crawler_data["js_bundles_metadata"] = js_bundles_metadata

    # Bổ sung các endpoints có query param từ JS vào urls_with_params
    for ep in list(discovered_endpoints_set)[:20]:
        full_ep_url = urllib.parse.urljoin(base_url, ep)
        p = urllib.parse.urlparse(full_ep_url)
        if p.netloc.lower() == base_domain and p.query:
            query_dict = urllib.parse.parse_qs(p.query)
            params = list(query_dict.keys())[:3]
            if params:
                clean_base = urllib.parse.urlunparse((p.scheme, p.netloc, p.path, "", "", ""))
                if not any(item["full_url"] == full_ep_url for item in crawler_data.get("urls_with_params", [])):
                    crawler_data.setdefault("urls_with_params", []).append({
                        "full_url": full_ep_url,
                        "endpoint": clean_base,
                        "params": params,
                    })

    return findings
