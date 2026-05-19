# Cycle 14BD R2 — Jordan Mercer UX Audit: Fix1 Batch Verification
**Date:** 2026-05-19
**Reviewer:** Jordan Mercer, Senior UX/UI (auto-parts)
**Scope:** Verify all 7 fix1 batch items landed; regression hunt on AggregateBlock + cross-sell + mobile wrap
**Viewports tested:** 1280px desktop, 375px mobile, 360px mobile (spec floor)
**Test handles:** BMW X5 hitch (5 reviews), Dodge Ram horizontal grille (1 review), Ford Expedition vertical grille (1 review, 4-star — only 4-star product in bundle), Dodge Ram vertical grille (4 reviews), Chevy Silverado grille (2 reviews), trailer-hitches collection page

---

## Funnel Impact Summary

- **Overall risk: LOW** — All 7 targeted fix1 items are confirmed landed and correct. Zero new UX regressions introduced by the fix1 batch. The 10-bundle drop (31 → 21) degraded gracefully with no broken ProductCard states. The three deferred items (F-6, F-8, F-9) remain as previously documented recommendations; none worsened.
- **Top 3 remaining items by estimated lift x implementation cost:**
  1. F-9 (MINOR): Sort dropdown native caret — append `appearance: none` + explicit chevron — 30-minute fix, physical Android dark mode only, zero Playwright risk.
  2. F-6 (MEDIUM): Default REVIEWS tab for confirmed-fit sessions — A/B candidate. Not a regression but worth scheduling.
  3. F-8 (LOW): PhotoStrip scroll progress indicator — future sprint.

---

## Fix Verification Results

### F-1 [BLOCKER → RESOLVED] Bundle count: 31 → 21 confirmed

**How verified:** `data/amazon-reviews.json` inspected via `data.by_handle` keyset. Count: 21 handles. The 10 quarantined bundles (including the confirmed Tundra bull guard → Camry visor ASIN mismatch) are absent from the file. The 21 remaining handles were spot-checked against their product types — all consistent.

**Downstream effect on ProductCards:** `ProductCard` renders the star row only when `reviews > 0`. For handles that lost their bundle, the star row is simply absent — no broken or zeroed state. Confirmed on the collection page (`/collections/trailer-hitches`) where the BMW X5 hitch card shows `5 (5)` correctly and other hitch cards without bundles show no stars at all.

**Status: PASS.**

---

### F-2 [BLOCKER → RESOLVED] ReviewsAnchor tap target ≥ 44px

**How verified:** `getBoundingClientRect` via Playwright snapshot with `boxes: true`.

- **Desktop 1280px** (5-review BMW hitch): anchor box `[width=154, height=44]` — exact 44px floor.
- **Mobile 375px** (5-review BMW hitch): anchor box `[width=161, height=44]` — 44px confirmed.
- **Mobile 360px** (4-review Dodge Ram vertical): anchor box `[width=161, height=44]` — 44px confirmed at the spec-floor viewport.

The inner stars render at 14px and the text span at 19px — but the outer `<a>` expands to the full 44px via `minHeight: 44`. The `padding: "0 4px"` and `marginLeft: -4` preserve visual alignment. No layout disruption detected.

**Status: PASS.**

---

### F-3 [MAJOR → RESOLVED] FTC disclosure visual hierarchy

**How verified:** Accessibility tree snapshot of AggregateBlock in the REVIEWS tab (BMW hitch, 5 reviews). DOM structure confirmed:

```
generic: "Sourced from Amazon"   ← className="mono", color: var(--color-foreground), fontWeight:700, inline-flex with 6px yellow dot
generic: "Every review is verified purchase, 4 stars or higher..."  ← color: var(--color-muted), fontSize:12
```

The yellow 6×6px dot (`aria-hidden="true"`) draws the eye to the disclosure block as intended. The label renders in `var(--color-foreground)` (`#ffffff`) at 11px mono uppercase — structurally elevated from footnote treatment to trust-signal treatment. The `borderTop: "1px solid var(--color-border)"` separator cleanly demarcates it from the star distribution bars above.

**Visual hierarchy clash check (AggregateBlock yellow dot vs. yellow star bars):** The star bars fill a 6px-height track spanning full card width. The FTC dot is 6×6px positioned inline-left of the label text, separated from the star bar section by the border divider and 32px of vertical space (16px marginTop + 16px paddingTop). No visual conflict.

**One-yellow-CTA-per-viewport rule check:** The 6×6px FTC dot is a decorative accent, not a CTA button. It does not compete with the sticky ATC bar (56px tall, full-width) that may be co-visible when scrolled to the REVIEWS section. The convention applies to interactive CTA elements; this dot does not qualify. No rule violation.

