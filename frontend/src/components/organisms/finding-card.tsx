import { useState } from "react";
import type { Finding } from "../../types/scan";
import { Badge } from "../ui/badge";
import { CodeTerminal } from "../molecules/code-terminal";
import { ChevronDown, ChevronUp, ShieldCheck } from "lucide-react";

interface FindingCardProps {
  finding: Finding;
  defaultExpanded?: boolean;
}

export function FindingCard({ finding, defaultExpanded = false }: FindingCardProps) {
  const [isExpanded, setIsExpanded] = useState(
    defaultExpanded || finding.severity === "CRITICAL" || finding.severity === "HIGH"
  );

  const remediationText =
    typeof finding.remediation === "object" && finding.remediation !== null
      ? (finding.remediation as any).explanation || JSON.stringify(finding.remediation)
      : String(finding.remediation || "");

  const activeSnippet =
    finding.code_snippet ||
    (typeof finding.remediation === "object" && finding.remediation !== null
      ? (finding.remediation as any).good_code
      : undefined);

  const variantMap: Record<string, "critical" | "high" | "medium" | "low" | "passed"> = {
    CRITICAL: "critical",
    HIGH: "high",
    MEDIUM: "medium",
    LOW: "low",
    PASSED: "passed",
  };

  const badgeVariant = variantMap[finding.severity] || "low";

  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#0c0c0e]/90 overflow-hidden shadow-xs print-break-inside-avoid transition-colors hover:border-white/[0.14]">
      {/* Header Bar */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-3.5 sm:p-4 flex items-start sm:items-center justify-between gap-3 cursor-pointer select-none hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <Badge variant={badgeVariant} size="sm">
            {finding.severity}
          </Badge>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-0.5">
              <span className="text-[11px] font-mono text-zinc-500">
                {finding.group}
              </span>
              {finding.affected_url && (
                <>
                  <span className="text-zinc-600 font-mono text-xs">•</span>
                  <span className="text-[11px] font-mono text-zinc-400 truncate max-w-xs sm:max-w-md">
                    {finding.affected_url}
                  </span>
                </>
              )}
            </div>

            <h4 className="text-sm font-semibold text-zinc-100 tracking-tight">
              {finding.name}
            </h4>
          </div>
        </div>

        <button
          type="button"
          aria-label={isExpanded ? "Thu gọn chi tiết" : "Xem chi tiết lỗi"}
          className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800/60 shrink-0"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expanded Accordion Body */}
      {isExpanded && (
        <div className="px-4 sm:px-5 pb-5 pt-2 border-t border-white/[0.06] bg-[#070709] space-y-4">
          {/* Tác động nguy cơ */}
          <div>
            <h5 className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold mb-1">
              Nguy cơ tiềm ẩn
            </h5>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-normal">
              {finding.description}
            </p>
          </div>

          {/* Bằng chứng kỹ thuật (Evidence) */}
          {finding.evidence && (
            <CodeTerminal
              title="Bằng chứng kiểm tra (Evidence)"
              code={finding.evidence}
              language="http"
            />
          )}

          {/* Hướng dẫn khắc phục (Remediation) */}
          <div>
            <h5 className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-semibold mb-1 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Hướng dẫn khắc phục
            </h5>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              {remediationText}
            </p>
          </div>

          {/* Code mẫu khắc phục */}
          {activeSnippet && (
            <CodeTerminal
              title="Mã nguồn cấu hình đề xuất"
              code={activeSnippet}
              language="config"
            />
          )}
        </div>
      )}
    </div>
  );
}
