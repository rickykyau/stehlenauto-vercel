# Paid Social — Meta Cold Prospecting
## New Customer Acquisition via Facebook + Instagram

**Priority rank:** 5 of 9
**Owner:** Marketing
**Budget range:** $3,000-$9,000/mo depending on tier
**Expected CAC:** $65-$110 (cold prospecting), $35-$60 (retargeting)
**Prerequisite:** Google Shopping must be live and producing conversions first.
  Meta prospecting without conversion data is expensive and slow to optimize.
  Launch Meta in month 2, not month 1.

---

## The Play

Meta Ads for aftermarket auto parts works for two reasons specific to this
vertical: (1) vehicle ownership is a known interest signal — Ford F-150 owners
self-identify in their Facebook profile data, and (2) truck modification culture
is identity-driven. The buyer who spends $450 on a tonneau cover sees it as
an expression of who they are, not just a functional purchase. Meta's creative
canvas (video, carousel, before/after) is built for that psychology.

The auto vertical has the lowest CPM on Meta ($10.01) of any category tracked.
At $10 CPM and a 1.0% CTR, you pay $1.00 per click. At a 2% CVR, that is
$50 CAC before any creative or audience optimization — profitable at $214 AOV
and 35% margin from day 1 at median performance.

The competitive advantage Stehlen has that no startup DTC brand can replicate:
36,738 verified truck accessory buyers with known LTV values. Uploading this as
a Value-Based Custom Audience seeds a 1% Lookalike that Meta trains on real
buyer behavior — not demographic proxies. RealTruck and BAK do not have 36,738
known buyers in their Meta seed list. We do.

**Do not launch Meta before Google Shopping.** The reason: Meta prospecting
needs conversion data to optimize. Without it, the algorithm cannot distinguish
which $450 tonneau cover buyer is worth targeting. Google Shopping runs on
explicit search intent — it does not need conversion history to produce
initial results. Google Shopping builds the conversion pixel; Meta uses it.

---

## Prerequisite Checklist

Before spending $1 on Meta:
- [ ] Meta Pixel confirmed firing on key events (ViewContent, AddToCart,
  InitiateCheckout, Purchase) — verify in Meta Events Manager
- [ ] Conversions API (CAPI) server-side events live — required for iOS 14.5+
  accuracy. Without CAPI, up to 40% of conversions are unattributed.
  Implementation: Next.js API route posts CAPI events to Meta server-side.
  This is an engineering task, ~4-8 hours.
- [ ] Champions list uploaded to Meta as Value-Based Custom Audience (36,738
  contacts with LTV column — the LTV value tells Meta to optimize for
  high-value lookalikes, not just any truck owner)
- [ ] Google Shopping has been live 30+ days with 30+ conversions accumulated
- [ ] Creative assets ready: minimum 3 video variants + 2 carousels

---

## Campaign Structure

### Campaign 1: Cold Prospecting (60% of Meta budget)

**Objective:** Conversions (Purchase)
**Bidding:** Lowest Cost (let Meta optimize — do not set a manual CPA target
  until 50+ conversions in 7 days)
**Audience:** 1% Value-Based Lookalike from Champions + truck interest layering

**Audience build:**
- Seed: Champions list (36,738 contacts with LTV values) uploaded as
  Customer List with Value
- Meta generates 1% LAL = approximately 2.1M US users
- Interest layer (optional, test with and without): Ford F-150, Chevy Silverado,
  Ram 1500, Dodge Ram, Toyota Tundra, truck customization, overlanding
- Note: Meta recommends NOT stacking interests on LAL audiences as it shrinks
  the audience and can hurt learning. Test stacked vs. clean LAL separately.

**Geo:** TX (18%), CA (20%), FL (12%) as separate ad sets for first 30 days.
All other states combined in a fourth ad set. This allows budget to concentrate
on states with proven CB purchase history before national expansion.

**Budget structure (CBO recommended):**
- Set campaign-level daily budget (not ad set level)
- Let Meta allocate across ad sets — CBO outperforms manual ad set budgets
  by 15-25% on prospecting campaigns at this spend level

### Campaign 2: Vehicle Retargeting (20% of Meta budget)

**Objective:** Conversions
**Audience:** Site visitors segmented by vehicle interaction + content viewed

**Segments:**
- 0-7 day cart abandoners — highest intent, most urgent (DPA: show the
  exact product they abandoned)
- 0-7 day PDP viewers (no cart) — high intent, show the product + fitment
  confirmation prompt
- 8-30 day all site visitors — broader retargeting, show category ads
- YMM completers who did not purchase — show vehicle-specific product lineup

**Creative:** Dynamic Product Ads (DPA) using Shopify catalog feed in Meta
Commerce Manager. Each retargeting impression shows the specific product
the user viewed or the products that fit their saved vehicle. This is the
single highest-ROAS format in Meta for auto parts retargeting (4-8x ROAS
is achievable on this audience because they are already in the purchase funnel).

