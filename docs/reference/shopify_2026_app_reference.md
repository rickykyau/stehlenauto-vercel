# Shopify 2026 App & API Reference

**Last updated:** 2026-05-01
**Audience:** Claude Code sessions and engineers working on the Stehlen Auto headless Next.js storefront for `stehlenauto.myshopify.com`.
**Goal:** Be the single source of truth for HOW to obtain and use Shopify API access in 2026. Resolves prior conflicting instructions about Storefront API tokens.

---

## Executive summary

If you only read five bullets:

1. **Legacy custom apps are dead for new creation.** As of **January 1, 2026**, you cannot create new custom apps from the Shopify admin (`Settings -> Apps and sales channels -> Develop apps`). Existing legacy custom apps (like Stehlen Auto's current Admin API token) keep working indefinitely. Source: Shopify Changelog, Oct 30 2025.
2. **For a headless storefront in 2026, the only correct path is the Headless sales channel.** It is a free first-party Shopify-published app you install from the App Store. It auto-provisions a public Storefront access token and a private Storefront access token per "storefront" you create. Hydrogen channel is the same idea but tuned for Hydrogen/Oxygen deployments — for a Next.js app, use **Headless**, not Hydrogen.
3. **Storefront API tokens are NOT generated from the Admin API custom app anymore — and trying gives the "App must be extendable" 403 error.** That error means the app is not registered as a sales channel and lacks `unauthenticated_*` scopes. Don't fight this. Install the Headless channel instead.
4. **Two Storefront token types, two homes:** the **public** token is safe to expose to the browser (use it in `NEXT_PUBLIC_*` env vars and from React Server Components / Client Components alike). The **private** token must stay server-only (use it from Next.js Route Handlers / Server Actions / RSC fetches). They have identical capabilities; they differ only in where it's safe to put them.
5. **Keep the existing Admin API custom app** — it's not affected by the deprecation and you still need it for webhook subscriptions, order writes, inventory updates, and any Admin-only operation. Do not delete it; just stop trying to create Storefront tokens from it.

**Recommended path for Stehlen Auto's Next.js app:**
Install the **Headless** channel on `stehlenauto.myshopify.com`, click **Add storefront**, copy the **public** and **private** Storefront access tokens, set permissions to the defaults (which already include products, collections, cart, search), and consume the API at `https://stehlenauto.myshopify.com/api/2026-04/graphql.json` with header `X-Shopify-Storefront-Access-Token: <token>`. Keep the existing Admin API custom app for server-side admin work and webhooks.

---

## App types in 2026

| App type | Status (2026) | Use case | How to create | API access |
|---|---|---|---|---|
| **Public app** (App Store) | Supported | Distribute to many merchants via Shopify App Store; pass review. | Shopify CLI + Dev Dashboard. Uses OAuth (authorization code grant) or token exchange (if embedded in admin). | Admin API + Storefront API (with appropriate scopes); App Bridge; Billing API. |
| **Dev Dashboard custom app** (replacement for legacy custom apps) | Supported (the new default) | Single-store or org-internal app for one merchant. Replaces "legacy custom app." | Shopify Dev Dashboard or Shopify CLI (`shopify app init`, `shopify.app.toml`, `shopify app config link`). Then install on the target store. | Admin API + Storefront API; OAuth-based, rotatable tokens. |
| **Legacy custom app** (admin-created) | **Frozen.** Cannot create new ones after Jan 1 2026. Existing ones keep working. | Internal scripts / private integrations created before the cutoff (Stehlen Auto's current Admin API token is one of these). | `Settings -> Apps and sales channels -> Develop apps` (UI no longer allows new ones in 2026). | Admin API only by default; tokens are permanent and non-rotatable; **cannot create Storefront access tokens** unless the app is registered as a sales channel — which the legacy admin-created flow does not support. |
| **Shopify admin app** | Supported | Embedded admin tool, single store, no Billing/App Bridge/extensions. | Dev Dashboard. | Admin API only. |
| **Headless sales channel** (first-party Shopify app) | **Recommended for headless storefronts** | Provision Storefront API tokens for any framework (Next.js, SvelteKit, Astro, vanilla JS, mobile, etc.). | Shopify App Store -> install "Headless" -> **Add storefront**. No code, no CLI, no Dev Dashboard required. | Storefront API + Customer Account API only (per storefront, with rotatable public + private tokens). |
| **Hydrogen sales channel** (first-party Shopify app) | Supported | Same as Headless channel but tuned for Hydrogen deploys on Oxygen. | App Store -> install "Hydrogen". | Storefront API + Customer Account API. **Use Headless, not Hydrogen, for Next.js.** |
| **Tokenless Storefront API** | Supported but limited | Quick prototypes; no token. | Just call `https://<shop>.myshopify.com/api/<version>/graphql.json` without auth header. | Storefront API only; capped at 1,000 query-complexity points; cannot read tags, metafields, or customer-scoped data. Not suitable for production. |

---

## API surfaces

| API | Used for | Token type | Where to call from |
|---|---|---|---|
| **Admin GraphQL API** (`/admin/api/<version>/graphql.json`) | Catalog management, orders, inventory, fulfillments, webhooks, customer data, draft orders, anything merchant-scoped. Shopify is marking REST as legacy; prefer GraphQL. | Admin API access token (`X-Shopify-Access-Token`) from a custom or public app. Stehlen has this already. | **Server-only.** Never expose to browser. |
| **Admin REST API** (`/admin/api/<version>/<resource>.json`) | Same as Admin GraphQL but legacy. Still works in 2026 but Shopify is steering everyone to GraphQL. | Same as Admin GraphQL. | Server-only. |
| **Storefront GraphQL API** (`/api/<version>/graphql.json`) | Product browsing, collections, cart create/update, search, pages, blogs, articles, selling plans, metafields, menus. | Public OR private Storefront access token (`X-Shopify-Storefront-Access-Token`), or no header for tokenless mode. | Either (public token = browser-safe; private token = server-only). |
| **Customer Account API** (`/account/customer/api/<version>/graphql`) | Authenticated customer experiences in headless storefronts: order history, profile management, subscription management. Replaces the deprecated Storefront-API customer authentication. | OAuth 2.0 access token obtained per-customer via authorization code flow + PKCE (public clients) or client credentials (confidential clients). | Server-side OAuth orchestration; access token used per-request. |
| **Webhooks** | `orders/create`, `orders/updated`, `app/uninstalled`, etc. | Verified via `X-Shopify-Hmac-Sha256` header signed with the app's webhook secret. The app's Admin API token does NOT verify webhooks — the webhook secret does. | Server-only (Next.js Route Handler or Supabase Edge Function). |

**Stehlen Auto's existing setup:** the legacy custom app provides the Admin API token used for product sync, order webhooks, and `cartBuyerIdentityUpdate` checkout pre-fill. Keep it. We just need a separate, additional Storefront API token for the Next.js storefront — provisioned via the Headless channel.

---

## Token types

| Token | Scope / capability | Where to use | How to obtain |
|---|---|---|---|
| **Admin API access token** | Everything the app's scopes allow on the Admin API. | Server-side only (Next.js server, Edge Functions, scripts). Header: `X-Shopify-Access-Token: <token>`. | (a) Existing legacy custom app (keeps working). (b) New: Dev Dashboard app, OAuth installed on store. |
| **Storefront API public access token** | Scopes set in the Headless channel "Storefront API permissions" panel; defaults cover products, collections, cart, search, pages. **Browser-safe.** | Anywhere (RSC, Client Components, mobile apps). Header: `X-Shopify-Storefront-Access-Token: <token>`. Put in `NEXT_PUBLIC_SHOPIFY_STOREFRONT_PUBLIC_TOKEN`. | Headless or Hydrogen channel -> Storefront -> "Storefront API tokens" card. Auto-provisioned on storefront creation. |
| **Storefront API private access token** | Same scopes as the public token (per the Headless channel permissions). **Must NOT leak to the browser.** | Server-only (Next.js Route Handlers, Server Actions, RSC `fetch` with `cache: 'force-cache'`). Header: `X-Shopify-Storefront-Access-Token: <token>` plus optionally `Shopify-Storefront-Buyer-IP` for the real client IP. Put in `SHOPIFY_STOREFRONT_PRIVATE_TOKEN` (no `NEXT_PUBLIC_` prefix). | Same as public token. The `Rotate private access token` button rotates this one only. |
| **Customer Account API access token** | Per-customer; obtained via OAuth 2.0 authorization code flow. | Server-side, scoped to one logged-in customer's session. | Configure Customer Account API in the Headless channel; redirect customer through `/.well-known/openid-configuration` discovery + auth flow. |
| **Webhook signing secret** | Verifies webhook authenticity. Not a request token. | Server-side webhook handler (HMAC verify). | Configured per app; for legacy custom apps, found in the app config. For Dev Dashboard apps, in `shopify.app.toml` or the Dashboard. |

---

## Decision tree: I need Storefront API access for stehlenauto.myshopify.com

```
Do you have admin access to stehlenauto.myshopify.com?
|
+-- No  -> get admin access first; cannot proceed.
|
+-- Yes -> Continue.

Do you need only Storefront API (products/collections/cart/search), or also Admin API?
|
+-- Storefront only -> Install Headless channel (see steps below). Done.
|
+-- Both             -> Keep the existing legacy custom app for Admin API tokens and webhooks.
                       AND install Headless channel for Storefront tokens.
                       Two separate apps, two separate tokens. This is the correct architecture.

Do you need authenticated customer accounts (login, order history)?
|
+-- No  -> Stop here. Storefront API public + private tokens are enough.
|
+-- Yes -> Also enable Customer Account API in the Headless channel,
           obtain Client ID (and optionally Client Secret), implement OAuth flow.
```

---

## Step-by-step: install the Headless channel and get tokens

UI labels reflect the Shopify admin in 2026. If a label has changed slightly, the navigation hierarchy is still valid.

1. **Log into Shopify admin** at `https://admin.shopify.com/store/http-stehlenauto-com` (or via `https://stehlenauto.myshopify.com/admin`).
2. In the left sidebar, click **Settings** -> **Apps and sales channels** (or directly: **Sales channels**).
3. Click **Shopify App Store** (or visit `https://apps.shopify.com/headless` directly).
4. Search for **Headless** (publisher: **Shopify**). Click **Add app**.
5. Approve installation. The Headless channel now appears under **Sales channels** in the left sidebar.
6. Click **Sales channels -> Headless**.
7. On the **Storefronts** page, click **Add storefront** (or **Create storefront** on first run).
8. Give it a name (e.g., `Stehlen Next.js Storefront`).
9. On the storefront detail page, find the **Storefront API tokens** card. You'll see:
   - **Public access token** — copy it. Goes into `NEXT_PUBLIC_SHOPIFY_STOREFRONT_PUBLIC_TOKEN`.
   - **Private access token** — click **Generate** (or **Rotate**) and copy it immediately. Goes into `SHOPIFY_STOREFRONT_PRIVATE_TOKEN` (server-only, never `NEXT_PUBLIC_`).
10. In the **Storefront API permissions** card, click **Edit**. The default permissions cover unauthenticated read of products, product tags, product listings, collections, content, search, and cart write. For Stehlen Auto, also enable:
    - `unauthenticated_read_product_inventory` (so we can show stock state)
    - `unauthenticated_write_checkouts` and `unauthenticated_read_checkouts` (cart -> checkout)
    - `unauthenticated_read_metaobjects` and `unauthenticated_read_product_metafields` (for fitment metafields if/when we move them off tags)
11. Save.
12. Verify with a test query:
    ```bash
    curl -X POST \
      -H "Content-Type: application/json" \
      -H "X-Shopify-Storefront-Access-Token: $TOKEN" \
      -d '{"query":"{ shop { name } }"}' \
      https://stehlenauto.myshopify.com/api/2026-04/graphql.json
    ```
    Expect `{"data":{"shop":{"name":"Stehlen Auto"}}}`.

**API version:** as of May 2026 the latest stable Storefront API version is `2026-04`. Pin it in env (`SHOPIFY_API_VERSION=2026-04`); upgrade quarterly per Shopify's release calendar.

---

## Integration patterns (Next.js)

### Server-side fetching (RSC, Route Handlers, Server Actions)

Use the **private** token. Slightly safer (you can lock it down, rotate on a cadence, and exclude it from client bundles).

```ts
// lib/shopify/storefront.ts
const endpoint = `https://stehlenauto.myshopify.com/api/${process.env.SHOPIFY_API_VERSION}/graphql.json`;

export async function storefrontFetch<T>(query: string, variables?: Record<string, unknown>, opts?: { buyerIp?: string }): Promise<T> {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN!,
      ...(opts?.buyerIp ? { "Shopify-Storefront-Buyer-IP": opts.buyerIp } : {}),
    },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 60 }, // ISR-style caching for catalog reads
  });
  if (!res.ok) throw new Error(`Storefront ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data as T;
}
```

The `Shopify-Storefront-Buyer-IP` header is recommended for server-side calls so Shopify's bot/abuse protection sees the real visitor IP, not your server IP. Read it from `x-forwarded-for` in the incoming request.

### Client-side fetching (cart updates, instant search)

Use the **public** token. It can ship to the browser; that's its design.

```ts
// app/lib/shopify/storefront-client.ts
"use client";
const endpoint = `https://stehlenauto.myshopify.com/api/${process.env.NEXT_PUBLIC_SHOPIFY_API_VERSION}/graphql.json`;

export async function storefrontFetchClient<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_PUBLIC_TOKEN!,
    },
    body: JSON.stringify({ query, variables }),
  });
  return (await res.json()).data as T;
}
```

Or, simpler: **always proxy through your own Route Handlers** with the private token, even for cart updates. That keeps the public token unused entirely. Slight perf cost (extra hop), but easier security model. Pick one, document it, stick with it.

### Webhooks

Webhooks (`orders/create`, `orders/updated`) are configured against the Admin API custom app. The receiving Next.js Route Handler (or Supabase Edge Function — Stehlen Auto currently uses an Edge Function) must verify HMAC against the **app's webhook secret**, not the Admin API token. The Storefront API and Headless channel have nothing to do with webhooks.

### CORS

Shopify's Storefront API responds with permissive CORS headers, so direct browser-to-Shopify calls work. There is no preflight blocking for the documented public-token use case. If you do see CORS issues, you're almost certainly hitting the Admin API (which is server-only) by mistake.

### Token rotation / security

- **Private Storefront token:** rotate quarterly or on team turnover. The Headless channel UI has a one-click rotate. There's no overlap window — rotate, redeploy fast, then "Delete old token." Build a 5-minute redeploy path before rotating.
- **Public Storefront token:** technically safe to expose, but if it leaks to a competitor they can scrape your catalog. The permissions cap blast radius. Rotate annually.
- **Admin API token (legacy custom app):** **cannot be rotated** without deleting and recreating the app. Since you can't create new legacy custom apps after Jan 1 2026, plan a migration to a Dev Dashboard app for the Admin token before the existing one is ever compromised. Until then, treat it like a crown jewel.
- **Customer Account API:** access tokens are short-lived; refresh tokens handled by the OAuth library. Standard OAuth security applies.

---

## Common errors

| Error | What it means | Fix |
|---|---|---|
| `403 App must be extendable to create a storefront access token` (when calling `storefrontAccessTokenCreate` via Admin API) | The Admin API custom app you're calling from is not registered as a sales channel and has no `unauthenticated_*` scopes. Legacy admin-created custom apps cannot be made extendable. | Don't try to mint Storefront tokens from your Admin custom app. **Install the Headless channel and create the storefront there.** That's the 2026 path. |
| `200 Throttled` from Storefront API on cart/checkout creation | Per-shop checkout-creation rate limit (Shopify doesn't publish the exact number; it's anti-abuse). | Back off and retry; cache cart IDs in cookies; don't create a new cart on every page view. |
| `430 Shopify Security Rejection` | Shopify's bot/abuse layer flagged the request. | Add `Shopify-Storefront-Buyer-IP` header to server-side calls. Keep query complexity reasonable. Don't hammer endpoints from a single IP. |
| `429 Too Many Requests` (Admin API) | Exceeded GraphQL cost bucket (100 pts/sec on Standard plan; query cost cap of 1,000 pts/single-query). | Read `extensions.cost` in responses; backoff with `Retry-After`; reduce query depth. |
| `Storefront API token invalid` | Token was rotated or storefront deleted. | Re-fetch from Headless channel; redeploy. |
| `Field 'X' doesn't exist on type 'Y'` after API version bump | Shopify GraphQL schema changed between API versions. | Pin `SHOPIFY_API_VERSION` and upgrade deliberately, not automatically. Check release notes. |
| Order webhooks not arriving | Webhook subscription not registered, or HMAC verification failing. | Webhooks register against the Admin API token (legacy custom app). Verify with the **webhook secret**, not the Admin token. |

