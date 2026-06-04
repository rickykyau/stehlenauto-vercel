# Stehlen Auto DTC Launch: The $2M Data-Driven Go-To-Market Strategy
## Corrected & Merged | Version 2.0 | March 23, 2026

**Authors:** Marcus Steel (CMO), corrected against Stehlen Auto Comprehensive Sales & Operations Analysis (March 23, 2026)

**Document status:** DEFINITIVE. This document supersedes `claude_ai_gtm_strategy.md` in all respects. All margin figures, ROAS benchmarks, discount recommendations, seasonal indices, and product prioritizations have been corrected against actual CB ERP, ChannelAdvisor, and Zendesk data.

---

## STRATEGIC CONTEXT: Why DTC Is Not Optional

This is not a growth play. This is a survival play.

Marketplace revenue — the business's entire existing revenue base — is in structural decline:

| Year | Revenue | YoY Change |
|------|---------|------------|
| 2023 (peak) | $16.4M | +12% |
| 2024 | $13.4M | **-18%** |
| 2025 | $10.4M | **-22%** |
| 2026 (pace) | ~$8M | **-23%** |

Amazon is 70.8% of channel revenue. eBay is 28.7% and declining. Walmart Marketplace generated 15 orders in the last 16 months — it is effectively dead. Every percentage point of marketplace revenue that disappears is real money the business cannot get back without a new channel.

**stehlenauto.com is that new channel.** The Year 1 DTC target is $1.3M–$2.0M. Even at the low end, DTC offsets two-thirds of projected 2026 marketplace decline. At the high end, it more than replaces it. This document is the plan to get there.

**CHANNEL CLARITY — READ THIS FIRST:**
Throughout this document, every action is explicitly labeled:

- **[MARKETPLACE]** = Actions for eBay/Amazon/Walmart via Rithum (managed by existing sales team)
- **[DTC]** = Actions for stehlenauto.com / Shopify (being launched — this is where all new marketing work lives)

These are separate channels with separate teams, separate budgets, and separate KPIs. Do not blur them.

---

## SECTION 1: The 21-Day Tax Season Sprint — March 23 Through April 12

The next three weeks determine whether Stehlen Auto catches the tax refund wave or watches it pass. April 2025 on marketplaces was a $935K month — the single largest month in the ChannelAdvisor dataset. The DTC channel needs to be live and converting before that window peaks again.

**The real deadline is April 1, not April 15.** Klaviyo domain warm-up, Google Merchant Center approval, and Meta Pixel learning all require lead time before they produce revenue. Infrastructure must be live by April 1.

### PRE-SPRINT BLOCKER — P0 Actions (Must Complete Before Any Advertising Starts)

**Pricing verified:** All 1,330 Shopify products have been confirmed profitable using MSRP from `[shopify].[vInventoryItem]` vs. COGS (EffectiveCost + EstShipping_C). Average net margin: **35.1%**. Range: 34.0%–36.8%. No below-cost products exist. The catalog is priced by a uniform markup formula — tight band indicates opportunity to raise prices on high-demand SKUs where the market will bear it.

**Margin context for all ROAS calculations in this document:**

| Metric | Value |
|--------|-------|
| Average net margin (MSRP - COGS - Shipping) | 35.1% |
| Lowest margin product | 34.0% |
| Highest margin product | 36.8% |
| Avg estimated shipping cost per unit | $44.64 |
| ROAS breakeven at full price | 2.86x |

**Delist immediately [DTC + MARKETPLACE]:**
- `th-x507-c077-901` — 82% return rate. No revenue justifies this.
- `TBM-TIT16B-6.5-RB-V2` — 50% return rate. Delist.
- All `-901` suffix SKUs — audit the entire suffix group. Systematic high returns indicate a systemic listing or product problem.

---

### Week 1: Foundation — March 23–29

**[DTC] Day 1 — March 23: Klaviyo + Domain Setup**
- Purchase and configure Klaviyo. Connect native Shopify integration immediately — this syncs product catalog, customer profiles, and order data server-side.
- Configure dedicated sending domain: `mail.stehlenauto.com`. Set SPF, DKIM, and DMARC records in DNS. Start DMARC at `p=none` for monitoring; tighten to `p=quarantine` after 30 days of clean data.
- Add `Klaviyo.js` tracking snippet to the React/Lovable frontend on every page. Because this is a headless Shopify build, browser-side events (Viewed Product, Added to Cart, Active on Site) do NOT track automatically — they require manual JavaScript implementation. Add `_learnq.push` calls for Viewed Product on PDPs and Added to Cart on the cart action. User identification must fire on login and email capture.
- Begin importing the **Champions segment (36,739 contacts)** first. Include RFM segment, LTV, last purchase date, purchase count, primary vehicle (YMM if available), and source channel (Amazon/eBay) as custom properties. The source channel property is critical — DTC messaging to former Amazon buyers must acknowledge the channel shift and justify it.

**[DTC] Day 2 — March 24: Site Triage**
These conversion issues must be fixed before any paid traffic arrives. A 0.5% conversion rate makes the entire financial model impossible regardless of ROAS.

- Remove all Lorem Ipsum placeholder text from the mega-menu (currently shows fake categories like "Baby Car Seats")
- Fix the translation error ("Translation missing: en.ymm_app.searchbox_title") on collection pages
- Remove or hide sold-out products from homepage featured sections — at least 4 of the first visible products currently show "Sold Out"
- Fix the Year/Make/Model tool to include 2024–2026 model years (currently maxes at 2023)
- Remove misleading promo banners ("30% Off" and "BIG SALE – 10% discount") that link to nothing — false advertising risk in addition to conversion damage
- Fix the $0.00 pricing error on the front grill page
- Deploy an email capture popup using Klaviyo's built-in form builder

**POPUP OFFER — CORRECTED:** The original strategy recommended 15% off (code STEHLEN15). At 35.1% net margin, a 15% discount reduces margin to approximately 20% and raises breakeven ROAS to 5.0x — too aggressive for a new account in the learning phase. Use **10% off first order** instead. This keeps margin at approximately 25% and sets breakeven ROAS at 4.0x. Reserve 15% off exclusively for abandoned cart recovery email #3 (the highest-intent, lowest-CAC moment in the funnel).

**[DTC] Day 3 — March 25: Email Infrastructure + First Send**
- Build the Welcome Series flow (4–5 emails over 10 days):
  - Email 1: 10% discount delivery + brand story ("Why buy direct from Stehlen")
  - Email 2: Best-seller showcase organized by truck make (F-150, Silverado, Ram, Tundra)
  - Email 3: Installation confidence ("Our products install in 45 minutes — here's proof")
  - Email 4: Social proof + customer photos (source from marketplace reviews for launch)
  - Email 5: Urgency — discount expiration in 48 hours
- Send the **first warm-up campaign** to the most engaged 5,000 Champions. Subject: "Your truck deserves an upgrade this tax season." Content: brand introduction, top 5 best-sellers (tonneau covers and grilles — see Section 4 for the correct product prioritization), 10% off first DTC order. Monitor deliverability within 24 hours. Targets: 30%+ open rate, <2% bounce, <0.1% spam complaints.

**[DTC] Day 4 — March 26: Google Merchant Center + Shopping Feed**
- Set up Google Merchant Center. Connect Shopify's native Google channel for automatic feed sync.
- **Critical feed optimization for auto parts:** Rewrite product titles to the formula `[Year Range] [Make] [Model] + Stehlen + [Product Type] + [Key Attribute]`. Current titles use SKU-first naming ("Stehlen 642167822356 Front Grill") which is search-invisible. Correct example: "2014–2018 Chevy Silverado 1500 Stehlen Mesh Front Grille – Matte Black."
- Set up 5 custom labels:
  - Label 0: Margin Tier (High = Exterior/47%, Medium = Off-Road/45%, Low = Lighting/37%)
  - Label 1: Product Category
  - Label 2: Performance Tier (Best Seller / Standard / New)
  - Label 3: Price Bracket
  - Label 4: Return Rate Flag (Exclude = >8% return rate, Caution = 5–8%, Safe = <5%)
- **Exclude immediately from Shopping feed:**
  - All `-901` suffix SKUs
  - All Window Visor SKUs (20% silent return rate)
  - `HLPLNB-TUN07FLED-AB` (14.3% return rate)
  - `HLPLNB-RAM06FLED-AB` (15.2% return rate)
  - `TBM-TIT16B-6.5-RB-V2` (50% return rate)
  - `th-x507-c077-901` (82% return rate — should already be delisted)
  - Any product flagged on `data/exports/products_exclude_list.csv` (328 products with >12% return rate or zero inventory)
- Submit feed for review — Google approves within 24–48 hours.

