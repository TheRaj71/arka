# Part 3 — Data Model (Postgres / Supabase)

> **This file is authoritative for table, column and enum names.** All SQL is meant to be pasted into numbered migration files. Money = `bigint` paise (`*_paise`). GST = integer basis points (`*_bp`, 1800 = 18%). Timestamps = `timestamptz`. IDs = `uuid default gen_random_uuid()`.

## 0. Migration order (authoritative)

| File | Content |
|---|---|
| `0001_extensions_enums.sql` | extensions, `app` schema, all enums (§2) |
| `0002_core.sql` | profiles, settings, doc_sequences, customers, catalogue (§3) |
| `0003_sales.sql` | leads, projects, jobs, surveys, quotes, orders, payments (§4) |
| `0004_inventory.sql` | suppliers, purchases, stock, pick lists, dispatch, scan events (§5) |
| `0005_field.sql` | install reports, photos, materials, time entries, variations (§6) |
| `0006_assets_service.sql` | assets, tickets, fault codes (§7) |
| `0007_finance.sql` | invoices, subsidy, costs, pay (§8) |
| `0008_platform.sql` | notifications, audit, status history, share links, idempotency, rate limits (§9) |
| `0009_helpers_triggers.sql` | `touch` trigger, doc numbers, log/notify helpers, append-only triggers (§1) |
| `0010_auth_helpers_rls.sql` | file 02 §5–§6 (helpers need tables to exist first) |
| `0011_views.sql` | §10 |
| `0012_functions_*.sql` | all `fn_*` RPCs (file 04 §10), one file per domain |
| `0013_storage.sql` | buckets |
| `0014_cron.sql` | pg_cron jobs (file 01 §11) |
| `seed.sql` | §12 |

(Filenames in file 02 are illustrative; this order wins.)

---

## 1. Helper SQL (put in `0009_helpers_triggers.sql`, but referenced earlier)

```sql
-- updated_at + row_version
create or replace function app.touch_row() returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  if tg_op = 'UPDATE' then new.row_version := coalesce(old.row_version,0) + 1; end if;
  return new;
end $$;

-- attach to a table that has updated_at + row_version
create or replace procedure app.attach_touch(p_table regclass) language plpgsql as $$
begin
  execute format('create trigger trg_touch before update on %s for each row execute function app.touch_row()', p_table);
end $$;

-- Gapless-per-transaction document numbers, Indian financial year (Apr–Mar), e.g. QT-2627-00012
create or replace function public.fn_next_doc_no(p_prefix text) returns text
language plpgsql security definer set search_path = public as $$
declare v_now timestamp := (now() at time zone 'Asia/Kolkata'); v_y int; v_fy text; v_n int;
begin
  v_y := case when extract(month from v_now) >= 4 then extract(year from v_now)::int else extract(year from v_now)::int - 1 end;
  v_fy := lpad((v_y % 100)::text, 2, '0') || lpad(((v_y + 1) % 100)::text, 2, '0');
  insert into doc_sequences(prefix, fy, last_no) values (p_prefix, v_fy, 1)
  on conflict (prefix, fy) do update set last_no = doc_sequences.last_no + 1
  returning last_no into v_n;
  return p_prefix || '-' || v_fy || '-' || lpad(v_n::text, 5, '0');
end $$;

-- Audit + status history in one call (every fn_* uses this)
create or replace function public.fn_log(
  p_actor uuid, p_entity text, p_id uuid, p_action text,
  p_from text default null, p_to text default null, p_reason text default null,
  p_before jsonb default null, p_after jsonb default null) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_from is distinct from p_to then
    insert into status_history(entity_type, entity_id, from_status, to_status, actor_id, reason)
    values (p_entity, p_id, p_from, p_to, p_actor, p_reason);
  end if;
  insert into audit_log(actor_id, action, entity_type, entity_id, before, after, reason)
  values (p_actor, p_action, p_entity, p_id, p_before, p_after, p_reason);
end $$;

-- Notifications: one row per recipient (RLS = recipient only)
create or replace function public.fn_notify(
  p_recipient uuid, p_type text, p_title text, p_body text default null,
  p_entity text default null, p_entity_id uuid default null, p_url text default null,
  p_severity text default 'info') returns void
language sql security definer set search_path = public as $$
  insert into notifications(recipient_id, type, title, body, entity_type, entity_id, url, severity)
  select p_recipient, p_type, p_title, p_body, p_entity, p_entity_id, p_url, p_severity
  where p_recipient is not null
$$;

create or replace function public.fn_notify_roles(
  p_roles text[], p_type text, p_title text, p_body text default null,
  p_entity text default null, p_entity_id uuid default null, p_url text default null,
  p_severity text default 'info') returns void
language sql security definer set search_path = public as $$
  insert into notifications(recipient_id, type, title, body, entity_type, entity_id, url, severity)
  select p.id, p_type, p_title, p_body, p_entity, p_entity_id, p_url, p_severity
  from profiles p
  where p.is_active and p.deleted_at is null and (p.role::text = any(p_roles) or p.role = 'director')
$$;

-- Append-only guard for audit_log, status_history, scan_events, stock_movements, payments(no delete)
create or replace function app.forbid_mutation() returns trigger language plpgsql as $$
begin raise exception 'IMMUTABLE: % rows cannot be updated or deleted', tg_table_name; end $$;
```

Attach `app.forbid_mutation` as `BEFORE UPDATE OR DELETE` trigger on `audit_log`, `status_history`, `scan_events`, `stock_movements`, `lead_qualifications`.

---

## 2. Enums (`0001`)

```sql
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;
create extension if not exists btree_gist;
create extension if not exists citext;
create schema if not exists app;

create type app_role         as enum ('director','manager','sales','technician','warehouse','support','accounts');
create type customer_type    as enum ('residential','commercial','industrial');
create type system_type      as enum ('on_grid','off_grid');
create type lead_source      as enum ('web','call','whatsapp','walk_in','referral','other');
create type lead_status      as enum ('new','contacting','follow_up','converted','unreachable','disqualified','lost');
create type project_stage    as enum ('qualified','survey_scheduled','survey_submitted','survey_approved','quoted',
                                      'awaiting_payment','order_confirmed','dispatched','delivered','installed',
                                      'commissioned','completed','on_hold','cancelled');
create type job_type         as enum ('survey','install','service');
create type job_status       as enum ('unscheduled','scheduled','in_progress','awaiting_signature','completed','on_hold','cancelled');
create type survey_status    as enum ('draft','submitted','approved','rejected','rework_requested');
create type feasibility      as enum ('feasible','feasible_with_changes','not_feasible');
create type roof_direction   as enum ('north','north_east','east','south_east','south','south_west','west','north_west','flat');
create type roof_type        as enum ('rcc_flat','sloped_metal','sloped_tile','asbestos','other');
create type quote_status     as enum ('draft','pending_approval','approved','sent','accepted','rejected','expired','superseded','cancelled');
create type order_status     as enum ('pending_payment','confirmed','in_fulfilment','delivered','completed','cancelled');
create type order_pay_status as enum ('unpaid','partial','advance_met','paid','overpaid');
create type payment_method   as enum ('upi','cash','bank_transfer','cheque','card','other');
create type payment_status   as enum ('pending','received','failed','reversed','bounced');
create type payment_kind     as enum ('advance','balance','full','service','refund');
create type product_category as enum ('panel','inverter','battery','charge_controller','structure','cable','protection',
                                      'earthing','connector','junction_box','accessory','service');
create type qty_rule         as enum ('fixed','per_kw','panel_count','per_panel','cable_dc_m','cable_ac_m');
create type qty_rounding     as enum ('ceil','round','none');
create type stock_unit_status as enum ('in_stock','reserved','dispatched','delivered','installed','returned',
                                       'under_repair','damaged','rma','replaced','scrapped');
create type movement_type    as enum ('received','reserved','unreserved','issued','returned','adjusted_up','adjusted_down');
create type adjustment_status as enum ('pending','approved','rejected');
create type pick_status      as enum ('pending','picking','packed','dispatched','cancelled');
create type dispatch_status  as enum ('draft','loading','in_transit','delivered','partially_delivered','returned','cancelled');
create type scan_result      as enum ('accepted','rejected_unknown','rejected_wrong_product','rejected_wrong_order',
                                      'rejected_reserved_other','rejected_duplicate','rejected_bad_status','rejected_other');
create type signature_status as enum ('pending','signed','refused','remote_pending');
create type photo_kind       as enum ('survey_roof','survey_meter','survey_db','survey_obstruction','before','panels',
                                      'inverter','earthing','db_box','meter','serial_label','power_test','finished','other');
create type variation_status as enum ('pending','approved','rejected');
create type ticket_status    as enum ('open','triaged','visit_scheduled','in_progress','waiting_part','rma',
                                      'awaiting_confirmation','closed','cancelled');
create type ticket_priority  as enum ('low','normal','high','urgent');
create type ticket_channel   as enum ('phone','whatsapp','web','qr','walk_in','other');
create type warranty_decision as enum ('unknown','in_warranty','out_of_warranty','goodwill','void');
create type ticket_billing   as enum ('not_applicable','pending','invoiced','paid','waived');
create type invoice_kind     as enum ('order','service','variation','credit_note');
create type invoice_status   as enum ('draft','issued','partially_paid','paid','void');
create type subsidy_status   as enum ('not_applicable','registration_pending','awaiting_installation','docs_pending',
                                      'inspection_pending','commissioned','claim_pending','credited','rejected');
create type pay_model        as enum ('hourly','per_job','salaried');
create type pay_period_status as enum ('open','locked','approved','paid');
create type share_kind       as enum ('quote','tracker','asset','report','delivery','signature');
```

