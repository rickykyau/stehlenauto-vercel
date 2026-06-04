"""
GA4 Brevo Campaign Analysis — Stehlen Auto
============================================
Diagnoses why the Brevo reactivation email (sent April 3, 2026) drove
~700 clicks but 0 orders.

Analysis:
  1. Brevo traffic volume: sessions and users from utm_source=brevo
  2. Funnel breakdown for Brevo segment vs. overall site
  3. Landing pages hit by Brevo traffic
  4. Device breakdown for Brevo sessions
  5. Engagement rate (% of sessions with >10s or >1 page)
  6. Overall site CVR vs Brevo CVR side-by-side

Auth: OAuth desktop app flow (same as other analytics scripts).
      Reads cached token.json — opens browser if token is expired.

Run:
  source venv/bin/activate
  python marketing/analytics/ga4_brevo_campaign_analysis.py
"""

import os
import sys
import pandas as pd
from datetime import date, timedelta
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

PROPERTY_ID = os.getenv("GA4_PROPERTY_ID", "529120634")
OAUTH_CREDS_FILE = os.getenv("GA4_OAUTH_CREDENTIALS", "./oauth-credentials.json")
TOKEN_FILE = "./token.json"
SCOPES = ["https://www.googleapis.com/auth/analytics.readonly"]

# April 3 campaign + 1 day buffer for delayed conversions
START_DATE = "2026-04-03"
END_DATE   = "2026-04-04"

OUTPUT_DIR = Path("data/analytics")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


# ---------------------------------------------------------------------------
# Auth — identical pattern to ga4_traffic_analysis.py
# ---------------------------------------------------------------------------

def get_authenticated_client() -> BetaAnalyticsDataClient:
    creds = None
    if os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            print("Refreshing expired token...")
            creds.refresh(Request())
        else:
            if not os.path.exists(OAUTH_CREDS_FILE):
                raise SystemExit(
                    f"\nOAuth credentials file not found: {OAUTH_CREDS_FILE}\n"
                    f"Download from Google Cloud Console > APIs & Services > Credentials\n"
                )
            print("Opening browser for Google sign-in (one-time)...")
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
    """
    Match sessions where sessionSource contains 'brevo' (case-insensitive).
    GA4 Data API uses PARTIAL_REGEXP for flexible matching — covers:
      - utm_source=brevo (exact)
      - utm_source=Brevo (capitalised — Brevo's own default)
      - utm_source=brevo.com (if user misconfigured)
    """
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


def brevo_medium_or_source_filter() -> FilterExpression:
    """
    Broader filter: sessionSource contains 'brevo' OR sessionMedium = 'email'.
    Used as a fallback check — if Brevo UTMs were missing, email medium alone
    still catches Brevo-sent sessions that arrived via any email client link.
    """
    return FilterExpression(
        or_group=FilterExpressionList(
            expressions=[
                FilterExpression(
                    filter=Filter(
                        field_name="sessionSource",
                        string_filter=Filter.StringFilter(
                            match_type=Filter.StringFilter.MatchType.CONTAINS,
                            value="brevo",
                            case_sensitive=False,
                        ),
                    )
                ),
                FilterExpression(
                    filter=Filter(
                        field_name="sessionMedium",
                        string_filter=Filter.StringFilter(
                            match_type=Filter.StringFilter.MatchType.EXACT,
                            value="email",
                            case_sensitive=False,
                        ),
                    )
                ),
            ]
        )
    )


# ---------------------------------------------------------------------------
# Core report runner
# ---------------------------------------------------------------------------

