# DNS Cutover Runbook — Lovable → Vercel

**Goal:** Move stehlenauto.com production traffic from the Lovable SPA to this Next.js app on Vercel with zero-downtime, instant rollback, and verified post-cutover health.

**Owners:** Ricky (commercial), Claude Code (technical execution).

**Estimated window:** 2 hours, low-traffic (Tue–Thu 5–7am PST recommended).

---

## Pre-cutover (T-7 days)

### 1. Lock Phase 5 sign-off

- [ ] Lighthouse CI green on every key route (Home, Collection, PDP, Vehicle Hub, About, Warranty)
- [ ] All Phase 4–5 features verified in production-deploy mode (analytics fire, search returns Shopify products, `/api/wishlist` round-trips, RIG chat streams from AI Gateway, real orders pull for the test customer)
- [ ] Real Stehlen catalog uploaded to Shopify with `handle`s matching `data/product_clusters.json`
- [ ] Sitemap returns >100 product URLs (not just mock 12) — verify `/sitemap.xml` against live Shopify
- [ ] All footer + mega-menu links resolve to 200, no 404s

### 2. Vercel project hardening

- [ ] Production environment variables set in Vercel dashboard (mirror `.env.local`):
  - `NEXT_PUBLIC_SITE_URL=https://stehlenauto.com`
  - `SHOPIFY_*`, `CLERK_*`, `NEXT_PUBLIC_CLERK_*`
  - `DATABASE_URL` pointing to Neon production branch (not dev)
  - `NEXT_PUBLIC_GA4_MEASUREMENT_ID`, `NEXT_PUBLIC_KLAVIYO_COMPANY_ID`, `NEXT_PUBLIC_CLARITY_PROJECT_ID`
  - `AI_GATEWAY_MODEL` (defaults to `anthropic/claude-sonnet-4-6`)
- [ ] Custom domain `stehlenauto.com` and `www.stehlenauto.com` added in Vercel → Project → Domains (status: pending verification)
- [ ] Production deployment promoted via `vercel --prod`
- [ ] Test the production deployment via the `*.vercel.app` URL end-to-end (cart → checkout → place order with Shopify test card)

### 3. SEO redirect map

The legacy Lovable site has these URL shapes — map every one to a 200 on the new app, or add a 301 in `next.config.ts` if the path changes:

| Lovable URL | New URL | Status |
|---|---|---|
| `/` | `/` | ✓ |
| `/products/{handle}` | `/products/{handle}` | ✓ same |
| `/collections/{handle}` | `/collections/{handle}` | ✓ same |
| `/cart` | `/cart` | ✓ |
| `/checkout` | `/checkout` | ✓ |
| `/account` | `/account` | ✓ |
| `/about` | `/about` | ✓ |
| `/contact` | `/help/contact` | **add 301** |
| `/returns` | `/legal/returns` | **add 301** |
| `/warranty` | `/legal/warranty` | **add 301** |
| `/privacy` | `/legal/privacy` | **add 301** |
| `/terms` | `/legal/terms` | **add 301** |

Add to `next.config.ts`:

```ts
async redirects() {
  return [
    { source: "/contact", destination: "/help/contact", permanent: true },
    { source: "/returns", destination: "/legal/returns", permanent: true },
    { source: "/warranty", destination: "/legal/warranty", permanent: true },
    { source: "/privacy", destination: "/legal/privacy", permanent: true },
    { source: "/terms", destination: "/legal/terms", permanent: true },
  ];
}
```

### 4. Capture baseline

- [ ] Screenshot Lovable homepage, top 5 collection pages, top 5 PDPs at desktop + mobile (visual diff reference)
- [ ] Pull last 30 days of GA4 metrics: sessions, users, conv rate, AOV (post-cutover comparison)
- [ ] Note current Lovable hosting cost (for cost-savings tally)

---

## Cutover (T-0)

### 1. Final pre-flight (window opens)

- [ ] Confirm Shopify Admin order pipeline is operational (place a test order)
- [ ] Confirm Neon production DB is reachable (`pnpm db:studio`)
- [ ] Confirm Clerk dashboard shows production instance keys live
- [ ] Last `vercel --prod` deploy is **at least 30 min old** (cache warm)

### 2. DNS swap

In your DNS provider (likely Cloudflare or Route 53 — check current registrar):

| Record | Old (Lovable) | New (Vercel) |
|---|---|---|
| `stehlenauto.com` (apex) | A → Lovable IP | A → `76.76.21.21` (Vercel) |
| `www.stehlenauto.com` | CNAME → lovable.app | CNAME → `cname.vercel-dns.com` |

**TTL:** drop to 60s the day before to speed propagation.

- [ ] Lower TTL to 60s (T-24h)
- [ ] At T-0: update apex A record
- [ ] At T-0: update www CNAME
- [ ] In Vercel dashboard, refresh the domain — both should flip to green within 5 min
- [ ] Verify SSL: `curl -I https://stehlenauto.com` returns Vercel headers
- [ ] Verify www → apex (or apex → www, whichever you canonicalize): `curl -I https://www.stehlenauto.com`

### 3. Smoke test (T+10min)

Run through this in **incognito**:

- [ ] Home loads, hero image visible
- [ ] Search returns real Shopify products (typeahead)
- [ ] Click a PDP — JSON-LD visible in source, ADD TO CART works
- [ ] Cart drawer opens, has the item
- [ ] Cart page → checkout button redirects to Shopify-hosted checkout
- [ ] Sign in with a test Clerk user, garage shows
- [ ] Visit `/account`, real order pulls
- [ ] RIG chat opens, streams a response
- [ ] `/sitemap.xml` returns Shopify catalog
- [ ] `/robots.txt` allows crawling

---

## Post-cutover monitoring (T+1 hour through T+72 hours)

### Real-time

- [ ] Vercel dashboard → Logs (watch for 5xx spikes)
- [ ] Vercel Analytics → live visitors equals or exceeds Lovable's prior baseline
- [ ] Sentry/Honeybadger (if added) — error rate < 1%
- [ ] Klaviyo dashboard — onsite events firing
- [ ] GA4 Realtime — page_view events arriving

### Daily for a week

- [ ] Search Console (Google) — index coverage trending up, no spike in 404s
- [ ] Server response time p95 < 800ms
- [ ] Cart abandonment rate matches Lovable baseline ±20%
- [ ] Conversion rate matches or exceeds baseline
- [ ] Organic traffic doesn't drop more than 15% (acceptable transient redirect cost)

---

## Rollback plan

If cutover health is bad (5xx > 5%, or cart conversion < 50% of baseline for >2h):

1. **DNS revert** (30 sec to publish, 1–5 min to propagate at 60s TTL):
   - Apex A back to Lovable IP
   - www CNAME back to lovable.app
2. Notify Ricky + on-call channel
3. Post-mortem within 24h: capture cause, fix, schedule second cutover attempt

The Vercel app stays live — orders that flew through will still complete via Shopify checkout. No data loss.

---

## Final cleanup (T+30 days)

- [ ] Restore DNS TTL to 3600s
- [ ] Search Console → submit fresh sitemap
- [ ] Cancel Lovable plan
- [ ] Update vendor docs / API consumers pointing at the legacy `*.lovable.app` host
- [ ] Archive `legacy-lovable/` snapshot in cold storage
