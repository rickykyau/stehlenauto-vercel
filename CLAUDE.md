# Stehlen Auto Storefront — CLAUDE.md

This is the **Next.js 16 + Vercel** rebuild of stehlenauto.com, replacing the
legacy Lovable SPA. Authoritative project context for future Claude Code
sessions.

## Stack

- **Framework:** Next.js 16 (App Router, React Server Components, Cache Components)
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS v4 (via `@theme` directive in globals.css)
- **Auth:** Clerk (Vercel Marketplace)
- **DB:** Neon Postgres (Vercel Marketplace), accessed via `@neondatabase/serverless` + Drizzle ORM
- **Commerce:** Shopify Storefront API (browsing/cart) + Shopify Checkout (payment)
- **Analytics:** GA4, Klaviyo, Microsoft Clarity, Vercel Analytics + Speed Insights
- **Hosting:** Vercel
- **Repo:** github.com/rickykyau/stehlenauto-vercel

## Hard Requirements (Non-Negotiable)

- **SSR on every page.** No client-only rendering for indexable content.
- **Google indexable:** real HTML in source, JSON-LD on PDPs, dynamic sitemap, semantic markup.
- **Lighthouse SEO 100, Core Web Vitals all green.**
- Phase 0 = scaffold + foundation. Each subsequent phase ships verifiable progress.

## Design Source

- Claude Design handoff bundles in `docs/design-handoffs/`:
  - `2026-05-02-stehlen-storefront/` — initial home/collection/PDP/category set
  - `2026-05-03-stehlen-storefront/` — full storefront expansion (cart/checkout/account/returns/search/vehicle-hub/content + chat assistant)
- Per-update workflow: user pastes a design URL → Claude Code fetches `.gz` archive → extracts to `docs/design-handoffs/YYYY-MM-DD-<slug>/` → reads README + chat transcripts + JSX/HTML → implements
- Category tile imagery: `public/images/categories/` (30 high-res JPGs, named by category)

## Reference Documents (in-tree)

Read these BEFORE making decisions in their domain — they encode prior research and locked architectural choices:

- `docs/reference/shopify_2026_app_reference.md` — definitive Shopify app/token guide. **Read before any Shopify integration work.**
- `docs/reference/fitment_flow_decision.md` — locked 3-level nav decision (Home → Collection → PDP). **Read before any YMM/fitment work.**
- `docs/reference/competitor_fitment_ux_research.md` — competitor pattern analysis (Tyger, RealTruck, AutoZone, etc.)
- `docs/reference/tygerauto_structural_spec.md` — competitor structural reference (adopt structure, NOT visual style)
- `docs/reference/category_taxonomy_proposal.md` — 12-category taxonomy with SKU counts
- `docs/reference/cb_aces_fitment_audit.md` — fitment data availability audit + SKU regex for bed length
- `docs/reference/product_clusters_report.md` — 91 sub-model clusters identified

## Reference Data (in-tree)

- `data/ymm_tree.json` — Year → Make → Model tree built from Shopify product tags (drives YMM dropdowns)
- `data/product_clusters.json` — 91 product clusters with their dimensions (bed_length, cab_type, color, etc.)

## Architecture Decisions (locked May 1, 2026)

- 3-level navigation only: Home → Collection → PDP
- Style is a facet on Collection, NOT a separate URL level
- 4th filter (sub-model: bed length, cab type, trim, door count) is conditional:
  - Collection toolbar chip — appears only when category requires it
  - PDP variant strip — gates Add to Cart, never gates browsing
  - Persisted to garage on first answer, never asked twice for same vehicle
- Universal products (51% of catalog) bypass all sub-model UI entirely
- Color/finish is a style facet, NEVER part of fitment gate

## Folder Structure

```
src/
├── app/                       App Router routes
│   ├── collections/[handle]/  Collection pages (SSR + ISR)
│   ├── products/[handle]/     PDP (SSR + ISR)
│   ├── cart/                  Cart page (client interactive)
│   ├── account/               Clerk-gated account routes
│   ├── welcome-back/          Reactivation landing
│   └── api/                   Webhooks, cart, garage
├── components/
│   ├── ui/                    Primitives (Button, Input, Chip, ...)
│   ├── layout/                Header, Footer, AnnouncementBar, MegaMenu
│   ├── commerce/              ProductCard, Price, AddToCart, FitmentBadge
│   ├── fitment/               YMMSelector, Garage, FitmentFilter, SubModelStrip
│   ├── overlays/              Modals, drawers, command palette
│   └── pages/                 Page-level composed sections
├── lib/
│   ├── shopify/               Storefront + Admin API clients
│   ├── clerk/                 Auth helpers
│   ├── db/                    Drizzle schema + queries
│   ├── analytics/             GA4, Klaviyo, Clarity wrappers
│   ├── fitment/               YMM tree, sub-model logic
│   └── utils/                 cn, formatters
└── types/
```

