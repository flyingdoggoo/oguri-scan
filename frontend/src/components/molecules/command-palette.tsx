import { useState, useEffect, useRef, useMemo } from "react";
import {
  Search,
  Shield,
  Zap,
  History,
  Download,
  Printer,
  Trash2,
} from "lucide-react";
import type { SavedScan } from "../../types/scan";

export interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  category: "actions" | "checks" | "history";
  cwe?: string;
  icon?: any;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onStartScan: (url: string) => void;
  onExportJson?: () => void;
  onPrintPdf?: () => void;
  onClearHistory?: () => void;
  onSelectScan?: (scanId: string) => void;
  history: SavedScan[];
}

// 28 Security Rules Registry for instant lookup
const SECURITY_CHECKS_REGISTRY = [
  { id: "xss-reflected", title: "Reflected XSS (Tag Injection)", category: "checks" as const, cwe: "CWE-79", vector: "Injections" },
  { id: "xss-attribute", title: "HTML Attribute Breakout", category: "checks" as const, cwe: "CWE-79", vector: "Injections" },
  { id: "sqli-error", title: "SQL Injection (Error-based Syntax)", category: "checks" as const, cwe: "CWE-89", vector: "Injections" },
  { id: "path-traversal", title: "Path Traversal & LFI File Disclosure", category: "checks" as const, cwe: "CWE-22", vector: "Injections" },
  { id: "open-redirect", title: "Unvalidated Open URL Redirection", category: "checks" as const, cwe: "CWE-601", vector: "Injections" },
  { id: "csp-missing", title: "Content-Security-Policy (CSP) Missing", category: "checks" as const, cwe: "CWE-1021", vector: "Headers" },
  { id: "hsts-missing", title: "HTTP Strict-Transport-Security (HSTS)", category: "checks" as const, cwe: "CWE-319", vector: "Headers" },
  { id: "x-frame-options", title: "X-Frame-Options (Clickjacking Protection)", category: "checks" as const, cwe: "CWE-1021", vector: "Headers" },
  { id: "cookie-httponly", title: "Cookie HttpOnly & Secure Missing Flags", category: "checks" as const, cwe: "CWE-614", vector: "Headers" },
  { id: "cookie-samesite", title: "SameSite CSRF Protection Flag", category: "checks" as const, cwe: "CWE-1275", vector: "Headers" },
  { id: "x-content-type", title: "X-Content-Type-Options (MIME Sniffing)", category: "checks" as const, cwe: "CWE-430", vector: "Headers" },
  { id: "referrer-policy", title: "Referrer-Policy Header Misconfigured", category: "checks" as const, cwe: "CWE-116", vector: "Headers" },
  { id: "permissions-policy", title: "Permissions-Policy Camera/Geo Sandbox", category: "checks" as const, cwe: "CWE-250", vector: "Headers" },
  { id: "server-tokens", title: "Server & Framework Banner Disclosure", category: "checks" as const, cwe: "CWE-200", vector: "Headers" },
  { id: "cache-control", title: "Sensitive Response Cache-Control Missing", category: "checks" as const, cwe: "CWE-524", vector: "Headers" },
  { id: "cors-reflected", title: "CORS Reflected Origin with Credentials", category: "checks" as const, cwe: "CWE-346", vector: "CORS" },
  { id: "cors-null-origin", title: "CORS Null Origin Trust Exposure", category: "checks" as const, cwe: "CWE-346", vector: "CORS" },
  { id: "cors-wildcard", title: "Sensitive Wildcard Access-Control-Allow-Origin", category: "checks" as const, cwe: "CWE-346", vector: "CORS" },
  { id: "dir-listing", title: "Directory Indexing & Listing Exposure", category: "checks" as const, cwe: "CWE-548", vector: "CORS" },
  { id: "stack-traces", title: "Application Stack Trace / Debug Leaks", category: "checks" as const, cwe: "CWE-200", vector: "CORS" },
  { id: "tls-cert-valid", title: "SSL/TLS Certificate Validity & Chain", category: "checks" as const, cwe: "CWE-295", vector: "Crypto" },
  { id: "tls-version", title: "Deprecated TLS 1.0 & 1.1 Protocols", category: "checks" as const, cwe: "CWE-326", vector: "Crypto" },
  { id: "tls-weak-ciphers", title: "Weak Cipher Suites (RC4/3DES/CBC)", category: "checks" as const, cwe: "CWE-327", vector: "Crypto" },
  { id: "subdomain-takeover", title: "Orphaned DNS CNAME Subdomain Takeover", category: "checks" as const, cwe: "CWE-1035", vector: "Crypto" },
  { id: "secrets-aws", title: "AWS Access Key Exposure (AKIA...)", category: "checks" as const, cwe: "CWE-798", vector: "Secrets" },
  { id: "secrets-jwt", title: "Hardcoded Client-Side JWT Secrets", category: "checks" as const, cwe: "CWE-312", vector: "Secrets" },
  { id: "secrets-keys", title: "RSA / EC Private Key Block Disclosure", category: "checks" as const, cwe: "CWE-312", vector: "Secrets" },
  { id: "secrets-api-keys", title: "Stripe & Google Cloud API Key Exposure", category: "checks" as const, cwe: "CWE-798", vector: "Secrets" },
];

