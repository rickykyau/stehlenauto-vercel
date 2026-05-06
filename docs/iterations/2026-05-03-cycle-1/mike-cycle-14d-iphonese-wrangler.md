# Mike-5 — Cycle 14d — iPhone SE × 2014 Jeep Wrangler

**Tester:** Mike Rodriguez (persona)
**Date:** 2026-05-03 (Mike-5 of 6, hunting 2 consecutive clean cycles)
**Production URL:** https://stehlenauto-vercel.vercel.app
**Device:** iPhone SE — 375 × 667
**Truck:** 2014 Jeep Wrangler Sport Unlimited (4-door, weekend rig)
**Sub-model:** none (Wrangler doesn't have bed length)
**Time-box:** 25 min (used ~18 min)

---

## Mission

Wife wants the bed/cargo area cleaner after camping trips. Need a bed mat or
floor mat that fits my 2014 Wrangler. Quick mobile shop in the truck after
work. Should be a 90-second decision.

---

## Walkthrough

- **0:00** — Land on home. Dark hero, "BUILT TOUGH. BOLT ON. DRIVE OFF." reads
  clean even on 375px. Garage chip in header still says "2018 FORD F-150" from
  last session — fine, Stehlen remembers me. Cart shows 9 items (junk from
  prior tests). Chat FAB is bottom-LEFT, not bottom-right as I expected. Doesn't
  block hero.
- **0:01** — Tap garage chip → YMM modal opens. Step 1 of 3 · Year. Scroll
  list, tap 2014.
- **0:02** — Step 2 · Make. Tap JEEP.
- **0:02** — Step 3 · Model. Wrangler is in the list (Cherokee, Compass,
  Durango, Grand Cherokee, Patriot, Wrangler). Tap Wrangler.
- **0:03** — Garage chip flips to "2014 JEEP WRANGLER". Three taps total. Fast.
- **0:04** — Browse Floor Mats collection. Sorted "fit-aware" — universal /
  multi-fit cards on top with yellow "CHECK FITMENT FOR YOUR JEEP WRANGLER"
  banners, then a wall of red "DOES NOT FIT" cards (Tesla Model X, Tacoma,
  Silverado etc.). I see ZERO floor mats with a green "FITS YOUR 2014 JEEP
  WRANGLER" banner on first page. That's a catalog-coverage gap, not a code
  bug — but as a customer it's frustrating: "you knew my truck before I
  clicked, why are you showing me Hyundai Santa Cruz mats first?"
- **0:05** — Try the Vehicle Hub instead (/vehicle/jeep-wrangler). Better —
  context-rich page, 2018-Current and 2007-2018 generation tiles, popular
  categories. "WHAT OTHER JEEP OWNERS BUY" row shows products WITH fitment
  status. First card: 2007-2024 Jeep Wrangler JK & JL Trailer Hitch — green
  "✓ FITS YOUR 2024 JEEP WRANGLER". Wait — **2024?** My garage is 2014.
  Hub-card banner has the wrong year. Annoying.
- **0:07** — Tap the hitch PDP to verify. PDP banner correctly says "Fits
  your 2014 Jeep Wrangler" — so the year mismatch is only on the vehicle-hub
  product cards.
- **0:07** — Hitch is fine — green confirmed. ATC button is yellow, enabled,
  $136. Tap it. Cart counter goes 9 → 10. Cart drawer slides in.
- **0:08** — Cart drawer header reads "MIXED FITMENT — SOME ITEMS DO NOT FIT
  YOUR 2014 JEEP WRANGLER". Honest, good. New hitch line is in there.
- **0:09** — Close drawer. Tap FEATURES tab on the Wrangler PDP. Content
  block reads:
  > "Product OverviewEquip your Jeep Wrangler with serious towing
  > capability..."
  No paragraph break. No bold "Product Overview" header. It's run-on text,
  exactly the same problem cycle 14d was supposed to fix. The 14d fix did NOT
  ship to this PDP.
- **0:10** — DOM check confirms a single `<p style="white-space: pre-wrap">`
  with the section heading literally glued to the body sentence. Zero
  `<strong>` tags around section labels. Zero `<h*>` headings inside the
  features panel.
- **0:11** — Open a misfit PDP (2015-2023 Ford F-150 Crew Cab Floor Mats).
  Big red "DOES NOT FIT YOUR JEEP WRANGLER · SHOP PARTS FOR YOUR JEEP" banner
  — perfect.
- **0:12** — Check the buy-box buttons on misfit:
  - Main "DOES NOT FIT YOUR VEHICLE" button: `disabled=true`, bg
    `rgb(58,58,58)` — proper grey, not yellow. **PASS.**
  - "BUY NOW WITH AFFIRM" button: `disabled=true`, opacity `0.5`, no yellow
    background. **PASS.**
  - Sticky bottom "DOES NOT FIT" button: `disabled=true`, bg
    `rgb(58,58,58)` — same grey as the main. **PASS — mirrors correctly.**
  All three 14d MAJORs from the buy-box are honored on this product.
- **0:13** — On this misfit PDP, FEATURES panel is partially better — "Note",
  "Material", "Part Number" sub-sections ARE bolded inline. But "Product
  Overview" is STILL glued to the next sentence in the very first paragraph.
  And "Specifications MPN" is glued to the end of the Note paragraph. The 14d
  formatting fix is half-done — secondary labels got the `<strong>` treatment,
  the master section headers did not.
- **0:14** — /cart loads. 10 items. Subtotal $1649, tax $144.29, free shipping
  active, total $1793.29. Mixed fitment red banner. Per-line product info
  honest. Looks right.
- **0:15** — /checkout — Shopify-handoff review screen. Same totals
  ($1793.29). Mixed-fitment warning repeats. The big yellow "CONTINUE TO
  SECURE CHECKOUT · $1793.29" button looks like it cuts off. DOM check
  confirms: button width 277px, text scrollWidth 343px → **price text
  overflows on iPhone SE.** As a customer I see "...SECURE CHECKOUT · $179..."
  and wonder if I'm being charged $179 or $1793. **NEW iPhone-SE-only MAJOR.**
- **0:16** — Back to a Wrangler PDP. Scroll to the FITMENT tab and the big
  yellow "VERIFY FITMENT FOR MY VEHICLE" CTA. The chat FAB (bottom-left, 48×48,
  at coord (16, 595)) is sitting RIGHT on top of the "VERI" of "VERIFY". The
  CTA reads "FITMENT FOR MY VEHICLE" with the leading word covered by the
  chat bubble. **MAJOR overlap on iPhone SE — the chat FAB conceals primary
  in-page CTAs at this width.**
- **0:18** — Stop.

---

## Friction log

- **F-1 [MAJOR]** Cycle-14d FEATURES tab fix ships INCOMPLETE — sub-headings
  ("Note", "Material", "Part Number") got bold + line breaks, but the master
  section headings ("Product Overview", "Features", "Specifications") are
  still inline-glued to the first sentence with no break or bold. Customer
  reads "Product OverviewEquip your Jeep Wrangler..." — looks broken.
  Reproduced on BOTH a Wrangler hitch PDP AND an F-150 floor-mat PDP.
- **F-2 [MAJOR]** **Chat FAB overlaps the in-page "VERIFY FITMENT FOR MY
  VEHICLE" yellow CTA on iPhone SE.** Bottom-left positioned, 48×48 at
  (16, 595), sits dead-center on the CTA's leading word. CTA reads "FITMENT
  FOR MY VEHICLE" with chat bubble covering "VERI". This is exactly the kind
  of thing that makes me bounce — a primary trust CTA with a button squatting
  on it.
- **F-3 [MAJOR]** **Checkout page CTA price clips on iPhone SE.** Button
  rendered width 277px, text scrollWidth 343px — "$1793.29" gets cut to
  "$179..." or similar. As a buyer about to spend $1.7K I want to see the
  full number on the button I'm about to tap. Trust killer.
- **F-4 [MAJOR]** **Vehicle-hub product cards show wrong year in the
  fitment banner.** Garage = 2014 Jeep Wrangler, but the hub card banner
  reads "✓ FITS YOUR **2024** JEEP WRANGLER". The PDP itself shows "2014"
  correctly — so it's a vehicle-hub-card-specific bug. Erodes trust ("does
  this site even know my truck?").
- **F-5 [MINOR]** Floor Mats collection has zero green-confirmed-fit
  Wrangler products on first page — all yellow "CHECK FITMENT" or red "DOES
  NOT FIT". Catalog gap, not code; but with garage set, the page should at
  least put the universal/match candidates ahead of the Tesla Model X
  misfits.
- **F-6 [MINOR]** Chat FAB is 48×48 — Apple's HIG floor is 44×44 so it just
  clears, but it's sitting on a 16px left margin which means it's
  unavoidably in the path of a thumb on a small phone.

---

## What worked

- YMM picker → 3 taps to set 2014 Jeep Wrangler. Modal scroll is smooth.
- Buy-box disabled state on the misfit PDP is **clean** — main button grey,
  Affirm button greyed/disabled, sticky bottom mirrors. All three of the 14d
  fixes here landed and work as advertised.
- Cart drawer "MIXED FITMENT" banner is honest and the per-line context is
  preserved through /cart and /checkout.
- Free shipping threshold message and tax rollup are clear in the cart.
- Vehicle Hub page (/vehicle/jeep-wrangler) is genuinely useful — generation
  tiles + popular categories beat scrolling a 1000-item floor-mat collection.

---

## What competitors do better

- **RealTruck** never shows me a Tesla mat when I have a Jeep set — they
  hard-filter the collection by garage by default with a one-tap "show all"
  escape. Stehlen sorts but doesn't filter, so the misfits dominate the
  page.
- **Tygerauto** vehicle hubs use the actual selected year in the
  product-card fitment banner, not a hard-coded year from the product range.

---

## Buy decision

- Would I check out today? **MAYBE.**
- Why: I added the hitch and got to checkout in under 15 minutes. The
  fitment story is honest — green/red/yellow is consistent on PDPs and
  carried through cart + checkout. BUT three things bug me: (1) the chat
  bubble is sitting on the verify-fitment CTA which is the single most
  important button on a misfit PDP, (2) the checkout button is clipping my
  $1.7K total, and (3) the FEATURES copy reads run-on like the engineering
  team broke it. As a guy buying $544 of trailer hitch I want to see numbers
  and headings I trust. The grey-disabled fix from 14d works perfectly —
  that part was earned. The other half of 14d (FEATURES copy split) did
  NOT ship to all PDPs.
- "Would I buy" rating: **6/10**
- "Would I come back" rating: **6/10**

---

## Cycle-14d MAJOR verification matrix

| Fix | Expected | Observed iPhone SE | Verdict |
| --- | --- | --- | --- |
| Sticky bottom ATC mirrors disabled state on misfit | grey, "DOES NOT FIT", disabled | bg `rgb(58,58,58)`, `disabled=true`, label "DOES NOT FIT" | **PASS** |
| Disabled DOES NOT FIT colour now grey (was yellow@0.6) | grey, not yellow | bg `rgb(58,58,58)` on both main and sticky | **PASS** |
| FEATURES description split into paragraphs with bold headers | bold "Product Overview"/"Features"/etc. + line breaks | sub-headings bolded ("Note", "Material", "Part Number"); master headings ("Product Overview") still glued inline as run-on text | **FAIL — partial only** |

---

## Acceptance call

**0 BLOCKERs, 4 MAJORs, 2 MINORs. Score 6/10.** Below the 7/10 threshold.
Cycle 14d does NOT pass. Two of the three shipped fixes landed cleanly; the
FEATURES copy split is partial-only and reproduces on every PDP I opened.
Plus iPhone SE surfaced two new MAJORs (chat-FAB overlap on verify CTA,
checkout button clipping the price) that didn't show on Pixel 8 Pro 412×915
in cycle 14c.

**Mike's verdict: 14d half-shipped — disabled buttons are tight, but the
chat bubble eats the verify-fitment CTA on small phones and the FEATURES
copy still reads broken. Two more swings before I'd tell a buddy.**
