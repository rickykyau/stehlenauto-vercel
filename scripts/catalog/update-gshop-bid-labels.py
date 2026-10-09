#!/usr/bin/env python3
"""Recompute Google Shopping custom labels on every active Shopify product.

Labels (metafield namespace mm-google-shopping, read by the Shopify Google channel):
  custom_label_0  vehicle      v_<model> | v_other           (reporting only)
  custom_label_1  stock        instock (5+) | thin_stock (1-4) | oos
  custom_label_2  dry pocket   ok | exclude_dry_pocket       (kept as-is; set by the 2026-07 audit)
  custom_label_3  bid bucket   bid_025 ... bid_200 | exclude_<reason>

The Ads campaign "Shopping - Standard - All Products - Tiered" subdivides its
product groups on custom_label_3 and sets one max CPC per bucket (bid_070 = $0.70),
so re-running this script re-prices the whole campaign without touching Ads.

Bid = price x expected CVR x net margin / profit cushion x category x vehicle x stock.
Net margin comes from CB cost (--cost-csv: ItemName,EffectiveCost,EstShipping_C, exported
from JLDataMart.shopify.vInventoryItem); without it every product uses DEFAULT_MARGIN.
Assumptions are documented in docs/runbooks/google-shopping-bids.md (2026-10-08 research).

Usage:  python3 scripts/catalog/update-gshop-bid-labels.py [--cost-csv F] [--log-dir D]  # dry run
        python3 scripts/catalog/update-gshop-bid-labels.py --apply ...                 # write
Shopify credentials: env SHOPIFY_SHOP_URL / SHOPIFY_ADMIN_TOKEN, else .env.local.
Scheduled daily on JL-SQL by scripts/windows/Sync-GShopBidLabels.ps1.
"""
import collections
import csv
import json
import os
import re
import sys
import time
import urllib.request
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
API = "2025-01"
NS = "mm-google-shopping"

# --- Tunables -----------------------------------------------------------------
PROFIT_CUSHION = 1.25        # bid for ROAS 25% above each product's breakeven (1 / margin)
DEFAULT_MARGIN = 0.317       # CB median net margin (price - cost - est. shipping), 2026-10-08
LIGHTING_RETURN_DRAG = 0.12  # lighting returns ~12% of revenue
MIN_MARGIN = 0.10            # below this a click can't pay back - exclude
BUCKETS = [0.25, 0.35, 0.50, 0.70, 0.90, 1.20, 1.60, 2.00]
MIN_PRICE = 100              # sub-$100 items can't pay back a ~$0.60+ click
THIN_STOCK = 5               # < 5 units = thin_stock
LIGHTING_ENABLED = True      # set False if the headlight moisture defect is unresolved
LIGHTING_MIN_QTY = 12        # only advertise lighting where stock is deep


def depth(qty):
    """Stock-depth multiplier: push deep inventory, ease off thin stock (quartiles 5/12/24/50)."""
    if qty >= 50: return 1.25
    if qty >= 24: return 1.15
    if qty >= 12: return 1.0
    if qty >= THIN_STOCK: return 0.9
    return 0.7


def cvr(price):
    """Expected conversion rate by price (AOV-band benchmarks, 2026)."""
    if price <= 200: return 0.016
    if price < 350: return 0.012
    if price < 500: return 0.010
    return 0.008


