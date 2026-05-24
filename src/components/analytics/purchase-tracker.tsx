"use client";

import { useEffect, useRef } from "react";
import { track } from "@/lib/analytics/client";

/**
 * Cycle 14BE-fix2 (Marcus #1 BLOCKER): fires the `purchase` event on
 * /order/confirmation so Klaviyo's "Placed Order" trigger wakes up the
 * post-purchase flow stack (install reminder, cross-sell, review request,
 * winback). Idempotent per orderId via sessionStorage — the page
 * remounting in dev or a back-button re-visit won't double-fire.
 *
 * Server component renders this; we read order context off props.
 */
export function PurchaseTracker({
  orderId,
  value,
  items,
  vehicle,
}: {
  orderId: string;
  value?: number;
  items?: Array<{ sku: string; title: string; price: number; quantity: number }>;
  vehicle?: { year: string; make: string; model: string } | null;
}) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    if (typeof window === "undefined") return;

    const dedupeKey = `stehlen:purchase:fired:${orderId}`;
    if (window.sessionStorage.getItem(dedupeKey) === "1") return;
    window.sessionStorage.setItem(dedupeKey, "1");

    track("purchase", {
      orderId,
      value,
      items: items?.map((it) => ({
        item_id: it.sku,
        item_name: it.title,
        price: it.price,
        quantity: it.quantity,
      })),
      vehicle_year: vehicle?.year,
      vehicle_make: vehicle?.make,
      vehicle_model: vehicle?.model,
      itemCount: items?.reduce((s, it) => s + it.quantity, 0),
    });
  }, [orderId, value, items, vehicle]);

  return null;
}