---

## Conflict resolution: prior conflicting instructions

Earlier sessions told the user different things. Here is the resolution, with sources:

- **Claim A:** "Create a Storefront access token from your Admin custom app via the `storefrontAccessTokenCreate` mutation."
  - **Verdict:** Wrong for our setup. That endpoint exists, but it requires the calling app to be a sales channel with `unauthenticated_*` scopes — which legacy admin-created custom apps cannot be configured to be. The actual API call returns the 403 "App must be extendable" error, which is exactly what was observed. Source: Shopify Community thread #112670 + the `StorefrontAccessToken` REST docs noting it inherits unauthenticated scopes from the creating app.
- **Claim B:** "Use the Dev Dashboard to create a new app with Storefront API scopes."
  - **Verdict:** Technically possible (Dev Dashboard can grant `unauthenticated_*` scopes via `shopify.app.toml`), but unnecessarily heavyweight for our use case. Dev Dashboard is for code-deployed apps with config files, CLI, and OAuth. We don't need any of that — we just need tokens.
- **Claim C:** "Install the Headless sales channel from the App Store and create a storefront."
  - **Verdict:** **Correct.** This is the path Shopify documents in `shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/getting-started`. No code, no CLI, no OAuth setup. Tokens auto-provisioned. Permissions configurable via UI. Rotation built in.

