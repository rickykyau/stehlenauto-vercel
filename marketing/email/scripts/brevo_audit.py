"""
Brevo Contact & Campaign Audit
-------------------------------
Task 1: Contact counts (total, blocklisted, unsubscribed, contactable), by list
Task 2: Unblocklist contacts that are NOT manually unsubscribed
Task 3: Merge-tag health — check VEHICLE_MAKE / VEHICLE_MODEL population
Task 4: Campaign audit — CTA links, merge tags, status
Task 5: Output to data/analytics/brevo_contact_audit.csv and update
        data/analytics/ga4_brevo_full_analysis.csv

SAFETY: This script NEVER calls sendNow. All scheduling uses scheduledAt only.
"""

import os
import sys
import json
import csv
import time
import urllib.parse
from datetime import datetime, timezone

import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.environ["BREVO_API_KEY"]
BASE = "https://api.brevo.com/v3"
HEADERS = {
    "api-key": API_KEY,
    "Content-Type": "application/json",
    "Accept": "application/json",
}

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ANALYTICS_DIR = os.path.join(BASE_DIR, "data", "analytics")

# ──────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────

def get(path, params=None):
    url = BASE + path
    r = requests.get(url, headers=HEADERS, params=params, timeout=30)
    if r.status_code == 429:
        print("  [rate-limit] sleeping 60s...")
        time.sleep(60)
        r = requests.get(url, headers=HEADERS, params=params, timeout=30)
    r.raise_for_status()
    return r.json()

def post(path, body):
    url = BASE + path
    r = requests.post(url, headers=HEADERS, json=body, timeout=30)
    if r.status_code == 429:
        print("  [rate-limit] sleeping 60s...")
        time.sleep(60)
        r = requests.post(url, headers=HEADERS, json=body, timeout=30)
    r.raise_for_status()
    return r.json() if r.content else {}

def put(path, body):
    url = BASE + path
    r = requests.put(url, headers=HEADERS, json=body, timeout=30)
    if r.status_code == 429:
        time.sleep(60)
        r = requests.put(url, headers=HEADERS, json=body, timeout=30)
    # 204 = no content = success
    if r.status_code == 204:
        return {}
    r.raise_for_status()
    return r.json() if r.content else {}


# ──────────────────────────────────────────────────────────────
# TASK 1: Contact Counts
# ──────────────────────────────────────────────────────────────

def task1_contact_counts():
    print("\n" + "="*60)
    print("TASK 1: CONTACT COUNTS")
    print("="*60)

    # -- Total contacts --
    info = get("/account")
    plan_info = info.get("plan", [])
    print(f"  Account: {info.get('companyName','?')} / {info.get('email','?')}")

    # Use /contacts with limit=1 just to get the count
    r_total = get("/contacts", {"limit": 1, "offset": 0})
    total = r_total.get("count", 0)
    print(f"  Total contacts: {total}")

    # -- Blocklisted (emailBlacklisted=true) --
    # Brevo allows filtering by emailBlacklisted=true
    r_bl = get("/contacts", {"limit": 1, "offset": 0, "emailBlacklisted": "true"})
    blocklisted = r_bl.get("count", 0)
    print(f"  Blocklisted (emailBlacklisted=true): {blocklisted}")

    # -- Unsubscribed --
    # Pull from unsubscribes endpoint
    try:
        r_unsub = get("/contacts/unsubscribed", {"limit": 1, "startDate": "2020-01-01", "endDate": "2030-01-01"})
        unsubscribed = r_unsub.get("count", 0)
    except Exception as e:
        print(f"  [warn] unsubscribed endpoint error: {e}")
        unsubscribed = "N/A"
    print(f"  Unsubscribed (hard opt-out): {unsubscribed}")

    # -- Contactable = total - blocklisted - unsubscribed --
    if isinstance(unsubscribed, int) and isinstance(blocklisted, int):
        contactable = total - blocklisted
        print(f"  Contactable (not blocklisted): {contactable}")
        # Note: blocklisted already includes unsubscribers in Brevo's model
    else:
        contactable = "N/A"
        print(f"  Contactable: N/A (could not compute)")

    # -- Lists --
    print("\n  --- Lists ---")
    r_lists = get("/contacts/lists", {"limit": 50})
    lists = r_lists.get("lists", [])
    list_rows = []
    for lst in lists:
        lid = lst.get("id")
        name = lst.get("name", "?")
        total_subs = lst.get("totalSubscribers", 0)
        total_bl = lst.get("totalBlacklisted", 0)
        print(f"    List {lid}: {name!r} — {total_subs} subscribers, {total_bl} blocklisted")
        list_rows.append({
            "list_id": lid,
            "list_name": name,
            "total_subscribers": total_subs,
            "total_blocklisted": total_bl,
        })

    return {
        "total": total,
        "blocklisted": blocklisted,
        "unsubscribed": unsubscribed,
        "contactable": contactable,
        "lists": list_rows,
    }


