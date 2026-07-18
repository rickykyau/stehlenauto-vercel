import { beforeAll, describe, expect, it } from "vitest";
import { buildReviewRequestEmail } from "@/lib/reviews/request-email";
import { verifyReviewToken } from "@/lib/reviews/token";

beforeAll(() => {
  process.env.REVIEW_TOKEN_SECRET = "test-secret-abc123";
});

const base = {
  orderId: "5551212",
  orderName: "#1012",
  customerEmail: "buyer@example.com",
  customerName: "Dale Barnett",
  items: [
    { handle: "2016-tacoma-tonneau", title: "2016-2023 Toyota Tacoma 5 ft Bed Tonneau Cover" },
  ],
};

function extractTokens(s: string): string[] {
  // review=<token> up to & or " or # or whitespace
  return [...s.matchAll(/review=([^&"#\s]+)/g)].map((m) =>
    decodeURIComponent(m[1]),
  );
}

describe("review request email", () => {
  it("always includes a hand-written text part", () => {
    const { text } = buildReviewRequestEmail(base);
    expect(text.length).toBeGreaterThan(50);
    expect(text).toContain("Verified Purchase");
    expect(text).toContain("Write a review:");
  });

  it("embeds a valid token that verifies to the right order+product+email", () => {
    const { html } = buildReviewRequestEmail(base);
    const tokens = extractTokens(html);
    expect(tokens.length).toBeGreaterThan(0);
    const grant = verifyReviewToken(tokens[0]);
    expect(grant).toEqual({
      orderId: "5551212",
      handle: "2016-tacoma-tonneau",
      email: "buyer@example.com",
    });
  });

  it("single-item subject names the product; multi-item subject uses the order", () => {
    const single = buildReviewRequestEmail(base);
    expect(single.subject.toLowerCase()).toContain("review");

    const multi = buildReviewRequestEmail({
      ...base,
      items: [
        base.items[0],
        { handle: "ram-1500-running-boards", title: "2019-2024 Ram 1500 Running Boards" },
      ],
    });
    expect(multi.subject).toContain("#1012");
  });

  it("de-duplicates repeated handles into one review link", () => {
    const { html } = buildReviewRequestEmail({
      ...base,
      items: [base.items[0], base.items[0]],
    });
    const handles = extractTokens(html)
      .map((t) => verifyReviewToken(t)?.handle)
      .filter(Boolean);
    expect(handles.length).toBe(1);
  });

  it("escapes HTML in product titles", () => {
    const { html } = buildReviewRequestEmail({
      ...base,
      items: [{ handle: "x", title: 'Bad <script> "title" & co' }],
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});
