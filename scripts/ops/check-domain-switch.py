#!/usr/bin/env python3
"""
Checks for the Shopify primary-domain switch (stehlenauto.myshopify.com ->
shop.stehlenauto.com) and the Merchant Center move to stehlenauto.com.

ChatGPT is the top order source and its links point at
stehlenauto.myshopify.com/products/... . The switch must keep every one of
those links opening the same product, on phone and desktop, with a working
cart -> checkout. The baseline holds the product links AI assistants actually
sent people to (GA4, last 90 days) plus the landing pages of AI-referred orders.

    python3 scripts/ops/check-domain-switch.py baseline   # rebuild the baseline (Shopify orders + --ga4 json)
    python3 scripts/ops/check-domain-switch.py check      # run every check, print a pass/fail summary
    python3 scripts/ops/check-domain-switch.py check --new-site   # also check stehlenauto.com/products/<handle> (Step 4)

Results go to data/logs/domain-switch-checks.jsonl. Safe to run any time:
it only reads pages and adds one item to a throwaway cart.
"""
from __future__ import annotations

import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from http.cookiejar import CookieJar
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BASELINE = ROOT / "data/changes/domain-switch-2026-10-23-baseline.json"
LOG = ROOT / "data/logs/domain-switch-checks.jsonl"
OLD_HOST = "stehlenauto.myshopify.com"
NEW_HOST = "shop.stehlenauto.com"
UA = {
    "phone": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
    "desktop": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
}


def arg(name: str) -> str | None:
    return sys.argv[sys.argv.index(name) + 1] if name in sys.argv else None


def load_env() -> dict[str, str]:
    env = {}
    for line in (ROOT / ".env.local").read_text().splitlines():
        if "=" in line and not line.startswith("#"):
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip().strip('"')
    return env


ENV = load_env()
SHOP = (ENV.get("SHOPIFY_STORE_DOMAIN") or ENV.get("SHOPIFY_SHOP_URL", "")).replace("https://", "")
TOKEN = ENV.get("SHOPIFY_ADMIN_ACCESS_TOKEN") or ENV.get("SHOPIFY_ADMIN_TOKEN", "")


def gql(query: str, variables: dict | None = None) -> dict:
    req = urllib.request.Request(f"https://{SHOP}/admin/api/2025-07/graphql.json",
                                 json.dumps({"query": query, "variables": variables or {}}).encode(),
                                 {"X-Shopify-Access-Token": TOKEN, "Content-Type": "application/json"})
    out = json.load(urllib.request.urlopen(req))
    if out.get("errors"):
        raise RuntimeError(out["errors"])
    return out["data"]


def handle_of(path: str) -> str | None:
    m = re.match(r"^/(?:collections/[^/]+/)?products/([^/?#]+)", path)
    return m.group(1) if m else None


def build_baseline() -> None:
    handles: dict[str, dict] = {}
    ga4 = arg("--ga4")   # rows [source, host, landingPage, sessions, addToCarts, purchases]
    if ga4:
        for src, host, lp, ses, atc, buys in json.loads(Path(ga4).read_text()):
            h = handle_of(lp)
            if h:
                e = handles.setdefault(h, {"handle": h, "ai_sessions": 0, "ai_orders": 0})
                e["ai_sessions"] += ses
    q = """query($c:String){orders(first:100,after:$c,query:"created_at:>=2026-04-01"){pageInfo{hasNextPage endCursor}
      nodes{name customerJourneySummary{lastVisit{source landingPage} firstVisit{source landingPage}}}}}"""
    cur = None
    while True:
        d = gql(q, {"c": cur})["orders"]
        for o in d["nodes"]:
            j = o["customerJourneySummary"] or {}
            v = j.get("lastVisit") or j.get("firstVisit") or {}
            if re.search(r"chatgpt|openai|perplexity|copilot|gemini", v.get("source") or "", re.I):
                h = handle_of(urllib.parse.urlparse(v.get("landingPage") or "").path)
                if h:
                    e = handles.setdefault(h, {"handle": h, "ai_sessions": 0, "ai_orders": 0})
                    e["ai_orders"] += 1
        if not d["pageInfo"]["hasNextPage"]:
            break
        cur = d["pageInfo"]["endCursor"]
    rows = sorted(handles.values(), key=lambda e: (-e["ai_orders"], -e["ai_sessions"]))
    BASELINE.write_text(json.dumps({"built": datetime.now().isoformat(timespec="seconds"),
                                    "products": rows}, indent=1))
    print(f"baseline: {len(rows)} product links ({sum(e['ai_orders'] > 0 for e in rows)} with AI orders) -> {BASELINE}")


def fetch(url: str, ua: str) -> tuple[int, str, str]:
    """GET following redirects; returns (status, final url, body)."""
    req = urllib.request.Request(url, headers={"User-Agent": ua})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                return r.status, r.geturl(), r.read().decode("utf-8", "replace")
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt < 2:
                time.sleep(15 * (attempt + 1))   # Shopify storefront rate limit
                continue
            return e.code, e.geturl(), ""
        except Exception as e:  # noqa: BLE001
            return 0, url, str(e)
    return 429, url, ""