# ──────────────────────────────────────────────────────────────
# TASK 2: Unblocklist contacts
# ──────────────────────────────────────────────────────────────

def task2_unblocklist(dry_run=False):
    """
    Fetch all blocklisted contacts and re-enable them via PUT /contacts/{email}
    with emailBlacklisted=false, UNLESS they are in the unsubscribed list.

    We use the contacts import (bulk) endpoint to do this efficiently.
    Brevo POST /contacts/import with updateEnabled=true and emailBlacklisted=false.
    """
    print("\n" + "="*60)
    print("TASK 2: UNBLOCKLIST CONTACTS")
    print("="*60)

    # Fetch unsubscribers so we can skip them
    unsubscribed_emails = set()
    try:
        offset = 0
        while True:
            r = get("/contacts/unsubscribed", {
                "limit": 500,
                "offset": offset,
                "startDate": "2020-01-01",
                "endDate": "2030-01-01",
            })
            batch = r.get("contacts", [])
            if not batch:
                break
            for c in batch:
                email = c.get("email", "").lower().strip()
                if email:
                    unsubscribed_emails.add(email)
            offset += len(batch)
            if len(batch) < 500:
                break
        print(f"  Unsubscribed emails fetched: {len(unsubscribed_emails)}")
    except Exception as e:
        print(f"  [warn] could not fetch unsubscribers: {e}")

    # Fetch all blocklisted contacts
    blocklisted_contacts = []
    limit = 500
    offset = 0
    print("  Fetching blocklisted contacts (this may take a while)...")
    while True:
        r = get("/contacts", {
            "limit": limit,
            "offset": offset,
            "emailBlacklisted": "true",
        })
        batch = r.get("contacts", [])
        if not batch:
            break
        blocklisted_contacts.extend(batch)
        print(f"    Fetched {len(blocklisted_contacts)} so far...")
        if len(batch) < limit:
            break
        offset += limit
        time.sleep(0.3)  # be gentle with the API

    print(f"  Total blocklisted contacts fetched: {len(blocklisted_contacts)}")

    # Split: which to un-blocklist vs. leave alone (manual unsubscribers)
    to_restore = []
    to_skip = []
    for c in blocklisted_contacts:
        email = c.get("email", "").lower().strip()
        if email in unsubscribed_emails:
            to_skip.append(email)
        else:
            to_restore.append(email)

    print(f"  To restore (blocklisted but NOT manually unsubscribed): {len(to_restore)}")
    print(f"  To skip (manual unsubscribers — leave blocklisted): {len(to_skip)}")

    if dry_run:
        print("  [DRY RUN] — skipping actual API calls")
        return {"restored": 0, "skipped": len(to_skip), "total_blocklisted": len(blocklisted_contacts)}

    # Restore in batches via PUT /contacts/{email}
    # Brevo doesn't have a true bulk unblocklist endpoint — we must call per-contact
    # But for large lists, use POST /contacts/import with updateEnabled=true
    # The import endpoint accepts a fileBody CSV with emailBlacklisted column.

    restored = 0
    failed = []

    if len(to_restore) == 0:
        print("  Nothing to restore.")
    elif len(to_restore) <= 100:
        # Small batch — use individual PUT calls
        print(f"  Restoring {len(to_restore)} contacts via individual PUT calls...")
        for email in to_restore:
            try:
                put(f"/contacts/{urllib.parse.quote(email)}", {"emailBlacklisted": False})
                restored += 1
                if restored % 20 == 0:
                    print(f"    {restored}/{len(to_restore)} restored...")
                time.sleep(0.1)
            except Exception as e:
                print(f"    [error] {email}: {e}")
                failed.append(email)
    else:
        # Large batch — use import endpoint with CSV body
        print(f"  Restoring {len(to_restore)} contacts via bulk import (emailBlacklisted=false)...")
        CHUNK = 2000
        chunk_num = 0
        for i in range(0, len(to_restore), CHUNK):
            chunk = to_restore[i:i+CHUNK]
            chunk_num += 1
            # Build CSV body: EMAIL;EMAIL_BLACKLISTED
            lines = ["EMAIL;EMAIL_BLACKLISTED"]
            for email in chunk:
                lines.append(f"{email};false")
            file_body = "\n".join(lines)

            body = {
                "fileBody": file_body,
                "updateEnabled": True,
            }
            try:
                result = post("/contacts/import", body)
                print(f"    Chunk {chunk_num}: submitted {len(chunk)} contacts — process ID: {result.get('processId','?')}")
                restored += len(chunk)
            except Exception as e:
                print(f"    [error] chunk {chunk_num}: {e}")
                failed.extend(chunk)
            time.sleep(1)

    print(f"\n  Results: {restored} contacts queued for restore, {len(failed)} failures")
    if failed:
        print(f"  Failed emails (first 10): {failed[:10]}")

    return {
        "total_blocklisted": len(blocklisted_contacts),
        "restored": restored,
        "skipped_unsubscribers": len(to_skip),
        "failed": len(failed),
    }


