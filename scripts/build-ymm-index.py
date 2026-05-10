#!/usr/bin/env python3
"""
Cycle 14AQ — Build canonical YMM tree + per-vehicle dimensions from
data/ca_fitment_snapshot.json.

Replaces:
  - data/ymm_tree.json         (was built from raw Shopify tags, had
                                 cross-mapped typos like "Chevrolet Sierra")
  - hardcoded VEHICLE_BED_LENGTHS / VEHICLE_CAB_TYPES / trim arrays in
    src/lib/fitment/sub-model.ts (now read from data/ymm_dimensions.json)

Source of truth: ChannelAdvisor ACES fitment snapshot. Each product entry
has a `fitmentRaw` field with one line per fitting vehicle:
  YEAR|MAKE|MODEL|SUBMODEL[::Notes]

The submodel field encodes trim + body style + cab type + door count, e.g.:
  "EX Sport Utility 4-Door"   → trim=EX, body=Sport Utility, doors=4-Door
  "SLT Crew Cab Pickup 4-Door 5.5 ft. Bed"
                              → trim=SLT, cab=Crew Cab, doors=4-Door, bed=5.5 ft. Bed
  "Base Coupe 2-Door"         → trim=Base, body=Coupe, doors=2-Door

Outputs:
  data/ymm_tree.json
    { "<year>": { "<Make>": { "<Model>": ["<product-handle>", ...] } } }

  data/ymm_dimensions.json
    { "<year>|<Make>|<Model>": {
        "trims": ["Base", "SLE", "Denali", ...],
        "bedLengths": ["5.5' BED", "6.5' BED", "8' BED"],
        "cabTypes": ["CREW CAB", "SUPERCAB", "REGULAR CAB"],
        "doors": ["4-Door"]
      }
    }
"""
from __future__ import annotations

import json
import re
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).parent.parent
SNAPSHOT = ROOT / "data" / "ca_fitment_snapshot.json"
OVERRIDES = ROOT / "data" / "ymm_overrides.json"
TREE_OUT = ROOT / "data" / "ymm_tree.json"
DIMS_OUT = ROOT / "data" / "ymm_dimensions.json"
# Cycle 14AR-fix2 (QA-found BUG-14AR-3+4): per-YMM list of every product
# handle that fits, sourced from CA fitmentRaw. Used by the collection
# page to ensure slow-selling fitting products aren't hidden by the
# top-N BEST_SELLING wide-pool cap.
PRODUCTS_BY_YMM_OUT = ROOT / "data" / "products_by_ymm.json"

# Body style anchors — trim is everything before the FIRST occurrence of one
# of these tokens. Order matters: longer multi-word anchors first so they're
# matched as a single unit (otherwise "Crew Cab" would match "Cab" and lose
# the "Crew" prefix into the trim).
BODY_ANCHORS = [
    # Pickup-truck cab variants (longest first)
    "Crew Cab Pickup",
    "Extended Cab Pickup",
    "Regular Cab Pickup",
    "Standard Cab Pickup",
    "Quad Cab Pickup",
    "Mega Cab Pickup",
    "Double Cab Pickup",
    "Access Cab Pickup",
    "King Cab Pickup",
    "SuperCrew Pickup",
    "SuperCab Pickup",
    "CrewMax Pickup",
    "Cab Plus Pickup",
    # Bare cab terms
    "Crew Cab",
    "Extended Cab",
    "Regular Cab",
    "Standard Cab",
    "Quad Cab",
    "Mega Cab",
    "Double Cab",
    "Access Cab",
    "King Cab",
    "SuperCrew",
    "SuperCab",
    "CrewMax",
    "Cab Plus",
    # Body styles
    "Sport Utility",
    "Mini Cargo Van",
    "Mini Passenger Van",
    "Cargo Van",
    "Passenger Van",
    "Hatchback",
    "Convertible",
    "Coupe",
    "Sedan",
    "Wagon",
    "Pickup",
    "Roadster",
    "Targa",
    "Limousine",
]

