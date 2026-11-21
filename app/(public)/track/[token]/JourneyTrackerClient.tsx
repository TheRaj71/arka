"use client";

import React from "react";
import {
  Sun,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Phone,
  Truck,
  Wrench,
  Zap,
} from "lucide-react";

interface JourneyTrackerClientProps {
  customerName?: string;
  projectNo?: string;
  systemKw?: number;
  stage?: string;
}

export function JourneyTrackerClient({
  customerName = "Anita Sharma",
  projectNo = "PRJ-2627-00001",
  systemKw = 3.0,
  stage = "installed",
}: JourneyTrackerClientProps) {
  const steps = [
    { title: "1. Solar Inquiry & Call Qualification", desc: "Rooftop shadow analysis & PM Surya Ghar eligibility verified.", status: "completed" },
    { title: "2. Technical Site Survey & Engineering Sign-Off", desc: "True south orientation, 20° tilt, 14m DC cable run approved.", status: "completed" },
    { title: "3. Proposal & PM Surya Ghar Subsidy Lock", desc: "Fixed BOM price locked. ₹78,000 central subsidy reserved.", status: "completed" },
    { title: "4. Serialized Equipment Dispatch", desc: "6x Panels & 3.3 kW Inverter QR scanned & delivered to rooftop.", status: "completed" },
    { title: "5. Installation & Live Generation Test", desc: "2.84 kW live generation verified. Customer handover signed.", status: "completed" },
    { title: "6. DISCOM Net-Meter & 20-Year Warranty Clock", desc: "Bi-directional net meter synchronized. Warranty clock active.", status: "completed" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-500/10 via-slate-50 to-amber-500/5 py-12 px-4 sm:px-6">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Brand Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
              <Sun className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-slate-900 block leading-tight">
                SunPower Solutions
              </span>
              <span className="text-[11px] text-slate-500">Live Solar Journey Tracker</span>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            {systemKw} kW On-Grid
          </span>
        </div>

        {/* Project Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-2">
          <span className="text-[10px] uppercase font-bold tracking-wider text-amber-600 block">
            Client Journey
          </span>
          <h2 className="text-xl font-bold text-slate-900">{customerName}</h2>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
            <span>Project: {projectNo}</span>
            <span>•</span>
            <span className="text-emerald-700 font-bold">100% Milestone Progress</span>
          </div>
        </div>

        {/* 6-Step Visual Journey */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 pb-2 border-b border-slate-100">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Milestone Progress to Green Energy</span>
          </h3>

          <div className="space-y-4 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-emerald-300">
            {steps.map((step, idx) => (
              <div key={idx} className="relative pl-7 text-xs space-y-0.5">
                <div className="absolute left-1.5 top-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white ring-2 ring-emerald-200 flex items-center justify-center">
                  <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                </div>
                <h4 className="font-bold text-slate-900">{step.title}</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Helpdesk Footer */}
        <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between text-xs">
          <div>
            <span className="font-bold block">Need help with your rooftop?</span>
            <span className="text-[11px] text-slate-400">SunPower Support is available 24/7</span>
          </div>
          <a
            href="tel:+919876543210"
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-xs shadow-sm flex items-center gap-1.5"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Call Support</span>
          </a>
        </div>
      </div>
    </div>
  );
}
