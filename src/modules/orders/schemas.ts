import { z } from "zod";

export const recordPaymentSchema = z.object({
  order_id: z.string().uuid("Valid order ID required").optional(),
  ticket_id: z.string().uuid("Valid ticket ID required").optional(),
  amount_paise: z.coerce.number().min(100, "Amount must be at least ₹1 (100 paise)"),
  method: z.enum(["bank_transfer", "upi", "cheque", "cash", "card"]).default("bank_transfer"),
  reference: z.string().min(3, "Payment reference (UTR / Cheque #) required"),
  received_at: z.string().optional(),
  notes: z.string().optional(),
});

export const confirmOrderSchema = z.object({
  order_id: z.string().uuid("Valid order ID required"),
  force: z.boolean().default(false),
  force_reason: z.string().optional(),
});

export const cancelOrderSchema = z.object({
  order_id: z.string().uuid("Valid order ID required"),
  reason: z.string().min(5, "Reason for order cancellation required"),
});

export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
export type ConfirmOrderInput = z.infer<typeof confirmOrderSchema>;
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;
