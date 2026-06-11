"""
Stehlen Auto — Cross-Source Funnel + Trend Report
==================================================
ONE command for the recurring marketing review. Outputs, in consistent units:

  1. USER FUNNEL TREND — distinct users per step across the last 4 rolling
     7-day windows, so you see DIRECTION (visit → view product → add to cart →
     checkout → purchase). Every step is the same unit (deduped users), so it
     reads as a real funnel (monotonic).
  2. THIS-WEEK FUNNEL BY SOURCE — where the quality traffic is (ChatGPT,
     Google, Email/Brevo, Direct, ...) and where each source leaks.
  3. BREVO — most-recent sent campaign delivery stats (open/click/unsub/spam).

Units note: `sessions`/`engagedSessions` are session-scoped; the funnel steps
are distinct-USER counts (GA4 totalUsers per eventName). We never mix event
firings into the funnel — that's what made an earlier draft show view_item >
sessions. Engagement rate is reported separately as a session-level quality
stat, NOT a funnel step.

Usage:
  /tmp/gavenv/bin/python marketing/analytics/funnel_trend_report.py
  REPORT_DATE=2026-06-10 WEEKS=4 python marketing/analytics/funnel_trend_report.py

Auth: GA4 OAuth via token.json + oauth-credentials.json in repo root
(gitignored). BREVO_API_KEY + GA4_PROPERTY_ID from .env.local.
"""
import os
from datetime import date, timedelta, datetime
from pathlib import Path

import requests
from dotenv import dotenv_values
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.services.beta_analytics_data.transports.rest import (
    BetaAnalyticsDataRestTransport,
)
from google.analytics.data_v1beta.types import (
    RunReportRequest, Dimension, Metric, DateRange, OrderBy,
)

BASE = Path(__file__).resolve().parent.parent.parent
env = dotenv_values(BASE / ".env.local")
PROP = env.get("GA4_PROPERTY_ID", "529120634")
BREVO = env.get("BREVO_API_KEY")
WEEKS = int(os.getenv("WEEKS", "4"))
REPORT_DATE = os.getenv("REPORT_DATE")  # YYYY-MM-DD; defaults to today (PST host)
TODAY = datetime.strptime(REPORT_DATE, "%Y-%m-%d").date() if REPORT_DATE else date.today()

FUNNEL = [
    ("Visited",        None),            # all users
    ("Viewed product", "view_item"),
    ("Added to cart",  "add_to_cart"),
    ("Began checkout", "begin_checkout"),
    ("Purchased",      "purchase"),
]


def channel(sm: str) -> str:
    sm = sm.lower()
    if "brevo" in sm or "/email" in sm or "sendibm" in sm: return "Email (Brevo)"
    if "chatgpt" in sm or "openai" in sm: return "ChatGPT"
    if "perplexity" in sm: return "Perplexity"
    if "gemini" in sm or "bard" in sm: return "Gemini"
    if "google" in sm and "organic" in sm: return "Google Organic"
    if "google" in sm and ("cpc" in sm or "product_sync" in sm or "shopping" in sm): return "Google Shop/Ads"
    if "bing" in sm and "organic" in sm: return "Bing Organic"
    if "duckduckgo" in sm or "yahoo" in sm: return "Other Search"
    if "direct" in sm or "(none)" in sm: return "Direct"
    if "(not set)" in sm or "data not available" in sm: return "Unattributed"
    return "Referral/Other"


def _client():
    creds = Credentials.from_authorized_user_file(
        str(BASE / "token.json"), ["https://www.googleapis.com/auth/analytics.readonly"]
    )
    if not creds.valid and creds.expired and creds.refresh_token:
        creds.refresh(Request())
    return BetaAnalyticsDataClient(
        transport=BetaAnalyticsDataRestTransport(credentials=creds)
    )


def _report(client, dims, mets, s, e, order=None, limit=4000):
    req = RunReportRequest(
        property=f"properties/{PROP}",
        dimensions=[Dimension(name=d) for d in dims],
        metrics=[Metric(name=m) for m in mets],
        date_ranges=[DateRange(start_date=s.isoformat(), end_date=e.isoformat())],
        limit=limit,
    )
    if order:
        req.order_bys = [OrderBy(metric=OrderBy.MetricOrderBy(metric_name=order), desc=True)]
    return client.run_report(req)


def users_by_event(client, s, e):
    """distinct users per eventName, plus total users/sessions/engaged for the window."""
    r = _report(client, ["eventName"], ["totalUsers"], s, e)
    ev = {row.dimension_values[0].value: int(row.metric_values[0].value) for row in r.rows}
    r0 = _report(client, ["sessionSourceMedium"], ["totalUsers", "sessions", "engagedSessions"], s, e)
    u = sum(int(x.metric_values[0].value) for x in r0.rows)
    sess = sum(int(x.metric_values[1].value) for x in r0.rows)
    eng = sum(int(x.metric_values[2].value) for x in r0.rows)
    return ev, u, sess, eng


