"""
Brevo Campaign Audit — Stehlen Auto
=====================================
Pulls all email campaign data directly from the Brevo API to diagnose
why tens of thousands of reactivation emails produced zero sales.

What this script pulls:
  1. All email campaigns (last 90 days, all statuses)
  2. Per-campaign delivery stats: delivered, opens, clicks, bounces, spam, unsubs
  3. Per-campaign link-level click data (which URLs were clicked)
  4. Sender list + domain authentication status
  5. Contact list sizes and blocklist counts
  6. Transactional SMTP event log (last 30 days)

Outputs:
  data/analytics/brevo_campaigns.csv          — one row per campaign, all metrics
  data/analytics/brevo_links.csv              — one row per clicked link per campaign
  data/analytics/brevo_smtp_events.csv        — transactional event log
  data/analytics/brevo_lists.csv              — contact list sizes
  data/analytics/brevo_senders.csv            — sender/domain auth status

Run:
  cd "/path/to/Shopify-Storefront-Lovable"
  python3 marketing/analytics/brevo_campaign_audit.py

Requires: requests, python-dotenv, pandas  (all available in system Python3)
"""

import os
import sys
import json
import time
import textwrap
from datetime import datetime, timedelta, timezone
from pathlib import Path

import requests
import pandas as pd
from dotenv import load_dotenv
from typing import Optional, List, Dict, Any

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(BASE_DIR / ".env")

BREVO_API_KEY = os.getenv("BREVO_API_KEY")
if not BREVO_API_KEY:
    sys.exit("ERROR: BREVO_API_KEY not found in .env")

BREVO_BASE = "https://api.brevo.com/v3"
HEADERS = {
    "accept": "application/json",
    "api-key": BREVO_API_KEY,
}

OUTPUT_DIR = BASE_DIR / "data" / "analytics"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# How far back to look for campaigns (days)
CAMPAIGN_LOOKBACK_DAYS = 90
# How far back to pull SMTP event log (days, max 90 per Brevo docs)
SMTP_LOOKBACK_DAYS = 30

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def brevo_get(path: str, params: Optional[Dict[str, Any]] = None, retries: int = 3) -> Any:
    """GET from Brevo API with basic retry on 429/5xx."""
    url = f"{BREVO_BASE}{path}"
    for attempt in range(retries):
        resp = requests.get(url, headers=HEADERS, params=params or {}, timeout=30)
        if resp.status_code == 429:
            wait = int(resp.headers.get("Retry-After", 2))
            print(f"  Rate limited — sleeping {wait}s...")
            time.sleep(wait)
            continue
        if resp.status_code >= 500:
            time.sleep(2 ** attempt)
            continue
        resp.raise_for_status()
        return resp.json()
    resp.raise_for_status()
    return {}


def safe_rate(numerator, denominator, decimals: int = 2) -> float:
    """Return pct rate, 0.0 if denominator is zero."""
    try:
        n, d = float(numerator), float(denominator)
        return round(n / d * 100, decimals) if d else 0.0
    except (TypeError, ValueError):
        return 0.0


def print_header(title: str) -> None:
    bar = "=" * 72
    print(f"\n{bar}")
    print(f"  {title}")
    print(bar)


def print_subheader(title: str) -> None:
    print(f"\n--- {title} ---")


# ---------------------------------------------------------------------------
# 1. Fetch all campaigns (paginated)
# ---------------------------------------------------------------------------

def fetch_all_campaigns() -> List[Dict[str, Any]]:
    """
    GET /emailCampaigns
    Returns all campaigns within the lookback window.
    Brevo paginates with limit/offset; max limit = 100.
    """
    print_header("1. FETCHING ALL EMAIL CAMPAIGNS")

    cutoff = datetime.now(timezone.utc) - timedelta(days=CAMPAIGN_LOOKBACK_DAYS)
    campaigns = []
    offset = 0
    limit = 100

    while True:
        params = {
            "status": "sent",       # Only sent campaigns have stats
            "limit": limit,
            "offset": offset,
            "sort": "desc",         # Newest first
        }
        data = brevo_get("/emailCampaigns", params=params)
        batch = data.get("campaigns", [])

        if not batch:
            break

        for c in batch:
            # scheduledAt or sentAt — check both fields
            sent_raw = c.get("sentDate") or c.get("scheduledAt") or ""
            if sent_raw:
                try:
                    sent_dt = datetime.fromisoformat(sent_raw.replace("Z", "+00:00"))
                    if sent_dt < cutoff:
                        # Past the lookback window — stop paginating
                        print(f"  Reached lookback cutoff at offset {offset}")
                        return campaigns
                except ValueError:
                    pass
            campaigns.append(c)

        print(f"  Fetched {len(campaigns)} campaigns so far (offset {offset})")

        if len(batch) < limit:
            break
        offset += limit

    # Also fetch draft/scheduled/suspended so we can see everything
    for extra_status in ("draft", "queued", "suspended"):
        try:
            params = {"status": extra_status, "limit": 100, "offset": 0}
            data = brevo_get("/emailCampaigns", params=params)
            extra = data.get("campaigns", [])
            if extra:
                print(f"  Found {len(extra)} {extra_status} campaigns")
                campaigns.extend(extra)
        except requests.HTTPError:
            pass  # Some statuses may not exist

    print(f"\n  Total campaigns fetched: {len(campaigns)}")
    return campaigns