**[DTC] Day 5 — March 27: Meta Ads Infrastructure**
- Install Meta Pixel + Conversions API (CAPI) on the headless frontend. CAPI is mandatory for accurate tracking with iOS privacy changes — implement server-side event passing for Purchase, AddToCart, ViewContent, and InitiateCheckout.
- Upload Champions list (36,739 contacts) as a **Value-Based Custom Audience** — include the LTV column so Meta optimizes for high-value lookalikes, not just demographic similarity.
- Create 1%, 2%, and 5% Value-Based Lookalike audiences from the Champions seed. This is one of the most powerful competitive advantages Stehlen has: 36,739 verified truck accessories buyers with known LTV values. No startup competitor has this.
- Build the product catalog in Meta Commerce Manager, organized by category: Grilles, Bumpers/Guards, Lights, Hitches, Tonneau Covers, Side Steps.
- **Geo-target from day one:** TX, CA, and FL represent 31% of all historical revenue ($7.2M, $6.9M, $5.7M respectively). Allocate 50%+ of initial Meta and Google budget to these three states.

**[DTC] Day 6 — March 28: Second Warm-Up Send + Flow Building**
- Send warm-up campaign #2 to a fresh 5,000 Champions. Content: "Tax season truck upgrade guide" organized by truck make with product-specific CTAs. Total: 10,000 reached.
- Build the Abandoned Cart flow (3 emails):
  - Email 1 at 1 hour: Reminder + product image + fitment verification prompt
  - Email 2 at 24 hours: Social proof + "This fits your [Year Make Model]" dynamic block
  - Email 3 at 72 hours: Final urgency + **15% off** (STEHLEN15 — this is the ONE place the larger discount is justified: highest-intent audience, lowest effective CAC)
- Build the Abandoned Checkout flow (3 emails, same cadence, messaging focused on completing the purchase with trust signals: free shipping, secure checkout, easy returns).

**[DTC] Day 7 — March 29: Campaign Launch Prep**
- Send warm-up campaign #3 to 10,000 Champions. Cumulative: 20,000 reached.
- Create Google Shopping campaign structure:
  - Campaign 1: Tonneau Covers — hero products (TC-F15015-5.5-LTH, TC-SIL19-5.8-LTH) — Manual CPC $0.80–$1.20
  - Campaign 2: Grilles and Body Kits — Manual CPC $0.80–$1.20
  - Campaign 3: Bumpers and Bull Guards — Manual CPC $0.80–$1.20
  - Campaign 4: Hitches and Towing — Manual CPC $0.80–$1.20
  - Campaign 5: Off-Road Accessories — Manual CPC $0.80–$1.20
  - Campaign 6: Lighting (RESTRICTED — exclude all SKUs with >8% return rate) — Manual CPC $0.60–$0.90
- Set all campaigns to Maximize Clicks with max CPC caps. Do NOT use tROAS until 50+ conversions have accumulated.
- Prepare Meta ad creatives: minimum 3 video ads (UGC-style install footage, before/after truck transformation, product showcase) + 2 carousels. All video in 4:5 vertical format.

---

### Week 2: Launch Paid Channels — March 30–April 5

**[DTC] Day 8 — March 30: Google Shopping Goes Live**
- Launch all 6 Shopping campaigns at $40/day each ($240/day total). Note: Lighting campaign runs at $30/day due to return rate risk.
- Add comprehensive negative keywords: "used," "junkyard," "OEM," "recall," "free," wrong vehicle makes/models not in catalog.
- Enable enhanced conversion tracking with revenue values.

**[DTC] Day 9 — March 31: Meta Ads Go Live**
- Campaign 1 (Prospecting — TX/CA/FL geo-targeted): 1% Champions Lookalike + truck interest stacking. **$100/day.** 3–4 ad variations.
- Campaign 2 (Retargeting): Site visitors + cart abandoners. **$30/day.** Dynamic product ads.
- Campaign 3 (Champions Re-engagement): Upload Champions as Custom Audience. Messaging: "Now available direct — factory pricing, no marketplace markup." **$20/day.**
- Total Meta: **$150/day.**

**[DTC] Days 10–11 — April 1–2: Email Warm-Up Acceleration**
- Send warm-up campaign #4 to 15,000 Champions. Content: product spotlight with tax season angle.
- Send warm-up campaign #5 to 15,000 Champions (fresh segment). Cumulative: ~50,000 reached.
- If open rates hold above 20% and spam complaints stay below 0.1%, double volume next week.
- Build Browse Abandonment flow (2 emails): personalized product recommendations based on Viewed Product events.
- Build Post-Purchase flow (4 emails: order confirmation → fitment verification check → installation tips → review request + cross-sell).

**[DTC] Days 12–14 — April 3–5: Optimize and Scale**
- Review first 5 days of Google Shopping data. Identify top-performing products and search terms. Add negative keywords.
- Review Meta performance. Pause underperforming creatives, increase budget on winners.
- Send warm-up campaigns #6 and #7 to 20,000 each. Cumulative: ~90,000 Champions reached.
- Increase Google Shopping budget to $350/day on winning campaigns.
- Build a **Tax Season Landing Page** featuring top products organized by truck make: F-150, Silverado, Ram, Tundra. Messaging: "Your refund. Your truck. Upgrade direct and save." Include 10% off offer prominently. The psychological framing of tax refunds as bonus money shortens the decision cycle from weeks to days.

---

### Week 3: Full Tax Season Push — April 6–12

**[DTC] Days 15–17 — April 6–8: Scale Into Refund Wave**
- IRS disbursement is now fully active. Scale email to full Champions list: send the "Tax Refund Truck Upgrade" campaign to all 36,739 Champions in a single send.
- Increase Google Shopping to $500/day. Add Google Search campaigns for high-intent fitment keywords at $100/day.
- Increase Meta prospecting to $200/day. Test 2–3% lookalike if 1% is performing.

**[DTC] Days 18–19 — April 9–10: Expand to Loyal Segment**
- Begin sending to the Loyal Customers segment (38,194 contacts — next best after Champions). Start with 20,000, monitor metrics.
- Import and begin warming the At Risk segment (91,423 contacts) — only send after Champions and Loyal segments are fully warmed.
- Launch second wave of Meta creatives to combat early fatigue.

**[DTC] Days 20–21 — April 11–12: Pre-Peak Positioning**
- If 30+ conversions have accumulated, switch Google Shopping bidding to Maximize Conversion Value (no tROAS target yet — let it optimize freely for 2 more weeks before setting a target).
- Total daily ad spend target by Day 21: $800–$1,000/day ($500 Google + $300–$500 Meta).
- Send "Last chance: 10% off ends Sunday" urgency email to the full Champions list.

---

### Klaviyo Warm-Up Schedule — Champions List

| Day | Recipients per Send | Cumulative Reached | Content |
|-----|-------------------|-------------------|---------|
| 3 | 5,000 | 5,000 | Brand intro + 10% off tax season offer |
| 6 | 5,000 (fresh) | 10,000 | Truck upgrade guide by make |
| 7 | 10,000 | 20,000 | Product spotlight: tonneau covers + grilles |
| 10 | 15,000 | 35,000 | Tax season urgency: "Your refund window closes" |
| 11 | 15,000 | 50,000 | Category showcase: top 5 products by truck make |
| 13 | 20,000 | 70,000 | Social proof + reviews |
| 14 | 20,000 | 90,000 | Best-sellers by truck make (personalized by source vehicle if available) |
| 17 | 36,739 (full Champions) | 36,739 | Tax Refund Upgrade Campaign — full blast |
| 19 | 20,000 Loyal | 56,739+ | Expand to Loyal segment |
| 21 | 20,000 Loyal | 76,739+ | Final pre-deadline push |

**Guardrails:** If open rates drop below 20%, halt expansion and re-segment. If bounce rate exceeds 2% on any send, stop and clean the list. If spam complaint rate hits 0.1%, reduce volume immediately. Gmail's domain penalty threshold is 0.3% — do not approach it.

---

## SECTION 2: The 12-Month Budget Plan — Corrected for Seasonality and Real Margins

### The Correct Margin Framework

The original strategy referenced "50–65% DTC margins." This is wrong. The correct figure from CB ERP analysis:

- **35.1% average net margin** across all 1,330 Shopify products (COGS = EffectiveCost + EstShipping_C)
- Margin range: 34.0% to 36.8% — a very tight band, indicating formula-based pricing rather than market-based pricing
- Lighting category specifically: 37% margin (lowest, and carries the highest return rate)
- Exterior Accessories: 47% margin (tonneau covers, grilles — lead DTC products)
- Interior Accessories: 53% margin (underutilized)
- Aerodynamics: 63% margin (underutilized)

