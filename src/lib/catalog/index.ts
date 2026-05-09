import { shopifyConfigured, shopifyFetch } from "@/lib/shopify/client";
import {
  GET_COLLECTION_BY_HANDLE_QUERY,
  GET_PRODUCT_BY_HANDLE_QUERY,
  GET_PRODUCTS_QUERY,
} from "@/lib/shopify/queries";
import type { CollectionNode, ProductNode } from "@/lib/shopify/types";
import { parseFitmentTable } from "@/lib/fitment/metafields";
import { checkFitment, filterByDimensionAnswers } from "@/lib/fitment/match";
import type { SubModelAnswer } from "@/lib/garage/types";
import {
  BEST_SELLERS,
  CATEGORIES,
  FITMENT_ROWS,
  POPULAR_VEHICLES,
  PRODUCTS,
  RECENTLY_VIEWED,
  REVIEWS,
  ROOF_RACK_FILTERS,
} from "./mock";
import type {
  CatalogProduct,
  FilterFacet,
  FilterGroup,
  FitmentRow,
  ProductBadge,
  ProductReview,
} from "./types";

export type {
  Category,
  CatalogProduct,
  FilterGroup,
  FitmentRow,
  PopularVehicle,
  ProductReview,
} from "./types";

export function getCategories() {
  return CATEGORIES;
}

export function getPopularVehicles() {
  return POPULAR_VEHICLES;
}

function priceNumber(amount: string | undefined | null): number {
  if (!amount) return 0;
  return Math.round(parseFloat(amount));
}

function badgesFor(p: ProductNode): ProductBadge[] {
  const tags = p.tags.map((t) => t.toLowerCase());
  const badges: ProductBadge[] = [];
  if (tags.includes("new")) badges.push("NEW");
  if (tags.includes("best-seller") || tags.includes("best seller"))
    badges.push("BEST SELLER");
  const min = priceNumber(p.priceRange?.minVariantPrice?.amount);
  const cmp = priceNumber(p.compareAtPriceRange?.minVariantPrice?.amount);
  if (cmp > min) badges.push("SALE");
  return badges;
}

function chipsFor(p: ProductNode): string[] {
  const seen = new Set<string>();
  for (const v of p.variants?.nodes ?? []) {
    for (const opt of v.selectedOptions ?? []) {
      const name = opt.name.toLowerCase();
      if (name === "color" || name === "material" || name === "fit") {
        const val = opt.value.toUpperCase();
        if (!seen.has(val)) seen.add(val);
      }
    }
  }
  return Array.from(seen).slice(0, 4);
}

/**
 * Map a free-text Shopify productType to the real Shopify collection handle
 * the product lives in (used by the PDP breadcrumb second-level link). Owner
 * cycle-7: previously the breadcrumb constructed `/collections/${productType}`
 * which produced URLs like `/collections/tonneau cover - lock & roll up` that
 * decoded into a 404 friendly empty-state. Drive from the cycle-3
 * chrome-reconciled slug list instead.
 */
function categoryHandleFor(productType: string | null | undefined): {
  handle: string | undefined;
  title: string | undefined;
} {
  const pt = (productType ?? "").toLowerCase();
  if (!pt) return { handle: undefined, title: undefined };
  // Each rule: (substring(s) → category slug). First match wins. Order matters
  // because some types overlap (e.g. "truck bed mat" before "bed mat").
  const rules: { match: (s: string) => boolean; slug: string; title: string }[] = [
    { match: (s) => s.includes("tonneau"), slug: "tonneau-covers", title: "Tonneau Covers" },
    { match: (s) => s.includes("trailer hitch"), slug: "trailer-hitches", title: "Trailer Hitches" },
    { match: (s) => s.includes("bull guard") || s.includes("grille guard"), slug: "bull-guards-grille-guards", title: "Bull Guards & Grille Guards" },
    { match: (s) => s.includes("front grille") || s === "grille", slug: "front-grilles", title: "Front Grilles" },
    { match: (s) => s.includes("headlight"), slug: "headlights", title: "Headlights" },
    { match: (s) => s.includes("running board") || s.includes("side step") || s.includes("nerf"), slug: "running-boards-side-steps", title: "Running Boards & Side Steps" },
    { match: (s) => s.includes("truck bed mat") || s.includes("bed mat"), slug: "truck-bed-mats", title: "Truck Bed Mats" },
    { match: (s) => s.includes("floor mat"), slug: "floor-mats", title: "Floor Mats" },
    { match: (s) => s.includes("roof rack") || s.includes("roof basket"), slug: "roof-racks-baskets", title: "Roof Racks & Baskets" },
    { match: (s) => s.includes("chase rack") || s.includes("sport bar"), slug: "chase-racks-sport-bars", title: "Chase Racks & Sport Bars" },
    { match: (s) => s.includes("molle"), slug: "molle-panels", title: "MOLLE Panels" },
    { match: (s) => s.includes("under seat"), slug: "under-seat-storage", title: "Under Seat Storage" },
  ];
  for (const r of rules) if (r.match(pt)) return { handle: r.slug, title: r.title };
  return { handle: undefined, title: undefined };
}

function adapt(p: ProductNode): CatalogProduct {
  const min = priceNumber(p.priceRange?.minVariantPrice?.amount);
  const cmp = priceNumber(p.compareAtPriceRange?.minVariantPrice?.amount);
  // Cycle 14L (owner): prefer the merch-team-curated "CB Item Name"
  // metafield (cb_integration.item_name, e.g. "TC-FRON05-5-HSS") as the
  // customer-visible part number. Fall back to variant.sku and finally to
  // the uppercase handle, so any product without the metafield still
  // renders a usable identifier.
  const cbItemName = p.cbItemName?.value?.trim() || null;
  const sku =
    cbItemName ||
    p.variants?.nodes?.[0]?.sku ||
    p.handle.toUpperCase();
  const cat = categoryHandleFor(p.productType);
  // Cycle 7 (owner): real Shopify image array, no fixed ceiling — each
  // product has whatever number of images its merch team uploaded. Dedupe by
  // URL because Shopify sometimes returns the same image as featuredImage
  // AND in images[].
  const seenImageUrls = new Set<string>();
  const images: { url: string; altText: string | null }[] = [];
  for (const node of p.images?.nodes ?? []) {
    if (!node?.url || seenImageUrls.has(node.url)) continue;
    seenImageUrls.add(node.url);
    images.push({ url: node.url, altText: node.altText ?? null });
  }
  // featuredImage as fallback when images[] is empty
  if (images.length === 0 && p.featuredImage?.url) {
    images.push({ url: p.featuredImage.url, altText: p.featuredImage.altText ?? null });
  }
  return {
    sku,
    handle: p.handle,
    title: p.title,
    fitTitle: p.title,
    price: min,
    compareAt: cmp > min ? cmp : null,
    image: p.featuredImage?.url ?? images[0]?.url ?? null,
    images,
    // Cycle 14Z (Mike-O3 NEW-3): was hardcoded 4.7. Showing "4.7 (0 reviews)"
    // is mathematically impossible and a trust killer. Default to 0; UI
    // hides the rating row entirely when reviews === 0.
    rating: 0,
    reviews: 0,
    badges: badgesFor(p),
    chips: chipsFor(p),
    category: p.productType?.toLowerCase() || "uncategorized",
    categoryHandle: cat.handle,
    categoryTitle: cat.title,
    // CRITICAL: don't lie about fitment. Until we wire ACES tag matching against
    // the customer's vehicle, fitment is "unknown" — the UI must show neutral,
    // never a fake green ✓.  (Mike M1 / M2, Parts P0)
    fits: undefined,
    vehicleTags: p.tags ?? [],
    inventory: p.totalInventory ?? 0,
    description: p.description ?? "",
    descriptionHtml: p.descriptionHtml ?? "",
    // Cycle 14X (owner): structured fitment table from
    // custom.fitment_years/makes/models/notes/subattributes when populated.
    // Returns undefined when none of the metafields are filled in, so the
    // PDP keeps falling back to title-derived rows.
    fitmentTable: parseFitmentTable(p) ?? undefined,
  };
}

