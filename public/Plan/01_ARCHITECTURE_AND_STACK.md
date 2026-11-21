# Part 1 — Architecture & Stack

> Read `00_README_AND_PRODUCT_OVERVIEW.md` first. This file tells agents **how the codebase is wired**. Exact configs are given so they can be copied.

---

## 1. Stack decisions (final)

| Concern | Choice | Notes |
|---------|--------|-------|
| Framework | **Next.js (App Router), TypeScript strict** | Server Components for reads, Server Actions for writes, Route Handlers for webhooks/PDF/public APIs |
| Database | **Supabase Postgres** | All business rules in SQL functions (RPC); RLS on every table |
| Auth | **Clerk** (staff only) | Clerk as Supabase **third-party auth provider** (not the deprecated JWT-template flow) |
| Storage | **Supabase Storage** (private buckets) | Signed URLs only |
| Realtime | **Supabase Realtime** (RLS-aware) | Warehouse, support, director, notifications |
| UI | Tailwind CSS + shadcn/ui + lucide-react + sonner | Mobile-first for `/field` |
| Forms | react-hook-form + zod | One zod schema shared client/server |
| Tables | @tanstack/react-table | |
| Charts | recharts | |
| PDF | @react-pdf/renderer (Node runtime) | Register **Noto Sans** font so the ₹ glyph renders |
| Scanning | @zxing/browser (+ native `BarcodeDetector` when available) | Manual entry fallback always present |
| Signature | react-signature-canvas | Stores PNG to Storage |
| Offline/PWA | Serwist (`@serwist/next`) + `idb` | Crew routes only |
| Phone parsing | libphonenumber-js | Normalise to E.164, default region `IN` |
| Webhooks | svix (verify Clerk webhooks) | |
| Tests | Vitest (pure TS), pgTAP via `supabase test db` (SQL gates), Playwright (golden path) | |
| Hosting | Vercel (app) + Supabase Cloud | |

### 1.1 Single-source-of-truth rules (avoid duplicated logic)

1. **Quote BOM generation, pricing, GST, subsidy, margin** → computed **in Postgres** (`fn_build_quote_lines`, `fn_recalculate_quote`, `fn_calc_subsidy`). TypeScript never re-implements them; it renders what the DB returns.
2. **State transitions** → Postgres functions only (see file 04 §RPC catalogue). TypeScript server actions are thin: authenticate → authorise role → validate input (zod) → call RPC → map error → revalidate.
3. **Authorisation** → three layers: (a) Next middleware route-group guard, (b) server-action `roles` check, (c) RLS + function-level `fn_assert_role`. All three must agree (file 02).
4. **Money/time formatting** → `src/lib/money.ts`, `src/lib/time.ts` only. No ad-hoc `toLocaleString` elsewhere.

---

## 2. Repository layout

