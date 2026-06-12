import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Icons } from "@/components/ui/icons";
import { ProductCard } from "@/components/commerce/product-card";
import { searchProducts, getBestSellers } from "@/lib/catalog";
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

// Year with the MOST catalog coverage for this make/model. The email targets a
// make/model, not an exact year, so probing fitment at the latest year (2026)
// was wrong — most F-150 inventory is tagged for ranges ending ~2024, so at
// 2026 nearly everything read "doesn't fit" and the grid collapsed to 1 card.
// Coverage naturally peaks mid-range (where the most product year-ranges
// overlap) and is sparse at the newest/EV edge — exactly the year that
// surfaces the most fitting products and the greenest PDPs.
function bestYearFor(make: string, model: string): number {
  const tree = ymmTreeData as Record<string, Record<string, Record<string, string[]>>>;
  const ml = model.toLowerCase();
  let bestYear = 0;
  let bestCount = -1;
  for (const [yr, makes] of Object.entries(tree)) {
    const y = Number(yr);
    if (!y) continue;
    const models = makes?.[titleCase(make)] ?? makes?.[make];
    if (!models) continue;
    let count = 0;
    for (const [m, handles] of Object.entries(models)) {
      if (m.toLowerCase() === ml) count += Array.isArray(handles) ? handles.length : 0;
    }
    // strict > keeps the EARLIEST year of a coverage plateau (mid-range),
    // avoiding the sparse newest/EV edge on ties.
    if (count > bestCount) {
      bestCount = count;
      bestYear = y;
    }
  }
  return bestYear || latestYearFor(make, model);
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
    ? `SHOP PARTS FOR MY ${titleCase(make).toUpperCase()} ${titleCase(model).toUpperCase()}`
    : "BROWSE ALL PARTS";

  // ── Vehicle-tailored merchandising ───────────────────────────────────────
  // Top picks that FIT this vehicle (same engine as /vehicle/[slug]) + the
  // categories that actually have parts for it — so the LP shows real products
  // with photos + review stars and pulls the shopper deeper into the site.
  let fitProducts: typeof PRODUCTS = [];
  let browseCats: typeof CATEGORIES = [];
  if (hasVehicle) {
    const year = bestYearFor(make, model);
    const fitVehicle = { year: String(year), make: titleCase(make), model: titleCase(model) };
    // The email targets a make/model, not an exact year. Show make/model-relevant,
    // in-stock products that are NOT a confirmed misfit and NOT an EV-only variant
    // we can't vouch for. Allow unknown-fit (fits===undefined) — the card carries
    // its own fitment badge and the PDP gives the honest per-year verdict, so we
    // get a full, eye-catching grid without over-promising.
    const sellable = (p: (typeof PRODUCTS)[number]) =>
      p.fits !== false && p.inventory > 0 && !isEvOnlyVariant(p);
    try {
      const found = withFitment(
        await searchProducts(`${make} ${model}`, 24),
        fitVehicle,
        null,
      ).filter(sellable);
      // Lead with confirmed-fit cards, then fill with unknown-fit so the grid is
      // always full (6) instead of collapsing to the 1-2 exact-year matches.
      const confirmed = found.filter((p) => p.fits === true);
      const rest = found.filter((p) => p.fits !== true);
      fitProducts = [...confirmed, ...rest].slice(0, 6);
    } catch {
      fitProducts = [];
    }
    const avail = getAvailableCategoriesForMakeModel(make, model);
    browseCats = CATEGORIES.filter((c) => avail.has(c.slug)).slice(0, 6);
    if (browseCats.length === 0) browseCats = CATEGORIES.slice(0, 6);
  } else {
    // No vehicle in the link (generic email / shared URL): the LP must STILL be
    // product-forward, never all-text. Lead with best-sellers + top categories
    // so every visitor — any make/model or none — lands on real products.
    try {
      fitProducts = (await getBestSellers(8))
        .filter((p) => p.inventory > 0 && !isEvOnlyVariant(p))
        .slice(0, 6);
    } catch {
      fitProducts = [];
    }
    browseCats = CATEGORIES.slice(0, 6);
  }
  // Surface real Amazon review stars on the cards (ProductCard renders the
  // rating row when reviews > 0) — social proof is the conversion lever here.
  fitProducts = fitProducts.map((p) => {
    const r = REVIEW_BY_HANDLE[p.handle];
    return r && r.count > 0 ? { ...p, rating: r.rating, reviews: r.count } : p;
  });
  const fitVehicleForCard = hasVehicle
    ? { year: String(bestYearFor(make, model)), make: titleCase(make), model: titleCase(model) }
    : undefined;

  return (
    <main style={{ background: "var(--color-background)" }}>
      <WelcomeBackInit
        code={code}
        make={hasVehicle ? titleCase(make) : undefined}
        model={hasVehicle ? titleCase(model) : undefined}
        year={hasVehicle ? bestYearFor(make, model) : undefined}
        utm={utm}
      />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      {/* Full-bleed image-first hero. Vehicle-personalized headline sits on a
          layered gradient so text is always legible. CTA bleeds directly into
          the offer band below — single yellow moment anchored at the bottom
          of the hero. Height capped well under one screen so the offer band +
          first product row PEEK at the bottom of the fold (retail pattern:
          show there's more, pull the eye down to the products — owner asked to
          see pictures without a full extra scroll). */}
      <section
        style={{
          position: "relative",
          minHeight: "min(58svh, 480px)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          overflow: "hidden",
        }}
      >
        {/* Background image — boosted opacity vs the old 0.35 ghost */}
        <Image
          src="/images/hero-stehlen.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          style={{ objectFit: "cover", objectPosition: "center center", opacity: 0.55 }}
        />

        {/* Bottom-to-top gradient — text sits in the dark zone */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(10,10,10,0.25) 0%, rgba(10,10,10,0.55) 40%, rgba(10,10,10,0.97) 100%)",
          }}
        />

        {/* Yellow top-edge rule — brand entry signal */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: "var(--color-primary)",
          }}
        />

        {/* Hero copy */}
        <div
          className="container-x"
          style={{
            position: "relative",
            zIndex: 1,
            paddingBottom: 48,
            paddingTop: 80,
          }}
        >
          {/* Eyebrow */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 20,
              padding: "6px 12px",
              background: "rgba(245,168,35,0.15)",
              border: "1px solid rgba(245,168,35,0.35)",
              borderRadius: "var(--radius-sm)",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--color-primary)",
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "var(--color-primary)",
              }}
            >
              WELCOME BACK &mdash; NOW DIRECT
            </span>
          </div>

          {/* Main headline — personalized when vehicle present */}
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(40px, 10vw, 88px)",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "-0.03em",
              lineHeight: 0.9,
              margin: "0 0 24px",
              maxWidth: 820,
            }}
          >
            {hasVehicle ? (
              <>
                YOUR{" "}
                <span style={{ color: "var(--color-primary)" }}>
                  {titleCase(make).toUpperCase()}
                  <br />
                  {titleCase(model).toUpperCase()}
                </span>
                <br />
                UPGRADED.
              </>
            ) : (
              <>
                SAME PARTS.
                <br />
                <span style={{ color: "var(--color-primary)" }}>BETTER PRICE.</span>
              </>
            )}
          </h1>

          {/* Sub-copy */}
          <p
            style={{
              fontSize: 16,
              lineHeight: 1.6,
              color: "var(--color-muted-warm)",
              maxWidth: 520,
              margin: "0 0 32px",
            }}
          >
            {hasVehicle ? (
              <>
                You bought from Stehlen on eBay. Now shop direct — same warehouse, same
                lifetime warranty, lower price. Your{" "}
                <strong style={{ color: "var(--color-foreground)" }}>10% off code</strong>{" "}
                applies automatically. Free shipping, no minimum.
              </>
            ) : (
              <>
                Bought from Stehlen on eBay or Amazon? Same warehouse, same lifetime
                warranty —{" "}
                <strong style={{ color: "var(--color-foreground)" }}>
                  10% off your first direct order
                </strong>
                , free shipping on everything.
              </>
            )}
          </p>

          {/* CTA */}
          <Link
            href={shopHref}
            className="btn btn-primary btn-lg"
            style={{ fontSize: 14, letterSpacing: "0.1em" }}
          >
            {shopLabel}
            <Icons.arrowR size={16} />
          </Link>
        </div>
      </section>

      {/* ── OFFER BAND ───────────────────────────────────────────────────── */}
      {/* Visual reward — the code is the hero of this strip, large and proud.
          Warm-off-black bg shifts section tone and separates hero from products. */}
      <section
        style={{
          background: "var(--color-surface-warm)",
          borderTop: "1px solid rgba(245,168,35,0.2)",
          borderBottom: "1px solid rgba(245,168,35,0.2)",
        }}
      >
        <div
          className="container-x"
          style={{
            paddingTop: 40,
            paddingBottom: 40,
          }}
        >
          <div
            className="wb-offer-layout"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: 32,
              alignItems: "center",
            }}
          >
            {/* Left: code + detail */}
            <div>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "var(--color-muted-warm)",
                  marginBottom: 10,
                }}
              >
                YOUR EXCLUSIVE CODE &mdash; APPLIED AT CHECKOUT
              </div>

              {/* Code stamp — Cycle 14BG (Jordan F-12): demoted from full
                  yellow fill to outlined yellow-on-dark. The hero's yellow
                  "BROWSE ALL PARTS" CTA and this stamp were two yellow
                  blocks in the same viewport — violating the one-yellow-
                  per-viewport rule and splitting attention. The stamp still
                  reads as the offer (yellow type + border) without
                  competing with the primary CTA for the yellow slot. */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 16,
                  background: "var(--color-surface-2)",
                  color: "var(--color-primary)",
                  border: "1px solid rgba(245,168,35,0.55)",
                  padding: "10px 24px",
                  borderRadius: "var(--radius-sm)",
                  marginBottom: 12,
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "clamp(28px, 8vw, 52px)",
                    fontWeight: 900,
                    letterSpacing: "0.06em",
                    lineHeight: 1,
                  }}
                >
                  {code}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    paddingLeft: 16,
                    borderLeft: "2px solid rgba(245,168,35,0.3)",
                    color: "var(--color-foreground)",
                  }}
                >
                  10% OFF
                  <br />
                  YOUR ORDER
                </span>
              </div>

              <p style={{ fontSize: 14, color: "var(--color-muted-warm)", margin: 0 }}>
                No need to type it &mdash; already in your cart. Plus{" "}
                <strong style={{ color: "var(--color-foreground)" }}>
                  free shipping on every order, no minimum.
                </strong>
              </p>
            </div>

            {/* Right: trust stats stack */}
            <div
              className="wb-stats"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                borderLeft: "1px solid var(--color-border)",
                paddingLeft: 32,
              }}
            >
              {[
                { num: "$30", label: "Avg savings vs eBay" },
                { num: "24h", label: "Ships from CA · NV · TX" },
                { num: "30d", label: "Free returns, prepaid label" },
              ].map((s) => (
                <div key={s.num} style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "clamp(22px, 4vw, 32px)",
                      fontWeight: 800,
                      color: "var(--color-foreground)",
                      lineHeight: 1,
                    }}
                  >
                    {s.num}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--color-muted-warm)",
                      letterSpacing: "0.06em",
                      marginTop: 2,
                    }}
                  >
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TOP PICKS ────────────────────────────────────────────────────── */}
      {/* Products are the page's primary visual asset — lead with them, give
          them room to breathe. Section on background keeps the warm-dark offer
          band reading as a clear separator above. */}
      {fitProducts.length > 0 && (
        <section
          className="container-x"
          style={{ paddingTop: 64, paddingBottom: 64 }}
        >
          {/* Section header with yellow accent rule */}
          <div style={{ marginBottom: 32 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 3,
                  background: "var(--color-primary)",
                  borderRadius: 2,
                  flexShrink: 0,
                }}
              />
              <span
                className="eyebrow"
                style={{ color: "var(--color-primary)" }}
              >
                {hasVehicle
                  ? `PICKED FOR YOUR ${titleCase(make).toUpperCase()} ${titleCase(model).toUpperCase()}`
                  : "POPULAR RIGHT NOW"}
              </span>
            </div>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(26px, 5vw, 40px)",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "-0.02em",
                lineHeight: 1.05,
                margin: 0,
              }}
            >
              {hasVehicle
                ? `Top upgrades for your ${vehicleLabel}.`
                : "Best-selling upgrades."}
            </h2>
          </div>

          {/* Product grid — 2-up on mobile (full-width cards), 3-up on tablet,
              auto-fill on desktop. More generous gap than before. */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 16,
            }}
            className="wb-product-grid"
          >
            {fitProducts.map((p) => (
              <ProductCard key={p.sku} product={p} vehicle={fitVehicleForCard} />
            ))}
          </div>

          <div
            style={{
              marginTop: 40,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Link
              href={shopHref}
              className="btn btn-primary btn-lg"
              style={{ fontSize: 14, letterSpacing: "0.1em", minWidth: 280 }}
            >
              {shopLabel}
              <Icons.arrowR size={16} />
            </Link>
          </div>
        </section>
      )}

      {/* ── SHOP BY CATEGORY ─────────────────────────────────────────────── */}
      {/* Photographic category tiles on a warm-off-black surface — visual
          texture break between the product grid and the trust section.
          Image-forward design borrowed from RoughCountry category entry
          points: photo fills the tile, name overlays the bottom. */}
      {browseCats.length > 0 && (
        <section style={{ background: "var(--color-surface-warm)" }}>
          <div
            className="container-x"
            style={{ paddingTop: 56, paddingBottom: 56 }}
          >
            <div style={{ marginBottom: 28 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 3,
                    background: "var(--color-primary)",
                    borderRadius: 2,
                    flexShrink: 0,
                  }}
                />
                <span
                  className="eyebrow"
                  style={{ color: "var(--color-muted-warm)" }}
                >
                  SHOP BY CATEGORY
                </span>
              </div>
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(22px, 4vw, 32px)",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "-0.02em",
                  margin: 0,
                }}
              >
                {hasVehicle
                  ? `More for your ${vehicleLabel}`
                  : "Everything your vehicle needs"}
              </h2>
            </div>

            {/* Photo tiles — image-first, name overlay at bottom */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: 12,
              }}
              className="wb-cat-grid"
            >
              {browseCats.map((c) => (
                <Link
                  key={c.slug}
                  href={
                    hasVehicle
                      ? `/collections/${c.slug}?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`
                      : `/collections/${c.slug}`
                  }
                  style={{
                    position: "relative",
                    display: "block",
                    aspectRatio: "4/3",
                    borderRadius: "var(--radius-md)",
                    overflow: "hidden",
                    border: "1px solid var(--color-border)",
                    background: "var(--color-surface)",
                  }}
                >
                  {/* Category image */}
                  {c.image && (
                    <Image
                      src={c.image}
                      alt={c.name}
                      fill
                      sizes="(min-width: 1024px) 18vw, (min-width: 640px) 25vw, 45vw"
                      style={{ objectFit: "cover", opacity: 0.72 }}
                    />
                  )}
                  {/* Bottom gradient + label */}
                  <div
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(180deg, transparent 35%, rgba(10,10,10,0.88) 100%)",
                    }}
                  />
                  {/* Hover tint */}
                  <div
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "rgba(245,168,35,0.0)",
                      transition: "background 160ms ease",
                    }}
                    className="wb-cat-hover-tint"
                  />
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      padding: "10px 14px 12px",
                      display: "flex",
                      alignItems: "flex-end",
                      justifyContent: "space-between",
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: 13,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        lineHeight: 1.2,
                        color: "var(--color-foreground)",
                      }}
                    >
                      {c.name}
                    </span>
                    <span
                      style={{
                        flexShrink: 0,
                        color: "var(--color-primary)",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <Icons.arrowR size={14} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── WHY DIRECT + CONFIDENCE — merged single section ──────────────── */}
      {/* One trust section instead of two separate text-card blocks.
          Large number stats (stat-bar style) read immediately on scan.
          Individual guarantee cards below for detail. Surface on background
          separates cleanly from the warm-dark category section above. */}
      <section
        style={{
          background: "var(--color-background)",
          borderTop: "1px solid var(--color-border)",
        }}
      >
        <div
          className="container-x"
          style={{ paddingTop: 64, paddingBottom: 80 }}
        >
          {/* Heading */}
          <div style={{ marginBottom: 40 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 3,
                  background: "var(--color-primary)",
                  borderRadius: 2,
                  flexShrink: 0,
                }}
              />
              <span className="eyebrow">WHY DIRECT?</span>
            </div>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(26px, 5vw, 40px)",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "-0.02em",
                margin: 0,
              }}
            >
              Skip the middleman. Keep the savings.
            </h2>
          </div>

          {/* Stat bar — big numbers, scannable in 2 seconds */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
              background: "var(--color-surface)",
              marginBottom: 40,
              overflow: "hidden",
            }}
            className="wb-stat-bar"
          >
            {[
              { num: "~$30", sub: "cheaper than eBay, same SKU" },
              { num: "24h", sub: "ships from CA · NV · TX" },
              { num: "Free", sub: "shipping on every order" },
            ].map((s, i) => (
              <div
                key={s.num}
                style={{
                  padding: "28px 20px",
                  borderRight: i < 2 ? "1px solid var(--color-border)" : "none",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "clamp(28px, 6vw, 44px)",
                    fontWeight: 900,
                    letterSpacing: "-0.03em",
                    color: "var(--color-foreground)",
                    lineHeight: 1,
                    marginBottom: 6,
                  }}
                >
                  {s.num}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--color-muted)",
                    letterSpacing: "0.04em",
                    lineHeight: 1.4,
                  }}
                >
                  {s.sub}
                </div>
              </div>
            ))}
          </div>

          {/* Guarantee cards — 3-up, surface-2 for depth separation */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 12,
            }}
            className="wb-guarantee-grid"
          >
            {[
              {
                Icon: Icons.shield,
                h: "Fitment guarantee",
                b: "Tell us your year, make, and model. We confirm fit before it ships, or returns are free.",
              },
              {
                Icon: Icons.shipping,
                h: "Free returns — 30 days",
                b: "Prepaid label included. No minimum order, no restocking fee, no questions.",
              },
              {
                Icon: Icons.bolt,
                h: "Same warehouse you trust",
                b: "Exact parts you bought on eBay. Same stock, same manufacturer warranty.",
              },
            ].map((c) => (
              <div
                key={c.h}
                style={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  padding: "24px 20px",
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "var(--radius-sm)",
                    background: "rgba(245,168,35,0.1)",
                    border: "1px solid rgba(245,168,35,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--color-primary)",
                    marginBottom: 16,
                  }}
                >
                  <c.Icon size={20} />
                </div>
                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 15,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    marginBottom: 10,
                  }}
                >
                  {c.h}
                </h3>
                <p
                  style={{
                    color: "var(--color-muted)",
                    fontSize: 14,
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {c.b}
                </p>
              </div>
            ))}
          </div>

          {/* Final CTA */}
          <div
            style={{
              marginTop: 48,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Link
              href={shopHref}
              className="btn btn-primary btn-lg"
              style={{ fontSize: 14, letterSpacing: "0.1em", minWidth: 280 }}
            >
              {shopLabel}
              <Icons.arrowR size={16} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
