"use client";

import React, { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatIstDate, formatTimeAgo } from "@/lib/time";
import { logActivity, closeLead, qualifyLead } from "@/modules/leads/actions";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Send,
  Zap,
  Sun,
  ShieldCheck,
  UserCheck,
  FileCheck2,
  XCircle,
  HelpCircle,
  Calculator,
  MessageSquare,
  Sparkles,
} from "lucide-react";

interface LeadDetailClientProps {
  lead: any;
  activities: any[];
  qualifications: any[];
  technicians: { id: string; full_name: string; email: string | null }[];
}

export function LeadDetailClient({
  lead: initialLead,
  activities: initialActivities,
  qualifications: initialQualifications,
  technicians,
}: LeadDetailClientProps) {
  const router = useRouter();
  const [lead, setLead] = useState(initialLead);
  const [activities, setActivities] = useState(initialActivities);
  const [isPending, startTransition] = useTransition();

  // Modals
  const [showQualifyModal, setShowQualifyModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [qualifyResult, setQualifyResult] = useState<{
    project_no: string;
    survey_id: string;
  } | null>(null);

  // Call Checklist state
  const [checklist, setChecklist] = useState({
    shadowFreeArea: 350,
    monthlyBill: 3500,
    monthlyUnits: 280,
    gridSuitable: true,
    gridNotes: "Single phase connection, 4 kW sanctioned load.",
    roofOwnership: "owned" as "owned" | "rented" | "society",
    consumerNumber: "028740192831",
    consumerName: lead?.customer?.name || "",
  });

  // Activity Log State
  const [newActivity, setNewActivity] = useState({
    kind: "call" as "call" | "whatsapp" | "note",
    outcome: "connected" as "connected" | "no_answer" | "busy" | "callback_requested",
    note: "",
    nextFollowup: "",
  });

  // Qualify Form State
  const [qualifyData, setQualifyData] = useState({
    technicianId: technicians[0]?.id || "",
    surveyDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    surveySlot: "10:00",
    systemType: (lead?.requirement as "on_grid" | "off_grid") || "on_grid",
    systemSizeKw: lead?.requested_kw || 3.0,
  });

  // Close Form State
  const [closeReason, setCloseReason] = useState("");
  const [closeStatus, setCloseStatus] = useState<"lost" | "disqualified">("lost");

  // System Size & Subsidy Calculator
  const calculatedRecommendation = useMemo(() => {
    const units = checklist.monthlyUnits || Math.round(checklist.monthlyBill / 9);
    // 1 kW generates approx 120 units per month (4 units/day * 30 days) in Western India
    const recommendedKw = Math.max(1, Math.min(10, Math.round((units / 120) * 2) / 2));

    // PM Surya Ghar Central Subsidy calculation (residential on-grid only)
    let subsidyPaise = 0;
    if (qualifyData.systemType === "on_grid") {
      if (recommendedKw <= 1) subsidyPaise = 3000000; // ₹30,000
      else if (recommendedKw <= 2) subsidyPaise = 6000000; // ₹60,000
      else subsidyPaise = 7800000; // ₹78,000 for 3 kW and above
    }

    const estimatedCostRupees = recommendedKw * 55000;
    const netCostRupees = Math.max(0, estimatedCostRupees - subsidyPaise / 100);
    const annualSavingsRupees = units * 12 * 8.5; // avg ₹8.5/unit tariff

    return {
      recommendedKw,
      subsidyRupees: subsidyPaise / 100,
      estimatedCostRupees,
      netCostRupees,
      annualSavingsRupees,
      co2OffsetTons: Math.round(recommendedKw * 1.3 * 10) / 10,
    };
  }, [checklist.monthlyUnits, checklist.monthlyBill, qualifyData.systemType]);

  // Handle logging activity
  const handleLogActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivity.note.trim()) return;

    startTransition(async () => {
      const res = await logActivity({
        lead_id: lead.id,
        kind: newActivity.kind,
        outcome: newActivity.kind === "call" ? newActivity.outcome : undefined,
        note: newActivity.note,
        next_followup: newActivity.nextFollowup ? new Date(newActivity.nextFollowup).toISOString() : undefined,
      });

      if (res.ok) {
        setActivities([
          {
            id: Math.random().toString(),
            kind: newActivity.kind,
            outcome: newActivity.outcome,
            note: newActivity.note,
            created_at: new Date().toISOString(),
            actor: { full_name: "You (Sales Rep)" },
          },
          ...activities,
        ]);
        setNewActivity({
          kind: "call",
          outcome: "connected",
          note: "",
          nextFollowup: "",
        });
        router.refresh();
      }
    });
  };

  // Handle Qualify Lead -> Creates Project + Survey Job
  const handleQualifyLead = async () => {
    setModalError(null);
    startTransition(async () => {
      const startIso = `${qualifyData.surveyDate}T${qualifyData.surveySlot}:00+05:30`;
      const endIso = `${qualifyData.surveyDate}T${parseInt(qualifyData.surveySlot) + 2}:00:00+05:30`;

      const res = await qualifyLead({
        lead_id: lead.id,
        shadow_free_area_sqft: Number(checklist.shadowFreeArea),
        monthly_bill_paise: Number(checklist.monthlyBill) * 100,
        monthly_units: Number(checklist.monthlyUnits),
        grid_connection_suitable: checklist.gridSuitable,
        grid_notes: checklist.gridNotes,
        roof_ownership: checklist.roofOwnership,
        consumer_number: checklist.consumerNumber,
        consumer_name_on_bill: checklist.consumerName,
        suggested_kw: Number(calculatedRecommendation.recommendedKw),
        system_type: qualifyData.systemType,
        requested_kw: Number(qualifyData.systemSizeKw),
        technician_id: qualifyData.technicianId || undefined,
        survey_start: startIso,
        survey_end: endIso,
      });

      if (!res.ok) {
        setModalError(res.error.message);
        return;
      }

      setQualifyResult({
        project_no: res.data.project_no,
        survey_id: res.data.survey_id,
      });
      setLead({ ...lead, status: "converted" });
    });
  };

  // Handle Close Lead
  const handleCloseLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!closeReason.trim()) return;

    startTransition(async () => {
      const res = await closeLead({
        lead_id: lead.id,
        status: closeStatus,
        reason: closeReason,
      });

      if (!res.ok) {
        setModalError(res.error.message);
        return;
      }

      setShowCloseModal(false);
      setLead({ ...lead, status: closeStatus, close_reason: closeReason });
      router.refresh();
    });
  };

  const isClosed = ["converted", "lost", "disqualified"].includes(lead.status);

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Status Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/leads"
            className="p-2 rounded-xl bg-white/70 hover:bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 shadow-sm transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
                {lead.lead_no}
              </h1>
              <StatusBadge status={lead.status} />
              {lead.wants_subsidy && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  PM Surya Ghar Eligible
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Created {formatTimeAgo(lead.created_at)} • Source:{" "}
              <span className="capitalize font-medium text-slate-700">
                {lead.source?.replace("_", " ")}
              </span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {!isClosed ? (
            <>
              <button
                onClick={() => setShowCloseModal(true)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white/80 hover:bg-rose-50 hover:border-rose-200 text-slate-600 hover:text-rose-700 text-xs font-semibold transition-colors"
              >
                Close Lead
              </button>
              <button
                onClick={() => setShowQualifyModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Qualify & Schedule Survey</span>
              </button>
            </>
          ) : lead.status === "converted" ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Project & Survey Active</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold">
              <XCircle className="w-4 h-4 text-slate-500" />
              <span>Closed: {lead.close_reason || lead.status}</span>
            </div>
          )}
        </div>
      </div>

      {/* Converted Project Banner */}
      {lead.status === "converted" && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-md">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Lead Successfully Converted!</h3>
              <p className="text-xs text-emerald-100">
                A project record has been created and the survey job has been dispatched to the field technician.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/schedule"
              className="px-3 py-1.5 bg-white text-emerald-900 rounded-lg text-xs font-bold hover:bg-emerald-50 transition-colors shadow-sm"
            >
              View on Calendar
            </Link>
            <Link
              href="/surveys"
              className="px-3 py-1.5 bg-emerald-800/60 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors"
            >
              Surveys Queue →
            </Link>
          </div>
        </div>
      )}

      {/* Main Grid: Customer & Checklist | Activity & Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Customer Profile + Call Checklist + Calculator (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Customer Card */}
          <GlassCard className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
                  Customer Profile
                </span>
                <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                  {lead.customer?.name}
                </h2>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-600">
                  <a
                    href={`tel:${lead.customer?.phone_e164}`}
                    className="inline-flex items-center gap-1.5 font-mono font-semibold text-amber-600 hover:text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/60"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{lead.customer?.phone_e164}</span>
                  </a>
                  {lead.customer?.email && (
                    <a
                      href={`mailto:${lead.customer?.email}`}
                      className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>{lead.customer?.email}</span>
                    </a>
                  )}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Sales Owner</span>
                <span className="text-xs font-semibold text-slate-800">
                  {lead.owner?.full_name || "Unassigned"}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Site Address</span>
                <div className="flex items-center gap-1 text-slate-700 font-medium mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>
                    {lead.site_address || "Address pending verification"}, {lead.site_city || "Pune"}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Initial Request</span>
                <span className="text-slate-800 font-semibold mt-0.5 block">
                  {lead.requested_kw || 3} kW • {(lead.requirement || "on_grid").replace("_", "-")}
                </span>
              </div>
            </div>
          </GlassCard>

          {/* Golden Thread Step 1: Pre-qualification Call Checklist (REQ-LEAD-03) */}
          <GlassCard className="p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
                  <FileCheck2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Call Qualification Checklist (REQ-LEAD-03)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Verify roof eligibility and monthly tariff before scheduling physical survey
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                Golden Gate #1
              </span>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Shadow-free Roof Area */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Shadow-free Roof Area (sq. ft) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      disabled={isClosed}
                      value={checklist.shadowFreeArea}
                      onChange={(e) =>
                        setChecklist({ ...checklist, shadowFreeArea: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/30 focus:outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[11px]">
                      sq. ft
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Rule of thumb: 100 sq. ft per 1 kW solar panels
                  </p>
                </div>

                {/* Roof Ownership */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Roof Ownership *
                  </label>
                  <select
                    disabled={isClosed}
                    value={checklist.roofOwnership}
                    onChange={(e) =>
                      setChecklist({
                        ...checklist,
                        roofOwnership: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="owned">Self Owned (Individual Bungalow / Row House)</option>
                    <option value="society">Co-op Society NOC (Shared Terrace)</option>
                    <option value="rented">Tenant / Rented (Requires Landlord Consent)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Monthly Units */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Monthly Consumption (kWh / Units)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      disabled={isClosed}
                      value={checklist.monthlyUnits}
                      onChange={(e) =>
                        setChecklist({ ...checklist, monthlyUnits: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/30 focus:outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[11px]">
                      Units / Mo
                    </span>
                  </div>
                </div>

                {/* Monthly Bill */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Average Monthly Bill (₹)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      disabled={isClosed}
                      value={checklist.monthlyBill}
                      onChange={(e) =>
                        setChecklist({ ...checklist, monthlyBill: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/30 focus:outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[11px]">
                      ₹ / Month
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Electricity Consumer Number */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Electricity Consumer # (DISCOM / MSEDCL)
                  </label>
                  <input
                    type="text"
                    disabled={isClosed}
                    placeholder="e.g. 028740192831"
                    value={checklist.consumerNumber}
                    onChange={(e) =>
                      setChecklist({ ...checklist, consumerNumber: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/30 focus:outline-none font-mono"
                  />
                </div>

                {/* Grid Suitability Checkbox */}
                <div className="flex flex-col justify-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={isClosed}
                      checked={checklist.gridSuitable}
                      onChange={(e) =>
                        setChecklist({ ...checklist, gridSuitable: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                    />
                    <span className="text-slate-800 font-semibold">
                      Grid connection is technically suitable
                    </span>
                  </label>
                  <span className="text-[10px] text-slate-400 ml-6">
                    Has stable distribution line, no voltage fluctuation exceeding DISCOM limits.
                  </span>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Interactive System-Size & PM Surya Ghar Subsidy Recommendation (REQ-LEAD-04) */}
          <GlassCard className="p-5 bg-gradient-to-br from-amber-500/5 via-white/80 to-amber-500/10 border-amber-200/60">
            <div className="flex items-center justify-between pb-3 border-b border-amber-200/50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500 text-white">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    System-Size & Subsidy Estimator (REQ-LEAD-04)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Auto-calibrated for SunPower Solutions & PM Surya Ghar Muft Bijli Yojana
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-300">
                Recommended: {calculatedRecommendation.recommendedKw} kW
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-white/90 rounded-xl border border-slate-200/80 shadow-sm">
                <span className="text-[10px] text-slate-500 block">System Capacity</span>
                <span className="text-base font-extrabold text-slate-900 font-mono">
                  {calculatedRecommendation.recommendedKw} kW
                </span>
                <span className="text-[9px] text-slate-400 block mt-0.5">
                  ~{(calculatedRecommendation.recommendedKw * 4.2).toFixed(1)} units/day
                </span>
              </div>

              <div className="p-3 bg-white/90 rounded-xl border border-emerald-200/80 shadow-sm">
                <span className="text-[10px] text-emerald-600 font-bold block">
                  Govt. Subsidy
                </span>
                <span className="text-base font-extrabold text-emerald-700 font-mono">
                  ₹{calculatedRecommendation.subsidyRupees.toLocaleString("en-IN")}
                </span>
                <span className="text-[9px] text-emerald-600/80 block mt-0.5">
                  Direct Bank Transfer
                </span>
              </div>

              <div className="p-3 bg-white/90 rounded-xl border border-slate-200/80 shadow-sm">
                <span className="text-[10px] text-slate-500 block">Net Client Investment</span>
                <span className="text-base font-extrabold text-slate-900 font-mono">
                  ₹{calculatedRecommendation.netCostRupees.toLocaleString("en-IN")}
                </span>
                <span className="text-[9px] text-slate-400 block mt-0.5">
                  Before state rebate
                </span>
              </div>

              <div className="p-3 bg-white/90 rounded-xl border border-slate-200/80 shadow-sm">
                <span className="text-[10px] text-slate-500 block">Annual Bill Savings</span>
                <span className="text-base font-extrabold text-amber-600 font-mono">
                  ₹{calculatedRecommendation.annualSavingsRupees.toLocaleString("en-IN")}
                </span>
                <span className="text-[9px] text-slate-400 block mt-0.5">Payback ~2.5 yrs</span>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Right Column: Activity Stream & Quick Follow-up Logger (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Quick Log Box */}
          {!isClosed && (
            <GlassCard className="p-4 border-slate-200/80">
              <h3 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
                <span>Log Call / Customer Touchpoint</span>
              </h3>

              <form onSubmit={handleLogActivity} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-600">Channel</label>
                    <select
                      value={newActivity.kind}
                      onChange={(e) =>
                        setNewActivity({ ...newActivity, kind: e.target.value as any })
                      }
                      className="w-full mt-0.5 px-2 py-1.5 border border-slate-200 rounded-lg bg-white"
                    >
                      <option value="call">Phone Call</option>
                      <option value="whatsapp">WhatsApp Message</option>
                      <option value="note">Internal Note</option>
                    </select>
                  </div>

                  {newActivity.kind === "call" && (
                    <div>
                      <label className="text-[10px] font-semibold text-slate-600">Outcome</label>
                      <select
                        value={newActivity.outcome}
                        onChange={(e) =>
                          setNewActivity({ ...newActivity, outcome: e.target.value as any })
                        }
                        className="w-full mt-0.5 px-2 py-1.5 border border-slate-200 rounded-lg bg-white"
                      >
                        <option value="connected">Connected & Discussed</option>
                        <option value="no_answer">No Answer</option>
                        <option value="busy">Line Busy</option>
                        <option value="callback_requested">Callback Requested</option>
                      </select>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-600">Discussion Notes *</label>
                  <textarea
                    required
                    rows={2}
                    placeholder="Key points: roof type, shading, budget, client concerns..."
                    value={newActivity.note}
                    onChange={(e) => setNewActivity({ ...newActivity, note: e.target.value })}
                    className="w-full mt-0.5 px-3 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/30 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-600">
                    Next Follow-up Date/Time (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={newActivity.nextFollowup}
                    onChange={(e) =>
                      setNewActivity({ ...newActivity, nextFollowup: e.target.value })
                    }
                    className="w-full mt-0.5 px-3 py-1.5 border border-slate-200 rounded-lg bg-white"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={isPending || !newActivity.note.trim()}
                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg text-xs transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    <Send className="w-3 h-3" />
                    <span>{isPending ? "Logging..." : "Save Note"}</span>
                  </button>
                </div>
              </form>
            </GlassCard>
          )}

          {/* Activity Timeline */}
          <GlassCard className="p-4">
            <h3 className="text-xs font-bold text-slate-900 mb-3 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Activity Timeline</span>
              </span>
              <span className="text-[10px] font-normal text-slate-400">
                {activities.length} entries
              </span>
            </h3>

            <div className="space-y-3 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-slate-100">
              {activities.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs italic">
                  No activity entries logged yet.
                </div>
              ) : (
                activities.map((act) => (
                  <div key={act.id} className="relative pl-7 text-xs">
                    <div className="absolute left-1.5 top-1 w-3 h-3 rounded-full bg-amber-400 border-2 border-white ring-1 ring-amber-200" />
                    <div className="flex items-baseline justify-between">
                      <span className="font-semibold text-slate-800 capitalize">
                        {act.kind?.replace("_", " ")}
                        {act.outcome && (
                          <span className="text-slate-500 font-normal">
                            {" "}
                            ({act.outcome.replace("_", " ")})
                          </span>
                        )}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatTimeAgo(act.created_at)}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-1 bg-slate-50/70 p-2 rounded-lg border border-slate-100">
                      {act.note}
                    </p>
                    <span className="text-[9px] text-slate-400 mt-0.5 block">
                      by {act.actor?.full_name || "System"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Qualify & Schedule Survey Modal (REQ-LEAD-09 & REQ-SURV-01) */}
      {showQualifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Qualify Lead & Dispatch Survey
                  </h3>
                  <p className="text-xs text-slate-500">
                    Creates Project record and schedules physical rooftop audit
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowQualifyModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{modalError}</span>
              </div>
            )}

            {qualifyResult ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-slate-900">Project Initialized!</h4>
                <p className="text-xs text-slate-600 max-w-sm mx-auto">
                  Project <span className="font-mono font-bold">{qualifyResult.project_no}</span> created and technician survey job scheduled.
                </p>
                <div className="flex items-center justify-center gap-3 pt-3">
                  <Link
                    href="/surveys"
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/20"
                  >
                    Go to Surveys Queue
                  </Link>
                  <button
                    onClick={() => {
                      setShowQualifyModal(false);
                      setQualifyResult(null);
                      router.refresh();
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      System Size (kW)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={qualifyData.systemSizeKw}
                      onChange={(e) =>
                        setQualifyData({ ...qualifyData, systemSizeKw: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/30 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">System Type</label>
                    <select
                      value={qualifyData.systemType}
                      onChange={(e) =>
                        setQualifyData({
                          ...qualifyData,
                          systemType: e.target.value as "on_grid" | "off_grid",
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                    >
                      <option value="on_grid">On-Grid (Net Meter)</option>
                      <option value="off_grid">Off-Grid (Battery Bank)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Assign Field Technician *
                  </label>
                  <select
                    value={qualifyData.technicianId}
                    onChange={(e) =>
                      setQualifyData({ ...qualifyData, technicianId: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    {technicians.map((tech) => (
                      <option key={tech.id} value={tech.id}>
                        {tech.full_name} ({tech.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Survey Date *
                    </label>
                    <input
                      type="date"
                      value={qualifyData.surveyDate}
                      onChange={(e) =>
                        setQualifyData({ ...qualifyData, surveyDate: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Time Slot</label>
                    <select
                      value={qualifyData.surveySlot}
                      onChange={(e) =>
                        setQualifyData({ ...qualifyData, surveySlot: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                    >
                      <option value="09:00">09:00 AM - 11:00 AM</option>
                      <option value="10:00">10:00 AM - 12:00 PM</option>
                      <option value="14:00">02:00 PM - 04:00 PM</option>
                      <option value="16:00">04:00 PM - 06:00 PM</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-slate-700 text-[11px] space-y-1">
                  <div className="font-semibold text-amber-900">Automation A3 triggered:</div>
                  <p>
                    • Lead marked <strong>converted</strong>
                  </p>
                  <p>• New Project record created in <strong>survey</strong> stage</p>
                  <p>
                    • Field job created and synced to technician&apos;s mobile field schedule
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowQualifyModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={handleQualifyLead}
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium shadow-md shadow-amber-500/20 disabled:opacity-50"
                  >
                    {isPending ? "Qualifying..." : "Confirm & Dispatch"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Close Lead Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Close Solar Lead</h3>
              <button
                onClick={() => setShowCloseModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCloseLead} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Status</label>
                <select
                  value={closeStatus}
                  onChange={(e) => setCloseStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                >
                  <option value="lost">Lost to Competitor / Dropped</option>
                  <option value="disqualified">Disqualified (Unviable Roof / Rented)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Reason for Closing * (Required)
                </label>
                <select
                  value={closeReason}
                  onChange={(e) => setCloseReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white mb-2"
                >
                  <option value="">Select standard reason...</option>
                  <option value="High upfront price / Budget constraint">
                    High upfront price / Budget constraint
                  </option>
                  <option value="Roof shaded or structurally unviable">
                    Roof shaded or structurally unviable
                  </option>
                  <option value="Chose local competitor or local installer">
                    Chose local competitor or local installer
                  </option>
                  <option value="Customer unresponsive after 5+ contact attempts">
                    Customer unresponsive after 5+ contact attempts
                  </option>
                  <option value="Rented house, landlord refused rooftop solar installation">
                    Rented house, landlord refused rooftop solar installation
                  </option>
                  <option value="Postponed project to next fiscal year">
                    Postponed project to next fiscal year
                  </option>
                </select>

                <textarea
                  required
                  rows={2}
                  placeholder="Or enter custom reason explanation..."
                  value={closeReason}
                  onChange={(e) => setCloseReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCloseModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || !closeReason.trim()}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium shadow-md shadow-rose-600/20 disabled:opacity-50"
                >
                  {isPending ? "Closing..." : "Close Lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
