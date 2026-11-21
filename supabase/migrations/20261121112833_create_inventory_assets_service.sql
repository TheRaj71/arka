-- Migration 0004: Inventory, Dispatch, Assets, Service (The Golden Thread!)
-- Serial → Asset → Warranty → Service → Profit

-- ============================================================================
-- INVENTORY: Stock Units (Serialised tracking)
-- ============================================================================
create table stock_units (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id),
  serial_no text not null,
  status stock_unit_status not null default 'in_stock',
  received_at timestamptz not null default now(),
  reserved_order_id uuid references orders(id),
  reserved_order_line_id uuid references order_lines(id),
  reserved_at timestamptz,
  dispatch_id uuid,  -- FK added after dispatches table
  asset_id uuid,  -- FK added after assets table
  notes text,
  location text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Unique serial per product (active only)
create unique index idx_stock_units_serial_unique on stock_units(product_id, serial_no) 
  where deleted_at is null;

-- Trigram search on serial
create index idx_stock_units_serial_trgm on stock_units using gin (serial_no gin_trgm_ops);

create index idx_stock_units_status on stock_units(status) where deleted_at is null;
create index idx_stock_units_order on stock_units(reserved_order_id) where reserved_order_id is not null;

-- Cost segregation
create table stock_unit_costs (
  stock_unit_id uuid primary key references stock_units(id),
  unit_cost_paise bigint not null check (unit_cost_paise >= 0)
);

-- ============================================================================
-- INVENTORY: Bulk Stock (Quantity tracking)
-- ============================================================================
create table bulk_stock (
  product_id uuid primary key references products(id),
  on_hand numeric(12,2) not null default 0 check (on_hand >= 0),
  reserved numeric(12,2) not null default 0 check (reserved >= 0),
  available numeric(12,2) generated always as (on_hand - reserved) stored,
  updated_at timestamptz not null default now(),
  check (reserved <= on_hand)
);

-- ============================================================================
-- INVENTORY: Stock Movements (Append-only ledger)
-- ============================================================================
create table stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id),
  movement_type movement_type not null,
  qty numeric(12,2) not null check (qty <> 0),
  order_id uuid references orders(id),
  order_line_id uuid references order_lines(id),
  reason text,
  actor_id uuid references profiles(id),
  created_at timestamptz not null default now()
);

create index idx_stock_movements_product on stock_movements(product_id, created_at desc);

