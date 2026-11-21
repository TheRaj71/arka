// src/lib/auth/permissions.ts
export const ROLES = [
  "director",
  "manager",
  "sales",
  "technician",
  "warehouse",
  "support",
  "accounts",
] as const;

export type AppRole = (typeof ROLES)[number];

/** Roles allowed per capability. `director` is implicitly added by `rolesFor`. */
const MATRIX = {
  "lead.create": ["sales", "manager"],
  "lead.view": ["sales", "manager"],
  "lead.update": ["sales", "manager"],
  "lead.assign": ["manager"],
  "lead.close": ["sales", "manager"],
  "lead.qualify": ["sales", "manager"],
  "survey.schedule": ["sales", "manager"],
  "survey.submit": ["technician", "manager"],
  "survey.review": ["manager"],
  "quote.create": ["sales", "manager"],
  "quote.edit_draft": ["sales", "manager"],
  "quote.approve": ["manager"],
  "quote.send": ["sales", "manager"],
  "quote.view": ["sales", "manager", "accounts"],
  "quote.view_cost_margin": ["manager", "accounts"],
  "order.view": ["sales", "manager", "support", "accounts"],
  "order.cancel": ["manager"],
  "order.force_confirm": ["manager"],
  "payment.record": ["accounts", "manager"],
  "payment.reverse": ["manager"],
  "payment.view": ["sales", "manager", "accounts"],
  "catalogue.edit": ["manager"],
  "inventory.view": ["sales", "manager", "warehouse", "accounts"],
  "inventory.receive": ["warehouse", "manager"],
  "inventory.adjust.request": ["warehouse", "manager"],
  "inventory.adjust.approve": ["manager"],
  "purchase.record": ["warehouse", "accounts", "manager"],
  "picklist.work": ["warehouse", "manager"],
  "dispatch.scan": ["warehouse", "manager"],
  "delivery.confirm": ["warehouse", "technician", "manager"],
  "job.schedule": ["manager", "support"],
  "job.view": ["sales", "manager", "technician", "warehouse", "support", "accounts"],
  "job.work": ["technician", "manager"],
  "install.submit": ["technician", "manager"],
  "variation.approve": ["manager"],
  "asset.view": ["sales", "manager", "technician", "warehouse", "support", "accounts"],
  "asset.transfer": ["support", "manager"],
  "ticket.create": ["sales", "support", "manager"],
  "ticket.work": ["support", "technician", "manager"],
  "ticket.warranty_override": ["manager"],
  "invoice.view": ["sales", "manager", "support", "accounts"],
  "invoice.issue": ["accounts", "manager"],
  "invoice.void": ["manager"],
  "subsidy.view": ["sales", "manager", "support", "accounts"],
  "subsidy.update": ["accounts", "manager"],
  "pay.manage": ["accounts"],
  "pay.approve": [], // director only
  "pay.view_own": ["technician"],
  "dashboard.view": ["manager", "accounts"],
  "profit.view": ["manager", "accounts"],
  "share.manage": ["manager"],
  "audit.view": ["manager"],
  "settings.edit": [], // director only
  "users.manage": [], // director only
} as const satisfies Record<string, readonly Exclude<AppRole, "director">[]>;

export type Capability = keyof typeof MATRIX;

export const rolesFor = (c: Capability): AppRole[] =>
  ["director", ...MATRIX[c]] as AppRole[];

export const can = (role: AppRole | null | undefined, c: Capability): boolean =>
  !!role && (role === "director" || (MATRIX[c] as readonly string[]).includes(role));