# Cab-type token → canonical chip label
CAB_CANONICAL = {
    "Crew Cab": "CREW CAB",
    "Crew Cab Pickup": "CREW CAB",
    "CrewMax": "CREW CAB",
    "CrewMax Pickup": "CREW CAB",
    "Quad Cab": "CREW CAB",
    "Quad Cab Pickup": "CREW CAB",
    "Mega Cab": "CREW CAB",
    "Mega Cab Pickup": "CREW CAB",
    "Double Cab": "CREW CAB",
    "Double Cab Pickup": "CREW CAB",
    "Extended Cab": "SUPERCAB",
    "Extended Cab Pickup": "SUPERCAB",
    "Access Cab": "SUPERCAB",
    "Access Cab Pickup": "SUPERCAB",
    "King Cab": "SUPERCAB",
    "King Cab Pickup": "SUPERCAB",
    "SuperCab": "SUPERCAB",
    "SuperCab Pickup": "SUPERCAB",
    "SuperCrew": "CREW CAB",
    "SuperCrew Pickup": "CREW CAB",
    "Cab Plus": "SUPERCAB",
    "Cab Plus Pickup": "SUPERCAB",
    "Regular Cab": "REGULAR CAB",
    "Regular Cab Pickup": "REGULAR CAB",
    "Standard Cab": "REGULAR CAB",
    "Standard Cab Pickup": "REGULAR CAB",
}

# Bed length parser: matches "5.5 ft. Bed" / "5'6\" Bed" / "6 ft Bed" etc.
# Returns canonical chip label like "5.5' BED".
BED_PATTERNS = [
    # "5.5 ft. Bed" or "5.5 ft Bed"
    (re.compile(r"\b(\d+(?:\.\d+)?)\s*ft\.?\s*Bed\b", re.I),
     lambda m: f"{_fmt_bed(m.group(1))}' BED"),
    # "5'6\" Bed" → 5.5' BED  (foot+inch)
    (re.compile(r"\b(\d+)\'(\d+)(?:\")?\s*Bed\b"),
     lambda m: f"{_inch_to_decimal(m.group(1), m.group(2))}' BED"),
]

# Door extractor (e.g., "4-Door", "2-Door", "3-Door")
DOOR_RE = re.compile(r"\b(\d+)\s*-\s*Door\b", re.I)


def _fmt_bed(s: str) -> str:
    f = float(s)
    # Normalize trailing .0 → integer
    return str(int(f)) if f.is_integer() else str(f)


# Public alias used in main() — same as _fmt_bed
def _fmt_bed_py(s: str) -> str:
    return _fmt_bed(s)


def _inch_to_decimal(ft: str, inch: str) -> str:
    f = int(ft) + int(inch) / 12.0
    return str(int(f)) if f.is_integer() else f"{f:.1f}".rstrip("0").rstrip(".")


def extract_trim(submodel: str) -> str | None:
    """Return everything before the first body anchor, or None if no anchor matched."""
    s = submodel.strip()
    if not s:
        return None
    # Strip trailing bed-length / door fragments first so they don't end up in trim
    s = DOOR_RE.sub("", s)
    for pat, _ in BED_PATTERNS:
        s = pat.sub("", s)
    s = re.sub(r"\s+", " ", s).strip()

    # Find earliest anchor position
    earliest = len(s)
    for anchor in BODY_ANCHORS:
        idx = s.find(anchor)
        if idx >= 0 and idx < earliest:
            earliest = idx
    if earliest == len(s):
        # No anchor — submodel is something like a trim-only string; treat the
        # whole thing as the trim only if it doesn't look like a body fragment.
        return s if s and len(s) <= 40 else None
    trim = s[:earliest].strip()
    return trim if trim else None


def extract_cab(submodel: str) -> str | None:
    for token, canonical in CAB_CANONICAL.items():
        if token in submodel:
            return canonical
    return None


def extract_bed(submodel: str) -> str | None:
    for pat, formatter in BED_PATTERNS:
        m = pat.search(submodel)
        if m:
            return formatter(m)
    return None


def extract_doors(submodel: str) -> str | None:
    m = DOOR_RE.search(submodel)
    if m:
        return f"{m.group(1)}-Door"
    return None


# Cycle 14AQ-fix1 (owner): retail-shopper trim filter. Stehlen sells to
# retail consumers modifying their personal trucks/SUVs/Jeeps — landscapers,
# weekend builders, mechanics. The CA fitment data carries fleet / police /
# government variants AND foreign-market (Mexico/Latin America) trims that
# poison the picker for our actual audience. Drop any trim whose name is
# (a) a known fleet/government variant, (b) a Spanish-language / non-US
# market designator, or (c) a generic "Special" prefix without a real trim
# meaning.
FLEET_TRIM_BLOCKLIST = {
    "SSV", "Special Service", "Police", "Police Responder",
    "Police Interceptor", "Police Pursuit", "Pursuit", "Taxi",
    "Cab Forward", "Cab & Chassis", "Stripped Chassis", "Commercial",
    "Crew Cab Stripped Chassis",
}
FOREIGN_MARKET_TRIM_BLOCKLIST = {
    "Edicion Especial", "Edicion Limitada", "Edicion",
    "WT Doble Cabina", "Doble Cabina", "Cabina Doble",
    "GT Milenio", "Milenio", "Sport Tipo R", "Tipo R",
}
RETAIL_TRIM_BLOCKLIST = FLEET_TRIM_BLOCKLIST | FOREIGN_MARKET_TRIM_BLOCKLIST


