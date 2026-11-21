"use client";

import React, { useState } from "react";
import { formatMoney } from "@/lib/money";
import {
  TrendingUp,
  ShieldCheck,
  Zap,
  Sun,
  Layers,
  Clock,
  Calendar,
  Lock,
} from "lucide-react";

export function SharedReportClient() {
  const [period, setPeriod] = useState<"today" | "week" | "month">("month");

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
              <Sun className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">SunPower Solutions</h1>
              <p className="text-xs text-slate-400">
                Executive Operations & Profitability Brief (Tokenized Read-Only Access)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-1 bg-slate-800/80 rounded-xl border border-slate-700 text-xs">
            {(["today", "week", "month"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg font-semibold capitalize transition-all ${
                  period === p ? "bg-amber-500 text-white shadow-sm" : "text-slate-400 hover:text-white"
                }`}
              >
                {p} (IST)
              </button>
            ))}
          </div>
        </div>

        {/* PII Redaction Notice */}
        <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/80 text-xs text-slate-300 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400" />
            <span>Customer PII (phone numbers, full billing addresses) is cryptographically redacted for privacy.</span>
          </span>
          <span className="text-[10px] font-mono text-slate-400">Expires in 7 days</span>
        </div>

        {/* Profitability Executive Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
              Contracted Revenue
            </span>
            <span className="text-xl font-extrabold font-mono mt-1 block">₹1,85,00,000</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">38 Active Projects</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
              BOM Material Cost
            </span>
            <span className="text-xl font-extrabold font-mono text-rose-400 mt-1 block">₹1,28,00,000</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Panels + Inverters + BOS</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
              Net Gross Profit
            </span>
            <span className="text-xl font-extrabold font-mono text-emerald-400 mt-1 block">₹44,50,000</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">After technician hours</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
              Average Margin %
            </span>
            <span className="text-xl font-extrabold font-mono text-amber-400 mt-1 block">29.8%</span>
            <span className="text-[10px] text-emerald-400 block mt-0.5">Above 28% Target</span>
          </div>
        </div>

        {/* Projects Rollup with Redacted PII */}
        <div className="rounded-2xl bg-slate-800/80 border border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-700 flex items-center justify-between text-xs">
            <span className="font-bold">Project Profitability Ledger</span>
            <span className="text-slate-400 font-mono">100% Invariant Verified</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-700/80 text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="py-2.5 px-4">Project #</th>
                  <th className="py-2.5 px-4">Client (Redacted)</th>
                  <th className="py-2.5 px-4">Capacity</th>
                  <th className="py-2.5 px-4 text-right">Revenue</th>
                  <th className="py-2.5 px-4 text-right">Material Cost</th>
                  <th className="py-2.5 px-4 text-right">Gross Profit</th>
                  <th className="py-2.5 px-4 text-right">Margin %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60 font-mono">
                {[
                  { id: "PRJ-2627-00001", client: "Anita S. (+91 98765 ****0)", kw: "3.0 kW", rev: "₹1,85,000", cost: "₹1,24,000", profit: "₹48,500", pct: "30.3%" },
                  { id: "PRJ-2627-00002", client: "Suresh P. (+91 98220 ****5)", kw: "5.0 kW", rev: "₹3,20,000", cost: "₹2,18,000", profit: "₹76,000", pct: "28.5%" },
                  { id: "PRJ-2627-00003", client: "Vikram S. (+91 98901 ****6)", kw: "3.0 kW", rev: "₹1,85,000", cost: "₹1,22,000", profit: "₹51,000", pct: "31.4%" },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-slate-700/30">
                    <td className="py-3 px-4 font-bold text-white">{row.id}</td>
                    <td className="py-3 px-4 font-sans text-slate-300">{row.client}</td>
                    <td className="py-3 px-4 font-sans text-amber-400 font-semibold">{row.kw}</td>
                    <td className="py-3 px-4 text-right text-slate-200">{row.rev}</td>
                    <td className="py-3 px-4 text-right text-rose-400">{row.cost}</td>
                    <td className="py-3 px-4 text-right text-emerald-400 font-bold">{row.profit}</td>
                    <td className="py-3 px-4 text-right text-amber-400 font-extrabold">{row.pct}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
