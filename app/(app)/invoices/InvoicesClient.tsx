"use client";

import React, { useState } from "react";
import Link from "next/link";
import { type InvoiceItem } from "@/modules/finance/queries";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { StatusPill } from "@/components/shared/StatusPill";
import { formatPaise, formatPaiseShorthand, formatDateIST } from "@/lib/formatters";
import {
  FileText,
  Printer,
  Calendar,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";

interface InvoicesClientProps {
  invoices: InvoiceItem[];
}

export function InvoicesClient({ invoices }: InvoicesClientProps) {
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filtered = invoices.filter((inv) => {
    if (filterStatus === "all") return true;
    return inv.status === filterStatus;
  });

  const totalInvoicedPaise = invoices.reduce(
    (acc, i) => acc + BigInt(i.total_paise || 0),
    0n
  );
  const totalCgstPaise = invoices.reduce(
    (acc, i) => acc + BigInt(i.cgst_paise || 0),
    0n
  );
  const totalSgstPaise = invoices.reduce(
    (acc, i) => acc + BigInt(i.sgst_paise || 0),
    0n
  );
  const paidCount = invoices.filter((i) => i.status === "paid").length;

  const columns: Column<InvoiceItem>[] = [
    {
      key: "invoice_no",
      header: "Invoice #",
      render: (item: InvoiceItem) => (
        <span className="font-mono font-semibold text-text-primary text-body-sm">
          {item.invoice_no}
        </span>
      ),
    },
    {
      key: "customer_name",
      header: "Client & Project",
      render: (item: InvoiceItem) => (
        <div>
          <div className="font-medium text-text-primary text-body-sm">{item.customer_name}</div>
          <div className="font-mono text-caption text-text-tertiary mt-0.5">
            {item.customer_phone}
          </div>
        </div>
      ),
    },
    {
      key: "taxable_paise",
      header: "Taxable Value",
      align: "right",
      render: (item: InvoiceItem) => (
        <span className="font-mono text-body-sm text-text-secondary tabular-nums">
          {formatPaise(item.taxable_paise)}
        </span>
      ),
    },
    {
      key: "cgst_paise",
      header: "CGST (6.9%)",
      align: "right",
      render: (item: InvoiceItem) => (
        <span className="font-mono text-body-sm text-text-tertiary tabular-nums">
          {formatPaise(item.cgst_paise)}
        </span>
      ),
    },
    {
      key: "sgst_paise",
      header: "SGST (6.9%)",
      align: "right",
      render: (item: InvoiceItem) => (
        <span className="font-mono text-body-sm text-text-tertiary tabular-nums">
          {formatPaise(item.sgst_paise)}
        </span>
      ),
    },
    {
      key: "total_paise",
      header: "Total Invoice",
      align: "right",
      render: (item: InvoiceItem) => (
        <span className="font-mono font-semibold text-body-sm text-text-primary tabular-nums">
          {formatPaise(item.total_paise)}
        </span>
      ),
    },
    {
      key: "issued_at",
      header: "Issued Date",
      render: (item: InvoiceItem) => (
        <span className="text-body-sm text-text-secondary tabular-nums">
          {item.issued_at ? formatDateIST(item.issued_at) : "Nov 2026"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (item: InvoiceItem) => <StatusPill status={item.status} />,
    },
    {
      key: "actions",
      header: "Action",
      render: () => (
        <div className="flex justify-end gap-1.5">
          <button
            type="button"
            onClick={() => window.print()}
            className="p-2 rounded-[var(--radius-control)] hover:bg-[var(--surface-subtle)] text-text-secondary hover:text-text-primary transition-colors"
            title="Print Tax Invoice"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: "Finance", href: "/dashboard" },
          { label: "GST Invoices" },
        ]}
        title="Tax Invoices & Billing Ledger"
        description="Statutory Indian GST Tax Invoices. 70% Goods @ 12% GST + 30% Services @ 18% GST = 13.8% Composite Solar Rate."
        actions={
          <Link
            href="/subsidy"
            className="inline-flex items-center gap-2 h-11 px-4 rounded-[var(--radius-control)] bg-[var(--surface-subtle)] hover:bg-[var(--border-subtle)] text-text-primary text-body-sm font-medium border border-[var(--border-subtle)] transition-colors"
          >
            <span>PM Surya Ghar Subsidy Tracker →</span>
          </Link>
        }
      />

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Invoiced Value"
          value={formatPaiseShorthand(totalInvoicedPaise)}
          helperText="Gross billing across projects"
          variant="highlight"
        />
        <StatCard
          label="CGST Output Tax"
          value={formatPaiseShorthand(totalCgstPaise)}
          helperText="Central GST liability @ 6.9%"
        />
        <StatCard
          label="SGST Output Tax"
          value={formatPaiseShorthand(totalSgstPaise)}
          helperText="State GST liability @ 6.9%"
        />
        <StatCard
          label="Paid Invoices"
          value={`${paidCount} of ${invoices.length}`}
          helperText="Fully settled accounts"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-2 text-body-sm font-medium text-text-secondary">
        {[
          { id: "all", label: `All Invoices (${invoices.length})` },
          { id: "paid", label: `Paid (${paidCount})` },
          { id: "sent", label: "Awaiting Payment" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id)}
            className={`px-3 py-1.5 rounded-[var(--radius-control)] transition-colors ${
              filterStatus === tab.id
                ? "bg-[var(--surface-subtle)] text-text-primary font-semibold border border-[var(--border-strong)]"
                : "hover:text-text-primary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Invoices DataTable */}
      <div className="rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-subtle)] overflow-hidden">
        <DataTable
          columns={columns}
          data={filtered}
          searchPlaceholder="Search invoices by client or invoice #..."
          searchColumn="customer_name"
          pageSize={10}
        />
      </div>
    </div>
  );
}
