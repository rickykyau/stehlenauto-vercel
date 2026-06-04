# Stehlen Auto — Tool Evaluation Scorecard
## C-Suite War Room Assessment (March 2026)

**Reference:** `marketing/plan/00_master_marketing_plan.md`

---

## Scoring Criteria (1-5 scale)
- **Fit:** How well does this tool serve a B2C truck parts brand?
- **ROI Speed:** How fast can we see measurable return?
- **Budget Efficiency:** Can we get value at $200-500/month?
- **Dependency Risk:** Are we building an asset or renting someone else's?

---

## Tools Evaluated and REJECTED

| Tool | Fit | ROI Speed | Budget Eff. | Dep. Risk | Verdict | Reason |
|---|---|---|---|---|---|---|
| Arcads.ai | 2 | 2 | 3 | 5 | SKIP | AI actors lack credibility with truck buyers. Truck owners respond to authenticity, not avatars. |
| Omneky.com | 2 | 1 | 1 | 4 | SKIP | Enterprise-tier ($2K+/mo). Needs large audience pool and significant ad spend to optimize. Year 2+ tool. |
| Vibe.co | 2 | 2 | 2 | 2 | SKIP | Truck influencers are on YouTube and Facebook groups, not generic influencer marketplaces. $5K-$10K minimum campaigns. |
| Social Cat | 3 | 3 | 4 | 3 | LATER (M4+) | Micro-influencer marketplace at $99-$199/mo. Legitimate for truck owners with 5K-50K followers. Needs reviews/domain first. |
| Breakout Clips | 3 | 3 | 4 | 5 | EVALUATE | Only works if source video content exists. $29-$79/mo tier. Zero compatibility issues. |
| Axon.ai | 1 | 1 | 2 | 2 | HARD SKIP | Requires Shopify theme injection. Incompatible with headless Lovable architecture. |
| Zeely | 2 | 2 | 3 | 4 | SKIP | No differentiation from Canva with AI features. No truck-specific capabilities. |
| Finestro.io | 2 | 2 | 3 | 5 | SKIP | Limited market presence, unclear differentiation. Not worth the experiment at startup budget. |
| Triple Whale | 4 | 3 | 2 | 3 | BUILD INSTEAD | $129/mo ($1,548/yr). Build attribution in Supabase instead. Revisit at $50K+/mo revenue. |

---

## Tools APPROVED

| Tool | Monthly Cost | Why Approved | Integration Effort | Start Date |
|---|---|---|---|---|
| Klaviyo | $0-$45 | Shopify-native, headless-compatible, eBay data is the fuel | Easy (4-6 hrs) | Month 1 |
| Judge.me | $0-$15 | Reviews API works headless, critical trust signal | Medium (8-12 hrs) | Month 1 |
| Gorgias | $10 | JS widget install, fitment questions = direct conversion lever | Easy (2-3 hrs) | Month 2 |
| Google Merchant Center | $0 | Shopping feed required for Google Shopping ads | Medium (6-10 hrs) | Month 1 |
| Microsoft Clarity | $0 | Session recordings, heatmaps, free | Easy (0.5 hrs) | Week 1 |
| Supabase Attribution | $0 (built) | Replaces Triple Whale, own the data | Medium (12-16 hrs) | Month 2-3 |

---

## Integration Notes (Headless Compatibility)

### Works natively with Lovable + Shopify headless:
- Klaviyo (Shopify webhooks for order events, JS snippet for frontend)
- Google Merchant Center (Shopify's native Google channel generates feed)
- Microsoft Clarity (JS snippet in index.html)
- Gorgias (JS widget, no Liquid dependency)
- GA4 (gtag.js, confirmed working)

### Requires custom React components in Lovable:
- Judge.me (API calls to REST endpoint, custom review display component)
- Cross-sell/upsell (Storefront API queries, custom React components)

### Does NOT work with headless:
- Any Shopify app that injects via Liquid theme (most review apps, upsell apps, loyalty apps)
- Axon.ai (requires theme access)
- Standard Shopify checkout customization (requires Shopify Plus at $2,300/mo)
