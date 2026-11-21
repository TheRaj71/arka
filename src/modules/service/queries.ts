import { supabaseAdmin } from "@/lib/supabase/admin";

export interface TicketItem {
  id: string;
  ticket_no: string;
  issue_type: string | null;
  fault_code: string;
  description: string;
  priority: string;
  status: string;
  warranty_decision: "in_warranty" | "out_of_warranty" | "void" | "unknown";
  billing: string;
  is_repeat: boolean;
  sla_due_at: string;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  serial_no?: string;
  product_name?: string;
}

export interface FaultCodeItem {
  code: string;
  title: string;
  component: string;
  description: string;
  spare_part: string;
  labour_charge_paise: bigint;
}

export async function getFaultCodes(): Promise<FaultCodeItem[]> {
  return [
    {
      code: "ERR_INV_GRID_FAIL",
      title: "Grid Undervoltage / AC Sync Loss",
      component: "Inverter",
      description: "Grid disconnect detected during peak generation.",
      spare_part: "AC Surge Protection Device (SPD Type 2)",
      labour_charge_paise: 150000n, // ₹1,500
    },
    {
      code: "ERR_INV_OVERTEMP",
      title: "Inverter Thermal Shutdown",
      component: "Inverter",
      description: "Heat sink exceeding 85°C. Cooling fan failure.",
      spare_part: "DC Cooling Fan Assembly (12V)",
      labour_charge_paise: 120000n, // ₹1,200
    },
    {
      code: "ERR_PANEL_MICROCRACK",
      title: "Panel Degradation / Hotspot Cell",
      component: "Solar Panel",
      description: "Thermal imaging indicates cell hotspot > 110°C.",
      spare_part: "540W Mono PERC Panel Replacement",
      labour_charge_paise: 250000n, // ₹2,500
    },
    {
      code: "ERR_BAT_LOW_CAPACITY",
      title: "LiFePO4 Cell Voltage Imbalance",
      component: "Battery",
      description: "BMS cutoff during discharge cycle below 48V.",
      spare_part: "BMS Master Control Board",
      labour_charge_paise: 300000n, // ₹3,000
    },
    {
      code: "ERR_EARTH_FAULT",
      title: "Ground Insulation Leakage Resistance Low",
      component: "Earthing",
      description: "DC earth leakage resistance < 50k ohms.",
      spare_part: "Earthing Chemical Compound & Clamp",
      labour_charge_paise: 100000n, // ₹1,000
    },
  ];
}

const MOCK_BASE_TIME = 1763720000000;

export async function getTickets(): Promise<TicketItem[]> {
  const db = supabaseAdmin();

  const { data: tickets } = await db
    .from("tickets")
    .select(`
      id, ticket_no, issue_type, fault_code, description, priority, status,
      warranty_decision, billing, is_repeat, sla_due_at, created_at,
      customer:customers(name, phone_e164),
      asset:assets(serial_no, product:products(name))
    `)
    .order("created_at", { ascending: false });

  if (!tickets || tickets.length === 0) {
    return [
      {
        id: "tkt-1",
        ticket_no: "TKT-2627-00001",
        issue_type: "inverter_error",
        fault_code: "ERR_INV_GRID_FAIL",
        description: "Inverter showing red blinking LED. Grid voltage sync error after thunderstorm.",
        priority: "high",
        status: "open",
        warranty_decision: "in_warranty",
        billing: "not_applicable", // Free under warranty!
        is_repeat: false,
        sla_due_at: new Date(MOCK_BASE_TIME + 1000 * 60 * 60 * 36).toISOString(),
        created_at: new Date(MOCK_BASE_TIME - 1000 * 60 * 60 * 4).toISOString(),
        customer_name: "Anita Sharma",
        customer_phone: "+919876543210",
        serial_no: "SP-INV-2026-0001",
        product_name: "SunPower 3.3 kW Single Phase Inverter",
      },
      {
        id: "tkt-2",
        ticket_no: "TKT-2627-00002",
        issue_type: "battery_alarm",
        fault_code: "ERR_BAT_LOW_CAPACITY",
        description: "Battery cuts off after 45 minutes of load shedding.",
        priority: "normal",
        status: "in_progress",
        warranty_decision: "in_warranty",
        billing: "not_applicable",
        is_repeat: true,
        sla_due_at: new Date(MOCK_BASE_TIME + 1000 * 60 * 60 * 20).toISOString(),
        created_at: new Date(MOCK_BASE_TIME - 1000 * 60 * 60 * 28).toISOString(),
        customer_name: "Suresh Patil",
        customer_phone: "+919822012345",
        serial_no: "SP-BAT-2026-0001",
        product_name: "SunPower 5 kWh LiFePO4 Battery Bank",
      },
    ];
  }

  return (tickets as any[]).map((t) => ({
    id: t.id,
    ticket_no: t.ticket_no,
    issue_type: t.issue_type,
    fault_code: t.fault_code,
    description: t.description,
    priority: t.priority,
    status: t.status,
    warranty_decision: t.warranty_decision,
    billing: t.billing,
    is_repeat: Boolean(t.is_repeat),
    sla_due_at: t.sla_due_at,
    created_at: t.created_at,
    customer_name: t.customer?.name || "Customer",
    customer_phone: t.customer?.phone_e164 || "",
    serial_no: t.asset?.serial_no,
    product_name: t.asset?.product?.name,
  }));
}
