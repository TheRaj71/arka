"use server";

import { defineAction } from "@/lib/actions/define-action";
import { rolesFor } from "@/lib/auth/permissions";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  createQuoteSchema,
  sendQuoteSchema,
  acceptQuoteSchema,
  publicAcceptQuoteSchema,
  type PublicAcceptQuoteInput,
} from "./schemas";

/**
 * Generate official BOM quote from approved survey + template
 */
export const createQuote = defineAction({
  name: "createQuote",
  roles: rolesFor("quote.create"),
  schema: createQuoteSchema,
  revalidate: ["/quotes", "/projects"],
  handler: async ({ profile, db }, input) => {
    const { data, error } = await (db as any).rpc("fn_create_quote", {
      p_actor: profile.id,
      p_project_id: input.project_id,
      p_template_id: input.template_id,
      p_options: {
        discount_paise: input.discount_paise,
        notes: input.notes,
      },
    });

    if (error) throw error;
    return data as {
      ok: boolean;
      quote_id: string;
      quote_no: string;
      total_paise: number;
      subsidy_paise: number;
      net_cost_paise: number;
      approval_required: boolean;
    };
  },
});

/**
 * Send quote to customer (generates public acceptance link /q/[token])
 */
export const sendQuote = defineAction({
  name: "sendQuote",
  roles: rolesFor("quote.send"),
  schema: sendQuoteSchema,
  revalidate: ["/quotes"],
  handler: async ({ profile, db }, input) => {
    const { data, error } = await (db as any).rpc("fn_send_quote", {
      p_actor: profile.id,
      p_quote_id: input.quote_id,
    });

    if (error) throw error;
    return data as { ok: boolean; token: string; url: string };
  },
});

/**
 * Staff manual quote acceptance
 */
export const acceptQuote = defineAction({
  name: "acceptQuote",
  roles: rolesFor("quote.send"),
  schema: acceptQuoteSchema,
  revalidate: ["/quotes", "/orders", "/projects"],
  handler: async ({ profile, db }, input) => {
    const { data, error } = await (db as any).rpc("fn_accept_quote", {
      p_actor: profile.id,
      p_quote_id: input.quote_id,
      p_name: input.customer_name,
    });

    if (error) throw error;
    return data as { ok: boolean; order_id: string; order_no: string };
  },
});

/**
 * Customer public quote acceptance (unauthenticated)
 */
export async function publicAcceptQuote(input: PublicAcceptQuoteInput) {
  const parsed = publicAcceptQuoteSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: { code: "VALIDATION", message: "Please enter your name to confirm acceptance." },
    };
  }

  const db = supabaseAdmin();
  const { data, error } = await (db as any).rpc("fn_public_accept_quote", {
    p_token: parsed.data.token,
    p_name: parsed.data.name,
  });

  if (error) {
    return {
      ok: false as const,
      error: { code: error.code || "ACCEPT_ERROR", message: error.message },
    };
  }

  return {
    ok: true as const,
    data: data as { order_id: string; already_accepted?: boolean },
  };
}
