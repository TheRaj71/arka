-- Migration 0003: Leads, Projects, Jobs, Surveys, Quotes, Orders, Payments
-- Solar Installation Management System - THE COMPLETE SALES FUNNEL

-- ============================================================================
-- LEADS (Entry point of the funnel)
-- ============================================================================
create table leads (
  id uuid primary key default gen_random_uuid(),
  lead_no text not null unique,  -- LD-2627-00001
  customer_id uuid not null references customers(id),
  source lead_source not null default 'web',
  status lead_status not null default 'new',
  owner_id uuid references profiles(id),
  requested_kw numeric(4,1) check (requested_kw is null or requested_kw between 0.5 and 100),
  requirement system_type,
  wants_subsidy boolean not null default false,
  site_address text,
  site_city text,
  site_state text,
  site_pincode text,
  notes text,
  next_followup_at timestamptz,
  attempt_count int not null default 0,
  last_contacted_at timestamptz,
  close_reason text,
  closed_at timestamptz,
  project_id uuid,  -- FK added after projects table
  utm jsonb,
  submit_ip_hash text,
  submit_user_agent text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  row_version int not null default 1,
  check (status not in ('unreachable','disqualified','lost') or (close_reason is not null and closed_at is not null))
);

-- Only one open lead per customer (REQ-LEAD-04)
create unique index idx_leads_one_open_per_customer on leads(customer_id)
  where status in ('new','contacting','follow_up');

create index idx_leads_owner_status on leads(owner_id, status);
create index idx_leads_followup on leads(next_followup_at) where status in ('new','contacting','follow_up');

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

create index idx_lead_activities_lead on lead_activities(lead_id, created_at desc);

-- Qualification checklist (append-only)
create table lead_qualifications (
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

-- ============================================================================
-- PROJECTS (Main customer journey entity)
-- ============================================================================
create table projects (
  id uuid primary key default gen_random_uuid(),
  project_no text not null unique,  -- PRJ-2627-00001
  customer_id uuid not null references customers(id),
  lead_id uuid references leads(id),
  stage project_stage not null default 'qualified',
  customer_type customer_type not null,
  system_type system_type not null,
  requested_kw numeric(4,1) not null,
  final_kw numeric(4,1),
  site_address text not null,
  site_city text,
  site_state text,
  site_pincode text,
  site_lat numeric(9,6),
  site_lng numeric(9,6),
  discom text,
  consumer_number text,
  consumer_name_on_bill text,
  sanctioned_load_kw numeric(5,2),
  sales_owner_id uuid references profiles(id),
  subsidy_eligible boolean not null default false,
  subsidy_override_reason text,
  current_quote_id uuid,  -- FK added after quotes
  order_id uuid,  -- FK added after orders
  hold_reason text,
  cancel_reason text,
  installed_on date,
  commissioned_on date,
  completed_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  row_version int not null default 1,
  check (stage <> 'cancelled' or cancel_reason is not null),
  check (stage <> 'on_hold' or hold_reason is not null)
);

create index idx_projects_stage on projects(stage);
create index idx_projects_customer on projects(customer_id);
create index idx_projects_sales_owner on projects(sales_owner_id);

-- Link leads back to projects
alter table leads add constraint fk_leads_project foreign key (project_id) references projects(id);

-- ============================================================================
-- JOBS (Survey, Install, Service)
-- ============================================================================
create table jobs (
  id uuid primary key default gen_random_uuid(),
  job_no text not null unique,  -- JOB-2627-00001
  project_id uuid not null references projects(id),
  type job_type not null,
  status job_status not null default 'unscheduled',
  ticket_id uuid,  -- FK added in service migration
  title text not null,
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  estimated_hours numeric(5,2),
  actual_start timestamptz,
  actual_end timestamptz,
  site_address text,
  notes text,
  hold_reason text,
  cancel_reason text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  row_version int not null default 1,
  check (scheduled_end is null or scheduled_start is null or scheduled_end > scheduled_start),
  check (status <> 'scheduled' or scheduled_start is not null),
  check (status <> 'cancelled' or cancel_reason is not null)
);

-- Only one active survey per project
create unique index idx_jobs_one_active_survey on jobs(project_id)
  where type = 'survey' and status in ('unscheduled','scheduled','in_progress');

-- Only one active install per project  
create unique index idx_jobs_one_active_install on jobs(project_id)
  where type = 'install' and status <> 'cancelled';

create index idx_jobs_schedule on jobs(scheduled_start) where status in ('scheduled','in_progress');
create index idx_jobs_status_type on jobs(status, type);

create table job_crew (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  profile_id uuid not null references profiles(id),
  crew_role text not null default 'lead' check (crew_role in ('lead','helper')),
  created_at timestamptz not null default now(),
  unique (job_id, profile_id)
);

create index idx_job_crew_profile on job_crew(profile_id);

-- ============================================================================
-- SURVEYS
-- ============================================================================
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
  cable_dc_m numeric(6,1) check (cable_dc_m >= 0),
  cable_ac_m numeric(6,1) check (cable_ac_m >= 0),
  earthing_distance_m numeric(5,1),
  grid_connection_ok boolean,
  meter_location text,
  feasibility feasibility,
  recommended_kw numeric(4,1),
  shading_notes text,
  notes text,
  submitted_at timestamptz,
  submitted_by uuid references profiles(id),
  reviewed_at timestamptz,
  reviewed_by uuid references profiles(id),
  review_note text,
  client_submission_id uuid unique,  -- idempotency for offline
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  row_version int not null default 1,
  check (status not in ('rejected','rework_requested') or review_note is not null)
);

