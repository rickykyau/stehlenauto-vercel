import type { SubModelGroup } from "@/lib/garage/types";

/**
 * Per locked architecture (May 1, 2026): the 4th-level filter
 * (sub-model) is conditional — only categories that need it expose it.
 *
 * Universal products (~51% of catalog) bypass sub-model UI entirely.
 *
 * Maps a category slug → sub-model groups required to fully gate Add to Cart.
 * Categories not in this map render no sub-model strip.
 */
/**
 * Keyed off the REAL Shopify collection.handle (cycle-3 reconciliation).
 * Old guess-slugs (roof-racks, bumpers, bed-lights, etc.) are kept as aliases
 * below for back-compat with any in-flight cookie data — Phase 5 can drop them.
 */
export const REQUIRED_SUB_MODELS: Record<string, SubModelGroup[]> = {
  // Real Shopify slugs (post-cycle-3):
  "tonneau-covers": ["bed_length"],
  "truck-bed-mats": ["bed_length"],
  "running-boards-side-steps": ["cab_type"],
  "chase-racks-sport-bars": ["bed_length"],
  "bull-guards-grille-guards": ["trim"],
  "roof-racks-baskets": ["bed_length", "cab_type"],
  "front-grilles": ["trim"], // chrome trim vs body-color matters
  "molle-panels": ["bed_length"],

  // Universal-fit per parts-specialist (no sub-model gating needed):
  // trailer-hitches  — hitch ratings drive fitment, but vehicle-tag is enough
  // headlights       — bulb-type gating done elsewhere
  // floor-mats       — front/rear/full-set chosen by Shopify variant
  // under-seat-storage — vehicle-specific, no further sub-model

  // Aliases for legacy mock data still using the old slugs:
  "roof-racks": ["bed_length", "cab_type"],
  "bed-mats": ["bed_length"],
  "running-boards": ["cab_type"],
  "sport-bars": ["bed_length"],
  bumpers: ["trim"],
};

export type SubModelStripConfig = {
  group: SubModelGroup;
  label: string;
  options: string[];
};

// Cycle 14L (owner phone test): the labels used to read like product-variant
// pickers ("BED LENGTH", "CAB TYPE"). On a single-bed product (e.g. a 6.5 ft
// tonneau) a customer would tap "5.5' BED" thinking they were selecting a
// variant — and instantly trip the fitment gate as a 5.5 ft truck. Reword to
// make it unambiguous that the strip is capturing THEIR TRUCK'S spec.
const STRIPS: Record<SubModelGroup, SubModelStripConfig> = {
  bed_length: {
    group: "bed_length",
    label: "YOUR TRUCK'S BED LENGTH",
    // Cycle 14X+ post-sync (Specialist UX review): added 4.6' (Nissan
    // Frontier D40 bed-mats use this exact dimension) and 6' (Toyota
    // Tacoma 6 ft long bed). Without them the sibling-nav chip strip
    // went blank on those PDPs because the static options didn't match
    // the catalog's actual bed-length values.
    options: ["4.6' BED", "5' BED", "5.5' BED", "6' BED", "6.5' BED", "8' BED"],
  },
  cab_type: {
    group: "cab_type",
    label: "YOUR TRUCK'S CAB TYPE",
    options: ["CREW CAB", "SUPERCAB", "REGULAR CAB"],
  },
  trim: {
    group: "trim",
    label: "YOUR TRUCK'S TRIM",
    options: ["BASE", "MID", "HEAVY-DUTY"],
  },
  doors: {
    group: "doors",
    label: "YOUR VEHICLE'S DOOR COUNT",
    options: ["2-DOOR", "4-DOOR"],
  },
};

export function stripsForCategory(
  category: string | undefined,
): SubModelStripConfig[] {
  if (!category) return [];
  const groups = REQUIRED_SUB_MODELS[category];
  if (!groups || groups.length === 0) return [];
  return groups.map((g) => STRIPS[g]);
}

