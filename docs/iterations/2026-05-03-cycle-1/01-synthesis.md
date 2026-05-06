# Cycle 1 — Synthesis & Ranked Backlog (Sam Hartley, PM)

**Date:** 2026-05-03
**Reports gathered:** Mike ×3 missions, Jordan (UX), Parts specialist, Priya (SEO), Marcus (marketing).
**Status: BLOCK.** No flow tested by Mike resulted in a successful checkout. Three independent Mike missions averaged 1.0/10 Would-I-Buy. Until at least one mission can complete an add-to-cart end-to-end, paid traffic is forbidden and any DNS cutover discussion is premature.

## Decision summary

- Ship status: **BLOCK** the storefront for production traffic.
- One-line rationale: site looks polished, buying engine is on fire across UX, fitment, cart wiring, and SEO simultaneously.
- Mike's verdict (the most heavily weighted voice per owner):
  - F-150 tonneau (mobile): 1/10. Couldn't change vehicle, fitment badges lied about Tundra products fitting an F-150, no working YMM.
  - Wrangler bumper (desktop): 1/10. Bumpers category empty, ATC silently 422s, 8 popular-vehicle tiles 404, every category dropdown 404s, search ignores keywords.
  - Tacoma bed lights (mobile): 0/10. Bed Lighting category empty, Tacoma tile 404, garage pre-locked to F-150, page auto-navigates without user input.

This isn't a polish cycle. It's a "the plumbing is missing" cycle.

## Themes (across reports)

| Theme | Source agents | Severity |
| --- | --- | --- |
| YMM picker is fake (hero buttons → /collections, not modal) | Mike M1/M2/M3, Jordan F-1, Marcus #7 | CRITICAL |
| Add to cart 422s silently across catalog | Mike M2, Jordan F-3, Marcus #2 | CRITICAL |
| Sub-model strip auto-defaults — gates don't gate | Jordan F-2, Parts P0-1 | CRITICAL |
| Fitment badges lie (Tundra ✓ FITS YOUR F-150) | Mike M1/M2, Parts | CRITICAL |
| Mobile chrome — no sticky ATC, vehicle pill doesn't open modal, no filter UI | Jordan F-4/F-5/F-6 | CRITICAL |
| Catalog gaps — 10/12 categories empty, popular-vehicle tiles 404 | Mike M1/M2/M3, Marcus #6 | CRITICAL (data, not code) |
| Mock aggregateRating shipped to Google | Marcus #5, Priya | CRITICAL (Google manual-action risk) |
| Vehicle hub hardcoded F-150 content for every vehicle | Jordan, Parts P1 | HIGH |
| YMM tree wrong (Chevy/GMC cross-tagged, F-150 generations collapsed, missing 4 truck lines) | Parts P0-2,3,4,6 | HIGH (data, not code) |
| No canonical anywhere; /search /sign-in /sign-up `index:true` | Priya F-1/F-2/F-3 | HIGH |
| PDP JSON-LD: image URL has literal space, BreadcrumbList raw slugs | Priya F-4/F-5 | HIGH |
| Trim strip is fictional ["BASE","MID","HEAVY-DUTY"] | Parts P0-4 | HIGH |
| Email capture endpoints 404 (/api/newsletter, /api/back-in-stock) | Marcus #3 | HIGH |
| WELCOME10 not auto-applied at Shopify checkout | Marcus #4 | HIGH |
| Analytics scripts may not be loading at runtime (env vars present in .env.local but Marcus saw window.gtag undefined) | Marcus #1 | HIGH |
| Promo input accepts any string as a 10% code | Jordan, Marcus #4 | MEDIUM |
| Pagination broken / sort dropdown doesn't re-sort | Jordan | MEDIUM |
| Fake hardcoded shipping ETA "Wed Apr 22 — Fri Apr 24 to 90210" | Jordan | MEDIUM |
| Cart math is local arithmetic with hardcoded LA tax | Jordan | MEDIUM |
| Garage cookie persists from earlier dev sessions ("2020 FORD F-150" pre-locked for fresh visitors) | Mike M2, M3 | MEDIUM (test artifact + UX bug) |
| Hamburger tap target 22×22 (Apple min 44×44) | Mike M1 | MEDIUM |
| Mock review on home page testimonials still hardcoded | Jordan | LOW |

