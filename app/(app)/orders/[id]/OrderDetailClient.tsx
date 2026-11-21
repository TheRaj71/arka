"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusPill } from "@/components/shared/StatusPill";
import { StepperTracker } from "@/components/shared/StepperTracker";
import { EntityHeader } from "@/components/shared/EntityHeader";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { formatPaise, formatDateIST } from "@/lib/formatters";
import { recordOrderPayment } from "@/modules/orders/actions";
import { type OrderItem } from "@/modules/orders/queries";
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Truck,
  Wrench,
  Calendar,
  Lock,
  ArrowRight,
  Layers,
  Clock,
  X,
} from "lucide-react";

interface OrderDetailClientProps {
  order: OrderItem;
  userRole?: string;
}

export function OrderDetailClient({ order: initialOrder, userRole }: OrderDetailClientProps) {
  const router = useRouter();
  const [order, setOrder] = useState<OrderItem>(initialOrder);
  const [isPending, startTransition] = useTransition();

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmountPaise, setPaymentAmountPaise] = useState<number>(
    Math.max(0, Number(order.advance_required_paise - order.paid_paise))
  );
  const [paymentMethod, setPaymentMethod] = useState<"bank_transfer" | "upi" | "cheque" | "cash" | "card">("upi");
  const [reference, setReference] = useState<string>("UPI-" + Math.floor(10000000 + Math.random() * 90000000));
  const [paymentNotes, setPaymentNotes] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isConfirmed = order.status !== "pending_payment";
  const advanceMet = order.paid_paise >= order.advance_required_paise;
  const progressPct = Math.min(100, Math.round((Number(order.paid_paise) / Number(order.total_paise)) * 100));

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    startTransition(async () => {
      const res = await recordOrderPayment({
        order_id: order.id,
        amount_paise: paymentAmountPaise,
        method: paymentMethod,
        reference,
        notes: paymentNotes || undefined,
      });

      if (!res.ok) {
        setErrorMessage(res.error?.message || "Failed to record payment.");
      } else {
        setShowPaymentModal(false);
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Page Header */}
      <PageHeader
        title={`Order ${order.order_no}`}
        description="Fulfillment tracking, payment allocations, warehouse pick-lists, and crew installation dispatch."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Orders", href: "/orders" },
          { label: order.order_no },
        ]}
      />

      {/* Entity Header */}
      <EntityHeader
        title={order.project?.customer?.name || order.delivery_name || "Order Details"}
        badgeCode={order.order_no}
        status={order.status}
        phone={order.project?.customer?.phone_e164}
        meta={[
          { label: "Total Value", value: formatPaise(order.total_paise) },
          { label: "50% Advance Req.", value: formatPaise(order.advance_required_paise) },
          { label: "Amount Paid", value: formatPaise(order.paid_paise) },
          { label: "Site Address", value: order.delivery_address || "Punjab" },
          { label: "Order Date", value: formatDateIST(order.created_at) },
          { label: "Confirmed", value: order.confirmed_at ? formatDateIST(order.confirmed_at) : "Pending Advance" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            {!advanceMet && (
              <button
                onClick={() => setShowPaymentModal(true)}
                className="btn-primary h-10 px-4 text-body-sm font-semibold inline-flex items-center gap-1.5"
              >
                <CreditCard className="w-4 h-4" />
                <span>Record Advance Payment</span>
              </button>
            )}
            {advanceMet && (
              <Link
                href="/warehouse"
                className="btn-primary h-10 px-4 text-body-sm font-semibold inline-flex items-center gap-1.5"
              >
                <Truck className="w-4 h-4" />
                <span>Warehouse Scan Station</span>
              </Link>
            )}
          </div>
        }
      />

      {/* Stepper Golden Thread */}
      <StepperTracker
        currentStage={order.status === "pending_payment" ? "order" : order.status === "confirmed" ? "dispatch" : "install"}
        blockerMessage={
          !advanceMet
            ? "AUTOMATION GATE (A6): Warehouse pick-list and installation job are locked until 50% advance payment is received."
            : undefined
        }
        nextActionOwner={advanceMet ? "Warehouse Storekeeper (Scan Serials)" : "Accounts (Record Payment)"}
      />

      {/* Main Grid: Payment Progress & Fulfillment Automation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 6 cols: Payment Progress & History */}
        <div className="lg:col-span-6 space-y-4">
          <div className="card-surface p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <div>
                <h3 className="text-heading font-semibold text-[var(--text-primary)]">
                  Payment Progress & Reconciliation
                </h3>
                <span className="text-caption text-[var(--text-muted)]">
                  50% advance requirement trigger for automated execution.
                </span>
              </div>
              <span className="text-heading font-mono font-bold tabular-nums text-[var(--text-primary)]">
                {progressPct}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="h-3 w-full bg-[var(--surface-subtle)] rounded-full overflow-hidden border border-[var(--border-subtle)]">
                <div
                  className="h-full bg-[var(--accent-base)] transition-all duration-500 rounded-full"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-caption text-[var(--text-muted)] font-mono">
                <span>Received: {formatPaise(order.paid_paise)}</span>
                <span>Required: {formatPaise(order.advance_required_paise)} (50%)</span>
              </div>
            </div>

            {/* Payment Transactions Table */}
            <div className="pt-2">
              <span className="text-label text-xs uppercase tracking-wider block text-[var(--text-muted)] mb-2">
                Recorded Transactions
              </span>
              <div className="border border-[var(--border-subtle)] rounded-md overflow-hidden">
                <table className="w-full text-left text-body-sm">
                  <thead className="bg-[var(--surface-subtle)] border-b border-[var(--border-subtle)] text-label text-xs">
                    <tr>
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Mode</th>
                      <th className="py-2 px-3">Reference</th>
                      <th className="py-2 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    {order.payments && order.payments.length > 0 ? (
                      order.payments.map((p, idx) => (
                        <tr key={idx} className="hover:bg-[var(--surface-hover)]">
                          <td className="py-2.5 px-3 font-mono text-xs">{formatDateIST(p.received_at)}</td>
                          <td className="py-2.5 px-3 capitalize">{p.method?.replace("_", " ")}</td>
                          <td className="py-2.5 px-3 font-mono text-xs text-[var(--text-muted)]">{p.reference || "—"}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold tabular-nums text-[var(--success-base)]">
                            {formatPaise(p.amount_paise)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-[var(--text-muted)]">
                          No payments recorded yet. Record 50% advance to confirm order.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Right 6 cols: 'What Happens Next' Automation Status */}
        <div className="lg:col-span-6 space-y-4">
          <div className="card-surface p-5 space-y-4">
            <div className="pb-3 border-b border-[var(--border-subtle)]">
              <h3 className="text-heading font-semibold text-[var(--text-primary)]">
                Fulfillment & Execution Pipeline
              </h3>
              <p className="text-caption text-[var(--text-muted)]">
                Automated pipeline triggers verified by the Arka workflow state machine.
              </p>
            </div>

            <div className="space-y-3">
              {/* Pipeline Step 1 */}
              <div className="p-3.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-subtle)] flex items-start gap-3">
                <div className={`p-2 rounded-md ${advanceMet ? "bg-[var(--success-subtle)] text-[var(--success-base)]" : "bg-[var(--surface-card)] text-[var(--text-muted)]"}`}>
                  <CreditCard className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="text-body-sm font-semibold text-[var(--text-primary)]">
                    1. 50% Advance Payment Gate (A6)
                  </div>
                  <div className="text-caption text-[var(--text-secondary)] mt-0.5">
                    {advanceMet ? "Advance payment verified. Order automatically confirmed." : "Awaiting customer advance transfer to initiate stock reservation."}
                  </div>
                </div>
                <StatusPill status={advanceMet ? "confirmed" : "pending_payment"} size="sm" />
              </div>

              {/* Pipeline Step 2 */}
              <div className="p-3.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-subtle)] flex items-start gap-3">
                <div className={`p-2 rounded-md ${isConfirmed ? "bg-[var(--accent-subtle)] text-[var(--accent-base)]" : "bg-[var(--surface-card)] text-[var(--text-muted)]"}`}>
                  <Truck className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="text-body-sm font-semibold text-[var(--text-primary)]">
                    2. Warehouse Pick-list & Serial Reservation
                  </div>
                  <div className="text-caption text-[var(--text-secondary)] mt-0.5">
                    {isConfirmed ? "Pick-list queued for storekeeper. Hardware ready for barcode scan dispatch." : "Locked until order confirmation."}
                  </div>
                </div>
                <StatusPill status={isConfirmed ? "in_progress" : "draft"} size="sm" />
              </div>

              {/* Pipeline Step 3 */}
              <div className="p-3.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-subtle)] flex items-start gap-3">
                <div className={`p-2 rounded-md ${order.status === "installed" ? "bg-[var(--success-subtle)] text-[var(--success-base)]" : "bg-[var(--surface-card)] text-[var(--text-muted)]"}`}>
                  <Wrench className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="text-body-sm font-semibold text-[var(--text-primary)]">
                    3. Field Installation & Commissioning Job
                  </div>
                  <div className="text-caption text-[var(--text-secondary)] mt-0.5">
                    {order.status === "installed" ? "Installation complete with geotagged photos and customer signoff." : "Installation scheduled on technician calendar."}
                  </div>
                </div>
                <StatusPill status={order.status === "installed" ? "installed" : "scheduled"} size="sm" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Record Advance Payment Drawer */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setShowPaymentModal(false)} />
          <form onSubmit={handleRecordPayment} className="relative card-surface p-6 max-w-md w-full border border-[var(--border-strong)] shadow-[var(--shadow-modal)] space-y-4 z-10">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
              <h3 className="text-title font-semibold text-[var(--text-primary)]">
                Record Customer Payment
              </h3>
              <button type="button" onClick={() => setShowPaymentModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-md bg-[var(--danger-subtle)] border border-[var(--danger-border)] text-body-sm text-[var(--danger-text)]">
                {errorMessage}
              </div>
            )}

            <MoneyInput
              label="Amount Received (Paise Controlled)"
              valueInPaise={paymentAmountPaise}
              onChangePaise={setPaymentAmountPaise}
            />

            <div>
              <label className="text-label block mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="input-standard"
              >
                <option value="upi">UPI (GPay, PhonePe, Paytm)</option>
                <option value="bank_transfer">NEFT / RTGS / IMPS Bank Transfer</option>
                <option value="cheque">Cheque</option>
                <option value="card">Debit / Credit Card</option>
                <option value="cash">Cash</option>
              </select>
            </div>

            <div>
              <label className="text-label block mb-1">Transaction UTR / Cheque Ref</label>
              <input
                type="text"
                required
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. UTR12345678"
                className="input-standard font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
              <button type="button" onClick={() => setShowPaymentModal(false)} className="btn-secondary h-10 px-4">
                Cancel
              </button>
              <button type="submit" disabled={isPending} className="btn-primary h-10 px-4">
                {isPending ? "Recording..." : "Confirm Payment Receipt"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
