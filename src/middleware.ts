import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Only auth-only routes go here. /api/garage and /api/sub-model
// support guests (cookie) and authed (DB) — they handle auth internally.
const isProtected = createRouteMatcher([
  "/account(.*)",
  "/admin(.*)",
  // Cycle 6 (Mike): /returns was using its own ad-hoc redirect that dropped
  // the redirect_url query param, so post-sign-in landed on /account instead
  // of back at the return form. Route through the standard middleware path
  // so the redirect_url round-trip is preserved.
  "/returns(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtected(req)) {
    const { userId } = await auth();
    if (!userId) {
      // Cycle 5 (Mike): auth.protect() was emitting `protect-rewrite` which
      // rewrote to a 404 page instead of bouncing to our custom /sign-in. The
      // dev-mode Clerk hosted-UI fallback (united-ibex-88.accounts.dev) was
      // also leaking through. Explicit redirect, with the originally-requested
      // path passed back so post-sign-in lands the user where they meant to go.
      const url = new URL("/sign-in", req.url);
      url.searchParams.set("redirect_url", req.nextUrl.pathname + req.nextUrl.search);
      return NextResponse.redirect(url);
    }
    // Per-page owner-role check happens via `requireOwner()` inside the
    // server component (see /admin/sourcing-gaps/page.tsx for the pattern).
    // Centralizing in middleware would duplicate that logic and the
    // existing pages already enforce it correctly.
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
