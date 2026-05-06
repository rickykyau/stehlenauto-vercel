# Tygerauto.com — Structural Design Specification

**Crawled:** 2026-05-01
**Purpose:** Reference document for Claude Design when generating mockups for stehlenauto.com.
**Scope:** Structural patterns only (information architecture, layout, component composition, UX flow). Visual style is **NOT** in scope and should not be copied.
**Source platform:** Miva Merchant (theme: `b54/themes/shadows`).

---

## 1. Overview — UX Philosophy

Tyger Auto is a single-brand manufacturer storefront (Tyger is the brand; almost every SKU is Tyger-branded). The site is structured around **two parallel browsing axes that converge at the product list**:

1. **By Vehicle** (top-priority, shown first in nav and as a homepage block): Shop by Make → Make hub → 4-field YMM filter (Year + Make + Model + Submodel) → product list.
2. **By Product Type** (mega-menu): Tonneau Covers → series sub-page (T1, T2, T3, T4, T5) → SKU list scoped to that series → individual PDP.

Key observations:

- The site **has no faceted left-sidebar filter system** — no checkboxes for color, brand, price range, etc. The only filtering is **YMM (4-field)** + a single **Sort dropdown** + a **page-size selector**. This radically simplifies UI but pushes 100% of refinement burden onto the YMM widget.
- Every PDP is a **YMM-resolved leaf SKU** (one product = one Year/Make/Model/Bed combination). Variants are not used to multiplex fitments; instead each fitment is its own SKU. This drives a high SKU count but eliminates "select your bed length" pickers on the PDP itself.
- **Trust scaffolding is heavy and consistent**: free shipping bar, 5-year warranty, Affirm financing, Shopper Approved reviews, secure checkout, live chat — all surfaced repeatedly across header/footer/PDP.
- The site is conservatively responsive (Miva CSS utility classes `u-width-N--s/m/l`), with a hamburger menu, mobile search drawer, and simplified mobile nav. No app-shell behavior; full-page reloads everywhere.
- Cart is a **dedicated full page** (not a drawer) — `/basket-contents.html`. There is a small cart count badge in the header; no slide-out mini-cart drawer.

---

## 2. Per-Page Specifications

### 2.1 Homepage (`/`)

**Title:** "Aftermarket Truck Accessories | TYGER Auto"
**Vertical sections in order:**

1. **Top utility strip** (above main header):
   - Left: phone number (`1-866-340-3038`) and live chat link.
   - Right: "Sign In or Create an account" link → opens login modal with Email + Password fields and "Forgot Password?" link.
2. **Main header** (sticky on scroll):
   - Logo (left).
   - Search input (center) with placeholder "Search by Year Make Model, Product Type, or Part Number" — autocomplete enabled (`data-mm_searchfield`, `x-search-preview` dropdown).
   - "Secure Checkout" badge (small, beside search).
   - Cart link with item count and "Cart (0)" label (right).
3. **Main navigation bar** (horizontal mega-menu, desktop):
   - Top-level items: **Shop by Make**, **Tonneau Covers**, **Running Boards**, **Outdoor & Sports**, **Bumpers & Guards**, **Sport Bars**, **Hitches & Towing**, **Interior Accessories**, **Fender Flares**, **Sale**.
   - Each top-level expands a mega-menu containing sub-categories (e.g., Tonneau Covers expands to T1, T1X, T2, T2X, T3, T3X, T4, T5, Cleaner & Protectant, Replacement Parts).
   - Make-based items inside "Shop by Make": Chevy, Ram, Ford, Jeep, Toyota, Nissan, Honda, Universal Parts.
4. **Hero carousel** (Slick.js, dots + arrow nav, autoplay):
   - Slides include: "Forged in Truck Country", "Tyger Access Running Board Drop Steps", "TYGER Tonneau Cover", "Overland Rack", "Tyger Kobra".
   - Each slide is full-bleed image + linked to its product/category.
   - No CTA button overlay copy detected — slides themselves are the click target.
5. **YMM block ("Shop By Vehicle")** — central panel directly below hero:
   - Heading: "Shop By Vehicle".
   - Four sequential dropdowns: **Year**, **Make**, **Model**, **Submodel** (the 4th field is `data-facet-field="1_4"`).
   - Two CTAs: **Go** (primary, sets fitment cookie) and **Reset** (secondary, removes cookie).
   - Default state error/help text: "Please select a Year, Make, and Model." (Submodel is optional fallback.)