# ---------------------------------------------------------------------------
# 2. Fetch per-campaign detailed statistics
# ---------------------------------------------------------------------------

def fetch_campaign_stats(campaign_id: int) -> dict:
    """
    GET /emailCampaigns/{campaignId}
    Returns the full campaign object including globalStats.
    The statistics=globalStats parameter returns aggregated delivery stats.
    """
    try:
        data = brevo_get(
            f"/emailCampaigns/{campaign_id}",
            params={"statistics": "globalStats", "excludeHtmlContent": "true"},
        )
        return data
    except requests.HTTPError as e:
        print(f"    WARNING: Could not fetch stats for campaign {campaign_id}: {e}")
        return {}


def fetch_campaign_links(campaign_id: int) -> List[Dict[str, Any]]:
    """
    GET /emailCampaigns/{campaignId}?statistics=linksStats
    Returns per-URL click counts. Critical for diagnosing where emails sent traffic.
    """
    try:
        data = brevo_get(
            f"/emailCampaigns/{campaign_id}",
            params={"statistics": "linksStats", "excludeHtmlContent": "true"},
        )
        links_raw = data.get("statistics", {}).get("linksStats", {})
        # linksStats is a dict: { "url": click_count, ... }
        # Normalize to list of dicts
        if isinstance(links_raw, dict):
            return [
                {"url": url, "clicks": count}
                for url, count in links_raw.items()
            ]
        return []
    except requests.HTTPError as e:
        print(f"    WARNING: Could not fetch links for campaign {campaign_id}: {e}")
        return []


# ---------------------------------------------------------------------------
# 3. Build campaign DataFrame
# ---------------------------------------------------------------------------

def build_campaigns_df(campaigns: List[Dict[str, Any]]) -> pd.DataFrame:
    """Flatten campaign objects + stats into a single DataFrame."""
    print_header("2. ENRICHING CAMPAIGNS WITH STATS")
    rows = []

    for i, c in enumerate(campaigns):
        cid = c.get("id")
        print(f"  [{i+1}/{len(campaigns)}] Campaign {cid}: {c.get('name', '(no name)')[:60]}")

        # Fetch full stats object (separate call needed for globalStats detail)
        full = fetch_campaign_stats(cid) if cid else {}
        stats = full.get("statistics", {}).get("globalStats", {})

        # Core identity
        sent_raw = c.get("sentDate") or c.get("scheduledAt") or ""
        subject = c.get("subject", "")
        recipients = c.get("recipients", {})
        list_ids = recipients.get("lists", [])
        excluded = recipients.get("exclusionLists", [])

        # Delivery numbers — Brevo field names from their SDK
        delivered   = stats.get("delivered", 0) or 0
        bounces     = stats.get("hardBounces", 0) + stats.get("softBounces", 0) \
                      if stats.get("hardBounces") is not None else stats.get("bounces", 0) or 0
        hard_bounces = stats.get("hardBounces", 0) or 0
        soft_bounces = stats.get("softBounces", 0) or 0
        opens_total = stats.get("opened", 0) or 0
        opens_unique = stats.get("uniqueOpened", 0) or 0
        clicks_total = stats.get("clicked", 0) or 0
        clicks_unique = stats.get("uniqueClicks", 0) or 0
        spam        = stats.get("spamReports", 0) or 0
        unsub       = stats.get("unsubscriptions", 0) or 0
        # Some Brevo accounts expose "recipients" count in globalStats
        recipients_count = stats.get("recipients", 0) or c.get("statistics", {}).get("globalStats", {}).get("recipients", 0) or 0

        # Derived rates
        deliver_rate  = safe_rate(delivered, recipients_count or (delivered + bounces))
        open_rate     = safe_rate(opens_unique, delivered)
        click_rate    = safe_rate(clicks_unique, delivered)
        ctor          = safe_rate(clicks_unique, opens_unique)   # Click-to-open rate
        bounce_rate   = safe_rate(bounces, recipients_count or (delivered + bounces))
        spam_rate     = safe_rate(spam, delivered)
        unsub_rate    = safe_rate(unsub, delivered)

        rows.append({
            "campaign_id":        cid,
            "campaign_name":      c.get("name", ""),
            "subject":            subject,
            "status":             c.get("status", ""),
            "sent_date":          sent_raw,
            "list_ids":           str(list_ids),
            "excluded_list_ids":  str(excluded),
            # Volumes
            "recipients":         recipients_count,
            "delivered":          delivered,
            "hard_bounces":       hard_bounces,
            "soft_bounces":       soft_bounces,
            "total_bounces":      bounces,
            "opens_total":        opens_total,
            "opens_unique":       opens_unique,
            "clicks_total":       clicks_total,
            "clicks_unique":      clicks_unique,
            "spam_complaints":    spam,
            "unsubscribes":       unsub,
            # Rates (%)
            "deliver_rate_pct":   deliver_rate,
            "open_rate_pct":      open_rate,
            "click_rate_pct":     click_rate,
            "ctor_pct":           ctor,
            "bounce_rate_pct":    bounce_rate,
            "spam_rate_pct":      spam_rate,
            "unsub_rate_pct":     unsub_rate,
        })

        # Small sleep to stay well inside rate limits
        time.sleep(0.25)

    df = pd.DataFrame(rows)
    return df