-- ============================================================================
-- PICK LISTS (Warehouse packing)
-- ============================================================================
create table pick_lists (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references orders(id),
  project_no text not null,
  customer_name text not null,
  customer_phone text not null,
  delivery_address text not null,
  status pick_status not null default 'pending',
  dispatch_blocked boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_pick_lists_status on pick_lists(status);

create table pick_list_lines (
  id uuid primary key default gen_random_uuid(),
  pick_list_id uuid not null references pick_lists(id) on delete cascade,
  line_no int not null,
  product_id uuid not null references products(id),
  sku text not null,
  description text not null,
  qty numeric(10,2) not null check (qty > 0),
  is_serialised boolean not null,
  qty_picked numeric(10,2) not null default 0,
  unique (pick_list_id, line_no)
);

-- ============================================================================
-- DISPATCHES (Delivery runs with scanning)
-- ============================================================================
create table dispatches (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id),
  pick_list_id uuid not null references pick_lists(id),
  dispatch_no text not null unique,  -- DSP-2627-00001
  status dispatch_status not null default 'draft',
  vehicle text,
  driver_name text,
  driver_phone text,
  scheduled_at timestamptz,
  departed_at timestamptz,
  delivered_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_dispatches_order on dispatches(order_id);
create index idx_dispatches_status on dispatches(status);

-- Link stock_units back to dispatches
alter table stock_units add constraint fk_stock_units_dispatch 
  foreign key (dispatch_id) references dispatches(id);

create table dispatch_items (
  id uuid primary key default gen_random_uuid(),
  dispatch_id uuid not null references dispatches(id) on delete cascade,
  order_line_id uuid not null references order_lines(id),
  stock_unit_id uuid not null unique references stock_units(id),
  product_id uuid not null references products(id),
  serial_no text not null,
  scanned_at timestamptz not null default now(),
  scanned_by uuid references profiles(id),
  removed boolean not null default false,  -- unscanned before finalizing
  delivered_at timestamptz
);

create index idx_dispatch_items_dispatch on dispatch_items(dispatch_id);

-- ============================================================================
-- SCAN EVENTS (Complete audit trail - append-only)
-- ============================================================================
create table scan_events (
  id uuid primary key default gen_random_uuid(),
  dispatch_id uuid not null references dispatches(id),
  stock_unit_id uuid references stock_units(id),
  serial_input text not null,  -- raw input
  result scan_result not null,
  message text,
  actor_id uuid references profiles(id),
  idempotency_key uuid not null unique,  -- client-generated
  created_at timestamptz not null default now()
);

create index idx_scan_events_dispatch on scan_events(dispatch_id, created_at desc);

-- ============================================================================
-- ASSETS (Delivered units with warranty)
-- ============================================================================
create table assets (
  id uuid primary key default gen_random_uuid(),
  stock_unit_id uuid not null unique references stock_units(id),
  product_id uuid not null references products(id),
  serial_no text not null,
  customer_id uuid not null references customers(id),
  project_id uuid not null references projects(id),
  order_id uuid not null references orders(id),
  status stock_unit_status not null default 'delivered',
  delivered_at timestamptz not null,
  installed_at timestamptz,
  warranty_months int not null,  -- SNAPSHOT from product
  warranty_start date,  -- set per trigger setting
  warranty_end date,  -- calculated
  warranty_void boolean not null default false,
  replacement_of_asset_id uuid references assets(id),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Link stock_units back to assets
alter table stock_units add constraint fk_stock_units_asset 
  foreign key (asset_id) references assets(id);

-- Unique serial (active only)
create unique index idx_assets_serial_unique on assets(serial_no) where deleted_at is null;

-- Trigram search
create index idx_assets_serial_trgm on assets using gin (serial_no gin_trgm_ops);

create index idx_assets_customer on assets(customer_id);
create index idx_assets_project on assets(project_id);
create index idx_assets_warranty on assets(warranty_end) where warranty_void = false;

-- ============================================================================
-- TICKETS (Service complaints)
-- ============================================================================
create table tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_no text not null unique,  -- TKT-2627-00001
  customer_id uuid not null references customers(id),
  project_id uuid references projects(id),
  asset_id uuid references assets(id),
  reported_by_name text not null,
  reported_by_phone text not null,
  issue_type text,
  fault_code text,
  description text not null,
  status ticket_status not null default 'open',
  priority ticket_priority not null default 'normal',
  channel ticket_channel not null default 'phone',
  warranty_decision warranty_decision not null default 'unknown',
  warranty_basis jsonb,  -- snapshot of warranty calc
  billing ticket_billing not null default 'not_applicable',
  sla_due_at timestamptz,
  is_repeat boolean not null default false,
  repeat_of_ticket_id uuid references tickets(id),
  assigned_to uuid references profiles(id),
  customer_confirmed_at timestamptz,
  customer_confirmation_method text,
  reopen_count int not null default 0,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_tickets_customer on tickets(customer_id);
create index idx_tickets_asset on tickets(asset_id);
create index idx_tickets_status on tickets(status, priority);
create index idx_tickets_assigned on tickets(assigned_to) where status not in ('closed','cancelled');
create index idx_tickets_sla on tickets(sla_due_at) where status not in ('closed','cancelled');

-- Link jobs back to tickets (service jobs)
alter table jobs add constraint fk_jobs_ticket 
  foreign key (ticket_id) references tickets(id);

-- Link payments back to tickets (service payments)
alter table payments add constraint fk_payments_ticket 
  foreign key (ticket_id) references tickets(id);

create table ticket_events (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references tickets(id),
  event_type text not null check (event_type in ('created','assigned','status_change','note','part_added','labour_added','customer_contacted','customer_confirmed')),
  note text,
  meta jsonb,
  actor_id uuid references profiles(id),
  created_at timestamptz not null default now()
);

create index idx_ticket_events_ticket on ticket_events(ticket_id, created_at desc);

create table ticket_parts (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references tickets(id),
  product_id uuid not null references products(id),
  qty numeric(10,2) not null check (qty > 0),
  billable boolean not null,
  unit_price_paise bigint not null check (unit_price_paise >= 0),
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create index idx_ticket_parts_ticket on ticket_parts(ticket_id);

create table ticket_labour (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references tickets(id),
  description text not null,
  hours numeric(5,2) not null check (hours > 0),
  billable boolean not null,
  rate_paise_per_hour bigint not null check (rate_paise_per_hour >= 0),
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create index idx_ticket_labour_ticket on ticket_labour(ticket_id);

-- ============================================================================
-- FIELD: Installation Reports
-- ============================================================================
create table install_reports (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null unique references jobs(id),
  project_id uuid not null references projects(id),
  system_kw_confirmed numeric(4,1) not null,
  panel_count_installed int not null,
  power_test_passed boolean not null,
  power_test_notes text,
  extra_materials text,
  signature_status signature_status not null default 'pending',
  signature_path text,
  signed_at timestamptz,
  signed_by_name text,
  refused_reason text,
  client_submission_id uuid unique,  -- idempotency for offline
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table job_photos (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id),
  kind photo_kind not null,
  path text not null,
  taken_at timestamptz not null,
  lat numeric(9,6),
  lng numeric(9,6),
  uploaded_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create index idx_job_photos_job on job_photos(job_id, kind);

create table job_materials (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id),
  product_id uuid not null references products(id),
  qty numeric(10,2) not null check (qty > 0),
  reason text,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- TIME ENTRIES (Labor tracking - NO OVERLAP)
-- ============================================================================
create table time_entries (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id),
  job_id uuid not null references jobs(id),
  started_at timestamptz not null,
  ended_at timestamptz,
  break_minutes int not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ended_at is null or ended_at > started_at)
);

-- Prevent overlapping time entries per person (GATE G22)
create extension if not exists btree_gist;
alter table time_entries add constraint time_entries_no_overlap 
  exclude using gist (
    profile_id with =,
    tstzrange(started_at, ended_at, '[]') with &&
  ) where (ended_at is not null);

create index idx_time_entries_profile on time_entries(profile_id, started_at);
create index idx_time_entries_job on time_entries(job_id);

-- ============================================================================
-- VARIATIONS (Installed ≠ Quoted size)
-- ============================================================================
create table variations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id),
  quote_id uuid not null references quotes(id),
  quoted_kw numeric(4,1) not null,
  installed_kw numeric(4,1) not null,
  adjustment_paise bigint not null,  -- positive or negative
  reason text not null,
  status variation_status not null default 'pending',
  requested_by uuid not null references profiles(id),
  approved_by uuid references profiles(id),
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_variations_project on variations(project_id);
