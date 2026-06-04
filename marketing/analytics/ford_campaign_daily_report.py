"""
Ford Campaign Daily Performance Report — Stehlen Auto
=======================================================
Pulls real-time Brevo + GA4 data for the Ford Hero Product campaign (#24)
and any campaigns #25–28 scheduled after it.

Reports:
  1. Brevo: Campaign #24 delivery stats (sent/delivered/opens/clicks/bounces/spam/unsubs)
  2. Brevo: Campaigns #25–28 status check (confirm still scheduled, not accidentally sent)
  3. GA4: Brevo traffic today — sessions, funnel, revenue
  4. GA4: All-traffic today — sessions, funnel, revenue (baseline)
  5. GA4: Events breakdown for Brevo traffic today
  6. Dashboard summary printed to stdout
  7. Raw data saved to data/analytics/ga4_brevo_full_daily.csv

Usage:
  cd "/Users/ricky/Library/CloudStorage/OneDrive-Personal/Documents/Robome/Client/JL Concepts/Project/Shopify-Storefront-Lovable"
  source venv/bin/activate
  python marketing/analytics/ford_campaign_daily_report.py

  Optional: override the report date (defaults to today)
    REPORT_DATE=2026-04-10 python marketing/analytics/ford_campaign_daily_report.py
"""

import os
import sys
import json
import time
import requests
import pandas as pd
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.services.beta_analytics_data.transports.rest import BetaAnalyticsDataRestTransport
from google.analytics.data_v1beta.types import (
    RunReportRequest,
    Dimension,
    Metric,
    DateRange,
    OrderBy,
    FilterExpression,
    Filter,
)

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(BASE_DIR / ".env")

BREVO_API_KEY   = os.getenv("BREVO_API_KEY")
PROPERTY_ID     = os.getenv("GA4_PROPERTY_ID", "529120634")
OAUTH_CREDS_FILE = os.getenv("GA4_OAUTH_CREDENTIALS", str(BASE_DIR / "oauth-credentials.json"))
TOKEN_FILE       = str(BASE_DIR / "token.json")
SCOPES           = ["https://www.googleapis.com/auth/analytics.readonly"]

OUTPUT_DIR = BASE_DIR / "data" / "analytics"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

REPORT_DATE = os.getenv("REPORT_DATE", date.today().isoformat())   # e.g. "2026-04-10"

FORD_CAMPAIGN_ID    = 24
FOLLOWUP_CAMPAIGN_IDS = [25, 26, 27, 28]

BREVO_BASE = "https://api.brevo.com/v3"
BREVO_HEADERS = {
    "accept": "application/json",
    "api-key": BREVO_API_KEY or "",
}

# ---------------------------------------------------------------------------
# Brevo helpers
# ---------------------------------------------------------------------------

def brevo_get(path: str, params: Optional[Dict[str, Any]] = None, retries: int = 3) -> Any:
    """GET from Brevo API with retry on 429 / 5xx."""
    url = f"{BREVO_BASE}{path}"
    for attempt in range(retries):
        resp = requests.get(url, headers=BREVO_HEADERS, params=params or {}, timeout=30)
        if resp.status_code == 429:
            wait = int(resp.headers.get("Retry-After", 3))
            print(f"  [Brevo] Rate limited — sleeping {wait}s...")
            time.sleep(wait)
            continue
        if resp.status_code >= 500:
            print(f"  [Brevo] {resp.status_code} on {path}, attempt {attempt+1}/{retries}")
            time.sleep(2 ** attempt)
            continue
        resp.raise_for_status()
        return resp.json()
    raise RuntimeError(f"Brevo GET {path} failed after {retries} retries")


def fetch_campaign(campaign_id: int) -> Dict[str, Any]:
    """Fetch a single email campaign by ID."""
    return brevo_get(f"/emailCampaigns/{campaign_id}")


