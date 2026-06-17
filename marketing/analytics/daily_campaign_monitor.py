#!/usr/bin/env python3
"""
Daily marketing monitor — Stehlen reactivation program.

Runs every morning (launchd) and EMAILS the owner a one-screen digest:
  - Every campaign sent in the last 14 days: delivered / open% / click% /
    unsub% / bounce% / spam, with deliverability + engagement FLAGS.
  - Upcoming queued/scheduled campaigns (so nothing sends unnoticed).
  - GA4 daily snapshot: 7-day sessions/users/key-events/purchases trend,
    channel mix, and the Brevo-attributed funnel (view_item -> add_to_cart
    -> purchase) now that server-side purchase attribution is live.
  - A RECOMMENDATIONS block when any flag trips.

It NEVER sends, schedules, pauses, or edits a campaign — it only reports and
recommends. Adjustments stay a human decision (see the campaign-preflight
standing goal). Pure stdlib so launchd runs it with system python3 — no venv.

Secrets: BREVO_API_KEY from repo .env.local; GA4 OAuth from repo token.json
(client_id/secret/refresh_token written by the google-auth flow).

Usage:
  python3 daily_campaign_monitor.py            # pull + email owner
  python3 daily_campaign_monitor.py --dry-run  # print, don't email
"""

import argparse
import json
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
ENV_FILE = REPO / ".env.local"
TOKEN_FILE = REPO / "token.json"

OWNER_EMAIL = "rickykyau@gmail.com"
SENDER = {"name": "Stehlen Daily Monitor", "email": "info@updates.stehlenauto.com"}
LOOKBACK_DAYS = 14

# Deliverability / engagement thresholds (rates as fractions of delivered).
T_UNSUB = 0.015      # >1.5% unsub -> flag (matches the gate threshold)
T_HARD_BOUNCE = 0.02  # >2% hard bounces -> list-quality / deliverability flag
T_SPAM = 0.001       # >0.1% spam complaints -> serious deliverability flag
T_OPEN_LOW = 0.10    # <10% opens -> engagement flag
T_CLICK_LOW = 0.003  # <0.3% clicks -> engagement flag


def load_env() -> dict:
    env = {}
    for line in ENV_FILE.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        env[k.strip()] = v.strip().strip('"').strip("'")
    return env


def http(url, headers, body=None, method=None):
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
        return {"_http_error": e.code, "_body": e.read().decode()[:400]}


# ---------------------------------------------------------------------------
# Brevo
# ---------------------------------------------------------------------------

def brevo_list(env, status):
    return http(
        f"https://api.brevo.com/v3/emailCampaigns?status={status}&type=classic&limit=100",
        {"api-key": env["BREVO_API_KEY"]},
    )


def brevo_campaign(env, cid):
    return http(f"https://api.brevo.com/v3/emailCampaigns/{cid}",
                {"api-key": env["BREVO_API_KEY"]})


def brevo_stats(c):
    """Sum per-list campaignStats into one row (globalStats stays 0 for
    list-targeted campaigns — the real numbers live in campaignStats)."""
    out = {}
    for cs in (c.get("statistics") or {}).get("campaignStats") or []:
        for k, v in cs.items():
            if isinstance(v, (int, float)):
                out[k] = out.get(k, 0) + v
    return out


def pct(n, d):
    return (100.0 * n / d) if d else 0.0


def campaign_row(c):
    s = brevo_stats(c)
    sent = s.get("sent", 0)
    deliv = s.get("delivered", 0)
    opens = s.get("uniqueViews", 0)
    clicks = s.get("uniqueClicks", 0)
    unsub = s.get("unsubscriptions", 0)
    hbounce = s.get("hardBounces", 0)
    sbounce = s.get("softBounces", 0)
    spam = s.get("complaints", 0)
    flags = []
    if deliv:
        if unsub / deliv > T_UNSUB:
            flags.append(f"UNSUB {pct(unsub, deliv):.2f}%")
        if hbounce / deliv > T_HARD_BOUNCE:
            flags.append(f"HARD-BOUNCE {pct(hbounce, deliv):.2f}%")
        if spam / deliv > T_SPAM:
            flags.append(f"SPAM {pct(spam, deliv):.2f}%")
        if opens / deliv < T_OPEN_LOW:
            flags.append(f"LOW-OPEN {pct(opens, deliv):.1f}%")
        if clicks / deliv < T_CLICK_LOW:
            flags.append(f"LOW-CLICK {pct(clicks, deliv):.2f}%")
    return {
        "id": c.get("id"), "name": (c.get("name") or "")[:36],
        "sent": sent, "deliv": deliv, "opens": opens, "clicks": clicks,
        "unsub": unsub, "bounce": hbounce + sbounce, "spam": spam,
        "open_rate": pct(opens, deliv), "click_rate": pct(clicks, deliv),
        "flags": flags,
    }