# ──────────────────────────────────────────────────────────────
# TASK 3: Merge Tag / Attribute Health
# ──────────────────────────────────────────────────────────────

def task3_merge_tags():
    print("\n" + "="*60)
    print("TASK 3: MERGE TAG / ATTRIBUTE HEALTH")
    print("="*60)

    # List all contact attributes
    r_attrs = get("/contacts/attributes")
    all_attrs = r_attrs.get("attributes", [])
    print(f"  Total contact attributes defined: {len(all_attrs)}")
    print("\n  --- All Attributes ---")
    for a in all_attrs:
        print(f"    [{a.get('category','?')}] {a.get('name','?')} (type={a.get('type','?')}, readonly={a.get('isRecurring', False)})")

    attr_names = [a.get("name", "") for a in all_attrs]
    has_vehicle_make = "VEHICLE_MAKE" in attr_names
    has_vehicle_model = "VEHICLE_MODEL" in attr_names
    print(f"\n  VEHICLE_MAKE attribute exists: {has_vehicle_make}")
    print(f"  VEHICLE_MODEL attribute exists: {has_vehicle_model}")

    # Sample 20 contacts and check attribute population
    print("\n  --- Sampling 20 contacts for attribute population ---")
    r_sample = get("/contacts", {"limit": 20, "offset": 0})
    sample_contacts = r_sample.get("contacts", [])

    vehicle_make_populated = 0
    vehicle_model_populated = 0
    attribute_population = {}

    for c in sample_contacts:
        attrs = c.get("attributes", {})
        if attrs.get("VEHICLE_MAKE"):
            vehicle_make_populated += 1
        if attrs.get("VEHICLE_MODEL"):
            vehicle_model_populated += 1
        # Count all non-null attributes
        for k, v in attrs.items():
            if v is not None and v != "" and v is not False:
                attribute_population[k] = attribute_population.get(k, 0) + 1

    print(f"  Of 20 sampled contacts:")
    print(f"    VEHICLE_MAKE populated: {vehicle_make_populated}/20")
    print(f"    VEHICLE_MODEL populated: {vehicle_model_populated}/20")
    print(f"\n  Attribute population counts (across 20 contacts):")
    for k in sorted(attribute_population.keys()):
        print(f"    {k}: {attribute_population[k]}/20")

    # Also show a few raw contact attribute sets for debugging
    print("\n  --- Sample contact attribute details ---")
    for c in sample_contacts[:5]:
        email = c.get("email", "?")
        attrs = c.get("attributes", {})
        relevant = {k: v for k, v in attrs.items() if v not in [None, "", False]}
        print(f"    {email}: {json.dumps(relevant, default=str)}")

    return {
        "all_attributes": all_attrs,
        "has_vehicle_make": has_vehicle_make,
        "has_vehicle_model": has_vehicle_model,
        "vehicle_make_populated_of_20": vehicle_make_populated,
        "vehicle_model_populated_of_20": vehicle_model_populated,
        "attribute_population_sample": attribute_population,
    }


