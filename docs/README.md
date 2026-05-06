# `docs/`

Working documentation for the Stehlen Auto storefront rebuild.

```
docs/
├── design-handoffs/        Handoff bundles from claude.ai/design (per date)
│   ├── 2026-05-02-stehlen-storefront/  initial home/collection/PDP set
│   └── 2026-05-03-stehlen-storefront/  full storefront expansion
├── reference/              Locked-in research: fitment audits, taxonomy, competitor crawl
├── runbooks/               Operations docs (DNS cutover, etc.)
└── screenshots/            Curated UI screenshots, organized by phase / handoff
    ├── phase-1/            Chrome + home page (2026-05-02)
    ├── phase-2/            Collection + PDP
    ├── phase-3/            Clerk + garage + cart
    ├── phase-4/            Analytics + predictive search
    ├── phase-5/            JSON-LD, real chat, real orders
    └── 2026-05-03-handoff/ Pages added in the second design handoff
```

## Conventions

- **Handoff bundles**: drop the `.gz` and `.tar` archives after extracting — they're huge and the
  extracted folders are the readable source of truth. `.gitignore` enforces this.
- **Screenshots**: only commit a screenshot if it documents a feature, regression, or design
  decision. Ad-hoc Playwright captures should stay in `.playwright-mcp/` (gitignored) or be
  deleted. When committing, place under `docs/screenshots/<phase-or-handoff>/`.
- **Reference docs**: anything in `docs/reference/` is locked architecture — read before
  changing the related code, do not silently override.
