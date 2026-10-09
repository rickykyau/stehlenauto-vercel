# data/

**Top level** — files the website or the build scripts read. Don't move or rename them.

| Folder | What |
|---|---|
| `logs/` | run and rollback logs written by scripts (photo swaps, description rewrites, fitment corrections — the CA sync reads `fitment-corrections-log-*` to protect manual fixes) |
| `changes/` | reviewed fix lists and plans fed to scripts (title fixes, fitment corrections, photo plans) |
| `source/` | imported spreadsheets, audits and mappings (CB, Amazon reviews, SKU maps, templates) |
| `exports/` | files produced for people (xlsx/csv/pdf) |

Only the top level is deployed; `logs/`, `changes/`, `source/` and `exports/` are excluded in `.vercelignore`.
