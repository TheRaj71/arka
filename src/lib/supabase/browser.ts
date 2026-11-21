"use client";

import { createClient } from "@supabase/supabase-js";
import { useSession } from "@clerk/nextjs";
import { useMemo } from "react";
import * as React from "react";
import type { Database } from "@/types/database";

/**
 * Browser Supabase client for Realtime subscriptions and direct uploads
 * Uses Clerk session token for authentication
 */
export function useSupabaseBrowser() {
  const { session } = useSession();
  const [token, setToken] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (session) {
      session.getToken({ template: "supabase" }).then(setToken);
    }
  }, [session]);

  return useMemo(
    () =>
      createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: token ? `Bearer ${token}` : "",
            },
          },
        }
      ),
    [token]
  );
}