---

## 3. Core tables (`0002`)

```sql
create table profiles (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null unique,
  email citext,
  full_name text not null default '',
  phone text,
  role app_role,                                  -- NULL = pending
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  row_version int not null default 1
);

create table settings (
  key text primary key,
  value jsonb not null,
  description text,
  updated_by uuid references profiles(id),
  updated_at timestamptz not null default now()
);

create table doc_sequences (
  prefix text not null, fy text not null, last_no int not null default 0,
  primary key (prefix, fy)
);

create table customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone_e164 text not null check (phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  alt_phone_e164 text,
  email citext,
  customer_type customer_type not null default 'residential',
  business_name text,
  gstin text check (gstin is null or gstin ~ '^[0-9A-Z]{15}$'),
  billing_address text, billing_city text, billing_state text, billing_pincode text,
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  row_version int not null default 1
);
create unique index customers_phone_uq on customers(phone_e164) where deleted_at is null;
create index customers_name_trgm on customers using gin (name gin_trgm_ops);
create index customers_phone_trgm on customers using gin (phone_e164 gin_trgm_ops);

-- Catalogue ---------------------------------------------------------
create table products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  name text not null,
  category product_category not null,
  brand text, model text,
  uom text not null default 'nos',                 -- nos, m, set, kw, hr, job
  is_serialised boolean not null default false,
  tracks_stock boolean not null default true,      -- false for services
  warranty_months int check (warranty_months is null or warranty_months > 0),
  hsn_code text,
  gst_rate_bp int not null default 1200 check (gst_rate_bp between 0 and 4000),
  price_paise bigint not null default 0 check (price_paise >= 0),  -- default selling price (ex-GST)
  is_dcr boolean not null default false,          -- panels: domestic content (subsidy-eligible)
  wattage_w int,                                   -- panels
  capacity_kw numeric(5,2),                        -- inverters
  spec jsonb not null default '{}',
  reorder_level numeric(12,2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  row_version int not null default 1,
  check (not is_serialised or (tracks_stock and warranty_months is not null)),
  check (category <> 'panel' or wattage_w is not null)
);
create index products_cat on products(category) where is_active;

create table product_costs (                       -- COST SEGREGATION
  product_id uuid primary key references products(id),
  standard_cost_paise bigint not null default 0 check (standard_cost_paise >= 0),
  avg_cost_paise bigint not null default 0 check (avg_cost_paise >= 0),   -- weighted average (bulk) updated on receipt
  updated_at timestamptz not null default now()
);

create table package_templates (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,                       -- ON-3KW, OFF-5KW
  name text not null,
  system_type system_type not null,
  capacity_kw numeric(4,1) not null check (capacity_kw between 1 and 5),
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  row_version int not null default 1,
  unique (system_type, capacity_kw)
);

create table package_template_items (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references package_templates(id) on delete cascade,
  product_id uuid not null references products(id),
  qty_rule qty_rule not null default 'fixed',
  qty_value numeric(10,3) not null default 1,      -- meaning depends on rule (file 05 §5.3)
  min_qty numeric(10,2) not null default 0,
  rounding qty_rounding not null default 'ceil',
  when_roof_types roof_type[],                     -- NULL = always; else only for these roof types
  is_required boolean not null default true,
  sort int not null default 100,
  notes text,
  unique (template_id, product_id)
);

create table fault_codes (
  id uuid primary key default gen_random_uuid(),
  brand text not null default 'GENERIC',
  code text not null,
  title text not null,
  likely_cause text,
  suggested_action text,
  suggested_product_ids uuid[] not null default '{}',
  severity text not null default 'medium' check (severity in ('low','medium','high')),
  is_active boolean not null default true,
  unique (brand, code)
);
```
Attach `app.attach_touch` to: profiles, customers, products, package_templates.

---

## 4. Sales tables (`0003`)

