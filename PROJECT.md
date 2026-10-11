# 📋 PROJECT.md — OguriScan

> **OguriScan** — Web Security Scanner  
> **Status:** Planning → Local Development  
> **Domain:** `webscan.oguri-lab.io.vn`  
> **Stack:** Vite + React · Python 3.12 · Terraform · AWS ap-southeast-1

---

## 🎯 Project Goal

Một tool DAST (Dynamic Application Security Testing) chạy trên trình duyệt, không cần cài đặt. User paste URL → nhận full security report trong ~60 giây. Dùng để scan chính sản phẩm của mình trước khi bị attacker tìm ra lỗ hổng.

---

## ✅ Security Checks — Danh sách đầy đủ

### 🟢 Group A: Cookie & Session Security (6 checks)
*Lambda A · 512MB · 30s*

| ID | Check Name | Mô tả | Severity |
|---|---|---|---|
| A1 | Cookie `Secure` flag | Cookie set qua HTTPS nhưng thiếu flag Secure → có thể gửi qua HTTP | HIGH |
| A2 | Cookie `HttpOnly` flag | Cookie accessible từ JavaScript → XSS có thể đánh cắp | HIGH |
| A3 | Cookie `SameSite` flag | Không có SameSite → dễ bị CSRF tấn công | MEDIUM |
| A4 | Cookie domain scope | `Domain=.example.com` quá rộng → cookie leak sang subdomain | MEDIUM |
| A5 | Session cookie lifetime | Session cookie không có expiry → browser session tồn tại mãi | LOW |
| A6 | Cookie over HTTP | Cookie được set trước HTTPS redirect | HIGH |

### 🟢 Group A: Security Headers (9 checks)
*Lambda A · cùng request*

| ID | Check Name | Mô tả | Severity |
|---|---|---|---|
| A7 | Content-Security-Policy | Missing CSP → XSS không bị chặn ở browser level | HIGH |
| A8 | CSP `unsafe-inline` / `unsafe-eval` | CSP có nhưng weakened → inline JS vẫn chạy được | HIGH |
| A9 | Strict-Transport-Security (HSTS) | HTTP có thể được downgrade → MITM | HIGH |
| A10 | HSTS max-age đủ lớn | max-age < 1 year (31536000) → không đủ bảo vệ | MEDIUM |
| A11 | X-Frame-Options / frame-ancestors | Missing → Clickjacking dễ dàng | HIGH |
| A12 | X-Content-Type-Options | Missing `nosniff` → MIME sniffing attack | MEDIUM |
| A13 | Referrer-Policy | Missing → URL nhạy cảm bị leak qua Referer header | MEDIUM |
| A14 | Server version disclosure | `Server: Apache/2.4.51` → attacker biết version để exploit CVE | MEDIUM |
| A15 | X-Powered-By disclosure | `X-Powered-By: PHP/7.4.3` → tech stack exposed | LOW |

### 🔵 Group B: TLS/SSL Analysis (6 checks)
*Lambda B · 512MB · 45s · sslyze*

| ID | Check Name | Mô tả | Severity |
|---|---|---|---|
| B1 | Certificate expiry | Cert expired hoặc sắp hết hạn (< 30 ngày) | CRITICAL / HIGH |
| B2 | Certificate chain | Chain không đầy đủ → browser warning | HIGH |
| B3 | TLS version | TLS 1.0 hoặc 1.1 enabled → deprecated, vulnerable | HIGH |
| B4 | Weak cipher suites | RC4, DES, 3DES, NULL → easily broken | HIGH |
| B5 | Mixed content (SSR) | HTTPS page load HTTP resource (img, script, css) | HIGH |
| B6 | HSTS preload status | Domain không có trong HSTS preload list | LOW |

### 🔵 Group B: DNS & Email Security (5 checks)
*Lambda B · DNS lookup với dnspython*

| ID | Check Name | Mô tả | Severity |
|---|---|---|---|
| B7 | SPF record | Không có SPF → attacker có thể spoof email từ domain | HIGH |
| B8 | DMARC record | Không có DMARC → email spoofing không bị block | HIGH |
| B9 | DMARC policy enforcement | `p=none` → DMARC chỉ monitor, không block | MEDIUM |
| B10 | Subdomain takeover | CNAME trỏ đến unclaimed service (GitHub Pages, S3, Heroku, v.v.) | CRITICAL |
| B11 | CAA record | Không giới hạn CA nào có thể issue cert → cert fraud | LOW |

### 🟡 Group C: CORS Misconfiguration (4 checks)
*Lambda C · 256MB · 20s*

