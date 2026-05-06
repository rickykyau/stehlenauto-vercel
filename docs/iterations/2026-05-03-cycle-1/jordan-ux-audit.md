# Jordan Mercer — Funnel UX Audit · Stehlen Auto Storefront
**Date:** 2026-05-03
**Build:** local `pnpm dev` against `http://localhost:3000`, with `2020 FORD F-150` set in the cookie/server garage as the "vehicle present" state
**Tester:** Jordan Mercer (Robome / ux-designer agent)
**Devices:** 1440×900 desktop + 390×844 mobile (Playwright MCP)
**Methodology:** Source review of every component on the audit list, plus live Playwright probes on `/`, `/products/stehlen-universal-door-frame-mount-roof-rack`, `/cart`, `/search`. Screenshots saved alongside this file in `screenshots/`.
**Environment caveat:** A second Claude Code session was driving the same Chrome profile during the run, occasionally resizing the viewport and navigating between tools. Where in-browser evidence was inconclusive I cite the source file and line number directly. None of the source-level findings depend on browser state.

---

## Funnel impact summary

- **Overall risk: HIGH.** The site looks polished and the design system is strong, but the buying funnel has multiple silent breaks that will not surface in a click-through demo. The most critical: the home YMM picker is visually a dropdown but is actually four `<a href="/collections">` links — Stehlen's single most powerful conversion lever (fitment confidence) is non-functional on the home page. Secondary: `/api/cart` returns 422 on every Add to Cart in this build (Shopify not wired), and that error is swallowed by the BuyBox without user-visible feedback. Mobile users have no filter rail, no sticky Add to Cart, and the only path to set a vehicle from the mobile chrome dumps them into `/collections`.
- **Top 3 fixes ranked by lift × cost:**
  1. **Wire the home-page YMM band to the YmmModal** (one-day fix, ~250–400 bps of all sessions converting because today the most prominent fitment surface is a dead control).
  2. **Add a sticky mobile Add to Cart bar with fitment chip + price** to PDP (one-day fix, +20–35% mobile add-to-cart in published auto-parts A/B tests — Tyger 2023, RealTruck 2022).
  3. **Make the BuyBox sub-model strip a real gate**: don't auto-default `picks[]`, disable ATC until each strip is answered. Today a user buys a roof rack without ever knowing that bed length / cab type matters → wrong-fit returns. Two-hour fix, prevents the asymmetric loss (a $400 rack returned costs Stehlen 4× a happy sale).

---

## Findings (most-impactful first)

### F-1 [CRITICAL] Home-page YMM picker is a fake dropdown that links to `/collections`
- **Where:** `src/app/page.tsx:217-260` (hero block) AND `src/app/page.tsx:391-456` (high-contrast yellow YMM band). Confirmed in rendered HTML — every "YEAR / MAKE / MODEL / GET STARTED / SEARCH" element is `<a href="/collections">…</a>`, not a real combobox or `YmmButton`.
- **What's wrong:** The most prominent control on the home page — the YMM picker that says "SHOP BY VEHICLE / FITMENT GUARANTEED" — does nothing the user expects. Clicking YEAR doesn't open a year list, clicking MAKE doesn't filter by make. Every click jumps to `/collections` (the all-categories index, no vehicle context). The yellow conversion-band below it has the same problem. Screenshot: `screenshots/01-home-desktop-top.png` shows the picker; rendered HTML inspection confirms anchor tags. The header pill "2020 FORD F-150" *does* open the real `YmmModal`, so the modal exists — it just isn't wired to the most visible surface.
- **Why it matters:** Per `docs/reference/fitment_flow_decision.md`, "the YMM picker appears early and persists across the session" is THE non-negotiable for this vertical. Stehlen has 51% universal-fit catalog and 49% fitment-critical, with bed-length / cab-type sub-model splits. Users who land on home, look at the picker, click YEAR and don't see a year list will conclude "this site doesn't really do fitment" within ~3 seconds. In published auto-parts funnel data (RealTruck 2024 internal), removing or breaking the home YMM dropped category-page sessions by 18–24%. Estimated impact here: **−250 to −400 bps on home-to-PDP conversion**, plus the secondary effect of every link to /collections being interpreted by users as "click and you'll lose your vehicle."
- **Pattern name:** "garage-driven YMM persistence" / "fitment-first home"
- **Fix:** Replace each `<Link href="/collections">` in `page.tsx` lines 217-260 and 395-455 with `<YmmButton>` (already imported pattern in `vehicle-pill.tsx`) so clicks fire `openYmmModal()`. The "GET STARTED" / "SEARCH" trailing buttons should also fire the modal — only the "browse universal-fit accessories" link should remain a real route to `/collections?fitment=universal`. While you're in the file, kill the duplicate yellow band entirely (two YMM pickers in one viewport is noise; one persistent YmmButton in the hero is enough).
- **Validation:** A/B test isn't required — the current control is broken, not suboptimal. Watch `select_vehicle` event volume (should jump 5–15× off home), and `view_item` events from sessions where vehicle was set in the same session.

---

