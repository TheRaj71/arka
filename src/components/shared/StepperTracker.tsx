"use client";

import React from "react";
import { Check, AlertCircle, Clock } from "lucide-react";

export type GoldenStage =
  | "enquiry"
  | "qualify"
  | "survey"
  | "quote"
  | "order"
  | "dispatch"
  | "install"
  | "warranty";

const STAGES: Array<{ id: GoldenStage; label: string; owner: string }> = [
  { id: "enquiry", label: "Enquiry", owner: "Sales" },
  { id: "qualify", label: "Qualify", owner: "Sales" },
  { id: "survey", label: "Survey", owner: "Technician / Manager" },
  { id: "quote", label: "Quote", owner: "Sales" },
  { id: "order", label: "Order", owner: "Accounts" },
  { id: "dispatch", label: "Dispatch", owner: "Warehouse" },
  { id: "install", label: "Install", owner: "Technician" },
  { id: "warranty", label: "Warranty", owner: "Support Desk" },
];

interface StepperTrackerProps {
  currentStage: GoldenStage;
  blockerMessage?: string; // e.g. "Quote locked: survey not approved"
  nextActionOwner?: string; // e.g. "Manager Approval Required"
  className?: string;
}

export function StepperTracker({
  currentStage,
  blockerMessage,
  nextActionOwner,
  className = "",
}: StepperTrackerProps) {
  const currentIndex = STAGES.findIndex((s) => s.id === currentStage);

  return (
    <div className={`card-surface p-4 sm:p-5 ${className}`}>
      {/* Header bar */}
      <div className="flex items-center justify-between text-body-sm mb-4">
        <span className="font-medium text-[var(--text-secondary)]">
          Solar Lifecycle (Golden Thread)
        </span>
        {nextActionOwner && (
          <span className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
            <Clock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            Next step: <strong className="text-[var(--text-primary)]">{nextActionOwner}</strong>
          </span>
        )}
      </div>

      {/* Steps Track */}
      <div className="relative">
        <div className="overflow-x-auto pb-2 scrollbar-none">
          <ol className="flex items-center min-w-[680px] w-full justify-between">
            {STAGES.map((stage, idx) => {
              const isPassed = idx < currentIndex;
              const isCurrent = idx === currentIndex;
              const isUpcoming = idx > currentIndex;

              return (
                <li key={stage.id} className="flex-1 flex flex-col items-center relative group">
                  {/* Step Connector Line */}
                  {idx !== 0 && (
                    <div
                      className="absolute top-3.5 right-1/2 left-[-50%] h-[2px] transition-colors"
                      style={{
                        backgroundColor:
                          idx <= currentIndex
                            ? "var(--accent-base)"
                            : "var(--border-subtle)",
                      }}
                      aria-hidden="true"
                    />
                  )}

                  {/* Step Node */}
                  <div
                    className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border transition-all ${
                      isPassed
                        ? "bg-[var(--accent-base)] text-[var(--text-inverse)] border-[var(--accent-base)]"
                        : isCurrent
                        ? "bg-[var(--surface-card)] text-[var(--accent-base)] border-2 border-[var(--accent-base)] ring-4 ring-[var(--accent-subtle)]"
                        : "bg-[var(--surface-subtle)] text-[var(--text-muted)] border-[var(--border-subtle)]"
                    }`}
                  >
                    {isPassed ? <Check className="w-4 h-4 stroke-[2.5]" /> : idx + 1}
                  </div>

                  {/* Step Label */}
                  <div className="mt-2 text-center">
                    <div
                      className={`text-xs font-medium ${
                        isCurrent
                          ? "text-[var(--text-primary)] font-semibold"
                          : isPassed
                          ? "text-[var(--text-secondary)]"
                          : "text-[var(--text-muted)]"
                      }`}
                    >
                      {stage.label}
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] hidden sm:block">
                      {stage.owner.split(" ")[0]}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      {/* Blocker Callout if any */}
      {blockerMessage && (
        <div className="mt-3.5 p-2.5 rounded-md bg-[var(--warning-subtle)] border border-[var(--warning-border)] text-body-sm text-[var(--warning-text)] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[var(--warning-base)] shrink-0" />
          <span>{blockerMessage}</span>
        </div>
      )}
    </div>
  );
}