def is_retail_trim(trim: str) -> bool:
    """True if this trim should be shown to a retail consumer."""
    if not trim or len(trim) > 40:
        return False
    if trim in RETAIL_TRIM_BLOCKLIST:
        return False
    # Catch any trim whose name STARTS with a known fleet/foreign keyword
    # (covers variants like "SSV-AWD", "Police Pursuit Sedan", etc.)
    lower = trim.lower()
    for kw in ("ssv", "police ", "pursuit", "edicion ", "doble cabina",
               "cabina doble", "special service", "milenio"):
        if lower.startswith(kw) or lower == kw.strip():
            return False
    return True


# Cycle 14AR-fix5 (Tom audit BLOCKER): retail-shopper make filter. Stehlen
# is a US retail storefront. Chinese-market BAIC, defunct GM sub-brands
# (Geo, Pontiac, Saturn, Mercury, Plymouth, Hummer pre-resurrection,
# Oldsmobile), and Toyota's defunct Scion all leak from upstream Shopify
# tags. Some are defensible if real products are catalogued (e.g., Geo
# 1989-1997 if we sell Tracker accessories), but BAIC has zero NA-market
# inventory and creates instant credibility damage.
#
# Drop these makes entirely from the YMM tree. If a product has fitment
# lines for both BAIC AND a US-market make, the US-market line still
# survives — only the BAIC entry is dropped.
NON_RETAIL_MAKES = {
    "baic",
}


# Cycle 14AR-fix5 (Tom audit BLOCKER): bare "Sierra" (no 1500/2500
# suffix) appears as a separate model entry under GMC for 2007-2018
# because some products are tagged with the generic "GMC Sierra" string
# instead of "GMC Sierra 1500". This causes duplicate model entries in
# the YMM picker — customer sees both "Sierra" and "Sierra 1500" with no
# way to tell which one their truck is. Collapse the bare entry into
# Sierra 1500. Same problem affects bare "Silverado" → "Silverado 1500".
MODEL_CANONICALIZE: dict[tuple[str, str], str] = {
    ("gmc", "sierra"): "Sierra 1500",
    ("chevrolet", "silverado"): "Silverado 1500",
}


def normalize_make(make: str) -> str:
    """Title-case but preserve known acronyms (GMC, BMW, etc.)."""
    upper_overrides = {"gmc", "bmw", "kia", "fiat", "mini"}
    m = make.strip()
    if m.lower() in upper_overrides and m.lower() in {"gmc", "bmw"}:
        return m.upper()
    # Title-case other makes (Chevrolet, Ford, Toyota...)
    return m


def is_retail_make(make: str) -> bool:
    return make.lower() not in NON_RETAIL_MAKES


def canonicalize_model(make: str, model: str) -> str:
    """Apply MODEL_CANONICALIZE to fix bare/ambiguous model names."""
    canonical = MODEL_CANONICALIZE.get((make.lower(), model.lower().strip()))
    return canonical if canonical else model