```
.
├─ docs/
│  ├─ prd/                      # these markdown files
│  └─ DECISIONS.md              # agents append ambiguities + chosen interpretation
├─ public/
│  ├─ fonts/NotoSans-Regular.ttf, NotoSans-Bold.ttf
│  ├─ icons/ (192, 512, maskable)
│  └─ manifest.webmanifest
├─ scripts/
│  ├─ seed-demo.ts              # demo data via admin client (file 08 §7)
│  └─ gen-types.sh              # supabase gen types
├─ supabase/
│  ├─ config.toml
│  ├─ migrations/               # numbered SQL (file 08 §3 lists order)
│  ├─ seed.sql                  # settings + catalogue + templates + fault codes
│  └─ tests/                    # pgTAP tests per gate
├─ src/
│  ├─ middleware.ts
│  ├─ app/
│  │  ├─ layout.tsx, globals.css, not-found.tsx, error.tsx
│  │  ├─ (public)/
│  │  │  ├─ enquire/page.tsx            # public lead form
│  │  │  ├─ q/[token]/page.tsx          # customer quote view + Accept
│  │  │  ├─ track/[token]/page.tsx      # Solar Journey tracker
│  │  │  ├─ a/[token]/page.tsx          # asset passport (QR target)
│  │  │  ├─ r/[token]/page.tsx          # director shared report (read-only)
│  │  │  ├─ d/[token]/page.tsx          # delivery confirmation / OTP page
│  │  │  ├─ sign/[token]/page.tsx       # remote signature page (customer absent case)
│  │  │  └─ offline/page.tsx
│  │  ├─ (auth)/sign-in/[[...sign-in]]/page.tsx
│  │  ├─ (auth)/sign-up/[[...sign-up]]/page.tsx
│  │  ├─ (app)/layout.tsx                # app shell, role-based nav, realtime notifications
│  │  ├─ (app)/pending-role/page.tsx     # shown when profile.role is null
│  │  ├─ (app)/dashboard/page.tsx        # director/manager
│  │  ├─ (app)/leads/…                   # list, new, [id]
│  │  ├─ (app)/projects/…                # list, [id] (timeline of everything)
│  │  ├─ (app)/surveys/…                 # approvals queue, [id]
│  │  ├─ (app)/quotes/…                  # list, new, [id], [id]/print
│  │  ├─ (app)/orders/…
│  │  ├─ (app)/payments/…                # accounts
│  │  ├─ (app)/inventory/…               # stock, receive, movements, adjustments, suppliers
│  │  ├─ (app)/warehouse/…               # picklists/[id], dispatch/[id] (scanner)
│  │  ├─ (app)/schedule/page.tsx         # manager/director scheduling board
│  │  ├─ (app)/field/…                   # MOBILE PWA: jobs, jobs/[id], survey, install, service
│  │  ├─ (app)/service/…                 # search, tickets, tickets/[id]
│  │  ├─ (app)/assets/[id]/page.tsx
│  │  ├─ (app)/invoices/…
│  │  ├─ (app)/subsidy/…
│  │  ├─ (app)/finance/…                 # pay, purchases, costs
│  │  ├─ (app)/reports/…                 # share links management
│  │  ├─ (app)/approvals/page.tsx        # manager inbox
│  │  ├─ (app)/notifications/page.tsx
│  │  └─ (app)/settings/…                # users, business, catalogue, templates, fault-codes
│  │  └─ api/
│  │     ├─ webhooks/clerk/route.ts      # user sync
│  │     ├─ public/lead/route.ts         # POST public enquiry (rate-limited)
│  │     ├─ public/quote-accept/route.ts
│  │     ├─ pdf/quote/[id]/route.ts      # auth'd PDF
│  │     ├─ pdf/invoice/[id]/route.ts
│  │     ├─ pdf/label/[assetId]/route.ts # QR label PDF
│  │     └─ cron/daily/route.ts          # secret-protected (optional if pg_cron used)
│  ├─ modules/                           # ONE FOLDER PER DOMAIN
│  │  ├─ leads/{actions.ts,queries.ts,schemas.ts,components/}
│  │  ├─ surveys/…  ├─ quotes/…  ├─ orders/…  ├─ payments/…
│  │  ├─ inventory/…  ├─ dispatch/…  ├─ assets/…  ├─ jobs/…
│  │  ├─ tickets/…  ├─ invoices/…  ├─ subsidy/…  ├─ pay/…
│  │  ├─ dashboard/…  ├─ share/…  ├─ notifications/…  └─ settings/…
│  ├─ components/
│  │  ├─ ui/              # shadcn primitives
│  │  ├─ shared/          # StatusBadge, MoneyText, DateText, EmptyState, ConfirmDialog, RoleGate, Timeline
│  │  ├─ scan/            # ScannerSheet, SerialInput (double-confirm)
│  │  ├─ signature/       # SignaturePad
│  │  └─ field/           # mobile-first layout, PhotoCapture, OfflineBanner
│  ├─ lib/
│  │  ├─ supabase/{admin.ts,server.ts,browser.ts}
│  │  ├─ auth/{roles.ts,permissions.ts,get-profile.ts,require-role.ts}
│  │  ├─ actions/{define-action.ts,result.ts}
│  │  ├─ errors/{codes.ts,parse-pg-error.ts}
│  │  ├─ offline/{db.ts,outbox.ts,sync.ts,photo-queue.ts}
│  │  ├─ pdf/{fonts.ts,QuotePdf.tsx,InvoicePdf.tsx,LabelPdf.tsx}
│  │  ├─ money.ts  time.ts  phone.ts  serial.ts  tokens.ts  ids.ts
│  │  └─ constants.ts
│  └─ types/database.ts                  # generated; never edit by hand
├─ .env.example
├─ next.config.ts
├─ vercel.json
├─ package.json
└─ tsconfig.json        # "strict": true, "noUncheckedIndexedAccess": true
```

