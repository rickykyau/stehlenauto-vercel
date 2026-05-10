import "server-only";
import fs from "node:fs";
import path from "node:path";

const RULES: Array<[string, RegExp]> = [
  ["tonneau-covers", /tonneau/],
  ["trailer-hitches", /trailer-hitch|hitch-step|hitch-cargo/],
  ["bull-guards-grille-guards", /bull-guard|grille-guard|brush-guard/],
  ["front-grilles", /(?<!grille-)grille(?!-guard)|front-grill\b|badgeless/],
  ["headlights", /headlight|projector-light/],
  ["truck-bed-mats", /bed-(rubber-)?mat|bed-rug/],
  [
    "running-boards-side-steps",
    /running-board|side-step|step-bar|nerf-bar|drop-step/,
  ],
  ["floor-mats", /floor-mat|floor-liner/],
  ["roof-racks-baskets", /roof-rack|roof-basket|cargo-basket/],
  ["chase-racks-sport-bars", /chase-rack|sport-bar|roll-bar/],
  ["molle-panels", /molle/],
];

let cache: Record<string, string[]> | null = null;

function load(): Record<string, string[]> {
  if (cache) return cache;
  try {
    const file = path.join(process.cwd(), "data", "products_by_ymm.json");
    cache = JSON.parse(fs.readFileSync(file, "utf8")) as Record<string, string[]>;
    return cache;
  } catch (err) {
    console.error("[vehicle-categories] failed to load index", err);
    cache = {};
    return cache;
  }
}

function handleToCategory(handle: string): string | null {
  for (const [slug, pat] of RULES) {
    if (pat.test(handle)) return slug;
  }
  return null;
}

export function getAvailableCategoriesForVehicle(
  year: string | number,
  make: string,
  model: string,
): Set<string> {
  const idx = load();
  // Cycle 14AR-fix30 (Ren R18 P1): URL slug "wrangler-jl" parses to model
  // "Wrangler JL", but CA data may only have the "Wrangler" key (without the
  // trailing generation initialism). Try the exact model first, then
  // progressively strip trailing 2-3-letter tokens so we still hit the
  // canonical key. Same idea covers "Sierra 1500 Limited" → "Sierra 1500".
  const candidates = [model];
  const tokens = model.split(" ");
  if (tokens.length > 1 && /^[A-Z]{2,3}$/.test(tokens[tokens.length - 1] ?? "")) {
    candidates.push(tokens.slice(0, -1).join(" "));
  }
  let handles: string[] = [];
  for (const m of candidates) {
    const list = idx[`${year}|${make}|${m}`] ?? [];
    if (list.length > 0) {
      handles = list;
      break;
    }
  }
  const found = new Set<string>();
  for (const h of handles) {
    const cat = handleToCategory(h);
    if (cat) found.add(cat);
  }
  return found;
}

export function getAvailableCategoriesForMakeModel(
  make: string,
  model: string,
): Set<string> {
  const idx = load();
  const suffix = `|${make}|${model}`;
  const found = new Set<string>();
  for (const key of Object.keys(idx)) {
    if (!key.endsWith(suffix)) continue;
    for (const h of idx[key] ?? []) {
      const cat = handleToCategory(h);
      if (cat) found.add(cat);
    }
  }
  return found;
}
