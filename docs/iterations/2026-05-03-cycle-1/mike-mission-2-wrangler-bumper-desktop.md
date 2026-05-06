# Mike Mission 2 — Wrangler Bumper Browse (Desktop)

**Tester:** Mike Rodriguez (41, Phoenix AZ landscaper, 3-truck garage)
**Date:** 2026-05-02 evening, on the laptop after dinner
**Session length:** ~14 minutes (cut short — site couldn't sell me what I came for)

---

## Mission

Browsing tonight. Thinking about upgrading the front bumper on my **2014 Jeep Wrangler Sport Unlimited (4-door, JK gen)**. Not buying tonight unless something blows me away. Want to see what fits, what brands, what installation looks like.

## Device + entry point

- **Device:** Desktop, 1440 × 900 (Mac, Chrome via Playwright)
- **Entry point:** `http://localhost:3000` (typed in directly — pretending I clicked "stehlenauto.com" from a Google result for "2014 jeep wrangler bumper")

> **Tester note about the harness:** This Playwright session was unstable. The viewport reset to 390 × 844 every time `browser_take_screenshot` ran (even with `fullPage: false`), and several queued click events fired across navigations, which caused the URL to jump unexpectedly between calls. I worked around it by re-resizing to 1440 × 900 and re-navigating before every observation, and by reading the DOM via `evaluate` instead of trusting screenshots. The findings below are what a real desktop customer at 1440 × 900 would experience, validated against the live DOM (`window.innerWidth === 1440` confirmed before each read).

---

## Walkthrough

### 0:00 — Land on home

Big black hero. "STEHLEN AUTO · SINCE 2015. BUILT TOUGH. BOLT ON. DRIVE OFF." Yellow accent on "BOLT ON." Hero photo of a powder-coated grille / rack. Looks legit. Pro look. I scan top right — there's a **garage chip that already says "2020 FORD F-150."** That's not me. Whose truck is that? Pre-set demo data, I guess. I'll change it.

Headline copy is good. The three trust badges down the side ("Free shipping $99+ / 30-day returns / Lifetime warranty") — I like those. Familiar pattern. The "PREVIOUSLY ON EBAY · NOW DIRECT" microcopy at the very top right is smart — that's me. I bought a Stehlen rack on eBay 4 years ago.

### 0:15 — YMM picker in hero — try to set my Wrangler

In the hero there's a card that says "SHOP BY VEHICLE · FITMENT GUARANTEED" with three boxes labeled YEAR / MAKE / MODEL and an orange GET STARTED button. Cool. I click YEAR.

I land on `/collections`. Just a grid of 12 category tiles — no YMM dropdown anywhere on this page. Wait, did the YEAR thing not work? I open the page and inspect — **all four "boxes" (YEAR, MAKE, MODEL, GET STARTED) are just `<a>` links pointing to `/collections`.** No dropdown ever opens. The YMM picker in the hero is **fake — purely visual.** The second YMM picker sitting just below the hero (a gray bar with "YEAR ▾ MAKE ▾ MODEL ▾ SEARCH") — same thing, six fake links.

OK so the only real way to pick my truck is the garage chip top-right. Try that.

### 0:45 — Garage chip in header

I click the chip ("2020 FORD F-150 · CHANGE"). On hover/click, no visible modal pops in this run — but a cart drawer opens (probably my mouse hit the cart icon in a queue event). Restart, navigate by URL. Headed straight to `/collections/vehicle/jeep-wrangler` because the home page has a "SHOP BY POPULAR VEHICLE" rail with a tile that says "JEEP Wrangler 2007–2026 · 174 PARTS." Good — a deep link.

### 1:00 — Click "JEEP Wrangler · 174 PARTS" tile

**404. Page could not be found.** Just "404 / This page could not be found." centered on a dark page. **No back button, no recovery, no "browse other vehicles" CTA.** Just dead.

I check every tile in that rail. They all link to `/collections/vehicle/<make>-<model>`. I sample-fetch them — **every single one is a 404**: ford-f-150, chevrolet-silverado, ram-1500, toyota-tacoma, jeep-wrangler, toyota-tundra, gmc-sierra, nissan-frontier. **All 8 vehicle tiles on the home page are broken links.**

For a "Shop by Vehicle" promise, this is a kill-shot. Half the home page above the fold is for shopping by vehicle, and the other half is shop-by-category — and the shop-by-vehicle path leads to nothing. Mike: "If I can't even land on a Wrangler page, what am I doing here?"

### 2:15 — Back up. Go to Bumpers & Guards from category tiles

Home → "SHOP BY CATEGORY" rail → "Bumpers & Guards" → `/collections/bumpers`.

Page loads. Heading: **"BUMPERS & GUARDS / Heavy-duty front and rear steel bumpers. Cold-rolled steel, e-coated and powder-coated for off-road and overland builds."** Good headline copy.

Then a green chip: **"✓ FITS 2020 FORD F-150"** — that's the auto-applied filter from the wrong garage vehicle. So even if there were product, it'd be filtered to F-150 fitment, not Wrangler.

Then a gorgeous filter sidebar (Bed Length / Cab Type / Color / Material / Price / Brand) with counts (e.g., "Black 86, Steel 72, Stehlen Pro 54"). All the sidebar categories show plausible-looking counts.

But the main result panel says: **"NO PRODUCTS YET / We're uploading bumpers & guards from the warehouse — check back soon, or browse other categories."**

So the sidebar is showing fictional facet counts (86 Black bumpers!) on a category that has zero actual products. That's worse than empty — it lies twice (counts that don't exist; vehicle filter for the wrong vehicle).

