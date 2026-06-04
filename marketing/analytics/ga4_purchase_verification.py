"""
GA4 Purchase Verification & Funnel Audit — Stehlen Auto
==========================================================
Runs after test orders are placed to verify:
  1. Purchase events are firing and reaching GA4
  2. E-commerce parameters are populated (transaction_id, value, currency, items)
  3. Full funnel counts: view_item -> add_to_cart -> begin_checkout -> purchase
  4. Revenue data is being recorded
  5. Data gaps: purchases without revenue, duplicate transaction_ids, missing params

Auth: OAuth desktop app flow (same as ga4_traffic_analysis.py)
      Uses cached token.json if present, else opens browser.

Run:
  cd "C:/Users/ultra/OneDrive/Documents/Robome/Client/JL Concepts/Project/Shopify-Storefront-Lovable"
  source venv/Scripts/activate
  python marketing/analytics/ga4_purchase_verification.py
"""

import os
import sys
import json
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
    RunRealtimeReportRequest,
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

load_dotenv()

PROPERTY_ID = os.getenv("GA4_PROPERTY_ID", "529120634")
OAUTH_CREDS_FILE = os.getenv("GA4_OAUTH_CREDENTIALS", "./oauth-credentials.json")
TOKEN_FILE = "./token.json"
SCOPES = ["https://www.googleapis.com/auth/analytics.readonly"]

# Look back further to catch test orders placed any time in the last 30 days
LOOKBACK_DAYS = 30

OUTPUT_DIR = Path("data/analytics")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


# ---------------------------------------------------------------------------
# Auth (identical pattern to ga4_traffic_analysis.py)
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
                    f"\nOAuth credentials file not found at: {OAUTH_CREDS_FILE}\n"
                    f"Download from Google Cloud Console > APIs & Services > Credentials\n"
                )
            print("Opening browser for Google sign-in (one-time setup)...")
            flow = InstalledAppFlow.from_client_secrets_file(OAUTH_CREDS_FILE, SCOPES)
            creds = flow.run_local_server(port=0)

        with open(TOKEN_FILE, "w") as f:
            f.write(creds.to_json())
        print(f"Token saved to {TOKEN_FILE}")

    return BetaAnalyticsDataClient(credentials=creds)


# ---------------------------------------------------------------------------
# Helper: run a standard report and return a DataFrame
# ---------------------------------------------------------------------------

def run_report(client, dimensions, metrics, days=LOOKBACK_DAYS,
               row_limit=100, order_by_metric=None, event_filter=None):
    end = date.today()
    start = end - timedelta(days=days)

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
        date_ranges=[DateRange(start_date=start.isoformat(), end_date=end.isoformat())],
        limit=row_limit,
        order_bys=order_bys,
    )

    if event_filter:
        kwargs["dimension_filter"] = event_filter

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


def run_report_no_dim(client, metrics, days=LOOKBACK_DAYS):
    """Run a report with no dimensions — returns aggregate totals."""
    end = date.today()
    start = end - timedelta(days=days)

    request = RunReportRequest(
        property=f"properties/{PROPERTY_ID}",
        metrics=[Metric(name=m) for m in metrics],
        date_ranges=[DateRange(start_date=start.isoformat(), end_date=end.isoformat())],
    )
    response = client.run_report(request)

    result = {}
    if response.rows:
        for i, m in enumerate(metrics):
            result[m] = response.rows[0].metric_values[i].value
    return result


def to_int(series):
    return pd.to_numeric(series, errors="coerce").fillna(0).astype(int)


def to_float(series):
    return pd.to_numeric(series, errors="coerce").fillna(0.0)


def section(title):
    print("\n" + "=" * 70)
    print(f"  {title}")
    print("=" * 70)


def ok(msg):   print(f"  [OK]      {msg}")
def warn(msg): print(f"  [WARN]    {msg}")
def err(msg):  print(f"  [ERROR]   {msg}")
def info(msg): print(f"  [INFO]    {msg}")


# ---------------------------------------------------------------------------
# MAIN
# ---------------------------------------------------------------------------

