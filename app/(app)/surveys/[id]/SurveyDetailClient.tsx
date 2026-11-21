"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatIstDate, formatTimeAgo } from "@/lib/time";
import { reviewSurvey, submitSurvey } from "@/modules/surveys/actions";
import { type SurveyItem } from "@/modules/surveys/queries";
import {
  ArrowLeft,
  Compass,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Unlock,
  ShieldCheck,
  MapPin,
  Phone,
  FileText,
  Layers,
  Zap,
  Camera,
  Sun,
  Ruler,
  Cable,
  ArrowRight,
  Send,
} from "lucide-react";

interface SurveyDetailClientProps {
  survey: SurveyItem;
}

export function SurveyDetailClient({ survey: initialSurvey }: SurveyDetailClientProps) {
  const router = useRouter();
  const [survey, setSurvey] = useState<SurveyItem>(initialSurvey);
  const [isPending, startTransition] = useTransition();
  const [reviewNote, setReviewNote] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Field submission form state for draft surveys
  const [fieldData, setFieldData] = useState({
    shadow_free_area_sqft: survey.shadow_free_area_sqft || 320,
    cable_dc_m: survey.cable_dc_m || 14,
    cable_ac_m: survey.cable_ac_m || 8,
    roof_direction: (survey.roof_direction as any) || "south",
    roof_tilt_deg: survey.roof_tilt_deg || 20,
    roof_type: (survey.roof_type as any) || "rcc_flat",
    feasibility: (survey.feasibility as any) || "feasible",
    recommended_kw: survey.recommended_kw || survey.project?.requested_kw || 3.0,
    notes: survey.notes || "Terrace clear of high trees. Shadow analysis indicates 94% annual solar access.",
  });

  const isApproved = survey.status === "approved";
  const isPendingReview = survey.status === "submitted";
  const isDraft = survey.status === "draft";

  const handleReview = async (decision: "approve" | "reject" | "rework") => {
    setErrorMessage(null);
    startTransition(async () => {
      const res = await reviewSurvey({
        survey_id: survey.id,
        decision,
        note: reviewNote || undefined,
      });

      if (!res.ok) {
        setErrorMessage(res.error.message);
        return;
      }

      setSurvey({
        ...survey,
        status: decision === "approve" ? "approved" : decision === "rework" ? "rework_needed" : "rejected",
        review_note: reviewNote,
        reviewed_at: new Date().toISOString(),
      });
      router.refresh();
    });
  };

  const handleSubmitFromField = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    startTransition(async () => {
      const res = await submitSurvey({
        job_id: survey.job.id,
        shadow_free_area_sqft: Number(fieldData.shadow_free_area_sqft),
        cable_dc_m: Number(fieldData.cable_dc_m),
        cable_ac_m: Number(fieldData.cable_ac_m),
        roof_direction: fieldData.roof_direction,
        roof_tilt_deg: Number(fieldData.roof_tilt_deg),
        roof_type: fieldData.roof_type,
        feasibility: fieldData.feasibility,
        recommended_kw: Number(fieldData.recommended_kw),
        notes: fieldData.notes,
        photos: [],
      });

      if (!res.ok) {
        setErrorMessage(res.error.message);
        return;
      }

      setSurvey({
        ...survey,
        status: "submitted",
        shadow_free_area_sqft: Number(fieldData.shadow_free_area_sqft),
        cable_dc_m: Number(fieldData.cable_dc_m),
        cable_ac_m: Number(fieldData.cable_ac_m),
        roof_direction: fieldData.roof_direction,
        roof_tilt_deg: Number(fieldData.roof_tilt_deg),
        roof_type: fieldData.roof_type,
        feasibility: fieldData.feasibility,
        recommended_kw: Number(fieldData.recommended_kw),
        notes: fieldData.notes,
        submitted_at: new Date().toISOString(),
      });
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/surveys"
            className="p-2 rounded-xl bg-white/70 hover:bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 shadow-sm transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Technical Survey: {survey.project?.project_no}
              </h1>
              <StatusBadge status={survey.status} />
              <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                Job #{survey.job?.job_no}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Assigned Field Crew:{" "}
              <span className="font-semibold text-slate-700">
                {survey.job?.technicians?.[0]?.full_name || "Lead Technician"}
              </span>{" "}
              • Created {formatTimeAgo(survey.created_at)}
            </p>
          </div>
        </div>

        {/* Action Button: Create Quote (Visibly Blocked if not approved) */}
        <div className="flex items-center gap-3">
          {isApproved ? (
            <Link
              href={`/quotes/new?survey_id=${survey.id}&project_id=${survey.project.id}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Unlock className="w-4 h-4" />
              <span>Proceed to Quote Generation →</span>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <button
                disabled
                title="REQ-SURV-04: Cannot generate quote until survey is approved by Manager"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-400 border border-slate-200 text-xs font-semibold cursor-not-allowed opacity-80"
              >
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Create Quote (Approval Locked)</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* HARD GATE BANNER (REQ-SURV-04) */}
      {isApproved ? (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-md">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Hard Gate #2 Cleared: Survey Approved</h3>
              <p className="text-xs text-emerald-100">
                Roof specifications and cable distances verified. BOM and quote pricing are now unlocked.
              </p>
            </div>
          </div>
          <Link
            href={`/quotes/new?survey_id=${survey.id}&project_id=${survey.project.id}`}
            className="px-4 py-2 bg-white text-emerald-900 rounded-xl text-xs font-bold hover:bg-emerald-50 transition-colors shadow-sm"
          >
            Create Quote
          </Link>
        </div>
      ) : isPendingReview ? (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-md">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Awaiting Manager Review Gate (REQ-SURV-04)</h3>
              <p className="text-xs text-amber-100">
                Technician has submitted physical roof data. Review measurements below and make an approval decision.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-lg backdrop-blur-sm">
            Gate: REQ-SURV-04
          </span>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-slate-800 text-white shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-700 rounded-xl">
              <Lock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Survey in Field Draft Stage</h3>
              <p className="text-xs text-slate-300">
                Field technician must record roof measurements and submit before review.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-slate-400">Status: {survey.status}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Grid: Customer info + Technical measurements + Manager review box */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Customer + Physical Specs */}
        <div className="lg:col-span-7 space-y-6">
          {/* Customer & Site Location */}
          <GlassCard className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
                  Site & Customer Context
                </span>
                <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                  {survey.project?.customer?.name}
                </h2>
                <div className="flex items-center gap-2 text-xs text-slate-600 mt-1">
                  <a
                    href={`tel:${survey.project?.customer?.phone_e164}`}
                    className="font-mono text-amber-600 font-semibold flex items-center gap-1"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{survey.project?.customer?.phone_e164}</span>
                  </a>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Requested System</span>
                <span className="text-sm font-bold text-slate-900">
                  {survey.project?.requested_kw || 3} kW •{" "}
                  <span className="capitalize">
                    {(survey.project?.system_type || "on_grid").replace("_", "-")}
                  </span>
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-600">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{survey.project?.site_address}</span>
            </div>
          </GlassCard>

          {/* Technical Roof Audit Measurements */}
          {isDraft ? (
            /* Technician Field Entry Form */
            <GlassCard className="p-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
                    <Ruler className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Technician Field Survey Submission
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Record live rooftop measurements from site visit
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                  Mobile / Field Mode
                </span>
              </div>

              <form onSubmit={handleSubmitFromField} className="mt-4 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Shadow-Free Roof Area (sq ft) *
                    </label>
                    <input
                      type="number"
                      required
                      value={fieldData.shadow_free_area_sqft}
                      onChange={(e) =>
                        setFieldData({
                          ...fieldData,
                          shadow_free_area_sqft: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/30"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Roof Structure Type *
                    </label>
                    <select
                      value={fieldData.roof_type}
                      onChange={(e) =>
                        setFieldData({ ...fieldData, roof_type: e.target.value as any })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                    >
                      <option value="rcc_flat">RCC Flat Terrace</option>
                      <option value="metal_sheet">Industrial Metal / Tin Sheet</option>
                      <option value="tiled">Sloped Tile / Mangalore</option>
                      <option value="elevated">Elevated Superstructure</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Roof Azimuth / Direction *
                    </label>
                    <select
                      value={fieldData.roof_direction}
                      onChange={(e) =>
                        setFieldData({ ...fieldData, roof_direction: e.target.value as any })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                    >
                      <option value="south">True South (Optimal)</option>
                      <option value="south_east">South-East</option>
                      <option value="south_west">South-West</option>
                      <option value="east">East</option>
                      <option value="west">West</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Roof Tilt Angle (Degrees)
                    </label>
                    <input
                      type="number"
                      value={fieldData.roof_tilt_deg}
                      onChange={(e) =>
                        setFieldData({ ...fieldData, roof_tilt_deg: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      DC Cable Run (Meters) *
                    </label>
                    <input
                      type="number"
                      required
                      value={fieldData.cable_dc_m}
                      onChange={(e) =>
                        setFieldData({ ...fieldData, cable_dc_m: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      AC Cable Run (Meters) *
                    </label>
                    <input
                      type="number"
                      required
                      value={fieldData.cable_ac_m}
                      onChange={(e) =>
                        setFieldData({ ...fieldData, cable_ac_m: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Recommended System Size (kW)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={fieldData.recommended_kw}
                      onChange={(e) =>
                        setFieldData({ ...fieldData, recommended_kw: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Feasibility Assessment
                    </label>
                    <select
                      value={fieldData.feasibility}
                      onChange={(e) =>
                        setFieldData({ ...fieldData, feasibility: e.target.value as any })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                    >
                      <option value="feasible">Feasible (Clear Rooftop)</option>
                      <option value="conditional">Conditional (Needs Elevation / Tree Trimming)</option>
                      <option value="not_feasible">Not Feasible (Severe Obstruction)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Survey Engineer Observations & Notes
                  </label>
                  <textarea
                    rows={2}
                    value={fieldData.notes}
                    onChange={(e) => setFieldData({ ...fieldData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isPending ? "Submitting..." : "Submit Survey for Manager Review"}</span>
                  </button>
                </div>
              </form>
            </GlassCard>
          ) : (
            /* Submitted / Approved Survey Details */
            <GlassCard className="p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Technical Roof & Electrical Audit
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Surveyed by {survey.job?.technicians?.[0]?.full_name || "Field Tech"} on{" "}
                      {formatIstDate(survey.submitted_at || survey.created_at)}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 capitalize">
                  {survey.feasibility?.replace("_", " ")}
                </span>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
                <div className="p-3 bg-white/90 rounded-xl border border-slate-200/80 shadow-sm">
                  <span className="text-[10px] text-slate-400 block">Shadow-free Area</span>
                  <span className="text-base font-bold text-slate-900 font-mono">
                    {survey.shadow_free_area_sqft} sq ft
                  </span>
                  <span className="text-[9px] text-emerald-600 block mt-0.5 font-medium">
                    Supports up to {((survey.shadow_free_area_sqft || 300) / 100).toFixed(1)} kW
                  </span>
                </div>

                <div className="p-3 bg-white/90 rounded-xl border border-slate-200/80 shadow-sm">
                  <span className="text-[10px] text-slate-400 block">Orientation</span>
                  <span className="text-base font-bold text-slate-900 capitalize">
                    {survey.roof_direction?.replace("_", " ")}
                  </span>
                  <span className="text-[9px] text-slate-400 block mt-0.5 font-mono">
                    {survey.roof_tilt_deg}° Tilt Angle
                  </span>
                </div>

                <div className="p-3 bg-white/90 rounded-xl border border-slate-200/80 shadow-sm">
                  <span className="text-[10px] text-slate-400 block">Cable Runs</span>
                  <span className="text-base font-bold text-slate-900 font-mono">
                    {survey.cable_dc_m}m / {survey.cable_ac_m}m
                  </span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">DC run / AC run</span>
                </div>

                <div className="p-3 bg-white/90 rounded-xl border border-slate-200/80 shadow-sm">
                  <span className="text-[10px] text-slate-400 block">Roof Structure</span>
                  <span className="text-base font-bold text-slate-900 capitalize">
                    {survey.roof_type?.replace("_", " ")}
                  </span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Standard mounting</span>
                </div>
              </div>

              {/* Observations */}
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/70 text-xs">
                <span className="font-semibold text-slate-700 block mb-1">
                  Field Engineer Notes:
                </span>
                <p className="text-slate-600 leading-relaxed">
                  {survey.notes || "No special constraints observed. Roof structure is sound."}
                </p>
              </div>

              {/* Visual Photos placeholder */}
              <div>
                <span className="text-[11px] font-semibold text-slate-700 block mb-2 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-slate-400" />
                  <span>Site Photo Verification (4 Required Evidence Shots)</span>
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: "1. Rooftop Sky Panorama", desc: "Clear southern azimuth" },
                    { label: "2. DISCOM Meter Board", desc: "Consumer meter & cut-out" },
                    { label: "3. Proposed Inverter Wall", desc: "Shaded indoor location" },
                    { label: "4. Earthing Pit Point", desc: "Soil resistance verified" },
                  ].map((photo, i) => (
                    <div
                      key={i}
                      className="p-3 bg-slate-100 rounded-xl border border-dashed border-slate-300 text-center flex flex-col items-center justify-center min-h-[90px]"
                    >
                      <Camera className="w-5 h-5 text-slate-400 mb-1" />
                      <span className="text-[10px] font-semibold text-slate-700">{photo.label}</span>
                      <span className="text-[9px] text-emerald-600 mt-0.5">✓ Uploaded & Verified</span>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>
          )}
        </div>

        {/* Right Column (5 cols): Manager Gate Review & Quote Link */}
        <div className="lg:col-span-5 space-y-6">
          {/* Manager Approval Box */}
          <GlassCard className="p-5 border-amber-200/60">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <div className="p-1.5 rounded-lg bg-amber-500 text-white">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Operations Manager Gate</h3>
                <p className="text-[11px] text-slate-500">
                  Engineering sign-off required to authorize quote generation
                </p>
              </div>
            </div>

            {isApproved ? (
              <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Survey Approved for Quotation</span>
                </div>
                <p className="text-emerald-700">
                  {survey.review_note || "All engineering measurements verified and approved."}
                </p>
                <div className="text-[10px] text-emerald-600/80 pt-1 border-t border-emerald-200/60">
                  Approved on {formatIstDate(survey.reviewed_at)}
                </div>
              </div>
            ) : isPendingReview ? (
              <div className="mt-4 space-y-3 text-xs">
                <p className="text-slate-600">
                  Review the technical specifications and cable runs above. Once approved, the sales team can generate the official priced BOM quote.
                </p>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Approval / Rejection Note (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Verified 3 kW On-Grid feasibility. DC cable 14m confirmed."
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => handleReview("approve")}
                    disabled={isPending}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isPending ? "Approving..." : "Approve Survey (Unlock Quote)"}</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleReview("rework")}
                      disabled={isPending}
                      className="py-2 rounded-xl bg-white hover:bg-amber-50 text-amber-700 border border-amber-300 font-semibold text-xs transition-colors disabled:opacity-50"
                    >
                      Request Rework
                    </button>
                    <button
                      onClick={() => handleReview("reject")}
                      disabled={isPending}
                      className="py-2 rounded-xl bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 font-semibold text-xs transition-colors disabled:opacity-50"
                    >
                      Reject Survey
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 italic">
                Awaiting field technician survey submission before manager review can take place.
              </div>
            )}
          </GlassCard>

          {/* Golden Thread Visual Path Tracker */}
          <GlassCard className="p-4 bg-slate-50/70 border-slate-200/80 text-xs space-y-3">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>Golden Thread Pipeline Tracker</span>
            </h4>

            <div className="space-y-2 relative before:absolute before:inset-0 before:left-2.5 before:w-0.5 before:bg-slate-200">
              <div className="relative pl-6">
                <div className="absolute left-1.5 top-1 w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="font-semibold text-slate-800">1. Web Lead & Pre-qualification</span>
                <span className="text-[10px] text-slate-400 block">Completed (Call checklist verified)</span>
              </div>

              <div className="relative pl-6">
                <div
                  className={`absolute left-1.5 top-1 w-2.5 h-2.5 rounded-full ${
                    isApproved ? "bg-emerald-500" : isPendingReview ? "bg-amber-500 animate-ping" : "bg-slate-300"
                  }`}
                />
                <span className="font-semibold text-slate-800">
                  2. Rooftop Site Survey & Hard Gate (REQ-SURV-04)
                </span>
                <span className="text-[10px] text-slate-400 block">
                  {isApproved ? "Passed & Approved" : "Current Step"}
                </span>
              </div>

              <div className="relative pl-6">
                <div
                  className={`absolute left-1.5 top-1 w-2.5 h-2.5 rounded-full ${
                    isApproved ? "bg-amber-400" : "bg-slate-300"
                  }`}
                />
                <span className={`font-semibold ${isApproved ? "text-slate-800" : "text-slate-400"}`}>
                  3. Quote Engine & Subsidy Calculation
                </span>
                <span className="text-[10px] text-slate-400 block">
                  {isApproved ? "Ready to generate" : "Locked by Hard Gate"}
                </span>
              </div>

              <div className="relative pl-6">
                <div className="absolute left-1.5 top-1 w-2.5 h-2.5 rounded-full bg-slate-300" />
                <span className="font-semibold text-slate-400">4. Order & 50% Advance Payment</span>
                <span className="text-[10px] text-slate-400 block">Triggers Pick-list & Install Job</span>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
