"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatMoney } from "@/lib/money";
import { formatIstDate, formatTimeAgo } from "@/lib/time";
import { type QuoteItem } from "@/modules/quotes/queries";
import {
  FileSpreadsheet,
  Search,
  Plus,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Send,
  Zap,
  MapPin,
  Clock,
  Sparkles,
} from "lucide-react";

interface QuotesClientProps {
  initialQuotes: QuoteItem[];
}

export function QuotesClient({ initialQuotes }: QuotesClientProps) {
  const router = useRouter();
  const [quotes] = useState<QuoteItem[]>(initialQuotes);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredQuotes = useMemo(() => {
    return quotes.filter((q) => {
      if (activeTab !== "all" && q.status !== activeTab) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchNo = q.quote_no.toLowerCase().includes(query);
        const matchCust = q.project?.customer?.name.toLowerCase().includes(query);
        const matchProject = q.project?.project_no.toLowerCase().includes(query);
        if (!matchNo && !matchCust && !matchProject) return false;
      }
      return true;
    });
  }, [quotes, activeTab, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Quotation Management
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
              {quotes.length} Quotes Generated
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Golden Thread Step 3: Template BOM pricing, PM Surya Ghar subsidy calculations, and public customer proposal links.
          </p>
        </div>

        <Link
          href="/surveys"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>New Quote from Approved Survey</span>
        </Link>
      </div>

      {/* Filter Tabs & Search */}
      <GlassCard className="p-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: "all", label: "All Quotes", count: quotes.length },
              {
                id: "approved",
                label: "Approved",
                count: quotes.filter((q) => q.status === "approved").length,
              },
              {
                id: "sent",
                label: "Sent to Client",
                count: quotes.filter((q) => q.status === "sent").length,
              },
              {
                id: "accepted",
                label: "Accepted",
                count: quotes.filter((q) => q.status === "accepted").length,
              },
              {
                id: "pending_approval",
                label: "Pending Margin Approval",
                count: quotes.filter((q) => q.status === "pending_approval").length,
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
              placeholder="Search by quote #, customer, project..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white/70 border border-slate-200/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-slate-800 placeholder-slate-400 shadow-inner"
            />
          </div>
        </div>
      </GlassCard>

      {/* Table */}
      <GlassCard className="overflow-hidden p-0 border border-slate-200/70">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Quote #</th>
                <th className="py-3 px-4">Customer & Project</th>
                <th className="py-3 px-4">Capacity</th>
                <th className="py-3 px-4">Total System Price</th>
                <th className="py-3 px-4">Govt Subsidy</th>
                <th className="py-3 px-4">Net Client Cost</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {filteredQuotes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500">
                    <FileSpreadsheet className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-medium text-slate-700">No quotes found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Quotes are created once a technical site survey is approved.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredQuotes.map((quote) => (
                  <tr
                    key={quote.id}
                    className="hover:bg-amber-50/40 transition-colors group cursor-pointer"
                    onClick={() => router.push(`/quotes/${quote.id}`)}
                  >
                    {/* Quote # */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                        {quote.quote_no}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        v{quote.version} • Valid till {formatIstDate(quote.valid_until)}
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">
                        {quote.project?.customer?.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {quote.project?.project_no}
                      </div>
                    </td>

                    {/* Capacity */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{quote.nominal_kw} kW</div>
                      <div className="text-[10px] text-slate-500 capitalize">
                        {quote.system_type.replace("_", "-")}
                      </div>
                    </td>

                    {/* Total Price */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-slate-900">
                        {formatMoney(quote.total_paise)}
                      </div>
                      <div className="text-[10px] text-slate-400">Incl. 13.8% GST</div>
                    </td>

                    {/* Subsidy */}
                    <td className="py-3.5 px-4">
                      {quote.subsidy_eligible ? (
                        <div>
                          <div className="font-mono font-bold text-emerald-600">
                            − {formatMoney(quote.subsidy_paise)}
                          </div>
                          <div className="text-[9px] text-emerald-700 font-semibold">
                            PM Surya Ghar
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Not eligible</span>
                      )}
                    </td>

                    {/* Net Cost */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md inline-block border border-amber-200/60">
                        {formatMoney(quote.net_cost_paise)}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <StatusBadge status={quote.status} />
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/quotes/${quote.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                      >
                        <span>View</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