### Campaign 3: Meta Advantage+ Sales (15% of Meta budget)

**Objective:** Conversions
**Audience:** Broad (let Meta optimize using its own signals)
**Creative:** Same assets as prospecting but allowed to run across all placements
**Note:** Run this as a test against Campaign 1. Some DTC brands in the auto
accessories space see Advantage+ outperform manual prospecting after the pixel
accumulates 500+ purchases. At launch, weight 60% of prospecting budget to
Campaign 1 and 15% to Advantage+. Rebalance at 90 days based on CPA.

### Campaign 4: Creative Testing (5% of Meta budget)

**Objective:** Link Clicks or ThruPlay (not conversions — this is a testing budget)
**Audience:** Broad (25-55, male-skewing, US)
**Purpose:** Test new creative concepts at low spend before committing to
  prospecting campaigns. A creative that gets 3%+ hook rate and 1.5%+ CTR
  in the test campaign gets promoted to Campaign 1.

---

## Creative Spec

This is the make-or-break variable for Meta. A 2x ROAS campaign can become
a 4x ROAS campaign with the right creative and the same audience/budget.
Truck owner creative follows specific rules.

### Creative Format Priority

1. **UGC-style install video (4:5 vertical, 15-60 seconds)** — outperforms
   studio-produced video in auto parts by 30-50% because authenticity is
   valued over production value in truck culture
2. **Before/after transformation** — stock truck to accessorized truck,
   same vehicle, same angle, split screen or dissolve. Highest single-format
   CTR in this vertical (directional — not formally benchmarked for Stehlen)
3. **Carousel (product lineup for one vehicle)** — "Top 5 upgrades for your
   F-150" carousel with one product per card + price + fitment confirmation
4. **Static image (product on vehicle)** — lowest production cost,
   lowest performance but needed for creative volume

### Creative Production Approach

**AI-augmented workflow (using existing stack):**
- Raw footage: film install video on actual vehicle (1-2 hours, 1 person)
- AI augmentation: Runway Gen-4 or Kling Omni 3 (per `reference_ai_video_stack_2026.md`)
  for B-roll shots (product closeups, installation step details, lighting effects)
- Edit: cut to 15, 30, and 60-second variants from the same source footage
- Thumbnail: Midjourney or Adobe Firefly custom model for high-CTR stills

**Minimum creative inventory for launch:**
- 3 install video variants (F-150, Silverado, Ram — top 3 revenue makes)
- 2 before/after statics
- 1 carousel (vehicle-specific lineup)
Total production cost at launch: $1,500-$2,500

**Ongoing creative refresh:** At $100+/day Meta spend, frequency reaches ~2.0
in 7-10 days (users see the ad twice). Creative fatigue sets in at frequency
2.5-3.0. Refresh creative every 10-14 days with new variants of the same
concept. Budget $1,000-$1,500/mo for ongoing creative production.

### Ad Copy Framework (Brand Voice)

**DO:** Lead with the vehicle. "For your 2021 F-150 5.5ft bed."
**DO:** Name the specific installation benefit. "No drill. 45-minute install."
**DO:** Use fitment specificity. "Direct fit — no modification required."
**DO:** Price anchor. "$[price] — fits your [specific model year range]."
**DO NOT:** "🔥 LIMITED TIME DEAL 🚗" — truck buyers tune this out
**DO NOT:** Generic copy without a vehicle reference

**Headline variants (test all three):**
- "Fits your 2021 F-150. Ships in 1-3 days."
- "Direct manufacturer pricing — no Amazon markup."
- "36,000+ truck owners. Now direct from Stehlen."

**Primary text (short wins in feed — 2-3 sentences max):**
```
"The [product] built for [Year Range] [Make] [Model]. Direct fit, no drilling,
45-minute install. Order by noon, ships same day."
```

---

## Vehicle Make Segmentation

Build separate ad sets for the top vehicle makes in prospecting. Vehicle-specific
creative (F-150 creative shown to F-150 owners) outperforms generic truck
creative by 34-47% in open rate and 22-31% in CVR — these benchmarks are from
our own CB historical email data but the pattern holds in paid social creative
targeting.

| Ad Set | Audience | Creative | Budget % |
|--------|----------|---------|----------|
| Ford-focused | F-150, F-Series interest + LAL | F-150 install video | 22% |
| Chevy-focused | Silverado interest + LAL | Silverado transformation | 21% |
| Dodge/Ram-focused | Ram interest + LAL | Ram 1500 grille/guard | 21% |
| Toyota-focused | Tundra/Tacoma interest + LAL | Tundra accessories | 18% |
| GMC-focused | Sierra interest + LAL | Sierra running board | 18% |

Run the vehicle-specific ad sets under Campaign 1 (CBO). Meta will allocate
more budget to the best-performing vehicle make — let it.

