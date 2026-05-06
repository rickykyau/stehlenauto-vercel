# MIKE — Mission 1 (CYCLE 2 RE-VERIFY): 2018 F-150 Soft Tonneau, Mobile

## Mission

Same as cycle 1 — soft tonneau cover for my 2018 Ford F-150 SuperCrew, 5.5' bed,
4WD. Budget under $400. Want it shipped by Friday.

## Device + entry point

iPhone 14 Pro size, 390x844. Mobile viewport. Started at `http://localhost:3000`
on a fresh session — cleared cookies and localStorage before landing, exactly as
the owner asked, so the cycle-1 stale "2020 FORD F-150" garage couldn't bias the
test.

## Walkthrough

**0:00** — Land on home. Already different from cycle 1. The header pill no
longer says "2020 FORD F-150 — CHANGE" out of nowhere — it now says
"**SELECT YOUR VEHICLE**". So the dishonest hardcoded vehicle from last cycle is
gone. That's the single most visible fix and it lands. Hero is the same "BUILT
TOUGH. BOLT ON. DRIVE OFF." Trust signals (free shipping, returns, fitment
guarantee, lifetime warranty) all there.

**0:08** — Tap **YEAR** in the hero "SHOP BY VEHICLE" widget. Last cycle this
just dumped me on `/collections` with no picker. **This time a real modal opens:
"SELECT YOUR VEHICLE — Step 1 of 3 · Year"** with years 2027 down to 1990 in a
scrollable list. **F-2 from cycle 1 (no working YMM picker) is fixed.** F-6
(fake hero dropdowns) is also fixed — the buttons now open the picker like the
implementer promised.

**0:09** — Tap **2018**. Modal advances to "**Step 2 of 3 · Make · 2018**" with
a chip at top showing "2018" already locked in, and an A-Z make list (Acura,
Alfa Romeo, Audi, BMW… Ford). Real wizard.

**0:10** — Tap **Ford**, then on Step 3 tap **F-150**. Modal closes. Header pill
now reads "**● 2018 FORD F-150 — CHANGE**" with a green dot, and a cookie
`stehlen_vehicle=2018-ford-f-150` is set. The garage actually persists. **F-2,
F-6, F-13 from cycle 1 all closed.**

**0:11** — Quick gripe: in mid-flow the modal sometimes lets clicks bleed
through to the page underneath. Twice during the YMM flow my tap on a year/make
hit a product card link behind the dialog and the page navigated to a roof-rack
PDP. This is real customer friction — modal needs a backdrop that blocks
pointer events. **NEW friction: F-21.**

