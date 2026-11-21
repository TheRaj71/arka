"use server";

import { defineAction } from "@/lib/actions/define-action";
import { rolesFor } from "@/lib/auth/permissions";
import { normalizePhone } from "@/lib/phone";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  publicEnquirySchema,
  createLeadSchema,
  logActivitySchema,
  closeLeadSchema,
  qualifyLeadSchema,
  type PublicEnquiryInput,
} from "./schemas";

/**
 * Public enquiry submission (unauthenticated, honeypot & phone normalized)
 */
export async function submitPublicEnquiry(raw: PublicEnquiryInput) {
  const parsed = publicEnquirySchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: {
        code: "VALIDATION",
        message: "Please fill in all required fields accurately.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
    };
  }

  const phoneE164 = normalizePhone(parsed.data.phone);
  if (!phoneE164) {
    return {
      ok: false as const,
      error: {
        code: "INVALID_PHONE",
        message: "Please provide a valid Indian 10-digit mobile number.",
      },
    };
  }

  const db = supabaseAdmin();
  const payload = {
    ...parsed.data,
    phone_e164: phoneE164,
  };

  const { data, error } = await (db as any).rpc("fn_create_lead_public", {
    p_payload: payload,
  });

  if (error) {
    return {
      ok: false as const,
      error: {
        code: error.code || "DB_ERROR",
        message: error.message || "Unable to submit enquiry at this time.",
      },
    };
  }

  return {
    ok: true as const,
    data: data as { lead_no: string; duplicate: boolean },
  };
}

/**
 * Sales / Manager manual lead creation
 */
export const createLead = defineAction({
  name: "createLead",
  roles: rolesFor("lead.create"),
  schema: createLeadSchema,
  revalidate: ["/leads"],
  handler: async ({ profile, db }, input) => {
    const phoneE164 = normalizePhone(input.phone_e164);
    if (!phoneE164) throw new Error("INVALID_PHONE: Valid phone number required");

    const payload = {
      ...input,
      phone_e164: phoneE164,
    };

    const { data, error } = await (db as any).rpc("fn_create_lead", {
      p_actor: profile.id,
      p_payload: payload,
    });

    if (error) throw error;
    return data as { lead_no: string; lead_id: string; duplicate?: boolean };
  },
});

/**
 * Log call, note, or follow-up activity
 */
export const logActivity = defineAction({
  name: "logActivity",
  roles: rolesFor("lead.update"),
  schema: logActivitySchema,
  revalidate: ["/leads"],
  handler: async ({ profile, db }, input) => {
    const { data, error } = await (db as any).rpc("fn_log_lead_activity", {
      p_actor: profile.id,
      p_lead_id: input.lead_id,
      p_kind: input.kind,
      p_outcome: input.outcome ?? null,
      p_note: input.note,
      p_next_followup: input.next_followup ?? null,
    });

    if (error) throw error;
    return data;
  },
});

/**
 * Close lead with mandatory reason (never hard delete)
 */
export const closeLead = defineAction({
  name: "closeLead",
  roles: rolesFor("lead.close"),
  schema: closeLeadSchema,
  revalidate: ["/leads"],
  handler: async ({ profile, db }, input) => {
    const { data, error } = await (db as any).rpc("fn_close_lead", {
      p_actor: profile.id,
      p_lead_id: input.lead_id,
      p_status: input.status,
      p_reason: input.reason,
    });

    if (error) throw error;
    return data;
  },
});

/**
 * Qualify lead -> Automatically creates Project + Survey Job
 */
export const qualifyLead = defineAction({
  name: "qualifyLead",
  roles: rolesFor("lead.qualify"),
  schema: qualifyLeadSchema,
  revalidate: ["/leads", "/projects", "/schedule", "/surveys"],
  handler: async ({ profile, db }, input) => {
    const checklist = {
      shadow_free_area_sqft: input.shadow_free_area_sqft,
      monthly_bill_paise: input.monthly_bill_paise,
      monthly_units: input.monthly_units,
      grid_connection_suitable: input.grid_connection_suitable,
      grid_notes: input.grid_notes,
      roof_ownership: input.roof_ownership,
      consumer_number: input.consumer_number,
      consumer_name_on_bill: input.consumer_name_on_bill,
      suggested_kw: input.suggested_kw,
    };

    const survey = {
      technician_id: input.technician_id ?? null,
      start: input.survey_start ?? null,
      end: input.survey_end ?? null,
    };

    const { data, error } = await (db as any).rpc("fn_qualify_lead", {
      p_actor: profile.id,
      p_lead_id: input.lead_id,
      p_checklist: checklist,
      p_system_type: input.system_type,
      p_requested_kw: input.requested_kw,
      p_survey: survey,
    });

    if (error) throw error;
    return data as {
      project_id: string;
      project_no: string;
      survey_job_id: string;
      survey_id: string;
    };
  },
});
