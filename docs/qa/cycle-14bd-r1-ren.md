# Cycle 14BD R1 — QA Report: Amazon-Imported Customer Reviews

**Verdict: FAIL — DO NOT SHIP**

Date: 2026-05-19  
Tester: Ren Müller  
Environment: http://localhost:3037 (local dev, Next.js 16 dev server)  
Viewports tested: 375px (mobile) + 1280px (desktop)  
Primary test handle: `2007-2019-bmw-x5-x6-class-3-trailer-hitch-black-13077` (5 reviews, 5★)  
Fallback handle: `stehlen-universal-door-frame-mount-roof-rack` (0 reviews)  
Data integrity handles also inspected: `2000-2007-toyota-tundra-sequoia-advanced-bull-guard-matte-black`, `2006-2016-chevy-impala-front-lower-bumper-grille-matte-black`

---

## Blockers (must fix before ship)

### [BLOCKER] BUG-14BD-001: Review bundle mapped to wrong product — Tundra bull guard shows Toyota Camry window visor reviews

**Severity:** BLOCKER — Displaying reviews for a fundamentally different product is an FTC violation and destroys brand trust.

**Environment:** `http://localhost:3037/products/2000-2007-toyota-tundra-sequoia-advanced-bull-guard-matte-black` · any viewport · no auth

**Steps to reproduce:**
1. Navigate to `/products/2000-2007-toyota-tundra-sequoia-advanced-bull-guard-matte-black`
2. Observe buy-box stars row shows "5 (2 reviews)"
3. Click REVIEWS (2) tab
4. Read the review bodies

**Expected:** Reviews describe a 2000-2007 Toyota Tundra/Sequoia bull guard install experience.

**Actual:** Both reviews describe window visor installation on a Toyota Camry. Review title: "Affordable vent shades." Body: "wipe the edge of the area with alcohol before you install these vent shades." ASIN in the data bundle is B07MDF528K whose amazon_title is "Curved Style Smoke Window Visors Deflector Vent Shade Guard 4 Pieces v2 Compatible with 02-06 Toyota Camry" — a completely unrelated product.

**Evidence:** `data/amazon-reviews.json` lines 40-74. ASIN B07MDF528K mapped to handle `2000-2007-toyota-tundra-sequoia-advanced-bull-guard-matte-black`.

**Suspected fix:** The ingest script (`scripts/ingest-amazon-reviews.ts`) matched this ASIN to the wrong Shopify handle. The correct ASIN for the Tundra/Sequoia bull guard must be re-identified, or this handle must be removed from `data/amazon-reviews.json` entirely until the correct match is found.

**Regression risk:** All 31 mapped handles should be audited for ASIN-to-handle accuracy. If the ingest logic used fuzzy string matching, other handles may also carry wrong-product review bundles.

---

### [BLOCKER] BUG-14BD-002: Chevy Impala grille — 2 of 6 review images reference a different product's ASIN

**Severity:** BLOCKER — Customer photos from a different product displayed as reviews for this product. FTC deception risk.

**Environment:** `http://localhost:3037/products/2006-2016-chevy-impala-front-lower-bumper-grille-matte-black` · REVIEWS tab

**Steps to reproduce:**
1. Navigate to the Chevy Impala grille PDP
2. Open REVIEWS tab
3. Reviews from reviewers "Matt" (R340UVO54GORM9) and "XCLUSIIVDESTINY" (R3K9ETFS5NF7EU) display images

**Expected:** All customer photos reference the 2006-2016 Chevy Impala front grille (ASIN B07L8T474C).

**Actual:** Two reviews' image paths reference ASIN `B01FTGE16I` (a different product), not `B07L8T474C`. The image filenames in `data/amazon-reviews.json` are `B01FTGE16I_R340UVO54GORM9_1.jpg`, `B01FTGE16I_R340UVO54GORM9_2.jpg`, `B01FTGE16I_R3K9ETFS5NF7EU_1.jpg`. These images may load from `public/reviews/` and appear on screen but they belong to a different product.