Note: The 35.1% figure is the average across ALL products. When advertising focuses on the correct product mix (Exterior Accessories and Off-Road), effective margin on advertised products is 45–47%. Budget planning uses 35% as the floor for conservatism.

### ROAS Breakeven — Corrected

At 35% net margin, breakeven ROAS = 1 / 0.35 = **2.86x**

| Scenario | Net Margin | Breakeven ROAS | Profitable Target |
|----------|-----------|----------------|-------------------|
| Full-price sale | 35% | **2.86x** | **3.5x+** |
| 10% discount (first order) | ~25% | **4.0x** | **5.0x+** |
| 15% discount (abandoned cart only) | ~20% | **5.0x** | **6.0x+** |
| Free shipping absorbed ($44 avg) | ~26% effective | **3.85x** | **4.8x+** |

**Design implication:** The original ROAS trigger table (which treated <2x as the stop-loss threshold) was built for a 50%+ margin business. At 35% margin, the minimum acceptable blended ROAS is 2.86x. The campaign-level target is 3.5x+. Any campaign running below 2.86x for 14+ consecutive days is losing money and must be paused or rebuilt.

### ROAS Decision Triggers — Corrected

| Trailing 14-Day ROAS | Action |
|----------------------|--------|
| **Above 5.0x** | Scale aggressively — increase daily budget by 20% every 5 days |
| **3.5x–5.0x** | Maintain and optimize. Shift budget toward winning campaigns and products |
| **2.86x–3.5x** | Hold steady. Breakeven-to-marginal. Test new creative, audiences, and landing pages |
| **2.0x–2.86x** | Reduce spend by 30%. Losing money at this level. Diagnose: creative fatigue, audience exhaustion, or site conversion failure |
| **Below 2.0x** | Pause campaign. Do not reinvest until root cause is identified and fixed |

### Seasonal Correction — Real Data vs. Industry Benchmarks

The original strategy used industry benchmarks (Google Trends, SEMA data) to set seasonal indices. Our CB ERP data covering 5+ years of actual transactions produces different results:

| Month | CB Historical Index | Original Strategy Index | Verdict |
|-------|--------------------|-----------------------|---------|
| January | 0.85x | 0.70x | Original was too pessimistic |
| February | 0.90x | 0.80x | Original was too pessimistic |
| **March** | **1.30x** | 1.10x | **Actual data higher** — tax refund timing confirmed |
| **April** | **1.25x** | 1.25x | Aligned |
| **May** | **1.20x** | 1.30x | Original slightly high |
| June–August | 1.05x | 1.35x | **Original significantly overstates summer** |
| September | 1.00x | 1.00x | Aligned |
| October–December | 0.85–0.95x | 0.90–1.10x | Original overstates fall/holiday |

**Key correction:** The original strategy indexed June–July at 1.35x (peak). Our actual CB data shows March as the single highest-revenue month at 1.30x, with summer being a moderate plateau rather than an acceleration. Spring (March–May, 1.20–1.30x) driven by tax refunds is the real peak. Budget allocation must front-load March–May, not June–August.

The ChannelAdvisor data confirms this precisely: April 2025 was a $935K month (1.25–1.30x index), while June–August averaged $816K–$850K/month.

### Revised Monthly Budget and Revenue Targets

Revenue model assumptions: AOV $150 (our actual CA average is $144–$152), site CVR ramping from 0.8% in Month 1 to 1.5% by Month 6, email contributing 20–25% of revenue by Month 4.

| Month | Ad Spend | Paid Revenue | Email Revenue | B2B Revenue | Total Revenue | Seasonal Index |
|-------|----------|-------------|--------------|-------------|--------------|----------------|
| **Apr 2026** | **$28,000** | **$55,000** | **$7,000** | **$5,000** | **$67,000** | 1.25x |
| May | $30,000 | $65,000 | $15,000 | $8,000 | $88,000 | 1.20x |
| Jun | $32,000 | $80,000 | $26,000 | $12,000 | $118,000 | 1.05x |
| Jul | $32,000 | $85,000 | $33,000 | $15,000 | $133,000 | 1.05x |
| Aug | $28,000 | $78,000 | $33,000 | $18,000 | $129,000 | 1.05x |
| Sep | $20,000 | $50,000 | $20,000 | $20,000 | $90,000 | 1.00x |
| Oct | $18,000 | $48,000 | $19,000 | $20,000 | $87,000 | 0.95x |
| Nov | $30,000 | $75,000 | $36,000 | $22,000 | $133,000 | 1.10x (BFCM) |
| Dec | $22,000 | $55,000 | $25,000 | $22,000 | $102,000 | 0.90x |
| Jan 2027 | $15,000 | $33,000 | $14,000 | $20,000 | $67,000 | 0.85x |
| Feb | $18,000 | $38,000 | $16,000 | $20,000 | $74,000 | 0.90x |
| **Mar** | **$35,000** | **$88,000** | **$33,000** | **$22,000** | **$143,000** | **1.30x** |
| **Total** | **$308,000** | **$750,000** | **$277,000** | **$204,000** | **$1,231,000** | |

**Base case: $1.23M Year 1.** To reach $1.5M–$2.0M, the following must all execute above median: site CVR reaches 1.5%+ by Month 3 (requires fixing the site issues in Section 1), Google Shopping ROAS averages 4.0x+ (achievable after the learning phase), email contribution reaches 28–30%, and B2B ramps faster than modeled. The $2.0M stretch target requires performing at the 75th percentile or above across all channels.

**Important: these DTC figures are additive to marketplace revenue** (projected at $8M for 2026). Total company revenue at base case: $8M marketplace + $1.23M DTC = $9.23M.

### Monthly Channel Budget Allocation

| Month | Google Shopping | Google Search | Meta | YouTube | Total Paid |
|-------|---------------|--------------|------|---------|------------|
| Apr | $14,000 | $3,000 | $9,000 | $0 | $26,000 |
| May | $16,000 | $4,000 | $8,000 | $0 | $28,000 |
| Jun | $17,000 | $5,000 | $8,000 | $2,000 | $32,000 |
| Jul | $17,000 | $5,000 | $8,000 | $2,000 | $32,000 |
| Aug | $14,000 | $4,000 | $8,000 | $2,000 | $28,000 |
| Sep | $10,000 | $3,000 | $5,000 | $1,000 | $19,000 |
| Oct | $9,000 | $3,000 | $4,500 | $1,000 | $17,500 |
| Nov | $15,000 | $4,000 | $8,000 | $1,500 | $28,500 |
| Dec | $11,000 | $3,000 | $6,000 | $1,000 | $21,000 |
| Jan | $8,000 | $2,000 | $4,000 | $500 | $14,500 |
| Feb | $9,000 | $3,000 | $4,500 | $1,000 | $17,500 |
| Mar | $18,000 | $5,000 | $9,000 | $2,000 | $34,000 |
| **Total** | **$158,000** | **$44,000** | **$82,000** | **$14,000** | **$298,000** |

Remaining ~$10K of paid budget covers feed management tools ($50–$150/month DataFeedWatch or GoDataFeed), review platform (Judge.me or Stamped.io), and miscellaneous tooling. Klaviyo at 300K+ contacts costs approximately $1,500–$2,500/month separately. Creative production budget: $3,000–$5,000/month — do not underestimate this. Meta requires 2–4 new creative concepts per week at $100+/day spend.

### What the Linear Ramp Gets Wrong

The original plan ramped spend linearly from $1,189/month to $34,139/month. This under-invests during the highest-ROAS window (March–May tax season) and over-invests during the low-demand shoulder season. The revised plan front-loads April through March's second tax season, with step-downs in September–February.

Never go fully dark: maintaining minimum spend preserves Google Quality Scores and Meta pixel learning during off-peak months. During off-peak, cut prospecting by 40–50% but maintain retargeting and email at full intensity. CPCs are lower in off-peak months — retargeting audiences accumulated during peak convert at favorable CPAs even in November–February.

---

## SECTION 3: Klaviyo Strategy — Zero to 25% Revenue Contribution

Email should contribute 20–25% of total DTC revenue by Month 4–6. At $1.23M Year 1 base case, that is $246K–$308K from email alone. This is achievable with 321,851 segmented contacts — but only if domain warm-up succeeds and flows are built correctly.

### Importing 321,851 Contacts with RFM Segmentation

Import contacts in waves, not all at once. Map these custom properties for each contact:

- **RFM_Segment** (Champions, Loyal, At Risk, Hibernating)
- **Lifetime_Value** (numeric — critical for Meta Value-Based Lookalike seed)
- **Last_Purchase_Date** (for recency-based targeting)
- **Purchase_Count** (for frequency-based messaging)
- **Primary_Vehicle** (Year/Make/Model if available — enables fitment-personalized emails)
- **Preferred_Categories** (based on purchase history)
- **Source_Channel** (Amazon, eBay — tailor DTC conversion messaging accordingly)

