# SunPower Solar Installation Management System - Implementation Plan

> **Status**: Ready for Implementation
> **Stack**: Next.js 16 (App Router) + TypeScript + Supabase + Clerk
> **Timeline**: Phased Implementation
> **Target**: Hackathon Demo Ready

---

## ✅ Phase 0: Foundation (COMPLETED)

### Authentication & Authorization ✅
- [x] Install Clerk and core dependencies
- [x] Configure Clerk middleware with route protection
- [x] Set up Supabase clients (admin, user, browser)
- [x] Create auth helper functions (getProfile, requireRole, roles)
- [x] Implement sign-in and sign-up pages
- [x] Create pending-role and forbidden pages
- [x] Set up Clerk webhook handler for user sync
- [x] Configure environment variables

### Next Steps
1. Configure Clerk Dashboard (see instructions below)
2. Set up Supabase database schema
3. Test authentication flow

---

## Phase 1: Database & Core Infrastructure (PRIORITY)

### 1.1 Supabase Database Setup

#### A. Enable Extensions (Migration 0001)
```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gist";
CREATE EXTENSION IF NOT EXISTS "citext";
-- Enable pg_cron in Supabase Dashboard if not available in migration
```

#### B. Create Core Tables (Follow PRD File 03)
Priority order:
1. **profiles** (staff users from Clerk)
2. **customers** (lead/project owners)
3. **settings** (business configuration)
4. **products** (catalogue with serialized vs bulk)
5. **leads** (enquiry intake)
6. **projects** (qualified leads → projects)
7. **surveys** (site assessment)
8. **package_templates** (quote templates)
9. **quotes** + **quote_lines** (BOM and pricing)
10. **orders** + **order_lines**
11. **payments**
12. **stock_units** (serialized items)
13. **stock_ledger** (bulk movements)
14. **reservations**
15. **pick_lists** + **pick_list_items**
16. **dispatches** + **dispatch_items**
17. **assets** (delivered, warranted items)
18. **jobs** (surveys, installs, service)
19. **job_time_entries**
20. **job_photos**
21. **tickets** (service complaints)
22. **invoices** + **invoice_lines**
23. **subsidy_paperwork**
24. **notifications**
25. **audit_log**
26. **status_history**

#### C. Create RLS Policies (File 02)
- One policy per table per role
- **CRITICAL**: Technicians never see cost/margin
- Warehouse never sees payments
- Sales only see own leads/quotes unless manager/director

#### D. Create Database Functions (File 04)
Priority RPCs (implement in order):
1. **fn_create_lead** - Lead intake with duplicate phone check
2. **fn_qualify_lead** - Lead → Project conversion
3. **fn_submit_survey** - Survey submission
4. **fn_approve_survey** - Manager approval (GATE)
5. **fn_build_quote_lines** - Template → BOM generation
6. **fn_create_quote** - Quote creation with price lock
7. **fn_accept_quote** - Customer acceptance → Order
8. **fn_record_payment** - Idempotent payment recording
9. **fn_confirm_order** - Payment threshold → Automatic: reserve + picklist + job + notifications
10. **fn_scan_dispatch** - Serial validation and customer linking
11. **fn_confirm_delivery** - Delivery → Asset creation + Warranty start
12. **fn_submit_install** - Install form with signature
13. **fn_create_ticket** - Service ticket with warranty check
14. **fn_check_warranty** - Fast warranty status lookup

### 1.2 Seed Data (File 08 Section 7)
```sql
-- Settings with defaults from PRD File 00 Section 6
-- Product catalogue (panels, inverters, batteries, etc.)
-- Package templates (1-5 kW × On-Grid/Off-Grid)
-- Fault codes
-- Demo users (all 7 roles)
```

### 1.3 Type Generation
```bash
npx supabase gen types typescript --linked > src/types/database.ts
```

---

## Phase 2: Leads & Qualification (P0)

### 2.1 Public Lead Form `/enquire`
- **Location**: `app/(public)/enquire/page.tsx`
- **Features**:
  - Name, phone, address, requested kW, system type (on-grid/off-grid)
  - Phone normalization (libphonenumber-js, E.164, region=IN)
  - Honeypot field (anti-spam)
  - Turnstile captcha (optional P2)
  - Rate limiting via Supabase RPC
- **Action**: `POST /api/public/lead` → `fn_create_lead`
- **Behavior**: Duplicate phone merges into existing lead
- **Success**: "Thank you! We'll contact you within 24 hours"

### 2.2 Sales Lead Queue `/leads`
- **Components**:
  - Lead list with filters (status, source, assigned, overdue)
  - Auto-assignment (round-robin among active sales)
  - Lead detail view
  - Call checklist (REQ-LEAD-05)
  - Follow-up scheduler
  - Qualification button → creates project
