# Stehlen Auto — Master Task List
## Correlated with Master Marketing Plan

**Last Updated:** March 21, 2026
**Reference:** `marketing/plan/00_master_marketing_plan.md`

---

## Status Legend
- [ ] Not started
- [~] In progress
- [x] Complete

---

## PHASE 0: Foundation (Days 1-7) — CURRENT PHASE

### GA4 Tracking (Plan Section: Current State)
- [x] Install GA4 on stehlenauto.com
- [x] Install Shopify Google & YouTube channel app
- [x] Connect GA4 property (G-YS6SFM9QFD) to Shopify
- [x] Rename product_viewed to view_item with GA4 e-commerce params (Lovable)
- [x] Add begin_checkout event before Shopify redirect (Lovable)
- [x] Add add_to_cart to ProductCard quick-add and ChatWidget (Lovable)
- [x] Remove duplicate find_parts event (Lovable)
- [x] Update vehicle_selected params to vehicle_year/make/model (Lovable)
- [x] Deploy Lovable changes to production
- [x] Verify all events firing in GA4 Realtime
- [x] Configure cross-domain tracking (stehlenauto.com + myshopify.com)
- [x] Set data retention to 14 months
- [x] Add unwanted referrals (shop.app, paypal.com, stripe.com, checkout.shopify.com)
- [x] Mark Key Events: add_to_cart, vehicle_selected
- [x] Create 17 custom dimensions (vehicle, search, chat, cart, filter params)
- [x] Create audiences: Vehicle Identified Shoppers, Cart Abandoners
- [x] Create remaining audiences (Chatbot Engaged, Fitment Dead Ends, High-Intent Browsers, Search-Driven Visitors)
- [x] Deploy Batch 1 behavior tracking (search, collections, fitment, chat, cart — 25+ events)
- [x] Verify Batch 1 events firing in GA4 Realtime
- [ ] Place test order to verify purchase event fires
- [ ] Install Microsoft Clarity for session recordings
- [ ] Mark begin_checkout and view_item as Key Events (once they appear in Events list)

### Batch 2 GA4 Tracking (Within 2 Weeks)
- [x] Deploy filter/sort tracking (Lovable Prompt 2A)
- [x] Deploy PDP engagement tracking — image views, tab clicks (Lovable Prompt 2B)
- [x] Deploy cross-sell tracking (Lovable Prompt 2C)
- [x] Deploy navigation tracking (Lovable Prompt 2D)
- [x] Deploy YMM abandonment tracking (Lovable Prompt 2E)
- [x] Deploy coupon tracking (Lovable Prompt 2F)
- [ ] Build primary funnel exploration in GA4 Explore

### Batch 3 GA4 Tracking (Within 30 Days)
- [x] Deploy trust badge + footer tracking (Lovable Prompt 3A)
- [x] Deploy promotion/banner tracking (Lovable Prompt 3B)
- [ ] Build secondary funnels (search, chat, cross-sell)

### Security (URGENT)
- [x] info.txt added to .gitignore — will not be committed. Still review and rotate exposed credentials.
- [x] Ensure oauth-credentials.json and token.json are in .gitignore

### Site Bugs (HIGH PRIORITY)
- [x] FIX: Chatbot vehicle filtering — year filtering now working, shows correct products
- [x] FIX: Collection page vehicle filtering — switched from title-parsing to tag-based Shopify API queries. 2013 F-150 now shows 32 products (was 2).
- [x] FIX: "Best Sellers" hero button links to /collections/bull-bars — RESOLVED
- [x] FIX: /collections/all page shows 0 products — RESOLVED (48+ products now showing)
- [x] FIX: Chatbot broken product links — RESOLVED (handle fallback working)
- [x] FIX: Chatbot category list markdown rendering — line break regex added
- [x] FIX: Chatbot product prices synced with Shopify MSRP
- [x] FIX: Chatbot add-to-cart button — variant ID format corrected to GID format

