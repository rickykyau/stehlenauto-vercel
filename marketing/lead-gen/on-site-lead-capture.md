# On-Site Lead Capture
## Converting Paid + Organic Traffic Into Email Leads Before They Leave

**Priority rank:** 4 of 9
**Owner:** Marketing (copy + flow config) + Engineering (component build)
**Budget range:** $0/mo additional (Klaviyo already in stack; Brevo already in stack)
**Expected CPL:** $0-$8 depending on traffic source
**Time to activation:** 3-5 days after engineering builds the popup component

---

## The Play

Every session that lands on stehlenauto.com from Google Shopping, organic
search, or a forum backlink and does not purchase is a lost lead. At a typical
1.5-2.5% CVR, 97-98.5% of sessions leave without buying. The email capture
rate determines what percentage of that 97% can be recovered for zero
incremental cost via Klaviyo flows.

Industry benchmark for auto parts email capture: 3-8% of sessions convert to
email subscriber via popup. At 10,000 monthly sessions and 5% capture rate,
that is 500 new leads/month. Welcome series converts 8-15% to first purchase.
That is 40-75 additional orders per month at near-zero CAC — from traffic
already being paid for.

This is not reactivation of the Champions list. These are brand-new prospects
who found the site via paid or organic channels. The capture mechanism is the
same (Klaviyo popup) but the list segment is separate: "New Web Leads" vs.
"Champions Reactivation."

---

## Capture Points

### Capture Point 1: Exit-Intent Email Popup (Highest Priority)

**Trigger:** User shows exit intent (cursor moves toward address bar or back
button on desktop; time-on-page > 45 seconds on mobile)

**Timing:** Do NOT fire on landing. Let the user browse for at least 45 seconds.
Firing on landing is the #1 popup mistake — it interrupts before any value is
delivered and generates a high "immediately closed" rate that trains the algorithm
to show it to wrong audiences.

**Offer:** "10% off your first order. Vehicle-specific deals straight to your
inbox." This offer is calibrated to the 35.1% margin: 10% discount leaves
25% margin, which supports a 4.0x breakeven ROAS on the welcome-series-converted
order. The 15% discount is reserved for abandoned cart email #3 only.

**Copy (brand voice — mechanic-practical, no emoji):**
```
Headline: "Before you go — 10% off your first order."
Subheadline: "Plus fitment alerts for your specific vehicle."
CTA button: "Get my discount"
Input: Email address
Secondary CTA (close): "No thanks"
Privacy note: "No spam. Unsubscribe any time."
```

**Post-capture:** Immediately fire the Klaviyo Welcome Series (see
`email-welcome-series-spec` below). Do not send a coupon code cold — deliver
it in email 1 of the Welcome Series so the sequence starts with a transactional
email (higher deliverability than promotional).

**Tool:** Klaviyo on-site form builder (already in stack, no additional cost).
Engineering builds the React wrapper that integrates with Klaviyo's embed code.

### Capture Point 2: YMM Selector Post-Completion

**Trigger:** User completes the Year/Make/Model selector (vehicle saved to garage)

**Timing:** Immediately after the YMM modal closes (500ms delay to let the
confirmation UX register)

**Offer:** "Get fitment alerts and exclusive deals for your [Year] [Make] [Model]."
This is vehicle-personalized lead capture — the highest-performing variant in
auto parts (directional benchmark: vehicle-aware email CTR is 34-47% higher
than generic in the auto category, per our own plans documentation).

**Copy:**
```
Headline: "We'll watch your fitment."
Subheadline: "New parts for your [2021 Ford F-150] — straight to your inbox."
CTA: "Yes, notify me"
Input: Email address
Close: "Skip"
```

**Why this converts better than the exit popup:** The user has already invested
intent by completing the YMM flow. They have told the site their vehicle. The
offer of vehicle-specific alerts is directly relevant to that just-completed
action. Relevance = higher capture rate.

**Expected capture rate:** 8-15% of YMM completions (compared to 3-6% for
generic exit popup). This is the highest-performing lead capture surface
in the funnel.

### Capture Point 3: Sticky Footer Bar (Desktop/Mobile)

**Trigger:** Scrolled 40% of any page
**Offer:** "10% off your first order — join 36,000+ truck owners."
  (The 36,000+ is drawn from the Champions list size — accurate claim)
