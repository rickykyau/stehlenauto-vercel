# Mike — Mission 3: Tacoma LED bed lights (mobile, $150 max)

## Mission

Wife's 2022 Tacoma TRD Off-Road, double cab, 5' bed. She wants LED bed lights
for camping. Bright, easy install, ideally wired through the existing bed
light circuit. Budget flexible to $150. Want to find this and buy it tonight.

## Device + entry point

Mobile, 390 x 844 (iPhone 14 Pro). Started at http://localhost:3000 — typed
the URL straight in like I would on my phone in the truck.

## Walkthrough

0:00 — Land on home. Fast load, looks clean. Big "BUILT TOUGH. BOLT ON.
DRIVE OFF." headline. Black/orange theme, looks like a real shop. So far so
good.

0:04 — Wait. The header says "2020 FORD F-150 CHANGE" right under the logo.
Why does the site already think I'm a Ford guy? I never told it that. My
F-150 is a 2018 anyway, not a 2020. And I'm here for the Tacoma. This
already makes me suspicious — is the site pulling fitment from my eBay order
history without asking? Or is "2020 FORD F-150" some kind of demo default
pre-loaded for everyone? Either way: weird.

0:08 — There's a YEAR / MAKE / MODEL picker on the hero. I tap "YEAR." It's
not a dropdown — it just navigates me to /collections. There's no way to
pick a year right there. Same with MAKE and MODEL — all three are dummies.
The whole hero picker is fake. Strike one.

0:12 — Scroll past the hero. There's a SECOND picker block lower down
("FITMENT GUARANTEED · Find parts for your ride") with the same YEAR/MAKE/
MODEL ▾ buttons. Same trick — they all just go to /collections. Strike two.

0:18 — Scroll to "SHOP BY CATEGORY." I see a tile labeled "BED LIGHTING."
Bingo, that's exactly what I want. Tap it.

0:22 — Land on /collections/bed-lights. Page title: "Bed Lighting." Then
the body says: **"NO PRODUCTS YET. We're uploading bed lighting from the
warehouse — check back soon, or browse other categories."**

OK. So the category tile is on the homepage but the category is empty.
That's a half-built site. Annoying, but at least they're honest.

0:26 — Try the search. Tap the magnifying glass in the top bar, get to
/search. Type "tacoma bed light." Result: **"Results for 'tacoma bed light'
— 0 MATCHES · FITTING 2020 FORD F-150."**

Wait — the search RESPECTED the (wrong) F-150 fitment lock and IGNORED the
word "tacoma" in my query. So even when I typed Tacoma into the box, it
filtered the results to fit a 2020 F-150 that I never told it I owned.
That's a brain-bending interaction. RealTruck would interpret "tacoma" as
either changing the vehicle or showing universal stuff. This site just
returns zero. Strike three.

0:31 — "MATCHES IN: ROOF RACKS, BED LIGHTING, TONNEAU COVERS, BED MATS" —
they suggest BED LIGHTING as a related category, but that's the same
empty page I already saw. Going in circles.

0:35 — OK try changing the vehicle. The header says "2020 FORD F-150 CHANGE"
— tap that. It goes to /collections, which is a category grid page. There's
no vehicle picker here. The "CHANGE" link is misleading: it doesn't open a
vehicle picker, it just dumps me on the category index.

0:42 — Scroll down on /collections. Just category tiles. No way to set
vehicle anywhere visible on mobile. The mobile header has only: hamburger,
logo, search icon, cart icon. I tap the hamburger.

0:45 — **Hamburger button does nothing visible.** I try tapping again. Then
the URL bar suddenly changes — I get teleported to a Ford F-150 Lightning
tonneau cover product page that I never asked for. Now I'm on a product
detail page for a $181 Ford tonneau cover with the wrong fitment year. I
didn't tap that. The site just navigated for me.

0:55 — Try going back to home. Type the URL fresh. Try the homepage Toyota
Tacoma tile in "SHOP BY POPULAR VEHICLE" — "TOYOTA Tacoma 2016–2026 198
PARTS." That sounds promising.

1:02 — Tap it. **404. "This page could not be found."** A tile they're
advertising on the homepage 404s.

1:08 — OK try the desktop nav links by URL — /collections/lighting (since
"Lighting" is in the desktop top menu I saw earlier). **404 again.**

1:14 — Hit /collections/bed-lights one more time as a last resort. Page
loads with the "NO PRODUCTS YET" message. Then before I can even read it
the URL bar flips to /search?q=2018+F-150+tonneau&debug_analytics= — the
site auto-navigated me without my consent. Then the page goes blank
(about:blank).

