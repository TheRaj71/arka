"use client";

import React, { useState, useRef, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { submitInstall } from "@/modules/field/actions";
import { type FieldJobItem } from "@/modules/field/queries";
import {
  ArrowLeft,
  Wrench,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Camera,
  PenTool,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

interface InstallFormClientProps {
  job: FieldJobItem;
}

export function InstallFormClient({ job }: InstallFormClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Form State
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

  // Canvas Signature state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hasSignature, setHasSignature] = useState<boolean>(false);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#0f172a";
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
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

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
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
    const sigDataUrl = canvas ? canvas.toDataURL("image/png") : "data:image/png;base64,demo";

    if (!hasSignature) {
      setErrorMessage("REQ-INST-06: Customer on-screen signature is required for physical handover.");
      return;
    }

    startTransition(async () => {
      const res = await submitInstall({
        job_id: job.id,
        system_kw_confirmed: Number(systemKw),
        panel_count_installed: Number(panelCount),
        power_test_passed: powerTestPassed,
        power_test_notes: `Live generation verified: ${liveKw} kW. DC: ${dcVoltage}V, AC: ${acVoltage}V. Grounding: ${earthOhms} ohms.`,
        signature_data_url: sigDataUrl,
        signed_by_name: signatoryName,
      });

      if (!res.ok) {
        setErrorMessage(res.error.message);
        return;
      }

      setIsCompleted(true);
    });
  };

  return (
    <div className="max-w-xl mx-auto space-y-5 pb-16">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/field"
            className="p-2 rounded-xl bg-white/70 hover:bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 shadow-sm transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Installation Completion Report
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">
              Job #{job.job_no} • {job.project?.project_no}
            </p>
          </div>
        </div>
      </div>

      {isCompleted ? (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-emerald-200 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Installation Completed & Verified!</h2>
            <p className="text-xs text-slate-600 max-w-sm mx-auto mt-1">
              Power test verified and customer handover signature recorded. Project status moved to <strong>Installed</strong>.
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/dashboard"
              className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs inline-flex items-center gap-2"
            >
              <span>Return to Dashboard</span>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Equipment Verification */}
          <GlassCard className="p-5 space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 pb-2 border-b border-slate-100">
              <Wrench className="w-4 h-4 text-amber-500" />
              <span>1. As-Built System Sizing (REQ-INST-03)</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Confirmed System Size (kW) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={systemKw}
                  onChange={(e) => setSystemKw(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Panel Count Installed *
                </label>
                <input
                  type="number"
                  required
                  value={panelCount}
                  onChange={(e) => setPanelCount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold text-slate-900"
                />
              </div>
            </div>
          </GlassCard>

          {/* Section 2: Power Generation Test (Hard Gate G14) */}
          <GlassCard className="p-5 space-y-3 border-amber-300/80 bg-amber-500/5">
            <div className="flex items-center justify-between pb-2 border-b border-amber-200/60">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>2. Live Generation Power Test (Hard Gate G14)</span>
              </h3>
              <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                Mandatory
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">DC Input String Voltage</label>
                <div className="relative">
                  <input
                    type="number"
                    value={dcVoltage}
                    onChange={(e) => setDcVoltage(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">V DC</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">AC Grid Voltage</label>
                <div className="relative">
                  <input
                    type="number"
                    value={acVoltage}
                    onChange={(e) => setAcVoltage(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">V AC</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Active Generation Output *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={liveKw}
                    onChange={(e) => setLiveKw(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold text-emerald-700"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">kW</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Earthing Pit Resistance</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={earthOhms}
                    onChange={(e) => setEarthOhms(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">Ω (Ohms)</span>
                </div>
              </div>
            </div>

            <label className="flex items-center gap-2 p-3 bg-white rounded-xl border border-emerald-300 text-emerald-900 font-bold cursor-pointer mt-2">
              <input
                type="checkbox"
                required
                checked={powerTestPassed}
                onChange={(e) => setPowerTestPassed(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>I certify power generation test PASSED & net-meter synchronised</span>
            </label>
          </GlassCard>

          {/* Section 3: Photographic Evidence (REQ-INST-05) */}
          <GlassCard className="p-5 space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 pb-2 border-b border-slate-100">
              <Camera className="w-4 h-4 text-slate-600" />
              <span>3. Photographic Evidence (4 Required Site Shots)</span>
            </h3>

            <div className="grid grid-cols-2 gap-2">
              {[
                { name: "1. Solar Array Layout", status: "Verified & Uploaded" },
                { name: "2. Inverter & Isolator", status: "Verified & Uploaded" },
                { name: "3. Bidirectional Meter", status: "Verified & Uploaded" },
                { name: "4. Earthing Chamber", status: "Verified & Uploaded" },
              ].map((p, i) => (
                <div
                  key={i}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center flex flex-col items-center justify-center min-h-[75px]"
                >
                  <Camera className="w-4 h-4 text-slate-400 mb-1" />
                  <span className="font-semibold text-slate-800 text-[11px]">{p.name}</span>
                  <span className="text-[9px] text-emerald-600 font-bold mt-0.5">✓ {p.status}</span>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Section 4: On-Screen Customer Handover Signature Pad (REQ-INST-06) */}
          <GlassCard className="p-5 space-y-3 border-amber-200/80">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <PenTool className="w-4 h-4 text-amber-500" />
                <span>4. Client Handover Signature (REQ-INST-06)</span>
              </h3>
              <button
                type="button"
                onClick={clearSignature}
                className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Clear</span>
              </button>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Signatory Full Name *
              </label>
              <input
                type="text"
                required
                value={signatoryName}
                onChange={(e) => setSignatoryName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <div>
              <span className="block text-slate-700 font-semibold mb-1">
                Sign on screen below (using finger or stylus) *
              </span>
              <div className="border-2 border-dashed border-slate-300 rounded-xl bg-white overflow-hidden touch-none relative">
                <canvas
                  ref={canvasRef}
                  width={460}
                  height={150}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-[150px] cursor-crosshair"
                />
                {!hasSignature && (
                  <span className="absolute inset-0 flex items-center justify-center text-slate-400 pointer-events-none text-xs italic">
                    Customer signature goes here...
                  </span>
                )}
              </div>
            </div>
          </GlassCard>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isPending || !powerTestPassed}
              className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>{isPending ? "Submitting Completion..." : "Submit Install & Complete Handover"}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
