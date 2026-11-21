"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { checkMyRoleStatus } from "@/modules/users/actions";
import { Loader2, RefreshCw, CheckCircle2 } from "lucide-react";

export function PendingRolePoller() {
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const [approvedRole, setApprovedRole] = useState<string | null>(null);

  const checkStatus = async () => {
    setChecking(true);
    try {
      const res = await checkMyRoleStatus();
      if (res.hasRole) {
        setApprovedRole(res.role);
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1200);
      }
    } catch {
      // Ignore polling errors
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    // Poll every 5 seconds
    const interval = setInterval(() => {
      checkStatus();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  if (approvedRole) {
    return (
      <div className="rounded-[var(--radius-control)] bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-4 text-center space-y-2 animate-in fade-in">
        <div className="flex items-center justify-center gap-2 text-emerald-700 dark:text-emerald-300 font-semibold text-body">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>Role Approved: {approvedRole.toUpperCase()}!</span>
        </div>
        <p className="text-caption text-emerald-600 dark:text-emerald-400">
          Redirecting you to the operations workspace...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-center gap-2 text-caption text-text-tertiary">
        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        <span>Waiting for Director approval · Auto-checking in background</span>
      </div>

      <button
        onClick={checkStatus}
        disabled={checking}
        className="w-full h-10 px-4 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] text-body-sm font-medium text-text-primary inline-flex items-center justify-center gap-2 transition-colors"
      >
        <RefreshCw className={`w-4 h-4 text-text-secondary ${checking ? "animate-spin" : ""}`} />
        <span>{checking ? "Verifying..." : "Check Approval Status"}</span>
      </button>
    </div>
  );
}
