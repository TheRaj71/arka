import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const isPublic = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/enquire(.*)",
  "/q/(.*)",
  "/track/(.*)",
  "/a/(.*)",
  "/r/(.*)",
  "/d/(.*)",
  "/sign/(.*)",
  "/offline",
  "/manifest.webmanifest",
  "/sw.js",
  "/swe-worker-(.*)",
  "/api/webhooks/(.*)",
  "/api/public/(.*)",
  "/api/cron/(.*)",
]);

// Route-group → allowed roles (coarse guard; fine guard is in actions + RLS)
const guards: Array<[RegExp, string[]]> = [
  [/^\/dashboard/, ["director", "manager"]],
  [/^\/settings/, ["director"]],
  [/^\/approvals/, ["director", "manager"]],
  [/^\/leads/, ["director", "manager", "sales"]],
  [/^\/quotes/, ["director", "manager", "sales", "accounts"]],
  [/^\/inventory/, ["director", "manager", "warehouse", "accounts"]],
  [/^\/warehouse/, ["director", "manager", "warehouse"]],
  [/^\/field/, ["director", "manager", "technician"]],
  [/^\/service/, ["director", "manager", "support", "technician"]],
  [/^\/payments/, ["director", "manager", "accounts"]],
  [/^\/finance/, ["director", "accounts"]],
  [/^\/invoices/, ["director", "manager", "accounts", "support"]],
  [/^\/subsidy/, ["director", "manager", "accounts"]],
  [/^\/reports/, ["director", "manager"]],
];

export default clerkMiddleware(async (auth, req) => {
  if (isPublic(req)) return NextResponse.next();

  const { userId, sessionClaims } = await auth.protect(); // redirects to sign-in if anonymous
  const path = req.nextUrl.pathname;

  // 1. First check session token claim
  let role = (sessionClaims as Record<string, unknown> | undefined)?.app_role as string | undefined;

  // 2. Fallback to Supabase profiles if claim not yet configured or refreshed
  if (!role && userId && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { persistSession: false, autoRefreshToken: false } }
      );
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("clerk_user_id", userId)
        .eq("is_active", true)
        .maybeSingle();

      if (data?.role) {
        role = data.role;
      }
    } catch {
      // DB lookup failed or unavailable
    }
  }

  // Handle /pending-role
  if (path === "/pending-role") {
    if (role) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // Handle /forbidden
  if (path === "/forbidden") {
    return NextResponse.next();
  }

  // If no role assigned, redirect to /pending-role
  if (!role) {
    return NextResponse.redirect(new URL("/pending-role", req.url));
  }

  // Check role guards
  for (const [re, allowed] of guards) {
    if (re.test(path) && role !== "director" && !allowed.includes(role)) {
      return NextResponse.redirect(new URL("/forbidden", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
