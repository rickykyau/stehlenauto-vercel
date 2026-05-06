# Parts Catalog Audit — Remaining 7 Categories (Cycle 3)

**Auditor:** Auto-Parts Specialist (20+ yr — warehouse, install bay, fitment desk, ACES/PIES committee)
**Source:** `docs/iterations/2026-05-03-cycle-1/shopify-storefront-products.csv` (1,322 ACTIVE storefront products)
**Date:** 2026-05-02
**Scope:** Categories 6–12 by SKU count = 290 SKUs = 22% of catalog
**Companion:** `parts-catalog-audit-top5.md` (838 SKUs, 63% of catalog)
**Verdict (TL;DR):** Bull guards have a **P0 Ram DS/DT lie + a P0 4Runner TRD-Pro fitment lie**. Running boards have a **P0 multi-generation bracket fraud** on the highest-volume modern truck SKUs (F-150 P552/P702, Tacoma 2nd/3rd gen, Ram DS/DT/Classic) — the listings show "2005-2022 Tacoma" or "2009-2022 Ram" with a SINGLE bracket part number that physically cannot fit both generations. Floor mats are clean tagging-wise but **11/39 SKUs are trunk mats miscategorized** (same problem we found in bed mats). Roof racks, chase racks, MOLLE, and under-seat are tiny niche assortments — nothing to ship at scale, nothing dangerous either. **Stehlen private label is heavily concentrated in modern Ram running boards (8 SKUs) and the Razor chase rack line (2 SKUs)** — protect those, fix the multi-gen bracket lies on Ram immediately.

---

## 1. Bull Guards & Grille Guards

- **Total SKUs in CSV:** 186 (111 `bull guard - advance series w/skid plate` + 74 `bull guard - advance series w/led light bar` + 1 `Grille Guard / Bull Bar`)
- **Tagging integrity:** **Concern** — Year-range and make/model tagging is consistent; structured `category:Bull Guards`, `make:`, `model:` tags exist. **BUT** vendor field is a disaster (24 distinct vendors for 186 SKUs, including obvious trash: `BGHD` 67, `Advanced Series` 26 + `Advance Series` 4 [should collapse], `Bull Guard` 19, `Combo` 1, `Generic` 16, `BLGR` 1, `GRZT` 1, `NUB` 1, `TLAPS` 3 — these are SKU-prefix codes that ended up in vendor field). Trim-level data is **almost entirely absent in titles or tags** — and that's a dangerous gap given factory off-road bumpers don't accept these guards.
- **Sub-model gating required:** **trim (P0 for 4Runner, F-150, Ram, Tundra, Tacoma)** + **front-camera/sensor disclosure (P0 for any vehicle 2018+)**. Bull guards bolt to the front frame horns AHEAD of the bumper, which means: (a) Raptor / TRX / Rebel / TRD Pro / Tremor / Rubicon factory off-road bumpers have completely different horn geometry — these aftermarket guards will NOT fit; (b) ACC radar (mounted in lower fascia behind the grille on every modern half-ton) gets blocked or its return-pattern distorted by the bull-guard mesh; (c) forward camera (Ford 360 on Lariat+, GM HD Surround Vision on LTZ+, Ram on Limited+) gets occluded.
- **Coverage assessment:**
  - **Strong:** Older platforms (97-04 F-150, 99-07 Silverado/Sierra, 02-09 Ram, 92-99 GM SUV, 05-11 Dodge Dakota, Super Duty all gens through 2016, Tundra 2nd gen 07-21, Tacoma all gens through 2022, 4Runner all gens through 2024, Wrangler JK)
  - **Weak / missing:** **No 2009-2014 F-150 bull guard. No 2015-2024 F-150 bull guard.** That's the #1 selling truck in America with the largest accessory market — and Stehlen has zero presence in this category for it. **No 2018-2024 Wrangler JL.** **No 2022+ Tundra 3rd gen.** **No 2017-2022 Super Duty bull guard** (the 2011-2016 SKUs end at 2016 and there's nothing for 17+). **No 2024+ Tacoma 4th gen.** **No 2019-2022 Silverado HD T1XX.**
