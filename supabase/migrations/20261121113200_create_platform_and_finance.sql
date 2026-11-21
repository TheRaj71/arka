-- Migration 0005: Platform & Finance (Notifications, Audit, Invoices, Reporting)
-- Solar Installation Management System

-- ============================================================================
-- INVOICES
-- ============================================================================
create table invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_no text not null unique,  -- INV-2627-00001
  kind invoice_kind not null,
  status invoice_status not null default 'draft',
  project_id uuid not null references projects(id),
  order_id uuid references orders(id),
  ticket_id uuid references tickets(id),
  customer_id uuid not null references customers(id),
  customer_name text not null,
  customer_address text,
  customer_gstin text,
  invoice_date date not null,
  due_date date,
  subtotal_paise bigint not null check (subtotal_paise >= 0),
  discount_paise bigint not null default 0 check (discount_paise >= 0),
  taxable_paise bigint not null check (taxable_paise >= 0),
  gst_paise bigint not null check (gst_paise >= 0),
  total_paise bigint not null check (total_paise >= 0),
  paid_paise bigint not null default 0 check (paid_paise >= 0),
  balance_paise bigint generated always as (total_paise - paid_paise) stored,
  pdf_path text,
  notes text,
  terms text,
  issued_by uuid references profiles(id),
  issued_at timestamptz,
  voided_by uuid references profiles(id),
  voided_at timestamptz,
  void_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'void' or void_reason is not null)
);

create index idx_invoices_customer on invoices(customer_id);
create index idx_invoices_project on invoices(project_id);
create index idx_invoices_status on invoices(status);
create index idx_invoices_date on invoices(invoice_date desc);

-- Link payments back to invoices
alter table payments add constraint fk_payments_invoice 
  foreign key (invoice_id) references invoices(id);

alter table payment_allocations add constraint fk_payment_allocations_invoice 
  foreign key (invoice_id) references invoices(id);

create table invoice_lines (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  line_no int not null,
  product_id uuid references products(id),
  sku text,
  description text not null,
  qty numeric(10,2) not null check (qty > 0),
  uom text not null,
  unit_price_paise bigint not null check (unit_price_paise >= 0),
  gst_rate_bp int not null,
  hsn_code text,
  line_taxable_paise bigint not null,
  line_gst_paise bigint not null,
  line_total_paise bigint not null,
  unique (invoice_id, line_no)
);

-- ============================================================================
-- SUBSIDY TRACKING
-- ============================================================================
create table subsidy_applications (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references projects(id),
  status subsidy_status not null default 'not_applicable',
  estimated_paise bigint not null default 0,
  credited_paise bigint not null default 0,
  registration_date date,
  installation_date date,
  inspection_date date,
  commissioned_date date,
  claim_submitted_date date,
  credited_date date,
  rejected_reason text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table subsidy_checklist_items (
  id uuid primary key default gen_random_uuid(),
  subsidy_application_id uuid not null references subsidy_applications(id),
  item_key text not null,
  item_name text not null,
  is_required boolean not null,
  is_complete boolean not null default false,
  completed_at timestamptz,
  notes text,
  unique (subsidy_application_id, item_key)
);

-- ============================================================================
-- PROJECT COSTS (Profit calculation)
-- ============================================================================
create table project_costs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id),
  kind text not null check (kind in ('material','labour','travel','permit','subcontract','extra_material','other')),
  source_type text not null check (source_type in ('dispatch','purchase','time_entry','manual')),
  source_id uuid not null,
  amount_paise bigint not null check (amount_paise > 0),
  description text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  unique (source_type, source_id)  -- Idempotency
);

create index idx_project_costs_project on project_costs(project_id);

