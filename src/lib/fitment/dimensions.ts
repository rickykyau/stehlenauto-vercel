import "server-only";
import fs from "node:fs";
import path from "node:path";
import type { SubModelGroup } from "@/lib/garage/types";

/**
 * Cycle 14AQ — Per-vehicle dimension lookup, sourced from
 * data/ymm_dimensions.json (built by scripts/build-ymm-index.py from
 * the ChannelAdvisor fitment snapshot).
 *
 * Replaces the hardcoded VEHICLE_BED_LENGTHS / VEHICLE_CAB_TYPES /
 * BASE-MID-HEAVY trim arrays in src/lib/fitment/sub-model.ts. Owner
 * directive: NEVER hardcode vehicle dimension data — use CA fitment
 * data as the single source of truth.
 */

export type VehicleDimensions = {
  trims: string[];
  bedLengths: string[];
  cabTypes: string[];
  doors: string[];
};

const EMPTY: VehicleDimensions = {
  trims: [],
  bedLengths: [],
  cabTypes: [],
  doors: [],
};

let cache: Record<string, VehicleDimensions> | null = null;

function load(): Record<string, VehicleDimensions> {
  if (cache) return cache;
  try {
    const file = path.join(process.cwd(), "data", "ymm_dimensions.json");
    const raw = fs.readFileSync(file, "utf8");
    cache = JSON.parse(raw) as Record<string, VehicleDimensions>;
    return cache;
  } catch (err) {
    console.error("[dimensions] failed to load ymm_dimensions.json", err);
    cache = {};
    return cache;
  }
}

/**
 * Build the lookup key used in ymm_dimensions.json: "<year>|<Make>|<Model>".
 * Make/model casing must match the build script's normalize_make() output.
 */
function dimKey(vehicle: { year: number | string; make: string; model: string }): string {
  return `${vehicle.year}|${vehicle.make}|${vehicle.model}`;
}

/**
 * Return the dimension lists for the given vehicle. Falls back to EMPTY
 * (all-empty arrays) when the YMM is not in the index — caller should
 * decide what to do (skip the picker, render generic, etc.).
 */
export function getDimensionsForVehicle(
  vehicle: { year: number | string; make: string; model: string } | null | undefined,
): VehicleDimensions {
  if (!vehicle) return EMPTY;
  const idx = load();
  const exact = idx[dimKey(vehicle)];
  if (exact) return exact;
  // Casing tolerance: try title-cased and uppercased make
  const tries = [
    dimKey({ ...vehicle, make: vehicle.make.toUpperCase() }),
    dimKey({ ...vehicle, make: vehicle.make[0]?.toUpperCase() + vehicle.make.slice(1).toLowerCase() }),
  ];
  for (const k of tries) {
    if (idx[k]) return idx[k];
  }
  return EMPTY;
}

/**
 * Return only the dimensions for the requested groups (used by
 * collection page server component to know which pickers to render).
 * If the requested group is empty for this vehicle, the caller knows
 * to skip that picker entirely.
 */
export function getDimensionOptions(
  vehicle: { year: number | string; make: string; model: string } | null | undefined,
  group: SubModelGroup,
): string[] {
  const d = getDimensionsForVehicle(vehicle);
  switch (group) {
    case "bed_length":
      return d.bedLengths;
    case "cab_type":
      return d.cabTypes;
    case "trim":
      return d.trims;
    case "doors":
      return d.doors;
    default:
      return [];
  }
}
