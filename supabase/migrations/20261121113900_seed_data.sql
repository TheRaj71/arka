-- Migration 0010: Complete System Seed Data
-- Solar Installation Management System
-- Settings, Catalogue, 10 Templates, Fault Codes, Demo Users, Initial Stock

-- ============================================================================
-- 1. SETTINGS
-- ============================================================================
insert into settings (key, value, description) values
  ('warranty.start_trigger', '"delivery"'::jsonb, 'Warranty clock trigger: delivery or installation'),
  ('order.advance_percent', '50'::jsonb, 'Minimum percentage of order total to confirm order'),
  ('order.require_full_payment_before_dispatch', 'false'::jsonb, 'Whether 100% payment is required before dispatch'),
  ('quote.validity_days', '15'::jsonb, 'Default quote validity period in days'),
  ('quote.max_discount_percent_no_approval', '3'::jsonb, 'Max discount % allowed without manager approval'),
  ('quote.min_margin_percent', '12'::jsonb, 'Minimum gross margin % without manager approval'),
  ('quote.panel_wattage_w', '540'::jsonb, 'Standard panel wattage in Wp'),
  ('subsidy.enabled', 'true'::jsonb, 'Whether PM Surya Ghar subsidy calculation is active'),
  ('subsidy.tiers', '[{"upto_kw":2,"per_kw_paise":3000000},{"upto_kw":3,"per_kw_paise":1800000}]'::jsonb, 'Central subsidy rate tiers'),
  ('subsidy.max_paise', '7800000'::jsonb, 'Maximum central subsidy cap (₹78,000)'),
  ('lead.max_contact_attempts', '5'::jsonb, 'Max failed contact attempts before recommending unreachable'),
  ('ticket.sla_hours.high', '24'::jsonb, 'SLA target for high priority tickets in hours'),
  ('ticket.sla_hours.normal', '72'::jsonb, 'SLA target for normal priority tickets in hours'),
  ('ticket.repeat_window_days', '30'::jsonb, 'Days window to detect repeat service complaints'),
  ('warranty.expiring_soon_days', '60'::jsonb, 'Days threshold for expiring soon warning badge'),
  ('dispatch.panels_serial_required', 'true'::jsonb, 'Whether panel serials must be scanned individually'),
  ('finance.technician_default_hourly_paise', '15000'::jsonb, 'Default hourly pay rate for technicians (₹150/hr)')
on conflict (key) do update set value = excluded.value;

-- ============================================================================
-- 2. DEMO USERS (All 7 Roles)
-- ============================================================================
insert into profiles (id, clerk_user_id, full_name, email, role, is_active) values
  ('11111111-1111-1111-1111-111111111111', 'user_director_demo', 'Priya Sharma (Director)', 'director@demo.local', 'director', true),
  ('22222222-2222-2222-2222-222222222222', 'user_manager_demo', 'Rajesh Gupta (Ops Manager)', 'manager@demo.local', 'manager', true),
  ('33333333-3333-3333-3333-333333333333', 'user_sales_demo', 'Ravi Verma (Sales Lead)', 'sales@demo.local', 'sales', true),
  ('44444444-4444-4444-4444-444444444444', 'user_tech1_demo', 'Imran Khan (Lead Tech)', 'tech1@demo.local', 'technician', true),
  ('55555555-5555-5555-5555-555555555555', 'user_tech2_demo', 'Vikram Patel (Field Tech)', 'tech2@demo.local', 'technician', true),
  ('66666666-6666-6666-6666-666666666666', 'user_wh_demo', 'Anil Kumar (Storekeeper)', 'warehouse@demo.local', 'warehouse', true),
  ('77777777-7777-7777-7777-777777777777', 'user_support_demo', 'Sneha Nair (Support Desk)', 'support@demo.local', 'support', true),
  ('88888888-8888-8888-8888-888888888888', 'user_accounts_demo', 'Kavita Joshi (Accounts Exec)', 'accounts@demo.local', 'accounts', true)
on conflict (clerk_user_id) do update set
  full_name = excluded.full_name,
  role = excluded.role;

