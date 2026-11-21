"use client";

import React, { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { formatMoney } from "@/lib/money";
import { type SubsidyApplicationItem } from "@/modules/finance/queries";
import {
  Sun,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  Sparkles,
  FileCheck,
  Layers,
  ArrowRight,
} from "lucide-react";

interface SubsidyTrackerClientProps {
  applications: SubsidyApplicationItem[];
}

export function SubsidyTrackerClient({ applications }: SubsidyTrackerClientProps) {
  const [selectedApp, setSelectedApp] = useState<SubsidyApplicationItem>(applications[0]);

  const checklistSteps = [
    { id: 1, title: "1. National Portal Application Submitted", status: "completed", desc: "Ref: PMSURYA-MH-2026-91823" },
    { id: 2, title: "2. DISCOM Technical Feasibility Approved", status: "completed", desc: "MSEDCL sanctioned 3 kW load" },
    { id: 3, title: "3. DCR Certified Solar Hardware Installed", status: "completed", desc: "Made in India DCR cells verified" },
    { id: 4, title: "4. Work Completion Report Uploaded", status: "completed", desc: "Submitted by Lead Tech Imran Khan" },
    { id: 5, title: "5. DISCOM Inspection & Bidirectional Net Meter", status: "completed", desc: "Meter installed & synchronized" },
    { id: 6, title: "6. Joint Commissioning Certificate Issued", status: "in_progress", desc: "Awaiting final DISCOM digital signature" },
    { id: 7, title: "7. Client Aadhaar-Seeded Bank Verification", status: "pending", desc: "Bank account pre-validated" },
    { id: 8, title: "8. Central Subsidy ₹78,000 DBT Release", status: "pending", desc: "Estimated direct transfer in 14 days" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              PM Surya Ghar Subsidy Tracker
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
              ₹78,000 Max Direct Benefit
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            8-point PM Surya Ghar Muft Bijli Yojana readiness and national portal tracking.
          </p>
        </div>

        <a
          href="https://pmsuryaghar.gov.in"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition-all"
        >
          <span>National Portal →</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Main Grid: Application Details & 8-Step Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Applications List */}
        <div className="lg:col-span-5 space-y-3">
          <span className="text-xs font-bold text-slate-700 block">Active Subsidy Applications</span>
          {applications.map((app) => (
            <div
              key={app.id}
              onClick={() => setSelectedApp(app)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                selectedApp.id === app.id
                  ? "bg-amber-50/70 border-amber-400 shadow-md ring-2 ring-amber-400/20"
                  : "bg-white/80 border-slate-200/80 hover:bg-white"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{app.customer_name}</h3>
                  <span className="text-xs font-mono text-slate-500">{app.project_no}</span>
                  <div className="text-[11px] text-slate-600 mt-1">
                    Consumer #: <span className="font-mono font-semibold">{app.consumer_number}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono font-extrabold text-emerald-700 text-sm block">
                    {formatMoney(app.subsidy_paise)}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Govt DBT Grant</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right Column (7 cols): 8-Point Milestone Tracker */}
        <div className="lg:col-span-7 space-y-4">
          <GlassCard className="p-5 border-emerald-300/80 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sun className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    8-Point Subsidy Readiness Audit ({selectedApp.customer_name})
                  </h3>
                  <span className="text-[11px] font-mono text-slate-500">
                    Application Ref: {selectedApp.portal_ref}
                  </span>
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Stage: 5 of 8 Complete
              </span>
            </div>

            <div className="space-y-3 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-slate-200">
              {checklistSteps.map((step) => {
                const isComplete = step.status === "completed";
                const isCurrent = step.status === "in_progress";

                return (
                  <div key={step.id} className="relative pl-7 text-xs">
                    <div
                      className={`absolute left-1.5 top-1 w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center ${
                        isComplete
                          ? "bg-emerald-500"
                          : isCurrent
                          ? "bg-amber-500 ring-2 ring-amber-300 animate-pulse"
                          : "bg-slate-300"
                      }`}
                    />
                    <div className="flex items-center justify-between">
                      <span className={`font-bold ${isComplete ? "text-slate-900" : isCurrent ? "text-amber-800" : "text-slate-400"}`}>
                        {step.title}
                      </span>
                      <span className={`text-[10px] font-bold uppercase ${isComplete ? "text-emerald-600" : isCurrent ? "text-amber-600" : "text-slate-400"}`}>
                        {step.status.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{step.desc}</p>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