**Dark mode:** Stehlen runs a single dark-first theme — no `prefers-color-scheme` switching in `globals.css`. `--color-primary: #f5a823` on the dark `--color-surface` card background has sufficient contrast. Not a concern.

**Status: PASS.**

---

### F-4 [MAJOR → RESOLVED] ReviewsAnchor aria-label pluralization

**How verified:** Aria-label extracted via Playwright snapshot (`boxes: true`) on the 1-review Dodge Ram horizontal grille handle (`1994-2002-dodge-ram-1500-2500-3500-horizontal-front-grille-matte-black`).

Result: `"Read 1 customer review, average 5 stars"` — correct singular.

Visible copy: `"5 (1 review)"` — also correct singular.

Also verified on the 4-review product: `"Read 4 customer reviews, average 5 stars"` — correct plural.

**Status: PASS.**

---

### F-5 [MAJOR → RESOLVED] ReviewCard photo separator

**How verified:** Source code (`src/components/commerce/reviews-tab.tsx`, lines 645-656) and visual screenshot of the 1-review Dodge Ram page at 1280px desktop.

The photo wrapper `<div>` has `marginTop: 16, paddingTop: 12, borderTop: "1px dashed var(--color-border)"`. The separator is visually clean — it reads as a structural break between the review body text and the photo thumbnails, not as a broken or overworked element. On mobile at 360px, the dashed border spans the full card width without truncation.

Accessibility tree confirms the structure is intact for the 4-star Ford Expedition product (1 review, 1 photo): `button "View install photo 1 by Jason Brown"` is a sibling of the review body paragraph, nested inside the photo wrapper div.

**Does it look broken or overworked?** No. The dashed style is consistent with Stehlen's industrial visual language. It's lighter than the solid `--color-border` dividers and reads as a secondary structural element, not a primary section break.

**Status: PASS.**

---

### F-7 [MINOR → RESOLVED] Lightbox backdrop opacity + X button mouse close

**How verified (backdrop):** Source code confirms `background: "rgba(0,0,0,0.96)"` on the backdrop button in `src/components/commerce/review-lightbox.tsx`, line 125. Previously 0.88, now 0.96.

**How verified (X button close):** Playwright test sequence on BMW hitch REVIEWS tab (1280px desktop):
1. Clicked "View install photo 1 by Flyboy10" — lightbox dialog confirmed present via `role=dialog` snapshot.
2. Clicked `role=button[name="Close"]` (the explicit X button, not the backdrop, not ESC).
3. Immediately queried `role=dialog` — returned "does not match any elements."

Lightbox correctly closed on mouse click of the X button.

**Status: PASS.**

---

### F-10 [NIT → RESOLVED] FilterBar absent on 1-review products + ★4(0) chip absent

**How verified (FilterBar gating):** Two 1-review products tested:
- `1994-2002-dodge-ram-1500-2500-3500-horizontal-front-grille-matte-black` (5★) — REVIEWS tab content: no "All", "★5", "With photos", or sort dropdown present. Only PhotoStrip + ReviewCard + footer CTA visible. PASS.
- `2003-2006-ford-expedition-vertical-style-front-grille-black-abs` (4★) — same result. FilterBar entirely absent. PASS.

The guard `bundle.reviews.length >= 2` is in place and working.

**How verified (★4(0) chip absent):** BMW hitch (5 reviews, all 5★). FilterBar shows: "All", "★ 5 (5)", "With photos". No "★ 4 (0)" chip. The `{dist[1] > 0 && (...)}` guard is working correctly.

**Note:** On the Ford Expedition 4★ product, `dist[0] = 0` (no 5★ reviews) and `dist[1] = 1` (one 4★ review). The FilterBar is not rendered at all (1-review gate), so the question of which star chips would show is moot. But if it were a 2-review product with all 4★, only "★ 4 (2)" chip would appear — confirmed by reading the source logic.

**Status: PASS.**

---

## Regression Hunting

### R-1 [PASS] AggregateBlock yellow dot does not clash with FTC hierarchy on the 4-star product

The Ford Expedition grille has `avg_rating: 4`. The AggregateBlock renders 4 filled stars (not 5), a 4.0 rating number, and the FTC section with yellow dot. The 5★ distribution bar renders at 0% width (empty track). The 4★ bar at 100% width fills with yellow. This does not create a confusion with the FTC dot — the bars are track elements in a grid, the dot is an 6×6px circle inline with text. Visually distinct.

### R-2 [PASS] 31 → 21 bundle drop: no broken ProductCard stars in collection rails

