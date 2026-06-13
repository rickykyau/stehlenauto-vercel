import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import Image from "next/image";
import { Logo } from "@/components/ui/logo";
import { Icons } from "@/components/ui/icons";
import { BeginCheckoutTracker } from "@/components/analytics/begin-checkout";
import { CheckoutAttribution } from "@/components/analytics/checkout-attribution";
import { getCart } from "@/lib/cart/server";
import { getCurrentVehicle } from "@/lib/garage/server";
import { checkFitment } from "@/lib/fitment/match";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const cart = await getCart();
  if (!cart || cart.lines.length === 0) redirect("/cart");
  const vehicle = await getCurrentVehicle();
  const subtotal = cart.lines.reduce(
    (s, l) => s + parseFloat(l.price.amount) * l.quantity,
    0,
  );
  const tax = subtotal * 0.0875;
  // Cycle 8 (owner): used to be `parseFloat(cart.total.amount) || subtotal+tax`.
  // Shopify's cart `total.amount` is subtotal-only at this stage (tax/shipping
  // aren't applied until the secure checkout step), so we were rendering
  // TOTAL = $602 next to the visible Tax (est.) $52.67 line — mathematically
  // contradictory and $52.67 lower than the cart page. Use the same composed
  // total the cart page uses for consistency.
  const total = subtotal + tax;

  // Cycle 6 (Mike): /checkout was hardcoded green "FITMENT VERIFIED" while
  // /cart and the cart drawer correctly showed MIXED FITMENT. The customer
  // would land on checkout, see the green banner, and trust it. Use the same
  // per-line checkFitment used by drawer + cart page so all three agree.
  const fitments = vehicle
    ? cart.lines.map((l) =>
        checkFitment(
          { title: l.productTitle, fitTitle: l.productTitle, vehicleTags: [] },
          vehicle,
        ),
      )
    : [];
  const allFit =
    !!vehicle && fitments.length > 0 && fitments.every((f) => f === true);
  const anyMisfit = !!vehicle && fitments.some((f) => f === false);
  const anyUnknown = !!vehicle && fitments.some((f) => f === undefined);

  return (
    <div
      style={{
        background: "var(--color-background)",
        minHeight: "100vh",
      }}
    >
      <BeginCheckoutTracker lines={cart.lines} total={total} />
      <CheckoutAttribution />
      <div
        style={{
          borderBottom: "1px solid var(--color-border)",
          background: "var(--color-surface)",
        }}
      >
        <div
          className="container-x"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 64,
          }}
        >
          <Link href="/cart" style={{ display: "flex", alignItems: "center" }}>
            <Logo height={24} />
          </Link>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              color: "var(--color-muted)",
              fontSize: 12,
            }}
          >
            <Icons.shield size={14} />
            <span className="mono" style={{ letterSpacing: "0.1em" }}>
              SECURE CHECKOUT · 256-BIT SSL
            </span>
          </div>
        </div>
      </div>

      <div
        className="container-x grid grid-cols-1 md:grid-cols-[1fr_380px]"
        style={{ paddingTop: 48, paddingBottom: 64, gap: 32 }}
      >
        <div
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            padding: 32,
          }}
        >
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            ALMOST THERE
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 36,
              textTransform: "uppercase",
              letterSpacing: "-0.02em",
              lineHeight: 0.95,
              marginBottom: 16,
            }}
          >
            REVIEW &amp; PAY
          </h1>
          <p
            style={{
              color: "var(--color-muted)",
              fontSize: 14,
              marginBottom: 24,
              maxWidth: 520,
            }}
          >
            We&apos;ll hand you off to our secure Shopify checkout for
            information, shipping, and payment. Your cart, fitment, and any
            saved addresses come along.
          </p>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              marginBottom: 24,
            }}
          >
            {cart.lines.map((l) => (
              <div
                key={l.id}
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "center",
                  padding: 12,
                  background: "var(--color-surface-2)",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                <div
                  className="product-img-bg"
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 2,
                    position: "relative",
                    overflow: "hidden",
                    flexShrink: 0,
                  }}
                >
                  {l.image && (
                    <Image
                      src={l.image.url}
                      alt={l.image.altText ?? l.productTitle}
                      fill
                      sizes="56px"
                      style={{ objectFit: "contain", padding: 4 }}
                    />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>
                    {l.productTitle}
                  </div>
                  <div
                    className="mono"
                    style={{
                      fontSize: 10,
                      color: "var(--color-muted)",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {l.variantTitle} · QTY {l.quantity}
                  </div>
                </div>
                <span
                  className="mono"
                  style={{ fontSize: 13, fontWeight: 700 }}
                >
                  ${(parseFloat(l.price.amount) * l.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Cycle 14e (Mike-5): on iPhone SE 375 the long label "CONTINUE TO
              SECURE CHECKOUT · $1793.29" overflows the button by ~66px and
              the price clips. Show the long label on tablet+, a shorter
              "CHECKOUT · $X" on mobile. */}
          <a
            href={cart.checkoutUrl}
            className="btn btn-primary btn-lg btn-block"
            style={{ height: 64, fontSize: 15 }}
          >
            <span className="hidden sm:inline">CONTINUE TO SECURE CHECKOUT · ${total.toFixed(2)}</span>
            <span className="sm:hidden">CHECKOUT · ${total.toFixed(2)}</span>
          </a>
          <p
            style={{
              fontSize: 11,
              color: "var(--color-muted)",
              textAlign: "center",
              marginTop: 12,
            }}
          >
            By continuing you agree to Stehlen&apos;s{" "}
            <Link
              href="/legal/terms"
              style={{
                color: "var(--color-foreground)",
                textDecoration: "underline",
              }}
            >
              Terms
            </Link>{" "}
            and{" "}
            <Link
              href="/legal/privacy"
              style={{
                color: "var(--color-foreground)",
                textDecoration: "underline",
              }}
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>

        <aside
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            padding: 20,
            alignSelf: "start",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div
            className="mono"
            style={{
              fontSize: 12,
              letterSpacing: "0.14em",
              fontWeight: 600,
            }}
          >
            ORDER ({cart.lines.length})
          </div>
          <Row label="Subtotal" value={`$${subtotal.toFixed(2)}`} />
          <Row label="Shipping" value="Calculated next" muted />
          <Row label="Tax (est.)" value={`$${tax.toFixed(2)}`} muted />
          <div
            style={{
              height: 1,
              background: "var(--color-border)",
              margin: "4px 0",
            }}
          />
          <div
            style={{
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
              style={{ fontSize: 22, fontWeight: 700 }}
            >
              ${total.toFixed(2)}
            </span>
          </div>
          {vehicle && (
            <div
              style={{
                marginTop: 4,
                padding: 12,
                background: anyMisfit
                  ? "rgba(239,68,68,0.06)"
                  : allFit
                    ? "rgba(34,197,94,0.06)"
                    : "var(--color-surface-2)",
                border: anyMisfit
                  ? "1px solid rgba(239,68,68,0.4)"
                  : allFit
                    ? "1px solid rgba(34,197,94,0.3)"
                    : "1px solid var(--color-border)",
                borderRadius: "var(--radius-sm)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 4,
                }}
              >
                <Icons.check size={12} />
                <span
                  className="mono"
                  style={{
                    fontSize: 11,
                    letterSpacing: "0.1em",
                    color: anyMisfit
                      ? "var(--color-destructive)"
                      : allFit
                        ? "var(--color-success)"
                        : "var(--color-muted)",
                  }}
                >
                  {anyMisfit
                    ? "MIXED FITMENT"
                    : allFit
                      ? "FITMENT VERIFIED"
                      : "GARAGE"}
                </span>
              </div>
              <div style={{ fontSize: 12, color: "var(--color-muted)" }}>
                {anyMisfit
                  ? `Some items DO NOT fit your ${vehicle.year} ${vehicle.make} ${vehicle.model}. Review your cart before paying.`
                  : allFit
                    ? `All items fit your ${vehicle.year} ${vehicle.make} ${vehicle.model}.`
                    : anyUnknown
                      ? `Garage: ${vehicle.year} ${vehicle.make} ${vehicle.model}. Verify each item below before paying.`
                      : `Garage: ${vehicle.year} ${vehicle.make} ${vehicle.model}.`}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
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
      <span className="mono" style={{ fontWeight: 600 }}>
        {value}
      </span>
    </div>
  );
}
