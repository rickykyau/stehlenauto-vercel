# Stehlen Auto — Marketing

Single home for marketing strategy, the Brevo email program, analytics, and
lead-gen. Copied/consolidated from the legacy Lovable project on **2026-06-04**
and kept in-tree alongside the live storefront.

> **Secrets & PII:** All API keys live in `.env.local` (gitignored). Customer
> data and campaign-metadata CSVs live in `marketing/email/data/` which is
> **gitignored** — never commit customer emails, names, or revenue.

## Folder map

| Folder | What's in it |
|---|---|
| `plans/` | Master marketing plan, data-driven GTM strategy, 90-day sprint, budget, Claude-AI GTM, **Champions reactivation plan** |
| `email/` | The Brevo email program — `scripts/` (setup, campaign creation, audit, enrich, validate) + `data/` (gitignored campaign metadata) |
| `analytics/` | GA4 + Brevo reporting scripts (Python, stdlib + `requirements.txt`) |
| `tasks/` | Master task list, Google Merchant Center setup |
| `tools/` | Tool scorecard (vendor evaluation) |
| `ml-pipeline/` | Data-utilization + ML strategy docs |
| `lead-gen/` | NEW — net-new acquisition channel exploration (marketing-director output) |
| `prompts/` | Reusable marketing prompt(s) |

## Brevo account snapshot (read-only audit, 2026-06-04)

- **Account:** Robome.io · **Send credits:** ~30,245 (PAYG) + 40,000 (subscription)
- **Verified sender:** `info@updates.stehlenauto.com` (active) — dedicated subdomain ✅
- **Lists (15):** Champions tiers by LTV + per-make PDP lists (Ford 5,126 · Toyota 5,012 · Chevrolet 4,140 · Dodge/Ram 3,001 · Others 8,131).
  ⚠️ **All lists currently show 0 subscribers** — contacts were cleared after the April run. **Restart requires re-importing validated contacts.**
- **Campaigns:**
  - **3 DRAFTS** = the ready 3-email reactivation sequence:
    1. *Brand Intro* — "You ordered from us on eBay — we have something better now"
    2. *Vehicle Specific* — "Top upgrades for your `{{VEHICLE_MAKE}} {{VEHICLE_MODEL}}`"
    3. *Last Chance* — "DIRECT10 expires Friday — 10% off your first order at stehlenauto.com"
  - **15 SENT** (April pilot → batches 2–5 + per-make PDP sends)
  - **10 SUSPENDED**

## The Champions list (source: CB order data)

- 36,738 total · 34,084 (92.8%) with vehicle make+model · avg LTV $425
- **~36,700 safe to email** under CAN-SPAM (99.6% eBay-sourced = prior business relationship; only 1 Amazon-only contact, which is excluded per Amazon TOS)
- Top makes: Ford 20% · Toyota 19% · Chevy 16% · Dodge 10%

## 🚨 Email-send safety rules (NON-NEGOTIABLE)

1. **NEVER call Brevo `sendNow`.** It fires immediately, ignoring schedule. Use `scheduledAt` only.
2. **Pilot first.** Re-warm with the highest-LTV ~500 before any full-list send — protects `updates.stehlenauto.com` domain reputation.
3. **Re-validate emails** (MillionVerifier) before re-import — the list has aged since April.
4. **Verify every CTA/link resolves on the NEW site** (stehlenauto.com now serves the Next.js build, not Lovable) before sending.
5. **Owner sign-off required** before any send.

## Restart status

- [x] Materials consolidated into this repo
- [x] Read-only Brevo audit complete
- [x] Env keys imported to `.env.local`
- [ ] Re-validate + re-import contacts (pilot list first)
- [ ] CTA/link audit of the 3 draft emails vs live site
- [ ] Owner approves pilot → schedule via `scheduledAt`
- [ ] Pilot metrics reviewed → schedule full sequence
