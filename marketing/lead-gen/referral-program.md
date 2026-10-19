# Referral Program
## Turning Buyers into Acquirers

**Priority rank:** 9 of 9
**Owner:** Marketing (program design) + Engineering (Shopify integration)
**Budget range:** $200-$500/mo (referral reward cost = funded by referred orders)
**Expected CAC:** $20-$45 (low because referred buyers convert 3-5x the rate
  of cold traffic and referral reward is the only acquisition cost)
**Prerequisites:** Site must have 100+ existing DTC customers before a referral
  program has enough "referrers" to generate meaningful volume. Launch in month 3+.

---

## The Play

Referral programs work by inverting the acquisition cost model: instead of
paying an advertising platform to find buyers, you pay existing satisfied
buyers to find other buyers. The referred buyer converts at 3-5x the rate
of cold advertising traffic because the recommendation comes from a trusted
peer — which in truck culture (tight communities, peer validation matters)
is a significant trust multiplier.

The economics: at $20 referral reward to the referrer and $20 discount to
the referee (10% on a $200 order), the cost per acquired customer is $40.
Compare to: $65-$110 via Meta prospecting, $45-$75 via Google Shopping.
The referral CAC is 50-60% lower, the referred buyer's LTV is typically
18-25% higher than cold-acquired buyers (self-selected affinity), and the
referral program is self-funding (rewards only paid when a referred order ships).

Truck culture is community-driven — the best argument for referral is that
F-150 forum members, r/f150 participants, and Tacoma Facebook Group members
already share product recommendations constantly. A formal referral mechanism
just puts a transaction behind what they are already doing organically.

### Why Month 3, Not Month 1

You need a base of happy customers to refer before the program generates
volume. At launch, you have zero DTC customers. At month 2-3, you have
100-300 DTC customers from Google Shopping + insert card conversion + the
Brevo Champions sequence. That is the minimum viable base to seed a
referral program. Launching it before you have customers is a waste of
engineering time.

---

## Program Design

### Structure: Double-Sided Reward

Both referrer and referee get something. One-sided rewards (referrer only)
reduce participation. Two-sided rewards create a "give a deal, get a deal"
social dynamic that is more natural to share.

| Party | Reward | Trigger |
|-------|--------|---------|
| Referrer (existing customer) | $20 store credit | When referee's first order ships |
| Referee (new customer) | 10% off first order | On signup via referral link |

**Why store credit over cash:**
- Store credit anchors the referrer to a future Stehlen purchase
  (LTV retention benefit, not just acquisition)
- Psychologically, "$20 off your next order" feels like more than "$20"
  because the buyer is already thinking about their next truck upgrade
- Store credit is cheaper than cash from a cash flow standpoint — it only
  "costs" when redeemed and is redeemed against an order that generates revenue

**Why 10% off for referee:**
- Consistent with Welcome Series popup offer (new customers already see 10% off)
- At 35.1% net margin, 10% discount leaves 25% margin — the referred order
  is still profitable at a $25 CAC equivalent

### Referral Share UX

**Referral link format:**
`stehlenauto.com?ref=[unique-code]`

When the referee visits via the link, they see a landing page variant with:
"[Referrer name] thinks you'd like this. 10% off your first order."

If garage cookie exists, personalize: "Your [Year Make Model] upgrades —
10% off, courtesy of [referrer name]."

**Share surfaces for referrers:**
1. Post-purchase confirmation page: "Love your new [product]? Share Stehlen
   with a friend and get $20 when they order." This is the highest-intent
   moment — customer is happy and excited about their purchase.
2. Post-purchase email (Day 7): "How's your [product] installed? Share your
   referral link and get $20 on your next order."
3. Account dashboard: permanent referral section in `/account` tab showing
   referral link, lifetime referral earnings, and pending credits.

### What to Not Do

**Do NOT launch a referral program before reviews are live.** A referred
buyer clicks through, arrives on a site with zero product reviews, and does
not purchase. The referrer loses the credit, feels let down, and does not
refer again. Reviews (targeting 50+ via Okendo/Junip by month 2) must precede
a referral program launch.

**Do NOT offer too-high rewards that attract gaming.** $50+ referral rewards
attract fake referrals from accounts trying to self-refer. $20 is enough to
motivate genuine referrers without attracting fraud.

**Do NOT require social sharing.** Referral programs that force a social post
feel pushy and reduce participation among buyers who prefer direct peer
recommendations. Make sharing optional (link copy, email, SMS) — the direct
referral via link to a friend converts better than a broadcast social post.

---

## Tool Options

### Option 1: Native Shopify (no app — basic)

Shopify's native discount code system can support a basic referral program:
- Generate unique discount codes per customer (requires Engineering scripting
  or manual setup)
- Track code usage in Shopify orders
- Issue store credit via Shopify gift cards

**Cost:** $0 additional
**Limitations:** No automatic tracking of referral chains, no self-service
  referral dashboard for customers, manual credit issuance

### Option 2: ReferralCandy or Smile.io (app — full featured)

Both integrate with Shopify and provide automatic link generation, credit
issuance, fraud detection, and analytics.

- ReferralCandy: $49/mo (paid plan) — auto-generates unique referral links,
  tracks attribution, issues store credit automatically, handles fraud detection
