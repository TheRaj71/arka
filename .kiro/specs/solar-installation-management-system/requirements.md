# Requirements Document

## Introduction

This document specifies the requirements for the Solar Installation Management System (Solar IMS), a comprehensive platform for SunPower Solutions to manage their end-to-end rooftop solar installation business. The system replaces scattered WhatsApp communications, paper registers, and manual quote generation with an integrated digital platform that tracks every stage from initial customer enquiry through warranty and service.

The system implements the "golden thread" design: Serial number → Asset → Warranty clock → Service ticket → Job cost/profit. This ensures complete traceability from inventory receipt through customer delivery, installation, and ongoing service.

## Glossary

- **System**: The Solar Installation Management System (Solar IMS)
- **Lead**: A potential customer who has submitted an enquiry
- **Project**: The primary entity tracking one customer's installation from qualification through completion
- **Survey**: A technician site visit to measure roof characteristics and feasibility
- **Quote**: A formal price proposal with bill of materials generated from a package template
- **Order**: A confirmed customer commitment created when a quote is accepted
- **Pick_List**: A warehouse packing list automatically generated from a confirmed order
- **Dispatch**: A delivery run with scanned serial numbers linking physical units to customers
- **Asset**: A delivered serialised unit (inverter, panel, battery) owned by a customer with warranty tracking
- **Ticket**: A service complaint or warranty claim
- **BOM**: Bill of Materials - the parts list for a quote or order
- **Template**: A reusable package definition (e.g. "3 kW On-Grid") that generates a complete BOM
- **Stock_Unit**: A physical serialised item tracked individually in inventory
- **Bulk_Item**: An item tracked by quantity (cables, connectors, hardware)
- **Reservation**: Stock earmarked for a confirmed order, preventing double allocation
- **Gate**: A blocking rule that prevents progression until prerequisites are met
- **Automation**: A side-effect that occurs automatically within the same transaction
- **RPC**: Remote Procedure Call - a Postgres function called from the application
- **Subsidy**: Government financial assistance (DBT - Direct Benefit Transfer) paid to the customer
- **DCR**: Domestic Content Requirement - panels must be India-manufactured for subsidy eligibility
- **Paise**: 1/100th of a rupee; all monetary values are stored as integer paise
- **IST**: Indian Standard Time (UTC+05:30)

## Technology Stack Requirements

### Stack Foundation

**Database & Backend:** Supabase Postgres with Row Level Security (RLS) enabled on EVERY table, Supabase Storage with private buckets only, Supabase Realtime (RLS-aware) for warehouse/support/notifications.

**Authentication:** Clerk staff-only authentication integrated as Supabase third-party auth provider (NOT the deprecated JWT template flow). Three-layer security: (1) Next.js middleware route guard, (2) server action role check, (3) RLS policies + SQL function role assertion.

**Framework:** Next.js App Router with TypeScript strict mode, Server Components for reads, Server Actions for writes, Route Handlers for webhooks/PDF/public APIs.

**UI Libraries:** Tailwind CSS, shadcn/ui components, lucide-react icons, sonner for toasts, @tanstack/react-table for tables, recharts for charts.

**Forms & Validation:** react-hook-form with zod schemas shared between client and server validation.

**Documents & Scanning:** @react-pdf/renderer (Node runtime) with Noto Sans font registered for ₹ glyph rendering, @zxing/browser for barcode scanning with native BarcodeDetector fallback, manual entry always available.

**Digital Signatures:** react-signature-canvas rendering PNG signatures stored in Supabase Storage.

