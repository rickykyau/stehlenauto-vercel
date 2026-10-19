#!/usr/bin/env python3
"""Weekly Google Shopping tune-up for the Stehlen Standard Shopping campaign.

Every Monday (JL-SQL Task Scheduler, via scripts/windows/Run-GShopWeeklyTuneup.ps1):
  1. Pulls the last 7 days (and campaign-to-date) from:
       - Google Ads API: campaign totals, each custom_label_3 bid bucket, search terms
       - GA4: Paid Shopping funnel (sessions -> add_to_cart -> begin_checkout -> purchase)
       - Merchant API: products priced >15% above Google's benchmark
       - Shopify: orders and their source
  2. Adjusts bucket bids within guardrails (only buckets with enough data; max +/-10%
     a week; floor $0.25, cap $2.50). Every change is logged.
  3. Lists search terms that spent money with no sale as negative-keyword candidates
     (reported, NOT added).
  4. Inventory: restock alerts (days of stock at the last-30-day sales pace) and ad
     spend on products that are out of stock.
  5. AI analyst (OpenAI, model in AI_MODEL): reads the week's numbers and writes a
     summary, anomaly flags, search-term judgments and 1-3 recommended actions.
     ADVISORY ONLY — bids are changed solely by the fixed rules above.
  6. Emails a plain report via Brevo.

The daily 05:20 job (update-gshop-bid-labels.py) decides which products sit in
which bucket; this job tunes what each bucket pays. Bid logic: docs/runbooks/google-shopping-bids.md

Usage:  python3 scripts/catalog/gshop-weekly-tuneup.py                    # dry run, prints report
        python3 scripts/catalog/gshop-weekly-tuneup.py --apply --email    # change bids + send email
Credentials (env wins, else repo .env.local / .secrets/google-ads-token.json):
  GOOGLE_OAUTH_CLIENT_ID / _SECRET / _REFRESH_TOKEN, SHOPIFY_SHOP_URL, SHOPIFY_ADMIN_TOKEN,
  BREVO_API_KEY, TUNEUP_EMAIL_TO (comma list), OPENAI_API_KEY, AI_MODEL (default gpt-6-astra).
"""
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import date, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ADS_CUSTOMER = "4449235809"
ADS_MANAGER = "4889521672"
CAMPAIGN_ID = "24334904627"
GA4_PROPERTY = "529120634"
MERCHANT_ID = "5750851984"
ADS_API = "v23"

# Guardrails
MIN_CLICKS = 60            # a bucket needs this many clicks (campaign-to-date) before we touch it
STEP = 0.10                # max change per week
FLOOR, CAP = 0.25, 2.50
TARGET_ROAS = 3.5          # same target the bucket bids were built for
BREAKEVEN_ROAS = 3.2       # ~1 / 31.7% median net margin
NEG_MIN_COST = 4.00        # search term spent at least this with no conversion
NEG_MIN_CLICKS = 4
RESTOCK_DAYS = 21          # flag products with fewer days of stock than this
AI_MODEL_DEFAULT = "gpt-6-astra"
CAMPAIGN_LAUNCHED = "2026-10-09"


def load_env():
    env = {}
    f = ROOT / ".env.local"
    if f.exists():
        for line in f.read_text().splitlines():
            m = re.match(r"^([A-Z0-9_]+)=(.*)$", line.strip())
            if m:
                env[m[1]] = m[2].strip("\"'")
    tok = ROOT / ".secrets" / "google-ads-token.json"
    if tok.exists():
        t = json.loads(tok.read_text())
        env.setdefault("GOOGLE_OAUTH_CLIENT_ID", t["client_id"])
        env.setdefault("GOOGLE_OAUTH_CLIENT_SECRET", t["client_secret"])
        env.setdefault("GOOGLE_OAUTH_REFRESH_TOKEN", t["refresh_token"])
    env.update({k: v for k, v in os.environ.items() if v})
    return env


def http(url, body=None, headers=None, method=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, headers=headers or {}, method=method)
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            raw = r.read()
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"{url.split('?')[0]} -> {e.code}: {e.read()[:300].decode(errors='replace')}")


def google_token(env):
    body = urllib.parse.urlencode({
        "client_id": env["GOOGLE_OAUTH_CLIENT_ID"], "client_secret": env["GOOGLE_OAUTH_CLIENT_SECRET"],
        "refresh_token": env["GOOGLE_OAUTH_REFRESH_TOKEN"], "grant_type": "refresh_token"}).encode()
    with urllib.request.urlopen(urllib.request.Request("https://oauth2.googleapis.com/token", data=body)) as r:
        return json.load(r)["access_token"]


