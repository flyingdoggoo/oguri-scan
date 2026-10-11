import { Shield, Lock, Terminal, Globe, KeyRound, CheckCircle2 } from "lucide-react";

interface VectorInfo {
  id: string;
  title: string;
  icon: any;
  testsCount: number;
  cwes: string;
  description: string;
  checks: string[];
}

const VECTORS: VectorInfo[] = [
  {
    id: "injection",
    title: "Web Injections & Input Fuzzing",
    icon: Terminal,
    testsCount: 5,
    cwes: "CWE-79, CWE-89, CWE-22, CWE-601",
    description: "Thử nghiệm tải trọng tiêm mã động: Reflected XSS, SQLi đa hệ quản trị (MySQL, Postgres, MSSQL, Oracle), LFI Path Traversal.",
    checks: ["Reflected XSS (Tag injection)", "HTML Attribute Breakout", "SQLi Error-based Syntax", "Path Traversal / LFI", "Unvalidated Open Redirect"],
  },
  {
    id: "headers_cookies",
    title: "HTTP Headers & Session Security",
    icon: Shield,
    testsCount: 10,
    cwes: "CWE-1021, CWE-319, CWE-614",
    description: "Phân tích cấu hình tiêu đề phòng vệ trình duyệt và thuộc tính cờ an toàn cookie phiên làm việc.",
    checks: ["Content-Security-Policy (CSP)", "Strict-Transport-Security (HSTS)", "X-Frame-Options (Clickjacking)", "Cookie HttpOnly & Secure flags", "SameSite CSRF Protection"],
  },
  {
    id: "cors_exposure",
    title: "CORS Misconfigurations & Leaks",
    icon: Globe,
    testsCount: 5,
    cwes: "CWE-346, CWE-200, CWE-548",
    description: "Rà soát lỗ hổng chia sẻ tài nguyên nguồn gốc chéo nguy hiểm và điểm rò rỉ mã nguồn/ngăn xếp lỗi.",
    checks: ["Reflected Origin with Credentials", "Null Origin Acceptance", "Sensitive Wildcard CORS", "Directory Listing Exposure", "Server Stack Trace Disclosure"],
  },
  {
    id: "crypto_dns",
    title: "Cryptographic & Domain Perimeter",
    icon: Lock,
    testsCount: 4,
    cwes: "CWE-326, CWE-295, CWE-1035",
    description: "Đánh giá chứng chỉ số SSL/TLS, giao thức cũ (TLS 1.0/1.1), bộ mã hóa yếu và nguy cơ chiếm quyền subdomain.",
    checks: ["SSL/TLS Certificate Validity", "Deprecated TLS 1.0/1.1", "Weak Cipher Suites (RC4/3DES)", "Orphaned Subdomain Takeover"],
  },
  {
    id: "secrets",
    title: "Client-Side Secrets & API Leaks",
    icon: KeyRound,
    testsCount: 4,
    cwes: "CWE-798, CWE-312",
    description: "Rà soát mã nguồn JavaScript đã tải về để phát hiện token, khóa bí mật và thông tin xác thực bị nhúng cứng.",
    checks: ["AWS Access Key (AKIA...)", "Hardcoded JWT Tokens", "RSA/EC Private Keys", "Stripe & Google API Keys"],
  },
];

export function AttackSurfaceMatrix() {
  return (
    <div className="space-y-4">
      {/* Matrix Header Banner */}
      <div className="p-4 rounded-xl border border-white/[0.08] bg-[#09090b] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200">
              Attack Surface Coverage Matrix
            </h3>
          </div>
          <p className="text-xs text-zinc-400">
            Hệ thống rà soát 32 bài kiểm tra thực chiến chia thành 5 hướng tấn công chính (Vectors).
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono text-zinc-400 shrink-0">
          <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
            32 Active Rules
          </span>
          <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-emerald-400">
            Depth 1 Guard
          </span>
        </div>
      </div>

      {/* Grid 5 Vectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {VECTORS.map((v) => {
          const Icon = v.icon;
          return (
            <div
              key={v.id}
              className="p-4 rounded-xl border border-white/[0.06] bg-[#0c0c0e]/80 hover:border-white/[0.12] transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                      <Icon className="w-3 h-3 text-zinc-300" />
                    </div>
                    <h4 className="text-xs font-bold text-zinc-100 font-mono tracking-tight">
                      {v.title}
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                    {v.testsCount} tests
                  </span>
                </div>

                <p className="text-[11px] text-zinc-400 mb-3 leading-relaxed">
                  {v.description}
                </p>

                <div className="space-y-1 pt-2 border-t border-white/[0.04]">
                  {v.checks.map((chk, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400">
                      <CheckCircle2 className="w-3 h-3 text-zinc-600 shrink-0" />
                      <span className="truncate">{chk}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-white/[0.04] text-[10px] font-mono text-zinc-600 truncate">
                Mapped: {v.cwes}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
