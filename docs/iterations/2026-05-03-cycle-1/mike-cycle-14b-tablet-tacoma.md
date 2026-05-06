# Mike Rodriguez — Cycle 14b Verify · iPad Mini 768 · 2022 Tacoma · Roof Rack

## Mission

Wife's 2022 Toyota Tacoma TRD Off-Road, Double Cab, 5' bed already has the
factory bed rack but the cross-bars are useless for our coolers. Looking for a
low-profile roof rack / chase rack / something I can throw a tonneau-mount
fishing rod on. Budget under $400. Need to know it fits before I tap buy.

## Device + entry point

iPad Mini portrait 768x1024 (TABLET) — landed on
https://stehlenauto-vercel.vercel.app

## Walkthrough

- 0:00 — Home loads. Hero "BUILT TOUGH. BOLT ON. DRIVE OFF." reads clean,
  no mid-word breaks. Header has CART (7), GARAGE icon, search box that says
  "Search by Yea" because it's only 184px wide on tablet, and the bottom yellow
  YMM band is showing (good, 768 is the desktop breakpoint). Garage shows
  "2014 JEEP WRANGLER" — wrong truck for this mission, swap it.
- 0:01 — Tap "2014 JEEP WRANGLER" pill in header → YMM modal opens
  full-screen, big tap targets, scrollable year list. Pick 2022 → Toyota →
  Tacoma. Header now reads "2022 TOYOTA TACOMA". 
- 0:02 — Hit the home category grid, find "Chase Racks & Sport Bars". 12
  category tiles render in a 4-col grid on tablet, look great.
- 0:03 — /collections/chase-racks-sport-bars: Green pill "✓ FITS 2022 TOYOTA
  TACOMA". Yellow honest banner "NO EXACT-FIT MATCHES — showing the rest." 3
  products. First card is "Universal Full Size Chase Rack Tire Carrier" with
  yellow "CHECK FITMENT FOR YOUR TOYOTA TACOMA" chip. Cards 2 and 3 are
  Stehlen Razor 1000 / 3000 "Universal Chase Rack" → red "✗ DOES NOT FIT".
  Wait — the products are NAMED Universal but flagged DOES NOT FIT? That's
  a confidence killer. I'd assume Universal = fits anything.
- 0:04 — Click "Universal Full Size Chase Rack Tire Carrier" PDP. Big yellow
  card: "CHECK FITMENT — We haven't verified this part for your 2022 Toyota
  Tacoma yet." For a $188 part that says "Universal" in the title, that's
  weird hedging. ATC is enabled though. Let me check the FEATURES tab.
- 0:05 — FEATURES tab: "Product-specific features … are detailed in the
  product description above the tabs. If a feature isn't listed, call us."
  No description above. Empty. Same on SPECS tab. INSTALLATION tab links to
  generic /help/install.
- 0:06 — Click "Installation Guide (PDF) · 4 pages" → goes to /help/install
  hub instead of an actual PDF. Hub page itself loads BUT the 4 install-guide
  cards on it ALL link to /help/install/<slug> — and those 404. Console fires
  4 RSC prefetch 404 errors just from landing on the hub. If I tap any guide
  I get black-on-white "404 — This page could not be found" with no nav. Ugly
  dead-end.
- 0:08 — Back to category. Try /collections/roof-racks-baskets. THIS one
  actually has a Tacoma fit! "1 exact fit for your 2022 Toyota Tacoma shown
  first." First card green ✓ FITS, "2016-2023 Toyota Tacoma Crew Cab Low
  Profile Roof Basket - Steel" $318. (Side note: my truck is "Double Cab"
  but the title says "Crew Cab" — Toyota uses Double Cab for the 4-door,
  same physical thing on a Tacoma, but the inconsistent naming is briefly
  jarring.)
- 0:09 — Tap into the PDP. Green CONFIRMED FITMENT card. Gallery: 9 thumbs
  rail on left, hero image right. "UNIVERSAL FIT · NO SUB-MODEL CONFIG"
  strip. ATC enabled $318. Looks legit. FEATURES tab still empty (says
  "see description above" but there's no description on this product
  either). INSTALLATION tab clean — no more "lift assembled rack onto truck"
  generic copy. Cycle 14b fix held on tab content.
- 0:10 — Add to cart. Drawer slides in from right, ~440px wide. Red banner
  "MIXED FITMENT — SOME ITEMS DO NOT FIT YOUR 2022 TOYOTA TACOMA". 5 lines
  visible (qty totals 8). Line images 80x80 not clipping. Subtotal $1,433.
  Drawer looks fine.