- **Actions**:
  - `qualifyLead` → `fn_qualify_lead`
  - `updateLead` → `fn_update_lead`
  - `scheduleFollowup`
- **Realtime**: New leads appear instantly

### 2.3 Lead Management
- **Status machine**: `new` → `contacted` → `qualified` / `lost` / `disqualified` / `unreachable`
- **No hard deletes** - only status changes with reason
- **Activity log** - every call, note, status change

---

## Phase 3: Survey & Approval (P0)

### 3.1 Survey Assignment `/schedule` (Manager)
- Drag-and-drop calendar for technicians
- Assign survey job to technician
- Notification to technician

### 3.2 Field Survey Form `/field/jobs/[id]/survey` (Mobile PWA)
- **Offline-first**: Draft saves to IndexedDB
- **Fields** (REQ-SURV-02):
  - Roof direction (dropdown)
  - Tilt angle (degrees)
  - DC cable distance (meters)
  - AC cable distance (meters)
  - Shadow-free area (sq ft)
  - Roof type (dropdown)
  - Structure notes (textarea)
  - Photos (required: 3+ roof shots, meter, DB)
- **Photo capture**: Camera with geotag, compression
- **Sync**: Upload photos → submit survey
- **Action**: `submitSurvey` → `fn_submit_survey`

### 3.3 Survey Approval Queue `/surveys` (Manager)
- List of pending surveys
- Survey detail with photos gallery
- **Actions**:
  - Approve → `fn_approve_survey` (unlocks quote creation)
  - Reject → back to technician with notes
  - Request rework → notes to technician
- **HARD GATE**: Quote creation blocked until approved

---

## Phase 4: Quote Generation & Acceptance (P0)

### 4.1 Quote Creation `/quotes/new`
- **Prerequisites**: Approved survey (enforced by RPC)
- **Template Selection**:
  - 10 templates: 1-5 kW × On-Grid/Off-Grid
  - Preview BOM before selection
- **BOM Generation**: `fn_build_quote_lines`
  - Auto-generated from template
  - Quantities from survey (cable length, panel count)
  - Prices/costs frozen at creation (price lock)
- **Subsidy Box** (residential + on-grid only):
  - Calculated by `fn_calc_subsidy`
  - Tiers from settings
  - Net cost to customer (informational)
- **Discount/Margin**:
  - > limit or < minimum → manager approval required
  - Approval workflow
- **Stock Availability**: Per-line indicator
- **PDF Generation**: Quote PDF with QR code
- **Customer Link**: `/q/[token]` (public, signed)

### 4.2 Customer Quote View `/q/[token]`
- **Public page** (no login)
- Shows:
  - Quote number, validity date
  - Customer details
  - System specs
  - BOM table (NO cost/margin columns)
  - Totals (subtotal, discount, GST, total)
  - Subsidy box (if eligible)
  - Terms
- **Accept Button** → `fn_accept_quote` → Order

### 4.3 Quote Management `/quotes`
- List with filters (status, customer, date)
- Quote detail
- Edit/version (v2 keeps v1)
- Send link to customer
- **Status machine**: `draft` → `sent` → `accepted` / `expired` / `revised`

---

## Phase 5: Order, Payment & Automation (P0)

### 5.1 Order Creation
- **Trigger**: Customer accepts quote OR sales creates order
- **Initial Status**: `pending_payment`
- **Order lines**: Frozen from quote

### 5.2 Payment Recording `/payments`
- **Form**:
  - Order selection
  - Amount (paise)
  - Method (cash, cheque, UPI, bank transfer)
  - Reference number
  - Date
  - Idempotency key (client-generated UUID)
- **Action**: `recordPayment` → `fn_record_payment`
- **Idempotent**: Duplicate key returns original result

### 5.3 Order Confirmation (THE CRITICAL AUTOMATION)
- **Trigger**: `fn_record_payment` checks if payments ≥ advance threshold
- **If yes**: `fn_confirm_order` runs **atomically** in same transaction:
  1. Order status → `confirmed`
  2. **Reserve stock** (atomic, prevents double allocation)
  3. **Create pick-list** (warehouse packing list)
  4. **Create install job** (unscheduled)
  5. **Notify**: warehouse, crew lead, accounts
- **All or nothing** - Postgres transaction ensures atomicity

### 5.4 Order Cancellation
- Release reservations
- Release pick-list
- Cancel job
- Compute refund
- Audit trail

---

## Phase 6: Inventory & Dispatch (P0)

