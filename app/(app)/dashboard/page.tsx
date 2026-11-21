import React from "react";
import { connection } from "next/server";
import { getDashboardData } from "@/modules/dashboard/queries";
import { getProfile } from "@/lib/auth/get-profile";
import { getPendingRoleUsers } from "@/modules/users/queries";
import { DirectorPendingApprovals } from "@/components/dashboard/DirectorPendingApprovals";
import { formatPaise, formatPaiseShorthand, formatDateIST } from "@/lib/formatters";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { StatusPill } from "@/components/shared/StatusPill";
import { HeroHouse3D } from "@/components/3d/HeroHouse3D";
import { DashboardCharts } from "./DashboardCharts";
import Link from "next/link";
import {
  Share2,
  Clock,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  ShieldAlert,
} from "lucide-react";

export const instant = false;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: "today" | "week" | "month" }>;
}) {
  await connection();
  const { range = "today" } = await searchParams;
  const [data, profile] = await Promise.all([
    getDashboardData(range),
    getProfile(),
  ]);

  const isDirector = profile?.role === "director";
  const pendingUsers = isDirector ? await getPendingRoleUsers() : [];

  // Revenue & Profit shorthand
  const totalCostBigInt = data.summary.totalRevenuePaise - data.summary.totalProfitPaise;
  const revShort = formatPaiseShorthand(data.summary.totalRevenuePaise);
  const costShort = formatPaiseShorthand(totalCostBigInt);
  const profitShort = formatPaiseShorthand(data.summary.totalProfitPaise);

  const cashCollectedPaise = BigInt(Math.round(Number(data.summary.totalRevenuePaise) * 0.75));

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header with Plain Operational Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <div className="text-caption font-mono text-[var(--text-muted)] uppercase tracking-wider mb-1">
            {formatDateIST(new Date())} · Executive Operations Dashboard
          </div>
          <h1 className="text-display font-semibold text-[var(--text-primary)]">
            SunPower Operations Summary
          </h1>
          <p className="text-body-sm text-[var(--text-secondary)] mt-0.5">
            {data.summary.activeSites} jobs in progress, 2 pending manager survey approval.
          </p>
        </div>

        {/* Share Tokenized Link Button */}
        <div className="flex items-center gap-2">
          <Link
            href="/r/demo"
            target="_blank"
            className="btn-secondary h-10 px-3.5 text-body-sm inline-flex items-center gap-1.5"
            title="Open tokenised read-only customer & director report"
          >
            <Share2 className="w-4 h-4 text-[var(--text-secondary)]" />
            <span>Share Report</span>
          </Link>
        </div>
      </div>

      {/* Role Approval Action Banner for Director */}
      {isDirector && pendingUsers.length > 0 && (
        <DirectorPendingApprovals pendingUsers={pendingUsers} />
      )}

      {/* 2. Top Row of 5 StatCards (Revenue, Margin, Jobs, Repairs, Cash) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Revenue (MTD)"
          value={revShort.display}
          exactTooltip={revShort.exact}
          change={{ value: "+12.4%", trend: "up", isPositive: true, periodText: "vs last month" }}
          trendPoints={[22, 26, 31, 35, 40, 48]}
        />
        <StatCard
          label="Gross Margin %"
          value={`${data.summary.avgMarginPct.toFixed(1)}%`}
          exactTooltip={`Profit: ${profitShort.exact} on ${revShort.exact}`}
          change={{ value: "+2.1%", trend: "up", isPositive: true, periodText: "above target" }}
          trendPoints={[20, 22, 21, 23, 24, 25]}
        />
        <StatCard
          label="Jobs in Progress"
          value={String(data.summary.activeSites)}
          change={{ value: "2 pending", trend: "neutral", periodText: "survey approvals" }}
          trendPoints={[10, 12, 13, 15, 14, 16]}
        />
        <StatCard
          label="Open Service Tickets"
          value="2"
          change={{ value: "Both in SLA", trend: "up", isPositive: true, periodText: "100% on-time" }}
        />
        <StatCard
          label="Cash Collected vs Pending"
          value={formatPaiseShorthand(cashCollectedPaise).display}
          exactTooltip="Advance payment collections"
          change={{ value: "75% collected", trend: "up", isPositive: true, periodText: "25% pending" }}
        />
      </div>

      {/* 3. Main Chart & 3D Solar Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Recharts Power Output & Generation Chart */}
        <div className="lg:col-span-7 card-surface p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
            <div>
              <span className="font-semibold text-body text-[var(--text-primary)]">
                Solar Array Generation Profile
              </span>
              <span className="text-caption text-[var(--text-muted)] block">
                Aggregated output across active rooftop sites ({data.summary.totalCapacityKw} kWp installed)
              </span>
            </div>

            {/* Range Segmented Control */}
            <div className="flex items-center gap-1 bg-[var(--surface-subtle)] p-0.5 rounded-md border border-[var(--border-subtle)]">
              {(["today", "week", "month"] as const).map((r) => (
                <Link
                  key={r}
                  href={`/dashboard?range=${r}`}
                  className={`px-2.5 py-1 text-xs font-medium rounded-sm capitalize transition-colors ${
                    range === r
                      ? "bg-[var(--surface-card)] text-[var(--accent-base)] shadow-xs font-semibold"
                      : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {r}
                </Link>
              ))}
            </div>
          </div>

          <div className="my-4">
            <DashboardCharts curveData={data.generationCurve} />
          </div>

          <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-caption text-[var(--text-muted)]">
            <span>Peak Solar Noon: 12:45 PM IST</span>
            <span>Total Generation: 428.6 kWh today</span>
          </div>
        </div>

        {/* Right: 3D Solar Generation Studio */}
        <div className="lg:col-span-5">
          <HeroHouse3D
            generationKw={5.6}
            consumptionKw={2.2}
            gridKw={1.8}
            batteryKw={1.6}
          />
        </div>
      </div>

      {/* 4. Profit by Job Table (The Most Critical Table in the Product) */}
      <div className="card-surface p-5">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)] mb-4">
          <div>
            <h2 className="text-heading font-semibold text-[var(--text-primary)]">
              Profitability by Project (Golden Thread)
            </h2>
            <p className="text-caption text-[var(--text-muted)]">
              Live audit of revenue, actual inventory dispatch costs, and gross margins.
            </p>
          </div>
          <Link
            href="/quotes"
            className="text-body-sm font-medium text-[var(--accent-base)] hover:underline inline-flex items-center gap-1"
          >
            <span>View All Quotes</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] bg-[var(--surface-subtle)] text-label">
                <th className="py-2.5 px-4">Project ID</th>
                <th className="py-2.5 px-4">Customer</th>
                <th className="py-2.5 px-4 text-right">Revenue</th>
                <th className="py-2.5 px-4 text-right">Actual Cost</th>
                <th className="py-2.5 px-4 text-right">Margin ₹</th>
                <th className="py-2.5 px-4 text-right">Margin %</th>
                <th className="py-2.5 px-4">Stage</th>
                <th className="py-2.5 px-4">Audit Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] text-body-sm">
              {data.jobProfitability.slice(0, 8).map((row) => {
                const costPaise = row.materialCostPaise + row.labourCostPaise + row.otherCostPaise;
                const marginPaise = row.profitPaise;
                const isLoss = marginPaise < 0n || row.marginPct < 15;
                return (
                  <tr
                    key={row.projectId}
                    className={`h-12 transition-colors hover:bg-[var(--surface-hover)] ${
                      isLoss ? "bg-[var(--danger-subtle)]" : ""
                    }`}
                  >
                    <td className="py-3 px-4 font-mono text-xs font-medium text-[var(--text-primary)]">
                      {row.projectNo}
                    </td>
                    <td className="py-3 px-4 font-medium text-[var(--text-primary)]">
                      {row.customerName}
                    </td>
                    <td className="py-3 px-4 text-right font-medium tabular-nums text-[var(--text-primary)]">
                      {formatPaise(row.revenuePaise)}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-[var(--text-secondary)]">
                      {formatPaise(costPaise)}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-medium tabular-nums ${
                        marginPaise >= 0n
                          ? "text-[var(--success-base)]"
                          : "text-[var(--danger-base)] font-bold"
                      }`}
                    >
                      {formatPaise(marginPaise)}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-semibold tabular-nums ${
                        row.marginPct >= 20
                          ? "text-[var(--success-base)]"
                          : isLoss
                          ? "text-[var(--danger-base)]"
                          : "text-[var(--warning-base)]"
                      }`}
                    >
                      {row.marginPct.toFixed(1)}%
                    </td>
                    <td className="py-3 px-4">
                      <StatusPill status={row.isComplete ? "completed" : "in_progress"} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-caption text-[var(--text-muted)]">
                      {row.isComplete ? (
                        <span className="inline-flex items-center gap-1 text-[var(--success-base)]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Reconciled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[var(--warning-base)]">
                          <AlertCircle className="w-3.5 h-3.5" /> {row.missing.join(", ")}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Bottom Three Operational Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Panel A: Unfinished Jobs by Stage */}
        <div className="card-surface p-5 space-y-3">
          <div className="flex items-center justify-between text-body font-semibold text-[var(--text-primary)] pb-2 border-b border-[var(--border-subtle)]">
            <span>Jobs by Stage</span>
            <span className="text-caption font-mono tabular-nums text-[var(--text-muted)]">
              {data.summary.activeSites} active
            </span>
          </div>
          <div className="space-y-2.5 pt-1">
            {[
              { stage: "Survey Required", count: 4, pct: 40 },
              { stage: "Quote Pending", count: 3, pct: 30 },
              { stage: "Warehouse Dispatch", count: 2, pct: 20 },
              { stage: "Installation On-Site", count: 5, pct: 50 },
            ].map((s) => (
              <div key={s.stage} className="space-y-1">
                <div className="flex items-center justify-between text-body-sm">
                  <span className="text-[var(--text-secondary)]">{s.stage}</span>
                  <span className="font-semibold tabular-nums text-[var(--text-primary)]">
                    {s.count}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-[var(--surface-subtle)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--accent-base)] rounded-full"
                    style={{ width: `${s.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Panel B: Open Repairs & Service SLAs */}
        <div className="card-surface p-5 space-y-3">
          <div className="flex items-center justify-between text-body font-semibold text-[var(--text-primary)] pb-2 border-b border-[var(--border-subtle)]">
            <span>Open Service Tickets</span>
            <Link href="/service" className="text-caption text-[var(--accent-base)] hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-3 pt-1">
            <div className="p-3 rounded-md bg-[var(--surface-subtle)] border border-[var(--border-subtle)] space-y-1">
              <div className="flex items-center justify-between text-body-sm font-medium">
                <span>Inverter Inactive</span>
                <span className="text-xs text-[var(--success-base)] font-semibold">In Warranty</span>
              </div>
              <div className="text-caption text-[var(--text-secondary)]">
                Sunita Verma (Amritsar) · Error: E04 Ground Fault
              </div>
              <div className="text-[11px] text-[var(--text-muted)] font-mono">
                SLA: 18h remaining · Assigned: Vikram Patel
              </div>
            </div>
            <div className="p-3 rounded-md bg-[var(--surface-subtle)] border border-[var(--border-subtle)] space-y-1">
              <div className="flex items-center justify-between text-body-sm font-medium">
                <span>Earthing Recheck</span>
                <span className="text-xs text-[var(--success-base)] font-semibold">In Warranty</span>
              </div>
              <div className="text-caption text-[var(--text-secondary)]">
                Harpreet Singh (Ludhiana) · Routine inspection
              </div>
              <div className="text-[11px] text-[var(--text-muted)] font-mono">
                SLA: 42h remaining · Assigned: Imran Khan
              </div>
            </div>
          </div>
        </div>

        {/* Panel C: Needs Your Approval (Hard Gates) */}
        <div className="card-surface p-5 space-y-3">
          <div className="flex items-center justify-between text-body font-semibold text-[var(--text-primary)] pb-2 border-b border-[var(--border-subtle)]">
            <span>Needs Approval</span>
            <span className="text-caption text-[var(--warning-base)] font-semibold">2 Actions</span>
          </div>
          <div className="space-y-3 pt-1">
            <div className="p-3 rounded-md bg-[var(--warning-subtle)] border border-[var(--warning-border)] space-y-2">
              <div className="flex items-center justify-between text-body-sm font-semibold text-[var(--warning-text)]">
                <span>Survey Sign-off (Gate)</span>
                <span className="text-xs font-mono">3.3 kW</span>
              </div>
              <p className="text-caption text-[var(--warning-text)]">
                Anita Sharma roof survey submitted. Shadow-free area 24 m² verified. Unblocks quote generation.
              </p>
              <Link
                href="/surveys"
                className="btn-primary h-8 px-3 text-xs w-full justify-center inline-flex"
              >
                Review & Approve Survey
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
