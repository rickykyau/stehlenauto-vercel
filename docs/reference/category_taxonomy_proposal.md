# Category Taxonomy Proposal — Stehlen Auto
**Generated:** 2026-04-23  
**Author:** CB Database analysis (Sam Ortega)  
**Status:** PROPOSAL — read-only research, no data modified

---

## Live Data Verification (2026-04-23)

**Connection:** `10.8.33.11` (IP substituted for `jl-sql`) → `JLDataMart` → SUCCESS  
**Column names confirmed:** `ParentCategory` (nvarchar), `CategoryCode` (nvarchar), `ItemStatus` (varchar)  
**Queries run against:** `dbo.vCbInventoryMaster`

### Live ParentCategory Distribution — `ItemStatus = 'list'` (active catalog)

| ParentCategory | Live SKU Count |
|---|---:|
| LIGHTING | 5,505 |
| (NULL) | 5,147 |
| OFF ROAD ACCESSORIES | 1,950 |
| EXTERIOR ACCESSORIES | 1,217 |
| INTERIOR ACCESSORIES | 272 |
| AERODYNAMICS | 135 |
| BRAND ACCESSORIES | 14 |
| CLEARANCE | 14 |
| JK ACCESSORIES | 10 |
| SPARE PARTS | 9 |
| **Total listed** | **14,273** |

> **Note:** The `14,273` listed SKU count is radically larger than the `~1,322` Shopify active
> product count. The JLDataMart `vCbInventoryMaster` includes ALL CB items ever listed, including
> variations, bundle/combo SKUs, and historical items that may no longer be on Shopify. The Shopify
> `1,322` figure reflects deduplicated, actively synced products only. The CB `ItemStatus = 'list'`
> filter is not equivalent to "live on Shopify."

### Live 2-Level Tree — `ItemStatus = 'list'`

```
(NULL) — 5,147 SKUs with no ParentCategory assigned
  └── (NULL CategoryCode) — 5,147

AERODYNAMICS — 135 SKUs
  ├── Combo - window visor         134
  └── BUMPER LIP KIT                 1

BRAND ACCESSORIES — 14 SKUs
  ├── armordillo hoodie              4
  ├── armordillo tee                 4
  ├── BRAND ACCESSORIES              4
  ├── armordillo torch               1
  └── armordillo spork               1

CLEARANCE — 14 SKUs
  └── CLEARANCE                     14

EXTERIOR ACCESSORIES — 1,217 SKUs
  ├── Combo - front grill          244
  ├── front grill                  154
  ├── window visor                 100
  ├── Combo - tonneau tri fold hard (lightweight)  68
  ├── Combo - tonneau low profile solid hard tri fold  58
  ├── Combo - tonneau cover - hidden snap           56
  ├── Combo - tonneau cover - lock & roll up        55
  ├── tonneau cover - lock & roll up                53
  ├── tonneau cover - low profile solid hard tri fold 53
  ├── Combo - tonneau cover - tri fold              52
  ├── Combo - tonneau cover - tri fold hard cover   46
  ├── Combo - roof rack - universal                 39
  ├── Combo - tonneau cover - flash roll up w/lock  38
  ├── Combo - tonneau cover - low profile hard roll up 36
  ├── TRUCK BED TOPPER - INFLATABLE                 35
  ├── TONNEAU COVER - HIDDEN SNAP                   18
  ├── Combo - steel bumper - modular style          17
  ├── Combo - chase rack/sport bar                  17
  ├── emblems                                       15
  ├── Combo - tonneau cover - retractable roll up   15
  ├── chase rack/sport bar                          14
  ├── ROOF RACK - APP                                8
  ├── Combo - roof rack - app                        7
  ├── Combo - tonneau cover - low profile solid hard tri  6
  ├── Combo - steel bumper                           4
  ├── Bumper guard                                   4
  ├── Combo - emblems                                3
  ├── STEEL BUMPER - EX                              1
  └── Combo - tonneau tri fold hard (lightweight)C   1

INTERIOR ACCESSORIES — 272 SKUs
  ├── truck bed mat - rubber        128
  ├── truck bed mat - foam           52
  ├── Combo - racing seats           46
  ├── Combo - lighter 12v - led      22
  ├── Combo - racing seats - office chair  10
  ├── Combo - floor mats - rubber     6
  ├── Combo - shifter - boot          4
  ├── Combo - console organizer       2
  ├── shifter - boot                  1
  └── racing seats - office chair     1

JK ACCESSORIES — 10 SKUs
  ├── STEEL BUMPER - JK              9
  └── JK ACCESSORIES                 1

LIGHTING — 5,505 SKUs
  ├── Combo - headlights - oem crystal style   2,700
  ├── Combo - headlights - projector           1,383
  ├── Combo - headlights - led crystal style     220
  ├── Combo - fog lights - app style             205
  ├── Combo - light mount                        125
  ├── Combo - headlights - full led projector    105
  ├── Combo - headlights - universal             100
  ├── Combo - fog lights - oem style              95
  ├── Combo - signal lights - bumper              95
  ├── Combo - signal lights - corner              69
  ├── HEADLIGHTS - LED CRYSTAL STYLE              61
  ├── headlights - projector                      47
  ├── Combo - hid kit                             41
  ├── signal lights - bumper                      36
  ├── tail lights - altezza                       31
  ├── Combo - headlights - universal - proj       31
  ├── Combo - tail lights - led                   30
  ├── Combo - signal lights - side marker         25
  ├── signal lights - corner                      25
  ├── headlights - full led projector             16
  ├── headlights - oem crystal style              14
  ├── Combo - headlights - universal - crystal    14
  ├── Combo - fog lights - universal style         9
  ├── signal lights - side marker                  8
  ├── fog lights - universal style                 7
  ├── Combo - tail lights - altezza                4
  ├── Combo - light bulbs - xenon                  3
  ├── Tail Lights - OEM Style                      3
  ├── fog lights - oem style                       2
  └── truck bed lights - led                       1

OFF ROAD ACCESSORIES — 1,950 SKUs
  ├── Combo - bull guard - w/skid plate           460
  ├── Combo - trailer hitches                     267
  ├── Combo - bull guard - w/studded mesh skid plate  185
  ├── TRAILER HITCHES                             178
  ├── Combo - grill guard                         164
  ├── Combo - bull guard - advance series w/skid plate  129
  ├── Combo - side step bars - drop step (aluminum)  102
  ├── Combo - bull guard - advance series w/led lightbar  100
  ├── Combo - running board - app                  94
  ├── running board - app                          51
  ├── GRILL GUARD                                  29
  ├── bull guard - advance series w/skid plate     28
  ├── bull guard - advance series w/led light bar  27
  ├── bull guard - w/studded mesh skid plate       27
  ├── Combo - side step bars - drop step           26
  ├── Combo - bull guard                           25
  ├── bull guard - avt series                      19
  ├── trailer hitches - wire                       11
  ├── HITCH STEP                                    6
  ├── Combo - fender flare                          4
  ├── Combo - side step bars - 3"                   3
  ├── molle panels - truck bed                      3
  ├── side step bars - 4"                           3
  ├── side step bars - rock slider                  3
  ├── Combo - truck bed rail                        2
  ├── Combo - side step bars - 4"                   2
  └── BULL GUARD                                    2

SPARE PARTS — 9 SKUs
  └── parts                                         9
```

