#!/usr/bin/env python3
"""
Build the OpenAI Agentic Commerce (ACP) product feed for Stehlen Auto.

OpenAI's ChatGPT merchant feed is the ACP product-feed spec (version 2026-01-30),
NOT a Google Shopping feed. This pulls the live Shopify catalog (active products)
and emits JSONL (one product per line) + a gzipped copy for SFTP delivery, plus a
validation report.

Field formats verified against developers.openai.com/commerce:
  price            -> "165.00 USD"   (number + space + ISO-4217)
  availability     -> in_stock | out_of_stock | pre_order | backorder | unknown
  image_url        -> https URL
  is_eligible_search / is_eligible_checkout -> booleans (search default false=invisible)

Decisions:
  * is_eligible_search = True  (we WANT discovery — default false hides the product)
  * is_eligible_checkout = False (discovery only; checkout redirects to our storefront,
    matching OpenAI's Mar-2026 pivot. Flip to True later only with ACP checkout wired.)
  * url uses the canonical https://stehlenauto.com/... (NOT Shopify's onlineStoreUrl,
    which returns the *.myshopify.com host).
  * brand: keep recognized real brands (CURT); map supplier codes / Generic / blank
    -> "Stehlen Auto" (clean consumer-facing brand; titles carry the real fitment signal).
  * fitment: stays in title (YMM) + description ("Vehicle Fitment" section) — the
    signal ChatGPT reads to match a part to a shopper's exact vehicle.

Pure stdlib. Reads SHOPIFY_SHOP_URL + SHOPIFY_ADMIN_TOKEN from .env.local.
Usage: python3 scripts/build-openai-acp-feed.py
Output: marketing/feeds/openai/{products.jsonl, products.jsonl.gz, sample.json, report.txt}
"""
import gzip
import html
import json
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
OUT_DIR = REPO / "marketing/feeds/openai"
SITE = "https://stehlenauto.com"

SELLER = {
    "seller_name": "Stehlen Auto",
    "seller_url": SITE,
    "seller_privacy_policy": f"{SITE}/legal/privacy",
    "seller_tos": f"{SITE}/legal/terms",
}
# Real consumer brands to preserve (case-insensitive); everything else -> Stehlen Auto.
KEEP_BRANDS = {"curt"}


def load_env():
    env = {}
    for line in (REPO / ".env.local").read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip().strip('"').strip("'")
    return env


ENV = load_env()
SHOP = re.sub(r"^https?://", "", ENV.get("SHOPIFY_SHOP_URL", "")).rstrip("/")
TOKEN = ENV.get("SHOPIFY_ADMIN_TOKEN", "")


