# SunPower Solar Installation Management System — PRD (Part 0: Overview)

> **Audience:** AI coding agents (and humans) building the product. This PRD is written as an executable plan: every rule is explicit, every state has a name, every gate has an owner.
> **Stack:** Next.js (App Router) + TypeScript · Supabase (Postgres, Storage, Realtime) · Clerk (staff authentication).
> **Status:** v1.0 — hackathon build. **Timezone:** Asia/Kolkata (IST). **Currency:** INR stored as integer paise.

---

## 0. How to use this document set

Read in this order. Do not start coding before reading files 00–04.

| # | File | Purpose |
|---|------|---------|
| 00 | `00_README_AND_PRODUCT_OVERVIEW.md` (this file) | Vision, scope, requirement IDs, glossary, defaults, domain notes |
| 01 | `01_ARCHITECTURE_AND_STACK.md` | Stack, folder layout, auth wiring, server-action pattern, storage, offline, PDFs, jobs, env vars |
| 02 | `02_ROLES_PERMISSIONS_RLS.md` | Roles, permission matrix, navigation per role, Clerk→Supabase sync, RLS SQL |
| 03 | `03_DATA_MODEL.md` | Enums, tables (DDL), views, sequences, triggers, seed data |
| 04 | `04_WORKFLOWS_STATE_MACHINES.md` | End-to-end control flow, every state machine, gates, automations, RPC contracts, notifications |
| 05 | `05_SPEC_SALES_QUOTE_ORDER.md` | Leads, qualification, survey, quote engine, orders, payments |
| 06 | `06_SPEC_OPERATIONS_FIELD_SERVICE_FINANCE.md` | Inventory, dispatch/scanning, warranty, field PWA, service tickets, invoices, subsidy tracking, pay, director dashboard, public pages |
| 07 | `07_EDGE_CASES_AND_ERRORS.md` | Exhaustive edge cases (IDs), expected behaviour, error-code catalogue |
| 08 | `08_BUILD_PLAN_AND_AGENT_TASKS.md` | Phased task cards with acceptance criteria, test plan, seed script, demo script, agent rules |

**Conflict rule:** if two files disagree, the lower-numbered file wins, except `03_DATA_MODEL.md` wins over everyone on column/enum names.

---

## 1. Product summary

SunPower Solutions is a rooftop-solar installer doing ~40 projects/month for homes and small factories, with 15 field technicians. Today enquiries are lost across WhatsApp/calls/forms, quotes are hand-typed (parts get missed), serial numbers live on paper, site work lives in registers and phone galleries, and nobody knows per-job profit.

We are building **one connected platform** that follows a customer through eight stages:

```
Enquiry → Qualify → Survey → Quote → Order/Payment → Dispatch → Install → Warranty/Service → Director reporting
```

### 1.1 The golden thread (the design idea everything hangs on)

> **Serial number → Asset → Warranty clock → Service ticket → Job cost/profit.**

A physical unit is born at **goods receipt** (serial scanned, cost recorded), is **reserved** to an order, **scanned at dispatch** (linked to the customer), becomes an **asset with a warranty** on delivery, gets **installed** (photos + signature), may later appear on a **ticket** (free/paid decided by warranty), and its **cost** flows into the job's **profit**. If any link in this chain is broken the product has failed. Build the chain first; decorate later.

### 1.2 Success criteria

**Demo success (hackathon judging):** one 3 kW On-Grid residential customer can be taken from web form → ticket 18 months later in a single uninterrupted live run, showing:
1. Lead appears instantly in sales queue (duplicate phone merged).
2. Quote button is **blocked** until survey approved.
3. Template → auto-generated BOM → priced quote with subsidy/net-cost box.
4. Payment confirms order → pick-list + crew job appear **by themselves**.
5. Wrong/duplicate serial scan is **rejected**; correct scan links unit to customer and reduces stock.
6. Delivery confirmation starts warranty clocks **by themselves** (2y inverter/battery, 20y panels).
7. Mobile install form: times, size, photos, on-screen signature.
8. Support finds customer + serial and sees warranty verdict in < 5 seconds; in-warranty = free, out-of-warranty = auto-billed.
9. Director dashboard: profit per job, unfinished jobs, open repairs; today/week/month; shareable link.

**Business success (what the product is for):** zero lost leads; zero hand-typed quotes; 100% serial capture for tracked items; warranty lookup < 5 s; job margin visible within a minute of job close.

