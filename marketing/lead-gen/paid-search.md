# Paid Search — Google Shopping + Google Search
## Net-New Customer Acquisition via Google

**Priority rank:** 1 of 9 (highest ROI, fastest to revenue, proven in auto parts)
**Owner:** Marketing (campaign setup) + Engineering (feed quality)
**Budget range:** $3,000-$18,500/mo depending on tier
**Expected CAC:** $45-$75 (Shopping), $35-$65 (Search)
**Time to first conversion:** 3-7 days after feed approval

---

## The Play

Google Shopping is the single highest-ROAS channel in aftermarket auto parts.
Industry median: 3.91x ROAS on Standard Shopping at $0.56 average CPC (AdBacklog
2025 data, auto parts vertical). At Stehlen's 35.1% net margin, breakeven ROAS
is 2.86x — meaning the median auto parts Shopping campaign is profitable from
month 1.

The mechanism: truck owners searching "2021 F-150 soft tonneau cover" or "2019
Ram 1500 grille guard" are buyers, not browsers. Google Shopping puts Stehlen's
product image, price, and title directly in front of that intent. No brand
awareness required.

The gap right now: Stehlen's product titles are in SKU format
("Stehlen 642167822356 Front Grill"). Google's algorithm cannot match that to
"2018 Chevy Silverado grille." The feed rewrite is the unlock — it precedes every
dollar of paid spend.

### Why this fits Stehlen specifically

- 1,381 indexed SKUs across 12 categories = natural Shopping catalog depth
- 35.1% margin supports profitable bidding before ROAS optimizes
- CB historical data shows top 6 vehicle makes = $69M in proven demand
  (Ford, Chevy, Dodge, Ram, Toyota, GMC) — those are the exact Shopping
  audience segments we build around
- Fitment data in the feed (year/make/model) is a native Shopping feature
  that competitors on Amazon don't get — we own the intent match

---

## Concrete Setup Steps

### Step 1: Feed Rewrite (do before spending $1)

Current title format: "Stehlen 642167822356 Front Grill Black"
Required format: "[Year Range] [Make] [Model] Stehlen [Category] — [Key Attribute]"
Example: "2014-2018 Chevy Silverado 1500 Stehlen Mesh Front Grille — Matte Black"

**How to batch this:**
1. Export Shopify product CSV (Products > Export in Shopify admin)
2. Run Claude (Sonnet via AI Gateway) on each title row with this prompt:
   "Rewrite this auto parts product title for Google Shopping. Current title:
   [TITLE]. Fitment tags: [TAGS]. Output format: [Year Range] [Make] [Model]
   Stehlen [Category] — [Key Attribute]. Keep under 150 characters."
3. Import updated CSV back to Shopify
4. The Shopify Google channel auto-syncs the feed within 24 hours

**Priority order for rewrite:** Top 200 SKUs by historical CB revenue first.
These are the products that will generate 80% of Shopping revenue. Remaining
1,100+ can be batch-processed over 2 weeks.

**Fitment data in feed:** Google Shopping supports the Vehicle Compatibility
(automotive) feed attribute. Submit year, make, model, trim as structured data
alongside each product. This enables Google to match "2019 Ram 1500 grille" to
the correct product without relying on keyword stuffing in the title.

### Step 2: Return Rate Exclusion List

Products with >8% return rate destroy paid campaign profitability. At 35% margin
and 8% returns, effective margin drops to ~27% and breakeven ROAS rises to 3.7x.
At 15% returns (like `HLPLNB-RAM06FLED-AB`), effective margin goes negative.

Hard exclusions from Shopping feed (apply via custom label 4 = "exclude"):
- All -901 suffix SKUs
- All Window Visor SKUs (20% return rate)
- `HLPLNB-TUN07FLED-AB` (14.3% return rate)
- `HLPLNB-RAM06FLED-AB` (15.2% return rate)
- `TBM-TIT16B-6.5-RB-V2` (50% return rate)
- `th-x507-c077-901` (82% return rate — delist entirely)
- Any zero-inventory SKU

**Custom label structure (add to Shopify supplemental feed):**
- Label 0: Margin tier — "high" (exterior 47%), "medium" (off-road 45%),
  "low" (lighting 37%)
- Label 1: Vehicle make — "ford", "chevy", "dodge", "ram", "toyota", "gmc"
- Label 2: Category — "tonneau", "grille", "bumper", "hitch", "lightbar", etc.
- Label 3: Price bracket — "under-100", "100-250", "250-500", "500-plus"
- Label 4: Return flag — "safe" (<5%), "caution" (5-8%), "exclude" (>8%)

