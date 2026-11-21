import { z } from "zod";

export const receiveStockSchema = z.object({
  product_id: z.string().uuid("Valid product required"),
  unit_cost_paise: z.coerce.number().min(0).default(0),
  serials: z.array(z.string()).default([]),
  qty: z.coerce.number().min(0).default(0),
  invoice_no: z.string().optional(),
});

export const createDispatchSchema = z.object({
  pick_list_id: z.string().uuid("Valid pick-list ID required"),
  vehicle: z.string().optional(),
  driver: z.string().optional(),
  driver_phone: z.string().optional(),
});

export const scanDispatchUnitSchema = z.object({
  dispatch_id: z.string().uuid("Valid dispatch ID required"),
  raw_serial: z.string().min(3, "Serial number cannot be empty"),
  method: z.enum(["camera", "manual", "scanner"]).default("camera"),
  line_id: z.string().uuid().optional(),
});

export const finalizeDispatchSchema = z.object({
  dispatch_id: z.string().uuid("Valid dispatch ID required"),
});

export const confirmDeliverySchema = z.object({
  dispatch_id: z.string().uuid("Valid dispatch ID required"),
  customer_name: z.string().optional(),
  otp: z.string().optional(),
  notes: z.string().optional(),
});

export type ReceiveStockInput = z.infer<typeof receiveStockSchema>;
export type CreateDispatchInput = z.infer<typeof createDispatchSchema>;
export type ScanDispatchUnitInput = z.infer<typeof scanDispatchUnitSchema>;
export type FinalizeDispatchInput = z.infer<typeof finalizeDispatchSchema>;
export type ConfirmDeliveryInput = z.infer<typeof confirmDeliverySchema>;
