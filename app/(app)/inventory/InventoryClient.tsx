"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { type CatalogueProduct } from "@/modules/inventory/queries";
import { receiveStock } from "@/modules/inventory/actions";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { formatPaise } from "@/lib/formatters";
import {
  Boxes,
  Plus,
  Package,
  Barcode,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Truck,
} from "lucide-react";

interface InventoryClientProps {
  products: CatalogueProduct[];
}

export function InventoryClient({ products: initialProducts }: InventoryClientProps) {
  const [products] = useState<CatalogueProduct[]>(initialProducts);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Inward Goods Receipt Form
  const [receiveForm, setReceiveForm] = useState({
    productId: products[0]?.id || "",
    invoiceNo: "INV-REC-" + Date.now().toString().slice(-4),
    unitCostPaise: 850000, // ₹8,500
    serialsInput: "",
    qty: 6,
  });
  const [receiveSuccess, setReceiveSuccess] = useState<string | null>(null);

  const selectedProduct = products.find((p) => p.id === receiveForm.productId);

  const filteredProducts = products.filter((p) => {
    if (activeCategory !== "all" && p.category !== activeCategory) return false;
    return true;
  });

  const totalInStock = products.reduce((acc, p) => acc + (p.in_stock || 0), 0);
  const lowStockCount = products.filter((p) => p.available <= 2).length;
  const serialisedCount = products.filter((p) => p.is_serialised).length;

  const handleReceiveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    setReceiveSuccess(null);

    const serials = selectedProduct?.is_serialised
      ? receiveForm.serialsInput
          .split(/[\n,]+/)
          .map((s) => s.trim().toUpperCase())
          .filter(Boolean)
      : [];

    startTransition(async () => {
      const res = await receiveStock({
        product_id: receiveForm.productId,
        unit_cost_paise: receiveForm.unitCostPaise,
        invoice_no: receiveForm.invoiceNo,
        serials,
        qty: selectedProduct?.is_serialised ? serials.length : receiveForm.qty,
      });

      if (res.ok) {
        setReceiveSuccess(
          `Stock successfully inwarded for ${selectedProduct?.name || "Product"}.`
        );
        setShowReceiveModal(false);
      }
    });
  };

  const columns: Column<CatalogueProduct>[] = [
    {
      key: "name",
      header: "SKU & Description",
      render: (item: CatalogueProduct) => (
        <div>
          <div className="font-medium text-text-primary text-body-sm">{item.name}</div>
          <div className="font-mono text-caption text-text-tertiary mt-0.5">{item.sku}</div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      render: (item: CatalogueProduct) => {
        const labels: Record<string, string> = {
          solar_panel: "Solar Panels",
          inverter: "Inverters",
          battery: "Batteries",
          structure: "Mounting Kits",
          bos: "BOS Electricals",
        };
        return (
          <span className="text-caption font-medium px-2.5 py-1 rounded-[var(--radius-control)] bg-[var(--surface-subtle)] text-text-secondary border border-[var(--border-subtle)]">
            {labels[item.category] || item.category}
          </span>
        );
      },
    },
    {
      key: "is_serialised",
      header: "Tracking",
      render: (item: CatalogueProduct) => (
        <span
          className={`font-mono text-caption font-medium px-2 py-0.5 rounded-[var(--radius-control)] ${
            item.is_serialised
              ? "bg-[var(--accent-subtle)] text-[var(--accent-base)] border border-[var(--border-subtle)]"
              : "text-text-tertiary"
          }`}
        >
          {item.is_serialised ? "Serialised" : "Bulk Qty"}
        </span>
      ),
    },
    {
      key: "warranty_months",
      header: "Warranty",
      align: "right",
      render: (item: CatalogueProduct) => (
        <span className="font-mono text-body-sm text-text-secondary tabular-nums">
          {item.warranty_months} Mo.
        </span>
      ),
    },
    {
      key: "in_stock",
      header: "In Stock",
      align: "right",
      render: (item: CatalogueProduct) => (
        <span className="font-mono text-body-sm text-text-primary tabular-nums">
          {item.in_stock} {item.uom}
        </span>
      ),
    },
    {
      key: "reserved",
      header: "Reserved",
      align: "right",
      render: (item: CatalogueProduct) => (
        <span className="font-mono text-body-sm text-amber-700 dark:text-amber-400 tabular-nums">
          {item.reserved}
        </span>
      ),
    },
    {
      key: "available",
      header: "Available",
      align: "right",
      render: (item: CatalogueProduct) => {
        const isLow = item.available <= 2;
        return (
          <span
            className={`font-mono font-semibold text-body-sm tabular-nums ${
              isLow
                ? "text-rose-700 dark:text-rose-400"
                : "text-emerald-700 dark:text-emerald-400"
            }`}
          >
            {item.available}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: "Operations", href: "/dashboard" },
          { label: "Hardware Inventory" },
        ]}
        title="Hardware Catalogue & Stock Ledger"
        description="Serial-level inventory tracking for panels, inverters & batteries. Append-only stock movements and warehouse ledger."
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/warehouse"
              className="inline-flex items-center gap-2 h-11 px-4 rounded-[var(--radius-control)] bg-[var(--surface-subtle)] hover:bg-[var(--border-subtle)] text-text-primary text-body-sm font-medium border border-[var(--border-subtle)] transition-colors"
            >
              <Truck className="w-4 h-4 text-text-secondary" />
              <span>Dispatch Station</span>
            </Link>
            <button
              onClick={() => setShowReceiveModal(true)}
              className="inline-flex items-center gap-2 h-11 px-5 rounded-[var(--radius-control)] bg-[var(--accent-base)] hover:bg-[var(--accent-hover)] text-white text-body font-medium transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Inward New Stock (GRN)</span>
            </button>
          </div>
        }
      />

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Active SKUs Tracked"
          value={products.length}
          helperText="Catalogue item types"
        />
        <StatCard
          label="Total Units In Stock"
          value={totalInStock}
          helperText="Available in central store"
          variant="highlight"
        />
        <StatCard
          label="Serialised Hardware"
          value={serialisedCount}
          helperText="Tracked with QR/barcodes"
        />
        <StatCard
          label="Low Stock Alerts"
          value={lowStockCount}
          helperText="Items with ≤ 2 available"
          variant={lowStockCount > 0 ? "warning" : "default"}
        />
      </div>

      {receiveSuccess && (
        <div className="p-4 rounded-[var(--radius-control)] bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-body-sm flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{receiveSuccess}</span>
        </div>
      )}

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-2 text-body-sm font-medium text-text-secondary overflow-x-auto">
        {[
          { id: "all", label: `All Products (${products.length})` },
          { id: "solar_panel", label: "Solar Panels" },
          { id: "inverter", label: "Inverters" },
          { id: "battery", label: "Batteries" },
          { id: "structure", label: "Mounting Kits" },
          { id: "bos", label: "BOS Electricals" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveCategory(tab.id)}
            className={`px-3 py-1.5 rounded-[var(--radius-control)] transition-colors whitespace-nowrap ${
              activeCategory === tab.id
                ? "bg-[var(--surface-subtle)] text-text-primary font-semibold border border-[var(--border-strong)]"
                : "hover:text-text-primary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Products DataTable */}
      <div className="rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-subtle)] overflow-hidden">
        <DataTable
          columns={columns}
          data={filteredProducts}
          searchPlaceholder="Search by SKU or product name..."
          searchColumn="name"
          pageSize={10}
        />
      </div>

      {/* Inward Stock (Goods Receipt Note) Modal */}
      {showReceiveModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-subtle)] p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <div>
                <h3 className="text-title font-semibold text-text-primary">
                  Inward New Stock (Goods Receipt)
                </h3>
                <p className="text-caption text-text-secondary">
                  Record supplier consignment and register hardware serial numbers
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowReceiveModal(false)}
                className="text-text-tertiary hover:text-text-primary text-body font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReceiveStock} className="space-y-4">
              <div>
                <label className="block text-label text-text-primary mb-1.5 font-medium">
                  Select Product SKU
                </label>
                <select
                  value={receiveForm.productId}
                  onChange={(e) =>
                    setReceiveForm({ ...receiveForm, productId: e.target.value })
                  }
                  className="w-full h-11 px-3 rounded-[var(--radius-control)] border border-[var(--border-strong)] bg-[var(--surface-card)] text-text-primary text-body focus:outline-none focus:ring-2 focus:ring-[var(--accent-base)]"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) — {p.is_serialised ? "Serialised" : "Bulk"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-label text-text-primary mb-1.5 font-medium">
                    Supplier Invoice / Challan #
                  </label>
                  <input
                    type="text"
                    required
                    value={receiveForm.invoiceNo}
                    onChange={(e) =>
                      setReceiveForm({ ...receiveForm, invoiceNo: e.target.value })
                    }
                    className="w-full h-11 px-3 rounded-[var(--radius-control)] border border-[var(--border-strong)] bg-[var(--surface-card)] text-text-primary text-body font-mono focus:outline-none focus:ring-2 focus:ring-[var(--accent-base)]"
                  />
                </div>

                <div>
                  <label className="block text-label text-text-primary mb-1.5 font-medium">
                    Unit Cost (Excl. Tax)
                  </label>
                  <MoneyInput
                    valueInPaise={receiveForm.unitCostPaise}
                    onChangePaise={(paise) =>
                      setReceiveForm({ ...receiveForm, unitCostPaise: paise })
                    }
                  />
                </div>
              </div>

              {selectedProduct?.is_serialised ? (
                <div>
                  <label className="block text-label text-text-primary mb-1.5 font-medium">
                    Hardware Serial Numbers (Comma or Newline separated)
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder={"SP-PAN-2026-0101\nSP-PAN-2026-0102\nSP-PAN-2026-0103"}
                    value={receiveForm.serialsInput}
                    onChange={(e) =>
                      setReceiveForm({ ...receiveForm, serialsInput: e.target.value })
                    }
                    className="w-full p-3 rounded-[var(--radius-control)] border border-[var(--border-strong)] bg-[var(--surface-card)] text-text-primary text-body font-mono text-body-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-base)]"
                  />
                  <p className="text-caption text-text-tertiary mt-1">
                    Each serial unit is registered into inventory as an individual asset for warranty tracking.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-label text-text-primary mb-1.5 font-medium">
                    Consignment Quantity
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={receiveForm.qty}
                    onChange={(e) =>
                      setReceiveForm({ ...receiveForm, qty: Number(e.target.value) })
                    }
                    className="w-full h-11 px-3 rounded-[var(--radius-control)] border border-[var(--border-strong)] bg-[var(--surface-card)] text-text-primary text-body focus:outline-none focus:ring-2 focus:ring-[var(--accent-base)]"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setShowReceiveModal(false)}
                  className="h-11 px-4 rounded-[var(--radius-control)] border border-[var(--border-subtle)] text-text-secondary hover:text-text-primary text-body-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="h-11 px-5 rounded-[var(--radius-control)] bg-[var(--accent-base)] hover:bg-[var(--accent-hover)] text-white text-body font-medium transition-colors disabled:opacity-50"
                >
                  {isPending ? "Recording Goods Receipt..." : "Record Goods Receipt (GRN)"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
