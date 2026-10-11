import React from "react";
import { cn } from "../../lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "outline" | "critical" | "high" | "medium" | "low" | "passed" | "neutral";
  size?: "sm" | "md";
}

export function Badge({ className, variant = "default", size = "sm", children, ...props }: BadgeProps) {
  const baseStyles =
    "inline-flex items-center font-mono font-medium tracking-tight rounded border transition-colors select-none";

  const sizes = {
    sm: "px-2 py-0.5 text-[10px] gap-1",
    md: "px-2.5 py-1 text-xs gap-1.5",
  };

  const variants = {
    // Monochrome Neutral
    default: "bg-zinc-900/90 text-zinc-300 border-zinc-800",
    outline: "bg-transparent text-zinc-400 border-zinc-800/80",
    neutral: "bg-zinc-800/60 text-zinc-200 border-zinc-700/60",
    // Security Severity Accents (Tối giản, dịu mắt, không loè loẹt)
    critical: "bg-red-950/30 text-rose-400 border-rose-900/40",
    high: "bg-orange-950/30 text-amber-400 border-amber-900/40",
    medium: "bg-yellow-950/30 text-yellow-400 border-yellow-900/40",
    low: "bg-blue-950/30 text-sky-400 border-sky-900/40",
    passed: "bg-emerald-950/30 text-emerald-400 border-emerald-900/40",
  };

  return (
    <span className={cn(baseStyles, sizes[size], variants[variant], className)} {...props}>
      {children}
    </span>
  );
}