class Ads:
    def __init__(self, at):
        self.h = {"Authorization": "Bearer " + at, "login-customer-id": ADS_MANAGER, "Content-Type": "application/json"}

    def q(self, gaql):
        out, page = [], None
        while True:
            body = {"query": gaql} | ({"pageToken": page} if page else {})
            d = http(f"https://googleads.googleapis.com/{ADS_API}/customers/{ADS_CUSTOMER}/googleAds:search", body, self.h)
            out += d.get("results", [])
            page = d.get("nextPageToken")
            if not page:
                return out

    def set_bids(self, ops):
        body = {"operations": [{"update": {"resourceName": rn, "cpcBidMicros": str(int(round(bid * 1e6)))},
                                "updateMask": "cpc_bid_micros"} for rn, bid in ops]}
        return http(f"https://googleads.googleapis.com/{ADS_API}/customers/{ADS_CUSTOMER}/adGroupCriteria:mutate", body, self.h)


def m(x, k, default=0.0):
    return float((x.get("metrics") or {}).get(k, default) or 0)


def ads_section(ads, d7, d0):
    rng = f"segments.date BETWEEN '{d7}' AND '{d0}'"
    camp = ads.q(f"SELECT metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions, "
                 f"metrics.conversions_value FROM campaign WHERE campaign.id = {CAMPAIGN_ID} AND {rng}")
    tot = {k: sum(m(r, k) for r in camp) for k in ("impressions", "clicks", "costMicros", "conversions", "conversionsValue")}
    # Buckets: product groups split on custom_label_3 (bid_xxx); stats campaign-to-date for the guardrail.
    groups = ads.q("SELECT ad_group_criterion.resource_name, ad_group_criterion.cpc_bid_micros, "
                   "ad_group_criterion.listing_group.case_value.product_custom_attribute.value, "
                   "ad_group_criterion.listing_group.type, ad_group_criterion.negative, "
                   "metrics.clicks, metrics.cost_micros, metrics.conversions, metrics.conversions_value "
                   f"FROM product_group_view WHERE campaign.id = {CAMPAIGN_ID} AND segments.date DURING LAST_30_DAYS")
    buckets = {}
    for g in groups:
        c = g["adGroupCriterion"]
        val = (((c.get("listingGroup") or {}).get("caseValue") or {}).get("productCustomAttribute") or {}).get("value")
        if not val or not val.startswith("bid_") or c.get("negative"):
            continue
        b = buckets.setdefault(val, {"rn": c["resourceName"], "bid": float(c.get("cpcBidMicros", 0)) / 1e6,
                                      "clicks": 0, "cost": 0.0, "conv": 0.0, "value": 0.0})
        b["clicks"] += m(g, "clicks"); b["cost"] += m(g, "costMicros") / 1e6
        b["conv"] += m(g, "conversions"); b["value"] += m(g, "conversionsValue")
    terms = ads.q("SELECT campaign.id, search_term_view.search_term, metrics.clicks, metrics.cost_micros, metrics.conversions "
                  f"FROM search_term_view WHERE campaign.id = {CAMPAIGN_ID} AND {rng} AND metrics.cost_micros > 0")
    negs = sorted([(t["searchTermView"]["searchTerm"], m(t, "clicks"), m(t, "costMicros") / 1e6) for t in terms
                   if m(t, "conversions") == 0 and m(t, "costMicros") / 1e6 >= NEG_MIN_COST and m(t, "clicks") >= NEG_MIN_CLICKS],
                  key=lambda x: -x[2])
    prods = ads.q("SELECT campaign.id, segments.product_item_id, segments.product_title, metrics.impressions, metrics.clicks, "
                  f"metrics.cost_micros, metrics.conversions FROM shopping_performance_view WHERE campaign.id = {CAMPAIGN_ID} AND {rng}")
    per = {}
    for r in prods:
        seg = r.get("segments") or {}
        pid = re.match(r"shopify_zz_(\d+)_", (seg.get("productItemId") or "").lower())
        if not pid:
            continue
        x = per.setdefault(pid.group(1), {"title": seg.get("productTitle", ""), "impr": 0, "clicks": 0, "cost": 0.0, "conv": 0.0})
        x["impr"] += m(r, "impressions"); x["clicks"] += m(r, "clicks"); x["cost"] += m(r, "costMicros") / 1e6; x["conv"] += m(r, "conversions")
    allterms = sorted(((t["searchTermView"]["searchTerm"], m(t, "clicks"), m(t, "costMicros") / 1e6, m(t, "conversions")) for t in terms),
                      key=lambda x: -x[2])
    return tot, buckets, negs, per, allterms


