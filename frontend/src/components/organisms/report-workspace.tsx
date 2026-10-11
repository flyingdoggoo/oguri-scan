import { useState, useMemo } from "react";
import type { ScanResult } from "../../types/scan";
import { Scoreboard } from "./scoreboard";
import { FindingCard } from "./finding-card";
import { ReportToolbar } from "./report-toolbar";
import { Search } from "lucide-react";

interface ReportWorkspaceProps {
  scanResult: ScanResult;
  onReset: () => void;
  onRescan: (url: string) => void;
}

export function ReportWorkspace({ scanResult, onReset, onRescan }: ReportWorkspaceProps) {
  const [selectedFilter, setSelectedFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFindings = useMemo(() => {
    let list = scanResult.findings;

    if (selectedFilter !== "ALL") {
      list = list.filter((f) => f.severity === selectedFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.group.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q) ||
          f.affected_url.toLowerCase().includes(q)
      );
    }

    return list;
  }, [scanResult, selectedFilter, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Workspace Header Bar */}
      <div className="p-4 rounded-xl border border-white/[0.08] bg-[#0c0c0e]/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500 mb-1">
            <span>Security Audit Report</span>
            <span>•</span>
            <span className="text-zinc-400 font-semibold">{scanResult.target_url}</span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
            Executive Threat Report
          </h2>
        </div>

        <div className="text-xs font-mono text-zinc-500 sm:text-right">
          ID: {scanResult.scan_id.slice(0, 8)}… • {new Date(scanResult.start_time).toLocaleDateString("vi-VN")}
        </div>
      </div>

      {/* Action Toolbar */}
      <ReportToolbar
        scanResult={scanResult}
        onReset={onReset}
        onRescan={onRescan}
      />

      {/* Scoreboard KPI Matrix */}
      <Scoreboard
        summary={scanResult.summary}
        selectedFilter={selectedFilter}
        onFilterChange={setSelectedFilter}
      />

      {/* Finding Search & List */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1">
          <div className="text-xs font-mono text-zinc-400">
            Hiển thị <span className="text-white font-bold tabular-nums">{filteredFindings.length}</span> / {scanResult.findings.length} bài kiểm tra
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Lọc bài kiểm tra…"
              className="w-full bg-[#0c0c0e] border border-white/[0.08] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/[0.2] font-mono"
            />
          </div>
        </div>

        {filteredFindings.map((finding) => (
          <FindingCard key={finding.id} finding={finding} />
        ))}

        {filteredFindings.length === 0 && (
          <div className="text-center py-12 border border-dashed border-white/[0.08] rounded-xl p-8 bg-[#0c0c0e]/40">
            <p className="text-zinc-500 text-xs font-mono">
              Không tìm thấy bài kiểm tra nào phù hợp với bộ lọc hiện tại.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
