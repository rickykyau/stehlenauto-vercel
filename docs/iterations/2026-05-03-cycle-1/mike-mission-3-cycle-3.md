# Mike — Mission 3 (CYCLE 3): Tacoma LED bed lights, mobile, $150 max

## Mission

Wife's 2022 Toyota Tacoma TRD Off-Road, double cab, 5' bed. She wants
LED bed lights for camping. Bright, easy install, ideally wired through
the existing bed light circuit. Budget $150 max. Want to find it and
buy it tonight on my phone.

## Device + entry point

Mobile, 390 x 844 (iPhone 14 Pro). Started fresh at
http://localhost:3000 — fresh cookies, no garage.

## What changed since cycle-1 (the briefing)

The team told me:
- Catalog reconciled to real Shopify (1,322 SKUs)
- "Bed Lighting" is NOT a real category — they don't stock bed lights at
  all. Closest things are headlight upgrades and bull bars w/ light bars.
- Cycle-1 Bed Lighting empty page (F-1) is a catalog gap, not a UX bug.

So I'm going in expecting NO bed lights, but looking for an honest
"sorry we don't carry that, here are alternatives" experience.

## Walkthrough

0:00 — Land on home. First thing I notice — header now says
**"SELECT YOUR VEHICLE"** instead of "2020 FORD F-150 CHANGE" from
cycle-1. Big improvement. Site doesn't pretend to know me.

0:04 — Scroll the home. **The "BED LIGHTING" tile is GONE from the
SHOP BY CATEGORY grid.** Cycle-1 had it; cycle-3 doesn't. Good — they
removed the lie. Categories I see: Tonneau, Trailer Hitches, Bull Guards
& Grille Guards, Front Grilles, **Headlights**, Bed Mats, Running
Boards, Floor Mats, Roof Racks, Chase Racks, MOLLE, Under Seat. So if I
want bed lights, the closest tile is "Headlights" — but headlights aren't
bed lights. As a Tacoma owner I have nothing here for camping bed
lighting. **Catalog gap is real and now reflected honestly on the home
page.** Score one for the rebuild.

0:08 — Tap the **SELECT YOUR VEHICLE** button in the header. A real
vehicle picker dialog opens! Step 1 of 3 · Year. List of years 2027 down
to 1990. Tap **2022.** Step 2 of 3 · Make · 2022. Real list of makes
(Toyota is there). Tap **Toyota.** Step 3 of 3 · Model · 2022 Toyota.
Real list of Toyota models — 4Runner, Highlander, RAV4, Tacoma, Tundra,
Venza. Tap **Tacoma.** **The picker actually works.** Cycle-1 had three
fake YEAR/MAKE/MODEL buttons that all routed to /collections — that's
fixed. **This is a huge win.**

0:14 — But after I pick Tacoma, the site **auto-navigates me to
/collections/bull-guards-grille-guards** without me asking. Why bull
guards? I picked a vehicle, I expect to land on the home with my
vehicle locked in, OR on a Tacoma collection. Not on bull guards. The
header now correctly reads "2022 TOYOTA TACOMA · CHANGE." Cookie says
2022 Toyota Tacoma. So at least the vehicle stuck.

0:18 — Type the URL `/` to go back to home. **Vehicle has REVERTED
to "2018 FORD F-150."** I check the cookie — yep,
`stehlen_vehicle={2018, Ford, F-150}`. The site **silently overwrote
my Tacoma selection with a hardcoded 2018 F-150 default the moment I
went home.** I never asked for an F-150. This is the same kind of
phantom-default behavior cycle-1 caught (it had me pre-locked to a
2020 F-150). Different year, same bug class. **Strike one — my
vehicle won't stick.**

0:22 — Try the search. Navigate to `/search?q=bed+lights`. **Page
auto-redirects me to `/collections/tonneau-covers?bed=5.5`.** I never
asked. I typed a search URL, the site sent me to tonneau covers. Same
auto-navigation bug as cycle-1's F-2 BLOCKER. Still here.

0:26 — Try again. `/search?q=bed%20lights` (URL-encode the space).
This time it loads the search page. **"RESULTS FOR 'BED LIGHTS' — 0
MATCHES · FITTING 2014 JEEP WRANGLER."** Wait — Wrangler? My cookie
flipped from F-150 to Wrangler somewhere in the last 30 seconds. I
didn't pick a Wrangler. The site is just rotating through default
vehicles. **Strike two.**

0:28 — On that search page I see "MATCHES IN: ROOF RACKS, **BED
LIGHTING**, TONNEAU COVERS, BED MATS." So the SEARCH is still claiming
"BED LIGHTING" is a real category — even though the home page no longer
shows the tile and the briefing says it doesn't exist in Shopify. Half
the system was updated, half wasn't. **Half-fixed.**