### 6.1 Goods Receipt `/inventory/receive`
- **Serialized items** (inverters, batteries, charge controllers, panels):
  - One record per unit in `stock_units`
  - Serial must be unique
  - Cost recorded (feeds job profit)
- **Bulk items** (cable, stands, MCBs):
  - Append-only `stock_ledger`
  - Available = on_hand − reserved (derived)
- **Supplier tracking**
- **Photos** (optional)

### 6.2 Pick-List `/warehouse/picklists/[id]`
- Shows exactly what to pack for an order
- Picking progress (packed vs required)
- **Mark ready for dispatch**

### 6.3 Dispatch Scanning `/warehouse/dispatch/[id]`
- **THE GOLDEN THREAD STARTS HERE**
- **Barcode/QR scanner** (ZXing with manual fallback)
- **For each serialized item**:
  - Scan/enter serial
  - Validation (`fn_scan_dispatch`):
    - Serial exists? ✓
    - Correct product for this order? ✓
    - Not already dispatched? ✓
    - Reserved for this order? ✓
  - **Links unit to customer** (sets `customer_id` on `stock_units`)
  - **Reduces available stock**
  - **Every scan attempt logged** (audit)
- **Rejection messages**:
  - `UNKNOWN_SERIAL`: Serial not in system
  - `WRONG_PRODUCT`: Expected inverter, scanned battery
  - `ALREADY_DISPATCHED`: This unit already delivered
  - `WRONG_ORDER`: Reserved for different order
- **Bulk items**: Quantity entry with confirmation
- **Panel serials**:
  - Setting: `dispatch.panels_serial_required` (default true)
  - If true: scan each panel
  - If false: batch entry (CSV or range)
- **Complete dispatch** → Notifications

---

## Phase 7: Warranty & Assets (P0)

### 7.1 Delivery Confirmation `/d/[token]`
- **Public page** (customer or delivery person)
- Options:
  - OTP verification
  - Photo of delivered goods
  - Signature
- **Action**: `confirmDelivery` → `fn_confirm_delivery`

### 7.2 Asset Creation (AUTOMATIC)
- **Trigger**: `fn_confirm_delivery`
- **For each serialized unit in dispatch**:
  - Create `assets` record
  - Link to customer
  - **Set warranty_start** (today or install date, per setting)
  - **Set warranty_end** (start + product warranty months)
    - Inverter: 24 months
    - Battery: 24 months
    - Charge controller: 24 months
    - Panels: 240 months (20 years)
- **Warranty status** (computed):
  - `active`: today < warranty_end
  - `expiring_soon`: warranty_end − today ≤ 60 days
  - `expired`: today ≥ warranty_end
  - `void`: manually voided

### 7.3 Asset Passport `/a/[token]` (P2)
- **Public QR page**
- Shows:
  - Serial number
  - Product details
  - Warranty status
  - Owner (masked for privacy)
  - Installation date
- **QR label PDF** (50×25mm)

---

## Phase 8: Installation (P0)

### 8.1 Crew Schedule `/field/jobs` (Mobile PWA)
- List of assigned jobs
- Calendar view
- Job details
- Cached offline (IndexedDB)

### 8.2 Install Form `/field/jobs/[id]/install`
- **Offline-first**: Draft in IndexedDB, sync when online
- **Fields** (REQ-INST-02):
  - Start time (auto or manual)
  - Finish time (auto or manual)
  - Confirmed system size (kW)
  - Installed panel count
  - Power test result (pass/fail)
  - Photos (required kinds: completed array, inverter wiring, earthing, meter, customer with system)
  - Extra materials used
  - Notes
- **On-screen signature** (react-signature-canvas)
  - Customer name
  - Canvas drawing → PNG
  - Or: `pending_signature` / `refused` flags
- **Time Entries**: Recorded for each technician (feeds pay)
- **Validation**: Cannot close if power test failed or required photos/signature missing
- **Action**: `submitInstall` → `fn_submit_install`
- **Idempotent**: Uses idempotency key

### 8.3 Offline Sync
- **Photos queue**: IndexedDB → Upload → Attach
- **Form submission queue**: Outbox
- **Sync triggers**: Online event, visibility change, manual button
- **Conflict handling**: Server status wins
- **Persistent banner**: "Offline — changes saved on device" / "Syncing 3 photos..." / "All synced ✓"

---

## Phase 9: Service & Warranty (P0)

### 9.1 Fast Warranty Lookup `/service`
- **Search**:
  - Customer name (fuzzy, pg_trgm)
  - Phone (exact, E.164)
  - Serial number (exact)
- **Results** < 5 seconds (indexed)
- **Shows**:
  - Customer info
  - All assets with warranty status
  - Past tickets
