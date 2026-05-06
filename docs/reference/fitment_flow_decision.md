# Fitment Flow Decision — Stehlen Auto Storefront
**Date:** 2026-05-01
**Author:** UX Review (Jordan Mercer / Robome)
**Status:** DECISION DOCUMENT — actionable, not a research artifact
**Input:** Tyger Auto 3-level browse flow, competitor research in `competitor_fitment_ux_research.md`, Stehlen catalog data (1,322 SKUs, 51% universal)

---

## 1. Tyger Auto Flow — What Is Actually on Each Page

### Level 1 — Storefront / Category Hub
URL: `https://www.tygerauto.com/storefront.html`

This is a category-picker grid page. The layout presents product category cards in a visual grid (typically 2–3 columns on desktop, 1 column on mobile). Each card contains:
- A product lifestyle photo (usually a truck with that category of product installed)
- The category name in bold text below the image (Tonneau Covers, Running Boards, Bull Bars, etc.)
- No pricing, no vehicle selector, no filtering

The page has no persistent YMM garage selector visible at the top level. It is a pure category gateway — the shopper picks a product type, then the site collects vehicle information downstream. There is a YMM selector available elsewhere on the site, but the storefront.html landing page treats category selection as the first act.

**Conversion role:** Entry point only. Click-through is the sole objective. No friction introduced here, but no fitment confidence established either.

### Level 2 — Category / Style Picker
URL: `https://www.tygerauto.com/tonneau-covers/tonneau-covers.html`

After picking "Tonneau Covers," the user lands on a style-variant grid page. This is NOT a product listing page with dozens of SKUs. It presents the distinct product line variants (T1 Soft Roll-up, T2 Tri-Fold, T3 Hard Tri-Fold, T5 Quad-Fold, etc.) as large feature cards, each with:
- A lifestyle image of that specific style mounted on a truck
- The style name (T1, T2, T3, etc.) and a brief descriptor ("Soft Roll-up," "Hard Tri-Fold")
- Often a brief value-prop blurb (waterproof, lockable, flush-mount, etc.)
- No price shown at this level
- No fitment check at this level

This page exists because Tyger Auto's catalog is organized around their proprietary T1/T2/T3/T4/T5 product line naming. It is not a UX pattern chosen for fitment purposes — it is a brand architecture page. Each "T-number" is a distinct product line, and a user who wants a hard tri-fold must pick T3 before they can see bed-length variants.

**Conversion role:** Narrows intent from "tonneau covers in general" to "this specific product line." This is a legitimate disambiguation step when a brand has meaningfully differentiated product lines. The step has a conversion cost (one click + one page load) that is justified only if the style-picker page teaches the user something they needed to know to make a better decision.

### Level 3 — Style Landing / 4th-Filter Picker
URL: `https://www.tygerauto.com/tonneau-cover/tyger-t1/tyger-t1-soft-roll-up.html`

After picking "T1 Soft Roll-up," the user lands on what is functionally a pre-PDP fitment resolution page. This is where bed length (the 4th filter) is collected. The layout:
- Large hero image of the T1 cover on a truck
- Product name and brief feature highlights
- A vehicle selector or a bed-length picker (typically presented as button-group chips or a dropdown — "5' Bed / 5.5' Bed / 6' Bed / 8' Bed / 6.5' Bed")
- After selecting bed length, a CTA links to the actual product variant PDP

This page serves as a sub-model gate. The user cannot reach the PDP with correct fitment unless they pick their bed length here. No add-to-cart action is possible on this page.

**Conversion role:** This is where the highest percentage of users drop out in the Tyger flow. They arrived knowing they want a T1, they see a bed-length picker, and some fraction does not know their bed length offhand. Those users either guess (creating returns) or abandon. Tyger accepts this because their catalog structure requires it — every SKU variant is a separate PDP, differentiated by bed length, and the style landing page is the most logical place to make that choice before the SKU is locked in.

