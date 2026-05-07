import "server-only";

/**
 * Cycle 14X+ post-sync (admin Tier A): outbound email via Resend REST.
 *
 * Dep-free — no SDK, just a single fetch. Used for the daily summary
 * cron and the refund + apology-code combo. Falls back gracefully when
 * RESEND_API_KEY is unset (returns { sent: false, reason } instead of
 * throwing) so the calling route can surface a setup hint.
 *
 * Env:
 *   RESEND_API_KEY     — re_xxxxx from resend.com
 *   ADMIN_FROM_EMAIL   — verified sender, e.g. "Stehlen <hello@stehlenauto.com>"
 *                        (defaults to "Stehlen <onboarding@resend.dev>" so the
 *                        first send works without DNS setup)
 */

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
};

export type SendEmailResult =
  | { sent: true; id: string }
  | { sent: false; reason: string };

const DEFAULT_FROM = "Stehlen <onboarding@resend.dev>";

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { sent: false, reason: "RESEND_API_KEY not set" };
  }
  const from = process.env.ADMIN_FROM_EMAIL || DEFAULT_FROM;
  const to = Array.isArray(input.to) ? input.to : [input.to];
  const body = {
    from,
    to,
    subject: input.subject,
    html: input.html,
    text: input.text,
    reply_to: input.replyTo,
  };
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    return { sent: false, reason: `Resend ${res.status}: ${text.slice(0, 200)}` };
  }
  const data = (await res.json()) as { id?: string };
  return { sent: true, id: data.id ?? "" };
}

export function ownerEmails(): string[] {
  const raw = process.env.ADMIN_OWNER_EMAILS;
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
