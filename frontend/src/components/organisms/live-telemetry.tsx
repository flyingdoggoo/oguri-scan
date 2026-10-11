import { useEffect, useState } from "react";
import { Loader2, AlertOctagon, Terminal } from "lucide-react";
import { Button } from "../ui/button";
import { Kbd } from "../ui/kbd";

interface LiveTelemetryProps {
  targetUrl: string;
  progress: number;
  currentStep: string;
  onCancel: () => void;
  isCancelling?: boolean;
}

export function LiveTelemetry({
  targetUrl,
  progress,
  currentStep,
  onCancel,
  isCancelling = false,
}: LiveTelemetryProps) {
  const clamped = Math.min(100, Math.max(0, Math.round(progress)));
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((prev) => prev + 100);
    }, 100);
    return () => clearInterval(timer);
  }, []);

  // Lắng nghe phím Esc để hủy quét
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isCancelling) {
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel, isCancelling]);

  const formattedTime = (elapsed / 1000).toFixed(1) + "s";

  return (
    <div className="w-full max-w-2xl mx-auto my-12 p-5 sm:p-6 rounded-xl border border-white/[0.08] bg-[#0c0c0e]/90 shadow-2xl backdrop-blur-md">
      {/* Target URL & Timer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Loader2 className="w-3.5 h-3.5 text-zinc-300 animate-spin" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
              Live Telemetry
            </span>
          </div>
          <h2 className="text-base font-bold text-white font-mono truncate">
            {targetUrl}
          </h2>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right font-mono text-xs">
            <span className="text-zinc-500">Thời gian: </span>
            <span className="text-white font-bold tabular-nums">{formattedTime}</span>
          </div>

          <Button
            variant="destructive"
            size="sm"
            onClick={onCancel}
            disabled={isCancelling}
            className="gap-1.5"
          >
            <AlertOctagon className="w-3 h-3" />
            <span>{isCancelling ? "Đang hủy…" : "Hủy"}</span>
            <Kbd className="bg-red-950/60 border-red-900/40 text-red-300">Esc</Kbd>
          </Button>
        </div>
      </div>

      {/* Progress Bar 4px */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mb-2">
          <span>Tiến độ thực thi:</span>
          <span className="text-white font-bold tabular-nums">{clamped}%</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-zinc-800/80 overflow-hidden">
          <div
            className="h-full bg-white transition-all duration-300 rounded-full"
            style={{ width: `${clamped}%` }}
          />
        </div>
      </div>

      {/* Live Step Terminal Feed */}
      <div className="p-3 rounded-lg bg-black border border-white/[0.06] flex items-center gap-2 font-mono text-xs">
        <Terminal className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
        <span className="text-zinc-400 truncate">
          {currentStep || "Đang khởi tạo kết nối mạng…"}
        </span>
      </div>
    </div>
  );
}
