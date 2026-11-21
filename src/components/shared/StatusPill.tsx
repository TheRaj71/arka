"use client";

import React from "react";
import { getStatusMeta } from "@/lib/ui/status";

export interface StatusPillProps {
  status: string | null | undefined;
  customLabel?: string;
  label?: string;
  domain?: string;
  size?: "sm" | "md";
  className?: string;
}

export function StatusPill({
  status,
  customLabel,
  label: propLabel,
  domain,
  size = "md",
  className = "",
}: StatusPillProps) {
  const meta = getStatusMeta(status);
  const label = customLabel || propLabel || meta.label;

  const isSmall = size === "sm";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium transition-colors select-none ${
        isSmall ? "px-2 py-0.5 text-[13px]" : "px-2.5 py-1 text-sm"
      } ${className}`}
      style={{
        backgroundColor: meta.bgColor,
        color: meta.textColor,
        border: `1px solid ${meta.borderColor}`,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: meta.dotColor }}
        aria-hidden="true"
      />
      <span>{label}</span>
    </span>
  );
}
