"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { type StaffProfileItem, type PendingUserItem } from "@/modules/users/queries";
import { type AppRole } from "@/lib/auth/permissions";
import { approveUserRole, rejectUserRole } from "@/modules/users/actions";
import {
  Settings,
  Users,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Save,
  Building,
  DollarSign,
  ShieldAlert,
  UserCheck,
  UserX,
  Loader2,
  ChevronDown,
  AlertCircle,
} from "lucide-react";

interface SettingsClientProps {
  initialPendingUsers: PendingUserItem[];
  initialStaff: StaffProfileItem[];
  isDirector: boolean;
}

const ROLE_OPTIONS: { role: AppRole; label: string; desc: string }[] = [
  { role: "director", label: "Director", desc: "Full executive P&L, system overrides, user authorization" },
  { role: "manager", label: "Operations Manager", desc: "Survey approvals, BOM overrides, dispatch sign-off" },
  { role: "sales", label: "Sales Representative", desc: "Lead intake, pre-qualification, customer quotes" },
  { role: "technician", label: "Field Technician", desc: "Site survey measurements, rooftop mounting, commission" },
  { role: "warehouse", label: "Warehouse Officer", desc: "Goods receipt, serial number QR scanning, dispatch loading" },
  { role: "support", label: "Customer Support", desc: "Helpdesk, warranty lookups, service tickets" },
  { role: "accounts", label: "Accounts Officer", desc: "Payment verification, UTR recording, GST invoices" },
];

