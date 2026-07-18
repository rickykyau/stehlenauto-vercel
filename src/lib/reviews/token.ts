import crypto from "node:crypto";

/**
 * Cycle 14BI-rev: signed review-request tokens.
 *
 * A post-purchase email links each purchased product to its PDP review form
 * with a token that proves the reader actually bought that product on that
 * order. When the form POSTs the token back, /api/reviews validates it and
 * marks the review verified-purchase (+ records the order id). The payload is
 * NOT secret (it rides in a URL) — the HMAC only guarantees integrity, so a
 * shopper can't forge a verified review for a product they didn't buy.
 *
 * Secret: REVIEW_TOKEN_SECRET if set, else falls back to SHOPIFY_WEBHOOK_SECRET
 * (already present in prod) so this works with no new env var. Rotating either
 * simply invalidates outstanding links — acceptable for a 60-day review ask.
 */

export type ReviewTokenPayload = {
  /** Shopify order id (numeric string). */
  o: string;
  /** Product handle the review is for. */
  h: string;
  /** Buyer email (lowercased) — the review author is pinned to this. */
  e: string;
  /** Expiry, unix seconds. */
  x: number;
};

export type VerifiedReviewGrant = {
  orderId: string;
  handle: string;
  email: string;
};

const DEFAULT_TTL_DAYS = 60;

function secret(): string {
  const s = process.env.REVIEW_TOKEN_SECRET || process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!s) throw new Error("REVIEW_TOKEN_SECRET / SHOPIFY_WEBHOOK_SECRET not set");
  return s;
}

function b64url(buf: Buffer): string {
  return buf.toString("base64url");
}

function sign(body: string): string {
  return crypto.createHmac("sha256", secret()).update(body).digest("base64url");
}

/**
 * Mint a token for one (order, product, buyer). `nowSec` is injectable for
 * tests; defaults to the real clock.
 */
export function createReviewToken(
  input: { orderId: string; handle: string; email: string },
  opts?: { ttlDays?: number; nowSec?: number },
): string {
  const now = opts?.nowSec ?? Math.floor(Date.now() / 1000);
  const payload: ReviewTokenPayload = {
    o: input.orderId,
    h: input.handle,
    e: input.email.trim().toLowerCase(),
    x: now + (opts?.ttlDays ?? DEFAULT_TTL_DAYS) * 86400,
  };
  const body = b64url(Buffer.from(JSON.stringify(payload)));
  return `${body}.${sign(body)}`;
}

/**
 * Validate a token. Returns the grant when the signature is valid, the token
 * is unexpired, and the payload is well-formed; otherwise null. Constant-time
 * signature comparison. `nowSec` injectable for tests.
 */
export function verifyReviewToken(
  token: string | null | undefined,
  opts?: { nowSec?: number },
): VerifiedReviewGrant | null {
  if (!token || typeof token !== "string") return null;
  const dot = token.indexOf(".");
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const mac = token.slice(dot + 1);

  const expected = sign(body);
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  let payload: ReviewTokenPayload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (!payload || typeof payload !== "object") return null;
  if (typeof payload.o !== "string" || !payload.o) return null;
  if (typeof payload.h !== "string" || !payload.h) return null;
  if (typeof payload.e !== "string" || !payload.e) return null;
  if (typeof payload.x !== "number") return null;

  const now = opts?.nowSec ?? Math.floor(Date.now() / 1000);
  if (payload.x < now) return null; // expired

  return { orderId: payload.o, handle: payload.h, email: payload.e };
}