| ID | Check Name | Mô tả | Severity |
|---|---|---|---|
| C1 | Arbitrary origin reflected | Server echo lại bất kỳ Origin nào → CORS bypass hoàn toàn | CRITICAL |
| C2 | `null` origin accepted | `Origin: null` được accept → iframe sandbox bypass | HIGH |
| C3 | Wildcard CORS `*` | OK nếu không có credential, nhưng thường bị misconfigure | MEDIUM |
| C4 | Subdomain CORS bypass | `Origin: evil.example.com` được accept | HIGH |

### 🟡 Group C: HTTP Methods & Info Disclosure (6 checks)
*Lambda C · cùng request*

| ID | Check Name | Mô tả | Severity |
|---|---|---|---|
| C5 | HTTP TRACE enabled | TRACE method → XST (Cross-Site Tracing) attack | MEDIUM |
| C6 | Dangerous HTTP methods | PUT/DELETE enabled → data manipulation | HIGH |
| C7 | Directory listing | `/images/` → Apache/Nginx file listing → info disclosure | HIGH |
| C8 | robots.txt sensitive paths | Disallow paths reveal admin/API structure | MEDIUM |
| C9 | Error page info leak | Stack trace, file paths trong 404/500 response | HIGH |
| C10 | Internal IP in response | `192.168.x.x`, `10.x.x.x` trong response body | MEDIUM |
| C11 | Cache-Control sensitive | Login/profile page thiếu `no-store` → browser cache leak | MEDIUM |

### 🔴 Group D: Active Injection Testing (8 checks)
*Lambda D · 256MB · 60s*

| ID | Check Name | Mô tả | Payload |
|---|---|---|---|
| D1 | Reflected XSS — script tag | Input reflected unencoded trong HTML | `<script>WSEC-MARKER</script>` |
| D2 | Reflected XSS — event handler | Bypass qua attribute context | `"><img src=x onerror=WSEC-MARKER>` |
| D3 | Reflected XSS — JS context | Break out of JS string | `';WSEC-MARKER//` |
| D4 | SQL Injection — error-based | DB error message trong response | `'` single quote |
| D5 | SQL Injection — time-based | Response delay > 3s | `' OR SLEEP(3)--` |
| D6 | Open Redirect | Server redirect đến evil.com | `?next=https://evil.com` |
| D7 | Path Traversal / LFI | Read arbitrary files | `../../../etc/passwd` |
| D8 | OS Command Injection | Execute shell command | `; echo WSEC-MARKER` |

**Severity:** D1-D3 = CRITICAL (XSS) · D4-D5 = CRITICAL (SQLi) · D6 = HIGH · D7 = CRITICAL · D8 = CRITICAL

### 🟠 Group E: JavaScript & Frontend Analysis (8 checks)
*Lambda E · 512MB · 60s · requests + BeautifulSoup*

| ID | Check Name | Mô tả | Library |
|---|---|---|---|
| E1 | AWS Access Key in JS | `AKIA[0-9A-Z]{16}` pattern trong JS files | regex |
| E2 | JWT Token in JS | `eyJ...` pattern hardcoded | regex |
| E3 | Private key in JS | `-----BEGIN RSA PRIVATE KEY-----` | regex |
| E4 | Stripe/Twilio/Google API key | Known API key patterns | regex |
| E5 | Hardcoded password | `password: "..."` trong source | regex |
| E6 | External script missing SRI | `<script src="cdn...">` không có `integrity` hash | BeautifulSoup |
| E7 | Mixed content (JS-fetched) | HTTP URLs trong JS source (hardcoded endpoint) | regex |
| E8 | API endpoint discovery | Tìm `/api/`, `/admin/`, `/debug/` patterns trong JS | regex |

### 🟣 Group SSRF: Server-Side Request Forgery (3 checks)
*Lambda D · callback-based*

| ID | Check Name | Mô tả | Severity |
|---|---|---|---|
| S1 | SSRF — Direct response | URL param → internal service response leaked | CRITICAL |
| S2 | SSRF — AWS Metadata | `169.254.169.254` accessible | CRITICAL |
| S3 | SSRF — Blind callback | Request received at our webhook endpoint | CRITICAL |

---

## 📊 Check Summary

```
Total: 56 checks
  Group A (Cookie + Headers): 15 checks
  Group B (TLS + DNS):         11 checks
  Group C (CORS + Methods):    11 checks
  Group D (Injection):          8 checks
  Group E (JS Analysis):        8 checks
  Group SSRF:                   3 checks

Severity breakdown:
  CRITICAL: 12 checks
  HIGH:     24 checks
  MEDIUM:   14 checks
  LOW:       6 checks
```

---

## 🎨 UI/UX Design System

### Design Tokens (Tailwind + shadcn/ui dark theme)

