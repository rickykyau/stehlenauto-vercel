"""
fix_brevo_campaigns_26_27.py

Applies the same improvements as the fixed Toyota campaign (#25) to:
  - Campaign 26: Chevrolet/GMC Silverado/Sierra
  - Campaign 27: Dodge/Ram Ram 1500

Fixes applied to both:
  1. Correct product title (verified from Shopify)
  2. Add product image (clickable, links to PDP)
  3. Fix sender name: [DEFAULT_FROM_NAME] -> "Stehlen Auto" (sender ID 2)
  4. Add price in large bold + FREE shipping line
  5. Add "Browse all [Make] parts" secondary link
  6. Fix CTA button text to "VIEW THIS TONNEAU COVER"
  7. Fix header label text (CHEVROLET/GMC, RAM/DODGE)
  8. Fix body copy to match each make
  9. Fix social proof line to "300,000+ customers"

Prices from Shopify Admin API (verified):
  Silverado/Sierra: $680.00 -> 10% off = $612.00
  Ram 1500:         $212.00 -> 10% off = $190.80

NEVER calls sendNow. Uses PUT /emailCampaigns/{id} only.

Usage:
  python scripts/fix_brevo_campaigns_26_27.py
"""

import json
import os
import sys

import requests
from dotenv import load_dotenv

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_PATH = os.path.join(BASE_DIR, ".env")

BREVO_BASE = "https://api.brevo.com/v3"
SENDER_ID  = 2   # "Stehlen Auto" <info@updates.stehlenauto.com> — pre-verified

LOGO_URL = (
    "https://cdn.shopify.com/s/files/1/0724/2638/9551/files/"
    "stehlen-logo-email-dark.png?v=1774929918"
)


# ---------------------------------------------------------------------------
# HTML builder — identical structure to fixed Toyota (#25)
# ---------------------------------------------------------------------------

def build_html(
    make_label: str,          # e.g. "CHEVROLET/GMC"
    product_title: str,       # e.g. "2019-2026 Silverado/Sierra 1500 5.8 ft Bed Tonneau Cover w/ LED"
    product_url: str,
    product_image_url: str,
    product_image_alt: str,
    body_vehicle: str,        # e.g. "Silverado/Sierra"
    price: str,               # e.g. "680.00"
    price_discounted: str,    # e.g. "612.00"
    browse_url: str,
    browse_label: str,        # e.g. "Browse all Chevrolet/GMC parts"
) -> str:
    # %% escapes literal % in an f-string that will NOT be passed through str.format()
    return f"""\
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background-color: #ffffff; color: #333333;">
  <div style="background-color: #0a0a0a; padding: 0; text-align: center;">
    <img src="{LOGO_URL}" alt="Stehlen Auto" style="max-width: 100%; height: auto; display: block; margin: 0 auto;" />
  </div>
  <div style="padding: 20px;">
    <p style="font-size: 13px; color: #f5a823; font-weight: bold; margin-bottom: 5px;">RECOMMENDED FOR YOUR {make_label}</p>
    <p style="font-size: 18px; font-weight: bold; color: #333;">{product_title}</p>
    <a href="{product_url}">
      <img src="{product_image_url}" alt="{product_image_alt}" style="width: 100%; max-width: 560px; height: auto; display: block; margin: 15px auto; border-radius: 4px;" />
    </a>
    <p>Hey {{{{ contact.FIRSTNAME | default: "there" }}}},</p>
    <p>This is one of our most popular upgrades for the <strong>{body_vehicle}</strong> - and it ships free with our fitment guarantee.</p>
    <p style="font-size: 22px; font-weight: bold; color: #333; margin: 10px 0;">&#36;{price} <span style="font-size: 14px; color: #f5a823; font-weight: normal;">+ FREE shipping</span></p>
    <p>Use code <strong style="color: #f5a823; font-size: 16px;">DIRECT10</strong> for 10% off - <strong>your price: &#36;{price_discounted}</strong></p>
    <p style="text-align: center; margin: 25px 0;">
      <a href="{product_url}" style="display: inline-block; padding: 16px 40px; background-color: #f5a823; color: #000000; text-decoration: none; font-weight: bold; font-size: 16px; border-radius: 4px;">VIEW THIS TONNEAU COVER</a>
    </p>
    <p style="text-align: center; margin: 10px 0;">
      <a href="{browse_url}" style="color: #f5a823; font-size: 13px;">{browse_label}</a>
    </p>
    <table width="100%" style="margin-top: 20px; border-top: 1px solid #eee; padding-top: 15px;">
      <tr>
        <td style="text-align: center; padding: 8px; font-size: 12px; color: #666;"><strong>Free Shipping</strong><br/>All orders</td>
        <td style="text-align: center; padding: 8px; font-size: 12px; color: #666;"><strong>Fitment Guaranteed</strong><br/>Confirmed to fit</td>
        <td style="text-align: center; padding: 8px; font-size: 12px; color: #666;"><strong>Easy Returns</strong><br/>30-day hassle-free</td>
      </tr>
    </table>
    <p style="color: #999; font-size: 11px; margin-top: 20px; text-align: center;">10+ years in business. 300,000+ customers. Previously on eBay.</p>
    <p style="font-size: 12px; color: #666;">- Stehlen Auto<br/><a href="https://stehlenauto.com" style="color: #f5a823;">stehlenauto.com</a></p>
  </div>
</body>
</html>"""


