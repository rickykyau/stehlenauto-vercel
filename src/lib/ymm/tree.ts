import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";

type YmmTree = Record<string, Record<string, Record<string, string[]>>>;

let cached: YmmTree | null = null;

async function load(): Promise<YmmTree> {
  if (cached) return cached;
  const file = path.join(process.cwd(), "data", "ymm_tree.json");
  const raw = await fs.readFile(file, "utf8");
  const tree = JSON.parse(raw) as YmmTree;

  // Cycle 14i (Mike-9 BLOCKER F-16): the auto-built tree only has Ram
  // entries for 1994-2009 because Ram products tagged for 2010+ use a tag
  // schema the tree builder didn't pick up. Catalog has 50+ Ram tonneau /
  // hitch / running-board SKUs covering 2009-2026, but a Ram owner can't
  // register a garage. Inject Ram 1500 / 2500 / 3500 for the missing years
  // so the YMM modal works while the tree builder is fixed properly.
  for (let y = 2010; y <= 2026; y++) {
    const year = String(y);
    if (!tree[year]) tree[year] = {};
    if (!tree[year]["Ram"]) tree[year]["Ram"] = {};
    for (const model of ["1500", "2500", "3500"]) {
      if (!tree[year]["Ram"][model]) tree[year]["Ram"][model] = [];
    }
  }

  cached = tree;
  return cached;
}

export async function getYears(): Promise<string[]> {
  const tree = await load();
  return Object.keys(tree).sort((a, b) => Number(b) - Number(a));
}

export async function getMakes(year: string): Promise<string[]> {
  const tree = await load();
  return Object.keys(tree[year] ?? {}).sort();
}

export async function getModels(year: string, make: string): Promise<string[]> {
  const tree = await load();
  return Object.keys(tree[year]?.[make] ?? {}).sort();
}

export async function vehicleExists(
  year: string,
  make: string,
  model: string,
): Promise<boolean> {
  const tree = await load();
  return Boolean(tree[year]?.[make]?.[model]);
}
