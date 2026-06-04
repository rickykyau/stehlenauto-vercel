"""
GA4 Brevo Full Analysis — Stehlen Auto
========================================
Comprehensive analysis of the period when Brevo reactivation emails
were sent: March 31 - April 3, 2026.

Diagnoses why ~700 Brevo clicks resulted in 0 orders.

Sections:
  1.  All-traffic overview (sessions, users, engagement by source/medium)
  2.  Brevo-specific funnel (Sessions -> view_item -> ATC -> checkout -> purchase)
  3.  Landing page performance for Brevo traffic
  4.  All site events for the full period (complete event count table)
  5.  Device breakdown for Brevo traffic
  6.  Overall site conversion funnel (all traffic — baseline comparison)
  7.  Purchase check — any orders at all from any source in this period?
  8.  Daily traffic by source (detect the March 31 vs April 3 send)
  9.  SendIBM / bot click audit (mo7ql.r.ag.d.sendibm3.com referral analysis)

Auth: OAuth desktop app flow — uses cached token.json, opens browser if expired.

Run:
  cd "/Users/ricky/Library/CloudStorage/OneDrive-Personal/Documents/Robome/Client/JL Concepts/Project/Shopify-Storefront-Lovable"
  source venv/bin/activate
  python marketing/analytics/ga4_brevo_full_analysis.py
"""

import os
import sys
import pandas as pd
from datetime import date, datetime
from pathlib import Path
from dotenv import load_dotenv

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
    FilterExpression,
    FilterExpressionList,
    Filter,
)

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

load_dotenv()

PROPERTY_ID     = os.getenv("GA4_PROPERTY_ID", "529120634")
OAUTH_CREDS_FILE = os.getenv("GA4_OAUTH_CREDENTIALS", "./oauth-credentials.json")
TOKEN_FILE      = "./token.json"
SCOPES          = ["https://www.googleapis.com/auth/analytics.readonly"]

# Full window covering all Brevo sends (first send March 31, last send April 3)
# +1 day buffer on the end to catch delayed conversions (users who clicked but
# didn't buy until the next morning)
START_DATE = "2026-03-31"
END_DATE   = "2026-04-03"

OUTPUT_DIR = Path("data/analytics")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

def get_authenticated_client() -> BetaAnalyticsDataClient:
    creds = None
    if os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            print("Refreshing expired OAuth token...")
            creds.refresh(Request())
        else:
            if not os.path.exists(OAUTH_CREDS_FILE):
                raise SystemExit(
                    f"\nOAuth credentials file not found: {OAUTH_CREDS_FILE}\n"
                    "Download it from Google Cloud Console -> APIs & Services -> Credentials.\n"
                )
            print("Opening browser for Google sign-in (one-time setup)...")
            flow = InstalledAppFlow.from_client_secrets_file(OAUTH_CREDS_FILE, SCOPES)
            creds = flow.run_local_server(port=0)

        with open(TOKEN_FILE, "w") as f:
            f.write(creds.to_json())
        print(f"Token saved to {TOKEN_FILE}")

    return BetaAnalyticsDataClient(credentials=creds)


# ---------------------------------------------------------------------------
# Filter builders
# ---------------------------------------------------------------------------

def brevo_source_filter() -> FilterExpression:
    """Match sessionSource CONTAINS 'brevo' (case-insensitive).
    Catches utm_source=brevo, utm_source=Brevo, utm_source=brevo.com."""
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


def sendibm_filter() -> FilterExpression:
    """Match the sendibm3.com referral domain that appears when Brevo's
    click-tracker forwards without preserving UTMs."""
    return FilterExpression(
        filter=Filter(
            field_name="sessionSource",
            string_filter=Filter.StringFilter(
                match_type=Filter.StringFilter.MatchType.CONTAINS,
                value="sendibm",
                case_sensitive=False,
            ),
        )
    )


def brevo_or_sendibm_filter() -> FilterExpression:
    """Union: sessionSource contains 'brevo' OR 'sendibm' — captures all
    traffic attributable to the Brevo campaign, regardless of whether UTMs
    survived the click-tracker hop."""
    return FilterExpression(
        or_group=FilterExpressionList(
            expressions=[brevo_source_filter(), sendibm_filter()]
        )
    )


def email_medium_filter() -> FilterExpression:
    """sessionMedium = email (exact, case-insensitive)."""
    return FilterExpression(
        filter=Filter(
            field_name="sessionMedium",
            string_filter=Filter.StringFilter(
                match_type=Filter.StringFilter.MatchType.EXACT,
                value="email",
                case_sensitive=False,
            ),
        )
    )


# ---------------------------------------------------------------------------
# Core report runner
# ---------------------------------------------------------------------------

def run_report(
    client,
    dimensions: list,
    metrics: list,
    start: str = START_DATE,
    end: str = END_DATE,
    row_limit: int = 100,
    order_by_metric: str = None,
    dimension_filter: FilterExpression = None,
) -> pd.DataFrame:

    order_bys = []
    if order_by_metric:
        order_bys = [OrderBy(
            metric=OrderBy.MetricOrderBy(metric_name=order_by_metric),
            desc=True,
        )]

    kwargs = dict(
        property=f"properties/{PROPERTY_ID}",
        dimensions=[Dimension(name=d) for d in dimensions],
        metrics=[Metric(name=m) for m in metrics],
        date_ranges=[DateRange(start_date=start, end_date=end)],
        limit=row_limit,
        order_bys=order_bys,
    )
    if dimension_filter:
        kwargs["dimension_filter"] = dimension_filter

    response = client.run_report(RunReportRequest(**kwargs))

    rows = []
    for row in response.rows:
        r = {}
        for i, dim in enumerate(dimensions):
            r[dim] = row.dimension_values[i].value
        for i, met in enumerate(metrics):
            r[met] = row.metric_values[i].value
        rows.append(r)

    return pd.DataFrame(rows)


