# Stehlen Auto — Comprehensive QA Test Plan

**Version:** 1.0 — authored after 14AX cycle, post-OOS-card regression audit  
**Status:** Standing plan. Updated after every cycle that touches its surface area.  
**Coverage target:** 290 numbered tests across 7 sections.

---

## Why this plan exists

A 2018 F-150 customer saw "FITS YOUR 2020 FORD F-150" green badge on a Lincoln Navigator bull guard listing — tapped through — learned it was OUT OF STOCK only on the PDP. The card carried `CatalogProduct.inventory` in its type and the PDP buy-box was already using it. Nine QA rounds and three reviewers missed it because the test plan was structurally blind to **crossed states**: (fitment-verdict × inventory × surface). This document fixes that permanently.

**The systematic gaps that caused the miss:**

1. Tests checked states in isolation, not in combination
2. Surface coverage was incomplete — not all `ProductCard` render sites were listed
3. Negative-space tests ("must this value render at all?") were absent
4. Trust claims (FITS, BEST SELLER, FREE SHIPPING) were never paired with their fulfillment conditions
5. Catalog-edge products (OOS, no fitment metafield, zero inventory) were never sought out
6. Mike's persona always picked working products — never the first OOS one in a collection

---

## Reference architecture

**ProductCard renders on these 5 surfaces (must all be covered in every state-matrix cycle):**

| # | Surface | File | Vehicle prop passed? |
|---|---------|------|----------------------|
| S1 | Collection grid | `src/app/collections/[handle]/page.tsx:903` | Yes (`vehicle`) |
| S2 | Search results (query) | `src/app/search/page.tsx:401` | Yes (`vehicle`) |
| S3 | Search empty state — TRENDING NOW | `src/app/search/page.tsx:269` | Yes (`vehicle`) |
| S4 | Vehicle hub — TOP PICKS | `src/app/vehicle/[slug]/page.tsx:906` | Yes (`fakeVehicle`) |
| S5 | PDP — SIMILAR PRODUCTS rail | `src/app/products/[handle]/page.tsx:1209` | Yes (`vehicle`) |

**Inventory field path:** `CatalogProduct.inventory` (number) → `outOfStock = inventory <= 0` (product-card.tsx:23)

---

## SECTION 1 — State-Matrix Tests (cross-state combinatorics)

**Matrix dimensions:**

- Vehicle state: (A) No vehicle saved | (B) Vehicle saved, no sub-model | (C) Vehicle saved + sub-model answered
- Fitment verdict: (1) fits=true | (2) fits=false | (3) fits=undefined
- Inventory: (I) in stock | (O) out of stock
- Surface: S1–S5 above

Not all combinations are reachable (fits=true + no vehicle is impossible — `withFitment` requires a vehicle). The executable set is below. Each test ID encodes `vehicle-state + fitment + inventory`.

### 1.1 No Vehicle Saved

| # | Test | Surface | Expected | Pass criteria |
|---|------|---------|----------|---------------|
| 1 | A-3-I: No vehicle, fits=undefined, in stock | S1, S2, S3, S4, S5 | Card: no fitment ribbon, full image opacity, price visible, no OOS badge | Zero fitment ribbons rendered; image at 100% opacity |
| 2 | A-3-O: No vehicle, fits=undefined, OOS | S1, S2, S3, S4, S5 | Card: no fitment ribbon, OOS badge top-right, image at 45% opacity | `OUT OF STOCK` text present in card DOM; opacity attribute = 0.45 |
| 3 | A-3-I: Collection page no vehicle — "VERIFY FITMENT" buy-box | S1 | Collection toolbar does NOT show vehicle pill | No `FILTERING FOR` text in DOM |
| 4 | A-3-O: OOS product in collection, no vehicle | S1 | OOS badge visible at top-right of card, image dimmed | Snapshot shows OOS badge over dimmed image; no fitment ribbon |

### 1.2 Vehicle Saved, No Sub-Model Answered

| # | Test | Surface | Expected | Pass criteria |
|---|------|---------|----------|---------------|
| 5 | B-1-I: Fits=true, in stock | S1, S2, S4, S5 | Green "FITS YOUR YYYY MAKE MODEL" ribbon at card bottom | Ribbon background `rgba(34,197,94,0.95)` visible |
| 6 | B-1-O: Fits=true, OOS | S1, S2, S4, S5 | Green fits ribbon AND OOS badge both visible simultaneously | Both `✓ FITS YOUR` text AND `OUT OF STOCK` badge present in same card |
| 7 | B-2-I: Fits=false, in stock | S1, S2, S5 | Red "DOES NOT FIT YOUR YYYY MAKE MODEL" ribbon | Ribbon background `rgba(239,68,68,0.95)` visible |
| 8 | B-2-O: Fits=false, OOS | S1, S2, S5 | Red DOES NOT FIT ribbon AND OOS badge both visible | Both `✗ DOES NOT FIT` text AND OOS badge present in same card |
| 9 | B-3-I: Fits=undefined, in stock | S1, S2, S3, S4, S5 | Neutral dark "CHECK FITMENT FOR YOUR YYYY MAKE MODEL" ribbon | Ribbon background `rgba(20,20,20,0.95)` visible |
| 10 | B-3-O: Fits=undefined, OOS | S1, S2, S3, S4, S5 | Neutral CHECK FITMENT ribbon AND OOS badge both visible | Both CHECK FITMENT text AND OOS badge present in same card |

### 1.3 Vehicle Saved + Sub-Model Answered