def within_lookback(iso):
    if not iso:
        return False
    try:
        d = datetime.fromisoformat(iso.replace("Z", "+00:00"))
    except ValueError:
        return False
    return d >= datetime.now(timezone.utc) - timedelta(days=LOOKBACK_DAYS)


# ---------------------------------------------------------------------------
# GA4 (stdlib OAuth refresh from token.json)
# ---------------------------------------------------------------------------

def ga4_token():
    tok = json.loads(TOKEN_FILE.read_text())
    body = urllib.parse.urlencode({
        "client_id": tok["client_id"],
        "client_secret": tok["client_secret"],
        "refresh_token": tok["refresh_token"],
        "grant_type": "refresh_token",
    }).encode()
    req = urllib.request.Request("https://oauth2.googleapis.com/token", data=body,
                                 headers={"content-type": "application/x-www-form-urlencoded"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)["access_token"]


def ga4_report(env, token, body):
    pid = env.get("GA4_PROPERTY_ID", "529120634")
    return http(f"https://analyticsdata.googleapis.com/v1beta/properties/{pid}:runReport",
                {"authorization": f"Bearer {token}"}, body)


def ga4_rows(resp):
    out = []
    for row in resp.get("rows", []) or []:
        dims = [d.get("value") for d in row.get("dimensionValues", [])]
        mets = [m.get("value") for m in row.get("metricValues", [])]
        out.append((dims, mets))
    return out


def ga4_section(env):
    lines = []
    today = date.today().isoformat()
    d7 = (date.today() - timedelta(days=7)).isoformat()
    token = ga4_token()
    # 7-day daily trend
    r = ga4_report(env, token, {
        "dateRanges": [{"startDate": d7, "endDate": today}],
        "dimensions": [{"name": "date"}],
        "metrics": [{"name": m} for m in
                    ["sessions", "totalUsers", "keyEvents", "ecommercePurchases", "purchaseRevenue"]],
        "orderBys": [{"dimension": {"dimensionName": "date"}}],
    })
    lines.append("  7-DAY TREND (date  sess / users / keyEv / purch / rev)")
    for dims, mets in ga4_rows(r):
        d = dims[0]
        lines.append(f"    {d[:4]}-{d[4:6]}-{d[6:]}  {mets[0]:>4} / {mets[1]:>4} / "
                     f"{mets[2]:>3} / {mets[3]:>2} / ${float(mets[4] or 0):.0f}")
    # channel mix last 7d
    r = ga4_report(env, token, {
        "dateRanges": [{"startDate": d7, "endDate": today}],
        "dimensions": [{"name": "sessionDefaultChannelGroup"}],
        "metrics": [{"name": m} for m in ["sessions", "keyEvents", "ecommercePurchases"]],
        "orderBys": [{"metric": {"metricName": "sessions"}, "desc": True}],
        "limit": 8,
    })
    lines.append("  CHANNEL MIX 7d (channel  sess / keyEv / purch)")
    for dims, mets in ga4_rows(r):
        lines.append(f"    {dims[0][:20]:<20} {mets[0]:>5} / {mets[1]:>3} / {mets[2]:>2}")
    # Brevo-attributed funnel last 7d
    r = ga4_report(env, token, {
        "dateRanges": [{"startDate": d7, "endDate": today}],
        "dimensions": [{"name": "eventName"}],
        "metrics": [{"name": "eventCount"}],
        "dimensionFilter": {"filter": {
            "fieldName": "sessionSource",
            "stringFilter": {"matchType": "CONTAINS", "value": "brevo"},
        }},
        "limit": 50,
    })
    funnel = {d[0]: int(m[0]) for d, m in ga4_rows(r)}
    lines.append("  BREVO-ATTRIBUTED FUNNEL 7d: " + " | ".join(
        f"{e}={funnel.get(e, 0)}" for e in
        ["session_start", "view_item", "add_to_cart", "begin_checkout", "purchase"]))
    return lines


# ---------------------------------------------------------------------------
# Report
# ---------------------------------------------------------------------------

def build_report(env):
    today = date.today().isoformat()
    all_flags = []
    recs = []
    lines = [f"STEHLEN MARKETING — DAILY MONITOR  {today}", "=" * 52, ""]

    # Sent campaigns (last 14 days)
    sent = brevo_list(env, "sent")
    recent = [c for c in (sent.get("campaigns") or []) if within_lookback(c.get("sentDate"))]
    recent.sort(key=lambda c: c.get("sentDate") or "", reverse=True)
    lines.append(f"== SENT (last {LOOKBACK_DAYS}d): {len(recent)} campaign(s) ==")
    if not recent:
        lines.append("  (none)")
    for c in recent:
        row = campaign_row(brevo_campaign(env, c["id"]))
        tag = ("  ⚠ " + ", ".join(row["flags"])) if row["flags"] else ""
        lines.append(f"  #{row['id']} {row['name']:<36} deliv={row['deliv']:>4} "
                     f"open={row['open_rate']:>5.1f}% click={row['click_rate']:>5.2f}% "
                     f"unsub={row['unsub']} bounce={row['bounce']} spam={row['spam']}{tag}")
        for f in row["flags"]:
            all_flags.append(f"#{row['id']} {row['name'].strip()}: {f}")

    # Upcoming
    lines.append("")
    queued = brevo_list(env, "queued")
    q = sorted((queued.get("campaigns") or []), key=lambda c: c.get("scheduledAt") or "")
    lines.append(f"== QUEUED / SCHEDULED: {len(q)} ==")
    if not q:
        lines.append("  (none)")
    for c in q:
        lines.append(f"  #{c['id']} {(c.get('name') or '')[:36]:<36} -> {c.get('scheduledAt')}")

    # GA4
    lines.append("")
    lines.append(f"== GA4 (property {env.get('GA4_PROPERTY_ID', '529120634')}) ==")
    try:
        lines += ga4_section(env)
    except Exception as e:  # GA4 must never kill the Brevo half of the report
        lines.append(f"  GA4 PULL FAILED: {e!r}")

    # Recommendations from flags
    lines.append("")
    if all_flags:
        lines.append("== ⚠ FLAGS / RECOMMENDED ADJUSTMENTS ==")
        for f in all_flags:
            lines.append(f"  - {f}")
        recs.append("Review the flagged campaign(s). High unsub/spam/bounce -> "
                    "slow the ramp + clean the list before the next send; low "
                    "open -> revise subject; low click -> revise offer/CTA.")
        for r in recs:
            lines.append(f"  >> {r}")
        subject_tag = f"[{len(all_flags)} FLAG{'S' if len(all_flags) != 1 else ''}]"
    else:
        lines.append("== ✓ No flags. Deliverability + engagement within thresholds. ==")
        subject_tag = "[OK]"

    return f"Stehlen marketing — daily monitor {today} {subject_tag}", "\n".join(lines)


def email_report(env, subject, text):
    html = "<pre style='font-family:monospace;font-size:13px;white-space:pre-wrap'>" + \
           text.replace("&", "&amp;").replace("<", "&lt;") + "</pre>"
    return http("https://api.brevo.com/v3/smtp/email", {"api-key": env["BREVO_API_KEY"]},
                {"sender": SENDER, "to": [{"email": OWNER_EMAIL}],
                 "subject": subject, "htmlContent": html, "textContent": text})


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true", help="print, don't email")
    args = ap.parse_args()
    env = load_env()
    subject, text = build_report(env)
    print(text)
    if args.dry_run:
        print("\n[dry-run] not emailed.")
        return
    res = email_report(env, subject, text)
    if isinstance(res, dict) and res.get("_http_error"):
        print(f"\nEMAIL FAILED: {res}", file=sys.stderr)
        sys.exit(1)
    print(f"\nEmailed {OWNER_EMAIL}: {res}")


if __name__ == "__main__":
    main()
