import React from "react";
import { cn } from "../../lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export function Card({ className, hoverable, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-white/[0.07] bg-[#0c0c0e]/90 text-zinc-100 shadow-sm backdrop-blur-sm",
        hoverable && "transition-all hover:border-white/[0.14] hover:bg-[#111114]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-4 sm:p-5 pb-2 sm:pb-3 flex flex-col gap-1", className)} {...props}>
      {children}
    </div>
  );
}

export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-4 sm:p-5 pt-0", className)} {...props}>
      {children}
    </div>
  );
}
