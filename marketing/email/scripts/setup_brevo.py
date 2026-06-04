"""
setup_brevo.py — Brevo reactivation email infrastructure setup for Stehlen Auto

Steps performed:
  1. Add sending domain: updates.stehlenauto.com
  2. Create sender:     hello@updates.stehlenauto.com
  3. Create contact list: Champions - Reactivation
  4. Create custom contact attributes (VEHICLE_MAKE, VEHICLE_MODEL, VEHICLE_LABEL,
                                       LAST_CATEGORY, RFM_SEGMENT)
  5. Import validated Champions CSV into that list
  6. Print a manual-action checklist (DNS records, sender verification)

Usage:
  python scripts/setup_brevo.py

Dependencies:
  requests, python-dotenv, pandas  (all already in marketing/analytics/requirements.txt)
"""

import os
import sys
import json
import time
import csv
from typing import Optional, List, Dict, Any

import requests
import pandas as pd
from dotenv import load_dotenv

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_PATH = os.path.join(BASE_DIR, ".env")
CSV_PATH = os.path.join(BASE_DIR, "data", "exports", "klaviyo_champions_validated.csv")

BREVO_BASE = "https://api.brevo.com/v3"

DOMAIN_NAME   = "updates.stehlenauto.com"
SENDER_NAME   = "Stehlen Auto"
SENDER_EMAIL  = "hello@updates.stehlenauto.com"
LIST_NAME     = "Champions - Reactivation"
FOLDER_ID     = 1   # Brevo default "My contacts" folder

# Custom attributes to create (Brevo type: "text" for all string fields)
CUSTOM_ATTRIBUTES = [
    "VEHICLE_MAKE",
    "VEHICLE_MODEL",
    "VEHICLE_LABEL",
    "LAST_CATEGORY",
    "RFM_SEGMENT",
]

# CSV column → Brevo attribute mapping
CSV_TO_BREVO = {
    "email":          "EMAIL",
    "first_name":     "FIRSTNAME",
    "vehicle_make":   "VEHICLE_MAKE",
    "vehicle_model":  "VEHICLE_MODEL",
    "vehicle_label":  "VEHICLE_LABEL",
    "last_category":  "LAST_CATEGORY",
    "rfm_segment":    "RFM_SEGMENT",
}

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def brevo_headers(api_key: str) -> dict:
    return {
        "api-key": api_key,
        "Content-Type": "application/json",
        "Accept": "application/json",
    }


def post(url: str, payload: Dict[str, Any], headers: Dict[str, str]):
    r = requests.post(url, headers=headers, json=payload, timeout=30)
    try:
        body = r.json()
    except Exception:
        body = {"raw": r.text}
    return r.status_code, body


def get(url: str, headers: Dict[str, str]):
    r = requests.get(url, headers=headers, timeout=30)
    try:
        body = r.json()
    except Exception:
        body = {"raw": r.text}
    return r.status_code, body


def section(title: str) -> None:
    print(f"\n{'=' * 60}")
    print(f"  {title}")
    print(f"{'=' * 60}")


def ok(msg: str) -> None:
    print(f"  [OK]     {msg}")


def warn(msg: str) -> None:
    print(f"  [WARN]   {msg}")


def info(msg: str) -> None:
    print(f"  [INFO]   {msg}")


def err(msg: str) -> None:
    print(f"  [ERROR]  {msg}")


# ---------------------------------------------------------------------------
# Step 1 — Add sending domain
# ---------------------------------------------------------------------------

def add_sending_domain(headers: Dict[str, str]) -> Optional[Dict[str, Any]]:
    section("STEP 1 — Add Sending Domain")
    url = f"{BREVO_BASE}/senders/domains"
    payload = {"name": DOMAIN_NAME}

    status, body = post(url, payload, headers)

    already_exists_signals = [
        "already" in str(body).lower(),
        "duplicate" in str(body).lower(),
        "exist" in str(body).lower(),
    ]

    if status in (200, 201):
        ok(f"Domain '{DOMAIN_NAME}' created successfully.")
        return body
    elif any(already_exists_signals):
        warn(f"Domain '{DOMAIN_NAME}' already exists — fetching existing record.")
        # Brevo GET /senders/domains returns a list; find our domain
        gs, gb = get(f"{BREVO_BASE}/senders/domains", headers)
        if gs == 200:
            domains = gb if isinstance(gb, list) else gb.get("domains", [])
            for d in domains:
                if d.get("domain_name") == DOMAIN_NAME or d.get("name") == DOMAIN_NAME:
                    ok(f"Retrieved existing domain record.")
                    return d
            warn("Domain not found in list response — returning original error body.")
        else:
            warn(f"Could not list domains ({gs}): {gb}")
        return body
    else:
        err(f"Unexpected response ({status}): {json.dumps(body, indent=2)}")
        return body


