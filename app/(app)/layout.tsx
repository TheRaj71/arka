import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { getProfile } from "@/lib/auth/get-profile";
import type { AppRole } from "@/lib/auth/permissions";
import { supabaseAdmin } from "@/lib/supabase/admin";
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

  let unreadCount = 0;
  if (profile) {
    try {
      const db = supabaseAdmin();
      const { count: notifCount } = await db
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("recipient_id", profile.id)
        .is("read_at", null);

      let pendingCount = 0;
      if (role === "director") {
        const { count } = await db
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .is("role", null);
        pendingCount = count || 0;
      }
      unreadCount = (notifCount || 0) + pendingCount;
    } catch {
      // Non-blocking
    }
  }

  return (
    <AppShell
      initialRole={role}
      userName={name}
      userEmail={email}
      unreadNotifications={unreadCount}
    >
      {children}
    </AppShell>
  );
}
