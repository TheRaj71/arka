"use server";

import { defineAction } from "@/lib/actions/define-action";
import { rolesFor } from "@/lib/auth/permissions";
import { submitSurveySchema, reviewSurveySchema } from "./schemas";

/**
 * Field technician or manager submits site roof survey
 */
export const submitSurvey = defineAction({
  name: "submitSurvey",
  roles: rolesFor("survey.submit"),
  schema: submitSurveySchema,
  revalidate: ["/surveys", "/schedule", "/field"],
  handler: async ({ profile, db }, input) => {
    const payload = {
      shadow_free_area_sqft: input.shadow_free_area_sqft,
      cable_dc_m: input.cable_dc_m,
      cable_ac_m: input.cable_ac_m,
      roof_direction: input.roof_direction,
      roof_tilt_deg: input.roof_tilt_deg,
      roof_type: input.roof_type,
      feasibility: input.feasibility,
      recommended_kw: input.recommended_kw,
      notes: input.notes,
      photos: input.photos,
    };

    const { data, error } = await (db as any).rpc("fn_submit_survey", {
      p_actor: profile.id,
      p_job_id: input.job_id,
      p_data: payload,
    });

    if (error) throw error;
    return data as { ok: boolean; survey_id: string; already_submitted?: boolean };
  },
});

/**
 * Manager / Director reviews survey (HARD GATE: REQ-SURV-04)
 * Approving unlocks the Quote Engine for this project.
 */
export const reviewSurvey = defineAction({
  name: "reviewSurvey",
  roles: rolesFor("survey.review"),
  schema: reviewSurveySchema,
  revalidate: ["/surveys", "/quotes", "/approvals", "/projects"],
  handler: async ({ profile, db }, input) => {
    const { data, error } = await (db as any).rpc("fn_review_survey", {
      p_actor: profile.id,
      p_survey_id: input.survey_id,
      p_decision: input.decision,
      p_note: input.note || null,
    });

    if (error) throw error;
    return data as { ok: boolean; stage?: string };
  },
});
