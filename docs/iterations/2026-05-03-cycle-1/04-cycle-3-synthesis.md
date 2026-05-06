# Cycle-3 synthesis (2026-05-03)

Source documents:
- `mike-mission-1-cycle-3.md` (F-150 5.5' soft tonneau, mobile)
- `mike-mission-2-cycle-3.md` (Wrangler steel bumper, desktop)
- `mike-mission-3-cycle-3.md` (Tacoma LED bed lights, mobile)
- `parts-headlights-deep-dive.md` (160 SKUs, $52K/yr savings spec)
- `parts-catalog-audit-remaining-7.md` (running boards / bull guards / floor mats / etc.)
- `shopify-storefront-probe.md` + `shopify-catalog-audit.md` (1,322 active products, 36 collections)

Mike's wallet score (avg of 3 missions, weighted highest per owner brief):
- Cycle 1: **0.7 / 10** (1 + 1 + 0)
- Cycle 2: **2.0 / 10** (3 + 2 + 1)
- Cycle 3: **2.0 / 10** (2 + 4 + 0) — Wrangler up, F-150 down, Tacoma down

Headline: cycle 3 was the cycle the **commerce rail came alive** (real Shopify checkouts at $701 and $959 reaching `stehlenauto.myshopify.com/checkouts/cn/...`) — and also the cycle the **fitment honesty layer cracked open** in three new places.

---

## Real wins shipped this cycle (verified by Mike)

| # | Fix | Who flagged | Verified |
|---|---|---|---|
| W1 | Cart wired end-to-end to Shopify (real checkout URLs) | Mike M1 cycle-1 BLOCKER F-2 | M1 + M2 cycle-3 |
| W2 | 422 silent fail eliminated, friendly error toast | Mike cycle-2 | M1 + M2 cycle-3 |
| W3 | YMM modal: real 3-step year→make→model picker | Mike cycle-1 BLOCKER F-5 | M2 + M3 cycle-3 |
| W4 | Anonymous load shows "SELECT YOUR VEHICLE" (no phantom default) | Mike cycle-1 F-10 | M2 + M3 cycle-3 |
| W5 | Bumpers category populated (was empty) | Mike cycle-1 BLOCKER F-1 | M2 cycle-3 (24 cards / 186 total) |
| W6 | Honest fitment ribbons (neutral when undefined, never fake ✓) | Parts P0 | M1 + M2 cycle-3 |
| W7 | Mega-nav real category links (Lighting/Towing/Cargo) | Mike F-6 | M2 cycle-3 (partial) |
| W8 | Home "Bed Lighting" tile honestly removed (no in-stock SKUs) | Cycle-3 chrome-reconcile | M3 cycle-3 |
| W9 | Search popular suggestions reconciled to real categories | Tacoma F-4 | shipped this synthesis |

---

## Real cycle-3 bugs (NOT test artifacts) — cycle-4 backlog

Numbered by Mike's report letters, deduped, ICE-prioritized.

### P0 — fitment honesty (the wallet-killer cluster)

| ID | Bug | Source | Why P0 |
|---|---|---|---|
| **F-3** | PDP "SIMILAR PRODUCTS" rail labels F-150 roof racks "✓ FITS YOUR 2014 JEEP WRANGLER" | Mike M2 | Direct lie, customer-detectable in seconds |
| **F-19** | Card chips show "CHECK FITMENT" even when title literally contains user's garage vehicle ("2010-2018 Jeep Wrangler" on a 2014 Wrangler garage) | Mike M2 | System can't read its own title |
| **F-39** | Cart drawer + cart page banner says "ALL ITEMS FIT YOUR 2014 JEEP WRANGLER" over a mixed F-150 + Tundra + Wrangler basket | Mike M1 | Per-line check missing |
| **F-18** | PDP buy block: "We haven't verified this fits your 2014 Wrangler" sits 2 lines above "CONFIGURED FOR 2014 JEEP WRANGLER" — same product, same screen | Mike M2 | Two truthy paths racing each other |

**Root cause:** the `fits` field on `CatalogProduct` only resolves at the page-level `getCurrentVehicle()` step; the SIMILAR-PRODUCTS adapt path and the cart-banner aggregate path don't run it. Three separate fixes — one library-level helper.

### P1 — discoverability (search + filtering)

| ID | Bug | Source | Why P1 |
|---|---|---|---|
| **F-7** | Search returns 0 results for "wrangler bumper" while 186 bumpers exist | Mike M2 | Pre-filter pinned to vehicle is failing closed instead of open |
| **F-35** | Mobile filter sidebar is `hidden md:block` — mobile customers cannot filter at all | Mike M1 | 60%+ of traffic blocked from collection navigation |
| **F-36** | Facet counts computed off visible 24 cards, not the full 287-product collection | Mike M1 | Honesty + relevance — counts must reflect collection, not page |
| **F-37** | Filter checkbox UI not wired to URL params — `?bed=5.5` does nothing | Mike M1 | Breaks shareable links and bookmarks |
| **F-4** | All 8 home-page POPULAR_VEHICLE tiles 404 | Mike M2 | First-time visitor's browse vector dies on click |

### P2 — vehicle picker correctness

| ID | Bug | Source | Why P2 |
|---|---|---|---|
| **F-33** | Mobile YMM picker tap-bleed: a sloppy tap on Ford row commits "2014 Jeep Wrangler" to cookie | Mike M1 | Wrong-vehicle data poisons every downstream filter |
| **F-17** | Category page knows my vehicle but doesn't filter or sort by it (Tesla Y bumpers above Wrangler bull guards on a Wrangler garage) | Mike M2 | Garage is read but not applied to ranking |

### P3 — chrome leftovers

| ID | Bug | Source |
|---|---|---|
| **F-6** | Mega-nav SALE / NEW / BEST SELLERS / vehicle URLs still 404 | Mike M2 |
| **F-8** | Install PDFs missing | Mike M2 |
| **F-9** | Fake compat table + fake spec tabs on PDP | Mike M2 |
| **F-11** | 404 page is a dead end (no recovery links) | Mike M2 |
| **F-12** | Wrangler-bumper sidebar shows Bed Length / Cab Type filters that don't apply | Mike M2 |
| **F-13** | Clerk title reads "Sign in to stehlenauto-clerk" | Mike M2 |
| **F-14** | No guest order lookup | Mike M2 |

---

## Test artifacts (NOT real bugs — methodology issue)

Three Mike agents and two parts agents ran in parallel. Playwright MCP serves **one shared browser per session**, so when the F-150 Mike POSTed `/api/garage` with F-150, the Tacoma Mike's cookie flipped to F-150 mid-session, and *vice versa*. This produced a slate of "auto-redirect / vehicle reverting / ghost cart" complaints that look catastrophic in the reports but are entirely a test-rig artifact.

| Reported | Actual cause |
|---|---|
| F-1 / F-7 "page teleports to unrelated URLs" | Other parallel Mikes navigating the shared browser |
| F-38 "cart pre-populated with 4 items I never added" | F-150 Mike was adding to cart in parallel |
| F-2 "ghost cart fills itself navigating" | Same — shared cart cookie + shared browser |
| F-34 "vehicle cookie mutates on every nav" | Each parallel Mike's `/api/garage` POST overwrites the others |
| Tacoma F-1 "even browser_close auto-navigated" | A different agent's `browser_navigate` hit at exactly the wrong moment |

**Methodology fix for cycle 4:** run Mike missions **sequentially**, one at a time. Not negotiable. Or use a fresh Playwright browser context per mission.

The legitimate kernel inside F-7 (search returns 0 for valid query) is real and listed in P1 above. The wholesale "site is driving the browser" claims are the artifact.

---

## Catalog reality (parts specialist)

### Top-5 categories (audited cycle-2)
| Category | SKUs | Verdict |
|---|---|---|
| Trailer hitches | 286 | **Ship** with minor fixes |
| Tonneau covers | 287 | **Ship** with minor fixes |
| Truck bed mats | 133 | **Ship** with minor fixes (11 trunk-mat miscats) |
| Front grilles | 167 | **Hold** until trim-aware tagging |
| Headlights | 160 | **Hard hold** until splits |

### Headlights (160 SKUs) — cycle-3 deep-dive
- **38 PASS / 47 PASS-w-disclosure / 41 NEEDS-METAFIELD / 27 NEEDS-SPLIT / 7 HARD-HOLD**
- Return-rate impact: **~$85K → ~$33K per 1,000 orders** = **~$52K/yr saved per 1,000 headlight orders**
- Top-5 P0 splits (by $ impact):
  1. Ram "09-18" listings silently expanded to 09-24 in tags — does NOT fit DT (19+ new body). 9 SKUs.
  2. "07-17 Tundra/Sequoia" — 2014 Tundra got fascia refresh; cluster won't bolt to 14-17. 4 SKUs.
  3. "07-14 Silverado/Sierra" — 2014 is K2XX, not GMT900. 6 SKUs.
  4. "09-14 F-150 + 18-20 Limited" — missing factory-LED trim exclusion (Platinum 13+, Limited 18+ matrix). 11 SKUs.
  5. `99-02-silverado-00-06-suburban-tahoe-led-headlights` — claims to fit 3 OEM assemblies sharing zero parts. **HARD HOLD; must split into 3 products.**

### Remaining-7 categories — cycle-3
| Category | SKUs | Verdict | Notes |
|---|---|---|---|
| **Bull guards & grille guards** | 186 | Ship-with-fixes | Ram DS/DT lie carries from cycle-1; **NEW: 4Runner TRD-Pro tag lie** (TRD Pro factory off-road bumper won't accept aftermarket). 3 days of data fixes. |
| **Running boards & side steps** | 51 | **HARD HOLD** | New pattern: same bracket P/N claimed across 2-3 chassis gens. **4 Stehlen-branded Ram listings spanning 2009-2022/23 — biggest brand-damage risk in catalog.** $45-70K/yr return risk. |
| **Floor mats** | 39 | Ship-with-fixes | 11 of 39 are trunk/frunk mats miscategorized. 1 day of cleanup. |
| **Roof racks & baskets** | 7 | Ship now | Clean tagging |
| **Chase racks & sport bars** | 3 | Ship now | Clean |
| **MOLLE panels** | 2 | Hold | Likely fitment lie on Ranger 6ft (US Ranger 19-23 only sold in 5ft beds) |
| **Under seat storage** | 2 | Hold | Cab-type gating missing |

### $1M+/yr sourcing gap (owner-driven)

Catalog has near-zero coverage of the highest-traffic vehicle/category intersections:
- **F-150 P702 (21+)** — #1 selling US truck, near-zero coverage across headlights / bull guards / running boards / MOLLE / chase racks
- **Ram DT 1500 (19+)** — new body sold for 7 years, almost no aftermarket coverage in the catalog
- **Silverado K2XX (14-18) + T1XX (19+)** — second + third best-selling pickup, near zero
- **Tundra 3rd gen (22+)** — zero
- **Tacoma 4th gen (24+)** — zero (entire generation)
- **Wrangler / Gladiator headlights** — zero across the catalog

Three private-label expansion lanes with zero current Stehlen SKUs: **floor mats, MOLLE, under-seat storage.** Lowest-COGS easiest-to-source category for a private-label moat.

---

## Score targets — realistic vs aspirational

Mike's avg buy score from 2.0 → :

| Target | What it requires | Effort |
|---|---|---|
| **6/10** | Fix the P0 fitment-honesty cluster (F-3 / F-19 / F-39 / F-18) + P1 mobile-filter cluster (F-35/36/37) + P1 search wiring (F-7) + home vehicle tile 404s (F-4) | 2-3 dev days |
| **8/10** | Above + ship 27 headlight splits + 100 Okendo reviews + 5 install videos for top-bedlines + recategorize 11 floor mats + 4Runner TRD-Pro split | 2-3 dev days + 5 days warehouse |
| **9/10** | Above + personalization (vehicle-aware home/category sort) + scheduled-install booking + ship private-label MOLLE/floor/under-seat | 2 weeks |

Cycle 4 should target **6/10**. 8/10 is cycle 5. 9/10 is cycle 6+.

---

## Cycle-4 ship list (ICE-prioritized)

### Ship to dev (engineering, ~3 dev-days)
1. **One-pass fitment-honesty fix** — pass `currentVehicle` into the SIMILAR-PRODUCTS adapter, the cart-banner aggregate, and the card-chip resolver. Title-string contains-match is sufficient until ACES wiring lands. (F-3 + F-19 + F-39)
2. **PDP buy-block contradiction kill** — `fits === undefined` shows "haven't verified" only; `fits === true` shows "CONFIGURED FOR" only; never both. (F-18)
3. **Mobile filter drawer** — replace `hidden md:block` with a mobile bottom-sheet drawer; same component pool. (F-35)
4. **Facet counts from collection, not page** — Shopify Storefront `productFilters` returns counts off the full collection. (F-36)
5. **Filter URL state** — read+write `?bed=5.5&color=black` on every facet click. (F-37)
6. **Search vehicle-pre-filter open-failure** — when garage tag yields 0, fall back to no-vehicle-filter results with a "no exact-fit matches — showing all" notice instead of an empty page. (F-7)
7. **Home POPULAR_VEHICLES tiles** — point at real `/vehicle/[slug]` URLs only; verify the 8 listed exist before render. (F-4)
8. **YMM picker tap-bleed** — `pointer-events: none` on adjacent rows during 200ms after select. (F-33)

### Ship to merch (Shopify Admin, ~5 warehouse-days)
1. Headlights 27 splits + 41 metafields per `parts-headlights-deep-dive.md` Phase 1-3
2. Bull guards: Ram DS/DT split (5 SKUs), 4Runner TRD-Pro exclusion tag (~12 SKUs)
3. Running boards: **HARD HOLD until physical-bracket verification** (warehouse must measure before relisting). 9 Ram + 6 Tacoma + 3 F-150 + 1 Titan SKUs.
4. Floor mats: recategorize 11 trunk/frunk mats out of `/collections/floor-mats`

### Ship to owner (sourcing — Ricky-driven)
- F-150 P702 headlights (21-25)
- Ram DT 1500 headlights (19-25)
- Silverado K2XX (14-18) + T1XX (19-25) headlights
- Wrangler/Gladiator headlights (any gen)
- Private-label floor mat / MOLLE / under-seat storage (lanes have zero Stehlen SKUs)

### Methodology
- Cycle 4 Mike runs: **sequential, not parallel.**
- Add a per-mission `playwright_session_id` so future cross-talk is at least detectable.