def gql(query, variables=None):
    body = json.dumps({"query": query, "variables": variables or {}}).encode()
    req = urllib.request.Request(
        f"https://{SHOP}/admin/api/2025-01/graphql.json", data=body,
        headers={"X-Shopify-Access-Token": TOKEN, "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        out = json.load(r)
    if "errors" in out:
        raise RuntimeError(out["errors"])
    return out["data"]


PAGE = """
query($cursor: String) {
  products(first: 100, after: $cursor, query: "status:active") {
    pageInfo { hasNextPage endCursor }
    nodes {
      id handle title descriptionHtml vendor productType
      featuredImage { url }
      mpn: metafield(namespace: "cb_integration", key: "item_name") { value }
      variants(first: 1) { nodes { id sku price availableForSale } }
    }
  }
}
"""


def numeric_id(gid):
    return gid.rsplit("/", 1)[-1]


def html_to_text(s):
    if not s:
        return ""
    # Source HTML carries literal newlines/tabs between tags — drop them first so
    # the only line breaks are the block boundaries we insert below.
    s = re.sub(r"[\r\n\t]+", " ", s)
    s = re.sub(r"(?i)<li[^>]*>", "\n- ", s)
    s = re.sub(r"(?i)</(p|ul|ol|h\d|div)\s*>", "\n", s)
    s = re.sub(r"(?i)<br\s*/?>", "\n", s)
    s = re.sub(r"<[^>]+>", "", s)
    s = html.unescape(s)
    s = re.sub(r"[ \t]+", " ", s)
    s = re.sub(r" *\n *", "\n", s)
    s = re.sub(r"\n{2,}", "\n", s).strip()
    return s[:5000]


def clean_brand(vendor):
    v = (vendor or "").strip()
    if v.lower() in KEEP_BRANDS:
        return v.upper() if v.lower() == "curt" else v
    return "Stehlen Auto"


def fix_title(t):
    t = (t or "").strip()
    if t and t.isupper():  # spec: avoid all-caps
        t = t.title()
    return t[:150]


def build():
    products, cursor = [], None
    while True:
        data = gql(PAGE, {"cursor": cursor})["products"]
        products.extend(data["nodes"])
        if not data["pageInfo"]["hasNextPage"]:
            break
        cursor = data["pageInfo"]["endCursor"]

    rows, skipped, brand_dist = [], [], {}
    for p in products:
        variants = p.get("variants", {}).get("nodes", [])
        v = variants[0] if variants else None
        img = (p.get("featuredImage") or {}).get("url")
        price = v.get("price") if v else None
        # Required-field gate: a row missing image or price can't validate.
        if not img or not price or not v:
            skipped.append({"handle": p["handle"], "reason":
                            "no image" if not img else "no price/variant"})
            continue
        brand = clean_brand(p.get("vendor"))
        brand_dist[brand] = brand_dist.get(brand, 0) + 1
        row = {
            "is_eligible_search": True,
            "is_eligible_checkout": False,
            "item_id": numeric_id(v["id"]),
            "item_group_id": numeric_id(p["id"]),
            "listing_has_variations": False,
            "title": fix_title(p["title"]),
            "description": html_to_text(p.get("descriptionHtml")),
            "url": f"{SITE}/products/{p['handle']}",
            "image_url": img,
            "brand": brand,
            "price": f"{float(price):.2f} USD",
            "availability": "in_stock" if v.get("availableForSale") else "out_of_stock",
            "condition": "new",
            "target_countries": ["US"],
            "store_country": "US",
            **SELLER,
        }
        mpn = (p.get("mpn") or {}).get("value")
        if mpn:
            row["mpn"] = mpn
        rows.append(row)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    jsonl = OUT_DIR / "products.jsonl"
    with jsonl.open("w", encoding="utf-8") as f:
        for r in rows:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")
    with gzip.open(OUT_DIR / "products.jsonl.gz", "wt", encoding="utf-8") as f:
        for r in rows:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")
    (OUT_DIR / "sample.json").write_text(
        json.dumps(rows[:3], indent=2, ensure_ascii=False), encoding="utf-8")

    # Validation report
    long_titles = [r["item_id"] for r in rows if len(r["title"]) > 150]
    no_desc = sum(1 for r in rows if not r["description"])
    oos = sum(1 for r in rows if r["availability"] == "out_of_stock")
    lines = [
        "OpenAI ACP product feed — build report",
        "=" * 44,
        f"active products pulled : {len(products)}",
        f"rows written           : {len(rows)}",
        f"skipped (missing req)  : {len(skipped)}",
        f"  out_of_stock         : {oos}",
        f"  empty description    : {no_desc}",
        f"  title >150 chars     : {len(long_titles)}",
        "",
        "brand distribution (after cleanup):",
        *[f"  {b:<16} {c}" for b, c in sorted(brand_dist.items(), key=lambda x: -x[1])],
    ]
    if skipped:
        lines += ["", "skipped products:"]
        lines += [f"  {s['handle']} — {s['reason']}" for s in skipped[:40]]
    (OUT_DIR / "report.txt").write_text("\n".join(lines), encoding="utf-8")
    print("\n".join(lines))
    print(f"\nWrote: {jsonl}  +  products.jsonl.gz  +  sample.json  +  report.txt")


if __name__ == "__main__":
    if not SHOP or not TOKEN:
        sys.exit("Missing SHOPIFY_SHOP_URL / SHOPIFY_ADMIN_TOKEN in .env.local")
    build()