```sql
create table leads (
  id uuid primary key default gen_random_uuid(),
  lead_no text not null unique,                    -- LD-2627-00001
  customer_id uuid not null references customers(id),
  source lead_source not null default 'web',
  status lead_status not null default 'new',
  owner_id uuid references profiles(id),
  requested_kw numeric(4,1) check (requested_kw is null or requested_kw between 0.5 and 100),
  requirement system_type,                         -- NULL = unsure
  wants_subsidy boolean not null default false,
  site_address text, site_city text, site_state text, site_pincode text,
  notes text,
  next_followup_at timestamptz,
  attempt_count int not null default 0,
  last_contacted_at timestamptz,
  close_reason text,
  closed_at timestamptz,
  project_id uuid,                                 -- FK added later
  utm jsonb,
  submit_ip_hash text, submit_user_agent text,
  created_by uuid references profiles(id),         -- NULL for public web form
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  row_version int not null default 1,
  check (status not in ('unreachable','disqualified','lost') or (close_reason is not null and closed_at is not null))
);
-- REQ-LEAD-04: only one OPEN lead per customer
create unique index leads_one_open_per_customer on leads(customer_id)
  where status in ('new','contacting','follow_up');
create index leads_owner_status on leads(owner_id, status);
create index leads_followup on leads(next_followup_at) where status in ('new','contacting','follow_up');

create table lead_activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id),
  kind text not null check (kind in ('created','call','note','status_change','duplicate_enquiry','followup_set','assignment','whatsapp','qualification')),
  outcome text check (outcome in ('connected','no_answer','busy','wrong_number','callback_requested')),
  note text,
  meta jsonb,
  actor_id uuid references profiles(id),
  created_at timestamptz not null default now()
);
create index lead_activities_lead on lead_activities(lead_id, created_at desc);

create table lead_qualifications (                 -- append-only call checklist results
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id),
  shadow_free_area_sqft int check (shadow_free_area_sqft >= 0),
  monthly_bill_paise bigint check (monthly_bill_paise >= 0),
  monthly_units int check (monthly_units >= 0),
  grid_connection_suitable boolean,
  grid_notes text,
  roof_ownership text check (roof_ownership in ('owned','rented','society','unknown')),
  consumer_number text,
  consumer_name_on_bill text,
  sanctioned_load_kw numeric(5,2),
  discom text,
  suggested_kw numeric(4,1),
  outcome text not null check (outcome in ('qualified','not_qualified')),
  reason text,
  recorded_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  project_no text not null unique,                 -- PRJ-2627-00001
  customer_id uuid not null references customers(id),
  lead_id uuid references leads(id),
  stage project_stage not null default 'qualified',
  customer_type customer_type not null,
  system_type system_type not null,
  requested_kw numeric(4,1) not null,
  final_kw numeric(4,1),                           -- set when quote accepted / installed size confirmed
  site_address text not null, site_city text, site_state text, site_pincode text,
  site_lat numeric(9,6), site_lng numeric(9,6),
  discom text, consumer_number text, consumer_name_on_bill text, sanctioned_load_kw numeric(5,2),
  sales_owner_id uuid references profiles(id),
  subsidy_eligible boolean not null default false,
  subsidy_override_reason text,
  current_quote_id uuid, order_id uuid,            -- FKs added later
  hold_reason text, cancel_reason text,
  installed_on date, commissioned_on date, completed_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  row_version int not null default 1,
  check (stage <> 'cancelled' or cancel_reason is not null),
  check (stage <> 'on_hold' or hold_reason is not null)
);
create index projects_stage on projects(stage);
create index projects_customer on projects(customer_id);
alter table leads add constraint leads_project_fk foreign key (project_id) references projects(id);

create table jobs (
  id uuid primary key default gen_random_uuid(),
  job_no text not null unique,                     -- JOB-2627-00001
  project_id uuid not null references projects(id),
  type job_type not null,
  status job_status not null default 'unscheduled',
  ticket_id uuid,                                  -- FK added in 0006 (service jobs)
  title text not null,
  scheduled_start timestamptz, scheduled_end timestamptz,
  estimated_hours numeric(5,2),
  actual_start timestamptz, actual_end timestamptz,
  site_address text,
  notes text,
  hold_reason text, cancel_reason text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  row_version int not null default 1,
  check (scheduled_end is null or scheduled_start is null or scheduled_end > scheduled_start),
  check (status <> 'scheduled' or scheduled_start is not null),
  check (status <> 'cancelled' or cancel_reason is not null)
);
create unique index jobs_one_active_survey on jobs(project_id)
  where type = 'survey' and status in ('unscheduled','scheduled','in_progress');
create unique index jobs_one_active_install on jobs(project_id)
  where type = 'install' and status <> 'cancelled';
create index jobs_schedule on jobs(scheduled_start) where status in ('scheduled','in_progress');
create index jobs_status_type on jobs(status, type);

create table job_crew (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  profile_id uuid not null references profiles(id),
  crew_role text not null default 'lead' check (crew_role in ('lead','helper')),
  created_at timestamptz not null default now(),
  unique (job_id, profile_id)
);
create index job_crew_profile on job_crew(profile_id);
-- Prevent double-booking a technician for overlapping scheduled windows: enforced in fn_assign_job (needs jobs join; trigger not exclusion).

create table surveys (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null unique references jobs(id),
  project_id uuid not null references projects(id),
  revision int not null default 1,
  status survey_status not null default 'draft',
  roof_direction roof_direction,
  roof_tilt_deg numeric(4,1) check (roof_tilt_deg between 0 and 90),
  roof_type roof_type,
  shadow_free_area_sqft int check (shadow_free_area_sqft >= 0),
  structure_height_m numeric(4,1),
  cable_dc_m numeric(6,1) check (cable_dc_m >= 0),      -- panels → inverter
  cable_ac_m numeric(6,1) check (cable_ac_m >= 0),      -- inverter → DB/meter
  earthing_distance_m numeric(5,1),
  grid_connection_ok boolean,
  meter_location text,
  feasibility feasibility,
  recommended_kw numeric(4,1),
  shading_notes text, notes text,
  submitted_at timestamptz, submitted_by uuid references profiles(id),
  reviewed_at timestamptz, reviewed_by uuid references profiles(id), review_note text,
  client_submission_id uuid unique,                      -- idempotency (offline)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  row_version int not null default 1,
  check (status not in ('rejected','rework_requested') or review_note is not null)
);
create index surveys_project on surveys(project_id, revision desc);

-- Quotes ---------------------------------------------------------------
create table quotes (
  id uuid primary key default gen_random_uuid(),
  quote_no text not null,                          -- QT-2627-00001 (same across versions)
  version int not null default 1,
  parent_quote_id uuid references quotes(id),
  project_id uuid not null references projects(id),
  survey_id uuid not null references surveys(id),  -- the APPROVED survey used (gate evidence)
  template_id uuid references package_templates(id),
  status quote_status not null default 'draft',
  system_type system_type not null,
  nominal_kw numeric(4,1) not null,
  panel_count int, dc_capacity_wp int,
  subtotal_paise bigint not null default 0,        -- Σ line taxable BEFORE discount (ex-GST)
  discount_paise bigint not null default 0 check (discount_paise >= 0),
  taxable_paise bigint not null default 0,         -- subtotal − discount
  gst_paise bigint not null default 0,
  total_paise bigint not null default 0,           -- taxable + gst
  subsidy_eligible boolean not null default false,
  subsidy_paise bigint not null default 0,         -- informational estimate
  net_cost_paise bigint not null default 0,        -- total − subsidy (effective cost to customer after DBT)
  valid_until date,
  approval_required boolean not null default false,
  approval_reason text,
  approved_by uuid references profiles(id), approved_at timestamptz,
  sent_at timestamptz, sent_by uuid references profiles(id),
  accepted_at timestamptz, accepted_name text, accepted_ip_hash text,
  rejected_reason text, rejected_at timestamptz,
  expired_at timestamptz,
  customer_notes text, terms text,
  pdf_path text,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  row_version int not null default 1,
  unique (quote_no, version),
  check (discount_paise <= subtotal_paise)
);
create unique index quotes_one_live_per_project on quotes(project_id)
  where status in ('draft','pending_approval','approved','sent');
create index quotes_project on quotes(project_id);
create index quotes_status on quotes(status);

create table quote_lines (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references quotes(id) on delete cascade,
  line_no int not null,
  product_id uuid not null references products(id),
  sku text not null, description text not null,
  category product_category not null,
  qty numeric(10,2) not null check (qty > 0),
  uom text not null,
  unit_price_paise bigint not null check (unit_price_paise >= 0),   -- FROZEN price (ex-GST)
  gst_rate_bp int not null, hsn_code text,
  is_serialised boolean not null,
  source text not null check (source in ('template','survey_rule','option','manual')),
  qty_rule qty_rule,
  line_subtotal_paise bigint not null,             -- qty × unit_price (rounded)
  line_discount_paise bigint not null default 0,   -- proportional allocation
  line_taxable_paise bigint not null,
  line_gst_paise bigint not null,
  line_total_paise bigint not null,
  unique (quote_id, line_no)
);

create table quote_line_costs (                    -- COST SEGREGATION
  quote_line_id uuid primary key references quote_lines(id) on delete cascade,
  unit_cost_paise bigint not null check (unit_cost_paise >= 0)      -- FROZEN standard cost at quote time
);

-- Orders ------------------------------------------------------------------
create table orders (
  id uuid primary key default gen_random_uuid(),
  order_no text not null unique,
  project_id uuid not null references projects(id),
  quote_id uuid not null unique references quotes(id),
  status order_status not null default 'pending_payment',
  pay_status order_pay_status not null default 'unpaid',
  taxable_paise bigint not null, gst_paise bigint not null, total_paise bigint not null,
  advance_required_paise bigint not null,
  paid_paise bigint not null default 0,            -- cached Σ received payments (maintained by fn_refresh_order_payment)
  confirmed_at timestamptz, confirmed_by uuid references profiles(id),
  force_confirmed boolean not null default false, force_reason text,
  cancelled_at timestamptz, cancelled_by uuid references profiles(id), cancel_reason text,
  refund_due_paise bigint not null default 0,
  delivered_at timestamptz, completed_at timestamptz,
  delivery_name text, delivery_phone text, delivery_address text,   -- snapshot
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  row_version int not null default 1,
  check (status <> 'cancelled' or cancel_reason is not null),
  check (not force_confirmed or force_reason is not null)
);
create unique index orders_one_active_per_project on orders(project_id) where status <> 'cancelled';
alter table projects add constraint projects_order_fk foreign key (order_id) references orders(id);
alter table projects add constraint projects_quote_fk foreign key (current_quote_id) references quotes(id);

create table order_lines (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  line_no int not null,
  quote_line_id uuid references quote_lines(id),
  product_id uuid not null references products(id),
  sku text not null, description text not null, category product_category not null,
  qty numeric(10,2) not null check (qty > 0),
  uom text not null,
  unit_price_paise bigint not null, gst_rate_bp int not null, hsn_code text,
  is_serialised boolean not null,
  line_taxable_paise bigint not null, line_gst_paise bigint not null, line_total_paise bigint not null,
  qty_reserved numeric(10,2) not null default 0,
  qty_dispatched numeric(10,2) not null default 0,
  qty_delivered numeric(10,2) not null default 0,
  unique (order_id, line_no)
);

-- Payments ------------------------------------------------------------------
create table payments (
  id uuid primary key default gen_random_uuid(),
  payment_no text not null unique,
  project_id uuid references projects(id),
  order_id uuid references orders(id),
  ticket_id uuid,                                   -- FK later (service payments)
  invoice_id uuid,                                  -- FK later (optional explicit target)
  customer_id uuid not null references customers(id),
  kind payment_kind not null,
  method payment_method not null,
  amount_paise bigint not null check (amount_paise > 0),
  status payment_status not null default 'received',
  reference text,                                   -- UTR / cheque no.
  received_at timestamptz not null default now(),
  recorded_by uuid not null references profiles(id),
  reversal_of uuid references payments(id),
  reversal_reason text,
  notes text,
  idempotency_key uuid not null unique,
  created_at timestamptz not null default now(),
  check (order_id is not null or ticket_id is not null or invoice_id is not null)
);
create index payments_order on payments(order_id);
create index payments_received on payments(received_at);
create unique index payments_ref_uq on payments(method, reference)
  where reference is not null and status in ('received','pending');   -- same UTR cannot be booked twice
```
Attach touch to: leads, projects, jobs, surveys, quotes, orders.

