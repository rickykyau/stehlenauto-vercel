import type { Metadata } from "next";
import Link from "next/link";
import { Icons } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Track Your Order",
  description:
    "Track your Stehlen order without signing in. Enter your order number and email.",
  alternates: { canonical: "/track-order" },
  robots: { index: true, follow: true },
};

export const dynamic = "force-dynamic";

/**
 * Cycle 14BF (Mike Mission 2): guest order tracking. Returning marketplace
 * customers (eBay/Amazon migrators) don't have web accounts and won't make
 * one to check shipping. AutoZone / etrailer both ship this — Mike's
 * #1 returning-customer friction was "no guest order lookup, forces
 * account creation to track an order."
 *
 * Form action posts to /api/track-order which calls Shopify Admin API
 * findOrderByEmailAndId and returns status + timeline. For v1 the page
 * itself renders a friendly form + direct phone fallback; submission
 * routes to /account/orders/[id] when the email matches the order.
 */
export default function TrackOrderPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  return (
    <main>
      <section
        style={{
          background:
            "linear-gradient(180deg, var(--color-surface) 0%, var(--color-background) 100%)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <div
          className="container-x"
          style={{ paddingTop: 48, paddingBottom: 32 }}
        >
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            Order Status
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(28px, 5vw, 44px)",
              textTransform: "uppercase",
              letterSpacing: "-0.02em",
              margin: 0,
              marginBottom: 12,
            }}
          >
            Track your order
          </h1>
          <p
            style={{
              fontSize: 15,
              color: "var(--color-muted)",
              maxWidth: 600,
              lineHeight: 1.55,
              margin: 0,
            }}
          >
            No account needed. Enter the order number from your confirmation
            email + the email you used at checkout.
          </p>
        </div>
      </section>

      <section
        className="container-x"
        style={{ paddingTop: 32, paddingBottom: 64 }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 480px) 1fr",
            gap: 32,
          }}
        >
          <form
            method="POST"
            action="/api/track-order"
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              padding: 24,
            }}
          >
            <label style={{ display: "block", marginBottom: 16 }}>
              <span
                className="mono"
                style={{
                  fontSize: 11,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--color-muted)",
                  marginBottom: 6,
                  display: "block",
                }}
              >
                Order number
              </span>
              <input
                type="text"
                name="orderId"
                required
                placeholder="STH-12345"
                autoComplete="off"
                style={{
                  width: "100%",
                  height: 48,
                  padding: "0 14px",
                  fontSize: 15,
                  background: "var(--color-background)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--color-foreground)",
                }}
              />
            </label>
            <label style={{ display: "block", marginBottom: 20 }}>
              <span
                className="mono"
                style={{
                  fontSize: 11,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--color-muted)",
                  marginBottom: 6,
                  display: "block",
                }}
              >
                Email used at checkout
              </span>
              <input
                type="email"
                name="email"
                required
                placeholder="you@example.com"
                autoComplete="email"
                style={{
                  width: "100%",
                  height: 48,
                  padding: "0 14px",
                  fontSize: 15,
                  background: "var(--color-background)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--color-foreground)",
                }}
              />
            </label>

            {searchParams && (
              <ErrorBanner sp={searchParams} />
            )}

            <button
              type="submit"
              className="btn btn-primary btn-lg btn-block"
            >
              Look up my order
            </button>
            <p
              style={{
                fontSize: 12,
                color: "var(--color-muted)",
                marginTop: 12,
                lineHeight: 1.5,
              }}
            >
              We&apos;ll match the order to your email. If you have an
              account,{" "}
              <Link href="/account/orders" style={{ color: "var(--color-primary)" }}>
                sign in for full order history →
              </Link>
            </p>
          </form>

          <div
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              padding: 24,
            }}
          >
            <h2
              className="mono"
              style={{
                fontSize: 13,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              Can&apos;t find your order number?
            </h2>
            <p
              style={{
                fontSize: 14,
                color: "var(--color-muted)",
                lineHeight: 1.55,
                marginBottom: 16,
              }}
            >
              Check your confirmation email (subject:{" "}
              <em>&quot;Your Stehlen order is confirmed&quot;</em>) — order
              number starts with <code>STH-</code>.
            </p>
            <p
              style={{
                fontSize: 14,
                color: "var(--color-muted)",
                lineHeight: 1.55,
                marginBottom: 20,
              }}
            >
              For Amazon / eBay marketplace orders, contact us at the channel
              you ordered from — those orders don&apos;t live on stehlenauto.com.
            </p>
            <a
              href="tel:+18883784536"
              className="btn btn-lg btn-block"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Icons.phone size={14} />
              Call 1-888-378-4536
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

async function ErrorBanner({
  sp,
}: {
  sp: Promise<{ error?: string }>;
}) {
  const { error } = await sp;
  if (!error) return null;
  const messages: Record<string, string> = {
    not_found: "We couldn't find an order with that number + email combo. Double-check the order number from your confirmation email.",
    rate_limited: "Too many attempts. Wait a minute and try again, or call us.",
  };
  return (
    <div
      role="alert"
      style={{
        marginBottom: 16,
        padding: 12,
        background: "rgba(239,68,68,0.08)",
        border: "1px solid rgba(239,68,68,0.4)",
        borderRadius: "var(--radius-sm)",
        fontSize: 13,
        color: "var(--color-foreground)",
        lineHeight: 1.5,
      }}
    >
      {messages[error] ?? "Something went wrong. Try again."}
    </div>
  );
}
