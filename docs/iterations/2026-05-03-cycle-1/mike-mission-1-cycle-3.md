# MIKE — Mission 1 (CYCLE 3 RE-SHOP): 2018 F-150 Soft Tonneau, Mobile

## Mission

Same as cycles 1 & 2 — soft tonneau cover for my 2018 Ford F-150 SuperCrew,
5.5' bed, 4WD. Budget under $400. Want it shipped by Friday.

## Device + entry point

iPhone 14 Pro size — 390x844, mobile viewport. Started at
`http://localhost:3000` on a fully cleared session — wiped cookies,
localStorage, sessionStorage before landing. Owner asked for a fresh shop, I
gave them a fresh shop.

## Walkthrough

**0:00** — Land on home. Same hero as cycle 2 — "BUILT TOUGH. BOLT ON. DRIVE
OFF.". Mobile chrome renders. Pill says "**SELECT YOUR VEHICLE**", no leaked
default. So far identical to cycle 2 first impression.

**0:01** — But two things are off before I tap anything: cart icon shows
"**2**" on a freshly-cleared session, and the chat bubble shows "**1**". I
just nuked all cookies and localStorage. The cart count is leaking from
somewhere — either server-persistent cart that survives a cookie wipe, or a
shared cart bucket across visitors on this dev environment. Either way it's a
trust bomb. NEW friction: **F-31**.

**0:02** — Tap **YEAR** in the hero "SHOP BY VEHICLE" block. Modal opens but
collapses itself almost immediately on the way to taking the snapshot. Tap
**GET STARTED**. Modal opens, Step 1 of 3 · Year shows years 2027 down to
1990 in a scrollable list. Tap **2018**. Modal advances to Step 2 · Make ·
2018, with a "2018" chip locked in.

**0:04** — Wizard goes weird now. After tapping what looks like the Ford row,
the modal jumps to **Step 3 · Model · 2022 Toyota** — not 2018 Ford. Year
silently flipped from 2018 to 2022, make from Ford to Toyota. The same modal
click-bleed-through I logged as F-21 in cycle 2 is alive. Modal interactions
are committing two things at once. I tap **RESET**. The modal's "RESET" does
not actually reset — it goes back to Step 1 but **keeps the 2014 chip** at the
top (a year I never selected). RESET is broken. **NEW friction: F-32.**

**0:05** — I close the modal and find that the system has silently saved a
`stehlen_vehicle` cookie of `2014 Jeep Wrangler` — a vehicle I never picked.
That's my OTHER truck (the JK from my real garage) but obviously this site
doesn't know that. The wizard wrote a vehicle I never chose. **NEW friction:
F-33 (BLOCKER).**

**0:06** — Header chrome flake: opening the modal at 390x844 reliably triggers
the page to **render the desktop chrome** instead of mobile (1-888 number bar,
search box, "GARAGE / CART" labels, full mega-menu). This is identical to
cycle 2's F-22. Closing the modal doesn't always restore mobile chrome — I
have to manually re-resize the viewport. **F-22 cycle 2 — STILL OPEN.**

**0:08** — Routing instability is dramatically worse than cycle 2. Across
this session the page navigated itself, mid-action and mid-evaluate, to:
- `/collections/bull-guards-grille-guards` (twice)
- `/products/2010-2018-jeep-wrangler-advanced-series-bull-guard-matte-black`
- `/products/2010-2018-jeep-wrangler-jk-advanced-bull-guard-w-led-light-bar`
- `/search?q=led+bed`
- `/` (the home page) at least 3 times when I was on a collection or PDP

I never tapped any of these links. The browser literally teleports while I'm
inspecting the page. In cycle 1 I called this F-7. In cycle 2 I confirmed F-7
was alive. In cycle 3 it's worse — I cannot keep a page open for 8 seconds
without the URL changing on me. A real customer would think the back button
is broken or the site is malware. **F-7 cycle 1 / F-7 cycle 2 — WORSE in
cycle 3.**

