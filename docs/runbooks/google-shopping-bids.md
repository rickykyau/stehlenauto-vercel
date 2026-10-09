# Google Shopping bids — how they're set and kept current

Campaign: **Shopping - Standard - All Products - Tiered** (Google Ads 444-923-5809,
Merchant Center 5750851984), Standard Shopping, Manual CPC, $50/day, US, Google Search only.

## Mechanism

Bids are not set product-by-product in Google Ads. The campaign's product groups are
subdivided on **custom_label_3**, one max CPC per bucket:

| custom_label_3 | Max CPC |
|---|---|
| `bid_025` … `bid_200` | $0.25 … $2.00 (the number is cents) |
| `exclude_*` (oos, low_aov, lighting, returns, dry_pocket) | Excluded |
| Everything else (unlabelled / new) | Excluded |

`scripts/catalog/update-gshop-bid-labels.py` recomputes the labels from Shopify (price,
product type, title, stock) and writes only what changed. Re-running it re-prices the
campaign with no Google Ads edits. The Shopify Google channel pushes label changes to
Merchant Center within a few hours.

**Runs daily at 05:20 on JL-SQL**: task `\JL BI\Sync Google Shopping Bid Labels (StehlenAuto.com)`
→ `C:\Apps\Scripts\Sync-GShopBidLabels.ps1` (repo: `scripts/windows/`) exports CB landed cost
from `JLDataMart.shopify.vInventoryItem`, then runs `C:\Apps\Scripts\update-gshop-bid-labels.py`.
Logs: `C:\Apps\Scripts\logs\gshop-bid-labels-*`. After editing the Python script in the repo,
copy it to the server (WinRM, see reference_jlsql_remote_access) — bid logic lives only there.

Manual run from the Mac (no CB cost → uses the 31.7% median margin):
```
python3 scripts/catalog/update-gshop-bid-labels.py [--cost-csv cost.csv]           # dry run
python3 scripts/catalog/update-gshop-bid-labels.py [--cost-csv cost.csv] --apply   # write
```

## Formula (2026-10-08)

`bid = price × CVR(price) × net margin / 1.25 × category × vehicle × stock depth`, rounded
down to a bucket — i.e. each product bids for a ROAS 25% above its own breakeven (1 / margin).
×1.15 for $100–200 items (owner call: buyers' comfort zone).

- **Margin (real, per product):** (Shopify price − CB EffectiveCost − EstShipping_C) / price.
  2026-10-08: median 31.7%, p10–p90 28.3–33.8%; tri-folds lowest (28.5%). Lighting minus 12%
  for returns. < 10% net → excluded. Products missing from CB fall back to 31.7%.
- **CVR by price:** ≤$200 1.6%, $200–350 1.2%, $350–500 1.0%, $500+ 0.8% (AOV-band
  ecommerce benchmarks; auto-parts Shopping CVR 1.3–1.5%, CPC $0.56–1.50).
- **Category:** hard tri-fold tonneau ×1.5 (≈$645 vs Gator EFX ≈$650, BAKFlip ≈$1,200);
  rock sliders / roof racks / running boards ×1.2; hitches, bull guards ×1.0 (MC benchmark:
  hitches 10–57% under market); grilles ×0.8 (MC: car grilles 18–39% over market);
  roll-up / hidden-snap tonneau ×0.7 (no price edge).
- **Excluded:** price < $100 (can't pay back a ~$0.60+ click), bed/floor mats, out of stock,
  dry-pocket list, >8% return-rate SKUs, lighting with < 12 units (or all lighting if
  `LIGHTING_ENABLED = False` — flip it if the headlight moisture defect is unresolved).
- **Vehicle (2025 US sales):** F-150 / Silverado / Ram 1500 ×1.15, Tacoma / Sierra ×1.1,
  Tundra / Wrangler ×1.0, Frontier / other ×0.9.
- **Stock depth** (in-stock quartiles 5/12/24/50 units): ≥50 ×1.25, ≥24 ×1.15, ≥12 ×1.0,
  5–11 ×0.9, 1–4 ×0.7.

## Review cadence

- **Daily (automated, 05:20 JL-SQL):** stock, price and cost changes flow into bids.
- **Weekly:** search-terms report → negatives; Merchant Center → Analytics → Pricing for
  products that drifted above benchmark.
- **Day 14 (~$700 spent):** ROAS < 1.5x → cut buckets / categories. **Day 30:** ≥ 3x →
  +20% budget per week. **~50 conversions:** move to Maximize Conversion Value, then tROAS.
- Replace the price-band CVR guesses with real per-category CVR once there are ~300+
  clicks per category.

## Sources

- Margins: `marketing/plans/02_data_driven_gtm_strategy.md` (CB ERP analysis)
- Benchmarks: foundrycro.com/blog/google-shopping-benchmarks-by-category-2026,
  adbacklog.com/blog/google-shopping-ads-benchmarks-per-industry-2025,
  dtcpages.com/blog/ecommerce-conversion-rate-benchmarks-2026
- Vehicle sales: carscoops.com/2026/01/2025-us-car-sales-trucks-win-again-evs-slide
- Competitor prices: frontdeskreview.com (Tyger T3, Gator EFX, BAKFlip MX4), westinautomotive.com