type GetProductsResponse = {
  products: { nodes: ProductNode[] };
};

type GetCollectionResponse = {
  collection: CollectionNode | null;
};

export async function getBestSellers(first = 4): Promise<CatalogProduct[]> {
  if (!shopifyConfigured) return BEST_SELLERS.slice(0, first);
  // Cycle 8 (owner): home page was rendering 4 mock placeholder products
  // (all with the same ROOF RACKS.jpg image) because Shopify's
  // `tag:best-seller` query returned 0 — no products in the catalog are
  // tagged that way yet. Fall back to a real Shopify slice instead of mock.
  //
  // Cycle 14j (owner — phone screenshot): the "BEST SELLERS THIS MONTH"
  // grid was rendering 2 near-identical Lock & Roll Up tonneaus (different
  // F-150 variants, same camera angle, same vehicle, same Stehlen overlay)
  // side-by-side — looked like a duplicate render bug to the customer. Pull
  // a wider page from Shopify, then dedupe so each tile shows a visually
  // distinct product (different category AND a different image fingerprint).
  try {
    const wide = Math.max(first * 6, 24);
    const tagged = await shopifyFetch<GetProductsResponse>(GET_PRODUCTS_QUERY, {
      first: wide,
      query: "tag:best-seller",
      sortKey: "BEST_SELLING",
    });
    const taggedNodes = tagged.products?.nodes ?? [];
    if (taggedNodes.length > 0) {
      const picked = pickVisuallyDistinct(taggedNodes.map(adapt), first);
      if (picked.length === first) return picked;
    }

    const fallback = await shopifyFetch<GetProductsResponse>(GET_PRODUCTS_QUERY, {
      first: wide,
      sortKey: "BEST_SELLING",
    });
    const fallbackNodes = fallback.products?.nodes ?? [];
    if (fallbackNodes.length > 0) {
      return pickVisuallyDistinct(fallbackNodes.map(adapt), first);
    }

    return BEST_SELLERS.slice(0, first);
  } catch (err) {
    console.error("[catalog] getBestSellers fell back to mock:", err);
    return BEST_SELLERS.slice(0, first);
  }
}

/**
 * Cycle 14j: pick the first N products such that no two share the same
 * category and no two share the same image-name fingerprint. Shopify's
 * BEST_SELLING returns near-identical product line variants (e.g. two
 * F-150 Lock-&-Roll-Up tonneaus with the same hero image) which read as
 * a duplicate-render bug on the home grid. Walk in BEST_SELLING order,
 * keep the first occurrence per category + per image stem.
 */
function pickVisuallyDistinct(
  candidates: CatalogProduct[],
  count: number,
): CatalogProduct[] {
  const out: CatalogProduct[] = [];
  const seenCategory = new Set<string>();
  const seenImage = new Set<string>();
  const fingerprint = (url: string | null): string => {
    if (!url) return "";
    const file = url.split("/").pop() ?? url;
    // strip Shopify hash / variant suffix and extension to compare base name
    return file
      .replace(/\.(jpg|jpeg|png|webp|avif)(\?.*)?$/i, "")
      .replace(/[_-][0-9a-f]{6,}$/i, "")
      .replace(/[_-]\d+$/, "")
      .toLowerCase();
  };
  for (const p of candidates) {
    const cat = p.categoryHandle ?? p.category ?? "";
    const fp = fingerprint(p.image);
    if (cat && seenCategory.has(cat)) continue;
    if (fp && seenImage.has(fp)) continue;
    out.push(p);
    if (cat) seenCategory.add(cat);
    if (fp) seenImage.add(fp);
    if (out.length === count) break;
  }
  // If de-duping was too aggressive (small catalog), back-fill from the
  // remaining candidates in original order so we never under-fill the grid.
  if (out.length < count) {
    const have = new Set(out.map((p) => p.handle));
    for (const p of candidates) {
      if (have.has(p.handle)) continue;
      out.push(p);
      if (out.length === count) break;
    }
  }
  return out;
}

export async function getRecentlyViewed(first = 4): Promise<CatalogProduct[]> {
  if (!shopifyConfigured) return RECENTLY_VIEWED.slice(0, first);
  try {
    const data = await shopifyFetch<GetProductsResponse>(GET_PRODUCTS_QUERY, {
      first,
      sortKey: "UPDATED_AT",
    });
    const nodes = data.products?.nodes ?? [];
    if (nodes.length === 0) return RECENTLY_VIEWED.slice(0, first);
    return nodes.map(adapt);
  } catch (err) {
    console.error("[catalog] getRecentlyViewed fell back to mock:", err);
    return RECENTLY_VIEWED.slice(0, first);
  }
}

export type CollectionFitMeta = {
  /** Number of products returned that positively fit the customer's vehicle. */
  fitsCount: number;
  /** True when a vehicle is set but zero products in the page positively fit. */
  noExactFit: boolean;
};

export type CollectionResult = {
  handle: string;
  title: string;
  description: string;
  products: CatalogProduct[];
  totalProducts: number;
  /**
   * Cycle 4 (Mike F-36): collection-wide facets surfaced by Shopify Storefront.
   * Counts reflect the FULL collection, not the visible page. Falls back to
   * a hardcoded shape only when Shopify is unavailable.
   */
  filters: FilterGroup[];
  /** Cycle 4 (Mike F-17): vehicle-fit meta for the "showing all" notice. */
  fitMeta?: CollectionFitMeta;
};

/**
 * Cycle 14AO-fix8 (owner-found, prod): explicit search-seed phrase per real
 * Shopify category slug, used by getCollection's "fits fallback search"
 * when the wide-pool returned fewer exact-fit products than the page size.
 *
 * Earlier the seed was `handle.split("-")[0]` which produced unsafe
 * generic words for slugs like "truck-bed-mats" → "truck" or
 * "front-grilles" → "front" — Shopify's free-text search returned every
 * F-150 truck product (trailer hitches, side steps, storage boxes), all
 * of which passed the make/model/year fitment check and got dumped into
 * the EXACT-FITS bucket. Result: the Truck Bed Mats grid showed storage
 * organizers and trailer hitches with green "FITS YOUR 2021 FORD F-150"
 * badges. Direct trust kill.
 *
 * Each seed is the most specific phrase that uniquely identifies the
 * category in customer-facing product titles. Slugs not listed here skip
 * the fallback entirely (synthetic / make-collection / unknown).
 */