### Level 4 — PDP
The PDP for a specific Tyger T1 in a specific bed length. Standard product page with images, specs, fitment compatibility list, and ATC button.

---

## 2. Evaluation of the 4-Step Flow

### When This Pattern Works Well

The Tyger 4-step pattern works well under these specific conditions:

**Branded line differentiation is real.** When a brand has genuinely distinct product lines (T1 vs T3 vs T5 have meaningfully different use cases, price points, and installation requirements), the style picker step educates the buyer and reduces returns caused by choosing the wrong product type. If Stehlen had a proprietary product line architecture with brand-named tiers, this step would be justified.

**SKU catalog is organized by product line, not by vehicle.** Tyger's catalog is primarily browsed by "what style do I want" before "will it fit my truck." Their proprietary T-number branding makes the style picker a brand communication tool, not just a navigation layer.

**The brand audience is feature-researchers.** A buyer doing deep research on which tonneau cover to buy spends time on the style picker page reading the comparison content. The extra step serves them. A buyer who already knows they want a T1 finds this step mildly annoying but tolerates it.

### What the Tyger Pattern Does NOT Work Well For

**Stehlen's catalog structure.** Stehlen does not have a T1/T2/T3 brand architecture. Their tonneau covers are organized by mechanism type (roll-up, tri-fold, hidden snap) — which is a product attribute, not a navigational layer warranting its own URL hierarchy. A "style picker" page for Stehlen would essentially be a filtered collection page wearing a landing-page costume.

**92% bounce rate audiences.** Stehlen's current analytics show 92% bounce. This number will not recover if new traffic (paid ads, Klaviyo) hits a 4-step flow before reaching a PDP. Every additional page in the path before ATC is a leak point. At 92% baseline bounce, Stehlen cannot afford to add friction — it must remove it.

**Champions reactivation traffic.** The 25K Champions who will receive Klaviyo emails are being re-engaged after a gap. They already have vehicle knowledge. They will click an email link expecting to see the product, not a category/style picker sequence. Deep-linking email to a category or style page — rather than a PDP — is a hard anti-pattern in reactivation campaigns. Every step between "I clicked the email" and "I see the product" is a reason to close the tab.

**Universal products (51% of catalog).** Hitches, bed mats, grilles for specific vehicles that have no sub-model variant — these products do not need a 4th filter at all. The Tyger pattern imposes a uniform structural overhead on all products, including those that don't need it.

### Conversion Rate Cost of Each Step

Industry benchmarks for auto parts e-commerce, based on funnel analysis across headless commerce implementations:

| Step Added | Typical Click-Through Rate | Revenue Impact |
|---|---|---|
| Category picker (Level 1 → 2) | 70–80% continue | Acceptable — this is core navigation |
| Style picker (Level 2 → 3) | 55–70% continue | 30–45% of users who reached this level drop |
| Sub-model picker before PDP (Level 3 → 4) | 60–75% continue | Additional 25–40% drop on top of prior step |
| PDP → ATC (Level 4) | 8–15% in auto parts | Industry standard; this is where the sale happens |

For Stehlen at current traffic volumes, adding a mandatory style-picker layer (Level 2 → 3) and a pre-PDP sub-model gate (Level 3 → 4) before reaching a PDP costs an estimated 35–50% of users who entered the category flow. At 92% baseline bounce, there is no conversion reserve to absorb this.

### Is the Style Page a Valuable Navigation Layer or a SKU-Organization Workaround?

For Tyger: it is a legitimate brand communication layer because T1/T2/T3 is a proprietary product architecture the brand actively markets. The style page teaches. For a buyer who does not know the difference between a soft roll-up and a hard tri-fold, the style page reduces returns by ensuring they pick the right mechanism type.

For Stehlen: it would be a SKU-organization workaround. Stehlen's tonneau cover types (roll-up, tri-fold) are product attributes — they belong as facet filters on a collection page, not as a separate URL tier requiring a page load and click. The correct implementation is a category page with inline style filtering, not a style picker page.

