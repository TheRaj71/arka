# Implementation Plan: Solar Installation Management System

## Overview

This document outlines the implementation tasks for the Solar Installation Management System, a comprehensive platform for managing the complete lifecycle of solar installations from lead capture through 20-year warranty service.

The system is built with Next.js 16, Supabase (Postgres + Storage + Realtime), and follows a backend-first approach with working functionality prioritized over UI polish.

## Current Status

### ✅ **COMPLETED: Database Foundation**

All core database tables are deployed to Supabase Arka project:

- **Migration 0001**: Extensions & 39 Enums  
- **Migration 0002**: Core Tables (Profiles, Customers, Products, Templates, Fault Codes)
- **Migration 0003**: Sales Funnel (Leads, Projects, Jobs, Surveys, Quotes, Orders, Payments)
- **Migration 0004**: Golden Thread (Stock Units, Dispatches, Assets, Tickets, Time Entries)
- **Migration 0005**: Platform & Finance (Invoices, Subsidy, Notifications, Audit, Share Links)

**Total: 70+ tables deployed and ready**

### ✅ **COMPLETED: Initial Setup**

- TypeScript types generated from database schema
- `.env.local` configured with Supabase credentials
- Supabase client utilities (server, client, admin) created
- Project structure initialized

## Task Dependency Graph

```
Phase 1: Core Infrastructure
  └─> Phase 2: Lead Capture (Entry Point)
      └─> Phase 3: Survey & Quote Generation
          └─> Phase 4: Order & Payment
              └─> Phase 5: Inventory & Dispatch
                  └─> Phase 6: Installation
                      └─> Phase 7: Service & Tickets
                          └─> Phase 8: Reporting & Dashboard
```

## Tasks

### Phase 1: Core Infrastructure (P0) - FOUNDATION

#### Task 1.1: Install UI Dependencies
**Status**: Not Started  
**Priority**: P0  
**Estimated**: 1 hour

Install shadcn/ui and set up component library.

```bash
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-label @radix-ui/react-select @radix-ui/react-slot @radix-ui/react-tabs @radix-ui/react-toast
npx shadcn@latest init
npx shadcn@latest add button input label select textarea dialog sheet table tabs badge card dropdown-menu form checkbox switch calendar popover toast
```

**Acceptance Criteria**:
- [ ] All shadcn/ui components installed
- [ ] `components/ui` directory populated
- [ ] Tailwind configured with shadcn theme

**Dependencies**: None

---

#### Task 1.2: Create Utility Functions
**Status**: Not Started  
**Priority**: P0  
**Estimated**: 2 hours

Create money, time, and phone utility functions.

**Files to Create**:
- `src/lib/utils/money.ts` - Format paise to rupees, parse amounts
- `src/lib/utils/time.ts` - IST formatting, date ranges
- `src/lib/utils/phone.ts` - E.164 normalization using libphonenumber-js
- `src/lib/utils/cn.ts` - Tailwind merge utility

**Acceptance Criteria**:
- [ ] `formatMoney(paise)` returns "₹1,234.56"
- [ ] `parsePhone(phone)` returns E.164 format
- [ ] `formatDate(date, 'IST')` returns IST formatted date
- [ ] Unit tests pass for all utilities

**Dependencies**: Task 1.1

---

### Phase 2: Lead Capture - THE ENTRY POINT (P0)

#### Task 2.1: Public Lead Form
**Status**: Not Started  
**Priority**: P0 - CRITICAL PATH  
**Estimated**: 4 hours

Create the public lead capture form - the absolute entry point of the funnel.

**Requirements**: REQ-LEAD-01, REQ-LEAD-04

**Files to Create**:
- `app/(public)/enquire/page.tsx` - Public form
- `app/api/public/lead/route.ts` - API endpoint
- `src/modules/leads/schema.ts` - Zod validation
- `src/modules/leads/actions.ts` - Server action