**Not stored here (computed):** order `paid_paise` is a cache; the truth is `Σ payments.amount WHERE status='received' AND kind<>'refund' − Σ refunds`. `fn_refresh_order_payment(order_id)` recomputes and sets `paid_paise`, `pay_status`.

---

## 5. Inventory tables (`0004`)

```sql
create table suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null, phone text, gstin text, address text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table purchases (                             -- goods receipt header
  id uuid primary key default gen_random_uuid(),
  purchase_no text not null unique,
  supplier_id uuid references suppliers(id),
  supplier_invoice_no text, supplier_invoice_date date,
  status text not null default 'received' check (status in ('draft','received','cancelled')),
  received_at timestamptz, received_by uuid references profiles(id),
  notes text,
  idempotency_key uuid unique,
  created_at timestamptz not null default now()
);
create table purchase_lines (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references purchases(id) on delete cascade,
  product_id uuid not null references products(id),
  qty numeric(12,2) not null check (qty > 0),
  batch_no text
);
create table purchase_line_costs (                   -- COST SEGREGATION
  purchase_line_id uuid primary key references purchase_lines(id) on delete cascade,
  unit_cost_paise bigint not null check (unit_cost_paise >= 0)
);

create table stock_units (                           -- ONE ROW PER SERIALISED PHYSICAL UNIT
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id),
  serial_no text not null,                           -- normalised: trimmed, uppercase, no inner spaces
  status stock_unit_status not null default 'in_stock',
  location text not null default 'MAIN',
  purchase_line_id uuid references purchase_lines(id),
  batch_no text,
  received_at timestamptz not null default now(), received_by uuid references profiles(id),
  reserved_order_id uuid references orders(id),
  reserved_order_line_id uuid references order_lines(id),
  reserved_at timestamptz,
  notes text,
  updated_at timestamptz not null default now(),
  row_version int not null default 1,
  unique (product_id, serial_no),
  check (status <> 'reserved' or (reserved_order_id is not null and reserved_order_line_id is not null)),
  check (status = 'reserved' or reserved_order_id is null or status in ('dispatched','delivered','installed'))
);
create index stock_units_avail on stock_units(product_id, received_at) where status = 'in_stock';   -- FIFO pick
create index stock_units_order on stock_units(reserved_order_id);
create index stock_units_serial_trgm on stock_units using gin (serial_no gin_trgm_ops);
create index stock_units_serial_lookup on stock_units(serial_no);

create table stock_unit_costs (                      -- COST SEGREGATION
  stock_unit_id uuid primary key references stock_units(id) on delete cascade,
  unit_cost_paise bigint not null check (unit_cost_paise >= 0)
);

create table bulk_stock (                            -- ONE ROW PER BULK PRODUCT; updated ONLY by fn_post_movement
  product_id uuid primary key references products(id),
  on_hand numeric(12,2) not null default 0 check (on_hand >= 0),
  reserved numeric(12,2) not null default 0 check (reserved >= 0),
  available numeric(12,2) generated always as (on_hand - reserved) stored,
  updated_at timestamptz not null default now(),
  check (reserved <= on_hand)
);

create table stock_movements (                       -- APPEND-ONLY ledger for bulk items
  id bigserial primary key,
  product_id uuid not null references products(id),
  movement movement_type not null,
  qty numeric(12,2) not null check (qty > 0),
  order_id uuid references orders(id), order_line_id uuid references order_lines(id),
  purchase_line_id uuid references purchase_lines(id),
  adjustment_id uuid,
  dispatch_item_id uuid,
  reason text,
  actor_id uuid references profiles(id),
  created_at timestamptz not null default now()
);
create index stock_movements_product on stock_movements(product_id, created_at desc);

create table stock_adjustments (
  id uuid primary key default gen_random_uuid(),
  adjustment_no text not null unique,
  product_id uuid not null references products(id),
  stock_unit_id uuid references stock_units(id),     -- serialised: which unit; bulk: NULL
  direction text not null check (direction in ('up','down')),
  qty numeric(12,2) not null check (qty > 0),
  reason_code text not null check (reason_code in ('count_mismatch','damage','loss','found','correction','scrap','rma_out')),
  note text not null,
  needs_approval boolean not null default false,
  status adjustment_status not null default 'pending',
  requested_by uuid not null references profiles(id),
  decided_by uuid references profiles(id), decided_at timestamptz, decision_note text,
  created_at timestamptz not null default now(),
  idempotency_key uuid unique
);

-- Pick lists & dispatch ------------------------------------------------------
create table pick_lists (
  id uuid primary key default gen_random_uuid(),
  pick_no text not null unique,
  order_id uuid not null references orders(id),
  status pick_status not null default 'pending',
  assigned_to uuid references profiles(id),
  order_no text not null, project_no text not null,              -- denormalised: warehouse never joins orders
  customer_name text not null, customer_phone text, delivery_address text,
  dispatch_blocked boolean not null default false,               -- mirrors payment gate (no amounts exposed)
  dispatch_block_reason text,
  notes text,
  packed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  row_version int not null default 1
);
create unique index pick_lists_one_active on pick_lists(order_id) where status <> 'cancelled';

create table pick_list_lines (
  id uuid primary key default gen_random_uuid(),
  pick_list_id uuid not null references pick_lists(id) on delete cascade,
  order_line_id uuid not null references order_lines(id),
  product_id uuid not null references products(id),
  sku text not null, name text not null, category product_category not null,
  is_serialised boolean not null,
  qty_required numeric(10,2) not null,
  qty_picked numeric(10,2) not null default 0,                   -- bulk: manual confirm; serialised: = scanned count
  sort int not null default 100,
  unique (pick_list_id, order_line_id)
);

create table dispatches (
  id uuid primary key default gen_random_uuid(),
  dispatch_no text not null unique,
  order_id uuid not null references orders(id),
  pick_list_id uuid not null references pick_lists(id),
  status dispatch_status not null default 'draft',
  vehicle_no text, driver_name text, driver_phone text,
  planned_at timestamptz,
  dispatched_at timestamptz, dispatched_by uuid references profiles(id),
  delivered_at timestamptz,
  delivery_confirmed_by_type text check (delivery_confirmed_by_type in ('otp','signature','photo','staff_override')),
  delivery_confirmed_name text,
  delivery_otp_hash text, delivery_otp_expires_at timestamptz, delivery_otp_attempts int not null default 0,
  delivery_proof_path text,
  override_reason text,
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  row_version int not null default 1
);
create index dispatches_order on dispatches(order_id);

create table dispatch_items (
  id uuid primary key default gen_random_uuid(),
  dispatch_id uuid not null references dispatches(id) on delete cascade,
  order_line_id uuid not null references order_lines(id),
  product_id uuid not null references products(id),
  stock_unit_id uuid references stock_units(id),                  -- serialised
  qty numeric(10,2) not null check (qty > 0),                     -- 1 for serialised
  scanned_by uuid references profiles(id),
  scanned_at timestamptz not null default now(),
  removed_at timestamptz, removed_reason text, removed_by uuid references profiles(id),
  delivered_at timestamptz,
  returned_at timestamptz
);
create unique index dispatch_items_unit_active on dispatch_items(stock_unit_id)
  where stock_unit_id is not null and removed_at is null and returned_at is null;
create index dispatch_items_dispatch on dispatch_items(dispatch_id);

create table scan_events (                            -- EVERY scan attempt, accepted or not (append-only)
  id bigserial primary key,
  order_id uuid references orders(id),
  dispatch_id uuid references dispatches(id),
  raw_input text not null,
  normalized_serial text,
  product_id uuid references products(id),
  stock_unit_id uuid references stock_units(id),
  result scan_result not null,
  message text,
  method text not null default 'camera' check (method in ('camera','manual','csv','range')),
  actor_id uuid references profiles(id),
  idempotency_key uuid unique,
  created_at timestamptz not null default now()
);
create index scan_events_order on scan_events(order_id, created_at desc);
```
Attach touch to: stock_units, pick_lists, dispatches.

