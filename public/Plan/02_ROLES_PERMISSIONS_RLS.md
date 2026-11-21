# Part 2 — Roles, Permissions, Navigation & RLS

> Defence in depth: **(1)** middleware route guard → **(2)** server-action role check → **(3)** RLS on every table + `fn_assert_role` inside every state-changing function. All three must agree. This file is the single reference for who may do what.

---

## 1. Roles

| Role (`app_role`) | Description | Inherits |
|---|---|---|
| `director` | Owner. Everything, incl. settings, users, pay approval, profit | all manager permissions |
| `manager` | Ops/sales manager. Approvals (survey, discount, adjustments, cancellations), scheduling, overrides | — |
| `sales` | Telecallers & sales execs | — |
| `technician` | Field crew (survey, install, service visits) | — |
| `warehouse` | Store: receiving, picking, dispatch scanning | — |
| `support` | Service desk | — |
| `accounts` | Payments, invoices, subsidy tracker, purchases, technician pay | — |

- A user has **exactly one** role (`profiles.role`). A person who needs two jobs gets `manager` or `director`.
- `profiles.role IS NULL` ⇒ "pending": can authenticate, can see only `/pending-role`.
- Deactivated users (`is_active=false`) fail every check (`app.role()` returns NULL).

---

## 2. Capability matrix (single source: `src/lib/auth/permissions.ts`)

Legend: ✅ allowed · 🔸 only own records (assigned/owned) · — not allowed. **Director = ✅ on everything.**

| Capability key | sales | manager | technician | warehouse | support | accounts |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| `lead.create` | ✅ | ✅ | — | — | — | — |
| `lead.view` | ✅ (all) | ✅ | — | — | — | — |
| `lead.update` | 🔸 | ✅ | — | — | — | — |
| `lead.assign` | — | ✅ | — | — | — | — |
| `lead.close` (lost/disqualified/unreachable) | 🔸 | ✅ | — | — | — | — |
| `lead.qualify` (creates project) | 🔸 | ✅ | — | — | — | — |
| `survey.schedule` | ✅ | ✅ | — | — | — | — |
| `survey.submit` | — | ✅ | 🔸 | — | — | — |
| `survey.approve` / `survey.reject` | — | ✅ | — | — | — | — |
| `quote.create` | ✅ | ✅ | — | — | — | — |
| `quote.edit_draft` | 🔸 | ✅ | — | — | — | — |
| `quote.approve` (discount/margin) | — | ✅ | — | — | — | — |
| `quote.send` | 🔸 | ✅ | — | — | — | — |
| `quote.view` | ✅ | ✅ | — | — | — | ✅ |
| `quote.view_cost_margin` | — | ✅ | — | — | — | ✅ |
| `order.view` | ✅ | ✅ | — | — | ✅ (read) | ✅ |
| `order.cancel` | — | ✅ | — | — | — | — |
| `order.force_confirm` | — | ✅ | — | — | — | — |
| `payment.record` | — | ✅ | — | — | — | ✅ |
| `payment.reverse` | — | ✅ | — | — | — | — |
| `payment.view` | 🔸 (own orders) | ✅ | — | — | — | ✅ |
| `catalogue.edit` (products, templates, prices) | — | ✅ | — | — | — | — |
| `inventory.view` | ✅ (availability only) | ✅ | — | ✅ | — | ✅ |
| `inventory.receive` | — | ✅ | — | ✅ | — | — |
| `inventory.adjust.request` | — | ✅ | — | ✅ | — | — |
| `inventory.adjust.approve` | — | ✅ | — | — | — | — |
| `purchase.record` | — | ✅ | — | ✅ (receive) | — | ✅ |
| `picklist.work` | — | ✅ | — | ✅ | — | — |
| `dispatch.scan` / `dispatch.finalize` | — | ✅ | — | ✅ | — | — |
| `delivery.confirm` | — | ✅ | 🔸 | ✅ | — | — |
| `job.schedule` / `job.assign` | — | ✅ | — | — | ✅ (service jobs) | — |
| `job.view` | ✅ | ✅ | 🔸 | ✅ | ✅ | ✅ |
| `job.work` (start/stop timer, forms) | — | ✅ | 🔸 | — | — | — |
| `install.submit` | — | ✅ | 🔸 | — | — | — |
| `variation.approve` | — | ✅ | — | — | — | — |
| `asset.view` | ✅ | ✅ | 🔸 | ✅ | ✅ | ✅ |
| `asset.transfer` | — | ✅ | — | — | ✅ | — |
| `ticket.create` | ✅ | ✅ | — | — | ✅ | — |
| `ticket.work` (triage, assign, update, close) | — | ✅ | 🔸 (visit) | — | ✅ | — |
| `ticket.warranty_override` | — | ✅ | — | — | — | — |
| `invoice.view` | ✅ | ✅ | — | — | ✅ (service) | ✅ |
| `invoice.issue` | — | ✅ | — | — | — | ✅ |
| `invoice.void` | — | ✅ | — | — | — | — |
| `subsidy.view` | ✅ | ✅ | — | — | ✅ | ✅ |
| `subsidy.update` | — | ✅ | — | — | — | ✅ |
| `pay.manage` (build periods) | — | — | — | — | — | ✅ |
| `pay.approve` | — | — | — | — | — | — (director only) |
| `pay.view_own` | — | — | ✅ | — | — | — |
| `dashboard.view` | — | ✅ | — | — | — | ✅ (finance tabs) |
| `profit.view` | — | ✅ | — | — | — | ✅ |
| `share.create` / `share.revoke` | — | ✅ | — | — | — | — |
| `audit.view` | — | ✅ | — | — | — | — |
| `settings.edit` | — | — | — | — | — | — (director only) |
| `users.manage` | — | — | — | — | — | — (director only) |