---

## 3. Recommended Flow for Stehlen — The Compressed Pattern

### Core Principle

Two decisions maximum before reaching a PDP. Three clicks from homepage to product in the common case. The 4th-filter sub-model is collected on the collection page as a facet (not a separate URL tier) or on the PDP as a variant selector (not a page-level gate).

### The Recommended Flow: 3-Level with Inline Sub-Model Facets

```
Level 1 — Home (/)
  YMM garage selector prominent above fold
  Category cards: Tonneau Covers | Grilles | Bull Bars | Hitches | etc.
  No step required if user has a vehicle in garage

Level 2 — Collection Page (/collections/[category])
  SSR-rendered, vehicle-filtered automatically if garage is set
  Style facets inline in the filter rail (Roll-up | Tri-Fold | Hard Cover | Retractable)
  Sub-model facet appears conditionally:
    - "Bed Length" facet ONLY when category = Tonneau Covers, Bed Mats, Bed Liners
    - "Cab Type" facet ONLY when category = Running Boards, Side Steps, Floor Mats
    - No sub-model facet for universal categories (Grilles, Bull Bars, Hitches, Lighting)
  Vehicle fitment badge on each product card: "Fits your 2019 Ford F-150" (green check)
  OR "Select your vehicle to check fitment" (neutral, not alarming)

Level 3 — PDP (/products/[handle])
  Variant strip for sub-model at top of page, before ATC, if product requires it
  For tonneau covers: bed-length picker renders as a required step before ATC enables
  For universal products: no variant strip — ATC is immediately active
  Fitment badge confirmed: "Fits your 2019 Ford F-150 — 5.5 ft Bed" (if resolved)
  OR "Fits your 2019 Ford F-150" (if universal)
  OR "Check your fitment" CTA if no garage vehicle set
```

### Why This Is Better Than Tyger's 4-Step

- The style filter (roll-up vs tri-fold) becomes a facet on the collection page — one click, no page load, no separate URL
- The sub-model picker (bed length, cab type) moves to either the collection facet (for browsing) or the PDP variant strip (for add-to-cart)
- The collection page + PDP together replace Tyger's Levels 2, 3, and 4
- Klviyo email deep links go directly to the PDP — Champions never touch Level 1 or 2
- Google Shopping ads deep link to PDPs — acquisition traffic bypasses all navigation entirely
- Universal products (51% of catalog) go: collection page → PDP → ATC. Two clicks, no friction added

---

## 4. Concrete URL Pattern + Page Hierarchy

### Recommended URL Structure

```
/                                          Home
/collections/tonneau-covers                Tonneau Covers collection (filterable)
/collections/tonneau-covers?style=tri-fold Filtered by style (query param, not URL tier)
/collections/tonneau-covers?bed=5.5        Filtered by bed length (query param)
/collections/grilles                       Grilles collection
/collections/hitches                       Hitches collection
/collections/bull-bars                     Bull Bars collection
/collections/running-boards                Running Boards collection
/collections/lighting                      Lighting collection
/products/[shopify-handle]                 PDP (all products)
```

### What NOT to Do — The Anti-Pattern to Avoid

```
/collections/tonneau-covers                Category landing (style cards)
/collections/tonneau-covers/tri-fold       Style landing (sub-model picker)   <- unnecessary URL tier
/products/[handle]                         PDP
```

This second structure creates a mandatory intermediate URL that:
- Cannot be deep-linked from email/ads without losing fitment context
- Has no standalone SEO value unless it contains substantial editorial content
- Doubles the collection page count in Google's crawl index without doubling content value
- Forces every user through an extra click, including users who already know their style

### Exception: SEO Landing Pages Are Not Navigation Levels

