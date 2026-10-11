import ssl
import socket
import datetime
import urllib.parse
from typing import List, Dict, Any
import httpx
import dns.resolver

# Chữ ký nhận diện Subdomain Takeover từ các nhà cung cấp phổ biến
TAKEOVER_FINGERPRINTS = {
    "github.io": "There isn't a GitHub Pages site here",
    "s3.amazonaws.com": "NoSuchBucket",
    "herokuapp.com": "Heroku | No such app",
    "azurewebsites.net": "404 Web Site not found",
    "ghost.io": "The thing you were looking for is no longer here",
    "surge.sh": "project not found",
    "bitbucket.io": "Repository not found",
}

async def scan_tls_and_dns(base_url: str, client: httpx.AsyncClient) -> List[Dict[str, Any]]:
    """
    Kiểm tra Nhóm C: Mã hóa & Tên miền Phụ (4 bài kiểm tra thực chiến).
    Bao gồm thời hạn chứng chỉ SSL, giao thức cũ, bộ mã hóa yếu, và Subdomain Takeover.
    """
    findings: List[Dict[str, Any]] = []
    parsed = urllib.parse.urlparse(base_url)
    hostname = parsed.hostname
    port = parsed.port or (443 if parsed.scheme == "https" else 80)

    if not hostname:
        return findings

    # -------------------------------------------------------------
    # C1, C2, C3: KIỂM TRA CHỨNG CHỈ VÀ GIAO THỨC TLS
    # -------------------------------------------------------------
    if parsed.scheme == "https":
        try:
            context = ssl.create_default_context()
            with socket.create_connection((hostname, port), timeout=4.0) as sock:
                with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                    cert = ssock.getpeercert()
                    cipher_info = ssock.cipher()  # (name, version, bits)
                    tls_version = ssock.version()

                    # C1: Kiểm tra ngày hết hạn
                    if cert and "notAfter" in cert:
                        # Format: 'May 15 12:00:00 2026 GMT'
                        not_after_str = cert["notAfter"]
                        not_after_dt = datetime.datetime.strptime(not_after_str, "%b %d %H:%M:%S %Y %Z")
                        days_left = (not_after_dt - datetime.datetime.utcnow()).days

                        if days_left < 0:
                            findings.append({
                                "id": "C1",
                                "title": "Chứng Chỉ SSL/TLS Đã Hết Hạn",
                                "category": "Mã hóa & Tên miền phụ",
                                "severity": "CRITICAL",
                                "target": f"{hostname}:{port}",
                                "impact": "Trình duyệt của khách truy cập sẽ hiển thị cảnh báo đỏ nguy hiểm; website bị ngắt kết nối.",
                                "evidence": f"Ngày hết hạn: {not_after_str} (Đã quá hạn {abs(days_left)} ngày)",
                                "remediation": {
                                    "explanation": "Gia hạn chứng chỉ SSL/TLS ngay lập tức qua Let's Encrypt hoặc nhà cung cấp CA.",
                                    "bad_code": f"Cert hết hạn lúc {not_after_str}",
                                    "good_code": "certbot renew --quiet",
                                },
                                "cwe": "CWE-298"
                            })
                        elif days_left < 30:
                            findings.append({
                                "id": "C1",
                                "title": "Chứng Chỉ SSL/TLS Sắp Hết Hạn Dưới 30 Ngày",
                                "category": "Mã hóa & Tên miền phụ",
                                "severity": "HIGH",
                                "target": f"{hostname}:{port}",
                                "impact": "Website sắp bị ngừng hoạt động nếu không kịp gia hạn trong vòng ít ngày tới.",
                                "evidence": f"Ngày hết hạn: {not_after_str} (Còn lại {days_left} ngày)",
                                "remediation": {
                                    "explanation": "Cấu hình tự động gia hạn chứng chỉ (auto-renewal cronjob).",
                                    "bad_code": f"Còn {days_left} ngày",
                                    "good_code": "certbot renew --dry-run",
                                },
                                "cwe": "CWE-298"
                            })

                    # C2: Kiểm tra giao thức cũ (TLS 1.0 / 1.1)
                    if tls_version in ("TLSv1", "TLSv1.1"):
                        findings.append({
                            "id": "C2",
                            "title": "Hỗ Trợ Giao Thức Lỗi Thời TLS 1.0 / 1.1",
                            "category": "Mã hóa & Tên miền phụ",
                            "severity": "HIGH",
                            "target": f"{hostname}:{port}",
                            "impact": "Giao thức TLS cũ có các lỗ hổng mật mã nghiêm trọng (POODLE, BEAST) cho phép giải mã luồng dữ liệu.",
                            "evidence": f"Giao thức đang dùng: {tls_version}",
                            "remediation": {
                                "explanation": "Chỉ bật TLS 1.2 và TLS 1.3 trên cấu hình máy chủ Web (Nginx / Apache / CloudFront).",
                                "bad_code": "ssl_protocols TLSv1 TLSv1.1 TLSv1.2;",
                                "good_code": "ssl_protocols TLSv1.2 TLSv1.3;",
                            },
                            "cwe": "CWE-326"
                        })

                    # C3: Kiểm tra bộ mã hóa yếu (Weak Ciphers)
                    if cipher_info:
                        cipher_name, _, cipher_bits = cipher_info
                        cipher_upper = cipher_name.upper()
                        if any(w in cipher_upper for w in ("RC4", "3DES", "DES", "NULL", "EXPORT")) or (cipher_bits and cipher_bits < 128):
                            findings.append({
                                "id": "C3",
                                "title": "Sử Dụng Bộ Mã Hóa SSL/TLS Yếu (Weak Cipher)",
                                "category": "Mã hóa & Tên miền phụ",
                                "severity": "HIGH",
                                "target": f"Cipher: {cipher_name} ({cipher_bits} bits)",
                                "impact": "Bộ mã hóa có độ dài khóa ngắn hoặc thuật toán đã bị phá vỡ, dễ bị tin tặc giải mã gói tin.",
                                "evidence": f"Cipher đang kích hoạt: {cipher_name}",
                                "remediation": {
                                    "explanation": "Chỉ dùng các bộ mã hóa an toàn (ECDHE-ECDSA-AES128-GCM-SHA256, ECDHE-RSA-AES256-GCM-SHA384).",
                                    "bad_code": "ssl_ciphers HIGH:MEDIUM:!aNULL:!kEDH;",
                                    "good_code": "ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;",
                                },
                                "cwe": "CWE-327"
                            })
        except Exception:
            # Lỗi kết nối TLS hoặc timeout
            pass

    # -------------------------------------------------------------
    # C4: DÒ TÌM SUBDOMAIN TAKEOVER QUA BẢN GHI CNAME
    # -------------------------------------------------------------
    try:
        resolver = dns.resolver.Resolver()
        resolver.timeout = 2.0
        resolver.lifetime = 2.0
        cname_answers = resolver.resolve(hostname, "CNAME")

        for rdata in cname_answers:
            cname_target = str(rdata.target).rstrip(".")
            # So khớp CNAME với các fingerprint dịch vụ bên thứ ba
            for provider_domain, fingerprint_keyword in TAKEOVER_FINGERPRINTS.items():
                if provider_domain in cname_target.lower():
                    # Thử gửi request đến domain để kiểm tra xem dịch vụ có bị bỏ hoang (unclaimed) không
                    try:
                        probe_res = await client.get(base_url, timeout=3.0, follow_redirects=True)
                        if fingerprint_keyword.lower() in probe_res.text.lower():
                            findings.append({
                                "id": "C4",
                                "title": "Nguy Cơ Chiếm Đoạt Tên Miền Con (Subdomain Takeover)",
                                "category": "Mã hóa & Tên miền phụ",
                                "severity": "CRITICAL",
                                "target": f"{hostname} ➔ {cname_target}",
                                "impact": "Bản ghi CNAME trỏ về dịch vụ bên thứ ba đã bị xóa. Hacker có thể đăng ký dịch vụ đó và chiếm quyền kiểm soát toàn bộ website, trộm cookie và phishing.",
                                "evidence": f"CNAME trỏ về '{cname_target}' và phản hồi chứa dấu hiệu bỏ hoang: '{fingerprint_keyword}'",
                                "remediation": {
                                    "explanation": "Xóa ngay bản ghi CNAME mồ côi khỏi cấu hình DNS hoặc đăng ký lại tài nguyên tương ứng trên dịch vụ.",
                                    "bad_code": f"{hostname} IN CNAME {cname_target}",
                                    "good_code": "// Xóa bản ghi CNAME hoặc trỏ về IP máy chủ sở hữu",
                                },
                                "cwe": "CWE-284 / OWASP A05:2021"
                            })
                    except Exception:
                        pass
    except Exception:
        # Không có bản ghi CNAME hoặc lỗi DNS
        pass

    return findings
