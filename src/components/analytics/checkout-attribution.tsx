"use client";

import { useEffect } from "react";

/**
 * On the checkout page, stamp GA4 attribution (client_id + utm) onto the
 * current Shopify cart before the buyer hands off to hosted checkout. Catches
 * returning carts created before attribution existed. Fire-and-forget; renders
 * nothing. The webhook reads these from order.note_attributes to fire an
 * attributed server-side `purchase`.
 */
export function CheckoutAttribution() {
  useEffect(() => {
    fetch("/api/cart/attributes", { method: "POST", keepalive: true }).catch(() => {});
  }, []);
  return null;
}
