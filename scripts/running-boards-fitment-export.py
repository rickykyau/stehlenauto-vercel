#!/usr/bin/env python3
"""
Cycle-3 deliverable for the warehouse / merch team.

Reads docs/iterations/2026-05-03-cycle-1/shopify-storefront-products.csv,
extracts every running-board / side-step listing, parses the bracket P/N
out of the tag list, and emits a verification CSV grouped by bracket so
the warehouse can pull one bracket and confirm fitment for every SKU
that ships with it.

Output: docs/iterations/2026-05-03-cycle-1/running-boards-warehouse-verification.csv
"""

from __future__ import annotations

import csv
import re
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "docs/iterations/2026-05-03-cycle-1/shopify-storefront-products.csv"
DST = ROOT / "docs/iterations/2026-05-03-cycle-1/running-boards-warehouse-verification.csv"
DST_NOTES = ROOT / "docs/iterations/2026-05-03-cycle-1/running-boards-warehouse-verification.md"

BRACKET_RE = re.compile(r"\bRBJZ-BR-[A-Z0-9]+-\d+P\b", re.IGNORECASE)
YEAR_RANGE_RE = re.compile(r"\b(19|20)\d{2}\s*[-–]\s*(19|20)?\d{2}\b")
CAB_PATTERNS = [
    "Crew Cab", "Quad Cab", "Extended Cab", "Double Cab",
    "SuperCab", "Super Cab", "SuperCrew", "Super Crew",
    "Regular Cab",
]
STEHLEN_VENDORS = {"stehlen auto", "stehlen"}

# Audit verdicts from parts-catalog-audit-remaining-7.md.
# Keyed by the substring of the bracket P/N that uniquely identifies the
# physical bracket family.
BRACKET_VERDICTS = {
    "RAM09":     ("Spans 2009-2022 in title; warehouse must confirm bracket fits BOTH the DS chassis (09-18) AND the DT Classic (19-22). DT new-body (19+) must be EXCLUDED.", "HARD HOLD - audit flagged"),
    "RAM191500": ("Title claims 2019-2024 Ram 1500 — confirm bracket is sized for the DT new-body chassis ONLY, not DS or DT Classic.", "Verify - new-body specific"),
    "F15015":    ("Title claims 2015-2023 F-150/Super Duty. Warehouse must confirm bracket fits BOTH P552 (15-20) AND P702 (21+) — different frame mounts. 2023 Super Duty also redesigned.", "HARD HOLD - audit flagged"),
    "TACO05":    ("Title claims 2005-2022 Tacoma. Warehouse must confirm bracket fits BOTH 2nd gen (05-15) AND 3rd gen (16-23) — different frame holes.", "HARD HOLD - audit flagged"),
    "SIL19":     ("Title claims 2019-2024 Silverado/Sierra. Confirm bracket spans T1XX (19-21) AND the 2022 fascia/frame refresh.", "Verify"),
    "COLO15":    ("Title claims 2015-2022 Colorado/Canyon. Confirm bracket fits the entire 2nd gen run.", "Verify"),
    "RANG19":    ("Title claims 2019-2023 Ranger Crew Cab. Confirm bracket is 5-ft-bed-only (US Ranger has no 6-ft bed).", "Verify"),
    "TUND":      ("Tundra running boards — confirm whether bracket spans 2nd gen + 2nd-gen-facelift + 3rd gen or just one.", "Verify"),
    "TIT":       ("Titan running boards - audit flagged A60/A61 split (2004-2024 spans both).", "HARD HOLD - audit flagged"),
}

def find_bracket(tags_field: str) -> str | None:
    m = BRACKET_RE.search(tags_field)
    return m.group(0).upper() if m else None

def find_year_range(title: str) -> str | None:
    m = YEAR_RANGE_RE.search(title)
    return m.group(0) if m else None

def find_cabs(title: str) -> str:
    found = [c for c in CAB_PATTERNS if c.lower() in title.lower()]
    return " | ".join(sorted(set(found)))

def bracket_family(pn: str | None) -> str | None:
    if not pn:
        return None
    for key in BRACKET_VERDICTS:
        if key in pn:
            return key
    return None

