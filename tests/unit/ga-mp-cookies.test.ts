import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { gaClientIdFromCookie, gaSessionIdFromCookie } = await import("@/lib/analytics/ga-mp");

/**
 * The server-side GA4 purchase only joins the buyer's visit (and its
 * source / gclid) when it carries both ids parsed from the GA cookies.
 */
describe("gaClientIdFromCookie", () => {
  it("takes the last two segments of _ga", () => {
    expect(gaClientIdFromCookie("GA1.1.1234567890.1700000000")).toBe("1234567890.1700000000");
  });
  it("rejects junk", () => {
    expect(gaClientIdFromCookie("nope")).toBeNull();
    expect(gaClientIdFromCookie(undefined)).toBeNull();
  });
});

describe("gaSessionIdFromCookie", () => {
  it("reads the old GS1 format", () => {
    expect(gaSessionIdFromCookie("GS1.1.1760000000.5.1.1760000100.0.0.0")).toBe("1760000000");
  });
  it("reads the new GS2 format", () => {
    expect(gaSessionIdFromCookie("GS2.1.s1760000000$o5$g1$t1760000100$j0$l0$h0")).toBe("1760000000");
  });
  it("rejects junk", () => {
    expect(gaSessionIdFromCookie("GA1.1.123.456")).toBeNull();
    expect(gaSessionIdFromCookie(null)).toBeNull();
  });
});
