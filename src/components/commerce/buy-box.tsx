"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icons } from "@/components/ui/icons";
import type { CatalogProduct } from "@/lib/catalog/types";
import type { Vehicle } from "@/components/ui/vehicle-pill";
import type { SubModelAnswer, SubModelGroup } from "@/lib/garage/types";
import { type SubModelStripConfig } from "@/lib/fitment/sub-model";
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

// Cycle 14X+ post-sync: extract numeric bed length from a chip option label
// like "5.5' BED" → "5.5", "6.5' BED" → "6.5", "8' BED" → "8". Falls back
// to the raw label if no number prefix is found.
function chipToBedLen(opt: string): string {
  const m = opt.match(/^(\d+(?:\.\d+)?)/);
  return m ? m[1] : opt;
}

type BedLengthSibling = {
  bedLength: string;
  handle: string;
  cbItemName: string;
};

type BedLengthSiblingsEntry = {
  currentBedLength: string;
  siblings: BedLengthSibling[];
} | null;

export function BuyBox({
  product,
  vehicle,
  initialAnswers = [],
  bedLengthSiblings = null,
  strips: stripsFromServer = [],
}: {
  product: CatalogProduct;
  vehicle?: Vehicle;
  initialAnswers?: SubModelAnswer[];
  /**
   * Cycle 14X+ post-sync (owner): when this product has CB-Item-Name
   * siblings that differ only in bed length, the BED LENGTH chip strip
   * becomes a real variant picker — clicking 5.5' BED on a 6.5' tonneau
   * navigates to TC-F15015-5.5-LRU. Hides options Stehlen doesn't stock
   * for this product family.
   */
  bedLengthSiblings?: BedLengthSiblingsEntry;
  /**
   * Cycle 14AQ (owner): strip configs are now built server-side from CA
   * fitment data (per-vehicle real options), not derived client-side from
   * a hardcoded option list. The server passes the relevant strips for
   * this product+vehicle. We still client-side filter by product title to
   * drop strips whose dimension isn't actually called out in the title
   * (cycle 14M behaviour preserved).
   */
  strips?: SubModelStripConfig[];
}) {
  // Cycle 14M (owner): drop any strip whose dimension isn't actually
  // mentioned in the product title — those products fit any value of that
  // dimension (e.g. a "Bull Guard - Ford F-150 Expedition" doesn't specify
  // trim), so asking the customer to pick is a confusing dead-end where
  // changing the chip never changes the SKU/price.
  const strips = stripsFromServer.filter((s) =>
    productMentionsGroup(s.group, product),
  );

  // Cycle 14AR-fix12 (owner-found): when bedLengthSiblings is NULL (no
  // entry in data/sibling_index.json — typical for product families
  // that exist in only ONE bed length, e.g. our HSS+TBL combo only
  // ships in 6'), but the product itself has a specific bed length
  // we can extract from the title (e.g. "6 ft Bed Tonneau Cover"),
  // synthesize a "virtual siblings" object with empty siblings list
  // and the product's actual bed as currentBedLength. The chip
  // rendering path then uniformly treats it as a variant picker:
  // the matching bed is active/enabled, every other bed is rendered
  // disabled with X overlay (no sibling target). This kills the
  // path where 5' chip looked enabled, click rewrote saved bed, ATC
  // ANYWAY added the wrong product.
  const effectiveBedLengthSiblings = (() => {
    if (bedLengthSiblings) return bedLengthSiblings;
    // Try to extract bed length from product title "6 ft Bed" / "5.5' Bed"
    const m = product.title?.match(
      /\b(\d+(?:\.\d+)?)\s*(?:ft|')\s*Bed\b/i,
    );
    if (!m) return null;
    return {
      currentBedLength: m[1],
      siblings: [] as BedLengthSibling[],
    };
  })();

  const [qty, setQty] = useState(1);
  // Pre-fill ONLY from real answers the customer already saved for this vehicle.
  // We deliberately do NOT seed s.options[0] — auto-defaulting silently passes
  // the fitment gate for unaware customers (parts P0-1, jordan F-2).
  const [picks, setPicks] = useState<Partial<Record<SubModelGroup, string>>>(() => {
    const init: Partial<Record<SubModelGroup, string>> = {};
    for (const s of strips) {
      const saved = initialAnswers.find((a) => a.group === s.group)?.value;
      if (saved) {
        init[s.group] = saved;
        continue;
      }
      // Cycle 14AR-fix6 (Jordan F-4): when a strip has exactly ONE option
      // (e.g., a 6.5'-bed-only product whose chip strip lists only "6.5'
      // BED"), there is no choice for the customer to make — auto-pick
      // the only option so ATC is enabled immediately. Forcing the
      // customer to manually tap the lone chip just to unlock Add to
      // Cart is friction with no value. Multi-option strips still
      // require a manual pick (no silent defaulting), preserving the
      // P0-1 / F-2 guard against false-fitment claims.
      if (s.options.length === 1) {
        init[s.group] = s.options[0];
      }
    }
    return init;
  });
  const [adding, setAdding] = useState(false);
  const [persistError, setPersistError] = useState<string | null>(null);
  const router = useRouter();

  const missingStrips = strips.filter((s) => !picks[s.group]);
  // Cycle 5 (Mike): if the part is positively confirmed NOT to fit the
  // customer's vehicle, surface a clear warning. Originally hard-disabled
  // the ATC, but cycle 14X+ (owner): real customers buy parts as gifts,
  // for friends, for second vehicles not in the garage, or just to have
  // on hand. Disabling ATC on misfit blocks legitimate revenue. Stehlen's
  // 30-day fitment guarantee bounds the worst case. Warn loudly (red card
  // + reason copy + warehouse note + button label change) but allow the
  // override.
  const explicitMisfit = product.fits === false;
  // Cycle 14Z (Mike-O2 N-1 BLOCKER): out-of-stock products had no guard —
  // tapping ADD TO CART added a qty=0 / $0 ghost line item that polluted
  // the cart through checkout. Block the ATC when inventory is 0.
  const outOfStock = product.inventory <= 0;

  // Cycle 14AR-fix12 (owner-found): bed-length mismatch is a HARD block.
  // The "ADD TO CART ANYWAY" affordance was designed for make/model
  // mismatches (gift purchases, second vehicles not in the garage). It
  // does NOT apply to bed-length mismatch — a 6' tonneau on a 5' bed
  // is physically useless, no "anyway" justifies it. Owner reported
  // adding a 6' tonneau to cart with a 5' saved bed via "ADD TO CART
  // ANYWAY" — that path returns or trust-eroding rage. Detect bed
  // mismatch by comparing the picked bed to the product's title-derived
  // bed length, or by reading product.fitmentTable.subattributes.bedLengths
  // and comparing to the customer's bed pick. If mismatch → disable ATC.
  const bedPick = picks.bed_length ? chipToBedLen(picks.bed_length) : null;
  const productBedLengths =
    product.fitmentTable?.subattributes?.bedLengths
      ?.map((b) => chipToBedLen(b))
      ?.filter(Boolean) ?? [];
  // Title-derived bed length as fallback when metafield is empty
  const titleBedMatch = product.title?.match(
    /\b(\d+(?:\.\d+)?)\s*(?:ft|')\s*Bed\b/i,
  );
  const titleBedLength = titleBedMatch ? titleBedMatch[1] : null;
  const productBeds = productBedLengths.length > 0
    ? productBedLengths
    : titleBedLength ? [titleBedLength] : [];
  const bedMismatch =
    bedPick !== null &&
    productBeds.length > 0 &&
    !productBeds.includes(bedPick);

  const canAdd =
    missingStrips.length === 0 && !outOfStock && !bedMismatch;
  const blockedCopy =
    outOfStock
      ? "OUT OF STOCK"
      : bedMismatch
        ? `WRONG BED LENGTH FOR YOUR VEHICLE`
        : missingStrips.length > 0
          ? `SELECT ${missingStrips[0].label}`
          : null;
  // Misfit no longer blocks make/model; bed mismatch DOES block.
  const addCtaLabel =
    explicitMisfit && !bedMismatch ? "ADD TO CART ANYWAY" : "ADD TO CART";

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
    // Cycle 14AR-fix16 (Mike R3 F-1 MAJOR): notify MobileStickyAtc that
    // sub-model state changed so it can re-derive blocked state from the
    // cookie immediately, without waiting for router.refresh() to re-stream
    // server props to the client island.
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("stehlen:submodel:change"));
    }
  };

  const onAdd = async (opts?: { redirectToCheckout?: boolean }) => {
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
      // Cycle 14X+ post-sync (Sam re-review M-4): "BUY NOW WITH AFFIRM"
      // skips the cart drawer and goes straight to Shopify checkout, where
      // Affirm is one of the payment methods. Plain ATC opens the drawer
      // as before.
      const checkoutUrl = okData?.cart?.checkoutUrl as string | undefined;
      if (opts?.redirectToCheckout && checkoutUrl) {
        window.location.href = checkoutUrl;
        return;
      }
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
                  Your vehicle:{" "}
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
            // Cycle 14X+ post-sync (Mike-O14 F-1 MAJOR): the conflict
            // detection compared raw strings ("5.5'BED" vs "5.5FTBED")
            // and never matched even when the values were equivalent.
            // Result: the contradiction callout fired on MATCHING
            // products — telling a 5.5'-bed customer their saved spec
            // "doesn't match" a 5.5'-bed cover that the green CONFIRMED
            // card just confirmed. Fix: compare on the normalized number
            // for bed_length; whitespace-stripped string for cab_type.
            const normalizeBedLen = (v: string): string | null => {
              const m = v.match(/(\d+(?:\.\d+)?)/);
              return m ? m[1] : null;
            };
            // Cycle 14AF (Mike-O14AF NF-3 BLOCKER): industry-standard
            // bed buckets — 5.5/5.7/5.8 ft are all "short bed" (5.5–5.9),
            // 6.4/6.5/6.6/6.8 are all "standard bed" (6.0–6.9). The fitment
            // engine in match.ts already uses these buckets for green
            // CONFIRMED FITMENT. Use the SAME bucket here so the warning
            // text doesn't contradict the badge: a 6.5'-saved customer
            // looking at a 6.6'-bed product was seeing both green
            // CONFIRMED FITMENT AND a red "doesn't match" warning at
            // once. Same bucket = no warning.
            const bedBucket = (ft: number): string => {
              if (!Number.isFinite(ft)) return String(ft);
              if (ft >= 7.5) return "long";
              if (ft >= 6.0) return "standard";
              if (ft >= 5.5) return "short";
              if (ft >= 4.5) return "compact";
              return String(ft);
            };
            const conflict = (() => {
              if (!saved || !productSpec) return false;
              if (s.group === "bed_length") {
                const a = normalizeBedLen(saved);
                const b = normalizeBedLen(productSpec);
                if (!a || !b) return false;
                return bedBucket(parseFloat(a)) !== bedBucket(parseFloat(b));
              }
              return (
                saved.toUpperCase().replace(/\s+/g, "") !==
                productSpec.toUpperCase().replace(/\s+/g, "")
              );
            })();
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
                    Your saved {friendlyType}: {saved}
                  </strong>{" "}
                  doesn&apos;t match this product (this one fits{" "}
                  <strong>{productSpec} {friendlyType}</strong>).{" "}
                  {bedLengthSiblings && s.group === "bed_length" ? (
                    <>
                      Use the chips below to switch to the matching product
                      for your vehicle, or tap <strong>ADD TO CART ANYWAY</strong>{" "}
                      if you&apos;re buying for a different vehicle.
                    </>
                  ) : (
                    <>
                      If your vehicle actually has a {productSpec}{" "}
                      {friendlyType}, this is the right product — your saved
                      spec will update on add-to-cart. Otherwise, tap{" "}
                      <strong>ADD TO CART ANYWAY</strong> if you&apos;re
                      buying for a different vehicle.
                    </>
                  )}
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
                your vehicle, not the cover.
              </div>
            );
          })()}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {(() => {
              // Cycle 14X+ post-sync (owner): when this is the bed_length
              // strip AND we have sibling products that differ only in bed
              // length, the chips become a real product variant picker.
              // Click a non-current chip → navigate to the sibling's PDP
              // (CB Item Name + price + media all update because it's a
              // different product).
              //
              // Cycle 14AR-fix12 (owner-found): for bed-length-specific
              // products WITHOUT a sibling for some bed lengths (e.g. our
              // HSS+TBL combo only ships in 6' — no 5' variant), DON'T
              // hide the 5' chip. Instead show it Amazon-style: visible
              // but DISABLED with a strikethrough so the customer knows
              // (a) the catalog doesn't carry a 5' version of this
              // product, and (b) clicking it does NOT silently change
              // their saved bed length. Previous behavior: 5' chip
              // looked enabled, click rewrote saved bed to 5', product
              // now misfits, ATC offered "ADD TO CART ANYWAY" — owner
              // bought wrong-bed cover. That path is dead now.
              const isBedStrip = s.group === "bed_length";
              const isBedStripWithSiblings = isBedStrip && effectiveBedLengthSiblings;
              return s.options.map((opt) => {
                const active = picks[s.group] === opt;
                if (isBedStripWithSiblings) {
                  const bed = chipToBedLen(opt);
                  const isCurrent =
                    bed === effectiveBedLengthSiblings!.currentBedLength;
                  if (isCurrent) {
                    // Cycle 14AC (Mike-O14AC NW-1 BLOCKER): when this is
                    // a single-bed-option product (no siblings to
                    // navigate to), the only chip rendered is the
                    // current one — and it was hard-disabled. The
                    // customer couldn't persist their bed answer, so
                    // ATC stayed at "SELECT YOUR TRUCK'S BED LENGTH"
                    // forever. Make it clickable + use onPick so the
                    // answer flows to the garage and ATC unblocks.
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
                            ? "var(--color-primary)"
                            : "var(--color-surface-2)",
                          color: active
                            ? "var(--color-primary-foreground, #0a0a0a)"
                            : "var(--color-foreground)",
                          borderColor: "var(--color-primary)",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        {active ? `✓ ${opt}` : opt}
                      </button>
                    );
                  }
                  const target = effectiveBedLengthSiblings!.siblings.find(
                    (sib) => sib.bedLength === bed,
                  );
                  if (!target) {
                    // Cycle 14AR-fix12 (owner-found): no sibling product
                    // exists for THIS bed length in this product family.
                    // Render Amazon-style: chip visible but disabled with
                    // strike-through. Tooltip explains why. Click does
                    // nothing — critically, does NOT rewrite the saved
                    // bed length (which was the bug owner reported).
                    return (
                      <button
                        key={opt}
                        type="button"
                        disabled
                        title={`No ${opt} variant of this product — we don't carry it in this size yet`}
                        className="btn btn-sm"
                        style={{
                          flex: "1 1 0",
                          background: "var(--color-surface)",
                          color: "var(--color-muted-2)",
                          borderColor: "var(--color-border)",
                          textAlign: "center",
                          cursor: "not-allowed",
                          textDecoration: "line-through",
                          opacity: 0.55,
                          position: "relative",
                        }}
                      >
                        <span aria-hidden style={{ marginRight: 4 }}>✕</span>
                        {opt}
                      </button>
                    );
                  }
                  // Cycle 14X+ post-sync (Sam re-review HIGH): chip-link
                  // navigation used to fire a plain <Link> with no
                  // sub-model persist. The destination PDP would then
                  // render the YELLOW "ONE STEP TO CONFIRM" banner
                  // because the customer's `bed_length` answer was never
                  // saved to the garage. Customer would land in a
                  // dead-end (the destination chip is disabled, so they
                  // can't tap it to update). Fix: persist bed_length on
                  // click, THEN navigate. Fire-and-forget; the SSR on
                  // the destination reads the cookie, which the persist
                  // updates synchronously enough for the next request.
                  return (
                    <button
                      key={opt}
                      type="button"
                      className="btn btn-sm"
                      onClick={(e) => {
                        e.preventDefault();
                        // Cycle 14AE (owner): variant chip wasn't
                        // navigating. The previous version awaited
                        // persist() which calls router.refresh() — that
                        // re-renders the React tree mid-click and can
                        // race / cancel the synchronous window.location
                        // assignment that follows. Fix: send the persist
                        // as fire-and-forget (no await, no router.refresh
                        // dependency), then navigate immediately. The
                        // destination page reads the cookie SSR-side,
                        // and the in-flight POST settles in the
                        // background; the browser doesn't cancel it
                        // because we're navigating to the same origin.
                        const handle = target.handle;
                        if (vehicle?.id) {
                          // Don't await; don't catch; let it fly.
                          fetch("/api/sub-model", {
                            method: "POST",
                            headers: { "content-type": "application/json" },
                            body: JSON.stringify({
                              vehicleId: vehicle.id,
                              answers: [{ group: "bed_length", value: opt }],
                            }),
                            keepalive: true,
                          }).catch(() => {});
                        }
                        window.location.href = `/products/${handle}`;
                      }}
                      style={{
                        flex: "1 1 0",
                        background: "transparent",
                        color: "var(--color-foreground)",
                        borderColor: "var(--color-border)",
                        textAlign: "center",
                        cursor: "pointer",
                      }}
                    >
                      {opt}
                    </button>
                  );
                }
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
              });
            })()}
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
          onClick={() => onAdd()}
          disabled={adding || !canAdd}
          // Cycle 14X+ (owner): misfit no longer disables the button —
          // gift purchases / multi-vehicle households / friend-of-friend
          // buying are all real. Style the misfit-allow button as a
          // SECONDARY (outlined) CTA instead of the primary yellow so
          // the visual still differs from a clean "fits your truck" ATC.
          // The "ADD TO CART ANYWAY" label + red card above carry the
          // warning. Real disable is reserved for OOS + missing-strip.
          className={explicitMisfit ? "btn btn-lg" : "btn btn-primary btn-lg"}
          style={{
            flex: 1,
            opacity: !canAdd ? 0.6 : 1,
            background: explicitMisfit ? "transparent" : undefined,
            color: explicitMisfit ? "var(--color-foreground)" : undefined,
            borderColor: explicitMisfit
              ? "var(--color-border)"
              : undefined,
            cursor: !canAdd ? "not-allowed" : "pointer",
          }}
        >
          {adding
            ? "ADDING…"
            : blockedCopy
              ? blockedCopy
              : `${addCtaLabel} · $${(product.price * qty).toFixed(2)}`}
        </button>
        <WishlistButton
          product={product}
          className="btn btn-lg buy-box-wishlist"
          style={{ width: 56 }}
        />
      </div>
      {/* Cycle 14c (Mike-3 F-5): used to stay enabled on confirmed-misfit
          PDPs — customer could Affirm-finance a non-fitting part. Gate it
          on the same canAdd flag the primary ATC uses.
          Cycle 14X+ post-sync (Sam re-review M-4): button had no onClick,
          dead UI on every PDP. Wired to ATC + auto-redirect to Shopify
          hosted checkout where Affirm is a payment method. */}
      <button
        type="button"
        onClick={() => onAdd({ redirectToCheckout: true })}
        disabled={adding || !canAdd}
        className="btn btn-block"
        style={{
          background: "transparent",
          borderColor: "var(--color-border-2)",
          opacity: !canAdd ? 0.5 : 1,
          cursor: !canAdd ? "not-allowed" : "pointer",
        }}
      >
        {adding ? "ADDING…" : "BUY NOW WITH AFFIRM"}
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
