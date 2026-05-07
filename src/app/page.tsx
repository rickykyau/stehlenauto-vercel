import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getCategories, getPopularVehicles } from "@/lib/catalog";
import { TrustRow } from "@/components/ui/trust-row";
import { Icons } from "@/components/ui/icons";
import { YmmButton } from "@/components/fitment/ymm-button";

export const revalidate = 3600;

// Cycle 14X+ (partner feedback): map of popular-vehicle slugs to the
// latest-generation photo in /public/images/vehicle-gens. Slugs match the
// vehicle hub URL pattern. Now covers all 8 popular vehicles — the three
// trailing rows (Tundra, Sierra, Frontier) use Wikimedia Commons photos
// under CC-BY-SA; attribution lives in /legal/credits per the license.
const POPULAR_VEHICLE_PHOTOS: Record<string, string> = {
  "ford-f-150": "/images/vehicle-gens/ford-f-150-p702.jpg",
  "chevrolet-silverado": "/images/vehicle-gens/chevrolet-silverado-t1xx.jpg",
  "ram-1500": "/images/vehicle-gens/ram-1500-dt.jpg",
  "toyota-tacoma": "/images/vehicle-gens/toyota-tacoma-n400.jpg",
  "jeep-wrangler": "/images/vehicle-gens/jeep-wrangler-jl.jpg",
  "toyota-tundra": "/images/vehicle-gens/toyota-tundra-3rd-gen.jpg",
  "gmc-sierra": "/images/vehicle-gens/gmc-sierra-t1xx.jpg",
  "nissan-frontier": "/images/vehicle-gens/nissan-frontier-d41.jpg",
};

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

            {/* Cycle 14X+ (partner feedback): the inline YMM card inside
                the hero was redundant with the yellow "FIND PARTS FOR
                YOUR RIDE" YMM band immediately below the hero, and the
                YEAR / MAKE / MODEL chips looked like text inputs but
                were modal-trigger buttons — partners reported it as
                "the search box is not working." Removed entirely; the
                yellow band on the next section is the single source of
                truth for inline YMM on the home page. */}

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

      {/* Cycle 14X+ (partner feedback): the BEST SELLERS THIS MONTH grid
          used to live here as the 01 section. Partners want the lead
          slot to be SHOP BY CATEGORY (browse-first), with a feature-
          items video clip eventually replacing this. Removed for now;
          add back as a video block when the warehouse delivers footage. */}

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
              BROWSE
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
                // Cycle 14X+ (Mike-O11 F-1 NIT): wrapper padding dropped
                // 24 → 0 so the gray .product-img-bg fills the tile edge-
                // to-edge, matching the vehicle-hub treatment. Title +
                // arrow now live BELOW the image area in their own padded
                // strip so the tile reads as a single panel, not a photo
                // suspended inside a gray-on-gray frame.
                background: "var(--color-surface)",
                padding: 0,
                display: "flex",
                flexDirection: "column",
                position: "relative",
                overflow: "hidden",
                aspectRatio: "1.05",
              }}
            >
              <div
                className="product-img-bg"
                style={{
                  flex: 1,
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
              {/* Cycle 14X+ (Mike-O11 F-1 NIT): wrapper padding moved from
                  the outer Link onto this title strip so the image fills
                  edge-to-edge. */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 8,
                  padding: "12px 14px",
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
              BROWSE
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
          {popularVehicles.map((v) => {
            // Cycle 14X+ (partner feedback): popular-vehicle cards used to
            // be text-only. Map make+model → latest-gen photo from
            // /public/images/vehicle-gens (the same shots the /vehicle/[slug]
            // hub uses) so customers visually pick their truck. When a make
            // doesn't yet have a gen photo (Tundra/Sierra/Frontier today),
            // fall back to the truck silhouette icon.
            const slug = `${v.make.toLowerCase()}-${v.model.toLowerCase().replace(/\s+/g, "-")}`;
            const photo = POPULAR_VEHICLE_PHOTOS[slug] ?? null;
            return (
            <Link
              key={`${v.make}-${v.model}`}
              href={`/vehicle/${slug}`}
              style={{
                display: "flex",
                flexDirection: "column",
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                overflow: "hidden",
              }}
            >
              <div
                className="product-img-bg"
                style={{
                  position: "relative",
                  aspectRatio: "1.6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                {photo ? (
                  <Image
                    src={photo}
                    alt={`${v.make} ${v.model}`}
                    fill
                    sizes="(min-width: 768px) 25vw, 50vw"
                    style={{ objectFit: "cover" }}
                  />
                ) : (
                  <div style={{ color: "var(--color-muted)" }}>
                    <Icons.truck size={36} sw={1.5} />
                  </div>
                )}
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  padding: 14,
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
              </div>
            </Link>
          );
          })}
        </div>
      </section>

      {/* Cycle 14X+ (partner feedback): removed the "BUILT BY DRIVERS,
          FOR DRIVERS" trust grid AND the "JUST RESTOCKED" product rail.
          The trust messages those cards carried (fitment guarantee,
          drilling-free install, ships from CA/NV/TX) are already covered
          by the TrustRow above and the footer. The JUST RESTOCKED rail
          duplicated catalog discovery from the SHOP BY CATEGORY grid
          higher on the page. */}
    </main>
  );
}
