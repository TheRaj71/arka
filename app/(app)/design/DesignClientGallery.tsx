"use client";

import React, { useState } from "react";
import { StatCard } from "@/components/shared/StatCard";
import { StatusPill } from "@/components/shared/StatusPill";
import { StepperTracker } from "@/components/shared/StepperTracker";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { ScanInput } from "@/components/ui/ScanInput";
import { HeroHouse3D } from "@/components/3d/HeroHouse3D";
import { RoofSurvey3D } from "@/components/3d/RoofSurvey3D";
import { SystemViewer3D } from "@/components/3d/SystemViewer3D";
import { DigitalTwinCard } from "@/components/3d/DigitalTwinCard";
import { formatPaise, formatPhoneIndian, formatDateIST } from "@/lib/formatters";
import { Check, Copy } from "lucide-react";

export function DesignClientGallery() {
  const [demoMoney, setDemoMoney] = useState(18500000); // ₹1,85,000
  const [demoPhone, setDemoPhone] = useState("+919876543210");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(text);
    setTimeout(() => setCopiedToken(null), 1500);
  };

  // Sample Demo Table Data
  interface DemoRow {
    id: string;
    customer: string;
    system: string;
    status: string;
    amount: number;
    date: string;
  }

  const sampleRows: DemoRow[] = [
    { id: "PRJ-2611-0001", customer: "Harpreet Singh (Ludhiana)", system: "5.0 kW On-Grid", status: "confirmed", amount: 28000000, date: "2026-11-20" },
    { id: "PRJ-2611-0002", customer: "Sunita Verma (Amritsar)", system: "3.3 kW Hybrid", status: "in_progress", amount: 21500000, date: "2026-11-19" },
    { id: "PRJ-2611-0003", customer: "Gurdaspur Agro Works", system: "10.0 kW Commercial", status: "installed", amount: 56000000, date: "2026-11-18" },
    { id: "PRJ-2611-0004", customer: "Balwinder Kaur (Jalandhar)", system: "3.0 kW On-Grid", status: "pending_payment", amount: 18500000, date: "2026-11-16" },
  ];

  const columns: Column<DemoRow>[] = [
    { key: "id", header: "Project ID", width: "160px", render: (r) => <span className="font-mono text-xs">{r.id}</span> },
    { key: "customer", header: "Customer Name", sortable: true, render: (r) => <span className="font-medium">{r.customer}</span> },
    { key: "system", header: "System Template" },
    { key: "status", header: "Status", render: (r) => <StatusPill status={r.status} /> },
    { key: "amount", header: "Total Value", align: "right", sortable: true, render: (r) => formatPaise(r.amount) },
    { key: "date", header: "Date", align: "right", render: (r) => formatDateIST(r.date) },
  ];

  return (
    <div className="space-y-12">
      {/* 1. Color Palette Tokens */}
      <section className="space-y-4">
        <h2 className="text-title font-semibold text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-2">
          1. Color Palette & Neutral Paper Scale
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { name: "Surface Page", var: "var(--surface-page)", hex: "#FAFAF9" },
            { name: "Surface Card", var: "var(--surface-card)", hex: "#FFFFFF" },
            { name: "Surface Subtle", var: "var(--surface-subtle)", hex: "#F5F5F4" },
            { name: "Border Subtle", var: "var(--border-subtle)", hex: "#E7E5E4" },
            { name: "Border Strong", var: "var(--border-strong)", hex: "#D6D3D1" },
            { name: "Text Primary", var: "var(--text-primary)", hex: "#1C1917" },
            { name: "Accent (Solar Teal)", var: "var(--accent-base)", hex: "#0F766E" },
            { name: "Accent Subtle", var: "var(--accent-subtle)", hex: "#F0FDFA" },
            { name: "Success", var: "var(--success-base)", hex: "#15803D" },
            { name: "Warning (Amber)", var: "var(--warning-base)", hex: "#B45309" },
            { name: "Danger (Red)", var: "var(--danger-base)", hex: "#B91C1C" },
            { name: "Info (Blue)", var: "var(--info-base)", hex: "#1D4ED8" },
          ].map((c) => (
            <div
              key={c.name}
              onClick={() => copyToClipboard(c.hex)}
              className="card-surface p-3 flex flex-col gap-2 cursor-pointer hover:border-[var(--accent-base)] transition-colors group"
            >
              <div
                className="w-full h-12 rounded-sm border border-[var(--border-subtle)] shadow-xs"
                style={{ backgroundColor: c.var }}
              />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-[var(--text-primary)] truncate">{c.name}</span>
                <span className="text-[11px] font-mono text-[var(--text-muted)] flex items-center justify-between">
                  {c.hex}
                  {copiedToken === c.hex ? <Check className="w-3 h-3 text-[var(--success-base)]" /> : <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100" />}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Typography Scale */}
      <section className="space-y-4">
        <h2 className="text-title font-semibold text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-2">
          2. Typography Hierarchy (Min 14px Desktop / 16px Mobile)
        </h2>
        <div className="card-surface p-6 space-y-4 divide-y divide-[var(--border-subtle)]">
          <div className="pt-2">
            <span className="text-caption text-[var(--text-muted)] block font-mono mb-1">.text-display (32px / 40px, weight 600)</span>
            <div className="text-display">SunPower Operations Platform</div>
          </div>
          <div className="pt-3">
            <span className="text-caption text-[var(--text-muted)] block font-mono mb-1">.text-title (24px / 32px, weight 600)</span>
            <div className="text-title">Active Solar Rooftop Installations</div>
          </div>
          <div className="pt-3">
            <span className="text-caption text-[var(--text-muted)] block font-mono mb-1">.text-heading (18px / 28px, weight 600)</span>
            <div className="text-heading">Project Quotation & BOM Breakdown</div>
          </div>
          <div className="pt-3">
            <span className="text-caption text-[var(--text-muted)] block font-mono mb-1">.text-body (16px / 24px, weight 400 - default body)</span>
            <div className="text-body text-[var(--text-secondary)]">
              Customer confirmed 50% advance for the 5 kW grid-tied solar system in Jalandhar.
            </div>
          </div>
          <div className="pt-3">
            <span className="text-caption text-[var(--text-muted)] block font-mono mb-1">.text-body-sm (14px / 20px - minimum reading size)</span>
            <div className="text-body-sm text-[var(--text-secondary)]">
              Serial numbers reserved for dispatch: Inverter SN-INV-2026-0042, Battery SN-BAT-2026-0012.
            </div>
          </div>
          <div className="pt-3">
            <span className="text-caption text-[var(--text-muted)] block font-mono mb-1">.tabular-nums (Tabular numbers for monetary & kW precision)</span>
            <div className="text-body font-mono tabular-nums text-[var(--text-primary)]">
              ₹1,85,000 · 3.3 kW · 14 Nov 2026 · SN-2026-9812
            </div>
          </div>
        </div>
      </section>

      {/* 3. Operational KPI Cards */}
      <section className="space-y-4">
        <h2 className="text-title font-semibold text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-2">
          3. Honest StatCards with Trendlines (≥ 6 points)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Revenue (MTD)"
            value="₹42.8 L"
            exactTooltip="₹42,85,400 exact"
            change={{ value: "+14.2%", trend: "up", isPositive: true, periodText: "vs last month" }}
            trendPoints={[18, 22, 25, 29, 36, 42]}
          />
          <StatCard
            label="Gross Margin %"
            value="24.8%"
            exactTooltip="Target: 22.0%"
            change={{ value: "+1.6%", trend: "up", isPositive: true, periodText: "above target" }}
            trendPoints={[21, 23, 22, 24, 23, 25]}
          />
          <StatCard
            label="Jobs in Progress"
            value="14"
            change={{ value: "3 overdue", trend: "down", isPositive: false, periodText: "need attention" }}
            trendPoints={[10, 11, 12, 14, 15, 14]}
          />
          <StatCard
            label="Open Service Tickets"
            value="2"
            change={{ value: "Both in SLA", trend: "neutral", periodText: "100% on-time" }}
          />
        </div>
      </section>

      {/* 4. Status Pills Map */}
      <section className="space-y-4">
        <h2 className="text-title font-semibold text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-2">
          4. Unified StatusPill Library (src/lib/ui/status.ts)
        </h2>
        <div className="card-surface p-5 space-y-4">
          <div>
            <span className="text-caption text-[var(--text-muted)] block mb-2">Lead & Survey States</span>
            <div className="flex flex-wrap gap-2">
              <StatusPill status="new" />
              <StatusPill status="contacted" />
              <StatusPill status="qualified" />
              <StatusPill status="requested" />
              <StatusPill status="scheduled" />
              <StatusPill status="submitted" />
              <StatusPill status="approved" />
              <StatusPill status="rework_needed" />
              <StatusPill status="rejected" />
            </div>
          </div>
          <div>
            <span className="text-caption text-[var(--text-muted)] block mb-2">Order & Warranty States</span>
            <div className="flex flex-wrap gap-2">
              <StatusPill status="pending_payment" />
              <StatusPill status="confirmed" />
              <StatusPill status="in_progress" />
              <StatusPill status="delivered" />
              <StatusPill status="installed" />
              <StatusPill status="in_warranty" />
              <StatusPill status="out_of_warranty" />
              <StatusPill status="available" />
              <StatusPill status="reserved" />
            </div>
          </div>
        </div>
      </section>

      {/* 5. Golden Thread StepperTracker */}
      <section className="space-y-4">
        <h2 className="text-title font-semibold text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-2">
          5. Golden Thread StepperTracker
        </h2>
        <div className="space-y-4">
          <StepperTracker
            currentStage="quote"
            blockerMessage="Quote locked: Survey pending manager sign-off (REQ-SURV-04)"
            nextActionOwner="Manager Approval"
          />
          <StepperTracker
            currentStage="dispatch"
            nextActionOwner="Warehouse Pick & Scan"
          />
        </div>
      </section>

      {/* 6. Form Inputs & Indian Formatters */}
      <section className="space-y-4">
        <h2 className="text-title font-semibold text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-2">
          6. Form Primitives (44px min desktop, 52px mobile)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 card-surface p-6">
          <MoneyInput
            label="System Price (Paise Controlled)"
            valueInPaise={demoMoney}
            onChangePaise={setDemoMoney}
          />
          <PhoneInput
            label="Customer Mobile (E.164 +91)"
            value={demoPhone}
            onChange={setDemoPhone}
          />
          <div className="md:col-span-2 pt-2 border-t border-[var(--border-subtle)]">
            <ScanInput
              onScan={async (serial) => {
                await new Promise((r) => setTimeout(r, 400));
                if (serial.startsWith("SN-")) {
                  return { ok: true, message: `Serial verified & matched to Anita Sharma BOM: ${serial}` };
                }
                return { ok: false, message: `Unknown or unreserved serial number: ${serial}` };
              }}
            />
          </div>
        </div>
      </section>

      {/* 7. DataTable Showcase */}
      <section className="space-y-4">
        <h2 className="text-title font-semibold text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-2">
          7. Industrial DataTable (Sticky Header, CSV Export, 48px Rows)
        </h2>
        <DataTable
          columns={columns}
          data={sampleRows}
          searchPlaceholder="Search customer or project ID..."
        />
      </section>

      {/* 8. Four 3D Visualizer Showcases */}
      <section className="space-y-4">
        <h2 className="text-title font-semibold text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-2">
          8. 3D Operational Visualizers (Restrained, Procedural, Matte)
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <HeroHouse3D generationKw={3.3} batteryKw={1.2} gridKw={0.4} consumptionKw={2.1} />
          <RoofSurvey3D tiltDeg={24} azimuthDeg={180} usableAreaSqM={26} requestedKw={3.3} />
          <SystemViewer3D systemKw={3.3} systemType="on_grid" />
          <DigitalTwinCard unitType="inverter" serialNumber="SN-INV-2026-0042" customerName="Anita Sharma" />
        </div>
      </section>
    </div>
  );
}
