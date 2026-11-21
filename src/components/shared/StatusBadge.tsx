import * as React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface StatusBadgeProps {
  status: string | null | undefined;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const statusMap: Record<string, { label: string; color: string; dotColor: string }> = {
  // Common / general
  active: { label: "Active", color: "bg-emerald-50 text-emerald-700 border-emerald-200/60", dotColor: "bg-emerald-500" },
  completed: { label: "Completed", color: "bg-emerald-50 text-emerald-700 border-emerald-200/60", dotColor: "bg-emerald-500" },
  approved: { label: "Approved", color: "bg-emerald-50 text-emerald-700 border-emerald-200/60", dotColor: "bg-emerald-500" },
  paid: { label: "Paid", color: "bg-emerald-50 text-emerald-700 border-emerald-200/60", dotColor: "bg-emerald-500" },
  confirmed: { label: "Confirmed", color: "bg-blue-50 text-blue-700 border-blue-200/60", dotColor: "bg-blue-500" },
  in_progress: { label: "In Progress", color: "bg-sky-50 text-sky-700 border-sky-200/60", dotColor: "bg-sky-500" },
  in_transit: { label: "In Transit", color: "bg-amber-50 text-amber-700 border-amber-200/60", dotColor: "bg-amber-500" },
  delivered: { label: "Delivered", color: "bg-teal-50 text-teal-700 border-teal-200/60", dotColor: "bg-teal-500" },
  installed: { label: "Installed", color: "bg-emerald-50 text-emerald-700 border-emerald-200/60", dotColor: "bg-emerald-500" },
  scheduled: { label: "Scheduled", color: "bg-indigo-50 text-indigo-700 border-indigo-200/60", dotColor: "bg-indigo-500" },
  submitted: { label: "Submitted", color: "bg-violet-50 text-violet-700 border-violet-200/60", dotColor: "bg-violet-500" },
  sent: { label: "Sent", color: "bg-sky-50 text-sky-700 border-sky-200/60", dotColor: "bg-sky-500" },
  new: { label: "New", color: "bg-blue-50 text-blue-700 border-blue-200/60", dotColor: "bg-blue-500" },
  draft: { label: "Draft", color: "bg-slate-50 text-slate-600 border-slate-200/60", dotColor: "bg-slate-400" },
  pending: { label: "Pending", color: "bg-amber-50 text-amber-700 border-amber-200/60", dotColor: "bg-amber-500" },
  pending_payment: { label: "Pending Payment", color: "bg-amber-50 text-amber-700 border-amber-200/60", dotColor: "bg-amber-500" },
  pending_approval: { label: "Needs Approval", color: "bg-purple-50 text-purple-700 border-purple-200/60", dotColor: "bg-purple-500" },
  follow_up: { label: "Follow-up", color: "bg-amber-50 text-amber-700 border-amber-200/60", dotColor: "bg-amber-500" },
  contacting: { label: "Contacting", color: "bg-blue-50 text-blue-700 border-blue-200/60", dotColor: "bg-blue-500" },
  converted: { label: "Qualified / Converted", color: "bg-emerald-50 text-emerald-700 border-emerald-200/60", dotColor: "bg-emerald-500" },
  open: { label: "Open", color: "bg-blue-50 text-blue-700 border-blue-200/60", dotColor: "bg-blue-500" },
  in_warranty: { label: "In Warranty (Free)", color: "bg-emerald-50 text-emerald-700 border-emerald-200/60", dotColor: "bg-emerald-500" },
  out_of_warranty: { label: "Out of Warranty (Billable)", color: "bg-amber-50 text-amber-700 border-amber-200/60", dotColor: "bg-amber-500" },
  expiring_soon: { label: "Expiring Soon", color: "bg-amber-50 text-amber-700 border-amber-200/60", dotColor: "bg-amber-500" },
  expired: { label: "Expired", color: "bg-rose-50 text-rose-700 border-rose-200/60", dotColor: "bg-rose-500" },
  void: { label: "Void", color: "bg-rose-50 text-rose-700 border-rose-200/60", dotColor: "bg-rose-500" },
  rejected: { label: "Rejected", color: "bg-rose-50 text-rose-700 border-rose-200/60", dotColor: "bg-rose-500" },
  cancelled: { label: "Cancelled", color: "bg-rose-50 text-rose-700 border-rose-200/60", dotColor: "bg-rose-500" },
  lost: { label: "Lost", color: "bg-slate-100 text-slate-700 border-slate-200", dotColor: "bg-slate-400" },
  disqualified: { label: "Disqualified", color: "bg-slate-100 text-slate-700 border-slate-200", dotColor: "bg-slate-400" },
  unreachable: { label: "Unreachable", color: "bg-slate-100 text-slate-700 border-slate-200", dotColor: "bg-slate-400" },
  on_hold: { label: "On Hold", color: "bg-amber-50 text-amber-700 border-amber-200/60", dotColor: "bg-amber-500" },
  offline: { label: "Offline", color: "bg-slate-100 text-slate-600 border-slate-200", dotColor: "bg-slate-400" },
};

export function StatusBadge({ status, size = "md", className }: StatusBadgeProps) {
  if (!status) return null;
  const key = status.toLowerCase();
  const info = statusMap[key] || {
    label: status.replace(/_/g, " "),
    color: "bg-slate-50 text-slate-700 border-slate-200",
    dotColor: "bg-slate-400",
  };

  return (
    <span
      className={twMerge(
        clsx(
          "inline-flex items-center gap-1.5 font-medium rounded-full border shadow-xs transition-colors",
          info.color,
          {
            "px-2 py-0.5 text-xs": size === "sm",
            "px-2.5 py-1 text-xs": size === "md",
            "px-3 py-1.5 text-sm": size === "lg",
          },
          className
        )
      )}
    >
      <span className={clsx("h-1.5 w-1.5 rounded-full shrink-0", info.dotColor)} />
      <span className="capitalize">{info.label}</span>
    </span>
  );
}
