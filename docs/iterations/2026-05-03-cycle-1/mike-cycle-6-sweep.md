# Mike's cycle-6 re-sweep + deep dive

Tester: Mike Rodriguez (customer persona — 2018 F-150, 2014 Wrangler, 2022 Tacoma owner)
Device: desktop 1440x900, Chromium via Playwright MCP
URL: https://stehlenauto-vercel.vercel.app
Garage during testing: 2014 Jeep Wrangler (set via /api/garage)

## Part A — cycle-5 fixes (PASS/FAIL each)

1. **/collections/tonneau-covers count: PASS** — header reads `FILTERS · 286 PRODUCTS`. h1 "TONNEAU COVERS". Not 24, not 2576.
2. **/collections/headlights count: PASS** — `FILTERS · 160 PRODUCTS`. h1 "HEADLIGHTS".
3. **/collections/bull-guards-grille-guards count: PASS** — `FILTERS · 185 PRODUCTS`. h1 "BULL GUARDS & GRILLE GUARDS".
4. **/vehicle/jeep-wrangler "X GENERATIONS": PASS** — body text contains `2 GENERATIONS`. Not 12.
5. **/vehicle/jeep-wrangler cross-sell rail: PASS** — exactly 4 product cards, all Wrangler-relevant: 2007–2024 Jeep Wrangler JK & JL Class 3 hitch, 2007–2018 Wrangler Class 3 Trailer Hitch, 2007–2009 JK Bull Guard, 1997–2006 Wrangler Class 3 Hitch + Ball Mount. Zero F-150 / SuperCrew leakage.
6. **PDP shipping ETA: PASS** — Wrangler hitch PDP body matched `Ships in 1-2 business days`. Date regex for past months (Jan–Dec + day) returned **0 hits**. No "Apr 22".
7. **Footer socials: PASS** — `footer a[aria-label/href contains facebook|instagram|twitter|youtube|x.com|tiktok]` returned **0 elements**.
8. **Header label: PASS** — header contains `Help Center`, does NOT contain `Live Chat`.
9. **Smart-sticky toolbar: PASS** — at scrollY=1800 the toolbar is `position:sticky; top:76px`, `backdrop-filter: saturate(1.4) blur(8px)`, background `oklab(... / 0.88)` (translucent). Pinned correctly under the 76px nav, not opaque, not sliding over cards. Nice work.

**Part A score: 9/9 verified.** The dev's claim that he hand-walked the deploy holds up.

## Part B — fitment gating

10. **Mazda CX-5 hitch with Wrangler garage: PASS** — banner reads `DOES NOT FIT YOUR 2014 JEEP WRANGLER`, the Add-to-Cart button text is `DOES NOT FIT YOUR VEHICLE` and `disabled=true`. `CONFIGURED FOR` line is **not present** on the page. Exactly the behavior owner asked for. This is the bug that would have killed the cart in cycle-5 — it's locked down now.

11. **Cart drawer mixed-fitment banner: PASS** — added Wrangler hitch via /api/cart, drawer fired via the `stehlen:cart:open` event. Banner text:
    > MIXED FITMENT — SOME ITEMS DO NOT FIT YOUR 2014 JEEP WRANGLER

    Drawer rendered: 3 line items, $437 subtotal, CHECKOUT CTA. The banner accurately reflects the truth (Mazda hitch + Wrangler hitch in the same cart = mixed). PASS.

## Part C — coverage gap surfaces

12. **/sign-in dark theme + flow:** Layout renders cleanly (Continue with Google + email box), labels legible (white-on-near-black). Two real findings:
    - **BUG: "Development mode" badge from Clerk is visible at the bottom of the sign-in card** (orange text on dark, hatched bottom border). That means production is using Clerk dev keys. Anyone landing on /sign-in sees this — it screams "this is not a real shop." It would make me bounce.
    - **MINOR**: The "Secured by Clerk" text below the form is so dim it's invisible against the gradient hatch — readability fail, but probably from the same dev-mode skin.
    - Email-only flow: typed `support@robome.io`, hit Continue, got `Couldn't find your account` in red — proper error UX.
