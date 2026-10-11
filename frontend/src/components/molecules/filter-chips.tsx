import { cn } from "../../lib/utils";

interface FilterOption {
  key: string;
  label: string;
  count: number;
}

interface FilterChipsProps {
  options: FilterOption[];
  activeKey: string;
  onChange: (key: string) => void;
  className?: string;
}

export function FilterChips({ options, activeKey, onChange, className }: FilterChipsProps) {
  return (
    <div
      role="tablist"
      aria-label="Bộ lọc lỗ hổng an ninh"
      className={cn("flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none", className)}
    >
      {options.map((opt) => {
        const isActive = activeKey === opt.key;
        return (
          <button
            key={opt.key}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(opt.key)}
            className={cn(
              "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all select-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400",
              isActive
                ? "bg-zinc-800 text-white shadow-xs border border-zinc-700/80 font-semibold"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 border border-transparent"
            )}
          >
            <span>{opt.label}</span>
            <span
              className={cn(
                "px-1.5 py-0.2 rounded font-mono text-[10px] tabular-nums",
                isActive ? "bg-zinc-900 text-zinc-200" : "bg-zinc-900/80 text-zinc-500"
              )}
            >
              {opt.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
