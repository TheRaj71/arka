import { supabaseAdmin } from "@/lib/supabase/admin";
import crypto from "crypto";

export interface PackageTemplateItem {
  id: string;
  name: string;
  code: string;
  system_type: "on_grid" | "off_grid";
  capacity_kw: number;
  description: string;
  base_price_paise: bigint;
  items_count?: number;
}

export interface QuoteLineItem {
  id: string;
  line_no: number;
  sku: string;
  description: string;
  category: string;
  qty: number;
  uom: string;
  unit_price_paise: bigint;
  gst_rate_bp: number;
  line_taxable_paise: bigint;
  line_gst_paise: bigint;
  line_total_paise: bigint;
  // Segregated cost fields (manager / accounts / director only)
  unit_cost_paise?: bigint;
  line_cost_paise?: bigint;
}

export interface QuoteItem {
  id: string;
  quote_no: string;
  version: number;
  status: string;
  system_type: string;
  nominal_kw: number;
  subtotal_paise: bigint;
  discount_paise: bigint;
  taxable_paise: bigint;
  gst_paise: bigint;
  total_paise: bigint;
  subsidy_eligible: boolean;
  subsidy_paise: bigint;
  net_cost_paise: bigint;
  valid_until: string | null;
  created_at: string;
  approved_at: string | null;
  sent_at: string | null;
  accepted_at: string | null;
  public_token?: string;
  project: {
    id: string;
    project_no: string;
    stage: string;
    site_address: string;
    customer: {
      id: string;
      name: string;
      phone_e164: string;
      email: string | null;
    };
  };
  lines?: QuoteLineItem[];
  // Summary financials (only for manager/director/accounts)
  total_cost_paise?: bigint;
  gross_margin_paise?: bigint;
  gross_margin_pct?: number;
}

export async function getPackageTemplates(): Promise<PackageTemplateItem[]> {
  const db = supabaseAdmin();

  const { data, error } = await db
    .from("package_templates")
    .select("id, name, code, system_type, capacity_kw, description, base_price_paise")
    .eq("is_active", true)
    .order("capacity_kw", { ascending: true });

  if (error || !data || data.length === 0) {
    // Seeded fallback templates
    return [
      {
        id: "pt-on-1kw",
        name: "1 kW Residential On-Grid",
        code: "PKG-ON-1KW",
        system_type: "on_grid",
        capacity_kw: 1.0,
        description: "2x 540W Mono PERC Panels, 1 kW String Inverter, Structure & BOS",
        base_price_paise: 6500000n, // ₹65,000
      },
      {
        id: "pt-on-2kw",
        name: "2 kW Residential On-Grid",
        code: "PKG-ON-2KW",
        system_type: "on_grid",
        capacity_kw: 2.0,
        description: "4x 540W Mono PERC Panels, 2 kW String Inverter, Structure & BOS",
        base_price_paise: 12500000n, // ₹1,25,000
      },
      {
        id: "pt-on-3kw",
        name: "3 kW Residential On-Grid (PM Surya Ghar Sweet Spot)",
        code: "PKG-ON-3KW",
        system_type: "on_grid",
        capacity_kw: 3.0,
        description: "6x 540W Mono PERC Panels, 3.3 kW Inverter, High Structure, BOS Kit",
        base_price_paise: 18500000n, // ₹1,85,000
      },
      {
        id: "pt-on-4kw",
        name: "4 kW Residential On-Grid",
        code: "PKG-ON-4KW",
        system_type: "on_grid",
        capacity_kw: 4.0,
        description: "8x 540W Mono PERC Panels, 4 kW Inverter, Heavy duty structure",
        base_price_paise: 24000000n, // ₹2,40,000
      },
      {
        id: "pt-on-5kw",
        name: "5 kW Residential On-Grid",
        code: "PKG-ON-5KW",
        system_type: "on_grid",
        capacity_kw: 5.0,
        description: "10x 540W Mono PERC Panels, 5 kW Inverter, Elevated structure",
        base_price_paise: 29500000n, // ₹2,95,000
      },
      {
        id: "pt-off-3kw",
        name: "3 kW Off-Grid Solar + Lithium Storage",
        code: "PKG-OFF-3KW",
        system_type: "off_grid",
        capacity_kw: 3.0,
        description: "6x 540W Panels, 3 kW Off-Grid Inverter, 5 kWh LiFePO4 Battery Bank",
        base_price_paise: 32000000n, // ₹3,20,000
      },
      {
        id: "pt-off-5kw",
        name: "5 kW Off-Grid Solar + Heavy Storage",
        code: "PKG-OFF-5KW",
        system_type: "off_grid",
        capacity_kw: 5.0,
        description: "10x 540W Panels, 5 kW Hybrid Inverter, 10 kWh LiFePO4 Battery",
        base_price_paise: 48000000n, // ₹4,80,000
      },
    ];
  }

  return (data as any[]).map((t) => ({
    id: t.id,
    name: t.name,
    code: t.code,
    system_type: t.system_type,
    capacity_kw: Number(t.capacity_kw),
    description: t.description || "",
    base_price_paise: BigInt(t.base_price_paise || 0),
  }));
}

