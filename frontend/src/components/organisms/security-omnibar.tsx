import React, { useState } from "react";
import { ArrowRight, Globe, Loader2, Zap } from "lucide-react";
import { Button } from "../ui/button";
import { Kbd } from "../ui/kbd";

interface SecurityOmnibarProps {
  onStartScan: (url: string) => void;
  isLoading: boolean;
}

const PRESETS = [
  { label: "example.com", url: "https://example.com" },
  { label: "ginandjuice.shop", url: "https://ginandjuice.shop" },
  { label: "testphp.vulnweb.com", url: "http://testphp.vulnweb.com" },
];

export function SecurityOmnibar({ onStartScan, isLoading }: SecurityOmnibarProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    const trimmed = url.trim();
    if (!trimmed) {
      setError("Vui lòng nhập địa chỉ website cần rà soát an ninh.");
      return;
    }

    let finalUrl = trimmed;
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = "https://" + finalUrl;
    }

    try {
      const parsed = new URL(finalUrl);
      if (!parsed.hostname.includes(".")) {
        setError("Tên miền không hợp lệ (ví dụ: example.com hoặc api.myweb.vn).");
        return;
      }
    } catch {
      setError("Địa chỉ URL không đúng định dạng chuẩn.");
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
    <div className="w-full max-w-3xl mx-auto py-10 sm:py-16 text-center">
      {/* Title & Tagline sắc nét Monochrome */}
      <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-3 text-balance">
        Dynamic Application Security Testing
      </h1>
      <p className="text-zinc-400 text-sm sm:text-base max-w-xl mx-auto mb-8 font-normal leading-relaxed">
        Rà soát tự động 28 bài kiểm tra thực chiến: XSS, SQLi, rò rỉ khóa API, CORS và TLS. Nhận báo cáo chi tiết kèm mã nguồn khắc phục trong 60 giây.
      </p>

      {/* Terminal Command Omnibar */}
      <form onSubmit={handleSubmit} className="relative mb-4">
        <div className="relative flex items-center p-1.5 rounded-xl border border-white/[0.12] bg-[#0c0c0e]/90 shadow-2xl backdrop-blur-md focus-within:border-white/[0.3] transition-all">
          <div className="flex items-center w-full pl-3 gap-2 min-w-0">
            <Globe className="w-4 h-4 text-zinc-500 shrink-0" />
            <input
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (error) setError(null);
              }}
              placeholder="https://your-domain.com"
              disabled={isLoading}
              spellCheck={false}
              autoComplete="off"
              className="w-full bg-transparent text-white placeholder-zinc-600 text-sm sm:text-base focus:outline-none disabled:opacity-50 font-mono tracking-tight"
            />
          </div>

          <div className="flex items-center gap-1.5 shrink-0 pr-1">
            <Kbd className="hidden sm:inline-flex">↵ Enter</Kbd>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isLoading}
              className="px-4"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang quét…</span>
                </>
              ) : (
                <>
                  <span>Bắt đầu</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </Button>
          </div>
        </div>

        {error && (
          <p className="text-rose-400 text-xs mt-2 text-left px-2 flex items-center gap-1.5 animate-in-view">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            {error}
          </p>
        )}
      </form>

      {/* Quick Try Presets */}
      <div className="flex flex-wrap items-center justify-center gap-2 text-xs mb-8">
        <span className="text-zinc-500 flex items-center gap-1">
          <Zap className="w-3 h-3 text-zinc-400" />
          Mục tiêu mẫu:
        </span>
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => handleSelectPreset(preset.url)}
            disabled={isLoading}
            className="px-2.5 py-1 rounded-md border border-white/[0.06] bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 font-mono text-[11px] hover:border-zinc-700 transition-colors disabled:opacity-50"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Telemetry Scope Specifications */}
      <div className="inline-flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11px] font-mono text-zinc-500 border-t border-white/[0.06] pt-4">
        <span>28 Bài kiểm tra thực chiến</span>
        <span>•</span>
        <span>Crawler Depth = 1</span>
        <span>•</span>
        <span>Timeout 60s</span>
        <span>•</span>
        <span>Circuit Breaker Active</span>
      </div>
    </div>
  );
}
