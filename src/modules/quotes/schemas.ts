import { z } from "zod";

export const createQuoteSchema = z.object({
  project_id: z.string().uuid("Valid project ID required"),
  template_id: z.string().uuid("Valid package template required"),
  discount_paise: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
});

export const sendQuoteSchema = z.object({
  quote_id: z.string().uuid("Valid quote ID required"),
});

export const acceptQuoteSchema = z.object({
  quote_id: z.string().uuid("Valid quote ID required"),
  customer_name: z.string().min(2, "Customer name required"),
});

export const publicAcceptQuoteSchema = z.object({
  token: z.string().min(10, "Valid token required"),
  name: z.string().min(2, "Please enter your full name to accept"),
});

export type CreateQuoteInput = z.infer<typeof createQuoteSchema>;
export type SendQuoteInput = z.infer<typeof sendQuoteSchema>;
export type AcceptQuoteInput = z.infer<typeof acceptQuoteSchema>;
export type PublicAcceptQuoteInput = z.infer<typeof publicAcceptQuoteSchema>;