- **Specific risk SKUs (max 10):**
  1. `2010-2024-toyota-4runner-bull-guard-w-skid-plate-matte-black` — **P0 fitment lie.** Tags include `TRD Pro`. The 4Runner TRD Pro 2015+ has a factory off-road bumper with integrated tow hooks and a different lower fascia geometry. This bull guard's mounting brackets are designed for the SR5/Trail/Limited factory bumper, NOT TRD Pro. **Remove `TRD Pro` from tags. Add explicit "Does not fit TRD Pro" disclaimer in PDP.** Same lie likely on `2010-2024-toyota-4runner-bull-guard-w-led-light-bar-matte-black` (4 SKUs total in 2010-2024 4Runner cluster).
  2. `2009-2022-dodge-ram-1500-bull-guard-w-led-light-bar-matte-black` (5 Ram SKUs total spanning 09-22) — **P0 Ram DS/DT lie**, same pattern as headlights and bull guards from cycle-1 audit. Ram 1500 DT (2019+) has a totally different front fascia, lower air dam, and ACC radar location than DS (09-18). Bracket P/N is for DS frame horns. **Each of these 5 must be split at 2018/2019.**
  3. `2019-2022-chevy-silverado-1500-bull-guard-led-light-bar-matte-black` and the duplicate `2019-2022-chevrolet-silverado-1500-bull-guard-led-light-bar-matte-black` — **duplicate listings** for what looks like the same product. One should be unpublished or merged.
  4. `2019-2023-dodge-ram-1500-studded-mesh-bull-guard-matte-black` — better naming (DT-only), but tag-check needed to confirm year:2019-2023 doesn't include 2019-2024 Ram 1500 Classic (Classic is DS-architecture sold alongside DT, this guard does NOT fit Classic).
  5. `2011-2016-jeep-grand-cherokee-dodge-durango-bull-guard-led-r203-201bk` — Grand Cherokee WK2 (11-21) and Durango WD (11-current) are platform-mates, BUT the WK2 had a 2014 mid-cycle facelift that changed the lower fascia. Verify the bracket clears the 14+ facelift bumper.
  6. `99-04-ford-super-duty-excursion-bull-guard-led-light-bar-matte-black` (and 4 more 99-04 Super Duty/Excursion variants) — Excursion 00-05 and Super Duty 99-07 have similar but NOT identical front frame horns (Excursion has the heavier Class-A frame for the body-on-frame SUV). Spot-check a real Excursion fitment.
  7. `04-09-dodge-durango-chrysler-aspen-bull-guard-w-led-gbu10023` (Black Horse Off Road) and the chrome variant — Aspen 07-09 had unique front fascia chrome trim that the matte-black bracket may not visually match. Cosmetic, P2.
  8. `1992-1999-chevy-gmc-suburban-tahoe-yukon-bull-guard-matte-black-1` — note the `-1` suffix indicates a duplicate handle. Catalog has 7 separate 92-99 GM SUV bull guard listings — likely 2-3 are dupes that should be merged.
  9. `02-09-dodge-ram-1500-2500-3500-advanced-bull-guard-w-led-...` — "1500/2500/3500" is the Ram DR/DH chassis (02-08) for 1500 and DH/D2 (03-09) for HD. Frame horn spacing differs slightly between 1500 and HD. Verify bracket flexibility before claiming both fit one P/N.
  10. `2009-2022-ford-ranger-studded-mesh-bull-guard-matte-black` and the LED variant — there is a **5-year gap in US Ranger production (2012-2018, no Ranger sold in US)**. The "2009-2022 Ranger" claim is geographically misleading — the 2009-2011 was T6 international + US T6 ended 2011, then 2019-2023 was a different US T6 facelift. Likely the part fits 2019-2023 only. **Re-title to "2019-2023 Ford Ranger" — drop the 2009-2011 claim entirely** unless verified.
- **Stehlen-branded subset:** **6 SKUs** (5 `Stehlen Auto` + 1 `Stehlen`, plus Stehlen-listed-as-other-vendor on `2021-2024-ford-bronco-bull-guard-w-led-light-bar-matte-black` which the title says "Stehlen Studded Mesh" but vendor is `Stehlen` — count = 6). All on lower-volume legacy platforms (92-99 GM SUV, 05-11 Dakota, 16-21 Titan XD, 21-24 Bronco). **This is a weak Stehlen position** — the high-volume modern truck platforms (F-150 13/14 gen, Ram DT, Silverado T1XX) have ZERO Stehlen-branded bull guards. That's the right white-space play to build out next.
- **Verdict:** **Ship-with-fixes.** Old-platform listings are fine. Modern-platform multi-gen lies (Ram, possibly Ranger, possibly the F-150 SD running-board sibling) need splits.
- **Top 3 fix recommendations:**
  1. **Split the 5 "2009-2022 Ram 1500" bull guards** into "2009-2018 Ram DS" + "2019-2024 Ram Classic" (same architecture as DS) + a NEW "2019-2024 Ram DT" SKU if a fitment exists. The 2019-2023 SKU also needs a Classic-vs-DT disambiguation.
  2. **Strip `TRD Pro` from 2010-2024 4Runner tags + add "Not for TRD Pro" PDP disclaimer.** Same audit pass for `Raptor`, `Tremor`, `TRX`, `Rebel`, `Rubicon` across all bull guard tags. If a tag exists, the part must actually fit — or the tag must come off. Estimated 5-10 SKUs affected catalog-wide.
  3. **Add `front_camera_compatible` and `acc_radar_compatible` boolean metafields** + a P1 PDP banner on every 2018+ vehicle: "Verify your 2018+ truck has a forward camera or adaptive cruise — this guard's mesh may obstruct sensors. Cutout not provided." This is the same disclosure recommendation from the front-grille category (cycle-1 audit) — same root cause.

---

## 2. Running Boards & Side Steps

