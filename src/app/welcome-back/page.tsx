import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Icons } from "@/components/ui/icons";
import { Stars } from "@/components/ui/stars";

export const metadata: Metadata = {
  title: "Welcome back · 10% off your return order",
  description:
    "Bought from Stehlen on eBay or Amazon? Same parts, same warehouse, lower prices direct.",
  alternates: { canonical: "/welcome-back" },
};

const PROOF = [
  {
    n: "Mike R.",
    y: "2019 Ford F-150",
    body: "Bought my roof rack on eBay 2 years ago. Switched to direct — same product, $40 cheaper, ships in a day.",
  },
  {
    n: "Dale W.",
    y: "2021 Silverado",
    body: "Direct now. The eBay listings sent me to Stehlen anyway, why pay the middle?",
  },
  {
    n: "Carlos T.",
    y: "2017 Wrangler",
    body: "Same warehouse, same parts. The trust is already built. Price is just better.",
  },
];

export default function WelcomeBackPage() {
  return (
    <main>
      <section
        style={{
          position: "relative",
          background: "var(--color-background)",
          minHeight: 480,
          overflow: "hidden",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <Image
          src="/images/hero-stehlen.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          style={{ objectFit: "cover", opacity: 0.35 }}
        />
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(10,10,10,0.6) 0%, rgba(10,10,10,0.95) 100%)",
          }}
        />
        <div
          className="container-x"
          style={{
            position: "relative",
            paddingTop: 96,
            paddingBottom: 80,
            maxWidth: 880,
          }}
        >
          <div
            className="eyebrow"
            style={{
              marginBottom: 16,
              color: "var(--color-primary)",
            }}
          >
            WELCOME BACK · NOW DIRECT
          </div>
          <h1
            className="display-h1"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 96,
              textTransform: "uppercase",
              letterSpacing: "-0.03em",
              lineHeight: 0.85,
              fontWeight: 800,
            }}
          >
            SAME PARTS.
            <br />
            <span style={{ color: "var(--color-primary)" }}>BETTER PRICE.</span>
          </h1>
          <p
            style={{
              marginTop: 24,
              fontSize: 18,
              color: "var(--color-muted)",
              maxWidth: 640,
              lineHeight: 1.6,
            }}
          >
            Bought from Stehlen on eBay or Amazon? You&apos;re in the right
            place. Same warehouse, same parts, same lifetime warranty —
            <strong style={{ color: "var(--color-foreground)" }}>
              {" "}
              10% off your first direct order
            </strong>
            .
          </p>
        </div>
      </section>

      <section
        className="container-x"
        style={{ paddingTop: 64, paddingBottom: 32 }}
      >
        <div
          style={{
            background: "var(--color-primary)",
            color: "var(--color-primary-foreground)",
            borderRadius: "var(--radius-md)",
            padding: 32,
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: 24,
            alignItems: "center",
          }}
        >
          <div>
            <div
              className="mono"
              style={{
                fontSize: 11,
                letterSpacing: "0.16em",
                fontWeight: 700,
                marginBottom: 6,
              }}
            >
              YOUR CODE
            </div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 56,
                fontWeight: 800,
                letterSpacing: "0.08em",
                lineHeight: 1,
              }}
            >
              WELCOME10
            </div>
            <p
              style={{
                marginTop: 8,
                fontSize: 13,
                opacity: 0.85,
              }}
            >
              Apply at checkout. One-time use per customer. Free shipping on
              every order — no minimum.
            </p>
          </div>
          <Link
            href="/collections"
            className="btn btn-lg"
            style={{
              background: "var(--color-background)",
              borderColor: "var(--color-background)",
              color: "var(--color-foreground)",
            }}
          >
            START SHOPPING <Icons.arrowR size={14} />
          </Link>
        </div>
      </section>

      <section
        className="container-x"
        style={{ paddingTop: 48, paddingBottom: 64 }}
      >
        <div className="eyebrow" style={{ marginBottom: 8 }}>
          WHY DIRECT?
        </div>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 36,
            textTransform: "uppercase",
            letterSpacing: "-0.02em",
            marginBottom: 32,
          }}
        >
          What changes when you skip the middleman.
        </h2>
        <div
          className="grid grid-cols-1 md:grid-cols-3"
          style={{ gap: 16 }}
        >
          {[
            {
              Icon: Icons.bolt,
              h: "Lower prices",
              b: "Average $30 less than the same SKU on eBay or Amazon.",
            },
            {
              Icon: Icons.shipping,
              h: "Faster shipping",
              b: "Ships from CA, NV, or TX warehouses within 24h. Always free, no minimum.",
            },
            {
              Icon: Icons.shield,
              h: "Direct support",
              b: "Real techs Mon–Fri 9–5 PST. No marketplace ticket queues.",
            },
          ].map((c) => (
            <div
              key={c.h}
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                padding: 24,
              }}
            >
              <div style={{ color: "var(--color-primary)", marginBottom: 12 }}>
                <c.Icon size={22} />
              </div>
              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 18,
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                {c.h}
              </h3>
              <p
                style={{
                  color: "var(--color-muted)",
                  fontSize: 13,
                  lineHeight: 1.6,
                }}
              >
                {c.b}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section
        style={{ background: "var(--color-surface)" }}
      >
        <div
          className="container-x"
          style={{ paddingTop: 64, paddingBottom: 64 }}
        >
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            FROM RETURNERS
          </div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 36,
              textTransform: "uppercase",
              letterSpacing: "-0.02em",
              marginBottom: 32,
            }}
          >
            Drivers who already made the switch.
          </h2>
          <div
            className="grid grid-cols-1 md:grid-cols-3"
            style={{ gap: 16 }}
          >
            {PROOF.map((r) => (
              <div
                key={r.n}
                style={{
                  background: "var(--color-background)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  padding: 24,
                }}
              >
                <Stars rating={5} size={13} />
                <p
                  style={{
                    fontSize: 14,
                    lineHeight: 1.55,
                    margin: "12px 0 16px",
                  }}
                >
                  &ldquo;{r.body}&rdquo;
                </p>
                <div
                  className="mono"
                  style={{
                    fontSize: 11,
                    letterSpacing: "0.08em",
                  }}
                >
                  {r.n.toUpperCase()}{" "}
                  <span style={{ color: "var(--color-muted)" }}>
                    · {r.y.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