def plan_bids(buckets):
    changes = []
    for name, b in sorted(buckets.items()):
        if b["clicks"] < MIN_CLICKS or b["bid"] <= 0:
            continue
        roas = b["value"] / b["cost"] if b["cost"] else 0
        new = b["bid"]
        if b["conv"] == 0 or roas < BREAKEVEN_ROAS:
            new = max(FLOOR, b["bid"] * (1 - STEP))
        elif roas >= TARGET_ROAS * 1.3 and b["conv"] >= 2:
            new = min(CAP, b["bid"] * (1 + STEP))
        new = round(new, 2)
        if abs(new - b["bid"]) >= 0.01:
            changes.append((name, b["rn"], b["bid"], new, roas, b))
    return changes


def ga4_section(at, d7, d0):
    def run(body):
        return http(f"https://analyticsdata.googleapis.com/v1beta/properties/{GA4_PROPERTY}:runReport", body,
                    {"Authorization": "Bearer " + at, "Content-Type": "application/json"}).get("rows", [])
    rows = run({"dateRanges": [{"startDate": str(d7), "endDate": str(d0)}],
                "dimensions": [{"name": "sessionDefaultChannelGroup"}, {"name": "eventName"}],
                "metrics": [{"name": "eventCount"}, {"name": "sessions"}],
                "dimensionFilter": {"filter": {"fieldName": "eventName", "inListFilter": {
                    "values": ["session_start", "view_item", "add_to_cart", "begin_checkout", "purchase"]}}}})
    funnel = {}
    for r in rows:
        ch, ev = (v["value"] for v in r["dimensionValues"])
        funnel.setdefault(ch, {})[ev] = int(r["metricValues"][0]["value"])
    return funnel


def merchant_section(at):
    body = {"query": "SELECT id, offer_id, title, price, benchmark_price, report_country_code "
                     "FROM price_competitiveness_product_view WHERE report_country_code = 'US'", "pageSize": 1000}
    d = http(f"https://merchantapi.googleapis.com/reports/v1/accounts/{MERCHANT_ID}/reports:search", body,
             {"Authorization": "Bearer " + at, "Content-Type": "application/json"})
    over = []
    for r in d.get("results", []):
        v = r["priceCompetitivenessProductView"]
        p, b = float(v["price"]["amountMicros"]) / 1e6, float(v["benchmarkPrice"]["amountMicros"]) / 1e6
        if b and p / b > 1.15:
            over.append((v["title"], p, b))
    return sorted(over, key=lambda x: -x[1] / x[2]), len(d.get("results", []))


def shopify_section(env, d7):
    shop = env["SHOPIFY_SHOP_URL"].replace("https://", "").rstrip("/")
    q = ('{orders(first:100,query:"created_at:>=%s",sortKey:CREATED_AT){nodes{name test cancelledAt '
         'totalPriceSet{shopMoney{amount}} app{name} customAttributes{key value} '
         'customerJourneySummary{lastVisit{source utmParameters{source medium campaign}}}}}}' % d7)
    d = http(f"https://{shop}/admin/api/2025-01/graphql.json", {"query": q},
             {"X-Shopify-Access-Token": env["SHOPIFY_ADMIN_TOKEN"], "Content-Type": "application/json"})
    out = []
    for o in d["data"]["orders"]["nodes"]:
        if o["test"] or o["cancelledAt"]:
            continue
        lv = (o.get("customerJourneySummary") or {}).get("lastVisit") or {}
        utm = lv.get("utmParameters") or {}
        attrs = {a["key"]: a["value"] for a in o["customAttributes"]}
        src = (f"{utm.get('source')} / {utm.get('medium')}" if utm.get("source") else lv.get("source")) \
            or (f"{attrs.get('utm_source')} / {attrs.get('utm_medium')}" if attrs.get("utm_source") else None) \
            or ("new site (see GA4)" if attrs.get("_ga_cid") else "unknown")
        out.append((o["name"], float(o["totalPriceSet"]["shopMoney"]["amount"]), (o.get("app") or {}).get("name"), src))
    return out


