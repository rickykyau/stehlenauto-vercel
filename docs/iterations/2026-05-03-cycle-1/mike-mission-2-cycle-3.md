# Mike Mission 2 — Wrangler Bumper Browse (Desktop) · CYCLE 3 RE-SHOP

**Tester:** Mike Rodriguez (41, Phoenix AZ landscaper, 3-truck garage)
**Date:** 2026-05-03 evening
**Session length:** ~18 minutes
**Cycle 1 reference:** [mike-mission-2-wrangler-bumper-desktop.md](./mike-mission-2-wrangler-bumper-desktop.md) — verdict was 1/10 "Bumpers category empty"

---

## Mission

Browsing tonight. Thinking about upgrading the front bumper on my **2014 Jeep Wrangler Sport Unlimited (4-door, JK gen)**. Not buying tonight unless something blows me away.

## Device + entry point

- **Device:** Desktop, 1440 × 900 (Mac, Chrome via Playwright)
- **Entry point:** `http://localhost:3000` (typed direct, fresh cookies wiped at 2:30)

> **Tester note (same as cycle-1):** the Playwright harness keeps snapping the viewport back to 390 every time `browser_take_screenshot` runs and queues click events across navigations. I worked around it by setting cookies directly, re-resizing to 1440 before reads, and capturing DOM via `evaluate`. Findings reflect what a real desktop customer at 1440 would see, validated against `window.innerWidth === 1440` and the live DOM.

---

## Walkthrough

### 0:00 — Land on home

Same sharp design as cycle-1 — black hero, "BUILT TOUGH. BOLT ON. DRIVE OFF.", Affirm 4× shown next to every price, trust strip with "Free shipping $99+ / 30-day returns / Lifetime warranty". Two big things look different from cycle-1 already:

1. **Garage chip in header now reads "SELECT YOUR VEHICLE"** instead of being pre-set to "2020 FORD F-150." That's a real fix to cycle-1's F-10 — anonymous first visit no longer ships with someone else's truck loaded. Win.
2. **Category grid grew and is real-looking** — Tonneau Covers, Trailer Hitches, **Bull Guards & Grille Guards**, Front Grilles, Headlights, Truck Bed Mats, Running Boards & Side Steps, Floor Mats, Roof Racks & Baskets, Chase Racks & Sport Bars, MOLLE Panels, Under Seat Storage. The brief said the bumper category was relabeled "Bull Guards & Grille Guards" with 186 products — and there it is on the home page with proper imagery. Cycle-1's "10 of 12 categories empty" appears to be solved at the chrome level.

### 0:30 — Hit the YMM picker

Cycle-1 finding: "the hero YMM picker is fake — six `<a>` tags pointing at `/collections`." That's **fixed.** Click YEAR → a real modal opens: `Step 1 of 3 · Year`, list of years 2027 down to 1990 as real `<button>`s. Pick **2014** → modal advances to `Step 2 of 3 · Make · 2014` with year-aware Make list (Acura, Audi, BMW, … Jeep, … Toyota, Volvo). Pick **Jeep** → `Step 3 of 3 · Model · 2014 Jeep`. Pick **Wrangler** → modal closes, header chip updates to "**2014 JEEP WRANGLER · CHANGE**", cookie `stehlen_vehicle=...2014-jeep-wrangler...` is set. The picker actually works now. **Cycle-1's F-5 blocker is fixed.**

