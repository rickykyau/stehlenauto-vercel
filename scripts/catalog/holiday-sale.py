#!/usr/bin/env python3
"""
Holiday sale on the Shopify store: start / end a price-cut plan.

Start sets each planned product's price to its sale price and its compare-at
price to the regular price (the store shows the strikethrough, and the Google
channel sends it to Merchant Center as a sale price). End puts the regular
price back and restores the original compare-at.

Owner rules (2026-10-14): Black Friday window Nov 20 - Dec 1 2026, max 15% off,
all categories (owner widened it from headlights + bull guards). Each item gets
the deepest of 15 / 12 / 10% that still leaves >= 15% net margin after landed
cost (EffectiveCost + EstShipping_C) and, for lighting, the 12% return drag;
items that sell out in < 8 weeks at their 12-month pace stay full price.
The plan's "collection" (black-friday-deals) is filled and published on the
theme + stehlenauto.com at start, and unpublished at end.
The plan file is built once and reviewed; this script only applies it.

    python3 scripts/catalog/holiday-sale.py start --plan data/changes/bf-2026-sale-plan.json [--dry]
    python3 scripts/catalog/holiday-sale.py end   --plan data/changes/bf-2026-sale-plan.json [--dry]

Safety:
  * start skips a product whose current price no longer equals the planned
    regular price (someone repriced it) or that is out of stock.
  * end only reverts products still at the planned sale price.
  * every change is appended to <log-dir>/holiday-sale.jsonl.
"""
from __future__ import annotations

import json
import os
import sys
import time
import urllib.request
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MAX_DISCOUNT = 0.15


def arg(name: str) -> str | None:
    return sys.argv[sys.argv.index(name) + 1] if name in sys.argv else None


def load_env() -> dict[str, str]:
    env = {}
    f = ROOT / ".env.local"
    if f.exists():
        for line in f.read_text().splitlines():
            if "=" in line and not line.startswith("#"):
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip().strip('"')
    return env


ENV = load_env()
SHOP = (os.environ.get("SHOPIFY_SHOP_URL") or ENV.get("SHOPIFY_STORE_DOMAIN") or ENV.get("SHOPIFY_SHOP_URL", "")).replace("https://", "")
TOKEN = os.environ.get("SHOPIFY_ADMIN_TOKEN") or ENV.get("SHOPIFY_ADMIN_ACCESS_TOKEN") or ENV.get("SHOPIFY_ADMIN_TOKEN", "")
LOG_DIR = Path(arg("--log-dir") or ROOT / "data/logs")


def gql(query: str, variables: dict | None = None) -> dict:
    body = json.dumps({"query": query, "variables": variables or {}}).encode()
    for attempt in range(5):
        req = urllib.request.Request(f"https://{SHOP}/admin/api/2025-07/graphql.json", body,
                                     {"X-Shopify-Access-Token": TOKEN, "Content-Type": "application/json"})
        d = json.load(urllib.request.urlopen(req))
        if "errors" in d and "THROTTLED" in json.dumps(d["errors"]):
            time.sleep(2 ** attempt)
            continue
        if "errors" in d:
            raise RuntimeError(d["errors"])
        return d["data"]
    raise RuntimeError("throttled")


def current(pid: str) -> dict:
    return gql("""query($id:ID!){product(id:$id){totalInventory
      variants(first:1){nodes{id price compareAtPrice}}}}""", {"id": pid})["product"]


def set_price(pid: str, vid: str, price: float, compare: float | None) -> list:
    r = gql("""mutation($p:ID!,$v:[ProductVariantsBulkInput!]!){
      productVariantsBulkUpdate(productId:$p,variants:$v){userErrors{field message}}}""",
            {"p": pid, "v": [{"id": vid, "price": f"{price:.2f}",
                              "compareAtPrice": None if compare is None else f"{compare:.2f}"}]})
    return r["productVariantsBulkUpdate"]["userErrors"]


CHANNELS = ("Online Store", "Stehlen Next.js Storefront")   # theme + stehlenauto.com


