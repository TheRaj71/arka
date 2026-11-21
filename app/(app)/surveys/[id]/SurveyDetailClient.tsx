"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusPill } from "@/components/shared/StatusPill";
import { StepperTracker } from "@/components/shared/StepperTracker";
import { EntityHeader } from "@/components/shared/EntityHeader";
import { RoofSurvey3D } from "@/components/3d/RoofSurvey3D";
import { formatDateIST, formatPhoneIndian } from "@/lib/formatters";
import { reviewSurvey, submitSurvey } from "@/modules/surveys/actions";
import { type SurveyItem } from "@/modules/surveys/queries";
import {
  CheckCircle2,
  AlertCircle,
  Lock,
  Unlock,
  ShieldCheck,
  Compass,
  ArrowRight,
  Camera,
  MapPin,
  Ruler,
  Cable,
  Layers,
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

  // Field measurements
  const [measurements, setMeasurements] = useState({
    shadow_free_area_sqft: survey.shadow_free_area_sqft || 280,
    roof_tilt_deg: survey.roof_tilt_deg || 22,
    roof_direction: survey.roof_direction || "south",
    roof_type: (survey.roof_type as any) || "rcc_flat",
    cable_dc_m: survey.cable_dc_m || 15,
    cable_ac_m: survey.cable_ac_m || 8,
    recommended_kw: survey.recommended_kw || survey.project?.requested_kw || 3.3,
  });

  const isApproved = survey.status === "approved";
  const isPendingReview = survey.status === "submitted";

  // Usable area in sq. meters
  const usableSqM = Math.round(measurements.shadow_free_area_sqft * 0.0929);

  // Map direction string to azimuth degrees (South = 180, SW = 225, SE = 135)
  const azimuthMap: Record<string, number> = {
    south: 180,
    south_west: 225,
    south_east: 135,
    west: 270,
    east: 90,
    north: 0,
  };
  const azimuthDeg = azimuthMap[measurements.roof_direction.toLowerCase()] || 180;

  const handleReview = async (decision: "approve" | "reject" | "rework") => {
    setErrorMessage(null);
    startTransition(async () => {
      const res = await reviewSurvey({
        survey_id: survey.id,
        decision,
        note: reviewNote || undefined,
      });

      if (!res.ok) {
        setErrorMessage(res.error?.message || "Failed to submit review decision.");
      } else {
        setSurvey({ ...survey, status: decision === "approve" ? "approved" : decision === "reject" ? "rejected" : "rework_needed" });
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Page Header */}
      <PageHeader
        title={`Survey Verification: ${survey.project?.customer?.name || "Customer"}`}
        description="Verify engineering roof feasibility, tilt angles, and DC/AC cable run limits."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Surveys", href: "/surveys" },
          { label: survey.project?.project_no || "Survey" },
        ]}
      />

      {/* Entity Header */}
      <EntityHeader
        title={survey.project?.customer?.name || "Site Survey"}
        badgeCode={survey.project?.project_no}
        status={survey.status}
        phone={survey.project?.customer?.phone_e164}
        meta={[
          { label: "Address", value: survey.project?.site_address || "Punjab" },
          { label: "System Size", value: `${measurements.recommended_kw} kWp` },
          { label: "Shadow-Free", value: `${usableSqM} m² (${measurements.shadow_free_area_sqft} sq.ft)` },
          { label: "Direction / Tilt", value: `${measurements.roof_direction.toUpperCase()} · ${measurements.roof_tilt_deg}°` },
          { label: "DC / AC Cable", value: `${measurements.cable_dc_m}m / ${measurements.cable_ac_m}m` },
          { label: "Surveyor", value: survey.job?.technicians?.[0]?.full_name || "Vikram Patel" },
        ]}
        actions={
          isApproved ? (
            <Link
              href={`/quotes/new?project_id=${survey.project?.id}&survey_id=${survey.id}`}
              className="btn-primary h-10 px-4 text-body-sm font-semibold inline-flex items-center gap-1.5"
            >
              <Unlock className="w-4 h-4" />
              <span>Create Priced Quote</span>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-md bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-caption font-medium text-[var(--text-muted)] flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> Quote Locked (Survey unapproved)
              </span>
            </div>
          )
        }
      />

      {/* Stepper Golden Thread */}
      <StepperTracker
        currentStage="survey"
        blockerMessage={
          !isApproved
            ? "HARD GATE (REQ-SURV-04): Quote generation is strictly locked until Manager engineering sign-off."
            : undefined
        }
        nextActionOwner={isApproved ? "Sales (Create Quote)" : "Operations Manager"}
      />

      {/* Main Grid: 3D Roof Visualizer + Surveyor Data */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: 3D Procedural Roof Survey Visualizer (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <RoofSurvey3D
            tiltDeg={measurements.roof_tilt_deg}
            azimuthDeg={azimuthDeg}
            usableAreaSqM={usableSqM}
            requestedKw={measurements.recommended_kw}
            dcCableM={measurements.cable_dc_m}
            acCableM={measurements.cable_ac_m}
            roofType="flat_rcc"
          />

          {/* Site Photos Strip */}
          <div className="card-surface p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2 text-body font-semibold text-[var(--text-primary)]">
                <Camera className="w-4 h-4 text-[var(--text-muted)]" />
                <span>Geotagged Rooftop Site Photos</span>
              </div>
              <span className="text-caption text-[var(--text-muted)]">3 photos uploaded</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="h-28 rounded-md bg-[var(--surface-subtle)] border border-[var(--border-subtle)] flex flex-col items-center justify-center text-caption text-[var(--text-muted)] p-2 text-center">
                <Compass className="w-6 h-6 mb-1 text-[var(--accent-base)]" />
                <span>Terrace Facing South</span>
              </div>
              <div className="h-28 rounded-md bg-[var(--surface-subtle)] border border-[var(--border-subtle)] flex flex-col items-center justify-center text-caption text-[var(--text-muted)] p-2 text-center">
                <Layers className="w-6 h-6 mb-1 text-[var(--accent-base)]" />
                <span>RCC Parapet Shadow Profile</span>
              </div>
              <div className="h-28 rounded-md bg-[var(--surface-subtle)] border border-[var(--border-subtle)] flex flex-col items-center justify-center text-caption text-[var(--text-muted)] p-2 text-center">
                <Cable className="w-6 h-6 mb-1 text-[var(--accent-base)]" />
                <span>Main Distribution Box (AC)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Engineering Sign-off & Gate Decisions (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="card-surface p-5 space-y-4">
            <div className="pb-3 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2 text-body font-semibold text-[var(--text-primary)]">
                <ShieldCheck className="w-5 h-5 text-[var(--accent-base)]" />
                <span>Manager Engineering Approval Gate</span>
              </div>
              <p className="text-caption text-[var(--text-muted)] mt-0.5">
                Approving this survey authorizes sales to generate priced customer proposals.
              </p>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-md bg-[var(--danger-subtle)] border border-[var(--danger-border)] text-body-sm text-[var(--danger-text)]">
                {errorMessage}
              </div>
            )}

            {isApproved ? (
              <div className="p-4 rounded-md bg-[var(--success-subtle)] border border-[var(--success-border)] text-body-sm space-y-2">
                <div className="flex items-center gap-2 font-semibold text-[var(--success-text)]">
                  <CheckCircle2 className="w-4 h-4 text-[var(--success-base)]" />
                  <span>Survey Approved & Price-Lock Unlocked</span>
                </div>
                <p className="text-caption text-[var(--success-text)]">
                  Feasibility verified for {measurements.recommended_kw} kW. The project is cleared for quote generation.
                </p>
                <Link
                  href={`/quotes/new?project_id=${survey.project?.id}&survey_id=${survey.id}`}
                  className="btn-primary w-full h-10 mt-2 text-body-sm justify-center inline-flex"
                >
                  Generate Customer Quote →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-label block mb-1">Engineering Review Notes</label>
                  <textarea
                    rows={3}
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    placeholder="Enter approval conditions or rework instructions (e.g. Parapet height verified, South clear)..."
                    className="w-full p-2.5 text-body-sm bg-[var(--surface-subtle)] border border-[var(--border-strong)] rounded-md focus:border-[var(--accent-base)] focus:outline-none text-[var(--text-primary)]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <button
                    onClick={() => handleReview("approve")}
                    disabled={isPending}
                    className="btn-primary h-10 text-xs font-semibold"
                  >
                    {isPending ? "Approving..." : "Approve Survey"}
                  </button>
                  <button
                    onClick={() => handleReview("rework")}
                    disabled={isPending}
                    className="btn-secondary h-10 text-xs font-medium text-[var(--warning-text)]"
                  >
                    Request Rework
                  </button>
                  <button
                    onClick={() => handleReview("reject")}
                    disabled={isPending}
                    className="btn-secondary h-10 text-xs font-medium text-[var(--danger-base)]"
                  >
                    Reject
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
