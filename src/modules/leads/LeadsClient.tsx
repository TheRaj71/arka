"use client";

import React, { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatTimeAgo, formatIstDate } from "@/lib/time";
import { type LeadItem } from "@/modules/leads/queries";
import { createLead } from "@/modules/leads/actions";
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  Clock,
  AlertTriangle,
  ArrowRight,
  Filter,
  CheckCircle2,
  Calendar,
  Zap,
} from "lucide-react";

interface LeadsClientProps {
  initialLeads: LeadItem[];
}

export function LeadsClient({ initialLeads }: LeadsClientProps) {
  const router = useRouter();
  const [leads, setLeads] = useState<LeadItem[]>(initialLeads);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();

  // Create lead form state
  const [newLead, setNewLead] = useState<{
    name: string;
    phone: string;
    email: string;
    city: string;
    address: string;
    source: "call" | "web" | "whatsapp" | "walk_in" | "referral" | "other";
    system_type: "on_grid" | "off_grid" | "hybrid";
    requested_kw: number;
    wants_subsidy: boolean;
    notes: string;
  }>({
    name: "",
    phone: "",
    email: "",
    city: "",
    address: "",
    source: "call",
    system_type: "on_grid",
    requested_kw: 3.0,
    wants_subsidy: true,
    notes: "",
  });
  const [formError, setFormError] = useState<string | null>(null);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Status filter
      if (activeTab === "overdue") {
        const isOverdue =
          lead.next_followup_at &&
          new Date(lead.next_followup_at).getTime() < Date.now() &&
          !["converted", "lost"].includes(lead.status);
        if (!isOverdue) return false;
      } else if (activeTab !== "all" && lead.status !== activeTab) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNo = lead.lead_no.toLowerCase().includes(q);
        const matchName = lead.customer?.name.toLowerCase().includes(q);
        const matchPhone = lead.customer?.phone_e164.includes(q);
        const matchCity = lead.site_city?.toLowerCase().includes(q);
        if (!matchNo && !matchName && !matchPhone && !matchCity) return false;
      }

      return true;
    });
  }, [leads, activeTab, searchQuery]);

  const overdueCount = useMemo(() => {
    return leads.filter(
      (l) =>
        l.next_followup_at &&
        new Date(l.next_followup_at).getTime() < Date.now() &&
        !["converted", "lost"].includes(l.status)
    ).length;
  }, [leads]);

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    startTransition(async () => {
      const res = await createLead({
        name: newLead.name,
        phone_e164: newLead.phone,
        email: newLead.email || undefined,
        site_address: newLead.address || undefined,
        site_city: newLead.city || "Pune",
        source: newLead.source,
        requirement: newLead.system_type,
        requested_kw: Number(newLead.requested_kw),
        wants_subsidy: newLead.wants_subsidy,
        notes: newLead.notes || undefined,
      });

      if (!res.ok) {
        setFormError(res.error.message);
        return;
      }

      setShowCreateModal(false);
      router.refresh();
      if (res.data?.lead_id) {
        router.push(`/leads/${res.data.lead_id}`);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header / Stats Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sales Leads Queue</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
              {leads.length} Active Leads
            </span>
            {overdueCount > 0 && (
              <button
                onClick={() => setActiveTab("overdue")}
                className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 animate-pulse hover:bg-rose-200 transition-colors"
              >
                <AlertTriangle className="w-3 h-3 text-rose-600" />
                {overdueCount} Overdue Follow-ups
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Golden Thread step 1: Capture inquiry, qualify roof & bill, route to technical site survey.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium text-sm shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>New Lead</span>
        </button>
      </div>

      {/* Filter Tabs & Search Controls */}
      <GlassCard className="p-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: "all", label: "All Leads", count: leads.length },
              {
                id: "new",
                label: "New",
                count: leads.filter((l) => l.status === "new").length,
              },
              {
                id: "contacting",
                label: "Contacting",
                count: leads.filter((l) => l.status === "contacting").length,
              },
              {
                id: "follow_up",
                label: "Follow Up",
                count: leads.filter((l) => l.status === "follow_up").length,
              },
              {
                id: "converted",
                label: "Qualified",
                count: leads.filter((l) => l.status === "converted").length,
              },
              {
                id: "lost",
                label: "Lost",
                count: leads.filter((l) => l.status === "lost").length,
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

          {/* Search Box */}
          <div className="relative min-w-[240px] max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, phone, city, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white/70 border border-slate-200/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-slate-800 placeholder-slate-400 shadow-inner"
            />
          </div>
        </div>
      </GlassCard>

      {/* Leads Table / Card Grid */}
      <GlassCard className="overflow-hidden p-0 border border-slate-200/70">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Lead #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Requirement</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Follow-up</th>
                <th className="py-3 px-4">Assigned To</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-medium text-slate-700">No leads found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {searchQuery
                        ? "Try adjusting your search criteria"
                        : "New inquiries will appear here automatically."}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const isOverdue =
                    lead.next_followup_at &&
                    new Date(lead.next_followup_at).getTime() < Date.now() &&
                    !["converted", "lost"].includes(lead.status);

                  return (
                    <tr
                      key={lead.id}
                      className="hover:bg-amber-50/40 transition-colors group cursor-pointer"
                      onClick={() => router.push(`/leads/${lead.id}`)}
                    >
                      {/* Lead Number & Source */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-mono font-semibold text-slate-900">
                          <span>{lead.lead_no}</span>
                          {lead.wants_subsidy && (
                            <span
                              title="PM Surya Ghar Subsidy Requested"
                              className="w-2 h-2 rounded-full bg-emerald-500"
                            />
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5 capitalize">
                          <span>Source: {lead.source.replace("_", " ")}</span>
                          <span>•</span>
                          <span>{formatTimeAgo(lead.created_at)}</span>
                        </div>
                      </td>

                      {/* Customer Details */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900 group-hover:text-amber-600 transition-colors">
                          {lead.customer?.name}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                          <span className="font-mono">{lead.customer?.phone_e164}</span>
                          {lead.site_city && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-0.5 text-slate-400">
                                <MapPin className="w-2.5 h-2.5" />
                                {lead.site_city}
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Requirement */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-900">
                            {lead.requested_kw ? `${lead.requested_kw} kW` : "Custom"}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-slate-100 text-slate-700 capitalize">
                            {(lead.requirement || "on_grid").replace("_", "-")}
                          </span>
                        </div>
                        {lead.wants_subsidy && (
                          <div className="text-[10px] text-emerald-600 font-medium mt-0.5">
                            Govt Subsidy: ₹78k eligible
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <StatusBadge status={lead.status} />
                      </td>

                      {/* Follow-up / Overdue */}
                      <td className="py-3.5 px-4">
                        {lead.next_followup_at ? (
                          <div
                            className={`flex items-center gap-1.5 text-[11px] font-medium ${
                              isOverdue ? "text-rose-600 font-bold" : "text-slate-600"
                            }`}
                          >
                            {isOverdue && <AlertTriangle className="w-3.5 h-3.5 animate-bounce text-rose-500" />}
                            <span>{formatIstDate(lead.next_followup_at)}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">None scheduled</span>
                        )}
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {lead.attempt_count} attempt{lead.attempt_count === 1 ? "" : "s"}
                        </div>
                      </td>

                      {/* Assigned Owner */}
                      <td className="py-3.5 px-4">
                        <div className="text-slate-800 font-medium">
                          {lead.owner?.full_name || "Unassigned"}
                        </div>
                        <div className="text-[10px] text-slate-400">SunPower Sales</div>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/leads/${lead.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/60 transition-colors"
                        >
                          <span>Review</span>
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

      {/* Manual Lead Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Create New Solar Lead</h3>
                  <p className="text-xs text-slate-500">Record a phone call, walk-in or referral</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateLead} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kulkarni"
                    value={newLead.name}
                    onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/30 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Mobile Number * (10 digits)
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="9876543210"
                    value={newLead.phone}
                    onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/30 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    placeholder="customer@email.com"
                    value={newLead.email}
                    onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/30 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">City / Region *</label>
                  <input
                    type="text"
                    required
                    placeholder="Pune"
                    value={newLead.city}
                    onChange={(e) => setNewLead({ ...newLead, city: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/30 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Capacity (kW)</label>
                  <select
                    value={newLead.requested_kw}
                    onChange={(e) =>
                      setNewLead({ ...newLead, requested_kw: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    {[1, 2, 3, 4, 5, 8, 10].map((kw) => (
                      <option key={kw} value={kw}>
                        {kw} kW
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">System Type</label>
                  <select
                    value={newLead.system_type}
                    onChange={(e) =>
                      setNewLead({
                        ...newLead,
                        system_type: e.target.value as "on_grid" | "off_grid",
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="on_grid">On-Grid (Net Meter)</option>
                    <option value="off_grid">Off-Grid (Battery)</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Source</label>
                  <select
                    value={newLead.source}
                    onChange={(e) =>
                      setNewLead({
                        ...newLead,
                        source: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="call">Inbound Call</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="walk_in">Walk-in</option>
                    <option value="referral">Referral</option>
                    <option value="web">Web Form</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Site Address</label>
                <input
                  type="text"
                  placeholder="Plot / Society, Landmark, Pin code"
                  value={newLead.address}
                  onChange={(e) => setNewLead({ ...newLead, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/30 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="subsidy_check"
                  checked={newLead.wants_subsidy}
                  onChange={(e) =>
                    setNewLead({ ...newLead, wants_subsidy: e.target.checked })
                  }
                  className="rounded text-amber-500 focus:ring-amber-400"
                />
                <label htmlFor="subsidy_check" className="text-slate-700 font-medium">
                  Customer is interested in Central PM Surya Ghar Subsidy
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium shadow-md shadow-amber-500/20 disabled:opacity-50"
                >
                  {isPending ? "Saving..." : "Create Lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
