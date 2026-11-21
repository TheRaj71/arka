import "server-only";
import { auth } from "@clerk/nextjs/server";
import { cache } from "react";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type AppRole =
  | "director"
  | "manager"
  | "sales"
  | "warehouse"
  | "technician"
  | "support"
  | "accounts";

export type Profile = {
  id: string;
  clerk_user_id: string;
  full_name: string;
  email: string | null;
  role: AppRole | null;
  is_active: boolean;
};

/**
 * Get the current user's profile from the database
 * Returns null if not authenticated or profile doesn't exist
 * Cached per request
 */
export const getProfile = cache(async (): Promise<Profile | null> => {
  const { userId } = await auth();
  if (!userId) return null;

  const { data } = await supabaseAdmin()
    .from("profiles")
    .select("id, clerk_user_id, full_name, email, role, is_active")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  return (data as Profile) ?? null;
});
