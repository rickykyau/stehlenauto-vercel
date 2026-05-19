# Cycle 14BD R2 — QA Verification: Amazon-Imported Customer Reviews (fix1 batch)

**Verdict: PASS**

Date: 2026-05-19
Tester: Ren Müller
Environment: http://localhost:3037 (local dev, Next.js 16 dev server)
Viewports tested: 375px (mobile) + 1280px (desktop)
Primary KEEP handle: `2007-2019-bmw-x5-x6-class-3-trailer-hitch-black-13077` (5 reviews, all 5★)
1-review handle: `1994-2002-dodge-ram-1500-2500-3500-horizontal-front-grille-matte-black` (1 review, 5★)
1-review Dodge Ram screenshots: `dodge-ram-1review-reviews-tab-content.png`

---

## R1 Findings — Verification Matrix

| ID | R1 Finding | Status | Evidence |
|----|------------|--------|----------|
| BLOCKER F-1 | ASIN cross-product audit — 11 mis-mapped bundles in amazon-reviews.json | FIXED | See below |
| BLOCKER F-2 | Impala cross-ASIN photos (B01FTGE16I_* bleed) | FIXED | No B01FTGE16I_* files in public/reviews/ |
| BLOCKER F-3 | ReviewsAnchor 19px tap target → 44px | FIXED | height=44px confirmed at both 375px and 1280px |
| Jordan F-3 | FTC disclosure color: muted → foreground with yellow dot | FIXED | Visual + code confirmed |
| Jordan F-4 | Pluralization: "reviews" when count=1 | FIXED | aria-label "1 customer review" + anchor text "1 review" confirmed |
| Jordan F-5 | ReviewCard photo separator: no visual break | FIXED | dashed borderTop + marginTop:16 visible in screenshot |
| Jordan F-10 | FilterBar shown on 1-review products | FIXED | 1-review handle shows no FilterBar |
| Mike F-2 | Lightbox close X unclickable (backdrop z-stacking) | FIXED | X button click closes lightbox (screenshot evidence) |
| Mike F-4 | WITH PHOTOS chip clipped on 375px | FIXED | All 3 chips visible without horizontal scroll at 375px |
| Mike F-5 | ★4(0) chip shown as disabled on all-5★ products | FIXED | Chip absent on BMW (and 11 other all-5★ handles per data audit) |

---

## Detailed Verification

### BLOCKER F-1: ASIN Cross-Product Audit

**Method:** `data/amazon-reviews.json` audited programmatically.

**Result:**
- Bundle count reduced from 31 → 21. PASS.
- All 11 dropped ASINs confirmed absent from `by_handle` keys: B07MDF528K (Tundra/Camry), B071SDM6H5 (Tacoma/Yaris), B087L29BNF (F-150 roll-up/tri-fold), B07JKLQPGL (Highlander/Prius), B07L8T474C, B01FTGE16I, B01N7FTO2D, B01FTGD6JQ, B07D6XZ6KF, B0832K18QL, B07JR9DQS5, B07D6YHSNV. PASS.
- Zero cross-ASIN image paths: programmatic check confirms all `images[]` basenames start with `{bundleAsin}_`. PASS.

**PDP verification — 4 of 5 dropped handles exercised via browser:**

| Handle | REVIEWS tab | Stars in buy-box | aggregateRating in JSON-LD |
|--------|-------------|------------------|---------------------------|
| `2000-2007-toyota-tundra-sequoia-advanced-bull-guard-matte-black` | ABSENT (6 tabs) | ABSENT | ABSENT |
| `2005-2011-toyota-tacoma-honeycomb-mesh-front-grille-matte-black` | ABSENT (6 tabs) | ABSENT | ABSENT |
| `04-09-toyota-highlander-lexus-rx-class-3-trailer-hitch-black` | ABSENT (6 tabs) | ABSENT | ABSENT |
| `2006-2016-chevy-impala-front-lower-bumper-grille-matte-black` | ABSENT (6 tabs) | ABSENT | ABSENT |
| `2001-2008-honda-pilot-acura-mdx-class-3-trailer-hitch-13328` | NOT TESTABLE — handle not in mock catalog. Redirects to BMW handle. Data-level fix (B01N7FTO2D removal) confirmed via DROP_ASINS audit. |

All 4 testable handles: PASS.

**Defensive ingest guard:** `scripts/ingest-amazon-reviews.ts` line 163 filters image basenames: `.filter((basename) => basename.startsWith(\`${asin}_\`))`. Confirmed present. Future ingests will auto-reject cross-ASIN photos.

---

### BLOCKER F-2: Impala Cross-ASIN Photos

