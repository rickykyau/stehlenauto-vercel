#!/usr/bin/env python3
"""Google Ads impression alert — emails the owners when impressions swing hard.

Runs hourly on JL-SQL (Task Scheduler, via scripts/windows/Run-GShopImpressionAlert.ps1).
Born from 2026-10-21: the Shopping campaign stopped serving at ~2 AM PT with no
setting changed, and nobody noticed for two days.

Each run compares account impressions for two rolling windows against the same
clock hours on each of the previous 7 days:
  - last 6 complete hours   DOWN if < 40% of baseline, UP if > 400%
  - last 24 complete hours  DOWN if < 50% of baseline, UP if > 200%
Baseline = median of those prior days, skipping days the ads weren't running.
(Ads hourly data lags ~3h, so "complete" means ending 3h before now.) A window
needs a baseline of at least MIN_BASE impressions to count. A 6h drop is ignored
when that day's spend already reached ~90% of the daily budget (normal capping).

Emails (marked high priority, subject starts with [IMPORTANT]):
  ALERT     when the status moves normal -> down/up
  REMINDER  every 24h while it stays down/up
  RECOVERED when it returns to normal
Each alert carries diagnostics: campaign/account status, recent setting changes,
and Merchant Center paid-vs-free-listing impressions (free listings normal while
ads are at zero = a Google Ads account hold, usually billing).

State: <log dir>/gshop-impression-alert-state.json; every run appends to
gshop-impression-alert.jsonl in the same folder.

Usage:  python3 scripts/catalog/gshop-impression-alert.py            # dry run, prints
        python3 scripts/catalog/gshop-impression-alert.py --email    # send when needed
        python3 scripts/catalog/gshop-impression-alert.py --test     # send a [TEST] email now
Credentials (env wins, else repo .env.local / .secrets/google-ads-token.json):
  GOOGLE_OAUTH_CLIENT_ID / _SECRET / _REFRESH_TOKEN, BREVO_API_KEY,
  ALERT_EMAIL_TO (comma list), ALERT_LOG_DIR.
"""
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter, defaultdict
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ADS_CUSTOMER = "4449235809"
ADS_MANAGER = "4889521672"
MERCHANT_ID = "5750851984"
ADS_API = "v23"
DEFAULT_TO = "rickykyau@gmail.com,rtsui.jlconcepts@gmail.com"
SENDER = {"name": "Stehlen Ads Alert", "email": "info@updates.stehlenauto.com"}

DATA_LAG_H = 3
WINDOWS = [  # (hours, down below, up above, minimum baseline impressions)
    (6, 0.40, 4.00, 300),
    (24, 0.50, 2.00, 1000),
]
BASELINE_DAYS = 7
MIN_BASELINE_DAYS = 4   # baseline days that had any impressions in the 24h before them
BUDGET_CAPPED = 0.90
REMIND_EVERY_H = 24


def load_env():
    env = {}
    f = ROOT / ".env.local"
    if f.exists():
        for line in f.read_text().splitlines():
            m = re.match(r"^([A-Z0-9_]+)=(.*)$", line.strip())
            if m:
                env[m[1]] = m[2].strip("\"'")
    tok = ROOT / ".secrets" / "google-ads-token.json"
    if tok.exists():
        t = json.loads(tok.read_text())
        env.setdefault("GOOGLE_OAUTH_CLIENT_ID", t["client_id"])
        env.setdefault("GOOGLE_OAUTH_CLIENT_SECRET", t["client_secret"])
        env.setdefault("GOOGLE_OAUTH_REFRESH_TOKEN", t["refresh_token"])
    env.update({k: v for k, v in os.environ.items() if v})
    return env


def http(url, body=None, headers=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, headers=headers or {})
    with urllib.request.urlopen(req, timeout=60) as r:
        raw = r.read()
        return json.loads(raw) if raw else {}


def google_token(env):
    body = urllib.parse.urlencode({
        "client_id": env["GOOGLE_OAUTH_CLIENT_ID"], "client_secret": env["GOOGLE_OAUTH_CLIENT_SECRET"],
        "refresh_token": env["GOOGLE_OAUTH_REFRESH_TOKEN"], "grant_type": "refresh_token"}).encode()
    req = urllib.request.Request("https://oauth2.googleapis.com/token", data=body)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)["access_token"]


class Ads:
    def __init__(self, at):
        self.h = {"Authorization": "Bearer " + at, "login-customer-id": ADS_MANAGER,
                  "Content-Type": "application/json"}

    def q(self, gaql):
        out, token = [], None
        while True:
            body = {"query": gaql, **({"pageToken": token} if token else {})}
            d = http(f"https://googleads.googleapis.com/{ADS_API}/customers/{ADS_CUSTOMER}/googleAds:search",
                     body, self.h)
            out += d.get("results", [])
            token = d.get("nextPageToken")
            if not token:
                return out