| # | Test | Surface | Expected | Pass criteria |
|---|------|---------|----------|---------------|
| 11 | C-1-I: Sub-model matches, fits=true, in stock | S1, S5 | Green FITS ribbon; PDP ATC enabled yellow; CONFIRMED FITMENT hero | ATC button reads `ADD TO CART · $X.XX` and is enabled |
| 12 | C-1-O: Sub-model matches, fits=true, OOS | S1, S5 | Green FITS ribbon on card AND OOS badge; PDP ATC reads `OUT OF STOCK` disabled | Card: both signals; PDP: ATC disabled with `OUT OF STOCK` label |
| 13 | C-2-I: Sub-model mismatch, fits=false, in stock | S1, S5 | Red DOES NOT FIT ribbon; PDP ATC shows `ADD TO CART ANYWAY` (bed mismatch → disabled) | Card red ribbon; PDP: if bed mismatch, ATC disabled; if make mismatch only, ATC enabled with secondary style |
| 14 | C-2-O: Sub-model mismatch, fits=false, OOS | S1, S5 | Red DOES NOT FIT ribbon + OOS badge on card; PDP ATC disabled `OUT OF STOCK` | Both signals on card; PDP ATC blocked regardless of fit state |
| 15 | C-3-I: Sub-model partial (bed answered, cab not), in stock | S1 | CHECK FITMENT ribbon (undefined) on card; PDP shows ONE STEP TO CONFIRM | |
| 16 | C-3-O: Sub-model partial, OOS | S1 | CHECK FITMENT ribbon + OOS badge; PDP shows OOS above one-step-to-confirm | |

### 1.4 PDP-specific crossed states

| # | Test | State | Expected |
|---|------|-------|----------|
| 17 | OOS + CONFIRMED FITMENT hero | inventory=0, fits=true, all strips answered | PDP hero shows green CONFIRMED FITMENT; stock line reads "Out of stock" in red; ATC reads `OUT OF STOCK` disabled; trust row reads "Ships when restocked" NOT "Ships in 1-2 business days" |
| 18 | OOS + DOES NOT FIT | inventory=0, fits=false | Red DOES NOT FIT card; ATC disabled with `OUT OF STOCK` (OOS beats misfit override) |
| 19 | OOS + ONE STEP TO CONFIRM | inventory=0, fits=true, strip not answered | Yellow ONE STEP banner; ATC disabled; verify OOS status text visible |
| 20 | OOS + no vehicle | inventory=0, no vehicle | VERIFY FITMENT neutral card; ATC reads `OUT OF STOCK` disabled |
| 21 | OOS + back-in-stock form renders | inventory=0 | `#back-in-stock` form (email + NOTIFY ME) visible in bottom section |
| 22 | In stock + back-in-stock form absent | inventory>0 | Back-in-stock section NOT rendered (gated by `product.inventory <= 0`) |
| 23 | OOS + Prop 65 notice grid is single column | inventory=0 | Prop 65 card spans full width (`md:grid-cols-1` when OOS) |
| 24 | In stock + Prop 65 notice grid is two columns | inventory>0 | Grid has no back-in-stock card; Prop 65 is single-column |
| 25 | OOS + "Ships when restocked" not "Ships in 1-2 business days" | inventory=0 | Trust row: shipping line reads "Ships when restocked" |
| 26 | OOS + Affirm buy-now disabled | inventory=0 | `BUY NOW WITH AFFIRM` button has `disabled` attribute |

### 1.5 Collection page meta-states

| # | Test | State | Expected |
|---|------|-------|----------|
| 27 | Collection with vehicle, zero F-150 products | vehicle=2018 F-150, category has no F-150 products | Empty state shows "NO [CATEGORY] FOR YOUR 2018 FORD F-150 YET" with browse-all and vehicle-hub links |
| 28 | Collection with vehicle + dimension filter = zero products | bed=5.5, category=tonneau-covers, no 5.5' products | Empty state "NO MATCHES WITH THESE FILTERS" with CLEAR FILTERS link |
| 29 | Collection with vehicle, zero products, CLEAR FILTERS executes | click CLEAR FILTERS from above state | Dimension chip un-pressed, products re-appear (or different empty state if truly zero) |
| 30 | Collection with vehicle, fitsOnly=true, zero exact fits | ?fits=1 | Empty state "NO EXACT-FIT MATCHES" with SHOW ALL link |
| 31 | Collection clear_vehicle=1 escape hatch | Vehicle set, click "Browse all [category]" link | Page reloads without fitment filter; full catalog visible; vehicle STILL saved (header pill unchanged) |
| 32 | Collection fitMeta banner: N exact fits | vehicle saved, N>0 fits found | Banner reads "N exact fits for your YYYY MAKE MODEL, plus universal-fit options" |
| 33 | Collection fitMeta banner: zero exact fits | vehicle saved, fitsCount=0 | Banner reads "NO EXACT FITS YET" with "showing universal-fit options" |
| 34 | DimensionPicker chip pressed → collection narrows | Click bed_length chip on tonneau-covers | Product count changes server-side; pressed chip is visually active |
| 35 | DimensionPicker chip "Change" (un-press) | Click active chip again | Chip un-presses; products widen |
| 36 | Collection + vehicle with no available categories | Vehicle with no catalog hits anywhere | No DimensionPicker rendered; empty state not confused with "pick above" copy |

### 1.6 Search page crossed states

| # | Test | State | Expected |
|---|------|-------|----------|
| 37 | Search + vehicle, first OOS result ranked | Vehicle set, query returns OOS products first | OOS badge appears on card in results grid |
| 38 | Search + vehicle, fitment sort | Vehicle set, query with mix of fits/misfit/undefined | Cards sorted: FITS first → undefined → DOES NOT FIT (within Shopify relevance) |
| 39 | Search empty state TRENDING NOW cards | Vehicle=2018 F-150, /search (no query) | 4 TRENDING NOW cards render with correct fitment ribbons; OOS products show OOS badge |
| 40 | Search vehicle-relaxed banner | Vehicle set, scoped query returns 0, unscoped returns results | Yellow "NO EXACT-FIT MATCHES" banner shown; products still listed with CHECK FITMENT ribbons |
| 41 | Search zero results | Query that returns nothing | "NO RESULTS · TRY" banner with suggestion links; no product grid |
| 42 | Search result count copy: fits>0 | Vehicle set, 3 confirmed fits | Header reads "X RESULTS · 3 FITS YOUR YYYY MAKE MODEL" |
| 43 | Search result count copy: undetermined only | Vehicle set, 0 fits but 5 undefined | Header reads "X RESULTS · 5 MAY FIT — CONFIRM BED LENGTH..." |
| 44 | Search result count copy: none fit | Vehicle set, all confirmed misfits | Header reads "X RESULTS · NONE FIT YOUR YYYY MAKE MODEL" |

