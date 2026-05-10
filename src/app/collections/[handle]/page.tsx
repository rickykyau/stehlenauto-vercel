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
import { getAvailableCategoriesForVehicle } from "@/lib/catalog/vehicle-categories";
import { ProductCard } from "@/components/commerce/product-card";
import { CollectionToolbar } from "@/components/commerce/collection-toolbar";
import { FilterSidebar } from "@/components/commerce/filter-sidebar";
import { MobileFilterDrawer } from "@/components/commerce/mobile-filter-drawer";
import { DimensionPicker } from "@/components/commerce/dimension-picker";
import { ClearFiltersLink } from "@/components/commerce/clear-filters-link";
import { Icons } from "@/components/ui/icons";
import { getCurrentVehicle, getSubModelAnswers } from "@/lib/garage/server";
import { withFitment } from "@/lib/fitment/match";
import {
  buildStripConfig,
  canonicalSubModelValue,
  requiredGroupsForCategory,
} from "@/lib/fitment/sub-model";
import { getDimensionOptions, getDimensionsForVehicle } from "@/lib/fitment/dimensions";
import type { SubModelAnswer, SubModelGroup } from "@/lib/garage/types";
import { breadcrumbJsonLd, itemListJsonLd, jsonLdString } from "@/lib/seo/jsonld";

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
  // Cycle 14Z post-deploy (Mike-O8 F-4 NIT): include a real og:image so
  // shares show truck imagery instead of a blank card. Hero JPG is the only
  // landscape brand asset we have; per-collection imagery comes when
  // warehouse uploads category banners.
  const baseOg = (title: string, description: string, path: string) => ({
    openGraph: {
      title,
      description,
      url: path,
      type: "website" as const,
      siteName: "Stehlen Auto",
      images: [
        {
          url: "/images/hero-stehlen.jpg",
          width: 1280,
          height: 640,
          alt: "Stehlen Auto — heavy-duty truck accessories",
        },
      ],
    },
    twitter: {
      card: "summary_large_image" as const,
      title,
      description,
      images: ["/images/hero-stehlen.jpg"],
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

const VALID_SUB_GROUPS: ReadonlySet<SubModelGroup> = new Set([
  "bed_length",
  "cab_type",
  "trim",
  "doors",
]);

function parseFilterParams(sp: Record<string, string | string[] | undefined>): {
  rawInputs: string[];
  sort?: CollectionSort;
  dimensionAnswers: SubModelAnswer[];
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

  // Cycle 14AO (owner): ?dim=bed_length:5.5%27 BED is the SSR-readable
  // dimension answer used by guests who haven't set a vehicle. Multiple
  // dimensions stack as `?dim=bed_length:...&dim=cab_type:...`. Authed users
  // have their answers in cookie/DB; we still merge URL on top in case a
  // shared link explicitly carries one.
  const dimParam = sp.dim;
  const dimList = Array.isArray(dimParam)
    ? dimParam
    : dimParam
      ? [dimParam]
      : [];
  const dimensionAnswers: SubModelAnswer[] = [];
  const seenGroups = new Set<string>();
  for (const entry of dimList) {
    if (typeof entry !== "string") continue;
    if (entry.length > 64) continue; // Cycle 14AO-fix3 (Mike NB-5): cap raw param length
    const idx = entry.indexOf(":");
    if (idx < 1) continue;
    const group = entry.slice(0, idx);
    const rawValue = decodeURIComponent(entry.slice(idx + 1));
    if (!VALID_SUB_GROUPS.has(group as SubModelGroup)) continue;
    if (!rawValue) continue;
    if (seenGroups.has(group)) continue; // first wins (matches client picker)
    // Cycle 14AQ: per-vehicle allowlist match happens AFTER the vehicle is
    // loaded (see further down). At URL-parse time we only enforce length +
    // basic char hygiene already applied above. Unknown values get filtered
    // when we know what the vehicle's actual options are.
    seenGroups.add(group);
    dimensionAnswers.push({ group: group as SubModelGroup, value: rawValue });
  }
  return { rawInputs, sort, dimensionAnswers };
}

function mergeAnswers(
  primary: SubModelAnswer[],
  fallback: SubModelAnswer[],
): SubModelAnswer[] {
  // Primary (cookie/DB) wins per group; fallback (URL ?dim=) fills gaps.
  const out: SubModelAnswer[] = [...primary];
  const seen = new Set(out.map((a) => a.group));
  for (const a of fallback) {
    if (!seen.has(a.group)) {
      out.push(a);
      seen.add(a.group);
    }
  }
  return out;
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
  const { rawInputs, sort, dimensionAnswers: urlAnswers } = parseFilterParams(sp);
  // Cycle 14j (owner): "Show only fits" toggle. Adds ?fits=1 to the URL.
  // Cycle 14AO retired the toggle (default behaviour now hides mismatches),
  // but we still honour the URL param so old bookmarks don't break — when
  // present it forces the strict exact-fits-only path.
  const fitsOnly = sp.fits === "1";
  // Pull the garage vehicle BEFORE fetching so getCollection can re-rank by
  // fitment for the visible page (Mike F-17). Already running per-request.
  const vehicle = (await getCurrentVehicle()) ?? undefined;
  // Cycle 14X+ post-sync (Mike-O15 NEW MAJOR): pass sub-model answers
  // through to the ProductCard fitment gate so a 5.5'-bed customer
  // doesn't see "✓ FITS" badges on 6.5'-bed products.
  // Cycle 14AO (owner): merge cookie/DB answers (primary) with URL ?dim=
  // (fallback for guests). The merged set drives both the server filter
  // and the DimensionPicker initial state.
  const cookieAnswers = vehicle
    ? await getSubModelAnswers(vehicle.id ?? "")
    : [];
  const mergedRaw = mergeAnswers(cookieAnswers, urlAnswers);
  // Cycle 14AQ (owner): canonicalize merged answers against the per-vehicle
  // option list from data/ymm_dimensions.json. Drops crafted-URL nonsense
  // (?dim=trim:Banana) and stale cookies (5.5' BED on a vehicle that's
  // never been sold with that bed). Without a vehicle, accept the raw
  // value (categories that don't gate on vehicle still work for guests).
  const subModelAnswers: SubModelAnswer[] = vehicle
    ? mergedRaw
        .map((a) => {
          const opts = getDimensionOptions(vehicle, a.group);
          const canonical = canonicalSubModelValue(opts, a.value);
          return canonical ? { ...a, value: canonical } : null;
        })
        .filter((a): a is SubModelAnswer => a !== null)
    : mergedRaw;
  // Cycle 14AP (owner): server-side gate. Hide toolbar + grid until the
  // customer answers all required dimensions OR explicitly clicks SKIP
  // (which sets ?skip=1 in URL). Categories with no required dimensions
  // are open by default. Computed once so the picker, toolbar, and grid
  // wrappers below all stay in sync.
  // Cycle 14AQ: a group only "needs answering" if the customer's vehicle
  // has at least one option for it. A 2018 Wrangler with no trim data in
  // CA fitment shouldn't be force-gated on a question we can't ask.
  const requiredGroupsForGate = requiredGroupsForCategory(handle).filter((g) => {
    if (!vehicle) return true;
    return getDimensionOptions(vehicle, g).length > 0;
  });
  const skipped = sp.skip === "1";
  const allRequiredAnswered = requiredGroupsForGate.every((g) =>
    subModelAnswers.some((a) => a.group === g),
  );
  // Cycle 14AR-fix9 (F-2 degate, owner ratified): revert to NUDGE model per
  // docs/reference/fitment_flow_decision.md line 429 — "Do not gate browsing
  // behind sub-model selection". Gate is always open; DimensionPicker renders
  // as a refinement prompt (gated={false}), not a wall. Sub-model gate stays
  // at ATC on the PDP (cycle 14AR-fix4 — DO NOT change PDP gate).
  // Variables kept so downstream references compile without churn.
  void allRequiredAnswered;
  void skipped;
  const gateOpen = true;
  let collection = await getCollection(handle, 24, {
    rawInputs,
    sort,
    vehicle: vehicle ?? undefined,
    fitsOnly: fitsOnly && !!vehicle,
    subModelAnswers,
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
      {/* Cycle 14Z post-deploy (Priya F-13 MEDIUM): ItemList JSON-LD makes
          this collection eligible for Google's product-carousel rich result.
          Only emit when there are products on the page so the schema isn't
          empty when filters return zero hits. */}
      {collection.products.length > 0 ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLdString(
              itemListJsonLd(
                collection.products.map((p) => ({
                  handle: p.handle,
                  name: p.title,
                })),
                SITE_URL,
                collection.title,
              ),
            ),
          }}
        />
      ) : null}
      {/* Hero — Cycle 14AP-fix2 (Diana round 2 per owner): the prior 5:1
          banner + warm-cream text-section combo read as a "guillotine"
          cut (image fragment up top, unrelated text below) AND rendered
          the breadcrumb twice because the inline `display: flex` style
          was overriding `md:hidden`. New shape: ONE unified hero unit —
          2.5:1 banner with title + description overlaid on a bottom
          gradient scrim. The warm text section disappears entirely,
          eliminating both the tonal cut and the breadcrumb dup. Banner
          is the LCP; reduces aspect to give the product enough room to
          read as a deliberate hero rather than a cropped strip. Falls
          back to a dark surface-2 card with min-height 160 when no
          hero image exists for the slug. */}
      <section style={{ position: "relative" }}>
        {(() => {
          const hero = getCategoryHero(collection.handle);
          const explainer =
            (collection.description && collection.description.trim()) ||
            hero.explainer ||
            "";
          return (
            <div
              style={{
                position: "relative",
                width: "100%",
                aspectRatio: hero.image ? "2.5 / 1" : undefined,
                minHeight: hero.image ? undefined : 160,
                background: "var(--color-surface-2)",
                overflow: "hidden",
              }}
            >
              {hero.image && (
                <Image
                  src={hero.image}
                  alt={collection.title}
                  fill
                  priority
                  sizes="100vw"
                  style={{ objectFit: "cover", objectPosition: "center 40%" }}
                />
              )}

              {/* Bottom-heavy gradient scrim so the overlaid title +
                  description sit on a near-black anchor, regardless of
                  what the image shows behind. */}
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  inset: 0,
                  background: hero.image
                    ? "linear-gradient(to top, rgba(10,10,10,0.92) 0%, rgba(10,10,10,0.55) 45%, rgba(10,10,10,0.15) 100%)"
                    : "none",
                }}
              />

              {/* Single content overlay — same on mobile + desktop. No
                  more dual-render breadcrumb; one nav anchored to the
                  scrim, controlled by stacking inside the absolute
                  container. */}
              <div
                className="container-x"
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  paddingBottom: 28,
                  paddingTop: 24,
                }}
              >
                {/* Cycle 14AR-fix12 (BUG-14AZ-5): breadcrumb links padded to
                    44px hit zone. Negative margin on the nav row keeps the
                    visual baseline where it was. Links are still 12px text;
                    the padding extends the tap target without widening the
                    visible label. */}
                <nav
                  aria-label="Breadcrumb"
                  style={{
                    display: "flex",
                    gap: 2,
                    alignItems: "center",
                    fontSize: 12,
                    color: "rgba(255,255,255,0.55)",
                    marginBottom: 12,
                    marginTop: -14,
                  }}
                >
                  <Link
                    href="/"
                    style={{
                      color: "rgba(255,255,255,0.55)",
                      display: "inline-flex",
                      alignItems: "center",
                      minHeight: 44,
                      padding: "0 4px",
                    }}
                  >
                    Home
                  </Link>
                  <Icons.chevRight size={10} />
                  <Link
                    href="/collections"
                    style={{
                      color: "rgba(255,255,255,0.55)",
                      display: "inline-flex",
                      alignItems: "center",
                      minHeight: 44,
                      padding: "0 4px",
                    }}
                  >
                    Shop
                  </Link>
                  <Icons.chevRight size={10} />
                  <span style={{ color: "rgba(255,255,255,0.85)", padding: "0 4px" }}>
                    {collection.title}
                  </span>
                </nav>

                <div style={{ maxWidth: 680 }}>
                  <h1
                    className="display-h3"
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "clamp(28px, 4vw, 44px)",
                      textTransform: "uppercase",
                      letterSpacing: "-0.01em",
                      lineHeight: 1.0,
                      color: "#fff",
                      textShadow: "0 2px 16px rgba(0,0,0,0.5)",
                    }}
                  >
                    {collection.title}
                  </h1>
                  {explainer && (
                    <p
                      style={{
                        color: "rgba(255,255,255,0.72)",
                        fontSize: 15,
                        marginTop: 10,
                        lineHeight: 1.6,
                        maxWidth: 520,
                      }}
                    >
                      {explainer}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
      </section>

      {/* Cycle 14AO + 14AP (owner): "show options before items," gated.
          When category is dimension-applicable AND customer hasn't
          answered the required dimensions AND hasn't clicked SKIP, we
          render the picker only — toolbar + grid are hidden until they
          pick or skip. Trades small friction for fitment accuracy: F-150
          customer no longer scrolls past bed-length and sees 8' bed mats. */}
      {(() => {
        // Cycle 14AQ: build per-vehicle strip configs from CA fitment data.
        // Each strip carries the actual options for THIS vehicle (real trim
        // names like "SLE / Denali", not hardcoded "BASE / MID / HEAVY-DUTY").
        // Strips with zero options are dropped — picker won't render a chip
        // row for a question we can't answer for this vehicle.
        const groups = requiredGroupsForCategory(collection.handle);
        if (groups.length === 0) return null;
        const strips = groups
          .map((g) => buildStripConfig(g, getDimensionOptions(vehicle, g)))
          .filter((s) => s.options.length > 0);
        if (strips.length === 0) return null;
        // Cycle 14AR-fix16 (Mike R3 F-3 MAJOR): if THIS category has zero
        // products for the customer's vehicle, suppress the dimension
        // picker — answering "Which bed length?" leads to a dead-end zero-
        // results page either way. The category-level "we don't carry this
        // for your vehicle yet" empty state is the right thing to show.
        if (vehicle) {
          const availableForVehicle = getAvailableCategoriesForVehicle(
            vehicle.year,
            vehicle.make,
            vehicle.model,
          );
          if (!availableForVehicle.has(collection.handle)) return null;
        }
        return (
          <DimensionPicker
            categoryHandle={collection.handle}
            vehicle={vehicle ?? undefined}
            initialAnswers={subModelAnswers}
            gated={false}
            strips={strips}
          />
        );
      })()}

      <CollectionToolbar
        totalProducts={collection.totalProducts}
        vehicle={vehicle}
      />

      {/* Body — always rendered; DimensionPicker is a nudge, not a gate. */}
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
          {/* Cycle 14AO (owner): collection grid now hides confirmed
              mismatches by default whenever a vehicle is set. The honest
              messaging splits three ways:
                · fitsCount > 0  — "N exact fits, plus universal-fit options"
                · fitsCount === 0 + universals present — "showing universal-
                  fit options (no exact fits in this collection)"
                · fitsCount === 0 + zero products  — empty state below
              The legacy yellow "showing the rest of <category>" banner is
              gone because we no longer mix in confirmed mismatches.       */}
          {vehicle && collection.fitMeta && collection.products.length > 0 && (
            <div
              id="collection-grid"
              style={{
                fontSize: 12,
                color: "var(--color-muted)",
                marginBottom: 12,
              }}
            >
              {collection.fitMeta.fitsCount > 0 ? (
                <>
                  <span style={{ color: "var(--color-success)" }}>
                    {collection.fitMeta.fitsCount} exact fit
                    {collection.fitMeta.fitsCount === 1 ? "" : "s"}
                  </span>{" "}
                  for your {vehicle.year} {vehicle.make} {vehicle.model}
                  {fitsOnly
                    ? " — showing fits only."
                    : ", plus universal-fit options."}
                </>
              ) : (
                <>
                  <span className="mono" style={{ letterSpacing: "0.08em" }}>
                    NO EXACT FITS YET FOR YOUR {vehicle.year}{" "}
                    {vehicle.make.toUpperCase()} {vehicle.model.toUpperCase()}
                  </span>{" "}
                  — showing universal-fit options. Verify fitment on each
                  product page before ordering.
                </>
              )}
            </div>
          )}
          {!vehicle && (
            <div id="collection-grid" style={{ height: 0 }} aria-hidden />
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
              {/* Cycle 14AO-fix2 (Sam gap 10): four-branch empty-state copy.
                  Earlier was two branches (fitsOnly vs warehouse uploading)
                  which left "vehicle + dimension answer + sidebar filter
                  produces 0 products" falling into the warehouse-uploading
                  bucket — telling the customer the WAREHOUSE is the
                  problem when really their FILTERS narrowed to zero. The
                  four branches now match the four real causes:
                    a) fitsOnly + vehicle  → strict mode, no exact fits
                    b) vehicle + dimension or sidebar filter → narrow filters
                    c) vehicle, no narrow filter → no products in collection at all
                    d) no vehicle, ?f= filters → filter narrowed
                    e) baseline → warehouse-uploading honest fallback */}
              {(() => {
                // Cycle 14AO-fix4 (Mike NF-2): only count dimension answers
                // that are RELEVANT to this category. A 5.5'-bed cookie set
                // on Tonneau Covers should not flag Headlights as "filtered
                // by these filters" — Headlights doesn't gate by bed length,
                // so the dim cookie is a no-op there. Without this check the
                // empty state misleadingly said "NO MATCHES WITH THESE
                // FILTERS" when the real cause was just the vehicle and
                // there's no inventory; CLEAR FILTERS then loops because
                // dropping ?f= doesn't change anything.
                const categoryDimGroups = new Set(
                  requiredGroupsForCategory(collection.handle),
                );
                const relevantDimensionAnswers = subModelAnswers.filter((a) =>
                  categoryDimGroups.has(a.group),
                );
                const dimensionApplied = relevantDimensionAnswers.length > 0;
                const sidebarFilterApplied = rawInputs.length > 0;
                const narrowingApplied =
                  dimensionApplied || sidebarFilterApplied;

                let title: string;
                let body: React.ReactNode;
                if (fitsOnly && vehicle) {
                  title = `NO EXACT-FIT MATCHES FOR YOUR ${vehicle.year} ${vehicle.make.toUpperCase()} ${vehicle.model.toUpperCase()}`;
                  body = (
                    <>
                      Tap{" "}
                      <Link
                        href={`?${(() => {
                          const u = new URLSearchParams();
                          Object.entries(sp).forEach(([k, v]) => {
                            if (k !== "fits" && typeof v === "string") u.set(k, v);
                          });
                          return u.toString();
                        })()}`}
                        style={{ color: "var(--color-primary)", fontWeight: 600 }}
                      >
                        SHOW ALL
                      </Link>{" "}
                      to see universal-fit and likely-fit options, or{" "}
                      <Link
                        href="/collections"
                        style={{ color: "var(--color-primary)" }}
                      >
                        browse other categories
                      </Link>
                      .
                    </>
                  );
                } else if (vehicle && narrowingApplied) {
                  title = `NO MATCHES FOR YOUR ${vehicle.year} ${vehicle.make.toUpperCase()} ${vehicle.model.toUpperCase()} WITH THESE FILTERS`;
                  body = (
                    <>
                      Tap{" "}
                      <ClearFiltersLink
                        collectionHandle={collection.handle}
                        vehicle={vehicle ?? undefined}
                        answeredGroups={relevantDimensionAnswers.map((a) => a.group)}
                        style={{ color: "var(--color-primary)", fontWeight: 600 }}
                      >
                        CLEAR FILTERS
                      </ClearFiltersLink>{" "}
                      to see all {collection.title.toLowerCase()} that fit
                      your vehicle, or{" "}
                      <Link
                        href="/collections"
                        style={{ color: "var(--color-primary)" }}
                      >
                        browse other categories
                      </Link>
                      .
                    </>
                  );
                } else if (vehicle) {
                  title = `NO ${collection.title.toUpperCase()} FOR YOUR ${vehicle.year} ${vehicle.make.toUpperCase()} ${vehicle.model.toUpperCase()} YET`;
                  body = (
                    <>
                      We don&apos;t carry this category for your vehicle
                      yet. Check{" "}
                      <Link
                        href={`/vehicle/${vehicle.year}-${vehicle.make.toLowerCase()}-${vehicle.model.toLowerCase().replace(/\s+/g, "-")}`}
                        style={{ color: "var(--color-primary)" }}
                      >
                        all parts that fit your vehicle
                      </Link>
                      , or{" "}
                      <Link
                        href="/collections"
                        style={{ color: "var(--color-primary)" }}
                      >
                        browse other categories
                      </Link>
                      .
                    </>
                  );
                } else if (narrowingApplied) {
                  title = `NO ${collection.title.toUpperCase()} MATCH THESE FILTERS`;
                  body = (
                    <>
                      Tap{" "}
                      <ClearFiltersLink
                        collectionHandle={collection.handle}
                        vehicle={undefined}
                        answeredGroups={relevantDimensionAnswers.map((a) => a.group)}
                        style={{ color: "var(--color-primary)", fontWeight: 600 }}
                      >
                        CLEAR FILTERS
                      </ClearFiltersLink>{" "}
                      to see all {collection.title.toLowerCase()}, or{" "}
                      <Link
                        href="/collections"
                        style={{ color: "var(--color-primary)" }}
                      >
                        browse other categories
                      </Link>
                      .
                    </>
                  );
                } else {
                  title = "NO PRODUCTS YET";
                  body = (
                    <>
                      We&apos;re uploading {collection.title.toLowerCase()}{" "}
                      from the warehouse — check back soon, or{" "}
                      <Link
                        href="/collections"
                        style={{ color: "var(--color-primary)" }}
                      >
                        browse other categories
                      </Link>
                      .
                    </>
                  );
                }
                return (
                  <>
                    <p
                      className="mono"
                      style={{
                        fontSize: 12,
                        letterSpacing: "0.12em",
                        color: "var(--color-muted)",
                        marginBottom: 12,
                      }}
                    >
                      {title}
                    </p>
                    <p style={{ fontSize: 14, color: "var(--color-muted)" }}>
                      {body}
                    </p>
                  </>
                );
              })()}
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
                {withFitment(collection.products, vehicle, subModelAnswers).map((p) => (
                  <ProductCard key={p.sku} product={p} vehicle={vehicle} />
                ))}
              </div>

              {/* Cycle 14AO-fix3 (Mike NB-3): pagination only renders when
                  there's actually more than one page of results. Earlier
                  the placeholder buttons "1, 2, 3, …, last" rendered for
                  every collection — once filters narrowed totalProducts to
                  the page size, the "last page" math evaluated to 1 and
                  the bar read "1 2 3 … 1". The numeric buttons 2 and 3
                  were also hardcoded placeholders (Phase 4 was supposed to
                  wire real pagination), making the UI a lie regardless. We
                  hide the bar entirely until real pagination ships. */}
              {collection.totalProducts > collection.products.length && (
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
                    SHOWING {collection.products.length} OF{" "}
                    {collection.totalProducts}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
