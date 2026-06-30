"use client";

import { useEffect, useState } from "react";
import type { CatalogProduct } from "@/lib/catalog/types";

const STICKY_HEIGHT_VAR = "--stehlen-sticky-atc-height";
const SUBMODEL_COOKIE = "stehlen_submodel";
const VEHICLE_COOKIE = "stehlen_vehicle";

function readCookieRaw(name: string): string | null {
  if (typeof document === "undefined") return null;
  const cookie = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`));
  return cookie ? cookie.slice(name.length + 1) : null;
}

/**
 * Cycle 14AR-fix17 (Ren R4 P1): cookie shape is
 * Record<vehicleId, Array<{group, value}>>, NOT Record<group, value>.
 * Look up the current vehicle's answers and project to a
 * {group: value} map so the caller can do `answers[g]` lookups.
 */
function readSubmodelAnswersForCurrentVehicle(): Record<string, string> {
  const vehicleRaw = readCookieRaw(VEHICLE_COOKIE);
  if (!vehicleRaw) return {};
  let vehicleId: string | null = null;
  try {
    const v = JSON.parse(decodeURIComponent(vehicleRaw));
    if (v && typeof v === "object" && typeof v.id === "string") {
      vehicleId = v.id;
    }
  } catch {
    return {};
  }
  if (!vehicleId) return {};
  const subRaw = readCookieRaw(SUBMODEL_COOKIE);
  if (!subRaw) return {};
  try {
    const parsed = JSON.parse(decodeURIComponent(subRaw)) as Record<
      string,
      Array<{ group: string; value: string }>
    >;
    const answers = parsed[vehicleId] ?? [];
    return Object.fromEntries(
      answers.filter((a) => a && a.group && a.value).map((a) => [a.group, a.value]),
    );
  } catch {
    return {};
  }
}

/**
 * Mobile-only fixed-bottom ATC bar.
 *
 * Hidden by default; appears once the user scrolls past the in-page buy-box
 * (so we don't double the affordance above the fold).
 *
 * Tapping it:
 *  - when the product is cleanly addable (in stock, fits, no unanswered
 *    sub-model question) → fires the REAL buy-box ATC button so it actually
 *    adds to cart + opens the drawer (Jordan F-2: a sticky "ADD TO CART" that
 *    only scrolls is a mobile conversion killer — email traffic is mostly
 *    mobile). We click the in-page button rather than re-implement the POST so
 *    all of its gating (bed-length mismatch, qty, analytics, cart-drawer open)
 *    stays in one place and can't drift.
 *  - when gated (needs sub-model pick / confirmed misfit / out of stock, or
 *    the real ATC is disabled for a reason this island can't see) → scrolls
 *    back to the buy-box so the customer sees the gate/warning in context.
 */
export function MobileStickyAtc({
  product,
  needsSubModelPick = false,
  requiredStripGroups = [],
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
  /**
   * Cycle 14AR-fix16 (Mike R3 F-1 MAJOR): server-computed needsSubModelPick
   * is frozen at SSR time. After the customer picks a bed-length chip in
   * BuyBox, router.refresh() doesn't always re-render this client island
   * with fresh props before they scroll past the fold. Sticky bar then
   * shows "PICK FITMENT ↑" while BuyBox's main ATC is correctly active.
   *
   * Pass the required-strip groups so the sticky can re-derive its
   * blocked state directly from the stehlen_submodel cookie + a
   * "stehlen:submodel:change" custom event dispatched by BuyBox.
   */
  requiredStripGroups?: string[];
}) {
  const [visible, setVisible] = useState(false);
  const [clientNeedsPick, setClientNeedsPick] = useState<boolean | null>(null);
  const isMisfit = product.fits === false;
  const outOfStock = product.inventory <= 0;
  const blocked = outOfStock;
  // Client-derived state wins after first read; SSR prop is the fallback for
  // initial paint before useEffect runs.
  const effectiveNeedsPick =
    clientNeedsPick !== null ? clientNeedsPick : needsSubModelPick;

  useEffect(() => {
    if (requiredStripGroups.length === 0) {
      setClientNeedsPick(false);
      return;
    }
    const recompute = () => {
      const answers = readSubmodelAnswersForCurrentVehicle();
      const allAnswered = requiredStripGroups.every((g) => !!answers[g]);
      setClientNeedsPick(!allAnswered);
    };
    recompute();
    const handler = () => recompute();
    window.addEventListener("stehlen:submodel:change", handler);
    return () => window.removeEventListener("stehlen:submodel:change", handler);
  }, [requiredStripGroups]);

  useEffect(() => {
    // Sticky must appear AFTER the customer scrolls PAST the in-page ATC
    // button — never while the button is still below the fold (they haven't
    // reached it yet, so a duplicate sticky ATC is just noise).
    //
    // Cycle 14BH (mobile CR teardown): this used an IntersectionObserver +
    // a `hasBeenSeen` flag, which only surfaced the sticky if the ATC button
    // passed THROUGH the viewport during a continuous scroll. An IO fires
    // only on threshold crossings, so an instant jump that skips the element
    // entirely — a momentum flick top→bottom, an in-page anchor link, or the
    // browser restoring scroll position on back-nav — never flipped the flag,
    // and the primary mobile buy affordance silently never appeared
    // (verified live: jump to page bottom left the bar aria-hidden).
    //
    // Replace it with a direct position read, rAF-throttled: show the sticky
    // exactly when the ATC button's bottom edge has passed above the viewport
    // top. Reading the live rect every frame is robust to ALL scroll types
    // (continuous, fast flick, and instant jump) and self-corrects when the
    // buy box grows (sub-model strips expanding shifts the anchor).
    const anchor =
      document.querySelector<HTMLElement>("[data-atc-anchor]") ??
      document.querySelector<HTMLElement>("[data-buy-box-anchor]");
    if (!anchor) {
      // No anchor found → show after a modest scroll as a safe fallback.
      const onScroll = () => setVisible(window.scrollY > 400);
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
      return () => window.removeEventListener("scroll", onScroll);
    }
    let raf = 0;
    const check = () => {
      raf = 0;
      // bottom <= 0 → the entire ATC button has scrolled above the viewport.
      setVisible(anchor.getBoundingClientRect().bottom <= 0);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    check(); // initial state (hidden at scrollY=0; button is below the fold)
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
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
    // Gated states (OOS / unanswered sub-model / confirmed misfit) must take
    // the customer to the in-page buy-box so they see the gate or red warning.
    const gated = blocked || isMisfit || effectiveNeedsPick;
    const atcBtn = document.querySelector<HTMLButtonElement>("[data-atc-anchor]");
    // Clean + the real ATC isn't disabled (covers buy-box-only blocks the
    // sticky can't see, e.g. bed-length mismatch) → fire the real add.
    if (!gated && atcBtn && !atcBtn.disabled) {
      atcBtn.click();
      return;
    }
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
        // Cycle 14BG (Jordan F-1): stack above the mobile bottom nav. The
        // nav (z-40) carries the safe-area inset, so this bar no longer
        // needs its own env() padding when the nav is present — the var
        // already includes it. Desktop fallback 0px keeps old behavior.
        bottom: "var(--stehlen-bottom-nav-height, 0px)",
        zIndex: 50,
        background: "var(--color-background)",
        borderTop: "1px solid var(--color-border)",
        padding: "10px 16px 10px",
        // Cycle 14BH (mobile CR teardown): the bar sits `bottom: nav-height`
        // (56px) above the viewport floor, so translateY(120%) of its own
        // ~69px height (≈83px) was NOT enough to clear the screen — a ~42px
        // sliver of the "hidden" bar (z-50) stayed painted over the bottom
        // nav (z-40), reading as a broken/colliding ATC on every PDP at rest.
        // Translate by its full height PLUS the bottom-nav offset (PLUS a
        // little slack) so the hidden bar fully leaves the viewport.
        transform: visible
          ? "translateY(0)"
          : "translateY(calc(100% + var(--stehlen-bottom-nav-height, 0px) + 24px))",
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
            {/* Cycle 14AZ-fix2 (Mike F-7): char-slice truncation cut
                mid-word — "Wrangler Adva…" left the customer guessing
                if it was "Advanced" or "Advantage." Truncate at the
                last word boundary inside the visible window so partial
                product-line names never confuse the buyer at ATC. */}
            {(() => {
              if (product.title.length <= 28) return product.title;
              const slice = product.title.slice(0, 28);
              const lastSpace = slice.lastIndexOf(" ");
              const safe =
                lastSpace > 14 ? slice.slice(0, lastSpace) : slice;
              return safe + "…";
            })()}
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
            blocked || isMisfit || effectiveNeedsPick ? "btn" : "btn btn-primary"
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
              : effectiveNeedsPick
                ? "rgba(245,168,35,0.12)"
                : isMisfit
                  ? "transparent"
                  : undefined,
            color: blocked
              ? "rgba(255,255,255,0.6)"
              : effectiveNeedsPick
                ? "var(--color-primary)"
                : isMisfit
                  ? "var(--color-foreground)"
                  : undefined,
            borderColor: effectiveNeedsPick
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
            : effectiveNeedsPick
              ? "PICK FITMENT ↑"
              : isMisfit
                ? "ADD ANYWAY"
                : "ADD TO CART"}
        </button>
      </div>
    </div>
  );
}
