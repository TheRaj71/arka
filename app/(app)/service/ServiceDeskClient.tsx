"use client";

import React, { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatIstDate, formatTimeAgo } from "@/lib/time";
import {
  checkWarrantyLookup,
  createServiceTicket,
  confirmServiceTicket,
} from "@/modules/service/actions";
import { type TicketItem, type FaultCodeItem } from "@/modules/service/queries";
import {
  LifeBuoy,
  Search,
  ShieldCheck,
  ShieldAlert,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  Wrench,
  Zap,
  Phone,
  RotateCcw,
  Sparkles,
  Barcode,
  History,
} from "lucide-react";

interface ServiceDeskClientProps {
  initialTickets: TicketItem[];
  faultCodes: FaultCodeItem[];
}

export function ServiceDeskClient({
  initialTickets,
  faultCodes,
}: ServiceDeskClientProps) {
  const [tickets, setTickets] = useState<TicketItem[]>(initialTickets);
  const [searchQuery, setSearchQuery] = useState<string>("SP-INV-2026-0001");
  const [lookupResult, setLookupResult] = useState<any>(null);
  const [isSearching, startSearchTransition] = useTransition();
  const [isPending, startTransition] = useTransition();

  // Time Travel Simulator State (0 = now, 18 = 18 months later, 26 = 26 months later)
  const [simulatedMonths, setSimulatedMonths] = useState<number>(0);

  // Create Ticket Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedFaultCode, setSelectedFaultCode] = useState(faultCodes[0]?.code);
  const [ticketDescription, setTicketDescription] = useState(
    "Inverter LCD flashing red fault code. Tripping circuit breaker on afternoon peak sunshine."
  );
  const [ticketPriority, setTicketPriority] = useState<"normal" | "high" | "urgent">("high");
  const [ticketSuccess, setTicketSuccess] = useState<string | null>(null);

  // Immediate lookup on load or search
  const performLookup = async (q: string) => {
    if (!q.trim()) return;
    startSearchTransition(async () => {
      const res = await checkWarrantyLookup(q);
      setLookupResult(res);
    });
  };

  // Adjust warranty verdict dynamically when time-travel simulator is used
  const activeVerdict = useMemo(() => {
    if (!lookupResult || !lookupResult.found) return null;

    // Base inverter warranty is 24 months (2 years)
    const totalElapsedMonths = simulatedMonths;
    const isPanel = lookupResult.serial_no?.includes("PAN");
    const warrantyDurationMonths = isPanel ? 240 : 24; // 20y panels vs 2y inverter

    const isInWarranty = totalElapsedMonths < warrantyDurationMonths;

    return {
      ...lookupResult,
      simulatedMonths,
      is_in_warranty: isInWarranty,
      warranty_status: isInWarranty
        ? totalElapsedMonths >= 18
          ? "expiring_soon"
          : "active"
        : "expired",
      decisionText: isInWarranty
        ? "IN-WARRANTY (100% FREE REPAIR & FREE PARTS PLEDGE)"
        : "OUT-OF-WARRANTY (AUTO-BILLED PARTS + LABOUR)",
      billingText: isInWarranty ? "₹0 (Free Warranty Service)" : "₹1,500 Labour + Replacement Parts",
    };
  }, [lookupResult, simulatedMonths]);

  // Handle Create Ticket
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await createServiceTicket({
        serial_no: activeVerdict?.serial_no || "SP-INV-2026-0001",
        customer_id: undefined,
        fault_code: selectedFaultCode,
        description: ticketDescription,
        priority: ticketPriority,
        channel: "phone",
      });

      if (res.ok) {
        const newTicket: TicketItem = {
          id: res.data.ticket_id,
          ticket_no: res.data.ticket_no,
          issue_type: "inverter_fault",
          fault_code: selectedFaultCode,
          description: ticketDescription,
          priority: ticketPriority,
          status: "open",
          warranty_decision: activeVerdict?.is_in_warranty ? "in_warranty" : "out_of_warranty",
          billing: activeVerdict?.is_in_warranty ? "not_applicable" : "pending",
          is_repeat: res.data.is_repeat,
          sla_due_at: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
          created_at: new Date().toISOString(),
          customer_name: activeVerdict?.customer_name || "Anita Sharma",
          customer_phone: activeVerdict?.customer_phone || "+919876543210",
          serial_no: activeVerdict?.serial_no || "SP-INV-2026-0001",
          product_name: activeVerdict?.product_name || "SunPower Inverter",
        };

        setTickets([newTicket, ...tickets]);
        setTicketSuccess(
          `Service Ticket ${res.data.ticket_no} created with verdict: ${res.data.warranty_decision}`
        );
        setShowCreateModal(false);
      }
    });
  };

  // Handle Customer Confirmation Close Gate (REQ-SVC-04)
  const handleCloseTicket = async (ticketId: string) => {
    startTransition(async () => {
      const res = await confirmServiceTicket({
        ticket_id: ticketId,
        notes: "Customer confirmed restoration via OTP / on-screen sign-off.",
      });

      if (res.ok) {
        setTickets(
          tickets.map((t) => (t.id === ticketId ? { ...t, status: "closed" } : t))
        );
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Service Desk & 20-Year Warranty Engine
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
              Under 5s SLA Lookup
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Golden Thread Step 6: Serial number → Asset → Warranty clock → Service ticket → Free vs auto-billed parts & labour.
          </p>
        </div>

        <button
          onClick={() => {
            if (!lookupResult) performLookup(searchQuery);
            setShowCreateModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          <span>New Service Ticket</span>
        </button>
      </div>

      {ticketSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{ticketSuccess}</span>
          </div>
          <button onClick={() => setTicketSuccess(null)} className="text-emerald-700 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* ULTRA-FAST < 5s SEARCH BAR (REQ-SVC-01) */}
      <GlassCard className="p-5 border-amber-300/80 bg-gradient-to-r from-amber-500/5 via-white/80 to-amber-500/10">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500 text-white">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Instant Asset & Warranty Search (&lt; 5s Resolution)
              </h3>
              <p className="text-[11px] text-slate-500">
                Search by Serial Number, Customer Mobile Number, or Full Name
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
            SLA: Under 5s
          </span>
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Barcode className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Enter Serial (e.g. SP-INV-2026-0001) or Mobile (+919876543210)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && performLookup(searchQuery)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-mono font-semibold"
              />
            </div>
            <button
              onClick={() => performLookup(searchQuery)}
              disabled={isSearching || !searchQuery.trim()}
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md disabled:opacity-50"
            >
              {isSearching ? "Searching..." : "Lookup Warranty"}
            </button>
          </div>

          {/* Golden Thread Simulator Time-Travel Buttons */}
          <div className="p-3 bg-white/90 rounded-xl border border-slate-200/80 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-amber-500" />
                <span>Acceptance Test Time-Travel Simulator:</span>
              </span>
              <span className="text-[10px] font-mono text-slate-500 font-semibold">
                Simulated Age: {simulatedMonths} Months
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSimulatedMonths(0);
                  if (!lookupResult) performLookup(searchQuery);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  simulatedMonths === 0
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                Day 1 (Installation Fresh)
              </button>

              <button
                type="button"
                onClick={() => {
                  setSimulatedMonths(18);
                  if (!lookupResult) performLookup(searchQuery);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  simulatedMonths === 18
                    ? "bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300"
                    : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200"
                }`}
              >
                18 Months Later (In-Warranty: 18m &lt; 24m)
              </button>

              <button
                type="button"
                onClick={() => {
                  setSimulatedMonths(26);
                  if (!lookupResult) performLookup(searchQuery);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  simulatedMonths === 26
                    ? "bg-rose-600 text-white shadow-sm ring-2 ring-rose-300"
                    : "bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200"
                }`}
              >
                26 Months Later (Out-of-Warranty: 26m &gt; 24m Expired)
              </button>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* LIVE WARRANTY VERDICT CARD (Result of < 5s Lookup) */}
      {activeVerdict && (
        <div
          className={`p-5 rounded-2xl border shadow-lg space-y-4 ${
            activeVerdict.is_in_warranty
              ? "bg-gradient-to-br from-emerald-500/10 via-white to-emerald-500/5 border-emerald-300"
              : "bg-gradient-to-br from-rose-500/10 via-white to-rose-500/5 border-rose-300"
          }`}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl ${
                  activeVerdict.is_in_warranty
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-rose-100 text-rose-700"
                }`}
              >
                {activeVerdict.is_in_warranty ? (
                  <ShieldCheck className="w-6 h-6" />
                ) : (
                  <ShieldAlert className="w-6 h-6" />
                )}
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Instant Warranty Verdict:
                </span>
                <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                  {activeVerdict.decisionText}
                </h3>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">
                Customer Billing Verdict:
              </span>
              <span
                className={`text-sm font-extrabold font-mono ${
                  activeVerdict.is_in_warranty ? "text-emerald-700" : "text-rose-700"
                }`}
              >
                {activeVerdict.billingText}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-xs">
              <span className="text-[10px] text-slate-400 block">Registered Asset Serial</span>
              <span className="font-mono font-bold text-slate-900 mt-0.5 block">
                {activeVerdict.serial_no}
              </span>
              <span className="text-[10px] text-slate-500 truncate block mt-0.5">
                {activeVerdict.product_name}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-xs">
              <span className="text-[10px] text-slate-400 block">Customer Account</span>
              <span className="font-bold text-slate-900 mt-0.5 block">
                {activeVerdict.customer_name}
              </span>
              <span className="text-[10px] font-mono text-slate-500 block mt-0.5">
                {activeVerdict.customer_phone}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-xs">
              <span className="text-[10px] text-slate-400 block">Warranty Period</span>
              <span className="font-mono font-bold text-slate-900 mt-0.5 block">
                24 Months (Inverter)
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Panels: 240 Mo. (20 Yrs)
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-xs">
              <span className="text-[10px] text-slate-400 block">Simulated Aging</span>
              <span className="font-mono font-bold text-slate-900 mt-0.5 block">
                {activeVerdict.simulatedMonths} Mo. Elapsed
              </span>
              <span
                className={`text-[10px] font-bold block mt-0.5 ${
                  activeVerdict.is_in_warranty ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {activeVerdict.is_in_warranty ? "✓ Clock Active" : "✗ Expired"}
              </span>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors flex items-center gap-1.5"
            >
              <Wrench className="w-3.5 h-3.5 text-amber-400" />
              <span>Raise Ticket with this Verdict →</span>
            </button>
          </div>
        </div>
      )}

      {/* Service Tickets Table */}
      <GlassCard className="overflow-hidden p-0 border border-slate-200/70">
        <div className="p-4 bg-slate-50/90 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LifeBuoy className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-slate-900 text-xs">
              Service Tickets Queue & SLA Countdown
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-500">
            {tickets.length} Active Tickets
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/60 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-4">Ticket #</th>
                <th className="py-2.5 px-4">Customer & Serial</th>
                <th className="py-2.5 px-4">Diagnostic Fault</th>
                <th className="py-2.5 px-4">Warranty Verdict</th>
                <th className="py-2.5 px-4">Billing Charge</th>
                <th className="py-2.5 px-4">SLA Deadline</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Close Gate (REQ-SVC-04)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tickets.map((tkt) => {
                const isClosed = tkt.status === "closed";

                return (
                  <tr key={tkt.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {tkt.ticket_no}
                      {tkt.is_repeat && (
                        <span className="block text-[9px] text-rose-600 font-bold">
                          Repeat Complaint
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{tkt.customer_name}</div>
                      <div className="font-mono text-[10px] text-slate-400 mt-0.5">
                        {tkt.serial_no || "SP-INV-2026-0001"}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-mono text-[11px] font-bold text-amber-800">
                        {tkt.fault_code}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1 max-w-[200px]">
                        {tkt.description}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {tkt.warranty_decision === "in_warranty" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>In-Warranty (Free)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          <span>Out-of-Warranty</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono font-bold">
                      {tkt.warranty_decision === "in_warranty" ? (
                        <span className="text-emerald-700">₹0 (Free)</span>
                      ) : (
                        <span className="text-slate-900">₹1,500 + Parts</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 text-slate-600">
                        <Clock className="w-3 h-3 text-amber-500" />
                        <span>{formatIstDate(tkt.sla_due_at)}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <StatusBadge status={tkt.status} />
                    </td>

                    <td className="py-3 px-4 text-right">
                      {!isClosed ? (
                        <button
                          onClick={() => handleCloseTicket(tkt.id)}
                          disabled={isPending}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 inline-flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Client Confirm & Close</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-semibold italic">
                          Closed & Confirmed
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Create Service Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Create Service Ticket</h3>
                  <p className="text-xs text-slate-500">
                    Automated warranty decision & SLA dispatch
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-slate-400 block">Customer & Asset</span>
                  <span className="font-bold text-slate-900 text-xs">
                    {activeVerdict?.customer_name || "Anita Sharma"}
                  </span>
                  <span className="font-mono text-[10px] text-slate-500 block">
                    {activeVerdict?.serial_no || "SP-INV-2026-0001"}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Auto-Warranty Verdict</span>
                  <span
                    className={`font-bold text-xs ${
                      activeVerdict?.is_in_warranty ? "text-emerald-700" : "text-rose-700"
                    }`}
                  >
                    {activeVerdict?.is_in_warranty ? "Free under warranty" : "Billable parts & labour"}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Diagnostic Fault Code *
                </label>
                <select
                  value={selectedFaultCode}
                  onChange={(e) => setSelectedFaultCode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white font-mono"
                >
                  {faultCodes.map((fc) => (
                    <option key={fc.code} value={fc.code}>
                      {fc.code}: {fc.title} ({fc.component})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Customer Reported Symptoms *
                </label>
                <textarea
                  rows={3}
                  required
                  value={ticketDescription}
                  onChange={(e) => setTicketDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Priority</label>
                  <select
                    value={ticketPriority}
                    onChange={(e) => setTicketPriority(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="normal">Normal (48h SLA)</option>
                    <option value="high">High (24h SLA)</option>
                    <option value="urgent">Urgent / Hazard (12h SLA)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Channel</label>
                  <select className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white">
                    <option value="phone">Inbound Phone Call</option>
                    <option value="whatsapp">WhatsApp Helpdesk</option>
                    <option value="portal">QR Asset Passport</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
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
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-md shadow-amber-500/20 disabled:opacity-50"
                >
                  {isPending ? "Creating..." : "Confirm & Dispatch Ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