**Method:** `find public/reviews -name "B01FTGE16I_*"` returned empty. Filesystem cross-check: 61 files on disk, 61 files referenced in JSON, 0 orphans. PASS.

---

### BLOCKER F-3 (ReviewsAnchor tap target) + Jordan F-4 (pluralization)

**BMW handle — desktop 1280px:**
- height: 44px, minHeight: 44px, padding: 0 4px, marginLeft: -4px. PASS.
- aria-label: "Read 5 customer reviews, average 5 stars" (plural). PASS.

**BMW handle — mobile 375px:**
- height: 44px. PASS. No horizontal overflow (documentScrollWidth=365 < 375). PASS.

**1-review Dodge Ram handle:**
- aria-label: "Read 1 customer review, average 5 stars" (SINGULAR). PASS.
- Anchor text: "5 (1 review)" (SINGULAR). PASS.
- Tab label: "REVIEWS (1)". PASS.

---

### Jordan F-3: FTC Disclosure Hierarchy

**Code review (`reviews-tab.tsx` lines 308-343):**
- `color: "var(--color-foreground)"` + `fontWeight: 700` on the "Sourced from Amazon" label element.
- `<span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: 3, background: "var(--color-primary)" }} />` yellow accent dot present.

**Visual confirmation (screenshot `bmw-mobile-375-reviews-filterbar.png` and `dodge-ram-1review-reviews-tab-content.png`):**
- "SOURCED FROM AMAZON" renders uppercase bold with visible yellow dot.
- Reads as structural trust info — same visual weight as the AggregateBlock rating number.

PASS.

---

### Jordan F-5: ReviewCard Photo Separator

**Code review (`reviews-tab.tsx` lines 646-653):**
```
style={{
  marginTop: 16,
  paddingTop: 12,
  borderTop: "1px dashed var(--color-border)",
}}
```

**Visual confirmation:** `dodge-ram-1review-reviews-tab-content.png` shows dashed separator between review body paragraph and the customer photo thumbnail. PASS.

---

### Jordan F-10: FilterBar Hidden on 1-Review

**1-review Dodge Ram handle (visual, `dodge-ram-1review-reviews-tab-content.png`):** No filter chips, no sort dropdown visible between photo strip and review card. PASS.

**Code confirmation (`reviews-tab.tsx` line 105):** `{bundle.reviews.length >= 2 && (<FilterBar .../>)}`. Logic correct: <2 reviews = no FilterBar. PASS.

**Data audit:** 9 handles have review_count=1. All will correctly suppress FilterBar. No FilterBar on any 1-review handle by construction.

---

### Mike F-2: Lightbox Close X Button

**Test:** BMW handle, desktop 1280px. Click photo thumbnail → lightbox opens. Click `button[aria-label="Close"]` (X button, top-right) → lightbox closes.

**Evidence:**
- Pre-click: `bmw-lightbox-open.png` — X button visible top-right, dark backdrop (96% opacity), customer photo displayed.
- Post-click: `bmw-lightbox-closed.png` — dark overlay gone, back to reviews tab content.
- DOM check: no `[role="dialog"]` with `aria-modal="true"` in DOM after close.

**Root cause of R1 failure confirmed fixed:** `zIndex: 2` on close/prev/next buttons in `review-lightbox.tsx` (lines 162, 188, 213) allows click events to reach them over the backdrop. PASS.

---

### Mike F-4: WITH PHOTOS Chip Visible Without Horizontal Scroll at 375px

**Visual (`bmw-mobile-375-reviews-filterbar.png`):** At 375px viewport, FilterBar shows "ALL", "★ 5 (5)", "WITH PHOTOS" chips on the same row with flex-wrap. No horizontal scroll. "WITH PHOTOS" fully visible, not clipped.

**Code confirmation (`reviews-tab.tsx` lines 473-479):** chip group has `flex: "1 1 auto", minWidth: 0, flexWrap: "wrap"`. PASS.

---

### Mike F-5: ★4(0) Chip Hidden on All-5★ Products

**Visual (`bmw-mobile-375-reviews-filterbar.png`):** Only "ALL", "★ 5 (5)", and "WITH PHOTOS" chips present. No ★4 chip. PASS.

**Code confirmation (`reviews-tab.tsx` line 501):** `{dist[1] > 0 && (<button... ★ 4 ({dist[1]})>)}`. Gate is `> 0` not a disabled prop. Chip is absent from DOM entirely, not merely disabled. PASS.