---

## 2. Scope

### 2.1 Priority legend
- **P0 (MUST):** literally described in the brief or required for the chain to function. Build all of P0 before any P1.
- **P1 (SHOULD):** strong differentiators; build after P0 is demo-stable.
- **P2 (COULD):** wow extras; only if time remains.

### 2.2 Master requirements index (traceability)

Every task card in file 08 references these IDs.

#### Leads & qualification
| ID | Pri | Requirement |
|----|-----|-------------|
| REQ-LEAD-01 | P0 | Public web form creates a lead instantly (name, phone, address, requested kW, type, notes) visible in sales queue |
| REQ-LEAD-02 | P0 | Leads can **never be hard-deleted**; only closed with a reason (`lost`, `disqualified`, `unreachable`) |
| REQ-LEAD-03 | P0 | Every lead has a status and an owner; unassigned leads auto-assign (round-robin among active sales users) |
| REQ-LEAD-04 | P0 | Duplicate phone (normalised E.164) merges into existing open lead/customer instead of creating a duplicate; adds an activity entry |
| REQ-LEAD-05 | P0 | Call checklist: shadow-free area, monthly electricity bill/units, grid connection suitability (+ roof ownership, consumer number) |
| REQ-LEAD-06 | P0 | Follow-up scheduling with `next_followup_at`; overdue follow-ups highlighted |
| REQ-LEAD-07 | P1 | Lead sources: `web`, `call`, `whatsapp`, `walk_in`, `referral`; manual lead entry by sales |
| REQ-LEAD-08 | P2 | WhatsApp inbound webhook creates structured leads |
| REQ-LEAD-09 | P1 | System-size suggestion from monthly units (0–150 → 1–2 kW, 150–300 → 2–3 kW, >300 → 3+ kW; configurable) |

#### Survey
| ID | Pri | Requirement |
|----|-----|-------------|
| REQ-SURV-01 | P0 | Qualified lead → project + survey job assigned to a technician on the schedule |
| REQ-SURV-02 | P0 | Surveyor records roof direction, tilt, cable distance (DC and AC), shadow-free area, roof type, structure notes, photos |
| REQ-SURV-03 | P0 | Submitted survey goes to manager for **approve / reject / request rework** |
| REQ-SURV-04 | P0 | **HARD GATE:** a quote cannot be created for a project unless it has an `approved` survey (enforced in DB function) |
| REQ-SURV-05 | P1 | Warn if surveyed shadow-free area < required area for requested kW |

#### Quote & kit
| ID | Pri | Requirement |
|----|-----|-------------|
| REQ-QUOTE-01 | P0 | Package templates for 1–5 kW × On-Grid/Off-Grid (10 templates) |
| REQ-QUOTE-02 | P0 | Selecting a template auto-generates full BOM (panels, inverter, charge controller, stands, switches/MCBs, DC/AC wires, junction boxes, earthing, battery for off-grid, installation service) |
| REQ-QUOTE-03 | P0 | Quote pricing: parts + installation + GST; quote number; validity date; status machine |
| REQ-QUOTE-04 | P0 | Prices/costs **frozen** in the quote at creation (price lock) |
| REQ-QUOTE-05 | P1 | Quantities driven by survey (cable length, panel count, stand type) |
| REQ-QUOTE-06 | P1 | Subsidy & net-cost box (residential + on-grid only), settings-driven tiers |
| REQ-QUOTE-07 | P1 | Discount > limit or margin < minimum requires manager approval |
| REQ-QUOTE-08 | P1 | Stock availability indicator per line |
| REQ-QUOTE-09 | P0 | Quote PDF + customer link; customer can **Accept** (creates order) |
| REQ-QUOTE-10 | P1 | Quote versioning (v2 keeps v1) |
| REQ-QUOTE-11 | P2 | Savings/payback estimate, EMI estimate |
| REQ-QUOTE-12 | P0 | Cost/margin hidden from customer view and from non-finance roles |

#### Order & payment
| ID | Pri | Requirement |
|----|-----|-------------|
| REQ-ORD-01 | P0 | Accepted quote → order (`pending_payment`) |
| REQ-ORD-02 | P0 | Record advance or full payment (method, reference, idempotent) |
| REQ-ORD-03 | P0 | When received payments ≥ required advance → order `confirmed` → **automatically**: reserve stock, create pick-list, create install job (unscheduled → scheduled), notify warehouse + crew lead |
| REQ-ORD-04 | P0 | Order cancellation releases reservations, pick-list, job; computes refund due |
| REQ-ORD-05 | P1 | Manager override: confirm without advance (reason logged) |