# ──────────────────────────────────────────────────────────────
# TASK 4: Campaign Audit (CTAs, merge tags, status)
# ──────────────────────────────────────────────────────────────

SUSPICIOUS_URLS = [
    "stehlenauto.com/",
    "stehlenauto.com/#",
    "/collections/all",
    "/collections/",
    "collections/all",
    "myshopify.com/",
]

VEHICLE_MERGE_TAGS = [
    "{{contact.VEHICLE_MAKE}}",
    "{{contact.VEHICLE_MODEL}}",
    "{{contact.VEHICLE_YEAR}}",
    "{{contact.FIRSTNAME}}",
    "{{contact.LASTNAME}}",
    "{{contact.FULL_NAME}}",
]

def check_url_quality(url):
    """Return CTA quality classification."""
    u = url.lower()
    # Dynamic personalized collection URL — counts as good
    if "{{" in url and "/collections/" in u:
        return "DYNAMIC_COLLECTION (good)"
    if "/products/" in u:
        return "PDP (good)"
    if "/collections/all" in u:
        return "WEAK (/all — no filtering)"
    # Bare homepage links (logo, nav) are normal and don't count as broken CTAs
    if u.rstrip("/") in ["https://stehlenauto.com", "http://stehlenauto.com"]:
        return "HOMEPAGE (nav/logo — ok)"
    if "utm_source" in u and u.rstrip("/").endswith("stehlenauto.com"):
        return "HOMEPAGE+UTM (cta — weak)"
    if "/collections/" in u and "/products/" not in u:
        return "COLLECTION (ok)"
    if "stehlenauto.com" not in u and "myshopify.com" not in u:
        return f"EXTERNAL: {url[:60]}"
    return "OTHER"