### 2.1 Code form
```ts
// src/lib/auth/permissions.ts
export const ROLES = ["director","manager","sales","technician","warehouse","support","accounts"] as const;
export type AppRole = typeof ROLES[number];

/** Roles allowed per capability. `director` is implicitly added by `rolesFor`. */
const MATRIX = {
  "lead.create": ["sales","manager"],
  "lead.view": ["sales","manager"],
  "lead.update": ["sales","manager"],          // sales: own only (checked in RPC)
  "lead.assign": ["manager"],
  "lead.close": ["sales","manager"],
  "lead.qualify": ["sales","manager"],
  "survey.schedule": ["sales","manager"],
  "survey.submit": ["technician","manager"],
  "survey.review": ["manager"],
  "quote.create": ["sales","manager"],
  "quote.edit_draft": ["sales","manager"],
  "quote.approve": ["manager"],
  "quote.send": ["sales","manager"],
  "quote.view": ["sales","manager","accounts"],
  "quote.view_cost_margin": ["manager","accounts"],
  "order.view": ["sales","manager","support","accounts"],
  "order.cancel": ["manager"],
  "order.force_confirm": ["manager"],
  "payment.record": ["accounts","manager"],
  "payment.reverse": ["manager"],
  "payment.view": ["sales","manager","accounts"],
  "catalogue.edit": ["manager"],
  "inventory.view": ["sales","manager","warehouse","accounts"],
  "inventory.receive": ["warehouse","manager"],
  "inventory.adjust.request": ["warehouse","manager"],
  "inventory.adjust.approve": ["manager"],
  "purchase.record": ["warehouse","accounts","manager"],
  "picklist.work": ["warehouse","manager"],
  "dispatch.scan": ["warehouse","manager"],
  "delivery.confirm": ["warehouse","technician","manager"],
  "job.schedule": ["manager","support"],
  "job.view": ["sales","manager","technician","warehouse","support","accounts"],
  "job.work": ["technician","manager"],
  "install.submit": ["technician","manager"],
  "variation.approve": ["manager"],
  "asset.view": ["sales","manager","technician","warehouse","support","accounts"],
  "asset.transfer": ["support","manager"],
  "ticket.create": ["sales","support","manager"],
  "ticket.work": ["support","technician","manager"],
  "ticket.warranty_override": ["manager"],
  "invoice.view": ["sales","manager","support","accounts"],
  "invoice.issue": ["accounts","manager"],
  "invoice.void": ["manager"],
  "subsidy.view": ["sales","manager","support","accounts"],
  "subsidy.update": ["accounts","manager"],
  "pay.manage": ["accounts"],
  "pay.approve": [],                         // director only
  "pay.view_own": ["technician"],
  "dashboard.view": ["manager","accounts"],
  "profit.view": ["manager","accounts"],
  "share.manage": ["manager"],
  "audit.view": ["manager"],
  "settings.edit": [],                       // director only
  "users.manage": [],                        // director only
} as const satisfies Record<string, readonly Exclude<AppRole,"director">[]>;

export type Capability = keyof typeof MATRIX;
export const rolesFor = (c: Capability): AppRole[] => ["director", ...MATRIX[c]] as AppRole[];
export const can = (role: AppRole | null | undefined, c: Capability) =>
  !!role && (role === "director" || (MATRIX[c] as readonly string[]).includes(role));
```
**Rules for agents:** (a) every `defineAction` uses `roles: rolesFor("<capability>")` — never a hand-written array; (b) UI hides controls with `<RoleGate can="quote.create">`; (c) a pgTAP/vitest test asserts the SQL `fn_assert_role` arrays equal this matrix (generate the SQL role arrays from this file via a script `scripts/gen-role-sql.ts` if time permits; otherwise keep in sync manually and test).

