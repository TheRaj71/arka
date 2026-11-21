"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { type PendingUserItem } from "@/modules/users/queries";
import { type AppRole } from "@/lib/auth/permissions";
import { approveUserRole, rejectUserRole } from "@/modules/users/actions";
import {
  ShieldAlert,
  UserCheck,
  UserX,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown,
} from "lucide-react";

interface DirectorPendingApprovalsProps {
  pendingUsers: PendingUserItem[];
}

const ROLE_OPTIONS: { role: AppRole; label: string; desc: string }[] = [
  { role: "director", label: "Director (Full Admin)", desc: "Unrestricted access across all financial & operational modules" },
  { role: "manager", label: "Operations Manager", desc: "Supervises surveys, jobs, procurement & team performance" },
  { role: "sales", label: "Sales Representative", desc: "Manages leads, site visits, quotes & customer pipeline" },
  { role: "technician", label: "Field Technician", desc: "Executes roof surveys, installations & commissioning" },
  { role: "warehouse", label: "Warehouse Officer", desc: "Manages inventory, dispatches, audits & equipment serials" },
  { role: "support", label: "Customer Support", desc: "Handles customer tickets, service requests & warranties" },
  { role: "accounts", label: "Accounts Officer", desc: "Tracks invoicing, cashflow, GST, payments & audits" },
];

export function DirectorPendingApprovals({
  pendingUsers,
}: DirectorPendingApprovalsProps) {
  const router = useRouter();
  const [selectedRoles, setSelectedRoles] = useState<Record<string, AppRole>>({});
  const [loadingUser, setLoadingUser] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    id: string;
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!pendingUsers || pendingUsers.length === 0) {
    return null;
  }

  const handleSelectRole = (userId: string, role: AppRole) => {
    setSelectedRoles((prev) => ({ ...prev, [userId]: role }));
  };

  const handleApprove = async (user: PendingUserItem) => {
    const roleToAssign = selectedRoles[user.id] || "technician";
    setLoadingUser(user.id);
    setStatusMessage(null);

    try {
      const res = await approveUserRole({
        profile_id: user.id,
        role: roleToAssign,
      });

      if (res.ok) {
        setStatusMessage({
          id: user.id,
          type: "success",
          text: `Approved ${user.full_name || user.email} as ${roleToAssign.toUpperCase()}. Permissions updated!`,
        });
        startTransition(() => {
          router.refresh();
        });
      } else {
        setStatusMessage({
          id: user.id,
          type: "error",
          text: res.error.message || "Failed to approve role. Please retry.",
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error approving role";
      setStatusMessage({
        id: user.id,
        type: "error",
        text: message,
      });
    } finally {
      setLoadingUser(null);
    }
  };

  const handleReject = async (user: PendingUserItem) => {
    if (!confirm(`Are you sure you want to decline access for ${user.email || user.full_name}?`)) {
      return;
    }
    setLoadingUser(user.id);
    setStatusMessage(null);

    try {
      const res = await rejectUserRole({ profile_id: user.id });
      if (res.ok) {
        setStatusMessage({
          id: user.id,
          type: "success",
          text: `Declined access for ${user.email || user.full_name}.`,
        });
        startTransition(() => {
          router.refresh();
        });
      } else {
        setStatusMessage({
          id: user.id,
          type: "error",
          text: res.error.message || "Failed to decline role.",
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error declining role";
      setStatusMessage({
        id: user.id,
        type: "error",
        text: message,
      });
    } finally {
      setLoadingUser(null);
    }
  };

  return (
    <div className="rounded-[var(--radius-card)] border-2 border-amber-400/80 bg-amber-50/50 dark:bg-amber-950/20 p-5 shadow-xs transition-all">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[var(--radius-control)] bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-heading font-semibold text-text-primary">
                Director Action Required: Staff Role Approval
              </h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-caption font-semibold bg-amber-200/70 text-amber-900 dark:bg-amber-900/70 dark:text-amber-200">
                {pendingUsers.length} Pending
              </span>
            </div>
            <p className="text-body-sm text-text-secondary mt-0.5">
              The following newly registered staff members are awaiting role authorization before they can access SunPower operations.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {pendingUsers.map((user) => {
          const chosenRole = selectedRoles[user.id] || "technician";
          const isLoading = loadingUser === user.id || isPending;
          const userStatus = statusMessage?.id === user.id ? statusMessage : null;

          return (
            <div
              key={user.id}
              className="rounded-[var(--radius-control)] bg-[var(--surface-card)] border border-[var(--border-subtle)] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-[var(--surface-subtle)] border border-[var(--border-subtle)] flex items-center justify-center font-medium text-text-primary text-body shrink-0">
                  {user.full_name
                    ? user.full_name
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()
                    : "U"}
                </div>
                <div className="min-w-0">
                  <div className="text-body font-semibold text-text-primary truncate">
                    {user.full_name || "New Staff Member"}
                  </div>
                  <div className="text-body-sm font-mono text-text-secondary truncate">
                    {user.email || "No email provided"}
                  </div>
                  <div className="text-caption text-text-tertiary">
                    Signed up: {new Date(user.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>

              {/* Role selection & Action */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                <div className="flex flex-col gap-1 min-w-[220px]">
                  <label className="text-caption font-medium text-text-secondary">
                    Assign Role:
                  </label>
                  <div className="relative">
                    <select
                      value={chosenRole}
                      disabled={isLoading}
                      onChange={(e) => handleSelectRole(user.id, e.target.value as AppRole)}
                      className="w-full h-10 appearance-none rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-page)] px-3 pr-8 text-body-sm font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-[var(--accent-base)] transition-colors"
                    >
                      {ROLE_OPTIONS.map((opt) => (
                        <option key={opt.role} value={opt.role}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-3 w-4 h-4 text-text-tertiary" />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4 sm:pt-4">
                  <button
                    onClick={() => handleApprove(user)}
                    disabled={isLoading}
                    className="btn-primary h-10 px-4 text-body-sm inline-flex items-center justify-center gap-1.5 font-medium shrink-0"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Approving...</span>
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-4 h-4" />
                        <span>Approve Role</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleReject(user)}
                    disabled={isLoading}
                    title="Decline User"
                    className="btn-secondary h-10 px-3 text-body-sm inline-flex items-center justify-center text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 shrink-0"
                  >
                    <UserX className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {userStatus && (
                <div
                  className={`w-full mt-2 p-2.5 rounded-[var(--radius-control)] text-body-sm flex items-center gap-2 ${
                    userStatus.type === "success"
                      ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200 border border-emerald-200"
                      : "bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-200 border border-red-200"
                  }`}
                >
                  {userStatus.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{userStatus.text}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
