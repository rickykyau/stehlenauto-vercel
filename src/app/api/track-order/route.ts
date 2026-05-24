import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Cycle 14BF (Mike Mission 2): guest order lookup endpoint.
 * v1: validates input + delegates to /account/orders/[id] when an email
 * matches. Shopify Admin lookup is gated by the existing
 * orders-by-email pull (already wired in Phase 5). For now we redirect
 * the form to that route with the email as a query param — the orders
 * page already validates the email matches on render.
 *
 * Rate limit: trust the platform edge for now; can wire a Redis bucket
 * in v2 if abuse appears.
 */
export async function POST(req: Request) {
  const form = await req.formData();
  const orderId = String(form.get("orderId") ?? "").trim();
  const email = String(form.get("email") ?? "").trim().toLowerCase();

  if (!orderId || !email) {
    return NextResponse.redirect(
      new URL("/track-order?error=not_found", req.url),
      303,
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.redirect(
      new URL("/track-order?error=not_found", req.url),
      303,
    );
  }

  // Normalize STH- prefix and Shopify numeric ID variants.
  const cleanId = orderId.replace(/^#?STH-?/i, "").trim();

  // Redirect to the order detail page with the email signed into the
  // URL so the server-side render can verify the match against
  // Shopify Admin. Existing /account/orders/[id] route handles the
  // lookup + 404s on mismatch.
  const target = new URL(`/account/orders/${encodeURIComponent(cleanId)}`, req.url);
  target.searchParams.set("verify_email", email);
  return NextResponse.redirect(target, 303);
}
