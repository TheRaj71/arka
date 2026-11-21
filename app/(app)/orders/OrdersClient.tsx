"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusPill } from "@/components/shared/StatusPill";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { formatPaise, formatDateIST } from "@/lib/formatters";
import { type OrderItem } from "@/modules/orders/queries";
import { ArrowRight, ShoppingCart } from "lucide-react";

interface OrdersClientProps {
  initialOrders: OrderItem[];
}

export function OrdersClient({ initialOrders }: OrdersClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("all");

  const filteredOrders = initialOrders.filter((o) => {
    if (activeTab === "pending") return o.status === "pending_payment";
    if (activeTab === "confirmed") return o.status === "confirmed";
    if (activeTab === "delivered") return o.status === "delivered";
    if (activeTab === "installed") return o.status === "installed";
    return true;
  });

  const columns: Column<OrderItem>[] = [
    {
      key: "order_no",
      header: "Order Ref",
      width: "160px",
      render: (o) => (
        <span className="font-mono text-xs font-semibold text-[var(--text-primary)]">
          {o.order_no}
        </span>
      ),
    },
    {
      key: "customer",
      header: "Customer & Site",
      render: (o) => (
        <div>
          <div className="font-medium text-[var(--text-primary)]">
            {o.project?.customer?.name || o.delivery_name || "Customer"}
          </div>
          <div className="text-caption text-[var(--text-muted)] truncate max-w-xs">
            {o.delivery_address || "Punjab, India"}
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (o) => <StatusPill status={o.status} />,
    },
    {
      key: "total_paise",
      header: "Order Total",
      align: "right",
      sortable: true,
      render: (o) => (
        <span className="font-mono font-medium text-[var(--text-primary)]">
          {formatPaise(o.total_paise)}
        </span>
      ),
    },
    {
      key: "paid_paise",
      header: "Paid (Advance)",
      align: "right",
      render: (o) => {
        const met = o.paid_paise >= o.advance_required_paise;
        return (
          <span
            className={`font-mono tabular-nums font-semibold ${
              met ? "text-[var(--success-base)]" : "text-[var(--warning-base)]"
            }`}
          >
            {formatPaise(o.paid_paise)}
          </span>
        );
      },
    },
    {
      key: "date",
      header: "Created",
      align: "right",
      render: (o) => formatDateIST(o.created_at),
    },
    {
      key: "action",
      header: "",
      align: "right",
      render: (o) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/orders/${o.id}`);
          }}
          className="btn-secondary h-8 px-2.5 text-xs inline-flex items-center gap-1"
        >
          <span>View</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Customer Orders & Execution Tracking"
        description="Orders auto-confirm upon 50% advance payment receipt, reserving stock and scheduling crew."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Orders" }]}
        tabs={[
          { id: "all", label: "All Orders", count: initialOrders.length, active: activeTab === "all", onClick: () => setActiveTab("all") },
          { id: "pending", label: "Pending Advance", count: initialOrders.filter((o) => o.status === "pending_payment").length, active: activeTab === "pending", onClick: () => setActiveTab("pending") },
          { id: "confirmed", label: "Confirmed / In Store", count: initialOrders.filter((o) => o.status === "confirmed").length, active: activeTab === "confirmed", onClick: () => setActiveTab("confirmed") },
          { id: "delivered", label: "Delivered", count: initialOrders.filter((o) => o.status === "delivered").length, active: activeTab === "delivered", onClick: () => setActiveTab("delivered") },
          { id: "installed", label: "Installed", count: initialOrders.filter((o) => o.status === "installed").length, active: activeTab === "installed", onClick: () => setActiveTab("installed") },
        ]}
      />

      <DataTable
        columns={columns}
        data={filteredOrders}
        searchPlaceholder="Search customer, order no, or city..."
        onRowClick={(o) => router.push(`/orders/${o.id}`)}
      />
    </div>
  );
}