**0:09** — Cookie persistence is also unstable. I tried 3 separate ways to
pin the vehicle to "2018 Ford F-150" — picker (didn't work, save was wrong),
direct cookie write (overwritten within seconds when the page teleported),
direct cookie write on the cart page (immediately flipped back to 2014 Jeep
Wrangler). Every navigation seems to potentially mutate the saved vehicle.
**NEW friction: F-34.**

**0:11** — Force-navigate to `/collections/tonneau-covers` directly. Page
loads with mobile chrome. H1 says "Tonneau Covers", chip says "FITS 2018 FORD
F-150" (the cookie held this time). Cards render in 2 columns. **24 products
visible**. Each card honestly says "**CHECK FITMENT FOR YOUR FORD F-150**"
(neutral, like cycle 2 — F-1 stays fixed).

**0:13** — But the catalog problem is unchanged from cycle 2. Of the 24
products on page 1: 22 are **Toyota Tundra** covers, 1 is the **Ford F-150
Lightning EV** (5.5' but EV-only chassis), and 1 is a **2015-2024 Ford F-150
6.5'** soft roll-up. **Still zero genuine 5.5' bed soft tonneaus for a
2018 F-150 SuperCrew on page 1.** The owner's brief says "287 products" —
but I'm seeing 24, page 1 of N, and the F-150 5.5' SKU is not in those 24.
**F-3 cycle 1 / F-3 cycle 2 — STILL OPEN.**

**0:15** — I do find something significant in the DOM: a real filter
**sidebar with bed length, cab type, color, material, price, brand chips
AND counts** — "5.5' Bed (24)", "Crew Cab (54)", "Black (86)", price slider,
brand chips. This is the cycle-1/cycle-2 wishlist (F-5, F-14, F-15) actually
delivered… on desktop only. The sidebar has class `hidden md:block` —
**display: none, 0×0 on mobile**. There is NO mobile filter button, sheet, or
toggle. I scrolled the entire collection page on mobile and found nothing. So
filters exist but mobile customers cannot use them. RealTruck and Tyger Auto
both lead with a "FILTERS" button that opens a bottom sheet on mobile. We
have nothing. **NEW friction: F-35 (MAJOR).** Plus, even on desktop, the
"5.5' Bed (24)" facet count adds up to only 82 across all bed lengths — far
short of 287 — so the filter facets are computed from the visible 24-product
slice, not the real catalog. **NEW friction: F-36 (MAJOR).**

**0:17** — Tried `?bed=5.5` URL filter. **No effect.** Same 24 cards. So the
filter UI in the sidebar isn't even backed by working URL params. Even if
mobile got a filter button, the underlying filter machinery doesn't actually
filter. **NEW friction: F-37 (MAJOR).**

**0:19** — Click into a real F-150 PDP — `2015-2024-ford-f-150-6-5-bed-soft-roll-up-tonneau-cover-503363` — the same 6.5' product cycle 2 flagged. PDP loads cleanly. Fitment ribbon: gray honest "**We haven't verified this part for your 2018 Ford F-150 yet**" — same fix as cycle 2, still good. ATC button **enabled** at $181. Right above ATC, in a green strip, the page says "**CONFIGURED FOR 2018 FORD F-150**". On the same screen as the ribbon that just said we haven't verified. The cycle-2 contradiction (F-4) is still here. The page tells me "we haven't verified" and "configured for your truck" in the same scroll. I'd go back and forth before paying.

**0:21** — Tap **ADD TO CART · $181**. **Cart drawer opens** (this is new — no drawer in cycles 1 or 2 because ATC silently 422'd). Drawer shows **5 items, subtotal $882**:
- 2010-2018 **Jeep Wrangler** Advanced Series Bull Guard - Matte Black, $196 (qty 1)
- 2015-2024 Ford F-150 6.5 ft Bed Soft Roll-Up Tonneau Cover, $181 × 2 = $362 (qty bumped from 1 to 2 by my click — cart already had 1 of this)
- 2014-2021 **Toyota Tundra** 5.5 ft Bed Tonneau Cover - Hidden Snap, $324 (qty 2)

**The cart was pre-populated with 4 items I never added** on a session I just cleared cookies for. Some of these (the Wrangler bull guard, the Tundra cover) are products I know I never visited as Mike. Either the cart is shared across visitors or it's leaking from some cycle-2 owner test. Either way: **the cart is not session-isolated.** This is the same class of trust bomb as the cycle-1 leaked vehicle pill. **NEW friction: F-38 (BLOCKER).**

**0:22** — Cart drawer claims "ALL ITEMS FIT YOUR 2014 JEEP WRANGLER" in a
green header. A Toyota Tundra cover and a Ford F-150 tonneau do **not** fit a
Jeep Wrangler — it's a Jeep, it doesn't even have a bed. The fitment-lying
problem from cycle 1 (F-1) returned in cycle 3 — just moved from the
collection-cards layer to the cart-drawer layer. **NEW friction: F-39
(BLOCKER).**

**0:23** — Tap **CHECKOUT $959.17** on the cart page. The button is a real
anchor pointing to
`https://stehlenauto.myshopify.com/cart/c/hWNBjOVTWZodUUbd7QHR5raK?...`. **A
real Shopify cart URL.** Following the link lands on the actual Shopify
checkout flow — Express checkout (Shop / PayPal / Google Pay / Venmo),
Contact / Delivery / Payment forms, "5 items", $882 subtotal, "Pay now"
button. **The cart-to-checkout handoff genuinely works.** This is the first
time in three cycles a Mike session has reached Shopify checkout. **Big
win.**

**0:24** — Bounced. Out of time and clean enough on the headline goal — I
made it to a Shopify checkout, even if the line items are wrong and the
cart isn't mine.

## Friction log (cycle-3 status)

### CLOSED in cycle 3 ✅
- **F-25 cycle 2 [BLOCKER → FIXED]** Add to Cart no longer silently 422s.
  Tapping ATC opens a cart drawer, the cart drawer shows real line items,
  and clicking through reaches a real Shopify checkout URL. Whole cart
  pipeline is alive end-to-end.

### STILL OPEN from cycle 1 / cycle 2
- **F-3 [BLOCKER]** Catalog still surfaces zero genuine 5.5' bed soft
  tonneau covers for a 2018 F-150 SuperCrew on page 1 of the collection.
  Owner says 287 products exist; mobile customer sees 24 and they're 22
  Tundras + 1 Lightning EV + 1 wrong-bed Ford. Without a working filter on
  mobile, the customer never reaches whatever F-150 5.5' SKU might exist.
- **F-4 [MAJOR]** PDP still serves contradictory fitment messages on the
  same screen — "We haven't verified this part for your 2018 Ford F-150
  yet" and "CONFIGURED FOR 2018 FORD F-150" inches apart, with ATC enabled
  in between. Customer can't trust either label.
- **F-7 cycle 1 / cycle 2 [MAJOR → WORSE]** Routing instability went from
  "annoying" in cycle 2 to "site is broken" in cycle 3. Page teleported to
  unrelated URLs at least 7 times in 24 minutes — bull-guards collection,
  random Wrangler PDPs, search results pages, the home page. I cannot keep
  a page open long enough to read it. A real customer bounces in 10
  seconds.
- **F-21 cycle 2 [MAJOR]** YMM modal still lets clicks bleed through to
  the page underneath, and worse — into the wizard itself. A single tap
  on the Ford row commits both 2022 + Toyota in one shot, dropping me at
  Step 3 with a vehicle I never picked.
- **F-22 cycle 2 [MAJOR]** Mobile viewport (390x844) still serves desktop
  chrome under several conditions, especially after the YMM modal opens.
  Reproduces reliably. Mobile customer sees a phone-sized layout collapse
  into a desktop layout and assumes something's broken.

### NEW friction discovered in cycle 3
- **F-31 [MAJOR]** Cart count badge shows "2" on a brand-new session with
  cleared cookies. Either the cart bucket is shared between visitors on this
  dev environment, or the server-side cart isn't keyed to anything cookie-
  derived. Trust-bomb on first paint.
- **F-32 [MINOR]** YMM modal "RESET" button doesn't actually reset — it
  drops you back to Step 1 but keeps the previous year as a chip. Customer
  expects RESET → blank slate. They get RESET → wrong vehicle still
  attached.
- **F-33 [BLOCKER]** YMM wizard saves vehicles the customer never picked.
  After a sloppy modal interaction (reasonable on a touch device), the
  cookie was set to "2014 Jeep Wrangler". I never tapped 2014, never
  tapped Jeep, never tapped Wrangler. Saving a vehicle the customer
  didn't choose makes every downstream "FITS YOUR…" claim a lie.
- **F-34 [BLOCKER]** Vehicle cookie isn't stable. I directly wrote
  `stehlen_vehicle = 2018 Ford F-150` to the document.cookie at least 3
  times over the session. Within the next page navigation it had been
  overwritten back to a different vehicle (Tundra, then Wrangler, then
  Tacoma — different each time). Some background process is mutating the
  saved vehicle. A customer who sets their truck once cannot keep it set.
- **F-35 [MAJOR]** Filter sidebar exists in the DOM but is `hidden
  md:block` — display: none on mobile, no mobile filter button, no bottom
  sheet, no slide-up drawer. **Mobile customers cannot filter at all.**
  RealTruck and Tyger have a "FILTERS" button that opens a sheet — table
  stakes for mobile commerce. We have nothing.
- **F-36 [MAJOR]** Filter facets are computed off the visible 24-product
  slice, not the 287-product collection. Counts add up to ~82 across bed
  lengths — way short of 287 — so even if I could click "5.5' Bed (24)"
  on desktop, it's filtering an already-truncated set, not the real
  catalog.
- **F-37 [MAJOR]** Filter UI isn't even wired to URL params. Visiting
  `/collections/tonneau-covers?bed=5.5` returns the same unfiltered 24
  products. The filter checkboxes have no `name` / `value` attributes
  visible — they're presentational, not functional.
- **F-38 [BLOCKER]** Cart is not session-isolated. On a freshly-cleared
  cookie session as Mike, I opened the cart drawer and found 4 items I
  never added — a Jeep Wrangler bull guard, a Ford F-150 tonneau already
  at qty 1, and a Toyota Tundra cover at qty 2. Either every visitor
  shares a bucket cart on this server, or somebody else's cart bled into
  mine. This is the worst trust bomb we've found in three cycles. A real
  customer would close the tab and report to their bank.
- **F-39 [BLOCKER]** Cart drawer and cart page both display "ALL ITEMS
  FIT YOUR 2014 JEEP WRANGLER" in a green badge. A Toyota Tundra cover
  and a Ford F-150 tonneau do not fit a Jeep Wrangler. The cycle-1
  collection-page fitment lie is back, just moved to the cart layer. The
  fitment-guarantee promise dies if it lies on the receipt page.

## What worked

- **The end-to-end cart → Shopify checkout pipeline is now real.** ATC
  opens a drawer with line items, cart page shows totals + tax + free
  shipping unlock, and CHECKOUT links out to a live `stehlenauto.myshopify
  .com/cart/c/...` URL that resolves to a working Shopify checkout with
  Express options (Shop, PayPal, Google Pay, Venmo). Three cycles in,
  this is the milestone — money can move.
- **Filter sidebar exists with the right facets** — bed length, cab type,
  color, material, price, brand. The taxonomy is right, the counts are
  there. It just needs to be (a) made visible on mobile, (b) wired to
  real URL params, and (c) computed off the full collection instead of
  the visible page.
- **Honest fitment ribbon on PDPs persists from cycle 2.** The "We
  haven't verified this part for your 2018 Ford F-150 yet" copy is
  exactly the right voice. (Just don't put a contradictory "CONFIGURED
  FOR…" green strip 1 inch below it.)
- **Real Shopify cart handoff** — the checkout URL is a real
  `myshopify.com/cart/c/{token}` link with a key, signature, and 5
  items inside. Shopify's checkout loads cleanly with the right line
  count and subtotal. The plumbing works.

## What competitors do better (mostly unchanged)

- **RealTruck**: Mobile filter sheet pops up on a single button tap,
  every facet is wired to URL params, and the count on each facet
  reflects the full collection not the visible page. Stehlen's
  filters: invisible on mobile, unwired, and counted wrong.
- **AutoZone**: Cart is locked to a session ID issued at first visit.
  Two visitors never share a cart. Stehlen's cart bleeds across
  visitors on this server right now.
- **Tyger Auto**: Tonneau collection leads with SOFT / HARD /
  RETRACTABLE / FOLDING tiles before any product list. Stehlen still
  dumps everything in one bucket.
- **AAG**: When ATC adds a part that doesn't actually fit, the cart
  drawer shows a yellow "We can't confirm this fits your truck — call
  us 1-888-… before you check out" inline. Stehlen's cart drawer
  green-checks every item as fitting a Wrangler regardless of whether
  it's a Tundra cover.

## Buy decision

- **Would I check out today?** **NO.** Better infrastructure than cycle
  2, but the trust bombs are bigger.
- **Why:** The good news first — the cart and Shopify checkout
  pipeline finally works. I tapped Add to Cart, got a real cart, and
  reached a real Shopify checkout with my credit card form ready. That
  was the missing rail in cycles 1 and 2 and it's in. But everything
  that surrounds the rail is broken in a way that makes me close the
  tab as a buyer: my YMM picker writes vehicles I didn't choose, my
  cookie keeps flipping between trucks I don't own, the page teleports
  to bull-guards-grille-guards or a Wrangler PDP every 10 seconds, and
  worst of all my cart was already full of someone else's parts. I'd
  never put my credit card into a checkout that's pre-populated with a
  Jeep bull guard I never selected. There is also still no genuine
  5.5' bed soft tonneau visible on page 1 of the collection, and no
  mobile filter to find one.
- **"Would I buy" rating:** **2/10** (cycle 1: 1/10, cycle 2: 3/10).
  Going UP for the working cart → checkout (+1 over cycle 2). Going
  DOWN for the leaked cross-visitor cart (-1), the worsened phantom
  routing (-1), and the new "save vehicles I never picked" picker bug
  (-1). Net: -1 from cycle 2.
- **"Would I come back" rating:** **3/10** (cycle 1: 2/10, cycle 2:
  5/10). Worse than cycle 2 because the cart-leak issue means even if
  I trust the brand, I can't trust the basket on this domain. If I see
  someone else's parts in my cart once, I never put my card in.

## Comparison to cycles 1 & 2

| Metric | Cycle 1 | Cycle 2 | Cycle 3 |
|--------|---------|---------|---------|
| YMM picker exists | ❌ | ✅ | ✅ |
| YMM picker saves the right vehicle | ❌ | ✅ | ❌ (saves 2014 Wrangler when I picked 2018 Ford) |
| Vehicle cookie stable across navigation | ❌ | ✅ | ❌ (mutates on every page load) |
| Fitment label is honest on collection cards | ❌ | ✅ | ✅ |
| Fitment label is honest on PDP ribbon | ❌ | ✅ | ✅ (but contradicted by "CONFIGURED FOR" strip) |
| Fitment label is honest in cart | n/a | n/a | ❌ ("ALL ITEMS FIT YOUR JEEP WRANGLER" on F-150/Tundra/Jeep mix) |
| Collection has filters | ❌ | ❌ | ✅ desktop / ❌ mobile (display: none) |
| Filters actually filter | n/a | n/a | ❌ (no URL params, no name attrs, no count match) |
| Add to Cart succeeds | ❌ (silent 422) | ❌ (silent 422) | ✅ |
| Reach Shopify checkout | ❌ | ❌ | ✅ |
| Cart is session-isolated | n/a | n/a | ❌ (4 items in my fresh cart from someone else) |
| Routing stays where I put it | ❌ (5 phantom navs) | ❌ (5 phantom navs) | ❌ (7+ phantom navs, including in middle of `evaluate`) |
| Mobile chrome reliable at 390px | ❌ (no picker) | ❌ (sometimes desktop) | ❌ (sometimes desktop) |

**Net pattern: the rail got built, but the trust layer got worse.** Cycle 3
is closer to a real store mechanically (cart, checkout, filter taxonomy all
exist), but every interaction with it surfaces a new leak — wrong vehicle
saved, wrong cart loaded, wrong fitment claim on the receipt, page jumping
to a Wrangler bull guard. The owner asked specifically about whether I
could complete the mission. The answer is: I could click through to a
Shopify checkout, but with somebody else's parts in my cart, for somebody
else's truck, having never set my own truck. That's not a sale.

---

Mike's verdict: They wired the cart to Shopify (huge), but the cart's full
of somebody else's parts and the page won't sit still — closer to a real
store than cycle 2, further from a sale.
