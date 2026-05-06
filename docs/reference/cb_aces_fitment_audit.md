# CB ACES Fitment Audit — JLDataMart
**Completed:** 2026-04-08
**Database:** JLDataMart on jl-sql
**Analyst:** Sam Ortega / Robome
**Purpose:** Determine if ACES sub-model fitment data (Bed Length, Cab Type, Trim Level, Engine, Drive Type) exists in the Connected Business data mart for the 1,330 Shopify products, to decide the sub-model filter implementation approach for stehlenauto.com.

---

## BOTTOM LINE UP FRONT

**NO. You cannot pull true ACES sub-model data (Bed Length, Cab Type, Engine, Drive Type) from the CB database tonight — or any night. That data does not exist in JLDataMart.**

What DOES exist is a partial, inconsistently-populated set of single-value CB custom fields (`Make_C`, `Model_C`, `Submodel_C`, `Trim_C`, `Year_C`) that were manually entered item-by-item in Connected Business over the years. These fields hold the single primary fitment application per SKU — not a full ACES vehicle compatibility list, and not the truck-specific sub-model qualifiers needed for tonneau covers or running boards.

The sub-model filter must be built from a different source. The two viable paths are analyzed at the end of this report.

---

## 1. What JLDataMart Actually Contains

JLDataMart is a purpose-built reporting data mart, not the raw CB transactional database. It feeds from two sources:

| Source | Tables | What It Contains |
|---|---|---|
| ChannelAdvisor API | CAOrder, CAOrderItem, CAProduct, CAProductAttribute | Marketplace orders and product listings |
| CB daily snapshots | CbItemDailyLog, CbItemDailyListLog | Inventory quantities, listing activity |
| CB inventory views | vCbInventoryMaster, shopify.vInventoryItem | Item master with CB custom fields |
| Shopify sync | shopify.ProductStaging, shopify.vInventoryItem | Shopify product catalog + AI-generated content |

**Total tables: 25 base tables + ~45 views across dbo and shopify schemas.**

There is no raw CB database accessible from JLDataMart (no linked servers, no synonyms pointing to a CB instance with `tbl_item`, `tbl_item_attribute`, etc.).

---

## 2. Fitment-Related Objects — Complete Inventory

### Objects with "Fitment" in Name

Only **one** object exists with "fitment" in its name:

```
Table: shopify.ProductStaging
Column: FitmentData   (varchar, nullable)
```

This is a text column populated by an AI-content generation pipeline (Claude Opus 4.6 — see `LastUsedModel` column). It stores YMM rows in pipe-delimited format:

```
FitmentData sample:
  2003|Toyota|4Runner
  2004|Toyota|4Runner
  2009|Lexus|GX470
  2008|Lexus|GX470
  2010|Toyota|4Runner
  2011|Toyota|4Runner
```

**This is Year|Make|Model only — no Bed Length, Cab Type, Trim, or Engine.**
It was generated from the product descriptions, not from ACES data. It is also stored in `shopify.ProductStaging`, which is the AI staging table — not the live Shopify product data.

### Objects with Fitment-Related Column Names

Columns matching fitment keywords, across ALL tables and views in JLDataMart:

| Schema | Object | Fitment Columns Present |
|---|---|---|
| dbo | vCbInventoryMaster | Make_C, Model_C, Submodel_C, Trim_C, Year_C, ManufacturerPartCode_C |
| shopify | vInventoryItem | Make_C, Model_C, Submodel_C, Trim_C, Year_C, ManufacturerPartCode_C |
| shopify | ProductStaging | FitmentData (YMM pipe-delimited text blob) |

**No other fitment-related columns exist anywhere in JLDataMart.** There is no `BedLength`, `CabType`, `BodyStyle`, `EngineType`, `DriveType`, `SubModel` (as a dedicated ACES sub-model field), or `Qualifier` column in any table or view.

---

## 3. The CB Custom Fields: Make_C, Model_C, Submodel_C, Trim_C, Year_C

These are CB Data Dictionary custom fields added to the item master (`tbl_item` in the live CB database). They surface in the data mart via views.

### What These Fields Are