def parse_campaign_stats(c: Dict[str, Any]) -> Dict[str, Any]:
    """
    Flatten a Brevo campaign object into a stats dict.
    Brevo returns stats nested under c['statistics']['campaignStats'][0]
    for sent campaigns, and empty/missing for draft/scheduled.
    """
    stats = c.get("statistics", {})
    # campaignStats is a list; the aggregate is index 0
    agg = {}
    campaign_stats_list = stats.get("campaignStats", [])
    if campaign_stats_list:
        agg = campaign_stats_list[0]

    delivered   = agg.get("delivered",     0)
    opens       = agg.get("uniqueViews",   0)   # Brevo field name = uniqueViews
    clicks      = agg.get("uniqueClicks",  0)
    bounces     = agg.get("hardBounces",   0) + agg.get("softBounces", 0)
    hard_bounces = agg.get("hardBounces",  0)
    soft_bounces = agg.get("softBounces",  0)
    spam        = agg.get("complaints",    0)
    unsubs      = agg.get("unsubscriptions", 0)

    sent = c.get("statistics", {}).get("globalStats", {}).get("sent", delivered)
    # Fall back: some Brevo plans report 'sent' at top level stats
    if not sent:
        sent = agg.get("sent", 0)

    open_rate   = (opens  / sent * 100) if sent else 0.0
    click_rate  = (clicks / sent * 100) if sent else 0.0
    ctor        = (clicks / opens * 100) if opens else 0.0
    bounce_rate = (bounces / sent * 100) if sent else 0.0

    return {
        "id":           c.get("id"),
        "name":         c.get("name", ""),
        "subject":      c.get("subject", ""),
        "status":       c.get("status", ""),
        "scheduled_at": c.get("scheduledAt", ""),
        "sent_date":    c.get("sentDate", ""),
        "sent":         sent,
        "delivered":    delivered,
        "opens":        opens,
        "clicks":       clicks,
        "hard_bounces": hard_bounces,
        "soft_bounces": soft_bounces,
        "bounces":      bounces,
        "spam":         spam,
        "unsubs":       unsubs,
        "open_rate_pct":   round(open_rate,   2),
        "click_rate_pct":  round(click_rate,  2),
        "ctor_pct":        round(ctor,        2),
        "bounce_rate_pct": round(bounce_rate, 2),
    }


# ---------------------------------------------------------------------------
# GA4 auth
# ---------------------------------------------------------------------------

def get_ga4_client() -> BetaAnalyticsDataClient:
    creds = None
    if os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            print("Refreshing GA4 OAuth token...")
            creds.refresh(Request())
        else:
            if not os.path.exists(OAUTH_CREDS_FILE):
                raise SystemExit(
                    f"\nOAuth credentials file not found: {OAUTH_CREDS_FILE}\n"
                    "Download from Google Cloud Console -> APIs & Services -> Credentials.\n"
                )
            print("Opening browser for Google sign-in...")
            flow = InstalledAppFlow.from_client_secrets_file(OAUTH_CREDS_FILE, SCOPES)
            creds = flow.run_local_server(port=0)

        with open(TOKEN_FILE, "w") as f:
            f.write(creds.to_json())
        print(f"Token saved -> {TOKEN_FILE}")

    # Use REST transport to avoid gRPC DNS resolution failures in some environments
    transport = BetaAnalyticsDataRestTransport(credentials=creds)
    return BetaAnalyticsDataClient(transport=transport)


# ---------------------------------------------------------------------------
# GA4 filter helpers
# ---------------------------------------------------------------------------

def brevo_source_filter() -> FilterExpression:
    """sessionSource CONTAINS 'brevo' (case-insensitive)."""
    return FilterExpression(
        filter=Filter(
            field_name="sessionSource",
            string_filter=Filter.StringFilter(
                match_type=Filter.StringFilter.MatchType.CONTAINS,
                value="brevo",
                case_sensitive=False,
            ),
        )
    )


# ---------------------------------------------------------------------------
# GA4 report runners
# ---------------------------------------------------------------------------

