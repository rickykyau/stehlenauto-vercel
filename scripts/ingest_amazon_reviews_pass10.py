#!/usr/bin/env python3
"""
Pass 10b ingest — merges newly mapped products into data/amazon-reviews.json
(additive: existing Pass 8/9 bundles are kept as-is).

Handle resolution (deterministic, no fuzzy matching):
  Amazon listing title == ChannelAdvisor listing title (or Amazon seller SKU)
  -> CA SKU minus its -NNN channel suffix == Shopify cb_integration.item_name
  -> Shopify handle.
Every mapping then passes the auto-parts-specialist audit gate; only KEEP rows
are ingested, minus any individual reviews the audit dropped.

Policy: verified star ratings only — rating_inferred reviews are never imported.
Pass 10 (Apify) reviews carry no reviewer name; they render as "Verified Buyer".

Usage:
  python3 scripts/ingest_amazon_reviews_pass10.py <handoff_dir> <mapping.json> <audit_result.csv>
    handoff_dir   clone of github.com/AIfenceguy/stehlen-amazon-reviews (Pass 10b)
    mapping.json  [{asin, handles: [[handle, status]], skus, bases, ...}]
    audit_result  csv: asin, shopify_handle, verdict, reason, drop_review_snippets
"""
import csv, json, os, subprocess, sys
from datetime import date

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P, MAPPING, AUDIT = sys.argv[1:4]
OUT = f"{REPO}/data/amazon-reviews.json"
PHOTO_DST = f"{REPO}/public/reviews"

data = json.load(open(OUT))
by_handle = data["by_handle"]
live_ids = {r["id"] for b in by_handle.values() for r in b["reviews"]}

products = {p["asin"]: p for p in json.load(open(f"{P}/reviews.json"))["products"]}
mapping = {m["asin"]: m for m in json.load(open(MAPPING)) if m.get("handles")}
audit = {r["asin"]: r for r in csv.DictReader(open(AUDIT, encoding="utf-8-sig"))}


def copy_photo(lp):
    base = os.path.basename(lp)
    for cand in (os.path.join(P, lp), os.path.join(P, "images", base)):
        if os.path.isfile(cand):
            dst = os.path.join(PHOTO_DST, base)
            if not os.path.exists(dst):
                # Downscale: phone originals run 3-4 MB; the lightbox never needs >1600px.
                subprocess.run(
                    ["sips", "-Z", "1600", "-s", "formatOptions", "80", cand, "--out", dst],
                    check=True, capture_output=True,
                )
            return f"/reviews/{base}"
    return None


added_handles, added_reviews, photos, skipped = set(), 0, 0, []
for asin, m in mapping.items():
    a = audit.get(asin)
    if not a or a["verdict"].strip().upper() != "KEEP":
        skipped.append((asin, a["verdict"] if a else "NOT_AUDITED"))
        continue
    handle = m["handles"][0][0]
    assert a["shopify_handle"] == handle, (asin, handle, a["shopify_handle"])
    drops = [s.strip().lower() for s in (a.get("drop_review_snippets") or "").split("||") if s.strip()]

    new = []
    for r in products[asin]["qualifying_reviews"]:
        if r.get("rating_inferred") or r["review_id"] in live_ids:
            continue
        text = f"{r.get('review_title', '')}: {r.get('review_body', '')}".lower()
        if any(d[:60] in text for d in drops):
            continue
        imgs = [u for u in (copy_photo(lp) for lp in r.get("image_local_paths") or []) if u]
        photos += len(imgs)
        new.append({
            "id": r["review_id"],
            "stars": int(r["star_rating"]),
            "title": r.get("review_title") or "",
            "body": r.get("review_body") or "",
            "reviewer": r.get("reviewer_name") or "Verified Buyer",
            "date": r.get("review_date") or "",
            "verified": bool(r.get("verified_purchase")),
            "helpful_votes": int(r.get("helpful_votes") or 0),
            "images": imgs,
        })
        live_ids.add(r["review_id"])
    if not new:
        continue

    b = by_handle.setdefault(handle, {
        "handle": handle, "asin": asin, "amazon_title": products[asin]["title"],
        "avg_rating": 0, "review_count": 0, "reviews": [],
    })
    b["reviews"].extend(new)
    # helpful_votes desc, then date desc (matches src/lib/reviews ordering)
    b["reviews"].sort(key=lambda r: r["date"], reverse=True)
    b["reviews"].sort(key=lambda r: r["helpful_votes"], reverse=True)
    b["review_count"] = len(b["reviews"])
    b["avg_rating"] = round(sum(r["stars"] for r in b["reviews"]) / b["review_count"], 1)
    added_handles.add(handle)
    added_reviews += len(new)

data["generated_at"] = date.today().isoformat()
data["source"] = "Amazon (Pass 8/9 + Pass 10b CA-title-mapped, auto-parts audited, verified ratings only)"
json.dump(data, open(OUT, "w"), indent=2, ensure_ascii=False)

print(f"ADDED: {added_reviews} reviews | {len(added_handles)} handles touched | {photos} photos")
print(f"TOTAL: {len(by_handle)} handles | {sum(b['review_count'] for b in by_handle.values())} reviews")
print(f"SKIPPED (audit): {len(skipped)} {skipped}")