**Format:** Single-line bar with email input + CTA button
**Expected capture rate:** 1-2% of sessions (lower than modal but persistent)

This runs in parallel with the popup, not instead of it. The footer bar
catches sessions where the exit-intent popup was closed without capturing.

### Capture Point 4: Post-Fitment Content Gates (Month 2+)

**Trigger:** User views a buying guide or install guide
**Format:** "Download the install checklist" or "Get the full fitment
  compatibility chart as a PDF" — gated behind email capture

**This works for two reasons:**
1. Intent is explicit (they are reading a buying guide = pre-purchase research)
2. The "content upgrade" format converts at 2-5x the rate of a generic popup
   because the offer is directly relevant to what the user is reading

**Example:** On the "Best Tonneau Covers for 2021 Ford F-150" buying guide,
add: "Download the full fitment chart — all bed length and cab type combinations
for 2019-2024 F-150. Email it to yourself." Capture rate on content upgrades
in this format: 10-25% of engaged readers (those who scroll past 60% of the
article).

Engineering needs: a reusable inline lead-capture component that accepts
email + fires Klaviyo identify event with a `lead_source` custom property
set to the content page slug.

---

## Welcome Series Spec (New Web Lead, Not Champions)

This is a distinct Klaviyo flow from the Champions reactivation sequence.
These are brand-new leads with no prior relationship.

**Flow: "New Lead Welcome — Web"**
Trigger: Email captured on site (not from import — only organic site captures)
Segment: New Web Leads (separate from Champions)

| Email | Timing | Subject | Content | Goal |
|-------|--------|---------|---------|------|
| 1 | Immediate | "Here's your 10% off code + what Stehlen is" | Coupon code DIRECT10 delivery + 2-sentence brand story ("Direct from manufacturer. Fits your vehicle or we fix it.") + top 3 hero products | Open rate target: 55%+ (this is a transactional email — delivers the promised coupon) |
| 2 | Day 2 | "What fits your [vehicle]" (if YMM known) or "Top picks for F-150, Silverado, and Ram" | Vehicle-personalized if garage data exists; generic by top make if not. 3 product recommendations. Fitment guarantee mention. | Click rate target: 8-12% |
| 3 | Day 5 | "How our products install — in 45 minutes" | Install confidence. Link to a YouTube install video. "No mechanic needed." | Addresses the #1 purchase objection in truck accessories: "is this a DIY install?" |
| 4 | Day 10 | "What other [Make] owners are upgrading" | Social proof. "36,000+ orders shipped." 1-2 review excerpts with vehicle attribution. Link to collection. | Conversion push. |
| 5 | Day 14 | "Your 10% off expires in 48 hours" | Urgency. Coupon expiration. Single CTA to the vehicle-specific collection. | Last conversion touch before lead enters standard replenishment/browse cadence. |

**Expected performance (Klaviyo welcome series benchmark for auto parts):**
- Revenue per recipient (RPR): $2.65-$3.34 (at $100-$200 AOV range)
- At 500 new leads/mo and $2.65 RPR: $1,325/mo from this flow alone
- At 1,500 new leads/mo (moderate traffic tier): $3,975/mo
- At 5,000 new leads/mo (aggressive traffic tier): $13,250/mo

These numbers compound: every month of new traffic adds a new cohort to the
sequence. By month 6, you have 6 cohorts simultaneously in various stages
of the welcome series.

---

## Klaviyo vs. Brevo Decision

**Current state:** Brevo holds the Champions list (36,738 contacts, all segmented).
The new Web Lead captures should go into Klaviyo (already wired to Shopify
for behavioral triggers — cart events, view-item events, YMM completions).

The two systems serve different jobs:
- **Brevo:** Champions reactivation (one-time reactivation + scheduled campaigns
  to the CB-sourced list). Stays in Brevo because the infrastructure is built
  and the list is there.
- **Klaviyo:** Net-new web leads + all behavioral flows (abandoned cart, browse
  abandonment, post-purchase, YMM-triggered). Klaviyo has native Shopify
  integration that Brevo lacks — it fires on cart events server-side without
  needing manual JS.

Do NOT import web leads into Brevo — that mixing of reactivation and net-new
creates segmentation confusion and deliverability risk.

---

## Fitment-Aware Personalization in Capture

The garage cookie (`stehlen_garage`) already persists the user's vehicle
from the YMM selector. The Klaviyo popup should read that cookie and personalize
the offer:

