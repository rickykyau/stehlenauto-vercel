# Influencer + YouTube
## Organic-First, Paid Spark Ads Second

**Priority rank:** 6 of 9
**Owner:** Marketing (content direction) + Video Director subagent (shot briefs)
  + Carter Voss video-director agent at `.claude/agents/video-director.md`
**Budget range:** $500-$3,000/mo (own content + UGC creator fees)
**Expected CAC:** $15-$45 (YouTube organic converts at 4-6x text content)
**Time to meaningful YouTube traffic:** 90-180 days (organic); TikTok/Reels
  organic can generate traffic in 7-14 days if a video hits

---

## The Play

YouTube install videos are the highest-converting content format in aftermarket
auto parts — full stop. When a truck owner searches "how to install a tonneau
cover on 2021 Ford F-150" on YouTube, they are 1-3 days from purchase. The
video either sends them to buy from whoever filmed it, or it sends them to
Google Shopping where the best feed wins.

Stehlen should be the one who filmed it.

The strategy is organic-first: build the YouTube channel with install content
and buying guides before spending on Spark Ads or influencer fees. TFL Truck
(2.4M YouTube subscribers) built their audience on exactly this content model.
The difference between Stehlen and TFL Truck is that Stehlen makes the product
being installed — which is a significant credibility and CPL advantage.

Influencer partnerships are secondary to owned YouTube content. Third-party
reviews from relevant truck channels amplify the owned content but should not
replace it. Stehlen needs to own the canonical "Stehlen product on [Vehicle]"
video, not just have a sponsored mention.

---

## YouTube Channel Setup

### Channel Authority Signals (Week 1)

- Channel name: "Stehlen Auto" (matches brand)
- Channel description: "[Make]-specific aftermarket accessories, direct from
  manufacturer. Install guides, buying guides, fitment walkthroughs. No dealer
  markup, no guesswork." (This is a GEO signal — AI crawlers index YouTube
  about sections)
- About page URL: stehlenauto.com
- Channel sections: "Install Guides by Vehicle" (Ford, Chevy, Ram, Toyota, GMC
  as separate playlists) + "Buying Guides" + "Product Reviews"
- Profile photo: Stehlen logo
- Banner: Vehicle lifestyle shot (truck on open road, product installed)

### Video Content Priority (First 10 Videos)

Ordered by search volume x CB revenue x install complexity
(complex installs = higher value to viewer):

| Priority | Video title | Vehicle | Product | Estimated search volume |
|---------|-------------|---------|---------|------------------------|
| 1 | "How to install a soft tri-fold tonneau cover on 2019-2024 Ford F-150 5.5ft bed" | F-150 | Tonneau | High |
| 2 | "Best Tonneau Covers for 2019-2024 Ford F-150 — What Fits and What Doesn't" | F-150 | Tonneau | High |
| 3 | "How to replace the front grille on a 2014-2019 Chevy Silverado 1500" | Silverado | Grille | Medium-High |
| 4 | "Installing a bull bar on 2019-2023 Ram 1500 — step by step no-drill install" | Ram 1500 | Bull bar | Medium |
| 5 | "Best Aftermarket Grilles for 2020-2024 Chevy Silverado 1500 — Buying Guide" | Silverado | Grille | Medium |
| 6 | "How to install running boards on a 2021 GMC Sierra 1500 in 30 minutes" | GMC Sierra | Running boards | Medium |
| 7 | "Toyota Tundra tonneau cover install — 2022-2024 model guide" | Tundra | Tonneau | Medium |
| 8 | "Trailer hitch installation on Ford F-150 — Class III receiver setup" | F-150 | Hitch | Medium |
| 9 | "Soft vs Hard Tonneau Cover — which is right for your truck?" | Generic | Tonneau | Medium |
| 10 | "2020-2024 Ram 1500 accessories overview — what fits, what doesn't" | Ram 1500 | Multi | Medium |

### Video Production Spec

**Format:** Shoot on iPhone 14+ (4K, ProRes if possible) or a mirrorless camera.
The viewer does not expect broadcast quality — they expect to see the actual
install clearly. A shaky tripod on a real driveway with a real truck outperforms
a studio-lit product showcase.

**Shot list per install video (brief for Carter Voss / video-director agent):**
1. Opening hook (0-10 seconds): product in hand + "This is how you install a
   [product] on a [Year] [Make] [Model] in 45 minutes."
2. What's in the box (10-30 seconds): inventory of components
3. Tools required (30-45 seconds): "You only need a [specific tool]"
4. Step-by-step install (2-5 minutes): each step clearly narrated
5. Finished install with demo (30-60 seconds): open/close, fit verification,
   any features demonstrated
6. End card (15 seconds): "Get this for your [vehicle] at stehlenauto.com —
   link in the description"