def run_report(
    client,
    dimensions: list[str],
    metrics: list[str],
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


def run_scalar(client, metrics: list[str], start=START_DATE, end=END_DATE,
               dimension_filter=None) -> dict:
    """Return aggregate totals with no dimension breakdown."""
    kwargs = dict(
        property=f"properties/{PROPERTY_ID}",
        metrics=[Metric(name=m) for m in metrics],
        date_ranges=[DateRange(start_date=start, end_date=end)],
    )
    if dimension_filter:
        kwargs["dimension_filter"] = dimension_filter

    response = client.run_report(RunReportRequest(**kwargs))
    result = {}
    if response.rows:
        for i, m in enumerate(metrics):
            result[m] = float(response.rows[0].metric_values[i].value)
    else:
        result = {m: 0.0 for m in metrics}
    return result


# ---------------------------------------------------------------------------
# Formatting helpers
# ---------------------------------------------------------------------------

def to_int(series):
    return pd.to_numeric(series, errors="coerce").fillna(0).astype(int)

def to_float(series):
    return pd.to_numeric(series, errors="coerce").fillna(0.0)

def section(title):
    print("\n" + "=" * 72)
    print(f"  {title}")
    print("=" * 72)

def ok(msg):   print(f"  [OK]    {msg}")
def warn(msg): print(f"  [WARN]  {msg}")
def err(msg):  print(f"  [ERROR] {msg}")
def info(msg): print(f"  [INFO]  {msg}")

def pct(n, d):
    if d == 0:
        return "n/a"
    return f"{n / d:.1%}"


# ---------------------------------------------------------------------------
# MAIN
# ---------------------------------------------------------------------------

def main():
    print("\n" + "=" * 72)
    print("  STEHLEN AUTO — Brevo Campaign Post-Mortem")
    print(f"  Property: {PROPERTY_ID}  |  Window: {START_DATE} to {END_DATE}")
    print(f"  Run date: {date.today().isoformat()}")
    print("=" * 72)
    print("""
  Campaign: Brevo reactivation email, sent April 3 2026
  Claim:    ~700 clicks from Brevo dashboard
  Problem:  0 orders recorded in Shopify / GA4

  This script will pinpoint where users dropped off.
""")

    client = get_authenticated_client()
    print("Authenticated.\n")

    brevo_filter = brevo_source_filter()
    email_fallback_filter = brevo_medium_or_source_filter()

    # -----------------------------------------------------------------------
    # SECTION 1: How much Brevo traffic actually hit GA4?
    # -----------------------------------------------------------------------
    section("1. BREVO TRAFFIC VOLUME  (did GA4 even see these sessions?)")

    brevo_totals = run_scalar(
        client,
        metrics=["sessions", "totalUsers", "newUsers", "engagedSessions",
                 "bounceRate", "averageSessionDuration"],
        dimension_filter=brevo_filter,
    )

    site_totals = run_scalar(
        client,
        metrics=["sessions", "totalUsers", "newUsers", "engagedSessions",
                 "bounceRate", "averageSessionDuration"],
    )

    brevo_sessions = int(brevo_totals.get("sessions", 0))
    brevo_users    = int(brevo_totals.get("totalUsers", 0))
    brevo_engaged  = int(brevo_totals.get("engagedSessions", 0))
    brevo_bounce   = brevo_totals.get("bounceRate", 0.0)
    brevo_avg_dur  = brevo_totals.get("averageSessionDuration", 0.0)

    site_sessions  = int(site_totals.get("sessions", 0))

    print(f"\n  Brevo sessions in GA4:        {brevo_sessions:>8,}")
    print(f"  Brevo unique users:           {brevo_users:>8,}")
    print(f"  Brevo engaged sessions:       {brevo_engaged:>8,}")
    print(f"  Brevo engagement rate:        {pct(brevo_engaged, brevo_sessions):>8}")
    print(f"  Brevo bounce rate:            {brevo_bounce:>8.1%}")
    print(f"  Brevo avg session duration:   {brevo_avg_dur:>8.1f}s")
    print(f"\n  Total site sessions (Apr 3-4):{site_sessions:>8,}")
    print(f"  Brevo share of total traffic: {pct(brevo_sessions, site_sessions):>8}")

    if brevo_sessions == 0:
        err("GA4 recorded ZERO sessions from utm_source=brevo.")
        err("Possible causes:")
        err("  a) Brevo UTM links used utm_source=Brevo (capital B) — check raw links")
        err("  b) UTM parameters were stripped by the email client or a redirect chain")
        err("  c) Brevo's click tracking URL (tracker.brevo.com) absorbed the UTMs")
        err("     before passing through — check what URL GA4 actually sees as source")
        print()
        # Fall back: check if email medium traffic showed up at all
        print("  Falling back: checking sessionMedium=email traffic...")
        email_totals = run_scalar(
            client,
            metrics=["sessions", "totalUsers", "engagedSessions", "bounceRate"],
            dimension_filter=email_fallback_filter,
        )
        email_sessions = int(email_totals.get("sessions", 0))
        email_engaged  = int(email_totals.get("engagedSessions", 0))

        if email_sessions > 0:
            warn(f"Found {email_sessions:,} sessions with sessionMedium=email (all sources combined).")
            warn("These may be the Brevo clicks arriving without 'brevo' in utm_source.")
            warn("Check utm_source dimension below for what source they show under.")
        else:
            err("Zero email medium sessions either. Either the traffic never reached the site,")
            err("or ALL UTM parameters were stripped (sessions land as Direct/None).")

        # Check for direct traffic spike on April 3 that might be the "lost" Brevo clicks
        print()
        print("  Checking for Direct traffic spike on April 3 (UTM strip scenario)...")
        df_daily_direct = run_report(
            client,
            dimensions=["date", "sessionDefaultChannelGroup"],
            metrics=["sessions"],
            row_limit=20,
            order_by_metric="sessions",
        )
        if not df_daily_direct.empty:
            df_daily_direct["sessions"] = to_int(df_daily_direct["sessions"])
            direct_apr3 = df_daily_direct[
                (df_daily_direct["date"] == "20260403") &
                (df_daily_direct["sessionDefaultChannelGroup"] == "Direct")
            ]
            if not direct_apr3.empty:
                direct_count = direct_apr3["sessions"].sum()
                warn(f"Direct traffic on April 3: {direct_count:,} sessions — "
                     f"if this is anomalously high, Brevo UTMs may have been stripped.")
    elif brevo_sessions < 100:
        warn(f"Only {brevo_sessions} Brevo sessions in GA4, but Brevo reported ~700 clicks.")
        warn("Big gap between click count and GA4 sessions usually means:")
        warn("  a) Brevo's own click tracker opened the link but GA4 didn't fire (JS issue)")
        warn("  b) Landing page loaded but blocked by ad blocker / cookie consent")
        warn("  c) Redirect chain from Brevo -> intermediate page -> stehlenauto.com lost UTMs")
    else:
        ok(f"{brevo_sessions:,} Brevo sessions reached GA4.")

    # -----------------------------------------------------------------------
    # SECTION 2: Source/medium breakdown — what label are these sessions under?
    # -----------------------------------------------------------------------
    section("2. SOURCE / MEDIUM BREAKDOWN  (exact UTM values in GA4)")

    df_source_med = run_report(
        client,
        dimensions=["sessionSource", "sessionMedium", "sessionCampaignName"],
        metrics=["sessions", "engagedSessions", "totalRevenue"],
        row_limit=50,
        order_by_metric="sessions",
    )

    if not df_source_med.empty:
        df_source_med["sessions"] = to_int(df_source_med["sessions"])
        df_source_med["engagedSessions"] = to_int(df_source_med["engagedSessions"])
        df_source_med["totalRevenue"] = to_float(df_source_med["totalRevenue"])

        # Flag any email-adjacent sources
        email_keywords = ["brevo", "email", "newsletter", "klaviyo", "mailchimp",
                          "sendinblue", "campaign"]
        email_rows = df_source_med[
            df_source_med["sessionSource"].str.lower().str.contains(
                "|".join(email_keywords), na=False
            ) |
            df_source_med["sessionMedium"].str.lower().str.contains(
                "|".join(email_keywords), na=False
            ) |
            df_source_med["sessionCampaignName"].str.lower().str.contains(
                "|".join(email_keywords), na=False
            )
        ]

        print(f"\n  All sources/mediums for Apr 3-4:")
        print(f"  {'Source':<28} {'Medium':<16} {'Campaign':<25} {'Sessions':>9} {'Engaged':>8} {'Revenue':>10}")
        print("  " + "-" * 100)
        for _, row in df_source_med.head(30).iterrows():
            campaign_label = str(row["sessionCampaignName"])[:24]
            print(
                f"  {str(row['sessionSource']):<28} "
                f"{str(row['sessionMedium']):<16} "
                f"{campaign_label:<25} "
                f"{row['sessions']:>9,} "
                f"{row['engagedSessions']:>8,} "
                f"${row['totalRevenue']:>8.2f}"
            )

        if not email_rows.empty:
            print(f"\n  Email-related rows flagged above:")
            for _, row in email_rows.iterrows():
                print(f"  -> source={row['sessionSource']} / medium={row['sessionMedium']} "
                      f"/ campaign={row['sessionCampaignName']} "
                      f"({row['sessions']} sessions)")
        else:
            warn("No email-adjacent sources found. If Brevo clicks arrived without UTMs,")
            warn("they are buried in 'direct / (none)' and indistinguishable.")

        df_source_med.to_csv(OUTPUT_DIR / "ga4_brevo_source_medium.csv", index=False)
        info("Saved to data/analytics/ga4_brevo_source_medium.csv")
    else:
        warn("No source/medium data returned for the date range.")

    # -----------------------------------------------------------------------
    # SECTION 3: Funnel — Brevo segment vs overall site
    # -----------------------------------------------------------------------
    section("3. CONVERSION FUNNEL COMPARISON  (Brevo vs Overall Site)")

    funnel_events = [
        ("sessions",         "Sessions (entry)",     True),   # True = use sessions metric
        ("view_item",        "Viewed Product",        False),
        ("add_to_cart",      "Add to Cart",           False),
        ("begin_checkout",   "Begin Checkout",        False),
        ("purchase",         "Purchase",              False),
    ]

    def get_event_count(client, event_name, dim_filter=None):
        """Return the event count for a single event name."""
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
        # If we also have a source filter, AND them together
        if dim_filter is not None:
            combined = FilterExpression(
                and_group=FilterExpressionList(
                    expressions=[dim_filter, ev_filter]
                )
            )
        else:
            combined = ev_filter

        result = run_scalar(
            client,
            metrics=["eventCount"],
            dimension_filter=combined,
        )
        return int(result.get("eventCount", 0))

    # Brevo funnel — sessions from scalar, events from event filter
    brevo_funnel = {
        "Sessions (entry)": brevo_sessions,
    }
    site_funnel = {
        "Sessions (entry)": site_sessions,
    }

    for event_name, label, is_session in funnel_events:
        if is_session:
            continue  # already fetched
        brevo_funnel[label] = get_event_count(client, event_name, dim_filter=brevo_filter)
        site_funnel[label]  = get_event_count(client, event_name, dim_filter=None)

    print(f"\n  {'Funnel Step':<25} {'Brevo':>10} {'Brevo Drop':>12} {'Site Total':>12} {'Site Drop':>12}")
    print("  " + "-" * 74)

    prev_brevo = None
    prev_site  = None
    for event_name, label, _ in funnel_events:
        b = brevo_funnel.get(label, 0)
        s = site_funnel.get(label, 0)

        b_drop = f"{(1 - b/prev_brevo)*100:.0f}% drop" if prev_brevo and prev_brevo > 0 else "top of funnel"
        s_drop = f"{(1 - s/prev_site)*100:.0f}% drop"  if prev_site  and prev_site  > 0 else "top of funnel"

        print(f"  {label:<25} {b:>10,} {b_drop:>12} {s:>12,} {s_drop:>12}")

        if b > 0:
            prev_brevo = b
        if s > 0:
            prev_site = s

    # CVR summary
    b_sessions = brevo_funnel.get("Sessions (entry)", 0)
    b_purchases = brevo_funnel.get("Purchase", 0)
    s_purchases = site_funnel.get("Purchase", 0)

    print(f"\n  Brevo CVR (sessions -> purchase):    {pct(b_purchases, b_sessions)}")
    print(f"  Overall site CVR (sessions -> purchase): {pct(s_purchases, site_sessions)}")

    if b_purchases == 0 and b_sessions > 0:
        err("Brevo CVR = 0% — confirmed zero orders from this campaign.")
    elif b_purchases == 0 and b_sessions == 0:
        err("Both sessions and purchases = 0 for Brevo source.")
        err("The drop-off happened before GA4 fired at all.")

    # -----------------------------------------------------------------------
    # SECTION 4: Landing pages for Brevo traffic
    # -----------------------------------------------------------------------
    section("4. LANDING PAGES  (where did Brevo traffic actually land?)")

    df_landing = run_report(
        client,
        dimensions=["landingPagePlusQueryString"],
        metrics=["sessions", "engagedSessions", "bounceRate"],
        row_limit=30,
        order_by_metric="sessions",
        dimension_filter=brevo_filter,
    )

    if df_landing.empty:
        err("No landing page data for Brevo traffic.")
        err("This confirms GA4 never tracked these sessions under utm_source=brevo.")
    else:
        df_landing["sessions"] = to_int(df_landing["sessions"])
        df_landing["engagedSessions"] = to_int(df_landing["engagedSessions"])
        df_landing["bounceRate"] = to_float(df_landing["bounceRate"])
        df_landing["engRate"] = df_landing["engagedSessions"] / df_landing["sessions"].replace(0, 1)

        print(f"\n  {'Landing Page':<55} {'Sessions':>9} {'Engaged':>8} {'Bounce%':>9} {'Eng%':>7}")
        print("  " + "-" * 92)
        for _, row in df_landing.head(20).iterrows():
            page = str(row["landingPagePlusQueryString"])[:54]
            print(
                f"  {page:<55} "
                f"{row['sessions']:>9,} "
                f"{row['engagedSessions']:>8,} "
                f"{row['bounceRate']:>8.1%} "
                f"{row['engRate']:>7.1%}"
            )

        # Flag if traffic landed on wrong page
        total_landing_sessions = df_landing["sessions"].sum()
        collections_all = df_landing[
            df_landing["landingPagePlusQueryString"].str.startswith("/collections/all", na=False)
        ]
        if not collections_all.empty:
            c_count = collections_all["sessions"].sum()
            ok(f"{c_count} sessions landed on /collections/all (the CTA target)")
        else:
            warn("/collections/all not in top landing pages — CTA link may have been wrong,")
            warn("or traffic landed on homepage/other pages and bounced before browsing.")

        df_landing.to_csv(OUTPUT_DIR / "ga4_brevo_landing_pages.csv", index=False)
        info("Saved to data/analytics/ga4_brevo_landing_pages.csv")

    # -----------------------------------------------------------------------
    # SECTION 5: Device breakdown for Brevo traffic
    # -----------------------------------------------------------------------
    section("5. DEVICE BREAKDOWN  (mobile vs desktop for Brevo sessions)")

    df_device = run_report(
        client,
        dimensions=["deviceCategory"],
        metrics=["sessions", "engagedSessions", "conversions", "bounceRate",
                 "averageSessionDuration"],
        row_limit=10,
        order_by_metric="sessions",
        dimension_filter=brevo_filter,
    )

    if df_device.empty:
        warn("No device data for Brevo traffic (likely same root cause as zero sessions).")
        # Fall back to overall device split for reference
        print("\n  Overall site device breakdown for Apr 3-4 (for reference):")
        df_device_site = run_report(
            client,
            dimensions=["deviceCategory"],
            metrics=["sessions", "engagedSessions", "conversions", "bounceRate"],
            row_limit=10,
            order_by_metric="sessions",
        )
        if not df_device_site.empty:
            df_device_site["sessions"] = to_int(df_device_site["sessions"])
            df_device_site["engagedSessions"] = to_int(df_device_site["engagedSessions"])
            df_device_site["conversions"] = to_int(df_device_site["conversions"])
            df_device_site["bounceRate"] = to_float(df_device_site["bounceRate"])
            total = df_device_site["sessions"].sum()
            df_device_site["share"] = (df_device_site["sessions"] / max(total, 1) * 100).round(1)
            print(f"\n  {'Device':<15} {'Sessions':>10} {'Share':>8} {'Engaged':>9} {'Conversions':>13} {'Bounce%':>9}")
            print("  " + "-" * 67)
            for _, row in df_device_site.iterrows():
                print(
                    f"  {row['deviceCategory']:<15} "
                    f"{row['sessions']:>10,} "
                    f"{row['share']:>7.1f}% "
                    f"{row['engagedSessions']:>9,} "
                    f"{row['conversions']:>13,} "
                    f"{row['bounceRate']:>8.1%}"
                )
    else:
        df_device["sessions"] = to_int(df_device["sessions"])
        df_device["engagedSessions"] = to_int(df_device["engagedSessions"])
        df_device["conversions"] = to_int(df_device["conversions"])
        df_device["bounceRate"] = to_float(df_device["bounceRate"])
        df_device["averageSessionDuration"] = to_float(df_device["averageSessionDuration"])
        total = df_device["sessions"].sum()
        df_device["share"] = (df_device["sessions"] / max(total, 1) * 100).round(1)

        print(f"\n  {'Device':<15} {'Sessions':>10} {'Share':>8} {'Engaged':>9} {'Conversions':>13} {'Bounce%':>9} {'Avg Dur (s)':>13}")
        print("  " + "-" * 82)
        for _, row in df_device.iterrows():
            print(
                f"  {row['deviceCategory']:<15} "
                f"{row['sessions']:>10,} "
                f"{row['share']:>7.1f}% "
                f"{row['engagedSessions']:>9,} "
                f"{row['conversions']:>13,} "
                f"{row['bounceRate']:>8.1%} "
                f"{row['averageSessionDuration']:>13.1f}"
            )

        mobile_rows = df_device[df_device["deviceCategory"] == "mobile"]
        desktop_rows = df_device[df_device["deviceCategory"] == "desktop"]
        if not mobile_rows.empty:
            mobile_pct = mobile_rows["share"].values[0]
            if mobile_pct > 60:
                warn(f"{mobile_pct:.0f}% of Brevo traffic is mobile.")
                warn("Email marketing skews heavily mobile. If the site has checkout friction on")
                warn("mobile (slow load, small tap targets, poor form UX) that will kill CVR.")

        df_device.to_csv(OUTPUT_DIR / "ga4_brevo_devices.csv", index=False)
        info("Saved to data/analytics/ga4_brevo_devices.csv")

    # -----------------------------------------------------------------------
    # SECTION 6: Engagement quality of Brevo sessions
    # -----------------------------------------------------------------------
    section("6. SESSION QUALITY  (did these visitors actually browse?)")

    # Pull page depth (screenPageViews per session) as a proxy for engagement
    df_pages_per_session = run_report(
        client,
        dimensions=["sessionDefaultChannelGroup"],
        metrics=["sessions", "screenPageViews", "engagedSessions",
                 "averageSessionDuration", "bounceRate"],
        row_limit=20,
        order_by_metric="sessions",
    )

    if not df_pages_per_session.empty:
        df_pages_per_session["sessions"] = to_int(df_pages_per_session["sessions"])
        df_pages_per_session["screenPageViews"] = to_int(df_pages_per_session["screenPageViews"])
        df_pages_per_session["engagedSessions"] = to_int(df_pages_per_session["engagedSessions"])
        df_pages_per_session["averageSessionDuration"] = to_float(df_pages_per_session["averageSessionDuration"])
        df_pages_per_session["bounceRate"] = to_float(df_pages_per_session["bounceRate"])
        df_pages_per_session["pagesPerSession"] = (
            df_pages_per_session["screenPageViews"] /
            df_pages_per_session["sessions"].replace(0, 1)
        ).round(2)
        df_pages_per_session["engRate"] = (
            df_pages_per_session["engagedSessions"] /
            df_pages_per_session["sessions"].replace(0, 1)
        ).round(3)

        print(f"\n  All channels — session quality comparison (Apr 3-4):")
        print(f"  {'Channel':<28} {'Sessions':>9} {'Pg/Sess':>9} {'Engaged%':>10} {'Bounce%':>9} {'Avg Dur':>9}")
        print("  " + "-" * 80)
        for _, row in df_pages_per_session.sort_values("sessions", ascending=False).iterrows():
            print(
                f"  {str(row['sessionDefaultChannelGroup']):<28} "
                f"{row['sessions']:>9,} "
                f"{row['pagesPerSession']:>9.2f} "
                f"{row['engRate']:>9.1%} "
                f"{row['bounceRate']:>8.1%} "
                f"{row['averageSessionDuration']:>8.1f}s"
            )

        # Also pull Brevo-filtered session quality directly
        brevo_quality = run_scalar(
            client,
            metrics=["sessions", "screenPageViews", "engagedSessions",
                     "averageSessionDuration", "bounceRate"],
            dimension_filter=brevo_filter,
        )
        b_spv = brevo_quality.get("screenPageViews", 0)
        b_s   = brevo_quality.get("sessions", 1)
        b_pp  = b_spv / max(b_s, 1)
        b_eng = brevo_quality.get("engagedSessions", 0) / max(b_s, 1)
        b_dur = brevo_quality.get("averageSessionDuration", 0)
        b_bnc = brevo_quality.get("bounceRate", 0)

        print(f"\n  Brevo-only session quality:")
        print(f"    Pages per session:   {b_pp:.2f}  (under 1.5 = landing and leaving immediately)")
        print(f"    Engagement rate:     {b_eng:.1%}  (under 30% = not engaging with content)")
        print(f"    Avg session dur:     {b_dur:.1f}s  (under 15s = bounce scenario)")
        print(f"    Bounce rate:         {b_bnc:.1%}  (over 70% = serious landing page problem)")

        if b_pp < 1.5:
            warn("Pages/session under 1.5 — visitors are landing and bouncing without browsing.")
            warn("This is the primary conversion killer for email campaigns.")
        if b_bnc > 0.70:
            err(f"Bounce rate {b_bnc:.0%} — more than 7 in 10 Brevo visitors left immediately.")

    # -----------------------------------------------------------------------
    # SECTION 7: Events fired by Brevo sessions — what did they actually do?
    # -----------------------------------------------------------------------
    section("7. EVENT BREAKDOWN FOR BREVO SESSIONS  (behavioural fingerprint)")

    df_brevo_events = run_report(
        client,
        dimensions=["eventName"],
        metrics=["eventCount", "totalUsers"],
        row_limit=50,
        order_by_metric="eventCount",
        dimension_filter=brevo_filter,
    )

    if df_brevo_events.empty:
        err("No events found for Brevo sessions. Zero GA4 activity under this source.")
    else:
        df_brevo_events["eventCount"] = to_int(df_brevo_events["eventCount"])
        df_brevo_events["totalUsers"] = to_int(df_brevo_events["totalUsers"])

        tracked_events = set(df_brevo_events["eventName"].values)
        ecom_events = ["view_item", "add_to_cart", "begin_checkout",
                       "add_payment_info", "purchase"]

        print(f"\n  All events fired by Brevo sessions:")
        print(f"  {'Event':<40} {'Count':>10} {'Users':>10}")
        print("  " + "-" * 63)
        for _, row in df_brevo_events.sort_values("eventCount", ascending=False).iterrows():
            flag = " <-- E-COMMERCE" if row["eventName"] in ecom_events else ""
            print(f"  {str(row['eventName']):<40} {row['eventCount']:>10,} {row['totalUsers']:>10,}{flag}")

        print(f"\n  E-commerce event presence for Brevo visitors:")
        for ev in ecom_events:
            if ev in tracked_events:
                count = df_brevo_events.loc[
                    df_brevo_events["eventName"] == ev, "eventCount"
                ].values[0]
                ok(f"{ev}: {count:,}")
            else:
                err(f"{ev}: NOT FIRED — visitors did not reach this step")

        df_brevo_events.to_csv(OUTPUT_DIR / "ga4_brevo_events.csv", index=False)
        info("Saved to data/analytics/ga4_brevo_events.csv")

    # -----------------------------------------------------------------------
    # SECTION 8: Pages browsed by Brevo visitors (not just landing page)
    # -----------------------------------------------------------------------
    section("8. PAGES BROWSED BY BREVO TRAFFIC  (did they reach product pages?)")

    df_brevo_pages = run_report(
        client,
        dimensions=["pagePath"],
        metrics=["screenPageViews", "totalUsers"],
        row_limit=30,
        order_by_metric="screenPageViews",
        dimension_filter=brevo_filter,
    )

    if df_brevo_pages.empty:
        err("No page view data for Brevo traffic.")
    else:
        df_brevo_pages["screenPageViews"] = to_int(df_brevo_pages["screenPageViews"])
        df_brevo_pages["totalUsers"] = to_int(df_brevo_pages["totalUsers"])

        print(f"\n  {'Page Path':<60} {'Views':>8} {'Users':>8}")
        print("  " + "-" * 80)
        for _, row in df_brevo_pages.head(25).iterrows():
            path = str(row["pagePath"])[:59]
            print(f"  {path:<60} {row['screenPageViews']:>8,} {row['totalUsers']:>8,}")

        # How many distinct product pages did they reach?
        product_pages = df_brevo_pages[
            df_brevo_pages["pagePath"].str.startswith("/products/", na=False)
        ]
        collections_pages = df_brevo_pages[
            df_brevo_pages["pagePath"].str.startswith("/collections/", na=False)
        ]

        if not product_pages.empty:
            ok(f"{len(product_pages)} product pages reached by Brevo traffic "
               f"({product_pages['screenPageViews'].sum()} total views)")
        else:
            warn("Brevo visitors did NOT reach any /products/ pages.")
            warn("They either bounced from the landing page or browsed collections without clicking into products.")

        if not collections_pages.empty:
            ok(f"{len(collections_pages)} collection pages reached "
               f"({collections_pages['screenPageViews'].sum()} total views)")

        df_brevo_pages.to_csv(OUTPUT_DIR / "ga4_brevo_pages.csv", index=False)
        info("Saved to data/analytics/ga4_brevo_pages.csv")

    # -----------------------------------------------------------------------
    # SECTION 9: Compare Brevo CVR to all other channels
    # -----------------------------------------------------------------------
    section("9. CHANNEL CVR COMPARISON  (Brevo vs Email vs Organic vs Paid)")

    df_channel_cvr = run_report(
        client,
        dimensions=["sessionDefaultChannelGroup", "sessionSource"],
        metrics=["sessions", "conversions", "ecommercePurchases",
                 "totalRevenue", "engagedSessions"],
        row_limit=30,
        order_by_metric="sessions",
    )

    if not df_channel_cvr.empty:
        df_channel_cvr["sessions"]           = to_int(df_channel_cvr["sessions"])
        df_channel_cvr["conversions"]        = to_int(df_channel_cvr["conversions"])
        df_channel_cvr["ecommercePurchases"] = to_int(df_channel_cvr["ecommercePurchases"])
        df_channel_cvr["totalRevenue"]       = to_float(df_channel_cvr["totalRevenue"])
        df_channel_cvr["engagedSessions"]    = to_int(df_channel_cvr["engagedSessions"])
        df_channel_cvr["cvr"] = (
            df_channel_cvr["ecommercePurchases"] /
            df_channel_cvr["sessions"].replace(0, 1)
        ).round(4)

        print(f"\n  {'Channel':<26} {'Source':<22} {'Sessions':>9} {'Orders':>8} {'Revenue':>12} {'CVR':>8}")
        print("  " + "-" * 90)
        for _, row in df_channel_cvr.sort_values("sessions", ascending=False).head(20).iterrows():
            brevo_flag = " <-- BREVO" if "brevo" in str(row["sessionSource"]).lower() else ""
            print(
                f"  {str(row['sessionDefaultChannelGroup']):<26} "
                f"{str(row['sessionSource']):<22} "
                f"{row['sessions']:>9,} "
                f"{row['ecommercePurchases']:>8} "
                f"  ${row['totalRevenue']:>8.2f} "
                f"{row['cvr']:>7.2%}"
                f"{brevo_flag}"
            )

        df_channel_cvr.to_csv(OUTPUT_DIR / "ga4_brevo_channel_cvr.csv", index=False)
        info("Saved to data/analytics/ga4_brevo_channel_cvr.csv")

    # -----------------------------------------------------------------------
    # FINAL DIAGNOSIS
    # -----------------------------------------------------------------------
    print("\n" + "=" * 72)
    print("  DIAGNOSIS — WHY 700 CLICKS BUT 0 ORDERS")
    print("=" * 72)

    print(f"""
  Key findings from the data above. Read in order of likelihood:

  MOST LIKELY CAUSES:

  1. UTM TRACKING GAP (check Section 2 first)
     Brevo's click tracker (tracker.brevo.com) may be consuming the UTM
     parameters before forwarding to stehlenauto.com. If GA4 shows zero
     sessions under utm_source=brevo but Direct traffic spiked on April 3,
     the clicks DID arrive — they just look like Direct.
     Fix: Add stehlenauto.com as a "linked domain" in Brevo, OR use
     branded UTM parameters in the email links directly, bypassing
     Brevo's tracker by disabling Brevo click tracking for this campaign.

  2. LANDING PAGE BOUNCE (check Section 4 + 6)
     /collections/all is a category browse page with 1,330 products.
     Cold reactivation traffic sent to a catalogue dump has no intent match.
     Reactivation emails need a specific offer page (e.g., /collections/tonneau-covers
     with a 15% off banner) or a curated landing page — not the full catalogue.
     Email-to-catalogue CVR is typically 0.5-1.5%; /collections/all will be lower.

  3. MOBILE FRICTION (check Section 5)
     Email open rates are 60-70% mobile. If mobile checkout has UX issues
     (slow load, small tap targets on product pages, the Shopify checkout
     redirect not being smooth), that kills the last step.

  4. OFFER MISMATCH (cannot be measured in GA4)
     Reactivation campaigns need a compelling offer. "Come back and browse"
     without a clear discount, urgency, or personalised product recommendation
     will not convert even if tracking and UX are perfect.
     The Champions segment (36K contacts) has $425 avg LTV — they need a
     min 15% off with a clear CTA to a specific category they've bought before.

  5. EMAIL LIST QUALITY (cannot be measured in GA4)
     If the sent segment included At Risk or Hibernating contacts who bounced
     or marked as spam in previous years, Brevo's click rate may be inflated
     by bot clicks (ESPs use bots to scan links for spam detection).
     Real human clicks to an unverified, cold list are typically 1-3%.
     700 "clicks" from a reactivation list warrants a bot click audit in Brevo.

  NEXT STEPS:

  a) In Brevo dashboard: check the click report — are clicks spread across
     many unique subscribers or concentrated on a few IPs? Concentrated = bots.
  b) In GA4: look at Section 2 — did Direct traffic spike on April 3?
     If yes: UTMs are being stripped. Fix the Brevo link tracking config.
  c) Look at Section 4 landing page data. If traffic landed on /collections/all
     with a 70%+ bounce rate, rebuild the campaign with a curated landing page.
  d) Check Section 5 device split — if 70%+ mobile, run a mobile UX audit
     on the product-to-checkout path before the next campaign send.
  e) Before next send: import Champions list (36,738 verified contacts),
     build a Klaviyo Abandoned Cart flow with 15% off, and use
     /collections/tonneau-covers or /collections/grilles as landing pages
     (higher margin, lower return rate categories per your data analysis).
""")

    print("=" * 72)
    print(f"  Output files saved to data/analytics/")
    print("  ga4_brevo_source_medium.csv")
    print("  ga4_brevo_landing_pages.csv")
    print("  ga4_brevo_devices.csv")
    print("  ga4_brevo_events.csv")
    print("  ga4_brevo_pages.csv")
    print("  ga4_brevo_channel_cvr.csv")
    print("=" * 72)
    print()


if __name__ == "__main__":
    main()
