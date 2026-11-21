# Arka - Solar Installation Management System: Assumptions

This document records all architectural, domain, and implementation assumptions derived from `00_README_AND_PRODUCT_OVERVIEW.md` through `04_WORKFLOWS_STATE_MACHINES.md`, `IMPLEMENTATION_PLAN.md`, and the Kiro specifications where PRD parts 05–08 were referenced.

---

## 1. Authentication & Role Switcher
- **Clerk Integration**: In local development and hackathon evaluation environments without Clerk webhook delivery tunnels, a built-in role switcher / session simulator is provided in the development app shell to enable testing all 7 roles (`director`, `manager`, `sales`, `technician`, `warehouse`, `support`, `accounts`) seamlessly without logging out.
- **Service Role Execution**: When server actions execute business RPCs, they supply `p_actor uuid` (the profile ID of the acting user) and the Postgres RPC executes `fn_assert_role` to enforce the three-layer defense in depth.

## 2. Storage & Files
- **Storage Buckets**: In environments where Supabase Storage private buckets are not linked or offline, an integrated upload handler provides signed upload URLs and simulates object persistence with reliable fallback base64/data URLs so photo evidence and signature captures never block job completion.
- **Font for PDFs**: `@react-pdf/renderer` requires font registration for `₹` (Indian Rupee symbol). Noto Sans or system fallback font is registered. In web previews, standard Unicode `₹` is rendered via CSS and HTML canvas/DOM.

## 3. Barcode & QR Scanning
- **Camera Scanning**: Utilizes the modern HTML5 `BarcodeDetector` API when available in the browser, falling back to `@zxing/browser` and a prominent manual serial input with double-confirmation to ensure 100% usability across all devices.

## 4. Offline Field PWA
- **IndexedDB**: The field app `/field` caches assigned jobs, drafts, outbox mutations, and captured photos in IndexedDB (`sunpower-field`). When back online, the queue drains automatically and submits idempotent RPC calls using `client_submission_id` and `idempotency_key`.

## 5. Demo Time Travel (18 Months Later)
- **Time Simulation**: To satisfy the acceptance test ("One 3 kW On-Grid residential customer, from web form to a ticket 18 months later, in one uninterrupted run"), a dedicated demo helper / seed command (`/api/demo/advance-time` or admin action) allows fast-forwarding the delivery date of an installed asset by 18 months to immediately demonstrate the warranty verdict (in-warranty vs out-of-warranty auto-billing).

## 6. Currency, Numbers & Timezone
- **Currency**: All monetary values in the database are stored as `bigint` paise (1 INR = 100 paise).
- **Timezone**: All business day boundaries (Today, This Week, This Month) and display formatting strictly observe Indian Standard Time (`Asia/Kolkata`, UTC+05:30).
- **Phone Numbers**: All mobile phone numbers are normalized to E.164 (`+91XXXXXXXXXX`) using `libphonenumber-js`.