**AI augmentation (existing stack):**
- Kling Omni 3 / Runway Gen-4 for B-roll shots between steps
- Firefly or Midjourney for thumbnail design
- Video director subagent (`/.claude/agents/video-director.md`) generates the
  full shot brief from the content priority table above

**Length target:** 5-10 minutes for install guides (YouTube's algorithm rewards
watch time, and install videos with clear steps retain viewers through the end).
Buying guides: 3-6 minutes.

**Upload cadence:** 1 video/week minimum. At this cadence, you have 52 videos
by year 1. The first 20 cover all top vehicle+category combinations. After that,
depth of coverage per vehicle (model year variants, trim-specific notes) builds
the long-tail index.

### YouTube SEO

**Title formula:** "How to Install [Product] on [Year Range] [Make] [Model]
— Step by Step [Year]"
The "[Year]" at the end signals recency to both YouTube's algorithm and to
viewers. "2026" in a 2026-published video beats the same title without it.

**Description formula:**
```
[First 2 sentences must be standalone — these appear in Google search snippets]
Full install guide for [Stehlen Product] on [Year Range] [Make] [Model].
This covers [bed length/cab type variants if applicable] and takes about 45 minutes.

Tools needed: [list]
Fitment: [exact year/make/model/trim coverage]
Get this product: [direct PDP URL on stehlenauto.com]
Shop all [Make] accessories: [collection URL]

Timestamps:
0:00 Introduction
0:30 What's in the box
1:00 Tools needed
2:00 Install step 1 [etc.]

Stehlen Auto makes direct-manufacturer aftermarket accessories for Ford, Chevy,
Ram, Toyota, and GMC trucks. No dealer markup. Ships in 1-3 days.
```

**Tags:** [Year] [Make] [Model], "[product] install", "truck accessories",
"aftermarket [category]", "how to install [product]", "[Year] [Make] mods"

**Cards and end screens:** Link to the PDP on stehlenauto.com + link to the
next most relevant video in the playlist.

### TikTok and Reels (Short-Form Repurposing)

Every install video generates three short-form assets at zero incremental
production cost:
- 15-second "before and after" cut for Instagram Reels
- 30-second "here's how fast it installs" cut for TikTok
- 60-second summary cut for YouTube Shorts

Post all three the same day as the long-form video. TikTok organic reach
for "truck mod" content is still strong in 2026 — videos showing dramatic
before/after truck transformations routinely reach 100K+ organically.

**TikTok Spark Ads test:** If any short-form video hits 10,000 organic views
within 7 days, run a $200-$500 Spark Ads test to amplify it. Spark Ads
boost organic content (so the engagement signals are real) rather than
creating separate ad units. Target: F-150 interest, truck owner behavior,
age 25-55 male. This is the paid amplification step — it only runs on
content that proves itself organically first.

---

## Third-Party Influencer Strategy

### Target Profile

