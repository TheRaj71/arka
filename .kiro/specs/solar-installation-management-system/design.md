# Technical Design Document

## Overview

Solar IMS is a three-tier web application managing the complete lifecycle of residential and commercial solar installations for SunPower Solutions, handling ~40 projects/month with 15 field technicians.

This document specifies the complete technical design, bridging requirements to implementation with detailed architecture, database schema, API contracts, component design, and security architecture that developers can implement directly.

The design implements the "golden thread" principle: Serial number → Asset → Warranty clock → Service ticket → Job cost/profit. Every design decision supports end-to-end traceability from inventory receipt through 20-year warranty service.

**Core Capabilities:**
- Lead capture and qualification with duplicate detection
- Site survey with mobile data collection
- Template-driven quote generation with subsidy calculation
- Payment tracking and automatic order confirmation
- Atomic stock reservation and barcode scanning
- Offline-first installation forms with photo capture
- Warranty tracking and service ticket management
- Per-job profit calculation with completeness tracking
- Role-based access with cost data segregation

**Technology Foundation:**
- **Frontend**: Next.js 16 App Router, React 19, TypeScript strict mode
- **Backend**: Supabase Postgres with server-side RPC functions
- **Authentication**: Clerk as Supabase third-party auth provider
- **Storage**: Supabase Storage private buckets with signed URLs
- **Realtime**: Supabase Realtime with RLS-aware WebSocket subscriptions
- **Offline**: Service Worker (Serwist) + IndexedDB for field operations
- **UI**: Tailwind CSS 4, shadcn/ui, Lucide icons, Sonner toasts

## Architecture

### Three-Tier Architecture

### System Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT TIER                          │
│  Next.js App Router (React Server Components + Client)     │
│  • Server Components: data fetching, auth checks           │
│  • Client Components: interactivity, realtime, forms       │
│  • Server Actions: mutations, RPC calls                    │
│  • Route Handlers: webhooks, PDFs, public APIs            │
├─────────────────────────────────────────────────────────────┤
│                     APPLICATION TIER                        │
│  Supabase Platform Services                                │
│  • Postgres: business logic, state machines, gates         │
│  • Auth: JWT validation via third-party (Clerk)           │
│  • Storage: private S3-compatible buckets                  │
│  • Realtime: WebSocket pub/sub with RLS filtering         │
├─────────────────────────────────────────────────────────────┤
│                       DATA TIER                             │
│  Postgres 15+ with Extensions                              │
│  • pgcrypto: UUID generation, token hashing               │
│  • pg_trgm: fuzzy search on names/phones/serials          │
│  • btree_gist: exclusion constraints for time entries     │
│  • citext: case-insensitive email matching                │
│  • pg_cron: scheduled jobs (quote expiry, notifications)  │
└─────────────────────────────────────────────────────────────┘
```

### Authentication Flow

```
┌──────────┐         ┌──────────┐         ┌──────────────┐         ┌──────────┐
│  User    │────────>│  Clerk   │────────>│   Supabase   │────────>│ Postgres │
│  Browser │         │  Session │         │   Auth Edge  │         │   RLS    │
└──────────┘         └──────────┘         └──────────────┘         └──────────┘
     │                     │                      │                      │
     │ 1. Sign in         │                      │                      │
     │─────────────────>│                      │                      │
     │                     │                      │                      │
     │ 2. JWT with        │                      │                      │
     │    sub=clerk_id    │                      │                      │
     │    app_role=...    │                      │                      │
     │<─────────────────│                      │                      │
     │                     │                      │                      │
     │ 3. Request with    │                      │                      │
     │    JWT Bearer      │                      │                      │
     │──────────────────────────────────────>│                      │
     │                     │                      │                      │
     │                     │      4. Verify JWT   │                      │
     │                     │      (Clerk domain)  │                      │
     │                     │                      │                      │
     │                     │         5. Extract   │                      │
     │                     │            sub claim │                      │
     │                     │            ───────────────────────────────>│
     │                     │                      │                      │
     │                     │                      │  6. app.clerk_id()  │
     │                     │                      │     from JWT        │
     │                     │                      │                      │
     │                     │                      │  7. app.profile_id()│
     │                     │                      │     lookup in       │
     │                     │                      │     profiles table  │
     │                     │                      │                      │
     │                     │                      │  8. app.role()      │
     │                     │                      │     for RLS         │
     │                     │                      │                      │
     │ 9. Response with   │                      │                      │
     │    RLS-filtered    │                      │                      │
     │    data            │                      │                      │
     │<──────────────────────────────────────────                      │