Use DataFeedWatch or Channable ($50-$150/mo) to manage supplemental feed
on top of Shopify's native Google channel. Native channel is adequate for
launch; supplemental tool enables custom labels, title optimization, and
inventory-based campaign pausing.

### Step 3: Campaign Architecture

**Campaign 1: Tonneau Covers (Priority 1 SKUs)**
Budget: $40/day launch
Products: All tonneau cover SKUs with return rate < 5%
Hero SKUs: TC-F15015-5.5-LTH ($955K CB revenue, 4.8% return rate),
TC-SIL19-5.8-LTH ($633K CB revenue, 3.4% return rate)
Bid strategy: Maximize Clicks with $1.20 max CPC (weeks 1-4)
Custom label filter: category = "tonneau" AND return-flag != "exclude"
Expected ROAS: 3.0-4.5x by month 2

**Campaign 2: Grilles and Body Kits (Priority 2 SKUs)**
Budget: $30/day launch
Products: Grilles, mesh grilles, body kits — return rate < 8%
Bid strategy: Maximize Clicks with $1.00 max CPC
Note: FG-RAM94-ME-BK (2.7% return rate, $341K CB revenue) = hero SKU here
Expected ROAS: 2.5-4.0x

**Campaign 3: Bumpers, Bull Bars, Guards (Priority 3 SKUs)**
Budget: $25/day launch
Products: Bull bars, grille guards, front/rear bumpers
Bid strategy: Maximize Clicks with $1.00 max CPC
Strong before/after visual in Shopping images drives CTR

**Campaign 4: Hitches and Towing (Priority 4 SKUs)**
Budget: $15/day launch
Products: Trailer hitches, tow hooks, hitch covers
Note: utility-purchase, high intent, lower AOV ($49-$252)
Expected ROAS: 3.0-5.0x (intent is explicit, decision cycle short)

**Campaign 5: Lighting — RESTRICTED**
Budget: $10/day (below standard — LED headlight defect risk)
Products: Tail lights + light bars ONLY. No headlights.
Do NOT advertise: `HLPLNB-TUN07FLED-AB`, `HLPLNB-RAM06FLED-AB`, or
any headlight SKU until supplier moisture-ingress defect is resolved.
Expected ROAS: 2.0-3.0x (lower margin category, higher return risk)

**Bidding progression (all campaigns):**

| Phase | Timeline | Strategy | Trigger to Advance |
|-------|----------|----------|--------------------|
| Launch | Weeks 1-4 | Maximize Clicks, manual CPC cap | Gather 50+ conversions |
| Learning | Weeks 5-8 | Maximize Conversion Value (no tROAS) | Let algorithm optimize |
| Optimization | Months 3-6 | tROAS at trailing 30-day actual ROAS | 50+ conversions/campaign |
| Scale | Months 6-12 | tROAS +20% incremental increases | Push toward 5x ROAS |

Never set a tROAS target before 50 conversions. On a new account, aspirational
tROAS starves the algorithm and produces erratic results.

### Step 4: Google Search Campaigns

Run alongside Shopping from day 1. Allocate 15-20% of total Google budget here.

**Campaign S1: Brand Defense**
Budget: $10/day ($300/mo)
Keywords: [stehlen auto], [stehlenauto], [stehlen grille], [stehlen tonneau]
Bid: $0.30-$0.50 (low competition on own brand)
This is non-negotiable. Competitors are bidding on branded terms right now.

**Campaign S2: Part Number Exact Match**
Budget: $15/day ($450/mo)
Keywords: Exact match on top 50 MPNs and CB item numbers
Example: [TC-F15015-5.5-LTH], [FG-RAM94-ME-BK]
Part number searchers convert at 8-12% — highest intent in e-commerce.

**Campaign S3: Fitment-Intent Long-Tail**
Budget: $25/day ($750/mo) — launch in week 2 once Shopping is live
Keywords: "[Year] [Make] [Model] [Category]" combinations
Priority list (built from top CB historical order YMM combinations):
- "2021 ford f-150 tonneau cover 5.5 bed"
- "2019 ram 1500 mesh grille"
- "2020 chevy silverado 1500 bull bar"
- "2022 toyota tundra grille guard"
- "2018 gmc sierra running boards"
- Build 100+ variants from top 25 YMM combinations in CB data
Match type: Phrase match for discovery, then exact match on proven converters
Bid: $0.75-$1.50 (competitive, high intent)
Expected CVR: 3.5-6% (these are buyers, not browsers)

**Campaign S4: Competitor Conquest (Month 2+)**
Budget: $15/day — start after brand history established
Keywords: Branded competitor + product type
Examples: "tyger auto f150 tonneau cover", "rough country ram grille guard"
Ad copy: "Better fitment. Direct from manufacturer. Ships in 1-3 days."
Note: do not mention competitor by name in ad copy (Google policy risk).
Bid: $1.00-$1.75 (competitive impression share is the goal)