# ---------------------------------------------------------------------------
# 4. Link-level click data
# ---------------------------------------------------------------------------

def build_links_df(campaigns: List[Dict[str, Any]]) -> pd.DataFrame:
    """Fetch per-URL click breakdown for every campaign."""
    print_header("3. FETCHING LINK-LEVEL CLICK DATA")
    rows = []

    for c in campaigns:
        cid = c.get("id")
        if not cid:
            continue
        links = fetch_campaign_links(cid)
        if links:
            print(f"  Campaign {cid} ({c.get('name', '')[:50]}): {len(links)} unique links")
            for link in links:
                rows.append({
                    "campaign_id":   cid,
                    "campaign_name": c.get("name", ""),
                    "sent_date":     c.get("sentDate") or c.get("scheduledAt") or "",
                    "url":           link.get("url", ""),
                    "clicks":        link.get("clicks", 0),
                })
        time.sleep(0.25)

    df = pd.DataFrame(rows) if rows else pd.DataFrame(
        columns=["campaign_id", "campaign_name", "sent_date", "url", "clicks"]
    )
    return df


# ---------------------------------------------------------------------------
# 5. Senders + domain auth
# ---------------------------------------------------------------------------

def fetch_senders() -> pd.DataFrame:
    """GET /senders — list all senders with domain auth status."""
    print_header("4. CHECKING SENDERS & DOMAIN AUTHENTICATION")
    try:
        data = brevo_get("/senders")
        senders = data.get("senders", [])
        rows = []
        for s in senders:
            rows.append({
                "sender_id":    s.get("id"),
                "name":         s.get("name", ""),
                "email":        s.get("email", ""),
                "active":       s.get("active", False),
                "ips":          str(s.get("ips", [])),
            })
        df = pd.DataFrame(rows) if rows else pd.DataFrame()
        print(f"  Found {len(rows)} senders")
        return df
    except requests.HTTPError as e:
        print(f"  WARNING: Could not fetch senders: {e}")
        return pd.DataFrame()


def fetch_domains() -> pd.DataFrame:
    """GET /senders/domains — per-domain DKIM/SPF/DMARC auth status."""
    try:
        data = brevo_get("/senders/domains")
        domains = data.get("domains", [])
        rows = []
        for d in domains:
            auth = d.get("dkim_record", {}) or {}
            rows.append({
                "domain":           d.get("domain_name", ""),
                "authenticated":    d.get("authenticated", False),
                "dkim_valid":       auth.get("valid", None),
                "dkim_value":       auth.get("value", ""),
                "spf_valid":        d.get("spf", {}).get("valid", None) if isinstance(d.get("spf"), dict) else None,
            })
        df = pd.DataFrame(rows) if rows else pd.DataFrame()
        if not df.empty:
            print(f"  Found {len(rows)} configured domains")
        return df
    except requests.HTTPError as e:
        print(f"  NOTE: /senders/domains not accessible ({e}) — check Brevo dashboard manually")
        return pd.DataFrame()


# ---------------------------------------------------------------------------
# 6. Contact lists
# ---------------------------------------------------------------------------