def main() -> None:
    print(f"Loading {SNAPSHOT}...")
    with SNAPSHOT.open() as f:
        snapshot = json.load(f)

    print(f"Parsing {len(snapshot)} products...")

    # Year → Make → Model → set of product handles
    tree: dict[str, dict[str, dict[str, set[str]]]] = defaultdict(
        lambda: defaultdict(lambda: defaultdict(set))
    )
    # "Year|Make|Model" → {trims, bedLengths, cabTypes, doors}
    dims: dict[str, dict[str, set[str]]] = defaultdict(
        lambda: {
            "trims": set(),
            "bedLengths": set(),
            "cabTypes": set(),
            "doors": set(),
        }
    )

    skipped_lines = 0
    parsed_lines = 0
    # Cycle 14AR-fix2: per-YMM → set of product handles that fit
    products_by_ymm: dict[str, set[str]] = defaultdict(set)

    for handle, entry in snapshot.items():
        raw = entry.get("fitmentRaw", "")
        if not raw:
            continue
        # Bed lengths live in parsed.subattributes (extracted by sync-ca-fitment.ts),
        # NOT in fitmentRaw's submodel field. Pick them up here per-product, then
        # apply to every YMM this product fits below.
        product_subs = entry.get("parsed", {}).get("subattributes", {}) or {}
        product_bed_lengths_raw = product_subs.get("bedLengths") or []
        # Canonicalize "5.5' Bed" → "5.5' BED" so chip labels match the rest of UI
        product_beds_canonical: set[str] = set()
        for b in product_bed_lengths_raw:
            # Normalize spacing/case while preserving the foot-mark
            cleaned = re.sub(r"\s+", " ", b).strip()
            # "5.5' Bed" → "5.5' BED"; "6 ft Bed" → "6' BED"
            m = re.match(r"^(\d+(?:\.\d+)?)\s*(?:ft\.?|')\s*Bed$", cleaned, re.I)
            if m:
                v = _fmt_bed_py(m.group(1))
                product_beds_canonical.add(f"{v}' BED")
            else:
                # Fallback: uppercase-bed
                product_beds_canonical.add(cleaned.upper())

        for line in raw.splitlines():
            # Strip trailing notes like "::Drilling Is Required"
            line = line.split("::", 1)[0].strip()
            if not line or "|" not in line:
                continue
            parts = [p.strip() for p in line.split("|")]
            if len(parts) < 3:
                skipped_lines += 1
                continue
            year_s, make_raw, model = parts[0], parts[1], parts[2]
            submodel = parts[3] if len(parts) >= 4 else ""

            # Year sanity (some lines have notes-only or junk)
            if not re.match(r"^\d{4}$", year_s):
                skipped_lines += 1
                continue
            if not make_raw or not model:
                skipped_lines += 1
                continue

            make = normalize_make(make_raw)
            # Cycle 14AR-fix5: drop non-retail makes (BAIC, etc.)
            if not is_retail_make(make):
                skipped_lines += 1
                continue
            # Cycle 14AR-fix5: collapse bare "Sierra" → "Sierra 1500" etc.
            model = canonicalize_model(make, model)
            tree[year_s][make][model].add(handle)
            parsed_lines += 1

            key = f"{year_s}|{make}|{model}"
            # Cycle 14AR-fix2: record this product as fitting this YMM
            products_by_ymm[key].add(handle)
            d = dims[key]
            if submodel:
                trim = extract_trim(submodel)
                if trim and is_retail_trim(trim):
                    d["trims"].add(trim)
                cab = extract_cab(submodel)
                if cab:
                    d["cabTypes"].add(cab)
                bed = extract_bed(submodel)
                if bed:
                    d["bedLengths"].add(bed)
                doors = extract_doors(submodel)
                if doors:
                    d["doors"].add(doors)
            # Apply this product's bed-lengths to every YMM it fits
            for b in product_beds_canonical:
                d["bedLengths"].add(b)

    print(f"  Parsed {parsed_lines} fitment lines ({skipped_lines} skipped)")

    # Convert sets → sorted lists for stable JSON output
    tree_out: dict[str, dict[str, dict[str, list[str]]]] = {}
    for year in sorted(tree.keys()):
        tree_out[year] = {}
        for make in sorted(tree[year].keys()):
            tree_out[year][make] = {}
            for model in sorted(tree[year][make].keys()):
                tree_out[year][make][model] = sorted(tree[year][make][model])

    # Bed-length canonical sort order
    BED_ORDER = ["4.6' BED", "5' BED", "5.5' BED", "5.6' BED", "5.7' BED",
                 "5.8' BED", "6' BED", "6.4' BED", "6.5' BED", "6.6' BED",
                 "8' BED"]
    CAB_ORDER = ["REGULAR CAB", "SUPERCAB", "CREW CAB"]

    def sort_beds(s: set[str]) -> list[str]:
        known = [b for b in BED_ORDER if b in s]
        unknown = sorted(s - set(BED_ORDER))
        return known + unknown

    def sort_cabs(s: set[str]) -> list[str]:
        return [c for c in CAB_ORDER if c in s]

    dims_out: dict[str, dict[str, list[str]]] = {}
    for key in sorted(dims.keys()):
        d = dims[key]
        dims_out[key] = {
            "trims": sorted(d["trims"]),
            "bedLengths": sort_beds(d["bedLengths"]),
            "cabTypes": sort_cabs(d["cabTypes"]),
            "doors": sorted(d["doors"]),
        }

    # Cycle 14AR-fix5 (Tom audit): merge manual overrides AFTER the CA
    # pass so canonical CA data wins where present, but real-world OEM
    # gaps (2019 Wrangler JL absent, 2019+ Ram 1500 DT bedLengths empty,
    # 2014 F-150 8' bed missing, JK 2-door trims missing) get filled.
    # Arrays are UNIONED with existing values (not replaced), so an
    # override that adds 8' BED to 2014 F-150 keeps the existing
    # 5.5'/6.5' entries intact. Trim retail-filter is reapplied after
    # union so override entries can't smuggle fleet/foreign trims.
    if OVERRIDES.exists():
        with OVERRIDES.open() as f:
            overrides = json.load(f)
        ov_count = 0
        for key, override in overrides.items():
            if key.startswith("_"):  # comment/doc fields
                continue
            existing = dims_out.get(key, {
                "trims": [], "bedLengths": [], "cabTypes": [], "doors": [],
            })
            # Union arrays for each known field; respect retail-trim filter.
            def merge(field: str, retail_only: bool = False) -> list[str]:
                seen = set()
                out: list[str] = []
                for v in existing.get(field, []):
                    if v not in seen:
                        seen.add(v)
                        out.append(v)
                for v in override.get(field, []):
                    if v in seen:
                        continue
                    if retail_only and not is_retail_trim(v):
                        continue
                    seen.add(v)
                    out.append(v)
                return out

            merged = {
                "trims": sorted(merge("trims", retail_only=True)),
                "bedLengths": sort_beds(set(merge("bedLengths"))),
                "cabTypes": sort_cabs(set(merge("cabTypes"))),
                "doors": sorted(merge("doors")),
            }
            dims_out[key] = merged
            ov_count += 1

            # If override creates a brand-new YMM (e.g., 2019 Wrangler JL
            # not in CA), also add it to the tree so the model picker
            # surfaces it.
            year, make, model = key.split("|", 2)
            if model not in tree_out.get(year, {}).get(make, {}):
                tree_out.setdefault(year, {}).setdefault(make, {})[model] = []
        print(f"  Applied {ov_count} manual overrides from {OVERRIDES.name}")

    print(f"Writing {TREE_OUT}...")
    with TREE_OUT.open("w") as f:
        json.dump(tree_out, f, indent=2)

    print(f"Writing {DIMS_OUT}...")
    with DIMS_OUT.open("w") as f:
        json.dump(dims_out, f, indent=2)

    # Cycle 14AR-fix2: per-YMM list of fitting product handles
    products_by_ymm_out: dict[str, list[str]] = {
        k: sorted(products_by_ymm[k]) for k in sorted(products_by_ymm.keys())
    }
    print(f"Writing {PRODUCTS_BY_YMM_OUT}...")
    with PRODUCTS_BY_YMM_OUT.open("w") as f:
        json.dump(products_by_ymm_out, f, indent=2)

    # Print summary stats
    total_year = len(tree_out)
    total_makes = sum(len(makes) for makes in tree_out.values())
    total_models = sum(
        len(models) for makes in tree_out.values() for models in makes.values()
    )
    total_ymm = len(dims_out)
    with_trims = sum(1 for d in dims_out.values() if d["trims"])
    with_beds = sum(1 for d in dims_out.values() if d["bedLengths"])
    with_cabs = sum(1 for d in dims_out.values() if d["cabTypes"])
    print(f"\nSummary:")
    print(f"  Years:  {total_year}")
    print(f"  Makes:  {total_makes} (across years)")
    print(f"  Models: {total_models} (year+make+model rows)")
    print(f"  YMM dimension entries: {total_ymm}")
    print(f"    with trims:       {with_trims}")
    print(f"    with bedLengths:  {with_beds}")
    print(f"    with cabTypes:    {with_cabs}")

    # Quick sanity checks against known truths
    print(f"\nSpot checks:")
    for label, k in [
        ("2019 GMC Sierra 1500", "2019|GMC|Sierra 1500"),
        ("2019 Chevrolet Sierra 1500 (should NOT exist)", "2019|Chevrolet|Sierra 1500"),
        ("2019 Chevrolet Silverado 1500", "2019|Chevrolet|Silverado 1500"),
        ("2021 Ford F-150", "2021|Ford|F-150"),
        ("2021 Toyota Tacoma", "2021|Toyota|Tacoma"),
        ("2020 Ram 1500", "2020|Ram|1500"),
    ]:
        d = dims_out.get(k)
        if d is None:
            print(f"  {label}: NOT IN INDEX")
        else:
            print(f"  {label}:")
            print(f"    trims:      {d['trims']}")
            print(f"    bedLengths: {d['bedLengths']}")
            print(f"    cabTypes:   {d['cabTypes']}")
            print(f"    doors:      {d['doors']}")


if __name__ == "__main__":
    main()