### 2.2 "Own records" semantics (🔸)
Enforced **inside the RPC**, not only in UI.
- `lead.update/close/qualify` (sales): `leads.owner_id = actor` else `NOT_OWNER`. Manager bypass.
- `quote.edit_draft/send` (sales): `quotes.created_by = actor OR project.sales_owner_id = actor`.
- `survey.submit` / `job.work` / `install.submit` (technician): actor ∈ `job_crew` for that job else `NOT_ASSIGNED`.
- `delivery.confirm` (technician): only for jobs they are assigned to (they may confirm delivery on site when they are the receiver).
- `ticket.work` (technician): only the service job they are assigned to; can add notes/parts used/labour and mark "work done"; cannot close the ticket (customer confirmation by support).

---

## 3. Navigation per role (what the sidebar shows)

| Role | Home | Sidebar |
|---|---|---|
| director | `/dashboard` | Dashboard · Approvals · Leads · Projects · Quotes · Orders · Payments · Inventory · Warehouse · Schedule · Service · Invoices · Subsidy · Finance (Pay, Purchases) · Reports (share) · Audit · Settings |
| manager | `/dashboard` | Dashboard · Approvals · Leads · Projects · Quotes · Orders · Inventory · Warehouse · Schedule · Service · Invoices · Subsidy · Reports |
| sales | `/leads` | Leads · Projects (mine) · Quotes · Orders (read) · Notifications |
| technician | `/field` | My Jobs (schedule) · My Pay (read) · Notifications (mobile bottom-nav, no sidebar) |
| warehouse | `/warehouse/picklists` | Pick-lists · Dispatch · Receive stock · Stock · Movements · Notifications |
| support | `/service` | Search · Tickets · Assets · Schedule (service jobs) · Invoices (service) · Notifications |
| accounts | `/payments` | Payments · Invoices · Subsidy · Pay · Purchases · Quotes (read) · Profit (read) · Notifications |

Mobile: technician layout is a **bottom tab bar** (Jobs · Sync · Profile). Warehouse dispatch screen is optimised for a handheld/phone camera.

---

## 4. Data visibility rules (what each role may `SELECT`)

All writes are denied to `authenticated` and `anon` at the table level. Writes happen only through service-role RPCs.

