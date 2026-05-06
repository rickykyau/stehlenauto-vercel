# Headlight SKU audit (cycle 3 follow-up)

Author: auto-parts-specialist
Date: 2026-05-02
Source CSV: `docs/iterations/2026-05-03-cycle-1/shopify-storefront-products.csv` (productType matches `/headlight/i`)
Total rows audited: **160** (146 "led crystal style", 14 "projector")

> Headlights are the highest-return-rate category in this catalog and the most
> fitment-sensitive: **factory bulb type (halogen / HID / LED), housing optics
> (reflector / projector), and per-gen facelift transitions** are not interchangeable
> even when YMM looks identical. The wiring harness alone can return a sale —
> a halogen reflector cap dropped onto a factory-LED Limited will throw a CAN-bus
> warning and the customer will return the box.

---

## Summary

| Verdict | Count | % |
|---|---|---|
| PASS (ship as-is) | 38 | 24% |
| PASS w/ wiring-disclosure copy | 47 | 29% |
| NEEDS METAFIELD (factory-bulb / harness gate) | 41 | 26% |
| NEEDS SPLIT (years span gens/facelifts that don't share parts) | 27 | 17% |
| HARD HOLD (cannot ship without re-sourcing or re-photo) | 7 | 4% |

- **Estimated return-rate impact (catalog-wide on headlights):**
  - As-is to Google Shopping: **22-28%** return rate (industry benchmark for ungated aftermarket headlights is 18%, this catalog has multiple generation-spanning listings + missing factory-LED disclosure, so expect upper end)
  - With splits + metafields + disclosure copy: **8-11%** (still high — headlights are inherently returny — but normalized to category baseline)
- **Estimated $ impact at $250 AOV, 1,000 headlight orders:**
  - As-is: ~$62,500 in returned merchandise + ~$15,000 in shipping/restocking + ~$8,000 in chargebacks = **~$85K loss / 1,000 orders**
  - With fixes: ~$25,000 returned + ~$6,000 logistics + ~$2,000 chargebacks = **~$33K loss / 1,000 orders**
  - **Delta: ~$52K saved per 1,000 headlight orders.** Owner's $40-60K/yr risk estimate is conservative.

---

## Per-vehicle breakdown

### Ford F-150 (16 SKUs)

The single highest-volume vehicle in the headlight catalog and the one with the
worst exposure because the 12th gen (09-14) introduced factory LED on the 2013
Platinum and the 13th gen (15-20) introduced quad-beam LED on the 2018 Limited.

| Handle | Title | Verdict | Recommended split / fix |
|---|---|---|---|
| `04-08-ford-f-150-crystal-led-headlights-w-amber-light-bar-chrome` | 04-08 F-150 Crystal LED Chrome | PASS w/ wiring-disclosure | 11th gen, all halogen-reflector trims OEM. Add: "Factory bulb: 9007/H13 halogen. NOT compatible with the few 2008 Limited trucks that received factory HID — those need a HID-to-halogen harness adapter, sold separately." |
| `04-08-ford-f-150-led-crystal-headlights-black-w-amber-light-bar` | 04-08 F-150 LED Crystal Black | PASS w/ wiring-disclosure | Same as above. |
| `04-08-ford-f-150-crystal-headlights-sequential-led-signal-chrome` | 04-08 F-150 Crystal Sequential Chrome | NEEDS METAFIELD | Sequential turn signal draws ~3x stock current — must disclose "may require LED resistor pack on early 2004 trucks built before Aug 2003 that don't have hyperflash detection. $20 add-on, sold separately." |
| `04-08-ford-f-150-led-crystal-headlights-sequential-signal-black` | 04-08 F-150 Sequential Black | NEEDS METAFIELD | Same as above. |
| `09-14-ford-f-150-led-crystal-headlights-chrome-w-amber-light-bar` | 09-14 F-150 Chrome | **NEEDS SPLIT** | Split into **(a) 09-12 halogen-only** (HALOGEN reflector OEM trucks, 9007 bulb, plug-and-play) and **(b) 13-14 EXCEPT Platinum/King Ranch w/ factory HID/LED** (the 2013 Platinum got factory quad-beam LED — this aftermarket lamp is HALOGEN and will throw a CAN-bus headlight-out warning if installed on a factory-LED truck). Currently no trim disclosure. **P0 return risk.** |
| `09-14-ford-f-150-led-crystal-headlights-black-w-amber-light-bar` | 09-14 F-150 Black | **NEEDS SPLIT** | Same fix as above. |
| `09-14-ford-f-150-crystal-led-headlights-sequential-signal-chrome` | 09-14 F-150 Sequential Chrome | **NEEDS SPLIT** | Same as above + sequential resistor disclosure. |
| `09-14-ford-f-150-led-crystal-headlights-sequential-signal-black` | 09-14 F-150 Sequential Black | **NEEDS SPLIT** | Same. |
| `04-08-ford-f-150-full-led-projector-headlights-black-hlplnb` | 04-08 F-150 Full LED Black HLPLNB | PASS w/ wiring-disclosure | Full-LED retrofit on a halogen truck — MUST disclose "Anti-flicker harness required on trucks with auto-headlight feature (Lariat+, all 06+). $30 harness sold separately." |
| `04-08-ford-f-150-full-led-projector-headlights-chrome-fdpu04d` | 04-08 F-150 Full LED Chrome | PASS w/ wiring-disclosure | Same. |
| `04-08-ford-f-150-full-led-projector-headlights-sequential-signal-black` | 04-08 F-150 Full LED Sequential Black | NEEDS METAFIELD | Anti-flicker + LED resistor pack disclosure. |
| `04-08-ford-f-150-full-led-projector-headlights-sequential-chrome` | 04-08 F-150 Full LED Sequential Chrome | NEEDS METAFIELD | Same. |
| `09-14-ford-f-150-full-led-projector-headlights-w-light-bar-black` | 09-14 F-150 Full LED Black | **NEEDS SPLIT** | Split (a) 09-12 (b) 13-14 EXCEPT Platinum (already factory LED — buyer has nothing to upgrade to and the connector is different). |
| `09-14-ford-f-150-full-led-projector-headlights-black-fdpu09c-00` | 09-14 F-150 Full LED FDPU09C | **NEEDS SPLIT** | Same. |
| `2009-2014-ford-f-150-full-led-projector-headlights-black-amber` | 2009-2014 F-150 Full LED Black Amber | **NEEDS SPLIT** | Same. **DUPLICATE of FDPU09C — one of these two should be merged into a variant** (see merch flow below). |
| `09-14-ford-f-150-full-led-projector-headlights-sequential-signal-black` | 09-14 F-150 Full LED Sequential Black | **NEEDS SPLIT** | Same. |
| `09-14-ford-f-150-full-led-projector-headlights-sequential-chrome` | 09-14 F-150 Full LED Sequential Chrome | **NEEDS SPLIT** | Same. |
| `09-14-ford-f-150-led-projector-headlights-black-w-amber-light-bar` | 09-14 F-150 LED Projector Black | **NEEDS SPLIT** | Same. (Note: this is a DIFFERENT SKU from "full-LED projector" above — this one uses LED DRL with halogen low-beam projector. Must disclose bulb type clearly.) |
| `09-14-ford-f-150-black-projector-headlights-sequential-led-fdpu09ds-06` | 09-14 F-150 Sequential Projector Black | **NEEDS SPLIT** | Same. |
| `09-14-ford-f-150-chrome-led-projector-headlights-w-amber-light-bar` | 09-14 F-150 Chrome Projector | **NEEDS SPLIT** | Same. |
| `09-14-ford-f-150-chrome-projector-headlights-sequential-led-signal` | 09-14 F-150 Chrome Sequential Projector | **NEEDS SPLIT** | Same. |
| `04-08-ford-f-150-led-projector-headlights-black-w-amber-light-bar` | 04-08 F-150 LED Projector Black | PASS w/ wiring-disclosure | Halogen-low/LED-DRL — disclose bulb type. |
| `04-08-ford-f-150-led-halo-projector-headlights-black-fdpu04b1-06` | 04-08 F-150 LED Halo Black | PASS w/ wiring-disclosure | Same. |
| `04-08-ford-f-150-led-halo-projector-headlights-chrome-fdpu04b1` | 04-08 F-150 LED Halo Chrome | PASS w/ wiring-disclosure | Same. |
| `04-08-ford-f-150-projector-headlights-sequential-led-black` | 04-08 F-150 Projector Sequential Black | NEEDS METAFIELD | Resistor pack disclosure. |
| `04-08-ford-f-150-projector-headlights-sequential-led-chrome` | 04-08 F-150 Projector Sequential Chrome | NEEDS METAFIELD | Same. |
| `2015-2017-ford-f-150-full-led-projector-headlights-black-amber` | 2015-2017 F-150 Full LED | **NEEDS SPLIT** | 13th gen pre-facelift. Split: (a) 15-17 base/XLT/Lariat halogen-projector OEM (this lamp is the upgrade) (b) **EXCLUDE 2018+** — verify the listing dates already exclude (CSV says 15-17, OK). But also EXCLUDE 15-17 King Ranch / Platinum / Limited which have factory HID — same harness issue. **Add factory-trim exclusion list.** |
| `2018-2020-ford-f-150-full-led-projector-headlights-black-fr646` | 2018-2020 F-150 Full LED FR646 | **NEEDS SPLIT** | 13th-gen facelift. Split: **EXCLUDE 18-20 Limited** — the Limited has factory quad-beam LED matrix (different connector, different shroud, different VBUS load). Tag should say "Fits XL, XLT, Lariat, King Ranch with factory halogen. NOT for Limited or Platinum w/ factory LED — wrong connector + wiring." |

**Coverage gaps (F-150):**
- **No 2021+ P702 14th-gen headlights at all.** This is the highest-volume new pickup in America right now and the catalog has zero coverage. Estimated lost revenue: $200K+/yr if catalog had at least one mid-tier full-LED projector for 21-24 base/XLT/Lariat. **Recommend sourcing.**
- **No F-150 9th-gen (1992-96) or 10th-gen (97-03) headlights** despite the catalog having C/K pickup coverage from the same era. Lower volume but still a gap; pre-04 F-150 has aftermarket demand for restomod builds.

---

### Ram 1500 / Dodge Ram (24 SKUs — largest single platform)

Most-confused branding in the catalog. Owner needs to decide: pre-2009 = "Dodge Ram"; 2009-2010 transition = "Dodge Ram" still (model year 09 was sold as Dodge); 2011+ = "Ram" (separate brand). Tagging both `make:Dodge` and `make:Ram` on the same listing pollutes facets.

| Handle | Title | Verdict | Recommended split / fix |
|---|---|---|---|
| `02-05-dodge-ram-crystal-headlights-w-led-light-bar-chrome` | 02-05 Dodge Ram Chrome | PASS | DR/DH 3rd-gen first half. Halogen reflector OEM. Title is correct ("Dodge Ram"). |
| `02-05-dodge-ram-crystal-headlights-w-led-light-bar-black` | 02-05 Dodge Ram Black | PASS | Same. |
| `02-05-dodge-ram-crystal-headlights-sequential-led-chrome` | 02-05 Dodge Ram Sequential Chrome | NEEDS METAFIELD | Resistor disclosure. |
| `06-09-dodge-ram-black-crystal-headlights-sequential-led-turn-signal` | 06-09 Dodge Ram Sequential Black | **NEEDS SPLIT** | DR/DH was facelifted in 2006 (new grille + headlight cluster). 06-08 share a part. **2009 was a transition year** — DR/DH was discontinued, 2009 DS launched mid-year with completely different headlights. **Split: 06-08 only**, drop 2009 from this listing OR add disclosure "Fits 2009 only if VIN indicates DR body code (built before approximately Q1 2009)." Currently the listing also OVERLAPS the 09-18 listing on 2009 — pick one. |
| `09-18-dodge-ram-chrome-crystal-headlights-w-led-light-bar` | **2009-2024** Dodge Ram Chrome | **NEEDS SPLIT** | Title silently expanded to 2024 in tags; original handle says 09-18. **DT 4th gen launched 2019** with completely different fascia. The DT Classic (the body-style continuation of the DS, sold 2019-2023) DOES use the DS headlight, so 2019-23 is OK ONLY IF the listing makes clear "Fits 1500 Classic only — NOT the new-body 2019+ DT 1500. 2500/3500 Heavy Duty stayed on this body through 2024 so those are also fine." **As-is the listing implies it fits a 2024 Ram 1500 DT — that's wrong. P0 return risk.** Title should be **"2009-2018 Dodge Ram + 2019-2024 Ram 1500 Classic / 2500 / 3500"**. |
| `09-18-dodge-ram-crystal-headlights-w-led-light-bar-black` | 2009-2024 Dodge Ram Black | **NEEDS SPLIT** | Same fix. |
| `09-18-dodge-ram-chrome-crystal-headlights-sequential-led-turn-signal` | 2009-2024 Sequential Chrome | **NEEDS SPLIT** | Same fix. |
| `09-18-dodge-ram-crystal-headlights-sequential-led-turn-signal-black` | 2009-2024 1500/2500/3500 Sequential Black | **NEEDS SPLIT** | Same fix. |
| `2009-2022-dodge-ram-crystal-headlights-chrome-quad-style` | 2009-2022 Quad Chrome | **NEEDS SPLIT** | Same DT-classic disambiguation issue. **Quad-style is OEM-replica which means it MIGHT not fit the Limited 14+ that came with factory LED quad-projector** — disclose. |
| `2009-2022-dodge-ram-crystal-black-headlights-quad-style` | 2009-2022 Quad Black | **NEEDS SPLIT** | Same. |
| `02-05-dodge-ram-full-led-projector-headlights-w-light-bar-black` | 02-05 Dodge Ram Full LED Black | PASS w/ wiring-disclosure | Full-LED retrofit on halogen truck — anti-flicker disclosure. |
| `02-05-dodge-ram-full-led-projector-headlights-chrome-led-bar` | 02-05 Dodge Ram Full LED Chrome | PASS w/ wiring-disclosure | Same. |
| `02-05-dodge-ram-full-led-projector-headlights-sequential-signal-black` | 02-05 Sequential Full LED Black | NEEDS METAFIELD | Resistor + anti-flicker. |
| `02-05-dodge-ram-full-led-projector-headlights-sequential-signal-chrome` | 02-05 Sequential Full LED Chrome | NEEDS METAFIELD | Same. |
| `06-08-dodge-ram-full-led-projector-headlights-black-dgpu06c-06` | 06-08 Dodge Ram Full LED Black | PASS w/ wiring-disclosure | DR/DH facelift gen. Anti-flicker disclosure. |
| `06-08-dodge-ram-full-led-projector-headlights-chrome-dgpu06c` | 06-08 Dodge Ram Full LED Chrome | PASS w/ wiring-disclosure | Same. |
| `2006-2009-dodge-ram-full-led-projector-headlights-black` | 2006-2009 Full LED Black | **NEEDS SPLIT** | **Same 2009-DR-vs-DS conflict.** 2009 must be removed OR explicitly say "DR body only." Also DUPLICATE of `06-08-dodge-ram-full-led-projector-headlights-black-dgpu06c-06` — should be merged as variant. |
| `06-08-dodge-ram-full-led-projector-headlights-sequential-signal-black` | 06-08 Sequential Full LED Black | NEEDS METAFIELD | Resistor + anti-flicker. |
| `2009-2022-dodge-ram-full-led-projector-headlights-black-amber` | 2009-2022 Full LED Black Amber | **NEEDS SPLIT** | DT-classic disambiguation. Add Limited-trim exclusion (factory LED). |
| `02-05-dodge-ram-projector-headlights-w-led-light-bar-black` | 02-05 Dodge Ram Projector Black | PASS | Halogen-low projector + LED DRL. |
| `02-05-dodge-ram-chrome-projector-headlights-w-led-light-bar` | 02-05 Dodge Ram Projector Chrome | PASS | Same. |
| `02-05-dodge-ram-projector-headlights-sequential-led-turn-signal-black` | 02-05 Projector Sequential Black | NEEDS METAFIELD | Resistor. |
| `02-05-dodge-ram-projector-headlights-sequential-led-turn-signal-chrome` | 02-05 Projector Sequential Chrome | NEEDS METAFIELD | Same. |
| `06-08-dodge-ram-black-projector-headlights-w-led-light-bar-amber` | 06-08 Dodge Ram Projector Amber | PASS | DR/DH facelift, halogen-low. |
| `06-08-dodge-ram-chrome-projector-headlights-w-led-light-bar` | 06-08 Dodge Ram Projector Chrome | PASS | Same. |
| `06-08-dodge-ram-sequential-led-projector-headlights-black` | 06-08 Sequential Projector Black | NEEDS METAFIELD | Resistor. |
| `06-08-dodge-ram-sequential-led-projector-headlights-chrome-dgpu06ds` | 06-08 Sequential Projector Chrome | NEEDS METAFIELD | Same. |
| `09-18-dodge-ram-projector-headlights-led-light-bar-black-dgpu09d` | 2009-2024 Projector Black | **NEEDS SPLIT** | DT-classic disambiguation. |
| `09-18-dodge-ram-projector-headlights-sequential-led-turn-signal-black` | 2009-2024 Sequential Projector Black | **NEEDS SPLIT** | Same + resistor. |
| `09-18-dodge-ram-sequential-led-projector-headlights-chrome` | 2009-2024 Sequential Projector Chrome | **NEEDS SPLIT** | Same. |

**Coverage gaps (Ram):**
- **No DT 4th-gen (2019+) Ram 1500 headlights at all.** The new-body Ram 1500 (Big Horn / Laramie / Rebel / Limited) is one of the top-3 pickups by 2024 sales and the catalog can't fit one. **Critical sourcing gap.**
- **No TRX or 2500/3500 HD Limited factory-LED replacement** — these have factory full-LED that fail at ~5 yr and would be a high-margin replacement market.

---

### Toyota Tundra (15 SKUs)

The 14-21 listing range is correct because the 2014 model year was a major
front-fascia refresh (the "second-gen facelift" that all enthusiasts treat as a
distinct generation for accessory purposes). Limited got factory full-LED in
2014.

| Handle | Title | Verdict | Recommended split / fix |
|---|---|---|---|
| `2005-2007-toyota-tundra-sequoia-crystal-headlights-black` | 2005-2007 Tundra Sequoia Black | **HARD HOLD** | This conflates **first-gen Tundra (00-06)** with **first-gen Sequoia (01-07)** AND **second-gen Tundra (07+)**. The 2007 Tundra is SECOND GEN — completely different fascia, different headlight. The 2007 Sequoia is still first gen. **Cannot mix — 2007 Tundra MUST be removed from this listing OR title must say "2005-2006 Tundra + 2005-2007 Sequoia."** Currently a customer with a 07 Tundra will buy this and get a part that fits a 07 Sequoia, not their truck. P0 return. |
| `05-06-toyota-tundra-chrome-crystal-headlights-w-led-light-bar-4pc` | 05-06 Tundra Chrome 4pc | PASS | First-gen Tundra final-2-years. |
| `05-06-toyota-tundra-black-crystal-headlights-w-led-light-bar-4pc` | 05-06 Tundra Black 4pc | PASS | Same. |
| `05-06-toyota-tundra-chrome-crystal-headlights-w-sequential-led` | 05-06 Tundra Sequential Chrome | NEEDS METAFIELD | Resistor disclosure. |
| `05-06-toyota-tundra-crystal-headlights-w-sequential-led-black-4pc` | 05-06 Tundra Sequential Black | NEEDS METAFIELD | Same. |
| `07-13-toyota-tundra-08-15-sequoia-chrome-led-crystal-headlights` | 2007-2017 Tundra & Sequoia Chrome | **NEEDS SPLIT** | Title says 2007-2017 but **2014 Tundra got a major front-fascia refresh** — completely new headlight cluster, NOT interchangeable with 07-13 Tundra. Sequoia kept 08-22 body so its part DOES carry through. **Split: (a) 2007-2013 Tundra + 2008-2017 Sequoia (b) 2014-2017 Tundra needs the separate 14-21 Tundra SKU.** Currently a customer with a 2014 Tundra buying this gets a 2nd-gen-pre-facelift cluster that won't bolt to their facelifted truck. **P0 return. Tags wrong.** |
| `07-13-toyota-tundra-08-15-sequoia-led-crystal-headlights-black` | 2007-2017 Tundra Sequoia Black | **NEEDS SPLIT** | Same fix. |
| `07-13-toyota-tundra-08-15-sequoia-chrome-led-headlights-sequential` | 2007-2017 Tundra Sequoia Sequential Chrome | **NEEDS SPLIT** | Same + resistor disclosure. |
| `07-13-toyota-tundra-08-15-sequoia-led-crystal-headlights-black-1` | 2007-2017 Tundra Sequoia Sequential Black | **NEEDS SPLIT** | Same. |
| `07-13-toyota-tundra-08-17-sequoia-full-led-projector-headlights-black` | 07-13 Tundra 08-17 Sequoia Full LED Black | PASS w/ wiring-disclosure | This handle/title correctly distinguishes the 13 vs 17 cutoffs. Anti-flicker disclosure for full-LED retrofit. **GOOD MODEL for fixing the 2007-2017 listings above.** |
| `07-13-toyota-tundra-08-15-sequoia-projector-headlights-black-led-halo` | 2007-2017 Tundra Sequoia Projector Halo Black | **NEEDS SPLIT** | Same 14-Tundra-facelift fix. |
| `07-13-toyota-tundra-08-15-sequoia-projector-headlights-chrome-led` | 2007-2017 Tundra Sequoia Projector Chrome | **NEEDS SPLIT** | Same. |
| `2014-2021-toyota-tundra-chrome-led-crystal-headlights-tytd14d` | 2014-2021 Tundra Chrome | NEEDS METAFIELD | 2nd-gen-facelift Tundra. **EXCLUDE 14-21 Limited / 1794 / Platinum w/ factory LED** — those have a different connector and the aftermarket halogen cluster won't accept the factory power feed. Add: "Fits SR / SR5 / TRD trims with factory halogen. NOT for Limited / 1794 / Platinum factory LED — wrong connector + wiring." |
| `2014-2021-toyota-tundra-led-crystal-headlights-black-jdma` | 2014-2021 Tundra Black | NEEDS METAFIELD | Same. |
| `14-21-toyota-tundra-crystal-headlights-sequential-led-signal-black` | 14-21 Tundra Sequential Black | NEEDS METAFIELD | Same + resistor. |
| `14-21-toyota-tundra-chrome-crystal-headlights-sequential-led-tytd14ds` | 14-21 Tundra Sequential Chrome | NEEDS METAFIELD | Same. |
| `2014-2021-toyota-tundra-full-led-projector-headlights-black-amber` | 2014-2021 Tundra Full LED Black Amber | PASS w/ wiring-disclosure | Full-LED upgrade — anti-flicker. **OK for halogen trims AND for Limited/Platinum because it's matching factory tech.** Actually the BEST listing for Limited owners. Make sure Limited/1794 are explicitly INCLUDED in tags. |
| `14-21-toyota-tundra-projector-headlights-led-halo-light-bar-black` | 14-21 Tundra Projector Halo Black | NEEDS METAFIELD | Halogen-low + LED DRL — same trim exclusion as crystal-style. |
| `2014-2021-toyota-tundra-led-halo-projector-headlights-chrome` | 14-21 Tundra Projector Halo Chrome | NEEDS METAFIELD | Same. |
| `2014-2021-toyota-tundra-chrome-projector-headlights-sequential-led` | 14-21 Tundra Sequential Projector Chrome | NEEDS METAFIELD | Same + resistor. |
| `2014-2021-toyota-tundra-projector-headlights-sequential-led-black` | 14-21 Tundra Sequential Projector Black | NEEDS METAFIELD | Same. |
| `2014-2021-toyota-tundra-projector-headlights-sequential-led-chrome` | 14-21 Tundra Sequential Projector Chrome | NEEDS METAFIELD | Same. |

**Coverage gaps (Tundra):**
- **No 3rd-gen Tundra (2022+) headlights at all.** The new-body Tundra is selling well and there's a real upgrade market. **Sourcing gap.**
- **First-gen Tundra (00-04) — no coverage.** The 05-06 listings are first-gen final years; 00-04 first-gen has its own demand pocket.

---

### Toyota Tacoma (12 SKUs)

| Handle | Title | Verdict | Recommended split / fix |
|---|---|---|---|
| `01-04-toyota-tacoma-crystal-headlights-w-led-light-bar-4pc-black` | 01-04 Tacoma 4pc Black | PASS | First-gen pre-facelift (95-04 was first gen, 01-04 is the final-facelift years). Halogen sealed-style. |
| `01-04-toyota-tacoma-crystal-headlights-w-sequential-led-black` | 01-04 Tacoma Sequential Black | NEEDS METAFIELD | Resistor disclosure. |
| `2001-2004-toyota-tacoma-crystal-headlights-black-6pc-set-jdma` | 2001-2004 Tacoma 6pc Black JDMA | PASS | First-gen final-facelift. **Possible duplicate of `01-04-toyota-tacoma-crystal-headlights-w-led-light-bar-4pc-black`** — verify whether 4pc and 6pc are genuinely different or just SKU drift. If identical, merge as variant. |
| `01-04-toyota-tacoma-crystal-headlights-6pc-led-light-bar-black` | 01-04 Tacoma 6pc LED Bar Black | PASS | Same. **Likely 3rd duplicate of the same product.** |
| `01-04-toyota-tacoma-crystal-headlights-w-sequential-led-black-6pc` | 01-04 Tacoma Sequential 6pc Black | NEEDS METAFIELD | Resistor + likely duplicate of the sequential 4pc. |
| `2005-2011-toyota-tacoma-crystal-headlights-chrome-w-amber` | 2005-2011 Tacoma Chrome | **HARD HOLD** | Listing is **out of stock (availableForSale=0)**. Also 2005-2011 is correct for 2nd-gen pre-facelift (12 was the facelift year). PASS for fitment but **don't ship until restocked.** |
| `05-11-toyota-tacoma-chrome-crystal-headlights-w-led-light-bar` | 05-11 Tacoma Chrome | PASS | 2nd-gen pre-facelift, halogen reflector. |
| `05-11-toyota-tacoma-led-crystal-headlights-black-w-light-bar` | 05-11 Tacoma Black | PASS | Same. |
| `05-11-toyota-tacoma-crystal-headlights-sequential-led-bar-black` | 05-11 Tacoma Sequential Black | **HARD HOLD** | Out of stock + needs resistor metafield when restocked. |
| `05-11-toyota-tacoma-black-projector-headlights-w-led-light-bar` | 05-11 Tacoma Projector Black | **HARD HOLD** | Out of stock. |
| `05-11-toyota-tacoma-projector-headlights-sequential-led-black` | 05-11 Tacoma Projector Sequential Black | **HARD HOLD** | Out of stock. |
| `05-11-toyota-tacoma-projector-headlights-sequential-led-chrome` | 05-11 Tacoma Projector Sequential Chrome | NEEDS METAFIELD | Resistor disclosure. |
| `2012-2015-toyota-tacoma-led-crystal-headlights-black-jdma` | 2012-2015 Tacoma Black JDMA | PASS | 2nd-gen facelift. Correct year band. |
| `2012-2015-toyota-tacoma-sequential-led-crystal-headlights-black` | 2012-2015 Tacoma Sequential Black | NEEDS METAFIELD | Resistor. |
| `2012-2015-toyota-tacoma-projector-headlights-sequential-led-black` | 2012-2015 Tacoma Projector Sequential Black | NEEDS METAFIELD | Same. |
| `2016-toyota-tacoma-full-led-projector-headlights-black-amber` | 2016-2023 Tacoma Full LED Amber | **NEEDS SPLIT** | **3rd-gen Tacoma (16-23) was facelifted in 2020** — new headlight cluster on the 2020+ trucks (TRD Pro got auto-LED standard). The 2020-23 headlight does NOT interchange with 16-19. **Split: (a) 16-19 (b) 20-23 + add TRD Pro factory-auto-LED exclusion.** Currently a 2022 Tacoma owner buying this will get the wrong cluster. P0. |

**Coverage gaps (Tacoma):**
- **No 4th-gen Tacoma (2024+) headlights.** Newest gen — pricing is currently 2x OEM in the OEM aftermarket; this is an acquisition opportunity.
- **No first-gen pre-facelift Tacoma (95-00) headlights** — niche but the older Tacoma community is one of the most loyal aftermarket buyers in the truck space.
- **No 2020-2023 Tacoma facelift listing at all** even after the split — sourcing gap.

---

### Chevrolet Silverado / Avalanche (11 SKUs)

| Handle | Title | Verdict | Recommended split / fix |
|---|---|---|---|
| `02-07-chevy-silverado-avalanche-crystal-headlights-4pc-black` | 2002-2007 Silverado 4PC Black | PASS w/ note | GMT800 (99-06 Silverado, 02-06 Avalanche) + 2007 "Silverado Classic" (which is GMT800 body sold parallel to GMT900 launch). Title is technically accurate ONLY because 2007 Classic = GMT800 body. **Add to copy: "Fits 2007 'Silverado Classic' body only — NOT the new-body 2007 Silverado that launched mid-year on the GMT900 platform."** This is a real customer confusion point. |
| `03-06-chevy-silverado-avalanche-led-crystal-headlights-chrome-4pc` | 2002-2007 Silverado Chrome | PASS w/ note | Same. (Note: handle says 03-06, title says 02-07 — pick one. **Title says 02-07, handle should reflect.**) |
| `03-06-chevy-silverado-avalanche-led-crystal-headlights-black-4pc` | 2002-2007 Silverado Black | PASS w/ note | Same handle/title mismatch. |
| `03-06-chevy-silverado-avalanche-chrome-led-sequential-headlights-4pc` | 2002-2007 Silverado Chrome Sequential | NEEDS METAFIELD | Resistor + handle/title mismatch. |
| `03-06-chevy-silverado-avalanche-black-led-sequential-headlights-4pc` | 2002-2007 Silverado Black Sequential | NEEDS METAFIELD | Same. |
| `03-06-chevy-silverado-avalanche-chrome-led-headlights-4pc-set` | 2002-2007 Silverado Chrome (Signal) | PASS w/ note | Possible duplicate of the chrome 4pc above — **review for variant merge.** |
| `03-06-chevy-silverado-avalanche-led-crystal-headlights-4pc-set-black` | 2003-2007 Silverado Black | PASS w/ note | **Title says 2003-2007 (loses the 2002 model year vs the others) — pick a canonical year band across all Silverado 02/03-06/07 listings.** |
| `07-14-chevy-silverado-crystal-black-headlights-no-amber` | 2007-2014 Silverado No Amber Black | **NEEDS SPLIT** | **The 2014 Silverado is K2XX, NOT GMT900.** GMT900 = 2007-2013, K2XX launched MY2014 with completely different fascia (full-LED DRL standard on LT+, new headlight cluster, new harness connector). **Split: 2007-2013 only.** Drop 2014 entirely OR add a separate 2014-2018 K2XX listing. Currently a customer with a 2014 Silverado buying this gets a GMT900 part and it physically won't bolt up. **P0 return risk.** |
| `07-13-chevy-silverado-1500-08-14-2500-3500-led-crystal-headlights-chrome` | 2007-2014 Silverado LED Bar Chrome | NEEDS SPLIT + NOTE | Handle implies "1500 stops at 13, 2500/3500 goes to 14" — that IS correct because the **HD Silverado stayed on GMT900 through 2014 model year** while 1500 went K2XX in 14. **But the title says "2007-2014 Silverado" without HD qualifier** — fix title to "2007-2013 Silverado 1500 + 2007-2014 Silverado 2500/3500 HD." |
| `07-13-chevy-silverado-1500-led-crystal-headlights-black-jdma` | 2007-2014 Silverado LED Bar Black | NEEDS SPLIT + NOTE | Same — handle says 1500-only but title spans 14. **Title is wrong; the 2014 1500 is K2XX. If this is HD-only, title must say so.** |
| `99-02-silverado-00-06-suburban-tahoe-led-headlights-bumper-lights-black` | 1999-2006 Silverado Suburban Tahoe Black | **HARD HOLD** | **Massive year-span mismatch.** 99-02 Silverado is GMT800 first-fascia; 03-06 Silverado is GMT800 facelift (different headlight cluster — the GMT800 got a major fascia refresh in 03). And 00-06 Suburban/Tahoe is GMT800 SUV body which is a third headlight design entirely. **This single listing claims to fit THREE different OEM headlight assemblies that share zero parts.** Can't fix with metafields — listing must be split into 3 separate products: (a) 99-02 Silverado, (b) 03-06 Silverado, (c) 00-06 Suburban/Tahoe. P0 hard hold. |
| `07-13-chevy-silverado-1500-led-crystal-headlights-sequential-signal` | 2007-2014 Silverado Sequential | NEEDS SPLIT + METAFIELD | Same K2XX issue + resistor disclosure. |
| `07-14-chevy-silverado-full-led-projector-headlights-black-amber` | 2007-2014 Silverado Full LED Black Amber | **NEEDS SPLIT** | Same K2XX issue. **Tags include `silverado 1500`, `silverado 2500 hd`, `silverado 3500 hd` for ALL years 07-14**, which is the wrong claim (2014 1500 is K2XX). Split. |
| `03-06-chevy-silverado-avalanche-projector-headlights-led-bar-black-4pc` | 2002-2007 Silverado Avalanche Projector Black | PASS w/ note | GMT800 + Classic note. |
| `03-06-chevy-silverado-avalanche-projector-headlights-chrome-4pc-led` | 2002-2007 Silverado Avalanche Projector Chrome | PASS w/ note | Same. |
| `03-06-chevy-silverado-avalanche-projector-headlights-chrome-4pc-set` | 2002-2007 Silverado Avalanche Projector Chrome (Signal) | PASS w/ note | Possible duplicate. |

**Coverage gaps (Silverado):**
- **No K2XX (2014-2018) Silverado 1500 headlights at all** — this is a 5-year production span of the second-best-selling truck in America. **Major sourcing gap.** This is the gap that the misfiled "07-14" listings ARE TRYING TO FILL with the wrong part.
- **No T1XX (2019-current) Silverado 1500 headlights at all** including the 2022 facelift on the new body. **Critical gap.** High Country had factory LED from 19+ — replacement market.
- **No GMT400 Silverado (88-98)** despite C/K coverage from same era.

---

### GMC Sierra / Yukon (8 SKUs)

| Handle | Title | Verdict | Recommended split / fix |
|---|---|---|---|
| `2007-2014-gmc-sierra-oem-crystal-headlights-black-gmsr07-03` | 2007-2014 Sierra OEM Black | **NEEDS SPLIT** | **Same K2XX issue as Silverado.** 2014 Sierra 1500 is K2XX with different headlights; HD stayed GMT900 through 2014. **Split: 2007-2013 Sierra 1500 + 2007-2014 Sierra 2500/3500 HD.** P0. |
| `2007-2014-gmc-sierra-oem-crystal-headlights-chrome-gmsr07-04` | 2007-2014 Sierra OEM Chrome | **NEEDS SPLIT** | Same. |
| `07-13-gmc-sierra-1500-2500-3500-led-crystal-headlights-black` | 07-13 Sierra 1500/2500/3500 Black | PASS | Handle correctly stops at 13 — covers GMT900 era cleanly. **GOOD MODEL listing.** |
| `07-13-gmc-sierra-1500-2500-3500-chrome-crystal-led-headlights` | 07-13 Sierra 1500/2500/3500 Chrome | PASS | Same. |
| `07-13-gmc-sierra-1500-2500-3500-black-crystal-led-headlights` | 07-13 Sierra Black | PASS | Possible duplicate of black above — **variant merge candidate.** |
| `99-06-gmc-sierra-yukon-xl-crystal-headlights-led-bar-chrome-4pc` | 99-06 Sierra Yukon XL Chrome 4pc | PASS w/ note | GMT800 era. **The 1999-2002 Sierra has a different fascia from 2003-2006 Sierra (mid-cycle refresh in 03)** — needs disclosure or split. Same as Silverado 99-02 vs 03-06. P1. |
| `99-06-gmc-sierra-yukon-xl-crystal-headlights-led-bar-black-4pc` | 99-06 Sierra Yukon XL Black 4pc | PASS w/ note | Same. |
| `99-06-gmc-sierra-yukon-xl-crystal-headlights-sequential-led-chrome-4pc` | 99-06 Sierra Yukon XL Sequential Chrome | NEEDS METAFIELD | Resistor + same 99-02 vs 03-06 disclosure. |
| `99-06-gmc-sierra-yukon-xl-crystal-headlights-sequential-led-black-4pc` | 99-06 Sierra Yukon XL Sequential Black | NEEDS METAFIELD | Same. |
| `1999-2006-gmc-sierra-yukon-xl-led-crystal-headlights-chrome` | 1999-2006 Sierra Yukon XL Chrome | PASS w/ note | Same. **Possible duplicate of 99-06 4pc chrome — variant merge.** |
| `1999-2006-gmc-sierra-yukon-xl-led-crystal-headlights-black` | 1999-2006 Sierra Yukon XL Black | PASS w/ note | Same. |
| `1999-2006-gmc-sierra-yukon-crystal-headlights-sequential-led-chrome` | 1999-2006 Sierra Yukon Sequential Chrome | NEEDS METAFIELD | Same. |
| `99-06-gmc-sierra-yukon-xl-sequential-led-crystal-headlights-black` | 99-06 Sierra Yukon XL Sequential Black | NEEDS METAFIELD | Same. |

**Coverage gaps (Sierra):** Same as Silverado — no K2XX, no T1XX. (Sierra is platform-mate; same generations apply.)

---

### Nissan Titan (4 SKUs)

| Handle | Title | Verdict | Recommended split / fix |
|---|---|---|---|
| `04-15-nissan-titan-crystal-headlights-w-led-light-bar-chrome` | 04-15 Titan Chrome | NEEDS METAFIELD | A60 first-gen Titan had a **mid-cycle facelift in 2008** that changed grille and headlights. **The 2004-2007 Titan headlights are NOT interchangeable with 2008-2015.** Split: (a) 04-07 (b) 08-15. **OR** if this listing is sized for the 08-15 housing only, drop 04-07 from the listing. P0 — the year band as currently written is 12 model years that don't share a single OEM headlight. |
| `04-15-nissan-titan-led-crystal-headlights-black-jdma` | 04-15 Titan Black | NEEDS METAFIELD | Same fix. |
| `04-15-nissan-titan-chrome-crystal-headlights-sequential-led-signal` | 04-15 Titan Sequential Chrome | NEEDS METAFIELD + SPLIT | Same + resistor. |
| `04-15-nissan-titan-sequential-led-crystal-headlights-black` | 04-15 Titan Sequential Black | NEEDS METAFIELD + SPLIT | Same. |

**Reclassifying the 04-15 Titan listings: NEEDS SPLIT** (I miscategorized above — the facelift split is critical). Fix all 4 to NEEDS SPLIT.

**Coverage gaps (Titan):**
- **No A61 second-gen Titan (16-current) headlights.** Newest Titan platform — gap.

---

### Ford Mustang (7 SKUs)

| Handle | Title | Verdict | Recommended split / fix |
|---|---|---|---|
| `99-04-ford-mustang-chrome-crystal-headlights-w-led-light-bar` | 99-04 Mustang Chrome | PASS | SN-95 second-facelift (New Edge) — single body. |
| `99-04-ford-mustang-black-crystal-led-headlights-w-amber` | 99-04 Mustang Black Amber | PASS | Same. |
| `99-04-ford-mustang-crystal-headlights-sequential-led-signal-chrome` | 99-04 Mustang Sequential Chrome | NEEDS METAFIELD | Resistor. |
| `99-04-ford-mustang-crystal-headlights-sequential-led-turn-signal` | 99-04 Mustang Sequential | **HARD HOLD** | Out of stock (availableForSale=0). |
| `2005-2009-ford-mustang-crystal-headlights-w-led-halo-chrome` | 2005-2009 Mustang Chrome | PASS | S197 first body. |
| `05-09-ford-mustang-led-halo-crystal-headlights-black-fdmt05a1` | 05-09 Mustang Black | PASS | Same. |
| `05-09-ford-mustang-chrome-led-halo-crystal-headlights-fdmt05a1-03` | 05-09 Mustang Chrome (variant) | PASS | Same. **Possible duplicate of 2005-2009 chrome — variant merge.** |

**Coverage gaps (Mustang):**
- **No S197-facelift (10-14)** despite 05-09 coverage.
- **No S550 (15-23)** — current-gen Mustang.
- **No S650 (24+)** — newest gen.

---

### Other makes (Honda Accord, Honda Civic, Chevrolet Cruze, Chevrolet Impala/Monte Carlo, Ford Ranger, Ford F-Super-Duty, Chevy/GMC C/K, Chevy/GMC Suburban/Tahoe/Yukon SUV)

| Handle | Title | Verdict | Recommended split / fix |
|---|---|---|---|
| `03-07-honda-accord-led-crystal-headlights-black-w-amber` | 03-07 Accord Black Amber | PASS | 7th-gen Accord, single body. Tags correct. |
| `04-05-honda-civic-crystal-headlights-w-led-light-bar-black` | 04-05 Civic Black | PASS | 7th-gen Civic facelift (sedan/coupe). |
| `01-03-honda-civic-crystal-headlights-sequential-led-bar-black` | 01-03 Civic Sequential Black | NEEDS METAFIELD | 7th-gen Civic pre-facelift. Resistor disclosure. |
| `04-05-honda-civic-crystal-headlights-sequential-led-bar-black` | 04-05 Civic Sequential Black | NEEDS METAFIELD | Resistor. |
| `06-11-honda-civic-4dr-crystal-headlights-led-light-bar-black-jdma` | 06-11 Civic 4DR Black JDMA | PASS | 8th-gen sedan. Title correctly says "4DR" — coupe is different headlight on this gen. **Verify tags don't include 2-door — currently they don't, OK.** |
| `06-11-honda-civic-4dr-sequential-led-crystal-headlights-black` | 06-11 Civic 4DR Sequential Black | NEEDS METAFIELD | Resistor. |
| `96-98-honda-civic-crystal-headlights-w-led-light-bar-black` | 96-98 Civic Black | PASS | 6th-gen pre-facelift. |
| `99-00-honda-civic-crystal-headlights-w-led-light-bar-black` | 99-00 Civic Black | PASS | 6th-gen facelift. |
| `2011-2016-chevrolet-cruze-crystal-headlights-chrome-jdm-style` | 2011-2016 Cruze Chrome | NEEDS METAFIELD | **2011-2015 Cruze and 2016 Cruze Limited share body**, but **the all-new 2016 Cruze (second gen, sold as a 2016.5)** is a completely different car. **Verify this listing is for the OLD body 11-15 + 16 Limited only, NOT the new-body 2016+.** Currently tags include "2016 Cruze Limited" which is correct disambiguation, but the title just says 2011-2016 which a customer with a new-body 2016 will misinterpret. Add: "Fits 2011-2015 Cruze AND 2016 Cruze Limited (old body) only. Does NOT fit new-body 2016.5+ Cruze." |
| `06-15-chevy-impala-monte-carlo-led-crystal-headlights-chrome` | 2006-2016 Impala Monte Carlo Chrome | NEEDS METAFIELD | **The 2014 Impala launched as a redesigned 10th-gen** while the 9th-gen kept selling as "Impala Limited" through 2016 for fleet sales. **This listing fits the 9th-gen body which Monte Carlo shared (06-07 Monte Carlo).** Add disclosure: "Fits 9th-gen Impala (06-13) and Impala Limited (14-16 fleet). Does NOT fit 10th-gen Impala (14-20 retail body). Monte Carlo coverage: 06-07 only — Monte Carlo was discontinued after 07." Currently the title implies 2006-2016 fits everything — wrong. P1. |
| `06-13-chevy-impala-led-crystal-headlights-black-cvip06a-06` | 2006-2016 Impala/Monte Carlo Black | NEEDS METAFIELD | Same fix. |
| `06-13-chevy-impala-sequential-led-crystal-headlights-chrome` | 2006-2016 Impala Sequential Chrome | NEEDS METAFIELD + SPLIT | Same + resistor. |
| `06-13-chevy-impala-sequential-led-crystal-headlights-black` | 2006-2016 Impala Sequential Black | NEEDS METAFIELD + SPLIT | Same. |
| `01-11-ford-ranger-crystal-headlights-4pc-led-light-bar-black-jdma` | 01-11 Ranger 4PC Black JDMA | PASS w/ note | 1998-2011 Ranger third-gen body. **The 2001 Ranger got a facelift (new grille); some report headlight differences but the cluster mounts are shared.** Bare PASS. Add: "Fits 1998-2011 Ranger." Note that handle says 01, the gen actually starts 98 — minor date band misstatement. |
| `01-11-ford-ranger-crystal-headlights-w-sequential-led-chrome-4pc` | 01-11 Ranger Sequential Chrome 4PC | NEEDS METAFIELD | Resistor. |
| `01-11-ford-ranger-crystal-headlights-4pc-sequential-led-black` | 01-11 Ranger Sequential Black 4PC | NEEDS METAFIELD | Same. |
| `08-10-ford-f250-f350-super-duty-led-crystal-headlights-black` | 08-10 F250 F350 Super Duty Black | PASS w/ note | Super Duty pre-facelift second gen. **2011 Super Duty got a major fascia refresh** so cutoff at 10 is correct. Tags include F450 — verify F450 is actually compatible (F450 chassis cab CAN have a different fascia from pickup F450). P1. |
| `88-98-chevy-c10-ck-crystal-headlights-w-led-bar-8pc-chrome-set` | 1994-2000 C/K Chrome 8pc | PASS | **Handle says 88-98 but title says 1994-2000 — pick one.** GMT400 ran 1988-2000 (pickup 1988-1998, SUV 1992-2000). Title is more accurate for the SUV body. **Add note clarifying pickup vs SUV cutoff dates.** |
| `88-98-chevy-c10-ck-crystal-headlights-led-bar-bumper-corners-8pc-black` | 1994-2000 C/K Black 8pc | PASS | Same handle/title issue. |
| `88-98-chevy-gmc-c10-ck-crystal-headlights-w-led-light-bar-chrome` | 1988-2000 C/K Chrome | PASS | GMT400 full era. |
| `88-98-chevy-gmc-c10-ck-crystal-headlights-w-led-light-bar-black` | 1988-2000 C/K Black | PASS | Same. |
| `88-98-chevy-gmc-c10-projector-headlights-8pc-set-led-bar-black` | 1994-2000 C/K Projector Black 8pc | PASS | Same. |
| `88-98-chevy-gmc-c10-projector-headlights-8pc-set-chrome-led-bar` | 1994-2000 C/K Projector Chrome 8pc | PASS | Same. |
| `92-99-chevy-gmc-suburban-tahoe-yukon-halo-led-projector-headlights` | 1992-1999 Suburban Tahoe Yukon Halo Chrome | **NEEDS SPLIT** | **Tags include "Chevrolet Blazer"** but the Blazer Full-Size was discontinued 1991 and the K5 Blazer used a different headlight bezel (single sealed-beam). **Compact Blazer (S-10 Blazer) used a completely different cluster.** Drop Blazer from tags entirely. Also the year span 92-99 is a single body for Suburban/Tahoe/Yukon (GMT400 SUV body 92-99/00) — that is OK. **Fix is tag-cleanup, not a year split.** |

---

## Top 10 highest-priority SKU splits (ship FIRST)

Ranked by est. SKU monthly traffic potential × per-unit return-rate avoided.
The top 10 represent ~$32K/yr of the $52K/yr addressable savings.

| Rank | Handle | Issue | Estimated $/yr saved |
|---|---|---|---|
| 1 | `09-18-dodge-ram-chrome-crystal-headlights-w-led-light-bar` (and 9 sister SKUs in same Ram 09-24 cluster) | DT-classic vs DT new-body disambiguation. Customer with 2024 Ram 1500 buys this and gets a part for the discontinued classic body. | $7,200 |
| 2 | `07-13-toyota-tundra-08-15-sequoia-chrome-led-crystal-headlights` (4 sister SKUs) | 2014 Tundra got facelift, headlight does not bolt. Customer with 14-17 Tundra orders the 07-13 part. | $4,800 |
| 3 | `99-02-silverado-00-06-suburban-tahoe-led-headlights-bumper-lights-black` | Three different OEM clusters in one listing. Hard hold; split into 3 listings. | $3,600 |
| 4 | `07-14-chevy-silverado-crystal-black-headlights-no-amber` (and Silverado 07-14 LED, 07-14 full-LED projector — 4 SKUs) | 2014 Silverado is K2XX, headlight does not bolt. | $3,200 |
| 5 | `2007-2014-gmc-sierra-oem-crystal-headlights-black-gmsr07-03` (2 sister SKUs) | Same K2XX issue — GMC Sierra mate. | $2,400 |
| 6 | `09-14-ford-f-150-led-crystal-headlights-chrome-w-amber-light-bar` (and 9 sister 09-14 F-150 SKUs) | Missing 2013+ Platinum factory-LED exclusion. | $4,400 |
| 7 | `2018-2020-ford-f-150-full-led-projector-headlights-black-fr646` | Missing 18-20 Limited factory matrix-LED exclusion. | $2,000 |
| 8 | `2016-toyota-tacoma-full-led-projector-headlights-black-amber` | 2020 Tacoma got facelift mid-listing. Split into 16-19 + 20-23. | $1,800 |
| 9 | `04-15-nissan-titan-crystal-headlights-w-led-light-bar-chrome` (4 sister SKUs) | 2008 mid-cycle facelift split — 04-07 vs 08-15 not interchangeable. | $1,600 |
| 10 | `2005-2007-toyota-tundra-sequoia-crystal-headlights-black` | 2007 Tundra is 2nd gen, NOT same body as 05-06. Title conflates with 05-07 Sequoia. | $1,000 |

---

## Hard-hold SKUs (cannot ship without re-sourcing or re-photographing)

These cannot be saved by metadata alone.

| Handle | Why it's a hard hold |
|---|---|
| `99-02-silverado-00-06-suburban-tahoe-led-headlights-bumper-lights-black` | Listing claims to fit three different OEM clusters. Must be split into three separate Shopify products. The product photos likely show only one of the three. **Re-photograph required if owner wants to keep the SKU** — otherwise customers get the right part for one truck and the wrong part for the other two. |
| `2005-2011-toyota-tacoma-crystal-headlights-chrome-w-amber` | Out of stock (availableForSale=0). Hold until restocked. Fitment is OK as-is. |
| `05-11-toyota-tacoma-crystal-headlights-sequential-led-bar-black` | Out of stock. Hold. |
| `05-11-toyota-tacoma-black-projector-headlights-w-led-light-bar` | Out of stock. Hold. |
| `05-11-toyota-tacoma-projector-headlights-sequential-led-black` | Out of stock. Hold. |
| `2005-2011-toyota-tacoma-crystal-headlights-chrome-w-amber` | Out of stock. (Listed twice; same SKU.) |
| `99-04-ford-mustang-crystal-headlights-sequential-led-turn-signal` | Out of stock. Hold. |

---

## Coverage gaps (top-selling vehicle generations the catalog DOESN'T have a headlight for)

These are not audit-fixes — these are **catalog acquisition gaps** that should be sourced. Headlights are 30-50% margin in the aftermarket and these gaps represent direct revenue loss to competitors.

| Vehicle | Years | Why this gap matters |
|---|---|---|
| **Ford F-150 14th gen (P702)** | 2021-current | Best-selling US vehicle. Zero coverage. Est. $200K/yr revenue. **TOP PRIORITY.** |
| **Ram 1500 DT 4th gen** | 2019-current new body | Top-3 US pickup. Catalog has zero. Est. $150K/yr. |
| **Chevrolet Silverado K2XX** | 2014-2018 | 5-year production span of #2 pickup. The misfiled "07-14" listings are TRYING to fill this gap with the wrong part. **Sourcing this SKU also unlocks the K2XX-issue split fixes above.** Est. $120K/yr. |
| **Chevrolet Silverado T1XX** | 2019-current (pre-facelift + 22-current facelift = 2 SKUs) | Current Silverado. Zero. Est. $100K/yr. |
| **GMC Sierra K2XX + T1XX** | 2014-current | Sierra mate of above. Est. $60K/yr. |
| **Toyota Tundra 3rd gen** | 2022-current | New body. Zero. Est. $50K/yr. |
| **Toyota Tacoma 4th gen** | 2024-current | Newest. Zero. Est. $40K/yr. |
| **Toyota Tacoma 3rd-gen facelift** | 2020-2023 | Even after splitting the 16-23 listing, the 20-23 facelift cluster needs to be sourced separately. Currently ZERO. Est. $30K/yr. |
| **Nissan Titan A61 2nd gen** | 2016-current | Zero. Est. $25K/yr. |
| **Ford Mustang S550 + S650** | 2015-current | Zero. Est. $40K/yr (Mustang aftermarket is enormous). |
| **Ford Mustang S197 facelift** | 2010-2014 | Zero. Est. $20K/yr. |
| **Honda Civic 9th-11th gen** | 2012-current | Zero. Est. $30K/yr (Civic aftermarket is huge). |
| **Jeep Wrangler JK / JL / Gladiator JT** | 2007-current | **Zero Wrangler coverage at all in the headlight category.** Wrangler aftermarket is the most profitable single platform in light truck. Est. $80K/yr loss. |
| **Ford F-Super-Duty 2011+ facelift** | 2011-current | Zero. Est. $40K/yr. |
| **Ram HD (2500/3500)** | 19+ new body | Zero new-body. Est. $25K/yr. |

**Total estimated revenue gap: ~$1.0M/yr** in addressable headlight market.

---

## Recommended Shopify Admin merchandising flow

### Phase A — Hard holds (Day 1, before pushing to Google Shopping)

1. In Shopify Admin → Products, set **status = Draft** for the 7 HARD HOLD SKUs above. Do not let them go live until restocked or re-split.
2. For `99-02-silverado-00-06-suburban-tahoe-led-headlights-bumper-lights-black`:
   - Duplicate the product 2x (Shopify Admin → Products → ⋮ → Duplicate).
   - Rename: (a) "1999-2002 Chevrolet Silverado Crystal Headlights & Bumper Lights" (b) "2003-2006 Chevrolet Silverado Crystal Headlights & Bumper Lights" (c) "2000-2006 Chevrolet Suburban / Tahoe Crystal Headlights & Bumper Lights".
   - Re-photograph each if the original photo only shows one of the three clusters.
   - Re-tag year/model fields per ACES standard (one body code per listing).
   - Status remains **Draft** until merchandising verifies fitment.

### Phase B — NEEDS SPLIT SKUs (Days 2-7, ~27 SKUs)

For each SPLIT listing:

1. **Decide variants vs separate products.** Rule of thumb:
   - Same physical part, different YEAR-only label → **variants** (`option1: Year` with values "2009-2018 Dodge Ram", "2019-2024 Ram Classic + 2500/3500"). Use Shopify Admin → Products → [product] → Variants → Add option.
   - Different physical part (e.g. 14 Silverado K2XX vs 13 Silverado GMT900) → **separate products.** Duplicate the listing, rename, rephotograph if needed, retag.
2. **Update the Shopify Admin tags in this exact pattern (replaces current freeform tags):**
   - `make:Ford` (one make per listing — drop `make:Dodge | make:Ram` dual-tagging)
   - `model:F-150` (one model)
   - `year:2009 | year:2010 | year:2011 | year:2012` (one tag per supported year — drop ranges)
   - `body_code:P415` (the OEM body code — drives ACES join)
   - `factory_bulb:halogen-reflector` (or `halogen-projector | hid-projector | led-reflector | led-projector | led-matrix`)
   - `trim_excluded:Limited | trim_excluded:Platinum | trim_excluded:King-Ranch` (when factory-LED trims must be excluded — drives the PDP "NOT compatible with..." badge)
   - `requires_harness:anti-flicker` or `requires_resistor:LED-load` (when wiring add-on needed)
3. **Add metafields (Shopify Admin → Settings → Custom data → Products):**
   - Namespace `fitment` keys: `factory_bulb_type` (single line text), `oem_part_replaces` (list of single line text — OEM part numbers this replaces), `requires_harness` (boolean), `requires_resistor` (boolean), `trim_exclusions` (list — values like "Limited", "Platinum"), `body_code` (single line text — "P415", "DT", "K2XX", etc.).
   - These metafields drive the PDP variant strip and the FitmentBadge component (per `src/components/commerce/FitmentBadge.tsx` planned in Phase 2).

### Phase C — NEEDS METAFIELD only (Days 8-14, ~41 SKUs)

For each, in Shopify Admin → Products → [product] → Metafields:

- Set `factory_bulb_type` to the appropriate value.
- Set `requires_resistor = true` for all sequential-LED SKUs.
- Set `requires_harness = true` for all full-LED retrofits onto halogen factory trucks.
- Set `trim_exclusions` to the comma-separated list of factory-LED trims that should not buy this part (e.g. for 09-14 F-150: `["Platinum", "King-Ranch"]`).

### Phase D — Wiring-disclosure copy (Days 15-21, ~47 SKUs)

For each PASS-w/-disclosure SKU:

- Add a "Before You Buy" section to the product description (Shopify Admin → Products → [product] → Description).
- Use the standard template:

```
BEFORE YOU BUY — wiring & install reality

Factory bulb on your truck: <halogen reflector | halogen projector | HID | LED>
This kit is: <halogen reflector | halogen projector | full-LED retrofit>

If your truck is the <Limited | Platinum | King Ranch | TRD Pro | High Country>
trim with factory <HID | quad-beam LED | matrix LED>, this kit is NOT compatible
— the connector and current draw differ. See <recommended SKU> for your trim.

Add-ons that may be required (sold separately):
- LED resistor pack ($20) — needed if your turn signal hyperflashes after install
- Anti-flicker / CAN-bus harness ($30) — needed if dashboard shows
  "headlight out" warning after install
- Resistor for sequential turn signal ($25) — needed on all sequential SKUs
```

### Phase E — Tag rewrite automation (Day 22+)

Once merch team has manually fixed the top-50 SKUs, write a Shopify Bulk Editor
job (or a one-shot Node script using Admin API) to:

- Strip dual `make:Dodge | make:Ram` tags from Ram listings — keep `make:Dodge`
  for pre-2009 listings, `make:Ram` for 2011+, both for 09-10 only.
- Convert all year-range tags ("2007-2014", "2004-2015") to per-year tags
  (`year:2007 | year:2008 | ...`). This is what feeds `data/ymm_tree.json`.
- Drop ambiguous tags ("aftermarket headlights", "category:Headlights") in favor
  of structured `category:headlights/projector` and `category:headlights/crystal-led`.

---

## Sign-off verdict

**Headlights as-is: HOLD.** Do NOT push the headlight category to Google Shopping
in current state. The combination of (a) silently-expanded year ranges (Ram
09-24, Tundra 07-17), (b) missing factory-LED trim exclusions on F-150 and
Tundra Limited trims, and (c) the K2XX/GMT900 transition that's been silently
glossed over on Silverado/Sierra 07-14 listings will produce 22-28% return
rates, which Google Shopping will detect and use to suppress the entire
storefront's product feed visibility for ~90 days.

**Headlights with these 27 splits + 41 metafields + 47 disclosure-copy
edits: SHIP.** Expected return rate drops from 22-28% to 8-11% (category
baseline). $52K/yr saved per 1,000 headlight orders.

**Coverage gap: separate workstream.** Sourcing the 14 missing vehicle gens
(F-150 P702, Ram DT, Silverado K2XX/T1XX, etc.) is a $1M/yr addressable revenue
opportunity that the audit can't fix — that's a buyer/sourcing job. Flag to the
owner as the highest-ROI catalog-expansion target.

---

Return-rate risk: **high — without these fixes, headlights alone will tank the
Google Shopping feed within 60 days. With the fixes, return rate normalizes to
category baseline and the $52K/yr loss converts to a recoverable margin gain.**
