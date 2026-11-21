-- Migration 0009: Business Logic RPC Functions (The Operational Engine)
-- Solar Installation Management System
-- All RPCs use SECURITY DEFINER, take p_actor uuid, and enforce fn_assert_role

-- ============================================================================
-- 1. LEADS & QUALIFICATION
-- ============================================================================

-- Public lead creation (rate-limited, phone normalized, duplicate merged)
create or replace function public.fn_create_lead_public(
  p_payload jsonb,
  p_ip_hash text default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_phone text;
  v_name text;
  v_customer_id uuid;
  v_lead_id uuid;
  v_lead_no text;
  v_owner_id uuid;
  v_existing_lead record;
begin
  -- Honeypot check
  if coalesce(p_payload->>'website', '') <> '' then
    return jsonb_build_object('ok', true, 'lead_no', 'LD-0000-00000');
  end if;

  v_phone := trim(p_payload->>'phone_e164');
  v_name := coalesce(nullif(trim(p_payload->>'name'), ''), 'Solar Enquirer');

  if v_phone is null or v_phone !~ '^\+[1-9][0-9]{7,14}$' then
    raise exception 'INVALID_PHONE: Valid E.164 phone number required';
  end if;

  -- Find or create customer
  select id into v_customer_id from customers where phone_e164 = v_phone and deleted_at is null;
  if v_customer_id is null then
    insert into customers (name, phone_e164, billing_address, customer_type)
    values (v_name, v_phone, p_payload->>'site_address', coalesce((p_payload->>'customer_type')::customer_type, 'residential'))
    returning id into v_customer_id;
  end if;

  -- Check for existing open lead (A2: duplicate enquiry merge)
  select * into v_existing_lead from leads
  where customer_id = v_customer_id and status in ('new', 'contacting', 'follow_up')
  limit 1;

  if v_existing_lead.id is not null then
    insert into lead_activities (lead_id, kind, note, meta)
    values (v_existing_lead.id, 'duplicate_enquiry', 'Repeat enquiry submitted from web form', p_payload);

    update leads set updated_at = now() where id = v_existing_lead.id;

    if v_existing_lead.owner_id is not null then
      perform fn_notify(v_existing_lead.owner_id, 'repeat_enquiry', 'Repeat enquiry from ' || v_name, 
                        'Customer submitted another form request', 'lead', v_existing_lead.id, '/leads/' || v_existing_lead.id, 'info');
    end if;

    return jsonb_build_object('ok', true, 'lead_no', v_existing_lead.lead_no, 'duplicate', true);
  end if;

  -- Round-robin sales owner assignment (A1)
  select p.id into v_owner_id
  from profiles p
  left join leads l on l.owner_id = p.id and l.status in ('new', 'contacting', 'follow_up')
  where p.role = 'sales' and p.is_active and p.deleted_at is null
  group by p.id
  order by count(l.id) asc, max(l.created_at) asc nulls first
  limit 1;

  v_lead_no := fn_next_doc_no('LD');

  insert into leads (
    lead_no, customer_id, source, status, owner_id,
    requested_kw, requirement, wants_subsidy, site_address,
    notes, submit_ip_hash
  ) values (
    v_lead_no, v_customer_id, 'web', 'new', v_owner_id,
    (p_payload->>'requested_kw')::numeric,
    case when p_payload->>'requirement' in ('on_grid', 'off_grid') then (p_payload->>'requirement')::system_type else null end,
    coalesce((p_payload->>'wants_subsidy')::boolean, false),
    p_payload->>'site_address',
    p_payload->>'notes',
    p_ip_hash
  ) returning id into v_lead_id;

  insert into lead_activities (lead_id, kind, note, actor_id)
  values (v_lead_id, 'created', 'Lead created via public web enquiry', v_owner_id);

  if v_owner_id is not null then
    perform fn_notify(v_owner_id, 'new_lead', 'New lead: ' || v_name, 
                      'Requested ' || coalesce(p_payload->>'requested_kw', '3') || ' kW system', 'lead', v_lead_id, '/leads/' || v_lead_id, 'action_required');
  else
    perform fn_notify_roles(array['manager','director'], 'unassigned_lead', 'New unassigned lead: ' || v_name, 
                            'No active sales rep available', 'lead', v_lead_id, '/leads/' || v_lead_id, 'action_required');
  end if;

  return jsonb_build_object('ok', true, 'lead_no', v_lead_no, 'duplicate', false);
end $$;

-- Sales / Manager create lead
create or replace function public.fn_create_lead(
  p_actor uuid,
  p_payload jsonb
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_phone text;
  v_name text;
  v_customer_id uuid;
  v_lead_id uuid;
  v_lead_no text;
  v_owner_id uuid;
  v_existing_lead record;
begin
  perform fn_assert_role(p_actor, array['sales', 'manager', 'director']);

  v_phone := trim(p_payload->>'phone_e164');
  v_name := coalesce(nullif(trim(p_payload->>'name'), ''), 'Direct Enquiry');

  if v_phone is null or v_phone !~ '^\+[1-9][0-9]{7,14}$' then
    raise exception 'INVALID_PHONE: Valid E.164 phone number required';
  end if;

  select id into v_customer_id from customers where phone_e164 = v_phone and deleted_at is null;
  if v_customer_id is null then
    insert into customers (name, phone_e164, billing_address, customer_type, created_by)
    values (v_name, v_phone, p_payload->>'site_address', coalesce((p_payload->>'customer_type')::customer_type, 'residential'), p_actor)
    returning id into v_customer_id;
  end if;

  -- Open lead check
  select * into v_existing_lead from leads
  where customer_id = v_customer_id and status in ('new', 'contacting', 'follow_up')
  limit 1;

  if v_existing_lead.id is not null then
    insert into lead_activities (lead_id, kind, note, actor_id, meta)
    values (v_existing_lead.id, 'duplicate_enquiry', 'Manual lead entry merged with existing open lead', p_actor, p_payload);
    return jsonb_build_object('ok', true, 'lead_no', v_existing_lead.lead_no, 'duplicate', true);
  end if;

  v_owner_id := coalesce((p_payload->>'owner_id')::uuid, p_actor);
  v_lead_no := fn_next_doc_no('LD');

  insert into leads (
    lead_no, customer_id, source, status, owner_id,
    requested_kw, requirement, wants_subsidy, site_address,
    notes, created_by
  ) values (
    v_lead_no, v_customer_id, coalesce((p_payload->>'source')::lead_source, 'call'), 'new', v_owner_id,
    (p_payload->>'requested_kw')::numeric,
    case when p_payload->>'requirement' in ('on_grid', 'off_grid') then (p_payload->>'requirement')::system_type else null end,
    coalesce((p_payload->>'wants_subsidy')::boolean, false),
    p_payload->>'site_address',
    p_payload->>'notes',
    p_actor
  ) returning id into v_lead_id;

  insert into lead_activities (lead_id, kind, note, actor_id)
  values (v_lead_id, 'created', 'Lead created manually by staff', p_actor);

  perform fn_log(p_actor, 'lead', v_lead_id, 'create_lead', null, 'new');

  return jsonb_build_object('ok', true, 'lead_no', v_lead_no, 'lead_id', v_lead_id);
end $$;

-- Log lead activity
create or replace function public.fn_log_lead_activity(
  p_actor uuid,
  p_lead_id uuid,
  p_kind text,
  p_outcome text default null,
  p_note text default null,
  p_next_followup timestamptz default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_lead leads%rowtype;
begin
  perform fn_assert_role(p_actor, array['sales', 'manager', 'director']);

  select * into v_lead from leads where id = p_lead_id;
  if not found then raise exception 'NOT_FOUND: Lead not found'; end if;
  if v_lead.status in ('unreachable', 'disqualified', 'lost') then
    raise exception 'LEAD_CLOSED: Cannot update closed lead';
  end if;

  insert into lead_activities (lead_id, kind, outcome, note, actor_id)
  values (p_lead_id, p_kind, p_outcome, p_note, p_actor);

  update leads set
    status = case when status = 'new' then 'contacting' 
                  when p_next_followup is not null then 'follow_up' 
                  else status end,
    next_followup_at = coalesce(p_next_followup, next_followup_at),
    last_contacted_at = now(),
    attempt_count = case when p_outcome in ('no_answer', 'busy') then attempt_count + 1 else attempt_count end,
    updated_at = now()
  where id = p_lead_id;

  return jsonb_build_object('ok', true);
end $$;

-- Close lead
create or replace function public.fn_close_lead(
  p_actor uuid,
  p_lead_id uuid,
  p_status text,
  p_reason text
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_lead leads%rowtype;
begin
  perform fn_assert_role(p_actor, array['sales', 'manager', 'director']);

  if p_status not in ('unreachable', 'disqualified', 'lost') then
    raise exception 'INVALID_STATUS: Close status must be unreachable, disqualified, or lost';
  end if;
  if coalesce(trim(p_reason), '') = '' then
    raise exception 'REASON_REQUIRED: A valid close reason must be provided';
  end if;

  select * into v_lead from leads where id = p_lead_id;
  if not found then raise exception 'NOT_FOUND: Lead not found'; end if;

  update leads set
    status = p_status::lead_status,
    close_reason = p_reason,
    closed_at = now(),
    updated_at = now()
  where id = p_lead_id;

  insert into lead_activities (lead_id, kind, note, actor_id)
  values (p_lead_id, 'status_change', 'Lead closed as ' || p_status || ': ' || p_reason, p_actor);

  perform fn_log(p_actor, 'lead', p_lead_id, 'close_lead', v_lead.status::text, p_status, p_reason);

  return jsonb_build_object('ok', true);
end $$;

-- Qualify lead (A3 Automation: creates project + survey job)
create or replace function public.fn_qualify_lead(
  p_actor uuid,
  p_lead_id uuid,
  p_checklist jsonb,
  p_system_type text,
  p_requested_kw numeric,
  p_survey jsonb default '{}'::jsonb
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_lead leads%rowtype;
  v_customer customers%rowtype;
  v_project_id uuid;
  v_project_no text;
  v_job_id uuid;
  v_job_no text;
  v_survey_id uuid;
  v_tech_id uuid;
  v_start timestamptz;
  v_end timestamptz;
  v_is_subsidy boolean;
begin
  perform fn_assert_role(p_actor, array['sales', 'manager', 'director']);

  select * into v_lead from leads where id = p_lead_id for update;
  if not found then raise exception 'NOT_FOUND: Lead not found'; end if;
  if v_lead.status in ('converted', 'lost', 'disqualified', 'unreachable') then
    raise exception 'INVALID_STATE: Lead is already %', v_lead.status;
  end if;

  select * into v_customer from customers where id = v_lead.customer_id;

  -- Gate G2: Checklist completeness
  if (p_checklist->>'shadow_free_area_sqft') is null or (p_checklist->>'grid_connection_suitable') is null then
    raise exception 'CHECKLIST_INCOMPLETE: Shadow-free area and grid suitability are mandatory';
  end if;

  -- Record checklist
  insert into lead_qualifications (
    lead_id, shadow_free_area_sqft, monthly_bill_paise, monthly_units,
    grid_connection_suitable, grid_notes, roof_ownership,
    consumer_number, consumer_name_on_bill, suggested_kw, outcome, recorded_by
  ) values (
    p_lead_id,
    (p_checklist->>'shadow_free_area_sqft')::int,
    (p_checklist->>'monthly_bill_paise')::bigint,
    (p_checklist->>'monthly_units')::int,
    (p_checklist->>'grid_connection_suitable')::boolean,
    p_checklist->>'grid_notes',
    p_checklist->>'roof_ownership',
    p_checklist->>'consumer_number',
    p_checklist->>'consumer_name_on_bill',
    coalesce((p_checklist->>'suggested_kw')::numeric, p_requested_kw),
    'qualified',
    p_actor
  );

  v_is_subsidy := (v_customer.customer_type = 'residential' and p_system_type = 'on_grid');
  v_project_no := fn_next_doc_no('PRJ');

  -- Create Project
  insert into projects (
    project_no, customer_id, lead_id, stage, customer_type, system_type,
    requested_kw, site_address, discom, consumer_number, consumer_name_on_bill,
    sales_owner_id, subsidy_eligible
  ) values (
    v_project_no, v_customer.id, p_lead_id, 'qualified', v_customer.customer_type,
    p_system_type::system_type, p_requested_kw,
    coalesce(v_lead.site_address, v_customer.billing_address, 'Site Location'),
    p_checklist->>'discom', p_checklist->>'consumer_number', p_checklist->>'consumer_name_on_bill',
    v_lead.owner_id, v_is_subsidy
  ) returning id into v_project_id;

  -- Subsidy shell if eligible
  if v_is_subsidy then
    insert into subsidy_applications (project_id, status, estimated_paise)
    values (v_project_id, 'registration_pending', 7800000)
    on conflict do nothing;
  end if;

  -- Create Survey Job
  v_job_no := fn_next_doc_no('JOB');
  v_tech_id := (p_survey->>'technician_id')::uuid;
  v_start := (p_survey->>'start')::timestamptz;
  v_end := (p_survey->>'end')::timestamptz;

  insert into jobs (
    job_no, project_id, type, status, title,
    scheduled_start, scheduled_end, estimated_hours, site_address, created_by
  ) values (
    v_job_no, v_project_id, 'survey',
    case when v_start is not null then 'scheduled'::job_status else 'unscheduled'::job_status end,
    'Site Roof Survey for ' || v_customer.name,
    v_start, v_end, 1.5, coalesce(v_lead.site_address, v_customer.billing_address), p_actor
  ) returning id into v_job_id;

  if v_tech_id is not null then
    insert into job_crew (job_id, profile_id, crew_role)
    values (v_job_id, v_tech_id, 'lead');

    perform fn_notify(v_tech_id, 'survey_assigned', 'Survey Scheduled: ' || v_project_no,
                      'Survey job ' || v_job_no || ' on ' || to_char(v_start at time zone 'Asia/Kolkata', 'DD Mon HH24:MI'),
                      'job', v_job_id, '/field/jobs/' || v_job_id, 'action_required');
  end if;

  -- Create Survey draft record
  insert into surveys (job_id, project_id, status)
  values (v_job_id, v_project_id, 'draft')
  returning id into v_survey_id;

  -- Update Lead
  update leads set
    status = 'converted',
    project_id = v_project_id,
    updated_at = now()
  where id = p_lead_id;

  insert into lead_activities (lead_id, kind, note, actor_id)
  values (p_lead_id, 'qualification', 'Lead qualified into Project ' || v_project_no, p_actor);

  perform fn_log(p_actor, 'lead', p_lead_id, 'qualify_lead', v_lead.status::text, 'converted');
  perform fn_log(p_actor, 'project', v_project_id, 'create_project', null, 'qualified');

  return jsonb_build_object(
    'ok', true,
    'project_id', v_project_id,
    'project_no', v_project_no,
    'survey_job_id', v_job_id,
    'survey_id', v_survey_id
  );
end $$;

-- ============================================================================
-- 2. SURVEY & APPROVAL (HARD GATE REQ-SURV-04)
-- ============================================================================

-- Submit survey from technician mobile
create or replace function public.fn_submit_survey(
  p_actor uuid,
  p_job_id uuid,
  p_data jsonb,
  p_client_submission_id uuid default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_survey surveys%rowtype;
  v_job jobs%rowtype;
begin
  perform fn_assert_role(p_actor, array['technician', 'manager', 'director']);

  select * into v_job from jobs where id = p_job_id for update;
  if not found then raise exception 'NOT_FOUND: Survey job not found'; end if;

  select * into v_survey from surveys where job_id = p_job_id for update;
  if not found then raise exception 'NOT_FOUND: Survey record not found'; end if;

  -- Idempotency check
  if p_client_submission_id is not null and v_survey.client_submission_id = p_client_submission_id then
    return jsonb_build_object('ok', true, 'already_submitted', true, 'survey_id', v_survey.id);
  end if;

  -- Gate G3: Required survey measurements
  if (p_data->>'shadow_free_area_sqft') is null or 
     (p_data->>'cable_dc_m') is null or 
     (p_data->>'cable_ac_m') is null then
    raise exception 'SURVEY_INCOMPLETE: Shadow-free area, DC cable length, and AC cable length are mandatory';
  end if;

  update surveys set
    status = 'submitted',
    roof_direction = coalesce((p_data->>'roof_direction')::roof_direction, 'south'),
    roof_tilt_deg = (p_data->>'roof_tilt_deg')::numeric,
    roof_type = coalesce((p_data->>'roof_type')::roof_type, 'rcc_flat'),
    shadow_free_area_sqft = (p_data->>'shadow_free_area_sqft')::int,
    cable_dc_m = (p_data->>'cable_dc_m')::numeric,
    cable_ac_m = (p_data->>'cable_ac_m')::numeric,
    feasibility = coalesce((p_data->>'feasibility')::feasibility, 'feasible'),
    recommended_kw = (p_data->>'recommended_kw')::numeric,
    notes = p_data->>'notes',
    submitted_at = now(),
    submitted_by = p_actor,
    client_submission_id = p_client_submission_id,
    updated_at = now()
  where id = v_survey.id;

  update jobs set status = 'completed', actual_end = now(), updated_at = now() where id = p_job_id;
  update projects set stage = 'survey_submitted', updated_at = now() where id = v_job.project_id;

  perform fn_log(p_actor, 'survey', v_survey.id, 'submit_survey', v_survey.status::text, 'submitted');
  perform fn_notify_roles(array['manager','director'], 'survey_submitted', 'Survey Submitted for Review',
                          'Survey completed for job ' || v_job.job_no, 'survey', v_survey.id, '/surveys/' || v_survey.id, 'action_required');

  return jsonb_build_object('ok', true, 'survey_id', v_survey.id);
end $$;

-- Manager Review Survey (HARD GATE: REQ-SURV-04)
create or replace function public.fn_review_survey(
  p_actor uuid,
  p_survey_id uuid,
  p_decision text,
  p_note text default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_survey surveys%rowtype;
  v_project projects%rowtype;
begin
  perform fn_assert_role(p_actor, array['manager', 'director']);

  select * into v_survey from surveys where id = p_survey_id for update;
  if not found then raise exception 'NOT_FOUND: Survey not found'; end if;

  select * into v_project from projects where id = v_survey.project_id for update;

  if p_decision = 'approve' then
    if v_survey.feasibility = 'not_feasible' then
      raise exception 'UNFEASIBLE_SURVEY: Cannot approve survey marked not_feasible';
    end if;

    update surveys set
      status = 'approved',
      reviewed_at = now(),
      reviewed_by = p_actor,
      review_note = p_note,
      updated_at = now()
    where id = p_survey_id;

    update projects set stage = 'survey_approved', updated_at = now() where id = v_survey.project_id;

    perform fn_log(p_actor, 'survey', p_survey_id, 'approve_survey', v_survey.status::text, 'approved', p_note);

    if v_project.sales_owner_id is not null then
      perform fn_notify(v_project.sales_owner_id, 'quote_unlocked', 'Quote Unlocked for ' || v_project.project_no,
                        'Survey approved by manager. You can now generate the quote.', 'project', v_project.id, '/quotes/new?project_id=' || v_project.id, 'success');
    end if;

  elsif p_decision = 'rework' then
    update surveys set
      status = 'rework_requested',
      reviewed_at = now(),
      reviewed_by = p_actor,
      review_note = coalesce(p_note, 'Rework requested'),
      updated_at = now()
    where id = p_survey_id;

    update jobs set status = 'in_progress', updated_at = now() where id = v_survey.job_id;

    perform fn_log(p_actor, 'survey', p_survey_id, 'rework_survey', v_survey.status::text, 'rework_requested', p_note);

  elsif p_decision = 'close_unfeasible' then
    update surveys set status = 'rejected', review_note = p_note, reviewed_at = now(), reviewed_by = p_actor where id = p_survey_id;
    update projects set stage = 'cancelled', cancel_reason = coalesce(p_note, 'Site unfeasible for solar installation') where id = v_survey.project_id;
    perform fn_log(p_actor, 'project', v_survey.project_id, 'cancel_project', v_project.stage::text, 'cancelled', p_note);

  else
    raise exception 'INVALID_DECISION: Decision must be approve, rework, or close_unfeasible';
  end if;

  return jsonb_build_object('ok', true, 'status', p_decision);
end $$;

-- ============================================================================
-- 3. QUOTE ENGINE (BOM generation, price lock, subsidy, approval)
-- ============================================================================

-- Build Quote Lines from Template + Survey
create or replace function public.fn_build_quote_lines(
  p_template_id uuid,
  p_survey_id uuid,
  p_nominal_kw numeric,
  p_system_type text
) returns table (
  line_no int,
  product_id uuid,
  sku text,
  description text,
  category product_category,
  qty numeric,
  uom text,
  unit_price_paise bigint,
  unit_cost_paise bigint,
  gst_rate_bp int,
  is_serialised boolean,
  line_taxable_paise bigint,
  line_gst_paise bigint,
  line_total_paise bigint
) language plpgsql security definer set search_path = public as $$
declare
  v_survey surveys%rowtype;
  v_template package_templates%rowtype;
  v_item record;
  v_calc_qty numeric;
  v_taxable bigint;
  v_gst bigint;
  v_line_no int := 0;
begin
  select * into v_survey from surveys where id = p_survey_id;
  select * into v_template from package_templates where id = p_template_id;

  for v_item in
    select pti.*, p.sku, p.name, p.category, p.uom, p.unit_price_paise, p.gst_rate_bp, p.is_serialised,
           coalesce(pc.standard_cost_paise, 0) as unit_cost_paise
    from package_template_items pti
    join products p on p.id = pti.product_id
    left join product_costs pc on pc.product_id = p.id
    where pti.template_id = p_template_id
    order by pti.sort asc
  loop
    v_line_no := v_line_no + 1;
    line_no := v_line_no;
    product_id := v_item.product_id;
    sku := v_item.sku;
    description := v_item.name;
    category := v_item.category;
    uom := v_item.uom;
    unit_price_paise := v_item.unit_price_paise;
    unit_cost_paise := v_item.unit_cost_paise;
    gst_rate_bp := v_item.gst_rate_bp;
    is_serialised := v_item.is_serialised;

    -- Dynamic survey-driven quantity rules
    if v_item.qty_rule = 'fixed' then
      v_calc_qty := v_item.qty_value;
    elsif v_item.qty_rule = 'per_kw' then
      v_calc_qty := p_nominal_kw * v_item.qty_value;
    elsif v_item.qty_rule = 'panel_count' or v_item.qty_rule = 'per_panel' then
      v_calc_qty := ceil((p_nominal_kw * 1000.0) / 540.0) * v_item.qty_value;
    elsif v_item.qty_rule = 'cable_dc_m' then
      v_calc_qty := ceil(coalesce(v_survey.cable_dc_m, 20.0) * v_item.qty_value);
    elsif v_item.qty_rule = 'cable_ac_m' then
      v_calc_qty := ceil(coalesce(v_survey.cable_ac_m, 10.0) * v_item.qty_value);
    else
      v_calc_qty := v_item.qty_value;
    end if;

    qty := greatest(v_item.min_qty, v_calc_qty);
    v_taxable := (qty * unit_price_paise)::bigint;
    v_gst := round((v_taxable * gst_rate_bp)::numeric / 10000.0)::bigint;

    line_taxable_paise := v_taxable;
    line_gst_paise := v_gst;
    line_total_paise := v_taxable + v_gst;

    return next;
  end loop;
end $$;

-- Create Quote (HARD GATE: G1 survey must be approved)
create or replace function public.fn_create_quote(
  p_actor uuid,
  p_project_id uuid,
  p_template_id uuid,
  p_options jsonb default '{}'::jsonb
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_project projects%rowtype;
  v_survey surveys%rowtype;
  v_template package_templates%rowtype;
  v_quote_id uuid;
  v_quote_no text;
  v_subtotal bigint := 0;
  v_gst bigint := 0;
  v_discount bigint;
  v_taxable bigint;
  v_total bigint;
  v_subsidy bigint := 0;
  v_net_cost bigint;
  v_line record;
  v_quote_line_id uuid;
  v_approval_needed boolean := false;
  v_approval_reason text;
begin
  perform fn_assert_role(p_actor, array['sales', 'manager', 'director']);

  select * into v_project from projects where id = p_project_id for update;
  if not found then raise exception 'NOT_FOUND: Project not found'; end if;

  -- HARD GATE G1: Must have approved survey!
  select * into v_survey from surveys 
  where project_id = p_project_id and status = 'approved' 
  order by updated_at desc limit 1;

  if v_survey.id is null then
    raise exception 'SURVEY_NOT_APPROVED: A quote cannot be created without an approved survey (REQ-SURV-04)';
  end if;

  select * into v_template from package_templates where id = p_template_id;
  if not found then raise exception 'NOT_FOUND: Template not found'; end if;

  v_quote_no := fn_next_doc_no('QT');
  v_discount := coalesce((p_options->>'discount_paise')::bigint, 0);

  insert into quotes (
    quote_no, version, project_id, survey_id, template_id,
    status, system_type, nominal_kw, valid_until, created_by
  ) values (
    v_quote_no, 1, p_project_id, v_survey.id, p_template_id,
    'draft', v_template.system_type, v_template.capacity_kw,
    (now() + interval '15 days')::date, p_actor
  ) returning id into v_quote_id;

  -- Build & insert BOM lines with frozen prices
  for v_line in select * from fn_build_quote_lines(p_template_id, v_survey.id, v_template.capacity_kw, v_template.system_type::text)
  loop
    v_subtotal := v_subtotal + v_line.line_taxable_paise;
    v_gst := v_gst + v_line.line_gst_paise;

    insert into quote_lines (
      quote_id, line_no, product_id, sku, description, category,
      qty, uom, unit_price_paise, gst_rate_bp, is_serialised,
      line_taxable_paise, line_gst_paise, line_total_paise
    ) values (
      v_quote_id, v_line.line_no, v_line.product_id, v_line.sku, v_line.description, v_line.category,
      v_line.qty, v_line.uom, v_line.unit_price_paise, v_line.gst_rate_bp, v_line.is_serialised,
      v_line.line_taxable_paise, v_line.line_gst_paise, v_line.line_total_paise
    ) returning id into v_quote_line_id;

    -- Segregated cost insertion
    insert into quote_line_costs (quote_line_id, unit_cost_paise)
    values (v_quote_line_id, v_line.unit_cost_paise);
  end loop;

  v_taxable := greatest(0, v_subtotal - v_discount);
  v_total := v_taxable + v_gst;

  -- Subsidy Calculation (PM Surya Ghar: ₹30k/kW for first 2 kW, ₹18k for 3rd kW, cap ₹78k)
  if v_project.subsidy_eligible and v_template.system_type = 'on_grid' then
    if v_template.capacity_kw <= 2.0 then
      v_subsidy := (v_template.capacity_kw * 3000000)::bigint;
    else
      v_subsidy := least(7800000::bigint, 6000000::bigint + ((v_template.capacity_kw - 2.0) * 1800000)::bigint);
    end if;
  end if;

  v_net_cost := greatest(0, v_total - v_subsidy);

  -- Discount approval check (> 3% requires manager approval)
  if v_subtotal > 0 and (v_discount::numeric / v_subtotal::numeric) > 0.03 then
    v_approval_needed := true;
    v_approval_reason := 'Discount exceeds 3% threshold';
  end if;

  update quotes set
    subtotal_paise = v_subtotal,
    discount_paise = v_discount,
    taxable_paise = v_taxable,
    gst_paise = v_gst,
    total_paise = v_total,
    subsidy_eligible = v_project.subsidy_eligible,
    subsidy_paise = v_subsidy,
    net_cost_paise = v_net_cost,
    approval_required = v_approval_needed,
    approval_reason = v_approval_reason,
    status = case when v_approval_needed then 'pending_approval'::quote_status else 'approved'::quote_status end,
    approved_at = case when not v_approval_needed then now() else null end,
    updated_at = now()
  where id = v_quote_id;

  update projects set current_quote_id = v_quote_id, updated_at = now() where id = p_project_id;

  perform fn_log(p_actor, 'quote', v_quote_id, 'create_quote', null, 'draft');

  return jsonb_build_object(
    'ok', true,
    'quote_id', v_quote_id,
    'quote_no', v_quote_no,
    'total_paise', v_total,
    'subsidy_paise', v_subsidy,
    'net_cost_paise', v_net_cost,
    'approval_required', v_approval_needed
  );
end $$;

-- Send Quote & Generate Public Share Link
create or replace function public.fn_send_quote(
  p_actor uuid,
  p_quote_id uuid
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_quote quotes%rowtype;
  v_token text;
  v_hash text;
  v_link_id uuid;
begin
  perform fn_assert_role(p_actor, array['sales', 'manager', 'director']);

  select * into v_quote from quotes where id = p_quote_id for update;
  if not found then raise exception 'NOT_FOUND: Quote not found'; end if;

  if v_quote.status not in ('approved', 'draft') then
    raise exception 'INVALID_STATE: Quote must be approved before sending';
  end if;

  v_token := encode(gen_random_bytes(24), 'hex');
  v_hash := encode(digest(v_token || 'sunpower-token-pepper-secret-32-bytes', 'sha256'), 'hex');

  insert into share_links (kind, entity_id, token_hash, expires_at, created_by)
  values ('quote', v_quote.id, v_hash, (now() + interval '18 days'), p_actor)
  returning id into v_link_id;

  update quotes set status = 'sent', sent_at = now(), sent_by = p_actor, updated_at = now() where id = p_quote_id;
  update projects set stage = 'quoted', updated_at = now() where id = v_quote.project_id;

  perform fn_log(p_actor, 'quote', p_quote_id, 'send_quote', v_quote.status::text, 'sent');

  return jsonb_build_object(
    'ok', true,
    'token', v_token,
    'url', '/q/' || v_token
  );
end $$;

-- Public Quote Acceptance by Customer (creates Order)
create or replace function public.fn_public_accept_quote(
  p_token text,
  p_name text,
  p_ip_hash text default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_hash text;
  v_link share_links%rowtype;
  v_quote quotes%rowtype;
  v_project projects%rowtype;
  v_order_id uuid;
  v_order_no text;
  v_line record;
begin
  v_hash := encode(digest(p_token || 'sunpower-token-pepper-secret-32-bytes', 'sha256'), 'hex');

  select * into v_link from share_links
  where token_hash = v_hash and kind = 'quote' and revoked_at is null
    and (expires_at is null or expires_at > now());

  if not found then
    raise exception 'LINK_INVALID: This quote link is invalid or has expired';
  end if;

  select * into v_quote from quotes where id = v_link.entity_id for update;
  if not found then raise exception 'NOT_FOUND: Quote not found'; end if;

  select * into v_project from projects where id = v_quote.project_id;

  -- Idempotent check
  if v_quote.status = 'accepted' then
    select id into v_order_id from orders where quote_id = v_quote.id;
    return jsonb_build_object('ok', true, 'order_id', v_order_id, 'already_accepted', true);
  end if;

  update quotes set
    status = 'accepted',
    accepted_at = now(),
    accepted_name = coalesce(p_name, 'Customer'),
    accepted_ip_hash = p_ip_hash,
    updated_at = now()
  where id = v_quote.id;

  -- Create Order (A5 Automation)
  v_order_no := fn_next_doc_no('ORD');

  insert into orders (
    order_no, project_id, quote_id, status, pay_status,
    taxable_paise, gst_paise, total_paise,
    advance_required_paise, delivery_name, delivery_address
  ) values (
    v_order_no, v_project.id, v_quote.id, 'pending_payment', 'unpaid',
    v_quote.taxable_paise, v_quote.gst_paise, v_quote.total_paise,
    round(v_quote.total_paise * 0.5)::bigint,  -- 50% advance setting default
    coalesce(p_name, v_project.consumer_name_on_bill, 'Customer'),
    v_project.site_address
  ) returning id into v_order_id;

  -- Copy quote lines to order lines
  for v_line in select * from quote_lines where quote_id = v_quote.id order by line_no
  loop
    insert into order_lines (
      order_id, line_no, quote_line_id, product_id, sku, description,
      category, qty, uom, unit_price_paise, gst_rate_bp, is_serialised,
      line_taxable_paise, line_gst_paise, line_total_paise
    ) values (
      v_order_id, v_line.line_no, v_line.id, v_line.product_id, v_line.sku, v_line.description,
      v_line.category, v_line.qty, v_line.uom, v_line.unit_price_paise, v_line.gst_rate_bp, v_line.is_serialised,
      v_line.line_taxable_paise, v_line.line_gst_paise, v_line.line_total_paise
    );
  end loop;

  update projects set stage = 'awaiting_payment', order_id = v_order_id, updated_at = now() where id = v_project.id;

  perform fn_log(v_quote.created_by, 'quote', v_quote.id, 'accept_quote', 'sent', 'accepted');
  perform fn_log(v_quote.created_by, 'order', v_order_id, 'create_order', null, 'pending_payment');

  if v_project.sales_owner_id is not null then
    perform fn_notify(v_project.sales_owner_id, 'quote_accepted', 'Quote Accepted: ' || v_order_no,
                      'Customer accepted quote ' || v_quote.quote_no || '. Advance required: ₹' || round((v_quote.total_paise * 0.5) / 100.0),
                      'order', v_order_id, '/orders/' || v_order_id, 'success');
  end if;

  return jsonb_build_object('ok', true, 'order_id', v_order_id, 'order_no', v_order_no);
end $$;

-- Staff Accept Quote
create or replace function public.fn_accept_quote(
  p_actor uuid,
  p_quote_id uuid,
  p_name text default 'Customer'
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_quote quotes%rowtype;
  v_project projects%rowtype;
  v_order_id uuid;
  v_order_no text;
  v_line record;
begin
  perform fn_assert_role(p_actor, array['sales', 'manager', 'director']);

  select * into v_quote from quotes where id = p_quote_id for update;
  if not found then raise exception 'NOT_FOUND: Quote not found'; end if;
  select * into v_project from projects where id = v_quote.project_id;

  if v_quote.status = 'accepted' then
    select id into v_order_id from orders where quote_id = v_quote.id;
    return jsonb_build_object('ok', true, 'order_id', v_order_id, 'already_accepted', true);
  end if;

  update quotes set status = 'accepted', accepted_at = now(), accepted_name = p_name, updated_at = now() where id = p_quote_id;

  v_order_no := fn_next_doc_no('ORD');

  insert into orders (
    order_no, project_id, quote_id, status, pay_status,
    taxable_paise, gst_paise, total_paise,
    advance_required_paise, delivery_name, delivery_address
  ) values (
    v_order_no, v_project.id, v_quote.id, 'pending_payment', 'unpaid',
    v_quote.taxable_paise, v_quote.gst_paise, v_quote.total_paise,
    round(v_quote.total_paise * 0.5)::bigint,
    p_name, v_project.site_address
  ) returning id into v_order_id;

  for v_line in select * from quote_lines where quote_id = v_quote.id order by line_no
  loop
    insert into order_lines (
      order_id, line_no, quote_line_id, product_id, sku, description,
      category, qty, uom, unit_price_paise, gst_rate_bp, is_serialised,
      line_taxable_paise, line_gst_paise, line_total_paise
    ) values (
      v_order_id, v_line.line_no, v_line.id, v_line.product_id, v_line.sku, v_line.description,
      v_line.category, v_line.qty, v_line.uom, v_line.unit_price_paise, v_line.gst_rate_bp, v_line.is_serialised,
      v_line.line_taxable_paise, v_line.line_gst_paise, v_line.line_total_paise
    );
  end loop;

  update projects set stage = 'awaiting_payment', order_id = v_order_id, updated_at = now() where id = v_project.id;
  perform fn_log(p_actor, 'order', v_order_id, 'create_order', null, 'pending_payment');

  return jsonb_build_object('ok', true, 'order_id', v_order_id, 'order_no', v_order_no);
end $$;

-- ============================================================================
-- 4. ORDER, PAYMENT & AUTOMATION A6 (Confirm -> Reserve + Picklist + Job)
-- ============================================================================

-- Refresh Order Payment Status
create or replace function public.fn_refresh_order_payment(p_order_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_paid bigint;
  v_order orders%rowtype;
begin
  select coalesce(sum(amount_paise), 0) into v_paid
  from payments
  where order_id = p_order_id and status = 'received' and kind <> 'refund';

  select * into v_order from orders where id = p_order_id;

  update orders set
    paid_paise = v_paid,
    pay_status = case
      when v_paid = 0 then 'unpaid'::order_pay_status
      when v_paid < advance_required_paise then 'partial'::order_pay_status
      when v_paid >= advance_required_paise and v_paid < total_paise then 'advance_met'::order_pay_status
      when v_paid = total_paise then 'paid'::order_pay_status
      else 'overpaid'::order_pay_status
    end,
    updated_at = now()
  where id = p_order_id;
end $$;

-- Record Payment (idempotent, UTR unique)
create or replace function public.fn_record_payment(
  p_actor uuid,
  p_order_id uuid,
  p_ticket_id uuid,
  p_amount_paise bigint,
  p_method payment_method,
  p_reference text,
  p_received_at timestamptz,
  p_idempotency_key uuid,
  p_notes text default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_order orders%rowtype;
  v_payment_id uuid;
  v_payment_no text;
  v_customer_id uuid;
  v_confirm_res jsonb;
begin
  perform fn_assert_role(p_actor, array['accounts', 'manager', 'director']);

  -- Idempotency
  select id into v_payment_id from payments where idempotency_key = p_idempotency_key;
  if v_payment_id is not null then
    return jsonb_build_object('ok', true, 'payment_id', v_payment_id, 'already_recorded', true);
  end if;

  if p_amount_paise <= 0 then
    raise exception 'INVALID_AMOUNT: Payment amount must be greater than zero';
  end if;

  if p_order_id is not null then
    select * into v_order from orders where id = p_order_id for update;
    if not found then raise exception 'NOT_FOUND: Order not found'; end if;
    select customer_id into v_customer_id from projects where id = v_order.project_id;
  end if;

  v_payment_no := fn_next_doc_no('PAY');

  insert into payments (
    payment_no, order_id, ticket_id, customer_id, kind, method,
    amount_paise, status, reference, received_at, recorded_by,
    notes, idempotency_key
  ) values (
    v_payment_no, p_order_id, p_ticket_id, v_customer_id,
    case when v_order.paid_paise = 0 then 'advance'::payment_kind else 'balance'::payment_kind end,
    p_method, p_amount_paise, 'received', p_reference,
    coalesce(p_received_at, now()), p_actor, p_notes, p_idempotency_key
  ) returning id into v_payment_id;

  if p_order_id is not null then
    perform fn_refresh_order_payment(p_order_id);

    -- Check if payment meets advance -> Trigger AUTOMATION A6!
    select * into v_order from orders where id = p_order_id;
    if v_order.status = 'pending_payment' and v_order.paid_paise >= v_order.advance_required_paise then
      v_confirm_res := fn_confirm_order(p_actor, p_order_id, false);
    end if;
  end if;

  perform fn_log(p_actor, 'payment', v_payment_id, 'record_payment', null, 'received');

  return jsonb_build_object(
    'ok', true,
    'payment_id', v_payment_id,
    'payment_no', v_payment_no,
    'order_confirmed', coalesce((v_confirm_res->>'ok')::boolean, false)
  );
end $$;

-- Reserve stock for confirmed order (deterministic order, advisory locks)
create or replace function public.fn_reserve_order_stock(p_order_id uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_line record;
  v_need numeric;
  v_got int;
begin
  for v_line in
    select ol.*, p.tracks_stock
    from order_lines ol
    join products p on p.id = ol.product_id
    where ol.order_id = p_order_id and p.tracks_stock
    order by ol.product_id asc
  loop
    v_need := v_line.qty - v_line.qty_reserved;
    if v_need <= 0 then continue; end if;

    if v_line.is_serialised then
      update stock_units set
        status = 'reserved',
        reserved_order_id = p_order_id,
        reserved_order_line_id = v_line.id,
        reserved_at = now()
      where id in (
        select id from stock_units
        where product_id = v_line.product_id and status = 'in_stock' and deleted_at is null
        order by received_at asc
        limit v_need
      );
      get diagnostics v_got = row_count;

      update order_lines set qty_reserved = qty_reserved + v_got where id = v_line.id;
    else
      update bulk_stock set
        reserved = reserved + least(available, v_need),
        updated_at = now()
      where product_id = v_line.product_id;

      insert into stock_movements (product_id, movement_type, qty, order_id, order_line_id, reason)
      values (v_line.product_id, 'reserved', least(v_need, 1000), p_order_id, v_line.id, 'Reserved for Order ' || p_order_id);

      update order_lines set qty_reserved = qty_reserved + v_need where id = v_line.id;
    end if;
  end loop;

  return jsonb_build_object('ok', true);
end $$;

-- Automation A6: Order Confirmation
create or replace function public.fn_confirm_order(
  p_actor uuid,
  p_order_id uuid,
  p_force boolean default false,
  p_force_reason text default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_order orders%rowtype;
  v_project projects%rowtype;
  v_customer customers%rowtype;
  v_pick_id uuid;
  v_pick_no text;
  v_job_id uuid;
  v_job_no text;
  v_tech_id uuid;
  v_line record;
  v_line_no int := 0;
begin
  select * into v_order from orders where id = p_order_id for update;
  if not found then raise exception 'NOT_FOUND: Order not found'; end if;

  if v_order.status in ('confirmed', 'in_fulfilment', 'delivered', 'completed') then
    return jsonb_build_object('ok', true, 'already_confirmed', true);
  end if;

  select * into v_project from projects where id = v_order.project_id for update;
  select * into v_customer from customers where id = v_project.customer_id;

  if not p_force and v_order.paid_paise < v_order.advance_required_paise then
    raise exception 'ADVANCE_NOT_MET: Paid amount ₹% is less than required advance ₹%',
      round(v_order.paid_paise / 100.0), round(v_order.advance_required_paise / 100.0);
  end if;

  update orders set
    status = 'confirmed',
    confirmed_at = now(),
    force_confirmed = p_force,
    force_reason = p_force_reason,
    updated_at = now()
  where id = p_order_id;

  update projects set stage = 'order_confirmed', updated_at = now() where id = v_project.id;

  -- 1. Create Pick List for Warehouse (no price/money fields!)
  insert into pick_lists (
    order_id, project_no, customer_name, customer_phone,
    delivery_address, status, dispatch_blocked
  ) values (
    p_order_id, v_project.project_no, v_customer.name, v_customer.phone_e164,
    v_order.delivery_address, 'pending', false
  ) returning id into v_pick_id;

  for v_line in
    select ol.*, p.name as product_name
    from order_lines ol
    join products p on p.id = ol.product_id
    where ol.order_id = p_order_id
    order by ol.line_no
  loop
    v_line_no := v_line_no + 1;
    insert into pick_list_lines (
      pick_list_id, line_no, product_id, sku, description,
      qty, is_serialised, qty_picked
    ) values (
      v_pick_id, v_line_no, v_line.product_id, v_line.sku, v_line.product_name,
      v_line.qty, v_line.is_serialised, 0
    );
  end loop;

  -- 2. Reserve Stock Atomically
  perform fn_reserve_order_stock(p_order_id);

  -- 3. Auto-create & schedule Install Job for field crew
  v_job_no := fn_next_doc_no('JOB');

  -- Find least-busy technician
  select p.id into v_tech_id
  from profiles p
  left join job_crew jc on jc.profile_id = p.id
  left join jobs j on j.id = jc.job_id and j.status in ('scheduled', 'in_progress')
  where p.role = 'technician' and p.is_active and p.deleted_at is null
  group by p.id
  order by count(j.id) asc
  limit 1;

  insert into jobs (
    job_no, project_id, type, status, title,
    scheduled_start, scheduled_end, estimated_hours,
    site_address, created_by
  ) values (
    v_job_no, v_project.id, 'install', 'scheduled',
    'Rooftop Solar Installation (' || v_project.requested_kw || ' kW) for ' || v_customer.name,
    (now() + interval '3 days')::date + time '09:00:00',
    (now() + interval '3 days')::date + time '17:00:00',
    8.0, v_order.delivery_address, p_actor
  ) returning id into v_job_id;

  if v_tech_id is not null then
    insert into job_crew (job_id, profile_id, crew_role)
    values (v_job_id, v_tech_id, 'lead');

    perform fn_notify(v_tech_id, 'install_scheduled', 'Installation Job Assigned: ' || v_job_no,
                      'Installation scheduled for ' || v_project.project_no || ' on ' || to_char((now() + interval '3 days'), 'DD Mon'),
                      'job', v_job_id, '/field/jobs/' || v_job_id, 'action_required');
  end if;

  -- Notify Warehouse
  perform fn_notify_roles(array['warehouse'], 'picklist_ready', 'New Pick-list: ' || v_project.project_no,
                          'Order confirmed. Pick-list ready for packing.', 'pick_list', v_pick_id, '/warehouse/picklists/' || v_pick_id, 'action_required');

  perform fn_log(p_actor, 'order', p_order_id, 'confirm_order', v_order.status::text, 'confirmed');

  return jsonb_build_object(
    'ok', true,
    'order_id', p_order_id,
    'pick_list_id', v_pick_id,
    'install_job_id', v_job_id
  );
end $$;

-- Cancel Order
create or replace function public.fn_cancel_order(
  p_actor uuid,
  p_order_id uuid,
  p_reason text,
  p_retained_paise bigint default 0,
  p_close_project boolean default false
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_order orders%rowtype;
begin
  perform fn_assert_role(p_actor, array['manager', 'director']);

  select * into v_order from orders where id = p_order_id for update;
  if not found then raise exception 'NOT_FOUND: Order not found'; end if;

  if exists (select 1 from dispatches where order_id = p_order_id and status in ('in_transit', 'delivered')) then
    raise exception 'ORDER_ALREADY_DISPATCHED: Cannot cancel order after dispatch has departed or delivered';
  end if;

  -- Release serial reservations
  update stock_units set
    status = 'in_stock',
    reserved_order_id = null,
    reserved_order_line_id = null,
    reserved_at = null,
    updated_at = now()
  where reserved_order_id = p_order_id;

  -- Cancel pick list & install jobs
  update pick_lists set status = 'cancelled', updated_at = now() where order_id = p_order_id;
  update jobs set status = 'cancelled', cancel_reason = p_reason, updated_at = now()
  where project_id = v_order.project_id and status in ('unscheduled', 'scheduled');

  update orders set
    status = 'cancelled',
    cancelled_at = now(),
    cancelled_by = p_actor,
    cancel_reason = p_reason,
    refund_due_paise = greatest(0, v_order.paid_paise - coalesce(p_retained_paise, 0)),
    updated_at = now()
  where id = p_order_id;

  if p_close_project then
    update projects set stage = 'cancelled', cancel_reason = p_reason, updated_at = now()
    where id = v_order.project_id;
  end if;

  perform fn_log(p_actor, 'order', p_order_id, 'cancel_order', v_order.status::text, 'cancelled', p_reason);

  return jsonb_build_object('ok', true);
end $$;

-- ============================================================================
-- 5. INVENTORY & SCANNING ENGINE (Scan rejection, Validation, Customer linking)
-- ============================================================================

-- Receive goods
create or replace function public.fn_receive_stock(
  p_actor uuid,
  p_supplier_id uuid,
  p_invoice_no text,
  p_invoice_date date,
  p_lines jsonb,
  p_idempotency_key uuid default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_item jsonb;
  v_prod products%rowtype;
  v_serial text;
  v_unit_id uuid;
begin
  perform fn_assert_role(p_actor, array['warehouse', 'manager', 'director']);

  for v_item in select * from jsonb_array_elements(p_lines)
  loop
    select * into v_prod from products where id = (v_item->>'product_id')::uuid;
    if not found then continue; end if;

    if v_prod.is_serialised then
      for v_serial in select * from jsonb_array_elements_text(v_item->'serials')
      loop
        v_serial := upper(trim(v_serial));
        insert into stock_units (product_id, serial_no, status, received_at)
        values (v_prod.id, v_serial, 'in_stock', now())
        returning id into v_unit_id;

        insert into stock_unit_costs (stock_unit_id, unit_cost_paise)
        values (v_unit_id, (v_item->>'unit_cost_paise')::bigint);
      end loop;
    else
      insert into bulk_stock (product_id, on_hand)
      values (v_prod.id, (v_item->>'qty')::numeric)
      on conflict (product_id) do update
      set on_hand = bulk_stock.on_hand + excluded.on_hand, updated_at = now();

      insert into stock_movements (product_id, movement_type, qty, reason, actor_id)
      values (v_prod.id, 'received', (v_item->>'qty')::numeric, 'Goods Receipt: ' || coalesce(p_invoice_no, 'Direct'), p_actor);
    end if;
  end loop;

  return jsonb_build_object('ok', true);
end $$;

-- Create Dispatch run
create or replace function public.fn_create_dispatch(
  p_actor uuid,
  p_pick_list_id uuid,
  p_vehicle text default null,
  p_driver text default null,
  p_driver_phone text default null,
  p_override_reason text default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_pick pick_lists%rowtype;
  v_disp_id uuid;
  v_disp_no text;
begin
  perform fn_assert_role(p_actor, array['warehouse', 'manager', 'director']);

  select * into v_pick from pick_lists where id = p_pick_list_id for update;
  if not found then raise exception 'NOT_FOUND: Pick list not found'; end if;

  if v_pick.dispatch_blocked and p_override_reason is null then
    raise exception 'DISPATCH_BLOCKED_PAYMENT: Dispatch is blocked until payment clearance';
  end if;

  v_disp_no := fn_next_doc_no('DSP');

  insert into dispatches (
    dispatch_no, order_id, pick_list_id, status, vehicle,
    driver_name, driver_phone
  ) values (
    v_disp_no, v_pick.order_id, p_pick_list_id, 'draft',
    p_vehicle, p_driver, p_driver_phone
  ) returning id into v_disp_id;

  update pick_lists set status = 'picking', updated_at = now() where id = p_pick_list_id;

  return jsonb_build_object('ok', true, 'dispatch_id', v_disp_id, 'dispatch_no', v_disp_no);
end $$;

-- Scan Dispatch Unit (Validates serial, rejects bad scans with scan_events audit)
create or replace function public.fn_scan_dispatch_unit(
  p_actor uuid,
  p_dispatch_id uuid,
  p_raw text,
  p_method text default 'camera',
  p_idem uuid default null,
  p_line_id uuid default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_disp dispatches%rowtype;
  v_serial text;
  v_unit stock_units%rowtype;
  v_order_line order_lines%rowtype;
  v_pick_line pick_list_lines%rowtype;
  v_result scan_result;
  v_message text;
begin
  perform fn_assert_role(p_actor, array['warehouse', 'manager', 'director']);

  select * into v_disp from dispatches where id = p_dispatch_id for update;
  if not found then raise exception 'NOT_FOUND: Dispatch not found'; end if;
  if v_disp.status not in ('draft', 'loading') then
    raise exception 'DISPATCH_CLOSED: Cannot scan units into dispatch that is %', v_disp.status;
  end if;

  v_serial := upper(regexp_replace(trim(p_raw), '\s+', '', 'g'));

  -- Find unit
  select * into v_unit from stock_units where serial_no = v_serial and deleted_at is null;

  if v_unit.id is null then
    v_result := 'rejected_unknown';
    v_message := 'Unknown serial number. Not found in stock catalogue.';
  elsif v_unit.status in ('dispatched', 'delivered', 'installed') then
    v_result := 'rejected_duplicate';
    v_message := 'Unit already dispatched/delivered previously.';
  elsif v_unit.status = 'reserved' and v_unit.reserved_order_id <> v_disp.order_id then
    v_result := 'rejected_reserved_other';
    v_message := 'Unit is reserved for a different customer order.';
  elsif not exists (select 1 from order_lines where order_id = v_disp.order_id and product_id = v_unit.product_id) then
    v_result := 'rejected_wrong_product';
    v_message := 'This product model is not required for this order.';
  elsif v_unit.status in ('damaged', 'rma', 'under_repair', 'scrapped') then
    v_result := 'rejected_bad_status';
    v_message := 'Unit is in bad status (' || v_unit.status || ') and cannot be dispatched.';
  else
    -- Find matching order line needing quantity
    select * into v_order_line from order_lines
    where order_id = v_disp.order_id and product_id = v_unit.product_id
      and (p_line_id is null or id = p_line_id)
      and qty_dispatched < qty
    limit 1;

    if v_order_line.id is null then
      v_result := 'rejected_other';
      v_message := 'Required quantity already fully scanned for this item.';
    else
      v_result := 'accepted';
      v_message := 'Serial verified and linked to customer order.';
    end if;
  end if;

  -- Log scan event (every attempt is permanently audited)
  insert into scan_events (
    dispatch_id, stock_unit_id, serial_input, result, message, actor_id, idempotency_key
  ) values (
    p_dispatch_id, v_unit.id, p_raw, v_result, v_message, p_actor, coalesce(p_idem, gen_random_uuid())
  );

  if v_result = 'accepted' then
    insert into dispatch_items (
      dispatch_id, order_line_id, stock_unit_id, product_id, serial_no, scanned_by
    ) values (
      p_dispatch_id, v_order_line.id, v_unit.id, v_unit.product_id, v_serial, p_actor
    );

    update stock_units set
      status = 'dispatched',
      dispatch_id = p_dispatch_id,
      updated_at = now()
    where id = v_unit.id;

    update order_lines set
      qty_dispatched = qty_dispatched + 1
    where id = v_order_line.id;

    update pick_list_lines set
      qty_picked = qty_picked + 1
    where pick_list_id = v_disp.pick_list_id and product_id = v_unit.product_id;

    update dispatches set status = 'loading', updated_at = now() where id = p_dispatch_id;

    return jsonb_build_object(
      'ok', true,
      'result', v_result,
      'serial', v_serial,
      'message', v_message
    );
  else
    return jsonb_build_object(
      'ok', false,
      'result', v_result,
      'serial', v_serial,
      'message', v_message
    );
  end if;
end $$;

-- Finalize Dispatch (Truck leaves)
create or replace function public.fn_finalize_dispatch(
  p_actor uuid,
  p_dispatch_id uuid,
  p_partial boolean default false,
  p_partial_reason text default null,
  p_idempotency_key uuid default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_disp dispatches%rowtype;
  v_line record;
begin
  perform fn_assert_role(p_actor, array['warehouse', 'manager', 'director']);

  select * into v_disp from dispatches where id = p_dispatch_id for update;
  if not found then raise exception 'NOT_FOUND: Dispatch not found'; end if;

  -- Decrement bulk stock ledger for non-serialized items
  for v_line in
    select ol.* from order_lines ol
    join products p on p.id = ol.product_id
    where ol.order_id = v_disp.order_id and not ol.is_serialised and p.tracks_stock
  loop
    update bulk_stock set
      on_hand = on_hand - v_line.qty,
      reserved = greatest(0, reserved - v_line.qty),
      updated_at = now()
    where product_id = v_line.product_id;

    insert into stock_movements (product_id, movement_type, qty, order_id, order_line_id, reason, actor_id)
    values (v_line.product_id, 'issued', v_line.qty, v_disp.order_id, v_line.id, 'Dispatched in ' || v_disp.dispatch_no, p_actor);

    update order_lines set qty_dispatched = qty where id = v_line.id;
  end loop;

  update dispatches set
    status = 'in_transit',
    departed_at = now(),
    updated_at = now()
  where id = p_dispatch_id;

  update orders set status = 'in_fulfilment', updated_at = now() where id = v_disp.order_id;

  perform fn_log(p_actor, 'dispatch', p_dispatch_id, 'finalize_dispatch', v_disp.status::text, 'in_transit');

  return jsonb_build_object('ok', true, 'status', 'in_transit');
end $$;

-- Automation A10: Delivery Confirmation (Creates Assets and Starts Warranty Clocks)
create or replace function public.fn_confirm_delivery(
  p_actor uuid,
  p_dispatch_id uuid,
  p_method text default 'signature',
  p_otp text default null,
  p_proof_path text default null,
  p_name text default 'Customer',
  p_override_reason text default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_disp dispatches%rowtype;
  v_order orders%rowtype;
  v_project projects%rowtype;
  v_item record;
  v_prod products%rowtype;
  v_asset_id uuid;
  v_warranty_m int;
  v_start_date date;
  v_end_date date;
begin
  perform fn_assert_role(p_actor, array['warehouse', 'technician', 'manager', 'director']);

  select * into v_disp from dispatches where id = p_dispatch_id for update;
  if not found then raise exception 'NOT_FOUND: Dispatch not found'; end if;

  select * into v_order from orders where id = v_disp.order_id for update;
  select * into v_project from projects where id = v_order.project_id;

  v_start_date := (now() at time zone 'Asia/Kolkata')::date;

  -- Create Assets and Start Warranty Clocks for each delivered serialised unit!
  for v_item in
    select di.* from dispatch_items di
    where di.dispatch_id = p_dispatch_id and not di.removed
  loop
    select * into v_prod from products where id = v_item.product_id;
    v_warranty_m := coalesce(v_prod.warranty_months, 24);
    v_end_date := (v_start_date + (v_warranty_m || ' months')::interval)::date;

    insert into assets (
      stock_unit_id, product_id, serial_no, customer_id, project_id, order_id,
      status, delivered_at, warranty_months, warranty_start, warranty_end
    ) values (
      v_item.stock_unit_id, v_item.product_id, v_item.serial_no, v_project.customer_id,
      v_project.id, v_order.id, 'delivered', now(), v_warranty_m, v_start_date, v_end_date
    ) returning id into v_asset_id;

    update stock_units set
      status = 'delivered',
      asset_id = v_asset_id,
      updated_at = now()
    where id = v_item.stock_unit_id;

    update dispatch_items set delivered_at = now() where id = v_item.id;
  end loop;

  update order_lines set qty_delivered = qty_dispatched where order_id = v_order.id;

  update dispatches set
    status = 'delivered',
    delivered_at = now(),
    updated_at = now()
  where id = p_dispatch_id;

  update orders set status = 'delivered', delivered_at = now(), updated_at = now() where id = v_order.id;
  update projects set stage = 'delivered', updated_at = now() where id = v_project.id;

  perform fn_log(p_actor, 'dispatch', p_dispatch_id, 'confirm_delivery', 'in_transit', 'delivered');

  return jsonb_build_object('ok', true, 'status', 'delivered');
end $$;

-- ============================================================================
-- 6. FIELD EXECUTION & INSTALLATION COMPLETION (Gates G14-G17)
-- ============================================================================

-- Submit Install Form (Checks power test, photos, signature)
create or replace function public.fn_submit_install(
  p_actor uuid,
  p_job_id uuid,
  p_payload jsonb,
  p_client_submission_id uuid default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_job jobs%rowtype;
  v_project projects%rowtype;
  v_report install_reports%rowtype;
  v_pass boolean;
  v_kw numeric;
  v_panels int;
begin
  perform fn_assert_role(p_actor, array['technician', 'manager', 'director']);

  select * into v_job from jobs where id = p_job_id for update;
  if not found then raise exception 'NOT_FOUND: Install job not found'; end if;
  select * into v_project from projects where id = v_job.project_id;

  v_pass := coalesce((p_payload->>'power_test_passed')::boolean, false);
  v_kw := (p_payload->>'system_kw_confirmed')::numeric;
  v_panels := (p_payload->>'panel_count_installed')::int;

  -- Gate G14: Power generation test must pass
  if not v_pass then
    raise exception 'POWER_TEST_FAILED: Cannot complete installation without verified power test generation';
  end if;

  insert into install_reports (
    job_id, project_id, system_kw_confirmed, panel_count_installed,
    power_test_passed, power_test_notes, extra_materials, signature_status,
    signature_path, signed_at, signed_by_name, client_submission_id
  ) values (
    p_job_id, v_job.project_id, v_kw, v_panels,
    v_pass, p_payload->>'power_test_notes', p_payload->>'extra_materials',
    case when p_payload->>'signature_path' is not null then 'signed'::signature_status else 'pending'::signature_status end,
    p_payload->>'signature_path',
    case when p_payload->>'signature_path' is not null then now() else null end,
    p_payload->>'signed_by_name',
    p_client_submission_id
  ) on conflict (job_id) do update set
    system_kw_confirmed = excluded.system_kw_confirmed,
    panel_count_installed = excluded.panel_count_installed,
    power_test_passed = excluded.power_test_passed,
    signature_status = excluded.signature_status,
    signature_path = coalesce(excluded.signature_path, install_reports.signature_path),
    signed_at = coalesce(excluded.signed_at, install_reports.signed_at),
    signed_by_name = coalesce(excluded.signed_by_name, install_reports.signed_by_name),
    updated_at = now()
  returning * into v_report;

  -- If signed -> Complete job & project installed stage!
  if v_report.signature_status = 'signed' then
    perform fn_complete_job(p_actor, p_job_id);
    return jsonb_build_object('ok', true, 'status', 'completed');
  else
    update jobs set status = 'awaiting_signature', updated_at = now() where id = p_job_id;
    return jsonb_build_object('ok', true, 'status', 'awaiting_signature');
  end if;
end $$;

-- Attach Signature to Install Report
create or replace function public.fn_attach_signature(
  p_actor uuid,
  p_job_id uuid,
  p_path text,
  p_name text,
  p_method text default 'on_device'
) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  update install_reports set
    signature_status = 'signed',
    signature_path = p_path,
    signed_by_name = p_name,
    signed_at = now(),
    updated_at = now()
  where job_id = p_job_id;

  perform fn_complete_job(p_actor, p_job_id);

  return jsonb_build_object('ok', true, 'status', 'completed');
end $$;

-- Automation A11: Complete Install Job
create or replace function public.fn_complete_job(
  p_actor uuid,
  p_job_id uuid
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_job jobs%rowtype;
  v_project projects%rowtype;
begin
  select * into v_job from jobs where id = p_job_id for update;
  select * into v_project from projects where id = v_job.project_id;

  update jobs set status = 'completed', actual_end = now(), updated_at = now() where id = p_job_id;
  update projects set stage = 'installed', installed_on = current_date, updated_at = now() where id = v_project.id;
  update assets set status = 'installed', installed_at = now(), updated_at = now() where project_id = v_project.id;
  update orders set status = 'completed', completed_at = now(), updated_at = now() where id = v_project.order_id;

  -- Generate final invoice
  perform fn_generate_order_invoice(p_actor, v_project.order_id);

  perform fn_log(p_actor, 'job', p_job_id, 'complete_job', v_job.status::text, 'completed');

  return jsonb_build_object('ok', true);
end $$;

-- ============================================================================
-- 7. SERVICE DESK & WARRANTY LOOKUP (< 5s resolution, free vs paid)
-- ============================================================================

-- Fast warranty check (< 5s SLA) by serial or phone
create or replace function public.fn_check_warranty(p_query text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_q text;
  v_res jsonb;
begin
  v_q := upper(regexp_replace(trim(p_query), '\s+', '', 'g'));

  select jsonb_build_object(
    'found', true,
    'asset_id', a.id,
    'serial_no', a.serial_no,
    'product_name', p.name,
    'customer_name', c.name,
    'customer_phone', c.phone_e164,
    'warranty_start', a.warranty_start,
    'warranty_end', a.warranty_end,
    'warranty_void', a.warranty_void,
    'status', case
      when a.warranty_void then 'void'
      when a.warranty_start is null then 'not_started'
      when a.warranty_end < current_date then 'expired'
      when a.warranty_end <= current_date + 60 then 'expiring_soon'
      else 'active'
    end,
    'is_in_warranty', (not a.warranty_void and a.warranty_end >= current_date)
  ) into v_res
  from assets a
  join products p on p.id = a.product_id
  join customers c on c.id = a.customer_id
  where a.serial_no = v_q or c.phone_e164 = p_query or c.phone_e164 = ('+91' || regexp_replace(p_query, '^\+?91', ''))
  limit 1;

  if v_res is null then
    return jsonb_build_object('found', false);
  else
    return v_res;
  end if;
end $$;

-- Create Service Ticket (Automatic warranty decision)
create or replace function public.fn_create_ticket(
  p_actor uuid,
  p_payload jsonb,
  p_idempotency_key uuid default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_ticket_id uuid;
  v_ticket_no text;
  v_asset assets%rowtype;
  v_customer customers%rowtype;
  v_decision warranty_decision := 'unknown';
  v_is_in_warranty boolean := false;
  v_repeat boolean := false;
begin
  perform fn_assert_role(p_actor, array['support', 'sales', 'manager', 'director']);

  if (p_payload->>'asset_id') is not null then
    select * into v_asset from assets where id = (p_payload->>'asset_id')::uuid;
  elsif (p_payload->>'serial_no') is not null then
    select * into v_asset from assets where serial_no = upper(trim(p_payload->>'serial_no'));
  end if;

  if v_asset.id is not null then
    select * into v_customer from customers where id = v_asset.customer_id;
    if v_asset.warranty_void then
      v_decision := 'void';
    elsif v_asset.warranty_end >= current_date then
      v_decision := 'in_warranty';
      v_is_in_warranty := true;
    else
      v_decision := 'out_of_warranty';
    end if;

    -- Check repeat complaints within 30 days (REQ-SVC-06)
    select exists (
      select 1 from tickets
      where asset_id = v_asset.id and created_at >= (now() - interval '30 days')
    ) into v_repeat;
  else
    select * into v_customer from customers where id = (p_payload->>'customer_id')::uuid;
  end if;

  v_ticket_no := fn_next_doc_no('TKT');

  insert into tickets (
    ticket_no, customer_id, project_id, asset_id,
    reported_by_name, reported_by_phone, issue_type, fault_code,
    description, priority, channel, warranty_decision,
    billing, is_repeat, sla_due_at, created_by
  ) values (
    v_ticket_no, v_customer.id, v_asset.project_id, v_asset.id,
    coalesce(p_payload->>'reported_by_name', v_customer.name),
    coalesce(p_payload->>'reported_by_phone', v_customer.phone_e164),
    p_payload->>'issue_type', p_payload->>'fault_code',
    coalesce(p_payload->>'description', 'Customer reported issue'),
    coalesce((p_payload->>'priority')::ticket_priority, 'normal'),
    coalesce((p_payload->>'channel')::ticket_channel, 'phone'),
    v_decision,
    case when v_is_in_warranty then 'not_applicable'::ticket_billing else 'pending'::ticket_billing end,
    v_repeat, (now() + interval '48 hours'), p_actor
  ) returning id into v_ticket_id;

  insert into ticket_events (ticket_id, event_type, note, actor_id)
  values (v_ticket_id, 'created', 'Ticket created. Warranty decision: ' || v_decision::text, p_actor);

  perform fn_log(p_actor, 'ticket', v_ticket_id, 'create_ticket', null, 'open');

  return jsonb_build_object(
    'ok', true,
    'ticket_id', v_ticket_id,
    'ticket_no', v_ticket_no,
    'warranty_decision', v_decision,
    'is_repeat', v_repeat
  );
end $$;

-- Customer Confirms Ticket Fixed (REQ-SVC-04 gate to close ticket)
create or replace function public.fn_confirm_ticket(
  p_actor uuid,
  p_ticket_id uuid,
  p_method text default 'phone',
  p_note text default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_ticket tickets%rowtype;
begin
  select * into v_ticket from tickets where id = p_ticket_id for update;
  if not found then raise exception 'NOT_FOUND: Ticket not found'; end if;

  update tickets set
    status = 'closed',
    customer_confirmed_at = now(),
    customer_confirmation_method = p_method,
    updated_at = now()
  where id = p_ticket_id;

  insert into ticket_events (ticket_id, event_type, note, actor_id)
  values (p_ticket_id, 'customer_confirmed', 'Confirmed resolved via ' || p_method || '. ' || coalesce(p_note, ''), p_actor);

  perform fn_log(p_actor, 'ticket', p_ticket_id, 'close_ticket', v_ticket.status::text, 'closed');

  return jsonb_build_object('ok', true, 'status', 'closed');
end $$;

-- ============================================================================
-- 8. INVOICE GENERATION
-- ============================================================================

-- Generate Tax Invoice for Order
create or replace function public.fn_generate_order_invoice(
  p_actor uuid,
  p_order_id uuid
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_order orders%rowtype;
  v_project projects%rowtype;
  v_customer customers%rowtype;
  v_inv_id uuid;
  v_inv_no text;
  v_line record;
  v_line_no int := 0;
begin
  select * into v_order from orders where id = p_order_id;
  select * into v_project from projects where id = v_order.project_id;
  select * into v_customer from customers where id = v_project.customer_id;

  select id into v_inv_id from invoices where order_id = p_order_id and kind = 'order';
  if v_inv_id is not null then
    return jsonb_build_object('ok', true, 'invoice_id', v_inv_id, 'already_exists', true);
  end if;

  v_inv_no := fn_next_doc_no('INV');

  insert into invoices (
    invoice_no, kind, status, project_id, order_id, customer_id,
    customer_name, customer_address, customer_gstin, invoice_date,
    subtotal_paise, taxable_paise, gst_paise, total_paise, paid_paise
  ) values (
    v_inv_no, 'order', 'issued', v_project.id, p_order_id, v_customer.id,
    v_customer.name, v_order.delivery_address, v_customer.gstin, current_date,
    v_order.taxable_paise, v_order.taxable_paise, v_order.gst_paise, v_order.total_paise, v_order.paid_paise
  ) returning id into v_inv_id;

  for v_line in select * from order_lines where order_id = p_order_id order by line_no
  loop
    v_line_no := v_line_no + 1;
    insert into invoice_lines (
      invoice_id, line_no, product_id, sku, description,
      qty, uom, unit_price_paise, gst_rate_bp,
      line_taxable_paise, line_gst_paise, line_total_paise
    ) values (
      v_inv_id, v_line_no, v_line.product_id, v_line.sku, v_line.description,
      v_line.qty, v_line.uom, v_line.unit_price_paise, v_line.gst_rate_bp,
      v_line.line_taxable_paise, v_line.line_gst_paise, v_line.line_total_paise
    );
  end loop;

  return jsonb_build_object('ok', true, 'invoice_id', v_inv_id, 'invoice_no', v_inv_no);
end $$;

-- User Role Setter
create or replace function public.fn_set_user_role(
  p_actor uuid,
  p_target_profile_id uuid,
  p_new_role app_role
) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  perform fn_assert_role(p_actor, array['director']);

  update profiles set role = p_new_role, updated_at = now() where id = p_target_profile_id;
  perform fn_log(p_actor, 'profile', p_target_profile_id, 'set_role', null, p_new_role::text);

  return jsonb_build_object('ok', true);
end $$;