**Rule:** no business logic inside `app/` page files. Pages compose `modules/*/queries.ts` (server reads) and `modules/*/components`. Mutations live only in `modules/*/actions.ts`.

---

## 3. Environment variables (`.env.example`)

```bash
# --- Clerk ---
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/pending-role
CLERK_WEBHOOK_SIGNING_SECRET=            # svix secret for /api/webhooks/clerk

# --- Supabase ---
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=           # or publishable key (new naming)
SUPABASE_SERVICE_ROLE_KEY=               # or secret key; SERVER ONLY, never NEXT_PUBLIC

# --- App ---
NEXT_PUBLIC_APP_URL=http://localhost:3000
BOOTSTRAP_DIRECTOR_EMAIL=                # first signup with this email becomes director
TOKEN_PEPPER=                            # random 32+ bytes; used when hashing public tokens
CRON_SECRET=                             # bearer secret for /api/cron/*
COMPANY_NAME="SunPower Solutions"
COMPANY_GSTIN=
COMPANY_ADDRESS=
COMPANY_PHONE=
COMPANY_UPI_ID=                          # shown on invoices/quotes

# --- Optional (P2) ---
CLOUDFLARE_TURNSTILE_SECRET=
NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY=
RESEND_API_KEY=
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_ACCESS_TOKEN=
```

---

## 4. One-time setup, step by step

### 4.1 Clerk
1. Create a Clerk application. Enable **Email** (and optionally Google) sign-in.
2. **Restrict sign-ups** (Clerk Dashboard → Configure → Restrictions → *Restricted* / invite-only) so only invited staff can join. For the hackathon you MAY leave sign-up open; users without a role land on `/pending-role` and can see nothing.
3. In Clerk Dashboard → **Integrations → Supabase** → activate. Copy the **Clerk domain**. (This makes Clerk session tokens carry `"role": "authenticated"` which Supabase needs.)
4. Session token customisation (Clerk Dashboard → Sessions → Customize session token) — add:
   ```json
   { "app_role": "{{user.public_metadata.role}}" }
   ```
   This lets middleware guard route groups without a DB call. **The DB `profiles.role` remains the source of truth**; server actions and RLS re-check it.
5. Webhooks → add endpoint `https://<app>/api/webhooks/clerk` subscribing to `user.created`, `user.updated`, `user.deleted`. Copy the signing secret to `CLERK_WEBHOOK_SIGNING_SECRET`.

### 4.2 Supabase
1. Create project. Note URL, anon/publishable key, service-role/secret key.
2. Dashboard → **Authentication → Sign In / Providers → Third-Party Auth → Add provider → Clerk**, paste the Clerk domain.
3. Local dev:
   ```bash
   npm i -D supabase
   npx supabase init
   npx supabase link --project-ref <ref>
   npx supabase db push            # applies supabase/migrations/*
   npx supabase db reset           # local: migrations + seed.sql
   npx supabase gen types typescript --linked > src/types/database.ts
   ```
4. Enable extensions in migration `0001`: `pgcrypto`, `pg_trgm`, `btree_gist`, `citext`, `pg_cron` (Supabase: enable in dashboard if migration cannot).
5. Create Storage buckets (migration `0012`): see §8.

