# Champions Reactivation Plan — Email Launch Strategy

**Date:** March 27, 2026
**Owner:** Marketing
**Status:** Ready to execute

---

## 1. List Overview

| Metric | Value |
|---|---|
| Total Champions | 36,738 |
| With vehicle data (make+model) | 34,084 (92.8%) |
| Without vehicle data | 2,654 |
| Multi-vehicle owners | 4,251 |
| Average LTV | $425 |
| Email quality | 98.8% real emails |

### Marketplace Source (Verified from CB Order Data)

| Source | Count | Can We Email? |
|---|---|---|
| eBay primary (safe) | 36,563 | YES — CAN-SPAM prior business relationship |
| Amazon primary (no eBay history) | 1 | NO — Amazon TOS prohibits |
| Amazon + eBay (has eBay orders too) | 150 | YES — eBay relationship exists |
| Dropship/Wholesale/Other | 33 | MAYBE — review case by case |
| **Total safe to email** | **~36,700** | |

**Key finding:** 99.6% of Champions are eBay-sourced. Only 1 contact is Amazon-only. This dramatically simplifies the plan — nearly the entire list is safe to email under CAN-SPAM.

### Vehicle Make Distribution

| Make | Count | % |
|---|---|---|
| Ford | 7,374 | 20.1% |
| Toyota | 7,004 | 19.1% |
| Chevrolet | 6,031 | 16.4% |
| Dodge | 3,765 | 10.2% |
| Nissan | 2,214 | 6.0% |
| Honda | 1,780 | 4.8% |
| GMC | 1,060 | 2.9% |
| Jeep | 779 | 2.1% |
| Ram | 674 | 1.8% |
| Other makes | 3,403 | 9.3% |
| No vehicle data | 2,654 | 7.2% |

### Last Purchase Category

| Category | Count |
|---|---|
| Headlights | 10,182 |
| Trailer hitch | 9,144 |
| Grille | 5,118 |
| Tonneau cover | 4,658 |
| Bull guard | 2,916 |
| Running boards | 2,332 |

---

## 2. Platform Architecture

### Why NOT Klaviyo for the Initial Send

- Champions are marketplace buyers, not stehlenauto.com opt-in subscribers
- Klaviyo flags accounts if spam complaint rate exceeds 0.1% (37 complaints on 36K)
- New sending domain (send.stehlenauto.com) has zero reputation
- One bad batch = domain blacklisted = all future flows (abandoned cart, post-purchase) go to spam

### Recommended Architecture

```
Step 1: Email Validation
  36,738 Champions
     → ZeroBounce ($30-50)
     → Remove bounces, traps, catch-alls
     → Output: ~35,000 validated contacts

Step 2: Cold Reactivation (Separate Domain)
  Tool: Brevo (Sendinblue) $25/mo  OR  Smartlead $97/mo
  Domain: updates.stehlenauto.com (separate from Klaviyo's send.stehlenauto.com)
  Warm-up: 14 days before first real send
  Send: 3-email reactivation sequence, vehicle-personalized

Step 3: Migrate Engaged to Klaviyo
  Anyone who opens or clicks → import to Klaviyo as "Champions_Reactivated"
  These are confirmed-engaged, safe for all Klaviyo flows
  Expected: 15-25% engagement = 5,000-8,000 high-quality Klaviyo subscribers

Step 4: Non-Engaged → Meta Lookalike
  Non-responders → upload as Meta Custom Audience (hashed)
  Used for cold prospecting Lookalike audiences only
  Never email again
```

---

## 3. Domain Setup

| Domain | Purpose | Managed By |
|---|---|---|
| `send.stehlenauto.com` | Klaviyo (engaged subscribers, flows, campaigns) | Klaviyo |
| `updates.stehlenauto.com` | Cold reactivation sends only | Brevo or Smartlead |

### DNS Records for updates.stehlenauto.com
- SPF record
- DKIM record (provided by sending tool)
- DMARC record (if not already at domain level)
- Set up in your domain registrar/DNS provider