### 4.1 Plain role-gated tables
| Table | Roles that may SELECT |
|---|---|
| `settings` | any authenticated active role (non-secret keys only) |
| `profiles` | any authenticated active role (no pay rates here) |
| `products`, `package_templates`, `package_template_items`, `fault_codes` | any authenticated active role |
| `product_costs` | manager, accounts, director |
| `customers` | sales, manager, support, accounts, warehouse (+ technician row-scoped §4.2) |
| `leads`, `lead_activities`, `lead_qualifications` | sales, manager |
| `projects` | sales, manager, support, accounts, warehouse (+ technician row-scoped) |
| `surveys` | sales, manager (+ technician row-scoped) |
| `jobs`, `job_crew` | sales, manager, support, accounts, warehouse (+ technician row-scoped) |
| `quotes`, `quote_lines` | sales, manager, accounts |
| `quote_line_costs` | manager, accounts |
| `orders`, `order_lines` | sales, manager, support, accounts |
| `payments`, `payment_allocations` | sales, manager, accounts |
| `invoices`, `invoice_lines` | sales, manager, support, accounts |
| `pick_lists`, `pick_list_lines` | warehouse, manager (carry denormalised customer name/address/order no — **no money fields**) |
| `dispatches`, `dispatch_items`, `scan_events` | warehouse, manager, support, accounts |
| `stock_units`, `bulk_stock`, `stock_movements`, `purchases`, `purchase_lines`, `suppliers` | warehouse, manager, accounts |
| `stock_unit_costs`, `purchase_line_costs` | manager, accounts |
| `assets` | sales, manager, support, accounts, warehouse (+ technician row-scoped) |
| `tickets`, `ticket_events`, `ticket_parts`, `ticket_labour` | sales (read), manager, support, accounts (+ technician row-scoped to their service job) |
| `install_reports`, `job_photos`, `job_materials`, `time_entries` | manager, accounts(read), support (read), (+ technician row-scoped to own jobs; time_entries: own only) |
| `variations` | manager, accounts, sales (read) |
| `subsidy_applications`, `subsidy_checklist_items` | sales, manager, support, accounts |
| `project_costs` | manager, accounts |
| `pay_periods`, `pay_entries`, `technician_rates` | accounts (director/manager excluded except director) |
| `share_links` | manager |
| `audit_log` | manager |
| `status_history` | sales, manager, support, accounts, warehouse |
| `notifications` | **recipient only** (`recipient_id = app.profile_id()`) |
| `idempotency_keys`, `rate_limits`, `action_failures`, `domain_events` | none (service role only) |

### 4.2 Technician row-scoping (the only role with row-level scoping on reads)
A technician can read:
- `jobs` where they are in `job_crew`;
- the `projects`, `customers`, `surveys`, `install_reports`, `job_photos`, `job_materials`, `assets` and `tickets` that hang off those jobs;
- their own `time_entries`;
- the **BOM without prices** through `fn_job_bom(job_id)` (SECURITY DEFINER, checks assignment, returns `product_name, sku, qty, serial_numbers`) — they never read `order_lines`/`quote_lines`.

### 4.3 Cost segregation (REQ-QUOTE-12, REQ-PLAT-01)
Money that reveals *margin* lives in separate tables so a policy mistake on a business table cannot leak cost:
`product_costs`, `quote_line_costs`, `stock_unit_costs`, `purchase_line_costs`, `project_costs`, `technician_rates`, `pay_*`.
Only `manager`, `accounts`, `director` can read the cost tables (pay tables: `accounts`, `director`).

### 4.4 Warehouse never sees payments
`warehouse` has no SELECT on `orders, order_lines, payments, quotes, invoices`. Their screens use `pick_lists` (denormalised, no money) and `fn_warehouse_order_summary(order_id)` (SECURITY DEFINER, returns items+qty+address+contact, and the boolean `dispatch_allowed` + `block_reason` **without amounts**).

