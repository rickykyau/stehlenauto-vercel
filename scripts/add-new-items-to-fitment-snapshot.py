#!/usr/bin/env python3
"""
Add the 2026-08-25 new-item batch (426 products) to data/ca_fitment_snapshot.json
so scripts/build-ymm-index.py puts them in the YMM tree / products_by_ymm /
vehicle hubs. Existing snapshot entries are never touched.

Source per product (already reviewed when the drafts were built — CA upstream
errors were corrected on our side, so we do NOT re-pull CA for these):
  * custom.fitment_raw present (CA-backed): use it, expanding "YYYY-YYYY|..."
    range lines to one line per year (build-ymm-index only parses single years).
  * otherwise (CB-derived): rebuild lines from custom.fitment_notes
    ("2011-2014 Ford Edge"), resolving make/model against custom.make /
    custom.model so multi-word models ("Grand Caravan", "Town & Country") split
    correctly.
  * universal-* handles are skipped (universal products bypass fitment).

Bed lengths found in "::Will Fit ... 6.5 Ft ..." notes go to
parsed.subattributes.bedLengths (the field build-ymm-index reads for the
sub-model chip).

Usage: python3 scripts/add-new-items-to-fitment-snapshot.py <drafts_metafields.json>
  drafts_metafields.json = { handle: { <custom.* key>: value } }
"""
import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SNAP = ROOT / "data" / "ca_fitment_snapshot.json"
mf = json.load(open(sys.argv[1]))
snap = json.load(open(SNAP))


def as_list(v):
    if not v:
        return []
    return json.loads(v) if v.startswith("[") else [v]


def expand_raw(raw):
    out = []
    for line in raw.splitlines():
        if not line.strip():
            continue
        head, _, rest = line.partition("|")
        m = re.fullmatch(r"(\d{4})\s*-\s*(\d{4})", head.strip())
        if m:
            out += [f"{y}|{rest}" for y in range(int(m.group(1)), int(m.group(2)) + 1)]
        else:
            out.append(line)
    return out


def from_notes(v):
    makes = sorted(as_list(v.get("make")), key=len, reverse=True)
    models = sorted(as_list(v.get("model")), key=len, reverse=True)
    lines, unparsed = [], []
    for note in v.get("fitment_notes", "").splitlines():
        m = re.match(r"^(\d{4})(?:\s*-\s*(\d{4}))?\s+(.*)$", note.strip())
        if not m:
            continue
        rest = m.group(3)
        mk = next((x for x in makes if rest.lower().startswith(x.lower())), None)
        md = mk and next((x for x in models if rest[len(mk):].strip().lower().startswith(x.lower())), None)
        if not md:
            unparsed.append(note)
            continue
        for y in range(int(m.group(1)), int(m.group(2) or m.group(1)) + 1):
            lines.append(f"{y}|{mk}|{md}")
    return lines, unparsed


added, skipped, problems = 0, [], []
for handle, v in mf.items():
    if handle in snap and snap[handle].get("fitmentRaw"):
        skipped.append((handle, "already in snapshot"))
        continue
    if handle.startswith("universal-"):
        skipped.append((handle, "universal"))
        continue
    if v.get("fitment_raw"):
        lines, source = expand_raw(v["fitment_raw"]), "shopify-metafield:fitment_raw"
    else:
        lines, unparsed = from_notes(v)
        source = "shopify-metafield:fitment_notes (CB-derived)"
        if unparsed:
            problems.append((handle, unparsed))
    if not lines:
        problems.append((handle, "no fitment lines"))
        continue
    beds = sorted({
        f"{b} ft Bed"
        for l in lines
        for b in re.findall(r"(\d+(?:\.\d+)?)\s*Ft\b", l.partition("::")[2], re.I)
    })
    snap[handle] = {
        "cbItemName": (snap.get(handle) or {}).get("cbItemName"),
        "status": "synced",
        "source": source,
        "fitmentRaw": "\n".join(lines),
        "parsed": {"subattributes": {"bedLengths": beds} if beds else {}},
    }
    added += 1

json.dump(snap, open(SNAP, "w"), indent=2)
print(f"added {added} | skipped {len(skipped)} {skipped[:5]} | snapshot now {len(snap)}")
for h, p in problems:
    print("PROBLEM", h, p)
