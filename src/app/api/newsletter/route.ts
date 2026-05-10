import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

/**
 * Cycle 14AR-fix7 (QA-found BUG-14AZ-1 P0): footer newsletter form posted
 * to `/api/newsletter` which did not exist. Customers attempting to
 * subscribe got a hard 404 page. Marketing lead-capture was completely
 * broken.
 *
 * Creating the route. Three behaviors stacked:
 *
 * 1. Accept email (form-encoded or JSON), validate via Zod.
 * 2. Forward to Klaviyo via the Klaviyo Client API when
 *    NEXT_PUBLIC_KLAVIYO_COMPANY_ID is set. Klaviyo handles
 *    welcome-flow + double opt-in + unsubscribe automatically.
 *    No server-side API key needed for the client subscribe endpoint.
 * 3. If the form was submitted (Accept: text/html, no JSON), redirect
 *    back to the referer with ?subscribed=1. Footer can render a
 *    success state from that param. JSON callers get JSON.
 *
 * Failure modes are all soft — never expose Klaviyo errors to the
 * customer. They see "Subscribed" regardless. Klaviyo bounces, double-
 * opt-in declines, and stale-list cleanup are downstream concerns.
 */

const Body = z.object({
  email: z.string().email().max(254),
});

const KLAVIYO_LIST_ID = process.env.KLAVIYO_NEWSLETTER_LIST_ID || "";
const KLAVIYO_COMPANY_ID = process.env.NEXT_PUBLIC_KLAVIYO_COMPANY_ID || "";

async function subscribeToKlaviyo(email: string): Promise<void> {
  if (!KLAVIYO_COMPANY_ID || !KLAVIYO_LIST_ID) {
    // No Klaviyo configured — log and continue. Owner adds env vars when ready.
    console.log(`[newsletter] subscribe queued (no Klaviyo): ${email}`);
    return;
  }
  try {
    // Klaviyo Client API — subscribe profile to a list. Public endpoint, no
    // server API key needed; rate-limited per company. Klaviyo handles
    // double-opt-in if the list is configured for it.
    const resp = await fetch(
      `https://a.klaviyo.com/client/subscriptions/?company_id=${KLAVIYO_COMPANY_ID}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          revision: "2024-10-15",
        },
        body: JSON.stringify({
          data: {
            type: "subscription",
            attributes: {
              custom_source: "Newsletter Footer",
              profile: {
                data: {
                  type: "profile",
                  attributes: { email },
                },
              },
            },
            relationships: {
              list: { data: { type: "list", id: KLAVIYO_LIST_ID } },
            },
          },
        }),
      },
    );
    if (!resp.ok) {
      const text = await resp.text().catch(() => "(no body)");
      console.error(`[newsletter] Klaviyo ${resp.status}: ${text.slice(0, 200)}`);
    }
  } catch (err) {
    console.error("[newsletter] Klaviyo network error:", err);
  }
}

export async function POST(req: Request) {
  // Accept both form-encoded (default for HTML <form action method=post>)
  // and JSON. Footer form submits as form-encoded.
  const ct = req.headers.get("content-type") ?? "";
  let email = "";
  if (ct.includes("application/json")) {
    const json = await req.json().catch(() => null);
    email = (json && typeof json === "object" && "email" in json
      ? String(json.email)
      : "");
  } else {
    const form = await req.formData().catch(() => null);
    email = form ? String(form.get("email") ?? "") : "";
  }

  const parsed = Body.safeParse({ email: email.trim() });
  if (!parsed.success) {
    // For HTML form, redirect back with ?subscribed=invalid
    if (!ct.includes("application/json")) {
      const referer = req.headers.get("referer") || "/";
      const u = new URL(referer);
      u.searchParams.set("subscribed", "invalid");
      return NextResponse.redirect(u, 303);
    }
    return NextResponse.json(
      { error: "Invalid email" },
      { status: 400 },
    );
  }

  // Fire-and-forget Klaviyo subscribe. Don't block the user response.
  subscribeToKlaviyo(parsed.data.email).catch(() => undefined);

  if (!ct.includes("application/json")) {
    const referer = req.headers.get("referer") || "/";
    const u = new URL(referer);
    u.searchParams.set("subscribed", "1");
    const res = NextResponse.redirect(u, 303);
    // Cycle 14AR-fix26 (Mike R11 F-2): set the toast-pending cookie on the
    // redirect itself so it's present on the very first byte of the next
    // page render — no client-side useEffect race. The NewsletterSuccess
    // component still reads + clears it; this just guarantees the cookie
    // is there before the customer even sees the page after subscribing.
    res.cookies.set("stehlen_newsletter_subscribed", "1", {
      maxAge: 12,
      path: "/",
      sameSite: "lax",
      httpOnly: false,
    });
    return res;
  }
  return NextResponse.json({ ok: true });
}

// GET is not supported — make sure non-form crawlers don't 405-spam logs.
export async function GET() {
  return NextResponse.json(
    { error: "POST email to subscribe" },
    { status: 405 },
  );
}