---

## SECTION 2 — Surface Coverage Map

Every surface that renders `ProductCard` must pass every reachable cell in the state matrix above. This section lists the exact URL + state to exercise each surface.

### 2.1 Surface S1 — Collection Grid

**URL pattern:** `/collections/{handle}` with vehicle cookie set  
**Required cookie state:** `stehlen_garage` with 2018 Ford F-150 + various sub-model answers

| # | Scenario | URL | Cookie State |
|---|----------|-----|--------------|
| 45 | OOS card in collection, vehicle saved | `/collections/bull-guards-grille-guards` | 2018 F-150, no trim |
| 46 | FITS + OOS simultaneously visible | Same page, Lincoln Navigator card | 2018 F-150 |
| 47 | DOES NOT FIT + OOS simultaneously visible | Collection with a confirmed-misfit OOS product | 2018 F-150 |
| 48 | CHECK FITMENT + OOS on card | Collection with undefined-fit OOS product | 2018 F-150 |
| 49 | All cards FITS (no OOS) — healthy state | `/collections/trailer-hitches` | 2018 F-150, in-stock products only |
| 50 | No vehicle, OOS card renders OOS badge | `/collections/bull-guards-grille-guards` | No garage cookie |
| 51 | Sub-model chip pressed, collection narrows, OOS cards still show OOS | `/collections/tonneau-covers?dim=bed_length:5.5` | 2018 F-150 |

### 2.2 Surface S2 — Search Results Grid

| # | Scenario | URL | Cookie State |
|---|----------|-----|--------------|
| 52 | OOS product appears in search results | `/search?q=bull+guard` | 2018 F-150 |
| 53 | OOS card shows OOS badge in search results | Same | 2018 F-150 — verify badge present on OOS card |
| 54 | FITS + OOS in search results | Same — verify Lincoln Navigator card | 2018 F-150 |
| 55 | No vehicle, search results OOS badge | `/search?q=bull+guard` | No cookie |

### 2.3 Surface S3 — Search Empty State TRENDING NOW

| # | Scenario | URL | Cookie State |
|---|----------|-----|--------------|
| 56 | TRENDING NOW cards render at least 4 | `/search` (no query) | Any |
| 57 | TRENDING NOW with vehicle — fitment ribbons correct | `/search` | 2018 F-150 |
| 58 | TRENDING NOW — OOS product in mock PRODUCTS[0..3] shows OOS badge | `/search` | No vehicle — verify inventory=0 products show badge |
| 59 | TRENDING NOW — OOS + vehicle shows both OOS badge + fitment ribbon | `/search` | 2018 F-150, if any TRENDING mock product is OOS |

### 2.4 Surface S4 — Vehicle Hub Top Picks

| # | Scenario | URL | Cookie State |
|---|----------|-----|--------------|
| 60 | Top Picks rail renders at least 4 cards | `/vehicle/ford-f-150` | 2018 F-150 |
| 61 | Top Picks: OOS card shows OOS badge | `/vehicle/ford-f-150` | 2018 F-150 (trailer hitch combo verified OOS on this surface) |
| 62 | Top Picks: OOS + FITS ribbon simultaneously | `/vehicle/ford-f-150` | 2018 F-150 |
| 63 | Top Picks: no DOES NOT FIT cards | `/vehicle/ford-f-150` | 2018 F-150 — vehicle hub filters misfits |
| 64 | Top Picks fallback mock renders when Shopify unreachable | Simulate with `?_mock=1` or offline | Products.slice(0,4) renders with correct inventory state |
| 65 | Top Picks: fakeVehicle uses garage year when garage matches hub | `/vehicle/ford-f-150` with 2018 F-150 garage | Fitment ribbons reference "2018 FORD F-150" not "2024 FORD F-150" |

### 2.5 Surface S5 — PDP SIMILAR PRODUCTS Rail

| # | Scenario | URL | Cookie State |
|---|----------|-----|--------------|
| 66 | SIMILAR PRODUCTS renders when related products exist | Any PDP with related products | 2018 F-150 |
| 67 | SIMILAR PRODUCTS: OOS card in rail shows OOS badge | Same PDP, one sibling OOS | 2018 F-150 |
| 68 | SIMILAR PRODUCTS: OOS + FITS ribbon simultaneously | Same | 2018 F-150 |
| 69 | SIMILAR PRODUCTS suppressed when related.length===0 | Navigator bull guard PDP (no F-150 siblings) | 2018 F-150 — verify NO "SIMILAR PRODUCTS" heading |
| 70 | SIMILAR PRODUCTS heading: "SIMILAR PRODUCTS THAT FIT YOUR YYYY MAKE MODEL" when all fit | PDP with full-fit rail | 2018 F-150, relatedAllFit=true |
| 71 | SIMILAR PRODUCTS heading: "SIMILAR PRODUCTS" (no fitment claim) when not all fit | PDP with mixed-fit rail | 2018 F-150, relatedAllFit=false |
| 72 | SIMILAR PRODUCTS: sub-model answers honored — 5.5' bed sees 5.5' siblings | `/products/{tonneau-5.5-handle}` | 2018 F-150, bed_length=5.5' BED |
| 73 | SIMILAR PRODUCTS: 6.5' bed PDP does not show 5.5' cover in rail | `/products/{tonneau-6.5-handle}` | 2018 F-150, bed_length=5.5' BED — 6.5' product DOES NOT FIT |

---

## SECTION 3 — Negative-Space Tests

These tests verify that required elements render when they must, required elements are absent when they must not be, and disabled controls explain why.

### 3.1 Must-Render checks

