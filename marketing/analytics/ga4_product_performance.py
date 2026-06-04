"""
GA4 Product Performance — Week 1 Script #2
Pull enhanced e-commerce data to understand product-level engagement.

Questions this answers:
- Which products get VIEWED the most vs. which actually SELL?
- What's the view-to-cart and cart-to-purchase funnel by product?
- Which product categories have the highest drop-off?
- What search terms are people using on-site?

Requires:
  pip install google-analytics-data python-dotenv pandas

Environment variables (.env):
  GA4_PROPERTY_ID=your-ga4-property-id
  GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account-key.json

NOTE: Enhanced e-commerce must be enabled in GA4 for these reports to work.
      If Lovable/Shopify integration is set up correctly, it should be.
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
    OrderBy,
)

load_dotenv()

PROPERTY_ID = os.getenv("GA4_PROPERTY_ID")
if not PROPERTY_ID:
    raise SystemExit("Set GA4_PROPERTY_ID in .env")

client = BetaAnalyticsDataClient()


def run_report(dimensions, metrics, date_range_days=90, row_limit=50):
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
# Report 1: Product view-to-purchase funnel
# ---------------------------------------------------------------------------

print("=" * 70)
print("REPORT 1: Product Funnel — Views vs. Add-to-Carts vs. Purchases")
print("=" * 70)

df_funnel = run_report(
    dimensions=["itemName"],
    metrics=["itemsViewed", "itemsAddedToCart", "itemsPurchased", "itemRevenue"],
    date_range_days=90,
    row_limit=50,
)

if not df_funnel.empty:
    for col in ["itemsViewed", "itemsAddedToCart", "itemsPurchased"]:
        df_funnel[col] = pd.to_numeric(df_funnel[col], errors="coerce").fillna(0).astype(int)
    df_funnel["itemRevenue"] = pd.to_numeric(df_funnel["itemRevenue"], errors="coerce").fillna(0)

    # View-to-cart rate
    df_funnel["viewToCart"] = (
        df_funnel["itemsAddedToCart"] / df_funnel["itemsViewed"].replace(0, 1)
    ).round(3)

    # Cart-to-purchase rate
    df_funnel["cartToPurchase"] = (
        df_funnel["itemsPurchased"] / df_funnel["itemsAddedToCart"].replace(0, 1)
    ).round(3)

    # Sort by views to see highest-interest products
    df_funnel = df_funnel.sort_values("itemsViewed", ascending=False)

    print(df_funnel.to_string(index=False))
    print()

    # Find "leaky bucket" products — high views, low add-to-cart
    leaky = df_funnel[
        (df_funnel["itemsViewed"] >= 20) & (df_funnel["viewToCart"] < 0.05)
    ]
    if not leaky.empty:
        print("  WARNING — High-view, low-cart products (pricing or content issue?):")
        for _, row in leaky.iterrows():
            print(f"    {row['itemName'][:60]} — {row['itemsViewed']} views, "
                  f"{row['viewToCart']:.1%} add-to-cart rate")
        print()

    # Find "hidden gems" — high cart-to-purchase but low views
    gems = df_funnel[
        (df_funnel["cartToPurchase"] > 0.5) & (df_funnel["itemsViewed"] < 50)
    ]
    if not gems.empty:
        print("  OPPORTUNITY — High-converting but low-traffic products (drive more eyeballs):")
        for _, row in gems.iterrows():
            print(f"    {row['itemName'][:60]} — {row['itemsViewed']} views, "
                  f"{row['cartToPurchase']:.0%} cart-to-purchase")
        print()
else:
    print("  No enhanced e-commerce data. Check GA4 setup.\n")


# ---------------------------------------------------------------------------
# Report 2: Product category performance
# ---------------------------------------------------------------------------

print("=" * 70)
print("REPORT 2: Product Category Performance")
print("=" * 70)

df_cat = run_report(
    dimensions=["itemCategory"],
    metrics=["itemsViewed", "itemsAddedToCart", "itemsPurchased", "itemRevenue"],
    date_range_days=90,
    row_limit=30,
)

if not df_cat.empty:
    for col in ["itemsViewed", "itemsAddedToCart", "itemsPurchased"]:
        df_cat[col] = pd.to_numeric(df_cat[col], errors="coerce").fillna(0).astype(int)
    df_cat["itemRevenue"] = pd.to_numeric(df_cat["itemRevenue"], errors="coerce").fillna(0)
    df_cat["viewToCart"] = (
        df_cat["itemsAddedToCart"] / df_cat["itemsViewed"].replace(0, 1)
    ).round(3)
    df_cat["cartToPurchase"] = (
        df_cat["itemsPurchased"] / df_cat["itemsAddedToCart"].replace(0, 1)
    ).round(3)

    print(df_cat.to_string(index=False))
    print()
else:
    print("  No category data. May need to configure item_category in GA4 e-commerce setup.\n")


# ---------------------------------------------------------------------------
# Report 3: On-site search terms (what are people looking for?)
# ---------------------------------------------------------------------------

print("=" * 70)
print("REPORT 3: On-Site Search Terms")
print("=" * 70)
print("(Requires site search tracking enabled in GA4)\n")

df_search = run_report(
    dimensions=["searchTerm"],
    metrics=["sessions", "conversions"],
    date_range_days=90,
    row_limit=40,
)

if not df_search.empty:
    for col in ["sessions", "conversions"]:
        df_search[col] = pd.to_numeric(df_search[col], errors="coerce").fillna(0).astype(int)
    df_search["convRate"] = (
        df_search["conversions"] / df_search["sessions"].replace(0, 1)
    ).round(3)

    # Filter out empty/not-set
    df_search = df_search[
        ~df_search["searchTerm"].isin(["(not set)", ""])
    ]

    print(df_search.to_string(index=False))
    print()
    print("  INSIGHT: Search terms with high volume but 0 conversions = ")
    print("  products people WANT but can't find or aren't satisfied with.\n")
    print("  Search terms containing vehicle names = vehicle fitment demand signal.\n")
else:
    print("  No search data available.\n")


# ---------------------------------------------------------------------------
# Report 4: New vs returning user behavior
# ---------------------------------------------------------------------------

print("=" * 70)
print("REPORT 4: New vs. Returning Users")
print("=" * 70)

df_user = run_report(
    dimensions=["newVsReturning"],
    metrics=["sessions", "conversions", "totalRevenue", "averageSessionDuration"],
    date_range_days=90,
    row_limit=5,
)

if not df_user.empty:
    for col in ["sessions", "conversions"]:
        df_user[col] = pd.to_numeric(df_user[col], errors="coerce").fillna(0).astype(int)
    df_user["totalRevenue"] = pd.to_numeric(df_user["totalRevenue"], errors="coerce").fillna(0)
    df_user["averageSessionDuration"] = pd.to_numeric(
        df_user["averageSessionDuration"], errors="coerce"
    ).fillna(0).round(1)
    df_user["convRate"] = (
        df_user["conversions"] / df_user["sessions"].replace(0, 1)
    ).round(4)
    df_user["revenuePerSession"] = (
        df_user["totalRevenue"] / df_user["sessions"].replace(0, 1)
    ).round(2)

    print(df_user.to_string(index=False))
    print()
    print("  If returning users convert 3-5x better → invest in remarketing/email")
    print("  If new user conversion is healthy → current acquisition is qualified\n")
else:
    print("  No data returned.\n")


print("=" * 70)
print("ANALYSIS COMPLETE")
print("=" * 70)
print("""
Key actions from this data:
1. "Leaky bucket" products need better images, descriptions, or pricing
2. "Hidden gem" products should get ad spend — they convert but lack traffic
3. Search terms reveal unmet demand — gaps in your catalog or navigation
4. Category conversion rates tell you where to focus merchandising efforts
5. New vs returning user split informs your acquisition vs retention budget
""")
