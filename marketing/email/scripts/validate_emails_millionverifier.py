"""
validate_emails_millionverifier.py
-----------------------------------
Validates the Champions email list against the MillionVerifier Bulk API v2.

Flow:
  1. Read data/exports/klaviyo_champions_safe.csv
  2. Extract emails into a temp file and upload to MillionVerifier
  3. Poll every 30 seconds until verification is complete
  4. Download the full results CSV
  5. Filter: keep "ok" emails as valid; everything else is rejected
  6. Merge validation results back onto the full Champions dataframe
  7. Write:
       data/exports/klaviyo_champions_validated.csv  — ok/valid only
       data/exports/klaviyo_champions_rejected.csv   — everything else
  8. Print a summary breakdown

Requires in .env:
  MILLIONVERIFIER_API_KEY=<your key from https://app.millionverifier.com/api>

Usage:
  python scripts/validate_emails_millionverifier.py
"""

import os
import sys
import time
import tempfile
import io
import logging

import requests
import pandas as pd
from dotenv import load_dotenv

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

load_dotenv()

API_KEY = os.getenv("MILLIONVERIFIER_API_KEY")

BASE_URL = "https://bulkapi.millionverifier.com/bulkapi/v2"

INPUT_PATH  = "data/exports/klaviyo_champions_safe.csv"
OUTPUT_VALID    = "data/exports/klaviyo_champions_validated.csv"
OUTPUT_REJECTED = "data/exports/klaviyo_champions_rejected.csv"

# Statuses MillionVerifier considers deliverable
VALID_STATUSES = {"ok"}

# How long to wait between status polls (seconds)
POLL_INTERVAL = 30

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def check_env() -> None:
    """Abort early if the API key is missing."""
    if not API_KEY:
        log.error(
            "MILLIONVERIFIER_API_KEY is not set in .env. "
            "Add it and re-run the script."
        )
        sys.exit(1)


def upload_file(email_series: pd.Series) -> str:
    """
    Write emails to a temp CSV and upload to MillionVerifier.
    Returns the file_id string for subsequent polling/download calls.
    """
    log.info("Preparing email file for upload (%d addresses)...", len(email_series))

    # Build a minimal single-column CSV in memory
    csv_bytes = email_series.to_csv(index=False, header=False).encode("utf-8")

    # MillionVerifier expects a multipart/form-data upload
    url = f"{BASE_URL}/upload"
    files = {
        "file_contents": ("emails.csv", io.BytesIO(csv_bytes), "text/csv"),
    }
    data = {"key": API_KEY}

    log.info("Uploading to MillionVerifier...")
    resp = requests.post(url, files=files, data=data, timeout=120)

    if resp.status_code != 200:
        log.error("Upload failed — HTTP %d: %s", resp.status_code, resp.text)
        sys.exit(1)

    payload = resp.json()

    # The API returns an error field with a non-empty string on failure
    if payload.get("error"):
        log.error("Upload API error: %s", payload["error"])
        sys.exit(1)

    file_id = str(payload.get("file_id") or payload.get("id", ""))
    if not file_id:
        log.error("No file_id in upload response: %s", payload)
        sys.exit(1)

    log.info("Upload accepted. file_id = %s", file_id)
    return file_id


