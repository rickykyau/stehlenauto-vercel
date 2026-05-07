"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { Icons } from "@/components/ui/icons";
import type { Cart } from "@/lib/cart/types";
import type { Vehicle } from "@/components/ui/vehicle-pill";
import { checkFitment } from "@/lib/fitment/match";
import type { SubModelAnswer } from "@/lib/garage/types";

export function CartPageClient({
  initialCart,
  vehicle,
  subModelAnswers = [],
}: {
  initialCart: Cart | null;
  vehicle?: Vehicle;
  subModelAnswers?: SubModelAnswer[];
}) {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(initialCart);
  const [busy, setBusy] = useState(false);
  const [promo, setPromo] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);

  // Cycle-1 fix (Jordan, Marcus #4): cart used to accept any non-empty string
  // as a 10% code. Whitelist real codes here; checkout still authoritatively
  // validates via Shopify discount engine.
  const VALID_PROMOS = new Set(["WELCOME10"]);

  const tryApplyPromo = () => {
    setPromoError(null);
    if (VALID_PROMOS.has(promo.trim().toUpperCase())) {
      setPromoApplied(true);
    } else {
      setPromoApplied(false);
      setPromoError("That code isn't valid. Check your email for the latest promo.");
    }
  };

  const reload = useCallback(async () => {
    const res = await fetch("/api/cart");
    const data = (await res.json()) as { cart: Cart | null };
    setCart(data.cart);
  }, []);

  const updateQty = async (lineId: string, quantity: number) => {
    setBusy(true);
    try {
      await fetch("/api/cart", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lineId, quantity }),
      });
      await reload();
    } finally {
      setBusy(false);
    }
  };

  const removeLine = async (lineId: string) => {
    setBusy(true);
    try {
      const r = await fetch("/api/cart", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lineId }),
      });
      const data = await r.json().catch(() => null);
      await reload();
      // Cycle 14Z: emit live event for header badge.
      const newCount = (data?.cart?.totalQuantity as number | undefined) ?? 0;
      window.dispatchEvent(
        new CustomEvent("stehlen:cart:updated", { detail: { count: newCount } }),
      );
    } finally {
      setBusy(false);
    }
  };

  // Cycle 14Z (Mike-O1 M-1): one-tap empty-cart escape hatch. Forgets the
  // Shopify cart cookie so the next add creates a fresh cart, recovering
  // from a stale shared cart that survived a cookie wipe.
  // Cycle 14Z batch 2 (Mike-O2 N-4): replaced the native window.confirm()
  // with inline two-state UI — the EMPTY CART button switches to "TAP
  // AGAIN TO CONFIRM" for 4s. No native dialog blocking the page.
  const [emptyConfirm, setEmptyConfirm] = useState(false);
  const emptyCart = async () => {
    if (!emptyConfirm) {
      setEmptyConfirm(true);
      setTimeout(() => setEmptyConfirm(false), 4000);
      return;
    }
    setBusy(true);
    setEmptyConfirm(false);
    try {
      await fetch("/api/cart", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lineId: "all" }),
      });
      await reload();
      // Cycle 14Z (Mike-O2 N-7 + Mike-O3 follow-up): router.refresh wasn't
      // enough on /cart — the SSR layout didn't repaint the badge.
      // Live event lets the CartBadgeLive client component patch
      // instantly without nav.
      window.dispatchEvent(
        new CustomEvent("stehlen:cart:updated", { detail: { count: 0 } }),
      );
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const lines = cart?.lines ?? [];
  const subtotal = lines.reduce(
    (s, l) => s + parseFloat(l.price.amount) * l.quantity,
    0,
  );

  // Cycle 4 P0 (Mike F-39): the green "ALL ITEMS FIT" banner used to render
  // unconditionally over mixed-vehicle baskets (F-150 tonneau + Tundra cover
  // shown to a Wrangler garage). Compute per-line fitment from the title, then
  // render an honest message: "ALL ITEMS FIT", "MIXED FITMENT - REVIEW", or
  // a neutral garage chip.
  const fitments = useMemo(
    () =>
      lines.map((l) =>
        checkFitment(
          { title: l.productTitle, fitTitle: l.productTitle, vehicleTags: [] },
          vehicle ?? null,
          // Cycle 14X+ post-sync (Sam re-review M-6): pass sub-model
          // answers so cart fitment status matches the PDP gate. A
          // 5.5'-bed customer with a 6.5' tonneau in cart now correctly
          // shows MIXED FITMENT, not green ALL ITEMS FIT.
          subModelAnswers,
        ),
      ),
    [lines, vehicle, subModelAnswers],
  );
  const allFit = vehicle && fitments.length > 0 && fitments.every((f) => f === true);
  const anyMisfit = vehicle && fitments.some((f) => f === false);
  const anyUnknown = vehicle && fitments.some((f) => f === undefined);
  const discount = promoApplied ? subtotal * 0.1 : 0;
  // Cycle 14Q (owner): free shipping on every order, no minimum.
  const shipping = 0;
  const tax = (subtotal - discount) * 0.0875;
  const total = subtotal - discount + shipping + tax;
  const itemCount = lines.reduce((s, l) => s + l.quantity, 0);

  if (lines.length === 0) {
    return (
      <main className="container-x" style={{ paddingTop: 96, paddingBottom: 128 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>
          YOUR CART
        </div>
        <h1
          className="cart-hero-h1"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 56,
            textTransform: "uppercase",
            letterSpacing: "-0.02em",
            lineHeight: 0.95,
            marginBottom: 16,
          }}
        >
          NOTHING IN
          <br />
          THE CART YET.
        </h1>
        <p
          style={{
            color: "var(--color-muted)",
            maxWidth: 480,
            marginBottom: 24,
          }}
        >
          Browse our parts, pick what fits your build, and we&apos;ll keep them
          here until you&apos;re ready.
        </p>
        <Link href="/collections" className="btn btn-primary btn-lg">
          BROWSE PARTS
        </Link>
      </main>
    );
  }

  return (
    <main>
      <div
        className="container-x"
        style={{ paddingTop: 48, paddingBottom: 64 }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: 32,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>
              YOUR CART · {itemCount} ITEMS
            </div>
            <h1
              className="cart-hero-h1"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 56,
                textTransform: "uppercase",
                letterSpacing: "-0.02em",
                lineHeight: 0.95,
              }}
            >
              REVIEW
              <br />
              YOUR ORDER.
            </h1>
            {/* Cycle 14Z (Mike-O1 M-1): empty-cart escape hatch. The Shopify
                cart token survives in-page cookie clears, so customers can
                end up with phantom items. One tap clears. */}
            {lines.length > 0 && (
              <button
                type="button"
                onClick={emptyCart}
                disabled={busy}
                className="btn btn-sm"
                style={{
                  marginTop: 12,
                  background: emptyConfirm ? "rgba(239,68,68,0.12)" : "transparent",
                  borderColor: emptyConfirm
                    ? "rgba(239,68,68,0.5)"
                    : "var(--color-border)",
                  color: emptyConfirm
                    ? "var(--color-destructive)"
                    : "var(--color-muted)",
                  fontWeight: emptyConfirm ? 700 : 500,
                }}
              >
                {emptyConfirm ? "TAP AGAIN TO CONFIRM" : "EMPTY CART"}
              </button>
            )}
          </div>
          {vehicle && (
            <div
              style={{
                background: anyMisfit
                  ? "rgba(239,68,68,0.08)"
                  : allFit
                    ? "rgba(34,197,94,0.08)"
                    : "var(--color-surface-2)",
                border: anyMisfit
                  ? "1px solid rgba(239,68,68,0.4)"
                  : allFit
                    ? "1px solid rgba(34,197,94,0.3)"
                    : "1px solid var(--color-border)",
                padding: "10px 14px",
                borderRadius: "var(--radius-md)",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <Icons.check size={14} />
              <span
                className="mono"
                style={{
                  fontSize: 11,
                  letterSpacing: "0.08em",
                  color: anyMisfit
                    ? "var(--color-destructive)"
                    : allFit
                      ? "var(--color-success)"
                      : "var(--color-muted)",
                }}
              >
                {anyMisfit
                  ? `MIXED FITMENT — SOME ITEMS DO NOT FIT YOUR ${vehicle.year} ${vehicle.make.toUpperCase()} ${vehicle.model.toUpperCase()}`
                  : allFit
                    ? `ALL ITEMS FIT YOUR ${vehicle.year} ${vehicle.make.toUpperCase()} ${vehicle.model.toUpperCase()}`
                    : anyUnknown
                      ? `GARAGE: ${vehicle.year} ${vehicle.make.toUpperCase()} ${vehicle.model.toUpperCase()} — REVIEW EACH ITEM`
                      : `GARAGE: ${vehicle.year} ${vehicle.make.toUpperCase()} ${vehicle.model.toUpperCase()}`}
              </span>
            </div>
          )}
        </div>

        <div
          // Cycle 14c (Mike-3 BLOCKER): md: kicked desktop 2-col layout in at
          // 768 but `1fr 380px` totals ~768 itself + container padding pushes
          // body scrollWidth to 862, clipping the Order Summary card and the
          // CHECKOUT button off-screen on iPad Mini. Push the 2-col layout to
          // lg+ (1024) so 768 stays single-column.
          className="grid grid-cols-1 lg:grid-cols-[1fr_380px]"
          style={{ gap: 32 }}
        >
          {/* LEFT */}
          <div>
            {/* Cycle 14Q (owner): free shipping on every order, no minimum.
                The "$X AWAY FROM FREE SHIPPING" progress bar is no longer
                meaningful — replace with a simple confirmation pill. */}
            <div
              style={{
                background: "rgba(34,197,94,0.08)",
                border: "1px solid rgba(34,197,94,0.3)",
                borderRadius: "var(--radius-md)",
                padding: 14,
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span style={{ color: "var(--color-success)", display: "flex" }}>
                <Icons.shipping size={16} />
              </span>
              <span
                className="mono"
                style={{
                  fontSize: 11,
                  letterSpacing: "0.1em",
                  color: "var(--color-success)",
                  fontWeight: 700,
                }}
              >
                ✓ FREE SHIPPING ON EVERY ORDER · NO MINIMUM
              </span>
            </div>

            {/* lines — Cycle 12 (Mike F-7 BLOCKER): used to be a 5-col grid
                "96px 1fr auto auto auto" which clipped the price column at
                375px. Mobile now uses a 2-col layout (image + body) with
                qty + price stacked inside body. */}
            {lines.map((line) => (
              <div
                key={line.id}
                className="cart-line"
                style={{
                  padding: 16,
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                <div
                  className="product-img-bg cart-line__img"
                  style={{
                    /* Cycle 14b (Mike F-6): inline 96x96 used to overflow my
                       80px mobile cart-line grid column. Class lets CSS scale
                       to 80px on mobile, 96px on desktop. */
                    width: "100%",
                    aspectRatio: "1 / 1",
                    borderRadius: "var(--radius-sm)",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {line.image && (
                    <Image
                      src={line.image.url}
                      alt={line.image.altText ?? line.productTitle}
                      fill
                      sizes="96px"
                      style={{ objectFit: "contain", padding: 6 }}
                    />
                  )}
                </div>
                <div>
                  <Link
                    href={`/products/${line.productHandle}`}
                    style={{ fontSize: 15, fontWeight: 500 }}
                  >
                    {line.productTitle}
                  </Link>
                  <div
                    className="mono"
                    style={{
                      fontSize: 10,
                      color: "var(--color-muted)",
                      letterSpacing: "0.08em",
                      marginTop: 4,
                    }}
                  >
                    SKU {line.sku ?? "—"}{line.variantTitle ? ` · ${line.variantTitle}` : ""}
                  </div>
                  {/* Cycle 14f (Mike-6 MAJOR F-9): the Remove control was a
                      42×17 px text link. With dirty thumbs Mike was hitting
                      the qty stepper instead. Bump to a real 44×44 tap target
                      with a visible border so it's discoverable. */}
                  <button
                    type="button"
                    onClick={() => removeLine(line.id)}
                    disabled={busy}
                    aria-label="Remove from cart"
                    style={{
                      background: "transparent",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-sm)",
                      color: "var(--color-muted)",
                      fontSize: 12,
                      letterSpacing: "0.06em",
                      marginTop: 10,
                      padding: "0 14px",
                      minHeight: 44,
                      minWidth: 88,
                      cursor: "pointer",
                      fontWeight: 500,
                    }}
                  >
                    REMOVE
                  </button>
                </div>
                <div className="cart-line__row2">
                  <div
                    className="cart-line__qty"
                    style={{
                      display: "inline-flex",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-sm)",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        updateQty(line.id, Math.max(0, line.quantity - 1))
                      }
                      disabled={busy}
                      aria-label="Decrease"
                      style={miniBtn}
                    >
                      <Icons.minus size={12} />
                    </button>
                    <span
                      className="mono"
                      style={{
                        width: 36,
                        textAlign: "center",
                        fontSize: 14,
                        lineHeight: "44px",
                      }}
                    >
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQty(line.id, line.quantity + 1)}
                      disabled={busy}
                      aria-label="Increase"
                      style={miniBtn}
                    >
                      <Icons.plus size={12} />
                    </button>
                  </div>
                  <div
                    className="mono cart-line__price"
                    style={{ fontSize: 16, fontWeight: 700, textAlign: "right" }}
                  >
                    ${(parseFloat(line.price.amount) * line.quantity).toFixed(2)}
                  </div>
                </div>
              </div>
            ))}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 24,
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <Link href="/collections" className="btn">
                <Icons.chevLeft size={12} /> CONTINUE SHOPPING
              </Link>
              <span
                className="mono"
                style={{
                  fontSize: 11,
                  color: "var(--color-muted)",
                  letterSpacing: "0.08em",
                }}
              >
                SUBTOTAL · ${subtotal.toFixed(2)}
              </span>
            </div>
          </div>

          {/* RIGHT — sticky summary */}
          <div className="md:sticky md:self-start" style={{ top: 160 }}>
            <div
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "14px 20px",
                  borderBottom: "1px solid var(--color-border)",
                  background: "var(--color-surface-2)",
                }}
              >
                <span
                  className="mono"
                  style={{
                    fontSize: 12,
                    letterSpacing: "0.14em",
                    fontWeight: 600,
                  }}
                >
                  ORDER SUMMARY
                </span>
              </div>

              <div
                style={{
                  padding: 20,
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                <div className="label-eyebrow" style={{ marginBottom: 6 }}>
                  PROMO CODE
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <input
                    value={promo}
                    onChange={(e) => setPromo(e.target.value)}
                    className="input"
                    placeholder="Enter code"
                    style={{ height: 40, flex: 1, fontSize: 13 }}
                  />
                  <button
                    type="button"
                    onClick={tryApplyPromo}
                    className="btn btn-sm"
                    style={{ height: 40 }}
                  >
                    APPLY
                  </button>
                </div>
                {promoApplied && (
                  <div
                    style={{
                      marginTop: 8,
                      fontSize: 11,
                      color: "var(--color-success)",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Icons.check size={11} /> 10% off applied
                  </div>
                )}
                {promoError && !promoApplied && (
                  <div
                    style={{
                      marginTop: 8,
                      fontSize: 11,
                      color: "var(--color-destructive)",
                    }}
                  >
                    {promoError}
                  </div>
                )}
              </div>

              <div
                style={{
                  padding: 20,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <Row label="Subtotal" value={`$${subtotal.toFixed(2)}`} />
                {discount > 0 && (
                  <Row
                    label="Promo"
                    value={`-$${discount.toFixed(2)}`}
                    success
                  />
                )}
                <Row label="Shipping" value="FREE" success />
                <Row label="Tax (est.)" value={`$${tax.toFixed(2)}`} muted />
              </div>

              <div
                style={{
                  padding: "16px 20px",
                  borderTop: "1px solid var(--color-border)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                }}
              >
                <span
                  className="mono"
                  style={{
                    fontSize: 12,
                    letterSpacing: "0.14em",
                    fontWeight: 600,
                  }}
                >
                  TOTAL
                </span>
                <span
                  className="mono"
                  style={{ fontSize: 24, fontWeight: 700 }}
                >
                  ${total.toFixed(2)}
                </span>
              </div>

              <div
                style={{
                  padding: 20,
                  borderTop: "1px solid var(--color-border)",
                }}
              >
                <a
                  href={cart?.checkoutUrl ?? "/checkout"}
                  className="btn btn-primary btn-block btn-lg"
                >
                  CHECKOUT · ${total.toFixed(2)}
                </a>
                <p
                  style={{
                    marginTop: 14,
                    fontSize: 11,
                    color: "var(--color-muted)",
                    textAlign: "center",
                  }}
                >
                  or 4 payments of ${(total / 4).toFixed(2)} with{" "}
                  <strong style={{ color: "var(--color-foreground)" }}>
                    Affirm
                  </strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function Row({
  label,
  value,
  success,
  muted,
}: {
  label: string;
  value: string;
  success?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        fontSize: 13,
      }}
    >
      <span
        style={{
          color: muted ? "var(--color-muted)" : "var(--color-foreground)",
        }}
      >
        {label}
      </span>
      <span
        className="mono"
        style={{
          color: success
            ? "var(--color-success)"
            : "var(--color-foreground)",
          fontWeight: 600,
        }}
      >
        {value}
      </span>
    </div>
  );
}

// Cycle 14h (Mike-8 MAJOR F-15): /cart qty stepper was still 32×32 — only
// the drawer got bumped to 44×44 in cycle 14g. Mike's dirty-thumb test on
// Pixel 8 Pro 412 confirmed mistaps. Bring /cart up to drawer parity.
const miniBtn: React.CSSProperties = {
  width: 44,
  height: 44,
  background: "transparent",
  border: 0,
  color: "var(--color-foreground)",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
