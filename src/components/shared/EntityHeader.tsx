"use client";

import React from "react";
import { StatusPill } from "./StatusPill";
import { Phone, MessageCircle } from "lucide-react";
import { getPhoneActions } from "@/lib/formatters";

interface MetaItem {
  label: string;
  value: React.ReactNode;
}

interface EntityHeaderProps {
  title: string;
  badgeCode?: string; // e.g. LD-2611-00042
  status: string;
  phone?: string | null;
  meta: MetaItem[];
  actions?: React.ReactNode;
  className?: string;
}

export function EntityHeader({
  title,
  badgeCode,
  status,
  phone,
  meta,
  actions,
  className = "",
}: EntityHeaderProps) {
  const phoneActions = phone ? getPhoneActions(phone) : null;

  return (
    <div className={`card-surface p-5 sm:p-6 mb-6 ${className}`}>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left Title & Status */}
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-title font-semibold tracking-tight text-[var(--text-primary)]">
              {title}
            </h1>
            {badgeCode && (
              <span className="px-2 py-0.5 rounded-sm bg-[var(--surface-subtle)] text-xs font-mono text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                {badgeCode}
              </span>
            )}
            <StatusPill status={status} />
          </div>

          {/* Quick Contact buttons if phone present */}
          {phoneActions && phoneActions.callUrl && (
            <div className="flex items-center gap-3 pt-1 text-body-sm">
              <span className="font-mono text-[var(--text-secondary)]">
                {phoneActions.display}
              </span>
              <a
                href={phoneActions.callUrl}
                className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent-base)] hover:underline"
                title="Call customer"
              >
                <Phone className="w-3.5 h-3.5" /> Call
              </a>
              {phoneActions.whatsappUrl && (
                <a
                  href={phoneActions.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-[var(--success-base)] hover:underline"
                  title="Chat on WhatsApp"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                </a>
              )}
            </div>
          )}
        </div>

        {/* Right CTA Actions */}
        {actions && (
          <div className="flex items-center gap-2.5 shrink-0 self-start lg:self-center">
            {actions}
          </div>
        )}
      </div>

      {/* Bottom Key Facts Strip */}
      {meta.length > 0 && (
        <div className="mt-5 pt-4 border-t border-[var(--border-subtle)] grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {meta.map((item, i) => (
            <div key={i} className="flex flex-col">
              <span className="text-label text-[var(--text-muted)]">{item.label}</span>
              <span className="text-body-sm font-medium text-[var(--text-primary)] mt-0.5 truncate">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
