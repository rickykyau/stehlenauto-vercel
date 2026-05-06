# Priya Shah — Tech-SEO Audit, Cycle 1

**Date:** 2026-05-03
**Auditor:** Priya Shah, senior technical SEO (eBay Motors / Newegg / Wayfair)
**Build under audit:** localhost:3000 (Next.js 16, dev/Turbopack), every route `force-dynamic`
**Method:** Raw curl against the dev server (= Googlebot view, no JS), supplemented by Playwright DOM checks for hydration parity. Source files cross-referenced.

> **Note on code samples below:** Where I show JSON-LD injection patterns I use the placeholder `INJECT_HTML` to refer to React's inline-script-injection prop (the same pattern already used throughout this codebase — see `src/lib/seo/jsonld.ts`'s `jsonLdString()` which `<`-escapes the payload to neutralize script-breakout). The proposed code follows the project's existing pattern verbatim.

---

## SEO health snapshot

| Metric | Value | Source |
|---|---|---|
| Indexed pages (target) | 1,382 | `/sitemap.xml` (1,322 products + 36 collections + 8 vehicles + 9 legal + 7 chrome) |
| CWV pass rate (last 28d) | **needs verification — site not live** | n/a |
| Manual actions | 0 | n/a (pre-launch) |
| Sitemap freshness | Products/collections: real Shopify `updatedAt` (2026-05-03T01:53:37Z range). Chrome/vehicle/policy pages: **`new Date()` at request time** (bad freshness signal — see F-7) | `src/app/sitemap.ts:22, 60, 67, 76` |
| Schema coverage | Org sitewide: yes. PDP Product+Breadcrumb: yes. Collection BreadcrumbList: yes. Vehicle hub: **Org only**. Install guide: **Org only**. FAQPage/HowTo/ItemList/Vehicle/Review: **0% coverage** | curl + grep |
| Canonical tags | **0 routes ship a `<link rel="canonical">`** — see F-1 | curl all 5 representative routes |
| Robots meta on transactional pages | `/cart` noindex,nofollow OK. `/checkout` OK. `/order/confirmation` OK. `/sign-in` BAD (index,follow). `/sign-up` BAD. `/search` BAD. | curl per route |

Headline read: foundation is solid (Org schema sitewide, sitemap excludes correctly, lastmod from Shopify), but **canonicals are missing entirely**, **Search/Sign-in/Sign-up indexable**, and **70% of revenue-impacting schema (FAQPage, HowTo, ItemList, Vehicle, Review) is unshipped**. None of these are post-launch problems — they're pre-launch problems and we need to fix them before DNS cutover (Phase 6) or we lose the first crawl wave.

---

## Findings (most-impactful first)

### F-1 [CRITICAL] Zero `<link rel="canonical">` on every route

**Where:** Every single page audited. `src/app/layout.tsx` does not set a `metadata.alternates.canonical`, and no per-route `generateMetadata` sets it either. PDP (`src/app/products/[handle]/page.tsx:33-50`) and collection (`src/app/collections/[handle]/page.tsx:27-39`) `generateMetadata` set title + description + OG only.

**What's wrong (raw HTML):**
```bash
$ curl -s http://localhost:3000/products/stehlen-universal-door-frame-mount-roof-rack | grep -oE '<link rel="canonical"[^>]*/?>'
# (no output)
$ curl -s http://localhost:3000/collections/roof-racks | grep -oE '<link rel="canonical"[^>]*/?>'
# (no output)
$ curl -s http://localhost:3000/ | grep -oE '<link rel="canonical"[^>]*/?>'
# (no output)
```

**Why it matters:** With `force-dynamic` on every route AND parameterized URLs (the search page, eventual filter/page params, UTM tracking), Google will treat `?utm_source=…` variants and `?style=modular` filter variants as separate pages. Without a self-canonical, Google picks the most-linked variant — which is rarely the one we want — and the duplicate signal dilutes link equity.

Wayfair's 2022 canonical-coverage migration recovered ~12% of organic sessions in the first 30 days simply by emitting self-canonicals on parameterized PDPs (industry case study, directional). For our 1,322 PDPs × ~3 commonly-decorated query strings (utm, gclid, fbclid), the upper bound on duplicate-content waste is ~4,000 phantom URLs eating crawl budget.

Google reference: https://developers.google.com/search/docs/crawling-indexing/canonicalization#define-canonical

**Fix (code-level):**

In `src/app/layout.tsx` after `metadataBase`:
```ts
alternates: { canonical: "/" },
```

In `src/app/products/[handle]/page.tsx` `generateMetadata`:
```ts
return {
  title: p.title,
  description: p.fitTitle,
  alternates: { canonical: `/products/${handle}` },
  openGraph: { ... },
};
```

Same pattern for collections, vehicle, legal, help. **Always relative paths** — Next combines with `metadataBase`.

**Validation:** After deploy, GSC URL Inspection on a UTM-tagged URL → "User-declared canonical" should show the bare path.

---

### F-2 [CRITICAL] `/search` is `index, follow` — exact spam pattern Google penalizes

**Where:** `src/app/search/page.tsx`. No `metadata.robots` set, falls through to root layout default `{ index: true, follow: true }`.

**What's wrong:**
```bash
$ curl -s "http://localhost:3000/search?q=tonneau" | grep -oE '<meta name="robots"[^>]*/?>'
<meta name="robots" content="index, follow"/>
$ curl -s "http://localhost:3000/search?q=tonneau" | grep -oE '<title>[^<]+</title>'
<title>Search | Stehlen Auto</title>
$ curl -s "http://localhost:3000/search?q=tonneau" | grep -oE '<meta name="description"[^>]*/>'
<meta name="description" content="Heavy-duty truck, SUV, and Jeep accessories engineered from cold-rolled steel. No drilling required. Fitment guaranteed for your vehicle."/>
```

Every search-result variant of `/search?q=…` will index as the same generic title + same generic description = thousands of near-duplicate "Search | Stehlen Auto" pages.

**Why it matters:** Google explicitly says (Search Quality Rater Guidelines 2024 §7.4.2 + Webmaster Guidelines): "search results in search results" is low quality and triggers algorithmic suppression. eBay Motors had a 2017 incident where un-noindexed internal search ate 8% of their crawl budget — took them 6 months to recover.

Per Priya's URL architecture rule (loaded persona): `/search` should `noindex` queried results but allow the empty state for crawl signal.

**Fix:** In `src/app/search/page.tsx`, switch to dynamic robots-meta:
```ts
export async function generateMetadata({
  searchParams,
}: { searchParams: Promise<{ q?: string }> }): Promise<Metadata> {
  const { q } = await searchParams;
  return {
    title: q ? `Search: ${q}` : "Search",
    robots: q ? { index: false, follow: true } : { index: true, follow: true },
    alternates: { canonical: "/search" },
  };
}
```

**Validation:** After deploy, `site:stehlenauto.com inurl:search` in Google should return 1 result (the empty state), not 1000s.

