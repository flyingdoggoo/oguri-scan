import { Shield, Command } from "lucide-react";
import { HotkeyFooter } from "../molecules/hotkey-footer";

interface WorkspaceLayoutProps {
  children: React.ReactNode;
  onGoHome: () => void;
  onOpenPalette?: () => void;
  engineStatus?: string;
}

export function WorkspaceLayout({
  children,
  onGoHome,
  onOpenPalette,
  engineStatus = "DAST Online",
}: WorkspaceLayoutProps) {
  return (
    <div className="min-h-screen bg-[#070709] text-zinc-100 flex flex-col font-sans selection:bg-white/20 selection:text-white">
      {/* Cyber Grid background */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />

      {/* Top Header */}
      <header className="sticky top-0 z-30 h-12 bg-[#08080a]/90 backdrop-blur-md border-b border-white/[0.08] px-4 sm:px-6 flex items-center justify-between">
        {/* Brand */}
        <div
          onClick={onGoHome}
          className="flex items-center gap-2 cursor-pointer group select-none"
        >
          <div className="w-6 h-6 rounded-md bg-white text-black flex items-center justify-center font-bold">
            <Shield className="w-3.5 h-3.5 fill-black" />
          </div>
          <span className="font-mono font-bold text-sm tracking-tight text-white group-hover:text-zinc-300 transition-colors">
            OguriScan
          </span>
          <span className="text-[10px] font-mono text-zinc-500 hidden sm:inline">
            / Command Studio
          </span>
        </div>

        {/* Center Engine Telemetry Pill */}
        <div className="hidden md:flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-zinc-900/80 border border-white/[0.06] text-[10px] font-mono text-zinc-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>DAST Engine 1.0</span>
          <span className="text-zinc-600">•</span>
          <span className="text-zinc-500">32 Active Rules</span>
        </div>

        {/* Right Action Palette Trigger */}
        <div className="flex items-center gap-2">
          {onOpenPalette && (
            <button
              onClick={onOpenPalette}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-white/[0.08] text-xs font-mono text-zinc-300 hover:text-white transition-colors cursor-pointer"
              title="Mở Command Palette (Ctrl+K)"
            >
              <Command className="w-3 h-3 text-zinc-400" />
              <span className="hidden sm:inline">Lệnh</span>
              <kbd className="text-[10px] text-zinc-500 font-mono">⌘K</kbd>
            </button>
          )}
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-5 pb-16 relative z-10">
        {children}
      </main>

      {/* Pro Tool Hotkey Footer */}
      <HotkeyFooter engineStatus={engineStatus} onOpenPalette={onOpenPalette} />
    </div>
  );
}
