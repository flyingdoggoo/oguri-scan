import React from "react";
import { Navbar } from "../organisms/navbar";

interface DashboardLayoutProps {
  children: React.ReactNode;
  onGoHome: () => void;
  onToggleHistory?: () => void;
  historyCount?: number;
}

export function DashboardLayout({
  children,
  onGoHome,
  onToggleHistory,
  historyCount = 0,
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans selection:bg-white selection:text-black relative">
      {/* Background Cyber Grid & Radial Spotlight */}
      <div className="absolute inset-0 bg-cyber-grid pointer-events-none opacity-40 z-0" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-96 bg-radial-spotlight pointer-events-none z-0" />

      {/* Navbar */}
      <Navbar
        onGoHome={onGoHome}
        onToggleHistory={onToggleHistory}
        historyCount={historyCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 z-10 relative">
        {children}
      </main>

      {/* Ultra-minimal Footer */}
      <footer className="border-t border-white/[0.06] bg-black/60 py-5 text-center text-xs font-mono text-zinc-600 no-print z-10 relative">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 OguriScan • Dynamic Application Security Testing</p>
          <p className="text-zinc-600">Local-first DAST Engine • Safe Scope Depth 1</p>
        </div>
      </footer>
    </div>
  );
}
