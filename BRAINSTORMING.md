# 🧠 BRAINSTORMING.md — OguriScan

> Competitor research, market gaps, ideas, future direction.

---

## 🏪 Competitor Landscape

### Tier 1 — Free Single-Purpose Tools

| Tool | URL | Focus | Strengths | Weaknesses |
|---|---|---|---|---|
| **Mozilla Observatory** | observatory.mozilla.org | Headers + TLS + Cookies | Free, trusted brand (Mozilla), simple A–F grade | Headers only, no active vuln testing, no CORS/XSS/SQLi |
| **SecurityHeaders.com** | securityheaders.com | HTTP Headers only | Free, instant, clean UI, industry-referenced | Zero active testing, 1 check category only |
| **Qualys SSL Labs** | ssllabs.com/ssltest | TLS/SSL only | Gold standard for TLS, extremely detailed | TLS only, very slow (~60–120s), no other checks |
| **testssl.sh** | github.com/drwetter/testssl.sh | TLS/SSL CLI | Open source, comprehensive | CLI only, no web UI, requires install |
| **humble** | github.com/rfc-st/humble | HTTP Headers CLI | 60+ header checks, OWASP-aligned | CLI only |

**Gap:** None of these combine checks OR do active vuln testing. You need 3+ separate tools just for basics.

---

### Tier 2 — Active Scanners (require install or account)

| Tool | Pricing | Active Testing | Strengths | Weaknesses |
|---|---|---|---|---|
| **OWASP ZAP** | Free (open source) | ✅ Full DAST | Industry standard, scriptable, CI/CD integration | Complex install, steep learning curve, ugly UI, no web UI |
| **Nikto** | Free (open source) | ✅ Server checks | Fast, well-known | CLI only, dated, high false positives, no modern vuln patterns |
| **Nuclei** | Free (open source) | ✅ Template-based | Fast, community templates, low false positive | CLI only, requires expertise to use, no web UI |

**Gap:** All require install + CLI knowledge. Zero web-based free DAST tools.

---

### Tier 3 — SaaS / Commercial

| Tool | Pricing | Strengths | Weaknesses |
|---|---|---|---|
| **Detectify** | €82–€500+/month | Crowdsourced vulns, continuous monitoring, professional reports | Expensive, demo-gated, no free tier, enterprise-focused |
| **Pentest-Tools.com** | $79–$399/month | Good DAST, XSS/SQLi, web UI | Paid, account required, rate-limited free tier |
| **HostedScan** | $19–$99/month | Managed ZAP, easy setup | Basically managed ZAP, limited customization |
| **Burp Suite Pro** | $449/year | Best-in-class manual pentesting | Desktop app, heavy, learning curve, not a quick scan tool |
| **Vulnify / Vuln0x** | Freemium | Newer, simpler UI | Limited checks, small team, uncertain future |

**Gap:** Cheapest real DAST is ~$80/month. Nothing free + web-based + comprehensive exists.

---

## 🎯 Market Gap Analysis

```
Mozilla Observatory  →  Headers only
SSL Labs            →  TLS only
OWASP ZAP           →  Full but: install required, ugly, complex
Detectify           →  Full but: $80+/month, enterprise only

OguriScan sweet spot:
  ✅ Web-based (no install)
  ✅ Free for personal use
  ✅ Combines passive + active in one tool
  ✅ Clean professional UI
  ✅ CORS testing (almost nobody does this free)
  ✅ JS secret scanning (unique free feature)
  ✅ Subdomain takeover (unique free feature)
  ✅ Email security (SPF/DMARC) alongside web checks
```

### Unique Features Nobody Does Free

| Feature | OguriScan | All free competitors |
|---|---|---|
| CORS misconfiguration test | ✅ | ❌ |
| JS file secret scanning | ✅ | ❌ |
| Subdomain takeover detection | ✅ | ❌ |
| SPF + DMARC check | ✅ | ❌ |
| Reflected XSS detection | ✅ | ❌ |
| SQLi error detection | ✅ | ❌ |
| Open redirect | ✅ | ❌ |
| Path traversal | ✅ | ❌ |
| No install required | ✅ | ✅ (only passive tools) |
| Clean modern UI | ✅ | ⚠️ (Observatory is ok) |

---

## 🔭 Full Competitor Feature Matrix

