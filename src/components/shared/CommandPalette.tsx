"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  LayoutDashboard,
  Users,
  FileSpreadsheet,
  Boxes,
  Truck,
  Wrench,
  Headphones,
  Settings,
  PlusCircle,
  X,
  ArrowRight,
} from "lucide-react";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  // Keyboard shortcut listener (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const quickNav = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, group: "Navigation" },
    { label: "Leads Queue", href: "/leads", icon: Users, group: "Navigation" },
    { label: "Quote Builder", href: "/quotes", icon: FileSpreadsheet, group: "Navigation" },
    { label: "Warehouse & Dispatches", href: "/warehouse", icon: Truck, group: "Navigation" },
    { label: "Stock Inventory", href: "/inventory", icon: Boxes, group: "Navigation" },
    { label: "Service & Warranty Desk", href: "/service", icon: Headphones, group: "Navigation" },
    { label: "Field Technician PWA", href: "/field", icon: Wrench, group: "Navigation" },
    { label: "Settings", href: "/settings", icon: Settings, group: "Navigation" },
    { label: "Design System & Tokens", href: "/design", icon: PlusCircle, group: "Developer" },
  ];

  const quickActions = [
    { label: "Create New Lead", href: "/leads", action: "new_lead" },
    { label: "Scan Dispatched Serial", href: "/warehouse", action: "scan" },
    { label: "Lookup Warranty by Serial", href: "/service", action: "warranty" },
  ];

  const filteredNav = quickNav.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (href: string) => {
    router.push(href);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl card-surface border border-[var(--border-strong)] shadow-[var(--shadow-modal)] overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-100">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--surface-card)]">
          <Search className="w-5 h-5 text-[var(--text-muted)] shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, search customer, quote, or serial..."
            className="w-full bg-transparent text-body font-normal text-[var(--text-primary)] focus:outline-none placeholder:text-[var(--text-muted)]"
          />
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[11px] font-mono text-[var(--text-muted)] bg-[var(--surface-subtle)] border border-[var(--border-subtle)] rounded-xs">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-[var(--border-subtle)]">
          {/* Quick Actions */}
          {!query && (
            <div className="pb-2">
              <div className="px-3 py-1 text-caption font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Quick Actions
              </div>
              <div className="space-y-0.5 mt-1">
                {quickActions.map((qa) => (
                  <button
                    key={qa.label}
                    onClick={() => handleSelect(qa.href)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-md text-body-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer text-left"
                  >
                    <span>{qa.label}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Items */}
          <div className="pt-2">
            <div className="px-3 py-1 text-caption font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Navigation
            </div>
            <div className="space-y-0.5 mt-1">
              {filteredNav.map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleSelect(item.href)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-body-sm font-medium text-[var(--text-primary)] hover:bg-[var(--accent-subtle)] hover:text-[var(--accent-text)] transition-colors cursor-pointer text-left group"
                >
                  <item.icon className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--accent-base)] shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  <span className="text-caption text-[var(--text-muted)]">{item.group}</span>
                </button>
              ))}
              {filteredNav.length === 0 && (
                <div className="py-6 text-center text-body-sm text-[var(--text-muted)]">
                  No matching commands found
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Helper Footer */}
        <div className="px-4 py-2 border-t border-[var(--border-subtle)] bg-[var(--surface-subtle)] flex items-center justify-between text-caption text-[var(--text-muted)]">
          <div className="flex items-center gap-3">
            <span>↑↓ to navigate</span>
            <span>↵ to select</span>
          </div>
          <span>SunPower Arka Command</span>
        </div>
      </div>
    </div>
  );
}
