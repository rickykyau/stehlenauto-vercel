# Champions Reactivation — Draft Audit vs Live Site (2026-06-04)

Read-only audit of the 3 Brevo draft campaigns (ids 1/2/3) against the live
new stehlenauto.com. **Verdict: NOT safe to send as-is — 2 confirmed blockers + 1 high.**

## 🛑 BLOCKER 1 — Main CTA lands on an EMPTY page
All 3 emails' primary button links to `/collections/all`:
- `BROWSE PARTS FOR YOUR VEHICLE` (Email 1)
- `SEE UPGRADES FOR MY VEHICLE` (Email 2)
- `USE CODE DIRECT10 — SHOP NOW` (Email 3)

Live check:
| URL | Status | Products | Note |
|---|---|---|---|
| `/collections/all` | 200 | **0** | h1 "All", **empty-state shown** |
| `/collections` | 200 | n/a | category index (works — h1 "SHOP BY CATEGORY") |
| `/collections/tonneau-covers` | 200 | 24 | real collection (works) |

`/collections/all` is not a populated collection on the new site. **Every email would dump the customer on an empty page.**
**Fix:** repoint CTAs to a working destination — `/collections` (category index) or the homepage (YMM picker). For the vehicle-specific Emails 2/3, ideal is a vehicle-filtered URL.

## 🛑 BLOCKER 2 — Discount code DIRECT10 is EXPIRED
Shopify Admin lookup:
```
title:  DIRECT10 - Champions Reactivation
status: EXPIRED
window: 2026-03-28 → 2026-05-31   (today is 2026-06-04)
summary: 10% off entire order • one use per customer
```
All 3 emails hinge on DIRECT10. Email 1 also hardcodes **"10% off ... through May 31"** (a past date).
**Fix (business decision):** create a new active code or extend DIRECT10's `endsAt` to a future date, AND update Email 1's date copy.

## ⚠️ HIGH 3 — From-name is a literal placeholder
Campaign sender name reads **`[DEFAULT_FROM_NAME]`** (not "Stehlen Auto"). That is not Brevo merge syntax — recipients may literally see "From: [DEFAULT_FROM_NAME]".
**Fix:** set sender name to `Stehlen Auto`; confirm with a seed/test send before any real send.

## ✅ PASSES (no action)
- No stale address (no Corona/Rincon/92878).
- No "$99 minimum" — copy says "Free shipping on all orders" ✅ matches current policy.
- Merge tags well-formed with safe defaults: `{{ contact.FIRSTNAME | default: "there" }}`, `VEHICLE_MAKE/MODEL`.
- Sender domain `info@updates.stehlenauto.com` active; reply-to `info@stehlenauto.com`.
- All hrefs are HTTPS and resolve 200.
- Subject lines intact; UTM tags present (`utm_source=brevo` etc.).

## Required before ANY send (ordered)
1. **[owner]** Decide the offer → create/extend the discount code in Shopify.
2. **[can do]** Repoint the CTA links in all 3 drafts to a working URL.
3. **[can do]** Set from-name to "Stehlen Auto".
4. **[owner]** Update Email 1's "through May 31" → new expiry.
5. **Re-run this audit + seed/test send** to yourself, then pilot (top ~500 LTV), scheduled via `scheduledAt` — never `sendNow`.