#### Inventory & dispatch
| ID | Pri | Requirement |
|----|-----|-------------|
| REQ-INV-01 | P0 | Catalogue with serialised vs bulk items |
| REQ-INV-02 | P0 | Goods receipt: serialised units get a record each (serial unique), bulk gets ledger movement; cost recorded |
| REQ-INV-03 | P0 | Atomic reservation on order confirmation (no double allocation) |
| REQ-INV-04 | P0 | Bulk ledger is append-only with reasons; `available = on_hand − reserved` is derived |
| REQ-INV-05 | P0 | Pick-list shows exactly what to pack; picking progress tracked |
| REQ-INV-06 | P0 | Dispatch scan: every serialised unit (inverter, battery, charge controller; panels per setting) scanned/entered, validated, linked to customer; stock reduces |
| REQ-INV-07 | P0 | Wrong product / wrong order / already-dispatched / unknown serial → rejected with clear message; every scan attempt logged |
| REQ-INV-08 | P1 | Camera barcode/QR scan with manual-entry double-confirm |
| REQ-INV-09 | P1 | Panel serials via batch: CSV paste or serial-range |
| REQ-INV-10 | P0 | Low-stock indicator vs reorder level |
| REQ-INV-11 | P1 | Stock adjustments need reason + approval above threshold |

#### Warranty
| ID | Pri | Requirement |
|----|-----|-------------|
| REQ-WAR-01 | P0 | Delivery confirmation auto-creates an **asset** per serialised unit with warranty start/end (inverter 24m, battery 24m, charge controller 24m, panels 240m — from product master) |
| REQ-WAR-02 | P0 | Warranty start trigger is a setting (`delivery` default; `installation` optional) |
| REQ-WAR-03 | P0 | Warranty status computed live: `active`, `expiring_soon` (≤ 60 days), `expired`, `void` |
| REQ-WAR-04 | P1 | Replacement unit inherits remaining warranty per rule; ownership transfer supported |
| REQ-WAR-05 | P2 | QR "asset passport" label/page per serial |

#### Installation
| ID | Pri | Requirement |
|----|-----|-------------|
| REQ-INST-01 | P0 | Crew sees assigned jobs on their schedule (mobile-first) |
| REQ-INST-02 | P0 | Install form: start/finish times, confirmed system size, installed panel count, power test result, photos (required kinds), extra materials, notes |
| REQ-INST-03 | P0 | On-screen customer signature (or pending-signature / refused flags) |
| REQ-INST-04 | P0 | Job cannot be closed if power test failed or required photos/signature missing |
| REQ-INST-05 | P1 | Offline-first: drafts + photos queue in IndexedDB, sync when online, idempotent |
| REQ-INST-06 | P0 | Technician time entries recorded (feeds labour cost and pay) |
| REQ-INST-07 | P1 | Variation handling: installed size ≠ quoted → variation record + approval |

#### Service
| ID | Pri | Requirement |
|----|-----|-------------|
| REQ-SVC-01 | P0 | Support searches by customer name/phone/serial and sees warranty status in seconds |
| REQ-SVC-02 | P0 | Ticket created with fault code, description, priority, linked asset |
| REQ-SVC-03 | P0 | In warranty → no charge; out of warranty → parts + labour auto-billed (service invoice) |
| REQ-SVC-04 | P0 | Ticket stays open until **customer confirms** fixed (confirmation capture) |
| REQ-SVC-05 | P1 | Fault-code lookup suggests probable cause and parts |
| REQ-SVC-06 | P1 | Repeat-complaint flag (same asset within 30 days) |
| REQ-SVC-07 | P1 | Waiting-for-part / RMA statuses |

#### Finance & director
| ID | Pri | Requirement |
|----|-----|-------------|
| REQ-FIN-01 | P0 | Invoices generated from orders/tickets; payments recorded; balances shown |
| REQ-FIN-02 | P0 | Per-job profit = revenue − parts cost − labour − other costs; incomplete cost data flagged, never faked |
| REQ-FIN-03 | P0 | Dashboard: today / this week / this month; open (unfinished) jobs; open repairs |
| REQ-FIN-04 | P0 | Shareable read-only report link (expiring, revocable, PII-masked) |
| REQ-FIN-05 | P1 | Subsidy **paperwork tracking** per project (stage, checklist, readiness check) |
| REQ-FIN-06 | P1 | Technician pay: hours × rate or per-job rate; period approval; missing hours flagged |
| REQ-FIN-07 | P1 | Purchases/supplier records feed cost |