def fetch_contact_lists() -> pd.DataFrame:
    """GET /contacts/lists — list names, sizes, and any blocklist indicators."""
    print_header("5. CONTACT LIST STATS")
    try:
        all_lists = []
        offset = 0
        limit = 50
        while True:
            data = brevo_get("/contacts/lists", params={"limit": limit, "offset": offset})
            batch = data.get("lists", [])
            if not batch:
                break
            all_lists.extend(batch)
            if len(batch) < limit:
                break
            offset += limit

        rows = []
        for lst in all_lists:
            rows.append({
                "list_id":          lst.get("id"),
                "list_name":        lst.get("name", ""),
                "total_contacts":   lst.get("totalSubscribers", 0),
                "unique_contacts":  lst.get("uniqueSubscribers", 0),
                "folder_id":        lst.get("folderId"),
                "created_at":       lst.get("createdAt", ""),
                "updated_at":       lst.get("updatedAt", ""),
            })

        df = pd.DataFrame(rows) if rows else pd.DataFrame()
        print(f"  Found {len(rows)} contact lists")
        return df
    except requests.HTTPError as e:
        print(f"  WARNING: Could not fetch contact lists: {e}")
        return pd.DataFrame()


def fetch_blocklist_count() -> int:
    """GET /contacts — count contacts with emailBlacklisted=true."""
    try:
        data = brevo_get(
            "/contacts",
            params={"emailBlacklisted": "true", "limit": 1, "offset": 0},
        )
        return data.get("count", 0)
    except requests.HTTPError:
        return -1


# ---------------------------------------------------------------------------
# 7. SMTP transactional event log
# ---------------------------------------------------------------------------

def fetch_smtp_events() -> pd.DataFrame:
    """
    GET /smtp/statistics/events
    Last N days of transactional email events (not campaign events — but
    reveals bounces, spam traps, and domain reputation signals from any
    automated emails like order confirmations).
    """
    print_header("6. TRANSACTIONAL SMTP EVENT LOG (last 30 days)")
    start_date = (datetime.now(timezone.utc) - timedelta(days=SMTP_LOOKBACK_DAYS)).strftime("%Y-%m-%d")
    end_date   = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    all_events = []
    offset = 0
    limit = 500

    try:
        while True:
            params = {
                "startDate": start_date,
                "endDate":   end_date,
                "limit":     limit,
                "offset":    offset,
            }
            data = brevo_get("/smtp/statistics/events", params=params)
            events = data.get("events", [])
            if not events:
                break
            all_events.extend(events)
            print(f"  Fetched {len(all_events)} SMTP events so far...")
            if len(events) < limit:
                break
            offset += limit

        if not all_events:
            print("  No transactional SMTP events found for this period.")
            return pd.DataFrame()

        rows = []
        for e in all_events:
            rows.append({
                "event":      e.get("event", ""),
                "email":      e.get("email", ""),
                "subject":    e.get("subject", ""),
                "date":       e.get("date", ""),
                "message_id": e.get("messageId", ""),
                "reason":     e.get("reason", ""),
                "tag":        e.get("tag", ""),
                "ip":         e.get("ip", ""),
                "from":       e.get("from", ""),
            })
        df = pd.DataFrame(rows)
        print(f"  Total SMTP events: {len(df)}")
        return df

    except requests.HTTPError as e:
        print(f"  WARNING: Could not fetch SMTP events: {e}")
        return pd.DataFrame()


# ---------------------------------------------------------------------------
# 8. Print human-readable report
# ---------------------------------------------------------------------------

INDUSTRY_BENCHMARKS = {
    "open_rate_pct":   ("Open Rate", 20.0, ">="),
    "click_rate_pct":  ("Click Rate", 2.5,  ">="),
    "ctor_pct":        ("CTOR",       10.0, ">="),
    "bounce_rate_pct": ("Bounce Rate", 2.0,  "<="),
    "spam_rate_pct":   ("Spam Rate",   0.1,  "<="),
    "unsub_rate_pct":  ("Unsub Rate",  0.5,  "<="),
}


