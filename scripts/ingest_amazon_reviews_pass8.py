#!/usr/bin/env python3
"""
Pass 8 ingest — team applied our fix list, so most handles are now baked into
the handoff. Strict (verified ratings only, FTC-safe) per standing policy.

Input  : /tmp/stehlen-amazon-reviews/reviews_strict.json
Output : data/amazon-reviews.json (replaces Pass 7 output)

Status policy (per PASS8_CHANGES.md):
  KEEP  : no_fix_record, mapped_high_confidence, mapped_medium_confidence_pending_verify
  SKIP  : not_in_catalog, wrong_map_removed, mapped_low_confidence_likely_wrong

Handle resolution priority:
  1. p["shopify_handle"] (filled by team for 41/55 displayable products)
  2. data/jlsku-resolved-2026-05-27.json [asin].handle (covers the 30 no_fix_record
     where shopify_handle is null — team flagged these as our prior-pass resolution)

Anything that resolves to no handle is logged + skipped (no silent drops).
"""
import json, csv, os, shutil

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = "/tmp/stehlen-amazon-reviews"
strict = json.load(open(f"{P}/reviews_strict.json"))
prior_resolved = json.load(open(f"{REPO}/data/jlsku-resolved-2026-05-27.json"))  # asin -> {jl_sku, handle, via}
photo_dst = f"{REPO}/public/reviews"
os.makedirs(photo_dst, exist_ok=True)

DISPLAYABLE = {
    "no_fix_record",
    "mapped_high_confidence",
    "mapped_medium_confidence_pending_verify",
}

def copy_photos(r):
    out = []
    for lp in (r.get("image_local_paths") or []):
        base = os.path.basename(lp)
        for cand in (os.path.join(P, lp), os.path.join(P, "images", base), os.path.join(P, base)):
            if os.path.isfile(cand):
                shutil.copy2(cand, os.path.join(photo_dst, base))
                out.append(f"/reviews/{base}")
                break
    return out

by_handle = {}
photos_copied = 0
skipped_status = {"not_in_catalog": 0, "wrong_map_removed": 0, "mapped_low_confidence_likely_wrong": 0}
skipped_no_handle = []  # (asin, jl_sku, status) — flag for owner
status_counts = {"no_fix_record": 0, "mapped_high_confidence": 0, "mapped_medium_confidence_pending_verify": 0}
handle_via = {"team": 0, "prior_resolution": 0}

for p in strict["products"]:
    status = p.get("shopify_status", "")
    if status not in DISPLAYABLE:
        skipped_status[status] = skipped_status.get(status, 0) + 1
        continue

    asin = p["asin"]
    jl_sku = p.get("jl_sku", "")

    # Resolve handle: team's field first, then our prior resolution
    handle = (p.get("shopify_handle") or "").strip()
    if handle:
        handle_via["team"] += 1
    else:
        prior = prior_resolved.get(asin)
        if prior:
            handle = (prior.get("handle") or "").strip()
            if handle:
                handle_via["prior_resolution"] += 1
    if not handle:
        skipped_no_handle.append((asin, jl_sku, status))
        continue

    status_counts[status] = status_counts.get(status, 0) + 1

    # Strict file should be inferred=false on everything, but defensive double-check
    verified = [r for r in p.get("qualifying_reviews", []) if not r.get("rating_inferred")]
    if not verified:
        continue

    bundle = by_handle.setdefault(handle, {
        "handle": handle,
        "asin": asin,
        "amazon_title": p.get("title", ""),
        "avg_rating": 0,
        "review_count": 0,
        "reviews": [],
    })
    seen = {rv["id"] for rv in bundle["reviews"]}
    for r in verified:
        rid = r.get("review_id")
        if not rid or rid in seen:
            continue
        imgs = copy_photos(r)
        photos_copied += len(imgs)
        bundle["reviews"].append({
            "id": rid,
            "stars": r.get("star_rating") or 0,
            "title": r.get("review_title") or "",
            "body": r.get("review_body") or "",
            "reviewer": r.get("reviewer_name") or "Amazon Customer",
            "date": r.get("review_date") or "",
            "verified": bool(r.get("verified_purchase")),
            "helpful_votes": r.get("helpful_votes") or 0,
            "images": imgs,
        })
        seen.add(rid)

# Finalize aggregates; sort reviews helpful desc -> date desc
for b in by_handle.values():
    b["reviews"].sort(key=lambda r: (r["helpful_votes"], r["date"]), reverse=True)
    b["review_count"] = len(b["reviews"])
    b["avg_rating"] = round(sum(r["stars"] for r in b["reviews"]) / max(1, len(b["reviews"])), 1)

out = {
    "generated_at": "2026-05-28",
    "source": "Amazon (Pass 8, team-applied fix list, verified ratings only)",
    "by_handle": by_handle,
}
json.dump(out, open(f"{REPO}/data/amazon-reviews.json", "w"), indent=2)

tot_rev = sum(b["review_count"] for b in by_handle.values())
print(f"INTEGRATED: {len(by_handle)} handles | {tot_rev} verified reviews | {photos_copied} photos copied")
print()
print("Status breakdown (kept):")
for k, n in status_counts.items():
    print(f"  {k:42s}  {n}")
print()
print("Handle resolution source:")
for k, n in handle_via.items():
    print(f"  {k:42s}  {n}")
print()
print("Status breakdown (skipped):")
for k, n in skipped_status.items():
    print(f"  {k:42s}  {n}")
print()
if skipped_no_handle:
    print(f"WARNING — {len(skipped_no_handle)} displayable products had no resolvable handle (team note missing AND no prior resolution):")
    for asin, jl, st in skipped_no_handle:
        print(f"  asin={asin}  jl_sku={jl}  status={st}")
else:
    print("All displayable products resolved to a handle. ✓")