### Key Discrepancies vs. Earlier Proposal

| Issue | Earlier Proposal (estimated) | Live Data | Delta / Action |
|---|---|---|---|
| **Total listed SKU count** | ~1,322 | 14,273 | ⚠️ CB has 14,273 `list` items; Shopify syncs only 1,322. Filter must use Shopify product list or a CB↔Shopify join, NOT raw `ItemStatus='list'` |
| **LIGHTING dominates** | Estimated as 3rd largest (59K invoiced lines) | **5,505 listed SKUs — largest by far** | Proposal ranked EXTERIOR first; live data shows LIGHTING is the biggest raw catalog category |
| **NULL ParentCategory** | Estimated ~2,043 lines / ~30 SKUs | **5,147 listed SKUs with NULL** | Massively under-estimated — 36% of listed catalog has no category at all; this is a data quality crisis |
| **AERODYNAMICS content** | Spoilers, air dams | Live: **Window visors (134 SKUs)** + BUMPER LIP KIT (1) | Window visors are miscategorized under AERODYNAMICS, not EXTERIOR ACCESSORIES |
| **INTERIOR ACCESSORIES content** | Floor mats, under seat storage | Live: **truck bed mats (180 SKUs), racing seats (57 SKUs), 12v lighters (22 SKUs)** | Truck bed mats are under INTERIOR, not EXTERIOR. Racing seats and lighters are unexpected categories entirely |
| **JK ACCESSORIES** | Not in proposal at all | **10 listed SKUs** (Jeep JK steel bumpers) | New category discovered — Jeep-specific products exist in catalog |
| **OFF ROAD — Combo SKUs dominant** | Proposal used raw CategoryCode counts | `Combo - bull guard - w/skid plate` = 460 SKUs alone | "Combo" prefix SKUs are bundle variants; counts are ~3-5x higher than bare SKU estimates in proposal |
| **EXTERIOR — Roof rack present** | Listed under OFF ROAD ACCESSORIES | `Combo - roof rack - universal` (39 SKUs) under EXTERIOR | Roof racks split across both EXTERIOR and OFF ROAD |
| **Steel bumpers present** | Not in proposal | `Combo - steel bumper - modular style` (17), `STEEL BUMPER - EX` (1), `STEEL BUMPER - JK` (9) | Steel bumpers exist across EXTERIOR and JK ACCESSORIES — uncounted in original proposal |
| **Side step bars** | Not mentioned | 102+26+3+2 = 133 Combo SKUs + 3 bare = ~136 | Side step bars are a significant category; proposal only counted "running boards" |
| **Trailer hitches** | Proposal: 258+29 = 287 SKUs | Live: 267+178+11 = 456 Combo/bare/wire SKUs | Much larger than estimated; largest single OFF ROAD subcategory |
| **CLEARANCE** | Estimated ~20 SKUs with `ItemStatus=list` | Only 14 listed; plus 1,505 with `ItemStatus=clearance` | CB uses a separate `clearance` ItemStatus, so CLEARANCE as a ParentCategory is largely redundant |

