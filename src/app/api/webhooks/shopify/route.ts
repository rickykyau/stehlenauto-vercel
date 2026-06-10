import { NextResponse, type NextRequest } from "next/server";
import crypto from "node:crypto";
import { sendEmail, ownerEmails } from "@/lib/admin/email";
import {
  buildOrderAlertEmail,
  listActiveEmails,
} from "@/lib/admin/notifications";

export const runtime = "nodejs";
// Webhooks must never be statically cached / prerendered.
export const dynamic = "force-dynamic";

/**
 * Shopify webhook receiver. Currently handles `orders/create` → fires an
 * internal staff alert email to the recipients managed in /admin/notifications
 * (falling back to ADMIN_OWNER_EMAILS if the list is empty).
 *
 * Security: verifies the HMAC-SHA256 signature using SHOPIFY_WEBHOOK_SECRET.
 * Register the webhook in Shopify Admin → Settings → Notifications → Webhooks
 * (or via Admin API) pointing topic `orders/create` at:
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

  // Only act on order creation; ack everything else.
  if (topic !== "orders/create") {
    return NextResponse.json({ ok: true, ignored: topic });
  }

  let order: Record<string, unknown>;
  try {
    order = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

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
