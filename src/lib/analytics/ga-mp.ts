import "server-only";

/**
 * GA4 Measurement Protocol — server-side `purchase` event.
 *
 * Why this exists: checkout is Shopify-HOSTED (the buyer leaves
 * stehlenauto.com for a Shopify-owned domain to pay), so the client-side
 * `purchase` event never fires — our /order/confirmation page is never
 * reached. The Shopify `orders/create` webhook is the only reliable place to
 * record a purchase in GA4. We send it server-to-server here.
 *
 * Attribution: the buyer's GA4 client_id (+ utm_*) is carried into the order
 * via cart attributes → order.note_attributes (see lib/cart/server.ts and
 * /api/cart/attributes). We read it back here so the purchase joins the
 * original session/channel. If it's missing we still record the purchase
 * (GA4 will attribute it to Direct rather than drop the revenue).
 *
 * Requires env: NEXT_PUBLIC_GA4_MEASUREMENT_ID + GA4_MP_API_SECRET.
 * Degrades to a logged no-op if either is absent (so the webhook never 500s).
 */

const GA4_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID ?? "";
const MP_SECRET = process.env.GA4_MP_API_SECRET ?? "";

export const gaMpConfigured = Boolean(GA4_ID && MP_SECRET);

/** Extract the GA4 client_id from a raw `_ga` cookie value.
 *  "_ga" looks like "GA1.1.1234567890.1700000000" → client_id is the last two
 *  dot-segments: "1234567890.1700000000". Returns null if unparseable. */
export function gaClientIdFromCookie(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const parts = raw.split(".");
  if (parts.length < 4) return null;
  const cid = `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
  return /^\d+\.\d+$/.test(cid) ? cid : null;
}

/** Extract the GA4 session_id from the stream's `_ga_<STREAM>` cookie.
 *  Old format "GS1.1.1700000000.5.1.1700000100.0.0.0" → 3rd segment;
 *  new format "GS2.1.s1700000000$o5$g1$t1700000100$j0$l0$h0" → the `s` field.
 *  Without it, a Measurement Protocol event joins the user but not the
 *  session, so GA4 reports the purchase's source/medium as "(not set)". */
export function gaSessionIdFromCookie(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const v2 = raw.match(/^GS2\.\d+\.s(\d+)/);
  if (v2) return v2[1];
  const parts = raw.split(".");
  return parts[0] === "GS1" && /^\d+$/.test(parts[2] ?? "") ? parts[2] : null;
}

/** Name of the GA4 session cookie for our stream: G-YS6SFM9QFD → `_ga_YS6SFM9QFD`. */
export const GA_SESSION_COOKIE = `_ga_${GA4_ID.replace(/^G-/, "")}`;

export type PurchaseAttribution = {
  clientId: string | null;
  sessionId?: string | null;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
};

export type PurchaseItem = {
  item_id: string;
  item_name: string;
  quantity: number;
  price: number;
};

export type PurchasePayload = {
  transactionId: string;
  value: number;
  currency: string;
  items: PurchaseItem[];
};

/**
 * Fire a GA4 `purchase` event via Measurement Protocol.
 * Returns a short status string for logging; never throws.
 */
export async function sendPurchaseToGA4(
  purchase: PurchasePayload,
  attr: PurchaseAttribution,
): Promise<string> {
  if (!gaMpConfigured) return "skipped: GA4_MP_API_SECRET/measurement_id not set";

  // No real client_id → synthesize a stable-ish one from the transaction so
  // the purchase records (as Direct) instead of dropping. GA4 requires a
  // non-empty client_id.
  const clientId =
    attr.clientId ?? `srv.${purchase.transactionId.replace(/[^0-9]/g, "") || "0"}`;

  const params: Record<string, unknown> = {
    // session_id ties the purchase to the visit (and its source / gclid);
    // engagement_time_msec makes GA4 count it as an engaged session hit.
    ...(attr.sessionId ? { session_id: attr.sessionId } : {}),
    engagement_time_msec: 1,
    transaction_id: purchase.transactionId,
    currency: purchase.currency,
    value: purchase.value,
    items: purchase.items,
  };
  // Carry campaign attribution onto the event when we have it.
  if (attr.utmSource) params.source = attr.utmSource;
  if (attr.utmMedium) params.medium = attr.utmMedium;
  if (attr.utmCampaign) params.campaign = attr.utmCampaign;

  const body = {
    client_id: clientId,
    // non_personalized_ads off; this is first-party conversion data
    events: [{ name: "purchase", params }],
  };

  try {
    const res = await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(
        GA4_ID,
      )}&api_secret=${encodeURIComponent(MP_SECRET)}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    // MP /collect returns 204 No Content on success and never validates
    // payloads (use /debug/mp/collect for validation). 2xx = accepted.
    return res.ok
      ? `sent: purchase ${purchase.transactionId} value=${purchase.value} cid=${clientId}`
      : `failed: HTTP ${res.status}`;
  } catch (err) {
    return `error: ${err instanceof Error ? err.message : "fetch failed"}`;
  }
}
