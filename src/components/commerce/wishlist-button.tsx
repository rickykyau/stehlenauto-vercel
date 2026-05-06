"use client";

import { useState } from "react";
import { Icons } from "@/components/ui/icons";
import type { CatalogProduct } from "@/lib/catalog/types";

export function WishlistButton({
  product,
  className,
  style,
}: {
  product: CatalogProduct;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    setBusy(true);
    try {
      if (saved) {
        const res = await fetch("/api/wishlist", {
          method: "DELETE",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ handle: product.handle }),
        });
        if (res.ok) setSaved(false);
        else if (res.status === 401) window.location.href = "/sign-in";
      } else {
        const res = await fetch("/api/wishlist", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            handle: product.handle,
            title: product.title,
            image: product.image,
            price: product.price,
            sku: product.sku,
          }),
        });
        if (res.ok) setSaved(true);
        else if (res.status === 401) window.location.href = "/sign-in";
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-label={saved ? "Remove from saved items" : "Save for later"}
      aria-pressed={saved}
      title={saved ? "Saved — tap to remove" : "Save for later"}
      className={className}
      style={{
        cursor: busy ? "wait" : "pointer",
        color: saved ? "var(--color-primary)" : "var(--color-foreground)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        ...style,
      }}
    >
      {/* Cycle 14R (owner): heart-only at 16px on a btn-lg (56px square)
          dark surface looked like an empty box — owner clicked it and saw
          nothing. Bump the icon and add a SAVE / SAVED label so the
          affordance is unambiguous. */}
      <Icons.heart size={20} />
      <span
        className="mono"
        style={{
          fontSize: 11,
          letterSpacing: "0.08em",
          fontWeight: 600,
        }}
      >
        {saved ? "SAVED" : "SAVE"}
      </span>
    </button>
  );
}