# (regex on productType, multiplier). First match wins; 0 = exclude.
CATEGORY = [
    (r"^headlight|^tail ?light", 1.0, None),          # return drag applied to margin instead
    (r"bed mat|floor mat", 0, "exclude_low_aov"),
    (r"tonneau.*(tri.?fold|hard)", 1.5, None),        # priced at/below Gator EFX, far below BAK
    (r"rock slider|roof (rack|basket)|running board|chase rack", 1.2, None),
    (r"tonneau", 0.7, None),                          # roll-up / hidden snap: no price edge
    (r"hitch", 1.0, None),                            # MC benchmark: mostly 10-55% under market
    (r"bull guard|grille guard", 1.0, None),
    (r"grille", 0.8, None),                           # MC benchmark: car grilles 18-39% over market
]
# 2025 US sales volume ranking (F-Series 801k, Silverado 577k, Ram 374k, Sierra 348k, Tacoma 275k)
VEHICLE = [
    ("f150", r"\bf-?150\b", 1.15), ("silverado", r"\bsilverado\b", 1.15),
    ("ram1500", r"\bram 1500\b", 1.15), ("tacoma", r"\btacoma\b", 1.1),
    ("sierra", r"\bsierra\b", 1.1), ("tundra", r"\btundra\b", 1.0),
    ("wrangler", r"\bwrangler\b", 1.0), ("frontier", r"\bfrontier\b", 0.9),
]
# SKUs with >8% historical return rate (marketing/lead-gen/paid-search.md)
RETURN_EXCLUDE = {"HLPLNB-TUN07FLED-AB", "HLPLNB-RAM06FLED-AB", "TBM-TIT16B-6.5-RB-V2", "TH-X507-C077-901"}


def env():
    out = {}
    f = ROOT / ".env.local"
    if f.exists():
        for line in f.read_text().splitlines():
            m = re.match(r"^([A-Z_]+)=(.*)$", line.strip())
            if m:
                out[m[1]] = m[2].strip("\"'")
    for k in ("SHOPIFY_SHOP_URL", "SHOPIFY_ADMIN_TOKEN"):
        if os.environ.get(k):
            out[k] = os.environ[k]
    return out


def load_costs(path):
    """ItemName -> landed cost (EffectiveCost + EstShipping_C)."""
    with open(path, newline="", encoding="utf-8-sig") as f:
        return {r["ItemName"].strip().upper(): float(r["EffectiveCost"] or 0) + float(r["EstShipping_C"] or 0)
                for r in csv.DictReader(f)}


def gql(shop, tok, query, variables=None):
    body = json.dumps({"query": query, "variables": variables or {}}).encode()
    for attempt in range(5):
        req = urllib.request.Request(f"https://{shop}/admin/api/{API}/graphql.json", body,
                                     {"X-Shopify-Access-Token": tok, "Content-Type": "application/json"})
        d = json.load(urllib.request.urlopen(req))
        if "errors" in d and "THROTTLED" in json.dumps(d["errors"]):
            time.sleep(2 ** attempt)
            continue
        if "errors" in d:
            raise RuntimeError(d["errors"])
        return d["data"]
    raise RuntimeError("throttled")


def fetch(shop, tok):
    q = """query($c:String){products(first:200,after:$c,query:"status:active"){pageInfo{hasNextPage endCursor}
      nodes{id handle title productType totalInventory variants(first:1){nodes{price}}
      cb:metafield(namespace:"cb_integration",key:"item_name"){value}
      metafields(namespace:"%s",first:20){nodes{key value}}}}}""" % NS
    out, cur = [], None
    while True:
        d = gql(shop, tok, q, {"c": cur})["products"]
        out += d["nodes"]
        if not d["pageInfo"]["hasNextPage"]:
            return out
        cur = d["pageInfo"]["endCursor"]


def vehicle(title):
    t = title.lower()
    for key, rx, mult in VEHICLE:
        if re.search(rx, t):
            return key, mult
    return "other", 0.9


