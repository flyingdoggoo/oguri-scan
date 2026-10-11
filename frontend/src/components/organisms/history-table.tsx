import type { SavedScan } from "../../types/scan";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { History, Trash2, ArrowUpRight } from "lucide-react";

interface HistoryTableProps {
  history: SavedScan[];
  onSelectScan: (item: SavedScan) => void;
  onRemoveItem: (scanId: string) => void;
  onClearHistory: () => void;
}

export function HistoryTable({
  history,
  onSelectScan,
  onRemoveItem,
  onClearHistory,
}: HistoryTableProps) {
  if (history.length === 0) return null;

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) + " " + d.toLocaleDateString("vi-VN");
    } catch {
      return iso;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto my-8 p-4 sm:p-5 rounded-xl border border-white/[0.08] bg-[#0c0c0e]/80 backdrop-blur-md">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-zinc-400" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300">
            Lịch sử quét gần đây
          </h3>
          <span className="text-xs font-mono text-zinc-500">({history.length}/10)</span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onClearHistory}
          className="text-zinc-500 hover:text-rose-400 gap-1 text-xs"
        >
          <Trash2 className="w-3 h-3" />
          <span>Xóa tất cả</span>
        </Button>
      </div>

      <div className="space-y-1.5">
        {history.map((item) => (
          <div
            key={item.scan_id}
            className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-white/[0.04] bg-black/40 hover:border-white/[0.12] hover:bg-zinc-900/40 transition-all group"
          >
            {/* Click to open */}
            <div
              onClick={() => onSelectScan(item)}
              className="flex items-center gap-3 cursor-pointer min-w-0 flex-1"
            >
              <span className="w-6 h-6 rounded flex items-center justify-center font-mono font-bold text-xs bg-zinc-900 border border-zinc-700/80 text-white shrink-0">
                {item.grade}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-mono font-medium text-zinc-200 group-hover:text-white transition-colors truncate">
                    {item.target_url}
                  </p>
                  <ArrowUpRight className="w-3 h-3 text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </div>
                <div className="text-[11px] font-mono text-zinc-500">
                  {formatDate(item.timestamp)} • Điểm:{" "}
                  <span className="text-zinc-300 font-bold tabular-nums">{item.score}</span>/100
                </div>
              </div>
            </div>

            {/* Severity Pill & Delete */}
            <div className="flex items-center gap-2 shrink-0">
              {item.critical > 0 && (
                <Badge variant="critical" size="sm">
                  {item.critical} crit
                </Badge>
              )}
              {item.high > 0 && (
                <Badge variant="high" size="sm">
                  {item.high} high
                </Badge>
              )}
              {item.critical === 0 && item.high === 0 && (
                <Badge variant="passed" size="sm">
                  sạch
                </Badge>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemoveItem(item.scan_id)}
                aria-label="Xóa lượt quét này"
                className="text-zinc-600 hover:text-rose-400 w-7 h-7"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
