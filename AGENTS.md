# 🤖 AGENTS.md — Quy ước & Chỉ dẫn dành cho AI Agents

> Tài liệu hướng dẫn bắt buộc dành cho mọi AI Agent (Claude, Gemini, Antigravity,...) khi đọc, phát triển, hoặc bảo trì mã nguồn trong dự án **OguriScan** (`webscan.oguri-lab.io.vn`).

---

## 1. Tổng quan Dự án

**OguriScan** là công cụ đánh giá an ninh mạng website (DAST - Dynamic Application Security Testing) gọn nhẹ, chạy trực tiếp trên trình duyệt, không cần cài đặt.
- **Mục đích**: Hỗ trợ developer tự quét, phát hiện và nhận hướng dẫn vá các lỗ hổng **thực sự nguy hiểm và có thể bị khai thác** (exploitable vulnerabilities) trên các website của mình trước khi bị tấn công.
- **Môi trường hoạt động**:
  - **Giai đoạn 1 (Hiện tại)**: Local-first (FastAPI backend + Vite/React frontend + SQLite / LocalStorage).
  - **Giai đoạn 2**: Deploy Serverless AWS (`ap-southeast-1` Singapore) với Terraform, API Gateway, S3, CloudFront, Lambda ZIP.

---

## 2. Cấu trúc Thư mục Dự án Chuẩn

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
│   │   ├── config.py
│   │   └── circuit_breaker.py    # Tự động hủy nếu target lỗi hoặc quá tải
│   ├── local_server.py           # FastAPI local server
│   └── lambda_handler.py         # AWS Lambda entrypoint cho deploy sau này
├── frontend/                     # Giao diện người dùng (Vite + React + TS)
│   ├── src/
│   │   ├── components/           # UI components tuân thủ shadcn & Vercel patterns
│   │   │   ├── ui/               # shadcn base components
│   │   │   ├── scan-form.tsx     # Form nhập URL & cấu hình quét
│   │   │   ├── scan-progress.tsx # Hiển thị tiến độ real-time & nút hủy khẩn cấp
│   │   │   ├── score-overview.tsx# Thẻ điểm an ninh (Grade A-F & phân loại)
│   │   │   ├── finding-card.tsx  # Chi tiết từng lỗ hổng kèm code mẫu sửa
│   │   │   └── report-actions.tsx# Nút xuất JSON, in PDF, sao chép link chia sẻ
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

## 3. Quy chuẩn Sử dụng Skills Đã Cài Đặt

Khi phát triển giao diện hoặc viết mã, Agent **BẮT BUỘC** tham chiếu và áp dụng các skills tại `.agents/skills/`:

### A. Skill `shadcn` (`.agents/skills/shadcn/`)
- Mọi component giao diện phải xây dựng trên nền tảng **shadcn/ui** (kết hợp Radix UI và Tailwind CSS).
- Không tự viết lại các component phức tạp (như Accordion, Dialog, Dropdown, Tabs, Toast) mà phải sử dụng chuẩn của shadcn.
- Giữ phong cách Dark Mode hiện đại: Tone nền xám đen (`#0a0a0a`), viền tinh tế (`border-neutral-800`), font chữ tương phản tốt.

### B. Skill `vercel-composition-patterns` (`.agents/skills/vercel-composition-patterns/`)
- **Tránh bùng nổ boolean props**: Không thiết kế component với hàng chục prop `isError`, `isLoading`, `showDetails`, `isCritical`,...
- **Sử dụng Compound Components**: Tách nhỏ các phần hiển thị (ví dụ: `FindingCard.Header`, `FindingCard.Evidence`, `FindingCard.Remediation`).
- **Ưu tiên `children` hơn `render props`**: Giúp code dễ mở rộng và kiểm thử.
- **Tuân thủ chuẩn React 19**: Không dùng `forwardRef` cũ nếu không cần thiết; tối ưu re-render khi hiển thị danh sách lỗ hổng lớn.

### C. Skill `web-design-guidelines` (`.agents/skills/web-design-guidelines/`)
- Kiểm tra tính dễ tiếp cận (Accessibility - a11y): Màu badge mức độ nguy hiểm (Critical, High, Medium) phải đảm bảo độ tương phản (contrast ratio >= 4.5:1).
- Trạng thái bàn phím (Keyboard navigation): Người dùng có thể nhấn `Tab` duyệt qua các lỗi, nhấn `Enter/Space` mở rộng chi tiết.

