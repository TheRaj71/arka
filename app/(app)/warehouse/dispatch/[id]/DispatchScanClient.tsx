"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusPill } from "@/components/shared/StatusPill";
import { ScanInput } from "@/components/ui/ScanInput";
import { DigitalTwinCard } from "@/components/3d/DigitalTwinCard";
import { formatDateIST, formatDateTimeIST } from "@/lib/formatters";
import {
  scanDispatchUnit,
  finalizeDispatch,
  confirmDelivery,
} from "@/modules/inventory/actions";
import { type DispatchItem } from "@/modules/inventory/queries";
import {
  ArrowLeft,
  Truck,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Package,
  Layers,
  MapPin,
  Clock,
  ExternalLink,
} from "lucide-react";

interface DispatchScanClientProps {
  dispatch: DispatchItem;
}

export function DispatchScanClient({ dispatch: initialDispatch }: DispatchScanClientProps) {
  const router = useRouter();
  const [dispatch, setDispatch] = useState<DispatchItem>(initialDispatch);
  const [isPending, startTransition] = useTransition();

  // Scan result state
  const [lastScannedSerial, setLastScannedSerial] = useState<string | null>(
    dispatch.scanned_units[0]?.serial_no || null
  );
  const [lastScannedType, setLastScannedType] = useState<"inverter" | "panel" | "battery">(
    dispatch.scanned_units[0]?.serial_no?.includes("INV") ? "inverter" : "panel"
  );
  const [scanFeedback, setScanFeedback] = useState<{
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

  const handleScanAction = async (rawSerial: string) => {
    const raw = rawSerial.trim().toUpperCase();
    if (!raw) return;
    setScanFeedback(null);

    startTransition(async () => {
      const res = await scanDispatchUnit({
        dispatch_id: dispatch.id,
        raw_serial: raw,
        method: "camera",
      });

      if (!res.ok) {
        setScanFeedback({
          ok: false,
          result: res.error.code,
          serial: raw,
          message: res.error.message,
        });
        return;
      }

      const unitType = raw.includes("INV") ? "inverter" : raw.includes("BAT") ? "battery" : "panel";
      setLastScannedSerial(res.data.serial);
      setLastScannedType(unitType);

      setScanFeedback({
        ok: res.data.ok,
        result: res.data.result,
        serial: res.data.serial,
        message: res.data.message,
      });

      if (res.data.ok) {
        setDispatch((prev) => ({
          ...prev,
          status: "loading",
          scanned_units: [
            {
              id: Math.random().toString(),
              serial_no: res.data.serial,
              product_name: raw.includes("INV") ? "SunPower 3.3 kW Inverter" : "SunPower 540W Mono PERC Panel",
              scanned_at: new Date().toISOString(),
            },
            ...prev.scanned_units,
          ],
        }));
      }
    });
  };

  const handleFinalizeDispatch = async () => {
    startTransition(async () => {
      const res = await finalizeDispatch({ dispatch_id: dispatch.id });
      if (res.ok) {
        setDispatch((prev) => ({
          ...prev,
          status: "in_transit",
          departed_at: new Date().toISOString(),
        }));
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
        setDispatch((prev) => ({
          ...prev,
          status: "delivered",
          delivered_at: new Date().toISOString(),
        }));
        setShowDeliveryModal(false);
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: "Warehouse", href: "/warehouse" },
          { label: dispatch.dispatch_no || "DSP-2627-00001" },
        ]}
        title={
          <div className="flex items-center gap-3">
            <span className="font-mono">{dispatch.dispatch_no}</span>
            <StatusPill status={dispatch.status} domain="inventory" />
          </div>
        }
        description={
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-body-sm text-text-secondary mt-1">
            <span>
              Customer: <strong className="text-text-primary font-semibold">{dispatch.order?.delivery_name}</strong>
            </span>
            <span>•</span>
            <span>
              Order: <span className="font-mono">{dispatch.order?.order_no || "ORD-2026-0042"}</span>
            </span>
            <span>•</span>
            <span>
              Vehicle: <span className="font-mono font-medium text-text-primary">{dispatch.vehicle || "PB-08-AX-4821"}</span>
            </span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            {isLoading && (
              <button
                onClick={handleFinalizeDispatch}
                disabled={isPending || dispatch.scanned_units.length === 0}
                className="inline-flex items-center gap-2 h-11 px-5 rounded-[var(--radius-control)] bg-[var(--accent-base)] hover:bg-[var(--accent-hover)] text-white font-medium text-body transition-colors disabled:opacity-50"
              >
                <Truck className="w-4 h-4" />
                <span>Finalize Dispatch & Depart Vehicle</span>
              </button>
            )}

            {isInTransit && (
              <button
                onClick={() => setShowDeliveryModal(true)}
                className="inline-flex items-center gap-2 h-11 px-5 rounded-[var(--radius-control)] bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-body transition-colors"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Confirm Delivery at Site</span>
              </button>
            )}

            {isDelivered && (
              <div className="inline-flex items-center gap-2 h-11 px-4 rounded-[var(--radius-control)] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 font-medium text-body-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Delivered & Warranties Running</span>
              </div>
            )}
          </div>
        }
      />

      {/* Automation A10 Banner: Asset records & warranties active */}
      {isDelivered && (
        <div className="rounded-[var(--radius-card)] bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-[var(--radius-control)] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-heading font-semibold text-emerald-900 dark:text-emerald-100">
                  Automation A10 Cleared: Asset Passports Created & Warranties Running
                </h3>
                <p className="text-body-sm text-emerald-700 dark:text-emerald-300/90 mt-0.5">
                  Each scanned serial unit is linked to {dispatch.order?.delivery_name}&apos;s customer asset registry.
                </p>
              </div>
            </div>
            <Link
              href="/service"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[var(--radius-control)] bg-white dark:bg-stone-900 text-emerald-900 dark:text-emerald-100 border border-emerald-200 dark:border-emerald-700 text-body-sm font-medium hover:bg-emerald-50 transition-colors shadow-xs"
            >
              <span>Test Service Desk Lookup</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 text-body-sm border-t border-emerald-200/60 dark:border-emerald-800/40">
            <div>
              <span className="text-caption text-emerald-700 dark:text-emerald-400 block">Panels Warranty</span>
              <span className="font-semibold text-emerald-900 dark:text-emerald-100">20 Years (240 Mo.)</span>
            </div>
            <div>
              <span className="text-caption text-emerald-700 dark:text-emerald-400 block">Inverter Warranty</span>
              <span className="font-semibold text-emerald-900 dark:text-emerald-100">2 Years (24 Mo.)</span>
            </div>
            <div>
              <span className="text-caption text-emerald-700 dark:text-emerald-400 block">Start Date</span>
              <span className="font-mono font-semibold text-emerald-900 dark:text-emerald-100">Today (IST)</span>
            </div>
            <div>
              <span className="text-caption text-emerald-700 dark:text-emerald-400 block">Assets Registered</span>
              <span className="font-mono font-semibold text-emerald-900 dark:text-emerald-100">{dispatch.scanned_units.length} Serial Units</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Scan Bar (When Loading / Dispatch Station) */}
      {isLoading && (
        <div className="rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-subtle)] p-6 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[var(--border-subtle)] gap-2">
            <div>
              <h3 className="text-heading font-semibold text-text-primary">
                Barcode & QR Scan Station
              </h3>
              <p className="text-body-sm text-text-secondary mt-0.5">
                Scan panel frame or inverter chassis barcode before loading into vehicle.
              </p>
            </div>
            <span className="font-mono text-label text-[var(--accent-base)] bg-[var(--accent-subtle)] px-3 py-1 rounded-[var(--radius-control)] border border-[var(--border-subtle)] self-start sm:self-auto">
              Hardware Scan Mode
            </span>
          </div>

          {/* Industrial Scan Input */}
          <ScanInput
            onScan={handleScanAction}
            placeholder="Scan barcode or type serial (e.g. SP-PAN-2026-0001)..."
            disabled={isPending}
          />

          {/* Quick Test Simulator Chips */}
          <div className="p-3.5 rounded-[var(--radius-control)] bg-[var(--surface-subtle)] border border-[var(--border-subtle)] space-y-2">
            <span className="text-label text-text-tertiary block">
              Automated Quick Test Scenarios (Acceptance Testing):
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleScanAction("SP-PAN-2026-0001")}
                className="h-8 px-3 rounded-[var(--radius-control)] bg-[var(--surface-card)] hover:bg-[var(--border-subtle)] text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 text-body-sm font-mono font-medium transition-colors"
              >
                + Scan Panel #1
              </button>
              <button
                type="button"
                onClick={() => handleScanAction("SP-PAN-2026-0002")}
                className="h-8 px-3 rounded-[var(--radius-control)] bg-[var(--surface-card)] hover:bg-[var(--border-subtle)] text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 text-body-sm font-mono font-medium transition-colors"
              >
                + Scan Panel #2
              </button>
              <button
                type="button"
                onClick={() => handleScanAction("SP-INV-2026-0001")}
                className="h-8 px-3 rounded-[var(--radius-control)] bg-[var(--surface-card)] hover:bg-[var(--border-subtle)] text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 text-body-sm font-mono font-medium transition-colors"
              >
                + Scan Inverter
              </button>
              <button
                type="button"
                onClick={() => handleScanAction("SP-PAN-2026-0001")}
                className="h-8 px-3 rounded-[var(--radius-control)] bg-[var(--surface-card)] hover:bg-[var(--border-subtle)] text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800 text-body-sm font-mono font-medium transition-colors"
              >
                ! Test Duplicate Scan
              </button>
              <button
                type="button"
                onClick={() => handleScanAction("UNKNOWN-9999")}
                className="h-8 px-3 rounded-[var(--radius-control)] bg-[var(--surface-card)] hover:bg-[var(--border-subtle)] text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800 text-body-sm font-mono font-medium transition-colors"
              >
                ! Test Unknown Serial
              </button>
            </div>
          </div>

          {/* Scan Feedback Banner */}
          {scanFeedback && (
            <div
              className={`p-3.5 rounded-[var(--radius-control)] border text-body-sm flex items-center justify-between ${
                scanFeedback.ok
                  ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
                  : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200"
              }`}
            >
              <div className="flex items-center gap-2">
                {scanFeedback.ok ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                )}
                <div>
                  <span className="font-mono font-semibold">{scanFeedback.serial}</span>:{" "}
                  <span>{scanFeedback.message}</span>
                </div>
              </div>
              <span className="font-mono text-label uppercase px-2 py-0.5 rounded bg-[var(--surface-card)] border border-[var(--border-subtle)]">
                {scanFeedback.result}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Main Grid: Required Equipment & Scanned Serials */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (6 cols): Required Pick-List BOM */}
        <div className="lg:col-span-6 space-y-4">
          <div className="rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-subtle)] p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <h3 className="text-heading font-semibold text-text-primary flex items-center gap-2">
                <Layers className="w-4 h-4 text-text-secondary" />
                <span>Required Equipment for Order</span>
              </h3>
              <span className="text-caption text-text-secondary">Order BOM Spec</span>
            </div>

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
                    className="p-3.5 rounded-[var(--radius-control)] bg-[var(--surface-subtle)] border border-[var(--border-subtle)] space-y-2.5"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-medium text-text-primary text-body-sm block">{item.name}</span>
                        <span className="font-mono text-caption text-text-tertiary">{item.sku}</span>
                      </div>
                      <span
                        className={`font-mono font-semibold text-body-sm px-2.5 py-0.5 rounded-[var(--radius-control)] border ${
                          complete
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                            : "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-800"
                        }`}
                      >
                        {item.scanned} / {item.required}
                      </span>
                    </div>

                    <div className="w-full bg-[var(--border-subtle)] h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          complete ? "bg-emerald-600" : "bg-amber-600"
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
          </div>

          {/* Interactive Digital Twin of Scanned Asset */}
          {lastScannedSerial && (
            <div className="space-y-2">
              <span className="text-label text-text-secondary block px-1">
                Hardware Asset Passport (Last Scanned):
              </span>
              <DigitalTwinCard
                serialNo={lastScannedSerial}
                productName={
                  lastScannedType === "inverter"
                    ? "SunPower 3.3 kW On-Grid Inverter"
                    : "SunPower 540W Mono PERC Panel"
                }
                assetType={lastScannedType}
                customerName={dispatch.order?.delivery_name || "Anita Sharma"}
                installDate={formatDateIST(new Date().toISOString())}
                warrantyMonthsTotal={lastScannedType === "panel" ? 240 : 24}
                warrantyMonthsRemaining={lastScannedType === "panel" ? 240 : 24}
              />
            </div>
          )}
        </div>

        {/* Right Column (6 cols): Scanned Serial Units Ledger */}
        <div className="lg:col-span-6 space-y-4">
          <div className="rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-subtle)] p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <div>
                <h3 className="text-heading font-semibold text-text-primary">
                  Verified Scanned Serials
                </h3>
                <p className="text-caption text-text-secondary">
                  Audited hardware barcodes loaded onto vehicle
                </p>
              </div>
              <span className="font-mono text-body-sm font-semibold text-text-primary px-2.5 py-1 rounded-[var(--radius-control)] bg-[var(--surface-subtle)] border border-[var(--border-subtle)]">
                {dispatch.scanned_units.length} Units
              </span>
            </div>

            {dispatch.scanned_units.length === 0 ? (
              <div className="py-12 text-center text-body-sm text-text-secondary">
                No serialized equipment scanned yet. Use barcode scanner above.
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {dispatch.scanned_units.map((unit, idx) => (
                  <div
                    key={unit.id || idx}
                    onClick={() => {
                      setLastScannedSerial(unit.serial_no);
                      setLastScannedType(unit.serial_no.includes("INV") ? "inverter" : "panel");
                    }}
                    className={`p-3.5 rounded-[var(--radius-control)] border transition-all cursor-pointer flex items-center justify-between ${
                      lastScannedSerial === unit.serial_no
                        ? "bg-[var(--accent-subtle)] border-[var(--accent-base)] shadow-xs"
                        : "bg-[var(--surface-subtle)] border-[var(--border-subtle)] hover:border-[var(--border-strong)]"
                    }`}
                  >
                    <div>
                      <div className="font-mono font-semibold text-text-primary text-body-sm">
                        {unit.serial_no}
                      </div>
                      <div className="text-caption text-text-secondary mt-0.5">
                        {unit.product_name}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-mono text-caption text-text-tertiary block">
                        {unit.scanned_at ? formatDateTimeIST(unit.scanned_at) : "Today"}
                      </span>
                      <span className="font-mono text-caption text-emerald-700 dark:text-emerald-400 font-medium">
                        Verified
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delivery Confirmation Sign-off Modal */}
      {showDeliveryModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-subtle)] p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <h3 className="text-title font-semibold text-text-primary">
                Confirm Delivery at Customer Site
              </h3>
              <button
                type="button"
                onClick={() => setShowDeliveryModal(false)}
                className="text-text-tertiary hover:text-text-primary text-body font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmDelivery} className="space-y-4">
              <p className="text-body-sm text-text-secondary">
                Confirming delivery certifies that physical hardware has arrived safely at site.
                This automatically triggers <strong>Automation A10</strong>: customer asset passports are generated, and warranty clocks (20y panels, 2y inverter) begin running immediately.
              </p>

              <div>
                <label className="block text-label text-text-primary mb-1.5 font-medium">
                  Site Receiving Representative Name
                </label>
                <input
                  type="text"
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-[var(--radius-control)] border border-[var(--border-strong)] bg-[var(--surface-card)] text-text-primary text-body focus:outline-none focus:ring-2 focus:ring-[var(--accent-base)]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setShowDeliveryModal(false)}
                  className="h-11 px-4 rounded-[var(--radius-control)] border border-[var(--border-subtle)] text-text-secondary hover:text-text-primary text-body-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="h-11 px-5 rounded-[var(--radius-control)] bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-body transition-colors disabled:opacity-50"
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
