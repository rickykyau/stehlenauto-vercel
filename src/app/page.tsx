import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  getBestSellers,
  getCategories,
  getPopularVehicles,
  getRecentlyViewed,
} from "@/lib/catalog";
import { ProductCard } from "@/components/commerce/product-card";
import { TrustRow } from "@/components/ui/trust-row";
import { Icons } from "@/components/ui/icons";
import { YmmButton } from "@/components/fitment/ymm-button";

export const revalidate = 3600;

// Cycle 14Z (Priya F-16 LOW): every other route now sets an explicit canonical;
// home was relying on Google self-canonicalizing from URL. That works, but
// leaves a consolidation gap if a `?utm_source=` or trailing-slash variant
// gets crawled. Explicit is cheap insurance.
// Cycle 14X+ (Priya F-6 HIGH): every OTHER route emits og:url + og:image,
// but the home page was inheriting only the partial layout-level OG block.
// Facebook / LinkedIn / AI scrapers (Perplexity, ChatGPT browse) that hit
// the homepage saw no image to embed. Google Discover eligibility also
// requires og:image with min 1200×630.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: {
    url: "/",
    images: [
      {
        url: "/images/hero-stehlen.jpg",
        width: 1280,
        height: 640,
        alt: "Stehlen Auto — Heavy-Duty Vehicle Accessories",
      },
    ],
  },
  twitter: {
    images: ["/images/hero-stehlen.jpg"],
  },
};

// Cycle 14Z batch 4 (Mike-O4 F-1): TESTIMONIALS removed — was hardcoded
// fake reviews used in the social-proof section. Replaced with an honest
// "WHY STEHLEN" trust grid that points to verifiable facts. Re-add real
// testimonials when verified review data (Okendo / Junip) is wired.

