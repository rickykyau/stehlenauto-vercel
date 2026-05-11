import { NextResponse } from "next/server";
import { shopifyConfigured, shopifyFetch } from "@/lib/shopify/client";
import { PREDICTIVE_SEARCH_QUERY } from "@/lib/shopify/queries";
import { CATEGORIES, PRODUCTS } from "@/lib/catalog/mock";
import { logSearchMiss } from "@/lib/admin/search-misses";
import { getCurrentVehicle } from "@/lib/garage/server";

export const runtime = "nodejs";

type ShopifyProduct = {
  id: string;
  handle: string;
  title: string;
  featuredImage: { url: string; altText: string | null } | null;
  priceRange: { minVariantPrice: { amount: string; currencyCode: string } };
};

type ShopifyCollection = { id: string; handle: string; title: string };

type Suggestion = {
  type: "product" | "collection" | "query";
  label: string;
  href: string;
  image?: string | null;
  price?: number;
};

// Cycle 14AV (Mike F-4 MAJOR): typeahead suggestions had no fitment
// awareness — a customer with 2018 F-150 saved was being shown a
// Silverado 1500 and a Tundra as the top two product suggestions for
// "tonneau cover". The full /search results page already sorts
// fitment-first; the typeahead must do the same so the dropdown
// reflects the customer's saved vehicle from the very first keystroke.
//
// We can't run the full checkFitment() here (predictiveSearch returns
// only title/handle/image/price — no fitment metafields). Use a
// lightweight title-vs-vehicle ranker: 0 = title mentions vehicle.model
// AND year is in any title year-range, 2 = title mentions a different
// known make/model (confirmed misfit), 1 = unknown / universal.
const KNOWN_MODELS = [
  "f-150", "f150", "f-250", "f250", "f-350", "f350",
  "silverado", "sierra", "colorado", "canyon",
  "ram 1500", "ram 2500", "ram 3500", "ram",
  "tundra", "tacoma",
  "frontier", "titan",
  "ridgeline",
  "wrangler", "gladiator", "grand cherokee", "cherokee",
  "bronco", "ranger", "maverick",
];

function normTitle(s: string): string {
  return s.toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, " ");
}

function rankByVehicle(
  title: string,
  vehicle: { year: string | number; make: string; model: string } | null,
): 0 | 1 | 2 {
  if (!vehicle) return 1;
  const t = normTitle(title);
  const model = normTitle(vehicle.model);
  const make = normTitle(vehicle.make);
  const year = String(vehicle.year);

  const titleHasOurModel =
    t.includes(model) ||
    // Normalize F-150 ↔ F150 ↔ F 150
    t.includes(model.replace(/[-\s]/g, "")) ||
    t.includes(model.replace(/[-\s]/g, " "));
  const titleHasOurMake = t.includes(make);

  if (titleHasOurModel) {
    // If a year-range is present, ensure ours falls inside.
    const range = t.match(/(\d{4})\s*[-–]\s*(\d{4})/);
    if (range) {
      const lo = parseInt(range[1], 10);
      const hi = parseInt(range[2], 10);
      const y = parseInt(year, 10);
      if (Number.isFinite(y) && y >= lo && y <= hi) return 0;
      // Year explicitly outside the title range → confirmed misfit.
      if (Number.isFinite(y)) return 2;
    }
    return 0;
  }

  // Title mentions a different known model → confirmed misfit.
  for (const other of KNOWN_MODELS) {
    if (other === model || other.includes(model) || model.includes(other)) continue;
    if (t.includes(other)) {
      // Last-chance: shared make alone isn't enough to rescue it
      // (Sierra and Silverado are both GM but never cross-fit).
      void titleHasOurMake;
      return 2;
    }
  }

  return 1;
}