### Revised Total Remap Count Estimate

The earlier estimate of ~1,220 SKUs needing remapping was based on the Shopify-visible 1,322 products.
Against the full CB `list` catalog of 14,273 items, the scope is:

| Remap Category | Estimated SKUs |
|---|---:|
| NULL ParentCategory — need assignment | 5,147 |
| AERODYNAMICS (window visors miscategorized) | 135 |
| INTERIOR ACCESSORIES (bed mats, racing seats — likely mislabeled) | 272 |
| CLEARANCE (reclassify 14 listed items to product category) | 14 |
| JK ACCESSORIES (evaluate: Jeep-specific or retire) | 10 |
| BRAND ACCESSORIES (non-product; hide from browse) | 14 |
| SPARE PARTS (internal; hide from browse) | 9 |
| **Subtotal needing action** | **~5,601** |
| LIGHTING / OFF ROAD / EXTERIOR (CategoryCode cleanup within parent) | ~8,672 |
| **Grand total listed SKUs** | **14,273** |

> Practical recommendation: Scope the remap to the **1,322 Shopify-synced products only** and join
> `vCbInventoryMaster` on `ItemCode` to Shopify's product list. Remapping all 14,273 CB items would
> include thousands of discontinued/non-Shopify SKUs and is not worth the effort.

---

## Connection Note

The JLDataMart SQL Server (`jl-sql`) requires VPN. VPN was not active during this session,
so `vCbInventoryMaster` could not be queried live. All counts and values below are derived
from three previously-captured artifacts that contain the authoritative category data:

| Source | How captured | What it provides |
|---|---|---|
| `data/analytics/02_profitability_by_category_20260323_1102.csv` | March 23 2026 live query via `vJLCInvoice LEFT JOIN vCbInventoryMaster` | ParentCategory counts (all items with sales history) |
| `data/analytics/cb_volume_report.txt` | March 23 2026 schema explorer | vCbInventoryMaster TOP-5 sample; vCaItemSummary with ParentCategory + CategoryCode; shopify.vInventoryItem with ParentCategory + CategoryCode |
| `data/analytics/shopify_products_raw.json` | Shopify Admin API pull (1,330 products) | product_type + category: tags — these mirror CB CategoryCode exactly via the ProductStaging sync |

The SQL to re-run when VPN is available is at the bottom of this document.

---

## 1. Current ParentCategory — All Items (Count Desc)

Source: `02_profitability_by_category` (line_items = invoiced lines, proxy for SKU count).  
ParentCategory is set on the item master in CB; the profitability query groups by it.

| ParentCategory | Line Items (invoiced) | Notes |
|---|---:|---|
| EXTERIOR ACCESSORIES | 195,371 | Largest category by far |
| OFF ROAD ACCESSORIES | 110,180 | Second largest |
| LIGHTING | 59,580 | Third |
| INTERIOR ACCESSORIES | 27,532 | Fourth |
| Unknown | 2,043 | Items with NULL or blank ParentCategory |
| CLEARANCE | 1,854 | Not a product category — a sales status |
| AERODYNAMICS | 679 | Tiny; likely misclassified or outdated |
| SPARE PARTS | 1,391 | Internal/operational, not customer-facing |
| BRAND ACCESSORIES | 34 | Near-zero — orphan category |
| PERFORMANCE | 1 | Single item — effectively orphan |