---

## 6. Field tables (`0005`)

```sql
create table install_reports (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null unique references jobs(id),
  project_id uuid not null references projects(id),
  started_at timestamptz, finished_at timestamptz,
  installed_kw numeric(4,1), panel_count int,
  stands_fixed boolean not null default false,
  panels_mounted boolean not null default false,
  wiring_done boolean not null default false,
  earthing_done boolean not null default false,
  inverter_commissioned boolean not null default false,
  power_test_passed boolean,
  dc_voltage_v numeric(7,2), ac_voltage_v numeric(7,2), power_output_kw numeric(6,2), earthing_resistance_ohm numeric(6,2),
  unit_checklist jsonb not null default '[]',      -- [{asset_id, installed:boolean, note}]
  notes text,
  signature_status signature_status not null default 'pending',
  signature_path text, signed_by_name text, signed_at timestamptz,
  signature_method text check (signature_method in ('on_device','remote_link','otp')),
  signature_ip_hash text, refusal_reason text,
  customer_rating int check (customer_rating between 1 and 5),
  submitted_at timestamptz, submitted_by uuid references profiles(id),
  client_submission_id uuid unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  row_version int not null default 1,
  check (finished_at is null or started_at is null or finished_at >= started_at),
  check (signature_status <> 'refused' or refusal_reason is not null)
);

create table job_photos (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id),
  project_id uuid not null references projects(id),
  kind photo_kind not null,
  storage_bucket text not null, storage_path text not null unique,
  taken_at timestamptz not null,
  lat numeric(9,6), lng numeric(9,6), accuracy_m numeric(7,1),
  caption text,
  uploaded_by uuid not null references profiles(id),
  client_photo_id uuid unique,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);
create index job_photos_job on job_photos(job_id, kind) where deleted_at is null;

create table job_materials (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id),
  product_id uuid not null references products(id),
  qty numeric(10,2) not null check (qty > 0),
  source text not null check (source in ('extra','returned','damaged')),
  reason text,
  added_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  client_entry_id uuid unique
);

create table time_entries (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id),
  profile_id uuid not null references profiles(id),
  started_at timestamptz not null,
  ended_at timestamptz,
  minutes int generated always as (case when ended_at is null then null
        else greatest(0, (extract(epoch from (ended_at - started_at)) / 60)::int) end) stored,
  source text not null default 'timer' check (source in ('timer','manual')),
  rate_paise bigint,                                 -- hourly rate SNAPSHOT set when entry is closed
  approved boolean not null default false,
  note text,
  client_entry_id uuid unique,
  created_at timestamptz not null default now(),
  check (ended_at is null or ended_at > started_at),
  exclude using gist (profile_id with =, tstzrange(started_at, coalesce(ended_at, 'infinity'::timestamptz)) with &&)
);
create index time_entries_job on time_entries(job_id);

create table variations (
  id uuid primary key default gen_random_uuid(),
  variation_no text not null unique,
  project_id uuid not null references projects(id),
  order_id uuid not null references orders(id),
  job_id uuid references jobs(id),
  reason text not null,
  quoted_kw numeric(4,1), installed_kw numeric(4,1),
  delta_taxable_paise bigint not null default 0,     -- + extra, − credit
  delta_gst_paise bigint not null default 0,
  status variation_status not null default 'pending',
  requested_by uuid not null references profiles(id),
  decided_by uuid references profiles(id), decided_at timestamptz, decision_note text,
  invoice_id uuid,
  created_at timestamptz not null default now()
);
```

---

## 7. Assets & service (`0006`)

```sql
create table assets (                                 -- a delivered serialised unit that belongs to a customer
  id uuid primary key default gen_random_uuid(),
  stock_unit_id uuid not null unique references stock_units(id),
  product_id uuid not null references products(id),
  serial_no text not null,
  customer_id uuid not null references customers(id), -- CURRENT owner
  project_id uuid not null references projects(id),
  order_id uuid not null references orders(id),
  status text not null default 'delivered' check (status in ('delivered','installed','under_repair','replaced','retired')),
  delivered_at timestamptz not null,
  installed_at timestamptz,
  warranty_months int not null,
  warranty_start date,                                -- NULL until trigger fires (delivery or installation)
  warranty_end date generated always as ((warranty_start + make_interval(months => warranty_months))::date) stored,
  warranty_void boolean not null default false,
  void_reason text,
  replaces_asset_id uuid references assets(id),
  replaced_by_asset_id uuid references assets(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  row_version int not null default 1
);
create index assets_customer on assets(customer_id);
create index assets_project on assets(project_id);
create index assets_serial on assets(serial_no);
create index assets_serial_trgm on assets using gin (serial_no gin_trgm_ops);
create index assets_warranty_end on assets(warranty_end) where not warranty_void;

create table asset_ownership_history (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references assets(id),
  from_customer_id uuid references customers(id), to_customer_id uuid not null references customers(id),
  reason text, changed_by uuid references profiles(id), changed_at timestamptz not null default now()
);

create table tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_no text not null unique,
  customer_id uuid not null references customers(id),
  project_id uuid references projects(id),
  asset_id uuid references assets(id),
  serial_entered text,                                 -- what the caller/support typed if no asset matched
  channel ticket_channel not null default 'phone',
  issue_type text not null check (issue_type in ('no_power','fault_code','low_generation','noise_heat','physical_damage','battery_issue','connectivity','billing','other')),
  fault_code text,
  description text not null,
  priority ticket_priority not null default 'normal',
  status ticket_status not null default 'open',
  warranty_decision warranty_decision not null default 'unknown',
  warranty_checked_at timestamptz,
  warranty_basis jsonb,                                -- snapshot {asset_id, warranty_start, warranty_end, status, rule}
  decision_by uuid references profiles(id), decision_reason text,
  assigned_to uuid references profiles(id),
  sla_due_at timestamptz, first_response_at timestamptz,
  work_done_at timestamptz,                            -- technician says done
  customer_confirmed_at timestamptz,
  confirmation_method text check (confirmation_method in ('phone','otp','signature','link','in_person')),
  confirmation_note text,
  closed_at timestamptz, closed_by uuid references profiles(id), close_reason text,
  reopen_count int not null default 0,
  is_repeat boolean not null default false,
  repeat_of_ticket_id uuid references tickets(id),
  billing ticket_billing not null default 'not_applicable',
  service_invoice_id uuid,
  rma_ref text, blocked_reason text,
  created_by uuid references profiles(id),
  idempotency_key uuid unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  row_version int not null default 1,
  check (status <> 'closed' or (customer_confirmed_at is not null or close_reason is not null)),
  check (status <> 'waiting_part' or blocked_reason is not null)
);
create index tickets_status on tickets(status) where status not in ('closed','cancelled');
create index tickets_asset on tickets(asset_id);
create index tickets_customer on tickets(customer_id);
alter table jobs add constraint jobs_ticket_fk foreign key (ticket_id) references tickets(id);
alter table payments add constraint payments_ticket_fk foreign key (ticket_id) references tickets(id);

create table ticket_events (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references tickets(id),
  kind text not null check (kind in ('created','note','status_change','assigned','warranty_decision','visit_scheduled','parts_added','labour_added','customer_confirmed','reopened','billing')),
  note text, meta jsonb,
  actor_id uuid references profiles(id),
  created_at timestamptz not null default now()
);
create index ticket_events_ticket on ticket_events(ticket_id, created_at);

create table ticket_parts (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references tickets(id),
  job_id uuid references jobs(id),
  product_id uuid not null references products(id),
  qty numeric(10,2) not null check (qty > 0),
  old_asset_id uuid references assets(id),             -- faulty unit swapped out
  new_stock_unit_id uuid references stock_units(id),   -- replacement serialised unit
  new_asset_id uuid references assets(id),
  billable boolean not null,                           -- decided from warranty decision at add-time
  unit_price_paise bigint not null default 0,          -- frozen customer price (0 if not billable)
  gst_rate_bp int not null default 0,
  added_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

create table ticket_labour (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references tickets(id),
  job_id uuid references jobs(id),
  profile_id uuid references profiles(id),
  minutes int not null check (minutes > 0),
  billable boolean not null,
  rate_paise_per_hour bigint not null default 0,       -- frozen customer billing rate
  gst_rate_bp int not null default 0,
  note text,
  created_at timestamptz not null default now()
);
```

