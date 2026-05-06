# MIKE — Mission 1: 2018 F-150 Soft Tonneau, Mobile

## Mission

Need a soft tonneau cover for my 2018 F-150 SuperCrew, 5.5' bed. Budget under $400. Want it shipped by Friday. Currently running a no-name generic cover I hate, want to upgrade to something that actually seals.

Truck: **2018 Ford F-150 XLT SuperCrew, 5.5' bed, 4WD** (the daily / work truck).

## Device + entry point

iPhone 14 Pro size — 390x844, mobile viewport.
Entry: `http://localhost:3000` — typed it in the address bar, like landing on the home page from a Google ad or a saved bookmark. Didn't come from a Google product result this time, just hit the home page direct.

## Walkthrough

**0:00** — Land on home. Big "BUILT TOUGH. BOLT ON. DRIVE OFF." hero. OK, it's a truck accessory site, I get it. Yellow "BOLT ON." letter color matches the brand. Looks legit, not slop. Hero image is a steel grille closeup — that reads "real shop" not "Etsy reseller". Trust signals are all over: free shipping, 30-day returns, lifetime warranty, fitment guaranteed. Good.

**0:04** — Wait. There's a vehicle pill in the header that says "**2020 FORD F-150 — CHANGE**". Hold on. Nobody asked me what truck I drive. I just got here. How does this site already think I have a 2020? My truck is a 2018. Is this someone else's session? Did the demo store leak garage state across users? Either way — this is a privacy / trust red flag. If this was a real session and I trusted that pill, I'd start shopping for the wrong year of parts.

**0:07** — There's also a "SHOP BY VEHICLE" widget in the hero with YEAR / MAKE / MODEL pills. They're labeled like dropdowns ("YEAR ▾"). Tap YEAR. Nothing opens. It just navigates me to `/collections`. Same for MAKE, MODEL, GET STARTED. They're all just links to the same page. **There's no actual YMM picker anywhere on this site as far as I can find.** It's three label pills pretending to be a dropdown. That's a lie.

**0:09** — I tap **CHANGE** on the vehicle pill in the header to fix the year. It dumps me on `/collections` (the Shop By Category index page). The pill in the header still says "2020 FORD F-150". No picker opened. No way to change vehicle. **I cannot tell this site I have a 2018, period.**

**0:12** — Fine, I'll just shop the Tonneau Covers tile. Tap it. Get to `/collections/tonneau-covers`. Big green pill at the top says "FITS 2020 FORD F-150". Two dropdowns: just "Sort by". **No filter for bed length, cover type (soft vs hard vs tri-fold), price, color — nothing.** On mobile this is brutal. I'm scrolling through 24+ products with no way to narrow.

**0:14** — Look at the products. Each card has a green "✓ FITS YOUR 2020 FORD F-150" badge. Then I read the names:

- "2022-2026 Ford F-150 Lightning 5.5 ft Bed" — Lightning is the EV. Mine isn't.
- "2015-2024 Ford F-150 6.5 ft Bed Soft Roll-Up" — wrong bed, mine is 5.5'.
- "2022-2026 **Toyota Tundra** 5.5 ft Bed Tonneau Cover Combo w/ LED Lights — ✓ FITS YOUR 2020 FORD F-150"

**Wait. What. A Tundra cover that says it fits my F-150?**

I scroll. It's a wall of Tundra covers. **22 of the 24 products on this page are Toyota Tundras. Every single one says ✓ FITS YOUR 2020 FORD F-150.** A Tundra cover does not fit an F-150. Different bed rails. Different bed dimensions. Different bolt pattern. If I bought one of these I'd open the box, find a Tundra-shaped cover, and start a return on day 2.

This is a deal-killer. The whole pitch of "FITMENT GUARANTEED" only works if the fitment badge actually means something. Right now the badge means "this product was on the page when we loaded it for your vehicle." The badge is lying. Hard.