| # | Component | Condition | Must render |
|---|-----------|-----------|-------------|
| 74 | OOS badge | `inventory <= 0`, any ProductCard surface | `OUT OF STOCK` text in card DOM |
| 75 | Image opacity 45% | `inventory <= 0` | `opacity: 0.45` on product image |
| 76 | Fitment ribbon | `vehicle` set AND `fits !== undefined` | Color-coded ribbon at card bottom |
| 77 | CHECK FITMENT ribbon | `vehicle` set AND `fits === undefined` | Dark "CHECK FITMENT FOR YOUR YYYY MAKE MODEL" ribbon |
| 78 | ATC `OUT OF STOCK` label | `inventory <= 0` | ATC button reads `OUT OF STOCK`, `disabled` attribute set |
| 79 | "Ships when restocked" | PDP, `inventory <= 0` | Trust row shipping line reads "Ships when restocked" |
| 80 | Back-in-stock form | PDP, `inventory <= 0` | `#warehouse-note` or back-in-stock section present with email input |
| 81 | `CLEAR FILTERS` link | Empty state from dimension or sidebar filter | `CLEAR FILTERS` clickable link present |
| 82 | Browse-all escape hatch | Vehicle set, zero products in collection | "Browse all [category]" link with `?clear_vehicle=1` |
| 83 | Vehicle hub link in empty state | Vehicle set, zero products in collection | "/vehicle/YYYY-MAKE-MODEL" link in empty state |
| 84 | NOTIFY ME form validation error | Submit back-in-stock form with invalid email | Inline error message rendered; page does not hard-navigate away |
| 85 | Engine exclusion callout | `product.fitmentTable.subattributes.engineExclusions` non-empty, fits not false | Yellow engine note callout above buy box |
| 86 | Warehouse note | `csvWarehouseNote` or `metafieldNotes` present | Warehouse note block rendered above BuyBox |
| 87 | Warehouse note "Ships when restocked" consistent | OOS + warehouse note present | No "Ships in 1-2 business days" claim anywhere on same page |
| 88 | Misfit reason copy | fits=false, vehicle set, fitmentTable present | Specific reason rendered (year/make/model/excluded/subattribute) |
| 89 | SIMILAR PRODUCTS absent when empty | `related.length === 0` | No "SIMILAR PRODUCTS" heading rendered |
| 90 | DimensionPicker absent when category has no required groups | Category without dimension groups (e.g. trailer-hitches) | No DimensionPicker section rendered above toolbar |

### 3.2 Must-Not-Render checks

| # | Component | Condition | Must NOT render |
|---|-----------|-----------|-----------------|
| 91 | "Ships in 1-2 business days" | `inventory <= 0` | Shipping claim absent or replaced with "Ships when restocked" |
| 92 | Rating/stars row | `reviews === 0` | Rating row absent from ProductCard and PDP buy-box |
| 93 | `UNIVERSAL FIT` chip | `product.fitmentTable` has bedLengths/cabTypes/boxOptions/engineExclusions | Universal fit chip absent |
| 94 | `CONFIGURED FOR YYYY MAKE MODEL` | `product.fits !== true` | That footer caption absent |
| 95 | BEST SELLER badge | `badges` does not include "BEST SELLER" | Badge absent |
| 96 | DimensionPicker | Category has required groups BUT vehicle has no products in category | Picker suppressed (not rendered above no-product empty state) |
| 97 | Filter sidebar | `collection.products.length === 0` | Sidebar absent on zero-product collection |
| 98 | Pagination bar | `totalProducts <= products.length` | Pagination absent when all products fit on one page |
| 99 | Reactivation banner | Vehicle saved in garage | Reactivation banner absent from home page |
| 100 | "Bought from us on eBay" band | Vehicle saved | Band absent from home page |

### 3.3 Must-Disable-With-Reason checks

| # | Control | Disable condition | Required explanation |
|---|---------|-------------------|----------------------|
| 101 | ATC button | OOS | Button text `OUT OF STOCK`, `disabled` attribute, cursor: not-allowed |
| 102 | ATC button | Strip unanswered | Button text `SELECT {strip.label}`, `disabled`, cursor: not-allowed |
| 103 | ATC button | Bed mismatch | Button text `WRONG BED LENGTH FOR YOUR VEHICLE`, `disabled` |
| 104 | Affirm buy-now | OOS | `disabled` attribute set |
| 105 | Affirm buy-now | Strip unanswered | `disabled` attribute set |
| 106 | Bed chip (wrong bed, no sibling) | `effectiveBedLengthSiblings` set, no target sibling for this bed | Chip `disabled`, strikethrough style, tooltip explains no variant |
| 107 | Qty decrement below 1 | qty === 1 | qty stays at 1; no negative values entered |

---

## SECTION 4 — Trust-Violation Tests

Every customer-facing promise must be paired with a test that verifies fulfillment. A promise without a fulfillment check is a trust violation waiting to be found by a customer.

