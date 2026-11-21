import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";
import type { Database } from "@/types/database";

/**
 * Creates a Supabase client that acts as the logged-in user
 * Uses Clerk session token for authentication
 * RLS policies are enforced
 */
export async function supabaseAsUser() {
  const { getToken } = await auth();
  const token = await getToken({ template: "supabase" });
  
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      },
    }
  );
}
