import { z } from "zod";

export const submitInstallSchema = z.object({
  job_id: z.string().uuid("Valid install job ID required"),
  system_kw_confirmed: z.coerce.number().min(0.5, "Confirmed system size required"),
  panel_count_installed: z.coerce.number().min(1, "Panel count required"),
  power_test_passed: z.boolean().refine((val) => val === true, {
    message: "Gate G14: Power generation test must pass before completing installation",
  }),
  power_test_notes: z.string().min(3, "Power test voltage & output details required"),
  signature_data_url: z.string().min(10, "Customer signature is mandatory for handover"),
  signed_by_name: z.string().min(2, "Customer signatory name required"),
  extra_materials: z.string().optional(),
});

export type SubmitInstallInput = z.infer<typeof submitInstallSchema>;
