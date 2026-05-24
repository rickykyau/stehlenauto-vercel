# Cycle 14BE R1 QA Report — Ren Müller
**Date:** 2026-05-23  
**Environment:** http://localhost:3037 (dev, commit 1b6c913 branch main)  
**Viewport:** Desktop Chrome (default). Vehicle states tested: Toyota Camry (no-fit), Ford F-150 (fit), unauthenticated.  
**Verdict: CONDITIONAL PASS — 1 MINOR new finding, ship with follow-up logged.**

---

## Check Status Table

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 1 | Collection zero-state: /collections/tonneau-covers + Toyota Camry | FIXED | All tonneaus render with DOES NOT FIT badges. No empty state, no SELECT BED LENGTH gate. |
| 2 | Klaviyo PurchaseTracker: /order/confirmation?id=STH-TEST | FIXED | `<PurchaseTracker>` mounts, sessionStorage key `stehlen:purchase:fired:STH-TEST=1` confirms useEffect fired. Dev suppresses network send (expected). |
| 3 | Arrival date in trust row | FIXED | "Arrives by Thu, May 28 if ordered tomorrow" rendered. Date math correct for post-2PM PT on Fri May 23 (processDays=2, transit=3, skip Sat/Sun = Thu May 28). |
| 4 | "Call our techs" tel link | FIXED | `href="tel:+18883784536"` present in trust row. Text: "Call our techs 1-888-378-4536 · Mon–Fri 9–5 PT". |
| 5 | COMPLETE THE BUILD rail | FIXED (with catalog note) | Renders correctly with F-150 garage, appears ABOVE SIMILAR PRODUCTS. 1 card rendered (headlights) instead of 2-3 because truck-bed-mats catalog has zero F-150 products. Code is correct — catalog gap only. See MINOR-1. |
| 6 | Welcome back / Continue your build home rail | FIXED | "WELCOME BACK / CONTINUE YOUR BUILD FOR THE 2020 FORD F-150" with fitment-verified product cards renders when F-150 in garage. |
| 7 | Cart misfit recovery link | FIXED | "Find one that fits your Toyota Camry →" link to `/vehicle/2022-toyota-camry` renders below DOES NOT FIT chip per misfit line. MIXED FITMENT banner also present. |
| 8 | Express checkout purple button | FIXED | Button shows "EXPRESS CHECKOUT · APPLE PAY · SHOP PAY · AFFIRM" with `background: #5a31f4`. Replaces old "BUY NOW WITH AFFIRM" plain button. |
| 9 | INSTALLATION tab — BMW X5 PDP | FIXED | Difficulty chip (MODERATE), time (60 MIN), people (2 PEOPLE), drill (NO DRILLING), tools list (5 tools), ordered install steps (6 steps), warnings card (2 warnings). Full install guide from trailer-hitches category. |
| 10 | Install tab fallback for non-mapped category | CONDITIONAL PASS | Code path verified: `getInstallGuide(null)` returns null, PdpTabs renders placeholder. All 12 catalog categories are mapped — fallback not triggerable in current catalog. No regression. |
| R1 | REVIEWS tab still works | PASS | REVIEWS (5) tab renders real Amazon reviews, 5.0 average, verified-purchase badges. |
| R2 | Buy-box stars anchor deep-link | PASS | Click dispatches `stehlen:tabs:switch { tab: "reviews" }`, tab switches to REVIEWS (5). |
| R3 | YMM modal from header CHANGE VEHICLE | PASS | Modal opens (`aria-modal="true", aria-label="Select your vehicle"`). Previous navigation was a session-state artifact — not re-flagged. |

---

## New Findings

### MINOR-1: COMPLETE THE BUILD rail renders 1 card instead of 2–3 for F-150 on trailer-hitch PDPs

**Severity:** P3 — cosmetic/AOV impact but no incorrect behavior.  
**Environment:** F-150 garage · /products/2007-2019-bmw-x5-x6-class-3-trailer-hitch-black-13077  
**Root cause:** `COMPLEMENT_MAP["trailer-hitches"] = ["truck-bed-mats", "headlights"]`. The truck-bed-mats collection contains zero Ford F-150 products (all 24 SKUs are Toyota Tundra/Tacoma variants). `hideMismatches: true` filters them out, leaving 0 candidates from that complementary category. Rail renders with only 1 card (headlights).  
**Not a code bug.** The logic at `src/app/products/[handle]/page.tsx:138–145` is correct. Fix requires either (a) adding F-150 bed mat SKUs to the catalog, or (b) falling back to universal-fit products when fitment-specific picks are empty.  
**Suspected fix area:** `src/lib/catalog/complements.ts` — add universal-fit fallback for truck-bed-mats, OR warehouse to add F-150 bed mat SKUs.  
**Regression risk:** None from current code.

---

## Regression Scope Covered

- /collections/tonneau-covers (Jordan F-1 fix path)
- /order/confirmation?id=STH-TEST (PurchaseTracker mount)
- /products/2007-2019-bmw-x5-x6-class-3-trailer-hitch-black-13077 (trust row, express button, installation tab, complete-the-build rail, reviews tab, stars anchor)
- /collections/truck-bed-mats (complement category validation)
- / (welcome back rail, YMM modal, garage pill)
- /cart (misfit recovery link, MIXED FITMENT banner)

## Out of Scope This Cycle

- Cross-browser (iOS Safari, Firefox) — localhost-only, dev environment
- Mobile viewport (375px tap targets on new features)
- TypeScript compile — confirmed clean by owner pre-sweep
- Cart drawer (regression from prior cycles, not in 14BE scope)
- YMM modal full flow (year→make→model→save) — covered in prior cycles

**CONDITIONAL PASS — safe to ship. MINOR-1 cataloged as P3 follow-up. No blockers.**
