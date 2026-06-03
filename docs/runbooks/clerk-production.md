# Clerk Production Instance Migration — stehlenauto.com

**Why:** the site is live on Clerk **development keys** (`pk_test_` / `sk_test_`).
Dev instances are rate-limited, show a "development mode" banner, use the
shared `*.accounts.dev` domain, and run the dev "handshake" that already broke
SEO once (it served interstitials to crawlers on `/sitemap.xml`). Production
keys (`pk_live_` / `sk_live_`) remove all of that.

**Cost:** **$0.** Clerk free tier includes a production instance up to ~50,000
MAU (signed-in users). Storefront anonymous traffic doesn't count. Pro
($25/mo + $0.02/MAU) only applies above the free cap — not a concern here.

**Owners:** Clerk dashboard + GoDaddy DNS = Ricky. Vercel env + redeploy +
verification = Claude Code.

---

## ⚠️ Read first: user-data implications

Clerk **production is a separate instance from development** — users created in
the dev instance do **not** carry over, and production user IDs are **new**.
Our Neon tables (`vehicles`/garage, `wishlist_items`, `product_reviews`) key
off the Clerk `userId`, so any existing dev-instance accounts + their saved
garages would orphan.

- **If ~0 real customers have signed up yet** (true at/near launch): clean
  cutover, nothing to migrate. Proceed.
- **If real customers already signed up on the dev instance:** before
  switching, export users from Clerk (dev) and import into the production
  instance (Clerk supports user migration / Backend API import), then remap
  their `userId`s in Neon. Check first: count rows in `vehicles` /
  `product_reviews` with non-null `userId`. If non-trivial, do the export/import
  path; don't just swap keys.

---

## Steps

### 1. Create the production instance (Clerk dashboard — Ricky)
- Clerk dashboard → select the Stehlen app → top instance switcher → **Production**
  (or "Deploy to production" / "Create production instance").
- Set the **production domain** to `stehlenauto.com`.

### 2. Add Clerk's DNS records at GoDaddy (Ricky)
Clerk will show ~4–5 **CNAME** records to add (subdomains like `clerk`,
`accounts`, `clkmail`, plus two DKIM `clk._domainkey` / `clk2._domainkey`).
- Add each **exactly as shown** at GoDaddy → DNS.
- ⚠️ **Do not touch the existing apex `A → 76.76.21.21` or `www` CNAME** (those
  serve the Vercel site). Clerk's records are on *different* subdomains, so
  they don't conflict.
- Back in Clerk, click **Verify** — propagation is usually minutes.

### 3. Match production settings to dev (Clerk dashboard — Ricky)
Production starts blank-ish; replicate what dev has:
- **Sign-in/up methods** (email/password, email code, etc.).
- **Social/OAuth providers** if any (Google, Facebook) — production needs its
  **own** OAuth client IDs/secrets in each provider's console (dev shared
  Clerk's; production must use your own). Set them in Clerk → SSO connections.
- **Paths** (already in our env): sign-in `/sign-in`, sign-up `/sign-up`,
  fallback redirects `/account`.
- **Allowed origins / redirect URLs:** `https://stehlenauto.com`.
- Session/JWT settings: leave defaults unless dev was customized.

### 4. Copy the production API keys (Ricky → hand to Claude)
From Clerk → API keys (Production): `pk_live_…` and `sk_live_…`.

### 5. Set Vercel env + redeploy (Claude)
Production environment:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_…`
- `CLERK_SECRET_KEY=sk_live_…`
- `ADMIN_OWNER_EMAILS=<owner email>` — **critical:** production user IDs are
  new, so the owner's old Clerk user ID won't match. The admin guard
  (`src/lib/admin/guard.ts`) falls back to email allowlist, so this keeps
  `/admin` accessible. (Alternatively set `role:"owner"` in the new prod
  user's publicMetadata after first sign-in.)
- Keep the existing `NEXT_PUBLIC_CLERK_SIGN_IN_URL` / `SIGN_UP_URL` /
  fallback-redirect vars as-is.
- Redeploy production.

### 6. Verify (Claude + Ricky)
- `https://stehlenauto.com/sign-up` → create a real account (no "dev mode"
  banner, no `accounts.dev` redirect).
- Sign in → `/account` loads → save a garage vehicle → confirm it persists
  (Neon write works with the new userId).
- OAuth (if enabled) → completes on `accounts.stehlenauto.com`.
- `/admin` → owner email is allowed; a non-owner is redirected.
- Confirm the dev "development mode" badge is gone.

---

## Rollback
Revert the two Vercel env vars to the `pk_test_`/`sk_test_` values and
redeploy. (Dev instance stays intact; no data loss since prod data is separate.)

## After cutover
- Remove the dev keys from any shared notes.
- The earlier SEO concern is fully resolved once on prod keys (no more dev
  handshake). The `.xml`/`.txt` middleware exclusion stays regardless.