- **Action**: Create ticket

### 9.2 Ticket Creation `/service/tickets/new`
- **Fields**:
  - Linked asset (if known)
  - Fault code (dropdown with lookup)
  - Description
  - Priority (high/normal)
  - Photos
- **Warranty decision** (automatic):
  - In warranty → `charge_type = 'free'`
  - Out of warranty → `charge_type = 'paid'`, auto-bill parts + labour
- **Action**: `createTicket` → `fn_create_ticket`

### 9.3 Ticket Management `/service/tickets/[id]`
- Ticket detail
- **Status machine**: `open` → `assigned` → `in_progress` → `waiting_for_customer` / `waiting_for_part` → `resolved` → `closed`
- Assign to technician
- Schedule service visit (like install job)
- Parts used
- Labour hours
- **Resolution**:
  - Technician marks `resolved`
  - **Customer confirms** fixed (required)
  - Then `closed`
- **Repeat complaint flag**: Same asset within 30 days
- **SLA tracking**: Breach notifications

### 9.4 Service Visit (Field)
- Similar to install form
- Photos, notes, parts, time
- Resolution notes
- Customer signature

---

## Phase 10: Finance & Director Dashboard (P0)

### 10.1 Per-Job Profit `/projects/[id]#finance`
- **Formula**: Revenue − Parts cost − Labour − Other costs
- **Data sources**:
  - Revenue: Order total
  - Parts cost: Sum of `stock_units.cost` + `stock_ledger` entries
  - Labour: `job_time_entries` × rates
  - Other: Manual entries
- **Completeness check**:
  - If any cost data missing → Show "Incomplete" + what's missing
  - **Never fake a number**
- **Visibility**: Director, Accounts only

### 10.2 Director Dashboard `/dashboard`
- **Time filters**: Today / This Week / This Month (IST boundaries)
- **Tiles**:
  - Total revenue (period)
  - Total jobs completed (period)
  - Average job margin (period, only complete data)
  - Open (unfinished) jobs count
  - Open repairs count
  - Low stock items
- **Tables**:
  - Recent jobs with profit
  - Open jobs (status, days pending)
  - Open tickets (priority, SLA status)
- **Charts**: Revenue trend, margin trend (recharts)
- **Realtime**: Updates on job/payment/ticket events (debounced 2s)

### 10.3 Shareable Report Link `/reports`
- **Create link**: Director only
- **Settings**:
  - Date range
  - Expiry (default 7 days)
  - PII masking (phone/address)
- **Token generation**: 32 random bytes, SHA256(token || pepper) stored
- **Public page** `/r/[token]`:
  - Read-only view
  - Masked data per settings
  - Watermark: "Generated for [email] on [date]"
- **Revocation**: Mark `revoked_at`
- **Expiry**: Cron job marks expired

### 10.4 Invoices `/invoices`
- **Generated from**:
  - Orders (installation invoice)
  - Tickets (service invoice, if paid)
- **Format**: GST-style tax invoice
  - Company details (GSTIN)
  - Customer details
  - Line items with HSN
  - Per-line GST
  - Totals in words
  - Payments received
  - Balance due
- **PDF**: `@react-pdf/renderer` with Noto Sans font (₹ glyph)
- **Storage**: `documents` bucket
- **Payment link**: UPI deep-link (P2)

### 10.5 Subsidy Paperwork `/subsidy`
- **Per-project tracker**:
  - Stage (pending_docs, docs_ready, submitted, approved, disbursed)
  - Checklist:
    - ✓ Installation photos geo-tagged
    - ✓ All serials captured
    - ✓ Customer signature
    - ✓ DCR modules used
    - ✓ Inspection report
    - ✓ Meter installation report
  - Readiness check before portal submission
  - Manual status updates (staff operate national portal)
- **Not a receivable** (subsidy goes to customer)

### 10.6 Technician Pay `/finance/pay`
- **Pay models**:
  - Hourly: `job_time_entries` × rate
  - Per-job: Flat rate per completed job
- **Period approval**: Manager/accounts
- **Missing hours flagged**
- **Payment recording**

---

## Phase 11: Platform Features (P0)

### 11.1 Notifications `/notifications`
- **In-app only** (v1, no email/SMS)
- **Written by RPCs** that trigger them
- **Types**:
  - Lead assigned
  - Survey needs approval
  - Quote sent/accepted
  - Payment received
  - Stock low
  - Ticket created/assigned
  - Job scheduled
  - Follow-up overdue
  - SLA breach
- **Filters**: Unread, by type
- **Realtime**: Supabase Realtime channel per user
- **Badge**: Unread count in nav

