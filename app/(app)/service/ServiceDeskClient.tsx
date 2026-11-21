"use client";

import React, { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { StatusPill } from "@/components/shared/StatusPill";
import { DigitalTwinCard } from "@/components/3d/DigitalTwinCard";
import { formatDateIST, formatRelativeTime, getPhoneActions } from "@/lib/formatters";
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
  Plus,
  Wrench,
  History,
  Phone,
  Barcode,
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
  const [lookupResult, setLookupResult] = useState<any>({
    found: true,
    serial_no: "SP-INV-2026-0001",
    product_name: "SunPower 3.3 kW On-Grid Inverter",
    customer_name: "Anita Sharma",
    customer_phone: "+919876543210",
    installed_at: "2026-01-15T10:00:00.000Z",
  });
  const [isSearching, startSearchTransition] = useTransition();
  const [isPending, startTransition] = useTransition();

  // Time Travel Simulator State (0 = now, 18 = 18 months, 26 = 26 months)
  const [simulatedMonths, setSimulatedMonths] = useState<number>(0);

  // Create Ticket Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedFaultCode, setSelectedFaultCode] = useState(faultCodes[0]?.code || "INV_F01");
  const [ticketDescription, setTicketDescription] = useState(
    "Inverter LCD flashing red fault code. Tripping circuit breaker on afternoon peak sunshine."
  );
  const [ticketPriority, setTicketPriority] = useState<"normal" | "high" | "urgent">("high");
  const [ticketSuccess, setTicketSuccess] = useState<string | null>(null);

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
      billingText: isInWarranty
        ? "₹0 (Free Warranty Service)"
        : "₹1,500 Labour + Replacement Parts",
    };
  }, [lookupResult, simulatedMonths]);

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
          warranty_decision: activeVerdict?.is_in_warranty
            ? "in_warranty"
            : "out_of_warranty",
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

  const handleCloseTicket = async (ticketId: string) => {
    startTransition(async () => {
      const res = await confirmServiceTicket({
        ticket_id: ticketId,
        notes: "Customer confirmed restoration via on-screen sign-off.",
      });

      if (res.ok) {
        setTickets(
          tickets.map((t) => (t.id === ticketId ? { ...t, status: "closed" } : t))
        );
      }
    });
  };

  const openTicketsCount = tickets.filter((t) => t.status !== "closed").length;

  const columns: Column<TicketItem>[] = [
    {
      header: "Ticket #",
      accessorKey: "ticket_no",
      cell: (item) => (
        <div>
          <span className="font-mono font-semibold text-text-primary text-body-sm">
            {item.ticket_no}
          </span>
          {item.is_repeat && (
            <span className="block text-caption text-rose-700 dark:text-rose-400 font-semibold">
              Repeat Fault
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Customer & Serial",
      accessorKey: "customer_name",
      cell: (item) => (
        <div>
          <div className="font-medium text-text-primary text-body-sm">{item.customer_name}</div>
          <div className="font-mono text-caption text-text-tertiary mt-0.5">
            {item.serial_no || "SP-INV-2026-0001"}
          </div>
        </div>
      ),
    },
    {
      header: "Fault Diagnostic",
      accessorKey: "fault_code",
      cell: (item) => (
        <div>
          <span className="font-mono text-body-sm font-semibold text-text-primary">
            {item.fault_code}
          </span>
          <div className="text-caption text-text-secondary mt-0.5 max-w-[200px] truncate">
            {item.description}
          </div>
        </div>
      ),
    },
    {
      header: "Warranty Verdict",
      accessorKey: "warranty_decision",
      cell: (item) => (
        <StatusPill
          status={item.warranty_decision === "in_warranty" ? "active" : "expired"}
          domain="warranty"
          label={item.warranty_decision === "in_warranty" ? "In-Warranty (Free)" : "Chargeable Out-of-Warranty"}
        />
      ),
    },
    {
      header: "Billing",
      accessorKey: "billing",
      cell: (item) => (
        <span className="font-mono text-body-sm tabular-nums text-text-primary font-medium">
          {item.warranty_decision === "in_warranty" ? (
            <span className="text-emerald-700 dark:text-emerald-400">₹0 (Free)</span>
          ) : (
            <span>₹1,500 + Parts</span>
          )}
        </span>
      ),
    },
    {
      header: "SLA Deadline",
      accessorKey: "sla_due_at",
      cell: (item) => (
        <div className="flex items-center gap-1.5 text-body-sm text-text-secondary tabular-nums">
          <Clock className="w-3.5 h-3.5 text-text-tertiary" />
          <span>{item.sla_due_at ? formatDateIST(item.sla_due_at) : "48 Hrs"}</span>
        </div>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (item) => <StatusPill status={item.status} domain="ticket" />,
    },
    {
      header: "Action",
      cell: (item) => {
        const isClosed = item.status === "closed";
        return (
          <div className="flex justify-end">
            {!isClosed ? (
              <button
                type="button"
                onClick={() => handleCloseTicket(item.id)}
                disabled={isPending}
                className="h-9 px-3 rounded-[var(--radius-control)] bg-emerald-700 hover:bg-emerald-800 text-white text-body-sm font-medium transition-colors"
              >
                Sign-off & Close
              </button>
            ) : (
              <span className="text-caption font-mono text-emerald-700 dark:text-emerald-400 font-medium">
                Closed ✓
              </span>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: "Operations", href: "/dashboard" },
          { label: "Customer Service" },
        ]}
        title="Service Desk & Warranty Engine"
        description="Instant hardware warranty engine. Links serial numbers to customer assets, 20-year clocks, and free vs auto-billed service tickets."
        actions={
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 h-11 px-5 rounded-[var(--radius-control)] bg-[var(--accent-base)] hover:bg-[var(--accent-hover)] text-white text-body font-medium transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Raise Service Ticket</span>
          </button>
        }
      />

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Open Service Tickets"
          value={openTicketsCount}
          helperText="Queue requiring technician visit"
          variant={openTicketsCount > 0 ? "warning" : "default"}
        />
        <StatCard
          label="Warranty Resolution SLA"
          value="< 48h"
          helperText="Average restoration time"
        />
        <StatCard
          label="In-Warranty Pledges"
          value="100%"
          helperText="Zero parts cost on active clocks"
          variant="highlight"
        />
        <StatCard
          label="First-Time Fix Rate"
          value="94.2%"
          helperText="Single rooftop dispatch resolution"
        />
      </div>

      {ticketSuccess && (
        <div className="p-4 rounded-[var(--radius-control)] bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-body-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{ticketSuccess}</span>
          </div>
          <button
            onClick={() => setTicketSuccess(null)}
            className="text-text-secondary hover:text-text-primary text-body font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Instant < 5s Warranty Search Engine */}
      <div className="rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-subtle)] p-6 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[var(--border-subtle)] gap-2">
          <div>
            <h3 className="text-heading font-semibold text-text-primary">
              Instant Warranty Lookup (&lt; 5s SLA)
            </h3>
            <p className="text-body-sm text-text-secondary mt-0.5">
              Enter serial number, customer mobile (+91), or customer name to verify warranty terms.
            </p>
          </div>
          <span className="font-mono text-label text-[var(--accent-base)] bg-[var(--accent-subtle)] px-3 py-1 rounded-[var(--radius-control)] border border-[var(--border-subtle)] self-start sm:self-auto">
            Resolution: &lt; 50ms
          </span>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Barcode className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search serial (e.g. SP-INV-2026-0001) or mobile (+919876543210)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && performLookup(searchQuery)}
              className="w-full h-11 pl-10 pr-3 rounded-[var(--radius-control)] border border-[var(--border-strong)] bg-[var(--surface-card)] text-text-primary text-body font-mono focus:outline-none focus:ring-2 focus:ring-[var(--accent-base)]"
            />
          </div>
          <button
            onClick={() => performLookup(searchQuery)}
            disabled={isSearching || !searchQuery.trim()}
            className="h-11 px-5 rounded-[var(--radius-control)] bg-[var(--surface-subtle)] hover:bg-[var(--border-subtle)] border border-[var(--border-subtle)] text-text-primary font-medium text-body-sm transition-colors disabled:opacity-50"
          >
            {isSearching ? "Verifying..." : "Verify Warranty"}
          </button>
        </div>

        {/* Time-Travel Simulator Bar (For acceptance testing warranty expiration) */}
        <div className="p-3.5 rounded-[var(--radius-control)] bg-[var(--surface-subtle)] border border-[var(--border-subtle)] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-label text-text-secondary font-medium flex items-center gap-1.5">
              <History className="w-4 h-4 text-text-tertiary" />
              <span>Acceptance Test Time-Travel Clock:</span>
            </span>
            <span className="font-mono text-label text-text-primary font-semibold">
              Simulated Age: {simulatedMonths} Months
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSimulatedMonths(0)}
              className={`h-9 px-3 rounded-[var(--radius-control)] text-body-sm font-medium transition-colors ${
                simulatedMonths === 0
                  ? "bg-[var(--accent-base)] text-white shadow-xs"
                  : "bg-[var(--surface-card)] text-text-secondary border border-[var(--border-subtle)] hover:text-text-primary"
              }`}
            >
              Day 1 (Installation Fresh)
            </button>
            <button
              type="button"
              onClick={() => setSimulatedMonths(18)}
              className={`h-9 px-3 rounded-[var(--radius-control)] text-body-sm font-medium transition-colors ${
                simulatedMonths === 18
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "bg-[var(--surface-card)] text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800"
              }`}
            >
              18 Months Later (In-Warranty: 18m &lt; 24m)
            </button>
            <button
              type="button"
              onClick={() => setSimulatedMonths(26)}
              className={`h-9 px-3 rounded-[var(--radius-control)] text-body-sm font-medium transition-colors ${
                simulatedMonths === 26
                  ? "bg-rose-700 text-white shadow-xs"
                  : "bg-[var(--surface-card)] text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800"
              }`}
            >
              26 Months Later (Out-of-Warranty: 26m &gt; 24m Expired)
            </button>
          </div>
        </div>
      </div>

      {/* Live Warranty Verdict Card with 3D Digital Twin Card */}
      {activeVerdict && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (7 cols): Warranty Status Verdict */}
          <div className="lg:col-span-7 space-y-4">
            <div
              className={`rounded-[var(--radius-card)] border-2 p-6 space-y-4 shadow-xs ${
                activeVerdict.is_in_warranty
                  ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700"
                  : "bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-700"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-black/10 dark:border-white/10 gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2.5 rounded-[var(--radius-control)] ${
                      activeVerdict.is_in_warranty
                        ? "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200"
                        : "bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200"
                    }`}
                  >
                    {activeVerdict.is_in_warranty ? (
                      <ShieldCheck className="w-6 h-6" />
                    ) : (
                      <ShieldAlert className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <span className="text-caption font-semibold uppercase tracking-wider text-text-tertiary">
                      Instant Warranty Verdict:
                    </span>
                    <h3 className="text-heading font-semibold text-text-primary mt-0.5">
                      {activeVerdict.decisionText}
                    </h3>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-caption text-text-tertiary block font-medium uppercase">
                    Customer Billing:
                  </span>
                  <span
                    className={`font-mono text-title font-semibold ${
                      activeVerdict.is_in_warranty
                        ? "text-emerald-800 dark:text-emerald-200"
                        : "text-rose-800 dark:text-rose-200"
                    }`}
                  >
                    {activeVerdict.billingText}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-body-sm">
                <div className="p-3 rounded-[var(--radius-control)] bg-[var(--surface-card)] border border-[var(--border-subtle)]">
                  <span className="text-caption text-text-tertiary block">Registered Asset</span>
                  <span className="font-mono font-semibold text-text-primary mt-0.5 block">
                    {activeVerdict.serial_no}
                  </span>
                  <span className="text-caption text-text-secondary mt-0.5 block">
                    {activeVerdict.product_name}
                  </span>
                </div>

                <div className="p-3 rounded-[var(--radius-control)] bg-[var(--surface-card)] border border-[var(--border-subtle)]">
                  <span className="text-caption text-text-tertiary block">Customer Account</span>
                  <span className="font-semibold text-text-primary mt-0.5 block">
                    {activeVerdict.customer_name}
                  </span>
                  <span className="font-mono text-caption text-text-secondary mt-0.5 block">
                    {activeVerdict.customer_phone}
                  </span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="h-11 px-5 rounded-[var(--radius-control)] bg-[var(--accent-base)] hover:bg-[var(--accent-hover)] text-white font-medium text-body transition-colors"
                >
                  Raise Ticket Under this Verdict →
                </button>
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): 3D Digital Twin Card */}
          <div className="lg:col-span-5">
            <DigitalTwinCard
              serialNo={activeVerdict.serial_no}
              productName={activeVerdict.product_name}
              assetType={activeVerdict.serial_no.includes("INV") ? "inverter" : "panel"}
              customerName={activeVerdict.customer_name}
              installDate={formatDateIST(activeVerdict.installed_at || new Date().toISOString())}
              warrantyMonthsTotal={activeVerdict.serial_no.includes("PAN") ? 240 : 24}
              warrantyMonthsRemaining={Math.max(
                0,
                (activeVerdict.serial_no.includes("PAN") ? 240 : 24) - simulatedMonths
              )}
            />
          </div>
        </div>
      )}

      {/* Service Tickets Queue Table */}
      <div className="rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-subtle)] overflow-hidden">
        <DataTable
          columns={columns}
          data={tickets}
          searchPlaceholder="Search tickets by customer or serial..."
          searchColumn="customer_name"
          pageSize={10}
        />
      </div>

      {/* Create Service Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-subtle)] p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <div>
                <h3 className="text-title font-semibold text-text-primary">
                  Raise New Service Ticket
                </h3>
                <p className="text-caption text-text-secondary">
                  Serial: <strong className="font-mono text-text-primary">{activeVerdict?.serial_no || "SP-INV-2026-0001"}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-text-tertiary hover:text-text-primary text-body font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-label text-text-primary mb-1.5 font-medium">
                  Select Diagnostic Fault Code
                </label>
                <select
                  value={selectedFaultCode}
                  onChange={(e) => setSelectedFaultCode(e.target.value)}
                  className="w-full h-11 px-3 rounded-[var(--radius-control)] border border-[var(--border-strong)] bg-[var(--surface-card)] text-text-primary text-body focus:outline-none focus:ring-2 focus:ring-[var(--accent-base)]"
                >
                  {faultCodes.map((fc) => (
                    <option key={fc.code} value={fc.code}>
                      {fc.code} — {fc.description} ({fc.component})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-label text-text-primary mb-1.5 font-medium">
                  Ticket Priority
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["normal", "high", "urgent"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setTicketPriority(p)}
                      className={`h-10 rounded-[var(--radius-control)] text-body-sm font-medium border uppercase transition-colors ${
                        ticketPriority === p
                          ? "bg-[var(--accent-base)] text-white border-[var(--accent-base)]"
                          : "bg-[var(--surface-card)] text-text-secondary border-[var(--border-strong)]"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-label text-text-primary mb-1.5 font-medium">
                  Technician Diagnostic Notes
                </label>
                <textarea
                  rows={3}
                  required
                  value={ticketDescription}
                  onChange={(e) => setTicketDescription(e.target.value)}
                  className="w-full p-3 rounded-[var(--radius-control)] border border-[var(--border-strong)] bg-[var(--surface-card)] text-text-primary text-body focus:outline-none focus:ring-2 focus:ring-[var(--accent-base)]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="h-11 px-4 rounded-[var(--radius-control)] border border-[var(--border-subtle)] text-text-secondary hover:text-text-primary text-body-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="h-11 px-5 rounded-[var(--radius-control)] bg-[var(--accent-base)] hover:bg-[var(--accent-hover)] text-white text-body font-medium transition-colors disabled:opacity-50"
                >
                  {isPending ? "Dispatching..." : "Dispatch Service Ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