If I scroll up and look at this without the badges I see at most 1 product that could possibly fit (the 6.5' soft roll-up — but my bed is 5.5', so even that's wrong). **Out of 24 covers shown, ZERO fit a 2018 F-150 SuperCrew 5.5' bed.** Catalog has a hole the size of my truck.

**0:17** — Let me click into the closest hit anyway: the "2015-2024 Ford F-150 6.5 ft Bed Soft Roll-Up" PDP. Now it gets weird:

- Page H1 says **6.5 ft Bed**.
- Big green box says "**CONFIRMED FITMENT — Fits your 2020 Ford F-150**".
- Compatibility table below says: "2015-2020 SuperCrew · **5.5' Bed → FITS**" and "2021-2026 SuperCrew · 5.5' Bed → FITS".
- Right above the Add to Cart it says "**UNIVERSAL FIT · NO SUB-MODEL CONFIG**".

So which is it? A 6.5' bed product (per the title), a 5.5' bed product (per the compat table), or a universal product (per the badge above the cart button)? **The product page is internally contradictory.** Three different stories on one page. I have NO IDEA whether to trust this product. As a real customer I close the tab here.

Also weird: the breadcrumb says "Tonneau cover lock & roll up" and links to `/collections/tonneau cover - lock & roll up` — with literal spaces and an `&` in the URL, unencoded. Tap it and you'd land on a 404. Sloppy.

**0:19** — I tap the "Change vehicle" button on the PDP fitment box hoping a picker will FINALLY open. Page navigates to `/collections/lighting` — which **404s**. Why would a "change vehicle" button take me to a 404 lighting page? This is the second time this session I've tapped a button and ended up somewhere completely unrelated. Routing is unstable.

**0:20** — Bounced. Time's up. I never:
- changed my vehicle to my actual 2018,
- found a single product that genuinely fits my truck,
- got near a working Add to Cart for a tonneau,
- saw any soft-vs-hard / price / brand filter on the collection page.

I gave up. This would be a hard pass on a real shopping trip.

## Friction log

- **F-1 [BLOCKER]** Tonneau collection page lies — 22 of 24 products are Toyota Tundra covers tagged "✓ FITS YOUR 2020 FORD F-150". This is the single most damaging issue. The fitment badge is meaningless if it lies on 90%+ of cards. This kills the brand promise of "Fitment Guaranteed" before the customer even reaches a PDP.
- **F-2 [BLOCKER]** No way to set or change my vehicle. Header pill is hardcoded "2020 FORD F-150" with no actual YMM picker accessible from anywhere. Tapping CHANGE goes to `/collections`. Tapping the home YEAR/MAKE/MODEL "dropdowns" goes to `/collections`. Tapping "Change vehicle" on a PDP goes to a 404 `/collections/lighting`. There is literally no functioning vehicle picker on this site for a customer who isn't already 2020 F-150.
- **F-3 [BLOCKER]** Catalog has zero soft tonneau covers that actually fit a 2018 F-150 SuperCrew 5.5' bed. The closest title (2015-2024 6.5') is wrong size; the only 5.5' option is the Lightning EV. Even if a customer fights through the bad UX, there is no inventory hit for the most common F-150 configuration on the road.
- **F-4 [MAJOR]** PDP shows three contradictory fitment stories at once: title says "6.5 ft Bed", compat table says "5.5' Bed FITS", in-page banner says "UNIVERSAL FIT · NO SUB-MODEL CONFIG". A customer cannot trust any of those three. I close the tab.
- **F-5 [MAJOR]** Collection page has zero filters beyond "Sort by". On mobile, with 22+ products visible (most of them mis-tagged), a customer cannot narrow by bed length, cover type (soft / hard / tri-fold / roll-up), price, or brand. RealTruck has a left-rail filter sheet that pops up with one tap. We have nothing.
- **F-6 [MAJOR]** Hero "SHOP BY VEHICLE" widget is fake — YEAR / MAKE / MODEL look like dropdowns (label has ▾), but they're plain links to `/collections`. Pretending to be a picker is worse than not having one.
- **F-7 [MAJOR]** Routing is genuinely unstable. Several times I tapped a button or ran a single page action and the page navigated itself somewhere unrelated — `/search?q=tacoma+bed+light` appeared once with no input, the home page got `?debug_analytics` appended out of nowhere, "Change vehicle" went to `/collections/lighting` which 404s. A real customer would think "this site is broken" and bounce in 8 seconds.
- **F-8 [MAJOR]** Cab type variant strip uses "CREW CAB / SUPERCAB / REGULAR CAB" but the compat table on the same page calls my truck a "SuperCrew". Ford's term is SuperCrew. SuperCab in Ford parlance is the smaller extended cab. A 2018 F-150 SuperCrew owner sees buttons CREW or SUPERCAB and doesn't know which to pick. Mismatched terminology between the buttons and the table.
- **F-9 [MINOR]** Hamburger menu hit target is 22x22px. Apple's minimum is 44x44. With work gloves on at the job site I can't tap that reliably.
- **F-10 [MINOR]** "FITS 2020 FORD F-150" pill on the collection toolbar is not tappable. If I want to change which vehicle I'm filtering for, I can't from here.
- **F-11 [MINOR]** Breadcrumb "Tonneau cover lock & roll up" links to a URL with raw spaces and an unencoded `&`. Will 404 if a customer ever clicks it.
- **F-12 [MINOR]** Bumpers & Guards collection: empty with "NO PRODUCTS YET — we're uploading bumpers from the warehouse." Honest, fine. But the home category tile sends me here with no warning. I waste a tap to find an empty page.
- **F-13 [MINOR]** Header vehicle pill leaks "2020 FORD F-150" to every visitor with no explanation. If this is a default placeholder, label it "(set your vehicle)". If it's a previous session, that's a privacy issue.
- **F-14 [MINOR]** No price chip / range visible on the collection toolbar. I want to scope to ≤$400. Can't do it.
- **F-15 [MINOR]** No "soft" vs "hard" filter on a collection literally called Tonneau Covers. Soft vs hard is THE primary axis for tonneau shopping, every competitor leads with it.