---

## 8. Finance (`0007`)

```sql
create table invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_no text unique,                              -- assigned ONLY when status moves draft→issued (gapless)
  kind invoice_kind not null,
  status invoice_status not null default 'draft',
  customer_id uuid not null references customers(id),
  project_id uuid references projects(id),
  order_id uuid references orders(id),
  ticket_id uuid references tickets(id),
  variation_id uuid references variations(id),
  credit_for_invoice_id uuid references invoices(id),
  bill_to_name text not null, bill_to_gstin text, bill_to_address text, place_of_supply_state text,
  taxable_paise bigint not null default 0,
  gst_paise bigint not null default 0,
  total_paise bigint not null default 0,
  paid_paise bigint not null default 0,                -- cached Σ allocations
  issued_at timestamptz, due_date date,
  void_reason text, voided_at timestamptz, voided_by uuid references profiles(id),
  pdf_path text,
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  row_version int not null default 1,
  check (status = 'draft' or invoice_no is not null),
  check (status <> 'void' or void_reason is not null)
);
create index invoices_order on invoices(order_id);
create index invoices_ticket on invoices(ticket_id);
alter table payments add constraint payments_invoice_fk foreign key (invoice_id) references invoices(id);
alter table tickets add constraint tickets_invoice_fk foreign key (service_invoice_id) references invoices(id);
alter table variations add constraint variations_invoice_fk foreign key (invoice_id) references invoices(id);

create table invoice_lines (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  line_no int not null,
  product_id uuid references products(id),
  description text not null, hsn_code text,
  qty numeric(10,2) not null, uom text not null default 'nos',
  unit_price_paise bigint not null, gst_rate_bp int not null,
  taxable_paise bigint not null, gst_paise bigint not null, total_paise bigint not null,
  source_type text, source_id uuid,
  unique (invoice_id, line_no)
);

create table payment_allocations (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references payments(id),
  invoice_id uuid not null references invoices(id),
  amount_paise bigint not null check (amount_paise > 0),
  created_at timestamptz not null default now(),
  unique (payment_id, invoice_id)
);

create table project_costs (                           -- COST SEGREGATION (non-labour costs; labour comes from time_entries)
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id),
  ticket_id uuid references tickets(id),               -- NOT NULL ⇒ post-sale service/warranty cost
  job_id uuid references jobs(id),
  kind text not null check (kind in ('material','extra_material','service_part','travel','permit','subcontract','other')),
  product_id uuid references products(id),
  qty numeric(12,2) not null default 1,
  unit_cost_paise bigint not null check (unit_cost_paise >= 0),
  amount_paise bigint not null check (amount_paise >= 0),
  source_type text, source_id uuid,                    -- e.g. ('dispatch_item', id) — prevents double posting
  note text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  unique (source_type, source_id)
);
create index project_costs_project on project_costs(project_id);

create table subsidy_applications (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references projects(id),
  status subsidy_status not null default 'not_applicable',
  on_query boolean not null default false, query_note text,
  portal_application_no text,
  expected_paise bigint not null default 0,            -- from quote (informational)
  credited_paise bigint,                               -- informational; paid to customer, NOT company revenue
  registration_done_at timestamptz, docs_uploaded_at timestamptz,
  inspection_requested_at timestamptz, inspection_done_at timestamptz,
  commissioning_cert_no text, commissioned_on date,
  claim_submitted_at timestamptz, credited_at timestamptz,
  rejected_reason text,
  owner_id uuid references profiles(id),
  next_action text, next_action_due date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  row_version int not null default 1
);
create table subsidy_checklist_items (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references subsidy_applications(id) on delete cascade,
  code text not null check (code in ('module_serials','dcr_certificate','geo_tagged_photo','installation_report',
                                     'customer_signature','meter_report','net_metering_agreement','name_match')),
  label text not null,
  status text not null default 'pending' check (status in ('pending','ready','done','n_a')),
  auto_checked boolean not null default false,          -- system-verified (e.g. serials present)
  evidence_path text, note text,
  updated_by uuid references profiles(id), updated_at timestamptz not null default now(),
  unique (application_id, code)
);

create table technician_rates (
  profile_id uuid primary key references profiles(id),
  pay_model pay_model not null default 'hourly',
  hourly_paise bigint not null default 0,
  per_job_paise bigint not null default 0,
  effective_from date not null default current_date
);
create table pay_periods (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,                           -- '2026-11'
  from_date date not null, to_date date not null,
  status pay_period_status not null default 'open',
  approved_by uuid references profiles(id), approved_at timestamptz,
  paid_on date,
  check (to_date >= from_date)
);
create table pay_entries (
  id uuid primary key default gen_random_uuid(),
  period_id uuid not null references pay_periods(id),
  profile_id uuid not null references profiles(id),
  minutes int not null default 0,
  jobs_completed int not null default 0,
  hourly_amount_paise bigint not null default 0,
  per_job_amount_paise bigint not null default 0,
  bonus_paise bigint not null default 0, deduction_paise bigint not null default 0,
  total_paise bigint generated always as (hourly_amount_paise + per_job_amount_paise + bonus_paise - deduction_paise) stored,
  flags text[] not null default '{}',                   -- 'missing_hours', 'open_time_entry', 'unapproved_entries'
  note text,
  unique (period_id, profile_id)
);
```

---

## 9. Platform tables (`0008`)

