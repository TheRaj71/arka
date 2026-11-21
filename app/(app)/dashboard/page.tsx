import React from "react";
import { getDashboardData } from "@/modules/dashboard/queries";
import { formatMoney } from "@/lib/money";
import { GlassCard } from "@/components/ui/glass-card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SolarHouse3D } from "@/components/3d/SolarHouse3D";
import {
  Zap,
  Sun,
  CloudSun,
  Wallet,
  Trees,
  Car,
  Share2,
  Calendar,
  AlertCircle,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { DashboardCharts } from "./DashboardCharts";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: "today" | "week" | "month" }>;
}) {
  const { range = "today" } = await searchParams;
  const data = await getDashboardData(range);

  return (
    <div className="space-y-6 pb-8">
      {/* 1. TOP METRICS ROW (Exact structure from reference image) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Sites & Capacity Card */}
        <GlassCard className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Total Sites</span>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md font-semibold">
              Live
            </span>
          </div>
          <div className="my-2">
            <div className="text-3xl font-black text-slate-900 tracking-tight">
              {data.summary.totalProjects}
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
              <span>
                Active Sites <strong className="text-slate-800">{data.summary.activeSites}</strong>
              </span>
              <span>
                Completed <strong className="text-slate-800">{data.summary.completedSites}</strong>
              </span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Total Capacity</span>
            <span className="font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md">
              {data.summary.totalCapacityKw} kWp
            </span>
          </div>
        </GlassCard>

        {/* Current Power Output Card */}
        <GlassCard className="p-4 flex flex-col justify-between bg-gradient-to-br from-white/90 to-blue-50/40">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> Live Output
            </span>
          </div>
          <div className="my-2">
            <div className="text-xs text-slate-500 font-medium">Current Power</div>
            <div className="text-2xl font-black text-slate-900">5.62 kW</div>
          </div>
          {/* Mini Wave Sparkline */}
          <div className="h-6 flex items-end gap-1">
            {[40, 65, 45, 80, 70, 90, 85, 100].map((h, i) => (
              <div
                key={i}
                className="flex-1 bg-gradient-to-t from-blue-500 to-sky-400 rounded-t-sm"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </GlassCard>

        {/* Energy Today Card */}
        <GlassCard className="p-4 flex flex-col justify-between bg-gradient-to-br from-white/90 to-amber-50/40">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Sun className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
              +12.5%
            </span>
          </div>
          <div className="my-2">
            <div className="text-xs text-slate-500 font-medium">Energy Generated Today</div>
            <div className="text-2xl font-black text-slate-900">{data.summary.energyTodayKwh} kWh</div>
          </div>
          <div className="text-[11px] text-slate-500">Peak at 12:30 PM (3.28 kW)</div>
        </GlassCard>

        {/* CO2 Offset Card */}
        <GlassCard className="p-4 flex flex-col justify-between bg-gradient-to-br from-white/90 to-teal-50/40">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600">
              <CloudSun className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
              +11.2%
            </span>
          </div>
          <div className="my-2">
            <div className="text-xs text-slate-500 font-medium">CO₂ Emission Offset</div>
            <div className="text-2xl font-black text-slate-900">{data.summary.co2OffsetTons} Tons</div>
          </div>
          <div className="text-[11px] text-slate-500">Cumulative Clean Impact</div>
        </GlassCard>

        {/* Total Revenue & Profit Card */}
        <GlassCard className="p-4 flex flex-col justify-between bg-gradient-to-br from-white/90 to-emerald-50/40">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <Wallet className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
              +7.5%
            </span>
          </div>
          <div className="my-2">
            <div className="text-xs text-slate-500 font-medium">Total Revenue</div>
            <div className="text-2xl font-black text-slate-900">
              {formatMoney(data.summary.totalRevenuePaise)}
            </div>
          </div>
          <div className="text-[11px] font-semibold text-emerald-700 flex items-center justify-between">
            <span>Net Profit:</span>
            <span>{formatMoney(data.summary.totalProfitPaise)} ({data.summary.avgMarginPct}%)</span>
          </div>
        </GlassCard>
      </div>

      {/* 2. MIDDLE ROW: Charts & Diagnostics (Matched to Reference Image) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Energy Generation Area Chart */}
        <GlassCard className="lg:col-span-1 p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-xs text-slate-500 font-medium">Energy Generation</div>
              <div className="text-2xl font-black text-slate-900">28.64 MWh</div>
              <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                +10.7% vs last month
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
              Daily View
            </span>
          </div>

          {/* Recharts Curve component */}
          <div className="h-44 w-full mt-2">
            <DashboardCharts curveData={data.generationCurve} />
          </div>
        </GlassCard>

        {/* Middle: Environmental Impact Breakdown */}
        <GlassCard className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="font-bold text-sm text-slate-900">Environmental Impact</span>
            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">Monthly</span>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3.5 p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                <Trees className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">Trees Planted Equivalent</div>
                <div className="text-lg font-black text-slate-900">1,587 <span className="text-xs font-normal text-slate-500">trees</span></div>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3 rounded-xl bg-sky-50/50 border border-sky-100">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-600 shrink-0">
                <CloudSun className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">CO₂ Avoided</div>
                <div className="text-lg font-black text-slate-900">1,587 <span className="text-xs font-normal text-slate-500">tons</span></div>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3 rounded-xl bg-amber-50/50 border border-amber-100">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">Cars Taken Off Road</div>
                <div className="text-lg font-black text-slate-900">1,587 <span className="text-xs font-normal text-slate-500">vehicles</span></div>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Right: Performance & Health Gauges */}
        <GlassCard className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="font-bold text-sm text-slate-900">System Health</span>
            <span className="text-xs text-sky-600 font-semibold cursor-pointer hover:underline">
              View All Diagnostics
            </span>
          </div>

          <div className="space-y-4">
            {/* System Availability */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full border-4 border-emerald-500 flex items-center justify-center font-bold text-xs text-slate-800">
                  {data.health.systemAvailability}%
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">System Availability</div>
                  <div className="text-[11px] text-emerald-600 font-medium">Optimal (99.2% SLA)</div>
                </div>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">
                Good
              </span>
            </div>

            {/* Inverter Efficiency */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full border-4 border-sky-500 flex items-center justify-center font-bold text-xs text-slate-800">
                  {data.health.inverterEfficiency}%
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Inverter Efficiency</div>
                  <div className="text-[11px] text-sky-600 font-medium">MPPT Peak Performance</div>
                </div>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-sky-50 text-sky-700">
                Excellent
              </span>
            </div>

            {/* Battery Health */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full border-4 border-amber-500 flex items-center justify-center font-bold text-xs text-slate-800">
                  {data.health.batteryHealth}%
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Battery State of Health</div>
                  <div className="text-[11px] text-amber-600 font-medium">Tubular / Li-ion Bank</div>
                </div>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700">
                Good
              </span>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* 3. BOTTOM ROW: Site Performance + Real 3D Solar Model */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Site Performance List Table */}
        <GlassCard className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="font-bold text-sm text-slate-900">Active Site Performance</span>
            <Link
              href="/projects"
              className="text-xs text-sky-600 font-semibold hover:underline flex items-center gap-1"
            >
              All Projects <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200/60 text-slate-400 font-medium">
                  <th className="pb-2.5">Site / Customer</th>
                  <th className="pb-2.5">Capacity</th>
                  <th className="pb-2.5">Today Energy</th>
                  <th className="pb-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {data.recentProjects.map((p) => (
                  <tr key={p.id} className="hover:bg-white/60 transition-colors">
                    <td className="py-3 font-bold text-slate-800">
                      <div>{p.customerName}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{p.projectNo}</div>
                    </td>
                    <td className="py-3 text-slate-600">{p.systemKw} kW</td>
                    <td className="py-3 text-slate-600">{(p.systemKw * 4.8).toFixed(1)} kWh</td>
                    <td className="py-3 text-right">
                      <StatusBadge status={p.stage} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

        {/* 3D Real Model Canvas & Energy Flow (Matched to Reference Image) */}
        <GlassCard className="p-5 flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live 3D Rooftop Energy Flow
              </span>
              <span className="text-[11px] text-slate-500">Interactive 3D model (drag to rotate)</span>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700">
              On-Grid 3 kW
            </span>
          </div>

          {/* Interactive Three.js Solar House */}
          <div className="w-full flex-1 min-h-[260px]">
            <SolarHouse3D
              generationKw={3.28}
              consumptionKw={2.1}
              batteryKw={1.4}
              gridKw={0.22}
            />
          </div>
        </GlassCard>
      </div>

      {/* 4. DIRECTOR FINANCIALS & PER-JOB PROFITABILITY (REQ-FIN-02, REQ-FIN-03) */}
      <GlassCard className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Director Profit & Job Margin Analysis
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Exact revenue, verified material consumption, and logged technician labour per project.
            </p>
          </div>

          {/* Period Selector & Share Link */}
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold text-slate-600">
              <Link
                href="/dashboard?range=today"
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  range === "today" ? "bg-white text-slate-900 shadow-xs font-bold" : "hover:text-slate-900"
                }`}
              >
                Today
              </Link>
              <Link
                href="/dashboard?range=week"
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  range === "week" ? "bg-white text-slate-900 shadow-xs font-bold" : "hover:text-slate-900"
                }`}
              >
                This Week
              </Link>
              <Link
                href="/dashboard?range=month"
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  range === "month" ? "bg-white text-slate-900 shadow-xs font-bold" : "hover:text-slate-900"
                }`}
              >
                This Month
              </Link>
            </div>

            <Link
              href="/r/demo"
              className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:border-sky-300 shadow-xs flex items-center gap-1.5 transition-all"
            >
              <Share2 className="w-3.5 h-3.5 text-sky-600" /> Share CA Report
            </Link>
          </div>
        </div>

        {/* Per-job P&L Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="pb-3">Project #</th>
                <th className="pb-3">Customer</th>
                <th className="pb-3 text-right">Revenue</th>
                <th className="pb-3 text-right">Material Cost</th>
                <th className="pb-3 text-right">Labour Cost</th>
                <th className="pb-3 text-right">Other</th>
                <th className="pb-3 text-right">Net Profit</th>
                <th className="pb-3 text-center">Margin %</th>
                <th className="pb-3 text-center">Completeness</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {data.jobProfitability.map((job) => (
                <tr key={job.projectId} className="hover:bg-white/60 transition-colors">
                  <td className="py-3 font-bold text-sky-900">{job.projectNo}</td>
                  <td className="py-3 font-semibold text-slate-800">{job.customerName}</td>
                  <td className="py-3 text-right font-bold text-slate-900">
                    {formatMoney(job.revenuePaise)}
                  </td>
                  <td className="py-3 text-right text-slate-600">
                    {formatMoney(job.materialCostPaise)}
                  </td>
                  <td className="py-3 text-right text-slate-600">
                    {formatMoney(job.labourCostPaise)}
                  </td>
                  <td className="py-3 text-right text-slate-600">
                    {formatMoney(job.otherCostPaise)}
                  </td>
                  <td className="py-3 text-right font-black text-emerald-700">
                    {formatMoney(job.profitPaise)}
                  </td>
                  <td className="py-3 text-center">
                    <span className="px-2 py-0.5 rounded-full font-bold text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                      {job.marginPct}%
                    </span>
                  </td>
                  <td className="py-3 text-center">
                    {job.isComplete ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                        ✓ Verified
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full"
                        title={job.missing.join(", ")}
                      >
                        <AlertCircle className="w-3 h-3" /> Incomplete Data
                      </span>
                    )}
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
