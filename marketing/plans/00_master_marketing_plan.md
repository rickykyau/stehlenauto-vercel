# Stehlen Auto — Master Marketing Plan
## $2,000,000 Year 1 Revenue Target

**Company:** Stehlen Auto (stehlenauto.com)
**Niche:** Heavy-duty truck accessories (grilles, bumpers, lights, hitches, body kits)
**Stack:** Lovable (React frontend) + Shopify (backend/checkout) + Supabase
**Catalog:** 1,330 products live / 30,293 CB SKUs available for expansion
**Background:** 10+ years selling on eBay/Amazon via ChannelAdvisor — $15-20M/year marketplace revenue
**Revised Target:** $2,000,000 Year 1 direct-to-consumer revenue
**Date:** March 21, 2026

---

## Executive Summary

Stehlen Auto is not a startup. It is a $15-20M/year marketplace business that does not yet have a direct channel. The $2M target is approximately 10-12% of existing marketplace revenue — a reallocation problem, not a growth problem. The mechanics are known: 873,002 total customers, 327,574 with real emails, AOV of $214.85, and a Champions segment of 163,983 customers with $425 LTV. The math to $2M is 9,308 orders at $214.85 AOV, which is 776 orders per month or 26 per day. That is not an aggressive number. The aggressive part is getting those orders on stehlenauto.com instead of eBay and Amazon.

The strategy has three simultaneous engines running from Day 1, not sequentially:

1. **Email reactivation** — convert existing ChannelAdvisor buyers to direct customers at near-zero CAC
2. **Paid acquisition** — Google Shopping + Meta at meaningful scale from Month 2, not test budgets
3. **B2B channel** — $516K already proven in wholesale orders; scale it deliberately

The single most important upgrade from the $1M plan is this: paid channels launch bigger and faster, and B2B is treated as a primary revenue pillar from Month 3, not an afterthought.

---

## Current State (March 2026)

### What's Working
- Live site at stehlenauto.com with branded Shopify checkout
- 1,330 products loaded with 12 category collections + 20+ make collections
- GA4 fully instrumented (view_item, add_to_cart, begin_checkout, add_payment_info, purchase)
- Cross-domain tracking configured (stehlenauto.com + stehlenauto.myshopify.com)
- YMM fitment selector with vehicle_selected tracking live
- ChannelAdvisor API credentials for 2 accounts ready for data extraction
- 873,002 total customer records; 327,574 with usable emails
- Champions segment: 163,983 customers, $425 LTV, 37,293 real emails

### What's Not Working Yet
- Zero organic traffic (27 sessions in 90 days, all internal)
- No purchase events on direct site yet
- Klaviyo not configured
- No product reviews on site
- No paid advertising active
- ChannelAdvisor data extracted but email flows not built
- 30,293 CB SKUs not yet on Shopify

### Site Readiness: 6/10
- Tracking: 8/10
- Catalog: 7/10 (needs fitment audit and expansion)
- Trust signals: 5/10 (no reviews, no fitment guarantee badge)
- Checkout: 7/10 (branded, functional, minor myshopify.com domain friction)
- Mobile UX: Unknown
- Fitment UX: 5/10 (selector exists, no session persistence)

---

## Revenue Model — $2M Revised

### The Math

- **Target:** $2,000,000
- **AOV:** $214.85
- **Orders needed:** 9,308 total / 776 per month / 26 per day
- **Margin per order:** $75.52 (35.2% after COGS + shipping)
- **Gross profit at target:** $703,000

### Revenue Targets by Month

