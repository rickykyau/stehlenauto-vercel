import "server-only";
import fs from "node:fs";
import path from "node:path";

/**
 * Cycle 14AR-fix2 (QA-found BUG-14AR-3+4): canonical "what products fit
 * this YMM" lookup, sourced from data/products_by_ymm.json (built by
 * scripts/build-ymm-index.py from the CA fitment snapshot).
 *
 * Used by the collection page server component to ensure that EVERY
 * confirmed-fit product is shown to the customer — not just the slice
 * that happens to land in the top-N BEST_SELLING wide-pool fetch from
 * Shopify. Slow-selling but fitting products were systematically
 * invisible before this index was added (Lincoln Navigator bull guard
 * for F-150, low-volume CURT hitches, brand-new 2021+ grilles).
 *
 * Index shape: { "<year>|<Make>|<Model>": ["product-handle", ...] }
 *
 * The handles are CA snapshot keys — they MAY OR MAY NOT match a live
 * Shopify product handle 1:1. Callers must reconcile via
 * fetchProductsByHandles() and treat misses as "not in Shopify yet."
 */

let cache: Record<string, string[]> | null = null;

function load(): Record<string, string[]> {
  if (cache) return cache;
  try {
    const file = path.join(process.cwd(), "data", "products_by_ymm.json");
    const raw = fs.readFileSync(file, "utf8");
    cache = JSON.parse(raw) as Record<string, string[]>;
    return cache;
  } catch (err) {
    console.error("[products-by-ymm] failed to load index", err);
    cache = {};
    return cache;
  }
}

function dimKey(vehicle: { year: number | string; make: string; model: string }): string {
  return `${vehicle.year}|${vehicle.make}|${vehicle.model}`;
}

/**
 * Returns the canonical list of product handles that fit the given
 * vehicle per CA fitment data. Empty array when the YMM is unknown
 * (legitimately missing from CA snapshot, e.g., older Wrangler years).
 */
export function getProductHandlesForVehicle(
  vehicle: { year: number | string; make: string; model: string } | null | undefined,
): string[] {
  if (!vehicle) return [];
  const idx = load();
  const exact = idx[dimKey(vehicle)];
  if (exact) return exact;
  // Casing tolerance — same approach as dimensions.ts
  const tries = [
    dimKey({ ...vehicle, make: vehicle.make.toUpperCase() }),
    dimKey({
      ...vehicle,
      make:
        vehicle.make[0]?.toUpperCase() + vehicle.make.slice(1).toLowerCase(),
    }),
  ];
  for (const k of tries) {
    if (idx[k]) return idx[k];
  }
  return [];
}
