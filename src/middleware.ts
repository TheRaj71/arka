import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

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
  if (isPublic(req)) return;

  const { sessionClaims } = await auth.protect(); // redirects to sign-in if anonymous
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