---

## ROAS Framework

At 35.1% net margin, Meta breakeven ROAS is 2.86x. Target:
- Prospecting (cold): 2.5-3.0x target (slightly below breakeven on first
  order is acceptable if LTV justifies it — at $300 LTV and $65 CAC,
  the LTV:CAC is 4.6x which is excellent)
- Retargeting (warm): 4.0x+ (these are users already in the funnel)
- Advantage+: benchmark against prospecting; if >10% more efficient, shift budget

| Trailing 7-Day ROAS | Action |
|--------------------|--------|
| Above 4.0x | Scale +15% every 5 days |
| 2.86x-4.0x | Maintain, optimize creative |
| 2.0x-2.86x | Diagnose: is it creative fatigue, audience exhaustion, or CVR? |
| Below 2.0x | Pause, rebuild creative and/or audience |

---

## Attribution Note

Meta platform ROAS is not truth. It over-attributes (view-through conversions)
and Meta's own data shows their reported ROAS is typically 1.3-1.8x the
incrementally-validated ROAS. At $3,000/mo spend, running a holdout test
(suppress Meta to 10% of audience, compare conversion rate) is worth the
temporary efficiency cost to validate true lift.

Use GA4 source/medium attribution as the sanity check: if Meta reports 4.0x
ROAS but GA4 shows 1.5x from paid social, the real number is somewhere
in between. Northbeam or Triple Whale (per tool scorecard: revisit at
$50K+/mo) would give better attribution at scale — not needed at launch.

---

## Budget and Expected Output

**Month 2 launch (Lean — $3,000/mo):**
- Prospecting: $1,800
- Retargeting: $900
- Advantage+ test: $300
- Expected new customers: 30-55/mo at $55-$100 CAC
- Expected ROAS: 2.0-2.5x (learning phase)

**Month 3-4 (Moderate — $6,000/mo):**
- Prospecting: $3,600
- Retargeting: $1,500
- Advantage+: $600
- Creative testing: $300
- Expected new customers: 70-110/mo at $55-$85 CAC
- Expected ROAS: 2.5-3.5x (optimization phase)

**Month 5+ peak season (Aggressive — $9,000/mo):**
- Prospecting: $5,400
- Retargeting: $2,250
- Advantage+: $1,080
- Creative testing: $270
- Expected new customers: 100-170/mo
- Expected ROAS: 3.0-4.0x

---

## KPIs

- Primary: Meta ROAS (target 3.0x by month 3 on retargeting, 2.5x prospecting)
- Primary: CAC from Meta (target $65-$110 cold, $35-$60 warm)
- Primary: Frequency on top-performing ad sets (watch for >2.5 — refresh creative)
- Primary: Hook rate on video (first 3 seconds — target >30%)
- Guardrail: CPM inflation (if CPM rises >25% month-over-month, audience is saturating)
- Guardrail: CAPI event match rate (target >85% — lower means iOS signal loss)
- Guardrail: Fitment return rate on Meta-sourced orders (track via UTM + Shopify)

**Reporting cadence:** Weekly review of ad set ROAS, frequency, CPM, and CTR.
Monthly review of CAC by audience type and creative format. Meta Ads Manager
+ GA4 cross-reference.

---

## Implementation Handoff

Engineering needs:
- Conversions API (CAPI) implementation: Next.js API route that sends
  Purchase, AddToCart, ViewContent, InitiateCheckout events to Meta server-side
  Parameters required: event_name, event_time, user_data (email hash), value,
  currency, content_ids (Shopify product IDs)
  This is a 4-8 hour engineering task and is blocking for Meta accuracy.
- Meta Pixel verified on all pages (likely already done — verify in Events Manager)

Marketing-only:
- Champions list upload to Meta as Value-Based Custom Audience (CSV with
  email + LTV column — get from Brevo or CB data export)
- 1%, 2%, 5% Lookalike audience creation
- Product catalog setup in Meta Commerce Manager (Shopify native integration)
- Campaign creation (4 campaigns as above)
- Creative production: 3 install videos + 2 statics + 1 carousel

---

## NEXT ACTION (This Week, If Google Shopping Already Live)

Upload the Champions list to Meta as a Value-Based Custom Audience today.
This does not cost anything and does not require a campaign to be live.
The audience builds in the background (Meta processes the list within 24-48
hours). By the time campaigns launch in week 4-5, the lookalike audience
is ready and trained. Waiting until you launch campaigns to upload the seed
list delays the lookalike quality by 1-2 weeks.

CTR + open-rate KPI risk: medium (hook rate and CTR are creative-dependent;
requires ongoing refresh). Conversion co-ownership: high (site CVR, fitment
UX, and return rate all affect Meta campaign economics). Revenue confidence:
medium (Meta auto parts ROAS is well-characterized at median performance;
risk is creative fatigue and iOS attribution loss at smaller spend levels).