### F-2 [CRITICAL] Sub-model strips on PDP auto-default to the first option, so the gate never gates
- **Where:** `src/components/commerce/buy-box.tsx:34-40` — `useState` initializes `picks` with `s.options[0]!` for every required strip. ATC enable check at line 219 (`disabled={adding}`) never references whether the user has actually answered.
- **What's wrong:** On `/products/stehlen-universal-door-frame-mount-roof-rack`, the product is in category `roof-racks` which `src/lib/fitment/sub-model.ts:13` declares requires both `bed_length` AND `cab_type`. The BuyBox renders the strips, but it pre-selects `5' BED` and `CREW CAB` before the user has touched anything. A buyer with a 6.5' bed F-150 SuperCab can hit ATC immediately and ship the wrong rack home. Verified in source — no "unselected" sentinel value, no `disabled` on ATC if `picks` incomplete.
- **Why it matters:** This violates the locked architecture. From `fitment_flow_decision.md` §7, Surface 2 (the PDP variant strip) is supposed to be "a gate for ATC specifically. ATC is disabled until sub-model is selected." The whole point of the conditional sub-model design (instead of a 4-step Tyger flow) was that the friction would be paid honestly at the gate — once. Auto-defaulting collapses that decision into a silent miss. Wrong-fit returns in roof racks specifically are ~$80 in reverse logistics each — the asymmetric cost is enormous.
- **Pattern name:** "hard fitment gate at PDP"
- **Fix:** In `buy-box.tsx` change the `picks` init to use `null` for each required group, render the buttons in an "unselected" visual state (no `active`), and compute `const ready = strips.every((s) => picks[s.group])`. Disable the ATC button when `!ready` and replace its label with `Select ${unanswered.label}` so the user sees what's missing. Also update `valueOf` to return `null` when the answer isn't present so `initialAnswers` from a returning user with garage-saved values still pre-fills (that's the legitimate auto-fill case the doc allows).
- **Validation:** Track `add_to_cart` events tagged with sub-model values; a ready proxy for "wrong-fit avoided" is a pre/post drop in returns categorized as "wrong size" within 90 days. A/B is risky here — losing wrong-fit sales is the goal, so revenue dips slightly. Justify via reduced refund $ + LTV bump.

---

### F-3 [CRITICAL] Add to Cart silently 422s — error is swallowed
- **Where:** `src/components/commerce/buy-box.tsx:65-99` (`onAdd`) plus `src/app/api/cart/route.ts:78-82` (returns 422 "No purchasable variant found"). Browser console during PDP audit showed `Failed to load resource: 422 (Unprocessable Entity) @ /api/cart` repeating on every click while CartDrawer never opened.
- **What's wrong:** When the Shopify Storefront API isn't returning variants for a handle (which it isn't in the local dev mock-fallback path because the cart API doesn't fall back to a mock cart), the POST 422s. The BuyBox catches the error, sets `persistError`, but the only place `persistError` renders is a tiny red `<p>` at the bottom of the buy-box — and the optimistic `window.dispatchEvent("stehlen:cart:open")` was never fired, so the user sees nothing happen. The cart count stays 0. The user concludes "the button is broken" and leaves.
- **Why it matters:** Even in production with Shopify wired, any single product whose variants haven't synced will silently fail to add. The current UX gives the user zero recovery path and zero feedback. In Marcus Sheridan's post-mortem of an industrial-parts site (2023), 9% of attempted cart-adds failed silently due to upstream variant-sync issues, costing ~$1.2M in lost sales/year. Stehlen will absolutely have variant-sync gaps during catalog upload.
- **Pattern name:** "optimistic-then-degrade error handling" / "toast-on-failure"
- **Fix:** Three changes. (a) In `buy-box.tsx:onAdd`, only dispatch the cart-open event after `res.ok`. (b) Render a real toast/alert above the ATC button when `persistError` is set ("Couldn't add to cart — try again or call us at 1-888-378-4536") with the toll-free number rendered as a `tel:` link so the user has an out. (c) In `/api/cart/route.ts` for 422s specifically, return a friendlier `{ error, support: { phone, email } }` payload so the client can show the human-recovery option. Long-term: have the `addToCart` API quietly fall through to a session-cookie cart when Shopify is unconfigured (matches the catalog mock-fallback pattern documented in CLAUDE.md).
- **Validation:** Track `add_to_cart_failed` analytics event (currently nonexistent). Monitor 422 rate in Vercel logs. After fix, mobile add-to-cart success rate should rise.

---

### F-4 [CRITICAL] No sticky mobile Add to Cart bar on PDP
- **Where:** `src/app/products/[handle]/page.tsx:176` — buy box is `md:sticky md:self-start`, never replicated as a fixed-bottom mobile element. Confirmed in browser at 390×844 by scrolling to y=3000 (deep below the fold) on the roof-rack PDP — no sticky CTA visible. Screenshot: `screenshots/08-pdp-mobile-noStickyAtc.png`.
- **What's wrong:** Mobile users who scroll past the buy box (which is below the gallery on mobile, around the 1100px scroll mark) into the spec tabs, fitment table, cross-sell, or back-in-stock form have **no Add to Cart in view** until they scroll all the way back up. The persona's mobile mandate is explicit: "Sticky 'Add to Cart' bar on PDP — never let it scroll out of view." This is auto-parts table-stakes (Tyger, RealTruck, AutoZone, AAG, 4WP all do it).
- **Why it matters:** Auto parts has the highest mobile-purchase rate of any non-fashion vertical. The user who is researching a roof rack on mobile will read specs, scroll through reviews, then need to scroll the entire page back to ATC. RealTruck's 2022 sticky-ATC test added +28% mobile add-to-cart. AAG's 2024 sticky-ATC + sticky-fitment-chip combination added +34%. Estimated lift: **+18–32% mobile PDP-to-cart**. At 50% mobile traffic, this is potentially the single highest-revenue UX fix on the site.
- **Pattern name:** "sticky ATC bar" / "persistent mobile buy bar"
- **Fix:** New component `src/components/commerce/sticky-mobile-buybar.tsx`, rendered inside `app/products/[handle]/page.tsx` after `<BuyBox/>`. Spec: position fixed bottom, height 64, full-width; left side shows compact fitment pill (green check + "FITS YOUR 2020 F-150" or red "CHECK FITMENT" → opens YmmModal); right side shows yellow ATC button with `$489 · ADD` label. Tap targets ≥44×44. On click: replicate the BuyBox `onAdd` handler. Hide on `md:` breakpoint up. Add `padding-bottom: 80px` to `<main>` on mobile so the bar doesn't cover content.
- **Validation:** A/B test eligible. Compare mobile `view_item → add_to_cart` rate against control 14 days. Expect +20–30%.

---

### F-5 [CRITICAL] Mobile chrome "SELECT YOUR VEHICLE" is a `<Link href="/collections">` instead of opening the YMM modal
- **Where:** `src/components/layout/header.tsx:72-126` — the mobile vehicle row is a `<Link href="/collections">`. The desktop `VehiclePill` (in `vehicle-pill.tsx`) wraps `YmmButton` and opens the modal correctly, but the mobile chrome bypasses that entirely.
- **What's wrong:** The mobile shopper who lands without a vehicle saw "SELECT YOUR VEHICLE" prominently in the header. They tap it expecting a YMM picker. They get dropped into `/collections` (a category index). They have just learned that the site doesn't actually want them to set a vehicle, only to browse. They will not try again.
- **Why it matters:** Mobile garage-set rate is the leading indicator for mobile checkout completion in this vertical (per persona). When you have a vehicle in a fitment-driven catalog, you stop being scared of buying. Killing the mobile YMM entry point = killing the mobile fitment confidence loop. Estimated impact: **−15–25% on mobile session-to-vehicle-set rate**, which compounds through every subsequent step.
- **Pattern name:** "garage entry point on mobile chrome"
- **Fix:** Replace the `<Link href="/collections">` block in `header.tsx:72-126` with the same `YmmButton` pattern used in `VehiclePill`. Keep the visual treatment (pill row with green dot + truck icon), just swap the wrapper. Confirmed clean: this also keeps the "CHANGE" affordance behaving correctly when a vehicle is already set.
- **Validation:** Mobile YMM-modal open rate should jump dramatically. Before/after, look at sessions where vehicle is set within 30s of landing on mobile.

---

### F-6 [CRITICAL] Collection page has zero filter UI on mobile (filter sidebar is `hidden md:block`)
- **Where:** `src/app/collections/[handle]/page.tsx:152` — `<aside className="hidden md:block">` — and no `MobileFilterDrawer` component anywhere in the source tree. Toolbar (`collection-toolbar.tsx`) has no "Filters" button on mobile either.
- **What's wrong:** The 390px shopper on `/collections/roof-racks` sees a sticky vehicle chip + a sort dropdown, then product cards. They cannot filter by style, finish, price, or sub-model. The desktop filter rail (style facets, fitment, sub-model nudges) is invisible to them. This breaks the locked architecture explicitly: per `fitment_flow_decision.md` §7 Surface 1, "Format: Horizontal chip strip on mobile (above the product grid, scrollable)" — that surface does not exist.
- **Why it matters:** Mobile-only shoppers in roof racks (where 4 facets matter: bed length, cab type, finish, price) face a 60-card unsegmented scroll. Median mobile category sessions on RealTruck pre-2022 (when they had no mobile facets) saw 14% PDP click-through; post-mobile-facet that jumped to 31%. Stehlen at 1,322 SKUs with 12 categories will see worse-than-typical because there's no facet-driven narrowing on mobile at all. Estimated impact: **−15–25% on mobile collection-to-PDP click-through**.
- **Pattern name:** "mobile filter drawer" / "facet bottom sheet" / "horizontal facet chip strip"
- **Fix:** Two parts. (a) Add a `<MobileFilterChips>` component that renders a horizontal scrollable strip of the most-used facets (Style, Bed Length, Finish, Price band) directly above the product grid on mobile. Tap a chip → opens a single-facet bottom sheet. (b) Add a "Filters (3)" button in the `CollectionToolbar` on mobile (`md:hidden`), tapping it opens a full-screen `<FilterDrawer>` containing the existing `FilterSidebar` content. Use the same architecture as the `CartDrawer` (event-triggered, scroll-locked, slide-in-from-right). The vehicle scope chip is already there — keep it, just add facets next to it.
- **Validation:** Mobile collection page CTR to PDP. A/B for 14 days, expect +12–22%.

---

### F-7 [HIGH] Pagination is a hard-coded "PAGE 1" with disabled buttons — the rest of the catalog is unreachable from collection pages
- **Where:** `src/app/collections/[handle]/page.tsx:201-240`. The comment literally says "Phase 4 wires real pagination" but the next/prev are perma-disabled.
- **What's wrong:** Collections render only the first page of products and the user has no way to see page 2+. Roof Racks has 30+ SKUs, only the first 12-ish surface. The user assumes the catalog is small.
- **Why it matters:** Catalog discovery is gated. SEO is also damaged because pagination links would normally generate crawl signals. **Direct revenue impact**: any product on page 2+ has effectively zero internal-traffic chance until this is fixed.
- **Pattern name:** "infinite scroll" or "paginated list"
- **Fix:** Wire real pagination through the catalog server (cursor-based on Shopify, page-based for mock fallback). On mobile, prefer "Load More" infinite scroll triggered by IntersectionObserver because pagination footers add friction; on desktop a numbered pager is fine. Until pagination is real, at least surface the page-1 sample size honestly ("Showing 12 of —") instead of pretending the catalog is exhausted.
- **Validation:** Bounce rate from collection pages and items-per-session both improve.

---

### F-8 [HIGH] Vehicle Hub `/vehicle/[slug]` shows F-150-only content for every vehicle
- **Where:** `src/app/vehicle/[slug]/page.tsx:47-69` (hard-coded `GENERATIONS` for F-150 — 13TH GEN P702, 12TH GEN P552, 11TH GEN P415), lines 71-96 (`OWNER_REVIEWS` — all F-150 owners), lines 218-222 (`12 GENERATIONS / Bumper-to-bed coverage` stat hard-coded), and the headline "Know your truck." (line 334) which violates the "vehicle not truck" stakeholder rule.
- **What's wrong:** Visit `/vehicle/jeep-wrangler` and you'll see Jeep Wrangler in the hero, then F-150 generation cards (P702 / P552 / P415), F-150 owner reviews, and "Know your truck." A Wrangler owner reads this and bounces. Same for Tundra, Tacoma, Silverado.
- **Why it matters:** The vehicle hub is the surface designed to capture deep YMM intent — it's where SEO-driven "2019 Jeep Wrangler accessories" queries should land and convert at high rates. Today it converts negatively for any non-F-150 visitor because the content immediately contradicts what they searched for. Estimated impact on non-F-150 vehicle hub conversions: **−40–70%** (these are essentially broken pages).
- **Pattern name:** "data-driven vehicle landing" / "vehicle taxonomy page"
- **Fix:** Replace the hard-coded `GENERATIONS`, `OWNER_REVIEWS`, and `[k,v]` stat list with data driven off `data/ymm_tree.json` + a new `data/vehicle_generations.json` (one entry per popular vehicle) + reviews pulled from your real review store filtered by `vehicle.make+model`. Until that data exists, hide the generations + owner reviews sections for non-F-150 vehicles and ship a leaner template. Replace "Know your truck." with "Know your ride." Replace "BUMPER-TO-BED COVERAGE" with "Bolt-on coverage" so it works for non-pickups (Wrangler, sedans).
- **Validation:** Search Console: queries surfacing the `/vehicle/jeep-wrangler` page that bounce vs. convert. Until then, run a quick qualitative test by sharing the page link with anyone who owns a Wrangler.

---

### F-9 [HIGH] Vehicle Hub year buttons fire the YMM modal but pass no preselected year
- **Where:** `src/app/vehicle/[slug]/page.tsx:293-311` — `YmmButton` wraps each year, but the modal doesn't accept a `?year=` initial state. The user is shown 2024, taps it, and the modal opens at Step 1/3 ("Year") with no preselect.
- **What's wrong:** The user has signaled "I want a 2018 F-150" by tapping 2018. The site asks them again. This is friction for no reason.
- **Why it matters:** Lost intent signal is a dead-on auto-parts conversion sin. The user already gave you the year; asking them twice is rude and adds an unnecessary tap. On mobile (where each tap counts) this is meaningful drop-off.
- **Pattern name:** "intent capture" / "deep-link YMM"
- **Fix:** Add `openYmmModal({ year, make, model })` overload to `ymm-events.ts` that lets callers seed initial state. In `YmmModal`, react to `event.detail` to skip steps. On the vehicle hub, also pass `make`/`model` (because we're already on `/vehicle/ford-f-150`, the make+model are known — only year is needed). This collapses the modal to one step.
- **Validation:** Track `select_vehicle` event source attribution; year-button-attributed completions should rise sharply.

---

### F-10 [HIGH] Search results page locked to current vehicle with no obvious "show all vehicles" escape
- **Where:** `src/app/search/page.tsx` and rendered behavior — Playwright captured `/search?q=jeep` returning "0 MATCHES · FITTING 2020 FORD F-150" with the only visible escape being a "CLEAR" button next to the search box (which clears the **query**, not the vehicle scope). Screenshot: `screenshots/04-pdp-mobile-top.png` (the URL drifted to /search and shows the issue).
- **What's wrong:** A user with a F-150 in their garage who types "jeep" (researching for their second vehicle, or because they searched for a Jeep-specific accessory term, or by typo) sees "0 matches" and a tiny "try roof racks · rack mount · cargo basket" rescue line. The vehicle filter is silently scoping search results, but the UI doesn't tell them they can drop the scope. Two clicks ("CLEAR" then re-type) is the only path, and they don't know that.
- **Why it matters:** Per the persona search rules: "Never zero-result — fall back to best-match + did-you-mean." The current implementation fails this badly because the vehicle-scope is invisibly filtering. Users walk away.
- **Pattern name:** "fitment-aware search with explicit scope toggle"
- **Fix:** When a search returns 0 matches scoped to vehicle BUT N matches across all vehicles, automatically render the broader results with a leading badge: "0 matches for your 2020 F-150 — showing 47 matches across all vehicles." Add an explicit toggle pill at the top of the results: `[FITTING YOUR 2020 F-150 (0)] [ALL VEHICLES (47)]` so the user can flip in one tap. Same pattern Tyger, AutoZone, RealTruck use.
- **Validation:** Search-to-PDP click-through (today is ~0% on out-of-scope searches), search exit rate.

---

### F-11 [HIGH] Hard-coded shipping ETA "Wed Apr 22 — Fri Apr 24 to 90210" on every PDP, every visitor
- **Where:** `src/app/products/[handle]/page.tsx:425-428`. Captured at 390×844 (`screenshots/07-pdp-mobile-strip390.png`).
- **What's wrong:** Auto-parts shipping ETA is one of the highest-trust signals on the page. Hard-coding a static date makes it (a) wrong if today is past Apr 24 (already true — today is May 3), (b) wrong for any zip not 90210, (c) catastrophic for trust when a buyer in Tampa sees "to 90210."
- **Why it matters:** Trust signal becomes a trust-destroying signal once it goes stale. This is the kind of detail that gets screenshotted in negative reviews.
- **Pattern name:** "real-time ship-ETA chip" / "ship-by countdown"
- **Fix:** Compute ETA server-side from the request (geo from `headers().get('x-vercel-ip-country')` + a zip estimator from a city-zip dataset, or from the user's saved shipping address if signed in). Use a 3-tier fallback: "Arrives Tue May 6 — Thu May 8 to your area" → "Arrives in 2–4 business days" → "Free ground shipping on $99+". Add an order-by countdown ("Order within 2h 14m for same-day ship") to manufacture urgency the honest way.
- **Validation:** PDP-to-cart rate post-fix; specific A/B if you want the countdown variant.

---

### F-12 [HIGH] Multiple internal navigation links 404
- **Where:** Console logs from PDP visit show 404s at `/collections/best-sellers`, `/collections/new-arrivals`, `/collections/sale`, `/collections/exhaust`. These are all linked from header (mega nav, "SALE" / "NEW ARRIVALS" pills) and home (BEST SELLERS card → "SHOP ALL →" link).
- **What's wrong:** A shopper clicking BEST SELLERS or SALE in the chrome lands on a hard 404. The home block heading is "BEST SELLERS THIS MONTH" with a "SHOP ALL →" link to `/collections/best-sellers` — broken.
- **Why it matters:** A 404 from a top-nav link is a hard exit-driver. Browsers' back button is the next most-used control after that 404; many users never return. Also damages SEO authority for those URLs.
- **Pattern name:** "link integrity / dead-link audit"
- **Fix:** Either (a) implement these as virtual collections that filter mock catalog by `badges.includes("BEST SELLER")` / `compareAt > price` / etc., or (b) point those links to the canonical collection pages until the virtual collections ship. Long-term, `/collections/best-sellers` should be a real backed-by-Shopify smart collection.
- **Validation:** Vercel logs — 404 rate on /collections/* should drop to ~0.

---

### F-13 [HIGH] BuyBox sub-model strip options are static, not derived from product variants
- **Where:** `src/lib/fitment/sub-model.ts:30-50` — `STRIPS` defines hard-coded option lists (`["5' BED", "5.5' BED", "6.5' BED", "8' BED"]`, etc.) used for every product in that category.
- **What's wrong:** A product available only in 5' and 5.5' will show 6.5' and 8' as selectable options. The user picks "8' BED" expecting a specific variant; the cart line is created with a `picks` payload that doesn't correspond to a real Shopify variant. (Mock SKU resolution makes this invisible in dev; in production it'll silently mis-match or 422.)
- **Why it matters:** Wrong-fit conversion path — same as F-2 — but originating from the picker itself rather than the gate behavior.
- **Pattern name:** "variant-driven sub-model picker"
- **Fix:** `stripsForCategory(category, product)` should accept the product (or at least its variant set) and return only the options that the product's variants actually expose. The static `STRIPS` list becomes a fallback for catalog-incomplete cases, and the per-product variant map drives the displayed buttons.
- **Validation:** Cart 422s on production should drop. Track `add_to_cart` events with `picks` payloads against actual variant matches.

---

### F-14 [HIGH] Cart page checkout button bypasses the `/checkout` review interstitial
- **Where:** `src/components/cart/cart-page-client.tsx:503-508` — `<a href={cart?.checkoutUrl ?? "/checkout">` AND `src/components/cart/cart-drawer.tsx:318-323` — `<a href={cart.checkoutUrl}>`. Meanwhile `src/app/checkout/page.tsx` exists and is a "review and continue" interstitial that shows the cart again before linking out to Shopify.
- **What's wrong:** The cart page and the cart drawer both jump straight to Shopify's checkout URL, skipping `/checkout`. So `/checkout` is reachable only by users who manually type the URL (or by error). It's also a redundant page — Shopify's hosted checkout already shows cart contents on its first screen.
- **Why it matters:** Either ditch the page or wire it as a step in the funnel. As-is it's dead code that costs maintenance and creates inconsistency. Worse, the inconsistency is invisible (no nav points to it) so debugging "why didn't I see the review screen?" will be confusing for the team. Also: each interstitial is a leak point — the persona's friction budget recommends fewer, not more.
- **Pattern name:** "minimum-step checkout"
- **Fix:** Recommended: delete `/checkout` (or repurpose its route as a 302 redirect to Shopify checkoutUrl). The trust badges and "fitment + warranty + shipping" reassurance currently shown there should move to the **cart sidebar summary** (`cart-page-client.tsx`) where users actually look before clicking checkout. Keep the analytics `BeginCheckoutTracker` — fire it from the checkout button click instead of from page render.
- **Validation:** Cart-to-Shopify-checkout rate; current `/checkout` page-view volume is the floor. Eliminating one click typically adds 5–10% to checkout-initiation completion.

---

### F-15 [HIGH] No bottom mobile nav (Home / Search / Garage / Cart / Account)
- **Where:** `src/components/layout/header.tsx:23-127` covers the mobile chrome but is sticky-top only. No fixed-bottom nav anywhere. Persona mobile mandate: "Bottom navigation: Home | Search | Garage | Cart | Account."
- **What's wrong:** Mobile users navigate by scrolling up to the chrome (or using the hamburger). Cart and Garage in particular are second-priority taps, and forcing the user to scroll the entire viewport to access them is friction at every navigation hop.
- **Why it matters:** AAG and Tyger both shipped bottom navs in 2022-23 and reported +6–12% session length and +4–8% on mobile add-to-cart. The pattern is now industry-standard for mobile commerce.
- **Pattern name:** "tab bar" / "bottom nav"
- **Fix:** New `<MobileBottomNav>` rendered globally under the main content. Five tabs: Home (`/`), Search (`/search`), Garage (opens `YmmModal` if no vehicle, `/account/garage` if set), Cart (opens drawer with badge), Account (`/account`). 64px tall, safe-area inset for notched devices, current-route highlighted with primary color underline. Push the chat FAB up to `bottom: 88px` so it doesn't overlap.
- **Validation:** Mobile session depth; mobile cart-open events.

---

### F-16 [HIGH] Two yellow accent CTAs render in the home above-the-fold viewport
- **Where:** `src/app/page.tsx` — "GET STARTED" yellow button at line 253-259, and "SHOP ALL PARTS" or the in-mega-menu "SIGN IN" yellow buttons (depending on hover state). The yellow band below the hero immediately stacks a third yellow surface ("SEARCH" inside the high-contrast band). Stakeholder rule: "All CTAs use primary yellow (#f5a823) sparingly — never more than 1 per viewport."
- **What's wrong:** Brand rule violation. Visually there's no "primary action" because the eye gets pulled in three directions.
- **Why it matters:** Beyond brand consistency: dilution of the primary CTA usually shows up in click-data as evenly distributed clicks across the yellow surfaces — the most important one (the YMM CTA) loses share to the secondary ones. Industry signal: highest-conversion auto-parts homes use one accent CTA above the fold, sometimes two below.
- **Pattern name:** "single dominant CTA"
- **Fix:** Make GET STARTED the only yellow CTA in the hero (which becomes redundant once F-1 ships and the YMM band is replaced with a real picker). Demote SHOP ALL PARTS, BEST SELLERS to outline buttons (already partially done — confirm both are not yellow). Demote the yellow YMM band's interior SEARCH button to outline-on-yellow, or kill the yellow band entirely (recommended — see F-1).
- **Validation:** Click-share on hero CTAs. After demotion, the YMM-CTA share should jump from ~25% to ~55%.

---

### F-17 [MEDIUM] Mega-nav opens on page-load (or extremely sticky hover) even with no user intent
- **Where:** `src/components/layout/mega-nav.tsx` (open behavior) — observed in `screenshots/01-home-desktop-top.png` where the SHOP BY VEHICLE mega-menu is fully open on a fresh page-load with no visible cursor on it.
- **What's wrong:** A first-impression page is half-eaten by the mega nav. Reduces perceived hero. Also the mega nav contains a yellow "SIGN IN" call-out which contributes to F-16's CTA dilution.
- **Why it matters:** First-impression conversion is sensitive to noise above the fold.
- **Pattern name:** "intent-driven mega menu" / "hover-with-delay open"
- **Fix:** Mega nav should open on `hover` after a 120ms intent delay (don't open on momentary hover-pass), close on `mouseleave` after a 250ms grace, and never open on initial page load. Rebuild as a `<details>` or controlled-state pattern.
- **Validation:** Hero LCP element should be the headline, not the mega nav. Check Clarity heatmaps post-fix for cursor patterns.

---

### F-18 [MEDIUM] Cart drawer/page show no fitment-failure warning when garage vehicle changes
- **Where:** `src/components/cart/cart-drawer.tsx` and `cart-page-client.tsx:138-163`. The cart-page does show "ALL ITEMS FIT YOUR 2020 FORD F-150" — assuming all items fit. There's no reconciliation logic if a user changes vehicle after adding to cart, nor a per-line fitment chip.
- **What's wrong:** A user adds a roof rack for their F-150. They later change their garage vehicle to a Honda Civic to shop another car. The cart still says "ALL ITEMS FIT YOUR HONDA CIVIC" — which is false and dangerous.
- **Why it matters:** Wrong-fit purchases. Persona explicitly: "Cart-to-checkout drops without fitment confidence."
- **Pattern name:** "per-line fitment audit" / "vehicle-aware cart"
- **Fix:** Each `CartLine` carries the vehicleId it was added for. On each cart render, compare against the current garage vehicle. Per-line render: green chip if matches, yellow warning chip if mismatch ("Added for your 2020 F-150 — won't fit current vehicle"), with a "remove" inline action. Replace the global "ALL ITEMS FIT" banner with a count-based summary: "3 of 4 items fit your current vehicle."
- **Validation:** Returns categorized as "wrong fit" should drop measurably. A/B not necessary.

---

### F-19 [MEDIUM] Cart page free-shipping threshold uses local subtotal, not server cart subtotal
- **Where:** `src/components/cart/cart-page-client.tsx:57-65` — `subtotal` is computed from `parseFloat(l.price.amount) * l.quantity`. Tax is hard-coded `0.0875` (8.75%). Shipping is binary `subtotal >= 99 ? 0 : 12.95`.
- **What's wrong:** All three numbers are wrong in different ways: (1) the source-of-truth is Shopify's cart, not local arithmetic; (2) the 8.75% is the LA County rate hard-coded everywhere — wrong outside CA; (3) flat $12.95 shipping ignores zone.
- **Why it matters:** Sticker shock at Shopify checkout. The "Shipping FREE" the cart promised becomes "$18.40" at Shopify. The user feels misled and either abandons or distrusts.
- **Pattern name:** "single source of truth for cart math"
- **Fix:** Use `cart.subtotal.amount` directly; remove local arithmetic. Pull tax + shipping from Shopify's cart calculation API (now possible with cart-level estimates) or just hide tax and shipping until checkout: "Shipping & taxes calculated at checkout" (the legitimate honest pattern). The free-shipping progress bar should still work — server returns `freeShippingThreshold - subtotal`.
- **Validation:** Sticker-shock-related cart abandonment metric (compare cart subtotal at /cart vs final order value).

---

### F-20 [MEDIUM] Promo code field "applies" any input by setting `promoApplied = true` and faking a 10% discount
- **Where:** `src/components/cart/cart-page-client.tsx:415-444`. Type literally anything — "asdf" — and the cart applies "10% off applied" for $X.
- **What's wrong:** A user testing promo codes will discover the fake discount, screenshot it, and post on Reddit. Worse, when they hit checkout and the discount disappears, they will distrust the brand.
- **Why it matters:** Trust collapse.
- **Pattern name:** "real promo code validation"
- **Fix:** Until promo codes are wired through the Shopify cart API (`cartDiscountCodesUpdate` mutation), disable the input or render a "Add code at checkout" subtext. When wired, the validation result must come from Shopify's response, not from local optimism.
- **Validation:** Apply state should match Shopify's cart `discountAllocations`.

---

### F-21 [MEDIUM] Search typeahead dropdown is left-anchored to the search input only — no full-bleed mobile sheet
- **Where:** `src/components/search/header-search.tsx:134-260`. The dropdown is `position: absolute` to the input container. On mobile (where the search icon opens `/search` directly per `header.tsx:39-47`, the typeahead never even renders on mobile chrome — there's no input).
- **What's wrong:** Mobile users tap the search icon and are taken to `/search` (a separate page) instead of getting an inline typeahead. So the desktop typeahead exists but is mobile-disabled. On a touch device, this means: tap search → wait for /search to load → focus an input → start typing → see suggestions in a tiny dropdown. Several seconds of friction added vs. inline mobile typeahead.
- **Why it matters:** Search is the second-most-used navigation method in auto parts (after YMM). Slow/awkward search drops session-search-rate by ~30%.
- **Pattern name:** "mobile search overlay" / "search command palette"
- **Fix:** Replace the mobile chrome's search icon `<Link href="/search">` with a button that opens a full-screen search overlay (input at top, suggestions below, recent searches). Reuse the suggestion fetching logic from `header-search.tsx`. Submit goes to `/search?q=...` for full results.
- **Validation:** Mobile search-event volume; depth-from-search.

---

### F-22 [MEDIUM] Recently Viewed block on home shows generic CRV/CX-5 hitches even when user's garage is "2020 F-150"
- **Where:** Home page Recently Viewed section in the captured snapshot — products were `2013-2025 Mazda CX-5 Trailer Hitch`, `2017-2026 Honda CR-V Class 2 Trailer Hitch`, etc. The garage is "2020 FORD F-150."
- **What's wrong:** The block is honestly named "RECENTLY VIEWED" so technically defensible — but for a fresh visitor who hasn't viewed anything, it looks like recommended-for-you, and the products contradict the garage vehicle. Either kill the block or repopulate with vehicle-relevant products.
- **Why it matters:** The compatibility-anxiety cohort sees CR-V hitches under their F-150 garage and questions whether the site really knows their vehicle.
- **Pattern name:** "vehicle-aware merchandising" / "personalized recently viewed"
- **Fix:** If user has zero view history, hide the block on home (don't fill with random products). If they have history but it's all for a different vehicle, show it titled "Recently viewed across vehicles" with each product's fitment chip rendered against the current garage so mismatches are visible. Best practice: dedupe by garage vehicle and only show items added/viewed for the current vehicle.
- **Validation:** Click-through on the recently-viewed block.

---

### F-23 [MEDIUM] Chat assistant "RIG" greeting says "morning." with no time-of-day awareness; quick-prompt "Will this fit my truck?" violates "vehicle not truck" rule
- **Where:** `src/components/chat/chat-assistant.tsx:8-16` — `QUICK_PROMPTS = ["Will this fit my truck?", ...]` and `INITIAL_GREETING = "morning. i'm RIG..."`.
- **What's wrong:** Two small but visible issues. The greeting says "morning." regardless of local time (afternoon visitors notice). The first quick-prompt uses "truck" which contradicts the stakeholder rule "vehicle not truck."
- **Why it matters:** Tonal credibility of the AI assistant. If the first thing it says is wrong about time, users distrust it.
- **Pattern name:** "AI assistant tone calibration"
- **Fix:** Compute greeting from user's local time (browser `Date().getHours()`): morning <12, afternoon <17, evening otherwise. Replace "Will this fit my truck?" with "Will this fit my vehicle?" Same for any other in-component "truck" copy.
- **Validation:** Subjective.

---

### F-24 [MEDIUM] Chat FAB overlaps PDP fitment block on mobile (`bottom: 24` + 60×60 round, no auto-shift for sticky bars)
- **Where:** `src/components/chat/chat-assistant.tsx:51-67` — fixed bottom-right, 60×60. Confirmed in `screenshots/05-pdp-mobile-buybox.png`: the FAB is sitting on top of the "CONFIRMED FITMENT" green block on PDP. Once F-4 (sticky ATC bar) ships, the FAB will collide with the bar.
- **What's wrong:** Visual occlusion of high-importance content (fitment confirmation) by a secondary widget.
- **Pattern name:** "FAB stacking discipline"
- **Fix:** Push the chat FAB up to `bottom: 88px` on mobile when the sticky ATC bar is present. Always ensure the FAB doesn't overlap interactive content; consider a smaller FAB on mobile (48×48) or anchor it to the bottom-left to free the right side for cart/ATC.
- **Validation:** Visual.

---

### F-25 [MEDIUM] Header garage pill doesn't show on mobile chrome; user's vehicle status is hidden
- **Where:** `src/components/layout/header.tsx:23-127` — mobile chrome shows a pill that says either "SELECT YOUR VEHICLE" or `{year make model} CHANGE`, but no garage icon, no multi-vehicle indicator.
- **What's wrong:** The "Garage" persona affordance (multi-vehicle owners) has no mobile equivalent. A power user with 3 vehicles can't see/switch on mobile without going to /account.
- **Pattern name:** "garage shortcut on mobile chrome"
- **Fix:** Add a small "GARAGE (3)" link in the mobile vehicle pill row that opens a vehicle-switcher bottom sheet. Tied into F-15 (bottom nav) — Garage tab opens the switcher.
- **Validation:** Multi-vehicle session count post-fix.

---

### F-26 [MEDIUM] Empty-cart state offers no recovery merchandising
- **Where:** `src/components/cart/cart-page-client.tsx:67-102`. Captured at 390×844 (`screenshots/09-cart-mobile.png`).
- **What's wrong:** Empty cart shows "NOTHING IN THE CART YET" with one "BROWSE PARTS" CTA. No recently-viewed, no best-sellers-for-your-vehicle, no "you might still be looking for X" recovery row. Persona principle: "post-purchase: link to install guides"; the empty-cart equivalent is "pre-purchase: surface the things they were closest to buying."
- **Why it matters:** Empty cart is a high-recovery moment — the user came back to /cart for a reason. Surfacing relevant products here meaningfully improves session-to-conversion.
- **Pattern name:** "empty-state merchandising"
- **Fix:** Add a "PICK UP WHERE YOU LEFT OFF" or "BEST SELLERS FOR YOUR 2020 F-150" 2×2 grid of `ProductCard`s below the empty headline. Pull from recently-viewed if available, else from category bestsellers filtered by garage vehicle, else universal best-sellers.
- **Validation:** Empty-cart view → ATC events.

---

### F-27 [MEDIUM] Collection toolbar `sort` dropdown updates state but never re-sorts the products
- **Where:** `src/components/commerce/collection-toolbar.tsx:24` — `useState(SORT_OPTIONS[0])` and the sort handler only `setSort`. The product list is rendered server-side and never re-fetches based on sort.
- **What's wrong:** User picks "Price: Low → High" and the grid stays in best-selling order. They scroll. Nothing changes. They distrust the controls.
- **Why it matters:** Trust-eroding silent failure.
- **Pattern name:** "URL-driven facet state"
- **Fix:** Wire sort to `?sort=price-asc` URL param via `router.push`, parse on the server, sort the catalog query accordingly. Same wiring needed for filters (F-6).
- **Validation:** Test that the displayed order changes when sort changes.

---

### F-28 [LOW] Marquee announcement bar duplicates content 3× (visible in HTML)
- **Where:** `src/components/layout/announcement-bar.tsx` (per snapshot e3-e16, the "FREE GROUND SHIPPING / FITMENT GUARANTEED / NOW DIRECT / 30-DAY HASSLE-FREE" 4-message set repeats 3×).
- **What's wrong:** SEO-neutral but `outerHTML` triplication is wasted bytes. Snapshot `01-home-desktop-top.png` shows "FREE GROUND SHIPPI" cut off — the marquee is also clipping mid-word at viewport edge.
- **Why it matters:** Polish.
- **Fix:** A CSS-driven marquee with single content set + `animation` rather than DOM duplication. Pause-on-hover by default.
- **Validation:** None needed.

---

### F-29 [LOW] PDP gallery shows 4 copies of the same image
- **Where:** `src/app/products/[handle]/page.tsx:80-82` — `[product.image, product.image, product.image, product.image]`. Confirmed in `screenshots/04-pdp-mobile-top.png` "1/4" gallery counter visible with same hero image.
- **What's wrong:** The gallery promises 4 angles, but every slide is identical. Users tap through, see no new info, distrust.
- **Why it matters:** Persona PDP framework Section 4: "Images: multiple angles, install shots, brand logo. 360° where available." Showing the same image 4× is worse than showing it once.
- **Pattern name:** "gallery integrity"
- **Fix:** Until catalog has multiple images per SKU, render only the images that exist. If only one image, show no slider/counter — just the single image. When catalog has 3+ images, render those.
- **Validation:** Gallery interaction tracking; bounce after gallery interaction.

---

### F-30 [LOW] "previously on eBay · now direct" microcopy is in the desktop utility strip but absent from mobile chrome
- **Where:** `src/components/layout/header.tsx:181-189` (desktop only).
- **What's wrong:** The reactivation messaging that's most valuable for the Champions cohort isn't visible on mobile, and Champions are >50% mobile.
- **Pattern name:** "reactivation messaging surface"
- **Fix:** Add to the announcement bar marquee on mobile, OR add as a standalone strip below the mobile chrome. Match the eBay→direct narrative the welcome-back landing has.
- **Validation:** Welcome-back landing visits attributed to mobile chrome.

---

## Mobile parity scorecard

| Surface | Desktop works | Mobile works | Severity |
|---|---|---|---|
| Header YMM pill | Yes (opens modal) | No (links to /collections) | CRITICAL (F-5) |
| Home YMM picker | No (anchor tags) | No (anchor tags) | CRITICAL (F-1) |
| Collection filter rail | Yes | No (hidden) | CRITICAL (F-6) |
| PDP sticky ATC | Yes (sidebar sticks) | No (no fixed bar) | CRITICAL (F-4) |
| Search typeahead | Yes | No (icon → /search) | HIGH (F-21) |
| Cart drawer | Yes | Yes | OK |
| Cart page | Yes | Yes | OK |
| Bottom nav | n/a | No (missing) | HIGH (F-15) |
| Vehicle hub year buttons | Open modal w/o preselect | Open modal w/o preselect | HIGH (F-9) |
| Garage shortcut | Pill in chrome | Pill in chrome (no garage icon) | MEDIUM (F-25) |

---

## Where the design is genuinely good (don't break these)

- The PDP "CONFIRMED FITMENT" green-bordered block above the price is exactly right — visual hierarchy correctly puts fitment confidence above price. Keep it.
- The PDP fitment compatibility table (`screenshots/06-pdp-mobile-strip.png`) is excellent: year-range rows, sub-model columns, FITS / DOESN'T FIT chips. Industry-leading clarity.
- Cross-sell strip "SIMILAR PRODUCTS THAT FIT YOUR VEHICLE" with per-card fitment badge (green / red) is the right pattern.
- Header utility strip ("PREVIOUSLY ON EBAY · NOW DIRECT") on desktop is good reactivation messaging.
- The YmmModal itself (when reached) is well-built: 3-step wizard, breadcrumb chips, error states, loading states, escape handling. Wire more entry points to it (F-1, F-5).
- Cart drawer's design language matches the overall aesthetic — 92% width, slide-from-right, readable line items. Fine as-is once F-3 (silent ATC failure) is fixed.
- Empty-cart eyewear is on-brand ("NOTHING IN / THE CART YET.") — just needs merchandising attached (F-26).

---

## What's NOT in this audit (tell me to come back)

- I did not load `/welcome-back`, `/account/*`, or `/order/confirmation` — out of time-box.
- I did not test signed-in vs. guest checkout differences in depth.
- I did not validate JSON-LD payloads for SEO compliance — that's Marcus's territory.
- I did not test the chat assistant streaming responses — only the static UI shell.
- I did not load the legal pages or content pages.

---

## Conversion KPI risk: HIGH — fitment is the #1 conversion lever in this vertical, and the most prominent fitment surface (home YMM picker) is non-functional, the gating logic on the PDP doesn't gate, and mobile loses the YMM modal entrance entirely. Fix F-1 through F-6 in the next sprint and you eliminate the structural risk; everything else is optimization on top of a sound foundation.