### 4.3 Next.js
```bash
npx create-next-app@latest solar-ims --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd solar-ims
npm i @clerk/nextjs @supabase/supabase-js zod react-hook-form @hookform/resolvers \
  @tanstack/react-table date-fns @date-fns/tz recharts sonner lucide-react clsx tailwind-merge class-variance-authority \
  @react-pdf/renderer @zxing/browser @zxing/library react-signature-canvas idb browser-image-compression \
  @serwist/next serwist libphonenumber-js qrcode svix nanoid server-only
npm i -D vitest @playwright/test tsx supabase @types/react-signature-canvas @types/qrcode
npx shadcn@latest init
npx shadcn@latest add button input label select textarea dialog sheet table tabs badge card dropdown-menu form checkbox switch calendar popover command skeleton separator alert toast sonner progress tooltip
```

---

## 5. Auth wiring (exact code)

### 5.1 `src/middleware.ts`
```ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublic = createRouteMatcher([
  "/", "/sign-in(.*)", "/sign-up(.*)", "/enquire(.*)",
  "/q/(.*)", "/track/(.*)", "/a/(.*)", "/r/(.*)", "/d/(.*)", "/sign/(.*)",
  "/offline", "/manifest.webmanifest", "/sw.js", "/swe-worker-(.*)",
  "/api/webhooks/(.*)", "/api/public/(.*)", "/api/cron/(.*)",
]);

// Route-group → allowed roles (coarse guard; fine guard is in actions + RLS)
const guards: Array<[RegExp, string[]]> = [
  [/^\/dashboard/,   ["director", "manager"]],
  [/^\/settings/,    ["director"]],
  [/^\/approvals/,   ["director", "manager"]],
  [/^\/leads/,       ["director", "manager", "sales"]],
  [/^\/quotes/,      ["director", "manager", "sales", "accounts"]],
  [/^\/inventory/,   ["director", "manager", "warehouse", "accounts"]],
  [/^\/warehouse/,   ["director", "manager", "warehouse"]],
  [/^\/field/,       ["director", "manager", "technician"]],
  [/^\/service/,     ["director", "manager", "support", "technician"]],
  [/^\/payments/,    ["director", "manager", "accounts"]],
  [/^\/finance/,     ["director", "accounts"]],
  [/^\/invoices/,    ["director", "manager", "accounts", "support"]],
  [/^\/subsidy/,     ["director", "manager", "accounts"]],
  [/^\/reports/,     ["director", "manager"]],
];

export default clerkMiddleware(async (auth, req) => {
  if (isPublic(req)) return;
  const { sessionClaims } = await auth.protect();            // redirects to sign-in if anonymous
  const role = (sessionClaims as any)?.app_role as string | undefined;
  const path = req.nextUrl.pathname;
  if (!role && path !== "/pending-role") {
    return NextResponse.redirect(new URL("/pending-role", req.url));
  }
  for (const [re, allowed] of guards) {
    if (re.test(path) && !(role && allowed.includes(role))) {
      return NextResponse.redirect(new URL("/forbidden", req.url));
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
```
> The middleware role comes from the session token (may lag a few seconds after a role change). Actions/RLS use the DB role and are authoritative.

### 5.2 Supabase clients — `src/lib/supabase/*`

`server.ts` (RLS-enforced, acts **as the logged-in user** — use for all reads):
```ts
import "server-only";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";
import type { Database } from "@/types/database";

export async function supabaseAsUser() {
  const { getToken } = await auth();
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { async accessToken() { return (await getToken()) ?? null; } },
  );
}
```

`admin.ts` (**bypasses RLS** — use only inside server actions/route handlers AFTER role check, and for public-token pages):
```ts
import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export const supabaseAdmin = () =>
  createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
```

`browser.ts` (Realtime + direct signed uploads only):
```ts
"use client";
import { createClient } from "@supabase/supabase-js";
import { useSession } from "@clerk/nextjs";
import { useMemo } from "react";
import type { Database } from "@/types/database";

export function useSupabaseBrowser() {
  const { session } = useSession();
  return useMemo(
    () =>
      createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { async accessToken() { return (await session?.getToken()) ?? null; } },
      ),
    [session],
  );
}
```