function mockSuggest(query: string): Suggestion[] {
  const q = query.toLowerCase();
  const products = PRODUCTS.filter((p) =>
    `${p.title} ${p.fitTitle} ${p.chips.join(" ")}`
      .toLowerCase()
      .includes(q),
  )
    .slice(0, 4)
    .map<Suggestion>((p) => ({
      type: "product",
      label: p.title,
      href: `/products/${p.handle}`,
      image: p.image,
      price: p.price,
    }));
  const cols = CATEGORIES.filter((c) =>
    c.name.toLowerCase().includes(q) || c.slug.includes(q),
  )
    .slice(0, 3)
    .map<Suggestion>((c) => ({
      type: "collection",
      label: c.name,
      href: `/collections/${c.slug}`,
    }));
  return [...cols, ...products];
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ suggestions: [] });

  if (!shopifyConfigured) {
    return NextResponse.json({ suggestions: mockSuggest(q) });
  }

  try {
    const [data, vehicle] = await Promise.all([
      shopifyFetch<{
        predictiveSearch: {
          products: ShopifyProduct[];
          collections: ShopifyCollection[];
          queries: { text: string }[];
        };
      }>(PREDICTIVE_SEARCH_QUERY, { query: q }),
      getCurrentVehicle().catch(() => null),
    ]);

    // Cycle 14AV (Mike F-4 MAJOR): rank product suggestions against the
    // saved vehicle. Collections + queries don't carry vehicle signal so
    // they're emitted in their original order. Products are sorted
    // fits → unknown → misfit; misfits are kept (in case the customer
    // is intentionally browsing for another vehicle), just bucketed last.
    const out: Suggestion[] = [];
    for (const c of data.predictiveSearch.collections ?? []) {
      out.push({
        type: "collection",
        label: c.title,
        href: `/collections/${c.handle}`,
      });
    }
    const productSuggestions: Array<{ rank: 0 | 1 | 2; idx: number; s: Suggestion }> = [];
    (data.predictiveSearch.products ?? []).forEach((p, idx) => {
      const rank = rankByVehicle(p.title, vehicle);
      // Cycle 14AV-fix1 (Mike F-4 follow-on): when a vehicle is saved
      // and the suggestion is a confirmed misfit (rank 2 — title carries
      // a different known model or year out of range), drop it from the
      // typeahead entirely. Sorting alone doesn't help when Shopify's
      // predictiveSearch returns ONLY misfits ("tonneau" → Tundra +
      // Sierra, no F-150 in scope) — the customer still sees the wrong
      // truck as their first impression. Better to show empty product
      // suggestions and let collections + queries lead than to render
      // a misfit at position #1 of the dropdown.
      if (vehicle && rank === 2) return;
      productSuggestions.push({
        rank,
        idx,
        s: {
          type: "product",
          label: p.title,
          href: `/products/${p.handle}`,
          image: p.featuredImage?.url ?? null,
          price: Math.round(parseFloat(p.priceRange.minVariantPrice.amount)),
        },
      });
    });
    productSuggestions.sort((a, b) => (a.rank - b.rank) || (a.idx - b.idx));
    for (const ps of productSuggestions) out.push(ps.s);
    for (const q of data.predictiveSearch.queries ?? []) {
      out.push({
        type: "query",
        label: q.text,
        href: `/search?q=${encodeURIComponent(q.text)}`,
      });
    }
    if (out.length === 0) {
      // Log the empirical miss before falling back to the mock suggestions —
      // /admin/sourcing-gaps reads this aggregated to show real demand we
      // currently can't meet.
      void logSearchMiss({
        query: q,
        source: "suggest",
        vehicle: vehicle
          ? {
              id: vehicle.id,
              make: vehicle.make,
              model: vehicle.model,
              year: vehicle.year,
            }
          : null,
      });
      return NextResponse.json({ suggestions: mockSuggest(q) });
    }
    return NextResponse.json({ suggestions: out });
  } catch (err) {
    console.error("[search/suggest] fell back:", err);
    return NextResponse.json({ suggestions: mockSuggest(q) });
  }
}