## Conflicts resolved

### C-1: Jordan vs. Parts on sub-model gating
- Jordan F-2: "Disable ATC until all required sub-model strips are picked, with copy 'SELECT BED LENGTH'."
- Parts P0-1: "Same intent, but also block ATC for tonneaus regardless because the data is wrong upstream — bed length should be inferred from product handle, not asked of the customer."
- Tie-break rule: closest KPI to disputed surface. Disputed surface is *cart conversion*. Jordan owns conversion → Jordan's framing wins for the UI (gate, don't infer at this layer). Parts wins on the *data* layer — the sub-model values offered must be honest (5'/5.5'/6.5'/8' not "BASE/MID/HEAVY-DUTY"). Both ship together.

### C-2: Marcus vs. Priya on /search indexability
- Marcus: "noindex /search?q=…, allow empty /search."
- Priya F-2: same conclusion + adds the layout's generic meta-description is the real problem on indexed query pages.
- No conflict, both ship.

### C-3: Mike vs. UX on the "fitment lies" finding
- Mike: "✓ FITS YOUR FORD F-150 stamped on Toyota Tundra products = brand promise destroyer, would bounce immediately."
- Jordan didn't flag this directly because she tested with F-150-tagged products (different surface).
- Parts also flagged it via the data layer.
- No conflict; the finding stands and is upgraded to CRITICAL because Mike is the heavily-weighted voice.

## Ranked backlog

ICE = Impact (1-10) × Confidence (1-10) × Ease (1-10). Ship ≥ 250.

| # | Title | Source | I | C | E | ICE | Owner | This cycle? |
|---|---|---|---|---|---|---|---|---|
| 1 | Wire hero YMM buttons to open modal | Mike, Jordan, Marcus | 9 | 10 | 10 | 900 | implementer | YES |
| 2 | Wire mobile vehicle pill to open modal | Mike, Jordan F-5 | 9 | 10 | 10 | 900 | implementer | YES |
| 3 | Sub-model strip: gate ATC until picked | Jordan F-2, Parts P0-1 | 9 | 10 | 9 | 810 | implementer | YES |
| 4 | Fitment ribbon: only ✓ when product.fits === true | Mike, Parts | 10 | 9 | 8 | 720 | implementer | YES |
| 5 | Strip mock aggregateRating from PDP | Marcus #5, Priya | 9 | 10 | 10 | 900 | implementer | YES |
| 6 | Mobile sticky ATC bar | Jordan F-4 | 8 | 9 | 8 | 576 | implementer | YES |
| 7 | Cart 422 → visible error toast | Jordan F-3, Marcus #2 | 8 | 9 | 9 | 648 | implementer | YES |
| 8 | Add canonical sitewide | Priya F-1 | 7 | 10 | 10 | 700 | implementer | YES |
| 9 | noindex /search?q=*, /sign-in, /sign-up | Priya F-2/F-3 | 7 | 10 | 10 | 700 | implementer | YES |
| 10 | Fix Product.image URL encoding | Priya F-4 | 6 | 10 | 10 | 600 | implementer | YES |
| 11 | BreadcrumbList title-case names | Priya F-5 | 5 | 10 | 10 | 500 | implementer | YES |
| 12 | Vehicle hub — parameterize content per vehicle | Jordan, Parts P1 | 7 | 9 | 6 | 378 | implementer | YES |
| 13 | Remove or stub broken chrome links | Jordan, Mike, Marcus | 7 | 10 | 8 | 560 | implementer | YES |
| 14 | Promo code whitelist (WELCOME10 only) | Jordan, Marcus | 5 | 10 | 10 | 500 | implementer | YES |
| 15 | Verify analytics env propagation + scripts loading | Marcus #1 | 8 | 8 | 8 | 512 | implementer | YES |
| --- | | | | | | | | |
| 16 | Build /api/newsletter Klaviyo proxy | Marcus #3 | 7 | 9 | 6 | 378 | implementer | NO — cycle 2 |
| 17 | Build /api/back-in-stock Klaviyo proxy | Marcus #3 | 7 | 9 | 6 | 378 | implementer | NO — cycle 2 |
| 18 | WELCOME10 cartDiscountCodesUpdate | Marcus #4 | 6 | 8 | 5 | 240 | implementer | NO — cycle 2 |
| 19 | UTM/gclid/fbclid persistence to Shopify checkout | Marcus #9 | 7 | 7 | 5 | 245 | implementer | NO — cycle 2 |
| 20 | Mobile filter drawer | Jordan F-6 | 7 | 8 | 4 | 224 | implementer | NO — cycle 2 |
| 21 | Pagination + sort actually work | Jordan | 6 | 8 | 5 | 240 | implementer | NO — cycle 2 |
| 22 | Reconcile mock catalog handles vs real Shopify variants | Mike, Marcus | 10 | 9 | 3 | 270 | OWNER (warehouse) | OWNER GATED |
| 23 | YMM tree corrections (Chevy/GMC cross-tag, F-150 gen split, add Ram/Tundra/Tacoma 4G/Gladiator) | Parts P0-2,3,6 | 9 | 9 | 4 | 324 | OWNER (warehouse data) | OWNER GATED |
| 24 | Trim strip — real values from product handles, not ["BASE","MID","HEAVY-DUTY"] | Parts P0-4 | 8 | 8 | 4 | 256 | implementer + OWNER | NO — cycle 3 |
| 25 | Real reviews via Okendo + AggregateRating reinstatement | Marcus, Priya | 8 | 9 | 3 | 216 | OWNER | NO — cycle 3 |
| 26 | Vehicle×category intersection pages (/vehicle/{slug}/{category}) | Priya F-11 | 7 | 9 | 3 | 189 | implementer | NO — cycle 3 (architectural) |
| 27 | FAQ + HowTo schema on category + install pages | Priya F-9, F-10 | 6 | 9 | 5 | 270 | implementer | NO — cycle 2 |