- 0:12 — Open /cart full page → BROKEN. Order Summary card overflows past
  right edge of viewport (page scrollWidth 862 vs viewport 768). The TOTAL
  reads "$15…" clipped, CHECKOUT button extends off-screen. Product titles
  in the line items wrap into 11 narrow vertical lines because the title
  column is squished to ~80px. Looks like the cart page is using the
  desktop md: layout (Tailwind md = 768) but the grid columns sum wider
  than 768. Unusable on tablet.
- 0:15 — Back to PDP for fitment-mismatch check. Open the Ford F-150 6.5ft
  tonneau in cart. Red ✗ DOES NOT FIT YOUR 2022 TOYOTA TACOMA banner.
  Disabled "DOES NOT FIT YOUR VEHICLE" button is 292x56 — full height, NOT
  a hairline. Cycle 14b btn-lg fix held. BUT — "BUY NOW WITH AFFIRM" button
  underneath is still enabled. Customer could Affirm-finance a part that
  doesn't fit.
- 0:18 — Browse /collections/tonneau-covers, type "taco" in header search.
  Typeahead pops up but every product title is truncated to "2016-2…" /
  "1989-2…" — the year prefix only. Useless on tablet width — the dropdown
  is ~310px but the title column inside it is maybe 60px. I have no idea
  what those 3 products are.
- 0:20 — Note: the entire collection of Toyota tonneaus shown for my Tacoma
  garage are TUNDRA tonneaus tagged "CHECK FITMENT FOR YOUR TOYOTA TACOMA"
  in yellow. Tundra is a full-size truck, Tacoma is mid-size — these will
  NEVER fit. Should be red ✗ DOES NOT FIT, not yellow CHECK FITMENT. The
  matcher is doing fuzzy "Toyota = Toyota = maybe fits" instead of
  Make+Model.
- 0:22 — /vehicle/toyota-tacoma loads great. "TOYOTA TACOMA" h1 in big
  yellow Geist Mono, no breaks. PICK YOUR YEAR yellow band has 12 year
  buttons. 0 console errors on /help, 0 console errors on vehicle hub.
- 0:24 — Done. Walking away. Couldn't actually buy something specific to my
  truck without doubting half the catalog.

## Friction log

- F-1 [BLOCKER] /help/install hub page lists 4 install guides (Door-Frame
  Mount Roof Rack, Modular Steel Bumper, Lock & Roll-Up Tonneau, LED Bed
  Light Kit) as cards. ALL 4 link to /help/install/<slug> URLs that 404.
  RSC prefetch fires 4 console 404s on every page load. If a customer
  taps any card they hit a black-on-white styleless 404. Cycle 14b
  "fixed" the PDP→hub link but left the hub→guide links broken. Either
  build the per-guide pages or change the cards to point at PDFs.
- F-2 [BLOCKER] Cart page (/cart) layout breaks at tablet width 768. Body
  scrollWidth 862 vs viewport 768 → Order Summary card overflows right
  edge, TOTAL reads "$15…" clipped, CHECKOUT button extends off-screen.
  Line item title columns squish to ~80px so titles wrap into 10-11
  vertical lines. Tailwind `md:` (≥768) layout activates at exactly 768
  but the columns don't fit. Either bump the desktop layout to `lg:`
  (≥1024) or tighten the column widths so md fits.
- F-3 [MAJOR] Tundra tonneaus on /collections/tonneau-covers show as
  "CHECK FITMENT FOR YOUR TOYOTA TACOMA" (yellow uncertain) when the
  Tacoma garage is set. They should be red ✗ DOES NOT FIT — a Tundra
  bed never fits a Tacoma. Fitment matcher appears to be Make-only
  fuzzy. This poisons the entire fitment trust signal.
- F-4 [MAJOR] PDP FEATURES + SPECS tabs say "details are in the product
  description above the tabs" — but Stehlen products have NO product
  description rendered between the buy box and the tabs. Customer reads
  "see description above," scrolls up, sees nothing, bounces. Either
  add real description copy or change the tab copy to not promise
  content that doesn't exist. (Cycle 14b removed the wrong roof-rack
  template copy — good — but the fallback is now just empty).