0:31 — Try `/search?q=led+bed`. **0 MATCHES · FITTING 2018 FORD F-150.**
Vehicle flipped AGAIN. I didn't touch it. Cart counter shows 3 now —
cycle-1 said it was 2 on first load, mine started at 2, now at 3. The
**site is auto-adding items to my cart** without asking. I never tapped
Add to Cart on anything.

0:33 — Try `/search?q=light+bar`. **0 MATCHES · FITTING 2018 FORD
F-150.** Cart now at 3 still. So briefing said "Bull Bar w/ LED Light
Bar" exists in catalog but search returns 0. Search isn't matching that
SKU when I look for "light bar." Real customer wouldn't find it.

0:35 — Try `/search?q=bull+bar`. **Site auto-redirects to
`/products/2015-2024-ford-f-150-6-5-bed-soft-roll-up-tonneau-cover-503363`.**
I'm now staring at a Ford F-150 6.5' bed tonneau cover product page.
For my wife's Tacoma. With the F-150 fitment locked in. With the cart
counter ticking up to 4. **This is the same teleport bug from cycle-1
F-2 — it teleported me to a "Ford F-150 Lightning PDP" then; now it
teleports me to a "F-150 6.5' bed tonneau PDP." Same bug, different
destination URL.** It is 100% reproducible.

0:38 — Try `/collections/headlights` — the briefing said this is the
closest thing to bed lights. **Page auto-redirects to /cart, then back
to the F-150 tonneau PDP.** Cart now at 4. I literally cannot reach
the headlights collection page.

0:42 — At this point I am DONE. As a real customer, I bounced at 0:18
when my vehicle reverted from Tacoma to F-150. The auto-redirect bug
makes the site impossible to navigate. Even if Stehlen DID stock bed
lights, I couldn't find them because every URL I type sends me to a
wrong-truck Ford F-150 tonneau cover that I never asked for, with stuff
piling up in a cart I never built.

I never saw a Tacoma product. I never saw a single LED light. I never
made it to Headlights to even confirm "yeah, no bed lights, sorry."

## Friction log

- **F-1 [BLOCKER]** Auto-navigation script is **STILL LIVE** in cycle 3.
  Same bug as cycle-1's F-2. Visiting /search?q=bed+lights teleports me
  to /collections/tonneau-covers. Visiting /search?q=bull+bar teleports
  me to a Ford F-150 tonneau PDP. Visiting /collections/headlights
  teleports me through /cart back to that PDP. The site is literally
  driving the browser. This is malware-tier behavior. **Until this is
  fixed nothing else matters — I cannot get to any page I want.**
- **F-2 [BLOCKER]** Cart auto-fills with items I never added. My
  fresh-session cart started at 2 items, grew to 3, then 4, just by me
  navigating around. I never tapped Add to Cart. **A customer who got
  to checkout would see ghost items they didn't pick.** Possibly
  related to the auto-nav teleport (each teleport fires Add to Cart).
- **F-3 [BLOCKER]** Vehicle selection does NOT stick. I picked 2022
  Toyota Tacoma in the picker (which works now! good!) but the moment
  I navigated to home, the cookie was overwritten with a hardcoded
  2018 Ford F-150 default. Across the session it cycled F-150 → Tacoma
  → Wrangler → F-150 → F-150 with no input from me. **My garage
  doesn't exist; the site is making up vehicles.**
- **F-4 [MAJOR]** Search results page still references "BED LIGHTING"
  as a "MATCHES IN" suggested category, but the Shopify catalog
  (per briefing) has no such collection. Half the chrome was updated,
  the search-suggestions list wasn't. Click leads nowhere useful.
- **F-5 [MAJOR]** Search ignores my query when there's a vehicle lock.
  Same as cycle-1 F-6. Type "bed lights" → 0 matches "FITTING 2018
  Ford F-150." It silently filters the entire catalog through a
  default fitment that I never set. Should warn me, or override.
- **F-6 [MAJOR]** Search for "bull bar" returns 0 even though
  briefing says "Bull Bar w/ LED Light Bar" exists in Shopify. Either
  search isn't indexing those SKUs, or fitment-filtering is killing
  them. Either way: the closest real product to my mission is
  unreachable via natural search.
- **F-7 [MINOR]** After picking Tacoma, the site lands me on
  /collections/bull-guards-grille-guards. Picking a vehicle should
  land me back on home with the vehicle pinned, or on a vehicle
  landing page — not on a random unrelated collection.

## What worked (the cycle-3 wins, credit where due)

- **The vehicle picker is now real.** Cycle-1 had three fake
  YEAR/MAKE/MODEL buttons that all just routed to /collections.
  Cycle-3 has a working three-step modal with real year/make/model
  lists, dynamic filtering, a back-to-step-1 chip, a RESET button.
  When it works, it's competitive with RealTruck and AutoZone. **This
  is the single biggest improvement from cycle-1.** If the cookie
  would just persist and the auto-nav bug would die, Mike could
  actually shop.
- **The fake "Bed Lighting" tile is removed from the home page.** The
  catalog reconciliation is reflected on the home — they no longer
  promise something they don't stock. Honest.
