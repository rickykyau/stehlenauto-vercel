"""
create_brevo_campaigns.py — Create Champions Reactivation email campaign drafts in Brevo.

Creates 3 draft campaigns targeting the "Champions - Reactivation" list:
  Email 1: Brand Reintroduction (send first)
  Email 2: Vehicle-Specific     (send 5 days after Email 1)
  Email 3: Last Chance          (send 10 days after Email 1)

IMPORTANT: These are created as DRAFTS. Do NOT schedule or send from this script.
Send manually from the Brevo dashboard following the warm-up schedule.

Sender: ID 2 — "Stehlen Auto" <info@updates.stehlenauto.com>
Reply-to: info@stehlenauto.com

NOTE on logo URL: https://stehlenauto.com/lovable-uploads/stehlen-logo.png
  This is the Lovable CDN path pattern. Verify the exact filename is correct by
  checking the live site or your Lovable dashboard (Assets tab) before sending.
  Update LOGO_URL below if needed.

Usage:
  python scripts/create_brevo_campaigns.py

Dependencies: requests, python-dotenv (already in marketing/analytics/requirements.txt)
"""

import json
import os
import sys
from typing import Any, Dict, Optional, Tuple

import requests
from dotenv import load_dotenv

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_PATH = os.path.join(BASE_DIR, ".env")

BREVO_BASE = "https://api.brevo.com/v3"

SENDER_ID    = 2
SENDER_NAME  = "Stehlen Auto"
SENDER_EMAIL = "info@updates.stehlenauto.com"
REPLY_TO     = "info@stehlenauto.com"

LIST_NAME    = "Champions - Reactivation"

# Verify this URL against your Lovable Assets tab before sending.
LOGO_URL = "https://stehlenauto.com/lovable-uploads/stehlen-logo.png"

# ---------------------------------------------------------------------------
# HTML content for each email
# ---------------------------------------------------------------------------

HTML_EMAIL_1 = f"""\
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; color: #333333;">
  <img src="{LOGO_URL}" alt="Stehlen Auto" style="max-width: 200px; margin-bottom: 20px;" />

  <p>Hey {{{{contact.FIRSTNAME|default:'there'}}}},</p>

  <p>You ordered from us on eBay a while back — thanks for trusting Stehlen Auto.</p>

  <p>We just launched our own store at <a href="https://stehlenauto.com?utm_source=brevo&utm_medium=email&utm_campaign=champions-reactivation&utm_content=email1">stehlenauto.com</a>. Same parts, same quality, but now with something we couldn't offer on eBay:</p>

  <p><strong>A fitment guarantee.</strong> Tell us your vehicle's year, make, and model — we confirm the part fits before it ships.</p>

  <p>As a thank you for being one of our earliest customers: <strong>10% off your first direct order</strong> through April 30.</p>

  <p style="font-size: 24px; font-weight: bold; color: #f5a823; text-align: center; padding: 15px; background-color: #0a0a0a; border-radius: 4px;">DIRECT10</p>

  <p style="text-align: center;">
    <a href="https://stehlenauto.com/collections/all?utm_source=brevo&utm_medium=email&utm_campaign=champions-reactivation&utm_content=email1-cta" style="display: inline-block; padding: 14px 32px; background-color: #f5a823; color: #000000; text-decoration: none; font-weight: bold; font-size: 16px; border-radius: 4px;">BROWSE PARTS FOR YOUR VEHICLE</a>
  </p>

  <p style="color: #888; font-size: 13px; margin-top: 30px;">Free shipping on all orders. 30-day returns. Manufacturer warranty.</p>

  <p>— The Stehlen Auto Team<br/>
  <a href="https://stehlenauto.com">stehlenauto.com</a></p>
</body>
</html>"""

HTML_EMAIL_2 = f"""\
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; color: #333333;">
  <img src="{LOGO_URL}" alt="Stehlen Auto" style="max-width: 200px; margin-bottom: 20px;" />

  <p>Hey {{{{contact.FIRSTNAME|default:'there'}}}},</p>

  <p>Here are the most popular upgrades for the <strong>{{{{contact.VEHICLE_MAKE}}}} {{{{contact.VEHICLE_MODEL}}}}</strong> — picked from over 10 years of sales data and thousands of owners.</p>

  <p>Every part ships with our fitment guarantee — confirmed to fit before it ships.</p>

  <p style="text-align: center;">
    <a href="https://stehlenauto.com/collections/all?utm_source=brevo&utm_medium=email&utm_campaign=champions-reactivation&utm_content=email2-cta" style="display: inline-block; padding: 14px 32px; background-color: #f5a823; color: #000000; text-decoration: none; font-weight: bold; font-size: 16px; border-radius: 4px;">SEE UPGRADES FOR MY VEHICLE</a>
  </p>

  <p>Your 10% off code <strong>DIRECT10</strong> is still active.</p>

  <p style="color: #888; font-size: 13px; margin-top: 30px;">Free shipping on all orders. Fitment guaranteed.</p>

  <p>— Stehlen Auto<br/>
  <a href="https://stehlenauto.com">stehlenauto.com</a></p>
</body>
</html>"""