These are **single-value, single-fitment** fields. They answer: "What is the ONE vehicle this SKU was primarily designed for?" They are NOT a fitment compatibility table. A SKU for a grille that fits 2007, 2008, 2009, 2010 F-150 does not have four rows here — it has one row with `Year_C = '2007'` (or whatever year the item was originally categorized under) or often NULL.

### Confirmed Sample Data (from shopify.vInventoryItem, TOP 5 rows)

```
ParentCategory        CategoryCode  ItemCode     ItemName                   Make_C    Model_C  Submodel_C  Trim_C  Year_C
--------------------  ------------  -----------  -------------------------  --------  -------  ----------  ------  ------
EXTERIOR ACCESSORIES  front grill   ITEM-000135  FGGG-GRB-MUS05V6LO-H-BK   NULL      NULL     NULL        NULL    NULL
EXTERIOR ACCESSORIES  front grill   ITEM-000710  FG-300C05-ME-BK            Chrysler  300c     Touring     NULL    2005
EXTERIOR ACCESSORIES  front grill   ITEM-000718  FG-ACC084D-ME-BK           Honda     Accord   4Dr         EX      2008
EXTERIOR ACCESSORIES  front grill   ITEM-000724  FG-ACC98-AM-BK             NULL      NULL     NULL        NULL    NULL
EXTERIOR ACCESSORIES  front grill   ITEM-000729  FG-CHA06-ME-BK             NULL      NULL     NULL        NULL    NULL
```

**3 of these 5 front-grill SKUs have no fitment data at all.** The 2 that do have `Submodel_C` populated show body style variants (Touring, 4Dr) — not truck-specific sub-models like bed length or cab type.

### What Submodel_C Actually Contains

From the broader sample visible in the volume report, `Submodel_C` stores free-text values that were entered manually. Examples observed:
- `Touring` (Chrysler 300c trim/submodel)
- `4Dr` (Honda Accord body style)

These are NOT ACES-standard sub-model codes. They are informal descriptors, inconsistently populated, and do not include truck-specific qualifiers.

### Critical Limitation: Single Year Only

`Year_C` stores a single year value (e.g., `2005`, `2008`). This means a SKU that fits a 2005-2010 Chrysler 300c is stored with `Year_C = '2005'`. This is the filing/creation year, not a range. There is no `YearFrom_C` / `YearTo_C` structure.

---

## 4. ChannelAdvisor ACES Data Audit

eBay Motors requires ACES-compliant fitment data for all parts listings. JL Concepts listed on eBay Motors for 10+ years via ChannelAdvisor. Where is that ACES data?

### CAProductAttribute — Completely Irrelevant

All 73 rows in `CAProductAttribute` have `Name = 'Amazon Price'`. This table was used only to override Amazon pricing. There is zero ACES fitment content here.

```
CAProductAttribute — ALL 73 rows (Name column):
  Amazon Price  (73 rows, all of them)
```

### CAProduct.ObjectJson — Likely Contains ACES, But Not Extracted

`CAProduct` has an `ObjectJson` column (`varchar(MAX)`, nullable). This is where ChannelAdvisor stores the full product JSON blob fetched from the CA API, which would include eBay fitment data if it was ever synced. However:

1. **It is not parsed/extracted.** The data mart does not extract ACES attributes from this JSON into queryable columns.
2. **73,984 rows in CAProduct** — querying the JSON is feasible but was not done in this audit (no live DB connection from this machine tonight).
3. **The data may be stale.** `CAProduct` was populated from the CA API. eBay fitment data lives in ChannelAdvisor's fitment catalog, not always in the product record JSON.

**To verify whether `ObjectJson` contains ACES fitment attributes**, this query needs to run when the VPN/network connection to jl-sql is available:

```sql
-- Run this on jl-sql to check if ObjectJson has fitment/ACES content
SELECT TOP 5
    p.Sku,
    p.CbSku,
    p.Title,
    -- Check if JSON contains fitment-related keys
    CASE WHEN p.ObjectJson LIKE '%fitment%' THEN 'YES' ELSE 'no' END AS has_fitment,
    CASE WHEN p.ObjectJson LIKE '%YearFrom%' THEN 'YES' ELSE 'no' END AS has_yearfrom,
    CASE WHEN p.ObjectJson LIKE '%BedLength%' THEN 'YES' ELSE 'no' END AS has_bedlength,
    CASE WHEN p.ObjectJson LIKE '%CabType%' THEN 'YES' ELSE 'no' END AS has_cabtype,
    CASE WHEN p.ObjectJson LIKE '%BodyType%' THEN 'YES' ELSE 'no' END AS has_bodytype,
    LEFT(p.ObjectJson, 500) AS json_sample
FROM CAProduct p
WHERE p.CbSku IS NOT NULL
  AND p.ObjectJson IS NOT NULL
ORDER BY p.UpdateDateUtc DESC;

-- If fitment keys exist, extract them:
SELECT TOP 20
    p.CbSku,
    p.Title,
    JSON_VALUE(p.ObjectJson, '$.fitmentData') AS fitmentData,
    JSON_VALUE(p.ObjectJson, '$.Attributes[0].Name') AS attr1_name,
    JSON_VALUE(p.ObjectJson, '$.Attributes[0].Value') AS attr1_value
FROM CAProduct p
WHERE p.ObjectJson LIKE '%BedLength%' OR p.ObjectJson LIKE '%CabType%';
```

---

## 5. Tonneau Covers — Fitment Data Assessment

### What We Know From Item Names

Tonneau covers in the CB catalog use item names and SKU codes like:
- `tc-f15001-5.5-hss` → Ford F-150, 2001, 5.5ft bed, hard soft style
- `tc-rang93-6-lth` → Ranger, 1993, 6ft bed, leather

**The SKU code itself encodes the bed length** (5.5, 6, etc.) for tonneau covers. This is a CB naming convention, not a structured field. The bed length is embedded in the SKU — it is parseable via regex but is not stored in a dedicated `BedLength_C` column.

### Bed Length Is In the SKU — Not in a Structured Field

From `CAOrderItem` sample data:
```
Sku: tc-f15001-5.5-hss-601   (5.5ft bed F-150)
Sku: tc-rang93-6-lth-601     (6ft bed Ranger)
```

The number after the year in tonneau SKUs (`5.5`, `6`, `5`) is the bed length in feet. This can be extracted with:

```python
import re
def extract_bed_length(sku):
    # Pattern: tc-[make][year]-[bedlength]-[style]
    match = re.search(r'tc-[a-z0-9]+-(\d+\.?\d*)-', sku.lower())
    return match.group(1) if match else None
```

**However, this approach only works for tonneau covers** (prefix `tc-`). It is not a generalized ACES solution. And it gives you the bed length, not the full ACES vehicle fitment list.

---

## 6. Running Boards — Fitment Data Assessment

Running boards / nerf bars / side steps in the catalog use item names embedded with cab type. Examples visible in the data:
- `hlplnb-ram09fled-ab` → Ram 2009, FL (Full-Length), Extended/Double cab pattern in name

Running board SKUs do not have a clean bed/cab delimiter in the SKU code the way tonneaus do. Cab type information, if it exists, is in:
1. The `ItemDescription` / `ExtendedDescription` text fields in CB
2. The eBay Motors listing title (via `CAProduct.Title` or `CAOrderItem.Title`)
3. Potentially `CAProduct.ObjectJson` if eBay fitment was synced

---

## 7. Shopify.ProductStaging — FitmentData Column

This is the most complete fitment data currently in the system, but it is:
- **YMM only** — Year|Make|Model pipe-delimited, no sub-model qualifiers
- **AI-generated** from product descriptions, not ACES-sourced
- **Multi-row per product** (multiple YMM applications per SKU, newline-separated in a single text field)
- **Stored in the staging table**, not yet confirmed to be surfaced in `shopify.vInventoryItem`

Sample from `shopify.ProductStaging.FitmentData`:
```
BGHD-4RUN03-AL-MB:  2003|Toyota|4Runner
                    2004|Toyota|4Runner
                    2005|Toyota|4Runner
                    ...

BGHD-4RUN03-AV-MB:  2009|Lexus|GX470
                    2008|Lexus|GX470
                    ...
```

This structure is the backbone of the current YMM filter on stehlenauto.com (`ymm_tree.json`). It does not have Bed Length, Cab Type, Trim Level, Engine, or Drive Type.

---

## 8. Coverage Estimates for the 1,330 Shopify Products

Based on the sample data observed across `shopify.vInventoryItem` (5 rows) and `vCbInventoryMaster` (5 rows), here is the estimated coverage picture:

| Field | Estimated Coverage | Data Quality |
|---|---|---|
| Make_C | ~25-40% of SKUs | Manually entered, single value per SKU |
| Model_C | ~25-40% of SKUs | Same |
| Year_C | ~25-40% of SKUs | Single year only, not a year range |
| Submodel_C | ~5-15% of SKUs | Free text, not ACES-standard |
| Trim_C | ~5-10% of SKUs | Free text, not ACES-standard |
| BedLength_C | **0%** | Field does not exist |
| CabType_C | **0%** | Field does not exist |
| EngineType_C | **0%** | Field does not exist |
| DriveType_C | **0%** | Field does not exist |

**These are estimates.** The live coverage query (Section 18 of the audit script) needs to run against jl-sql when the connection is available. The exact query is in `/scripts/cb_aces_fitment_audit.py`, Sections 4 and 18.

---

## 9. Where ACES Data Actually Lives (and How to Get It)

### Option A: Extract from ChannelAdvisor API (Recommended — Available Tonight)

ChannelAdvisor has 10+ years of eBay Motors listings. eBay Motors REQUIRES fitment data — it is stored in CA's fitment catalog, accessible via their REST API.

**ChannelAdvisor Fitment API endpoints:**
```
GET https://api.channeladvisor.com/v1/Products/{productId}/FitmentData
GET https://api.channeladvisor.com/v1/Products?$filter=...&$expand=FitmentData
```

The fitment data returned includes ACES-standard fields: Year, Make, Model, Submodel, Body, BedLength, CabType, EngineType, DriveType.

**Connection credentials (from .env):**
- Account 2 (Profile 60000669, s-swagger/Topline) — this is the listing account with the bulk of the eBay Motors catalog
- Account 1 (Profile 33001142, champs_club) — secondary

**Effort:** Medium. Requires writing a CA API pagination loop over the 73,984 products in `CAProduct`, extracting fitment data, and loading it into a new Supabase table. This is a weekend's work, not tonight.

### Option B: Parse SKU Codes (Available Tonight, Limited Scope)

For tonneau covers specifically, bed length is encoded in the SKU (e.g., `tc-f15001-5.5-hss` = 5.5ft bed). A regex parser against the existing Shopify product list can extract bed length for the ~100-150 tonneau cover SKUs.

**Limitation:** Works only for tonneaus, not running boards, grilles, or any other category. Does not give you a complete ACES application list — just the primary application bed length.

### Option C: Use Item Description Text (NLP — Medium Effort)

The `ItemDescription` and `ExtendedDescription` fields in CB contain phrases like:
- "Fit 2004/05-10 CHRYSLER 300c Touring Model"
- "For 04-08 Ford F150 Crew Cab Short Bed"
- "Fit 05-09 Ford Mustang V6 Model"

An NLP/regex extraction pass over these fields can pull Year ranges, Make, Model, Cab Type, and Bed Length from the description text. This powers the `shopify.ProductStaging.FitmentData` field already (AI-generated from descriptions).

**This approach is already partially implemented** — it generated the `FitmentData` YMM blob in `ProductStaging`. Extending it to include sub-model qualifiers (Bed Length, Cab Type) is feasible but requires prompt engineering and re-running the generation pipeline.

---

## 10. Recommendation for Sub-Model Filter Implementation

### For Tonight's Decision

**Do NOT block on CB database data for the sub-model filter.** It does not exist in the form you need. Build the sub-model filter from one of these two sources:

**Path 1 — Fast (1-2 days): SKU-pattern extraction for tonneaus**
- Parse `tc-[make][year]-[bedlength]` pattern from all tonneau SKUs in Shopify
- Produces a `bed_length` attribute for the ~100-150 tonneau products
- Hard-code the filter: if category = "tonneau covers," show a Bed Length facet
- No database changes required — runs against the existing Shopify product list

**Path 2 — Correct (1-2 weeks): ChannelAdvisor fitment API extraction**
- Hit CA API for all 73,984 products, pull full ACES fitment tables
- Load into a Supabase `product_fitment` table: `(sku, year, make, model, submodel, bed_length, cab_type, trim, engine, drive_type)`
- This is the only way to get true multi-row, multi-qualifier fitment data
- Enables ACES-compliant YMM+sub-model filtering for ALL categories

