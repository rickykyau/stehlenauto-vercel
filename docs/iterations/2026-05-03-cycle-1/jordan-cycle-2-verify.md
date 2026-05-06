# Jordan Mercer — Cycle-2 Verification · Stehlen Auto Storefront
**Date:** 2026-05-03
**Build:** local `pnpm dev` against `http://localhost:3000`, `2018 FORD F-150` cookie set
**Tester:** Jordan Mercer (Robome / ux-designer agent)
**Devices:** 1440×900 desktop + 390×844 mobile (Playwright MCP)
**Methodology:** Source review + live Playwright probes against each route in the verification list. Where the parallel Claude Code session (still running, per cycle-1 caveat) hijacked navigation mid-action, I worked around it via direct DOM probes (`page.evaluate`).

---

## Verification summary

| # | Item | Status | Notes |
|---|---|---|---|
| 1a | Home hero YMM picker (YEAR/MAKE/MODEL/GET STARTED) opens YmmModal | **PASS** | All four are real `<button>`s; clicking any opens the dialog at Step 1. |
| 1b | Home yellow band (YEAR/MAKE/MODEL/SEARCH) opens YmmModal | **PASS** | Same wiring; SEARCH opens dialog. |
| 2 | Mobile chrome SELECT YOUR VEHICLE pill opens modal | **PASS** | `<button>` (was `<Link href="/collections">`); fires `openYmmModal()`. |
| 3a | PDP sub-model strip does NOT auto-default | **PASS** | `useState` inits to `{}` from saved answers only; no `s.options[0]` fallback. |
| 3b | PDP ATC disabled with copy "SELECT BED LENGTH" until customer picks | **PASS** | `disabled={!canAdd}`, `blockedCopy = "SELECT " + missingStrips[0].label`. |
| 3c | Mobile sticky ATC bar appears when scrolled past in-page buy box | **PASS** | Fixed-bottom 69px bar (`md:hidden`), `transform translateY(82.8px)` when scrollY=0, slides up after threshold. Contains compact title + price + ADD TO CART. |
| 4 | PDP fitment hero — vehicle set, fitment unverified → neutral CHECK FITMENT | **PASS** | Verified on Honda CR-V hitch with F-150 garage: "CHECK FITMENT / We haven't verified this part for your 2018 Ford F-150 yet." Replaces the old fake green block. |
| 5 | ProductCard fitment ribbon — neutral state when `fits===undefined` | **PASS** | `product-card.tsx:101–122` renders a dark "CHECK FITMENT FOR YOUR {MAKE} {MODEL}" ribbon when `fits === undefined`. Green ribbon only when `fits === true`. |
| 6 | `/collections/{nonexistent-handle}` no longer 404s | **PASS** | Renders a friendly empty state: "We're loading the {slug} catalog from the warehouse. Check back soon, or browse other categories below." Mobile + desktop. |
| 7 | Cart promo input rejects "FOOBAR", accepts "WELCOME10" | **PASS (code review)** | `VALID_PROMOS = new Set(["WELCOME10"])`; FOOBAR triggers `setPromoError("That code isn't valid. Check your email for the latest promo.")`. Live verification blocked because Shopify isn't configured locally so `/cart` always renders the empty state — promo input only mounts when `lines.length > 0`. Source confirms exact strings the user requested. |
| 8 | ATC 422 surfaces visible red error toast | **PARTIAL — see F-31** | A `role="alert"` red-bordered box renders below ATC with the actual error message. **However** the BuyBox renders the raw API error string ("No purchasable variant found for stehlen-universal-door-frame-mount-roof-rack") because of `body?.error ?? fallback` ordering — the friendlier `fallback` copy ("This part isn't currently available for your vehicle…") is dead code in this build. Visible: yes. Helpful: no. |

---

## Regression scan

