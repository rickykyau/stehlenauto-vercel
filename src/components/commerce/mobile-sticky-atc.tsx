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
export function MobileStickyAtc({
  product,
  needsSubModelPick = false,
}: {
  product: CatalogProduct;
  /**
   * Cycle 14AD (Mike-O14AD F-3 MAJOR): when the in-page buy-box is
   * blocked on a sub-model question (cab_type / bed_length not yet
   * answered), the sticky must mirror that blocked state. Previously
   * the sticky said "ADD TO CART" enabled while the main ATC said
   * "SELECT YOUR TRUCK'S CAB TYPE" disabled — tapping the sticky did
   * nothing silently. Pass true from the PDP when there are unanswered
   * required strips for this vehicle.
   */
  needsSubModelPick?: boolean;
}) {
  const [visible, setVisible] = useState(false);
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
          className={
            blocked || isMisfit || needsSubModelPick ? "btn" : "btn btn-primary"
          }
          disabled={blocked}
          style={{
            flex: 1,
            height: 48,
            minHeight: 44,
            // OUT OF STOCK: gray hard-disabled. SUB-MODEL GATED:
            // outlined-warning so the customer sees they need to scroll
            // up and answer something. MISFIT: outlined secondary. FIT:
            // primary yellow.
            background: blocked
              ? "#3a3a3a"
              : needsSubModelPick
                ? "rgba(245,168,35,0.12)"
                : isMisfit
                  ? "transparent"
                  : undefined,
            color: blocked
              ? "rgba(255,255,255,0.6)"
              : needsSubModelPick
                ? "var(--color-primary)"
                : isMisfit
                  ? "var(--color-foreground)"
                  : undefined,
            borderColor: needsSubModelPick
              ? "var(--color-primary)"
              : isMisfit
                ? "var(--color-border)"
                : undefined,
            cursor: blocked ? "not-allowed" : "pointer",
            fontWeight: 700,
            // Cycle 14AE (Mike-O14AE F-4 PARTIAL → PASS): the previous
            // `text-align: center` + ellipsis combo chops both ends of
            // the text on a too-narrow button — Mike saw "CK FITMENT
            // ABOVE" with no ellipsis marker. Use a smaller label set
            // that fits the 139px button on 390px viewports without
            // clipping at all. "PICK FITMENT" + arrow icon is enough
            // signal — the ABOVE arrow already implies the location.
            fontSize: 13,
            letterSpacing: "0.04em",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            paddingInline: 10,
          }}
        >
          {outOfStock
            ? "OUT OF STOCK"
            : needsSubModelPick
              ? "PICK FITMENT ↑"
              : isMisfit
                ? "ADD ANYWAY"
                : "ADD TO CART"}
        </button>
      </div>
    </div>
  );
}
