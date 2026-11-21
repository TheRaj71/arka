"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Bell,
  Sun,
  Moon,
  Type,
  HelpCircle,
  Clock,
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
              <div className="absolute right-0 top-11 w-80 card-surface border border-[var(--border-strong)] shadow-[var(--shadow-dropdown)] p-3 z-30 animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)] text-body-sm font-semibold text-[var(--text-primary)]">
                  <span>Operational Alerts</span>
                  <span className="text-caption font-mono text-[var(--accent-base)]">2 pending</span>
                </div>
                <div className="divide-y divide-[var(--border-subtle)] max-h-64 overflow-y-auto">
                  <div className="py-2.5 text-body-sm">
                    <div className="font-medium text-[var(--text-primary)]">50% Advance Received</div>
                    <div className="text-caption text-[var(--text-secondary)]">
                      Order #ORD-2611-0001 confirmed. Pick-list queued for Warehouse.
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] mt-1 font-mono">14m ago</div>
                  </div>
                  <div className="py-2.5 text-body-sm">
                    <div className="font-medium text-[var(--text-primary)]">Survey Submitted</div>
                    <div className="text-caption text-[var(--text-secondary)]">
                      Vikram Patel submitted rooftop survey for Anita Sharma (3.3 kW).
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] mt-1 font-mono">1h ago</div>
                  </div>
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
