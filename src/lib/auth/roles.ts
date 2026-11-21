import type { AppRole } from "./get-profile";

/**
 * Role hierarchy and permissions
 * Director inherits all permissions
 */

export const ROLE_NAMES: Record<AppRole, string> = {
  director: "Director",
  manager: "Manager",
  sales: "Sales",
  warehouse: "Warehouse",
  technician: "Technician",
  support: "Support",
  accounts: "Accounts",
};

export const ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  director: "Full system access, financial reports, settings",
  manager: "Operations management, approvals, scheduling",
  sales: "Lead management, quotes, customer interactions",
  warehouse: "Inventory, stock movements, dispatch",
  technician: "Field work, surveys, installations, service",
  support: "Service desk, tickets, warranty checks",
  accounts: "Payments, invoices, financial tracking",
};

/**
 * Check if a role can perform an action
 * Director can do everything
 */
export function canPerformAction(
  userRole: AppRole | null,
  allowedRoles: AppRole[]
): boolean {
  if (!userRole) return false;
  if (userRole === "director") return true;
  return allowedRoles.includes(userRole);
}

/**
 * Check if a role can see cost/profit data
 */
export function canSeeCostData(role: AppRole | null): boolean {
  if (!role) return false;
  return ["director", "manager", "accounts"].includes(role);
}

/**
 * Check if a role can see margin data
 */
export function canSeeMarginData(role: AppRole | null): boolean {
  if (!role) return false;
  return ["director", "accounts"].includes(role);
}

/**
 * Check if a role can approve discounts
 */
export function canApproveDiscounts(role: AppRole | null): boolean {
  if (!role) return false;
  return ["director", "manager"].includes(role);
}

/**
 * Check if a role can manage users
 */
export function canManageUsers(role: AppRole | null): boolean {
  if (!role) return false;
  return role === "director";
}