# ---------------------------------------------------------------------------
# Campaign definitions
# ---------------------------------------------------------------------------

CHEVY_PRICE           = "680.00"
CHEVY_PRICE_OFF       = "612.00"   # 680 * 0.90

RAM_PRICE             = "212.00"
RAM_PRICE_OFF         = "190.80"   # 212 * 0.90

CHEVY_PRODUCT_URL = (
    "https://stehlenauto.com/products/2019-chevy-silverado-gmc-sierra-5-8ft-tri-fold-tonneau-cover-w-led"
    "?utm_source=brevo&utm_medium=email&utm_campaign=champions-pdp&utm_content=hero-product"
)
CHEVY_BROWSE_URL = (
    "https://stehlenauto.com/collections/chevrolet"
    "?utm_source=brevo&utm_medium=email&utm_campaign=champions-pdp&utm_content=browse-all"
)
CHEVY_IMAGE_URL = (
    "https://cdn.shopify.com/s/files/1/0724/2638/9551/files/"
    "LISTING_tc-lth-ws-2_9776e136-90a1-42f6-858f-9b6d7e6a3545.jpg?v=1773341686"
)

RAM_PRODUCT_URL = (
    "https://stehlenauto.com/products/2019-dodge-ram-5-8ft-bed-flush-roll-up-vinyl-tonneau-cover"
    "?utm_source=brevo&utm_medium=email&utm_campaign=champions-pdp&utm_content=hero-product"
)
RAM_BROWSE_URL = (
    "https://stehlenauto.com/collections/dodge"
    "?utm_source=brevo&utm_medium=email&utm_campaign=champions-pdp&utm_content=browse-all"
)
RAM_IMAGE_URL = (
    "https://cdn.shopify.com/s/files/1/0724/2638/9551/files/"
    "LISTING_tc-fru2-uni-ws-1_51d8605b-2c6f-4c45-bdae-802d2353a39e.jpg?v=1773340473"
)

CAMPAIGNS = [
    {
        "id": 26,
        "html": build_html(
            make_label         = "CHEVROLET/GMC",
            product_title      = "2019-2026 Silverado/Sierra 1500 5.8 ft Bed Tonneau Cover w/ LED",
            product_url        = CHEVY_PRODUCT_URL,
            product_image_url  = CHEVY_IMAGE_URL,
            product_image_alt  = "Silverado/Sierra Tonneau Cover with LED",
            body_vehicle       = "Silverado/Sierra",
            price              = CHEVY_PRICE,
            price_discounted   = CHEVY_PRICE_OFF,
            browse_url         = CHEVY_BROWSE_URL,
            browse_label       = "Browse all Chevrolet/GMC parts",
        ),
        "label": "Campaign 26 — Chevrolet",
    },
    {
        "id": 27,
        "html": build_html(
            make_label         = "RAM/DODGE",
            product_title      = "2019-2026 Dodge Ram 1500 5.7 ft Bed Flush Roll-Up Tonneau Cover",
            product_url        = RAM_PRODUCT_URL,
            product_image_url  = RAM_IMAGE_URL,
            product_image_alt  = "Ram 1500 Flush Roll-Up Tonneau Cover",
            body_vehicle       = "Ram 1500",
            price              = RAM_PRICE,
            price_discounted   = RAM_PRICE_OFF,
            browse_url         = RAM_BROWSE_URL,
            browse_label       = "Browse all Ram/Dodge parts",
        ),
        "label": "Campaign 27 — Dodge/Ram",
    },
]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def brevo_headers(api_key: str) -> dict:
    return {
        "api-key":      api_key,
        "Content-Type": "application/json",
        "Accept":       "application/json",
    }


def section(title: str) -> None:
    print(f"\n{'=' * 65}")
    print(f"  {title}")
    print(f"{'=' * 65}")


def ok(msg: str)   -> None: print(f"  [OK]    {msg}")
def warn(msg: str) -> None: print(f"  [WARN]  {msg}")
def info(msg: str) -> None: print(f"  [INFO]  {msg}")
def err(msg: str)  -> None: print(f"  [ERROR] {msg}")


# ---------------------------------------------------------------------------
# Verification helper
# ---------------------------------------------------------------------------