def deals_collection(plan: dict, product_ids: list[str], mode: str, dry: bool) -> str:
    """start: create/refresh the plan's deals collection with the products actually
    on sale and publish it; end: unpublish it (kept for next year's reuse)."""
    handle = plan.get("collection")
    if not handle or dry:
        return f"collection {handle or '-'} unchanged{' (dry run)' if dry else ''}"
    pubs = [p["id"] for p in gql("{publications(first:20){nodes{id name}}}")["publications"]["nodes"]
            if p["name"] in CHANNELS]
    c = gql("query($h:String!){collectionByHandle(handle:$h){id}}", {"h": handle})["collectionByHandle"]
    if mode == "end":
        if c:
            gql("mutation($id:ID!,$p:[PublicationInput!]!){publishableUnpublish(id:$id,input:$p){userErrors{message}}}",
                {"id": c["id"], "p": [{"publicationId": x} for x in pubs]})
        return f"collection {handle} unpublished"
    if not c:
        c = gql("""mutation($i:CollectionInput!){collectionCreate(input:$i){collection{id} userErrors{message}}}""",
                {"i": {"title": plan.get("collection_title", "Black Friday Deals"), "handle": handle,
                       "sortOrder": "BEST_SELLING",
                       "descriptionHtml": plan.get("collection_description", "")}})["collectionCreate"]["collection"]
    else:   # refresh membership: drop last year's / skipped products
        keep = set(product_ids)
        old = gql("query($id:ID!){collection(id:$id){products(first:250){nodes{id}}}}", {"id": c["id"]})
        stale = [n["id"] for n in old["collection"]["products"]["nodes"] if n["id"] not in keep]
        if stale:
            gql("mutation($id:ID!,$p:[ID!]!){collectionRemoveProducts(id:$id,productIds:$p){userErrors{message}}}",
                {"id": c["id"], "p": stale})
    for i in range(0, len(product_ids), 250):
        gql("mutation($id:ID!,$p:[ID!]!){collectionAddProducts(id:$id,productIds:$p){userErrors{message}}}",
            {"id": c["id"], "p": product_ids[i:i + 250]})
    gql("mutation($id:ID!,$p:[PublicationInput!]!){publishablePublish(id:$id,input:$p){userErrors{message}}}",
        {"id": c["id"], "p": [{"publicationId": x} for x in pubs]})
    return f"collection {handle}: {len(product_ids)} products, published"


def main() -> None:
    mode = sys.argv[1] if len(sys.argv) > 1 else ""
    if mode not in ("start", "end") or not arg("--plan"):
        sys.exit(__doc__)
    dry = "--dry" in sys.argv
    plan = json.loads(Path(arg("--plan")).read_text(encoding="utf-8"))
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    log = (LOG_DIR / "holiday-sale.jsonl").open("a", encoding="utf-8")
    done = skipped = errors = 0
    on_sale: list[str] = []
    for item in plan["items"]:
        if item["sale"] < item["price"] * (1 - MAX_DISCOUNT) - 0.005:
            sys.exit(f"plan breaks the {MAX_DISCOUNT:.0%} cap: {item['handle']}")
        cur = current(item["id"])
        v = cur["variants"]["nodes"][0]
        price = float(v["price"])
        if mode == "start":
            if abs(price - item["price"]) > 0.005 or (cur["totalInventory"] or 0) <= 0:
                skipped += 1
                why = "repriced" if abs(price - item["price"]) > 0.005 else "out of stock"
                log.write(json.dumps({"at": datetime.now().isoformat(timespec="seconds"), "mode": mode,
                                      "handle": item["handle"], "skipped": why}) + "\n")
                continue
            item["orig_compare"] = v["compareAtPrice"]
            new_price, new_compare = item["sale"], item["price"]
        else:
            if abs(price - item["sale"]) > 0.005:
                skipped += 1
                continue
            new_price = item["price"]
            oc = item.get("orig_compare")
            new_compare = float(oc) if oc else None
        errs = [] if dry else set_price(item["id"], v["id"], new_price, new_compare)
        errors += bool(errs)
        done += not errs
        if not errs:
            on_sale.append(item["id"])
        log.write(json.dumps({"at": datetime.now().isoformat(timespec="seconds"), "mode": mode, "dry": dry,
                              "handle": item["handle"], "from": price, "to": new_price,
                              "compare_at": new_compare, "errors": errs}) + "\n")
    if mode == "start" and not dry:
        # remember each product's original compare-at for the end run
        Path(arg("--plan")).write_text(json.dumps(plan, indent=1), encoding="utf-8")
    print(f"{mode}{' (dry run)' if dry else ''}: {done} changed, {skipped} skipped, {errors} errors")
    print(deals_collection(plan, on_sale, mode, dry))


if __name__ == "__main__":
    main()