def main():
    client = _client()

    # ---- 1. TREND: last N rolling 7-day windows ----
    windows = []
    for i in range(WEEKS):
        end = TODAY - timedelta(days=7 * i)
        start = end - timedelta(days=6)
        windows.append((start, end))
    windows.reverse()  # oldest → newest

    cols = []
    for s, e in windows:
        ev, u, sess, eng = users_by_event(client, s, e)
        steps = [u if key is None else ev.get(key, 0) for _, key in FUNNEL]
        cols.append({"label": f"{s.strftime('%m/%d')}-{e.strftime('%m/%d')}",
                     "steps": steps, "sess": sess, "eng": eng})

    print("=" * 78)
    print(f"FUNNEL TREND — distinct users per step, {WEEKS}× rolling 7-day windows")
    print("(newest window on the right; ▲/▼ = vs prior week)")
    print("=" * 78)
    hdr = f"{'STEP':<17}" + "".join(f"{c['label']:>14}" for c in cols)
    print(hdr)
    for r_i, (name, _) in enumerate(FUNNEL):
        line = f"{name:<17}"
        for c_i, c in enumerate(cols):
            v = c["steps"][r_i]
            arrow = ""
            if c_i > 0:
                pv = cols[c_i - 1]["steps"][r_i]
                arrow = "▲" if v > pv else ("▼" if v < pv else "▬")
            line += f"{str(v)+arrow:>14}"
        print(line)
    # conversion rates per window (visit→view, view→cart, visit→buy)
    print("-" * 78)
    def pct(a, b): return f"{(a/b*100):.1f}%" if b else "—"
    for label, num_i, den_i in [("view→cart", 2, 1), ("visit→cart", 2, 0), ("visit→buy", 4, 0)]:
        line = f"{label:<17}"
        for c in cols:
            line += f"{pct(c['steps'][num_i], c['steps'][den_i]):>14}"
        print(line)
    line = f"{'engagement%':<17}"
    for c in cols:
        line += f"{pct(c['eng'], c['sess']):>14}"
    print(line)

    # ---- 2. THIS WEEK by source ----
    s, e = windows[-1]
    print("\n" + "=" * 78)
    print(f"THIS WEEK BY SOURCE ({s.isoformat()} → {e.isoformat()}) — distinct users per step")
    print("=" * 78)
    r2 = _report(client, ["sessionSourceMedium", "eventName"], ["totalUsers"], s, e)
    by = {}
    for row in r2.rows:
        ch = channel(row.dimension_values[0].value); en = row.dimension_values[1].value
        by.setdefault(ch, {})[en] = by.get(ch, {}).get(en, 0) + int(row.metric_values[0].value)
    r0 = _report(client, ["sessionSourceMedium"], ["totalUsers", "sessions", "engagedSessions"], s, e, "totalUsers")
    src = {}
    for row in r0.rows:
        ch = channel(row.dimension_values[0].value)
        d = src.setdefault(ch, {"u": 0, "s": 0, "e": 0})
        d["u"] += int(row.metric_values[0].value); d["s"] += int(row.metric_values[1].value); d["e"] += int(row.metric_values[2].value)
    print(f"{'CHANNEL':<18}{'users':>6}{'eng%':>6}{'viewed':>8}{'cart':>6}{'checkout':>9}{'buy':>5}")
    for ch in sorted(src, key=lambda c: -src[c]["u"]):
        d = src[ch]; b = by.get(ch, {})
        if d["u"] == 0: continue
        engp = f"{d['e']/d['s']*100:.0f}%" if d["s"] else "—"
        print(f"{ch:<18}{d['u']:>6}{engp:>6}{b.get('view_item',0):>8}{b.get('add_to_cart',0):>6}{b.get('begin_checkout',0):>9}{b.get('purchase',0):>5}")

    # ---- 3. Brevo most-recent sent campaign ----
    print("\n" + "=" * 78)
    print("BREVO — most recent sent campaign")
    print("=" * 78)
    try:
        r = requests.get("https://api.brevo.com/v3/emailCampaigns",
                         headers={"api-key": BREVO, "accept": "application/json"},
                         params={"status": "sent", "limit": 5, "sort": "desc"}, timeout=30)
        camps = r.json().get("campaigns", [])
        latest = camps[0] if camps else None
        if latest:
            cid = latest["id"]
            d = requests.get(f"https://api.brevo.com/v3/emailCampaigns/{cid}",
                             headers={"api-key": BREVO, "accept": "application/json"},
                             params={"statistics": "globalStats"}, timeout=30).json()
            g = d.get("statistics", {}).get("globalStats", {})
            sent = g.get("sent", 0); deliv = g.get("delivered", 0)
            print(f"#{cid} {d.get('name')}  (sent {d.get('scheduledAt','')})")
            print(f"   sent {sent} | delivered {deliv} ({deliv/sent*100:.1f}%)" if sent else f"   sent {sent}")
            print(f"   opens {g.get('uniqueViews',0)} ({g.get('opensRate',0):.1f}%) | "
                  f"clicks {g.get('uniqueClicks',0)} (CTR {g.get('uniqueClicks',0)/deliv*100:.2f}%)" if deliv else "")
            print(f"   unsub {g.get('unsubscriptions',0)} | spam {g.get('complaints',0)} | "
                  f"bounces soft {g.get('softBounces',0)}/hard {g.get('hardBounces',0)}")
    except Exception as ex:
        print("BREVO error:", ex)
    print("\nGenerated", datetime.now().strftime("%Y-%m-%d %H:%M"), "for report date", TODAY.isoformat())


if __name__ == "__main__":
    main()
