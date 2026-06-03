# GA4 Cross-Domain & Conversion Tracking — stehlenauto.com ↔ Shopify checkout

**Problem this solves:** customers browse + add to cart on `stehlenauto.com`
(Next.js on Vercel), but **checkout happens on `stehlenauto.myshopify.com`**
(Shopify hosted checkout). Today GA4 (`G-YS6SFM9QFD`) only fires on the
Next.js site, so it sees sessions and `add_to_cart` but **never `purchase`** —
GA4 shows traffic with **$0 revenue / 0 conversions**, and the session that
converts is counted as a *new* (self-referral) session, destroying
attribution. Fixing this = accurate revenue, conversion rate, ROAS, and
channel attribution end-to-end.

There are two independent pieces. Do **both**.

---

## Part A — Fire GA4 events on the Shopify checkout

Shopify controls the checkout pages; you can't just paste `gtag` there. Use
Shopify's native Google connection so the thank-you page emits `purchase`.

1. Shopify admin → **Settings → Apps and sales channels → Shopify App Store**
   → install the **Google & YouTube** sales channel (if not already).
2. Open the channel → **Settings / Connect** → sign in with the Google account
   that owns the GA4 property `G-YS6SFM9QFD`.
3. Under the GA4 connection, select **the same property** `G-YS6SFM9QFD`
   (do NOT create a new property — we want one property across both domains so
   history/attribution stays unified).
4. Confirm Shopify is sending **GA4 ecommerce events** (it auto-sends
   `view_item`, `add_to_cart`, `begin_checkout`, `purchase` from checkout).

> Alternative (if not using the Google channel): Shopify admin → **Settings →
> Customer events → Add custom pixel**, paste a GA4 gtag/Measurement-Protocol
> pixel for `G-YS6SFM9QFD`. The Google channel is simpler and officially
> supported — prefer it.

**Verify:** place a test order, then GA4 → **Reports → Realtime** → confirm a
`purchase` event arrives with revenue.

---

## Part B — Cross-domain linking in GA4 (preserve the session across the hop)

So the session that starts on `stehlenauto.com` is the SAME session that
converts on `stehlenauto.myshopify.com` (GA4 passes the `client_id` via a
URL linker param on the cross-domain navigation).

1. GA4 → **Admin** (gear, bottom-left) → **Data streams** → click the web
   stream for `G-YS6SFM9QFD`.
2. **Configure tag settings** → **Configure your domains**.
3. Add **both** domains (match type "contains"):
   - `stehlenauto.com`
   - `stehlenauto.myshopify.com`
   - also add `shop.app` if Shop Pay is offered (Shop Pay redirects there).
4. Save. (Cross-domain linker is now active on outbound links/redirects to
   those domains.)

### Part B.2 — Exclude internal referrals (critical)

Otherwise the return from checkout looks like a brand-new referral session.

1. Same screen: **Configure tag settings** → **List unwanted referrals**.
2. Add (match type "contains"):
   - `myshopify.com`
   - `shopify.com`
   - `shop.app`
3. Save.

---

## Part C — Verify end-to-end (do not skip)

1. Open `stehlenauto.com` in a fresh/incognito session.
2. GA4 → Realtime → confirm your page_view appears (one active user = you).
3. Add to cart → proceed to checkout (lands on `*.myshopify.com`).
4. Complete a **test order**.
5. In GA4 Realtime you should see the SAME single user flow through
   `begin_checkout` → `purchase` (NOT two separate users). Revenue shows on
   the `purchase` event.
6. After ~24–48h, GA4 → Reports → Monetization → confirm revenue + a sane
   conversion rate (sessions that purchased ÷ sessions).

**Success = one continuous session from landing → purchase, with revenue
attributed to the original traffic source.**

---

## Notes / gotchas

- **One property, two streams is fine**, but simplest is one web stream
  (`G-YS6SFM9QFD`) receiving events from both the Next.js site (already wired
  in `src/components/analytics/scripts.tsx`) and Shopify (Part A).
- The Next.js site already sends `view_item` / `add_to_cart` / `begin_checkout`
  (`src/lib/analytics/client.ts`). `purchase` is the only event that must come
  from Shopify (Part A) — it's the one that's missing today.
- Don't double-count: if both Shopify AND the Next.js site fired `purchase`
  you'd inflate revenue — but the Next.js app never reaches a post-purchase
  page (checkout is off-site), so there's no overlap. Safe.
- Klaviyo (onsite) is separate and already wired; this runbook is GA4-only.
