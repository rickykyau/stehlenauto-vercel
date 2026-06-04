# Claude.ai Extended Thinking Prompt — Stehlen Auto Marketing Plan Optimization

Use extended thinking to analyze all data below and produce an optimized, actionable marketing plan. Think deeply about seasonality, channel sequencing, budget allocation, and the tax return season opportunity.

---

## BUSINESS CONTEXT

**Company:** Stehlen Auto (stehlenauto.com)
**Category:** Heavy-duty truck accessories — grilles, bumpers, lights, hitches, tonneau covers, body kits
**Target:** $2,000,000 Year 1 revenue on the direct-to-consumer channel (stehlenauto.com)
**Background:** This is NOT a startup. JL Concepts has been selling on eBay/Amazon/Walmart via ChannelAdvisor for 10+ years at $15-20M/year in marketplace revenue. Stehlen Auto is the new direct-to-consumer brand and website.

**Tech Stack:**
- Frontend: Lovable (React/TypeScript/Tailwind) — custom-built headless storefront
- Commerce: Shopify (checkout, payments, orders)
- Database: Supabase (customer data, ML features)
- Email marketing: Klaviyo (NOT yet set up — needs full configuration)
- Analytics: GA4 fully instrumented (view_item, add_to_cart, begin_checkout, purchase events all working)
- Customer data: ChannelAdvisor + ConnectedBusiness ERP (SQL Server)

**Current State (March 23, 2026):**
- Site is LIVE at stehlenauto.com with branded Shopify checkout
- 1,330 products loaded with YMM fitment selector, 12 category collections, 20+ vehicle make collections
- GA4 cross-domain tracking working
- ZERO revenue on stehlenauto.com so far (new channel)
- ZERO paid advertising running
- Klaviyo NOT configured
- No product reviews on site
- 30,293 additional SKUs available in ConnectedBusiness ERP for expansion
- Fitment matching just fixed (Dodge/Ram normalization, year range parsing, partial match states)

---

## CRITICAL TIMING: TAX RETURN SEASON IN 3 WEEKS

Tax refund season (mid-April through May) is the #1 selling season for truck accessories. Working-class truck owners receive $3,000-$8,000 tax refunds and spend on vehicle upgrades. This is a 6-8 week window that cannot be missed. Every day of delay costs revenue.

**Constraint:** We have approximately 3 weeks to get Klaviyo configured, email flows built, and initial paid campaigns live before the tax refund spending wave hits.

---

## CUSTOMER DATA ASSETS (Our Competitive Moat)

We have 10+ years of eBay/Amazon transaction data — 873,002 total customers. This data has been extracted, cleaned, and segmented via RFM analysis:

**Email List — Already Exported for Klaviyo Import (321,850 contacts):**

| RFM Segment | Contacts | Description |
|---|---|---|
| Champions | 36,681 | Highest value — $425 avg LTV, 6+ orders, bought recently |
| Loyal | 38,194 | Consistent repeat buyers |
| Potential Loyalists | 12,444 | 2-3 orders, showing loyalty signals |
| New Customers | 1,416 | Recent first-time buyers |
| At Risk | 91,423 | Were good customers, haven't bought recently |
| Can't Lose Them | 18,002 | High-value customers slipping away |
| About to Sleep | 9,742 | Engagement declining |
| Hibernating | 113,280 | Haven't bought in 1+ year |
| **TOTAL** | **321,850** | |

**Champions Sub-List (36,681 emails):** These are the highest-value customers with verified purchase history. They are the #1 asset for:
- Direct email reactivation (near-zero CAC)
- Meta Lookalike audience seed (no competitor has this)
- Google Customer Match targeting

**Additional Data Points per Customer:**
- First name, last name, city, state, ZIP
- Lifetime revenue, lifetime order count, AOV
- Last order date
- Primary sales channel

