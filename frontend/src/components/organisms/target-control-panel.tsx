import React, { useState } from "react";
import { Play, Globe, History, Trash2, ArrowUpRight, Zap, CheckCircle2 } from "lucide-react";
import { Button } from "../ui/button";
import { Kbd } from "../ui/kbd";
import type { SavedScan } from "../../types/scan";

interface TargetControlPanelProps {
  onStartScan: (url: string) => void;
  isLoading: boolean;
  history: SavedScan[];
  currentScanId?: string | null;
  onSelectHistory: (item: SavedScan) => void;
  onRemoveHistory: (scanId: string) => void;
  onClearHistory: () => void;
}

const PRESETS = [
  { label: "example.com", url: "https://example.com" },
  { label: "ginandjuice.shop", url: "https://ginandjuice.shop" },
  { label: "testphp.vulnweb.com", url: "http://testphp.vulnweb.com" },
];

export function TargetControlPanel({
  onStartScan,
  isLoading,
  history,
  currentScanId,
  onSelectHistory,
  onRemoveHistory,
  onClearHistory,
}: TargetControlPanelProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    const trimmed = url.trim();
    if (!trimmed) {
      setError("Vui lòng nhập URL mục tiêu.");
      return;
    }

    let finalUrl = trimmed;
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = "https://" + finalUrl;
    }

    try {
      const parsed = new URL(finalUrl);
      if (!parsed.hostname.includes(".")) {
        setError("Tên miền không hợp lệ.");
        return;
      }
    } catch {
      setError("URL không đúng định dạng.");
      return;
    }

    onStartScan(finalUrl);
  };

  const handleSelectPreset = (presetUrl: string) => {
    setUrl(presetUrl);
    setError(null);
    onStartScan(presetUrl);
  };

  return (
    <div className="flex flex-col h-full space-y-5">
      {/* Target Controller Card */}
      <div className="p-4 rounded-xl border border-white/[0.08] bg-[#0c0c0e]/90 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 font-mono text-xs text-zinc-300 font-bold uppercase tracking-wider">
            <Globe className="w-3.5 h-3.5 text-zinc-400" />
            <span>Target Inspector</span>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
            DAST Mode
          </span>
        </div>

        {/* URL Input Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <input
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (error) setError(null);
              }}
              placeholder="https://target-domain.com"
              disabled={isLoading}
              spellCheck={false}
              autoComplete="off"
              className="w-full bg-black border border-white/[0.1] rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-white/[0.3] tracking-tight transition-colors"
            />
          </div>

          {error && (
            <p className="text-rose-400 text-[11px] flex items-center gap-1 font-mono">
              <span className="w-1 h-1 rounded-full bg-rose-400" />
              {error}
            </p>
          )}

          <div className="flex items-center gap-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isLoading}
              className="w-full justify-center gap-1.5 font-mono text-xs uppercase tracking-wider"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>{isLoading ? "Đang quét…" : "Initiate Scan"}</span>
            </Button>
            <Kbd className="shrink-0 h-9 px-2">↵</Kbd>
          </div>
        </form>

        {/* Quick Presets */}
        <div className="mt-4 pt-3 border-t border-white/[0.06]">
          <div className="flex items-center gap-1 text-[11px] font-mono text-zinc-500 mb-2">
            <Zap className="w-3 h-3 text-zinc-400" />
            <span>Quick Targets:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => handleSelectPreset(p.url)}
                disabled={isLoading}
                className="px-2 py-0.5 rounded border border-white/[0.06] bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-white font-mono text-[10px] transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scope Parameters */}
        <div className="mt-3 pt-3 border-t border-white/[0.06] grid grid-cols-2 gap-2 text-[10px] font-mono text-zinc-400">
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
            <span>Crawl Depth: 1</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
            <span>Timeout: 60s</span>
          </div>
        </div>
      </div>

      {/* Session History Drawer (Ngay bên dưới cột trái!) */}
      <div className="flex-1 p-4 rounded-xl border border-white/[0.08] bg-[#0c0c0e]/90 flex flex-col min-h-[320px]">
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <History className="w-3.5 h-3.5 text-zinc-400" />
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300">
              Scans History
            </h4>
            <span className="text-[10px] font-mono text-zinc-500">
              ({history.length})
            </span>
          </div>

          {history.length > 0 && (
            <button
              onClick={onClearHistory}
              aria-label="Xóa tất cả lịch sử"
              className="text-zinc-600 hover:text-rose-400 text-[11px] font-mono transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {/* History List */}
        <div className="space-y-1.5 overflow-y-auto max-h-[380px] scrollbar-thin pr-1 flex-1">
          {history.map((item) => {
            const isSelected = currentScanId === item.scan_id;
            return (
              <div
                key={item.scan_id}
                onClick={() => onSelectHistory(item)}
                className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-2 group select-none ${
                  isSelected
                    ? "border-white/[0.3] bg-zinc-900"
                    : "border-white/[0.04] bg-black/40 hover:border-white/[0.1] hover:bg-zinc-900/50"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded flex items-center justify-center font-mono font-bold text-[10px] bg-zinc-900 border border-zinc-700/80 text-white shrink-0">
                      {item.grade}
                    </span>
                    <p className="text-xs font-mono font-medium text-zinc-200 group-hover:text-white truncate">
                      {item.target_url.replace(/^https?:\/\//, "")}
                    </p>
                  </div>
                  <div className="text-[10px] font-mono text-zinc-500 mt-1 flex items-center gap-2">
                    <span>Điểm: {item.score}/100</span>
                    {item.critical > 0 && (
                      <span className="text-rose-400">{item.critical} crit</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <ArrowUpRight className="w-3 h-3 text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveHistory(item.scan_id);
                    }}
                    aria-label="Xóa mục này"
                    className="p-1 text-zinc-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}

          {history.length === 0 && (
            <div className="text-center py-10 text-zinc-600 text-xs font-mono">
              Chưa có phiên quét nào.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