### 3:00 — Spot-check the rest of the catalog

Out of 12 categories on the site:
- **roof-racks**: 12 product cards
- **tonneau-covers**: 24 product cards
- bumpers, grilles, bed-lights, fender-flares, running-boards, hitches, bed-mats, sport-bars, tail-lights, recovery: **all empty** ("NO PRODUCTS YET")

So 10 of 12 categories are empty.

Plus the header nav "SALE" and "NEW ARRIVALS" links — both `/collections/sale` and `/collections/new` (and `/collections/best-sellers` from the hero CTA) — **all 404.**

Plus the four mega-menu category triggers in the top nav — Exterior, Cargo & Bed, Lighting, Towing — link to `/collections/exterior`, `/collections/cargo-bed`, `/collections/lighting`, `/collections/towing`. **All four 404.**

Tally on broken links surfaced from the home page chrome alone: **8 vehicle tiles + 6 nav links + 1 BEST SELLERS CTA = 15 dead links a buyer can hit in the first 30 seconds.** That's not a soft launch — that's a site that should not be public.

### 3:45 — Try search

URL bar: `/search?q=wrangler+bumper`. Page loads — H1: "RESULTS FOR 'WRANGLER BUMPER'." Below: **"0 MATCHES · FITTING 2020 FORD F-150."**

Wait — I typed "wrangler" in the query and you're still filtering by F-150? The keyword in the search literally specifies a vehicle — that should override the saved garage. Even AAG and AutoZone do this right.

Suggested searches: "roof racks / rack mount / cargo basket." None of those are bumpers. Nobody searching "wrangler bumper" wants a rack.

I try `/search?q=jeep`. Same thing — 0 matches, "FITTING 2020 FORD F-150." So even the broadest query produces nothing because of the stuck filter, even though the home rail advertises **"JEEP Wrangler · 174 PARTS"** in big yellow text. **The site says it has 174 Wrangler parts and search returns zero.**

### 5:00 — OK, let me see ONE PDP that exists

Click into the door-frame mount roof rack (the only product I can reach reliably).

PDP looks pretty good at first glance. SKU shown. Good price ($489, was $549 — SAVE $60), Affirm 4× breakdown, "47 in stock," 4.7 stars (128 reviews), green "CONFIRMED FITMENT · Fits your 2020 Ford F-150 · Engineered for direct bolt-on installation" badge. Variant strips for Bed Length (5'/5.5'/6.5'/8') and Cab Type (Crew Cab/SuperCab/Regular Cab) — clean.

Trust strip: "Free shipping · Arrives Wed Apr 22 — Fri Apr 24 to 90210 / 30-day returns / Lifetime structural warranty / Drilling-free install · 60–90 minutes with 2 people." That's exactly what I want to see — ETA, install time, warranty all visible above the fold. Good.