### Vehicle Hub (was F-8 — Wrangler showed F-150 generations)
**No regression — substantially better.** `/vehicle/jeep-wrangler` now renders JL (2018–Current) and JK (2007–2018) generations with Wrangler-specific descriptions ("JL chassis. 2-door (JL) and 4-door (JLU) share most cab parts."). `/vehicle/ford-f-150` correctly renders P702 / P552 / P415. Section headings are vehicle-aware ("Built for Jeep Wrangler.", "Built for Ford F-150.").

**One residual** (was already F-8 in cycle-1, partially open): the stat block "12 GENERATIONS / Bumper-to-bed coverage" still hard-coded for both vehicles. "Bumper-to-bed" is a pickup-only phrase and reads wrong on Wrangler/Civic/etc.

### ProductCard layout shift when ribbon swaps to neutral state
**No regression.** Both green (`fits===true`) and neutral (`fits===undefined`) ribbons use identical `position:absolute; bottom:0; left:0; right:0; padding:6px 10px` styling. The card body height does not change — only the ribbon background color and label text. CLS-safe.

### Home hero & yellow band CTAs
**No regression.** GET STARTED + SEARCH are now real buttons that open the modal; the previous `<a href="/collections">` rugpull is gone. The duplicate yellow band (which I recommended killing) still exists — ships, but with functional wiring this time. Brand rule "≤1 yellow CTA per viewport" is still violated above the fold (GET STARTED + the in-band SEARCH button are both yellow). Not a regression — was open in cycle-1 as F-16 and not on the list of fixes.

### Sticky mobile ATC bar collision with chat FAB
**Partial regression / new collision.** The chat FAB (60×60, `bottom: 24`) overlaps the new sticky ATC bar (64–69px tall, `bottom: 0`) on mobile. The FAB sits in front of the ATC bar's right edge. Because the ATC bar is full-width and the FAB is bottom-right, the FAB obscures part of the price + ADD TO CART label area on devices ≤390px width. Was anticipated in cycle-1 F-24 — the fix to lift the FAB to `bottom: 88px` when the sticky bar is mounted hasn't shipped.

### Cart drawer / API surface
The cart drawer keeps opening unprompted in this session — that's the second-Claude-session interference noted in cycle-1, not a real regression. Source review of `cart-drawer.tsx` shows no new anti-patterns.

### Hard-coded "Wed Apr 22 — Fri Apr 24 to 90210" ETA on PDP
**Still present** (was F-11 in cycle-1; not on cycle-2 fix list). Today is May 3, 2026 — the dates are stale; the zip is wrong for any non-Beverly-Hills visitor. Not a regression, but the trust-destroying behavior I flagged is now even worse because more days have elapsed.

### F-150 cross-sell strip on Honda CR-V PDP
The cross-sell row on the CR-V hitch PDP (with F-150 in garage) shows F-150-only roof-rack products with green "✓ FITS YOUR 2018 FORD F-150" ribbons. That's because `fits: true` is hard-coded in the mock catalog for those products against any vehicle. Not introduced by these fixes — pre-existing data quirk. Worth fixing in catalog-data pass (the cross-sell should not surface roof racks on a hitch PDP, irrespective of fitment).

---

## New finding

