"""
GA4 Weekly KPI Snapshot — Week 1 Script #3
Automated weekly report comparing this week vs last week vs same week last year.

Run this every Monday morning. Pipe to Slack or email.

Questions this answers:
- Are we trending up or down on the metrics that matter?
- Week-over-week and year-over-year context
- Quick executive summary the C-suite can actually read

Requires:
  pip install google-analytics-data python-dotenv pandas

Environment variables (.env):
  GA4_PROPERTY_ID=your-ga4-property-id
  GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account-key.json
"""

import os
import pandas as pd
from datetime import date, timedelta
from dotenv import load_dotenv
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import (
    RunReportRequest,
    Dimension,
    Metric,
    DateRange,
)

load_dotenv()

PROPERTY_ID = os.getenv("GA4_PROPERTY_ID")
if not PROPERTY_ID:
    raise SystemExit("Set GA4_PROPERTY_ID in .env")

client = BetaAnalyticsDataClient()

KPI_METRICS = [
    "sessions",
    "totalUsers",
    "newUsers",
    "conversions",
    "totalRevenue",
    "averageSessionDuration",
    "engagementRate",
    "ecommercePurchases",
]


def get_period_kpis(start_date, end_date):
    """Fetch aggregate KPIs for a date range."""
    request = RunReportRequest(
        property=f"properties/{PROPERTY_ID}",
        metrics=[Metric(name=m) for m in KPI_METRICS],
        date_ranges=[DateRange(
            start_date=start_date.isoformat(),
            end_date=end_date.isoformat(),
        )],
    )
    response = client.run_report(request)

    result = {}
    if response.rows:
        for i, metric_name in enumerate(KPI_METRICS):
            val = response.rows[0].metric_values[i].value
            result[metric_name] = float(val) if "." in val else int(val)
    return result


def pct_change(current, previous):
    """Calculate percentage change, handle division by zero."""
    if previous == 0:
        return "N/A"
    change = ((current - previous) / previous) * 100
    arrow = "+" if change > 0 else ""
    return f"{arrow}{change:.1f}%"


# Date ranges
today = date.today()
# This week (Mon-Sun, but if run on Monday, use previous full week)
this_week_end = today - timedelta(days=1)  # Yesterday
this_week_start = this_week_end - timedelta(days=6)  # 7-day window

last_week_end = this_week_start - timedelta(days=1)
last_week_start = last_week_end - timedelta(days=6)

# Same week last year
yoy_start = this_week_start - timedelta(days=364)  # ~52 weeks ago
yoy_end = this_week_end - timedelta(days=364)

print("=" * 70)
print(f"  STEHLEN AUTO — Weekly KPI Snapshot")
print(f"  Report Date: {today.isoformat()}")
print(f"  This Week:   {this_week_start} to {this_week_end}")
print(f"  Last Week:   {last_week_start} to {last_week_end}")
print(f"  YoY Week:    {yoy_start} to {yoy_end}")
print("=" * 70)

this_week = get_period_kpis(this_week_start, this_week_end)
last_week = get_period_kpis(last_week_start, last_week_end)
yoy_week = get_period_kpis(yoy_start, yoy_end)

# Format display
DISPLAY_CONFIG = {
    "sessions":                 ("Sessions",             "d"),
    "totalUsers":               ("Total Users",          "d"),
    "newUsers":                 ("New Users",            "d"),
    "conversions":              ("Conversions",          "d"),
    "totalRevenue":             ("Revenue",              "$,.2f"),
    "ecommercePurchases":       ("Orders",               "d"),
    "averageSessionDuration":   ("Avg Session (sec)",    ".1f"),
    "engagementRate":           ("Engagement Rate",      ".2%"),
}

print(f"\n{'Metric':<22} {'This Week':>12} {'vs Last Wk':>12} {'vs YoY':>12}")
print("-" * 60)

for key, (label, fmt) in DISPLAY_CONFIG.items():
    current = this_week.get(key, 0)
    prev = last_week.get(key, 0)
    yoy = yoy_week.get(key, 0)

    if fmt.startswith("$"):
        formatted = f"${current:,.2f}"
    elif fmt.endswith("%"):
        formatted = f"{current:.2%}"
    elif fmt == "d":
        formatted = f"{int(current):,}"
    else:
        formatted = f"{current:{fmt}}"

    wow = pct_change(current, prev)
    yoy_change = pct_change(current, yoy)

    print(f"{label:<22} {formatted:>12} {wow:>12} {yoy_change:>12}")

# Derived metrics
if this_week.get("sessions", 0) > 0:
    conv_rate = this_week.get("conversions", 0) / this_week["sessions"]
    prev_conv_rate = (
        last_week.get("conversions", 0) / last_week["sessions"]
        if last_week.get("sessions", 0) > 0 else 0
    )
    rev_per_session = this_week.get("totalRevenue", 0) / this_week["sessions"]

    print("-" * 60)
    print(f"{'Conv Rate':<22} {conv_rate:>11.2%} {pct_change(conv_rate, prev_conv_rate):>12}")
    print(f"{'Rev/Session':<22} ${rev_per_session:>10.2f}")

    if this_week.get("ecommercePurchases", 0) > 0:
        aov = this_week.get("totalRevenue", 0) / this_week["ecommercePurchases"]
        prev_aov = (
            last_week.get("totalRevenue", 0) / last_week["ecommercePurchases"]
            if last_week.get("ecommercePurchases", 0) > 0 else 0
        )
        print(f"{'AOV':<22} ${aov:>10.2f} {pct_change(aov, prev_aov):>12}")

print()
print("=" * 70)

# Quick health check
alerts = []
if this_week.get("sessions", 0) > 0 and last_week.get("sessions", 0) > 0:
    session_drop = (this_week["sessions"] - last_week["sessions"]) / last_week["sessions"]
    if session_drop < -0.2:
        alerts.append(f"ALERT: Sessions dropped {session_drop:.0%} week-over-week")

    rev_drop = (
        (this_week.get("totalRevenue", 0) - last_week.get("totalRevenue", 0))
        / max(last_week.get("totalRevenue", 1), 1)
    )
    if rev_drop < -0.25:
        alerts.append(f"ALERT: Revenue dropped {rev_drop:.0%} week-over-week")

if alerts:
    print("\n  HEALTH ALERTS:")
    for a in alerts:
        print(f"    {a}")
else:
    print("  No health alerts this week.")

print()
