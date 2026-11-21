"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatIstDate, formatTimeAgo } from "@/lib/time";
import {
  scanDispatchUnit,
  finalizeDispatch,
  confirmDelivery,
} from "@/modules/inventory/actions";
import { type DispatchItem } from "@/modules/inventory/queries";
import {
  ArrowLeft,
  Barcode,
  Camera,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Truck,
  ShieldCheck,
  Package,
  Layers,
  Sparkles,
  Zap,
  MapPin,
  Clock,
  Send,
  Radio,
} from "lucide-react";

interface DispatchScanClientProps {
  dispatch: DispatchItem;
}

export function DispatchScanClient({ dispatch: initialDispatch }: DispatchScanClientProps) {
  const router = useRouter();
  const [dispatch, setDispatch] = useState<DispatchItem>(initialDispatch);
  const [isPending, startTransition] = useTransition();

  // Scan input
  const [serialInput, setSerialInput] = useState("");
  const [scanResult, setScanResult] = useState<{
    ok: boolean;
    result: string;
    serial: string;
    message: string;
  } | null>(null);

  // Delivery confirmation modal
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [recipientName, setRecipientName] = useState(
    dispatch.order?.delivery_name || "Anita Sharma"
  );
  const [deliverySuccess, setDeliverySuccess] = useState(false);

  const isDelivered = dispatch.status === "delivered" || deliverySuccess;
  const isInTransit = dispatch.status === "in_transit";
  const isLoading = dispatch.status === "loading" || dispatch.status === "draft";

  const handleScan = async (overrideSerial?: string) => {
    const raw = (overrideSerial || serialInput).trim();
    if (!raw) return;
    setScanResult(null);

    startTransition(async () => {
      const res = await scanDispatchUnit({
        dispatch_id: dispatch.id,
        raw_serial: raw,
        method: "camera",
      });

      if (!res.ok) {
        setScanResult({
          ok: false,
          result: res.error.code,
          serial: raw,
          message: res.error.message,
        });
        return;
      }

      setScanResult({
        ok: res.data.ok,
        result: res.data.result,
        serial: res.data.serial,
        message: res.data.message,
      });

      if (res.data.ok) {
        setDispatch({
          ...dispatch,
          status: "loading",
          scanned_units: [
            {
              id: Math.random().toString(),
              serial_no: res.data.serial,
              product_name: res.data.serial.includes("INV") ? "Inverter" : "Solar Panel",
              scanned_at: new Date().toISOString(),
            },
            ...dispatch.scanned_units,
          ],
        });
        setSerialInput("");
      }
    });
  };

  const handleFinalizeDispatch = async () => {
    startTransition(async () => {
      const res = await finalizeDispatch({ dispatch_id: dispatch.id });
      if (res.ok) {
        setDispatch({ ...dispatch, status: "in_transit", departed_at: new Date().toISOString() });
        router.refresh();
      }
    });
  };

  const handleConfirmDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await confirmDelivery({
        dispatch_id: dispatch.id,
        customer_name: recipientName,
      });

      if (res.ok) {
        setDeliverySuccess(true);
        setDispatch({
          ...dispatch,
          status: "delivered",
          delivered_at: new Date().toISOString(),
        });
        setShowDeliveryModal(false);
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/warehouse"
            className="p-2 rounded-xl bg-white/70 hover:bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 shadow-sm transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
                {dispatch.dispatch_no}
              </h1>
              <StatusBadge status={dispatch.status} />
              <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                Order #{dispatch.order?.order_no}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Client: <span className="font-semibold text-slate-800">{dispatch.order?.delivery_name}</span>{" "}
              • Vehicle: <span className="font-mono text-slate-700">{dispatch.vehicle || "MH-12-SP-2026"}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {isLoading && (
            <button
              onClick={handleFinalizeDispatch}
              disabled={isPending || dispatch.scanned_units.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
            >
              <Truck className="w-4 h-4 text-amber-400" />
              <span>Finalize Dispatch & Depart Truck</span>
            </button>
          )}

          {isInTransit && (
            <button
              onClick={() => setShowDeliveryModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Confirm Delivery at Site (Start Warranties)</span>
            </button>
          )}

          {isDelivered && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Delivered & Warranty Clocks Active (20y Panels, 2y Inverter)</span>
            </div>
          )}
        </div>
      </div>

      {/* AUTOMATION A10 BANNER: Warranty Clocks Active */}
      {isDelivered && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm">
                  Automation A10 Cleared: Asset Records Created & Warranties Started!
                </h3>
                <p className="text-xs text-emerald-100">
                  Each scanned serial unit is now mapped to {dispatch.order?.delivery_name}&apos;s customer profile.
                </p>
              </div>
            </div>
            <Link
              href="/service"
              className="px-3.5 py-1.5 bg-white text-emerald-900 rounded-lg font-bold text-xs hover:bg-emerald-50 transition-colors shadow-sm"
            >
              Test Service Desk Lookup →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
            <div className="bg-white/10 p-2 rounded-lg">
              <span className="text-[10px] text-emerald-100 block">Panels Warranty</span>
              <span className="font-bold">20 Years (240 Mo.)</span>
            </div>
            <div className="bg-white/10 p-2 rounded-lg">
              <span className="text-[10px] text-emerald-100 block">Inverter Warranty</span>
              <span className="font-bold">2 Years (24 Mo.)</span>
            </div>
            <div className="bg-white/10 p-2 rounded-lg">
              <span className="text-[10px] text-emerald-100 block">Warranty Start Date</span>
              <span className="font-bold font-mono">Today (IST)</span>
            </div>
            <div className="bg-white/10 p-2 rounded-lg">
              <span className="text-[10px] text-emerald-100 block">Assets Registered</span>
              <span className="font-bold font-mono">{dispatch.scanned_units.length} Serial Units</span>
            </div>
          </div>
        </div>
      )}

      {/* Scanner & Manual Fallback Bar */}
      {isLoading && (
        <GlassCard className="p-5 border-amber-300/80 bg-gradient-to-r from-amber-500/5 via-white/80 to-amber-500/10">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500 text-white">
                <Barcode className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Hardware QR / Barcode Scanner (REQ-INV-07)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Scan serial number on panel frame or inverter chassis before loading
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
              Camera / Manual Mode
            </span>
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Barcode className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Scan or type serial number (e.g. SP-PAN-2026-0001)..."
                  value={serialInput}
                  onChange={(e) => setSerialInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleScan()}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-mono font-semibold"
                />
              </div>

              <button
                onClick={() => handleScan()}
                disabled={isPending || !serialInput.trim()}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 disabled:opacity-50"
              >
                {isPending ? "Validating..." : "Scan Serial"}
              </button>
            </div>

            {/* Quick Test Injections for Demonstration & Acceptance Testing */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                Simulator / Quick Test Scenarios:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleScan("SP-PAN-2026-0001")}
                  className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-lg text-[11px] font-mono font-semibold shadow-xs"
                >
                  ✓ Scan Valid Panel #1
                </button>
                <button
                  type="button"
                  onClick={() => handleScan("SP-INV-2026-0001")}
                  className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-lg text-[11px] font-mono font-semibold shadow-xs"
                >
                  ✓ Scan Valid Inverter
                </button>
                <button
                  type="button"
                  onClick={() => handleScan("SP-PAN-2026-0001")}
                  className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 rounded-lg text-[11px] font-mono font-semibold shadow-xs"
                >
                  ✗ Test Duplicate Scan (Rejection)
                </button>
                <button
                  type="button"
                  onClick={() => handleScan("UNKNOWN-SERIAL-9999")}
                  className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 rounded-lg text-[11px] font-mono font-semibold shadow-xs"
                >
                  ✗ Test Unknown Serial (Rejection)
                </button>
              </div>
            </div>

            {/* Scan Feedback Banner */}
            {scanResult && (
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
                  scanResult.ok
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-rose-50 border-rose-200 text-rose-800"
                }`}
              >
                <div className="flex items-center gap-2">
                  {scanResult.ok ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  )}
                  <div>
                    <span className="font-mono font-bold">{scanResult.serial}</span>:{" "}
                    <span className="font-semibold">{scanResult.message}</span>
                  </div>
                </div>
                <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-white/80">
                  {scanResult.result}
                </span>
              </div>
            )}
          </div>
        </GlassCard>
      )}

      {/* Main Grid: Required Items & Scanned Serials */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (6 cols): Required Pick-List BOM */}
        <div className="lg:col-span-6 space-y-4">
          <GlassCard className="p-5 space-y-3">
            <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <Layers className="w-4 h-4 text-amber-500" />
              <span>Required Equipment for Order</span>
            </h3>

            <div className="space-y-3">
              {[
                {
                  name: "SunPower 540W Mono PERC Solar Panel",
                  sku: "SP-PANEL-540W",
                  required: 6,
                  scanned: Math.min(6, dispatch.scanned_units.filter((u) => u.serial_no.includes("PAN")).length),
                  isSerial: true,
                },
                {
                  name: "SunPower 3.3 kW On-Grid String Inverter",
                  sku: "SP-INV-3KW-OG",
                  required: 1,
                  scanned: Math.min(1, dispatch.scanned_units.filter((u) => u.serial_no.includes("INV")).length),
                  isSerial: true,
                },
                {
                  name: "4 sq.mm Solar DC Cable",
                  sku: "SP-CABLE-DC-4MM",
                  required: 14,
                  scanned: 14,
                  isSerial: false,
                },
                {
                  name: "HDG Rooftop Mounting Structure Kit",
                  sku: "SP-STR-3KW-RCC",
                  required: 1,
                  scanned: 1,
                  isSerial: false,
                },
              ].map((item, idx) => {
                const complete = item.scanned >= item.required;

                return (
                  <div
                    key={idx}
                    className="p-3 bg-white/90 rounded-xl border border-slate-200/80 shadow-xs space-y-2 text-xs"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-semibold text-slate-900 block">{item.name}</span>
                        <span className="font-mono text-[10px] text-slate-400">{item.sku}</span>
                      </div>
                      <span
                        className={`font-mono font-bold text-xs px-2 py-0.5 rounded-full ${
                          complete
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {item.scanned} / {item.required}
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          complete ? "bg-emerald-500" : "bg-amber-500"
                        }`}
                        style={{
                          width: `${Math.min(100, (item.scanned / item.required) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </div>

        {/* Right Column (6 cols): Scanned Serial Units Ledger */}
        <div className="lg:col-span-6 space-y-4">
          <GlassCard className="p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Barcode className="w-4 h-4 text-emerald-600" />
                <span>Verified Scanned Serials</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-500 font-bold">
                {dispatch.scanned_units.length} Units Loaded
              </span>
            </div>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {dispatch.scanned_units.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs italic">
                  No serial units scanned yet. Use the scanner above to load equipment.
                </div>
              ) : (
                dispatch.scanned_units.map((unit, idx) => (
                  <div
                    key={unit.id || idx}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs hover:bg-amber-50/30 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">{unit.serial_no}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-medium">
                          Linked to Client
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 mt-0.5 block">
                        {unit.product_name}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-mono">
                        {formatTimeAgo(unit.scanned_at)}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-semibold">✓ Verified</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Confirm Delivery Modal */}
      {showDeliveryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Confirm Rooftop Delivery (REQ-INV-10)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Automatically initializes assets and starts warranty clocks
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDeliveryModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmDelivery} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Recipient Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-800 space-y-1">
                <span className="font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Golden Automation A10 Effect:</span>
                </span>
                <p>
                  • Solar Panels: 20-Year (240 Mo.) warranty clock initialized
                </p>
                <p>
                  • Inverter & Batteries: 2-Year (24 Mo.) warranty clock initialized
                </p>
                <p>• Serial units mapped to {recipientName}&apos;s customer profile</p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDeliveryModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20 disabled:opacity-50"
                >
                  {isPending ? "Confirming..." : "Confirm Delivery & Start Warranties"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