6. **Category tile grid** (12 tiles, ~4×3 on desktop):
   - Tiles: Tonneau Covers, Bumpers & Guards, Running Boards, Outdoors & Sports, Sport Bars, Hitches & Towing, Interior Accessories, Fender Flares, Recovery Board, Survival Shovel & Knives, Replacement Parts, Select Your Vehicle Make.
   - Each tile = image + label. No price, no count, no description.
7. **Free shipping banner** (full-width image): "Free Ground Shipping to 48 States".
8. **SEO copy block**: H2 "Aftermarket Truck Accessories" + two paragraphs of category-keyword copy. No CTAs.
9. **Footer** (see Section 3.2).

**Persistent floating elements:**
- Live Chat widget (LiveChat Inc., bottom-right).
- Shopper Approved seal badge (referenced 6× in DOM — likely visible on PDP and footer).

**Notable absences:** no email-capture popup, no announcement bar with promo code, no "as seen on" press logos, no testimonials carousel, no Instagram feed, no blog teaser cards on homepage.

---

### 2.2 Storefront Landing (`/storefront.html`)

**Outcome:** Identical content and HTML size to homepage. This URL is effectively an alias / fallback for `/` in Miva. No separate "all categories" hub view.

---

### 2.3 Category Page — Tonneau Covers (`/tonneau-covers.html`)

**Title:** "Tonneau Covers | Tonneau Bed Covers | TYGER Auto"
**H1:** "Tonneau Covers"

**Vertical sections:**

1. Header + main nav (same as homepage; sticky).
2. **Page hero**: full-bleed banner image with category name overlay.
3. **Breadcrumb**: `Home › Tonneau Covers`.
4. **YMM filter block** — same 4-field widget as homepage; persistent across pages, reads/writes a cookie.
5. **Sub-category tile row**: TYGER T1, T1X, T2, T2X, T3, T3X, T4, T5, Cleaner & Protectant, Replacement Parts. Each tile = image + label (same component as homepage tiles).
6. **Inline SEO copy**: 1-paragraph category description.
7. **Footer**.

**Notable:** This is a **landing-page-style category** that funnels users to a series sub-category (e.g., T1) rather than dumping the full SKU list. It does not show product cards directly. The next-level page (T1) shows the SKUs.

---

### 2.4 Sub-Category Collection — TYGER T1 Soft Roll-Up (`/tonneau-cover/tyger-t1/tyger-t1-soft-roll-up.html`)

**H1:** "TYGER T1 (Soft Roll-Up)"

**Vertical sections:**

1. Header + nav.
2. Breadcrumb: `Home › Tonneau Covers › TYGER T1 (Soft Roll-Up)`.
3. **YMM filter block** (4-field, same component).
4. **Toolbar** (above grid):
   - **Sort by**: Featured, Best Selling, Lowest Price, Highest Price, Newest.
   - **Number of Products to Show**: 12 / 24 / 48 / 60 / 96.
   - Pagination: "Page 1 of N" with Next + last-page (`>>`) links. No infinite scroll.
5. **Product grid** (~4 columns desktop, 2 columns tablet, 1 column mobile based on `u-width-*` classes):
   - **Card content (top to bottom):**
     - Product image (single static, no hover swap detected).
     - Product title (descriptive, format: `TYGER T1 Soft Roll-up fit 2015-2026 Ford F-150 | 6.5' Bed`).
     - Price (e.g., `$207.00`).
     - Affirm "as low as $X/mo" line (financing widget, per-card).
   - **No card-level rating stars, no badges (Best Seller / Sale / New), no "Quick View", no add-to-cart from the grid.** Click → PDP only.
6. **Bottom pagination** (mirror of top).
7. **Footer**.

**Notable:**
- **No left sidebar.** No checkbox filters. No price slider. No color swatches. No "in-stock only" toggle. The YMM widget is the single mechanism for narrowing.
- Product titles do all the heavy lifting — fitment range, model, and bed length are encoded into the title, since there are no badges or attribute icons on the card.

---

### 2.5 Make-Based Hub (`/parts-for-chevy-vehicles.html`)

**H1:** "Parts for Chevy Vehicles"

**Sections:**

