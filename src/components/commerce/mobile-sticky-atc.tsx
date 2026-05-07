"use client";

import { useEffect, useState } from "react";
import type { CatalogProduct } from "@/lib/catalog/types";

const STICKY_HEIGHT_VAR = "--stehlen-sticky-atc-height";

/**
 * Mobile-only fixed-bottom ATC bar.
 *
 * Hidden by default; appears once the user scrolls past the in-page buy-box
 * (so we don't double the affordance above the fold).
 *
 * Tapping it scrolls back to the buy-box rather than auto-adding to cart —
 * the in-page sub-model strips must still gate the purchase.
 */
export function MobileStickyAtc({ product }: { product: CatalogProduct }) {
  const [visible, setVisible] = useState(false);
  // Cycle 14d (Mike-4 MAJOR): sticky bar used to stay bright yellow + enabled
  // even on a confirmed misfit PDP. Cycle 14X+ (owner): hard-disabling on
  // misfit blocks gift / multi-vehicle purchases. Mirror the buy-box policy:
  // misfit no longer hard-blocks; it changes the label to "ADD TO CART
  // ANYWAY" so the customer sees they're knowingly buying a non-fit. Only
  // out-of-stock keeps the hard disable (can't sell what we don't have).
  const isMisfit = product.fits === false;
  const outOfStock = product.inventory <= 0;
  const blocked = outOfStock;

  useEffect(() => {
    const onScroll = () => {
      // show after the user has clearly scrolled past the hero buy-box
      const showAfter = 720;
      setVisible(window.scrollY > showAfter);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Tell the chat FAB how tall we are so it can lift itself out of our way
  // (Jordan regression: FAB at bottom:24 was overlapping our bar at bottom:0).
  useEffect(() => {
    const root = document.documentElement;
    if (visible && window.matchMedia("(max-width: 767px)").matches) {
      root.style.setProperty(STICKY_HEIGHT_VAR, "76px");
    } else {
      root.style.removeProperty(STICKY_HEIGHT_VAR);
    }
    return () => {
      root.style.removeProperty(STICKY_HEIGHT_VAR);
    };
  }, [visible]);

  const onClick = () => {
    const target = document.querySelector<HTMLElement>(
      "[data-buy-box-anchor]",
    );
    if (target) target.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div
      aria-hidden={!visible}
      className="md:hidden"
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 50,
        background: "var(--color-background)",
        borderTop: "1px solid var(--color-border)",
        padding: "10px 16px calc(env(safe-area-inset-bottom, 0px) + 10px)",
        transform: visible ? "translateY(0)" : "translateY(120%)",
        transition: "transform 200ms ease",
        boxShadow: "0 -8px 24px rgba(0,0,0,0.4)",
      }}
    >
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{ flex: "0 0 auto" }}>
          <div
            className="mono"
            style={{
              fontSize: 10,
              color: "var(--color-muted)",
              letterSpacing: "0.08em",
            }}
          >
            {product.title.length > 28
              ? product.title.slice(0, 28) + "…"
              : product.title}
          </div>
          <div
            className="mono"
            style={{ fontSize: 16, fontWeight: 700 }}
          >
            ${product.price.toFixed(0)}
          </div>
        </div>
        <button
          type="button"
          onClick={onClick}
          className={blocked || isMisfit ? "btn" : "btn btn-primary"}
          disabled={blocked}
          style={{
            flex: 1,
            height: 48,
            minHeight: 44,
            // OUT OF STOCK: gray hard-disabled. MISFIT: outlined secondary
            // (matches desktop "ADD TO CART ANYWAY" treatment — clickable
            // but visually distinct from a clean primary CTA). FIT:
            // primary yellow.
            background: blocked
              ? "#3a3a3a"
              : isMisfit
                ? "transparent"
                : undefined,
            color: blocked
              ? "rgba(255,255,255,0.6)"
              : isMisfit
                ? "var(--color-foreground)"
                : undefined,
            borderColor: isMisfit ? "var(--color-border)" : undefined,
            cursor: blocked ? "not-allowed" : "pointer",
            fontWeight: 700,
          }}
        >
          {outOfStock
            ? "OUT OF STOCK"
            : isMisfit
              ? "ADD TO CART ANYWAY"
              : "ADD TO CART"}
        </button>
      </div>
    </div>
  );
}