def plan(p, costs=None):
    price = float(p["variants"]["nodes"][0]["price"])
    qty = max(p["totalInventory"] or 0, 0)
    ptype = (p["productType"] or "").lower()
    sku = ((p.get("cb") or {}).get("value") or "").upper()
    mf = {m["key"]: m["value"] for m in p["metafields"]["nodes"]}
    vkey, vmult = vehicle(p["title"])
    labels = {
        "custom_label_0": f"v_{vkey}",
        "custom_label_1": "oos" if qty == 0 else "thin_stock" if qty < THIN_STOCK else "instock",
        "custom_label_2": mf.get("custom_label_2") or "ok",
    }
    reason = None
    if qty == 0: reason = "exclude_oos"
    elif labels["custom_label_2"] != "ok": reason = "exclude_dry_pocket"
    elif sku in RETURN_EXCLUDE or sku.endswith("-901") or "visor" in ptype: reason = "exclude_returns"
    elif price < MIN_PRICE: reason = "exclude_low_aov"
    elif re.search(r"^headlight|^tail ?light", ptype) and (not LIGHTING_ENABLED or qty < LIGHTING_MIN_QTY):
        reason = "exclude_lighting"
    cost = (costs or {}).get(sku)
    margin = (price - cost) / price if cost else DEFAULT_MARGIN
    if re.search(r"^headlight|^tail ?light", ptype):
        margin -= LIGHTING_RETURN_DRAG
    if not reason and margin < MIN_MARGIN:
        reason = "exclude_low_margin"
    cmult = 1.0
    if not reason:
        for rx, mult, why in CATEGORY:
            if re.search(rx, ptype):
                cmult, reason = mult, why
                break
    if reason:
        labels["custom_label_3"] = reason
        return labels, mf
    bid = price * cvr(price) * margin / PROFIT_CUSHION * cmult * vmult
    if 100 <= price <= 200:
        bid *= 1.15                                   # owner call: buyers' $100-200 comfort zone
    bid *= depth(qty)
    b = max([x for x in BUCKETS if x <= bid] or [BUCKETS[0]])
    labels["custom_label_3"] = f"bid_{round(b * 100):03d}"
    return labels, mf


def arg(name):
    return sys.argv[sys.argv.index(name) + 1] if name in sys.argv else None


def main():
    apply = "--apply" in sys.argv
    costs = load_costs(arg("--cost-csv")) if arg("--cost-csv") else None
    if costs is not None and len(costs) < 100:
        sys.exit(f"cost file has {len(costs)} rows - aborting")
    log_dir = Path(arg("--log-dir") or ROOT / "data/logs")
    e = env()
    shop = e["SHOPIFY_SHOP_URL"].replace("https://", "").rstrip("/")
    tok = e["SHOPIFY_ADMIN_TOKEN"]
    products = fetch(shop, tok)
    if not products:
        sys.exit("0 products read - aborting")
    writes, log, dist = [], [], collections.Counter()
    for p in products:
        labels, old = plan(p, costs)
        dist[labels["custom_label_3"]] += 1
        for k, v in labels.items():
            if old.get(k) != v:
                writes.append({"ownerId": p["id"], "namespace": NS, "key": k,
                               "type": "single_line_text_field", "value": v})
                log.append({"id": p["id"], "handle": p["handle"], "key": k, "old": old.get(k), "new": v})
    for k in sorted(dist):
        print(f"{k:22} {dist[k]}")
    if costs is not None:
        missing = sum(1 for p in products if ((p.get("cb") or {}).get("value") or "").upper() not in costs)
        print(f"cost rows {len(costs)}, products without CB cost (default margin) {missing}")
    print(f"{len(products)} products, {len(writes)} label changes{'' if apply else ' (dry run)'}")
    if not apply or not writes:
        return
    log_dir.mkdir(parents=True, exist_ok=True)
    logf = log_dir / f"gshop-bid-labels-{date.today()}.jsonl"
    with logf.open("a") as f:
        for row in log:
            f.write(json.dumps(row) + "\n")
    m = "mutation($m:[MetafieldsSetInput!]!){metafieldsSet(metafields:$m){userErrors{field message}}}"
    errors = 0
    for i in range(0, len(writes), 25):
        ue = gql(shop, tok, m, {"m": writes[i:i + 25]})["metafieldsSet"]["userErrors"]
        if ue:
            errors += 1
            print("ERROR", ue)
        time.sleep(0.3)
    print(f"applied; {errors} batches with errors; log {logf}")
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