| Month | Monthly Target | Cumulative | Key Revenue Drivers |
|---|---|---|---|
| Month 1 | $30,000 | $30,000 | Champions reactivation email (37K list), organic, first B2B outreach |
| Month 2 | $60,000 | $90,000 | Google Shopping live ($4K budget), full Champions email sequence |
| Month 3 | $100,000 | $190,000 | Meta prospecting, B2B closes first accounts, 30,293 SKU expansion begins |
| Month 4 | $140,000 | $330,000 | PMax transition, B2B at $30K/mo, SEO contributing early long-tail |
| Month 5 | $170,000 | $500,000 | Email at 25%+ of revenue, catalog at 3,000+ SKUs, loyalty soft launch |
| Month 6 | $200,000 | $700,000 | Marketplace-to-direct push, all channels optimized |
| Month 7 | $185,000 | $885,000 | Summer peak; seasonal SKU push (Ford F-Series, Ram 1500) |
| Month 8 | $185,000 | $1,070,000 | $1M milestone; B2B fleet accounts active |
| Month 9 | $195,000 | $1,265,000 | Catalog at 5,000+ SKUs |
| Month 10 | $210,000 | $1,475,000 | Paid channels at full scale, email 30%+ of revenue |
| Month 11 | $245,000 | $1,720,000 | Holiday + year-end fleet purchasing cycle |
| Month 12 | $280,000 | $2,000,000 | Year-end close; B2B year-end orders push |

### Quarterly Targets

| Quarter | Target | Cumulative | Primary Levers |
|---|---|---|---|
| Q1 (M1-3) | $190,000 | $190,000 | Email reactivation is the engine; paid supplements |
| Q2 (M4-6) | $510,000 | $700,000 | Paid + B2B both at scale; catalog expansion driving new SKU revenue |
| Q3 (M7-9) | $565,000 | $1,265,000 | Summer peak, catalog depth, fleet channel opens |
| Q4 (M10-12) | $735,000 | $2,000,000 | Highest-spend season, loyalty driving repeat, B2B year-end cycle |

**The single most important quarter is Q4.** Year-end fleet purchasing, holiday gifting on truck accessories, and the compounding of email + paid + B2B all hitting simultaneously. Q4 must deliver $735K — 37% of the annual target. Do not understaff or underfund Q4.

---

## Channel Strategy — $2M Configuration

### Channel 1: Email Marketing (Klaviyo) — LAUNCH NOW, NOT MONTH 2

The $1M plan treated email as a warm-up. At $2M, email is the primary revenue driver in Q1 and carries 25-30% of total revenue by Month 6. The Champions list alone (37,293 emails, $425 LTV) is worth $4-6M in recoverable LTV. Even a 5% direct conversion rate on that list is $793,000 in Year 1 revenue.

**Month 1 — Reactivation Sequence (Priority 1):**
- Segment 1: Champions (37,293 emails) — "Your truck upgrades are here. Back on stehlenauto.com."
- Segment 2: Loyal Customers next tier — 15% of revenue target in Month 1
- Segment 3: Lapsed high-value buyers — winback offer with 10% first-order discount
- Do NOT blast the full 327,574 list on Day 1. Warm the domain. Start with Champions, expand weekly.

**Month 1 — Automation Flows:**
- Abandoned cart (fitment-aware: "The [part] you were looking at fits your [Year Make Model]")
- Post-purchase vehicle maintenance sequence (intervals known by vehicle from CB data)
- Welcome series for new site subscribers

**Month 2+:**
- Replenishment campaigns for consumables (filters, lights, wipers — known intervals from 10-year CB data)
- Vehicle cohort campaigns: "Ford F-150 owners — top 5 upgrades this season"
- B2B-specific Klaviyo segment: net-30 offers, bulk pricing, dedicated onboarding

**Revenue attribution target:** 25-30% of total revenue from Month 5 onward
**Klaviyo cost upgrade needed:** Move from $45/mo to $150/mo by Month 3 (327K contacts requires higher tier)

---

### Channel 2: Google Shopping — LAUNCH BIGGER, LAUNCH MONTH 1

The $1M plan started Google Shopping at $1,500/mo in Month 2. At $2M, we start at $4,000/mo in Month 2 and scale to $12,000/mo by Month 6. The reason: at $214.85 AOV and 35% margin, Google Shopping ROAS only needs to hit 2.5x to be profitable. Truck accessory shopping campaigns routinely achieve 4-6x ROAS by Month 4 once the algorithm has conversion data. Front-loading spend buys that conversion data faster.

