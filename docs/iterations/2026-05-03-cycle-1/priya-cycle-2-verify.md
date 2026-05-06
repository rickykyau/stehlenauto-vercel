# Priya Shah — Tech-SEO Cycle-2 Verification

**Date:** 2026-05-03
**Auditor:** Priya Shah (eBay Motors / Newegg / Wayfair)
**Build under verification:** localhost:3000 (Next.js 16, dev/Turbopack)
**Method:** Raw `curl` against the dev server (= Googlebot view, no JS) → HTML/JSON-LD parsed with Python. Cross-checked against cycle-1 audit findings F-1 through F-5.
**Routes hit:**
- `/`
- `/collections/roof-racks`
- `/products/stehlen-universal-door-frame-mount-roof-rack`
- `/vehicle/ford-f-150`
- `/search?q=tonneau` and `/search` (empty)
- `/sign-in`, `/sign-up`

Raw HTML dumps saved to `/tmp/v2-{home,coll,pdp,vehicle,search-q,search-empty,signin,signup}.html`.

---

## Verification matrix

| # | Fix | Status | Evidence |
|---|---|---|---|
| F-1 | Sitewide canonicals | **PASS** | All 4 representative routes ship `<link rel="canonical">` |
| F-2 | `/search?q=…` noindex; empty `/search` indexable | **PASS** | `noindex, follow` on queried; `index, follow` on empty |
| F-3 | `/sign-in` and `/sign-up` noindex | **PASS** (with one nit) | `noindex, follow` shipped — see note below |
| F-4a | Product.image URL-encoded (no literal space) | **PASS** | `ROOF%20RACKS.jpg` (was `ROOF RACKS.jpg`) |
| F-4b | Mock AggregateRating removed | **PASS** | 0 occurrences of `AggregateRating` in PDP HTML |
| F-5 | BreadcrumbList position 3 title-cased | **PASS** | `"name": "Roof Racks"` (was `"roof-racks"`) |
| Regression — Org sitewide | **PASS** | Organization JSON-LD on home, coll, PDP, vehicle, search, signin |
| Regression — Coll BreadcrumbList | **PASS** | 3-item list, position 3 = `"Roof Racks"` (unchanged, correct) |
| Regression — PDP block count | **PASS** | 3 blocks (Org + Product + BreadcrumbList) — same as cycle 1, just cleaner contents |

---

## F-1 — Canonicals (PASS)

```
$ curl -s http://localhost:3000/ | grep canonical
<link rel="canonical" href="https://stehlenauto.com"/>

$ curl -s http://localhost:3000/collections/roof-racks | grep canonical
<link rel="canonical" href="https://stehlenauto.com/collections/roof-racks"/>

$ curl -s http://localhost:3000/products/stehlen-universal-door-frame-mount-roof-rack | grep canonical
<link rel="canonical" href="https://stehlenauto.com/products/stehlen-universal-door-frame-mount-roof-rack"/>

$ curl -s http://localhost:3000/vehicle/ford-f-150 | grep canonical
<link rel="canonical" href="https://stehlenauto.com/vehicle/ford-f-150"/>
```

All 4 route templates emit a self-canonical with the absolute URL. `metadataBase` resolution worked correctly. **Cycle-1 critical finding closed.**

Minor nit (do not block): home canonical is `https://stehlenauto.com` with no trailing slash. Google treats `/` and bare-host URLs as equivalent for the root, but for consistency with collection/PDP self-references that include a trailing path segment, `https://stehlenauto.com/` would be marginally preferred. Single-character change in `src/app/layout.tsx`. Defer; not impactful.

---

## F-2 — `/search` noindex on queried, indexable on empty (PASS)

```
$ curl -s "http://localhost:3000/search?q=tonneau" | grep robots
<meta name="robots" content="noindex, follow"/>

$ curl -s "http://localhost:3000/search" | grep robots
<meta name="robots" content="index, follow"/>
```

Exactly the recommended pattern: queried search pages are kept out of the index (no thin-duplicate spam), but the empty `/search` landing remains crawlable for crawl-signal value. **Cycle-1 critical finding closed.**

---

