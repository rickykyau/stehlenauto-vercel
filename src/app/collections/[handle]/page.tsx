import type { Metadata } from "next";
// notFound() removed in Cycle 1 — unknown collection slugs now render a friendly empty state.
import Link from "next/link";
import Image from "next/image";
import {
  getCategoryBySlug,
  getCategoryHero,
  getCollection,
  type CollectionSort,
} from "@/lib/catalog";
import { ROOF_RACK_FILTERS } from "@/lib/catalog/mock";
import { CATEGORIES } from "@/lib/catalog/mock";
import { ProductCard } from "@/components/commerce/product-card";
import { CollectionToolbar } from "@/components/commerce/collection-toolbar";
import { FilterSidebar } from "@/components/commerce/filter-sidebar";
import { MobileFilterDrawer } from "@/components/commerce/mobile-filter-drawer";
import { Icons } from "@/components/ui/icons";
import { getCurrentVehicle } from "@/lib/garage/server";
import { withFitment } from "@/lib/fitment/match";
import { breadcrumbJsonLd, jsonLdString } from "@/lib/seo/jsonld";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://stehlenauto.com";

// Personalized per visitor (cookie-driven fitment), so render on each request.
export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return CATEGORIES.map((c) => ({ handle: c.slug }));
}

// Cycle 14Z (Mike-O1 M-7): synthetic collections (best-sellers, new-arrivals,
// sale) returned title "Collection | Stehlen Auto" because getCategoryBySlug
// only knows about the 12 real category slugs. Map synthetic handles to
// proper titles so the browser tab + SEO + breadcrumbs are correct.
const SYNTHETIC_COLLECTION_META: Record<string, { title: string; description: string }> = {
  "best-sellers": {
    title: "Best Sellers — Top Truck, SUV & Jeep Parts",
    description: "Top-selling Stehlen Auto parts this month — bolt-on, fitment-guaranteed.",
  },
  "new-arrivals": {
    title: "New Arrivals — Latest Truck & SUV Accessories",
    description: "The newest additions to the Stehlen Auto catalog.",
  },
  sale: {
    title: "On Sale — Truck & SUV Accessories",
    description: "Stehlen Auto parts marked down from MSRP.",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  // Cycle 14Z (Priya O-4 HIGH): every collection metadata branch now ships
  // openGraph + twitter blocks. Without them, social/marketplace shares fall
  // back to the layout-level OG (homepage) and look identical for every
  // category — kills CTR from Pinterest/Reddit/Discord truck communities.
  const baseOg = (title: string, description: string, path: string) => ({
    openGraph: {
      title,
      description,
      url: path,
      type: "website" as const,
      siteName: "Stehlen Auto",
    },
    twitter: {
      card: "summary_large_image" as const,
      title,
      description,
    },
  });

  if (SYNTHETIC_COLLECTION_META[handle]) {
    const meta = SYNTHETIC_COLLECTION_META[handle];
    return {
      title: meta.title,
      description: meta.description,
      alternates: { canonical: `/collections/${handle}` },
      ...baseOg(meta.title, meta.description, `/collections/${handle}`),
    };
  }
  // Cycle 14Z (Mike-O2 N-3): make-based collection slugs from the megamenu
  // (ford-parts, chevy-parts, dodge-parts, ram-parts, etc.) all returned the
  // generic "Collection" title. Derive a real title from the handle.
  const makeMatch = handle.match(/^([a-z]+)-parts$/);
  if (makeMatch) {
    const make = makeMatch[1].replace(/^./, (c) => c.toUpperCase());
    const t = `${make} Truck, SUV & Jeep Accessories`;
    const d = `Bolt-on accessories for every ${make} pickup, SUV and Jeep — fitment guaranteed, free shipping.`;
    return {
      title: t,
      description: d,
      alternates: { canonical: `/collections/${handle}` },
      ...baseOg(t, d, `/collections/${handle}`),
    };
  }
  const cat = getCategoryBySlug(handle);
  if (!cat) {
    // Honest fallback: derive a title from the handle so the browser tab
    // never reads just "Collection".
    // Cycle 14Z (Priya O-3 HIGH): was appending "| Stehlen Auto" manually,
    // and the layout's title.template re-appends it → "X | Stehlen Auto |
    // Stehlen Auto". Removed the manual suffix; layout adds it once.
    const friendly = handle
      .split("-")
      .map((s) => (s ? s[0].toUpperCase() + s.slice(1) : s))
      .join(" ");
    const d = `Shop ${friendly.toLowerCase()} accessories for your vehicle — fitment guaranteed, free shipping on every order.`;
    return {
      title: friendly,
      description: d,
      alternates: { canonical: `/collections/${handle}` },
      ...baseOg(friendly, d, `/collections/${handle}`),
    };
  }
  const t = `${cat.name} for Trucks, SUVs & Jeeps`;
  const d = `Shop ${cat.name.toLowerCase()} — fitment guaranteed for your vehicle. Free shipping on every order.`;
  return {
    title: t,
    description: d,
    alternates: { canonical: `/collections/${handle}` },
    ...baseOg(t, d, `/collections/${handle}`),
  };
}

const ALLOWED_SORTS = new Set<CollectionSort>([
  "best-selling",
  "price-asc",
  "price-desc",
  "newest",
  "title-asc",
]);

function parseFilterParams(sp: Record<string, string | string[] | undefined>): {
  rawInputs: string[];
  sort?: CollectionSort;
} {
  const sort =
    typeof sp.sort === "string" && ALLOWED_SORTS.has(sp.sort as CollectionSort)
      ? (sp.sort as CollectionSort)
      : undefined;
  // Each `f` query-string entry is a base64-encoded Shopify ProductFilter input
  // we round-tripped from FilterValueNode.input. `?f=...&f=...` for multi-pick.
  const fParam = sp.f;
  const fList = Array.isArray(fParam) ? fParam : fParam ? [fParam] : [];
  const rawInputs = fList
    .map((s) => {
      try {
        return Buffer.from(decodeURIComponent(s), "base64").toString("utf-8");
      } catch {
        return null;
      }
    })
    .filter((s): s is string => Boolean(s));
  return { rawInputs, sort };
}

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ handle: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { handle } = await params;
  const sp = await searchParams;
  const { rawInputs, sort } = parseFilterParams(sp);
  // Cycle 14j (owner): "Show only fits" toggle. Adds ?fits=1 to the URL.
  const fitsOnly = sp.fits === "1";
  // Pull the garage vehicle BEFORE fetching so getCollection can re-rank by
  // fitment for the visible page (Mike F-17). Already running per-request.
  const vehicle = (await getCurrentVehicle()) ?? undefined;
  let collection = await getCollection(handle, 24, {
    rawInputs,
    sort,
    vehicle: vehicle ?? undefined,
    fitsOnly: fitsOnly && !!vehicle,
  });

  // Cycle-1 fix (Mike M2 / Marcus #6): rather than hard-404 unknown slugs that
  // are linked from chrome (best-sellers, new-arrivals, sale, lighting, etc.),
  // synthesize a friendly empty collection that keeps the chrome promise alive
  // and points back to the catalog index.
  if (!collection) {
    const friendlyTitle = handle
      .split("-")
      .map((s) => (s ? s[0].toUpperCase() + s.slice(1) : s))
      .join(" ");
    collection = {
      handle,
      title: friendlyTitle,
      description: `We're loading the ${friendlyTitle.toLowerCase()} catalog from the warehouse. Check back soon, or browse other categories below.`,
      products: [],
      totalProducts: 0,
      filters: ROOF_RACK_FILTERS,
    };
  }

  // Cycle 4 (Mike F-36): facets now come from Shopify Storefront sized to the
  // full collection, not the visible 24-product slice. Falls back to a generic
  // shape only when Shopify is unreachable.
  const filters = collection.filters;

  return (
    <main>
      {/* Server-built breadcrumb JSON-LD; `<` escaped to neutralize script-breakout. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdString(
            breadcrumbJsonLd(
              [
                { name: "Home", href: "/" },
                { name: "Shop", href: "/collections" },
                {
                  name: collection.title,
                  href: `/collections/${collection.handle}`,
                },
              ],
              SITE_URL,
            ),
          ),
        }}
      />
      {/* Hero */}
      <section
        style={{
          background: "var(--color-surface)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <div
          className="container-x"
          style={{ paddingTop: 32, paddingBottom: 32 }}
        >
          <nav
            aria-label="Breadcrumb"
            style={{
              display: "flex",
              gap: 6,
              alignItems: "center",
              fontSize: 12,
              color: "var(--color-muted)",
              marginBottom: 14,
            }}
          >
            <Link href="/">Home</Link>
            <Icons.chevRight size={10} />
            <Link href="/collections">Shop</Link>
            <Icons.chevRight size={10} />
            <span style={{ color: "var(--color-foreground)" }}>
              {collection.title}
            </span>
          </nav>
          {/* Cycle 14N (owner): collection hero used to render just the
              title plus an optional one-liner. New visitors who clicked
              "Tonneau Covers" had no idea what one is. Add a representative
              photo + a 2-3-sentence shopper-friendly explainer to the right
              of the title on tablet+, stacked below the title on mobile. */}
          {(() => {
            const hero = getCategoryHero(collection.handle);
            const explainer =
              (collection.description && collection.description.trim()) ||
              hero.explainer ||
              "";
            return (
              <div
                className="grid grid-cols-1 md:grid-cols-[1fr_320px]"
                style={{ gap: 32, alignItems: "center" }}
              >
                <div>
                  <h1
                    className="display-h3"
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 44,
                      textTransform: "uppercase",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {collection.title}
                  </h1>
                  {explainer && (
                    <p
                      style={{
                        color: "var(--color-muted)",
                        fontSize: 14,
                        marginTop: 12,
                        lineHeight: 1.6,
                        maxWidth: 640,
                      }}
                    >
                      {explainer}
                    </p>
                  )}
                </div>
                {hero.image && (
                  <div
                    style={{
                      width: "100%",
                      aspectRatio: "4 / 3",
                      position: "relative",
                      borderRadius: "var(--radius-md)",
                      overflow: "hidden",
                      background: "var(--color-surface-2)",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    <Image
                      src={hero.image}
                      alt={collection.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 320px"
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </section>

      <CollectionToolbar
        totalProducts={collection.totalProducts}
        vehicle={vehicle}
      />

      {/* Body */}
      <div
        className="container-x grid grid-cols-1 md:grid-cols-[264px_1fr]"
        style={{ gap: 32, paddingTop: 24, paddingBottom: 64 }}
      >
        {/* Cycle 14Z (Mike-O3 NEW-1): hide the filter sidebar entirely when
            the collection has 0 products — showing facet counts like "5'
            Bed (12)" alongside an empty grid is misleading. The facet
            counts come from the global catalog, not this collection. */}
        {collection.products.length > 0 && (
          <aside className="hidden md:block">
            <FilterSidebar filters={filters} vehicle={vehicle} />
          </aside>
        )}

        <div style={collection.products.length === 0 ? { gridColumn: "1 / -1" } : undefined}>
          {/* Mobile filter drawer (Mike F-35): mobile customers had no way to
              filter at all; sidebar was hidden md:block. */}
          {collection.products.length > 0 && (
            <MobileFilterDrawer
              filters={filters}
              vehicle={vehicle}
              totalProducts={collection.totalProducts}
            />
          )}
          {/* Cycle 4 (Mike F-17 Option C): when the customer has a vehicle set
              and Shopify's vehicle-tag query returned zero exact-fits, surface
              the fact instead of pretending the unfiltered grid is "for them". */}
          {vehicle && collection.fitMeta?.noExactFit && collection.products.length > 0 && (
            <div
              style={{
                background: "rgba(245,168,35,0.06)",
                border: "1px solid rgba(245,168,35,0.3)",
                borderRadius: "var(--radius-md)",
                padding: "12px 14px",
                marginBottom: 16,
                fontSize: 13,
              }}
            >
              <span
                className="mono"
                style={{
                  fontSize: 11,
                  letterSpacing: "0.12em",
                  color: "var(--color-primary)",
                }}
              >
                NO EXACT-FIT MATCHES FOR YOUR{" "}
                {vehicle.year} {vehicle.make.toUpperCase()} {vehicle.model.toUpperCase()} —
              </span>{" "}
              showing the rest of {collection.title.toLowerCase()}. Verify
              fitment on each product page before ordering.
            </div>
          )}
          {vehicle && collection.fitMeta && collection.fitMeta.fitsCount > 0 && (
            <div
              style={{
                fontSize: 12,
                color: "var(--color-muted)",
                marginBottom: 12,
              }}
            >
              <span style={{ color: "var(--color-success)" }}>
                {collection.fitMeta.fitsCount} exact fit
                {collection.fitMeta.fitsCount === 1 ? "" : "s"}
              </span>{" "}
              for your {vehicle.year} {vehicle.make} {vehicle.model}
              {fitsOnly ? " — showing fits only." : " shown first."}
            </div>
          )}
          {collection.products.length === 0 ? (
            <div
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                padding: 48,
                textAlign: "center",
              }}
            >
              <p
                className="mono"
                style={{
                  fontSize: 12,
                  letterSpacing: "0.12em",
                  color: "var(--color-muted)",
                  marginBottom: 12,
                }}
              >
                NO PRODUCTS YET
              </p>
              <p style={{ fontSize: 14, color: "var(--color-muted)" }}>
                We&apos;re uploading {collection.title.toLowerCase()} from the
                warehouse — check back soon, or{" "}
                <Link
                  href="/collections"
                  style={{ color: "var(--color-primary)" }}
                >
                  browse other categories
                </Link>
                .
              </p>
            </div>
          ) : (
            <>
              <div
                className="grid grid-cols-2 md:grid-cols-3"
                style={{ gap: 16 }}
              >
                {/* Cycle 4 (Mike F-19): repaint `fits` from title-string match
                    so cards stop reading "CHECK FITMENT" on titles that already
                    name the garage vehicle. */}
                {withFitment(collection.products, vehicle).map((p) => (
                  <ProductCard key={p.sku} product={p} vehicle={vehicle} />
                ))}
              </div>

              {/* Pagination — Phase 4 wires real pagination */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 32,
                  paddingTop: 24,
                  borderTop: "1px solid var(--color-border)",
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                <span
                  className="mono"
                  style={{
                    fontSize: 11,
                    color: "var(--color-muted)",
                    letterSpacing: "0.08em",
                  }}
                >
                  PAGE 1
                </span>
                <div style={{ display: "flex", gap: 4 }}>
                  <button className="btn btn-sm" disabled>
                    <Icons.chevLeft size={12} />
                  </button>
                  <button
                    className="btn btn-sm"
                    style={{
                      background: "var(--color-foreground)",
                      color: "var(--color-background)",
                      borderColor: "var(--color-foreground)",
                    }}
                  >
                    1
                  </button>
                  <button className="btn btn-sm">2</button>
                  <button className="btn btn-sm">3</button>
                  <button className="btn btn-sm" disabled>
                    …
                  </button>
                  <button className="btn btn-sm">
                    {Math.max(
                      1,
                      Math.ceil(
                        collection.totalProducts / collection.products.length,
                      ),
                    )}
                  </button>
                  <button className="btn btn-sm">
                    <Icons.chevRight size={12} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