HTML_EMAIL_3 = f"""\
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; color: #333333;">
  <img src="{LOGO_URL}" alt="Stehlen Auto" style="max-width: 200px; margin-bottom: 20px;" />

  <p>{{{{contact.FIRSTNAME|default:'Hey'}}}},</p>

  <p>Quick heads up — your 10% off code <strong>DIRECT10</strong> expires this Friday.</p>

  <p>We've got <strong>{{{{contact.VEHICLE_MAKE}}}} {{{{contact.VEHICLE_MODEL}}}}</strong> parts in stock and ready to ship.</p>

  <p style="text-align: center;">
    <a href="https://stehlenauto.com/collections/all?utm_source=brevo&utm_medium=email&utm_campaign=champions-reactivation&utm_content=email3-cta" style="display: inline-block; padding: 14px 32px; background-color: #f5a823; color: #000000; text-decoration: none; font-weight: bold; font-size: 16px; border-radius: 4px;">USE CODE DIRECT10 — SHOP NOW</a>
  </p>

  <p style="color: #888; font-size: 13px; margin-top: 30px;">Free shipping on all orders. Fitment guaranteed.</p>

  <p>— Stehlen Auto<br/>
  <a href="https://stehlenauto.com">stehlenauto.com</a></p>
</body>
</html>"""

# ---------------------------------------------------------------------------
# Campaign definitions
# Each dict maps directly to the Brevo POST /emailCampaigns payload,
# minus the listIds which are injected after list ID lookup.
# ---------------------------------------------------------------------------

CAMPAIGNS = [
    {
        "name":        "Champions Reactivation - Email 1: Brand Intro",
        "subject":     "You ordered from us on eBay — we have something better now",
        "htmlContent": HTML_EMAIL_1,
        "_label":      "Email 1: Brand Reintroduction",
    },
    {
        "name":        "Champions Reactivation - Email 2: Vehicle Specific",
        "subject":     "Top upgrades for your {{contact.VEHICLE_MAKE}} {{contact.VEHICLE_MODEL}}",
        "htmlContent": HTML_EMAIL_2,
        "_label":      "Email 2: Vehicle Specific (send 5 days after Email 1)",
    },
    {
        "name":        "Champions Reactivation - Email 3: Last Chance",
        "subject":     "DIRECT10 expires Friday — 10% off your first order at stehlenauto.com",
        "htmlContent": HTML_EMAIL_3,
        "_label":      "Email 3: Last Chance (send 10 days after Email 1)",
    },
]

# ---------------------------------------------------------------------------
# Helpers — reuse same style as setup_brevo.py
# ---------------------------------------------------------------------------

def brevo_headers(api_key: str) -> Dict[str, str]:
    return {
        "api-key":      api_key,
        "Content-Type": "application/json",
        "Accept":       "application/json",
    }


def get(url: str, headers: Dict[str, str]) -> Tuple[int, Any]:
    r = requests.get(url, headers=headers, timeout=30)
    try:
        body = r.json()
    except Exception:
        body = {"raw": r.text}
    return r.status_code, body


def post(url: str, payload: Dict[str, Any], headers: Dict[str, str]) -> Tuple[int, Any]:
    r = requests.post(url, headers=headers, json=payload, timeout=30)
    try:
        body = r.json()
    except Exception:
        body = {"raw": r.text}
    return r.status_code, body


def section(title: str) -> None:
    print(f"\n{'=' * 60}")
    print(f"  {title}")
    print(f"{'=' * 60}")


def ok(msg: str)   -> None: print(f"  [OK]    {msg}")
def warn(msg: str) -> None: print(f"  [WARN]  {msg}")
def info(msg: str) -> None: print(f"  [INFO]  {msg}")
def err(msg: str)  -> None: print(f"  [ERROR] {msg}")


# ---------------------------------------------------------------------------
# Step 1 — Look up list ID for "Champions - Reactivation"
# ---------------------------------------------------------------------------

def find_list_id(headers: Dict[str, str]) -> Optional[int]:
    """
    Paginate through all Brevo contact lists and find the one named LIST_NAME.
    Brevo max limit per page is 50.
    """
    section(f"STEP 1 — Look up list ID for '{LIST_NAME}'")

    offset = 0
    limit  = 50

    while True:
        url = f"{BREVO_BASE}/contacts/lists?limit={limit}&offset={offset}"
        status, body = get(url, headers)

        if status != 200:
            err(f"GET /contacts/lists failed ({status}): {json.dumps(body, indent=2)}")
            return None

        lists = body.get("lists", [])
        total = body.get("count", 0)

        for lst in lists:
            if lst.get("name") == LIST_NAME:
                list_id = lst["id"]
                contact_count = lst.get("totalBlacklisted", 0) + lst.get("totalSubscribers", 0)
                ok(f"Found list '{LIST_NAME}' — ID = {list_id}  |  ~{contact_count:,} contacts")
                return list_id

        offset += limit
        if offset >= total:
            break

    err(f"List '{LIST_NAME}' not found. Run scripts/setup_brevo.py first to create it.")
    info("Available lists (first page):")
    # Re-fetch first page just for display
    _, first_page = get(f"{BREVO_BASE}/contacts/lists?limit=50&offset=0", headers)
    for lst in first_page.get("lists", []):
        info(f"  ID={lst['id']}  name='{lst.get('name', '?')}'  subscribers={lst.get('totalSubscribers', 0)}")
    return None


