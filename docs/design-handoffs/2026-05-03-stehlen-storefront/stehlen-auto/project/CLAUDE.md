# Stehlen Auto Storefront — Project Context

**Brand:** Stehlen Auto (heavy-duty truck/SUV/Jeep accessories — bolt-on, no drilling, fitment-guaranteed). Logo at `assets/stehlen-logo.png`.

**Reference / inspiration:** `uploads/tygerauto_structural_spec.md` (competitor TygerAuto — used for conversion patterns, NOT for branding).

## Output
Single prototype: **`Stehlen Storefront.html`** — React + Babel via inline JSX scripts.

## Funnel
`Home → Category landing → Sub-type Collection → PDP → Cart drawer`

## File map
- `app.jsx` — router shell, Tweaks panel, page state. EDITMODE block holds page/categorySlug/subtypeCode/etc.
- `data.jsx` — single `window.STEHLEN_DATA` blob: CATEGORIES, PRODUCTS, CATEGORY_SUBTYPES, etc.
- `styles.css` — tokens (`--c-accent` yellow, `--c-bg` dark, `--f-display`, `--f-mono`)
- `ui.jsx` — primitives (`window.STEHLEN_UI`: I icons, Stars, TrustRow)
- `chrome.jsx` — Header/Footer/Announcement (`window.STEHLEN_CHROME`)
- `overlays.jsx` — YMMSelector, CartDrawer, SearchOverlay (`window.STEHLEN_OVERLAYS`)
- `product-card.jsx` — `window.ProductCard`
- `page-home.jsx` — Hero (image left, copy right), yellow YMM band, best sellers, categories, popular vehicles
- `page-category.jsx` — Buying-guide landing (sub-type cards, FAQ, related)
- `page-collection.jsx` — Sub-type-aware: full-bleed hero + yellow YMM band when `subtypeCode` set
- `page-pdp.jsx` — PDP
- `page-states.jsx` — empty/loading/error canvas
- `tweaks-panel.jsx` — globals: useTweaks, TweaksPanel, TweakSection/Radio/Select/Toggle/Button

## Design language
Industrial monochrome + single yellow accent. Cold-rolled-steel feel. Mono + display type. **No AI tropes** (no gradient soup, no emoji, no left-border accent cards). Yellow YMM band is the conversion mechanic, mirrored from Tyger.

## Navigation API
`onNav(page, { categorySlug, subtypeCode })` — opts persist via `setTweak`.

## Asset library (`assets/`)
- `hero-stehlen.jpg` (desert truck, STEHLEN cutout)
- `tonneau-lock-roll-up.jpg`, `tonneau-hidden-snap.jpg`, `tonneau-flash-roll-up.jpg`
- `bumper-modular.jpg`, `bumper-steel.jpg`
- `product-roof-rack.webp`, `product-grille.webp`, `product-bed-lights.webp`
- `stehlen-logo.png`

## Categories with sub-types built out
- `roof-racks` (S1–S4)
- `tonneau-covers` (T1 Lock & Roll-Up, T2 Hidden Snap, T3 Flash Roll-Up w/ Lock)
- `bumpers` (B1 Modular, B2 Full-Width Steel)
- `grilles` (G1–G3)

## Stakeholder rules (Ricky)
- **Don't disclose product/fitment counts** in copy ("1,322 active fitments", "142 PARTS" etc — avoid)
- **No "FEATURED" labels** on hero
- **Match existing stehlenauto.com structure** where possible (hero composition, "BUILT TOUGH. BOLT ON. DRIVE OFF.")
- **Borrow from Tyger** for conversion (yellow YMM band, sub-type buying-guide pages, sub-type-contextualized collection pages)

## Tweaks
Page picker: home / category / collection / pdp / states. Category + subtype selectors appear when relevant. Accent color, density, YMM style, fitment style, viewport (desktop/mobile).
