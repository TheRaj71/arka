import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ykxhmzuuxowjwqhthijv.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlreGhtenV1eG93andxaHRoaWp2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5NTIyOTQ3MywiZXhwIjoyMTEwODA1NDczfQ.YZQdkXA_Hxkb8v7N6QNW0GnoAyhozNPTBfO71uhnEtU";

const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function seed() {
  console.log("🌱 Starting database seeding for Arka Solar IMS...");

  // 1. SETTINGS
  console.log("1. Seeding Settings...");
  const settings = [
    { key: "warranty.start_trigger", value: "delivery", description: "Warranty clock trigger: delivery or installation" },
    { key: "order.advance_percent", value: 50, description: "Minimum percentage of order total to confirm order" },
    { key: "order.require_full_payment_before_dispatch", value: false, description: "Whether 100% payment is required before dispatch" },
    { key: "quote.validity_days", value: 15, description: "Default quote validity period in days" },
    { key: "quote.max_discount_percent_no_approval", value: 3, description: "Max discount % allowed without manager approval" },
    { key: "quote.min_margin_percent", value: 12, description: "Minimum gross margin % without manager approval" },
    { key: "quote.panel_wattage_w", value: 540, description: "Standard panel wattage in Wp" },
    { key: "subsidy.enabled", value: true, description: "Whether PM Surya Ghar subsidy calculation is active" },
    { key: "subsidy.tiers", value: [{ upto_kw: 2, per_kw_paise: 3000000 }, { upto_kw: 3, per_kw_paise: 1800000 }], description: "Central subsidy rate tiers" },
    { key: "subsidy.max_paise", value: 7800000, description: "Maximum central subsidy cap (₹78,000)" },
    { key: "lead.max_contact_attempts", value: 5, description: "Max failed contact attempts before recommending unreachable" },
    { key: "ticket.sla_hours.high", value: 24, description: "SLA target for high priority tickets in hours" },
    { key: "ticket.sla_hours.normal", value: 72, description: "SLA target for normal priority tickets in hours" },
    { key: "ticket.repeat_window_days", value: 30, description: "Days window to detect repeat service complaints" },
    { key: "warranty.expiring_soon_days", value: 60, description: "Days threshold for expiring soon warning badge" },
    { key: "dispatch.panels_serial_required", value: true, description: "Whether panel serials must be scanned individually" },
    { key: "finance.technician_default_hourly_paise", value: 15000, description: "Default hourly pay rate for technicians (₹150/hr)" }
  ];

  for (const s of settings) {
    const { error } = await sb.from("settings").upsert(s, { onConflict: "key" });
    if (error) console.error("Error setting:", s.key, error.message);
  }
  console.log("✓ Settings seeded.");

  // 2. DEMO PROFILES (All 7 Roles)
  console.log("2. Seeding Profiles...");
  const profiles = [
    { id: "11111111-1111-1111-1111-111111111111", clerk_user_id: "user_director_demo", full_name: "Priya Sharma (Director)", email: "director@demo.local", role: "director", is_active: true },
    { id: "22222222-2222-2222-2222-222222222222", clerk_user_id: "user_manager_demo", full_name: "Rajesh Gupta (Ops Manager)", email: "manager@demo.local", role: "manager", is_active: true },
    { id: "33333333-3333-3333-3333-333333333333", clerk_user_id: "user_sales_demo", full_name: "Ravi Verma (Sales Lead)", email: "sales@demo.local", role: "sales", is_active: true },
    { id: "44444444-4444-4444-4444-444444444444", clerk_user_id: "user_tech1_demo", full_name: "Imran Khan (Lead Tech)", email: "tech1@demo.local", role: "technician", is_active: true },
    { id: "55555555-5555-5555-5555-555555555555", clerk_user_id: "user_tech2_demo", full_name: "Vikram Patel (Field Tech)", email: "tech2@demo.local", role: "technician", is_active: true },
    { id: "66666666-6666-6666-6666-666666666666", clerk_user_id: "user_wh_demo", full_name: "Anil Kumar (Storekeeper)", email: "warehouse@demo.local", role: "warehouse", is_active: true },
    { id: "77777777-7777-7777-7777-777777777777", clerk_user_id: "user_support_demo", full_name: "Sneha Nair (Support Desk)", email: "support@demo.local", role: "support", is_active: true },
    { id: "88888888-8888-8888-8888-888888888888", clerk_user_id: "user_accounts_demo", full_name: "Kavita Joshi (Accounts Exec)", email: "accounts@demo.local", role: "accounts", is_active: true }
  ];

  for (const p of profiles) {
    const { error } = await sb.from("profiles").upsert(p, { onConflict: "clerk_user_id" });
    if (error) console.error("Error profile:", p.email, error.message);
  }
  console.log("✓ Profiles seeded.");

  // 3. PRODUCTS
  console.log("3. Seeding Products...");
  const products = [
    { id: "a0000001-0000-0000-0000-000000000001", sku: "PNL-540-DCR", name: "Mono PERC Solar Panel 540 Wp (DCR - Domestic)", category: "panel", uom: "nos", is_serialised: true, tracks_stock: true, warranty_months: 240, gst_rate_bp: 1200, price_paise: 1400000, is_dcr: true, wattage_w: 540 },
    { id: "a0000001-0000-0000-0000-000000000002", sku: "PNL-540-NDCR", name: "Mono Solar Panel 540 Wp (Non-DCR Commercial)", category: "panel", uom: "nos", is_serialised: true, tracks_stock: true, warranty_months: 240, gst_rate_bp: 1200, price_paise: 1150000, is_dcr: false, wattage_w: 540 },
    { id: "a0000002-0000-0000-0000-000000000001", sku: "INV-ON-1KW", name: "On-Grid String Inverter 1 kW", category: "inverter", uom: "nos", is_serialised: true, tracks_stock: true, warranty_months: 24, gst_rate_bp: 1200, price_paise: 1400000, capacity_kw: 1.0 },
    { id: "a0000002-0000-0000-0000-000000000002", sku: "INV-ON-2KW", name: "On-Grid String Inverter 2 kW", category: "inverter", uom: "nos", is_serialised: true, tracks_stock: true, warranty_months: 24, gst_rate_bp: 1200, price_paise: 2000000, capacity_kw: 2.0 },
    { id: "a0000002-0000-0000-0000-000000000003", sku: "INV-ON-3KW", name: "On-Grid String Inverter 3 kW", category: "inverter", uom: "nos", is_serialised: true, tracks_stock: true, warranty_months: 24, gst_rate_bp: 1200, price_paise: 2700000, capacity_kw: 3.0 },
    { id: "a0000002-0000-0000-0000-000000000004", sku: "INV-ON-4KW", name: "On-Grid String Inverter 4 kW", category: "inverter", uom: "nos", is_serialised: true, tracks_stock: true, warranty_months: 24, gst_rate_bp: 1200, price_paise: 3400000, capacity_kw: 4.0 },
    { id: "a0000002-0000-0000-0000-000000000005", sku: "INV-ON-5KW", name: "On-Grid String Inverter 5 kW", category: "inverter", uom: "nos", is_serialised: true, tracks_stock: true, warranty_months: 24, gst_rate_bp: 1200, price_paise: 4200000, capacity_kw: 5.0 },
    { id: "a0000003-0000-0000-0000-000000000001", sku: "INV-OFF-1KW", name: "Off-Grid Solar Inverter 1 kW", category: "inverter", uom: "nos", is_serialised: true, tracks_stock: true, warranty_months: 24, gst_rate_bp: 1200, price_paise: 1800000, capacity_kw: 1.0 },
    { id: "a0000003-0000-0000-0000-000000000002", sku: "INV-OFF-2KW", name: "Off-Grid Solar Inverter 2 kW", category: "inverter", uom: "nos", is_serialised: true, tracks_stock: true, warranty_months: 24, gst_rate_bp: 1200, price_paise: 2600000, capacity_kw: 2.0 },
    { id: "a0000003-0000-0000-0000-000000000003", sku: "INV-OFF-3KW", name: "Off-Grid Solar Inverter 3 kW", category: "inverter", uom: "nos", is_serialised: true, tracks_stock: true, warranty_months: 24, gst_rate_bp: 1200, price_paise: 3500000, capacity_kw: 3.0 },
    { id: "a0000003-0000-0000-0000-000000000004", sku: "INV-OFF-4KW", name: "Off-Grid Solar Inverter 4 kW", category: "inverter", uom: "nos", is_serialised: true, tracks_stock: true, warranty_months: 24, gst_rate_bp: 1200, price_paise: 4500000, capacity_kw: 4.0 },
    { id: "a0000003-0000-0000-0000-000000000005", sku: "INV-OFF-5KW", name: "Off-Grid Solar Inverter 5 kW", category: "inverter", uom: "nos", is_serialised: true, tracks_stock: true, warranty_months: 24, gst_rate_bp: 1200, price_paise: 5500000, capacity_kw: 5.0 },
    { id: "a0000004-0000-0000-0000-000000000001", sku: "BAT-150AH-TUB", name: "Solar Tubular Lead-Acid Battery 150Ah 12V", category: "battery", uom: "nos", is_serialised: true, tracks_stock: true, warranty_months: 36, gst_rate_bp: 2800, price_paise: 1550000 },
    { id: "a0000004-0000-0000-0000-000000000002", sku: "BAT-5KWH-LIFE", name: "Lithium Iron Phosphate Battery 5.12kWh 48V", category: "battery", uom: "nos", is_serialised: true, tracks_stock: true, warranty_months: 60, gst_rate_bp: 1800, price_paise: 9500000 },
    { id: "a0000005-0000-0000-0000-000000000001", sku: "CC-MPPT-60A", name: "Solar MPPT Charge Controller 60A 48V", category: "charge_controller", uom: "nos", is_serialised: true, tracks_stock: true, warranty_months: 24, gst_rate_bp: 1200, price_paise: 1100000 },
    { id: "a0000006-0000-0000-0000-000000000001", sku: "STR-RCC-FLAT-1KW", name: "GI Elevated Structure RCC Flat Roof 1kW", category: "structure", uom: "set", is_serialised: false, tracks_stock: true, warranty_months: 60, gst_rate_bp: 1800, price_paise: 450000 },
    { id: "a0000007-0000-0000-0000-000000000001", sku: "CBL-DC-4SQMM", name: "Solar DC Cable 4 sq mm Red/Black (per meter)", category: "cable", uom: "mtr", is_serialised: false, tracks_stock: true, warranty_months: 12, gst_rate_bp: 1800, price_paise: 5500 },
    { id: "a0000007-0000-0000-0000-000000000002", sku: "CBL-AC-4SQMM", name: "Copper Armoured AC Cable 4 sq mm 4-core (per meter)", category: "cable", uom: "mtr", is_serialised: false, tracks_stock: true, warranty_months: 12, gst_rate_bp: 1800, price_paise: 14000 },
    { id: "a0000008-0000-0000-0000-000000000001", sku: "BOS-KIT-1-3KW", name: "BOS Kit (ACDB + DCDB + Earthing Kit + Lightning Arrestor)", category: "protection", uom: "set", is_serialised: false, tracks_stock: true, warranty_months: 24, gst_rate_bp: 1800, price_paise: 1200000 },
    { id: "a0000009-0000-0000-0000-000000000001", sku: "MTR-NET-3PH", name: "DISCOM Approved 3-Phase Bi-Directional Net Meter", category: "accessory", uom: "nos", is_serialised: true, tracks_stock: true, warranty_months: 36, gst_rate_bp: 1800, price_paise: 850000 },
    { id: "a0000010-0000-0000-0000-000000000001", sku: "SRV-INSTALL-KW", name: "Standard Rooftop Installation & Commissioning Service (per kW)", category: "service", uom: "kw", is_serialised: false, tracks_stock: false, warranty_months: 12, gst_rate_bp: 1800, price_paise: 500000 }
  ];

  for (const pr of products) {
    const { error } = await sb.from("products").upsert(pr, { onConflict: "sku" });
    if (error) console.error("Error product:", pr.sku, error.message);
  }
  console.log("✓ Products seeded.");

  // 4. PACKAGE TEMPLATES (10 Packages: 1-5 kW On-Grid & Off-Grid)
  console.log("4. Seeding 10 Package Templates...");
  const templates = [
    { id: "b0000001-0000-0000-0000-000000000001", name: "1 kW Residential On-Grid", code: "PKG-OG-1KW", system_type: "on_grid", capacity_kw: 1.0, is_active: true, description: "Compact 1 kW on-grid solar system. Approx 120 units/month." },
    { id: "b0000001-0000-0000-0000-000000000002", name: "2 kW Residential On-Grid", code: "PKG-OG-2KW", system_type: "on_grid", capacity_kw: 2.0, is_active: true, description: "2 kW on-grid solar system with DCR panels. Approx 240 units/month." },
    { id: "b0000001-0000-0000-0000-000000000003", name: "3 kW Residential On-Grid (PM Surya Ghar)", code: "PKG-OG-3KW", system_type: "on_grid", capacity_kw: 3.0, is_active: true, description: "Most popular 3 kW residential on-grid package. Eligible for ₹78,000 central subsidy." },
    { id: "b0000001-0000-0000-0000-000000000004", name: "4 kW Residential On-Grid", code: "PKG-OG-4KW", system_type: "on_grid", capacity_kw: 4.0, is_active: true, description: "4 kW on-grid solar system. Approx 480 units/month." },
    { id: "b0000001-0000-0000-0000-000000000005", name: "5 kW Residential On-Grid", code: "PKG-OG-5KW", system_type: "on_grid", capacity_kw: 5.0, is_active: true, description: "High-capacity 5 kW residential on-grid package. Approx 600 units/month." },
    { id: "b0000002-0000-0000-0000-000000000001", name: "1 kW Rural Off-Grid with Battery", code: "PKG-OFF-1KW", system_type: "off_grid", capacity_kw: 1.0, is_active: true, description: "1 kW standalone off-grid solar system with battery backup." },
    { id: "b0000002-0000-0000-0000-000000000002", name: "2 kW Rural Off-Grid with Battery", code: "PKG-OFF-2KW", system_type: "off_grid", capacity_kw: 2.0, is_active: true, description: "2 kW standalone off-grid solar system with 2x 150Ah batteries." },
    { id: "b0000002-0000-0000-0000-000000000003", name: "3 kW Standalone Off-Grid with Battery", code: "PKG-OFF-3KW", system_type: "off_grid", capacity_kw: 3.0, is_active: true, description: "3 kW off-grid solar system with 4x 150Ah batteries." },
    { id: "b0000002-0000-0000-0000-000000000004", name: "4 kW Standalone Off-Grid with Battery", code: "PKG-OFF-4KW", system_type: "off_grid", capacity_kw: 4.0, is_active: true, description: "4 kW off-grid solar system with Lithium battery bank." },
    { id: "b0000002-0000-0000-0000-000000000005", name: "5 kW Commercial Off-Grid with LiFePO4", code: "PKG-OFF-5KW", system_type: "off_grid", capacity_kw: 5.0, is_active: true, description: "5 kW heavy-duty off-grid solar system with 5.12kWh LiFePO4 battery." }
  ];

  for (const t of templates) {
    const { error } = await sb.from("package_templates").upsert(t, { onConflict: "code" });
    if (error) console.error("Error template:", t.code, error.message);
  }
  console.log("✓ Package Templates seeded.");

  // 5. FAULT CODES
  console.log("5. Seeding Fault Codes...");
  const faultCodes = [
    { brand: "GENERIC", code: "ERR_INV_GRID_FAIL", title: "Grid Sync / Voltage Failure", severity: "high", likely_cause: "Grid voltage or frequency out of inverter operating window", suggested_action: "Check AC isolator, check grid voltage on multi-meter, test inverter sync" },
    { brand: "GENERIC", code: "ERR_INV_OVERHEAT", title: "Inverter Overtemperature", severity: "medium", likely_cause: "Inverter internal heat sink temperature exceeded limit", suggested_action: "Clear ventilation grilles, inspect cooling fan operation, check direct sun exposure" },
    { brand: "GENERIC", code: "ERR_INV_ISO_FAULT", title: "DC Array Insulation Fault", severity: "high", likely_cause: "PV array DC insulation resistance to earth too low (< 1 MΩ)", suggested_action: "Inspect DC cable joints for moisture ingress, test string-to-ground resistance" },
    { brand: "GENERIC", code: "ERR_PAN_HOTSPOT", title: "PV Panel Localized Hotspot", severity: "high", likely_cause: "Localized hot cell on PV module causing string drop", suggested_action: "IR thermal scan of array, replace affected serialised panel under manufacturer warranty" },
    { brand: "GENERIC", code: "ERR_BAT_LOW_CAPACITY", title: "Battery Low DOD Capacity", severity: "medium", likely_cause: "Battery bank capacity degraded below 70% nominal DOD", suggested_action: "Conduct C10 discharge test, check individual cell gravity / voltage balance" },
    { brand: "GENERIC", code: "ERR_MTR_COMM_FAIL", title: "Net Meter Communication Loss", severity: "low", likely_cause: "Net meter RS485 communication link timed out", suggested_action: "Check RJ45 / RS485 cable termination, verify baud rate 9600" }
  ];

  for (const fc of faultCodes) {
    const { error } = await sb.from("fault_codes").upsert(fc, { onConflict: "brand,code" });
    if (error) console.error("Error fault code:", fc.code, error.message);
  }
  console.log("✓ Fault Codes seeded.");

  // 6. REALISTIC CUSTOMERS & LEADS
  console.log("6. Seeding Customers & Leads...");
  const customer1 = {
    id: "c1111111-0000-0000-0000-000000000001",
    name: "Anita Sharma",
    phone_e164: "+919876543210",
    email: "anita.sharma@example.com",
    customer_type: "residential",
    billing_address: "Plot 14, Lotus Park, Baner, Pune",
    billing_city: "Pune",
    billing_state: "Maharashtra",
    billing_pincode: "411045"
  };
  const { error: custErr } = await sb.from("customers").upsert(customer1, { onConflict: "id" });
  if (custErr) console.error("Customer error:", custErr);

  const lead1 = {
    id: "d1111111-0000-0000-0000-000000000001",
    lead_no: "LD-2627-00001",
    customer_id: customer1.id,
    source: "web",
    status: "converted",
    requested_kw: 3.0,
    requirement: "on_grid",
    wants_subsidy: true,
    site_address: "Plot 14, Lotus Park, Baner, Pune",
    site_city: "Pune",
    owner_id: "33333333-3333-3333-3333-333333333333",
    notes: "Golden Thread resident. Interested in PM Surya Ghar central subsidy. Monthly bill ₹3,800."
  };
  const { error: leadErr } = await sb.from("leads").upsert(lead1, { onConflict: "id" });
  if (leadErr) console.error("Lead error:", leadErr);
  console.log("✓ Lead & Customer seeded.");

  // 7. PROJECT & SURVEY
  console.log("7. Seeding Project, Survey Job & Approved Survey...");
  const project1 = {
    id: "b1111111-0000-0000-0000-000000000001",
    project_no: "PRJ-2627-00001",
    customer_id: customer1.id,
    lead_id: lead1.id,
    stage: "order_confirmed",
    customer_type: "residential",
    system_type: "on_grid",
    requested_kw: 3.0,
    final_kw: 3.0,
    site_address: "Plot 14, Lotus Park, Baner, Pune",
    site_city: "Pune",
    site_state: "Maharashtra",
    site_pincode: "411045"
  };
  const { error: prjErr } = await sb.from("projects").upsert(project1, { onConflict: "project_no" });
  if (prjErr) console.error("Project error:", prjErr);

  const job1 = {
    id: "a1111111-0000-0000-0000-000000000001",
    job_no: "JOB-2627-00001",
    project_id: project1.id,
    type: "survey",
    status: "completed",
    title: "Site Survey for Anita Sharma (3 kW Rooftop)",
    scheduled_start: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    scheduled_end: new Date(Date.now() - 1000 * 60 * 60 * 70).toISOString(),
    site_address: "Plot 14, Lotus Park, Baner, Pune"
  };
  const { error: jobErr } = await sb.from("jobs").upsert(job1, { onConflict: "job_no" });
  if (jobErr) console.error("Job error:", jobErr);

  const survey1 = {
    id: "d2222222-0000-0000-0000-000000000001",
    job_id: job1.id,
    project_id: project1.id,
    revision: 1,
    status: "approved",
    roof_direction: "south",
    roof_tilt_deg: 20,
    roof_type: "rcc_flat",
    shadow_free_area_sqft: 320,
    cable_dc_m: 14,
    cable_ac_m: 8,
    feasibility: "feasible",
    recommended_kw: 3.0,
    notes: "South-facing terrace with RCC parapet. Clear sky access, minimal morning parapet shade. DISCOM meter accessible on ground floor.",
    review_note: "Approved by Operations Manager. Proceed with 3 kW On-Grid BOM."
  };
  const { error: srvErr } = await sb.from("surveys").upsert(survey1, { onConflict: "job_id" });
  if (srvErr) console.error("Survey error:", srvErr);
  console.log("✓ Project & Approved Survey seeded.");

  // 8. QUOTE & ORDER
  console.log("8. Seeding Quote & Order...");
  const quote1 = {
    id: "c2222222-0000-0000-0000-000000000001",
    quote_no: "QT-2627-00001",
    version: 1,
    project_id: project1.id,
    survey_id: survey1.id,
    template_id: "b0000001-0000-0000-0000-000000000003",
    status: "accepted",
    system_type: "on_grid",
    nominal_kw: 3.0,
    subtotal_paise: 16228500,
    discount_paise: 0,
    taxable_paise: 16228500,
    gst_paise: 2271500,
    total_paise: 18500000,
    subsidy_eligible: true,
    subsidy_paise: 7800000,
    net_cost_paise: 10700000,
    valid_until: "2026-12-31",
    created_by: "33333333-3333-3333-3333-333333333333"
  };
  const { error: quoteErr } = await sb.from("quotes").upsert(quote1, { onConflict: "id" });
  if (quoteErr) console.error("Quote error:", quoteErr);

  const order1 = {
    id: "01111111-0000-0000-0000-000000000001",
    order_no: "ORD-2627-00001",
    project_id: project1.id,
    quote_id: quote1.id,
    status: "confirmed",
    pay_status: "advance_met",
    taxable_paise: 16228500,
    gst_paise: 2271500,
    total_paise: 18500000,
    advance_required_paise: 9250000,
    paid_paise: 9250000,
    delivery_name: "Anita Sharma",
    delivery_address: "Plot 14, Lotus Park, Baner, Pune",
    confirmed_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
  };
  const { error: ordErr } = await sb.from("orders").upsert(order1, { onConflict: "order_no" });
  if (ordErr) console.error("Order error:", ordErr);
  console.log("✓ Quote & Order seeded.");

  // 9. ASSETS & WARRANTIES (The Golden Thread: 20y Panels, 2y Inverter)
  console.log("9. Seeding Assets & Warranties...");
  const panelProduct = products[0]; // 540W Mono PERC
  const inverterProduct = products[4]; // 3 kW On-Grid Inverter

  const stockUnitPan1 = {
    id: "f1111111-0000-0000-0000-000000000001",
    product_id: panelProduct.id,
    serial_no: "SP-PAN-2026-0001",
    status: "delivered",
    received_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString()
  };
  await sb.from("stock_units").upsert(stockUnitPan1, { onConflict: "id" });

  const stockUnitInv1 = {
    id: "f1111111-0000-0000-0000-000000000002",
    product_id: inverterProduct.id,
    serial_no: "SP-INV-2026-0001",
    status: "delivered",
    received_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString()
  };
  await sb.from("stock_units").upsert(stockUnitInv1, { onConflict: "id" });

  const assets = [
    {
      id: "e1111111-0000-0000-0000-000000000001",
      stock_unit_id: stockUnitPan1.id,
      customer_id: customer1.id,
      project_id: project1.id,
      order_id: order1.id,
      product_id: panelProduct.id,
      serial_no: "SP-PAN-2026-0001",
      status: "delivered",
      delivered_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
      warranty_months: 240,
      warranty_start: "2026-10-21",
      warranty_end: "2046-10-21" // 20 years
    },
    {
      id: "e1111111-0000-0000-0000-000000000002",
      stock_unit_id: stockUnitInv1.id,
      customer_id: customer1.id,
      project_id: project1.id,
      order_id: order1.id,
      product_id: inverterProduct.id,
      serial_no: "SP-INV-2026-0001",
      status: "delivered",
      delivered_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
      warranty_months: 24,
      warranty_start: "2026-10-21",
      warranty_end: "2028-10-21" // 2 years
    }
  ];

  for (const a of assets) {
    const { error } = await sb.from("assets").upsert(a, { onConflict: "id" });
    if (error) console.error("Error asset:", a.serial_no, error.message);
  }
  console.log("✓ Assets & Warranties seeded.");

  console.log("✨ Database seeding complete! All core entities ready for live operations.");
}

seed().catch(console.error);
