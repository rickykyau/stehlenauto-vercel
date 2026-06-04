"""
GA4 Traffic Analysis — Stehlen Auto
Pull traffic sources, landing pages, device breakdown, and user behavior.

Uses OAuth (desktop app) authentication — opens browser on first run,
then caches the token for future runs.

Requires:
  pip install google-analytics-data google-auth-oauthlib python-dotenv pandas

Environment variables (.env):
  GA4_PROPERTY_ID=529120634
  GA4_OAUTH_CREDENTIALS=./oauth-credentials.json
"""

import os
import sys
import pandas as pd
from datetime import date, timedelta
from pathlib import Path
from dotenv import load_dotenv

# Google auth
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import (
    RunReportRequest,
    Dimension,
    Metric,
    DateRange,
    OrderBy,
)

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

load_dotenv()

PROPERTY_ID = os.getenv("GA4_PROPERTY_ID", "529120634")
OAUTH_CREDS_FILE = os.getenv("GA4_OAUTH_CREDENTIALS", "./oauth-credentials.json")
TOKEN_FILE = "./token.json"

# GA4 Data API read-only scope
SCOPES = ["https://www.googleapis.com/auth/analytics.readonly"]


# ---------------------------------------------------------------------------
# OAuth Authentication
# ---------------------------------------------------------------------------

