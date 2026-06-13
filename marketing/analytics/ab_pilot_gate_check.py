#!/usr/bin/env python3
"""
A/B Pilot automated checks — Stehlen reactivation (Cycle: pilot 6/16-6/19 2026).

Two modes, both EMAIL their report to the owner via Brevo transactional:

  --mode pre-send   Mon 6/16 ~7:07am PT — verify campaigns 32-35 are still
                    "queued" for the 9:00am PT send (catch Brevo in_review
                    holds) + WELCOME10 still ACTIVE in Shopify.

  --mode gate       Thu 6/19 ~9:07am PT — the 72h gate check that decides
                    whether the 34k ramp (campaigns 29/30) gets released:
                      GO  = GA4 Brevo-session ATC rate > 10% AND unsub < 1.5%
                      NO-GO otherwise.
                    Also: per-campaign A/B stats, GA4 funnel, Shopify orders
                    cross-referenced against the pilot cohort (purchaser
                    suppression list for Email 2).

Pure stdlib (urllib only) so launchd can run it with system python3 — no venv.
Reads secrets from the repo's .env.local. NEVER sends/schedules campaigns.

Scheduled via launchd (see ~/Library/LaunchAgents/com.stehlen.abpilot.*.plist).
Test with:  python3 ab_pilot_gate_check.py --mode pre-send --test
"""

import argparse
import json
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
ENV_FILE = REPO / ".env.local"
PILOT_EMAILS_FILE = REPO / "marketing/email/data/ab_pilot_emails_2026-06-13.json"

OWNER_EMAIL = "rickykyau@gmail.com"
SENDER = {"name": "Stehlen Gate Check", "email": "info@updates.stehlenauto.com"}
CAMPAIGNS = {32: "Ram A", 33: "Ram B", 34: "Chevy A", 35: "Chevy B"}
SEND_DATE = "2026-06-16"  # pilot send day (PT)
SHOPIFY_HOST = "http-stehlenauto-com.myshopify.com"
GATE_ATC_RATE = 0.10
GATE_UNSUB_RATE = 0.015


def load_env() -> dict:
    env = {}
    for line in ENV_FILE.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        env[k.strip()] = v.strip().strip('"').strip("'")
    return env