# ---------------------------------------------------------------------------
# Step 2 — Create campaign drafts
# ---------------------------------------------------------------------------

def create_campaign_draft(
    campaign_def: Dict[str, Any],
    list_id: int,
    headers: Dict[str, str],
) -> Optional[Dict[str, Any]]:
    """
    POST /emailCampaigns to create a DRAFT (no scheduledAt = draft status).

    Brevo campaign status rules:
      - Omitting 'scheduledAt' leaves the campaign in 'draft' status.
      - Do NOT include 'scheduledAt' in this payload.

    Brevo sender object requires either {id} or {name + email}.
    We use {id: SENDER_ID} since sender ID 2 is already verified.
    """
    label = campaign_def.pop("_label", campaign_def["name"])
    info(f"\nCreating draft: {label}")

    payload = {
        "name":        campaign_def["name"],
        "subject":     campaign_def["subject"],
        "htmlContent": campaign_def["htmlContent"],
        # Brevo rejects requests that include both 'id' and 'name'/'email' in the sender
        # object. When using a pre-verified sender ID, pass only the ID.
        "sender": {
            "id": SENDER_ID,
        },
        "replyTo":   REPLY_TO,
        "recipients": {
            "listIds": [list_id],
        },
        # No 'scheduledAt' key = draft status. Explicitly confirmed by Brevo docs:
        # https://developers.brevo.com/reference/create-email-campaign
    }

    url = f"{BREVO_BASE}/emailCampaigns"
    status, body = post(url, payload, headers)

    if status in (200, 201):
        campaign_id = body.get("id")
        ok(f"Draft created — Campaign ID: {campaign_id}")
        return {"id": campaign_id, "name": campaign_def["name"], "label": label}
    else:
        err(f"Failed to create '{label}' ({status}): {json.dumps(body, indent=2)}")
        return None


# ---------------------------------------------------------------------------
# Step 3 — Print summary
# ---------------------------------------------------------------------------

def print_summary(results: list) -> None:
    section("SUMMARY")

    created = [r for r in results if r is not None]
    failed  = len(results) - len(created)

    print(f"\n  Campaigns created as DRAFTS: {len(created)} / {len(results)}")
    if failed:
        warn(f"{failed} campaign(s) failed — see errors above.")

    print()
    for r in created:
        campaign_id = r["id"]
        name        = r["name"]
        label       = r["label"]
        preview_url = f"https://app.brevo.com/campaigns/email/detail/{campaign_id}"
        print(f"  {label}")
        print(f"    Name        : {name}")
        print(f"    Campaign ID : {campaign_id}")
        print(f"    Preview URL : {preview_url}")
        print()

    print("  -------------------------------------------------------")
    print("  NEXT STEPS — Warm-up send schedule:")
    print()
    print("    Week 1  : Email 1 — send to first batch (5,000 contacts max)")
    print("    +5 days : Email 2 — send to same batch")
    print("    +10 days: Email 3 — send to same batch")
    print()
    print("    Repeat with next batch per warm-up schedule.")
    print()
    print("  To send from the Brevo dashboard:")
    print("    1. Open the campaign preview URL above")
    print("    2. Review the email rendering")
    print("    3. Click 'Schedule' or 'Send now' — do NOT send from this script")
    print()
    print(f"  NOTE: Verify logo URL before sending:")
    print(f"    {LOGO_URL}")
    print(f"    Check Lovable Assets tab or stehlenauto.com source to confirm filename.")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    load_dotenv(ENV_PATH)
    api_key = os.getenv("BREVO_API_KEY", "").strip()

    if not api_key:
        err("BREVO_API_KEY not found in .env — aborting.")
        sys.exit(1)

    info(f"Brevo API key loaded (ends ...{api_key[-6:]})")
    headers = brevo_headers(api_key)

    # Step 1: Find list ID
    list_id = find_list_id(headers)
    if list_id is None:
        err("Cannot create campaigns without a valid list ID. Aborting.")
        sys.exit(1)

    # Step 2: Create campaign drafts
    section("STEP 2 — Create Campaign Drafts")

    results = []
    for campaign_def in CAMPAIGNS:
        # Pass a copy so pop("_label") doesn't mutate the module-level list
        result = create_campaign_draft(dict(campaign_def), list_id, headers)
        results.append(result)

    # Step 3: Summary
    print_summary(results)


if __name__ == "__main__":
    main()