## What worked

- The PDP for the Stehlen-branded Door-Frame Roof Rack (where I got auto-bounced) actually had a clean variant strip with bed length and cab type buttons, a clear ✓/✗ compatibility table, an in-stock counter (47 in stock), and a delivery date promise ("Wed Apr 22 — Fri Apr 24 to 90210"). That's the right pattern. **If every PDP looked like that AND the badge actually told the truth, this site would be solid.**
- Trust signals are well placed: $25 off newsletter, free shipping over $99, 30-day returns, lifetime warranty, "previously on eBay · now direct". Reads as a credible established brand, not a dropshipper.
- The site looks good. Type, layout, hero photography all read premium-blue-collar. Visually I'd trust this place if the function caught up to the form.

## What competitors do better

- **RealTruck**: Mandatory YMM gate before you ever see product. You cannot shop without setting your vehicle. Once set, every collection page is filtered for real, and the badges mean what they say. Filters on the left for type (soft/hard/tri-fold/retractable), brand, price. On mobile it's a sheet that slides up. You get to a fitting product in 3 taps.
- **AutoZone / RockAuto**: When you don't have a YMM set, they ASK on the first page view in a single full-screen modal you can't ignore. Once set, it's sticky across the whole session. Stehlen's silent default of "2020 FORD F-150" with no way to change is the worst of both worlds.
- **AAG (American Auto Garage)**: Every PDP has a "Will this fit?" inline confirm box where you punch in YMM right there and get a yes/no back, even if you skipped the global gate. Stehlen has a "VERIFY FITMENT FOR MY VEHICLE" link but it just sends you back to `/collections` — same dead end.
- **Tyger Auto / BAK Industries**: Tonneau collection pages lead with big SOFT / HARD / RETRACTABLE / FOLDING tiles before any product list, so you triage by cover type first. Stehlen dumps everything into one bucket and gives you only "Sort by".

## Buy decision

- **Would I check out today?** **NO.** Not even close.
- **Why:** I literally could not find a single product that fits my truck. The site can't even let me tell it what my truck is — the vehicle pill is hardcoded to a 2020 I never set, and every "change vehicle" path is broken. The collection page promises me 24 products that fit my F-150 but 22 of them are Toyota Tundras with a green ✓ badge slapped on. I don't trust a single fitment claim on this site after the first scroll. The one PDP I did open contradicted itself three times in three sentences. If this was real money I'd have closed the tab in under a minute.
- **"Would I buy" rating:** **1/10** — and the 1 is for the brand visuals, not anything functional.
- **"Would I come back" rating:** **2/10** — I'd come back IF a friend swore the site fixed the fitment lies, and I knew exactly which product I wanted. Cold-shopping it again? No.

---

Mike's verdict: Don't tell anyone to shop here yet — the fitment badge lies, the YMM picker doesn't exist, and there's no actual product for the most common F-150 in America.