### 4.5 Sales sees availability, not stock detail
`fn_stock_availability(product_ids uuid[])` (SECURITY DEFINER) returns `{product_id, available, is_serialised}` only.

---

## 5. SQL: helper functions (migration `0003_auth_helpers.sql`)

```sql
create schema if not exists app;
revoke all on schema app from public, anon;
grant usage on schema app to authenticated, service_role;

-- Current Clerk user id from the verified JWT
create or replace function app.clerk_id() returns text
language sql stable as $$ select nullif(auth.jwt() ->> 'sub', '') $$;

create or replace function app.profile_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from public.profiles
  where clerk_user_id = app.clerk_id() and is_active and deleted_at is null limit 1
$$;

create or replace function app.role() returns text
language sql stable security definer set search_path = public as $$
  select role::text from public.profiles
  where clerk_user_id = app.clerk_id() and is_active and deleted_at is null limit 1
$$;

-- director is implicitly allowed everywhere
create or replace function app.has_role(variadic roles text[]) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(app.role() = 'director' or app.role() = any(roles), false)
$$;

-- technician scoping helpers
create or replace function app.is_my_job(p_job uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.job_crew jc
                 where jc.job_id = p_job and jc.profile_id = app.profile_id())
$$;

create or replace function app.is_my_project(p_project uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.jobs j
                 join public.job_crew jc on jc.job_id = j.id
                 where j.project_id = p_project and jc.profile_id = app.profile_id())
$$;

create or replace function app.is_my_customer(p_customer uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.projects p
                 where p.customer_id = p_customer and app.is_my_project(p.id))
$$;

-- Used inside every state-changing fn_* (service-role calls have no JWT, so actor is explicit)
create or replace function public.fn_assert_role(p_actor uuid, p_roles text[])
returns void language plpgsql stable security definer set search_path = public as $$
declare v_role text;
begin
  select role::text into v_role from public.profiles
   where id = p_actor and is_active and deleted_at is null;
  if v_role is null then raise exception 'UNAUTHENTICATED: Unknown or inactive user'; end if;
  if v_role <> 'director' and not (v_role = any(p_roles)) then
    raise exception 'FORBIDDEN: Role % cannot perform this action', v_role;
  end if;
end $$;
revoke all on function public.fn_assert_role(uuid, text[]) from public, anon, authenticated;
grant execute on function public.fn_assert_role(uuid, text[]) to service_role;
```

---

## 6. SQL: RLS (migration `0004_rls.sql`)

### 6.1 Global lock-down
```sql
-- No writes from API roles, ever.
revoke insert, update, delete, truncate on all tables in schema public from anon, authenticated;
revoke all on all tables in schema public from anon;
alter default privileges in schema public revoke insert, update, delete on tables from anon, authenticated;
alter default privileges in schema public revoke all on tables from anon;
-- Functions are service-role only unless explicitly granted
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;
```

