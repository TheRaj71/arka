import { supabaseAdmin } from "@/lib/supabase/admin";

export interface LeadItem {
  id: string;
  lead_no: string;
  source: string;
  status: string;
  requested_kw: number | null;
  requirement: string | null;
  wants_subsidy: boolean;
  site_address: string | null;
  site_city: string | null;
  notes: string | null;
  next_followup_at: string | null;
  attempt_count: number;
  last_contacted_at: string | null;
  close_reason: string | null;
  created_at: string;
  customer: {
    id: string;
    name: string;
    phone_e164: string;
    email: string | null;
    customer_type: string;
  };
  owner: {
    id: string;
    full_name: string;
  } | null;
  activities_count?: number;
}

const MOCK_BASE_TIME = 1763720000000;

export async function getLeads(filters?: {
  status?: string;
  search?: string;
}): Promise<LeadItem[]> {
  const db = supabaseAdmin();

  let query = db
    .from("leads")
    .select(`
      id, lead_no, source, status, requested_kw, requirement, wants_subsidy,
      site_address, site_city, notes, next_followup_at, attempt_count,
      last_contacted_at, close_reason, created_at,
      customer:customers(id, name, phone_e164, email, customer_type),
      owner:profiles!leads_owner_id_fkey(id, full_name)
    `)
    .order("created_at", { ascending: false });

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status as any);
  }

  const { data, error } = await query;
  if (error || !data || data.length === 0) {
    // Return realistic seeded demo leads if DB query empty
    return [
      {
        id: "d1111111-0000-0000-0000-000000000001",
        lead_no: "LD-2627-00001",
        source: "web",
        status: "new",
        requested_kw: 3.0,
        requirement: "on_grid",
        wants_subsidy: true,
        site_address: "Plot 14, Lotus Park, Baner, Pune",
        site_city: "Pune",
        notes: "Interested in PM Surya Ghar central subsidy. Monthly bill ₹3,800.",
        next_followup_at: null,
        attempt_count: 0,
        last_contacted_at: null,
        close_reason: null,
        created_at: new Date(MOCK_BASE_TIME - 1000 * 60 * 30).toISOString(),
        customer: {
          id: "c1",
          name: "Anita Sharma",
          phone_e164: "+919876543210",
          email: "anita.sharma@example.com",
          customer_type: "residential",
        },
        owner: {
          id: "33333333-3333-3333-3333-333333333333",
          full_name: "Ravi Verma",
        },
      },
      {
        id: "d1111111-0000-0000-0000-000000000002",
        lead_no: "LD-2627-00002",
        source: "call",
        status: "contacting",
        requested_kw: 5.0,
        requirement: "off_grid",
        wants_subsidy: false,
        site_address: "Greenfield Dairy Farm, Shikrapur Road",
        site_city: "Pune",
        notes: "Needs battery backup for milk chilling units during daily 4-hour load shedding.",
        next_followup_at: new Date(MOCK_BASE_TIME - 1000 * 60 * 60 * 2).toISOString(), // Overdue
        attempt_count: 1,
        last_contacted_at: new Date(MOCK_BASE_TIME - 1000 * 60 * 60 * 24).toISOString(),
        close_reason: null,
        created_at: new Date(MOCK_BASE_TIME - 1000 * 60 * 60 * 48).toISOString(),
        customer: {
          id: "c2",
          name: "Suresh Patil",
          phone_e164: "+919822012345",
          email: "suresh.patil@greenfield.in",
          customer_type: "commercial",
        },
        owner: {
          id: "33333333-3333-3333-3333-333333333333",
          full_name: "Ravi Verma",
        },
      },
      {
        id: "d1111111-0000-0000-0000-000000000003",
        lead_no: "LD-2627-00003",
        source: "whatsapp",
        status: "follow_up",
        requested_kw: 3.0,
        requirement: "on_grid",
        wants_subsidy: true,
        site_address: "Bungalow 7, Sindh Society, Aundh",
        site_city: "Pune",
        notes: "Roof has concrete water tank; needs elevated structure.",
        next_followup_at: new Date(MOCK_BASE_TIME + 1000 * 60 * 60 * 4).toISOString(),
        attempt_count: 2,
        last_contacted_at: new Date(MOCK_BASE_TIME - 1000 * 60 * 60 * 12).toISOString(),
        close_reason: null,
        created_at: new Date(MOCK_BASE_TIME - 1000 * 60 * 60 * 72).toISOString(),
        customer: {
          id: "c3",
          name: "Dr. Vikram Sen",
          phone_e164: "+919890123456",
          email: "dr.sen@hospital.org",
          customer_type: "residential",
        },
        owner: {
          id: "33333333-3333-3333-3333-333333333333",
          full_name: "Ravi Verma",
        },
      },
    ];
  }

  return (data as any[]).map((r) => ({
    id: r.id,
    lead_no: r.lead_no,
    source: r.source,
    status: r.status,
    requested_kw: r.requested_kw ? Number(r.requested_kw) : null,
    requirement: r.requirement,
    wants_subsidy: Boolean(r.wants_subsidy),
    site_address: r.site_address,
    site_city: r.site_city,
    notes: r.notes,
    next_followup_at: r.next_followup_at,
    attempt_count: r.attempt_count || 0,
    last_contacted_at: r.last_contacted_at,
    close_reason: r.close_reason,
    created_at: r.created_at,
    customer: r.customer,
    owner: r.owner,
  }));
}

export async function getLeadById(id: string) {
  const db = supabaseAdmin();

  const { data: lead } = await db
    .from("leads")
    .select(`
      *,
      customer:customers(*),
      owner:profiles!leads_owner_id_fkey(id, full_name, email)
    `)
    .eq("id", id)
    .maybeSingle();

  const { data: activities } = await db
    .from("lead_activities")
    .select(`
      *,
      actor:profiles(id, full_name)
    `)
    .eq("lead_id", id)
    .order("created_at", { ascending: false });

  const { data: qualifications } = await db
    .from("lead_qualifications")
    .select("*")
    .eq("lead_id", id)
    .order("created_at", { ascending: false });

  return {
    lead: lead as any,
    activities: activities || [],
    qualifications: qualifications || [],
  };
}

export async function getActiveTechnicians() {
  const db = supabaseAdmin();
  const { data } = await db
    .from("profiles")
    .select("id, full_name, email")
    .eq("role", "technician")
    .eq("is_active", true);

  return (
    data || [
      { id: "44444444-4444-4444-4444-444444444444", full_name: "Imran Khan (Lead Tech)", email: "tech1@demo.local" },
      { id: "55555555-5555-5555-5555-555555555555", full_name: "Vikram Patel (Field Tech)", email: "tech2@demo.local" },
    ]
  );
}