| Feature | Observatory | SSL Labs | SecurityHeaders | ZAP | Detectify | **OguriScan** |
|---|---|---|---|---|---|---|
| Cookie flags | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Security headers | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| TLS/SSL | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| CORS testing | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| XSS detection | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| SQLi detection | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| JS secret scan | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Subdomain takeover | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| SPF/DMARC | ❌ | ❌ | ❌ | ❌ | ⚠️ | ✅ |
| Open redirect | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Path traversal | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| No install | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| Free tier | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Modern UI | ⚠️ | ⚠️ | ⚠️ | ❌ | ✅ | ✅ |
| Scan history | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Report export | ❌ | ✅ | ❌ | ✅ | ✅ | 🔵 Phase 3 |
| CI/CD webhook | ❌ | ❌ | ❌ | ✅ | ✅ | 🔵 Phase 4 |

---

## 💡 Future Features — Expansion Ideas

### Phase 3 (sau MVP)
- **DOM XSS detection** via Playwright — render JS, inject into DOM
- **localStorage secret scan** — detect sensitive data stored client-side
- **SPA API discovery** — intercept XHR/fetch via Playwright network
- **Report export** — JSON, PDF download
- **Share link** — presigned S3 URL for scan report (24h expiry)
- **Scan history dashboard** — trend view, regression detection

### Phase 4 (nếu muốn grow)
- **Scheduled re-scan** — EventBridge trigger weekly/daily
- **AI fix recommendations** — Bedrock Claude explain in Vietnamese
- **GitHub Action integration**
  ```yaml
  - uses: oguri-lab/webscan-action@v1
    with:
      url: https://myapp.com
      fail-on: critical
  ```
- **Slack / Discord notification** — webhook khi scan xong
- **Badge generator** — như shields.io
  ```
  https://webscan.oguri-lab.io.vn/badge/example.com → [Security: A]
  ```
- **API access** — REST API với API key, pay-per-use
- **Authenticated scan** — nhập session cookie/Bearer token để scan sau login
- **Multi-URL batch** — scan toàn bộ sitemap.xml

### Phase 5 (nếu muốn SaaS)
- **Team workspaces** — chia sẻ scan trong team
- **Vulnerability tracking** — mark as "fixed", track over time
- **CVE integration** — match detected tech versions với CVE DB
- **Supply chain check** — npm/pip dependency vulnerability scan
- **Vietnamese-first** — UI/report tiếng Việt, target market VN devs

---

## 💰 Business Model Options

| Model | Revenue | Effort | Risk |
|---|---|---|---|
| **Forever free** | $0, for portfolio | Low | None |
| **Freemium** | Free 5 scan/day, paid $5-15/month unlimited | Medium | Requires payment infra |
| **Pay-per-use API** | $0.01/scan, API key | Medium | Need fraud prevention |
| **Team SaaS** | $20-50/month, team features | High | Requires auth, billing, support |
| **Open source + hosted** | Open engine, paid cloud version | Medium | Community building |

> **Recommendation for now:** Keep it free. Build portfolio, collect feedback. Monetize later if traction appears.

---

## ⚠️ Risks & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Lambda IP blocked by Cloudflare | High | Medium | Show clear error "WAF detected — scan may be incomplete" |
| False positives damage credibility | Medium | High | Conservative detection thresholds, require confirmed markers |
| Someone scans sites they don't own | Medium | High | ToS + rate limiting, no storing scan targets |
| AWS cost spike from abuse | Low | High | Lambda concurrency limit + SQS rate limiting |
| Detectify copies features | Low | Low | Move faster, community focus |
| Data breach (scan results) | Low | High | Encrypt at rest (DynamoDB encryption), auto-delete after 30 days |

---

## 📚 References & Inspiration

- [OWASP Web Security Testing Guide (WSTG)](https://owasp.org/www-project-web-security-testing-guide/)
- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [Mozilla Observatory source code](https://github.com/mozilla/http-observatory)
- [SecurityHeaders.com](https://securityheaders.com)
- [can-i-take-over-xyz](https://github.com/EdOverflow/can-i-take-over-xyz) — subdomain takeover fingerprints
- [Nuclei templates](https://github.com/projectdiscovery/nuclei-templates)
- [detect-secrets](https://github.com/Yelp/detect-secrets) — secret detection library