def main() -> int:
    if not SRC.exists():
        print(f"missing source: {SRC}", file=sys.stderr)
        return 1

    rows: list[dict[str, str]] = []
    with SRC.open(newline="") as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            ptype = row.get("productType", "").lower()
            if not any(k in ptype for k in ("running board", "side step", "nerf")):
                continue
            rows.append(row)

    out_rows: list[dict[str, str]] = []
    by_bracket: defaultdict[str, list[str]] = defaultdict(list)
    stehlen_handles: list[str] = []

    for row in rows:
        title = row.get("title", "")
        handle = row.get("handle", "")
        vendor = row.get("vendor", "")
        tags = row.get("tags", "")
        bracket = find_bracket(tags)
        family = bracket_family(bracket)
        verdict_note, verdict_label = (
            BRACKET_VERDICTS.get(family, ("Not in audit P0 list - verify normally.", "Verify"))
            if family
            else ("Bracket P/N not found in tags - inspect product manually.", "INSPECT - no bracket P/N")
        )
        year_range = find_year_range(title) or ""
        cabs = find_cabs(title)
        is_stehlen = vendor.lower() in STEHLEN_VENDORS
        if is_stehlen:
            stehlen_handles.append(handle)
        out_rows.append({
            "audit_verdict": verdict_label,
            "stehlen_branded": "YES" if is_stehlen else "",
            "bracket_pn": bracket or "",
            "year_range_claimed": year_range,
            "cabs_claimed": cabs,
            "vendor": vendor,
            "handle": handle,
            "title": title,
            "live_url": f"https://stehlenauto.com/products/{handle}",
            "verification_note": verdict_note,
            "raw_tags": tags,
        })
        if bracket:
            by_bracket[bracket].append(handle)

    # Order: hard-holds first, then Stehlen-branded, then everything else.
    def sort_key(r: dict[str, str]) -> tuple[int, int, str, str]:
        hold = 0 if r["audit_verdict"].startswith("HARD HOLD") else 1
        steh = 0 if r["stehlen_branded"] == "YES" else 1
        return (hold, steh, r["bracket_pn"] or "zzz", r["handle"])
    out_rows.sort(key=sort_key)

    cols = [
        "audit_verdict",
        "stehlen_branded",
        "bracket_pn",
        "year_range_claimed",
        "cabs_claimed",
        "vendor",
        "handle",
        "title",
        "live_url",
        "verification_note",
        "raw_tags",
    ]

    DST.parent.mkdir(parents=True, exist_ok=True)
    with DST.open("w", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=cols)
        w.writeheader()
        w.writerows(out_rows)

    # Bracket-grouped summary alongside the CSV for at-a-glance triage.
    lines = [
        "# Running boards & side steps - warehouse fitment verification",
        "",
        f"Source: `docs/iterations/2026-05-03-cycle-1/shopify-storefront-products.csv`  ",
        f"Generated by: `scripts/running-boards-fitment-export.py`  ",
        f"Total SKUs in scope: **{len(rows)}**  ",
        f"Stehlen-branded SKUs: **{len(stehlen_handles)}** (highest brand-trust risk)",
        "",
        "## Why this list",
        "",
        "Cycle-3 parts-specialist audit (`parts-catalog-audit-remaining-7.md`)",
        "flagged a pattern not seen in any other category: the same mounting",
        "bracket P/N is claimed across 2-3 chassis generations that don't",
        "share frame mounts. Estimated $45-70K/yr return risk if shipped to",
        "paid traffic as-is. **The 4 Stehlen-branded SKUs spanning 2009-2022 Ram**",
        "are the biggest brand-trust risk in the catalog - a Stehlen-labeled",
        "part that doesn't fit the truck in the title destroys customer trust",
        "no return-rate metric will capture.",
        "",
        "## How to use this CSV",
        "",
        "Each row is one live product on stehlenauto.com. Group by `bracket_pn`",
        "in Excel; for each bracket, the warehouse pulls one off the shelf,",
        "measures the frame-hole spacing, and confirms which of the years/cabs",
        "in `year_range_claimed` and `cabs_claimed` it actually fits. Then:",
        "",
        "- If the bracket fits the entire claim - mark **PASS**, leave the listing.",
        "- If it fits part of the claim - mark **SPLIT**, note the years to",
        "  split into separate products, and a developer will execute the",
        "  Shopify Admin merchandising flow.",
        "- If it doesn't fit anything claimed - mark **PULL**, the listing comes",
        "  down until correct brackets are sourced.",
        "",
        "## Bracket P/N summary",
        "",
        "| Bracket P/N family | SKUs using it | Audit verdict |",
        "|---|---|---|",
    ]
    for pn, handles in sorted(by_bracket.items()):
        family = bracket_family(pn)
        verdict = BRACKET_VERDICTS.get(family, ("",""))[1] if family else "Verify"
        lines.append(f"| `{pn}` | {len(handles)} | {verdict} |")
    lines.append("")
    lines.append("## Stehlen-branded SKUs (priority)")
    lines.append("")
    if stehlen_handles:
        for h in sorted(stehlen_handles):
            lines.append(f"- `{h}` - https://stehlenauto.com/products/{h}")
    else:
        lines.append("- (none)")
    lines.append("")
    lines.append("## Action requested from the merch / warehouse team")
    lines.append("")
    lines.append("1. Open `running-boards-warehouse-verification.csv` in Excel.")
    lines.append("2. Sort by `bracket_pn`. Confirm physical bracket fitment per family.")
    lines.append("3. Mark each row **PASS / SPLIT / PULL** in a new column.")
    lines.append("4. Send back so the development team can:")
    lines.append("   - tag SKUs needing a hold with a Shopify Admin tag (e.g. `_fitment-hold`),")
    lines.append("   - suppress the holds from sitemap + paid-traffic chrome,")
    lines.append("   - execute the SPLIT operations (variants vs new products) in Admin.")
    lines.append("")
    DST_NOTES.write_text("\n".join(lines) + "\n")

    print(f"wrote {DST}  ({len(out_rows)} rows)")
    print(f"wrote {DST_NOTES}")
    print(f"  - bracket families: {sorted(by_bracket)}")
    print(f"  - stehlen-branded SKUs: {len(stehlen_handles)}")
    return 0

if __name__ == "__main__":
    sys.exit(main())