def poll_until_complete(file_id: str) -> dict:
    """
    Poll the file status endpoint every POLL_INTERVAL seconds.
    Returns the final status payload once status == 'finished'.
    Aborts if status == 'canceled' or an error is returned.
    """
    url = f"{BASE_URL}/file/{file_id}"
    params = {"key": API_KEY}

    log.info("Polling for completion (every %ds)...", POLL_INTERVAL)

    while True:
        try:
            resp = requests.get(url, params=params, timeout=30)
        except requests.RequestException as e:
            log.warning("Poll request failed: %s — retrying in %ds", e, POLL_INTERVAL)
            time.sleep(POLL_INTERVAL)
            continue

        if resp.status_code != 200:
            log.warning("Status poll HTTP %d — retrying in %ds", resp.status_code, POLL_INTERVAL)
            time.sleep(POLL_INTERVAL)
            continue

        try:
            payload = resp.json()
        except (ValueError, requests.exceptions.JSONDecodeError):
            log.warning("Poll returned non-JSON (body length=%d) — retrying in %ds", len(resp.text), POLL_INTERVAL)
            time.sleep(POLL_INTERVAL)
            continue

        if payload.get("error"):
            log.error("Status API error: %s", payload["error"])
            sys.exit(1)

        status  = payload.get("status", "unknown")
        percent = payload.get("percent", 0)
        total   = payload.get("total_rows", "?")
        verified = payload.get("verified", "?")

        log.info(
            "Status: %-12s | %3s%% complete | %s / %s verified",
            status, percent, verified, total,
        )

        if status == "finished":
            log.info("Verification complete.")
            return payload

        if status == "canceled":
            log.error("MillionVerifier job was canceled. Check your account dashboard.")
            sys.exit(1)

        time.sleep(POLL_INTERVAL)


def download_results(file_id: str) -> pd.DataFrame:
    """
    Download the full results CSV (filter=all includes every status).
    Returns a DataFrame with at minimum columns: email, result, quality.
    """
    url = f"{BASE_URL}/download/{file_id}"
    params = {"key": API_KEY, "filter": "all"}

    log.info("Downloading results from MillionVerifier...")
    resp = requests.get(url, params=params, timeout=120, stream=True)

    if resp.status_code != 200:
        log.error("Download failed — HTTP %d: %s", resp.status_code, resp.text)
        sys.exit(1)

    # The response is a CSV file
    content = resp.content.decode("utf-8", errors="replace")

    try:
        df = pd.read_csv(io.StringIO(content))
    except Exception as exc:
        log.error("Failed to parse downloaded CSV: %s", exc)
        log.debug("Raw response (first 500 chars): %s", content[:500])
        sys.exit(1)

    log.info("Downloaded %d result rows. Columns: %s", len(df), list(df.columns))
    return df