### 11.2 Audit Log (Automatic)
- **Written by RPCs** on every state change
- **Fields**:
  - actor_id (who)
  - action (what)
  - entity_type, entity_id (which)
  - old_values, new_values (JSONB)
  - timestamp
  - ip_address (from webhook/action context)
- **Append-only**
- **Queryable**: Timeline per entity, per user

### 11.3 Status History (Automatic)
- **Written by RPCs** on every status change
- **Fields**:
  - entity_type, entity_id
  - from_status, to_status
  - reason (optional)
  - changed_by
  - timestamp
- **Append-only**
- **Renders** as timeline in UI

### 11.4 Settings UI `/settings`
- **Director only**
- **Sections**:
  - Business (company name, GST IN, address, UPI ID)
  - Order (advance %, payment gates)
  - Quote (validity days, discount limits, margin limits)
  - Warranty (start trigger, expiring threshold)
  - Subsidy (enabled, tiers, max, state top-up)
  - Lead (max attempts, size suggestions)
  - Ticket (SLA hours by priority, repeat window)
  - Dispatch (panels serial required)
  - Stock (adjustment approval threshold)
  - Share (default expiry days)
  - Finance (hourly rate, travel cost)
  - GST (default rates - warn to confirm with CA)
- **Validation**: Zod schemas
- **Action**: `updateSettings` → upsert to `settings` table
- **Seed**: Defaults from PRD File 00 Section 6

### 11.5 User Management `/settings/users`
- **Director only**
- **List**: All profiles, role, status
- **Assign role**: `setUserRole` → updates `profiles.role` + Clerk metadata
- **Deactivate**: Set `is_active = false` (never delete)
- **Bootstrap director**: First signup with `BOOTSTRAP_DIRECTOR_EMAIL` auto-gets director role
- **Prevent**: Removing last active director (error: `LAST_DIRECTOR`)

---

## Phase 12: Product Catalogue & Templates (P0)

### 12.1 Product Catalogue `/settings/catalogue`
- **Fields**:
  - Name, SKU, category
  - Type: `serialized` / `bulk`
  - Unit (each, meter, kg)
  - Current price (paise)
  - Cost (paise, for new receipts)
  - GST rate (basis points, default from settings)
  - Warranty months (for serialized)
  - Is DCR (for modules, subsidy eligibility)
  - Reorder level
  - Is active
- **CRUD**: Create, update (never delete, just deactivate)
- **Validation**: SKU unique, DCR only for category=module

### 12.2 Package Templates `/settings/templates`
- **10 templates**: 1-5 kW × On-Grid/Off-Grid
- **Each template has**:
  - Name (e.g. "3 kW On-Grid Residential")
  - System size (kW)
  - System type (on-grid / off-grid)
  - Lines (product, base quantity, quantity formula from survey)
    - Example: `panels: ceil(size_kw / 0.54)` (for 540W panels)
    - Example: `dc_cable_m: survey.dc_cable_distance + 5` (buffer)
  - Installation service line (labour)
- **Formula engine**: Simple expressions (kW, survey fields, ceil/floor/round)
- **Clone & Edit**: Start from existing
- **Preview BOM**: Before creating quote

---

## Phase 13: Testing & Validation (P0)

### 13.1 pgTAP Tests (SQL Gates)
- **Location**: `supabase/tests/*.sql`
- **Test cases** (from PRD File 01 Section 13):
  - Quote blocked without approved survey
  - Atomic reservation under concurrent calls (two sessions)
  - Order-confirm automation (single transaction)
  - Scan rejects (wrong product/order/duplicate/unknown)
  - Warranty dates per product
  - Free vs paid ticket decision
  - Profit view completeness flags
  - RLS: Technician cannot see cost
  - RLS: Sales only see own leads
  - RLS: Warehouse cannot see payments
- **Run**: `npx supabase test db`

### 13.2 Playwright E2E (Golden Path)
- **Location**: `tests/e2e/golden-path.spec.ts`
- **The demo script** (File 00 Section 8):
  1. Submit web form → Lead appears
  2. Qualify → Project created, survey scheduled
  3. Survey submitted → Manager approves → Quote unlocks
  4. Create quote from template → BOM auto-fills → Send link
  5. Customer accepts → Order → Record payment → AUTO: reserve + picklist + job + notifications
  6. Dispatch scan (reject wrong serial, accept correct) → Delivery confirmed → Warranty starts
  7. Install form offline → Sync → Signature → Job closes
  8. +18 months → Ticket created → Warranty check → Free service
  9. Dashboard → Job profit, open jobs, share link
- **Run**: `npx playwright test --headed`