```css
/* Severity Colors */
--critical: #ef4444   /* red-500 */
--high:     #f97316   /* orange-500 */
--medium:   #eab308   /* yellow-500 */
--low:      #3b82f6   /* blue-500 */
--info:     #6b7280   /* gray-500 */
--pass:     #22c55e   /* green-500 */

/* Background */
--bg-base:    #0a0a0a   /* near black */
--bg-surface: #141414   /* card */
--bg-muted:   #1f1f1f   /* subtle */

/* Text */
--text-primary:   #fafafa
--text-secondary: #a1a1aa
--text-code:      #d4d4d8

/* Font */
body:    Inter, sans-serif
code:    JetBrains Mono, monospace
```

### Score Card — Trang chủ kết quả

```
┌─────────────────────────────────────────────────────────────┐
│  🔐 Security Score              example.com                 │
│                                                             │
│         ╭─────────────╮                                     │
│         │     C       │   ← Grade (A/B/C/D/F)              │
│         │   47 / 100  │                                     │
│         ╰─────────────╯                                     │
│                                                             │
│  ████████████████░░░░░░░░  47%  Overall                     │
│                                                             │
│  CRITICAL  ██░░░░░░░░░░  2    HIGH    ████░░░░  6           │
│  MEDIUM    ██████░░░░░░  5    LOW     ████████  4           │
│                                                             │
│  ✅ 39 passed   ⚠️ 17 failed   ⏭️ 0 skipped                  │
└─────────────────────────────────────────────────────────────┘
```

### Finding Card — Hiển thị 1 lỗi

```
┌─────────────────────────────────────────────────────────────┐
│  🔴 CRITICAL  ·  SQL Injection — Error-based          [D4] │
│                                                             │
│  📍 Location: GET /search?q=                               │
│  🎯 Parameter: q                                           │
│                                                             │
│  What happened:                                             │
│  Injecting a single quote (') into parameter "q" triggered │
│  a MySQL error in the response body, revealing that the    │
│  input is directly embedded in a SQL query.                │
│                                                             │
│  Evidence:  ▼ expand                                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Request:  GET /search?q='                            │  │
│  │ Response: You have an error in your SQL syntax...    │  │
│  │           near ''' at line 1                         │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  Impact:                                                    │
│  → Attacker can extract entire database content            │
│  → Bypass authentication                                   │
│  → In some cases: read server files                        │
│                                                             │
│  How to fix:  ▼ expand                                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  # ❌ Vulnerable                                     │  │
│  │  query = f"SELECT * FROM products WHERE name='{q}'" │  │
│  │                                                      │  │
│  │  # ✅ Fixed — Use parameterized queries              │  │
│  │  query = "SELECT * FROM products WHERE name = %s"   │  │
│  │  cursor.execute(query, (q,))                         │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  References: OWASP A03:2021 · CWE-89                       │
│  Fix priority: ❗ IMMEDIATE                                  │
└─────────────────────────────────────────────────────────────┘
```

### Layout — Trang kết quả scan

```
Header: OguriScan logo + URL scanned + Scan time

[Score Card] — Top, full width
  Overall grade + score + breakdown by severity

[Filter Bar]
  [All (56)] [Critical (2)] [High (6)] [Medium (5)] [Low (4)] [Passed (39)]
  Sort by: Severity ▼

[Results List] — Grouped by category
  ▼ 🔴 CRITICAL — 2 issues
      [Finding Card: SQLi]
      [Finding Card: Subdomain Takeover]
  ▼ 🟠 HIGH — 6 issues
      [Finding Card: Missing HSTS]
      [Finding Card: Cookie HttpOnly]
      ...
  ▼ ✅ PASSED — 39 checks
      [Collapsed by default, expandable]

[Action Bar]
  [📋 Copy Report JSON] [⬇️ Export PDF] [🔗 Share Link]
```

### Real-time Scan Progress UI

```
Scanning example.com...

[====================] 100%   Done in 58s

  ✅ Group A: Cookie & Headers     (0.8s)
  ✅ Group B: TLS & DNS            (12.3s)
  ✅ Group C: CORS & Methods       (1.2s)
  🔴 Group D: Injection Testing   (60.0s)  ← found 2 issues
  ✅ Group E: JS Analysis          (4.5s)
```

---

## 🖥️ Local Development Plan

### Phase 0 — Setup (ngày 1)

```bash
# Clone / init project
mkdir oguri-scan && cd oguri-scan
git init

# Frontend
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install tailwindcss @shadcn/ui lucide-react
npx shadcn-ui@latest init

# Backend
cd ../
python -m venv .venv
source .venv/Scripts/activate  # Windows
pip install fastapi uvicorn requests beautifulsoup4 dnspython sslyze
```

