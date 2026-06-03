import { CATEGORIES, POPULAR_VEHICLES } from "@/lib/catalog/mock";

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
// Served as a Route Handler (not a static public/ file) so the category and
// popular-vehicle lists stay in lockstep with the live catalog.

export const dynamic = "force-static";
export const revalidate = 86400; // refresh daily

function buildLlmsTxt(base: string): string {
  const categoryLines = CATEGORIES.map(
    (c) => `- [${c.name}](${base}/collections/${c.slug})`,
  ).join("\n");

  // Mirror the sitemap's vehicle-slug derivation exactly so llms.txt links
  // resolve to the same /vehicle/[slug] hubs crawlers already know.
  const vehicleLines = POPULAR_VEHICLES.map((v) => {
    const slug = `${v.make.toLowerCase()}-${v.model
      .toLowerCase()
      .replace(/\s+/g, "-")}`;
    return `- [${v.make} ${v.model} (${v.years})](${base}/vehicle/${slug})`;
  }).join("\n");

  return `# Stehlen Auto

> Heavy-duty vehicle accessories engineered from cold-rolled steel. No
> drilling required, bolt-on installation, and fitment guaranteed for your
> exact year/make/model. Family-run, shipping nationwide from Corona, CA
> since 2015.

Stehlen Auto sells aftermarket accessories for pickup trucks and SUVs —
tonneau covers, bull bars, running boards, grille guards, headlights,
trailer hitches, bed mats, roof racks, and more. Every product page states
whether it fits the shopper's specific vehicle (year, make, model, and where
relevant bed length / cab type / trim) before it can be added to cart.

## Why shoppers choose Stehlen
- Fitment guaranteed — if a part doesn't fit the vehicle it was bought for,
  returns are free.
- Free shipping on every order (no minimum).
- 30-day hassle-free returns with a prepaid FedEx label; full refund or
  store credit with a 10% bonus.
- No-drill, bolt-on engineering — most installs need only hand tools.

## Shop by category
${categoryLines}

## Shop by vehicle
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
- Phone: +1-888-378-4536
- Address: 1160 W. Rincon St, Corona, CA 92878, USA
- Sitemap: ${base}/sitemap.xml
`;
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
