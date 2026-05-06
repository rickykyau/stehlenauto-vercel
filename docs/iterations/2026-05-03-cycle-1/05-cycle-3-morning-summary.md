# Cycle-3 morning summary (2026-05-03)

**Mike's wallet score:** 0.7 → 2.0 → **2.0** (3 missions averaged; Wrangler 4, F-150 2, Tacoma 0)

## Three things to know

1. **The commerce rail is alive.** Real Shopify checkouts at $701 and $959 reaching `stehlenauto.myshopify.com/checkouts/cn/...`. First time ever in three cycles. Cart 422s eliminated, YMM modal works, bumpers populated.

2. **Fitment-honesty layer cracked open in three new places.** PDP "similar products" rail says "✓ FITS YOUR WRANGLER" over F-150 racks. Cart banner says "ALL ITEMS FIT" over a mixed F-150/Tundra/Wrangler basket. Card chips say "CHECK FITMENT" even when the title literally contains the user's vehicle. Same root cause — three fixes from one helper.

3. **Catalog reality:** $1M+/yr revenue gap from missing coverage on F-150 P702 / Ram DT / Silverado K2XX-T1XX / Tundra 3rd gen / Tacoma 4th gen / Wrangler-Gladiator headlights. Owner-driven sourcing list, not a dev problem.

## What goes to dev next (cycle 4, ~3 days, gets Mike to 6/10)

1. One-pass fitment-honesty fix (similar-products + cart banner + card chips)
2. Mobile filter drawer (`hidden md:block` blocks 60%+ of traffic)
3. Facet counts from full collection, not visible 24
4. Filter URL state wiring
5. Search vehicle-pre-filter fail-open
6. Home POPULAR_VEHICLE tiles → verified real `/vehicle/[slug]`
7. PDP buy-block contradiction kill
8. YMM picker tap-bleed disable

## What goes to merch next (~5 warehouse days)

1. Headlights — 27 splits + 41 metafields (saves ~$52K/yr per 1000 orders, confirms owner's $40-60K estimate)
2. Bull guards — Ram DS/DT split + 4Runner TRD-Pro exclusion (~17 SKUs)
3. **HARD HOLD: 51 running boards.** Same bracket P/N claimed across 2-3 chassis gens. **4 of these are Stehlen-branded** — biggest brand-trust risk in the catalog. Warehouse must verify physical brackets before relisting. $45-70K/yr return risk if launched as-is.
4. Floor mats — recategorize 11 trunk/frunk mats

## What goes to owner (sourcing)

- F-150 P702 (21-25) — #1 selling US truck, near-zero coverage
- Ram DT 1500 (19-25) — 7 years of new body, no aftermarket coverage
- Silverado K2XX (14-18) + T1XX (19-25)
- Tundra 3rd gen (22-25) — zero
- Tacoma 4th gen (24-25) — zero (entire generation)
- Wrangler/Gladiator headlights (any) — zero
- Private-label lanes with zero current Stehlen SKUs: floor mats, MOLLE, under-seat storage

## Methodology fix

Cycle 4 Mike runs must be **sequential, not parallel.** Three Mikes sharing one Playwright browser produced a slate of "auto-redirect / vehicle reverting / ghost cart" complaints that were entirely test artifacts (other agents driving the same browser). The legitimate kernel inside those complaints (search returns 0 for valid query, fitment lying) is captured in the dev list above.

## Files

- `04-cycle-3-synthesis.md` — full P0-P3 backlog, score targets, ICE-prioritized ship list
- `parts-headlights-deep-dive.md` — 160-SKU split spec
- `parts-catalog-audit-remaining-7.md` — running boards / bull guards / floor mats / etc.
- `mike-mission-{1,2,3}-cycle-3.md` — three mission reports
