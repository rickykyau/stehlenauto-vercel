# Morning summary — read this first

> Sam Hartley, PM. Written 2026-05-03, after one full discover-ship-verify cycle.

## TL;DR — what changed while you slept

- **Site moved from BLOCK to MEDIUM-RISK.** Every structural break the committee found is fixed in code.
- **Mike's score went from 1/10 to 3/10 Would-I-Buy** on the F-150 tonneau mobile mission. The remaining 7 points are gated on warehouse data, not code.
- **17 fixes shipped overnight, all verified.** 3 cycle-2 regressions also caught and fixed.
- **No mission completes a real checkout.** The blocker is the live Shopify store has wrong/missing data — Tundra products tagged as Ford F-150 fits, 4 truck lines missing from YMM tree, mock-catalog handles don't reconcile to real Shopify variants.

## What needs your call this morning (3 things)

1. **Approve / revert the 17 cycle-1 fixes.** Diffs are committable; nothing's pushed yet. Look at any of the bullets in `02-cycle-results.md` and tell me what to roll back.
2. **Decide the warehouse path.** Until Stehlen's catalog is uploaded into Shopify with fitment-correct tags, no amount of code fixes will make the buy flow work end-to-end. Three options:
   - (a) You / the Stehlen ops team upload — Sam suggests starting with the top 100 SKUs across roof racks + tonneaus + bumpers (Mike's three missions hit those).
   - (b) Pause iteration cycles, focus implementer-time on Phase 5 SEO + marketing carry-overs that don't need the catalog.
   - (c) Run a separate "data audit" cycle where the parts specialist + I draft the exact Shopify tag schema needed — give to ops as a spec.
3. **Cycle cadence going forward.** Today's cycle was triggered by your "go" — should we run another tomorrow morning regardless, or wait for a trigger (warehouse upload, design handoff, owner request)?

## Where to read in detail

- **`02-cycle-results.md`** — full ship list + verification verdicts table + KPI movement
- **`01-synthesis.md`** — Sam's full ranked backlog (the 27 findings, ICE-scored, what shipped vs deferred vs owner-gated)
- **`mike-mission-*-cycle-2-verify.md`** — Mike's exact words on what improved
- **All 4 cycle-1 specialist reports** — `jordan-ux-audit.md`, `parts-specialist-audit.md`, `priya-seo-audit.md`, `marcus-marketing-readiness.md`

## Live state

- Dev server running at `http://localhost:3000` (background, will keep running)
- Build: clean (lint clean, typecheck clean, prod build ✓)
- 30 routes
- Catalog: mock fallback active (Shopify connection works for predictive search but not for cart variant resolution because handles don't match)

## Sam's specific recommendation

If I had to pick one thing for you to do at 9am: **send a 100-SKU upload spec to the warehouse.** Everything else the committee found, the code-side has been addressed. Until the catalog is real, we're polishing a showroom with no inventory.

If you don't want to do that today: tell me to run cycle 3 against the Phase 5 SEO + marketing carry-overs (the F-6/F-7/F-8/F-9/F-10 list from Priya, plus Klaviyo proxy endpoints from Marcus). That work moves us toward production readiness without needing warehouse data — but Mike's buy rating won't move higher until #2 is solved.

— Sam
