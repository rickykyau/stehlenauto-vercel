# Google landing switch: Merchant Center → stehlenauto.com

> **STATUS: POSTPONED to January 2027 (owner, 2026-10-18).** Research found a blocker
> with the rule-based plan below. Google's Shopify-app help says the Merchant Center website
> "must be included on your list of domains in Shopify > Admin > Settings > Domains",
> and stehlenauto.com isn't on it (its DNS points to Vercel). The `link` rule is also tied
> to the Shopify app's data-source ID, and it vanishes when Shopify swaps the source
> (Content API → Merchant API). If it vanished, every link would revert to myshopify and be
> rejected. **January plan:** send Google our own product feed (Merchant API or a scheduled
> file) with stehlenauto.com links and the SAME product IDs (`shopify_US_<product>_<variant>`),
> so ad history, custom_label_3 bid groups and campaign filters carry over. Only do it if
> the new site has proven it sells (Brevo email traffic Nov–Dec). The Shopify primary domain stays
> stehlenauto.myshopify.com either way, to protect ChatGPT. The steps below are the old
> rule-based plan, kept for reference only.

Owner approved 2026-10-18 (then postponed, see above). **Goal:** Google ads and free listings link to
`stehlenauto.com/products/<handle>` instead of `stehlenauto.myshopify.com/products/<handle>`.

**Out of scope:** the Shopify primary domain stays `stehlenauto.myshopify.com`.
ChatGPT (Agentic Storefronts), the top order source, builds its links from the
Shopify primary domain, so leaving it alone leaves ChatGPT untouched. Both
storefronts keep working; this only changes which link Google shows.

## Why this needs care
- Merchant Center (MC) rejects products whose `link` domain doesn't match the
  claimed website ("Mismatched domains"). On Oct 9, an accidental primary-domain
  change got 76 products disapproved within hours.
- The Shopify Google & YouTube app keeps sending `link = https://stehlenauto.myshopify.com/products/...`.
  An MC attribute rule must rewrite it to `stehlenauto.com`, and the website
  claim must change to `stehlenauto.com` within minutes of the rule.
- Changing the claimed website can trigger an MC account re-review, which can
  pause listings for a few days. That's why this happens in late October, with
  4 weeks of buffer before the Black Friday sale (Nov 20).

## Before (Oct 21, owner's Chrome connected)
1. **Check the rule is possible.** MC → Settings → Data sources → the Shopify
   (Content API) source → Attribute rules. Confirm a `link` rule can be added
   (find and replace `stehlenauto.myshopify.com` → `stehlenauto.com`). If the
   source doesn't allow rules, **stop**: the switch can't be done without the
   Shopify primary domain change, which is out of scope.
2. **Check the claim can be verified.** MC → Business info → Website: confirm
   stehlenauto.com can be verified with the existing Google tag or DNS TXT record.
3. **Check what the app does.** In the Shopify Google & YouTube app, see whether
   it warns about or re-claims the website. If it would undo the claim, **stop**.
4. **Record the baseline:**
   - run `python3 scripts/ops/check-domain-switch.py check --new-site`;
   - note MC's approved, limited and disapproved product counts;
   - note Google Ads clicks and conversions.

## Switch (Oct 23 evening PT, owner at the keyboard for domain and claim clicks)
1. **Draft the rule.** Add the `link` attribute rule in MC as a draft, click
   **Test changes**, and spot-check 5 products show `https://stehlenauto.com/products/<handle>`.
2. **Claim the site.** Business info → Website → change to `https://stehlenauto.com`,
   then verify and claim it.
3. **Apply the rule** immediately after the claim.
4. **Check MC.** Open 3 products → final attributes → link =
   stehlenauto.com, and confirm each opens the right product on phone and desktop.
5. **Check ChatGPT is unchanged.** Run `check-domain-switch.py check`: the old
   links must still land on stehlenauto.myshopify.com, and checkout must be OK.

## Watch
- **Every few hours for 48 h:** MC disapprovals (especially "Mismatched domains"),
  account status and Ads delivery.
- **Daily until Nov 10:** ChatGPT orders (Shopify customerJourneySummary) and
  Google visitors on stehlenauto.com: add-to-cart, checkout and orders.

## Rollback
- **Bad results by Nov 10, or a disapproval wave that doesn't clear in 24 h:**
  delete the `link` rule and re-claim `stehlenauto.myshopify.com` (the Shopify
  Google app can redo the claim).
- **Fast nudge:** a resync of the products, the same as the Oct 9 nudge (see
  `data/logs/mc-resync-nudge-2026-10-09.json`).

## Nov 10 checkpoint
Compare Google visitors on stehlenauto.com with the Shopify-store baseline
(Oct 1–22) for add-to-cart rate, checkout rate and orders.
- **Equal or better:** keep it for the holidays.
- **Worse:** roll back that day.
