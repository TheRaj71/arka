"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatMoney } from "@/lib/money";
import { formatIstDate, formatTimeAgo } from "@/lib/time";
import { type OrderItem } from "@/modules/orders/queries";
import {
  ShoppingBag,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  MapPin,
  Calendar,
  CreditCard,
  Truck,
  Zap,
} from "lucide-react";

interface OrdersClientProps {
  initialOrders: OrderItem[];
}

export function OrdersClient({ initialOrders }: OrdersClientProps) {
  const router = useRouter();
  const [orders] = useState<OrderItem[]>(initialOrders);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const pendingAdvanceCount = useMemo(() => {
    return orders.filter((o) => o.status === "pending_payment").length;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (activeTab !== "all" && o.status !== activeTab) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNo = o.order_no.toLowerCase().includes(q);
        const matchCust = o.project?.customer?.name.toLowerCase().includes(q);
        const matchProject = o.project?.project_no.toLowerCase().includes(q);
        if (!matchNo && !matchCust && !matchProject) return false;
      }
      return true;
    });
  }, [orders, activeTab, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Orders & Fulfilment
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
              {orders.length} Active Orders
            </span>
            {pendingAdvanceCount > 0 && (
              <span className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                <CreditCard className="w-3.5 h-3.5 text-amber-600" />
                {pendingAdvanceCount} Awaiting 50% Advance
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Golden Thread Step 4: Advance payment confirmation triggers automated stock reservation, pick-list generation, and field installation scheduling.
          </p>
        </div>

        <Link
          href="/payments"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-sm transition-all"
        >
          <CreditCard className="w-4 h-4 text-amber-400" />
          <span>Payment Ledger →</span>
        </Link>
      </div>

      {/* Filter Tabs & Search */}
      <GlassCard className="p-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: "all", label: "All Orders", count: orders.length },
              {
                id: "pending_payment",
                label: "Awaiting Advance",
                count: orders.filter((o) => o.status === "pending_payment").length,
              },
              {
                id: "confirmed",
                label: "Confirmed (Auto-triggered)",
                count: orders.filter((o) => o.status === "confirmed").length,
              },
              {
                id: "in_fulfilment",
                label: "Warehouse Fulfilment",
                count: orders.filter((o) => o.status === "in_fulfilment").length,
              },
              {
                id: "delivered",
                label: "Delivered",
                count: orders.filter((o) => o.status === "delivered").length,
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
              placeholder="Search by order #, customer, project..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white/70 border border-slate-200/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-slate-800 placeholder-slate-400 shadow-inner"
            />
          </div>
        </div>
      </GlassCard>

      {/* Orders Table */}
      <GlassCard className="overflow-hidden p-0 border border-slate-200/70">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Customer & Project</th>
                <th className="py-3 px-4">System Size</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Advance Paid</th>
                <th className="py-3 px-4">Order Status</th>
                <th className="py-3 px-4">Payment Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500">
                    <ShoppingBag className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-medium text-slate-700">No orders found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Accept a quote to generate the official project order.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isAwaitingAdvance = order.status === "pending_payment";

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-amber-50/40 transition-colors group cursor-pointer"
                      onClick={() => router.push(`/orders/${order.id}`)}
                    >
                      {/* Order # */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                          {order.order_no}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {formatTimeAgo(order.created_at)}
                        </div>
                      </td>

                      {/* Customer & Project */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">
                          {order.project?.customer?.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {order.project?.project_no}
                        </div>
                      </td>

                      {/* System Size */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          {order.project?.requested_kw || 3} kW
                        </div>
                        <div className="text-[10px] text-slate-500 capitalize">
                          {(order.project?.system_type || "on_grid").replace("_", "-")}
                        </div>
                      </td>

                      {/* Total Amount */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {formatMoney(order.total_paise)}
                      </td>

                      {/* Advance Paid */}
                      <td className="py-3.5 px-4">
                        <div
                          className={`font-mono font-bold ${
                            order.paid_paise > 0n ? "text-emerald-600" : "text-slate-400"
                          }`}
                        >
                          {formatMoney(order.paid_paise)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Adv. Req: {formatMoney(order.advance_required_paise)}
                        </div>
                      </td>

                      {/* Order Status */}
                      <td className="py-3.5 px-4">
                        <StatusBadge status={order.status} />
                      </td>

                      {/* Payment Status */}
                      <td className="py-3.5 px-4">
                        <StatusBadge status={order.pay_status} />
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/orders/${order.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                            isAwaitingAdvance
                              ? "bg-amber-500 hover:bg-amber-600 text-white shadow-sm"
                              : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                          }`}
                        >
                          <span>{isAwaitingAdvance ? "Record Advance" : "View Details"}</span>
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
    </div>
  );
}
