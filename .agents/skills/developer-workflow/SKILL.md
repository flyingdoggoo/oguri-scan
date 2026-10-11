---
name: developer-workflow
description: Quy chuẩn phát triển phần mềm bắt buộc cho dự án OguriScan — bao gồm định dạng Git Commit message chuẩn và nguyên tắc viết Unit Test trước khi commit/push.
---

# 🛠️ Skill: Developer Workflow & Quality Standards

Tài liệu này định nghĩa các quy tắc phát triển bắt buộc dành cho lập trình viên và AI Agent khi làm việc trong mã nguồn của **OguriScan**.

---

## 1. Quy Chuẩn Định Dạng Git Commit Message

Mọi commit bắt buộc phải tuân theo cấu trúc nghiêm ngặt sau:

```
<type>(<cụm-từ-ngắn-gọn-phạm-vi>): <nội dung mô tả ngắn gọn công việc>
```

> **Quy tắc**:
> - Không viết hoa chữ cái đầu của `type` và `cụm-từ`.
> - Dấu hai chấm `:` và khoảng trắng ngay sau dấu đóng ngoặc đơn `)`.
> - Nội dung mô tả súc tích, phản ánh chính xác thay đổi.

### A. Danh mục các `<type>` hợp lệ:
| `type` | Ý nghĩa sử dụng | Ví dụ thực tế |
|---|---|---|
| `feat` | Thêm tính năng hoặc bài kiểm tra bảo mật mới | `feat(cookie-scanner): add httponly and secure check logic` |
| `fix` | Sửa lỗi logic, false positive, hoặc xử lý ngoại lệ | `fix(circuit-breaker): resolve false trigger on 404 response` |
| `test` | Thêm hoặc sửa đổi mã kiểm thử tự động (Unit Test) | `test(crawler): add boundary unit tests for max depth limit` |
| `refactor`| Tái cấu trúc mã nguồn không thay đổi hành vi bên ngoài | `refactor(finding-card): split header and evidence compound components` |
| `docs` | Thêm mới hoặc cập nhật tài liệu kỹ thuật | `docs(init-project): brainstorming and setup codebase` |
| `chore` | Cập nhật cấu hình build, dependencies, tooling | `chore(deps): update playwright and pytest versions` |
| `perf` | Tối ưu hóa hiệu năng, giảm thời gian thực thi scan | `perf(dns-scanner): run aiohttp dns queries in parallel` |

### B. Quy tắc đặt `<cụm-từ-ngắn-gọn-phạm-vi>`:
- Sử dụng chữ thường, ngăn cách bằng dấu gạch ngang (kebab-case).
- Độ dài: từ 1 đến 3 từ thể hiện đúng component hoặc module đang thao tác.
- Ví dụ: `(init-project)`, `(cookie-scanner)`, `(xss-injection)`, `(finding-card)`, `(api-gateway)`, `(circuit-breaker)`.

---

## 2. Quy Chuẩn Viết Unit Test (Bắt Buộc)

> **Nguyên tắc vàng**: *"Code không có Unit Test được coi là code chưa hoàn thành."*

### A. Phạm vi Bắt buộc phải có Unit Test:
1. **Lõi Engine Quét (Scanner Modules)**:
   - Mọi hàm kiểm tra (Headers, Cookies, CORS, Injection, JS Secrets) phải có test case bao quát cả 2 trường hợp:
     - Trường hợp phát hiện lỗ hổng (Vulnerable response ➔ trả về finding đúng severity).
     - Trường hợp an toàn (Patched / Sanitized response ➔ không sinh finding giả).
2. **Cơ chế An toàn (Safety Guard & Circuit Breaker)**:
   - Test giới hạn crawl depth không bao giờ vượt quá 1.
   - Test giới hạn số URL không vượt quá 10.
   - Test cơ chế kích hoạt Circuit Breaker khi gặp liên tiếp 5 mã lỗi 429/503.
   - Test cơ chế timeout (mock delay > 5s ➔ hàm tự drop không treo).
3. **Thuật toán Chấm điểm (Scoring Algorithm)**:
   - Test tính toán điểm (0-100) và xếp hạng (A, B, C, D, F) từ danh sách findings.

### B. Công nghệ Kiểm thử Chuẩn:
- **Backend (Python)**: Sử dụng `pytest` + `pytest-asyncio` + `unittest.mock` (hoặc `responses`/`httpx-mock` để giả lập response HTTP mà không gửi request ra ngoài Internet khi chạy test).
- **Frontend (React)**: Sử dụng `vitest` + `@testing-library/react`.

### C. Ví dụ Cấu trúc Unit Test Python Mẫu (`tests/test_cookie_scanner.py`):
```python
import pytest
from scanner.group_cookies_headers import check_cookie_security

def test_cookie_missing_httponly_and_secure():
    # Giả lập response header thiếu cờ bảo vệ
    mock_headers = {
        "Set-Cookie": "session_id=abc12345; Path=/"
    }
    findings = check_cookie_security("https://example.com", mock_headers)
    
    assert len(findings) == 2
    severities = [f["severity"] for f in findings]
    assert "CRITICAL" in severities  # Thiếu HttpOnly
    assert "CRITICAL" in severities  # Thiếu Secure

def test_cookie_fully_secured():
    # Giả lập response header đã cấu hình chuẩn
    mock_headers = {
        "Set-Cookie": "session_id=abc12345; Path=/; Secure; HttpOnly; SameSite=Strict"
    }
    findings = check_cookie_security("https://example.com", mock_headers)
    assert len(findings) == 0
```

---

## 3. Quy Trình Kiểm Tra Trước Khi Commit & Push (Pre-Commit Checklist)

Trước khi thực hiện lệnh `git commit` và `git push`, lập trình viên hoặc AI Agent **PHẢI** tự kiểm tra:
1. [ ] Đã chạy toàn bộ unit test và tất cả đều **PASSED**:
   - Backend: `pytest tests/`
   - Frontend: `npm run test` (hoặc `npm run build` không có lỗi TypeScript).
2. [ ] Thông điệp commit tuân thủ đúng format `(type)(scope): message`.
3. [ ] Không commit các tệp rác, file `.env`, tệp tạm hoặc build output vào git.