### D. Skill `developer-workflow` (`.agents/skills/developer-workflow/`)
- **Bắt buộc viết Unit Test**: Mọi hàm quét bảo mật, giải thuật tính điểm, giới hạn crawler và circuit breaker đều phải có Unit Test (`pytest` cho Python, `vitest` cho React). Code chưa có Unit Test coi như chưa hoàn thành.
- **Quy chuẩn Git Commit Message**: Mọi commit và push bắt buộc phải tuân theo format:
  ```
  <type>(<ngắn gọn làm gì bằng 1 cụm từ>): <nội dung>
  ```
  - Ví dụ chuẩn: `docs(init-project): brainstorming and setup codebase`
  - Ví dụ test: `test(crawler): add boundary tests for max depth limit`
  - Ví dụ tính năng: `feat(cookie-scanner): add httponly and secure check logic`
  - Ví dụ sửa lỗi: `fix(circuit-breaker): resolve false trigger on 404 response`
  - Các type hợp lệ: `feat`, `fix`, `test`, `refactor`, `docs`, `chore`, `perf`. Scope viết thường nối bằng dấu gạch ngang (kebab-case).

---

## 4. Nguyên tắc Cốt lõi của Engine Quét Bảo mật (Security Rules)

1. **Chỉ kiểm tra lỗ hổng có thể khai thác thực tế (Exploitable Only)**:
   - Loại bỏ các bài test mang tính lý thuyết, không trực tiếp dẫn đến nguy cơ xâm nhập hoặc đánh cắp dữ liệu.
   - Tập trung vào: Rò rỉ cookie nhạy cảm, Clickjacking, Lộ khóa bí mật (API Key / JWT), CORS Reflection with Credentials, Reflected XSS, SQL Injection (Error & Time-based), Open Redirect, Path Traversal.
   - **Tuyệt đối không đưa SSRF vào scope** (đã loại bỏ do phức tạp và tốn tài nguyên hạ tầng).
2. **Quy tắc an toàn chống treo và chống loop vô tận (Safety Limits)**:
   - `Crawl Depth = 1`: Chỉ lấy liên kết nội bộ trực tiếp từ trang chủ, tối đa 10 URL.
   - `Max Params per URL = 3`: Giới hạn tối đa 3 tham số trên mỗi endpoint.
   - `Timeout mỗi Request = 5.0 giây`: Sau 5s nếu không phản hồi thì đánh dấu timeout và chuyển sang test khác.
   - `Hard Timeout toàn bộ Scan = 60.0 giây`: Đảm bảo không bao giờ bị nghẽn Lambda hoặc đơ local process.
   - `Circuit Breaker`: Nếu server mục tiêu trả về liên tiếp 5 mã lỗi `429 Too Many Requests` hoặc `503 Service Unavailable`, lập tức ngắt toàn bộ injection test để tránh làm quá tải hệ thống.
3. **Tính Động & Độc lập Techstack (Dynamic & Agnostic)**:
   - Không giả định trước mục tiêu viết bằng framework nào (Next.js, Laravel, Django, Spring,...).
   - Sử dụng generic polyglots và chữ ký lỗi đa cơ sở dữ liệu (MySQL, PostgreSQL, SQLite, MSSQL, Oracle).

---

## 5. Quy trình Làm việc của Agent (Workflow Rules)
- **Trao đổi bằng Tiếng Việt 100%**: Mọi tài liệu kỹ thuật, bình luận commit và giải thích cho người dùng đều viết bằng Tiếng Việt rõ ràng, mạch lạc.
- **Kiểm tra trước khi sửa**: Luôn đọc file kỹ trước khi sửa; không tự ý xóa bỏ các phần quan trọng nếu chưa có sự thống nhất.
- **Xác nhận qua Plan**: Trước khi sinh code thực thi, cập nhật và đồng bộ đầy đủ các tài liệu `PROJECT.md`, `DEPLOY.md`, `BRAINSTORMING.md`.
