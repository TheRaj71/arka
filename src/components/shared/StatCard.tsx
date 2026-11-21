"use client";

import React from "react";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

export interface StatCardProps {
  label: string;
  value: string | number | { display: string; exact: string };
  exactTooltip?: string;
  helperText?: string;
  variant?: "default" | "highlight" | "warning";
  change?: {
    value: string;
    trend: "up" | "down" | "neutral";
    isPositive?: boolean; // green if positive, red if negative
    periodText?: string;
  };
  trendPoints?: number[]; // Only rendered if >= 6 points
  className?: string;
}

export function StatCard({
  label,
  value,
  exactTooltip,
  helperText,
  variant = "default",
  change,
  trendPoints,
  className = "",
}: StatCardProps) {
  const hasTrendline = trendPoints && trendPoints.length >= 6;

  const displayValue =
    typeof value === "object" && value !== null && "display" in value
      ? value.display
      : String(value);

  const tooltipValue =
    exactTooltip ||
    (typeof value === "object" && value !== null && "exact" in value
      ? value.exact
      : undefined);

  const variantClasses =
    variant === "highlight"
      ? "border-[var(--accent-base)]/40 bg-[var(--accent-subtle)]/30"
      : variant === "warning"
      ? "border-amber-300 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/20"
      : "";

  return (
    <div
      className={`card-surface p-5 flex flex-col justify-between transition-colors hover:border-[var(--border-strong)] ${variantClasses} ${className}`}
    >
      <div className="flex items-center justify-between text-label text-text-secondary mb-2">
        <span>{label}</span>
      </div>

      <div className="my-1 flex items-baseline justify-between gap-2">
        <div
          className="text-display font-semibold tracking-tight tabular-nums text-[var(--text-primary)]"
          title={tooltipValue}
        >
          {displayValue}
        </div>

        {hasTrendline && (
          <div className="h-6 w-16 flex items-end gap-0.5" aria-hidden="true">
            {(() => {
              const min = Math.min(...trendPoints);
              const max = Math.max(...trendPoints);
              const range = max - min || 1;
              return trendPoints.map((pt, i) => {
                const heightPct = Math.max(15, Math.round(((pt - min) / range) * 100));
                return (
                  <span
                    key={i}
                    className="flex-1 bg-[var(--border-strong)] rounded-xs transition-all hover:bg-[var(--accent-base)]"
                    style={{ height: `${heightPct}%` }}
                  />
                );
              });
            })()}
          </div>
        )}
      </div>

      {change ? (
        <div className="mt-2 flex items-center gap-1.5 text-body-sm text-[var(--text-secondary)]">
          <span
            className={`inline-flex items-center gap-0.5 font-medium ${
              change.isPositive === true
                ? "text-[var(--success-base)]"
                : change.isPositive === false
                ? "text-[var(--danger-base)]"
                : "text-[var(--text-muted)]"
            }`}
          >
            {change.trend === "up" && <ArrowUpRight className="w-3.5 h-3.5" />}
            {change.trend === "down" && <ArrowDownRight className="w-3.5 h-3.5" />}
            {change.trend === "neutral" && <Minus className="w-3.5 h-3.5" />}
            <span>{change.value}</span>
          </span>
          {change.periodText && (
            <span className="text-[var(--text-muted)]">{change.periodText}</span>
          )}
        </div>
      ) : helperText ? (
        <div className="mt-2 text-caption text-text-tertiary">
          {helperText}
        </div>
      ) : null}
    </div>
  );
}
