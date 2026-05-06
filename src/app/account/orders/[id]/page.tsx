import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Icons } from "@/components/ui/icons";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order Detail",
  robots: { index: false, follow: false },
};

const SAMPLE_ITEMS = [
  {
    sku: "RR-LP-UNI-STL-2",
    title: "Stehlen Door-Frame Mount Roof Rack",
    subtitle: "Black / Steel / Crew Cab",
    qty: 1,
    price: 489,
    fitFor: "2018 Ford F-150",
  },
  {
    sku: "GR-TOR03-H-BK",
    title: "Stehlen Horizontal Style Grille",
    subtitle: "Gloss Black / Horizontal",
    qty: 1,
    price: 219,
    fitFor: "2018 Ford F-150",
  },
];

const TIMELINE = [
  {
    label: "ORDER PLACED",
    sub: "Today · 2:14 PM PST",
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

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const { id } = await params;
  const subtotal = SAMPLE_ITEMS.reduce((s, l) => s + l.price * l.qty, 0);
  const tax = subtotal * 0.0875;
  const total = subtotal + tax;

  return (
    <main>
      {/* Hero */}
      <div
        style={{
          background:
            "linear-gradient(180deg, var(--color-surface) 0%, var(--color-background) 100%)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <div
          className="container-x"
          style={{ paddingTop: 48, paddingBottom: 48 }}
        >
          <Link
            href="/account?tab=orders"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              color: "var(--color-muted)",
              marginBottom: 12,
            }}
          >
            <Icons.chevLeft size={11} /> ORDERS
          </Link>
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            ORDER #{id}
          </div>
          <h1
            className="display-h2"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 56,
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
              maxWidth: 520,
            }}
          >
            Tracking lands in your inbox once we ship. Until then, here&apos;s
            everything we know.
          </p>
          <div
            style={{
              display: "flex",
              gap: 8,
              marginTop: 24,
              flexWrap: "wrap",
            }}
          >
            <button type="button" className="btn">
              <Icons.external size={12} /> TRACK SHIPMENT
            </button>
            <Link
              href={`/returns/${id}`}
              className="btn"
              style={{ borderColor: "var(--color-border-2)" }}
            >
              START A RETURN
            </Link>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div
        className="container-x"
        style={{ paddingTop: 48, paddingBottom: 24 }}
      >
        <div className="eyebrow" style={{ marginBottom: 16 }}>
          STATUS
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

      {/* Items + summary */}
      <div
        className="container-x grid grid-cols-1 md:grid-cols-[1fr_380px]"
        style={{ paddingBottom: 64, gap: 32 }}
      >
        <div>
          <div className="eyebrow" style={{ marginBottom: 12 }}>
            ITEMS · {SAMPLE_ITEMS.length}
          </div>
          <div
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              overflow: "hidden",
            }}
          >
            {SAMPLE_ITEMS.map((l, i) => (
              <div
                key={l.sku}
                className="grid grid-cols-[1fr_auto]"
                style={{
                  gap: 16,
                  padding: 16,
                  alignItems: "center",
                  borderBottom:
                    i < SAMPLE_ITEMS.length - 1
                      ? "1px solid var(--color-border)"
                      : 0,
                }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>
                    {l.title}
                  </div>
                  <div
                    className="mono"
                    style={{
                      fontSize: 10,
                      color: "var(--color-muted)",
                      letterSpacing: "0.08em",
                      marginTop: 4,
                    }}
                  >
                    SKU {l.sku} · QTY {l.qty}
                  </div>
                  <div
                    style={{
                      marginTop: 6,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Icons.check size={11} />
                    <span
                      className="mono"
                      style={{
                        fontSize: 10,
                        color: "var(--color-success)",
                        letterSpacing: "0.08em",
                      }}
                    >
                      FITS {l.fitFor.toUpperCase()}
                    </span>
                  </div>
                </div>
                <span
                  className="mono"
                  style={{ fontSize: 14, fontWeight: 700 }}
                >
                  ${(l.price * l.qty).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <DetailBox title="SHIPPING TO">
            <strong>Mike Rodriguez</strong>
            <br />
            2418 W Cactus Rd
            <br />
            Phoenix, AZ 85029
          </DetailBox>
          <DetailBox title="SHIPPING METHOD">
            <strong>Standard Ground · FREE</strong>
            <br />
            <span style={{ color: "var(--color-muted)" }}>
              Estimated delivery: 4–6 business days
            </span>
          </DetailBox>
          <DetailBox title="PAYMENT">
            <span className="mono" style={{ letterSpacing: "0.08em" }}>
              VISA •••• 4242
            </span>
            <br />
            <span style={{ color: "var(--color-muted)" }}>
              Charged ${total.toFixed(2)}
            </span>
          </DetailBox>

          <div
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <Row label="Subtotal" value={`$${subtotal.toFixed(2)}`} />
            <Row label="Shipping" value="FREE" success />
            <Row label="Tax" value={`$${tax.toFixed(2)}`} muted />
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
                style={{ fontSize: 20, fontWeight: 700 }}
              >
                ${total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function DetailBox({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        padding: 16,
      }}
    >
      <div
        className="mono"
        style={{
          fontSize: 10,
          color: "var(--color-muted)",
          letterSpacing: "0.14em",
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      <div style={{ fontSize: 13, lineHeight: 1.6 }}>{children}</div>
    </div>
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
