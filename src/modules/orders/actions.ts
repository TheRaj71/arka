"use server";

import { defineAction } from "@/lib/actions/define-action";
import { rolesFor } from "@/lib/auth/permissions";
import { randomUUID } from "crypto";
import {
  recordPaymentSchema,
  confirmOrderSchema,
  cancelOrderSchema,
} from "./schemas";

/**
 * Record Advance or Balance Payment (Idempotent, UTR unique)
 * Automation A6: If paid >= advance_required_paise, Order automatically confirms,
 * stock is reserved, pick-list created, and installation job dispatched!
 */
export const recordOrderPayment = defineAction({
  name: "recordOrderPayment",
  roles: rolesFor("payment.record"),
  schema: recordPaymentSchema,
  revalidate: ["/orders", "/payments", "/warehouse", "/schedule", "/field"],
  handler: async ({ profile, db }, input) => {
    const idempotencyKey = randomUUID();

    const { data, error } = await (db as any).rpc("fn_record_payment", {
      p_actor: profile.id,
      p_order_id: input.order_id || null,
      p_ticket_id: input.ticket_id || null,
      p_amount_paise: input.amount_paise,
      p_method: input.method,
      p_reference: input.reference,
      p_received_at: input.received_at ? new Date(input.received_at).toISOString() : new Date().toISOString(),
      p_idempotency_key: idempotencyKey,
      p_notes: input.notes || null,
    });

    if (error) throw error;
    return data as {
      ok: boolean;
      payment_id: string;
      payment_no: string;
      order_confirmed: boolean;
      already_recorded?: boolean;
    };
  },
});

/**
 * Force or manual order confirmation (Manager / Director)
 */
export const confirmOrder = defineAction({
  name: "confirmOrder",
  roles: rolesFor("order.force_confirm"),
  schema: confirmOrderSchema,
  revalidate: ["/orders", "/warehouse", "/schedule", "/field"],
  handler: async ({ profile, db }, input) => {
    const { data, error } = await (db as any).rpc("fn_confirm_order", {
      p_actor: profile.id,
      p_order_id: input.order_id,
      p_force: input.force,
      p_force_reason: input.force_reason || null,
    });

    if (error) throw error;
    return data as { ok: boolean; already_confirmed?: boolean };
  },
});

/**
 * Cancel order: releases stock reservations, cancels pick-list & installation job, computes refund
 */
export const cancelOrder = defineAction({
  name: "cancelOrder",
  roles: rolesFor("order.cancel"),
  schema: cancelOrderSchema,
  revalidate: ["/orders", "/inventory", "/schedule"],
  handler: async ({ profile, db }, input) => {
    const { data, error } = await (db as any).rpc("fn_cancel_order", {
      p_actor: profile.id,
      p_order_id: input.order_id,
      p_reason: input.reason,
    });

    if (error) throw error;
    return data as { ok: boolean; refund_due_paise: number };
  },
});