### 5.3 Who may use which client
| Situation | Client |
|-----------|--------|
| Server Component read for logged-in staff | `supabaseAsUser()` (RLS applies) |
| Server Action write → RPC | `supabaseAdmin()` after `requireRole()`; the RPC receives `p_actor_clerk_id` + re-checks role |
| Public token page (quote/track/asset/report) | `supabaseAdmin()` + token-hash lookup + column whitelist in a dedicated SQL function (`fn_public_*`) |
| Realtime subscription | `useSupabaseBrowser()` |
| Clerk webhook | `supabaseAdmin()` |

### 5.4 `get-profile.ts`
```ts
import "server-only";
import { auth } from "@clerk/nextjs/server";
import { cache } from "react";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type Profile = {
  id: string; clerk_user_id: string; full_name: string; email: string | null;
  role: "director"|"manager"|"sales"|"warehouse"|"technician"|"support"|"accounts"|null;
  is_active: boolean;
};

export const getProfile = cache(async (): Promise<Profile | null> => {
  const { userId } = await auth();
  if (!userId) return null;
  const { data } = await supabaseAdmin().from("profiles")
    .select("id, clerk_user_id, full_name, email, role, is_active")
    .eq("clerk_user_id", userId).maybeSingle();
  return (data as Profile) ?? null;
});
```

### 5.5 Clerk webhook (`/api/webhooks/clerk/route.ts`) behaviour
- Verify with `svix` (`svix-id`, `svix-timestamp`, `svix-signature` headers). Reject → 400.
- `user.created`: insert `profiles` (`clerk_user_id`, `email`, `full_name`, `role = NULL`, `is_active = true`). If email equals `BOOTSTRAP_DIRECTOR_EMAIL` → `role='director'` **and** set Clerk `publicMetadata.role='director'` via Clerk backend API.
- `user.updated`: update name/email/phone (never touch role).
- `user.deleted`: set `is_active=false`, `deleted_at=now()` (never delete the row; history references it).
- Idempotent (upsert on `clerk_user_id`).

### 5.6 Changing a role (`settings/users`)
Server action `setUserRole({profileId, role})` — roles allowed: `director` only. Steps: (1) `fn_set_user_role` RPC updates `profiles.role` + audit; (2) Clerk `users.updateUserMetadata(clerkId, {publicMetadata:{role}})`; (3) revalidate. Prevent removing the last active director (`LAST_DIRECTOR` error).

---

## 6. Server-action pattern (mandatory)

Every mutation uses `defineAction`. Example contract (copy into `lib/actions/define-action.ts`):

```ts
import "server-only";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getProfile, type Profile } from "@/lib/auth/get-profile";
import { parsePgError } from "@/lib/errors/parse-pg-error";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type AppRole = NonNullable<Profile["role"]>;
export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; fieldErrors?: Record<string, string[]> } };

type Ctx = { profile: Profile; db: ReturnType<typeof supabaseAdmin> };

export function defineAction<S extends z.ZodTypeAny, R>(cfg: {
  name: string;
  roles: AppRole[];                       // director is always allowed implicitly
  schema: S;
  revalidate?: string[];
  handler: (ctx: Ctx, input: z.infer<S>) => Promise<R>;
}) {
  return async (raw: z.input<S>): Promise<ActionResult<R>> => {
    const profile = await getProfile();
    if (!profile || !profile.is_active) return fail("UNAUTHENTICATED", "Please sign in.");
    if (!profile.role) return fail("NO_ROLE", "Your account has no role yet.");
    if (profile.role !== "director" && !cfg.roles.includes(profile.role))
      return fail("FORBIDDEN", "You are not allowed to do this.");
    const parsed = cfg.schema.safeParse(raw);
    if (!parsed.success)
      return { ok: false, error: { code: "VALIDATION", message: "Please fix the highlighted fields.",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> } };
    try {
      const data = await cfg.handler({ profile, db: supabaseAdmin() }, parsed.data);
      cfg.revalidate?.forEach((p) => revalidatePath(p));
      return { ok: true, data };
    } catch (e) {
      const { code, message } = parsePgError(e);
      return fail(code, message);
    }
  };
}
const fail = (code: string, message: string) => ({ ok: false as const, error: { code, message } });
```