def inventory_section(env, ad_products):
    """Restock alerts + ad spend on out-of-stock items. Pace = units sold in the last 30 days."""
    shop = env["SHOPIFY_SHOP_URL"].replace("https://", "").rstrip("/")
    hdr = {"X-Shopify-Access-Token": env["SHOPIFY_ADMIN_TOKEN"], "Content-Type": "application/json"}
    inv, cur = {}, None
    while True:
        q = ('query($c:String){products(first:250,after:$c,query:"status:active"){pageInfo{hasNextPage endCursor} '
             'nodes{legacyResourceId title totalInventory}}}')
        d = http(f"https://{shop}/admin/api/2025-01/graphql.json", {"query": q, "variables": {"c": cur}}, hdr)["data"]["products"]
        for n in d["nodes"]:
            inv[n["legacyResourceId"]] = (n["title"], max(n["totalInventory"] or 0, 0))
        if not d["pageInfo"]["hasNextPage"]:
            break
        cur = d["pageInfo"]["endCursor"]
    since = date.today() - timedelta(days=30)
    q = ('{orders(first:250,query:"created_at:>=%s"){nodes{test cancelledAt lineItems(first:50){nodes{quantity product{legacyResourceId}}}}}}' % since)
    sold = {}
    for o in http(f"https://{shop}/admin/api/2025-01/graphql.json", {"query": q}, hdr)["data"]["orders"]["nodes"]:
        if o["test"] or o["cancelledAt"]:
            continue
        for li in o["lineItems"]["nodes"]:
            pid = (li.get("product") or {}).get("legacyResourceId")
            if pid:
                sold[pid] = sold.get(pid, 0) + li["quantity"]
    restock = []
    for pid, units in sold.items():
        title, q_ = inv.get(pid, ("(not active)", 0))
        days = q_ / (units / 30) if units else 999
        if days < RESTOCK_DAYS:
            restock.append((title, q_, units, round(days)))
    oos_spend = sorted([(v["title"], v["clicks"], v["cost"]) for pid, v in ad_products.items()
                        if inv.get(pid, ("", 1))[1] == 0 and v["cost"] > 0], key=lambda x: -x[2])
    # strong ad performers running low (clicks but thin stock)
    low_hot = sorted([(v["title"], inv[pid][1], int(v["clicks"])) for pid, v in ad_products.items()
                      if pid in inv and 0 < inv[pid][1] < 5 and v["clicks"] >= 3], key=lambda x: -x[2])
    return sorted(restock, key=lambda x: x[3]), oos_spend, low_hot


def ai_analyst(env, facts):
    """Advisory narrative from the week's numbers. Returns text, or '' if no key / failure."""
    key = env.get("OPENAI_API_KEY")
    if not key:
        return ""
    model = env.get("AI_MODEL") or AI_MODEL_DEFAULT
    instructions = (
        "You are a senior Google Shopping analyst for Stehlen Auto, a US DTC truck/SUV accessories store "
        "(value brand, ~31.7% net margin, break-even ROAS ~3.2x, $50/day Standard Shopping, Manual CPC by "
        "custom_label_3 bid buckets). You are ADVISORY: automated rules already applied any bid changes listed; "
        "do not invent numbers — use only the JSON facts given. Data is often thin early on; say so instead of over-reading noise.\n"
        "Write plain text (no markdown tables), under 350 words, with these headings:\n"
        "SUMMARY — 3-5 bullets: what happened this week and whether ads are on track.\n"
        "FLAGS — anomalies or risks (spend spikes, conversion drops, out-of-stock spend, price above market, disapprovals); 'None' if none.\n"
        "SEARCH TERMS — from search_terms, list irrelevant/wasteful ones to add as negatives (with a 3-6 word reason) "
        "and any strong terms worth noting. Never suggest negating brand-agnostic terms that describe products we sell.\n"
        "ACTIONS — 1-3 concrete actions for the owner this week, most valuable first.")
    body = {"model": model, "instructions": instructions,
            "input": "Weekly facts (JSON):\n" + json.dumps(facts, default=str)[:60000]}
    try:
        d = http("https://api.openai.com/v1/responses", body,
                 {"Authorization": "Bearer " + key, "Content-Type": "application/json"})
        text = d.get("output_text") or "\n".join(c.get("text", "") for o in d.get("output", []) for c in (o.get("content") or []) if c.get("type") == "output_text")
        return f"AI ANALYST ({model}) — advisory only, bids follow the fixed rules\n" + text.strip()
    except Exception as e:
        return f"AI ANALYST unavailable: {e}"