**Month 2:** Standard Shopping launch at $4,000/mo
- Ad group 1: Top 100 SKUs by gross margin (70% of budget)
- Ad group 2: Ford/Chevy/Dodge/Ram fitment coverage (20% budget)
- Ad group 3: Catalog coverage remainder (10% budget)
- Feed optimization: custom labels by margin tier, vehicle make, product category
- Exclude irrelevant queries from Day 1

**Month 3:** $7,000/mo; optimize based on search term report; kill underperformers
**Month 4:** PMax transition for top 50 SKUs (after 50+ conversions each); keep Standard Shopping for long-tail
**Month 5+:** $10,000/mo; introduce seasonal bid adjustments from CB demand forecast data

**ROAS targets:** 2.0x Month 2 → 3.0x Month 3 → 4.5x Month 5+
**Vehicle-specific custom labels** are the single biggest ROAS lever: Ford F-Series SKUs should be labeled separately from Ram SKUs. Bid modifiers by vehicle profitability.

---

### Channel 3: Meta (Facebook/Instagram) — COLD PROSPECTING FROM MONTH 2

The $1M plan held Meta to retargeting only until Month 3. At $2M, cold prospecting starts in Month 2 using the ChannelAdvisor Champions segment as the Lookalike seed audience. This is the competitive moat: 37,293 verified truck accessory buyers with $425 LTV as a seed list produces a Lookalike audience that no competitor can replicate.

**Month 2:** $3,000/mo
- Retargeting ($1,000): site visitors + cart abandoners segmented by vehicle
- Lookalike prospecting ($2,000): 1% Lookalike from Champions list seeded into Meta
- Creative: installed-on-vehicle photos, not white-background product shots
- Vehicle-specific ad sets: Ford owners, Chevy owners, Dodge/Ram owners (separate creatives)

**Month 3:** $5,000/mo — add dynamic product ads (DPA) using Shopify catalog feed
**Month 4:** $7,000/mo — introduce vehicle cohort video ads (30-sec install clips from YouTube)
**Month 5+:** $9,000/mo — full funnel: prospecting (60%) + retargeting (25%) + DPA (15%)

**The one Meta tactic that moves the needle:** Separate ad sets by vehicle make. Ford truck owners do not respond to the same creative as Jeep owners or Ram owners. The CB data shows Ford ($12.9M), Chevy ($12.4M), Dodge ($12.2M) are the top three. Build make-specific creative from Month 2.

---

### Channel 4: Google Search — PART NUMBERS AND FITMENT TERMS

**Month 2:** Brand defense ($300/mo) + Part number campaigns ($1,200/mo)
**Month 3:** Fitment search ("2019 Ford F-150 grille", "Ram 1500 bumper replacement") — $2,000/mo
**Month 4:** Competitor conquest (RockAuto, AutoAnything) — $1,000/mo
**ROAS target:** 3.5x-5.0x (part number searches are the highest-intent traffic in e-commerce)

---

### Channel 5: B2B/Installer Channel — MUST-HAVE AT $2M

The data shows $516K in existing wholesale orders. That is not a side channel — that is a proven revenue stream that has never been actively marketed. At $2M, B2B needs to contribute $300,000-$400,000 (15-20% of total revenue).

**The mechanics of scaling B2B from $516K to $300-400K new direct revenue:**

Month 1-2 — Identify and activate:
- Export all buyers with 5+ orders and AOV >$400 from CB data — these are professional installers
- Map order density by ZIP code — dense ZIP codes with repeat orders = installer shops
- Build a target list of 500-1,000 shop owners in CA, TX, FL (top 3 states by revenue)
- Outreach: direct email + LinkedIn to shop owners with "Stehlen Pro" program pitch

Month 3 — Stehlen Pro launch:
- Net-30 payment terms (requires credit app — use a simple PDF form to start)
- Tiered pricing: 5% discount at $1,000/mo, 10% at $2,500/mo, 15% at $5,000/mo
- Dedicated Klaviyo segment: B2B-specific email cadence (new arrivals, bulk availability)
- A separate /pro page on the site (Lovable build — straightforward React page)