**0:14** — Header layout flake: at 390x844 viewport the page sometimes serves
the **desktop chrome** (1-888-378-4536 number bar, full mega menu, "GARAGE /
CART" labels) instead of the mobile hamburger + pill. Reproduced reliably after
opening the YMM modal once. Reload often fixes it. Real customers don't reload
when something looks wrong, they bounce. **NEW friction: F-22.**

**0:16** — Jump to `/collections/tonneau-covers`. Read the cards. Every card now
says "**CHECK FITMENT FOR YOUR FORD F-150**" — neutral, honest, not the cycle-1
"✓ FITS YOUR FORD F-150" lie that was slapped on Tundra products. **F-1 (the
single biggest cycle-1 blocker) is FIXED.** This was the deal-killer last time
and it's gone. Big win.

But the underlying catalog problem isn't fixed at all. Of 24 cards on the
tonneau page, 22 are still **Toyota Tundra** covers. The 2 non-Tundras:
- 2022-2026 Ford F-150 **Lightning** 5.5 ft Bed (Lightning is the EV; mine
  isn't.)
- 2015-2024 Ford F-150 **6.5 ft Bed** Soft Roll-Up (wrong bed, mine is 5.5'.)

So I still see **zero genuine 5.5' bed soft tonneau** for a 2018 SuperCrew. The
honest "CHECK FITMENT" label is better than a lying "FITS" label, but the
result for me as a buyer is identical: I have nothing to add to cart. **F-3 from
cycle 1 — STILL OPEN.** And the page still has zero filters beyond Sort By —
no soft/hard, no bed length, no price range. **F-5 / F-14 / F-15 from cycle 1
— all STILL OPEN.**

**0:18** — Click into the closest Ford hit, "2015-2024 Ford F-150 6.5 ft Bed
Soft Roll-Up". The PDP fitment ribbon is now a gray honest box: "**CHECK
FITMENT — We haven't verified this part for your 2018 Ford F-150 yet. Use the
compatibility table below or call us at 1-888-378-4536 before ordering.**"
That's the right voice — gives me a phone number, tells me to scroll, doesn't
oversell. Compatibility table below is detailed: "2015-2020 SuperCrew · 5.5'
Bed → FITS". So this product apparently DOES fit my truck — the title just
mislabels it as 6.5'.

But same page, two lines above ATC, in green: "**UNIVERSAL FIT · NO SUB-MODEL
CONFIG**". And under ATC: "**CONFIGURED FOR 2018 FORD F-150**". So the page is
still telling me three different stories at once: title says 6.5' bed, ribbon
says "we haven't verified", green strip says "universal fit", and the
configured-for line says my truck is locked in. **F-4 from cycle 1 — STILL
OPEN.** Internally contradictory PDP.

**0:20** — Click into a Tundra PDP ("2014-2021 Toyota Tundra 5.5 ft Bed Tonneau
Cover - Hidden Snap") to verify the implementer's specific fix: PDP fitment
ribbon should NOT show "FITS YOUR FORD F-150" on a Toyota Tundra product. Fix
**confirmed**: the ribbon is the same neutral "**CHECK FITMENT — We haven't
verified this part for your 2018 Ford F-150 yet**" gray box. No false ✓ FITS.
**Implementer's fix #3 lands.**

But I notice: ATC is still **enabled by default at $162.00** on a Tundra cover
for a customer who's set their garage to F-150. The page shows "UNIVERSAL FIT ·
NO SUB-MODEL CONFIG" and "CONFIGURED FOR 2018 FORD F-150" right above the cart
button. A Tundra cover is not a universal product and is not configured for an
F-150. If a customer trusts those two labels and taps ATC, they buy a Tundra
cover. The honest CHECK FITMENT ribbon is undermined by the lying "CONFIGURED
FOR…" label below. **NEW friction: F-23.**

**0:22** — Test the implementer's claim that ADD TO CART 422 should now show a
real error toast instead of silently doing nothing. Tap ATC on the Tundra PDP.
Network log shows `POST /api/cart → 422 Unprocessable Entity`, exactly like
cycle 1. Inspect the page for any role="status", role="alert", aria-live, or
toast element after the click — **nothing appears.** No banner, no error
message, no shake animation, no console message to the user. The button just
sits there. A second tap does the same. Cart count stays at 0. **Implementer's
fix #5 (Add-to-Cart 422 error toast) — NOT delivered. F-7 from cycle 1 still
fully alive.**

**0:24** — Test the implementer's claim that sub-model strip should require BED
LENGTH selection before ATC enables (instead of auto-defaulting to 5' BED).
Open the Stehlen Door-Frame Mount Roof Rack PDP — same rack PDP I praised in
cycle 1 for having a clean variant strip. Inspect the strip:

- BED LENGTH strip: **5' BED is `aria-pressed=true` by default.** 5.5', 6.5', 8'
  are unselected. My truck is 5.5'.
- CAB TYPE strip: CREW CAB is `aria-pressed=true` by default.
- ATC button is **enabled** at $489. Customer can tap ATC right now and ship
  themselves a 5' bed rack for their 5.5' bed truck.

**Implementer's fix #4 (sub-model strip requires explicit BED LENGTH pick) —
NOT delivered.** The default is still pre-selected, ATC is still enabled. F-8
from cycle 1 (cab terminology mismatch — buttons say SUPERCAB / SUPERCREW but
Ford actually calls a 4-door F-150 a SuperCrew, and CREW CAB on the strip vs
"SuperCrew" in the compat table) is also still alive.

**0:26** — Routing instability is genuinely bad. Across this 26-minute session
I had the page navigate involuntarily five times: once to a roof-rack PDP from
the YMM modal, twice to a Honda CR-V hitch PDP between Playwright actions,
once to `/collections/hitches`, once to `/collections/this-handle-does-not-exist-xyz`
(a non-existent URL with a clearly machine-generated handle). I've never seen a
production storefront do this. Either the dev tools are auto-clicking links,
some prefetch is mis-targeting, or there's a router race. Whatever it is, a
real customer would think the site is broken and bounce. **F-7 from cycle 1
(unstable routing) — STILL fully alive, possibly worse.**

**0:27** — Bounced. Out of time.

## Friction log (cycle-2 status)

### CLOSED in cycle 2 ✅
- **F-1 [BLOCKER → FIXED]** Tonneau collection no longer slaps "✓ FITS YOUR
  FORD F-150" on Toyota Tundra products. Cards say neutral "CHECK FITMENT FOR
  YOUR FORD F-150." Same fix on PDP fitment ribbon — Tundra PDP shows neutral
  CHECK FITMENT, not the cycle-1 false ✓.
- **F-2 [BLOCKER → FIXED]** YMM picker exists and works. Hero YEAR / MAKE /
  MODEL buttons open a real 3-step modal. Header pill opens it too. Picker
  saves vehicle to a `stehlen_vehicle` cookie that survives reload.
- **F-6 [MAJOR → FIXED]** Hero dropdowns are no longer fake links. They open
  the picker.
- **F-13 [MINOR → FIXED]** No more leaking "2020 FORD F-150" default to
  every visitor. Pill says "SELECT YOUR VEHICLE" until I set one.

### STILL OPEN from cycle 1
- **F-3 [BLOCKER]** Catalog has zero soft tonneau covers that fit a 2018 F-150
  SuperCrew 5.5' bed. The 22-of-24 Tundra problem is unchanged; the 2 Ford
  options are wrong (Lightning EV or 6.5' bed). The fitment label is honest
  now, but the result for me as a buyer is identical: nothing to buy.
- **F-4 [MAJOR]** PDP shows three contradictory fitment stories at once
  ("6.5 ft Bed" in title vs "5.5' Bed FITS" in compat table vs "UNIVERSAL FIT
  · NO SUB-MODEL CONFIG" vs "CONFIGURED FOR 2018 FORD F-150"). Customer can't
  trust any of them.
- **F-5 [MAJOR]** Collection toolbar still has only Sort By. No filter for
  soft / hard / tri-fold / roll-up. No bed length filter. No price filter.
  No brand filter. On mobile with 24+ products this is brutal.
- **F-7 [MAJOR]** Routing is genuinely unstable. Pages navigate themselves to
  unrelated URLs mid-action. Saw it five times in 26 minutes including a goto
  to `/collections/this-handle-does-not-exist-xyz`.
- **F-8 [MAJOR]** Variant strip says CREW CAB / SUPERCAB / REGULAR CAB. Ford
  calls a 4-door F-150 a SuperCrew. The compat table on the same page uses
  "SuperCrew" but the buttons don't have that option — owner sees CREW vs
  SUPERCAB and doesn't know which is which.
- **F-9 [MINOR]** Hamburger menu hit target is still small.
- **F-10 [MINOR]** "FITS 2018 FORD F-150" pill on collection toolbar is still
  not tappable to change vehicle.
- **F-11 [MINOR]** Breadcrumb still shows "Tonneau cover lock & roll up" with
  raw spaces. Will 404 if clicked.
- **F-12 [MINOR]** Empty Bumpers & Guards collection — no warning from the
  home tile.
- **F-14 [MINOR]** No price range filter on collection toolbar.
- **F-15 [MINOR]** No soft / hard / tri-fold / retractable filter on the
  Tonneau Covers collection — the primary axis for tonneau shopping.

### NEW friction discovered in cycle 2
- **F-21 [MAJOR]** YMM modal lets clicks bleed through to the page underneath.
  During the wizard, taps on year / make buttons sometimes register on a
  product card link behind the dialog and the page navigates away mid-flow.
  Modal needs a real backdrop that blocks pointer events.
- **F-22 [MAJOR]** Mobile chrome doesn't reliably render at 390px viewport.
  Page sometimes serves the desktop layout (full mega menu, 1-888 number bar,
  CART/GARAGE labels) on mobile width. Reproduces after opening the YMM modal.
  This is the kind of thing a real phone customer sees and assumes the site is
  broken.
- **F-23 [BLOCKER]** Tundra cover PDP shows "**UNIVERSAL FIT · NO SUB-MODEL
  CONFIG**" and "**CONFIGURED FOR 2018 FORD F-150**" right above ATC even
  though the honest fitment ribbon directly above says we haven't verified
  fit. The honest ribbon and the lying "CONFIGURED FOR" line contradict each
  other on the same screen. Customers who trust the bigger green
  "CONFIGURED FOR…" label tap ATC and end up with a Tundra cover.
- **F-24 [MAJOR]** Implementer's claim that "Sub-model strip should require
  BED LENGTH before ATC enables" is not delivered. Roof rack PDP still
  pre-selects 5' BED with `aria-pressed=true` by default, and ATC is enabled.
  Customer with a 5.5' bed truck can tap ATC and ship a 5' rack to themselves.
- **F-25 [MAJOR]** Implementer's claim that "Add to Cart 422 should now show a
  real error toast" is not delivered. ATC posts to `/api/cart`, the API
  returns 422 Unprocessable Entity, and absolutely nothing happens on the
  page — no toast, no banner, no aria-live announcement, no console log to
  the user, no button state change. Cart stays empty. Customer taps again,
  same result, bounces.

## What worked

- The neutral "CHECK FITMENT — We haven't verified this part for your 2018
  Ford F-150 yet. Use the compatibility table below or call us at
  1-888-378-4536 before ordering" copy is the right voice. Honest, gives a
  next step, doesn't oversell. Once the catalog and the contradictions are
  cleaned up, this banner is exactly what a customer wants to see.
- The YMM modal flow (3 steps, year → make → model, persisted in a cookie)
  works. This is the foundation that the rest of the site hangs on, and it's
  in.
- Header pill correctly updates from "SELECT YOUR VEHICLE" to "● 2018 FORD
  F-150" after the picker is completed. Sticks across navigation.
- Compatibility table on the F-150 6.5' tonneau PDP is clear (year ranges +
  cab type + bed length + FITS / DOESN'T FIT). When the title doesn't lie,
  this table is the most credible thing on the site.

## What competitors do better (unchanged from cycle 1, all still apply)

- **RealTruck**: Mandatory YMM gate AND real soft / hard / tri-fold /
  retractable filters. Stehlen now has the YMM gate. Still missing the
  filters.
- **AutoZone / RockAuto**: When ATC fails for a real reason (sub-model
  required, sold out, etc.), they show a banner explaining what's missing,
  not nothing.
- **AAG**: Inline "Will this fit?" confirm box on every PDP that gives a
  yes/no instantly. Stehlen's "VERIFY FITMENT FOR MY VEHICLE" link still goes
  to `/collections` instead of opening the YMM modal it should.
- **Tyger Auto / BAK Industries**: Tonneau collection leads with SOFT / HARD
  / RETRACTABLE / FOLDING tiles before any product list. Stehlen still dumps
  everything in one bucket.

## Buy decision

- **Would I check out today?** **NO.** Closer than cycle 1, but still no.
- **Why:** Two things have to both be true for me to buy: (1) the site has
  to know my truck and tell me which products fit, and (2) the catalog has
  to actually contain a product that fits. The site now does (1) correctly —
  the YMM picker works, the garage persists, and the fitment label tells me
  the truth instead of lying. Big improvement. But (2) is unchanged: the
  Tonneau Covers page has 22 Tundras, 1 Lightning EV cover, and 1 wrong-bed
  Ford. None of those is a 5.5' bed soft tonneau for a 2018 SuperCrew. On
  top of that, the ATC quietly 422s with no error message, the page randomly
  navigates to unrelated URLs mid-action, and the variant strip on rack PDPs
  pre-selects the wrong bed length so a careless customer ships themselves
  the wrong part. I'm closer than cycle 1 but I still close the tab.
- **"Would I buy" rating:** **3/10** (cycle 1: 1/10). Three points of
  improvement come from: honest fitment label (+1), working YMM picker (+1),
  no more dishonest hardcoded vehicle (+1).
- **"Would I come back" rating:** **5/10** (cycle 1: 2/10). The bones are
  there. If the catalog gets a real 5.5' bed F-150 soft tonneau and the ATC
  works, I'd come back. The trust delta from cycle 1 is real.

---

## Comparison to cycle 1

| Implementer's claimed fix | Verified? |
|--------------------------|-----------|
| Hero YMM picker buttons open the YMM modal | **YES** — modal opens from YEAR / MAKE / MODEL / GET STARTED |
| Mobile chrome SELECT YOUR VEHICLE pill opens the YMM modal | **PARTIAL** — header pill opens picker, but mobile chrome itself doesn't always render at 390px (F-22) |
| PDP fitment ribbon shows neutral "CHECK FITMENT" not false ✓ FITS on Tundra | **YES** — confirmed on Tundra PDP and on Ford F-150 6.5' tonneau PDP |
| Sub-model strip requires BED LENGTH before ATC enables | **NO** — roof rack PDP still pre-selects 5' BED, ATC enabled |
| Add to Cart 422 shows real error toast | **NO** — 422 still fires silently, zero UI feedback |
| Stale 2020 F-150 garage doesn't bias the test | **N/A** — I started fresh; the cycle-1 default lie is gone for good (F-13 fixed) |

**Score: 3 of 5 implementer claims verified, 2 not delivered.**

Mike's verdict: They cleaned up the lies but the catalog is still empty for my
truck and the Add-to-Cart still silently fails — I'd tell a buddy "they're
getting closer, check back in a month."