def report(d7, d0, tot, buckets, changes, applied, negs, funnel, over, n_bench, orders, errors,
           restock=(), oos_spend=(), low_hot=(), ai_text=""):
    cost = tot["costMicros"] / 1e6
    roas = tot["conversionsValue"] / cost if cost else 0
    L = [f"Stehlen Google Shopping — weekly tune-up, {d7} to {d0}", ""]
    if ai_text:
        L += [ai_text, "", "=" * 60, ""]
    L += ["ADS (last 7 days)",
          f"  Impressions {int(tot['impressions']):,} · Clicks {int(tot['clicks'])} · Spend ${cost:,.2f} · "
          f"Conversions {tot['conversions']:.1f} · Sales ${tot['conversionsValue']:,.2f} · "
          f"ROAS {roas:.2f}x (break-even ~{BREAKEVEN_ROAS}x)",
          f"  Avg cost per click ${cost / tot['clicks']:.2f}" if tot["clicks"] else "  No clicks yet", ""]
    L += ["BID BUCKETS (last 30 days)"]
    for name, b in sorted(buckets.items()):
        r = b["value"] / b["cost"] if b["cost"] else 0
        L.append(f"  {name}: bid ${b['bid']:.2f} · {int(b['clicks'])} clicks · ${b['cost']:.2f} spent · "
                 f"{b['conv']:.1f} sales · ROAS {r:.2f}x")
    L += ["", "BID CHANGES " + ("(applied)" if applied else "(proposed — dry run)")]
    L += [f"  {n}: ${old:.2f} -> ${new:.2f} (ROAS {r:.2f}x, {int(b['clicks'])} clicks)" for n, _, old, new, r, b in changes] \
        or [f"  None — no bucket has {MIN_CLICKS}+ clicks yet, or all are within target."]
    L += ["", "NEGATIVE KEYWORD CANDIDATES (spent, no sale — review and add in Google Ads if irrelevant)"]
    L += [f"  \"{t}\" — {int(c)} clicks, ${s:.2f}" for t, c, s in negs[:15]] or ["  None this week."]
    L += ["", "GA4 FUNNEL (last 7 days): sessions -> viewed product -> add to cart -> checkout -> purchase"]
    for ch in ("Paid Shopping", "Organic Shopping", "Organic Search", "Direct"):
        f = funnel.get(ch)
        if f:
            L.append(f"  {ch}: {f.get('session_start', 0)} -> {f.get('view_item', 0)} -> {f.get('add_to_cart', 0)} "
                     f"-> {f.get('begin_checkout', 0)} -> {f.get('purchase', 0)}")
    L += ["", f"PRICE CHECK (Google benchmark, {n_bench} products compared): priced >15% above market"]
    L += [f"  {t[:70]} — ours ${p:.0f} vs ${b:.0f} ({(p / b - 1) * 100:+.0f}%)" for t, p, b in over[:10]] or ["  None."]
    L += ["", f"INVENTORY — restock soon (< {RESTOCK_DAYS} days of stock at last-30-day pace)"]
    L += [f"  {t[:70]} — {q} left, {u} sold/30d (~{d} days)" for t, q, u, d in restock[:12]] or ["  None."]
    L += ["", "INVENTORY — ad clicks on products now out of stock"]
    L += [f"  {t[:70]} — {int(c)} clicks, ${s:.2f}" for t, c, s in oos_spend[:10]] or ["  None."]
    L += ["", "INVENTORY — getting ad clicks but under 5 units left"]
    L += [f"  {t[:70]} — {q} left, {c} clicks" for t, q, c in low_hot[:10]] or ["  None."]
    L += ["", f"ORDERS (last 7 days): {len(orders)} · ${sum(o[1] for o in orders):,.2f}"]
    L += [f"  {n} ${v:.2f} via {app} — {src}" for n, v, app, src in orders]
    if errors:
        L += ["", "ERRORS"] + [f"  {e}" for e in errors]
    L += ["", "Bucket membership refreshes daily 05:20 (Sync Google Shopping Bid Labels). Guardrails: "
          f"buckets need {MIN_CLICKS}+ clicks; max {int(STEP * 100)}%/week; ${FLOOR:.2f}–${CAP:.2f}."]
    return "\n".join(L)