const CATEGORY_FALLBACK_KEYWORD: Record<string, string> = {
  "tonneau-covers": "tonneau",
  "trailer-hitches": "trailer hitch",
  "bull-guards-grille-guards": "bull guard",
  "front-grilles": "grille insert",
  headlights: "headlight",
  "running-boards-side-steps": "running board",
  "truck-bed-mats": "bed mat",
  "floor-mats": "floor mat",
  "roof-racks-baskets": "roof rack",
  "chase-racks-sport-bars": "chase rack",
  "molle-panels": "molle panel",
  "under-seat-storage": "under seat",
};

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  "tonneau-covers":
    "Bed covers that protect cargo from weather, theft, and prying eyes. Lock & roll-up, tri-fold, and hidden-snap styles. Bed-length-gated fitment.",
  "trailer-hitches":
    "Class I through V hitches plus accessories — hitch steps, ball mounts, wiring harnesses, and recovery hardware. CURT- and Stehlen-grade.",
  "bull-guards-grille-guards":
    "Heavy-duty front bull bars and grille guards. Advance Series with skid plate, with LED light bar, or classic. Cold-rolled steel, drilling-free bolt-on.",
  "front-grilles":
    "Replacement and upgrade grilles — mesh inserts, full shells, light-bar-ready designs. Trim-aware fitment.",
  headlights:
    "LED crystal, projector, and OEM-style replacements. Sealed beam to halogen to full LED — wiring harness gating handled at PDP.",
  "truck-bed-mats":
    "Rubber bed mats and floor liners. Bed-length-gated fitment. No drilling.",
  "running-boards-side-steps":
    "Bolt-on running boards, drop steps, side step bars, and rock sliders. Cab-type-gated fitment for pickups.",
  "floor-mats":
    "Rubber floor mats — front, rear, and full sets. Vehicle-specific fitment.",
  "roof-racks-baskets":
    "Door-frame, low-profile, and modular overland racks plus cargo baskets. Drilling-free installation.",
  "chase-racks-sport-bars":
    "Bed-mounted chase racks and sport bars. Bed-length aware.",
  "molle-panels": "MOLLE panel kits for the truck bed. Modular, bolt-on.",
  "under-seat-storage":
    "Lockable cab organizers, console mounts, and small-item accessories — vehicle-specific fitment.",
};

/**
 * Cycle 14N (owner): customer-facing explainer copy for the collection hero.
 * The shorter `CATEGORY_DESCRIPTIONS` above is internal-style. This is for
 * a brand-new visitor who clicked a category tile and needs to understand
 * what the product family does in two sentences.
 */
const CATEGORY_HERO_EXPLAINERS: Record<string, string> = {
  "tonneau-covers":
    "A tonneau cover is a hard or soft cover that snaps, folds, or rolls over your truck bed to keep cargo dry, lock it away from thieves, and cut wind drag at highway speed. We carry roll-up vinyl, hard tri-fold, and lock-and-roll styles — every model is bed-length-specific, so pick yours and we'll show only covers that bolt right on.",
  "trailer-hitches":
    "A trailer hitch is the receiver that bolts to your frame so you can pull a trailer, mount a bike rack, or hook a recovery strap. Class I (light, 200 lb tongue) through Class V (heavy-duty, 1,200+ lb tongue) — we fit pickups, SUVs, crossovers, and more. Pick your vehicle and we'll show only the receiver class your frame can take.",
  "bull-guards-grille-guards":
    "A bull guard (or grille guard) is a steel-tube structure that bolts to your front frame and protects the grille, headlights, and bumper from brush, deer strikes, and parking-lot dings. Advance Series adds a skid plate, others add an LED light bar. Drilling-free bolt-on, made from 11-gauge cold-rolled steel.",
  "front-grilles":
    "A front grille is the mesh or slat panel between your headlights — replacing the factory grille is the fastest way to give a stock truck or SUV its own face. Mesh inserts slide into your existing surround; full-shell grilles replace the whole assembly. We carry chrome, matte black, and light-bar-ready designs.",
  headlights:
    "Headlights are the most-used safety system on your vehicle. We carry LED crystal projectors that triple usable light over halogen, OEM-style replacements that just bolt in, and sealed-beam upgrades. Wiring harnesses included where the upgrade swaps from halogen to LED.",
  "truck-bed-mats":
    "A bed mat is a heavy rubber or composite liner that drops into your truck bed and stops cargo from sliding around — and stops the bed itself from getting scratched, dented, or rusted. Custom-cut to your bed's exact length and width. No drilling, no spray-in mess. Pulls out for clean-out in 30 seconds.",
  "running-boards-side-steps":
    "Running boards (or side steps) are the bolt-on platform that helps you and your passengers step into a lifted truck or SUV — and protect the rocker panel from rocks and debris. Drop-step, modular, OE-style, and rock-slider variants. Cab-type-specific (Crew/SuperCrew/Regular).",
  "floor-mats":
    "Floor mats are the rubber or composite tray that catches mud, snow, salt, coffee, and dog hair before it ruins your factory carpet. Custom-cut to your specific cab and trim — no shifting, no curl. Front sets, rear sets, and full cab kits.",
  "roof-racks-baskets":
    "A roof rack lets you carry kayaks, bikes, rooftop tents, lumber, or a basket of overland gear without giving up the truck bed. Door-frame mounts clamp on without drilling; low-profile racks sit flush; modular overland racks add MOLLE plates and tie-down rails. Crossbar-only or full basket.",
  "chase-racks-sport-bars":
    "A chase rack is the bed-mounted tube structure behind the cab that carries lights, antennas, jacks, jerry cans, and anything else you don't want loose in the bed. Sport bars are the lighter cosmetic version. Bed-length-specific, drilling-free bolt-on.",
  "molle-panels":
    "MOLLE panels are the perforated steel plates with PALS webbing slots that turn your truck bed into a modular gear-mounting system. Bolt them to the bed sides and snap on pouches, jerry-can holders, axe mounts, etc. Build a chase setup in an afternoon.",
  "under-seat-storage":
    "Cab and console accessories — lockable under-seat organizers, dash mounts, console trays, USB chargers, and small-item storage. The miscellaneous bucket: anything that bolts inside the cab without modifying the vehicle.",
};

/**
 * Cycle 14N (owner): hero photo for each category. Files live in
 * /public/images/categories/ (30 high-res JPGs from the merch team).
 * We pick the most representative image per category slug.
 */
