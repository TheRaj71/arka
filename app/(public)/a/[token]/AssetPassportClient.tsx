"use client";

import React, { useState, useTransition } from "react";
import { formatMoney } from "@/lib/money";
import {
  Sun,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Phone,
  Barcode,
  Calendar,
  Send,
  Wrench,
} from "lucide-react";

interface AssetPassportClientProps {
  serialNo?: string;
  customerName?: string;
  productName?: string;
  installedDate?: string;
  warrantyEnd?: string;
}

export function AssetPassportClient({
  serialNo = "SP-INV-2026-0001",
  customerName = "Anita Sharma",
  productName = "SunPower 3.3 kW Single Phase Inverter",
  installedDate = "21 Nov 2026",
  warrantyEnd = "21 Nov 2028",
}: AssetPassportClientProps) {
  const [reported, setReported] = useState(false);
  const [symptom, setSymptom] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleReport = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(() => {
      setReported(true);
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-500/10 via-slate-50 to-amber-500/5 py-12 px-4 sm:px-6">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Brand Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
              <Sun className="w-6 h-6" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-slate-900 block leading-tight">
                SunPower Solutions
              </span>
              <span className="text-[11px] text-slate-500">Official Solar Asset Passport</span>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
            Verified Hardware
          </span>
        </div>

        {/* Asset Identity Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 block">
                Equipment Passport
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-0.5">{productName}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Barcode className="w-4 h-4 text-slate-400" />
                <span className="font-mono text-xs font-bold text-slate-700">{serialNo}</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/15 border border-emerald-300 text-xs space-y-2">
            <div className="flex items-center justify-between font-bold text-emerald-900">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Warranty Status: Active</span>
              </span>
              <span className="text-emerald-700 text-[11px]">Free Service Eligible</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-emerald-800 pt-1">
              <div>
                <span className="text-slate-500 block text-[10px]">Commissioned Date:</span>
                <span className="font-semibold text-slate-900">{installedDate}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Warranty Valid Till:</span>
                <span className="font-semibold text-emerald-700">{warrantyEnd}</span>
              </div>
            </div>
          </div>

          <div className="pt-2 text-xs text-slate-600 border-t border-slate-100 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Registered Owner:</span>
              <span className="font-semibold text-slate-900">{customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Certified Installer:</span>
              <span className="font-semibold text-slate-900">SunPower Solutions, Pune</span>
            </div>
          </div>
        </div>

        {/* Report Fault Form */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Wrench className="w-4 h-4 text-amber-500" />
            <span>Need Assistance? Report an Issue</span>
          </h3>

          {reported ? (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h4 className="font-bold text-sm text-slate-900">Service Request Dispatched!</h4>
              <p className="text-xs text-slate-600">
                Ticket #TKT-2627-00003 registered. A SunPower technician will reach out within 2 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleReport} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Describe what you are seeing *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Inverter displaying error code, zero daily generation units, etc."
                  value={symptom}
                  onChange={(e) => setSymptom(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={isPending || !symptom.trim()}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isPending ? "Submitting..." : "Submit Service Request"}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