**Evidence:** `data/amazon-reviews.json` lines 382-400. Review IDs R340UVO54GORM9 and R3K9ETFS5NF7EU have image paths under B01FTGE16I, not B07L8T474C.

**Suspected fix:** These two reviews were likely ingested from a different ASIN during the scrape batch. Either remove them from the Impala bundle or verify they genuinely review the Impala grille (unlikely given the ASIN mismatch).

**Regression risk:** Other handles may have cross-ASIN image contamination from the same ingest batch.

---

## Major (fix before ship — not immediately revenue-blocking but degrades the FTC/trust posture)

### [MAJOR] BUG-14BD-003: Stars link (`ReviewsAnchor`) has 19px tap target on mobile — below 44px minimum

**Severity:** MAJOR — The stars/count row in the buy box is the primary entry point to the REVIEWS tab from the buy box. At 19px height with no padding, it fails WCAG 2.5.5 (44px minimum for interactive targets) and will be chronically missed-tapped on iOS Safari.

**Environment:** `http://localhost:3037/products/2007-2019-bmw-x5-x6-class-3-trailer-hitch-black-13077` · 375px viewport · mobile

**Steps to reproduce:**
1. Load PDP at 375px
2. Inspect the stars + "(5 reviews)" row in the buy box
3. Measure tap target height

**Expected:** Interactive element height >= 44px (WCAG 2.5.5, CLAUDE.md rule).

**Actual:** `ReviewsAnchor` `<a>` element renders at height=19px, paddingTop=0, paddingBottom=0, minHeight=auto. No enclosing element adds hit area.

**Screenshot:** `mobile-buybox-stars.png` shows the row is visually small relative to the product title and price.

**Suspected fix:** `src/components/commerce/reviews-anchor.tsx` — add `minHeight: 44, paddingTop: 12, paddingBottom: 12` to the `<a>` style block, or wrap in a container with `minHeight: 44`.

**Regression risk:** Low — isolated component. Does not affect the tab itself (tabs are 48.59px, PASS).

---

## Findings from tested surfaces — full results

### TC-01: REVIEWS tab visibility — product WITH reviews
- **Handle:** BMW X5/X6 Class 3 Trailer Hitch
- **Result:** PASS — Tab renders as "REVIEWS (5)", visible in tablist alongside FITMENT/FEATURES/SPECS/INSTALLATION/SHIPPING/WARRANTY. `aria-selected` correctly updates on click.

### TC-02: REVIEWS tab visibility — product WITHOUT reviews
- **Handle:** `stehlen-universal-door-frame-mount-roof-rack`
- **Result:** PASS — No REVIEWS tab rendered. Tab list shows 6 tabs (no REVIEWS). Stars row absent from buy box. No "(0)" shown anywhere. `hasAggregateRating: false` in JSON-LD.

### TC-03: Buy-box stars row — product WITH reviews
- **Result:** PASS (desktop). MAJOR (mobile — see BUG-14BD-003).
- Stars row present, aria-label "Read 5 customer reviews, average 5 stars", href "#pdp-tabs".
- `stehlen:tabs:switch` event dispatched on click — confirmed tab switched to REVIEWS in snapshot.

### TC-04: AggregateBlock — content and FTC disclosure
- **Result:** PASS
- Rating display: "5.0" with aria-label "5.0 out of 5 stars". PASS.
- Review count: "5 verified reviews". PASS.
- Star distribution bars: 5★=5, 4★=0, 3★=0, 2★=0, 1★=0. PASS (all 5 reviews are 5★, bar reflects this).
- FTC disclosure: "SOURCED FROM AMAZON" (uppercase mono) + descriptive text — present inside the AggregateBlock card, same visual hierarchy as rating. PASS per spec.

### TC-05: PhotoStrip render
- **Result:** PASS (confirmed via snapshot ref e321)
- "Customer Photos · 11 from 5 customers" header renders.
- 11 thumbnails rendered as `<button>` elements with correct aria-labels ("View install photo N by [name], N out of 5 stars").
- ScrollSnapType applied (horizontal snap on overflow).