**Import sequence:** Champions (36,739) → Loyal Customers (38,194) → At Risk (91,423) → Hibernating (113,280). Never send to Hibernating contacts until the domain is fully warmed (6+ weeks minimum). Hibernating contacts have the lowest engagement and highest spam-complaint risk.

**List hygiene before import:** Run the full list through a verification service (ZeroBounce or NeverBounce, approximately $300 for 300K emails). Invalid emails drive bounce rates up and domain reputation down — particularly dangerous on a new sending domain.

### RFM Segment Summary

| Segment | Contacts | Avg LTV | Priority | Email Strategy |
|---------|----------|---------|----------|----------------|
| Champions | 36,739 | $425 | #1 | Tax season campaign + Meta Lookalike seed |
| Loyal | 38,194 | ~$280 | #2 | Reactivation + DTC conversion |
| At Risk | 91,423 | ~$180 | #3 | Win-back campaigns |
| Hibernating | 113,280 | ~$120 | #4 | Low-cost email only — verify list first |
| **Total** | **321,851** | | | |

### Domain Warm-Up Strategy

The sending domain has zero reputation history. Build it methodically:

- **Phase 1 (Days 1–14):** Champions only. Sub-10K per send. Content-heavy, low-promotional. Target: 30%+ open rate, <1% bounce, <0.05% spam complaint. Cumulative by Day 14: 50,000–70,000 sends.
- **Phase 2 (Days 15–28):** Expand to 60-day engaged + Loyal segment. 15,000–20,000 per send, 3x/week. Mix promotional (tax season offer) with content. Open rates should hold above 20%. Cumulative: 150,000+ sends.
- **Phase 3 (Days 29–42):** 90-day engaged + broader segments. 30,000–50,000 per send. Begin At Risk in small batches.
- **Phase 4 (Days 43–56):** Full volume unlocked for all segments except Hibernating. Hibernating: test 5,000 at a time, sunset non-responders after 2 attempts.

### Flow Priority and Build Sequence

Build flows in this exact order. Tier 1 flows generate 80%+ of automation revenue:

**Tier 1 — Build in Week 1 (before any paid traffic):**

1. **Welcome Series** (4–5 emails, 10-day span): Triggers on email signup. Revenue per recipient benchmark: $2.65 average, $3.34 for AOV $100–$200. Discount offer: 10% off (see margin correction in Section 2 — not 15%). This flow alone drives 15–20% of total email revenue.

2. **Abandoned Cart** (3 emails): Triggers on Added to Cart without purchase. Revenue per recipient: $3.65 average, up to $14.14 for AOV >$200 — the highest RPR of any flow. Timing: 1 hour → 24 hours → 72 hours. Include fitment verification prompt at each touchpoint. **Email 3 (72 hours) is the one place to deploy 15% off** — this audience has the highest demonstrated intent and lowest effective CAC.

3. **Abandoned Checkout** (3 emails): Triggered at checkout initiation — the highest-intent abandoners in the funnel. Lead with trust signals: free shipping, easy returns, secure checkout, phone number.

**Tier 2 — Build in Week 2–3:**

4. **Post-Purchase** (5 emails): Order confirmation → Fitment verification (Day 2: "Confirm this matches your vehicle before we ship") → Tracking/shipping update → Installation tips at delivery → Review request + cross-sell at Day 14. The Day 2 fitment verification email is the single highest-leverage return prevention tool in the flow library. Catching a fitment error before shipment costs ~$5 to resolve. Catching it after delivery costs $20–$65 in return processing.

5. **Browse Abandonment** (2 emails): Triggers on product page view without add-to-cart. Wait 2–4 hours for Email 1, 24 hours for Email 2. Include dynamic fitment block: "This grille fits 2014–2018 Chevy Silverado 1500. Is this your truck?" Activate only after domain warm-up reaches Phase 2.

**Tier 3 — Build in Month 2:**

6. **Win-Back** (3 emails): Triggers at 60–90 days of inactivity. "We miss your truck" messaging with 20% off reactivation offer. Target: revive 15–20% of dormant contacts.
7. **Back-in-Stock** (1 email + optional SMS): 60–75% open rate, 10–20% conversion — highest-performing notification type.
8. **Price Drop** (1 email): Alerts browsers when viewed items go on sale.
9. **Review Request** (standalone, post-delivery + 7 days): The site currently has zero reviews. This is a conversion killer on new traffic. Build this early.

**Special Flow: Fitment Failure Cross-Sell [DTC + MARKETPLACE]**

This is a $70,000+/year missed opportunity identified in Zendesk analysis. Currently, when a customer contacts CS with a fitment failure, agents issue a refund. The correct response is: issue the refund AND offer the correct product.

Build a Klaviyo flow triggered by a "Fitment Failure" tag applied by CS. The flow sends:
- Email 1 (same day): "We're so sorry — let's find the right fit for your truck" + YMM lookup link + 15% off the correct replacement product
- Email 2 (Day 3): Follow-up if no purchase — "Our fitment team found this for your [Year Make Model]" + specific product recommendation

At 1,475 Zendesk fitment failure tickets per year and a conservative 10% email conversion rate, this flow generates 147 additional orders at ~$150 AOV = **$22,050 in recovered revenue per year**, plus the intangible benefit of converting a negative CS experience into a positive brand touchpoint.

### Headless Shopify + Klaviyo Integration

Because the frontend is React/Lovable (not Shopify themes), client-side tracking requires manual implementation:

```javascript
// Add to every page in React app
<script async src="https://static.klaviyo.com/onsite/js/klaviyo.js?company_id=YOUR_ID"></script>

// Viewed Product — add to PDP component
_learnq.push(['track', 'Viewed Product', {
  Name: product.title,
  ProductID: product.id,
  ImageURL: product.image,
  URL: window.location.href,
  Price: product.price,
  Brand: 'Stehlen'
}]);

// Added to Cart — add to cart action handler
_learnq.push(['track', 'Added to Cart', {
  total_price: cart.totalPrice,
  $value: cart.totalPrice,
  items: cart.lineItems
}]);

// Identify — fire on login, email capture, and checkout
_learnq.push(['identify', {
  '$email': user.email,
  '$first_name': user.firstName
}]);
```

Server-side events (order placed, fulfilled, refunded) fire automatically via the native Shopify integration. Ensure the Shopify checkout URL preserves the `_kla_id` cookie — contact Klaviyo support to update catalog product URLs from the default `myshopify.com` domain to `stehlenauto.com`.

### Email Revenue Projections

| Month | Email Revenue | % of Total DTC | Key Driver |
|-------|-------------|----------------|------------|
| Apr (M1) | $7,000 | 10% | Champions warm-up campaigns, early flows |
| May (M2) | $15,000 | 17% | Full Champions list active, core flows live |
| Jun (M3) | $26,000 | 22% | Broader segments active, all Tier 1+2 flows |
| Jul (M4) | $33,000 | 25% | 3x/week campaign cadence, segments optimized |
| Aug (M5) | $33,000 | 26% | Steady state, full flow suite |
| Sep (M6) | $20,000 | 22% | Seasonal demand dip, email holds share |
| Oct (M7) | $19,000 | 22% | Tonneau cover fall push |
| Nov (M8) | $36,000 | 27% | Black Friday / Cyber Monday blitz |
| Dec (M9) | $25,000 | 25% | Holiday campaigns, year-end fleet |
| Jan (M10) | $14,000 | 21% | Post-holiday, early tax content |
| Feb (M11) | $16,000 | 22% | Pre-tax warm-up campaigns |
| Mar (M12) | $33,000 | 23% | Tax Season Year 2 |
| **Total** | **$277,000** | **~23% avg** | |

### SMS Strategy

Introduce SMS in Month 3 (June), after email is fully established. Add SMS opt-in as a second step in the email capture popup (email first, then "Get texts for exclusive deals?"). Add SMS to Abandoned Cart (Email 3 replacement or supplement) and Back-in-Stock first.