**Implementation**:
1. Phone normalization with libphonenumber-js (default region: IN)
2. Duplicate detection (check existing open leads by phone)
3. Auto-generate lead number (LD-YYMM-NNNNN)
4. Create customer if not exists
5. Round-robin owner assignment (A1 automation)
6. Rate limiting (60 requests per IP per minute)

**Acceptance Criteria**:
- [ ] Form submits successfully and creates lead
- [ ] Duplicate phone → appends activity instead of new lead
- [ ] Lead number format: LD-2627-00001
- [ ] Owner assigned via round-robin (least open leads)
- [ ] Notification sent to assigned owner
- [ ] Rate limit prevents spam (returns 429 after 60 requests)

**Testing**:
- [ ] Submit with new phone → creates lead + customer
- [ ] Submit same phone again → duplicate_enquiry activity
- [ ] No sales users → notifies managers

**Dependencies**: Task 1.2

---

#### Task 2.2: Lead List View
**Status**: Not Started  
**Priority**: P0  
**Estimated**: 3 hours

Display leads for sales representatives.

**Requirements**: REQ-LEAD-02, REQ-LEAD-03

**Files to Create**:
- `app/(app)/leads/page.tsx` - Lead list
- `src/modules/leads/queries.ts` - Data fetching
- `src/components/shared/StatusBadge.tsx` - Reusable status indicator

**Implementation**:
1. Server Component fetching with RLS (sales see all, others see own)
2. Filter by status (new, contacting, follow_up, converted)
3. Search by name, phone
4. Sort by updated_at desc, next_followup_at
5. Show: lead_no, customer name/phone, source, status, owner, next followup

**Acceptance Criteria**:
- [ ] Sales users see all leads
- [ ] Filtered by status works
- [ ] Search returns matching leads
- [ ] Click lead → navigates to detail
- [ ] Shows correct owner name

**Dependencies**: Task 2.1

---

## Implementation Notes

### Backend-First Approach

For this hackathon build:
1. **Functionality over UI**: Get working features first
2. **Basic UI is fine**: Simple forms, basic tables, minimal styling
3. **Use Supabase directly**: No complex abstractions yet
4. **Test with Postman/curl**: API endpoints before UI

### Key Architectural Decisions

1. **Money**: Always bigint paise, never floats
2. **Phone**: E.164 format only (libphonenumber-js)
3. **Dates**: Store timestamptz (UTC), display IST
4. **IDs**: UUID v4 for all entities
5. **Soft Deletes**: deleted_at timestamp, never hard delete
6. **Idempotency**: Client-generated UUID keys for critical operations

### Testing Strategy

For hackathon demo:
1. **Manual Testing**: Primary approach
2. **Unit Tests**: Only for complex business logic
3. **E2E Tests**: Skip for now, manual demo flow instead

### Priority Levels

- **P0 (MUST)**: Required for hackathon demo
- **P1 (SHOULD)**: Strong differentiators, build if time
- **P2 (COULD)**: Nice-to-have, skip for hackathon

## Next Steps

1. Complete Phase 1 infrastructure tasks (Tasks 1.1-1.2)
2. Build lead capture form (Task 2.1) - THE ENTRY POINT
3. Test the complete flow manually
4. Continue with remaining phases

## Success Criteria

The implementation is successful when we can demonstrate:

1. ✅ Database with all tables deployed
2. ⏳ Lead form → Lead created instantly
3. ⏳ Duplicate phone → Merged activity
4. ⏳ Owner auto-assigned (round-robin)
5. ⏳ Lead list shows all leads for sales
6. ⏳ Call logging and qualification checklist
7. ⏳ Survey submission with validation
8. ⏳ Quote generation from template
9. ⏳ Payment → Auto-creates picklist + job
10. ⏳ Serial scanning with validation
11. ⏳ Delivery → Warranty starts automatically
12. ⏳ Ticket creation with warranty lookup
13. ⏳ Dashboard with profit calculation
