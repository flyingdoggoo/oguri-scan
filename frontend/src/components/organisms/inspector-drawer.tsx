import { useState, useEffect } from "react";
import {
  X,
  ShieldCheck,
  Copy,
  Check,
  Terminal,
} from "lucide-react";
import type { Finding } from "../../types/scan";
import { CodeTerminal } from "../molecules/code-terminal";

interface InspectorDrawerProps {
  finding: Finding | null;
  targetUrl: string;
  onClose: () => void;
}

const SEVERITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  CRITICAL: { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/30" },
  HIGH: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/30" },
  MEDIUM: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30" },
  LOW: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30" },
  PASSED: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
};

export function InspectorDrawer({ finding, targetUrl, onClose }: InspectorDrawerProps) {
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!finding) return null;

  const style = SEVERITY_COLORS[finding.severity] || SEVERITY_COLORS.LOW;

  const resolvedUrl =
    finding.affected_url && finding.affected_url.startsWith("http")
      ? finding.affected_url
      : targetUrl || "https://example.com";

  // Generate a realistic cURL command to reproduce this finding
  const curlCommand =
    finding.group === "injections"
      ? `curl -i -s -G "${resolvedUrl}" --data-urlencode "q=' OR 1=1--"`
      : finding.group === "cors_misconfig"
      ? `curl -i -s -H "Origin: https://attacker.com" -H "Cookie: session=token" "${resolvedUrl}"`
      : `curl -I -s "${resolvedUrl}"`;

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(curlCommand);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(resolvedUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div className="w-full bg-[#09090b] border border-white/[0.08] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in-view max-h-[680px]">
      {/* Panel Header */}
      <div className="px-4 py-3 border-b border-white/[0.08] bg-[#0c0c0e] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase border ${style.bg} ${style.text} ${style.border}`}
          >
            {finding.severity}
          </span>
          <span className="text-[11px] font-mono text-zinc-400">
            {finding.group.replace("_", " ").toUpperCase()}
          </span>
          {finding.cwe_id && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-300 border border-white/[0.06]">
              {finding.cwe_id}
            </span>
          )}
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer flex items-center gap-1 text-xs font-mono"
          title="Thu gọn Inspector (Esc)"
        >
          <kbd className="px-1 py-0.5 rounded bg-zinc-800 border border-white/[0.08] text-[9px] text-zinc-400">
            Esc
          </kbd>
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable Content Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs font-mono">
        {/* Finding Title & Target URL */}
        <div className="space-y-2">
          <h3 className="text-base font-bold text-white tracking-tight">{finding.name}</h3>

          <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/70 border border-white/[0.06] text-[11px]">
            <span className="text-zinc-400 truncate mr-2">
              {resolvedUrl}
            </span>
            <button
              onClick={handleCopyUrl}
              className="text-zinc-400 hover:text-white shrink-0 transition-colors p-1"
              title="Sao chép URL"
            >
              {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Risk Impact Analysis */}
        <div className="space-y-1.5">
          <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">
            Đánh Giá Rủi Ro & Tác Động
          </div>
          <p className="text-zinc-300 text-xs leading-relaxed bg-zinc-900/40 p-3 rounded-lg border border-white/[0.04]">
            {finding.description}
          </p>
        </div>

        {/* Technical Evidence Terminal */}
        {finding.evidence && (
          <div className="space-y-1.5">
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">
              Bằng Chứng Kỹ Thuật (Evidence)
            </div>
            <CodeTerminal
              title="HTTP Response / Detection Trace"
              code={finding.evidence}
              language="http"
            />
          </div>
        )}

        {/* Remediation Guidance */}
        {finding.remediation && (
          <div className="space-y-1.5">
            <div className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Hướng Dẫn Khắc Phục (Remediation)</span>
            </div>
            <p className="text-zinc-300 text-xs leading-relaxed mb-2">{finding.remediation}</p>

            {finding.suggested_fix && (
              <CodeTerminal
                title="Mã nguồn cấu hình đề xuất"
                code={finding.suggested_fix}
                language="config"
              />
            )}
          </div>
        )}

        {/* cURL Reproduction Command */}
        <div className="space-y-1.5">
          <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Terminal className="w-3 h-3 text-zinc-400" />
              <span>Lệnh Tái Hiện (cURL Repro)</span>
            </div>
            <button
              onClick={handleCopyCurl}
              className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              {copiedCurl ? (
                <>
                  <Check className="w-2.5 h-2.5 text-emerald-400" />
                  <span className="text-emerald-400">Đã chép</span>
                </>
              ) : (
                <>
                  <Copy className="w-2.5 h-2.5" />
                  <span>Sao chép</span>
                </>
              )}
            </button>
          </div>

          <div className="p-2.5 rounded-lg bg-black border border-white/[0.08] text-[11px] text-emerald-300 font-mono break-all select-all">
            {curlCommand}
          </div>
        </div>
      </div>

      {/* Panel Footer */}
      <div className="px-4 py-2.5 border-t border-white/[0.08] bg-[#0c0c0e] flex items-center justify-between text-[11px] font-mono text-zinc-500 shrink-0">
        <span>Dùng ↑↓ để đổi lỗi • Esc đóng</span>
        <button
          onClick={onClose}
          className="px-2.5 py-1 rounded bg-white text-black font-semibold hover:bg-zinc-200 transition-colors cursor-pointer text-xs"
        >
          Đóng
        </button>
      </div>
    </div>
  );
}
