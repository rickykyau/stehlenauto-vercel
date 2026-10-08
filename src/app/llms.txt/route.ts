import fs from "node:fs";
import path from "node:path";
import { CATEGORIES } from "@/lib/catalog/mock";

// GEO (Generative Engine Optimization): /llms.txt is the emerging
// llmstxt.org convention — a curated, plain-text site map written FOR large
// language models. When an AI answer engine (ChatGPT, Perplexity, Claude,
// Gemini) is reasoning about "where to buy a no-drill tonneau cover for an
// F-150," this file hands it the canonical brand summary, the category
// taxonomy, the policy facts (free shipping, 30-day returns, fitment
// guarantee), and clean deep links — instead of forcing it to scrape and
// guess. It complements (does not replace) sitemap.xml + JSON-LD: the
// sitemap is for crawlers, the schema is for parsers, llms.txt is for the
// model's reasoning context.
//
// Served as a Route Handler (not a static public/ file) so the vehicle list
// is computed from the real fitment index (data/products_by_ymm.json) and the
// policy facts match the /legal pages word for word. Keep every claim here
// sourced — AI engines quote this file.

export const dynamic = "force-static";
export const revalidate = 86400; // refresh daily

function buildLlmsTxt(base: string): string {
  const categoryLines = CATEGORIES.map(
    (c) => `- [${c.name}](${base}/collections/${c.slug})`,
  ).join("\n");

  const vehicleLines = topVehicles(16)
    .map((v) => {
      const slug = `${v.make}-${v.model}`.toLowerCase().replace(/\s+/g, "-");
      return `- [${v.make} ${v.model} (${v.from}–${v.to})](${base}/vehicle/${slug})`;
    })
    .join("\n");

  return `# Stehlen Auto

> Aftermarket accessories for pickup trucks and SUVs, sold with an exact
> year / make / model fitment check on every product page. Free ground
> shipping to the lower 48 with no minimum, 30-day returns with a free FedEx
> label, and a fitment guarantee. Selling bolt-on accessories since 2015;
> based in Walnut, California.

Stehlen Auto sells tonneau covers, bull guards and grille guards, running
boards and side steps, trailer hitches and wiring, front grilles,
headlights, truck bed mats, floor mats, roof racks and baskets, chase racks
and MOLLE panels. Each product page lists the exact vehicles it fits (with
bed length, cab type or trim where it matters), what is in the box, install
notes (including whether drilling is needed), and specifications. Shoppers
can save their vehicle and the site confirms fit before checkout.

## Facts (from the policy pages)
- Shipping: free ground shipping on every order to the lower 48 states, no
  minimum. In-stock orders ship within 1 business day from CA, NV or TX
  warehouses and arrive in 2–6 business days. FedEx 2-Day and Overnight
  available at checkout.
- Returns: 30-day window; free prepaid FedEx return label for any reason
  (fitment, defect or change of mind); full refund to the original card or
  store credit with a 10% bonus. Items must be unused and in original
  packaging.
- Fitment guarantee: if a part doesn't fit the vehicle it was bought for,
  the return is free.
- Warranty on Stehlen Auto-brand parts: lifetime structural, 5-year finish,
  2-year hardware. Parts from other brands (e.g. CURT) carry their
  manufacturer's warranty.
- Trailer hitch towing ratings (weight carrying and tongue weight) are listed
  on each hitch page. Never exceed the lowest-rated towing component or the
  vehicle manufacturer's towing capacity.

## Shop by category
${categoryLines}

## Most-covered vehicles
${vehicleLines}

## Key pages
- [Home](${base}/)
- [All collections](${base}/collections)
- [Search](${base}/search?q=)
- [Help center](${base}/help)
- [Install guides](${base}/help/install)
- [Contact](${base}/help/contact)
- [About Stehlen Auto](${base}/about)

## Policies
- [Fitment guarantee](${base}/legal/fitment-guarantee)
- [Returns (30-day)](${base}/legal/returns)
- [Shipping (free, no minimum)](${base}/legal/shipping)
- [Warranty](${base}/legal/warranty)

## Contact
- Phone: +1-951-332-7000
- Address: 21912 Garcia Lane, Walnut, CA 91789, USA
- Sitemap: ${base}/sitemap.xml
`;
}

type TopVehicle = { make: string; model: string; from: number; to: number; count: number };

// Vehicles with the most fitting products, from the CA-built fitment index.
// Ranked by count, but counts are never printed (stakeholder rule).
function topVehicles(n: number): TopVehicle[] {
  let index: Record<string, string[]> = {};
  try {
    index = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "products_by_ymm.json"), "utf8"));
  } catch {
    return [];
  }
  const agg = new Map<string, { make: string; model: string; years: number[]; handles: Set<string> }>();
  for (const [key, handles] of Object.entries(index)) {
    const [year, make, model] = key.split("|");
    const k = `${make}|${model}`;
    let a = agg.get(k);
    if (!a) agg.set(k, (a = { make, model, years: [], handles: new Set() }));
    a.years.push(Number(year));
    handles.forEach((h) => a!.handles.add(h));
  }
  return [...agg.values()]
    .map((a) => ({ make: a.make, model: a.model, from: Math.min(...a.years), to: Math.max(...a.years), count: a.handles.size }))
    .sort((x, y) => y.count - x.count)
    .slice(0, n);
}

export async function GET(): Promise<Response> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://stehlenauto.com";
  return new Response(buildLlmsTxt(base), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