- F-5 [MAJOR] PDP shows disabled "DOES NOT FIT YOUR VEHICLE" ATC button
  but BUY NOW WITH AFFIRM button stays enabled. Customer can Affirm-
  finance a part that doesn't fit. Affirm CTA needs to disable in
  parallel.
- F-6 [MAJOR] Header search typeahead truncates product titles to year
  prefix ("2016-2…" / "1989-2…") on tablet width. The 3 product previews
  in the dropdown are unreadable — I can't tell what they are.
- F-7 [MAJOR] "Universal Chase Rack" products (Razor 1000 / Razor 3000)
  are flagged "✗ DOES NOT FIT" while having "Universal" in the title.
  Either the product is universal (fits everything) or the catalog data
  is wrong. As a customer this destroys my trust in the fitment chip.
- F-8 [MINOR] Header tap targets at tablet 768 — CART button 25x36,
  GARAGE link 38x36, both under 44px. Cycle 14b "header tap targets
  ≥44px" fix only addressed the mobile (hamburger) variant. At 768 the
  desktop header renders with sub-44px targets.
- F-9 [MINOR] Header search box only 184px wide on tablet; placeholder
  truncates to "Search by Yea". Plenty of horizontal whitespace
  available — search bar should expand on tablet.
- F-10 [MINOR] "⌘K" keyboard hint renders inside search box on tablet
  (touch device, no keyboard). Should hide on touch breakpoints.
- F-11 [MINOR] "Crew Cab" vs "Double Cab" naming. Tacoma owners say
  Double Cab; product titles say Crew Cab. Same physical truck but
  briefly confusing. Add "Double Cab" alias in title or fitment text.
- F-12 [MINOR] PDP "Installation Guide (PDF) · 4 pages" link copy
  promises a PDF but the link goes to /help/install hub page. Either
  link to actual PDF or change copy.

## What worked

- Vehicle swap from Wrangler → Tacoma was 3 taps in the YMM modal,
  garage updated everywhere instantly. Modal scrolls cleanly on tablet.
- Roof Racks & Baskets collection ranked the 1 exact-fit Tacoma roof
  basket FIRST, all DOES NOT FIT cards after — cycle 14b sort fix
  works on this collection too.
- Tacoma roof basket PDP (the actual exact-fit one) — green CONFIRMED
  FITMENT card, gallery + breadcrumb work, FEATURES + INSTALLATION tabs
  no longer serve the wrong roof-rack template.
- Disabled "DOES NOT FIT YOUR VEHICLE" ATC button is 292x56, full
  height, no longer a 22px hairline.
- Cart drawer fitment mixed banner shows red when garage truck doesn't
  match items.
- Cart drawer line images 80x80 don't clip the column.
- /help (0 console errors), /vehicle/toyota-tacoma (0 console errors,
  beautiful page).
- Hero h1 doesn't break mid-word on tablet, vehicle hub h1 doesn't
  break, sitewide fluid h1/h2/h3 utility looks dialled.
- YMM band shows on tablet 768 (correct — 768 is desktop breakpoint).

## What competitors do better

- RealTruck: search typeahead shows full product titles in 2 lines, not
  truncated to year prefix.
- Tyger: when a Tacoma is in the garage, only Tacoma-fitting tonneaus
  appear in /tonneau-covers — full-size truck parts get filtered out
  not relabeled "CHECK FITMENT".
- AutoZone: cart page uses single-column up to 1024px, never breaks at
  tablet width.

## Buy decision

- Would I check out today? **NO**.
- Why: I added the one Tacoma roof basket I trusted (the one with the
  green CONFIRMED FITMENT card). But when I went to the cart page on
  the iPad it was visually broken — Total clipped, Checkout button half
  off-screen, product titles wrapping 10 lines deep. I'm not going to
  punch in a credit card on a page that looks broken. Plus the FEATURES
  tab is empty for a $318 part, so I don't even know what I'm buying.
  I'd close the tab, find the part on Amazon, eat the $20 markup for
  the photos and Q&A.
- "Would I buy" rating: **4/10** (down from Mike-2's 5/10 — the broken
  cart page on the device I'm holding is the killer).
- "Would I come back" rating: **5/10** (the Tacoma vehicle hub and
  exact-fit collection ranking are real signs of progress; if cart page
  worked I'd come back).

Mike's verdict: The product confidence is THERE on a confirmed-fit Tacoma
PDP, but the cart page is broken at the exact width my wife's iPad runs
and the install guides 404 — fix those and I'd actually buy here.
