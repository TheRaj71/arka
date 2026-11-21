/**
 * Time utilities - Single Source of Truth
 * All timestamps stored as UTC timestamptz.
 * All business logic boundaries and UI formatting strictly observe Asia/Kolkata (IST, UTC+05:30).
 */

export const IST_TIMEZONE = "Asia/Kolkata";

/**
 * Format a Date or ISO string into IST date (e.g. "21 Nov 2026")
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST_TIMEZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

/**
 * Format a Date or ISO string into IST date + time (e.g. "21 Nov 2026, 02:30 PM")
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST_TIMEZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

export const formatIstDate = formatDateTime;

/**
 * Format relative time (e.g. "2 hours ago", "just now")
 */
export function formatTimeAgo(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffSec < 60) return "just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 2592000) return `${Math.floor(diffSec / 86400)}d ago`;
  return formatDate(d);
}

/**
 * Returns date boundaries for 'today', 'week', 'month' in IST
 */
export function getIstRange(range: "today" | "week" | "month" | "all" = "today"): {
  from: string;
  to: string;
  label: string;
} {
  const now = new Date();
  // Get current date string in IST
  const istFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: IST_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const todayStr = istFormatter.format(now); // "YYYY-MM-DD"
  const [year, month, day] = todayStr.split("-").map(Number);

  if (range === "today") {
    return {
      from: `${todayStr}T00:00:00+05:30`,
      to: `${todayStr}T23:59:59+05:30`,
      label: "Today (IST)",
    };
  }

  if (range === "week") {
    // Week starts on Monday in India
    const curDate = new Date(`${todayStr}T12:00:00+05:30`);
    const dayOfWeek = (curDate.getDay() + 6) % 7; // 0 = Mon, 6 = Sun
    const monday = new Date(curDate);
    monday.setDate(curDate.getDate() - dayOfWeek);
    const monStr = istFormatter.format(monday);
    return {
      from: `${monStr}T00:00:00+05:30`,
      to: `${todayStr}T23:59:59+05:30`,
      label: "This Week (IST)",
    };
  }

  if (range === "month") {
    const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
    return {
      from: `${monthStart}T00:00:00+05:30`,
      to: `${todayStr}T23:59:59+05:30`,
      label: "This Month (IST)",
    };
  }

  return {
    from: "2020-01-01T00:00:00+05:30",
    to: `${todayStr}T23:59:59+05:30`,
    label: "All Time",
  };
}
