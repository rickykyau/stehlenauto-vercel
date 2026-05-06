# Shopify Storefront API probe (cycle 3 follow-up)

Run: 2026-05-03T15:33:12.323Z
Domain: http-stehlenauto-com.myshopify.com
API: 2026-04

## Headline reconcile

| Source | Product count |
| --- | --- |
| Admin API `productsCount` (all) | 1322 |
| Admin API `publishedOnline` (Online Store sales channel) | 8 |
| **Storefront API (what our Next.js app sees)** | **1322** |
| Storefront-side availableForSale = false | 190 |

## What this means

The Storefront API surfaces **1322** products — far more than the 8 published to "Online Store". That means the Storefront token is bound to a **different sales channel** (likely "Headless" or a custom channel), and 1,314+ products are correctly flagged for it.

**Conclusion:** Mike was not seeing phantom products. Our storefront genuinely has ~1322 live products to render against. The cycle-1 "catalog gap" diagnosis was wrong — what we have is a fitment-display gap.

## Collections (Storefront-visible)

Total: 36

| Handle | Title | Has products? |
| --- | --- | --- |
| toyota-parts | Toyota Parts | ≥2 |
| ford-parts | Ford Parts | ≥2 |
| chevy-parts | Chevy Parts | ≥2 |
| gmc-parts | GMC Parts | ≥2 |
| dodge-parts | Dodge Parts | ≥2 |
| acura-parts | Acura Parts | ≥2 |
| audi-parts | Audi Parts | ≥2 |
| buick-parts | Buick Parts | ≥2 |
| chrysler-parts | Chrysler Parts | ≥2 |
| honda-parts | Honda Parts | ≥2 |
| hyundai-parts | Hyundai Parts | ≥2 |
| infiniti-parts | Infiniti Parts | ≥2 |
| jeep-parts | Jeep Parts | ≥2 |
| kia-parts | Kia Parts | ≥2 |
| lexus-parts | Lexus Parts | ≥2 |
| lincoln-parts | Lincoln Parts | ≥2 |
| mazda-parts | Mazda Parts | ≥2 |
| mercedes-benz-parts | Mercedes-Benz Parts | ≥2 |
| nissan-parts | Nissan Parts | ≥2 |
| pontiac-parts | Pontiac Parts | ≥2 |
| saturn-parts | Saturn Parts | ≥2 |
| subaru-parts | Subaru Parts | ≥2 |
| volkswagen-parts | VW Parts | ≥2 |
| bull-guards-grille-guards | Bull Guards & Grille Guards | ≥2 |
| tonneau-covers | Tonneau Covers | ≥2 |
| trailer-hitches | Trailer Hitches | ≥2 |
| front-grilles | Front Grilles | ≥2 |
| headlights | Headlights | ≥2 |
| truck-bed-mats | Truck Bed Mats | ≥2 |
| floor-mats | Floor Mats | ≥2 |
| running-boards-side-steps | Running Boards & Side Steps | ≥2 |
| roof-racks-baskets | Roof Racks & Baskets | ≥2 |
| chase-racks-sport-bars | Chase Racks & Sport Bars | ≥2 |
| molle-panels | MOLLE Panels | ≥2 |
| under-seat-storage | Under Seat Storage | ≥2 |
| mercury-parts | Mercury Parts | 1 |

## Top productTypes (Storefront view)

| productType | Count |
| --- | --- |
| trailer hitch kit | 257 |
| front grille | 166 |
| headlights - led crystal style | 146 |
| tonneau cover - lock & roll up | 136 |
| truck bed mat - rubber | 133 |
| tonneau cover - tri-fold | 122 |
| bull guard - advance series w/skid plate | 111 |
| bull guard - advance series w/led light bar | 74 |
| running boards | 50 |
| floor mats - rubber | 39 |
| trailer hitch | 29 |
| tonneau cover - hidden snap | 29 |
| headlights - projector | 14 |
| roof rack | 4 |
| chase rack/sport bar | 3 |
| roof basket | 3 |
| molle panels - truck bed | 2 |
| Grille Guard / Bull Bar | 1 |
| running boards - modular steel | 1 |
| under seat storage | 1 |
| under seat storage organizer | 1 |

## Top vendors (Storefront view)

| Vendor | Count |
| --- | --- |
| Stehlen Auto | 144 |
| CURT | 137 |
| Generic | 126 |
| BGHD | 67 |
| TBM | 62 |
| FGGG | 44 |
| JDMA | 43 |
| Tonneau Cover | 41 |
| Spec-D | 39 |
| Spec-D Tuning | 38 |
| Aftermarket | 29 |
| Advanced Series | 26 |
| AA Products | 21 |
| Torklift | 19 |
| Bull Guard | 19 |

## Stehlen-branded products: **154**

These are the SKUs Stehlen manufactures vs resells from CURT / Spec-D / etc. Likely the highest-margin and most-defensible part of the catalog.

## Mapping our chrome to real Shopify collections

| Our chrome slug | Matching Shopify collection | Product count |
| --- | --- | --- |
| roof-racks | roof-racks-baskets (fuzzy) | ≥2 |
| grilles | front-grilles (fuzzy) | ≥2 |
| bed-lights | truck-bed-mats (fuzzy) | ≥2 |
| bumpers | **NO MATCH** | 0 |
| fender-flares | **NO MATCH** | 0 |
| running-boards | running-boards-side-steps (fuzzy) | ≥2 |
| tonneau-covers | tonneau-covers ✓ | ≥2 |
| hitches | trailer-hitches (fuzzy) | ≥2 |
| bed-mats | truck-bed-mats (fuzzy) | ≥2 |
| sport-bars | chase-racks-sport-bars (fuzzy) | ≥2 |
| tail-lights | **NO MATCH** | 0 |
| recovery | **NO MATCH** | 0 |

## Files written

- shopify-storefront-probe.md (this report)
- shopify-storefront-products.csv (full dump, 1322 rows)
- shopify-storefront-collections.csv (36 rows)