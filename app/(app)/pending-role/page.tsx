import { getProfile } from "@/lib/auth/get-profile";
import { UserButton } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { ShieldAlert, ArrowRight, Sun } from "lucide-react";

async function PendingRoleContent() {
  const profile = await getProfile();

  // If they have a role assigned, redirect straight to dashboard
  if (profile?.role) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--surface-page)] p-4 text-text-primary">
      <div className="w-full max-w-md rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-subtle)] p-8 shadow-xs text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-[var(--radius-control)] bg-[var(--accent-subtle)] text-[var(--accent-base)] flex items-center justify-center">
            <Sun className="w-6 h-6" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-title font-semibold text-text-primary">
            Account Pending Role Assignment
          </h1>
          <p className="text-body-sm text-text-secondary">
            Welcome to SunPower Solutions. Your account is authenticated, but an operations role has not yet been assigned by your system administrator.
          </p>
        </div>

        <div className="rounded-[var(--radius-control)] bg-[var(--surface-subtle)] border border-[var(--border-subtle)] p-4 text-body-sm text-text-secondary text-left space-y-1.5">
          <div className="text-caption text-text-tertiary">Authenticated Email:</div>
          <div className="font-mono font-semibold text-text-primary text-body-sm">
            {profile?.email || "Not available"}
          </div>
        </div>

        <p className="text-caption text-text-tertiary">
          Available roles: Director, Manager, Sales, Warehouse, Field Technician, Support, or Accounts. Once assigned, refresh this page to access your workspace.
        </p>

        <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserButton />
            <span className="text-caption text-text-secondary">Manage Account</span>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-body-sm text-[var(--accent-base)] font-medium hover:underline"
          >
            <span>Refresh Workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PendingRolePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-text-tertiary">Loading...</div>}>
      <PendingRoleContent />
    </Suspense>
  );
}
