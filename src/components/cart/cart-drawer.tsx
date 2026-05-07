"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Icons } from "@/components/ui/icons";
import type { Cart } from "@/lib/cart/types";
import type { Vehicle } from "@/components/ui/vehicle-pill";
import { checkFitment } from "@/lib/fitment/match";
import type { SubModelAnswer } from "@/lib/garage/types";
import { onOpenCartDrawer } from "./cart-events";

export function CartDrawer({
  initialCart,
  vehicle,
  subModelAnswers = [],
}: {
  initialCart: Cart | null;
  vehicle?: Vehicle;
  subModelAnswers?: SubModelAnswer[];
}) {
  const [open, setOpen] = useState(false);
  const [cart, setCart] = useState<Cart | null>(initialCart);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/cart");
      const data = (await res.json()) as { cart: Cart | null };
      setCart(data.cart);
    } catch {
      // ignore
    }
  }, []);

  useEffect(
    () =>
      onOpenCartDrawer(() => {
        setOpen(true);
        void refresh();
      }),
    [refresh],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  // Cycle 14Z (Mike-O3 N-7): emit live cart-count event after every
  // mutation so the header CartBadgeLive updates without waiting for a
  // layout re-render.
  const emitLiveCount = (cart: Cart | null) => {
    window.dispatchEvent(
      new CustomEvent("stehlen:cart:updated", {
        detail: { count: cart?.totalQuantity ?? 0 },
      }),
    );
  };

  const updateQty = async (lineId: string, quantity: number) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/cart", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lineId, quantity }),
      });
      const data = (await res.json()) as { cart: Cart | null };
      setCart(data.cart);
      emitLiveCount(data.cart);
    } catch (err) {
      setError(err instanceof Error ? err.message : "update failed");
    } finally {
      setBusy(false);
    }
  };

  const removeLine = async (lineId: string) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/cart", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lineId }),
      });
      const data = (await res.json()) as { cart: Cart | null };
      setCart(data.cart);
      emitLiveCount(data.cart);
    } catch (err) {
      setError(err instanceof Error ? err.message : "remove failed");
    } finally {
      setBusy(false);
    }
  };

  // Cycle 5 (Mike): cart drawer used to lie by omission — cart PAGE shows a
  // fitment banner, drawer didn't. Match the page's logic so the customer sees
  // mixed-vehicle warnings the moment the drawer opens, not only on /cart.
  const lines = cart?.lines ?? [];
  const fitments = useMemo(
    () =>
      lines.map((l) =>
        checkFitment(
          { title: l.productTitle, fitTitle: l.productTitle, vehicleTags: [] },
          vehicle ?? null,
          // Cycle 14X+ post-sync (Mike-O14 follow-up): pass sub-model
          // answers so the drawer fitment matches the PDP gate. Without
          // this a 5.5'-bed customer with a 6.5' tonneau would get a
          // soft "fits" verdict in the drawer.
          subModelAnswers,
        ),
      ),
    [lines, vehicle, subModelAnswers],
  );
  const allFit = vehicle && fitments.length > 0 && fitments.every((f) => f === true);
  const anyMisfit = vehicle && fitments.some((f) => f === false);
  const anyUnknown = vehicle && fitments.some((f) => f === undefined);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Cart"
      onClick={() => setOpen(false)}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 70,
        background: "rgba(0,0,0,0.7)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="anim-slide-right"
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          width: "92%",
          maxWidth: 420,
          background: "var(--color-background)",
          borderLeft: "1px solid var(--color-border)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 20px",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <div className="mono" style={{ fontSize: 13, letterSpacing: "0.12em" }}>
            CART · {cart?.totalQuantity ?? 0}
          </div>
          {/* Cycle 14i hygiene (Mike-10 MINOR F-18): the close X was a 20×20
              icon hit area — under the 44×44 mobile tap-target threshold. Pad
              to 44×44 with the icon centered. */}
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close cart"
            style={{
              background: "transparent",
              border: 0,
              color: "var(--color-foreground)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              width: 44,
              height: 44,
              marginRight: -10,
            }}
          >
            <Icons.close size={20} />
          </button>
        </div>

        {vehicle && lines.length > 0 && (
          <div
            style={{
              padding: "10px 20px",
              borderBottom: "1px solid var(--color-border)",
              background: anyMisfit
                ? "rgba(239,68,68,0.08)"
                : allFit
                  ? "rgba(34,197,94,0.08)"
                  : "var(--color-surface-2)",
            }}
          >
            <span
              className="mono"
              style={{
                fontSize: 10,
                letterSpacing: "0.1em",
                color: anyMisfit
                  ? "var(--color-destructive)"
                  : allFit
                    ? "var(--color-success)"
                    : "var(--color-muted)",
                fontWeight: 700,
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

        <div style={{ flex: 1, overflowY: "auto" }}>
          {!cart || cart.lines.length === 0 ? (
            <div style={{ padding: "32px 20px", color: "var(--color-muted)" }}>
              <p style={{ marginBottom: 16 }}>Your cart is empty.</p>
              <Link
                href="/collections"
                onClick={() => setOpen(false)}
                className="btn btn-block"
              >
                BROWSE PARTS
              </Link>
            </div>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {cart.lines.map((line, idx) => (
                <li
                  key={line.id}
                  style={{
                    padding: "16px 20px",
                    borderBottom: "1px solid var(--color-border)",
                    display: "grid",
                    gridTemplateColumns: "64px 1fr",
                    gap: 12,
                  }}
                >
                  <div
                    className="product-img-bg"
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: "var(--radius-sm)",
                      overflow: "hidden",
                      position: "relative",
                    }}
                  >
                    {line.image && (
                      <Image
                        src={line.image.url}
                        alt={line.image.altText ?? line.productTitle}
                        fill
                        sizes="64px"
                        style={{ objectFit: "contain", padding: 4 }}
                      />
                    )}
                  </div>
                  <div>
                    <Link
                      href={`/products/${line.productHandle}`}
                      onClick={() => setOpen(false)}
                      style={{ fontSize: 13, fontWeight: 500 }}
                    >
                      {line.productTitle}
                    </Link>
                    {/* Cycle 14X+ post-sync (Mike-O14 follow-up): per-
                        line fitment chip — drawer was emitting only the
                        global MIXED FITMENT banner. Match the cart-page
                        treatment so the buyer can identify which line
                        is the misfit at a glance. */}
                    {vehicle && fitments[idx] !== undefined && (
                      <div
                        className="mono"
                        style={{
                          display: "inline-block",
                          marginTop: 4,
                          padding: "1px 6px",
                          fontSize: 9,
                          letterSpacing: "0.08em",
                          borderRadius: "var(--radius-sm)",
                          background:
                            fitments[idx] === true
                              ? "rgba(34,197,94,0.15)"
                              : "rgba(239,68,68,0.15)",
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
                        {fitments[idx] === true ? "✓ FITS" : "✗ DOES NOT FIT"}
                      </div>
                    )}
                    {line.variantTitle && (
                      <div
                        className="mono"
                        style={{
                          fontSize: 10,
                          color: "var(--color-muted)",
                          letterSpacing: "0.08em",
                          marginTop: 2,
                        }}
                      >
                        {line.variantTitle}
                      </div>
                    )}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: 8,
                      }}
                    >
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          border: "1px solid var(--color-border)",
                          borderRadius: "var(--radius-sm)",
                        }}
                      >
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            updateQty(line.id, Math.max(0, line.quantity - 1))
                          }
                          aria-label="Decrease"
                          style={miniBtn}
                        >
                          <Icons.minus size={11} />
                        </button>
                        <span
                          className="mono"
                          style={{
                            width: 24,
                            textAlign: "center",
                            fontSize: 12,
                          }}
                        >
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => updateQty(line.id, line.quantity + 1)}
                          aria-label="Increase"
                          style={miniBtn}
                        >
                          <Icons.plus size={11} />
                        </button>
                      </div>
                      <span
                        className="mono"
                        style={{ fontSize: 13, fontWeight: 600 }}
                      >
                        ${(parseFloat(line.price.amount) * line.quantity).toFixed(2)}
                      </span>
                    </div>
                    {/* Cycle 14g (Mike-7 MAJOR F-11): the cycle-14f cart-page
                        REMOVE was bumped to 88×44 with a border, but the
                        drawer was missed and stayed a 42×17 underlined text
                        link. Mirror the same outlined-button treatment so
                        Mike doesn't mis-tap into the qty stepper. */}
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
                </li>
              ))}
            </ul>
          )}
        </div>

        {error && (
          <div
            style={{
              padding: "8px 20px",
              fontSize: 12,
              color: "var(--color-destructive)",
              borderTop: "1px solid var(--color-border)",
            }}
          >
            {error}
          </div>
        )}

        {cart && cart.lines.length > 0 && (
          <div
            style={{
              padding: "16px 20px",
              borderTop: "1px solid var(--color-border)",
              background: "var(--color-surface)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <span className="mono" style={{ fontSize: 12 }}>
                SUBTOTAL
              </span>
              <span className="mono" style={{ fontSize: 14, fontWeight: 700 }}>
                ${parseFloat(cart.subtotal.amount).toFixed(2)}
              </span>
            </div>
            <a
              href={cart.checkoutUrl}
              className="btn btn-primary btn-block btn-lg"
              style={{ marginBottom: 8 }}
            >
              CHECKOUT
            </a>
            <p
              style={{
                fontSize: 11,
                color: "var(--color-muted)",
                textAlign: "center",
              }}
            >
              Shipping and discounts calculated at checkout.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Cycle 14g (Mike-7 MAJOR F-12): the drawer qty stepper was 24×24 — mike's
// dirty-thumb test on iPhone 14 Pro 390 said "missed or accidentally tap the
// price column." Bump to a real 44×44 minimum tap target.
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
