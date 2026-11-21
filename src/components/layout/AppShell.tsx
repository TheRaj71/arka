"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { type AppRole } from "@/lib/auth/permissions";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileSpreadsheet,
  Truck,
  Wrench,
  Headphones,
  Menu,
} from "lucide-react";

interface AppShellProps {
  children: React.ReactNode;
  initialRole?: AppRole;
  userName?: string;
  userEmail?: string;
  unreadNotifications?: number;
}

export function AppShell({
  children,
  initialRole = "director",
  userName = "Priya Sharma",
  userEmail = "director@demo.local",
  unreadNotifications = 0,
}: AppShellProps) {
  const [role, setRole] = useState<AppRole>(initialRole);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  // Mobile Bottom Tab Bar items (Role-filtered, max 5 items per Section 4)
  const mobileTabs = [
    { label: "Home", href: "/dashboard", icon: LayoutDashboard, roles: ["director", "manager", "accounts"] },
    { label: "Leads", href: "/leads", icon: Users, roles: ["director", "manager", "sales"] },
    { label: "Quotes", href: "/quotes", icon: FileSpreadsheet, roles: ["director", "manager", "sales", "accounts"] },
    { label: "Dispatch", href: "/warehouse", icon: Truck, roles: ["director", "manager", "warehouse"] },
    { label: "Jobs", href: "/field", icon: Wrench, roles: ["director", "manager", "technician"] },
    { label: "Tickets", href: "/service", icon: Headphones, roles: ["director", "manager", "support", "technician"] },
  ].filter((t) => role === "director" || t.roles.includes(role)).slice(0, 5);

  return (
    <div className="min-h-screen w-full flex bg-[var(--surface-page)] text-[var(--text-primary)] antialiased">
      {/* 1. Desktop Solid Sidebar (Hidden on Mobile) */}
      <div className="hidden md:flex">
        <Sidebar
          currentRole={role}
          userName={userName}
          userEmail={userEmail}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          onRoleChange={(newRole) => setRole(newRole)}
        />
      </div>

      {/* 2. Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Slim Header (64px) */}
        <Header userName={userName.split(" ")[0]} unreadNotifications={unreadNotifications} />

        {/* Page Content Container (Max width 1440px, 32px padding desktop) */}
        <main className="flex-1 w-full max-w-[1440px] mx-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
          {children}
        </main>
      </div>

      {/* 3. Mobile Shell: Bottom Tab Bar (64px high, max 5 items per Section 4) */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[var(--surface-card)] border-t border-[var(--border-subtle)] flex items-center justify-around z-40 select-none pb-safe"
        aria-label="Mobile Navigation"
      >
        {mobileTabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
          return (
            <Link
              key={tab.label}
              href={tab.href}
              className={`flex-1 flex flex-col items-center justify-center h-full gap-1 text-[11px] font-medium transition-colors ${
                isActive
                  ? "text-[var(--accent-base)] font-semibold"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