| # | Promise | Where | Fulfillment Test |
|---|---------|-------|-----------------|
| 108 | "FITS YOUR YYYY MAKE MODEL" (green, collection card) | ProductCard ribbon | Actual product `fits === true` per `withFitment()`. NEVER shows on `fits === false` or `fits === undefined` products |
| 109 | "FITS YOUR YYYY MAKE MODEL" (green, collection card) + OOS | ProductCard ribbon + OOS badge | Both signals present when `fits === true && inventory <= 0`. Card never hides OOS behind fitment confidence |
| 110 | "CONFIRMED FITMENT — Fits your YYYY MAKE MODEL" (PDP green card) | PDP buy-box | `productFits === true && allStripsAnswered === true`. Absent if either is false |
| 111 | "BEST SELLER" badge on collection card | ProductCard badge | Only when `badges.includes("BEST SELLER")` from Shopify tag. Not mocked. |
| 112 | "BEST SELLER" + OOS | PDP hero | Product tagged BEST SELLER but OOS: PDP still shows BEST SELLER badge + "Out of stock" stock indicator simultaneously — buyer knows it's popular but temporarily unavailable |
| 113 | "FREE SHIPPING, NO MINIMUM" (trust row on PDP) | PDP trust list | Cart checkout page does NOT add a shipping fee line item |
| 114 | "FREE SHIPPING, NO MINIMUM" (announcement bar) | Header announcement bar | Same — cart checkout must not show shipping fee |
| 115 | "FITMENT GUARANTEED OR YOUR MONEY BACK" (announcement bar) | Header announcement bar | `/legal/fitment-guarantee` page exists and loads (link in footer) |
| 116 | "Ships in 1-2 business days" | PDP trust row | Only when `inventory > 0`. NEVER shows on OOS products |
| 117 | "Ships when restocked" | PDP trust row | Appears when `inventory <= 0`. Does NOT appear alongside "Ships in 1-2 business days" |
| 118 | "30-day hassle-free returns" (PDP trust row) | PDP trust list | `/legal/returns` page exists and loads |
| 119 | "Lifetime structural warranty · 5-year finish" (PDP trust row) | PDP trust list | `/legal/warranty` page exists and loads |
| 120 | "Drilling-free install" (PDP trust row) | PDP trust list | `/help/install` page exists and loads |
| 121 | "1 in stock" (PDP stock indicator green) | PDP buy-box stock line | `inventory > 0`. String format: "{N} in stock" in green |
| 122 | "Out of stock" (PDP stock indicator red) | PDP buy-box stock line | `inventory <= 0`. String: "Out of stock" in destructive color |
| 123 | "or 4× ${price/4} with Affirm" (collection card) | ProductCard Affirm line | Affirm not shown as "0" or NaN — price is always > 0 before dividing |
| 124 | "or 4 interest-free payments of ${price/4} with Affirm" (PDP) | PDP price section | Same. Verify math: `price / 4` with correct toFixed(2) |
| 125 | "$25 off your first order over $200" (newsletter) | Footer newsletter section | Welcome-back promo /legal/terms or /welcome-back page exists and describes the offer |
| 126 | "CLAIM 10% RETURNING-CUSTOMER OFFER" (home reactivation banner) | Home page (no vehicle) | `/welcome-back` page loads and contains the offer details |
| 127 | "SHOP PARTS THAT FIT" (home page YMM band, vehicle saved) | Home page yellow band | Link goes to `/vehicle/{slug}` which shows that vehicle's parts |
| 128 | "TOP PICKS FOR THE {MODEL}" vehicle hub | Vehicle hub | Products in rail are actual matches for this make/model — NOT generic catalog. Zero confirmed-misfit cards |
| 129 | "SIMILAR PRODUCTS THAT FIT YOUR YYYY MAKE MODEL" (PDP rail heading) | PDP SIMILAR PRODUCTS | `relatedAllFit === true`. When even one card doesn't fit, heading reads "SIMILAR PRODUCTS" (no fitment claim) |
| 130 | "Also fits: MODEL1 · MODEL2" (PDP green card) | PDP confirmed fitment hero | Only appears when `product.fitmentTable.applications` contains other models. Verified against actual fitment data |
| 131 | "Will not fit EcoBoost engine" (engine note) | PDP engine callout | Appears only when `fitmentTable.subattributes.engineExclusions` is non-empty. Never appears on unrelated products |
| 132 | "FITMENT GUARANTEE" (PDP fitment tab) | PDP FITMENT tab | Tab content includes vehicle compatibility table sourced from fitment data; not placeholder Lorem Ipsum |

---

## SECTION 5 — Catalog-Edge Probing

These tests specifically seek out edge-case products that stress the system. Run these BEFORE any round that touches fitment, inventory, or product-card code.

### 5.1 Out-of-Stock Inventory Probing

| # | Test | How to find | Expected behavior |
|---|------|-------------|-------------------|
| 133 | First OOS product in bull-guards collection | Load `/collections/bull-guards-grille-guards` with 2018 F-150 — first card in grid | OOS badge visible; ATC blocked if tapped-through to PDP |
| 134 | OOS product in search results | `/search?q=bull+guard` with 2018 F-150 | OOS badge on Lincoln Navigator card |
| 135 | OOS product in vehicle hub Top Picks | `/vehicle/ford-f-150` with 2018 F-150 | OOS badge on trailer hitch combo card |
| 136 | All-OOS category | When a category has all OOS products | Every card shows OOS badge; empty-state logic NOT triggered (products.length > 0) |
| 137 | OOS PDP: ATC never bypassed | Navigate to OOS PDP directly, try all paths to ATC | `canAdd = false` when `outOfStock`; no way to add qty > 0 to cart via normal UI |
| 138 | OOS PDP: back-in-stock form submits successfully | Fill email + submit on OOS PDP | `?notify=ok` redirects back to PDP; success message renders |
| 139 | OOS PDP: invalid email rejected | Submit form with "not-an-email" | `?notify=invalid` redirects; inline error message renders |

### 5.2 Missing / Incomplete Fitment Metafield

| # | Test | Product state | Expected behavior |
|---|------|--------------|-------------------|
| 140 | Product with no fitmentTable | `product.fitmentTable === null` | Fitment tab renders empty or "Compatibility data not available"; no crash |
| 141 | Product with fitmentTable but zero applications | `fitmentTable.applications = []` | No `isAccessoryOrSparePartFor` in JSON-LD; PDP doesn't crash |
| 142 | Product with fitmentTable but no notesHtml | `notesHtml = null` | No warehouse note block renders; no crash |
| 143 | Product with fitmentTable engineExclusions but fits=undefined | `engineExclusions` non-empty, no vehicle | Engine exclusion callout renders unconditionally (per spec) |
| 144 | Product where title-bed-match extracts nothing | Title has no bed length mention | `effectiveBedLengthSiblings = null`; no strip rendered; no crash |
| 145 | Product with fitmentTable but NO bedLengths in subattributes | `subattributes.bedLengths = []` or absent | `UNIVERSAL FIT` chip renders if `fits === true` and no bed strip |

### 5.3 Categories with Zero Vehicle Products