export function CommandPalette({
  isOpen,
  onClose,
  onStartScan,
  onExportJson,
  onPrintPdf,
  onClearHistory,
  onSelectScan,
  history,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Auto focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Build items list based on query
  const items: CommandItem[] = useMemo(() => {
    const list: CommandItem[] = [];

    // 1. Actions / Presets
    list.push({
      id: "action-example",
      title: "Quét mục tiêu: example.com",
      subtitle: "Mục tiêu tiêu chuẩn IANA",
      category: "actions",
      icon: Zap,
      action: () => {
        onStartScan("https://example.com");
        onClose();
      },
    });

    list.push({
      id: "action-ginandjuice",
      title: "Quét PortSwigger Lab: ginandjuice.shop",
      subtitle: "Mục tiêu demo thử nghiệm bảo mật",
      category: "actions",
      icon: Zap,
      action: () => {
        onStartScan("https://ginandjuice.shop");
        onClose();
      },
    });

    list.push({
      id: "action-testphp",
      title: "Quét Acunetix Lab: testphp.vulnweb.com",
      subtitle: "Mục tiêu kiểm thử lỗ hổng injection & headers",
      category: "actions",
      icon: Zap,
      action: () => {
        onStartScan("http://testphp.vulnweb.com");
        onClose();
      },
    });

    if (onExportJson) {
      list.push({
        id: "action-export-json",
        title: "Xuất dữ liệu báo cáo (JSON)",
        subtitle: "Tải về cấu trúc chi tiết các lỗ hổng",
        category: "actions",
        icon: Download,
        action: () => {
          onExportJson();
          onClose();
        },
      });
    }

    if (onPrintPdf) {
      list.push({
        id: "action-print-pdf",
        title: "In hoặc Lưu báo cáo PDF",
        subtitle: "Tạo bản in kiểm toán trang",
        category: "actions",
        icon: Printer,
        action: () => {
          onPrintPdf();
          onClose();
        },
      });
    }

    if (onClearHistory && history.length > 0) {
      list.push({
        id: "action-clear-history",
        title: "Xóa toàn bộ lịch sử rà soát",
        subtitle: `Xóa vĩnh viễn ${history.length} phiên đã lưu trong trình duyệt`,
        category: "actions",
        icon: Trash2,
        action: () => {
          onClearHistory();
          onClose();
        },
      });
    }

    // 2. Security Checks
    for (const check of SECURITY_CHECKS_REGISTRY) {
      list.push({
        id: `check-${check.id}`,
        title: check.title,
        subtitle: `${check.vector} • ${check.cwe}`,
        category: "checks",
        cwe: check.cwe,
        icon: Shield,
        action: () => {
          onClose();
        },
      });
    }

    // 3. Recent Scans
    for (const h of history.slice(0, 5)) {
      list.push({
        id: `history-${h.scan_id}`,
        title: `Mở lại phiên: ${h.target_url}`,
        subtitle: `Hạng: ${h.grade} • Điểm: ${h.score}/100 • ${new Date(h.timestamp).toLocaleDateString("vi-VN")}`,
        category: "history",
        icon: History,
        action: () => {
          if (onSelectScan) onSelectScan(h.scan_id);
          onClose();
        },
      });
    }

    // Filter by query
    if (!query.trim()) return list;

    const q = query.toLowerCase().trim();
    return list.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
        (item.cwe && item.cwe.toLowerCase().includes(q))
    );
  }, [query, history, onStartScan, onExportJson, onPrintPdf, onClearHistory, onSelectScan, onClose]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation inside palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + items.length) % items.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (items[selectedIndex]) {
        items[selectedIndex].action();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/75 backdrop-blur-sm animate-in-view"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#09090b] border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-white/[0.08] bg-[#0c0c0e]">
          <Search className="w-4 h-4 text-zinc-400 absolute left-4 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm kiếm lệnh, mã CWE, hoặc chọn mục tiêu..."
            className="w-full bg-transparent pl-8 pr-12 text-sm text-white placeholder-zinc-500 font-mono focus:outline-none"
          />
          <div className="flex items-center gap-1 absolute right-3">
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-white/[0.08] text-[10px] text-zinc-400 font-mono">
              Esc
            </kbd>
          </div>
        </div>

        {/* Results List */}
        <div ref={listRef} className="overflow-y-auto p-2 divide-y divide-white/[0.03]">
          {items.length === 0 ? (
            <div className="py-12 text-center text-xs font-mono text-zinc-500">
              Không tìm thấy kết quả nào cho &quot;{query}&quot;
            </div>
          ) : (
            <div className="space-y-0.5">
              {items.map((item, idx) => {
                const Icon = item.icon || Shield;
                const isSelected = idx === selectedIndex;

                return (
                  <div
                    key={item.id}
                    onClick={() => item.action()}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-mono transition-colors cursor-pointer select-none ${
                      isSelected ? "bg-white/[0.08] text-white" : "text-zinc-400 hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${
                          isSelected ? "bg-white text-black" : "bg-zinc-800 text-zinc-400"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-zinc-200 font-semibold truncate flex items-center gap-2">
                          <span>{item.title}</span>
                          {item.cwe && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-zinc-800 text-zinc-400 border border-white/[0.06]">
                              {item.cwe}
                            </span>
                          )}
                        </div>
                        {item.subtitle && (
                          <div className="text-[11px] text-zinc-500 truncate">{item.subtitle}</div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isSelected && (
                        <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                          <span>Chọn</span>
                          <kbd className="px-1 py-0.5 rounded bg-zinc-800 border border-white/[0.1] text-zinc-300">
                            ↵
                          </kbd>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Hint */}
        <div className="px-4 py-2 bg-[#060608] border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-zinc-500">
          <div className="flex items-center gap-2">
            <span>Dùng</span>
            <kbd className="px-1 py-0.2 rounded bg-zinc-800 border border-white/[0.1] text-zinc-400 text-[10px]">
              ↑↓
            </kbd>
            <span>để chuyển</span>
            <kbd className="px-1 py-0.2 rounded bg-zinc-800 border border-white/[0.1] text-zinc-400 text-[10px]">
              ↵
            </kbd>
            <span>để chọn</span>
          </div>
          <span>OguriScan Pro Palette</span>
        </div>
      </div>
    </div>
  );
}