def http(url: str, headers: dict, body: dict | None = None, method: str | None = None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(
        url, data=data, method=method or ("POST" if data else "GET"),
        headers={"content-type": "application/json", **headers},
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            raw = r.read()
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        return {"_http_error": e.code, "_body": e.read().decode()[:500]}


# ---------------------------------------------------------------------------
# Data pulls
# ---------------------------------------------------------------------------

def brevo_campaign(env: dict, cid: int) -> dict:
    return http(f"https://api.brevo.com/v3/emailCampaigns/{cid}",
                {"api-key": env["BREVO_API_KEY"]})


def brevo_stats(c: dict) -> dict:
    """Sum per-list campaignStats into one row."""
    out: dict = {}
    for cs in (c.get("statistics") or {}).get("campaignStats") or []:
        for k, v in cs.items():
            if isinstance(v, (int, float)):
                out[k] = out.get(k, 0) + v
    return out


def shopify_welcome10(env: dict) -> dict:
    q = ('{ codeDiscountNodeByCode(code: "WELCOME10") { codeDiscount { '
         '... on DiscountCodeBasic { status endsAt } } } }')
    d = http(f"https://{SHOPIFY_HOST}/admin/api/2025-01/graphql.json",
             {"X-Shopify-Access-Token": env["SHOPIFY_ADMIN_TOKEN"]}, {"query": q})
    try:
        return d["data"]["codeDiscountNodeByCode"]["codeDiscount"]
    except (KeyError, TypeError):
        return {"status": f"LOOKUP FAILED: {json.dumps(d)[:200]}"}


def shopify_orders_since(env: dict, iso_min: str) -> list[dict]:
    d = http(
        f"https://{SHOPIFY_HOST}/admin/api/2025-01/orders.json?status=any"
        f"&created_at_min={urllib.parse.quote(iso_min)}"
        f"&fields=id,name,created_at,total_price,discount_codes,email",
        {"X-Shopify-Access-Token": env["SHOPIFY_ADMIN_TOKEN"]})
    return d.get("orders", [])


def ga4_token(env: dict) -> str:
    body = urllib.parse.urlencode({
        "client_id": env["GA4_OAUTH_CLIENT_ID"],
        "client_secret": env["GA4_OAUTH_CLIENT_SECRET"],
        "refresh_token": env["GA4_OAUTH_REFRESH_TOKEN"],
        "grant_type": "refresh_token",
    }).encode()
    req = urllib.request.Request("https://oauth2.googleapis.com/token", data=body,
                                 headers={"content-type": "application/x-www-form-urlencoded"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)["access_token"]


def ga4_report(env: dict, token: str, body: dict) -> dict:
    pid = env.get("GA4_PROPERTY_ID", "529120634")
    return http(f"https://analyticsdata.googleapis.com/v1beta/properties/{pid}:runReport",
                {"authorization": f"Bearer {token}"}, body)


def ga4_brevo_funnel(env: dict, start: str, end: str) -> dict:
    """Brevo-attributed sessions + ecommerce event counts, plus per-campaign sessions."""
    token = ga4_token(env)
    brevo_filter = {"filter": {
        "fieldName": "sessionSource",
        "stringFilter": {"matchType": "CONTAINS", "value": "brevo"},
    }}
    out: dict = {"sessions": 0, "events": {}, "by_campaign": {}}

    r = ga4_report(env, token, {
        "dateRanges": [{"startDate": start, "endDate": end}],
        "dimensions": [{"name": "sessionCampaignName"}],
        "metrics": [{"name": "sessions"}],
        "dimensionFilter": brevo_filter,
    })
    for row in r.get("rows", []):
        name = row["dimensionValues"][0]["value"]
        n = int(row["metricValues"][0]["value"])
        out["by_campaign"][name] = n
        out["sessions"] += n

    r = ga4_report(env, token, {
        "dateRanges": [{"startDate": start, "endDate": end}],
        "dimensions": [{"name": "eventName"}],
        "metrics": [{"name": "eventCount"}],
        "dimensionFilter": {"andGroup": {"expressions": [
            brevo_filter,
            {"filter": {"fieldName": "eventName", "inListFilter": {"values": [
                "view_item", "add_to_cart", "begin_checkout", "purchase"]}}},
        ]}},
    })
    for row in r.get("rows", []):
        out["events"][row["dimensionValues"][0]["value"]] = int(row["metricValues"][0]["value"])
    return out


# ---------------------------------------------------------------------------
# Reports
# ---------------------------------------------------------------------------

def report_pre_send(env: dict) -> tuple[str, str, bool]:
    lines, ok = [], True
    for cid, label in CAMPAIGNS.items():
        c = brevo_campaign(env, cid)
        status = c.get("status", "?")
        sched = c.get("scheduledAt", "?")
        good = status == "queued" and str(sched).startswith(f"{SEND_DATE}T09:00")
        ok &= good
        mark = "OK" if good else "!! PROBLEM"
        lines.append(f"[{mark}] Campaign {cid} ({label}): status={status}, scheduledAt={sched}")
        if status == "in_review":
            lines.append("       → Brevo verification hold. Reply to Brevo's verification "
                         "email / contact support NOW or the 9:00am PT send will NOT go out.")
    w = shopify_welcome10(env)
    w_ok = w.get("status") == "ACTIVE"
    ok &= w_ok
    lines.append(f"[{'OK' if w_ok else '!! PROBLEM'}] WELCOME10: status={w.get('status')}, "
                 f"endsAt={w.get('endsAt')} (expected ACTIVE thru 2026-06-26T06:59:59Z)")
    verdict = "ALL CLEAR — 4 campaigns will send 9:00am PT today" if ok \
        else "ACTION NEEDED BEFORE 9:00am PT — see problems above"
    subject = f"{'✅' if ok else '🚨'} Pilot pre-send check: {verdict.split(' — ')[0]}"
    return subject, "\n".join([verdict, ""] + lines), ok


def report_gate(env: dict) -> tuple[str, str, bool]:
    lines = []
    today = date.today().isoformat()

    # 1) Brevo per-campaign stats
    total = {"sent": 0, "delivered": 0, "uniqueViews": 0, "uniqueClicks": 0,
             "unsubscriptions": 0, "complaints": 0}
    lines.append("== BREVO (campaigns 32-35) ==")
    for cid, label in CAMPAIGNS.items():
        s = brevo_stats(brevo_campaign(env, cid))
        for k in total:
            total[k] += s.get(k, 0)
        deliv = s.get("delivered", 0) or 1
        lines.append(
            f"  {label} (#{cid}): sent={s.get('sent', 0)} deliv={s.get('delivered', 0)} "
            f"opens={s.get('uniqueViews', 0)} ({s.get('uniqueViews', 0) / deliv:.1%}) "
            f"clicks={s.get('uniqueClicks', 0)} ({s.get('uniqueClicks', 0) / deliv:.1%}) "
            f"unsub={s.get('unsubscriptions', 0)} spam={s.get('complaints', 0)}")
    deliv = total["delivered"] or 1
    unsub_rate = total["unsubscriptions"] / deliv
    lines.append(f"  TOTAL: deliv={total['delivered']} opens={total['uniqueViews']} "
                 f"({total['uniqueViews'] / deliv:.1%}) clicks={total['uniqueClicks']} "
                 f"({total['uniqueClicks'] / deliv:.1%}) unsub={unsub_rate:.2%} "
                 f"spam={total['complaints']}")

    # 2) GA4 funnel for Brevo sessions since send day
    lines.append("")
    lines.append(f"== GA4 ({SEND_DATE} → {today}, source contains 'brevo') ==")
    try:
        g = ga4_brevo_funnel(env, SEND_DATE, today)
        sessions = g["sessions"]
        ev = g["events"]
        atc = ev.get("add_to_cart", 0)
        atc_rate = atc / sessions if sessions else 0.0
        lines.append(f"  sessions={sessions}  view_item={ev.get('view_item', 0)}  "
                     f"add_to_cart={atc}  begin_checkout={ev.get('begin_checkout', 0)}  "
                     f"purchase={ev.get('purchase', 0)}")
        lines.append(f"  ATC rate (add_to_cart / sessions) = {atc_rate:.1%}  [gate: >10%]")
        pilots = {k: v for k, v in g["by_campaign"].items() if "ab-pilot" in k}
        if pilots:
            lines.append("  sessions by campaign: "
                         + ", ".join(f"{k}={v}" for k, v in sorted(pilots.items())))
    except Exception as e:  # GA4 must never kill the Brevo half of the report
        sessions, atc_rate = 0, 0.0
        lines.append(f"  GA4 PULL FAILED: {e!r} — compute ATC rate manually before deciding.")

    # 3) Shopify orders since send, cross-referenced to pilot cohort
    lines.append("")
    lines.append("== SHOPIFY (orders since 6/16 00:00 PT) ==")
    pilot_emails = set()
    if PILOT_EMAILS_FILE.exists():
        seg = json.load(open(PILOT_EMAILS_FILE))
        for rows in seg.values():
            pilot_emails.update(r["email"].lower() for r in rows)
    orders = shopify_orders_since(env, f"{SEND_DATE}T00:00:00-07:00")
    purchasers = []
    for o in orders:
        is_pilot = (o.get("email") or "").lower() in pilot_emails
        if is_pilot:
            purchasers.append(o.get("email"))
        codes = ",".join(c["code"] for c in o.get("discount_codes", [])) or "-"
        lines.append(f"  {o['name']} ${o['total_price']} code={codes} "
                     f"{'← PILOT COHORT' if is_pilot else ''}")
    if not orders:
        lines.append("  (none)")
    lines.append(f"  Pilot-cohort purchasers: {len(purchasers)}"
                 + (f" → SUPPRESS before Email 2: {', '.join(purchasers)}" if purchasers else ""))

    # 4) Verdict
    go = atc_rate > GATE_ATC_RATE and unsub_rate < GATE_UNSUB_RATE and sessions > 0
    lines.append("")
    lines.append("== GATE VERDICT ==")
    lines.append(f"  ATC rate {atc_rate:.1%} {'>' if atc_rate > GATE_ATC_RATE else '≤'} 10% · "
                 f"unsub {unsub_rate:.2%} {'<' if unsub_rate < GATE_UNSUB_RATE else '≥'} 1.5% · "
                 f"brevo sessions={sessions}")
    if go:
        lines.append("  ✅ GO — release the 34k ramp: reschedule Brevo campaigns 29/30 "
                     "(currently parked 7/15) to the week of 6/23. Owner action required — "
                     "nothing has been rescheduled automatically.")
    else:
        lines.append("  ❌ NO-GO (or insufficient data) — do NOT release campaigns 29/30. "
                     "Diagnose the weakest funnel step above first.")
    lines.append("")
    lines.append("Reminders: Email 2 target Fri 6/20 9am PT (suppress purchasers first); "
                 "Email 3 target Tue 6/24 — FIX ITS SUBJECT: code now expires THURSDAY "
                 "6/25, draft says 'Friday'. WELCOME10 active thru 6/25 11:59pm PT.")
    subject = f"{'✅ GO' if go else '❌ NO-GO'} — A/B pilot 72h gate check (ramp decision)"
    return subject, "\n".join(lines), go


def send_email(env: dict, subject: str, body: str) -> dict:
    html = "<pre style='font: 13px/1.5 Menlo, monospace'>" + (
        body.replace("&", "&amp;").replace("<", "&lt;")) + "</pre>"
    return http("https://api.brevo.com/v3/smtp/email", {"api-key": env["BREVO_API_KEY"]},
                {"sender": SENDER, "to": [{"email": OWNER_EMAIL}],
                 "subject": subject, "htmlContent": html})


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--mode", choices=["pre-send", "gate"], required=True)
    ap.add_argument("--test", action="store_true", help="run now, mark subject as [TEST]")
    args = ap.parse_args()

    # Guard: these jobs are pinned to June 2026. If launchd fires them in a
    # future year (calendar intervals repeat yearly), no-op instead of
    # emailing stale nonsense.
    if not args.test and not (date(2026, 6, 14) <= date.today() <= date(2026, 6, 22)):
        print("outside pilot window — no-op")
        return 0

    env = load_env()
    subject, body, _ok = (report_pre_send if args.mode == "pre-send" else report_gate)(env)
    if args.test:
        subject = "[TEST] " + subject
    print(subject + "\n\n" + body)
    res = send_email(env, subject, body)
    print("\nemail result:", json.dumps(res))
    return 0 if "messageId" in res else 1


if __name__ == "__main__":
    sys.exit(main())