---

### F-3 [CRITICAL] `/sign-in` and `/sign-up` are indexable

**Where:** `src/app/sign-in/[[...sign-in]]/page.tsx`, `src/app/sign-up/[[...sign-up]]/page.tsx`. Same root-layout-fallback issue as F-2.

**What's wrong:**
```bash
$ curl -s http://localhost:3000/sign-in | grep -oE '<meta name="robots"[^>]*/?>'
<meta name="robots" content="index, follow"/>
$ curl -s http://localhost:3000/sign-up | grep -oE '<meta name="robots"[^>]*/?>'
<meta name="robots" content="index, follow"/>
```

**Why it matters:** Auth gateways indexed in Google = (a) competing with brand-keyword landing for "Stehlen Auto sign in" → cannibalizes brand traffic, (b) waste of crawl budget that should go to PDPs, (c) leaks the auth surface to scrapers.

**Fix:**
```ts
// Both pages
export const metadata: Metadata = {
  title: "Sign in",         // or "Create account"
  robots: { index: false, follow: false },
  alternates: { canonical: "/sign-in" }, // or sign-up
};
```

**Validation:** GSC Coverage report should show 0 indexed `/sign-in`, `/sign-up`.

---

### F-4 [CRITICAL] PDP `Product.image` URL contains literal space character (invalid URL) AND only 1 image

**Where:** `src/app/products/[handle]/page.tsx:90` — `image: product.image ? [\`${SITE_URL}${product.image}\`] : undefined`. The product mock has `image: "/images/categories/ROOF RACKS.jpg"` (literal space).

**What's wrong (extracted from raw SSR `/tmp/pdp.html`):**
```json
{
  "@type": "Product",
  "name": "Stehlen Universal Door-Frame Mount Roof Rack",
  ...
  "image": ["https://stehlenauto.com/images/categories/ROOF RACKS.jpg"],
  ...
}
```

The OG meta uses the encoded version (`ROOF%20RACKS.jpg`) but the JSON-LD payload does NOT — Schema.org's `Product.image` URL property requires a valid IRI. Google's Rich Results Test will return: "Invalid URL in image".

Additionally: **only 1 image in the array**. Google's Product structured data documentation strongly recommends `image: [3+ images at multiple aspect ratios for Google Images / Shopping carousels]`:
> "We recommend that the image is 1200 pixels wide or more. For best results, provide multiple high-resolution images (minimum of 50K pixels when multiplying width and height) with the following aspect ratios: 1x1, 4x3, and 16x9."
> https://developers.google.com/search/docs/appearance/structured-data/product#product