### 13.3 Unit Tests (TypeScript)
- **Location**: `src/**/*.test.ts`
- **Coverage**:
  - Money formatting (paise → ₹, commas)
  - Phone normalization (E.164)
  - Date formatting (IST)
  - Serial validation
  - Token hashing
  - Error code parsing
- **Run**: `npx vitest`

---

## Phase 14: UI/UX Polish (P1)

### 14.1 shadcn/ui Components
```bash
npx shadcn@latest add button input label select textarea dialog sheet table tabs badge card dropdown-menu form checkbox switch calendar popover command skeleton separator alert toast sonner progress tooltip
```

### 14.2 Shared Components
- **Location**: `src/components/shared/`
- **Components**:
  - `StatusBadge` (color-coded status chips)
  - `MoneyText` (formatted ₹ with commas)
  - `DateText` (IST formatted)
  - `EmptyState` (no data placeholder)
  - `ConfirmDialog` (destructive actions)
  - `RoleGate` (hide UI per role)
  - `Timeline` (audit/status history)

### 14.3 Field Components
- **Location**: `src/components/field/`
- **Mobile-first**, large touch targets
- **Components**:
  - `PhotoCapture` (camera with compression)
  - `SignaturePad` (on-screen signature)
  - `OfflineBanner` (sync status)
  - `ScannerSheet` (barcode reader)

### 14.4 Design System
- **Colors**: Tailwind palette with semantic names
  - Primary: Blue (links, CTAs)
  - Success: Green (approved, completed)
  - Warning: Amber (pending, expiring)
  - Danger: Red (rejected, errors, overdue)
  - Gray: Text, borders, backgrounds
- **Typography**: Inter (body), JetBrains Mono (code/serials)
- **Spacing**: 4px base grid
- **Breakpoints**: Mobile-first, tablet 768px, desktop 1024px

---

## Phase 15: PWA & Offline (P1)

### 15.1 Serwist Setup
- **Config**: `next.config.ts` with Serwist plugin
- **Service Worker**: `src/app/sw.ts`
- **Strategies**:
  - `/field/**`: NetworkFirst (3s timeout)
  - Static assets: StaleWhileRevalidate
  - Images: CacheFirst
- **Offline fallback**: `/offline` page

### 15.2 Manifest
- **File**: `public/manifest.webmanifest`
- **Name**: "SunPower Field"
- **Start URL**: `/field`
- **Display**: `standalone`
- **Icons**: 192px, 512px, maskable
- **Theme color**: Blue

### 15.3 IndexedDB (idb)
- **Database**: `sunpower-field`
- **Stores**: jobs, drafts, photos, outbox
- **Sync logic**: `src/lib/offline/sync.ts`
- **Triggers**: online event, visibility change, manual button
- **Lock**: `navigator.locks` (prevent concurrent sync)

---

## Phase 16: PDF Generation (P1)

### 16.1 Font Setup
- **Download**: Noto Sans Regular + Bold
- **Location**: `public/fonts/`
- **Register**: `@react-pdf/renderer` Font.register (₹ glyph support)

### 16.2 PDF Templates
- **Location**: `src/lib/pdf/`
- **Files**:
  - `QuotePdf.tsx` (customer-facing, no cost/margin)
  - `InvoicePdf.tsx` (GST format)
  - `LabelPdf.tsx` (50×25mm QR label, P2)
- **Route Handlers**: `app/api/pdf/*` (Node runtime)
- **Storage**: Generated PDFs → `documents` bucket

---

## Phase 17: Scheduled Jobs (P1)

### 17.1 pg_cron Setup
- **Enable**: Supabase Dashboard → Database → Extensions → pg_cron
- **Jobs** (File 01 Section 11):
  - Expire quotes (every 30 min)
  - Follow-up overdue (daily 09:00 IST)
  - Stale pending payment (daily 09:30 IST)
  - Warranty expiring (weekly Mon 09:30 IST)
  - Ticket SLA breach (every 30 min)
  - Share-link cleanup (daily 02:30 IST)
  - Missing time entries (daily 19:30 IST)
- **SQL functions**: Each job calls an RPC

---

## Phase 18: Deployment (FINAL)

### 18.1 Vercel
- **Connect** repo
- **Environment variables**: Copy from `.env.local`
- **Build command**: `npm run build`
- **Deploy**: Automatic on push to main

### 18.2 Supabase
- **Production project**: Separate from local
- **Migrations**: `npx supabase db push --linked`
- **Seed**: Run seed script via SQL editor
- **Backups**: Enable in dashboard

