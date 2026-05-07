"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icons } from "@/components/ui/icons";
import type { CatalogProduct } from "@/lib/catalog/types";
import type { Vehicle } from "@/components/ui/vehicle-pill";
import type { SubModelAnswer, SubModelGroup } from "@/lib/garage/types";
import {
  stripsForCategory,
  type SubModelStripConfig,
} from "@/lib/fitment/sub-model";
import { track } from "@/lib/analytics/client";
import { WishlistButton } from "./wishlist-button";

/**
 * Cycle 14M (owner): only show a sub-model strip when the product title
 * actually mentions the dimension. Otherwise the customer sees chips that
 * look like product variants but produce no visible change (the product is
 * trim/cab/bed-universal). For bull guards titled "Bull Guard Texture Black -
 * Ford F-150 Expedition" with no trim keyword, the trim strip shouldn't
 * render — it's not gating anything and just confuses customers into thinking
 * they're picking a SKU variant.
 */
function productMentionsGroup(
  group: SubModelGroup,
  product: { title?: string; fitTitle?: string; vehicleTags?: string[] },
): boolean {
  const text = [
    product.title ?? "",
    product.fitTitle ?? "",
    ...(product.vehicleTags ?? []),
  ]
    .join(" ")
    .toLowerCase();
  if (group === "bed_length") {
    return /\d+(?:\.\d+)?\s*(?:ft|'|foot|feet)\s*bed/i.test(text);
  }
  if (group === "cab_type") {
    return /(super\s?crew|super\s?cab|crew\s?cab|quad\s?cab|extended\s?cab|double\s?cab|regular\s?cab|mega\s?cab|access\s?cab)/i.test(
      text,
    );
  }
  if (group === "trim") {
    return /\b(base|mid|heavy[-\s]?duty|sport|limited|lariat|raptor|trd|sr5|tradesman|bighorn|laramie|denali|platinum|king\s?ranch|rebel|trailhawk|rubicon|sahara)\b/i.test(
      text,
    );
  }
  if (group === "doors") {
    return /(2[-\s]?door|4[-\s]?door|two[-\s]?door|four[-\s]?door)/i.test(
      text,
    );
  }
  return true;
}

// (Cycle 1 removed the auto-default; valueOf helper no longer needed.)

export function BuyBox({
  product,
  vehicle,
  initialAnswers = [],
}: {
  product: CatalogProduct;
  vehicle?: Vehicle;
  initialAnswers?: SubModelAnswer[];
}) {
  // Cycle 14f (Mike-6 MAJOR F-8): stripsForCategory is keyed on the Shopify
  // collection handle (e.g. "tonneau-covers"), not product.category (the
  // lowercased productType). Prefer categoryHandle.
  // Cycle 14M (owner): then drop any strip whose dimension isn't actually
  // mentioned in the product title — those products fit any value of that
  // dimension (e.g. a "Bull Guard - Ford F-150 Expedition" doesn't specify
  // trim), so asking the customer to pick is a confusing dead-end where
  // changing the chip never changes the SKU/price.
  const allStrips = stripsForCategory(product.categoryHandle ?? product.category);
  const strips = allStrips.filter((s) => productMentionsGroup(s.group, product));
  const [qty, setQty] = useState(1);
  // Pre-fill ONLY from real answers the customer already saved for this vehicle.
  // We deliberately do NOT seed s.options[0] — auto-defaulting silently passes
  // the fitment gate for unaware customers (parts P0-1, jordan F-2).
  const [picks, setPicks] = useState<Partial<Record<SubModelGroup, string>>>(() => {
    const init: Partial<Record<SubModelGroup, string>> = {};
    for (const s of strips) {
      const saved = initialAnswers.find((a) => a.group === s.group)?.value;
      if (saved) init[s.group] = saved;
    }
    return init;
  });
  const [adding, setAdding] = useState(false);
  const [persistError, setPersistError] = useState<string | null>(null);
  const router = useRouter();

  const missingStrips = strips.filter((s) => !picks[s.group]);
  // Cycle 5 (Mike): if the part is positively confirmed NOT to fit the
  // customer's vehicle, do NOT let them add it to cart. Banner above shouts
  // "DOES NOT FIT" — the button below it cannot still say ADD TO CART.
  const explicitMisfit = product.fits === false;
  // Cycle 14Z (Mike-O2 N-1 BLOCKER): out-of-stock products had no guard —
  // tapping ADD TO CART added a qty=0 / $0 ghost line item that polluted
  // the cart through checkout. Block the ATC when inventory is 0.
  const outOfStock = product.inventory <= 0;
  const canAdd = missingStrips.length === 0 && !explicitMisfit && !outOfStock;
  const blockedCopy =
    outOfStock
      ? "OUT OF STOCK"
      : explicitMisfit
        ? "DOES NOT FIT YOUR VEHICLE"
        : missingStrips.length > 0
          ? `SELECT ${missingStrips[0].label}`
          : null;

  const persist = async (group: SubModelGroup, value: string) => {
    if (!vehicle?.id) return;
    try {
      await fetch("/api/sub-model", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          vehicleId: vehicle.id,
          answers: [{ group, value }],
        }),
      });
      // Cycle 14h (Mike-8 BLOCKER F-13): the page-level fitment box was
      // server-rendered against the cookie at request time, so picking a
      // bed-length chip persisted to the cookie but the YELLOW "ONE STEP TO
      // CONFIRM" banner stayed put until a hard reload. Refresh the server
      // tree so the box flips to GREEN "CONFIRMED FITMENT" immediately.
      router.refresh();
    } catch (err) {
      setPersistError(err instanceof Error ? err.message : "save failed");
    }
  };

  const onPick = (group: SubModelGroup, value: string) => {
    setPicks((p) => ({ ...p, [group]: value }));
    void persist(group, value);
  };

  const onAdd = async () => {
    setAdding(true);
    setPersistError(null);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          handle: product.handle,
          sku: product.sku,
          quantity: qty,
          options: picks,
        }),
      });
      if (!res.ok) {
        // Surface a real customer-facing message, not a silent failure that
        // optimistically opens an empty drawer (Jordan F-3, F-31; Marcus #2).
        // Always prefer the friendly fallback over the raw API string —
        // "No purchasable variant found for stehlen-..." means nothing to a
        // customer.
        await res.json().catch(() => null); // drain body
        const message =
          res.status === 422
            ? "This part isn't currently available for your vehicle. Browse universal-fit accessories or change your vehicle to see what fits."
            : res.status === 409
              ? "This product is currently out of stock."
              : res.status === 503
                ? "Our cart is briefly unavailable. Try again in a moment."
                : `Something went wrong adding to cart (HTTP ${res.status}). Try again or call 1-888-378-4536.`;
        throw new Error(message);
      }
      const okData = await res.json().catch(() => null);
      track("add_to_cart", {
        currency: "USD",
        value: product.price * qty,
        items: [
          {
            item_id: product.sku,
            item_name: product.title,
            item_brand: "Stehlen",
            item_category: product.category,
            price: product.price,
            quantity: qty,
          },
        ],
      });
      window.dispatchEvent(new CustomEvent("stehlen:cart:open"));
      // Cycle 14R + 14Z (Mike-O3 N-7): emit live event for the header
      // CartBadgeLive client component so the count updates instantly
      // without waiting for a layout re-render.
      const newCount =
        (okData?.cart?.totalQuantity as number | undefined) ?? undefined;
      if (typeof newCount === "number") {
        window.dispatchEvent(
          new CustomEvent("stehlen:cart:updated", { detail: { count: newCount } }),
        );
      }
      router.refresh();
    } catch (err) {
      setPersistError(err instanceof Error ? err.message : "add failed");
    } finally {
      setAdding(false);
    }
  };

  // Cycle 14L (owner phone test): on single-spec products (e.g. "6.5 ft Bed
  // Tonneau Cover") the chip strip looked like a variant picker. Surface a
  // clear callout with the product's REQUIRED spec so the customer knows
  // before tapping that they're declaring their truck's bed length, not
  // picking a variant.
  const productBedLength = (() => {
    const m = (product.title || "").match(
      /(\d+(?:\.\d+)?)\s*(?:ft|'|foot|feet)\s*bed/i,
    );
    return m ? `${m[1]} FT` : null;
  })();
  const productCabType = (() => {
    const m = (product.title || "").match(
      /(super\s?crew|super\s?cab|crew\s?cab|quad\s?cab|extended\s?cab|double\s?cab|regular\s?cab|mega\s?cab|access\s?cab)/i,
    );
    return m ? m[1].toUpperCase() : null;
  })();

  return (
    <div>
      {strips.map((s: SubModelStripConfig) => {
        const productSpec =
          s.group === "bed_length"
            ? productBedLength
            : s.group === "cab_type"
              ? productCabType
              : null;
        return (
        <div key={s.group} style={{ marginBottom: 16 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <span className="label-eyebrow" style={{ marginBottom: 0 }}>
              {s.label}
            </span>
            <span style={{ fontSize: 12, color: "var(--color-muted)" }}>
              {picks[s.group] ? (
                <>
                  Your truck:{" "}
                  <strong style={{ color: "var(--color-foreground)" }}>
                    {picks[s.group]}
                  </strong>
                </>
              ) : (
                <span style={{ color: "var(--color-primary)" }}>
                  Pick yours
                </span>
              )}
            </span>
          </div>
          {productSpec && (() => {
            // Cycle 14L (owner): clarify when the saved truck spec
            // disagrees with the product's required spec. The saved chip
            // looks like a variant default to the customer (we picked 5.5
            // last time for them, this 6.5-only product trips DOES NOT FIT
            // and they're confused about why a chip is "selected" without
            // them choosing). Explain in plain English.
            const saved = picks[s.group] || initialAnswers.find((a) => a.group === s.group)?.value;
            const conflict =
              !!saved &&
              productSpec &&
              saved.toUpperCase().replace(/\s+/g, "") !==
                productSpec.toUpperCase().replace(/\s+/g, "") + "BED";
            const friendlyType = s.group === "bed_length" ? "bed" : "cab";
            if (conflict) {
              return (
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--color-foreground)",
                    marginBottom: 8,
                    padding: "10px 12px",
                    background: "rgba(239,68,68,0.06)",
                    border: "1px solid rgba(239,68,68,0.45)",
                    borderRadius: "var(--radius-sm)",
                    lineHeight: 1.5,
                  }}
                >
                  <strong style={{ color: "var(--color-destructive)" }}>
                    Why is {saved} highlighted?
                  </strong>{" "}
                  We saved that as your truck&apos;s {friendlyType} from a
                  previous product — the chip is your truck&apos;s spec, not a
                  variant of this cover. <strong>This cover only fits a{" "}
                  {productSpec} {friendlyType}.</strong> If your truck
                  actually has a {productSpec} {friendlyType}, tap{" "}
                  <strong>{productSpec} {friendlyType.toUpperCase()}</strong>{" "}
                  below to update.
                </div>
              );
            }
            return (
              <div
                style={{
                  fontSize: 12,
                  color: "var(--color-muted)",
                  marginBottom: 8,
                  padding: "8px 10px",
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-sm)",
                  lineHeight: 1.45,
                }}
              >
                <strong style={{ color: "var(--color-foreground)" }}>
                  This product is engineered for a {productSpec} {friendlyType}.
                </strong>{" "}
                Pick yours so we can verify it fits — the chip is asking about
                your truck, not the cover.
              </div>
            );
          })()}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {s.options.map((opt) => {
              const active = picks[s.group] === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => onPick(s.group, opt)}
                  aria-pressed={active}
                  className="btn btn-sm"
                  style={{
                    flex: "1 1 0",
                    background: active
                      ? "var(--color-foreground)"
                      : "transparent",
                    color: active
                      ? "var(--color-background)"
                      : "var(--color-foreground)",
                    borderColor: active
                      ? "var(--color-foreground)"
                      : "var(--color-border)",
                  }}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
        );
      })}

      {strips.length === 0 &&
        product.fits === true &&
        // Cycle 14X+ post-sync (Jordan F-7 / Mike Product 1): suppress
        // UNIVERSAL FIT when the metafield says the product DOES have
        // bed/cab/box restrictions. Showing "UNIVERSAL FIT" alongside a
        // warehouse note "Will Fit Crew Cab Models Only" was a direct
        // contradiction that destroyed buyer confidence.
        !(
          product.fitmentTable?.subattributes?.bedLengths?.length ||
          product.fitmentTable?.subattributes?.cabTypes?.length ||
          product.fitmentTable?.subattributes?.boxOptions?.length ||
          product.fitmentTable?.subattributes?.engineExclusions?.length
        ) && (
        // Only render the "UNIVERSAL FIT" reassurance when we're confident.
        // Mike F-23 caught this: showing it on every strip-less PDP made the
        // honest "Check Fitment" ribbon above contradict the chip below.
        <div
          style={{
            marginBottom: 16,
            padding: 10,
            background: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-sm)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Icons.shield size={14} />
          <span
            className="mono"
            style={{
              fontSize: 11,
              letterSpacing: "0.08em",
              color: "var(--color-muted)",
            }}
          >
            UNIVERSAL FIT · NO SUB-MODEL CONFIG
          </span>
        </div>
      )}

      {/* Qty + Add — Cycle 11 (owner mobile QA): the row used to be `[qty
          96px][ATC flex:1][wishlist 56px]` which left only ~170px for ATC at
          375px viewport, causing "ADD TO CART · $178.00" to clip. Mobile now
          stacks: qty + ATC on row 1 (ATC fills), wishlist drops below. */}
      <div className="buy-box-row" style={{ marginBottom: 12 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            height: 56,
          }}
        >
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            aria-label="Decrease quantity"
            style={qtyBtn}
          >
            <Icons.minus size={14} />
          </button>
          <span
            className="mono"
            style={{ width: 36, textAlign: "center", fontSize: 14 }}
            aria-live="polite"
          >
            {qty}
          </span>
          <button
            type="button"
            onClick={() => setQty((q) => q + 1)}
            aria-label="Increase quantity"
            style={qtyBtn}
          >
            <Icons.plus size={14} />
          </button>
        </div>
        <button
          type="button"
          onClick={onAdd}
          disabled={adding || !canAdd}
          // Cycle 14d (Mike-4 MAJOR): disabled state used to stay brand
          // yellow at opacity 0.6 — customers misread it as a tappable
          // primary CTA. Switched to a flat grey-disabled when explicitly
          // misfit so the visual matches the red "DOES NOT FIT" banner.
          className={explicitMisfit ? "btn btn-lg" : "btn btn-primary btn-lg"}
          style={{
            flex: 1,
            opacity: explicitMisfit ? 1 : !canAdd ? 0.6 : 1,
            background: explicitMisfit ? "#3a3a3a" : undefined,
            color: explicitMisfit ? "rgba(255,255,255,0.7)" : undefined,
            borderColor: explicitMisfit ? "#3a3a3a" : undefined,
            cursor: !canAdd ? "not-allowed" : "pointer",
          }}
        >
          {adding
            ? "ADDING…"
            : blockedCopy
              ? blockedCopy
              : `ADD TO CART · $${(product.price * qty).toFixed(2)}`}
        </button>
        <WishlistButton
          product={product}
          className="btn btn-lg buy-box-wishlist"
          style={{ width: 56 }}
        />
      </div>
      {/* Cycle 14c (Mike-3 F-5): used to stay enabled on confirmed-misfit
          PDPs — customer could Affirm-finance a non-fitting part. Gate it
          on the same canAdd flag the primary ATC uses. */}
      <button
        type="button"
        className="btn btn-block"
        disabled={!canAdd}
        style={{
          background: "transparent",
          borderColor: "var(--color-border-2)",
          opacity: !canAdd ? 0.5 : 1,
          cursor: !canAdd ? "not-allowed" : "pointer",
        }}
      >
        BUY NOW WITH AFFIRM
      </button>

      {persistError && (
        <div
          role="alert"
          style={{
            marginTop: 12,
            padding: 12,
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.4)",
            borderRadius: "var(--radius-sm)",
            fontSize: 13,
            color: "var(--color-foreground)",
            lineHeight: 1.5,
          }}
        >
          <strong style={{ color: "var(--color-destructive)" }}>
            Heads up —
          </strong>{" "}
          {persistError}
        </div>
      )}

      {/* Cycle 4 (Mike F-18): only claim "CONFIGURED FOR" when fitment is
          positively confirmed. Otherwise this caption stacks under the
          "haven't verified" hero and contradicts itself on the same screen. */}
      {vehicle && product.fits === true && (
        <p
          className="mono"
          style={{
            marginTop: 12,
            fontSize: 11,
            color: "var(--color-muted)",
            letterSpacing: "0.08em",
          }}
        >
          CONFIGURED FOR {vehicle.year} {vehicle.make.toUpperCase()}{" "}
          {vehicle.model.toUpperCase()}
        </p>
      )}
    </div>
  );
}

const qtyBtn: React.CSSProperties = {
  width: 44,
  height: "100%",
  background: "transparent",
  border: 0,
  color: "var(--color-foreground)",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