13. **/account auth gate: PASS** — `fetch('/account', credentials:'omit')` 307s to `/sign-in?redirect_url=%2Faccount`. /account/orders/anything-1234 also redirects to `/sign-in?redirect_url=%2Faccount%2Forders%2Fanything-1234`. Both return 200 once followed. Good.
14. **/checkout: MAJOR BUG** — fitment status on the /checkout page is **wrong / lying**.
    - Cart contained: 2× Wrangler-fit Class 3 hitch + 1× Mazda CX-5 hitch (does NOT fit Wrangler).
    - The cart drawer correctly shows `MIXED FITMENT — SOME ITEMS DO NOT FIT YOUR 2014 JEEP WRANGLER` (red).
    - The /cart page (`/cart`) also correctly shows `MIXED FITMENT — SOME ITEMS DO NOT FIT YOUR 2014 JEEP WRANGLER` (red).
    - But the `/checkout` page shows a **green** checkmark badge: `✓ FITMENT VERIFIED — All items fit your 2014 Jeep Wrangler`.
    - That's the worst class of bug — the surface where the customer commits says "everything fits" when it does not. If a customer gets to checkout without seeing the cart drawer (which is possible — direct link, mobile flow, etc.) they buy a part that won't bolt on. THIS is what the warranty/returns budget gets killed by.
    - The `CONTINUE TO SECURE CHECKOUT · $437.00` button is a Shopify hosted-checkout link (`https://stehlenauto.myshopify.com/cart/c/...`). The handoff URL works.
15. **/order/confirmation:** Static template. Order # = `STH-PENDING` (placeholder). Status timeline is 4 fake steps with copy like "Today / Within 24 hours / Est. tomorrow / Est. 4–6 business days" — no real data binding. CTAs:
    - `VIEW ORDER STATUS` — no anchor; minor (no href in the snapshot, may be a button)
    - `CONTINUE SHOPPING` — likely fine
    - `GUIDES` link — should land on /help/install
    - As-is, this is a brochure. If a real Shopify order ID gets passed, we don't see it pulled in. Owner needs to wire `?order_id=...` query handling before launch.
16. **/returns/somefakeorderid:** redirects to `/sign-in` (Clerk-gated). **MINOR INCONSISTENCY**: this redirect strips the `?redirect_url=...` param (lands on bare `/sign-in`), whereas /account redirects preserve it. After signing in the customer lands on the account dashboard, not on the returns page they originally clicked. Friction.
17. **/search?q=zzznoresults: PARTIAL FAIL** —
    - `MATCHES IN` row: NOT present ✓
    - "no results" message: PRESENT (`NO RESULTS · TRY` + suggestion chips: roof racks, rack mount, cargo basket) ✓
    - `BROWSE BY CATEGORY` row: **STILL PRESENT** — your spec says it should NOT appear on no-results. The category chips render below "No matches yet — try a broader search above, or browse by category." Whether that's intentional or a leak depends on the cycle-5 acceptance criteria. Flagging it because the brief said NO.
18. **/search?q=tonneau: PASS** — 24 results, BROWSE BY CATEGORY appears (TONNEAU COVERS / TRAILER HITCHES / BULL GUARDS / BED MATS), `MATCHES IN` row absent. Notable: results show `0 EXACT-FIT MATCHES FOR YOUR JEEP WRANGLER — showing all matching products. Verify fitment on each product page` — that's exactly the right copy.
19. **/admin/sourcing-gaps unauthed: PASS** — 307 → `/sign-in?redirect_url=%2Fadmin%2Fsourcing-gaps`.
20. **Chat (RIG): PASS** — bottom-right yellow FAB labelled `Open chat`. Click opens 600-px panel `RIG · STEHLEN ASSISTANT — ONLINE` with quick prompts (WILL THIS FIT MY TRUCK / TRACK AN ORDER / INSTALL HELP / TALK TO A HUMAN). Sent `Will a Class 3 hitch fit my 2014 Jeep Wrangler?` — got back a multi-paragraph Claude reply with **garage context awareness** (referenced "your 2014 wrangler"), 3 numbered next steps including the support phone `1-888-378-4536`, and a closing safety note about wrong tongue weight rating. Genuinely useful. This is the most polished thing on the site right now.

## Part D — regression hunt

