# Mike Rodriguez · Cycle 14c · Pixel 8 Pro 412×915 · 2018 Ford F-150 grille

## Mission
Looking for an upgraded mesh-insert front grille for my **2018 Ford F-150 SuperCrew, 5.5' bed**. Saw a guy at a job site running one. Budget under $200. Shopping on the phone in the truck.

## Device + entry point
Pixel 8 Pro 412×915, mobile Chrome. Started at https://stehlenauto-vercel.vercel.app/

## Walkthrough
- **0:00** — Land on home. Black hero, "BUILT TOUGH. / BOLT ON. / DRIVE OFF." headline wraps clean (3 lines, no mid-word break). Page already remembers a 2022 TOYOTA TACOMA garage. CART says 8 items (carryover from prior session). Looks legit.
- **0:08** — Tap garage chip → CHANGE. YMM modal opens showing Step 1/3 Year. Pick 2018.
- **0:14** — Step 2/3 Make. Pick Ford. (Brand list short and clean.)
- **0:18** — Step 3/3 Model. Pick F-150. Modal closes. Header chip now says **2018 FORD F-150**. Cookie persisted.
- **0:25** — Tap SHOP BY CATEGORY → Front Grilles tile. Land on /collections/front-grilles.
- **0:30** — Banner reads **"FITS 2018 FORD F-150"** at top, then immediately below: **"NO EXACT-FIT MATCHES FOR YOUR 2018 FORD F-150 — showing the rest of front grilles."** Wait, what?
- **0:35** — Scroll the grid. First products are VW Touareg, VW Golf, etc. with yellow CHECK FITMENT FOR YOUR FORD F-150 chips. Below them, Ford Mustang, Toyota Tundra, Toyota Tacoma grilles all marked red ✗ DOES NOT FIT. Then Chevy, Dodge Ram. None for F-150.
- **0:50** — Try search "F-150 grille". 17 results. The grilles are 2004-2008 F-150 and 2021-2023 F-150 (✗ DOES NOT FIT for my 2018). The only ✓ FITS YOUR 2018 FORD F-150 results are *bull guards*, not grilles. So the catalog has no actual front grille for any 2015-2020 F-150.
- **1:05** — Open the 2021-2023 F-150 Badgeless Grille PDP just to verify behaviour. Top of page = red banner "✗ DOES NOT FIT YOUR 2018 FORD F-150 / Browse parts that fit your truck instead. SHOP PARTS FOR YOUR FORD →". Good.
- **1:15** — Scroll to buy box. Big disabled "DOES NOT FIT YOUR VEHICLE" button (56px tall, brand yellow at 0.6 opacity, cursor not-allowed). BUY NOW WITH AFFIRM also disabled. ATC blocked from main buy box.
- **1:25** — But the **sticky bottom bar** still has a bright, fully-saturated yellow "ADD TO CART" button (48px, opacity 1, NOT disabled). I tap it. It scrolls back to the buy box instead of adding (cart count stays 8). So it's safe but visually it tells me "buy this", contradicting the disabled state above.
- **1:40** — Tap FEATURES tab. Real product description renders: "Upgrade the front end of your Ford F-150 with this sleek badgeless style front grille. Crafted from durable ABS plastic in a glossy black finish…" The text is run-on (section headers like "Features", "Specifications", "Vehicle Fitment" are smashed inline with no breaks). Readable but ugly.
- **1:55** — Bail on grille mission. Try /collections/floor-mats with garage set. Top 2 products: "2015-2023 Ford F-150 Super Cab All Weather Floor Mats" + "Crew Cab" version, both ✓ FITS YOUR 2018 FORD F-150 in green. Below them, BMW/Audi/Acura mats marked yellow CHECK FITMENT (not red, because they're a different category context — fine).
- **2:10** — Open the F-150 Super Cab floor mats PDP. Beautiful: green CONFIRMED FITMENT banner, "Fits your 2018 Ford F-150 / Engineered for direct bolt-on installation". UNIVERSAL FIT · NO SUB-MODEL CONFIG strip. Big yellow ADD TO CART · $80 (enabled). Sticky bottom bar matches. Trust line: "CONFIGURED FOR 2018 FORD F-150 / Free shipping over $99 · Ships in 1-2 business days / 30-day hassle-free returns / Lifetime structural warranty / Drilling-free install · 60-90 minutes with 2 people". This is what every PDP should look like.
- **2:25** — Tap ADD TO CART. Cart drawer slides up. Count → 9. Item at top of list with $80. Honest red banner: "MIXED FITMENT — SOME ITEMS DO NOT FIT YOUR 2018 FORD F-150" (because of carryover Tacoma roof basket + Wrangler bull guard from prior session). Subtotal $1513. Big yellow CHECKOUT.
- **2:40** — Visit /cart full page. Single-column at 412 (no desktop layout breakage from cycle 14c). Banner honest. Free-shipping-unlocked progress bar full. Order summary clean: subtotal, FREE shipping, tax, $1558.39 total. CHECKOUT button is a real Shopify hosted-cart link (skip clicking, off-domain).
- **2:55** — Visit /help → 0 console errors. /help/install renders, all 4 install cards link to /help/contact (no 404 traps). 14c install + cart layout fixes verified.
- **3:10** — Cycle through tap-target audit: Header Open menu = 44×44, Search = 44×44, Cart = 44×44 ✓. Garage CHANGE chip = 40px tall × 370 wide (slightly under 44 height — minor). 0 horizontal scroll on home, /cart, /collections/front-grilles, /search, PDP.

## Friction log
- **F-1 [BLOCKER]** Catalog has zero front grilles for any 2015-2020 Ford F-150. Most popular truck in America. As a buyer with garage set, the front-grilles collection literally tells me "NO EXACT-FIT MATCHES FOR YOUR 2018 FORD F-150." Mission ends here. (Catalog gap, not a code bug — but a customer can't tell the difference, and I'd bounce to RealTruck/Tyger before realizing.)
- **F-2 [MAJOR]** Sticky mobile bottom bar on a "DOES NOT FIT" PDP shows a bright, saturated yellow ADD TO CART button — same color as functional ATC. It actually scrolls to buy box instead of adding, so no false purchase. But the visual signal contradicts the disabled buy box above it. The bottom bar should mirror the disabled state ("DOES NOT FIT" label + opacity 0.6) so the customer knows from any scroll position.
- **F-3 [MAJOR]** Disabled "DOES NOT FIT YOUR VEHICLE" button still uses brand yellow at 0.6 opacity. Cycle 14c brief said "RED DOES NOT FIT" — the BANNER is red but the BUTTON itself is yellow-disabled. To a phone user glancing fast, yellow = brand CTA. Should be a flat red or grey-disabled with the red x-icon.
- **F-4 [MAJOR]** PDP FEATURES tab content is run-on text. The actual Shopify description is rendered (good — 14c fix worked) but section headers like "Features", "Specifications", "Vehicle Fitment", "Part Number" all smash inline with no whitespace. Looks like raw description without HTML formatting respected. Reads as: "…factory grille without the OEM badge.Features Badgeless design for a clean, custom appearance High-quality ABS plastic construction…"
- **F-5 [MINOR]** Garage CHANGE chip in header is 40px tall, just under the 44px touch-target standard. Header icons themselves are 44×44 ✓.
- **F-6 [MINOR]** Search box on /search page doesn't show typeahead suggestions — just popular searches + recent. At 412 the header search is collapsed to an icon link that goes to /search. Header typeahead clamp behavior (cycle 14c) can't be tested at mobile width because the typeahead UI isn't reachable on mobile; it lives in desktop header only. (Not a bug, but means the 2-line clamp fix only matters on tablet/desktop — confirm the mobile /search page itself is fine, which it is.)
- **F-7 [MINOR]** Cart count of 8 on entry from prior testing sessions makes the welcome experience confusing. New buyer wouldn't see this, but during testing it's noisy.

## What worked
- YMM modal: 3 quick taps from CHANGE → 2018 → Ford → F-150. Cookie + cross-page persistence rock-solid. Header chip updates instantly.
- Floor mats PDP shows the **gold-standard** F-150 buyer experience: green CONFIRMED FITMENT, universal-fit clarity, full disabled-fitment chain elsewhere, sticky bottom bar mirrors price.
- Cart drawer + /cart page honest about mixed fitment. Free-shipping-unlocked progress bar is a great touch.
- 0 horizontal scroll on every page checked. Hero headline wraps clean. /help has no console errors. /help/install no longer 404s.
- Cycle 14c PDP main buy box fixes (RED DOES NOT FIT banner, disabled main ATC + Affirm at 56px) all verified. The OOTB regression list passed except for the sticky-bar bypass issue called out above.

## What competitors do better
- **RealTruck**: when they have zero exact-fit matches, they show a "We don't make this for your truck yet — try [adjacent category] instead" inline, not a generic "showing the rest" wall of grilles for other vehicles. Way more honest and stops me from doom-scrolling.
- **Tyger**: PDP buy buttons for non-fits are flat dark grey, not brand-yellow at low opacity. Reads as "off" instantly.

## Buy decision
- Would I check out today? **NO** for the grille mission, **MAYBE** if I were here for floor mats / hitches.
- Why: I came for a grille for my 2018 F-150 and the catalog has none. The site honestly tells me this on the collection page, which I appreciate, but it doesn't redirect me to "OK, here's what we DO make for your F-150" — it just shows me Mustang and Tundra grilles I can't use. For the floor-mat detour, the experience was excellent and I would buy. The sticky-bar yellow ADD TO CART on a non-fit PDP is sketchy — if I'd been less careful I'd have thought I was about to buy the wrong grille for my truck.
- "Would I buy" rating (this mission): **3/10** — failed mission because of catalog gap.
- "Would I buy" rating (general F-150 shopping): **7/10** — strong PDP, honest cart, fast, F-150 floor mats experience was clean.
- "Would I come back" rating: **6/10** — the trust signals are working (fitment guarantee, 30-day returns, free shipping). I'd come back for hitches or mats, not for cosmetic upgrades.

Mike's verdict: clean site that knows my truck and tells the truth, but if you're hunting cosmetic upgrades for a popular F-150 you'll find Stehlen doesn't make them yet — and the sticky-bar Add-to-Cart still glows yellow on parts that don't fit.
