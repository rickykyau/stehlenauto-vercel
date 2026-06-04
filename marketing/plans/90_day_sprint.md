# Stehlen Auto — 90-Day Sprint Plan
## Unified Cross-Team Timeline

**Reference:** `marketing/plan/00_master_marketing_plan.md`
**Tasks:** `marketing/tasks/master_task_list.md`

---

## Day 1-7: Foundation (CURRENT)

### Site & Tracking (Engineering)
| Day | Task | Status | Hours |
|---|---|---|---|
| 1 | GA4 e-commerce events fixed in Lovable | DONE | 3 |
| 1 | Shopify Google & YouTube channel installed | DONE | 0.5 |
| 1 | Cross-domain tracking configured | DONE | 0.5 |
| 1 | Data retention set to 14 months | DONE | 0.1 |
| 2 | Test order to verify purchase event | TODO | 1 |
| 2 | Install Microsoft Clarity | TODO | 0.5 |
| 2 | Mobile end-to-end purchase test | TODO | 1 |
| 3 | PageSpeed audit on 3 PDPs | TODO | 1 |
| 3 | Security: audit info.txt, rotate credentials | TODO | 2 |

### Marketing Prep
| Day | Task | Status | Hours |
|---|---|---|---|
| 1-2 | Initiate legal review for eBay buyer emails | TODO | 1 |
| 3-5 | Export ChannelAdvisor order history (both accounts) | TODO | 4 |
| 5-7 | Run GA4 baseline analysis scripts | PARTIAL | 2 |

---

## Day 8-14: Data Pipeline

### Engineering
| Task | Hours | Dependency |
|---|---|---|
| Build ChannelAdvisor extraction script (Python) | 8 | CA API credentials ready |
| Load orders into Supabase (ca_orders schema) | 4 | Extraction complete |
| SKU bridge: map CA SKUs to Shopify product IDs | 8 | Orders loaded |
| Customer identity resolution | 8 | SKU bridge complete |

### Marketing
| Task | Hours | Dependency |
|---|---|---|
| Set up Klaviyo account, connect to Shopify | 2 | None |
| Draft eBay reactivation email sequence (3 emails) | 4 | None |
| Submit GMC product feed via Shopify Google channel | 2 | None |
| Research Judge.me headless integration | 2 | None |

---

## Day 15-30: First Revenue

### Engineering
| Task | Hours | Dependency |
|---|---|---|
| RFM segmentation on CA data | 8 | Identity resolution complete |
| Push RFM segments to Klaviyo | 4 | RFM complete |
| Export seed audience to Meta Custom Audiences | 4 | RFM complete |
| Build YMM fitment badge on PDPs | 8 | Shopify product tags |
| Build Judge.me review component in Lovable | 8 | Judge.me API tested |

### Marketing
| Task | Hours | Dependency |
|---|---|---|
| Send eBay pilot email (200-300 Champions) | 2 | Legal review cleared |
| Build Klaviyo abandoned cart flow | 4 | Klaviyo connected |
| Build Klaviyo welcome series | 4 | Klaviyo connected |
| Seed 25+ reviews from past buyers | 8 | Judge.me integrated |
| Resolve GMC feed disapprovals | 4 | Feed submitted |

### Revenue Gate Check (Day 30)
- [ ] Purchase event verified in GA4? YES/NO
- [ ] 25+ reviews on site? YES/NO
- [ ] Fitment badge on PDPs? YES/NO
- [ ] GMC feed approved? YES/NO
- [ ] eBay pilot CVR > 3%? YES/NO
- **If all YES:** Launch paid ads
- **If any NO:** Fix before launching

---

## Day 31-60: Paid Channels Live

### Paid Campaigns
| Campaign | Daily Budget | Start Day | Target ROAS |
|---|---|---|---|
| Google Shopping - Standard | $50/day | Day 31 | 1.5x (learning) |
| Google Search - Brand + Part Number | $25/day | Day 31 | 3.0x |
| Meta Retargeting | $17/day | Day 35 | 5.0x |

### Engineering
| Task | Hours | Dependency |
|---|---|---|
| Vehicle cohort frequency table (top 25 YMM) | 8 | CA data loaded |
| Co-purchase recommendation matrix | 16 | CA order items |
| Custom GMC feed with fitment labels (Python) | 8 | SKU bridge |
| Cross-sell component on PDPs | 8 | Recommendations built |

### Content
| Task | Timeline |
|---|---|
| First YouTube install video | Day 35 |
| 5 blog posts published | Day 35-60 |
| Product page titles enriched with YMM | Day 35-45 |

---

## Day 61-90: Optimize & Scale

### Campaign Optimization
| Action | Trigger |
|---|---|
| Transition top Shopping SKUs to PMax | After 50+ conversions |
| Add competitor conquest keywords | After QS history established |
| Launch Meta cold prospecting (1% LAL) | After retargeting proves profitable |
| Scale Shopping budget to $100/day | If ROAS > 2.5x |

### ML Models
| Model | Build Time | Revenue Impact |
|---|---|---|
| Category demand forecasting (Prophet) | 2 weeks | Prevents stockouts, optimizes ad timing |
| Price sensitivity analysis | 1 week | 5% margin lift on inelastic SKUs |
| Vehicle maintenance prediction | 1 week | 18-27% CVR on triggered emails |

### Site Improvements
| Feature | Expected Impact |
|---|---|
| Returning visitor personalization | 8-12% RPV lift |
| Email capture modal (post-YMM) | 8-12% capture rate |
| Vehicle-specific review filtering | 9% CVR lift (AutoZone benchmark) |
| Mobile LCP under 2.0s | Better ad Quality Scores |

---

## Day 90: Scorecard

| Metric | Target | Measurement |
|---|---|---|
| Monthly revenue | $15K-$25K | Shopify orders |
| Monthly sessions | 5,000-10,000 | GA4 |
| Overall CVR | 1.5-2.0% | GA4 |
| YMM-filtered CVR | 3.0%+ | GA4 custom segment |
| Google Shopping ROAS | 2.5x+ | Google Ads |
| Email % of revenue | 15%+ | Klaviyo |
| Fitment return rate | <4% | Shopify returns |
| Product reviews | 50+ | Judge.me |
| Repeat purchase rate | 15%+ | Shopify |
