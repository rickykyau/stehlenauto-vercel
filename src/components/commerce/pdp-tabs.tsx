"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icons } from "@/components/ui/icons";
import { SpecRow } from "@/components/ui/spec-row";
import { Stars } from "@/components/ui/stars";
import { YmmButton } from "@/components/fitment/ymm-button";
import { renderShopifyHtml } from "@/lib/utils/render-shopify-html";
import { ReviewsTab } from "./reviews-tab";
import { ReviewForm } from "./review-form";
import type { AmazonReviewBundle } from "@/lib/reviews";
import type { InstallGuide } from "@/lib/install";
import { difficultyColor } from "@/lib/install";
// Cycle 14AS Step E: fitmentTableToRows removed (flat-list metafields
// deleted from Shopify). All fitment table rendering goes through
// applicationsToRows below.
import {
  cleanSubattributeValue,
  filterRetailValues,
} from "@/lib/fitment/retail-filter";
import type { CatalogProduct, FitmentRow } from "@/lib/catalog/types";
import type { Vehicle } from "@/components/ui/vehicle-pill";

/**
 * Cycle 14Z (Mike-O1 M-4): pull spec rows out of Shopify descriptionHtml.
 * Most product descriptions include a "Specifications" or "Specs" section
 * formatted as either a list of "Label: Value" lines or `<li><strong>Label
 * </strong> Value</li>` items. Extract the (label, value) pairs so the
 * SPECS tab can render a real table instead of "see description above".
 */
