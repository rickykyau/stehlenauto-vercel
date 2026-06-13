import { NextResponse } from "next/server";
import { attachAttributionToCart } from "@/lib/cart/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Stamp GA4 attribution (client_id + utm_*) onto the current cart right before
 * the buyer leaves for Shopify hosted checkout. Catches returning carts that
 * were created before attribution was captured. Fire-and-forget from the
 * checkout page; always 200 so it never blocks the handoff.
 */
export async function POST() {
  try {
    const attached = await attachAttributionToCart();
    return NextResponse.json({ ok: true, attached });
  } catch {
    return NextResponse.json({ ok: true, attached: false });
  }
}
