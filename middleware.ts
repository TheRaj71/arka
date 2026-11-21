import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/**
 * Testing Mode: Clerk sign-in and role guards are halted.
 * All routes (Dashboard, Leads, Surveys, Quotes, Orders, Inventory, Service, etc.)
 * are directly accessible for end-to-end testing of real platform functionality.
 */
export default clerkMiddleware(async () => {
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