def check_link(handle: str, device: str, host: str) -> dict:
    status, final, body = fetch(f"https://{host}/products/{handle}", UA[device])
    final_host = urllib.parse.urlparse(final).netloc
    ok = (status == 200 and handle_of(urllib.parse.urlparse(final).path) == handle
          and ('name="add"' in body or "/cart/add" in body or "add to cart" in body.lower()))
    return {"handle": handle, "device": device, "from": host, "status": status,
            "final_host": final_host, "ok": ok}


def check_checkout(handle: str) -> dict:
    """Add one unit to a throwaway cart on the old host and open /checkout."""
    jar = CookieJar()
    op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
    op.addheaders = [("User-Agent", UA["phone"])]
    try:
        prod = json.load(op.open(f"https://{OLD_HOST}/products/{handle}.js", timeout=30))
        variant = next((v for v in prod["variants"] if v.get("available")), None)
        if not variant:
            return {"handle": handle, "ok": None, "note": "out of stock, skipped"}
        base = urllib.parse.urlparse(op.open(f"https://{OLD_HOST}/products/{handle}", timeout=30).geturl()).netloc
        op.open(urllib.request.Request(f"https://{base}/cart/add.js",
                                       json.dumps({"items": [{"id": variant["id"], "quantity": 1}]}).encode(),
                                       {"Content-Type": "application/json"}), timeout=30)
        r = op.open(f"https://{base}/checkout", timeout=30)
        final = r.geturl()
        ok = r.status == 200 and "/checkouts/" in final
        return {"handle": handle, "ok": ok, "checkout_url_host": urllib.parse.urlparse(final).netloc}
    except Exception as e:  # noqa: BLE001
        return {"handle": handle, "ok": False, "error": str(e)[:200]}


def main() -> None:
    mode = sys.argv[1] if len(sys.argv) > 1 else ""
    if mode == "baseline":
        return build_baseline()
    if mode != "check":
        sys.exit(__doc__)
    products = json.loads(BASELINE.read_text())["products"]
    handles = [p["handle"] for p in products]
    primary = gql("{shop{primaryDomain{host}}}")["shop"]["primaryDomain"]["host"]
    active = {n["handle"] for n in paginate_active()}
    gone = [h for h in handles if h not in active]
    live = [h for h in handles if h in active]
    jobs = [(h, d, OLD_HOST) for h in live for d in UA]
    if "--new-site" in sys.argv:
        jobs += [(h, "phone", "stehlenauto.com") for h in live]
    def run(j):
        if j[2] != "stehlenauto.com":
            time.sleep(1.0)   # one request a second keeps the Shopify storefront from rate-limiting us
        return check_link(*j)
    shopify = [j for j in jobs if j[2] != "stehlenauto.com"]
    vercel = [j for j in jobs if j[2] == "stehlenauto.com"]
    with ThreadPoolExecutor(4) as ex:
        new_site = ex.map(run, vercel)
        results = [run(j) for j in shopify] + list(new_site)
    top = [p["handle"] for p in products if p["ai_orders"] > 0 and p["handle"] in active][:3]
    checkouts = [check_checkout(h) for h in top]
    fails = [r for r in results if not r["ok"]]
    hosts = sorted({r["final_host"] for r in results if r["from"] == OLD_HOST})
    summary = {"at": datetime.now().isoformat(timespec="seconds"), "primary_domain": primary,
               "links_checked": len(results), "link_failures": len(fails), "old_links_land_on": hosts,
               "not_active_anymore": gone, "checkouts": checkouts, "failures": fails[:50]}
    LOG.parent.mkdir(parents=True, exist_ok=True)
    with LOG.open("a") as f:
        f.write(json.dumps(summary) + "\n")
    print(f"primary domain: {primary}")
    print(f"old ChatGPT links: {len(results) - len(fails)}/{len(results)} OK, landing on {', '.join(hosts)}")
    print(f"skipped (product no longer active): {len(gone)}")
    for c in checkouts:
        print(f"checkout via {c['handle'][:50]}: {'OK' if c['ok'] else c}")
    for r in fails[:20]:
        print(f"  FAIL {r['device']:7} {r['from']} /products/{r['handle'][:60]} -> {r['status']} {r['final_host']}")


def paginate_active():
    q = """query($c:String){products(first:250,after:$c,query:"status:active"){pageInfo{hasNextPage endCursor} nodes{handle}}}"""
    cur = None
    while True:
        d = gql(q, {"c": cur})["products"]
        yield from d["nodes"]
        if not d["pageInfo"]["hasNextPage"]:
            return
        cur = d["pageInfo"]["endCursor"]


if __name__ == "__main__":
    main()
