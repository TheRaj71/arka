/**
 * Money utilities - Single Source of Truth
 * All currency values in the database are stored as bigint paise (1 INR = 100 paise).
 */

/**
 * Format paise (integer) to Indian Rupee string: e.g. 150000 -> "₹1,500"
 */
export function formatMoney(paise: number | bigint | null | undefined, options?: { showPaise?: boolean }): string {
  if (paise == null) return "₹0";
  const num = typeof paise === "bigint" ? Number(paise) : paise;
  const rupees = num / 100;
  
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: options?.showPaise ? 2 : (rupees % 1 === 0 ? 0 : 2),
    maximumFractionDigits: 2,
  }).format(rupees);
}

/**
 * Convert rupees to integer paise
 */
export function rupeesToPaise(rupees: number | string): bigint {
  const num = typeof rupees === "string" ? parseFloat(rupees.replace(/[^\d.-]/g, "")) : rupees;
  if (isNaN(num)) return BigInt(0);
  return BigInt(Math.round(num * 100));
}

/**
 * Format basis points to GST percentage: e.g. 1800 -> "18%"
 */
export function formatGst(bp: number | null | undefined): string {
  if (bp == null) return "0%";
  return `${(bp / 100).toFixed(bp % 100 === 0 ? 0 : 1)}%`;
}
