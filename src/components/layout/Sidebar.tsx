"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  FileCheck2,
  Receipt,
  ShoppingCart,
  CreditCard,
  Boxes,
  Truck,
  CalendarDays,
  Wrench,
  Headphones,
  FileText,
  BadgePercent,
  Settings,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  SunMedium,
  Zap,
} from "lucide-react";
import { clsx } from "clsx";
import { type AppRole } from "@/lib/auth/permissions";

interface SidebarProps {
  currentRole: AppRole;
  userName?: string;
  userEmail?: string;
  onRoleChange?: (role: AppRole) => void;
}

export function Sidebar({ currentRole, userName = "Priya Sharma", userEmail = "director@demo.local", onRoleChange }: SidebarProps) {
  const pathname = usePathname();

  const navigation = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard, roles: ["director", "manager", "accounts"] },
    { name: "Approvals", href: "/approvals", icon: ShieldCheck, roles: ["director", "manager"], badge: "2" },
    { name: "Leads Funnel", href: "/leads", icon: Users, roles: ["director", "manager", "sales"] },
    { name: "Projects", href: "/projects", icon: FolderKanban, roles: ["director", "manager", "sales", "technician", "warehouse", "support", "accounts"] },
    { name: "Surveys", href: "/surveys", icon: FileCheck2, roles: ["director", "manager", "technician"] },
    { name: "Quote Engine", href: "/quotes", icon: Receipt, roles: ["director", "manager", "sales", "accounts"] },
    { name: "Orders", href: "/orders", icon: ShoppingCart, roles: ["director", "manager", "sales", "support", "accounts"] },
    { name: "Payments", href: "/payments", icon: CreditCard, roles: ["director", "manager", "accounts"] },
    { name: "Inventory", href: "/inventory", icon: Boxes, roles: ["director", "manager", "warehouse", "accounts"] },
    { name: "Warehouse & Scan", href: "/warehouse", icon: Truck, roles: ["director", "manager", "warehouse"] },
    { name: "Field PWA", href: "/field", icon: Wrench, roles: ["director", "manager", "technician"] },
    { name: "Technician Schedule", href: "/schedule", icon: CalendarDays, roles: ["director", "manager", "technician"] },
    { name: "Service & Warranty", href: "/service", icon: Headphones, roles: ["director", "manager", "support", "technician"] },
    { name: "Invoices", href: "/invoices", icon: FileText, roles: ["director", "manager", "accounts", "support"] },
    { name: "Subsidy Tracker", href: "/subsidy", icon: BadgePercent, roles: ["director", "manager", "accounts"] },
    { name: "Settings", href: "/settings", icon: Settings, roles: ["director"] },
  ];

  // Filter navigation by role
  const allowedNav = navigation.filter(
    (item) => currentRole === "director" || item.roles.includes(currentRole)
  );

  return (
    <aside className="w-64 shrink-0 flex flex-col justify-between py-2 pr-4 border-r border-slate-200/50">
      {/* Top Logo */}
      <div className="px-3 mb-6">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-sky-500/25 group-hover:scale-105 transition-transform">
            <SunMedium className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-slate-900 via-sky-900 to-blue-900 bg-clip-text text-transparent">
              SunPower Arka
            </div>
            <div className="text-[10px] uppercase tracking-wider font-semibold text-sky-600 flex items-center gap-1">
              <Zap className="w-2.5 h-2.5" /> Solar Enterprise
            </div>
          </div>
        </Link>
      </div>

      {/* Nav List */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-2 pr-1 scrollbar-thin scrollbar-thumb-slate-200">
        {allowedNav.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group",
                isActive
                  ? "bg-sky-500/15 text-sky-900 font-semibold shadow-xs border border-sky-300/40"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon
                  className={clsx(
                    "w-4 h-4 transition-colors",
                    isActive ? "text-sky-600" : "text-slate-400 group-hover:text-slate-600"
                  )}
                />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500 text-white">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Clean Energy Promo Card (Matched to Reference Image) */}
      <div className="mt-4 px-2">
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-sky-500/10 via-blue-500/5 to-white/70 border border-sky-200/50 backdrop-blur-md shadow-xs">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-[11px] font-bold text-sky-900 uppercase tracking-wide">
              Clean Energy Impact
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed mb-2.5">
            428.6 tons CO₂ offset this year across 40+ rooftop sites.
          </p>
          <Link
            href="/track/demo"
            className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1 group"
          >
            Solar Journey <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>

      {/* User Profile Pill & Role Switcher */}
      <div className="mt-4 pt-3 border-t border-slate-200/60 px-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-sky-400 flex items-center justify-center text-white font-bold text-sm shadow-xs">
              {userName.charAt(0)}
            </div>
            <div className="text-left overflow-hidden">
              <div className="text-xs font-bold text-slate-800 truncate">{userName}</div>
              <div className="text-[10px] font-medium text-slate-500 capitalize">{currentRole}</div>
            </div>
          </div>

          {/* Quick Role Switcher for Testing/Demo */}
          {onRoleChange && (
            <select
              value={currentRole}
              onChange={(e) => onRoleChange(e.target.value as AppRole)}
              className="text-[10px] font-semibold bg-white/80 border border-slate-200 text-slate-700 rounded-lg px-2 py-1 shadow-xs hover:border-sky-300 focus:outline-none"
              title="Switch demo role to test role permissions"
            >
              <option value="director">Director</option>
              <option value="manager">Manager</option>
              <option value="sales">Sales</option>
              <option value="technician">Technician</option>
              <option value="warehouse">Warehouse</option>
              <option value="support">Support</option>
              <option value="accounts">Accounts</option>
            </select>
          )}
        </div>
      </div>
    </aside>
  );
}
