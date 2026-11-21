-- Migration 0002: Core Tables (Profiles, Customers, Products, Templates)
-- Solar Installation Management System

-- ============================================================================
-- PROFILES (User management with Clerk integration)
-- ============================================================================
create table profiles (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null unique,
  email citext,
  full_name text not null default '',
  phone text,
  role app_role,  -- NULL = pending role assignment
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  row_version int not null default 1
);

create index idx_profiles_role on profiles(role) where is_active and deleted_at is null;
create index idx_profiles_email on profiles(email) where deleted_at is null;

-- ============================================================================
-- SETTINGS (System-wide configuration)
-- ============================================================================
create table settings (
  key text primary key,
  value jsonb not null,
  description text,
  updated_by uuid references profiles(id),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- DOC_SEQUENCES (Document numbering with Indian FY)
-- ============================================================================
create table doc_sequences (
  prefix text not null,
  fy text not null,  -- Financial year: YYMM format (e.g., 2627 for Apr 2026 - Mar 2027)
  last_no int not null default 0,
  primary key (prefix, fy)
);

-- ============================================================================
-- CUSTOMERS
-- ============================================================================
create table customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone_e164 text not null check (phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  alt_phone_e164 text,
  email citext,
  customer_type customer_type not null default 'residential',
  business_name text,
  gstin text check (gstin is null or gstin ~ '^[0-9A-Z]{15}$'),
  billing_address text,
  billing_city text,
  billing_state text,
  billing_pincode text,
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  row_version int not null default 1
);

-- Unique phone (only active customers)
create unique index idx_customers_phone_unique on customers(phone_e164) where deleted_at is null;

-- Trigram indexes for fast search
create index idx_customers_name_trgm on customers using gin (name gin_trgm_ops);
create index idx_customers_phone_trgm on customers using gin (phone_e164 gin_trgm_ops);

-- ============================================================================
-- PRODUCT CATALOGUE
-- ============================================================================
create table products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  name text not null,
  category product_category not null,
  brand text,
  model text,
  uom text not null default 'nos',  -- unit of measure: nos, m, set, kw, hr, job
  is_serialised boolean not null default false,
  tracks_stock boolean not null default true,  -- false for services
  warranty_months int check (warranty_months is null or warranty_months > 0),
  hsn_code text,
  gst_rate_bp int not null default 1200 check (gst_rate_bp between 0 and 4000),  -- basis points (1200 = 12%)
  price_paise bigint not null default 0 check (price_paise >= 0),  -- selling price ex-GST
  is_dcr boolean not null default false,  -- Domestic Content Requirement (for subsidy)
  wattage_w int,  -- for panels
  capacity_kw numeric(5,2),  -- for inverters/batteries
  spec jsonb not null default '{}',
  reorder_level numeric(12,2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  row_version int not null default 1,
  check (not is_serialised or (tracks_stock and warranty_months is not null)),
  check (category <> 'panel' or wattage_w is not null)
);

create index idx_products_category on products(category) where is_active;
create index idx_products_sku_trgm on products using gin (sku gin_trgm_ops);
create index idx_products_name_trgm on products using gin (name gin_trgm_ops);

-- Cost segregation: separate table (restricted RLS)
create table product_costs (
  product_id uuid primary key references products(id),
  standard_cost_paise bigint not null default 0 check (standard_cost_paise >= 0),
  avg_cost_paise bigint not null default 0 check (avg_cost_paise >= 0),  -- weighted average
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- PACKAGE TEMPLATES (1-5 kW On-Grid/Off-Grid)
-- ============================================================================
create table package_templates (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,  -- ON-3KW, OFF-5KW
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
  qty_value numeric(10,3) not null default 1,
  min_qty numeric(10,2) not null default 0,
  rounding qty_rounding not null default 'ceil',
  when_roof_types roof_type[],  -- NULL = always; else only for these roof types
  is_required boolean not null default true,
  sort int not null default 100,
  notes text,
  unique (template_id, product_id)
);

-- ============================================================================
-- FAULT CODES (for service tickets)
-- ============================================================================
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

create index idx_fault_codes_brand on fault_codes(brand) where is_active;