### TC-06: FilterBar
- **Result:** PASS
- All filter chip (★5, ★4, With photos) and sort (Most Helpful, Most Recent, Highest Rated) present.
- ★4 chip is `disabled` when dist[1]=0 (all BMW reviews are 5★). PASS.
- ★5 chip shows "(5)". PASS.
- Sort select has 3 options: helpful/recent/highest. PASS.

### TC-07: FilterBar empty state
- **Not fully exercised** due to Playwright session instability. Based on code review: `filteredReviews.length === 0` renders `<p>No reviews match these filters.</p>`. The code path is correct. Mark as CONDITIONAL PASS pending manual re-test with a 2-review handle where ★5 filter would exclude all results (all BMW reviews are 5★ so this can't be triggered there; the Chevy Silverado or Dodge Ram with only ★5 reviews has the same issue). Recommend testing with the Ford Expedition grille (handle: `2003-2006-ford-expedition-vertical-style-front-grille-black-abs`) which has 1 review at ★4 — filter for ★5 should produce the empty state.

### TC-08: ReviewCard list
- **Result:** PASS
- 5 review articles rendered.
- Each article: stars, title (h3), reviewer name, "✓ Verified Purchase" badge, "Amazon" source, date, review body, photo thumbnails, helpful vote count.
- Default sort is "Most Helpful" — Flyboy10 (21 helpful votes) renders first. PASS.
- `isLast` prop correctly removes bottom border on last article.

### TC-09: Footer CTA
- **Result:** PASS (confirmed via snapshot ref e455-457)
- "Bought this and want to share your install? Email us a photo + your story."
- "Email Your Review" `<a href="mailto:reviews@stehlenauto.com?subject=My%20Stehlen%20Review">` renders as link. minHeight=44 in code. PASS.

### TC-10: Lightbox — open, keyboard nav, ESC close
- **Result:** PASS
- Open: clicking photo strip button opens `role="dialog" aria-modal="true" aria-label="Customer photo viewer"` via portal.
- Focus: `closeBtnRef.current?.focus()` moves focus to Close button on open.
- ArrowRight: advanced from "1 / 11" to "2 / 11". PASS.
- ESC: closes lightbox. Confirmed `dialog` element removed from DOM after ESC.
- Counter: "N / 11" displays correctly.
- Backdrop close button present (`Close photo viewer` aria-label). PASS.

### TC-11: Tab strip mobile scroll affordance
- **Result:** PASS
- At 375px, scrollWidth=792 > clientWidth=333 — all 7 tabs do not fit without scrolling. PASS (scrollable).
- maskImage: `linear-gradient(to right, rgb(0,0,0) calc(100% - 32px), rgba(0,0,0,0))` applied. Fade affordance present. PASS.
- Tab tap targets: 48.59px. PASS (≥44px).

### TC-12: JSON-LD — aggregateRating + review array + publisher
- **Result:** PASS (BMW handle)
- `aggregateRating: { "@type": "AggregateRating", ratingValue: 5, reviewCount: 5, bestRating: 5, worstRating: 1 }`. PASS.
- `review` array: 5 entries (all 5 reviews sliced). PASS.
- All 5 reviews have `publisher: { "@type": "Organization", "name": "Amazon" }`. PASS.
- No-reviews handle: no `aggregateRating`, no `review` in JSON-LD. PASS.

### TC-13: Collection page — ProductCard stars only when reviews > 0
- **Result:** PASS
- BMW X5/X6 card shows "5 (5)" in the card link text — real aggregate surfaced.
- Other cards in trailer-hitches collection (no Amazon reviews mapped): no stars row rendered.
- No "(0)" shown on any card.

### TC-14: Home page — no fake review counts
- **Result:** PASS
- No star elements, no "(0)" patterns, no review count patterns on home page.

### TC-15: No horizontal scroll on mobile PDP
- **Result:** PASS — documentScrollWidth=365 < viewportWidth=375. No horizontal overflow.

---

## Data-integrity audit results

The `data/amazon-reviews.json` file contains 31 mapped handles. During code review I identified 2 confirmed data-integrity failures:

| Handle | Mapped ASIN | Actual ASIN Product | Verdict |
|--------|-------------|---------------------|---------|
| `2000-2007-toyota-tundra-sequoia-advanced-bull-guard-matte-black` | B07MDF528K | Toyota Camry window visor shades | WRONG PRODUCT |
| `2006-2016-chevy-impala-front-lower-bumper-grille-matte-black` | B07L8T474C (correct) but 2 reviews reference B01FTGE16I images | Different ASIN images cross-contaminating | CROSS-ASIN PHOTOS |

Both are confirmed BLOCKER-level issues.

**Recommended action before ship:** Full audit of all 31 handles in `data/amazon-reviews.json`:
1. Verify each ASIN's Amazon product title matches the Shopify product title (make/model/product type).
2. Verify all review image paths use the same ASIN as the bundle's ASIN.
3. Auto-reject any bundle where ASIN product title has zero semantic overlap with the Shopify product title.

---

## Regression scope covered

| Surface | Covered |
|---------|---------|
| PDP REVIEWS tab — show/hide | YES |
| PDP buy-box stars row — show/hide, deep-link | YES |
| AggregateBlock — rating, count, distribution, FTC disclosure | YES |
| PhotoStrip — render, aria-labels | YES |
| FilterBar — chips, sort, disabled state | YES |
| ReviewCard list — sort order, content, helpful votes | YES |
| Footer mailto CTA | YES |
| Lightbox — open, keyboard nav, ESC, counter | YES |
| JSON-LD — aggregateRating + review array + publisher | YES |
| No-reviews graceful fallback (all 3 surfaces) | YES |
| ProductCard stars (collection page) | YES |
| Home page — no fake counts | YES |
| Mobile tap targets (tabs + lightbox buttons) | YES |
| Mobile horizontal scroll | YES |
| Tab strip mobile scroll affordance | YES |
| ReviewsAnchor tap target (mobile) | YES — FAIL |
| Filter empty state (no reviews match filter) | NOT EXERCISED — Playwright session instability |
| Lightbox swipe dismiss (mobile) | NOT EXERCISED — requires actual touch events |
| Cross-browser (iOS Safari) | NOT EXERCISED — requires device/BrowserStack |

## What was not covered

- iOS Safari — tab bar overflow, history-API behavior, lightbox touch swipe, focus-visible on ReviewsAnchor
- Firefox
- Filter chip empty state (interactive exercise — code review confirms path exists, needs manual test on a suitable product)
- Touch swipe-down dismiss on lightbox
- `?dim=` URL parameter interaction with REVIEWS tab (unrelated feature, out of scope for this cycle)
- Screen reader / VoiceOver full pass

---

## Sign-off

**FAIL — DO NOT SHIP.**

Two blockers exist in the review data (`data/amazon-reviews.json`) that would publish factually wrong reviews on live PDPs. BUG-14BD-001 (wrong product entirely — Camry window visor reviews on a Tundra bull guard) is a direct FTC violation. BUG-14BD-002 (cross-ASIN photo contamination on the Impala grille) is a secondary data integrity failure from the same ingest batch.

Required before re-test:
1. Fix BUG-14BD-001 — remove or re-map the Tundra/Sequoia bull guard bundle in `data/amazon-reviews.json`.
2. Fix BUG-14BD-002 — remove the two cross-ASIN reviews (R340UVO54GORM9 + R3K9ETFS5NF7EU) from the Impala grille bundle, OR verify they genuinely belong there (very unlikely given ASIN mismatch).
3. Audit all 31 handles for the same class of problem before R2.
4. Fix BUG-14BD-003 (P2) — add `minHeight: 44` and vertical padding to `ReviewsAnchor` for mobile tap target compliance. Can ship with this open if owner accepts risk, but recommend fixing in the same commit.

All non-data feature surfaces (tab render/hide, AggregateBlock, PhotoStrip, FilterBar, ReviewCard, Lightbox, JSON-LD schema, mobile scrollability, tap targets on tabs) tested PASS on the BMW X5/X6 handle.