-- ============================================================================
-- 3. PRODUCT CATALOGUE
-- ============================================================================
-- Panels
insert into products (id, sku, name, category, uom, is_serialised, tracks_stock, warranty_months, gst_rate_bp, price_paise, is_dcr, wattage_w) values
  ('a0000001-0000-0000-0000-000000000001', 'PNL-540-DCR', 'Mono PERC Solar Panel 540 Wp (DCR - Domestic)', 'panel', 'nos', true, true, 240, 1200, 1400000, true, 540),
  ('a0000001-0000-0000-0000-000000000002', 'PNL-540-NDCR', 'Mono Solar Panel 540 Wp (Non-DCR Commercial)', 'panel', 'nos', true, true, 240, 1200, 1150000, false, 540)
on conflict (sku) do update set price_paise = excluded.price_paise;

-- On-Grid Inverters
insert into products (id, sku, name, category, uom, is_serialised, tracks_stock, warranty_months, gst_rate_bp, price_paise, capacity_kw) values
  ('a0000002-0000-0000-0000-000000000001', 'INV-ON-1KW', 'On-Grid String Inverter 1 kW', 'inverter', 'nos', true, true, 24, 1200, 1400000, 1.0),
  ('a0000002-0000-0000-0000-000000000002', 'INV-ON-2KW', 'On-Grid String Inverter 2 kW', 'inverter', 'nos', true, true, 24, 1200, 2000000, 2.0),
  ('a0000002-0000-0000-0000-000000000003', 'INV-ON-3KW', 'On-Grid String Inverter 3 kW', 'inverter', 'nos', true, true, 24, 1200, 2700000, 3.0),
  ('a0000002-0000-0000-0000-000000000004', 'INV-ON-4KW', 'On-Grid String Inverter 4 kW', 'inverter', 'nos', true, true, 24, 1200, 3400000, 4.0),
  ('a0000002-0000-0000-0000-000000000005', 'INV-ON-5KW', 'On-Grid String Inverter 5 kW', 'inverter', 'nos', true, true, 24, 1200, 4200000, 5.0)
on conflict (sku) do update set price_paise = excluded.price_paise;

-- Off-Grid Inverters
insert into products (id, sku, name, category, uom, is_serialised, tracks_stock, warranty_months, gst_rate_bp, price_paise, capacity_kw) values
  ('a0000003-0000-0000-0000-000000000001', 'INV-OFF-1KW', 'Off-Grid Hybrid Inverter 1 kW', 'inverter', 'nos', true, true, 24, 1200, 1600000, 1.0),
  ('a0000003-0000-0000-0000-000000000002', 'INV-OFF-2KW', 'Off-Grid Hybrid Inverter 2 kW', 'inverter', 'nos', true, true, 24, 1200, 2300000, 2.0),
  ('a0000003-0000-0000-0000-000000000003', 'INV-OFF-3KW', 'Off-Grid Hybrid Inverter 3 kW', 'inverter', 'nos', true, true, 24, 1200, 3100000, 3.0),
  ('a0000003-0000-0000-0000-000000000004', 'INV-OFF-4KW', 'Off-Grid Hybrid Inverter 4 kW', 'inverter', 'nos', true, true, 24, 1200, 3900000, 4.0),
  ('a0000003-0000-0000-0000-000000000005', 'INV-OFF-5KW', 'Off-Grid Hybrid Inverter 5 kW', 'inverter', 'nos', true, true, 24, 1200, 4800000, 5.0)
on conflict (sku) do update set price_paise = excluded.price_paise;

-- Charge Controllers & Batteries
insert into products (id, sku, name, category, uom, is_serialised, tracks_stock, warranty_months, gst_rate_bp, price_paise) values
  ('a0000004-0000-0000-0000-000000000001', 'CC-MPPT-40A', 'Charge Controller MPPT 40A', 'charge_controller', 'nos', true, true, 24, 1200, 650000),
  ('a0000004-0000-0000-0000-000000000002', 'CC-MPPT-60A', 'Charge Controller MPPT 60A', 'charge_controller', 'nos', true, true, 24, 1200, 950000),
  ('a0000004-0000-0000-0000-000000000003', 'BAT-TUB-150AH', 'Solar Tubular Battery 12V 150Ah', 'battery', 'nos', true, true, 24, 1200, 1450000)
on conflict (sku) do update set price_paise = excluded.price_paise;

