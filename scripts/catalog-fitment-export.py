#!/usr/bin/env python3
"""
Cycle-3 deliverable for the warehouse / merch team -- consolidated edition.

One CSV + one markdown cover sheet for ALL fitment-risk SKUs across the
catalog, replacing the running-boards-only export. Pulls from the same
storefront CSV the audits used so the warehouse can sort, mark
PASS/SPLIT/PULL in a single workbook, and send back.

Inputs:
  docs/iterations/2026-05-03-cycle-1/shopify-storefront-products.csv

Outputs:
  docs/iterations/2026-05-03-cycle-1/catalog-fitment-verification.csv
  docs/iterations/2026-05-03-cycle-1/catalog-fitment-verification.md
"""

from __future__ import annotations

import csv
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "docs/iterations/2026-05-03-cycle-1/shopify-storefront-products.csv"
DST_CSV = ROOT / "docs/iterations/2026-05-03-cycle-1/catalog-fitment-verification.csv"
DST_MD = ROOT / "docs/iterations/2026-05-03-cycle-1/catalog-fitment-verification.md"

STEHLEN_VENDORS = {"stehlen auto", "stehlen"}
LIVE_URL = "https://stehlenauto.com/products/{handle}"

BRACKET_RE = re.compile(r"\bRBJZ-BR-[A-Z0-9]+-\d+P\b", re.IGNORECASE)
YEAR_RANGE_RE = re.compile(r"\b((?:19|20)\d{2})\s*[-–]\s*((?:19|20)?\d{2})\b")
SINGLE_YEAR_RE = re.compile(r"\b((?:19|20)\d{2})\b")
CAB_PATTERNS = [
    "Crew Cab", "Quad Cab", "Extended Cab", "Double Cab",
    "SuperCab", "Super Cab", "SuperCrew", "Super Crew",
    "Regular Cab", "Mega Cab", "Access Cab",
]
TRIM_RISK_TERMS = [
    "trd pro", "trd-pro", "raptor", "trx", "rebel", "tremor",
    "zr2", "trail boss", "rubicon", "wrangler 392",
]

# ----------------------------------------------------------------------
# Category-aware row classifier.
#
# Each classifier looks at the in-scope row and returns:
#   (verdict_label, verification_note, dimensional_field_value)
#
# Verdict labels (sortable):
#   "1 - HARD HOLD"      audit-confirmed risk; do not run paid traffic
#   "2 - VERIFY HIGH"    same root cause pattern, not deep-audited
#   "3 - VERIFY MEDIUM"  spans multiple years/chassis; warrants quick check
#   "4 - INSPECT"        anomaly; bracket P/N missing, etc.
#   "5 - PASS - SHIP"    clean tagging; ship as-is
# ----------------------------------------------------------------------

def find_bracket(tags: str):
    m = BRACKET_RE.search(tags)
    return m.group(0).upper() if m else None

