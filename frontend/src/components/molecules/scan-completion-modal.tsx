import { useState, useEffect } from "react";
import {
  X,
  ArrowRight,
  Download,
  Share2,
  FileCode2,
} from "lucide-react";
import type { ScanResult } from "../../types/scan";

interface ScanCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  scanResult: ScanResult;
  onExportJson?: () => void;
  onShare?: () => void;
}

export function ScanCompletionModal({
  isOpen,
  onClose,
  scanResult,
  onExportJson,
  onShare,
}: ScanCompletionModalProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  const finalScore = scanResult?.summary?.score ?? 0;
  const grade = scanResult?.summary?.grade ?? "C";
  const { critical, high, medium, low, passed, total_tests } = scanResult?.summary || {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    passed: 0,
    total_tests: 32,
  };

  const jsCount = scanResult?.recon_data?.js_bundles?.length || 0;
  const endpointCount = scanResult?.recon_data?.discovered_endpoints?.length || 0;

  // Animated Count-Up Effect for Security Score
  useEffect(() => {
    if (!isOpen) {
      setAnimatedScore(0);
      return;
    }

    const duration = 1000; // 1 second
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = Math.floor(ease * finalScore);
      setAnimatedScore(current);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setAnimatedScore(finalScore);
      }
    };

    const animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [isOpen, finalScore]);

  // Handle ESC key to dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen && e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const gradeColor =
    grade === "A"
      ? "text-emerald-400 border-emerald-500/40 bg-emerald-500/10 shadow-[0_0_30px_rgba(16,185,129,0.25)]"
      : grade === "B"
      ? "text-teal-400 border-teal-500/40 bg-teal-500/10 shadow-[0_0_30px_rgba(20,184,166,0.25)]"
      : grade === "C"
      ? "text-amber-400 border-amber-500/40 bg-amber-500/10 shadow-[0_0_30px_rgba(245,158,11,0.25)]"
      : grade === "D"
      ? "text-orange-400 border-orange-500/40 bg-orange-500/10 shadow-[0_0_30px_rgba(249,115,22,0.25)]"
      : "text-rose-400 border-rose-500/40 bg-rose-500/10 shadow-[0_0_30px_rgba(244,63,94,0.25)]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 font-mono">
      <div className="relative w-full max-w-lg bg-[#09090b] border border-white/[0.12] rounded-3xl p-6 sm:p-7 shadow-2xl text-white space-y-6 animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-zinc-400 hover:text-white bg-zinc-900 border border-white/[0.08] transition-colors cursor-pointer"
          title="Đóng (Esc)"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Top Header & Status */}
        <div className="flex items-center gap-2.5 text-xs text-zinc-400">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-semibold text-emerald-400 uppercase tracking-wider">
            Rà Soát Hoàn Tất 100%
          </span>
          <span>•</span>
          <span className="truncate max-w-[200px] text-zinc-300">
            {scanResult.target_url}
          </span>
        </div>

        {/* Main Score Hero Section with Dynamic Aura */}
        <div className="flex items-center justify-between gap-6 py-2 border-y border-white/[0.06]">
          <div className="space-y-1">
            <div className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">
              Điểm An Ninh Tổng Thể
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-white tabular-nums tracking-tight">
                {animatedScore}
              </span>
              <span className="text-zinc-500 text-lg font-bold">/100</span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Đã rà soát {total_tests} quy tắc kiểm toán DAST
            </p>
          </div>

          {/* Large Glowing Grade Badge */}
          <div
            className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center border-2 shrink-0 transition-transform ${gradeColor}`}
          >
            <span className="text-3xl font-black">{grade}</span>
            <span className="text-[9px] uppercase tracking-wider font-bold opacity-80">
              Grade
            </span>
          </div>
        </div>

        {/* Threat Breakdown Grid */}
        <div className="grid grid-cols-5 gap-2 text-center text-xs">
          <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-rose-500/20">
            <div className="text-base font-black text-rose-400">{critical}</div>
            <div className="text-[9px] text-zinc-400 uppercase mt-0.5">Critical</div>
          </div>
          <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-orange-500/20">
            <div className="text-base font-black text-orange-400">{high}</div>
            <div className="text-[9px] text-zinc-400 uppercase mt-0.5">High</div>
          </div>
          <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-amber-500/20">
            <div className="text-base font-black text-amber-400">{medium}</div>
            <div className="text-[9px] text-zinc-400 uppercase mt-0.5">Medium</div>
          </div>
          <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-blue-500/20">
            <div className="text-base font-black text-blue-400">{low}</div>
            <div className="text-[9px] text-zinc-400 uppercase mt-0.5">Low</div>
          </div>
          <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-emerald-500/20">
            <div className="text-base font-black text-emerald-400">{passed}</div>
            <div className="text-[9px] text-zinc-400 uppercase mt-0.5">Passed</div>
          </div>
        </div>

        {/* Recon Intelligence Highlight */}
        <div className="p-3 rounded-xl bg-zinc-900/50 border border-white/[0.06] flex items-center justify-between text-xs text-zinc-300">
          <div className="flex items-center gap-2">
            <FileCode2 className="w-4 h-4 text-emerald-400" />
            <span>Đã trích xuất & kiểm toán:</span>
          </div>
          <div className="font-bold text-white flex items-center gap-3">
            <span>{jsCount} Bundle JS</span>
            <span>•</span>
            <span>{endpointCount} Endpoints</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl bg-white text-black font-bold hover:bg-zinc-200 transition-all cursor-pointer flex items-center justify-center gap-2 text-xs shadow-lg"
          >
            <span>Khám Phá Chi Tiết Báo Cáo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {onExportJson && (
            <button
              onClick={onExportJson}
              className="p-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/[0.08] text-zinc-300 hover:text-white transition-colors cursor-pointer"
              title="Xuất JSON"
            >
              <Download className="w-4 h-4" />
            </button>
          )}

          {onShare && (
            <button
              onClick={onShare}
              className="p-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/[0.08] text-zinc-300 hover:text-white transition-colors cursor-pointer"
              title="Sao chép link chia sẻ"
            >
              <Share2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