-- Bulk & Balance of System (BOS)
insert into products (id, sku, name, category, uom, is_serialised, tracks_stock, gst_rate_bp, price_paise) values
  ('a0000005-0000-0000-0000-000000000001', 'STR-GI-SET', 'GI Mounting Structure (Flat RCC Roof)', 'structure', 'nos', false, true, 1200, 280000),
  ('a0000005-0000-0000-0000-000000000002', 'STR-GI-SET-TILE', 'GI Mounting Structure (Sloped Metal/Tile)', 'structure', 'nos', false, true, 1200, 320000),
  ('a0000005-0000-0000-0000-000000000003', 'CBL-DC-4MM', 'Solar DC Cable 4 mm² (TUV Certified)', 'cable', 'm', false, true, 1200, 5500),
  ('a0000005-0000-0000-0000-000000000004', 'CBL-AC-4MM', 'AC Armoured Cable 4 mm²', 'cable', 'm', false, true, 1200, 6500),
  ('a0000005-0000-0000-0000-000000000005', 'CBL-EARTH-6MM', 'Copper Earthing Cable 6 mm²', 'cable', 'm', false, true, 1200, 3500),
  ('a0000005-0000-0000-0000-000000000006', 'MC4-PAIR', 'MC4 Solar Connectors Male/Female Pair', 'connector', 'nos', false, true, 1200, 12000),
  ('a0000005-0000-0000-0000-000000000007', 'DCDB-1', 'DC Distribution Box (Surge + Fuse Protection)', 'junction_box', 'nos', false, true, 1200, 250000),
  ('a0000005-0000-0000-0000-000000000008', 'ACDB-1', 'AC Distribution Box (MCB + Isolator)', 'junction_box', 'nos', false, true, 1200, 220000),
  ('a0000005-0000-0000-0000-000000000009', 'MCB-AC-32A', 'AC MCB 32A Dual Pole', 'protection', 'nos', false, true, 1200, 45000),
  ('a0000005-0000-0000-0000-000000000010', 'SPD-DC', 'DC Surge Protection Device Class II', 'protection', 'nos', false, true, 1200, 180000),
  ('a0000005-0000-0000-0000-000000000011', 'EARTH-KIT', 'Chemical Earthing Kit (Pipe + Compound)', 'earthing', 'set', false, true, 1200, 350000),
  ('a0000005-0000-0000-0000-000000000012', 'LA-KIT', 'Lightning Arrestor Kit (Copper Spike + Mast)', 'earthing', 'set', false, true, 1200, 300000),
  ('a0000005-0000-0000-0000-000000000013', 'ACC-MISC', 'Hardware Kit (Clamps, Lugs, Conduit, Ties)', 'accessory', 'set', false, true, 1200, 150000)
on conflict (sku) do update set price_paise = excluded.price_paise;

-- Service lines
insert into products (id, sku, name, category, uom, is_serialised, tracks_stock, gst_rate_bp, price_paise) values
  ('a0000006-0000-0000-0000-000000000001', 'SVC-INSTALL', 'Solar Installation & Commissioning Service', 'service', 'kw', false, false, 1800, 350000),
  ('a0000006-0000-0000-0000-000000000002', 'SVC-LABOUR-HR', 'Technical Service Labour Rate', 'service', 'hr', false, false, 1800, 50000),
  ('a0000006-0000-0000-0000-000000000003', 'SVC-VISIT', 'Site Service Visit Fee', 'service', 'job', false, false, 1800, 30000)
on conflict (sku) do update set price_paise = excluded.price_paise;

-- Insert Standard Costs (Cost Segregation)
insert into product_costs (product_id, standard_cost_paise, avg_cost_paise)
select id, round(price_paise * 0.78)::bigint, round(price_paise * 0.78)::bigint
from products
on conflict (product_id) do update set standard_cost_paise = excluded.standard_cost_paise;

