import React from "react";
import { cn } from "../../lib/utils";

interface MetricCardProps {
  label: string;
  value: number;
  total?: number;
  variant?: "critical" | "high" | "medium" | "low" | "passed" | "neutral";
  icon?: React.ReactNode;
  className?: string;
}

export function MetricCard({ label, value, total, variant = "neutral", icon, className }: MetricCardProps) {
  const dotVariants = {
    critical: "bg-rose-500",
    high: "bg-amber-500",
    medium: "bg-yellow-500",
    low: "bg-sky-500",
    passed: "bg-emerald-500",
    neutral: "bg-zinc-400",
  };

  const textVariants = {
    critical: "text-rose-400",
    high: "text-amber-400",
    medium: "text-yellow-400",
    low: "text-sky-400",
    passed: "text-emerald-400",
    neutral: "text-zinc-200",
  };

  return (
    <div
      className={cn(
        "p-3 sm:p-4 rounded-xl border border-white/[0.07] bg-[#0c0c0e]/80 flex flex-col justify-between transition-colors hover:border-white/[0.12]",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotVariants[variant])} />
          <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 truncate">
            {label}
          </span>
        </div>
        {icon && <span className="text-zinc-500">{icon}</span>}
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className={cn("text-2xl sm:text-3xl font-mono font-bold tabular-nums tracking-tight", textVariants[variant])}>
          {value}
        </span>
        {total !== undefined && (
          <span className="text-xs font-mono text-zinc-500 tabular-nums">
            / {total}
          </span>
        )}
      </div>
    </div>
  );
}
