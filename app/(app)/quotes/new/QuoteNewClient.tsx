"use client";

import React, { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { formatMoney } from "@/lib/money";
import { createQuote } from "@/modules/quotes/actions";
import { type PackageTemplateItem } from "@/modules/quotes/queries";
import {
  ArrowLeft,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Sun,
  ShieldCheck,
  Calculator,
  Lock,
  Layers,
  FileSpreadsheet,
} from "lucide-react";

interface QuoteNewClientProps {
  templates: PackageTemplateItem[];
  projectId?: string;
  surveyId?: string;
  projectNo?: string;
  customerName?: string;
  surveyApproved: boolean;
}

export function QuoteNewClient({
  templates,
  projectId = "p1111111-0000-0000-0000-000000000001",
  surveyId = "s1111111-0000-0000-0000-000000000001",
  projectNo = "PRJ-2627-00001",
  customerName = "Anita Sharma",
  surveyApproved = true,
}: QuoteNewClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Selected template: defaults to 3 kW On-Grid (Sweet Spot)
  const defaultTemplate =
    templates.find((t) => t.capacity_kw === 3 && t.system_type === "on_grid") || templates[0];
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    defaultTemplate?.id || templates[0]?.id
  );

  const [discountRupees, setDiscountRupees] = useState<number>(0);
  const [notes, setNotes] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedTemplate = useMemo(() => {
    return templates.find((t) => t.id === selectedTemplateId) || defaultTemplate;
  }, [templates, selectedTemplateId, defaultTemplate]);

  // Calculations
  const calculations = useMemo(() => {
    const basePaise = selectedTemplate?.base_price_paise || 18500000n;
    const discountPaise = BigInt(discountRupees * 100);
    const taxablePaise = basePaise > discountPaise ? basePaise - discountPaise : 0n;

    // GST is composite 13.8% (70% goods at 12% + 30% services at 18%)
    const gstPaise = (taxablePaise * 1380n) / 10000n;
    const totalPaise = taxablePaise + gstPaise;

    // Subsidy (PM Surya Ghar: ₹30k/kW for first 2 kW, ₹18k for 3rd kW, cap ₹78,000)
    let subsidyPaise = 0n;
    if (selectedTemplate?.system_type === "on_grid") {
      const kw = selectedTemplate.capacity_kw;
      if (kw <= 1) subsidyPaise = 3000000n;
      else if (kw <= 2) subsidyPaise = 6000000n;
      else subsidyPaise = 7800000n;
    }

    const netCostPaise = totalPaise > subsidyPaise ? totalPaise - subsidyPaise : 0n;

    // Discount approval threshold: > 3% requires manager sign-off
    const discountPct = basePaise > 0n ? (Number(discountPaise) / Number(basePaise)) * 100 : 0;
    const requiresMarginApproval = discountPct > 3.0;

    return {
      basePaise,
      discountPaise,
      taxablePaise,
      gstPaise,
      totalPaise,
      subsidyPaise,
      netCostPaise,
      discountPct,
      requiresMarginApproval,
    };
  }, [selectedTemplate, discountRupees]);

  const handleCreateQuote = async () => {
    setErrorMessage(null);
    if (!surveyApproved) {
      setErrorMessage("REQ-SURV-04: Cannot generate quote until survey is approved by Manager.");
      return;
    }

    startTransition(async () => {
      const res = await createQuote({
        project_id: projectId,
        template_id: selectedTemplateId,
        discount_paise: Number(calculations.discountPaise),
        notes: notes || undefined,
      });

      if (!res.ok) {
        setErrorMessage(res.error.message);
        return;
      }

      router.push(`/quotes/${res.data.quote_id}`);
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/quotes"
            className="p-2 rounded-xl bg-white/70 hover:bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 shadow-sm transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Generate Official Quotation
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Project <span className="font-mono font-semibold text-slate-800">{projectNo}</span> •
              Client: <span className="font-semibold text-slate-800">{customerName}</span>
            </p>
          </div>
        </div>

        {/* Survey Gate Check */}
        {!surveyApproved && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-100 text-rose-800 border border-rose-300 text-xs font-bold animate-pulse">
            <Lock className="w-4 h-4 text-rose-600" />
            <span>Survey Approval Gate Active (REQ-SURV-04)</span>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Grid: Template Selection (7 cols) + Pricing & Subsidy Summary (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Template Selection */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-500" />
              <span>Select Pre-Engineered Package Template</span>
            </h3>
            <span className="text-[10px] text-slate-400">10 Standard BOM Recipes</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {templates.map((tpl) => {
              const isSelected = tpl.id === selectedTemplateId;
              const isSweetSpot = tpl.capacity_kw === 3 && tpl.system_type === "on_grid";

              return (
                <div
                  key={tpl.id}
                  onClick={() => setSelectedTemplateId(tpl.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                    isSelected
                      ? "bg-amber-50/70 border-amber-400 shadow-md ring-2 ring-amber-400/20"
                      : "bg-white/80 border-slate-200/80 hover:border-slate-300 hover:bg-white"
                  }`}
                >
                  {isSweetSpot && (
                    <span className="absolute -top-2.5 right-4 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500 text-white shadow-sm flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>PM Surya Ghar Maximum Subsidy (₹78k)</span>
                    </span>
                  )}

                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{tpl.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                          {tpl.code}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {tpl.description}
                      </p>
                    </div>

                    <div className="text-right shrink-0 ml-3">
                      <span className="text-base font-extrabold text-slate-900 font-mono block">
                        {formatMoney(tpl.base_price_paise)}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Base BOM Price</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <span className="font-semibold text-slate-800">
                      Capacity: {tpl.capacity_kw} kW
                    </span>
                    <span className="capitalize text-slate-500">
                      System: {tpl.system_type.replace("_", "-")}
                    </span>
                    <span className="text-amber-700 font-medium">
                      Est. Generation: ~{(tpl.capacity_kw * 4.2).toFixed(1)} kWh/day
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Pricing, Subsidy & Action */}
        <div className="lg:col-span-5 space-y-4">
          <GlassCard className="p-5 border-amber-200/60 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <div className="p-1.5 rounded-lg bg-amber-500 text-white">
                <Calculator className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Quote Financials & Central Subsidy
                </h3>
                <p className="text-[11px] text-slate-500">
                  Fixed pricing frozen into quote ledger upon creation
                </p>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Base System BOM Price</span>
                <span className="font-mono font-semibold text-slate-900">
                  {formatMoney(calculations.basePaise)}
                </span>
              </div>

              {/* Discount Input */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-600">Commercial Discount (₹)</span>
                  <div className="relative w-32">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                      ₹
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={discountRupees}
                      onChange={(e) => setDiscountRupees(Math.max(0, Number(e.target.value)))}
                      className="w-full pl-6 pr-2 py-1 border border-slate-200 rounded-lg text-right font-mono text-xs focus:ring-2 focus:ring-amber-500/30"
                    />
                  </div>
                </div>
                {calculations.requiresMarginApproval && (
                  <div className="p-2 bg-amber-50 rounded-lg border border-amber-200 text-[10px] text-amber-800 flex items-center gap-1.5 mt-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>
                      Discount ({calculations.discountPct.toFixed(1)}%) exceeds 3% threshold. Will
                      require Manager approval before sending.
                    </span>
                  </div>
                )}
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Taxable Amount</span>
                <span className="font-mono font-semibold text-slate-900">
                  {formatMoney(calculations.taxablePaise)}
                </span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>GST (13.8% Composite Rate)</span>
                <span className="font-mono font-semibold text-slate-900">
                  {formatMoney(calculations.gstPaise)}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold text-slate-900">
                <span>Total Package Price</span>
                <span className="font-mono text-base">{formatMoney(calculations.totalPaise)}</span>
              </div>
            </div>

            {/* PM Surya Ghar Central Subsidy Highlight Box */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-teal-500/15 border border-emerald-300 text-xs space-y-2">
              <div className="flex items-center justify-between font-bold text-emerald-900">
                <span className="flex items-center gap-1.5">
                  <Sun className="w-4 h-4 text-emerald-600" />
                  <span>PM Surya Ghar Muft Bijli Subsidy</span>
                </span>
                <span className="font-mono text-sm text-emerald-700">
                  − {formatMoney(calculations.subsidyPaise)}
                </span>
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                Direct Benefit Transfer (DBT) credited directly into client&apos;s bank account post net-meter installation.
              </p>
              <div className="pt-2 border-t border-emerald-200 flex justify-between items-baseline font-bold">
                <span className="text-slate-900 text-sm">Net Client Investment:</span>
                <span className="font-mono text-lg text-emerald-800 font-extrabold">
                  {formatMoney(calculations.netCostPaise)}
                </span>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Custom Terms & Notes (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Price includes standard structure elevated up to 2 ft."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                onClick={handleCreateQuote}
                disabled={isPending || !surveyApproved}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {isPending ? "Generating BOM & Quote..." : "Create & Freeze Quote"}
                </span>
              </button>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
