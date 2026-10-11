import React from "react";
import { cn } from "../../lib/utils";

export interface KbdProps extends React.HTMLAttributes<HTMLElement> {}

export function Kbd({ className, children, ...props }: KbdProps) {
  return (
    <kbd
      className={cn(
        "inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-mono font-medium text-zinc-400 bg-zinc-900 border border-zinc-800 rounded shadow-xs select-none",
        className
      )}
      {...props}
    >
      {children}
    </kbd>
  );
}
