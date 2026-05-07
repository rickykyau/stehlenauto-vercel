/**
 * scripts/build-sibling-index.ts
 *
 * Reads data/ca_fitment_snapshot.json (CA-sync output) and emits
 * data/sibling_index.json — a static lookup mapping each product's CB
 * Item Name to its bed-length siblings (other products in the same
 * family that differ only in bed length).
 *
 * Family key derivation:
 *   CB Item Name `TC-F15015-6.5-LRU` →
 *     prefix = "TC-F15015"
 *     bedLen = "6.5"
 *     suffix = "LRU"
 *   Family = "TC-F15015|LRU"
 *
 * Combo SKUs (with `+`) keep the suffix intact:
 *   `TC-F15015-6.5-LRU+TBL-16W8P-01` → family "TC-F15015|LRU+TBL-16W8P-01"
 *   So the LED-combo variant only siblings other LED-combo bed lengths.
 *
 * Output shape (keyed by handle so PDP lookup is O(1)):
 *
 *   {
 *     "<handle>": {
 *       "currentBedLength": "6.5",
 *       "siblings": [
 *         { "bedLength": "5.5", "handle": "...", "cbItemName": "..." },
 *         { "bedLength": "8", "handle": "...", "cbItemName": "..." }
 *       ]
 *     }
 *   }
 *
 * Usage:
 *   pnpm tsx scripts/build-sibling-index.ts
 */
import { promises as fs } from "node:fs";
import path from "node:path";

const SNAPSHOT = path.join(process.cwd(), "data", "ca_fitment_snapshot.json");
const OUTPUT = path.join(process.cwd(), "data", "sibling_index.json");

const FAMILY_RE = /^([A-Z0-9-]+)-(\d+(?:\.\d+)?)-([A-Z0-9+\-_]+)$/i;

type SnapshotEntry = {
  cbItemName?: string;
  status?: string;
};

type Sibling = {
  bedLength: string;
  handle: string;
  cbItemName: string;
};

type Index = Record<
  string,
  { currentBedLength: string; siblings: Sibling[] }
>;

async function main() {
  const raw = await fs.readFile(SNAPSHOT, "utf-8");
  const snapshot = JSON.parse(raw) as Record<string, SnapshotEntry>;

  // First pass: bucket products by family key.
  type Member = { handle: string; cbItemName: string; bedLength: string };
  const families = new Map<string, Member[]>();

  for (const [handle, entry] of Object.entries(snapshot)) {
    if (entry.status !== "synced") continue;
    const cb = entry.cbItemName?.trim();
    if (!cb) continue;
    const m = cb.match(FAMILY_RE);
    if (!m) continue;
    const [, prefix, bedLen, suffix] = m;
    const family = `${prefix.toUpperCase()}|${suffix.toUpperCase()}`;
    if (!families.has(family)) families.set(family, []);
    families.get(family)!.push({ handle, cbItemName: cb, bedLength: bedLen });
  }

  // Second pass: emit per-product sibling lists. Skip families with one
  // member (no siblings to switch to). Sort siblings ascending by bedLen.
  const index: Index = {};
  let withSiblingsCount = 0;
  for (const [, members] of families) {
    if (members.length < 2) continue;
    const sortedMembers = [...members].sort(
      (a, b) => parseFloat(a.bedLength) - parseFloat(b.bedLength),
    );
    for (const me of sortedMembers) {
      const siblings = sortedMembers
        .filter((m) => m.handle !== me.handle)
        .map((m) => ({
          bedLength: m.bedLength,
          handle: m.handle,
          cbItemName: m.cbItemName,
        }));
      index[me.handle] = {
        currentBedLength: me.bedLength,
        siblings,
      };
      withSiblingsCount++;
    }
  }

  await fs.writeFile(OUTPUT, JSON.stringify(index, null, 2));
  console.log(
    `Sibling index built: ${withSiblingsCount} products with bed-length variants across ${families.size} families.`,
  );
  console.log(`Written to ${OUTPUT}`);
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