Section anchors: FITMENT / FEATURES / SPECS / INSTALLATION / SHIPPING / WARRANTY / REVIEWS (128). I click through and scroll — all sections show the **same content**: a "VEHICLE COMPATIBILITY" table. There are no install steps, no spec sheet, no actual reviews, no warranty terms inline. Just a fitment table everywhere. So either the tabs aren't wired or the content's blank — either way as a buyer I get nothing for the SPECS / INSTALLATION / WARRANTY tabs that the labels promised.

Vehicle compatibility table itself:
- 2021–2026 SuperCrew · 5.5' Bed → FITS
- 2015–2020 SuperCrew · 5.5' Bed → FITS
- 2014 Crew Cab · 5.5' Bed → FITS
- 2009–2013 All bed lengths → DOESN'T FIT

I open a different PDP (a 6.5 ft tonneau). **Same exact compatibility table** — 5.5' bed configs only, even though the product is a 6.5' bed cover. So the fitment table is hardcoded placeholder data, identical on every PDP. Promise is "every product page lists exactly which years, makes, models, and sub-models a part fits" — reality is one fake table copy-pasted across the catalog.

### 7:30 — Add to cart

I click the orange "ADD TO CART · $489.00." Nothing visibly happens. No toast, no cart count update, no drawer opens, no spinner — just dead. Network tab tells me **`POST /api/cart` returned 422 Unprocessable Entity.** Cart never receives the item. Silent failure to the customer.

This is the worst kind of bug — there's no error message. As Mike, I clicked the buy button, nothing happened, I'd refresh, click again, nothing again, and bounce. Probably blame my browser. No way I'd buy.

### 8:30 — Look at the tonneau collection (the only well-populated one)

`/collections/tonneau-covers` — 24 cards. Every single one has a green "✓ FITS YOUR 2020 FORD F-150" badge. I read the titles:

- "2022-2026 Ford F-150 **Lightning** 5.5 ft Bed Tonneau Cover" — Lightning is the EV; doesn't fit a regular 2020 F-150
- "2015-2024 Ford F-150 6.5 ft Bed Soft Roll-Up" — fits
- "2022-2026 **Toyota Tundra** 5.5 ft Bed Tonneau Cover Combo w/ LED" — **NOT a Ford**
- "2014-2021 **Toyota Tundra** 6.5 ft Bed Tri-Fold Tonneau Cover w/ LED Kit" — NOT a Ford
- "2014-2021 Toyota Tundra 6.5 ft Bed Soft Tri-Fold" — NOT a Ford
- (… and 6+ more Tundras, all marked "FITS YOUR 2020 FORD F-150")

So the fitment badge is **applied to every product card unconditionally**, even when the product title literally says it's for a different make. **A Toyota Tundra cover marked as fitting a Ford F-150 is not "fitment guaranteed" — that's "fitment guaranteed to be wrong."**

If a customer buys a Tundra cover trusting the F-150 badge, opens the box, and finds it doesn't fit — that's a return, a chargeback, and a 1-star review across Google / Trustpilot / Reddit. This is the single most damaging bug on the site for a fitment-promise brand.

### 10:30 — Install guides — would help me decide if I'm comfortable installing a bumper

Footer → "Installation Guides" → `/help/install`. Solid landing page. Five-step example. List of 4 PDFs at the bottom: Door-Frame Roof Rack / Modular Steel Bumper (8 pages, 60–90 min) / Lock & Roll-Up Tonneau / LED Bed Light Kit. **"Modular Steel Bumper"** — exactly what I came for!

Click it → `/help/install/modular-bumper` → **404.** All four PDF links 404. So the install-guide hub page exists with a list, but every detail page is missing. I'd assume the "PDFs" are vaporware.

### 11:30 — Returning customer trust

I'm an ex-eBay buyer, so the "Welcome Back" page is the most relevant trust path. I open `/welcome-back`. Solid page. WELCOME10 code, three short testimonials with vehicle context (Mike R / 2019 F-150, Dale W / 2021 Silverado, Carlos T / 2017 Wrangler — nice, my truck is represented), real reasons (lower price, faster ship, real techs). This page punches above its weight. 

But "START SHOPPING" CTA dumps me back into the broken catalog where 10/12 categories are empty and the YMM doesn't work. So the trust win evaporates the moment I leave this page.