**Total active catalog:** ~1,322 SKUs (Shopify). The line-item counts above reflect
historical sales depth, not unique SKU counts. SKU distribution roughly mirrors sales weight.

---

## 2. Current CategoryCode — By ParentCategory (Count Desc)

Source: vCaItemSummary sample (cb_volume_report.txt), shopify.vInventoryItem sample,
and Shopify product_type field (which is written from CB CategoryCode via ProductStaging).

### EXTERIOR ACCESSORIES

| CategoryCode (CB) | Shopify product_type | SKU count | Notes |
|---|---|---:|---|
| front grill | front grille | 167 | Confirmed in vInventoryItem sample |
| tonneau cover - lock & roll up | tonneau cover - lock & roll up | 136 | No category: tag |
| tonneau cover - tri-fold | tonneau cover - tri-fold | 122 | No category: tag |
| truck bed mat - rubber | truck bed mat - rubber | 133 | No category: tag |
| tonneau cover - hidden snap | tonneau cover - hidden snap | 29 | No category: tag |
| antenna - universal | (none on Shopify) | ~1 | Discontinued item |
| fender flares | (inferred from handles) | ~30 | CRJZ-TIRE prefix items |
| window visors | (inferred from handles) | ~15 | VS- prefix items |
| spoilers | (inferred from handles) | ~10 | SP- prefix items |

*Note: The "front grill" vs "front grille" discrepancy — CB uses "grill", Shopify product_type
uses "grille". Neither matches industry standard.*

### OFF ROAD ACCESSORIES

| CategoryCode (CB) | Shopify product_type | SKU count | Notes |
|---|---|---:|---|
| bull guard - advance series w/led light bar | bull guard - advance series w/led light bar | 77 | Confirmed in ProductStaging |
| bull guard - advance series w/skid plate | bull guard - advance series w/skid plate | 113 | Confirmed in ProductStaging |
| running boards | running boards | 50 | Only 1 has category: tag |
| floor mats - rubber | floor mats - rubber | 39 | No category: tag |
| trailer hitch kit | trailer hitch kit | 258 | Largest CategoryCode by SKU count |
| trailer hitch | trailer hitch | 29 | Bare hitches (no wiring/ball mount) |
| roof rack | roof rack | 4 | |
| roof basket | roof basket | 3 | |
| chase rack/sport bar | chase rack/sport bar | 3 | |
| molle panels - truck bed | molle panels - truck bed | 2 | |
| skid plate | (inferred from item names) | ~20 | OSB- prefix items |

### LIGHTING

| CategoryCode (CB) | Shopify product_type | SKU count | Notes |
|---|---|---:|---|
| headlights - led crystal style | headlights - led crystal style | 146 | HLNB-/HLPLNB- prefix |
| headlights - projector | headlights - projector | 15 | |
| led light bar | (inferred) | ~30 | FLBW- / FLKC- prefix items |
| fog lights | (inferred) | ~20 | FG- items in lighting |

### INTERIOR ACCESSORIES

| CategoryCode (CB) | Shopify product_type | SKU count | Notes |
|---|---|---:|---|
| floor mats - rubber | floor mats - rubber | 39 | ALSO appears under OFF ROAD — overlap |
| under seat storage | under seat storage | 2 | |
| under seat storage organizer | under seat storage organizer | 1 | Slight naming variant of above |

### AERODYNAMICS

| CategoryCode (CB) | SKU count | Notes |
|---|---:|---|
| spoiler / rear spoiler | ~10 | SP- prefix items |
| air dam / front air dam | ~5 | AD- prefix items |

### CLEARANCE

Not a real category — this is a sales promotion classification stored incorrectly as a ParentCategory
in CB. Items tagged CLEARANCE are real products that also belong to one of the above categories.

### SPARE PARTS / BRAND ACCESSORIES / PERFORMANCE

Internal/operational categories. Only 1,426 total historical lines combined. Not customer-facing.

---

## 3. Two-Level Tree: Current State