1. Header + nav.
2. Make-themed banner (Chevy logo/imagery).
3. Breadcrumb: `Home › Shop by Make › Parts for Chevy Vehicles`.
4. YMM filter (Make pre-set to Chevrolet).
5. Toolbar (Sort + View count, same as 2.4).
6. Product grid showing **all Tyger SKUs that fit any Chevy** (cross-category — tonneau, running boards, fender flares, hitches all mixed together in one grid). Pagination: 12 pages at 12-per-page = ~144 products.
7. Footer.

**Notable:** This is a flat cross-category listing — relies entirely on YMM narrowing or visual scanning of long titles to refine.

---

### 2.6 Product Detail Page (PDP) — TYGER T1 fit 2015-2026 Ford F-150 6.5' Bed (`/tonneau-cover/tyger-t1-soft-rollup/tg-bc1f9030/...`)

**H1:** Product title (single line, fitment-encoded).

**Vertical sections / two-column layout (desktop):**

#### Left column — Gallery
1. **Image gallery**: 6–8 product photos, slick carousel with thumbnail navigation strip (1/8, 2/8 ... counter visible). Includes:
   - Hero product shot.
   - Lifestyle / installed shots.
   - Detail shots (close-ups of clamps, rails, latches).
   - "Why Tyger" comparison illustration.
   - Weather-resistance illustration.
   - Installation diagram.
   - Size diagram.
2. **Embedded video** below or in carousel: YouTube iframe (`youtube.com/embed/<id>`) — typically install / overview video.

#### Right column — Buy box (sticky scroll behavior on desktop, class `product-sticky-header`)
1. Product title (H1, repeated).
2. Star rating display (Shopper Approved-style stars, e.g., `★★★★★ (10)` — rating count link to reviews).
3. **SKU**: `TG-BC1F9030`
4. **UPC**: `816239022931`
5. Trust micro-badge: "Free Ground Shipping to 48 States".
6. **Price**: `$207.00` (single price, no compare-at / strikethrough detected).
7. **Affirm "as low as $X/mo"** text + "Learn more" trigger (modal).
8. Quantity stepper: `[-]  1  [+]` (custom buttons + tel input).
9. **Primary CTA**: "Add To Cart" (full-width primary button, uppercase).
10. **Add to Wishlist** (icon button, secondary).
11. Secondary links: "Item Inquiry" • "Tell A Friend" (small text links).
12. **Share**: social icons (Facebook / X / Pinterest detected).

#### Below the fold — Tab strip / accordion (anchor-scroll links)
A horizontal tab nav appears in the buy-box area with labels (also rendered as in-page anchored sections below for mobile):
1. **Fitment** — bullet of compatible vehicles (e.g., `Bed Size: 6.5' (79") Bed | Compatible with 2015-2026 Ford F-150 | Cab size does not matter`). Plain text, no per-vehicle sub-list.
2. **Features** — long-form marketing description (FITMENT / DESIGN / FEATURES / INSTALLATION / NOTE / WARRANTY blocks separated by inline labels, all in one paragraph).
3. **Similar Products** — 4-card horizontal carousel of same-bed-size products in other Tyger series (T1X, T2, T2X, T3 in this case). Card = image, title, price.
4. **Customers Also Bought** — 3-card carousel of complementary categories (e.g., Tyger Rider running board, Cleaner & Protectant, Hitch Armor).
5. **Installation** — link to installation PDF.
6. **Warranty** — "Click here for additional details" link to warranty policy. FAQ link below.
7. **Shipping** — package weight + dimensions + per-region shipping ETA table (CA/NV/UT/AZ: 2-3 days; other Western: 3-4; Midwest/Southern: 4-5; Northeast: 5-6) + link to full shipping policy.

#### Below tabs
- **California Prop 65 Warning** block (text + link to p65warnings.ca.gov). Pure compliance, no decoration.
- **Videos** section header (additional embedded videos beyond the gallery).
- **"Sign up to be notified when this product is back in stock"** email-capture form — appears even on in-stock items.

#### Reviews
- Shopper Approved iframe embed loads inline reviews ("Verified Buyer" tag visible). Embedded as a third-party widget; not native to Miva.

**JSON-LD structured data:** `Product` schema with name, image, description, `offers` (price, priceCurrency: USD, sku, seller "Tyger Auto", availability "In Stock", inventoryLevel: 263, priceValidUntil 2050-1-1). No `aggregateRating` in the JSON-LD despite stars being shown — rating data is embedded in the iframe widget.

