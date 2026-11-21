"use client";

import React, { useState, useTransition } from "react";
import { formatPaise, formatDateIST, formatPhoneIndian } from "@/lib/formatters";
import { publicAcceptQuote } from "@/modules/quotes/actions";
import { type QuoteItem } from "@/modules/quotes/queries";
import {
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  Printer,
  ShieldCheck,
  Building,
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

  // Calculations
  const grossPaise = Number(quote.total_paise || 20500000n);
  const subsidyPaise = 7800000; // PM Surya Ghar standard cap for 3 kW+
  const netPaise = grossPaise > subsidyPaise ? grossPaise - subsidyPaise : 0;
  const advance50Pct = Math.round(grossPaise / 2);

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
        setErrorMessage(res.error?.message || "Failed to accept proposal.");
        return;
      }

      setAcceptedOrderId(res.data?.order_id || null);
      setQuote({ ...quote, status: "accepted" });
    });
  };

  return (
    <div className="min-h-screen bg-[var(--surface-page)] py-8 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto card-surface p-6 sm:p-10 space-y-8 print:border-none print:shadow-none print:p-0">
        {/* Printable Top Letterhead */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border-subtle)]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-[var(--accent-base)] flex items-center justify-center text-[var(--text-inverse)] font-bold text-base">
                A
              </div>
              <span className="text-title font-semibold tracking-tight text-[var(--text-primary)]">
                SunPower Solutions
              </span>
            </div>
            <p className="text-caption text-[var(--text-muted)]">
              Authorized Rooftop Solar Installer · Punjab & Haryana Region
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="btn-secondary h-9 px-3 text-xs inline-flex items-center gap-1.5 print:hidden cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Proposal</span>
            </button>
            <div className="text-right">
              <div className="text-xs font-mono text-[var(--text-muted)]">
                Quote #{quote.quote_no || "QT-2611-0001"}
              </div>
              <div className="text-caption text-[var(--text-secondary)]">
                Date: {formatDateIST(quote.created_at)}
              </div>
            </div>
          </div>
        </div>

        {/* Customer & System Specification Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-body-sm">
          <div>
            <span className="text-label text-xs block text-[var(--text-muted)]">Prepared For</span>
            <span className="font-semibold text-[var(--text-primary)]">{quote.project?.customer?.name}</span>
          </div>
          <div>
            <span className="text-label text-xs block text-[var(--text-muted)]">Site Location</span>
            <span className="font-medium text-[var(--text-primary)]">{quote.project?.site_address || "Punjab"}</span>
          </div>
          <div>
            <span className="text-label text-xs block text-[var(--text-muted)]">System Capacity</span>
            <span className="font-semibold text-[var(--accent-base)]">{quote.nominal_kw || 3.3} kWp</span>
          </div>
          <div>
            <span className="text-label text-xs block text-[var(--text-muted)]">Warranty Coverage</span>
            <span className="font-medium text-[var(--text-primary)]">20 Yr Panels / 2 Yr Inverter</span>
          </div>
        </div>

        {/* Itemized Specification Table */}
        <div className="space-y-3">
          <h3 className="text-heading font-semibold text-[var(--text-primary)]">
            System Bill of Materials & Specifications
          </h3>
          <div className="border border-[var(--border-subtle)] rounded-lg overflow-hidden">
            <table className="w-full text-left text-body-sm border-collapse">
              <thead className="bg-[var(--surface-subtle)] border-b border-[var(--border-subtle)] text-label text-xs">
                <tr>
                  <th className="py-2.5 px-4">Component Description</th>
                  <th className="py-2.5 px-4 text-center">Quantity</th>
                  <th className="py-2.5 px-4 text-right">Standard Warranty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                <tr className="hover:bg-[var(--surface-hover)]">
                  <td className="py-3 px-4 font-medium text-[var(--text-primary)]">
                    Tier-1 Mono PERC Solar Panels (550 Wp each)
                  </td>
                  <td className="py-3 px-4 text-center font-mono tabular-nums">6 Modules</td>
                  <td className="py-3 px-4 text-right text-caption font-medium text-[var(--success-base)]">20 Years</td>
                </tr>
                <tr className="hover:bg-[var(--surface-hover)]">
                  <td className="py-3 px-4 font-medium text-[var(--text-primary)]">
                    3.3 kW On-Grid String Inverter (Wi-Fi Enabled)
                  </td>
                  <td className="py-3 px-4 text-center font-mono tabular-nums">1 Unit</td>
                  <td className="py-3 px-4 text-right text-caption font-medium text-[var(--success-base)]">2 Years</td>
                </tr>
                <tr className="hover:bg-[var(--surface-hover)]">
                  <td className="py-3 px-4 font-medium text-[var(--text-primary)]">
                    Elevated Aluminum Structure Kit (Wind-rated 150 km/h)
                  </td>
                  <td className="py-3 px-4 text-center font-mono tabular-nums">1 Set</td>
                  <td className="py-3 px-4 text-right text-caption text-[var(--text-muted)]">5 Years</td>
                </tr>
                <tr className="hover:bg-[var(--surface-hover)]">
                  <td className="py-3 px-4 font-medium text-[var(--text-primary)]">
                    AC/DC Distribution Boxes, Dual Earthing & Lightning Arrestor
                  </td>
                  <td className="py-3 px-4 text-center font-mono tabular-nums">1 Complete Kit</td>
                  <td className="py-3 px-4 text-right text-caption text-[var(--text-muted)]">1 Year</td>
                </tr>
                <tr className="hover:bg-[var(--surface-hover)]">
                  <td className="py-3 px-4 font-medium text-[var(--text-primary)]">
                    Turnkey Engineering, Net Metering Liaison & Commissioning
                  </td>
                  <td className="py-3 px-4 text-center font-mono tabular-nums">Scope Included</td>
                  <td className="py-3 px-4 text-right text-caption text-[var(--text-muted)]">—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Pricing & Net Subsidy Box */}
        <div className="card-surface p-6 bg-[var(--surface-subtle)] border border-[var(--border-strong)] space-y-3">
          <div className="flex items-center justify-between text-body-sm">
            <span className="text-[var(--text-secondary)]">Turnkey Quotation (Including 13.8% Composite GST)</span>
            <span className="font-mono tabular-nums font-semibold text-[var(--text-primary)]">
              {formatPaise(grossPaise)}
            </span>
          </div>
          <div className="flex items-center justify-between text-body-sm text-[var(--success-base)] font-medium">
            <span>Direct PM Surya Ghar Central Government Subsidy</span>
            <span className="font-mono tabular-nums">-{formatPaise(subsidyPaise)}</span>
          </div>
          <div className="pt-3 border-t border-[var(--border-strong)] flex items-center justify-between">
            <div>
              <span className="text-label text-xs block text-[var(--text-muted)]">Estimated Net Cost to Customer</span>
              <span className="text-title font-bold tabular-nums text-[var(--accent-base)]">
                {formatPaise(netPaise)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-caption block text-[var(--text-muted)]">50% Advance to Begin Installation</span>
              <span className="text-heading font-mono font-semibold tabular-nums text-[var(--text-primary)]">
                {formatPaise(advance50Pct)}
              </span>
            </div>
          </div>
        </div>

        {/* Customer Acceptance Form / Confirmation */}
        <div className="print:hidden">
          {isAlreadyAccepted ? (
            <div className="p-6 rounded-lg bg-[var(--success-subtle)] border border-[var(--success-border)] text-center space-y-2">
              <div className="inline-flex items-center gap-2 font-bold text-heading text-[var(--success-text)]">
                <CheckCircle2 className="w-6 h-6 text-[var(--success-base)]" />
                <span>Proposal Accepted & Order Cleared</span>
              </div>
              <p className="text-body-sm text-[var(--success-text)] max-w-md mx-auto">
                Thank you, <strong>{customerName}</strong>! Your order has been initiated with SunPower Solutions. Our project coordinator will contact you to confirm the installation schedule.
              </p>
            </div>
          ) : (
            <form onSubmit={handleAccept} className="space-y-4 pt-4 border-t border-[var(--border-subtle)]">
              {errorMessage && (
                <div className="p-3 rounded-md bg-[var(--danger-subtle)] border border-[var(--danger-border)] text-body-sm text-[var(--danger-text)]">
                  {errorMessage}
                </div>
              )}

              <div className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="agree"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded-xs accent-[var(--accent-base)]"
                />
                <label htmlFor="agree" className="text-body-sm text-[var(--text-secondary)] cursor-pointer">
                  I accept the technical scope, pricing, and 50% advance terms outlined above for my rooftop solar installation with SunPower Solutions.
                </label>
              </div>

              <button
                type="submit"
                disabled={!agreeTerms || isPending}
                className="btn-primary w-full h-12 text-body font-semibold justify-center inline-flex disabled:opacity-40 cursor-pointer"
              >
                {isPending ? "Processing Confirmation..." : "Accept Proposal & Authorize Order"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
