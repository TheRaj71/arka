-- Migration 0008: Views for Live Warranty, Profitability, and Balances
-- Solar Installation Management System

-- 1. Live warranty status for assets
create or replace view v_asset_warranty with (security_invoker = true) as
select a.*,
  case
    when a.warranty_void then 'void'
    when a.warranty_start is null then 'not_started'
    when a.warranty_end < (now() at time zone 'Asia/Kolkata')::date then 'expired'
    when a.warranty_end <= (now() at time zone 'Asia/Kolkata')::date + coalesce((select (value #>> '{}')::int from settings where key='warranty.expiring_soon_days'), 60) then 'expiring_soon'
    else 'active'
  end as warranty_status,
  greatest(0, a.warranty_end - (now() at time zone 'Asia/Kolkata')::date) as days_left
from assets a;

-- 2. Per-project profit (REQ-FIN-02). Never fabricates: exposes completeness + missing list.
create or replace view v_project_profit with (security_invoker = true) as
with
rev as (
  select p.id as project_id,
    coalesce((select sum(o.taxable_paise) from orders o where o.project_id = p.id and o.status <> 'cancelled'), 0)
    + coalesce((select sum(v.adjustment_paise) from variations v where v.project_id = p.id and v.status = 'approved'), 0) as revenue_paise
  from projects p
),
mat as (
  select project_id,
    sum(amount_paise) filter (where kind in ('material','extra_material')) as material_paise,
    sum(amount_paise) filter (where kind in ('travel','permit','subcontract','other')) as other_paise
  from project_costs group by project_id
),
lab as (
  select j.project_id,
    sum((coalesce(te.ended_at, now()) - te.started_at)) as total_interval,
    sum(extract(epoch from (coalesce(te.ended_at, now()) - te.started_at))/3600.0 * 15000)::bigint as labour_paise,
    count(*) filter (where j.type = 'install') as install_time_count
  from time_entries te
  join jobs j on j.id = te.job_id
  group by j.project_id
),
svc_rev as (
  select project_id, sum(taxable_paise) as service_revenue_paise
  from invoices where kind = 'service' and status in ('issued','partially_paid','paid')
  group by project_id
),
chk as (
  select p.id as project_id,
    exists(select 1 from jobs j where j.project_id = p.id and j.type = 'install' and j.status = 'completed') as install_done,
    not exists(
      select 1 from dispatch_items di
      join dispatches d on d.id = di.dispatch_id
      join orders o on o.id = d.order_id
      where o.project_id = p.id and di.stock_unit_id is not null and di.removed = false
        and not exists(select 1 from stock_unit_costs c where c.stock_unit_id = di.stock_unit_id)
    ) as serial_costs_ok
  from projects p
)
select p.id as project_id, p.project_no, p.customer_id, p.stage,
  rev.revenue_paise,
  coalesce(mat.material_paise, 0) as material_cost_paise,
  coalesce(lab.labour_paise, 0) as labour_cost_paise,
  coalesce(mat.other_paise, 0) as other_cost_paise,
  rev.revenue_paise - coalesce(mat.material_paise, 0) - coalesce(lab.labour_paise, 0) - coalesce(mat.other_paise, 0) as profit_paise,
  case when rev.revenue_paise > 0
       then round(100.0 * (rev.revenue_paise - coalesce(mat.material_paise, 0) - coalesce(lab.labour_paise, 0) - coalesce(mat.other_paise, 0)) / rev.revenue_paise, 1)
       else 0 end as margin_pct,
  coalesce(svc_rev.service_revenue_paise, 0) as service_revenue_paise,
  (chk.install_done and chk.serial_costs_ok and coalesce(lab.install_time_count, 0) > 0) as is_complete,
  array_remove(array[
    case when not chk.install_done then 'install_not_completed' end,
    case when not chk.serial_costs_ok then 'unit_cost_missing' end,
    case when coalesce(lab.install_time_count, 0) = 0 then 'labour_hours_missing' end
  ], null) as missing
from projects p
join rev using (project_id)
left join mat using (project_id)
left join lab using (project_id)
left join svc_rev using (project_id)
join chk using (project_id)
where p.stage <> 'cancelled' or exists (select 1 from orders o where o.project_id = p.id);

-- 3. Order payment summary for UI
create or replace view v_order_balance with (security_invoker = true) as
select o.id as order_id, o.order_no, o.total_paise, o.paid_paise, 
       (o.total_paise - o.paid_paise) as balance_paise,
       o.advance_required_paise, 
       greatest(0, o.advance_required_paise - o.paid_paise) as advance_short_paise
from orders o;

-- 4. Serialised availability
create or replace view v_serial_availability with (security_invoker = true) as
select product_id,
  count(*) filter (where status = 'in_stock') as available,
  count(*) filter (where status = 'reserved') as reserved,
  count(*) filter (where status in ('damaged','rma','under_repair')) as blocked
from stock_units
where deleted_at is null
group by product_id;
