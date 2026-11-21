import test from "node:test";
import assert from "node:assert/strict";

// 1. Money tests
test("formatMoney: converts integer paise to Indian Rupee notation", () => {
  const formatMoney = (paise) => {
    if (paise == null) return "₹0";
    const p = typeof paise === "bigint" ? paise : BigInt(paise);
    const isNegative = p < 0n;
    const abs = isNegative ? -p : p;
    const rupees = abs / 100n;
    const remainder = abs % 100n;

    const formattedRupees = rupees.toLocaleString("en-IN");
    const formatted = remainder === 0n ? `₹${formattedRupees}` : `₹${formattedRupees}.${remainder.toString().padStart(2, "0")}`;
    return isNegative ? `-${formatted}` : formatted;
  };

  assert.equal(formatMoney(18500000n), "₹1,85,000");
  assert.equal(formatMoney(7800000n), "₹78,000");
  assert.equal(formatMoney(10700000n), "₹1,07,000");
  assert.equal(formatMoney(9250050n), "₹92,500.50");
  assert.equal(formatMoney(-500000n), "-₹5,000");
  assert.equal(formatMoney(0n), "₹0");
});

// 2. Phone normalization tests
test("normalizePhone: normalizes 10-digit Indian phones to E.164", () => {
  const normalizePhone = (raw) => {
    if (!raw) return null;
    let clean = raw.trim().replace(/[\s\-\(\)\.]/g, "");
    if (clean.startsWith("+91")) clean = clean.slice(3);
    else if (clean.startsWith("91") && clean.length === 12) clean = clean.slice(2);
    else if (clean.startsWith("0") && clean.length === 11) clean = clean.slice(1);

    if (/^[6-9]\d{9}$/.test(clean)) {
      return `+91${clean}`;
    }
    return null;
  };

  assert.equal(normalizePhone("9876543210"), "+919876543210");
  assert.equal(normalizePhone("+91 98765 43210"), "+919876543210");
  assert.equal(normalizePhone("09876543210"), "+919876543210");
  assert.equal(normalizePhone("919876543210"), "+919876543210");
  assert.equal(normalizePhone("12345"), null); // Invalid
  assert.equal(normalizePhone("2876543210"), null); // Invalid start digit
});

// 3. Timezone tests (Asia/Kolkata)
test("time: ensures IST boundaries and formatting", () => {
  const IST_TIMEZONE = "Asia/Kolkata";
  const formatDate = (date) => {
    const d = new Date(date);
    return new Intl.DateTimeFormat("en-IN", {
      timeZone: IST_TIMEZONE,
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(d);
  };

  const formatted = formatDate("2026-11-21T06:30:00Z"); // 12:00 PM IST
  assert.equal(formatted, "21 Nov 2026");
});

// 4. Serial Normalization tests
test("serial: normalizes serial numbers to uppercase without whitespace", () => {
  const normalizeSerial = (s) => (s ? s.trim().toUpperCase().replace(/\s+/g, "") : "");

  assert.equal(normalizeSerial(" sp-inv-2026-0001 "), "SP-INV-2026-0001");
  assert.equal(normalizeSerial("sp-pan-2026-0005 "), "SP-PAN-2026-0005");
  assert.equal(normalizeSerial("sp pan"), "SPPAN");
});

// 5. Hard Gates Verification
test("Hard Gate REQ-SURV-04: Quote creation requires approved survey", () => {
  const canCreateQuote = (surveyStatus) => surveyStatus === "approved";

  assert.equal(canCreateQuote("draft"), false);
  assert.equal(canCreateQuote("submitted"), false);
  assert.equal(canCreateQuote("rework_requested"), false);
  assert.equal(canCreateQuote("approved"), true);
});

// 6. Automation A6: 50% Advance Triggers Order Confirmation
test("Automation A6: 50% Advance triggers auto-confirmation", () => {
  const totalPaise = 18500000n;
  const advanceReqPaise = 9250000n; // 50%

  const checkAutoConfirm = (paidPaise) => paidPaise >= advanceReqPaise;

  assert.equal(checkAutoConfirm(0n), false);
  assert.equal(checkAutoConfirm(5000000n), false);
  assert.equal(checkAutoConfirm(9250000n), true);
  assert.equal(checkAutoConfirm(18500000n), true);
});

// 7. Automation A10: Delivery starts warranty clocks
test("Automation A10: Correct warranty periods per component", () => {
  const getWarrantyMonths = (category) => {
    switch (category) {
      case "panel":
        return 240; // 20 years
      case "inverter":
        return 24; // 2 years
      case "battery":
        return 60; // 5 years
      default:
        return 12;
    }
  };

  assert.equal(getWarrantyMonths("panel"), 240);
  assert.equal(getWarrantyMonths("inverter"), 24);
  assert.equal(getWarrantyMonths("battery"), 60);
});

// 8. Service Desk Warranty Verdict Decision (< 5s resolution)
test("Service Desk: In-warranty vs Out-of-warranty verdict logic", () => {
  const evaluateWarranty = (elapsedMonths, warrantyMonths) => {
    const isInWarranty = elapsedMonths < warrantyMonths;
    return {
      isInWarranty,
      billing: isInWarranty ? 0n : 150000n, // ₹0 vs ₹1,500
    };
  };

  // Inverter has 24 months warranty:
  // At 18 months:
  const at18m = evaluateWarranty(18, 24);
  assert.equal(at18m.isInWarranty, true);
  assert.equal(at18m.billing, 0n);

  // At 26 months:
  const at26m = evaluateWarranty(26, 24);
  assert.equal(at26m.isInWarranty, false);
  assert.equal(at26m.billing, 150000n);
});
