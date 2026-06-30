# OpenAI ACP product feed (ChatGPT merchant)

Feed for OpenAI's **Agentic Commerce Protocol** product spec (the format the
ChatGPT merchant program ingests — *not* a Google Shopping feed).

## Build / refresh

```bash
python3 scripts/build-openai-acp-feed.py
```

Pulls all **active** Shopify products live and writes (this dir, gitignored):

| file | use |
|---|---|
| `products.jsonl` | one product per line (human-readable) |
| `products.jsonl.gz` | **the deliverable** — gzipped JSONL for SFTP upload |
| `sample.json` | first 3 rows, for eyeballing |
| `report.txt` | counts, brand distribution, any skips |

Latest build: **1,322 products, 0 skipped, 0 validation issues** (387 out_of_stock,
brands: 1,176 Stehlen Auto / 146 CURT).

## Delivery (when OpenAI opens onboarding)

OpenAI assigns an **SFTP endpoint + `account_id`/`feed_id`** during onboarding.
Upload `products.jsonl.gz` there. Re-run the build + re-upload on catalog changes
(or wire a cron once the cadence is known).

## Field decisions (see script header for full rationale)

- `is_eligible_search = true` — **required to be discoverable** (spec default is
  `false` = invisible).
- `is_eligible_checkout = false` — discovery only; checkout redirects to our
  storefront (matches OpenAI's Mar-2026 pivot). Flip to `true` only after wiring
  ACP checkout (also needs `seller_privacy_policy` + `seller_tos`, already set).
- `url` = canonical `https://stehlenauto.com/...` (never the *.myshopify.com host).
- `brand` = real brands kept (CURT); supplier codes / Generic / blank → "Stehlen Auto".
- Fitment (year/make/model) rides in `title` + the "Vehicle Fitment" block in
  `description` — the signal ChatGPT uses to match a part to the shopper's vehicle.
- `price` = `"165.00 USD"`, `availability` = `in_stock`/`out_of_stock` from Shopify.

Spec verified against developers.openai.com/commerce (version 2026-01-30).