def run_report(
    client: BetaAnalyticsDataClient,
    dimensions: List[str],
    metrics: List[str],
    start: str,
    end: str,
    dimension_filter: Optional[FilterExpression] = None,
    order_by_metric: Optional[str] = None,
    limit: int = 100,
) -> pd.DataFrame:
    """Generic GA4 report runner — returns a pandas DataFrame."""
    req = RunReportRequest(
        property=f"properties/{PROPERTY_ID}",
        dimensions=[Dimension(name=d) for d in dimensions],
        metrics=[Metric(name=m) for m in metrics],
        date_ranges=[DateRange(start_date=start, end_date=end)],
        dimension_filter=dimension_filter,
        limit=limit,
    )
    if order_by_metric:
        req.order_bys = [
            OrderBy(metric=OrderBy.MetricOrderBy(metric_name=order_by_metric), desc=True)
        ]

    resp = client.run_report(req)

    dim_headers = [h.name for h in resp.dimension_headers]
    met_headers = [h.name for h in resp.metric_headers]
    rows = []
    for row in resp.rows:
        r = {dim_headers[i]: row.dimension_values[i].value for i in range(len(dim_headers))}
        r.update({met_headers[i]: row.metric_values[i].value for i in range(len(met_headers))})
        rows.append(r)

    return pd.DataFrame(rows) if rows else pd.DataFrame(columns=dim_headers + met_headers)


