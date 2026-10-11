import { Trash2, ArrowUpRight, History } from "lucide-react";
import type { SavedScan } from "../../types/scan";

interface ScansDataGridProps {
  scans: SavedScan[];
  onSelectScan: (scanId: string) => void;
  onRemoveScan: (scanId: string) => void;
  onClearAll: () => void;
}

const GRADE_COLORS: Record<string, string> = {
  A: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  B: "bg-teal-500/10 text-teal-400 border-teal-500/20",
  C: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  D: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  F: "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

export function ScansDataGrid({
  scans,
  onSelectScan,
  onRemoveScan,
  onClearAll,
}: ScansDataGridProps) {
  if (scans.length === 0) {
    return (
      <div className="w-full bg-[#09090b] border border-white/[0.08] rounded-2xl p-8 sm:p-12 text-center shadow-xl">
        <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-white/[0.08] flex items-center justify-center mx-auto mb-3 text-zinc-400">
          <History className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-bold text-white font-mono mb-1">
          Chưa Có Phiên Rà Soát Nào
        </h3>
        <p className="text-xs text-zinc-500 font-mono max-w-md mx-auto">
          Nhập địa chỉ website vào thanh lệnh phía trên hoặc nhấn{" "}
          <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-white/[0.08] text-[10px] text-zinc-300">
            ⌘K
          </kbd>{" "}
          để thử nghiệm ngay với các mục tiêu mẫu.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#09090b] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl">
      {/* Header Toolbar */}
      <div className="px-4 py-3 bg-[#0c0c0e] border-b border-white/[0.06] flex items-center justify-between font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className="text-zinc-200 font-bold">Lịch Sử Kiểm Toán An Ninh</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] bg-zinc-800 text-zinc-400 border border-white/[0.06]">
            {scans.length} phiên
          </span>
        </div>

        <button
          onClick={onClearAll}
          className="text-[11px] text-zinc-500 hover:text-rose-400 flex items-center gap-1 transition-colors cursor-pointer"
        >
          <Trash2 className="w-3 h-3" />
          <span>Xóa tất cả</span>
        </button>
      </div>

      {/* Table Header */}
      <div className="hidden sm:grid grid-cols-12 gap-3 px-4 py-2 bg-[#08080a] border-b border-white/[0.06] text-[10px] font-mono uppercase tracking-wider text-zinc-500 select-none">
        <div className="col-span-2">Hạng / Điểm</div>
        <div className="col-span-5">Mục tiêu kiểm toán</div>
        <div className="col-span-3">Lỗ hổng phát hiện</div>
        <div className="col-span-2 text-right">Thời gian</div>
      </div>

      {/* Table Rows */}
      <div className="divide-y divide-white/[0.04] max-h-[420px] overflow-y-auto">
        {scans.map((scan) => {
          const gradeStyle = GRADE_COLORS[scan.grade] || GRADE_COLORS.F;

          return (
            <div
              key={scan.scan_id}
              onClick={() => onSelectScan(scan.scan_id)}
              className="grid grid-cols-12 gap-3 items-center px-4 py-2.5 text-xs font-mono text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-200 transition-colors cursor-pointer group select-none"
            >
              {/* Grade & Score */}
              <div className="col-span-4 sm:col-span-2 flex items-center gap-2">
                <span
                  className={`w-6 h-6 rounded flex items-center justify-center text-[11px] font-bold border ${gradeStyle}`}
                >
                  {scan.grade}
                </span>
                <span className="text-white font-semibold tabular-nums">{scan.score}/100</span>
              </div>

              {/* Target URL */}
              <div className="col-span-8 sm:col-span-5 min-w-0 pr-2">
                <div className="text-white font-semibold truncate group-hover:underline flex items-center gap-1">
                  <span>{scan.target_url}</span>
                  <ArrowUpRight className="w-3 h-3 text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>

              {/* Vulnerabilities Breakdown */}
              <div className="hidden sm:flex col-span-3 items-center gap-2 text-[11px]">
                {(scan.findings_count ?? (scan.critical + scan.high + scan.medium)) > 0 ? (
                  <span className="text-rose-400 font-semibold tabular-nums">
                    {scan.findings_count ?? (scan.critical + scan.high + scan.medium)} rủi ro
                  </span>
                ) : (
                  <span className="text-emerald-400">Không phát hiện</span>
                )}
              </div>

              {/* Timestamp & Remove */}
              <div className="hidden sm:flex col-span-2 justify-end items-center gap-3 text-[11px] text-zinc-500">
                <span>{new Date(scan.timestamp).toLocaleDateString("vi-VN")}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveScan(scan.scan_id);
                  }}
                  className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-rose-950/20 transition-colors"
                  title="Xóa phiên này"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
