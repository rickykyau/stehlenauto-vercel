import { createReviewToken } from "./token";

/**
 * Cycle 14BI-rev: builds the post-purchase review-request email.
 *
 * One email per order, listing each purchased product with a tokenized deep
 * link to its PDP review form. The token pins (order, product, buyer email) so
 * the resulting review is stamped verified-purchase. ALWAYS returns a hand
 * written `text` part — Brevo's auto-generated plain text mangles line breaks
 * (learned on the abandoned-cart emails).
 */

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://stehlenauto.com";
const PRIMARY = "#f5a823";
const INK = "#12141a";

export type ReviewRequestItem = {
  handle: string;
  title: string;
  imageUrl?: string | null;
};

export type ReviewRequestInput = {
  orderId: string;
  orderName: string; // "#1012"
  customerEmail: string;
  customerName?: string | null;
  items: ReviewRequestItem[];
};

function reviewUrl(orderId: string, email: string, handle: string): string {
  const token = createReviewToken({ orderId, handle, email });
  return `${SITE}/products/${handle}?review=${encodeURIComponent(token)}#pdp-tabs`;
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string,
  );
}

export function buildReviewRequestEmail(input: ReviewRequestInput): {
  subject: string;
  html: string;
  text: string;
} {
  const first = (input.customerName || "").trim().split(/\s+/)[0] || "there";
  const dedup = input.items.filter(
    (it, i, arr) => arr.findIndex((x) => x.handle === it.handle) === i,
  );

  const subject =
    dedup.length === 1
      ? `How's your ${shortName(dedup[0].title)}? Leave a quick review`
      : `How did your Stehlen order ${input.orderName} work out?`;

  // ---- HTML ----
  const rows = dedup
    .map((it) => {
      const url = reviewUrl(input.orderId, input.customerEmail, it.handle);
      const img = it.imageUrl
        ? `<td width="72" style="padding:0 14px 0 0;vertical-align:top;">
             <img src="${esc(it.imageUrl)}" width="72" height="72" alt=""
                  style="border-radius:8px;object-fit:contain;background:#f4f5f7;display:block;">
           </td>`
        : "";
      return `
      <tr>
        ${img}
        <td style="vertical-align:top;padding:0;">
          <div style="font-size:15px;font-weight:600;color:${INK};line-height:1.35;margin-bottom:8px;">
            ${esc(it.title)}
          </div>
          <a href="${url}"
             style="display:inline-block;background:${PRIMARY};color:#12141a;text-decoration:none;
                    font-weight:700;font-size:13px;letter-spacing:.02em;padding:10px 18px;border-radius:6px;">
            ★ Write a review
          </a>
        </td>
      </tr>
      <tr><td colspan="2" style="height:22px;line-height:22px;">&nbsp;</td></tr>`;
    })
    .join("");

  const html = `<!doctype html><html><body style="margin:0;background:#f4f5f7;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0"
             style="max-width:560px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;font-family:-apple-system,Segoe UI,Arial,sans-serif;">
        <tr><td style="background:${INK};padding:20px 28px;">
          <span style="color:#ffffff;font-weight:700;letter-spacing:.14em;font-size:13px;">STEHLEN AUTO</span>
        </td></tr>
        <tr><td style="padding:28px 28px 8px;">
          <h1 style="font-size:20px;color:${INK};margin:0 0 10px;">Hey ${esc(first)}, how'd it go?</h1>
          <p style="font-size:14px;color:#4a515c;line-height:1.55;margin:0 0 4px;">
            Thanks for your order <strong>${esc(input.orderName)}</strong>. Now that you've had a chance to
            install and use it, a quick review helps other truck owners buy the right part with confidence —
            and it takes about 30 seconds.
          </p>
        </td></tr>
        <tr><td style="padding:14px 28px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
        </td></tr>
        <tr><td style="padding:4px 28px 28px;">
          <p style="font-size:12px;color:#8a919c;line-height:1.5;margin:0;">
            Your review is tied to this order, so it'll show as a <strong>Verified Purchase</strong>.
            We publish it after a quick spam check — every honest rating counts, high or low.
          </p>
        </td></tr>
        <tr><td style="background:#f9fafb;padding:16px 28px;border-top:1px solid #eceef1;">
          <p style="font-size:11px;color:#9aa1ac;margin:0;line-height:1.5;">
            Stehlen Auto · You're receiving this because you bought from stehlenauto.com.
            Questions? Just reply to this email.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  // ---- TEXT (hand-written; never let Brevo autogenerate it) ----
  const textLines = [
    `Hey ${first}, how'd it go?`,
    ``,
    `Thanks for your order ${input.orderName}. Now that you've installed and used it,`,
    `a quick review helps other truck owners buy the right part with confidence.`,
    ``,
    ...dedup.flatMap((it) => [
      `• ${it.title}`,
      `  Write a review: ${reviewUrl(input.orderId, input.customerEmail, it.handle)}`,
      ``,
    ]),
    `Your review is tied to this order, so it shows as a Verified Purchase.`,
    `We publish it after a quick spam check — every honest rating counts.`,
    ``,
    `Stehlen Auto · stehlenauto.com`,
    `You're receiving this because you bought from us. Reply anytime.`,
  ];

  return { subject, html, text: textLines.join("\n") };
}

function shortName(title: string): string {
  // "2016-2023 Toyota Tacoma 5 ft Bed Soft Roll-Up Tonneau Cover" → "Tacoma tonneau"
  const t = title.replace(/^\d{4}[-–]\d{2,4}\s*/, "");
  return t.length > 42 ? t.slice(0, 42).trim() + "…" : t;
}
