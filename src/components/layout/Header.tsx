"use client";

import React, { useState } from "react";
import {
  Search,
  Bell,
  Sun,
  Wind,
  Compass,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Wrench,
  TrendingUp,
} from "lucide-react";

interface HeaderProps {
  userName?: string;
  onSearch?: (query: string) => void;
  unreadNotifications?: number;
}

export function Header({
  userName = "Priya",
  onSearch,
  unreadNotifications = 3,
}: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="mb-6 flex flex-col gap-4">
      {/* Top Bar matching Reference Image */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Greeting & Headline */}
        <div>
          <div className="text-xs font-semibold text-slate-500 mb-0.5 flex items-center gap-1.5">
            Good morning, {userName} <span className="animate-wave inline-block">👋</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900">
            Your solar systems & operations are performing{" "}
            <span className="bg-gradient-to-r from-sky-600 to-blue-700 bg-clip-text text-transparent">
              excellently
            </span>
          </h1>
        </div>

        {/* Right Search, Notification & Weather Card */}
        <div className="flex items-center gap-3">
          {/* Universal Search Bar */}
          <div className="relative w-56 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                onSearch?.(e.target.value);
              }}
              placeholder="Search serial, lead, order..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/80 backdrop-blur-md border border-white/80 text-xs text-slate-800 placeholder-slate-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-sky-400/50"
            />
          </div>

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2.5 rounded-xl bg-white/80 backdrop-blur-md border border-white/80 text-slate-600 hover:text-sky-600 shadow-xs hover:shadow-md transition-all"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifications > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </button>

            {/* Notification Drawer Preview */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white/95 backdrop-blur-xl border border-white/80 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="font-bold text-xs text-slate-800">Notifications</span>
                  <span className="text-[10px] font-semibold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full">
                    {unreadNotifications} new
                  </span>
                </div>
                <div className="divide-y divide-slate-100 py-1 text-xs">
                  <div className="py-2.5">
                    <div className="font-semibold text-slate-800">Order Confirmed — Pick-list ready</div>
                    <div className="text-[11px] text-slate-500">ORD-2627-00001: 3 kW Residential System</div>
                  </div>
                  <div className="py-2.5">
                    <div className="font-semibold text-slate-800">Survey Approved for Quote</div>
                    <div className="text-[11px] text-slate-500">PRJ-2627-00001 (Anita Sharma) approved</div>
                  </div>
                  <div className="py-2.5">
                    <div className="font-semibold text-slate-800">Delivery Confirmed</div>
                    <div className="text-[11px] text-slate-500">Warranty clocks started for 6 units</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Weather & Solar Irradiance Pill (Direct from Reference Image) */}
          <div className="hidden lg:flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-white/80 backdrop-blur-md border border-white/80 shadow-xs text-xs">
            <div className="flex items-center gap-1.5 text-amber-500 font-bold">
              <Sun className="w-4 h-4 animate-spin-slow" />
              <span>24°C</span>
            </div>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex flex-col text-[10px] text-slate-500">
              <span>
                Irradiance: <strong className="text-slate-700">850 W/m²</strong>
              </span>
              <span>
                Wind: <strong className="text-slate-700">12 km/h</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Golden Thread Interactive Chain Banner */}
      <div className="p-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-500/10 via-blue-500/10 to-emerald-500/10 border border-sky-200/50 backdrop-blur-md flex flex-wrap items-center justify-between text-xs font-semibold text-slate-700 shadow-xs">
        <div className="flex items-center gap-2 text-sky-800 font-bold">
          <ShieldCheck className="w-4 h-4 text-sky-600" />
          <span>The Golden Thread:</span>
        </div>

        <div className="flex items-center gap-1.5 md:gap-3 flex-wrap">
          <span className="flex items-center gap-1 text-slate-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Serial Number
          </span>
          <ArrowRight className="w-3 h-3 text-slate-400" />
          <span className="flex items-center gap-1 text-slate-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Customer Asset
          </span>
          <ArrowRight className="w-3 h-3 text-slate-400" />
          <span className="flex items-center gap-1 text-slate-800">
            <Clock className="w-3.5 h-3.5 text-sky-600" /> 20-Yr Warranty Clock
          </span>
          <ArrowRight className="w-3 h-3 text-slate-400" />
          <span className="flex items-center gap-1 text-slate-800">
            <Wrench className="w-3.5 h-3.5 text-indigo-600" /> Service Ticket
          </span>
          <ArrowRight className="w-3 h-3 text-slate-400" />
          <span className="flex items-center gap-1 text-emerald-700 font-bold bg-emerald-100/60 px-2 py-0.5 rounded-full">
            <TrendingUp className="w-3.5 h-3.5" /> Job Profit & Margin
          </span>
        </div>
      </div>
    </header>
  );
}
