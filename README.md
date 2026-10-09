# Stehlen Auto storefront

Next.js 16 storefront for [stehlenauto.com](https://stehlenauto.com), hosted on Vercel,
with Shopify (catalog + checkout), Clerk (accounts) and Neon Postgres (garage, reviews).

```bash
pnpm install
pnpm dev            # http://localhost:3000  (needs .env.local — see .env.example)
pnpm test           # unit tests
pnpm test:e2e       # Playwright smoke tests
```

Deploy: `vercel --prod --archive=tgz`.

Where things live (full map in [CLAUDE.md](CLAUDE.md#repository-layout-keep-it-this-way)):

| Folder | What |
|---|---|
| `src/` | the website |
| `config/` | test, database and Lighthouse configs |
| `scripts/<area>/` | catalog, fitment, seo, reviews, ops, db maintenance scripts |
| `data/` | data the site reads; `logs/`, `changes/`, `source/`, `exports/` for working files |
| `docs/` | reference, runbooks, QA |
| `marketing/` | analytics, email, feeds, AI video work |
