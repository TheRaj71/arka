/**
 * Single Source of Truth for Status Visuals across all Arka modules
 * Strictly conforms to Section 3: Tinted background + dark text + small dot.
 * Never saturated fills.
 */

export type StatusCategory =
  | "lead"
  | "survey"
  | "quote"
  | "order"
  | "job"
  | "ticket"
  | "invoice"
  | "warranty"
  | "inventory";

export interface StatusMeta {
  label: string;
  dotColor: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
}

export const STATUS_MAP: Record<string, StatusMeta> = {
  // --- LEADS ---
  new: {
    label: "New",
    dotColor: "#1D4ED8",
    bgColor: "#EFF6FF",
    textColor: "#1E40AF",
    borderColor: "#DBEAFE",
  },
  contacted: {
    label: "Contacted",
    dotColor: "#0F766E",
    bgColor: "#F0FDFA",
    textColor: "#115E59",
    borderColor: "#CCFBF1",
  },
  qualified: {
    label: "Qualified",
    dotColor: "#15803D",
    bgColor: "#F0FDF4",
    textColor: "#166534",
    borderColor: "#DCFCE7",
  },
  disqualified: {
    label: "Disqualified",
    dotColor: "#78716C",
    bgColor: "#F5F5F4",
    textColor: "#57534E",
    borderColor: "#E7E5E4",
  },
  lost: {
    label: "Lost",
    dotColor: "#B91C1C",
    bgColor: "#FEF2F2",
    textColor: "#991B1B",
    borderColor: "#FEE2E2",
  },
  converted: {
    label: "Converted",
    dotColor: "#15803D",
    bgColor: "#F0FDF4",
    textColor: "#166534",
    borderColor: "#DCFCE7",
  },

  // --- SURVEYS ---
  requested: {
    label: "Survey Requested",
    dotColor: "#B45309",
    bgColor: "#FFFBEB",
    textColor: "#92400E",
    borderColor: "#FEF3C7",
  },
  scheduled: {
    label: "Scheduled",
    dotColor: "#0F766E",
    bgColor: "#F0FDFA",
    textColor: "#115E59",
    borderColor: "#CCFBF1",
  },
  submitted: {
    label: "Submitted",
    dotColor: "#1D4ED8",
    bgColor: "#EFF6FF",
    textColor: "#1E40AF",
    borderColor: "#DBEAFE",
  },
  approved: {
    label: "Approved",
    dotColor: "#15803D",
    bgColor: "#F0FDF4",
    textColor: "#166534",
    borderColor: "#DCFCE7",
  },
  rejected: {
    label: "Rejected",
    dotColor: "#B91C1C",
    bgColor: "#FEF2F2",
    textColor: "#991B1B",
    borderColor: "#FEE2E2",
  },
  rework_needed: {
    label: "Rework Needed",
    dotColor: "#B45309",
    bgColor: "#FFFBEB",
    textColor: "#92400E",
    borderColor: "#FEF3C7",
  },

  // --- QUOTES ---
  draft: {
    label: "Draft",
    dotColor: "#78716C",
    bgColor: "#F5F5F4",
    textColor: "#57534E",
    borderColor: "#E7E5E4",
  },
  approval_pending: {
    label: "Approval Pending",
    dotColor: "#B45309",
    bgColor: "#FFFBEB",
    textColor: "#92400E",
    borderColor: "#FEF3C7",
  },
  sent: {
    label: "Sent to Customer",
    dotColor: "#0F766E",
    bgColor: "#F0FDFA",
    textColor: "#115E59",
    borderColor: "#CCFBF1",
  },
  accepted: {
    label: "Accepted",
    dotColor: "#15803D",
    bgColor: "#F0FDF4",
    textColor: "#166534",
    borderColor: "#DCFCE7",
  },
  expired: {
    label: "Expired",
    dotColor: "#78716C",
    bgColor: "#F5F5F4",
    textColor: "#57534E",
    borderColor: "#E7E5E4",
  },

  // --- ORDERS ---
  pending_payment: {
    label: "Pending Advance",
    dotColor: "#B45309",
    bgColor: "#FFFBEB",
    textColor: "#92400E",
    borderColor: "#FEF3C7",
  },
  confirmed: {
    label: "Confirmed",
    dotColor: "#15803D",
    bgColor: "#F0FDF4",
    textColor: "#166534",
    borderColor: "#DCFCE7",
  },
  in_progress: {
    label: "In Progress",
    dotColor: "#0F766E",
    bgColor: "#F0FDFA",
    textColor: "#115E59",
    borderColor: "#CCFBF1",
  },
  delivered: {
    label: "Delivered",
    dotColor: "#0F766E",
    bgColor: "#F0FDFA",
    textColor: "#115E59",
    borderColor: "#CCFBF1",
  },
  installed: {
    label: "Installed",
    dotColor: "#15803D",
    bgColor: "#F0FDF4",
    textColor: "#166534",
    borderColor: "#DCFCE7",
  },
  completed: {
    label: "Completed",
    dotColor: "#15803D",
    bgColor: "#F0FDF4",
    textColor: "#166534",
    borderColor: "#DCFCE7",
  },
  cancelled: {
    label: "Cancelled",
    dotColor: "#B91C1C",
    bgColor: "#FEF2F2",
    textColor: "#991B1B",
    borderColor: "#FEE2E2",
  },

  // --- TICKETS ---
  open: {
    label: "Open",
    dotColor: "#B45309",
    bgColor: "#FFFBEB",
    textColor: "#92400E",
    borderColor: "#FEF3C7",
  },
  assigned: {
    label: "Assigned",
    dotColor: "#1D4ED8",
    bgColor: "#EFF6FF",
    textColor: "#1E40AF",
    borderColor: "#DBEAFE",
  },
  waiting_parts: {
    label: "Waiting on Parts",
    dotColor: "#B45309",
    bgColor: "#FFFBEB",
    textColor: "#92400E",
    borderColor: "#FEF3C7",
  },
  resolved: {
    label: "Resolved",
    dotColor: "#15803D",
    bgColor: "#F0FDF4",
    textColor: "#166534",
    borderColor: "#DCFCE7",
  },
  closed: {
    label: "Closed",
    dotColor: "#78716C",
    bgColor: "#F5F5F4",
    textColor: "#57534E",
    borderColor: "#E7E5E4",
  },

  // --- INVOICES ---
  issued: {
    label: "Issued",
    dotColor: "#1D4ED8",
    bgColor: "#EFF6FF",
    textColor: "#1E40AF",
    borderColor: "#DBEAFE",
  },
  paid: {
    label: "Paid",
    dotColor: "#15803D",
    bgColor: "#F0FDF4",
    textColor: "#166534",
    borderColor: "#DCFCE7",
  },
  partially_paid: {
    label: "Partially Paid",
    dotColor: "#B45309",
    bgColor: "#FFFBEB",
    textColor: "#92400E",
    borderColor: "#FEF3C7",
  },
  void: {
    label: "Void",
    dotColor: "#78716C",
    bgColor: "#F5F5F4",
    textColor: "#57534E",
    borderColor: "#E7E5E4",
  },
  overdue: {
    label: "Overdue",
    dotColor: "#B91C1C",
    bgColor: "#FEF2F2",
    textColor: "#991B1B",
    borderColor: "#FEE2E2",
  },

  // --- WARRANTIES ---
  in_warranty: {
    label: "In Warranty (Free)",
    dotColor: "#15803D",
    bgColor: "#F0FDF4",
    textColor: "#166534",
    borderColor: "#DCFCE7",
  },
  out_of_warranty: {
    label: "Out of Warranty (Chargeable)",
    dotColor: "#B91C1C",
    bgColor: "#FEF2F2",
    textColor: "#991B1B",
    borderColor: "#FEE2E2",
  },
  expiring_soon: {
    label: "Expiring Soon",
    dotColor: "#B45309",
    bgColor: "#FFFBEB",
    textColor: "#92400E",
    borderColor: "#FEF3C7",
  },

  // --- INVENTORY ---
  available: {
    label: "In Stock",
    dotColor: "#15803D",
    bgColor: "#F0FDF4",
    textColor: "#166534",
    borderColor: "#DCFCE7",
  },
  reserved: {
    label: "Reserved",
    dotColor: "#B45309",
    bgColor: "#FFFBEB",
    textColor: "#92400E",
    borderColor: "#FEF3C7",
  },
  dispatched: {
    label: "Dispatched",
    dotColor: "#0F766E",
    bgColor: "#F0FDFA",
    textColor: "#115E59",
    borderColor: "#CCFBF1",
  },
};

/**
 * Helper to get status metadata with safe fallback
 */
export function getStatusMeta(status: string | null | undefined): StatusMeta {
  if (!status) {
    return {
      label: "Unknown",
      dotColor: "#78716C",
      bgColor: "#F5F5F4",
      textColor: "#57534E",
      borderColor: "#E7E5E4",
    };
  }
  const normalized = status.toLowerCase().replace(/\s+/g, "_");
  return (
    STATUS_MAP[normalized] ?? {
      label: status.replace(/_/g, " "),
      dotColor: "#78716C",
      bgColor: "#F5F5F4",
      textColor: "#57534E",
      borderColor: "#E7E5E4",
    }
  );
}