def main():
    print("\n" + "=" * 70)
    print("  STEHLEN AUTO — GA4 Purchase Verification & Funnel Audit")
    print(f"  Property: {PROPERTY_ID}  |  Window: Last {LOOKBACK_DAYS} days")
    print(f"  Run date: {date.today().isoformat()}")
    print("=" * 70)

    client = get_authenticated_client()
    print("\nAuthenticated successfully.\n")

    findings = []   # collect all findings for final summary
    critical = []   # issues that block accurate reporting

    # -----------------------------------------------------------------------
    # SECTION 1: Are purchase events firing at all?
    # -----------------------------------------------------------------------
    section("1. PURCHASE EVENT PRESENCE")

    df_events = run_report(
        client,
        dimensions=["eventName"],
        metrics=["eventCount"],
        days=LOOKBACK_DAYS,
        row_limit=100,
        order_by_metric="eventCount",
    )

    ecom_events = ["view_item", "add_to_cart", "begin_checkout",
                   "add_payment_info", "purchase"]
    custom_events = ["vehicle_selected", "ymm_selected", "fitment_confirmed"]

    event_counts = {}
    if not df_events.empty:
        df_events["eventCount"] = to_int(df_events["eventCount"])
        event_counts = dict(zip(df_events["eventName"], df_events["eventCount"]))

    print(f"\n  Standard e-commerce events (last {LOOKBACK_DAYS} days):")
    for ev in ecom_events:
        count = event_counts.get(ev, 0)
        if count > 0:
            ok(f"{ev}: {count:,} events")
        else:
            err(f"{ev}: 0 events — NOT FIRING")
            critical.append(f"Event '{ev}' has zero count in last {LOOKBACK_DAYS} days")

    print(f"\n  Custom auto-parts events:")
    for ev in custom_events:
        count = event_counts.get(ev, 0)
        if count > 0:
            ok(f"{ev}: {count:,} events")
        else:
            warn(f"{ev}: 0 events (confirm event name in Lovable dataLayer)")
            findings.append(f"Custom event '{ev}' not detected — verify dataLayer push name")

    purchase_count = event_counts.get("purchase", 0)

    # -----------------------------------------------------------------------
    # SECTION 2: Revenue totals — is money being recorded?
    # -----------------------------------------------------------------------
    section("2. REVENUE RECORDED IN GA4")

    totals = run_report_no_dim(
        client,
        metrics=["ecommercePurchases", "totalRevenue", "averagePurchaseRevenue"],
        days=LOOKBACK_DAYS,
    )

    ga4_orders = int(float(totals.get("ecommercePurchases", 0)))
    ga4_revenue = float(totals.get("totalRevenue", 0))
    ga4_aov = float(totals.get("averagePurchaseRevenue", 0))

    print(f"\n  GA4 e-commerce purchases: {ga4_orders}")
    print(f"  GA4 total revenue:        ${ga4_revenue:,.2f}")
    print(f"  GA4 average order value:  ${ga4_aov:,.2f}")

    if ga4_orders == 0:
        err("No purchase revenue recorded in GA4 — purchase event may be firing")
        err("without e-commerce parameters, or cross-domain tracking is broken.")
        critical.append("ecommercePurchases = 0: purchase event fires but carries no transaction data")
    elif ga4_revenue == 0 and ga4_orders > 0:
        err(f"{ga4_orders} purchase events recorded but revenue = $0.00")
        err("The 'value' parameter is missing or zero on the purchase event.")
        critical.append("Purchase events fire but revenue value is $0 — check 'value' param in dataLayer")
    else:
        ok(f"Revenue data is being recorded (${ga4_revenue:,.2f} across {ga4_orders} orders)")
        if ga4_orders > 0:
            info(f"Implied AOV: ${ga4_revenue/ga4_orders:,.2f}")

    # Compare GA4 purchase event count vs ecommercePurchases metric
    if purchase_count > 0 and ga4_orders > 0:
        ratio = purchase_count / ga4_orders
        if ratio > 1.2:
            warn(f"purchase event count ({purchase_count}) > ecommercePurchases metric ({ga4_orders})")
            warn("Possible duplicate event firing (thank-you page reload). Check transaction_id dedup.")
            findings.append(f"purchase event count ({purchase_count}) inflated vs ecommercePurchases ({ga4_orders}) — possible double-fire")
        elif ratio < 0.8:
            warn(f"purchase events ({purchase_count}) < ecommercePurchases ({ga4_orders}) — unusual")
            findings.append("More ecommercePurchases than raw purchase events — investigate")
        else:
            ok(f"purchase event count ({purchase_count}) aligns with ecommercePurchases metric ({ga4_orders})")

    # -----------------------------------------------------------------------
    # SECTION 3: Transaction IDs — populated and unique?
    # -----------------------------------------------------------------------
    section("3. TRANSACTION ID INTEGRITY")

    df_txn = run_report(
        client,
        dimensions=["transactionId"],
        metrics=["ecommercePurchases", "totalRevenue"],
        days=LOOKBACK_DAYS,
        row_limit=100,
        order_by_metric="ecommercePurchases",
    )

    if df_txn.empty:
        err("No transaction IDs returned — either no purchases or transaction_id param missing")
        critical.append("transactionId dimension returned empty — purchase events lack transaction_id parameter")
    else:
        df_txn["ecommercePurchases"] = to_int(df_txn["ecommercePurchases"])
        df_txn["totalRevenue"] = to_float(df_txn["totalRevenue"])

        # Exclude (not set) rows
        not_set_rows = df_txn[df_txn["transactionId"].isin(["(not set)", ""])]
        valid_txn = df_txn[~df_txn["transactionId"].isin(["(not set)", ""])]

        print(f"\n  Total transaction IDs found: {len(df_txn)}")
        print(f"  Valid transaction IDs:       {len(valid_txn)}")
        print(f"  Missing (not set) rows:      {len(not_set_rows)}")

        if len(not_set_rows) > 0:
            err(f"{len(not_set_rows)} purchases have no transaction_id ('not set')")
            err("These cannot be deduplicated and will cause double-counting.")
            critical.append(f"{len(not_set_rows)} purchase events missing transaction_id — deduplication broken")

        # Check for duplicate transaction IDs (same ID appearing more than once
        # with multiple purchase counts = double-fire on thank-you page reload)
        dupes = valid_txn[valid_txn["ecommercePurchases"] > 1]
        if not dupes.empty:
            warn(f"{len(dupes)} transaction ID(s) recorded more than once (double-fire):")
            for _, row in dupes.iterrows():
                warn(f"  {row['transactionId']} — fired {int(row['ecommercePurchases'])}x, "
                     f"revenue ${float(row['totalRevenue']):.2f}")
            findings.append(f"{len(dupes)} duplicate transaction_ids detected — thank-you page reload firing purchase twice")

        if not valid_txn.empty:
            ok(f"{len(valid_txn)} unique transaction IDs with populated transaction_id")
            print(f"\n  Transaction detail (last {LOOKBACK_DAYS} days):")
            print(f"  {'Transaction ID':<35} {'Orders':>8} {'Revenue':>12}")
            print("  " + "-" * 58)
            for _, row in valid_txn.sort_values("totalRevenue", ascending=False).iterrows():
                print(f"  {row['transactionId']:<35} {int(row['ecommercePurchases']):>8} "
                      f"  ${float(row['totalRevenue']):>10.2f}")

            valid_txn.to_csv(OUTPUT_DIR / "ga4_transactions.csv", index=False)
            info("Saved to data/analytics/ga4_transactions.csv")

    # -----------------------------------------------------------------------
    # SECTION 4: Revenue by day — see when test orders hit
    # -----------------------------------------------------------------------
    section("4. DAILY REVENUE TREND (Last 30 Days)")

    df_daily = run_report(
        client,
        dimensions=["date"],
        metrics=["ecommercePurchases", "totalRevenue", "sessions"],
        days=LOOKBACK_DAYS,
        row_limit=31,
        order_by_metric="ecommercePurchases",
    )

    if not df_daily.empty and float(df_daily["ecommercePurchases"].str.replace(",", "").astype(float).sum()) > 0:
        df_daily["ecommercePurchases"] = to_int(df_daily["ecommercePurchases"])
        df_daily["totalRevenue"] = to_float(df_daily["totalRevenue"])
        df_daily["sessions"] = to_int(df_daily["sessions"])
        df_daily = df_daily.sort_values("date")

        # Only show days with purchases or a rolling window of all days
        df_with_orders = df_daily[df_daily["ecommercePurchases"] > 0]

        if df_with_orders.empty:
            warn("No days with recorded purchases in the last 30 days")
        else:
            print(f"\n  Days with purchase activity:")
            print(f"  {'Date':<12} {'Orders':>8} {'Revenue':>12} {'Sessions':>10}")
            print("  " + "-" * 45)
            for _, row in df_with_orders.iterrows():
                print(f"  {row['date']:<12} {row['ecommercePurchases']:>8} "
                      f"  ${row['totalRevenue']:>10.2f} {row['sessions']:>10,}")
            df_daily.to_csv(OUTPUT_DIR / "ga4_daily_revenue.csv", index=False)
            info("Full daily data saved to data/analytics/ga4_daily_revenue.csv")
    else:
        warn("No purchase revenue recorded on any day in the last 30 days")
        findings.append("Zero revenue days — test orders may not have reached GA4 purchase event")

    # -----------------------------------------------------------------------
    # SECTION 5: E-commerce funnel — full step counts
    # -----------------------------------------------------------------------
    section("5. E-COMMERCE FUNNEL (Event Counts, Last 30 Days)")

    funnel_events = [
        ("view_item",       "Product Page View"),
        ("add_to_cart",     "Add to Cart"),
        ("begin_checkout",  "Begin Checkout"),
        ("add_payment_info","Add Payment Info"),
        ("purchase",        "Purchase"),
    ]

    print(f"\n  {'Funnel Step':<25} {'Event Name':<22} {'Count':>10} {'Drop from Prior':>18}")
    print("  " + "-" * 78)

    prev_count = None
    prev_label = None
    funnel_data = []
    for event_name, label in funnel_events:
        count = event_counts.get(event_name, 0)
        funnel_data.append({"step": label, "event": event_name, "count": count})

        if prev_count is not None and prev_count > 0:
            drop_pct = (1 - count / prev_count) * 100
            drop_str = f"{drop_pct:.1f}% drop from {prev_label}"
        else:
            drop_str = "— (top of funnel)"

        status = "OK" if count > 0 else "MISSING"
        print(f"  [{status:<7}] {label:<23} {event_name:<22} {count:>10,} {drop_str:>18}")

        if count > 0:
            prev_count = count
            prev_label = label

    # Calculate key ratios
    vi = event_counts.get("view_item", 0)
    atc = event_counts.get("add_to_cart", 0)
    bc = event_counts.get("begin_checkout", 0)
    pur = event_counts.get("purchase", 0)

    print("\n  Key conversion ratios:")
    if vi > 0:
        atc_rate = atc / vi
        print(f"  View-to-Cart rate:            {atc_rate:.1%}  (target: 8-12%)")
        if atc_rate < 0.05:
            warn("View-to-Cart below 5% — check pricing, images, fitment badge visibility")
            findings.append(f"View-to-Cart rate {atc_rate:.1%} is below 5% threshold")
        elif atc_rate >= 0.08:
            ok(f"View-to-Cart rate {atc_rate:.1%} is healthy")

    if atc > 0:
        bc_rate = bc / atc
        print(f"  Cart-to-Checkout rate:        {bc_rate:.1%}  (target: 55%+)")
        if bc_rate < 0.40:
            warn("Cart-to-Checkout below 40% — high cart abandonment before checkout even starts")
            findings.append(f"Cart-to-Checkout {bc_rate:.1%} — checkout friction or cart UX issue")

    if bc > 0:
        pur_rate = pur / bc
        print(f"  Checkout-to-Purchase rate:    {pur_rate:.1%}  (target: 65%+)")
        if pur_rate < 0.50:
            warn("Checkout-to-Purchase below 50% — payment friction, shipping shock, or cross-domain gap")
            findings.append(f"Checkout-to-Purchase {pur_rate:.1%} — possible cross-domain session loss at Shopify checkout")
        elif pur_rate > 0.95 and bc > 5:
            warn("Checkout-to-Purchase > 95% — suspiciously high, may indicate begin_checkout is undercounting")
            findings.append("Checkout-to-Purchase > 95% — begin_checkout may be firing late or missing")

    if vi > 0 and pur > 0:
        overall = pur / vi
        print(f"  Overall View-to-Purchase:     {overall:.2%}")

    pd.DataFrame(funnel_data).to_csv(OUTPUT_DIR / "ga4_funnel.csv", index=False)
    info("Funnel data saved to data/analytics/ga4_funnel.csv")

    # -----------------------------------------------------------------------
    # SECTION 6: Purchase revenue by channel — is attribution working?
    # -----------------------------------------------------------------------
    section("6. REVENUE BY CHANNEL (Attribution Check)")

    df_channel = run_report(
        client,
        dimensions=["sessionDefaultChannelGroup"],
        metrics=["ecommercePurchases", "totalRevenue", "sessions"],
        days=LOOKBACK_DAYS,
        row_limit=20,
        order_by_metric="totalRevenue",
    )

    if not df_channel.empty:
        df_channel["ecommercePurchases"] = to_int(df_channel["ecommercePurchases"])
        df_channel["totalRevenue"] = to_float(df_channel["totalRevenue"])
        df_channel["sessions"] = to_int(df_channel["sessions"])

        print(f"\n  {'Channel':<30} {'Orders':>8} {'Revenue':>12} {'Sessions':>10}")
        print("  " + "-" * 62)
        for _, row in df_channel.iterrows():
            print(f"  {row['sessionDefaultChannelGroup']:<30} "
                  f"{row['ecommercePurchases']:>8} "
                  f"  ${row['totalRevenue']:>10.2f} "
                  f"{row['sessions']:>10,}")

        # Flag if "Direct" is carrying an unusually large share of revenue
        total_rev = df_channel["totalRevenue"].sum()
        if total_rev > 0:
            direct = df_channel[df_channel["sessionDefaultChannelGroup"] == "Direct"]
            if not direct.empty:
                direct_share = direct["totalRevenue"].values[0] / total_rev
                if direct_share > 0.50:
                    warn(f"'Direct' channel holds {direct_share:.0%} of revenue.")
                    warn("This likely means UTM parameters or cross-domain tracking is broken.")
                    warn("Test orders placed by navigating directly also land here — expected for now.")
                    findings.append(f"Direct channel = {direct_share:.0%} of revenue — verify UTMs and cross-domain config")

        df_channel.to_csv(OUTPUT_DIR / "ga4_revenue_by_channel.csv", index=False)
        info("Saved to data/analytics/ga4_revenue_by_channel.csv")
    else:
        warn("No channel data returned")

    # -----------------------------------------------------------------------
    # SECTION 7: Source/medium with revenue — catch payment processor misattribution
    # -----------------------------------------------------------------------
    section("7. REFERRAL MISATTRIBUTION CHECK")

    df_source = run_report(
        client,
        dimensions=["sessionSource", "sessionMedium"],
        metrics=["ecommercePurchases", "totalRevenue"],
        days=LOOKBACK_DAYS,
        row_limit=30,
        order_by_metric="ecommercePurchases",
    )

    bad_referrers = ["shop.app", "paypal.com", "stripe.com", "checkout.shopify.com",
                     "affirm.com", "afterpay.com", "sezzle.com"]

    if not df_source.empty:
        df_source["ecommercePurchases"] = to_int(df_source["ecommercePurchases"])
        df_source["totalRevenue"] = to_float(df_source["totalRevenue"])

        print(f"\n  All sources with purchase activity:")
        print(f"  {'Source':<30} {'Medium':<20} {'Orders':>8} {'Revenue':>12}")
        print("  " + "-" * 72)
        for _, row in df_source[df_source["ecommercePurchases"] > 0].iterrows():
            flag = " <-- PAYMENT PROCESSOR MISATTRIBUTION" if row["sessionSource"] in bad_referrers else ""
            print(f"  {row['sessionSource']:<30} {row['sessionMedium']:<20} "
                  f"{row['ecommercePurchases']:>8}   ${row['totalRevenue']:>10.2f}{flag}")
            if row["sessionSource"] in bad_referrers:
                err(f"'{row['sessionSource']}' is attributing purchases — add to Unwanted Referrals list")
                critical.append(f"Payment processor '{row['sessionSource']}' appearing as traffic source — add to unwanted referrals")

        df_source.to_csv(OUTPUT_DIR / "ga4_source_revenue.csv", index=False)
        info("Saved to data/analytics/ga4_source_revenue.csv")
    else:
        info("No source/medium purchase data (expected if no purchases yet)")

    # -----------------------------------------------------------------------
    # SECTION 8: Item-level data — are product params populating?
    # -----------------------------------------------------------------------
    section("8. ITEM-LEVEL E-COMMERCE DATA")

    df_items = run_report(
        client,
        dimensions=["itemName"],
        metrics=["itemsViewed", "itemsAddedToCart", "itemsPurchased", "itemRevenue"],
        days=LOOKBACK_DAYS,
        row_limit=50,
        order_by_metric="itemRevenue",
    )

    if df_items.empty:
        err("No item-level data returned — items array may be missing from purchase/view events")
        critical.append("Item-level e-commerce data missing — 'items' array not populating in GA4 events")
    else:
        df_items["itemsViewed"] = to_int(df_items["itemsViewed"])
        df_items["itemsAddedToCart"] = to_int(df_items["itemsAddedToCart"])
        df_items["itemsPurchased"] = to_int(df_items["itemsPurchased"])
        df_items["itemRevenue"] = to_float(df_items["itemRevenue"])

        purchased = df_items[df_items["itemsPurchased"] > 0]
        not_set_items = df_items[df_items["itemName"] == "(not set)"]

        print(f"\n  Total item records: {len(df_items)}")
        print(f"  Items with purchases: {len(purchased)}")

        if not not_set_items.empty:
            warn(f"{len(not_set_items)} items with '(not set)' name — item_name param missing in events")
            findings.append("items with item_name = '(not set)' — item_name not being passed in items array")

        if not purchased.empty:
            ok(f"{len(purchased)} distinct items recorded as purchased")
            print(f"\n  Items purchased (top by revenue):")
            print(f"  {'Item Name':<55} {'Qty':>6} {'Revenue':>12}")
            print("  " + "-" * 75)
            for _, row in purchased.sort_values("itemRevenue", ascending=False).head(20).iterrows():
                name = str(row["itemName"])[:54]
                print(f"  {name:<55} {row['itemsPurchased']:>6}   ${row['itemRevenue']:>10.2f}")
        else:
            warn("No items show purchases — itemsPurchased = 0 across all products")
            findings.append("No items show itemsPurchased > 0 — item array in purchase event may be empty")

        df_items.to_csv(OUTPUT_DIR / "ga4_item_performance.csv", index=False)
        info("Saved to data/analytics/ga4_item_performance.csv")

    # -----------------------------------------------------------------------
    # SECTION 9: Cross-domain tracking sanity check
    # -----------------------------------------------------------------------
    section("9. CROSS-DOMAIN TRACKING SANITY")

    # If cross-domain is broken, purchases show up as new sessions from shopify.com
    # We check if shopify appears as a referral source with revenue
    df_referrals = run_report(
        client,
        dimensions=["sessionSource"],
        metrics=["sessions", "ecommercePurchases"],
        days=LOOKBACK_DAYS,
        row_limit=50,
        order_by_metric="sessions",
    )

    if not df_referrals.empty:
        df_referrals["sessions"] = to_int(df_referrals["sessions"])
        df_referrals["ecommercePurchases"] = to_int(df_referrals["ecommercePurchases"])

        shopify_referral = df_referrals[
            df_referrals["sessionSource"].str.contains("shopify", case=False, na=False)
        ]

        if not shopify_referral.empty:
            total_shopify_sessions = shopify_referral["sessions"].sum()
            total_shopify_purchases = shopify_referral["ecommercePurchases"].sum()
            if total_shopify_sessions > 5:
                warn(f"'shopify' appears as a session source: {total_shopify_sessions} sessions, "
                     f"{total_shopify_purchases} purchases")
                warn("Cross-domain tracking may be broken — checkout sessions leaking as 'shopify.com' referrals")
                critical.append(f"shopify.com appearing as referral source ({total_shopify_sessions} sessions) — cross-domain config issue")
            else:
                ok(f"shopify referral source minimal ({total_shopify_sessions} sessions) — cross-domain likely OK")
        else:
            ok("No 'shopify' referral sessions detected — cross-domain tracking appears intact")

    # -----------------------------------------------------------------------
    # SECTION 10: Real-time check — confirm live events are reaching GA4
    # -----------------------------------------------------------------------
    section("10. REAL-TIME ACTIVE USERS (Confirms Data Pipeline is Live)")

    try:
        rt_request = RunRealtimeReportRequest(
            property=f"properties/{PROPERTY_ID}",
            dimensions=[Dimension(name="eventName")],
            metrics=[Metric(name="eventCount")],
            limit=20,
        )
        rt_response = client.run_realtime_report(rt_request)

        rt_rows = []
        for row in rt_response.rows:
            rt_rows.append({
                "eventName": row.dimension_values[0].value,
                "eventCount": int(row.metric_values[0].value),
            })

        if rt_rows:
            print(f"\n  Real-time events (last 30 minutes):")
            for r in sorted(rt_rows, key=lambda x: x["eventCount"], reverse=True):
                print(f"  {r['eventName']:<35} {r['eventCount']:>6} events")
            ok("Real-time data pipeline is live — events are reaching GA4")
        else:
            info("No real-time events right now — site may have no active users at this moment")
            info("This is normal for low-traffic sites. Check at peak hours.")

    except Exception as e:
        warn(f"Real-time report failed: {e}")
        info("Real-time API requires analytics.readonly scope — usually fine if batch reports worked")

    # -----------------------------------------------------------------------
    # FINAL SUMMARY
    # -----------------------------------------------------------------------
    print("\n" + "=" * 70)
    print("  FINAL VERDICT — ACTION ITEMS")
    print("=" * 70)

    if critical:
        print(f"\n  CRITICAL (fix before any ad spend — these break revenue attribution):")
        for i, item in enumerate(critical, 1):
            print(f"  {i}. {item}")
    else:
        print("\n  No critical tracking gaps detected.")

    if findings:
        print(f"\n  WARNINGS (fix this week — these degrade data quality):")
        for i, item in enumerate(findings, 1):
            print(f"  {i}. {item}")
    else:
        print("\n  No data quality warnings detected.")

    print(f"\n  GA4 SUMMARY (Last {LOOKBACK_DAYS} days):")
    print(f"  Orders tracked:   {ga4_orders}")
    print(f"  Revenue tracked:  ${ga4_revenue:,.2f}")
    print(f"  AOV:              ${ga4_aov:,.2f}")
    print(f"  Funnel events firing: {sum(1 for e in ecom_events if event_counts.get(e, 0) > 0)}/{len(ecom_events)}")

    print(f"\n  Reports saved to: data/analytics/")
    print("  Files: ga4_transactions.csv, ga4_funnel.csv, ga4_daily_revenue.csv,")
    print("         ga4_revenue_by_channel.csv, ga4_source_revenue.csv, ga4_item_performance.csv")

    if not critical and not findings:
        print("\n  Purchase tracking is CLEAN. GA4 is ready for paid ad spend.")
    elif critical:
        print("\n  STOP: Resolve CRITICAL items before launching paid ads.")
        print("  Every dollar spent on ads while tracking is broken is a dollar")
        print("  you cannot attribute, optimize, or justify to stakeholders.")
    else:
        print("\n  Core tracking is functional. Address WARNINGS before scaling spend.")

    print()


if __name__ == "__main__":
    main()