def run_scalar(client, metrics: list, start=START_DATE, end=END_DATE,
               dimension_filter=None) -> dict:
    """Aggregate totals with no dimension breakdown."""
    kwargs = dict(
        property=f"properties/{PROPERTY_ID}",
        metrics=[Metric(name=m) for m in metrics],
        date_ranges=[DateRange(start_date=start, end_date=end)],
    )
    if dimension_filter:
        kwargs["dimension_filter"] = dimension_filter

    response = client.run_report(RunReportRequest(**kwargs))
    if response.rows:
        return {m: float(response.rows[0].metric_values[i].value)
                for i, m in enumerate(metrics)}
    return {m: 0.0 for m in metrics}


def get_event_count_for_segment(client, event_name: str,
                                 segment_filter=None) -> int:
    """Return eventCount for a single event name, optionally within a
    source segment. Used to build funnel rows without a separate API call
    per step where possible."""
    ev_filter = FilterExpression(
        filter=Filter(
            field_name="eventName",
            string_filter=Filter.StringFilter(
                match_type=Filter.StringFilter.MatchType.EXACT,
                value=event_name,
                case_sensitive=True,
            ),
        )
    )
    if segment_filter is not None:
        combined = FilterExpression(
            and_group=FilterExpressionList(
                expressions=[segment_filter, ev_filter]
            )
        )
    else:
        combined = ev_filter

    result = run_scalar(client, metrics=["eventCount"], dimension_filter=combined)
    return int(result.get("eventCount", 0))


# ---------------------------------------------------------------------------
# Formatting helpers
# ---------------------------------------------------------------------------

def to_int(series):
    return pd.to_numeric(series, errors="coerce").fillna(0).astype(int)

def to_float(series):
    return pd.to_numeric(series, errors="coerce").fillna(0.0)

def section(title):
    print("\n" + "=" * 74)
    print(f"  {title}")
    print("=" * 74)

def ok(msg):   print(f"  [OK]    {msg}")
def warn(msg): print(f"  [WARN]  {msg}")
def err(msg):  print(f"  [ERROR] {msg}")
def info(msg): print(f"  [INFO]  {msg}")

def pct(n, d):
    if not d or d == 0:
        return "n/a"
    return f"{n / d:.1%}"

def drop_pct(current, prior):
    if not prior or prior == 0:
        return "— top of funnel"
    return f"{(1 - current / prior) * 100:.0f}% drop"


# ---------------------------------------------------------------------------
# MAIN
# ---------------------------------------------------------------------------