def task4_campaign_audit():
    print("\n" + "="*60)
    print("TASK 4: CAMPAIGN AUDIT")
    print("="*60)

    campaigns = []
    offset = 0
    limit = 50
    while True:
        r = get("/emailCampaigns", {"limit": limit, "offset": offset})
        batch = r.get("campaigns", [])
        if not batch:
            break
        campaigns.extend(batch)
        if len(batch) < limit:
            break
        offset += limit
        time.sleep(0.2)

    print(f"  Total campaigns: {len(campaigns)}")

    campaign_rows = []
    for c in campaigns:
        cid = c.get("id")
        name = c.get("name", "?")
        status = c.get("status", "?")
        subject = c.get("subject", "")
        recipients = c.get("recipients", {})
        list_ids = recipients.get("listIds", [])
        excluded = recipients.get("exclusionListIds", [])
        sent_at = c.get("sentDate", "")
        scheduled_at = c.get("scheduledAt", "")

        # Stats
        stats = c.get("statistics", {}) or {}
        global_stats = stats.get("globalStats", {}) or {}
        sent_count = global_stats.get("sent", 0) or c.get("statistics", {}).get("sent", 0) if stats else 0
        opens = global_stats.get("uniqueOpens", 0) or 0
        clicks = global_stats.get("uniqueClicks", 0) or 0

        # Merge tag check in subject
        subject_merge_issues = [t for t in VEHICLE_MERGE_TAGS if t in subject]

        # HTML body — check for merge tags and CTA links
        html_content = c.get("htmlContent", "") or ""
        # Note: for performance, only check if we have html
        body_merge_issues = [t for t in VEHICLE_MERGE_TAGS if t in html_content]

        # Extract links from HTML (simple href scan)
        import re
        href_pattern = re.compile(r'href=["\']([^"\']+)["\']', re.IGNORECASE)
        links = href_pattern.findall(html_content)
        # Filter to only stehlen/myshopify links
        stehlen_links = [l for l in links if "stehlenauto" in l.lower() or "myshopify" in l.lower()]

        cta_quality = {}
        for link in stehlen_links:
            quality = check_url_quality(link)
            cta_quality[link] = quality

        has_weak_cta = any("WEAK" in q or "HOMEPAGE+UTM" in q for q in cta_quality.values())
        has_pdp_cta = any("PDP" in q for q in cta_quality.values())
        has_collection_cta = any("COLLECTION" in q or "DYNAMIC" in q for q in cta_quality.values())

        row = {
            "campaign_id": cid,
            "name": name,
            "status": status,
            "subject": subject,
            "list_ids": json.dumps(list_ids),
            "excluded_list_ids": json.dumps(excluded),
            "sent_at": sent_at,
            "scheduled_at": scheduled_at,
            "sent_count": sent_count,
            "unique_opens": opens,
            "unique_clicks": clicks,
            "subject_merge_issues": json.dumps(subject_merge_issues),
            "body_merge_issues": json.dumps(body_merge_issues),
            "stehlen_links": json.dumps(list(set(stehlen_links))[:10]),
            "has_weak_cta": has_weak_cta,
            "has_pdp_cta": has_pdp_cta,
            "has_collection_cta": has_collection_cta,
            "cta_summary": (
                "GOOD_PDP" if has_pdp_cta and not has_weak_cta else
                "GOOD_PDP+WEAK_BODY" if has_pdp_cta and has_weak_cta else
                "GOOD_DYNAMIC_COLL" if has_collection_cta and not has_weak_cta and not has_pdp_cta else
                "NEEDS_FIX (/all or homepage CTA)" if has_weak_cta and not has_pdp_cta and not has_collection_cta else
                "COLLECTION_ONLY" if has_collection_cta else
                "NO_LINKS"
            ),
        }
        campaign_rows.append(row)

        # Print summary per campaign
        cta_summary = row["cta_summary"]
        merge_warn = ""
        if subject_merge_issues or body_merge_issues:
            all_issues = list(set(subject_merge_issues + body_merge_issues))
            merge_warn = f" | MERGE_ISSUES: {all_issues}"
        print(f"  [{status:12s}] {name[:45]:45s} | CTA: {cta_summary:15s}{merge_warn}")
        if stehlen_links:
            for link in list(set(stehlen_links))[:3]:
                print(f"              -> {check_url_quality(link)}: {link[:80]}")

    return campaign_rows


# ──────────────────────────────────────────────────────────────
# TASK 5: Campaigns Ready to Resend
# ──────────────────────────────────────────────────────────────

