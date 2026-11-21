"use client";

import React, { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatMoney } from "@/lib/money";
import { formatIstDate } from "@/lib/time";
import { type InvoiceItem } from "@/modules/finance/queries";
import {
  FileText,
  Search,
  CheckCircle2,
  Download,
  Printer,
  Calendar,
  Layers,
  Sparkles,
} from "lucide-react";

interface InvoicesClientProps {
  invoices: InvoiceItem[];
}

export function InvoicesClient({ invoices }: InvoicesClientProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = invoices.filter((inv) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNo = inv.invoice_no.toLowerCase().includes(q);
      const matchCust = inv.customer_name.toLowerCase().includes(q);
      if (!matchNo && !matchCust) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Tax Invoices & Billing
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
              {invoices.length} Invoices Issued
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Compliant Indian GST Tax Invoices (70% Goods @ 12% GST + 30% Services @ 18% GST = 13.8% Composite Solar Rate).
          </p>
        </div>
      </div>

      {/* Invoices Table */}
      <GlassCard className="overflow-hidden p-0 border border-slate-200/70">
        <div className="p-4 bg-slate-50/90 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-slate-900 text-xs">GST Tax Invoice Ledger</h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/60 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-4">Invoice #</th>
                <th className="py-2.5 px-4">Client Details</th>
                <th className="py-2.5 px-4 text-right">Taxable Amount</th>
                <th className="py-2.5 px-4 text-right">CGST (6.9%)</th>
                <th className="py-2.5 px-4 text-right">SGST (6.9%)</th>
                <th className="py-2.5 px-4 text-right">Total Invoice</th>
                <th className="py-2.5 px-4">Issued Date</th>
                <th className="py-2.5 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{inv.invoice_no}</td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{inv.customer_name}</div>
                    <div className="font-mono text-[10px] text-slate-400 mt-0.5">
                      {inv.customer_phone}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-700">
                    {formatMoney(inv.taxable_paise)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-500">
                    {formatMoney(inv.cgst_paise)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-500">
                    {formatMoney(inv.sgst_paise)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-extrabold text-slate-900 text-sm">
                    {formatMoney(inv.total_paise)}
                  </td>
                  <td className="py-3 px-4 text-slate-600">{formatIstDate(inv.issued_at)}</td>
                  <td className="py-3 px-4 text-right">
                    <StatusBadge status={inv.status} />
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
