import { z } from "zod";

export const publicEnquirySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Please enter a valid 10-digit phone number"),
  site_address: z.string().min(5, "Address must be at least 5 characters"),
  requested_kw: z.coerce.number().min(0.5, "Minimum size is 0.5 kW").max(100, "Maximum size is 100 kW").default(3.0),
  requirement: z.enum(["on_grid", "off_grid"]).default("on_grid"),
  wants_subsidy: z.boolean().default(true),
  notes: z.string().optional(),
  website: z.string().optional(), // Honeypot field
});

export const createLeadSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone_e164: z.string().min(10, "Valid phone number required"),
  site_address: z.string().optional(),
  site_city: z.string().optional(),
  email: z.string().email().optional(),
  source: z.enum(["web", "call", "whatsapp", "walk_in", "referral", "other"]).default("call"),
  requested_kw: z.coerce.number().min(0.5).max(100).default(3.0),
  requirement: z.enum(["on_grid", "off_grid", "hybrid"]).default("on_grid"),
  wants_subsidy: z.boolean().default(true),
  owner_id: z.string().uuid().optional(),
  notes: z.string().optional(),
});

export const logActivitySchema = z.object({
  lead_id: z.string().uuid(),
  kind: z.enum(["call", "note", "whatsapp", "followup_set", "status_change"]),
  outcome: z.enum(["connected", "no_answer", "busy", "wrong_number", "callback_requested"]).optional(),
  note: z.string().min(1, "Note cannot be empty"),
  next_followup: z.string().optional(),
});

export const closeLeadSchema = z.object({
  lead_id: z.string().uuid(),
  status: z.enum(["lost", "disqualified", "unreachable"]),
  reason: z.string().min(3, "Please provide a reason for closing this lead"),
});

export const qualifyLeadSchema = z.object({
  lead_id: z.string().uuid(),
  shadow_free_area_sqft: z.coerce.number().min(0, "Shadow-free area must be positive"),
  monthly_bill_paise: z.coerce.number().min(0).default(0),
  monthly_units: z.coerce.number().min(0).default(0),
  grid_connection_suitable: z.boolean().default(true),
  grid_notes: z.string().optional(),
  roof_ownership: z.enum(["owned", "rented", "society", "unknown"]).default("owned"),
  consumer_number: z.string().optional(),
  consumer_name_on_bill: z.string().optional(),
  suggested_kw: z.coerce.number().min(0.5).max(100).default(3.0),
  system_type: z.enum(["on_grid", "off_grid"]).default("on_grid"),
  requested_kw: z.coerce.number().min(0.5).max(100).default(3.0),
  technician_id: z.string().uuid().optional(),
  survey_start: z.string().optional(),
  survey_end: z.string().optional(),
});

export type PublicEnquiryInput = z.infer<typeof publicEnquirySchema>;
export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type LogActivityInput = z.infer<typeof logActivitySchema>;
export type CloseLeadInput = z.infer<typeof closeLeadSchema>;
export type QualifyLeadInput = z.infer<typeof qualifyLeadSchema>;