#### Platform
| ID | Pri | Requirement |
|----|-----|-------------|
| REQ-PLAT-01 | P0 | Role-based access (7 roles); technicians never see cost/profit; warehouse never sees payments |
| REQ-PLAT-02 | P0 | Append-only audit log + generic status history |
| REQ-PLAT-03 | P0 | In-app notifications replacing phone calls (role- and user-targeted) |
| REQ-PLAT-04 | P0 | Idempotent writes (retries/double-clicks never duplicate payments/scans) |
| REQ-PLAT-05 | P0 | Soft delete only; IST everywhere; money in paise |
| REQ-PLAT-06 | P1 | Customer "Solar Journey" public tracker page (token link) |
| REQ-PLAT-07 | P1 | Realtime updates on warehouse pick-list, support queue, director dashboard |

### 2.3 Explicitly out of scope (v1)
- Customer login/accounts (customers use signed token links only).
- Multi-tenant / multi-company; multi-warehouse (single `location` text only).
- Full accounting (ledgers, GST returns). We produce invoices and payment records, not tax filings.
- Direct integration with the PM Surya Ghar national portal (we **track** status; staff operate the portal).
- Payment gateway integration (payments are *recorded* by accounts; UPI deep-link is P2 and only generates a link/QR, no reconciliation).
- Native mobile apps (we ship an installable PWA).
- AI features (fault-code lookup is a plain table, not an LLM). Photo QA via vision model is P2.

---

## 3. Personas (roles) — one-line summary

Full permissions in file 02.

| Role | Who | Primary screens |
|------|-----|-----------------|
| `sales` | Telecallers / sales executives | Lead queue, lead detail + checklist, quotes, orders (own) |
| `manager` | Operations/sales manager | Survey approvals, discount approvals, stock adjustment approvals, scheduling |
| `technician` | 15 field staff (survey + install + service visits) | My schedule, survey form, install form, service visit form |
| `warehouse` | Store team | Receiving, pick-lists, dispatch scanning, stock |
| `support` | Service desk | Search, tickets, warranty check, service visits scheduling |
| `accounts` | Finance staff | Payments, invoices, subsidy tracker, technician pay, purchases |
| `director` | Owner | Dashboard, profit, everything read; settings; user management |

`director` ⊇ `manager` (director inherits all manager permissions).

---

## 4. Global product principles (NON-NEGOTIABLE)

1. **Gates are enforced in the database layer** (SQL functions/constraints), never only in the UI. UI disables buttons for UX; the DB refuses for correctness.
2. **Automations are transactional.** "Order confirmed → reserve + pick-list + job + notifications" happens in one Postgres function/transaction. Either all happen or none.
3. **No hard deletes** on business entities. Use `deleted_at` or a terminal status with `reason`. Audit log is append-only.
4. **Idempotency everywhere that matters:** payments, scans, signatures, form submissions carry a client-generated `idempotency_key`; the DB has a unique constraint.
5. **Money is `bigint` paise.** Never floats. GST rates are basis points (`1800` = 18%).
6. **Prices & costs are snapshotted** onto quote lines, order lines, stock units, and job materials. Master-data edits never rewrite history.
7. **One source of truth for status:** each entity has one status column; every change writes a `status_history` row (who, from, to, reason, when).
8. **Cost data is segregated** (separate tables with restrictive RLS) so technicians/warehouse/sales cannot read cost or margin even by crafting requests.
9. **Settings, not hardcodes:** subsidy tiers, GST, warranty trigger, advance %, discount limits, validity days, SLA — all in `settings`.
10. **Never fake a number.** If profit inputs are incomplete, show `Incomplete` with what is missing.
11. **Every user-visible failure has a stable error code** (file 07) and a human message.
12. **Dates:** store `timestamptz` (UTC); display and group by IST. "Today/week/month" boundaries are computed in IST (week starts Monday).

---

## 5. Glossary (plain-English)