def task5_resend_candidates(campaign_rows):
    print("\n" + "="*60)
    print("TASK 5: CAMPAIGNS READY TO RESEND")
    print("="*60)

    resend_candidates = []
    for row in campaign_rows:
        status = row["status"]
        if status not in ("suspended", "draft", "queued"):
            continue

        merge_issues_subject = json.loads(row["subject_merge_issues"]) if row["subject_merge_issues"] else []
        merge_issues_body = json.loads(row["body_merge_issues"]) if row["body_merge_issues"] else []
        has_merge_issues = bool(merge_issues_subject or merge_issues_body)
        has_weak_cta = row["has_weak_cta"]
        has_pdp_cta = row["has_pdp_cta"]
        has_collection_cta = row["has_collection_cta"]
        cta_summary = row["cta_summary"]

        issues = []
        if has_merge_issues:
            issues.append(f"merge_tags_unfired: {list(set(merge_issues_subject + merge_issues_body))}")
        if has_weak_cta and not has_pdp_cta and not has_collection_cta:
            issues.append("weak_cta_homepage")

        ready = len(issues) == 0
        resend_candidates.append({
            "campaign_id": row["campaign_id"],
            "name": row["name"],
            "status": status,
            "list_ids": row["list_ids"],
            "cta_summary": cta_summary,
            "merge_tag_issues": json.dumps(issues),
            "ready_to_resend": ready,
        })

        icon = "READY" if ready else "BLOCKED"
        print(f"  [{icon}] {row['name'][:50]:50s} | Status: {status}")
        if issues:
            for issue in issues:
                print(f"           ISSUE: {issue}")

    return resend_candidates


# ──────────────────────────────────────────────────────────────
# OUTPUT: Write CSV files
# ──────────────────────────────────────────────────────────────

def write_contact_audit(counts, unblocklist_result, merge_tag_result, lists):
    path = os.path.join(ANALYTICS_DIR, "brevo_contact_audit.csv")
    rows = []

    rows.append({"section": "contact_counts", "metric": "total_contacts", "value": counts["total"], "notes": ""})
    rows.append({"section": "contact_counts", "metric": "blocklisted", "value": counts["blocklisted"], "notes": "emailBlacklisted=true"})
    rows.append({"section": "contact_counts", "metric": "unsubscribed", "value": counts["unsubscribed"], "notes": "hard opt-out (permanent)"})
    rows.append({"section": "contact_counts", "metric": "contactable", "value": counts["contactable"], "notes": "total minus blocklisted"})

    rows.append({"section": "unblocklist", "metric": "total_blocklisted_found", "value": unblocklist_result.get("total_blocklisted","?"), "notes": ""})
    rows.append({"section": "unblocklist", "metric": "restored", "value": unblocklist_result.get("restored","?"), "notes": "queued for emailBlacklisted=false"})
    rows.append({"section": "unblocklist", "metric": "skipped_unsubscribers", "value": unblocklist_result.get("skipped_unsubscribers","?"), "notes": "left blocklisted (manual opt-out)"})
    rows.append({"section": "unblocklist", "metric": "failed", "value": unblocklist_result.get("failed","?"), "notes": ""})

    rows.append({"section": "merge_tags", "metric": "vehicle_make_attr_exists", "value": merge_tag_result.get("has_vehicle_make"), "notes": ""})
    rows.append({"section": "merge_tags", "metric": "vehicle_model_attr_exists", "value": merge_tag_result.get("has_vehicle_model"), "notes": ""})
    rows.append({"section": "merge_tags", "metric": "vehicle_make_populated_of_20", "value": merge_tag_result.get("vehicle_make_populated_of_20"), "notes": ""})
    rows.append({"section": "merge_tags", "metric": "vehicle_model_populated_of_20", "value": merge_tag_result.get("vehicle_model_populated_of_20"), "notes": ""})
    for attr_name, pop_count in sorted(merge_tag_result.get("attribute_population_sample", {}).items()):
        rows.append({"section": "attribute_population", "metric": attr_name, "value": f"{pop_count}/20", "notes": "sample of 20 contacts"})

    for lst in lists:
        rows.append({
            "section": "lists",
            "metric": lst["list_name"],
            "value": lst["total_subscribers"],
            "notes": f"list_id={lst['list_id']}, blocklisted={lst['total_blocklisted']}",
        })

    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["section", "metric", "value", "notes"])
        writer.writeheader()
        writer.writerows(rows)

    print(f"\n  Saved contact audit: {path}")