**Offline PWA:** Serwist (@serwist/next) service worker with IndexedDB (idb) for offline-first field operations on /field/** routes only.

**Utilities:** libphonenumber-js for E.164 phone normalization (default region IN), date-fns with @date-fns/tz for IST timezone handling, nanoid for token generation.

### Acceptance Criteria

1. THE System SHALL use Supabase Postgres with RLS enabled on every business table
2. THE System SHALL integrate Clerk as a Supabase third-party auth provider
3. THE System SHALL implement three-layer authorization: middleware, server action, and database RLS
4. THE System SHALL register Noto Sans font family for PDF generation to render ₹ symbol correctly
5. THE System SHALL provide manual entry fallback for all barcode scanning operations
6. THE System SHALL use libphonenumber-js to normalize phone numbers to E.164 format with default region IN

## Requirements

### Requirement 1: Public Lead Capture

**User Story:** As a potential customer, I want to submit an enquiry through a web form, so that SunPower Solutions can contact me about a solar installation.

#### Acceptance Criteria

1. WHEN a potential customer submits the web form, THE System SHALL create a lead record within 2 seconds
2. THE System SHALL normalize the phone number to E.164 format before storing
3. WHEN a phone number matches an existing open lead, THE System SHALL append a duplicate enquiry activity instead of creating a new lead
4. WHEN a new lead is created, THE System SHALL assign an owner via round-robin among active sales users
5. WHEN a lead is created, THE System SHALL notify the assigned owner within 5 seconds
6. THE System SHALL validate that the phone number matches the pattern `^\+[1-9][0-9]{7,14}$`
7. THE System SHALL generate a unique lead number in the format `LD-YYMM-NNNNN`
8. WHEN the assigned owner is determined, THE System SHALL select the active sales user with the fewest open leads
9. IF no sales users are active, THEN THE System SHALL notify all managers of an unassigned lead

### Requirement 2: Lead Management and Qualification

**User Story:** As a sales representative, I want to manage my lead queue and qualify potential customers, so that viable leads progress to projects.

#### Acceptance Criteria

1. THE System SHALL display leads in descending order by updated timestamp
2. WHEN a sales representative views their queue, THE System SHALL show only leads where they are the owner or all leads if they are a manager
3. THE System SHALL support lead status transitions: new → contacting → follow_up → converted
4. WHEN a call outcome is logged, THE System SHALL increment the attempt count for outcomes of no_answer or busy
5. WHEN attempt count exceeds 5, THE System SHALL suggest unreachable status
6. THE System SHALL prevent hard deletion of lead records
7. WHEN a lead is closed, THE System SHALL require a close reason from the set (lost, disqualified, unreachable)
8. THE System SHALL capture qualification checklist data including shadow_free_area_sqft, monthly_bill_paise, grid_connection_suitable, and roof_ownership
9. WHEN all required checklist fields are complete, THE System SHALL enable the qualify action
10. WHEN a lead is qualified, THE System SHALL create a project record and a survey job automatically

### Requirement 3: Survey Scheduling and Submission

**User Story:** As an operations manager, I want to schedule surveys and review submissions, so that we have accurate site data before quoting.

#### Acceptance Criteria

1. WHEN a project is created, THE System SHALL create an unscheduled survey job
2. WHEN a survey job is scheduled, THE System SHALL verify the assigned technician has no overlapping scheduled jobs
3. THE System SHALL prevent scheduling if the technician would be double-booked
4. WHEN a technician submits a survey, THE System SHALL validate that at least 2 roof photos, 1 meter photo, and 1 DB photo are attached
5. WHEN a technician submits a survey, THE System SHALL validate that required fields (roof_direction, roof_type, shadow_free_area_sqft, cable_dc_m, cable_ac_m, feasibility, recommended_kw) are populated
6. WHEN a survey is submitted, THE System SHALL transition the survey status to submitted and notify all managers
7. THE System SHALL support manager review decisions: approve, rework, resurvey, close_unfeasible
8. WHEN a manager approves a survey, THE System SHALL transition the project stage to survey_approved
9. WHEN a manager requests rework, THE System SHALL reopen the survey job to in_progress status
10. WHEN a manager requests resurvey, THE System SHALL create a new survey job with revision incremented

### Requirement 4: Quote Generation Gate

**User Story:** As a sales representative, I want the system to prevent quote creation without an approved survey, so that all quotes are based on verified site data.

#### Acceptance Criteria

1. THE Quote_Creation_Function SHALL reject quote creation if the project does not have a survey with status approved
2. THE Quote_Creation_Function SHALL return error code SURVEY_NOT_APPROVED when the gate is violated
3. WHEN the latest survey is older than 120 days, THE Quote_Creation_Function SHALL reject creation unless a manager provides an override reason
4. WHEN the latest survey is stale, THE Quote_Creation_Function SHALL return error code SURVEY_STALE
5. THE System SHALL display the quote creation button as disabled until the survey is approved
6. WHEN a survey is approved, THE System SHALL enable the quote creation button for the project owner and managers

### Requirement 5: Package Template BOM Generation

**User Story:** As a sales representative, I want to select a package template and have the BOM auto-generated, so that I don't miss any required components.

#### Acceptance Criteria

1. THE System SHALL provide 10 package templates: 1-5 kW for both On-Grid and Off-Grid system types
2. WHEN a template is selected, THE System SHALL generate quote lines for all template items
3. THE System SHALL calculate panel count as ceil(capacity_kw × 1000 ÷ panel_wattage_w)
4. WHEN quantity rule is per_panel, THE System SHALL multiply qty_value by the calculated panel count
5. WHEN quantity rule is cable_dc_m, THE System SHALL multiply the survey cable_dc_m by qty_value and apply rounding
6. WHEN quantity rule is cable_ac_m, THE System SHALL multiply the survey cable_ac_m by qty_value and apply rounding
7. WHEN quantity rule is per_kw, THE System SHALL multiply capacity_kw by qty_value
8. WHEN rounding is ceil, THE System SHALL round the calculated quantity up to the nearest integer
9. THE System SHALL filter template items by roof type when when_roof_types is specified
10. THE System SHALL freeze product prices from the catalogue at quote creation time

### Requirement 6: Quote Pricing and Subsidy Calculation

**User Story:** As a sales representative, I want quotes to show accurate pricing with subsidy estimation, so that residential customers understand their net cost.

#### Acceptance Criteria

1. THE System SHALL calculate subtotal_paise as the sum of all line subtotals before discount
2. THE System SHALL calculate taxable_paise as subtotal_paise minus discount_paise
3. THE System SHALL calculate line GST as line_taxable_paise multiplied by gst_rate_bp divided by 10000
4. THE System SHALL calculate total_paise as taxable_paise plus gst_paise
5. WHEN the project is residential and on-grid, THE System SHALL set subsidy_eligible to true
6. WHEN subsidy_eligible is true and all panels have is_dcr true, THE System SHALL calculate subsidy according to tier rules
7. THE System SHALL apply subsidy tier 1 of 3000000 paise per kW for the first 2 kW
8. THE System SHALL apply subsidy tier 2 of 1800000 paise per kW for capacity between 2 and 3 kW
9. THE System SHALL cap subsidy_paise at 7800000
10. THE System SHALL calculate net_cost_paise as total_paise minus subsidy_paise
11. WHEN subsidy_eligible is true and any panel has is_dcr false, THE System SHALL return error code DCR_REQUIRED

### Requirement 7: Quote Approval Gate

**User Story:** As an operations manager, I want to approve quotes that exceed discount or margin limits, so that we maintain profitability.

#### Acceptance Criteria

1. WHEN a quote is finalized, THE System SHALL calculate discount percentage as (discount_paise ÷ subtotal_paise) × 100
2. WHEN discount percentage exceeds 3 percent, THE System SHALL set approval_required to true
3. WHEN quote margin falls below 12 percent, THE System SHALL set approval_required to true
4. WHEN approval_required is true, THE System SHALL transition quote status to pending_approval
5. WHEN approval_required is false, THE System SHALL transition quote status to approved
6. THE System SHALL prevent sending a quote unless status is approved
7. WHEN a manager approves a quote, THE System SHALL transition status from pending_approval to approved
8. WHEN a manager rejects a quote, THE System SHALL transition status from pending_approval to draft with the rejection reason

### Requirement 8: Quote Acceptance and Order Creation

**User Story:** As a customer, I want to accept a quote through a secure link, so that I can proceed with my solar installation.

#### Acceptance Criteria

1. WHEN a quote is sent, THE System SHALL generate a unique unguessable token
2. THE System SHALL store only the SHA-256 hash of the token concatenated with TOKEN_PEPPER
3. THE System SHALL create a share_link record with kind quote and expiration set to valid_until plus 3 days
4. THE System SHALL provide a public URL in the format /q/[token]
5. WHEN a customer accesses the quote link, THE System SHALL verify the token hash matches and link is not expired or revoked
6. THE System SHALL display customer name, quote lines with descriptions and amounts, subtotal, GST, total, and subsidy information
7. THE System SHALL hide all cost and margin information from the customer view
8. WHEN a customer clicks Accept, THE System SHALL create an order with status pending_payment
9. WHEN a customer clicks Accept, THE System SHALL copy frozen quote line details to order lines
10. WHEN a customer clicks Accept, THE System SHALL transition the project stage to awaiting_payment
11. WHEN an order is created, THE System SHALL calculate advance_required_paise as 50 percent of total_paise
12. WHEN an order is created, THE System SHALL notify the sales owner and accounts team

### Requirement 9: Payment Recording and Order Confirmation Gate

**User Story:** As an accounts staff member, I want to record customer payments and have orders auto-confirm when advance is met, so that operations can begin automatically.

#### Acceptance Criteria

1. THE System SHALL accept payment records with amount_paise, method, reference, and received_at
2. THE System SHALL validate amount_paise is greater than zero
3. THE System SHALL enforce uniqueness on the combination of method and reference for non-null references
4. THE System SHALL prevent duplicate payment recording via idempotency_key unique constraint
5. WHEN a payment is recorded, THE System SHALL call fn_refresh_order_payment to recalculate paid_paise
6. WHEN paid_paise becomes greater than or equal to advance_required_paise, THE System SHALL automatically call fn_confirm_order
7. THE fn_confirm_order function SHALL transition order status from pending_payment to confirmed
8. THE fn_confirm_order function SHALL create a pick_list record with order details
9. THE fn_confirm_order function SHALL create an unscheduled install job
10. THE fn_confirm_order function SHALL call fn_reserve_order_stock to reserve inventory atomically
11. THE fn_confirm_order function SHALL transition project stage to order_confirmed
12. THE fn_confirm_order function SHALL notify warehouse, crew lead, sales owner, and managers

### Requirement 10: Atomic Stock Reservation

**User Story:** As a warehouse manager, I want stock to be reserved automatically when orders confirm, so that we never double-allocate inventory.

#### Acceptance Criteria

1. THE fn_reserve_order_stock function SHALL acquire an advisory lock per product_id to serialize concurrent reservations
2. FOR ALL order lines requiring stock, THE System SHALL process products in deterministic order by product_id
3. WHEN a product is serialised, THE System SHALL update stock_units status from in_stock to reserved using FIFO ordering by received_at
4. WHEN a product is bulk, THE System SHALL increment bulk_stock reserved quantity and insert a stock_movement record
5. THE System SHALL update order_line qty_reserved with the actual quantity reserved
6. WHEN available quantity is less than required quantity, THE System SHALL reserve the available quantity and flag a backorder
7. WHEN backorders exist, THE System SHALL update pick_list notes with shortage details
8. WHEN backorders exist, THE System SHALL notify managers and warehouse of shortages
9. THE System SHALL never allow bulk_stock reserved to exceed on_hand
10. THE System SHALL prevent negative stock through check constraints on bulk_stock

### Requirement 11: Dispatch Scanning and Validation

**User Story:** As a warehouse operator, I want to scan serial numbers and have the system validate them, so that we ship the correct items to the right customer.

#### Acceptance Criteria

1. THE System SHALL normalize serial input by converting to uppercase and trimming whitespace
2. WHEN a serial is scanned, THE System SHALL look up stock_units by normalized serial_no and product_id matching the dispatch order
3. WHEN no matching stock_unit is found, THE System SHALL return result rejected_unknown
4. WHEN the stock_unit product does not match any order line product, THE System SHALL return result rejected_wrong_product
5. WHEN the stock_unit is reserved for a different order, THE System SHALL return result rejected_reserved_other
6. WHEN the stock_unit status is dispatched, delivered, or installed, THE System SHALL return result rejected_duplicate
7. WHEN the stock_unit status is damaged, rma, under_repair, scrapped, or replaced, THE System SHALL return result rejected_bad_status
8. WHEN the stock_unit passes all validations, THE System SHALL insert a dispatch_item record
9. WHEN the stock_unit passes all validations, THE System SHALL transition stock_unit status to dispatched
10. THE System SHALL log every scan attempt with result and timestamp in scan_events regardless of outcome
11. THE System SHALL support idempotent scanning via client-provided idempotency_key

### Requirement 12: Dispatch Finalization and Cost Posting

**User Story:** As a warehouse manager, I want to finalize dispatches and have costs automatically posted, so that job profitability tracking is accurate.

#### Acceptance Criteria

1. WHEN a dispatch is finalized, THE System SHALL verify all required serialised units are scanned
2. THE System SHALL allow partial dispatch with manager reason when not all units are scanned
3. WHEN a dispatch is finalized, THE System SHALL insert stock_movement records with movement type issued for bulk items
4. THE System SHALL decrement bulk_stock on_hand and reserved quantities by dispatched amounts
5. FOR ALL dispatched serialised units, THE System SHALL create project_costs records with the unit_cost_paise from stock_unit_costs
6. FOR ALL dispatched bulk items, THE System SHALL create project_costs records with the current average cost from product_costs
7. THE System SHALL enforce idempotency on cost posting using (source_type, source_id) unique constraint
8. WHEN all order lines are dispatched, THE System SHALL transition order status to in_fulfilment
9. WHEN a dispatch is finalized, THE System SHALL auto-issue the order invoice if the setting invoice.auto_issue_at equals dispatch
10. THE System SHALL notify sales owner and crew lead when dispatch is finalized

### Requirement 13: Delivery Confirmation and Warranty Initiation

**User Story:** As a delivery person, I want to confirm delivery and have warranties start automatically, so that customer protection begins immediately.

#### Acceptance Criteria

1. THE System SHALL support delivery confirmation methods: otp, signature, photo, staff_override
2. WHEN method is otp, THE System SHALL validate the OTP hash matches and is not expired
3. WHEN method is otp, THE System SHALL allow maximum 5 attempts before locking
4. WHEN method is staff_override, THE System SHALL require manager role and override reason
5. FOR ALL dispatched stock_units that are not removed, THE System SHALL create an asset record on delivery confirmation
6. THE System SHALL copy serial_no and product_id to the asset record
7. THE System SHALL snapshot warranty_months from the product master to the asset
8. WHEN the warranty start trigger setting equals delivery, THE System SHALL set warranty_start to the current IST date
9. THE System SHALL calculate warranty_end as warranty_start plus warranty_months
10. THE System SHALL transition stock_unit status from dispatched to delivered
11. THE System SHALL update order_lines qty_delivered
12. WHEN all order line quantities are delivered, THE System SHALL transition order status to delivered
13. WHEN all order line quantities are delivered, THE System SHALL transition project stage to delivered
14. THE System SHALL create asset share_links for QR code generation
15. THE System SHALL notify crew lead and sales owner that installation can begin

### Requirement 14: Installation Job Gates

**User Story:** As a field technician, I want to complete installation forms with all required data, so that jobs close automatically when criteria are met.

#### Acceptance Criteria

1. THE System SHALL prevent starting an install job unless the order status is delivered
2. WHEN a technician starts a job, THE System SHALL create an open time_entry record
3. THE System SHALL prevent overlapping time entries for the same profile via exclusion constraint
4. WHEN an install is submitted, THE System SHALL validate that power_test_passed is true
5. WHEN an install is submitted, THE System SHALL validate that all required photo kinds are present
6. THE System SHALL require photo kinds: panels, inverter, earthing, db_box, meter, power_test, finished
7. WHEN signature_status is not signed, THE System SHALL transition job status to awaiting_signature instead of completed
8. WHEN signature_status is signed and all other gates pass, THE System SHALL transition job status to completed
9. THE System SHALL support signature methods: on_device, remote_link, otp
10. WHEN signature_status is refused, THE System SHALL flag the job as disputed
11. THE System SHALL allow manager resolution of signature disputes with evidence
12. THE System SHALL close all open time_entries when installation is submitted

### Requirement 15: Installation Completion Automation

**User Story:** As an accounts staff member, I want invoices and subsidy checklists to generate automatically when installation completes, so that I can finalize the project quickly.

#### Acceptance Criteria

1. WHEN an install job status transitions to completed, THE System SHALL transition all delivered assets to installed status
2. WHEN warranty start trigger equals installation, THE System SHALL set asset warranty_start to the install completion date
3. THE System SHALL transition stock_unit status to installed for all units in the installation
4. THE System SHALL transition order status to completed
5. THE System SHALL transition project stage to installed
6. WHEN the project stage becomes installed, THE System SHALL auto-issue the order invoice if invoice.auto_issue_at equals install
7. WHEN the project is subsidy eligible, THE System SHALL refresh the subsidy checklist and transition subsidy status to docs_pending
8. THE System SHALL notify accounts, sales owner, and managers that the installation is complete
9. WHEN installed_kw differs from the quoted capacity, THE System SHALL prevent invoice issuance until a variation is approved
10. THE System SHALL calculate job profit when all cost data is available

### Requirement 16: Support Search and Warranty Lookup

**User Story:** As a support staff member, I want to search by customer phone or serial number and see warranty status instantly, so that I can quickly triage service requests.

#### Acceptance Criteria

1. THE fn_search_support function SHALL accept a query string parameter
2. THE System SHALL search assets.serial_no using trigram similarity index
3. THE System SHALL search customers.phone_e164 with suffix matching and trigram index
4. THE System SHALL search customers.name using trigram similarity index
5. THE System SHALL search tickets.ticket_no for exact matches
6. THE System SHALL search projects.project_no for exact matches
7. THE System SHALL return unified results ordered by relevance within 300 milliseconds
8. THE System SHALL compute warranty status as active, expiring_soon, expired, or void
9. WHEN warranty_end is more than 60 days in the future and warranty_void is false, THE System SHALL return status active
10. WHEN warranty_end is within 60 days and warranty_void is false, THE System SHALL return status expiring_soon
11. WHEN warranty_end is in the past, THE System SHALL return status expired
12. WHEN warranty_void is true, THE System SHALL return status void

### Requirement 17: Ticket Creation and Warranty Decision

**User Story:** As a support staff member, I want tickets to automatically determine warranty coverage, so that billing is correct from the start.

#### Acceptance Criteria

1. WHEN a ticket is created, THE System SHALL resolve the asset by serial number or customer
2. THE System SHALL call fn_compute_warranty for the associated asset
3. THE System SHALL store the warranty decision and basis snapshot in the ticket
4. WHEN warranty status is active, THE System SHALL set warranty_decision to in_warranty and billing to not_applicable
5. WHEN warranty status is expired or void, THE System SHALL set warranty_decision to out_of_warranty and billing to pending
6. THE System SHALL detect repeat complaints when the same asset has a ticket within 30 days
7. WHEN a repeat is detected, THE System SHALL set is_repeat to true and link repeat_of_ticket_id
8. THE System SHALL suggest fault codes based on issue_type
9. THE System SHALL calculate sla_due_at based on priority: high 24 hours, normal 72 hours
10. THE System SHALL assign tickets round-robin to active support users
11. THE System SHALL notify the assigned support owner

### Requirement 18: Service Invoice Auto-Generation

**User Story:** As a technician, I want service invoices to generate automatically when I complete out-of-warranty work, so that billing happens without delay.

#### Acceptance Criteria

1. WHEN ticket parts are added, THE System SHALL determine billable flag from the ticket warranty_decision
2. WHEN warranty_decision is out_of_warranty, THE System SHALL set billable to true
3. WHEN billable is true, THE System SHALL copy the current product price to unit_price_paise
4. WHEN ticket labour is added, THE System SHALL determine billable flag from warranty_decision
5. WHEN billable is true, THE System SHALL use the billing rate from settings for rate_paise_per_hour
6. WHEN a technician marks work done, THE System SHALL close all open time entries for that ticket
7. WHEN billable parts or labour exist, THE System SHALL create a service invoice with kind service
8. THE System SHALL auto-issue the service invoice when work is marked done
9. THE System SHALL calculate invoice lines from ticket_parts and ticket_labour
10. THE System SHALL transition ticket status to awaiting_confirmation
11. THE System SHALL notify support and accounts if an invoice was created

### Requirement 19: Ticket Closure Gate

**User Story:** As a support manager, I want tickets to require customer confirmation before closing, so that we ensure customer satisfaction.

#### Acceptance Criteria

1. THE System SHALL prevent ticket status transition to closed unless customer_confirmed_at is populated
2. THE System SHALL support confirmation methods: phone, otp, signature, link, in_person
3. WHEN confirmation method is link, THE System SHALL send a unique token link to the customer
4. THE System SHALL allow customer confirmation via public function fn_confirm_ticket
5. WHEN a customer confirms, THE System SHALL transition ticket status to closed
6. WHEN a customer confirms, THE System SHALL transition any under_repair assets back to installed
7. WHEN a customer confirms, THE System SHALL notify support and manager
8. THE System SHALL allow manager override with fn_close_ticket_unconfirmed providing a reason
9. WHEN a customer rejects the fix, THE System SHALL transition ticket back to in_progress and increment reopen_count
10. THE System SHALL allow ticket reopening within 7 days by support or manager

### Requirement 20: Project Profit Calculation

**User Story:** As a director, I want to see per-project profit with completeness indicators, so that I know which figures are trustworthy.

#### Acceptance Criteria

1. THE v_project_profit view SHALL calculate revenue_paise as the sum of order taxable amounts plus approved variation taxable amounts
2. THE v_project_profit view SHALL calculate material_cost_paise from project_costs where kind is material or extra_material
3. THE v_project_profit view SHALL calculate labour_cost_paise from time_entries multiplied by hourly rates for install jobs
4. THE v_project_profit view SHALL calculate other_cost_paise from project_costs where kind is travel, permit, subcontract, or other
5. THE v_project_profit view SHALL calculate profit_paise as revenue_paise minus material_cost_paise minus labour_cost_paise minus other_cost_paise
6. THE v_project_profit view SHALL calculate margin_pct as profit_paise divided by revenue_paise multiplied by 100
7. THE v_project_profit view SHALL set is_complete to true only when install job is completed and all serial unit costs exist and install time entries exist
8. WHEN is_complete is false, THE v_project_profit view SHALL populate missing array with flags: install_not_completed, unit_cost_missing, labour_hours_missing
9. THE System SHALL never fabricate missing cost data
10. THE System SHALL display incomplete projects with a warning badge and the missing list

### Requirement 21: Director Dashboard

**User Story:** As a director, I want a real-time dashboard showing today's performance and open items, so that I can monitor operations at a glance.

#### Acceptance Criteria

1. THE fn_dashboard function SHALL accept range parameters: today, week, month
2. THE System SHALL compute date boundaries in IST timezone
3. THE fn_dashboard function SHALL return projects started in the period with stage distribution
4. THE fn_dashboard function SHALL return revenue and profit figures for completed projects in the period
5. THE fn_dashboard function SHALL return a count of open jobs by type
6. THE fn_dashboard function SHALL return a count of open tickets by priority
7. THE fn_dashboard function SHALL return a list of projects with incomplete profit data
8. THE fn_dashboard function SHALL return payment totals received in the period
9. THE System SHALL update dashboard data via Realtime subscriptions when relevant tables change
10. THE System SHALL allow directors and managers to access the dashboard
11. THE System SHALL restrict access to profit figures to director, manager, and accounts roles

### Requirement 22: Shareable Report Links

**User Story:** As a director, I want to generate secure shareable links to dashboard reports, so that I can share performance data with stakeholders without giving them system access.

#### Acceptance Criteria

1. WHEN a share link is created, THE System SHALL generate a 32-byte random token
2. THE System SHALL store only the SHA-256 hash of token concatenated with TOKEN_PEPPER
3. THE System SHALL never store or log the raw token after initial generation
4. THE System SHALL set default expiration to 7 days from creation
5. THE System SHALL allow manual expiration date override by the creator
6. WHEN redact_pii is true, THE System SHALL display customer names as initials only
7. WHEN redact_pii is true, THE System SHALL hide phone numbers and addresses
8. THE System SHALL snapshot dashboard figures at share creation time in params jsonb
9. THE System SHALL increment access_count on each link view
10. THE System SHALL record last_access_at and last_ip_hash on each view
11. THE System SHALL allow share link revocation by managers and directors
12. WHEN a link is revoked or expired, THE public access function SHALL return error LINK_INVALID

### Requirement 23: Role-Based Access Control

**User Story:** As a system administrator, I want role-based access enforced at database level, so that users can only access data appropriate to their role.

#### Acceptance Criteria

1. THE System SHALL define 7 roles: director, manager, sales, technician, warehouse, support, accounts
2. THE app.has_role function SHALL return true if the user role matches any provided role or is director
3. THE app.role function SHALL return the role from profiles where clerk_user_id matches the JWT sub claim
4. WHEN is_active is false or deleted_at is not null, THE app.role function SHALL return null
5. THE System SHALL enable row level security on all business tables
6. THE System SHALL create SELECT policies on each table allowing only specified roles
7. THE technician role SHALL read only jobs where they are in job_crew
8. THE technician role SHALL read only customers, projects, and assets related to their assigned jobs
9. THE warehouse role SHALL have no SELECT access to orders, payments, or invoices tables
10. THE cost tables SHALL allow SELECT only by manager, accounts, and director roles
11. THE System SHALL revoke all INSERT, UPDATE, DELETE permissions on business tables from authenticated and anon roles
12. THE notifications table SHALL allow SELECT only where recipient_id equals app.profile_id

### Requirement 24: Idempotency and Concurrency

**User Story:** As a system architect, I want all critical operations to be idempotent and handle concurrency safely, so that double-clicks and retries don't corrupt data.

#### Acceptance Criteria

1. THE System SHALL enforce unique constraints on idempotency_key for payments, scans, signatures, form submissions, and photo attachments
2. WHEN an operation with an existing idempotency_key is repeated, THE System SHALL return the original result without executing the operation again
3. THE fn_reserve_order_stock function SHALL acquire pg_advisory_xact_lock per product_id before modifying stock
4. THE System SHALL process products in ascending product_id order to prevent deadlocks
5. WHEN a serialization failure occurs, THE System SHALL return error code RETRY and the client SHALL retry once
6. ALL state-changing RPC functions SHALL lock the aggregate root with SELECT FOR UPDATE before making changes
7. THE System SHALL use row_version for optimistic concurrency on user-edited entities
8. WHEN expected_version does not match current row_version, THE System SHALL return error code STALE_VERSION
9. THE audit_log and status_history tables SHALL have triggers preventing UPDATE and DELETE operations
10. THE scan_events, stock_movements, and payments tables SHALL be append-only with no-mutation triggers

### Requirement 25: Offline Field Operations

**User Story:** As a field technician, I want to work offline and have my data sync when connectivity returns, so that I can complete jobs in areas with poor network coverage.

#### Acceptance Criteria

1. THE System SHALL register a service worker for /field routes using Serwist
2. THE service worker SHALL precache the app shell and runtime cache /field HTML pages
3. THE System SHALL use IndexedDB store jobs for caching assigned job data
4. THE System SHALL use IndexedDB store drafts for form state keyed by job_id:form
5. THE System SHALL use IndexedDB store photos for queued photo uploads with metadata
6. THE System SHALL use IndexedDB store outbox for pending mutations with idempotency keys
7. WHEN connectivity is lost, THE System SHALL show a persistent offline banner
8. WHEN the user is offline, THE System SHALL save form changes to drafts store every 500 milliseconds
9. WHEN the user is offline, THE System SHALL queue photos to the photos store with status queued
10. WHEN connectivity returns, THE System SHALL attempt photo uploads oldest first with exponential backoff retry
11. WHEN connectivity returns, THE System SHALL process outbox items in order with idempotency keys
12. WHEN sync completes, THE System SHALL show "All synced" confirmation
13. WHEN sync fails with a business error, THE System SHALL mark the item failed and show the error message to the user

### Requirement 26: Parser and Serializer for Quote PDFs

**User Story:** As a sales representative, I want to generate quote PDFs that can be printed or emailed, so that customers have a formal document.

#### Acceptance Criteria

1. THE System SHALL provide a Quote_PDF_Generator that accepts quote data as input
2. THE Quote_PDF_Generator SHALL register Noto Sans font family to support ₹ glyph rendering
3. THE Quote_PDF_Generator SHALL render company header with name, GSTIN, address, and contact
4. THE Quote_PDF_Generator SHALL render customer block with name, phone, and site address
5. THE Quote_PDF_Generator SHALL render project details including system type and capacity
6. THE Quote_PDF_Generator SHALL render BOM table with columns: item, quantity, unit, unit price, GST rate, amount
7. THE Quote_PDF_Generator SHALL render totals section with subtotal, discount, taxable amount, GST, and total
8. WHEN subsidy_eligible is true, THE Quote_PDF_Generator SHALL render subsidy box with expected amount and net cost
9. THE subsidy box SHALL include disclaimer text: "Subsidy is paid by the Government directly to your bank account after commissioning and is an estimate"
10. THE Quote_PDF_Generator SHALL never render cost or margin columns
11. THE Quote_PDF_Generator SHALL render validity date and terms
12. THE Quote_PDF_Generator SHALL render accept link QR code
13. THE System SHALL store generated PDFs in Storage bucket documents with path quotes/{quote_id}/{uuid}.pdf
14. THE System SHALL record the PDF path in quotes.pdf_path
15. FOR ALL valid quote objects, THE Quote_PDF_Generator SHALL produce a PDF that can be parsed back to verify completeness

### Requirement 27: Barcode Scanning

**User Story:** As a warehouse operator, I want to scan barcodes with my phone camera, so that I can quickly validate and dispatch serial numbers.

#### Acceptance Criteria

1. THE System SHALL use @zxing/browser for barcode detection
2. WHEN native BarcodeDetector is available, THE System SHALL use it as primary scanner
3. THE System SHALL provide a manual entry fallback button always visible
4. WHEN a barcode is detected, THE System SHALL extract the text and display it for confirmation
5. THE System SHALL provide a double-confirm button before submitting the scanned value
6. THE System SHALL normalize scanned input by converting to uppercase and trimming whitespace
7. THE System SHALL highlight the input field in red when a scan is rejected
8. THE System SHALL display the rejection reason from the scan_events message field
9. THE System SHALL provide visual feedback with green highlight for accepted scans
10. THE System SHALL maintain scan count and show progress: "5 of 8 items scanned"

### Requirement 28: Mobile Installation Form

**User Story:** As a field technician, I want a mobile-optimized installation form, so that I can efficiently complete installations on a phone or tablet.

#### Acceptance Criteria

1. THE installation form SHALL use a mobile-first responsive layout with large touch targets
2. THE System SHALL display form sections in a single column on screens narrower than 768 pixels
3. THE System SHALL provide a floating action button for camera access
4. THE System SHALL compress captured photos to maximum 1600 pixel width and 1.5 MB size before upload
5. THE System SHALL show photo thumbnails with kind labels after capture
6. THE System SHALL allow photo deletion before submission
7. THE System SHALL provide a signature canvas component using react-signature-canvas
8. THE signature canvas SHALL capture touch input and render as PNG
9. THE System SHALL validate signature canvas is not empty before allowing submission
10. THE System SHALL show "Saved on device" timestamp after each field change when offline
11. THE System SHALL use react-hook-form with zod validation for all form fields
12. THE System SHALL show field-level validation errors inline below each field

### Requirement 29: Notification System

**User Story:** As a user, I want to receive in-app notifications for important events, so that I don't miss critical actions.

#### Acceptance Criteria

1. THE System SHALL insert notification records with recipient_id, type, title, body, entity_type, entity_id, url, and severity
2. THE System SHALL support severity levels: info, success, warning, action_required
3. THE System SHALL show unread notifications count badge in the app header
4. THE System SHALL display notifications in descending order by created_at
5. THE System SHALL mark notifications as read when the user clicks on them
6. THE System SHALL provide a mark all as read action
7. THE System SHALL deep link notifications to the relevant entity page using the url field
8. THE System SHALL subscribe to notifications table via Realtime for the current user
9. WHEN a new notification arrives, THE System SHALL show a toast with the title
10. WHEN severity is action_required, THE System SHALL use red/amber styling
11. THE System SHALL notify lead owners when leads are assigned
12. THE System SHALL notify managers when surveys are submitted
13. THE System SHALL notify sales owners when quotes are accepted
14. THE System SHALL notify warehouse when pick-lists are ready
15. THE System SHALL notify crew leads when jobs are scheduled

### Requirement 30: Audit Trail

**User Story:** As a manager, I want a complete audit trail of who changed what and when, so that I can investigate issues and ensure accountability.

#### Acceptance Criteria

1. THE System SHALL insert audit_log records for every state-changing RPC call
2. THE audit_log record SHALL include actor_id, action, entity_type, entity_id, before, after, reason, and at timestamp
3. THE before and after fields SHALL contain jsonb snapshots of changed fields only
4. THE System SHALL insert status_history records for every status transition
5. THE status_history record SHALL include entity_type, entity_id, from_status, to_status, actor_id, reason, and at timestamp
6. THE System SHALL enforce append-only constraints on audit_log via trigger
7. THE System SHALL enforce append-only constraints on status_history via trigger
8. THE System SHALL log all price changes with old and new values
9. THE System SHALL log all stock adjustments with reason_code and note
10. THE System SHALL log all payment reversals with reason
11. THE System SHALL log all warranty overrides with decision and reason
12. THE System SHALL allow managers to view audit logs for any entity
13. THE System SHALL display audit entries in chronological order with actor name

### Requirement 31: Offline Field Operations

**User Story:** As a field technician, I want to work offline with automatic sync when connectivity returns, so that I can complete jobs in areas with poor network coverage.

#### Acceptance Criteria

1. THE System SHALL scope offline capability to /field/** routes only
2. THE System SHALL enable offline for: viewing assigned jobs, survey forms, install forms, service forms, photo capture, signature capture
3. THE System SHALL NOT enable offline for: stock scanning operations, payment recording, approval workflows
4. THE System SHALL use IndexedDB store named jobs for caching assigned job data
5. THE System SHALL use IndexedDB store named drafts for form state keyed by job_id:form
6. THE System SHALL use IndexedDB store named photos for queued photo uploads with metadata
7. THE System SHALL use IndexedDB store named outbox for pending mutations with idempotency keys
8. THE System SHALL register a service worker using Serwist for /field routes
9. THE System SHALL precache the app shell and runtime cache /field HTML pages using NetworkFirst strategy with 3 second timeout
10. WHEN connectivity is lost, THE System SHALL show a persistent offline banner
11. WHEN the user is offline, THE System SHALL save form changes to drafts store every 500 milliseconds
12. WHEN the user is offline, THE System SHALL queue photos to the photos store with status queued
13. WHEN connectivity returns, THE System SHALL attempt photo uploads oldest first with exponential backoff retry
14. WHEN connectivity returns, THE System SHALL process outbox items in order with idempotency keys
15. WHEN sync completes, THE System SHALL show "All synced" confirmation
16. WHEN sync fails with a business error, THE System SHALL mark the item failed and show the error message to the user
17. THE System SHALL trigger sync on: window online event, app start, visibility change, manual "Sync now" button
18. THE System SHALL use navigator.locks to prevent concurrent sync from multiple tabs
19. THE System SHALL maintain sync status indicator showing: "Offline — changes saved on device" / "Syncing X photos..." / "All synced ✓"
20. THE System SHALL create PWA manifest with name "SunPower Field", start_url "/field", display standalone

### Requirement 32: Barcode Scanning and Validation

**User Story:** As a warehouse operator, I want to scan barcodes with my phone camera with clear validation feedback, so that I can quickly and accurately dispatch serial numbers.

#### Acceptance Criteria

1. THE System SHALL use @zxing/browser for barcode detection
2. WHEN native BarcodeDetector is available, THE System SHALL use it as primary scanner
3. THE System SHALL provide a manual entry fallback button always visible
4. WHEN a barcode is detected, THE System SHALL extract the text and display it for confirmation
5. THE System SHALL provide a double-confirm button before submitting the scanned value
6. THE System SHALL normalize scanned input by converting to uppercase and trimming whitespace
7. WHEN a scan is rejected, THE System SHALL highlight the input field in red
8. WHEN a scan is rejected, THE System SHALL display the rejection reason from scan_events message field
9. WHEN a scan is accepted, THE System SHALL provide visual feedback with green highlight
10. THE System SHALL maintain scan count and show progress in format "X of Y items scanned"

### Requirement 33: Digital Signature Capture

**User Story:** As a field technician, I want to capture customer signatures on-screen, so that I can obtain approval without paper forms.

#### Acceptance Criteria

1. THE System SHALL use react-signature-canvas for signature capture
2. THE signature canvas SHALL capture touch input and mouse input
3. THE System SHALL render captured signature as PNG format
4. THE System SHALL validate signature canvas is not empty before allowing submission
5. THE System SHALL provide a clear button to restart signature capture
6. THE System SHALL compress signature PNG before upload
7. WHEN signature is captured on-device, THE System SHALL set signature_status to signed
8. WHEN customer is absent, THE System SHALL support remote signature via share link
9. WHEN customer refuses to sign, THE System SHALL support refusal with reason
10. THE System SHALL support three signature methods: on_device, remote_link, otp
11. THE System SHALL store signature PNG in Supabase Storage signatures bucket

### Requirement 34: Customer Solar Journey Tracker

**User Story:** As a customer, I want to track my solar installation progress through a public link, so that I know what stage my project is in without calling.

#### Acceptance Criteria

1. WHEN a project is created, THE System SHALL create a tracker share_link with kind tracker
2. THE System SHALL generate an unguessable token of 32 random bytes
3. THE System SHALL store only the SHA-256 hash of token concatenated with TOKEN_PEPPER
4. THE System SHALL set default tracker expiration to 12 months
5. THE System SHALL provide a public URL in the format /track/[token]
6. THE System SHALL map project stages to 8 customer-friendly steps: Enquiry received, Site survey, Quote, Order confirmed, Material dispatched, Installation, Net-metering & commissioning, Subsidy (if eligible)
7. THE System SHALL display timeline with completed steps showing dates
8. THE System SHALL show current step with descriptive text
9. THE System SHALL show next step with assigned crew first name only
10. THE System SHALL hide all monetary amounts from the tracker view
11. THE System SHALL allow tracker access without authentication

### Requirement 35: Asset Passport with QR Code

**User Story:** As a customer, I want to access my equipment warranty information via QR code, so that I can report problems easily.

#### Acceptance Criteria

1. WHEN an asset is created, THE System SHALL create an asset share_link with kind asset
2. THE System SHALL generate a unique unguessable token per asset
3. THE System SHALL provide a public URL in the format /a/[token]
4. THE System SHALL generate a QR code label PDF containing the token URL
5. THE System SHALL display: product name, brand, serial number, install date, warranty start date, warranty end date, warranty status
6. THE System SHALL mask customer name to initials only
7. THE System SHALL provide a "Report a problem" button that creates a ticket via rate-limited public RPC
8. THE System SHALL set asset passport links to never expire (revocable only)
9. THE System SHALL allow asset passport access without authentication
10. THE System SHALL rate-limit ticket creation from asset QR codes to prevent abuse

### Requirement 36: Delivery Confirmation Methods

**User Story:** As a delivery person, I want multiple methods to confirm delivery, so that I can obtain customer acknowledgment in various situations.

#### Acceptance Criteria

1. THE System SHALL support four delivery confirmation methods: otp, signature, photo, staff_override
2. WHEN method is otp, THE System SHALL generate a 6-digit numeric OTP
3. WHEN method is otp, THE System SHALL hash the OTP with SHA-256 before storage
4. WHEN method is otp, THE System SHALL set OTP expiration to 15 minutes
5. WHEN method is otp, THE System SHALL allow maximum 5 attempts before locking
6. WHEN OTP attempts exceed limit, THE System SHALL return error code DELIVERY_OTP_LOCKED
7. WHEN method is signature, THE System SHALL require signature_path to be populated
8. WHEN method is photo, THE System SHALL require delivery proof photo uploaded to Storage
9. WHEN method is staff_override, THE System SHALL require manager role
10. WHEN method is staff_override, THE System SHALL require override_reason text
11. THE System SHALL record delivery_confirmed_by_type and delivery_confirmed_name
12. WHEN delivery is confirmed, THE System SHALL proceed with asset creation automation A10

### Requirement 37: Remote Signature for Absent Customer

**User Story:** As a field technician, I want to send a signature link when the customer is not present, so that I can complete installation without delay.

#### Acceptance Criteria

1. WHEN installation is submitted without signature, THE System SHALL transition job status to awaiting_signature
2. THE System SHALL create a signature share_link with kind signature
3. THE System SHALL generate an unguessable token for the signature link
4. THE System SHALL set signature link expiration to 7 days
5. THE System SHALL provide a public URL in the format /sign/[token]
6. THE System SHALL display installation summary: system size, install date, photo thumbnails
7. THE System SHALL provide signature canvas for customer to sign remotely
8. THE System SHALL allow customer to refuse signature with reason
9. WHEN customer signs remotely, THE System SHALL transition job status from awaiting_signature to completed
10. WHEN customer refuses signature, THE System SHALL set signature_status to refused and flag job as disputed
11. THE System SHALL notify manager when signature is refused
12. THE System SHALL allow manager to resolve signature dispute with evidence and note

### Requirement 38: Variation Handling

**User Story:** As an operations manager, I want to handle cases where installed capacity differs from quoted capacity, so that invoicing reflects actual work.

#### Acceptance Criteria

1. WHEN install form is submitted, THE System SHALL compare installed_kw to quoted final_kw
2. WHEN installed_kw differs from final_kw, THE System SHALL create a variation record with status pending
3. THE System SHALL calculate delta_taxable_paise and delta_gst_paise based on the difference
4. WHEN delta is positive, THE System SHALL create additional billable amount
5. WHEN delta is negative, THE System SHALL create credit amount
6. THE System SHALL block final invoice issuance until variation status is approved or rejected
7. THE System SHALL return error code VARIATION_PENDING when attempting to issue invoice with pending variation
8. WHEN a manager approves a variation, THE System SHALL create a variation invoice line
9. WHEN a manager rejects a variation, THE System SHALL require decision_note
10. THE System SHALL display variation approval in manager approvals queue

### Requirement 39: Stock Adjustments with Approval

**User Story:** As a warehouse operator, I want to request stock adjustments for discrepancies, so that inventory stays accurate with management oversight.

#### Acceptance Criteria

1. THE System SHALL support adjustment directions: up (found/correction) and down (damage/loss/scrap)
2. THE System SHALL require reason_code from set: count_mismatch, damage, loss, found, correction, scrap, rma_out
3. THE System SHALL require free-text note for all adjustments
4. THE System SHALL calculate adjustment value as qty multiplied by average cost
5. WHEN adjustment value exceeds stock.adjustment_approval_threshold_paise setting, THE System SHALL set status to pending
6. WHEN adjustment value is below threshold, THE System SHALL auto-apply with status approved
7. THE System SHALL enforce idempotency via unique adjustment.idempotency_key
8. WHEN adjustment requires approval, THE System SHALL notify managers
9. WHEN a manager approves an adjustment, THE System SHALL apply the stock movement
10. WHEN a manager rejects an adjustment, THE System SHALL record decision_note and take no action
11. THE System SHALL prevent adjustments that would push bulk_stock.on_hand below reserved quantity

### Requirement 40: Subsidy Paperwork Readiness Checker

**User Story:** As an accounts staff member, I want the system to verify all subsidy documents are ready before submission, so that applications are not rejected for missing information.

#### Acceptance Criteria

1. THE System SHALL maintain a subsidy checklist with 8 required items: module_serials, dcr_certificate, geo_tagged_photo, installation_report, customer_signature, meter_report, net_metering_agreement, name_match
2. THE System SHALL auto-check items that can be system-verified
3. WHEN all dispatched panel serial numbers are recorded, THE System SHALL mark module_serials as ready
4. WHEN geo-tagged installation photos exist, THE System SHALL mark geo_tagged_photo as ready
5. WHEN installation report is complete with signature, THE System SHALL mark installation_report and customer_signature as ready
6. WHEN consumer_name_on_bill matches customer name, THE System SHALL mark name_match as ready
7. THE System SHALL allow accounts staff to manually mark items ready with evidence_path
8. THE System SHALL prevent subsidy status transition to inspection_pending unless all items are ready or n_a
9. THE System SHALL return error code SUBSIDY_NOT_READY when gate G18 is violated
10. THE System SHALL display checklist progress with status indicators: pending, ready, done, n_a

### Requirement 41: Technician Time Tracking and Pay

**User Story:** As a field technician, I want my work hours tracked automatically, so that I am paid accurately.

#### Acceptance Criteria

1. WHEN a technician starts a job, THE System SHALL create an open time_entry record with started_at
2. THE System SHALL prevent overlapping time entries for the same profile via exclusion constraint
3. WHEN a technician stops working, THE System SHALL set ended_at and calculate minutes
4. WHEN a job is submitted, THE System SHALL close all open time entries for that job
5. THE System SHALL snapshot the technician's hourly rate from technician_rates when closing an entry
6. THE System SHALL support two pay models: hourly and per_job
7. THE System SHALL allow manual time entry creation by managers with source manual
8. THE System SHALL flag time entries for manager approval
9. THE System SHALL prevent time entry creation or modification when pay period is locked
10. THE System SHALL return error code PAY_PERIOD_LOCKED when attempting to modify locked period entries
11. THE System SHALL calculate labour cost for project profit as sum of (minutes ÷ 60 × rate_paise)
12. THE System SHALL allow technicians to view their own pay entries via fn_my_pay

### Requirement 42: Purchase Orders and Supplier Tracking

**User Story:** As an accounts staff member, I want to record supplier purchases with costs, so that inventory costs are accurate.

#### Acceptance Criteria

1. THE System SHALL maintain a suppliers table with name, phone, GSTIN, address, is_active
2. THE System SHALL create purchase records with supplier_id, supplier_invoice_no, supplier_invoice_date
3. THE System SHALL support purchase status: draft, received, cancelled
4. THE System SHALL create purchase_lines for each product with qty and batch_no
5. THE System SHALL record unit_cost_paise in purchase_line_costs (cost segregation)
6. WHEN a purchase is marked received, THE System SHALL create stock_units for serialised products
7. WHEN a purchase is marked received, THE System SHALL create stock_movements for bulk products
8. WHEN a purchase is marked received, THE System SHALL update product_costs.avg_cost_paise using weighted average
9. THE System SHALL trigger backorder allocation automation A8 after stock receipt
10. THE System SHALL enforce idempotency on purchase receipt via purchase.idempotency_key

### Requirement 43: Low Stock Alerts

**User Story:** As a warehouse manager, I want alerts when stock falls below reorder level, so that I can reorder before running out.

#### Acceptance Criteria

1. THE System SHALL maintain reorder_level per product
2. WHEN bulk_stock.available falls below reorder_level, THE System SHALL trigger automation A16
3. THE System SHALL notify warehouse staff and managers once per day per product
4. THE System SHALL calculate serialised available as count of stock_units with status in_stock
5. WHEN serialised available falls below reorder_level, THE System SHALL trigger automation A16
6. THE System SHALL display low stock indicator on inventory screens
7. THE System SHALL provide a low stock report showing all products below reorder level

### Requirement 44: Document Numbering

**User Story:** As a system administrator, I want gapless sequential document numbers per financial year, so that documents follow Indian accounting conventions.

#### Acceptance Criteria

1. THE System SHALL use Indian financial year April to March for document numbering
2. THE System SHALL generate document numbers in format PREFIX-YYMM-NNNNN
3. THE System SHALL use prefixes: LD (leads), PRJ (projects), JOB (jobs), QT (quotes), ORD (orders), INV (invoices), TKT (tickets), DSP (dispatches), PL (pick-lists), PMT (payments), PUR (purchases), ADJ (adjustments), VAR (variations)
4. THE System SHALL maintain doc_sequences table with (prefix, fy, last_no)
5. THE System SHALL use fn_next_doc_no(prefix) to generate gapless numbers per transaction
6. THE System SHALL represent financial year as YYMM where YY is current year and MM is next year
7. THE System SHALL pad sequence number to 5 digits with leading zeros
8. THE System SHALL assign invoice_no only when invoice status transitions from draft to issued
9. THE System SHALL enforce uniqueness on document numbers per table

### Requirement 45: Concurrent Order Confirmation Atomicity

**User Story:** As a system architect, I want order confirmations to handle concurrent reservations safely, so that stock is never double-allocated.

#### Acceptance Criteria

1. THE fn_reserve_order_stock function SHALL acquire pg_advisory_xact_lock per product_id
2. THE System SHALL process products in deterministic order by product_id ascending to prevent deadlocks
3. WHEN two orders confirm simultaneously for the same product, THE System SHALL serialize reservations
4. THE System SHALL use FOR UPDATE locks on stock_units and bulk_stock during reservation
5. WHEN available quantity is insufficient, THE System SHALL reserve available quantity and flag backorder
6. THE System SHALL never allow bulk_stock.reserved to exceed bulk_stock.on_hand
7. THE System SHALL update order_lines.qty_reserved with actual reserved quantity
8. WHEN a serialization failure (SQLSTATE 40001) occurs, THE System SHALL return error code RETRY
9. THE client SHALL retry once on RETRY error code
10. THE System SHALL log all reservation attempts including partial fulfillment

**Correctness Property:** FOR ALL pairs of concurrent orders (O1, O2) requiring the same product P with available quantity Q, AFTER both fn_confirm_order complete, THEN (O1.qty_reserved + O2.qty_reserved) = Q AND no stock_unit is reserved to both orders.

### Requirement 46: Scan Validation Determinism

**User Story:** As a quality assurance engineer, I want scan validation to reject invalid states consistently, so that scanning errors are always caught.

#### Acceptance Criteria

1. THE fn_scan_dispatch_unit function SHALL validate scans in deterministic order
2. THE System SHALL normalize serial_no before lookup by: uppercase, trim whitespace
3. THE System SHALL return scan_result rejected_unknown when serial is not found in stock_units
4. THE System SHALL return scan_result rejected_wrong_product when serial product_id does not match any dispatch order line
5. THE System SHALL return scan_result rejected_reserved_other when unit is reserved to a different order_id
6. THE System SHALL return scan_result rejected_duplicate when unit status is already dispatched, delivered, or installed
7. THE System SHALL return scan_result rejected_bad_status when unit status is damaged, rma, under_repair, scrapped, or replaced
8. THE System SHALL return scan_result accepted only when all validations pass
9. THE System SHALL log every scan attempt to scan_events regardless of result
10. THE System SHALL enforce idempotency via scan_events.idempotency_key unique constraint

**Correctness Property:** FOR ALL serial numbers S and dispatch D, fn_scan_dispatch_unit(S, D, idem) called with the same idempotency key returns the same result, AND a rejected scan never modifies stock_units status.

### Requirement 47: Warranty Calculation Consistency

**User Story:** As a support staff member, I want warranty status calculated consistently with product snapshot, so that warranty decisions are always accurate.

#### Acceptance Criteria

1. THE System SHALL snapshot product.warranty_months to asset.warranty_months at asset creation
2. THE System SHALL determine warranty_start based on warranty.start_trigger setting: delivery or installation
3. THE System SHALL calculate warranty_end as warranty_start plus warranty_months
4. THE fn_compute_warranty function SHALL return warranty status: active, expiring_soon, expired, or void
5. WHEN warranty_void is true, THE System SHALL return status void regardless of dates
6. WHEN warranty_end is more than 60 days in the future, THE System SHALL return status active
7. WHEN warranty_end is within 60 days, THE System SHALL return status expiring_soon
8. WHEN warranty_end is in the past, THE System SHALL return status expired
9. THE System SHALL use the same warranty_months value for all warranty calculations for an asset
10. THE System SHALL store warranty basis snapshot in ticket for audit trail

**Correctness Property:** FOR ALL assets A with warranty_months M and warranty_start D, warranty_end = (D + M months) AND warranty status at time T depends only on (warranty_end, warranty_void, T), producing the same result for the same inputs.

### Requirement 48: Payment Allocation Integrity

**User Story:** As an accounts staff member, I want payment allocations to never create negative balances, so that financial records stay accurate.

#### Acceptance Criteria

1. THE System SHALL allocate payments to invoices in FIFO order by invoice.issued_at
2. THE System SHALL never allocate more than payment.amount_paise across all allocations
3. THE System SHALL never allocate more than invoice.total_paise minus invoice.paid_paise to a single invoice
4. THE System SHALL enforce check constraint: sum(payment_allocations.amount_paise) per payment_id ≤ payment.amount_paise
5. THE System SHALL enforce check constraint: sum(payment_allocations.amount_paise) per invoice_id ≤ invoice.total_paise
6. THE System SHALL update invoice.paid_paise after allocation
7. THE System SHALL transition invoice.status to paid when paid_paise equals total_paise
8. THE System SHALL prevent payment reversal if allocations exist unless reversal explicitly deallocates
9. THE System SHALL maintain payment_allocations as append-only
10. THE System SHALL use exclusive locks during allocation to prevent race conditions

**Correctness Property:** FOR ALL payments P and invoices I, sum of allocations from P ≤ P.amount AND sum of allocations to I ≤ I.total AND no negative paid_paise values exist.

### Requirement 49: Subsidy Calculation Exactness

**User Story:** As an accounts staff member, I want subsidy amounts calculated exactly per tier rules, so that customer quotes are accurate.

#### Acceptance Criteria

1. THE System SHALL read subsidy tier configuration from settings.subsidy.tiers
2. THE System SHALL apply tier 1 rate for capacity 0 to tier1.upto_kw
3. THE System SHALL apply tier 2 rate for capacity tier1.upto_kw to tier2.upto_kw
4. THE System SHALL calculate subsidy as: (min(capacity, tier1_kw) × tier1_rate) + (min(max(0, capacity - tier1_kw), tier2_kw - tier1_kw) × tier2_rate)
5. THE System SHALL cap subsidy_paise at settings.subsidy.max_paise
6. THE System SHALL add optional state topup from settings.subsidy.state_topup_paise_per_kw × capacity_kw
7. THE System SHALL set subsidy_eligible to true only when project is residential AND system_type is on_grid
8. THE System SHALL allow manager to override subsidy_eligible with subsidy_override_reason
9. THE System SHALL validate all quote panels have is_dcr true when subsidy_eligible is true
10. THE System SHALL return error code DCR_REQUIRED when gate G4 is violated

**Correctness Property:** FOR ALL quotes Q with capacity C and tiers T, subsidy calculation produces the same subsidy_paise for the same (C, T, max_paise) inputs, AND subsidy ≤ max_paise.

### Requirement 50: Quote BOM Generation Determinism

**User Story:** As a sales representative, I want template BOM generation to be consistent, so that quotes with the same template always have the same items.

#### Acceptance Criteria

1. THE fn_build_quote_lines function SHALL process package_template_items in deterministic order by sort, then id
2. THE System SHALL calculate panel_count as ceil(capacity_kw × 1000 ÷ panel_wattage_w)
3. WHEN qty_rule is fixed, THE System SHALL use qty_value directly
4. WHEN qty_rule is per_kw, THE System SHALL calculate qty as capacity_kw × qty_value
5. WHEN qty_rule is panel_count, THE System SHALL use the calculated panel_count
6. WHEN qty_rule is per_panel, THE System SHALL calculate qty as panel_count × qty_value
7. WHEN qty_rule is cable_dc_m, THE System SHALL calculate qty as survey.cable_dc_m × qty_value
8. WHEN qty_rule is cable_ac_m, THE System SHALL calculate qty as survey.cable_ac_m × qty_value
9. WHEN rounding is ceil, THE System SHALL apply ceiling function to calculated qty
10. WHEN when_roof_types is specified, THE System SHALL include item only if survey.roof_type matches
11. THE System SHALL freeze product.price_paise to quote_lines.unit_price_paise at creation
12. THE System SHALL freeze product_costs.standard_cost_paise to quote_line_costs.unit_cost_paise at creation

**Correctness Property:** FOR ALL template T, capacity C, and survey S, fn_build_quote_lines(T, C, S) called twice with identical inputs produces the same set of quote lines with the same quantities and prices.

### Requirement 51: Cost Posting Idempotency

**User Story:** As a system architect, I want cost postings to be idempotent, so that costs are never double-counted.

#### Acceptance Criteria

1. THE project_costs table SHALL enforce unique constraint on (source_type, source_id)
2. WHEN fn_finalize_dispatch posts costs, THE System SHALL use (dispatch_item, dispatch_item.id) as source
3. WHEN costs are already posted for a source, THE System SHALL skip posting and return success
4. THE System SHALL post serialised unit costs from stock_unit_costs.unit_cost_paise
5. THE System SHALL post bulk item costs from product_costs.avg_cost_paise at dispatch time
6. THE System SHALL never modify existing project_costs records
7. THE System SHALL enforce append-only constraint on project_costs via trigger
8. THE System SHALL sum project_costs.amount_paise per project for profit calculation
9. THE System SHALL handle partial dispatches by posting costs only for dispatched items
10. THE System SHALL flag missing cost data in v_project_profit.missing array

**Correctness Property:** FOR ALL dispatch D with items I, fn_finalize_dispatch(D) called multiple times posts costs exactly once per item in I, AND total posted costs = sum of unit costs for I.

### Requirement 52: Project Profit Completeness Accuracy

**User Story:** As a director, I want profit completeness flags to accurately reflect missing data, so that I know which figures are trustworthy.

#### Acceptance Criteria

1. THE v_project_profit view SHALL set is_complete to true only when all cost data is present
2. THE System SHALL check: install job status is completed
3. THE System SHALL check: all dispatched serialised units have entries in stock_unit_costs
4. THE System SHALL check: install time entries exist and are closed
5. WHEN is_complete is false, THE System SHALL populate missing array with flags
6. THE System SHALL add flag install_not_completed when install job is not completed
7. THE System SHALL add flag unit_cost_missing when any dispatched serial lacks cost data
8. THE System SHALL add flag labour_hours_missing when install_minutes is 0 or null
9. THE System SHALL never fabricate missing cost data
10. THE System SHALL calculate profit_paise as revenue_paise minus all cost components
11. THE System SHALL calculate margin_pct as (profit_paise ÷ revenue_paise) × 100
12. THE System SHALL display incomplete profit with warning badge and missing list

**Correctness Property:** FOR ALL projects P, v_project_profit.is_complete = true IF AND ONLY IF (install completed AND all unit costs present AND labour hours recorded), AND missing array accurately lists all incomplete items.

### Requirement 53: Lead Round-Robin Fairness

**User Story:** As a sales manager, I want leads distributed fairly among sales staff, so that workload is balanced.

#### Acceptance Criteria

1. THE System SHALL assign leads to active sales users only (is_active true and deleted_at null)
2. THE System SHALL count open leads as leads with status in (new, contacting, follow_up)
3. THE System SHALL assign to the sales user with the fewest open leads
4. WHEN multiple sales users have the same open lead count, THE System SHALL assign to the least recently assigned
5. THE System SHALL track last_assigned_at per sales user
6. WHEN no active sales users exist, THE System SHALL set owner_id to null
7. WHEN owner_id is null, THE System SHALL notify all managers of unassigned lead
8. THE System SHALL allow manual reassignment by managers
9. THE System SHALL maintain assignment history in lead_activities
10. THE System SHALL use deterministic ordering when tie-breaking: by profiles.id ascending

**Correctness Property:** GIVEN N active sales users with lead counts [C1, C2, ..., CN], AFTER a new lead L is assigned, L.owner_id = user with minimum Ci, AND ties are broken by least recent assignment timestamp.

