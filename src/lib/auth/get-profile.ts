import "server-only";
import { auth, clerkClient } from "@clerk/nextjs/server";
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
 * Get the current user's profile from the database.
 * Syncs automatically with Clerk user session and provisions/links profiles
 * if the user was just created or webhook hasn't fired yet.
 */
export const getProfile = cache(async (): Promise<Profile | null> => {
  try {
    const { userId } = await auth();
    if (!userId) return null;

    const db = supabaseAdmin();

    // 1. Check if profile exists by Clerk user ID
    const { data: existingProfile } = await db
      .from("profiles")
      .select("id, clerk_user_id, full_name, email, role, is_active")
      .eq("clerk_user_id", userId)
      .maybeSingle();

    if (existingProfile) {
      return existingProfile as Profile;
    }

    // 2. Not found: fetch details from Clerk to link or auto-provision
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const email = clerkUser.emailAddresses[0]?.emailAddress ?? null;
    const fullName =
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
      email ||
      "Staff Member";

    // Check if an existing profile exists with this email (e.g. seeded user)
    if (email) {
      const { data: profileByEmail } = await db
        .from("profiles")
        .select("id, clerk_user_id, full_name, email, role, is_active")
        .eq("email", email)
        .maybeSingle();

      if (profileByEmail) {
        await db
          .from("profiles")
          .update({
            clerk_user_id: userId,
            full_name: fullName,
          })
          .eq("id", profileByEmail.id);

        if (profileByEmail.role) {
          try {
            await client.users.updateUserMetadata(userId, {
              publicMetadata: { role: profileByEmail.role },
            });
          } catch {
            // Ignore metadata update error
          }
        }

        return {
          ...profileByEmail,
          clerk_user_id: userId,
          full_name: fullName,
        } as Profile;
      }
    }

    // Determine initial role
    const bootstrapEmails = (process.env.BOOTSTRAP_DIRECTOR_EMAIL || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    const isBootstrap = Boolean(email && bootstrapEmails.includes(email.toLowerCase()));

    const metaRole = clerkUser.publicMetadata?.role as AppRole | undefined;
    const initialRole: AppRole | null = isBootstrap ? "director" : (metaRole ?? null);

    const { data: newProfile, error } = await db
      .from("profiles")
      .insert({
        clerk_user_id: userId,
        full_name: fullName,
        email,
        role: initialRole,
        is_active: true,
      })
      .select("id, clerk_user_id, full_name, email, role, is_active")
      .single();

    if (error) {
      console.error("Error creating profile for Clerk user:", error);
      return null;
    }

    if (initialRole) {
      try {
        await client.users.updateUserMetadata(userId, {
          publicMetadata: { role: initialRole },
        });
      } catch {
        // Ignore metadata update error
      }
    }

    return newProfile as Profile;
  } catch (err: unknown) {
    // Next.js PPR / Static Prerendering bailout
    const digest = (err as { digest?: string })?.digest;
    if (digest === "HANGING_PROMISE_REJECTION" || digest?.startsWith("NEXT_")) {
      throw err;
    }
    console.error("getProfile error:", err);
    return null;
  }
});
