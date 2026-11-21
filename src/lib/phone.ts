import { parsePhoneNumberWithError, isValidPhoneNumber } from "libphonenumber-js";

/**
 * Normalizes phone numbers to standard E.164 format (e.g. "+919876543210")
 * Defaults to IN (India, +91) region.
 */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const cleaned = raw.trim();
  if (!cleaned) return null;

  try {
    const phoneNumber = parsePhoneNumberWithError(cleaned, "IN");
    if (phoneNumber.isValid()) {
      return phoneNumber.number; // E.164 format: +91XXXXXXXXXX
    }
    return null;
  } catch {
    // Basic fallback for standard 10 digit Indian numbers
    const digits = cleaned.replace(/\D/g, "");
    if (digits.length === 10) return `+91${digits}`;
    if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
    return null;
  }
}

/**
 * Checks if a string is a valid Indian mobile number
 */
export function isValidPhone(raw: string | null | undefined): boolean {
  if (!raw) return false;
  return isValidPhoneNumber(raw.trim(), "IN");
}

/**
 * Formats an E.164 phone number for readable display: "+91 98765 43210"
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "—";
  try {
    const parsed = parsePhoneNumberWithError(phone, "IN");
    return parsed.formatInternational();
  } catch {
    return phone;
  }
}