**Compliance note:** TCPA requires separate explicit written consent for SMS — email opt-in does not cover texts. Texas SB 140 (effective September 2025) imposes fines up to $10,000 per message for violations — register with the Texas Secretary of State before sending SMS to Texas numbers (Texas is the #1 revenue state). No texts before 8 AM or after 9 PM recipient local time. Klaviyo handles quiet hours and STOP keywords automatically. Consent collection is the brand's responsibility.

---

## SECTION 4: Paid Advertising — Product Prioritization Corrected by Real Return Data

### The Correct Product Hierarchy for DTC Advertising

**DO NOT lead with headlights.** The original strategy listed LED headlights as "Priority 5" — this is still too high given the data:

- Lighting category margin: 37% (lowest of any category)
- $461K in refunds in the last 2 years (highest of any category)
- 53% of all Zendesk defect tickets are LED headlights (moisture ingress defect the supplier has not fixed)
- Top headlight SKUs carry 10–15% individual return rates
- At 37% margin and 12% average return rate, the effective margin after returns is approximately 21% — which raises breakeven ROAS to 4.75x just to cover cost of goods, before any advertising cost

The correct priority order for DTC advertising spend:

**Priority 1 — Tonneau Covers: Lead Hero Products**
- TC-F15015-5.5-LTH (F-150 5.5ft): $955K historical revenue, 47% margin, 4.8% return rate
- TC-SIL19-5.8-LTH (Silverado 5.8ft): $633K revenue, 47% margin, 3.4% return rate
- TC-SIL14-5.8-LTH (Silverado 5.8ft): $373K revenue, 47% margin, 3.3% return rate
- AOV range: $372–$649. High visual impact. Clear fitment. Proven demand.

**Priority 2 — Grilles and Mesh Grilles**
- FG-RAM94-ME-BK (Ram Grille): $341K revenue, 47% margin, 2.7% return rate — lowest return rate of any high-revenue product
- Universal Mesh Grille Insert: $715K revenue, 47% margin, 8.7% return rate — borderline; include in retargeting but not prospecting
- Strong visual transformation potential for before/after creative

**Priority 3 — Fender Flares and Exterior Accessories**
- CRJZ-TIRE-FS-MB (Fender Flares): $365K revenue, 47% margin, 3.9% return rate
- Bull bars and grille guards (strong visual for before/after, utility appeal)

**Priority 4 — Hitches and Towing**
- $49–$252 range, utility-driven, broad audience overlap with truck owners
- Lower visual impact but high search intent ("need a hitch for my truck" is a buying query)

**Priority 5 — Lighting (WITH RESTRICTIONS)**
- Only advertise tail lights and light bars — these have better return rates than headlights
- Do NOT run paid ads on: `HLPLNB-TUN07FLED-AB` (14.3%), `HLPLNB-RAM06FLED-AB` (15.2%), RAM 09-18 LED Sequential Taillights (10.3%) unless tightly managed
- Do NOT use headlights as the visual hook in any creative — despite being visually compelling, the defect rate will generate returns that wipe out paid ad margins

**NEVER advertise:**
- `th-x507-c077-901` — delist
- `TBM-TIT16B-6.5-RB-V2` — delist
- All `-901` suffix SKUs
- All Window Visor SKUs (20% return rate)
- Any SKU with >8% return rate on trailing 90-day data

### Google Shopping: Primary Revenue Engine [DTC]

Google Shopping should receive 50–55% of total paid ad budget. The auto parts vertical delivers the best Shopping performance of any vertical tracked: $0.56 average CPC and a median ROAS of 3.91x on Standard Shopping. For a 35% margin product catalog, 3.91x median ROAS means 3.91 / 2.86 = 1.37x return above breakeven at median performance — profitable but not scalable until ROAS exceeds 4x.

**Feed optimization priorities:**
- Rewrite all product titles to: `[Year Range] [Make] [Model] Stehlen [Product Type] – [Key Attribute]`
- Include MPN (Manufacturer Part Number) for every SKU — part number searches convert at the highest rate in auto parts
- Add structured fitment data: compatible years, makes, models, cab types, bed lengths, 2WD/4WD
- Use a supplemental feed tool (DataFeedWatch or GoDataFeed, $50–$150/month) for custom labels, optimized titles, and product suppression

**Campaign structure and bidding progression:**

| Phase | Timeline | Bidding | Daily Budget | Criterion to Advance |
|-------|----------|---------|-------------|---------------------|
| Launch | Weeks 1–4 | Maximize Clicks (Manual CPC cap $1.20) | $250/day | Accumulate 50+ conversions |
| Learning | Weeks 5–8 | Maximize Conversion Value (no target) | $400/day | Let Google optimize freely |
| Optimization | Months 3–6 | tROAS at trailing 30-day ROAS | $500/day | Scale profitable campaigns |
| Scale | Months 6–12 | tROAS with 20% incremental increases | $600–$800/day | Push toward 4–5x ROAS |

Do NOT set a tROAS target until 50+ conversions in 30 days. Setting aspirational tROAS on a new account starves the algorithm.

### Google Search: Capture High-Intent Fitment Queries [DTC]

Allocate 15–20% of Google budget to Search campaigns. These have lower individual volume but extremely high conversion rates — a shopper searching "2019 F150 grille guard" is a buyer, not a browser.

**Keyword architecture by ad group:**
- Fitment + Product Type (highest intent): `[2019 ford f150 grille guard]`, `"ram 1500 tonneau cover 5.7 bed"`
- Part Number (highest conversion rate): Exact-match MPNs for all 1,330 products
- Category + Make (mid-funnel): `"ford f150 accessories"`, `"ram truck bumper"`
- Brand defense: `[stehlen auto]`, `[stehlen grille]`, `[stehlen tonneau cover]`

Separate campaigns by product category. Add extensive negative keywords: "used," "junkyard," "OEM," "salvage," "recall," "free," all vehicle makes/models not in catalog.

### Meta Ads: Awareness-to-Conversion Bridge [DTC]

Automotive has the lowest CPM ($10.01) and highest ROAS (2.54x on prospecting) of any Meta vertical. The Champions list provides an exceptional seed for value-based lookalikes — 36,739 verified buyers with known LTV values.

**Campaign structure:**

| Campaign | Budget Share | Objective | Audience | Geo |
|----------|------------|-----------|----------|-----|
| Prospecting (CBO) | 60% | Conversions | 1% Champions LAL + truck interests | TX, CA, FL first |
| Retargeting (CBO) | 20% | Conversions | 0–7 day cart abandoners, 8–30 day viewers | National |
| Advantage+ Sales | 15% | Sales | Broad, full catalog | TX, CA, FL first |
| Creative Testing (ABO) | 5% | Conversions | Broad + 1% LAL | TX, CA, FL |

**Creative strategy:** Lead with UGC-style install videos in 4:5 vertical format (outperforms 1:1 by ~15%). Produce minimum 3 video concepts and 2 carousels for launch. Refresh creative every 7–14 days at $100+/day spend. Recommended mix: 60% video, 25% carousel, 15% static. Before/after transformations (stock truck → accessorized) are the highest-converting format in this vertical. The specific trucks to feature first: F-150, Silverado, and Ram — these cover the top three revenue states' most popular trucks.

**Ad copy framework:** Lead with identity and transformation ("Turn your stock Silverado into a head-turner"), reference specific makes/models, leverage social proof ("Join 36,000+ truck owners who upgraded direct from Stehlen"), always include fitment specificity and free shipping.

**Target ROAS for Meta:** Prospecting target 2.5–3.0x (above 2.86x breakeven). Retargeting target 4.0x+ (these are warmer audiences). Do not chase sub-2.86x prospecting — at 35% margin there is no ROAS that makes below-breakeven spend worthwhile as a brand awareness investment at this stage of the business.

### YouTube: Introduce in Month 3 [DTC]

Launch YouTube 60–90 days after Meta, using proven creative from Meta testing. Start with TrueView In-Stream ads (30–90 seconds) repurposing top-performing Meta videos. Target Auto Enthusiasts and Truck Owners affinity audiences + Custom Intent audiences (people searching truck accessories on Google). Allocate 10% of total ad budget once introduced.

Installation tutorial content (2–5 minutes) is the highest-engagement automotive format on YouTube and doubles as both paid pre-roll and organic SEO-indexed content.

---

## SECTION 5: Seasonal Revenue Model — Corrected Against Real CB Data

### Actual Seasonal Indices (CB ERP 5-Year Average)

These indices replace the benchmarks in the original strategy with actual Stehlen historical data:

| Month | Index | Key Drivers | DTC Budget Multiplier |
|-------|-------|-------------|----------------------|
| January | 0.85x | Post-holiday low, cold weather | 0.5x (cut prospecting) |
| February | 0.90x | Early refunds, pre-season browsing | 0.6x |
| **March** | **1.30x** | **Tax refund peak (#1 month by data)** | **1.2x (full send)** |
| **April** | **1.25x** | **Peak refund disbursement** | **1.2x (full send)** |
| **May** | **1.20x** | **Refund tail + Memorial Day + project season** | **1.1x** |
| June | 1.05x | Summer plateau | 1.0x |
| July | 1.05x | Summer plateau | 1.0x |
| August | 1.05x | Late summer | 1.0x |
| September | 1.00x | Shoulder season | 0.8x |
| October | 0.95x | Tonneau cover weather prep | 0.8x |
| November | 1.10x | Black Friday / Cyber Monday | 1.1x |
| December | 0.90x | Holiday + year-end fleet orders | 0.7x |

**Critical correction from the original strategy:** The original indexed June–July at 1.35x (higher than March) based on Google Trends and SEMA data. Our actual CB transaction data shows March at 1.30x and June–July at only 1.05x. The practical implication: spend aggressively in March–May and treat June–August as a profitable maintenance period, not a second surge.

### How to Manage Spend by Season [DTC]

During peak months (March–May, November): push Search Impression Share above 80% on top-performing campaigns. Uncap daily budgets on campaigns exceeding 3.5x ROAS. These are the highest-ROI windows — every impression lost goes to a competitor.

During off-peak months (September–February, excluding November): reduce prospecting spend by 40–50%. Maintain retargeting and email at full intensity. CPCs are lower and the audience accumulated during peak seasons still converts at favorable CPAs. Never go fully dark — this destroys Google Quality Scores and resets Meta Pixel learning.

---

## SECTION 6: Reducing Refunds from 5.1% to 3% — Specific Fixes Required

Reducing refund rate from 5.1% to 3.0% on $1.23M DTC revenue saves approximately **$25,830 annually** — essentially free marketing budget. More importantly, at 35% net margin, every prevented return preserves $52.50 in margin (at $150 AOV) that would otherwise be fully consumed by return processing, replacement shipping, and customer service labor.

### The Zendesk Reality — What Is Actually Driving Returns

The original strategy described refund drivers generically. Our Zendesk analysis (19,302 tickets) gives us the exact picture:

| Root Cause | Ticket Volume | Revenue Impact | Action |
|------------|-------------|----------------|--------|
| LED headlight moisture defects | 53% of defect tickets (1,314 tickets) | $461K in refunds | Supplier QC escalation — this is a manufacturing defect, not a listing problem |
| Fitment failures | 1,475 tickets | ~$221K in refunds + $70K cross-sell gap | Fitment verification emails + CS cross-sell training |
| Stuck tickets creating eBay defects | 524 tickets | Seller rating risk | Resolve and build SLA process |
| Fake tracking incidents | 2 incidents | Amazon suspension risk | Investigate Zendesk #519232, #519373 immediately |

**The headlight supplier problem is the single largest refund driver.** The moisture ingress defect in LED headlights has been documented and the supplier has not fixed it. This is generating $461K per year in refunds. The options are: (1) formally escalate to the supplier with a demand for a manufacturing fix with a deadline, (2) switch suppliers, or (3) withdraw headlights from advertising entirely. Option 3 is already baked into Section 4 of this plan. Options 1 and 2 require supply chain decisions outside the scope of marketing — but marketing must not pour ad spend into a product with a known unresolved manufacturing defect.

### Product Exclusions — Hard Rules [DTC]

Hard exclusions from Google Shopping feed and Meta catalog (remove entirely, not just deprioritized):
- All Window Visor SKUs — 20% return rate, 4x the target
- All `-901` suffix SKUs — systematic high-return pattern
- `HLPLNB-TUN07FLED-AB` — 14.3% return rate
- `HLPLNB-RAM06FLED-AB` — 15.2% return rate
- `TBM-TIT16B-6.5-RB-V2` — 50% return rate
- `th-x507-c077-901` — 82% return rate — delist from all channels

Soft exclusions (remove from prospecting campaigns, allow in retargeting only):
- Products with 5–8% return rates — acceptable for repeat customers who understand fitment, risky for new customer acquisition
- Universal Mesh Grille Insert — 8.7% return rate — borderline, retargeting only

Implementation: Use Custom Label 4 in the Google Shopping feed to tag return rate tiers. Establish a monthly review process — query return data by SKU, update exclusion lists at the first of each month.

### Fitment Verification Through Klaviyo Flows [DTC]

Pre-purchase flows (Browse Abandonment and Abandoned Cart):
- Add a dynamic fitment block: "This grille fits 2014–2018 Chevy Silverado 1500. **Is this your truck?** [Verify Fitment]"
- Link to the YMM tool. This single addition reduces fitment-related returns by an estimated 30% based on automotive retailer data.

Post-purchase flow — Day 2 (before shipping):
- "Your Stehlen order is being prepared. Before we ship: please confirm this product fits your [Year Make Model]. If you need to change your order, reply to this email — no hassle, no fees."
- This converts returns into pre-ship order modifications. Pre-ship change: ~$5. Return after delivery: $20–$65.

Post-delivery sequence (Days 1, 3, 7):
- Day 1: Installation guide link + install time estimate + contact info
- Day 3: "How's the install going? 3 tips from our team" + contact link
- Day 7: "Love your new [product]? Share a photo and get $20 off your next order"

The Day 7 photo request reduces buyer's remorse returns by creating a social commitment to the purchase. Research shows post-purchase engagement reduces return rates 10–20% for considered purchases in this AOV range.

### Cross-Sell on Fitment Failures — $70K/Year Gap [DTC + MARKETPLACE]

**This is the most underleveraged opportunity in the entire business.** Zendesk shows 1,475 fitment failure tickets per year where agents issue a refund with no cross-sell attempt. These customers need a truck accessory — they just ordered the wrong one.

The correct CS response to a fitment failure is:
1. Issue the refund without friction
2. Immediately say: "Let me find the right part for your [Year Make Model]" — look up the correct SKU
3. Apply a 15% discount code to the replacement order
4. If the replacement purchase happens, the effective outcome is zero net return cost and a satisfied customer

Train CS team on this protocol. Build the Klaviyo fitment cross-sell flow as a backup for cases where the customer leaves before CS engages. Target: convert 10–15% of fitment failures into replacement orders. At 1,475 tickets, 10% conversion, $150 AOV = $22,125 in recovered revenue on DTC. On marketplace, the same protocol applied to Amazon/eBay CS contacts can recover similar amounts.

---

## SECTION 7: B2B Channel — Path to $204K in Year 1

The original strategy targeted $229K in B2B Year 1. The revised model targets $204K as a conservative base case, requiring 20–25 active wholesale accounts by year-end at $800–$1,000/month average. B2B margins on gross product are lower (typically 25–35% at wholesale pricing) but acquisition costs are near-zero once accounts are established, and B2B provides predictable recurring revenue that smooths the seasonal DTC curve.

**IMPORTANT CHANNEL NOTE:** B2B accounts should route their orders through stehlenauto.com using B2B/wholesale pricing set up in Shopify. Do NOT send B2B customers to Amazon or eBay — that cannibalizes marketplace revenue and defeats the purpose of building a DTC wholesale channel.

### The Fastest Path to B2B Revenue: The 139 VIP Accounts

The business already has 139 customers with 10+ orders and $18.7M in lifetime revenue — an average LTV of $134,490 per account. These are almost certainly B2B wholesale buyers or resellers operating through marketplace channels. They are the fastest path to B2B DTC revenue because:
- They already know and trust the brand
- They have purchasing authority and buying patterns established
- Converting even 10% of these accounts to stehlenauto.com wholesale = 14 accounts at ~$134K LTV = $1.87M in estimated future revenue

**Immediate action:** Identify who these 139 accounts are from the CB/CA data. Pull their contact information. Begin direct outreach with a personalized wholesale offer before April 15. This is a nearly zero-cost, near-term revenue opportunity.

### B2B Month-by-Month Execution

**April–May — Infrastructure and First Outreach [DTC]:**
- Build a "Become a Dealer" page on stehlenauto.com with: tiered pricing structure (30–50% off retail based on volume), minimum order ($500 initial, $250 reorder), payment terms (prepayment for first 3 orders, then Net 30 for proven accounts), dealer application form.
- Set up B2B pricing in Shopify using Shopify's native B2B features or SparkLayer/Wholesale Club app.
- Create wholesale catalog PDF organized by vehicle make and product category with dealer pricing.
- Begin direct outreach to 50 truck accessory shops within 300 miles of the Walnut, CA warehouse. Source from Google Maps ("truck accessories installer"), SEMA member directory, Total Truck Centers directory.
- Target: 5–10 applications, 3–5 first orders by end of May.

**June–August — Scale Outreach [DTC]:**
- Expand geographic radius to national. Target top 20 truck markets: Houston, Dallas, Phoenix, Atlanta, Denver, Charlotte, Orlando.
- Launch LinkedIn outreach targeting shop owners and fleet managers.
- Set up B2B Klaviyo list with Dealer Welcome Series (5 emails: account setup → catalog highlights → first order incentive → reorder reminder → volume tier upgrade path).
- Launch Google Search campaigns targeting "wholesale truck accessories" and "[product] dealer program" at $500/month.
- Target: 15–20 active accounts by August.

**September–December — Optimize and Fleet [DTC]:**
- Begin fleet sales outreach: construction companies, landscapers, delivery fleets, municipal buyers needing hitches, grille guards, running boards, and lighting for work trucks.
- Fleet accounts have 3–6 month sales cycles but order values of $3,000–$15,000 per multi-vehicle outfitting.
- Apply to distributor programs (Keystone Automotive, Meyer Distributing) — this is a 3–6 month process but creates enormous reach.
- Offer existing dealers referral incentives ($50–$100 credit per referred shop that places a first order).
- Target: 25–30 active accounts by December, 2–3 fleet accounts in pipeline.

**B2B Klaviyo Segment:** Maintain a completely separate B2B list from DTC contacts. Tag all B2B profiles with: Business_Type (installer/fleet/dealer/reseller), Volume_Tier (Bronze <$500/mo, Silver $500–$2K/mo, Gold >$2K/mo), Region, Primary_Product_Interest. B2B email content focuses on margin opportunity ("Offer your customers Stehlen grilles at 40% margin"), spec sheets, fitment data, and wholesale pricing tiers — fundamentally different tone from DTC lifestyle/emotional content.

### Original B2B Margin Reference — Corrected

The original strategy stated "25–40% gross margin for B2B vs. 50–65% DTC." The corrected figures: DTC average net margin is 35.1%, not 50–65%. B2B at wholesale discount (typically 30–50% off retail) produces approximately 15–25% net margin depending on discount tier. B2B should be viewed as a volume play with predictable reorder cadence, not a margin play. The business case for B2B is CAC efficiency and revenue predictability, not margin maximization.

---

## SECTION 8: Dead Stock Liquidation — Free Up Capital for Growth

This section was missing from the original strategy entirely. It belongs here because the capital tied up in dead inventory could directly fund marketing spend.

### The Scale of the Problem

The top 200 overstocked items average **10,049 days of supply** — 27 years of inventory at current sales velocity. Worst offenders include items with 46-year supply on hand. This is not a warehousing inconvenience; it is capital tied up in product that will never sell at regular price and is occupying warehouse space that has carrying costs.

| Item | Available Qty | 90-Day Sales | Days of Supply |
|------|--------------|-------------|----------------|
| RRLB-SB03-2.5-SB-FRC | 561 | 3 | 16,830 (46 years) |
| Multiple other SKUs | 200–500 | 0–2 | 5,000–15,000+ |

### Liquidation Strategy by Channel

**[DTC] stehlenauto.com Clearance Section:**
Create a permanent "Clearance" collection on the site. Price dead stock at COGS + 10–15% (enough to cover fulfillment costs). Market it as "limited quantity" to drive urgency. Do not advertise clearance products — organic and email traffic only. Include clearance in post-purchase cross-sell emails as a secondary recommendation.

**[MARKETPLACE] Amazon Outlet:**
Submit overstocked products to Amazon Outlet for discounted pricing to Amazon shoppers. Amazon handles the reduced-price merchandising. This is a low-effort channel for volume liquidation.

**[MARKETPLACE] eBay Auction:**
Run structured auction lots for dead stock on the existing eBay account. Group similar items (e.g., "lot of 12 truck light bar mounts") to clear in bulk. Auctions with no reserve generate the most velocity.

**Priority for liquidation:** Items with 0 sales in last 90 days and more than 100 units on hand. Cross-reference against `data/analytics/08_inventory_health_days_of_supply_*.csv` for the complete ranked list.

The capital recovered from liquidating even 20% of the dead stock position funds 2–4 months of additional marketing spend. This is real money.

---

## SECTION 9: Five Risks That Could Derail the $1.23M–$2.0M Target

### Risk 1: Site Conversion Rate Stays Below 1% [DTC]

**Probability: Medium-High.** The site currently has placeholder text, sold-out featured products, translation errors, SKU-based product naming, zero product reviews, no email capture form, and a YMM tool missing 2024–2026 vehicles. At a 0.5% conversion rate, the entire financial model breaks. At $800/day in ad spend and 0.5% CVR, revenue math becomes impossible regardless of ROAS.

**Mitigation:** The Day 1–2 site triage in Section 1 is non-negotiable. Fix in priority order: (1) remove placeholder content, (2) hide sold-out products from featured sections, (3) add email capture popup with 10% offer, (4) fix YMM tool for 2024–2026, (5) rewrite top 100 product titles from SKU format to descriptive format. Budget 40–80 development hours in the first two weeks. Target: 1.0% CVR by end of Month 1, 1.5%+ by Month 3.

### Risk 2: Klaviyo Domain Gets Flagged During Warm-Up [DTC]

**Probability: Medium.** Sending from a brand-new domain to 321K+ contacts — many of whom originally gave their email to Amazon or eBay, not to Stehlen directly — creates deliverability risk. If Gmail or Yahoo flags the domain in the first two weeks, recovery takes 4–6 weeks, wiping out the tax season window entirely.

**Mitigation:** Follow the warm-up schedule in Section 3 exactly. Scrub the full list with ZeroBounce or NeverBounce before import (~$300 for 300K verifications). Monitor spam complaint rate on every send — if it approaches 0.1%, halt expansion immediately. If it hits 0.3%, pause all sending and re-segment. The first 5 sends must be content-heavy, low-promotional to establish positive engagement signals with ISPs.

### Risk 3: Google Shopping ROAS Stays Below 2.86x Past Month 3 [DTC]

**Probability: Medium.** New accounts with no conversion history spend 60–90 days in a learning phase with erratic performance. At 35% margin, 2.86x is the breakeven — any sustained ROAS below this figure is a net loss on advertising. If product feed isn't optimized with proper YMM titles and the site converts at 0.5%, Shopping ROAS could remain unprofitable through Q2.

**Mitigation:** Product feed quality is the #1 determinant of auto parts Shopping success. Invest heavily in feed optimization before launch (Day 4 of the sprint). Use DataFeedWatch for supplemental feed management. If ROAS stays below 2.86x after 60 days, shift budget from Shopping to Search (higher-intent queries, higher CVR) and increase Meta retargeting. Do not throw more budget at a campaign that is structurally losing money.

### Risk 4: Insufficient Creative Volume Causes Meta Fatigue [DTC]

**Probability: Medium-High.** At $150–$300/day Meta spend, creative fatigue sets in every 7–14 days. Producing 2–4 new creative concepts weekly requires a production pipeline most new DTC brands underestimate. If the brand launches with 5 ad variations and doesn't refresh, CPAs inflate 30–50% within 3 weeks — at 35% margin, that degradation is immediately impactful.

**Mitigation:** Budget $3,000–$5,000/month for creative production. Engage 3–5 UGC creators via Billo or Insense ($150–$300 per video) for authentic install content. Repurpose the same footage into multiple formats. Build a library of 20+ assets before scaling Meta above $200/day.

### Risk 5: Marketplace Decline Accelerates Beyond 22%/Year [MARKETPLACE]

**Probability: Medium.** The marketplace revenue decline is the strategic context driving this entire DTC launch. The risk is that the decline accelerates (to -30%+/year) faster than DTC can offset it. At current trajectory, marketplace revenue hits $6M by 2027 if decline continues at 22%/year.

**Mitigation:** DTC Year 1 base case of $1.23M offsets only one year of 22% marketplace decline ($2.2M lost). The business needs DTC to be at $2M+ by Year 2 to be fully self-sustaining without marketplace dependency. This makes the 50%+ YoY DTC growth target in Years 2–3 as important as Year 1 execution.

Additionally: do not inadvertently accelerate marketplace decline by shifting resources away from it. The marketplace team needs investment in their channels too — eBay listing quality, Amazon A+ content, and Amazon review acquisition should continue in parallel with DTC launch. A healthy marketplace base funds the DTC ramp. The goal is to grow total company revenue, not just shift it.

### Risk 6: Uniform Pricing Leaves Money on the Table [DTC]

**Probability: High.** All 1,330 products are priced within a 34.0%–36.8% margin band — indicating formula-based pricing rather than market-driven pricing. High-demand products (tonneau covers for F150, Silverado) likely have price elasticity that would support 5–15% higher MSRP without volume impact. Conversely, slow-moving products may need price cuts to drive velocity.

**Mitigation:** Run A/B price tests on the top 20 advertised products starting Month 2. Test 5–10% price increases on tonneau covers and grilles where competitors charge more. Use the `data/analytics/10_shopify_margin_corrected.csv` file to identify products with the lowest margin (34%) where price increases have the most impact on profitability. Even a 3% average price increase across the catalog lifts net margin from 35.1% to ~38% — which lowers breakeven ROAS from 2.86x to 2.63x.

### Leading Indicators by Month 2–3

**On-Track Signals (by end of May):**
- Site CVR >= 1.0% and trending upward
- Google Shopping ROAS >= 3.5x (above the 2.86x breakeven floor)
- Meta ROAS >= 2.86x on prospecting (breakeven floor)
- Email open rates >= 25% across campaigns
- Monthly DTC revenue >= $75,000
- AOV >= $150
- Email list growing 500+ subscribers/week from on-site capture
- Return rate holding at or below 5%

**Off-Track Signals (triggering Plan B):**
- CVR stuck below 0.5% after 45 days
- Blended ROAS below 2.86x after $40K+ in spend
- Email deliverability issues (open rates <15%, rising spam complaints)
- CAC above $120 with no improvement trend
- Cart abandonment rate above 80%

### Plan B if Paid ROAS Underperforms

If paid channels deliver below 2.86x ROAS after 60 days of optimization:

1. Reduce paid spend by 50%, focusing remaining budget exclusively on Google Shopping and Meta retargeting. Pause all prospecting.
2. Double down on email — the Champions list at $425 average LTV represents $15.6M in proven lifetime value. Converting 2% of Champions to DTC buyers at $150 AOV yields $110K.
3. Launch marketplace-to-DTC migration: include packaging inserts in every Amazon/eBay order directing customers to stehlenauto.com with a 10% DTC-exclusive code. At $8M/year marketplace revenue and 1% migration rate = $80K incremental DTC.
4. Accelerate B2B — if DTC acquisition costs are unsustainable, B2B wholesale to installers operates at near-zero acquisition cost once accounts are established.
5. Invest in SEO/content — auto parts has strong organic search potential. Fitment-specific landing pages ("2019–2024 Ford F-150 Accessories") target long-tail queries. This is a 3–6 month payoff but compounds indefinitely.

---

## SECTION 10: Walmart Channel — Relaunch or Kill Decision [MARKETPLACE]

This decision belongs in this plan because Walmart represents an either/or resource allocation choice.

**Current state:** 15 orders in 16 months on Walmart Marketplace. $3,400 in total revenue over 16 months. This is effectively zero.

**Option A — Relaunch:** Invest 2–4 weeks of the marketplace team's time into optimizing Walmart listings, ensuring product titles and images meet Walmart standards, and enrolling in Walmart Fulfillment Services (WFS) for the "2-day" badge. Walmart's auto parts category has less competition than Amazon — there may be real opportunity here. This is a 90-day test with clear KPI gates: $10K/month by Month 3 or deprioritize.

**Option B — Kill:** Redirect the time and attention to growing the Amazon channel, reducing its decline rate, and supporting the DTC launch. Walmart resources stop immediately.

**Recommendation:** Option A, as a low-resource 90-day test, is worth attempting given how early Walmart Marketplace still is in auto parts. But do not invest more than 2 weeks of setup time without seeing first traction signals.

---

## Appendix A: The Bottom Line on Revenue Targets

**Base Case: $1.23M DTC Year 1.** This requires median performance across all channels, site CVR reaching 1.5% by Month 3, and B2B on a standard ramp. Total company revenue: $8M marketplace + $1.23M DTC = $9.23M.

**Bull Case: $1.7M–$2.0M DTC Year 1.** This requires: site CVR hitting 1.8%+ by Month 3, Google Shopping ROAS averaging 4.5x+ from Month 4 onward, email contribution reaching 28–30%, and B2B ramping to 25+ accounts by Q4. Achievable given the brand's existing assets (321K segmented contacts, 10-year transaction history, proven products with real demand data) but requires flawless execution on every front.

**The Three Biggest Levers:**
1. Fix the site before spending a dollar on ads (CVR determines everything downstream)
2. Test price increases on high-demand products (35% uniform margin means money left on the table — even 3% avg increase drops breakeven ROAS from 2.86x to 2.63x)
3. Lead with tonneau covers and grilles, not headlights (47% margin + <5% return rate vs. 37% margin + 10–15% return rate — this single product mix decision is worth $200K+ in Year 1)

---

## Appendix B: Data Sources

All figures in this document derive from the following primary sources:

| Source | Data Type | Date Range | File Location |
|--------|-----------|------------|---------------|
| ConnectedBusiness ERP (vJLCInvoice) | Revenue, COGS, margin, inventory, orders | 2020–2026 | CB database — see `scripts/cb_datamart_analysis.py` |
| ChannelAdvisor API | Channel revenue, orders, AOV by marketplace | Nov 2024 – Mar 2026 | `data/analytics/ca_sales_combined_*.json` |
| CB ERP (shopify.vInventoryItem) | Per-SKU MSRP, COGS, shipping, net margin | Current | `data/analytics/10_shopify_margin_corrected.csv` |
| CB Credit Memo Data | Returns and refunds by category | Last 2 years | `data/analytics/04_returns_by_category_*.csv`, `05_return_rate_by_product_*.csv` |
| CB Inventory Analysis | Days of supply, overstock | Current | `data/analytics/08_inventory_health_days_of_supply_*.csv` |
| CB Customer Analysis | RFM segmentation, LTV, geographic revenue | 2020–2026 | `data/analytics/09_top50_customers_by_revenue_*.csv` |
| Zendesk | CS tickets, defect categories, fitment failures | 2021–2026 | `data/analytics/zendesk_cs_analysis.json` |
| Google Analytics 4 | Site traffic, CVR, funnel events | Active | GA4 Property ID: 529120634 — see `marketing/analytics/ga4_*.py` |
| Comprehensive Analysis Report | All of the above, synthesized | March 23, 2026 | `data/analytics/comprehensive_sales_analysis_report.md` |
| Original GTM Strategy | Tactical framework (corrected in this document) | March 2026 | `marketing/plan/claude_ai_gtm_strategy.md` |

---

## Appendix C: Immediate Action Checklist — Week of March 23

These must be completed in order. Do not start paid advertising until P0 items are done.

**P0 — Complete Before Any Advertising (March 23–24):**
- [ ] Verify all product margins using `data/analytics/10_shopify_margin_corrected.csv` (confirmed: 0 below-cost products)
- [ ] Delist `th-x507-c077-901` (82% return rate) from all channels
- [ ] Delist `TBM-TIT16B-6.5-RB-V2` (50% return rate) from all channels
- [ ] Investigate Zendesk tickets #519232 and #519373 (fake tracking — Amazon suspension risk)
- [ ] Assign owner to resolve 524 stuck Zendesk tickets (eBay seller defect accumulation)

**P1 — Complete Before Tax Season Peak (March 25 – April 7):**
- [ ] Configure Klaviyo sending domain (mail.stehlenauto.com) with SPF/DKIM/DMARC
- [ ] Import Champions segment (36,739 contacts) with RFM properties
- [ ] Build and launch Welcome Series flow (4–5 emails)
- [ ] Build and launch Abandoned Cart flow (3 emails — 15% off at Email 3 only)
- [ ] Fix all site triage items from Day 2 checklist
- [ ] Deploy email capture popup (10% off first order)
- [ ] Set up Google Merchant Center and Shopping feed with corrected product titles
- [ ] Build 5 Shopping campaigns with proper exclusion lists
- [ ] Verify Shopping feed excludes all 328 products on `products_exclude_list.csv`
- [ ] Install Meta Pixel + CAPI on Lovable frontend
- [ ] Upload Champions to Meta as Value-Based Custom Audience
- [ ] Create 1%, 2%, 5% Lookalike Audiences
- [ ] Geo-target TX, CA, FL for all initial campaigns
- [ ] Begin direct outreach to 139 VIP B2B accounts
- [ ] Audit all `-901` suffix SKUs — fix or delist each

**P2 — Complete by End of Month 1 (by April 23):**
- [ ] Build B2B "Become a Dealer" page on stehlenauto.com
- [ ] Set up wholesale pricing tiers in Shopify
- [ ] Build Post-Purchase flow (5 emails including Day 2 fitment verification)
- [ ] Build Browse Abandonment flow
- [ ] CS team training on fitment failure cross-sell protocol
- [ ] Build Klaviyo Fitment Failure Cross-Sell flow
- [ ] Create dead stock clearance collection on stehlenauto.com
- [ ] Submit overstocked inventory to Amazon Outlet
- [ ] Begin eBay auction lots for dead stock
- [ ] Begin YouTube creative production for Month 3 launch
- [ ] Introduce SMS opt-in as second step in email capture popup

---

*Document: `marketing/plan/02_data_driven_gtm_strategy.md`*
*Supersedes: `marketing/plan/claude_ai_gtm_strategy.md`*
*Next revision trigger: when April 2026 performance data is available (approximately May 1, 2026)*
