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

const GROUP_LABELS: Record<SubModelGroup, string> = {
  bed_length: "YOUR TRUCK'S BED LENGTH",
  cab_type: "YOUR TRUCK'S CAB TYPE",
  trim: "YOUR TRUCK'S TRIM",
  doors: "YOUR VEHICLE'S DOOR COUNT",
};

/**
 * Cycle 14AQ (owner): sub-model option lists are no longer hardcoded.
 * The previous "BASE / MID / HEAVY-DUTY" trim array, the
 * VEHICLE_BED_LENGTHS lookup, and the VEHICLE_CAB_TYPES lookup are all
 * gone. Real per-YMM dimension data is sourced from
 * data/ymm_dimensions.json (built from CA fitment) via
 * src/lib/fitment/dimensions.ts.
 *
 * Callers building a strip config now MUST pass in the per-vehicle
 * options list (from `getDimensionOptions(vehicle, group)`). When the
 * options list is empty, callers should skip rendering that strip.
 */
export function buildStripConfig(
  group: SubModelGroup,
  options: string[],
): SubModelStripConfig {
  return {
    group,
    label: GROUP_LABELS[group],
    options,
  };
}

/**
 * Categories required for a slug, with no per-vehicle data applied. Used
 * by callers that don't have a vehicle yet (rare — most callers should
 * use `availableStripsForCategory` instead).
 */
export function requiredGroupsForCategory(
  category: string | undefined,
): SubModelGroup[] {
  if (!category) return [];
  return REQUIRED_SUB_MODELS[category] ?? [];
}

/**
 * Cycle 14AQ: convert a (group, optionLabel) pair into a stable slug
 * used for chip-image filenames under /public/images/dimensions/.
 * Examples:
 *   ("bed_length", "5.5' BED")   → "bed-length-5-5"
 *   ("cab_type", "CREW CAB")     → "cab-type-crew-cab"
 *   ("trim", "Denali")           → "trim-denali"
 *
 * Used by the dimension chip image-generation script when one exists
 * for the (vehicle, group, value) combination.
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
 * Cycle 14AO-fix3 (Mike NB-5): allowlist check used by the URL ?dim=
 * parser so a customer can't inject arbitrary text into the picker pill
 * via a crafted shared link. Matches against the per-vehicle option set
 * passed in (case-insensitive); returns the canonical-cased value if
 * matched, null otherwise.
 *
 * Cycle 14AQ: signature now takes the actual option list (since options
 * are no longer global constants).
 */
export function canonicalSubModelValue(
  options: string[],
  raw: string,
): string | null {
  const wanted = raw.trim().toLowerCase();
  if (!wanted) return null;
  for (const opt of options) {
    if (opt.toLowerCase() === wanted) return opt;
  }
  return null;
}