`parsePgError`: Postgres `RAISE EXCEPTION` messages follow `CODE: human text`. Regex `^([A-Z_]{3,40}):\s*(.*)$` → `{code, message}`; unique violations (`23505`) → `DUPLICATE`; check violations (`23514`) → `CONSTRAINT`; serialization (`40001`) → `RETRY` (client auto-retries once); anything else → `INTERNAL` with a generic message (log the real one server-side).

### 6.1 Calling an RPC from an action
```ts
const { data, error } = await db.rpc("fn_approve_survey", {
  p_actor: profile.id, p_survey_id: input.surveyId, p_note: input.note ?? null,
});
if (error) throw error;     // parsePgError handles it
return data;                // jsonb result
```
**Every RPC takes `p_actor uuid`** (the `profiles.id`) because the service role has no JWT identity. Every RPC re-checks that actor's role with `fn_assert_role(p_actor, array['manager','director'])`.

### 6.2 Idempotency
Mutations that can be double-submitted (payments, scans, dispatch finalisation, install submission, signature, ticket creation from field/offline) accept `idempotencyKey` (client UUID). RPC does `INSERT … ON CONFLICT (idempotency_key) DO NOTHING` and returns the **original** result if repeated. The client generates the key when the form opens (not on click) so retries reuse it.

### 6.3 Optimistic concurrency
Editable records carry `row_version int`. Update RPCs take `p_expected_version`; mismatch → `STALE_VERSION: This record was changed by someone else. Reload.` UI shows a reload prompt.

---

## 7. Reads, Realtime, caching

- Reads: Server Components call `modules/*/queries.ts` using `supabaseAsUser()`. Use `select` with explicit columns, **never `select('*')` on tables that have PII columns shared across roles**.
- Realtime channels (client components only):
  - `pick_lists` (warehouse) · `tickets` (support) · `notifications` (everyone, filtered by `recipient_id`) · `jobs` (field schedule) · `v_dashboard_live` is **not** a table → dashboard re-fetches on `jobs/payments/tickets` change events (debounced 2 s).
- Fallback: `router.refresh()` every 20 s on warehouse/support pages if the websocket drops.
- `revalidatePath` after each action for server-rendered lists.
- No client-side global store. Local UI state only; server is truth.

---

## 8. Storage

Private buckets (policies: no public access; only service role writes; reads via signed URLs generated server-side after authorisation):

| Bucket | Contents | Path convention | Max | Mime |
|--------|----------|-----------------|-----|------|
| `survey-photos` | roof/meter/DB photos | `{project_id}/{survey_id}/{uuid}.jpg` | 5 MB | image/jpeg,png,webp |
| `install-photos` | install evidence | `{project_id}/{job_id}/{kind}/{uuid}.jpg` | 5 MB | image |
| `signatures` | signature PNG | `{project_id}/{job_id}/{uuid}.png` | 300 KB | image/png |
| `documents` | quote/invoice PDFs, subsidy docs, delivery proofs | `{kind}/{entity_id}/{uuid}.pdf` | 10 MB | pdf,image |

**Upload flow (all uploads):**
1. Client calls action `createUploadUrl({bucket, entityId, kind, contentType, size})` → server authorises, returns `{path, signedUrl, token}` (`createSignedUploadUrl`).
2. Client `PUT`s the (compressed) file directly to Storage.
3. Client calls the domain action (e.g. `attachJobPhoto`) with `{path, kind, takenAt, lat, lng, idempotencyKey}`; server verifies the object exists (`list`/`info`), inserts the metadata row.
4. Viewing: `getSignedUrl(path, 300)` server-side on demand.

Client-side image compression: `browser-image-compression` → max width 1600 px, JPEG quality 0.8, ≤ 1.5 MB.

---

## 9. Offline-first field PWA (crew routes `/field/**` only)

### 9.1 Scope
Offline **works for**: viewing assigned jobs (cached), filling survey/install/service forms, capturing photos, capturing signature. Offline **does not**: scanning-based stock changes, payments, approvals (those need the network and are not crew tasks).

