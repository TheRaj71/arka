"use server";

import { defineAction } from "@/lib/actions/define-action";
import { rolesFor } from "@/lib/auth/permissions";
import { submitInstallSchema } from "./schemas";

/**
 * Submit field installation completion report with power test & customer signature
 */
export const submitInstall = defineAction({
  name: "submitInstall",
  roles: rolesFor("install.submit"),
  schema: submitInstallSchema,
  revalidate: ["/field", "/schedule", "/orders", "/service"],
  handler: async ({ profile, db }, input) => {
    const payload = {
      system_kw_confirmed: input.system_kw_confirmed,
      panel_count_installed: input.panel_count_installed,
      power_test_passed: input.power_test_passed,
      power_test_notes: input.power_test_notes,
      signature_path: input.signature_data_url,
      signed_by_name: input.signed_by_name,
      extra_materials: input.extra_materials || null,
    };

    const { data, error } = await (db as any).rpc("fn_submit_install", {
      p_actor: profile.id,
      p_job_id: input.job_id,
      p_payload: payload,
    });

    if (error) throw error;
    return data as { ok: boolean; status: string };
  },
});