def run_metric_only_report(
    client: BetaAnalyticsDataClient,
    metrics: List[str],
    start: str,
    end: str,
    dimension_filter: Optional[FilterExpression] = None,
) -> Dict[str, str]:
    """Run a report with no dimensions — returns a single dict of metric -> value."""
    req = RunReportRequest(
        property=f"properties/{PROPERTY_ID}",
        metrics=[Metric(name=m) for m in metrics],
        date_ranges=[DateRange(start_date=start, end_date=end)],
        dimension_filter=dimension_filter,
    )
    resp = client.run_report(req)
    if not resp.rows:
        return {m: "0" for m in metrics}
    row = resp.rows[0]
    return {
        resp.metric_headers[i].name: row.metric_values[i].value
        for i in range(len(resp.metric_headers))
    }


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    print(f"\n{'='*60}")
    print(f"  FORD CAMPAIGN DAILY REPORT — {REPORT_DATE}")
    print(f"{'='*60}\n")

    if not BREVO_API_KEY:
        sys.exit("ERROR: BREVO_API_KEY not set in .env")

    # -----------------------------------------------------------------------
    # TASK 1: Brevo campaign stats
    # -----------------------------------------------------------------------
    print("--- [1/5] Fetching Brevo campaign #24 stats...")
    ford_raw = fetch_campaign(FORD_CAMPAIGN_ID)
    ford = parse_campaign_stats(ford_raw)

    print(f"  Campaign: {ford['name']}")
    print(f"  Status:   {ford['status']}")
    print(f"  Sent:     {ford['sent']:,}")

    print("\n--- [2/5] Checking follow-up campaigns #25–28...")
    followup_stats: List[Dict[str, Any]] = []
    for cid in FOLLOWUP_CAMPAIGN_IDS:
        try:
            raw = fetch_campaign(cid)
            s = parse_campaign_stats(raw)
            followup_stats.append(s)
            print(f"  Campaign #{cid}: {s['name']!r}  status={s['status']}  scheduled={s['scheduled_at']}")
        except requests.exceptions.HTTPError as e:
            if e.response is not None and e.response.status_code == 404:
                print(f"  Campaign #{cid}: NOT FOUND (not created yet)")
                followup_stats.append({"id": cid, "name": "NOT FOUND", "status": "not_found",
                                       "scheduled_at": "", "sent_date": "", "sent": 0,
                                       "delivered": 0, "opens": 0, "clicks": 0,
                                       "hard_bounces": 0, "soft_bounces": 0, "bounces": 0,
                                       "spam": 0, "unsubs": 0,
                                       "open_rate_pct": 0, "click_rate_pct": 0,
                                       "ctor_pct": 0, "bounce_rate_pct": 0})
            else:
                raise

    # -----------------------------------------------------------------------
    # TASK 2: GA4 reports
    # -----------------------------------------------------------------------
    print(f"\n--- [3/5] Connecting to GA4 (property {PROPERTY_ID})...")
    ga4 = get_ga4_client()
    print("  Connected.")

    # Report A: Brevo traffic — source/medium + landing page
    print(f"\n--- [4/5] Pulling GA4 reports for {REPORT_DATE}...")
    print("  A. Brevo traffic: source/medium + landing page...")
    df_brevo_traffic = run_report(
        ga4,
        dimensions=["sessionSourceMedium", "landingPage"],
        metrics=["sessions", "engagedSessions", "bounceRate",
                 "averageSessionDuration", "conversions"],
        start=REPORT_DATE,
        end=REPORT_DATE,
        dimension_filter=brevo_source_filter(),
        order_by_metric="sessions",
    )

    # Report B: All-traffic funnel today
    print("  B. All-traffic funnel...")
    df_all_funnel = run_metric_only_report(
        ga4,
        metrics=["sessions", "itemsViewed", "addToCarts",
                 "checkouts", "ecommercePurchases", "purchaseRevenue"],
        start=REPORT_DATE,
        end=REPORT_DATE,
    )

    # Report C: Revenue by source/medium (all traffic)
    print("  C. Revenue by source/medium...")
    df_revenue = run_report(
        ga4,
        dimensions=["sessionSourceMedium"],
        metrics=["purchaseRevenue", "transactions", "ecommercePurchases"],
        start=REPORT_DATE,
        end=REPORT_DATE,
        order_by_metric="purchaseRevenue",
    )

    # Report D: Events from Brevo traffic
    print("  D. Brevo traffic events...")
    df_brevo_events = run_report(
        ga4,
        dimensions=["eventName"],
        metrics=["eventCount"],
        start=REPORT_DATE,
        end=REPORT_DATE,
        dimension_filter=brevo_source_filter(),
        order_by_metric="eventCount",
        limit=50,
    )

    # Report E: Brevo funnel (metric-only — no dimension) for dashboard total
    print("  E. Brevo funnel totals...")
    df_brevo_funnel = run_metric_only_report(
        ga4,
        metrics=["sessions", "itemsViewed", "addToCarts",
                 "checkouts", "ecommercePurchases", "purchaseRevenue"],
        start=REPORT_DATE,
        end=REPORT_DATE,
        dimension_filter=brevo_source_filter(),
    )

    # -----------------------------------------------------------------------
    # Derive Brevo session-level bounce rate + avg duration from Report A
    # -----------------------------------------------------------------------
    brevo_sessions_total      = 0
    brevo_bounce_rate_avg     = 0.0
    brevo_avg_duration_avg    = 0.0

    if not df_brevo_traffic.empty:
        df_brevo_traffic["sessions"] = pd.to_numeric(df_brevo_traffic["sessions"], errors="coerce").fillna(0)
        df_brevo_traffic["bounceRate"] = pd.to_numeric(df_brevo_traffic["bounceRate"], errors="coerce").fillna(0)
        df_brevo_traffic["averageSessionDuration"] = pd.to_numeric(df_brevo_traffic["averageSessionDuration"], errors="coerce").fillna(0)

        brevo_sessions_total   = int(df_brevo_traffic["sessions"].sum())
        if brevo_sessions_total:
            # Weighted average across landing pages
            brevo_bounce_rate_avg  = (
                (df_brevo_traffic["bounceRate"] * df_brevo_traffic["sessions"]).sum()
                / brevo_sessions_total
            )
            brevo_avg_duration_avg = (
                (df_brevo_traffic["averageSessionDuration"] * df_brevo_traffic["sessions"]).sum()
                / brevo_sessions_total
            )

    # -----------------------------------------------------------------------
    # TASK 3: Build output CSV
    # -----------------------------------------------------------------------
    print("\n--- [5/5] Saving raw data to CSV...")

    all_frames: List[pd.DataFrame] = []

    # Section: Ford campaign stats
    ford_df = pd.DataFrame([ford])
    ford_df.insert(0, "section", "brevo_campaign_24")
    all_frames.append(ford_df)

    # Section: Follow-up campaign statuses
    if followup_stats:
        fu_df = pd.DataFrame(followup_stats)
        fu_df.insert(0, "section", "brevo_campaigns_25_28")
        all_frames.append(fu_df)

    # Section: Brevo GA4 traffic by source/medium + landing page
    if not df_brevo_traffic.empty:
        bt = df_brevo_traffic.copy()
        bt.insert(0, "section", "ga4_brevo_traffic")
        bt.insert(1, "report_date", REPORT_DATE)
        all_frames.append(bt)

    # Section: Revenue by source/medium
    if not df_revenue.empty:
        rev = df_revenue.copy()
        rev.insert(0, "section", "ga4_revenue_by_source")
        rev.insert(1, "report_date", REPORT_DATE)
        all_frames.append(rev)

    # Section: Brevo events
    if not df_brevo_events.empty:
        be = df_brevo_events.copy()
        be.insert(0, "section", "ga4_brevo_events")
        be.insert(1, "report_date", REPORT_DATE)
        all_frames.append(be)

    # Section: All-traffic funnel (single row)
    all_funnel_df = pd.DataFrame([{**{"section": "ga4_all_funnel", "report_date": REPORT_DATE}, **df_all_funnel}])
    all_frames.append(all_funnel_df)

    # Section: Brevo funnel (single row)
    brevo_funnel_df = pd.DataFrame([{**{"section": "ga4_brevo_funnel", "report_date": REPORT_DATE}, **df_brevo_funnel}])
    all_frames.append(brevo_funnel_df)

    output_csv = OUTPUT_DIR / "ga4_brevo_full_daily.csv"
    combined = pd.concat(all_frames, ignore_index=True, sort=False)
    combined.to_csv(output_csv, index=False)
    print(f"  Saved -> {output_csv}")

    # -----------------------------------------------------------------------
    # DASHBOARD PRINT
    # -----------------------------------------------------------------------
    def pct(num, denom, digits=1):
        return f"{num/denom*100:.{digits}f}%" if denom else "N/A"

    def fmt_dur(seconds_str: float) -> str:
        try:
            s = float(seconds_str)
            return f"{int(s//60)}m {int(s%60)}s"
        except (ValueError, TypeError):
            return "N/A"

    def safe_float(v, default=0.0) -> float:
        try:
            return float(v)
        except (ValueError, TypeError):
            return default

    def safe_int(v, default=0) -> int:
        try:
            return int(float(v))
        except (ValueError, TypeError):
            return default

    delivered  = ford["delivered"]
    sent       = ford["sent"]
    opens      = ford["opens"]
    clicks     = ford["clicks"]
    bounces    = ford["bounces"]
    spam       = ford["spam"]
    unsubs     = ford["unsubs"]

    # GA4 all-traffic
    all_sessions  = safe_int(df_all_funnel.get("sessions", 0))
    all_views     = safe_int(df_all_funnel.get("itemsViewed", 0))
    all_atc       = safe_int(df_all_funnel.get("addToCarts", 0))
    all_checkout  = safe_int(df_all_funnel.get("checkouts", 0))
    all_purchases = safe_int(df_all_funnel.get("ecommercePurchases", 0))
    all_revenue   = safe_float(df_all_funnel.get("purchaseRevenue", 0))

    # GA4 Brevo-segment
    b_sessions  = safe_int(df_brevo_funnel.get("sessions", 0))
    b_views     = safe_int(df_brevo_funnel.get("itemsViewed", 0))
    b_atc       = safe_int(df_brevo_funnel.get("addToCarts", 0))
    b_checkout  = safe_int(df_brevo_funnel.get("checkouts", 0))
    b_purchases = safe_int(df_brevo_funnel.get("ecommercePurchases", 0))
    b_revenue   = safe_float(df_brevo_funnel.get("purchaseRevenue", 0))

    print("\n")
    print("=" * 60)
    print(f"  FORD CAMPAIGN PERFORMANCE — {REPORT_DATE}")
    print("=" * 60)

    # Campaign status banner
    status_upper = ford["status"].upper()
    if ford["status"] == "sent":
        status_label = f"STATUS: {status_upper}  (sent {ford['sent_date'] or 'today'})"
    elif ford["status"] == "queued":
        status_label = f"STATUS: {status_upper}  (in send queue — should deliver shortly)"
    elif ford["status"] == "scheduled":
        status_label = f"STATUS: {status_upper}  (scheduled for {ford['scheduled_at']})"
    else:
        status_label = f"STATUS: {status_upper}"
    print(f"\n  Campaign #{FORD_CAMPAIGN_ID}: {ford['name']}")
    print(f"  {status_label}")

    print(f"""
EMAIL METRICS (Brevo):
  Sent:          {sent:>8,}
  Delivered:     {delivered:>8,}  ({pct(delivered, sent)})
  Opens:         {opens:>8,}  ({pct(opens, sent)} open rate)
  Clicks:        {clicks:>8,}  ({pct(clicks, sent)} click rate  |  CTOR: {pct(clicks, opens)})
  Bounces:       {bounces:>8,}  ({pct(bounces, sent)})
    Hard:        {ford['hard_bounces']:>8,}
    Soft:        {ford['soft_bounces']:>8,}
  Spam reports:  {spam:>8,}
  Unsubscribes:  {unsubs:>8,}
""")

    print("FOLLOW-UP CAMPAIGNS (#25–28):")
    for s in followup_stats:
        if s["status"] == "not_found":
            print(f"  #{s['id']}: NOT CREATED YET")
        elif s["status"] in ("scheduled", "draft"):
            print(f"  #{s['id']}: {s['name']!r}  |  {s['status'].upper()}  |  scheduled: {s['scheduled_at'] or 'n/a'}")
        elif s["status"] == "sent":
            print(f"  #{s['id']}: {s['name']!r}  |  SENT  |  sent_date: {s['sent_date']}  |  [VERIFY — should still be scheduled]")
        else:
            print(f"  #{s['id']}: {s['name']!r}  |  {s['status'].upper()}")

    print(f"""
SITE METRICS — Brevo Traffic (GA4):
  Sessions:      {b_sessions:>6,}
  Bounce Rate:   {brevo_bounce_rate_avg:>6.1f}%
  Avg Duration:  {fmt_dur(brevo_avg_duration_avg)}
  Funnel:
    Sessions    {b_sessions:>6,}
    view_item   {b_views:>6,}  ({pct(b_views, b_sessions)} of sessions)
    add_to_cart {b_atc:>6,}  ({pct(b_atc, b_sessions)} of sessions)
    checkout    {b_checkout:>6,}  ({pct(b_checkout, b_sessions)} of sessions)
    purchase    {b_purchases:>6,}  ({pct(b_purchases, b_sessions)} of sessions)
  Revenue:       ${b_revenue:>8,.2f}
""")

    if not df_brevo_events.empty:
        print("  Top Events (Brevo traffic):")
        df_brevo_events["eventCount"] = pd.to_numeric(df_brevo_events["eventCount"], errors="coerce").fillna(0)
        for _, row in df_brevo_events.head(10).iterrows():
            print(f"    {row['eventName']:<30} {int(row['eventCount']):>6,}")

    if not df_brevo_traffic.empty:
        print("\n  Top Landing Pages (Brevo traffic):")
        for _, row in df_brevo_traffic.head(8).iterrows():
            print(f"    {str(row['landingPage'])[:50]:<50}  sessions={int(row['sessions']):>4,}")

    print(f"""
OVERALL SITE (GA4 — all traffic):
  Total Sessions: {all_sessions:>6,}
  Funnel:
    Sessions    {all_sessions:>6,}
    view_item   {all_views:>6,}  ({pct(all_views, all_sessions)} of sessions)
    add_to_cart {all_atc:>6,}  ({pct(all_atc, all_sessions)} of sessions)
    checkout    {all_checkout:>6,}  ({pct(all_checkout, all_sessions)} of sessions)
    purchase    {all_purchases:>6,}  ({pct(all_purchases, all_sessions)} of sessions)
  Total Revenue:  ${all_revenue:>8,.2f}
""")

    if not df_revenue.empty:
        print("  Revenue by Source/Medium:")
        df_revenue["purchaseRevenue"] = pd.to_numeric(df_revenue["purchaseRevenue"], errors="coerce").fillna(0)
        for _, row in df_revenue.head(10).iterrows():
            print(f"    {str(row['sessionSourceMedium']):<35}  ${float(row['purchaseRevenue']):>8,.2f}")

    print("\n" + "=" * 60)
    if ford["status"] == "sent" and b_sessions == 0:
        print("  NOTE: GA4 showing 0 Brevo sessions — data may still be")
        print("  processing. GA4 intraday data can lag 4–8 hours.")
        print("  Re-run this script after 12pm PT for reliable intraday numbers.")
    elif ford["status"] in ("scheduled", "draft"):
        print(f"  NOTE: Campaign #24 has not sent yet (status: {ford['status']}).")
        print("  No GA4 email traffic expected until after send.")
    print("=" * 60 + "\n")

    print(f"Raw data saved to: {output_csv}")


if __name__ == "__main__":
    main()