### 9.2 Serwist setup (`next.config.ts`)
```ts
import withSerwistInit from "@serwist/next";
const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});
export default withSerwist({ reactStrictMode: true });
```
`src/app/sw.ts`: precache app shell; runtime cache: `/field/**` HTML = `NetworkFirst` (3 s timeout), static assets `StaleWhileRevalidate`, images `CacheFirst`. Offline fallback → `/offline`.

`public/manifest.webmanifest`: `name: "SunPower Field"`, `start_url: "/field"`, `display: "standalone"`, `theme_color`, 192/512/maskable icons.

### 9.3 Local data (IndexedDB via `idb`, db name `sunpower-field`)
| Store | Key | Value |
|-------|-----|-------|
| `jobs` | `job_id` | Snapshot of assigned jobs + customer + survey/BOM summary (no cost fields) refreshed on every online load |
| `drafts` | `job_id:form` | Form JSON + `updatedAt` + `idempotencyKey` |
| `photos` | `uuid` | `{jobId, kind, blob, takenAt, lat, lng, status: 'queued'|'uploading'|'done'|'error', path?}` |
| `outbox` | auto id | `{action: 'submitInstall'|'submitSurvey'|'attachSignature'…, payload, idempotencyKey, attempts, lastError}` |

### 9.4 Sync algorithm (`lib/offline/sync.ts`)
Triggers: `window` `online` event, app start, visibility change, manual "Sync now" button. (iOS has no Background Sync → never rely on it.)
1. Lock (a `navigator.locks` named lock) so two tabs do not sync concurrently.
2. For each queued photo (oldest first): request upload URL → PUT → mark `done` with `path`. Retry with backoff (1 s, 5 s, 30 s, 2 min), max 8 attempts → `error` (user can retry).
3. For each outbox item in order: call the server action with the stored `idempotencyKey`. Success → remove. `RETRY`/network → keep. Business error (e.g. `JOB_CLOSED`) → mark failed, show red badge with the message.
4. Refresh `jobs` snapshot.

### 9.5 UX requirements
- Persistent banner: `Offline — changes are saved on this device` / `Syncing 3 photos…` / `All synced ✓`.
- A job form shows **"Saved on device"** time after every field change (debounced 500 ms).
- Submitting offline moves the job into local state `submitted_offline` (amber) until the server confirms.
- Conflict rule: server status wins. If the job was cancelled/closed server-side, the sync marks the draft `rejected` with the reason; the data stays on device for 7 days.

---

## 10. PDFs

- Route handlers `export const runtime = "nodejs"`.
- Fonts: `Font.register({ family: "Noto", fonts: [{src: path.join(process.cwd(),"public/fonts/NotoSans-Regular.ttf")},{src: ".../NotoSans-Bold.ttf", fontWeight: 700}] })` — default PDF fonts lack `₹`.
- **Quote PDF:** header (company, GSTIN), customer block, project/size, BOM table (item, qty, unit price, GST%, amount), totals (subtotal, discount, GST, total), subsidy & net-cost box (only if eligible; text: *"Subsidy is paid by the Government directly to your bank account after commissioning and is an estimate."*), validity date, terms, accept link QR. **No cost/margin columns, ever.**
- **Invoice PDF:** GST-style tax invoice layout with HSN, per-line GST, place of supply (state), totals in words, payments received, balance.
- **Label PDF (P2):** 50×25 mm QR label with serial and `/a/{token}`.
- Generated PDFs are stored in `documents` and the path saved on the row (`pdf_path`); regenerate on demand if missing.

---

## 11. Scheduled jobs (pg_cron, SQL only — no external scheduler needed)

| Job | Schedule (UTC cron) | SQL function | Effect |
|-----|--------------------|--------------|--------|
| Expire quotes | `*/30 * * * *` | `fn_expire_quotes()` | `sent` quotes past `valid_until` → `expired`; notify owner |
| Follow-up overdue | `30 3 * * *` (09:00 IST) | `fn_notify_overdue_followups()` | Notify lead owners |
| Stale pending payment | `30 4 * * *` | `fn_notify_stale_orders()` | Orders `pending_payment` > 3 days → notify sales + accounts |
| Warranty expiring | `0 4 * * 1` (Mon 09:30 IST) | `fn_notify_expiring_warranties()` | Create AMC-lead suggestion for assets expiring ≤ 60 days |
| Ticket SLA breach | `*/30 * * * *` | `fn_flag_sla_breaches()` | Notify support + manager |
| Share-link cleanup | `0 21 * * *` | `fn_expire_share_links()` | Mark expired links |
| Missing-time-entry flag | `0 14 * * *` | `fn_flag_missing_time_entries()` | Completed install jobs without time entries → notify manager |

