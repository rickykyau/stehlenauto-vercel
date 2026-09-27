#!/usr/bin/env python3
"""
apply-fitment-corrections.py — apply reviewed fitment corrections (add / remove
rows) to the ChannelAdvisor fitment snapshot and mirror them to Shopify.

Input: a corrections JSON array of
  {"handle": ..., "add": ["YEAR|MAKE|MODEL[|SUBMODEL][::NOTE]", ...],
                  "remove_patterns": ["regex matched against each fitmentRaw line", ...],
                  "universal": false, "reason": "..."}

Writes:
  - data/ca_fitment_snapshot.json  (fitmentRaw + parsed years/makes/models/applications)
  - Shopify metafields custom.fitment_raw / custom.fitment_applications /
    custom.year / custom.make / custom.model   (with --apply-shopify)
  - data/fitment-corrections-log-<ts>.json  (previous values, for rollback)
Then run scripts/build-ymm-index.py to rebuild the YMM tree / products_by_ymm.

NOTE: these corrections live on top of ChannelAdvisor. Re-running
scripts/sync-ca-fitment.ts for these handles would overwrite them unless CA is
fixed at the source too.

Usage: python3 scripts/apply-fitment-corrections.py corrections.json [--apply-shopify]
"""
import json, re, sys, time, urllib.request
from datetime import datetime, timezone
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
SNAP = REPO / "data/ca_fitment_snapshot.json"


def env():
    e = {}
    for l in (REPO / ".env.local").read_text().splitlines():
        l = l.strip()
        if l and not l.startswith("#") and "=" in l:
            k, v = l.split("=", 1)
            e[k.strip()] = v.strip().strip("\"'")
    return e


def parse(raw):
    years, makes, models, apps = set(), set(), set(), []
    for line in raw.splitlines():
        parts = line.split("::")[0].split("|")
        if len(parts) < 3:
            continue
        m = re.match(r"\s*((?:19|20)\d{2})(?:\s*[-–]\s*((?:19|20)\d{2}))?", parts[0])
        if not m:
            continue
        for y in range(int(m.group(1)), int(m.group(2) or m.group(1)) + 1):
            years.add(str(y))
            apps.append({"year": str(y), "make": parts[1].strip(), "model": parts[2].strip()})
        makes.add(parts[1].strip())
        models.add(parts[2].strip())
    # de-dupe applications
    seen, uniq = set(), []
    for a in apps:
        k = (a["year"], a["make"], a["model"])
        if k not in seen:
            seen.add(k)
            uniq.append(a)
    return sorted(years), sorted(makes), sorted(models), uniq


def main():
    corr = json.loads(Path(sys.argv[1]).read_text())
    apply_shopify = "--apply-shopify" in sys.argv
    snap = json.loads(SNAP.read_text())
    log = []
    for c in corr:
        h = c["handle"]
        entry = snap.get(h)
        if entry is None:
            print("SKIP (not in snapshot)", h)
            continue
        before = entry.get("fitmentRaw", "") or ""
        lines = [l for l in before.splitlines() if l.strip()]
        if c.get("universal"):
            lines = []
        for pat in c.get("remove_patterns", []):
            rx = re.compile(pat, re.I)
            lines = [l for l in lines if not rx.search(l)]
        for row in c.get("add", []):
            if row not in lines:
                lines.append(row)
        after = "\n".join(lines)
        if after == before:
            continue
        years, makes, models, apps = parse(after)
        entry["fitmentRaw"] = after
        p = entry.setdefault("parsed", {})
        p.update({"years": years, "makes": makes, "models": models, "applications": apps})
        log.append({"handle": h, "before": before, "after": after, "reason": c.get("reason", "")})
        print(f"{h}: {len(before.splitlines())} -> {len(lines)} rows")
    SNAP.write_text(json.dumps(snap, indent=2))
    ts = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    (REPO / f"data/fitment-corrections-log-{ts}.json").write_text(json.dumps(log, indent=1))
    if not apply_shopify:
        print("snapshot updated; Shopify not touched (pass --apply-shopify)")
        return
    e = env()
    dom = e["NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN"].replace("https://", "").rstrip("/")

    def gql(q, v):
        r = urllib.request.Request(
            f"https://{dom}/admin/api/2026-04/graphql.json",
            data=json.dumps({"query": q, "variables": v}).encode(),
            headers={"Content-Type": "application/json", "X-Shopify-Access-Token": e["SHOPIFY_ADMIN_TOKEN"]},
        )
        return json.load(urllib.request.urlopen(r))

    for item in log:
        pid = gql("query($h:String!){productByHandle(handle:$h){id}}", {"h": item["handle"]})["data"]["productByHandle"]["id"]
        years, makes, models, apps = parse(item["after"])
        mfs = [
            {"ownerId": pid, "namespace": "custom", "key": "fitment_raw", "type": "multi_line_text_field", "value": item["after"] or "-"},
            {"ownerId": pid, "namespace": "custom", "key": "fitment_applications", "type": "json", "value": json.dumps(apps)},
        ]
        if years:
            mfs += [
                {"ownerId": pid, "namespace": "custom", "key": "year", "type": "list.single_line_text_field", "value": json.dumps(years)},
                {"ownerId": pid, "namespace": "custom", "key": "make", "type": "list.single_line_text_field", "value": json.dumps(makes)},
                {"ownerId": pid, "namespace": "custom", "key": "model", "type": "list.single_line_text_field", "value": json.dumps(models)},
            ]
        if not years:
            # Universal: drop stale vehicle tags so the PDP matcher treats it as universal.
            gql(
                "mutation($m:[MetafieldIdentifierInput!]!){metafieldsDelete(metafields:$m){userErrors{message}}}",
                {"m": [{"ownerId": pid, "namespace": "custom", "key": k} for k in ("year", "make", "model")]},
            )
        r = gql("mutation($m:[MetafieldsSetInput!]!){metafieldsSet(metafields:$m){userErrors{field message}}}", {"m": mfs})
        errs = (r.get("data") or {}).get("metafieldsSet", {}).get("userErrors") or r.get("errors")
        print("shopify", item["handle"], "ERR " + json.dumps(errs) if errs else "ok")
        time.sleep(0.3)


if __name__ == "__main__":
    main()
