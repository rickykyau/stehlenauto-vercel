#!/usr/bin/env python3
"""
Build the Shopify theme's vehicle-picker list (assets/stehlen-ymm.json) and
upload it to the live theme.

Why: the theme picker used to crawl /collections/all/products.json (7 requests
on every first visit) and cross-multiply every make x model x year tag on a
product, so "Ford" listed Lincoln/Mercury models and years from other
vehicles. This keeps the CA-fitment pairing from data/ymm_tree.json and only
offers a year/make/model when at least one ACTIVE product's custom.make /
custom.model / custom.year metafields contain it, so the picker's result page
(/collections/all?filter.p.m.custom.*) never comes back empty.

Output shape: { "<Make>": { "<Model>": ["2026", "2025", ...] } }

Products not yet in data/ymm_tree.json (new items) are added from their own
custom.* metafields when they fit a single make. Runs daily on JL-SQL
(scripts/windows/Build-ThemeYmm.ps1); re-run by hand after ymm_tree rebuilds:
    python3 scripts/catalog/build-theme-ymm.py          # build + upload
    python3 scripts/catalog/build-theme-ymm.py --dry    # build only
"""
from __future__ import annotations

import json
import os
import sys
import urllib.request
from collections import defaultdict
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
THEME_ID = "gid://shopify/OnlineStoreTheme/153227329583"  # stehlen-auto-theme/main (live)
MAKE_ALIASES = {"Chevy": "Chevrolet", "VW": "Volkswagen"}


def arg(name: str) -> str | None:
    return sys.argv[sys.argv.index(name) + 1] if name in sys.argv else None


def load_env() -> dict[str, str]:
    """.env.local in the repo; on JL-SQL the wrapper passes SHOPIFY_SHOP_URL / SHOPIFY_ADMIN_TOKEN instead."""
    env = {}
    f = ROOT / ".env.local"
    if f.exists():
        for line in f.read_text().splitlines():
            if "=" in line and not line.startswith("#"):
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip().strip('"')
    for k in ("SHOPIFY_SHOP_URL", "SHOPIFY_ADMIN_TOKEN"):
        if os.environ.get(k):
            env[k] = os.environ[k]
    return env


ENV = load_env()
SHOP = (os.environ.get("SHOPIFY_SHOP_URL") or ENV.get("SHOPIFY_STORE_DOMAIN") or ENV.get("SHOPIFY_SHOP_URL", "")).replace("https://", "")
TOKEN = os.environ.get("SHOPIFY_ADMIN_TOKEN") or ENV.get("SHOPIFY_ADMIN_ACCESS_TOKEN") or ENV.get("SHOPIFY_ADMIN_TOKEN", "")
TREE = Path(arg("--tree") or ROOT / "data/ymm_tree.json")
LOG_DIR = Path(arg("--log-dir") or ROOT / "data/logs")


def gql(query: str, variables: dict | None = None) -> dict:
    req = urllib.request.Request(
        f"https://{SHOP}/admin/api/2025-07/graphql.json",
        data=json.dumps({"query": query, "variables": variables or {}}).encode(),
        headers={"X-Shopify-Access-Token": TOKEN, "Content-Type": "application/json"},
    )
    out = json.load(urllib.request.urlopen(req))
    if out.get("errors"):
        raise RuntimeError(out["errors"])
    return out["data"]


def product_vehicle_fields() -> dict[str, tuple[set, set, set]]:
    q = """query($c:String){products(first:250,after:$c,query:"status:active"){
      pageInfo{hasNextPage endCursor}
      nodes{handle
        mk:metafield(namespace:"custom",key:"make"){value}
        md:metafield(namespace:"custom",key:"model"){value}
        yr:metafield(namespace:"custom",key:"year"){value}}}}"""
    out, cur = {}, None
    while True:
        d = gql(q, {"c": cur})["products"]
        for p in d["nodes"]:
            val = lambda k: set(json.loads(p[k]["value"])) if p[k] else set()
            out[p["handle"]] = ({MAKE_ALIASES.get(m, m) for m in val("mk")}, val("md"), val("yr"))
        if not d["pageInfo"]["hasNextPage"]:
            return out
        cur = d["pageInfo"]["endCursor"]


def build() -> tuple[dict, int, int]:
    fields = product_vehicle_fields()
    tree = json.loads(TREE.read_text(encoding="utf-8"))
    picked: dict[str, dict[str, set]] = defaultdict(lambda: defaultdict(set))
    kept = dropped = 0
    in_tree = {h for makes in tree.values() for models in makes.values() for hs in models.values() for h in hs}
    # New items that ymm_tree.json doesn't know yet: a single-make product's own
    # metafields pair safely (every model/year belongs to that make). Multi-make
    # products wait for the next ymm_tree rebuild rather than risk cross-pairing.
    new_items = 0
    for h, (makes, models, years) in fields.items():
        if h in in_tree or len(makes) != 1 or not models or not years:
            continue
        make = next(iter(makes))
        for model in models:
            picked[make][model].update(y for y in years if y.isdigit())
        new_items += 1
    for year, makes in tree.items():
        for make, models in makes.items():
            for model, handles in models.items():
                if any(
                    h in fields and make in fields[h][0] and model in fields[h][1] and year in fields[h][2]
                    for h in handles
                ):
                    picked[make][model].add(year)
                    kept += 1
                else:
                    dropped += 1
    result = {
        make: {model: sorted(years, key=int, reverse=True) for model, years in sorted(models.items())}
        for make, models in sorted(picked.items())
    }
    print(f"{new_items} products not in ymm_tree.json added from their own single-make metafields")
    return result, kept, dropped


def main() -> None:
    result, kept, dropped = build()
    body = json.dumps(result, separators=(",", ":"))
    print(f"{len(result)} makes, {kept} year/make/model kept, {dropped} dropped (no matching product), {len(body)} bytes")
    if "--dry" in sys.argv:
        return
    r = gql(
        """mutation($id:ID!,$files:[OnlineStoreThemeFilesUpsertFileInput!]!){
          themeFilesUpsert(themeId:$id,files:$files){upsertedThemeFiles{filename} userErrors{field message}}}""",
        {"id": THEME_ID, "files": [{"filename": "assets/stehlen-ymm.json", "body": {"type": "TEXT", "value": body}}]},
    )["themeFilesUpsert"]
    if r["userErrors"]:
        raise RuntimeError(r["userErrors"])
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    with (LOG_DIR / "theme-ymm-builds.jsonl").open("a") as f:
        f.write(json.dumps({"at": datetime.now().isoformat(timespec="seconds"), "makes": len(result),
                            "kept": kept, "dropped": dropped, "bytes": len(body)}) + "\n")
    print("uploaded assets/stehlen-ymm.json")


if __name__ == "__main__":
    main()
