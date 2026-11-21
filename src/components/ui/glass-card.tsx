import * as React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "subtle" | "glow";
  interactive?: boolean;
}

export function GlassCard({
  className,
  variant = "default",
  interactive = false,
  children,
  ...props
}: GlassCardProps) {
  return (
    <div
      className={twMerge(
        clsx(
          "relative rounded-2xl border transition-all duration-300",
          // Glassmorphism styling matching dashboard-ui.png reference
          {
            "bg-white/75 backdrop-blur-xl border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]":
              variant === "default",
            "bg-white/90 backdrop-blur-2xl border-white/80 shadow-[0_20px_50px_rgba(8,112,184,0.08)]":
              variant === "elevated",
            "bg-white/50 backdrop-blur-md border-white/40 shadow-sm":
              variant === "subtle",
            "bg-gradient-to-br from-white/90 via-sky-50/50 to-white/80 backdrop-blur-xl border-sky-200/50 shadow-[0_10px_35px_rgba(56,189,248,0.12)]":
              variant === "glow",
          },
          interactive && "hover:-translate-y-1 hover:shadow-xl hover:border-sky-300/60 cursor-pointer",
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
}