### 18.3 Clerk
- **Production instance**: Create in Clerk dashboard
- **Supabase integration**: Add production Supabase URL
- **Webhook**: Add production webhook endpoint
- **Restrict signups**: Enable in dashboard

### 18.4 Post-Deploy
- [ ] Test golden path in production
- [ ] Invite demo users (all 7 roles)
- [ ] Generate demo data (1-2 complete projects)
- [ ] Monitor Sentry/logs for errors
- [ ] Set up alerts (Supabase, Clerk, Vercel)

---

## Clerk Dashboard Configuration (DO THIS NOW)

### Step 1: Clerk Dashboard Setup
1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application `app_3MPFbTRzkAcDTGKLiTm3AAgtV3j`

### Step 2: Configure Supabase Integration
1. In Clerk Dashboard → **Integrations**
2. Find **Supabase** → Click **Configure**
3. Enter your Supabase project URL: `process.env.NEXT_PUBLIC_SUPABASE_URL`
4. Save

### Step 3: Customize Session Token
1. In Clerk Dashboard → **Sessions** → **Customize session token**
2. Add this JSON:
```json
{
  "app_role": "{{user.public_metadata.role}}"
}
```
3. Save

### Step 4: Configure Webhook
1. In Clerk Dashboard → **Webhooks** → **Add Endpoint**
2. Endpoint URL: `https://your-domain.com/api/webhooks/clerk` (for now use ngrok or local tunnel)
3. Subscribe to events:
   - `user.created`
   - `user.updated`
   - `user.deleted`
4. Copy **Signing Secret** to `.env.local` as `CLERK_WEBHOOK_SIGNING_SECRET`

### Step 5: Configure Sign-up Restrictions (Optional)
1. In Clerk Dashboard → **User & Authentication** → **Restrictions**
2. Set to **Restricted** (invite-only) OR
3. Leave open for hackathon (users land on `/pending-role`)

---

## Development Workflow

### Daily Workflow
```bash
# Start Supabase local
npx supabase start

# Start Next.js dev server
npm run dev

# Run migrations (when you create new ones)
npx supabase db reset

# Generate types (after schema changes)
npx supabase gen types typescript --linked > src/types/database.ts

# Run tests
npx vitest                    # Unit tests
npx supabase test db          # pgTAP tests
npx playwright test           # E2E tests
```

### Creating a New Feature
1. Design RPC function in `supabase/migrations/`
2. Write pgTAP test in `supabase/tests/`
3. Create server action in `src/modules/*/actions.ts`
4. Create UI component
5. Add to route in `app/`
6. Test manually + E2E

### Git Workflow
```bash
# Feature branch
git checkout -b feature/leads-module

# Commit migrations separately
git add supabase/migrations/*.sql
git commit -m "feat(db): add leads table and RPCs"

# Commit code
git add src/ app/
git commit -m "feat(leads): implement lead queue and form"

# Push and PR
git push origin feature/leads-module
```

---

## Priority Decision Matrix

| Feature | Priority | Why | Implement When |
|---------|----------|-----|----------------|
| Auth + middleware | P0 | ✅ DONE | Phase 0 |
| Database schema | P0 | Foundation for everything | Phase 1 |
| Lead form + queue | P0 | Demo entry point | Phase 2 |
| Survey + approval | P0 | Unlocks quote (gate) | Phase 3 |
| Quote generation | P0 | Core value prop | Phase 4 |
| Order automation | P0 | The magic moment | Phase 5 |
| Dispatch scanning | P0 | Golden thread starts | Phase 6 |
| Warranty automation | P0 | Golden thread continues | Phase 7 |
| Install form | P0 | Field work capture | Phase 8 |
| Service tickets | P0 | Post-install support | Phase 9 |
| Dashboard + profit | P0 | Director's decision tool | Phase 10 |
| Notifications | P0 | Replaces phone calls | Phase 11 |
| Catalogue + templates | P0 | Data for quotes | Phase 12 |
| Tests | P0 | Confidence for demo | Phase 13 |
| UI polish | P1 | Professional look | Phase 14 |
| Offline PWA | P1 | Field reliability | Phase 15 |
| PDFs | P1 | Customer deliverable | Phase 16 |
| Cron jobs | P1 | Operational hygiene | Phase 17 |
| Asset passport QR | P2 | Wow factor | After P0+P1 |
| WhatsApp webhook | P2 | Automation | After P0+P1 |
| UPI payment link | P2 | Collection aid | After P0+P1 |
| Email/SMS | P2 | Multi-channel | After P0+P1 |
| EMI calculator | P2 | Sales tool | After P0+P1 |
| Savings estimate | P2 | Sales pitch | After P0+P1 |
| Photo AI QA | P2 | Quality control | After P0+P1 |

