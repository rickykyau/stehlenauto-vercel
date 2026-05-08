import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icons } from "@/components/ui/icons";
import { ProductCard } from "@/components/commerce/product-card";
import { YmmButton } from "@/components/fitment/ymm-button";
import { YearPicker } from "./year-picker";
import { CATEGORIES, POPULAR_VEHICLES, PRODUCTS } from "@/lib/catalog/mock";
import { searchProducts } from "@/lib/catalog";
import { withFitment } from "@/lib/fitment/match";
import { getCurrentVehicle, getSubModelAnswers } from "@/lib/garage/server";
import { breadcrumbJsonLd, jsonLdString } from "@/lib/seo/jsonld";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://stehlenauto.com";

export const dynamic = "force-dynamic";

type VehicleParams = { slug: string };

function parseSlug(slug: string): { make: string; model: string } | null {
  const decoded = decodeURIComponent(slug).toLowerCase();
  const match = POPULAR_VEHICLES.find(
    (v) =>
      `${v.make.toLowerCase()}-${v.model.toLowerCase().replace(/\s+/g, "-")}` ===
      decoded,
  );
  if (match) return { make: match.make, model: match.model };
  // Fallback: split on first hyphen, treat as make-model.
  const parts = decoded.split("-");
  if (parts.length < 2) return null;
  return {
    make: parts[0]!.replace(/\b\w/g, (c) => c.toUpperCase()),
    model: parts.slice(1).join(" ").replace(/\b\w/g, (c) => c.toUpperCase()),
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<VehicleParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const v = parseSlug(slug);
  if (!v) return { title: "Vehicle" };
  const title = `${v.make} ${v.model} Accessories`;
  const description = `Bolt-on accessories engineered for every ${v.make} ${v.model}. Drilling-free fitment guaranteed.`;
  // Cycle 14Z (Priya O-4 HIGH): vehicle hubs are heavily linked from
  // long-tail "F-150 accessories" search clusters. Without OG/Twitter,
  // shares to truck-owner Reddit / FB groups all collapse to the homepage
  // OG and lose vehicle context.
  // Cycle 14Z post-deploy (Mike-O8 F-4 NIT): include a real og:image. Hero
  // JPG is shared until warehouse delivers per-vehicle banner imagery.
  return {
    title,
    description,
    alternates: { canonical: `/vehicle/${slug}` },
    openGraph: {
      title,
      description,
      url: `/vehicle/${slug}`,
      type: "website",
      siteName: "Stehlen Auto",
      images: [
        {
          url: "/images/hero-stehlen.jpg",
          width: 1280,
          height: 640,
          alt: `Stehlen Auto — accessories for ${v.make} ${v.model}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/images/hero-stehlen.jpg"],
    },
  };
}

type Generation = {
  gen: string;
  years: string;
  code: string;
  body: string;
  popular: boolean;
  /** Most recent year of this generation - used for "Shop this gen" link. */
  latestYear: number;
  /**
   * Optional image path (in /public/images/vehicle-gens/). When absent, the
   * fallback silhouette renders. Drop a real photo in to upgrade per gen.
   */
  image?: string;
};

/**
 * Per-vehicle generation data. Pickup truck specialist (Phase-3 feedback)
 * called out that we were shipping F-150 generations on every vehicle hub —
 * a Wrangler customer was seeing "13TH GEN P702 PowerStop tailgate" on their
 * Wrangler page. That's a credibility-killer.
 *
 * For vehicles we don't have authored gen data for yet, return [] and the
 * page will skip the generations section entirely.
 */
const GENERATIONS_BY_VEHICLE: Record<string, Generation[]> = {
  "ford-f-150": [
    {
      gen: "14TH GEN", years: "2021 — 2024", code: "P702",
      body: "Aluminum body, hybrid PowerBoost variant. Major front fascia change.",
      popular: true, latestYear: 2024,
      image: "/images/vehicle-gens/ford-f-150-p702.jpg",
    },
    {
      gen: "13TH GEN", years: "2015 — 2020", code: "P552",
      body: "First aluminum body F-150. Major bumper redesign in 2018.",
      popular: false, latestYear: 2020,
      image: "/images/vehicle-gens/ford-f-150-p552.jpg",
    },
    {
      gen: "12TH GEN", years: "2009 — 2014", code: "P415",
      body: "Last steel-bodied F-150. EcoBoost debut in 2011.",
      popular: false, latestYear: 2014,
      image: "/images/vehicle-gens/ford-f-150-p415.jpg",
    },
  ],
  "chevrolet-silverado": [
    {
      gen: "T1XX", years: "2019 — Current", code: "T1XX",
      body: "All-new platform. New trim hierarchy through Trail Boss and ZR2.",
      popular: true, latestYear: 2024,
      image: "/images/vehicle-gens/chevrolet-silverado-t1xx.jpg",
    },
    {
      gen: "K2XX", years: "2014 — 2018", code: "K2XX",
      body: "Full redesign — direct-injection EcoTec3 V8 across most trims.",
      popular: false, latestYear: 2018,
      image: "/images/vehicle-gens/chevrolet-silverado-k2xx.jpg",
    },
  ],
  "ram-1500": [
    {
      gen: "DT", years: "2019 — Current", code: "DT",
      body: "All-new chassis. Multifunction tailgate available from Limited.",
      popular: true, latestYear: 2024,
      image: "/images/vehicle-gens/ram-1500-dt.jpg",
    },
    {
      gen: "DT CLASSIC", years: "2019 — 2023 (parallel run)", code: "DT-Classic",
      body: "DS body sold alongside DT — different tailgate and bumper hardware.",
      popular: false, latestYear: 2023,
      image: "/images/vehicle-gens/ram-1500-dt-classic.jpg",
    },
  ],
  "toyota-tacoma": [
    {
      gen: "4TH GEN", years: "2024 — Current", code: "N400",
      body: "All-new TNGA-F platform. iForce Max hybrid available.",
      popular: true, latestYear: 2024,
      image: "/images/vehicle-gens/toyota-tacoma-n400.jpg",
    },
    {
      gen: "3RD GEN", years: "2016 — 2023", code: "N300",
      body: "Long production run. TRD Pro / Off-Road / Sport trims share fascia.",
      popular: false, latestYear: 2023,
      image: "/images/vehicle-gens/toyota-tacoma-n300.jpg",
    },
  ],
  "jeep-wrangler": [
    {
      gen: "JL", years: "2018 — Current", code: "JL",
      body: "JL chassis. 2-door (JL) and 4-door (JLU) share most cab parts.",
      popular: true, latestYear: 2024,
      image: "/images/vehicle-gens/jeep-wrangler-jl.jpg",
    },
    {
      gen: "JK", years: "2007 — 2018", code: "JK",
      body: "Long-running JK platform. JK and JL parts are NOT interchangeable.",
      popular: false, latestYear: 2018,
      image: "/images/vehicle-gens/jeep-wrangler-jk.jpg",
    },
  ],
};

/**
 * No mock owner-reviews on vehicle hubs — they were F-150-specific and showed
 * up on every page (Jordan, Parts P1). Real reviews are wired with Okendo in
 * Phase 5; until then the section is hidden.
 */

const YEARS = [
  "2024",
  "2023",
  "2022",
  "2021",
  "2020",
  "2019",
  "2018",
  "2017",
  "2016",
  "2015",
  "2014",
  "2013",
];

export default async function VehicleHubPage({
  params,
}: {
  params: Promise<VehicleParams>;
}) {
  const { slug } = await params;
  const v = parseSlug(slug);
  if (!v) notFound();
  const { make, model } = v;
  const cats = CATEGORIES.slice(0, 8);
  const generations = GENERATIONS_BY_VEHICLE[slug] ?? [];
  // Cycle 5 (Mike): cross-sell rail used to render PRODUCTS.slice(0, 4),
  // which is mock F-150 SuperCrew roof racks shown on EVERY hub including
  // Wrangler (which has no bed). Query Shopify for parts that actually fit
  // this vehicle's most recent year. Falls back to mock when Shopify is
  // unreachable so the section never goes empty.
  const latestYear =
    generations[0]?.latestYear ?? new Date().getFullYear();
  // Cycle 14e (Mike-5 MAJOR): when the customer has a garage entry that
  // matches this hub's make/model, use *their* year for the cross-sell card
  // fitment banner — not the model's latest year. Mike-5 quote: "Garage =
  // 2014, banner reads 'FITS YOUR 2024 JEEP WRANGLER'." Fall back to the
  // generation latestYear only when no matching garage vehicle is set.
  const garage = await getCurrentVehicle();
  // Cycle 14X+ post-sync (Mike-O15): when the customer's garage matches
  // this hub vehicle, surface their saved sub-model answers so the
  // cross-sell rail's fitment chips run the bed/cab gate too.
  const hubSubAnswers = garage
    ? await getSubModelAnswers(garage.id ?? "")
    : null;
  // Cycle 14h (Mike-8 F-4 regression): exact-equality match missed when the
  // garage model includes a trim suffix the hub doesn't (e.g. garage "Silverado
  // 1500" vs hub "Silverado"). Loosen to a directional substring match in
  // either direction so the garage year still wins.
  const norm = (s: string) => s.toLowerCase().trim();
  const garageMatchesHub =
    !!garage &&
    norm(garage.make) === norm(make) &&
    (norm(garage.model) === norm(model) ||
      norm(garage.model).startsWith(norm(model) + " ") ||
      norm(model).startsWith(norm(garage.model) + " "));
  const fakeVehicle = garageMatchesHub
    ? { year: garage.year, make, model }
    : { year: String(latestYear), make, model };
  // Cycle 5 follow-up (#83): the vehicle-fit query alone often returns 1-2
  // SKUs (Wrangler hitch only) leaving 3 empty cards. Pad to 4 with universal
  // make-only hits so the rail is always full but stays vehicle-relevant.
  let products: typeof PRODUCTS = [];
  try {
    const fitHits = withFitment(
      await searchProducts(`${latestYear} ${make} ${model}`, 8),
      fakeVehicle,
      garageMatchesHub ? hubSubAnswers : null,
    );
    if (fitHits.length < 4) {
      const seenHandles = new Set(fitHits.map((p) => p.handle));
      const padding = withFitment(
        await searchProducts(`${make} ${model}`, 12),
        fakeVehicle,
        garageMatchesHub ? hubSubAnswers : null,
      ).filter((p) => !seenHandles.has(p.handle));
      products = [...fitHits, ...padding].slice(0, 4);
    } else {
      products = fitHits.slice(0, 4);
    }
  } catch {
    products = [];
  }
  if (products.length === 0) {
    products = PRODUCTS.slice(0, 4);
  }

  // Cycle 14Z post-deploy (Priya F-8 MEDIUM): vehicle hub now emits a
  // BreadcrumbList JSON-LD so Google can render the breadcrumb in SERP.
  // Static crumbs derived from server-side params — no user input → no XSS.
  const breadcrumb = breadcrumbJsonLd(
    [
      { name: "Home", href: "/" },
      { name: "Shop", href: "/collections" },
      { name: `${make} ${model}`, href: `/vehicle/${slug}` },
    ],
    SITE_URL,
  );
  const breadcrumbHtml = jsonLdString(breadcrumb);

  return (
    <main>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger -- BreadcrumbList, server-built
        dangerouslySetInnerHTML={{ __html: breadcrumbHtml }}
      />
      {/* HERO */}
      <div
        style={{
          position: "relative",
          background: "#000",
          overflow: "hidden",
          minHeight: 480,
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
              "linear-gradient(180deg, rgba(10,10,10,0.5) 0%, rgba(10,10,10,0.95) 100%)",
          }}
        />
        <div
          className="container-x"
          style={{
            position: "relative",
            paddingTop: 72,
            paddingBottom: 56,
          }}
        >
          <div
            className="eyebrow"
            style={{ marginBottom: 16, color: "var(--color-primary)" }}
          >
            VEHICLE HUB
          </div>
          {/* Cycle 11 (owner mobile QA): used to be fixed fontSize:96, which
              clipped "WRANGLER" and "SILVERADO" off the right edge at 375px.
              Fluid clamp shrinks at narrow viewports. */}
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(48px, 13vw, 96px)",
              textTransform: "uppercase",
              letterSpacing: "-0.03em",
              lineHeight: 0.85,
              fontWeight: 800,
              wordBreak: "break-word",
            }}
          >
            {make.toUpperCase()}
            <br />
            <span style={{ color: "var(--color-primary)" }}>
              {model.toUpperCase()}
            </span>
          </h1>
          <p
            style={{
              marginTop: 24,
              maxWidth: 640,
              fontSize: 18,
              color: "var(--color-muted)",
              lineHeight: 1.6,
            }}
          >
            {`Bolt-on accessories engineered for every ${make} ${model} generation. No drilling. No guesswork. Pick a year and we'll handle the rest.`}
          </p>
          <div
            style={{
              display: "flex",
              gap: 8,
              marginTop: 32,
              flexWrap: "wrap",
            }}
          >
            {/* Cycle 14Z (owner): "SET YOUR EXACT TRIM" was misleading —
                it opens the YMM (year/make/model) modal, which is a vehicle
                CHANGE action, not a trim picker. There's no single trim
                concept that applies across all category-specific sub-models
                (bed length, cab type, trim level vary by part type). The
                honest label for what the button actually does is "CHANGE
                VEHICLE". A real per-attribute trim picker would belong on
                the PDP variant strip, not on the vehicle hub. */}
            <YmmButton className="btn btn-primary btn-lg">
              <Icons.truck size={14} />
              CHANGE VEHICLE
            </YmmButton>
            <Link href="/collections" className="btn btn-lg">
              SHOP ALL CATEGORIES
            </Link>
          </div>

          <div
            className="grid grid-cols-2 md:grid-cols-4"
            style={{
              marginTop: 48,
              borderTop: "1px solid var(--color-border)",
            }}
          >
            {[
              // Cycle 5 (Mike): "12 GENERATIONS" was hardcoded on every hub
              // regardless of what GENERATIONS_BY_VEHICLE actually held.
              // Drive from the real generation count for this vehicle.
              [
                generations.length > 0 ? `${generations.length} GENERATION${generations.length === 1 ? "" : "S"}` : "MULTI-GENERATION",
                "Bumper-to-bed coverage",
              ],
              ["BOLT-ON", "No drilling"],
              ["LIFETIME", "Structural warranty"],
              ["FITMENT", "Guaranteed"],
            ].map(([k, v]) => (
              <div
                key={k}
                style={{
                  padding: "20px 24px 20px 0",
                  borderRight: "1px solid var(--color-border)",
                }}
              >
                <div
                  className="mono"
                  style={{
                    fontSize: 11,
                    letterSpacing: "0.14em",
                    fontWeight: 600,
                  }}
                >
                  {k}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--color-muted)",
                    marginTop: 4,
                  }}
                >
                  {v}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* YEAR PICKER */}
      <div
        style={{
          background: "var(--color-primary)",
          color: "var(--color-background)",
        }}
      >
        <div
          className="container-x"
          style={{
            paddingTop: 20,
            paddingBottom: 20,
            display: "flex",
            alignItems: "center",
            gap: 20,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: "-0.01em",
              textTransform: "uppercase",
            }}
          >
            Pick your year
          </span>
          <YearPicker
            years={YEARS}
            make={make}
            model={model}
            selectedYear={garageMatchesHub ? String(garage.year) : null}
          />
        </div>
      </div>

      {/* GENERATIONS — only render when we have authored data for this vehicle */}
      {generations.length > 0 && (
      <div style={{ background: "var(--color-surface)" }}>
        <div
          className="container-x"
          style={{ paddingTop: 64, paddingBottom: 64 }}
        >
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            GENERATIONS
          </div>
          <h2
            className="display-h3"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 44,
              textTransform: "uppercase",
              letterSpacing: "-0.02em",
              marginBottom: 32,
            }}
          >
            Know your {model.toLowerCase()}.
          </h2>
          <div
            className="grid grid-cols-1 md:grid-cols-3"
            style={{ gap: 16 }}
          >
            {generations.map((g) => (
              <div
                key={g.gen}
                style={{
                  background: "var(--color-background)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                {g.popular && (
                  <span
                    className="badge badge-best"
                    style={{ position: "absolute", top: 14, right: 14, zIndex: 2 }}
                  >
                    MOST POPULAR
                  </span>
                )}
                <div
                  style={{
                    aspectRatio: "4 / 3",
                    position: "relative",
                    overflow: "hidden",
                    background: g.image
                      ? "var(--color-surface-2)"
                      : `linear-gradient(135deg, hsl(${(g.code.charCodeAt(0) * 47) % 360}deg 22% 22%) 0%, hsl(${(g.code.charCodeAt(0) * 47 + 60) % 360}deg 18% 14%) 100%)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {g.image ? (
                    <Image
                      src={g.image}
                      alt={`${make} ${model} ${g.gen} (${g.code}, ${g.years})`}
                      fill
                      sizes="(min-width: 768px) 33vw, 100vw"
                      style={{ objectFit: "cover" }}
                    />
                  ) : (
                    <div
                      style={{
                        textAlign: "center",
                        color: "rgba(255,255,255,0.55)",
                      }}
                    >
                      <div
                        className="mono"
                        style={{
                          fontSize: 36,
                          fontWeight: 800,
                          letterSpacing: "0.04em",
                          color: "rgba(255,255,255,0.85)",
                        }}
                      >
                        {g.code}
                      </div>
                      <div
                        className="mono"
                        style={{
                          fontSize: 11,
                          letterSpacing: "0.18em",
                          marginTop: 6,
                        }}
                      >
                        {g.years}
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ padding: 18 }}>
                  <div
                    className="mono"
                    style={{
                      fontSize: 11,
                      letterSpacing: "0.14em",
                      color: "var(--color-primary)",
                      fontWeight: 700,
                    }}
                  >
                    {g.gen} · {g.code}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 22,
                      fontWeight: 700,
                      marginTop: 4,
                    }}
                  >
                    {g.years}
                  </div>
                  <p
                    style={{
                      fontSize: 13,
                      color: "var(--color-muted)",
                      lineHeight: 1.6,
                      marginTop: 8,
                    }}
                  >
                    {g.body}
                  </p>
                  {/* SHOP THIS GEN — owner reported this used to open the YMM
                      modal then dump the user back on the same hub. Now it
                      lands on a vehicle-aware search pre-seeded with the most
                      recent year of the gen. The /search page (#73) handles the
                      no-exact-fit fail-open if the catalog is thin for that gen.

                      Cycle 14AF (Mike-O14AF NF-4 MAJOR): a 2019-Silverado
                      customer clicking SHOP T1XX PARTS got
                      /search?q=2024+Chevrolet+Silverado — hardcoded to the
                      gen's latestYear, ignoring their saved garage year.
                      Now: if their saved year is inside this gen's range,
                      pre-seed the search with THEIR year. Otherwise fall
                      back to latestYear so a customer browsing an older
                      gen still sees representative results. */}
                  {(() => {
                    const yearsMatch = g.years.match(/(\d{4})/g);
                    const genStart = yearsMatch?.[0]
                      ? parseInt(yearsMatch[0], 10)
                      : g.latestYear;
                    const genEndRaw = yearsMatch?.[1];
                    const genEnd = genEndRaw
                      ? parseInt(genEndRaw, 10)
                      : g.latestYear;
                    const garageYear = garageMatchesHub
                      ? parseInt(String(garage.year), 10)
                      : null;
                    const ctaYear =
                      garageYear &&
                      Number.isFinite(garageYear) &&
                      garageYear >= genStart &&
                      garageYear <= Math.max(genEnd, g.latestYear)
                        ? garageYear
                        : g.latestYear;
                    return (
                      <Link
                        href={`/search?q=${encodeURIComponent(`${ctaYear} ${make} ${model}`)}`}
                        className="btn btn-sm btn-block"
                        style={{
                          marginTop: 14,
                          justifyContent: "space-between",
                          textDecoration: "none",
                        }}
                      >
                        SHOP {g.code} PARTS <Icons.arrowR size={12} />
                      </Link>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      )}

      {/* CATEGORY GRID */}
      <div
        className="container-x"
        style={{ paddingTop: 64, paddingBottom: 64 }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 24,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>
              SHOP BY CATEGORY
            </div>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 44,
                textTransform: "uppercase",
                letterSpacing: "-0.02em",
              }}
            >
              Built for {make} {model}.
            </h2>
          </div>
        </div>
        <div
          className="grid grid-cols-2 md:grid-cols-4"
          style={{ gap: 12 }}
        >
          {cats.map((c) => (
            <Link
              key={c.slug}
              href={`/collections/${c.slug}`}
              style={{
                padding: 0,
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                color: "var(--color-foreground)",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                className="product-img-bg"
                style={{
                  aspectRatio: "1.4",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {c.image ? (
                  // Cycle 14X+ (owner): padding 10% → 4%, same fix as
                  // home + /collections category tiles — the gray
                  // surround was reading as a thick white frame.
                  <Image
                    src={c.image}
                    alt={c.name}
                    fill
                    sizes="(min-width: 768px) 25vw, 50vw"
                    style={{ objectFit: "contain", padding: "4%" }}
                  />
                ) : (
                  <Icons.truck size={36} />
                )}
              </div>
              <div style={{ padding: 14 }}>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 16,
                    fontWeight: 700,
                    textTransform: "uppercase",
                  }}
                >
                  {c.name}
                </div>
                <div
                  className="mono"
                  style={{
                    fontSize: 10,
                    color: "var(--color-muted)",
                    letterSpacing: "0.08em",
                    marginTop: 4,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span>SHOP NOW</span>
                  <Icons.arrowR size={11} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* TOP PRODUCTS */}
      <div style={{ background: "var(--color-surface)" }}>
        <div
          className="container-x"
          style={{ paddingTop: 64, paddingBottom: 64 }}
        >
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            TOP PICKS FOR THE {model.toUpperCase()}
          </div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 44,
              textTransform: "uppercase",
              letterSpacing: "-0.02em",
              marginBottom: 24,
            }}
          >
            What other {make.toLowerCase()} owners buy.
          </h2>
          <div
            className="grid grid-cols-2 md:grid-cols-4"
            style={{ gap: 16 }}
          >
            {products.map((p) => (
              <ProductCard key={p.sku} product={p} vehicle={fakeVehicle} />
            ))}
          </div>
        </div>
      </div>

      {/*
        Owner-reviews block removed in Cycle 1 — was hardcoded F-150 reviews
        (Jake P. on a 2022 F-150) showing on every vehicle hub including
        Wrangler / Tacoma / Silverado pages. Phase 5 reinstates with real
        Okendo reviews scoped to {make} {model}.
      */}
    </main>
  );
}
