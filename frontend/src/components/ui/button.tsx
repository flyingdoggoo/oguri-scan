import React from "react";
import { cn } from "../../lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "secondary", size = "md", isLoading, disabled, children, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all select-none disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 active:scale-[0.98]";

    const variants = {
      // Primary: Đen trắng sắc nét (High-contrast monochrome)
      primary:
        "bg-white text-zinc-950 hover:bg-zinc-200 shadow-sm border border-transparent font-semibold",
      // Secondary: Bề mặt xám đen viền mờ hairline
      secondary:
        "bg-zinc-900 text-zinc-100 hover:bg-zinc-800 hover:text-white border border-zinc-800/80 shadow-sm",
      // Outline: Viền kính mỏng tối giản
      outline:
        "bg-transparent text-zinc-300 hover:text-white hover:bg-zinc-900/60 border border-zinc-800",
      // Ghost: Không viền
      ghost:
        "bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-900/50",
      // Destructive: Đỏ dịu tinh tế
      destructive:
        "bg-red-950/40 text-red-400 border border-red-900/50 hover:bg-red-900/30 hover:border-red-800",
    };

    const sizes = {
      sm: "h-8 px-3 text-xs rounded-md gap-1.5",
      md: "h-9 px-4 text-xs sm:text-sm rounded-lg gap-2",
      lg: "h-11 px-5 text-sm rounded-lg gap-2",
      icon: "h-8 w-8 rounded-md p-0 flex items-center justify-center",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