---

## 4. Email Validation (Step 1)

### Service: ZeroBounce (zeroBounce.net)

1. Upload `data/exports/klaviyo_champions_enriched.csv`
2. Cost: ~$30-50 for 36K contacts
3. Processing time: 2-3 hours
4. Export "valid" results only
5. Remove: hard bounces, spam traps, catch-all addresses, disposable emails

### Expected Results
- Input: 36,738 emails
- Valid: ~34,000-35,500 (based on 98.8% real email rate)
- Removed: ~1,200-2,700 (bounces, traps, catch-alls)

---

## 5. Warm-Up Schedule (Step 2)

### Domain Warm-Up (14 days before real sends)

Use Smartlead or Brevo's built-in warm-up feature:
- Days 1-3: 20 warm-up emails/day
- Days 4-7: 50 warm-up emails/day
- Days 8-10: 100 warm-up emails/day
- Days 11-14: 200 warm-up emails/day

### Real Send Schedule (starts Day 15)

| Day | Volume | Segment | Gate to Proceed |
|---|---|---|---|
| 15 | 500 | Highest LTV Champions | Open rate >20%, spam <0.05% |
| 18 | 2,000 | Next tier by LTV | Same gates |
| 22 | 5,000 | Expanding | Same gates |
| 26 | 10,000 | Mid-list | Same gates |
| 30 | Remaining (~18,000) | Full coverage | Same gates |

**Total time from start to full list coverage: ~45 days**

### Decision Gates (STOP if any fail)

| Metric | Threshold | Action if Failed |
|---|---|---|
| Open rate | <15% | Revise subject line, check spam folder placement |
| Spam complaint rate | >0.08% | STOP sends, investigate, consider smaller batches |
| Bounce rate | >2% | Re-validate remaining list, check for issues |
| Unsubscribe rate | >1% per send | Revise messaging, slow down sends |

---

## 6. Reactivation Email Sequence (3 Emails)

### Email 1: Brand Reintroduction (Day 0)

**Subject line A/B test (50/50):**
- A: "You ordered from us on eBay — we have something better now"
- B: "[First Name], parts for your {{vehicle_make}} {{vehicle_model}} at stehlenauto.com"

**Body (plain text, no heavy HTML — better deliverability during warm-up):**

> Hey {{first_name}},
>
> You ordered from us on eBay a while back — thanks for trusting Stehlen Auto.
>
> We just launched our own store at stehlenauto.com. Same parts, same quality, but now with something we couldn't offer on eBay:
>
> **A fitment guarantee.** Tell us your vehicle's year, make, and model — we confirm the part fits before it ships.
>
> As a thank you for being one of our earliest customers: **10% off your first direct order** through April 30.
>
> **Code: DIRECT10**
>
> [Browse parts for your {{vehicle_make}} →]
>
> — The Stehlen Auto Team
> stehlenauto.com
>
> P.S. Free shipping on orders over $99.

**UTM:** `?utm_source=brevo&utm_medium=email&utm_campaign=champions-reactivation&utm_content=email1`

**For contacts WITHOUT vehicle data:**
Replace "parts for your {{vehicle_make}}" with "heavy-duty truck & SUV accessories"

---

### Email 2: Vehicle-Specific (Day 5 after Email 1)

**Only send to:** Opens OR non-opens from Email 1 (everyone — but personalize differently)

**Subject line:**
- With vehicle: "The 3 best upgrades for your {{vehicle_make}} {{vehicle_model}}"
- Without vehicle: "What do you drive? We'll show you parts guaranteed to fit"