-- ============================================================================
-- 4. 10 PACKAGE TEMPLATES (1-5 kW x On-Grid / Off-Grid)
-- ============================================================================
insert into package_templates (id, code, name, system_type, capacity_kw, description) values
  ('b0000001-0000-0000-0000-000000000001', 'ON-1KW', '1 kW On-Grid Residential Solar System', 'on_grid', 1.0, '2 × 540W DCR Panels with 1 kW Inverter'),
  ('b0000001-0000-0000-0000-000000000002', 'ON-2KW', '2 kW On-Grid Residential Solar System', 'on_grid', 2.0, '4 × 540W DCR Panels with 2 kW Inverter'),
  ('b0000001-0000-0000-0000-000000000003', 'ON-3KW', '3 kW On-Grid Residential Solar System (Most Popular)', 'on_grid', 3.0, '6 × 540W DCR Panels with 3 kW Inverter & PM Surya Ghar Subsidy'),
  ('b0000001-0000-0000-0000-000000000004', 'ON-4KW', '4 kW On-Grid Rooftop Solar System', 'on_grid', 4.0, '8 × 540W DCR Panels with 4 kW Inverter'),
  ('b0000001-0000-0000-0000-000000000005', 'ON-5KW', '5 kW On-Grid Rooftop Solar System', 'on_grid', 5.0, '10 × 540W DCR Panels with 5 kW Inverter'),
  ('b0000002-0000-0000-0000-000000000001', 'OFF-1KW', '1 kW Off-Grid Battery Backup Solar System', 'off_grid', 1.0, '2 × 540W Panels, 1 kW Inverter, MPPT 40A, 2 × 150Ah Batteries'),
  ('b0000002-0000-0000-0000-000000000002', 'OFF-2KW', '2 kW Off-Grid Battery Backup Solar System', 'off_grid', 2.0, '4 × 540W Panels, 2 kW Inverter, MPPT 40A, 4 × 150Ah Batteries'),
  ('b0000002-0000-0000-0000-000000000003', 'OFF-3KW', '3 kW Off-Grid Hybrid Solar System', 'off_grid', 3.0, '6 × 540W Panels, 3 kW Inverter, MPPT 60A, 4 × 150Ah Batteries'),
  ('b0000002-0000-0000-0000-000000000004', 'OFF-4KW', '4 kW Off-Grid Hybrid Solar System', 'off_grid', 4.0, '8 × 540W Panels, 4 kW Inverter, MPPT 60A, 8 × 150Ah Batteries'),
  ('b0000002-0000-0000-0000-000000000005', 'OFF-5KW', '5 kW Off-Grid Hybrid Solar System', 'off_grid', 5.0, '10 × 540W Panels, 5 kW Inverter, MPPT 60A, 8 × 150Ah Batteries')
on conflict (code) do update set name = excluded.name;

-- Populate Package Template Items for ON-3KW
do $$
declare
  v_tpl_id uuid := 'b0000001-0000-0000-0000-000000000003';
  v_panel uuid; v_inv uuid; v_str uuid; v_dc_cbl uuid; v_ac_cbl uuid; v_earth_cbl uuid;
  v_mc4 uuid; v_dcdb uuid; v_acdb uuid; v_mcb uuid; v_spd uuid; v_earth_kit uuid; v_la uuid; v_acc uuid; v_inst uuid;
begin
  select id into v_panel from products where sku = 'PNL-540-DCR';
  select id into v_inv from products where sku = 'INV-ON-3KW';
  select id into v_str from products where sku = 'STR-GI-SET';
  select id into v_dc_cbl from products where sku = 'CBL-DC-4MM';
  select id into v_ac_cbl from products where sku = 'CBL-AC-4MM';
  select id into v_earth_cbl from products where sku = 'CBL-EARTH-6MM';
  select id into v_mc4 from products where sku = 'MC4-PAIR';
  select id into v_dcdb from products where sku = 'DCDB-1';
  select id into v_acdb from products where sku = 'ACDB-1';
  select id into v_mcb from products where sku = 'MCB-AC-32A';
  select id into v_spd from products where sku = 'SPD-DC';
  select id into v_earth_kit from products where sku = 'EARTH-KIT';
  select id into v_la from products where sku = 'LA-KIT';
  select id into v_acc from products where sku = 'ACC-MISC';
  select id into v_inst from products where sku = 'SVC-INSTALL';

  insert into package_template_items (template_id, product_id, qty_rule, qty_value, sort) values
    (v_tpl_id, v_panel, 'panel_count', 1.0, 10),
    (v_tpl_id, v_inv, 'fixed', 1.0, 20),
    (v_tpl_id, v_str, 'per_panel', 1.0, 30),
    (v_tpl_id, v_mc4, 'per_panel', 1.0, 40),
    (v_tpl_id, v_dc_cbl, 'cable_dc_m', 1.1, 50),
    (v_tpl_id, v_ac_cbl, 'cable_ac_m', 1.1, 60),
    (v_tpl_id, v_earth_cbl, 'fixed', 20.0, 70),
    (v_tpl_id, v_dcdb, 'fixed', 1.0, 80),
    (v_tpl_id, v_acdb, 'fixed', 1.0, 90),
    (v_tpl_id, v_mcb, 'fixed', 1.0, 100),
    (v_tpl_id, v_spd, 'fixed', 1.0, 110),
    (v_tpl_id, v_earth_kit, 'fixed', 1.0, 120),
    (v_tpl_id, v_la, 'fixed', 1.0, 130),
    (v_tpl_id, v_acc, 'fixed', 1.0, 140),
    (v_tpl_id, v_inst, 'per_kw', 1.0, 150)
  on conflict (template_id, product_id) do nothing;