### Phase 1 — Group A + B (tuần 1)
**Goal:** Cookie, Headers, TLS, DNS checks working locally

```
backend/
├── scanner/
│   ├── group_a.py    # Cookie + Headers
│   └── group_b.py    # TLS + DNS
└── local/server.py   # FastAPI runner

frontend/
├── ScanForm.tsx      # URL input
├── ScanProgress.tsx  # Loading state
└── Results/
    ├── ScoreCard.tsx
    └── FindingCard.tsx
```

### Phase 2 — Group C + D (tuần 2)
**Goal:** CORS, injection checks (XSS, SQLi, redirect, traversal, SSRF)

```
backend/scanner/
├── group_c.py    # CORS + methods
└── group_d.py    # Injection payloads
```

### Phase 3 — Group E + UI Polish (tuần 3)
**Goal:** JS secret scanning, full UI, filters, report export

```
backend/scanner/
└── group_e.py    # JS fetch + regex

frontend/
├── FilterBar.tsx
├── ReportExport.tsx
└── ScanHistory.tsx   # LocalStorage-based
```

### Phase 4 — AWS Deploy (tuần 4)
**Goal:** Deploy lên AWS, test với domain thật

```
Refactor local server.py → Lambda handlers
infra/ Terraform
Deploy + DNS setup
```

---

## ❓ Open Questions — Cần Confirm

> [!IMPORTANT]
> **Q1: Injection depth — bao nhiêu URL/param sẽ test?**
>
> Option A: Chỉ test homepage URL + top-level params (nhanh)
> Option B: Crawl 2 cấp, test tất cả params tìm được (toàn diện hơn, chậm hơn ~2x)
>
> → Recommend: Option A cho MVP, Option B là toggle

> [!IMPORTANT]
> **Q2: SSRF check có làm không?**
>
> Cần setup một AWS Lambda endpoint làm webhook receiver để detect blind SSRF. Phức tạp hơn một chút. Có thể defer.
>
> → Làm ngay hay defer sang Phase 3?

> [!IMPORTANT]
> **Q3: Scan history — lưu ở đâu khi local?**
>
> Option A: `localStorage` browser (mất khi clear browser)
> Option B: SQLite file trên máy (persistent, cần path config)
>
> → Recommend: localStorage cho local, DynamoDB khi deploy

> [!IMPORTANT]
> **Q4: Tech stack của sản phẩm bạn đang build là gì?**
>
> Biết tech stack → có thể tuned payload tốt hơn:
> - PHP/Laravel: test `?id=1'` và PHP error patterns
> - Python/Django: test SSTI `{{7*7}}` thêm
> - Java/Spring: test `${7*7}` EL injection
> - Node.js/Express: test `prototype pollution`
>
> → Có thể để optional input "Tech stack" trên UI

> [!NOTE]
> **Q5: Report export format?**
>
> MVP cần JSON export không? Hay chỉ cần view trên UI là đủ?

> [!NOTE]
> **Q6: Scan report sharing?**
>
> Có cần feature share link (public URL cho scan report) không? Cần S3 + presigned URL.
> Hay chỉ dùng nội bộ thôi?

---

## 📦 Dependencies Summary

### Frontend
```json
{
  "dependencies": {
    "react": "^18",
    "react-dom": "^18",
    "tailwindcss": "^3",
    "@shadcn/ui": "latest",
    "lucide-react": "latest",
    "recharts": "^2",
    "clsx": "latest"
  },
  "devDependencies": {
    "vite": "^5",
    "typescript": "^5",
    "@vitejs/plugin-react": "latest"
  }
}
```

### Backend (Python)
```
requests==2.31.0          # HTTP requests
httpx==0.26.0             # Alternative HTTP client (HTTP/2)
beautifulsoup4==4.12.2    # HTML parsing
dnspython==2.4.2          # DNS lookups
sslyze==5.2.0             # TLS analysis
fastapi==0.109.0          # Local development server
uvicorn==0.27.0           # Local ASGI server
boto3==1.34.0             # AWS SDK (for Lambda deploy)
```

### IaC
```
terraform >= 1.6
aws-cli >= 2.0
python >= 3.12
node >= 18
```

---

## 🗓️ Estimated Timeline

| Phase | Tasks | Duration |
|---|---|---|
| Phase 0 | Project setup, boilerplate | 1 ngày |
| Phase 1 | Group A+B checks + basic UI | 1 tuần |
| Phase 2 | Group C+D injection checks | 1 tuần |
| Phase 3 | Group E + UI polish + report | 1 tuần |
| Phase 4 | AWS deploy + Terraform | 3-5 ngày |
| **Total** | **Local → Production** | **~4 tuần** |
