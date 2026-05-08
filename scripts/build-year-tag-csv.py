#!/usr/bin/env python3
"""
Cycle 14AE — fix the catalog year-tag gap.

The auto-parts-specialist audit found 749/1322 products (57%) have fewer
year:YYYY tags in Shopify than the CA fitment snapshot says they fit.
686 products (52%) have ZERO year tags. Tonneau covers, bed mats, and
running boards are 100% un-tagged. Customers picking a year on the
collection sidebar see zero results for those categories.

This script reads data/ca_fitment_snapshot.json (the authoritative
ChannelAdvisor sync), expands parsed.years and parsed.makes per product,
and emits a Shopify-import-compatible CSV with the correct tag set.

Owner workflow:
  1. python3 scripts/build-year-tag-csv.py
  2. Open Shopify Admin → Products → Import → tags-fix-YYYY-MM-DD.csv
  3. Choose "Overwrite existing values" for the Tags column
  4. Smoke-test: visit /collections/tonneau-covers, open year facet,
     confirm 2009-2024 all show with non-zero counts
"""
import csv
import json
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SNAPSHOT = ROOT / "data" / "ca_fitment_snapshot.json"
OUT = ROOT / f"shopify-tags-fix-{date.today().isoformat()}.csv"

# Some product titles use both Ram and Dodge — the brand split mid-2010.
# Tag both so customers searching either find the product.
MAKE_ALIASES = {
    "Ram": ["Ram", "Dodge"],
    "Dodge": ["Dodge", "Ram"],
    "Chevrolet": ["Chevrolet", "Chevy"],
    "Chevy": ["Chevy", "Chevrolet"],
}


def expand_makes(makes: list[str]) -> set[str]:
    out: set[str] = set()
    for m in makes:
        m_clean = m.strip()
        if not m_clean:
            continue
        if m_clean in MAKE_ALIASES:
            out.update(MAKE_ALIASES[m_clean])
        else:
            out.add(m_clean)
    return out


def build_tag_set(parsed: dict) -> set[str]:
    tags: set[str] = set()
    for y in parsed.get("years", []) or []:
        y_clean = str(y).strip()
        if y_clean.isdigit():
            tags.add(f"year:{y_clean}")
    for m in expand_makes(parsed.get("makes", []) or []):
        tags.add(f"make:{m}")
    for mod in parsed.get("models", []) or []:
        mod_clean = mod.strip()
        if mod_clean:
            tags.add(f"model:{mod_clean}")
    return tags


def main() -> int:
    if not SNAPSHOT.exists():
        print(f"FATAL: {SNAPSHOT} not found. Run the CA fitment sync first.", file=sys.stderr)
        return 1

    with SNAPSHOT.open() as f:
        data: dict[str, dict] = json.load(f)

    rows: list[dict[str, str]] = []
    skipped_no_parse = 0
    skipped_unsynced = 0
    for handle, entry in data.items():
        if entry.get("status") != "synced":
            skipped_unsynced += 1
            continue
        parsed = entry.get("parsed") or {}
        tags = build_tag_set(parsed)
        if not tags:
            skipped_no_parse += 1
            continue
        rows.append(
            {
                "Handle": handle,
                # Shopify Tags column is comma-separated. Sort for deterministic output.
                "Tags": ", ".join(sorted(tags)),
                # Tags Command tells the Shopify importer how to merge.
                "Command": "MERGE",
            }
        )

    with OUT.open("w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["Handle", "Tags", "Command"])
        writer.writeheader()
        writer.writerows(rows)

    print(f"Wrote {len(rows)} rows to {OUT.name}")
    print(f"Skipped {skipped_unsynced} unsynced products + {skipped_no_parse} with no parsed fitment.")
    print()
    print("Sample (first 3 rows):")
    for row in rows[:3]:
        print(f"  {row['Handle']}")
        print(f"    {row['Tags']}")
    print()
    print("Next: Shopify Admin → Products → Import → choose this CSV → 'Overwrite' for Tags.")
    print("Then re-run scripts/build-sibling-index.ts and redeploy so the year facet picks up the new tags.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
