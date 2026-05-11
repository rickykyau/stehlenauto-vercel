import "server-only";
import fs from "node:fs";
import path from "node:path";

/**
 * Cycle 14AR-fix32 (owner): per-application fitment lookup keyed by product
 * handle. Source of truth: data/fitment_by_handle.json — built by inverting
 * data/products_by_ymm.json (which is built from CA fitment data via
 * scripts/build-ymm-index.py).
 *
 * Why this exists: the previous flat-list metafield schema (years/makes/
 * models as independent arrays) lost cross-product validity. A product that
 * fit "2019-2022 Civic + 2018-2024 Accord" projected to:
 *   years: [2018..2024]
 *   makes: [Honda]
 *   models: [Civic, Accord]
 * Then checkFitment would falsely confirm "2024 Civic" because every list
 * had a hit independently. Per-application records preserve the YxMxM
 * coupling: we ask "is the exact (year, make, model) triple in this
 * product's application list?" — no false positives possible.
 *
 * Applications are returned sorted (make, model, year ascending) so PDP
 * fitment table rendering can iterate without re-sorting.
 */

export type FitmentApplication = {
  year: string;
  make: string;
  model: string;
  submodel?: string;
};

let cache: Record<string, FitmentApplication[]> | null = null;

function load(): Record<string, FitmentApplication[]> {
  if (cache) return cache;
  try {
    const file = path.join(process.cwd(), "data", "fitment_by_handle.json");
    cache = JSON.parse(fs.readFileSync(file, "utf8")) as Record<
      string,
      FitmentApplication[]
    >;
    return cache;
  } catch (err) {
    console.error("[fitment/by-handle] failed to load index", err);
    cache = {};
    return cache;
  }
}

/**
 * Returns the canonical list of {year, make, model} applications this
 * product fits per CA fitment data. Empty array when handle isn't in
 * the index (catalog products without CA fitment yet).
 */
export function getApplicationsForHandle(handle: string): FitmentApplication[] {
  return load()[handle] ?? [];
}

/**
 * O(1) per-application verdict: is this exact (year, make, model) triple
 * one of the product's applications? Replaces the previous flat-list
 * checks which suffered from cross-product false positives.
 */
export function vehicleFitsHandle(
  handle: string,
  vehicle: { year: string | number; make: string; model: string },
): boolean {
  const apps = getApplicationsForHandle(handle);
  if (apps.length === 0) return false;
  const yearStr = String(vehicle.year);
  const makeLower = vehicle.make.toLowerCase();
  const modelLower = vehicle.model.toLowerCase();
  return apps.some(
    (a) =>
      a.year === yearStr &&
      a.make.toLowerCase() === makeLower &&
      a.model.toLowerCase() === modelLower,
  );
}