The `{reviews > 0 && (...star row...)}` guard in `src/components/commerce/product-card.tsx` (line 223) ensures handles without a bundle simply omit the star row. Confirmed by checking the `/collections/trailer-hitches` collection — products with bundles show correct aggregates, products without show no star row. No NaN, "0 (0)", or broken star states.

### R-3 [PASS] "With photos" chip not clipped at 375px or 360px

Playwright boxes measurement:
- 375px: "With photos" at `[box=156,y,116,44]` — right edge at 272px, clear of 375px boundary.
- 360px: "With photos" at `[box=156,y,116,44]` — right edge at 272px, clear of 360px boundary.

The `flex: "1 1 auto"` + `flexWrap: "wrap"` fix from R1 is holding. Chips reflow to a second line cleanly before reaching the viewport edge.

### R-4 [PASS] Lightbox "Close photo viewer" backdrop button dimensions

Backdrop button box: `[box=0,0,1270,900]` — full viewport coverage. Combined with the explicit X close button at `[box=1206,20,44,44]` (top-right), two distinct close paths are available. The backdrop covers the full view without exposing underlying content through transparency.

### R-5 [PASS] Mobile sticky ATC bar unaffected by reviews changes

BMW hitch at 360px: `button "ADD TO CART · $174.00"` at `[box=16,y,333,56]` — 56px height, full-width. No regression on sticky ATC from fix1 changes.

### R-6 [PASS] REVIEWS tab tab-strip does not overflow on 360px mobile

At 360px, the tab strip contains 7 tabs (FITMENT, FEATURES, SPECS, INSTALLATION, SHIPPING, WARRANTY, REVIEWS (5)). The `overflowX: auto` + right-edge mask fade is present and handles the overflow — confirmed by the snap showing all 7 tabs present in the tab list. No tabs are hidden or inaccessible.

---

## Deferred Items (unchanged from R1 — no action required)

### F-6 [MEDIUM] Default to REVIEWS tab when fitment confirmed

Status: Not addressed. Remains a recommendation for A/B testing. Not a regression; the conditional default logic discussed in R1 (`productFits === true && amazonReviews.review_count > 0`) has not been implemented and the spec gap has not worsened.

### F-8 [LOW] PhotoStrip scroll progress indicator

Status: Not addressed. The 11-photo strip on the BMW hitch still has no scroll progress indicator. Not a regression; photo engagement tracking would be needed to quantify the impact.

### F-9 [MINOR] Sort dropdown native caret invisible on Android dark mode

Status: Not addressed. The `<select>` in `FilterBar` (`src/components/commerce/reviews-tab.tsx`, line 533) has no `appearance: none`. The sort combobox is correctly labeled (`"Sort reviews by"` via `<span class="sr-only">`) and accessible to screen readers. The physical-device caret visibility issue remains.

**One specific note for F-9:** The recommended fix from R1 included wrapping the `<select>` with a `position: relative` label and an absolutely-positioned chevron icon. The current implementation uses an `inline-flex` `<label>` with `gap: 8` but no explicit chevron. If F-9 is addressed this sprint, it should also add `appearance: none` + `WebkitAppearance: none` + `padding: "0 32px 0 10px"` to the select, and render `Icons.chevDown` absolutely-positioned at `right: 10`. Full spec in R1 F-9.

---

## Grade: Fix1 Batch Adherence

| Fix | Target | Measured | Status |
|---|---|---|---|
| F-1: Bundle count | 21 | 21 | PASS |
| F-2: Tap target desktop | ≥44px | 44px | PASS |
| F-2: Tap target mobile 375px | ≥44px | 44px | PASS |
| F-2: Tap target mobile 360px | ≥44px | 44px | PASS |
| F-3: FTC label color | var(--color-foreground) | confirmed | PASS |
| F-3: FTC yellow accent dot | 6px, var(--color-primary) | confirmed | PASS |
| F-4: Aria-label 1 review | "1 customer review" (singular) | confirmed | PASS |
| F-4: Visible copy 1 review | "1 review" (singular) | confirmed | PASS |
| F-5: Photo separator | dashed border + marginTop:16 | confirmed | PASS |
| F-7: Backdrop opacity | 0.96 | confirmed in source | PASS |
| F-7: X button closes lightbox | dialog removed from DOM | confirmed | PASS |
| F-10: FilterBar absent on 1 review | FilterBar not rendered | confirmed x2 handles | PASS |
| F-10: ★4(0) chip absent | chip hidden when dist[1]=0 | confirmed | PASS |

---

**Conversion KPI risk: LOW** — All R1 blockers and majors are resolved. The reviews feature is now production-safe on the 21 verified handles. No new regressions introduced by the fix1 batch. The three deferred items (F-6, F-8, F-9) are low-to-medium priority and do not block banking this cycle. Recommend proceeding to deploy.
