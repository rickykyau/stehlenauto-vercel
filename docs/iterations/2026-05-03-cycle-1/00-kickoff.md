# Cycle 1 — First weekly drumbeat

**Trigger:** owner requested first end-to-end committee review of the live storefront.
**Date:** 2026-05-03
**Surfaces under review:** entire storefront — home, search, vehicle hub, collection, PDP, cart, checkout, account, content pages, RIG chat. All 30 routes are in scope.
**KPIs in play:** conversion (UX + marketing), CTR/open rate (marketing), return-rate risk (parts), organic traffic / indexed pages (SEO), buy-decision rating (Mike).
**Live URL:** http://localhost:3000 (dev server running locally for this cycle).

## Committee dispatch (parallel)

All five specialists run in parallel against the same live site. Time-box per agent: 25 minutes.

| Agent | Mission |
| --- | --- |
| `customer-tester` (Mike) | THREE shopping missions, one per truck. Mobile + desktop mixed. He's the loudest voice in the synthesis — owner explicitly weights his report highest. |
| `ux-designer` (Jordan) | Full funnel audit — home → search → PDP → cart → checkout. 1440px AND 390px. Vehicle-set AND no-vehicle states. |
| `auto-parts-specialist` | Audit fitment data + sub-model gating + PDP install copy. Flag any return-rate landmines. |
| `seo-specialist` (Priya) | Crawl-budget health, schema, sitemap, internal linking, render strategy on top routes. |
| `marketing-director` (Marcus) | Funnel readiness for Phase 1 paid traffic + lifecycle. Don't author campaigns yet — review the foundation. |

## Ship gate

- `[CRITICAL]` from any agent: ship within 48h, no debate.
- `[HIGH]`: batch into morning summary, owner approves.
- Mike scoring < 5 on Would-I-Buy on any mission: P0, must fix before next cycle.
- Any conflict between specialists: PM tie-break per the role-rule.

## Exit criteria for the iteration loop (multi-cycle)

Stop iterating when:
1. Mike scores ≥8 on both Would-I-Buy and Would-I-Return across THREE different missions.
2. No specialist returns `high` KPI risk.
3. Zero open `[CRITICAL]` findings from any agent.

If we plateau (3 consecutive cycles without improvement), Sam escalates to owner with the blocker.

## Sam's call

Cycle 1 dispatch firing. Synthesis doc lands in `01-synthesis.md` once all five reports are in.
