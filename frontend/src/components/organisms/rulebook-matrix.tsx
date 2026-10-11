import {
  History,
  Check,
  SlidersHorizontal,
  Info,
} from "lucide-react";
import type { SavedScan, Finding } from "../../types/scan";
import { INITIAL_SECURITY_CHECKS } from "../../lib/default-checks";
import { ScansDataGrid } from "./scans-data-grid";

interface RulebookMatrixProps {
  activeTab: "rulebook" | "history";
  onTabChange: (tab: "rulebook" | "history") => void;
  enabledCheckIds: Set<string>;
  onToggleCheck: (id: string) => void;
  onEnableAll: () => void;
  onDisableAll: () => void;
  onResetChecks: () => void;
  scans: SavedScan[];
  onSelectScan: (scanId: string) => void;
  onRemoveScan: (scanId: string) => void;
  onClearAllScans: () => void;
  onInspectCheck?: (check: Finding) => void;
}

const VECTOR_GROUPS = [
  { key: "injections", label: "Web Injections & Input Fuzzing", icon: "💉" },
  { key: "http_headers", label: "HTTP Headers & Session Security", icon: "🔒" },
  { key: "cors_misconfig", label: "CORS Misconfigurations & Leaks", icon: "🌐" },
  { key: "crypto_domain", label: "Cryptographic & Domain Perimeter", icon: "🛡️" },
  { key: "client_secrets", label: "Client-Side Secrets & JS Recon", icon: "🔍" },
];

export function RulebookMatrix({
  activeTab,
  onTabChange,
  enabledCheckIds,
  onToggleCheck,
  onEnableAll,
  onDisableAll,
  onResetChecks,
  scans,
  onSelectScan,
  onRemoveScan,
  onClearAllScans,
  onInspectCheck,
}: RulebookMatrixProps) {
  const totalChecks = INITIAL_SECURITY_CHECKS.length;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 font-mono text-xs">
      {/* Workspace Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-1">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onTabChange("rulebook")}
            className={`px-3 py-2 border-b-2 font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "rulebook"
                ? "border-white text-white"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Danh Mục {totalChecks} Bài Kiểm Tra (Rulebook)</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-zinc-800 text-zinc-300">
              {enabledCheckIds.size}/{totalChecks}
            </span>
          </button>

          <button
            onClick={() => onTabChange("history")}
            className={`px-3 py-2 border-b-2 font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "history"
                ? "border-white text-white"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Lịch Sử Kiểm Toán</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-zinc-800 text-zinc-300">
              {scans.length}
            </span>
          </button>
        </div>

        {/* Quick controls when in Rulebook tab */}
        {activeTab === "rulebook" && (
          <div className="hidden sm:flex items-center gap-2 text-[11px] text-zinc-500">
            <button
              onClick={onEnableAll}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Bật tất cả
            </button>
            <span>•</span>
            <button
              onClick={onDisableAll}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Tắt tất cả
            </button>
            <span>•</span>
            <button
              onClick={onResetChecks}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Mặc định
            </button>
          </div>
        )}
      </div>

      {/* TAB 1: RULEBOOK MATRIX */}
      {activeTab === "rulebook" && (
        <div className="bg-[#09090b] border border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-2xl space-y-6 animate-in-view">
          <div className="flex items-center justify-between text-zinc-400 pb-2 border-b border-white/[0.04]">
            <p className="text-[11px] text-zinc-500">
              Bật/tắt để tùy biến phạm vi quét, hoặc bấm vào bất kỳ bài nào để xem chi tiết cơ chế & payload:
            </p>
            <span className="text-zinc-300 font-bold tabular-nums">
              {enabledCheckIds.size} quy tắc kích hoạt
            </span>
          </div>

          <div className="space-y-5">
            {VECTOR_GROUPS.map((vec) => {
              const checksInGroup = INITIAL_SECURITY_CHECKS.filter((c) => c.group === vec.key);

              return (
                <div key={vec.key} className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-zinc-200">
                    <span>{vec.icon}</span>
                    <span>{vec.label}</span>
                    <span className="text-[10px] text-zinc-500 font-normal">
                      ({checksInGroup.length} bài)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {checksInGroup.map((check) => {
                      const isEnabled = enabledCheckIds.has(check.id);

                      return (
                        <div
                          key={check.id}
                          className={`p-2.5 rounded-xl border transition-all flex items-start gap-2.5 ${
                            isEnabled
                              ? "bg-zinc-900/60 border-white/[0.08] hover:border-white/[0.18]"
                              : "bg-zinc-950/40 border-white/[0.03] opacity-40 hover:opacity-70"
                          }`}
                        >
                          {/* Toggle Checkbox */}
                          <button
                            type="button"
                            onClick={() => onToggleCheck(check.id)}
                            className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 text-xs transition-colors cursor-pointer ${
                              isEnabled
                                ? "bg-white text-black font-bold"
                                : "border border-zinc-700 text-transparent hover:border-zinc-500"
                            }`}
                            title={isEnabled ? "Tắt bài kiểm tra này" : "Bật bài kiểm tra này"}
                          >
                            {isEnabled && <Check className="w-3 h-3 stroke-[3]" />}
                          </button>

                          {/* Body Clickable to Inspect */}
                          <div
                            onClick={() => onInspectCheck?.(check)}
                            className="min-w-0 flex-1 cursor-pointer select-none group"
                            title="Bấm để xem chi tiết cơ chế, payload và code sửa"
                          >
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-white group-hover:text-cyan-300 transition-colors truncate text-[11.5px]">
                                {check.name}
                              </span>
                              {check.cwe_id && (
                                <span className="px-1 py-0.2 rounded text-[9px] bg-zinc-800 text-zinc-400 border border-white/[0.04]">
                                  {check.cwe_id}
                                </span>
                              )}
                            </div>
                            <p className="text-[10.5px] text-zinc-500 line-clamp-1 mt-0.5 group-hover:text-zinc-400 transition-colors">
                              {check.description}
                            </p>
                          </div>

                          {/* Info Button */}
                          {onInspectCheck && (
                            <button
                              type="button"
                              onClick={() => onInspectCheck(check)}
                              className="p-1 rounded text-zinc-500 hover:text-white transition-colors cursor-pointer shrink-0"
                              title="Xem chi tiết"
                            >
                              <Info className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: AUDIT HISTORY */}
      {activeTab === "history" && (
        <div className="animate-in-view">
          <ScansDataGrid
            scans={scans}
            onSelectScan={onSelectScan}
            onRemoveScan={onRemoveScan}
            onClearAll={onClearAllScans}
          />
        </div>
      )}
    </div>
  );
}
