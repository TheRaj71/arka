import { getProfile } from "@/lib/auth/get-profile";
import { UserButton } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { ShieldAlert, ArrowRight, Sun, Shield } from "lucide-react";
import { PendingRolePoller } from "./PendingRolePoller";

async function PendingRoleContent() {
  const profile = await getProfile();

  // If they have a role assigned, redirect straight to dashboard
  if (profile?.role) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--surface-page)] p-4 text-text-primary">
      <div className="w-full max-w-lg rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-subtle)] p-8 shadow-xs text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-[var(--radius-control)] bg-[var(--accent-subtle)] text-[var(--accent-base)] flex items-center justify-center">
            <Shield className="w-7 h-7" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-display font-semibold text-text-primary">
            Account Pending Approval
          </h1>
          <p className="text-body text-text-secondary">
            Welcome to SunPower Solutions. Your account is authenticated, but an operations role has not yet been assigned by a Director.
          </p>
        </div>

        <div className="rounded-[var(--radius-control)] bg-[var(--surface-subtle)] border border-[var(--border-subtle)] p-4 text-body-sm text-text-secondary text-left space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-caption text-text-tertiary">Authenticated Email:</span>
            <span className="font-mono font-semibold text-text-primary">
              {profile?.email || "Not available"}
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-2">
            <span className="text-caption text-text-tertiary">Approval Request:</span>
            <span className="text-caption font-medium text-amber-600 dark:text-amber-400">
              Delivered to Company Directors
            </span>
          </div>
        </div>

        {/* Realtime status poller & check status button */}
        <PendingRolePoller />

        <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserButton />
            <span className="text-caption text-text-secondary">Manage Account</span>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-body-sm text-[var(--accent-base)] font-medium hover:underline"
          >
            <span>Try Workspace</span>
            <ArrowRight className="w-4 h-4" />
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