**Notable PDP UX choices:**
- **No variant selector.** Bed length, color, finish are not options on the product — they are separate SKUs at the catalog level. This avoids the "doesn't fit" PDP trap.
- **No "Confirm Fitment" widget on PDP.** The fitment is implicit in the product title (the product *is* the fitment). The YMM cookie may pre-warn elsewhere but there is no dedicated "Fits / Doesn't Fit" callout in the buy box.
- **Sticky right-rail buy box** keeps Add to Cart visible while user scrolls through gallery + tabs.
- **Inventory level (263) is exposed in JSON-LD** — they're not hiding stock counts.

---

### 2.7 Search Results (`/search.html?q=tonneau`)

**H1:** "Search Results"
**Sections:**
1. Header + nav.
2. Breadcrumb: `Home › Search`.
3. YMM filter block.
4. Toolbar (Sort + View count).
5. Mixed-category product grid (e.g., a "tonneau" search returns Tonneau Covers, Fender Flares, Hitches if title matches).
6. **Search tips** block at bottom: 3 expandable Q&A items ("My search returns too many results", "...returns no results", "...still can't find").
7. Footer.

**Autocomplete dropdown** (`#x-search-preview`) is enabled on the header search but its rendered list of suggestions is JS-driven — not visible in static HTML. Placeholder copy is consistent: "Search by Year Make Model, Product Type, or Part Number."

---

### 2.8 Cart Page (`/basket-contents.html`)

**Empty state title:** "Tyger Auto: Basket Contents"
**Empty state body:** "Your shopping cart is currently empty. **Start Shopping** [link to home]."

We could not capture a populated cart without a session, but Miva's standard `BASK` page renders:
- Cart line items (image, title, qty stepper, line price, remove link).
- Subtotal block (right-aligned).
- Coupon code field.
- Estimated shipping calculator (zip-code based for non-48 states).
- Affirm "as low as" estimate row.
- Two CTAs: "Continue Shopping" (secondary) and "Proceed to Checkout" (primary).
- No upsell carousel detected in the empty-cart screen; populated cart may show "You might also like".

**Notable:** Cart is a **standalone page**, not a drawer. The header cart link routes here; clicking the cart icon does not open a slide-out panel.

---

### 2.9 Brand / Series Landing Pages

Examples: `/tyger-access.html`, `/tyger-kobra.html`, `/tyger-rider.html`, `/star-strider.html`, `/tyger-landerx.html`.

These are **product-line marketing pages**, not category collections. They typically include:
- Hero with series name + tagline.
- Feature highlights with iconography.
- Lifestyle imagery.
- "Shop the Series" CTA → routes to the YMM-filtered SKU list for that series.

---

### 2.10 Policy / Support Pages

Standard CMS pages with header + nav + plain content + footer. No distinctive structure:
- `/about-us.html` — single H1 + paragraph copy + founder/mission story + brand history.
- `/return-policy.html`, `/warranty.html`, `/privacy-policy.html` — plain text policy pages.
- `/contact.html`, `/product-inquiry.html`, `/track-my-order.html`, `/warranty-claim.html` — form pages.
- `/reviews.html` — placeholder/iframe-only page (Shopper Approved embed handles the content).
- `/frequently-asked-questions.html` — FAQ list.

---

## 3. Cross-Page Patterns (documented once)

### 3.1 Header (consistent across every page)

Three rows:

**Row 1 — Top utility strip** (background dark, small text)
- Phone `1-866-340-3038` (clickable tel: link).
- Live Chat link.
- Right: "Sign In or Create an account" → modal with email/password + Forgot Password.

**Row 2 — Main header**
- Logo (left).
- Centered search input — placeholder "Search by Year Make Model, Product Type, or Part Number"; submits to `/search.html?q=`. Autocomplete dropdown via Miva `cmp-cssui-searchfield`.
- "Secure Checkout" badge.
- Cart link (right): icon + "Cart (N)" + item count badge. Routes to `/basket-contents.html`.

**Row 3 — Main navigation** (mega-menu, sticky on scroll)
- Top items: Shop by Make · Tonneau Covers · Running Boards · Outdoor & Sports · Bumpers & Guards · Sport Bars · Hitches & Towing · Interior Accessories · Fender Flares · Sale.
- 27 `has-child-menu` instances → most items have hover dropdowns with sub-categories and brand-line series sub-items.
- Hover behavior is desktop-only; mobile collapses to hamburger.

