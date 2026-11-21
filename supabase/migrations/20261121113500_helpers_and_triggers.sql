-- Migration 0006: Helper Functions and Audit / Immutability Triggers
-- Solar Installation Management System

-- 1. Row touch trigger (updated_at + row_version)
create or replace function app.touch_row()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  if tg_op = 'UPDATE' and exists (
    select 1 from information_schema.columns 
    where table_name = tg_table_name and column_name = 'row_version'
  ) then
    new.row_version := coalesce(old.row_version, 0) + 1;
  end if;
  return new;
end $$;

-- 2. Document Number Generator (Gapless-per-transaction, Indian FY: Apr-Mar)
-- e.g. LD-2627-00001, PRJ-2627-00001, QT-2627-00001, ORD-2627-00001, DSP-2627-00001, TKT-2627-00001
create or replace function public.fn_next_doc_no(p_prefix text)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_now timestamp := (now() at time zone 'Asia/Kolkata');
  v_y int;
  v_fy text;
  v_n int;
begin
  v_y := case when extract(month from v_now) >= 4 
              then extract(year from v_now)::int 
              else extract(year from v_now)::int - 1 end;
  v_fy := lpad((v_y % 100)::text, 2, '0') || lpad(((v_y + 1) % 100)::text, 2, '0');
  
  insert into doc_sequences(prefix, fy, last_no)
  values (p_prefix, v_fy, 1)
  on conflict (prefix, fy) do update
  set last_no = doc_sequences.last_no + 1
  returning last_no into v_n;
  
  return p_prefix || '-' || v_fy || '-' || lpad(v_n::text, 5, '0');
end $$;

-- 3. Unified Audit & Status History Logger
create or replace function public.fn_log(
  p_actor uuid,
  p_entity text,
  p_id uuid,
  p_action text,
  p_from text default null,
  p_to text default null,
  p_reason text default null,
  p_before jsonb default null,
  p_after jsonb default null
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_from is distinct from p_to and p_to is not null then
    insert into status_history(entity_type, entity_id, from_status, to_status, actor_id, reason)
    values (p_entity, p_id, p_from, p_to, p_actor, p_reason);
  end if;
  
  insert into audit_log(actor_id, action, entity_type, entity_id, before, after, reason)
  values (p_actor, p_action, p_entity, p_id, p_before, p_after, p_reason);
end $$;

-- 4. Notification Helpers
create or replace function public.fn_notify(
  p_recipient uuid,
  p_type text,
  p_title text,
  p_body text default null,
  p_entity text default null,
  p_entity_id uuid default null,
  p_url text default null,
  p_severity text default 'info'
) returns void
language sql security definer set search_path = public as $$
  insert into notifications(recipient_id, type, title, body, entity_type, entity_id, url, severity)
  select p_recipient, p_type, p_title, p_body, p_entity, p_entity_id, p_url, p_severity
  where p_recipient is not null;
$$;

create or replace function public.fn_notify_roles(
  p_roles text[],
  p_type text,
  p_title text,
  p_body text default null,
  p_entity text default null,
  p_entity_id uuid default null,
  p_url text default null,
  p_severity text default 'info'
) returns void
language sql security definer set search_path = public as $$
  insert into notifications(recipient_id, type, title, body, entity_type, entity_id, url, severity)
  select p.id, p_type, p_title, p_body, p_entity, p_entity_id, p_url, p_severity
  from profiles p
  where p.is_active and p.deleted_at is null 
    and (p.role::text = any(p_roles) or p.role = 'director');
$$;

-- 5. Immutability Guard
create or replace function app.forbid_mutation()
returns trigger language plpgsql as $$
begin
  raise exception 'IMMUTABLE: % rows cannot be updated or deleted', tg_table_name;
end $$;

-- 6. Attach touch triggers
do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'settings', 'customers', 'products', 'package_templates',
    'leads', 'projects', 'jobs', 'surveys', 'quotes', 'orders',
    'stock_units', 'pick_lists', 'dispatches', 'assets', 'tickets',
    'install_reports', 'invoices', 'subsidy_applications'
  ] loop
    execute format('drop trigger if exists trg_touch on public.%I', t);
    execute format('create trigger trg_touch before update on public.%I for each row execute function app.touch_row()', t);
  end loop;
end $$;

-- 7. Attach immutability triggers
do $$
declare
  t text;
begin
  foreach t in array array[
    'audit_log', 'status_history', 'scan_events', 'stock_movements', 'lead_qualifications'
  ] loop
    execute format('drop trigger if exists trg_forbid_mutation on public.%I', t);
    execute format('create trigger trg_forbid_mutation before update or delete on public.%I for each row execute function app.forbid_mutation()', t);
  end loop;
end $$;
