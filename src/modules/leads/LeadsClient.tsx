"use client";

import React, { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusPill } from "@/components/shared/StatusPill";
import { StepperTracker } from "@/components/shared/StepperTracker";
import { EntityHeader } from "@/components/shared/EntityHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { formatDateIST, formatPhoneIndian, formatRelativeTime, getPhoneActions } from "@/lib/formatters";
import { createLead, qualifyLead, closeLead, logActivity } from "@/modules/leads/actions";
import { type LeadItem } from "@/modules/leads/queries";
import {
  Users,
  Search,
  Plus,
  Phone,
  MessageCircle,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calculator,
  Send,
  X,
  FileCheck2,
  MapPin,
  Check,
} from "lucide-react";

interface LeadsClientProps {
  initialLeads: LeadItem[];
}

export function LeadsClient({ initialLeads }: LeadsClientProps) {
  const router = useRouter();
  const [leads, setLeads] = useState<LeadItem[]>(initialLeads);
  const [selectedLeadId, setSelectedLeadId] = useState<string>(initialLeads[0]?.id || "");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();

  // Create lead form state
  const [newLead, setNewLead] = useState({
    name: "",
    phone: "",
    email: "",
    city: "",
    address: "",
    source: "call" as const,
    system_type: "on_grid" as const,
    requested_kw: 3.3,
    wants_subsidy: true,
    notes: "",
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Selected lead
  const selectedLead = useMemo(() => {
    return leads.find((l) => l.id === selectedLeadId) || leads[0];
  }, [leads, selectedLeadId]);

  // Lead qualification form state
  const [checklist, setChecklist] = useState({
    roof_ownership: "owned" as "owned" | "rented" | "society" | "unknown",
    shadow_free_sqft: 250,
    monthly_units: 350,
    sanctioned_load_kw: 5,
    has_meter_bill: true,
    consumer_no: "1002349812",
  });

  // Follow-up note state
  const [newNote, setNewNote] = useState("");
  const [followupDate, setFollowupDate] = useState("");

  // Modals for Qualify & Close
  const [showQualifyModal, setShowQualifyModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeReason, setCloseReason] = useState<"lost_to_competitor" | "disqualified_roof" | "unreachable" | "price_too_high">("lost_to_competitor");
  const [actionError, setActionError] = useState<string | null>(null);

  // Filter leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (activeTab === "overdue") {
        const isOverdue =
          lead.next_followup_at &&
          new Date(lead.next_followup_at).getTime() < Date.now() &&
          !["converted", "lost"].includes(lead.status);
        if (!isOverdue) return false;
      } else if (activeTab !== "all" && lead.status !== activeTab) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = lead.customer?.name?.toLowerCase().includes(q);
        const phoneMatch = lead.customer?.phone_e164?.includes(q);
        const cityMatch = lead.site_city?.toLowerCase().includes(q);
        const noMatch = lead.lead_no?.toLowerCase().includes(q);
        return Boolean(nameMatch || phoneMatch || cityMatch || noMatch);
      }
      return true;
    });
  }, [leads, activeTab, searchQuery]);

  // System Size Recommendation Calculation (monthly_units / 120 = recommended kW)
  const recommendedKw = Math.max(1, Math.min(10, Math.round((checklist.monthly_units / 115) * 10) / 10));

  // Handler: Create Lead
  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!newLead.name.trim() || !newLead.phone.trim()) {
      setFormError("Name and phone number are required.");
      return;
    }

    startTransition(async () => {
      const res = await createLead({
        name: newLead.name,
        phone_e164: newLead.phone,
        email: newLead.email || undefined,
        site_city: newLead.city || undefined,
        site_address: newLead.address || undefined,
        source: newLead.source,
        requirement: newLead.system_type,
        requested_kw: newLead.requested_kw,
        wants_subsidy: newLead.wants_subsidy,
        notes: newLead.notes || undefined,
      });
      if (res.ok) {
        setShowCreateModal(false);
        router.refresh();
      } else {
        setFormError(res.error?.message || "Failed to create lead.");
      }
    });
  };

  // Handler: Qualify Lead
  const handleQualifyLead = async () => {
    if (!selectedLead) return;
    setActionError(null);
    startTransition(async () => {
      const res = await qualifyLead({
        lead_id: selectedLead.id,
        shadow_free_area_sqft: checklist.shadow_free_sqft,
        monthly_units: checklist.monthly_units,
        grid_connection_suitable: checklist.sanctioned_load_kw >= recommendedKw,
        roof_ownership: checklist.roof_ownership,
        consumer_number: checklist.consumer_no,
        suggested_kw: recommendedKw,
      });

      if (res.ok) {
        setShowQualifyModal(false);
        router.refresh();
      } else {
        setActionError(res.error?.message || "Failed to qualify lead.");
      }
    });
  };

  // Handler: Close Lead
  const handleCloseLead = async () => {
    if (!selectedLead) return;
    setActionError(null);
    startTransition(async () => {
      const res = await closeLead({
        lead_id: selectedLead.id,
        status: "lost",
        reason: closeReason || "Closed via sales lead review",
      });

      if (res.ok) {
        setShowCloseModal(false);
        router.refresh();
      } else {
        setActionError(res.error?.message || "Failed to close lead.");
      }
    });
  };

  // Handler: Add Activity Note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !selectedLead) return;

    startTransition(async () => {
      await logActivity({
        lead_id: selectedLead.id,
        kind: "call",
        note: newNote,
        next_followup: followupDate ? new Date(followupDate).toISOString() : undefined,
      });
      setNewNote("");
      router.refresh();
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <PageHeader
        title="Leads Queue & Telecalling Funnel"
        description="Capture enquiries, run pre-qualification checklists, and schedule site surveys."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Leads" }]}
        actions={
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary h-10 px-4 text-body-sm font-semibold inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>New Lead</span>
          </button>
        }
        tabs={[
          { id: "all", label: "All Leads", count: leads.length, active: activeTab === "all", onClick: () => setActiveTab("all") },
          { id: "new", label: "New", count: leads.filter((l) => l.status === "new").length, active: activeTab === "new", onClick: () => setActiveTab("new") },
          { id: "contacted", label: "Contacted", count: leads.filter((l) => l.status === "contacted").length, active: activeTab === "contacted", onClick: () => setActiveTab("contacted") },
          { id: "qualified", label: "Qualified", count: leads.filter((l) => l.status === "qualified").length, active: activeTab === "qualified", onClick: () => setActiveTab("qualified") },
          { id: "overdue", label: "Overdue Follow-ups", count: leads.filter((l) => l.next_followup_at && new Date(l.next_followup_at).getTime() < Date.now() && !["converted", "lost"].includes(l.status)).length, active: activeTab === "overdue", onClick: () => setActiveTab("overdue") },
        ]}
      />

      {/* Split View Container (List on Left, Detail on Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Filterable Leads List (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, phone, city, or ID..."
              className="w-full h-10 pl-9 pr-3 text-body-sm bg-[var(--surface-card)] border border-[var(--border-strong)] rounded-md focus:border-[var(--accent-base)] focus:outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
            />
          </div>

          {/* Leads Stack */}
          <div className="card-surface divide-y divide-[var(--border-subtle)] overflow-hidden max-h-[calc(100vh-280px)] overflow-y-auto scrollbar-thin">
            {filteredLeads.length === 0 ? (
              <div className="p-8 text-center">
                <EmptyState
                  title="No leads match"
                  description="Try clearing search keywords or active filters."
                />
              </div>
            ) : (
              filteredLeads.map((lead) => {
                const isSelected = lead.id === selectedLead?.id;
                const isOverdue =
                  lead.next_followup_at &&
                  new Date(lead.next_followup_at).getTime() < Date.now() &&
                  !["converted", "lost"].includes(lead.status);

                return (
                  <div
                    key={lead.id}
                    onClick={() => setSelectedLeadId(lead.id)}
                    className={`p-4 transition-colors cursor-pointer select-none ${
                      isSelected
                        ? "bg-[var(--accent-subtle)] border-l-4 border-[var(--accent-base)]"
                        : "hover:bg-[var(--surface-hover)]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-body-sm text-[var(--text-primary)] truncate">
                            {lead.customer?.name}
                          </span>
                          <span className="text-[11px] font-mono text-[var(--text-muted)]">
                            {lead.lead_no}
                          </span>
                        </div>
                        <div className="text-body-sm font-mono text-[var(--text-secondary)]">
                          {formatPhoneIndian(lead.customer?.phone_e164)}
                        </div>
                      </div>
                      <StatusPill status={lead.status} size="sm" />
                    </div>

                    <div className="mt-2.5 flex items-center justify-between text-caption text-[var(--text-muted)]">
                      <span className="font-medium text-[var(--text-secondary)]">
                        {lead.requested_kw} kW · {(lead.requirement || "on_grid").replace("_", " ")}
                      </span>
                      {isOverdue ? (
                        <span className="text-[var(--danger-base)] font-semibold flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> Overdue
                        </span>
                      ) : (
                        <span>{formatRelativeTime(lead.created_at)}</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Lead Detail & Qualification Form (7 Cols) */}
        {selectedLead ? (
          <div className="lg:col-span-7 space-y-6">
            {/* Entity Header */}
            <EntityHeader
              title={selectedLead.customer?.name || "Lead Details"}
              badgeCode={selectedLead.lead_no}
              status={selectedLead.status}
              phone={selectedLead.customer?.phone_e164}
              meta={[
                { label: "City", value: selectedLead.site_city || "Punjab" },
                { label: "System Req.", value: `${selectedLead.requested_kw} kW ${(selectedLead.requirement || "on_grid").toUpperCase()}` },
                { label: "Subsidy", value: selectedLead.wants_subsidy ? "Surya Ghar Yes" : "No" },
                { label: "Owner", value: selectedLead.owner?.full_name || "Unassigned" },
                { label: "Created", value: formatDateIST(selectedLead.created_at) },
                { label: "Source", value: selectedLead.source.replace("_", " ") },
              ]}
              actions={
                selectedLead.status !== "converted" && selectedLead.status !== "lost" ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowCloseModal(true)}
                      className="btn-secondary h-9 px-3 text-xs text-[var(--danger-base)]"
                    >
                      Close Lead
                    </button>
                    <button
                      onClick={() => setShowQualifyModal(true)}
                      className="btn-primary h-9 px-3 text-xs"
                    >
                      Qualify & Create Project
                    </button>
                  </div>
                ) : (
                  <span className="text-body-sm font-semibold text-[var(--text-muted)]">
                    Lead is {selectedLead.status}
                  </span>
                )
              }
            />

            {/* Stepper Golden Thread */}
            <StepperTracker
              currentStage={selectedLead.status === "qualified" || selectedLead.status === "converted" ? "qualify" : "enquiry"}
              nextActionOwner={selectedLead.status === "new" ? "Telecaller Call" : "Manager Survey Approval"}
            />

            {/* Real Form: Telecaller Qualification Checklist */}
            <div className="card-surface p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
                <div>
                  <h3 className="text-heading font-semibold text-[var(--text-primary)]">
                    Technical Pre-Qualification Checklist
                  </h3>
                  <p className="text-caption text-[var(--text-muted)]">
                    Telecaller verification form before scheduling field survey.
                  </p>
                </div>
                <div className="px-2.5 py-1 rounded-md bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-caption font-mono">
                  Recommended: <strong className="text-[var(--accent-base)]">{recommendedKw} kW</strong>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Field 1: Monthly Units */}
                <div className="space-y-1">
                  <label className="text-label block">Avg. Monthly Units (kWh)</label>
                  <input
                    type="number"
                    value={checklist.monthly_units}
                    onChange={(e) => setChecklist({ ...checklist, monthly_units: Number(e.target.value) })}
                    className="input-standard tabular-nums"
                  />
                  <span className="text-caption text-[var(--text-muted)]">
                    Sug. kW: (units / 115) = {recommendedKw} kW
                  </span>
                </div>

                {/* Field 2: Shadow-Free Rooftop Area */}
                <div className="space-y-1">
                  <label className="text-label block">Shadow-Free Area (sq. ft.)</label>
                  <input
                    type="number"
                    value={checklist.shadow_free_sqft}
                    onChange={(e) => setChecklist({ ...checklist, shadow_free_sqft: Number(e.target.value) })}
                    className="input-standard tabular-nums"
                  />
                  <span className="text-caption text-[var(--text-muted)]">
                    {(checklist.shadow_free_sqft * 0.0929).toFixed(1)} m² usable
                  </span>
                </div>

                {/* Field 3: Sanctioned Electricity Load */}
                <div className="space-y-1">
                  <label className="text-label block">Sanctioned Grid Load (kW)</label>
                  <input
                    type="number"
                    value={checklist.sanctioned_load_kw}
                    onChange={(e) => setChecklist({ ...checklist, sanctioned_load_kw: Number(e.target.value) })}
                    className="input-standard tabular-nums"
                  />
                </div>

                {/* Field 4: Consumer Electricity No */}
                <div className="space-y-1">
                  <label className="text-label block">Electricity Consumer No.</label>
                  <input
                    type="text"
                    value={checklist.consumer_no}
                    onChange={(e) => setChecklist({ ...checklist, consumer_no: e.target.value })}
                    className="input-standard font-mono"
                  />
                </div>

                {/* Field 5: Roof Ownership */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="roof_ownership"
                    checked={checklist.roof_ownership === "owned"}
                    onChange={(e) => setChecklist({ ...checklist, roof_ownership: e.target.checked ? "owned" : "rented" })}
                    className="w-4 h-4 rounded-sm accent-[var(--accent-base)]"
                  />
                  <label htmlFor="roof_ownership" className="text-body-sm font-medium text-[var(--text-primary)] cursor-pointer">
                    Customer owns rooftop (Not rented / shared)
                  </label>
                </div>

                {/* Field 6: Meter Bill Verified */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="meter_bill"
                    checked={checklist.has_meter_bill}
                    onChange={(e) => setChecklist({ ...checklist, has_meter_bill: e.target.checked })}
                    className="w-4 h-4 rounded-sm accent-[var(--accent-base)]"
                  />
                  <label htmlFor="meter_bill" className="text-body-sm font-medium text-[var(--text-primary)] cursor-pointer">
                    Recent PSPCL / DHBVN bill copy collected
                  </label>
                </div>
              </div>
            </div>

            {/* Activity Log & Follow-up Scheduler */}
            <div className="card-surface p-5 space-y-4">
              <h3 className="text-heading font-semibold text-[var(--text-primary)] pb-2 border-b border-[var(--border-subtle)]">
                Log Follow-up & Activity
              </h3>

              <form onSubmit={handleAddNote} className="space-y-3">
                <textarea
                  rows={2}
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Record customer discussion notes (e.g. Requested visit on Saturday morning, confirmed 3 kW)..."
                  className="w-full p-3 text-body-sm bg-[var(--surface-subtle)] border border-[var(--border-strong)] rounded-md focus:border-[var(--accent-base)] focus:outline-none text-[var(--text-primary)]"
                />
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Clock className="w-4 h-4 text-[var(--text-muted)]" />
                    <span className="text-label text-xs">Next Follow-up:</span>
                    <input
                      type="date"
                      value={followupDate}
                      onChange={(e) => setFollowupDate(e.target.value)}
                      className="h-8 px-2 text-xs border border-[var(--border-strong)] rounded-md bg-[var(--surface-card)] text-[var(--text-primary)]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!newNote.trim() || isPending}
                    className="btn-primary h-9 px-4 text-xs font-semibold w-full sm:w-auto"
                  >
                    Save Activity Note
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}
      </div>

      {/* Modal: Qualify Lead Confirmation */}
      {showQualifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setShowQualifyModal(false)} />
          <div className="relative card-surface p-6 max-w-md w-full border border-[var(--border-strong)] shadow-[var(--shadow-modal)] space-y-4 z-10">
            <h3 className="text-title font-semibold text-[var(--text-primary)]">
              Qualify Lead & Initiate Project
            </h3>
            <p className="text-body-sm text-[var(--text-secondary)]">
              This will create a new solar project for <strong>{selectedLead?.customer?.name}</strong> at <strong>{recommendedKw} kW</strong> and automatically schedule a field survey job.
            </p>
            {actionError && (
              <div className="p-3 rounded-md bg-[var(--danger-subtle)] border border-[var(--danger-border)] text-body-sm text-[var(--danger-text)]">
                {actionError}
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowQualifyModal(false)} className="btn-secondary h-10 px-4">
                Cancel
              </button>
              <button onClick={handleQualifyLead} disabled={isPending} className="btn-primary h-10 px-4">
                {isPending ? "Qualifying..." : "Confirm Qualification"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Close Lead Reason */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setShowCloseModal(false)} />
          <div className="relative card-surface p-6 max-w-md w-full border border-[var(--border-strong)] shadow-[var(--shadow-modal)] space-y-4 z-10">
            <h3 className="text-title font-semibold text-[var(--text-primary)]">
              Close Lead with Reason
            </h3>
            <p className="text-body-sm text-[var(--text-secondary)]">
              Leads are never hard-deleted in Arka. Select the reason for closing:
            </p>
            <select
              value={closeReason}
              onChange={(e) => setCloseReason(e.target.value as any)}
              className="input-standard"
            >
              <option value="lost_to_competitor">Lost to Competitor (Price/Terms)</option>
              <option value="disqualified_roof">Disqualified (Shaded / Shared Roof)</option>
              <option value="price_too_high">Price Too High / No Budget</option>
              <option value="unreachable">Unreachable after 5+ attempts</option>
            </select>
            {actionError && (
              <div className="p-3 rounded-md bg-[var(--danger-subtle)] border border-[var(--danger-border)] text-body-sm text-[var(--danger-text)]">
                {actionError}
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowCloseModal(false)} className="btn-secondary h-10 px-4">
                Cancel
              </button>
              <button onClick={handleCloseLead} disabled={isPending} className="btn-secondary h-10 px-4 text-[var(--danger-base)] font-semibold">
                {isPending ? "Closing..." : "Close Lead"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create New Lead */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setShowCreateModal(false)} />
          <form onSubmit={handleCreateLead} className="relative card-surface p-6 max-w-lg w-full border border-[var(--border-strong)] shadow-[var(--shadow-modal)] space-y-4 z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
              <h3 className="text-title font-semibold text-[var(--text-primary)]">
                Create New Customer Enquiry
              </h3>
              <button type="button" onClick={() => setShowCreateModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-md bg-[var(--danger-subtle)] border border-[var(--danger-border)] text-body-sm text-[var(--danger-text)]">
                {formError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-label block">Full Customer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jaswinder Kaur"
                  value={newLead.name}
                  onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                  className="input-standard"
                />
              </div>

              <PhoneInput
                label="Customer Phone Number *"
                value={newLead.phone}
                onChange={(p) => setNewLead({ ...newLead, phone: p })}
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-label block">City / Town</label>
                  <input
                    type="text"
                    placeholder="e.g. Jalandhar"
                    value={newLead.city}
                    onChange={(e) => setNewLead({ ...newLead, city: e.target.value })}
                    className="input-standard"
                  />
                </div>
                <div>
                  <label className="text-label block">Enquiry Source</label>
                  <select
                    value={newLead.source}
                    onChange={(e) => setNewLead({ ...newLead, source: e.target.value as any })}
                    className="input-standard"
                  >
                    <option value="call">Phone Call</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="web">Website Form</option>
                    <option value="walk_in">Walk-in Office</option>
                    <option value="referral">Customer Referral</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-label block">Requested System Size (kW)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="50"
                    value={newLead.requested_kw}
                    onChange={(e) => setNewLead({ ...newLead, requested_kw: parseFloat(e.target.value) || 3.0 })}
                    className="input-standard tabular-nums"
                  />
                </div>
                <div>
                  <label className="text-label block">System Type</label>
                  <select
                    value={newLead.system_type}
                    onChange={(e) => setNewLead({ ...newLead, system_type: e.target.value as any })}
                    className="input-standard"
                  >
                    <option value="on_grid">On-Grid (PM Surya Ghar)</option>
                    <option value="hybrid">Hybrid with Battery</option>
                    <option value="off_grid">Off-Grid (Stand-alone)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="subsidy"
                  checked={newLead.wants_subsidy}
                  onChange={(e) => setNewLead({ ...newLead, wants_subsidy: e.target.checked })}
                  className="w-4 h-4 rounded-sm accent-[var(--accent-base)]"
                />
                <label htmlFor="subsidy" className="text-body-sm text-[var(--text-primary)] cursor-pointer">
                  Customer wants PM Surya Ghar central subsidy assistance
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border-subtle)]">
              <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary h-10 px-4">
                Cancel
              </button>
              <button type="submit" disabled={isPending} className="btn-primary h-10 px-4">
                {isPending ? "Creating..." : "Create Lead"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
