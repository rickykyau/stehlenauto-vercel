# Competitor Fitment UX Research

**Date:** 2026-04-08
**Purpose:** Understand how major auto-parts e-commerce sites resolve the tension between vehicle-selector simplicity (YMM) and fitment accuracy at the trim/sub-model level. Informs the Stehlen Auto "4th filter" design decision.

## Summary Table

| Site | Primary selector fields | Trim/sub-model required upfront? | Where sub-model is collected | Specific dimensions collected | Garage stores | Fit copy on PDP | Compatibility chart? |
|---|---|---|---|---|---|---|---|
| **Tyger Auto** | 3 (Y/M/M) | No | PDP variant dropdowns (bed length, finish) per product | Bed length, finish, cab (per product) | YMM only | "Fits your [YMM]" | Yes (manual fitment list per product) |
| **RealTruck** | **4 (Y/M/M + Bed)** on tonneau flows; 3 elsewhere | **Yes, for fitment-critical categories** (tonneau covers, bed accessories) | Integrated into primary selector as a 4th mandatory field (`fitmentBed`, `fitmentBody`) | Bed length, cab/body style | YMM + bed + body (sticky) | "Fits your [Year Make Model Bed]" with "Guaranteed Fit" badge | Yes |
| **4 Wheel Parts** | 3 (Y/M/M) | No | Left-rail category filters + PDP variant drops; engine/submodel optional | Submodel, engine, drivetrain (category filters) | YMM only | "Guaranteed Fit" badge + "Fits your [YMM]" | Yes |
| **RockAuto** | **4 (Y/M/M + Engine)** | **Yes — engine is required** | Integrated into primary selector; engine dropdown appears after model | Engine (liter + cyl) | YMM + engine | Catalog tree scoped to exact YMME; no "fits" copy — catalog itself is filtered | No (tree is the chart) |
| **AutoAnything** | Now redirects to AmericanTrucks (acquired) | — | — | — | — | — | — |
| **AmericanTrucks** | **No form selector**; navigation-based (generation URLs) | N/A — user self-selects generation page | URL/navigation picks the bed/cab/generation via dedicated landing pages; PDP variant dropdowns | Bed, cab, engine via URL structure | YMM + generation | "Fits: 2021-2026 F-150" inline list on PDP | Yes (explicit fitment list on every PDP) |
| **Summit Racing** | 3 (Y/M/M) primary; optional submodel/engine | **No** — kept lean | "Applications" tab on each PDP (manual check); filterable by engine/submodel | Submodel, engine, drivetrain | YMM (+ submodel/engine optional) | "Check the Fit" call-to-action + Applications table | Yes (Applications tab — known to be buried; frequent mis-fits flagged in reviews) |
| **AutoZone** | **4 (Y/M/M + Engine)** | **Yes — engine is required** before catalog browsing | Integrated; engine dropdown appears after model with cyl/liter/CID | Engine | YMM + engine ("MyZone" garage) | "Fits your [Year Make Model Engine]" | Limited — YMME scoping is the guarantee |
| **O'Reilly** | 3 (Y/M/M) primary; engine prompted for specific categories (filters, engine-specific) | **Conditional** — engine required only for engine-scoped categories | Mid-catalog prompt ("Select your engine to continue") | Engine | YMM + engine | "Fits your [Year Make Model]" + engine if collected | Limited |
| **Advance Auto Parts** | **4 (Y/M/M + Engine)** OR VIN OR license plate | **Yes — engine required** (or VIN bypass) | Integrated; also offers VIN/plate lookup which auto-fills engine & submodel | Engine; VIN yields full trim/submodel | YMM + engine + VIN | "Fits your [YMME]"; disclaimer that only VIN = 100% fit guarantee | Yes |
| **PartCatalog** | 3 (Y/M/M) with optional drilldown | No upfront | PDP-level drilldown with full-page refresh when filter applied; fitment guarantee refund if wrong | Submodel, engine (per category) | YMM sticky | "Fits your [YMM]" with refund guarantee | Yes |

## Patterns Observed

### Pattern A — "Keep selector at 3, push sub-model to PDP"
**Used by:** Tyger Auto, 4 Wheel Parts, Summit Racing, PartCatalog, O'Reilly (default)