**Mobile header**
- Hamburger icon (`☰`) replaces the full nav. Tapping opens a left/right drawer with `mobile-menu-parent-links` ul, drilling into sub-items via expand-arrow icons.
- Search collapses into a separate mobile-menu-search element above the menu list.
- Logo centered, cart icon right.

### 3.2 Footer (consistent across every page)

Five-column layout (desktop) collapsing to single column (mobile):

**Column 1 — Tyger Auto (brand block)**
- Logo.
- Mailing address: `1160 W. Rincon Street, Suite #101, Corona, CA 92878`.

**Column 2 — Customer Service**
- Phone (`1-866-340-3038`) — large/prominent.
- Live Chat link.
- Hours: Mon-Fri 9am-5pm PST · Sat-Sun closed · Public Holidays closed.
- Disclaimer micro-text: "All manufacturer names, symbols, and descriptions used in our images and text are used solely for identification purposes only..."

**Column 3 — Company**
- About Us · My Account · Shipping & Return Policy · Warranty Policy · Privacy Policy · Wholesale Distributor · Become an Affiliate · Reviews · Blog.

**Column 4 — Customer Support**
- FAQ · Contact Us · Product Inquiry · Track My Order · Technical Support · Return & Exchange · Warranty Claim · Coupon Request · Product Ingredient Disclosure.

**Column 5 — Follow Us**
- Facebook · YouTube · Instagram · Shopper Approved (4 icon links).

**Sub-footer:** "Copyright © 2026 tygerauto.com. All Rights Reserved."

**Notable:** No newsletter signup, no payment method icons, no trust seal row in the footer (Shopper Approved seal lives above the footer or floats on PDPs). Text-link-heavy with no large promotional CTAs.

### 3.3 YMM Fitment UX (the centerpiece)

- **4 sequential dropdowns**: Year → Make → Model → Submodel (`data-facet-field="1_1"` through `1_4`).
- Cookie-persistent: clicking **Go** sets a fitment cookie (`set-cookie` button class); **Reset** clears it (`clear-cookie` class).
- Widget appears on: homepage, every category page, every sub-category collection page, search results page, every make hub page. **Not present on PDPs** (PDPs show fitment text inline in the H1 and Fitment tab).
- Default state: empty dropdowns + helper text "Please select a Year, Make, and Model."
- Submodel is the 4th refinement field — used for cab type, bed length, drive type, or trim where Tyger needs to disambiguate further. The Submodel dropdown is populated dynamically based on Year+Make+Model selection.
- **Behavior:** On **Go**, the cookie is set and the page re-loads filtered to compatible SKUs. On a category page, this filters the visible product grid. On the homepage, it routes to a search/results page.
- **No vehicle garage** (multi-vehicle saved list) detected. The fitment cookie holds one current selection.

### 3.4 Cart UX

- Cart count badge in header updates via Miva's basket session.
- Clicking cart icon = full-page navigation to `/basket-contents.html` (no drawer).
- Empty cart shows "Your shopping cart is currently empty. Start Shopping →".
- Add to Cart on PDP submits to `/basket-contents.html` via form post (full-page nav, no XHR).

### 3.5 Trust Signals — where they appear

| Signal | Location |
|---|---|
| Free Ground Shipping to 48 States | Homepage banner; PDP buy box; PDP Shipping tab |
| 5-Year Warranty (US customers) | PDP Features tab; Warranty tab; Warranty page |
| Shopper Approved review widget | PDP (iframe); Reviews page; Footer seal |
| Affirm "as low as $X/mo" | PDP buy box; Product cards in grid; Cart page |
| Secure Checkout badge | Header (next to search) |
| Live Chat | Header utility strip; Footer; Floating widget bottom-right |
| Phone number (1-866-340-3038) | Header utility strip; Footer |
| California Prop 65 warning | PDP (compliance block, all SKUs) |
| In-stock indicator | JSON-LD only ("availability": "In Stock", "inventoryLevel": 263) — not rendered in visible UI |

### 3.6 Mobile-Specific Behavior