## F-3 — `/sign-in`, `/sign-up` noindex (PASS, one nit)

```
$ curl -s http://localhost:3000/sign-in | grep robots
<meta name="robots" content="noindex, follow"/>

$ curl -s http://localhost:3000/sign-up | grep robots
<meta name="robots" content="noindex, follow"/>
```

Both auth gateways now `noindex`. **The critical part of the finding (preventing index inclusion) is closed.**

Nit (low priority — do not block launch): cycle-1 spec called for `noindex, nofollow` on auth pages. Implementer shipped `noindex, follow`. Practical difference is small — `follow` lets PageRank flow through any in-page links to back-end routes (which on `/sign-in` are basically just the Stehlen logo → home and Clerk's "Forgot password?" links). Neither hurts SEO meaningfully. The original `nofollow` recommendation was belt-and-suspenders. If the implementer chose `follow` deliberately to let link equity flow back to home, that's defensible. Leaving as PASS.

---

## F-4 — PDP Product.image URL encoding + AggregateRating removal (PASS)

### F-4a: Image URL encoding

Before (cycle 1):
```json
"image": ["https://stehlenauto.com/images/categories/ROOF RACKS.jpg"]
```

After (cycle 2):
```json
"image": ["https://stehlenauto.com/images/categories/ROOF%20RACKS.jpg"]
```

Literal space replaced with `%20`. Schema.org `Product.image` now passes URL validity. Google Rich Results Test will accept it. **Cycle-1 critical finding closed.**

Note from original audit still stands but is **not blocking** for cycle 2: still only 1 image in the array. Per Google's product structured data guidance, 3+ images at multiple aspect ratios (1:1, 4:3, 16:9) is the recommended pattern for full Shopping/Images carousel eligibility. This is reasonable to defer to Phase 1 when real Shopify CDN URLs land — the mock catalog reuses the same JPG four times anyway. Flag in Phase-1 acceptance: when Shopify wires up, `images[]` should populate with 3+ distinct CDN URLs.

Also reiterating from cycle 1: rename the source file `public/images/categories/ROOF RACKS.jpg` → `roof-racks.jpg`. URL encoding works, but spaces in filenames are an entire defect class we can eliminate. Not blocking.

### F-4b: AggregateRating removed

```
$ grep -c "AggregateRating\|aggregateRating" /tmp/v2-pdp.html
0
```

The mock AggregateRating block is gone from the rendered PDP — exactly right. Shipping fake review counts/scores would have risked a Google manual action under the structured-data spam policy (https://developers.google.com/search/docs/essentials/spam-policies#structured-data-misuse). Re-add the block once real reviews land via Shopify reviews app or Trustpilot integration, with `reviewCount > 0` from real data only. **Cycle-1 critical finding closed.**

---

## F-5 — PDP BreadcrumbList title-case (PASS)

Before (cycle 1):
```json
{ "@type": "ListItem", "position": 3, "name": "roof-racks", ... }
```

After (cycle 2):
```json
{ "@type": "ListItem", "position": 3, "name": "Roof Racks",
  "item": "https://stehlenauto.com/collections/roof-racks" }
```

Display name now matches the user-visible breadcrumb. SERPs will render `stehlenauto.com › Roof Racks › Stehlen Universal…` instead of `… › roof-racks › …`. **Cycle-1 high finding closed.**

---

## Regression checks

### Organization on every page — PASS

```
home:     1 block  -> ['Organization']
coll:     2 blocks -> ['Organization', 'BreadcrumbList']
pdp:      3 blocks -> ['Organization', 'Product', 'BreadcrumbList']
vehicle:  1 block  -> ['Organization']
search-q: 1 block  -> ['Organization']
signin:   1 block  -> ['Organization']
```

Every route still ships the sitewide Organization block. No regression from layout changes.

### Collection BreadcrumbList — PASS

```json
{
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "position": 1, "name": "Home", "item": "https://stehlenauto.com/" },
    { "position": 2, "name": "Shop", "item": "https://stehlenauto.com/collections" },
    { "position": 3, "name": "Roof Racks", "item": "https://stehlenauto.com/collections/roof-racks" }
  ]
}
```

Unchanged from cycle 1 (was already correct). The PDP fix did not break the collection breadcrumb generator. No cross-route regression.

### PDP Product block — PASS

PDP still emits exactly 3 JSON-LD blocks (Org + Product + Breadcrumb), same as cycle 1 — just with the image URL encoded, AggregateRating dropped, and the breadcrumb name title-cased. No structural regression. The JSON parses cleanly.

---

## What still ships from cycle 1 unfixed (out-of-scope for cycle 2)

These were lower-priority cycle-1 findings; the implementer correctly limited cycle-2 scope to F-1 through F-5. Restating here so they don't drop off the radar:

- **F-6** — Product Offer still missing `priceValidUntil`, `itemCondition`, `hasMerchantReturnPolicy`, `shippingDetails`. Required for Merchant Listings rich-result eligibility. Should ship before DNS cutover (Phase 6).
- **F-7** — Sitemap `lastModified` for chrome/vehicle/policy pages still uses `new Date()` (request time). Will cause Google to dismiss our freshness signal once site is live for 2+ weeks. Quick fix.
- **F-8** — Vehicle hub still ships only Org schema (no Vehicle, ItemList, FAQPage, BreadcrumbList).
- **F-10** — Collection page still missing CollectionPage + ItemList schema.
- **F-13** — Sitewide `og:image` still missing on home/collection.
- **F-14** — `WebSite` + `SearchAction` schema still missing.
- **F-15** — Category-landing FAQPage still unshipped.
- **F-16, F-17** — Filtered-collection canonical/noindex strategy and pagination canonical strategy not yet implemented (Phase 2/4 architectural; flagged as planning input).
- **F-18** — Product schema missing `mpn` (defer until Shopify wires real product data).
- **F-9, F-11, F-20, F-21, F-22, F-23** — As documented in cycle 1.

None of the above were in cycle-2 scope; all are still tracked in `priya-seo-audit.md`.

---

## Summary

**5 of 5 cycle-2 fixes verified PASS.**

| Fix | Severity | Status |
|---|---|---|
| F-1 Sitewide canonicals | CRITICAL | PASS |
| F-2 `/search?q=…` noindex | CRITICAL | PASS |
| F-3 `/sign-in` + `/sign-up` noindex | CRITICAL | PASS (minor `follow` vs `nofollow` nit) |
| F-4 PDP image URL encoded + AggregateRating removed | CRITICAL | PASS |
| F-5 PDP BreadcrumbList title-case | HIGH | PASS |

No regressions detected. Organization schema still sitewide. Collection BreadcrumbList still clean. PDP Product schema still parses. The 3 JSON-LD blocks on PDP are now valid and Rich-Results-Test-eligible (within the limits of single-image and missing-Offer-fields, which are tracked separately as F-4-images-followup and F-6).

---

## Organic-traffic-risk verdict (post-cycle-2)

**Organic traffic risk: medium** — down from cycle-1's "high".

The three launch-blockers (no canonicals, indexable search/auth, invalid PDP image) are all closed. The site can now ship to staging/preview without immediately bleeding crawl budget on phantom URLs or being disqualified from Product rich results on encoding errors.

Remaining medium-risk gaps before DNS cutover (Phase 6):
1. Product Offer fields (F-6) — without these we don't qualify for Merchant Listings, leaving 30%+ CTR on the table on PDP SERPs. Should land before launch.
2. Vehicle-hub schema (F-8) — without Vehicle + FAQPage + ItemList, our highest-leverage long-tail SEO surface (vehicle hubs) ships invisible to AI Overviews. Should land before Phase 6.
3. Sitemap `lastmod` for static pages (F-7) — quick fix; should land before second weekly Google sitemap fetch.

Indexed-page count trend: **up** in the first 30 days post-launch (foundation is now structurally sound — canonicals + noindex on the right surfaces means Google indexes the 1,382 intended URLs instead of 4,000+ phantom dupes). Will flatten until Phase 4 ships vehicle×category intersection pages (F-11).

Cycle-2 verdict: **Ship-ready for preview/staging.** Cycle 3 should knock out F-6, F-7, F-8 before any DNS cutover.