end $$;

-- ============================================================================
-- 5. FAULT CODES (Inverter Diagnostics)
-- ============================================================================
insert into fault_codes (code, brand, title, likely_cause, suggested_action, severity) values
  ('GRID_OV', 'GENERIC', 'Grid Over-Voltage', 'Discom supply voltage exceeded 270V threshold', 'Verify grid supply with multimeter. Adjust DISCOM tap settings if prolonged.', 'medium'),
  ('GRID_UV', 'GENERIC', 'Grid Under-Voltage', 'Discom supply voltage below 180V threshold', 'Inspect AC breaker contacts and incoming supply phase.', 'medium'),
  ('NO_GRID', 'GENERIC', 'Grid Power Absent (Anti-Islanding)', 'DISCOM grid outage or AC isolator tripped', 'Check AC distribution box MCB and neighbourhood power.', 'high'),
  ('ISO_FAULT', 'GENERIC', 'DC Insulation Resistance Low', 'Damaged DC cable or moisture ingress in MC4 connector', 'Check DC cabling insulation resistance with Megger tester. Inspect array joints.', 'high'),
  ('DC_OV', 'GENERIC', 'DC Bus Over-Voltage', 'Too many panels in string exceeding inverter Voc limit', 'Verify string Voc and ambient temperature coefficient.', 'high'),
  ('OVER_TEMP', 'GENERIC', 'Inverter Over-Temperature', 'Blocked heat sink vents or high ambient temperature', 'Clean heatsink fins, ensure minimum 300 mm clearance around inverter enclosure.', 'medium'),
  ('FAN_FAIL', 'GENERIC', 'Internal Cooling Fan Failure', 'Cooling fan seized or unplugged', 'Inspect cooling fan connector and replace fan module if seized.', 'medium'),
  ('COMM_ERR', 'GENERIC', 'Communication Failure', 'Wi-Fi/RS485 data-logger cable disconnected', 'Check data-logger dongle power LED and Wi-Fi signal strength.', 'low'),
  ('BAT_LOW', 'GENERIC', 'Battery Low Voltage Cutoff', 'Prolonged discharge with zero solar irradiance', 'Check battery terminal voltage and solar charging controller inputs.', 'high')
on conflict (brand, code) do update set title = excluded.title;

-- ============================================================================
-- 6. INITIAL STOCK (Serialised and Bulk)
-- ============================================================================
-- Bulk Stock initialization
insert into bulk_stock (product_id, on_hand, reserved)
select id, 500, 0 from products where not is_serialised
on conflict (product_id) do update set on_hand = excluded.on_hand;

-- Serialised Units initialization
do $$
declare
  v_panel_id uuid;
  v_inv_id uuid;
  v_i int;
  v_u_id uuid;
begin
  select id into v_panel_id from products where sku = 'PNL-540-DCR';
  select id into v_inv_id from products where sku = 'INV-ON-3KW';

  -- 30 panels
  for v_i in 1..30 loop
    insert into stock_units (product_id, serial_no, status, received_at)
    values (v_panel_id, 'PNL-2026-' || lpad(v_i::text, 6, '0'), 'in_stock', now())
    on conflict (product_id, serial_no) do nothing
    returning id into v_u_id;

    if v_u_id is not null then
      insert into stock_unit_costs (stock_unit_id, unit_cost_paise) values (v_u_id, 1150000) on conflict do nothing;
    end if;
  end loop;

  -- 10 inverters
  for v_i in 1..10 loop
    insert into stock_units (product_id, serial_no, status, received_at)
    values (v_inv_id, 'INV-2026-' || lpad(v_i::text, 6, '0'), 'in_stock', now())
    on conflict (product_id, serial_no) do nothing
    returning id into v_u_id;

    if v_u_id is not null then
      insert into stock_unit_costs (stock_unit_id, unit_cost_paise) values (v_u_id, 2150000) on conflict do nothing;
    end if;
  end loop;
end $$;