- Hamburger menu (`☰` glyph) replaces top nav; opens slide drawer with collapsible sections.
- Mobile search field is in its own row inside the drawer (not in the header).
- Product grid: 1 column.
- PDP: gallery moves above buy box (not side-by-side); tabs collapse to in-page anchors / accordion.
- Sticky header preserved on mobile (`product-sticky-header` class).
- No bottom-fixed Add-to-Cart bar detected on mobile PDP (this is a missing best practice).
- Live Chat widget remains floating; collapses to a small bubble.

---

## 4. Key Takeaways — What Stehlen Should Adopt

These are the structural patterns worth carrying into the stehlenauto.com redesign:

1. **4-field YMM (Year + Make + Model + Submodel)** as the primary filtering mechanism, prominent on homepage, every category, every sub-category, and search results.
   - Persist the selection via cookie / Supabase user record.
   - Default helper text directs the user when fields are blank.
   - Reset button beside Go is essential.
   - For Stehlen this maps directly to the existing `year:` / `make:` / `model:` tag system plus the planned `sub_model` metafield (already on the open items list in CLAUDE.md).
2. **Two parallel browse axes**: by Vehicle (make hubs) AND by Product Type (mega-menu). Tyger's "Shop by Make" hub routing is a clean pattern: top-nav → make hub → cross-category SKU list pre-filtered to that make.
3. **Fitment-encoded product titles** as the cheapest, most accessible signal (e.g., "Stehlen [model] Tonneau fit 2015-2026 Ford F-150 | 6.5' Bed"). This works without per-card badges and survives copy/paste into search results.
4. **Mega-menu with brand-series sub-categories.** Tonneau Covers expands to T1, T2, T3, T4, T5 etc. Stehlen should expand each top-level category into its product lines/series in the dropdown, not just dump all products into a single "Tonneau Covers" collection.
5. **Tabbed PDP below the fold:** Fitment · Features · Similar Products · Customers Also Bought · Installation · Warranty · Shipping. Anchor-link style on desktop, accordion on mobile.
6. **Sticky right-rail buy box** on PDP keeps Add to Cart in view through long-form content.
7. **Two cross-sell carousels** on PDP: "Similar Products" (same fitment, different series) and "Customers Also Bought" (complementary cross-category). These are independent and serve different intents.
8. **Inline trust micro-badges in the buy box**: Free Shipping line, Affirm "as low as", warranty mention. Don't bury trust in the footer.
9. **Per-region shipping ETA table** in the Shipping tab — converts visitors who care about delivery time. Stehlen should pull this from carrier zone data.
10. **Price-includes-financing pattern**: show Affirm/Klarna "$X/mo" line under price on cards AND PDP. Reduces sticker shock on $200–$1,500 truck accessories.
11. **JSON-LD `Product` schema** with offers, sku, availability, inventoryLevel, priceValidUntil — Tyger does this on every PDP and it helps search/AI surfaces.
12. **Sub-category collection pages** (e.g., T1 series) instead of dumping every SKU into Tonneau Covers. This narrows decision space and lets each series carry its own marketing copy.
13. **Search placeholder doubles as YMM hint**: "Search by Year Make Model, Product Type, or Part Number" tells users the search bar accepts vehicle-style queries.
14. **"Notify when back in stock" email capture** on every PDP regardless of stock — captures lead intent + gates competitor-poaching.
15. **California Prop 65 compliance block** on every PDP — required for CA shipments, often forgotten.

---

## 5. What Stehlen Should NOT Copy

These are anti-patterns or dated choices in Tyger's UX that we should improve on, not replicate:

