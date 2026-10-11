import React from "react";
import { Shield } from "lucide-react";

interface ConsoleLayoutProps {
  children: React.ReactNode;
  onGoHome: () => void;
}

export function ConsoleLayout({ children, onGoHome }: ConsoleLayoutProps) {
  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans selection:bg-white selection:text-black relative">
      {/* Background Cyber Grid */}
      <div className="absolute inset-0 bg-cyber-grid pointer-events-none opacity-40 z-0" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-96 bg-radial-spotlight pointer-events-none z-0" />

      {/* Console Top Header */}
      <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-black/85 backdrop-blur-md no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-13 flex items-center justify-between">
          <div
            onClick={onGoHome}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <div className="w-7 h-7 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:border-zinc-500 transition-colors">
              <Shield className="w-3.5 h-3.5 text-zinc-100" />
            </div>
            <div className="flex items-center gap-1.5 font-mono text-xs sm:text-sm tracking-tight">
              <span className="font-bold text-white">OguriScan</span>
              <span className="text-zinc-600">/</span>
              <span className="text-zinc-400">Security Studio</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-white/[0.06] bg-zinc-950 text-zinc-400 text-[11px] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>DAST Engine Online</span>
            </div>
            <span className="hidden sm:inline-block text-[11px] font-mono text-zinc-600">
              v1.0.0
            </span>
          </div>
        </div>
      </header>

      {/* Main Console Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 z-10 relative">
        {children}
      </main>

      {/* Subtle Footer */}
      <footer className="border-t border-white/[0.06] bg-black/60 py-4 text-center text-[11px] font-mono text-zinc-600 no-print z-10 relative">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 OguriScan Security Operations Console</p>
          <p>Local-first DAST Engine • Safe Scope Depth 1 • Circuit Breaker Guard</p>
        </div>
      </footer>
    </div>
  );
}
