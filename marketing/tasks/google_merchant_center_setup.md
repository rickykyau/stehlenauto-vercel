# Google Merchant Center Setup Guide

**Assigned to:** Partner
**Priority:** High — feed approval takes 3-7 business days, start ASAP
**Estimated time:** 1-2 hours (plus 3-7 day wait for Google review)

---

## Overview

Google Merchant Center (GMC) is where your product feed lives. It's required before you can run Google Shopping ads. The product feed syncs from Shopify automatically via the Google & YouTube channel app.

---

## Step 1: Create Google Merchant Center Account (10 min)

1. Go to **https://merchants.google.com**
2. Sign in with the Google account used for GA4 analytics
3. Fill in:
   - Business name: **Stehlen Auto**
   - Website: **https://stehlenauto.com**
   - Country: **United States**
   - Business address: 21912 Garcia Lane, City of Industry, CA 91789
4. Accept terms of service

---

## Step 2: Verify Website Ownership (5-15 min)

Google needs to verify you own stehlenauto.com. Choose one method:

### Option A: Google Analytics (Easiest)
- If you're signed in with the same Google account that owns GA4 property 529120634, Google will auto-verify.
- Just click "Verify" and it should confirm immediately.

### Option B: HTML Tag
- Google gives you a `<meta>` tag to add to the site's `<head>`
- This requires adding it in the Lovable editor to `index.html`
- Verify after the tag is deployed

### Option C: Google Search Console
- If Google Search Console is already set up for stehlenauto.com with the same account, it auto-verifies

---

## Step 3: Connect Shopify Product Feed (15 min)

1. Log into **Shopify Admin** at https://http-stehlenauto-com.myshopify.com/admin
2. Go to **Sales channels** (left sidebar) → **Google & YouTube**
   - If the app isn't installed yet: go to Shopify App Store → search "Google & YouTube" → Install
3. Click **Connect Google account** → sign in with the same Google account as Merchant Center
4. Follow the prompts to connect:
   - Select your Merchant Center account
   - Accept the product feed sync
5. Shopify will automatically sync all **1,330 products** as a product feed
6. Set feed refresh to **every 4 hours** (under feed settings)

### Important Settings in the Google Channel:
- **Target country:** United States
- **Language:** English
- **Shipping:** Free shipping on all orders (match our site policy)

---

## Step 4: Wait for Initial Feed Sync (24 hours)

After connecting, it takes about 24 hours for all products to sync and for Google to process the feed. Come back the next day to check for issues.

---

## Step 5: Fix Feed Disapprovals (30-60 min)

Expect **200-400 product disapprovals** on the first sync. This is normal for aftermarket auto parts catalogs. Here's how to fix the most common issues:

### Issue 1: Missing GTIN/UPC (most common)
- **What it means:** Google wants a barcode number (GTIN/UPC/EAN) for each product
- **The fix:** Aftermarket auto parts typically don't have GTINs. In Shopify Google channel settings, set **`identifier_exists`** to **`false`** for products without GTINs
- This tells Google "this is a legitimate product that doesn't have a standard barcode"

### Issue 2: Price Mismatch
- **What it means:** The price in the feed doesn't match what's on the website
- **The fix:** Ensure all Shopify prices are current. The feed pulls directly from Shopify variant prices.

### Issue 3: Missing/Low Quality Images
- **What it means:** Products with placeholder images or no images get disapproved
- **The fix:** Every product needs at least 1 real product photo (not a stock image or placeholder). Check which products are flagged and add proper images in Shopify.

### Issue 4: Missing Shipping Information
- **The fix:** In Google Merchant Center → Settings → Shipping and returns:
  - Add a shipping service: "Free Shipping"
  - Country: United States
  - All products
  - Cost: $0 (free)
  - Delivery time: 3-7 business days

### Issue 5: Missing Tax Information
- **The fix:** In Google Merchant Center → Settings → Tax:
  - Select "Automatically calculate tax" OR
  - Match your Shopify tax settings

---

## Step 6: Set Up Shipping & Returns in GMC (10 min)

In Merchant Center → **Settings → Shipping and returns**:

### Shipping:
- Service name: "Free Shipping"
- Country: United States
- Applies to: All products
- Shipping cost: Free ($0)
- Handling time: 1-2 business days
- Transit time: 3-7 business days

### Returns:
- Return policy URL: https://stehlenauto.com/help (or your returns page)
- Return window: 30 days
- Return method: By mail
- Restocking fee: None

---

## Step 7: Wait for Google Review (3-7 business days)

After fixing disapprovals:
1. Google will re-review the feed
2. Check back daily in Merchant Center → **Products → Diagnostics** for status updates
3. Products will move from "Disapproved" to "Active" as issues are resolved

---

## What NOT to Do

- **Don't create Google Ads campaigns yet** — we'll do that together after the feed is fully approved
- **Don't enable "Free listings"** until the feed is clean (too many disapprovals hurts your account quality)
- **Don't change product prices or titles** in the Google channel — let it sync from Shopify
- **Don't use a different Google account** — must be the same account linked to GA4

---

## Products to Exclude from the Feed

These products should NOT be advertised (high return rates or low margins). If you see them in the feed, you can set them to "Excluded" in the Shopify Google channel:

- Any SKU ending in **-901** suffix (known quality issues)
- **LED headlight** products (37% margin + 10-15% return rate)
- Product: **th-x507-c077-901** specifically (82% return rate)

A full exclusion list is at: `data/exports/products_exclude_list.csv` (327 products)

---

## Checklist

- [ ] Google Merchant Center account created
- [ ] Website verified
- [ ] Shopify Google & YouTube channel connected
- [ ] Product feed syncing (1,330 products)
- [ ] Shipping settings configured (free shipping)
- [ ] Tax settings configured
- [ ] Feed disapprovals reviewed and fixed
- [ ] Waiting for Google review (3-7 days)

---

## Credentials Needed

| What | Where to Find |
|---|---|
| Google account login | Same account linked to GA4 (property 529120634) |
| Shopify Admin | https://http-stehlenauto-com.myshopify.com/admin |
| GA4 property ID | 529120634 |
| GA4 measurement ID | G-YS6SFM9QFD |

---

## Questions?

If you run into issues, take a screenshot and share it. Common problems:
- "Website not claimed" → need to re-verify ownership
- "Account suspended" → usually a policy violation, contact Google support
- "Feed processing error" → check Diagnostics tab for specific product errors