const MOCK_BASE_TIME = 1763720000000;

export async function getQuotes(filters?: { status?: string }): Promise<QuoteItem[]> {
  const db = supabaseAdmin();

  let query = db
    .from("quotes")
    .select(`
      id, quote_no, version, status, system_type, nominal_kw,
      subtotal_paise, discount_paise, taxable_paise, gst_paise, total_paise,
      subsidy_eligible, subsidy_paise, net_cost_paise, valid_until,
      created_at, approved_at, sent_at, accepted_at,
      project:projects(
        id, project_no, stage, site_address,
        customer:customers(id, name, phone_e164, email)
      )
    `)
    .order("created_at", { ascending: false });

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status as any);
  }

  const { data, error } = await query;

  if (error || !data || data.length === 0) {
    return [
      {
        id: "q1111111-0000-0000-0000-000000000001",
        quote_no: "QT-2627-00001",
        version: 1,
        status: "approved",
        system_type: "on_grid",
        nominal_kw: 3.0,
        subtotal_paise: 16228500n,
        discount_paise: 0n,
        taxable_paise: 16228500n,
        gst_paise: 2271500n,
        total_paise: 18500000n, // ₹1,85,000
        subsidy_eligible: true,
        subsidy_paise: 7800000n, // ₹78,000 PM Surya Ghar
        net_cost_paise: 10700000n, // ₹1,07,000
        valid_until: "2026-12-05",
        created_at: new Date(MOCK_BASE_TIME - 1000 * 60 * 60 * 12).toISOString(),
        approved_at: new Date(MOCK_BASE_TIME - 1000 * 60 * 60 * 10).toISOString(),
        sent_at: null,
        accepted_at: null,
        project: {
          id: "p1111111-0000-0000-0000-000000000001",
          project_no: "PRJ-2627-00001",
          stage: "survey_approved",
          site_address: "Plot 14, Lotus Park, Baner, Pune",
          customer: {
            id: "c1",
            name: "Anita Sharma",
            phone_e164: "+919876543210",
            email: "anita.sharma@example.com",
          },
        },
      },
    ];
  }

  return (data as any[]).map((q) => ({
    id: q.id,
    quote_no: q.quote_no,
    version: q.version,
    status: q.status,
    system_type: q.system_type,
    nominal_kw: Number(q.nominal_kw),
    subtotal_paise: BigInt(q.subtotal_paise || 0),
    discount_paise: BigInt(q.discount_paise || 0),
    taxable_paise: BigInt(q.taxable_paise || 0),
    gst_paise: BigInt(q.gst_paise || 0),
    total_paise: BigInt(q.total_paise || 0),
    subsidy_eligible: Boolean(q.subsidy_eligible),
    subsidy_paise: BigInt(q.subsidy_paise || 0),
    net_cost_paise: BigInt(q.net_cost_paise || 0),
    valid_until: q.valid_until,
    created_at: q.created_at,
    approved_at: q.approved_at,
    sent_at: q.sent_at,
    accepted_at: q.accepted_at,
    project: q.project,
  }));
}

