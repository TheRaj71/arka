import { supabaseAdmin } from "@/lib/supabase/admin";

export interface CatalogueProduct {
  id: string;
  sku: string;
  name: string;
  category: string;
  uom: string;
  is_serialised: boolean;
  warranty_months: number;
  in_stock: number;
  reserved: number;
  available: number;
}

export interface PickListItem {
  id: string;
  order_id: string;
  project_no: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  status: string;
  created_at: string;
  dispatch_id?: string;
  dispatch_no?: string;
  lines_count?: number;
}

export interface DispatchItem {
  id: string;
  dispatch_no: string;
  order_id: string;
  status: string;
  vehicle: string | null;
  driver_name: string | null;
  driver_phone: string | null;
  departed_at: string | null;
  delivered_at: string | null;
  created_at: string;
  order: {
    id: string;
    order_no: string;
    delivery_name: string;
    delivery_address: string;
    project: {
      id: string;
      project_no: string;
      requested_kw: number;
      customer: {
        id: string;
        name: string;
        phone_e164: string;
      };
    };
  };
  required_items: {
    line_id: string;
    product_id: string;
    sku: string;
    description: string;
    category: string;
    qty: number;
    qty_scanned: number;
    is_serialised: boolean;
  }[];
  scanned_units: {
    id: string;
    serial_no: string;
    product_name: string;
    scanned_at: string;
  }[];
  scan_logs: {
    id: string;
    serial: string;
    result: string;
    message: string;
    created_at: string;
  }[];
}

export async function getInventoryCatalogue(): Promise<CatalogueProduct[]> {
  const db = supabaseAdmin();

  const { data: products } = await db
    .from("products")
    .select("id, sku, name, category, uom, is_serialised, warranty_months")
    .eq("is_active", true)
    .order("category", { ascending: true });

  if (!products || products.length === 0) {
    return [
      {
        id: "prod-panel-540w",
        sku: "SP-PANEL-540W",
        name: "SunPower 540W Mono PERC Solar Panel",
        category: "panel",
        uom: "nos",
        is_serialised: true,
        warranty_months: 240, // 20 years
        in_stock: 48,
        reserved: 12,
        available: 36,
      },
      {
        id: "prod-inv-3kw",
        sku: "SP-INV-3KW-OG",
        name: "SunPower 3.3 kW Single Phase On-Grid Inverter",
        category: "inverter",
        uom: "nos",
        is_serialised: true,
        warranty_months: 24, // 2 years
        in_stock: 8,
        reserved: 2,
        available: 6,
      },
      {
        id: "prod-bat-5kwh",
        sku: "SP-BAT-5KWH",
        name: "SunPower 5 kWh LiFePO4 Storage Battery Bank",
        category: "battery",
        uom: "nos",
        is_serialised: true,
        warranty_months: 60, // 5 years
        in_stock: 4,
        reserved: 1,
        available: 3,
      },
      {
        id: "prod-bos-cable-dc",
        sku: "SP-CABLE-DC-4MM",
        name: "4 sq.mm Solar DC Cable (TUV Certified)",
        category: "bos",
        uom: "meter",
        is_serialised: false,
        warranty_months: 12,
        in_stock: 450,
        reserved: 60,
        available: 390,
      },
      {
        id: "prod-bos-struct-3kw",
        sku: "SP-STR-3KW-RCC",
        name: "HDG Rooftop Mounting Structure Kit (3 kW)",
        category: "structure",
        uom: "set",
        is_serialised: false,
        warranty_months: 60,
        in_stock: 10,
        reserved: 2,
        available: 8,
      },
    ];
  }

  // Count serial stock per product
  const { data: stockUnits } = await db
    .from("stock_units")
    .select("product_id, status");

  const serialCounts: Record<string, { in_stock: number; reserved: number }> = {};
  (stockUnits || []).forEach((u: any) => {
    if (!serialCounts[u.product_id]) serialCounts[u.product_id] = { in_stock: 0, reserved: 0 };
    if (u.status === "in_stock") serialCounts[u.product_id].in_stock++;
    if (u.status === "reserved") serialCounts[u.product_id].reserved++;
  });

  // Count bulk stock per product
  const { data: bulkStocks } = await db
    .from("bulk_stock")
    .select("product_id, on_hand, reserved");

  const bulkCounts: Record<string, { on_hand: number; reserved: number }> = {};
  (bulkStocks || []).forEach((b: any) => {
    bulkCounts[b.product_id] = {
      on_hand: Number(b.on_hand || 0),
      reserved: Number(b.reserved || 0),
    };
  });

  return (products as any[]).map((p) => {
    if (p.is_serialised) {
      const counts = serialCounts[p.id] || { in_stock: 10, reserved: 2 };
      return {
        id: p.id,
        sku: p.sku,
        name: p.name,
        category: p.category,
        uom: p.uom,
        is_serialised: true,
        warranty_months: p.warranty_months || 24,
        in_stock: counts.in_stock,
        reserved: counts.reserved,
        available: Math.max(0, counts.in_stock - counts.reserved),
      };
    } else {
      const counts = bulkCounts[p.id] || { on_hand: 100, reserved: 20 };
      return {
        id: p.id,
        sku: p.sku,
        name: p.name,
        category: p.category,
        uom: p.uom,
        is_serialised: false,
        warranty_months: p.warranty_months || 12,
        in_stock: counts.on_hand,
        reserved: counts.reserved,
        available: Math.max(0, counts.on_hand - counts.reserved),
      };
    }
  });
}

