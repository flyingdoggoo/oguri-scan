import { useState } from "react";
import { Globe, ArrowRight, ShieldCheck, Command, Zap } from "lucide-react";

interface SmartOmnibarProps {
  onStartScan: (url: string) => void;
  isLoading: boolean;
  onOpenPalette?: () => void;
  scanProfile?: "quick" | "full";
  onProfileChange?: (profile: "quick" | "full") => void;
  activeRulesCount?: number;
}

const PRESETS = [
  { label: "example.com", url: "https://example.com", note: "Standard IANA" },
  { label: "ginandjuice.shop", url: "https://ginandjuice.shop", note: "PortSwigger Lab" },
  { label: "testphp.vulnweb.com", url: "http://testphp.vulnweb.com", note: "Acunetix Lab" },
];

export function SmartOmnibar({
  onStartScan,
  isLoading,
  onOpenPalette,
  scanProfile = "full",
  onProfileChange,
  activeRulesCount = 28,
}: SmartOmnibarProps) {
  const [url, setUrl] = useState("");
  const [protocol, setProtocol] = useState<"https://" | "http://">("https://");

  // Smart URL parser (auto-strips protocol on paste/type and updates protocol badge)
  const handleUrlChange = (raw: string) => {
    let cleaned = raw.trim();
    if (cleaned.startsWith("https://")) {
      setProtocol("https://");
      cleaned = cleaned.replace(/^https:\/\//, "");
    } else if (cleaned.startsWith("http://")) {
      setProtocol("http://");
      cleaned = cleaned.replace(/^http:\/\//, "");
    }
    setUrl(cleaned);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || isLoading) return;

    let target = url.trim();
    if (!target.startsWith("http://") && !target.startsWith("https://")) {
      target = `${protocol}${target}`;
    }
    onStartScan(target);
  };

  const handleSelectPreset = (presetUrl: string) => {
    handleUrlChange(presetUrl);
    onStartScan(presetUrl);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-3">
      {/* Profile Selector Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs font-mono">
        {/* Profile Switcher Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#09090b] border border-white/[0.08]">
          <button
            type="button"
            onClick={() => onProfileChange?.("full")}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 text-[11px] font-medium ${
              scanProfile === "full"
                ? "bg-white text-black font-semibold shadow"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Toàn Diện (Full Audit)</span>
            <span className="text-[10px] opacity-70">~30s</span>
          </button>

          <button
            type="button"
            onClick={() => onProfileChange?.("quick")}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 text-[11px] font-medium ${
              scanProfile === "quick"
                ? "bg-white text-black font-semibold shadow"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Nhanh (Headers & TLS)</span>
            <span className="text-[10px] opacity-70">~5s</span>
          </button>
        </div>

        {/* Scope Count */}
        <div className="hidden sm:flex items-center gap-2 text-[11px] text-zinc-500">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>Kích hoạt: <strong className="text-zinc-200">{activeRulesCount}</strong> / 32 bài test</span>
        </div>
      </div>

      {/* Main Omnibar Box */}
      <form
        onSubmit={handleSubmit}
        className="relative flex items-center bg-[#09090b] border border-white/[0.1] hover:border-white/[0.2] focus-within:border-white/[0.3] rounded-xl p-1.5 transition-all shadow-xl backdrop-blur-md"
      >
        {/* Protocol Selector */}
        <div className="hidden sm:flex items-center shrink-0 pl-2 pr-1">
          <button
            type="button"
            onClick={() => setProtocol(protocol === "https://" ? "http://" : "https://")}
            className="px-2 py-1 rounded-md text-[11px] font-mono text-zinc-400 hover:text-white bg-zinc-900/80 border border-white/[0.06] transition-colors cursor-pointer"
            title="Chuyển đổi giao thức"
          >
            {protocol}
          </button>
        </div>

        {/* Globe icon on mobile */}
        <div className="sm:hidden pl-2 text-zinc-500">
          <Globe className="w-4 h-4" />
        </div>

        {/* URL Input */}
        <input
          type="text"
          value={url}
          onChange={(e) => handleUrlChange(e.target.value)}
          placeholder="target-domain.com hoặc dán URL..."
          disabled={isLoading}
          className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder-zinc-500 font-mono focus:outline-none min-w-0"
        />

        {/* Right Action Cluster */}
        <div className="flex items-center gap-1.5 shrink-0 pr-1">
          {/* Depth Badge */}
          <div className="hidden md:flex items-center gap-1 px-2 py-1 rounded bg-zinc-900 border border-white/[0.06] text-[10px] font-mono text-zinc-400 select-none">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>Depth 1 Guard</span>
          </div>

          {/* Command Palette Trigger */}
          {onOpenPalette && (
            <button
              type="button"
              onClick={onOpenPalette}
              className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-white/[0.08] text-[10px] font-mono text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              title="Mở Command Palette (Ctrl+K)"
            >
              <Command className="w-2.5 h-2.5" />
              <span>K</span>
            </button>
          )}

          {/* Submit Scan Button */}
          <button
            type="submit"
            disabled={!url.trim() || isLoading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white text-black hover:bg-zinc-200 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none text-xs font-mono font-semibold transition-all shadow-md cursor-pointer"
          >
            {isLoading ? (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>Rà soát...</span>
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <span>Rà soát</span>
                <ArrowRight className="w-3 h-3" />
              </span>
            )}
          </button>
        </div>
      </form>

      {/* Quick Target Presets Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs font-mono text-zinc-400">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] text-zinc-500">Mục tiêu nhanh:</span>
          {PRESETS.map((p) => (
            <button
              key={p.url}
              type="button"
              onClick={() => handleSelectPreset(p.url)}
              disabled={isLoading}
              className="px-2 py-0.5 rounded text-[11px] bg-zinc-900/60 hover:bg-white/[0.08] hover:text-white border border-white/[0.06] text-zinc-300 transition-all cursor-pointer flex items-center gap-1"
            >
              <span>{p.label}</span>
              <span className="text-[9px] text-zinc-500 hidden sm:inline">({p.note})</span>
            </button>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-1 text-[11px] text-zinc-500">
          <span>Nhấn</span>
          <kbd className="px-1 py-0.2 rounded bg-zinc-900 border border-white/[0.08] text-[9px] text-zinc-300">
            ↵ Enter
          </kbd>
          <span>để bắt đầu</span>
        </div>
      </div>
    </div>
  );
}