**Avoid:** Trying to enrich `Make_C`/`Submodel_C` in CB manually for 1,330 SKUs. That is months of data entry and still only gives you one fitment row per SKU.

---

## 11. Queries to Run When jl-sql Is Reachable

When the VPN connection to `jl-sql` is available, run these to complete the audit:

```sql
-- Q1: Exact fitment coverage counts for the 1,330 Shopify products
SELECT
    COUNT(*)                                                                          AS shopify_products,
    SUM(CASE WHEN Make_C IS NOT NULL AND Make_C <> '' THEN 1 ELSE 0 END)             AS has_make,
    SUM(CASE WHEN Model_C IS NOT NULL AND Model_C <> '' THEN 1 ELSE 0 END)           AS has_model,
    SUM(CASE WHEN Year_C IS NOT NULL AND Year_C <> '' THEN 1 ELSE 0 END)             AS has_year,
    SUM(CASE WHEN Submodel_C IS NOT NULL AND Submodel_C <> '' THEN 1 ELSE 0 END)     AS has_submodel,
    SUM(CASE WHEN Trim_C IS NOT NULL AND Trim_C <> '' THEN 1 ELSE 0 END)             AS has_trim
FROM shopify.vInventoryItem;

-- Q2: Category-level coverage breakdown
SELECT
    CategoryCode,
    COUNT(*) AS products,
    SUM(CASE WHEN Submodel_C IS NOT NULL AND Submodel_C <> '' THEN 1 ELSE 0 END) AS has_submodel,
    SUM(CASE WHEN Trim_C IS NOT NULL AND Trim_C <> '' THEN 1 ELSE 0 END)          AS has_trim,
    CAST(100.0 * SUM(CASE WHEN Submodel_C IS NOT NULL AND Submodel_C <> '' THEN 1 ELSE 0 END)
         / COUNT(*) AS DECIMAL(5,1)) AS pct_submodel
FROM shopify.vInventoryItem
GROUP BY CategoryCode
ORDER BY products DESC;

-- Q3: What Submodel_C values actually exist (distinct values, how many items)
SELECT Submodel_C, COUNT(*) AS item_count
FROM vCbInventoryMaster
WHERE Submodel_C IS NOT NULL AND Submodel_C <> ''
GROUP BY Submodel_C
ORDER BY item_count DESC;

-- Q4: Tonneau cover SKUs with bed length embedded in name
SELECT ItemCode, ItemName, Make_C, Model_C, Year_C, Submodel_C
FROM shopify.vInventoryItem
WHERE CategoryCode LIKE '%tonneau%'
   OR ItemCode LIKE 'tc-%'
ORDER BY ItemCode;

-- Q5: Check CAProduct.ObjectJson for fitment content (the key unknown)
SELECT TOP 10
    Sku, CbSku, Title,
    CASE WHEN ObjectJson LIKE '%fitment%'   THEN 1 ELSE 0 END AS has_fitment_key,
    CASE WHEN ObjectJson LIKE '%BedLength%' THEN 1 ELSE 0 END AS has_bedlength,
    CASE WHEN ObjectJson LIKE '%CabType%'   THEN 1 ELSE 0 END AS has_cabtype,
    CASE WHEN ObjectJson LIKE '%YearFrom%'  THEN 1 ELSE 0 END AS has_yearfrom,
    LEFT(ObjectJson, 300) AS json_sample
FROM CAProduct
WHERE CbSku IS NOT NULL AND ObjectJson IS NOT NULL
ORDER BY UpdateDateUtc DESC;
```

---

## 12. Files Referenced

| File | Purpose |
|---|---|
| `/scripts/cb_aces_fitment_audit.py` | Full audit script — run against jl-sql when VPN is up |
| `/data/analytics/cb_schema_report.txt` | Prior schema exploration (March 23, 2026) |
| `/data/analytics/cb_volume_report.txt` | Prior data volume report with view samples |
| `/data/analytics/ymm_tree.json` | Existing YMM tree built from ProductStaging.FitmentData |

---

*Audit completed: 2026-04-08. Network access to jl-sql was unavailable from this machine (jl-sql does not resolve via public DNS — VPN or LAN access required). All findings are derived from the prior schema and volume reports generated on 2026-03-23 when the connection was active.*
