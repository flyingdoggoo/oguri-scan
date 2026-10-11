import re
import urllib.parse
from typing import List, Dict, Any
import httpx
from backend.core.config import REQUEST_TIMEOUT

# Chữ ký nhận diện duyệt thư mục công khai (Directory Listing)
DIR_LISTING_SIGNATURES = [
    r"<title>Index of /",
    r"<h1>Index of /",
    r"Directory listing for /",
    r"Parent Directory</a>",
    r"\[To Parent Directory\]",
]

# Chữ ký rò rỉ ngăn xếp lỗi hệ thống (Stack Traces)
STACK_TRACE_PATTERNS = [
    r"Traceback \(most recent call last\):",      # Python
    r"Fatal error:.*in .*\.php on line \d+",      # PHP
    r"Exception in thread \".*\" java\.",         # Java
    r"at [a-zA-Z0-9_\.]+\([a-zA-Z0-9_\.]+\.java:\d+\)", # Java stack trace
    r"Microsoft OLE DB Provider for SQL Server",  # ASP.NET / MSSQL
    r"SyntaxError:.*at line \d+",                 # Node.js
    r"django\.core\.exceptions\.",                # Django
    r"ActiveRecord::RecordNotFound",              # Rails
]

async def scan_cors_and_info_disclosure(base_url: str, client: httpx.AsyncClient) -> List[Dict[str, Any]]:
    """
    Kiểm tra Nhóm D: Lỗ hổng CORS & Rò rỉ Thông tin Nhạy cảm (5 bài kiểm tra thực chiến).
    """
    findings: List[Dict[str, Any]] = []

    # -------------------------------------------------------------
    # D1, D2, D3: KIỂM TRA LỖ HỔNG CẤU HÌNH SAI CORS
    # -------------------------------------------------------------
    evil_origin = "https://evil-attacker.com"
    try:
        # Test 1: Gửi Origin lạ
        cors_res = await client.get(
            base_url,
            headers={"Origin": evil_origin},
            timeout=REQUEST_TIMEOUT,
            follow_redirects=True
        )
        acao = cors_res.headers.get("access-control-allow-origin", "")
        acac = cors_res.headers.get("access-control-allow-credentials", "").lower()

        # D1: Phản chiếu Origin tùy ý kèm credentials (Cực kỳ nguy hiểm)
        if acao == evil_origin and acac == "true":
            findings.append({
                "id": "D1",
                "title": "CORS Phản Chiếu Origin Tùy Ý Kèm Thông Tin Đăng Nhập (Credentials)",
                "category": "CORS & Rò rỉ Dữ liệu",
                "severity": "CRITICAL",
                "target": base_url,
                "impact": "Trang web độc hại của hacker có thể gửi yêu cầu AJAX đọc trộm toàn bộ dữ liệu cá nhân (kèm cookie) của nạn nhân khi họ đang đăng nhập.",
                "evidence": f"Request Origin: {evil_origin}\nResponse: Access-Control-Allow-Origin: {acao}\nAccess-Control-Allow-Credentials: {acac}",
                "remediation": {
                    "explanation": "Chỉ whitelist những tên miền tin cậy cụ thể trong cấu hình CORS, tuyệt đối không phản chiếu động header Origin khi ACAC=true.",
                    "bad_code": "res.setHeader('Access-Control-Allow-Origin', req.headers.origin);\nres.setHeader('Access-Control-Allow-Credentials', 'true');",
                    "good_code": "const whitelist = ['https://trusted.com'];\nif (whitelist.includes(req.headers.origin)) {\n  res.setHeader('Access-Control-Allow-Origin', req.headers.origin);\n}",
                },
                "cwe": "CWE-942 / OWASP A01:2021"
            })
        elif acao == evil_origin:
            # Phản chiếu origin nhưng không có credentials
            findings.append({
                "id": "D1",
                "title": "CORS Phản Chiếu Origin Tùy Ý (Origin Reflection)",
                "category": "CORS & Rò rỉ Dữ liệu",
                "severity": "HIGH",
                "target": base_url,
                "impact": "Bất kỳ trang web nào cũng có thể đọc nội dung dữ liệu công khai hoặc nội bộ được trả về từ endpoint này.",
                "evidence": f"Request Origin: {evil_origin} ➔ Response ACAO: {acao}",
                "remediation": {
                    "explanation": "Kiểm tra danh sách whitelist trước khi gán Access-Control-Allow-Origin.",
                    "bad_code": "Access-Control-Allow-Origin: *",
                    "good_code": "Access-Control-Allow-Origin: https://app.example.com",
                },
                "cwe": "CWE-942"
            })

        # D2: Chấp nhận Origin null
        null_res = await client.get(
            base_url,
            headers={"Origin": "null"},
            timeout=REQUEST_TIMEOUT,
            follow_redirects=True
        )
        if null_res.headers.get("access-control-allow-origin") == "null":
            findings.append({
                "id": "D2",
                "title": "Cấu Hình CORS Chấp Nhận Origin null",
                "category": "CORS & Rò rỉ Dữ liệu",
                "severity": "HIGH",
                "target": base_url,
                "impact": "Kẻ tấn công có thể dùng iframe sandbox hoặc tệp HTML cục bộ (file://) để vượt qua chính sách Same-Origin Policy.",
                "evidence": "Request Origin: null ➔ Response Access-Control-Allow-Origin: null",
                "remediation": {
                    "explanation": "Tuyệt đối không đưa 'null' vào danh sách nguồn gốc được phép truy cập.",
                    "bad_code": "if (origin === 'null') res.setHeader('Access-Control-Allow-Origin', 'null');",
                    "good_code": "// Từ chối header Origin: null",
                },
                "cwe": "CWE-942"
            })

        # D3: Wildcard * trên trang chính
        if acao == "*" and acac != "true":
            findings.append({
                "id": "D3",
                "title": "CORS Cấu Hình Mở Rộng Wildcard (*)",
                "category": "CORS & Rò rỉ Dữ liệu",
                "severity": "MEDIUM",
                "target": base_url,
                "impact": "Mọi trang web đều có thể truy cập tài nguyên này qua API.",
                "evidence": "Access-Control-Allow-Origin: *",
                "remediation": {
                    "explanation": "Chỉ dùng wildcard cho các tài nguyên static public (ảnh, font), tránh áp dụng lên API trả về dữ liệu nội bộ.",
                    "bad_code": "Access-Control-Allow-Origin: *",
                    "good_code": "Access-Control-Allow-Origin: https://trusted-partner.com",
                },
                "cwe": "CWE-942"
            })
    except Exception:
        pass

    # -------------------------------------------------------------
    # D4: KIỂM TRA BẬT TÍNH NĂNG DUYỆT THƯ MỤC (DIRECTORY LISTING)
    # -------------------------------------------------------------
    dir_test_paths = ["/images/", "/static/", "/uploads/", "/assets/"]
    for path in dir_test_paths:
        test_url = urllib.parse.urljoin(base_url, path)
        try:
            dir_res = await client.get(test_url, timeout=REQUEST_TIMEOUT, follow_redirects=True)
            if dir_res.status_code == 200:
                for sig in DIR_LISTING_SIGNATURES:
                    if re.search(sig, dir_res.text, re.IGNORECASE):
                        findings.append({
                            "id": "D4",
                            "title": "Bật Tính Năng Duyệt Thư Mục Công Khai (Directory Listing)",
                            "category": "CORS & Rò rỉ Dữ liệu",
                            "severity": "CRITICAL",
                            "target": test_url,
                            "impact": "Máy chủ hiển thị toàn bộ danh sách tệp tin trong thư mục, làm lộ mã nguồn, file tài liệu nội bộ, bản backup hoặc tệp .env.",
                            "evidence": f"Truy cập {test_url} phát hiện chữ ký duyệt thư mục: '{sig}'",
                            "remediation": {
                                "explanation": "Tắt tính năng autoindex trên máy chủ web (Nginx: 'autoindex off;', Apache: 'Options -Indexes').",
                                "bad_code": "autoindex on; # Nginx",
                                "good_code": "autoindex off; # Nginx\nOptions -Indexes # Apache",
                            },
                            "cwe": "CWE-548 / OWASP A05:2021"
                        })
                        break
        except Exception:
            pass

    # -------------------------------------------------------------
    # D5: KIỂM TRA RÒ RỈ STACK TRACE TRÊN TRANG LỖI (ERROR LEAKS)
    # -------------------------------------------------------------
    error_probe_url = urllib.parse.urljoin(base_url, "/oguri_scan_probe_non_existent_404_test.html")
    try:
        err_res = await client.get(error_probe_url, timeout=REQUEST_TIMEOUT, follow_redirects=True)
        for pattern in STACK_TRACE_PATTERNS:
            match = re.search(pattern, err_res.text, re.IGNORECASE)
            if match:
                findings.append({
                    "id": "D5",
                    "title": "Rò Rỉ Ngăn Xếp Lỗi & Mã Nguồn Nội Bộ (Stack Trace Disclosure)",
                    "category": "CORS & Rò rỉ Dữ liệu",
                    "severity": "HIGH",
                    "target": error_probe_url,
                    "impact": "Trang báo lỗi hiển thị chi tiết đường dẫn tệp máy chủ, phiên bản framework và ngăn xếp lỗi, giúp hacker tìm CVE tương ứng để khai thác.",
                    "evidence": f"Phát hiện chữ ký lỗi: '{match.group(0)}'",
                    "remediation": {
                        "explanation": "Tắt chế độ Debug trên môi trường Production và cấu hình trang báo lỗi tùy chỉnh (custom error page).",
                        "bad_code": "DEBUG = True # Django / Flask / Express",
                        "good_code": "DEBUG = False # Production\napp.use((err, req, res, next) => res.status(500).send('Lỗi hệ thống'));",
                    },
                    "cwe": "CWE-209 / OWASP A05:2021"
                })
                break
    except Exception:
        pass

    return findings