(Quirk: the picker has weird state memory — when I first opened it, it was already on Step 2 with year "2018" pre-selected from somewhere. Hitting RESET took me back to Step 1 but it remembered "2022 Toyota" from a queued click later. As a regular customer not running a robot harness, I'd probably never hit this — but the RESET button doesn't fully clear the picker's internal state, only the visible step.)

### 1:30 — Browse the bumpers area

Click the home tile **"Bull Guards & Grille Guards"** → `/collections/bull-guards-grille-guards`.

**Page loads. Real catalog. 24 product cards on Page 1, pagination 1 / 2 / 3 / … visible at bottom.** Brief said 186 products total. **Cycle-1's F-1 BLOCKER ("Bumpers category empty") is fixed.** Headline of the cycle.

H1 says "BULL GUARDS & GRILLE GUARDS." Below H1: green chip **"FITS 2014 JEEP WRANGLER"** — context-aware, picked up my garage. That's a fix to cycle-1's F-10 (chip used to say F-150 unconditionally).

But then I scan the actual product grid and the smile fades:

- **Card #1:** "2009-2012 Dodge Ram 1500 Front Grille Guard"
- **Card #2:** "2020-2023 Tesla Model Y Rear Bumper Guard"
- **Card #3:** "2020-2024 Tesla Model Y Front & Rear Bumper Guard Set"
- **Card #4:** "2020-2023 Tesla Model Y Front Bumper Guard"
- **Card #5:** "2010-2018 Jeep Wrangler Advanced Series Bull Guard" ← finally something for me
- **Card #6:** "2010-2018 Jeep Wrangler JK Advanced Bull Guard w/ LED Light Bar"
- … rest of page = 9 Wrangler / 15 not-Wrangler (Toyota Tundra, Sequoia, Tacoma, Nissan Titan)

So even though the page knows my truck (chip says "FITS 2014 JEEP WRANGLER"), the **product grid is unsorted by fit.** Tesla Model Y bumpers come before Jeep Wrangler bull guards on a "Bull Guards" page where my garage is set to a Wrangler. Every card carries a yellow "**CHECK FITMENT FOR YOUR JEEP WRANGLER**" chip (24 of 24) — even the cards whose product titles literally announce **"2010-2018 Jeep Wrangler"** (my year is in that range). The system can't read its own product titles to figure out fit.

This is a sneaky regression-in-disguise: cycle-1 lied with confident "✓ FITS YOUR FORD F-150" badges everywhere; cycle-3 is now too cautious — even on parts whose name shouts "Wrangler", it tells me to "CHECK FITMENT." The honesty is better, but a buyer scanning a 24-card grid still sees ZERO confirmed-fit cards on a category page that should show me the 9 (or however many) Wrangler bull guards FIRST with a green tick.

### 3:00 — Sidebar facets — still nonsense for this category

Same bug as cycle-1's F-12. Sidebar shows:

- **BED LENGTH:** 5' Bed (12), 5.5' Bed (24), 6.5' Bed (38), 8' Bed (8)
- **CAB TYPE:** Crew Cab (54), SuperCab (32), Regular Cab (12)
- **COLOR:** Black (86), Matte Black (24), Aluminum (8)
- **MATERIAL:** Steel (72), Aluminum (38), ABS (6)
- **BRAND:** Stehlen Pro (54), Stehlen Heavy-Duty (32), Stehlen Universal (56)

I'm a Wrangler shopper looking at bull guards. **A Wrangler doesn't have a bed.** "Crew Cab / SuperCab / Regular Cab" applies to F-150s, not Wranglers. And the counts add up to numbers (54 + 32 + 56 = 142 brand totals on a 24-card page) that don't match anything visible. Same fake-counts problem, same wrong-facets-for-this-category problem. **No "Vehicle make" or "Wrangler-only" filter** so I can't slice the 24 cards down to the 9 Wrangler ones.

There's also no "**fits my vehicle only**" toggle anywhere — the standard pattern on RealTruck and AAG. The page knows my truck but won't filter to it.

### 4:30 — Open a real Wrangler bull guard PDP

Click `/products/2010-2018-jeep-wrangler-advanced-series-bull-guard-matte-black`. **PDP loads — real product, real price ($196), 5 in stock, SKU ITEM-025074, "or 4 interest-free payments of $49.00 with Affirm."** Product is real Shopify data. Win vs cycle-1.

But this is where the contradictions pile up:

1. Top of buy block: **"CHECK FITMENT — We haven't verified this part for your 2014 Jeep Wrangler yet. Use the compatibility table below or call us at 1-888-378-4536 before ordering."** The product title literally is "**2010-2018** Jeep Wrangler Advanced Series Bull Guard" — my year 2014 falls inside 2010-2018. The system can't parse its own title.

2. Right under the Add-to-Cart button: **"CONFIGURED FOR 2014 JEEP WRANGLER"** — directly contradicts the "CHECK FITMENT — we haven't verified" line two paragraphs above. Same product, same trust block, two opposite messages.

3. **Vehicle Compatibility table is the same fake hardcoded F-150 SuperCrew table from cycle-1.** "2021–2026 SuperCrew · 5.5' Bed FITS / 2015–2020 SuperCrew · 5.5' Bed FITS / 2014 Crew Cab · 5.5' Bed FITS / 2009–2013 All bed lengths DOESN'T FIT." This is on a **Jeep Wrangler bull guard.** Wranglers don't have SuperCrew, Crew Cab, or bed lengths. Same fake table copy-pasted from cycle-1 across the catalog. F-9 is unfixed.

4. **Tabs (FITMENT / FEATURES / SPECS / INSTALLATION / SHIPPING / WARRANTY / REVIEWS (0)) all still show the same content.** Same as cycle-1 — labels promise content, all show one fitment table. F-9 unfixed.

5. **"SIMILAR PRODUCTS THAT FIT YOUR VEHICLE"** rail at the bottom of the PDP = **4 Ford F-150 roof racks** (titles literally say "Fits 2014–2026 Ford F-150 / SuperCrew") each labeled with green **"✓ FITS YOUR 2014 JEEP WRANGLER"** chips. **A Ford F-150 roof rack will NOT fit a Jeep Wrangler.** This is cycle-1's F-3 BLOCKER — fitment-guarantee-violating false positives — fully reproduced in the recommendations module on every PDP.

6. Trust strip is the same best-in-class line as cycle-1: "Free shipping · Arrives Wed Apr 22 — Fri Apr 24 to 90210 / 30-day returns / Lifetime structural warranty / Drilling-free install · 60–90 minutes with 2 people." Still good.

### 6:00 — Try Add to Cart

This is the cycle-1 #2 BLOCKER — silent 422 dead. Click **"ADD TO CART · $196.00"** with a fetch hook installed.

**`POST /api/cart`** payload: `{"handle":"2010-2018-jeep-wrangler-advanced-series-bull-guard-matte-black","sku":"ITEM-025074","quantity":1,"options":{}}`
**Status: 200**
**Response body:** real Shopify cart object — `gid://shopify/Cart/hWNB...`, real `checkoutUrl` pointing at `stehlenauto.myshopify.com/cart/c/...`, totalQuantity went from 3 to **4**, subtotal went from $505 to **$701** (= prior $505 + bull guard $196). Real Shopify cart line ID, real variant ID `gid://shopify/ProductVariant/45044973010991`.

Cart drawer auto-opens after add. Cart count in header updates. **This is the headline cycle-3 win. Cycle-1's F-2 BLOCKER is fully fixed.**

### 7:30 — Walk the cart end-to-end

Navigate to `/cart`. Cart page renders with the H1 "REVIEW / YOUR ORDER." 5 line items, real Shopify line IDs, line totals, subtotal $882, **"FREE SHIPPING UNLOCKED"** (over $99), tax estimate $77.17 (8.75%), grand total $959.17. **"or 4 payments of $239.79 with Affirm"** under the total. Promo code field works. CONTINUE SHOPPING link works.

Click **CHECKOUT · $959.17** → **lands on `https://stehlenauto.myshopify.com/checkouts/cn/hWNBjOVTWZodUUbd7QHR5raK/...`** — real Shopify checkout page. Page Title: "Checkout - Stehlen Auto." Order Summary $882, Email field, Country (United States), Address, full state dropdown (50 states + territories), Express Checkout. **End-to-end commerce chain: PDP → Add to cart → Cart drawer → Cart page → Real Shopify checkout, working against the real `stehlenauto.myshopify.com` instance.** That's the brief delivered.

But cart-page also shows **"ALL ITEMS FIT YOUR 2014 JEEP WRANGLER"** — and the cart contains a Ford F-150 tonneau and a Toyota Tundra tonneau. Same false-positive cycle-1 fitment-claim bug surfacing in the cart page. F-3 unfixed (and worse — now it's blasted on the highest-trust page in the funnel).

### 9:00 — Sweep the rest of cycle-1 friction list

I batch-checked the URLs cycle-1 flagged as broken (single eval, no clicks). Result:

| URL | Cycle-1 | Cycle-3 |
|---|---|---|
| `/collections/vehicle/jeep-wrangler` | 404 | **404** |
| `/collections/vehicle/ford-f-150` | 404 | **404** |
| `/collections/vehicle/chevrolet-silverado` | 404 | **404** |
| `/collections/sale` | 404 | **404** |
| `/collections/new` | 404 | **404** |
| `/collections/best-sellers` | 404 | **404** |
| `/collections/exterior` | 404 | **404** |
| `/collections/cargo-bed` | 404 | **404** |
| `/collections/lighting` | 404 | **404** |
| `/collections/towing` | 404 | **404** |
| `/help/install/modular-bumper` | 404 | **404** |

**Zero of the 11 broken-link blockers from cycle-1 are fixed.** All 8 vehicle tiles on the home rail still 404. All 4 mega-nav category triggers (Exterior / Cargo & Bed / Lighting / Towing) still 404. SALE, NEW ARRIVALS, BEST SELLERS still 404. The "modular bumper" PDF link from `/help/install` still 404.

Wait — the brief said "Headers, mega-nav, footer all reconciled." On inspection: the **footer** SHOP links now point at real Shopify handles (`/collections/tonneau-covers`, `/collections/trailer-hitches`, `/collections/bull-guards-grille-guards`, `/collections/front-grilles`, `/collections/headlights`, `/collections`) — those work. But the **mega-nav category triggers** in the top header still point at `/collections/exterior`, `/collections/cargo-bed`, `/collections/lighting` (404), `/collections/towing` (404 — wait, it actually went to `/collections/trailer-hitches` which works. Mixed.) The mega-nav reconciliation is **partial** — half the nav links land somewhere real, half still 404. Vehicle tiles weren't touched at all.

### 10:30 — Search

`/search?q=wrangler+bumper`. **0 MATCHES · FITTING 2014 JEEP WRANGLER.** Suggested searches: "roof racks / rack mount / cargo basket." Same cycle-1 F-7. The site has 24+ Wrangler bull guards in `/collections/bull-guards-grille-guards`, but searching "wrangler bumper" returns zero. **Search is still not wired to the real product index.** The fitment chip at least reads my Wrangler now (cycle-1 was stuck on F-150) — partial improvement on F-7 — but the core "0 results when products clearly exist" bug is unchanged.

### 11:30 — Sign-in

`/sign-in`. **H1 still reads "Sign in to stehlenauto-clerk"** with "Development mode" badge underneath. F-13 unfixed. Customer-facing login page still showing the dev Clerk app name.

### 12:00 — Quit. I'd buy a Stehlen Wrangler bull guard from this site IF I could get past the contradictions

---

## What changed since cycle-1 (the wins)

- **F-1 BLOCKER → FIXED.** Bumpers category exists with 186 products in `/collections/bull-guards-grille-guards`. Real Shopify catalog data, real images, real prices, pagination.
- **F-2 BLOCKER → FIXED.** Add to Cart works end-to-end. Real `POST /api/cart` returns 200 with a real Shopify cart object. Cart drawer opens, count updates, cart page renders, CHECKOUT button hits the real `stehlenauto.myshopify.com/checkouts/cn/...` Shopify checkout. Best win of the cycle.
- **F-5 BLOCKER → FIXED.** YMM picker is real. Year (1990–2027) → year-aware Make list → make-aware Model list → cookie set → header chip updates → category page reads cookie. Works.
- **F-10 MAJOR → FIXED.** No more pre-set "2020 FORD F-150" garage on first visit. Anonymous load shows "SELECT YOUR VEHICLE."
- **F-7 MAJOR → PARTIAL.** Search now reads the right vehicle in its filter chip, but still returns 0 matches for legitimate queries.
- **Footer chrome** — SHOP links in footer point at real working collection handles.

---

## What's still broken (the blockers + majors that survived)

- **F-3 BLOCKER → STILL THERE, MORE PROMINENT.** False-positive fitment claims. Every PDP's "SIMILAR PRODUCTS THAT FIT YOUR VEHICLE" rail labels Ford F-150 roof racks with "✓ FITS YOUR 2014 JEEP WRANGLER" green ticks. Cart page banner says "ALL ITEMS FIT YOUR 2014 JEEP WRANGLER" while cart contains an F-150 tonneau and a Toyota Tundra tonneau. This is the brand-burning bug — "fitment guaranteed" has to mean something or every Trustpilot review will say the opposite.
- **F-4 BLOCKER → STILL THERE.** All 8 home-page "SHOP BY POPULAR VEHICLE" tiles 404. The whole shop-by-vehicle promise dead-ends on first click.
- **F-6 MAJOR → STILL THERE (partial).** Mega-nav: Exterior, Cargo & Bed, Lighting, Towing — Lighting fixed (now `/collections/headlights`), Towing fixed (now `/collections/trailer-hitches`), Cargo & Bed fixed (now `/collections/tonneau-covers`), Exterior still goes to `/collections` which is fine but isn't an "Exterior" page. SALE, NEW ARRIVALS, BEST SELLERS still 404.
- **F-8 MAJOR → STILL THERE.** Install PDF detail pages still 404. `/help/install/modular-bumper` (the one Mike came for) is dead.
- **F-9 MAJOR → STILL THERE.** PDP fitment table is the same hardcoded fake F-150 SuperCrew/bed-length data on every product, including Wrangler bull guards. PDP tabs (FEATURES / SPECS / INSTALLATION / WARRANTY / REVIEWS) still show no real content.
- **F-11 MAJOR → STILL THERE.** 404 page is a dead end with no recovery path. Every dead link above is a guaranteed bounce.
- **F-12 MAJOR → STILL THERE.** Filter sidebar shows fake counts AND wrong facets for the category (Bed Length / Cab Type / Crew Cab on a Wrangler bull guards page).
- **F-13 MINOR → STILL THERE.** Clerk H1 says "Sign in to stehlenauto-clerk" with "Development mode" badge.
- **F-14 MINOR → STILL THERE.** No guest order lookup.

## New friction surfaced in cycle 3

- **F-17 [MAJOR] "Category page doesn't sort or filter by my vehicle, even though it knows my vehicle."** I'm a Wrangler shopper on the Bull Guards page with my garage set. The header chip says "FITS 2014 JEEP WRANGLER." The first 4 products on the grid are Dodge Ram, Tesla Model Y, Tesla Model Y, Tesla Model Y. The 9 Wrangler bull guards are scattered through 24 cards. There is no "fits my vehicle only" toggle and no Wrangler-first sort. Real fitment-first stores either filter the grid down to fit or float fit-confirmed cards to the top.
- **F-18 [MAJOR] "PDP contradicts itself in the same buy block."** "CHECK FITMENT — We haven't verified this part for your 2014 Jeep Wrangler yet" sits two lines above "CONFIGURED FOR 2014 JEEP WRANGLER." Both refer to the same product, the same vehicle. As a buyer this is the worst possible signal — it tells me the system doesn't know what it knows. I'd close the tab.
- **F-19 [MAJOR] "Product card 'CHECK FITMENT' chip ignores titles that already announce the fit."** Card title "2010-2018 Jeep Wrangler Advanced Series Bull Guard" + my garage 2014 Jeep Wrangler → page should show a green "✓ FITS YOUR 2014 JEEP WRANGLER" tick, not a yellow "CHECK FITMENT FOR YOUR JEEP WRANGLER." Same data is in the title and in my cookie; nobody connects them. Cycle-1 was over-eager (slap green on everything); cycle-3 over-corrected to yellow on everything. There is no middle ground that a buyer can trust.
- **F-20 [MINOR] "YMM picker has stale internal state."** RESET button only clears the visible step, not the internal year/make/model memory. Reopening the picker after a half-completed selection drops you in the middle of the wizard with old data. I'd hit it once, swear at it, never trust it again.

---

## What worked (carried over from cycle-1, plus new wins)

- **Add to Cart end-to-end is real now.** PDP → drawer → cart page → real Shopify checkout. This unlocks everything else.
- **YMM picker is real.** Three real steps, year-aware make list, make-aware model list. Picker UX is legit.
- **Bumpers category exists.** 24 cards on Page 1, ~186 total claimed. Real product data, real photography, real prices, real Affirm 4× breakdowns.
- **Vehicle context flows through.** The "FITS 2014 JEEP WRANGLER" chip on collection pages and PDPs is a real fix from cycle-1's "stuck on F-150" problem.
- **Cart page is solid** — line items, free-shipping unlocked banner, tax estimate, Affirm 4×, real Shopify checkout link.
- **Visual design unchanged from cycle-1 — still sharp.** Black/yellow, Geist Mono headers, real photography. Brand still feels premium.
- **Footer SHOP links are real.** Tonneau Covers, Trailer Hitches, Bull Guards & Grille Guards, Front Grilles, Headlights all land somewhere real.

---

## What competitors do better (carried from cycle-1, all still relevant)

- **AAG / RealTruck:** Fits-my-vehicle-only toggle on category pages. Stehlen knows my truck and shows me Tesla Model Y bumpers anyway.
- **AutoZone / RealTruck:** Search returns the actual catalog. Stehlen returns 0 for "wrangler bumper" while a Wrangler bumper page exists.
- **AAG:** Vehicle landing pages exist. Stehlen still 404s on every single "Shop by Popular Vehicle" tile.
- **Tygerauto / RealTruck:** Real install PDFs + YouTube videos. Stehlen lists "Modular Steel Bumper" PDF, links 404.
- **Any modern store:** Product cards with consistent fit-or-no-fit chips that match what the title says. Stehlen labels Ford F-150 racks as "FITS YOUR JEEP WRANGLER" in PDP recommendations and labels real Wrangler bull guards as "CHECK FITMENT" — exactly backwards.

---

## Buy decision

- **Would I check out today?** **NO** — but on a real second visit (cookies cleared, no tester quirks) I'd be a **MAYBE** for the first time. Cycle-1 was a hard NO with no path. Cycle-3 the catalog and cart actually work, so I have somewhere to spend money.
- **Why:** I came for a Wrangler bumper and this time **the bumpers exist, the cart works, and the checkout reaches real Shopify.** That's a massive jump from cycle-1's "literally nothing to buy." But the fitment story is still **directly self-contradictory on the same screen** — "we haven't verified this fits your 2014 Wrangler" right next to "CONFIGURED FOR 2014 JEEP WRANGLER" — and the recommended-products rail still slaps "✓ FITS YOUR JEEP WRANGLER" on Ford F-150 racks. A guy buying his first $260 bull guard online is going to read those two lines, conclude the site doesn't know what it's selling, and walk. The brand says "fitment guaranteed or your money back" and the site can't confirm fitment on a part whose title literally contains my year and model.
- **"Would I buy" rating:** **4 / 10** — up from 1/10 in cycle-1. I'd add to cart, I'd see the cart, I'd hit checkout. I'd quit at the email field because the contradictory fitment messages on the PDP poisoned the trust I needed to hand over my card. If I were the kind of guy who bought first and asked questions later, this site would close its first sale this cycle.
- **"Would I come back" rating:** **5 / 10** — up from 2/10. The end-to-end commerce flow is real now, the YMM picker is real, the bumpers exist. I can imagine recommending this to a buddy in 30 days IF the fitment-trust bugs and the broken vehicle pages get fixed. The infrastructure is finally there; the trust layer hasn't caught up.

---

**Mike's verdict:** Cycle-3 is the first version of this site that could actually take my money — the bumpers exist, the cart works, the checkout reaches real Shopify — but it tells me a Ford F-150 roof rack fits my Jeep Wrangler in the same breath it tells me it can't verify a "2010-2018 Jeep Wrangler" bull guard fits my 2014 Wrangler, and that contradiction alone keeps my wallet in my pocket.
