# 🛡️ OguriScan — Web Security Scanner (DAST)

> **Công cụ đánh giá an ninh mạng website gọn nhẹ, chạy trực tiếp trên trình duyệt, không cần cài đặt.**  
> Hỗ trợ nhà phát triển tự quét, phát hiện và nhận hướng dẫn vá các lỗ hổng **thực sự nguy hiểm và có thể bị khai thác** (exploitable vulnerabilities) trên các website của mình trước khi bị tấn công.

---

## 🌐 Thông Tin Dự Án

- **Tên miền dịch vụ**: `webscan.oguri-lab.io.vn`
- **Môi trường hoạt động**:
  - **Giai đoạn 1**: Local-first (FastAPI backend + Vite/React frontend + SQLite / LocalStorage).
  - **Giai đoạn 2**: Deploy Serverless AWS (`ap-southeast-1` Singapore) với Terraform, API Gateway, S3, CloudFront, Lambda ZIP.

---

## 📚 Hệ Thống Tài Liệu Kỹ Thuật (Documentation)

Dự án được tài liệu hóa chi tiết và đồng bộ hoàn toàn tại thư mục gốc:

| Tài liệu | Nội dung chi tiết |
|---|---|
| [📖 `PROJECT.md`](./PROJECT.md) | **Bản đặc tả kỹ thuật**: Danh mục 28 bài test thực chiến, quy tắc crawl & safety limit, cơ chế Circuit Breaker, dynamic techstack, UX Finding Card. |
| [🚀 `DEPLOY.md`](./DEPLOY.md) | **Hướng dẫn hạ tầng AWS**: Sơ đồ kiến trúc Serverless, dự toán chi phí Singapore, thiết lập domain, và 3 cơ chế tắt khẩn cấp (Kill Switch). |
| [🧠 `BRAINSTORMING.md`](./BRAINSTORMING.md) | **Nghiên cứu thị trường**: Phân tích đối thủ (Observatory, ZAP, Detectify), khoảng trống thị trường (Market Gap) và lộ trình mở rộng sau này. |
| [🤖 `AGENTS.md`](./AGENTS.md) | **Quy ước dành cho AI Agents**: Hướng dẫn áp dụng các skills UI/UX (`shadcn`, `vercel-composition-patterns`, `web-design-guidelines`) và nguyên tắc code. |

---

## 🎯 Tổng Hợp 28 Bài Kiểm Tra Trọng Tâm

Hệ thống loại bỏ hoàn toàn các bài kiểm tra hình thức / lý thuyết thừa và **chỉ tập trung vào 28 bài kiểm tra có thể khai thác thực tế**:

1. **Nhóm A: Bảo vệ Cookie & Phiên làm việc (5 bài)**:
   - Thiếu `HttpOnly` (XSS trộm session)
   - Thiếu `Secure` (MITM trộm session trên WiFi công cộng)
   - Thiếu `SameSite` (CSRF)
   - Phạm vi `Domain` quá rộng (Rò rỉ sang subdomain)
   - Cookie cấp trước khi chuyển hướng HTTPS
2. **Nhóm B: Tiêu đề Chống Tấn công (5 bài)**:
   - Thiếu `Content-Security-Policy` (CSP)
   - CSP chứa `unsafe-inline` / `unsafe-eval`
   - Thiếu `X-Frame-Options` / `frame-ancestors` (Clickjacking)
   - Thiếu `Strict-Transport-Security` (HSTS)
   - Thiếu `X-Content-Type-Options: nosniff` (MIME Sniffing)
3. **Nhóm C: Mã hóa & Tên miền Phụ (4 bài)**:
   - Chứng chỉ SSL/TLS hết hạn / sắp hết hạn
   - Giao thức cũ TLS 1.0 / 1.1 (POODLE, BEAST)
   - Bộ mã hóa yếu (Weak Ciphers: RC4, 3DES, CBC)
   - Nguy cơ Cướp Tên miền con (Subdomain Takeover qua CNAME mồ côi)
4. **Nhóm D: Lỗ hổng CORS & Rò rỉ Thông tin (5 bài)**:
   - CORS phản chiếu Origin tùy ý kèm Credentials (`ACAC: true`)
   - Chấp nhận Origin `null`
   - CORS Wildcard `*` trên endpoint nhạy cảm
   - Bật duyệt thư mục (Directory Listing lộ mã nguồn/backup)
   - Lộ thông tin ngăn xếp lỗi (Stack Trace trong mã lỗi 404/500)
5. **Nhóm E: Tấn công Tiêm Mã độc Thực tế (5 bài)**:
   - Reflected XSS (Thẻ script unencoded)
   - Reflected XSS (Thoát khỏi thuộc tính HTML)
   - SQL Injection (Error-based: MySQL, PostgreSQL, SQLite, MSSQL, Oracle)
   - Chuyển hướng Mở (Open Redirect lừa đảo)
   - Đọc tệp máy chủ (Path Traversal / LFI)