```
EXTERIOR ACCESSORIES
├── front grill                          (167 SKUs)
├── tonneau cover - lock & roll up       (136 SKUs)
├── truck bed mat - rubber               (133 SKUs)
├── tonneau cover - tri-fold             (122 SKUs)
├── tonneau cover - hidden snap           (29 SKUs)
├── fender flares                         (~30 SKUs)
├── window visors                         (~15 SKUs)
├── spoilers                              (~10 SKUs)
└── antenna - universal                    (~1 SKU, discontinued)

OFF ROAD ACCESSORIES
├── trailer hitch kit                    (258 SKUs)
├── bull guard - advance series w/skid plate (113 SKUs)
├── bull guard - advance series w/led light bar (77 SKUs)
├── running boards                        (50 SKUs)
├── floor mats - rubber                   (39 SKUs)  ← ALSO in INTERIOR
├── skid plate                            (~20 SKUs)
├── trailer hitch                         (29 SKUs)
├── roof rack                              (4 SKUs)
├── roof basket                            (3 SKUs)
├── chase rack/sport bar                   (3 SKUs)
└── molle panels - truck bed               (2 SKUs)

LIGHTING
├── headlights - led crystal style       (146 SKUs)
├── headlights - projector                (15 SKUs)
├── led light bar                         (~30 SKUs)
└── fog lights                            (~20 SKUs)

INTERIOR ACCESSORIES
├── floor mats - rubber                   (39 SKUs)  ← ALSO in OFF ROAD
├── under seat storage                     (2 SKUs)
└── under seat storage organizer           (1 SKU)   ← DUPLICATE of above

AERODYNAMICS
├── spoiler                               (~10 SKUs)
└── air dam                               (~5 SKUs)

CLEARANCE          ← NOT a product category
SPARE PARTS        ← NOT customer-facing
BRAND ACCESSORIES  ← NOT customer-facing
PERFORMANCE        ← 1 item, orphan
Unknown            ← NULL ParentCategory
```

---

## 4. Issues Flagged Against Industry Standard

### 4.1 Non-Standard Parent Groupings

| Issue | Current | Industry Standard (eBay Motors / Amazon Auto / RealTruck) |
|---|---|---|
| "OFF ROAD ACCESSORIES" contains trailer hitches | Trailer hitches are the #1 SKU category (258 SKUs, ~$14.6M revenue) but buried under "off road" — a term hitches have nothing to do with | Hitches = **Towing** (Amazon: "Towing Products & Winches" / eBay: "Towing Equipment") |
| "EXTERIOR ACCESSORIES" is too broad | 167 grilles + 136 tonneau covers + 133 bed mats + 122 tri-fold tonneaus + 30 fender flares = 600+ SKUs in one bucket | Should split: Grilles, Tonneau Covers, Bed Accessories, Body & Exterior |
| "AERODYNAMICS" is internal jargon | Buyers don't search "aerodynamics" — they search "spoiler" or "splitter" | Merge into "Exterior" or use "Spoilers & Body Kits" |
| "LIGHTING" is correct naming | Matches Amazon Auto and eBay Motors | Keep "Lighting" |
| "INTERIOR ACCESSORIES" is acceptable | Slightly vague | Rename to "Interior" |

### 4.2 Inconsistent CategoryCode Naming

| Problem | Current Values | Should Be |
|---|---|---|
| Grill vs Grille | CB: `front grill`; Shopify: `front grille` | Use "Grille" — industry standard spelling (SEMA, Amazon Auto, RealTruck all use "grille") |
| Tonneau cover sub-types are product specs, not categories | `tonneau cover - lock & roll up`, `tonneau cover - tri-fold`, `tonneau cover - hidden snap` | Parent: `Tonneau Covers`; sub-type in product attributes, not CategoryCode |
| Bull guard naming is a product description, not a category | `bull guard - advance series w/led light bar`, `bull guard - advance series w/skid plate` | Parent: `Bull Guards` (or "Grille Guards & Bull Bars"); variant in product attributes |
| Under seat storage duplication | `under seat storage` AND `under seat storage organizer` | Consolidate to `under seat storage` |
| "Antenna - universal" is an orphan | Single discontinued SKU; the category shouldn't exist for 1 item | Remove or fold into Exterior Accessories |
| Trailer hitch vs trailer hitch kit | Two separate CategoryCodes for what buyers treat as one category | Consolidate to `Trailer Hitches` |
| Floor mats appears in both OFF ROAD and INTERIOR | Unclear which is authoritative | Move entirely to Interior; off road = exterior/mechanical |

### 4.3 Overlapping Categories

| Overlap | Root Cause | Impact |
|---|---|---|
| Floor mats in OFF ROAD + INTERIOR | Items entered inconsistently by different CB users over time | ~39 SKUs may have wrong ParentCategory; affects category browse filtering |
| Spoilers appear in both EXTERIOR ACCESSORIES and AERODYNAMICS | AERODYNAMICS category was never properly populated | ~10-15 SKUs split across two parents; browse shows incomplete results |
| Bull guards appear under OFF ROAD; grille guards appear under EXTERIOR | "Bull guard" and "grille guard" are the same product — brand-specific naming vs generic | Buyer browsing one category misses the other |

### 4.4 Missing Hierarchy / Wrong Roll-Up

