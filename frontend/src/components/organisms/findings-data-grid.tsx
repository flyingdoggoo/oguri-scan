import { useState, useMemo, useEffect, useRef } from "react";
import { Search, Loader2 } from "lucide-react";
import type { Finding } from "../../types/scan";

interface FindingsDataGridProps {
  findings: Finding[];
  targetUrl: string;
  isScanning?: boolean;
  scanProgress?: number;
  currentStep?: string;
  onSelectFinding: (finding: Finding) => void;
  selectedFindingId?: string;
  isSplitView?: boolean;
}

const SEVERITY_ORDER: Record<string, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
  PASSED: 4,
};

const SEVERITY_DOTS: Record<string, string> = {
  CRITICAL: "bg-rose-500",
  HIGH: "bg-orange-500",
  MEDIUM: "bg-amber-400",
  LOW: "bg-blue-400",
  PASSED: "bg-emerald-400",
};

export function FindingsDataGrid({
  findings,
  targetUrl,
  isScanning = false,
  scanProgress = 0,
  currentStep = "",
  onSelectFinding,
  selectedFindingId,
  isSplitView = false,
}: FindingsDataGridProps) {
  const [filter, setFilter] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);
  const tableRef = useRef<HTMLDivElement>(null);

  // Compute counts
  const counts = useMemo(() => {
    const c = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, PASSED: 0, ALL: findings.length };
    for (const f of findings) {
      if (f.severity in c) {
        c[f.severity as keyof typeof c]++;
      }
    }
    return c;
  }, [findings]);

  // Filtered & sorted findings
  const displayedFindings = useMemo(() => {
    let list = [...findings];

    if (filter !== "ALL") {
      list = list.filter((f) => f.severity === filter);
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.group.toLowerCase().includes(q) ||
          (f.cwe_id && f.cwe_id.toLowerCase().includes(q)) ||
          f.description.toLowerCase().includes(q) ||
          f.affected_url.toLowerCase().includes(q)
      );
    }

    return list.sort(
      (a, b) => (SEVERITY_ORDER[a.severity] ?? 99) - (SEVERITY_ORDER[b.severity] ?? 99)
    );
  }, [findings, filter, search]);

  // Sync highlightedIndex if selectedFindingId changes from outside
  useEffect(() => {
    if (selectedFindingId) {
      const idx = displayedFindings.findIndex((f) => f.id === selectedFindingId);
      if (idx !== -1) setHighlightedIndex(idx);
    }
  }, [selectedFindingId, displayedFindings]);

  // Reset highlight on list change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filter, search]);

  // Keyboard navigation on table with instant reactive update for split view
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (displayedFindings.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextIdx = (highlightedIndex + 1) % displayedFindings.length;
      setHighlightedIndex(nextIdx);
      if (isSplitView && displayedFindings[nextIdx]) {
        onSelectFinding(displayedFindings[nextIdx]);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const nextIdx = (highlightedIndex - 1 + displayedFindings.length) % displayedFindings.length;
      setHighlightedIndex(nextIdx);
      if (isSplitView && displayedFindings[nextIdx]) {
        onSelectFinding(displayedFindings[nextIdx]);
      }
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const item = displayedFindings[highlightedIndex];
      if (item) onSelectFinding(item);
    }
  };

  return (
    <div
      ref={tableRef}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      className="w-full bg-[#09090b] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl focus:outline-none focus:border-white/[0.2] transition-colors"
    >
      {/* Table Toolbar */}
      <div className="p-3 sm:p-4 border-b border-white/[0.06] bg-[#0c0c0e] flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Severity Filter Chips */}
        <div className="flex items-center gap-1.5 flex-wrap font-mono text-[11px]">
          <button
            onClick={() => setFilter("ALL")}
            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
              filter === "ALL"
                ? "bg-white text-black font-semibold shadow"
                : "bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800"
            }`}
          >
            <span>Tất cả</span>
            <span className="text-[10px] opacity-70">({counts.ALL})</span>
          </button>

          {(["CRITICAL", "HIGH", "MEDIUM", "LOW", "PASSED"] as const).map((sev) => {
            const count = counts[sev];
            if (count === 0 && !isScanning) return null;
            const dot = SEVERITY_DOTS[sev];

            return (
              <button
                key={sev}
                onClick={() => setFilter(sev)}
                className={`px-2 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                  filter === setFilterValue(sev, filter)
                    ? "bg-white text-black font-semibold shadow"
                    : "bg-zinc-900/60 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-white/[0.04]"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                <span>{sev}</span>
                <span className="text-[10px] opacity-70">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-56">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Lọc theo tên, CWE..."
            className="w-full bg-zinc-950/80 border border-white/[0.08] focus:border-white/[0.2] rounded-lg pl-8 pr-3 py-1 text-xs text-white placeholder-zinc-500 font-mono focus:outline-none"
          />
        </div>
      </div>

      {/* Live Scanning Banner (If scanning is active) */}
      {isScanning && (
        <div className="px-4 py-2.5 bg-zinc-900/60 border-b border-white/[0.06] flex items-center justify-between font-mono text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
            <span className="text-zinc-200 font-semibold">Đang rà soát:</span>
            <span className="text-zinc-400 truncate max-w-xs">{targetUrl}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-zinc-500 hidden sm:inline">{currentStep || "Đang phân tích..."}</span>
            <span className="text-white font-bold tabular-nums">{scanProgress}%</span>
          </div>
        </div>
      )}

      {/* Table Header Row */}
      <div className="hidden sm:grid grid-cols-12 gap-3 px-4 py-2.5 bg-[#08080a] border-b border-white/[0.06] text-[10px] font-mono uppercase tracking-wider text-zinc-500 select-none">
        <div className={isSplitView ? "col-span-3" : "col-span-2"}>Mức độ</div>
        <div className={isSplitView ? "col-span-3" : "col-span-2"}>Mã CWE</div>
        <div className={isSplitView ? "col-span-6" : "col-span-5"}>Bài kiểm tra an ninh</div>
        {!isSplitView && <div className="col-span-2">Phạm vi URL</div>}
        {!isSplitView && <div className="col-span-1 text-right">Chi tiết</div>}
      </div>

      {/* Table Data Rows */}
      <div className="divide-y divide-white/[0.04] max-h-[620px] overflow-y-auto">
        {displayedFindings.length === 0 ? (
          <div className="py-14 text-center text-xs font-mono text-zinc-500">
            {isScanning
              ? "Đang khởi tạo các bài kiểm tra an ninh..."
              : "Không tìm thấy bài kiểm tra nào phù hợp với bộ lọc hiện tại."}
          </div>
        ) : (
          displayedFindings.map((finding, idx) => {
            const isHighlighted = idx === highlightedIndex;
            const isSelected = finding.id === selectedFindingId;
            const dotColor = SEVERITY_DOTS[finding.severity] || "bg-zinc-500";

            return (
              <div
                key={finding.id}
                onClick={() => onSelectFinding(finding)}
                onMouseEnter={() => setHighlightedIndex(idx)}
                className={`grid grid-cols-12 gap-3 items-center px-4 py-2.5 text-xs font-mono transition-colors cursor-pointer select-none ${
                  isSelected
                    ? "bg-white/[0.1] text-white ring-1 ring-inset ring-white/[0.2]"
                    : isHighlighted
                    ? "bg-white/[0.04] text-zinc-200"
                    : "text-zinc-400 hover:bg-white/[0.02]"
                }`}
              >
                {/* Severity Badge */}
                <div className={`flex items-center gap-2 min-w-0 ${isSplitView ? "col-span-4 sm:col-span-3" : "col-span-4 sm:col-span-2"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
                  <span
                    className={`text-[10px] font-bold tracking-wider uppercase ${
                      finding.severity === "CRITICAL"
                        ? "text-rose-400"
                        : finding.severity === "HIGH"
                        ? "text-orange-400"
                        : finding.severity === "MEDIUM"
                        ? "text-amber-400"
                        : finding.severity === "PASSED"
                        ? "text-emerald-400"
                        : "text-blue-400"
                    }`}
                  >
                    {finding.severity}
                  </span>
                </div>

                {/* CWE Code */}
                <div className={`min-w-0 ${isSplitView ? "col-span-3 sm:col-span-3" : "col-span-3 sm:col-span-2"}`}>
                  {finding.cwe_id ? (
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-900 border border-white/[0.06] text-zinc-300">
                      {finding.cwe_id}
                    </span>
                  ) : (
                    <span className="text-[10px] text-zinc-600">—</span>
                  )}
                </div>

                {/* Finding Title */}
                <div className={`min-w-0 pr-1 ${isSplitView ? "col-span-5 sm:col-span-6" : "col-span-5 sm:col-span-5"}`}>
                  <div className="text-zinc-200 font-semibold truncate hover:text-white">
                    {finding.name}
                  </div>
                </div>

                {/* Affected Endpoint (Hidden in split view) */}
                {!isSplitView && (
                  <div className="hidden sm:block col-span-2 min-w-0">
                    <div className="text-zinc-500 truncate text-[11px]">
                      {finding.affected_url || targetUrl || "Root"}
                    </div>
                  </div>
                )}

                {/* Quick Action Badge (Hidden in split view) */}
                {!isSplitView && (
                  <div className="hidden sm:flex col-span-1 justify-end items-center">
                    <span className="text-[10px] text-zinc-500 group-hover:text-zinc-300 flex items-center gap-0.5">
                      <span>↵</span>
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Table Footer Counter */}
      <div className="px-4 py-2 bg-[#08080a] border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-zinc-500">
        <div>
          Hiển thị <span className="text-zinc-300 font-bold tabular-nums">{displayedFindings.length}</span> / {findings.length} bài
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <span>Phím</span>
          <kbd className="px-1 py-0.2 rounded bg-zinc-900 border border-white/[0.08] text-[9px] text-zinc-400">
            ↑↓
          </kbd>
          <span>đổi lỗi</span>
          <kbd className="px-1 py-0.2 rounded bg-zinc-900 border border-white/[0.08] text-[9px] text-zinc-400">
            ↵
          </kbd>
          <span>{isSplitView ? "chọn" : "mở panel"}</span>
        </div>
      </div>
    </div>
  );
}

function setFilterValue(sev: string, current: string): string {
  return current === sev ? "ALL" : sev;
}