def write_campaign_audit(campaign_rows, resend_candidates):
    path = os.path.join(ANALYTICS_DIR, "brevo_campaign_audit.csv")
    fields = [
        "campaign_id", "name", "status", "subject", "list_ids", "excluded_list_ids",
        "sent_at", "scheduled_at", "sent_count", "unique_opens", "unique_clicks",
        "subject_merge_issues", "body_merge_issues", "stehlen_links",
        "has_weak_cta", "has_pdp_cta", "has_collection_cta", "cta_summary",
    ]
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(campaign_rows)
    print(f"  Saved campaign audit: {path}")

    path2 = os.path.join(ANALYTICS_DIR, "brevo_resend_candidates.csv")
    with open(path2, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["campaign_id", "name", "status", "list_ids", "cta_summary", "merge_tag_issues", "ready_to_resend"])
        writer.writeheader()
        writer.writerows(resend_candidates)
    print(f"  Saved resend candidates: {path2}")


def update_ga4_brevo_analysis(counts, campaign_rows):
    """Append Brevo contact/campaign summary rows to the existing GA4 analysis CSV."""
    path = os.path.join(ANALYTICS_DIR, "ga4_brevo_full_analysis.csv")
    existing_rows = []
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                if not row.get("section", "").startswith("brevo_"):
                    existing_rows.append(row)

    new_rows = [
        {"section": "brevo_contacts", "metric": "total_contacts", "value": counts["total"], "notes": f"as of {datetime.now().strftime('%Y-%m-%d')}"},
        {"section": "brevo_contacts", "metric": "blocklisted", "value": counts["blocklisted"], "notes": "emailBlacklisted=true"},
        {"section": "brevo_contacts", "metric": "unsubscribed", "value": counts["unsubscribed"], "notes": "hard opt-out"},
        {"section": "brevo_contacts", "metric": "contactable", "value": counts["contactable"], "notes": "total - blocklisted"},
    ]

    total_campaigns = len(campaign_rows)
    sent = sum(1 for r in campaign_rows if r["status"] == "sent")
    suspended = sum(1 for r in campaign_rows if r["status"] == "suspended")
    draft = sum(1 for r in campaign_rows if r["status"] == "draft")
    weak_cta = sum(1 for r in campaign_rows if r["has_weak_cta"] and not r["has_pdp_cta"])
    merge_issue = sum(1 for r in campaign_rows if json.loads(r["subject_merge_issues"] or "[]") or json.loads(r["body_merge_issues"] or "[]"))

    new_rows += [
        {"section": "brevo_campaigns", "metric": "total_campaigns", "value": total_campaigns, "notes": ""},
        {"section": "brevo_campaigns", "metric": "sent", "value": sent, "notes": ""},
        {"section": "brevo_campaigns", "metric": "suspended", "value": suspended, "notes": ""},
        {"section": "brevo_campaigns", "metric": "draft", "value": draft, "notes": ""},
        {"section": "brevo_campaigns", "metric": "weak_cta_count", "value": weak_cta, "notes": "homepage or /all links"},
        {"section": "brevo_campaigns", "metric": "merge_tag_issues", "value": merge_issue, "notes": "unfired {{contact.X}} in subject/body"},
    ]

    all_rows = existing_rows + new_rows
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["section", "metric", "value", "notes"])
        writer.writeheader()
        writer.writerows(all_rows)
    print(f"  Updated: {path}")


# ──────────────────────────────────────────────────────────────
# MAIN
# ──────────────────────────────────────────────────────────────