| Term | Meaning |
|------|---------|
| Lead | Someone who asked for a quote; not yet a project |
| Project | The spine entity for one customer's installation, from qualification to completion |
| Survey | Technician site visit measuring roof direction, tilt, cable distance |
| Gate | A rule that blocks a step until a prior step is done |
| Automation | Something that happens without a human pressing anything |
| BOM | Bill of materials — the parts list for a quote/order |
| Template (package template) | Reusable recipe, e.g. "3 kW On-Grid" |
| Serialised item | Item tracked per physical unit (inverter, battery, charge controller, panels) |
| Bulk item | Item tracked by quantity (cable, stands, MCBs, connectors) |
| Stock unit | One physical serialised unit |
| Reservation | Stock earmarked for a confirmed order |
| Pick-list | Warehouse packing list derived from an order |
| Dispatch | A truck run delivering items for an order |
| Asset | A delivered, serial-numbered unit owned by a customer, carrying warranty dates |
| Ticket | Tracked service complaint |
| RMA | Return to manufacturer for replacement/repair |
| AMC | Annual maintenance contract (P2 upsell) |
| DCR | Domestic Content Requirement — modules must be India-made (cells + modules) for central subsidy |
| ALMM | Approved List of Models and Manufacturers (MNRE) for modules |
| CFA | Central Financial Assistance (the subsidy) |
| DISCOM | Electricity distribution company; does net-metering and inspection |
| Net metering | Meter arrangement crediting exported units |
| DBT | Direct Benefit Transfer — subsidy paid to the consumer's bank account |
| Paise | 1/100 rupee; all money fields |
| IST | Indian Standard Time (UTC+05:30) |
| RLS | Postgres Row Level Security |
| RPC | A Postgres function called from the app (`supabase.rpc`) |

---

## 6. Default business settings (all editable in Settings UI; seeded)

| Key | Default | Meaning |
|-----|---------|---------|
| `warranty.start_trigger` | `delivery` | `delivery` or `installation` |
| `order.advance_percent` | `50` | Minimum % of order total to confirm an order |
| `order.require_full_payment_before_dispatch` | `false` | If true, dispatch blocked until fully paid |
| `order.require_full_payment_before_commissioning` | `false` | Informational gate at job close |
| `quote.validity_days` | `15` | Quote valid-until offset |
| `quote.max_discount_percent_no_approval` | `3` | Above this → manager approval |
| `quote.min_margin_percent` | `12` | Below this → manager approval |
| `quote.panel_wattage_w` | `540` | Default panel wattage for panel count |
| `subsidy.enabled` | `true` | Show subsidy box |
| `subsidy.tiers` | `[{"upto_kw":2,"per_kw_paise":3000000},{"upto_kw":3,"per_kw_paise":1800000}]` | First 2 kW at ₹30,000/kW, next 1 kW at ₹18,000/kW |
| `subsidy.max_paise` | `7800000` | ₹78,000 cap |
| `subsidy.state_topup_paise_per_kw` | `0` | Optional state top-up |
| `lead.max_contact_attempts` | `5` | After N failed attempts → `unreachable` suggestion |
| `ticket.sla_hours.high` / `.normal` | `24` / `72` | SLA due |
| `ticket.repeat_window_days` | `30` | Repeat complaint window |
| `warranty.expiring_soon_days` | `60` | Badge threshold |
| `dispatch.panels_serial_required` | `true` | Panels scanned individually (false = carton/range) |
| `stock.adjustment_approval_threshold_paise` | `500000` | Adjustments above value need manager approval |
| `share.default_expiry_days` | `7` | Director share link expiry |
| `finance.technician_default_hourly_paise` | `15000` | Fallback labour rate (₹150/h) |
| `finance.travel_cost_default_paise` | `0` | Optional |
| `gst.default_goods_bp` / `gst.default_service_bp` | `1200` / `1800` | **PLACEHOLDERS — confirm current GST rates with the company's CA; per-product override exists** |

---

## 7. India domain notes (verified; keep them configurable)

1. **Subsidy is residential-only and on-grid-oriented.** Under PM Surya Ghar the central subsidy applies to residential rooftop systems; commercial/industrial customers get **no** subsidy line. Off-grid (battery) systems are not the subsidy target — default `subsidy_eligible = residential AND on_grid`. Keep it a computed flag the manager can override with a reason.
2. **Subsidy flows to the customer, not to the installer.** The consumer pays the full system cost to the vendor up front; after DISCOM inspection and the commissioning certificate, the consumer submits bank details on the national portal and the central subsidy is credited **directly to the consumer's bank account** (typically within ~30 days of the claim). Therefore:
   - The quote shows **gross price → expected subsidy → effective net cost to customer** (informational).
   - The company must **collect the full price** from the customer. The subsidy is **not company revenue and not a company receivable.**
   - The director's "subsidy paperwork" view is a **status tracker** (what documents/steps are pending per project, who is blocking), not an accounts-receivable ledger.
   - (An earlier brainstorm note called delayed subsidy a "receivable"; that is **superseded** by this note.)
