"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Bell,
  Sun,
  Moon,
  Type,
  HelpCircle,
  Clock,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { CommandPalette } from "../shared/CommandPalette";

interface HeaderProps {
  userName?: string;
  unreadNotifications?: number;
}

export function Header({
  userName = "Priya",
  unreadNotifications = 2,
}: HeaderProps) {
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [textSize, setTextSize] = useState<"normal" | "large" | "xlarge">("normal");
  const [showNotifications, setShowNotifications] = useState(false);

  // Toggle Dark Theme
  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.setAttribute("data-theme", "light");
    }
  };

  // Toggle Text Scale Size
  const cycleTextSize = () => {
    const sizes: Array<"normal" | "large" | "xlarge"> = ["normal", "large", "xlarge"];
    const nextIdx = (sizes.indexOf(textSize) + 1) % sizes.length;
    const next = sizes[nextIdx];
    setTextSize(next);
    document.documentElement.setAttribute("data-text-size", next);
  };

  return (
    <>
      <header className="h-16 px-4 sm:px-6 border-b border-[var(--border-subtle)] bg-[var(--surface-card)] flex items-center justify-between gap-4 select-none shrink-0">
        {/* Left: Global Command Palette Quick Trigger */}
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <button
            onClick={() => setIsCommandOpen(true)}
            className="w-full h-10 px-3 flex items-center justify-between text-body-sm text-[var(--text-muted)] bg-[var(--surface-subtle)] border border-[var(--border-subtle)] rounded-md hover:border-[var(--border-strong)] transition-colors cursor-pointer text-left"
          >
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
              <span className="truncate">Search serials, quotes, customers...</span>
            </div>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[11px] font-mono text-[var(--text-muted)] bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xs">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right Tools (Date, Notifications, Theme, Text Size) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Operations Time Stamp */}
          <div className="hidden lg:flex items-center gap-1.5 text-caption font-mono text-[var(--text-muted)] tabular-nums">
            <Clock className="w-3.5 h-3.5" />
            <span>IST (Asia/Kolkata)</span>
          </div>

          <div className="h-4 w-[1px] bg-[var(--border-subtle)] hidden lg:block" />

          {/* Text Size Scale Toggle */}
          <button
            onClick={cycleTextSize}
            className="h-9 px-2 rounded-md border border-[var(--border-subtle)] hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)] text-xs font-semibold flex items-center gap-1 cursor-pointer"
            title={`Current Text Scale: ${textSize.toUpperCase()} (Click to toggle)`}
          >
            <Type className="w-3.5 h-3.5" />
            <span className="uppercase text-[11px]">{textSize.slice(0, 3)}</span>
          </button>

          {/* Theme Toggle (Light / Dark) */}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-md border border-[var(--border-subtle)] hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)] flex items-center justify-center cursor-pointer"
            title={`Switch to ${theme === "light" ? "Dark" : "Light"} theme`}
          >
            {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          {/* Notifications Center */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="w-9 h-9 rounded-md border border-[var(--border-subtle)] hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)] flex items-center justify-center relative cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifications > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--accent-base)]" />
              )}
            </button>

            {/* Notification Drawer Popover */}
            {showNotifications && (
              <div className="absolute right-0 top-11 w-80 rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-strong)] shadow-lg p-3 z-30 animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)] text-body-sm font-semibold text-[var(--text-primary)]">
                  <span>Operational Alerts</span>
                  <span className="text-caption font-mono text-[var(--accent-base)] font-medium">
                    {unreadNotifications > 0 ? `${unreadNotifications} unread` : "All read"}
                  </span>
                </div>
                <div className="py-2 space-y-2 text-body-sm">
                  {unreadNotifications > 0 ? (
                    <div className="p-2.5 rounded-[var(--radius-control)] bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 text-amber-900 dark:text-amber-200 text-body-sm flex items-start gap-2">
                      <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                      <div className="space-y-0.5">
                        <div className="font-semibold text-body-sm">Action Items Pending</div>
                        <div className="text-caption text-amber-800 dark:text-amber-300">
                          Review pending staff approvals & system alerts.
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-4 text-center text-body-sm text-text-secondary">
                      No new operational alerts.
                    </div>
                  )}
                </div>
                <div className="pt-2 border-t border-[var(--border-subtle)]">
                  <Link
                    href="/notifications"
                    onClick={() => setShowNotifications(false)}
                    className="w-full h-8 flex items-center justify-center gap-1.5 text-caption font-medium text-[var(--accent-base)] hover:underline rounded-[var(--radius-control)] hover:bg-[var(--surface-subtle)]"
                  >
                    <span>Open Notification Center</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Command Palette */}
      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
    </>
  );
}