function extractSpecRowsFromHtml(html: string): [string, string][] {
  if (!html) return [];
  const decoded = html
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");

  // Cycle 14Z (Mike-O2 N-5): the previous extractor stripped <strong> tags
  // to newlines, which broke "<li><strong>MPN:</strong> 14017</li>" into
  // three separate lines. Now: isolate the Specifications section first,
  // then pull `<li><strong>Label:</strong> Value</li>` directly with a
  // single regex.
  const out: [string, string][] = [];

  const specSection = decoded.match(
    /<h[1-6][^>]*>\s*(?:Specifications?|Specs|Tech\s*Specs|Product\s*Specs)\s*<\/h[1-6]>([\s\S]*?)(?=<h[1-6][^>]*>|$)/i,
  );
  const scopeHtml = specSection ? specSection[1] : decoded;

  const liRe = /<li[^>]*>\s*<strong>\s*([^<:]+?)\s*:?\s*<\/strong>\s*([\s\S]*?)<\/li>/gi;
  let match: RegExpExecArray | null;
  while ((match = liRe.exec(scopeHtml)) !== null) {
    const label = match[1].replace(/<[^>]+>/g, "").trim();
    const value = match[2].replace(/<[^>]+>/g, "").trim();
    if (label && value && label.length < 60 && value.length < 200) {
      out.push([label, value]);
    }
  }

  if (out.length === 0) {
    const plainRe = /<li[^>]*>\s*([A-Z][A-Za-z0-9 \-/&'()."]+?)\s*[:：]\s*([\s\S]*?)<\/li>/gi;
    while ((match = plainRe.exec(scopeHtml)) !== null) {
      const label = match[1].replace(/<[^>]+>/g, "").trim();
      const value = match[2].replace(/<[^>]+>/g, "").trim();
      if (label && value && label.length < 60 && value.length < 200) {
        out.push([label, value]);
      }
    }
  }

  return out;
}

/**
 * Cycle 14AR-fix19 (owner): collapse contiguous-year rows that share the
 * same make/model + fitment verdict into a single year-range row. The raw
 * fitmentTableToRows() output is one row per year, which produces 10+
 * identical "2015 Ford F-150 FITS" / "2016 Ford F-150 FITS" rows. Customers
 * scan a single "2015-2024 Ford F-150 FITS" row faster and trust it more.
 *
 * Grouping key: `${cab}|${fits}`. Within a group, we sort years numerically,
 * find runs where every step is +1, and emit "FROM-TO" for runs ≥2 / a bare
 * year for singletons. Non-numeric year strings (rare — usually pass-through
 * like "All Years") are kept as-is and never merged.
 */
function collapseFitmentRows(rows: FitmentRow[]): FitmentRow[] {
  if (rows.length <= 1) return rows;
  type Group = { key: string; cab: string; fits: boolean; years: number[]; nonNumeric: string[] };
  const groups = new Map<string, Group>();
  for (const r of rows) {
    const key = `${r.cab}|${r.fits ? 1 : 0}`;
    const g = groups.get(key) ?? { key, cab: r.cab, fits: r.fits, years: [], nonNumeric: [] };
    const yr = parseInt(r.years, 10);
    if (Number.isFinite(yr) && /^\d{4}$/.test(r.years.trim())) {
      g.years.push(yr);
    } else {
      g.nonNumeric.push(r.years);
    }
    groups.set(key, g);
  }
  const out: FitmentRow[] = [];
  for (const g of groups.values()) {
    const sorted = [...new Set(g.years)].sort((a, b) => a - b);
    let i = 0;
    while (i < sorted.length) {
      let j = i;
      while (j + 1 < sorted.length && sorted[j + 1] === sorted[j] + 1) j++;
      const label =
        i === j ? String(sorted[i]) : `${sorted[i]}-${sorted[j]}`;
      out.push({ years: label, cab: g.cab, fits: g.fits });
      i = j + 1;
    }
    for (const nn of g.nonNumeric) {
      out.push({ years: nn, cab: g.cab, fits: g.fits });
    }
  }
  return out;
}

/**
 * Cycle 14AS-step2 (owner): convert per-application records into FitmentRow[]
 * for display. Each application becomes one (year, "Make Model", FITS) row.
 * collapseFitmentRows then merges contiguous-year runs into ranges.
 *
 * This replaces the flat-list-driven fitmentTableToRows() pairing logic for
 * any product that has fitment_applications populated. The application data
 * already carries the correct (make, model) pairing — no Sierra-as-Chevrolet
 * inference needed (which fitmentTableToRows had to do for multi-make).
 */
function applicationsToRows(
  apps: { year: string; make: string; model: string }[],
): FitmentRow[] {
  const out: FitmentRow[] = [];
  const seen = new Set<string>();
  for (const a of apps) {
    const cab = `${a.make} ${a.model}`.trim();
    const key = `${a.year}|${cab}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ years: a.year, cab, fits: true });
  }
  return out;
}

/**
 * Cycle 14V (owner): when there's no per-product fitment table, derive a
 * single row from the product title — most product titles already encode
 * "YYYY-YYYY Make Model …" which is enough to render an honest "Fits ____"
 * row without lying about cab/bed combinations.
 */
function deriveFitmentRowsFromTitle(title: string): FitmentRow[] {
  if (!title) return [];

  // Cycle 14Z (Mike-O1 M-3): the previous regex required the title to end
  // with a known product-type word — too brittle. Now: match a leading year
  // range + as many of the next 1-3 words as look like make+model. Always
  // produce a row when we see "YYYY-YYYY <Make> ..." or "YYYY-YYYY ...".

  // Pattern A: full year range "2015-2026 Ford F-150 …"
  const fullRange = title.match(/^(\d{4})\s*[-–]\s*(\d{4})\s+(.+)$/);
  if (fullRange) {
    const [, yStart, yEnd, rest] = fullRange;
    // Pull the make + model: stop at the first lowercase product-type word
    // OR at known stop words. If we can't isolate, just use the whole rest.
    // Cycle 14Z (Mike-O2 N-6): added Rear/Front/Under/Box/Organizer/Light/
    // 4WD/2WD etc. so titles like "Silverado/Sierra Rear Underseat Storage"
    // don't leak "Rear" into the displayed vehicle name.
    const stopRe = /\b(class|with|w\/|bed|cab|tonneau|bull|roof|side|floor|storage|hitch|cover|guard|headlight|grille|mat|rack|step|molle|board|combo|kit|set|black|chrome|matte|silver|red|blue|gray|series|advance|advanced|hard|soft|tri[-\s]?fold|roll[-\s]?up|hidden|snap|crystal|projector|lens|led|halo|drop|nerf|running|skid|plate|under[-\s]?seat|console|organizer|mud|flap|wiring|harness|trailer|receiver|ball|mount|hitch[-\s]?step|spec|texture|mesh|studded|rear|front|fog|tail|brake|sport|halo|fender|chase|liner|bar|tube|pre[-\s]?runner|2wd|4wd|awd|passenger|driver|left|right)\b/i;
    const stopMatch = rest.match(stopRe);
    const vehiclePart = stopMatch ? rest.slice(0, stopMatch.index).trim() : rest.split(/\s+/).slice(0, 3).join(" ");
    return [
      {
        years: `${yStart}–${yEnd}`,
        cab: vehiclePart || rest.trim().slice(0, 80),
        fits: true,
      },
    ];
  }

  // Pattern B: short range "07-14 Silverado …" (2-digit year prefixes)
  const shortRange = title.match(/^(\d{2})\s*[-–]\s*(\d{2})\s+(.+)$/);
  if (shortRange) {
    const [, yStart, yEnd, rest] = shortRange;
    const expand = (y: string) => (parseInt(y, 10) >= 50 ? `19${y}` : `20${y}`);
    return [
      {
        years: `${expand(yStart)}–${expand(yEnd)}`,
        cab: rest.trim().split(/\s+/).slice(0, 4).join(" "),
        fits: true,
      },
    ];
  }

  // Pattern C: single year "2017 Ford F-150 …"
  const singleYear = title.match(/^(\d{4})\s+(.+)$/);
  if (singleYear) {
    const [, year, rest] = singleYear;
    return [
      {
        years: year,
        cab: rest.trim().split(/\s+/).slice(0, 4).join(" "),
        fits: true,
      },
    ];
  }

  return [];
}

type TabKey =
  | "fitment"
  | "features"
  | "specs"
  | "installation"
  | "shipping"
  | "warranty"
  | "reviews";

const FEATURES: [string, string][] = [
  [
    "DOOR-FRAME MOUNT",
    "Engineered to clamp to factory door frames — no drilling, no permanent modifications. Reversible with no trace.",
  ],
  [
    "HEAVY-DUTY STEEL",
    "11-gauge cold-rolled steel construction. 600-lb static load rating. 250-lb dynamic capacity at highway speeds.",
  ],
  [
    "SLOTTED CROSSBARS",
    "Pre-cut accessory slots on every crossbar. Compatible with most aftermarket roof tents, awnings, and tie-downs.",
  ],
  [
    "TEXTURED POWDER COAT",
    "Triple-stage powder coating over zinc-rich primer. Tested to 1,000+ hours of salt-spray. UV-stable.",
  ],
  [
    "FACTORY APPEARANCE",
    "Low profile silhouette adds 4.2\" to overall height. No wind noise up to 75 mph in our testing.",
  ],
  [
    "BOLT-ON INSTALL",
    "Includes all hardware, torque spec card, and step-by-step instructions. 60–90 minutes with 2 people.",
  ],
];

const SPECS: [string, string][] = [
  ["Material", "11-gauge cold-rolled steel"],
  ["Finish", "Triple-stage powder coat, matte black"],
  ["Static load rating", "600 lbs"],
  ["Dynamic load rating", "250 lbs"],
  ["Overall length", '79"'],
  ["Overall width", '58"'],
  ["Mounting height", '4.2" above roof'],
  ["Number of crossbars", "5"],
  ["Hardware", "Grade-8 stainless"],
  ["Country of origin", "USA assembled"],
  ["Package weight", "78 lbs"],
  ["Box dimensions", '82" × 14" × 8"'],
];

const INSTALL_STEPS: [string, string][] = [
  ["1", "Unbox and inventory hardware against the included packing list."],
  ["2", "Mount door-frame brackets at marked positions; hand-tighten only."],
  ["3", "Lift assembled rack onto vehicle (2 people) and seat onto brackets."],
  ["4", "Torque all bolts to 18 ft-lb in the sequence shown on the spec card."],
  ["5", "Verify torque after 100 miles, then again at 500 miles."],
];

const SHIPPING_REGIONS: [string, string, string][] = [
  ["CA / NV / UT / AZ", "2–3 business days", "FREE"],
  ["Western states", "3–4 business days", "FREE"],
  ["Midwest / Southern US", "4–5 business days", "FREE"],
  ["Northeast US", "5–6 business days", "FREE"],
  ["Hawaii / Alaska / PR", "7–10 business days", "+ $89"],
];

// Cycle 14X (owner): friendly labels for the sub-attribute groups merch
// populates via custom.fitment_subattributes JSON. Unknown keys fall back
// to the raw key uppercased.
const SUBATTR_LABELS: Record<string, string> = {
  bedLengths: "BED LENGTH",
  cabTypes: "CAB TYPE",
  trims: "TRIM",
  doors: "DOORS",
  drives: "DRIVE",
  // Cycle 14X+ post-sync (Mike-O13 polish): the new metafield keys were
  // rendering raw as "ENGINEEXCLUSIONS" / "EXCLUDEDSUBMODELS". Map to
  // customer-friendly labels.
  engineExclusions: "ENGINE EXCLUSIONS",
  boxOptions: "BOX OPTIONS",
  excludedSubmodels: "EXCLUDED SUB-MODELS",
  submodels: "SUB-MODELS",
};

export function PdpTabs({
  product,
  fitment,
  amazonReviews,
  installGuide,
  vehicle,
  productFits,
}: {
  product: CatalogProduct;
  fitment: FitmentRow[];
  /** Cycle 14BD: real Amazon-imported reviews (verified purchase, ≥4★,
   *  customer-photo-required). When absent, the REVIEWS tab is hidden. */
  amazonReviews?: AmazonReviewBundle | null;
  /** Cycle 14BE-fix9: category-level install guide (difficulty, time,
   *  tools, steps, warnings, optional video URL). When absent, falls
   *  back to the generic support card. */
  installGuide?: InstallGuide | null;
  /** Cycle 14W (owner): garage vehicle so the FITMENT tab can render a
   *  vehicle-specific verdict callout instead of staying mute after the
   *  customer just verified. */
  vehicle?: Vehicle;
  /** True/false/undefined verdict from checkFitment(product, vehicle). */
  productFits?: boolean;
}) {
  const [tab, setTab] = useState<TabKey>("fitment");

  // Cycle 14BD: allow other UI surfaces (e.g. the buy-box stars row)
  // to switch the customer to the REVIEWS tab. The buy-box dispatches
  // `stehlen:tabs:switch` with `{ detail: { tab: "reviews" } }` and we
  // honour it here so the page scrolls them straight to the right tab.
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ tab?: TabKey }>).detail;
      if (detail?.tab) setTab(detail.tab);
    };
    window.addEventListener("stehlen:tabs:switch", handler);
    return () => window.removeEventListener("stehlen:tabs:switch", handler);
  }, []);

  return (
    <section id="pdp-tabs" className="container-x" style={{ paddingBottom: 64 }}>
      {/* Cycle 14AZ-fix1 (Ren BUG-AZ-R1-010): on 375px the tab strip
          overflows but had no visual scroll affordance — INSTALLATION /
          SHIPPING / WARRANTY were silently cut off. Right-edge mask fade
          signals "more tabs this way." Harmless on wide viewports where
          the rightmost tab sits well clear of the 32px fade zone. */}
      <div
        className="no-scrollbar"
        style={{
          display: "flex",
          gap: 0,
          borderBottom: "1px solid var(--color-border)",
          overflowX: "auto",
          maskImage:
            "linear-gradient(to right, black calc(100% - 32px), transparent)",
          WebkitMaskImage:
            "linear-gradient(to right, black calc(100% - 32px), transparent)",
        }}
        role="tablist"
      >
        {(
          [
            ["fitment", "FITMENT"],
            ["features", "FEATURES"],
            ["specs", "SPECS"],
            ["installation", "INSTALLATION"],
            ["shipping", "SHIPPING"],
            ["warranty", "WARRANTY"],
            // Cycle 14BG: REVIEWS tab is ALWAYS visible. With imported
            // Amazon reviews → shows the count. Without → shows "WRITE
            // A REVIEW" so customers can leave native reviews directly
            // (Mike R3 stuck at 8/10 new customer because PDPs without
            // reviews had no social-proof affordance at all).
            amazonReviews && amazonReviews.review_count > 0
              ? ["reviews", `REVIEWS (${amazonReviews.review_count})`] as [TabKey, string]
              : ["reviews", "WRITE A REVIEW"] as [TabKey, string],
          ] satisfies [TabKey, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className="mono"
            style={{
              padding: "14px 20px",
              background: "transparent",
              border: 0,
              cursor: "pointer",
              color:
                tab === key
                  ? "var(--color-foreground)"
                  : "var(--color-muted)",
              borderBottom:
                tab === key
                  ? "2px solid var(--color-primary)"
                  : "2px solid transparent",
              marginBottom: -1,
              whiteSpace: "nowrap",
              fontSize: 12,
              letterSpacing: "0.1em",
              fontWeight: 500,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div
        className="grid grid-cols-1 md:grid-cols-2"
        style={{ paddingTop: 32, paddingBottom: 32, gap: 48 }}
      >
        {tab === "fitment" && (
          <>
            <div>
              {/* Cycle 14W (owner): vehicle-specific verdict callout. After
                  the customer picks YMM via the VERIFY button, this is what
                  changes — the empty-state alone wasn't telling them anything
                  new. Mirrors the buy-box ribbon copy. */}
              {vehicle && productFits === true && (
                <div
                  style={{
                    marginBottom: 16,
                    padding: 14,
                    background: "rgba(34,197,94,0.08)",
                    border: "1px solid rgba(34,197,94,0.45)",
                    borderRadius: "var(--radius-md)",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <Icons.check size={16} sw={3} />
                  <div>
                    <div className="mono" style={{ fontSize: 11, letterSpacing: "0.14em", color: "var(--color-success)", fontWeight: 700 }}>
                      ✓ FITS YOUR {vehicle.year} {vehicle.make.toUpperCase()} {vehicle.model.toUpperCase()}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--color-muted)", marginTop: 2 }}>
                      Engineered for direct bolt-on installation. Backed by the Stehlen Fitment Guarantee.
                    </div>
                  </div>
                </div>
              )}
              {vehicle && productFits === false && (
                <div
                  style={{
                    marginBottom: 16,
                    padding: 14,
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.45)",
                    borderRadius: "var(--radius-md)",
                  }}
                >
                  <div className="mono" style={{ fontSize: 11, letterSpacing: "0.14em", color: "var(--color-destructive)", fontWeight: 700, marginBottom: 4 }}>
                    ✗ DOES NOT FIT YOUR {vehicle.year} {vehicle.make.toUpperCase()} {vehicle.model.toUpperCase()}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--color-muted)" }}>
                    Browse parts that fit your vehicle from the Shop menu above.
                  </div>
                </div>
              )}
              {vehicle && productFits === undefined && (
                <div
                  style={{
                    marginBottom: 16,
                    padding: 14,
                    background: "rgba(245,168,35,0.06)",
                    border: "1px solid rgba(245,168,35,0.45)",
                    borderRadius: "var(--radius-md)",
                  }}
                >
                  <div className="mono" style={{ fontSize: 11, letterSpacing: "0.14em", color: "var(--color-primary)", fontWeight: 700, marginBottom: 4 }}>
                    NEEDS MORE INFO
                  </div>
                  <div style={{ fontSize: 12, color: "var(--color-muted)", lineHeight: 1.5 }}>
                    We have your vehicle ({vehicle.year} {vehicle.make} {vehicle.model}) but this product&apos;s compatibility data isn&apos;t fully tagged yet. Check the buy-box on the right for sub-model selectors (bed length, cab type) or call 1-888-378-4536 to confirm.
                  </div>
                </div>
              )}

              <h3
                className="mono"
                style={{
                  fontSize: 14,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginBottom: 16,
                }}
              >
                VEHICLE COMPATIBILITY
              </h3>
              {/* Cycle 8 (owner): when there's no real fitment data, the
                  table used to render hardcoded mock rows that contradicted
                  the product (e.g. "5.5' Bed" rows on a 6.5' Bed product).
                  Show an honest fallback that points at the YMM modal until
                  ACES data is wired. */}
              {/* Cycle 14V (owner): when there's no per-product fitment table,
                  derive an honest year-make-model row from the product title
                  instead of telling the customer to "look at the title above". */}
              {/* Cycle 14X (owner): now sources rows from
                  product.fitmentTable (custom.fitment_years/makes/models
                  metafields) when populated. Falls back to the legacy
                  fitment prop, then to title-derived rows. */}
              {(() => {
                // Cycle 14AS Step E: applications is sole source.
                const apps = product.fitmentTable?.applications ?? [];
                const metafieldRows: FitmentRow[] =
                  apps.length > 0 ? applicationsToRows(apps) : [];
                const rows: FitmentRow[] =
                  metafieldRows.length > 0
                    ? metafieldRows
                    : fitment.length > 0
                      ? fitment
                      : deriveFitmentRowsFromTitle(product.title);
                if (rows.length === 0) {
                  return (
                    <div
                      style={{
                        padding: 16,
                        background: "var(--color-surface)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "var(--radius-sm)",
                        fontSize: 13,
                        color: "var(--color-muted)",
                        lineHeight: 1.6,
                      }}
                    >
                      Compatibility for this part isn&apos;t parsed yet. Use the
                      VERIFY button on the right and we&apos;ll confirm
                      instantly against your year, make, and model.
                    </div>
                  );
                }
                return null;
              })()}
              {/* Cycle 14X (owner): when warehouse merch has populated the
                  custom.fitment_subattributes JSON metafield (bed_length,
                  cab_type, trim), surface those as chip rows above the
                  per-row table so the customer scans them at a glance. */}
              {product.fitmentTable?.subattributes &&
                Object.keys(product.fitmentTable.subattributes).length > 0 && (
                  <div
                    style={{
                      marginBottom: 14,
                      padding: 12,
                      background: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-sm)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    {Object.entries(product.fitmentTable.subattributes).map(
                      ([key, values]) => {
                        if (!values || values.length === 0) return null;
                        // Cycle 14AR-fix2 (QA-found BUG-14AR-2): filter
                        // fleet/foreign-market entries (SSV, Police
                        // Responder, Pursuit, Edicion Especial, etc.)
                        // for trim and submodel groups before render.
                        // Same blocklist as the picker's data source.
                        // Cycle 14AR-fix27 (Ren R12 P3): all subattribute
                        // values can carry the CA "|--" suffix artifact.
                        // filterRetailValues already strips it for trims +
                        // submodels (where it's also dropping fleet rows);
                        // for the other groups (bedLengths, cabTypes,
                        // doors, etc.) just clean each value.
                        const displayValues =
                          key === "trims" || key === "submodels"
                            ? filterRetailValues(values as string[])
                            : (values as string[]).map(cleanSubattributeValue);
                        if (displayValues.length === 0) return null;
                        const label = SUBATTR_LABELS[key] ?? key.toUpperCase();
                        return (
                          <div
                            key={key}
                            style={{
                              display: "flex",
                              alignItems: "baseline",
                              gap: 10,
                              flexWrap: "wrap",
                            }}
                          >
                            <span
                              className="mono"
                              style={{
                                fontSize: 10,
                                letterSpacing: "0.12em",
                                color: "var(--color-muted)",
                                minWidth: 90,
                              }}
                            >
                              {label}
                            </span>
                            <span
                              style={{
                                display: "flex",
                                gap: 6,
                                flexWrap: "wrap",
                              }}
                            >
                              {displayValues.map((v) => (
                                <span
                                  key={v}
                                  style={{
                                    fontSize: 12,
                                    padding: "3px 9px",
                                    border: "1px solid var(--color-border)",
                                    borderRadius: 999,
                                    background: "var(--color-background)",
                                  }}
                                >
                                  {v}
                                </span>
                              ))}
                            </span>
                          </div>
                        );
                      },
                    )}
                  </div>
                )}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {(() => {
                  // Cycle 14AS Step E: applications is sole source.
                  const apps = product.fitmentTable?.applications ?? [];
                  const metafieldRows: FitmentRow[] =
                    apps.length > 0 ? applicationsToRows(apps) : [];
                  const raw =
                    metafieldRows.length > 0
                      ? metafieldRows
                      : fitment.length > 0
                        ? fitment
                        : deriveFitmentRowsFromTitle(product.title);
                  return collapseFitmentRows(raw);
                })().map((row) => {
                  // Cycle 14AR-fix20 (owner): inline trim + excluded-submodel
                  // detail per row so the customer doesn't have to mentally
                  // cross-reference the chip block above. "2015-2024 Ford F-150
                  // — Fits XLT, Lariat, Raptor (excludes Lightning)".
                  const sub = product.fitmentTable?.subattributes;
                  const fitTrims = sub?.trims
                    ? filterRetailValues(sub.trims as string[])
                    : [];
                  const excludedSubmodels = (sub?.excludedSubmodels ?? []) as string[];
                  const fitsLine = fitTrims.length > 0
                    ? `Fits ${fitTrims.join(", ")}`
                    : null;
                  const excludesLine = excludedSubmodels.length > 0
                    ? `Excludes ${excludedSubmodels.join(", ")}`
                    : null;
                  return (
                  <div
                    key={`${row.years}-${row.cab}`}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "120px 1fr auto",
                      alignItems: "center",
                      padding: 14,
                      background: row.fits
                        ? "rgba(34,197,94,0.05)"
                        : "var(--color-surface)",
                      border: `1px solid ${row.fits ? "rgba(34,197,94,0.25)" : "var(--color-border)"}`,
                      borderRadius: "var(--radius-sm)",
                    }}
                  >
                    <span
                      className="mono"
                      style={{ fontSize: 12, letterSpacing: "0.06em" }}
                    >
                      {row.years}
                    </span>
                    <span
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                        fontSize: 13,
                      }}
                    >
                      <span>{row.cab}</span>
                      {(fitsLine || excludesLine) && row.fits && (
                        <span
                          style={{
                            fontSize: 11,
                            color: "var(--color-muted)",
                            lineHeight: 1.4,
                          }}
                        >
                          {fitsLine}
                          {fitsLine && excludesLine && " · "}
                          {excludesLine && (
                            <span style={{ color: "var(--color-destructive)" }}>
                              {excludesLine}
                            </span>
                          )}
                        </span>
                      )}
                    </span>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        color: row.fits
                          ? "var(--color-success)"
                          : "var(--color-muted-2)",
                      }}
                    >
                      {row.fits ? (
                        <Icons.check size={14} />
                      ) : (
                        <Icons.close size={14} />
                      )}
                      <span
                        className="mono"
                        style={{ fontSize: 11, letterSpacing: "0.08em" }}
                      >
                        {row.fits ? "FITS" : "DOESN'T FIT"}
                      </span>
                    </span>
                  </div>
                  );
                })}
              </div>
            </div>
            <div>
              {/* Cycle 14BC-fix1 (auto-parts-specialist Bug C): the
                  unconditional "VERIFY FITMENT FOR MY VEHICLE" YmmButton
                  re-opened the year/make/model picker even when YMM was
                  already saved — owner journey: vehicle is 2017 Ford
                  F-150, sub-model question (bed length) is the actual
                  blocker, but tapping the button asked YMM again and
                  redirected back to the same page with no progress.
                  Behaviour now varies by state:
                  - No vehicle:           open YMM (original purpose)
                  - Vehicle, fits unknown: scroll to buy-box sub-model
                                           strip (the real blocker)
                  - Vehicle, fits = true:  hide section; nothing to do
                  - Vehicle, fits = false: keep YMM (change vehicle) */}
              {!vehicle ? (
                <>
                  <h3
                    className="mono"
                    style={{
                      fontSize: 14,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      marginBottom: 16,
                    }}
                  >
                    NOT SURE?
                  </h3>
                  <p
                    style={{
                      fontSize: 14,
                      color: "var(--color-muted)",
                      marginBottom: 20,
                      lineHeight: 1.6,
                    }}
                  >
                    Tell us your year, make, and model and we&apos;ll confirm
                    fitment instantly. Backed by our Fitment Guarantee — if it
                    doesn&apos;t fit, we&apos;ll refund 100%.
                  </p>
                  <YmmButton className="btn btn-primary">
                    VERIFY FITMENT FOR MY VEHICLE
                  </YmmButton>
                </>
              ) : productFits === undefined ? (
                <>
                  <h3
                    className="mono"
                    style={{
                      fontSize: 14,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      marginBottom: 16,
                    }}
                  >
                    ALMOST THERE
                  </h3>
                  <p
                    style={{
                      fontSize: 14,
                      color: "var(--color-muted)",
                      marginBottom: 20,
                      lineHeight: 1.6,
                    }}
                  >
                    Your {vehicle.year} {vehicle.make} {vehicle.model} is on
                    file. Pick your bed length / cab type / trim in the buy
                    box above so we can confirm this part fits.
                  </p>
                  <a
                    href="#buy-box-anchor"
                    className="btn btn-primary"
                    onClick={(e) => {
                      e.preventDefault();
                      document
                        .querySelector("[data-buy-box-anchor]")
                        ?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                  >
                    PICK FITMENT IN BUY BOX ↑
                  </a>
                </>
              ) : productFits === false ? (
                <>
                  <h3
                    className="mono"
                    style={{
                      fontSize: 14,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      marginBottom: 16,
                    }}
                  >
                    DIFFERENT VEHICLE?
                  </h3>
                  <p
                    style={{
                      fontSize: 14,
                      color: "var(--color-muted)",
                      marginBottom: 20,
                      lineHeight: 1.6,
                    }}
                  >
                    Your saved vehicle is {vehicle.year} {vehicle.make}{" "}
                    {vehicle.model} — this part doesn&apos;t fit it. Change
                    vehicle to verify against a different rig.
                  </p>
                  <YmmButton className="btn btn-primary">
                    CHANGE VEHICLE
                  </YmmButton>
                </>
              ) : null}
            </div>
          </>
        )}

        {tab === "features" && (
          <div className="md:col-span-2">
            {/* Cycle 14f (Mike-6 MAJOR F-7): the cycle-14e plain-text parser
                split master headers correctly but collapsed bullet items
                ("Title: text Title: text") into one runon paragraph because
                Shopify's text serialization drops the original list breaks.
                Render Shopify's `descriptionHtml` instead — it has the real
                `<ul>`, `<li>`, `<strong>` structure. Sanitized via a strict
                tag whitelist (no script, no attrs, no links). */}
            {product.descriptionHtml && product.descriptionHtml.trim() ? (
              <div className="pdp-features" style={{ fontSize: 14, lineHeight: 1.6 }}>
                {renderShopifyHtml(product.descriptionHtml)}
              </div>
            ) : product.description && product.description.trim() ? (
              <div style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                {product.description}
              </div>
            ) : (
              <div
                style={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  padding: 16,
                  fontSize: 13,
                  color: "var(--color-muted)",
                  lineHeight: 1.6,
                }}
              >
                The Shopify listing doesn&apos;t include a description for{" "}
                <strong style={{ color: "var(--color-foreground)" }}>
                  {product.title}
                </strong>{" "}
                yet. Call 1-888-378-4536 and we&apos;ll send you the spec sheet
                from the warehouse.
              </div>
            )}
          </div>
        )}

        {tab === "specs" && (
          <div className="md:col-span-2">
            {/* Cycle 14Z (Mike-O1 M-4): SPECS used to be a redirect message
                ("see description above"). Customers click SPECS expecting
                actual specs. Parse spec rows directly from the product
                description HTML — most product descriptions include a
                "Specifications" or "Material / Dimensions / Part Number"
                section that we can extract. */}
            {(() => {
              const specRows = extractSpecRowsFromHtml(product.descriptionHtml || "");
              if (specRows.length > 0) {
                return (
                  <div style={{ borderTop: "1px solid var(--color-border)" }}>
                    {specRows.map(([k, v], i) => (
                      <SpecRow
                        key={k + i}
                        label={k}
                        value={v}
                      />
                    ))}
                  </div>
                );
              }
              return (
                <div
                  style={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-md)",
                    padding: 16,
                    fontSize: 13,
                    color: "var(--color-muted)",
                    lineHeight: 1.6,
                  }}
                >
                  Detailed specs for this product haven&apos;t been parsed
                  yet. Spec sheet ships in the box, or call our techs at{" "}
                  <a
                    href="tel:+18883784536"
                    style={{ color: "var(--color-primary)" }}
                  >
                    1-888-378-4536
                  </a>{" "}
                  for material, dimensions, hardware count, and torque values
                  before you order.
                </div>
              );
            })()}
          </div>
        )}

        {tab === "installation" && (
          <>
            <div>
              <h3
                className="mono"
                style={{
                  fontSize: 14,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginBottom: 16,
                }}
              >
                INSTALL OVERVIEW
              </h3>
              {/* Cycle 14BE-fix9 (Mike Mission 1 + Marcus #2/#3): real
                  AI-authored category-level install guide. Replaces the
                  prior "instructions ship in box, call us" placeholder
                  which Mike called out as the #1 hesitation on cold buys.
                  When the category doesn't have a guide yet, falls back
                  to the same generic support card. */}
              {installGuide ? (
                <div>
                  {/* Cycle 14BG: AI-generated install hero image showing
                      the part installed on a vehicle. Visualizes what
                      the customer's truck will look like once assembled —
                      Mike's "new customer 8/10" gap was partly about
                      missing visual install confidence. Gemini-generated
                      via scripts/gen-install-heroes.ts. */}
                  {installGuide.heroImageUrl && (
                    <div
                      style={{
                        marginBottom: 20,
                        aspectRatio: "16 / 9",
                        background: "var(--color-surface-2)",
                        borderRadius: "var(--radius-md)",
                        overflow: "hidden",
                        position: "relative",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={installGuide.heroImageUrl}
                        alt={`${installGuide.title} — installed reference`}
                        loading="lazy"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    </div>
                  )}
                  {/* Difficulty + time + tools strip */}
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 12,
                      marginBottom: 20,
                    }}
                  >
                    <span
                      className="mono"
                      style={{
                        padding: "6px 12px",
                        borderRadius: "var(--radius-sm)",
                        background: "rgba(255,255,255,0.04)",
                        border: `1px solid ${difficultyColor(installGuide.difficulty)}`,
                        color: difficultyColor(installGuide.difficulty),
                        fontSize: 11,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        fontWeight: 700,
                      }}
                    >
                      Difficulty · {installGuide.difficulty}
                    </span>
                    <span
                      className="mono"
                      style={{
                        padding: "6px 12px",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--color-border)",
                        color: "var(--color-foreground)",
                        fontSize: 11,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                      }}
                    >
                      Time · {installGuide.timeMinutes} min
                    </span>
                    <span
                      className="mono"
                      style={{
                        padding: "6px 12px",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--color-border)",
                        color: "var(--color-foreground)",
                        fontSize: 11,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                      }}
                    >
                      {installGuide.peopleNeeded === 1
                        ? "Solo install"
                        : `${installGuide.peopleNeeded} people`}
                    </span>
                    <span
                      className="mono"
                      style={{
                        padding: "6px 12px",
                        borderRadius: "var(--radius-sm)",
                        border: `1px solid ${installGuide.drillRequired ? "var(--color-destructive)" : "var(--color-success)"}`,
                        color: installGuide.drillRequired
                          ? "var(--color-destructive)"
                          : "var(--color-success)",
                        fontSize: 11,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        fontWeight: 700,
                      }}
                    >
                      {installGuide.drillRequired
                        ? "Drilling required"
                        : "No drilling"}
                    </span>
                  </div>

                  {/* Optional install video */}
                  {installGuide.videoUrl && (
                    <div
                      style={{
                        marginBottom: 24,
                        aspectRatio: "16 / 9",
                        background: "#000",
                        borderRadius: "var(--radius-md)",
                        overflow: "hidden",
                      }}
                    >
                      <iframe
                        src={installGuide.videoUrl}
                        title={`${installGuide.title} install video`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        style={{ width: "100%", height: "100%", border: 0 }}
                      />
                    </div>
                  )}

                  {/* Tools needed */}
                  <h4
                    className="mono"
                    style={{
                      fontSize: 11,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "var(--color-muted)",
                      marginBottom: 8,
                    }}
                  >
                    Tools you'll need
                  </h4>
                  <ul
                    style={{
                      margin: 0,
                      marginBottom: 24,
                      paddingLeft: 20,
                      fontSize: 13,
                      lineHeight: 1.7,
                    }}
                  >
                    {installGuide.tools.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>

                  {/* Steps */}
                  <h4
                    className="mono"
                    style={{
                      fontSize: 11,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "var(--color-muted)",
                      marginBottom: 8,
                    }}
                  >
                    Install steps
                  </h4>
                  <ol
                    style={{
                      margin: 0,
                      marginBottom: 24,
                      paddingLeft: 22,
                      fontSize: 14,
                      lineHeight: 1.65,
                    }}
                  >
                    {installGuide.steps.map((s, i) => (
                      <li key={i} style={{ marginBottom: 10 }}>
                        {s}
                      </li>
                    ))}
                  </ol>

                  {/* Warnings */}
                  {installGuide.warnings.length > 0 && (
                    <div
                      style={{
                        background: "rgba(239,68,68,0.08)",
                        border: "1px solid rgba(239,68,68,0.4)",
                        borderRadius: "var(--radius-md)",
                        padding: 16,
                      }}
                    >
                      <h4
                        className="mono"
                        style={{
                          fontSize: 11,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          color: "var(--color-destructive)",
                          marginBottom: 8,
                          fontWeight: 700,
                        }}
                      >
                        ⚠ Heads up
                      </h4>
                      <ul
                        style={{
                          margin: 0,
                          paddingLeft: 20,
                          fontSize: 13,
                          lineHeight: 1.6,
                          color: "var(--color-foreground)",
                        }}
                      >
                        {installGuide.warnings.map((w, i) => (
                          <li key={i} style={{ marginBottom: 6 }}>
                            {w}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-md)",
                    padding: 16,
                    fontSize: 13,
                    color: "var(--color-muted)",
                    lineHeight: 1.6,
                  }}
                >
                  Step-by-step install instructions for{" "}
                  <strong style={{ color: "var(--color-foreground)" }}>
                    {product.title}
                  </strong>{" "}
                  ship inside the box. For a quick overview, visit our{" "}
                  <Link href="/help/install" style={{ color: "var(--color-primary)" }}>
                    install help center
                  </Link>{" "}
                  or call 1-888-378-4536.
                </div>
              )}
            </div>
            {/* Cycle 14Z (Mike-O1 M-5): the previous RESOURCES list claimed
                "Installation Guide (PDF) — 4 pages" and "Installation Video
                — 12:34" but every link went to /help/install. Inventing
                page counts and video durations that don't exist is brand-
                damaging misinformation. Replaced with honest support card. */}
            <div
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                padding: 24,
                borderRadius: "var(--radius-md)",
              }}
            >
              <h3
                className="mono"
                style={{
                  fontSize: 13,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginBottom: 12,
                }}
              >
                INSTALL SUPPORT
              </h3>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--color-muted)",
                  lineHeight: 1.6,
                  marginBottom: 14,
                }}
              >
                Stuck mid-install? Our techs walk customers through real-time
                Mon–Fri 9–5 PST. Have your part out of the box and your
                phone ready.
              </p>
              <a
                href="tel:+18883784536"
                className="btn btn-primary btn-block"
              >
                CALL 1-888-378-4536
              </a>
              <Link
                href="/help/install"
                className="btn btn-block"
                style={{ marginTop: 8 }}
              >
                INSTALL HELP CENTER
              </Link>
            </div>
          </>
        )}

        {tab === "shipping" && (
          <div className="md:col-span-2">
            <h3
              className="mono"
              style={{
                fontSize: 14,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: 16,
              }}
            >
              ESTIMATED DELIVERY
            </h3>
            <div
              style={{
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                overflow: "hidden",
              }}
            >
              {SHIPPING_REGIONS.map(([region, days, cost], i) => (
                <div
                  key={region}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.5fr 1fr 100px",
                    padding: 14,
                    borderTop:
                      i === 0 ? 0 : "1px solid var(--color-border)",
                    alignItems: "center",
                    background: i % 2 ? "var(--color-surface)" : "transparent",
                  }}
                >
                  <span style={{ fontSize: 13 }}>{region}</span>
                  <span
                    className="mono"
                    style={{
                      fontSize: 12,
                      color: "var(--color-muted)",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {days}
                  </span>
                  <span
                    className="mono"
                    style={{
                      fontSize: 12,
                      textAlign: "right",
                      color:
                        cost === "FREE"
                          ? "var(--color-success)"
                          : "var(--color-foreground)",
                    }}
                  >
                    {cost}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "warranty" && (
          <div className="md:col-span-2" style={{ maxWidth: 720 }}>
            <p style={{ fontSize: 15, lineHeight: 1.6, marginBottom: 16 }}>
              <strong>Lifetime structural warranty.</strong> If the rack frame,
              crossbars, or mounting brackets fail under normal use, we&apos;ll
              replace it. Forever. No fine print.
            </p>
            <p
              style={{
                fontSize: 14,
                color: "var(--color-muted)",
                lineHeight: 1.6,
              }}
            >
              Plus a 5-year finish warranty against rust-through, peeling, and
              fade. Hardware is covered for 2 years against thread strip or
              seizure. Off-roading, racing, and commercial use are covered.
            </p>
            <Link
              href="/legal/warranty"
              className="btn"
              style={{ marginTop: 16 }}
            >
              READ FULL WARRANTY POLICY →
            </Link>
          </div>
        )}

        {tab === "reviews" && amazonReviews && amazonReviews.review_count > 0 && (
          <div className="md:col-span-2">
            <ReviewsTab bundle={amazonReviews} />
          </div>
        )}

        {/* Cycle 14BG: when no imported reviews exist, surface the native
            review submission form so customers can leave the first one.
            Mike R3 stuck at 8/10 new customer because review-less PDPs
            had no social-proof affordance — now every PDP has at least
            the "be the first to review" CTA. */}
        {tab === "reviews" && (!amazonReviews || amazonReviews.review_count === 0) && (
          <div className="md:col-span-2">
            <ReviewForm
              productHandle={product.handle}
              productTitle={product.title}
            />
          </div>
        )}
      </div>
    </section>
  );
}
