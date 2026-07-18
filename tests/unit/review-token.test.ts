import { beforeAll, describe, expect, it } from "vitest";
import {
  createReviewToken,
  verifyReviewToken,
} from "@/lib/reviews/token";

/**
 * Review-token integrity tests. The token is the entire basis for the
 * "Verified Purchase" claim, so tampering, expiry, and cross-product forgery
 * must all be rejected. Payload is not secret (it rides in a URL) — the HMAC
 * only guarantees a shopper can't fabricate a verified review.
 */
beforeAll(() => {
  process.env.REVIEW_TOKEN_SECRET = "test-secret-abc123";
});

const grant = { orderId: "5551212", handle: "2016-tacoma-tonneau", email: "Buyer@Example.com" };

describe("review token", () => {
  it("round-trips a valid token and lowercases email", () => {
    const t = createReviewToken(grant);
    const v = verifyReviewToken(t);
    expect(v).toEqual({
      orderId: "5551212",
      handle: "2016-tacoma-tonneau",
      email: "buyer@example.com",
    });
  });

  it("rejects a tampered payload", () => {
    const t = createReviewToken(grant);
    const [body, mac] = t.split(".");
    // Flip a char in the body — signature should no longer match.
    const badBody = (body[0] === "A" ? "B" : "A") + body.slice(1);
    expect(verifyReviewToken(`${badBody}.${mac}`)).toBeNull();
  });

  it("rejects a tampered signature", () => {
    const t = createReviewToken(grant);
    const [body] = t.split(".");
    expect(verifyReviewToken(`${body}.deadbeef`)).toBeNull();
  });

  it("rejects an expired token", () => {
    const now = 1_800_000_000;
    const t = createReviewToken(grant, { ttlDays: 1, nowSec: now });
    // 2 days later → expired
    expect(verifyReviewToken(t, { nowSec: now + 2 * 86400 })).toBeNull();
    // still valid within window
    expect(verifyReviewToken(t, { nowSec: now + 12 * 3600 })).not.toBeNull();
  });

  it("rejects garbage / empty input", () => {
    expect(verifyReviewToken(null)).toBeNull();
    expect(verifyReviewToken("")).toBeNull();
    expect(verifyReviewToken("nodot")).toBeNull();
    expect(verifyReviewToken(".onlymac")).toBeNull();
  });

  it("a token minted for one product cannot verify as another (handle is signed)", () => {
    const t = createReviewToken(grant);
    const v = verifyReviewToken(t);
    // The caller must compare v.handle against the submitted handle; the token
    // itself pins the product, so a mismatch is detectable.
    expect(v?.handle).toBe("2016-tacoma-tonneau");
    expect(v?.handle).not.toBe("some-other-product");
  });
});