21. **Footer column links:** All 19 internal hrefs HEAD-checked, **all 200**. No 404s. (Tonneau Covers, Trailer Hitches, Bull Guards, Front Grilles, Headlights, All Categories, Help Center, Contact Us, Returns, Shipping, Fitment Guarantee, Install Guides, About, Account, Sign In, Terms, Privacy, Warranty, CCPA, Prop 65, Accessibility — all live.)
22. **Mega-nav top-level:** All 7 hrefs return 200. BUT:
    - SHOP BY VEHICLE → `/collections` (should arguably be a YMM-driven mega-menu, not the same dump as the SHOP link)
    - EXTERIOR → `/collections` (lazy — collapses to All Categories, no exterior-specific filter)
    - CARGO & BED → `/collections/tonneau-covers` (only one category — should be a cargo landing or mega-panel)
    - LIGHTING → `/collections/headlights` (same — only one category)
    - TOWING → `/collections/trailer-hitches`
    - **SALE → `/collections/sale`: returns 200 but page shows `FILTERS · 0 PRODUCTS` and copy "We're loading the sale catalog from the warehouse. Check back soon."** Putting SALE in red type in the header when there's nothing on sale is clickbait. I'd bounce.
    - **NEW ARRIVALS → `/collections/new`: same — 0 products, "uploading new from the warehouse" placeholder.** Same problem.
23. **Home POPULAR_VEHICLES tiles (8):** All 8 → 200 OK. Ford F-150, Chevy Silverado, Ram 1500, Toyota Tacoma, Jeep Wrangler, Toyota Tundra, GMC Sierra, Nissan Frontier — every one resolves to a real /vehicle/[slug] page. PASS.

## Score

- **Buy: 6.5/10** — fitment gating is now solid (PDP + drawer + cart page all tell the truth), checkout handoff works, chat is excellent. Lost 3.5 points to: (1) /checkout green "FITMENT VERIFIED" lying when cart is mixed, (2) Clerk dev-mode badge on /sign-in shouting amateur-hour, (3) SALE / NEW ARRIVALS being clickbait that lands on empty pages.
- **Return: 7/10** — chat alone makes me want to come back. Garage persistence works. But if I hit the "lying checkout" once, I don't come back at all.
- **Movement from cycle-5 (4.5/10): up by ~2.0 points** — the catastrophic stuff (fitment-gate disabled, wrong counts, vehicle-hub showing 12 generations + F-150 cross-sell, fake socials) is genuinely fixed. The remaining gaps are the next layer down.

## Top 5 cycle-7 priorities (ranked by buy-impact)

1. **/checkout fitment banner is WRONG when cart is MIXED.** Green "FITMENT VERIFIED — All items fit your 2014 Jeep Wrangler" is rendered while the cart drawer + /cart page both correctly say MIXED FITMENT. Single source of truth — kill the green banner on /checkout or recompute it from the same cart-fitment evaluator. If a customer ever sees this and orders, the warranty cost bites. **THIS is the must-fix.**
2. **Clerk "Development mode" badge visible on production /sign-in.** Switch to Clerk production keys (or wire via Vercel marketplace integration env). Today, every customer who hits sign-in sees orange "Development mode" text — instant credibility loss.
3. **SALE and NEW ARRIVALS in the top nav land on empty 0-product pages.** Either populate from Shopify (use the discount tag or a "new" tag), or hide the menu items until populated. Putting SALE in red is a promise. Empty page is a bait-and-switch.
4. **/order/confirmation doesn't pull real order data.** Status reads `ORDER #STH-PENDING` and the timeline is hardcoded. Wire `?order_id` query → Shopify Admin order lookup, render the real order #, real ship-by, real tracking link.
5. **/returns flow Clerk redirect strips `redirect_url`.** After sign-in the customer ends up on /account dashboard instead of the returns page they were trying to start. Fix the middleware to preserve `?redirect_url=` consistently across all gated routes (/account behaves correctly, /returns/[id] does not).

---

Mike's verdict: **Cycle-6 fixed the catastrophic stuff and I'd actually try to buy now — but the green "FITMENT VERIFIED" lie at /checkout is a single-issue trip-killer; fix that one bug and I'm telling buddies to shop here.**
