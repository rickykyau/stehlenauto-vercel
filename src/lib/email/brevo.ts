import "server-only";

/**
 * Minimal Brevo transactional-email sender. Used by admin tools that send a
 * one-off email to a single customer (e.g. abandoned-cart recovery). Marketing
 * blasts go through the Brevo campaign UI / Python tooling, NOT this.
 *
 * Sender id 2 = "Stehlen Auto" <info@updates.stehlenauto.com> (same verified
 * sender the reactivation campaigns use). Reply-to routes to the human inbox.
 *
 * Requires BREVO_API_KEY in the environment. Returns the Brevo messageId.
 */
const BREVO_SENDER_ID = 2;
const REPLY_TO = "info@stehlenauto.com";

export type SendResult =
  | { ok: true; messageId: string }
  | { ok: false; error: string };

export async function sendTransactionalEmail(opts: {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  tags?: string[];
}): Promise<SendResult> {
  const key = process.env.BREVO_API_KEY;
  if (!key) return { ok: false, error: "BREVO_API_KEY not set" };

  let res: Response;
  try {
    res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": key,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender: { id: BREVO_SENDER_ID },
        to: [{ email: opts.to, ...(opts.toName ? { name: opts.toName } : {}) }],
        replyTo: { email: REPLY_TO },
        subject: opts.subject,
        htmlContent: opts.html,
        ...(opts.tags ? { tags: opts.tags } : {}),
      }),
    });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Network error reaching Brevo",
    };
  }

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = (await res.json()) as { message?: string; code?: string };
      if (body?.message) detail = `${body.code ?? res.status}: ${body.message}`;
    } catch {
      /* keep HTTP status */
    }
    return { ok: false, error: `Brevo send failed (${detail})` };
  }

  const body = (await res.json()) as { messageId?: string };
  return { ok: true, messageId: body.messageId ?? "" };
}
