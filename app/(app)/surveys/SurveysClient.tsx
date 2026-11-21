"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusPill } from "@/components/shared/StatusPill";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { formatDateIST, formatPhoneIndian } from "@/lib/formatters";
import { type SurveyItem } from "@/modules/surveys/queries";
import {
  Compass,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Calendar,
  Layers,
} from "lucide-react";

interface SurveysClientProps {
  initialSurveys: SurveyItem[];
}

export function SurveysClient({ initialSurveys }: SurveysClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("all");

  const pendingReviewCount = useMemo(() => {
    return initialSurveys.filter((s) => s.status === "submitted").length;
  }, [initialSurveys]);

  const filteredSurveys = useMemo(() => {
    return initialSurveys.filter((s) => {
      if (activeTab === "pending") return s.status === "submitted";
      if (activeTab === "approved") return s.status === "approved";
      if (activeTab === "rework") return s.status === "rework_needed" || s.status === "rejected";
      return true;
    });
  }, [initialSurveys, activeTab]);

  const columns: Column<SurveyItem>[] = [
    {
      key: "project_no",
      header: "Project ID",
      width: "150px",
      render: (s) => (
        <span className="font-mono text-xs font-medium text-[var(--text-primary)]">
          {s.project?.project_no}
        </span>
      ),
    },
    {
      key: "customer",
      header: "Customer & Site",
      render: (s) => (
        <div>
          <div className="font-medium text-[var(--text-primary)]">{s.project?.customer?.name}</div>
          <div className="text-caption text-[var(--text-muted)] truncate max-w-xs">
            {s.project?.site_address}
          </div>
        </div>
      ),
    },
    {
      key: "capacity",
      header: "Size & Area",
      render: (s) => (
        <div>
          <div className="font-semibold tabular-nums text-[var(--accent-base)]">
            {s.recommended_kw || s.project?.requested_kw} kWp
          </div>
          <div className="text-caption text-[var(--text-muted)]">
            {s.shadow_free_area_sqft ? `${Math.round(s.shadow_free_area_sqft * 0.0929)} m² usable` : "Pending measurement"}
          </div>
        </div>
      ),
    },
    {
      key: "technician",
      header: "Surveyor",
      render: (s) => (
        <span className="text-body-sm text-[var(--text-secondary)]">
          {s.job?.technicians?.[0]?.full_name || "Unassigned"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Approval State",
      render: (s) => <StatusPill status={s.status} />,
    },
    {
      key: "date",
      header: "Date",
      align: "right",
      render: (s) => formatDateIST(s.created_at),
    },
    {
      key: "action",
      header: "",
      align: "right",
      render: (s) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/surveys/${s.id}`);
          }}
          className="btn-secondary h-8 px-2.5 text-xs inline-flex items-center gap-1"
        >
          <span>{s.status === "submitted" ? "Review Gate" : "View"}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Site Surveys & Engineering Approvals"
        description="Verify shadow-free area, azimuth, tilt, and DC/AC cable runs before quote unlocking (REQ-SURV-04)."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Surveys" }]}
        tabs={[
          { id: "all", label: "All Surveys", count: initialSurveys.length, active: activeTab === "all", onClick: () => setActiveTab("all") },
          { id: "pending", label: "Pending Approval", count: pendingReviewCount, active: activeTab === "pending", onClick: () => setActiveTab("pending") },
          { id: "approved", label: "Approved (Quote Unlocked)", count: initialSurveys.filter((s) => s.status === "approved").length, active: activeTab === "approved", onClick: () => setActiveTab("approved") },
          { id: "rework", label: "Rework / Rejected", count: initialSurveys.filter((s) => s.status === "rework_needed" || s.status === "rejected").length, active: activeTab === "rework", onClick: () => setActiveTab("rework") },
        ]}
      />

      <DataTable
        columns={columns}
        data={filteredSurveys}
        searchPlaceholder="Search customer, project ID, or address..."
        onRowClick={(s) => router.push(`/surveys/${s.id}`)}
      />
    </div>
  );
}
