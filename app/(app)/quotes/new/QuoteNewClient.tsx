"use client";

import React, { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { StepperTracker } from "@/components/shared/StepperTracker";
import { SystemViewer3D } from "@/components/3d/SystemViewer3D";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { formatPaise } from "@/lib/formatters";
import { createQuote } from "@/modules/quotes/actions";
import { type PackageTemplateItem } from "@/modules/quotes/queries";
import {
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck,
  Zap,
  Boxes,
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

  const defaultTemplate =
    templates.find((t) => t.capacity_kw === 3 && t.system_type === "on_grid") || templates[0];
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    defaultTemplate?.id || templates[0]?.id
  );

  const [discountPaise, setDiscountPaise] = useState<number>(0);
  const [notes, setNotes] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedTemplate = useMemo(() => {
    return templates.find((t) => t.id === selectedTemplateId) || defaultTemplate;
  }, [templates, selectedTemplateId, defaultTemplate]);

  // Calculations
  const calculations = useMemo(() => {
    const basePaise = BigInt(selectedTemplate?.base_price_paise || 18500000);
    const dPaise = BigInt(discountPaise);
    const taxablePaise = basePaise > dPaise ? basePaise - dPaise : 0n;

    // GST is composite 13.8% (70% goods at 12% + 30% services at 18%)
    const gstPaise = (taxablePaise * 1380n) / 10000n;
    const grossPaise = taxablePaise + gstPaise;

    // Subsidy (PM Surya Ghar: ₹30k/kW for first 2 kW, ₹18k for 3rd kW, cap ₹78,000)
    let subsidyPaise = 0n;
    if (selectedTemplate?.system_type === "on_grid") {
      const kw = selectedTemplate?.capacity_kw || 3;
      if (kw <= 2) {
        subsidyPaise = BigInt(kw * 30000 * 100);
      } else {
        subsidyPaise = 7800000n; // ₹78,000 cap
      }
    }

    const netPaise = grossPaise > subsidyPaise ? grossPaise - subsidyPaise : 0n;
    const advance50PctPaise = grossPaise / 2n;

    return {
      basePaise,
      discountPaise: dPaise,
      taxablePaise,
      gstPaise,
      grossPaise,
      subsidyPaise,
      netPaise,
      advance50PctPaise,
    };
  }, [selectedTemplate, discountPaise]);

  const handleGenerateQuote = async () => {
    setErrorMessage(null);
    startTransition(async () => {
      const res = await createQuote({
        project_id: projectId,
        template_id: selectedTemplateId,
        discount_paise: discountPaise,
        notes: notes || `Standard ${selectedTemplate?.name} package proposal`,
      });

      if (!res.ok) {
        setErrorMessage(res.error?.message || "Failed to generate quote.");
      } else {
        router.push(`/quotes/${res.data?.quote_id || ""}`);
      }
    });
  };

  return (
    <div className="space-y-6 pb-16">
      <PageHeader
        title="Quote Engine & BOM Pricing"
        description="Frozen-price quotation with composite 13.8% GST and PM Surya Ghar net subsidy deduction."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Quotes", href: "/quotes" },
          { label: "New Quote" },
        ]}
      />

      {/* Golden Thread Stepper */}
      <StepperTracker
        currentStage="quote"
        blockerMessage={
          !surveyApproved
            ? "HARD GATE (REQ-SURV-04): Quote cannot be saved because site survey has not been signed off by engineering."
            : undefined
        }
        nextActionOwner="Sales Proposal"
      />

      {/* Three-Column Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Column 1 (Left 3 cols): Customer & Survey Facts */}
        <div className="lg:col-span-3 space-y-4">
          <div className="card-surface p-4 space-y-3">
            <h3 className="text-label uppercase tracking-wider font-semibold text-[var(--text-muted)] pb-2 border-b border-[var(--border-subtle)]">
              Site & Customer Facts
            </h3>
            <div className="space-y-2 text-body-sm">
              <div>
                <span className="text-label text-xs block text-[var(--text-muted)]">Customer</span>
                <span className="font-semibold text-[var(--text-primary)]">{customerName}</span>
              </div>
              <div>
                <span className="text-label text-xs block text-[var(--text-muted)]">Project Ref</span>
                <span className="font-mono text-xs">{projectNo}</span>
              </div>
              <div>
                <span className="text-label text-xs block text-[var(--text-muted)]">Survey Verification</span>
                {surveyApproved ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--success-base)]">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approved by Manager
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--warning-base)]">
                    <AlertCircle className="w-3.5 h-3.5" /> Pending Approval
                  </span>
                )}
              </div>
              <div>
                <span className="text-label text-xs block text-[var(--text-muted)]">Shadow-Free Rooftop</span>
                <span className="font-medium text-[var(--text-primary)]">24 m² (fits up to 3.3 kW)</span>
              </div>
            </div>
          </div>

          <div className="card-surface p-4 space-y-2">
            <h3 className="text-label uppercase tracking-wider font-semibold text-[var(--text-muted)] pb-2 border-b border-[var(--border-subtle)]">
              Stock Availability
            </h3>
            <div className="space-y-1.5 text-body-sm">
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)]">550W Panels</span>
                <span className="text-xs font-semibold text-[var(--success-base)]">48 In Store</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)]">3.3 kW Inverters</span>
                <span className="text-xs font-semibold text-[var(--success-base)]">12 In Store</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)]">Structure Rail Kits</span>
                <span className="text-xs font-semibold text-[var(--success-base)]">8 Ready</span>
              </div>
            </div>
          </div>
        </div>

        {/* Column 2 (Center 5 cols): BOM Line Items & Priced Box */}
        <div className="lg:col-span-5 space-y-4">
          <div className="card-surface p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <div>
                <h3 className="text-heading font-semibold text-[var(--text-primary)]">
                  Package Template BOM
                </h3>
                <span className="text-caption text-[var(--text-muted)]">
                  Standardized tier-1 hardware bill of materials.
                </span>
              </div>
            </div>

            {/* Template Selector */}
            <div>
              <label className="text-label block mb-1">Select System Package</label>
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="input-standard font-medium"
              >
                {templates.map((tmpl) => (
                  <option key={tmpl.id} value={tmpl.id}>
                    {tmpl.name} ({tmpl.capacity_kw} kW {tmpl.system_type.replace("_", " ").toUpperCase()}) — {formatPaise(tmpl.base_price_paise)}
                  </option>
                ))}
              </select>
            </div>

            {/* BOM Table */}
            <div className="border border-[var(--border-subtle)] rounded-md overflow-hidden">
              <table className="w-full text-left text-body-sm">
                <thead className="bg-[var(--surface-subtle)] border-b border-[var(--border-subtle)] text-label text-xs">
                  <tr>
                    <th className="py-2 px-3">BOM Item</th>
                    <th className="py-2 px-3 text-center">Qty</th>
                    <th className="py-2 px-3 text-right">Unit Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {[
                    { name: `SunPower Mono PERC Solar Panels (${selectedTemplate?.capacity_kw || 3} kW)`, qty: `${Math.round((selectedTemplate?.capacity_kw || 3) / 0.54)} nos`, type: "Hardware (12% GST)" },
                    { name: `SunPower Grid-Tied Inverter (${selectedTemplate?.capacity_kw || 3} kW)`, qty: "1 nos", type: "Hardware (12% GST)" },
                    { name: "HDG Rooftop Mounting Structure Kit", qty: "1 set", type: "Structure (18% GST)" },
                    { name: "Solar DC Cables, AC Distribution Box & Earthing", qty: "1 lot", type: "BOS Hardware" },
                    { name: "Turnkey Installation, Testing & Net-Meter Commissioning", qty: "1 job", type: "Services (18% GST)" },
                  ].map((item, i) => (
                    <tr key={i} className="hover:bg-[var(--surface-hover)]">
                      <td className="py-2.5 px-3 font-medium text-[var(--text-primary)]">
                        {item.name}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono tabular-nums text-text-secondary">
                        {item.qty}
                      </td>
                      <td className="py-2.5 px-3 text-right text-caption text-[var(--text-muted)]">
                        {item.type}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Discount Input */}
            <div className="pt-2">
              <MoneyInput
                label="Commercial Discount (Requires Manager approval if > ₹10,000)"
                valueInPaise={discountPaise}
                onChangePaise={setDiscountPaise}
              />
            </div>

            {/* Financial Summary & Subsidy Deduction Box */}
            <div className="p-4 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-subtle)] space-y-2.5">
              <div className="flex items-center justify-between text-body-sm">
                <span className="text-[var(--text-secondary)]">Base Price (Parts + Labour)</span>
                <span className="font-mono tabular-nums font-medium text-[var(--text-primary)]">
                  {formatPaise(calculations.basePaise)}
                </span>
              </div>
              {discountPaise > 0 && (
                <div className="flex items-center justify-between text-body-sm text-[var(--danger-base)]">
                  <span>Discount</span>
                  <span className="font-mono tabular-nums font-medium">
                    -{formatPaise(calculations.discountPaise)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between text-body-sm">
                <span className="text-[var(--text-secondary)]">Composite GST (13.8%)</span>
                <span className="font-mono tabular-nums font-medium text-[var(--text-primary)]">
                  +{formatPaise(calculations.gstPaise)}
                </span>
              </div>
              <div className="pt-2 border-t border-[var(--border-strong)] flex items-center justify-between text-body font-semibold text-[var(--text-primary)]">
                <span>Gross Invoice Total</span>
                <span className="font-mono tabular-nums">
                  {formatPaise(calculations.grossPaise)}
                </span>
              </div>
              <div className="flex items-center justify-between text-body-sm text-[var(--success-base)] font-medium">
                <span>PM Surya Ghar Subsidy (Central)</span>
                <span className="font-mono tabular-nums">
                  -{formatPaise(calculations.subsidyPaise)}
                </span>
              </div>
              <div className="p-3 rounded-md bg-[var(--surface-card)] border border-[var(--border-strong)] flex items-center justify-between">
                <div>
                  <span className="text-label text-xs block text-[var(--text-muted)]">Net Cost to Customer</span>
                  <span className="text-title font-semibold tabular-nums text-[var(--accent-base)]">
                    {formatPaise(calculations.netPaise)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-caption block text-[var(--text-muted)]">50% Advance Req.</span>
                  <span className="font-mono font-medium tabular-nums text-[var(--text-primary)]">
                    {formatPaise(calculations.advance50PctPaise)}
                  </span>
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-md bg-[var(--danger-subtle)] border border-[var(--danger-border)] text-body-sm text-[var(--danger-text)]">
                {errorMessage}
              </div>
            )}

            <button
              onClick={handleGenerateQuote}
              disabled={isPending || !surveyApproved}
              className="btn-primary w-full h-11 text-body-sm font-semibold justify-center inline-flex disabled:opacity-40 cursor-pointer"
            >
              {isPending ? "Generating..." : "Save & Generate Customer Quote"}
            </button>
          </div>
        </div>

        {/* Column 3 (Right 4 cols): 3D System Viewer */}
        <div className="lg:col-span-4 space-y-4">
          <SystemViewer3D
            systemKw={selectedTemplate?.capacity_kw || 3.3}
            systemType={selectedTemplate?.system_type || "on_grid"}
          />
        </div>
      </div>
    </div>
  );
}
