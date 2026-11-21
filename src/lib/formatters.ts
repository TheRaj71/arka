/**
 * Indian Operations Formatting Standards (Section 3)
 * Money: integer paise -> ₹ with Indian digit grouping (₹12,34,567)
 * Shorthand: Lakh / Crore (₹4.2 L, ₹1.3 Cr)
 * Dates: DD MMM YYYY, 12-hour IST time
 * Phones: +91 98765 43210 with WhatsApp / Call links
 */

const IN_CURRENCY_FORMATTER = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
});

const IN_DECIMAL_FORMATTER = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Converts integer paise to formatted Indian Rupee string (e.g. ₹1,85,000)
 */
export function formatPaise(
  paise: number | bigint | null | undefined,
  includeSymbol: boolean = true
): string {
  if (paise == null) return includeSymbol ? "₹0" : "0";
  const p = typeof paise === "bigint" ? paise : BigInt(Math.round(Number(paise)));
  const isNegative = p < 0n;
  const abs = isNegative ? -p : p;
  const rupees = abs / 100n;
  const remainder = abs % 100n;

  const rupeesNum = Number(rupees);
  const formattedRupees = IN_CURRENCY_FORMATTER.format(rupeesNum);
  const prefix = includeSymbol ? (isNegative ? "-₹" : "₹") : isNegative ? "-" : "";

  if (remainder === 0n) {
    return `${prefix}${formattedRupees}`;
  }
  return `${prefix}${formattedRupees}.${remainder.toString().padStart(2, "0")}`;
}

/**
 * Converts integer paise to Lakh / Crore shorthand for KPI dashboards (e.g. ₹4.2 L, ₹1.3 Cr)
 */
export function formatPaiseShorthand(
  paise: number | bigint | null | undefined
): { display: string; exact: string } {
  if (paise == null || paise === 0 || paise === 0n) {
    return { display: "₹0", exact: "₹0" };
  }
  const p = typeof paise === "bigint" ? Number(paise) : Number(paise);
  const rupees = p / 100;
  const absRupees = Math.abs(rupees);
  const sign = rupees < 0 ? "-" : "";

  let display = "";
  if (absRupees >= 10_000_000) {
    // Crore (1 Cr = 1,00,00,000)
    const cr = absRupees / 10_000_000;
    display = `${sign}₹${cr.toFixed(2)} Cr`;
  } else if (absRupees >= 100_000) {
    // Lakh (1 L = 1,00,000)
    const l = absRupees / 100_000;
    display = `${sign}₹${l.toFixed(2)} L`;
  } else {
    display = formatPaise(paise);
  }

  return {
    display,
    exact: formatPaise(paise),
  };
}

/**
 * Format date in standard Indian business notation: DD MMM YYYY (e.g. 14 Nov 2026)
 */
export function formatDateIST(
  dateInput: string | Date | number | null | undefined
): string {
  if (!dateInput) return "—";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

/**
 * Format date and time in IST notation: DD MMM YYYY, hh:mm A IST
 */
export function formatDateTimeIST(
  dateInput: string | Date | number | null | undefined
): string {
  if (!dateInput) return "—";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "—";

  const formatted = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(d);

  return `${formatted} IST`;
}

/**
 * Relative time in plain english: "12 min ago", "2 hours ago", "Yesterday"
 */
export function formatRelativeTime(
  dateInput: string | Date | number | null | undefined,
  baseTime: number = Date.now()
): string {
  if (!dateInput) return "—";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "—";

  const diffMs = baseTime - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 30) return `${diffDays}d ago`;
  return formatDateIST(d);
}

/**
 * Display phone number with Indian grouping: +91 98765 43210
 */
export function formatPhoneIndian(phone: string | null | undefined): string {
  if (!phone) return "—";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
  }
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  return phone;
}

/**
 * Generate click-to-call and click-to-WhatsApp links
 */
export function getPhoneActions(phone: string | null | undefined): {
  callUrl: string | null;
  whatsappUrl: string | null;
  tel: string;
  whatsapp: string;
  display: string;
} {
  if (!phone) return { callUrl: null, whatsappUrl: null, tel: "#", whatsapp: "#", display: "—" };
  const cleaned = phone.replace(/\D/g, "");
  const e164 = cleaned.length === 10 ? `91${cleaned}` : cleaned;
  const callUrl = `tel:+${e164}`;
  const whatsappUrl = `https://wa.me/${e164}`;

  return {
    callUrl,
    whatsappUrl,
    tel: callUrl,
    whatsapp: whatsappUrl,
    display: formatPhoneIndian(phone),
  };
}
