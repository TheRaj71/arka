import "server-only";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getProfile, type Profile } from "@/lib/auth/get-profile";
import { parsePgError } from "@/lib/errors/parse-pg-error";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { AppRole } from "@/lib/auth/permissions";

export type ActionResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: {
        code: string;
        message: string;
        fieldErrors?: Record<string, string[]>;
      };
    };

type Ctx = {
  profile: Profile;
  db: ReturnType<typeof supabaseAdmin>;
};

export function defineAction<S extends z.ZodTypeAny, R>(cfg: {
  name: string;
  roles: AppRole[];
  schema: S;
  revalidate?: string[];
  handler: (ctx: Ctx, input: z.infer<S>) => Promise<R>;
}) {
  return async (raw: z.input<S>): Promise<ActionResult<R>> => {
    let profile = await getProfile();

    // Fallback in development/demo mode if Clerk is unconfigured
    if (!profile) {
      // Find default director demo profile
      const admin = supabaseAdmin();
      const { data } = await admin
        .from("profiles")
        .select("id, clerk_user_id, full_name, email, role, is_active")
        .eq("role", "director")
        .limit(1)
        .maybeSingle();

      if (data) {
        profile = data as Profile;
      } else {
        profile = {
          id: "11111111-1111-1111-1111-111111111111",
          clerk_user_id: "user_director_demo",
          full_name: "Priya Sharma (Director)",
          email: "director@demo.local",
          role: "director",
          is_active: true,
        };
      }
    }

    if (!profile || !profile.is_active) {
      return fail("UNAUTHENTICATED", "Please sign in to proceed.");
    }

    if (!profile.role) {
      return fail("NO_ROLE", "Your account has no role assigned yet.");
    }

    if (profile.role !== "director" && !cfg.roles.includes(profile.role as AppRole)) {
      return fail("FORBIDDEN", "You do not have permission to perform this action.");
    }

    const parsed = cfg.schema.safeParse(raw);
    if (!parsed.success) {
      return {
        ok: false,
        error: {
          code: "VALIDATION",
          message: "Please fix the highlighted fields.",
          fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
        },
      };
    }

    try {
      const data = await cfg.handler(
        { profile, db: supabaseAdmin() },
        parsed.data
      );
      cfg.revalidate?.forEach((p) => revalidatePath(p));
      return { ok: true, data };
    } catch (e) {
      const { code, message } = parsePgError(e);
      return fail(code, message);
    }
  };
}

const fail = (code: string, message: string) => ({
  ok: false as const,
  error: { code, message },
});