### Site Foundation
- [ ] Run full mobile end-to-end purchase test (iPhone + Android)
- [ ] Measure mobile LCP with PageSpeed Insights on 3 product pages
- [ ] Verify trust bar displays correctly (Free Shipping, 30-Day Returns, Warranty)
- [x] Update Shopify prices from EffectiveCost to MSRP — VERIFIED 15/15 spot check match

---

## PHASE 1: Data & Email (Weeks 2-4)
**Marketing Plan Reference:** Channel 1 (Email), Competitive Moat (ChannelAdvisor)

### ChannelAdvisor / Rithum Data Extraction
- [x] Extract Rithum Account 1 orders + products (6,902 orders, 17,466 products)
- [x] Extract Rithum Account 2 orders + products (61,281 orders, 36,879 products)
- [x] Combined: 68,183 orders + 54,345 products saved to data/raw/
- [ ] Build SKU bridge: map Rithum SKUs to Shopify product IDs
- [ ] Customer identity resolution (email + name/zip matching across accounts)

### GA4 Baseline Analysis
- [x] Set up GA4 API access (OAuth credentials)
- [x] Run ga4_traffic_analysis.py — baseline traffic report
- [ ] Run ga4_product_performance.py — product-level funnel
- [ ] Run ga4_weekly_kpi_snapshot.py — establish weekly cadence
- [ ] Analyze device split, geographic data, conversion funnel gaps

### ML Pipeline — Phase 1 (RFM + Audiences)
- [x] Build RFM segmentation (855,887 customers scored from CB data)
- [x] Export Klaviyo Champions CSV (36,738 emails) — data/exports/klaviyo_champions.csv
- [x] Export all contactable segments CSV (321,850 emails) — data/exports/klaviyo_all_segments.csv
- [x] Build product advertise priority list (top 50) — data/exports/products_advertise_priority.csv
- [x] Build product exclusion list (327 products) — data/exports/products_exclude_list.csv
- [ ] Build value-based Lookalike audience export for Meta
- [ ] Upload seed audience to Meta Custom Audiences
- [ ] Upload seed audience to Google Customer Match

### Klaviyo Setup
- [ ] Create Klaviyo account and connect to Shopify
- [ ] Import eBay buyer email list (segmented by RFM)
- [ ] Build abandoned cart flow (fitment-aware version)
- [ ] Build welcome series (3 emails)
- [ ] Build post-purchase flow (review request + maintenance reminder)
- [ ] Legal review: confirm eBay buyer email usage compliance (CAN-SPAM)

### eBay Reactivation Campaign
- [ ] Segment ChannelAdvisor data: Champions, Loyal, At-Risk, Hibernating
- [ ] Draft 3-email reactivation sequence
- [ ] Send pilot to 200-300 "Champions" segment
- [ ] Measure pilot CVR — gate: must exceed 3% before full send
- [ ] If pilot clears: deploy to full list (segmented by vehicle)

### Product Reviews
- [ ] Evaluate Judge.me headless API integration
- [ ] Build review display component in Lovable (star rating + review list)
- [ ] Seed 25+ reviews from past eBay/Amazon buyers
- [ ] Target: 50 reviews by end of Month 2

---

## PHASE 2: Paid Acquisition (Weeks 5-8)
**Marketing Plan Reference:** Channels 2-4 (Shopping, Search, Meta)

### Prerequisites (must be complete before any ad spend)
- [ ] GA4 purchase event verified with real/test order
- [ ] At least 25 product reviews visible on site
- [ ] Fitment badge on PDPs (green/yellow/red based on vehicle selection)
- [ ] Mobile LCP under 3.0 seconds
- [ ] Full mobile purchase test passed

### Google Merchant Center
- [ ] Submit product feed via Shopify Google channel
- [ ] Audit feed for disapprovals (GTINs, images, pricing)
- [ ] Use identifier_exists:false for aftermarket parts without GTINs
- [ ] Set up 4-hour feed auto-refresh
- [ ] Wait for feed approval (3-7 business days)