- **Header is fast, clean, no longer pre-locked to a phantom Ford.**
  First impression is dramatically better.
- **Mobile layout actually renders mobile.** Cycle-1 sometimes flipped
  to desktop layout on mobile viewport. Cycle-3 stayed mobile when I
  expected mobile (only desktop-leaked when a navigation reset the
  viewport — which is itself a bug, but at least the chrome behaves).

## What competitors do better

- **RealTruck:** Their vehicle, once picked, **stays picked.** It's in
  the URL, it's in the cookie, it's in localStorage, it's in a server
  session — every place. My Stehlen Tacoma vanished within one click.
- **AutoZone:** When you search for a part the store doesn't carry,
  AutoZone says **"We don't have that for your vehicle — here's what's
  closest."** Stehlen says "0 MATCHES" and then suggests a category
  ("BED LIGHTING") that doesn't exist either. The honest move is
  "Sorry, we don't carry LED bed lights right now. Our closest
  alternatives for your Tacoma: [chase rack with LED light bar mount
  point], [headlight upgrade], [bull bar w/ LED light bar]." Stehlen
  doesn't even try.
- **AAG / Amazon:** Their cart only contains what I added. Stehlen's
  cart self-populates. Trust is gone the moment I see ghost items.

## Buy decision

- Would I check out today? **NO. HARDER NO than cycle-1.**
- Why: I literally could not navigate the site. Every URL I typed sent
  me somewhere else. My vehicle wouldn't stay set. My cart filled with
  things I didn't pick. The mission objective (LED bed lights) is a
  catalog gap that the team already knows about — that part is
  forgivable IF the site told me honestly. It doesn't; it points me
  back at "BED LIGHTING" as if it exists. As Mike, I'd close this tab
  in 30 seconds and never come back. The auto-redirect bug makes
  Stehlen feel like a malware-infected store, not a real shop.
- "Would I buy" rating: **0 / 10** (I never saw a product I asked for
  and the cart is full of strangers' items)
- "Would I come back" rating: **0 / 10** (worse than cycle-1's 1/10
  because cycle-1 had ONE bad behavior — empty bed lights category;
  cycle-3 added the auto-nav script + ghost cart + vehicle revert on
  top of an already-known catalog gap)

## Cycle-1 vs cycle-3 comparison

| Issue                                      | Cycle-1   | Cycle-3   |
|-------------------------------------------|-----------|-----------|
| Pre-locked phantom F-150 in header         | YES       | NO ✓ FIXED |
| Fake YMM buttons (route to /collections)   | YES       | NO ✓ FIXED — real picker |
| "Bed Lighting" tile on home                | YES (empty) | NO ✓ FIXED — removed honestly |
| Auto-redirect bug (URL teleports)          | YES       | YES — STILL HERE |
| Cart auto-fills with phantom items         | YES       | YES — STILL HERE |
| Tacoma vehicle landing 404                 | YES       | Couldn't test (couldn't reach it) |
| Search ignores query w/ fitment lock       | YES       | YES — STILL HERE |
| Mobile hamburger broken                    | YES       | Different layout — has dropdown picker now, didn't test hamburger |
| Search suggests phantom "BED LIGHTING"     | YES       | YES — STILL HERE |
| Vehicle persistence                        | N/A       | NEW BUG — vehicle reverts to F-150 default |

**Net:** Three real cycle-1 issues fixed (phantom F-150 header, fake
YMM, fake bed lights tile). The two cycle-1 BLOCKERS — auto-redirect
and ghost cart — are completely untouched. One NEW bug (vehicle
reverts to default after navigation).

## Catalog finding (for the warehouse, not for UX)

Per the briefing, Shopify has:
- 160 Headlight upgrades (real headlights, NOT bed lights)
- "Bull Bar w/ LED Light Bar" SKU(s) — not findable via my search

Real customer expectation for "LED bed lights for camping in my Tacoma
bed" is **fender-mount or bed-rail-mount LED light bars / pucks** that
wire into the bed light circuit. Stehlen does not stock these. That's
fine if the storefront says so. It doesn't.

**Recommendation for warehouse:** Stehlen Auto serves a Tacoma owner
who wants to upgrade for camping. LED bed light kits
(Rough Country, Diode Dynamics, Auxbeam types) retail $40–$200, fit my
budget perfectly, and pair naturally with their existing chase racks
and MOLLE panels. **Adding even 5–10 SKUs of LED bed-light kits would
fill an obvious hole in the camping/overland customer journey.**

Mike's verdict: cycle-3 has a working YMM picker for the first time —
that's a real win. But the runaway redirect script and ghost-cart
behavior are still cooking; my wife's Tacoma is still nowhere on this
site; and I can't even reach the Headlights page to confirm there's no
bed lights. Until that auto-nav script gets killed and the cart stops
auto-filling, I would tell my buddies to keep shopping somewhere else.