### 6.2 Role-gated SELECT policies (generated loop)
```sql
do $$
declare r record;
begin
  for r in
    select * from (values
      ('settings',                   array['sales','manager','technician','warehouse','support','accounts']),
      ('profiles',                   array['sales','manager','technician','warehouse','support','accounts']),
      ('products',                   array['sales','manager','technician','warehouse','support','accounts']),
      ('package_templates',          array['sales','manager','technician','warehouse','support','accounts']),
      ('package_template_items',     array['sales','manager','technician','warehouse','support','accounts']),
      ('fault_codes',                array['sales','manager','technician','warehouse','support','accounts']),
      ('product_costs',              array['manager','accounts']),
      ('leads',                      array['sales','manager']),
      ('lead_activities',            array['sales','manager']),
      ('lead_qualifications',        array['sales','manager']),
      ('quotes',                     array['sales','manager','accounts']),
      ('quote_lines',                array['sales','manager','accounts']),
      ('quote_line_costs',           array['manager','accounts']),
      ('orders',                     array['sales','manager','support','accounts']),
      ('order_lines',                array['sales','manager','support','accounts']),
      ('payments',                   array['sales','manager','accounts']),
      ('payment_allocations',        array['manager','accounts']),
      ('invoices',                   array['sales','manager','support','accounts']),
      ('invoice_lines',              array['sales','manager','support','accounts']),
      ('pick_lists',                 array['warehouse','manager']),
      ('pick_list_lines',            array['warehouse','manager']),
      ('dispatches',                 array['warehouse','manager','support','accounts']),
      ('dispatch_items',             array['warehouse','manager','support','accounts']),
      ('scan_events',                array['warehouse','manager','support','accounts']),
      ('stock_units',                array['warehouse','manager','accounts']),
      ('bulk_stock',                 array['warehouse','manager','accounts']),
      ('stock_movements',            array['warehouse','manager','accounts']),
      ('suppliers',                  array['warehouse','manager','accounts']),
      ('purchases',                  array['warehouse','manager','accounts']),
      ('purchase_lines',             array['warehouse','manager','accounts']),
      ('stock_unit_costs',           array['manager','accounts']),
      ('purchase_line_costs',        array['manager','accounts']),
      ('stock_adjustments',          array['warehouse','manager','accounts']),
      ('variations',                 array['sales','manager','accounts']),
      ('subsidy_applications',       array['sales','manager','support','accounts']),
      ('subsidy_checklist_items',    array['sales','manager','support','accounts']),
      ('project_costs',              array['manager','accounts']),
      ('technician_rates',           array['accounts']),
      ('pay_periods',                array['accounts']),
      ('pay_entries',                array['accounts']),
      ('share_links',                array['manager']),
      ('audit_log',                  array['manager']),
      ('status_history',             array['sales','manager','support','accounts','warehouse'])
    ) as t(tbl, roles)
  loop
    execute format('alter table public.%I enable row level security', r.tbl);
    execute format('drop policy if exists %I on public.%I', r.tbl || '_select', r.tbl);
    execute format(
      'create policy %I on public.%I for select to authenticated using (app.has_role(variadic %L::text[]))',
      r.tbl || '_select', r.tbl, r.roles);
  end loop;
end $$;
```

### 6.3 Row-scoped tables (technician + broader roles)
```sql
-- customers
alter table public.customers enable row level security;
create policy customers_select on public.customers for select to authenticated using (
  app.has_role('sales','manager','support','accounts','warehouse')
  or (app.role() = 'technician' and app.is_my_customer(id))
);

-- projects
alter table public.projects enable row level security;
create policy projects_select on public.projects for select to authenticated using (
  app.has_role('sales','manager','support','accounts','warehouse')
  or (app.role() = 'technician' and app.is_my_project(id))
);

-- surveys
alter table public.surveys enable row level security;
create policy surveys_select on public.surveys for select to authenticated using (
  app.has_role('sales','manager')
  or (app.role() = 'technician' and app.is_my_job(job_id))
);

-- jobs
alter table public.jobs enable row level security;
create policy jobs_select on public.jobs for select to authenticated using (
  app.has_role('sales','manager','support','accounts','warehouse')
  or (app.role() = 'technician' and app.is_my_job(id))
);

-- job_crew
alter table public.job_crew enable row level security;
create policy job_crew_select on public.job_crew for select to authenticated using (
  app.has_role('sales','manager','support','accounts','warehouse')
  or (app.role() = 'technician' and profile_id = app.profile_id())
);

-- install_reports, job_photos, job_materials
do $$ declare t text; begin
  foreach t in array array['install_reports','job_photos','job_materials'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format($f$create policy %I on public.%I for select to authenticated using (
      app.has_role('manager','accounts','support')
      or (app.role() = 'technician' and app.is_my_job(job_id)))$f$, t||'_select', t);
  end loop;
end $$;

-- time_entries: own only (+ manager/accounts)
alter table public.time_entries enable row level security;
create policy time_entries_select on public.time_entries for select to authenticated using (
  app.has_role('manager','accounts') or profile_id = app.profile_id()
);

-- assets
alter table public.assets enable row level security;
create policy assets_select on public.assets for select to authenticated using (
  app.has_role('sales','manager','support','accounts','warehouse')
  or (app.role() = 'technician' and app.is_my_project(project_id))
);

-- tickets & children
alter table public.tickets enable row level security;
create policy tickets_select on public.tickets for select to authenticated using (
  app.has_role('sales','manager','support','accounts')
  or (app.role() = 'technician' and exists (
        select 1 from public.jobs j where j.ticket_id = tickets.id and app.is_my_job(j.id)))
);
do $$ declare t text; begin
  foreach t in array array['ticket_events','ticket_parts','ticket_labour'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format($f$create policy %I on public.%I for select to authenticated using (
      app.has_role('sales','manager','support','accounts')
      or (app.role() = 'technician' and exists (
            select 1 from public.jobs j where j.ticket_id = %I.ticket_id and app.is_my_job(j.id))))$f$,
      t||'_select', t, t);
  end loop;
end $$;

-- notifications: recipient only
alter table public.notifications enable row level security;
create policy notifications_select on public.notifications for select to authenticated using (
  recipient_id = app.profile_id()
);
-- (Marking as read goes through fn_mark_notifications_read(p_actor, ids[]))

-- tables with RLS but NO policies (service role only)
alter table public.idempotency_keys enable row level security;
alter table public.rate_limits enable row level security;
alter table public.action_failures enable row level security;
alter table public.domain_events enable row level security;
alter table public.doc_sequences enable row level security;
```