def print_dns_records(domain_data: Optional[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Extract and print DNS records from the domain response."""
    records = []
    if not domain_data:
        warn("No domain data to print DNS records from.")
        return records

    # Brevo v3 uses "dns_records" (snake_case dict of named record objects).
    # Older / undocumented versions used "dnsRecords", "authenticationDetails", or flat fields.
    # Check all known key names, preferring snake_case first.
    dns_section = (
        domain_data.get("dns_records")
        or domain_data.get("dnsRecords")
        or domain_data.get("authenticationDetails")
        or domain_data.get("dkim")
        or []
    )

    print("\n  DNS records to add at your DNS provider")
    print("  " + "-" * 56)

    # Shape 1: Brevo v3 actual response — dns_records is a dict of named record objects
    # e.g. {"dkim1Record": {"type": "CNAME", "value": "...", "host_name": "...", "status": bool}, ...}
    if isinstance(dns_section, dict):
        for label, rec in dns_section.items():
            if not isinstance(rec, dict):
                continue
            entry = {
                "label":  label,
                "type":   rec.get("type", "?"),
                "host":   rec.get("host_name") or rec.get("hostName") or rec.get("host") or rec.get("name", "?"),
                "value":  rec.get("value") or rec.get("txtRecord", "?"),
                "status": rec.get("status", "?"),
            }
            records.append(entry)
            status_str = "already verified" if entry["status"] is True else "NEEDS ADDING"
            print(f"\n  {label}  [{status_str}]")
            print(f"    Type  : {entry['type']}")
            print(f"    Host  : {entry['host']}")
            print(f"    Value : {entry['value']}")

    # Shape 2: flat top-level fields (older API versions)
    flat_pairs = [
        ("DKIM record",       domain_data.get("dkimRecord")      or domain_data.get("dkim")),
        ("SPF / Return-Path", domain_data.get("returnPathDomain") or domain_data.get("spf")),
    ]
    for label, value in flat_pairs:
        if value and isinstance(value, dict):
            rec = {
                "label": label,
                "type":  value.get("type", "TXT"),
                "host":  value.get("hostName") or value.get("host") or value.get("name", "?"),
                "value": value.get("value") or value.get("txtRecord", "?"),
            }
            records.append(rec)
            print(f"\n  {label}")
            print(f"    Type  : {rec['type']}")
            print(f"    Host  : {rec['host']}")
            print(f"    Value : {rec['value']}")
        elif value and isinstance(value, str):
            records.append({"label": label, "value": value})
            print(f"\n  {label}: {value}")

    # Shape 3: list-based (some API versions)
    if isinstance(dns_section, list):
        for rec in dns_section:
            records.append(rec)
            rtype = rec.get("type", "?")
            host  = rec.get("host_name") or rec.get("hostName") or rec.get("host") or rec.get("name", "?")
            val   = rec.get("value") or rec.get("txtRecord", "?")
            print(f"\n  {rtype} record")
            print(f"    Host  : {host}")
            print(f"    Value : {val}")

    if not records:
        warn("Brevo did not return structured DNS records in this response.")
        info("Full domain response:")
        print(json.dumps(domain_data, indent=4))

    return records


# ---------------------------------------------------------------------------
# Step 2 — Create sender
# ---------------------------------------------------------------------------

def create_sender(headers: Dict[str, str]) -> Optional[int]:
    section("STEP 2 — Create Sender")
    url = f"{BREVO_BASE}/senders"
    payload = {"name": SENDER_NAME, "email": SENDER_EMAIL}

    status, body = post(url, payload, headers)

    def _lookup_existing_sender() -> Optional[int]:
        gs, gb = get(f"{BREVO_BASE}/senders", headers)
        if gs == 200:
            for s in gb.get("senders", []):
                if s.get("email") == SENDER_EMAIL:
                    ok(f"Found existing sender ID = {s['id']}")
                    return s["id"]
        return None

    if status in (200, 201):
        sender_id = body.get("id")
        ok(f"Sender '{SENDER_EMAIL}' created. ID = {sender_id}")
        if body.get("active") is False:
            warn("Sender is NOT yet active — check your inbox to verify the sender email.")
        else:
            ok("Sender is already active (domain likely trusted).")
        return sender_id
    else:
        msg = str(body).lower()
        already_exists = "already" in msg or "duplicate" in msg or "exist" in msg or "unique" in msg
        if already_exists:
            warn(f"Sender '{SENDER_EMAIL}' already exists — looking up existing ID.")
            existing = _lookup_existing_sender()
            if existing:
                return existing
        err(f"Could not create sender ({status}): {json.dumps(body, indent=2)}")
        return _lookup_existing_sender()


# ---------------------------------------------------------------------------
# Step 3 — Create contact list
# ---------------------------------------------------------------------------

def create_contact_list(headers: Dict[str, str]) -> Optional[int]:
    section("STEP 3 — Create Contact List")

    # Pre-check: look for existing list with the same name before creating
    # Brevo allows duplicate list names, so we must check ourselves.
    gs, gb = get(f"{BREVO_BASE}/contacts/lists?limit=50&offset=0", headers)
    if gs == 200:
        for lst in gb.get("lists", []):
            if lst.get("name") == LIST_NAME:
                ok(f"List '{LIST_NAME}' already exists. ID = {lst['id']}")
                return lst["id"]

    url = f"{BREVO_BASE}/contacts/lists"
    payload = {"name": LIST_NAME, "folderId": FOLDER_ID}
    status, body = post(url, payload, headers)

    if status in (200, 201):
        list_id = body.get("id")
        ok(f"List '{LIST_NAME}' created. ID = {list_id}")
        return list_id
    else:
        msg = str(body).lower()
        already_exists = "already" in msg or "duplicate" in msg or "exist" in msg or "unique" in msg
        if already_exists:
            warn(f"List '{LIST_NAME}' already exists — could not retrieve ID.")
            return None
        err(f"Could not create list ({status}): {json.dumps(body, indent=2)}")
        return None


# ---------------------------------------------------------------------------
# Step 4a — Create custom contact attributes
# ---------------------------------------------------------------------------

def create_contact_attributes(headers: Dict[str, str]) -> None:
    section("STEP 4a — Create Custom Contact Attributes")

    # Brevo attribute categories: normal | transactional | category | calculated | global
    for attr in CUSTOM_ATTRIBUTES:
        url = f"{BREVO_BASE}/contacts/attributes/normal/{attr}"
        payload = {"type": "text"}

        status, body = post(url, payload, headers)

        if status in (200, 201):
            ok(f"Attribute '{attr}' created.")
        else:
            msg = str(body).lower()
            already_exists = (
                "already" in msg
                or "duplicate" in msg
                or "exist" in msg
                or "unique" in msg
            )
            if already_exists:
                warn(f"Attribute '{attr}' already exists — skipping.")
            else:
                err(f"Could not create attribute '{attr}' ({status}): {body}")


# ---------------------------------------------------------------------------
# Step 4b — Import contacts
# ---------------------------------------------------------------------------

def import_contacts(headers: Dict[str, str], list_id: int) -> Optional[Dict[str, Any]]:
    section("STEP 4b — Import Contacts")

    if not os.path.exists(CSV_PATH):
        err(f"CSV not found at: {CSV_PATH}")
        return None

    df = pd.read_csv(CSV_PATH, dtype=str)
    df = df.fillna("")

    info(f"Loaded {len(df):,} rows from {os.path.basename(CSV_PATH)}")

    # Validate required column exists
    if "email" not in df.columns:
        err("CSV is missing the 'email' column — cannot import.")
        return None

    # Build the contacts list for Brevo's JSON import endpoint.
    # Brevo /contacts/import accepts:
    #   {
    #     "fileBody":      "<CSV string>",    # OR
    #     "jsonBody":      [...],              # list of contact dicts
    #     "listIds":       [list_id],
    #     "updateEnabled": true
    #   }
    # We use jsonBody to avoid file upload complexity.

    json_body = []
    skipped = 0
    for _, row in df.iterrows():
        email = row.get("email", "").strip()
        if not email or "@" not in email:
            skipped += 1
            continue

        attributes: Dict[str, str] = {}
        for csv_col, brevo_attr in CSV_TO_BREVO.items():
            if csv_col == "email":
                continue
            if brevo_attr == "FIRSTNAME" and csv_col not in df.columns:
                continue
            val = row.get(csv_col, "").strip()
            if val:
                attributes[brevo_attr] = val

        contact: Dict[str, Any] = {"email": email}
        if attributes:
            contact["attributes"] = attributes

        json_body.append(contact)

    info(f"Contacts prepared: {len(json_body):,} valid  |  {skipped} skipped (bad email)")

    # Brevo's import endpoint processes asynchronously and returns a processId.
    url = f"{BREVO_BASE}/contacts/import"
    payload = {
        "jsonBody":      json_body,
        "listIds":       [list_id],
        "updateEnabled": True,
    }

    info("Sending import request to Brevo (this is async — Brevo will process in background)...")
    status, body = post(url, payload, headers)

    if status in (200, 201, 202):
        process_id = body.get("processId")
        ok(f"Import accepted. processId = {process_id}")
        info("Brevo will process the import asynchronously.")
        info("Check status at: Brevo dashboard > Contacts > Import history")
        info(f"Or poll: GET {BREVO_BASE}/processes/{process_id}")
        return body
    else:
        err(f"Import failed ({status}): {json.dumps(body, indent=2)}")
        return None


# ---------------------------------------------------------------------------
# Step 5 — Print summary and manual action checklist
# ---------------------------------------------------------------------------

def print_summary(
    domain_data: Optional[Dict[str, Any]],
    dns_records: List[Dict[str, Any]],
    sender_id: Optional[int],
    list_id: Optional[int],
    import_result: Optional[Dict[str, Any]],
) -> None:
    section("SUMMARY & MANUAL ACTION CHECKLIST")

    print("""
  What was done automatically
  ---------------------------""")
    print(f"  - Sending domain registered : {DOMAIN_NAME}")
    print(f"  - Sender created            : {SENDER_EMAIL}  (ID: {sender_id or 'unknown'})")
    print(f"  - Contact list created      : '{LIST_NAME}'  (ID: {list_id or 'unknown'})")
    attrs = ", ".join(CUSTOM_ATTRIBUTES)
    print(f"  - Custom attributes created : {attrs}")
    if import_result:
        pid = import_result.get("processId", "?")
        print(f"  - Contact import submitted  : processId = {pid}")
    else:
        print("  - Contact import            : FAILED — see errors above")

    print("""
  What you need to do manually
  ----------------------------

  1. ADD DNS RECORDS at your DNS provider (probably Cloudflare or Namecheap)
     The records Brevo returned are printed above under STEP 1.
     If you didn't get structured records above, log into:
       https://app.brevo.com/settings/senders/domains
     and click 'Authenticate' next to updates.stehlenauto.com.
     Brevo will show you the exact DKIM, SPF, and DMARC records to add.

     Records typically required:
       - DKIM  : TXT record on a brevo._domainkey.updates.stehlenauto.com subdomain
       - SPF   : TXT record on updates.stehlenauto.com
                 value: "v=spf1 include:spf.brevo.com ~all"
       - DMARC : TXT record on _dmarc.updates.stehlenauto.com (optional but recommended)
                 value: "v=DMARC1; p=none; rua=mailto:hello@updates.stehlenauto.com"

  2. VERIFY THE SENDER EMAIL
     Brevo may have sent a verification email to hello@updates.stehlenauto.com.
     You need a mailbox at that address before it will send.
     Options:
       a) Create a forwarding alias at your DNS/email provider (simplest)
       b) Use Brevo's transactional sending without a real inbox — check if
          your domain verification bypasses this requirement

  3. WAIT FOR DNS PROPAGATION (typically 5–30 minutes, up to 48 hours)
     Then click 'Verify' in Brevo's domain settings.

  4. VERIFY CONTACT IMPORT
     Go to: https://app.brevo.com/contact/list
     Open 'Champions - Reactivation' list.
     Confirm contact count matches expected (~36,700).

  5. BUILD THE REACTIVATION EMAIL CAMPAIGN IN BREVO
     Recommended next steps:
       - Create a campaign template targeting the Champions list
       - Personalize with {{contact.VEHICLE_LABEL}} ("Your 2021 Ford F-150 might need...")
       - Subject line variant A: "Your {{contact.VEHICLE_LABEL}} accessories — back in stock"
       - Subject line variant B: "We haven't seen you in a while, {{contact.FIRSTNAME}}"
       - UTM params: utm_source=brevo&utm_medium=email&utm_campaign=champions-reactivation
""")

    if dns_records:
        print("  DNS records captured during this run:")
        for rec in dns_records:
            print(f"    {json.dumps(rec)}")


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

    # 1. Domain
    domain_data  = add_sending_domain(headers)
    dns_records  = print_dns_records(domain_data)

    # 2. Sender
    sender_id = create_sender(headers)

    # 3. Contact list
    list_id = create_contact_list(headers)

    # 4a. Custom attributes
    create_contact_attributes(headers)

    # 4b. Import contacts (only if we have a list ID)
    import_result = None
    if list_id:
        import_result = import_contacts(headers, list_id)
    else:
        err("Skipping contact import — no list ID available.")

    # 5. Summary
    print_summary(domain_data, dns_records, sender_id, list_id, import_result)


if __name__ == "__main__":
    main()