| Missing | Why It Matters |
|---|---|
| No "Towing" or "Hitch" parent category | 258 trailer hitch kit SKUs ($14.6M revenue band across channels) are hidden under "Off Road Accessories" — which signals offroad vehicles, not towing to buyers browsing by category |
| No "Bed Accessories" parent | Tonneau covers, bed mats, bed molle panels, chase racks all belong to a "Truck Bed" parent; right now they're scattered across Exterior and Off Road |
| No "Step Bars & Running Boards" as a dedicated parent | Running boards are #4 by Shopify SKU count (50 SKUs) but have no real parent — they're buried in Off Road Accessories |
| CLEARANCE is a promotion tag, not a category | Using it as ParentCategory means clearance items have no real product category; they fall out of category browse filters |

### 4.5 Terms That Don't Match Buyer Search Patterns

| Current Term | Buyer Search Reality | Competitor Usage |
|---|---|---|
| OFF ROAD ACCESSORIES | Buyers search "trailer hitch", "bull bar", "running board" — not "off road accessories" | RealTruck: "Hitches & Towing" + "Steps & Running Boards" + "Bull Bars & Brush Guards" as separate L1 nav items |
| AERODYNAMICS | Zero buyer search volume for this term in automotive accessories context | RealTruck: "Spoilers" / AutoAnything: "Aerodynamics" (they also use this — it's not great) / Amazon: "Spoilers & Wings" |
| EXTERIOR ACCESSORIES | Generic catch-all; zero search intent | Amazon Auto: "Grilles", "Tonneau Covers", "Fender Flares", "Body Kits" as separate categories |
| front grill (CB spelling) | Google/Amazon search data strongly favors "grille" with an 'e' (automotive standard) | RealTruck: "Grilles" / Amazon: "Grilles" / eBay: "Grilles" |
| bull guard - advance series w/led light bar | Too long and product-model specific for a category name | eBay: "Bull Bars & Grille Guards" / Amazon: "Brush Guards & Bull Bars" / RealTruck: "Bull Bars" |

---

## 5. Proposed Cleaned-Up 2-Level Taxonomy

### Design Principles
1. **Align with buyer mental models** — how they search on Google, Amazon, eBay Motors
2. **Match SEMA / eBay Motors / Amazon Automotive taxonomy** at L1
3. **6-10 ParentCategory values** (currently 10 including junk ones)
4. **CategoryCode = product type within parent**, not model-specific descriptions
5. **No duplicate product types across parents**
6. **Separate towing from off-road** — these are different buyer intents

### Proposed 2-Level Tree

```
Grilles & Guards                     ← replaces: EXTERIOR ACCESSORIES (partial)
├── Front Grilles                    (167 SKUs — was "front grill")
├── Bull Bars & Grille Guards        (190 SKUs — was two bull guard CategoryCodes)
└── Bumper Guards                    (future; OSB skid plate bumper combos)

Tonneau Covers & Bed Accessories     ← replaces: EXTERIOR ACCESSORIES (partial)
├── Tonneau Covers                   (287 SKUs — consolidates all 3 sub-types)
├── Truck Bed Mats                   (133 SKUs — was "truck bed mat - rubber")
├── Bed Molle Panels                 (2 SKUs)
└── Cargo Nets & Accessories         (future)

Towing                               ← replaces: OFF ROAD ACCESSORIES (partial)
├── Trailer Hitch Kits               (258 SKUs — was "trailer hitch kit")
└── Trailer Hitches                  (29 SKUs — consolidate with above or keep separate)

Steps & Running Boards               ← replaces: OFF ROAD ACCESSORIES (partial)
├── Running Boards                   (50 SKUs)
└── Nerf Bars                        (future)

Exterior Accessories                 ← replaces: EXTERIOR ACCESSORIES (partial) + AERODYNAMICS
├── Fender Flares                    (~30 SKUs)
├── Window Visors                    (~15 SKUs)
├── Spoilers                         (~15 SKUs — absorbs AERODYNAMICS)
├── Air Dams & Splitters             (~5 SKUs — absorbs AERODYNAMICS remainder)
└── Antennas                         (retire — 1 discontinued SKU)

Off-Road Accessories                 ← replaces: OFF ROAD ACCESSORIES (partial)
├── Skid Plates                      (~20 SKUs)
├── Roof Racks & Baskets             (7 SKUs — consolidates roof rack + roof basket)
├── Chase Racks & Sport Bars        (3 SKUs)
└── MOLLE & Storage (Bed)           (2 SKUs)

Lighting                             ← KEEP AS-IS (name is industry-standard)
├── Headlights                       (161 SKUs — consolidates crystal + projector)
├── LED Light Bars                   (~30 SKUs)
└── Fog Lights                       (~20 SKUs)

Interior                             ← replaces: INTERIOR ACCESSORIES
├── Floor Mats                       (39 SKUs — moved entirely from Off Road)
└── Seat & Storage Organizers        (3 SKUs — consolidates under seat variants)

[Retire entirely]
├── CLEARANCE                        → not a category; use Shopify sales channel / tag instead
├── SPARE PARTS                      → internal only; filter from customer-facing browse
├── BRAND ACCESSORIES                → internal only
└── PERFORMANCE                      → 1 SKU; reclassify to appropriate category
```

---

## 6. Mapping Table: Current → Proposed

| Current ParentCategory | Current CategoryCode | Proposed ParentCategory | Proposed CategoryCode | Est. SKUs Remapped |
|---|---|---|---|---:|
| EXTERIOR ACCESSORIES | front grill | Grilles & Guards | Front Grilles | 167 |
| OFF ROAD ACCESSORIES | bull guard - advance series w/led light bar | Grilles & Guards | Bull Bars & Grille Guards | 77 |
| OFF ROAD ACCESSORIES | bull guard - advance series w/skid plate | Grilles & Guards | Bull Bars & Grille Guards | 113 |
| EXTERIOR ACCESSORIES | tonneau cover - lock & roll up | Tonneau Covers & Bed Accessories | Tonneau Covers | 136 |
| EXTERIOR ACCESSORIES | tonneau cover - tri-fold | Tonneau Covers & Bed Accessories | Tonneau Covers | 122 |
| EXTERIOR ACCESSORIES | tonneau cover - hidden snap | Tonneau Covers & Bed Accessories | Tonneau Covers | 29 |
| EXTERIOR ACCESSORIES / OFF ROAD | truck bed mat - rubber | Tonneau Covers & Bed Accessories | Truck Bed Mats | 133 |
| OFF ROAD ACCESSORIES | molle panels - truck bed | Tonneau Covers & Bed Accessories | Bed Molle Panels | 2 |
| OFF ROAD ACCESSORIES | trailer hitch kit | Towing | Trailer Hitch Kits | 258 |
| OFF ROAD ACCESSORIES | trailer hitch | Towing | Trailer Hitches | 29 |
| OFF ROAD ACCESSORIES | running boards | Steps & Running Boards | Running Boards | 50 |
| EXTERIOR ACCESSORIES | fender flares | Exterior Accessories | Fender Flares | ~30 |
| EXTERIOR ACCESSORIES | window visors | Exterior Accessories | Window Visors | ~15 |
| EXTERIOR ACCESSORIES / AERODYNAMICS | spoilers | Exterior Accessories | Spoilers | ~15 |
| AERODYNAMICS | air dams | Exterior Accessories | Air Dams & Splitters | ~5 |
| OFF ROAD ACCESSORIES | skid plate | Off-Road Accessories | Skid Plates | ~20 |
| OFF ROAD ACCESSORIES | roof rack | Off-Road Accessories | Roof Racks & Baskets | 4 |
| OFF ROAD ACCESSORIES | roof basket | Off-Road Accessories | Roof Racks & Baskets | 3 |
| OFF ROAD ACCESSORIES | chase rack/sport bar | Off-Road Accessories | Chase Racks & Sport Bars | 3 |
| LIGHTING | headlights - led crystal style | Lighting | Headlights | 146 |
| LIGHTING | headlights - projector | Lighting | Headlights | 15 |
| LIGHTING | led light bar | Lighting | LED Light Bars | ~30 |
| LIGHTING | fog lights | Lighting | Fog Lights | ~20 |
| INTERIOR ACCESSORIES / OFF ROAD | floor mats - rubber | Interior | Floor Mats | 39 |
| INTERIOR ACCESSORIES | under seat storage | Interior | Seat & Storage Organizers | 2 |
| INTERIOR ACCESSORIES | under seat storage organizer | Interior | Seat & Storage Organizers | 1 |
| CLEARANCE | (various) | [reclassify to product category] | (keep original category) | ~20 |
| SPARE PARTS | (various) | [internal; hide from browse] | (no change) | ~15 |
| BRAND ACCESSORIES | (various) | [internal; hide from browse] | (no change) | ~5 |
| PERFORMANCE | (various) | [reclassify or retire] | (TBD) | 1 |
| Unknown / NULL | NULL | [audit each item and assign] | (TBD) | ~30 |

**Total items requiring remapping: approximately 1,220 of 1,322 active SKUs.**  
The remaining ~100 are spare parts, clearance, or internal-only items that need individual review.

---

## 7. Remapping Impact Summary

| Proposed ParentCategory | SKUs | Largest Change |
|---|---:|---|
| Grilles & Guards | ~357 | Bull guards move from Off Road → here |
| Tonneau Covers & Bed Accessories | ~422 | Largest new parent; consolidates all bed/cover products |
| Towing | ~287 | Trailer hitches leave Off Road entirely |
| Steps & Running Boards | ~50 | Running boards leave Off Road |
| Exterior Accessories | ~65 | Absorbs AERODYNAMICS; fender flares, visors, spoilers |
| Off-Road Accessories | ~32 | Only true off-road products remain (skid plates, roof racks, etc.) |
| Lighting | ~211 | Consolidates headlight sub-types; no parent change |
| Interior | ~42 | Floor mats move from Off Road to here |
| **Total** | **~1,466** | (some SKUs counted in multiple places due to overlap audit needed) |

---

## 8. SQL to Run When VPN Is Active

Save as a stored procedure in the `integration` schema or run ad hoc:

```sql
-- Query 1: ParentCategory counts (all items)
SELECT
    ISNULL(ParentCategory, '(NULL)') AS ParentCategory,
    COUNT(*) AS item_count
FROM dbo.vCbInventoryMaster
GROUP BY ParentCategory
ORDER BY item_count DESC;

-- Query 2: ParentCategory counts (listed/active only)
SELECT
    ISNULL(ParentCategory, '(NULL)') AS ParentCategory,
    COUNT(*) AS item_count
FROM dbo.vCbInventoryMaster
WHERE ItemStatus = 'list'
GROUP BY ParentCategory
ORDER BY item_count DESC;

-- Query 3: CategoryCode x ParentCategory (all items, count desc)
SELECT
    ISNULL(ParentCategory, '(NULL)') AS ParentCategory,
    ISNULL(CategoryCode,   '(NULL)') AS CategoryCode,
    COUNT(*) AS item_count
FROM dbo.vCbInventoryMaster
GROUP BY ParentCategory, CategoryCode
ORDER BY ParentCategory, item_count DESC;

-- Query 4: CategoryCode x ParentCategory (active/listed only)
SELECT
    ISNULL(ParentCategory, '(NULL)') AS ParentCategory,
    ISNULL(CategoryCode,   '(NULL)') AS CategoryCode,
    COUNT(*) AS item_count
FROM dbo.vCbInventoryMaster
WHERE ItemStatus = 'list'
GROUP BY ParentCategory, CategoryCode
ORDER BY ParentCategory, item_count DESC;

-- Query 5: Items with NULL ParentCategory or CategoryCode (need assignment)
SELECT
    ItemCode,
    ItemName,
    ItemStatus,
    ItemType,
    ParentCategory,
    CategoryCode
FROM dbo.vCbInventoryMaster
WHERE (ParentCategory IS NULL OR CategoryCode IS NULL)
  AND ItemStatus = 'list'
ORDER BY ItemCode;
```

**First verification query after any remapping:**

```sql
-- Confirm proposed category distribution after updates
SELECT
    ISNULL(ParentCategory, '(NULL)') AS ParentCategory,
    COUNT(*) AS item_count
FROM dbo.vCbInventoryMaster
WHERE ItemStatus = 'list'
GROUP BY ParentCategory
ORDER BY item_count DESC;
```

---

## 9. Implementation Notes (CB-Specific)

- ParentCategory and CategoryCode are fields on `tbl_item` (Item Class and Item Category in the CB UI).
  They are surfaced in `vCbInventoryMaster` as read-only columns. Updates must go through the CB
  client UI or the CB REST API endpoint `PUT /products/{item_no}` — not via direct SQL UPDATE.
- Do NOT run `UPDATE tbl_item SET ...` directly without understanding the CB audit trigger on that table.
- The ProductStaging sync pipeline writes CB CategoryCode into `shopify.ProductStaging.CB_CategoryCode`
  and then maps it to Shopify `product_type`. Any CategoryCode rename in CB will need to be followed
  by a re-sync through ProductStaging to update Shopify product_type values.
- Shopify `category:` tags (e.g., `category:Bull Guards`) are maintained separately and will also need
  updating — they are NOT automatically synced from CB CategoryCode.
- Recommended execution order:
  1. Update CB item records (ParentCategory + CategoryCode) via CB UI or bulk import CSV
  2. Re-run ProductStaging sync to push updated CategoryCode → Shopify product_type
  3. Update Shopify `category:` tags via Admin API script
  4. Re-run `data/analytics/ymm_tree.json` audit after tag changes

---

*Script to re-run live queries when VPN is available:*  
`scripts/category_taxonomy_query2.py`