| # | Test | Setup | Expected |
|---|------|-------|----------|
| 146 | Category with zero F-150 products + vehicle set | `/collections/running-boards` with 2018 F-150 (if no running boards for this model) | Empty state "NO RUNNING BOARDS FOR YOUR 2018 FORD F-150 YET" with three recovery links |
| 147 | Vehicle hub category tiles: only show categories with actual products | `/vehicle/ford-f-150` with 2018 F-150 | No category tile links to a collection that would produce the "zero for your vehicle" empty state |
| 148 | DimensionPicker suppressed when category has zero products for vehicle | `/collections/tonneau-covers` with a vehicle that has no tonneau data | No picker rendered; appropriate empty state shown |
| 149 | `?clear_vehicle=1` on empty-category page | Click "Browse all [category]" from zero-vehicle-product empty state | Full catalog loads; vehicle STILL saved; header pill unchanged |

### 5.4 Crafted / Malicious URL Parameters

| # | Test | URL | Expected |
|---|------|-----|----------|
| 150 | Invalid ?dim= group | `/collections/tonneau-covers?dim=banana:5.5` | Invalid group rejected; no crash; picker renders normally |
| 151 | Invalid ?dim= value | `/collections/tonneau-covers?dim=bed_length:12345-feet` | Value rejected by `canonicalSubModelValue`; picker renders without pre-selection |
| 152 | ?dim= value too long (>64 chars) | `/collections/tonneau-covers?dim=bed_length:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` | Rejected by length check; no crash |
| 153 | ?dim= value from wrong vehicle (stale cookie) | 5.5' BED cookie on vehicle that only has 6.5' options | `canonicalSubModelValue` returns null; answer dropped; picker renders without pre-selection |
| 154 | ?f= with malformed base64 | `/collections/tonneau-covers?f=not-valid-base64!!!` | Caught in try/catch; no crash; filter ignored |
| 155 | ?sort= with invalid value | `/collections/tonneau-covers?sort=hacked` | Falls through `ALLOWED_SORTS` check; sort ignored; default applies |
| 156 | ?notify= with arbitrary value | `/products/{handle}?notify=hacked` | notifyState = "hacked" → neither "ok" nor "invalid" branch renders → shows normal form |

### 5.5 Vehicle/Make/Model Edge Cases

| # | Test | Setup | Expected |
|---|------|-------|----------|
| 157 | GMC Sierra NOT under Chevrolet | `/collections/{any}` with 2018 GMC Sierra | No Sierra products appear under Chevrolet collection |
| 158 | Chevrolet Silverado NOT under GMC | `/collections/{any}` with 2018 Chevrolet Silverado | No Silverado products under GMC collection |
| 159 | Lincoln Navigator with 2018 F-150 saved — collection card shows FITS | `/collections/bull-guards-grille-guards` | Navigator bull guard shows green FITS ribbon (fitment data covers F-150 frame) |
| 160 | YMM modal: Year → Make → Model selection sequence | Open modal, select 2018, Ford, F-150, Save | Header pill updates to "2018 FORD F-150"; next page load shows fitment ribbons |
| 161 | YMM modal: Switch vehicle mid-session | Garage has 2018 F-150; change to 2020 Silverado via modal | All fitment ribbons on current page update; picker strips reset |
| 162 | Vehicle hub slug with year prefix | `/vehicle/2018-ford-f-150` | Page loads correctly; filterYear=2018 applied to category filtering; hub h1 reads "FORD F-150" |
| 163 | Vehicle hub: slug for unrecognized make | `/vehicle/honda-ridgeline` | parseSlug falls through; notFound() triggered |
| 164 | Vehicle hub: Jeep Wrangler JL vs JK | `/vehicle/jeep-wrangler-jl` vs `/vehicle/jeep-wrangler-jk` | Each hub shows own generation cards and correct SHOP {code} PARTS links |

---

## SECTION 6 — Mike + Jordan Persona Retooling

Mike and Jordan do not test at random. Each persona has a mandatory edge-case probe list that runs BEFORE their normal flows.

### 6.1 Mike (Customer-Tester) — Mandatory First Actions

Mike always shops like a real buyer. **New rule: Mike's FIRST action in every round is to deliberately find an edge-case product, not a happy-path product.**

**Always probe first:**

| # | Mike Must | How |
|---|-----------|-----|
| 165 | Find the FIRST OOS product in any collection | On the collection page with his vehicle set, identify any card with an OOS badge and tap through |
| 166 | Verify that tapping through from OOS+FITS collection card → OOS PDP is honest | PDP must show: inventory "Out of stock," ATC disabled `OUT OF STOCK`, no "Ships in 1-2 business days" |
| 167 | Try to add an OOS product to cart via URL manipulation | Navigate directly to the PDP and attempt ATC — must be blocked |
| 168 | Find the first sub-model-required product and NOT pick the strip | Navigate to tonneau covers, find a bed-length-specific product, do NOT pick bed length — ATC must show `SELECT YOUR TRUCK'S BED LENGTH` |
| 169 | Check a DOES NOT FIT product card — verify vehicle context is named | Red ribbon must say "DOES NOT FIT YOUR 2018 FORD F-150" not just "DOES NOT FIT" |
| 170 | Check the SIMILAR PRODUCTS rail on a bull guard PDP | Is rail present or absent? If present, do any cards show OOS? If absent, is that correct? |
| 171 | On vehicle hub, verify Top Picks do not include DOES NOT FIT cards | Any red DOES NOT FIT ribbon on a vehicle hub Top Picks card is a FAIL |
| 172 | Click a vehicle hub category tile; confirm the collection is not empty | Tile must not lead to "NO [CATEGORY] FOR YOUR YYYY MAKE MODEL YET" empty state |
| 173 | Search for "bull guard" and find the OOS one | `/search?q=bull+guard` — OOS Lincoln Navigator card must show OOS badge |
| 174 | Navigate back after tapping through to OOS PDP | Browser back button returns to collection with same scroll position (or top); vehicle still set |

**Mike's existing flows continue after the above probes are complete.**

**Mike must also vary his vehicle each round:**