def pacific_now():
    """US Pacific wall-clock time without tzdata (Windows Python often lacks it)."""
    utc = datetime.now(timezone.utc).replace(tzinfo=None)
    y = utc.year

    def nth_sunday(month, n):
        d = datetime(y, month, 1)
        d += timedelta(days=(6 - d.weekday()) % 7)
        return d + timedelta(weeks=n - 1)
    dst_start = nth_sunday(3, 2) + timedelta(hours=10)   # 2 AM PST = 10:00 UTC
    dst_end = nth_sunday(11, 1) + timedelta(hours=9)     # 2 AM PDT = 09:00 UTC
    return utc + timedelta(hours=-7 if dst_start <= utc < dst_end else -8)


def hourly(ads, start, end):
    """{datetime hour: (impressions, cost $)} for the whole account, Pacific."""
    out = defaultdict(lambda: [0, 0.0])
    for r in ads.q("SELECT segments.date, segments.hour, metrics.impressions, metrics.cost_micros "
                   f"FROM campaign WHERE segments.date BETWEEN '{start}' AND '{end}'"):
        s, m = r["segments"], r["metrics"]
        k = datetime.fromisoformat(s["date"]) + timedelta(hours=int(s.get("hour", 0)))
        out[k][0] += int(m.get("impressions", 0))
        out[k][1] += int(m.get("costMicros", 0)) / 1e6
    return out


def window_sum(data, end, hours, shift_days=0):
    e = end - timedelta(days=shift_days)
    return sum(data.get(e - timedelta(hours=h + 1), [0, 0])[0] for h in range(hours))


