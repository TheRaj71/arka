-- Migration 0007: Auth Helpers and Row Level Security (RLS)
-- Solar Installation Management System

-- 1. App schema permissions
revoke all on schema app from public, anon;
grant usage on schema app to authenticated, service_role;

-- 2. Current Clerk user id from JWT
create or replace function app.clerk_id() returns text
language sql stable as $$ select nullif(auth.jwt() ->> 'sub', '') $$;

-- 3. Current user profile id
create or replace function app.profile_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from public.profiles
  where clerk_user_id = app.clerk_id() and is_active and deleted_at is null limit 1
$$;

-- 4. Current user role
create or replace function app.role() returns text
language sql stable security definer set search_path = public as $$
  select role::text from public.profiles
  where clerk_user_id = app.clerk_id() and is_active and deleted_at is null limit 1
$$;

-- 5. Role check (director is implicitly allowed everywhere)
create or replace function app.has_role(variadic roles text[]) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(app.role() = 'director' or app.role() = any(roles), false)
$$;

-- 6. Technician row scoping helpers
create or replace function app.is_my_job(p_job uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.job_crew jc
    where jc.job_id = p_job and jc.profile_id = app.profile_id()
  )
$$;

create or replace function app.is_my_project(p_project uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.jobs j
    join public.job_crew jc on jc.job_id = j.id
    where j.project_id = p_project and jc.profile_id = app.profile_id()
  )
$$;

create or replace function app.is_my_customer(p_customer uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.projects p
    where p.customer_id = p_customer and app.is_my_project(p.id)
  )
$$;

-- 7. State-changing authorization assert (called inside all fn_* RPCs)
create or replace function public.fn_assert_role(p_actor uuid, p_roles text[])
returns void language plpgsql stable security definer set search_path = public as $$
declare
  v_role text;
begin
  select role::text into v_role from public.profiles
  where id = p_actor and is_active and deleted_at is null;
  
  if v_role is null then
    raise exception 'UNAUTHENTICATED: Unknown or inactive user';
  end if;
  
  if v_role <> 'director' and not (v_role = any(p_roles)) then
    raise exception 'FORBIDDEN: Role % cannot perform this action', v_role;
  end if;
end $$;

revoke all on function public.fn_assert_role(uuid, text[]) from public, anon, authenticated;
grant execute on function public.fn_assert_role(uuid, text[]) to service_role;

-- 8. Global Lockdown
revoke insert, update, delete, truncate on all tables in schema public from anon, authenticated;
revoke all on all tables in schema public from anon;
alter default privileges in schema public revoke insert, update, delete on tables from anon, authenticated;
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

-- 9. Role-gated SELECT policies
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
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = r.tbl) then
      execute format('alter table public.%I enable row level security', r.tbl);
      execute format('drop policy if exists %I on public.%I', r.tbl || '_select', r.tbl);
      execute format(
        'create policy %I on public.%I for select to authenticated using (app.has_role(variadic %L::text[]))',
        r.tbl || '_select', r.tbl, r.roles);
    end if;
  end loop;
end $$;

-- 10. Row-scoped tables
-- customers
alter table public.customers enable row level security;
drop policy if exists customers_select on public.customers;
create policy customers_select on public.customers for select to authenticated using (
  app.has_role('sales','manager','support','accounts','warehouse')
  or (app.role() = 'technician' and app.is_my_customer(id))
);

-- projects
alter table public.projects enable row level security;
drop policy if exists projects_select on public.projects;
create policy projects_select on public.projects for select to authenticated using (
  app.has_role('sales','manager','support','accounts','warehouse')
  or (app.role() = 'technician' and app.is_my_project(id))
);

-- surveys
alter table public.surveys enable row level security;
drop policy if exists surveys_select on public.surveys;
create policy surveys_select on public.surveys for select to authenticated using (
  app.has_role('sales','manager')
  or (app.role() = 'technician' and app.is_my_job(job_id))
);

-- jobs
alter table public.jobs enable row level security;
drop policy if exists jobs_select on public.jobs;
create policy jobs_select on public.jobs for select to authenticated using (
  app.has_role('sales','manager','support','accounts','warehouse')
  or (app.role() = 'technician' and app.is_my_job(id))
);

-- job_crew
alter table public.job_crew enable row level security;
drop policy if exists job_crew_select on public.job_crew;
create policy job_crew_select on public.job_crew for select to authenticated using (
  app.has_role('sales','manager','support','accounts','warehouse')
  or (app.role() = 'technician' and profile_id = app.profile_id())
);

-- install_reports, job_photos, job_materials
do $$ declare t text; begin
  foreach t in array array['install_reports','job_photos','job_materials'] loop
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = t) then
      execute format('alter table public.%I enable row level security', t);
      execute format('drop policy if exists %I on public.%I', t || '_select', t);
      execute format($f$create policy %I on public.%I for select to authenticated using (
        app.has_role('manager','accounts','support')
        or (app.role() = 'technician' and app.is_my_job(job_id)))$f$, t||'_select', t);
    end if;
  end loop;
end $$;

-- time_entries: own only (+ manager/accounts)
alter table public.time_entries enable row level security;
drop policy if exists time_entries_select on public.time_entries;
create policy time_entries_select on public.time_entries for select to authenticated using (
  app.has_role('manager','accounts') or profile_id = app.profile_id()
);

-- assets
alter table public.assets enable row level security;
drop policy if exists assets_select on public.assets;
create policy assets_select on public.assets for select to authenticated using (
  app.has_role('sales','manager','support','accounts','warehouse')
  or (app.role() = 'technician' and app.is_my_project(project_id))
);

-- tickets & children
alter table public.tickets enable row level security;
drop policy if exists tickets_select on public.tickets;
create policy tickets_select on public.tickets for select to authenticated using (
  app.has_role('sales','manager','support','accounts')
  or (app.role() = 'technician' and exists (
        select 1 from public.jobs j where j.ticket_id = tickets.id and app.is_my_job(j.id)))
);

do $$ declare t text; begin
  foreach t in array array['ticket_events','ticket_parts','ticket_labour'] loop
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = t) then
      execute format('alter table public.%I enable row level security', t);
      execute format('drop policy if exists %I on public.%I', t || '_select', t);
      execute format($f$create policy %I on public.%I for select to authenticated using (
        app.has_role('sales','manager','support','accounts')
        or (app.role() = 'technician' and exists (
              select 1 from public.jobs j where j.ticket_id = %I.ticket_id and app.is_my_job(j.id))))$f$,
        t||'_select', t, t);
    end if;
  end loop;
end $$;

-- notifications: recipient only
alter table public.notifications enable row level security;
drop policy if exists notifications_select on public.notifications;
create policy notifications_select on public.notifications for select to authenticated using (
  recipient_id = app.profile_id()
);

-- Tables with RLS but no policies (accessible only by service role)
do $$ declare t text; begin
  foreach t in array array['idempotency_keys','rate_limits','doc_sequences'] loop
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = t) then
      execute format('alter table public.%I enable row level security', t);
    end if;
  end loop;
end $$;