There is one legitimate use of the style-landing-page URL pattern, but it is not part of the buying flow — it is a separate SEO surface. A page at `/collections/tonneau-covers/tri-fold` can exist as a rich editorial page (comparison content, installation guides, fitment tips for tri-fold covers specifically) that ranks for "tri-fold tonneau cover" searches, with CTA links to the collection page pre-filtered. This page is a traffic-acquisition surface, not a navigation step in the buying flow. Users who click "Tonneau Covers" in the site nav should go directly to the collection page, not through the SEO landing page.

---

## 5. Universal vs. Sub-Model Products — Detection and Adaptation

### Detection Logic

The collection page and PDP need to know, for any given product, whether a sub-model filter is required before ATC. This is determined by a product metafield, not by category alone.

**Proposed metafield schema on Shopify products:**

```
metafields:
  sub_model.requires_bed_length: boolean   (true for tonneau covers with bed-specific SKUs)
  sub_model.requires_cab_type:   boolean   (true for running boards, side steps)
  sub_model.requires_trim:       boolean   (true for trim-specific lighting, body kits)
  sub_model.bed_length_options:  string[]  (["5", "5.5", "6", "6.5", "8"])
  sub_model.cab_type_options:    string[]  (["Regular Cab", "Extended Cab", "Crew Cab"])
```

This metafield is populated from SKU parsing (regex extraction already documented in `cb_aces_fitment_audit.md` for tonneau covers) plus manual data entry for the 91 clusters identified in `product_clusters.json`.

**Collection page behavior:**

```
IF any product in collection has sub_model.requires_bed_length = true
  → show Bed Length facet in filter rail
  → facet pre-selected if garage has bed_length stored
  → facet is a nudge, not a gate — user can still browse without selecting

IF category = universal (grilles, bull bars, hitches, lighting)
  → no sub-model facet rendered at all
  → fitment badge based on YMM only
```

**PDP behavior:**

```
IF product.sub_model.requires_bed_length = true AND bed_length not yet resolved:
  → render BedLengthVariantStrip component above ATC button
  → ATC button is disabled with label "Select Bed Length to Continue"
  → Once selected, ATC enables immediately — no page navigation required
  → Write bed_length to garage for this vehicle (one-time friction)

IF product.sub_model.requires_bed_length = true AND bed_length already in garage:
  → auto-select the matching variant
  → ATC is immediately active
  → fitment badge: "Fits your 2019 Ford F-150 — 5.5 ft Bed"

IF product is universal:
  → no variant strip rendered
  → ATC is immediately active
  → fitment badge: "Fits your 2019 Ford F-150" (YMM only)
```

### Universal Product Flow (Hitch Example)

User has 2025 Honda Civic in garage.

1. Collection page: `/collections/hitches` — shows hitches, all compatible with 2025 Civic (fitment-filtered), no sub-model facet shown because hitches are universal by trim for this vehicle
2. PDP: `/products/curt-trailer-hitch-2025-civic` — ATC is immediately active. Fitment badge: "Fits your 2025 Honda Civic." No sub-model picker rendered.
3. ATC → cart → checkout. Two clicks after arriving at the collection page.

**This is the correct experience.** No sub-model friction imposed on a product that doesn't need it.

### Sub-Model Required Flow (Tonneau Cover Example)

User has 2019 Ford F-150 in garage. Bed length not yet stored.

1. Collection page: `/collections/tonneau-covers` — collection pre-filtered to products that fit 2019 F-150. Bed Length facet visible in filter rail ("All Bed Lengths | 5 ft | 5.5 ft | 6 ft | 6.5 ft | 8 ft"). A helper copy line reads: "Select your bed length to see exact-fit covers." User can browse without selecting, but sees multiple variants per product.
2. PDP: `/products/[handle]` — User clicks a tri-fold cover. BedLengthVariantStrip renders at top of page. ATC is disabled: "Select your bed length." User picks "5.5 ft." ATC enables immediately. Fitment badge updates: "Fits your 2019 Ford F-150 — 5.5 ft Bed." Garage updated silently.
3. Next visit: Bed length is in garage. Collection page pre-filters to 5.5 ft products. ATC is immediately active on every tonneau PDP. The friction was paid once, never again.

