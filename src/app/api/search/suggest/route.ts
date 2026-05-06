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
    const data = await shopifyFetch<{
      predictiveSearch: {
        products: ShopifyProduct[];
        collections: ShopifyCollection[];
        queries: { text: string }[];
      };
    }>(PREDICTIVE_SEARCH_QUERY, { query: q });

    const out: Suggestion[] = [];
    for (const c of data.predictiveSearch.collections ?? []) {
      out.push({
        type: "collection",
        label: c.title,
        href: `/collections/${c.handle}`,
      });
    }
    for (const p of data.predictiveSearch.products ?? []) {
      out.push({
        type: "product",
        label: p.title,
        href: `/products/${p.handle}`,
        image: p.featuredImage?.url ?? null,
        price: Math.round(parseFloat(p.priceRange.minVariantPrice.amount)),
      });
    }
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
      const vehicle = await getCurrentVehicle().catch(() => null);
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