1. **No left-sidebar facets.** Tyger relies on YMM as the only filter. For Stehlen's 1,322-SKU catalog this is not enough — users searching "black bull bar" need a finish/color filter, and shoppers without a vehicle (51% of universal SKUs) need price/category filters. **Build proper checkbox facets** alongside the YMM widget.
2. **No "Fits / Doesn't Fit" confirmation on PDP.** A user with a fitment cookie set who lands on a non-matching PDP gets no warning. Stehlen should add a green "Fits your 2018 Ford F-150" / red "Does not fit" pill in the buy box (RealTruck-style).
3. **Cart is a full-page redirect**, not a drawer. Slide-out cart drawer + persistent buy-box keep users in flow. Stehlen already has this — keep it.
4. **No vehicle garage.** Tyger only stores one current fitment in cookie. Stehlen should support multiple saved vehicles tied to the user's Supabase record (already noted in CLAUDE.md memory).
5. **No ratings/badges on grid cards.** A bare image+title+price card under-serves users browsing 100+ products. Add review stars, "Best Seller" / "New" / "Sale" badges, and quick-add from grid.
6. **No hover/quick-view on grid.** No way to preview without clicking through. Add a "Quick View" or hover-zoom for fast scanning.
7. **Make-hub flat grid** mixes 144 products across 6 categories with no sub-grouping. Stehlen's make-hubs should group by category sub-tile (Tonneau / Running Boards / Bumpers) before drilling in.
8. **Single-image hover state** (no swap-to-secondary on hover). Stehlen should swap to a lifestyle/install image on hover for engagement.
9. **Long single-paragraph "Features" copy** with inline labels (`FITMENT - ... DESIGN - ... FEATURES - ...`). This is hard to scan. Stehlen should use proper structured sections (H3 + bullet lists).
10. **Visual style** — Tyger's 2010s e-commerce aesthetic (gradient buttons, plain product cards, dense text) is not the bar. Stehlen should aim for the cleaner, image-forward feel of RealTruck / AutoAnything 2025 — but with the same information density Tyger achieves.
11. **No newsletter capture in footer.** Stehlen has Klaviyo connected; the footer should drive list growth.
12. **No mobile bottom-fixed "Add to Cart" bar.** Standard mobile commerce best practice; Tyger lacks it.
13. **No loyalty / rewards program signal.** No "earn points" / "members save 10%" callouts. If Stehlen launches a program, surface it.
14. **No product comparison table** for series like T1 vs T1X vs T2. Users picking between Tyger's tonneau lines have to read 5 separate landing pages. Stehlen should build a side-by-side comparison component.
15. **No reviews on category cards.** Even social-proof-light cards should show "(127 reviews)" — Tyger does not.

---

## 6. Component Inventory for Claude Design

When generating mockups for stehlenauto.com, the following composable components map back to Tyger's structural pattern set:

- `SiteHeader` — utility strip, logo, search (with YMM-aware placeholder), secure checkout badge, cart link.
- `MainNav` — top-level mega-menu with category-line sub-items, sticky on scroll, hamburger on mobile.
- `YMMSelector` — 4-field (Year/Make/Model/Submodel) with Go + Reset; cookie/user-bound; rendered on homepage, category, sub-category, search, make hub.
- `HeroCarousel` — Slick-style with dots + arrows; full-bleed image slides linking to lifestyle / category / brand pages.
- `CategoryTileGrid` — 4×3 grid of image+label tiles (consider adding product count and a tagline beyond Tyger's bare label).
- `MakeHubBanner` — make-themed hero + cross-category SKU grid.
- `ProductGrid` — responsive (4/3/2/1 col), card with image, title (fitment-encoded), price, financing line. **Add review stars + badges + quick-view, which Tyger lacks.**
- `Toolbar` — Sort dropdown + Page-size dropdown + Pagination. **Add facet/filter sidebar, which Tyger lacks.**
- `PDPGallery` — main image + thumbnail strip + embedded video; supports 6–10 images.
- `PDPBuyBox` (sticky) — title, rating, SKU, trust micro-badges, price, financing, qty stepper, Add to Cart, wishlist, share, secondary action links.
- `PDPTabbedDetails` — Fitment / Features / Similar / Also Bought / Installation / Warranty / Shipping. Anchor-tabs desktop, accordion mobile.
- `RelatedCarousel` — used twice: "Similar Products" (same fitment) and "Customers Also Bought" (complementary).
- `PDPShippingETA` — region → days table.
- `BackInStockForm` — email capture, present on every PDP.
- `Prop65Block` — CA compliance text + link.
- `SearchAutocomplete` — header dropdown, query suggestions (Tyger's is JS-driven; we should ship one in Algolia/Typesense style with product previews).
- `CartPage` — line items, subtotal, coupon, shipping estimator, Affirm row, Continue + Checkout CTAs. **Stehlen already uses a cart drawer instead — keep that.**
- `SiteFooter` — 5-column (Brand · CS · Company · Support · Follow). **Add newsletter signup.**
- `LiveChatWidget` — floating bottom-right; reuse Klaviyo or Intercom equivalent.
- `LoginModal` — header-triggered, email + password + forgot password.