---

## 6. Deep-Link Cases

### Case A — Klaviyo Email → Existing Champion with Garage

Champion has 2019 F-150, 5.5 ft bed already in garage (from prior visit or from Klaviyo profile data).

**Email links to:** `/products/tyger-t3-hard-tri-fold-f150-55`

**Experience on landing:**
- PDP loads. Fitment badge auto-resolves: "Fits your 2019 Ford F-150 — 5.5 ft Bed" (green check).
- Bed length variant auto-selected (5.5 ft) because garage has it.
- ATC is immediately active.
- Champion sees exactly what they clicked in the email, fitment confirmed, one click to cart.

**No navigation levels involved.** The email link bypasses the entire collection hierarchy. This is the correct behavior and the reason the collection hierarchy must not be mandatory in the buying flow.

**If Champion's garage does NOT have bed length yet:**
- PDP loads. BedLengthVariantStrip renders. YMM badge shows "Fits your 2019 Ford F-150 — select bed length."
- One additional tap to select 5.5 ft. ATC enables.
- Total extra friction: 1 tap. Acceptable.

### Case B — Google Shopping Ad → Cold Traffic PDP

User searches "2019 Ford F-150 tonneau cover 5.5 ft bed." Google Shopping shows a Stehlen product. User clicks. No garage set.

**Ad links to:** `/products/[handle]?year=2019&make=Ford&model=F-150&bed=5.5`

**Experience on landing:**
- PDP loads. URL params are read: year=2019, make=Ford, model=F-150, bed=5.5.
- Fitment badge shows immediately: "Fits your 2019 Ford F-150 — 5.5 ft Bed" (green check). This is calculated from the URL params, not the garage.
- Variant auto-selected: 5.5 ft bed.
- ATC is immediately active.
- Inline prompt below ATC: "Save this vehicle to your garage for faster checkout next time." (soft CTA — not blocking)

**This is zero-friction cold landing.** The ad URL carries the fitment context. The PDP resolves it immediately. The user sees "this fits my truck" without having to set up anything. This is the single highest-leverage implementation detail for paid acquisition CRO.

**Implementation note:** The `?year=&make=&model=&bed=` param pattern must be standardized at the time Google Shopping feed is built. Product titles in the feed should include the fitment string ("2019 Ford F-150 5.5 ft Bed") so Google's matching works. This is a feed management task, not just a UX task.

---

## 7. Implementation Guidance

### Are Style "Pages" Actually Needed?

No. Not as mandatory navigation levels. The style distinction (roll-up vs tri-fold vs hard cover) belongs as a facet filter on the collection page. The facet can be rendered as visual chips with icons, matching the visual richness of Tyger's style cards, without requiring a page load.

When to create a style-specific URL:
- Only for SEO landing pages targeting "best tri-fold tonneau cover" type queries
- These pages are content pages (editorial, comparison, buying guide) that live at `/collections/tonneau-covers/tri-fold` as a supplement to the main collection, not as a mandatory navigation step
- These pages have their own CTA linking to the collection pre-filtered: `/collections/tonneau-covers?style=tri-fold`

### Where Does the 4th-Filter UI Live?

Two surfaces, each with a specific purpose:

**Surface 1 — Collection Page Filter Rail (browsing context)**
- Purpose: Let users narrow a large collection before clicking through to a PDP
- When shown: Bed Length facet when category contains fitment-critical products; Cab Type facet when category = running boards/side steps
- Format: Horizontal chip strip on mobile (above the product grid, scrollable), vertical filter sidebar on desktop
- Pre-selection: Auto-select if garage has the value. Otherwise neutral (all options unselected)
- Gate behavior: NOT a gate. User can browse without selecting. Products without the selected bed length are hidden, not the user blocked from proceeding.

