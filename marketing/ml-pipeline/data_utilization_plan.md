# Stehlen Auto — Data Utilization Plan
## CTO + CMO Joint Strategy — March 21, 2026

**Reference:** `marketing/plan/00_master_marketing_plan.md`
**Tasks:** `marketing/tasks/master_task_list.md`

---

## Data Sources Summary

### ConnectedBusiness (CB) — PRIMARY SOURCE
- **Connection:** `CB_READONLY_DB_CONNECTION_STRING` in .env (pyodbc)
- **Database:** JLConceptsProduction18 (JLDataMart inaccessible — needs DBA access grant)
- **1,227,565 sales orders** (2018-present, 8 years)
- **100,912 RMA/returns** with reason codes (RMAproblem_C field)
- **872,989 unique customers** with email, name, address, phone
- **31,623 products** (21,054 active), full COGS at line-item level
- **Revenue:** $15-20M/year on marketplaces
- **Channel mix:** Amazon ~552K, eBay ~107K, Direct ~1.1M customers

### Rithum (ChannelAdvisor) — SUPPLEMENTAL
- **Account 1 (33001142):** 17K products, 7K orders
- **Account 2 (60000669):** 37K products, 61K orders (PRIMARY selling account)
- **Order history:** ~16 months only (Nov 2024-present)
- **Unique data:** eBay real buyer emails, eBay vehicle fitment (SpecialInstructions), sales velocity, multi-warehouse inventory
- **NOT available via API:** Listing performance (impressions/clicks/CVR), pricing history, Best Offer data

### GA4 — SITE BEHAVIOR (Minimal currently)
- Property: 529120634, Measurement ID: G-YS6SFM9QFD
- Events confirmed: view_item, add_to_cart, begin_checkout, add_payment_info
- Currently ~27 sessions/90 days (pre-launch)

---

## Key Discovery: This Is a $15-20M Business

The CB data reveals annual marketplace revenue of $16-21M. The $1M Year 1 target for the direct site is 5-7% of existing marketplace revenue. This is highly achievable by redirecting even a small fraction of the 872,989 existing customers.

---

## Critical Data Gaps

1. **Fitment data:** Only 10/31,623 items have structured Make/Model/Year. Embedded in item names — needs NLP extraction (regex + Claude API).
2. **Email opt-in:** IsOkToEmail NULL for 81% of contacts. Need legal classification into 4 buckets.
3. **Channel mapping:** No single clean marketplace field. Must derive from WebSiteCode + email domain + SellerAccount_C.
4. **JLDataMart access:** DBA needs to grant jl_readonly access.

---

## ETL Pipeline — 10 Scripts in Build Order

| # | Script | Input | Output | Purpose |
|---|---|---|---|---|
| 1 | `etl/cb_extract.py` | CB SQL Server | `data/raw/cb_*.parquet` | Extract raw data from CB |
| 2 | `etl/rithum_sync.py` | Rithum REST API | `data/raw/rithum_*.parquet` | Extract Rithum data |
| 3 | `etl/transform_channel_map.py` | Raw orders | `data/processed/orders_with_channel.parquet` | Derive clean channel labels |
| 4 | `etl/transform_orders.py` | Raw orders + channel map | `data/processed/fact_orders.parquet` | Build order facts |
| 5 | `etl/transform_customers.py` | Raw customers + orders | `data/processed/dim_customers.parquet` | Build customer dimension |
| 6 | `etl/merge_rithum.py` | Rithum + CB data | `data/processed/dim_customers_enriched.parquet` | Add eBay real emails |
| 7 | `etl/fitment_nlp.py` | Product names | `data/processed/dim_fitment.parquet` | Extract YMM from item names |
| 8 | `etl/build_email_segments.py` | Customers + channel | `data/processed/email_segments.parquet` | Classify email compliance |
| 9 | `etl/load_supabase.py` | All processed files | Supabase tables | Load to warehouse |
| 10 | `ml/rfm_segmentation.py` | Customer dimension | `data/ml/rfm_segments.parquet` | Score all customers |

---

## ML Models — Revised Priority

| Priority | Model | Feasibility | Build Time | Revenue Impact |
|---|---|---|---|---|
| 1 | **RFM Segmentation** | HIGH (873K customers, 8 years) | 3 days | Enables all email targeting |
| 2 | **Customer LTV (BG/NBD)** | HIGH (dense purchase history) | 1 week | Prioritizes high-value reactivation |
| 3 | **Churn Prediction (XGBoost)** | HIGH (ground truth labels available) | 1 week | Times winback campaigns |
| 4 | **Product Profitability** | HIGH (COGS at line level) | 3 days | Identifies margin traps |
| 5 | **Fitment Confidence** | HIGH (100K RMA records) | 1 week | Reduces return rate |
| 6 | **Channel Propensity** | MEDIUM (multi-channel data) | 1 week | Targets direct migration |
| 7 | **Demand Forecasting (Prophet)** | HIGH (8 years weekly data) | 2 weeks | Prevents stockouts |
| 8 | **Semantic Search (pgvector)** | MEDIUM (need traffic first) | 1 week | Can't measure until traffic exists |

---

## Email Compliance — 4 Buckets

| Bucket | Criteria | Count (est.) | Action |
|---|---|---|---|
| A: Opted In | IsOkToEmail = 1 | ~166K | Load into Klaviyo immediately |
| B: Reconfirmation | Direct channel, NULL opt-in, real email | ~200K | Send one reconfirmation email first |
| C: Marketplace Masked | @marketplace.amazon.com, @members.ebay.com | ~659K | Cannot email — use platform retargeting |
| D: Opted Out | IsOkToEmail = 0 | ~341K | Hard suppress, never contact |

---

## 90-Day Data Roadmap

| Week | Deliverable | Marketing Action Unlocked |
|---|---|---|
| 1 | CB raw data extracted, channel map drafted | None — data not clean yet |
| 2 | Supabase loaded, RFM segments computed, Bucket A list ready | First winback email to Champions/Loyal |
| 3 | Fitment extracted (85%+ catalog), RMA correlation report | Vehicle-segmented emails, Bucket B reconfirmation |
| 4 | LTV scores, churn scores, product profitability report | High-LTV VIP messaging, churn prevention flow |
| 5-6 | Rithum merge (eBay real emails), channel propensity model | eBay→direct acquisition offer, velocity-based listing decisions |
| 7-8 | Admin dashboard live, A/B test infrastructure | CMO has live reporting, first experiment |
| 9-12 | Fitment classifier, demand forecasting, semantic search | Inventory alerts, automated Klaviyo flows, site search improvement |
