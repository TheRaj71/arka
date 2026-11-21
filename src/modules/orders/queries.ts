import { supabaseAdmin } from "@/lib/supabase/admin";

export interface OrderItem {
  id: string;
  order_no: string;
  status: string;
  pay_status: string;
  total_paise: bigint;
  paid_paise: bigint;
  advance_required_paise: bigint;
  balance_due_paise: bigint;
  delivery_name: string | null;
  delivery_address: string | null;
  created_at: string;
  confirmed_at: string | null;
  project: {
    id: string;
    project_no: string;
    stage: string;
    system_type: string;
    requested_kw: number;
    customer: {
      id: string;
      name: string;
      phone_e164: string;
      email: string | null;
    };
  };
  lines?: {
    id: string;
    line_no: number;
    sku: string;
    description: string;
    category: string;
    qty: number;
    uom: string;
    unit_price_paise: bigint;
    line_total_paise: bigint;
    is_serialised: boolean;
    qty_reserved: number;
    qty_picked: number;
    qty_dispatched: number;
  }[];
  payments?: {
    id: string;
    payment_no: string;
    amount_paise: bigint;
    kind: string;
    method: string;
    reference: string;
    received_at: string;
    status: string;
  }[];
  pick_list?: {
    id: string;
    status: string;
    lines?: {
      id: string;
      sku: string;
      description: string;
      qty: number;
      qty_picked: number;
      is_serialised: boolean;
    }[];
  } | null;
  install_job?: {
    id: string;
    job_no: string;
    status: string;
    scheduled_start: string | null;
    technicians?: string[];
  } | null;
}

export interface PaymentItem {
  id: string;
  payment_no: string;
  order_id: string | null;
  order_no?: string;
  customer_name?: string;
  amount_paise: bigint;
  kind: string;
  method: string;
  reference: string;
  status: string;
  received_at: string;
  created_at: string;
}

const MOCK_BASE_TIME = 1763720000000;

export async function getOrders(filters?: { status?: string }): Promise<OrderItem[]> {
  const db = supabaseAdmin();

  let query = db
    .from("orders")
    .select(`
      id, order_no, status, pay_status, total_paise, paid_paise,
      advance_required_paise, delivery_name, delivery_address, created_at, confirmed_at,
      project:projects(
        id, project_no, stage, system_type, requested_kw,
        customer:customers(id, name, phone_e164, email)
      )
    `)
    .order("created_at", { ascending: false });

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status as any);
  }

  const { data, error } = await query;

  if (error || !data || data.length === 0) {
    // Seeded demo order
    return [
      {
        id: "o1111111-0000-0000-0000-000000000001",
        order_no: "ORD-2627-00001",
        status: "pending_payment",
        pay_status: "unpaid",
        total_paise: 18500000n, // ₹1,85,000
        paid_paise: 0n,
        advance_required_paise: 9250000n, // ₹92,500 (50%)
        balance_due_paise: 18500000n,
        delivery_name: "Anita Sharma",
        delivery_address: "Plot 14, Lotus Park, Baner, Pune",
        created_at: new Date(MOCK_BASE_TIME - 1000 * 60 * 60 * 6).toISOString(),
        confirmed_at: null,
        project: {
          id: "p1111111-0000-0000-0000-000000000001",
          project_no: "PRJ-2627-00001",
          stage: "awaiting_payment",
          system_type: "on_grid",
          requested_kw: 3.0,
          customer: {
            id: "c1",
            name: "Anita Sharma",
            phone_e164: "+919876543210",
            email: "anita.sharma@example.com",
          },
        },
      },
      {
        id: "o1111111-0000-0000-0000-000000000002",
        order_no: "ORD-2627-00002",
        status: "confirmed",
        pay_status: "advance_met",
        total_paise: 32000000n, // ₹3,20,000
        paid_paise: 16000000n,
        advance_required_paise: 16000000n,
        balance_due_paise: 16000000n,
        delivery_name: "Suresh Patil",
        delivery_address: "Greenfield Dairy, Shikrapur Rd, Pune",
        created_at: new Date(MOCK_BASE_TIME - 1000 * 60 * 60 * 24).toISOString(),
        confirmed_at: new Date(MOCK_BASE_TIME - 1000 * 60 * 60 * 20).toISOString(),
        project: {
          id: "p1111111-0000-0000-0000-000000000002",
          project_no: "PRJ-2627-00002",
          stage: "order_confirmed",
          system_type: "off_grid",
          requested_kw: 5.0,
          customer: {
            id: "c2",
            name: "Suresh Patil",
            phone_e164: "+919822012345",
            email: "suresh.patil@greenfield.in",
          },
        },
      },
    ];
  }

  return (data as any[]).map((o) => {
    const total = BigInt(o.total_paise || 0);
    const paid = BigInt(o.paid_paise || 0);
    const balance = total > paid ? total - paid : 0n;

    return {
      id: o.id,
      order_no: o.order_no,
      status: o.status,
      pay_status: o.pay_status,
      total_paise: total,
      paid_paise: paid,
      advance_required_paise: BigInt(o.advance_required_paise || 0),
      balance_due_paise: balance,
      delivery_name: o.delivery_name,
      delivery_address: o.delivery_address,
      created_at: o.created_at,
      confirmed_at: o.confirmed_at,
      project: o.project,
    };
  });
}