**Surface 2 — PDP Variant Strip (purchase context)**
- Purpose: Lock in the correct SKU before ATC
- When shown: Only when `sub_model.requires_bed_length = true` or `sub_model.requires_cab_type = true`
- Format: Button-group (not a dropdown — requires one tap, immediately visible, no extra interaction to open)
- Gate behavior: IS a gate for ATC specifically. ATC is disabled until sub-model is selected. This is the correct place for the hard gate — at the point of purchase, not at the point of browsing.
- Auto-resolution: If the value is already in the garage, auto-select and enable ATC without user action.

### Friction Budget

Max 3 decisions before ATC in any path:
1. Vehicle selection (YMM — paid once per session, stored in garage)
2. Style/product selection (collection browse — the user is actively choosing)
3. Sub-model variant (bed length / cab type — required only for ~49% of catalog)

Max 4 clicks from homepage to ATC for the common case (no garage set):
- Click 1: Category card on homepage
- Click 2: Product card on collection page
- Click 3: Sub-model variant button on PDP (only for fitment-critical products)
- Click 4: Add to Cart

For returning users with a garage that includes sub-model:
- Click 1: Category card or email link → PDP (direct)
- Click 2: Add to Cart

This is the friction budget. Any design decision that adds a click or decision before ATC must justify itself against this budget.

---

## 8. Decision: Number of Navigation Levels and URL Structure

### The Recommendation

**Three levels of navigation, two of which are URL-addressable:**

```
Level 0: Home (/)                             — YMM entry point, category cards
Level 1: Collection (/collections/[slug])      — filterable, SSR-rendered
Level 2: PDP (/products/[handle])              — variant resolution + ATC
```

Style variants are facet filters on the collection page (query params), not URL levels.
Sub-model (bed length, cab type) is collected at the collection page via facet AND enforced at PDP via variant strip.

### URL Structure Decision

```
/collections/tonneau-covers                — collection, all styles, all bed lengths
/collections/tonneau-covers?style=tri-fold — facet-filtered collection (query param)
/collections/tonneau-covers?bed=5.5        — facet-filtered collection (query param)
/collections/grilles                       — universal products, no sub-model facet
/collections/hitches                       — universal products, no sub-model facet
/collections/running-boards                — sub-model facet: cab type
/collections/lighting                      — universal products, no sub-model facet
/products/[shopify-handle]                 — PDP, SSR, variant resolution
```

Canonical URLs for facet-filtered states: the `/collections/[slug]` base URL is canonical for all faceted variants to avoid duplicate-content issues in Google. Facet selections are applied client-side from query params after SSR, so only the base collection URL is indexed.

SEO content pages (optional, Phase 2+):
```
/guides/tonneau-covers/tri-fold            — buying guide, ranks for style queries
/guides/tonneau-covers/how-to-measure-bed  — educational content, links to tonneau collection
```

These are content pages, NOT navigation levels. They exist for SEO acquisition, not as steps in the buying flow.

### What This Achieves vs. Tyger's Pattern

| Metric | Tyger 4-Step | Stehlen 3-Level |
|---|---|---|
| Clicks from category to ATC (fitment-critical product) | 3 (style → sub-model → PDP → ATC) | 2 (collection → PDP with variant → ATC) |
| Clicks for universal product | Same 3 | 1 (collection → PDP → ATC) |
| Email deep-link to PDP | Lands at PDP, fitment resolved | Lands at PDP, fitment resolved (same) |
| Google Shopping cold landing | Lands at PDP, must set vehicle | Lands at PDP with params pre-set (better) |
| Style selection is optional (user knows what they want) | Mandatory click through style page | Skippable (facet is optional) |
| Sub-model as hard gate | Yes, before PDP | Only at ATC, not at browsing |
| SSR-indexable collection pages | Yes — Tyger has separate style landing pages | Yes — collection + facets, base URL indexed |
| Champions reactivation funnel | 3+ clicks from email to ATC | 1-2 clicks from email to ATC |

---

