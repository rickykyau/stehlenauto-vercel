# Mike's cycle-5 CTA + UX sweep

Date: 2026-05-03 · Tester: Mike Rodriguez (customer persona)
Production URL: https://stehlenauto-vercel.vercel.app
Mode: desktop 1440x900 (mobile spot-check at 375x812 for collection drawer)
Method: Playwright MCP — clicked every primary CTA, traversed destinations, graded against the promise.

---

## Per-page findings

### Home (/)

- Header phone `tel:18883784536` → opens dialer · PASS
- Header "Live Chat" → /help (NOT actually a chat) · MISLEADING (says Live Chat, opens a Help index page; chat is in the floating bottom-right launcher)
- Header "Order Status" → /account/orders → middleware redirect to **Clerk hosted page** at `united-ibex-88.accounts.dev` showing default purple Clerk theme · BROKEN trust (see auth section)
- Header search box "⌘ K" hint → no quick-search modal triggered when I hit ⌘K, but typing works · MINOR
- Header SELECT VEHICLE → opens YMM modal · PASS
- Header GARAGE link → /account → Clerk hosted page (off-brand) · BROKEN trust
- Header CART → opens drawer · PASS
- Mega-nav "Shop by Vehicle" → /collections (not actually shop-by-vehicle landing) · MISLEADING (ought to land somewhere with a YMM picker, not the generic collections grid)
- Mega-nav SALE → /collections/sale (loaded fine) · PASS
- Mega-nav NEW ARRIVALS → /collections/new · PASS
- Hero "SHOP ALL PARTS" → /collections · PASS
- Hero "BEST SELLERS" → /collections/best-sellers · PASS
- Hero YMM band "GET STARTED" → opens YMM modal · PASS
- Hero "browse universal-fit accessories" → /collections · PASS
- Best-sellers product cards → /products/<handle> · PASS (4 of 4 sampled)
- "CLAIM 10% RETURNING-CUSTOMER OFFER" → /welcome-back · PASS (clean dedicated page with WELCOME10 code)
- Category tile grid (12 tiles) — every tile → /collections/<handle> · all loaded (sampled tonneau, headlights, bull-guards, MOLLE, under-seat-storage)
- POPULAR_VEHICLES tiles (8 tiles) → /vehicle/<slug> · all loaded · PASS
- Testimonial cards — not interactive · N/A
- "RECENTLY VIEWED" tiles → /products/<handle> · PASS
- Footer Shop links → /collections/* · PASS
- Footer Support, Company, Legal links → all spot-checked, returned content · PASS
- **Footer social links (F, I, Y, T)** → `/social/facebook`, `/social/instagram`, `/social/youtube`, `/social/tiktok` — **404 dead-ends**. Bare Next.js "404 / This page could not be found." with no recovery. · **BROKEN x4** (every social icon kills trust)

### Vehicle hub /vehicle/ford-f-150

- Hero "12 GENERATIONS · Bumper-to-bed coverage" stat — F-150 has only had 14 gens lifetime, current is 14th. Number is not absurd in isolation but it's the SAME COPY on every hub (Ram, Tacoma, Wrangler all also say "12 GENERATIONS"), so it's clearly a copy-paste placeholder, not a per-vehicle stat. · MISLEADING
- "SET YOUR EXACT TRIM" CTA → opens YMM modal · PASS
- "SHOP ALL CATEGORIES" → /collections · PASS
- PICK YOUR YEAR strip (12 buttons) — clicking 2018 opens YMM modal pre-stepped to Make/2018. Doesn't auto-fill Make = Ford though even though the page is /vehicle/ford-f-150. · PASS but lazy (could skip Make for Ford-page)
- "KNOW YOUR F-150" gen cards: 3 cards (2021-2024 / 2015-2020 / 2009-2014) — distinct legit F-150 photos for each gen. Visual differentiation IS strong. · PASS
- Each "SHOP P702 / P552 / P415 PARTS" CTA → /search?q=<year>+Ford+F-150 — landed on real search results, 24 matches showing 2015-2023 / 2015-2026 F-150 fitments. Search results genuinely relevant to the gen+year. · PASS (this was a cycle-4 explicit fix — confirmed working)
- "BUILT FOR FORD F-150" 8 category tiles → /collections/<handle> · PASS
- "WHAT OTHER FORD OWNERS BUY" 4 cards → all four are F-150 racks, makes sense for F-150 page · PASS

### Vehicle hub /vehicle/chevrolet-silverado

- Hero stat "12 GENERATIONS" — copy-pasted from F-150, not per-vehicle · MISLEADING
- Gen cards: 2019-Current and 2014-2018 — only 2 cards (page claims 12 generations, shows 2). Photos: 2019-Current is a custom/modified red Silverado that doesn't read as stock-current; 2014-2018 photo is plausibly Silverado. Borderline distinct. · PASS-with-issue
- "SHOP THIS GEN" buttons → search results · PASS
- "WHAT OTHER CHEVROLET OWNERS BUY" 4 cards → **all four are Stehlen Door-Frame Mount Roof Rack | Fits 2014–2026 Ford F-150 / SuperCrew** etc. · **MISLEADING** — Chevy buyer is shown F-150 cross-sells.

### Vehicle hub /vehicle/ram-1500

- Same "12 GENERATIONS" copy · MISLEADING (Ram 1500 has had 5 generations)
- Gen cards: 2019-Current (DT) and 2014-2023 (DS / parallel run) — distinct legit Ram photos · PASS
- "WHAT OTHER RAM OWNERS BUY" → again 4× F-150 SuperCrew roof racks · MISLEADING (same bug as Silverado)

### Vehicle hub /vehicle/toyota-tacoma

- "12 GENERATIONS" · MISLEADING
- Gen cards: 4th gen (2024-Current) and 3rd gen (2016-2023) — same red Tacoma in both photos at similar rear-3/4 angle. Visually less differentiated than F-150 but still recognizably different model years. · PASS (borderline)
- "WHAT OTHER TOYOTA OWNERS BUY" → 4× F-150 racks again · MISLEADING

### Vehicle hub /vehicle/jeep-wrangler

- "12 GENERATIONS" · MISLEADING (Wrangler has 4: YJ, TJ, JK, JL/JT)
- Gen cards: 2018-Current (JL) and 2007-2018 (JK) — distinct legit Jeep photos · PASS
- "WHAT OTHER JEEP OWNERS BUY" → 4× F-150 SuperCrew roof racks for a JEEP customer. **A Wrangler doesn't even have a bed.** · **MISLEADING** (worst version of the cross-sell bug)

### Tonneau Covers collection (/collections/tonneau-covers)

- Header total: **"FILTERS · 2576 PRODUCTS"** — but sidebar facet says "Tonneau Covers 286". So the cycle-4 fix overcorrected: the lying-low "24" became lying-high "2576" (the WHOLE CATALOG count). Real Tonneau Covers count appears to be 286, owner expected 287. · **BROKEN** (still wrong, just wrong in the other direction)
- Sticky toolbar at scroll: toolbar is **not sticky at all** at y=1200 — it scrolled out of view. Sidebar IS sticky. So there's no overlap (cycle-4 fix), but the user lost sort + filters-button at scroll depth — they have to scroll back to top to change sort or open the filter drawer. · PASS for "no overlap", FAIL for "useful at scroll depth"
- Sidebar "Make: Ford" facet click → URL becomes `?f=eyJ...` (base64 metafield filter), grid re-renders to Ford F-150/Ranger products, header now says **"559 PRODUCTS"** while the facet itself says Ford = 60. Header is still lying, just lying differently. · BROKEN
- Sort dropdown "Price: Low → High" → URL adds `&sort=price-asc`, products re-order to ascending price (159, 159, 173, 174, 174, 175, 176, 176). · PASS
- "CLEAR ALL FILTERS" button → removes `?f=` param but keeps `&sort=`. · PASS
- Mobile (375x812): hamburger header collapses, sticky SELECT YOUR VEHICLE bar, sort dropdown, FILTERS button visible. FILTERS button opens full-screen overlay with category/vehicle-type/make + a yellow "SHOW 2576 PRODUCTS" footer button (still wrong total). Drawer functions correctly. · PASS for drawer mechanism, FAIL for total count

### Bull Guards & Grille Guards (/collections/bull-guards-grille-guards)

- Header total: "300 PRODUCTS" (owner expected 186). · BROKEN (same root cause as tonneaus)

### Headlights (/collections/headlights)

- Header total: "1025 PRODUCTS" while sidebar facet "Headlights 160" (owner expected 160). · BROKEN — header is 6.4× the actual category size

### Smaller collections sanity check

- /collections/under-seat-storage → "15 PRODUCTS" — plausible · PASS
- /collections/molle-panels → "10 PRODUCTS" — plausible · PASS
- (Pattern: header count appears to equal "what the API returned for this query" not "category total" — small categories happen to match because all results fit on one page; large ones inflate.)

### Sign-in (/sign-in)

- Heading: "SIGN IN TO YOUR STEHLEN ACCOUNT" — owner-flagged "Sign in to stehlenauto-clerk" leak is **FIXED** on this local route · PASS
- Sub-copy: "Track orders, manage your garage, and keep your fitment data with you." — clean
- Form fields: **Email input has zero border** (`border: 0px solid rgb(42,42,42)`), background `rgb(31,31,31)` is nearly identical to the card background. The placeholder "Enter your email address" is configured but visually invisible — empty input is a featureless dark rectangle hovering under a white "Email address" label. Borderline-usable but ugly. · PARTIAL FAIL on readability
- "Powered by Clerk" footer + **orange "Development mode" badge** still visible at the bottom of the card. Customer hits this and immediately knows the site is on test infrastructure. · **BROKEN trust**
- "Sign up" link → /sign-up · PASS
- "Continue with Google" button visible · PASS

### Sign-up (/sign-up)

- Heading: "BUILD YOUR STEHLEN GARAGE" — clean, branded · PASS
- Same input-field problems as /sign-in (borderless, dark-on-dark) · PARTIAL FAIL
- Same "Development mode" leak · **BROKEN trust**
- "Sign in" link → /sign-in · PASS

### Auth-required routes (anonymous user behavior)

- /admin/sourcing-gaps anonymous → middleware 302 to **`https://united-ibex-88.accounts.dev/sign-in`** — Clerk's hosted UI, default purple theme, heading "Sign in to stehlenauto-clerk", "Development mode" badge front-and-center. NOT the local branded `/sign-in` route. · **BROKEN trust** (the leak the owner flagged is fixed on the LOCAL sign-in route, but ANY other protected route still bounces to off-domain Clerk UI.)
- /account → same hosted-Clerk redirect on RSC prefetch, throws CORS errors in console (4 per page load on every route in the site)
- /account/orders → same
- I did not test "wrong user 403 OWNER ONLY" because I didn't sign in (anonymous → off-brand redirect already broken).

### Search (/search)

- /search?q=wrangler+bumper → "10 MATCHES" — Jeep Wrangler bull guards + a hitch. Search took "bumper" loosely as "bull guard" — passable but no "did you mean". The PRODUCT IMAGES on these Wrangler results show **F-150s in the photos** (orange F-150 with bull bar, green F-150 with mesh grille). Misleading product photography. · PASS for relevance, MISLEADING for imagery
- /search?q=f-150+headlight → did not formally test but f-150 search works above
- /search?q=somethingnonexistent → "0 MATCHES · NO RESULTS · TRY [roof racks / rack mount / cargo basket]" suggestion chips. But also still shows "MATCHES IN: TONNEAU COVERS / TRAILER HITCHES / BULL GUARDS / BED MATS" badges below — visually contradicts the no-results message. · PASS-with-confusion
- Search results when garage = 2018 F-150 set: I did not see a "no exact-fit, showing all" notice. Worth a follow-up.

### PDP fitment hero states

Sample 1 — /products/stehlen-universal-door-frame-mount-roof-rack (no garage)
- Yellow VERIFY FITMENT card, neutral CTA "SELECT YOUR VEHICLE →" · PASS

Sample 1 with garage = 2018 F-150
- **Green CONFIRMED FITMENT** "Fits your 2018 Ford F-150" · PASS
- Header pill shows "● 2018 FORD F-150" · PASS
- Sub-model strips visible: BED LENGTH (5'/5.5'/6.5'/8') and CAB TYPE (CREW/SUPER/REGULAR), with right-side "Pick one to continue" hint · PASS
- ATC button correctly disabled-styled "SELECT BED LENGTH" until both strips chosen · PASS
- After picking 5.5' BED + CREW CAB, ATC becomes "ADD TO CART · $489.00" · PASS
- No "CONFIGURED FOR" line — let me note: the buy box does not surface a labeled "Configured for: 2018 F-150 / 5.5' Bed / Crew Cab" recap line. The strips show a small "Selected: 5.5' BED" / "Selected: CREW CAB" annotation but it's split across two strip headers, not a single sentence. Borderline acceptable; cycle-3 promised one consolidated line. · PARTIAL

Sample 2 — /products/2013-2025-mazda-cx-5-class-2-trailer-hitch-1-25-receiver with garage = 2018 F-150
- **Red DOES NOT FIT YOUR 2018 FORD F-150** banner with "SHOP PARTS FOR YOUR FORD →" CTA · PASS for honesty
- BUT: yellow primary "ADD TO CART · $165.00" remains fully enabled directly below the red banner. Customer can buy a part the site has explicitly told them does not fit. · **MAJOR** trust hole
- Shipping ETA: "Free shipping · Arrives Wed Apr 22 — Fri Apr 24 to 90210" — today is May 3 2026, so the dates shown are 11 days in the past. STALE/INVALID dates. · **MAJOR**

### Cart drawer + cart page (/cart)

- Add the Mazda hitch (does not fit), open drawer: drawer shows the line item, $165, qty stepper, Remove, CHECKOUT footer. **No fitment banner of any kind in the drawer.** · BROKEN (cycle-3 was supposed to surface mixed/all-fits/garage in the drawer)
- Navigate to /cart full page: header "REVIEW YOUR ORDER · 1 ITEMS" + **red banner "✓ MIXED FITMENT — SOME ITEMS DO NOT FIT YOUR 2018 FORD F-150"**. Honesty banner present. · PASS on cart page
- Inconsistency: the drawer and the page don't agree about whether to surface fitment. Customers who only ever see the drawer (most checkout flows) get NO warning.

### Misc

- RIG chat launcher (bottom-right) opens a 600px panel "RIG · STEHLEN ASSISTANT · ONLINE" with quick prompts WILL THIS FIT MY TRUCK / TRACK AN ORDER / INSTALL HELP / TALK TO A HUMAN. · PASS (didn't actually send a message but UI is intact)
- Announcement bar marquee scrolls with 4 messages × 3 dupes — works, slightly distracting but on-brand · PASS
- Console errors: every page load throws **4 CORS errors** + 1 Clerk dev-keys warning, caused by RSC-prefetch of /account and /account/orders against the dev Clerk subdomain. Hidden from non-devtool users but a deal-breaker if anyone inspects. · MAJOR

---

## Summary

- **Total CTAs / destinations exercised: ~70**
- **BROKEN (confirmed not working / wrong destination):**
  - Footer social links F/I/Y/T → 404 (4 separate dead links)
  - Collection header product count: 2576 / 1025 / 559 / 300 — all inflated, all on the EXACT collections owner flagged. The cycle-4 "fix" overcorrected.
  - Cart drawer has no fitment banner (cart page does — drawer doesn't)
  - DOES-NOT-FIT PDP still has fully enabled ADD TO CART
  - PDP shipping ETA shows stale dates (Apr 22-24, today is May 3)
  - All auth-required routes (other than the local /sign-in itself) bounce to off-brand `united-ibex-88.accounts.dev` Clerk hosted UI
  - "Development mode" red badge visible on every Clerk surface customers will hit
  - 4 CORS errors per page load in console (RSC prefetch of /account routes)

- **MISLEADING (works mechanically but the destination doesn't match the promise):**
  - Header "Live Chat" link → /help (a help index, not chat)
  - Mega-nav "Shop by Vehicle" → /collections (no YMM landing)
  - Vehicle hubs all say "12 GENERATIONS" copy-paste regardless of vehicle (Wrangler is 4 gens, Ram is 5)
  - "WHAT OTHER <BRAND> OWNERS BUY" — the cross-sell module is hard-coded F-150 SuperCrew roof racks on Silverado, Ram, Tacoma, AND Wrangler hubs (Wrangler doesn't even have a bed)
  - Wrangler bumper search returns Wrangler bull guards but the product hero IMAGES show F-150s
  - Empty-search results show contradictory "0 matches" + "MATCHES IN: 4 categories" badge row
  - Collection header counts that mislead on the high side (see Broken)

- **Per-gen photos load + look distinct?**
  - F-150: YES, 3 distinct gens, real photography
  - Silverado: BORDERLINE (red 2019-Current looks customized; only 2 gens shown)
  - Ram 1500: YES, 2 distinct DT/DS gens
  - Tacoma: BORDERLINE (both photos red Tacomas at similar rear-3/4 angle)
  - Wrangler: YES, JL vs JK clearly different
  - Verdict: photos LOAD on all 5, distinctness varies. F-150 and Wrangler look genuinely curated; Silverado/Tacoma look like first-Wikimedia-photo dumps.

- **Sticky toolbar overlap status:** PASS — toolbar is no longer overlapping cards (cycle-4 fix held). BUT toolbar appears to not be sticky AT ALL now: at scroll y=1200 the FILTERS+sort row was off-screen entirely. User loses controls at scroll depth. Sidebar IS sticky.

- **Tonneau header total:** 2576 (should be ~287). Was 24 before, is now 2576. Wrong in both directions.

- **Sign-in/sign-up readability:** PARTIAL — heading is now correctly branded ("SIGN IN TO YOUR STEHLEN ACCOUNT"). But: input fields have no visible border + dark-on-dark backgrounds make empty inputs look like flat rectangles; placeholder text invisible until focus; "Development mode" orange badge visible to every customer. Anonymous customer hitting /account or /account/orders bounces off-brand entirely.

- **Mobile filter drawer working:** YES — full-screen overlay with category/make/year/SHOW button. Drawer mechanics solid; total count inside still wrong.

---

## Score (rating the OWNER, not the assistant)

- **Buy: 4/10** — I can FIND a roof rack that fits my 2018 F-150, the green CONFIRMED FITMENT box is reassuring, the search routing from gen cards actually works, the cart honesty banner on the full /cart page is a nice touch. But: shipping dates are 2 weeks in the past, the cross-sell shows me F-150 racks on the Wrangler page (so I trust nothing on that surface), the social links 404, and the sign-in / account flow drops me on a stranger's URL with "Development mode" stamped on it. If I'm dropping $489, I want one credible reassurance that this isn't a phishing site. Owner has those reassurances on individual pages but blows them up at every account or auth boundary.

- **Return: 5/10** — The home, PDP, and collection grid are well-designed enough that I'd come back to browse. I would NOT come back to manage an account, track an order, or read a return policy after seeing the dev-mode Clerk page.

- **Trust delta from cycle-3 (was 2.0 avg):** UP by ~2.5 to ~4.5/10. Real progress on fitment honesty (CONFIRMED/DOES-NOT-FIT/CHECK), real progress on per-gen photos, real progress on heading leak. Still bleeding trust on auth, social, shipping ETA, cross-sell, and the new collection-count inflation.

---

## What ANY future committee MUST add to its mission template

1. **Click every footer link.** Cycle-3 missed 4× 404s because every social icon goes to a relative path. A 30-second sweep would have caught it. Mandatory: walk the footer top-to-bottom, follow each href, screenshot any non-200.

2. **Verify auth boundary on a NON-/sign-in protected route.** The owner-flagged "Sign in to stehlenauto-clerk" leak was fixed on /sign-in but is alive everywhere else. Hit /account, /account/orders, /admin/sourcing-gaps as anonymous, screenshot the result, confirm you stayed on the brand domain.

3. **Verify any "PRODUCTS" or "MATCHES" total against the actual underlying count.** The cycle-3 + cycle-4 sweeps both treated the badge as "trust the number". Mandatory: pick 3 large collections, read header total + sidebar facet total + pagination math, confirm they agree.

4. **Open a populated cart in BOTH the drawer and the /cart page**, screenshot both, confirm the fitment banner state matches. The drawer currently lies-by-omission while the page is honest.

5. **Test cross-sell modules ("What other X buy")** — verify the recommended products are at least the same MAKE as the page. The hub cross-sell is hard-coded F-150 on every page.

6. **Read every PDP shipping ETA against TODAY'S date.** If "Arrives Apr 22 - Apr 24" is the literal page text on May 3, that's a stale-cache or hard-coded bug. 5 seconds to spot, deadly to a buyer.

7. **Read header copy for vehicle-specific stats.** "12 GENERATIONS" being identical across F-150 / Ram / Tacoma / Wrangler is exactly the kind of placeholder string a per-page sweep catches that a structural review misses.

---

Mike's verdict: it's closer to shippable than cycle-3 but I'd still send a buddy elsewhere — the fitment promise is finally honest on the PDP, but the auth flow, shipping dates, and dead social links would have me closing the tab inside 90 seconds the first time something didn't work.
