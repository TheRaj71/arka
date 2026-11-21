import { supabaseAdmin } from "@/lib/supabase/admin";
import { type AppRole } from "@/lib/auth/permissions";

export interface PendingUserItem {
  id: string;
  clerk_user_id: string;
  email: string | null;
  full_name: string;
  role: AppRole | null;
  created_at: string;
}

export interface StaffProfileItem {
  id: string;
  clerk_user_id: string;
  email: string | null;
  full_name: string;
  role: AppRole | null;
  is_active: boolean;
  created_at: string;
}

export interface NotificationRecord {
  id: string;
  recipient_id: string;
  type: string;
  title: string;
  body: string | null;
  entity_type: string | null;
  entity_id: string | null;
  url: string | null;
  severity: "info" | "success" | "warning" | "action_required";
  read_at: string | null;
  created_at: string;
}

/**
 * Fetch all pending staff members awaiting role approval from a Director
 */
export async function getPendingRoleUsers(): Promise<PendingUserItem[]> {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("profiles")
    .select("id, clerk_user_id, email, full_name, role, created_at")
    .is("role", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching pending role users:", error);
    return [];
  }

  return (data || []) as PendingUserItem[];
}

/**
 * Fetch all registered staff profiles
 */
export async function getAllStaffProfiles(): Promise<StaffProfileItem[]> {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("profiles")
    .select("id, clerk_user_id, email, full_name, role, is_active, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching staff profiles:", error);
    return [];
  }

  return (data || []) as StaffProfileItem[];
}

/**
 * Fetch notifications for a given profile
 */
export async function getUserNotifications(profileId: string): Promise<NotificationRecord[]> {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("notifications")
    .select("id, recipient_id, type, title, body, entity_type, entity_id, url, severity, read_at, created_at")
    .eq("recipient_id", profileId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }

  return (data || []) as NotificationRecord[];
}
