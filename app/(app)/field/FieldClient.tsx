"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatIstDate } from "@/lib/time";
import { type FieldJobItem } from "@/modules/field/queries";
import {
  Wrench,
  Phone,
  Navigation,
  CheckCircle2,
  Clock,
  Compass,
  AlertTriangle,
  ArrowRight,
  Wifi,
  Sparkles,
  Zap,
} from "lucide-react";

interface FieldClientProps {
  jobs: FieldJobItem[];
}

export function FieldClient({ jobs: initialJobs }: FieldClientProps) {
  const router = useRouter();
  const [jobs] = useState<FieldJobItem[]>(initialJobs);
  const [filterType, setFilterType] = useState<string>("all");

  const filtered = jobs.filter((j) => {
    if (filterType !== "all" && j.type !== filterType) return false;
    return true;
  });

  return (
    <div className="max-w-xl mx-auto space-y-5 pb-12">
      {/* Field PWA Header */}
      <div className="flex items-center justify-between p-4 bg-slate-900 text-white rounded-2xl shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold">SunPower Field PWA</h1>
            <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Offline-First (Serwist + idb synced)</span>
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold block">{jobs.length} Assigned</span>
          <span className="text-[10px] text-slate-400">Today&apos;s Route</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 p-1 bg-white/80 rounded-xl border border-slate-200/80 shadow-xs text-xs font-semibold">
        {[
          { id: "all", label: "All Tasks" },
          { id: "install", label: "Installations" },
          { id: "survey", label: "Site Audits" },
          { id: "service", label: "Repairs" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id)}
            className={`flex-1 py-2 rounded-lg transition-all text-center ${
              filterType === tab.id
                ? "bg-amber-500 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Mobile Job Cards */}
      <div className="space-y-4">
        {filtered.map((job) => {
          const isInstall = job.type === "install";
          const isCompleted = job.status === "completed";

          return (
            <div
              key={job.id}
              className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 space-y-4 hover:border-amber-400 transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-500">
                      {job.job_no}
                    </span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {job.type}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mt-1">
                    {job.project?.customer?.name}
                  </h3>
                  <span className="text-xs font-semibold text-amber-600 block mt-0.5">
                    {job.project?.requested_kw} kW • {(job.project?.system_type || "on_grid").replace("_", "-")}
                  </span>
                </div>
                <StatusBadge status={job.status} />
              </div>

              {/* Location & Time */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="font-medium text-slate-800">
                    {formatIstDate(job.scheduled_start)}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <Navigation className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span className="leading-snug">{job.site_address}</span>
                </div>
              </div>

              {/* One-touch Actions */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <a
                  href={`tel:${job.project?.customer?.phone_e164}`}
                  className="py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-semibold text-xs text-slate-700 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Call Client</span>
                </a>

                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(job.site_address)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-semibold text-xs text-slate-700 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Navigation className="w-3.5 h-3.5 text-sky-600" />
                  <span>GPS Navigate</span>
                </a>
              </div>

              {/* Main Execution Button */}
              {isInstall && !isCompleted && (
                <Link
                  href={`/field/install/${job.id}`}
                  className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                  <Wrench className="w-4 h-4" />
                  <span>Open Installation & Power Test Form →</span>
                </Link>
              )}

              {job.type === "survey" && !isCompleted && (
                <Link
                  href="/surveys"
                  className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <Compass className="w-4 h-4 text-amber-400" />
                  <span>Perform Site Audit →</span>
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