Month 4+ — Fleet accounts:
- Fleet service managers at trucking companies and municipalities (TX and CA both heavy fleet states)
- AOV for fleet accounts: $800-$2,000 per order
- CAC for fleet: $200-$400 one-time; LTV: $5,000-$25,000 per account
- Target: 10 active fleet accounts by Month 8 = $80,000-$200,000 incremental revenue

**B2B revenue target by month:** $0 (M1) → $15K (M2) → $30K (M3) → $45K (M4) → $60K (M5+)
**The B2B channel is the highest-LTV, lowest-CAC customer in the entire business. It is not optional at $2M.**

---

### Channel 6: Catalog Expansion (30,293 CB SKUs)

The 30,293 SKUs in ConnectedBusiness that are not yet on Shopify represent the largest single revenue lever in the plan. More SKUs means more Google Shopping impressions, more long-tail SEO traffic, and more reasons for existing customers to return.

**The expansion strategy is not "upload everything." It is surgical:**

Priority 1 (Month 2-3): Top SKUs by CB order volume in proven categories
- Identify top 500 SKUs by gross revenue in CB that are NOT currently on Shopify
- These have proven demand — they have sold before
- Target: 500 new SKUs live by end of Month 3

Priority 2 (Month 4-5): Vehicle-make expansion packs
- Ford F-Series pack: all CB SKUs tagged to Ford F-150/250/350 not yet on Shopify
- Ram 1500/2500 pack: same approach
- These feed directly into make-specific paid campaigns
- Target: 2,000 total SKUs by end of Month 5

Priority 3 (Month 6-9): Full catalog push to 5,000+ SKUs
- Build Python script to automate CB-to-Shopify product sync with fitment tags
- Each new SKU creates a new indexed catalog page = compounding SEO value
- RockAuto's dominance is built on 800K+ catalog pages. The same principle applies here at smaller scale.
- Target: 5,000 SKUs live by Month 9

**Revenue impact:** Each new SKU category added typically contributes $500-$2,000/month in Google Shopping revenue within 60 days of going live. Adding 500 high-velocity SKUs in Month 3 = $250K-$1M in incremental annualized Shopping revenue.

---

### Channel 7: Marketplace-to-Direct Conversion

$2M direct requires actively pulling customers from eBay and Amazon, not waiting for them to find the site. The existing $15-20M in marketplace revenue is the audience. The strategy:

**Insert-in-box campaign (Month 1):**
- Every eBay/Amazon shipment includes a physical card: "Save 10% on your next order at stehlenauto.com — use code DIRECT10"
- Cost: $0.08 per card + printing = ~$800/mo for 10,000 shipments
- Conversion rate benchmark: 2-4% of insert recipients convert to direct. At 10,000 shipments/mo: 200-400 new direct customers per month at near-zero CAC
- This alone could generate $43,000-$86,000/month in direct revenue at $214.85 AOV

**Post-purchase eBay email sequence:**
- eBay allows buyers to be messaged post-purchase within the platform
- Message: "Thank you for your order. For your next purchase, visit stehlenauto.com for exclusive pricing and faster checkout"
- Do not offer the discount inside eBay's messaging system — that violates policy. Reference the website only.

**Retargeting eBay/Amazon visitors who come to the site organically:**
- A portion of marketplace buyers will search "Stehlen Auto" directly after a marketplace purchase
- Meta and Google retargeting pixels capture these visitors for $0 CAC remarketing

---

### Channel 8: SEO and YouTube (Long-Term)

Same strategy as $1M plan but executed faster and at larger content volume.

- Month 1: Fix all 1,330 product page titles with YMM data (Python script — one-time)
- Month 2: Launch YouTube ("How to install [part] on [Year Make Model]") — 2 videos/week, not 1
- Month 3: 20 buying guide blog posts targeting top CB search terms
- Month 4+: Vehicle-specific category pages for top 50 YMM combinations
- Organic target: 10% of revenue by Month 8 (starts slow, compounds fast)