-- ============================================================================
-- TECHNICIAN PAY
-- ============================================================================
create table technician_rates (
  profile_id uuid primary key references profiles(id),
  pay_model pay_model not null default 'hourly',
  hourly_rate_paise bigint check (hourly_rate_paise >= 0),
  per_job_rate_paise bigint check (per_job_rate_paise >= 0),
  effective_from date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table pay_periods (
  id uuid primary key default gen_random_uuid(),
  period_start date not null,
  period_end date not null,
  status pay_period_status not null default 'open',
  locked_by uuid references profiles(id),
  locked_at timestamptz,
  approved_by uuid references profiles(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  check (period_end > period_start),
  exclude using gist (daterange(period_start, period_end, '[]') with &&)
);

create table pay_entries (
  id uuid primary key default gen_random_uuid(),
  pay_period_id uuid not null references pay_periods(id),
  profile_id uuid not null references profiles(id),
  hours_worked numeric(6,2) not null default 0,
  jobs_completed int not null default 0,
  gross_paise bigint not null default 0 check (gross_paise >= 0),
  deductions_paise bigint not null default 0 check (deductions_paise >= 0),
  net_paise bigint generated always as (gross_paise - deductions_paise) stored,
  created_at timestamptz not null default now(),
  unique (pay_period_id, profile_id)
);

-- ============================================================================
-- SUPPLIERS & PURCHASES (for cost tracking)
-- ============================================================================
create table suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  contact_name text,
  phone text,
  email citext,
  address text,
  gstin text,
  payment_terms text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table purchases (
  id uuid primary key default gen_random_uuid(),
  purchase_no text not null unique,  -- PO-2627-00001
  supplier_id uuid not null references suppliers(id),
  purchase_date date not null,
  invoice_no text,
  invoice_date date,
  total_paise bigint not null check (total_paise >= 0),
  notes text,
  received_at timestamptz,
  received_by uuid references profiles(id),
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

create index idx_purchases_supplier on purchases(supplier_id);
create index idx_purchases_date on purchases(purchase_date desc);

create table purchase_lines (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references purchases(id) on delete cascade,
  line_no int not null,
  product_id uuid not null references products(id),
  sku text not null,
  description text not null,
  qty numeric(10,2) not null check (qty > 0),
  unit_cost_paise bigint not null check (unit_cost_paise >= 0),
  line_total_paise bigint not null,
  unique (purchase_id, line_no)
);

-- Cost segregation
create table purchase_line_costs (
  purchase_line_id uuid primary key references purchase_lines(id) on delete cascade,
  unit_cost_paise bigint not null check (unit_cost_paise >= 0)
);

-- ============================================================================
-- STOCK ADJUSTMENTS
-- ============================================================================
create table stock_adjustments (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id),
  adjustment_type movement_type not null check (adjustment_type in ('adjusted_up','adjusted_down')),
  qty numeric(12,2) not null check (qty > 0),
  reason text not null,
  status adjustment_status not null default 'pending',
  requested_by uuid not null references profiles(id),
  approved_by uuid references profiles(id),
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_stock_adjustments_product on stock_adjustments(product_id);
create index idx_stock_adjustments_status on stock_adjustments(status);

-- ============================================================================
-- NOTIFICATIONS (Realtime alerts)
-- ============================================================================
create table notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references profiles(id),
  type text not null,
  title text not null,
  body text,
  entity_type text,
  entity_id uuid,
  url text,
  severity text not null default 'info' check (severity in ('info','success','warning','action_required')),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_notifications_recipient on notifications(recipient_id, created_at desc);
create index idx_notifications_unread on notifications(recipient_id, created_at desc) 
  where read_at is null;

-- ============================================================================
-- AUDIT LOG (Append-only)
-- ============================================================================
create table audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before jsonb,
  after jsonb,
  reason text,
  created_at timestamptz not null default now()
);

create index idx_audit_log_entity on audit_log(entity_type, entity_id, created_at desc);
create index idx_audit_log_actor on audit_log(actor_id, created_at desc);
create index idx_audit_log_created on audit_log(created_at desc);

-- ============================================================================
-- STATUS HISTORY (Append-only state machine tracking)
-- ============================================================================
create table status_history (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  from_status text,
  to_status text not null,
  actor_id uuid references profiles(id),
  reason text,
  created_at timestamptz not null default now()
);

create index idx_status_history_entity on status_history(entity_type, entity_id, created_at desc);

-- ============================================================================
-- SHARE LINKS (Public token access)
-- ============================================================================
create table share_links (
  id uuid primary key default gen_random_uuid(),
  kind share_kind not null,
  entity_id uuid not null,
  token_hash text not null unique,  -- SHA256(token || PEPPER)
  expires_at timestamptz,
  revoked_at timestamptz,
  redact_pii boolean not null default false,
  params jsonb not null default '{}',
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  access_count int not null default 0,
  last_access_at timestamptz,
  last_ip_hash text
);

create index idx_share_links_entity on share_links(kind, entity_id);
create index idx_share_links_expires on share_links(expires_at) where revoked_at is null;

-- ============================================================================
-- IDEMPOTENCY KEYS (24h TTL)
-- ============================================================================
create table idempotency_keys (
  key uuid primary key,
  result jsonb not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours')
);

create index idx_idempotency_keys_expires on idempotency_keys(expires_at);

-- ============================================================================
-- RATE LIMITS (Anti-abuse)
-- ============================================================================
create table rate_limits (
  key text primary key,
  count int not null default 1,
  window_start timestamptz not null default now()
);

create index idx_rate_limits_window on rate_limits(window_start);