| Round | Primary Vehicle | Secondary Vehicle |
|-------|-----------------|-------------------|
| Odd rounds | 2018 Ford F-150 | 2019 Chevrolet Silverado |
| Even rounds | 2020 Jeep Wrangler JL | 2016 Toyota Tacoma |

**Mike must vary his collection entry point each round:**

- Not always starting at `/collections/tonneau-covers`. Rotate: bull-guards, headlights, trailer-hitches, front-grilles, running-boards.

### 6.2 Jordan (UX) — Mandatory Checks

Jordan audits UX and visual integrity. **New rule: Jordan's FIRST action is to verify state-sensitive UI integrity.**

| # | Jordan Must | Pass Criteria |
|---|-------------|---------------|
| 175 | Verify OOS card is visually distinguishable at a glance | OOS badge + dimmed image reads as "unavailable" without reading text |
| 176 | Verify OOS + FITS ribbon co-existence does not look broken | Two signals on same card: OOS badge top-right, FITS ribbon bottom — no overlap, no z-index fight |
| 177 | Verify DOES NOT FIT ribbon names the vehicle | "DOES NOT FIT YOUR 2018 FORD F-150" — not "DOES NOT FIT" alone |
| 178 | Verify PDP OOS state top-to-bottom visual consistency | Stock line → ATC → Affirm → trust row all reflect OOS; no conflicting signal |
| 179 | Verify empty collection state has clear recovery | Three links (browse-all, vehicle hub, all categories) are visible, tappable, ≥44px tap target |
| 180 | Verify DimensionPicker renders above the product grid, not below | Picker visually precedes grid; it is not buried below the fold on desktop |
| 181 | Verify chip tap targets on mobile (375px) | All chip buttons ≥44px height, measured with getBoundingClientRect |
| 182 | Verify no horizontal scroll at 375px viewport | Any collection or PDP page at 375px — no `document.body.scrollWidth > 375` |
| 183 | Verify focus-visible on ATC button | Tab to ATC button; focus ring must be visible on both active and disabled states |
| 184 | Verify ATC disabled state has cursor:not-allowed | `getComputedStyle(atcBtn).cursor === 'not-allowed'` when `!canAdd` |

---

## SECTION 7 — Round-Over-Round Regression Checklist

This checklist runs every round, in priority order. Do not skip tiers to reach lower-priority ones. A FAIL in tier 1 blocks the round.

### TIER 1 — Critical Path (ship-blocker if any fail)

| # | Check | Test |
|---|-------|------|
| 185 | Home page loads | GET `/` → 200, no console errors |
| 186 | Collection page loads with vehicle | GET `/collections/tonneau-covers` with 2018 F-150 cookie → 200, products render |
| 187 | PDP loads | GET `/products/{any-in-stock-handle}` → 200, ATC enabled |
| 188 | Add to cart succeeds | Click ATC on in-stock, no-sub-model-required PDP → cart drawer opens, count badge increments |
| 189 | Cart drawer opens | `window.dispatchEvent(new CustomEvent('stehlen:cart:open'))` → drawer appears |
| 190 | Checkout handoff | Cart → CHECKOUT → redirects to Shopify hosted checkout URL |
| 191 | YMM modal opens | Click any YmmButton → modal opens, Year step visible |
| 192 | YMM save updates header pill | Complete Year → Make → Model → Save → header reads "YYYY MAKE MODEL" |
| 193 | No JavaScript console errors on home, collection, PDP | 0 errors in browser console |

### TIER 2 — Fitment Surface (ship-blocker if FITS claims are wrong)

| # | Check | Test |
|---|-------|------|
| 194 | Green FITS ribbon only on confirmed-fit products | Spot-check 3 products with green ribbon → each must have `fits === true` (verify via `withFitment()` logic; check product title matches vehicle) |
| 195 | No false-positive CONFIRMED FITMENT on PDP | Open a PDP for a product whose YMM range does NOT include the garage vehicle → PDP must show DOES NOT FIT or CHECK FITMENT, never green CONFIRMED |
| 196 | Sub-model strip blocks ATC until answered | Open a bed-length-specific tonneau PDP with 2018 F-150 and NO bed saved → ATC reads `SELECT YOUR TRUCK'S BED LENGTH` |
| 197 | Sub-model answer persists to cookie | Pick bed_length on PDP → navigate to collection → DimensionPicker chip shows active for that bed |
| 198 | Switch vehicle: fitment ribbons update | Change from 2018 F-150 to 2020 Silverado → collection page fitment ribbons reflect Silverado |
| 199 | Engine exclusion visible before ATC | Open a product with engineExclusions and `fits !== false` → engine note callout is above the buy-box |
| 200 | Bed mismatch HARD blocks ATC | Save 5.5' bed, open a 6.5' tonneau PDP → ATC disabled `WRONG BED LENGTH FOR YOUR VEHICLE`; `ADD TO CART ANYWAY` NOT available |
| 201 | Vehicle hub Top Picks: no DOES NOT FIT cards | `/vehicle/ford-f-150` with 2018 F-150 → 0 cards with red DOES NOT FIT ribbon |

### TIER 3 — Inventory Integrity (ship-blocker if OOS state is wrong)

| # | Check | Test |
|---|-------|------|
| 202 | OOS card shows OOS badge in collection | `/collections/bull-guards-grille-guards` with 2018 F-150 → Lincoln Navigator card shows OOS badge |
| 203 | OOS card shows dimmed image | Same card → image opacity 0.45 |
| 204 | OOS + FITS signals co-exist correctly | Same card → both OOS badge and FITS ribbon present |
| 205 | OOS PDP: ATC disabled | Navigate to OOS PDP → ATC button disabled, reads `OUT OF STOCK` |
| 206 | OOS PDP: no "Ships in 1-2 business days" claim | Trust row reads "Ships when restocked" only |
| 207 | OOS PDP: Affirm button disabled | `BUY NOW WITH AFFIRM` has `disabled` attribute |
| 208 | OOS PDP: back-in-stock form present | Email input + NOTIFY ME button visible |
| 209 | In-stock PDP: back-in-stock form absent | No back-in-stock section on an in-stock product |
| 210 | OOS search card shows OOS badge | `/search?q=bull+guard` with vehicle → OOS cards have badge |
| 211 | OOS vehicle-hub Top Picks shows OOS badge | `/vehicle/ford-f-150` → OOS card in Top Picks shows badge |