- If garage cookie exists: "Get fitment alerts for your [Year] [Make] [Model]."
- If no garage cookie: "Enter your email — we'll find what fits your vehicle."

Engineering implementation: the Klaviyo form embed accepts a hidden field.
Pass `garage_vehicle` as a custom Klaviyo property populated from the cookie.
Then in email 2 of the Welcome Series, the dynamic block reads that property
and shows vehicle-specific products.

This is the same pattern CarParts.com used for their fitment guarantee
conversion lift (+18% CVR). The mechanism: personalizing the email to
"Your 2021 F-150 — here's what fits" eliminates the fitment anxiety that
causes 17% of auto-parts cart abandonments.

---

## Tools

| Job | Tool | Cost |
|-----|------|------|
| Popup form builder | Klaviyo on-site forms | Already in stack |
| Welcome series flows | Klaviyo | Already in stack |
| Garage cookie read | Existing Next.js cookie logic | Engineering task |
| A/B test popup variants | Klaviyo built-in A/B | No cost |
| Lead source attribution | Klaviyo custom property + GA4 UTM | No cost |

---

## Budget and Expected Output

This channel has near-zero incremental cost — it runs on the existing Klaviyo
subscription and Engineering builds the React component once.

**One-time setup cost:**
- Engineering: React exit-intent popup + YMM post-capture form + inline
  content-upgrade component = ~8-12 hours
- Marketing: Welcome series copy + flow build in Klaviyo = ~4 hours

**Ongoing cost:** $0 (flows run automatically)

**Expected monthly output (at moderate traffic tier, 10,000 sessions/mo):**
- Exit popup: 5% capture = 500 new leads/mo
- YMM post-completion: 12% of YMM completions (est. 300 completions/mo) = 36 leads
- Sticky footer: 1.5% = 150 leads
- Total: ~686 new leads/mo
- Welcome series @ $2.65 RPR = $1,817/mo from welcome flow alone

**Expected at aggressive traffic tier (30,000 sessions/mo):**
- Total leads: ~2,000/mo
- Welcome flow revenue: ~$5,300/mo
- Blended CPL: effectively $0 (traffic cost is paid by Shopping/Meta)

---

## KPIs

- Primary: Email capture rate by surface (popup target 4-6%, YMM target 10-14%)
- Primary: Welcome series open rate email 1 (target 50%+), email 2 (target 30%+)
- Primary: Welcome series RPR (target $2.65+)
- Primary: Lead-to-first-order rate within 30 days (target 8-12%)
- Guardrail: Klaviyo deliverability — web lead list must be separate from
  Champions; domain warm-up risks from Champions list must not contaminate
  web lead sending reputation
- Guardrail: GDPR/CAN-SPAM compliance — all captures include unsubscribe notice;
  Texas SB 140 compliance for SMS (if SMS is added later, see `02_data_driven_gtm`)

---

## Implementation Handoff

Engineering needs (Jordan / frontend):
- Exit-intent popup React component with Klaviyo embed integration
  (reads garage cookie for personalization, fires `identify` event)
- YMM post-completion capture component (mount in YMMModal after save success)
- Sticky footer bar component (scroll-triggered, dismissible)
- Inline content-upgrade component (reusable, parameterized by lead source)
- Custom property passthrough: `lead_source`, `garage_vehicle`, `captured_page`

Marketing-only:
- Klaviyo form creation (3 forms: popup, YMM, footer)
- Welcome series flow build (5 emails, timing above)
- A/B test setup: offer copy variant A ("10% off") vs. variant B
  ("Free fitment check + 10% off") — run for 2 weeks, keep winner

---

## NEXT ACTION (This Week)

Build and deploy the exit-intent popup this week — it is the highest-CPL-
reduction task in the entire acquisition plan. The site is live, traffic is
coming in (from Shopping or organic), and every session that leaves without
an email is a lead that is permanently lost. Engineering estimate: 4-6 hours.
Marketing copy: 1 hour. Impact starts the moment it is live.

CTR + open-rate KPI risk: low (popup is site-side, not ad-dependent). Conversion
co-ownership: high (YMM popup depends on YMM modal working correctly). Revenue
confidence: high (welcome series RPR is the most predictable email metric in
e-commerce — Klaviyo benchmarks this at $2.65/lead in the $100-$200 AOV range).