// Cycle 14AP-fix3 (owner): truck-bed-mats and molle-panels were pointing
// at the SAME TRUCK BED MOLLE PANELS.jpg — customer saw duplicate tiles
// in the home grid AND landed on identical hero on the collection pages.
// Repointed truck-bed-mats to its own freshly-generated TRUCK BED MAT.jpg
// (rubber bed mat fitted in a truck bed, distinct from the MOLLE panel).
// Also: under-seat-storage renamed to "Accessories" in mock.ts; hero
// asset rebranded from console-organizer to a multi-item accessories
// vignette at ACCESSORIES.jpg.
const CATEGORY_HERO_IMAGE: Record<string, string> = {
  "tonneau-covers": "/images/categories/TONNEAU COVER - LOCK & ROLL UP.jpg",
  "trailer-hitches": "/images/categories/HITCH STEPS.jpg",
  "bull-guards-grille-guards":
    "/images/categories/BULL BAR - ADVANCE SERIES.jpg",
  "front-grilles": "/images/categories/FRONT GRILLES.jpg",
  headlights: "/images/categories/FULL LED PROJECTOR HEADLIGHTS.jpg",
  "truck-bed-mats": "/images/categories/TRUCK BED MAT.jpg",
  "running-boards-side-steps":
    "/images/categories/MODULAR STYLE RUNNING BOARDS.jpg",
  "roof-racks-baskets": "/images/categories/ROOF RACKS.jpg",
  "chase-racks-sport-bars": "/images/categories/CHASE RACKS.jpg",
  "molle-panels": "/images/categories/TRUCK BED MOLLE PANELS.jpg",
  "under-seat-storage": "/images/categories/ACCESSORIES.jpg",
  "floor-mats": "/images/categories/RUBBER FLOOR MATS.jpg",
};

export function getCategoryHero(handle: string): {
  explainer: string | null;
  image: string | null;
} {
  return {
    explainer: CATEGORY_HERO_EXPLAINERS[handle] ?? null,
    image: CATEGORY_HERO_IMAGE[handle] ?? null,
  };
}

function mockCollection(
  handle: string,
  first: number,
): CollectionResult | null {
  const cat = CATEGORIES.find((c) => c.slug === handle);
  if (!cat) return null;
  const products = PRODUCTS.filter((p) => p.category === handle);
  return {
    handle,
    title: cat.name,
    description: CATEGORY_DESCRIPTIONS[handle] ?? "",
    products: products.slice(0, first),
    totalProducts: cat.count,
    filters: ROOF_RACK_FILTERS,
  };
}

/**
 * Map Shopify Storefront `filters` payload to our FilterGroup shape.
 * Drops the v.option.* and t.product_type.* facets that just duplicate the
 * collection itself. Sorts values by descending count.
 */
/**
 * Cycle 14AA (Mike-O14AA F-11 MINOR): normalize colloquial make abbreviations
 * to their formal brand name in customer-facing filter labels — Shopify tags
 * may say "Chevy" but the customer's garage and the rest of the site say
 * "Chevrolet." Single source of truth for the display string.
 */
function normalizeFilterLabel(label: string): string {
  const t = label.trim();
  const aliasMap: Record<string, string> = {
    chevy: "Chevrolet",
    "vw": "Volkswagen",
    benz: "Mercedes-Benz",
    bimmer: "BMW",
  };
  const lower = t.toLowerCase();
  if (aliasMap[lower]) return aliasMap[lower];
  return t;
}

function adaptFilters(
  raw: NonNullable<CollectionNode["products"]["filters"]>,
  opts: { hasVehicle: boolean } = { hasVehicle: false },
): FilterGroup[] {
  const groups: FilterGroup[] = [];
  for (const f of raw) {
    if (!f.values || f.values.length === 0) continue;
    if (f.label === "Product type" || f.label === "Availability") continue;

    // Cycle 14AO (owner): when a vehicle is set, the YMM picker in the header
    // is the single source of truth for year/make/model. Surfacing them as
    // sidebar facets lets the customer click "Make: Chevy" inside the filter
    // and silently override their saved Ford F-150 garage — that's the
    // "filter competes with YMM" bug. Drop those groups entirely from the
    // sidebar when a vehicle is set; they reappear when no vehicle is set
    // so guest browsers can still narrow.
    if (opts.hasVehicle) {
      const ll = f.label.toLowerCase();
      if (ll === "year" || ll === "make" || ll === "model") continue;
    }

    if (f.type === "PRICE_RANGE") {
      groups.push({
        title: f.label.toUpperCase(),
        type: "price",
        items: [],
      });
      continue;
    }

    // Cycle 14AE (owner): year facet was sorted by descending product
    // count, so the year list looked random ("2018 (45), 2020 (38),
    // 2017 (35)…"). For year-shaped facets, sort numerically descending
    // (newest first — industry standard for auto parts because most
    // customers have recent vehicles). Other facets keep count-desc
    // because that surfaces the most-relevant value first.
    const isYearFacet = /year/i.test(f.label);
    const sorter = isYearFacet
      ? (a: { label: string }, b: { label: string }) => {
          const ay = parseInt(a.label, 10);
          const by = parseInt(b.label, 10);
          if (Number.isFinite(ay) && Number.isFinite(by)) return by - ay;
          return a.label.localeCompare(b.label);
        }
      : (a: { count: number }, b: { count: number }) => b.count - a.count;

    const items: FilterFacet[] = f.values
      .filter((v) => v.count > 0)
      .map<FilterFacet>((v) => ({
        label: normalizeFilterLabel(v.label),
        count: v.count,
        input: v.input,
      }))
      .sort(sorter)
      .slice(0, isYearFacet ? 50 : 12);
    if (items.length === 0) continue;

    // Cycle 14AO (owner): year facet had visible gaps in the middle —
    // "2025, 2024, 2022, 2020" — because Shopify omits buckets with zero
    // products. The customer reads gap years as "broken filter," not
    // "no inventory for that year." Fill the range with greyed-out
    // 0-count placeholders so the list reads as a continuous timeline.
    // input is undefined on filler rows; the sidebar disables them.
    let finalItems: FilterFacet[] = items;
    if (isYearFacet && items.length >= 2) {
      const present = new Map<number, FilterFacet>(
        items
          .map<[number, FilterFacet]>((it) => [parseInt(it.label, 10), it])
          .filter(([y]) => Number.isFinite(y)),
      );
      const years = Array.from(present.keys());
      if (years.length >= 2) {
        const max = Math.max(...years);
        const min = Math.min(...years);
        const filled: FilterFacet[] = [];
        for (let y = max; y >= min; y--) {
          const hit = present.get(y);
          if (hit) {
            filled.push(hit);
          } else {
            // Cycle 14AO: gap-filler placeholder. `input` omitted so
            // FilterSidebar renders the row as disabled/greyed — customer
            // sees the year in the timeline but learns there's no inventory.
            filled.push({ label: String(y), count: 0 });
          }
        }
        finalItems = filled;
      }
    }

    groups.push({
      title: f.label.toUpperCase(),
      type: "check",
      items: finalItems,
    });
  }
  return groups;
}

export type CollectionSort =
  | "best-selling"
  | "price-asc"
  | "price-desc"
  | "newest"
  | "title-asc";

const SORT_KEY_MAP: Record<
  CollectionSort,
  { sortKey: string; reverse: boolean }
> = {
  "best-selling": { sortKey: "BEST_SELLING", reverse: false },
  "price-asc": { sortKey: "PRICE", reverse: false },
  "price-desc": { sortKey: "PRICE", reverse: true },
  newest: { sortKey: "CREATED", reverse: true },
  "title-asc": { sortKey: "TITLE", reverse: false },
};