def diagnose_campaign(row: pd.Series) -> str:
    """
    Return a one-line diagnosis string based on the campaign's metrics.

    Decision tree:
      1. If delivered == 0: delivery failure — never left Brevo
      2. If bounce_rate > 10%: severe list quality / domain rep problem
      3. If open_rate < 5%: deliverability problem (spam folder, bad domain rep, wrong time)
      4. If open_rate >= 5% and click_rate < 0.5%: landing page / CTA problem
      5. If click_rate >= 0.5% and no purchases: landing page or checkout conversion problem
      6. Healthy benchmarks met: check downstream (pricing, product, mobile UX)
    """
    delivered    = row.get("delivered", 0) or 0
    open_rate    = row.get("open_rate_pct", 0) or 0
    click_rate   = row.get("click_rate_pct", 0) or 0
    bounce_rate  = row.get("bounce_rate_pct", 0) or 0
    spam_rate    = row.get("spam_rate_pct", 0) or 0
    ctor         = row.get("ctor_pct", 0) or 0
    recipients   = row.get("recipients", 0) or 0

    if delivered == 0 and recipients > 0:
        return "CRITICAL: 0 delivered — emails never sent or blocked at ISP level"
    if delivered == 0:
        return "WARNING: No delivery data (campaign may be draft/queued)"
    if bounce_rate > 10:
        return f"CRITICAL: {bounce_rate:.1f}% bounce rate — list quality or domain reputation destroyed"
    if bounce_rate > 5:
        return f"WARNING: {bounce_rate:.1f}% bounce rate — list needs cleaning before next send"
    if spam_rate > 0.3:
        return f"CRITICAL: {spam_rate:.2f}% spam rate — Gmail/Yahoo will throttle/block domain"
    if open_rate < 5:
        return f"DELIVERABILITY PROBLEM: {open_rate:.1f}% open rate — emails hitting spam folder (industry avg: 20-25%)"
    if open_rate < 15:
        return f"WEAK DELIVERABILITY: {open_rate:.1f}% open rate — partial spam folder delivery, check DKIM/DMARC"
    if click_rate < 0.5 and open_rate >= 15:
        return f"CONTENT/CTA PROBLEM: Good opens ({open_rate:.1f}%) but {click_rate:.2f}% clicks — weak subject-body alignment or buried CTA"
    if click_rate >= 0.5 and ctor < 5:
        return f"ENGAGEMENT MISMATCH: Opens OK ({open_rate:.1f}%), CTOR {ctor:.1f}% — click bots or mobile preview opens inflating opens"
    if click_rate >= 0.5:
        return f"LANDING PAGE / CHECKOUT PROBLEM: Email engagement OK ({open_rate:.1f}% open, {click_rate:.2f}% CTR) — investigate destination URL, mobile UX, price vs. expectation"
    return f"CHECK REQUIRED: open={open_rate:.1f}%, click={click_rate:.2f}%, bounce={bounce_rate:.1f}%"


