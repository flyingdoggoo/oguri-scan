import re
import uuid
import urllib.parse
from typing import List, Dict, Any
import httpx
from backend.core.config import REQUEST_TIMEOUT
from backend.core.circuit_breaker import CircuitBreaker, CircuitBreakerOpenException

# Chữ ký nhận diện lỗi CSDL đa nền tảng (Database-Agnostic SQL Signatures)
SQL_ERROR_PATTERNS = {
    "MySQL": [
        r"You have an error in your SQL syntax",
        r"supplied argument is not a valid MySQL",
        r"check the manual that corresponds to your MySQL server version",
        r"mysql_fetch_array\(\)",
    ],
    "PostgreSQL": [
        r"PostgreSQL.*ERROR",
        r"syntax error at or near",
        r"pg_query\(\): Query failed",
        r"PG::SyntaxError:",
    ],
    "SQLite": [
        r"SQLite/JDBCDriver",
        r"sqlite3\.OperationalError:",
        r"unrecognized token:",
        r"near \".*\": syntax error",
    ],
    "MSSQL": [
        r"Microsoft OLE DB Provider for SQL Server",
        r"Unclosed quotation mark before the character string",
        r"Line \d+: Incorrect syntax near",
    ],
    "Oracle": [
        r"ORA-00933: SQL command not properly ended",
        r"ORA-01756: quoted string not properly terminated",
        r"Oracle error",
    ]
}

# Chữ ký nhận diện đọc tệp hệ điều hành thành công (Path Traversal)
LFI_PATTERNS = [
    r"root:.*:0:0:",               # /etc/passwd Linux
    r"\[boot loader\]",            # boot.ini Windows
    r"\[fonts\]",                  # win.ini Windows
]

