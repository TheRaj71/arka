"use client";

import React, { useState, useTransition } from "react";
import confetti from "canvas-confetti";
import { formatMoney } from "@/lib/money";
import { publicAcceptQuote } from "@/modules/quotes/actions";
import { type QuoteItem } from "@/modules/quotes/queries";
import {
  Sun,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Zap,
  ArrowRight,
  Clock,
  Sparkles,
  Phone,
  FileCheck2,
} from "lucide-react";

interface PublicQuoteClientProps {
  quote: QuoteItem;
  token: string;
}

export function PublicQuoteClient({ quote: initialQuote, token }: PublicQuoteClientProps) {
  const [quote, setQuote] = useState<QuoteItem>(initialQuote);
  const [isPending, startTransition] = useTransition();
  const [customerName, setCustomerName] = useState(quote.project?.customer?.name || "");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [acceptedOrderId, setAcceptedOrderId] = useState<string | null>(null);

  const isAlreadyAccepted = quote.status === "accepted" || Boolean(acceptedOrderId);

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) return;
    setErrorMessage(null);

    startTransition(async () => {
      const res = await publicAcceptQuote({
        token,
        name: customerName,
      });

      if (!res.ok) {
        setErrorMessage(res.error.message);
        return;
      }

      setAcceptedOrderId(res.data.order_id);
      setQuote({ ...quote, status: "accepted" });

      try {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-500/10 via-slate-50 to-amber-500/5 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Brand Header */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
              <Sun className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900 block leading-tight">
                SunPower Solutions
              </span>
              <span className="text-xs text-slate-500">Official Rooftop Solar Proposal</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono font-bold text-slate-900 block">{quote.quote_no}</span>
            <span className="text-[11px] text-slate-500">Valid until {quote.valid_until}</span>
          </div>
        </div>

        {/* Customer & Proposal Welcome */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
                Prepared For
              </span>
              <h1 className="text-2xl font-bold text-slate-900 mt-0.5">
                {quote.project?.customer?.name}
              </h1>
              <p className="text-xs text-slate-500 mt-1">{quote.project?.site_address}</p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              {quote.nominal_kw} kW On-Grid Solar
            </span>
          </div>
        </div>

        {/* PM Surya Ghar Central Subsidy Card */}
        <div className="rounded-2xl p-6 bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 text-white shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-200" />
              <h2 className="text-base font-bold">PM Surya Ghar: Muft Bijli Yojana</h2>
            </div>
            <span className="text-xs bg-white/20 px-2.5 py-0.5 rounded-full font-semibold">
              Central Govt Subsidy
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="bg-white/10 p-3 rounded-xl backdrop-blur-md">
              <span className="text-xs text-amber-100 block">Total System Price</span>
              <span className="text-lg font-bold font-mono mt-0.5 block">
                {formatMoney(quote.total_paise)}
              </span>
              <span className="text-[10px] text-amber-200">All inclusive of GST</span>
            </div>

            <div className="bg-emerald-500/40 p-3 rounded-xl backdrop-blur-md border border-emerald-300/40">
              <span className="text-xs text-emerald-100 block font-semibold">Govt Subsidy (DBT)</span>
              <span className="text-lg font-extrabold font-mono text-white mt-0.5 block">
                − {formatMoney(quote.subsidy_paise)}
              </span>
              <span className="text-[10px] text-emerald-100">Direct to your bank account</span>
            </div>

            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-md border border-white/30">
              <span className="text-xs text-white font-semibold block">Your Net Investment</span>
              <span className="text-xl font-extrabold font-mono text-white mt-0.5 block">
                {formatMoney(quote.net_cost_paise)}
              </span>
              <span className="text-[10px] text-amber-100">Payback in ~2.5 years</span>
            </div>
          </div>
        </div>

        {/* Warranty & Performance Guarantees */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Comprehensive 25-Year Warranty Coverage</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-900 block">25-Year Solar Panels</span>
              <p className="text-slate-500 mt-0.5">80% linear power output guarantee</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-900 block">5-Year Inverter</span>
              <p className="text-slate-500 mt-0.5">Full replacement & on-site service</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-900 block">2-Year Free Maintenance</span>
              <p className="text-slate-500 mt-0.5">SunPower certified field technician visits</p>
            </div>
          </div>
        </div>

        {/* Acceptance Box */}
        <div className="bg-white rounded-2xl p-6 shadow-md border border-amber-200/80 space-y-4">
          {isAlreadyAccepted ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Proposal Accepted!</h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Thank you, <span className="font-semibold text-slate-900">{customerName}</span>. Your solar rooftop order has been confirmed. Our team will contact you shortly to coordinate delivery and the 50% advance milestone.
              </p>
            </div>
          ) : (
            <form onSubmit={handleAccept} className="space-y-4 text-xs">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <FileCheck2 className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-slate-900 text-sm">Accept Quotation & Authorize Order</h3>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Full Legal Name (as per electricity bill) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Anita Sharma"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  required
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 rounded text-amber-500 focus:ring-amber-400"
                />
                <span className="text-slate-600 leading-relaxed text-[11px]">
                  I agree to the SunPower Solutions terms and conditions. I authorize SunPower to register this rooftop system with the DISCOM for net-metering and submit the PM Surya Ghar subsidy application on my behalf.
                </span>
              </label>

              <button
                type="submit"
                disabled={isPending || !agreeTerms || !customerName.trim()}
                className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isPending ? "Confirming Order..." : "Accept Proposal & Confirm Order"}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