**Product Advertising Data — Also Exported:**
- `products_advertise_priority.csv`: Ranked by margin, units sold, revenue, return rate — ready for Google Shopping feed prioritization
- `products_exclude_list.csv`: Products with >8% return rate or negative inventory — exclude from paid ads

---

## FINANCIAL MODEL

**Unit Economics:**
- AOV: $214.85
- Gross margin: 35.2% ($75.52 per order after COGS + shipping)
- Orders needed: 9,308/year = 776/month = 26/day

**Existing Budget Plan (needs your review and optimization):**

| Month | Marketing Spend | Revenue Target | Cumulative Revenue |
|---|---|---|---|
| M1 | $1,189 | $30,000 | $30,000 |
| M2 | $11,039 | $60,000 | $90,000 |
| M3 | $17,639 | $100,000 | $190,000 |
| M4 | $23,139 | $140,000 | $330,000 |
| M5 | $27,139 | $170,000 | $500,000 |
| M6 | $31,139 | $200,000 | $700,000 |
| M7-12 | $34,139/mo | $185K-$280K/mo | → $2,000,000 |

**Year 1 Total Spend:** ~$316,000
**Blended ROI:** 6.3x

**Channel Revenue Attribution (existing plan):**

| Channel | Revenue | % | Spend | ROI |
|---|---|---|---|---|
| Email (Klaviyo) | $560,000 | 28% | $12,000 | 46.7x |
| Google Shopping | $700,000 | 35% | $110,000 | 6.4x |
| Google Search | $200,000 | 10% | $35,000 | 5.7x |
| Meta Ads | $200,000 | 10% | $90,000 | 2.2x |
| B2B/Wholesale | $280,000 | 14% | $5,000 | 56.0x |
| Organic/SEO | $40,000 | 2% | $0 | — |
| Insert cards | $20,000 | 1% | $9,600 | 2.1x |

---

## CUSTOMER SERVICE INTELLIGENCE (From Zendesk Analysis — 19,302 Tickets)

**Actual refund rate: 5.1%** (not 8% as previously estimated). Target: 3%.

**RMA Problem Type Breakdown (13,609 categorized returns):**

| Reason | % | Actionable Fix |
|---|---|---|
| Buyer remorse | 29.5% | Better product descriptions, photos, specs |
| Others (unclassified) | 25.5% | Improve ticket categorization |
| Product defect | 18.2% | Supplier QC escalation (headlights = 53% of defects) |
| **Fitment failure** | **10.8%** | **YMM verification pre-checkout (just fixed)** |
| Broken/damaged | 8.4% | Packaging improvements |
| Missing parts | 6.0% | Fulfillment QC |
| Shipped wrong item | 1.6% | Pick/pack accuracy |

**Top Refunded Product Categories:**

| Category | Refund Rate | Action |
|---|---|---|
| Window Visors | 20.0% | Fix listings (door count/model year ambiguity) |
| Grille Guards | 5.5% | Fitment verification |
| Trailer Hitches | 5.1% | One SKU at 82% refund rate — delist |
| Front Grilles | 4.8% | Trim-specific qualifiers needed |
| Headlights | 4.0% | Supplier moisture defect → QC escalation |
| Tonneau Covers | 3.6% | Already good |
| Toolbox/Bed Mats | 1.3% | Best category — dimensional fit is clear |

**Key CS Insight for Marketing:** Every "not fit" return (1,475 tickets) ended in a refund — zero agents offered replacement products. Converting 30% to replacement sales = $70K+/year recovered revenue. The chatbot and email flows should be designed to intercept fitment questions BEFORE purchase and cross-sell the correct part.

---

## MARKETPLACE DATA (ChannelAdvisor — 6,792 recent orders)

**Top Vehicle Makes by Historical Revenue (10+ years):**

| Make | Revenue | Orders |
|---|---|---|
| Ford | $12.9M | ~85,000 |
| Chevrolet | $12.4M | ~82,000 |
| Dodge/Ram | $12.2M | ~80,000 |
| Toyota | $5.8M | ~38,000 |
| GMC | $4.2M | ~28,000 |
| Nissan | $2.1M | ~14,000 |