def print_final_summary(counts, unblocklist_result, merge_tag_result, campaign_rows, resend_candidates):
    print("\n" + "="*60)
    print("FINAL SUMMARY")
    print("="*60)

    print("\n1. CONTACT COUNTS")
    print(f"   Total contacts:    {counts['total']}")
    print(f"   Blocklisted:       {counts['blocklisted']}")
    print(f"   Unsubscribed:      {counts['unsubscribed']}")
    print(f"   Contactable:       {counts['contactable']}")

    print("\n2. BLOCKLIST REMOVAL")
    print(f"   Total blocklisted found:       {unblocklist_result.get('total_blocklisted', '?')}")
    print(f"   Restored (queued):             {unblocklist_result.get('restored', '?')}")
    print(f"   Skipped (manual unsubscribers):{unblocklist_result.get('skipped_unsubscribers', '?')}")
    print(f"   Failed:                        {unblocklist_result.get('failed', '?')}")

    print("\n3. MERGE TAG STATUS")
    print(f"   VEHICLE_MAKE attribute exists: {merge_tag_result.get('has_vehicle_make')}")
    print(f"   VEHICLE_MODEL attribute exists: {merge_tag_result.get('has_vehicle_model')}")
    print(f"   VEHICLE_MAKE populated (of 20 sampled): {merge_tag_result.get('vehicle_make_populated_of_20')}")
    print(f"   VEHICLE_MODEL populated (of 20 sampled): {merge_tag_result.get('vehicle_model_populated_of_20')}")
    print(f"   Populated attributes: {sorted(merge_tag_result.get('attribute_population_sample',{}).keys())}")

    print("\n4. CAMPAIGN STATUS")
    header = f"  {'NAME'[:45]:45s} {'STATUS':12s} {'CTA':15s} {'MERGE_ISSUES'}"
    print(header)
    print("  " + "-"*100)
    for r in sorted(campaign_rows, key=lambda x: x["status"]):
        subject_issues = json.loads(r["subject_merge_issues"] or "[]")
        body_issues = json.loads(r["body_merge_issues"] or "[]")
        all_issues = list(set(subject_issues + body_issues))
        merge_str = "OK" if not all_issues else f"BROKEN: {','.join([t.replace('{{contact.','').replace('}}','') for t in all_issues])}"
        print(f"  {r['name'][:45]:45s} {r['status']:12s} {r['cta_summary']:15s} {merge_str}")

    print("\n5. RESEND RECOMMENDATIONS")
    ready = [r for r in resend_candidates if r["ready_to_resend"]]
    blocked = [r for r in resend_candidates if not r["ready_to_resend"]]
    print(f"   Ready to resend:   {len(ready)}")
    print(f"   Blocked (need fix):{len(blocked)}")
    for r in ready:
        print(f"   READY:   [{r['status']:10s}] {r['name']}")
    for r in blocked:
        issues = json.loads(r["merge_tag_issues"] or "[]")
        print(f"   BLOCKED: [{r['status']:10s}] {r['name']} — {'; '.join(issues)}")

    print("\n   NOTE: To resend any campaign, ALWAYS use scheduledAt with a future datetime.")
    print("         NEVER use sendNow — it caused the account suspension.")


def main():
    print("Brevo Audit — " + datetime.now().strftime("%Y-%m-%d %H:%M:%S"))

    counts = task1_contact_counts()
    unblocklist_result = task2_unblocklist(dry_run=False)
    merge_tag_result = task3_merge_tags()
    campaign_rows = task4_campaign_audit()
    resend_candidates = task5_resend_candidates(campaign_rows)

    print("\n--- Writing output files ---")
    write_contact_audit(counts, unblocklist_result, merge_tag_result, counts["lists"])
    write_campaign_audit(campaign_rows, resend_candidates)
    update_ga4_brevo_analysis(counts, campaign_rows)

    print_final_summary(counts, unblocklist_result, merge_tag_result, campaign_rows, resend_candidates)

    return 0


if __name__ == "__main__":
    sys.exit(main())
