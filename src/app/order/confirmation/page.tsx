import type { Metadata } from "next";
import Link from "next/link";
import { Icons } from "@/components/ui/icons";
import { PurchaseTracker } from "@/components/analytics/purchase-tracker";
import { getCurrentVehicle } from "@/lib/garage/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order Placed",
  robots: { index: false, follow: false },
};

const TIMELINE = [
  {
    label: "ORDER PLACED",
    sub: "Today",
    done: true,
    current: false,
  },
  {
    label: "PROCESSING",
    sub: "Within 24 hours",
    done: false,
    current: true,
  },
  { label: "SHIPPED", sub: "Est. tomorrow", done: false, current: false },
  {
    label: "DELIVERED",
    sub: "Est. 4–6 business days",
    done: false,
    current: false,
  },
];

export default async function OrderConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  const orderId = id ?? "STH-PENDING";
  const vehicle = await getCurrentVehicle();

  return (
    <main>
      {/* Cycle 14BE-fix2 (Marcus #1 BLOCKER): wake Klaviyo "Placed Order"
          trigger so post-purchase flows (install reminder, cross-sell,
          review request, winback) actually run. Items + value will be
          populated when Shopify checkout success callback wires through
          — placeholder for now uses orderId + vehicle context which is
          enough to trigger the flow. */}
      <PurchaseTracker orderId={orderId} vehicle={vehicle ?? null} />
      <div
        style={{
          background:
            "linear-gradient(180deg, var(--color-surface) 0%, var(--color-background) 100%)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <div
          className="container-x"
          style={{ paddingTop: 72, paddingBottom: 80 }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginBottom: 20,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "var(--color-success)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 0 8px rgba(34,197,94,0.15)",
                color: "var(--color-background)",
              }}
            >
              <Icons.check size={28} sw={3} />
            </div>
            <div>
              <div
                className="eyebrow"
                style={{ color: "var(--color-success)", marginBottom: 4 }}
              >
                ORDER PLACED · THANK YOU
              </div>
              <div
                className="mono"
                style={{
                  fontSize: 13,
                  color: "var(--color-muted)",
                  letterSpacing: "0.1em",
                }}
              >
                ORDER #{orderId}
              </div>
            </div>
          </div>
          <h1
            className="display-h2"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 72,
              textTransform: "uppercase",
              letterSpacing: "-0.02em",
              lineHeight: 0.95,
            }}
          >
            BUILD&apos;S
            <br />
            ON ITS WAY.
          </h1>
          <p
            style={{
              marginTop: 16,
              color: "var(--color-muted)",
              fontSize: 15,
              maxWidth: 580,
            }}
          >
            Confirmation email is on its way. Tracking lands in your inbox once
            we ship — usually within 24 hours.
          </p>
          <div
            style={{
              display: "flex",
              gap: 10,
              marginTop: 28,
              flexWrap: "wrap",
            }}
          >
            <Link
              href={`/account/orders/${orderId}`}
              prefetch={false}
              className="btn btn-primary"
            >
              VIEW ORDER STATUS
            </Link>
            <Link href="/" className="btn">
              CONTINUE SHOPPING
            </Link>
          </div>
        </div>
      </div>

      {/* Cycle 14X+ post-sync (Sam re-review L-7): when "ADD TO CART
          ANYWAY" is allowed on misfit, customers might end up with an
          order that doesn't match their saved garage vehicle (gift,
          second vehicle, etc.). Add a polite fitment-guarantee callout
          on every confirmation so misfit-purchase customers (and anyone
          else) sees the path to a free return if needed. */}
      <div
        className="container-x"
        style={{ paddingTop: 32, paddingBottom: 0 }}
      >
        <div
          style={{
            padding: "14px 18px",
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div style={{ color: "var(--color-primary)", flexShrink: 0 }}>
            <Icons.shield size={20} sw={2} />
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.55 }}>
            <strong>Fitment guaranteed.</strong> If something doesn&apos;t bolt
            on as listed — or you ordered for a different vehicle — return it
            free within 30 days. We cover the FedEx label.{" "}
            <Link
              href="/legal/fitment-guarantee"
              style={{ color: "var(--color-primary)" }}
            >
              See policy →
            </Link>
          </div>
        </div>
      </div>

      <div
        className="container-x"
        style={{ paddingTop: 56, paddingBottom: 64 }}
      >
        <div className="eyebrow" style={{ marginBottom: 20 }}>
          ORDER STATUS
        </div>
        <div
          className="grid grid-cols-1 md:grid-cols-4"
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            overflow: "hidden",
          }}
        >
          {TIMELINE.map((s, i, arr) => (
            <div
              key={s.label}
              style={{
                padding: 20,
                borderRight:
                  i < arr.length - 1
                    ? "1px solid var(--color-border)"
                    : 0,
                background: s.current
                  ? "var(--color-surface-2)"
                  : "transparent",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: s.done
                      ? "var(--color-success)"
                      : s.current
                        ? "var(--color-primary)"
                        : "transparent",
                    border:
                      !s.done && !s.current
                        ? "1px solid var(--color-border-2)"
                        : 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color:
                      s.done || s.current
                        ? "var(--color-background)"
                        : "var(--color-muted-2)",
                    fontSize: 10,
                    fontWeight: 700,
                    fontFamily: "var(--font-display)",
                  }}
                >
                  {s.done ? <Icons.check size={11} sw={3} /> : i + 1}
                </span>
                <span
                  className="mono"
                  style={{
                    fontSize: 11,
                    letterSpacing: "0.12em",
                    fontWeight: s.current ? 700 : 500,
                    color:
                      s.current || s.done
                        ? "var(--color-foreground)"
                        : "var(--color-muted-2)",
                  }}
                >
                  {s.label}
                </span>
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--color-muted)",
                  paddingLeft: 32,
                }}
              >
                {s.sub}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        className="container-x"
        style={{ paddingBottom: 96 }}
      >
        <div
          style={{
            background: "var(--color-primary)",
            color: "var(--color-primary-foreground)",
            borderRadius: "var(--radius-md)",
            padding: 28,
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: 16,
            alignItems: "center",
          }}
        >
          <div>
            <div
              className="mono"
              style={{
                fontSize: 11,
                letterSpacing: "0.14em",
                fontWeight: 700,
                marginBottom: 6,
              }}
            >
              INSTALL HELP
            </div>
            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 28,
                textTransform: "uppercase",
                letterSpacing: "-0.01em",
              }}
            >
              NEED A HAND BOLTING IT ON?
            </h3>
            <p
              style={{
                fontSize: 13,
                marginTop: 6,
                opacity: 0.85,
              }}
            >
              Step-by-step PDFs ship with every order. Or call our techs
              Mon–Fri 9–5 PST.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Link
              href="/help/install"
              className="btn"
              style={{
                background: "transparent",
                borderColor: "rgba(0,0,0,0.3)",
                color: "var(--color-primary-foreground)",
              }}
            >
              GUIDES
            </Link>
            <a
              href="tel:18883784536"
              className="btn"
              style={{
                background: "var(--color-background)",
                borderColor: "var(--color-background)",
                color: "var(--color-foreground)",
              }}
            >
              1-888-378-4536
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