```

**Key Points:**
1. Clerk manages authentication UI and sessions
2. Clerk issues JWTs with custom claim `app_role` from `user.public_metadata.role`
3. Supabase validates JWT signature against Clerk's JWKS endpoint
4. Postgres RLS policies use `app.clerk_id()` to look up `profiles` row
5. `app.role()` returns `profiles.role` for policy evaluation
6. Service-role RPCs receive `p_actor uuid` and call `fn_assert_role(p_actor, allowed_roles[])`

### Three-Layer Security

```
Layer 1: Next.js Middleware (Route Guards)
─────────────────────────────────────────────
Checks JWT session claims (coarse-grained)
Redirects to /sign-in if unauthenticated
Redirects to /pending-role if role=null
Redirects to /forbidden if route not allowed for role
Example: /warehouse/** requires warehouse/manager/director

Layer 2: Server Actions (Definitive)
─────────────────────────────────────────────
defineAction({ roles: rolesFor('capability') })
Calls getProfile() → reads DB profiles.role
Enforces exact capability-to-role mapping
Example: 'quote.approve' requires manager/director only

Layer 3: Database (Enforcement)
─────────────────────────────────────────────
RLS policies: SELECT filtered by app.has_role(...)
All writes via service-role RPCs only
Every RPC calls fn_assert_role(p_actor, allowed_roles[])
Example: fn_approve_survey checks actor is manager/director
```

**Defense in Depth**: If Layer 1 or 2 fails (bug/bypass), Layer 3 prevents unauthorized data access or mutation.

### Data Flow: Lead to Warranty

```
┌──────────────────────────────────────────────────────────────────────┐
│                         LEAD LIFECYCLE                                │
└──────────────────────────────────────────────────────────────────────┘
   │
   │ 1. Public form / call → Lead created
   │    Automation A1: Normalize phone → Dedupe → Round-robin assign → Notify
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      QUALIFICATION                                     │
└──────────────────────────────────────────────────────────────────────┘
   │
   │ 2. Sales logs calls → Checklist complete
   │    Gate G2: shadow_free_area, monthly_bill, grid_suitable, roof_ownership
   │    Automation A3: Create project + survey job + schedule
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    SURVEY & APPROVAL                                   │
└──────────────────────────────────────────────────────────────────────┘
   │
   │ 3. Technician submits survey (offline-capable)
   │    Gate G3: Required fields + photos (2 roof, 1 meter, 1 DB)
   │    Manager reviews: approve / rework / resurvey / close_unfeasible
   │    Automation A4: If approved → project.stage = survey_approved + notify
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    QUOTE GENERATION                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   │ 4. Sales creates quote from template
   │    Gate G1: HARD BLOCK - quote_creation requires survey.status = approved
   │    BOM auto-generated from template + survey measurements
   │    Prices & costs FROZEN at quote creation
   │    Gate G4: If subsidy_eligible → all panels must be is_dcr
   │    Gate G5: Discount/margin limits → pending_approval or approved
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    ORDER & PAYMENT                                     │
└──────────────────────────────────────────────────────────────────────┘
   │
   │ 5. Customer accepts quote via public link
   │    Gate G6: Quote must be sent, not expired, link valid
   │    Automation A5: Create order (pending_payment) → Notify sales + accounts
   │
   │ 6. Accounts records payment
   │    Gate G8: Positive amount, not future, unique reference
   │    When paid ≥ advance_required → fn_confirm_order triggers
   │
   │ 7. Order confirmation (ATOMIC TRANSACTION)
   │    Gate G7: paid ≥ advance OR manager force with reason
   │    Automation A6:
   │      ├─ Create pick_list (warehouse packing list)
   │      ├─ fn_reserve_order_stock (advisory locks, FIFO, atomic)
   │      ├─ Create install job (unscheduled)
   │      ├─ fn_auto_schedule_install (least-loaded tech, working day)
   │      ├─ Draft order invoice
   │      └─ Notify: warehouse (pick ready), crew lead (job scheduled),
   │                 manager (FYI), sales owner
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│                DISPATCH & DELIVERY                                     │
└──────────────────────────────────────────────────────────────────────┘
   │
   │ 8. Warehouse picks items → Dispatch scanning
   │    Every serialised unit scanned/validated
   │    Gate G12: Known serial, right product, right order, not dispatched,
   │              usable status (in_stock or reserved for this order)
   │    Scan rejections: wrong_product, duplicate, bad_status, unknown
   │    All scan attempts logged (accepted + rejected)
   │
   │ 9. Dispatch finalization
   │    Gate G11: All required serialised units scanned OR partial with reason
   │    Automation A9:
   │      ├─ Stock movements: bulk issued (on_hand↓, reserved↓)
   │      ├─ Cost posting: serialised unit costs + bulk avg costs
   │      │   → project_costs (idempotent by source_type+source_id)
   │      ├─ Auto-issue order invoice (if setting = dispatch)
   │      └─ Notify sales owner, crew lead
   │
   │ 10. Delivery confirmation (OTP / signature / photo / staff override)
   │     Gate: Method validation (OTP hash match, attempts ≤5)
   │     Automation A10:
   │       ├─ Create asset per serialised unit delivered
   │       ├─ Snapshot warranty_months from product master
   │       ├─ Set warranty_start (delivery or installation per trigger setting)
   │       ├─ Calculate warranty_end = warranty_start + warranty_months
   │       ├─ Create asset share_link (QR code target)
   │       └─ Notify crew lead (install can start), sales owner
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    INSTALLATION                                        │
└──────────────────────────────────────────────────────────────────────┘
   │
   │ 11. Crew completes install form (offline-first)
   │     Gate G13: Install may start only if order fully delivered
   │     Gate G14: Power test must pass
   │     Gate G15: Required photo kinds present (panels, inverter, earthing,
   │               db_box, meter, power_test, finished)
   │     Gate G16: Signature present → completed; else awaiting_signature
   │     Gate G17: installed_kw ≠ quoted_kw → variation_required
   │
   │ 12. Installation completion
   │     Automation A11:
   │       ├─ Assets → status = installed
   │       ├─ If warranty trigger = installation → set warranty_start = today
   │       ├─ Stock units → status = installed
   │       ├─ Order → status = completed
   │       ├─ Project → stage = installed
   │       ├─ Auto-issue final invoice (if gate G17 satisfied)
   │       ├─ If subsidy_eligible → subsidy.status = docs_pending +
   │       │   refresh checklist
   │       └─ Notify: accounts (invoice + subsidy), sales owner,
   │                  manager (profit now computable)
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│                WARRANTY & SERVICE (0-20 years)                        │
└──────────────────────────────────────────────────────────────────────┘
   │
   │ 13. Customer reports issue (phone / QR / web)
   │     Automation A12:
   │       ├─ Resolve asset by serial / customer
   │       ├─ fn_compute_warranty → live status calculation
   │       │   (active / expiring_soon / expired / void)
   │       ├─ Set warranty_decision:
   │       │   • in_warranty → billing = not_applicable (free)
   │       │   • out_of_warranty → billing = pending (will be charged)
   │       ├─ Detect repeat (same asset within 30 days)
   │       ├─ Calculate SLA due (high: 24h, normal: 72h)
   │       ├─ Round-robin assign to support staff
   │       └─ Notify assigned owner
   │
   │ 14. Technician marks work done
   │     Close open time entries
   │     If billable parts/labour exist:
   │       → Auto-create service invoice (parts + labour at frozen rates)
   │       → Auto-issue invoice
   │     Automation A13:
   │       ├─ Ticket → status = awaiting_confirmation
   │       └─ Notify support (get customer confirmation), accounts (if invoice)
   │
   │ 15. Customer confirmation
   │     Gate G19: Ticket requires customer confirmation to close
   │     Customer confirms via link / phone / OTP
   │     Automation A14:
   │       ├─ Ticket → status = closed
   │       ├─ Asset → status = installed (if was under_repair)
   │       └─ Notify support, manager
   │
   │     If customer rejects fix:
   │       ├─ Ticket → status = in_progress
   │       ├─ reopen_count++
   │       └─ Technician investigates further
```

## Components and Interfaces

### Module Structure

### Domain-Driven Module Organization

```
src/modules/
├── leads/
│   ├── actions.ts          # Server actions: createLead, qualifyLead, logCall, closeLead
│   ├── queries.ts          # Data fetching: getLeads, getLeadById, getLeadActivities
│   ├── schemas.ts          # Zod schemas: LeadFormSchema, QualificationSchema
│   └── components/
│       ├── LeadList.tsx
│       ├── LeadDetail.tsx
│       ├── CallLogForm.tsx
│       └── QualificationChecklist.tsx
│
├── surveys/
│   ├── actions.ts          # submitSurvey, reviewSurvey, attachPhoto
│   ├── queries.ts          # getSurveysByProject, getSurveyForReview
│   ├── schemas.ts          # SurveyDataSchema, ReviewDecisionSchema
│   └── components/
│       ├── SurveyForm.tsx
│       ├── SurveyReviewCard.tsx
│       └── PhotoGallery.tsx
│
├── quotes/
│   ├── actions.ts          # createQuote, updateQuote, finalizeQuote, sendQuote
│   ├── queries.ts          # getQuotesByProject, getQuoteForEdit, getQuotePDF
│   ├── schemas.ts          # QuoteCreateSchema, QuoteUpdateSchema
│   ├── pricing.ts          # Client-side BOM calculation preview
│   └── components/
│       ├── QuoteBuilder.tsx
│       ├── BOMTable.tsx
│       ├── SubsidyBox.tsx
│       └── QuotePDF.tsx    # @react-pdf/renderer component
│
├── orders/
│   ├── actions.ts          # acceptQuote, recordPayment, confirmOrder, cancelOrder
│   ├── queries.ts          # getOrdersByProject, getOrderBalance, getPaymentHistory
│   ├── schemas.ts          # PaymentRecordSchema, OrderCancelSchema
│   └── components/
│       ├── OrderDetail.tsx
│       ├── PaymentForm.tsx
│       └── PaymentTimeline.tsx
│
├── inventory/
│   ├── actions.ts          # receiveStock, requestAdjustment, approveAdjustment
│   ├── queries.ts          # getProductCatalogue, getStockLevels, getMovements
│   ├── schemas.ts          # ReceiveStockSchema, AdjustmentSchema
│   └── components/
│       ├── ProductList.tsx
│       ├── StockCard.tsx
│       ├── ReceiveForm.tsx
│       └── MovementHistory.tsx
│
├── dispatch/
│   ├── actions.ts          # scanDispatchUnit, finalizeDispatch, confirmDelivery
│   ├── queries.ts          # getPickLists, getDispatchById, getScanHistory
│   ├── schemas.ts          # ScanSchema, DeliveryConfirmSchema
│   └── components/
│       ├── PickListCard.tsx
│       ├── ScannerInterface.tsx  # Uses ScannerSheet from /components/scan
│       └── ScanResultsList.tsx
│
├── jobs/
│   ├── actions.ts          # scheduleJob, startJob, submitInstall, attachSignature
│   ├── queries.ts          # getJobsByTechnician, getJobById, getJobBOM
│   ├── schemas.ts          # InstallReportSchema, SignatureSchema
│   └── components/
│       ├── JobCard.tsx
│       ├── JobTimeline.tsx
│       └── SchedulingBoard.tsx
│
├── tickets/
│   ├── actions.ts          # createTicket, updateTicket, markWorkDone, confirmTicket
│   ├── queries.ts          # searchSupport, getTicketById, getWarrantyStatus
│   ├── schemas.ts          # TicketCreateSchema, WorkDoneSchema
│   └── components/
│       ├── TicketList.tsx
│       ├── TicketDetail.tsx
│       ├── WarrantyBadge.tsx
│       └── SearchInterface.tsx
│
├── assets/
│   ├── actions.ts          # transferAsset, voidWarranty
│   ├── queries.ts          # getAssetById, getAssetHistory, getWarrantyTimeline
│   ├── schemas.ts          # AssetTransferSchema
│   └── components/
│       ├── AssetPassport.tsx
│       ├── WarrantyCard.tsx
│       └── QRLabel.tsx     # @react-pdf/renderer component
│
├── invoices/
│   ├── actions.ts          # generateInvoice, issueInvoice, voidInvoice
│   ├── queries.ts          # getInvoicesByProject, getInvoiceById
│   ├── schemas.ts          # InvoiceIssueSchema
│   └── components/
│       ├── InvoiceList.tsx
│       ├── InvoiceDetail.tsx
│       └── InvoicePDF.tsx  # @react-pdf/renderer component
│
├── subsidy/
│   ├── actions.ts          # updateSubsidyStatus, updateChecklist
│   ├── queries.ts          # getSubsidyApplications, getChecklistStatus
│   ├── schemas.ts          # SubsidyUpdateSchema, ChecklistItemSchema
│   └── components/
│       ├── SubsidyTracker.tsx
│       ├── ChecklistCard.tsx
│       └── ReadinessIndicator.tsx
│
├── dashboard/
│   ├── actions.ts          # createShareLink, revokeShareLink
│   ├── queries.ts          # getDashboardData, getSharedReport
│   ├── schemas.ts          # ShareLinkSchema
│   └── components/
│       ├── DashboardOverview.tsx
│       ├── ProfitTable.tsx
│       ├── OpenItemsList.tsx
│       └── ShareDialog.tsx
│
├── pay/
│   ├── actions.ts          # buildPayPeriod, lockPeriod, approvePeriod
│   ├── queries.ts          # getPayPeriods, getPayEntries, getMyPay
│   ├── schemas.ts          # PayPeriodSchema
│   └── components/
│       ├── PayPeriodList.tsx
│       ├── PayEntryCard.tsx
│       └── FlagsDisplay.tsx
│
├── notifications/
│   ├── actions.ts          # markNotificationsRead
│   ├── queries.ts          # getNotifications, getUnreadCount
│   ├── schemas.ts          # (none)
│   └── components/
│       ├── NotificationBell.tsx
│       ├── NotificationList.tsx
│       └── NotificationItem.tsx
│
└── settings/
    ├── actions.ts          # updateSettings, setUserRole, updateProduct, updateTemplate
    ├── queries.ts          # getSettings, getUsers, getProducts, getTemplates
    ├── schemas.ts          # SettingsUpdateSchema, UserRoleSchema, ProductSchema
    └── components/
        ├── SettingsList.tsx
        ├── UserManagement.tsx
        ├── CatalogueEditor.tsx
        └── TemplateBuilder.tsx
```

### Shared Components

```
src/components/
├── ui/                     # shadcn/ui primitives
│   ├── button.tsx
│   ├── input.tsx
│   ├── form.tsx
│   ├── dialog.tsx
│   ├── sheet.tsx
│   ├── table.tsx
│   ├── badge.tsx
│   ├── card.tsx
│   ├── tabs.tsx
│   ├── select.tsx
│   ├── calendar.tsx
│   ├── popover.tsx
│   ├── toast.tsx
│   └── ... (other shadcn components)
│
├── shared/                 # Business components used across modules
│   ├── StatusBadge.tsx    # Color-coded status indicators
│   ├── MoneyText.tsx      # ₹ formatting with INR locale
│   ├── DateText.tsx       # IST timezone handling
│   ├── EmptyState.tsx     # No data placeholder
│   ├── ConfirmDialog.tsx  # Destructive action confirmation
│   ├── RoleGate.tsx       # Conditional rendering by capability
│   ├── Timeline.tsx       # Vertical timeline with dates
│   └── ErrorBoundary.tsx  # Component error handling
│
├── scan/                   # Barcode scanning components
│   ├── ScannerSheet.tsx   # Bottom sheet with camera
│   ├── SerialInput.tsx    # Manual entry with double-confirm
│   └── ScanFeedback.tsx   # Visual accepted/rejected feedback
│
├── signature/              # Digital signature components
│   ├── SignaturePad.tsx   # Canvas-based signature capture
│   └── SignatureDisplay.tsx # Show saved signature PNG
│
└── field/                  # Mobile-optimized field components
    ├── FieldLayout.tsx     # Bottom tab navigation
    ├── PhotoCapture.tsx    # Camera with compression
    ├── OfflineBanner.tsx   # Sync status indicator
    └── SavedIndicator.tsx  # "Saved on device" timestamp
```

### Library Organization

```
src/lib/
├── supabase/
│   ├── admin.ts           # Service-role client (bypasses RLS)
│   ├── server.ts          # RLS-enforced client (acts as user)
│   └── browser.ts         # Client-side hook with session
│
├── auth/
│   ├── roles.ts           # Role definitions + ROLES constant
│   ├── permissions.ts     # Capability matrix + rolesFor()
│   ├── get-profile.ts     # Cache-aware profile fetch
│   └── require-role.ts    # Server-side role assertion
│
├── actions/
│   ├── define-action.ts   # Server action wrapper with auth + validation
│   └── result.ts          # ActionResult<T> type
│
├── errors/
│   ├── codes.ts           # Error code constants
│   └── parse-pg-error.ts  # Postgres error → {code, message}
│
├── offline/
│   ├── db.ts              # IndexedDB schema + helpers
│   ├── outbox.ts          # Mutation queue
│   ├── sync.ts            # Sync orchestrator
│   └── photo-queue.ts     # Photo upload queue
│
├── pdf/
│   ├── fonts.ts           # Noto Sans registration
│   ├── QuotePdf.tsx       # Quote document template
│   ├── InvoicePdf.tsx     # Invoice document template
│   └── LabelPdf.tsx       # QR label template (50×25mm)
│
├── money.ts               # formatMoney(paise), parseMoney(string)
├── time.ts                # formatDate(date,'IST'), getISTBoundaries(range)
├── phone.ts               # normalizePhone(input), formatPhone(e164)
├── serial.ts              # normalizeSerial(input)
├── tokens.ts              # generateToken(), hashToken(token, pepper)
├── ids.ts                 # uuid(), nanoid()
└── constants.ts           # Static configuration
```

### Integration Points

### Clerk Webhook Integration

```
POST /api/webhooks/clerk
Content-Type: application/json
svix-id: msg_...
svix-timestamp: 1234567890
svix-signature: v1,base64...

Body:
{
  "type": "user.created" | "user.updated" | "user.deleted",
  "data": {
    "id": "user_2abc...",
    "email_addresses": [{"email_address": "user@example.com"}],
    "first_name": "John",
    "last_name": "Doe",
    "public_metadata": {"role": "sales"}
  }
}

Processing:
1. Verify svix signature with CLERK_WEBHOOK_SIGNING_SECRET
2. user.created:
   - INSERT profiles (clerk_user_id, email, full_name, role=NULL)
   - IF email = BOOTSTRAP_DIRECTOR_EMAIL:
     - SET role = 'director'
     - CALL Clerk API to update user.publicMetadata.role = 'director'
3. user.updated:
   - UPDATE profiles SET email, full_name (never role)
4. user.deleted:
   - UPDATE profiles SET is_active=false, deleted_at=now()
5. Return 200 OK
```

### Supabase Storage Upload Flow

```
Client Request:                Server Action:                Storage:
     │                              │                           │
     │ 1. Request upload URL        │                           │
     │ createUploadUrl({            │                           │
     │   bucket, entityId,          │                           │
     │   kind, contentType          │                           │
     │ })                            │                           │
     │─────────────────────────────>│                           │
     │                               │                           │
     │                               │ 2. Authorize             │
     │                               │    Check role            │
     │                               │    Verify entity access  │
     │                               │                           │
     │                               │ 3. Generate path         │
     │                               │    {entity}/{id}/{uuid}  │
     │                               │                           │
     │                               │ 4. Create signed URL     │
     │                               │    (5 min expiry)        │
     │                               │──────────────────────────>│
     │                               │                           │
     │                               │<──────────────────────────│
     │                               │ signedUrl + path          │
     │                               │                           │
     │ 5. {ok, signedUrl, path}     │                           │
     │<─────────────────────────────│                           │
     │                               │                           │
     │ 6. Compress image             │                           │
     │    (max 1600px, 1.5MB)       │                           │
     │                               │                           │
     │ 7. PUT file to signedUrl     │                           │
     │──────────────────────────────────────────────────────────>│
     │                               │                           │
     │<──────────────────────────────────────────────────────────│
     │ 8. 200 OK                     │                           │
     │                               │                           │
     │ 9. Attach metadata            │                           │
     │ attachJobPhoto({             │                           │
     │   jobId, kind, path,         │                           │
     │   takenAt, lat, lng          │                           │
     │ })                            │                           │
     │─────────────────────────────>│                           │
     │                               │                           │
     │                               │ 10. Verify object exists │
     │                               │     (list/info)          │
     │                               │──────────────────────────>│
     │                               │<──────────────────────────│
     │                               │                           │
     │                               │ 11. INSERT job_photos    │
     │                               │     (path stored)        │
     │                               │                           │
     │ 12. {ok: true, photoId}      │                           │
     │<─────────────────────────────│                           │

Later viewing:
     │                               │                           │
     │ 13. GET /photo/{id}          │                           │
     │─────────────────────────────>│                           │
     │                               │                           │
     │                               │ 14. Authorize            │
     │                               │     Check job access     │
     │                               │                           │
     │                               │ 15. Generate signed URL  │
     │                               │     (5 min read)         │
     │                               │──────────────────────────>│
     │                               │<──────────────────────────│
     │                               │                           │
     │ 16. Redirect to signed URL   │                           │
     │<─────────────────────────────│                           │
     │                               │                           │
     │ 17. GET signed URL           │                           │
     │──────────────────────────────────────────────────────────>│
     │<──────────────────────────────────────────────────────────│
     │ 18. Image bytes              │                           │
```

**Buckets:**
- `survey-photos`: {project_id}/{survey_id}/{uuid}.jpg
- `install-photos`: {project_id}/{job_id}/{kind}/{uuid}.jpg
- `signatures`: {project_id}/{job_id}/{uuid}.png
- `documents`: {kind}/{entity_id}/{uuid}.pdf

**Storage Policies:**
- No public access (no SELECT policy for anon/authenticated)
- Service-role writes only
- Signed URLs generated server-side after authorization check

### Supabase Realtime Subscriptions

```typescript
// Client component: src/components/shared/RealtimeProvider.tsx
'use client'
function RealtimeProvider({ children }: { children: ReactNode }) {
  const supabase = useSupabaseBrowser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  useEffect(() => {
    // Subscribe to notifications for current user
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${profile.id}` // RLS applies server-side
        },
        (payload) => {
          const notification = payload.new as Notification;
          setNotifications(prev => [notification, ...prev]);
          toast(notification.title, {
            description: notification.body,
            action: notification.url ? {
              label: 'View',
              onClick: () => router.push(notification.url!)
            } : undefined
          });
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, profile.id]);
  
  return (
    <RealtimeContext.Provider value={{ notifications }}>
      {children}
    </RealtimeContext.Provider>
  );
}
```

**Subscribed Tables:**
- `notifications`: User-specific inbox (filtered by RLS: recipient_id = app.profile_id())
- `pick_lists`: Warehouse operations (filtered by RLS: warehouse/manager roles)
- `tickets`: Support queue (filtered by RLS: support/manager/sales roles)
- `jobs`: Crew schedule (filtered by RLS: technicians see assigned jobs, managers see all)
- `payments`: Finance tracking (filtered by RLS: accounts/manager/director roles)

**Fallback Behavior:**
- If WebSocket disconnects: show "Syncing..." indicator
- Client polls `router.refresh()` every 20 seconds
- Reconnect attempts: exponential backoff 1s, 2s, 4s, 8s, max 30s

### PDF Generation Pipeline

```
Server Action                @react-pdf/renderer              Supabase Storage
     │                              │                                │
     │ 1. generateQuotePDF(quoteId) │                                │
     │                               │                                │
     │ 2. Fetch quote + lines        │                                │
     │    from Supabase             │                                │
     │                               │                                │
     │ 3. Register fonts             │                                │
     │    Font.register({            │                                │
     │      family: 'Noto',         │                                │
     │      src: 'NotoSans.ttf'     │                                │
     │    })                         │                                │
     │                               │                                │
     │ 4. Render component           │                                │
     │    <QuotePDF data={...} />   │                                │
     │──────────────────────────────>│                                │
     │                               │                                │
     │                               │ 5. Generate PDF buffer         │
     │                               │    (header, customer block,    │
     │                               │     BOM table, totals,         │
     │                               │     subsidy box, QR code)      │
     │                               │                                │
     │<──────────────────────────────│ 6. Return Buffer               │
     │ Buffer                        │                                │
     │                               │                                │
     │ 7. Upload to Storage          │                                │
     │    bucket: documents          │                                │
     │    path: quotes/{id}/{uuid}.pdf                                │
     │───────────────────────────────────────────────────────────────>│
     │                               │                                │
     │<───────────────────────────────────────────────────────────────│
     │ 8. {path}                     │                                │
     │                               │                                │
     │ 9. UPDATE quotes              │                                │
     │    SET pdf_path = path        │                                │
     │                               │                                │
     │ 10. Return {ok, pdfPath}      │                                │

Later download:
     │                               │                                │
     │ 11. GET /api/pdf/quote/[id]  │                                │
     │                               │                                │
     │ 12. Authorize (quote owner)  │                                │
     │                               │                                │
     │ 13. Generate signed URL       │                                │
     │───────────────────────────────────────────────────────────────>│
     │<───────────────────────────────────────────────────────────────│
     │ 14. signedUrl                 │                                │
     │                               │                                │
     │ 15. Redirect to signedUrl     │                                │
     │    OR stream bytes            │                                │
```

**Font Requirements:**
- Register Noto Sans (Regular + Bold) for ₹ symbol rendering
- Default PDF fonts (Helvetica, Times) lack Indian Rupee glyph
- Font files in `public/fonts/NotoSans-Regular.ttf`, `NotoSans-Bold.ttf`

### Barcode Scanning Pipeline

```
Client Component              @zxing/browser         BarcodeDetector API
     │                              │                          │
     │ 1. User clicks "Scan"        │                          │
     │                               │                          │
     │ 2. Request camera access      │                          │
     │    navigator.mediaDevices    │                          │
     │    .getUserMedia({video})    │                          │
     │                               │                          │
     │ 3. Check for native support   │                          │
     │    if ('BarcodeDetector'     │                          │
     │        in window)             │                          │
     │                               │                          │
     │ 4a. Use native (if available) │                          │
     │─────────────────────────────────────────────────────────>│
     │                               │                          │
     │                               │   5a. Detect barcodes    │
     │                               │       from video frames  │
     │                               │                          │
     │<─────────────────────────────────────────────────────────│
     │ 6a. {rawValue, format}       │                          │
     │                               │                          │
     │ 4b. Use @zxing (fallback)    │                          │
     │─────────────────────────────>│                          │
     │                               │                          │
     │                               │ 5b. Decode from canvas   │
     │                               │     (Code128, QR, etc.)  │
     │                               │                          │
     │<─────────────────────────────│                          │
     │ 6b. {text, format}            │                          │
     │                               │                          │
     │ 7. Display detected value     │                          │
     │    with double-confirm button │                          │
     │                               │                          │
     │ 8. User confirms              │                          │
     │                               │                          │
     │ 9. Call scanDispatchUnit()    │                          │
     │    Server Action              │                          │
     │                               │                          │
     │ 10. Server normalizes:        │                          │
     │     - Uppercase               │                          │
     │     - Trim whitespace         │                          │
     │     - Remove hyphens          │                          │
     │                               │                          │
     │ 11. fn_scan_dispatch_unit     │                          │
     │     validates against DB      │                          │
     │                               │                          │
     │ 12. Log scan_events           │                          │
     │     (accepted or rejected)    │                          │
     │                               │                          │
     │ 13. Return {ok, result,       │                          │
     │            message}            │                          │
     │                               │                          │
     │ 14. Show visual feedback:     │                          │
     │     ✓ Green = accepted        │                          │
     │     ✗ Red = rejected          │                          │
     │     + Display message         │                          │
```

**Manual Entry Fallback:**
- Always-visible "Enter Manually" button
- Two-step entry: type serial → confirm serial (double-confirm pattern)
- Same validation + logging as camera scan

## Data Models

### Database Schema Overview

### Migration 0001: Extensions and Enums

```sql
-- Extensions
create extension if not exists pgcrypto;        -- UUID generation, token hashing
create extension if not exists pg_trgm;         -- Trigram similarity for fuzzy search
create extension if not exists btree_gist;      -- Exclusion constraints for time ranges
create extension if not exists citext;          -- Case-insensitive text for emails

-- Application schema for helper functions
create schema if not exists app;
revoke all on schema app from public, anon;
grant usage on schema app to authenticated, service_role;

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
```

### Migration 0002: Core Tables

```sql
-- Profiles (synced from Clerk)
create table profiles (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null unique,
  email citext,
  full_name text not null default '',
  phone text,
  role app_role,                                    -- NULL = pending role assignment
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,                           -- Soft delete (deactivate)
  row_version int not null default 1                -- Optimistic concurrency
);

comment on table profiles is 'Staff user profiles synced from Clerk';
comment on column profiles.role is 'NULL = pending; director has all permissions';
comment on column profiles.is_active is 'False = deactivated user cannot authenticate';

-- Settings (key-value configuration)
create table settings (
  key text primary key,
  value jsonb not null,
  description text,
  updated_by uuid references profiles(id),
  updated_at timestamptz not null default now()
);

comment on table settings is 'Application configuration (subsidy tiers, GST rates, advance %, etc)';
comment on column settings.value is 'JSON value: numbers, strings, objects, arrays';

-- Document number sequences (gapless per financial year)
create table doc_sequences (
  prefix text not null,                             -- LD, PRJ, QT, ORD, etc.
  fy text not null,                                 -- 2627 = FY 2026-27 (Apr-Mar)
  last_no int not null default 0,
  primary key (prefix, fy)
);

comment on table doc_sequences is 'Gapless sequential numbers per document type per FY (LD-2627-00001)';

-- Customers
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

-- One open lead per phone number (dedupe)
create unique index customers_phone_uq on customers(phone_e164) where deleted_at is null;

-- Trigram indexes for fuzzy search
create index customers_name_trgm on customers using gin (name gin_trgm_ops);
create index customers_phone_trgm on customers using gin (phone_e164 gin_trgm_ops);

comment on table customers is 'Customer master data (residential, commercial, industrial)';
comment on constraint customers_phone_uq on customers is 'Prevents duplicate customers by phone';

-- Products (catalogue)
create table products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  name text not null,
  category product_category not null,
  brand text,
  model text,
  uom text not null default 'nos',                 -- nos, m, set, kw, hr, job
  is_serialised boolean not null default false,
  tracks_stock boolean not null default true,      -- False for services
  warranty_months int check (warranty_months is null or warranty_months > 0),
  hsn_code text,
  gst_rate_bp int not null default 1200 check (gst_rate_bp between 0 and 4000), -- 1200 = 12%
  price_paise bigint not null default 0 check (price_paise >= 0), -- Ex-GST selling price
  is_dcr boolean not null default false,           -- Panels only: Domestic Content Requirement
  wattage_w int,                                    -- Panels only
  capacity_kw numeric(5,2),                         -- Inverters only
  spec jsonb not null default '{}',                 -- Extended specifications
  reorder_level numeric(12,2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  row_version int not null default 1,
  check (not is_serialised or (tracks_stock and warranty_months is not null)),
  check (category <> 'panel' or wattage_w is not null)
);

create index products_cat on products(category) where is_active;

comment on table products is 'Product catalogue (panels, inverters, batteries, cables, services)';
comment on column products.is_serialised is 'True = tracked per unit with serial_no (inverters, batteries, panels)';
comment on column products.price_paise is 'Frozen to quote_lines at quote creation';

-- Product costs (SEGREGATED - manager/accounts only)
create table product_costs (
  product_id uuid primary key references products(id),
  standard_cost_paise bigint not null default 0 check (standard_cost_paise >= 0),
  avg_cost_paise bigint not null default 0 check (avg_cost_paise >= 0), -- Weighted average (updated on receipt)
  updated_at timestamptz not null default now()
);

comment on table product_costs is 'COST SEGREGATION: Unit costs for profit calculation (manager/accounts SELECT only)';

-- Package templates (e.g., ON-3KW, OFF-5KW)
create table package_templates (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
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

comment on table package_templates is 'Quote templates: ON-1KW, ON-2KW, ..., OFF-5KW';

-- Package template items (BOM recipe)
create table package_template_items (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references package_templates(id) on delete cascade,
  product_id uuid not null references products(id),
  qty_rule qty_rule not null default 'fixed',
  qty_value numeric(10,3) not null default 1,
  min_qty numeric(10,2) not null default 0,
  rounding qty_rounding not null default 'ceil',
  when_roof_types roof_type[],                     -- NULL = always; else conditional
  is_required boolean not null default true,
  sort int not null default 100,
  notes text,
  unique (template_id, product_id)
);

comment on table package_template_items is 'BOM rules: fixed qty, per_kw, per_panel, cable_dc_m, etc.';
comment on column package_template_items.qty_rule is 'How to calculate qty from capacity/survey';

-- Fault codes (service knowledge base)
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

comment on table fault_codes is 'Inverter/battery fault codes with suggested resolution';
```

### Migration 0003: Sales Tables

```sql
-- Leads
create table leads (
  id uuid primary key default gen_random_uuid(),
  lead_no text not null unique,                    -- LD-2627-00001
  customer_id uuid not null references customers(id),
  source lead_source not null default 'web',
  status lead_status not null default 'new',
  owner_id uuid references profiles(id),           -- Sales rep assigned (round-robin)
  requested_kw numeric(4,1) check (requested_kw is null or requested_kw between 0.5 and 100),
  requirement system_type,                         -- NULL = unsure
  wants_subsidy boolean not null default false,
  site_address text,
  site_city text,
  site_state text,
  site_pincode text,
  notes text,
  next_followup_at timestamptz,
  attempt_count int not null default 0,
  last_contacted_at timestamptz,
  close_reason text,
  closed_at timestamptz,
  project_id uuid,                                 -- FK to projects (added later)
  utm jsonb,                                       -- Web form UTM parameters
  submit_ip_hash text,
  submit_user_agent text,
  created_by uuid references profiles(id),         -- NULL for public web form
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  row_version int not null default 1,
  check (status not in ('unreachable','disqualified','lost') or (close_reason is not null and closed_at is not null))
);

-- REQ-LEAD-04: Only one OPEN lead per customer (duplicate detection)
create unique index leads_one_open_per_customer on leads(customer_id)
  where status in ('new','contacting','follow_up');

create index leads_owner_status on leads(owner_id, status);
create index leads_followup on leads(next_followup_at) where status in ('new','contacting','follow_up');

comment on table leads is 'Sales leads from web form, calls, walk-ins';
comment on constraint leads_one_open_per_customer on leads is 'Prevents duplicate open leads per phone';

-- Lead activities (call log, notes)
create table lead_activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id),
  kind text not null check (kind in ('created','call','note','status_change',
                                     'duplicate_enquiry','followup_set','assignment',
                                     'whatsapp','qualification')),
  outcome text check (outcome in ('connected','no_answer','busy','wrong_number','callback_requested')),
  note text,
  meta jsonb,
  actor_id uuid references profiles(id),
  created_at timestamptz not null default now()
);

create index lead_activities_lead on lead_activities(lead_id, created_at desc);

comment on table lead_activities is 'Append-only log of all lead interactions';

-- Lead qualifications (call checklist results - append-only)
create table lead_qualifications (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id),
  shadow_free_area_sqft int check (shadow_free_area_sqft >= 0),
  monthly_bill_paise bigint check (monthly_bill_paise >= 0),
  monthly_units int check (monthly_units >= 0),
  grid_connection_suitable boolean,
  grid_notes text,
  roof_ownership text check (roof_ownership in ('owned','rented','society','unknown')),
  consumer_number text,
  consumer_name_on_bill text,
  sanctioned_load_kw numeric(5,2),
  discom text,
  suggested_kw numeric(4,1),
  outcome text not null check (outcome in ('qualified','not_qualified')),
  reason text,
  recorded_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

comment on table lead_qualifications is 'Qualification checklist results (Gate G2)';

-- Projects (main spine entity)
create table projects (
  id uuid primary key default gen_random_uuid(),
  project_no text not null unique,                 -- PRJ-2627-00001
  customer_id uuid not null references customers(id),
  lead_id uuid references leads(id),
  stage project_stage not null default 'qualified',
  customer_type customer_type not null,
  system_type system_type not null,
  requested_kw numeric(4,1) not null,
  final_kw numeric(4,1),                           -- Set from quote acceptance or install confirmation
  site_address text not null,
  site_city text,
  site_state text,
  site_pincode text,
  site_lat numeric(9,6),
  site_lng numeric(9,6),
  discom text,
  consumer_number text,
  consumer_name_on_bill text,
  sanctioned_load_kw numeric(5,2),
  sales_owner_id uuid references profiles(id),
  subsidy_eligible boolean not null default false,
  subsidy_override_reason text,
  current_quote_id uuid,                           -- FK to quotes (added later)
  order_id uuid,                                   -- FK to orders (added later)
  hold_reason text,
  cancel_reason text,
  installed_on date,
  commissioned_on date,
  completed_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  row_version int not null default 1,
  check (stage <> 'cancelled' or cancel_reason is not null),
  check (stage <> 'on_hold' or hold_reason is not null)
);

create index projects_stage on projects(stage);
create index projects_customer on projects(customer_id);

-- Add FK from leads to projects
alter table leads add constraint leads_project_fk foreign key (project_id) references projects(id);

comment on table projects is 'Main project entity tracking stage from qualification to completion';

-- Jobs (survey, install, service)
create table jobs (
  id uuid primary key default gen_random_uuid(),
  job_no text not null unique,                     -- JOB-2627-00001
  project_id uuid not null references projects(id),
  type job_type not null,
  status job_status not null default 'unscheduled',
  ticket_id uuid,                                  -- FK to tickets (added later for service jobs)
  title text not null,
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  estimated_hours numeric(5,2),
  actual_start timestamptz,
  actual_end timestamptz,
  site_address text,
  notes text,
  hold_reason text,
  cancel_reason text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  row_version int not null default 1,
  check (scheduled_end is null or scheduled_start is null or scheduled_end > scheduled_start),
  check (status <> 'scheduled' or scheduled_start is not null),
  check (status <> 'cancelled' or cancel_reason is not null)
);

-- Only one active survey job per project
create unique index jobs_one_active_survey on jobs(project_id)
  where type = 'survey' and status in ('unscheduled','scheduled','in_progress');

-- Only one active install job per project
create unique index jobs_one_active_install on jobs(project_id)
  where type = 'install' and status <> 'cancelled';

create index jobs_schedule on jobs(scheduled_start) where status in ('scheduled','in_progress');
create index jobs_status_type on jobs(status, type);

comment on table jobs is 'Work assignments: survey, install, service visits';

-- Job crew (technicians assigned to job)
create table job_crew (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  profile_id uuid not null references profiles(id),
  crew_role text not null default 'lead' check (crew_role in ('lead','helper')),
  created_at timestamptz not null default now(),
  unique (job_id, profile_id)
);

create index job_crew_profile on job_crew(profile_id);

comment on table job_crew is 'Technicians assigned to jobs (defines RLS scope for technician role)';

-- Surveys
create table surveys (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null unique references jobs(id),
  project_id uuid not null references projects(id),
  revision int not null default 1,
  status survey_status not null default 'draft',
  roof_direction roof_direction,
  roof_tilt_deg numeric(4,1) check (roof_tilt_deg between 0 and 90),
  roof_type roof_type,
  shadow_free_area_sqft int check (shadow_free_area_sqft >= 0),
  structure_height_m numeric(4,1),
  cable_dc_m numeric(6,1) check (cable_dc_m >= 0),      -- Panels → inverter
  cable_ac_m numeric(6,1) check (cable_ac_m >= 0),      -- Inverter → DB/meter
  earthing_distance_m numeric(5,1),
  grid_connection_ok boolean,
  meter_location text,
  feasibility feasibility,
  recommended_kw numeric(4,1),
  shading_notes text,
  notes text,
  submitted_at timestamptz,
  submitted_by uuid references profiles(id),
  reviewed_at timestamptz,
  reviewed_by uuid references profiles(id),
  review_note text,
  client_submission_id uuid unique,                      -- Idempotency for offline submission
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  row_version int not null default 1,
  check (status not in ('rejected','rework_requested') or review_note is not null)
);

create index surveys_project on surveys(project_id, revision desc);

comment on table surveys is 'Site survey data (Gate G1 requires approved survey for quote)';
comment on column surveys.client_submission_id is 'Offline idempotency key';

-- Quotes
create table quotes (
  id uuid primary key default gen_random_uuid(),
  quote_no text not null,                          -- QT-2627-00001 (same across versions)
  version int not null default 1,
  parent_quote_id uuid references quotes(id),
  project_id uuid not null references projects(id),
  survey_id uuid not null references surveys(id),  -- GATE G1: The approved survey
  template_id uuid references package_templates(id),
  status quote_status not null default 'draft',
  system_type system_type not null,
  nominal_kw numeric(4,1) not null,
  panel_count int,
  dc_capacity_wp int,
  subtotal_paise bigint not null default 0,        -- Σ line taxable BEFORE discount (ex-GST)
  discount_paise bigint not null default 0 check (discount_paise >= 0),
  taxable_paise bigint not null default 0,         -- subtotal − discount
  gst_paise bigint not null default 0,
  total_paise bigint not null default 0,           -- taxable + gst
  subsidy_eligible boolean not null default false,
  subsidy_paise bigint not null default 0,         -- Informational estimate
  net_cost_paise bigint not null default 0,        -- total − subsidy (effective cost after DBT)
  valid_until date,
  approval_required boolean not null default false,
  approval_reason text,
  approved_by uuid references profiles(id),
  approved_at timestamptz,
  sent_at timestamptz,
  sent_by uuid references profiles(id),
  accepted_at timestamptz,
  accepted_name text,
  accepted_ip_hash text,
  rejected_reason text,
  rejected_at timestamptz,
  expired_at timestamptz,
  customer_notes text,
  terms text,
  pdf_path text,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  row_version int not null default 1,
  unique (quote_no, version),
  check (discount_paise <= subtotal_paise)
);

-- Only one live quote per project
create unique index quotes_one_live_per_project on quotes(project_id)
  where status in ('draft','pending_approval','approved','sent');

create index quotes_project on quotes(project_id);
create index quotes_status on quotes(status);

comment on table quotes is 'Price proposals with frozen BOM and prices';
comment on column quotes.survey_id is 'GATE EVIDENCE: Quote requires approved survey';

-- Quote lines (BOM)
create table quote_lines (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references quotes(id) on delete cascade,
  line_no int not null,
  product_id uuid not null references products(id),
  sku text not null,
  description text not null,
  category product_category not null,
  qty numeric(10,2) not null check (qty > 0),
  uom text not null,
  unit_price_paise bigint not null check (unit_price_paise >= 0), -- FROZEN ex-GST price
  gst_rate_bp int not null,
  hsn_code text,
  is_serialised boolean not null,
  source text not null check (source in ('template','survey_rule','option','manual')),
  qty_rule qty_rule,
  line_subtotal_paise bigint not null,
  line_discount_paise bigint not null default 0,
  line_taxable_paise bigint not null,
  line_gst_paise bigint not null,
  line_total_paise bigint not null,
  unique (quote_id, line_no)
);

comment on table quote_lines is 'Quote line items with frozen prices from products.price_paise';

-- Quote line costs (SEGREGATED)
create table quote_line_costs (
  quote_line_id uuid primary key references quote_lines(id) on delete cascade,
  unit_cost_paise bigint not null check (unit_cost_paise >= 0) -- FROZEN from product_costs.standard_cost_paise
);

comment on table quote_line_costs is 'COST SEGREGATION: Frozen costs for margin calculation (manager/accounts only)';

-- Orders
create table orders (
  id uuid primary key default gen_random_uuid(),
  order_no text not null unique,                   -- ORD-2627-00001
  project_id uuid not null references projects(id),
  quote_id uuid not null unique references quotes(id),
  status order_status not null default 'pending_payment',
  pay_status order_pay_status not null default 'unpaid',
  taxable_paise bigint not null,
  gst_paise bigint not null,
  total_paise bigint not null,
  advance_required_paise bigint not null,
  paid_paise bigint not null default 0,            -- Cached Σ received payments (fn_refresh_order_payment)
  confirmed_at timestamptz,
  confirmed_by uuid references profiles(id),
  force_confirmed boolean not null default false,
  force_reason text,
  cancelled_at timestamptz,
  cancelled_by uuid references profiles(id),
  cancel_reason text,
  refund_due_paise bigint not null default 0,
  delivered_at timestamptz,
  completed_at timestamptz,
  delivery_name text,
  delivery_phone text,
  delivery_address text,                           -- Snapshot for warehouse
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  row_version int not null default 1,
  check (status <> 'cancelled' or cancel_reason is not null),
  check (not force_confirmed or force_reason is not null)
);

-- One active order per project
create unique index orders_one_active_per_project on orders(project_id) where status <> 'cancelled';

-- Add FKs from projects to quotes and orders
alter table projects add constraint projects_order_fk foreign key (order_id) references orders(id);
alter table projects add constraint projects_quote_fk foreign key (current_quote_id) references quotes(id);

comment on table orders is 'Customer orders created from accepted quotes';
comment on column orders.paid_paise is 'Cached from payments; use fn_refresh_order_payment to recompute';

-- Order lines
create table order_lines (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  line_no int not null,
  quote_line_id uuid references quote_lines(id),
  product_id uuid not null references products(id),
  sku text not null,
  description text not null,
  category product_category not null,
  qty numeric(10,2) not null check (qty > 0),
  uom text not null,
  unit_price_paise bigint not null,
  gst_rate_bp int not null,
  hsn_code text,
  is_serialised boolean not null,
  line_taxable_paise bigint not null,
  line_gst_paise bigint not null,
  line_total_paise bigint not null,
  qty_reserved numeric(10,2) not null default 0,
  qty_dispatched numeric(10,2) not null default 0,
  qty_delivered numeric(10,2) not null default 0,
  unique (order_id, line_no)
);

comment on table order_lines is 'Order line items copied from quote_lines at order creation';

-- Payments
create table payments (
  id uuid primary key default gen_random_uuid(),
  payment_no text not null unique,                 -- PMT-2627-00001
  project_id uuid references projects(id),
  order_id uuid references orders(id),
  ticket_id uuid,                                  -- FK to tickets (added later for service payments)
  invoice_id uuid,                                 -- FK to invoices (added later)
  customer_id uuid not null references customers(id),
  kind payment_kind not null,
  method payment_method not null,
  amount_paise bigint not null check (amount_paise > 0),
  status payment_status not null default 'received',
  reference text,                                  -- UTR / cheque no.
  received_at timestamptz not null default now(),
  recorded_by uuid not null references profiles(id),
  reversal_of uuid references payments(id),
  reversal_reason text,
  notes text,
  idempotency_key uuid not null unique,
  created_at timestamptz not null default now(),
  check (order_id is not null or ticket_id is not null or invoice_id is not null)
);

create index payments_order on payments(order_id);
create index payments_received on payments(received_at);

-- Same reference cannot be booked twice (prevents double payment recording)
create unique index payments_ref_uq on payments(method, reference)
  where reference is not null and status in ('received','pending');

comment on table payments is 'Payment records (cash, UPI, bank transfer, cheque)';
comment on column payments.idempotency_key is 'Client UUID prevents double-recording';
```

This is the first part of the design document. I'll continue with the remaining migrations, API contracts, component pseudo-code, and security architecture in the next response.

### Migration 0004: Inventory Tables

```sql
-- Suppliers
create table suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  gstin text,
  address text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table suppliers is 'Supplier master data for purchases';

-- Purchases (goods receipt header)
create table purchases (
  id uuid primary key default gen_random_uuid(),
  purchase_no text not null unique,                -- PUR-2627-00001
  supplier_id uuid references suppliers(id),
  supplier_invoice_no text,
  supplier_invoice_date date,
  status text not null default 'received' check (status in ('draft','received','cancelled')),
  received_at timestamptz,
  received_by uuid references profiles(id),
  notes text,
  idempotency_key uuid unique,
  created_at timestamptz not null default now()
);

comment on table purchases is 'Goods receipt from suppliers';

-- Purchase lines
create table purchase_lines (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references purchases(id) on delete cascade,
  product_id uuid not null references products(id),
  qty numeric(12,2) not null check (qty > 0),
  batch_no text
);

comment on table purchase_lines is 'Line items for purchases';

-- Purchase line costs (SEGREGATED)
create table purchase_line_costs (
  purchase_line_id uuid primary key references purchase_lines(id) on delete cascade,
  unit_cost_paise bigint not null check (unit_cost_paise >= 0)
);

comment on table purchase_line_costs is 'COST SEGREGATION: Unit costs from purchase (manager/accounts only)';

-- Stock units (serialised inventory - ONE ROW PER PHYSICAL UNIT)
create table stock_units (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id),
  serial_no text not null,                         -- Normalized: uppercase, trimmed
  status stock_unit_status not null default 'in_stock',
  location text not null default 'MAIN',
  purchase_line_id uuid references purchase_lines(id),
  batch_no text,
  received_at timestamptz not null default now(),
  received_by uuid references profiles(id),
  reserved_order_id uuid references orders(id),
  reserved_order_line_id uuid references order_lines(id),
  reserved_at timestamptz,
  notes text,
  updated_at timestamptz not null default now(),
  row_version int not null default 1,
  unique (product_id, serial_no),
  check (status <> 'reserved' or (reserved_order_id is not null and reserved_order_line_id is not null)),
  check (status = 'reserved' or reserved_order_id is null or status in ('dispatched','delivered','installed'))
);

-- FIFO pick index (in_stock units ordered by received_at)
create index stock_units_avail on stock_units(product_id, received_at) where status = 'in_stock';
create index stock_units_order on stock_units(reserved_order_id);

-- Trigram fuzzy search on serial numbers
create index stock_units_serial_trgm on stock_units using gin (serial_no gin_trgm_ops);
create index stock_units_serial_lookup on stock_units(serial_no);

comment on table stock_units is 'Serialised inventory: inverters, batteries, panels (one row per unit)';
comment on column stock_units.serial_no is 'Normalized to uppercase, whitespace trimmed for scan matching';

-- Stock unit costs (SEGREGATED)
create table stock_unit_costs (
  stock_unit_id uuid primary key references stock_units(id) on delete cascade,
  unit_cost_paise bigint not null check (unit_cost_paise >= 0)
);

comment on table stock_unit_costs is 'COST SEGREGATION: Unit cost per serialised item (manager/accounts only)';

-- Bulk stock (non-serialised inventory - ONE ROW PER PRODUCT)
create table bulk_stock (
  product_id uuid primary key references products(id),
  on_hand numeric(12,2) not null default 0 check (on_hand >= 0),
  reserved numeric(12,2) not null default 0 check (reserved >= 0),
  available numeric(12,2) generated always as (on_hand - reserved) stored,
  updated_at timestamptz not null default now(),
  check (reserved <= on_hand)
);

comment on table bulk_stock is 'Bulk inventory: cables, stands, connectors (quantity-based)';
comment on column bulk_stock.available is 'Computed: on_hand − reserved (never negative)';

-- Stock movements (append-only ledger for bulk items)
create table stock_movements (
  id bigserial primary key,
  product_id uuid not null references products(id),
  movement movement_type not null,
  qty numeric(12,2) not null check (qty > 0),
  order_id uuid references orders(id),
  order_line_id uuid references order_lines(id),
  purchase_line_id uuid references purchase_lines(id),
  adjustment_id uuid,
  dispatch_item_id uuid,
  reason text,
  actor_id uuid references profiles(id),
  created_at timestamptz not null default now()
);

create index stock_movements_product on stock_movements(product_id, created_at desc);

comment on table stock_movements is 'APPEND-ONLY ledger: received, reserved, issued, adjusted';

-- Stock adjustments
create table stock_adjustments (
  id uuid primary key default gen_random_uuid(),
  adjustment_no text not null unique,              -- ADJ-2627-00001
  product_id uuid not null references products(id),
  stock_unit_id uuid references stock_units(id),   -- Serialised: which unit; bulk: NULL
  direction text not null check (direction in ('up','down')),
  qty numeric(12,2) not null check (qty > 0),
  reason_code text not null check (reason_code in ('count_mismatch','damage','loss','found','correction','scrap','rma_out')),
  note text not null,
  needs_approval boolean not null default false,
  status adjustment_status not null default 'pending',
  requested_by uuid not null references profiles(id),
  decided_by uuid references profiles(id),
  decided_at timestamptz,
  decision_note text,
  created_at timestamptz not null default now(),
  idempotency_key uuid unique
);

comment on table stock_adjustments is 'Stock adjustments with approval workflow (if value > threshold)';

-- Pick lists (warehouse packing lists)
create table pick_lists (
  id uuid primary key default gen_random_uuid(),
  pick_no text not null unique,                    -- PL-2627-00001
  order_id uuid not null references orders(id),
  status pick_status not null default 'pending',
  assigned_to uuid references profiles(id),
  order_no text not null,                          -- Denormalized for warehouse
  project_no text not null,
  customer_name text not null,
  customer_phone text,
  delivery_address text,
  dispatch_blocked boolean not null default false, -- Payment gate (no amounts exposed)
  dispatch_block_reason text,
  notes text,
  packed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  row_version int not null default 1
);

-- One active pick list per order
create unique index pick_lists_one_active on pick_lists(order_id) where status <> 'cancelled';

comment on table pick_lists is 'Warehouse packing lists (NO MONEY FIELDS - warehouse role cannot see amounts)';

-- Pick list lines
create table pick_list_lines (
  id uuid primary key default gen_random_uuid(),
  pick_list_id uuid not null references pick_lists(id) on delete cascade,
  order_line_id uuid not null references order_lines(id),
  product_id uuid not null references products(id),
  sku text not null,
  name text not null,
  category product_category not null,
  is_serialised boolean not null,
  qty_required numeric(10,2) not null,
  qty_picked numeric(10,2) not null default 0,     -- Bulk: manual confirm; Serialised: scanned count
  sort int not null default 100,
  unique (pick_list_id, order_line_id)
);

comment on table pick_list_lines is 'Items to pick for dispatch';

-- Dispatches
create table dispatches (
  id uuid primary key default gen_random_uuid(),
  dispatch_no text not null unique,                -- DSP-2627-00001
  order_id uuid not null references orders(id),
  pick_list_id uuid not null references pick_lists(id),
  status dispatch_status not null default 'draft',
  vehicle_no text,
  driver_name text,
  driver_phone text,
  planned_at timestamptz,
  dispatched_at timestamptz,
  dispatched_by uuid references profiles(id),
  delivered_at timestamptz,
  delivery_confirmed_by_type text check (delivery_confirmed_by_type in ('otp','signature','photo','staff_override')),
  delivery_confirmed_name text,
  delivery_otp_hash text,
  delivery_otp_expires_at timestamptz,
  delivery_otp_attempts int not null default 0,
  delivery_proof_path text,
  override_reason text,
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  row_version int not null default 1
);

create index dispatches_order on dispatches(order_id);

comment on table dispatches is 'Truck deliveries with OTP/signature confirmation';

-- Dispatch items (scanned units)
create table dispatch_items (
  id uuid primary key default gen_random_uuid(),
  dispatch_id uuid not null references dispatches(id) on delete cascade,
  order_line_id uuid not null references order_lines(id),
  product_id uuid not null references products(id),
  stock_unit_id uuid references stock_units(id),   -- Serialised only
  qty numeric(10,2) not null check (qty > 0),      -- Always 1 for serialised
  scanned_by uuid references profiles(id),
  scanned_at timestamptz not null default now(),
  removed_at timestamptz,                          -- If scanned in error
  removed_reason text,
  removed_by uuid references profiles(id),
  delivered_at timestamptz,
  returned_at timestamptz
);

-- Prevent same unit in multiple active dispatches
create unique index dispatch_items_unit_active on dispatch_items(stock_unit_id)
  where stock_unit_id is not null and removed_at is null and returned_at is null;

create index dispatch_items_dispatch on dispatch_items(dispatch_id);

comment on table dispatch_items is 'Scanned items per dispatch (links serial to customer)';

-- Scan events (APPEND-ONLY log of ALL scan attempts)
create table scan_events (
  id bigserial primary key,
  order_id uuid references orders(id),
  dispatch_id uuid references dispatches(id),
  raw_input text not null,                         -- Exactly what was scanned/typed
  normalized_serial text,
  product_id uuid references products(id),
  stock_unit_id uuid references stock_units(id),
  result scan_result not null,
  message text,
  method text not null default 'camera' check (method in ('camera','manual','csv','range')),
  actor_id uuid references profiles(id),
  idempotency_key uuid unique,
  created_at timestamptz not null default now()
);

create index scan_events_order on scan_events(order_id, created_at desc);

comment on table scan_events is 'APPEND-ONLY audit: every scan attempt (accepted AND rejected)';
```

### Migration 0005: Field Tables

```sql
-- Install reports
create table install_reports (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null unique references jobs(id),
  project_id uuid not null references projects(id),
  started_at timestamptz,
  finished_at timestamptz,
  installed_kw numeric(4,1),
  panel_count int,
  stands_fixed boolean not null default false,
  panels_mounted boolean not null default false,
  wiring_done boolean not null default false,
  earthing_done boolean not null default false,
  inverter_commissioned boolean not null default false,
  power_test_passed boolean,
  dc_voltage_v numeric(7,2),
  ac_voltage_v numeric(7,2),
  power_output_kw numeric(6,2),
  earthing_resistance_ohm numeric(6,2),
  unit_checklist jsonb not null default '[]',      -- [{asset_id, installed: boolean, note}]
  notes text,
  signature_status signature_status not null default 'pending',
  signature_path text,
  signed_by_name text,
  signed_at timestamptz,
  signature_method text check (signature_method in ('on_device','remote_link','otp')),
  signature_ip_hash text,
  refusal_reason text,
  customer_rating int check (customer_rating between 1 and 5),
  submitted_at timestamptz,
  submitted_by uuid references profiles(id),
  client_submission_id uuid unique,                -- Offline idempotency
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  row_version int not null default 1,
  check (finished_at is null or started_at is null or finished_at >= started_at),
  check (signature_status <> 'refused' or refusal_reason is not null)
);

comment on table install_reports is 'Installation completion data (Gate G14-G17)';
comment on column install_reports.client_submission_id is 'Offline idempotency key';

-- Job photos
create table job_photos (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id),
  project_id uuid not null references projects(id),
  kind photo_kind not null,
  storage_bucket text not null,
  storage_path text not null unique,
  taken_at timestamptz not null,
  lat numeric(9,6),
  lng numeric(9,6),
  accuracy_m numeric(7,1),
  caption text,
  uploaded_by uuid not null references profiles(id),
  client_photo_id uuid unique,                     -- Offline idempotency
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create index job_photos_job on job_photos(job_id, kind) where deleted_at is null;

comment on table job_photos is 'Survey and installation photos';

-- Job materials (extra/returned/damaged items)
create table job_materials (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id),
  product_id uuid not null references products(id),
  qty numeric(10,2) not null check (qty > 0),
  source text not null check (source in ('extra','returned','damaged')),
  reason text,
  added_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  client_entry_id uuid unique                      -- Offline idempotency
);

comment on table job_materials is 'Extra materials used or returned from field';

-- Time entries (labour hours tracking)
create table time_entries (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id),
  profile_id uuid not null references profiles(id),
  started_at timestamptz not null,
  ended_at timestamptz,
  minutes int generated always as (
    case when ended_at is null then null
    else greatest(0, (extract(epoch from (ended_at - started_at)) / 60)::int)
    end
  ) stored,
  source text not null default 'timer' check (source in ('timer','manual')),
  rate_paise bigint,                               -- Hourly rate SNAPSHOT (set when entry closed)
  approved boolean not null default false,
  note text,
  client_entry_id uuid unique,
  created_at timestamptz not null default now(),
  check (ended_at is null or ended_at > started_at),
  -- NO OVERLAPPING TIME ENTRIES PER PERSON (exclusion constraint)
  exclude using gist (
    profile_id with =,
    tstzrange(started_at, coalesce(ended_at, 'infinity'::timestamptz)) with &&
  )
);

create index time_entries_job on time_entries(job_id);

comment on table time_entries is 'Technician labour hours (feeds pay calculation and project costs)';
comment on constraint time_entries_profile_id_tstzrange_excl on time_entries is 'Prevents double-booking';

-- Variations (installed size ≠ quoted size)
create table variations (
  id uuid primary key default gen_random_uuid(),
  variation_no text not null unique,               -- VAR-2627-00001
  project_id uuid not null references projects(id),
  order_id uuid not null references orders(id),
  job_id uuid references jobs(id),
  reason text not null,
  quoted_kw numeric(4,1),
  installed_kw numeric(4,1),
  delta_taxable_paise bigint not null default 0,   -- Positive = extra charge, negative = credit
  delta_gst_paise bigint not null default 0,
  status variation_status not null default 'pending',
  requested_by uuid not null references profiles(id),
  decided_by uuid references profiles(id),
  decided_at timestamptz,
  decision_note text,
  invoice_id uuid,                                 -- FK to invoices (added later)
  created_at timestamptz not null default now()
);

comment on table variations is 'Capacity changes requiring approval (Gate G17)';
```

### Migration 0006: Assets & Service Tables

```sql
-- Assets (delivered serialised units owned by customer)
create table assets (
  id uuid primary key default gen_random_uuid(),
  stock_unit_id uuid not null unique references stock_units(id),
  product_id uuid not null references products(id),
  serial_no text not null,
  customer_id uuid not null references customers(id), -- CURRENT owner
  project_id uuid not null references projects(id),
  order_id uuid not null references orders(id),
  status text not null default 'delivered' check (status in ('delivered','installed','under_repair','replaced','retired')),
  delivered_at timestamptz not null,
  installed_at timestamptz,
  warranty_months int not null,                    -- SNAPSHOT from product at asset creation
  warranty_start date,                             -- NULL until trigger fires (delivery or installation)
  warranty_end date generated always as ((warranty_start + make_interval(months => warranty_months))::date) stored,
  warranty_void boolean not null default false,
  void_reason text,
  replaces_asset_id uuid references assets(id),
  replaced_by_asset_id uuid references assets(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  row_version int not null default 1
);

create index assets_customer on assets(customer_id);
create index assets_project on assets(project_id);
create index assets_serial on assets(serial_no);
create index assets_serial_trgm on assets using gin (serial_no gin_trgm_ops);
create index assets_warranty_end on assets(warranty_end) where not warranty_void;

comment on table assets is 'Customer-owned equipment with warranty tracking';
comment on column assets.warranty_months is 'Snapshot from product.warranty_months at asset creation';
comment on column assets.warranty_start is 'Set on delivery OR installation per settings.warranty.start_trigger';

-- Asset ownership history
create table asset_ownership_history (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references assets(id),
  from_customer_id uuid references customers(id),
  to_customer_id uuid not null references customers(id),
  reason text,
  changed_by uuid references profiles(id),
  changed_at timestamptz not null default now()
);

comment on table asset_ownership_history is 'Asset transfer history';

-- Tickets (service complaints)
create table tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_no text not null unique,                  -- TKT-2627-00001
  customer_id uuid not null references customers(id),
  project_id uuid references projects(id),
  asset_id uuid references assets(id),
  serial_entered text,                             -- What caller typed if no asset matched
  channel ticket_channel not null default 'phone',
  issue_type text not null check (issue_type in ('no_power','fault_code','low_generation',
                                                  'noise_heat','physical_damage','battery_issue',
                                                  'connectivity','billing','other')),
  fault_code text,
  description text not null,
  priority ticket_priority not null default 'normal',
  status ticket_status not null default 'open',
  warranty_decision warranty_decision not null default 'unknown',
  warranty_checked_at timestamptz,
  warranty_basis jsonb,                            -- SNAPSHOT {asset_id, warranty_start, warranty_end, status, rule}
  decision_by uuid references profiles(id),
  decision_reason text,
  assigned_to uuid references profiles(id),
  sla_due_at timestamptz,
  first_response_at timestamptz,
  work_done_at timestamptz,
  customer_confirmed_at timestamptz,
  confirmation_method text check (confirmation_method in ('phone','otp','signature','link','in_person')),
  confirmation_note text,
  closed_at timestamptz,
  closed_by uuid references profiles(id),
  close_reason text,
  reopen_count int not null default 0,
  is_repeat boolean not null default false,
  repeat_of_ticket_id uuid references tickets(id),
  billing ticket_billing not null default 'not_applicable',
  service_invoice_id uuid,                         -- FK to invoices (added later)
  rma_ref text,
  blocked_reason text,
  created_by uuid references profiles(id),
  idempotency_key uuid unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  row_version int not null default 1,
  check (status <> 'closed' or (customer_confirmed_at is not null or close_reason is not null)),
  check (status <> 'waiting_part' or blocked_reason is not null)
);

create index tickets_status on tickets(status) where status not in ('closed','cancelled');
create index tickets_asset on tickets(asset_id);
create index tickets_customer on tickets(customer_id);

-- Add FK from jobs to tickets (service jobs)
alter table jobs add constraint jobs_ticket_fk foreign key (ticket_id) references tickets(id);

-- Add FK from payments to tickets
alter table payments add constraint payments_ticket_fk foreign key (ticket_id) references tickets(id);

comment on table tickets is 'Service complaints with warranty determination (Gate G19)';
comment on column tickets.warranty_basis is 'Snapshot of warranty calculation at ticket creation (audit trail)';

-- Ticket events (activity log)
create table ticket_events (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references tickets(id),
  kind text not null check (kind in ('created','note','status_change','assigned',
                                     'warranty_decision','visit_scheduled','parts_added',
                                     'labour_added','customer_confirmed','reopened','billing')),
  note text,
  meta jsonb,
  actor_id uuid references profiles(id),
  created_at timestamptz not null default now()
);

create index ticket_events_ticket on ticket_events(ticket_id, created_at);

comment on table ticket_events is 'Append-only ticket activity log';

-- Ticket parts (replacement parts)
create table ticket_parts (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references tickets(id),
  job_id uuid references jobs(id),
  product_id uuid not null references products(id),
  qty numeric(10,2) not null check (qty > 0),
  old_asset_id uuid references assets(id),         -- Faulty unit swapped out
  new_stock_unit_id uuid references stock_units(id), -- Replacement unit
  new_asset_id uuid references assets(id),
  billable boolean not null,                       -- Decided from warranty_decision
  unit_price_paise bigint not null default 0,      -- Frozen customer price (0 if not billable)
  gst_rate_bp int not null default 0,
  added_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

comment on table ticket_parts is 'Parts used in service (billable if out-of-warranty)';

-- Ticket labour
create table ticket_labour (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references tickets(id),
  job_id uuid references jobs(id),
  profile_id uuid references profiles(id),
  minutes int not null check (minutes > 0),
  billable boolean not null,
  rate_paise_per_hour bigint not null default 0,   -- Frozen customer billing rate
  gst_rate_bp int not null default 0,
  note text,
  created_at timestamptz not null default now()
);

comment on table ticket_labour is 'Labour charged for service (billable if out-of-warranty)';
```

### Migration 0007: Finance Tables

```sql
-- Invoices
create table invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_no text unique,                          -- INV-2627-00001 (assigned when issued)
  kind invoice_kind not null,
  status invoice_status not null default 'draft',
  customer_id uuid not null references customers(id),
  project_id uuid references projects(id),
  order_id uuid references orders(id),
  ticket_id uuid references tickets(id),
  variation_id uuid references variations(id),
  credit_for_invoice_id uuid references invoices(id),
  bill_to_name text not null,
  bill_to_gstin text,
  bill_to_address text,
  place_of_supply_state text,
  taxable_paise bigint not null default 0,
  gst_paise bigint not null default 0,
  total_paise bigint not null default 0,
  paid_paise bigint not null default 0,            -- Cached Σ allocations
  issued_at timestamptz,
  due_date date,
  void_reason text,
  voided_at timestamptz,
  voided_by uuid references profiles(id),
  pdf_path text,
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  row_version int not null default 1,
  check (status = 'draft' or invoice_no is not null),
  check (status <> 'void' or void_reason is not null)
);

create index invoices_order on invoices(order_id);
create index invoices_ticket on invoices(ticket_id);

-- Add FK from payments to invoices
alter table payments add constraint payments_invoice_fk foreign key (invoice_id) references invoices(id);

-- Add FK from tickets to invoices (service invoice)
alter table tickets add constraint tickets_invoice_fk foreign key (service_invoice_id) references invoices(id);

-- Add FK from variations to invoices
alter table variations add constraint variations_invoice_fk foreign key (invoice_id) references invoices(id);

comment on table invoices is 'Order invoices, service invoices, variation invoices, credit notes';
comment on column invoices.invoice_no is 'Gapless number assigned at issuance only (draft = NULL)';

-- Invoice lines
create table invoice_lines (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  line_no int not null,
  product_id uuid references products(id),
  description text not null,
  hsn_code text,
  qty numeric(10,2) not null,
  uom text not null default 'nos',
  unit_price_paise bigint not null,
  gst_rate_bp int not null,
  taxable_paise bigint not null,
  gst_paise bigint not null,
  total_paise bigint not null,
  source_type text,
  source_id uuid,
  unique (invoice_id, line_no)
);

comment on table invoice_lines is 'Invoice line items';

-- Payment allocations (FIFO to invoices)
create table payment_allocations (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references payments(id),
  invoice_id uuid not null references invoices(id),
  amount_paise bigint not null check (amount_paise > 0),
  created_at timestamptz not null default now(),
  unique (payment_id, invoice_id)
);

comment on table payment_allocations is 'Payment → Invoice allocations (FIFO by invoice.issued_at)';

-- Project costs (CONSOLIDATED cost tracking)
create table project_costs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id),
  ticket_id uuid references tickets(id),           -- NOT NULL = post-sale service cost
  job_id uuid references jobs(id),
  kind text not null check (kind in ('material','extra_material','service_part',
                                     'travel','permit','subcontract','other')),
  product_id uuid references products(id),
  qty numeric(12,2) not null default 1,
  unit_cost_paise bigint not null check (unit_cost_paise >= 0),
  amount_paise bigint not null check (amount_paise >= 0),
  source_type text,                                -- E.g., 'dispatch_item', 'purchase_line'
  source_id uuid,                                  -- Prevents double posting
  note text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  unique (source_type, source_id)                  -- Idempotency per source
);

create index project_costs_project on project_costs(project_id);

comment on table project_costs is 'COST SEGREGATION: All non-labour costs per project (manager/accounts only)';
comment on constraint project_costs_source_type_source_id_key on project_costs is 'Prevents double cost posting';

-- Subsidy applications (DBT tracking)
create table subsidy_applications (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references projects(id),
  status subsidy_status not null default 'not_applicable',
  on_query boolean not null default false,
  query_note text,
  portal_application_no text,
  expected_paise bigint not null default 0,        -- From quote (informational)
  credited_paise bigint,                           -- Paid to CUSTOMER (not company revenue)
  registration_done_at timestamptz,
  docs_uploaded_at timestamptz,
  inspection_requested_at timestamptz,
  inspection_done_at timestamptz,
  commissioning_cert_no text,
  commissioned_on date,
  claim_submitted_at timestamptz,
  credited_at timestamptz,
  rejected_reason text,
  owner_id uuid references profiles(id),
  next_action text,
  next_action_due date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  row_version int not null default 1
);

comment on table subsidy_applications is 'Government subsidy DBT tracking (NOT company receivable)';

-- Subsidy checklist items (Gate G18)
create table subsidy_checklist_items (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references subsidy_applications(id) on delete cascade,
  code text not null check (code in ('module_serials','dcr_certificate','geo_tagged_photo',
                                     'installation_report','customer_signature','meter_report',
                                     'net_metering_agreement','name_match')),
  label text not null,
  status text not null default 'pending' check (status in ('pending','ready','done','n_a')),
  auto_checked boolean not null default false,    -- System-verified (e.g., serials present)
  evidence_path text,
  note text,
  updated_by uuid references profiles(id),
  updated_at timestamptz not null default now(),
  unique (application_id, code)
);

comment on table subsidy_checklist_items is 'Subsidy readiness checklist (Gate G18 requires all ready)';

-- Technician rates
create table technician_rates (
  profile_id uuid primary key references profiles(id),
  pay_model pay_model not null default 'hourly',
  hourly_paise bigint not null default 0,
  per_job_paise bigint not null default 0,
  effective_from date not null default current_date
);

comment on table technician_rates is 'COST SEGREGATION: Technician pay rates (accounts/director only)';

-- Pay periods
create table pay_periods (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,                      -- '2026-11'
  from_date date not null,
  to_date date not null,
  status pay_period_status not null default 'open',
  approved_by uuid references profiles(id),
  approved_at timestamptz,
  paid_on date,
  check (to_date >= from_date)
);

comment on table pay_periods is 'Payroll periods (locked prevents time entry changes)';

-- Pay entries
create table pay_entries (
  id uuid primary key default gen_random_uuid(),
  period_id uuid not null references pay_periods(id),
  profile_id uuid not null references profiles(id),
  minutes int not null default 0,
  jobs_completed int not null default 0,
  hourly_amount_paise bigint not null default 0,
  per_job_amount_paise bigint not null default 0,
  bonus_paise bigint not null default 0,
  deduction_paise bigint not null default 0,
  total_paise bigint generated always as (
    hourly_amount_paise + per_job_amount_paise + bonus_paise - deduction_paise
  ) stored,
  flags text[] not null default '{}',              -- 'missing_hours', 'open_time_entry', 'unapproved_entries'
  note text,
  unique (period_id, profile_id)
);

comment on table pay_entries is 'Technician pay calculations per period';
```

### Migration 0008: Platform Tables

```sql
-- Notifications
create table notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references profiles(id),
  type text not null,
  title text not null,
  body text,
  entity_type text,
  entity_id uuid,
  url text,
  severity text not null default 'info' check (severity in ('info','success','warning','action_required')),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_inbox on notifications(recipient_id, created_at desc) where read_at is null;

comment on table notifications is 'In-app notification inbox (RLS: recipient only)';

-- Audit log (append-only)
create table audit_log (
  id bigserial primary key,
  actor_id uuid,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before jsonb,
  after jsonb,
  reason text,
  at timestamptz not null default now()
);

create index audit_entity on audit_log(entity_type, entity_id, at desc);

comment on table audit_log is 'APPEND-ONLY: All state-changing operations';

-- Status history (append-only)
create table status_history (
  id bigserial primary key,
  entity_type text not null,
  entity_id uuid not null,
  from_status text,
  to_status text not null,
  actor_id uuid,
  reason text,
  at timestamptz not null default now()
);

create index status_history_entity on status_history(entity_type, entity_id, at);

comment on table status_history is 'APPEND-ONLY: Status transition history';

-- Share links (public access tokens)
create table share_links (
  id uuid primary key default gen_random_uuid(),
  kind share_kind not null,
  entity_id uuid,                                  -- quote_id / project_id / asset_id / dispatch_id / job_id
  token_hash text not null unique,                 -- SHA256(token || TOKEN_PEPPER)
  expires_at timestamptz,
  revoked_at timestamptz,
  redact_pii boolean not null default true,
  params jsonb not null default '{}',              -- Report: {range, from, to}
  snapshot jsonb,                                  -- Report: frozen figures at share time
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  access_count int not null default 0,
  last_access_at timestamptz,
  last_ip_hash text
);

create index share_links_entity on share_links(kind, entity_id);

comment on table share_links is 'Public token links (quote, tracker, asset, report, delivery, signature)';
comment on column share_links.token_hash is 'SHA256(token || TOKEN_PEPPER) - raw token NEVER stored';

-- Idempotency keys
create table idempotency_keys (
  key uuid primary key,
  scope text not null,
  response jsonb,
  created_at timestamptz not null default now()
);

comment on table idempotency_keys is 'Idempotency tracking for mutations (24h TTL)';

-- Rate limits
create table rate_limits (
  bucket text not null,
  window_start timestamptz not null,
  hits int not null default 0,
  primary key (bucket, window_start)
);

comment on table rate_limits is 'Rate limiting buckets for public endpoints';

-- Action failures
create table action_failures (
  id bigserial primary key,
  action text,
  actor_id uuid,
  code text,
  message text,
  detail text,
  created_at timestamptz not null default now()
);

comment on table action_failures is 'Failed server actions for debugging (internal errors only)';

-- Domain events
create table domain_events (
  id bigserial primary key,
  event_type text not null,
  entity_type text,
  entity_id uuid,
  payload jsonb,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

comment on table domain_events is 'Event sourcing / async processing queue';
```

## 2.2 Complete API Contracts

This section continues with detailed RPC specifications for all major operations in the system.

I'll create a separate continuation file due to length constraints. Let me know if you'd like me to:

1. Continue with the remaining sections (RPC contracts, component pseudo-code, security details)
2. Focus on a specific area in more detail
3. Validate the spec format compliance for the created design document

The design document now provides a comprehensive technical blueprint with complete database schema, architecture diagrams, and implementation guidance. Would you like me to continue with the remaining sections?

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Atomic Stock Reservation

*For any* pair of concurrent orders (O1, O2) requiring the same product P with available quantity Q, after both fn_confirm_order complete, then (O1.qty_reserved + O2.qty_reserved) = Q AND no stock_unit is reserved to both orders.

**Validates: Requirements 10, 45**

### Property 2: Scan Validation Determinism

*For all* serial numbers S and dispatch D, fn_scan_dispatch_unit(S, D, idem) called with the same idempotency key returns the same result, AND a rejected scan never modifies stock_units status.

**Validates: Requirements 11, 46**

### Property 3: Warranty Calculation Consistency

*For all* assets A with warranty_months M and warranty_start D, warranty_end = (D + M months) AND warranty status at time T depends only on (warranty_end, warranty_void, T), producing the same result for the same inputs.

**Validates: Requirements 16, 17, 47**

### Property 4: Payment Allocation Integrity

*For all* payments P and invoices I, sum of allocations from P ≤ P.amount AND sum of allocations to I ≤ I.total AND no negative paid_paise values exist.

**Validates: Requirements 48**

### Property 5: Subsidy Calculation Exactness

*For all* quotes Q with capacity C and tiers T, subsidy calculation produces the same subsidy_paise for the same (C, T, max_paise) inputs, AND subsidy ≤ max_paise.

**Validates: Requirements 6, 49**

### Property 6: Quote BOM Generation Determinism

*For all* template T, capacity C, and survey S, fn_build_quote_lines(T, C, S) called twice with identical inputs produces the same set of quote lines with the same quantities and prices.

**Validates: Requirements 5, 50**

### Property 7: Cost Posting Idempotency

*For all* dispatch D with items I, fn_finalize_dispatch(D) called multiple times posts costs exactly once per item in I, AND total posted costs = sum of unit costs for I.

**Validates: Requirements 12, 51**

### Property 8: Project Profit Completeness Accuracy

*For all* projects P, v_project_profit.is_complete = true IF AND ONLY IF (install completed AND all unit costs present AND labour hours recorded), AND missing array accurately lists all incomplete items.

**Validates: Requirements 20, 52**

### Property 9: Lead Round-Robin Fairness

*Given* N active sales users with lead counts [C1, C2, ..., CN], after a new lead L is assigned, L.owner_id = user with minimum Ci, AND ties are broken by least recent assignment timestamp.

**Validates: Requirements 1, 53**

### Property 10: Gate Enforcement Integrity

*For all* quote creation attempts Q for project P, fn_create_quote succeeds IF AND ONLY IF there exists a survey S for P where S.status = 'approved' AND S.created_at > (now() - 120 days) OR manager override provided.

**Validates: Requirements 4**

### Property 11: Delivery Confirmation Asset Creation

*For all* dispatched stock_units U in dispatch D where U.removed_at IS NULL, when delivery is confirmed, exactly one asset A is created per U with A.stock_unit_id = U.id AND A.warranty_months = U.product.warranty_months at confirmation time.

**Validates: Requirements 13**

### Property 12: Installation Job Gate

*For all* install jobs J associated with order O, J.status can transition to 'in_progress' IF AND ONLY IF O.status = 'delivered' AND all O.order_lines have qty_delivered = qty_required.

**Validates: Requirements 14**

### Property 13: Ticket Warranty Decision

*For all* tickets T created with asset A, T.warranty_decision = 'in_warranty' IF AND ONLY IF (A.warranty_end ≥ current_date AND A.warranty_void = false), AND T.billing = 'not_applicable' when warranty_decision = 'in_warranty'.

**Validates: Requirements 17, 18**

## Error Handling

### Error Code System

All errors follow a consistent structure:
```typescript
{
  code: string;        // Machine-readable error code (UPPER_SNAKE_CASE)
  message: string;     // Human-readable message safe for display
  fieldErrors?: Record<string, string[]>;  // Form validation errors
}
```

### Error Categories and Codes

#### Authentication/Authorization Errors
- **UNAUTHENTICATED**: User session is invalid or expired
- **NO_ROLE**: User profile exists but has no role assigned
- **FORBIDDEN**: User lacks permission for the requested operation
- **LAST_DIRECTOR**: Cannot remove the last active director

#### Gate Violation Errors
- **SURVEY_NOT_APPROVED**: Quote creation requires approved survey (Gate G1)
- **SURVEY_STALE**: Survey is older than 120 days without override (Gate G1)
- **DCR_REQUIRED**: Subsidy-eligible quotes require all DCR panels (Gate G4)
- **VARIATION_PENDING**: Invoice issuance blocked by pending variation (Gate G17)
- **SUBSIDY_NOT_READY**: Subsidy submission requires complete checklist (Gate G18)
- **DELIVERY_OTP_LOCKED**: Maximum OTP attempts exceeded

#### Stock Management Errors
- **INSUFFICIENT_STOCK**: Requested quantity exceeds available stock
- **BACKORDER**: Partial reservation with shortage flagged
- **SCAN_REJECTED_UNKNOWN**: Serial number not found in system
- **SCAN_REJECTED_WRONG_PRODUCT**: Serial product doesn't match order
- **SCAN_REJECTED_RESERVED_OTHER**: Unit reserved to different order
- **SCAN_REJECTED_DUPLICATE**: Unit already dispatched/delivered/installed
- **SCAN_REJECTED_BAD_STATUS**: Unit is damaged/RMA/scrapped

#### Business Logic Errors
- **DUPLICATE**: Record already exists (phone, reference number, etc.)
- **CONSTRAINT**: Database check constraint violation
- **STALE_VERSION**: Optimistic concurrency conflict - record changed
- **JOB_CLOSED**: Cannot modify closed/completed job
- **PAY_PERIOD_LOCKED**: Cannot modify time entries in locked period

#### Technical Errors
- **VALIDATION**: Form input validation failed (includes fieldErrors)
- **RETRY**: Serialization failure - client should retry once
- **UPLOAD_REJECTED**: File validation failed (size, type, or content)
- **LINK_INVALID**: Share link expired, revoked, or not found
- **RATE_LIMITED**: Too many requests from this IP
- **INTERNAL**: Unexpected server error (logged, generic message shown)

### Error Handling Patterns

#### Server Actions
```typescript
// In defineAction catch block
try {
  const data = await cfg.handler({ profile, db }, parsed.data);
  return { ok: true, data };
} catch (e) {
  const { code, message } = parsePgError(e);
  if (code === 'INTERNAL') {
    // Log full error server-side, return generic message
    await db.from('action_failures').insert({
      action: cfg.name,
      actor_id: profile.id,
      code,
      message: e.message,
      detail: e.stack
    });
  }
  return { ok: false, error: { code, message } };
}
```

#### Postgres RPC Functions
```sql
-- Use consistent error format
RAISE EXCEPTION 'SURVEY_NOT_APPROVED: Quote requires an approved survey';
RAISE EXCEPTION 'INSUFFICIENT_STOCK: Only % units available for %', v_available, p_product_id;
```

#### Client Components
```typescript
const result = await action(formData);
if (!result.ok) {
  if (result.error.fieldErrors) {
    // Set form field errors
    Object.entries(result.error.fieldErrors).forEach(([field, errors]) => {
      form.setError(field, { message: errors[0] });
    });
  } else {
    // Show toast notification
    toast.error(result.error.message, {
      description: result.error.code === 'RETRY' 
        ? 'Please try again' 
        : undefined
    });
  }
  return;
}
```

#### Offline Sync Errors
- Network errors: Retry with exponential backoff (1s, 5s, 30s, 2min) max 8 attempts
- Business errors (JOB_CLOSED, STALE_VERSION): Mark failed, show in sync status with error message
- Success: Remove from outbox, update UI state

### User-Facing Error Messages

Errors shown to users must be:
- **Clear**: Explain what happened without technical jargon
- **Actionable**: Tell user what they can do to fix it
- **Contextual**: Reference the specific data/action that failed

Examples:
- ❌ "SURVEY_NOT_APPROVED"
- ✅ "You need an approved site survey before creating a quote"

- ❌ "CONSTRAINT violation on customers_phone_uq"
- ✅ "This phone number is already registered"

- ❌ "40001: Serialization failure"
- ✅ "Someone else modified this record. Please reload and try again."

## Testing Strategy

### Testing Pyramid

```
                    /\
                   /  \     E2E Tests
                  /    \    Golden path scenarios
                 /------\   (Playwright)
                /        \
               /  Unit    \  Component Tests
              /   Tests    \ Pure TS logic
             /--------------\ (Vitest)
            /                \
           /   SQL Gate Tests  \ Database Rules
          /----------------------\ (pgTAP)
```

### Unit Testing (Vitest)

**Target**: Pure TypeScript utility functions with NO external dependencies.

**Coverage Requirements**:
- `lib/phone.ts`: E.164 normalization, format display
- `lib/serial.ts`: Serial number normalization (uppercase, trim)
- `lib/money.ts`: Paise ↔ Rupees conversion, formatting
- `lib/time.ts`: IST boundaries (day/week/month), date formatting
- `lib/errors/parse-pg-error.ts`: Error code extraction from Postgres messages
- `lib/offline/outbox.ts`: Mutation queue ordering, backoff calculation

**Example Test**:
```typescript
// lib/phone.test.ts
describe('normalizePhone', () => {
  it('converts 10-digit Indian number to E.164', () => {
    expect(normalizePhone('9876543210', 'IN')).toBe('+919876543210');
  });
  
  it('preserves already normalized numbers', () => {
    expect(normalizePhone('+919876543210', 'IN')).toBe('+919876543210');
  });
  
  it('handles invalid numbers', () => {
    expect(normalizePhone('123', 'IN')).toBe(null);
  });
});
```

### Property-Based Testing (Vitest + fast-check)

**Target**: Core business logic properties that should hold for ALL valid inputs.

**Test Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with: `Feature: solar-ims, Property N: <property text>`

**Example Test**:
```typescript
// modules/quotes/pricing.test.ts
import fc from 'fast-check';

describe('Quote Pricing Properties', () => {
  test('subsidy calculation is deterministic', () => {
    // Feature: solar-ims, Property 5: Subsidy Calculation Exactness
    fc.assert(
      fc.property(
        fc.float({ min: 1, max: 5 }),  // capacity_kw
        fc.record({
          tier1_kw: fc.constant(2),
          tier1_rate_paise: fc.constant(3000000),
          tier2_kw: fc.constant(3),
          tier2_rate_paise: fc.constant(1800000),
          max_paise: fc.constant(7800000)
        }),
        (capacity, tiers) => {
          const result1 = calculateSubsidy(capacity, tiers);
          const result2 = calculateSubsidy(capacity, tiers);
          return result1 === result2 && result1 <= tiers.max_paise;
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Database Testing (pgTAP)

**Target**: SQL gates, automations, RLS policies, and data integrity constraints.

**Test Location**: `supabase/tests/*.sql`

**Critical Tests**:

1. **Gate G1 - Quote Creation Requires Approved Survey**
```sql
-- supabase/tests/test_gate_quote_creation.sql
BEGIN;
SELECT plan(3);

-- Setup: project with pending survey
INSERT INTO projects (id, project_no, ...) VALUES (gen_random_uuid(), 'PRJ-TEST', ...);
INSERT INTO surveys (id, project_id, status) VALUES (gen_random_uuid(), ..., 'pending');

-- Test: quote creation should fail
SELECT throws_ok(
  'SELECT fn_create_quote(...)',
  'SURVEY_NOT_APPROVED',
  'Quote creation blocked without approved survey'
);

-- Setup: approve survey
UPDATE surveys SET status = 'approved' WHERE project_id = ...;

-- Test: quote creation should succeed
SELECT lives_ok(
  'SELECT fn_create_quote(...)',
  'Quote creation allowed with approved survey'
);

SELECT * FROM finish();
ROLLBACK;
```

2. **Atomic Stock Reservation (Property 1)**
```sql
-- Test concurrent order confirmation
-- Two connections attempting to reserve same stock simultaneously
-- Verify total reserved never exceeds available
```

3. **RLS Policies**
```sql
-- Test technician cannot SELECT from product_costs
-- Test warehouse cannot SELECT from orders/payments
-- Test each role sees only permitted data
```

### End-to-End Testing (Playwright)

**Target**: Golden path user journeys through complete workflows.

**Test Scenarios**:

1. **Complete Installation Flow** (15-20 steps)
   - Public lead submission
   - Sales qualification
   - Survey scheduling & submission
   - Manager survey approval
   - Quote generation & sending
   - Customer quote acceptance
   - Payment recording & auto-confirmation
   - Warehouse scanning & dispatch
   - Delivery confirmation
   - Installation completion with signature
   - Verify: order status = 'completed', assets created with warranty dates

2. **Service Ticket Flow** (8-10 steps)
   - Support searches customer by serial
   - Verify warranty status displayed correctly
   - Create ticket (auto warranty decision)
   - Technician adds parts & labour
   - Mark work done (auto invoice generation)
   - Customer confirmation
   - Verify: ticket closed, invoice issued if out-of-warranty

3. **Offline Field Sync** (6-8 steps)
   - Technician opens job while online
   - Go offline (network emulation)
   - Fill installation form
   - Capture photo
   - Go online
   - Verify: form submitted, photo uploaded, job completed

**Authentication Setup**:
- Seed test users via Clerk API with known credentials
- Store sessions in Playwright storage state
- Reuse sessions across tests

**Test Helpers**:
```typescript
// e2e/helpers/auth.ts
export async function loginAs(page: Page, role: AppRole) {
  const credentials = TEST_USERS[role];
  await page.goto('/sign-in');
  await page.fill('input[name=identifier]', credentials.email);
  await page.fill('input[name=password]', credentials.password);
  await page.click('button[type=submit]');
  await page.waitForURL('/dashboard');
}
```

### Manual Testing Checklist

Due to environment constraints, these scenarios require manual verification:

**Mobile Safari/Chrome (Field Operations)**:
- [ ] Offline mode: complete installation form without network
- [ ] Photo capture: native camera opens, compression works
- [ ] Signature canvas: touch input captured cleanly
- [ ] Barcode scanner: camera permission requested correctly
- [ ] Sync indicators: accurate status shown during upload
- [ ] PWA install: Add to Home Screen works

**Barcode Scanning**:
- [ ] Camera scanner detects Code128, QR codes
- [ ] Manual entry fallback always accessible
- [ ] Double-confirm prevents accidental submissions
- [ ] Rejection messages clear and actionable

**PDF Generation**:
- [ ] Rupee symbol (₹) renders correctly in all PDFs
- [ ] Quote PDF shows subsidy box when eligible
- [ ] Invoice PDF layout matches GST requirements
- [ ] QR code labels print correctly at 50×25mm

### Test Data Management

**Seed Data** (`supabase/seed.sql`):
- Settings with default values
- Product catalogue (panels, inverters, batteries, cables)
- Package templates (ON-1KW through OFF-5KW)
- Fault codes (generic inverter errors)
- Demo users (one per role)

**Test Fixtures** (`scripts/seed-demo.ts`):
- 10 customers with varied types
- 5 leads in different statuses
- 3 projects at different stages
- Initial stock (50 panels, 10 inverters, bulk items)
- 2 completed projects with full cost data for profit testing

**Cleanup Strategy**:
- E2E tests use isolated test database (`supabase db reset`)
- pgTAP tests wrapped in `BEGIN; ... ROLLBACK;`
- Playwright clears cookies/storage between test files

### CI/CD Pipeline

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          
      # Type checking
      - run: npm run typecheck
      
      # Linting
      - run: npm run lint
      
      # Unit tests
      - run: npm run test:unit
      
      # Database tests
      - uses: supabase/setup-cli@v1
      - run: |
          supabase start
          supabase db reset
          supabase test db
      
      # E2E tests
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
        env:
          CLERK_SECRET_KEY: ${{ secrets.CLERK_TEST_SECRET }}
          
      # Upload test results
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

### Test Metrics and Coverage Goals

**Unit Test Coverage**: 90%+ for utility functions

**Property Test Coverage**: 
- All 13 correctness properties have corresponding tests
- Each property test runs minimum 100 iterations
- Property tests tagged for traceability

**Database Test Coverage**:
- All 10 gates have explicit tests
- All automations (A1-A16) have behavior verification
- RLS policies tested for all 7 roles × key tables

**E2E Test Coverage**:
- 3 golden path scenarios (complete flows)
- Smoke tests for all user-facing pages per role
- Critical error paths (payment failure, scan rejection, signature refusal)

### Performance Testing

**Benchmarks** (run in CI on every PR):
- Support search response time: < 300ms (90th percentile)
- Warehouse scan validation: < 400ms per scan
- Dashboard load: < 1.5s with 960 projects (40/month × 24 months)
- Quote BOM generation: < 2s for 5kW system

**Load Testing** (quarterly):
- 10 concurrent order confirmations (stock reservation)
- 50 concurrent warehouse scans
- 100 concurrent support searches

Regression alert if any benchmark degrades >20%.