### 6.4 Realtime publication
```sql
alter publication supabase_realtime add table
  public.notifications, public.pick_lists, public.tickets, public.jobs, public.payments;
-- Realtime applies the SELECT policies above; payments events reach only sales/manager/accounts/director.
```

### 6.5 SECURITY DEFINER read helpers (return only whitelisted columns)
| Function | Callable by | Returns |
|---|---|---|
| `fn_job_bom(p_job uuid)` | technician (assigned), manager, support | `[{sku, name, category, qty, is_serialised, serials[]}]` — **no prices** |
| `fn_warehouse_order_summary(p_order uuid)` | warehouse, manager | items+qty, address, contact, `dispatch_allowed`, `block_reason` — **no amounts** |
| `fn_stock_availability(p_products uuid[])` | sales, manager, accounts, warehouse | `[{product_id, available, is_serialised}]` |
| `fn_my_pay(p_actor uuid)` | technician | own hours and approved pay totals |
| `fn_search_support(p_q text)` | support, manager, sales | unified search over customers/phones/serials/tickets (see file 06 §7) |
| `fn_dashboard(p_range text, p_from, p_to)` | manager, accounts, director | dashboard JSON (file 06 §10) |

These are granted `EXECUTE` to `authenticated` **and** self-check role via `app.has_role` (when called with a user JWT) — or are called by service role with `p_actor` and call `fn_assert_role`. Pick one calling style per function and document it in the function comment; the default is **service-role + p_actor** called from server code.

---

## 7. Public (token) access — design

Customers and external viewers have no login. Each public surface is guarded by an **unguessable token** stored only as a hash.

```
share_links(id, kind, entity_id, token_hash, expires_at, revoked_at, redact_pii, params jsonb,
            created_by, created_at, access_count, last_access_at, last_ip_hash)
kind ∈ ('quote','tracker','asset','report','delivery','signature')
```