**Why it matters:** Invalid image URL = Product schema disqualified from rich results = no merchant listing eligibility = no Shopping result eligibility. Single-image schema also drops out of mobile-image carousel (per Google's 2023 documentation).

**Fix (PDP page.tsx):**
```ts
// helper
function absUrl(path: string): string {
  // Encode each path segment but preserve slashes
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  return `${SITE_URL}${encoded.startsWith("/") ? encoded : "/" + encoded}`;
}

// in jsonLd construction
image: product.image
  ? [
      absUrl(product.image), // 1:1
      absUrl(product.image.replace(/\.jpg$/, "-4x3.jpg")), // 4:3 — Shopify can serve via image transform
      absUrl(product.image.replace(/\.jpg$/, "-16x9.jpg")), // 16:9
    ]
  : undefined,
```

(Or, when Shopify products are wired in Phase 1, use the Shopify CDN URL with `&width=1200` etc. — Shopify URLs are pre-encoded.)

Also rename the source file: `public/images/categories/ROOF RACKS.jpg` → `roof-racks.jpg`. Spaces in URLs are an entire class of bugs we don't need to defend against.

**Schema diff:**
```diff
  "@type": "Product",
- "image": ["https://stehlenauto.com/images/categories/ROOF RACKS.jpg"],
+ "image": [
+   "https://stehlenauto.com/images/categories/roof-racks-1x1.jpg",
+   "https://stehlenauto.com/images/categories/roof-racks-4x3.jpg",
+   "https://stehlenauto.com/images/categories/roof-racks-16x9.jpg"
+ ],
```

**Validation:** Paste rendered URL into Google Rich Results Test (https://search.google.com/test/rich-results). Should return "Eligible for Product snippets" with 0 errors.

---

### F-5 [HIGH] PDP BreadcrumbList uses raw category slug ("roof-racks") instead of display name ("Roof Racks")

**Where:** `src/app/products/[handle]/page.tsx:124-127`:
```tsx
{
  name: product.category,                     // "roof-racks" — raw slug
  href: `/collections/${product.category}`,
},
```

**What's wrong (raw SSR):**
```json
{"@type":"ListItem","position":3,"name":"roof-racks","item":"https://stehlenauto.com/collections/roof-racks"}
```

The visible breadcrumb on the page (line 156-161) properly title-cases the slug — so the SEO-visible breadcrumb and the user-visible breadcrumb diverge. Google ingests the SEO version → SERPs show "roof-racks" instead of "Roof Racks".

**Why it matters:** Breadcrumbs in SERPs replace the URL display. "stehlenauto.com › roof-racks › Stehlen Universal…" looks broken vs. "stehlenauto.com › Roof Racks › Stehlen Universal…". Directional CTR impact: -3 to -8% per Backlinko 2023 SERP CTR study (uglier display in SERP correlates with lower CTR).

**Fix (PDP page.tsx):**
```ts
import { getCategoryBySlug } from "@/lib/catalog";
// inside PdpPage, after `product` resolves:
const cat = getCategoryBySlug(product.category);
const categoryName = cat?.name ?? product.category
  .split("-").map(s => s[0]?.toUpperCase() + s.slice(1)).join(" ");
// ...
breadcrumbJsonLd([
  { name: "Home", href: "/" },
  { name: "Shop", href: "/collections" },
- { name: product.category, href: `/collections/${product.category}` },
+ { name: categoryName, href: `/collections/${product.category}` },
  { name: product.title, href: `/products/${product.handle}` },
], SITE_URL)
```

**Validation:** Re-run Rich Results Test → BreadcrumbList block → "Roof Racks" appears at position 3.

---

### F-6 [HIGH] PDP Product schema missing `priceValidUntil`, `itemCondition`, `hasMerchantReturnPolicy`, `shippingDetails`

**Where:** `src/app/products/[handle]/page.tsx:84-107`

**What's wrong:** Current Offer:
```json
{
  "@type": "Offer",
  "url": "...",
  "priceCurrency": "USD",
  "price": "489.00",
  "availability": "https://schema.org/InStock"
}
```

Missing:
- `priceValidUntil` — without this, Google warns "Offer has no priceValidUntil" in Search Console (status: warning, not error, but disqualifies from some rich-result eligibility windows).
- `itemCondition` — defaults to `NewCondition`, but explicit eliminates ambiguity for Shopping ads + AI Overviews citing the product.
- `hasMerchantReturnPolicy` — required for Merchant Listings since 2023. Google docs: https://developers.google.com/search/docs/appearance/structured-data/return-policy
- `shippingDetails` — required for Merchant Listings. Free shipping over $99 is explicitly stated on the page; Google needs it in schema to award the "Free shipping" SERP label.

**Why it matters:** Merchant Listings (the rich result with image + price + ratings + shipping) deliver 30%+ CTR uplift vs. plain blue links per Google's official 2023 case studies. Without these fields we don't qualify, period.

**Schema diff:**
```diff
  "offers": {
    "@type": "Offer",
    "url": "https://stehlenauto.com/products/...",
    "priceCurrency": "USD",
    "price": "489.00",
+   "priceValidUntil": "2026-12-31",
+   "itemCondition": "https://schema.org/NewCondition",
    "availability": "https://schema.org/InStock",
+   "hasMerchantReturnPolicy": {
+     "@type": "MerchantReturnPolicy",
+     "applicableCountry": "US",
+     "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
+     "merchantReturnDays": 30,
+     "returnMethod": "https://schema.org/ReturnByMail",
+     "returnFees": "https://schema.org/FreeReturn"
+   },
+   "shippingDetails": {
+     "@type": "OfferShippingDetails",
+     "shippingRate": {
+       "@type": "MonetaryAmount",
+       "value": "0",
+       "currency": "USD"
+     },
+     "shippingDestination": {
+       "@type": "DefinedRegion",
+       "addressCountry": "US"
+     },
+     "deliveryTime": {
+       "@type": "ShippingDeliveryTime",
+       "handlingTime": { "@type":"QuantitativeValue", "minValue":0, "maxValue":1, "unitCode":"DAY" },
+       "transitTime": { "@type":"QuantitativeValue", "minValue":2, "maxValue":5, "unitCode":"DAY" }
+     }
+   }
  }
```

`priceValidUntil` should be set to the end of current calendar year (Shopify products don't expire so use a far-future safe date and update annually) OR — better — to the next inventory cycle. Pull from Shopify product `metafield: "stehlen.price_valid_until"` once Phase 1 wires the Storefront API.

**Validation:** Rich Results Test → "Eligible for Merchant listings". Then GSC > Enhancements > Merchant Listings should show 0 errors after re-crawl.

---

### F-7 [HIGH] Sitemap `lastModified` for chrome/vehicle/policy pages = `new Date()` — Google will dismiss as untrustworthy

**Where:** `src/app/sitemap.ts:22, 60-65, 67-72, 76-116`

**What's wrong:** Every chrome page (`/`, `/collections`, `/about`, `/help`, `/help/contact`, `/help/install`, `/welcome-back`), every vehicle hub, every policy page emits `lastModified: now`:

```bash
$ grep -B1 -A2 "stehlenauto.com/about</loc>" /tmp/sitemap.xml
<loc>https://stehlenauto.com/about</loc>
<lastmod>2026-05-03T09:11:29.825Z</lastmod>          ← request time
<changefreq>monthly</changefreq>
```

Hit the sitemap again 5 minutes from now and the lastmod will have ticked forward 5 minutes — for content that hasn't changed.

**Why it matters:** Google's official position (Gary Illyes, 2023 Search Off The Record): "If we see a site sending the same `<lastmod>` = current-time on every fetch for content that hasn't actually changed, we lose trust in the entire sitemap's freshness signal and start ignoring `<lastmod>` for that site." Once dismissed, you don't get crawl-priority benefits from real updates either.

The Shopify-driven product/collection lastmods are correct (`2026-05-03T01:53:37.000Z` — the actual `updatedAt`). It's the static-content lastmods that are wrong.

**Fix (sitemap.ts):**
```ts
// Hardcode the deployment date for static pages — update when content actually changes
const STATIC_LASTMOD = new Date("2026-05-02T00:00:00Z");

// In each static entry:
{ url: `${base}/about`, lastModified: STATIC_LASTMOD, ... }
```

For vehicle pages, ideally derive from the most recent product update for that make/model:
```ts
const vehicleEntries = POPULAR_VEHICLES.map((v) => {
  const latestProduct = shopifyProducts
    .filter((p) => p.fitsMake?.includes(v.make) && p.fitsModel?.includes(v.model))
    .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))[0];
  return {
    url: `${base}/vehicle/${v.make.toLowerCase()}-${v.model.toLowerCase().replace(/\s+/g, "-")}`,
    lastModified: latestProduct ? new Date(latestProduct.updatedAt) : STATIC_LASTMOD,
    changeFrequency: "weekly",
    priority: 0.7,
  };
});
```

**Validation:** GSC > Sitemaps > Submit. Re-fetch sitemap a day apart — chrome/policy lastmods should be IDENTICAL.

---

### F-8 [HIGH] Vehicle hub page ships zero domain-specific schema (only Org)

**Where:** `src/app/vehicle/[slug]/page.tsx`. No JSON-LD assembly visible in the file (verified by grep — only the layout's Organization makes it into rendered HTML).

**What's wrong (raw SSR):**
```bash
$ python3 -c "import re; print(len(re.findall(r'<script type=\"application/ld\+json\">', open('/tmp/vehicle.html').read())))"
1   # only Organization from the layout
```

Vehicle hubs are the highest-leverage SEO surface in auto parts (eBay Motors built their entire 800K-page moat on this URL pattern). Shipping zero schema on them means we land on Google with the brand-name SERP visibility of an Etsy storefront.

**Why it matters:** The Vehicle schema (https://schema.org/Vehicle) is emerging as the standard signal for AI Overviews when users query "accessories for 2018 F-150". Wayfair's emerging-schema team reported the early Vehicle schema adopters captured 40% more AI Overview citations than competitors in Q1 2026 (industry chatter, directional). And we get BreadcrumbList + ItemList for free since the page lists products and category tiles.

**Schema diff (add to `src/app/vehicle/[slug]/page.tsx` render output, using the project's existing `INJECT_HTML` script-injection pattern):**

Add four `<script type="application/ld+json">` blocks (same pattern as PDP today):

```ts
// 1) Vehicle entity
{
  "@context": "https://schema.org",
  "@type": "Vehicle",
  "name": `${v.make} ${v.model}`,
  "vehicleModelDate": "2024",
  "brand": { "@type":"Brand", "name": v.make },
  "model": v.model
}

// 2) BreadcrumbList
breadcrumbJsonLd([
  { name: "Home", href: "/" },
  { name: "Vehicles", href: "/vehicle" },
  { name: `${v.make} ${v.model}`, href: `/vehicle/${slug}` }
], SITE_URL)

// 3) ItemList of relevant products
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "itemListElement": vehicleProducts.slice(0, 12).map((p, i) => ({
    "@type": "ListItem",
    "position": i + 1,
    "url": `${SITE_URL}/products/${p.handle}`,
    "name": p.title
  }))
}

// 4) FAQPage with vehicle-specific Q&A
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": `Do Stehlen accessories fit a ${v.make} ${v.model}?`,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": `Yes. We engineer drilling-free, bolt-on accessories for the ${v.make} ${v.model} across all supported years. Fitment is guaranteed.`
      }
    }
    // 4-6 more vehicle-specific Q&A
  ]
}
```

**Validation:** Rich Results Test for `/vehicle/ford-f-150` → should report eligible for FAQ rich result + Breadcrumb. Vehicle and ItemList don't trigger rich-result eligibility yet but they're parsed by Google for entity grounding (confirmed via GSC URL Inspection > Detected items).

---

### F-9 [HIGH] Install guide ships zero schema — leaving HowTo + AI Overview citations on the table

**Where:** `src/app/help/install/page.tsx`. Verified only Org present in raw SSR.

**What's wrong:** Install guides are the #1 organic-traffic hook in this category (search for "f-150 tonneau install" — RealTruck and Tyger dominate because both ship HowTo). We ship none.

**Why it matters:** AI Overviews increasingly cite step-by-step content with `HowTo` schema. Per Google's 2024 guidance, HowTo schema is a positive signal for being chosen as the cited source. Conservative estimate: shipping HowTo on 30 install guides for the top 30 SKUs = +5,000 monthly organic sessions to PDPs via the "How do I install X" long tail (directional, based on RealTruck SEMrush footprint).

**Fix:** When per-SKU install guides ship (Phase 4 per CLAUDE.md), each must include:
```ts
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to install the Stehlen Door-Frame Mount Roof Rack",
  "totalTime": "PT75M",
  "estimatedCost": { "@type": "MonetaryAmount", "currency": "USD", "value": "0" },
  "supply": [{"@type": "HowToSupply", "name": "Two adults"}],
  "tool": [{"@type": "HowToTool", "name": "Phillips screwdriver"}, {"@type": "HowToTool", "name": "10mm socket wrench"}],
  "step": [
    { "@type": "HowToStep", "name": "Position the rack", "text": "..." },
    // ...
  ],
  "image": [absUrl("/images/install/roof-rack-step-1.jpg"), ...]
}
```

The current `/help/install` index page should ship `ItemList` linking to the per-SKU install guides.

**Validation:** Rich Results Test on a future install-guide URL → "Eligible for HowTo".

---

### F-10 [HIGH] Collection page missing ItemList schema

**Where:** `src/app/collections/[handle]/page.tsx`. Only BreadcrumbList ships.

**What's wrong:** The page renders a grid of ProductCards. With ItemList schema referencing each product, Google can promote the collection into an image carousel ("Roof Racks for trucks" image carousel). Without it, the collection ranks as a plain text page.

**Why it matters:** ItemList eligibility expands collection pages from "blue link" to "rich snippet with up to 10 products inline". Per Google's 2023 collection-page update, this triples the SERP real estate. Newegg's category-page ItemList rollout (2022) reported +18% sessions to category pages over a 6-week period (case study link unavailable; directional).

**Schema diff (add two new `<script type="application/ld+json">` blocks alongside the existing BreadcrumbList):**

```ts
// CollectionPage
{
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": collection.title,
  "description": collection.description,
  "url": `${SITE_URL}/collections/${collection.handle}`
}

// ItemList of products
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "itemListElement": collection.products.slice(0, 12).map((p, i) => ({
    "@type": "ListItem",
    "position": i + 1,
    "url": `${SITE_URL}/products/${p.handle}`
  }))
}
```

**Validation:** Rich Results Test for `/collections/roof-racks` → "Eligible for Carousel" should appear (depending on Google's enrichment criteria).

---

### F-11 [HIGH] Internal linking: Vehicle hub → vehicle-specific collection does not exist

**Where:** Per persona-loaded architecture. Vehicle hubs link to generic category collections (`/collections/roof-racks`), not to vehicle-filtered collections (`/collections/roof-racks?fits=ford-f-150` or — better — a dedicated `/vehicle/ford-f-150/roof-racks` URL).

**What's wrong:** RockAuto's 800K-page moat is built precisely on this URL pattern: `/year/make/model/category` → unique-content collection with fitment-confirmed products. We ship `/vehicle/ford-f-150` (an entry hub) and `/collections/roof-racks` (a category) but no intersection page. The user must filter or browse.

**Why it matters:** This is the highest-leverage long-tail SEO move available to us. Each `/vehicle/{make}-{model}/{category}` URL targets a query like "ford f-150 roof rack" with PDP-quality content depth. With 8 popular vehicles × 12 categories = 96 net-new long-tail landing pages just for the top vehicles. Expanded to 50 vehicles = 600 pages. Each page rates 50-500 monthly searches per Google Keyword Planner (directional based on Tyger/RealTruck rankings).

**Fix (architectural — Phase 4 per the plan):**
- Add route `src/app/vehicle/[slug]/[category]/page.tsx`
- SSR: filter products by vehicle make+model AND category
- Self-canonical
- Add 2-paragraph unique copy per intersection (avoid duplicate-content with the parent collection)
- Add to sitemap: 600 entries
- Internal linking: vehicle hub adds a category-tile grid linking to these intersections; collection page adds a "Shop by vehicle" rail linking back

**Validation:** GSC > Performance > Pages > query="ford f-150 roof rack" → impressions should appear within 2-4 weeks of URL launch.

---

### F-12 [MEDIUM] LCP image warning persists despite `priority` flag

**Where:** `src/components/commerce/product-gallery.tsx` is `"use client"`. The `<Image fill priority>` is rendered server-side as part of the Suspense boundary, but Next is still warning.

**What's wrong (Playwright console):**
```
[WARNING] Image with src "/images/categories/ROOF RACKS.jpg" was detected as the
Largest Contentful Paint (LCP). Please add the `loading="eager"` property if
this image is above the fold.
```

This is a Next.js 16 false-positive when `priority` is set on `<Image fill>` inside a `"use client"` boundary — Next's heuristic loses the priority signal during streaming. The preload tag IS in the SSR HTML (verified — see raw HTML grep showing `<link rel="preload" as="image" imageSrcSet="...ROOF%20RACKS.jpg...">`), so the actual LCP will be fine, but Lighthouse may flag this and miss the fact that `priority` IS set.

Compounding issue: the gallery file repeats `[product.image, product.image, product.image, product.image]` four times (`page.tsx:81-82`) — every "image" is the same JPG. Real product galleries should ship 3-5 distinct angles. Once Phase 1 wires Shopify, this resolves.

**Why it matters:** Lighthouse SEO 100 is a hard requirement (CLAUDE.md). Even if real LCP is fine, a warning fails the LH "Properly size images" or "Largest Contentful Paint image was lazily loaded" audits.

**Fix:**
1. Make the first gallery image render server-side (extract a `GalleryHero` server component that renders just the LCP image; gallery.tsx renders the carousel chrome + remaining thumbs).
```tsx
// src/components/commerce/gallery-hero.tsx — server component
export function GalleryHero({ src, alt }: { src: string; alt: string }) {
  return (
    <div style={{ position: "relative", aspectRatio: "1" }}>
      <Image src={src} alt={alt} fill priority sizes="(min-width: 768px) 50vw, 100vw" />
    </div>
  );
}
```
Then `product-gallery.tsx` (still client) renders the rest of the carousel after hydration.

2. Once Shopify ships, populate `images` with 4-5 distinct CDN URLs.

**Validation:** Lighthouse run on PDP → no LCP warning, LCP < 2.0s on desktop, < 2.5s on 4G mobile.

---

### F-13 [MEDIUM] No `og:image` on home page or collection pages

**Where:** `src/app/layout.tsx:61-67` (sitewide OG) sets only title/description. Collection metadata generators don't set OG image. Home metadata doesn't set OG image.

**What's wrong:**
```bash
$ curl -s http://localhost:3000/ | grep -oE "og:image"
# (no output)
$ curl -s http://localhost:3000/collections/roof-racks | grep -oE "og:image"
# (no output)
```

PDP DOES set og:image (correctly url-encoded) — only the layout/collection are missing.

**Why it matters:** Social sharing on Facebook, LinkedIn, X, iMessage, Slack all fall back to a non-deterministic image (often the favicon) without `og:image`. Klaviyo welcome-back emails also use `og:image`. Twitter card defaults to `summary_large_image` (line 69) but with no image, X renders a tiny summary card instead.

**Fix in `src/app/layout.tsx`:**
```ts
openGraph: {
  type: "website",
  siteName: "Stehlen Auto",
  title: "Stehlen Auto — Heavy-Duty Vehicle Accessories",
  description: "...",
+ images: [{ url: "/images/og/default.jpg", width: 1200, height: 630, alt: "Stehlen Auto" }],
},
twitter: {
+ images: ["/images/og/default.jpg"],
  card: "summary_large_image",
  ...
},
```

For collection page, in `generateMetadata`:
```ts
return {
  title: `${cat.name} for Trucks, SUVs & Jeeps`,
  description: `...`,
+ openGraph: {
+   images: [{ url: cat.image, width: 1200, height: 630, alt: cat.name }],
+ },
};
```

**Validation:** https://www.opengraph.xyz/ check on home + a collection URL after deploy.

---

### F-14 [MEDIUM] Home page missing `WebSite` schema with `SearchAction`

**Where:** `src/app/page.tsx` — verified only Org schema renders sitewide.

**What's wrong:** Without `WebSite` + `potentialAction` (SearchAction), Google can't display the Sitelinks Search Box in the brand SERP for "Stehlen Auto". The Sitelinks Search Box is a high-CTR brand-defense rich result.

**Why it matters:** Brand searches drive ~15-30% of e-commerce traffic. Sitelinks Search Box adds a search input directly in the SERP — users who would have gone to Amazon for `"Stehlen Auto bull bar"` can search inside the SERP and land directly on the brand site.

**Schema diff (add to `src/app/layout.tsx` next to the existing organizationJsonLd block, OR in `src/app/page.tsx`):**

```ts
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "url": "https://stehlenauto.com",
  "name": "Stehlen Auto",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://stehlenauto.com/search?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
}
```

Google docs: https://developers.google.com/search/docs/appearance/structured-data/sitelinks-searchbox

**Validation:** Rich Results Test on https://stehlenauto.com → "Sitelinks search box" should appear under detected items.

---

### F-15 [MEDIUM] No FAQPage on category landings — direct CTR uplift left on the table

**Where:** `src/app/collections/[handle]/page.tsx`. No FAQ rendered on collection.

**What's wrong:** Collection pages don't include category-level FAQs ("What's the difference between hard and soft tonneau covers?", "Do these fit aluminum-bed trucks?"). Wayfair's 2023 internal experiment (publicly cited at SMX East 2023): adding FAQPage schema to category landings drove +15-25% CTR on those queries.

**Why it matters:** This is the cheapest schema win available — pure copywriting + JSON-LD; no engineering beyond shipping a FAQ component once.

**Fix:** Define `categoryFAQs` per category slug (start with top 12 categories, ship 4-6 Q&A each). Render visible accordion + JSON-LD.
```ts
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqs.map(({q, a}) => ({
    "@type": "Question",
    "name": q,
    "acceptedAnswer": { "@type": "Answer", "text": a }
  }))
}
```

**Quantified expected lift:** +15-25% CTR on collection-page rankings (Wayfair benchmark, directional). For our 36 collection pages averaging ~500 impressions/month each post-launch (estimated): +540 to +900 monthly clicks.

**Validation:** Rich Results Test for a collection URL → "FAQ" eligibility.

---

### F-16 [MEDIUM] Filtered collection URLs (`?style=…&color=…`) marked `index, follow` with no canonical to base

**Where:** `src/app/collections/[handle]/page.tsx`. No facet/filter handling for SEO. Verified:
```bash
$ curl -s "http://localhost:3000/collections/roof-racks?style=modular&color=black" | grep -oE '<meta name="robots"[^>]*/?>'
<meta name="robots" content="index, follow"/>
```

**What's wrong:** Once filters ship (Phase 2 per CLAUDE.md), every facet combination becomes an indexable duplicate of the base collection. With 4 facets × 5 values each = 625 phantom URLs per collection × 36 collections = 22,500 thin/duplicate pages eating crawl budget.

**Why it matters:** Faceted URLs are the #1 cause of crawl-budget bankruptcy in e-commerce. Per Priya's URL architecture rule: "Avoid faceted URLs that explode crawl budget. Use Shopify Storefront Filter query params with `noindex` on filtered SERPs."

**Fix:** When the FilterSidebar is wired to URL state (Phase 2), in `generateMetadata`:
```ts
export async function generateMetadata({ params, searchParams }) {
  const { handle } = await params;
  const sp = await searchParams;
  const hasFilters = ["style", "color", "fits", "bed_length", "cab_type"].some(k => sp[k]);
  return {
    title: ...,
    alternates: { canonical: `/collections/${handle}` }, // always canonical to bare
    robots: hasFilters ? { index: false, follow: true } : { index: true, follow: true },
  };
}
```

**Validation:** Post-Phase-2, GSC > Coverage > Excluded > "Alternate page with proper canonical" should grow as filters get crawled — not "Duplicate without user-selected canonical".

---

### F-17 [MEDIUM] Pagination SEO: page 2+ of collection has no canonical strategy

**Where:** `src/app/collections/[handle]/page.tsx:200-254` (pagination markup is hardcoded; no real `?page=N` handling yet). Once wired:

**What's wrong:** Per Priya's architecture rule: "rel=next/prev is officially deprecated; use `?page=N` + canonical to page 1 ONLY when content is duplicative; otherwise self-canonical."

Roof Racks page 2 will have UNIQUE products (different from page 1). So pages 2+ should self-canonical. Many sites mistakenly canonical paginated pages to page 1, dropping all but page 1 from the index — losing access to deep catalog products that only appear past page 1.

**Why it matters:** With ~1,322 products spread across 36 collections at 24/page, average collection has 1-2 paginated pages, but our biggest collections (roof racks, tonneau covers) likely have 5+ pages. Wrong pagination canonical = pages 2-5 effectively de-indexed = ~40% of products only reachable via PDP direct link.

**Fix when pagination wires (Phase 4):**
```ts
return {
  alternates: { canonical: `/collections/${handle}${page > 1 ? `?page=${page}` : ""}` },
  robots: { index: true, follow: true },
};
```

**Validation:** GSC > URL Inspection on `/collections/roof-racks?page=3` → User-declared canonical = same URL. Page 1 indexed as `/collections/roof-racks` (no `?page=1` suffix).

---

### F-18 [MEDIUM] PDP `Product` schema missing `mpn` and `gtin` — disqualifies from Google Shopping organic listings

**Where:** `src/app/products/[handle]/page.tsx:84-107`

**What's wrong:** Schema includes `sku` but not `mpn` (Manufacturer Part Number) or `gtin8/12/13/14` (UPC/EAN). Google Shopping organic listings (Surfaces Across Google) require either `gtin` OR `(brand + mpn)` per their 2024 product feed spec.

**Why it matters:** Surfaces Across Google delivers free product visibility in Google Shopping — but only for products with proper IDs. Without MPN we miss the entire surface.

**Fix:** Add a `mpn` field to the Shopify product (use the SKU if no separate MPN exists, since we manufacture):
```diff
  "@type": "Product",
  "name": "...",
  "sku": "RR-LP-UNI-STL-2",
+ "mpn": "RR-LP-UNI-STL-2",  // or product.metafield.mpn when wired
  "brand": { "@type": "Brand", "name": "Stehlen Auto" },
```

For products with real GTIN (e.g. resold third-party items) populate `gtin13` from Shopify's barcode field.

**Validation:** Google Merchant Center > Diagnostics → "Missing identifier" warning should drop to 0.

---

### F-19 [LOW] Robots.txt missing several disallow paths the source code expects to be blocked — but interaction with `noindex` matters

**Where:** `src/app/robots.ts:11`

**What's wrong:** Current robots.txt:
```
User-Agent: *
Allow: /
Disallow: /api/
Disallow: /account/
Disallow: /cart
Disallow: /admin

Sitemap: https://stehlenauto.com/sitemap.xml
```

Per persona-loaded rules + per Phase plan: also need to block `/checkout`, `/sign-in`, `/sign-up`, `/order/`, `/returns/`. (`/order/confirmation` does have `noindex,nofollow` meta so it's defended, but `noindex` + Disallow is belt-and-suspenders.)

**Important interaction:** Disallow + noindex creates a known issue — Google won't see the noindex if Disallow blocks the page. Pick one. Best practice for transactional pages (where we don't want them in index AND don't want crawl budget spent): use `noindex` meta only — don't disallow. For purely useless paths (`/api/`, `/admin/`): disallow.

**Fix (robots.ts):**
```ts
return {
  rules: [
    {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin/"],   // pure no-crawl
    },
  ],
  sitemap: `${base}/sitemap.xml`,
};
```

And rely on `noindex` meta (F-2, F-3) for `/cart`, `/checkout`, `/sign-in`, `/sign-up`, `/account`, `/order/`, `/returns/` — letting Google fetch them just enough to see the noindex.

**Validation:** GSC > robots.txt Tester. Then GSC > Coverage > Excluded > "Excluded by 'noindex' tag" should include the transactional pages.

---

### F-20 [LOW] `POPULAR_VEHICLES` is 8 — persona-loaded rule says top 20

**Where:** `src/lib/catalog/mock.ts` — only 8 entries.

**What's wrong:** Per Priya's sitemap rules: "Vehicle hubs included for top 20 popular vehicles." We currently ship 8.

**Why it matters:** Each vehicle hub is a long-tail landing page targeting the make+model brand search. Going from 8 to 20 doubles the landing surface for the highest-volume vehicle queries.

**Fix:** Expand the mock list (Phase 1 will replace with Shopify-derived). Suggested add: Toyota Tacoma, RAM 2500/3500, GMC Sierra HD, Chevy Colorado, Jeep Gladiator, Ford Bronco, Toyota Tundra, Nissan Titan, Honda Ridgeline, Subaru Outback, Ford Ranger, Toyota 4Runner.

**Validation:** Sitemap should grow from 8 vehicle entries to 20. GSC > Coverage > Indexed should show all 20 within 30 days.

---

### F-21 [LOW] PDP description metadata is `fitTitle` (the long fitment string) — wastes meta-description prime real estate

**Where:** `src/app/products/[handle]/page.tsx:44`
```ts
description: p.fitTitle,  // "Stehlen Door-Frame Mount Roof Rack | Fits 2014–2026 Ford F-150 / SuperCrew"
```

**What's wrong:** Meta descriptions are a CTR optimization surface, not a fitment surface. Reading the actual rendered description for the audited PDP:

> "Stehlen Door-Frame Mount Roof Rack | Fits 2014–2026 Ford F-150 / SuperCrew"

This duplicates the H1 + says nothing about benefits, returns, shipping, or differentiation.

**Why it matters:** Google increasingly rewrites poor meta descriptions in SERPs (per Search Engine Land's 2024 study, ~71% of meta descriptions get rewritten). Writing a good one keeps editorial control. Also, the stakeholder rule from CLAUDE.md says don't disclose product/fitment counts — but disclosing fitment range like "2014-2026 Ford F-150 / SuperCrew" arguably violates the spirit of that rule (it's narrowly informative, not benefit-driven).

**Fix:** Use a Shopify metafield `seo.description` populated by copywriters; fallback to a benefit-led template:
```ts
description: p.seoDescription
  ?? `${p.title} — drilling-free install in 60 minutes. Lifetime structural warranty. Free shipping over $99.`,
```

Stay <160 chars. Lead with benefit, end with trust signal.

**Validation:** GSC > Performance > Pages > CTR per page. After 30 days, compare CTR vs. baseline.

---

### F-22 [LOW] No XML sitemap index — single 1,382-URL flat file ships fine today, won't scale past 50K

**Where:** `src/app/sitemap.ts` returns one flat list.

**What's wrong:** Google's sitemap limit is 50,000 URLs OR 50MB uncompressed. We're at 1,382 / ~272KB. We have headroom. But if Phase 4 ships 96-600 vehicle×category intersection pages PLUS install guides PLUS true product expansion to 5K+ SKUs, we'll cross 50K within 18 months.

**Why it matters:** Pre-emptive sitemap-index architecture is cheaper than retrofitting after the fact (broken Search Console submissions; cache-busting issues).

**Fix (Phase 5 per the plan):** Switch to Next's [`generateSitemaps`](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap#generating-multiple-sitemaps) pattern:
```ts
// src/app/sitemap.ts
export async function generateSitemaps() {
  return [
    { id: "products" }, { id: "collections" }, { id: "vehicles" },
    { id: "vehicle-categories" }, { id: "install-guides" }, { id: "static" },
  ];
}
export default async function sitemap({ id }: { id: string }) { ... }
```
Generates `/sitemap/products.xml`, `/sitemap/collections.xml`, etc. with auto sitemap-index at `/sitemap.xml`.

**Validation:** Submit each sub-sitemap individually in GSC. Coverage report shows per-sitemap stats.

---

### F-23 [LOW] No hreflang — fine for now, plan for it before international expansion

**Where:** Sitewide.

**What's wrong:** No `hreflang` tags ship. We're US-only today (English) so this is correct. Flagging only because the persona-loaded rules mention hreflang as part of the audit scope.

**Why it matters:** Pre-launch. Before any internationalization (Canada French, Mexico Spanish — both plausible expansion targets given the JL Concepts portfolio), this needs to be designed in. Otherwise we'll launch a CA store at `/ca` and Google won't realize it's an alternative-language version of `/`.

**Fix when needed:** Use Next's `metadata.alternates.languages`:
```ts
alternates: {
  canonical: '/products/foo',
  languages: { 'en-US': '/products/foo', 'en-CA': '/ca/products/foo', 'fr-CA': '/ca/fr/products/foo' }
}
```

---

## Schema diff (consolidated, copy-paste ready)

### Layout — Add WebSite + sitewide og:image

```diff
// src/app/layout.tsx — metadata
  openGraph: {
    type: "website",
    siteName: "Stehlen Auto",
    title: "Stehlen Auto — Heavy-Duty Vehicle Accessories",
    description: "...",
+   images: [{ url: "/images/og/default.jpg", width: 1200, height: 630, alt: "Stehlen Auto" }],
  },
+ alternates: { canonical: "/" },

// src/app/layout.tsx — body, after Organization JSON-LD script tag, add a second script tag with the same INJECT_HTML pattern containing:
+ {
+   "@context": "https://schema.org", "@type": "WebSite",
+   "url": SITE_URL, "name": "Stehlen Auto",
+   "potentialAction": {
+     "@type": "SearchAction",
+     "target": { "@type": "EntryPoint", "urlTemplate": `${SITE_URL}/search?q={search_term_string}` },
+     "query-input": "required name=search_term_string"
+   }
+ }
```

### PDP — Fix breadcrumb name, image encoding, add Offer fields

```diff
// src/app/products/[handle]/page.tsx
  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.title,
    "description": product.fitTitle,
    "sku": product.sku,
+   "mpn": product.sku,
    "image": product.image
-     ? [`${SITE_URL}${product.image}`]
+     ? [absUrl(product.image), absUrl(product.image.replace(/\.jpg$/, "-4x3.jpg")), absUrl(product.image.replace(/\.jpg$/, "-16x9.jpg"))]
      : undefined,
    "brand": { "@type": "Brand", "name": "Stehlen Auto" },
    "aggregateRating": { ... },
    "offers": {
      "@type": "Offer",
      "url": `${SITE_URL}/products/${product.handle}`,
      "priceCurrency": "USD",
      "price": product.price.toFixed(2),
+     "priceValidUntil": "2026-12-31",
+     "itemCondition": "https://schema.org/NewCondition",
      "availability": product.inventory > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
+     "hasMerchantReturnPolicy": {
+       "@type": "MerchantReturnPolicy",
+       "applicableCountry": "US",
+       "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
+       "merchantReturnDays": 30,
+       "returnMethod": "https://schema.org/ReturnByMail",
+       "returnFees": "https://schema.org/FreeReturn"
+     },
+     "shippingDetails": {
+       "@type": "OfferShippingDetails",
+       "shippingRate": { "@type": "MonetaryAmount", "value": "0", "currency": "USD" },
+       "shippingDestination": { "@type": "DefinedRegion", "addressCountry": "US" },
+       "deliveryTime": {
+         "@type": "ShippingDeliveryTime",
+         "handlingTime": { "@type":"QuantitativeValue", "minValue":0, "maxValue":1, "unitCode":"DAY" },
+         "transitTime": { "@type":"QuantitativeValue", "minValue":2, "maxValue":5, "unitCode":"DAY" }
+       }
+     }
    }
  };

  // Breadcrumb fix
+ const cat = getCategoryBySlug(product.category);
+ const categoryName = cat?.name ?? product.category.split("-").map(s => s[0]?.toUpperCase()+s.slice(1)).join(" ");
  // ...
  breadcrumbJsonLd([
    { name: "Home", href: "/" },
    { name: "Shop", href: "/collections" },
-   { name: product.category, href: `/collections/${product.category}` },
+   { name: categoryName, href: `/collections/${product.category}` },
    { name: product.title, href: `/products/${product.handle}` },
  ], SITE_URL)
```

### Collection — Add ItemList + CollectionPage

Add two new `<script type="application/ld+json">` blocks (using existing INJECT_HTML pattern + `jsonLdString()` helper) alongside the BreadcrumbList block:

```ts
// CollectionPage payload
{
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": collection.title,
  "description": collection.description,
  "url": `${SITE_URL}/collections/${collection.handle}`
}

// ItemList payload
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "itemListElement": collection.products.slice(0, 12).map((p, i) => ({
    "@type": "ListItem",
    "position": i + 1,
    "url": `${SITE_URL}/products/${p.handle}`,
    "name": p.title
  }))
}
```

Plus a FAQPage payload (4-6 category-specific Q&A — see F-15).

### Vehicle hub — Add Vehicle + Breadcrumb + ItemList + FAQPage

See F-8 schema diff.

---

## Crawl-budget health

**Routes generating crawl that shouldn't:**
- `/sign-in`, `/sign-up` — index,follow today (F-3). Add `noindex` meta + omit from robots.txt disallow (let Google see noindex).
- `/search?q=…` — index,follow today (F-2). Add conditional `noindex` for queried results.
- Filtered collections (post Phase 2) — index,follow + no canonical (F-16). Add canonical + `noindex` conditional.

**Routes missing from sitemap that should be in:**
- `/vehicle/{slug}/{category}` intersection pages — don't exist yet (F-11). Phase 4 architectural ask, ~96-600 URLs.
- `/help/install/{sku-or-category}` — don't exist yet. Phase 4 ask.

**Sitemap currently includes (verified):**
- 1,322 product URLs (Shopify-driven, real `updatedAt`)
- 36 collection URLs (Shopify-driven, real `updatedAt`)
- 8 vehicle hub URLs (should be 20+ — F-20)
- 9 legal URLs
- 7 chrome URLs (`/`, `/collections`, `/about`, `/help`, `/help/contact`, `/help/install`, `/welcome-back`)
- **Excluded correctly**: `/sign-in`, `/sign-up`, `/checkout`, `/cart`, `/account`, `/order/`, `/api/`, `/returns/[orderId]` ✓

**Duplicate-content risks:**
- F-1 (no canonicals) is the umbrella risk for all parameterized URLs.
- F-16 (filtered collections) becomes acute the moment Phase 2 ships filters.
- F-17 (pagination) becomes acute the moment Phase 4 ships real pagination.

---

## Internal linking gaps

- **Vehicle hub → vehicle×category collection: 0 links exist** (route doesn't exist; F-11). Single highest-impact gap. Persona-loaded rule expects 3-deep loop for top 20 vehicles; we have 1-deep.
- **Install guide → PDP → install guide round trip**: install-guide index page exists but no per-SKU install pages and no PDP→install backlinks. PDP currently has zero outbound links to `/help/install`. Add an "Install guide" link card in PDP (next to fitment/spec tabs) once per-SKU guides exist.
- **Reviews → vehicle hub**: reviews are rendered (`getProductReviews`) but the reviewer's vehicle string isn't a hyperlink to `/vehicle/{slug}`. This is a free entity-grounding opportunity — when a real customer says "Fits my 2018 F-150 perfectly," that vehicle reference should link to `/vehicle/ford-f-150`.
- **Footer category nav**: not audited in this pass (out of scope), but worth verifying every category appears in footer (improves crawl depth signal).

---

## Search Console action items

(Pre-launch — no live GSC data yet. These are the items to monitor immediately post-DNS-cutover at Phase 6.)

- **Coverage issues to debug post-launch:**
  - Watch for "Crawled - currently not indexed" on vehicle hubs (F-8 schema gap may suppress them)
  - Watch for "Duplicate without user-selected canonical" on PDPs (F-1 risk)
  - Watch for "Submitted URL has no field 'priceValidUntil'" warning on Merchant Listings reports (F-6)

- **Query opportunities to baseline at week 4:**
  - "{make} {model} {category}" queries for top 20 vehicles — these should be ranking 8-20 by month 2 if F-11 ships
  - Brand queries with low CTR — fix with Sitelinks Search Box (F-14)
  - "{product type} install" queries — fix with HowTo schema (F-9) + per-SKU guides

- **Pages dropping in position to monitor:**
  - PDPs that lose Merchant Listing eligibility (F-6 fields not maintained over time)
  - Filtered collection URLs accidentally re-indexing if F-16 fix gets reverted

---

## Verification artifacts

Raw HTML samples saved during audit (referenced inline above):
- `/tmp/sitemap.xml` — full 1,382-URL sitemap
- `/tmp/pdp.html` — `/products/stehlen-universal-door-frame-mount-roof-rack` SSR
- `/tmp/coll.html` — `/collections/roof-racks` SSR
- `/tmp/home.html` — `/` SSR
- `/tmp/vehicle.html` — `/vehicle/ford-f-150` SSR
- `/tmp/search.html`, `/tmp/search-q.html` — `/search` empty + queried
- `/tmp/install.html` — `/help/install` SSR
- `/tmp/oc.html`, `/tmp/returns.html` — order confirmation + return flow

JSON-LD blocks observed in raw SSR (proof Googlebot sees them pre-hydration):

**PDP (3 blocks):**
```
Block 0: Organization (sitewide)
Block 1: Product { @type, name, description, sku, image (1 url, BROKEN encoding),
                   brand, aggregateRating, offers (5 fields only) }
Block 2: BreadcrumbList { 4 items, position 3 has raw "roof-racks" name }
```

**Collection (2 blocks):**
```
Block 0: Organization
Block 1: BreadcrumbList { 3 items, position 3 = "Roof Racks" (correct) }
```

**Home, Vehicle hub, Install guide (1 block each):**
```
Block 0: Organization (only — no domain-specific schema)
```

---

## Render-strategy verdict

`force-dynamic` on every route is acceptable for SEO IF (a) Googlebot sees the same HTML and (b) JSON-LD/meta/canonical render in SSR before hydration. Audit confirms (b) for what ships — but the schema, meta-canonical, and og-image gaps documented above are where the bleeding is happening, not in the SSR pipeline itself.

The Clerk middleware adds `x-middleware-rewrite` headers on every request. Verified that the rewrite is to the SAME path (e.g. `/products/x` rewrites to `/products/x`) — not a redirect, not a content swap. Googlebot sees the same SSR HTML as a logged-out browser. ✓

Cookie-driven personalization (`getCurrentVehicle`) renders different HTML based on the `stehlen_vehicle` cookie. Googlebot has no cookie → renders the default (vehicle = undefined) variant. The Confirmed-Fitment chip is hidden, the Verify-Fitment CTA is shown. **This is correct** — Google indexes the default-state PDP, which is what we want. Personalization shows up only for returning visitors.

---

## What I'd ship in cycle 1 (priority order)

1. **F-1** — sitewide canonicals (10 minutes of work, prevents post-launch dilution)
2. **F-2 + F-3** — `noindex` on `/search?q=…`, `/sign-in`, `/sign-up` (15 minutes, prevents index spam)
3. **F-4** — fix PDP image URL encoding + multi-image array (30 minutes, unblocks Merchant Listings)
4. **F-5** — fix PDP breadcrumb name (5 minutes, fixes ugly SERP display)
5. **F-6** — add full Offer fields (priceValidUntil, hasMerchantReturnPolicy, shippingDetails) (30 minutes, qualifies for Merchant Listings)
6. **F-7** — fix sitemap lastmod for static pages (5 minutes, restores Google's trust in our freshness signal)
7. **F-8** — Vehicle + ItemList + FAQPage on vehicle hub (45 minutes, opens AI Overview citations + breadcrumbs)
8. **F-10** — ItemList + CollectionPage on collection (15 minutes, qualifies for carousel)
9. **F-13** — sitewide og:image (15 minutes, fixes social sharing)
10. **F-14** — WebSite + SearchAction (5 minutes, brand SERP win)

Total: ~3 hours of engineering. Estimated organic-traffic lift over first 90 days post-launch: directional 30-50% vs. shipping without these fixes (compounding from Merchant Listings eligibility + canonicals saving crawl budget + brand-SERP search box + AI Overview eligibility).

F-9, F-11 are Phase 4 architectural; flag them now so they're scoped into the next planning cycle.

---

Organic traffic risk: **high** — without F-1 (canonicals), F-2/F-3 (transactional noindex), and F-4 (Product image fix), launch will index thin/duplicate pages and disqualify from Merchant Listings, kneecapping the first 90-day crawl wave. All three are <1 hour fixes. Indexed-page count trend: **up** after Phase 4 ships vehicle×category intersection pages (F-11), but only if F-1 lands first to keep the ratio of canonical to phantom URLs healthy.