Email/WhatsApp sending (P2) is done inside server actions using `after()` from `next/server` — v1 notifications are **in-app only**, written by the RPC that caused them.

---

## 12. Security checklist (agents must satisfy before "done")

- [ ] `SUPABASE_SERVICE_ROLE_KEY` only in `server-only` modules; grep for it in client bundles = 0.
- [ ] RLS enabled on **every** table; a pgTAP test iterates `pg_tables` and fails if any `public` table lacks RLS.
- [ ] `REVOKE ALL ON FUNCTION fn_* FROM PUBLIC, anon, authenticated; GRANT EXECUTE … TO service_role;` for all state-changing functions.
- [ ] Public endpoints (`/api/public/*`, token pages) rate-limited with `fn_rate_limit(key text, max int, window interval)` using hashed IP; honeypot field on forms; optional Turnstile.
- [ ] Public tokens: 32 random bytes base64url; **store only `sha256(token || TOKEN_PEPPER)`**; compare hashes; tokens have `expires_at`, `revoked_at`.
- [ ] Public pages never return cost, margin, other customers' data, internal notes, staff phone numbers; shared director reports mask customer phone/address (`redact_pii`).
- [ ] Signed URLs ≤ 5 min; storage object keys unguessable (uuid).
- [ ] Uploads: validate declared mime + size server-side; reject others (`UPLOAD_REJECTED`).
- [ ] Security headers in `next.config.ts` (`X-Content-Type-Options`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY` except none needed, `Permissions-Policy: camera=(self), geolocation=(self)`).
- [ ] No secrets logged. Errors returned to client are code + safe message only.
- [ ] Audit log written for every state change and every sensitive read of cost data (director dashboard open is NOT audited; share-link creation IS).

---

## 13. Testing strategy

| Layer | Tool | What must be covered |
|-------|------|----------------------|
| SQL gates & automations | pgTAP (`supabase/tests/*.sql`) | Quote blocked w/o approved survey; atomic reservation under concurrent calls (two sessions); order-confirm automation creates picklist+job+reservation; scan rejects (wrong product/order/duplicate/unknown); warranty dates per product; free vs paid ticket decision; profit view completeness flags; RLS: technician cannot read cost tables; every table has RLS |
| Pure TS | Vitest | `phone.ts`, `serial.ts` normalisation, `money.ts`, `time.ts` (IST week/month boundaries), `parse-pg-error.ts`, offline outbox ordering/backoff |
| End-to-end | Playwright | Golden path (file 08 §8) with seeded users via Clerk testing tokens or a `E2E_BYPASS` header **only when `NODE_ENV=test`** |
| Manual | Checklist in file 08 | Mobile Safari + Chrome Android install form offline |

CI order: `typecheck → lint → vitest → supabase db reset + pgTAP → playwright`.

---

## 14. Observability & ops
- Structured server logs: `{ts, level, action, actorId, entityType, entityId, code, ms}`.
- `error.tsx` boundaries per route group; user sees code + "Report" copy button.
- Admin page `/settings/system` (director): last 50 failed actions (from `action_failures` table written in `defineAction` catch for `INTERNAL`), outbox/sync health counters (client-reported), DB row counts.
- Backups: Supabase daily backups; `/settings/system` has "Export CSV" for leads, projects, assets, tickets, payments (director only).

---

## 15. Performance targets
- Support serial/phone/name search → results < 300 ms (trigram + btree indexes, file 03).
- Warehouse scan round-trip < 400 ms (single RPC, no N+1).
- Dashboard load < 1.5 s at 40 projects/month × 24 months of data (views over indexed columns; no unbounded joins).