def send_email(env, subject, text):
    to = [x.strip() for x in env.get("TUNEUP_EMAIL_TO", "support@robome.io").split(",") if x.strip()]
    body = {"sender": {"id": 2}, "to": [{"email": t} for t in to], "subject": subject,
            "textContent": text, "htmlContent": "<pre style=\"font:13px/1.45 Menlo,Consolas,monospace\">"
            + text.replace("&", "&amp;").replace("<", "&lt;") + "</pre>"}
    http("https://api.brevo.com/v3/smtp/email", body,
         {"api-key": env["BREVO_API_KEY"], "Content-Type": "application/json", "Accept": "application/json"})
    return to


def main():
    apply, email = "--apply" in sys.argv, "--email" in sys.argv
    env = load_env()
    d0 = date.today() - timedelta(days=1)
    d7 = d0 - timedelta(days=6)
    errors, tot, buckets, negs, funnel, over, n_bench, orders = [], {"impressions": 0, "clicks": 0, "costMicros": 0, "conversions": 0, "conversionsValue": 0}, {}, [], {}, [], 0, []
    per, allterms, restock, oos_spend, low_hot = {}, [], [], [], []
    at = google_token(env)
    ads = Ads(at)
    try:
        tot, buckets, negs, per, allterms = ads_section(ads, d7, d0)
    except Exception as e:
        errors.append(f"Google Ads: {e}")
    for name, fn in (("GA4", lambda: ga4_section(at, d7, d0)), ("Merchant Center", lambda: merchant_section(at)),
                     ("Shopify", lambda: shopify_section(env, d7))):
        try:
            res = fn()
            if name == "GA4": funnel = res
            elif name == "Merchant Center": over, n_bench = res
            else: orders = res
        except Exception as e:
            errors.append(f"{name}: {e}")
    try:
        restock, oos_spend, low_hot = inventory_section(env, per)
    except Exception as e:
        errors.append(f"Inventory: {e}")
    changes = plan_bids(buckets)
    applied = False
    if apply and changes:
        try:
            ads.set_bids([(rn, new) for _, rn, _, new, _, _ in changes])
            applied = True
        except Exception as e:
            errors.append(f"Bid update failed (nothing changed): {e}")
    facts = {"week": [str(d7), str(d0)],
             "context": {"campaign_launched": CAMPAIGN_LAUNCHED,
                         "notes": ["Ads totals before the launch date are expected to be zero.",
                                   "ChatGPT shopping visits land on the Shopify theme and are tracked by Shopify's GA4 pixel; "
                                   "GA4 may group them as Unassigned/Organic Shopping rather than AI Assistant.",
                                   "GA4 purchases before 2026-10-09 were double-counted (fixed); Shopify orders are the source of truth.",
                                   "google / product_sync = free Google Shopping listings, not paid ads."]},
             "ads_totals": tot, "buckets_30d": buckets,
             "bid_changes": [{"bucket": n, "old": o, "new": nw, "roas": r} for n, _, o, nw, r, _ in changes],
             "bid_changes_applied": applied, "search_terms": allterms[:150],
             "top_products": sorted(per.values(), key=lambda v: -v["cost"])[:40],
             "ga4_funnel_by_channel": funnel, "priced_above_market": over[:20], "orders": orders,
             "restock_alerts": restock[:20], "out_of_stock_ad_spend": oos_spend[:20], "hot_low_stock": low_hot[:20],
             "data_errors": errors, "guardrails": {"min_clicks": MIN_CLICKS, "step": STEP, "floor": FLOOR, "cap": CAP}}
    ai_text = ai_analyst(env, facts)
    text = report(d7, d0, tot, buckets, changes, applied, negs, funnel, over, n_bench, orders, errors,
                  restock, oos_spend, low_hot, ai_text)
    print(text)
    logdir = Path(env.get("TUNEUP_LOG_DIR") or ROOT / "data/logs")
    logdir.mkdir(parents=True, exist_ok=True)
    with (logdir / "gshop-weekly-tuneup.jsonl").open("a") as f:
        f.write(json.dumps({"run": str(date.today()), "applied": applied, "errors": errors,
                            "changes": [{"bucket": n, "old": o, "new": nw, "roas": round(r, 2)} for n, _, o, nw, r, _ in changes]}) + "\n")
    if email:
        try:
            to = send_email(env, f"Stehlen Shopping weekly tune-up — {d7} to {d0}", text)
            print("\nemailed:", ", ".join(to))
        except Exception as e:
            print("\nEMAIL FAILED:", e)
            sys.exit(2)
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