/**
 * Cycle 14AP-fix7 (owner): per-vehicle dimension availability. The
 * generic chip strips list every option in the catalog (6 bed lengths,
 * 3 cab types, 3 trims) — but a 2021 Ford F-150 customer is only sold
 * in 5.5'/6.5'/8' beds. Showing them 4.6' and 5' and 6' is noise that
 * implies "maybe my truck has this and I just don't know" — wrong, and
 * trust-eroding.
 *
 * This lookup keys off "<make> <model>" (case-insensitive, post-
 * normalize) and returns the ACTUALLY-OFFERED option list for each
 * sub-model group. When a vehicle isn't in the table, callers fall
 * back to the full STRIPS option set (current behaviour) so we don't
 * regress unknown vehicles.
 *
 * Source: industry-standard manufacturer trim catalogs as of MY2024.
 * Light-duty pickups + popular SUVs covered; HD trucks (F-250+) and
 * heavy-class trucks (3500+) lean to longer beds; mid-size trucks
 * (Tacoma / Frontier / Ranger / Colorado / Canyon) lean to compact.
 */
const VEHICLE_BED_LENGTHS: Record<string, string[]> = {
  // Half-ton domestic
  "ford f-150": ["5.5' BED", "6.5' BED", "8' BED"],
  "chevrolet silverado 1500": ["5.5' BED", "6.5' BED", "8' BED"],
  "chevrolet silverado": ["5.5' BED", "6.5' BED", "8' BED"],
  "gmc sierra 1500": ["5.5' BED", "6.5' BED", "8' BED"],
  "gmc sierra": ["5.5' BED", "6.5' BED", "8' BED"],
  "ram 1500": ["5.5' BED", "6.5' BED"],
  "dodge ram 1500": ["5.5' BED", "6.5' BED"],
  // Heavy-duty domestic
  "ford f-250": ["6.5' BED", "8' BED"],
  "ford f-350": ["6.5' BED", "8' BED"],
  "ford f-450": ["8' BED"],
  "chevrolet silverado 2500": ["6.5' BED", "8' BED"],
  "chevrolet silverado 3500": ["6.5' BED", "8' BED"],
  "gmc sierra 2500": ["6.5' BED", "8' BED"],
  "gmc sierra 3500": ["6.5' BED", "8' BED"],
  "ram 2500": ["6.5' BED", "8' BED"],
  "ram 3500": ["6.5' BED", "8' BED"],
  // Half-ton import
  "toyota tundra": ["5.5' BED", "6.5' BED", "8' BED"],
  "nissan titan": ["5.5' BED", "6.5' BED"],
  // Mid-size
  "toyota tacoma": ["5' BED", "6' BED"],
  "ford ranger": ["5' BED", "6' BED"],
  "chevrolet colorado": ["5' BED", "6' BED"],
  "gmc canyon": ["5' BED", "6' BED"],
  "nissan frontier": ["4.6' BED", "5' BED", "6' BED"],
  "honda ridgeline": ["5' BED"],
};

const VEHICLE_CAB_TYPES: Record<string, string[]> = {
  // Most half-ton + HD trucks: all three configs
  "ford f-150": ["CREW CAB", "SUPERCAB", "REGULAR CAB"],
  "ford f-250": ["CREW CAB", "SUPERCAB", "REGULAR CAB"],
  "ford f-350": ["CREW CAB", "SUPERCAB", "REGULAR CAB"],
  "chevrolet silverado 1500": ["CREW CAB", "SUPERCAB", "REGULAR CAB"],
  "chevrolet silverado": ["CREW CAB", "SUPERCAB", "REGULAR CAB"],
  "chevrolet silverado 2500": ["CREW CAB", "SUPERCAB", "REGULAR CAB"],
  "chevrolet silverado 3500": ["CREW CAB", "SUPERCAB", "REGULAR CAB"],
  "gmc sierra 1500": ["CREW CAB", "SUPERCAB", "REGULAR CAB"],
  "gmc sierra": ["CREW CAB", "SUPERCAB", "REGULAR CAB"],
  // Ram drops Regular Cab on 1500 starting 2019
  "ram 1500": ["CREW CAB", "SUPERCAB"],
  "ram 2500": ["CREW CAB", "SUPERCAB", "REGULAR CAB"],
  "ram 3500": ["CREW CAB", "SUPERCAB", "REGULAR CAB"],
  // Toyota — Tundra is Crew/Super only modern
  "toyota tundra": ["CREW CAB", "SUPERCAB"],
  "toyota tacoma": ["CREW CAB", "SUPERCAB"],
  // Mid-size import
  "nissan frontier": ["CREW CAB", "SUPERCAB"],
  "nissan titan": ["CREW CAB", "SUPERCAB"],
  // Honda Ridgeline is Crew only
  "honda ridgeline": ["CREW CAB"],
};

