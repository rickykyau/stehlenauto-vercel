# Rithum (ChannelAdvisor) Photo Download — Server Runbook

Downloads product photos for the **426 new draft products** (created 2026-08-25)
from Rithum into per-item folders for partner review, ahead of Shopify upload.

## Files to copy to the server (e.g. `C:\Scripts\`)

| File | From repo |
|---|---|
| `Download-RithumPhotos.ps1` | `scripts/windows/` |
| `new-drafts-photo-queue-2026-08-25.csv` | `data/exports/` (426 rows: CBItemName, Category, Handle, Title) |

## Credentials

Same Rithum app + profiles as the fitment sync. Either fill the CONFIG block in
the script or set env vars (env wins): `CA_FITMENT_APPLICATION_ID`,
`CA_FITMENT_SHARED_SECRET`, `CA_FITMENT_REFRESH_TOKEN`, `CA_FITMENT_PROFILE_ID`
(comma-delimited, **order matters** — profile #1 is tried first).

## Picking logic (mirrors the fitment sync exactly)

1. Profiles tried in `CA_FITMENT_PROFILE_ID` order; fall through only when a
   profile has no usable match.
2. Within a profile, CA SKUs matching `<CBItemName>-…NNN` (3-digit tail) are
   candidates; `-601` / `-801` tails are always excluded (internal variants).
3. Ascending suffix order; the **first SKU with ≥1 image** wins — capture, stop.
4. Image files are numbered by the numeric tail of `PlacementName`
   (`ITEMIMAGEURL1..N`), sorted numerically (CA returns them in string order).

## Run

```powershell
# smoke-test one item, no downloads
powershell -ExecutionPolicy Bypass -File C:\Scripts\Download-RithumPhotos.ps1 -DryRun -ItemName FG-RAM14OE-ME-MB

# full dry run (~426 items x 2+ API calls at 250ms throttle ≈ 10-15 min)
powershell -ExecutionPolicy Bypass -File C:\Scripts\Download-RithumPhotos.ps1 -DryRun

# live
powershell -ExecutionPolicy Bypass -File C:\Scripts\Download-RithumPhotos.ps1
```

Re-runs skip items whose folder already has files (resume-safe); `-Force`
re-downloads. Exit 0 = all items got images; exit 3 = some `NO_IMAGES`/`ERROR`
rows in the manifest; exit 2 = config problem.

## Output

```
rithum-photos\<CBItemName>\01-ITEMIMAGEURL1.jpg, 02-ITEMIMAGEURL2.jpg, ...
logs\rithum-photos_<stamp>.log
logs\rithum-photos-manifest_<stamp>.csv   <- review index (item, profile, matched
                                             SKU, placement, URL, saved path;
                                             NO_IMAGES/ERROR rows for misses)
```

## Partner review workflow

1. Partner reviews each item folder: **delete** unwanted images, and make the
   intended featured image be the **lowest-numbered remaining file** (rename if
   needed — `01-…` = Shopify featured image).
2. Items in the manifest with `NO_IMAGES` need photos sourced elsewhere (CB
   pictures CSV or new shots) before their draft can publish.
3. When review is done, hand the `rithum-photos` folder + manifest back —
   the Shopify upload step (Claude-side, Admin API `productCreateMedia` in
   reviewed order, then publish in batches) takes it from there.

## Related

- Draft catalog + enrichment state: memory `project_new_item_pipeline.md`
- Featured-image reorder precedent: `scripts/catalog/apply-cb-pictures.mjs`
- Inventory sync (same server, same conventions): `scripts/windows/Sync-ShopifyInventory.ps1`
