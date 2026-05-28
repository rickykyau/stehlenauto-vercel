#!/usr/bin/env python3
"""
Pass 7 ingest — CONFIDENT-ONLY per owner directive ("only do what you can
match confidently; send me the rest to review").

Integrates into data/amazon-reviews.json ONLY:
  - products whose jl_sku resolved to a Shopify handle deterministically
    (image-filename stem match, data/jlsku-resolved-2026-05-27.json), AND
  - their VERIFIED, non-inferred reviews (real Amazon star ratings).

Everything uncertain is NOT published — it's written to two review CSVs for
the owner to confirm:
  - data/pass7-sku-mapping-review.csv     (all 120 products: matched / unresolved)
  - data/pass7-inferred-reviews-review.csv (the 107 sentiment-inferred reviews)
"""
import json, csv, os, shutil

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = "/tmp/stehlen-amazon-reviews-p7"
prods = json.load(open(f"{P}/reviews.json"))["products"]
resolved = json.load(open(f"{REPO}/data/jlsku-resolved-2026-05-27.json"))  # asin -> {jl_sku, handle, via}
photo_dst = f"{REPO}/public/reviews"
os.makedirs(photo_dst, exist_ok=True)

# auto-parts audit (2026-05-27) flagged these confident image-stem matches as WRONG product — never publish
PULL_ASINS = {
    "B084SNMBLC",  # Impala 06 grille -> wrongly mapped to Tahoe grille handle
    "B07PZFTRX9",  # Silverado 07 running boards -> wrongly mapped to Ram 1500 handle
    "B07JR9DQS5",  # F-150 15 step bars -> wrongly mapped to Super Duty handle
    "B07L8V34FL",  # Yukon grille combo (glossy, upper+lower) -> matte upper-only handle
    "B07N9RCKXH",  # F-150 grey rubber bed mat -> black PVC mat handle
}

def is_inferred(r): return str(r.get("rating_inferred")) in ("1", "True", "true")

def copy_photos(asin, r):
    out = []
    for lp in (r.get("image_local_paths") or []):
        base = os.path.basename(lp)
        for cand in (os.path.join(P, lp), os.path.join(P, "images", base), os.path.join(P, base)):
            if os.path.isfile(cand):
                shutil.copy2(cand, os.path.join(photo_dst, base)); out.append(f"/reviews/{base}"); break
    return out

by_handle = {}
photos_copied = 0
for p in prods:
    asin = p["asin"]
    if asin in PULL_ASINS:   # audit-flagged wrong match — never publish
        continue
    info = resolved.get(asin)
    if not info:   # unresolved -> review list only
        continue
    handle = info["handle"]
    verified = [r for r in p.get("qualifying_reviews", []) if not is_inferred(r)]
    if not verified:
        continue
    bundle = by_handle.setdefault(handle, {
        "handle": handle, "asin": asin, "amazon_title": p.get("title", ""),
        "avg_rating": 0, "review_count": 0, "reviews": [],
    })
    seen = {rv["id"] for rv in bundle["reviews"]}
    for r in verified:
        rid = r.get("review_id")
        if not rid or rid in seen: continue
        imgs = copy_photos(asin, r); photos_copied += len(imgs)
        bundle["reviews"].append({
            "id": rid, "stars": r.get("star_rating") or 0,
            "title": r.get("review_title") or "", "body": r.get("review_body") or "",
            "reviewer": r.get("reviewer_name") or "Amazon Customer",
            "date": r.get("review_date") or "", "verified": bool(r.get("verified_purchase")),
            "helpful_votes": r.get("helpful_votes") or 0, "images": imgs,
        })
        seen.add(rid)

# finalize aggregates; sort reviews helpful desc -> date desc
for b in by_handle.values():
    b["reviews"].sort(key=lambda r: (r["helpful_votes"], r["date"]), reverse=True)
    b["review_count"] = len(b["reviews"])
    b["avg_rating"] = round(sum(r["stars"] for r in b["reviews"]) / max(1, len(b["reviews"])), 1)

out = {"generated_at": "2026-05-27", "source": "Amazon (Pass 7, confident image-stem matches, verified ratings only)", "by_handle": by_handle}
json.dump(out, open(f"{REPO}/data/amazon-reviews.json", "w"), indent=2)

tot_rev = sum(b["review_count"] for b in by_handle.values())
print(f"INTEGRATED (confident + verified): {len(by_handle)} handles | {tot_rev} reviews | {photos_copied} photos copied")

# ---- review CSV 1: full SKU mapping ----
with open(f"{REPO}/data/pass7-sku-mapping-review.csv", "w", newline="") as f:
    w = csv.writer(f)
    w.writerow(["jl_sku","asin","title","resolved_handle","method","confidence","verified_reviews","inferred_reviews","photos","jl_sku_resolution"])
    for p in prods:
        asin=p["asin"]; info=resolved.get(asin)
        ver=sum(1 for r in p.get("qualifying_reviews",[]) if not is_inferred(r))
        inf=sum(1 for r in p.get("qualifying_reviews",[]) if is_inferred(r))
        ph=sum(len(r.get("image_local_paths") or []) for r in p.get("qualifying_reviews",[]))
        w.writerow([p["jl_sku"], asin, p.get("title","")[:90],
                    info["handle"] if info else "",
                    "image-stem (confident)" if info else "UNRESOLVED — needs match",
                    "high" if info else "",
                    ver, inf, ph, p.get("jl_sku_resolution","")])

# ---- review CSV 2: inferred reviews held for FTC review ----
with open(f"{REPO}/data/pass7-inferred-reviews-review.csv", "w", newline="") as f:
    w = csv.writer(f)
    w.writerow(["asin","jl_sku","resolved_handle","inferred_star","tier","has_photo","reviewer","review_title","review_body"])
    for p in prods:
        asin=p["asin"]; info=resolved.get(asin)
        for r in p.get("qualifying_reviews",[]):
            if is_inferred(r):
                w.writerow([asin, p["jl_sku"], info["handle"] if info else "",
                            r.get("star_rating"), r.get("tier"), r.get("has_photo"),
                            r.get("reviewer_name"), (r.get("review_title") or "")[:80],
                            (r.get("review_body") or "")[:200]])

resolved_n=len(resolved); unresolved_n=120-resolved_n
inf_total=sum(1 for p in prods for r in p.get("qualifying_reviews",[]) if is_inferred(r))
print(f"REVIEW LIST 1 (sku mapping): 120 rows | {resolved_n} confident-matched, {unresolved_n} unresolved")
print(f"REVIEW LIST 2 (inferred): {inf_total} inferred reviews held for your FTC review")
print("wrote: data/amazon-reviews.json, data/pass7-sku-mapping-review.csv, data/pass7-inferred-reviews-review.csv")
