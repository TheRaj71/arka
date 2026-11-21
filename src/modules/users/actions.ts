"use server";

import { defineAction } from "@/lib/actions/define-action";
import { rolesFor } from "@/lib/auth/permissions";
import { clerkClient } from "@clerk/nextjs/server";
import { z } from "zod";

export const approveUserRole = defineAction({
  name: "approveUserRole",
  roles: rolesFor("users.manage"), // Director only!
  schema: z.object({
    profile_id: z.string().uuid(),
    role: z.enum([
      "director",
      "manager",
      "sales",
      "technician",
      "warehouse",
      "support",
      "accounts",
    ]),
  }),
  revalidate: ["/dashboard", "/settings", "/notifications", "/pending-role"],
  handler: async ({ profile, db }, input) => {
    // 1. Fetch target profile
    const { data: targetProfile, error: fetchErr } = await db
      .from("profiles")
      .select("id, clerk_user_id, email, full_name, role")
      .eq("id", input.profile_id)
      .single();

    if (fetchErr || !targetProfile) {
      throw new Error("Target profile not found in database.");
    }

    // 2. Update Supabase profile role
    const { data: updatedProfile, error: updateErr } = await db
      .from("profiles")
      .update({
        role: input.role,
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.profile_id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    // 3. Update Clerk user publicMetadata if user is registered in Clerk
    if (
      targetProfile.clerk_user_id &&
      !targetProfile.clerk_user_id.startsWith("pending_")
    ) {
      try {
        const client = await clerkClient();
        await client.users.updateUserMetadata(targetProfile.clerk_user_id, {
          publicMetadata: { role: input.role },
        });
      } catch (clerkErr) {
        console.error("Clerk metadata sync error:", clerkErr);
      }
    }

    // 4. Mark pending approval notifications for this user as read
    try {
      await db
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("entity_id", input.profile_id)
        .eq("type", "role_approval_requested");
    } catch {
      // Non-blocking
    }

    // 5. Send approval confirmation notification to the newly approved user
    try {
      await db.from("notifications").insert({
        recipient_id: input.profile_id,
        type: "role_assigned",
        title: "Role Approved by Director",
        body: `Your account has been granted the ${input.role.toUpperCase()} role by Director ${profile.full_name || profile.email}.`,
        severity: "success",
        url: "/dashboard",
      });
    } catch {
      // Non-blocking
    }

    return updatedProfile;
  },
});

export const rejectUserRole = defineAction({
  name: "rejectUserRole",
  roles: rolesFor("users.manage"), // Director only!
  schema: z.object({
    profile_id: z.string().uuid(),
    reason: z.string().optional(),
  }),
  revalidate: ["/dashboard", "/settings", "/notifications"],
  handler: async ({ db }, input) => {
    const { data, error } = await db
      .from("profiles")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.profile_id)
      .select()
      .single();

    if (error) throw error;

    try {
      await db
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("entity_id", input.profile_id)
        .eq("type", "role_approval_requested");
    } catch {}

    return data;
  },
});

export const markNotificationRead = defineAction({
  name: "markNotificationRead",
  roles: [
    "director",
    "manager",
    "sales",
    "technician",
    "warehouse",
    "support",
    "accounts",
  ],
  schema: z.object({
    notification_id: z.string().uuid(),
  }),
  revalidate: ["/notifications", "/dashboard"],
  handler: async ({ profile, db }, input) => {
    const { data, error } = await db
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", input.notification_id)
      .eq("recipient_id", profile.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
});

export const markAllNotificationsRead = defineAction({
  name: "markAllNotificationsRead",
  roles: [
    "director",
    "manager",
    "sales",
    "technician",
    "warehouse",
    "support",
    "accounts",
  ],
  schema: z.object({}),
  revalidate: ["/notifications", "/dashboard"],
  handler: async ({ profile, db }) => {
    const { data, error } = await db
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("recipient_id", profile.id)
      .is("read_at", null)
      .select();

    if (error) throw error;
    return data;
  },
});

export async function checkMyRoleStatus() {
  const { getProfile } = await import("@/lib/auth/get-profile");
  const profile = await getProfile();
  return {
    hasRole: Boolean(profile?.role),
    role: profile?.role || null,
  };
}