def print_full_report(
    campaigns_df: pd.DataFrame,
    links_df: pd.DataFrame,
    senders_df: pd.DataFrame,
    domains_df: pd.DataFrame,
    lists_df: pd.DataFrame,
    blocklist_count: int,
    smtp_df: pd.DataFrame,
) -> None:

    print_header("STEHLEN AUTO — BREVO EMAIL AUDIT REPORT")
    print(f"  Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"  Lookback: {CAMPAIGN_LOOKBACK_DAYS} days")

    # ---- Senders ----
    print_subheader("SENDERS")
    if not senders_df.empty:
        for _, s in senders_df.iterrows():
            status = "ACTIVE" if s.get("active") else "INACTIVE"
            print(f"  [{status}] {s.get('name', '')} <{s.get('email', '')}>")
    else:
        print("  No sender data available.")

    # ---- Domain Auth ----
    print_subheader("DOMAIN AUTHENTICATION")
    if not domains_df.empty:
        for _, d in domains_df.iterrows():
            auth_status = "AUTHENTICATED" if d.get("authenticated") else "NOT AUTHENTICATED"
            dkim = "DKIM: OK" if d.get("dkim_valid") else "DKIM: FAIL/UNKNOWN"
            spf  = "SPF: OK" if d.get("spf_valid") else "SPF: FAIL/UNKNOWN"
            print(f"  {d.get('domain', '')}: {auth_status} | {dkim} | {spf}")
    else:
        print("  Domain auth endpoint not accessible via API key.")
        print("  ACTION: Verify in Brevo dashboard -> Senders & IP -> Sending Domains")

    # ---- Contact Lists ----
    print_subheader("CONTACT LISTS")
    if not lists_df.empty:
        total_contacts = lists_df["total_contacts"].sum()
        print(f"  {'List Name':<45} {'Total':>10} {'Unique':>10}")
        print(f"  {'-'*45} {'-'*10} {'-'*10}")
        for _, lst in lists_df.sort_values("total_contacts", ascending=False).iterrows():
            print(
                f"  {str(lst.get('list_name','')):<45} "
                f"{int(lst.get('total_contacts',0)):>10,} "
                f"{int(lst.get('unique_contacts',0)):>10,}"
            )
        print(f"\n  TOTAL CONTACTS ACROSS ALL LISTS: {total_contacts:,}")
        if blocklist_count >= 0:
            print(f"  BLOCKLISTED (email unsubscribed/hard-bounced): {blocklist_count:,}")
    else:
        print("  No list data available.")

    # ---- Campaign Table ----
    print_subheader("EMAIL CAMPAIGNS (sent last 90 days)")
    if campaigns_df.empty:
        print("  No sent campaigns found in the last 90 days.")
    else:
        for _, row in campaigns_df.sort_values("sent_date", ascending=False).iterrows():
            sent = row.get("sent_date", "")[:10]
            name = str(row.get("campaign_name", ""))[:55]
            subj = str(row.get("subject", ""))[:70]
            recip     = int(row.get("recipients", 0) or 0)
            delivered = int(row.get("delivered", 0) or 0)
            opens_u   = int(row.get("opens_unique", 0) or 0)
            clicks_u  = int(row.get("clicks_unique", 0) or 0)
            clicks_t  = int(row.get("clicks_total", 0) or 0)
            bounces   = int(row.get("total_bounces", 0) or 0)
            hard_b    = int(row.get("hard_bounces", 0) or 0)
            soft_b    = int(row.get("soft_bounces", 0) or 0)
            spam      = int(row.get("spam_complaints", 0) or 0)
            unsub     = int(row.get("unsubscribes", 0) or 0)
            open_r    = float(row.get("open_rate_pct", 0) or 0)
            click_r   = float(row.get("click_rate_pct", 0) or 0)
            ctor_r    = float(row.get("ctor_pct", 0) or 0)
            bounce_r  = float(row.get("bounce_rate_pct", 0) or 0)
            spam_r    = float(row.get("spam_rate_pct", 0) or 0)
            unsub_r   = float(row.get("unsub_rate_pct", 0) or 0)

            diagnosis = diagnose_campaign(row)

            print(f"""
  +-----------------------------------------------------------------+
  Campaign:   {name}
  Subject:    {subj}
  Sent:       {sent}   Status: {row.get('status','').upper()}
  -----------------------------------------------------------------
  Recipients: {recip:>10,}    Delivered:  {delivered:>10,}  ({row.get('deliver_rate_pct',0):.1f}%)
  Opens (u):  {opens_u:>10,}    Open Rate:  {open_r:>10.1f}%  (industry: ~22%)
  Clicks (u): {clicks_u:>10,}    Click Rate: {click_r:>10.2f}%  (industry: ~2.5%)
  Clicks (t): {clicks_t:>10,}    CTOR:       {ctor_r:>10.1f}%  (industry: ~10%)
  Bounces:    {bounces:>10,}    Bounce Rt:  {bounce_r:>10.1f}%  (target: <2%)
    Hard:     {hard_b:>10,}    Spam Rt:    {spam_r:>10.2f}%  (target: <0.1%)
    Soft:     {soft_b:>10,}    Unsub Rt:   {unsub_r:>10.2f}%  (target: <0.5%)
  Spam Cmpl: {spam:>10,}    Unsubscr:   {unsub:>10,}
  -----------------------------------------------------------------
  DIAGNOSIS:  {diagnosis}
  +-----------------------------------------------------------------+""")

    # ---- Link Click Breakdown ----
    print_subheader("LINK-LEVEL CLICK DATA (where did emails send people?)")
    if links_df.empty:
        print("  No link click data available (campaigns may have 0 clicks or data unavailable).")
    else:
        for cid, group in links_df.groupby("campaign_id"):
            cname = group.iloc[0].get("campaign_name", "")
            sent  = str(group.iloc[0].get("sent_date", ""))[:10]
            total_clicks = group["clicks"].sum()
            print(f"\n  Campaign {cid}: {cname[:55]} ({sent}) — {total_clicks} total clicks")
            print(f"  {'Clicks':>8}  {'%':>6}  URL")
            print(f"  {'-------':>8}  {'------':>6}  ---")
            for _, link in group.sort_values("clicks", ascending=False).iterrows():
                pct = safe_rate(link["clicks"], total_clicks)
                url = str(link.get("url", ""))
                # Truncate very long URLs for display
                url_display = url[:90] + "..." if len(url) > 90 else url
                print(f"  {int(link['clicks']):>8,}  {pct:>5.1f}%  {url_display}")

    # ---- SMTP Events Summary ----
    print_subheader("TRANSACTIONAL SMTP EVENT SUMMARY (last 30 days)")
    if smtp_df.empty:
        print("  No transactional SMTP events in this period.")
    else:
        summary = smtp_df.groupby("event").size().sort_values(ascending=False)
        print(f"  {'Event':<25} {'Count':>8}")
        print(f"  {'-'*25} {'-'*8}")
        for event, count in summary.items():
            print(f"  {event:<25} {count:>8,}")

        # Bounce reasons — top 10
        bounced = smtp_df[smtp_df["event"].str.lower().str.contains("bounce", na=False)]
        if not bounced.empty:
            print(f"\n  Top bounce reasons:")
            reasons = bounced["reason"].value_counts().head(10)
            for reason, cnt in reasons.items():
                if reason:
                    print(f"    {cnt:>6,}  {reason}")

    # ---- Overall Diagnosis ----
    print_header("OVERALL DIAGNOSIS")
    if not campaigns_df.empty:
        # Aggregate across all sent campaigns
        total_recip     = campaigns_df["recipients"].sum()
        total_delivered = campaigns_df["delivered"].sum()
        total_opens     = campaigns_df["opens_unique"].sum()
        total_clicks    = campaigns_df["clicks_unique"].sum()
        total_bounces   = campaigns_df["total_bounces"].sum()
        total_spam      = campaigns_df["spam_complaints"].sum()
        total_unsub     = campaigns_df["unsubscribes"].sum()

        overall_open_rate  = safe_rate(total_opens, total_delivered)
        overall_click_rate = safe_rate(total_clicks, total_delivered)
        overall_ctor       = safe_rate(total_clicks, total_opens)
        overall_bounce_rate = safe_rate(total_bounces, total_recip or total_delivered)
        overall_spam_rate  = safe_rate(total_spam, total_delivered)

        print(f"""
  AGGREGATE ACROSS ALL {len(campaigns_df)} CAMPAIGNS:
  Total Recipients:  {int(total_recip):>12,}
  Total Delivered:   {int(total_delivered):>12,}
  Total Opens (u):   {int(total_opens):>12,}   Open Rate:  {overall_open_rate:.1f}%
  Total Clicks (u):  {int(total_clicks):>12,}   Click Rate: {overall_click_rate:.2f}%  CTOR: {overall_ctor:.1f}%
  Total Bounces:     {int(total_bounces):>12,}   Bounce Rt:  {overall_bounce_rate:.1f}%
  Spam Complaints:   {int(total_spam):>12,}   Spam Rt:    {overall_spam_rate:.2f}%
  Unsubscribes:      {int(total_unsub):>12,}
""")

        # Determine primary failure mode
        if total_delivered == 0:
            primary = "CRITICAL: Zero delivery across all campaigns. Sending domain blocked or API misconfigured."
        elif overall_bounce_rate > 10:
            primary = (
                f"PRIMARY FAILURE: {overall_bounce_rate:.1f}% aggregate bounce rate.\n"
                "  This indicates the list contains a massive proportion of invalid, "
                "stale, or spam-trap addresses.\n"
                "  eBay/Amazon buyer emails go stale fast — 2-4 year old lists routinely hit 15-30% bounce.\n"
                "  IMMEDIATE ACTIONS:\n"
                "    1. Run the full list through MillionVerifier (key in .env: MILLIONVERIFIER_API_KEY)\n"
                "    2. Hard-remove all hard bounces from Brevo immediately\n"
                "    3. Do NOT send again until bounce rate drops below 2%\n"
                "    4. Check if Brevo has paused your sending (account suspended in UI)"
            )
        elif overall_spam_rate > 0.3:
            primary = (
                f"PRIMARY FAILURE: {overall_spam_rate:.2f}% spam complaint rate.\n"
                "  Gmail/Yahoo threshold is 0.1%. You are 3x over the limit.\n"
                "  IMMEDIATE ACTIONS:\n"
                "    1. Stop all sends immediately\n"
                "    2. Check Brevo account for suspension notice\n"
                "    3. Domain reputation likely damaged — check Google Postmaster Tools\n"
                "    4. Implement double opt-in for all new contacts going forward"
            )
        elif overall_open_rate < 5:
            primary = (
                f"PRIMARY FAILURE: {overall_open_rate:.1f}% open rate (industry avg: 20-25%).\n"
                "  Emails are reaching inboxes but being classified as spam, OR going to\n"
                "  unmonitored secondary inboxes (common with old eBay/Amazon buyer lists).\n"
                "  LIKELY CAUSES:\n"
                "    - Sending to cold/disengaged list with no prior relationship on stehlenauto.com\n"
                "    - Missing or broken DKIM/DMARC on send.stehlenauto.com\n"
                "    - Brevo shared IP reputation issues\n"
                "    - Subject lines triggering spam filters (check for all-caps, symbols, $$$)\n"
                "  ACTIONS:\n"
                "    1. Send a test to your own Gmail/Outlook — check spam folder\n"
                "    2. Run subject line through mail-tester.com\n"
                "    3. Verify DKIM in Brevo dashboard -> Senders & IP -> Sending Domains\n"
                "    4. Consider a dedicated IP if volume > 100K/month"
            )
        elif overall_click_rate < 0.5:
            primary = (
                f"SECONDARY FAILURE: Opens are {overall_open_rate:.1f}% (acceptable) but CTR is "
                f"{overall_click_rate:.2f}%.\n"
                "  People are opening but not clicking. This is a content/CTA problem.\n"
                "  LIKELY CAUSES:\n"
                "    - Email body doesn't match subject line promise\n"
                "    - Single vague CTA ('Shop Now') vs. specific offer\n"
                "    - No urgency, no scarcity, no compelling offer\n"
                "    - Mobile layout broken (button too small, images not loading)\n"
                "  ACTIONS:\n"
                "    1. Screenshot the campaign on mobile (iOS + Android) — check CTA visibility\n"
                "    2. Test with a hard offer: '20% off + free shipping, 48 hours only'\n"
                "    3. Deep-link to specific product pages, not homepage\n"
                "    4. Check link click report above — where did the few clickers go?"
            )
        else:
            primary = (
                f"LANDING PAGE / CHECKOUT PROBLEM: Email metrics are acceptable "
                f"({overall_open_rate:.1f}% open, {overall_click_rate:.2f}% CTR).\n"
                "  Traffic reached the site but did not convert. Check:\n"
                "    1. GA4 Brevo segment funnel (already in data/analytics/ga4_brevo_full_analysis.csv)\n"
                "    2. Landing page — does it match the email's product/offer?\n"
                "    3. YMM fitment selector friction — do users get lost before finding the right product?\n"
                "    4. Checkout redirect — is the handoff to stehlenauto.myshopify.com working?\n"
                "    5. Pricing — were reactivation prices competitive vs. Amazon/eBay?"
            )

        print(f"  {primary}")

    print(f"\n{'='*72}\n")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    print_header("BREVO CAMPAIGN AUDIT — STEHLEN AUTO")
    print(f"  API Key: {BREVO_API_KEY[:12]}...{BREVO_API_KEY[-4:]}")
    print(f"  Output directory: {OUTPUT_DIR}")

    # 1. Fetch campaigns
    campaigns = fetch_all_campaigns()

    # 2. Build stats DataFrame
    campaigns_df = build_campaigns_df(campaigns) if campaigns else pd.DataFrame()

    # 3. Link-level click data
    sent_campaigns = [c for c in campaigns if c.get("status") == "sent"]
    links_df = build_links_df(sent_campaigns)

    # 4. Senders + domains
    senders_df = fetch_senders()
    domains_df = fetch_domains()

    # 5. Contact lists
    lists_df = fetch_contact_lists()
    blocklist_count = fetch_blocklist_count()

    # 6. SMTP events
    smtp_df = fetch_smtp_events()

    # 7. Print human-readable report
    print_full_report(
        campaigns_df, links_df, senders_df, domains_df,
        lists_df, blocklist_count, smtp_df
    )

    # 8. Save CSVs
    print_header("SAVING OUTPUT FILES")

    path_campaigns = OUTPUT_DIR / "brevo_campaigns.csv"
    path_links     = OUTPUT_DIR / "brevo_links.csv"
    path_smtp      = OUTPUT_DIR / "brevo_smtp_events.csv"
    path_lists     = OUTPUT_DIR / "brevo_lists.csv"
    path_senders   = OUTPUT_DIR / "brevo_senders.csv"

    if not campaigns_df.empty:
        campaigns_df.to_csv(path_campaigns, index=False)
        print(f"  Saved: {path_campaigns}  ({len(campaigns_df)} rows)")
    else:
        print("  No campaign data to save.")

    if not links_df.empty:
        links_df.to_csv(path_links, index=False)
        print(f"  Saved: {path_links}  ({len(links_df)} rows)")
    else:
        print("  No link click data to save.")

    if not smtp_df.empty:
        smtp_df.to_csv(path_smtp, index=False)
        print(f"  Saved: {path_smtp}  ({len(smtp_df)} rows)")
    else:
        print("  No SMTP event data to save.")

    if not lists_df.empty:
        lists_df.to_csv(path_lists, index=False)
        print(f"  Saved: {path_lists}  ({len(lists_df)} rows)")

    if not senders_df.empty:
        senders_df.to_csv(path_senders, index=False)
        print(f"  Saved: {path_senders}  ({len(senders_df)} rows)")

    print(f"\n  Done.\n")


if __name__ == "__main__":
    main()