```sql
create table notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references profiles(id),
  type text not null,
  title text not null, body text,
  entity_type text, entity_id uuid, url text,
  severity text not null default 'info' check (severity in ('info','success','warning','action_required')),
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_inbox on notifications(recipient_id, created_at desc) where read_at is null;

create table audit_log (
  id bigserial primary key,
  actor_id uuid, action text not null,
  entity_type text not null, entity_id uuid,
  before jsonb, after jsonb, reason text,
  at timestamptz not null default now()
);
create index audit_entity on audit_log(entity_type, entity_id, at desc);

create table status_history (
  id bigserial primary key,
  entity_type text not null, entity_id uuid not null,
  from_status text, to_status text not null,
  actor_id uuid, reason text,
  at timestamptz not null default now()
);
create index status_history_entity on status_history(entity_type, entity_id, at);

create table share_links (
  id uuid primary key default gen_random_uuid(),
  kind share_kind not null,
  entity_id uuid,                                       -- quote_id / project_id / asset_id / dispatch_id / job_id; NULL for report
  token_hash text not null unique,                      -- sha256(token || TOKEN_PEPPER); the raw token is never stored
  expires_at timestamptz, revoked_at timestamptz,
  redact_pii boolean not null default true,
  params jsonb not null default '{}',                   -- report: {range:'month', from, to}
  snapshot jsonb,                                       -- report: frozen figures at share time (optional)
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  access_count int not null default 0, last_access_at timestamptz, last_ip_hash text
);
create index share_links_entity on share_links(kind, entity_id);

create table idempotency_keys (
  key uuid primary key, scope text not null, response jsonb,
  created_at timestamptz not null default now()
);
create table rate_limits (
  bucket text not null, window_start timestamptz not null, hits int not null default 0,
  primary key (bucket, window_start)
);
create table action_failures (
  id bigserial primary key, action text, actor_id uuid, code text, message text, detail text,
  created_at timestamptz not null default now()
);
create table domain_events (
  id bigserial primary key, event_type text not null, entity_type text, entity_id uuid, payload jsonb,
  created_at timestamptz not null default now(), processed_at timestamptz
);

-- Rate limiter used by public endpoints
create or replace function public.fn_rate_limit(p_bucket text, p_max int, p_window interval) returns boolean
language plpgsql security definer set search_path = public as $$
declare v_start timestamptz := to_timestamp(floor(extract(epoch from now()) / extract(epoch from p_window)) * extract(epoch from p_window));
        v_hits int;
begin
  insert into rate_limits(bucket, window_start, hits) values (p_bucket, v_start, 1)
  on conflict (bucket, window_start) do update set hits = rate_limits.hits + 1
  returning hits into v_hits;
  return v_hits <= p_max;
end $$;
```

---

## 10. Views (`0011`)

All views `WITH (security_invoker = true)` so RLS of the caller applies.

```sql
-- Live warranty status for assets
create or replace view v_asset_warranty with (security_invoker = true) as
select a.*,
  case
    when a.warranty_void then 'void'
    when a.warranty_start is null then 'not_started'
    when a.warranty_end < (now() at time zone 'Asia/Kolkata')::date then 'expired'
    when a.warranty_end <= (now() at time zone 'Asia/Kolkata')::date + coalesce((select (value #>> '{}')::int from settings where key='warranty.expiring_soon_days'),60) then 'expiring_soon'
    else 'active'
  end as warranty_status,
  greatest(0, a.warranty_end - (now() at time zone 'Asia/Kolkata')::date) as days_left
from assets a;

-- Per-project profit (REQ-FIN-02). Never fabricates: exposes completeness + missing list.
create or replace view v_project_profit with (security_invoker = true) as
with
rev as (
  select p.id as project_id,
    coalesce((select sum(o.taxable_paise) from orders o where o.project_id=p.id and o.status<>'cancelled'),0)
  + coalesce((select sum(v.delta_taxable_paise) from variations v where v.project_id=p.id and v.status='approved'),0) as revenue_paise
  from projects p
),
mat as (
  select project_id,
    sum(amount_paise) filter (where ticket_id is null and kind in ('material','extra_material')) as material_paise,
    sum(amount_paise) filter (where ticket_id is null and kind in ('travel','permit','subcontract','other')) as other_paise,
    sum(amount_paise) filter (where ticket_id is not null) as service_part_cost_paise
  from project_costs group by project_id
),
lab as (
  select j.project_id,
    sum((te.minutes / 60.0) * te.rate_paise) filter (where j.type <> 'service')::bigint as labour_paise,
    sum((te.minutes / 60.0) * te.rate_paise) filter (where j.type = 'service')::bigint  as service_labour_cost_paise,
    sum(te.minutes) filter (where j.type = 'install') as install_minutes
  from time_entries te join jobs j on j.id = te.job_id
  where te.ended_at is not null group by j.project_id
),
svc_rev as (
  select project_id, sum(taxable_paise) as service_revenue_paise
  from invoices where kind='service' and status in ('issued','partially_paid','paid') group by project_id
),
chk as (
  select p.id as project_id,
    exists(select 1 from jobs j where j.project_id=p.id and j.type='install' and j.status='completed') as install_done,
    -- every dispatched serialised unit has a cost row
    not exists(select 1 from dispatch_items di join dispatches d on d.id=di.dispatch_id join orders o on o.id=d.order_id
               where o.project_id=p.id and di.stock_unit_id is not null and di.removed_at is null
                 and not exists(select 1 from stock_unit_costs c where c.stock_unit_id=di.stock_unit_id)) as serial_costs_ok
  from projects p
)
select p.id as project_id, p.project_no, p.customer_id, p.stage,
  rev.revenue_paise,
  coalesce(mat.material_paise,0)  as material_cost_paise,
  coalesce(lab.labour_paise,0)    as labour_cost_paise,
  coalesce(mat.other_paise,0)     as other_cost_paise,
  rev.revenue_paise - coalesce(mat.material_paise,0) - coalesce(lab.labour_paise,0) - coalesce(mat.other_paise,0) as profit_paise,
  case when rev.revenue_paise > 0
       then round(100.0 * (rev.revenue_paise - coalesce(mat.material_paise,0) - coalesce(lab.labour_paise,0) - coalesce(mat.other_paise,0)) / rev.revenue_paise, 1) end as margin_pct,
  coalesce(svc_rev.service_revenue_paise,0) as service_revenue_paise,
  coalesce(mat.service_part_cost_paise,0) + coalesce(lab.service_labour_cost_paise,0) as service_cost_paise,
  (chk.install_done and chk.serial_costs_ok and coalesce(lab.install_minutes,0) > 0) as is_complete,
  array_remove(array[
    case when not chk.install_done then 'install_not_completed' end,
    case when not chk.serial_costs_ok then 'unit_cost_missing' end,
    case when coalesce(lab.install_minutes,0) = 0 then 'labour_hours_missing' end
  ], null) as missing
from projects p
join rev using (project_id) left join mat using (project_id) left join lab using (project_id)
left join svc_rev using (project_id) join chk using (project_id)
where p.stage <> 'cancelled' or exists (select 1 from orders o where o.project_id=p.id);

-- Order payment summary for UI
create or replace view v_order_balance with (security_invoker = true) as
select o.id as order_id, o.order_no, o.total_paise, o.paid_paise, o.total_paise - o.paid_paise as balance_paise,
       o.advance_required_paise, greatest(0, o.advance_required_paise - o.paid_paise) as advance_short_paise
from orders o;

-- Serialised availability
create or replace view v_serial_availability with (security_invoker = true) as
select product_id,
  count(*) filter (where status='in_stock') as available,
  count(*) filter (where status='reserved') as reserved,
  count(*) filter (where status in ('damaged','rma','under_repair')) as blocked
from stock_units group by product_id;
```

---

## 11. Indexing & search notes
- **Support search** (`fn_search_support`): union of (a) `assets.serial_no` exact/trigram, (b) `customers.phone_e164` suffix/trigram, (c) `customers.name` trigram, (d) `tickets.ticket_no`, (e) `projects.project_no`. Normalise input: digits-only for phones (try with/without `+91`); serial normalisation via `normalizeSerial()` (uppercase, strip whitespace/hyphen variants considered separately—see file 06 §3.2).
- All FK columns used in joins have indexes (listed above); add `created_at` indexes for list screens ordered by time.

---

## 12. Seed data (`seed.sql`) — exact starting dataset

