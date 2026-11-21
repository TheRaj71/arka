"use client";

import React, { useState, useTransition } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { receiveStock } from "@/modules/inventory/actions";
import { type CatalogueProduct } from "@/modules/inventory/queries";
import {
  Boxes,
  Search,
  Plus,
  Barcode,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Package,
  Layers,
  ArrowRight,
} from "lucide-react";

interface InventoryClientProps {
  products: CatalogueProduct[];
}

export function InventoryClient({ products: initialProducts }: InventoryClientProps) {
  const [products, setProducts] = useState<CatalogueProduct[]>(initialProducts);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Receive form state
  const [receiveForm, setReceiveForm] = useState({
    productId: products[0]?.id || "",
    invoiceNo: "INV-REC-" + Date.now().toString().slice(-4),
    unitCostRupees: 8500,
    serialsInput: "",
    qty: 6,
  });
  const [receiveSuccess, setReceiveSuccess] = useState<string | null>(null);

  const filteredProducts = products.filter((p) => {
    if (activeCategory !== "all" && p.category !== activeCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchSku = p.sku.toLowerCase().includes(q);
      if (!matchName && !matchSku) return false;
    }
    return true;
  });

  const selectedProduct = products.find((p) => p.id === receiveForm.productId);

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
        unit_cost_paise: receiveForm.unitCostRupees * 100,
        invoice_no: receiveForm.invoiceNo,
        serials,
        qty: selectedProduct?.is_serialised ? serials.length : receiveForm.qty,
      });

      if (res.ok) {
        setReceiveSuccess("Stock successfully inwarded and available for reservation.");
        setShowReceiveModal(false);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Inventory & Hardware Catalogue
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
              {products.length} Products Tracked
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Serial-level inventory tracking for panels, inverters & batteries. Append-only stock movements.
          </p>
        </div>

        <button
          onClick={() => setShowReceiveModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          <span>Inward New Stock (Goods Receipt)</span>
        </button>
      </div>

      {receiveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{receiveSuccess}</span>
        </div>
      )}

      {/* Filter Tabs & Search */}
      <GlassCard className="p-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: "all", label: "All Equipment" },
              { id: "panel", label: "Solar Panels" },
              { id: "inverter", label: "Inverters" },
              { id: "battery", label: "Batteries" },
              { id: "bos", label: "BOS Hardware & Cables" },
              { id: "structure", label: "Mounting Structures" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  activeCategory === tab.id
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative min-w-[240px] max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by SKU, product name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white/70 border border-slate-200/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-slate-800 placeholder-slate-400 shadow-inner"
            />
          </div>
        </div>
      </GlassCard>

      {/* Catalogue Table */}
      <GlassCard className="overflow-hidden p-0 border border-slate-200/70">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Product & Model</th>
                <th className="py-3 px-4">Tracking Mode</th>
                <th className="py-3 px-4">Standard Warranty</th>
                <th className="py-3 px-4 text-center">In Stock</th>
                <th className="py-3 px-4 text-center">Reserved for Orders</th>
                <th className="py-3 px-4 text-center">Available Stock</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {filteredProducts.map((p) => {
                const isLowStock = p.available <= 5;

                return (
                  <tr key={p.id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{p.name}</div>
                      <div className="font-mono text-[10px] text-slate-400 mt-0.5">{p.sku}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      {p.is_serialised ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          <Barcode className="w-3 h-3 text-amber-700" />
                          <span>Serialised (QR/Barcode)</span>
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          Bulk ({p.uom})
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      {p.warranty_months >= 120
                        ? `${p.warranty_months / 12} Years (Performance)`
                        : `${p.warranty_months / 12} Years`}
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">
                      {p.in_stock} {p.uom}
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono text-amber-600 font-semibold">
                      {p.reserved} {p.uom}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="font-mono font-extrabold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        {p.available} {p.uom}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {isLowStock ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                          Low Stock
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Sufficient
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Receive Stock Modal */}
      {showReceiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Goods Receipt Inward</h3>
                  <p className="text-xs text-slate-500">Record incoming hardware & serial numbers</p>
                </div>
              </div>
              <button
                onClick={() => setShowReceiveModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReceiveStock} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Select Product *</label>
                <select
                  value={receiveForm.productId}
                  onChange={(e) =>
                    setReceiveForm({ ...receiveForm, productId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
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
                  <label className="block text-slate-700 font-semibold mb-1">Supplier Invoice #</label>
                  <input
                    type="text"
                    required
                    value={receiveForm.invoiceNo}
                    onChange={(e) =>
                      setReceiveForm({ ...receiveForm, invoiceNo: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Unit Cost (₹)</label>
                  <input
                    type="number"
                    value={receiveForm.unitCostRupees}
                    onChange={(e) =>
                      setReceiveForm({
                        ...receiveForm,
                        unitCostRupees: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              {selectedProduct?.is_serialised ? (
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Serial Numbers * (Paste or type comma/newline separated)
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="SP-PAN-2026-0001, SP-PAN-2026-0002..."
                    value={receiveForm.serialsInput}
                    onChange={(e) =>
                      setReceiveForm({ ...receiveForm, serialsInput: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs focus:ring-2 focus:ring-amber-500/30"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Each serial unit is assigned an individual asset lifecycle and warranty record.
                  </span>
                </div>
              ) : (
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Quantity Received ({selectedProduct?.uom}) *
                  </label>
                  <input
                    type="number"
                    required
                    value={receiveForm.qty}
                    onChange={(e) =>
                      setReceiveForm({ ...receiveForm, qty: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowReceiveModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-md shadow-amber-500/20 disabled:opacity-50"
                >
                  {isPending ? "Inwarding..." : "Record Inward Stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
