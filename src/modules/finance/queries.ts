import { supabaseAdmin } from "@/lib/supabase/admin";

export interface InvoiceItem {
  id: string;
  invoice_no: string;
  order_id: string;
  customer_name: string;
  customer_phone: string;
  taxable_paise: bigint;
  cgst_paise: bigint;
  sgst_paise: bigint;
  total_paise: bigint;
  status: string;
  issued_at: string;
}

export interface SubsidyApplicationItem {
  id: string;
  project_no: string;
  customer_name: string;
  consumer_number: string;
  capacity_kw: number;
  subsidy_paise: bigint;
  status: string;
  portal_ref: string;
  updated_at: string;
}

const MOCK_BASE_TIME = 1763720000000; // Fixed deterministic baseline timestamp for build prerendering

export async function getInvoices(): Promise<InvoiceItem[]> {
  return [
    {
      id: "inv-1",
      invoice_no: "INV-2627-00001",
      order_id: "o1111111-0000-0000-0000-000000000001",
      customer_name: "Anita Sharma",
      customer_phone: "+919876543210",
      taxable_paise: 16228500n, // ₹1,62,285
      cgst_paise: 1135750n, // 6.9%
      sgst_paise: 1135750n, // 6.9%
      total_paise: 18500000n, // ₹1,85,000
      status: "issued",
      issued_at: new Date(MOCK_BASE_TIME - 1000 * 60 * 60 * 24).toISOString(),
    },
    {
      id: "inv-2",
      invoice_no: "INV-2627-00002",
      order_id: "o1111111-0000-0000-0000-000000000002",
      customer_name: "Suresh Patil",
      customer_phone: "+919822012345",
      taxable_paise: 28070000n,
      cgst_paise: 1965000n,
      sgst_paise: 1965000n,
      total_paise: 32000000n,
      status: "paid",
      issued_at: new Date(MOCK_BASE_TIME - 1000 * 60 * 60 * 72).toISOString(),
    },
  ];
}

export async function getSubsidyApplications(): Promise<SubsidyApplicationItem[]> {
  return [
    {
      id: "sub-1",
      project_no: "PRJ-2627-00001",
      customer_name: "Anita Sharma",
      consumer_number: "028740192831",
      capacity_kw: 3.0,
      subsidy_paise: 7800000n, // ₹78,000
      status: "inspection_cleared",
      portal_ref: "PMSURYA-MH-2026-91823",
      updated_at: new Date(MOCK_BASE_TIME - 1000 * 60 * 60 * 12).toISOString(),
    },
    {
      id: "sub-2",
      project_no: "PRJ-2627-00003",
      customer_name: "Dr. Vikram Sen",
      consumer_number: "028740552199",
      capacity_kw: 3.0,
      subsidy_paise: 7800000n,
      status: "discom_applied",
      portal_ref: "PMSURYA-MH-2026-88120",
      updated_at: new Date(MOCK_BASE_TIME - 1000 * 60 * 60 * 48).toISOString(),
    },
  ];
}
