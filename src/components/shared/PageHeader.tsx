"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  tabs?: Array<{
    id: string;
    label: string;
    count?: number;
    active?: boolean;
    onClick?: () => void;
  }>;
  className?: string;
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  tabs,
  className = "",
}: PageHeaderProps) {
  return (
    <div className={`mb-6 flex flex-col gap-3 ${className}`}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-body-sm text-[var(--text-muted)]" aria-label="Breadcrumbs">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={crumb.label}>
                {crumb.href && !isLast ? (
                  <Link
                    href={crumb.href}
                    className="hover:text-[var(--text-primary)] transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className={isLast ? "text-[var(--text-primary)] font-medium" : ""}>
                    {crumb.label}
                  </span>
                )}
                {!isLast && <ChevronRight className="w-3.5 h-3.5 text-[var(--border-strong)]" />}
              </React.Fragment>
            );
          })}
        </nav>
      )}

      {/* Title & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-display font-semibold tracking-tight text-[var(--text-primary)]">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-body-sm text-[var(--text-secondary)]">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2.5 shrink-0">
            {actions}
          </div>
        )}
      </div>

      {/* Tabs */}
      {tabs && tabs.length > 0 && (
        <div className="mt-2 flex items-center gap-1 border-b border-[var(--border-subtle)] overflow-x-auto scrollbar-none">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={tab.onClick}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap cursor-pointer ${
                tab.active
                  ? "border-[var(--accent-base)] text-[var(--accent-base)]"
                  : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)]"
              }`}
            >
              <span>{tab.label}</span>
              {typeof tab.count === "number" && (
                <span
                  className={`text-xs px-1.5 py-0.2 rounded-full tabular-nums ${
                    tab.active
                      ? "bg-[var(--accent-subtle)] text-[var(--accent-text)]"
                      : "bg-[var(--surface-subtle)] text-[var(--text-muted)]"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
