# Cycle 14BF R1 — Mike Re-Rate

**Verdict: 8/7/8** (up from 7/7/7) — 1 BLOCKER + 1 MAJOR + 1 MINOR found

Date: 2026-05-24 · Tester: Mike Rodriguez · Environment: http://localhost:3037

---

## Re-ratings Table

| Job | 14BE | 14BF | Δ | Remaining blocker |
|---|---|---|---|---|
| New customer | 7 | **8** | +1 | No reviews/social proof on most PDPs |
| Returning customer | 7 | **7** | 0 | /track-order kicked to /sign-in despite "No account needed" |
| Browser | 7 | **8** | +1 | Wishlist 401 noise + recently-viewed sparse at 2 items |

---

## Friction Log

- **F-1 [BLOCKER]** /track-order says "No account needed" but submitting the form kicks the customer straight to /sign-in. Every eBay buyer migrating to stehlenauto.com hits the wall and bounces. Single biggest blocker on the returning-customer job. **THIS IS THE ONE FEATURE THAT WAS BUILT TO ADDRESS MISSION 2 — AND IT'S DEAD.**

- **F-2 [MAJOR]** Wishlist heart fires a 401 to /api/wishlist on every anonymous save. Doesn't break UX today but logs console errors on every browse-mode shopper. Fix: only call /api/wishlist when `isSignedIn === true`; rely on localStorage otherwise.

- **F-3 [MINOR]** Recently-viewed strip shows 2 thumbnails in a 2-up grid on a 1440px screen. Looks like a loading error. Pad with "shop more" tiles when history is thin.

- **F-4 [MINOR]** "12 years" — brand was founded 2015 (CLAUDE.md + footer say so). 2026 - 2015 = 11. Math is off by one. Skeptical buyers catch this.

- **F-5 [MINOR]** Cold-visit garage state showed prior session vehicle. Likely HMR artifact.

---

## What Worked

- **Brand trust strip lands credibly.** "12 years" + "50,000+ trucks" + "Real techs · 1-888-378-4536" — first two are quantitative, last is human. Reads above the fold on first scroll. This is the right placement.
- **Recently-viewed strip is vehicle-personalized** ("CONTINUE YOUR BUILD FOR THE 2024 RAM 1500"). RealTruck doesn't do this — they show generic "recently viewed" with no vehicle context. Genuine differentiator.
- **YMM modal** is three fast taps with popular-makes shortcut. Real UX improvement.

---

## What Competitors Do Better

- **RealTruck**: Track order works without login. Shopify Admin order API + email match returns real status page. That's the bar.
- **AutoZone**: Wishlist secondary CTA reads "Sign in to sync across devices" AFTER local save. Stehlen fires a 401 silently — worse in both code hygiene and trust.

---

## Specific Remaining Blockers per Job

**New customer (1-2 to hit 10/10):**
1. Real product reviews on PDP buy box — even 3-5 seeded with star ratings
2. "Ships by [day]" date estimate (more concrete than "free shipping")

**Returning customer (1-2 to hit 10/10):**
1. **FIX /track-order to actually work without Clerk auth** (F-1 BLOCKER)
2. Show shipping carrier + tracking link on the result page

**Browser (1-2 to hit 10/10):**
1. Fix wishlist 401 on anonymous users (F-2)
2. "Sign in to sync across devices →" nudge after anonymous wishlist save

---

## Buy Decision

- Would I check out today? **MAYBE — for new customer. NO — for track-order.**
- "Would I buy" rating: **7/10**
- "Would I come back" rating: **7/10** (unchanged — track-order is broken, kills the loop)

Mike's verdict: trust strip + recently-viewed are real improvements; but the one feature that promised to fix my "forced login to track an order" complaint is broken, and that's the whole returning-customer job in one button click.
