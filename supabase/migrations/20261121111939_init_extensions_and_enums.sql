-- Migration 0001: Extensions and Enums
-- Solar Installation Management System

-- Enable required extensions
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;
create extension if not exists btree_gist;
create extension if not exists citext;

-- Create app schema for helper functions
create schema if not exists app;

-- Enums (alphabetical order)
create type adjustment_status as enum ('pending','approved','rejected');
create type app_role as enum ('director','manager','sales','technician','warehouse','support','accounts');
create type customer_type as enum ('residential','commercial','industrial');
create type dispatch_status as enum ('draft','loading','in_transit','delivered','partially_delivered','returned','cancelled');
create type feasibility as enum ('feasible','feasible_with_changes','not_feasible');
create type invoice_kind as enum ('order','service','variation','credit_note');
create type invoice_status as enum ('draft','issued','partially_paid','paid','void');
create type job_status as enum ('unscheduled','scheduled','in_progress','awaiting_signature','completed','on_hold','cancelled');
create type job_type as enum ('survey','install','service');
create type lead_source as enum ('web','call','whatsapp','walk_in','referral','other');
create type lead_status as enum ('new','contacting','follow_up','converted','unreachable','disqualified','lost');
create type movement_type as enum ('received','reserved','unreserved','issued','returned','adjusted_up','adjusted_down');
create type order_pay_status as enum ('unpaid','partial','advance_met','paid','overpaid');
create type order_status as enum ('pending_payment','confirmed','in_fulfilment','delivered','completed','cancelled');
create type payment_kind as enum ('advance','balance','full','service','refund');
create type payment_method as enum ('upi','cash','bank_transfer','cheque','card','other');
create type payment_status as enum ('pending','received','failed','reversed','bounced');
create type pay_model as enum ('hourly','per_job','salaried');
create type pay_period_status as enum ('open','locked','approved','paid');
create type photo_kind as enum ('survey_roof','survey_meter','survey_db','survey_obstruction',
                                'before','panels','inverter','earthing','db_box','meter',
                                'serial_label','power_test','finished','other');
create type pick_status as enum ('pending','picking','packed','dispatched','cancelled');
create type product_category as enum ('panel','inverter','battery','charge_controller','structure',
                                      'cable','protection','earthing','connector','junction_box',
                                      'accessory','service');
create type project_stage as enum ('qualified','survey_scheduled','survey_submitted','survey_approved',
                                   'quoted','awaiting_payment','order_confirmed','dispatched',
                                   'delivered','installed','commissioned','completed','on_hold','cancelled');
create type qty_rounding as enum ('ceil','round','none');
create type qty_rule as enum ('fixed','per_kw','panel_count','per_panel','cable_dc_m','cable_ac_m');
create type quote_status as enum ('draft','pending_approval','approved','sent','accepted',
                                  'rejected','expired','superseded','cancelled');
create type roof_direction as enum ('north','north_east','east','south_east','south',
                                    'south_west','west','north_west','flat');
create type roof_type as enum ('rcc_flat','sloped_metal','sloped_tile','asbestos','other');
create type scan_result as enum ('accepted','rejected_unknown','rejected_wrong_product',
                                 'rejected_wrong_order','rejected_reserved_other',
                                 'rejected_duplicate','rejected_bad_status','rejected_other');
create type share_kind as enum ('quote','tracker','asset','report','delivery','signature');
create type signature_status as enum ('pending','signed','refused','remote_pending');
create type stock_unit_status as enum ('in_stock','reserved','dispatched','delivered','installed',
                                       'returned','under_repair','damaged','rma','replaced','scrapped');
create type subsidy_status as enum ('not_applicable','registration_pending','awaiting_installation',
                                    'docs_pending','inspection_pending','commissioned',
                                    'claim_pending','credited','rejected');
create type survey_status as enum ('draft','submitted','approved','rejected','rework_requested');
create type system_type as enum ('on_grid','off_grid');
create type ticket_billing as enum ('not_applicable','pending','invoiced','paid','waived');
create type ticket_channel as enum ('phone','whatsapp','web','qr','walk_in','other');
create type ticket_priority as enum ('low','normal','high','urgent');
create type ticket_status as enum ('open','triaged','visit_scheduled','in_progress','waiting_part',
                                   'rma','awaiting_confirmation','closed','cancelled');
create type variation_status as enum ('pending','approved','rejected');
create type warranty_decision as enum ('unknown','in_warranty','out_of_warranty','goodwill','void');
