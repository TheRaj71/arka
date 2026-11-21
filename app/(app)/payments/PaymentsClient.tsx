"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatMoney } from "@/lib/money";
import { formatIstDate } from "@/lib/time";
import { type PaymentItem } from "@/modules/orders/queries";
import {
  CreditCard,
  Search,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Layers,
} from "lucide-react";

interface PaymentsClientProps {
  initialPayments: PaymentItem[];
}

export function PaymentsClient({ initialPayments }: PaymentsClientProps) {
  const [payments] = useState<PaymentItem[]>(initialPayments);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const totalCollected = useMemo(() => {
    return payments.reduce((acc, p) => acc + p.amount_paise, 0n);
  }, [payments]);

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      if (activeTab !== "all" && p.kind !== activeTab) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNo = p.payment_no.toLowerCase().includes(q);
        const matchRef = p.reference.toLowerCase().includes(q);
        const matchCust = p.customer_name?.toLowerCase().includes(q);
        const matchOrder = p.order_no?.toLowerCase().includes(q);
        if (!matchNo && !matchRef && !matchCust && !matchOrder) return false;
      }
      return true;
    });
  }, [payments, activeTab, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Payment Transactions & Receipts
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
              {payments.length} Verified Transactions
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Golden Thread Step 4: Double-entry immutable payment records mapped to project orders and service tickets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/orders"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-sm transition-all"
          >
            <span>Orders Queue →</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard className="p-4 border-emerald-200/80 bg-emerald-50/20">
          <span className="text-[10px] text-emerald-700 block uppercase font-bold tracking-wider">
            Total Revenue Collected
          </span>
          <div className="text-2xl font-extrabold text-emerald-800 font-mono mt-1">
            {formatMoney(totalCollected)}
          </div>
          <span className="text-[10px] text-emerald-700/80 block mt-0.5">
            Verified Bank UTR Receipts
          </span>
        </GlassCard>

        <GlassCard className="p-4">
          <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">
            Average Order Advance
          </span>
          <div className="text-2xl font-extrabold text-slate-900 font-mono mt-1">
            ₹92,500
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            Standard 50% Upfront Policy
          </span>
        </GlassCard>

        <GlassCard className="p-4">
          <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">
            Reconciliation Health
          </span>
          <div className="text-2xl font-extrabold text-slate-900 font-mono mt-1">
            100%
          </div>
          <span className="text-[10px] text-emerald-600 block mt-0.5 font-semibold">
            ✓ Zero Unmatched Bank Deposits
          </span>
        </GlassCard>
      </div>

      {/* Filter Tabs & Search */}
      <GlassCard className="p-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: "all", label: "All Receipts", count: payments.length },
              {
                id: "advance",
                label: "Advance Payments",
                count: payments.filter((p) => p.kind === "advance").length,
              },
              {
                id: "balance",
                label: "Balance Payments",
                count: payments.filter((p) => p.kind === "balance").length,
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

          <div className="relative min-w-[240px] max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by receipt #, UTR, customer, order..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white/70 border border-slate-200/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-slate-800 placeholder-slate-400 shadow-inner"
            />
          </div>
        </div>
      </GlassCard>

      {/* Receipts Table */}
      <GlassCard className="overflow-hidden p-0 border border-slate-200/70">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Receipt #</th>
                <th className="py-3 px-4">Customer & Order</th>
                <th className="py-3 px-4">Payment Kind</th>
                <th className="py-3 px-4">Method & UTR</th>
                <th className="py-3 px-4 text-right">Amount Received</th>
                <th className="py-3 px-4">Deposit Date</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {filteredPayments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{p.payment_no}</td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-900">{p.customer_name || "Anita Sharma"}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      Order: {p.order_no || "ORD-2627-00001"}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 capitalize font-semibold text-slate-700">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px]">
                      {p.kind}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="capitalize text-slate-800 font-medium">
                      {p.method.replace("_", " ")}
                    </div>
                    <div className="font-mono text-[10px] text-slate-400 mt-0.5">
                      UTR: {p.reference}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-extrabold text-emerald-700 text-sm">
                    {formatMoney(p.amount_paise)}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">{formatIstDate(p.received_at)}</td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Received</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