def normalise_results(results_df: pd.DataFrame) -> pd.DataFrame:
    """
    MillionVerifier's download CSV uses the column name 'result' for the
    verification status (ok / catch_all / invalid / unknown / disposable).
    Normalise column names to lowercase and ensure 'email' is present.
    """
    results_df.columns = [c.strip().lower() for c in results_df.columns]

    if "email" not in results_df.columns:
        log.error(
            "No 'email' column in results. Columns found: %s", list(results_df.columns)
        )
        sys.exit(1)

    if "result" not in results_df.columns:
        # Some API versions use 'quality' or 'status' — handle gracefully
        for alt in ("quality", "status", "verification_result"):
            if alt in results_df.columns:
                log.warning("No 'result' column; using '%s' instead.", alt)
                results_df = results_df.rename(columns={alt: "result"})
                break
        else:
            log.error(
                "Cannot find a result/quality column. Columns: %s",
                list(results_df.columns),
            )
            sys.exit(1)

    # Lowercase result values for consistent filtering
    results_df["result"] = results_df["result"].str.strip().str.lower()
    return results_df


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    check_env()

    # ------------------------------------------------------------------
    # Step 1: Load Champions data
    # ------------------------------------------------------------------
    log.info("Reading Champions list from %s ...", INPUT_PATH)
    try:
        champions_df = pd.read_csv(INPUT_PATH)
    except FileNotFoundError:
        log.error("Input file not found: %s", INPUT_PATH)
        sys.exit(1)

    log.info("Loaded %d Champions rows.", len(champions_df))

    if "email" not in champions_df.columns:
        log.error(
            "No 'email' column in input CSV. Columns found: %s",
            list(champions_df.columns),
        )
        sys.exit(1)

    # Drop rows with null email — they can't be validated
    original_count = len(champions_df)
    champions_df = champions_df[champions_df["email"].notna()].copy()
    if len(champions_df) < original_count:
        log.warning(
            "Dropped %d rows with null email.",
            original_count - len(champions_df),
        )

    # Deduplicate emails for the upload (keeps costs down; we merge back later)
    unique_emails = champions_df["email"].drop_duplicates().reset_index(drop=True)
    log.info("%d unique emails to verify.", len(unique_emails))

    # ------------------------------------------------------------------
    # Step 2: Upload
    # ------------------------------------------------------------------
    file_id = upload_file(unique_emails)

    # ------------------------------------------------------------------
    # Step 3: Poll until done
    # ------------------------------------------------------------------
    final_status = poll_until_complete(file_id)

    # ------------------------------------------------------------------
    # Step 4: Download results
    # ------------------------------------------------------------------
    results_df = download_results(file_id)
    results_df = normalise_results(results_df)

    # Keep only the columns we need for the merge
    # (result + any extra quality columns MillionVerifier adds)
    mv_cols = ["email", "result"]
    optional_mv_cols = ["quality", "free", "role", "disposable", "did_you_mean"]
    for col in optional_mv_cols:
        if col in results_df.columns:
            mv_cols.append(col)

    results_slim = results_df[mv_cols].copy()
    results_slim = results_slim.rename(columns={"result": "mv_result"})

    # ------------------------------------------------------------------
    # Step 5: Merge results back onto Champions data
    # ------------------------------------------------------------------
    log.info("Merging validation results onto Champions data...")
    merged_df = champions_df.merge(results_slim, on="email", how="left")

    # Emails that MillionVerifier returned no result for get flagged as 'unknown'
    merged_df["mv_result"] = merged_df["mv_result"].fillna("unknown")

    # ------------------------------------------------------------------
    # Step 6: Split into valid and rejected
    # ------------------------------------------------------------------
    valid_mask    = merged_df["mv_result"].isin(VALID_STATUSES)
    validated_df  = merged_df[valid_mask].copy()
    rejected_df   = merged_df[~valid_mask].copy()

    # ------------------------------------------------------------------
    # Step 7: Save outputs
    # ------------------------------------------------------------------
    os.makedirs("data/exports", exist_ok=True)

    validated_df.to_csv(OUTPUT_VALID, index=False)
    log.info("Saved %d validated emails to %s", len(validated_df), OUTPUT_VALID)

    rejected_df.to_csv(OUTPUT_REJECTED, index=False)
    log.info("Saved %d rejected emails to %s", len(rejected_df), OUTPUT_REJECTED)

    # ------------------------------------------------------------------
    # Step 8: Summary
    # ------------------------------------------------------------------
    result_counts = merged_df["mv_result"].value_counts()

    print("\n" + "=" * 60)
    print("  MILLIONVERIFIER RESULTS SUMMARY")
    print("=" * 60)
    print(f"  Total input rows      : {len(champions_df):>8,}")
    print(f"  Unique emails sent    : {len(unique_emails):>8,}")
    print("-" * 60)

    status_order = ["ok", "catch_all", "disposable", "invalid", "unknown"]
    for status in status_order:
        count = result_counts.get(status, 0)
        pct   = count / len(merged_df) * 100 if len(merged_df) > 0 else 0
        marker = "  <-- KEPT" if status in VALID_STATUSES else ""
        print(f"  {status:<18}    : {count:>8,}   ({pct:5.1f}%){marker}")

    # Any statuses not in our expected list
    for status, count in result_counts.items():
        if status not in status_order:
            pct = count / len(merged_df) * 100
            print(f"  {status:<18}    : {count:>8,}   ({pct:5.1f}%)")

    print("-" * 60)
    print(f"  VALID (kept)          : {len(validated_df):>8,}")
    print(f"  REJECTED              : {len(rejected_df):>8,}")
    print("=" * 60)

    # Surface any MillionVerifier-level counts from the status payload
    if final_status:
        print("\n  MillionVerifier job totals (from status endpoint):")
        for field in ("ok", "catch_all", "disposable", "invalid", "unknown", "reverify"):
            val = final_status.get(field)
            if val is not None:
                print(f"    {field:<14}: {val:,}")

    print()
    log.info("Done.")


if __name__ == "__main__":
    main()
