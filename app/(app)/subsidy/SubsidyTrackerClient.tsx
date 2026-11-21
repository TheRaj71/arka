"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { type SubsidyApplicationItem } from "@/modules/finance/queries";
import { formatPaise } from "@/lib/formatters";
import {
  Sun,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCheck,
  Layers,
  ArrowRight,
  AlertCircle,
} from "lucide-react";

interface SubsidyTrackerClientProps {
  applications: SubsidyApplicationItem[];
}

export function SubsidyTrackerClient({ applications }: SubsidyTrackerClientProps) {
  const [selectedApp, setSelectedApp] = useState<SubsidyApplicationItem>(applications[0] || {
    id: "sub-1",
    project_no: "PRJ-2026-0012",
    customer_name: "Anita Sharma",
    consumer_number: "MSEDCL-8291039",
    subsidy_paise: 7800000,
    status: "in_progress",
    submitted_at: new Date().toISOString(),
  });

  const checklistSteps = [
    {
      id: 1,
      title: "1. National Portal Application Submitted",
      status: "completed",
      desc: "Ref: PMSURYA-PB-2026-91823 logged on national portal",
    },
    {
      id: 2,
      title: "2. DISCOM Technical Feasibility Approved",
      status: "completed",
      desc: "PSPCL sanctioned 3.3 kW load without transformer augmentation",
    },
    {
      id: 3,
      title: "3. DCR Certified Solar Hardware Installed",
      status: "completed",
      desc: "Made-in-India Domestic Content Requirement (DCR) solar cells verified",
    },
    {
      id: 4,
      title: "4. Work Completion Report Uploaded",
      status: "completed",
      desc: "Signed installation handover & electrical test certificate submitted",
    },
    {
      id: 5,
      title: "5. DISCOM Inspection & Bidirectional Net Meter",
      status: "completed",
      desc: "Bidirectional net meter installed & synchronized with DISCOM grid",
    },
    {
      id: 6,
      title: "6. Joint Commissioning Certificate (JCC) Issued",
      status: "in_progress",
      desc: "Awaiting final DISCOM executive digital signature",
    },
    {
      id: 7,
      title: "7. Client Aadhaar-Seeded Bank Verification",
      status: "pending",
      desc: "Bank account pre-validated on national portal for direct DBT transfer",
    },
    {
      id: 8,
      title: "8. Central Subsidy ₹78,000 DBT Release",
      status: "pending",
      desc: "Direct Benefit Transfer credited directly to customer bank account",
    },
  ];

  const totalSubsidyGranted = applications.reduce(
    (acc, a) => acc + BigInt(a.subsidy_paise || 0),
    0n
  );

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: "Finance", href: "/dashboard" },
          { label: "Subsidy Tracker" },
        ]}
        title="PM Surya Ghar Muft Bijli Yojana Tracker"
        description="Statutory 8-step central government direct benefit transfer (DBT) tracker for residential rooftop installations (up to ₹78,000 grant)."
        actions={
          <a
            href="https://pmsuryaghar.gov.in"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 h-11 px-4 rounded-[var(--radius-control)] bg-[var(--surface-subtle)] hover:bg-[var(--border-subtle)] text-text-primary text-body-sm font-medium border border-[var(--border-subtle)] transition-colors"
          >
            <span>National Portal</span>
            <ExternalLink className="w-3.5 h-3.5 text-text-tertiary" />
          </a>
        }
      />

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Active Subsidy Trackers"
          value={applications.length}
          helperText="Customer claims in progress"
          variant="highlight"
        />
        <StatCard
          label="Max DBT Grant per Site"
          value="₹78,000"
          helperText="For systems ≥ 3 kW"
        />
        <StatCard
          label="Total Subsidy Value"
          value={formatPaise(totalSubsidyGranted)}
          helperText="Disbursement volume"
        />
        <StatCard
          label="Avg. DISCOM Clearance"
          value="18 Days"
          helperText="From install to JCC sign-off"
        />
      </div>

      {/* Main Grid: Application Selector & 8-Step Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Applications List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-label text-text-secondary font-medium px-1">
            Active Subsidy Applications ({applications.length})
          </div>

          <div className="space-y-2">
            {applications.map((app) => (
              <div
                key={app.id}
                onClick={() => setSelectedApp(app)}
                className={`p-4 rounded-[var(--radius-card)] border transition-all cursor-pointer ${
                  selectedApp?.id === app.id
                    ? "bg-[var(--accent-subtle)] border-[var(--accent-base)] shadow-xs"
                    : "bg-[var(--surface-card)] border-[var(--border-subtle)] hover:border-[var(--border-strong)]"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-text-primary text-body">
                      {app.customer_name}
                    </h4>
                    <span className="font-mono text-body-sm text-text-tertiary block mt-0.5">
                      {app.project_no}
                    </span>
                    <div className="text-caption text-text-secondary mt-1">
                      Consumer #: <span className="font-mono font-medium">{app.consumer_number}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400 text-body block tabular-nums">
                      {formatPaise(app.subsidy_paise)}
                    </span>
                    <span className="text-caption text-text-tertiary block mt-0.5">
                      DBT Grant
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column (7 cols): 8-Step Golden Thread Subsidy Pipeline */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-subtle)] p-6 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[var(--border-subtle)] gap-2">
              <div>
                <h3 className="text-heading font-semibold text-text-primary">
                  8-Stage National Portal Progress
                </h3>
                <p className="text-body-sm text-text-secondary mt-0.5">
                  Client: <strong className="text-text-primary">{selectedApp?.customer_name}</strong> • Project: <span className="font-mono">{selectedApp?.project_no}</span>
                </p>
              </div>
              <span className="font-mono text-label text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-[var(--radius-control)] border border-emerald-300 dark:border-emerald-700 self-start sm:self-auto">
                Step 6 of 8 In Progress
              </span>
            </div>

            <div className="space-y-3 pt-2">
              {checklistSteps.map((step) => {
                const isDone = step.status === "completed";
                const isCurrent = step.status === "in_progress";

                return (
                  <div
                    key={step.id}
                    className={`p-4 rounded-[var(--radius-control)] border transition-all ${
                      isDone
                        ? "bg-[var(--surface-subtle)] border-[var(--border-subtle)]"
                        : isCurrent
                        ? "bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/80 shadow-xs"
                        : "bg-[var(--surface-card)] border-[var(--border-subtle)] opacity-70"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {isDone ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        ) : isCurrent ? (
                          <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 animate-pulse" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-[var(--border-strong)]" />
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4
                            className={`text-body font-semibold ${
                              isDone
                                ? "text-text-primary"
                                : isCurrent
                                ? "text-amber-900 dark:text-amber-100"
                                : "text-text-secondary"
                            }`}
                          >
                            {step.title}
                          </h4>
                          <span
                            className={`text-caption uppercase font-mono font-semibold px-2 py-0.5 rounded ${
                              isDone
                                ? "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200"
                                : isCurrent
                                ? "bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200"
                                : "bg-[var(--surface-subtle)] text-text-tertiary"
                            }`}
                          >
                            {step.status}
                          </span>
                        </div>
                        <p className="text-body-sm text-text-secondary mt-1">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
