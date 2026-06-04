# Stehlen Auto — ML Pipeline Strategy
## ChannelAdvisor Data to Revenue

**Reference:** `marketing/plan/00_master_marketing_plan.md`
**Tasks:** `marketing/tasks/master_task_list.md` (Phase 1 & 3)

---

## Data Sources

### 1. ChannelAdvisor (Primary — 10+ years)
- **Account 1:** Profile 33001142 (CA_1 in .env)
- **Account 2:** Profile 60000669 (CA_2 in .env — listing/images account)
- **Data available:** Orders, line items, products, buyer info, pricing, channel attribution
- **API:** REST API v1 (`https://api.channeladvisor.com/v1/`)
- **Extraction:** `scripts/channeladvisor_extract.py`

### 2. GA4 (Site Behavior — Growing)
- **Property ID:** 529120634
- **Measurement ID:** G-YS6SFM9QFD
- **API:** Google Analytics Data API (OAuth, token.json)
- **Scripts:** `marketing/analytics/` directory

### 3. Shopify (Orders + Products)
- **Store:** http-stehlenauto-com.myshopify.com
- **API:** Admin API (GraphQL + REST)
- **Credentials:** In .env (SHOPIFY_ACCESS_TOKEN)

---

## ML Models — Prioritized by Revenue Impact

### MODEL 1: RFM Customer Segmentation
**Priority:** HIGHEST — build first
**Revenue impact:** Enables all email targeting + audience building
**Build time:** 3 days
**Dependencies:** ChannelAdvisor data extracted

**What it does:** Segments 10-year buyer base into actionable groups:
- Champions (high R, high F, high M) — VIP treatment
- Loyal Customers — nurture and upsell
- At-Risk — re-engage before they churn
- Hibernating — winback with strong offers
- Lost — low priority

**Tech stack:**
- Python (pandas, scikit-learn for K-Means enhancement)
- Input: ChannelAdvisor order history
- Output: Customer-level CSV with RFM scores + segment labels
- Deployment: Upload to Klaviyo as custom properties, upload to Meta/Google as audiences

**Script:** `scripts/ml/rfm_segmentation.py`

---

### MODEL 2: Vehicle-Based Product Recommendations
**Priority:** HIGH — highest AOV lever
**Revenue impact:** 8-15% AOV lift from cross-sell
**Build time:** 2 weeks
**Dependencies:** ChannelAdvisor order items loaded, YMM extraction

**What it does:** "Customers who bought brake pads for a 2018 F-150 also bought..." using co-purchase patterns from 10 years of transaction data.

**Tech stack:**
- Python (pandas, scipy sparse matrices, cosine similarity)
- Input: ChannelAdvisor order line items (multi-item orders)
- Output: SKU-to-SKU recommendation table
- Deployment: Supabase table, queried by Lovable PDP component

**Script:** `scripts/ml/vehicle_recommendations.py`

---

### MODEL 3: Category Demand Forecasting
**Priority:** HIGH — prevents stockouts, optimizes ad timing
**Revenue impact:** Prevents $15K+/month in lost stockout revenue + 15-25% ROAS improvement from seasonal ad timing
**Build time:** 2 weeks
**Dependencies:** ChannelAdvisor weekly demand data aggregated

**What it does:** Predicts weekly demand per product category for next 6 months, incorporating 10 years of seasonal patterns.

**Tech stack:**
- Python (Prophet)
- Input: Weekly units sold per SKU/category, 10 years
- Output: Forecast CSV with peak-week calendar
- Deployment: Peak-week calendar feeds ad budget planning; inventory alerts

**Script:** `scripts/ml/demand_forecast.py`

---

### MODEL 4: Lookalike Audience Generation
**Priority:** HIGH — directly reduces CAC
**Revenue impact:** 30-60% CAC reduction vs. cold audiences
**Build time:** 2 days (after RFM complete)
**Dependencies:** RFM segmentation done

**What it does:** Exports top customer profiles (Champions + Loyal) as structured seed audiences for Meta and Google Lookalike targeting.

**Tech stack:**
- Python (pandas, hashlib for email hashing)
- Input: RFM segments + zip codes + purchase categories
- Output: Hashed CSV for Meta Custom Audiences, Google Customer Match

**Script:** `scripts/ml/lookalike_export.py`

---

### MODEL 5: Price Optimization
**Priority:** MEDIUM — pure margin play
**Revenue impact:** 5% margin lift on inelastic SKUs
**Build time:** 1 week
**Dependencies:** ChannelAdvisor demand signals loaded

**What it does:** Uses 10 years of price-vs-volume data to estimate price elasticity per SKU category. Recommends optimal prices.

**Tech stack:**
- Python (pandas, scikit-learn LinearRegression)
- Input: Historical unit price vs. units sold per SKU
- Output: Elasticity scores + pricing recommendations

**Script:** `scripts/ml/price_optimization.py`

---

### MODEL 6: Churn Prediction
**Priority:** MEDIUM — improves winback targeting
**Revenue impact:** More precise than RFM for winback timing
**Build time:** 4 days
**Dependencies:** RFM + inter-purchase gap analysis

**What it does:** Predicts which customers are about to permanently lapse based on their personal purchase cadence.

**Tech stack:**
- Python (lifelines for survival analysis, scikit-learn LogisticRegression)
- Input: Full order history per customer, gap between purchases
- Output: Churn probability scores, winback priority list

**Script:** `scripts/ml/churn_prediction.py`

---

## Models NOT Worth Building (Engineer Veto)

| Model | Reason |
|---|---|
| Real-time recommendation engine | Static table updated weekly performs identically at this traffic level |
| Individual SKU demand forecasting | Single-digit monthly sales per SKU; forecast at category level instead |
| NLP/sentiment on reviews | Just read the 50 reviews manually |
| Deep learning anything | XGBoost outperforms neural nets at this data volume |
| Customer 360 / CDP | 3 months integrating, 0 months using insights |
| Automated dynamic pricing | Legal risk on marketplaces; manual pricing decisions better |
| A/B testing framework | Traffic too low for statistical significance |

---

## Implementation Timeline

| Week | Model | Output | Revenue Unlock |
|---|---|---|---|
| 3-4 | RFM Segmentation | Customer segments in Klaviyo | Reactivation email campaigns |
| 4 | Lookalike Export | Seed audiences in Meta/Google | 30-60% lower CAC on paid |
| 5-6 | Vehicle Recommendations | Cross-sell table in Supabase | 8-15% AOV lift |
| 7-8 | Demand Forecasting | Peak-week calendar | Optimized ad timing |
| 9 | Price Optimization | Pricing recommendations | 5% margin lift |
| 10-11 | Churn Prediction | Winback priority scores | Better-timed winback flows |

---

## Supabase Schema

See CTO's schema design for:
- `ca_orders` — raw ChannelAdvisor orders
- `ca_order_items` — line items with SKUs
- `ca_products` — product catalog bridge
- `sku_shopify_bridge` — CA SKU to Shopify mapping
- `unified_customers` — identity resolution across accounts
- `customer_features` — pre-computed ML feature store
- `sku_demand_signals` — weekly demand data for forecasting

Schema SQL: `scripts/schema/channeladvisor_schema.sql`

---

## GA4 Analysis Scripts

| Script | Purpose | Frequency |
|---|---|---|
| `marketing/ga4_traffic_analysis.py` | Traffic sources, devices, geo, landing pages | Weekly |
| `marketing/ga4_product_performance.py` | Product-level funnel, leaky buckets | Weekly |
| `marketing/ga4_weekly_kpi_snapshot.py` | KPI dashboard snapshot | Every Monday |