The primary vehicle bar stays at YMM (fast, one-line commitment). Sub-model dimensions are collected either as:
- **Variant dropdowns on the PDP** (bed length, finish, cab) — user picks at add-to-cart time
- **Category filters in the left rail** (engine, submodel, drivetrain)
- **A separate "Applications"/"Check the Fit" table** the user can expand

**Pro:** Low friction for the 51% of products that are universal. Users can browse immediately.
**Con:** Sub-model errors slip through. Summit Racing reviews explicitly complain that the "Applications" tab is buried and users receive wrong parts. Fitment accuracy depends on the user reading the PDP carefully.

### Pattern B — "4-field selector for fitment-critical categories"
**Used by:** RealTruck (tonneau/bed categories), RockAuto (engine required always), AutoZone (engine required always), Advance Auto Parts

The selector expands to 4 fields when the product category demands it. RealTruck is the clearest example — on tonneau-cover flows, the selector requires Year + Make + Model + **Bed length** as a mandatory 4th dropdown. RockAuto/AutoZone/Advance always require engine because their whole catalog is maintenance-parts and engine is load-bearing for every lookup.

**Pro:** Highest fitment accuracy. Zero ambiguity at add-to-cart. "Guaranteed Fit" marketing works.
**Con:** Extra friction on every visit. Users who don't know their bed length abandon or guess. AutoZone mitigates this with a VIN-decoder shortcut.

### Pattern C — "Navigation/URL as selector, no form"
**Used by:** AmericanTrucks, partly RealTruck

No form selector — the site structure itself encodes the sub-model. Users click "2015–2020 F-150" (a generation-specific landing page), then "5.5 ft bed" as a sub-category link. The PDP then shows an explicit fitment list: "Fits: 2019 F-150 5.5' Bed Crew Cab."

**Pro:** Great SEO (thousands of static generation pages), no form friction, clear mental model for enthusiasts who know their truck.
**Con:** Doesn't scale to generic/universal parts; heavy URL scaffolding required; casual shoppers miss the nuance.

## Specific Observations on Fitment-Critical Dimensions

- **Bed length (tonneau, bed covers, bed liners, bed racks):** Only RealTruck elevates this to the primary selector. Everyone else pushes it to a PDP variant dropdown or category filter. The RealTruck approach produces the lowest return rates in the category per industry commentary.
- **Cab type (running boards, side steps, floor mats):** Universally handled as a PDP variant dropdown or filter. Nobody puts cab type in the primary selector.
- **Trim level (Civic EX vs Si, F-150 Raptor vs XL):** Nobody collects "trim" as a named field. Parts-oriented sites (RockAuto, AutoZone) use **engine** as the proxy (the Raptor has a different engine, which resolves the ambiguity). Accessory-oriented sites (RealTruck, 4WP, Tyger) don't disambiguate at all — they list fitment manually on the PDP.
- **Engine:** Required by RockAuto, AutoZone, Advance (maintenance-parts business model). Optional everywhere else.

## Fit-Confirmation Copy on PDPs

- RealTruck: "Guaranteed Fit" badge + "Fits your 2019 Ford F-150 5.5' Bed" (echoes all 4 selector fields)
- RockAuto: no explicit copy — the catalog tree is pre-filtered to the selected YMME
- AutoZone: "Fits your [Year Make Model Engine]" green checkmark
- 4 Wheel Parts: "Guaranteed Fit" badge + "Fits your [YMM]"
- Summit Racing: "Check the Fit" neutral CTA (does NOT assert fit until user opens Applications tab)
- Advance Auto: "Fits your vehicle" with fine-print disclaimer that only VIN is 100% accurate
- AmericanTrucks: bulleted fitment list ("Fits: 2021-2026 F-150 2.7L / 3.5L EcoBoost") shown statically on the PDP regardless of selected vehicle

## Recommendation — Three Most Proven Patterns, Ranked

For Stehlen Auto (fitment-critical accessories: grilles, bumpers, tonneaus, running boards, hitches — 49% of catalog is fitment-specific), the three most proven patterns are:

1. **RealTruck's conditional 4th field (RECOMMENDED)** — Keep the primary selector at YMM for browsing and universal products. When a user lands on a PDP in a fitment-critical category (tonneau, bed cover, running board, bed liner), the selector expands inline to require the 4th field (bed length or cab type). The extra field is category-scoped, not global, so 51% of traffic never sees it. The garage stores YMM by default and upgrades to YMM + sub-model once the user has answered it on any PDP — so the friction is paid once per shopper, not once per visit. RealTruck's category-level return rates are the benchmark for the industry; this is the most proven pattern for fitment-critical DTC.

2. **AmericanTrucks' navigation-based generation pages** — Good for SEO and enthusiasts, but requires hundreds of static landing pages and doesn't handle universal products. Best as a complement to Pattern 1, not a replacement.

3. **Summit Racing's PDP "Applications" tab** — Lowest friction but highest return-rate risk. Summit's own customer reviews explicitly cite mis-fit parts caused by the buried tab. Not recommended for a brand building trust in Year 1.

**Do not copy:** RockAuto/AutoZone's "always require engine" model. That's a maintenance-parts pattern and doesn't fit an accessories catalog where 51% of products are universal.

### Concrete Implementation Sketch for Stehlen

- **Primary garage:** Year / Make / Model only (3 fields, current state)
- **Sub-model metafield:** Populate `sub_model.bed_length`, `sub_model.cab_type`, `sub_model.finish` on the 91 clusters already identified in `data/analytics/product_clusters.json`
- **Category page:** Adds a 4th filter chip ("Bed Length: 5.5 ft / 6.5 ft / 8 ft") only when the active category contains products with that dimension. Filter chip is pre-selected if the garage already has the value; otherwise it is a visual nudge, not a hard gate.
- **PDP:** Variant selector becomes mandatory before "Add to Cart" for fitment-critical clusters. On successful selection, write the value back to the user's garage so they never see it again for that vehicle.
- **Fit copy:** "Fits your 2019 Ford F-150 — 5.5 ft bed" (echo all resolved dimensions, match RealTruck)

## Sources

- [RealTruck Tonneau Covers category](https://realtruck.com/c/exterior-accessories/tonneau-covers/)
- [RealTruck — How to Measure Your Truck Bed](https://realtruck.com/blog/how-to-measure-your-truck-bed/)
- [Summit Racing — Will this part fit my vehicle?](https://help.summitracing.com/knowledgebase/article/SR-04958/en-us)
- [Summit Racing Equipment reviews (Trustpilot)](https://www.trustpilot.com/review/summitracing.com)
- [Summit Racing Vehicle Make/Model search](https://www.summitracing.com/makes)
- [RockAuto homepage & catalog](https://www.rockauto.com/)
- [RockAuto — Help with Finding Parts for Your Vehicle](https://www.rockauto.com/help/?page=1)
- [AutoZone Shop by Make](https://www.autozone.com/shopbymake)
- [AutoZone VIN Decoder](https://www.autozone.com/vin-decoder)
- [O'Reilly Auto Parts VIN Lookup](https://www.oreillyauto.com/vin-lookup)
- [Advance Auto Parts homepage](https://shop.advanceautoparts.com/)
- [Advance Auto Parts — Find by Make & Model](https://shop.advanceautoparts.com/find/all-makes)
- [4 Wheel Parts — Vehicle Models](https://www.4wheelparts.com/vehicle-models)
- [AmericanTrucks homepage](https://www.americantrucks.com/)
- [AmericanTrucks — 2021-2026 F-150](https://www.americantrucks.com/ram-parts-2019.html)
- [PartCatalog](https://www.partcatalog.com/)
- [Tyger Auto — Tonneau Cover Compatibility Guide](https://www.tygerauto.com/blog/tonneau-cover-compatibility-guide-for-ford-chevy-ram-and-toyota.html)
- [Tyger Auto homepage](https://www.tygerauto.com/)
- [TascaParts — Part Compatibility, Fitment, Availability](https://www.tascaparts.com/part-compatibility-part-fitment-and-part-availability)
- [Web Shop Manager — YMM Fitment Verification for Aftermarket eCommerce](https://webshopmanager.com/year-make-model-lookup/)