## Environment Variables

See `.env.example`. Set in Vercel via dashboard or `vercel env`.

## Phase Plan

- **Phase 0 ✅:** Scaffold, design tokens, fonts, base components, deploy to vercel.app
- **Phase 1 ✅:** Header/Footer chrome, Home page, Shopify Storefront API client (with mock fallback)
- **Phase 2 ✅:** Collection page with filters, PDP with variant strips, cart drawer
- **Phase 3 ✅:** Clerk auth + Neon garage (Drizzle) + sub-model persistence + cart drawer wiring + YMM modal
- **Handoff 2026-05-03 ✅:** Full storefront pages from Claude Design — /cart, /checkout (Shopify handoff), /order/confirmation, /search, /vehicle/[slug] hub, /account dashboard (tabbed), /account/orders/[id], /returns/[orderId] flow, /about, /help hub, /help/contact, /help/install, /legal/[slug] (9 policies), RIG chat assistant
- **Phase 4 ✅:** Analytics (GA4 + Klaviyo + Clarity + Vercel Analytics + Speed Insights) firing page_view/view_item/add_to_cart/begin_checkout/search/identify, Shopify predictive search wired into header typeahead with /api/search/suggest, /welcome-back landing
- **Phase 5 ✅:** Real Shopify sitemap (paginated cursor through products + collections, fallback to mock), breadcrumb + Organization JSON-LD, wishlist via Drizzle (wishlist_items table) + /api/wishlist Clerk-gated, account orders pulled from Shopify Admin API by customer email, RIG chat wired to Vercel AI Gateway streaming Claude Sonnet 4.6 with Stehlen system prompt + garage context, lighthouserc.json + GH Actions Lighthouse CI workflow
- **Phase 6 ✅ (runbook):** `docs/runbooks/dns-cutover.md` — pre-cutover checklist, redirect map, DNS swap steps, rollback plan, 30-day cleanup. Execution is a Ricky-driven activity (DNS records, Vercel domain attach, baseline metrics).

## What's actually built

**Routes** (22 total, all SSR):
- `/` — Home (hero, YMM band, best sellers, categories, popular vehicles, testimonials, recently viewed)
- `/collections` and `/collections/[handle]` — category index + dynamic collection page with sticky toolbar + sidebar filters
- `/products/[handle]` — PDP w/ gallery, sticky buy box, conditional sub-model strips (per `lib/fitment/sub-model.ts`), 7-tab specs, JSON-LD Product schema
- `/cart` — full cart page with promo + checkout handoff
- `/checkout` — review + handoff to Shopify hosted checkout
- `/order/confirmation` — post-purchase celebration + status timeline
- `/account` — Clerk-gated tabbed dashboard (overview/garage/orders/addresses/wishlist/settings)
- `/account/orders/[id]` — order detail
- `/returns/[orderId]` — multi-step Clerk-gated returns flow
- `/search` — full results with vehicle context
- `/vehicle/[slug]` — Tyger-style per-vehicle hub
- `/about`, `/help`, `/help/contact`, `/help/install` — content
- `/legal/[slug]` — 9 policies (warranty, returns, shipping, fitment-guarantee, privacy, terms, ccpa, prop-65, accessibility)
- `/sign-in`, `/sign-up` — Clerk dark theme
- `/api/{cart,garage,sub-model,ymm}` — server endpoints

**Globals** (mounted in root layout):
- `<YmmModal />` — global event-triggered (`stehlen:ymm:open`)
- `<CartDrawer />` — global event-triggered (`stehlen:cart:open`)
- `<ChatAssistant />` (RIG) — floating launcher bottom-right + 600px panel with quick prompts

**Catalog**: server falls back to mock when Shopify returns null/empty (so dev demo works while warehouse uploads real catalog).

**Garage / sub-model**: cookie-backed for guests, Drizzle-upserted for authed users, sub-model cookie merges by group (not full-replace).

## Conventions

- Use "vehicle" not "truck" in customer-facing copy
- All CTAs use primary yellow (#f5a823) sparingly — never more than 1 per viewport
- Display headers in Geist Mono uppercase + tracked
- SKUs and spec tables in JetBrains Mono
- Body in Inter

## Don't

- Don't `"use client"` on page-level routes
- Don't add features that bypass the 4th-filter scoping rules
- Don't introduce client-only rendering for indexable content