export default async function HomePage() {
  const [bestSellers, recentlyViewed] = await Promise.all([
    getBestSellers(4),
    getRecentlyViewed(4),
  ]);
  const categories = getCategories();
  const popularVehicles = getPopularVehicles();

  return (
    <main>
      {/* HERO — Cycle 10 (owner): mobile was breaking every word onto its
          own line because the inner column was width:40% (= ~160px on a
          400px viewport). Using a className-based container so we can switch
          column width responsively without inline-style media query hacks. */}
      <section
        className="hero-section"
        style={{
          position: "relative",
          background: "var(--color-background)",
          borderBottom: "1px solid var(--color-border)",
          overflow: "hidden",
        }}
      >
        {/* Cycle 13 (owner brand-mark): objectPosition moved to .hero-bg-img
            in globals.css so it can be responsive — desktop shifts right to
            expose the embossed "STEHLEN" panel into the negative space beside
            the content column; mobile shifts right so the mark remains visible
            even at portrait crop. */}
        <Image
          src="/images/hero-stehlen.jpg"
          alt=""
          aria-hidden="true"
          fill
          priority
          sizes="100vw"
          className="hero-bg-img"
          style={{ objectFit: "cover" }}
        />
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            /* Cycle 13 (owner brand-mark): pull the transparent stop in from 55%
             to 48% so the embossed STEHLEN panel gets clean light once the
             image is shifted right via .hero-bg-img objectPosition. */
          background:
              "linear-gradient(90deg, rgba(10,10,10,0.88) 0%, rgba(10,10,10,0.72) 18%, rgba(10,10,10,0.25) 36%, rgba(10,10,10,0) 48%)",
          }}
        />
        {/* Mobile-only full-width darken so headline stays legible when the
            text column spans the entire viewport. Hidden on md+. */}
        <div
          aria-hidden="true"
          className="hero-mobile-darken"
          style={{
            position: "absolute",
            inset: 0,
            /* Cycle 13 (owner brand-mark): angled gradient stays dark top-left
             (headline legibility) but opens up bottom-right so the embossed
             brand mark is partially visible on mobile after objectPosition
             shifts to 68% right. */
          background:
              "linear-gradient(160deg, rgba(10,10,10,0.82) 0%, rgba(10,10,10,0.72) 45%, rgba(10,10,10,0.38) 100%)",
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(245,168,35,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(245,168,35,0.04) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            mixBlendMode: "screen",
          }}
        />

        <div
          className="container-x"
          style={{
            position: "relative",
            zIndex: 2,
            paddingTop: 72,
            paddingBottom: 80,
            minHeight: 640,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "flex-start",
          }}
        >
          <div className="hero-col">
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 20,
              }}
            >
              <span
                style={{
                  width: 32,
                  height: 2,
                  background: "var(--color-primary)",
                }}
              />
              <span
                className="mono"
                style={{
                  fontSize: 11,
                  letterSpacing: "0.18em",
                  color: "rgba(255,255,255,0.85)",
                  fontWeight: 500,
                }}
              >
                STEHLEN AUTO · SINCE 2015
              </span>
            </div>
            <h1
              className="text-5xl md:text-7xl"
              style={{
                fontFamily: "var(--font-display)",
                lineHeight: 0.92,
                letterSpacing: "-0.025em",
                textTransform: "uppercase",
                fontWeight: 800,
                textShadow: "0 4px 32px rgba(0,0,0,0.6)",
              }}
            >
              BUILT TOUGH.
              <br />
              <span style={{ color: "var(--color-primary)" }}>BOLT ON.</span>
              <br />
              DRIVE OFF.
            </h1>
            <p
              style={{
                color: "rgba(255,255,255,0.85)",
                fontSize: 16,
                maxWidth: 520,
                marginTop: 18,
                lineHeight: 1.55,
                textShadow: "0 2px 8px rgba(0,0,0,0.6)",
              }}
            >
              Heavy-duty truck, SUV, and Jeep accessories engineered from
              cold-rolled steel. No drilling required. Fitment guaranteed for
              your vehicle.
            </p>

            {/* Inline YMM */}
            <div
              style={{
                marginTop: 32,
                background: "rgba(20,20,20,0.85)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "var(--radius-lg)",
                padding: 16,
                maxWidth: 580,
                boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: -1,
                  left: -1,
                  right: -1,
                  height: 2,
                  background:
                    "linear-gradient(90deg, transparent 0%, var(--color-primary) 50%, transparent 100%)",
                }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 10,
                  flexWrap: "wrap",
                  gap: 6,
                }}
              >
                <div
                  className="eyebrow"
                  style={{
                    fontSize: 11,
                    marginBottom: 0,
                    color: "rgba(255,255,255,0.6)",
                  }}
                >
                  SHOP BY VEHICLE
                </div>
                <span
                  className="mono"
                  style={{
                    fontSize: 10,
                    color: "rgba(255,255,255,0.5)",
                    letterSpacing: "0.1em",
                  }}
                >
                  FITMENT GUARANTEED
                </span>
              </div>
              <div
                className="grid grid-cols-2 md:grid-cols-[1fr_1fr_1fr_auto]"
                style={{ gap: 8 }}
              >
                <YmmButton
                  className="select"
                  style={{
                    height: 48,
                    display: "flex",
                    alignItems: "center",
                    color: "var(--color-muted-2)",
                    cursor: "pointer",
                  }}
                  ariaLabel="Pick a year"
                >
                  YEAR
                </YmmButton>
                <YmmButton
                  className="select"
                  style={{
                    height: 48,
                    display: "flex",
                    alignItems: "center",
                    color: "var(--color-muted-2)",
                    cursor: "pointer",
                  }}
                  ariaLabel="Pick a make"
                >
                  MAKE
                </YmmButton>
                <YmmButton
                  className="select col-span-2 md:col-span-1"
                  style={{
                    height: 48,
                    display: "flex",
                    alignItems: "center",
                    color: "var(--color-muted-2)",
                    cursor: "pointer",
                  }}
                  ariaLabel="Pick a model"
                >
                  MODEL
                </YmmButton>
                <YmmButton
                  className="btn btn-primary col-span-2 md:col-span-1"
                  style={{ height: 48, minWidth: 140, cursor: "pointer" }}
                  ariaLabel="Open vehicle picker"
                >
                  GET STARTED <Icons.arrowR size={14} />
                </YmmButton>
              </div>
              <div
                style={{
                  marginTop: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: "rgba(255,255,255,0.65)",
                  fontSize: 12,
                }}
              >
                <Icons.shield size={13} /> Or{" "}
                <Link
                  href="/collections"
                  style={{ color: "var(--color-primary)" }}
                >
                  browse universal-fit accessories →
                </Link>
              </div>
            </div>

            {/* Trust micro-row */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 24,
                marginTop: 20,
                color: "rgba(255,255,255,0.75)",
                fontSize: 12,
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: "var(--color-success)", display: "flex" }}>
                  <Icons.check size={12} />
                </span>{" "}
                Free shipping, no minimum
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: "var(--color-success)", display: "flex" }}>
                  <Icons.check size={12} />
                </span>{" "}
                30-day returns
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: "var(--color-success)", display: "flex" }}>
                  <Icons.check size={12} />
                </span>{" "}
                Lifetime warranty
              </span>
            </div>

            {/* Secondary CTAs */}
            <div
              style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}
            >
              <Link
                href="/collections"
                className="btn"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  borderColor: "rgba(255,255,255,0.2)",
                  color: "#fff",
                  backdropFilter: "blur(8px)",
                }}
              >
                SHOP ALL PARTS <Icons.arrowR size={12} />
              </Link>
              <Link
                href="/collections/best-sellers"
                className="btn"
                style={{
                  background: "transparent",
                  borderColor: "rgba(255,255,255,0.2)",
                  color: "#fff",
                }}
              >
                BEST SELLERS
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* High-contrast YMM band — Cycle 11 (owner mobile QA): redundant with
          the hero YMM card on mobile (two pickers within 700px scroll). Hidden
          below md+; on desktop it serves a different purpose as a wide
          full-width CTA strip. */}
      <section
        className="hidden md:block"
        style={{
          background: "var(--color-primary)",
          color: "#0a0a0a",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <div
          className="container-x"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            paddingTop: 24,
            paddingBottom: 24,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14, flex: "0 0 auto" }}>
            <Icons.shield size={22} />
            <div>
              <div
                className="mono"
                style={{
                  fontSize: 11,
                  letterSpacing: "0.16em",
                  fontWeight: 700,
                  opacity: 0.7,
                }}
              >
                FITMENT GUARANTEED
              </div>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 22,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "-0.01em",
                  lineHeight: 1.1,
                }}
              >
                Find parts for your ride
              </div>
            </div>
          </div>
          <div
            className="grid grid-cols-2 md:grid-cols-[1fr_1fr_1fr_auto]"
            style={{ gap: 8, flex: 1, minWidth: 0 }}
          >
            {(["YEAR ▾", "MAKE ▾"] as const).map((label) => (
              <YmmButton
                key={label}
                ariaLabel={`Pick ${label.replace(" ▾", "")}`}
                style={{
                  height: 44,
                  background: "#0a0a0a",
                  color: "#fff",
                  borderRadius: "var(--radius-sm)",
                  fontFamily: "var(--font-display)",
                  fontSize: 12,
                  letterSpacing: "0.1em",
                  padding: "0 14px",
                  textTransform: "uppercase",
                  display: "flex",
                  alignItems: "center",
                  cursor: "pointer",
                  border: 0,
                }}
              >
                {label}
              </YmmButton>
            ))}
            <YmmButton
              className="col-span-2 md:col-span-1"
              ariaLabel="Pick model"
              style={{
                height: 44,
                background: "#0a0a0a",
                color: "#fff",
                borderRadius: "var(--radius-sm)",
                fontFamily: "var(--font-display)",
                fontSize: 12,
                letterSpacing: "0.1em",
                padding: "0 14px",
                textTransform: "uppercase",
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
                border: 0,
              }}
            >
              MODEL ▾
            </YmmButton>
            <YmmButton
              className="col-span-2 md:col-span-1"
              ariaLabel="Open vehicle picker"
              style={{
                height: 44,
                background: "#0a0a0a",
                color: "var(--color-primary)",
                borderRadius: "var(--radius-sm)",
                fontFamily: "var(--font-display)",
                fontSize: 13,
                fontWeight: 800,
                letterSpacing: "0.04em",
                padding: "0 22px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                cursor: "pointer",
                border: 0,
              }}
            >
              SEARCH <Icons.arrowR size={14} />
            </YmmButton>
          </div>
        </div>
      </section>

      {/* Best sellers */}
      <section className="container-x" style={{ paddingTop: 64, paddingBottom: 32 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 24,
          }}
        >
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>
              01 · TOP RATED
            </div>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 32,
                textTransform: "uppercase",
                letterSpacing: "-0.01em",
              }}
            >
              BEST SELLERS THIS MONTH
            </h2>
          </div>
          <Link
            href="/collections/best-sellers"
            className="mono"
            style={{
              fontSize: 12,
              color: "var(--color-muted)",
              letterSpacing: "0.08em",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            SHOP ALL →
          </Link>
        </div>
        <div
          className="grid grid-cols-2 md:grid-cols-4"
          style={{ gap: 16 }}
        >
          {bestSellers.map((p) => (
            <ProductCard key={p.sku} product={p} />
          ))}
        </div>
      </section>

      {/* Reactivation banner */}
      <section
        style={{
          background: "var(--color-surface-2)",
          borderTop: "1px solid var(--color-border)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <div
          className="container-x"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 20,
            paddingBottom: 20,
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{ width: 4, height: 36, background: "var(--color-primary)" }}
            />
            <div>
              <div
                className="mono"
                style={{
                  fontSize: 11,
                  color: "var(--color-primary)",
                  letterSpacing: "0.14em",
                }}
              >
                WELCOME BACK
              </div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>
                Bought from us on eBay or Amazon? You&apos;ll find the same parts
                here — at lower prices.
              </div>
            </div>
          </div>
          <Link href="/welcome-back" className="btn btn-sm">
            CLAIM 10% RETURNING-CUSTOMER OFFER →
          </Link>
        </div>
      </section>

      {/* Categories grid */}
      <section className="container-x" style={{ paddingTop: 64, paddingBottom: 64 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 24,
          }}
        >
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>
              02 · BROWSE
            </div>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 32,
                textTransform: "uppercase",
                letterSpacing: "-0.01em",
              }}
            >
              SHOP BY CATEGORY
            </h2>
          </div>
          <Link
            href="/collections"
            className="mono"
            style={{
              fontSize: 12,
              color: "var(--color-muted)",
              letterSpacing: "0.08em",
              display: "flex",
              alignItems: "center",
              gap: 6,
              whiteSpace: "nowrap", // Cycle 11 — owner mobile QA: was wrapping to "VIEW / ALL"
              flexShrink: 0,
            }}
          >
            VIEW ALL <Icons.arrowR size={12} />
          </Link>
        </div>
        <div
          className="grid grid-cols-2 md:grid-cols-4"
          style={{
            gap: 1,
            background: "var(--color-border)",
            border: "1px solid var(--color-border)",
          }}
        >
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/collections/${cat.slug}`}
              style={{
                background: "var(--color-surface)",
                padding: 24,
                display: "flex",
                flexDirection: "column",
                gap: 12,
                position: "relative",
                overflow: "hidden",
                aspectRatio: "1.05",
              }}
            >
              <div
                className="product-img-bg"
                style={{
                  flex: 1,
                  borderRadius: "var(--radius-sm)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: 100,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {cat.image ? (
                  // Cycle 14X+ (owner): padding dropped from 10% → 4%.
                  // Same fix as the product-card grid — the gray
                  // .product-img-bg surround read as a thick white frame
                  // around every category photo. 4% keeps a tiny gap.
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    fill
                    sizes="(min-width: 768px) 25vw, 50vw"
                    style={{ objectFit: "contain", padding: "4%" }}
                  />
                ) : (
                  <span
                    className="mono"
                    style={{
                      color: "#999",
                      fontSize: 11,
                      letterSpacing: "0.12em",
                    }}
                  >
                    {cat.name.toUpperCase()}
                  </span>
                )}
              </div>
              {/* Cycle 11 (owner mobile QA): row used to put title + arrow
                  in a flex space-between, which made long names wrap mid-word
                  and pushed the arrow onto its own line. Now title clamps to
                  exactly 2 lines (consistent tile heights), arrow lives in
                  bottom-right via absolute positioning. */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <div
                  className="mono"
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    lineHeight: 1.3,
                    minHeight: "2.6em",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    flex: 1,
                  }}
                >
                  {cat.name}
                </div>
                <Icons.arrowR size={14} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Trust row */}
      <TrustRow />

      {/* Popular vehicles */}
      <section className="container-x" style={{ paddingTop: 64, paddingBottom: 64 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 24,
          }}
        >
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>
              03 · BROWSE
            </div>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 32,
                textTransform: "uppercase",
                letterSpacing: "-0.01em",
              }}
            >
              SHOP BY POPULAR VEHICLE
            </h2>
          </div>
          <Link
            href="/collections"
            className="mono"
            style={{
              fontSize: 12,
              color: "var(--color-muted)",
              letterSpacing: "0.08em",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            ALL MAKES →
          </Link>
        </div>
        <div
          className="grid grid-cols-2 md:grid-cols-4"
          style={{ gap: 8 }}
        >
          {popularVehicles.map((v) => (
            <Link
              key={`${v.make}-${v.model}`}
              href={`/vehicle/${v.make.toLowerCase()}-${v.model.toLowerCase().replace(/\s+/g, "-")}`}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                padding: 16,
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
              }}
            >
              <div
                className="mono"
                style={{
                  fontSize: 10,
                  color: "var(--color-muted)",
                  letterSpacing: "0.1em",
                }}
              >
                {v.make.toUpperCase()}
              </div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>{v.model}</div>
              <div style={{ fontSize: 11, color: "var(--color-muted)" }}>
                {v.years}
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 4,
                }}
              >
                {/* Cycle 11 (owner mobile QA): used to be `{v.count} PARTS`
                    — direct violation of CLAUDE.md "Don't disclose product /
                    fitment counts." Replaced with action verb so the tile
                    still has a CTA on the right side. */}
                <span
                  className="mono"
                  style={{
                    fontSize: 10,
                    color: "var(--color-primary)",
                    letterSpacing: "0.08em",
                  }}
                >
                  SHOP &rarr;
                </span>
                <Icons.arrowR size={12} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Cycle 14Z batch 4 (Mike-O4 F-1): the previous social-proof section
          rendered "★ 4.7 / 5 · VERIFIED REVIEWS" with three hardcoded
          fake testimonials ("MIKE R. · 2019 F-150" etc.) — fabricated
          social proof on the highest-traffic page, FTC risk if launched.
          Replaced with an honest "WHY STEHLEN" trust section that points
          to verifiable facts (warranty, guarantee, drilling-free, since
          2015) instead of fake reviews. Re-enable a real testimonials rail
          ONLY when Okendo / Junip / verified review data is wired in
          phase 5. */}
      <section
        style={{
          background: "var(--color-surface)",
          borderTop: "1px solid var(--color-border)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <div className="container-x" style={{ paddingTop: 64, paddingBottom: 64 }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div
              className="eyebrow"
              style={{ marginBottom: 12, color: "var(--color-primary)" }}
            >
              SHIPPING DIRECT FROM CA · NV · TX SINCE 2015
            </div>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 32,
                textTransform: "uppercase",
              }}
            >
              BUILT BY DRIVERS,
              <br />
              FOR DRIVERS.
            </h2>
          </div>
          <div
            className="grid grid-cols-1 md:grid-cols-3"
            style={{ gap: 16 }}
          >
            {[
              {
                Icon: Icons.shield,
                head: "FITMENT GUARANTEE",
                body: "Backed by a money-back fitment promise. If a part doesn't bolt on as listed, we cover the return shipping and refund 100%.",
              },
              {
                Icon: Icons.truck,
                head: "DRILLING-FREE INSTALL",
                body: "Every Stehlen part is bolt-on with included hardware and torque-spec card. If a product requires drilling, the listing says so up top.",
              },
              {
                Icon: Icons.return,
                head: "DIRECT FROM THE BRAND",
                body: "Same SKUs we shipped on eBay since 2015 — now direct, with lower prices and same-day handling Mon–Fri from CA, NV, TX warehouses.",
              },
            ].map((c) => (
              <div
                key={c.head}
                style={{
                  background: "var(--color-background)",
                  border: "1px solid var(--color-border)",
                  padding: 24,
                  borderRadius: "var(--radius-md)",
                }}
              >
                <div style={{ color: "var(--color-primary)", marginBottom: 12 }}>
                  <c.Icon size={22} />
                </div>
                <div
                  className="mono"
                  style={{
                    fontSize: 11,
                    letterSpacing: "0.12em",
                    fontWeight: 700,
                    marginBottom: 8,
                  }}
                >
                  {c.head}
                </div>
                <p style={{ fontSize: 14, lineHeight: 1.55, color: "var(--color-muted)" }}>
                  {c.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cycle 14Z (Mike-O1 M-9): "RECENTLY VIEWED" was lying — the data
          source is Shopify UPDATED_AT (recently updated/restocked SKUs),
          not per-customer browsing history. A guest landing on home would
          see the same 4 products as everyone else under a label that
          implied personalization. Rename to be honest about what it is. */}
      <section className="container-x" style={{ paddingTop: 64, paddingBottom: 64 }}>
        <div className="eyebrow" style={{ marginBottom: 16 }}>
          JUST RESTOCKED
        </div>
        <div
          className="grid grid-cols-2 md:grid-cols-4"
          style={{ gap: 16 }}
        >
          {recentlyViewed.map((p) => (
            <ProductCard key={p.sku} product={p} />
          ))}
        </div>
      </section>
    </main>
  );
}
