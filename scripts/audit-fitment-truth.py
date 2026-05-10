#!/usr/bin/env python3
"""
Cycle 14AR — Fitment ground-truth extractor for QA audits.

For a given (year, make, model) and category handle, returns:
  - Products that SHOULD fit (per CA snapshot fitmentRaw)
  - Products that should be EXCLUDED (don't fit this vehicle)
  - Products that are UNIVERSAL-fit (no specific YMM in their fitmentRaw,
    e.g., "8-drop-trailer-hitch-ball-mount-2-receiver" with no make/model)

This is the canonical truth the live site MUST match. Any product shown on
/collections/<handle> for this vehicle that ISN'T in fits[] or universals[]
is a false-positive bug. Any product in fits[] that ISN'T shown on the live
page is a false-negative bug.

Usage:
  python3 scripts/audit-fitment-truth.py --year 2021 --make Ford --model "F-150" --category bull-guards-grille-guards
"""
from __future__ import annotations

import argparse
import json
import re
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).parent.parent
SNAPSHOT = ROOT / "data" / "ca_fitment_snapshot.json"

# Category → keyword(s) that match product handle / title (mirrors
# CATEGORY_FALLBACK_KEYWORD in src/lib/catalog/index.ts)
CATEGORY_KEYWORDS: dict[str, list[str]] = {
    "front-grilles": ["grille", "grill"],
    "bull-guards-grille-guards": ["bull guard", "grille guard", "bull bar"],
    "truck-bed-mats": ["bed mat", "bedmat"],
    "tonneau-covers": ["tonneau"],
    "running-boards-side-steps": ["running board", "side step", "nerf"],
    "trailer-hitches": ["trailer hitch", "hitch receiver", "hitch ball", "ball mount"],
    "headlights": ["headlight", "head light"],
    "molle-panels": ["molle"],
    "chase-racks-sport-bars": ["chase rack", "sport bar"],
    "roof-racks-baskets": ["roof rack", "roof basket"],
    "floor-mats": ["floor mat"],
    "under-seat-storage": ["under seat", "under-seat"],
}

MAKE_ALIASES = {
    "ford": ["ford"],
    "chevrolet": ["chevrolet", "chevy"],
    "gmc": ["gmc"],
    "ram": ["ram", "dodge ram", "dodge"],
    "dodge": ["dodge"],
    "toyota": ["toyota"],
    "nissan": ["nissan"],
    "jeep": ["jeep"],
    "honda": ["honda"],
    "subaru": ["subaru"],
    "volkswagen": ["volkswagen", "vw"],
    "bmw": ["bmw"],
    "audi": ["audi"],
}


def normalize_make(s: str) -> str:
    return s.strip().lower()


def normalize_model(s: str) -> str:
    return s.strip().lower()


def matches_category(handle: str, title_hint: str, category: str) -> bool:
    kws = CATEGORY_KEYWORDS.get(category, [])
    if not kws:
        return False
    # Match against handle (always lowercased w/ dashes) AND title hint
    haystack = (handle + " " + title_hint).lower().replace("-", " ")
    return any(kw in haystack for kw in kws)


def parse_fitment_raw(raw: str) -> list[dict[str, str]]:
    """Parse fitmentRaw lines into structured (year, make, model, submodel) tuples."""
    out = []
    for line in raw.splitlines():
        line = line.split("::", 1)[0].strip()  # strip notes
        if not line or "|" not in line:
            continue
        parts = [p.strip() for p in line.split("|")]
        if len(parts) < 3:
            continue
        out.append({
            "year": parts[0],
            "make": parts[1],
            "model": parts[2],
            "submodel": parts[3] if len(parts) >= 4 else "",
        })
    return out


def vehicle_fits(line: dict[str, str], year: str, make: str, model: str) -> bool:
    """Does this CA fitment line match the customer's vehicle?"""
    if line["year"] != year:
        return False
    line_make = normalize_make(line["make"])
    target_make = normalize_make(make)
    aliases = MAKE_ALIASES.get(target_make, [target_make])
    if line_make not in aliases:
        return False
    line_model = normalize_model(line["model"])
    target_model = normalize_model(model)
    # Exact OR target is contained in line model (e.g., "F-150" matches "F-150 Heritage")
    return line_model == target_model or line_model.startswith(target_model)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--year", required=True)
    p.add_argument("--make", required=True)
    p.add_argument("--model", required=True)
    p.add_argument("--category", required=True)
    p.add_argument("--limit", type=int, default=24, help="Limit per bucket for readability")
    args = p.parse_args()

    print(f"\n=== Ground truth: {args.year} {args.make} {args.model} / {args.category} ===\n")

    with SNAPSHOT.open() as f:
        snapshot = json.load(f)

    fits = []           # explicit YMM fit
    excludes = []       # explicit fitmentRaw but NOT this vehicle
    universals = []     # no fitmentRaw at all (truly universal-fit products)
    not_in_category = []

    for handle, entry in snapshot.items():
        in_cat = matches_category(handle, entry.get("cbItemName", ""), args.category)
        if not in_cat:
            not_in_category.append(handle)
            continue

        raw = entry.get("fitmentRaw", "")
        if not raw.strip():
            universals.append(handle)
            continue

        lines = parse_fitment_raw(raw)
        if not lines:
            universals.append(handle)
            continue

        if any(vehicle_fits(line, args.year, args.make, args.model) for line in lines):
            fits.append(handle)
        else:
            excludes.append(handle)

    print(f"Should FIT ({len(fits)} products):")
    for h in fits[: args.limit]:
        print(f"  ✓ {h}")
    if len(fits) > args.limit:
        print(f"  ... and {len(fits) - args.limit} more")

    print(f"\nUNIVERSAL fit ({len(universals)} products) — should also be shown:")
    for h in universals[: args.limit]:
        print(f"  · {h}")
    if len(universals) > args.limit:
        print(f"  ... and {len(universals) - args.limit} more")

    print(f"\nShould be EXCLUDED ({len(excludes)} products in category but wrong YMM):")
    for h in excludes[:10]:
        print(f"  ✗ {h}")
    if len(excludes) > 10:
        print(f"  ... and {len(excludes) - 10} more (sample only)")

    print(f"\nNot in category: {len(not_in_category)} products")
    print(f"\n--- TOTAL EXPECTED ON LIVE PAGE: {len(fits) + len(universals)} ---")
    print(f"  ({len(fits)} exact fit + {len(universals)} universal)")


if __name__ == "__main__":
    main()