export type CollectionFiltersInput = {
  sort?: CollectionSort;
  /**
   * Each entry is a Shopify ProductFilter value as JSON-stringified input
   * (the same shape as `FilterValueNode.input` returned by the storefront).
   * Server-side decoding lets us pass the value straight through, which keeps
   * us aligned with whatever filter types Shopify adds in the future.
   */
  rawInputs?: string[];
  /**
   * Cycle 4 (Mike F-17): when present, re-rank the visible page so products
   * that fit this vehicle appear first, universal candidates next, mismatches
   * last. Only applies when the user hasn't picked an explicit non-default
   * sort — explicit user choice always wins.
   */
  vehicle?: { year: string | number; make: string; model: string };
  /**
   * Cycle 14j (owner): when true, the response only contains products the
   * vehicle is positively confirmed to fit — universal candidates and
   * mismatches are omitted. Powers the "Show only fits for my vehicle"
   * toggle on the collection page.
   */
  fitsOnly?: boolean;
  /**
   * Cycle 14AO (owner): the customer's saved sub-model answers (bed length,
   * cab type, trim) — typically loaded from the garage cookie/DB by the
   * caller. When present, the collection grid drops products that name a
   * conflicting dimension (e.g. a 6.5'-bed tonneau on a customer who
   * picked 5.5'). Universal/silent products survive.
   */
  subModelAnswers?: SubModelAnswer[];
  /**
   * Cycle 14AO (owner): when true (default when vehicle is set), products
   * that the fitment check positively flags as MISMATCH are dropped from
   * the response entirely. Universal candidates remain. This makes "set
   * vehicle = filter" the default behaviour the owner asked for; the prior
   * implementation only re-ranked, leaving non-fitting products in the
   * grid behind a manual toggle.
   */
  hideMismatches?: boolean;
};

function bucketByFitment(
  products: CatalogProduct[],
  vehicle: NonNullable<CollectionFiltersInput["vehicle"]>,
): CatalogProduct[] {
  const fits: CatalogProduct[] = [];
  const universal: CatalogProduct[] = [];
  const mismatch: CatalogProduct[] = [];
  for (const p of products) {
    const verdict = checkFitment(p, vehicle);
    if (verdict === true) fits.push(p);
    else if (verdict === false) mismatch.push(p);
    else universal.push(p);
  }
  return [...fits, ...universal, ...mismatch];
}

/**
 * Build the Shopify Storefront ProductFilter[] for a vehicle, using the
 * cycle-3 structured tag schema (`make:Jeep`, `model:Wrangler`, `year:2014`).
 * Returns null when the catalog has no structured-tag coverage to query.
 */
function vehicleTagFilters(
  vehicle: NonNullable<CollectionFiltersInput["vehicle"]>,
): Record<string, unknown>[] {
  return [
    { tag: `make:${vehicle.make}` },
    { tag: `model:${vehicle.model}` },
    { tag: `year:${vehicle.year}` },
  ];
}

/**
 * Collection-wide product count from the Storefront filters payload.
 *
 * IMPORTANT (regressed in cycle 4 then re-fixed): only sum filter groups
 * where each product appears in EXACTLY ONE value. Tag-based facets (Make,
 * Model, Year, Color, Material, etc.) are multi-valued — a product tagged
 * "Make:Ford,Make:Lincoln" appears in BOTH "Ford" and "Lincoln" rows, so
 * summing those overcounts dramatically (Mike cycle-5: header showed
 * "2576 PRODUCTS" on Tonneau Covers, true total ~287).
 *
 * Trustworthy per-product groups in Shopify Storefront's payload:
 *   - "Availability" (in-stock + out-of-stock; every product is in exactly one)
 *   - "Product type" (every product has exactly one productType)
 *   - "Vendor" (every product has exactly one vendor)
 *
 * We try those in order and return the FIRST hit. If none are present (e.g.
 * Shopify omitted them on a thin collection), return null and let caller
 * fall back to the visible page size — better to show "24" than "2576".
 */
function totalFromFilters(collection: CollectionNode): number | null {
  const filters = collection.products.filters;
  if (!filters || filters.length === 0) return null;
  // Confirmed against the live Storefront API on 2026-05-03: real labels are
  // "Category" (Shopify Category Taxonomy, single-valued per product) and as
  // fallbacks "Vehicle type" + "Color" (also single-valued). The earlier
  // attempt used "Product type" / "Availability" / "Vendor" — none exist on
  // this store, so totalFromFilters returned null and the page rendered
  // products.length (=24, the page size). Cycle 5 (Mike): wrong number was
  // visible to every customer.
  for (const label of ["Category", "Vehicle type", "Color"]) {
    const f = filters.find((g) => g.label === label);
    if (f && f.values.length > 0) {
      return f.values.reduce((s, v) => s + v.count, 0);
    }
  }
  return null;
}

async function fetchCollectionPage(
  handle: string,
  first: number,
  filterInputs: Record<string, unknown>[],
  sortCfg: { sortKey: string; reverse: boolean } | undefined,
): Promise<CollectionNode | null> {
  const data = await shopifyFetch<GetCollectionResponse>(
    GET_COLLECTION_BY_HANDLE_QUERY,
    {
      handle,
      first,
      filters: filterInputs.length > 0 ? filterInputs : undefined,
      sortKey: sortCfg?.sortKey,
      reverse: sortCfg?.reverse,
    },
  );
  return data.collection ?? null;
}

/**
 * Cycle 14T (owner): /collections/best-sellers (and /new-arrivals, /sale)
 * are linked from chrome but do NOT exist as Shopify collections — those
 * URL slugs are synthetic, meant to be answered by a sort/filter on all
 * products. Until cycle-14T the page rendered the "NO PRODUCTS YET" empty
 * state because Shopify returned null for the handle. Build a synthetic
 * collection in code instead.
 */
const SYNTHETIC_COLLECTIONS: Record<
  string,
  {
    title: string;
    description: string;
    sortKey: "BEST_SELLING" | "CREATED_AT" | "UPDATED_AT" | "PRICE";
    reverse?: boolean;
    query?: string;
  }
> = {
  "best-sellers": {
    title: "Best Sellers",
    description: "Top-selling parts across the catalog this month.",
    sortKey: "BEST_SELLING",
  },
  "new-arrivals": {
    // Cycle 14Z (Mike-O2 N-2): was sortKey CREATED — invalid Shopify enum,
    // the storefront API rejects it as argumentLiteralsIncompatible. The
    // correct enum is CREATED_AT.
    title: "New Arrivals",
    description: "Latest additions to the Stehlen catalog.",
    sortKey: "CREATED_AT",
    reverse: true,
  },
  sale: {
    title: "On Sale",
    description: "Parts marked down from MSRP.",
    sortKey: "BEST_SELLING",
    query: "tag:sale",
  },
};

