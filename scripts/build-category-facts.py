#!/usr/bin/env python3
"""
build-category-facts.py — per-category facts for the collection-page FAQ
(src/components/pages/category-faq.tsx) and llms.txt.

Everything is derived from live data, never written by hand:
  - which products are in each category collection (Shopify Admin API)
  - which vehicles they fit (data/products_by_ymm.json, built from CA)
  - bed lengths / cover styles / hitch classes / receiver sizes (from titles)

Writes data/category_facts.json. Re-run after catalog or fitment changes
(after scripts/build-ymm-index.py).

Usage: python3 scripts/build-category-facts.py
"""
import collections
import json
import re
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "category_facts.json"
CATEGORIES = [
    "tonneau-covers", "trailer-hitches", "bull-guards-grille-guards", "front-grilles",
    "headlights", "truck-bed-mats", "running-boards-side-steps", "floor-mats",
    "roof-racks-baskets", "chase-racks-sport-bars", "molle-panels", "under-seat-storage",
]


def env():
    e = {}
    for line in (ROOT / ".env.local").read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            e[k.strip()] = v.strip().strip("\"'")
    return e


E = env()
DOMAIN = E["NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN"].replace("https://", "").rstrip("/")


def gql(query, variables):
    req = urllib.request.Request(
        f"https://{DOMAIN}/admin/api/2026-04/graphql.json",
        data=json.dumps({"query": query, "variables": variables}).encode(),
        headers={"Content-Type": "application/json", "X-Shopify-Access-Token": E["SHOPIFY_ADMIN_TOKEN"]},
    )
    return json.load(urllib.request.urlopen(req))["data"]


def collection_products(handle):
    out, cursor = [], None
    while True:
        d = gql(
            """query($h:String!,$c:String){collectionByHandle(handle:$h){products(first:250,after:$c){
                 pageInfo{hasNextPage endCursor} nodes{handle title status totalInventory}}}}""",
            {"h": handle, "c": cursor},
        )["collectionByHandle"]
        if not d:
            return out
        out += [p for p in d["products"]["nodes"] if p["status"] == "ACTIVE"]
        if not d["products"]["pageInfo"]["hasNextPage"]:
            return out
        cursor = d["products"]["pageInfo"]["endCursor"]


def year_ranges(years):
    """[2001,2002,2003,2007] -> "2001–2003, 2007" """
    ys, out = sorted(years), []
    start = prev = ys[0]
    for y in ys[1:] + [None]:
        if y is not None and y == prev + 1:
            prev = y
            continue
        out.append(f"{start}–{prev}" if prev != start else str(start))
        if y is not None:
            start = prev = y
    return ", ".join(out)


def main():
    index = json.loads((ROOT / "data" / "products_by_ymm.json").read_text())
    vehicles_by_handle = collections.defaultdict(set)
    for key, handles in index.items():
        year, make, model = key.split("|", 2)
        for h in handles:
            vehicles_by_handle[h].add((int(year), make, model))

    facts = {}
    for cat in CATEGORIES:
        prods = collection_products(cat)
        in_stock = [p for p in prods if (p["totalInventory"] or 0) > 0]
        agg = collections.defaultdict(lambda: {"years": set(), "handles": set()})
        for p in in_stock:
            for year, make, model in vehicles_by_handle.get(p["handle"], ()):
                a = agg[(make, model)]
                a["years"].add(year)
                a["handles"].add(p["handle"])
        top = sorted(agg.items(), key=lambda kv: -len(kv[1]["handles"]))[:8]
        titles = " | ".join(p["title"] for p in in_stock)

        def found(pattern, fmt=lambda m: m.group(0)):
            vals = {fmt(m) for m in re.finditer(pattern, titles, re.I)}
            return sorted(vals)

        f = {
            "inStock": len(in_stock),
            "universal": sum(1 for p in in_stock if p["handle"] not in vehicles_by_handle),
            "topVehicles": [
                {"make": mk, "model": md, "years": year_ranges(a["years"]), "count": len(a["handles"])}
                for (mk, md), a in top
            ],
        }
        if cat in ("tonneau-covers", "truck-bed-mats"):
            f["bedLengths"] = sorted(
                found(r"\b(\d(?:\.\d)?)\s*(?:ft|')\s*bed", lambda m: float(m.group(1))),
            )
        if cat == "tonneau-covers":
            styles = {"Hard tri-fold": r"hard tri-?fold", "Soft tri-fold": r"soft tri-?fold",
                      "Soft roll-up": r"roll-?up", "Hidden snap": r"hidden snap"}
            f["styles"] = [name for name, rx in styles.items() if re.search(rx, titles, re.I)]
        if cat == "trailer-hitches":
            f["classes"] = found(r"class\s*([1-5])\b", lambda m: int(m.group(1)))
            f["receivers"] = sorted(found(r'\b(1\.25|2)\s*(?:"|in(?:ch)?\b)', lambda m: m.group(1) + '"'))
        facts[cat] = f
        print(f"{cat}: {f['inStock']} in stock, top {[v['model'] for v in f['topVehicles'][:3]]}")
    OUT.write_text(json.dumps(facts, indent=1))
    print("wrote", OUT)


if __name__ == "__main__":
    main()
