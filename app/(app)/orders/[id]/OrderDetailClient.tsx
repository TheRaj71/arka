"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatMoney } from "@/lib/money";
import { formatIstDate, formatTimeAgo } from "@/lib/time";
import { recordOrderPayment, confirmOrder } from "@/modules/orders/actions";
import { type OrderItem } from "@/modules/orders/queries";
import {
  ArrowLeft,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  ShoppingBag,
  Layers,
  Truck,
  Wrench,
  Calendar,
  Lock,
  Sparkles,
  ExternalLink,
  DollarSign,
  Send,
  Zap,
} from "lucide-react";

interface OrderDetailClientProps {
  order: OrderItem;
  userRole?: string;
}

export function OrderDetailClient({ order: initialOrder, userRole }: OrderDetailClientProps) {
  const router = useRouter();
  const [order, setOrder] = useState<OrderItem>(initialOrder);
  const [isPending, startTransition] = useTransition();

  // Payment form state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmountRupees, setPaymentAmountRupees] = useState<number>(
    Number(order.advance_required_paise) / 100
  );
  const [paymentMethod, setPaymentMethod] = useState<
    "bank_transfer" | "upi" | "cheque" | "cash" | "card"
  >("bank_transfer");
  const [reference, setReference] = useState<string>("HDFC" + Math.floor(1000000000 + Math.random() * 9000000000));
  const [paymentNotes, setPaymentNotes] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [automationTriggered, setAutomationTriggered] = useState(false);

  const isConfirmed = order.status !== "pending_payment";
  const advanceMet = order.paid_paise >= order.advance_required_paise;

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    startTransition(async () => {
      const res = await recordOrderPayment({
        order_id: order.id,
        amount_paise: paymentAmountRupees * 100,
        method: paymentMethod,
        reference,
        notes: paymentNotes || undefined,
      });

      if (!res.ok) {
        setErrorMessage(res.error.message);
        return;
      }

      const newPaid = order.paid_paise + BigInt(paymentAmountRupees * 100);
      const isNowAdvanceMet = newPaid >= order.advance_required_paise;

      setOrder({
        ...order,
        paid_paise: newPaid,
        balance_due_paise: order.total_paise > newPaid ? order.total_paise - newPaid : 0n,
        pay_status: isNowAdvanceMet ? "advance_met" : "partial",
        status: isNowAdvanceMet ? "confirmed" : order.status,
        confirmed_at: isNowAdvanceMet ? new Date().toISOString() : order.confirmed_at,
        payments: [
          {
            id: res.data.payment_id,
            payment_no: res.data.payment_no,
            amount_paise: BigInt(paymentAmountRupees * 100),
            kind: order.paid_paise === 0n ? "advance" : "balance",
            method: paymentMethod,
            reference,
            received_at: new Date().toISOString(),
            status: "received",
          },
          ...(order.payments || []),
        ],
      });

      if (isNowAdvanceMet) {
        setAutomationTriggered(true);
      }

      setShowPaymentModal(false);
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/orders"
            className="p-2 rounded-xl bg-white/70 hover:bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 shadow-sm transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
                {order.order_no}
              </h1>
              <StatusBadge status={order.status} />
              <StatusBadge status={order.pay_status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Project <span className="font-mono font-bold">{order.project?.project_no}</span> •
              Client: <span className="font-semibold text-slate-800">{order.project?.customer?.name}</span>
            </p>
          </div>
        </div>

        {/* Action Button: Record Payment */}
        <div className="flex items-center gap-2">
          {order.balance_due_paise > 0n && (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <CreditCard className="w-4 h-4" />
              <span>
                {order.paid_paise === 0n ? "Record 50% Advance Payment" : "Record Balance Payment"}
              </span>
            </button>
          )}

          {isConfirmed && (
            <Link
              href="/warehouse"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors"
            >
              <Truck className="w-3.5 h-3.5 text-amber-400" />
              <span>Warehouse Dispatch →</span>
            </Link>
          )}
        </div>
      </div>

      {/* AUTOMATION A6 BANNER (Golden Thread Milestone) */}
      {(isConfirmed || automationTriggered) ? (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-600 text-white shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-md">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm">
                  Automation A6 Triggered: Order Confirmed & Dispatched!
                </h3>
                <p className="text-xs text-emerald-100">
                  Advance milestone satisfied. The system has automatically executed 3 downstream operations:
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold bg-white/20 px-3 py-1 rounded-lg">
              Golden Thread Step 4
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
            <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-md">
              <div className="flex items-center gap-1.5 font-bold text-emerald-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>1. Stock Reserved</span>
              </div>
              <p className="text-[11px] text-emerald-100/90 mt-0.5">
                Serial units (Panels, Inverter) and BOS hardware reserved in inventory ledger.
              </p>
            </div>

            <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-md">
              <div className="flex items-center gap-1.5 font-bold text-emerald-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>2. Warehouse Pick-list</span>
              </div>
              <p className="text-[11px] text-emerald-100/90 mt-0.5">
                Pick-list generated without pricing. Warehouse ready for QR scanning.
              </p>
            </div>

            <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-md">
              <div className="flex items-center gap-1.5 font-bold text-emerald-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>3. Install Job Dispatched</span>
              </div>
              <p className="text-[11px] text-emerald-100/90 mt-0.5">
                Field installation job auto-scheduled on lead technician&apos;s mobile schedule.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-300/80 text-xs text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CreditCard className="w-5 h-5 text-amber-600" />
            <div>
              <span className="font-bold">Awaiting 50% Advance Milestone</span>
              <p className="text-[11px] text-amber-800">
                Recording ₹{formatMoney(order.advance_required_paise)} advance triggers stock reservation, warehouse pick-list, and field crew installation job.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowPaymentModal(true)}
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold shadow-sm"
          >
            Record Payment Now
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">
            Total Order Value
          </span>
          <div className="text-xl font-extrabold text-slate-900 font-mono mt-1">
            {formatMoney(order.total_paise)}
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            {order.project?.requested_kw || 3} kW System
          </span>
        </GlassCard>

        <GlassCard className="p-4 border-amber-200/80">
          <span className="text-[10px] text-amber-700 block uppercase font-bold tracking-wider">
            Advance Required (50%)
          </span>
          <div className="text-xl font-extrabold text-amber-800 font-mono mt-1">
            {formatMoney(order.advance_required_paise)}
          </div>
          <span className="text-[10px] text-amber-700/80 block mt-0.5">
            {advanceMet ? "✓ 100% Satisfied" : "Pending Client Deposit"}
          </span>
        </GlassCard>

        <GlassCard className="p-4 border-emerald-200/80">
          <span className="text-[10px] text-emerald-700 block uppercase font-bold tracking-wider">
            Total Paid To Date
          </span>
          <div className="text-xl font-extrabold text-emerald-700 font-mono mt-1">
            {formatMoney(order.paid_paise)}
          </div>
          <span className="text-[10px] text-emerald-700/80 block mt-0.5">
            {order.payments?.length || 0} Recorded Receipts
          </span>
        </GlassCard>

        <GlassCard className="p-4">
          <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">
            Balance Due at Handover
          </span>
          <div className="text-xl font-extrabold text-slate-900 font-mono mt-1">
            {formatMoney(order.balance_due_paise)}
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            Due after power generation test
          </span>
        </GlassCard>
      </div>

      {/* Order Equipment & Stock Reservation Status */}
      <GlassCard className="overflow-hidden p-0 border border-slate-200/70">
        <div className="p-4 bg-slate-50/90 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-slate-900 text-xs">
              Order Equipment & Inventory Reservation Progress
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-500">
            {order.lines?.length || 0} Equipment Items
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/60 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-4 w-12">#</th>
                <th className="py-2.5 px-4">Product & Specification</th>
                <th className="py-2.5 px-4">Tracking</th>
                <th className="py-2.5 px-4 text-right">Order Qty</th>
                <th className="py-2.5 px-4 text-center">Stock Reservation</th>
                <th className="py-2.5 px-4 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {order.lines?.map((line) => (
                <tr key={line.id} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-4 font-mono text-slate-400">{line.line_no}</td>
                  <td className="py-2.5 px-4">
                    <div className="font-semibold text-slate-900">{line.description}</div>
                    <div className="font-mono text-[10px] text-slate-400 mt-0.5">{line.sku}</div>
                  </td>
                  <td className="py-2.5 px-4">
                    {line.is_serialised ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                        Serial Scanned
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        Bulk Counted
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-right font-bold text-slate-900">
                    {line.qty} {line.uom}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    {isConfirmed ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Reserved {line.qty}/{line.qty}</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">
                        Awaiting advance confirmation
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                    {formatMoney(line.line_total_paise)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Payment Receipts Ledger */}
      <GlassCard className="overflow-hidden p-0 border border-slate-200/70">
        <div className="p-4 bg-slate-50/90 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-xs">
              Official Payment Receipts & UTR Ledger
            </h3>
          </div>
          <span className="text-[10px] text-slate-500">
            {order.payments?.length || 0} Transactions
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/60 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-4">Receipt #</th>
                <th className="py-2.5 px-4">Kind</th>
                <th className="py-2.5 px-4">Method & UTR</th>
                <th className="py-2.5 px-4 text-right">Amount</th>
                <th className="py-2.5 px-4">Received Date</th>
                <th className="py-2.5 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!order.payments || order.payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-slate-400 italic">
                    No payment receipts recorded yet. Click &apos;Record 50% Advance Payment&apos; above.
                  </td>
                </tr>
              ) : (
                order.payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{p.payment_no}</td>
                    <td className="py-2.5 px-4 capitalize font-semibold text-slate-800">{p.kind}</td>
                    <td className="py-2.5 px-4">
                      <div className="font-medium capitalize text-slate-800">
                        {p.method.replace("_", " ")}
                      </div>
                      <div className="font-mono text-[10px] text-slate-400 mt-0.5">
                        Ref: {p.reference}
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-700">
                      {formatMoney(p.amount_paise)}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">{formatIstDate(p.received_at)}</td>
                    <td className="py-2.5 px-4 text-right">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        Received
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Record Customer Payment</h3>
                  <p className="text-xs text-slate-500">
                    Idempotent bank transaction verification
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Amount Received (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    required
                    min={1}
                    value={paymentAmountRupees}
                    onChange={(e) => setPaymentAmountRupees(Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-sm font-mono font-bold focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                  <span>Advance Req: ₹{(Number(order.advance_required_paise) / 100).toLocaleString("en-IN")}</span>
                  <span>Balance Due: ₹{(Number(order.balance_due_paise) / 100).toLocaleString("en-IN")}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Payment Method *</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                >
                  <option value="bank_transfer">Bank Transfer (NEFT / RTGS / IMPS)</option>
                  <option value="upi">UPI (GPay / PhonePe / Paytm)</option>
                  <option value="cheque">Cheque Deposit</option>
                  <option value="card">Card Payment</option>
                  <option value="cash">Cash Receipt</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Bank Reference / UTR / Cheque # *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HDFC9182740192"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-800 space-y-1">
                <span className="font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Golden Automation A6 Trigger:</span>
                </span>
                <p>
                  Paying ≥ 50% advance automatically confirms this order, reserves stock, creates the warehouse pick-list, and dispatches the installation crew!
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || paymentAmountRupees <= 0}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20 disabled:opacity-50"
                >
                  {isPending ? "Recording & Confirming..." : "Record Payment Receipt"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
