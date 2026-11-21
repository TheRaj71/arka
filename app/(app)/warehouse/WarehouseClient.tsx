"use client";

import React, { useState } from "react";
import Link from "next/link";
import { type PickListItem } from "@/modules/inventory/queries";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { StatusPill } from "@/components/shared/StatusPill";
import { formatDateIST } from "@/lib/formatters";
import { Truck, Package, ArrowRight, MapPin, CheckCircle2 } from "lucide-react";

interface WarehouseClientProps {
  pickLists: PickListItem[];
}

export function WarehouseClient({ pickLists }: WarehouseClientProps) {
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filtered = pickLists.filter((pl) => {
    if (filterStatus === "all") return true;
    if (filterStatus === "active") return pl.status === "pending" || pl.status === "loading";
    if (filterStatus === "in_transit") return pl.status === "in_transit";
    if (filterStatus === "delivered") return pl.status === "delivered";
    return true;
  });

  const activeCount = pickLists.filter((p) => p.status === "pending" || p.status === "loading").length;
  const inTransitCount = pickLists.filter((p) => p.status === "in_transit").length;
  const deliveredCount = pickLists.filter((p) => p.status === "delivered").length;

  const columns: Column<PickListItem>[] = [
    {
      header: "Project & Order",
      accessorKey: "project_no",
      cell: (item) => (
        <div>
          <div className="font-mono font-semibold text-text-primary text-body-sm">
            {item.project_no}
          </div>
          <div className="font-mono text-caption text-text-tertiary">
            Order #{item.order_id.slice(0, 8)}
          </div>
        </div>
      ),
    },
    {
      header: "Client & Site Destination",
      accessorKey: "customer_name",
      cell: (item) => (
        <div>
          <div className="font-medium text-text-primary text-body-sm">{item.customer_name}</div>
          <div className="flex items-center gap-1 text-caption text-text-secondary mt-0.5 max-w-[280px] truncate">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-text-tertiary" />
            <span className="truncate">{item.delivery_address}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Dispatch Ref",
      accessorKey: "dispatch_no",
      cell: (item) => (
        <span className="font-mono font-medium text-text-primary text-body-sm">
          {item.dispatch_no || "DSP-2627-00001"}
        </span>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (item) => <StatusPill status={item.status} domain="inventory" />,
    },
    {
      header: "Created Date",
      accessorKey: "created_at",
      cell: (item) => (
        <span className="text-body-sm text-text-secondary tabular-nums">
          {formatDateIST(item.created_at)}
        </span>
      ),
    },
    {
      header: "Action",
      cell: (item) => (
        <div className="flex justify-end">
          <Link
            href={`/warehouse/dispatch/${item.id}`}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-[var(--radius-control)] bg-[var(--surface-subtle)] hover:bg-[var(--border-subtle)] text-text-primary text-body-sm font-medium border border-[var(--border-subtle)] transition-colors"
          >
            <span>Scan Station</span>
            <ArrowRight className="w-3.5 h-3.5 text-text-secondary" />
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: "Operations", href: "/dashboard" },
          { label: "Warehouse & Fulfilment" },
        ]}
        title="Warehouse & Dispatch Station"
        description="Barcode and QR scanning station for serialized solar hardware. Links serial units to customer asset passports."
        actions={
          <Link
            href="/inventory"
            className="inline-flex items-center gap-2 h-11 px-4 rounded-[var(--radius-control)] bg-[var(--surface-subtle)] hover:bg-[var(--border-subtle)] text-text-primary text-body-sm font-medium border border-[var(--border-subtle)] transition-colors"
          >
            <Package className="w-4 h-4 text-text-secondary" />
            <span>Stock Catalogue & Inwarding</span>
          </Link>
        }
      />

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Active Pick-Lists"
          value={activeCount}
          helperText="Ready for staging & QR scan"
          variant="highlight"
        />
        <StatCard
          label="In Transit (En Route)"
          value={inTransitCount}
          helperText="Vehicles moving to site"
        />
        <StatCard
          label="Delivered & Warranted"
          value={deliveredCount}
          helperText="Asset passports activated"
        />
        <StatCard
          label="Total Fulfilment Runs"
          value={pickLists.length}
          helperText="All tracked dispatches"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-2 text-body-sm font-medium text-text-secondary">
        {[
          { id: "all", label: `All Shipments (${pickLists.length})` },
          { id: "active", label: `Ready to Scan (${activeCount})` },
          { id: "in_transit", label: `In Transit (${inTransitCount})` },
          { id: "delivered", label: `Delivered (${deliveredCount})` },
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

      {/* Dispatch Runs Table */}
      <div className="rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-subtle)] overflow-hidden">
        <DataTable
          columns={columns}
          data={filtered}
          searchPlaceholder="Search by project, client, or site..."
          searchColumn="customer_name"
          pageSize={10}
        />
      </div>
    </div>
  );
}
