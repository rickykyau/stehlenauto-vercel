#!/usr/bin/env python3
"""Fill in the Shopify standard product category on active products that have none.

AI shopping agents (Meta Muse, ChatGPT) and the Google feed read Shopify's standard
taxonomy category to know what a product is; 602 of 1,748 active products had none
on 2026-10-23. Only products with an EMPTY category are touched — existing
categories are never changed. The category comes from our own custom.category
metafield (falling back to productType), mapped to the same taxonomy node the
already-categorized products of that type use. Bed mats go to Cargo Liners.

Usage:  python3 scripts/catalog/set-missing-product-categories.py           # dry run
        python3 scripts/catalog/set-missing-product-categories.py --apply   # write
Log (one line per product, with the old value for rollback):
        data/logs/product-category-fill-<date>.jsonl
Rollback: productUpdate each logged id with category: null.
"""
import json
import re
import sys
import urllib.request
from collections import Counter
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
API = "2026-10"
TAX = "gid://shopify/TaxonomyCategory/"

CATEGORY_MAP = {
    "Trailer Hitches": "vp-1-4-18-6",
    "Front Grilles": "vp-1-4-9-4",
    "Tonneau Covers": "vp-1-5-3-3",
    "Headlights": "vp-1-4-12-2",
    "Bull Guards": "vp-1-4-9-1",       # Bumpers, as the categorized bull guards use
    "Running Boards": "vp-1-4-9-12",   # Side Panels, as the categorized running boards use
    "Roof Racks": "vp-1-7-3-4",        # Vehicle Cargo Racks
    "Floor Mats": "vp-1-4-11-3",
    "Truck Bed Mats": "vp-1-4-2-1",    # Cargo Liners
    "Storage": "vp-1-4-11-2",          # Car Organizers
}
BED_MAT = re.compile(r"\bbed (mat|liner)\b", re.I)
CARGO_LINERS = "vp-1-4-2-1"


def load_env():
    env = {}
    for line in (ROOT / ".env.local").read_text().splitlines():
        m = re.match(r"^([A-Z0-9_]+)=(.*)$", line.strip())
        if m:
            env[m[1]] = m[2].strip("\"'")
    return env


def gq(env, query, variables=None):
    shop = env["SHOPIFY_SHOP_URL"].replace("https://", "").rstrip("/")
    req = urllib.request.Request(
        f"https://{shop}/admin/api/{API}/graphql.json",
        data=json.dumps({"query": query, "variables": variables or {}}).encode(),
        headers={"X-Shopify-Access-Token": env["SHOPIFY_ADMIN_TOKEN"], "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as r:
        d = json.load(r)
    if d.get("errors"):
        raise RuntimeError(d["errors"])
    return d["data"]


def uncategorized(env):
    out, cur = [], None
    while True:
        d = gq(env, """query($c:String){products(first:250,after:$c,query:"status:active"){
            pageInfo{hasNextPage endCursor}
            nodes{id title productType category{id} metafield(namespace:"custom",key:"category"){value}}}}""",
               {"c": cur})["products"]
        out += [p for p in d["nodes"] if not p["category"]]
        if not d["pageInfo"]["hasNextPage"]:
            return out
        cur = d["pageInfo"]["endCursor"]


def target(p):
    ours = (p["metafield"] or {}).get("value") or p["productType"]
    if BED_MAT.search(p["title"]):
        return ours, CARGO_LINERS
    return ours, CATEGORY_MAP.get(ours)


def main():
    apply = "--apply" in sys.argv
    env = load_env()
    todo = uncategorized(env)
    plan = Counter()
    skipped = Counter()
    log = ROOT / "data" / "logs" / f"product-category-fill-{date.today()}.jsonl"
    done = failed = 0
    with open(log, "a") if apply else open("/dev/null", "w") as f:
        for p in todo:
            ours, node = target(p)
            if not node:
                skipped[ours] += 1
                continue
            plan[(ours, node)] += 1
            if not apply:
                continue
            res = gq(env, """mutation($p:ProductUpdateInput!){productUpdate(product:$p){
                product{id category{id}} userErrors{field message}}}""",
                     {"p": {"id": p["id"], "category": TAX + node}})["productUpdate"]
            ok = not res["userErrors"] and (res["product"]["category"] or {}).get("id") == TAX + node
            done += ok
            failed += not ok
            f.write(json.dumps({"id": p["id"], "title": p["title"], "ours": ours, "old": None,
                                "new": TAX + node, "ok": ok, "errors": res["userErrors"]}) + "\n")
    print(f"{len(todo)} active products without a category")
    for (ours, node), n in plan.most_common():
        print(f"  {n:4}  {ours:<16} -> {node}")
    if skipped:
        print("  no mapping (left alone):", dict(skipped))
    if apply:
        print(f"updated {done}, failed {failed}; log {log.relative_to(ROOT)}")
    else:
        print("dry run — add --apply to write")


if __name__ == "__main__":
    main()
