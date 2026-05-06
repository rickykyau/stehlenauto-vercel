"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics/client";
import type { CatalogProduct } from "@/lib/catalog/types";

export function ViewItemTracker({ product }: { product: CatalogProduct }) {
  useEffect(() => {
    track("view_item", {
      currency: "USD",
      value: product.price,
      items: [
        {
          item_id: product.sku,
          item_name: product.title,
          item_brand: "Stehlen",
          item_category: product.category,
          price: product.price,
        },
      ],
    });
  }, [product.sku, product.title, product.price, product.category]);

  return null;
}