def get_authenticated_client() -> BetaAnalyticsDataClient:
    """Authenticate via OAuth and return a GA4 Data API client."""
    creds = None

    # Check for cached token
    if os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)

    # If no valid creds, do the OAuth flow
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            print("Refreshing expired token...")
            creds.refresh(Request())
        else:
            if not os.path.exists(OAUTH_CREDS_FILE):
                raise SystemExit(
                    f"OAuth credentials file not found at: {OAUTH_CREDS_FILE}\n"
                    f"Download it from Google Cloud Console > APIs & Services > Credentials"
                )
            print("Opening browser for Google sign-in (one-time)...")
            flow = InstalledAppFlow.from_client_secrets_file(OAUTH_CREDS_FILE, SCOPES)
            creds = flow.run_local_server(port=0)

        # Save token for future runs
        with open(TOKEN_FILE, "w") as f:
            f.write(creds.to_json())
        print(f"Token saved to {TOKEN_FILE}")

    return BetaAnalyticsDataClient(credentials=creds)


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def run_report(client, dimensions, metrics, date_range_days=90, row_limit=50):
    """Run a GA4 report and return a DataFrame."""
    end = date.today()
    start = end - timedelta(days=date_range_days)

    request = RunReportRequest(
        property=f"properties/{PROPERTY_ID}",
        dimensions=[Dimension(name=d) for d in dimensions],
        metrics=[Metric(name=m) for m in metrics],
        date_ranges=[DateRange(
            start_date=start.isoformat(),
            end_date=end.isoformat(),
        )],
        limit=row_limit,
        order_bys=[OrderBy(
            metric=OrderBy.MetricOrderBy(metric_name=metrics[0]),
            desc=True,
        )],
    )

    response = client.run_report(request)

    rows = []
    for row in response.rows:
        r = {}
        for i, dim in enumerate(dimensions):
            r[dim] = row.dimension_values[i].value
        for i, met in enumerate(metrics):
            r[met] = row.metric_values[i].value
        rows.append(r)

    return pd.DataFrame(rows)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    print("\nConnecting to GA4 (Property: %s)...\n" % PROPERTY_ID)
    client = get_authenticated_client()
    print("Authenticated successfully!\n")

    # Ensure output directory exists
    Path("data/analytics").mkdir(parents=True, exist_ok=True)

    # -----------------------------------------------------------------------
    # Report 1: Traffic sources
    # -----------------------------------------------------------------------
    print("=" * 70)
    print("REPORT 1: Traffic Sources (Last 90 Days)")
    print("=" * 70)

    df_sources = run_report(
        client,
        dimensions=["sessionDefaultChannelGroup", "sessionSource"],
        metrics=["sessions", "conversions", "totalRevenue", "engagedSessions"],
        date_range_days=90,
        row_limit=30,
    )

    if not df_sources.empty:
        for col in ["sessions", "conversions", "engagedSessions"]:
            df_sources[col] = pd.to_numeric(df_sources[col], errors="coerce").fillna(0).astype(int)
        df_sources["totalRevenue"] = pd.to_numeric(df_sources["totalRevenue"], errors="coerce").fillna(0).round(2)
        df_sources["engagementRate"] = (
            df_sources["engagedSessions"] / df_sources["sessions"].replace(0, 1)
        ).round(3)
        df_sources["convRate"] = (
            df_sources["conversions"] / df_sources["sessions"].replace(0, 1)
        ).round(4)

        print(df_sources.to_string(index=False))
        df_sources.to_csv("data/analytics/ga4_traffic_sources.csv", index=False)
        print(f"\n  -> Saved to data/analytics/ga4_traffic_sources.csv\n")
    else:
        print("  No data returned.\n")

    # -----------------------------------------------------------------------
    # Report 2: Top landing pages
    # -----------------------------------------------------------------------
    print("=" * 70)
    print("REPORT 2: Top Landing Pages (Last 90 Days)")
    print("=" * 70)

    df_pages = run_report(
        client,
        dimensions=["landingPagePlusQueryString"],
        metrics=["sessions", "conversions", "totalRevenue", "bounceRate"],
        date_range_days=90,
        row_limit=100,
    )

    if not df_pages.empty:
        for col in ["sessions", "conversions"]:
            df_pages[col] = pd.to_numeric(df_pages[col], errors="coerce").fillna(0).astype(int)
        df_pages["totalRevenue"] = pd.to_numeric(df_pages["totalRevenue"], errors="coerce").fillna(0).round(2)
        df_pages["bounceRate"] = pd.to_numeric(df_pages["bounceRate"], errors="coerce").fillna(0).round(3)
        df_pages["convRate"] = (
            df_pages["conversions"] / df_pages["sessions"].replace(0, 1)
        ).round(4)
        df_pages = df_pages.sort_values("sessions", ascending=False).head(25)

        print(df_pages.to_string(index=False))
        df_pages.to_csv("data/analytics/ga4_landing_pages.csv", index=False)
        print(f"\n  -> Saved to data/analytics/ga4_landing_pages.csv\n")
    else:
        print("  No data returned.\n")

    # -----------------------------------------------------------------------
    # Report 3: Device category breakdown
    # -----------------------------------------------------------------------
    print("=" * 70)
    print("REPORT 3: Device Breakdown (Last 90 Days)")
    print("=" * 70)

    df_device = run_report(
        client,
        dimensions=["deviceCategory"],
        metrics=["sessions", "conversions", "totalRevenue", "averageSessionDuration"],
        date_range_days=90,
        row_limit=10,
    )

    if not df_device.empty:
        for col in ["sessions", "conversions"]:
            df_device[col] = pd.to_numeric(df_device[col], errors="coerce").fillna(0).astype(int)
        df_device["totalRevenue"] = pd.to_numeric(df_device["totalRevenue"], errors="coerce").fillna(0).round(2)
        df_device["averageSessionDuration"] = pd.to_numeric(
            df_device["averageSessionDuration"], errors="coerce"
        ).fillna(0).round(1)
        total_sessions = df_device["sessions"].sum()
        df_device["pctTraffic"] = (df_device["sessions"] / max(total_sessions, 1) * 100).round(1)

        print(df_device.to_string(index=False))
        df_device.to_csv("data/analytics/ga4_devices.csv", index=False)
        print(f"\n  -> Saved to data/analytics/ga4_devices.csv\n")
    else:
        print("  No data returned.\n")

    # -----------------------------------------------------------------------
    # Report 4: Day-of-week patterns
    # -----------------------------------------------------------------------
    print("=" * 70)
    print("REPORT 4: Day-of-Week Patterns (Last 90 Days)")
    print("=" * 70)

    df_dow = run_report(
        client,
        dimensions=["dayOfWeekName"],
        metrics=["sessions", "conversions", "totalRevenue"],
        date_range_days=90,
        row_limit=7,
    )

    if not df_dow.empty:
        for col in ["sessions", "conversions"]:
            df_dow[col] = pd.to_numeric(df_dow[col], errors="coerce").fillna(0).astype(int)
        df_dow["totalRevenue"] = pd.to_numeric(df_dow["totalRevenue"], errors="coerce").fillna(0).round(2)
        df_dow["convRate"] = (
            df_dow["conversions"] / df_dow["sessions"].replace(0, 1)
        ).round(4)

        print(df_dow.to_string(index=False))
        df_dow.to_csv("data/analytics/ga4_day_of_week.csv", index=False)
        print(f"\n  -> Saved to data/analytics/ga4_day_of_week.csv\n")
    else:
        print("  No data returned.\n")

    # -----------------------------------------------------------------------
    # Report 5: Geographic breakdown (US states)
    # -----------------------------------------------------------------------
    print("=" * 70)
    print("REPORT 5: Top Regions by Sessions (Last 90 Days)")
    print("=" * 70)

    df_geo = run_report(
        client,
        dimensions=["region", "country"],
        metrics=["sessions", "conversions", "totalRevenue"],
        date_range_days=90,
        row_limit=50,
    )

    if not df_geo.empty:
        for col in ["sessions", "conversions"]:
            df_geo[col] = pd.to_numeric(df_geo[col], errors="coerce").fillna(0).astype(int)
        df_geo["totalRevenue"] = pd.to_numeric(df_geo["totalRevenue"], errors="coerce").fillna(0).round(2)
        df_geo = df_geo.sort_values("sessions", ascending=False).head(20)

        print(df_geo.to_string(index=False))
        df_geo.to_csv("data/analytics/ga4_geo.csv", index=False)
        print(f"\n  -> Saved to data/analytics/ga4_geo.csv\n")
    else:
        print("  No data returned.\n")

    # -----------------------------------------------------------------------
    # Report 6: Event breakdown (what's actually being tracked)
    # -----------------------------------------------------------------------
    print("=" * 70)
    print("REPORT 6: All Events Firing (Last 90 Days)")
    print("=" * 70)

    df_events = run_report(
        client,
        dimensions=["eventName"],
        metrics=["eventCount", "totalUsers"],
        date_range_days=90,
        row_limit=50,
    )

    if not df_events.empty:
        for col in ["eventCount", "totalUsers"]:
            df_events[col] = pd.to_numeric(df_events[col], errors="coerce").fillna(0).astype(int)
        df_events = df_events.sort_values("eventCount", ascending=False)

        print(df_events.to_string(index=False))
        df_events.to_csv("data/analytics/ga4_events.csv", index=False)
        print(f"\n  -> Saved to data/analytics/ga4_events.csv\n")

        # Check for e-commerce events
        ecom_events = {"purchase", "add_to_cart", "begin_checkout", "view_item", "add_payment_info"}
        found = set(df_events["eventName"].values) & ecom_events
        missing = ecom_events - found

        if found:
            print(f"  E-commerce events FOUND: {', '.join(sorted(found))}")
        if missing:
            print(f"  E-commerce events MISSING: {', '.join(sorted(missing))}")
            print("  !! These need to be configured before running paid ads !!")
    else:
        print("  No data returned.\n")

    # -----------------------------------------------------------------------
    # Summary
    # -----------------------------------------------------------------------
    print("\n" + "=" * 70)
    print("ANALYSIS COMPLETE — All reports saved to data/analytics/")
    print("=" * 70)
    print("""
Key questions answered:
1. Traffic sources - which channels to invest in
2. Landing pages  - which product pages convert (or don't)
3. Devices        - mobile vs desktop conversion gap
4. Day of week    - when to push ad spend
5. Geography      - geo targeting for Meta/Google
6. Events         - what tracking is actually working

CRITICAL: Check Report 6 for missing e-commerce events.
If 'purchase' and 'add_to_cart' are missing, conversion tracking
must be fixed before any ad spend.
""")


if __name__ == "__main__":
    main()