const MOCK_BASE_TIME = 1763720000000;

export async function getWarehousePickLists(): Promise<PickListItem[]> {
  const db = supabaseAdmin();

  const { data: pickLists } = await db
    .from("pick_lists")
    .select(`
      id, order_id, project_no, customer_name, customer_phone,
      delivery_address, status, created_at,
      dispatches(id, dispatch_no)
    `)
    .order("created_at", { ascending: false });

  if (!pickLists || pickLists.length === 0) {
    return [
      {
        id: "pick-1",
        order_id: "o1111111-0000-0000-0000-000000000001",
        project_no: "PRJ-2627-00001",
        customer_name: "Anita Sharma",
        customer_phone: "+919876543210",
        delivery_address: "Plot 14, Lotus Park, Baner, Pune",
        status: "pending",
        created_at: new Date(MOCK_BASE_TIME - 1000 * 60 * 60 * 2).toISOString(),
        dispatch_id: "disp-1",
        dispatch_no: "DSP-2627-00001",
      },
    ];
  }

  return (pickLists as any[]).map((pl) => ({
    id: pl.id,
    order_id: pl.order_id,
    project_no: pl.project_no,
    customer_name: pl.customer_name,
    customer_phone: pl.customer_phone,
    delivery_address: pl.delivery_address,
    status: pl.status,
    created_at: pl.created_at,
    dispatch_id: pl.dispatches?.[0]?.id || "disp-1",
    dispatch_no: pl.dispatches?.[0]?.dispatch_no || "DSP-2627-00001",
  }));
}