function vehicleKey(make: string, model: string): string {
  return `${make} ${model}`.toLowerCase().trim();
}

/**
 * Cycle 14AP-fix7 (owner): subset the strip's options to ONLY what the
 * vehicle is actually sold with. Unknown vehicles (not in the lookup)
 * get the full option set so the picker still works. Returns null when
 * no vehicle is set so callers know to use the full set explicitly.
 */
export function availableOptionsForVehicle(
  group: SubModelGroup,
  vehicle: { make: string; model: string } | null | undefined,
): string[] | null {
  if (!vehicle) return null;
  const key = vehicleKey(vehicle.make, vehicle.model);
  if (group === "bed_length") {
    return VEHICLE_BED_LENGTHS[key] ?? null;
  }
  if (group === "cab_type") {
    return VEHICLE_CAB_TYPES[key] ?? null;
  }
  // trim and doors: keep all options (trim varies by model-year too
  // narrowly to maintain a static lookup; door count rarely needed)
  return null;
}

/**
 * Cycle 14AP-fix7 (owner): like stripsForCategory() but with each
 * strip's options narrowed to what the vehicle is actually sold with.
 * When the vehicle is unknown to the lookup, falls back to the full
 * option set. When a strip has only ONE available option for the
 * vehicle (e.g., Honda Ridgeline → 5' BED only, or 5' BED + CREW CAB),
 * the option list still contains that single value — the picker can
 * decide whether to render a single-chip row or auto-select.
 */
export function availableStripsForCategory(
  category: string | undefined,
  vehicle: { make: string; model: string } | null | undefined,
): SubModelStripConfig[] {
  const base = stripsForCategory(category);
  if (!vehicle) return base;
  return base.map((s) => {
    const allowed = availableOptionsForVehicle(s.group, vehicle);
    if (!allowed || allowed.length === 0) return s;
    // Keep the canonical option ordering from STRIPS but narrow to
    // intersection with the vehicle's allowed list.
    const filtered = s.options.filter((opt) => allowed.includes(opt));
    return filtered.length > 0 ? { ...s, options: filtered } : s;
  });
}

/**
 * Cycle 14AP (owner): convert a (group, optionLabel) pair into a stable
 * slug used for chip-image filenames under /public/images/dimensions/.
 * Examples:
 *   ("bed_length", "5.5' BED")   → "bed-length-5-5"
 *   ("cab_type", "CREW CAB")     → "cab-type-crew-cab"
 *   ("trim", "HEAVY-DUTY")       → "trim-heavy-duty"
 *
 * The image generation script (scripts/regen-dimension-chip-photos.ts)
 * uses the same slug so the picker can build the path predictably.
 */
export function dimensionChipSlug(group: SubModelGroup, value: string): string {
  const groupSlug = group.replace(/_/g, "-");
  const valueSlug = value
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${groupSlug}-${valueSlug}`;
}

/**
 * Cycle 14AO-fix3 (Mike NB-5): allowlist check used by the URL ?dim= parser
 * so a customer can't inject arbitrary text into the picker pill via a
 * crafted shared link. Case-insensitive match against the canonical option
 * vocabulary; returns the canonical-cased value if matched, null otherwise.
 */
export function canonicalSubModelValue(
  group: string,
  raw: string,
): string | null {
  const cfg = STRIPS[group as SubModelGroup];
  if (!cfg) return null;
  const wanted = raw.trim().toLowerCase();
  if (!wanted) return null;
  for (const opt of cfg.options) {
    if (opt.toLowerCase() === wanted) return opt;
  }
  return null;
}
