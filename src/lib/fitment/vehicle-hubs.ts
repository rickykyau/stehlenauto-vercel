import "server-only";
import fs from "node:fs";
import path from "node:path";

/**
 * Vehicle hub pages (/vehicle/<make>-<model>) we want indexed: every make +
 * model with at least MIN_PARTS fitting products in the CA-built fitment
 * index (data/products_by_ymm.json). Names come from the index, so titles
 * read "Ford F-250 Super Duty" / "Acura MDX" instead of being guessed from
 * the URL.
 */

export type VehicleHub = {
  make: string;
  model: string;
  slug: string;
  from: number;
  to: number;
  /** Fitting products — used for ranking only, never shown (stakeholder rule). */
  parts: number;
};

const MIN_PARTS = 10;

export function vehicleSlug(make: string, model: string): string {
  return `${make}-${model}`
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

let all: VehicleHub[] | null = null;

/** Every make + model in the fitment index (any part count). */
function allVehicles(): VehicleHub[] {
  if (all) return all;
  let index: Record<string, string[]> = {};
  try {
    index = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "products_by_ymm.json"), "utf8"));
  } catch (err) {
    console.error("[vehicle-hubs] failed to load index", err);
  }
  const agg = new Map<string, { make: string; model: string; years: number[]; handles: Set<string> }>();
  for (const [key, handles] of Object.entries(index)) {
    const [year, make, model] = key.split("|");
    if (!make || !model) continue;
    const k = `${make}|${model}`;
    let a = agg.get(k);
    if (!a) agg.set(k, (a = { make, model, years: [], handles: new Set() }));
    a.years.push(Number(year));
    for (const h of handles) a.handles.add(h);
  }
  all = [...agg.values()]
    .map((a) => ({
      make: a.make,
      model: a.model,
      slug: vehicleSlug(a.make, a.model),
      from: Math.min(...a.years),
      to: Math.max(...a.years),
      parts: a.handles.size,
    }))
    .sort((x, y) => x.make.localeCompare(y.make) || x.model.localeCompare(y.model, undefined, { numeric: true }));
  return all;
}

/** Hubs worth indexing (sitemap, /vehicles): MIN_PARTS+ fitting products. */
export function getVehicleHubs(): VehicleHub[] {
  return allVehicles().filter((v) => v.parts >= MIN_PARTS);
}

/** Exact make/model names for a /vehicle slug, if the catalog has it. */
export function findVehicle(slug: string): VehicleHub | undefined {
  const s = slug.toLowerCase();
  return allVehicles().find((v) => v.slug === s);
}
