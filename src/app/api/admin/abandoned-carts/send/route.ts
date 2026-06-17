import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "../../_auth";
import { db, dbConfigured } from "@/lib/db/client";
import { abandonedCartSends } from "@/lib/db/schema";
import {
  getAbandonedCart,
  buildRecoveryEmail,
} from "@/lib/admin/abandoned-carts";
import { sendTransactionalEmail } from "@/lib/email/brevo";

export const runtime = "nodejs";

/**
 * Send a one-off recovery follow-up for a single abandoned cart.
 *
 * Every guard is re-checked SERVER-SIDE against fresh Shopify state — the
 * client is never trusted:
 *   - cart still exists and isn't completed
 *   - it has a customer email to send to
 *   - the customer has NOT already placed an order (the "don't pester Lucas"
 *     rule) — this is the whole point of the request
 *   - we haven't already sent a follow-up for this cart
 */
export async function POST(req: NextRequest) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  let checkoutId: string | null = null;
  try {
    const body = (await req.json()) as { checkoutId?: string };
    checkoutId = body.checkoutId?.trim() || null;
  } catch {
    /* handled below */
  }
  if (!checkoutId) {
    return NextResponse.json(
      { error: "checkoutId is required" },
      { status: 400 },
    );
  }

  let cart;
  try {
    cart = await getAbandonedCart(checkoutId);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Lookup failed" },
      { status: 502 },
    );
  }
  if (!cart) {
    return NextResponse.json(
      { error: "Cart no longer exists or was already completed." },
      { status: 409 },
    );
  }
  if (!cart.email) {
    return NextResponse.json(
      { error: "No email on this cart — can't send a follow-up." },
      { status: 422 },
    );
  }
  if (cart.alreadyPurchased) {
    return NextResponse.json(
      {
        error: `This customer already purchased (order ${cart.purchasedOrderName ?? "found"}). Follow-up blocked.`,
      },
      { status: 409 },
    );
  }
  if (cart.alreadySentAt) {
    return NextResponse.json(
      { error: "A follow-up was already sent for this cart." },
      { status: 409 },
    );
  }

  const { subject, html, text } = buildRecoveryEmail(cart);
  const result = await sendTransactionalEmail({
    to: cart.email,
    toName: cart.customerName !== "Guest" ? cart.customerName : undefined,
    subject,
    html,
    text,
    tags: ["abandoned-cart-recovery"],
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  // Log the send so the UI shows SENT and we refuse to double-send. A logging
  // failure must not look like a send failure — the email already went out.
  let logged = true;
  if (dbConfigured) {
    try {
      await db()
        .insert(abandonedCartSends)
        .values({
          checkoutId,
          sentBy: gate.userId,
          sentTo: cart.email,
        })
        .onConflictDoNothing();
    } catch {
      logged = false;
    }
  }

  return NextResponse.json({
    ok: true,
    sentTo: cart.email,
    messageId: result.messageId,
    logged,
  });
}