The right truck YouTube influencer for Stehlen is NOT a mega-influencer.
The right profile:
- 50K-500K subscribers on YouTube
- Content is predominantly truck-specific (not "car culture" generic)
- Audience skews male, 25-55, truck owner demographic
- Based in TX, CA, or FL (Stehlen's top 3 markets) — preferred but not required
- Average views per video: 30K+ (engagement > subscriber count)

Examples of this profile (these are directional examples, not vetted partners):
- Mid-size YouTube channels focused on F-150, Silverado, or Ram builds
- TFL Truck off-shoots or similar vehicles-specific channels
- Truck-specific Instagram accounts with 50K-200K followers doing build diaries

**Avoid:** Generic auto influencers who do car + truck + EV + motorcycles.
The audience overlap with truck accessory buyers is low and the CPM is high.

### Influencer Outreach Protocol

**Outreach model:** Product-for-review (send free product, no guaranteed coverage)
vs. paid partnership (guaranteed coverage, scripted mention). Use product-for-
review first — it generates more authentic content and FTC compliance is cleaner.

**Outreach email template:**
```
Subject: Install video opportunity — [Stehlen Product] for your [Make]

Hey [name],

I saw your video on [specific video reference]. We make the [product] you were
looking at — we're the direct manufacturer, based in Walnut CA.

We'd love to send you a [product] that fits your [Year Make Model] for an
install video or honest review. No script, no requirements. If it's not worth
covering, no obligation.

What we'll send: [product + fitment-matched sample] + install guide + our direct
line if anything doesn't fit right.

Interested? I can have it to you in 3 days.

[Name], Stehlen Auto
[phone number]
```

No pitch deck. No media kit. Truck YouTube creators respond to direct offers
from manufacturers more than to polished influencer marketing emails.

**When to pay for sponsorships (Month 3+):**
Once 3+ YouTube install videos are live with 1,000+ views each, use that
content as proof when pitching larger channels ($10K-$100K subscribers) for
paid placements. Typical sponsored integration rate: $500-$2,500 for a
dedicated mention in an install/build video. Measure by views x estimated
click-through rate x CVR x AOV — if the math works at $1,500 for a 100K-
view video, it beats most paid social CPAs.

---

## Tools

| Job | Tool | Cost |
|-----|------|------|
| Shot briefs | Carter Voss video-director subagent | Already in stack |
| AI B-roll | Kling Omni 3 / Runway Gen-4 | Already in stack |
| Thumbnail design | Midjourney / Firefly | Already in stack |
| Short-form repurposing | Breakout Clips (per tool scorecard: $29-$79/mo) | $29-$79/mo |
| YouTube analytics | YouTube Studio (free) | $0 |
| Influencer discovery | Social Cat ($99-$199/mo) — per tool scorecard: Month 4+ | Hold |

---

## Budget and Expected Output

**Month 1-2 (owned content only — $500/mo):**
- 1 install video/week ($250-$500/video for filming labor + AI augmentation)
- 3-4 short-form repurposed assets from each video
- Influencer product samples: 1-2 at cost ($100-$300)
- Expected YouTube views: 0-5K total (building)
- Expected attributed revenue month 1: near zero (lag to index + build)
- Expected attributed revenue month 3: $1,000-$5,000 (organic views start
  converting as content accumulates)

**Month 3-6 (owned + influencer amplification — $1,500/mo):**
- 2 videos/week (2 months = 16 videos, channel has ~20 total)
- TikTok Spark Ads on top performers: $500/mo
- 2-3 influencer product partnerships (free products at cost)
- Expected YouTube views: 20K-80K/month organic
- Attributed revenue: $5,000-$20,000/mo (YouTube organic + influencer referral)
- CAC from YouTube: $15-$40

**Month 6-12 (scaled — $3,000/mo):**
- 2-3 videos/week + 1 paid influencer placement/month ($1,500)
- Spark Ads on TikTok: $800/mo
- Expected organic YouTube views: 50K-200K/mo
- Attributed revenue: $15,000-$50,000/mo
- YouTube becomes 5-12% of total DTC revenue by month 9-12

---

## KPIs

- Primary: YouTube video views per video (target 5,000+ by month 2 per video,
  15,000+ by month 6 as channel authority builds)
- Primary: YouTube-attributed orders in GA4 (source = youtube.com)
- Primary: YouTube subscriber count (target 500 by month 3, 2,000 by month 6,
  5,000 by month 12)
- Primary: Short-form organic reach (TikTok/Reels views per post — target 10K+
  on best performers within 30 days)
- Guardrail: Fitment accuracy in all video content — incorrect fitment claims
  in a video are permanent and generate support tickets + return rate damage
- Guardrail: FTC disclosure — "This is our product" or "#ad" must appear in
  any sponsored content. Non-disclosure in influencer posts creates legal risk.

**Monthly reporting:** YouTube Studio analytics (views, watch time, click-through
from cards to stehlenauto.com); GA4 for youtube.com/referring referral traffic;
TikTok Analytics for reach; Shopify UTM attribution for direct YouTube orders.

---

## Implementation Handoff

UX needs (Jordan):
- YouTube install video embeds on relevant PDPs (the install video for
  F-150 tonneau cover should live on the TC-F15015-5.5-LTH PDP)
- Blog post video embed component for buying guide posts

Engineering needs:
- End screen CTA URL: ensure `stehlenauto.com/collections/[handle]?utm_source=youtube`
  UTM structure is consistent for attribution
- No other engineering dependencies — YouTube is off-site

Marketing-only:
- YouTube channel setup and branding (1 day)
- Video shot brief generation (Carter Voss subagent)
- Film, edit, publish cadence (1 person, 4-6 hours/video)
- Short-form repurpose workflow
- Influencer outreach tracking (Notion CRM or spreadsheet)

---

## NEXT ACTION (This Week)

Film the first install video this week — not next month. "Best Tonneau Cover
for 2021-2023 Ford F-150" is the top priority. Use the Carter Voss subagent
to generate the full shot brief in 10 minutes. The video does not need to be
perfect. A 5-minute install walkthrough filmed on an iPhone in decent light,
published this week, begins the 90-day indexing runway. A studio-quality video
published in month 3 is worth less than this video published today because
organic YouTube compounds on time-in-index.

CTR + open-rate KPI risk: low (organic YouTube has no CTR budget dependency).
Conversion co-ownership: medium (click-through from video to site depends on
compelling end-screen CTAs and the site landing experience). Revenue confidence:
medium (YouTube organic timelines are 90-180 days to meaningful volume; the
eventual CAC of $15-$40 is one of the best in the channel mix).