### Step 5: Geographic Bid Modifiers

Apply from campaign launch. Based on CB historical revenue distribution:

| State | CB Revenue Share | Google Bid Modifier | Meta Budget Share |
|-------|-----------------|--------------------|--------------------|
| California | 11.9% | +25% | 20% |
| Texas | 10.4% | +20% | 18% |
| Florida | 8.2% | +15% | 12% |
| New York | 3.9% | +5% | 5% |
| Pennsylvania | 3.8% | +5% | 5% |
| All other | 66.8% | 0% | 40% |

CA + TX alone = 22.3% of historical revenue. These states receive
disproportionate early budget. By month 3, refine to DMA level once
GA4 shows conversion geography data.

### Step 6: Negative Keywords (Launch List)

Add before first spend goes live. Missing these burns 15-25% of early budget
on irrelevant queries.

Categories to exclude: "used", "junkyard", "OEM replacement", "salvage",
"free shipping" (if not offering it), "cheap", "discount" (unless actively
discounting), "recall", "warranty claim"

Vehicle makes not in catalog: Any make where Stehlen has <10 SKUs
Model years outside catalog range: Any year before 2004

---

## AI Tooling in This Channel

| Job | Tool | How |
|-----|------|-----|
| Product title rewrites | Claude Sonnet via AI Gateway | Batch CSV processing, 50 titles/prompt |
| Search term analysis | Claude | Feed search term report weekly, get negative keyword recommendations |
| Ad copy variants | Claude | 3 headline variants + 2 descriptions per ad group |
| Return rate monitoring | Custom script (Python, CB data) | Monthly pull, auto-updates exclusion list |
| Feed management | DataFeedWatch or Channable | Custom labels, title optimization, inventory rules |

---

## Budget and Expected Output

**Launch (Lean — $3,000/mo):**
- Shopping: $2,250 ($75/day)
- Search: $750 ($25/day)
- Expected sessions: 5,000-8,000/mo
- Expected orders: 90-200/mo at 1.8-2.5% CVR
- Expected ROAS month 1: 2.5-3.0x
- Expected ROAS month 3: 3.5-4.5x

**Scale (Moderate — $10,000/mo):**
- Shopping: $7,500
- Search: $2,500
- Expected sessions: 18,000-25,000/mo
- Expected orders: 320-625/mo
- Expected ROAS: 4.0-5.0x

**Peak season (Aggressive — $18,500/mo, March-May):**
- Shopping: $14,000
- Search: $4,500
- Expected orders: 600-1,100/mo
- Expected ROAS: 4.5-5.5x (seasonal demand lifts conversion rate)

---

## KPIs

- Primary: Google Shopping ROAS (target 3.5x by month 2, 4.5x by month 4)
- Primary: CAC from paid search ($45-$75 target)
- Primary: Search impression share on top 25 YMM fitment terms (target >50%)
- Guardrail: Fitment-related return rate on paid-sourced orders (<5%)
- Guardrail: Shopping feed disapproval rate (<5% of SKUs)
- Guardrail: ROAS floor — pause any campaign below 2.86x for 14 consecutive days

**Weekly reporting:** Google Ads dashboard; ROAS + impressions + conversions
by campaign. Pull search term report weekly for negative keywords.
**Monthly:** CAC reconciliation against Shopify orders by UTM source/medium.

---

## Implementation Handoff

Engineering needs:
- Shopify product CSV export (feed rewrite input) — 1 hour
- Supplemental feed webhook or DataFeedWatch API connection — 4 hours
- UTM parameter preservation through Shopify checkout — verify existing setup
- Conversion tracking (GA4 purchase event) confirmed firing — already built
  per Phase 4, verify with test order

Marketing-only:
- Feed rewrite for top 200 SKUs (Claude batch, 4-6 hours)
- Custom label taxonomy applied in DataFeedWatch
- Campaign creation in Google Ads (5 Shopping + 4 Search campaigns)
- Geographic bid modifiers
- Negative keyword list

---

## NEXT ACTION (This Week)

Export Shopify product CSV today. Run the top 50 SKUs (by CB revenue) through
Claude title rewrite. Import back to Shopify and verify Google channel sync.
This single task unblocks every dollar of paid acquisition. Nothing else starts
until the feed is right.

CTR + open-rate KPI risk: low. Conversion co-ownership: high (CVR depends on
site fitment UX, PDP content, and return rate). Revenue confidence: high (auto
parts Shopping ROAS is the most predictable paid channel in e-commerce at this
margin structure).