**Data coverage:** 12 of 21 kept handles have all-5★ reviews (no ★4). 1 handle has a ★4 review (Ford Expedition) but is a 1-review handle so FilterBar is suppressed entirely. Zero handles can produce a visible ★4(0) chip by construction. PASS.

---

## Regression Checks (surfaces adjacent to changed code)

| Surface | Result |
|---------|--------|
| REVIEWS tab show/hide on kept handles | PASS — BMW has REVIEWS tab; Tacoma/Highlander/Impala/Tundra do not |
| Buy-box stars row show/hide | PASS — BMW shows stars; dropped handles do not |
| aggregateRating in JSON-LD — no-review handles | PASS — Tundra, Tacoma, Highlander, Impala: Product schema present, aggregateRating absent |
| aggregateRating in JSON-LD — review handle | PASS (confirmed in R1, no code change touched this path) |
| Tab strip functionality (click switches panel) | PASS — tab click stays on same URL, panel content switches |
| No horizontal scroll at 375px (PDP) | PASS — documentScrollWidth=365 < viewportWidth=375 |
| ReviewsAnchor height at mobile | PASS — 44px measured at 375px |
| Lightbox keyboard ESC (R1 was PASS, verify no regression) | PASS — ESC handler unchanged in code |
| PhotoStrip render on BMW | PASS — 11 thumbnails visible in screenshot |
| AggregateBlock star distribution bars | PASS — 5★ bar full, 4★ bar empty, visible in screenshot |
| FilterBar present on ≥2-review handle | PASS — BMW (5 reviews) shows FilterBar |
| No B01FTGE16I image files on disk | PASS — filesystem confirmed empty for that ASIN prefix |

---

## New Findings

None. Zero new findings across all tested surfaces.

---

## Playwright Session Artifact — Documented (Not Re-Flagged)

During testing, evaluate()-based `stehlen:tabs:switch` dispatch calls from earlier in the session persisted as window event listeners, causing subsequent tab clicks to navigate away from the current PDP. This is a Playwright session contamination artifact, not a site bug. Confirmed by:
1. Fresh page navigations (browser.navigate) always land on the correct URL.
2. Code review of PdpTabs `stehlen:tabs:switch` handler shows it only calls `setTab()` — no navigation logic. The redirect was caused by stale test-session evaluate() state.
3. The tab click itself (Playwright `click()`) stays on the correct URL when the session is clean.

---

## What Was Not Covered in This Round

- iOS Safari (requires device or BrowserStack)
- Firefox
- Touch swipe-down dismiss on lightbox (requires real touch events)
- Screen reader / VoiceOver full pass
- Honda Pilot/MDX handle (`2001-2008-honda-pilot-acura-mdx-class-3-trailer-hitch-13328`) — not in mock catalog, cannot browser-test. Data fix (B01N7FTO2D in DROP_ASINS) confirmed.
- ★4 chip display on the Ford Expedition 1-review handle (FilterBar suppressed entirely at 1 review — cannot exercise chip on that handle by design)

---

## Regression Scope Covered

| Surface | Covered |
|---------|---------|
| data/amazon-reviews.json bundle count (31→21) | YES |
| All 11 DROP_ASINS absent from by_handle | YES |
| Zero cross-ASIN image paths in JSON | YES |
| B01FTGE16I_* files removed from disk | YES |
| Dropped PDP handles — no REVIEWS tab | YES (4/5, 1 not in mock) |
| Dropped PDP handles — no stars row | YES (4/5) |
| Dropped PDP handles — no aggregateRating in JSON-LD | YES (4/5) |
| Kept handle (BMW) REVIEWS tab render | YES |
| ReviewsAnchor tap target ≥44px (desktop + mobile) | YES |
| ReviewsAnchor aria-label pluralization (1 vs N) | YES |
| FTC disclosure color foreground + yellow dot | YES |
| ReviewCard photo separator (dashed top border + marginTop) | YES |
| FilterBar hidden on 1-review handles | YES |
| FilterBar ★4 chip hidden when dist[1]=0 | YES |
| WITH PHOTOS chip visible at 375px without scroll | YES |
| Lightbox X button click closes (zIndex fix) | YES |
| Mobile horizontal scroll (375px) | YES |
| Defensive ingest guard in script | YES |

---

## Sign-off

**PASS** — safe to ship.

All R1 blockers (F-1, F-2, F-3) resolved. All Jordan findings (F-3, F-4, F-5, F-10) resolved. All Mike findings (F-2, F-4, F-5) resolved. Zero new findings. The review feature is clean for production deploy.

Pre-deploy reminder per standing protocol: re-test on production after deploy (or on a production-mirroring staging environment). This test was conducted against localhost:3037 dev server.