export async function getDispatchById(id: string): Promise<DispatchItem | null> {
  const db = supabaseAdmin();

  const { data: dispatch } = await db
    .from("dispatches")
    .select(`
      *,
      order:orders(
        id, order_no, delivery_name, delivery_address,
        project:projects(
          id, project_no, requested_kw,
          customer:customers(id, name, phone_e164)
        )
      )
    `)
    .eq("id", id)
    .maybeSingle();

  if (!dispatch) {
    // Return sample dispatch for demo
    return {
      id: "disp-1",
      dispatch_no: "DSP-2627-00001",
      order_id: "o1111111-0000-0000-0000-000000000001",
      status: "loading",
      vehicle: "MH-12-SP-2026",
      driver_name: "Ganesh Shinde",
      driver_phone: "+919800011122",
      departed_at: null,
      delivered_at: null,
      created_at: new Date(MOCK_BASE_TIME - 1000 * 60 * 60 * 2).toISOString(),
      order: {
        id: "o1111111-0000-0000-0000-000000000001",
        order_no: "ORD-2627-00001",
        delivery_name: "Anita Sharma",
        delivery_address: "Plot 14, Lotus Park, Baner, Pune",
        project: {
          id: "p1",
          project_no: "PRJ-2627-00001",
          requested_kw: 3.0,
          customer: {
            id: "c1",
            name: "Anita Sharma",
            phone_e164: "+919876543210",
          },
        },
      },
      required_items: [
        {
          line_id: "ol-1",
          product_id: "prod-panel-540w",
          sku: "SP-PANEL-540W",
          description: "540W Mono PERC Solar Panel",
          category: "panel",
          qty: 6,
          qty_scanned: 6,
          is_serialised: true,
        },
        {
          line_id: "ol-2",
          product_id: "prod-inv-3kw",
          sku: "SP-INV-3KW-OG",
          description: "3.3 kW Single Phase On-Grid Inverter",
          category: "inverter",
          qty: 1,
          qty_scanned: 1,
          is_serialised: true,
        },
      ],
      scanned_units: [
        {
          id: "su-1",
          serial_no: "SP-PAN-2026-0001",
          product_name: "540W Mono PERC Solar Panel",
          scanned_at: new Date(MOCK_BASE_TIME - 1000 * 60 * 45).toISOString(),
        },
        {
          id: "su-2",
          serial_no: "SP-PAN-2026-0002",
          product_name: "540W Mono PERC Solar Panel",
          scanned_at: new Date(MOCK_BASE_TIME - 1000 * 60 * 40).toISOString(),
        },
        {
          id: "su-3",
          serial_no: "SP-PAN-2026-0003",
          product_name: "540W Mono PERC Solar Panel",
          scanned_at: new Date(MOCK_BASE_TIME - 1000 * 60 * 35).toISOString(),
        },
        {
          id: "su-4",
          serial_no: "SP-PAN-2026-0004",
          product_name: "540W Mono PERC Solar Panel",
          scanned_at: new Date(MOCK_BASE_TIME - 1000 * 60 * 30).toISOString(),
        },
        {
          id: "su-5",
          serial_no: "SP-PAN-2026-0005",
          product_name: "540W Mono PERC Solar Panel",
          scanned_at: new Date(MOCK_BASE_TIME - 1000 * 60 * 25).toISOString(),
        },
        {
          id: "su-6",
          serial_no: "SP-PAN-2026-0006",
          product_name: "540W Mono PERC Solar Panel",
          scanned_at: new Date(MOCK_BASE_TIME - 1000 * 60 * 20).toISOString(),
        },
        {
          id: "su-7",
          serial_no: "SP-INV-2026-0001",
          product_name: "3.3 kW Single Phase Inverter",
          scanned_at: new Date(MOCK_BASE_TIME - 1000 * 60 * 15).toISOString(),
        },
      ],
      scan_logs: [
        {
          id: "sl-1",
          serial: "SP-PAN-2026-0001",
          result: "accepted",
          message: "Serial verified and linked to customer order.",
          created_at: new Date(MOCK_BASE_TIME - 1000 * 60 * 45).toISOString(),
        },
      ],
    };
  }

  // Load dispatch items
  const { data: items } = await db
    .from("dispatch_items")
    .select("id, serial_no, created_at, product:products(name)")
    .eq("dispatch_id", id);

  return {
    id: dispatch.id,
    dispatch_no: dispatch.dispatch_no,
    order_id: dispatch.order_id,
    status: dispatch.status,
    vehicle: dispatch.vehicle,
    driver_name: dispatch.driver_name,
    driver_phone: dispatch.driver_phone,
    departed_at: dispatch.departed_at,
    delivered_at: dispatch.delivered_at,
    created_at: dispatch.created_at,
    order: (dispatch as any).order,
    required_items: [],
    scanned_units: (items || []).map((i: any) => ({
      id: i.id,
      serial_no: i.serial_no,
      product_name: i.product?.name || "Solar Component",
      scanned_at: i.created_at,
    })),
    scan_logs: [],
  };
}
