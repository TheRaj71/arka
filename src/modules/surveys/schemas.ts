import { z } from "zod";

export const submitSurveySchema = z.object({
  job_id: z.string().uuid("Valid job ID required"),
  shadow_free_area_sqft: z.coerce.number().min(50, "Minimum shadow-free area is 50 sq ft"),
  cable_dc_m: z.coerce.number().min(1, "DC cable length required"),
  cable_ac_m: z.coerce.number().min(1, "AC cable length required"),
  roof_direction: z
    .enum([
      "north",
      "south",
      "east",
      "west",
      "north_east",
      "north_west",
      "south_east",
      "south_west",
    ])
    .default("south"),
  roof_tilt_deg: z.coerce.number().min(0).max(90).default(18),
  roof_type: z
    .enum(["rcc_flat", "metal_sheet", "tiled", "elevated", "other"])
    .default("rcc_flat"),
  feasibility: z.enum(["feasible", "conditional", "not_feasible"]).default("feasible"),
  recommended_kw: z.coerce.number().min(0.5).max(100).default(3.0),
  notes: z.string().optional(),
  photos: z.array(z.string()).default([]),
});

export const reviewSurveySchema = z.object({
  survey_id: z.string().uuid("Valid survey ID required"),
  decision: z.enum(["approve", "reject", "rework"]),
  note: z.string().optional(),
});

export type SubmitSurveyInput = z.infer<typeof submitSurveySchema>;
export type ReviewSurveyInput = z.infer<typeof reviewSurveySchema>;