**Seasonal Pattern:** Volume peaks in summer (Jun-Aug) and correlates with tax refund season (Apr-May). Winter months are the slowest.

**The `-901` SKU suffix** correlates with disproportionately high refund rates vs `-601` equivalents — needs audit before running paid ads on those SKUs.

---

## WHAT I NEED FROM YOU

Using extended thinking, analyze all data above and produce:

### 1. TAX RETURN SEASON SPRINT (Next 3 Weeks — URGENT)
- Day-by-day action plan for the next 21 days
- What MUST be live before the tax refund spending wave (mid-April)?
- Klaviyo setup sequence: which flows and campaigns to build first
- Quick-launch paid campaign strategy (Google Shopping + Meta) — what to run immediately with minimal setup
- Tax season promo strategy: what offer, what messaging, what products to feature
- Email sequence for Champions list (36,681 contacts) — warm-up schedule to avoid spam filters

### 2. OPTIMIZED 12-MONTH MARKETING PLAN
- Review and challenge every assumption in the existing budget plan
- Is the channel mix right? Should allocation shift?
- Is the revenue ramp realistic given the tax season timing?
- What's missing from the plan?
- Should we front-load spend into tax season (Apr-May) rather than ramping linearly?
- When should each channel launch, and in what sequence?
- What ROAS targets should trigger budget increases vs cuts?

### 3. KLAVIYO STRATEGY (Starting from Zero)
- Full Klaviyo implementation roadmap (we have 321,850 contacts ready to import)
- Domain warm-up strategy (sending to 300K+ contacts requires careful warming)
- Which email flows to build and in what order (abandoned cart, welcome, post-purchase, winback, etc.)
- Segmentation strategy leveraging RFM data
- SMS strategy (yes/no? when?)
- Predicted email revenue contribution by month
- How to handle the Shopify ↔ Klaviyo integration for a headless (Lovable) storefront

### 4. PAID ADVERTISING PLAN
- Google Shopping: feed optimization, custom labels, bid strategy, ROAS targets by month
- Google Search: keyword strategy for truck accessories (part numbers, fitment terms, competitor conquest)
- Meta: creative strategy, audience strategy (Champions Lookalike is the key asset), funnel structure
- YouTube: when to introduce, what creative format works for truck accessories
- Budget allocation across channels by month — should it shift from the existing plan?
- Use the `products_advertise_priority.csv` logic: prioritize high-margin, low-return-rate products

### 5. SEASONAL REVENUE MODEL
- Rebuild the monthly revenue targets accounting for tax refund season (Apr-May peak), summer peak (Jun-Aug), and winter slowdown
- The current plan ramps linearly — it should account for seasonal demand curves
- When are the key spending moments for truck owners? (Tax refunds, summer projects, holiday gifting, year-end fleet purchasing)
- How should ad spend shift by season?

### 6. REFUND RATE REDUCTION INTEGRATION
- How should the marketing plan integrate the 5.1% → 3% refund reduction work?
- Which products should be excluded from paid ads?
- How should Klaviyo flows handle fitment verification?
- Post-purchase email strategy to reduce buyer's remorse returns

### 7. B2B CHANNEL
- Is $280K from B2B realistic in Year 1?
- What's the fastest path to B2B revenue?
- How does the B2B timeline interact with the tax season sprint?
- Klaviyo B2B segment strategy

### 8. RISK ANALYSIS
- What are the top 5 risks to hitting $2M?
- What are the leading indicators that tell us by Month 2-3 if we're on track?
- What's the Plan B if paid ROAS underperforms?
- Cash flow risk: when does the spend-before-revenue gap get dangerous?

Be specific. Give me numbers, dates, and names of things to build. I can execute with Claude Code — code, scripts, API integrations, data pipelines are all doable. Don't hold back on ambition but ground every recommendation in the data above.