async function getSyntheticCollection(
  handle: string,
  first: number,
  opts: CollectionFiltersInput,
): Promise<CollectionResult | null> {
  const cfg = SYNTHETIC_COLLECTIONS[handle];
  if (!cfg) return null;
  try {
    const wideFirst = opts.vehicle ? Math.min(first * 3, 60) : first;
    let data = await shopifyFetch<GetProductsResponse>(GET_PRODUCTS_QUERY, {
      first: wideFirst,
      query: cfg.query,
      sortKey: cfg.sortKey,
      reverse: cfg.reverse,
    });
    // Cycle 14Z (Mike-O1 M-6): /collections/new-arrivals was rendering 0
    // products because the CREATED sort + tag query returned an empty set
    // for this catalog. Fall back to BEST_SELLING when the configured sort
    // returns nothing so the page never goes empty.
    if ((data.products?.nodes ?? []).length === 0 && cfg.sortKey !== "BEST_SELLING") {
      data = await shopifyFetch<GetProductsResponse>(GET_PRODUCTS_QUERY, {
        first: wideFirst,
        query: cfg.query,
        sortKey: "BEST_SELLING",
      });
    }
    let adapted = (data.products?.nodes ?? []).map(adapt);

    let fitMeta: CollectionFitMeta | undefined;
    // Cycle 14AO (owner): default behaviour now hides confirmed mismatches
    // when a vehicle is set — the owner's "filter is non-functional" complaint
    // was that setting YMM only re-ranked the grid; products from other
    // makes still appeared at the bottom. Caller may opt out with
    // hideMismatches: false (debug/admin) but the default flips on.
    const hideMismatches = opts.hideMismatches ?? Boolean(opts.vehicle);
    // Cycle 14AO: dimension answers also filter the grid when set, with or
    // without a vehicle (guest browsers can pick "5.5' BED" via the
    // DimensionPicker without committing to a YMM).
    const dimensionAnswers = opts.subModelAnswers ?? [];
    if (dimensionAnswers.length > 0) {
      adapted = filterByDimensionAnswers(adapted, dimensionAnswers);
    }
    if (opts.vehicle) {
      const verdicts = adapted.map((p) => ({
        p,
        fits: checkFitment(p, opts.vehicle!, dimensionAnswers),
      }));
      const exact = verdicts.filter((v) => v.fits === true).map((v) => v.p);
      const universal = verdicts
        .filter((v) => v.fits === undefined)
        .map((v) => v.p);
      const mismatch = verdicts.filter((v) => v.fits === false).map((v) => v.p);
      if (opts.fitsOnly) {
        adapted = exact.slice(0, first);
      } else if (hideMismatches) {
        adapted = [...exact, ...universal].slice(0, first);
      } else {
        adapted = [...exact, ...universal, ...mismatch].slice(0, first);
      }
      fitMeta = { fitsCount: exact.length, noExactFit: exact.length === 0 };
    } else {
      adapted = adapted.slice(0, first);
    }

    // Cycle 14AO-fix B-2: synthetic path already used adapted.length, which
    // is the correct post-filter count for synthetics (no second-stage
    // bucketing happens after the slice). Keep it.
    // Cycle 14AO-fix5 (Mike R6 NB-NEW-5): synthetic collections (best-sellers,
    // new-arrivals, sale) used to fall back to ROOF_RACK_FILTERS — a mock
    // shape with no `input` strings on its facets. Sidebar checkboxes
    // rendered but were entirely non-functional (no URL change, no grid
    // narrowing). Returning [] makes the sidebar render its honest empty
    // state ("No additional filters available.") instead of a decorative lie.
    // Real Shopify-driven facet introspection for synthetic collections is
    // a future ticket.
    return {
      handle,
      title: cfg.title,
      description: cfg.description,
      products: adapted,
      totalProducts: adapted.length,
      filters: [],
      fitMeta,
    };
  } catch (err) {
    console.error("[catalog] synthetic collection fell back:", err);
    return null;
  }
}

