"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
  LayoutDashboard,
  Users,
  FileSpreadsheet,
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
  ChevronLeft,
  ChevronRight,
  Palette,
  FileCheck2,
} from "lucide-react";
import { type AppRole } from "@/lib/auth/permissions";

interface SidebarProps {
  currentRole: AppRole;
  userName?: string;
  userEmail?: string;
  onRoleChange?: (role: AppRole) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: AppRole[];
  badge?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

export function Sidebar({
  currentRole,
  userName = "Priya Sharma",
  userEmail = "director@demo.local",
  onRoleChange,
  isCollapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname();

  const groups: NavGroup[] = [
    {
      label: "Overview",
      items: [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["director", "manager", "accounts"] },
      ],
    },
    {
      label: "Sales",
      items: [
        { name: "Leads Funnel", href: "/leads", icon: Users, roles: ["director", "manager", "sales"] },
        { name: "Quotes", href: "/quotes", icon: FileSpreadsheet, roles: ["director", "manager", "sales", "accounts"] },
        { name: "Orders", href: "/orders", icon: ShoppingCart, roles: ["director", "manager", "sales", "support", "accounts"] },
      ],
    },
    {
      label: "Operations",
      items: [
        { name: "Surveys", href: "/surveys", icon: FileCheck2, roles: ["director", "manager", "technician"] },
        { name: "Schedule", href: "/schedule", icon: CalendarDays, roles: ["director", "manager", "technician"] },
        { name: "Warehouse & Scan", href: "/warehouse", icon: Truck, roles: ["director", "manager", "warehouse"] },
        { name: "Inventory", href: "/inventory", icon: Boxes, roles: ["director", "manager", "warehouse", "accounts"] },
      ],
    },
    {
      label: "Field",
      items: [
        { name: "Technician PWA", href: "/field", icon: Wrench, roles: ["director", "manager", "technician"] },
      ],
    },
    {
      label: "Customer & Service",
      items: [
        { name: "Service Desk", href: "/service", icon: Headphones, roles: ["director", "manager", "support", "technician"] },
      ],
    },
    {
      label: "Finance",
      items: [
        { name: "Payments", href: "/payments", icon: CreditCard, roles: ["director", "manager", "accounts"] },
        { name: "Invoices", href: "/invoices", icon: FileText, roles: ["director", "manager", "accounts", "support"] },
        { name: "Subsidy Tracker", href: "/subsidy", icon: BadgePercent, roles: ["director", "manager", "accounts"] },
      ],
    },
    {
      label: "System",
      items: [
        { name: "Settings", href: "/settings", icon: Settings, roles: ["director"] },
        { name: "Design System", href: "/design", icon: Palette, roles: ["director", "manager"] },
      ],
    },
  ];

  return (
    <aside
      className={`shrink-0 flex flex-col justify-between bg-[var(--surface-card)] border-r border-[var(--border-subtle)] transition-all duration-200 select-none ${
        isCollapsed ? "w-[72px]" : "w-[260px]"
      }`}
    >
      {/* Top Workspace Header */}
      <div>
        <div className="h-16 px-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden">
            {/* Custom Arka Monogram Badge */}
            <div className="w-8 h-8 rounded-md bg-[var(--accent-base)] flex items-center justify-center text-[var(--text-inverse)] font-bold text-base tracking-tighter shrink-0">
              A
            </div>
            {!isCollapsed && (
              <div className="flex flex-col truncate">
                <span className="font-semibold text-body tracking-tight text-[var(--text-primary)] leading-tight">
                  Arka
                </span>
                <span className="text-[11px] text-[var(--text-muted)] truncate">
                  SunPower Solutions
                </span>
              </div>
            )}
          </Link>

          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] cursor-pointer"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Navigation Groups */}
        <nav className="p-3 space-y-5 overflow-y-auto max-h-[calc(100vh-140px)] scrollbar-thin">
          {groups.map((group) => {
            const allowedItems = group.items.filter(
              (item) => currentRole === "director" || item.roles.includes(currentRole)
            );
            if (allowedItems.length === 0) return null;

            return (
              <div key={group.label} className="space-y-1">
                {!isCollapsed && (
                  <div className="px-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    {group.label}
                  </div>
                )}
                {allowedItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" && pathname.startsWith(item.href));

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      title={isCollapsed ? item.name : undefined}
                      className={`relative flex items-center gap-3 px-3 h-11 rounded-md text-body-sm font-medium transition-colors ${
                        isActive
                          ? "bg-[var(--accent-subtle)] text-[var(--accent-text)] font-semibold"
                          : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]"
                      } ${isCollapsed ? "justify-center px-0" : ""}`}
                    >
                      {isActive && (
                        <span
                          className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-md bg-[var(--accent-base)]"
                          aria-hidden="true"
                        />
                      )}
                      <item.icon
                        className={`w-5 h-5 shrink-0 ${
                          isActive ? "text-[var(--accent-base)]" : "text-[var(--text-muted)]"
                        }`}
                      />
                      {!isCollapsed && <span className="flex-1 truncate">{item.name}</span>}
                      {!isCollapsed && item.badge && (
                        <span className="px-1.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--accent-subtle)] text-[var(--accent-text)]">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Bottom User Pill */}
      <div className="p-3 border-t border-[var(--border-subtle)] bg-[var(--surface-card)]">
        <div className={`flex items-center gap-3 ${isCollapsed ? "justify-center" : "justify-between"}`}>
          <div className="flex items-center gap-2.5 overflow-hidden">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8 rounded-md",
                },
              }}
            />
            {!isCollapsed && (
              <div className="truncate text-left">
                <div className="text-body-sm font-medium text-[var(--text-primary)] truncate">
                  {userName}
                </div>
                <div className="text-[11px] text-[var(--text-muted)] capitalize truncate">
                  {currentRole}
                </div>
              </div>
            )}
          </div>

          {!isCollapsed && onRoleChange && (
            <select
              value={currentRole}
              onChange={(e) => onRoleChange(e.target.value as AppRole)}
              className="text-[11px] font-medium bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-[var(--text-secondary)] rounded-md px-1.5 py-1 focus:outline-none hover:border-[var(--border-strong)] cursor-pointer"
              title="Switch demo persona for testing"
            >
              <option value="director">Director</option>
              <option value="manager">Manager</option>
              <option value="sales">Sales</option>
              <option value="technician">Tech</option>
              <option value="warehouse">Store</option>
              <option value="support">Support</option>
              <option value="accounts">Accounts</option>
            </select>
          )}
        </div>
      </div>
    </aside>
  );
}