def year_span(title: str):
    m = YEAR_RANGE_RE.search(title)
    if m:
        a, b = int(m.group(1)), int(m.group(2))
        if b < 100:
            b += (a // 100) * 100
        if 1 <= b - a <= 30:
            return a, b
    years = sorted(int(y) for y in SINGLE_YEAR_RE.findall(title))
    if years:
        return years[0], years[-1]
    return None, None

def find_cabs(title: str) -> str:
    found = [c for c in CAB_PATTERNS if c.lower() in title.lower()]
    return " | ".join(sorted(set(found)))

def find_trim_risk(title: str) -> str:
    tl = title.lower()
    return " | ".join(sorted({t.upper() for t in TRIM_RISK_TERMS if t in tl}))

# Bracket families that the cycle-3 audit confirmed as P0 holds.
BRACKET_VERDICTS = {
    "RAM09": ("1 - HARD HOLD",
        "Bracket spans 2009-2022 in title; warehouse must confirm bracket fits BOTH the DS chassis (09-18) AND DT Classic (19-22). DT new-body (19+) must be EXCLUDED."),
    "RAM191500": ("2 - VERIFY HIGH",
        "Title claims 2019-2024 Ram 1500. Confirm bracket is sized for DT new-body chassis ONLY; must NOT fit DS or DT Classic."),
    "F15015": ("1 - HARD HOLD",
        "Title claims 2015-2023 F-150/Super Duty. Bracket must fit BOTH P552 (15-20) AND P702 (21+). 2023 Super Duty redesigned."),
    "TACO05": ("1 - HARD HOLD",
        "Title claims 2005-2022 Tacoma. Bracket must fit BOTH 2nd gen (05-15) AND 3rd gen (16-23) - different frame holes."),
    "SIL19": ("2 - VERIFY HIGH",
        "Title claims 2019-2024 Silverado/Sierra. Confirm bracket spans T1XX (19-21) AND the 2022 fascia/frame refresh."),
    "COLO15": ("3 - VERIFY MEDIUM",
        "Title claims 2015-2022 Colorado/Canyon. Confirm bracket fits the entire 2nd gen run."),
    "RANG19": ("3 - VERIFY MEDIUM",
        "Title claims 2019-2023 Ranger Crew Cab. Confirm bracket is 5-ft-bed-only (US Ranger has no 6-ft bed)."),
}

# Headlight-specific P0 hard-holds called out in parts-headlights-deep-dive.md.
HEADLIGHT_HARD_HOLDS = {
    # exact handles flagged in the deep-dive top-5
    "99-02-silverado-00-06-suburban-tahoe-led-headlights": (
        "Single SKU claims to fit THREE different OEM headlight assemblies (99-02 Silverado, 00-06 Suburban, 00-06 Tahoe) sharing zero parts. Must split into 3 separate products or pull."),
}

HEADLIGHT_RISK_SUBSTRINGS = [
    # (handle substring, verdict, note) - ordered, first match wins.
    ("09-18-dodge-ram", "1 - HARD HOLD",
        "Per audit: tag-set silently expanded to 09-24; does NOT fit DT new-body (19+). Ship for DS (09-18) + DT Classic (19-22 parallel run) only. Customer-visible failure: wrong housing + connector on 19+ Ram."),
    ("2009-2022-dodge-ram", "1 - HARD HOLD",
        "Per audit: 09-22 span lies. DS chassis (09-18) and DT Classic (19-22) share a body but DT new-body (19-22 parallel) does NOT. Split or restrict to DT-Classic-only."),
    ("2009-2022-ram-1500", "1 - HARD HOLD",
        "Per audit: 09-22 span includes the 19+ DT new-body chassis that does not share housings with DS. Confirm or restrict."),
    ("02-05-dodge-ram", "3 - VERIFY MEDIUM",
        "Pre-DR/DH-era Ram. Confirm housing compatibility for the 02-05 span (no 06-08 carry)."),
    ("07-13-toyota-tundra", "1 - HARD HOLD",
        "Per audit: 2014 Tundra got a fascia refresh; many '07-17' listings claim coverage they do not have. If listing also references 08-15 Sequoia (Sequoia kept body), split: Tundra 07-13 vs Sequoia 08-15."),
    ("07-17-tundra", "1 - HARD HOLD",
        "Per audit: 2014 Tundra got a fascia refresh; this listing's 07-17 span won't bolt to 14-17 Tundras. Split into 07-13 vs 14-17 or pull 14-17 from claim."),
    ("07-14-chevy-silverado", "1 - HARD HOLD",
        "Per audit: 2014 Silverado/Sierra 1500 is K2XX (NOT GMT900). Incompatible. Ship for 07-13 only; 14 must be excluded."),
    ("07-14-silverado", "1 - HARD HOLD",
        "Per audit: 2014 Silverado/Sierra 1500 is K2XX (NOT GMT900). Incompatible. Ship for 07-13 only; 14 must be excluded."),
    ("09-14-ford-f-150", "2 - VERIFY HIGH",
        "Per audit: missing factory-LED trim exclusion (Platinum 13+, Limited 18+ has matrix LED). Wrong connector + CAN-bus warnings on the LED trims. Add `trim_excluded` metafield."),
    ("18-20-ford-f-150-limited", "2 - VERIFY HIGH",
        "Per audit: F-150 Limited 18+ ships with matrix LED from the factory. Aftermarket halogen housing won't bolt up. Confirm or restrict."),
]

GRILLE_TRIM_NOTE = (
    "Trim-level fitment (Sport/Lariat/King Ranch/Limited/Platinum) often "
    "implies camera/sensor cutouts, body-color vs chrome, or active-shutter "
    "compatibility. Confirm trim claims match the OEM grille hole pattern."
)

BULL_GUARD_NOTES = {
    "ram_ds_dt": (
        "Same Ram DS/DT lie as running boards: 09-22 span crosses 09-18 DS and "
        "19+ DT chassis with different bumper mount points. Confirm the bull "
        "guard actually fits BOTH or split."),
    "trd_pro": (
        "TRD Pro / Raptor / TRX / Rebel / Tremor / Trail Boss / ZR2 trims ship "
        "with a factory off-road bumper that aftermarket bull guards do NOT "
        "sit on. Exclude these trims from the listing or confirm fitment."),
}

FLOOR_MAT_TRUNK_TERMS = ("trunk", "frunk", "cargo area", "rear cargo")

def classify(row: dict[str, str]) -> tuple[str, str, str]:
    """Return (verdict_label, verification_note, dimensional_field) for one row."""
    title = row.get("title", "")
    handle = row.get("handle", "")
    ptype = row.get("productType", "").lower()
    tags = row.get("tags", "")

    # ---- Running boards / side steps ----
    if any(k in ptype for k in ("running board", "side step", "nerf")):
        bracket = find_bracket(tags)
        if bracket:
            for key, (label, note) in BRACKET_VERDICTS.items():
                if key in bracket:
                    return label, f"[bracket {bracket}] {note}", bracket
            a, b = year_span(title)
            span_phrase = f"{a}-{b} ({b-a+1} model years)" if a and b else "the year span in the title"
            return "3 - VERIFY MEDIUM", (
                f"CONCERN: bracket `{bracket}` is not in the audit's known-bad list, "
                f"but the title claims {span_phrase}. Multi-year claims have been the "
                f"#1 source of running-board returns in cycle-3. "
                f"WHAT TO CONFIRM: pull one bracket off the shelf, measure the frame-mount "
                f"hole pattern, and verify it physically bolts to BOTH the earliest and "
                f"latest model year in the title. If only part of the span fits, mark SPLIT "
                f"and note the years that actually work."
            ), bracket
        return "4 - INSPECT", "No bracket P/N found in tags. Pull the part and inspect physically before any verdict.", ""

    # ---- Headlights ----
    if "headlight" in ptype:
        if handle in HEADLIGHT_HARD_HOLDS:
            return "1 - HARD HOLD", HEADLIGHT_HARD_HOLDS[handle], "OEM assembly"
        for sub, label, note in HEADLIGHT_RISK_SUBSTRINGS:
            if sub in handle:
                return label, note, "OEM assembly"
        a, b = year_span(title)
        if a and b and (b - a) >= 8:
            return "3 - VERIFY MEDIUM", (
                f"CONCERN: title claims {a}-{b} ({b-a+1} model years). Headlight housings "
                f"almost always change with mid-cycle facelifts (typical: 3-5 years between "
                f"refreshes), so a {b-a+1}-year span is statistically suspect. "
                f"WHAT TO CONFIRM: cross-reference the OEM housing P/N for the earliest, "
                f"middle, and latest year in the title. If the OEM P/Ns are different across "
                f"the span, this listing claims one product fits multiple housings -- mark "
                f"SPLIT and identify which year(s) the housing actually fits. If the span "
                f"crosses a known facelift (Tundra 2014, Silverado 2014, F-150 2018, Ram 2019, "
                f"Tacoma 2016/2024), prioritize the split."
            ), "OEM assembly"
        return "5 - PASS - SHIP", "Single-generation headlight claim; verify normally per cycle-5 merch flow.", ""

    # ---- Bull guards / grille guards ----
    if "bull" in ptype or "grille guard" in ptype:
        a, b = year_span(title)
        if "ram" in title.lower() and a and b and a <= 2018 and b >= 2019:
            return "1 - HARD HOLD", BULL_GUARD_NOTES["ram_ds_dt"], "Bumper mount"
        trim = find_trim_risk(title)
        if trim:
            return "2 - VERIFY HIGH", f"{BULL_GUARD_NOTES['trd_pro']} (trims claimed in title: {trim})", "Bumper mount"
        if a and b and (b - a) >= 8:
            return "3 - VERIFY MEDIUM", (
                f"CONCERN: title spans {a}-{b} ({b-a+1} model years). Front bumpers and the "
                f"frame mounts behind them are usually redesigned at facelift cycles (every "
                f"4-6 years), so a {b-a+1}-year claim probably crosses at least one mount-"
                f"point change. "
                f"WHAT TO CONFIRM: photograph the bull guard's mounting bracket against the "
                f"OEM frame for the earliest AND latest year in the title -- check that the "
                f"bolt-hole spacing, tow-hook clearance, and any sensor cutouts (parking "
                f"sensors, ACC radar, forward camera) line up for BOTH ends of the span. If "
                f"only a sub-range fits, mark SPLIT and list the years that work."
            ), "Bumper mount"
        return "5 - PASS - SHIP", "Single-chassis bull guard claim; verify normally.", ""

    # ---- Front grilles ----
    if "grille" in ptype:
        trim = find_trim_risk(title)
        if trim:
            return "2 - VERIFY HIGH", f"{GRILLE_TRIM_NOTE} (trims claimed: {trim})", "Grille frame"
        a, b = year_span(title)
        span_phrase = f"{a}-{b} ({b-a+1} model years)" if a and b and (b - a) >= 6 else "the model years in the title"
        return "3 - VERIFY MEDIUM", (
            f"CONCERN: front grilles ARE trim-aware on every modern truck/SUV. The title "
            f"covers {span_phrase} but doesn't call out which trims are excluded. Trim-level "
            f"differences typically include: chrome vs body-color frame, active grille shutters "
            f"(2018+ on most F-150 EcoBoost), forward-facing camera cutout (Lariat+ / Limited / "
            f"High Country / Platinum), heated-grille sensor pass-throughs, ACC radar window. "
            f"WHAT TO CONFIRM: list every trim level the listing actually fits (e.g. 'XL, XLT, "
            f"Lariat Sport — does NOT fit Limited or Platinum'), and confirm the grille has the "
            f"right cutouts for any camera/radar trim claimed. Mark SPLIT if you need separate "
            f"listings per trim, or METAFIELD if you can keep one listing with a `trim_excluded` "
            f"field added."
        ), "Grille frame"

    # ---- Floor mats ----
    if "floor mat" in ptype:
        tl = title.lower()
        if any(k in tl for k in FLOOR_MAT_TRUNK_TERMS):
            return "2 - VERIFY HIGH", "Title indicates trunk/cargo/frunk mat - belongs in a cargo-area collection, NOT /collections/floor-mats. Recategorize.", "Coverage area"
        return "5 - PASS - SHIP", "Vehicle-specific floor mat; verify normally.", "Coverage area"

    # ---- MOLLE panels ----
    if "molle" in ptype:
        if "ranger" in title.lower() and "6" in title:
            return "2 - VERIFY HIGH", "US Ford Ranger 19-23 only ships with a 5-ft bed - confirm the 6-ft listing is a real fitment.", "Bed dimensions"
        return "3 - VERIFY MEDIUM", (
            "CONCERN: MOLLE panels are bed-dimension specific (5-ft / 5.5-ft / 6.5-ft / 8-ft "
            "differ in width AND depth). Titles often understate which beds the panel actually "
            "fits. "
            "WHAT TO CONFIRM: list the exact bed sizes (in feet, by truck) the panel mounts on. "
            "Note any rail-system requirements (factory bed rails vs naked sheet metal) and "
            "any tonneau-cover incompatibilities. Mark SPLIT if separate SKUs are needed per "
            "bed length, or METAFIELD if one SKU + a `bed_lengths_supported` field works."
        ), "Bed dimensions"

    # ---- Under-seat storage ----
    if "under seat" in ptype:
        return "3 - VERIFY MEDIUM", (
            "CONCERN: under-seat space differs significantly across cab types (Crew Cab "
            "has ~2x the floor space of Extended Cab, Regular Cab often has zero usable "
            "space). Titles rarely specify which cab the storage actually fits. "
            "WHAT TO CONFIRM: per cab type claimed in the title (Crew / Quad / Extended / "
            "Regular / SuperCab / SuperCrew), verify the storage box physically slides into "
            "place WITHOUT removing the seat. Note any heated-seat / power-seat-motor "
            "interferences. Mark SPLIT if you need separate SKUs per cab, or METAFIELD if "
            "one SKU + a `cab_types_supported` field is enough."
        ), "Cab type"

    # ---- Tonneau covers ----
    if "tonneau" in ptype:
        return "5 - PASS - SHIP", "Bed-length-gated; ships with fixes per cycle-2 audit. Verify normally.", "Bed length"

    # ---- Trailer hitches ----
    if "trailer hitch" in ptype:
        return "5 - PASS - SHIP", "Class-rated, vehicle-specific bolt-on. Tagging clean. Ship.", "Hitch class"

    # ---- Truck bed mats ----
    if "truck bed mat" in ptype or "bed mat" in ptype:
        tl = title.lower()
        if any(k in tl for k in FLOOR_MAT_TRUNK_TERMS):
            return "2 - VERIFY HIGH", "Title indicates trunk/cargo - likely miscategorized (cycle-1 found 11 of these in this collection).", "Coverage area"
        return "5 - PASS - SHIP", "Bed-length-gated; ship with fixes per cycle-2 audit.", "Bed length"

    # ---- Roof racks / baskets / chase racks ----
    if "roof" in ptype or "chase rack" in ptype or "sport bar" in ptype:
        return "5 - PASS - SHIP", "Verify normally - clean tagging in cycle-3 audit.", ""

    # Anything else slipped through
    return "5 - PASS - SHIP", "Not in cycle-3 high-risk list. Verify normally during merch passes.", ""

def main() -> int:
    if not SRC.exists():
        print(f"missing source: {SRC}", file=sys.stderr)
        return 1

    out_rows: list[dict[str, str]] = []
    by_verdict: Counter[str] = Counter()
    by_category: defaultdict[str, Counter[str]] = defaultdict(Counter)
    stehlen_by_verdict: defaultdict[str, list[str]] = defaultdict(list)

    with SRC.open(newline="") as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            ptype = row.get("productType", "")
            verdict, note, dim = classify(row)
            cabs = find_cabs(row.get("title", ""))
            trim = find_trim_risk(row.get("title", ""))
            a, b = year_span(row.get("title", ""))
            yr_range = f"{a}-{b}" if a and b else (str(a) if a else "")
            vendor = row.get("vendor", "")
            is_stehlen = vendor.lower().strip() in STEHLEN_VENDORS

            out_rows.append({
                "verdict": verdict,
                "stehlen_branded": "YES" if is_stehlen else "",
                "category": ptype,
                "year_range_claimed": yr_range,
                "cabs_claimed": cabs,
                "trim_risk_in_title": trim,
                "physical_part_to_inspect": dim,
                "vendor": vendor,
                "handle": row.get("handle", ""),
                "title": row.get("title", ""),
                "live_url": LIVE_URL.format(handle=row.get("handle", "")),
                "verification_note": note,
                "raw_tags": row.get("tags", ""),
                "warehouse_decision": "",  # blank column for merch team to fill
            })
            by_verdict[verdict] += 1
            by_category[ptype][verdict] += 1
            if is_stehlen and verdict.startswith(("1", "2")):
                stehlen_by_verdict[verdict].append(row.get("handle", ""))

    # Per merch request: workbook only contains actionable rows. VERIFY MEDIUM
    # (low-confidence flags) and PASS-SHIP (no concern) are dropped from the
    # CSV. They are still counted in the cover sheet for context.
    ACTIONABLE = {"1 - HARD HOLD", "2 - VERIFY HIGH", "4 - INSPECT"}
    actionable_rows = [r for r in out_rows if r["verdict"] in ACTIONABLE]
    actionable_rows.sort(key=lambda r: (
        r["verdict"],
        0 if r["stehlen_branded"] == "YES" else 1,
        r["category"],
        r["handle"],
    ))

    cols = [
        "verdict",
        "warehouse_decision",
        "stehlen_branded",
        "category",
        "year_range_claimed",
        "cabs_claimed",
        "trim_risk_in_title",
        "physical_part_to_inspect",
        "vendor",
        "handle",
        "title",
        "live_url",
        "verification_note",
        "raw_tags",
    ]

    DST_CSV.parent.mkdir(parents=True, exist_ok=True)
    with DST_CSV.open("w", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=cols)
        w.writeheader()
        w.writerows(actionable_rows)

    md_lines = [
        "# Catalog fitment verification - actionable rows only",
        "",
        f"Source: `docs/iterations/2026-05-03-cycle-1/shopify-storefront-products.csv`  ",
        f"Generated by: `scripts/catalog-fitment-export.py`  ",
        f"Catalog total: **{len(out_rows)}** SKUs. **CSV contains {len(actionable_rows)} actionable rows only** (HARD HOLD + VERIFY HIGH + INSPECT). Low-confidence flags (VERIFY MEDIUM) and clean rows (PASS-SHIP) are excluded so the merch team only sees rows that need a decision.",
        "",
        "## What this is",
        "",
        "Cycle-3 parts-specialist audits flagged a recurring pattern across",
        "FOUR categories (running boards, headlights, bull guards, grilles):",
        "**single SKUs claimed across multiple chassis generations that don't",
        "actually share parts**. Estimated catalog-wide return-rate risk if",
        "shipped to paid traffic as-is: **$130K-200K/yr** (running boards",
        "$45-70K + headlights $50-80K + bull guards/grilles $30-50K).",
        "",
        "## How to use this CSV",
        "",
        "1. Open `catalog-fitment-verification.csv` in Excel.",
        "2. Default sort puts **HARD HOLD** rows first, then VERIFY HIGH, then INSPECT.",
        "   Stehlen-branded SKUs float to the top of each bucket (highest brand-trust risk).",
        "3. For each row, mark column **`warehouse_decision`** with one of:",
        "   - **PASS** - bracket / housing / mount fits the entire claim. Ship.",
        "   - **SPLIT** - fits part of the claim. Note the years to split into.",
        "   - **PULL** - doesn't fit anything claimed. Take the listing down.",
        "   - **METAFIELD** - fits, but listing needs a missing field (factory",
        "     bulb type, harness adapter, drilling required, etc).",
        "4. Send the marked CSV back. Dev will execute Shopify Admin tagging,",
        "   sitemap suppression, and SPLIT/variant operations from there.",
        "",
        "## What's in (and out of) the CSV",
        "",
        "| Verdict | Count | In CSV? | Meaning |",
        "|---|---:|---|---|",
    ]
    in_csv = {"1 - HARD HOLD", "2 - VERIFY HIGH", "4 - INSPECT"}
    descriptions = {
        "1 - HARD HOLD":      "Audit-confirmed risk. Do NOT run paid traffic / Klaviyo flows / Meta ads at these SKUs until verified.",
        "2 - VERIFY HIGH":    "Same root-cause pattern as a hard-hold (multi-chassis / trim-exclusion / OEM-fitment claim). Verify before next paid push.",
        "3 - VERIFY MEDIUM":  "Excluded by request - low-confidence pattern flag, no specific audit finding. Re-run script with the filter relaxed if a closer look is wanted later.",
        "4 - INSPECT":        "Anomaly - bracket P/N missing or other gap. Physical inspection needed before any verdict.",
        "5 - PASS - SHIP":    "Excluded by request - no cycle-3 audit flag. Ships as-is in normal merch cadence.",
    }
    for v in sorted(by_verdict):
        flag = "YES" if v in in_csv else "no"
        md_lines.append(f"| **{v}** | {by_verdict[v]} | {flag} | {descriptions.get(v, '')} |")

    md_lines += [
        "",
        "## By category",
        "",
        "| Category (productType) | HARD HOLD | VERIFY HIGH | VERIFY MEDIUM | INSPECT | PASS-SHIP |",
        "|---|---:|---:|---:|---:|---:|",
    ]
    for cat in sorted(by_category):
        c = by_category[cat]
        md_lines.append(
            f"| {cat} | "
            f"{c['1 - HARD HOLD']} | "
            f"{c['2 - VERIFY HIGH']} | "
            f"{c['3 - VERIFY MEDIUM']} | "
            f"{c['4 - INSPECT']} | "
            f"{c['5 - PASS - SHIP']} |"
        )

    # Stehlen highlights
    md_lines += [
        "",
        "## Stehlen-branded SKUs in HARD HOLD or VERIFY HIGH (priority)",
        "",
        "Stehlen-labeled parts that don't fit the truck in the title are the",
        "single biggest brand-trust risk in the catalog. These are listed first.",
        "",
    ]
    if stehlen_by_verdict:
        for verdict in sorted(stehlen_by_verdict):
            handles = sorted(stehlen_by_verdict[verdict])
            md_lines.append(f"### {verdict} ({len(handles)} Stehlen-branded)")
            md_lines.append("")
            for h in handles:
                md_lines.append(f"- `{h}` - {LIVE_URL.format(handle=h)}")
            md_lines.append("")
    else:
        md_lines.append("- (none)")

    md_lines += [
        "",
        "## Bracket families (running boards specifically)",
        "",
        "Running boards' brackets are documented in tags as `RBJZ-BR-<chassis>-<size>`.",
        "Group running-boards rows by the `physical_part_to_inspect` column to",
        "verify one bracket per shelf-pull. Bracket families on the live site:",
        "",
    ]
    bracket_counts: Counter[str] = Counter()
    for r in actionable_rows:
        if r["physical_part_to_inspect"].startswith("RBJZ-BR-"):
            bracket_counts[r["physical_part_to_inspect"]] += 1
    md_lines.append("| Bracket P/N | SKUs in CSV | Verdict |")
    md_lines.append("|---|---:|---|")
    for bp, count in sorted(bracket_counts.items()):
        verdicts = sorted({r["verdict"] for r in actionable_rows if r["physical_part_to_inspect"] == bp})
        md_lines.append(f"| `{bp}` | {count} | {' / '.join(verdicts)} |")

    md_lines += [
        "",
        "## What dev will do once you send it back",
        "",
        "- **PULL** rows - hidden from sitemap, removed from mega-nav / footer / home,",
        "  Add-to-Cart disabled with a 'call before ordering' fallback.",
        "- **SPLIT** rows - dev queues a Shopify Admin merch flow per row",
        "  (variants vs new products, ACES-aligned tag schema with `body_code`,",
        "  `factory_bulb`, `trim_excluded`, `requires_harness` per the headlights",
        "  deep-dive spec).",
        "- **METAFIELD** rows - dev adds the missing field as a Shopify metafield",
        "  and surfaces it on the PDP buy-box.",
        "- **PASS** rows - no action. Listing stays as-is.",
        "",
        "## File locations",
        "",
        "- This packet: `docs/iterations/2026-05-03-cycle-1/catalog-fitment-verification.{md,csv}`",
        "- Backing audits: `parts-headlights-deep-dive.md`, `parts-catalog-audit-top5.md`,",
        "  `parts-catalog-audit-remaining-7.md` (same directory)",
        "- Source data: `shopify-storefront-products.csv` (same directory)",
        "- The earlier running-boards-only export is preserved at",
        "  `running-boards-warehouse-verification.{csv,md}` for traceability;",
        "  this consolidated packet supersedes it.",
        "",
    ]
    DST_MD.write_text("\n".join(md_lines) + "\n")

    print(f"wrote {DST_CSV}  ({len(actionable_rows)} actionable rows / {len(out_rows)} catalog total)")
    print(f"wrote {DST_MD}")
    print()
    print("In CSV (actionable):")
    for v in sorted(by_verdict):
        if v in {"1 - HARD HOLD", "2 - VERIFY HIGH", "4 - INSPECT"}:
            print(f"  {v}: {by_verdict[v]}")
    print("Excluded (counted in cover sheet only):")
    for v in sorted(by_verdict):
        if v in {"3 - VERIFY MEDIUM", "5 - PASS - SHIP"}:
            print(f"  {v}: {by_verdict[v]}")
    print()
    print(f"Stehlen-branded in HARD HOLD: {len(stehlen_by_verdict.get('1 - HARD HOLD', []))}")
    print(f"Stehlen-branded in VERIFY HIGH: {len(stehlen_by_verdict.get('2 - VERIFY HIGH', []))}")
    return 0

if __name__ == "__main__":
    sys.exit(main())
