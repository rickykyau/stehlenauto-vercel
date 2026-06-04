import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Icons } from "@/components/ui/icons";
import { WelcomeBackInit } from "./welcome-back-init";

export const metadata: Metadata = {
  title: "Welcome back · 10% off your return order",
  description:
    "Bought from Stehlen on eBay or Amazon? Same parts, same warehouse, lower prices direct — 10% off your first order, free shipping on everything.",
  alternates: { canonical: "/welcome-back" },
  // audit F-7: promo reactivation landing (email/CRM traffic only) — keep it
  // out of the index so it can't become a thin/stale soft-404.
  robots: { index: false, follow: true },
};

const DEFAULT_CODE = "WELCOME10";

function titleCase(s: string): string {
  return s
    .trim()
    .split(/\s+/)
    .map((w) =>
      // keep all-caps tokens (F-150, GMC, RAM, V8) as-is; otherwise Title Case
      w === w.toUpperCase() ? w : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
    )
    .join(" ");
}

function first(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v || "").trim();
}

export default async function WelcomeBackPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const make = first(sp.make);
  const model = first(sp.model);
  const code = (first(sp.code) || DEFAULT_CODE).toUpperCase();
  const utm = first(sp.utm_content) || first(sp.utm_campaign);

  const hasVehicle = Boolean(make && model);
  const vehicleLabel = hasVehicle ? `${titleCase(make)} ${titleCase(model)}` : "";
  // Mirror the sitemap/email vehicle-slug derivation → /vehicle/[slug] hub
  // (which already handles year selection + shows parts that fit).
  const vehicleSlug = hasVehicle
    ? `${make}-${model}`.toLowerCase().replace(/\s+/g, "-")
    : "";

  const shopHref = hasVehicle ? `/vehicle/${vehicleSlug}` : "/collections";
  const shopLabel = hasVehicle
    ? `SHOP PARTS FOR MY ${titleCase(make)} ${titleCase(model)}`
    : "BROWSE PARTS FOR YOUR VEHICLE";

  return (
    <main>
      <WelcomeBackInit code={code} make={make} model={model} utm={utm} />

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
            style={{ marginBottom: 16, color: "var(--color-primary)" }}
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
            {hasVehicle ? (
              <>
                You bought from Stehlen on eBay — thanks for trusting us with your{" "}
                <strong style={{ color: "var(--color-foreground)" }}>
                  {vehicleLabel}
                </strong>
                . Now get the same parts direct:{" "}
                <strong style={{ color: "var(--color-foreground)" }}>
                  10% off your first order
                </strong>
                , free shipping on everything.
              </>
            ) : (
              <>
                Bought from Stehlen on eBay or Amazon? You&apos;re in the right
                place. Same warehouse, same parts, same lifetime warranty —{" "}
                <strong style={{ color: "var(--color-foreground)" }}>
                  10% off your first direct order
                </strong>
                , free shipping on everything.
              </>
            )}
          </p>
        </div>
      </section>

      {/* Offer band — code auto-applies at checkout via the promo cookie */}
      <section className="container-x" style={{ paddingTop: 64, paddingBottom: 32 }}>
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
          className="welcome-offer-band"
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
              YOUR CODE · APPLIED AUTOMATICALLY
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
              {code}
            </div>
            <p style={{ marginTop: 8, fontSize: 13, opacity: 0.85 }}>
              10% off your first order — added at checkout, no need to type it.{" "}
              <strong>Free shipping on every order, no minimum.</strong>
            </p>
          </div>
          <Link
            href={shopHref}
            className="btn btn-lg"
            style={{
              background: "var(--color-background)",
              borderColor: "var(--color-background)",
              color: "var(--color-foreground)",
            }}
          >
            {shopLabel} <Icons.arrowR size={14} />
          </Link>
        </div>
      </section>

      {/* Why direct */}
      <section className="container-x" style={{ paddingTop: 48, paddingBottom: 64 }}>
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
        <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 16 }}>
          {[
            {
              Icon: Icons.bolt,
              h: "Lower prices",
              b: "Average $30 less than the same SKU on eBay or Amazon.",
            },
            {
              Icon: Icons.shipping,
              h: "Free, fast shipping",
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
              <p style={{ color: "var(--color-muted)", fontSize: 13, lineHeight: 1.6 }}>
                {c.b}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Buy-with-confidence band (replaces the prior hardcoded testimonials —
          factual guarantees, no fabricated names). */}
      <section style={{ background: "var(--color-surface)" }}>
        <div className="container-x" style={{ paddingTop: 64, paddingBottom: 64 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            BUY WITH CONFIDENCE
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
            {hasVehicle
              ? `Every part confirmed to fit your ${vehicleLabel}.`
              : "Every part confirmed to fit before it ships."}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 16 }}>
            {[
              {
                Icon: Icons.shield,
                h: "Fitment guaranteed",
                b: "Tell us your year, make, and model — we confirm fit before it ships, or returns are free.",
              },
              {
                Icon: Icons.shipping,
                h: "Free shipping on all orders",
                b: "No minimum, ever. 30-day hassle-free returns with a prepaid label.",
              },
              {
                Icon: Icons.bolt,
                h: "Same warehouse you trust",
                b: "The exact parts you bought on eBay — same stock, same manufacturer warranty.",
              },
            ].map((c) => (
              <div
                key={c.h}
                style={{
                  background: "var(--color-background)",
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
                  style={{ color: "var(--color-muted)", fontSize: 13, lineHeight: 1.6 }}
                >
                  {c.b}
                </p>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 32 }}>
            <Link href={shopHref} className="btn btn-primary btn-lg">
              {shopLabel} <Icons.arrowR size={14} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
