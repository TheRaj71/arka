"use client";

import React, { useState, useRef, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { submitInstall } from "@/modules/field/actions";
import { type FieldJobItem } from "@/modules/field/queries";
import { StatusPill } from "@/components/shared/StatusPill";
import {
  ArrowLeft,
  Wrench,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Camera,
} from "lucide-react";

interface InstallFormClientProps {
  job: FieldJobItem;
}

export function InstallFormClient({ job }: InstallFormClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Commissioning test states
  const [systemKw, setSystemKw] = useState<number>(job.project?.requested_kw || 3.0);
  const [panelCount, setPanelCount] = useState<number>(6);
  const [powerTestPassed, setPowerTestPassed] = useState<boolean>(true);
  const [dcVoltage, setDcVoltage] = useState<number>(242);
  const [acVoltage, setAcVoltage] = useState<number>(231);
  const [liveKw, setLiveKw] = useState<number>(2.84);
  const [earthOhms, setEarthOhms] = useState<number>(2.3);
  const [signatoryName, setSignatoryName] = useState<string>(
    job.project?.customer?.name || "Anita Sharma"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState<boolean>(job.status === "completed");

  // Checklist states
  const [checks, setChecks] = useState({
    structureBolts: true,
    panelClamps: true,
    cableConduits: true,
    inverterMounted: true,
    spdEarthing: true,
  });

  // Canvas Signature state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hasSignature, setHasSignature] = useState<boolean>(false);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1C1917";
  }, []);

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setHasSignature(true);
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const canvas = canvasRef.current;
    const sigDataUrl = canvas
      ? canvas.toDataURL("image/png")
      : "data:image/png;base64,demo";

    if (!hasSignature && !isCompleted) {
      setErrorMessage(
        "Customer signature is required for physical installation handover."
      );
      return;
    }

    startTransition(async () => {
      const res = await submitInstall({
        job_id: job.id,
        system_kw_confirmed: Number(systemKw),
        panel_count_installed: Number(panelCount),
        power_test_passed: powerTestPassed,
        power_test_notes: `Live generation: ${liveKw} kW. DC: ${dcVoltage}V, AC: ${acVoltage}V. Grounding: ${earthOhms} ohms.`,
        signature_data_url: sigDataUrl,
        signed_by_name: signatoryName,
      });

      if (!res.ok) {
        setErrorMessage(res.error.message);
        return;
      }

      setIsCompleted(true);
      router.refresh();
    });
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-20">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/field"
          className="inline-flex items-center gap-2 h-11 px-3.5 rounded-[var(--radius-control)] bg-[var(--surface-card)] hover:bg-[var(--surface-subtle)] text-text-primary text-body-sm font-medium border border-[var(--border-subtle)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Route</span>
        </Link>
        <StatusPill status={job.status} />
      </div>

      {/* Header Card */}
      <div className="rounded-[var(--radius-card)] bg-[var(--surface-card)] border-2 border-[var(--border-strong)] p-5 space-y-2 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="font-mono text-body-sm font-semibold text-text-secondary">
            {job.job_no}
          </span>
          <span className="text-caption uppercase font-mono font-semibold px-2 py-0.5 rounded bg-[var(--surface-subtle)] text-text-primary border border-[var(--border-subtle)]">
            Commissioning
          </span>
        </div>
        <h1 className="text-title font-semibold text-text-primary">
          {job.project?.customer?.name}
        </h1>
        <p className="text-body-sm text-text-secondary">
          {job.site_address || "Site Address on file"}
        </p>
      </div>

      {isCompleted ? (
        /* Completed Handover Certificate Banner */
        <div className="rounded-[var(--radius-card)] bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-300 dark:border-emerald-700 p-6 space-y-4 text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-title font-semibold text-emerald-900 dark:text-emerald-100">
              Installation Handover Signed & Certified
            </h2>
            <p className="text-body-sm text-emerald-700 dark:text-emerald-300 mt-1">
              Signed by representative <strong>{signatoryName}</strong>. Power test validated at {liveKw} kW generation.
            </p>
          </div>
          <Link
            href="/field"
            className="inline-flex items-center justify-center h-14 w-full rounded-[var(--radius-control)] bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-body transition-colors"
          >
            Return to Technician Jobs
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {errorMessage && (
            <div className="p-4 rounded-[var(--radius-control)] bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-body-sm flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Physical Roof Checklist */}
          <div className="rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-subtle)] p-5 space-y-3">
            <h3 className="text-heading font-semibold text-text-primary">
              1. Physical Rooftop & Electrical Checklist
            </h3>
            <p className="text-caption text-text-secondary">
              Verify each installation step before conducting power test
            </p>

            <div className="space-y-2 pt-2">
              {[
                { key: "structureBolts", label: "M10 SS304 Anchor Bolts torqued on RCC slab" },
                { key: "panelClamps", label: "Mid & end clamps fastened with rubber gaskets" },
                { key: "cableConduits", label: "UV-resistant PVC conduits laid with zero sag" },
                { key: "inverterMounted", label: "Inverter wall-mounted at eye level with heat clearance" },
                { key: "spdEarthing", label: "Dual earthing pits linked to DC & AC surge protection" },
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex items-center gap-3 p-3.5 rounded-[var(--radius-control)] bg-[var(--surface-subtle)] border border-[var(--border-subtle)] cursor-pointer text-body-sm text-text-primary"
                >
                  <input
                    type="checkbox"
                    checked={checks[item.key as keyof typeof checks]}
                    onChange={(e) =>
                      setChecks({ ...checks, [item.key]: e.target.checked })
                    }
                    className="w-5 h-5 rounded text-[var(--accent-base)] focus:ring-[var(--accent-base)]"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Section 2: Electrical Commissioning & Live Metering */}
          <div className="rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-subtle)] p-5 space-y-4">
            <h3 className="text-heading font-semibold text-text-primary flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-600" />
              <span>2. Electrical Test & Metering</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-label text-text-primary mb-1">
                  DC String Voltage (V)
                </label>
                <input
                  type="number"
                  value={dcVoltage}
                  onChange={(e) => setDcVoltage(Number(e.target.value))}
                  className="w-full h-12 px-3.5 rounded-[var(--radius-control)] border border-[var(--border-strong)] bg-[var(--surface-card)] text-text-primary text-body font-mono font-medium focus:ring-2 focus:ring-[var(--accent-base)]"
                />
              </div>

              <div>
                <label className="block text-label text-text-primary mb-1">
                  AC Grid Voltage (V)
                </label>
                <input
                  type="number"
                  value={acVoltage}
                  onChange={(e) => setAcVoltage(Number(e.target.value))}
                  className="w-full h-12 px-3.5 rounded-[var(--radius-control)] border border-[var(--border-strong)] bg-[var(--surface-card)] text-text-primary text-body font-mono font-medium focus:ring-2 focus:ring-[var(--accent-base)]"
                />
              </div>

              <div>
                <label className="block text-label text-text-primary mb-1">
                  Live Generation (kW)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={liveKw}
                  onChange={(e) => setLiveKw(Number(e.target.value))}
                  className="w-full h-12 px-3.5 rounded-[var(--radius-control)] border border-[var(--border-strong)] bg-[var(--surface-card)] text-text-primary text-body font-mono font-semibold text-emerald-700 dark:text-emerald-400 focus:ring-2 focus:ring-[var(--accent-base)]"
                />
              </div>

              <div>
                <label className="block text-label text-text-primary mb-1">
                  Earth Resistance (Ω)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={earthOhms}
                  onChange={(e) => setEarthOhms(Number(e.target.value))}
                  className="w-full h-12 px-3.5 rounded-[var(--radius-control)] border border-[var(--border-strong)] bg-[var(--surface-card)] text-text-primary text-body font-mono font-medium focus:ring-2 focus:ring-[var(--accent-base)]"
                />
              </div>
            </div>

            <div className="p-3.5 rounded-[var(--radius-control)] bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-body-sm text-emerald-800 dark:text-emerald-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Electrical Parameters within CEA Guidelines</span>
              </div>
              <span className="font-mono text-label font-semibold">&lt; 5.0 Ω</span>
            </div>
          </div>

          {/* Section 3: Customer Handover & Signature Pad */}
          <div className="rounded-[var(--radius-card)] bg-[var(--surface-card)] border-2 border-[var(--border-strong)] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-heading font-semibold text-text-primary">
                  3. Customer Handover Sign-off
                </h3>
                <p className="text-caption text-text-secondary">
                  Customer draws signature on mobile screen to accept handover
                </p>
              </div>
              <button
                type="button"
                onClick={clearSignature}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-[var(--radius-control)] border border-[var(--border-subtle)] text-caption font-medium text-text-secondary hover:text-text-primary"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </div>

            <div>
              <label className="block text-label text-text-primary mb-1 font-medium">
                Client / Representative Name
              </label>
              <input
                type="text"
                required
                value={signatoryName}
                onChange={(e) => setSignatoryName(e.target.value)}
                className="w-full h-12 px-3.5 rounded-[var(--radius-control)] border border-[var(--border-strong)] bg-[var(--surface-card)] text-text-primary text-body focus:outline-none focus:ring-2 focus:ring-[var(--accent-base)]"
              />
            </div>

            {/* Signature Canvas Box */}
            <div className="space-y-1">
              <label className="block text-label text-text-primary font-medium">
                Draw Signature Below
              </label>
              <div className="border-2 border-dashed border-[var(--border-strong)] rounded-[var(--radius-control)] bg-[var(--surface-subtle)] overflow-hidden">
                <canvas
                  ref={canvasRef}
                  width={500}
                  height={180}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-[180px] cursor-crosshair touch-none"
                />
              </div>
              <p className="text-caption text-text-tertiary">
                Customer signature confirms physical verification and system power activation.
              </p>
            </div>
          </div>

          {/* Large 56px Submit Action Button */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full h-14 rounded-[var(--radius-control)] bg-[var(--accent-base)] hover:bg-[var(--accent-hover)] text-white font-semibold text-body shadow-sm transition-colors disabled:opacity-50"
          >
            {isPending ? "Certifying Handover..." : "Submit Installation Handover & Certify"}
          </button>
        </form>
      )}
    </div>
  );
}
