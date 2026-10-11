import { useState } from "react";
import { Copy, Check, Terminal } from "lucide-react";
import { cn } from "../../lib/utils";

interface CodeTerminalProps {
  title?: string;
  code: string;
  language?: string;
  className?: string;
}

export function CodeTerminal({ title = "Bằng chứng kỹ thuật", code, language = "http", className }: CodeTerminalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("rounded-lg border border-white/[0.08] bg-[#050507] overflow-hidden", className)}>
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/[0.06] bg-[#09090b] text-zinc-400 text-xs">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-zinc-500" />
          <span className="font-mono text-[11px] text-zinc-300 font-medium">{title}</span>
          {language && (
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-zinc-800/80 text-zinc-400">
              {language}
            </span>
          )}
        </div>

        <button
          onClick={handleCopy}
          aria-label="Sao chép nội dung"
          className="inline-flex items-center gap-1 text-[11px] font-mono text-zinc-400 hover:text-white px-2 py-0.5 rounded hover:bg-zinc-800 transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Đã chép</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 text-zinc-400" />
              <span>Chép</span>
            </>
          )}
        </button>
      </div>

      <pre className="p-3 font-mono text-xs text-zinc-300 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed select-text">
        <code>{code}</code>
      </pre>
    </div>
  );
}
