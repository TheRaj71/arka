"use server";

import { defineAction } from "@/lib/actions/define-action";
import { rolesFor } from "@/lib/auth/permissions";
import {
  receiveStockSchema,
  createDispatchSchema,
  scanDispatchUnitSchema,
  finalizeDispatchSchema,
  confirmDeliverySchema,
} from "./schemas";

/**
 * Goods Receipt: Inward new serials or bulk inventory
 */
export const receiveStock = defineAction({
  name: "receiveStock",
  roles: rolesFor("inventory.receive"),
  schema: receiveStockSchema,
  revalidate: ["/inventory", "/warehouse"],
  handler: async ({ profile, db }, input) => {
    const lines = [
      {
        product_id: input.product_id,
        unit_cost_paise: input.unit_cost_paise,
        serials: input.serials,
        qty: input.qty || input.serials.length,
      },
    ];

    const { data, error } = await (db as any).rpc("fn_receive_stock", {
      p_actor: profile.id,
      p_supplier_id: null,
      p_invoice_no: input.invoice_no || "REC-" + Date.now(),
      p_invoice_date: new Date().toISOString().split("T")[0],
      p_lines: lines,
    });

    if (error) throw error;
    return data as { ok: boolean };
  },
});

/**
 * Initialize dispatch run from warehouse pick-list
 */
export const createDispatch = defineAction({
  name: "createDispatch",
  roles: rolesFor("dispatch.scan"),
  schema: createDispatchSchema,
  revalidate: ["/warehouse"],
  handler: async ({ profile, db }, input) => {
    const { data, error } = await (db as any).rpc("fn_create_dispatch", {
      p_actor: profile.id,
      p_pick_list_id: input.pick_list_id,
      p_vehicle: input.vehicle || "MH-12-SP-2026",
      p_driver: input.driver || "SunPower Fleet",
      p_driver_phone: input.driver_phone || "+919800011122",
    });

    if (error) throw error;
    return data as { ok: boolean; dispatch_id: string; dispatch_no: string };
  },
});

/**
 * Scan Serial Unit into Dispatch (Validates serial number, rejects duplicates/wrong products)
 */
export const scanDispatchUnit = defineAction({
  name: "scanDispatchUnit",
  roles: rolesFor("dispatch.scan"),
  schema: scanDispatchUnitSchema,
  revalidate: ["/warehouse"],
  handler: async ({ profile, db }, input) => {
    const { data, error } = await (db as any).rpc("fn_scan_dispatch_unit", {
      p_actor: profile.id,
      p_dispatch_id: input.dispatch_id,
      p_raw: input.raw_serial,
      p_method: input.method,
      p_line_id: input.line_id || null,
    });

    if (error) throw error;
    return data as {
      ok: boolean;
      result: string;
      serial: string;
      message: string;
    };
  },
});

/**
 * Finalize dispatch run (truck departs)
 */
export const finalizeDispatch = defineAction({
  name: "finalizeDispatch",
  roles: rolesFor("dispatch.scan"),
  schema: finalizeDispatchSchema,
  revalidate: ["/warehouse", "/orders", "/field"],
  handler: async ({ profile, db }, input) => {
    const { data, error } = await (db as any).rpc("fn_finalize_dispatch", {
      p_actor: profile.id,
      p_dispatch_id: input.dispatch_id,
    });

    if (error) throw error;
    return data as { ok: boolean; status: string };
  },
});

/**
 * Confirm Delivery (Automation A10: Automatically creates assets and starts warranty clocks!)
 */
export const confirmDelivery = defineAction({
  name: "confirmDelivery",
  roles: rolesFor("delivery.confirm"),
  schema: confirmDeliverySchema,
  revalidate: ["/warehouse", "/orders", "/service", "/field"],
  handler: async ({ profile, db }, input) => {
    const { data, error } = await (db as any).rpc("fn_confirm_delivery", {
      p_actor: profile.id,
      p_dispatch_id: input.dispatch_id,
      p_name: input.customer_name || "Customer",
      p_otp: input.otp || null,
    });

    if (error) throw error;
    return data as { ok: boolean; status: string };
  },
});
