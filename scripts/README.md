# scripts/

Run from the repo root (e.g. `python3 scripts/fitment/build-ymm-index.py`,
`node scripts/catalog/publish-descriptions.mjs`, `pnpm tsx scripts/fitment/sync-ca-fitment.ts`).

| Folder | What's in it |
|---|---|
| `catalog/` | Shopify listing work: descriptions, titles, photos, brands, SKU/handle maps |
| `fitment/` | ChannelAdvisor fitment sync, YMM index build, manual corrections, exports |
| `seo/` | category facts (FAQ/llms.txt), IndexNow, OpenAI product feed |
| `reviews/` | Amazon review ingestion and matching |
| `ops/` | CB shipping methods, sourcing-gap PDF, API probes |
| `db/` | one-time database table setup |
| `windows/` | PowerShell scheduled tasks that run on JL-SQL (inventory + listing sync) |

Main recurring commands:
- `pnpm tsx -r dotenv/config scripts/fitment/sync-ca-fitment.ts --handles-file=… --merge=true` (DOTENV_CONFIG_PATH=.env.local)
- `python3 scripts/fitment/build-ymm-index.py` then `python3 scripts/seo/build-category-facts.py`
- `node scripts/catalog/publish-descriptions.mjs --dir <batch> --apply` (logs to `data/logs/description-rewrite-log/`)

Conventions: repo root = `path.resolve(__dirname, "../..")` / `Path(__file__).resolve().parents[2]`;
write logs to `data/logs/`, read fix lists from `data/changes/`.
