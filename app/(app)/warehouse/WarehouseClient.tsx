"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatIstDate, formatTimeAgo } from "@/lib/time";
import { type PickListItem } from "@/modules/inventory/queries";
import {
  Truck,
  Barcode,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  Package,
  Layers,
  MapPin,
  Calendar,
} from "lucide-react";

interface WarehouseClientProps {
  pickLists: PickListItem[];
}

export function WarehouseClient({ pickLists }: WarehouseClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = pickLists.filter((pl) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchProject = pl.project_no.toLowerCase().includes(q);
      const matchCust = pl.customer_name.toLowerCase().includes(q);
      const matchAddr = pl.delivery_address.toLowerCase().includes(q);
      if (!matchProject && !matchCust && !matchAddr) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Warehouse Fulfilment & QR Dispatch
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
              {pickLists.length} Pick Lists
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Golden Thread Step 5: Barcode/QR scanning of serialized panels and inverters. Linking hardware to customer asset passports.
          </p>
        </div>

        <Link
          href="/inventory"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-sm transition-all"
        >
          <Package className="w-4 h-4 text-amber-400" />
          <span>Stock Catalogue & Inwarding →</span>
        </Link>
      </div>

      {/* Pick-Lists & Dispatch Runs Table */}
      <GlassCard className="overflow-hidden p-0 border border-slate-200/70">
        <div className="p-4 bg-slate-50/90 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-slate-900 text-xs">
              Active Pick-Lists & Dispatch Scanning Runs
            </h3>
          </div>
          <span className="text-[10px] text-slate-500">
            Automated generation upon 50% advance payment
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/60 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-4">Project & Order</th>
                <th className="py-2.5 px-4">Client & Site Destination</th>
                <th className="py-2.5 px-4">Dispatch Reference</th>
                <th className="py-2.5 px-4">Pick Status</th>
                <th className="py-2.5 px-4">Created Date</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((pl) => (
                <tr key={pl.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4">
                    <div className="font-mono font-bold text-slate-900">{pl.project_no}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                      Order: {pl.order_id.slice(0, 8)}...
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{pl.customer_name}</div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate max-w-[240px]">{pl.delivery_address}</span>
                    </div>
                  </td>

                  <td className="py-3 px-4 font-mono font-bold text-amber-700">
                    {pl.dispatch_no || "DSP-2627-00001"}
                  </td>

                  <td className="py-3 px-4">
                    <StatusBadge status={pl.status} />
                  </td>

                  <td className="py-3 px-4 text-slate-500">{formatIstDate(pl.created_at)}</td>

                  <td className="py-3 px-4 text-right">
                    <Link
                      href={`/warehouse/dispatch/${pl.dispatch_id || "disp-1"}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm transition-all"
                    >
                      <Barcode className="w-3.5 h-3.5" />
                      <span>Start QR Scan</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
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