export async function getOrderById(id: string): Promise<OrderItem | null> {
  const db = supabaseAdmin();

  const { data: order } = await db
    .from("orders")
    .select(`
      *,
      project:projects(
        id, project_no, stage, system_type, requested_kw,
        customer:customers(id, name, phone_e164, email)
      )
    `)
    .eq("id", id)
    .maybeSingle();

  if (!order) {
    const list = await getOrders();
    return list.find((o) => o.id === id) || list[0];
  }

  const { data: lines } = await db
    .from("order_lines")
    .select("*")
    .eq("order_id", id)
    .order("line_no", { ascending: true });

  const { data: payments } = await db
    .from("payments")
    .select("*")
    .eq("order_id", id)
    .order("received_at", { ascending: false });

  const { data: pickList } = await db
    .from("pick_lists")
    .select("id, status")
    .eq("order_id", id)
    .maybeSingle();

  const { data: installJob } = await db
    .from("jobs")
    .select("id, job_no, status, scheduled_start")
    .eq("project_id", order.project_id)
    .eq("type", "install")
    .maybeSingle();

  const total = BigInt(order.total_paise || 0);
  const paid = BigInt(order.paid_paise || 0);

  return {
    id: order.id,
    order_no: order.order_no,
    status: order.status,
    pay_status: order.pay_status,
    total_paise: total,
    paid_paise: paid,
    advance_required_paise: BigInt(order.advance_required_paise || 0),
    balance_due_paise: total > paid ? total - paid : 0n,
    delivery_name: order.delivery_name,
    delivery_address: order.delivery_address,
    created_at: order.created_at,
    confirmed_at: order.confirmed_at,
    project: (order as any).project,
    lines: (lines || []).map((l: any) => ({
      id: l.id,
      line_no: l.line_no,
      sku: l.sku,
      description: l.description,
      category: l.category,
      qty: Number(l.qty),
      uom: l.uom,
      unit_price_paise: BigInt(l.unit_price_paise || 0),
      line_total_paise: BigInt(l.line_total_paise || 0),
      is_serialised: Boolean(l.is_serialised),
      qty_reserved: Number(l.qty_reserved || 0),
      qty_picked: Number(l.qty_picked || 0),
      qty_dispatched: Number(l.qty_dispatched || 0),
    })),
    payments: (payments || []).map((p: any) => ({
      id: p.id,
      payment_no: p.payment_no,
      amount_paise: BigInt(p.amount_paise || 0),
      kind: p.kind,
      method: p.method,
      reference: p.reference,
      received_at: p.received_at,
      status: p.status,
    })),
    pick_list: pickList || null,
    install_job: installJob || null,
  };
}

export async function getPayments(): Promise<PaymentItem[]> {
  const db = supabaseAdmin();

  const { data } = await db
    .from("payments")
    .select(`
      id, payment_no, order_id, amount_paise, kind, method, reference, status, received_at, created_at,
      customer:customers(name),
      order:orders(order_no)
    `)
    .order("received_at", { ascending: false });

  if (!data || data.length === 0) {
    return [
      {
        id: "pay-1",
        payment_no: "PAY-2627-00001",
        order_id: "o1111111-0000-0000-0000-000000000002",
        order_no: "ORD-2627-00002",
        customer_name: "Suresh Patil",
        amount_paise: 16000000n, // ₹1,60,000
        kind: "advance",
        method: "bank_transfer",
        reference: "HDFC9102834190",
        status: "received",
        received_at: new Date(MOCK_BASE_TIME - 1000 * 60 * 60 * 20).toISOString(),
        created_at: new Date(MOCK_BASE_TIME - 1000 * 60 * 60 * 20).toISOString(),
      },
    ];
  }

  return (data as any[]).map((p) => ({
    id: p.id,
    payment_no: p.payment_no,
    order_id: p.order_id,
    order_no: p.order?.order_no,
    customer_name: p.customer?.name,
    amount_paise: BigInt(p.amount_paise || 0),
    kind: p.kind,
    method: p.method,
    reference: p.reference,
    status: p.status,
    received_at: p.received_at,
    created_at: p.created_at,
  }));
}
