"use client";

import React, { useState, useTransition } from "react";
import { submitPublicEnquiry } from "@/modules/leads/actions";
import { GlassCard } from "@/components/ui/glass-card";
import {
  SunMedium,
  CheckCircle2,
  ShieldCheck,
  Zap,
  ArrowRight,
  Sparkles,
  Phone,
  MapPin,
  User,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";

export default function PublicEnquirePage() {
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState<{ lead_no: string; duplicate: boolean } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [requestedKw, setRequestedKw] = useState(3.0);
  const [requirement, setRequirement] = useState<"on_grid" | "off_grid">("on_grid");
  const [wantsSubsidy, setWantsSubsidy] = useState(true);
  const [notes, setNotes] = useState("");
  const [website, setWebsite] = useState(""); // Honeypot

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    startTransition(async () => {
      const res = await submitPublicEnquiry({
        name,
        phone,
        site_address: address,
        requested_kw: requestedKw,
        requirement,
        wants_subsidy: wantsSubsidy,
        notes,
        website,
      });

      if (!res.ok) {
        setErrorMsg(res.error.message || "Failed to submit enquiry. Please check your inputs.");
      } else {
        setSubmitted(res.data);
      }
    });
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-sky-400 via-sky-200 to-emerald-200 p-4 md:p-8 flex items-center justify-center font-sans antialiased">
      {/* Ambient background glow */}
      <div className="absolute top-10 left-1/4 w-80 h-80 bg-amber-300/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-sky-300/30 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-2xl">
        {submitted ? (
          <GlassCard className="p-8 sm:p-10 text-center space-y-6 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                {submitted.duplicate ? "Enquiry Updated" : "Enquiry Received"}
              </span>
              <h2 className="text-2xl font-black text-slate-900 mt-3">
                {submitted.duplicate
                  ? "We have added this note to your existing enquiry!"
                  : "Thank you for choosing solar!"}
              </h2>
              <p className="text-sm text-slate-600 max-w-md mx-auto mt-2">
                Your enquiry reference is{" "}
                <strong className="text-sky-900 font-mono text-base px-2 py-0.5 bg-sky-100 rounded-md">
                  {submitted.lead_no}
                </strong>
                . A SunPower rooftop engineer will call you shortly to verify your roof space and monthly bill.
              </p>
            </div>

            {/* PM Surya Ghar Guarantee Box */}
            <div className="p-4 rounded-xl bg-white/80 border border-sky-100 text-left text-xs space-y-2 shadow-xs">
              <div className="flex items-center gap-2 font-bold text-sky-900">
                <ShieldCheck className="w-4 h-4 text-sky-600" /> PM Surya Ghar Muft Bijli Yojana
              </div>
              <p className="text-slate-600">
                Under current guidelines, 3 kW residential on-grid installations are eligible for up to{" "}
                <strong>₹78,000 Central Government direct bank subsidy (DBT)</strong> following DISCOM inspection.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href={`/track/${submitted.lead_no}`}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-700 text-white font-semibold text-xs shadow-md shadow-sky-500/25 hover:opacity-95 transition-all flex items-center justify-center gap-2"
              >
                Track Your Solar Journey <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                onClick={() => {
                  setSubmitted(null);
                  setName("");
                  setPhone("");
                  setAddress("");
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/80 border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-white shadow-xs"
              >
                Submit Another Request
              </button>
            </div>
          </GlassCard>
        ) : (
          <GlassCard className="p-6 sm:p-8 md:p-10 shadow-2xl">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-300/40 text-sky-800 text-xs font-bold mb-3">
                <SunMedium className="w-4 h-4 text-amber-500 animate-spin-slow" />
                SunPower Solutions · Clean Rooftop Solar
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Get Your Solar Quote & Subsidy Estimate
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-lg mx-auto">
                Join 500+ homes and businesses powered by clean energy. Save up to 90% on electricity bills with guaranteed 20-year performance warranties.
              </p>
            </div>

            {errorMsg && (
              <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Honeypot hidden input */}
              <input
                type="text"
                name="website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="hidden"
                tabIndex={-1}
                autoComplete="off"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" /> Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Anita Sharma"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/90 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400 shadow-xs"
                  />
                </div>

                {/* Phone Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> Mobile Number
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="98765 43210"
                      className="w-full pl-12 pr-3.5 py-2.5 rounded-xl bg-white/90 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400 shadow-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Site Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> Rooftop Site Address & City
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Plot 14, Lotus Park, Baner, Pune"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/90 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400 shadow-xs"
                />
              </div>

              {/* Capacity Selector */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Desired System Capacity</span>
                  <span className="text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md font-mono">
                    {requestedKw} kW (~{Math.round(requestedKw * 120)} units/month)
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((kw) => (
                    <button
                      key={kw}
                      type="button"
                      onClick={() => setRequestedKw(kw)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                        requestedKw === kw
                          ? "bg-sky-600 text-white border-sky-600 shadow-md shadow-sky-500/25"
                          : "bg-white/80 text-slate-700 border-slate-200 hover:bg-white"
                      }`}
                    >
                      {kw} kW
                    </button>
                  ))}
                </div>
              </div>

              {/* System Type: On-Grid vs Off-Grid */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">System Connection Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setRequirement("on_grid")}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      requirement === "on_grid"
                        ? "bg-sky-500/10 border-sky-400 shadow-xs"
                        : "bg-white/70 border-slate-200 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">On-Grid (Net Metering)</span>
                      <Zap className="w-4 h-4 text-sky-600" />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Exports surplus power to DISCOM. Eligible for ₹78,000 subsidy.
                    </p>
                  </div>

                  <div
                    onClick={() => setRequirement("off_grid")}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      requirement === "off_grid"
                        ? "bg-amber-500/10 border-amber-400 shadow-xs"
                        : "bg-white/70 border-slate-200 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">Off-Grid (With Battery)</span>
                      <Sparkles className="w-4 h-4 text-amber-500" />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Includes tubular battery bank for 100% backup during power cuts.
                    </p>
                  </div>
                </div>
              </div>

              {/* Subsidy Interest Checkbox */}
              {requirement === "on_grid" && (
                <label className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={wantsSubsidy}
                    onChange={(e) => setWantsSubsidy(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="text-xs text-slate-700">
                    <strong className="text-emerald-900 block font-bold">
                      Apply for PM Surya Ghar National Subsidy
                    </strong>
                    SunPower will prepare all DCR module certifications and DISCOM net-metering paperwork for your direct bank transfer.
                  </div>
                </label>
              )}

              {/* Optional Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Additional Notes / Special Roof Condition</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. 2nd floor RCC terrace, average monthly bill ₹3,500..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/90 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400 shadow-xs resize-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isPending}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 text-white font-bold text-sm shadow-lg shadow-sky-500/30 hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isPending ? (
                  <span>Submitting Enquiry...</span>
                ) : (
                  <>
                    <span>Request Site Survey & Fast Quote</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
