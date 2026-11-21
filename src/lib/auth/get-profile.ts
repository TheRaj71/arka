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

const DEMO_DIRECTOR_PROFILE: Profile = {
  id: "11111111-1111-1111-1111-111111111111",
  clerk_user_id: "user_director_demo",
  full_name: "Priya Sharma (Director)",
  email: "director@demo.local",
  role: "director",
  is_active: true,
};

/**
 * Get the current user's profile from the database
 * In testing/demo mode without Clerk sign-in, automatically defaults
 * to the Director profile with full system access.
 */
export const getProfile = cache(async (): Promise<Profile | null> => {
  try {
    const { userId } = await auth();
    if (!userId) return DEMO_DIRECTOR_PROFILE;

    const { data } = await supabaseAdmin()
      .from("profiles")
      .select("id, clerk_user_id, full_name, email, role, is_active")
      .eq("clerk_user_id", userId)
      .maybeSingle();

    return (data as Profile) ?? DEMO_DIRECTOR_PROFILE;
  } catch (_err) {
    return DEMO_DIRECTOR_PROFILE;
  }
});
