"use client";

import React, { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  Settings,
  Users,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Save,
  Building,
  DollarSign,
  Zap,
} from "lucide-react";

export function SettingsClient() {
  const [activeTab, setActiveTab] = useState<"system" | "users">("system");
  const [savedSuccess, setSavedSuccess] = useState(false);

  // System Settings state per PRD 00 §6
  const [settings, setSettings] = useState({
    companyName: "SunPower Solutions Private Limited",
    gstin: "27AABCS1429B1Z8",
    city: "Pune, Maharashtra",
    advancePct: 50,
    discountThresholdPct: 3.0,
    quoteValidityDays: 15,
    panelWarrantyMonths: 240, // 20 years
    inverterWarrantyMonths: 24, // 2 years
    batteryWarrantyMonths: 60, // 5 years
    labourHoursPerKw: 2.5,
    timezone: "Asia/Kolkata (IST, UTC+05:30)",
  });

  const demoUsers = [
    { name: "Priya Sharma", email: "director@demo.local", role: "director", desc: "Full executive P&L, system overrides, legal sign-off" },
    { name: "Rajesh Patel", email: "manager@demo.local", role: "manager", desc: "Operations gatekeeper: survey approvals, BOM overrides, dispatch sign-off" },
    { name: "Ravi Verma", email: "sales@demo.local", role: "sales", desc: "Lead intake, pre-qualification, customer quote dispatch (costs hidden)" },
    { name: "Imran Khan", email: "tech1@demo.local", role: "technician", desc: "Lead field technician: site survey measurements, rooftop mounting, power tests" },
    { name: "Vikram Patel", email: "tech2@demo.local", role: "technician", desc: "Field technician: installations, mobile signature capture" },
    { name: "Ganesh Shinde", email: "warehouse@demo.local", role: "warehouse", desc: "Goods receipt, serial number QR scanning, dispatch truck loading (no payment access)" },
    { name: "Sneha Kulkarni", email: "accounts@demo.local", role: "accounts", desc: "Payment verification, UTR recording, GST tax invoices, subsidy paperwork" },
    { name: "Deepak Joshi", email: "support@demo.local", role: "support", desc: "Customer helpdesk, < 5s warranty verification, service ticket creation" },
  ];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              System Settings & RBAC Administration
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
              PRD 00 §6 Config
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure SunPower enterprise parameters, warranty horizons, commercial rules, and role permissions.
          </p>
        </div>

        {savedSuccess && (
          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Settings Saved!</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab("system")}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === "system"
              ? "bg-slate-900 text-white"
              : "text-slate-600 hover:bg-white"
          }`}
        >
          Company & Warranty Defaults
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === "users"
              ? "bg-slate-900 text-white"
              : "text-slate-600 hover:bg-white"
          }`}
        >
          7 Demo Staff Profiles & Roles
        </button>
      </div>

      {activeTab === "system" ? (
        <form onSubmit={handleSave} className="space-y-6 text-xs">
          {/* Company Identity */}
          <GlassCard className="p-5 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 pb-2 border-b border-slate-100">
              <Building className="w-4 h-4 text-amber-500" />
              <span>Company Legal Entity & Tax Profile</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Company Legal Name</label>
                <input
                  type="text"
                  value={settings.companyName}
                  onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Maharashtra GSTIN</label>
                <input
                  type="text"
                  value={settings.gstin}
                  onChange={(e) => setSettings({ ...settings, gstin: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Operational Region</label>
                <input
                  type="text"
                  value={settings.city}
                  onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>
          </GlassCard>

          {/* Golden Rules & Warranty Defaults */}
          <GlassCard className="p-5 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 pb-2 border-b border-slate-100">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Warranty Horizon Defaults (PRD 00 §6)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Solar Panels Linear Warranty
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={settings.panelWarrantyMonths}
                    onChange={(e) =>
                      setSettings({ ...settings, panelWarrantyMonths: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    Months (20 Yrs)
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Inverter Warranty
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={settings.inverterWarrantyMonths}
                    onChange={(e) =>
                      setSettings({ ...settings, inverterWarrantyMonths: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    Months (2 Yrs)
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Battery Storage Warranty
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={settings.batteryWarrantyMonths}
                    onChange={(e) =>
                      setSettings({ ...settings, batteryWarrantyMonths: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    Months (5 Yrs)
                  </span>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Commercial & Order Thresholds */}
          <GlassCard className="p-5 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 pb-2 border-b border-slate-100">
              <DollarSign className="w-4 h-4 text-amber-500" />
              <span>Commercial & Automation Gates</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Required Order Advance Milestone
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={settings.advancePct}
                    onChange={(e) => setSettings({ ...settings, advancePct: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">%</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Triggers Automation A6 order confirmation
                </span>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Discount Approval Threshold
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    value={settings.discountThresholdPct}
                    onChange={(e) =>
                      setSettings({ ...settings, discountThresholdPct: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">%</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Discounts above 3% require Manager approval
                </span>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Quote Price Lock Validity
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={settings.quoteValidityDays}
                    onChange={(e) =>
                      setSettings({ ...settings, quoteValidityDays: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    Days
                  </span>
                </div>
              </div>
            </div>
          </GlassCard>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Save System Settings</span>
            </button>
          </div>
        </form>
      ) : (
        /* Users List */
        <GlassCard className="overflow-hidden p-0 border border-slate-200/70">
          <div className="p-4 bg-slate-50/90 border-b border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-slate-900 text-xs">
                Staff RBAC Matrix & Demo Simulation Accounts
              </h3>
            </div>
            <span className="text-[10px] text-slate-500">
              Role switches take effect across navigation & RPC permissions
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/60 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-4">User</th>
                  <th className="py-2.5 px-4">Role Key</th>
                  <th className="py-2.5 px-4">Permission Scope</th>
                  <th className="py-2.5 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {demoUsers.map((u, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{u.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{u.email}</div>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[10px]">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{u.desc}</td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