create index idx_surveys_project on surveys(project_id, revision desc);

-- ============================================================================
-- QUOTES
-- ============================================================================
create table quotes (
  id uuid primary key default gen_random_uuid(),
  quote_no text not null,  -- QT-2627-00001
  version int not null default 1,
  parent_quote_id uuid references quotes(id),
  project_id uuid not null references projects(id),
  survey_id uuid not null references surveys(id),  -- THE APPROVED SURVEY (Gate G1)
  template_id uuid references package_templates(id),
  status quote_status not null default 'draft',
  system_type system_type not null,
  nominal_kw numeric(4,1) not null,
  panel_count int,
  dc_capacity_wp int,
  subtotal_paise bigint not null default 0,  -- before discount, ex-GST
  discount_paise bigint not null default 0 check (discount_paise >= 0),
  taxable_paise bigint not null default 0,  -- subtotal - discount
  gst_paise bigint not null default 0,
  total_paise bigint not null default 0,  -- taxable + gst
  subsidy_eligible boolean not null default false,
  subsidy_paise bigint not null default 0,  -- estimate
  net_cost_paise bigint not null default 0,  -- total - subsidy
  valid_until date,
  approval_required boolean not null default false,
  approval_reason text,
  approved_by uuid references profiles(id),
  approved_at timestamptz,
  sent_at timestamptz,
  sent_by uuid references profiles(id),
  accepted_at timestamptz,
  accepted_name text,
  accepted_ip_hash text,
  rejected_reason text,
  rejected_at timestamptz,
  expired_at timestamptz,
  customer_notes text,
  terms text,
  pdf_path text,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  row_version int not null default 1,
  unique (quote_no, version),
  check (discount_paise <= subtotal_paise)
);

-- Only one live quote per project
create unique index idx_quotes_one_live_per_project on quotes(project_id)
  where status in ('draft','pending_approval','approved','sent');

create index idx_quotes_project on quotes(project_id);
create index idx_quotes_status on quotes(status);

create table quote_lines (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references quotes(id) on delete cascade,
  line_no int not null,
  product_id uuid not null references products(id),
  sku text not null,
  description text not null,
  category product_category not null,
  qty numeric(10,2) not null check (qty > 0),
  uom text not null,
  unit_price_paise bigint not null check (unit_price_paise >= 0),  -- FROZEN
  gst_rate_bp int not null,
  hsn_code text,
  is_serialised boolean not null,
  source text not null check (source in ('template','survey_rule','option','manual')),
  qty_rule qty_rule,
  line_subtotal_paise bigint not null,
  line_discount_paise bigint not null default 0,
  line_taxable_paise bigint not null,
  line_gst_paise bigint not null,
  line_total_paise bigint not null,
  unique (quote_id, line_no)
);

