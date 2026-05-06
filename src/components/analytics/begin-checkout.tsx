"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics/client";
import type { CartLine } from "@/lib/cart/types";

export function BeginCheckoutTracker({
  lines,
  total,
}: {
  lines: CartLine[];
  total: number;
}) {
  useEffect(() => {
    if (lines.length === 0) return;
    track("begin_checkout", {
      currency: "USD",
      value: total,
      items: lines.map((l) => ({
        item_id: l.sku ?? l.variantId,
        item_name: l.productTitle,
        item_brand: "Stehlen",
        price: parseFloat(l.price.amount),
        quantity: l.quantity,
      })),
    });
  }, [lines, total]);

  return null;
}