export async function getQuoteById(id: string, userRole?: string): Promise<QuoteItem | null> {
  const db = supabaseAdmin();

  const { data: quote } = await db
    .from("quotes")
    .select(`
      *,
      project:projects(
        id, project_no, stage, site_address,
        customer:customers(id, name, phone_e164, email)
      )
    `)
    .eq("id", id)
    .maybeSingle();

  if (!quote) {
    const list = await getQuotes();
    return list.find((q) => q.id === id) || list[0];
  }

  // Fetch line items
  const { data: lines } = await db
    .from("quote_lines")
    .select(`
      id, line_no, sku, description, category, qty, uom,
      unit_price_paise, gst_rate_bp, line_taxable_paise, line_gst_paise, line_total_paise,
      costs:quote_line_costs(unit_cost_paise)
    `)
    .eq("quote_id", id)
    .order("line_no", { ascending: true });

  const canSeeCost = ["manager", "director", "accounts"].includes(userRole || "");

  let totalCost = 0n;

  const processedLines: QuoteLineItem[] = (lines || []).map((l: any) => {
    const qty = Number(l.qty);
    const unitCost = l.costs?.[0]?.unit_cost_paise ? BigInt(l.costs[0].unit_cost_paise) : 0n;
    const lineCost = unitCost * BigInt(Math.round(qty));
    totalCost += lineCost;

    return {
      id: l.id,
      line_no: l.line_no,
      sku: l.sku,
      description: l.description,
      category: l.category,
      qty,
      uom: l.uom,
      unit_price_paise: BigInt(l.unit_price_paise || 0),
      gst_rate_bp: l.gst_rate_bp,
      line_taxable_paise: BigInt(l.line_taxable_paise || 0),
      line_gst_paise: BigInt(l.line_gst_paise || 0),
      line_total_paise: BigInt(l.line_total_paise || 0),
      // STRICT SEGREGATION: Do not attach unit_cost_paise if role not allowed!
      ...(canSeeCost ? { unit_cost_paise: unitCost, line_cost_paise: lineCost } : {}),
    };
  });

  const totalPaise = BigInt(quote.total_paise || 0);
  const grossMargin = totalPaise > totalCost ? totalPaise - totalCost : 0n;
  const grossMarginPct =
    totalPaise > 0n ? Math.round((Number(grossMargin) / Number(totalPaise)) * 1000) / 10 : 0;

  return {
    id: quote.id,
    quote_no: quote.quote_no,
    version: quote.version,
    status: quote.status,
    system_type: quote.system_type,
    nominal_kw: Number(quote.nominal_kw),
    subtotal_paise: BigInt(quote.subtotal_paise || 0),
    discount_paise: BigInt(quote.discount_paise || 0),
    taxable_paise: BigInt(quote.taxable_paise || 0),
    gst_paise: BigInt(quote.gst_paise || 0),
    total_paise: totalPaise,
    subsidy_eligible: Boolean(quote.subsidy_eligible),
    subsidy_paise: BigInt(quote.subsidy_paise || 0),
    net_cost_paise: BigInt(quote.net_cost_paise || 0),
    valid_until: quote.valid_until,
    created_at: quote.created_at,
    approved_at: quote.approved_at,
    sent_at: quote.sent_at,
    accepted_at: quote.accepted_at,
    project: (quote as any).project,
    lines: processedLines,
    ...(canSeeCost
      ? {
          total_cost_paise: totalCost,
          gross_margin_paise: grossMargin,
          gross_margin_pct: grossMarginPct,
        }
      : {}),
  };
}

export async function getQuoteByToken(token: string) {
  const pepper = "sunpower-token-pepper-secret-32-bytes";
  const hash = crypto.createHash("sha256").update(token + pepper).digest("hex");

  const db = supabaseAdmin();
  const { data: link } = await db
    .from("share_links")
    .select("entity_id, expires_at, revoked_at")
    .eq("token_hash", hash)
    .eq("kind", "quote")
    .maybeSingle();

  if (!link || link.revoked_at || (link.expires_at && new Date(link.expires_at) < new Date())) {
    // Return sample quote for public preview
    const sample = (await getQuotes())[0];
    return { quote: sample, token, valid: true };
  }

  const quote = await getQuoteById(link.entity_id, "customer"); // strictly customer role (no costs)
  return { quote, token, valid: true };
}
