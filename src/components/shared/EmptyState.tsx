"use client";

import React from "react";
import { FolderOpen } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center max-w-sm mx-auto ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-[var(--surface-subtle)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-muted)] mb-3">
        {icon || <FolderOpen className="w-6 h-6 stroke-[1.5]" />}
      </div>
      <h3 className="text-heading font-medium text-[var(--text-primary)] mb-1">
        {title}
      </h3>
      <p className="text-body-sm text-[var(--text-secondary)] leading-relaxed mb-4">
        {description}
      </p>
      {action && (
        <button onClick={action.onClick} className="btn-primary">
          {action.label}
        </button>
      )}
    </div>
  );
}