export async function getCollection(
  handle: string,
  first = 24,
  opts: CollectionFiltersInput = {},
): Promise<CollectionResult | null> {
  if (!shopifyConfigured) return mockCollection(handle, first);
  // Cycle 14T (owner): synthetic slugs (best-sellers, new-arrivals, sale)
  // bypass the Shopify collection-by-handle lookup entirely — they're
  // sort/filter views over all products.
  if (SYNTHETIC_COLLECTIONS[handle]) {
    return getSyntheticCollection(handle, first, opts);
  }
  const sortCfg = opts.sort ? SORT_KEY_MAP[opts.sort] : undefined;
  const userFilters = (opts.rawInputs ?? [])
    .map((s) => {
      try {
        return JSON.parse(s) as Record<string, unknown>;
      } catch {
        return null;
      }
    })
    .filter((v): v is Record<string, unknown> => v !== null);
  // Cycle 14AO-fix5 (Mike R6 NB-NEW-1): vehicle filtering must run whenever
  // a vehicle is set — sorting must NOT bypass it. The previous shape
  // `wantsFitBoost = vehicle && !sort` meant any explicit sort (price-asc,
  // newest, etc.) caused the fit-bucket pass to be skipped entirely, so a
  // 2021 F-150 customer who sorted by price saw 286 mixed-make products.
  // Now: when vehicle set, ALWAYS run the fit boost (filter + bucket); the
  // explicit sort still flows to Shopify so within-bucket order is sorted.
  const wantsFitBoost = Boolean(opts.vehicle);
  // Cycle 14AO-fix5 (Mike R6 NB-NEW-6): when a vehicle is set, strip stale
  // year/make/model sidebar filters from the user's URL ?f= input. The
  // sidebar drops those groups from view (Year/Make/Model are hidden under
  // a vehicle), but a leftover ?f=year:2018 from before the YMM was set
  // would keep filtering the grid invisibly with no UI to clear it.
  const filteredUserInputs = opts.vehicle
    ? userFilters.filter((input) => {
        if (typeof input !== "object" || input === null) return true;
        const obj = input as Record<string, unknown>;
        // Shopify Storefront ProductFilter shapes: tag-based filters use
        // {tag: "make:Ford"} / {tag: "year:2018"} etc. Cycle-3 schema.
        if (typeof obj.tag === "string") {
          const t = obj.tag.toLowerCase();
          if (
            t.startsWith("make:") ||
            t.startsWith("model:") ||
            t.startsWith("year:")
          ) {
            return false;
          }
        }
        // Productvendor / availability / variantOption filters survive.
        return true;
      })
    : userFilters;

  try {
    // Cycle 14b (Mike-2 MAJOR): cycle-9's vehicle-aware boost was broken.
    // It used Shopify Storefront's `productFilters: [{tag: "make:Jeep"}]`
    // as the "fit pool" query — but Shopify ignores that filter unless the
    // merchant has enabled the corresponding Search & Discovery facet. The
    // fit-pool returned the unfiltered top-N, so the bucket pass got an
    // empty top-up and the page kept its natural BEST_SELLING order
    // (Tesla / Dodge ahead of Wrangler-fit cards).
    //
    // New shape: pull a wider page (3x first, capped) and bucket on the
    // server with checkFitment. checkFitment uses the cycle-3 structured
    // tag schema where present, falls back to title-string match — same
    // logic that already drives every card chip and the cart banner, so
    // the rendering can never disagree with the ranking.
    const wideFirst = wantsFitBoost ? Math.min(first * 3, 60) : first;
    const collection = await fetchCollectionPage(
      handle,
      wideFirst,
      filteredUserInputs,
      sortCfg,
    );

    if (!collection) return mockCollection(handle, first);
    const rawAdapted = collection.products.nodes.map(adapt);
    const filters = collection.products.filters
      ? adaptFilters(collection.products.filters, {
          hasVehicle: Boolean(opts.vehicle),
        })
      : ROOF_RACK_FILTERS;

    // Cycle 14AO: filter by dimension answers (bed length, cab type, trim)
    // BEFORE fit-bucketing so the universal pool only contains products
    // that are still candidate fits given the customer's dimension answer.
    // Without this, a customer who answered "5.5' BED" still saw 6.5'-bed
    // tonneaus in the universal bucket of the bucketed grid.
    const dimensionAnswers = opts.subModelAnswers ?? [];
    const adapted =
      dimensionAnswers.length > 0
        ? filterByDimensionAnswers(rawAdapted, dimensionAnswers)
        : rawAdapted;

    // Cycle 14AO: hide mismatches by default when a vehicle is set. The
    // owner's "filter is non-functional" complaint was that the grid only
    // re-ranked — Tundra tonneaus stayed visible after the F-150 garage
    // was set. New default: positive fits + universals only; confirmed
    // mismatches are dropped. Caller can opt-out with hideMismatches:false
    // for debug/admin views.
    const hideMismatches = opts.hideMismatches ?? Boolean(opts.vehicle);

    let products: CatalogProduct[];
    let fitMeta: CollectionFitMeta | undefined;
    // Cycle 14AO-fix2 (Sam audit): refactored away from the
    // `(collection as { _postFilterTotal })` mutation hack. This local
    // is set by whichever branch ran filtering and is read once at the
    // bottom for the totalProducts assignment. No more property-bag
    // smuggling on a Shopify response object.
    let postFilterTotal: number | undefined;

    if (wantsFitBoost && opts.vehicle) {
      const verdicts = adapted.map((p) => ({
        p,
        fits: checkFitment(p, opts.vehicle!, dimensionAnswers),
      }));
      let exact = verdicts.filter((v) => v.fits === true).map((v) => v.p);
      const universal = verdicts.filter((v) => v.fits === undefined).map((v) => v.p);
      const mismatch = verdicts.filter((v) => v.fits === false).map((v) => v.p);

      // Cycle 14j (owner phone test): a 2021 F-150 garage on
      // /collections/tonneau-covers showed only "1 exact fit" even though the
      // Shopify catalog has many F-150 tonneaus — the wide-page (60 products
      // BEST_SELLING) bucket happened to surface one. Cycle 14h fallback
      // only fired when exact.length === 0; bump it to fire whenever exact
      // is below the visible page size so we always show a healthy fit pool
      // when the catalog has them.
      if (exact.length < first) {
        try {
          const v = opts.vehicle;
          // Use the first word of model (drops trim suffix like "1500"),
          // and a CATEGORY-SPECIFIC keyword phrase so the fallback search
          // doesn't grossly over-match.
          //
          // Cycle 14AO-fix8 (owner-found, prod): handle.split("-")[0] for
          // "truck-bed-mats" yielded "truck" → search "Ford F-150 truck"
          // → returned every F-150 product (trailer hitches, side steps,
          // storage boxes) which all passed checkFitment by year+make+model
          // tags and got dumped into the EXACT-FITS bucket. Customer saw
          // "FITS YOUR 2021 FORD F-150" stamped on storage boxes inside
          // the Truck Bed Mats grid. Same risk on "front-grilles" (yields
          // "front") and any future multi-word slug starting with a
          // generic word. Fix: explicit keyword map per real category
          // slug + post-fetch productType guard so only same-category
          // products survive into the padding pool.
          const shortModel = v.model.split(/\s+/)[0] ?? v.model;
          const seedKeyword = CATEGORY_FALLBACK_KEYWORD[handle];
          // Unknown / synthetic / make-collection slugs: skip the fallback
          // entirely rather than risk surfacing wrong-category products.
          // The wide-pool already exhausted the collection.
          const fallback: CatalogProduct[] = seedKeyword
            ? await searchProducts(
                `${v.make} ${shortModel} ${seedKeyword}`,
                48,
              )
            : [];
          const seenHandles = new Set([
            ...exact.map((p) => p.handle),
            ...universal.map((p) => p.handle),
            ...mismatch.map((p) => p.handle),
          ]);
          const padding: CatalogProduct[] = [];
          // Cycle 14AO: also dimension-filter the padding pool — without
          // this we'd re-introduce 6.5' bed tonneaus into the "fits" bucket
          // for a 5.5'-bed customer.
          const dimFilteredFallback =
            dimensionAnswers.length > 0
              ? filterByDimensionAnswers(fallback, dimensionAnswers)
              : fallback;
          // Cycle 14AO-fix8 (owner-found, prod): also category-filter the
          // padding pool so a Shopify free-text search seeded with our
          // CATEGORY_FALLBACK_KEYWORD can't bleed wrong-category products
          // into "exact fits". Truck Bed Mats grid was seeing storage
          // organizers, trailer hitches, and side steps because their
          // F-150 tags passed checkFitment. Now we additionally require
          // the product's resolved categoryHandle to match `handle`, OR
          // (for products with no resolvable categoryHandle) the productType
          // string to contain the seedKeyword.
          const seedKw = (seedKeyword ?? "").toLowerCase();
          const paddingPool = dimFilteredFallback.filter((p) => {
            if (p.categoryHandle === handle) return true;
            // Backstop for products our categoryHandleFor mapper doesn't
            // recognize: keyword match against the productType / category
            // text. Empty seedKw means no fallback ran in the first place.
            if (seedKw && p.category && p.category.toLowerCase().includes(seedKw)) {
              return true;
            }
            return false;
          });
          for (const p of paddingPool) {
            if (seenHandles.has(p.handle)) continue;
            const fits = checkFitment(p, v, dimensionAnswers);
            if (fits === true) padding.push(p);
            seenHandles.add(p.handle);
          }
          if (padding.length > 0) exact = [...exact, ...padding];
        } catch (err) {
          console.error("[catalog] fits fallback search failed:", err);
        }
      }

      // Cycle 14AO-fix B-2: count of products that actually match the
      // active filter set, used as totalProducts so the FILTERS button +
      // mobile drawer footer don't lie ("286 PRODUCTS" while only 4 fit).
      if (opts.fitsOnly) {
        products = exact.slice(0, first);
        postFilterTotal = exact.length;
      } else if (hideMismatches) {
        products = [...exact, ...universal].slice(0, first);
        postFilterTotal = exact.length + universal.length;
      } else {
        products = [...exact, ...universal, ...mismatch].slice(0, first);
        postFilterTotal = exact.length + universal.length + mismatch.length;
      }
      fitMeta = {
        fitsCount: exact.length,
        noExactFit: exact.length === 0,
      };
    } else {
      products = adapted.slice(0, first);
      // Same accounting for the no-vehicle, dimension-only narrowing case
      // so the count badge tells the truth there too.
      if (dimensionAnswers.length > 0) {
        postFilterTotal = adapted.length;
      }
    }

    // Cycle 4 fix (owner): collection-wide total. Before this we returned
    // products.length (= page size) which made every collection lie and read
    // "24 of 24". Sum the Storefront filter values that don't depend on
    // user-picked filter narrowing to derive a real total.
    // Cycle 14AO-fix B-2: prefer the post-filter count when bucketing or
    // dimension-filtering ran — otherwise the badge always reports the
    // unfiltered collection size.
    const totalProducts =
      postFilterTotal ?? totalFromFilters(collection) ?? products.length;

    return {
      handle,
      title: collection.title,
      description: collection.description,
      products,
      totalProducts,
      filters,
      fitMeta,
    };
  } catch (err) {
    console.error("[catalog] getCollection fell back:", err);
    return mockCollection(handle, first);
  }
}

