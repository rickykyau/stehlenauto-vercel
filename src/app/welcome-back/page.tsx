import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Icons } from "@/components/ui/icons";
import { ProductCard } from "@/components/commerce/product-card";
import { searchProducts } from "@/lib/catalog";
import { CATEGORIES, PRODUCTS } from "@/lib/catalog/mock";
import { getAvailableCategoriesForMakeModel } from "@/lib/catalog/vehicle-categories";
import { withFitment } from "@/lib/fitment/match";
import ymmTreeData from "@/../data/ymm_tree.json";
import amazonReviews from "@/../data/amazon-reviews.json";
import { WelcomeBackInit } from "./welcome-back-init";

// Reactivation LP runs live product + fitment queries per vehicle.
export const dynamic = "force-dynamic";

// Star ratings keyed by Shopify handle (Amazon review import) — surfaced on
// the fitting-products grid so the LP leads with social proof.
const REVIEW_BY_HANDLE: Record<string, { rating: number; count: number }> =
  Object.fromEntries(
    Object.entries(
      (amazonReviews as { by_handle?: Record<string, { avg_rating?: number; review_count?: number }> })
        .by_handle ?? {},
    ).map(([h, v]) => [h, { rating: v.avg_rating ?? 0, count: v.review_count ?? 0 }]),
  );

// Latest catalog year for a make/model from the YMM tree (drives the fitment
// query year so the grid resolves real green "fits" cards, like the vehicle hub).
function latestYearFor(make: string, model: string): number {
  // ymm_tree shape: { year: { make: { model: handles[] } } }
  const tree = ymmTreeData as Record<string, Record<string, Record<string, string[]>>>;
  const ml = model.toLowerCase();
  let best = 0;
  for (const [yr, makes] of Object.entries(tree)) {
    const y = Number(yr);
    if (!y) continue;
    const models = makes?.[titleCase(make)] ?? makes?.[make];
    if (!models) continue;
    // Exact model match only. `startsWith` used to let "f-150" match
    // "f-150 lightning", pulling the EV's latest year into a gas-truck
    // context (P0-1) — the year then surfaced Lightning-only SKUs.
    const hasModel = Object.keys(models).some((m) => m.toLowerCase() === ml);
    if (hasModel && y > best) best = y;
  }
  return best || new Date().getUTCFullYear() - 1;
}