async def scan_active_injection(
    crawler_data: Dict[str, Any],
    client: httpx.AsyncClient,
    circuit_breaker: CircuitBreaker
) -> List[Dict[str, Any]]:
    """
    Kiểm tra Nhóm E: Tấn công Tiêm Mã độc Thực tế (5 bài kiểm tra thực chiến).
    Bao gồm Reflected XSS, SQL Injection (Error-based), Open Redirect, Path Traversal.
    """
    findings: List[Dict[str, Any]] = []
    urls_with_params = crawler_data.get("urls_with_params", [])

    for item in urls_with_params:
        endpoint = item["endpoint"]
        full_url = item["full_url"]
        params = item["params"]

        parsed_url = urllib.parse.urlparse(full_url)
        base_query = urllib.parse.parse_qs(parsed_url.query)

        for param in params:
            # Kiểm tra trạng thái Circuit Breaker trước khi gửi bất kỳ payload nào
            try:
                circuit_breaker.check_state()
            except CircuitBreakerOpenException as e:
                # Dừng quét injection ngay lập tức nếu mạch đã ngắt
                return findings

            # ---------------------------------------------------------
            # E1 & E2: KIỂM TRA REFLECTED XSS (Thẻ Script & Attribute)
            # ---------------------------------------------------------
            marker_uuid = uuid.uuid4().hex[:8]
            xss_payload_tag = f"<script>WSEC_TAG_{marker_uuid}</script>"
            xss_payload_attr = f"'\"><img src=x onerror=WSEC_ATTR_{marker_uuid}>"

            # Test Payload 1: Script tag
            test_query = base_query.copy()
            test_query[param] = [xss_payload_tag]
            encoded_query = urllib.parse.urlencode(test_query, doseq=True)
            target_test_url = urllib.parse.urlunparse((
                parsed_url.scheme, parsed_url.netloc, parsed_url.path, "", encoded_query, ""
            ))

            try:
                res = await client.get(target_test_url, timeout=REQUEST_TIMEOUT, follow_redirects=True)
                circuit_breaker.record_response(res.status_code)

                # Nếu marker xuất hiện NGUYÊN VẸN không bị escape mã HTML (<script> còn nguyên)
                if xss_payload_tag in res.text:
                    findings.append({
                        "id": "E1",
                        "title": "Lỗ Hổng Reflected XSS (Thực Thi Mã Độc JavaScript)",
                        "category": "Tấn công Tiêm mã độc (Injection)",
                        "severity": "CRITICAL",
                        "target": f"{endpoint}?{param}=",
                        "impact": "Kẻ tấn công có thể gửi liên kết chứa mã độc cho nạn nhân; khi nạn nhân bấm vào, mã JavaScript tự động thực thi đánh cắp phiên đăng nhập hoặc giả mạo thao tác.",
                        "evidence": f"Tham số: {param}\nPayload gửi đi: {xss_payload_tag}\nMã nguồn phản hồi phản chiếu nguyên vẹn không mã hóa.",
                        "remediation": {
                            "explanation": "Mã hóa toàn bộ dữ liệu đầu vào trước khi in ra HTML (HTML Entity Encoding) hoặc sử dụng Context-aware Escaping.",
                            "bad_code": f"<div>Hello {param}</div> <!-- In trực tiếp -->",
                            "good_code": f"<div>Hello {{ escape_html({param}) }}</div>",
                        },
                        "cwe": "CWE-79 / OWASP A03:2021"
                    })
                else:
                    # Test Payload 2: Thoát nháy thuộc tính
                    test_query[param] = [xss_payload_attr]
                    encoded_query_attr = urllib.parse.urlencode(test_query, doseq=True)
                    target_test_url_attr = urllib.parse.urlunparse((
                        parsed_url.scheme, parsed_url.netloc, parsed_url.path, "", encoded_query_attr, ""
                    ))
                    res_attr = await client.get(target_test_url_attr, timeout=REQUEST_TIMEOUT, follow_redirects=True)
                    circuit_breaker.record_response(res_attr.status_code)

                    if f"onerror=WSEC_ATTR_{marker_uuid}" in res_attr.text and "<img" in res_attr.text:
                        findings.append({
                            "id": "E2",
                            "title": "Lỗ Hổng Reflected XSS (Thoát Khỏi Thuộc Tính HTML)",
                            "category": "Tấn công Tiêm mã độc (Injection)",
                            "severity": "CRITICAL",
                            "target": f"{endpoint}?{param}=",
                            "impact": "Giá trị tham số được đưa vào thuộc tính thẻ HTML mà không lọc dấu ngoặc kép / nháy đơn, cho phép chèn thuộc tính sự kiện độc hại (onerror, onload).",
                            "evidence": f"Tham số: {param}\nPayload: {xss_payload_attr}",
                            "remediation": {
                                "explanation": "Mã hóa dấu nháy đơn và nháy kép thành &quot; và &#x27; khi gán vào thuộc tính HTML.",
                                "bad_code": f"<input value=\"{param}\">",
                                "good_code": f"<input value=\"{{ htmlspecialchars({param}) }}\">",
                            },
                            "cwe": "CWE-79 / OWASP A03:2021"
                        })
            except Exception:
                pass

            # ---------------------------------------------------------
            # E3: KIỂM TRA SQL INJECTION (ERROR-BASED ĐA CƠ SỞ DỮ LIỆU)
            # ---------------------------------------------------------
            sqli_payload = "'"
            test_query = base_query.copy()
            test_query[param] = [sqli_payload]
            encoded_query = urllib.parse.urlencode(test_query, doseq=True)
            sqli_test_url = urllib.parse.urlunparse((
                parsed_url.scheme, parsed_url.netloc, parsed_url.path, "", encoded_query, ""
            ))

            try:
                res_sqli = await client.get(sqli_test_url, timeout=REQUEST_TIMEOUT, follow_redirects=True)
                circuit_breaker.record_response(res_sqli.status_code)

                # So khớp nội dung response với từ điển lỗi SQL
                for db_name, patterns in SQL_ERROR_PATTERNS.items():
                    for pat in patterns:
                        match = re.search(pat, res_sqli.text, re.IGNORECASE)
                        if match:
                            findings.append({
                                "id": "E3",
                                "title": f"Lỗ Hổng SQL Injection (Dựa Trên Mã Lỗi {db_name})",
                                "category": "Tấn công Tiêm mã độc (Injection)",
                                "severity": "CRITICAL",
                                "target": f"{endpoint}?{param}=",
                                "impact": "Tham số được ghép trực tiếp vào câu lệnh truy vấn SQL mà không dùng Parameterized Queries. Hacker có thể trích xuất toàn bộ cơ sở dữ liệu, bypass đăng nhập hoặc phá hủy dữ liệu.",
                                "evidence": f"Tiêm ký tự nháy đơn: '{sqli_payload}'\nPhát hiện chữ ký lỗi CSDL ({db_name}): '{match.group(0)}'",
                                "remediation": {
                                    "explanation": "Sử dụng Parameterized Queries (Prepared Statements) hoặc ORM, tuyệt đối không cộng chuỗi câu lệnh SQL.",
                                    "bad_code": f"query = f\"SELECT * FROM users WHERE id = '{param}'\"",
                                    "good_code": "cursor.execute(\"SELECT * FROM users WHERE id = %s\", (param,))",
                                },
                                "cwe": "CWE-89 / OWASP A03:2021"
                            })
                            break
                    if any(f["id"] == "E3" and param in f["target"] for f in findings):
                        break
            except Exception:
                pass

            # ---------------------------------------------------------
            # E4: KIỂM TRA CHUYỂN HƯỚNG MỞ (OPEN REDIRECT)
            # ---------------------------------------------------------
            redirect_param_names = {"redirect", "redirect_to", "next", "url", "return", "return_url", "dest", "target"}
            if param.lower() in redirect_param_names:
                evil_redirect_target = "https://evil-redirect-test.com"
                test_query = base_query.copy()
                test_query[param] = [evil_redirect_target]
                encoded_query = urllib.parse.urlencode(test_query, doseq=True)
                open_redir_url = urllib.parse.urlunparse((
                    parsed_url.scheme, parsed_url.netloc, parsed_url.path, "", encoded_query, ""
                ))

                try:
                    res_redir = await client.get(open_redir_url, timeout=REQUEST_TIMEOUT, follow_redirects=False)
                    circuit_breaker.record_response(res_redir.status_code)

                    location_header = res_redir.headers.get("location", "")
                    if "evil-redirect-test.com" in location_header:
                        findings.append({
                            "id": "E4",
                            "title": "Lỗ Hổng Chuyển Hướng Mở (Open Redirect)",
                            "category": "Tấn công Tiêm mã độc (Injection)",
                            "severity": "HIGH",
                            "target": f"{endpoint}?{param}=",
                            "impact": "Trang web tự động chuyển hướng người dùng đến domain độc hại do kẻ xấu chỉ định, dùng trong các chiến dịch Phishing chiếm tài khoản.",
                            "evidence": f"Gán {param}={evil_redirect_target}\nTiêu đề Location phản hồi: '{location_header}'",
                            "remediation": {
                                "explanation": "Chỉ chấp nhận các đường dẫn tương đối (bắt đầu bằng '/') hoặc kiểm tra whitelist domain nội bộ.",
                                "bad_code": "res.redirect(req.query.returnUrl);",
                                "good_code": "const dest = req.query.returnUrl;\nif (dest.startsWith('/') && !dest.startsWith('//')) res.redirect(dest);",
                            },
                            "cwe": "CWE-601 / OWASP A01:2021"
                        })
                except Exception:
                    pass

            # ---------------------------------------------------------
            # E5: KIỂM TRA ĐỌC TỆP MÁY CHỦ (PATH TRAVERSAL / LFI)
            # ---------------------------------------------------------
            file_param_names = {"file", "path", "page", "doc", "template", "view", "load"}
            if param.lower() in file_param_names:
                lfi_payload = "../../../../etc/passwd"
                test_query = base_query.copy()
                test_query[param] = [lfi_payload]
                encoded_query = urllib.parse.urlencode(test_query, doseq=True)
                lfi_url = urllib.parse.urlunparse((
                    parsed_url.scheme, parsed_url.netloc, parsed_url.path, "", encoded_query, ""
                ))

                try:
                    res_lfi = await client.get(lfi_url, timeout=REQUEST_TIMEOUT, follow_redirects=True)
                    circuit_breaker.record_response(res_lfi.status_code)

                    for pat in LFI_PATTERNS:
                        match = re.search(pat, res_lfi.text)
                        if match:
                            findings.append({
                                "id": "E5",
                                "title": "Lỗ Hổng Đọc Tệp Hệ Thống (Path Traversal / LFI)",
                                "category": "Tấn công Tiêm mã độc (Injection)",
                                "severity": "CRITICAL",
                                "target": f"{endpoint}?{param}=",
                                "impact": "Tham số cho phép dùng ký tự '../' để thoát khỏi thư mục chỉ định và đọc các tệp cấu hình, file mã nguồn hoặc danh sách user /etc/passwd trên máy chủ.",
                                "evidence": f"Payload: {lfi_payload}\nPhản hồi chứa chữ ký tệp hệ thống: '{match.group(0)}'",
                                "remediation": {
                                    "explanation": "Chỉ sử dụng tên tệp (bỏ dấu / và .. qua os.path.basename) hoặc ánh xạ qua ID/Whitelist danh sách tệp được phép.",
                                    "bad_code": "with open(user_input, 'r') as f: return f.read()",
                                    "good_code": "safe_path = os.path.basename(user_input)\nwith open(os.path.join(ALLOWED_DIR, safe_path), 'r') as f: ...",
                                },
                                "cwe": "CWE-22 / OWASP A01:2021"
                            })
                            break
                except Exception:
                    pass

    # ---------------------------------------------------------
    # E6 & E7: KIỂM TRA ĐẦU VÀO BIỂU MẪU HTML (FORM FUZZING)
    # ---------------------------------------------------------
    forms = crawler_data.get("forms", [])
    for form in forms[:3]:
        action_url = form.get("action", "")
        method = form.get("method", "GET").upper()
        inputs = form.get("inputs", [])

        for input_name in inputs[:2]:
            try:
                circuit_breaker.check_state()
            except CircuitBreakerOpenException:
                return findings

            # Form XSS Test
            form_marker = uuid.uuid4().hex[:8]
            form_xss_payload = f"<script>FORM_TAG_{form_marker}</script>"
            try:
                if method == "POST":
                    f_res = await client.post(action_url, data={input_name: form_xss_payload}, timeout=REQUEST_TIMEOUT, follow_redirects=True)
                else:
                    f_res = await client.get(action_url, params={input_name: form_xss_payload}, timeout=REQUEST_TIMEOUT, follow_redirects=True)

                circuit_breaker.record_response(f_res.status_code)
                if form_xss_payload in f_res.text:
                    findings.append({
                        "id": "E1",
                        "title": "Lỗ Hổng XSS Trong Biểu Mẫu HTML (Form Input Reflection)",
                        "category": "Tấn công Tiêm mã độc (Injection)",
                        "severity": "CRITICAL",
                        "target": f"Biểu mẫu {method} {action_url} [{input_name}]",
                        "impact": "Trường dữ liệu trong biểu mẫu in trực tiếp dữ liệu người dùng mà không qua xử lý lọc mã độc HTML, cho phép thực thi mã JavaScript tùy ý.",
                        "evidence": f"Form: {action_url}\nTrường nhập liệu: {input_name}\nPayload phản chiếu: {form_xss_payload}",
                        "remediation": {
                            "explanation": "Mã hóa toàn bộ dữ liệu phản hồi từ biểu mẫu bằng Context-Aware HTML Escaping.",
                            "bad_code": f"<input name=\"{input_name}\" value=\"\" />",
                            "good_code": f"<input name=\"{input_name}\" value=\"{{ escape_html(val) }}\" />",
                        },
                        "cwe": "CWE-79 / OWASP A03:2021"
                    })
            except Exception:
                pass

            # Form SQLi Test
            try:
                if method == "POST":
                    f_sqli_res = await client.post(action_url, data={input_name: "'"}, timeout=REQUEST_TIMEOUT, follow_redirects=True)
                else:
                    f_sqli_res = await client.get(action_url, params={input_name: "'"}, timeout=REQUEST_TIMEOUT, follow_redirects=True)

                circuit_breaker.record_response(f_sqli_res.status_code)
                for db_name, patterns in SQL_ERROR_PATTERNS.items():
                    for pat in patterns:
                        match = re.search(pat, f_sqli_res.text, re.IGNORECASE)
                        if match:
                            findings.append({
                                "id": "E3",
                                "title": f"Lỗ Hổng SQL Injection Qua Biểu Mẫu (Dựa Trên Mã Lỗi {db_name})",
                                "category": "Tấn công Tiêm mã độc (Injection)",
                                "severity": "CRITICAL",
                                "target": f"Biểu mẫu {method} {action_url} [{input_name}]",
                                "impact": "Dữ liệu nhập từ biểu mẫu được ghép trực tiếp vào câu lệnh SQL phía backend, làm lộ thông tin nhạy cảm của toàn bộ cơ sở dữ liệu.",
                                "evidence": f"Form: {action_url} [{input_name}]\nPhát hiện chữ ký lỗi CSDL ({db_name}): '{match.group(0)}'",
                                "remediation": {
                                    "explanation": "Áp dụng Parameterized Queries (Prepared Statements) cho toàn bộ xử lý form dữ liệu.",
                                    "bad_code": f"cursor.execute(\"SELECT * FROM tbl WHERE {input_name} = '\" + val + \"'\")",
                                    "good_code": f"cursor.execute(\"SELECT * FROM tbl WHERE {input_name} = %s\", (val,))",
                                },
                                "cwe": "CWE-89 / OWASP A03:2021"
                            })
                            break
                    if any(f["id"] == "E3" and input_name in f["target"] for f in findings):
                        break
            except Exception:
                pass

    return findings