### 12:30 — Order status / sign-in

Header → Order Status → redirects to Clerk sign-in. The Clerk login title says **"Sign in to stehlenauto-clerk"** — that's the dev Clerk app name leaking to the customer. Looks unfinished.

No guest order lookup at all (enter order # + email). For someone like me — bought 4 years ago on eBay and just discovered the "now direct" thing — there's no way to track an order without making an account. AAG and RealTruck both let you order-status as a guest.

### 13:30 — Quit. Bumpers don't exist for me here. The site can't sell me anything.

---

## Friction log

- **F-1 [BLOCKER]** "I came for a bumper — the bumpers category is empty." 10 of 12 product categories show "NO PRODUCTS YET." Bumpers, grilles, bed-lights, fender-flares, running-boards, hitches, bed-mats, sport-bars, tail-lights, recovery — all empty. Only roof racks (12) and tonneau covers (24) have any product. There is literally nothing to buy on a bumper-shopping mission.

- **F-2 [BLOCKER]** "Add to Cart silently fails." `POST /api/cart` returns **422**. No toast, no drawer, no count change. Even on the products that do exist, you can't add them to cart. Buy flow broken end-to-end.

- **F-3 [BLOCKER]** "Every Tundra tonneau is labeled 'fits your F-150'." Fitment badge is applied to every product card without checking the product title/tags. Fitment Guarantee policy says we list exact YMM compatibility — reality says we slap "fits your truck" on whatever. This single bug burns the entire brand promise.

- **F-4 [BLOCKER]** "Every vehicle tile on the home page is a 404." All 8 "SHOP BY POPULAR VEHICLE" links (Ford F-150, Silverado, Ram 1500, Tacoma, Wrangler, Tundra, Sierra, Frontier) are dead. The whole "Shop by Vehicle" promise dead-ends.

- **F-5 [BLOCKER]** "The YMM pickers on the home page are fake." Both YMM cards in the hero (YEAR / MAKE / MODEL / GET STARTED + the secondary "YEAR ▾ MAKE ▾ MODEL ▾ SEARCH" bar below the hero) are styled to look like dropdowns but are actually six `<a>` tags that just link to `/collections` (a category-tile page with no YMM picker either). The site has no working YMM lookup anywhere a customer can find.

- **F-6 [MAJOR]** "Top-nav category links are broken." `/collections/exterior`, `/collections/cargo-bed`, `/collections/lighting`, `/collections/towing`, `/collections/sale`, `/collections/new` — all 404. Six broken links in the primary navigation chrome.

- **F-7 [MAJOR]** "Search ignores the vehicle in my query and force-applies the wrong garage." Searching "wrangler bumper" returns "0 MATCHES · FITTING 2020 FORD F-150." Searching just "jeep" — same thing. The search filter is locked to whatever's in the garage even when my query specifies a different vehicle.

- **F-8 [MAJOR]** "Install PDF links 404." Install guides hub exists, lists four PDFs (including the bumper one I want), every detail page 404. So the PDFs are vaporware. Hurts the install-confidence story.

- **F-9 [MAJOR]** "PDP tab content is fake — every PDP shows the same hardcoded fitment table." FITMENT / FEATURES / SPECS / INSTALLATION / SHIPPING / WARRANTY / REVIEWS labels exist but the content under them is one identical fitment table copied across products. A 6.5' tonneau and a roof rack both show the same "5.5' Bed" compatibility table. As a buyer I have no way to see real specs, install steps, or reviews.

- **F-10 [MAJOR]** "Garage starts pre-set to '2020 FORD F-150' for everyone." That's not me. I'm a Wrangler shopper. The whole site is filtered to a vehicle I don't own and I have to manually unset it. Anonymous first visit should be NO vehicle, with the YMM picker prominent.

- **F-11 [MAJOR]** "404 page is a dead end." Just "404 / This page could not be found." No back-to-home link, no search box, no popular categories, no recovery path. Every dead link is a guaranteed bounce.

- **F-12 [MAJOR]** "Filter sidebar lies about counts." On `/collections/bumpers` (which has zero products), the sidebar shows "Black 86, Matte Black 24, Steel 72, Stehlen Pro 54." Fake facet counts.

- **F-13 [MINOR]** "Sign-in title says 'Sign in to stehlenauto-clerk'." The Clerk dev app name leaks to the customer-facing login page. Looks unfinished/unprofessional.

- **F-14 [MINOR]** "No guest order lookup." Returning eBay buyer can't check an order status without creating a Clerk account. AAG, RealTruck, AutoZone all support guest order lookup.

- **F-15 [MINOR]** "React hydration mismatch errors in console" on collection pages and footer (FilterSidebar checkbox style props and Footer email input style props — string vs number unit mismatches). Won't break the page but signals SSR fragility.

- **F-16 [MINOR]** "PDP 'tabs' aren't tabs — they're inline section markers." The label looks tabbable, behavior is just scroll. Standard pattern is fine but mixing the look of tabs with anchor behavior is confusing.

---

## What worked

- **Visual design is sharp.** Black, yellow accent, Geist Mono uppercase headers, real product photography on category tiles. Looks more premium than RealTruck or AAG. Brand feels legit at a glance.

- **Welcome-back page is excellent.** Clear value prop, real-feeling testimonials with vehicle context (and a Wrangler driver in the lineup), code visible (`WELCOME10`), single CTA. If I'd come from a "now direct" Klaviyo email, this page would convert me on copy alone.

- **Trust strip on the PDP is best-in-class.** "Free shipping · Arrives Wed Apr 22 — Fri Apr 24 to 90210 / 30-day returns / Lifetime structural warranty / Drilling-free install · 60–90 minutes with 2 people" — exactly the four things I want to know above the fold. Better than RealTruck.

- **Help/Support landing page is well-organized** — six clear support categories, four short FAQs, big "TALK TO A REAL PERSON · MESSAGE / 1-888-378-4536" at the bottom. 

- **Affirm 4× breakdown shown next to every price.** Standard now but executed cleanly.

- **Variant strips on the door-frame roof rack PDP** (Bed Length, Cab Type) are visually clean and obvious.

---

## What competitors do better

- **RealTruck:** YMM picker actually works on hero. You pick year → make populates → model populates → bed length populates, and you land on a real filtered grid. That's table stakes for a fitment-first brand.

- **AAG (americantrucks.com):** Vehicle landing pages exist and are populated. Click "Wrangler JK" and you get a real catalog with categories nested inside the vehicle context. Stehlen has 8 dead vehicle URLs.

- **AutoZone:** Search respects the keyword. Type "wrangler bumper" and the saved-vehicle filter is overridden by the more-specific query. Stehlen returns zero matches and recommends "roof racks."

- **AAG / RealTruck:** Guest order lookup. Enter order # + email or zip → see status. Stehlen forces Clerk sign-up.

- **Tygerauto / RealTruck:** Real install PDFs are downloadable and most have a YouTube video embed at the top of the install page. Stehlen lists fake PDFs that 404.

- **AAG product cards:** Show "Fits your 2014 Wrangler JK 4-door" specifically when it actually fits, and "Verify fitment" when it's universal. Stehlen slaps "✓ FITS YOUR 2020 FORD F-150" on Toyota Tundra products.

- **Any e-commerce site built in the last decade:** Add-to-cart returns a visible state change. Toast, drawer, count, anything. Stehlen silently 422s.

---

## Buy decision

- **Would I check out today?** **NO.**
- **Why:** Three reasons, any one of which is fatal: (1) the bumpers category I came for is literally empty, (2) when I tried to add the one product I could find to cart, the button silently failed, and (3) the fitment badges are blatantly wrong — a Tundra cover is labeled as fitting an F-150, and I bought enough wrong parts on eBay to know what that means. I wouldn't trust this site with my credit card even if the cart worked.
- **"Would I buy" rating:** **1 / 10** (only because the visual design is good enough that I'd return *if* the catalog and cart worked)
- **"Would I come back" rating:** **2 / 10** (the welcome-back page hooks me emotionally — "same parts, lower price than eBay" — so I might give it one more shot in 60 days, but if it's still this broken I'm gone for good)

---

**Mike's verdict:** This site looks like a million bucks and works like a busted demo — pretty enough to walk in, broken enough that I'm leaving with my wallet still in my pocket and not telling a single buddy to check it out.