- Smile.io: $49/mo (starter) — referral + loyalty in one platform; the loyalty
  module overlaps with the future loyalty plan (see below)

**Recommendation:** Use Smile.io if you plan to add a loyalty program in months
6-12 (it bundles both in one app). Use ReferralCandy if referral is standalone.

**Headless compatibility note:** Both ReferralCandy and Smile.io inject via
Shopify theme on standard Shopify storefronts. On a headless Next.js build,
they require custom implementation via their JavaScript SDK or API. Engineering
effort: 8-16 hours to integrate the widget and referral link generation.

### Option 3: Build on Drizzle/Neon (custom — most control)

The Neon Postgres database (already in stack) can store a referral_codes table.
Engineering builds the referral link generation, attribution tracking, and
credit issuance natively.

**Cost:** $0 additional tool cost (Neon already paid)
**Engineering effort:** 16-24 hours
**Advantage:** Full control of data, no third-party dependency, custom
  logic for truck-owner-specific use cases (e.g., referral bonus for referring
  to a shop owner = higher credit)

**Recommendation for month 3:** Start with Smile.io ($49/mo) to get the
program live quickly without custom engineering. Revisit the native build
at month 6-9 if the program is generating significant volume and Smile.io's
limitations become constraining.

---

## Segmentation: Not All Referrers Are Equal

Not all customers are equally likely to refer. Build the referral launch
outreach targeting the highest-propensity referrers:

**Highest propensity:**
- Customers who have made 2+ purchases (proven repeat buyers = satisfied)
- Customers who submitted a review with 4-5 stars
- Customers who shared on social or tagged @stehlenauto (if that data exists)
- B2B installer accounts who can refer other shops (higher referral value)

**Initial launch email (to post-month-2 DTC customer base):**
```
Subject: "Get $20 for your next truck upgrade — share Stehlen with a friend"

You've upgraded your [vehicle]. If you know another truck owner who'd
appreciate the same, share your link — they get 10% off, you get $20
when their order ships.

No tricks. No minimum. Just genuine word of mouth.

[Your referral link]
```

**B2B installer variant:**
```
Subject: "Earn $50 per shop you send our way"

For installer accounts: if you refer another shop to our dealer program
and they place a first order of $500+, you get $50 store credit toward
your next wholesale order.

[Dealer referral link]
```

The B2B referral variant ($50 credit for referring another shop) is a separate
mechanic from the consumer referral. Installer shops talk to each other —
a shop in LA knowing a shop in San Diego they can send our way is a real
B2B acquisition channel at near-zero cost.

---

## Budget and Expected Output

**Month 3 launch ($200/mo tool + rewards):**
- Smile.io: $49/mo
- Expected referral orders month 3: 3-8 (small base at launch)
- Expected reward cost: $60-$160 (3-8 referrers x $20 credit)
- Expected CAC from referral: $25-$45

**Month 6 (program established — $300/mo):**
- 100-200 DTC customers = 30-60 active referrers (20-30% participation rate
  is industry average for well-designed referral programs)
- Expected referral orders: 15-35/mo
- Reward cost: $300-$700 (offset by referred order revenue)
- CAC: $20-$40

**Month 12 (mature — $500/mo):**
- 500+ DTC customers, 100+ referral participants
- Expected referral orders: 50-100/mo
- Referral as % of total DTC orders: 5-10%
- Self-funding: referral order revenue exceeds reward cost by 3-5x

---

## KPIs

- Primary: Referral participation rate (target 20-30% of DTC customer base)
- Primary: Referred order conversion rate (target 3-5x cold traffic CVR)
- Primary: CAC from referral channel (target $20-$45)
- Secondary: Referral-attributed LTV premium vs. cold-acquired buyers
  (track 6-month retention of referred vs. non-referred first-time buyers)
- Guardrail: Fraud rate — any referral account generating >3 referrals in 30 days
  should be reviewed. Self-referral patterns (same IP, same device, similar names)
  trigger auto-flagging in Smile.io or can be caught via Shopify order review.

---

## Implementation Handoff

Engineering needs:
- Smile.io JavaScript SDK integration into Next.js storefront
  (customer-facing referral widget in account dashboard)
- Referral link attribution: ensure ref= parameter persists through Shopify
  checkout and is captured in order metadata
- Account page: referral section showing link, sharing options, pending credits

Marketing-only:
- Smile.io account setup and program configuration
- Launch email to post-month-2 DTC customer base
- Klaviyo: post-purchase email Day 7 with referral CTA (add to existing
  post-purchase flow as email 5)

---

## NEXT ACTION (Month 3 Trigger)

When DTC customer base reaches 100 orders, set up Smile.io and send the
launch email to all customers who have purchased and left a 4+ star review.
This is the highest-propensity referral cohort and the safest launch base
(satisfied customers who are unlikely to refer badly). Do not launch referral
until reviews exist — referred buyers who arrive on a zero-review site do not
convert, and the referral program wastes its seed cohort.

CTR + open-rate KPI risk: medium (launch email CTR determines initial program
adoption). Conversion co-ownership: high (referred buyer conversion depends on
site experience, reviews, fitment UX). Revenue confidence: medium (referral
volume is small at launch but compounds significantly at month 6+ — the long-
term channel economics are excellent if the base is built first).
