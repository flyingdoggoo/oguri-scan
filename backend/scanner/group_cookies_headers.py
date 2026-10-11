from typing import List, Dict, Any
import httpx
import urllib.parse
from backend.core.config import REQUEST_TIMEOUT

async def scan_cookies_and_headers(base_url: str, client: httpx.AsyncClient) -> List[Dict[str, Any]]:
    """
    Kiểm tra Nhóm A (5 bài kiểm tra Cookie) và Nhóm B (5 bài kiểm tra Security Headers).
    Tập trung vào các lỗ hổng có thể bị chiếm phiên (Session Hijacking) hoặc Clickjacking.
    """
    findings: List[Dict[str, Any]] = []

    # 1. Gửi request lấy Header và Cookie của trang chính
    try:
        response = await client.get(base_url, timeout=REQUEST_TIMEOUT, follow_redirects=False)
    except Exception as e:
        return findings

    headers = response.headers

    # -------------------------------------------------------------
    # NHÓM A: BẢO VỆ COOKIE & PHIÊN LÀM VIỆC (A1 - A5)
    # -------------------------------------------------------------
    # httpx cho phép lấy danh sách Set-Cookie thô qua get_list
    raw_cookies = headers.get_list("set-cookie")

    for raw_cookie in raw_cookies:
        parts = [p.strip() for p in raw_cookie.split(";")]
        if not parts:
            continue
        cookie_name_val = parts[0]
        cookie_name = cookie_name_val.split("=")[0] if "=" in cookie_name_val else cookie_name_val
        cookie_lower = raw_cookie.lower()

        # A1: Thiếu HttpOnly
        if "httponly" not in cookie_lower:
            findings.append({
                "id": "A1",
                "title": "Cookie Phiên Thiếu Cờ Bảo Vệ HttpOnly",
                "category": "Cookies & Phiên làm việc",
                "severity": "CRITICAL",
                "target": f"Cookie: {cookie_name}",
                "impact": "Mã độc JavaScript (qua XSS) có thể đọc trộm cookie này qua 'document.cookie' để chiếm quyền đăng nhập của người dùng.",
                "evidence": f"Set-Cookie: {raw_cookie}",
                "remediation": {
                    "explanation": "Bật cờ HttpOnly khi khởi tạo cookie trên server backend.",
                    "bad_code": "Set-Cookie: session_id=xyz; Path=/",
                    "good_code": "Set-Cookie: session_id=xyz; Path=/; HttpOnly; Secure; SameSite=Lax",
                },
                "cwe": "CWE-1004 / OWASP A05:2021"
            })

        # A2: Thiếu Secure (trên trang HTTPS)
        if base_url.startswith("https://") and "secure" not in cookie_lower:
            findings.append({
                "id": "A2",
                "title": "Cookie Truyền Không Mã Hóa Thiếu Cờ Secure",
                "category": "Cookies & Phiên làm việc",
                "severity": "CRITICAL",
                "target": f"Cookie: {cookie_name}",
                "impact": "Cookie có thể bị gửi lộ liễu qua kết nối HTTP không mã hóa khi người dùng truy cập mạng WiFi công cộng, dẫn tới nghe lén phiên.",
                "evidence": f"Set-Cookie: {raw_cookie}",
                "remediation": {
                    "explanation": "Thêm thuộc tính Secure vào tất cả các cookie phiên làm việc.",
                    "bad_code": "res.cookie('token', token, { httpOnly: true });",
                    "good_code": "res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'lax' });",
                },
                "cwe": "CWE-614 / OWASP A05:2021"
            })

        # A3: Thiếu hoặc sai SameSite
        if "samesite" not in cookie_lower:
            findings.append({
                "id": "A3",
                "title": "Cookie Thiếu Cờ Giới Hạn SameSite (Nguy cơ CSRF)",
                "category": "Cookies & Phiên làm việc",
                "severity": "HIGH",
                "target": f"Cookie: {cookie_name}",
                "impact": "Trình duyệt tự động đính kèm cookie này khi gửi yêu cầu cross-origin từ website của kẻ tấn công (CSRF).",
                "evidence": f"Set-Cookie: {raw_cookie}",
                "remediation": {
                    "explanation": "Cấu hình SameSite=Lax (cho cookie điều hướng) hoặc SameSite=Strict (cho API nhạy cảm).",
                    "bad_code": "Set-Cookie: session=xyz; Secure; HttpOnly",
                    "good_code": "Set-Cookie: session=xyz; Secure; HttpOnly; SameSite=Lax",
                },
                "cwe": "CWE-1275 / OWASP A01:2021"
            })

        # A4: Phạm vi Domain quá rộng (.example.com)
        for part in parts:
            if part.lower().startswith("domain="):
                domain_val = part.split("=")[1].strip()
                if domain_val.startswith("."):
                    findings.append({
                        "id": "A4",
                        "title": "Phạm Vi Tên Miền Của Cookie Quá Rộng",
                        "category": "Cookies & Phiên làm việc",
                        "severity": "MEDIUM",
                        "target": f"Cookie: {cookie_name} (Domain={domain_val})",
                        "impact": "Tất cả các subdomain (kể cả subdomain staging không an toàn) đều có quyền đọc cookie phiên này.",
                        "evidence": f"Domain attribute: {part}",
                        "remediation": {
                            "explanation": "Bỏ thuộc tính Domain hoặc chỉ định chính xác host cụ thể (bỏ dấu chấm bắt đầu).",
                            "bad_code": "Set-Cookie: sid=123; Domain=.example.com",
                            "good_code": "Set-Cookie: sid=123; Domain=app.example.com",
                        },
                        "cwe": "CWE-287"
                    })

    # A5: Kiểm tra HTTP redirect có cấp cookie trước khi chuyển sang HTTPS
    if base_url.startswith("https://"):
        http_url = "http://" + urllib.parse.urlparse(base_url).netloc
        try:
            http_res = await client.get(http_url, timeout=REQUEST_TIMEOUT, follow_redirects=False)
            if http_res.headers.get("set-cookie"):
                findings.append({
                    "id": "A5",
                    "title": "Cấp Phát Cookie Trước Khi Chuyển Hướng HTTPS",
                    "category": "Cookies & Phiên làm việc",
                    "severity": "HIGH",
                    "target": http_url,
                    "impact": "Trang HTTP ban đầu đã trả về cookie phiên qua đường truyền plaintext trước khi kịp chuyển hướng sang HTTPS.",
                    "evidence": f"HTTP response Set-Cookie: {http_res.headers.get('set-cookie')[:100]}...",
                    "remediation": {
                        "explanation": "Chỉ chuyển hướng 301 sang HTTPS ngay lập tức, không gán bất kỳ Set-Cookie nào ở kết nối HTTP.",
                        "bad_code": "res.setHeader('Set-Cookie', 'id=1').redirect('https://...');",
                        "good_code": "res.redirect(301, 'https://' + req.headers.host + req.url);",
                    },
                    "cwe": "CWE-319"
                })
        except Exception:
            pass

    # -------------------------------------------------------------
    # NHÓM B: TIÊU ĐỀ TRỰC TIẾP CHỐNG TẤN CÔNG (B1 - B5)
    # -------------------------------------------------------------
    csp = headers.get("content-security-policy", "")
    x_frame = headers.get("x-frame-options", "").upper()
    hsts = headers.get("strict-transport-security", "")
    x_content_type = headers.get("x-content-type-options", "").lower()

    # B1 & B2: Content-Security-Policy
    if not csp:
        findings.append({
            "id": "B1",
            "title": "Thiếu Tiêu Đề Content-Security-Policy (CSP)",
            "category": "Tiêu đề An ninh",
            "severity": "CRITICAL",
            "target": "HTTP Headers",
            "impact": "Trình duyệt không có rào chắn hạn chế mã script độc hại, khiến các cuộc tấn công Reflected/Stored XSS dễ dàng đánh cắp dữ liệu.",
            "evidence": "Header 'Content-Security-Policy' hoàn toàn không tồn tại trong response.",
            "remediation": {
                "explanation": "Thêm tiêu đề CSP giới hạn nguồn nạp script, style, và kết nối mạng.",
                "bad_code": "// Thiếu header CSP",
                "good_code": "Content-Security-Policy: default-src 'self'; script-src 'self'; object-src 'none';",
            },
            "cwe": "CWE-1021 / OWASP A05:2021"
        })
    else:
        # B2: CSP bị suy yếu
        if "unsafe-inline" in csp or "unsafe-eval" in csp:
            findings.append({
                "id": "B2",
                "title": "Chính Sách CSP Bị Suy Yếu (Chứa unsafe-inline / unsafe-eval)",
                "category": "Tiêu đề An ninh",
                "severity": "HIGH",
                "target": "Content-Security-Policy",
                "impact": "Kẻ tấn công có thể chèn trực tiếp mã JavaScript nội dòng hoặc hàm eval() để vượt qua cơ chế bảo vệ của CSP.",
                "evidence": f"CSP Directive: {csp[:120]}...",
                "remediation": {
                    "explanation": "Loại bỏ 'unsafe-inline' và sử dụng cơ chế Nonce (tạo ngẫu nhiên theo từng request) hoặc Hash.",
                    "bad_code": "Content-Security-Policy: script-src 'self' 'unsafe-inline';",
                    "good_code": "Content-Security-Policy: script-src 'self' 'nonce-rAnd0m123';",
                },
                "cwe": "CWE-693"
            })

    # B3: X-Frame-Options (Clickjacking)
    frame_ancestors_present = "frame-ancestors" in csp
    if not x_frame and not frame_ancestors_present:
        findings.append({
            "id": "B3",
            "title": "Thiếu Bảo Vệ Chống Tấn Công Giao Diện Clickjacking",
            "category": "Tiêu đề An ninh",
            "severity": "CRITICAL",
            "target": "HTTP Headers",
            "impact": "Kẻ xấu có thể nhúng website vào trong một iframe trong suốt trên trang lừa đảo để dụ người dùng bấm chuyển tiền hoặc xóa tài khoản.",
            "evidence": "Không tìm thấy tiêu đề 'X-Frame-Options' cũng như chỉ thị CSP 'frame-ancestors'.",
            "remediation": {
                "explanation": "Cấu hình X-Frame-Options: DENY hoặc SAMEORIGIN, hoặc CSP frame-ancestors 'self'.",
                "bad_code": "// Không chặn nhúng iframe",
                "good_code": "X-Frame-Options: SAMEORIGIN\nContent-Security-Policy: frame-ancestors 'self';",
            },
            "cwe": "CWE-1021 / OWASP A05:2021"
        })

    # B4: Strict-Transport-Security (HSTS)
    if base_url.startswith("https://") and not hsts:
        findings.append({
            "id": "B4",
            "title": "Thiếu Tiêu Đề Strict-Transport-Security (HSTS)",
            "category": "Tiêu đề An ninh",
            "severity": "HIGH",
            "target": "HTTP Headers",
            "impact": "Trình duyệt không bắt buộc kết nối HTTPS, cho phép kẻ tấn công mạng nội bộ hạ cấp kết nối xuống HTTP không bảo mật (SSL Strip).",
            "evidence": "Header 'Strict-Transport-Security' không được thiết lập.",
            "remediation": {
                "explanation": "Kích hoạt HSTS với max-age tối thiểu 1 năm (31536000 giây) kèm includeSubDomains.",
                "bad_code": "// Thiếu HSTS",
                "good_code": "Strict-Transport-Security: max-age=31536000; includeSubDomains; preload",
            },
            "cwe": "CWE-319 / OWASP A05:2021"
        })

    # B5: X-Content-Type-Options: nosniff
    if x_content_type != "nosniff":
        findings.append({
            "id": "B5",
            "title": "Thiếu Tiêu Đề X-Content-Type-Options: nosniff",
            "category": "Tiêu đề An ninh",
            "severity": "MEDIUM",
            "target": "HTTP Headers",
            "impact": "Trình duyệt có thể tự động suy đoán MIME type, biến tệp upload ảnh chứa mã độc thành file script thực thi.",
            "evidence": f"X-Content-Type-Options: '{headers.get('x-content-type-options', 'không có')}'",
            "remediation": {
                "explanation": "Thêm tiêu đề X-Content-Type-Options với giá trị 'nosniff'.",
                "bad_code": "// Thiếu header",
                "good_code": "X-Content-Type-Options: nosniff",
            },
            "cwe": "CWE-79"
        })

    return findings
