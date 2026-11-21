import { z } from "zod";

export const checkWarrantySchema = z.object({
  query: z.string().min(2, "Search query required (serial, phone, or name)"),
});

export const createTicketSchema = z.object({
  asset_id: z.string().uuid().optional(),
  serial_no: z.string().optional(),
  customer_id: z.string().uuid().optional(),
  fault_code: z.string().default("ERR_INV_GRID_FAIL"),
  description: z.string().min(5, "Please describe the symptoms observed"),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  channel: z.enum(["phone", "whatsapp", "portal", "email"]).default("phone"),
});

export const confirmTicketSchema = z.object({
  ticket_id: z.string().uuid("Valid ticket ID required"),
  notes: z.string().optional(),
});

export const timeTravelSchema = z.object({
  serial_no: z.string().min(3),
  months_to_advance: z.number().int().min(1).max(360).default(18),
});

export type CheckWarrantyInput = z.infer<typeof checkWarrantySchema>;
export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type ConfirmTicketInput = z.infer<typeof confirmTicketSchema>;
export type TimeTravelInput = z.infer<typeof timeTravelSchema>;
