import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { getProfile } from "@/lib/auth/get-profile";
import type { AppRole } from "@/lib/auth/permissions";
import { connection } from "next/server";

export const instant = false;

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  const profile = await getProfile();

  const role: AppRole = (profile?.role as AppRole) || "director";
  const name = profile?.full_name || "Priya Sharma (Director)";
  const email = profile?.email || "director@demo.local";

  return (
    <AppShell initialRole={role} userName={name} userEmail={email}>
      {children}
    </AppShell>
  );
}