1:20 — At this point a real customer is gone. I'd have closed the tab at
0:25 when bed lighting was empty, but staying around to test, the auto-
navigation issue is the real killer. The site is literally driving the
browser somewhere I didn't ask to go. That's malware-tier behavior even
if it's just a debug script.

I never made it to the cart. I never saw a single bed light product.

## Friction log

- **F-1 [BLOCKER]** "Bed Lighting" category is empty. The exact thing I
  came for. Homepage tile says it exists, /collections/bed-lights is dead.
- **F-2 [BLOCKER]** Site randomly auto-navigates to other URLs without me
  clicking anything (saw it land on /search?q=2018+F-150+tonneau, on a Ford
  F-150 Lightning PDP, on a 6.5' bed tonneau PDP, on a roof-rack PDP — all
  unprompted). This makes the site unusable. Looks like a debug analytics
  script gone wild.
- **F-3 [BLOCKER]** "TOYOTA Tacoma 2016–2026 198 PARTS" tile on the
  homepage 404s. You're advertising a vehicle landing page that doesn't
  exist. As a Tacoma owner, I am the target customer and I'm hitting a
  dead end on the most prominent CTA for me.
- **F-4 [MAJOR]** Vehicle pre-locked to "2020 FORD F-150" with no way to
  change it from mobile. The "CHANGE" link goes to /collections (category
  grid), not a vehicle picker. Hamburger menu doesn't open anything I can
  see. Mobile mega-menu is missing or broken.
- **F-5 [MAJOR]** YEAR / MAKE / MODEL pickers in the hero and mid-page are
  fake — they all link to /collections instead of being real dropdowns.
  This is the core promise of the site ("Shop by Vehicle, Fitment
  Guaranteed") and it doesn't work. I can't actually shop by my vehicle.
- **F-6 [MAJOR]** Search ignores my query terms when there's a vehicle
  lock. I typed "tacoma bed light" — search returned 0 matches "FITTING
  2020 FORD F-150" and threw away the word "tacoma." Search should either
  override the fitment, ask me, or warn me my fitment is filtering
  everything out.
- **F-7 [MINOR]** /collections/lighting (which shows in the desktop top
  nav) 404s.
- **F-8 [MINOR]** Mobile snapshot sometimes shows desktop layout — the
  responsive switch is fragile. Saw this on /collections and the tonneau
  PDP I got teleported to.

## What worked

- Homepage above-the-fold looks legit. Good logo, clear value prop, free
  shipping / fitment guarantee / 30-day returns trust strip all present.
  If the rest of the site worked, the first impression would close.
- The "BED LIGHTING" category tile is right there on the homepage — easy
  to find, no hunting. Good IA decision; bad that the page is empty.
- Site is fast. No spinners, no white-screen-of-death (other than the
  auto-navigation killing the page).

## What competitors do better

- **RealTruck:** Their YMM picker is a real dropdown right in the header,
  one tap to open year, one tap to open make, one tap to open model, then
  you land on a filtered category page. Mike's mental model: "if I can't
  set my truck in 3 taps, I'm out." Stehlen made me click YEAR/MAKE/MODEL
  and it was three dead links. RealTruck wins on this in 5 seconds.
- **AutoZone:** When you set the wrong vehicle, the site shouts at you
  before showing zero results — it'll suggest "do you mean to change to
  Toyota Tacoma?" based on your search. Stehlen silently filters and
  shows 0.
- **AAG (American Auto Glass / parts sites generally):** When a category
  has no inventory yet, they redirect to the parent or show "we don't
  carry this for your truck — try these instead" with actual products.
  Stehlen just says "check back soon" and dead-ends.
- **AutoAnything:** The mobile hamburger opens a real shelf with vehicle
  picker baked in. Stehlen's hamburger does nothing visible (and seems
  to trigger the auto-navigation bug).

## Buy decision

- Would I check out today? **NO.**
- Why: I literally couldn't find a bed light. Bed Lighting category is
  empty, search ignores my query and returns 0, the Tacoma vehicle page
  404s, and the site randomly drives me to other products without my
  consent. As a customer I'd have bounced inside 30 seconds.
- "Would I buy" rating: **0 / 10** (no product to buy)
- "Would I come back" rating: **1 / 10** (only because the home page
  trust strip was decent — but the auto-redirect bug alone would be
  enough for me to mark it as broken in my head and not return)

Mike's verdict: this site is half-built — the chrome looks like a real
store but the engine room is on fire, and I would not tell a buddy to
shop here until somebody kills that runaway redirect script and ships
actual bed lights.