### F-31 [HIGH] ATC error surface shows raw API error instead of customer-friendly copy
- **Where:** `src/components/commerce/buy-box.tsx:90-103` — `throw new Error(body?.error ?? fallback)`. The fallback copy ("This part isn't currently available for your vehicle. Browse universal-fit accessories or change your vehicle to see what fits.") only renders when the API returns a body without an `error` field. But `/api/cart/route.ts:80-82` always returns `{ error: "No purchasable variant found for ${handle}" }` on 422, so the customer always sees the technical message including the URL-style handle.
- **What's wrong:** Customer reads "No purchasable variant found for stehlen-universal-door-frame-mount-roof-rack" — they don't know what a "variant" is, the handle is engineering nomenclature, and there's no recovery action. The intended friendly copy is unreachable.
- **Why it matters:** F-3's fix surfaced the failure (huge win), but the message the customer reads is worse than no message in some cases — it makes Stehlen look broken rather than "this specific part isn't available." A customer who sees the friendly copy at least knows to try a different product or call support; a customer who sees the raw error closes the tab.
- **Pattern name:** "human-recovery copy"
- **Fix:** Two options. (a) Invert the precedence: `throw new Error(fallback)` always; ignore the API's error field for customer display (keep it for analytics). (b) Server side at `/api/cart/route.ts`, return both fields: `{ error, customerMessage }` and have the BuyBox prefer `customerMessage`. Either is a 5-minute change. Also include the `tel:1-888-378-4536` link inline so the customer has an out.
- **Validation:** Before/after: customer-facing error text. Track `add_to_cart_failed` analytics event with the message variant.

---

## What I still want done from cycle-1

These were on cycle-1 but not in the cycle-2 fix scope. Priority for next sprint:

- **F-6** (mobile collection filter rail): still hidden on mobile.
- **F-7** (pagination): still hard-coded "PAGE 1" disabled buttons.
- **F-11** (hard-coded ETA "Wed Apr 22 — Fri Apr 24 to 90210"): now actively misleading because dates are 11 days stale.
- **F-15** (mobile bottom nav): not shipped.
- **F-16** (≥2 yellow CTAs in hero viewport): not addressed.
- **F-19** (cart-side tax 8.75% / shipping flat): unchanged.
- **F-24** (chat FAB collides with sticky ATC bar): now worse because the sticky bar exists.
- **F-29** (PDP gallery shows 4× same image): unchanged.

---

## Verification status table

| Fix | Cycle-1 ID | Status | Severity if regressed |
|---|---|---|---|
| Home hero YMM modal wiring (desktop + mobile) | F-1 | **PASS** | — |
| Home yellow band YMM modal wiring | F-1 | **PASS** | — |
| PDP sub-model gate doesn't auto-default | F-2 | **PASS** | — |
| PDP ATC disabled with "SELECT {GROUP}" copy | F-2 | **PASS** | — |
| ATC 422 surfaces visible error | F-3 | **PARTIAL** (visible but raw API copy) | HIGH (new F-31) |
| Sticky mobile ATC bar | F-4 | **PASS** | — |
| Mobile chrome SELECT YOUR VEHICLE → modal | F-5 | **PASS** | — |
| `/collections/{bad-handle}` → friendly empty state | not in cycle-1 list | **PASS** | — |
| Cart promo whitelist | not in cycle-1 list | **PASS (code)** | — |
| PDP fitment hero — neutral CHECK FITMENT when unverified | not in cycle-1 list | **PASS** | — |
| ProductCard ribbon — neutral when `fits===undefined` | not in cycle-1 list | **PASS** | — |
| Vehicle Hub — vehicle-aware generations | F-8 | **PARTIAL** (data-driven gens land; "12 GENERATIONS / bumper-to-bed" stat still generic) | MEDIUM |

---

## Conversion KPI risk: MEDIUM (down from HIGH)

The structural breaks I called out in cycle-1 are gone. The home YMM picker is no longer a fake dropdown, the PDP gate actually gates, the mobile chrome no longer dumps users into `/collections`, and 422s now surface to the customer. These were the four catastrophic conversion silenced-failures. They're fixed.

The site's remaining funnel risks are now optimization-class (tax math, mobile filter rail, sticky-bar / FAB collision, ATC error copy refinement), not foundation-class. The single must-fix-before-launch from this audit is **F-31** — the raw API error reaching the customer's eyes is still trust-destroying. The visible red box was the right architectural choice; the copy needs one more pass.

If F-31 ships and the cycle-1 holdovers (F-6, F-7, F-11, F-15) get into the next sprint, conversion-KPI risk drops to LOW.
