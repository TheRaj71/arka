"use client";

import React, { useState } from "react";
import Link from "next/link";
import { type FieldJobItem } from "@/modules/field/queries";
import { StatusPill } from "@/components/shared/StatusPill";
import { formatDateTimeIST, getPhoneActions } from "@/lib/formatters";
import {
  Wrench,
  Phone,
  Navigation,
  CheckCircle2,
  Clock,
  Compass,
  ArrowRight,
  Sun,
  ShieldAlert,
  Zap,
} from "lucide-react";

interface FieldClientProps {
  jobs: FieldJobItem[];
}

export function FieldClient({ jobs: initialJobs }: FieldClientProps) {
  const [jobs] = useState<FieldJobItem[]>(initialJobs);
  const [filterType, setFilterType] = useState<string>("all");
  const [outdoorHighContrast, setOutdoorHighContrast] = useState<boolean>(false);

  const filtered = jobs.filter((j) => {
    if (filterType !== "all" && j.type !== filterType) return false;
    return true;
  });

  return (
    <div
      className={`max-w-xl mx-auto space-y-5 pb-16 transition-colors ${
        outdoorHighContrast ? "font-semibold contrast-125" : ""
      }`}
    >
      {/* Field PWA Header */}
      <div className="rounded-[var(--radius-card)] bg-[var(--surface-card)] border-2 border-[var(--border-strong)] p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-[var(--radius-control)] bg-[var(--accent-subtle)] text-[var(--accent-base)] flex items-center justify-center font-bold">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-heading font-semibold text-text-primary">
                Field Technician PWA
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block animate-pulse" />
                <span className="text-caption text-text-secondary font-mono">
                  Offline-Ready • Route Synced
                </span>
              </div>
            </div>
          </div>

          {/* Outdoor Sun Mode Toggle */}
          <button
            type="button"
            onClick={() => setOutdoorHighContrast(!outdoorHighContrast)}
            className={`h-11 px-3.5 rounded-[var(--radius-control)] border text-label font-medium flex items-center gap-1.5 transition-colors ${
              outdoorHighContrast
                ? "bg-[var(--accent-base)] text-white border-[var(--accent-base)]"
                : "bg-[var(--surface-subtle)] text-text-primary border-[var(--border-strong)]"
            }`}
          >
            <Sun className="w-4 h-4" />
            <span className="hidden sm:inline">Outdoor Sun</span>
          </button>
        </div>

        <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-body-sm">
          <span className="text-text-secondary">Assigned Jobs for Today</span>
          <span className="font-mono font-semibold text-text-primary">{jobs.length} Tasks Scheduled</span>
        </div>
      </div>

      {/* Filter Tabs (Big 48px touch targets) */}
      <div className="grid grid-cols-4 gap-2 bg-[var(--surface-subtle)] p-1.5 rounded-[var(--radius-card)] border border-[var(--border-subtle)]">
        {[
          { id: "all", label: "All Tasks" },
          { id: "install", label: "Install" },
          { id: "survey", label: "Surveys" },
          { id: "service", label: "Service" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id)}
            className={`h-11 rounded-[var(--radius-control)] text-label font-medium transition-all ${
              filterType === tab.id
                ? "bg-[var(--surface-card)] text-text-primary shadow-xs border border-[var(--border-strong)] font-semibold"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Mobile Job Cards (Optimized for One-Handed Field Use) */}
      <div className="space-y-4">
        {filtered.map((job) => {
          const isInstall = job.type === "install";
          const isCompleted = job.status === "completed";
          const phoneActions = getPhoneActions(job.project?.customer?.phone_e164 || "+919876543210");
          const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            job.site_address || "Punjab, India"
          )}`;

          return (
            <div
              key={job.id}
              className="rounded-[var(--radius-card)] bg-[var(--surface-card)] border-2 border-[var(--border-subtle)] hover:border-[var(--border-strong)] p-5 space-y-4 shadow-xs transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-body-sm font-semibold text-text-secondary">
                      {job.job_no}
                    </span>
                    <span className="text-caption uppercase font-mono font-semibold px-2 py-0.5 rounded bg-[var(--surface-subtle)] text-text-primary border border-[var(--border-subtle)]">
                      {job.type}
                    </span>
                  </div>
                  <h3 className="text-title font-semibold text-text-primary mt-1.5">
                    {job.project?.customer?.name}
                  </h3>
                  <div className="text-body-sm text-[var(--accent-base)] font-medium mt-0.5">
                    {job.project?.requested_kw} kW System • {job.project?.system_type?.replace("_", "-")}
                  </div>
                </div>

                <StatusPill status={job.status} />
              </div>

              {/* Schedule and Address Facts */}
              <div className="rounded-[var(--radius-control)] bg-[var(--surface-subtle)] border border-[var(--border-subtle)] p-3.5 space-y-2 text-body-sm text-text-primary">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-text-tertiary shrink-0" />
                  <span className="font-medium">
                    {job.scheduled_start ? formatDateTimeIST(job.scheduled_start) : "Scheduled Today"}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <Compass className="w-4 h-4 text-text-tertiary shrink-0 mt-0.5" />
                  <span className="text-text-secondary">
                    {job.site_address || "Site Address on file"}
                  </span>
                </div>
              </div>

              {/* Quick Communication & Navigation Row */}
              <div className="grid grid-cols-3 gap-2">
                <a
                  href={phoneActions.tel}
                  className="h-12 rounded-[var(--radius-control)] bg-[var(--surface-subtle)] hover:bg-[var(--border-subtle)] border border-[var(--border-strong)] flex items-center justify-center gap-2 text-body-sm font-semibold text-text-primary transition-colors"
                >
                  <Phone className="w-4 h-4 text-emerald-600" />
                  <span>Call</span>
                </a>
                <a
                  href={phoneActions.whatsapp}
                  target="_blank"
                  rel="noreferrer"
                  className="h-12 rounded-[var(--radius-control)] bg-[var(--surface-subtle)] hover:bg-[var(--border-subtle)] border border-[var(--border-strong)] flex items-center justify-center gap-2 text-body-sm font-semibold text-text-primary transition-colors"
                >
                  <span>WhatsApp</span>
                </a>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="h-12 rounded-[var(--radius-control)] bg-[var(--surface-subtle)] hover:bg-[var(--border-subtle)] border border-[var(--border-strong)] flex items-center justify-center gap-2 text-body-sm font-semibold text-text-primary transition-colors"
                >
                  <Navigation className="w-4 h-4 text-text-secondary" />
                  <span>Map</span>
                </a>
              </div>

              {/* Primary Action Button (56px high touch target) */}
              {isInstall ? (
                <Link
                  href={`/field/install/${job.id}`}
                  className={`w-full h-14 rounded-[var(--radius-control)] flex items-center justify-center gap-2 font-semibold text-body transition-colors ${
                    isCompleted
                      ? "bg-[var(--surface-subtle)] border border-[var(--border-strong)] text-text-primary"
                      : "bg-[var(--accent-base)] hover:bg-[var(--accent-hover)] text-white shadow-sm"
                  }`}
                >
                  {isCompleted ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <span>Review Completed Handover</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5 text-amber-300" />
                      <span>Execute Installation Checklist →</span>
                    </>
                  )}
                </Link>
              ) : (
                <Link
                  href={`/surveys`}
                  className="w-full h-14 rounded-[var(--radius-control)] bg-[var(--surface-subtle)] hover:bg-[var(--border-subtle)] border border-[var(--border-strong)] flex items-center justify-center gap-2 font-semibold text-body text-text-primary transition-colors"
                >
                  <span>View Survey Details →</span>
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