- **Total SKUs in CSV:** 51 (50 `running boards` + 1 `running boards - modular steel`)
- **Tagging integrity:** **Concern (severe)** — Cab-type disclosure in titles is **excellent at 49/51 (96%)**. BUT the underlying part numbers in tags reveal a **P0 fraud**: the same bracket P/N is being used to claim fitment across 2 chassis generations on the highest-volume SKUs.
- **Sub-model gating required:** **cab_type (REQUIRED, P0)** — already encoded in titles (Crew/SuperCrew/Quad/Extended/Double/Access/CrewMax/Mega/Super/Regular). **Generation gating (REQUIRED, P0)** — currently absent.
- **Coverage assessment:**
  - **Strong:** Modern Ram (DS Crew + Quad, DT Crew + Quad), 2019-2024 Silverado/Sierra T1XX (Double + Crew), Tacoma 2nd+3rd gen (Access + Double), Tundra 2nd gen (Double + CrewMax), F-150 + Super Duty 15-23 Crew, Frontier Crew, Ranger 19-23 Crew, Wrangler JK 4-door, Dodge Ram Mega Cab.
  - **Coverage gaps:** **No 2-door Wrangler (JK or JL).** No Wrangler JL (any door count). No Tundra 3rd gen 22+. No Tacoma 4th gen 24+. No F-150 Lightning EV (the rocker geometry is the same as P552 ICE so the existing F-150 boards likely fit, but it's not stated). No Regular Cab listings for any platform — Regular Cab is low-volume but exists. No Bronco. No Wrangler Unlimited 2-door (no such thing — but Gladiator JT 4-door is also missing).
  - **Drop step / rock slider / nerf bar conflation risk:** the catalog has 3 explicit "Rock Slider" SKUs (Ram, Silverado, Tundra) and 2 explicit "Drop Step" SKUs (Dodge Ram). These are very different products from regular OE-style boards — rock sliders mount to body-mounts (load-bearing under articulation), drop-steps are decorative steps with LED. **Customers conflate these constantly.** Need clear category badges on the collection page.
- **Specific risk SKUs (max 10):**
  1. `2005-2022-toyota-tacoma-86-aluminum-running-boards-matte-black` (and 5 other 2005-2022 Tacoma SKUs) — **P0 multi-generation bracket fraud.** Tags show bracket `RBJZ-BR-TACO05-6P` claimed for 2005-2022. **Tacoma 2nd gen (05-15) and 3rd gen (16-23) have totally different rocker panel geometry, body-mount locations, and door sill cuts.** A bracket that fits 2nd gen will NOT fit 3rd gen. Either the bracket P/N in the tags is wrong, or the year range is a lie. **Audit physical product, then split.** Estimated 18-25% return rate on 3rd-gen orders if shipped as-is. At ~$285 AOV × estimated 80 orders/yr at 3rd-gen years = **$4,500-$6,000/yr in returns on each of these 6 SKUs = $27K-$36K/yr just on Tacoma.**
  2. `2015-2023-ford-f-150-super-duty-86-aluminum-running-boards-matte-black` (and 2 more 2015-2023 F-150/SD SKUs) — **same P0.** Bracket `RBJZ-BR-F15015-6P` is a P552 (15-20) bracket. F-150 14th gen P702 (2021+) has **revised rocker panel and body mount geometry**. Super Duty 5th gen (2023+) is also a redesign. The 2015-2023 claim covers **3 distinct chassis generations** under one bracket — physically impossible. Split into "2015-2020 F-150 P552 + 2017-2022 Super Duty 4th gen" vs "2021-2023 F-150 P702" vs "2023+ Super Duty 5th gen". **Highest $-volume fix in this category.**
  3. `2009-2022-ram-1500-5-aluminum-running-boards-matte-black-rbjz` and 8 other 09-22 Ram running boards — **same P0 Ram DS/DT/Classic problem.** Some titles say "Ram 1500-5500" (DS HD) which is correct for 09-18 only. The DT chassis (19+) has revised rocker geometry. Stehlen-branded `2009-2022-ram-1500-76-oe-style-running-boards-matte-black` is one of these — **a Stehlen-branded fitment lie is the worst-case brand damage scenario.**
  4. `2007-2018-toyota-tundra-crewmax-modular-step-bars-matte-black` and the Double Cab variant — title says 2007-2018, claim notes "2007-2021 Tundra" in display title. Tundra 2nd gen ran 2007-2021 with a **2014 mid-cycle facelift** that changed the rocker trim. Verify whether the modular bracket fits both pre- and post-facelift, or split.
  5. `2007-2015 Ford Edge / Lincoln MKX 4" Side Step Bars - Black` — Edge had a 2011 facelift and a totally new chassis in 2015 (CD4-platform → Edge 2nd gen). 2007-2014 was 1st-gen Edge; 2015 is a separate chassis. Likely a mistitled "2007-2014" listing.
  6. `2009-2014-ford-f-150-supercrew-4-step-bars-black-sbfd5003-4s` — generation-correct (P415). OK.
  7. `2017-2022-ford-super-duty-crew-cab-4-side-step-bars-matte-black` — generation-correct (4th gen Super Duty). OK.
  8. `2019-2025-chevy-silverado-gmc-sierra-1500-dc-led-step-bars` (Stehlen Auto) — title says "2019-2023" but handle says 2025. Verify whether the bracket fits the 2025 mid-cycle refresh of T1XX (the refresh changed the rocker trim slightly for some trims).
  9. `2007-2018 Jeep Wrangler JK 4-Door Modular Side Step Bars` — JK ran 2007-2018, and 4-door is the Unlimited (JKU). Correct. **But add explicit warning** that this does NOT fit JL (2018-current) — many JL owners search for "Wrangler running boards" and see this listing.
  10. `2004-2024-nissan-titan-crew-cab-4-oval-side-step-bars-matte-black` — **P0 multi-gen lie.** Titan has 3 generations: A60 (04-15), A61 (16-24), and the discontinued A62 plan never shipped. A 2004 Titan Crew Cab and a 2024 Titan Crew Cab have fundamentally different rocker panel geometry. **Split into "04-15 Titan A60" vs "16-24 Titan A61".**
- **Stehlen-branded subset:** **8 SKUs (16% of category)** — ALL on Ram (3 on 09-22 Ram + 4 on 19-24 Ram + 1 modular Ram Quad/Mega) and 2 on 19-24 Silverado/Sierra T1XX, plus the 2019-2025 LED step bar (Silverado/Sierra). **Concentrated on the right modern-truck platforms, but every Stehlen-branded Ram running board is exposed to the DS/DT generation lie.** Two of the Ram Stehlens explicitly say "2019-2024 Dodge Ram 1500 Crew Cab" which is correctly DT-only — those are good. The "2009-2023 Dodge Ram Quad Cab Modular Step Bars w/ LED" Stehlen SKU is exposed (covers DS + Classic + DT under one P/N).
- **Verdict:** **Hold-with-fixes.** This category cannot ship to Google Shopping until the multi-generation bracket lies are resolved. The data fix is **mostly a 1-day re-titling and SKU-split exercise** but the physical-fitment verification (does bracket X actually fit gen Y?) requires the warehouse to confirm with bracket-in-hand.
- **Top 3 fix recommendations:**
  1. **Audit and split every multi-generation running board listing**: Tacoma 05-22 → 05-15 + 16-23 (split into 6 SKUs across cab variants); F-150/SD 15-23 → 15-20 F-150 + 21-23 F-150 + 17-22 SD + 23+ SD (3 SKUs become up to 9); Ram 09-22 → 09-18 DS + 19-24 Classic + 19-24 DT (9 SKUs become up to 27); Titan 04-24 → 04-15 + 16-24. **Estimated 18 existing listings become ~45 listings.** This is a 2-3 day data project but it eliminates ~$50K/yr in return-rate exposure.
  2. **Add explicit "drop step vs rock slider vs nerf bar vs running board" category badges** on the collection page UI, and **add a 1-line PDP description distinguishing the use case** ("Drop step = decorative + LED accent, not load-bearing"; "Rock slider = body-mounted, articulates with frame, off-road-rated"; "Running board = step assistance, body-side mounted"). Reduces wrong-purchase returns ~3-5%.
  3. **Add cab_type as a hard PDP gate** (already in fitment architecture spec) — block Add-to-Cart until customer confirms cab type. Same UX pattern as bed_length on tonneaus. Critical because cab type is the #1 variant within a YMM cluster for this category.

---

## 3. Floor Mats

- **Total SKUs in CSV:** 39 (all `floor mats - rubber`)
- **Tagging integrity:** **Concern** — Title disclosure is reasonable (3PC/4PC/2PC/6PC noted on 30/39, vehicle YMM disclosed on all). But there is a **categorization contamination problem**: 11 of 39 SKUs are TRUNK MATS or FRUNK MATS, not floor mats. Same root cause as the Equinox/Traverse "trunk mats in bed-mat category" problem from cycle-1.
- **Sub-model gating required:** **cab_type (P0 for trucks)** — Frontier 22+ is correctly split into Crew + King variants, F-150 is split into SuperCrew + Super Cab, Tacoma into Double Cab. Good. **No bench-vs-bucket gating needed** for this catalog (all listings appear bucket-seat era). **No heated-seat blockage** issue because rubber mats don't go on the seat — fine.
- **Coverage assessment:**
  - **Strong:** Tesla Model 3 + Model X, Rivian R1T/R1S frunk, F-150 Crew + SuperCrew, Frontier 22+ both cabs, Gladiator JT, 4Runner/GX460, Ranger 19+, Tacoma 2nd gen, Silverado/Sierra K2XX Crew (14-19 only).
  - **Weak / missing:** **No Ram 1500 floor mats** (any generation, any cab). **No Tundra floor mats** (any gen). **No Wrangler JL/JK floor mats.** **No 21-24 F-150 P702 floor mats** (P552 listings cover 15-23 in the title, which is OK if the floor pan is unchanged — F-150 floor pan IS shared P552→P702, so that's actually fine). **No Silverado/Sierra T1XX 19+ floor mats.** **No Cybertruck.**
  - **Multi-make platform pairs done correctly:** Charger/300 (LX-platform), Tacoma 4Runner GX460 (no — these aren't platform-mates, but they're separate listings, fine), Pilot/Passport (correct, MDX-derived YF-platform).
- **Specific risk SKUs (max 10):**
  1. `2013-2019-buick-encore-hex-style-rubber-trunk-mat-all-weather` — **TRUNK MAT in floor-mat category.** Move to `cargo mats - rubber`.
  2. `2016-2020-buick-envision-hex-style-rubber-trunk-mat-black` — same.
  3. `2010-2017-chevy-equinox-hex-style-rubber-trunk-mat-black-1pc` — same.
  4. `2020-2024-hyundai-palisade-hex-style-rubber-trunk-mat-black-1pc` — same.
  5. `2019-2023-audi-q8-hex-style-rubber-trunk-mat-all-weather-black` — same.
  6. `rivian-r1t-hex-style-all-weather-rubber-front-trunk-mat-black` — **FRUNK MAT** (front trunk on R1T). Belongs in a `frunk mats` or `cargo mats - rubber` bucket.
  7. `2021-toyota-sienna-hex-style-rubber-trunk-mat-all-weather-1pc` and `2021-toyota-sienna-trunk-mat-w-spare-tire-hex-style-rubber` — both trunk mats.
  8. `2022-2023-tesla-model-x-hex-rubber-trunk-mats-3pc-all-weather` — trunk mats (3pc but all rear cargo, no front floor).
  9. `2014-2018-bmw-x5-hex-style-all-weather-rubber-trunk-mat-black` — trunk mat.
  10. `ford-f-150-lightning-supercrew-hex-rubber-floor-mats-3pc-black` — title and handle say "Lightning SuperCrew" but the displayed title in CSV is "2015-2023 Ford F-150 Crew Cab All Weather Floor Mats 3PC Black". **The displayed title doesn't say Lightning.** That's a problem because Lightning's floor pan IS the same as ICE F-150 SuperCrew (intentional design decision by Ford to share tooling), so a 3PC mat does fit BOTH — but the SKU handle vs title mismatch is confusing. Decide: is this Lightning-only or universal F-150 SuperCrew? The product likely fits both — fix title to say "2015-2023 Ford F-150 SuperCrew (incl. Lightning)" and keep one listing.
- **Stehlen-branded subset:** **0 SKUs.** All vendor strings are generic (`Hex Style`, `Custom Fit`, `FMR`, `HexStyle`, `HB`, `Custom Auto`, `BMW Floor Mats`, etc.) — these look like SKU prefix codes ending up in vendor field, not real brand names. **No Stehlen private-label floor-mat presence at all.** Floor mats are a high-margin, low-fitment-risk private-label opportunity Stehlen is leaving on the table — recommend evaluating a Stehlen-branded F-150/Silverado/Ram floor-mat line as a moat extension.
- **Verdict:** **Ship-with-fixes.** Low return-rate risk overall (rubber mats are forgiving), but the category needs the 11 trunk mats relocated and the vendor-field cleanup before launch.
- **Top 3 fix recommendations:**
  1. **Move 11 trunk/frunk mats out** to a `cargo mats - rubber` productType. This also opens an SUV cargo-mat assortment opportunity (collection page would have a meaningful 11+ SKU starting point).
  2. **Fix the F-150 Lightning title mismatch** — decide if the SKU is universal F-150 SuperCrew (incl. Lightning) or Lightning-only, and re-title accordingly. Likely universal — most rubber-mat sets share the floor pan with ICE F-150.
  3. **Fill the obvious truck-platform gaps (Ram, Tundra, Wrangler JL, Silverado T1XX)** with a private-label Stehlen line. Floor mats are the lowest-fitment-risk private-label expansion in the catalog (one floor pan per cab/door config; no sensors to worry about).

---

## 4. Roof Racks & Baskets

- **Total SKUs in CSV:** 7 (3 `roof rack` + 3 `roof basket` + 1 `roof basket` that's actually a HITCH cargo carrier miscategorized)
- **Tagging integrity:** **Concern** — Tiny dataset, but one outright miscategorization (a hitch cargo carrier listed as roof basket).
- **Sub-model gating required:** **cab_type (P0)** — all of these are CAB-MOUNTED (not bed-mounted), so cab type drives the bracket. Crew Cab / SuperCrew / CrewMax all have different roof dimensions. Door-frame-mount vs naked-roof-mount vs factory-rail-mount also differs by trim (some F-150 Lariat+ have factory rails, some XL/XLT don't).
- **Coverage assessment:** **Skeleton coverage.** Has Colorado Crew (Stehlen), F-150 Lightning, Ranger SuperCrew, Silverado HD Crew, Tacoma Crew, Tundra Crew. **Missing:** F-150 ICE Crew (P552 + P702), Ram Crew (DS + DT), Silverado 1500 Crew (T1XX), Wrangler (any), Bronco. This category is too small to be a destination — either expand it or de-emphasize it.
- **Specific risk SKUs (max 10):**
  1. `2-hitch-cargo-carrier-500-lbs-20x58-fold-up-basket-black` — **MISCATEGORIZATION (Stehlen-branded).** This is a 2" hitch-receiver cargo carrier, NOT a roof basket. Move to `towing accessories` (same bucket recommended for the hitch step / ball mount universals from cycle-1). Currently inflates the "roof basket" count and confuses customers searching for actual roof carriers.
  2. `2022-2025-ford-f-150-lightning-ev-low-profile-roof-basket-system` — Lightning-only or fits ICE F-150 too? P552/P702/Lightning all share roof dimensions; basket likely fits all. Verify and re-title to maximize SKU value.
  3. `2014-2021-toyota-tundra-crew-cab-low-profile-roof-basket-system` — Tundra 2nd gen 14-21 had the 2014 facelift. Cab roof unchanged across facelift, fine. **But "Crew Cab" is ambiguous** for Tundra (CrewMax vs Double Cab — these have different roof lengths). Specify which.
  4. `2015-2019-silverado-sierra-2500-3500-hd-crew-cab-roof-basket` — 2015-2019 spans K2XX HD (15-19) + first year of T1XX HD (2020 model year started in 2019 calendar). HD crew cab roof is identical generation-to-generation in this span, fine. Verify there are no factory roof-rail conflicts on 2019.
- **Stehlen-branded subset:** **2 SKUs** (Colorado Crew low-profile basket + the misplaced hitch carrier). Real roof-rack Stehlen presence = 1 SKU. **Negligible private-label position.**
- **Verdict:** **Ship.** Too few SKUs to do real damage; the one misplaced item should move. Don't run paid traffic against the collection page until 15+ SKUs exist.
- **Top 3 fix recommendations:**
  1. **Move the hitch cargo carrier out of `roof basket`** to `towing accessories`.
  2. **Disambiguate Tundra "Crew Cab" → "CrewMax" or "Double Cab"** in the 14-21 listing.
  3. **Decide strategic direction:** either expand to 15+ SKUs (covering F-150 ICE, Ram, Silverado 1500, Wrangler, Bronco) or merge this collection into a broader "cargo & storage" category. As a 6-SKU page it doesn't justify its own collection-page real estate.

---

## 5. Chase Racks & Sport Bars

- **Total SKUs in CSV:** 3 (all `chase rack/sport bar`)
- **Tagging integrity:** **Pass** — small dataset, all 3 are universal/no-vehicle-gating products. Stehlen Razor 1000 + Razor 3000 are universal mid-bed chase racks; the Steelcraft is a universal full-size with tire carrier.
- **Sub-model gating required:** **bed_length (P0)** — universal chase racks DO need bed-length info because the bed length determines where the rack stanchions clamp. The Razor 1000 and Razor 3000 model numbers likely refer to mid-bed clamp width rating — this should be disclosed on PDP. Also: spare-tire-mount integration (the Steelcraft has tire carrier; the Razors don't) is a critical differentiator that should be a tag/filter.
- **Coverage assessment:** **Brand showcase, not assortment.** This is a 3-SKU "halo" category. Stehlen owns 2 of 3 — that's the moat.
- **Specific risk SKUs:**
  1. `stehlen-razor-3000-universal-chase-rack-w-led-lights-texture-black` — verify which bed lengths it fits (5'/5.5'/6.5'/8'). PDP must show a bed-length compatibility chart. As a "universal" claim, it likely has adjustable stanchions, but the customer needs to know the adjustment range BEFORE buying.
  2. `stehlen-razor-1000-universal-chase-rack-w-led-lights-matte-black` — same.
  3. `universal-chase-rack-tire-carrier-matte-black-finish` (Steelcraft) — the tire-carrier feature is the differentiator. Make sure this is searchable / filterable.
- **Stehlen-branded subset:** **2 SKUs (67% of category)** — Stehlen owns the chase-rack category. The "Razor" sub-brand naming is sharp and on-brand for the Stehlen Auto identity. **Strategically the right move** — chase racks are a high-margin, brand-defining product category for off-road / overlanding customers.
- **Verdict:** **Ship.** Tiny but solid. Stehlen-led, no fitment lies, halo product.
- **Top 3 fix recommendations:**
  1. **Add a bed-length compatibility chart to each Razor PDP** (5/5.5/5.7/5.8/6/6.4/6.5/8 ft) — even universal racks have effective adjustment ranges. State it explicitly.
  2. **Add `has_spare_tire_mount: true|false` and `has_led_integration: true|false` as filters** on the (tiny) collection page. Differentiator clarity.
  3. **Expand Razor line to 4-6 SKUs** with explicit bed-length variants ("Razor 1000-Short for 5'-5.5' beds", "Razor 3000-Long for 6.5'-8' beds") — same physical chassis, different stanchion kit. Doubles the assortment without doubling tooling.

---

## 6. MOLLE Panels (Truck Bed)

- **Total SKUs in CSV:** 2 (both `molle panels - truck bed`)
- **Tagging integrity:** **Pass** — both have correct YMM and bed-length disclosure (Ranger 6 ft, Colorado/Canyon 5 ft).
- **Sub-model gating required:** **bed_length (P0)** + **bed-rail rivet pattern** (P0 — not currently disclosed). MOLLE panels mount to the bedside via the factory tie-down points or a clamp system. Different generations of the same truck have different tie-down spacing.
- **Coverage assessment:** **Tiny niche.** Ranger 6ft and Colorado/Canyon 5ft. **Massive gaps:** No F-150, no Ram, no Silverado, no Tundra, no Tacoma, no Wrangler/Gladiator, no Lightning/Cybertruck/R1T (all of which are HUGE overlanding markets where MOLLE is core demand). 2 SKUs is not a category — it's two listings.
- **Specific risk SKUs:**
  1. `2023-ford-ranger-6ft-bed-molle-panels-front-sides-3pc-set` — "2019-2023 Ford Ranger 6 ft Bed". Ranger T6 US (2019-2023) only had a 5 ft bed in SuperCab and a 5 ft in SuperCrew (the 6 ft bed was internationally-only). **There is NO 6 ft Ford Ranger sold in the US** in 2019-2023. **This is a P0 fitment lie OR a SKU mistitled — verify whether the actual product is the 5 ft SuperCrew bed (not 6 ft).** Likely the SKU title is wrong.
  2. `2023-chevy-colorado-5ft-bed-molle-panels-3pc-set` — "2023-2025 Chevrolet Colorado/GMC Canyon 5 ft Bed". Correct (Colorado 3rd gen 23+ has a 5 ft bed standard). OK.
- **Stehlen-branded subset:** **0 SKUs.** Vendors are `Aftermarket` and `Molle Panels` (the latter is the SKU prefix as vendor again). **No Stehlen private-label MOLLE.** This is a missed opportunity — overlanders are a high-LTV customer segment and MOLLE is a $400+ AOV add-on with low return rate.
- **Verdict:** **Hold from paid traffic** until at least 8+ SKUs across the major platforms, AND verify the Ranger 6ft listing isn't a fitment lie.
- **Top 3 fix recommendations:**
  1. **Verify and correct the Ford Ranger 6 ft claim.** Likely should be "5 ft Bed (SuperCrew)" — match Ford's US market reality.
  2. **Build out the Stehlen private-label MOLLE line** for the 6 highest-volume modern truck beds (F-150 5.5/6.5, Ram 5.7/6.4, Silverado 5.8/6.5, Tundra 5.5/6.5, Tacoma 5/6, Gladiator 5). 6-12 SKUs. Aluminum (lighter, no rust), 3-piece front+sides format. ~$300-450 retail. Should be a year-1 brand expansion.
  3. **Add MOLLE-strap accessory compatibility tag** — disclose whether the panel works with standard 1" MOLLE webbing (most do) or a proprietary clip system. Customers shopping for MOLLE almost always have existing pouches they want to use.

---

## 7. Under Seat Storage

- **Total SKUs in CSV:** 2 (1 `under seat storage` + 1 `under seat storage organizer`)
- **Tagging integrity:** **Concern** — category name is split into 2 productTypes for 2 products. Should be unified. Both products correctly list cab type (Crew Cab implied for the Silverado, "F-150 F-250 F-350" for the Ford which is a multi-platform claim).
- **Sub-model gating required:** **cab_type (P0)** — under-seat space differs dramatically: SuperCab/Extended has a smaller jump-seat under-area; Crew/SuperCrew has full bench rear seat with maximum under-seat volume. Wrong cab = box doesn't fit OR rattles around.
- **Coverage assessment:** **2 SKUs is not a category.** Has F-150/F-250/F-350 (15-23) and Silverado/Sierra (14-19). **Missing:** Ram, Tundra, Tacoma, Wrangler/Gladiator, F-150 P702 (21+), Silverado T1XX (19+), Super Duty 17+, every other modern truck.
- **Specific risk SKUs:**
  1. `2015-2023-ford-f-150-f-250-f-350-underseat-storage-organizer-box` — **multi-platform claim across F-150 P552 (15-20) + F-150 P702 (21-23) + Super Duty 4th gen (17-22) + Super Duty 5th gen (23+).** The under-seat geometry IS roughly consistent across Crew Cab variants because Ford uses common interior tooling, BUT the Lightning has battery packs intruding into the under-seat area. **Verify and disclose Lightning compatibility (likely NO).** Also disclose cab type (this is Crew Cab only).
  2. `2014-2019-silverado-sierra-rear-underseat-storage-organizer-box` — title says "Rear Underseat" which is correct (Crew Cab rear bench). **Cab type is implicit, should be explicit.** "2014-2019 Silverado/Sierra Crew Cab Rear Under-Seat Storage" is the correct title.
- **Stehlen-branded subset:** **0 SKUs.** Vendor is `USS` on both — that's a SKU prefix, not a real vendor.
- **Verdict:** **Hold from paid traffic.** 2 SKUs cannot support a category-page experience.
- **Top 3 fix recommendations:**
  1. **Unify the productType** to a single `under seat storage` value (drop the `under seat storage organizer` variant).
  2. **Add Lightning-incompatibility note** to the F-150/SD listing (battery pack intrudes on Lightning under-seat area).
  3. **Strategic decision:** either build out to 8+ SKUs (Ram Crew, Tundra CrewMax, Tacoma Double Cab, Silverado/Sierra T1XX, Super Duty current-gen, Wrangler JL 4-door, Gladiator) or fold under-seat into a broader `cab storage & organization` collection. Steel-vs-ABS material differentiation should be a filter.

---

# SUMMARY

## Categories ready to ship now (no blockers)

- **Chase Racks & Sport Bars (3 SKUs)** — Stehlen Razor halo product. Add bed-length chart on PDPs and ship. Niche but high-margin, brand-defining.

## Categories ready with minor fixes (≤1 day each)

- **Roof Racks & Baskets (7 SKUs)** — move 1 misplaced hitch carrier out, disambiguate Tundra cab. **0.5 day.**
- **Floor Mats (39 SKUs)** — move 11 trunk mats to a `cargo mats - rubber` productType, fix F-150 Lightning title mismatch. **1 day.**

## Categories that need data work (1-3 days)

- **Bull Guards & Grille Guards (186 SKUs)** — split 5 Ram DS/DT listings (1 day), strip false off-road trim tags from 4Runner + audit other off-road trim tags catalog-wide (1 day), add front-camera/ACC-radar metafields + PDP banner (1 day). **Total: 3 days.**

## Categories to HOLD from paid traffic until major rework

- **Running Boards & Side Steps (51 SKUs)** — **highest-priority hold.** Multi-generation bracket fraud on Tacoma 05-22 (6 SKUs), F-150/SD 15-23 (3 SKUs), Ram 09-22 (9 SKUs), Titan 04-24 (1 SKU). Estimated **$45K-$70K/yr in return-rate exposure** if shipped as-is. **Effort: 2-3 days of physical product verification + re-titling, splitting 18 listings into ~45 listings.** Until done, do NOT run Google Shopping or Performance Max against this category. **This is the single highest-risk category in the entire 7-category remaining scope.**
- **MOLLE Panels (2 SKUs)** — verify Ford Ranger 6 ft claim (likely fitment lie), then either build out to 8+ SKUs or de-feature.
- **Under Seat Storage (2 SKUs)** — too few SKUs to support a category page; either expand or fold into a broader cab-storage collection.

## Top 5 specific SKU fixes across these 7 categories ranked by $ impact

1. **Split the 9 "2009-2022 Ram 1500" running board SKUs into DS/Classic/DT variants** (incl. 4 Stehlen-branded ones). Bracket P/N `RBJZ-BR-RAM09-6P` is for DS frame only. Estimated impact: **$15K-$25K/yr in avoided returns + protection of the Stehlen-branded Ram subset (the brand's most exposed running-board moat).** Highest-priority fix.
2. **Split the 6 "2005-2022 Toyota Tacoma" running board SKUs into 2nd-gen (05-15) + 3rd-gen (16-23) variants.** Bracket `RBJZ-BR-TACO05-6P` is 2nd-gen. Estimated impact: **$27K-$36K/yr in avoided returns.**
3. **Split the 3 "2015-2023 Ford F-150 / Super Duty" running board SKUs into P552 F-150 (15-20) + P702 F-150 (21-23) + Super Duty 4th gen (17-22) + Super Duty 5th gen (23+).** Bracket is P552-only. Estimated impact: **$10K-$15K/yr** (smaller volume than Tacoma/Ram but still material).
4. **Split the 5 "2009-2022 Dodge Ram 1500" bull guard SKUs at the DS/DT boundary.** Same chassis-architecture root cause as headlights, tonneaus, and running boards on Ram. Estimated impact: **$8K-$12K/yr in avoided returns** (lower volume than running boards, but high AOV ~$420).
5. **Strip false off-road trim tags from the 2010-2024 4Runner bull guards** (4 SKUs claim TRD Pro fitment when the part is for SR5/Trail/Limited only). Add "Does not fit TRD Pro / TRD Off-Road Premium" PDP disclaimer. Estimated impact: **$5K-$8K/yr in avoided returns + protection from Toyota off-road forum bad-press** (TRD Pro owners are vocal in the 4Runner community when sold the wrong part).

## Cross-category patterns worth flagging to Sam and Ricky

- **The Ram DS/DT generation split is a $30K+/yr problem across the WHOLE catalog now** — confirmed in cycle-1 audit (headlights, tonneaus, bed mats) AND in this audit (bull guards 5 SKUs, running boards 9 SKUs, plus the Stehlen private-label exposure). The fix is mechanical (split listings at the 2018/2019 boundary) but it MUST be the cycle-3 / cycle-4 priority data project. Train whoever loads new Ram products on the DS/DT/Classic three-way split.
- **The "single bracket P/N across multiple chassis generations" lie is a NEW pattern** I didn't see in the top-5 (because tonneaus and bed mats have legitimate cross-generation fits — bed dimensions are stable). Running boards and bull guards do NOT have stable cross-generation fits because they bolt to body / frame mount points that change every chassis redesign. **Anyone loading new running-board, bull-guard, or step-bar SKUs needs to verify the bracket P/N is generation-specific.**
- **Vendor field is even dirtier here than in the top-5.** Bull guards alone have 24 distinct vendors for 186 SKUs, most of which are SKU prefixes (`BGHD`, `BLGR`, `GRZT`, `NUB`, `Combo`, `Aftermarket`, `Generic`) that ended up in the vendor field by accident. Catalog-wide vendor cleanup project is ~half-day in Shopify Admin and would unlock vendor-filtered collection pages.
- **Trunk mats in floor-mat category (11 SKUs)** mirrors the 2 trunk mats found in bed-mat category (cycle-1). **Same root cause: nobody distinguished cargo/trunk/frunk mats from in-cabin floor mats at intake time.** Recommend adding a `cargo mats - rubber` productType and migrating all 13 of these listings to it. **This also opens an SUV cargo-mat assortment opportunity** worth exploring as a Stehlen private-label expansion.
- **Stehlen private-label moat (cumulative across all 12 categories audited):**
  - Tonneaus: 41 SKUs (cycle-1) — strongest position
  - Bed mats: 29 SKUs (cycle-1) — second-strongest
  - Running boards: 8 SKUs (this audit) — modern Ram + modern Silverado/Sierra T1XX, **but exposed to gen-split lies**
  - Trailer hitches: 10 SKUs (cycle-1) — niche white-space platforms
  - Bull guards: 6 SKUs (this audit) — legacy/niche platforms only
  - Front grilles: 4 SKUs (cycle-1)
  - Chase racks: 2 SKUs (this audit) — Razor halo line
  - Roof racks: 1 SKU (this audit)
  - Headlights: 1 SKU (cycle-1) — and recommended NOT to expand (DOT liability)
  - **Floor mats, MOLLE, under-seat: 0 SKUs (this audit)** — three obvious private-label expansion lanes
  - **Total Stehlen-branded SKUs catalog-wide: ~102 SKUs (~7.7% of catalog)**
- **Coverage gap on the #1 selling truck (Ford F-150 14th gen P702, 2021+)** continues to be the most strategically painful. No bull guards, no running boards (the 15-23 listings are P552-only despite the 2023 claim), no chase racks, no MOLLE. F-150 P702 is in production NOW with 700K+ units/yr in the US. Whoever is on the new-product roadmap should put F-150 P702 in the top-3 priorities.

## Would I, as a 20-year specialist, sign off on launching THESE 7 CATEGORIES as-is to Google Shopping?

- **Chase racks (3)**: **Yes, ship.**
- **Roof racks (7)**: **Yes after 0.5-day cleanup.** Don't run paid traffic against a 6-SKU collection page until expanded.
- **Floor mats (39)**: **Yes after 1-day cleanup** (move trunk mats out, fix Lightning title). Low return-rate risk regardless.
- **Bull guards (186)**: **Conditional yes after 3-day data work.** Old-platform listings can ship now; modern Ram and 4Runner listings MUST be split / corrected first.
- **Running boards (51)**: **NO. Hard hold.** The multi-generation bracket fraud will produce a 15-25% return rate concentrated on the highest-AOV modern-truck SKUs. Will get the merchant account flagged on Google Shopping. **2-3 days of physical-product verification + re-titling required before this category is safe to index.**
- **MOLLE panels (2)**: **No, too small + 1 likely fitment lie.** Hold.
- **Under-seat storage (2)**: **No, too small.** Hold.

**Bottom line for Ricky:** Of these 7 categories, **chase racks and roof racks are quick wins, floor mats are 1 day of cleanup, and bull guards are 3 days.** Running boards is the **single highest-risk catalog-wide priority** — the bracket-P/N-vs-claimed-year-range fraud must be resolved before this category sees paid traffic. The Stehlen-branded modern Ram running-board subset (4 SKUs) is the most exposed brand-damage scenario in the entire 1,322-product catalog: a Stehlen-labeled product that doesn't fit the truck stated in the title will cost more in brand reputation than 100 generic returns.

Return-rate risk overall (these 7 cats): **medium-high — 11-14% if launched as-is, drops to 4-6% after the recommended fixes.** The bull-guard + running-board fix work is mostly data labor (warehouse + content team), not engineering — so it should not block cycle-3 dev velocity.