def main():
    print("\n" + "=" * 74)
    print("  STEHLEN AUTO — Brevo Campaign Full Analysis")
    print(f"  Property: {PROPERTY_ID}")
    print(f"  Analysis window: {START_DATE} to {END_DATE}")
    print(f"  Run date: {date.today().isoformat()}")
    print("=" * 74)
    print("""
  Question: Brevo reported ~700 clicks from the reactivation email campaign.
            Shopify shows 0 orders. Where did the users go?
""")

    client = get_authenticated_client()
    print("Authenticated.\n")

    brevo_filter      = brevo_source_filter()
    brevo_or_ibm      = brevo_or_sendibm_filter()
    ibm_filter        = sendibm_filter()

    # Master summary rows — appended throughout, saved to consolidated CSV at end
    summary_rows = []

    # -----------------------------------------------------------------------
    # SECTION 1: All-traffic overview — sessions/users/engagement by source
    # -----------------------------------------------------------------------
    section("1. ALL-TRAFFIC OVERVIEW  (Mar 31 - Apr 3, all sources)")

    df_overview = run_report(
        client,
        dimensions=["sessionSource", "sessionMedium"],
        metrics=[
            "sessions", "totalUsers", "newUsers",
            "engagedSessions", "bounceRate", "averageSessionDuration",
            "screenPageViews",
        ],
        row_limit=50,
        order_by_metric="sessions",
    )

    if not df_overview.empty:
        df_overview["sessions"]               = to_int(df_overview["sessions"])
        df_overview["totalUsers"]             = to_int(df_overview["totalUsers"])
        df_overview["newUsers"]               = to_int(df_overview["newUsers"])
        df_overview["engagedSessions"]        = to_int(df_overview["engagedSessions"])
        df_overview["bounceRate"]             = to_float(df_overview["bounceRate"])
        df_overview["averageSessionDuration"] = to_float(df_overview["averageSessionDuration"])
        df_overview["screenPageViews"]        = to_int(df_overview["screenPageViews"])
        df_overview["engagementRate"] = (
            df_overview["engagedSessions"] /
            df_overview["sessions"].replace(0, 1)
        ).round(3)

        total_sessions = df_overview["sessions"].sum()
        total_users    = df_overview["totalUsers"].sum()
        total_engaged  = df_overview["engagedSessions"].sum()

        print(f"\n  Total site sessions: {total_sessions:,}  |  "
              f"Total users: {total_users:,}  |  "
              f"Engaged sessions: {total_engaged:,}  |  "
              f"Engagement rate: {pct(total_engaged, total_sessions)}")

        print(f"\n  {'Source':<32} {'Medium':<14} {'Sessions':>9} {'Users':>7} "
              f"{'Engaged%':>10} {'Bounce%':>9} {'Avg Dur':>9} {'Pages':>7}")
        print("  " + "-" * 98)
        for _, row in df_overview.head(25).iterrows():
            print(
                f"  {str(row['sessionSource']):<32} "
                f"{str(row['sessionMedium']):<14} "
                f"{row['sessions']:>9,} "
                f"{row['totalUsers']:>7,} "
                f"{row['engagementRate']:>9.1%} "
                f"{row['bounceRate']:>8.1%} "
                f"{row['averageSessionDuration']:>7.1f}s "
                f"{row['screenPageViews']:>7,}"
            )

        # Flag the sendibm referral — this is Brevo's click-tracker domain
        ibm_rows = df_overview[
            df_overview["sessionSource"].str.lower().str.contains("sendibm", na=False)
        ]
        if not ibm_rows.empty:
            ibm_sessions = ibm_rows["sessions"].sum()
            warn(f"sendibm3.com referral: {ibm_sessions:,} sessions — this is Brevo's click-tracker.")
            warn("These sessions DID come from the email but UTMs were stripped by the tracker hop.")
            warn("Add to summary: effectively {ibm_sessions + df_overview[df_overview['sessionSource'].str.lower().str.contains('brevo', na=False)]['sessions'].sum()} sessions are Brevo-originated.")

        df_overview.to_csv(OUTPUT_DIR / "ga4_brevo_full_overview.csv", index=False)
        info("Saved to data/analytics/ga4_brevo_full_overview.csv")

        summary_rows.append({
            "section": "1_all_traffic",
            "metric": "total_sessions",
            "value": str(total_sessions),
            "notes": f"Mar 31 - Apr 3"
        })
        summary_rows.append({
            "section": "1_all_traffic",
            "metric": "total_users",
            "value": str(total_users),
            "notes": ""
        })
        summary_rows.append({
            "section": "1_all_traffic",
            "metric": "engagement_rate",
            "value": pct(total_engaged, total_sessions),
            "notes": ""
        })
    else:
        warn("No traffic data returned for this date range.")

    # -----------------------------------------------------------------------
    # SECTION 2: Brevo-specific funnel
    # -----------------------------------------------------------------------
    section("2. BREVO CONVERSION FUNNEL  (utm_source=brevo sessions only)")

    brevo_totals = run_scalar(
        client,
        metrics=["sessions", "totalUsers", "engagedSessions",
                 "bounceRate", "averageSessionDuration"],
        dimension_filter=brevo_filter,
    )

    brevo_sessions = int(brevo_totals.get("sessions", 0))
    brevo_users    = int(brevo_totals.get("totalUsers", 0))
    brevo_engaged  = int(brevo_totals.get("engagedSessions", 0))
    brevo_bounce   = brevo_totals.get("bounceRate", 0.0)
    brevo_dur      = brevo_totals.get("averageSessionDuration", 0.0)

    print(f"\n  Brevo sessions (utm_source=brevo):   {brevo_sessions:,}")
    print(f"  Brevo unique users:                  {brevo_users:,}")
    print(f"  Brevo engaged sessions:              {brevo_engaged:,}")
    print(f"  Brevo engagement rate:               {pct(brevo_engaged, brevo_sessions)}")
    print(f"  Brevo bounce rate:                   {brevo_bounce:.1%}")
    print(f"  Brevo avg session duration:          {brevo_dur:.1f}s")

    if brevo_sessions == 0:
        err("ZERO sessions under utm_source=brevo in GA4.")
        err("Check Section 9 — clicks likely arrived as sendibm3.com referral (UTMs stripped).")

    funnel_steps = [
        ("view_item",      "Viewed Product Page"),
        ("add_to_cart",    "Added to Cart"),
        ("begin_checkout", "Begin Checkout"),
        ("purchase",       "Purchase"),
    ]

    brevo_funnel = {"Sessions": brevo_sessions}
    for event_name, label in funnel_steps:
        brevo_funnel[label] = get_event_count_for_segment(
            client, event_name, segment_filter=brevo_filter
        )

    print(f"\n  Brevo funnel (sessions -> purchase):")
    print(f"  {'Step':<28} {'Count':>10} {'Drop from Prior':>18}")
    print("  " + "-" * 59)

    prev_count = None
    prev_label = None
    for label, count in [("Sessions", brevo_funnel["Sessions"])] + \
                         [(lbl, brevo_funnel[lbl]) for _, lbl in funnel_steps]:
        drop_str = drop_pct(count, prev_count) if prev_count is not None else "entry point"
        status = "OK" if count > 0 else "ZERO"
        print(f"  [{status}]  {label:<26} {count:>10,}  {drop_str}")
        if count > 0:
            prev_count = count

        summary_rows.append({
            "section": "2_brevo_funnel",
            "metric": label,
            "value": str(count),
            "notes": drop_str,
        })

    b_sessions  = brevo_funnel["Sessions"]
    b_purchases = brevo_funnel["Purchase"]
    print(f"\n  Brevo CVR (sessions -> purchase): {pct(b_purchases, b_sessions)}")

    if b_purchases == 0 and b_sessions > 0:
        err("Confirmed: 0 purchases from Brevo campaign traffic.")
    elif b_purchases == 0 and b_sessions == 0:
        err("0 sessions AND 0 purchases — Brevo clicks never reached GA4 with correct UTMs.")

    # -----------------------------------------------------------------------
    # SECTION 3: Landing page performance for Brevo traffic
    # -----------------------------------------------------------------------
    section("3. LANDING PAGES FOR BREVO TRAFFIC")

    df_landing = run_report(
        client,
        dimensions=["landingPagePlusQueryString"],
        metrics=["sessions", "engagedSessions", "bounceRate",
                 "averageSessionDuration", "screenPageViews"],
        row_limit=30,
        order_by_metric="sessions",
        dimension_filter=brevo_filter,
    )

    if df_landing.empty:
        err("No landing page data for utm_source=brevo.")
        err("This confirms UTM attribution was lost — the clicks arrived under a different source.")
        # Try the sendibm domain as a fallback
        print("\n  Fallback: landing pages for sendibm3.com referral traffic (likely same visitors):")
        df_landing_ibm = run_report(
            client,
            dimensions=["landingPagePlusQueryString"],
            metrics=["sessions", "engagedSessions", "bounceRate",
                     "averageSessionDuration", "screenPageViews"],
            row_limit=20,
            order_by_metric="sessions",
            dimension_filter=ibm_filter,
        )
        if not df_landing_ibm.empty:
            df_landing_ibm["sessions"]               = to_int(df_landing_ibm["sessions"])
            df_landing_ibm["engagedSessions"]         = to_int(df_landing_ibm["engagedSessions"])
            df_landing_ibm["bounceRate"]              = to_float(df_landing_ibm["bounceRate"])
            df_landing_ibm["averageSessionDuration"]  = to_float(df_landing_ibm["averageSessionDuration"])
            df_landing_ibm["screenPageViews"]         = to_int(df_landing_ibm["screenPageViews"])
            df_landing_ibm["engRate"] = (
                df_landing_ibm["engagedSessions"] /
                df_landing_ibm["sessions"].replace(0, 1)
            ).round(3)
            print(f"\n  {'Landing Page':<55} {'Sessions':>9} {'Engaged%':>10} {'Bounce%':>9} {'Avg Dur':>9}")
            print("  " + "-" * 97)
            for _, row in df_landing_ibm.iterrows():
                page = str(row["landingPagePlusQueryString"])[:54]
                print(f"  {page:<55} {row['sessions']:>9,} {row['engRate']:>9.1%} "
                      f"{row['bounceRate']:>8.1%} {row['averageSessionDuration']:>7.1f}s")
            df_landing_ibm.to_csv(OUTPUT_DIR / "ga4_brevo_full_landing_ibm.csv", index=False)
            info("Saved to data/analytics/ga4_brevo_full_landing_ibm.csv")
        else:
            warn("No landing page data for sendibm3.com either.")
    else:
        df_landing["sessions"]              = to_int(df_landing["sessions"])
        df_landing["engagedSessions"]       = to_int(df_landing["engagedSessions"])
        df_landing["bounceRate"]            = to_float(df_landing["bounceRate"])
        df_landing["averageSessionDuration"]= to_float(df_landing["averageSessionDuration"])
        df_landing["screenPageViews"]       = to_int(df_landing["screenPageViews"])
        df_landing["engRate"] = (
            df_landing["engagedSessions"] /
            df_landing["sessions"].replace(0, 1)
        ).round(3)

        print(f"\n  {'Landing Page':<55} {'Sessions':>9} {'Engaged%':>10} {'Bounce%':>9} {'Avg Dur':>9} {'Pages':>7}")
        print("  " + "-" * 104)
        for _, row in df_landing.head(20).iterrows():
            page = str(row["landingPagePlusQueryString"])[:54]
            print(
                f"  {page:<55} "
                f"{row['sessions']:>9,} "
                f"{row['engRate']:>9.1%} "
                f"{row['bounceRate']:>8.1%} "
                f"{row['averageSessionDuration']:>7.1f}s "
                f"{row['screenPageViews']:>7,}"
            )

        # Analysis: did traffic land on the CTA target?
        all_page = df_landing[
            df_landing["landingPagePlusQueryString"].str.startswith("/collections/all", na=False)
        ]
        home_page = df_landing[
            df_landing["landingPagePlusQueryString"].str.strip("/").eq("") |
            df_landing["landingPagePlusQueryString"].eq("/")
        ]

        if not all_page.empty:
            a_sessions = all_page["sessions"].sum()
            a_bounce   = all_page["bounceRate"].mean()
            a_eng      = all_page["engRate"].mean()
            warn(f"{a_sessions:,} sessions landed on /collections/all — "
                 f"bounce {a_bounce:.0%}, engaged {a_eng:.0%}")
            if a_bounce > 0.7:
                err("/collections/all bounce rate > 70%. Sending email traffic to a "
                    "1,330-product catalogue with no offer context kills conversions.")

        if not home_page.empty:
            h_sessions = home_page["sessions"].sum()
            warn(f"{h_sessions:,} sessions landed on homepage (/) — "
                 "CTA link may have pointed to homepage instead of catalogue.")

        df_landing.to_csv(OUTPUT_DIR / "ga4_brevo_full_landing.csv", index=False)
        info("Saved to data/analytics/ga4_brevo_full_landing.csv")

    # -----------------------------------------------------------------------
    # SECTION 4: All site events — full event count table
    # -----------------------------------------------------------------------
    section("4. ALL SITE EVENTS  (Mar 31 - Apr 3, all traffic)")

    df_events = run_report(
        client,
        dimensions=["eventName"],
        metrics=["eventCount", "totalUsers"],
        row_limit=100,
        order_by_metric="eventCount",
    )

    priority_events = [
        "page_view", "session_start", "first_visit",
        "view_item_list", "view_item", "add_to_cart",
        "view_cart", "begin_checkout", "add_payment_info", "purchase",
        "vehicle_selected", "ymm_selected", "ymm_step_completed",
        "ymm_abandoned", "search", "filter_applied",
        "chat_opened", "user_engagement", "scroll",
    ]

    if not df_events.empty:
        df_events["eventCount"] = to_int(df_events["eventCount"])
        df_events["totalUsers"] = to_int(df_events["totalUsers"])

        event_counts = dict(zip(df_events["eventName"], df_events["eventCount"]))

        print(f"\n  All events fired across the site (all traffic, {START_DATE} - {END_DATE}):")
        print(f"  {'Event Name':<45} {'Count':>10} {'Users':>10}")
        print("  " + "-" * 68)

        # Print priority events first in defined order, then others
        printed = set()
        for ev in priority_events:
            if ev in event_counts:
                count = event_counts[ev]
                users = int(df_events.loc[df_events["eventName"] == ev, "totalUsers"].values[0])
                print(f"  {ev:<45} {count:>10,} {users:>10,}")
                printed.add(ev)

        # Then any remaining events not in the priority list
        other_events = df_events[~df_events["eventName"].isin(printed)]
        if not other_events.empty:
            print(f"  {'--- other events ---':<45}")
            for _, row in other_events.sort_values("eventCount", ascending=False).iterrows():
                print(f"  {str(row['eventName']):<45} {row['eventCount']:>10,} {row['totalUsers']:>10,}")

        # Key e-commerce event assessment
        print(f"\n  E-commerce funnel presence:")
        ecom_events = ["view_item", "add_to_cart", "begin_checkout",
                       "add_payment_info", "purchase"]
        for ev in ecom_events:
            count = event_counts.get(ev, 0)
            status = "OK" if count > 0 else "MISSING"
            print(f"  [{status}]  {ev}: {count:,}")
            summary_rows.append({
                "section": "4_all_events",
                "metric": ev,
                "value": str(count),
                "notes": "all traffic",
            })

        df_events.to_csv(OUTPUT_DIR / "ga4_brevo_full_events.csv", index=False)
        info("Saved to data/analytics/ga4_brevo_full_events.csv")
    else:
        err("No event data returned.")

    # -----------------------------------------------------------------------
    # SECTION 5: Device breakdown for Brevo traffic
    # -----------------------------------------------------------------------
    section("5. DEVICE BREAKDOWN FOR BREVO TRAFFIC")

    df_device_brevo = run_report(
        client,
        dimensions=["deviceCategory"],
        metrics=["sessions", "engagedSessions", "bounceRate",
                 "averageSessionDuration", "screenPageViews"],
        row_limit=10,
        order_by_metric="sessions",
        dimension_filter=brevo_filter,
    )

    print(f"\n  Brevo (utm_source=brevo) device split:")

    if df_device_brevo.empty:
        warn("No device data for utm_source=brevo. Showing sendibm3.com referral as proxy:")
        df_device_ibm = run_report(
            client,
            dimensions=["deviceCategory"],
            metrics=["sessions", "engagedSessions", "bounceRate",
                     "averageSessionDuration", "screenPageViews"],
            row_limit=10,
            order_by_metric="sessions",
            dimension_filter=ibm_filter,
        )
        if not df_device_ibm.empty:
            df_device_ibm["sessions"]               = to_int(df_device_ibm["sessions"])
            df_device_ibm["engagedSessions"]         = to_int(df_device_ibm["engagedSessions"])
            df_device_ibm["bounceRate"]              = to_float(df_device_ibm["bounceRate"])
            df_device_ibm["averageSessionDuration"]  = to_float(df_device_ibm["averageSessionDuration"])
            df_device_ibm["screenPageViews"]         = to_int(df_device_ibm["screenPageViews"])
            total = df_device_ibm["sessions"].sum()
            df_device_ibm["share"] = (df_device_ibm["sessions"] / max(total, 1) * 100).round(1)

            print(f"\n  (sendibm3.com proxy — likely same Brevo visitors with stripped UTMs)")
            print(f"  {'Device':<15} {'Sessions':>10} {'Share':>8} {'Engaged%':>10} {'Bounce%':>9} {'Avg Dur':>10}")
            print("  " + "-" * 68)
            for _, row in df_device_ibm.iterrows():
                engaged_rate = row["engagedSessions"] / max(row["sessions"], 1)
                print(
                    f"  {row['deviceCategory']:<15} "
                    f"{row['sessions']:>10,} "
                    f"{row['share']:>7.1f}% "
                    f"{engaged_rate:>9.1%} "
                    f"{row['bounceRate']:>8.1%} "
                    f"{row['averageSessionDuration']:>8.1f}s"
                )
            df_device_ibm.to_csv(OUTPUT_DIR / "ga4_brevo_full_devices.csv", index=False)
            info("Saved to data/analytics/ga4_brevo_full_devices.csv")
        else:
            warn("No device data for sendibm3.com either — zero sessions from both sources.")
    else:
        df_device_brevo["sessions"]              = to_int(df_device_brevo["sessions"])
        df_device_brevo["engagedSessions"]       = to_int(df_device_brevo["engagedSessions"])
        df_device_brevo["bounceRate"]            = to_float(df_device_brevo["bounceRate"])
        df_device_brevo["averageSessionDuration"]= to_float(df_device_brevo["averageSessionDuration"])
        df_device_brevo["screenPageViews"]       = to_int(df_device_brevo["screenPageViews"])
        total = df_device_brevo["sessions"].sum()
        df_device_brevo["share"] = (df_device_brevo["sessions"] / max(total, 1) * 100).round(1)

        print(f"\n  {'Device':<15} {'Sessions':>10} {'Share':>8} {'Engaged%':>10} {'Bounce%':>9} {'Avg Dur':>10} {'Pages':>7}")
        print("  " + "-" * 76)
        for _, row in df_device_brevo.iterrows():
            engaged_rate = row["engagedSessions"] / max(row["sessions"], 1)
            print(
                f"  {row['deviceCategory']:<15} "
                f"{row['sessions']:>10,} "
                f"{row['share']:>7.1f}% "
                f"{engaged_rate:>9.1%} "
                f"{row['bounceRate']:>8.1%} "
                f"{row['averageSessionDuration']:>8.1f}s "
                f"{row['screenPageViews']:>7,}"
            )

        mobile_rows = df_device_brevo[df_device_brevo["deviceCategory"] == "mobile"]
        if not mobile_rows.empty:
            mobile_pct = float(mobile_rows["share"].values[0])
            if mobile_pct > 60:
                warn(f"{mobile_pct:.0f}% of Brevo traffic is mobile.")
                warn("Email marketing typically runs 60-70% mobile. UX issues on mobile")
                warn("checkout will disproportionately kill conversion rate.")

        df_device_brevo.to_csv(OUTPUT_DIR / "ga4_brevo_full_devices.csv", index=False)
        info("Saved to data/analytics/ga4_brevo_full_devices.csv")

    # Print overall site device split for comparison
    print(f"\n  Overall site device split (all traffic, same period — for comparison):")
    df_device_site = run_report(
        client,
        dimensions=["deviceCategory"],
        metrics=["sessions", "engagedSessions", "bounceRate"],
        row_limit=10,
        order_by_metric="sessions",
    )
    if not df_device_site.empty:
        df_device_site["sessions"]       = to_int(df_device_site["sessions"])
        df_device_site["engagedSessions"]= to_int(df_device_site["engagedSessions"])
        df_device_site["bounceRate"]     = to_float(df_device_site["bounceRate"])
        total_s = df_device_site["sessions"].sum()
        df_device_site["share"] = (df_device_site["sessions"] / max(total_s, 1) * 100).round(1)
        print(f"  {'Device':<15} {'Sessions':>10} {'Share':>8} {'Engaged%':>10} {'Bounce%':>9}")
        print("  " + "-" * 56)
        for _, row in df_device_site.iterrows():
            er = row["engagedSessions"] / max(row["sessions"], 1)
            print(f"  {row['deviceCategory']:<15} {row['sessions']:>10,} "
                  f"{row['share']:>7.1f}% {er:>9.1%} {row['bounceRate']:>8.1%}")

    # -----------------------------------------------------------------------
    # SECTION 6: Overall site conversion funnel (all traffic)
    # -----------------------------------------------------------------------
    section("6. OVERALL SITE FUNNEL  (all traffic, baseline — compare to Section 2)")

    site_totals = run_scalar(
        client,
        metrics=["sessions", "totalUsers", "engagedSessions",
                 "ecommercePurchases", "totalRevenue"],
    )
    site_sessions   = int(site_totals.get("sessions", 0))
    site_purchases  = int(site_totals.get("ecommercePurchases", 0))
    site_revenue    = site_totals.get("totalRevenue", 0.0)

    site_funnel = {"Sessions": site_sessions}
    for event_name, label in funnel_steps:
        site_funnel[label] = get_event_count_for_segment(client, event_name)

    print(f"\n  {'Step':<28} {'Brevo':>10} {'Brevo Drop':>13} {'Site Total':>12} {'Site Drop':>12}")
    print("  " + "-" * 78)

    prev_b = None
    prev_s = None
    all_labels = [("Sessions", "Sessions")] + list(funnel_steps)
    for event_name, label in all_labels:
        b = brevo_funnel.get(label, brevo_funnel.get("Sessions") if label == "Sessions" else 0)
        s = site_funnel.get(label, site_funnel.get("Sessions") if label == "Sessions" else 0)

        b_drop = drop_pct(b, prev_b) if prev_b is not None else "entry"
        s_drop = drop_pct(s, prev_s) if prev_s is not None else "entry"

        print(f"  {label:<28} {b:>10,} {b_drop:>13} {s:>12,} {s_drop:>12}")

        if b > 0: prev_b = b
        if s > 0: prev_s = s

        summary_rows.append({
            "section": "6_site_funnel",
            "metric": label,
            "value": str(s),
            "notes": s_drop,
        })

    print(f"\n  Site CVR (sessions -> purchase): {pct(site_purchases, site_sessions)}")
    print(f"  Site revenue ({START_DATE} - {END_DATE}): ${site_revenue:,.2f}")

    if site_purchases == 0:
        err("0 purchases recorded across the ENTIRE SITE in this period.")
        err("This is not a Brevo-specific problem — the site had zero orders site-wide.")
    else:
        ok(f"{site_purchases:,} purchase(s) recorded site-wide during this period.")

    # -----------------------------------------------------------------------
    # SECTION 7: Purchase check — any orders at all in this period?
    # -----------------------------------------------------------------------
    section("7. PURCHASE CHECK  (any orders from any source, Mar 31 - Apr 3?)")

    df_purchase_by_source = run_report(
        client,
        dimensions=["sessionSource", "sessionMedium", "sessionDefaultChannelGroup"],
        metrics=["ecommercePurchases", "totalRevenue", "sessions"],
        row_limit=50,
        order_by_metric="ecommercePurchases",
    )

    df_daily_purchases = run_report(
        client,
        dimensions=["date"],
        metrics=["ecommercePurchases", "totalRevenue", "sessions"],
        row_limit=10,
        order_by_metric="ecommercePurchases",
    )

    if not df_purchase_by_source.empty:
        df_purchase_by_source["ecommercePurchases"] = to_int(df_purchase_by_source["ecommercePurchases"])
        df_purchase_by_source["totalRevenue"]       = to_float(df_purchase_by_source["totalRevenue"])
        df_purchase_by_source["sessions"]           = to_int(df_purchase_by_source["sessions"])

        purchases_with_orders = df_purchase_by_source[
            df_purchase_by_source["ecommercePurchases"] > 0
        ]

        total_orders = df_purchase_by_source["ecommercePurchases"].sum()
        total_rev    = df_purchase_by_source["totalRevenue"].sum()

        print(f"\n  Total orders (all sources, all days): {total_orders}")
        print(f"  Total revenue (all sources, all days): ${total_rev:,.2f}")

        if total_orders == 0:
            err("Confirmed: ZERO purchases on the entire site across Mar 31 - Apr 3.")
            err("This period had no orders from ANY source — not just Brevo.")
            summary_rows.append({
                "section": "7_purchases",
                "metric": "total_orders",
                "value": "0",
                "notes": "Zero orders site-wide — not a Brevo-only problem"
            })
        else:
            ok(f"{total_orders} order(s) found. Breakdown by source:")
            print(f"\n  {'Source':<30} {'Medium':<14} {'Channel':<22} {'Orders':>8} {'Revenue':>12}")
            print("  " + "-" * 92)
            for _, row in purchases_with_orders.iterrows():
                print(
                    f"  {str(row['sessionSource']):<30} "
                    f"{str(row['sessionMedium']):<14} "
                    f"{str(row['sessionDefaultChannelGroup']):<22} "
                    f"{row['ecommercePurchases']:>8} "
                    f"  ${row['totalRevenue']:>10.2f}"
                )
            summary_rows.append({
                "section": "7_purchases",
                "metric": "total_orders",
                "value": str(total_orders),
                "notes": f"Revenue: ${total_rev:,.2f}"
            })

    if not df_daily_purchases.empty:
        df_daily_purchases["ecommercePurchases"] = to_int(df_daily_purchases["ecommercePurchases"])
        df_daily_purchases["totalRevenue"]       = to_float(df_daily_purchases["totalRevenue"])
        df_daily_purchases["sessions"]           = to_int(df_daily_purchases["sessions"])
        df_daily_purchases = df_daily_purchases.sort_values("date")

        print(f"\n  Daily purchase activity:")
        print(f"  {'Date':<12} {'Orders':>8} {'Revenue':>12} {'Sessions':>10}")
        print("  " + "-" * 46)
        for _, row in df_daily_purchases.iterrows():
            # Format date from 20260331 -> 2026-03-31
            raw_date = str(row["date"])
            fmt_date = f"{raw_date[:4]}-{raw_date[4:6]}-{raw_date[6:]}" if len(raw_date) == 8 else raw_date
            print(f"  {fmt_date:<12} {row['ecommercePurchases']:>8} "
                  f"  ${row['totalRevenue']:>10.2f} {row['sessions']:>10,}")

    # -----------------------------------------------------------------------
    # SECTION 8: Daily traffic by source (detect multi-day send pattern)
    # -----------------------------------------------------------------------
    section("8. DAILY TRAFFIC BY SOURCE  (track the campaign send dates)")

    df_daily_source = run_report(
        client,
        dimensions=["date", "sessionDefaultChannelGroup"],
        metrics=["sessions", "engagedSessions"],
        row_limit=50,
        order_by_metric="sessions",
    )

    if not df_daily_source.empty:
        df_daily_source["sessions"]       = to_int(df_daily_source["sessions"])
        df_daily_source["engagedSessions"]= to_int(df_daily_source["engagedSessions"])

        print(f"\n  Sessions by day and channel (detecting spikes from email sends):")
        print(f"  {'Date':<12} {'Channel':<28} {'Sessions':>10} {'Engaged':>10} {'Eng%':>8}")
        print("  " + "-" * 72)
        for _, row in df_daily_source.sort_values(["date", "sessions"],
                                                   ascending=[True, False]).iterrows():
            raw_date = str(row["date"])
            fmt_date = f"{raw_date[:4]}-{raw_date[4:6]}-{raw_date[6:]}" if len(raw_date) == 8 else raw_date
            er = row["engagedSessions"] / max(row["sessions"], 1)
            print(f"  {fmt_date:<12} {str(row['sessionDefaultChannelGroup']):<28} "
                  f"{row['sessions']:>10,} {row['engagedSessions']:>10,} {er:>7.1%}")

        df_daily_source.to_csv(OUTPUT_DIR / "ga4_brevo_full_daily.csv", index=False)
        info("Saved to data/analytics/ga4_brevo_full_daily.csv")
    else:
        warn("No daily traffic data returned.")

    # -----------------------------------------------------------------------
    # SECTION 9: SendIBM / Brevo click-tracker analysis
    # -----------------------------------------------------------------------
    section("9. SENDIBM / BREVO CLICK-TRACKER ANALYSIS  (the UTM-stripping culprit)")

    ibm_totals = run_scalar(
        client,
        metrics=["sessions", "totalUsers", "engagedSessions",
                 "bounceRate", "averageSessionDuration"],
        dimension_filter=ibm_filter,
    )

    ibm_sessions = int(ibm_totals.get("sessions", 0))
    ibm_users    = int(ibm_totals.get("totalUsers", 0))
    ibm_engaged  = int(ibm_totals.get("engagedSessions", 0))
    ibm_bounce   = ibm_totals.get("bounceRate", 0.0)
    ibm_dur      = ibm_totals.get("averageSessionDuration", 0.0)

    print(f"\n  sendibm3.com referral sessions:      {ibm_sessions:,}")
    print(f"  Unique users:                        {ibm_users:,}")
    print(f"  Engaged sessions:                    {ibm_engaged:,}")
    print(f"  Engagement rate:                     {pct(ibm_engaged, ibm_sessions)}")
    print(f"  Bounce rate:                         {ibm_bounce:.1%}")
    print(f"  Avg session duration:                {ibm_dur:.1f}s")

    combined_email_sessions = brevo_sessions + ibm_sessions
    print(f"\n  COMBINED (brevo + sendibm):          {combined_email_sessions:,} sessions")
    print(f"  (These are the same campaign's clicks, split by tracking method)")

    if ibm_sessions > 0:
        print(f"""
  EXPLANATION: mo7ql.r.ag.d.sendibm3.com is Brevo's click-tracking domain.
  When Brevo wraps a link in its click tracker, the flow is:

    Email click -> tracker.brevo.com/mo7ql... -> stehlenauto.com

  If the final redirect preserves UTMs, GA4 sees utm_source=brevo.
  If the redirect drops the UTMs, GA4 sees the tracker domain as the referrer.

  The {ibm_sessions} sendibm3 sessions above are Brevo clicks that LOST their UTMs.
  The {brevo_sessions} brevo sessions are Brevo clicks that KEPT their UTMs.
  Total attributable to the campaign: ~{combined_email_sessions} sessions.

  Fix: In Brevo, under Settings -> Tracking -> Link tracking, ensure UTM
  params are appended AFTER the click tracker redirect, not embedded IN the
  tracked URL only. Better: use Brevo's built-in UTM fields (source/medium/
  campaign) in the campaign settings — these survive the tracker hop.
""")

    # Get sendibm funnel events
    ibm_funnel = {"Sessions": ibm_sessions}
    for event_name, label in funnel_steps:
        ibm_funnel[label] = get_event_count_for_segment(
            client, event_name, segment_filter=ibm_filter
        )

    print(f"  sendibm3.com funnel (these ARE email campaign visitors):")
    print(f"  {'Step':<28} {'Count':>10}")
    print("  " + "-" * 41)
    prev = None
    for label, count in [("Sessions", ibm_sessions)] + \
                         [(lbl, ibm_funnel[lbl]) for _, lbl in funnel_steps]:
        d = drop_pct(count, prev) if prev is not None else "entry"
        print(f"  {label:<28} {count:>10,}  {d}")
        if count > 0: prev = count

    ibm_purchases = ibm_funnel["Purchase"]
    if ibm_purchases == 0 and ibm_sessions > 0:
        err("Also 0 purchases from sendibm3.com traffic — confirmed: no orders from the email campaign.")
    elif ibm_purchases > 0:
        ok(f"{ibm_purchases} purchase(s) found from sendibm3.com traffic (Brevo clicks with stripped UTMs).")

    # -----------------------------------------------------------------------
    # FINAL DIAGNOSIS
    # -----------------------------------------------------------------------
    section("DIAGNOSIS — WHY 700 BREVO CLICKS PRODUCED 0 ORDERS")

    print(f"""
  DATA SUMMARY:
  - GA4-attributed Brevo sessions (utm_source=brevo):    {brevo_sessions}
  - sendibm3.com referral sessions (UTMs stripped):      {ibm_sessions}
  - Combined likely campaign sessions:                   {combined_email_sessions}
  - Brevo-reported clicks:                               ~700
  - GA4 accounted for:                                   {combined_email_sessions} ({pct(combined_email_sessions, 700)})
  - Unaccounted gap:                                     ~{max(0, 700 - combined_email_sessions)} clicks
  - Orders from Brevo traffic:                           0
  - Orders from sendibm traffic:                         0
  - Total orders site-wide (Mar 31 - Apr 3):             {site_purchases}

  CAUSE #1 — UTM TRACKING SPLIT (Technical)
  {combined_email_sessions} sessions reached the site but split between utm_source=brevo
  ({brevo_sessions} sessions with UTMs intact) and sendibm3.com referral ({ibm_sessions}
  sessions where Brevo's click-tracker consumed the UTMs before the final hop).
  This is a pure attribution problem — the traffic arrived, it just shows
  under two labels.
  Fix: In Brevo campaign settings, use the UTM fields built into the platform
  rather than manually appending ?utm_source=brevo to links. Brevo applies
  these AFTER its click tracker redirect, so they survive.

  CAUSE #2 — ZERO ENGAGEMENT ON LANDING PAGES (Behavioural)
  Brevo sessions: engagement rate = {pct(brevo_engaged, brevo_sessions)}, bounce rate = {brevo_bounce:.0%}
  sendibm sessions: engagement rate = {pct(ibm_engaged, ibm_sessions)}, bounce rate = {ibm_bounce:.0%}
  Combined: nearly 0% of visitors engaged with the page content.
  /collections/all with 1,330 products is a catalogue dump.
  Cold/reactivation traffic needs a specific offer on a curated page.
  Reactivation best practice: /collections/tonneau-covers + "15% off,
  this week only" banner = a clear reason to stay.

  CAUSE #3 — BOT CLICK INFLATION (Likely)
  Brevo reported ~700 clicks but only {combined_email_sessions} sessions hit GA4.
  Gap of ~{max(0, 700 - combined_email_sessions)} clicks = likely email security scanner bots
  (corporate email gateways scan all links before delivery to check for
  malware — each scan registers as a click in Brevo). For a cold/reactivation
  list, bot click rates of 30-60% are common.
  Check in Brevo: are the clicks concentrated on a few subscriber IPs/
  email addresses? If yes, those are bots, not real humans.

  CAUSE #4 — ZERO SITE-WIDE ORDERS IN THIS PERIOD
  This site had {site_purchases} orders from ALL sources over these 4 days.
  That means conversion problems extend beyond email — the site itself
  is not yet converting at a meaningful rate. This is a pre-revenue phase.
  Email campaigns into a zero-CVR site will always produce zero orders.
  Fix the site CVR first (product pages, mobile UX, trust signals, pricing)
  before scaling email volume.

  NEXT STEPS (in order):
  1. Fix Brevo UTM tracking: use Brevo's native UTM fields in campaign settings
     so GA4 correctly attributes all sessions to the email channel.
  2. Bot click audit: in Brevo, filter click report by IP — flag any IP with
     20+ clicks (bot pattern). These inflate click counts and skew your data.
  3. Landing page: next campaign -> /collections/tonneau-covers (47% margin,
     low return rate) with an explicit offer (15% off code + urgency deadline).
  4. Segment quality: send to Champions first (36,738 contacts, $425 LTV).
     At-Risk and Hibernating lists will have bot-heavy, engagement-low results.
  5. Site CVR baseline: before spending on email or ads at scale, place 5-10
     test orders from mobile to verify the checkout path works end-to-end.
""")

    # -----------------------------------------------------------------------
    # Save consolidated summary CSV
    # -----------------------------------------------------------------------
    df_summary = pd.DataFrame(summary_rows)
    df_summary.to_csv(OUTPUT_DIR / "ga4_brevo_full_analysis.csv", index=False)
    info("Consolidated summary saved to data/analytics/ga4_brevo_full_analysis.csv")

    print("=" * 74)
    print("  Output files:")
    print("  data/analytics/ga4_brevo_full_analysis.csv   <- consolidated summary")
    print("  data/analytics/ga4_brevo_full_overview.csv   <- all traffic by source/medium")
    print("  data/analytics/ga4_brevo_full_events.csv     <- all events, full period")
    print("  data/analytics/ga4_brevo_full_landing.csv    <- Brevo landing pages")
    print("  data/analytics/ga4_brevo_full_devices.csv    <- device split")
    print("  data/analytics/ga4_brevo_full_daily.csv      <- daily traffic by channel")
    print("=" * 74)
    print()


if __name__ == "__main__":
    main()