**Body:**
> Hey {{first_name}},
>
> [IF vehicle data exists:]
> We pulled together the most popular upgrades for the {{vehicle_make}} {{vehicle_model}} — based on what thousands of owners have ordered from us over the past 10 years.
>
> **→ See {{vehicle_make}} {{vehicle_model}} upgrades**
>
> [IF no vehicle data:]
> Every part on stehlenauto.com comes with a fitment guarantee. Just select your vehicle and we'll show you exactly what fits — no guessing, no returns.
>
> **→ Find parts for your vehicle**
>
> Your 10% off code (DIRECT10) is still active.
>
> — Stehlen Auto

**UTM:** `utm_content=email2`

---

### Email 3: Last Chance (Day 10 after Email 1)

**Only send to:** Non-buyers (suppress anyone who purchased after Email 1 or 2)

**Subject line:**
- "DIRECT10 expires Friday — 10% off your first order at stehlenauto.com"

**Body:**
> {{first_name}},
>
> Quick heads up — your 10% off code **DIRECT10** expires this Friday.
>
> [IF vehicle data:]
> We've got {{vehicle_make}} {{vehicle_model}} parts in stock and ready to ship.
>
> **→ Use DIRECT10 at checkout**
>
> Free shipping on orders over $99. Fitment guaranteed or your money back.
>
> — Stehlen Auto

**UTM:** `utm_content=email3`

---

## 7. Klaviyo Migration (Step 3)

### Who Gets Imported to Klaviyo

After the 3-email sequence completes (~Day 30-45):

| Engagement Level | Action |
|---|---|
| Opened or clicked any email | Import to Klaviyo list "Champions_Reactivated" |
| Purchased | Import to Klaviyo + tag "purchased_from_reactivation" |
| No opens, no clicks | Do NOT import to Klaviyo — add to Meta Lookalike seed |

### Klaviyo Import Fields

Map these columns from the enriched CSV:
- `email` → Email
- `first_name` → First Name (if available)
- `vehicle_make` → Custom property: Vehicle Make
- `vehicle_model` → Custom property: Vehicle Model
- `vehicle_label` → Custom property: Vehicle Label
- `all_vehicles` → Custom property: All Vehicles
- `last_category` → Custom property: Last Category
- `rfm_segment` → Custom property: RFM Segment (value: "Champions")
- `marketplace` → Custom property: Original Marketplace

### Expected Klaviyo Subscriber Count

| Scenario | Engagement Rate | Klaviyo Imports |
|---|---|---|
| Conservative | 15% | ~5,500 |
| Expected | 20% | ~7,300 |
| Optimistic | 25% | ~9,200 |

These are **high-quality, vehicle-enriched, confirmed-engaged subscribers** — the best possible foundation for your Klaviyo account.

---

## 8. Klaviyo Flows to Build (While Warm-Up Runs)

Build these during the 14-day warm-up period so they're ready when reactivated Champions start browsing the site:

### Flow 1: Welcome Series (for Champions_Reactivated imports)
- Trigger: Added to "Champions_Reactivated" list
- Email 1 (immediate): "Welcome to stehlenauto.com — here's what's new"
- Email 2 (Day 3): Vehicle-specific product recommendations
- Email 3 (Day 7): Fitment guarantee explainer + social proof
- Email 4 (Day 14): "Your DIRECT10 code is still active" (if they haven't purchased)

### Flow 2: Abandoned Cart
- Trigger: Started Checkout event (already firing via Klaviyo.js)
- Email 1 (1 hour): Product in cart + fitment badge
- Email 2 (24 hours): "Still thinking about it?" + fitment guarantee
- Email 3 (72 hours): 10% off — "last chance" with countdown

### Flow 3: Post-Purchase
- Trigger: Shopify Placed Order (via Shopify integration)
- Email 1 (Day 2): "Does your part fit? We're here to help" + install tips
- Email 2 (Day 14): Related product recommendations based on purchase
- Email 3 (Day 45): Cross-sell from co-purchase history

---

## 9. Make-Specific Campaign Segments (Post-Reactivation)

Once Champions are in Klaviyo, run vehicle-specific campaigns:

| Segment | Size (est.) | Campaign Theme |
|---|---|---|
| Ford owners | ~1,500-1,800 | "F-150 & Ranger Season — New Arrivals" |
| Toyota owners | ~1,400-1,750 | "Tacoma & Tundra Upgrades" |
| Chevy owners | ~1,200-1,500 | "Silverado & Colorado Accessories" |
| Dodge/Ram owners | ~900-1,100 | "Ram Tough — Built for Your Ram" |
| Others | ~1,500-2,000 | Generic product highlights |

**Dynamic content:** Use `{{person|lookup:'Vehicle Make'}}` and `{{person|lookup:'Vehicle Model'}}` in subject lines and body.

---

## 10. Meta Lookalike Audiences

### Upload to Meta (all Champions, including non-engaged)

The full 36,738 Champions list (hashed) makes an excellent Lookalike seed:
1. Export emails from `klaviyo_champions_enriched.csv`
2. Upload to Meta Business Manager → Custom Audiences → Customer List
3. Create 1% Lookalike from this seed
4. Use for cold prospecting ads starting Week 8-10 (after pixel has 100+ purchases)

### Upload to Google Customer Match

Same list, uploaded to Google Ads for:
- Similar Audiences targeting
- Bid adjustments for known customers
- Exclusion from prospecting campaigns (don't pay to acquire existing customers)

---

## 11. Timeline Summary

| Week | Action |
|---|---|
| Week 1 | ZeroBounce validation, set up updates.stehlenauto.com, register Brevo/Smartlead, start domain warm-up, mobile purchase test |
| Week 2 | Write 3-email reactivation sequence, build Klaviyo flows (abandoned cart, post-purchase, welcome), set up DIRECT10 promo code in Shopify |
| Week 3 | First real send (500 contacts), monitor deliverability, set up Judge.me |
| Week 4 | Scale to 2,000 → 5,000 sends, review pilot data, submit GMC product feed |
| Week 5 | Scale to 10,000 sends, import first engaged batch to Klaviyo |
| Week 6 | Complete full Champions coverage (~35,000 sent), all engaged → Klaviyo |
| Week 7 | Launch Google Shopping ($50/day), Meta retargeting ($17/day) |
| Week 8 | Optimize campaigns, begin Loyal segment warm-up planning |

---

## 12. Success Metrics

| Metric | Target | Measured Where |
|---|---|---|
| Email open rate | >20% | Brevo/Smartlead |
| Email click rate | >4% | Brevo/Smartlead |
| Spam complaint rate | <0.05% | Brevo/Smartlead |
| Reactivation CVR | >1% | Shopify orders with DIRECT10 code |
| Engaged imports to Klaviyo | >5,000 | Klaviyo list count |
| Revenue from reactivation | >$50,000 | Shopify + GA4 |
| Klaviyo domain reputation | Clean (no flags) | Klaviyo deliverability dashboard |

---

## 13. Files & Resources

| File | Purpose |
|---|---|
| `data/exports/klaviyo_champions_enriched.csv` | Champions list with vehicle data (ready for validation + import) |
| `data/exports/products_advertise_priority.csv` | Top SKUs for email product recommendations |
| `data/exports/products_exclude_list.csv` | SKUs to never feature in emails |
| `scripts/enrich_champions_vehicle.py` | Re-runnable script to refresh vehicle enrichment |

---

## 14. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| High spam complaint rate kills domain | Medium | Critical | Separate sending domain, graduated volume, decision gates |
| Low open rates (<10%) | Low | High | A/B test subject lines, check spam placement, plain-text format |
| Amazon TOS violation | Very Low | Medium | Only 1 Amazon-only contact — exclude from email, use for Lookalike only |
| CASL (Canadian contacts) | Low | Medium | Check for .ca emails or Canadian shipping addresses, segment out if needed |
| Champions have moved on (stale list) | Medium | Medium | Start with highest-LTV contacts first, measure engagement before scaling |
| Discount code abuse | Low | Low | Single-use codes or limit to first order per email |