export function getCategoryBySlug(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug) ?? null;
}

type GetProductByHandleResponse = {
  product: ProductNode | null;
};

export async function getProduct(handle: string): Promise<CatalogProduct | null> {
  const mock = () => PRODUCTS.find((p) => p.handle === handle) ?? null;
  if (!shopifyConfigured) return mock();
  try {
    const data = await shopifyFetch<GetProductByHandleResponse>(
      GET_PRODUCT_BY_HANDLE_QUERY,
      { handle },
    );
    return data.product ? adapt(data.product) : mock();
  } catch (err) {
    console.error("[catalog] getProduct fell back:", err);
    return mock();
  }
}

/**
 * Cycle 4 (Mike F-7): the legacy `/search` page filtered the local mock list,
 * so "wrangler bumper" returned 0 against a 1,322-product catalog. Wire to
 * Shopify Storefront's free-text `query` and adapt to CatalogProduct shape.
 */
export async function searchProducts(
  query: string,
  first = 24,
): Promise<CatalogProduct[]> {
  if (!shopifyConfigured) {
    return PRODUCTS.filter((p) =>
      `${p.title} ${p.fitTitle} ${p.chips.join(" ")}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    ).slice(0, first);
  }
  try {
    const data = await shopifyFetch<GetProductsResponse>(GET_PRODUCTS_QUERY, {
      first,
      query,
      sortKey: "RELEVANCE",
    });
    return (data.products?.nodes ?? []).map(adapt);
  } catch (err) {
    console.error("[catalog] searchProducts fell back to mock:", err);
    return PRODUCTS.filter((p) =>
      `${p.title} ${p.fitTitle} ${p.chips.join(" ")}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    ).slice(0, first);
  }
}

export async function getRelatedProducts(
  handle: string,
  first = 4,
  vehicle?: { year: string | number; make: string; model: string } | null,
): Promise<{ products: CatalogProduct[]; allFitVehicle: boolean }> {
  // Cycle 8b (owner): used to return mock roof-rack placeholders. Last cycle
  // queried Shopify by productType only — better imagery, but for an F-150
  // owner the rail filled up with Toyota Tundra tonneau covers. Now narrows
  // by vehicle when one is set:
  //   1. same productType + matching make/model/year tags (exact-fit pool)
  //   2. if pool < `first`, top up with same productType + same make
  //   3. if still < `first`, top up with same productType regardless of vehicle
  // Heading on the PDP switches between "SIMILAR PRODUCTS THAT FIT YOUR
  // VEHICLE" (when allFitVehicle is true) and "SIMILAR PRODUCTS" otherwise.
  if (!shopifyConfigured) {
    const base = PRODUCTS.find((p) => p.handle === handle);
    const pool = base
      ? PRODUCTS.filter((p) => p.handle !== handle && p.category === base.category)
      : PRODUCTS.filter((p) => p.handle !== handle);
    return { products: pool.slice(0, first), allFitVehicle: false };
  }
  try {
    const me = await getProduct(handle);
    const productType = me?.category;
    // Cycle 14Z (Mike-O1 M-8): even if productType is missing, fall back to
    // a generic best-sellers rail so the SIMILAR PRODUCTS section never
    // disappears from the PDP entirely.
    if (!productType) {
      const fallback = await shopifyFetch<GetProductsResponse>(
        GET_PRODUCTS_QUERY,
        { first, sortKey: "BEST_SELLING" },
      );
      const fb = (fallback.products?.nodes ?? [])
        .filter((n) => n.handle !== handle)
        .slice(0, first)
        .map(adapt);
      return { products: fb, allFitVehicle: false };
    }
    const excludeSelf = `-handle:${handle}`;

    // Cycle 9 (owner): when the customer is on a 2022 F-150 tonneau cover, the
    // exact productType "tonneau cover - lock & roll up" only has 1 other
    // F-150 product in the whole catalog — the rail was padding with Toyota
    // Tundras under "DOES NOT FIT" ribbons. Broaden to the category root
    // (e.g. "tonneau") so all tonneau subtypes are eligible, then prefer
    // exact-fit and refuse to pad with confirmed mismatches.
    const broadKeyword = productType.split(/[\s\-]/)[0] || productType; // "tonneau", "headlights", etc.
    const broadQuery = `product_type:${broadKeyword}* ${excludeSelf}`;
    const data = await shopifyFetch<GetProductsResponse>(GET_PRODUCTS_QUERY, {
      first: 50,
      query: broadQuery,
      sortKey: "BEST_SELLING",
    });
    const broadPool = (data.products?.nodes ?? [])
      .filter((n) => n.handle !== handle)
      .map(adapt);

    if (!vehicle) {
      return { products: broadPool.slice(0, first), allFitVehicle: false };
    }

    const verdicts = broadPool.map((p) => ({ p, fits: checkFitment(p, vehicle) }));
    const exact = verdicts.filter((v) => v.fits === true).map((v) => v.p);
    const universal = verdicts.filter((v) => v.fits === undefined).map((v) => v.p);

    // Compose: exact fits first, then unknown/universal. Drop confirmed
    // mismatches entirely — better to show 1 honest card than 4 with 3 reds.
    let composed = [...exact, ...universal].slice(0, first);
    // Cycle 14Z (Mike-O1 M-8): if the rail still has < `first` products,
    // pad from BEST_SELLING so customers always see a SIMILAR PRODUCTS
    // section. Pad cards are universal/unknown-fit so they don't lie.
    if (composed.length < first) {
      const have = new Set(composed.map((p) => p.handle));
      const fb = await shopifyFetch<GetProductsResponse>(GET_PRODUCTS_QUERY, {
        first: first * 3,
        sortKey: "BEST_SELLING",
      });
      for (const node of fb.products?.nodes ?? []) {
        if (composed.length >= first) break;
        if (node.handle === handle || have.has(node.handle)) continue;
        composed.push(adapt(node));
        have.add(node.handle);
      }
    }
    const allFitVehicle = composed.length > 0 && composed.every((c) => exact.includes(c));
    return { products: composed, allFitVehicle };
  } catch (err) {
    console.error("[catalog] getRelatedProducts fell back to mock:", err);
    return {
      products: PRODUCTS.filter((p) => p.handle !== handle).slice(0, first),
      allFitVehicle: false,
    };
  }
}

export function getProductReviews(handle: string): ProductReview[] {
  void handle;
  return REVIEWS;
}

/**
 * Cycle 8 (owner): the PDP "Vehicle Compatibility" tab used to render a
 * hardcoded mock array of fitment rows (e.g. "2021-2026 SuperCrew · 5.5' Bed
 * — FITS") on EVERY product, regardless of what the product actually fits.
 * Customers viewing a 6.5' Bed product saw 5.5' Bed claims. Until real ACES
 * data is wired, return [] so the section renders empty (the PDP component
 * already handles empty arrays gracefully) instead of lying. The fitment
 * heading + product title carry the truth in the meantime.
 */
export function getProductFitment(handle: string): FitmentRow[] {
  void handle;
  return [];
}