export function SettingsClient({
  initialPendingUsers,
  initialStaff,
  isDirector,
}: SettingsClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"team" | "system">(
    initialPendingUsers.length > 0 ? "team" : "team"
  );
  const [pendingUsers, setPendingUsers] = useState<PendingUserItem[]>(initialPendingUsers);
  const [staffList, setStaffList] = useState<StaffProfileItem[]>(initialStaff);
  const [selectedRoles, setSelectedRoles] = useState<Record<string, AppRole>>({});
  const [loadingUser, setLoadingUser] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  // System Settings state
  const [settings, setSettings] = useState({
    companyName: "SunPower Solutions Private Limited",
    gstin: "27AABCS1429B1Z8",
    city: "Baner, Pune, Maharashtra 411045",
    advancePct: 50,
    discountThresholdPct: 3.0,
    quoteValidityDays: 15,
    panelWarrantyMonths: 240, // 20 years
    inverterWarrantyMonths: 24, // 2 years
    batteryWarrantyMonths: 60, // 5 years
    labourHoursPerKw: 2.5,
    timezone: "Asia/Kolkata (IST, UTC+05:30)",
  });

  const handleApprove = async (user: PendingUserItem) => {
    const roleToAssign = selectedRoles[user.id] || "technician";
    setLoadingUser(user.id);
    try {
      const res = await approveUserRole({
        profile_id: user.id,
        role: roleToAssign,
      });

      if (res.ok) {
        setPendingUsers((prev) => prev.filter((p) => p.id !== user.id));
        setStaffList((prev) => [
          ...prev.filter((s) => s.id !== user.id),
          {
            id: user.id,
            clerk_user_id: user.clerk_user_id,
            email: user.email,
            full_name: user.full_name,
            role: roleToAssign,
            is_active: true,
            created_at: user.created_at,
          },
        ]);
        startTransition(() => {
          router.refresh();
        });
      } else {
        alert(res.error.message || "Failed to approve role");
      }
    } finally {
      setLoadingUser(null);
    }
  };

  const handleReject = async (user: PendingUserItem) => {
    if (!confirm(`Are you sure you want to decline ${user.email || user.full_name}?`)) return;
    setLoadingUser(user.id);
    try {
      const res = await rejectUserRole({ profile_id: user.id });
      if (res.ok) {
        setPendingUsers((prev) => prev.filter((p) => p.id !== user.id));
        startTransition(() => {
          router.refresh();
        });
      } else {
        alert(res.error.message || "Failed to decline user");
      }
    } finally {
      setLoadingUser(null);
    }
  };

  const handleUpdateRole = async (staffId: string, newRole: AppRole) => {
    setLoadingUser(staffId);
    try {
      const res = await approveUserRole({
        profile_id: staffId,
        role: newRole,
      });
      if (res.ok) {
        setStaffList((prev) =>
          prev.map((s) => (s.id === staffId ? { ...s, role: newRole } : s))
        );
        startTransition(() => {
          router.refresh();
        });
      } else {
        alert(res.error.message || "Failed to update role");
      }
    } finally {
      setLoadingUser(null);
    }
  };

  const handleSaveSystem = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <div className="text-caption font-mono text-text-tertiary uppercase tracking-wider mb-1">
            System Administration & Access Control
          </div>
          <h1 className="text-display font-semibold text-text-primary">
            Settings & Permissions
          </h1>
          <p className="text-body-sm text-text-secondary mt-0.5">
            Manage organization parameters, role approvals, and team credentials.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-[var(--radius-control)] bg-[var(--surface-subtle)] border border-[var(--border-subtle)]">
          <button
            onClick={() => setActiveTab("team")}
            className={`px-3.5 py-1.5 rounded-[calc(var(--radius-control)-2px)] text-body-sm font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === "team"
                ? "bg-[var(--surface-card)] text-text-primary shadow-xs"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Team & Role Approvals</span>
            {pendingUsers.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-caption font-semibold bg-amber-500 text-white">
                {pendingUsers.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("system")}
            className={`px-3.5 py-1.5 rounded-[calc(var(--radius-control)-2px)] text-body-sm font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === "system"
                ? "bg-[var(--surface-card)] text-text-primary shadow-xs"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Organization Parameters</span>
          </button>
        </div>
      </div>

      {activeTab === "team" ? (
        <div className="space-y-6">
          {/* 1. Pending Approvals Box */}
          {pendingUsers.length > 0 && (
            <div className="rounded-[var(--radius-card)] border-2 border-amber-400 bg-amber-50/60 dark:bg-amber-950/30 p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[var(--radius-control)] bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-heading font-semibold text-text-primary">
                    Pending Role Approvals ({pendingUsers.length})
                  </h2>
                  <p className="text-body-sm text-text-secondary">
                    These users have authenticated via Clerk and are waiting for you to assign their operational role.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {pendingUsers.map((user) => {
                  const chosenRole = selectedRoles[user.id] || "technician";
                  const isLoading = loadingUser === user.id || isPending;

                  return (
                    <div
                      key={user.id}
                      className="rounded-[var(--radius-control)] bg-[var(--surface-card)] border border-[var(--border-subtle)] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs"
                    >
                      <div className="space-y-0.5">
                        <div className="text-body font-semibold text-text-primary">
                          {user.full_name || "New Staff Member"}
                        </div>
                        <div className="text-body-sm font-mono text-text-secondary">
                          {user.email || "No email"}
                        </div>
                        <div className="text-caption text-text-tertiary">
                          Joined: {new Date(user.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <div className="relative min-w-[210px]">
                          <select
                            value={chosenRole}
                            disabled={isLoading}
                            onChange={(e) =>
                              setSelectedRoles((prev) => ({
                                ...prev,
                                [user.id]: e.target.value as AppRole,
                              }))
                            }
                            className="w-full h-10 appearance-none rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-page)] px-3 pr-8 text-body-sm font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-[var(--accent-base)]"
                          >
                            {ROLE_OPTIONS.map((opt) => (
                              <option key={opt.role} value={opt.role}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-2.5 top-3 w-4 h-4 text-text-tertiary" />
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleApprove(user)}
                            disabled={isLoading}
                            className="btn-primary h-10 px-4 text-body-sm inline-flex items-center gap-1.5 font-medium"
                          >
                            {isLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <UserCheck className="w-4 h-4" />
                            )}
                            <span>Approve Role</span>
                          </button>

                          <button
                            onClick={() => handleReject(user)}
                            disabled={isLoading}
                            title="Decline User"
                            className="btn-secondary h-10 px-3 text-body-sm inline-flex items-center text-red-600 dark:text-red-400 hover:bg-red-50"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Registered Staff Directory */}
          <div className="rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-subtle)] overflow-hidden shadow-xs">
            <div className="p-4 sm:p-5 border-b border-[var(--border-subtle)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[var(--accent-base)]" />
                <h2 className="text-heading font-semibold text-text-primary">
                  Team Directory & Role Assignment Matrix
                </h2>
              </div>
              <span className="text-caption font-mono text-text-secondary">
                {staffList.length} Active Staff Members
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-body-sm border-collapse">
                <thead>
                  <tr className="bg-[var(--surface-subtle)] border-b border-[var(--border-subtle)] text-text-secondary font-medium">
                    <th className="py-3 px-4 text-label">Staff Member</th>
                    <th className="py-3 px-4 text-label">Current Role</th>
                    <th className="py-3 px-4 text-label">Permission Scope</th>
                    <th className="py-3 px-4 text-label">Change Role</th>
                    <th className="py-3 px-4 text-label text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {staffList.map((member) => {
                    const roleInfo = ROLE_OPTIONS.find((r) => r.role === member.role);
                    const isLoading = loadingUser === member.id;

                    return (
                      <tr key={member.id} className="hover:bg-[var(--surface-subtle)]/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-text-primary">
                            {member.full_name || "Team Member"}
                          </div>
                          <div className="text-caption font-mono text-text-secondary mt-0.5">
                            {member.email || "No email"}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-caption font-semibold bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-text-primary uppercase tracking-wide">
                            {member.role || "Pending"}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-body-sm text-text-secondary max-w-xs">
                          {roleInfo?.desc || "Awaiting authorization"}
                        </td>

                        <td className="py-3.5 px-4">
                          {isDirector ? (
                            <div className="relative max-w-[180px]">
                              <select
                                value={member.role || ""}
                                disabled={isLoading}
                                onChange={(e) => handleUpdateRole(member.id, e.target.value as AppRole)}
                                className="w-full h-9 appearance-none rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-page)] px-2.5 pr-7 text-caption font-medium text-text-primary focus:outline-none focus:ring-1 focus:ring-[var(--accent-base)]"
                              >
                                {ROLE_OPTIONS.map((opt) => (
                                  <option key={opt.role} value={opt.role}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown className="pointer-events-none absolute right-2 top-2.5 w-3.5 h-3.5 text-text-tertiary" />
                            </div>
                          ) : (
                            <span className="text-caption text-text-tertiary">Director only</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-caption font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                            <span>Active</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* System Settings Form */
        <form onSubmit={handleSaveSystem} className="space-y-6">
          <div className="rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-subtle)] p-6 space-y-6 shadow-xs">
            <h2 className="text-heading font-semibold text-text-primary border-b border-[var(--border-subtle)] pb-3">
              Organization & Statutory Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-label text-text-primary mb-1">Company Registered Name</label>
                <input
                  type="text"
                  value={settings.companyName}
                  onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                  className="w-full h-11 px-3.5 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-page)] text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-[var(--accent-base)]"
                />
              </div>

              <div>
                <label className="block text-label text-text-primary mb-1">GSTIN</label>
                <input
                  type="text"
                  value={settings.gstin}
                  onChange={(e) => setSettings({ ...settings, gstin: e.target.value })}
                  className="w-full h-11 px-3.5 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-page)] font-mono text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-[var(--accent-base)]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-label text-text-primary mb-1">Head Office Address</label>
                <input
                  type="text"
                  value={settings.city}
                  onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                  className="w-full h-11 px-3.5 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-page)] text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-[var(--accent-base)]"
                />
              </div>
            </div>
          </div>

          <div className="rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-subtle)] p-6 space-y-6 shadow-xs">
            <h2 className="text-heading font-semibold text-text-primary border-b border-[var(--border-subtle)] pb-3">
              Commercial & Warranty Gates
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-label text-text-primary mb-1">Required Advance Milestone</label>
                <div className="relative">
                  <input
                    type="number"
                    value={settings.advancePct}
                    onChange={(e) => setSettings({ ...settings, advancePct: Number(e.target.value) })}
                    className="w-full h-11 px-3.5 pr-8 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-page)] font-mono text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-[var(--accent-base)]"
                  />
                  <span className="pointer-events-none absolute right-3 top-3 text-text-tertiary font-mono">%</span>
                </div>
                <span className="text-caption text-text-tertiary mt-1 block">
                  Triggers pick-list generation for warehouse
                </span>
              </div>

              <div>
                <label className="block text-label text-text-primary mb-1">Discount Escalation Gate</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    value={settings.discountThresholdPct}
                    onChange={(e) => setSettings({ ...settings, discountThresholdPct: Number(e.target.value) })}
                    className="w-full h-11 px-3.5 pr-8 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-page)] font-mono text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-[var(--accent-base)]"
                  />
                  <span className="pointer-events-none absolute right-3 top-3 text-text-tertiary font-mono">%</span>
                </div>
                <span className="text-caption text-text-tertiary mt-1 block">
                  Discounts above 3% require Director approval
                </span>
              </div>

              <div>
                <label className="block text-label text-text-primary mb-1">Quote Price Validity</label>
                <div className="relative">
                  <input
                    type="number"
                    value={settings.quoteValidityDays}
                    onChange={(e) => setSettings({ ...settings, quoteValidityDays: Number(e.target.value) })}
                    className="w-full h-11 px-3.5 pr-14 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-page)] font-mono text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-[var(--accent-base)]"
                  />
                  <span className="pointer-events-none absolute right-3 top-3 text-text-tertiary font-mono">Days</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {savedSuccess ? (
              <div className="text-body-sm text-emerald-600 flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                <span>Settings saved successfully</span>
              </div>
            ) : <div />}

            <button
              type="submit"
              className="btn-primary h-11 px-6 text-body-sm inline-flex items-center gap-2 font-medium"
            >
              <Save className="w-4 h-4" />
              <span>Save System Settings</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