-- Cost segregation
create table quote_line_costs (
  quote_line_id uuid primary key references quote_lines(id) on delete cascade,
  unit_cost_paise bigint not null check (unit_cost_paise >= 0)  -- FROZEN standard cost
);

-- Link projects back to quotes
alter table projects add constraint fk_projects_current_quote foreign key (current_quote_id) references quotes(id);

-- ============================================================================
-- ORDERS
-- ============================================================================
create table orders (
  id uuid primary key default gen_random_uuid(),
  order_no text not null unique,  -- ORD-2627-00001
  project_id uuid not null references projects(id),
  quote_id uuid not null unique references quotes(id),
  status order_status not null default 'pending_payment',
  pay_status order_pay_status not null default 'unpaid',
  taxable_paise bigint not null,
  gst_paise bigint not null,
  total_paise bigint not null,
  advance_required_paise bigint not null,
  paid_paise bigint not null default 0,  -- cached sum
  confirmed_at timestamptz,
  confirmed_by uuid references profiles(id),
  force_confirmed boolean not null default false,
  force_reason text,
  cancelled_at timestamptz,
  cancelled_by uuid references profiles(id),
  cancel_reason text,
  refund_due_paise bigint not null default 0,
  delivered_at timestamptz,
  completed_at timestamptz,
  delivery_name text,
  delivery_phone text,
  delivery_address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  row_version int not null default 1,
  check (status <> 'cancelled' or cancel_reason is not null),
  check (not force_confirmed or force_reason is not null)
);

-- Only one active order per project
create unique index idx_orders_one_active_per_project on orders(project_id) where status <> 'cancelled';

create table order_lines (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  line_no int not null,
  quote_line_id uuid references quote_lines(id),
  product_id uuid not null references products(id),
  sku text not null,
  description text not null,
  category product_category not null,
  qty numeric(10,2) not null check (qty > 0),
  uom text not null,
  unit_price_paise bigint not null,
  gst_rate_bp int not null,
  hsn_code text,
  is_serialised boolean not null,
  line_taxable_paise bigint not null,
  line_gst_paise bigint not null,
  line_total_paise bigint not null,
  qty_reserved numeric(10,2) not null default 0,
  qty_dispatched numeric(10,2) not null default 0,
  qty_delivered numeric(10,2) not null default 0,
  unique (order_id, line_no)
);

-- Link projects back to orders
alter table projects add constraint fk_projects_order foreign key (order_id) references orders(id);

-- ============================================================================
-- PAYMENTS
-- ============================================================================
create table payments (
  id uuid primary key default gen_random_uuid(),
  payment_no text not null unique,  -- PAY-2627-00001
  project_id uuid references projects(id),
  order_id uuid references orders(id),
  ticket_id uuid,  -- FK added in service migration
  invoice_id uuid,  -- FK added in finance migration
  customer_id uuid not null references customers(id),
  kind payment_kind not null,
  method payment_method not null,
  amount_paise bigint not null check (amount_paise > 0),
  reference text,  -- transaction ref/cheque no
  status payment_status not null default 'pending',
  received_at timestamptz,
  reversed_at timestamptz,
  reverse_reason text,
  notes text,
  recorded_by uuid not null references profiles(id),
  idempotency_key uuid unique,  -- client-generated
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (method = 'cash' or reference is not null),
  check (status <> 'reversed' or reverse_reason is not null)
);

-- Unique reference per method (prevent duplicate payments)
create unique index idx_payments_unique_ref on payments(method, reference) 
  where reference is not null and status <> 'reversed';

create index idx_payments_order on payments(order_id, status);
create index idx_payments_customer on payments(customer_id);

create table payment_allocations (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references payments(id),
  invoice_id uuid,  -- FK added in finance migration
  allocated_paise bigint not null check (allocated_paise > 0),
  created_at timestamptz not null default now()
);
