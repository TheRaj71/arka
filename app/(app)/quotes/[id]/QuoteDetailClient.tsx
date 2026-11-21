"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatMoney } from "@/lib/money";
import { formatIstDate, formatTimeAgo } from "@/lib/time";
import { sendQuote, acceptQuote } from "@/modules/quotes/actions";
import { type QuoteItem } from "@/modules/quotes/queries";
import {
  ArrowLeft,
  FileSpreadsheet,
  Send,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Copy,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  Zap,
  Sun,
  Eye,
  Lock,
  Layers,
  ArrowRight,
} from "lucide-react";

interface QuoteDetailClientProps {
  quote: QuoteItem;
  userRole?: string;
}

export function QuoteDetailClient({ quote: initialQuote, userRole }: QuoteDetailClientProps) {
  const router = useRouter();
  const [quote, setQuote] = useState<QuoteItem>(initialQuote);
  const [isPending, startTransition] = useTransition();

  // Share link modal / state
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [orderCreatedNo, setOrderCreatedNo] = useState<string | null>(null);

  const canSeeCost = Boolean(quote.total_cost_paise !== undefined);

  // Send Quote to Customer
  const handleSendQuote = async () => {
    setErrorMessage(null);
    startTransition(async () => {
      const res = await sendQuote({ quote_id: quote.id });
      if (!res.ok) {
        setErrorMessage(res.error.message);
        return;
      }

      setShareUrl(res.data.url);
      setQuote({ ...quote, status: "sent", sent_at: new Date().toISOString() });
      router.refresh();
    });
  };

  // Staff manual accept quote (triggers Automation A5 -> creates Order)
  const handleAcceptQuote = async () => {
    setErrorMessage(null);
    startTransition(async () => {
      const res = await acceptQuote({
        quote_id: quote.id,
        customer_name: quote.project?.customer?.name || "Customer",
      });

      if (!res.ok) {
        setErrorMessage(res.error.message);
        return;
      }

      setOrderCreatedNo(res.data.order_no);
      setQuote({
        ...quote,
        status: "accepted",
        accepted_at: new Date().toISOString(),
      });
      router.refresh();
    });
  };

  const copyToClipboard = () => {
    if (!shareUrl) return;
    const fullUrl = `${window.location.origin}${shareUrl}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/quotes"
            className="p-2 rounded-xl bg-white/70 hover:bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 shadow-sm transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
                {quote.quote_no}
              </h1>
              <StatusBadge status={quote.status} />
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                v{quote.version}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Project <span className="font-mono font-bold">{quote.project?.project_no}</span> •
              Client: <span className="font-semibold text-slate-800">{quote.project?.customer?.name}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {quote.status !== "accepted" ? (
            <>
              <button
                onClick={handleSendQuote}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-200 shadow-sm transition-all"
              >
                <Send className="w-3.5 h-3.5 text-amber-500" />
                <span>{quote.sent_at ? "Re-send / Share Link" : "Send to Customer"}</span>
              </button>

              <button
                onClick={handleAcceptQuote}
                disabled={isPending}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Accept Quote & Create Order</span>
              </button>
            </>
          ) : (
            <Link
              href="/orders"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-300"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Quote Accepted → View Orders Queue</span>
            </Link>
          )}
        </div>
      </div>

      {/* Order Created Success Banner */}
      {orderCreatedNo && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-md">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Quote Accepted! Order Initialized</h3>
              <p className="text-xs text-emerald-100">
                Order <span className="font-mono font-bold">{orderCreatedNo}</span> created. Advance payment can now be recorded.
              </p>
            </div>
          </div>
          <Link
            href="/orders"
            className="px-4 py-2 bg-white text-emerald-900 rounded-xl text-xs font-bold hover:bg-emerald-50 transition-colors shadow-sm"
          >
            Go to Orders →
          </Link>
        </div>
      )}

      {/* Shareable Link Box if generated */}
      {shareUrl && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-300/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-bold text-amber-900 flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5 text-amber-600" />
              <span>Public Customer Proposal Link Active:</span>
            </span>
            <span className="text-slate-600 font-mono text-[11px] block mt-0.5 break-all">
              {typeof window !== "undefined" ? window.location.origin : ""}{shareUrl}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={copyToClipboard}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 transition-colors inline-flex items-center gap-1"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copied ? "Copied!" : "Copy Link"}</span>
            </button>
            <Link
              href={shareUrl}
              target="_blank"
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold transition-colors inline-flex items-center gap-1 shadow-sm"
            >
              <span>Open Customer View</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* STRICT ROLE-BASED COST & MARGIN CARD (Manager / Director / Accounts Only) */}
      {canSeeCost && (
        <GlassCard className="p-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white border-slate-700 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-700/80">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <span>Confidential Job Profitability & Cost Breakdown</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">
                    Manager View Only
                  </span>
                </h3>
                <p className="text-[10px] text-slate-400">
                  Hidden from sales representatives and customer proposal links
                </p>
              </div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
              <span className="text-[10px] text-slate-400 block">Total Revenue</span>
              <span className="text-sm font-bold text-white font-mono mt-0.5 block">
                {formatMoney(quote.total_paise)}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
              <span className="text-[10px] text-slate-400 block">BOM Material Cost</span>
              <span className="text-sm font-bold text-rose-400 font-mono mt-0.5 block">
                {formatMoney(quote.total_cost_paise || 0n)}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
              <span className="text-[10px] text-slate-400 block">Projected Gross Profit</span>
              <span className="text-sm font-bold text-emerald-400 font-mono mt-0.5 block">
                {formatMoney(quote.gross_margin_paise || 0n)}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
              <span className="text-[10px] text-slate-400 block">Gross Margin %</span>
              <span className="text-sm font-extrabold text-amber-400 font-mono mt-0.5 block">
                {quote.gross_margin_pct}%
              </span>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Pricing Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard className="p-4">
          <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">
            Total Package Price
          </span>
          <div className="text-xl font-extrabold text-slate-900 font-mono mt-1">
            {formatMoney(quote.total_paise)}
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            Incl. {formatMoney(quote.gst_paise)} GST (13.8%)
          </span>
        </GlassCard>

        <GlassCard className="p-4 border-emerald-200/80 bg-emerald-50/20">
          <span className="text-[10px] text-emerald-600 block uppercase font-bold tracking-wider">
            Central Govt Subsidy
          </span>
          <div className="text-xl font-extrabold text-emerald-700 font-mono mt-1">
            − {formatMoney(quote.subsidy_paise)}
          </div>
          <span className="text-[10px] text-emerald-600/80 block mt-0.5">
            PM Surya Ghar DBT Transfer
          </span>
        </GlassCard>

        <GlassCard className="p-4 border-amber-200/80 bg-amber-50/20">
          <span className="text-[10px] text-amber-700 block uppercase font-bold tracking-wider">
            Net Client Investment
          </span>
          <div className="text-xl font-extrabold text-amber-700 font-mono mt-1">
            {formatMoney(quote.net_cost_paise)}
          </div>
          <span className="text-[10px] text-amber-700/80 block mt-0.5">
            50% Advance: {formatMoney(quote.total_paise / 2n)}
          </span>
        </GlassCard>
      </div>

      {/* Bill of Materials (BOM) Table */}
      <GlassCard className="overflow-hidden p-0 border border-slate-200/70">
        <div className="p-4 bg-slate-50/90 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-slate-900 text-xs">
              Itemized Bill of Materials (BOM) & Equipment Specifications
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-500">
            {quote.lines?.length || 0} Line Items Frozen
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/60 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-4 w-12">#</th>
                <th className="py-2.5 px-4">Item & Description</th>
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4 text-right">Qty</th>
                <th className="py-2.5 px-4 text-right">Unit Price</th>
                {canSeeCost && <th className="py-2.5 px-4 text-right text-rose-600">Unit Cost</th>}
                <th className="py-2.5 px-4 text-right">GST Rate</th>
                <th className="py-2.5 px-4 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {quote.lines?.map((line) => (
                <tr key={line.id} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-4 font-mono text-slate-400">{line.line_no}</td>
                  <td className="py-2.5 px-4">
                    <div className="font-semibold text-slate-900">{line.description}</div>
                    <div className="font-mono text-[10px] text-slate-400 mt-0.5">{line.sku}</div>
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 font-medium text-slate-700 capitalize">
                      {line.category.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right font-bold text-slate-800">
                    {line.qty} {line.uom}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-slate-700">
                    {formatMoney(line.unit_price_paise)}
                  </td>
                  {canSeeCost && (
                    <td className="py-2.5 px-4 text-right font-mono text-rose-600 font-medium">
                      {line.unit_cost_paise ? formatMoney(line.unit_cost_paise) : "—"}
                    </td>
                  )}
                  <td className="py-2.5 px-4 text-right font-mono text-slate-500">
                    {(line.gst_rate_bp / 100).toFixed(1)}%
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
    </div>
  );
}