## Closed (won't fix this iteration)

| Finding | Source | Why |
| --- | --- | --- |
| Hardcoded shipping ETA on PDP | Jordan | Real ETA needs Shopify Shipping API + customer ZIP. Defer to Phase 5+. Current copy is stub-quality, will replace at cutover. |
| Cart math local arithmetic | Jordan | Same as above — Shopify computes at checkout. Our cart-page math is preview-only and the discrepancy is small enough customers won't notice if real values land at checkout. Will replace when Shopify Cart API tax/shipping mutations are wired. |
| Hardcoded testimonials on home | Jordan | Defer until Okendo reviews exist; replacing with empty state would be worse than current. |

## Owner-gated items (implementer cannot solve)

These ALL trace to the same root cause: the live Shopify store doesn't have product data matching what the storefront displays. The storefront shows mock data when Shopify is empty (correctly per design); but where Shopify HAS data, it's the wrong data (Toyota Tundra covers tagged for Ford F-150).

- **#22 — Catalog reconciliation**: Stehlen needs to upload products into Shopify with handles matching `data/product_clusters.json` AND with correct YMM tags. This is warehouse / merchandising work.
- **#23 — YMM tree corrections**: Same shopify-tags source. Fixing the JSON without fixing the upstream is whack-a-mole.
- **#25 — Real reviews via Okendo**: install + import historical eBay reviews. Implementer can wire Okendo; OWNER chooses to commit budget.

Sam's recommendation: lock the storefront from "live revenue" until #22 ships. We can keep iterating UX in the meantime — those fixes apply regardless.

## Velocity stats

- Cycle 1 (just completed): 0 / 0 findings shipped (this is the discovery cycle, no fixes yet).
- Open `[CRITICAL]` >72h: N/A (just surfaced).

## Sam's call

> Ship items 1–15 tonight (≤4h total). Re-spawn Mike on Mission 1 to verify the flow improves. Cycle 1 success = Mike's F-150 tonneau mission scores ≥4/10 instead of 1/10. Anything else is bonus.

Cycle 2 plan and broader morning summary land in `02-cycle-1-results.md` and `03-morning-summary.md` after fixes ship.
