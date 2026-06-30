import { NextResponse, type NextRequest } from "next/server";
import crypto from "node:crypto";
import { sendEmail, ownerEmails } from "@/lib/admin/email";
import {
  buildOrderAlertEmail,
  listActiveEmails,
} from "@/lib/admin/notifications";
import {
  sendPurchaseToGA4,
  type PurchaseItem,
  type PurchaseAttribution,
} from "@/lib/analytics/ga-mp";
import { pingProduct } from "@/lib/seo/indexnow";

/**
 * Pull the GA4 client_id + utm_* we stashed into the cart (→ order
 * note_attributes) before the buyer left for Shopify checkout, then fire a
 * server-side GA4 `purchase`. Hosted checkout never lets the client-side
 * purchase event fire, so this is the only reliable place to record revenue.
 */
async function recordPurchaseGA4(order: Record<string, unknown>): Promise<void> {
  const noteAttrs = Array.isArray(order.note_attributes)
    ? (order.note_attributes as { name: string; value: string }[])
    : [];
  const attrMap = new Map(noteAttrs.map((a) => [a.name, a.value]));
  const attr: PurchaseAttribution = {
    clientId: attrMap.get("_ga_cid") || null,
    utmSource: attrMap.get("utm_source") || undefined,
    utmMedium: attrMap.get("utm_medium") || undefined,
    utmCampaign: attrMap.get("utm_campaign") || undefined,
  };
  const lineItems = Array.isArray(order.line_items)
    ? (order.line_items as Record<string, unknown>[])
    : [];
  const items: PurchaseItem[] = lineItems.map((li) => ({
    item_id: String(li.sku ?? li.product_id ?? li.id ?? ""),
    item_name: String(li.title ?? li.name ?? ""),
    quantity: Number(li.quantity ?? 1),
    price: Number(li.price ?? 0),
  }));
  const status = await sendPurchaseToGA4(
    {
      transactionId: String(order.name ?? order.order_number ?? order.id ?? ""),
      value: Number(order.total_price ?? 0),
      currency: String(order.currency ?? "USD"),
      items,
    },
    attr,
  );
  console.log("[shopify-webhook] GA4 purchase:", status);
}

export const runtime = "nodejs";
// Webhooks must never be statically cached / prerendered.
export const dynamic = "force-dynamic";

/**
 * Shopify webhook receiver. Handles:
 *   - `orders/create`  → staff alert email (/admin/notifications recipients,
 *      fallback ADMIN_OWNER_EMAILS) + server-side GA4 purchase.
 *   - `products/update` / `products/create` → ping IndexNow so Bing/ChatGPT
 *      re-crawl the changed PDP (catalog freshness, no manual re-push).
 * Everything else is acked and ignored.
 *
 * Security: verifies the HMAC-SHA256 signature using SHOPIFY_WEBHOOK_SECRET.
 * Register each topic in Shopify Admin → Settings → Notifications → Webhooks
 * (or via Admin API) pointing at:
 *   https://stehlenauto.com/api/webhooks/shopify
 */
function verifyHmac(rawBody: string, hmacHeader: string | null, secret: string): boolean {
  if (!hmacHeader) return false;
  const digest = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("base64");
  const a = Buffer.from(digest);
  const b = Buffer.from(hmacHeader);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const topic = req.headers.get("x-shopify-topic") || "";
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;

  // No secret configured yet → acknowledge (so Shopify doesn't retry-storm)
  // but take no action. Surfaces in logs as a setup hint.
  if (!secret) {
    console.warn("[shopify-webhook] SHOPIFY_WEBHOOK_SECRET not set — skipping", topic);
    return NextResponse.json({ ok: true, note: "secret-not-configured" });
  }

  if (!verifyHmac(raw, req.headers.get("x-shopify-hmac-sha256"), secret)) {
    return NextResponse.json({ error: "Invalid HMAC" }, { status: 401 });
  }

  // Catalog change → ping IndexNow so Bing (and thus ChatGPT Search) re-crawls
  // the PDP promptly. Fire-and-forget; never blocks the ack. Covers add/edit;
  // a product flipped to draft/archived still gets pinged so Bing re-fetches
  // and drops the now-noindex/404 page.
  if (topic === "products/update" || topic === "products/create") {
    let handle: string | undefined;
    try {
      handle = (JSON.parse(raw) as { handle?: string }).handle;
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    if (!handle) {
      return NextResponse.json({ ok: true, note: "no-handle" });
    }
    const pinged = await pingProduct(handle).catch(() => false);
    console.log(
      `[shopify-webhook] ${topic} ${handle} → IndexNow ${pinged ? "ok" : "failed"}`,
    );
    return NextResponse.json({ ok: true, topic, handle, indexnow: pinged });
  }

  // Only act on order creation beyond this point; ack everything else.
  if (topic !== "orders/create") {
    return NextResponse.json({ ok: true, ignored: topic });
  }

  let order: Record<string, unknown>;
  try {
    order = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // GA4 server-side purchase (independent of the staff email; never blocks it).
  await recordPurchaseGA4(order).catch((e) =>
    console.error("[shopify-webhook] GA4 purchase error:", e),
  );

  const recipients = await listActiveEmails();
  const to = recipients.length > 0 ? recipients : ownerEmails();
  if (to.length === 0) {
    console.warn("[shopify-webhook] no notification recipients configured");
    return NextResponse.json({ ok: true, note: "no-recipients" });
  }

  const { subject, html } = buildOrderAlertEmail(order);
  const result = await sendEmail({ to, subject, html });
  if (!result.sent) {
    // Still 200 so Shopify doesn't retry forever on our email-config gap.
    console.error("[shopify-webhook] order alert email failed:", result.reason);
    return NextResponse.json({ ok: true, emailed: false, reason: result.reason });
  }
  return NextResponse.json({ ok: true, emailed: true, count: to.length });
}
