/**
 * Serial number normalizer - Single Source of Truth
 * Strips whitespace, uppercase, preserves standard hyphens
 * e.g. " inv-2026 000001 " -> "INV-2026-000001"
 */
export function normalizeSerial(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

/**
 * Checks if a serial follows typical equipment serial patterns
 */
export function isValidSerialPattern(serial: string): boolean {
  const norm = normalizeSerial(serial);
  return norm.length >= 4 && norm.length <= 40;
}