### 12.1 Settings
Insert every key from file 00 §6 with its default (`value` as JSON, e.g. `'50'::jsonb`, `'"delivery"'::jsonb`, tiers as array).

### 12.2 Products (illustrative prices ex-GST; **teams must adjust to real prices**)
| SKU | Name | Category | Serialised | Warranty (months) | UoM | Price ₹ | Cost ₹ | Notes |
|---|---|---|:-:|:-:|---|--:|--:|---|
| PNL-540-DCR | Mono PERC Solar Panel 540 Wp (DCR) | panel | ✅ | 240 | nos | 14,000 | 11,500 | `wattage_w=540`, `is_dcr=true` |
| PNL-540-NDCR | Mono Solar Panel 540 Wp (non-DCR) | panel | ✅ | 240 | nos | 11,500 | 9,200 | `is_dcr=false` (commercial only) |
| INV-ON-1KW | On-Grid Inverter 1 kW | inverter | ✅ | 24 | nos | 14,000 | 11,000 | `capacity_kw=1` |
| INV-ON-2KW | On-Grid Inverter 2 kW | inverter | ✅ | 24 | nos | 20,000 | 16,000 | |
| INV-ON-3KW | On-Grid Inverter 3 kW | inverter | ✅ | 24 | nos | 27,000 | 21,500 | |
| INV-ON-4KW | On-Grid Inverter 4 kW | inverter | ✅ | 24 | nos | 34,000 | 27,000 | |
| INV-ON-5KW | On-Grid Inverter 5 kW | inverter | ✅ | 24 | nos | 42,000 | 33,500 | |
| INV-OFF-1KW … 5KW | Off-Grid (hybrid) Inverter 1–5 kW | inverter | ✅ | 24 | nos | 16,000 / 23,000 / 31,000 / 39,000 / 48,000 | 80% | 5 SKUs |
| CC-MPPT-40A | Charge Controller MPPT 40A | charge_controller | ✅ | 24 | nos | 6,500 | 5,000 | used 1–2 kW |
| CC-MPPT-60A | Charge Controller MPPT 60A | charge_controller | ✅ | 24 | nos | 9,500 | 7,500 | used 3–5 kW |
| BAT-TUB-150AH | Tubular Battery 12V 150Ah | battery | ✅ | 24 | nos | 14,500 | 11,800 | off-grid only |
| STR-GI-SET | GI Mounting Structure (per panel) | structure | ❌ | — | nos | 2,800 | 2,200 | `per_panel` |
| STR-GI-SET-TILE | GI Structure for sloped roof (per panel) | structure | ❌ | — | nos | 3,200 | 2,500 | for `sloped_*` roofs |
| CBL-DC-4MM | DC Solar Cable 4 mm² | cable | ❌ | — | m | 55 | 40 | `cable_dc_m` |
| CBL-AC-4MM | AC Cable 4 mm² | cable | ❌ | — | m | 65 | 48 | `cable_ac_m` |
| CBL-EARTH-6MM | Earthing Wire 6 mm² | cable | ❌ | — | m | 35 | 26 | fixed 20 m |
| MC4-PAIR | MC4 Connector Pair | connector | ❌ | — | nos | 120 | 80 | per panel |
| DCDB-1 | DC Distribution Box | junction_box | ❌ | — | nos | 2,500 | 1,800 | fixed 1 |
| ACDB-1 | AC Distribution Box | junction_box | ❌ | — | nos | 2,200 | 1,600 | fixed 1 |
| MCB-AC-32A | AC MCB 32 A | protection | ❌ | — | nos | 450 | 320 | fixed 1 |
| SPD-DC | DC Surge Protection Device | protection | ❌ | — | nos | 1,800 | 1,300 | fixed 1 |
| EARTH-KIT | Earthing Kit (pit + rod + chemical) | earthing | ❌ | — | set | 3,500 | 2,600 | 1 set (≤3 kW) / 2 sets (4–5 kW) |
| LA-KIT | Lightning Arrestor Kit | earthing | ❌ | — | set | 3,000 | 2,300 | fixed 1 |
| ACC-MISC | Clamps, lugs, conduit, tapes (misc kit) | accessory | ❌ | — | set | 1,500 | 1,000 | fixed 1 |
| SVC-INSTALL | Installation & Commissioning | service | ❌ | — | kw | 3,500 | 0 | `per_kw`; `tracks_stock=false`; GST service rate |
| SVC-LABOUR-HR | Service Labour (per hour) | service | ❌ | — | hr | 500 | 0 | ticket billing |
| SVC-VISIT | Service Visit Charge | service | ❌ | — | job | 300 | 0 | ticket billing |

Bulk starting stock: receive 200 STR-GI-SET, 100 STR-GI-SET-TILE, 1500 m CBL-DC-4MM, 800 m CBL-AC-4MM, 400 m CBL-EARTH-6MM, 200 MC4-PAIR, 30 DCDB-1, 30 ACDB-1, 40 MCB-AC-32A, 30 SPD-DC, 25 EARTH-KIT, 20 LA-KIT, 40 ACC-MISC via a seeded purchase.
Serialised starting stock (seed script generates serials like `PNL-2026-000001…`): 120 panels (DCR), 15 panels (non-DCR), 4 of each on-grid inverter, 2 of each off-grid inverter, 8 × CC-MPPT-40A, 8 × CC-MPPT-60A, 12 batteries.

### 12.3 Template rules (generate all 10; `k` = capacity)
Panel count at 540 Wp = ceil(k×1000/540): 1→2, 2→4, 3→6, 4→8, 5→10.

| Line | Rule | Value | Notes |
|---|---|---|---|
| PNL-540-DCR | `panel_count` | 1 | quantity from kW ÷ panel wattage |
| INV-ON-{k}KW / INV-OFF-{k}KW | `fixed` | 1 | matched SKU per template |
| CC-MPPT-40A (k ≤ 2) / CC-MPPT-60A (k ≥ 3) | `fixed` | 1 | |
| BAT-TUB-150AH (off-grid only) | `fixed` | k=1:2, 2:4, 3:4, 4:8, 5:8 | adjust to real battery bank design |
| STR-GI-SET | `per_panel` | 1 | `when_roof_types = {rcc_flat, other}` |
| STR-GI-SET-TILE | `per_panel` | 1 | `when_roof_types = {sloped_metal, sloped_tile, asbestos}` |
| MC4-PAIR | `per_panel` | 1 | |
| CBL-DC-4MM | `cable_dc_m` | 1.10 | slack factor; ceil |
| CBL-AC-4MM | `cable_ac_m` | 1.10 | ceil |
| CBL-EARTH-6MM | `fixed` | 20 | |
| DCDB-1, ACDB-1, MCB-AC-32A, SPD-DC, LA-KIT, ACC-MISC | `fixed` | 1 | |
| EARTH-KIT | `fixed` | 1 (k ≤ 3) / 2 (k ≥ 4) | |
| SVC-INSTALL | `per_kw` | 1 | qty = k |

### 12.4 Fault codes (generic examples — map to your inverter brands' manuals)
`GRID_OV` grid over-voltage · `GRID_UV` grid under-voltage · `NO_GRID` grid absent/anti-islanding · `ISO_FAULT` insulation resistance low (check DC cables, panel wet) · `DC_OV` DC over-voltage · `OVER_TEMP` · `FAN_FAIL` · `RELAY_FAIL` · `COMM_ERR` · `BAT_LOW` (off-grid) · `CC_OVERLOAD`. Each with likely cause, suggested action, and `suggested_product_ids` (e.g. `FAN_FAIL` → inverter unit swap, `ISO_FAULT` → `CBL-DC-4MM`, `MC4-PAIR`).

### 12.5 Demo users (created by `scripts/seed-demo.ts` + Clerk test accounts)
`director@demo`, `manager@demo` (Priya), `sales@demo` (Ravi), `tech1@demo` (Imran), `tech2@demo`, `warehouse@demo`, `support@demo`, `accounts@demo`. Each has a matching `profiles` row with `role` set.