// P0-1 guard: this reactivation LP targets gas/diesel pickup owners by
// year+make+model only — we do NOT know the buyer's exact sub-model (e.g. an
// F-150 buyer could be gas OR Lightning EV). Because the fitment check matches
// a generic "F-150" against products whose applications list "F-150 Lightning"
// (substring includes), EV-specific SKUs leak into the grid. We can't confirm
// they fit the buyer's truck, so drop any product that reads as an EV-only
// variant. Better to show one fewer card than a part that won't fit.
function isEvOnlyVariant(p: { title?: string; fitTitle?: string; vehicleTags?: string[] }): boolean {
  const text = [p.title ?? "", p.fitTitle ?? "", ...(p.vehicleTags ?? [])]
    .join(" ")
    .toLowerCase();
  return /\b(lightning|\bev\b|electric|e-?tron|cybertruck|rivian|hummer ev)\b/.test(
    text,
  );
}

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

  // ── Vehicle-tailored merchandising ───────────────────────────────────────
  // Top picks that FIT this vehicle (same engine as /vehicle/[slug]) + the
  // categories that actually have parts for it — so the LP shows real products
  // with photos + review stars and pulls the shopper deeper into the site.
  let fitProducts: typeof PRODUCTS = [];
  let browseCats: typeof CATEGORIES = [];
  if (hasVehicle) {
    const year = latestYearFor(make, model);
    const fitVehicle = { year: String(year), make: titleCase(make), model: titleCase(model) };
    // Only surface products we can stand behind in a reactivation email:
    // confirmed fit (fits === true, never the undefined "maybe"), in stock,
    // and not an EV-only variant we can't confirm for this buyer (P0-1).
    const sellable = (p: (typeof PRODUCTS)[number]) =>
      p.fits === true && p.inventory > 0 && !isEvOnlyVariant(p);
    try {
      const hits = withFitment(
        await searchProducts(`${year} ${make} ${model}`, 16),
        fitVehicle,
        null,
      ).filter(sellable);
      if (hits.length < 4) {
        const seen = new Set(hits.map((p) => p.handle));
        const pad = withFitment(
          await searchProducts(`${make} ${model}`, 24),
          fitVehicle,
          null,
        ).filter((p) => !seen.has(p.handle) && sellable(p));
        fitProducts = [...hits, ...pad].slice(0, 4);
      } else {
        fitProducts = hits.slice(0, 4);
      }
    } catch {
      fitProducts = [];
    }
    // Surface real Amazon review stars on the cards (ProductCard renders the
    // rating row when reviews > 0) — social proof is the conversion lever here.
    fitProducts = fitProducts.map((p) => {
      const r = REVIEW_BY_HANDLE[p.handle];
      return r && r.count > 0 ? { ...p, rating: r.rating, reviews: r.count } : p;
    });
    const avail = getAvailableCategoriesForMakeModel(make, model);
    browseCats = CATEGORIES.filter((c) => avail.has(c.slug)).slice(0, 6);
    if (browseCats.length === 0) browseCats = CATEGORIES.slice(0, 6);
  }
  const fitVehicleForCard = hasVehicle
    ? { year: String(latestYearFor(make, model)), make: titleCase(make), model: titleCase(model) }
    : undefined;

  return (
    <main>
      <WelcomeBackInit
        code={code}
        make={hasVehicle ? titleCase(make) : undefined}
        model={hasVehicle ? titleCase(model) : undefined}
        year={hasVehicle ? latestYearFor(make, model) : undefined}
        utm={utm}
      />

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
          <div style={{ minWidth: 0 }}>
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
                fontSize: "clamp(30px, 9vw, 56px)",
                fontWeight: 800,
                letterSpacing: "0.04em",
                lineHeight: 1.1,
                overflowWrap: "anywhere",
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

      {/* Top picks that fit this vehicle — real products, photos, review stars */}
      {hasVehicle && fitProducts.length > 0 && (
        <section className="container-x" style={{ paddingTop: 56, paddingBottom: 16 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            PICKED FOR YOUR {titleCase(make).toUpperCase()} {titleCase(model).toUpperCase()}
          </div>
          <h2 className="fluid-h2" style={{ marginBottom: 8 }}>
            Top upgrades that fit — guaranteed.
          </h2>
          <p style={{ color: "var(--color-muted-foreground)", marginBottom: 24, maxWidth: 560 }}>
            Bolt-on, drilling-free, and confirmed for your {vehicleLabel}. Your{" "}
            <strong>{code}</strong> discount applies automatically at checkout.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 20,
            }}
          >
            {fitProducts.map((p) => (
              <ProductCard key={p.sku} product={p} vehicle={fitVehicleForCard} />
            ))}
          </div>
          <div style={{ marginTop: 28, textAlign: "center" }}>
            <Link href={shopHref} className="btn btn-primary btn-lg">
              {shopLabel} <Icons.arrowR size={14} />
            </Link>
          </div>
        </section>
      )}

      {/* Shop by category for this vehicle — keep them browsing */}
      {hasVehicle && browseCats.length > 0 && (
        <section className="container-x" style={{ paddingTop: 40, paddingBottom: 56 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            SHOP BY CATEGORY
          </div>
          <h2 className="fluid-h3" style={{ marginBottom: 20 }}>
            More for your {vehicleLabel}
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
              gap: 12,
            }}
          >
            {browseCats.map((c) => (
              <Link
                key={c.slug}
                href={`/collections/${c.slug}?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  padding: "16px 18px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-border)",
                  background: "var(--color-card)",
                  color: "var(--color-foreground)",
                  fontWeight: 600,
                  fontSize: 14,
                  textDecoration: "none",
                }}
              >
                {c.name}
                <Icons.arrowR size={14} />
              </Link>
            ))}
          </div>
        </section>
      )}

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
