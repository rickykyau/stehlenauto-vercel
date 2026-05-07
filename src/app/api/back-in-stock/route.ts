import { NextResponse, type NextRequest } from "next/server";

/**
 * Cycle 14X+ post-sync (Sam re-review CRITICAL): the PDP "NOTIFY ME"
 * form on out-of-stock products has been POSTing to this route since
 * Phase 2 — but the route never existed, so every customer who tried to
 * sign up for back-in-stock alerts hit a 404. This is the minimum-viable
 * stub: capture the email + SKU + handle, redirect to a thank-you state.
 *
 * Phase 5 work (when Klaviyo back-in-stock flow is wired):
 *   - POST to Klaviyo /api/server/events with metric "Back In Stock
 *     Subscribed", profile email, custom property `sku`
 *   - Optional: write to Drizzle table `back_in_stock_subscribers` for
 *     ops-side audit + non-Klaviyo fallback
 *   - Optional: deduplicate via composite (email, sku) unique key
 */
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const referer = req.headers.get("referer") ?? "/";

  let email = "";
  let sku = "";
  try {
    const ct = req.headers.get("content-type") ?? "";
    if (ct.includes("application/x-www-form-urlencoded")) {
      const form = await req.formData();
      email = String(form.get("email") ?? "").trim();
      sku = String(form.get("sku") ?? "").trim();
    } else if (ct.includes("application/json")) {
      const body = (await req.json()) as { email?: string; sku?: string };
      email = (body.email ?? "").trim();
      sku = (body.sku ?? "").trim();
    } else {
      const form = await req.formData();
      email = String(form.get("email") ?? "").trim();
      sku = String(form.get("sku") ?? "").trim();
    }
  } catch {
    return NextResponse.redirect(
      new URL(`${referer}?notify=error`, req.url),
      303,
    );
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.redirect(
      new URL(`${referer}?notify=invalid`, req.url),
      303,
    );
  }

  // Phase 5: forward to Klaviyo + DB. For now log (server-side, no PII
  // shown to client) and acknowledge to the customer with a redirect.
  console.log(
    `[back-in-stock] email=${email.slice(0, 3)}***@${email.split("@")[1] ?? ""} sku=${sku}`,
  );

  return NextResponse.redirect(
    new URL(`${referer}?notify=ok`, req.url),
    303,
  );
}
