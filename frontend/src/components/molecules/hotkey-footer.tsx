import { Command } from "lucide-react";

interface HotkeyFooterProps {
  engineStatus?: string;
  onOpenPalette?: () => void;
}

export function HotkeyFooter({ engineStatus = "DAST Online", onOpenPalette }: HotkeyFooterProps) {
  return (
    <footer className="fixed bottom-0 left-0 right-0 h-9 bg-[#08080a]/95 backdrop-blur-md border-t border-white/[0.06] z-30 px-4 flex items-center justify-between text-[11px] font-mono text-zinc-400 select-none">
      {/* Left: Engine Telemetry Status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-zinc-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold">{engineStatus}</span>
        </div>
        <span className="text-zinc-600">|</span>
        <span className="text-zinc-500 hidden sm:inline">Scope Guard: Depth 1 • Non-Destructive</span>
      </div>

      {/* Right: Pro Hotkey Cheatsheet */}
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenPalette}
          className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
          title="Mở Command Palette"
        >
          <kbd className="px-1.5 py-0.5 rounded bg-zinc-900 border border-white/[0.1] text-[10px] text-zinc-300 flex items-center gap-0.5">
            <Command className="w-2.5 h-2.5" />K
          </kbd>
          <span className="hidden md:inline text-zinc-400">Lệnh</span>
        </button>

        <div className="flex items-center gap-1 text-zinc-500 hidden sm:flex">
          <kbd className="px-1.5 py-0.5 rounded bg-zinc-900 border border-white/[0.1] text-[10px] text-zinc-300">↑↓</kbd>
          <span>Chọn dòng</span>
        </div>

        <div className="flex items-center gap-1 text-zinc-500 hidden sm:flex">
          <kbd className="px-1.5 py-0.5 rounded bg-zinc-900 border border-white/[0.1] text-[10px] text-zinc-300">↵</kbd>
          <span>Xem chi tiết / Quét</span>
        </div>

        <div className="flex items-center gap-1 text-zinc-500">
          <kbd className="px-1.5 py-0.5 rounded bg-zinc-900 border border-white/[0.1] text-[10px] text-zinc-300">Esc</kbd>
          <span className="hidden md:inline">Đóng / Hủy</span>
        </div>
      </div>
    </footer>
  );
}