### TIER 4 — Tap Targets and Mobile (ship-conditional if blocking on mobile)

| # | Check | Viewport | Test |
|---|-------|----------|------|
| 212 | No horizontal scroll | 375px | `document.body.scrollWidth <= 375` on home, collection, PDP, search |
| 213 | ATC button tap target | 375px | `atcBtn.getBoundingClientRect().height >= 44` |
| 214 | Chip buttons tap target | 375px | All sub-model chips `height >= 44` |
| 215 | Breadcrumb links tap target | 375px | All breadcrumb links `minHeight: 44` (per code) |
| 216 | Cart badge visible on mobile | 375px | Badge count visible in header |
| 217 | Mobile filter drawer opens | 375px | Tap "FILTERS · N PRODUCTS" button → mobile filter drawer slides in |
| 218 | YMM band hidden on mobile | 375px | Desktop YMM yellow band is `hidden md:block` → absent on 375px |
| 219 | Mega-nav hidden on mobile | 375px | Desktop nav is `hidden md:flex` → mobile hamburger present |
| 220 | Mobile sticky ATC appears after scroll | 375px PDP | Scroll past buy-box → sticky ATC appears at bottom |
| 221 | Mobile sticky ATC mirrors ATC state | 375px OOS PDP | Sticky ATC reads `OUT OF STOCK`, disabled |

### TIER 5 — Consistency and SEO (can ship with follow-up ticket)

| # | Check | Test |
|---|-------|------|
| 222 | JSON-LD Product.availability correct | OOS PDP → `<script type="application/ld+json">` contains `"availability": "https://schema.org/OutOfStock"` |
| 223 | JSON-LD Product.availability correct (in-stock) | In-stock PDP → JSON-LD `"availability": "https://schema.org/InStock"` |
| 224 | Breadcrumb JSON-LD present on collection | `/collections/tonneau-covers` → two JSON-LD scripts (BreadcrumbList + ItemList) |
| 225 | ItemList JSON-LD absent when zero products | Empty-state collection → no ItemList JSON-LD (products.length === 0 guard) |
| 226 | PDP canonical tag correct | `<link rel="canonical">` matches `/products/{handle}` |
| 227 | Collection canonical tag correct | `<link rel="canonical">` matches `/collections/{handle}` |
| 228 | Dynamic title on synthetic collections | `/collections/best-sellers` → title is "Best Sellers — Top Truck, SUV & Jeep Parts" not "Collection" |
| 229 | Search results noindex | `/search?q=anything` → `<meta name="robots" content="noindex, follow">` |
| 230 | Search empty page indexable | `/search` (no query) → `<meta name="robots">` allows indexing |
| 231 | OG tags on collection page | `/collections/tonneau-covers` → `og:title`, `og:description`, `og:image` all present |
| 232 | No duplicate title "Stehlen Auto | Stehlen Auto" | Any page → browser tab reads "X | Stehlen Auto", not doubled |

---

## Live Site Verification Notes (14AX cycle, 2026-05-11)

Walk executed on `https://stehlenauto-vercel.vercel.app` with 2018 Ford F-150 cookie active.

**OOS card fix (14AX) — VERIFIED WORKING on S1, S2, S4:**

- S1 (Collection grid): `/collections/bull-guards-grille-guards` — Lincoln Navigator card shows "OUT OF STOCK" badge top-right + green "FITS YOUR 2018 FORD F-150" ribbon at bottom. Image opacity visually dimmed. OOS badge co-exists correctly with FITS ribbon. PASS.
- S2 (Search results): `/search?q=bull+guard` — OOS badge present on both confirmed-OOS cards (Lincoln Navigator mesh and LED bar variant). PASS.
- S4 (Vehicle hub Top Picks): `/vehicle/ford-f-150` — Trailer hitch combo card shows OOS badge + FITS ribbon. PASS.
- S5 (PDP SIMILAR PRODUCTS): Navigator PDP has zero related products; rail is suppressed. Correct (no related F-150 bull guard siblings). PASS.
- S3 (Search TRENDING NOW): 4 cards render. None were OOS in live catalog at test time. **UNVERIFIED — needs repeat when a TRENDING NOW mock product is OOS.**

**OOS PDP state — VERIFIED:**
- ATC: "OUT OF STOCK", `disabled=true`
- Stock line: "Out of stock" in red
- Trust row: "Ships when restocked" (not "Ships in 1-2 business days")
- Affirm: `disabled` attribute present
- Confirmed fitment hero: still shows green (FITS=true), which is correct behavior
- SIMILAR PRODUCTS: absent (suppressed, `related.length === 0`)
- Back-in-stock form: **NOT VERIFIED IN THIS WALK** — navigator PDP did not render it visibly in DOM scan; requires fresh page load and scroll-to-bottom check.

**Gap found during walk:** S3 TRENDING NOW inventory state with OOS mock products is unverified. Add to pre-ship checklist when mock PRODUCTS array includes OOS items.

---

## Test Execution Matrix (round-over-round)

| Session Type | Sections Required | Min tests | Estimated time |
|---|---|---|---|
| Pre-ship sign-off | S7 Tier 1-4 + S3 Negative + S4 Trust | ~80 tests | 90 min |
| Full regression (after fitment code change) | All sections | ~290 tests | 4 hrs |
| Inventory code change | S1 matrix OOS rows + S2 full + S7 Tier 3 | ~60 tests | 60 min |
| ProductCard change | S1 full + S2 full + S3 full | ~120 tests | 2 hrs |
| Collection page change | S1 full + S5 collection + S7 Tier 2 | ~80 tests | 90 min |

---

*End of comprehensive test plan — v1.0*
