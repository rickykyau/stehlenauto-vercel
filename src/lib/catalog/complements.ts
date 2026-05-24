/**
 * Cycle 14BE-fix5 (Mike + Jordan + Marcus unanimous): "Complete the Build"
 * cross-sell. Maps each category to the 2-3 complementary categories a
 * customer is most likely to add to the same build.
 *
 * Hand-curated v1 based on auto-parts-specialist intuition + real-world
 * RealTruck / AmericanTrucks "complete your truck" patterns. v2 candidate:
 * derive from Shopify order-line co-occurrence once we have ≥300 orders.
 *
 * Keep the list short (2-3 max). More than that turns into noise and
 * suppresses click-through (per Marcus's RealTruck reference work).
 */

export type CategorySlug = string;

export const COMPLEMENT_MAP: Record<CategorySlug, CategorySlug[]> = {
  // Tonneau owner → bed protection + utility
  "tonneau-covers": ["truck-bed-mats", "bull-guards-grille-guards"],
  // Hitch owner → bed mats (for hauled gear) + lighting
  "trailer-hitches": ["truck-bed-mats", "headlights"],
  // Bull guard owner → matching grille + lighting upgrade
  "bull-guards-grille-guards": ["front-grilles", "headlights"],
  // Front grille upgrade → matching bull guard + LED headlights
  "front-grilles": ["bull-guards-grille-guards", "headlights"],
  // LED headlights → grille refresh + bull guard
  headlights: ["front-grilles", "bull-guards-grille-guards"],
  // Bed mat owner → tonneau + tailgate protection (via hitch)
  "truck-bed-mats": ["tonneau-covers", "trailer-hitches"],
  // Running boards/side steps → matching bull guard + floor mats
  "running-boards-side-steps": [
    "bull-guards-grille-guards",
    "floor-mats",
  ],
  // Floor mats → running boards (interior + entry complete) + bed mat
  "floor-mats": ["running-boards-side-steps", "truck-bed-mats"],
  // Roof rack → chase rack + molle (cargo system buildout)
  "roof-racks-baskets": ["chase-racks-sport-bars", "molle-panels"],
  "chase-racks-sport-bars": ["roof-racks-baskets", "molle-panels"],
  "molle-panels": ["roof-racks-baskets", "chase-racks-sport-bars"],
  // Under-seat storage → floor mats + bed mat (interior + storage complete)
  "under-seat-storage": ["floor-mats", "truck-bed-mats"],
};

/**
 * Return the complementary category slugs for a given product's category.
 * Empty array when the category isn't mapped (universal SKUs etc.).
 */
export function complementsFor(category: string | null | undefined): string[] {
  if (!category) return [];
  return COMPLEMENT_MAP[category] ?? [];
}