So: **Headless channel** is the answer for Stehlen Auto.

---

## Why not Hydrogen channel?

The Hydrogen sales channel app is functionally similar to Headless, but it's optimized for Shopify's own Hydrogen framework (built on React Router v7) deployed to Oxygen (Shopify's edge hosting). It assumes you're using Hydrogen project conventions. For a Next.js app — which uses a different routing model and is deployed to Vercel/Netlify/Cloudflare — there's nothing Hydrogen channel offers that Headless channel doesn't, and Headless has a cleaner "framework-agnostic" framing in the UI. Pick **Headless**.

If we ever migrate to Hydrogen + Oxygen, we'd swap the channel.

---

## Migration note (Admin custom app, future)

The current Admin API access lives in a legacy custom app. Per Shopify, **existing legacy custom apps continue to work indefinitely** — there's no announced kill date for them, only a freeze on creating new ones. So no urgent migration needed. But:

- If the current Admin token is ever compromised: there's no rotation; we'd have to delete the app and create a new one — which we cannot do via the legacy admin flow after Jan 1 2026. We'd have to go through Dev Dashboard.
- Recommended: in Q3 2026, build a Dev Dashboard replacement for the Admin custom app, copy the same scopes, swap the token, retire the legacy app. Rotatable tokens, modern OAuth, future-proof.

This is a "before something goes wrong" project, not "fire."

---

## Sources (official Shopify docs unless noted)

- [Storefront API reference (`shopify.dev/docs/api/storefront`)](https://shopify.dev/docs/api/storefront) — token types, headers, tokenless mode, complexity caps.
- [Building with the Storefront API: Getting started](https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/getting-started) — Headless channel install + token generation steps.
- [Manage the Headless channel](https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/manage-headless-channels) — token rotation, storefront management, 100-storefront limit.
- [Headless build options](https://shopify.dev/docs/storefronts/headless/getting-started/build-options) — Hydrogen vs Hydrogen React vs Headless channel.
- [Bring your own headless stack](https://shopify.dev/docs/storefronts/headless/bring-your-own-stack) — Storefront API + Customer Account API for custom frameworks.
- [Headless app on the Shopify App Store](https://apps.shopify.com/headless) — first-party Shopify-published sales channel app, free.
- [Generate access tokens for custom apps in the Shopify admin (LEGACY)](https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/generate-app-access-tokens-admin) — explicitly notes Dev Dashboard is the replacement.
- [Shopify Changelog: Legacy custom apps can't be created after January 1, 2026](https://changelog.shopify.com/posts/legacy-custom-apps-can-t-be-created-after-january-1-2026) — official deprecation announcement, Oct 30 2025.
- [Customer Account API reference](https://shopify.dev/docs/api/customer) — OAuth 2.0 authorization code flow, PKCE for public clients.
- [API rate limits (`shopify.dev/docs/api/usage/rate-limits`)](https://shopify.dev/docs/api/usage/rate-limits) — Admin GraphQL points/sec by plan, Storefront tokenless complexity cap, Customer Account API rate limits.
- [Shopify Community thread on "App must be extendable" error](https://community.shopify.com/t/access-token-creation-got-the-error-app-must-be-extendable-to-create-a-storefront-access-token/112670) — diagnosis of the 403 we observed when trying `storefrontAccessTokenCreate` from the legacy custom app.
- [Token acquisition overview](https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens) — token exchange (embedded admin apps) vs authorization code grant (standalone apps); CLI starter as recommended path for new apps.
