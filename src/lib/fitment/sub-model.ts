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