---

## Budget — $2M Configuration

### Ad Spend Budget by Month

| Channel | M1 | M2 | M3 | M4 | M5 | M6 | M7-12 avg |
|---|---|---|---|---|---|---|---|
| Google Shopping | $0 | $4,000 | $7,000 | $9,000 | $10,000 | $12,000 | $14,000 |
| Google Search | $0 | $1,500 | $2,000 | $3,000 | $3,500 | $4,000 | $5,000 |
| Meta Ads | $0 | $3,000 | $5,000 | $7,000 | $9,000 | $10,000 | $10,000 |
| YouTube Ads | $0 | $0 | $500 | $1,000 | $1,500 | $2,000 | $2,000 |
| **Total Ad Spend** | **$0** | **$8,500** | **$14,500** | **$20,000** | **$24,000** | **$28,000** | **$31,000** |

### Total Budget Including Tools and Content

| Category | M1 | M2 | M3 | M4 | M5 | M6 | M7-12 avg |
|---|---|---|---|---|---|---|---|
| Platform tools | $89 | $239 | $339 | $339 | $339 | $339 | $339 |
| Ad spend | $0 | $8,500 | $14,500 | $20,000 | $24,000 | $28,000 | $31,000 |
| Content (blog + video) | $300 | $1,500 | $2,000 | $2,000 | $2,000 | $2,000 | $2,000 |
| B2B outreach tools | $0 | $200 | $200 | $200 | $200 | $200 | $200 |
| Insert cards (print) | $800 | $800 | $800 | $800 | $800 | $800 | $800 |
| **TOTAL** | **$1,189** | **$11,239** | **$17,839** | **$23,339** | **$27,339** | **$31,339** | **$34,339** |

**Year 1 Total Marketing Spend:** ~$285,000
**Year 1 Revenue Target:** $2,000,000
**Blended marketing ROI:** 7.0x
**Gross profit after marketing:** ~$418,000 ($703K gross profit minus $285K marketing spend)

### Where the Incremental $165K Goes vs. $1M Plan
- Google Shopping: +$80K (4,000 to 14,000/mo ramp)
- Meta Ads: +$60K (held at $2,500 vs. $10,000/mo scale)
- Content: +$12K (1 video/week to 2 videos/week)
- Insert cards: +$9,600 (new channel, zero in $1M plan)
- Klaviyo tier upgrade: +$1,260 (contact volume growth)
- B2B tools: +$2,400 (LinkedIn Sales Navigator or similar)

---

## Risks at $2M That Do Not Exist at $1M

### Risk 1: Return rate stays at 7.7% and eats the margin (CRITICAL)
At $1M revenue, a 7.7% return rate costs ~$77,000 in reverse logistics. At $2M, that is ~$154,000 — more than half the net profit target. The fitment data audit is not optional at $2M. Every SKU must have verified YMM fitment before it is included in paid campaigns. Target return rate: under 3.5% by Month 4. Fitment-related returns are the business-ending risk at this revenue level.

### Risk 2: Klaviyo domain reputation tanks from aggressive reactivation
Sending to 327,574 addresses, many of which haven't engaged in years, without a warm-up sequence will result in spam folder placement and potential domain blacklisting. The fix: segment strictly by recency, start with Champions only (37,293 emails), and use a dedicated sending subdomain (email.stehlenauto.com). Never blast the full list. Ever. Ramp 10% of new segment per week.

### Risk 3: Cash flow cannot support $285K in marketing spend
At $1M, ad spend is back-paid by revenue within 30-45 days. At $285K/year total spend, Month 4 requires $23K in marketing cash before revenue catches up. If Shopify payouts are on a 2-3 day cycle and B2B invoices on net-30, there can be a $40-60K cash gap in Month 3-4. Plan for this. Either maintain a $75K operating reserve or arrange a line of credit before Month 2 ad spend launches.