| Kind | Route | Created when | Default expiry | Exposes (whitelist) | Allowed actions |
|---|---|---|---|---|---|
| `quote` | `/q/[token]` | quote `sent` | quote `valid_until` + 3 d | customer first name, quote lines (name, qty, unit price, GST, amount), totals, subsidy box, validity, company contact | Accept, Reject (with reason), request changes |
| `tracker` | `/track/[token]` | project created | 12 months | stage timeline with dates, next step text, assigned crew first name only, install date; **no money** | none |
| `asset` | `/a/[token]` | asset created | none (revocable) | product name, brand, serial, install date, warranty start/end/status, service contact, masked owner name | "Report a problem" form (creates ticket via rate-limited public RPC) |
| `report` | `/r/[token]` | director shares | 7 d (setting) | dashboard figures for a fixed period snapshot; if `redact_pii` → customer names initials only, no phone/address | none |
| `delivery` | `/d/[token]` | dispatch `in_transit` | 14 d | list of items to be delivered (no money) | Customer enters OTP / confirms receipt |
| `signature` | `/sign/[token]` | install job `awaiting_signature` | 7 d | install summary (size, date, photos thumbnails) | Sign on screen (canvas), or refuse with reason |

Every public RPC: `fn_public_*(p_token text, …)` → hashes token → loads `share_links` row → checks `revoked_at is null and (expires_at is null or expires_at > now())` → increments `access_count` → returns a **fixed-shape jsonb**. Error (generic, no oracle): `LINK_INVALID: This link is invalid or has expired.` Per-IP rate limiting `fn_rate_limit('pub:'||ip_hash, 60, '1 minute')`.

Token generation (TS): `crypto.randomBytes(32).toString('base64url')`; `hash = sha256(token + TOKEN_PEPPER)`; the raw token is shown/sent **once** (stored nowhere). Re-sending a link = revoke old + create new.

---

## 8. Audit & status history (applies to all roles)

- Every `fn_*` state change inserts `status_history(entity_type, entity_id, from_status, to_status, actor_id, reason, at)` and `audit_log(actor_id, action, entity_type, entity_id, before, after, at)`.
- `audit_log` and `status_history` are append-only: a trigger raises on `UPDATE`/`DELETE`; no policies grant writes.
- Reading cost data via director/manager UI is not logged; creating/revoking share links, role changes, price changes, stock adjustments, payment reversals, warranty overrides, force-confirm, order cancellations **are** logged with a mandatory `reason` where specified.

---

## 9. RLS test cases (pgTAP; must pass)

```sql
begin;
select plan(8);
-- helper: impersonate a Clerk user: set_config('request.jwt.claims', '{"sub":"user_tech1","role":"authenticated"}', true);
-- seed: tech1 assigned to job J1; tech2 assigned to J2

select set_config('request.jwt.claims','{"sub":"user_tech1","role":"authenticated"}', true);
set local role authenticated;

select is((select count(*) from jobs), 1::bigint, 'technician sees only assigned jobs');
select is((select count(*) from quote_line_costs), 0::bigint, 'technician cannot read cost table');
select is((select count(*) from payments), 0::bigint, 'technician cannot read payments');
select is((select count(*) from customers), 1::bigint, 'technician sees only own job customers');
select throws_ok($$insert into leads(name,phone_e164) values ('x','+910000000000')$$, '42501', null, 'no direct writes');

select set_config('request.jwt.claims','{"sub":"user_wh1","role":"authenticated"}', true);
select is((select count(*) from orders), 0::bigint, 'warehouse cannot read orders');
select is((select count(*) from payments), 0::bigint, 'warehouse cannot read payments');
select ok((select count(*) from pick_lists) > 0, 'warehouse reads pick lists');
select * from finish();
rollback;
```
Plus a generic test: `select tablename from pg_tables where schemaname='public' and not rowsecurity` must return 0 rows.

---

## 10. UI rules tied to permissions
- `<RoleGate can="…">` hides, never merely disables, controls the user may never use; use *disabled + tooltip with reason* only for **gates** (e.g. "Quote locked — survey not approved").
- Cost/margin components (`<CostColumn>`, `<MarginBadge>`) render only when `can(role,'quote.view_cost_margin')`; the server query also omits the data (never rely on CSS hiding).
- Technician UI never renders any ₹ amount except their own pay.
- Shared report page uses the same components with `redactPii` prop = true.