3. **DCR/ALMM:** modules must be domestically manufactured (cells + module) for CFA eligibility; installer uploads module serials/details. So the module product master has `is_dcr` and the quote for a subsidy customer must use only `is_dcr = true` panels (**hard validation**). Panel serial capture at dispatch directly supports this.
4. **Subsidy paperwork the installer typically handles:** installation/inspection report, DCR undertaking, geo-tagged photo of the plant, meter installation report, module serial upload. The system's *subsidy readiness checker* verifies serials/photos/signature exist before staff submit on the portal.
5. **Name match:** the consumer name on the electricity bill must match the bank account holder. Capture `consumer_name_on_bill` and `consumer_number` on the customer; show a warning if differing from lead name.
6. **Subsidy rates:** central: ₹30,000/kW for first 2 kW + ₹18,000 for the 3rd kW, cap ₹78,000. State top-ups vary → settings, never hardcode.
7. **GST:** rates have changed recently and goods/service split on installation contracts is an accounting decision. All GST is per-product `gst_rate_bp` with defaults in settings. Flag in UI: "Confirm GST rates with your accountant."

---

## 8. End-to-end storyline (also the demo script skeleton)

1. **Day 1, 10:02** — Anita Sharma submits web form: 3 kW On-Grid, subsidy interested. Lead `LD-2627-00001` appears for Sales (owner auto-assigned: Ravi).
2. **10:30** — Ravi calls: 450 sq ft shadow-free, ₹3,800/month bill, grid OK, owns the house. Qualifies → project `PRJ-2627-00001` created; survey job created and scheduled for Thu with technician Imran.
3. **Thu** — Imran surveys on his phone: South-facing, 18° tilt, DC cable 22 m, AC cable 8 m. Submits. Manager Priya approves. **Quote button unlocks.**
4. **Fri** — Ravi picks template `ON-3KW`; BOM auto-fills (6 × 540 W panels, 3 kW inverter, charge controller, stands, MCBs, cables sized from survey, earthing, installation). Subsidy box shows ₹78,000. Discount 2% (no approval). Sends link.
5. **Sat** — Anita opens link, accepts. Order `ORD-…` `pending_payment`. Accounts records ₹1,00,000 advance via UPI → order `confirmed` → stock reserved, pick-list created, install job created and scheduled, notifications fire.
6. **Mon** — Warehouse scans serials; a wrong-product scan is rejected; correct scans link units to Anita; truck leaves. Delivery confirmed (OTP/photo) → warranty clocks start automatically.
7. **Tue** — Crew installs, fills the form offline on the roof, syncs; Anita signs on the tablet; job closes; final invoice issued; subsidy tracker moves to `docs_pending`.
8. **+18 months, rainy day** — Anita calls: fault code, zero power. Support searches her phone number → sees the inverter serial and **"In warranty — 6 months left"** → ticket created, visit scheduled, part swapped, Anita confirms fixed, ticket closed.
9. **Month end** — Director opens dashboard: job profit table (this job: ₹ margin), open jobs, open repairs; shares a read-only link with the CA.

---

## 9. Document conventions for agents

- Code identifiers: tables/columns `snake_case`; TypeScript types `PascalCase`; server actions `verbNoun` (e.g. `approveSurvey`); Postgres functions `fn_verb_noun`; enums `snake_case` values.
- Every Postgres function that changes state: (1) locks relevant rows `FOR UPDATE`, (2) validates gates, (3) mutates, (4) writes `status_history` + `audit_log`, (5) inserts `notifications`/`domain_events`, (6) returns a `jsonb` result `{ok, ...}` or raises `SQLSTATE 'P0001'` with a message starting with the **error code** (e.g. `SURVEY_NOT_APPROVED: ...`). The TS layer parses the code prefix.
- "MUST", "SHOULD", "MAY" follow RFC 2119.
- When a spec says "default", it is a seeded setting, not a constant.
- If anything is ambiguous, pick the safest interpretation (stricter gate, less data exposure), implement it, and note it in `docs/DECISIONS.md`.
