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
  const [promoPassthrough, setPromoPassthrough] = useState<string | null>(null);

  // Cycle-1 fix (Jordan, Marcus #4): cart used to accept any non-empty string
  // as a 10% code. Whitelist KNOWN codes here for the local 10%-off preview.
  // Cycle 14BG (Jordan F-16): the client must never REJECT a code — Shopify
  // checkout is the authority on discount validity. Unknown codes used to
  // get "That code isn't valid" even when they were live in Shopify (a
  // false rejection at the highest-intent moment). Now unknown codes pass
  // through to checkout via ?discount= and Shopify validates them there.
  const KNOWN_PROMOS = new Set(["WELCOME10"]);

  const tryApplyPromo = () => {
    const code = promo.trim().toUpperCase();
    if (!code) return;
    if (KNOWN_PROMOS.has(code)) {
      setPromoApplied(true);
      setPromoPassthrough(null);
    } else {
      setPromoApplied(false);
      setPromoPassthrough(code);
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
  //
  // Cycle 14AB (Mike-O14AB F-1 BLOCKER second pass): the inline confirm
  // row from 14AA still failed Mike's test. Whether it was a Playwright
  // timing artifact or a real React commit lag, a 2-state button with
  // hidden first transition is fragile. Replace with a dialog — explicit
  // accessible confirm element that's unmissable. Single click opens it,
  // confirm button does the actual delete, cancel closes.
  const [confirmOpen, setConfirmOpen] = useState(false);
  const requestEmpty = () => {
    setConfirmOpen(true);
  };
  const confirmEmpty = async () => {
    setBusy(true);
    try {
      await fetch("/api/cart", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lineId: "all" }),
      });
      await reload();
      window.dispatchEvent(
        new CustomEvent("stehlen:cart:updated", { detail: { count: 0 } }),
      );
      setConfirmOpen(false);
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
          {
            title: l.productTitle,
            // Cycle 14AR-fix3 (BUG-14AR-6 follow-up): mirror the cart
            // drawer — use server-enriched per-line fitment data so the
            // verdict is confident (FITS / DOES NOT FIT) instead of
            // sliding to the title-string path that misses many products.
            fitTitle: l.fitTitle ?? l.productTitle,
            vehicleTags: l.vehicleTags ?? [],
            fitmentTable: l.fitmentTable,
          },
          vehicle ?? null,
          // Cycle 14X+ post-sync (Sam re-review M-6): pass sub-model
          // answers so cart fitment status matches the PDP gate.
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

  // Cycle 14BG (Jordan F-16): carry the promo code into Shopify hosted
  // checkout via the ?discount= URL param so the discount engine applies
  // it authoritatively. Covers BOTH the known WELCOME10 preview (which
  // previously showed -10% locally but never reached checkout) and
  // unknown pass-through codes.
  const checkoutHref = (() => {
    const base = cart?.checkoutUrl ?? "/checkout";
    const code = promoApplied ? "WELCOME10" : promoPassthrough;
    if (!code) return base;
    // Cycle 14BG-fix1 (Ren BUG-14BG-01 P3): the welcome-back flow seeds
    // checkoutUrl with its own discount param — strip any existing
    // discount= before appending so the user's code is the only one.
    const [path, query = ""] = base.split("?");
    const params = query
      .split("&")
      .filter((kv) => kv && !/^discount=/i.test(kv));
    params.push(`discount=${encodeURIComponent(code)}`);
    return `${path}?${params.join("&")}`;
  })();

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
    <main style={{ paddingBottom: cart && cart.lines.length > 0 ? 112 : 0 }}>
      {/* Cycle 14AW: paddingBottom on <main> reserves room for the
          fixed-bottom mobile checkout bar so it never occludes the
          last cart-line REMOVE/qty controls. The bar itself is hidden
          ≥768px (md:hidden) so the padding is wasted on desktop —
          acceptable trade vs. a media-query CSS class on a prop.
          Cycle 14AW-fix2 bumped 88→112 to clear the new tax-disclosure
          subtitle line under the CHECKOUT button. */}
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
            {/* Cycle 14AB (Mike-O14AB F-1 BLOCKER second pass): converted
                to a modal-dialog pattern. The Empty Cart button just opens
                the dialog; React no longer needs to swap an entire
                button-vs-confirm-row in the same flex container. */}
            {lines.length > 0 && (
              <button
                type="button"
                onClick={requestEmpty}
                disabled={busy}
                data-testid="empty-cart-trigger"
                style={{
                  /* Cycle 14BB-fix4 (Jordan F-008): EMPTY CART used to
                     render as a full outlined button at similar visual
                     weight to secondary CTAs. Destructive action with
                     that emphasis = fat-finger accidents on mobile
                     (a single thumb slip drops $400 of work). Demote
                     to muted text link with underline; tap target stays
                     ≥44px via minHeight + padding so accessibility
                     compliance is preserved without competing with the
                     CHECKOUT CTA visually. */
                  marginTop: 12,
                  background: "transparent",
                  border: 0,
                  color: "var(--color-muted)",
                  fontSize: 11,
                  letterSpacing: "0.08em",
                  textDecoration: "underline",
                  minHeight: 44,
                  padding: "10px 0",
                  display: "inline-flex",
                  alignItems: "center",
                  cursor: "pointer",
                }}
              >
                Empty cart
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
              {/* Cycle 14AV (Jordan NF-2): the icon was a hardcoded
                  Icons.check regardless of state. A green check beside
                  red "MIXED FITMENT" copy contradicts itself at
                  peripheral-vision speed. Switch icon to match the
                  semantic state of the banner. */}
              {anyMisfit ? (
                <Icons.alert size={14} />
              ) : (
                <Icons.check size={14} />
              )}
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
                    /* Cycle 14AV (Jordan NF-4): post-14AS metafield
                       cleanup, checkFitment === true is metafield
                       triple-match confirmed (or title+sub-model gate
                       confirmed for universals). The "LIKELY FITS —
                       double-check" softening from 14AB was conservative
                       insurance against the old title-only path. Now
                       that fitment_applications is the source of truth,
                       restore the confidence-language pairing with the
                       PDP's "CONFIRMED FITMENT" — a customer who saw
                       green on the PDP should see green confidence in
                       the cart too. */
                    ? `ALL ITEMS CONFIRMED FIT YOUR ${vehicle.year} ${vehicle.make.toUpperCase()} ${vehicle.model.toUpperCase()}`
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
            {lines.map((line, idx) => (
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
                  {/* Cycle 14X+ post-sync (Mike-O14 F-2 MAJOR): cart page
                      had a global "MIXED FITMENT" banner but no per-line
                      fitment tags — buyer couldn't tell WHICH item was
                      the misfit. Surface a chip on each line. */}
                  {vehicle && fitments[idx] !== undefined && (
                    <div
                      className="mono"
                      style={{
                        display: "inline-block",
                        marginTop: 6,
                        padding: "2px 8px",
                        fontSize: 10,
                        letterSpacing: "0.08em",
                        borderRadius: "var(--radius-sm)",
                        background:
                          fitments[idx] === true
                            ? "rgba(34,197,94,0.12)"
                            : "rgba(239,68,68,0.12)",
                        color:
                          fitments[idx] === true
                            ? "var(--color-success)"
                            : "var(--color-destructive)",
                        border:
                          fitments[idx] === true
                            ? "1px solid rgba(34,197,94,0.4)"
                            : "1px solid rgba(239,68,68,0.4)",
                      }}
                    >
                      {fitments[idx] === true
                        ? `✓ FITS YOUR ${vehicle.year} ${vehicle.make.toUpperCase()} ${vehicle.model.toUpperCase()}`
                        : `✗ DOES NOT FIT YOUR ${vehicle.year} ${vehicle.make.toUpperCase()} ${vehicle.model.toUpperCase()}`}
                    </div>
                  )}
                  {/* Cycle 14BE-fix6 (Jordan F-5): misfit-cart recovery.
                      Cart correctly labels the misfit but used to dead-end
                      the customer — only REMOVE was offered. Add a "find
                      one that fits" link to the vehicle hub so the
                      customer's session converts into a new browse instead
                      of an abandonment. Per Jordan's AAG benchmark: 31%
                      reduction in cart abandonment on misfit-mixed carts. */}
                  {vehicle && fitments[idx] === false && (
                    <div style={{ marginTop: 6 }}>
                      <Link
                        href={`/vehicle/${vehicle.year}-${vehicle.make.toLowerCase().replace(/\s+/g, "-")}-${vehicle.model.toLowerCase().replace(/\s+/g, "-")}`}
                        className="mono"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          fontSize: 11,
                          letterSpacing: "0.08em",
                          color: "var(--color-primary)",
                          textDecoration: "none",
                          textTransform: "uppercase",
                          fontWeight: 600,
                        }}
                      >
                        Find one that fits your {vehicle.make} {vehicle.model} →
                      </Link>
                    </div>
                  )}
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
                    style={{ height: 44, flex: 1, fontSize: 13 }}
                  />
                  <button
                    type="button"
                    onClick={tryApplyPromo}
                    className="btn btn-sm"
                    style={{ height: 44, padding: "0 16px" }}
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
                {promoPassthrough && !promoApplied && (
                  <div
                    style={{
                      marginTop: 8,
                      fontSize: 11,
                      color: "var(--color-muted)",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Icons.check size={11} />
                    <span>
                      <strong style={{ color: "var(--color-foreground)" }}>
                        {promoPassthrough}
                      </strong>{" "}
                      will be applied at checkout
                    </span>
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

              {/* Cycle 14AW-fix5 (Mike R6 F-3): on mobile the fixed-
                  bottom CHECKOUT bar is always visible — rendering this
                  Order Summary CHECKOUT button below the line items
                  meant the customer saw two identical "CHECKOUT $X.XX"
                  buttons stacked when scrolling to the order summary.
                  Hide this in-page button below md:; the fixed-bottom
                  bar handles mobile checkout. Affirm subtitle stays so
                  customers see the financing option even on mobile. */}
              <div
                className="hidden md:block"
                style={{
                  padding: 20,
                  borderTop: "1px solid var(--color-border)",
                }}
              >
                <a
                  href={checkoutHref}
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
              {/* Mobile-only Affirm subtitle for parity with desktop
                  order summary; CHECKOUT itself is the fixed-bottom bar */}
              <div
                className="md:hidden"
                style={{
                  padding: "12px 20px",
                  borderTop: "1px solid var(--color-border)",
                }}
              >
                <p
                  style={{
                    fontSize: 11,
                    color: "var(--color-muted)",
                    textAlign: "center",
                    margin: 0,
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

      {/* Cycle 14AW (Jordan F-NEW-1 MAJOR): mobile cart had no sticky
          checkout CTA — Order Summary card uses md:sticky which only
          activates ≥768px. On mobile the customer must scroll past
          every line item (and cross-sell rail and footer) to reach
          CHECKOUT. Industry data (RealTruck mobile cart 2023): adding
          fixed-bottom CTA lifted mobile checkout initiation 22%. Only
          render below md and only when there are items. The main
          content gets paddingBottom: 80 below to keep the last line
          from being obscured. */}
      {cart && cart.lines.length > 0 && (
        <div
          className="md:hidden"
          style={{
            position: "fixed",
            // Cycle 14BG (Jordan F-1): stack above the mobile bottom nav.
            // The nav carries the safe-area inset, so this bar drops its
            // own env() padding (the var already includes it).
            bottom: "var(--stehlen-bottom-nav-height, 0px)",
            left: 0,
            right: 0,
            padding: "12px 16px",
            background: "var(--color-background)",
            borderTop: "1px solid var(--color-border)",
            boxShadow: "0 -8px 24px rgba(0,0,0,0.4)",
            zIndex: 45,
          }}
        >
          <a
            href={checkoutHref}
            className="btn btn-primary btn-block btn-lg"
            style={{ justifyContent: "space-between", textDecoration: "none" }}
          >
            <span>CHECKOUT</span>
            <span>${total.toFixed(2)}</span>
          </a>
          {/* Cycle 14AW-fix2 (Mike R3 F-3): the bar showed "$233.81" while
              the cart line item rendered $215. The Order Summary card
              breakdown (Subtotal/Shipping/Tax) is rendered below the line
              items, so on mobile the customer sees a $19 jump and no
              explanation unless they scroll all the way down. Surface the
              breakdown inline so the bar self-explains the gap. */}
          <p
            className="mono"
            style={{
              margin: "8px 0 0",
              fontSize: 10,
              letterSpacing: "0.08em",
              color: "var(--color-muted)",
              textAlign: "center",
            }}
          >
            ${subtotal.toFixed(2)} subtotal · FREE ship · ${tax.toFixed(2)} est. tax
          </p>
        </div>
      )}

      {/* Cycle 14AB: empty-cart confirm modal. Single fixed-position overlay
          mounted at root of the page so it can't be hidden by any flex /
          overflow ancestor. Click backdrop or CANCEL to dismiss. */}
      {confirmOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="empty-cart-title"
          onClick={() => !busy && setConfirmOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 90,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 420,
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-lg)",
              padding: 24,
              boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
            }}
          >
            <h3
              id="empty-cart-title"
              className="mono"
              style={{
                fontSize: 12,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--color-destructive)",
                marginBottom: 8,
              }}
            >
              EMPTY ENTIRE CART?
            </h3>
            <p style={{ fontSize: 14, color: "var(--color-foreground)", marginBottom: 20 }}>
              This removes all {itemCount} item{itemCount === 1 ? "" : "s"}{" "}from your cart. This can&apos;t be undone.
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={busy}
                className="btn btn-sm"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={confirmEmpty}
                disabled={busy}
                data-testid="empty-cart-confirm"
                className="btn btn-sm"
                style={{
                  background: "var(--color-destructive)",
                  borderColor: "var(--color-destructive)",
                  color: "#fff",
                  fontWeight: 700,
                }}
              >
                {busy ? "EMPTYING…" : "YES, EMPTY"}
              </button>
            </div>
          </div>
        </div>
      )}
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
