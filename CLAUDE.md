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

- Claude Design handoff bundle: sibling repo at `Shopify-Storefront-Lovable/data/design-handoffs/2026-05-02-stehlen-storefront/`
- Per-update workflow: user pastes `DESIGN HANDOFF: <url>` → Claude Code fetches + extracts + implements

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

- **Phase 0 (now):** Scaffold, design tokens, fonts, base components, deploy to vercel.app
- **Phase 1:** Header/Footer chrome, Home page, Shopify product/collection fetching
- **Phase 2:** Collection page with filters, PDP with variant strips, cart drawer
- **Phase 3:** Clerk auth + Neon garage + sub-model persistence
- **Phase 4:** Search, mega-menu, welcome-back landing, analytics events
- **Phase 5:** Sitemap with all products, JSON-LD, performance tuning, Lighthouse CI gate
- **Phase 6:** DNS cutover from Lovable

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