def verify_html(html: str, campaign_id: int, expected_make: str, forbidden_makes: list) -> dict:
    """
    Run a quick sanity check on the HTML about to be sent to Brevo.
    Returns a dict of check results.
    """
    checks = {
        "has_logo":          "stehlen-logo-email-dark.png" in html,
        "has_product_image": "cdn.shopify.com" in html and "<img src" in html and "LISTING_" in html,
        "has_price":         "&#36;" in html,
        "has_direct10":      "DIRECT10" in html,
        "has_browse_link":   "browse-all" in html,
        "has_free_shipping": "FREE shipping" in html,
        "has_cta_button":    "VIEW THIS TONNEAU COVER" in html,
        "correct_make_label": expected_make in html,
        "300k_customers":    "300,000+" in html,
    }
    for make in forbidden_makes:
        checks[f"no_wrong_make_{make}"] = make not in html
    return checks


# ---------------------------------------------------------------------------
# Update + verify
# ---------------------------------------------------------------------------

def update_campaign(campaign: dict, headers: dict) -> bool:
    cid   = campaign["id"]
    label = campaign["label"]
    html  = campaign["html"]

    section(f"Updating {label}")

    # Use name+email (not id-only) so the stored sender.name field is set explicitly.
    # Brevo stores the literal string passed in name — passing id-only leaves whatever
    # name was on the campaign at creation time (e.g. "[DEFAULT_FROM_NAME]").
    payload = {
        "htmlContent": html,
        "sender": {
            "name":  "Stehlen Auto",
            "email": "info@updates.stehlenauto.com",
        },
    }

    r = requests.put(
        f"{BREVO_BASE}/emailCampaigns/{cid}",
        headers=headers,
        json=payload,
        timeout=30,
    )

    if r.status_code == 204:
        ok(f"PUT /emailCampaigns/{cid} -> 204 No Content (success)")
    else:
        try:
            body = r.json()
        except Exception:
            body = {"raw": r.text}
        err(f"PUT /emailCampaigns/{cid} -> {r.status_code}: {json.dumps(body, indent=2)}")
        return False

    # --- Re-fetch to verify ---
    info("Re-fetching campaign to verify...")
    r2 = requests.get(
        f"{BREVO_BASE}/emailCampaigns/{cid}",
        headers=headers,
        timeout=30,
    )
    if r2.status_code != 200:
        err(f"GET /emailCampaigns/{cid} -> {r2.status_code}")
        return False

    data   = r2.json()
    sender = data.get("sender", {})
    html_r = data.get("htmlContent", "")

    # Determine which make we expect and which are forbidden cross-references
    if cid == 26:
        expected_make  = "CHEVROLET/GMC"
        forbidden      = ["Toyota", "Tundra", "Tacoma", "RAM/DODGE", "Ram 1500"]
    else:
        expected_make  = "RAM/DODGE"
        forbidden      = ["Toyota", "Tundra", "Tacoma", "CHEVROLET/GMC", "Silverado", "Sierra"]

    checks = verify_html(html_r, cid, expected_make, forbidden)

    section(f"VERIFICATION — {label}")
    print(f"  Sender name  : {sender.get('name')}")
    print(f"  Sender email : {sender.get('email')}")
    print(f"  HTML length  : {len(html_r)} chars")
    print()

    all_passed = True
    check_labels = {
        "has_logo":             "Has logo image",
        "has_product_image":    "Has product image (LISTING_ CDN)",
        "has_price":            "Has price (&#36;)",
        "has_direct10":         "Has DIRECT10 code",
        "has_browse_link":      "Has browse-all link",
        "has_free_shipping":    "Has FREE shipping text",
        "has_cta_button":       "CTA = VIEW THIS TONNEAU COVER",
        "correct_make_label":   f"Header label contains {expected_make}",
        "300k_customers":       "Social proof: 300,000+ customers",
    }
    for make in forbidden:
        check_labels[f"no_wrong_make_{make}"] = f"No cross-contamination: '{make}'"

    for key, label_str in check_labels.items():
        passed = checks.get(key, False)
        status = "PASS" if passed else "FAIL"
        marker = ok if passed else err
        marker(f"[{status}] {label_str}")
        if not passed:
            all_passed = False

    if all_passed:
        print()
        ok(f"All checks passed for campaign {cid}.")
    else:
        print()
        warn(f"Some checks failed for campaign {cid} — review HTML above.")

    return all_passed


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
    h = brevo_headers(api_key)

    results = {}
    for campaign in CAMPAIGNS:
        passed = update_campaign(campaign, h)
        results[campaign["id"]] = passed

    section("FINAL SUMMARY")
    for cid, passed in results.items():
        status = "ALL CHECKS PASSED" if passed else "NEEDS REVIEW"
        print(f"  Campaign {cid}: {status}")
        print(f"    https://app.brevo.com/campaigns/email/detail/{cid}")
    print()
    print("  Campaigns remain in 'queued' status — no sendNow called.")
    print("  Send from the Brevo dashboard per the warm-up schedule.")


if __name__ == "__main__":
    main()
