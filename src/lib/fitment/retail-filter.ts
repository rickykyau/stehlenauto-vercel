/**
 * Cycle 14AR-fix2 (QA-found BUG-14AR-2): retail-shopper trim filter
 * applied at RENDER time on the PDP VEHICLE COMPATIBILITY table.
 *
 * Stehlen sells to retail consumers modifying personal trucks/SUVs/Jeeps —
 * landscapers, mechanics, weekend builders. The CA fitment metafield
 * holds raw ACES data including fleet/government variants (SSV, Police
 * Responder, Pursuit, Special Service) and foreign-market trims (Edicion
 * Especial, Doble Cabina, GT Milenio) that don't belong in front of our
 * audience.
 *
 * Cycle 14AQ added the same blocklist to scripts/build-ymm-index.py so
 * data/ymm_dimensions.json (fueling the picker) excludes them. This
 * module is the TypeScript counterpart for any RUNTIME render that
 * pulls subattributes directly from product.fitmentTable instead of
 * the pre-filtered ymm_dimensions index.
 *
 * Keep the two blocklists in sync. If a new fleet/foreign trim appears,
 * add it BOTH here and in scripts/build-ymm-index.py.
 */

const FLEET_TRIM_BLOCKLIST = new Set([
  "ssv",
  "special service",
  "police",
  "police responder",
  "police interceptor",
  "police pursuit",
  "pursuit",
  "taxi",
  "cab forward",
  "cab & chassis",
  "stripped chassis",
  "commercial",
  "crew cab stripped chassis",
]);

const FOREIGN_MARKET_TRIM_BLOCKLIST = new Set([
  "edicion especial",
  "edicion limitada",
  "edicion",
  "wt doble cabina",
  "doble cabina",
  "cabina doble",
  "gt milenio",
  "milenio",
  "sport tipo r",
  "tipo r",
]);

const STARTS_WITH_FLEET = [
  "ssv",
  "police ",
  "pursuit",
  "edicion ",
  "doble cabina",
  "cabina doble",
  "special service",
  "milenio",
];

/**
 * True if this trim string should be shown to a retail shopper.
 *
 * Tests:
 *  isRetailTrim("XL")             → true
 *  isRetailTrim("Lariat")         → true
 *  isRetailTrim("Denali")         → true
 *  isRetailTrim("SSV")            → false
 *  isRetailTrim("Police Responder") → false
 *  isRetailTrim("Edicion Especial") → false
 *  isRetailTrim("WT Doble Cabina")  → false
 */
export function isRetailTrim(trim: string): boolean {
  if (!trim || typeof trim !== "string") return false;
  const lower = trim.trim().toLowerCase();
  if (!lower) return false;
  if (lower.length > 60) return false;
  if (FLEET_TRIM_BLOCKLIST.has(lower)) return false;
  if (FOREIGN_MARKET_TRIM_BLOCKLIST.has(lower)) return false;
  for (const prefix of STARTS_WITH_FLEET) {
    if (lower === prefix.trim() || lower.startsWith(prefix)) return false;
  }
  return true;
}

/**
 * Filter a fitment subattribute array, dropping fleet/foreign-market
 * entries that don't belong in front of retail consumers. Used by the
 * PDP fitment table renderer to clean trims and submodels.
 *
 * For submodels (e.g. "Police Responder Crew Cab Pickup 4-Door"), the
 * leading words usually carry the trim — check the start of the string
 * against fleet keywords.
 */
export function filterRetailValues(
  values: string[] | undefined | null,
): string[] {
  if (!values) return [];
  return values.filter((v) => isRetailTrim(v));
}