### Google Shopping Campaigns
- [ ] Create Google Ads account and link to GA4
- [ ] Import purchase key event as conversion action
- [ ] Launch Standard Shopping campaign "Stehlen-Shopping-Core" ($50/day)
  - Ad Group 1: Top 50 SKUs by margin (70% budget)
  - Ad Group 2: Catalog coverage (30% budget)
- [ ] Set Manual CPC bidding (target $0.45-$0.85 CPC)
- [ ] Monitor daily for first 2 weeks
- [ ] Week 3: Optimize bids based on ROAS by product group

### Google Search Campaigns
- [ ] Launch "Stehlen-Search-Brand" campaign ($5/day) — brand defense
- [ ] Launch "Stehlen-Search-PartNumber" campaign ($20/day) — part number + fitment
- [ ] Build keyword list: top 100 SKUs by velocity
- [ ] Write ad copy with fitment guarantee + free shipping

### Meta Advertising
- [ ] Set up Meta Pixel on Lovable (if not using Shopify's native integration for storefront events)
- [ ] Connect Shopify product catalog to Meta Commerce Manager
- [ ] Launch retargeting campaign: site visitors + cart abandoners ($500/mo)
- [ ] Create vehicle-specific Lookalike audiences from ChannelAdvisor data
- [ ] Month 3: Launch cold prospecting with 1% LAL ($300/mo)

### Fitment UX Improvements
- [ ] Build fitment confirmation badge on PDPs (green/yellow/red)
- [ ] Implement YMM session persistence (save to localStorage)
- [ ] Add "Shop by Vehicle" tiles on homepage (top 6 truck models)
- [ ] Build cross-sell "You May Also Need" component on PDPs

---

## PHASE 3: Optimization & Scale (Weeks 9-12)
**Marketing Plan Reference:** All channels, ML Pipeline

### ML Pipeline — Phase 2 (Forecasting + Recommendations)
- [ ] Build vehicle cohort frequency table (top 25 YMM by revenue)
- [ ] Build co-purchase recommendation matrix from ChannelAdvisor orders
- [ ] Train Prophet demand forecasting models on top 100 SKUs
- [ ] Export peak-week calendar for ad spend timing
- [ ] Build price sensitivity analysis on top 50 SKUs
- [ ] Implement vehicle-based product recommendations on site

### Campaign Optimization
- [ ] Google Shopping: transition top SKUs to Performance Max (after 50+ conversions)
- [ ] Google Search: add competitor conquest campaigns (RockAuto, AutoAnything)
- [ ] Meta: shift to vehicle-cohort-specific ad sets
- [ ] Email: launch winback flow for 60-day non-buyers

### Content & SEO
- [ ] Publish 10 buying guide blog posts
- [ ] Publish 10 YouTube install videos
- [ ] Optimize product page titles with YMM data (Python bulk update)
- [ ] Create vehicle-specific category pages for top 20 YMM combos
- [ ] Submit XML sitemap to Google Search Console

### Zendesk Integration — Refund Rate Analysis (TARGET: 8% → under 3%)
- [ ] Connect to Zendesk API — extract all support tickets from eBay/Amazon/Walmart channels
- [ ] Categorize tickets by issue type: fitment wrong, defective, damaged in shipping, buyer remorse, missing parts, wrong item shipped, other
- [ ] Cross-reference Zendesk tickets with CB RMA data (111,776 RMAs already extracted)
- [ ] Build refund reason breakdown by: channel (eBay vs Amazon vs Walmart), product category, specific SKU, vehicle make/model
- [ ] Identify top 20 SKUs by refund rate — these need immediate attention (better descriptions, images, fitment data, or delisting)
- [ ] Identify top 5 refund reasons — build action plan for each
- [ ] Analyze customer sentiment from Zendesk ticket text (common complaints, recurring themes)
- [ ] Build Python script to pull Zendesk data and merge with CB order/RMA data
- [ ] Create refund rate dashboard: weekly tracking by SKU, category, channel
- [ ] Set up automated alerts: flag any SKU that exceeds 5% refund rate in a rolling 30-day window
- [ ] Deliver findings to CMO for marketing exclusion list (don't advertise high-refund SKUs)
- [ ] Deliver findings to operations for supplier/packaging/listing improvements

### B2B / Installer Channel
- [ ] Analyze ChannelAdvisor data for geographic clustering (high-density ZIP codes)
- [ ] Identify top 50 ZIP codes with likely installer presence
- [ ] Draft B2B outreach sequence (net-30 terms, bulk pricing)
- [ ] Target: first 5 commercial accounts signed

### Site Optimization
- [ ] Implement returning visitor personalization (vehicle-based hero)
- [ ] Add email capture modal (post-45 seconds or post-YMM selection)
- [ ] Achieve mobile LCP under 2.0 seconds
- [ ] Build post-checkout thank-you page on Lovable (cross-sell + survey)
- [ ] Implement product review filtering by vehicle (Judge.me)

---

## PHASE 4: Scale to $1M Run Rate (Months 4-12)
**Marketing Plan Reference:** Revenue Model Months 4-12

### Revenue Milestones
- [ ] Month 4: $25K-$35K/month
- [ ] Month 6: $45K-$60K/month
- [ ] Month 9: $60K-$75K/month
- [ ] Month 12: $75K-$100K/month (approaching $1M run rate)

### Scale Actions
- [x] Catalog expansion — NOT NEEDED, all items already from shopify.vInventoryItem
- [ ] Launch Walmart Marketplace (catalog sync from Shopify)
- [ ] Activate loyalty program (points-per-dollar)
- [ ] Build admin analytics dashboard (GA4 + Shopify + Supabase consolidated)
- [ ] Hire/contract customer service for Gorgias (fitment support)
- [ ] Build automated inventory reorder alerts from demand forecasting
- [ ] Monthly A/B testing program: 1 PDP test + 1 checkout test

---

## Recurring Tasks (Weekly/Monthly)

### Weekly
- [ ] Run ga4_weekly_kpi_snapshot.py every Monday
- [ ] Review Google Shopping ROAS by product group
- [ ] Review abandoned cart recovery rate in Klaviyo
- [ ] Check Google Merchant Center for new disapprovals
- [ ] Review Microsoft Clarity session recordings (5-10 sessions)

### Monthly
- [ ] Reconcile ad spend vs. Shopify revenue (Shopify is ground truth)
- [ ] Refresh ChannelAdvisor data extract (new orders)
- [ ] Re-run RFM segmentation with updated data
- [ ] Update Meta/Google audiences with new customer data
- [ ] Review fitment-related return rate (target: <3%)
- [ ] Run demand forecast refresh for next 90 days
- [ ] Review and adjust monthly ad budget by channel performance

---

## Document Cross-Reference

| Task Phase | Marketing Plan Section | Related Document |
|---|---|---|
| Phase 0: Foundation | Current State | `guides/ga4_ecommerce_tracking_setup.md` |
| Phase 1: Data & Email | Channel 1 (Email), Competitive Moat | `marketing/ml-pipeline/ml_strategy.md` |
| Phase 1: GA4 Analysis | Current State | `marketing/analytics/` (Python scripts) |
| Phase 2: Paid Acquisition | Channels 2-4 | `marketing/tools-evaluation/tool_scorecard.md` |
| Phase 2: Fitment UX | Risk Register (Fitment) | `marketing/plan/90_day_sprint.md` |
| Phase 3: ML Models | Competitive Moat | `marketing/ml-pipeline/ml_strategy.md` |
| Phase 3: Content | Channel 5-6 (YouTube, SEO) | `marketing/plan/00_master_marketing_plan.md` |
| Phase 4: Scale | Revenue Model | `marketing/plan/budget_breakdown.md` |
