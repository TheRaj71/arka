"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type NotificationRecord, type PendingUserItem } from "@/modules/users/queries";
import { type AppRole } from "@/lib/auth/permissions";
import {
  markNotificationRead,
  markAllNotificationsRead,
  approveUserRole,
  rejectUserRole,
} from "@/modules/users/actions";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  ArrowRight,
  ShieldAlert,
  UserCheck,
  UserX,
  Loader2,
  Check,
  ChevronDown,
} from "lucide-react";

interface NotificationsClientProps {
  initialNotifications: NotificationRecord[];
  pendingUsers: PendingUserItem[];
  isDirector: boolean;
}

const ROLE_OPTIONS: { role: AppRole; label: string }[] = [
  { role: "director", label: "Director (Full Admin)" },
  { role: "manager", label: "Operations Manager" },
  { role: "sales", label: "Sales Representative" },
  { role: "technician", label: "Field Technician" },
  { role: "warehouse", label: "Warehouse Officer" },
  { role: "support", label: "Customer Support" },
  { role: "accounts", label: "Accounts Officer" },
];

export function NotificationsClient({
  initialNotifications,
  pendingUsers,
  isDirector,
}: NotificationsClientProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationRecord[]>(initialNotifications);
  const [selectedRoles, setSelectedRoles] = useState<Record<string, AppRole>>({});
  const [loadingUser, setLoadingUser] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const unreadCount = notifications.filter((n) => !n.read_at).length + (isDirector ? pendingUsers.length : 0);

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead({});
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: new Date().toISOString() }))
      );
      startTransition(() => {
        router.refresh();
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkOneRead = async (id: string) => {
    try {
      await markNotificationRead({ notification_id: id });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
      );
      startTransition(() => {
        router.refresh();
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleApprove = async (user: PendingUserItem) => {
    const roleToAssign = selectedRoles[user.id] || "technician";
    setLoadingUser(user.id);
    try {
      const res = await approveUserRole({
        profile_id: user.id,
        role: roleToAssign,
      });
      if (res.ok) {
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
    if (!confirm(`Decline access for ${user.email || user.full_name}?`)) return;
    setLoadingUser(user.id);
    try {
      const res = await rejectUserRole({ profile_id: user.id });
      if (res.ok) {
        startTransition(() => {
          router.refresh();
        });
      } else {
        alert(res.error.message || "Failed to decline role");
      }
    } finally {
      setLoadingUser(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <div className="text-caption font-mono text-text-tertiary uppercase tracking-wider mb-1">
            System Alerts & Operational Feeds
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-display font-semibold text-text-primary">
              Realtime Notification Center
            </h1>
            {unreadCount > 0 ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-caption font-semibold bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                {unreadCount} Unread
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-caption font-medium bg-[var(--surface-subtle)] text-text-secondary border border-[var(--border-subtle)]">
                All caught up
              </span>
            )}
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="btn-secondary h-10 px-4 text-body-sm inline-flex items-center gap-2 self-start sm:self-auto"
          >
            <Check className="w-4 h-4 text-text-secondary" />
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      {/* 1. Director Action Required Section: Pending Role Approvals */}
      {isDirector && pendingUsers.length > 0 && (
        <div className="rounded-[var(--radius-card)] border-2 border-amber-400/80 bg-amber-50/50 dark:bg-amber-950/20 p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[var(--radius-control)] bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-heading font-semibold text-text-primary">
                Pending Staff Role Authorizations ({pendingUsers.length})
              </h2>
              <p className="text-body-sm text-text-secondary">
                Select an operational role and authorize access for newly registered staff members.
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
                  className="rounded-[var(--radius-control)] bg-[var(--surface-card)] border border-[var(--border-subtle)] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
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
                    <div>
                      <div className="text-body font-semibold text-text-primary">
                        {user.full_name || "New Staff Member"}
                      </div>
                      <div className="text-body-sm font-mono text-text-secondary">
                        {user.email || "No email"}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="relative min-w-[200px]">
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
                        className="btn-primary h-10 px-4 text-body-sm inline-flex items-center gap-1.5"
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <UserCheck className="w-4 h-4" />
                        )}
                        <span>Approve</span>
                      </button>

                      <button
                        onClick={() => handleReject(user)}
                        disabled={isLoading}
                        title="Decline"
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

      {/* 2. Notification List */}
      <div className="space-y-3">
        {notifications.length === 0 && pendingUsers.length === 0 ? (
          <div className="rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-subtle)] p-12 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-[var(--surface-subtle)] text-text-tertiary mx-auto flex items-center justify-center">
              <Bell className="w-6 h-6" />
            </div>
            <h3 className="text-heading font-semibold text-text-primary">
              No notifications yet
            </h3>
            <p className="text-body-sm text-text-secondary">
              Operational updates, automated alerts, and role requests will appear here.
            </p>
          </div>
        ) : (
          notifications.map((n) => {
            const isUnread = !n.read_at;

            const iconMap = {
              action_required: (
                <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
              ),
              warning: (
                <AlertTriangle className="w-5 h-5 text-amber-500 dark:text-amber-400 shrink-0" />
              ),
              success: (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ),
              info: (
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
              ),
            };

            return (
              <div
                key={n.id}
                className={`group rounded-[var(--radius-card)] border p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isUnread
                    ? "bg-[var(--surface-card)] border-[var(--accent-base)]/40 shadow-xs"
                    : "bg-[var(--surface-subtle)]/50 border-[var(--border-subtle)] opacity-80 hover:opacity-100"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{iconMap[n.severity] || iconMap.info}</div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-body font-semibold text-text-primary">
                        {n.title}
                      </span>
                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-[var(--accent-base)] shrink-0" />
                      )}
                    </div>
                    {n.body && (
                      <p className="text-body-sm text-text-secondary leading-relaxed">
                        {n.body}
                      </p>
                    )}
                    <div className="text-caption font-mono text-text-tertiary">
                      {new Date(n.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {n.url && (
                    <Link
                      href={n.url}
                      className="btn-secondary h-9 px-3 text-body-sm inline-flex items-center gap-1.5"
                    >
                      <span>View</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                  {isUnread && (
                    <button
                      onClick={() => handleMarkOneRead(n.id)}
                      className="btn-secondary h-9 px-3 text-body-sm text-text-tertiary hover:text-text-primary"
                      title="Mark as read"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