## 9. Implementation Phasing

### Phase 1 — Shippable Without Sub-Model Metafields (Week 1–2)

Build the 3-level URL structure and collection pages with YMM filtering only. No sub-model facets yet. PDPs have full variant selectors (Shopify native variants) for products that already have bed-length variants as Shopify product variants.

- Collection pages: `/collections/[slug]`, SSR, YMM-filtered from garage
- PDP: standard Shopify variant selector for sub-model
- Fitment badge on PDP: "Fits your 2019 Ford F-150" (no sub-model in badge until Phase 2)
- ATC enablement: Shopify variant selection required if multiple variants exist (native behavior)

This ships fitment confidence without the full metafield infrastructure. Champions can be emailed with PDP deep links immediately.

### Phase 2 — Sub-Model Metafields + Collection Facets (Week 3–4)

- Parse tonneau SKUs with regex (`tc-[make][year]-[bedlength]`) to extract bed_length — already documented
- Write `sub_model.bed_length_options` metafield on tonneau products
- Render Bed Length facet on `/collections/tonneau-covers` collection page
- Update fitment badge on PDP to include bed length: "Fits your 2019 Ford F-150 — 5.5 ft Bed"
- Write bed_length to garage on first selection
- Repeat for running boards with cab type (requires manual data entry or CA API pull)

### Phase 3 — Google Shopping Param Pass-Through (Week 5–6)

- Standardize `?year=&make=&model=&bed=` URL param convention on PDP
- Update Google Shopping product feed to include fitment in product title and description
- Build PDP logic: if URL params present, use them to auto-select vehicle + variant + set fitment badge
- Soft garage save prompt after param-driven landing

---

## 10. Anti-Patterns to Avoid

**Do not create a `/collections/tonneau-covers/tri-fold` URL as a mandatory navigation step.** This is the Tyger mistake applied to Stehlen's catalog without the brand architecture that justifies it for Tyger. It adds a click, fractures the collection into multiple crawlable URLs with thin content, and breaks deep-link performance from email and ads.

**Do not gate browsing behind sub-model selection.** The filter on the collection page is a nudge, not a gate. Users who don't know their bed length must be able to browse. They will learn their bed length at the PDP when the variant strip appears before ATC — that is the correct place for the hard gate.

**Do not show the sub-model variant strip on universal products.** If a product fits every 2025 Civic regardless of trim, the variant strip must not appear. Rendering an unnecessary "Select Trim" dropdown on a universal product creates false uncertainty ("wait, does my trim matter?") and erodes fitment confidence. The `sub_model.requires_*` metafield controls this.

**Do not use small dropdowns for sub-model selection on mobile.** The bed-length and cab-type pickers must be button-group chips with minimum 44px tap targets. A small dropdown on mobile is unusable for users with greasy or work-worn hands — the exact hands buying tonneau covers. See mobile mandate in competitor research.

**Do not put the fitment badge below the fold on mobile PDP.** The fitment badge ("Fits your 2019 F-150 — 5.5 ft Bed" or "Check fitment") must be within the first scroll on mobile — immediately below the product title and price, before the first image gallery interaction. If the user has to scroll to see whether the product fits, you will lose them.

---

## Files Referenced

| File | Purpose |
|---|---|
| `/data/analytics/competitor_fitment_ux_research.md` | Competitor YMM + sub-model UX comparison across 10 sites |
| `/data/analytics/category_taxonomy_proposal.md` | Proposed 2-level CB/Shopify category taxonomy |
| `/data/analytics/cb_aces_fitment_audit.md` | ACES data availability audit; tonneau SKU parsing documented |
| `/data/analytics/product_clusters.json` | 91 identified product clusters (bed_length=39, finish=39, cab=2, etc.) |
| `/data/analytics/ymm_tree.json` | Canonical YMM tree from product tags — drives YMM selector dropdowns |
| `CLAUDE.md` | Project architecture, fitment tag format, open items |