6. **Nhóm F: Rò rỉ Khóa Bí mật trong JavaScript (4 bài)**:
   - Khóa AWS Access Key (`AKIA...`)
   - JWT Token chứa Secret
   - Khóa bí mật Private Key
   - Khóa API thanh toán (Stripe Live Key, Google API Key)

---

## ⚡ Quy Tắc Crawl An Toàn (Safety Guard)

- **Crawl Depth**: `= 1` (Chỉ quét trang chủ và link nội bộ trực tiếp, tối đa 10 URL).
- **Max Params / URL**: Tối đa 3 params quan trọng nhất.
- **Request Timeout**: `5.0 giây` / request.
- **Hard Global Timeout**: `60.0 giây` cho toàn bộ quá trình scan.
- **Circuit Breaker**: Tự động ngắt toàn bộ injection test nếu server trả về liên tiếp 5 lỗi `429` hoặc `503`.

---

## 🏗️ Cấu Trúc Thư Mục Dự Án

```
webscan/
├── .agents/
│   └── skills/                   # Skills đã được cài đặt cho Agent
│       ├── shadcn/               # Thư viện UI shadcn/ui & Radix
│       ├── vercel-composition-patterns/ # Chuẩn composition patterns của Vercel
│       ├── web-design-guidelines/       # Quy chuẩn thiết kế UX, Accessibility
│       └── developer-workflow/          # Quy chuẩn Unit Test & Git Commit message format
├── backend/                      # Python backend (Engine quét & API)
│   ├── scanner/                  # Lõi thực thi các bài kiểm tra bảo mật
│   │   ├── crawler.py            # Thu thập URL/param có kiểm soát (Safety limits)
│   │   ├── group_cookies_headers.py # Quét Cookies & Security Headers
│   │   ├── group_tls_dns.py      # Quét TLS/SSL & Subdomain Takeover
│   │   ├── group_cors.py         # Quét cấu hình sai CORS
│   │   ├── group_injection.py    # Quét XSS, SQLi, Open Redirect, Path Traversal
│   │   └── group_js_secrets.py   # Quét rò rỉ khóa bí mật trong file JS
│   ├── core/                     # Cấu hình, timeouts, circuit breaker
│   ├── local_server.py           # FastAPI local server
│   └── lambda_handler.py         # AWS Lambda entrypoint cho deploy sau này
├── frontend/                     # Giao diện người dùng (Vite + React + TS)
│   ├── src/
│   │   ├── components/           # UI components tuân thủ shadcn & Vercel patterns
│   │   ├── lib/                  # Utilities, storage, API client
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
├── infra/                        # Hạ tầng đám mây (Terraform)
│   ├── main.tf
│   ├── lambda.tf
│   └── variables.tf
├── .gitignore
├── AGENTS.md                     # Tài liệu quy ước cho AI Agents
├── BRAINSTORMING.md              # Phân tích đối thủ & định hướng thị trường
├── DEPLOY.md                     # Hướng dẫn hạ tầng, chi phí & cơ chế dừng khẩn cấp
├── PROJECT.md                    # Bản đặc tả kỹ thuật chi tiết các bài kiểm tra
└── README.md
```

---

## 🚀 Hướng Dẫn Phát Triển Ở Môi Trường Local (Bản Thử Nghiệm)

### 1. Khởi chạy Backend (FastAPI Local)
```bash
cd backend
python -m venv .venv
source .venv/Scripts/activate  # Trên Windows: .venv\Scripts\activate
pip install -r requirements.txt
python local_server.py
# Server chạy tại http://localhost:8000
```

### 2. Khởi chạy Frontend (Vite + React)
```bash
cd frontend
npm install
npm run dev
# Giao diện chạy tại http://localhost:5173 (có proxy tự động sang :8000)
```

### 3. Chạy Toàn Bộ Bộ Kiểm Thử (Unit Tests)
Dự án áp dụng quy chuẩn kiểm thử nghiêm ngặt trước khi commit:
- **Backend Tests (pytest)**:
  ```bash
  python -m pytest backend/tests/ -v
  # 11/11 tests passed (Circuit Breaker, Cookies, Headers, CORS, Injection, Secrets, Scoring)
  ```
- **Frontend Tests (vitest)**:
  ```bash
  cd frontend
  npm run test
  # 12/12 tests passed (LocalStorage History, Tailwind Utility, API Client)
  ```
- **Build Frontend**:
  ```bash
  npm run build
  # Biên dịch TypeScript & Vite sang dist/ không có lỗi
  ```
