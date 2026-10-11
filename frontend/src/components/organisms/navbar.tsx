import { Shield, History } from "lucide-react";
import { Button } from "../ui/button";

interface NavbarProps {
  onGoHome: () => void;
  onToggleHistory?: () => void;
  historyCount?: number;
}

export function Navbar({ onGoHome, onToggleHistory, historyCount = 0 }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-black/80 backdrop-blur-md no-print">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Brand Logo */}
        <div
          onClick={onGoHome}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          <div className="w-7 h-7 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:border-zinc-600 transition-colors">
            <Shield className="w-3.5 h-3.5 text-zinc-100" />
          </div>
          <div className="flex items-center gap-1.5 font-mono text-sm tracking-tight">
            <span className="font-bold text-white">OguriScan</span>
            <span className="text-zinc-600">/</span>
            <span className="text-xs text-zinc-400">DAST</span>
          </div>
        </div>

        {/* Engine Status & Quick Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-white/[0.06] bg-zinc-950 text-zinc-400 text-xs font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Engine Online</span>
          </div>

          {onToggleHistory && (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleHistory}
              aria-label="Xem lịch sử quét"
              className="gap-1.5"
            >
              <History className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden sm:inline">Lịch sử</span>
              {historyCount > 0 && (
                <span className="px-1 py-0.2 rounded bg-zinc-800 text-[10px] font-mono text-zinc-300">
                  {historyCount}
                </span>
              )}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
