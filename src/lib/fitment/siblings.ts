import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * Cycle 14X+ post-sync (owner: bed-length chip should switch products):
 * The PDP buy-box bed-length chip strip used to be a sub-model PREFERENCE
 * picker — clicking "5.5' BED" on a 6.5' tonneau just saved the customer's
 * truck spec, then tripped DOES NOT FIT, leaving them confused with no
 * path to the 5.5' product. This index makes the chip a real variant
 * picker: clicking 5.5' BED navigates to the sibling product whose CB
 * Item Name only differs by bed length.
 *
 * Source: data/sibling_index.json built from the CA-sync snapshot by
 * scripts/build-sibling-index.ts. Re-run that script after every CA
 * fitment sync.
 */
export type Sibling = {
  bedLength: string;
  handle: string;
  cbItemName: string;
};

export type SiblingEntry = {
  currentBedLength: string;
  siblings: Sibling[];
};

let cached: Record<string, SiblingEntry> | null = null;

async function loadIndex(): Promise<Record<string, SiblingEntry>> {
  if (cached) return cached;
  const file = path.join(process.cwd(), "data", "sibling_index.json");
  try {
    const raw = await fs.readFile(file, "utf-8");
    cached = JSON.parse(raw) as Record<string, SiblingEntry>;
  } catch {
    cached = {};
  }
  return cached;
}

/**
 * Look up bed-length siblings for a product by Shopify handle. Returns
 * null when the product has no siblings (single-bed family or universal
 * product with no bed dimension).
 */
export async function getBedLengthSiblings(
  handle: string,
): Promise<SiblingEntry | null> {
  const idx = await loadIndex();
  return idx[handle] ?? null;
}