### Risk 4: Shopify Basic plan limits at $2M transaction volume
Shopify Basic ($39/mo) has no order volume caps, but the 2% transaction fee on non-Shopify Payments becomes significant. At $2M and 2% fees, that is $40,000 in fees alone. Upgrade to Shopify (mid-tier, $105/mo) to drop transaction fees to 1% — saves $20,000/year. This upgrade should happen by Month 4 when monthly revenue crosses $50,000.

### Risk 5: B2B net-30 terms create accounts receivable exposure
If B2B scales to $400K with net-30 terms, there is up to $100K in outstanding invoices at any given time. Vet B2B accounts with a credit application. Cap new accounts at net-15 until they have 3 months of payment history. Use a simple Stripe invoicing or QuickBooks setup — do not manage B2B AR on paper.

### Risk 6: Catalog expansion creates thin-content SEO penalty
Uploading 30,293 SKUs with minimal product descriptions creates thin-content pages that Google can penalize. The CB-to-Shopify sync script must generate unique, fitment-specific product descriptions — not copy-paste boilerplate. A Python script using CB data fields (part number, application notes, vehicle fitment, specs) can auto-generate 80% of the content with minimal human editing. Do not launch the catalog expansion without this.

---

## Key Metrics — $2M Configuration

### Weekly Tracking
- Sessions by source
- CVR by device (target: 2.5% blended by Month 4)
- AOV (target: maintain $214.85+)
- Cart abandonment rate (target: below 70%)
- ROAS by channel (Shopping target: 4.5x; Meta target: 3.0x)
- Fitment lookup usage rate (target: 60%+ of sessions)

### Monthly Tracking
- CAC by channel (organic target: $18-45; paid target: $55-120)
- LTV:CAC ratio (target: 3:1+ for paid channels)
- Email revenue as % of total (target: 25-30% by Month 6)
- Repeat purchase rate (target: 25%+ by Month 6 — CB data shows this is achievable)
- B2B revenue as % of total (target: 15-20% by Month 5)
- Fitment-related return rate (target: below 3.5%)
- Shopify orders from insert-card attribution (UTM code: source=insert)

### The One Metric That Matters Each Month
- **Month 1:** Champions segment revenue from reactivation ($20,000+ target)
- **Month 2:** Google Shopping ROAS (2.0x minimum to continue scaling)
- **Month 3:** B2B accounts signed (target: 15 active accounts)
- **Month 4:** Blended CVR across all paid channels (2.5%+ target)
- **Month 5:** Email revenue as % of total (25%+ target)
- **Month 6:** $700K cumulative milestone — if behind, diagnose which channel is underperforming

---

## Tool Stack — Upgrades for $2M

### Tools Added vs. $1M Plan

| Tool | Purpose | Monthly Cost | When |
|---|---|---|---|
| Klaviyo Growth | Email (327K contacts requires higher tier) | $150 | Month 3 |
| Shopify Standard | Lower transaction fees at $2M scale | $105 | Month 4 |
| LinkedIn Sales Navigator | B2B installer outreach (CA, TX, FL) | $80 | Month 2 |
| Insert card printing | Marketplace-to-direct conversion | $800 | Month 1 |

### Retained from $1M Plan

| Tool | Purpose | Monthly Cost |
|---|---|---|
| Shopify Basic → Standard | Commerce engine | $39 → $105 |
| Lovable Pro | React storefront | $25 |
| Supabase Pro | Database, ML features | $25 |
| GA4 | Analytics | $0 |
| Microsoft Clarity | Session recordings | $0 |
| Judge.me | Product reviews | $15 |
| Gorgias | Live chat, fitment support | $10 |
| Google Merchant Center | Shopping feed | $0 |

---

## Related Documents

- **90-Day Sprint:** `marketing/plan/90_day_sprint.md`
- **Budget Breakdown:** `marketing/plan/budget_breakdown.md`
- **Task List:** `marketing/tasks/master_task_list.md`
- **ML Strategy:** `marketing/ml-pipeline/ml_strategy.md`
- **GA4 Setup Guide:** `guides/ga4_ecommerce_tracking_setup.md`
- **Analytics Scripts:** `marketing/analytics/`
