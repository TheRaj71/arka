"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatIstDate, formatTimeAgo } from "@/lib/time";
import { type SurveyItem } from "@/modules/surveys/queries";
import {
  Compass,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  MapPin,
  Calendar,
  Layers,
  Zap,
  User,
  ShieldCheck,
  FileText,
} from "lucide-react";

interface SurveysClientProps {
  initialSurveys: SurveyItem[];
}

export function SurveysClient({ initialSurveys }: SurveysClientProps) {
  const router = useRouter();
  const [surveys] = useState<SurveyItem[]>(initialSurveys);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const pendingReviewCount = useMemo(() => {
    return surveys.filter((s) => s.status === "submitted").length;
  }, [surveys]);

  const filteredSurveys = useMemo(() => {
    return surveys.filter((s) => {
      if (activeTab !== "all" && s.status !== activeTab) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchProject = s.project?.project_no.toLowerCase().includes(q);
        const matchCust = s.project?.customer?.name.toLowerCase().includes(q);
        const matchPhone = s.project?.customer?.phone_e164.includes(q);
        const matchAddr = s.project?.site_address.toLowerCase().includes(q);
        if (!matchProject && !matchCust && !matchPhone && !matchAddr) return false;
      }
      return true;
    });
  }, [surveys, activeTab, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Site Surveys & Engineering Approvals
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
              {surveys.length} Total Audits
            </span>
            {pendingReviewCount > 0 && (
              <span className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                <AlertTriangle className="w-3 h-3 text-rose-600" />
                {pendingReviewCount} Awaiting Gate Approval
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Golden Thread Step 2: Physical roof measurements (REQ-SURV-01 to 04). Quote creation is strictly blocked until manager approval.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/schedule"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-200 shadow-sm transition-all"
          >
            <Calendar className="w-4 h-4 text-amber-500" />
            <span>Technician Calendar</span>
          </Link>
        </div>
      </div>

      {/* Tabs & Search */}
      <GlassCard className="p-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: "all", label: "All Surveys", count: surveys.length },
              {
                id: "submitted",
                label: "Pending Review",
                count: surveys.filter((s) => s.status === "submitted").length,
              },
              {
                id: "approved",
                label: "Approved",
                count: surveys.filter((s) => s.status === "approved").length,
              },
              {
                id: "rework_needed",
                label: "Rework Needed",
                count: surveys.filter((s) => s.status === "rework_needed").length,
              },
              {
                id: "draft",
                label: "Field Pending",
                count: surveys.filter((s) => s.status === "draft").length,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeTab === tab.id
                      ? "bg-white/20 text-white"
                      : "bg-slate-200/80 text-slate-700"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="relative min-w-[240px] max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by project #, customer, address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white/70 border border-slate-200/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-slate-800 placeholder-slate-400 shadow-inner"
            />
          </div>
        </div>
      </GlassCard>

      {/* Surveys Table */}
      <GlassCard className="overflow-hidden p-0 border border-slate-200/70">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Project & Job</th>
                <th className="py-3 px-4">Customer & Site</th>
                <th className="py-3 px-4">Measurements & Direction</th>
                <th className="py-3 px-4">Rec. Capacity</th>
                <th className="py-3 px-4">Status & Gate</th>
                <th className="py-3 px-4">Technician</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {filteredSurveys.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    <Compass className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-medium text-slate-700">No surveys found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Qualify a lead to schedule a rooftop technical survey.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredSurveys.map((survey) => {
                  const isPendingGate = survey.status === "submitted";

                  return (
                    <tr
                      key={survey.id}
                      className="hover:bg-amber-50/40 transition-colors group cursor-pointer"
                      onClick={() => router.push(`/surveys/${survey.id}`)}
                    >
                      {/* Project & Job # */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                          {survey.project?.project_no}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Job: {survey.job?.job_no}
                        </div>
                      </td>

                      {/* Customer & Site */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">
                          {survey.project?.customer?.name}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5 truncate max-w-[200px]">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{survey.project?.site_address}</span>
                        </div>
                      </td>

                      {/* Measurements */}
                      <td className="py-3.5 px-4">
                        {survey.shadow_free_area_sqft ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 font-medium text-slate-800">
                              <span className="capitalize">
                                {survey.roof_direction?.replace("_", " ") || "South"}
                              </span>
                              <span>•</span>
                              <span>{survey.roof_tilt_deg}° Tilt</span>
                              <span>•</span>
                              <span className="capitalize">
                                {survey.roof_type?.replace("_", " ")}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Area: <strong>{survey.shadow_free_area_sqft} sq ft</strong> • DC:{" "}
                              {survey.cable_dc_m}m • AC: {survey.cable_ac_m}m
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">
                            Pending technician submission
                          </span>
                        )}
                      </td>

                      {/* Recommended Capacity */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          {survey.recommended_kw || survey.project?.requested_kw || 3} kW
                        </div>
                        <div className="text-[10px] text-slate-500 capitalize">
                          {(survey.project?.system_type || "on_grid").replace("_", "-")}
                        </div>
                      </td>

                      {/* Status & Gate */}
                      <td className="py-3.5 px-4">
                        <StatusBadge status={survey.status} />
                        {isPendingGate && (
                          <div className="text-[10px] text-rose-600 font-bold mt-1 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                            <span>Action Required</span>
                          </div>
                        )}
                      </td>

                      {/* Technician */}
                      <td className="py-3.5 px-4">
                        <div className="text-slate-800 font-medium">
                          {survey.job?.technicians?.[0]?.full_name || "Assigned Crew"}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {survey.submitted_at
                            ? `Submitted ${formatTimeAgo(survey.submitted_at)}`
                            : "Scheduled"}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/surveys/${survey.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                            isPendingGate
                              ? "bg-amber-500 hover:bg-amber-600 text-white shadow-sm"
                              : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                          }`}
                        >
                          <span>{isPendingGate ? "Review Gate" : "Inspect"}</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