---

## Success Metrics

### Demo Success (Hackathon Judging)
- [ ] Complete golden path runs without errors (< 10 min)
- [ ] Every major gate demonstrated (survey approval, payment automation, warranty)
- [ ] Real-time updates visible (new lead appears, notifications fire)
- [ ] Offline-online transition works (save form offline, sync online)
- [ ] Serial scan rejection and acceptance shown
- [ ] Dashboard shows profit + open items
- [ ] Shareable report link works

### Technical Success
- [ ] All P0 requirements from PRD implemented
- [ ] All pgTAP tests pass
- [ ] Golden path E2E test passes
- [ ] No console errors or warnings
- [ ] Lighthouse score > 90 (performance, a11y, best practices)
- [ ] Mobile-responsive (all key flows work on phone)
- [ ] RLS policies prevent unauthorized access (tested)
- [ ] Idempotency prevents duplicates (tested)

### Business Success (Post-Hackathon)
- Zero lost leads (all web forms captured)
- Zero hand-typed quotes (all from templates)
- 100% serial capture for tracked items
- Warranty lookup < 5 seconds
- Job margin visible within 1 minute of job close
- Director uses dashboard daily

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Complex automations break atomicity | HIGH | Use Postgres functions + transactions, test with pgTAP |
| RLS policies leak data | HIGH | Test with all 7 roles, never use `SELECT *` |
| Offline sync conflicts | MED | Server status always wins, explicit conflict UI |
| Slow warranty lookup | MED | Index on customer phone, asset serial, compound on (customer_id, product_id) |
| Scanner doesn't work on some phones | MED | Always provide manual-entry fallback |
| Double-submit creates duplicates | MED | Idempotency keys on all mutations |
| GST rates wrong | LOW | Setting with CA warning, per-product override |
| Subsidy rules change | LOW | All in settings, not hardcoded |

---

## Questions for Client (Before Phase 2)

1. **Subsidy tiers**: Confirm ₹30k/kW (first 2 kW) + ₹18k/kW (3rd kW), cap ₹78k. Any state top-up?
2. **GST rates**: 12% goods, 18% service? Or different? (Need CA confirmation)
3. **Warranty start**: Delivery date or installation date? (Setting exists, what's preference?)
4. **Panel serials**: Individual scan or batch entry? (Setting exists, what's field preference?)
5. **Payment gates**: Advance % to confirm order? Full payment before dispatch/commissioning? (Settings exist, what's policy?)
6. **Discount limits**: Max discount without approval? Min margin threshold?
7. **System size suggestions**: Current thresholds OK? (0-150 units → 1-2 kW, etc.)
8. **Follow-up**: Max contact attempts before "unreachable"? (Default 5)
9. **SLA**: High-priority tickets hours? Normal? (Default 24h / 72h)
10. **Technician pay**: Hourly or per-job or both? Default hourly rate?

---

## Next Immediate Steps

### 1. Configure Clerk (10 minutes)
Follow "Clerk Dashboard Configuration" section above

### 2. Set Up Supabase Schema (2-3 hours)
```bash
# Create migration file
npx supabase migration new initial_schema

# Write schema from PRD File 03 (or use provided schema files)
# Run migration
npx supabase db reset
```

### 3. Seed Demo Data (1 hour)
```bash
# Create seed script
# Run seed script
```

### 4. Test Auth Flow (30 minutes)
```bash
npm run dev
# Visit http://localhost:3000
# Sign up → pending-role page
# Manually set role in Supabase dashboard
# Refresh → should redirect to dashboard
```

### 5. Start Building (Phases 2-18)
Proceed phase by phase, testing each before moving to next

---

## Resources

- **PRD Files**: `public/Plan/*.md` (00-07)
- **Next.js Docs**: https://nextjs.org/docs
- **Clerk Docs**: https://clerk.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **shadcn/ui**: https://ui.shadcn.com
- **pgTAP**: https://pgtap.org
- **Playwright**: https://playwright.dev

---

## Summary

**Authentication is DONE** ✅. You now have:
- Clerk middleware with role-based route protection
- Supabase clients (user, admin, browser)
- Auth helpers (getProfile, requireRole, roles)
- Sign-in/sign-up pages
- Pending-role and forbidden pages
- Clerk webhook for user sync
- ClerkProvider in root layout

**Next**: Configure Clerk Dashboard, set up Supabase schema, and start building features phase by phase following this plan.

The implementation is comprehensive but achievable. Each phase builds on the previous. Test as you go. The golden thread (serial → asset → warranty → ticket → profit) is the north star.

**Good luck! 🚀**