def evaluate(data, end, daily_budget):
    results, status = [], "normal"
    for hours, lo, hi, min_base in WINDOWS:
        actual = window_sum(data, end, hours)
        # Median of the prior days, skipping days the ads weren't running at all (pre-launch,
        # earlier outages) so a past outage can't make a recovery look like a spike.
        days = sorted(window_sum(data, end, hours, d) for d in range(1, BASELINE_DAYS + 1)
                      if window_sum(data, end, 24, d) > 0)
        base = (days[len(days) // 2] + days[(len(days) - 1) // 2]) / 2 if days else 0
        ratio = actual / base if base else None
        verdict = "normal"
        if len(days) >= MIN_BASELINE_DAYS and base >= min_base and ratio is not None:
            if ratio < lo:
                verdict = "down"
            elif ratio > hi:
                verdict = "up"
        note = ""
        if verdict == "down" and hours <= 6 and daily_budget:
            day0 = datetime(end.year, end.month, end.day)
            spent = sum(v[1] for k, v in data.items() if day0 <= k < end)
            if spent >= BUDGET_CAPPED * daily_budget:
                verdict, note = "normal", f"(day's budget spent: ${spent:.0f} of ${daily_budget:.0f})"
        results.append({"hours": hours, "actual": actual, "baseline": round(base), "verdict": verdict,
                         "ratio": round(ratio, 2) if ratio is not None else None, "note": note})
        if verdict != "normal" and status == "normal":
            status = verdict
    return status, results


def diagnostics(ads, at, end):
    lines, hints = [], []
    try:
        cust = ads.q("SELECT customer.status FROM customer")[0]["customer"]["status"]
        lines.append(f"Ads account status: {cust}")
        if cust != "ENABLED":
            hints.append(f"The Google Ads account itself is {cust}.")
    except Exception as e:
        lines.append(f"Ads account status: unavailable ({e})")
    try:
        for r in ads.q("SELECT campaign.name, campaign.primary_status, campaign.primary_status_reasons, "
                       "campaign_budget.amount_micros FROM campaign WHERE campaign.status = 'ENABLED'"):
            c = r["campaign"]
            lines.append(f"Campaign: {c['name']} | {c.get('primaryStatus')} "
                         f"{','.join(c.get('primaryStatusReasons', []))} | budget "
                         f"${int(r['campaignBudget']['amountMicros']) / 1e6:.0f}/day")
    except Exception as e:
        lines.append(f"Campaigns: unavailable ({e})")
    try:
        since = (end - timedelta(hours=72)).strftime("%Y-%m-%d %H:%M:%S")
        until = (end + timedelta(hours=DATA_LAG_H + 1)).strftime("%Y-%m-%d %H:%M:%S")
        ev = ads.q("SELECT change_event.change_date_time, change_event.change_resource_type, "
                   "change_event.resource_change_operation, change_event.changed_fields, "
                   "change_event.client_type, change_event.user_email FROM change_event "
                   f"WHERE change_event.change_date_time BETWEEN '{since}' AND '{until}' "
                   "ORDER BY change_event.change_date_time DESC LIMIT 200")
        if not ev:
            lines.append("Setting changes in the last 72h: NONE")
        else:
            grouped = Counter()
            for r in ev:
                c = r["changeEvent"]
                grouped[(c["changeDateTime"][:16], c["changeResourceType"], c["resourceChangeOperation"],
                         c.get("changedFields", ""), c.get("userEmail", ""), c.get("clientType", ""))] += 1
            lines.append(f"Setting changes in the last 72h: {len(ev)}")
            for (t, res, op, fields, who, client), n in list(grouped.items())[:12]:
                lines.append(f"  {t}  {n}x {res} {op} {fields} by {who} ({client})")
            if any("cpcBidMicros" not in k[3] for k in grouped):
                hints.append("Settings were changed recently (see list) — check those first.")
    except Exception as e:
        lines.append(f"Setting changes: unavailable ({e})")
    try:
        d0 = (end - timedelta(days=8)).date().isoformat()
        rep = http(f"https://merchantapi.googleapis.com/reports/v1/accounts/{MERCHANT_ID}/reports:search",
                   {"query": "SELECT date, marketing_method, impressions FROM product_performance_view "
                             f"WHERE date BETWEEN '{d0}' AND '{end.date().isoformat()}'"},
                   {"Authorization": "Bearer " + at, "Content-Type": "application/json"})
        by = defaultdict(dict)
        for r in rep.get("results", []):
            v = r["productPerformanceView"]
            d = date(v["date"]["year"], v["date"]["month"], v["date"]["day"])
            by[v.get("marketingMethod")][d] = int(v.get("impressions", 0))
        day = (end - timedelta(hours=1)).date()
        prior = [day - timedelta(days=i) for i in range(1, 8)]
        lines.append(f"Merchant Center impressions on {day} (same day so far vs prior 7-day avg of full days):")
        share = {}
        for m in ("ADS", "ORGANIC"):
            today = by[m].get(day, 0)
            avg = sum(by[m].get(p, 0) for p in prior) / 7
            share[m] = (today, avg)
            lines.append(f"  {'Paid Shopping ads' if m == 'ADS' else 'Free listings':<18} {today:>6} vs {avg:>7.0f}")
        frac = end.hour / 24 or 1
        ads_t, ads_a = share["ADS"]
        org_t, org_a = share["ORGANIC"]
        if ads_a and ads_t < 0.2 * ads_a * frac:
            if org_a and org_t >= 0.5 * org_a * frac:
                hints.append("Free listings are normal while paid ads collapsed, so the product feed is fine: "
                             "the hold is in the Google Ads account. Check Google Ads > Billing > Summary "
                             "(declined payment / payment verification) and the bell notifications.")
            else:
                hints.append("Free listings dropped too: likely a Merchant Center / product feed problem. "
                             "Check Merchant Center > Diagnostics and the Shopify Google & YouTube channel.")
    except Exception as e:
        lines.append(f"Merchant Center: unavailable ({e})")
    try:
        c = Counter(r["shoppingProduct"].get("status") for r in ads.q(
            "SELECT shopping_product.status FROM shopping_product"))
        lines.append(f"Products: {c.get('ELIGIBLE', 0)} eligible for ads, {c.get('NOT_ELIGIBLE', 0)} not eligible")
    except Exception as e:
        lines.append(f"Products: unavailable ({e})")
    return lines, hints


def hour_table(data, end, n=12):
    rows = ["Hour (PT)          impressions   7-day avg same hour"]
    for h in range(n, 0, -1):
        k = end - timedelta(hours=h)
        base = sum(data.get(k - timedelta(days=d), [0, 0])[0] for d in range(1, 8)) / 7
        rows.append(f"  {k:%a %m-%d %H:00}   {data.get(k, [0, 0])[0]:>8}     {base:>8.0f}")
    return rows


def send_email(env, subject, text):
    to = [x.strip() for x in env.get("ALERT_EMAIL_TO", DEFAULT_TO).split(",") if x.strip()]
    html = ("<pre style=\"font:13px/1.45 Menlo,Consolas,monospace;white-space:pre-wrap\">"
            + text.replace("&", "&amp;").replace("<", "&lt;") + "</pre>")
    http("https://api.brevo.com/v3/smtp/email",
         {"sender": SENDER, "to": [{"email": t} for t in to], "subject": subject,
          "textContent": text, "htmlContent": html,
          "headers": {"X-Priority": "1 (Highest)", "X-MSMail-Priority": "High",
                      "Importance": "High", "Priority": "urgent"}},
         {"api-key": env["BREVO_API_KEY"], "Content-Type": "application/json", "Accept": "application/json"})
    return to


def main():
    send = "--email" in sys.argv or "--test" in sys.argv
    test = "--test" in sys.argv
    env = load_env()
    log_dir = Path(env.get("ALERT_LOG_DIR") or ROOT / "data" / "logs")
    log_dir.mkdir(parents=True, exist_ok=True)
    state_file = log_dir / "gshop-impression-alert-state.json"
    state = json.loads(state_file.read_text()) if state_file.exists() else {"status": "normal"}

    at = google_token(env)
    ads = Ads(at)
    now = pacific_now()
    end = now.replace(minute=0, second=0, microsecond=0) - timedelta(hours=DATA_LAG_H)
    start = end - timedelta(days=BASELINE_DAYS + 2)
    data = hourly(ads, start.date().isoformat(), now.date().isoformat())
    budget = sum(int(r["campaignBudget"]["amountMicros"]) / 1e6 for r in ads.q(
        "SELECT campaign_budget.amount_micros FROM campaign WHERE campaign.status = 'ENABLED'"))
    status, results = evaluate(data, end, budget)

    prev = state.get("status", "normal")
    last = datetime.fromisoformat(state["last_email"]) if state.get("last_email") else None
    kind = None
    if test:
        kind = "TEST"
    elif status != prev:
        kind = "RECOVERED" if status == "normal" else "ALERT"
    elif status != "normal" and (not last or now - last >= timedelta(hours=REMIND_EVERY_H)):
        kind = "REMINDER"

    summary = []
    for r in results:
        pct = f"{r['ratio'] * 100:.0f}%" if r["ratio"] is not None else "n/a"
        summary.append(f"Last {r['hours']:>2}h: {r['actual']:>6} impressions vs {r['baseline']:>6} usual "
                       f"({pct}) -> {r['verdict'].upper()} {r['note']}".rstrip())
    print(f"{now:%Y-%m-%d %H:%M} PT, data through {end:%m-%d %H:00}: status {status} (was {prev})")
    print("\n".join(summary))

    if kind:
        diag, hints = diagnostics(ads, at, end) if kind != "RECOVERED" else ([], [])
        word = {"down": "DROPPED", "up": "SPIKED", "normal": "back to normal"}[status]
        subject = {
            "ALERT": f"[IMPORTANT] Google Ads impressions {word} — Stehlen Auto",
            "REMINDER": f"[IMPORTANT] Still {status.upper()}: Google Ads impressions — Stehlen Auto",
            "RECOVERED": "Google Ads impressions back to normal — Stehlen Auto",
            "TEST": "[IMPORTANT][TEST] Google Ads impression alert is set up — Stehlen Auto",
        }[kind]
        body = [f"Google Ads impression check — {now:%a %b %d, %I:%M %p} PT "
                f"(Ads data through {end:%I:%M %p}; it lags ~{DATA_LAG_H}h)", ""]
        if kind == "TEST":
            body += ["This is a test. You'll get an email like this when impressions move sharply,",
                     "a reminder every 24h while it lasts, and a note when they recover.", ""]
        body += summary + [""]
        if hints:
            body += ["LIKELY CAUSE:"] + [f"  - {h}" for h in hints] + [""]
        body += hour_table(data, end) + [""]
        if diag:
            body += ["DIAGNOSTICS:"] + [f"  {x}" for x in diag] + [""]
        body += ["Google Ads: https://ads.google.com/aw/overview (account 444-923-5809)",
                 "Billing:    https://ads.google.com/aw/billing/summary (sign in as support@robome.io)",
                 "", "Hourly check: scripts/catalog/gshop-impression-alert.py"]
        text = "\n".join(body)
        print("\n" + subject + "\n" + text)
        if send:
            to = send_email(env, subject, text)
            print(f"\nEmailed {', '.join(to)}")
            if not test:
                state["last_email"] = now.isoformat()
        else:
            print("\n[dry run] not emailed (use --email)")

    if send and not test:
        if status != prev:
            state["since"] = now.isoformat()
        state["status"] = status
        state_file.write_text(json.dumps(state, indent=1))
    with open(log_dir / "gshop-impression-alert.jsonl", "a") as f:
        f.write(json.dumps({"at": now.isoformat(), "status": status, "prev": prev, "email": kind if send else None,
                            "windows": results}) + "\n")


if __name__ == "__main__":
    main()
