import "server-only";
import fs from "node:fs";
import path from "node:path";

const RULES: Array<[string, RegExp]> = [
  ["tonneau-covers", /tonneau/],
  ["trailer-hitches", /trailer-hitch|hitch-step|hitch-cargo|wiring-harness/],
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

/**
 * Categories for a model family: "Silverado" covers "Silverado 1500",
 * "Silverado 2500 HD", … (hub URLs like /vehicle/chevrolet-silverado have no
 * exact key in the index).
 */
export function getAvailableCategoriesForModelFamily(
  make: string,
  model: string,
): { cats: Set<string>; from?: number; to?: number } {
  const idx = load();
  const mk = make.toLowerCase();
  const md = model.toLowerCase();
  const cats = new Set<string>();
  let from: number | undefined;
  let to: number | undefined;
  for (const key of Object.keys(idx)) {
    const [year, km, kmodel] = key.split("|");
    if (km?.toLowerCase() !== mk) continue;
    const m = kmodel?.toLowerCase() ?? "";
    if (m !== md && !m.startsWith(`${md} `)) continue;
    const y = Number(year);
    from = from === undefined ? y : Math.min(from, y);
    to = to === undefined ? y : Math.max(to, y);
    for (const h of idx[key] ?? []) {
      const cat = handleToCategory(h);
      if (cat) cats.add(cat);
    }
  }
  return { cats, from, to };
}

/** Every category with at least one product fitting any model of `make`. */
export function getAvailableCategoriesForMake(make: string): Set<string> {
  const idx = load();
  const m = make.toLowerCase();
  const found = new Set<string>();
  for (const key of Object.keys(idx)) {
    if (key.split("|")[1]?.toLowerCase() !== m) continue;
    for (const h of idx[key] ?? []) {
      const cat = handleToCategory(h);
      if (cat) found.add(cat);
    }
  }
  return found;
}

/** The make's spelling in the fitment index ("gmc" → "GMC"), if it has one. */
export function canonicalMakeName(make: string): string | undefined {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");
  const m = norm(make);
  for (const key of Object.keys(load())) {
    const name = key.split("|")[1];
    if (name && norm(name) === m) return name;
  }
  return undefined;
}

const SHORT_LABEL: Record<string, string> = {
  "tonneau-covers": "tonneau covers",
  "trailer-hitches": "trailer hitches",
  "bull-guards-grille-guards": "bull guards",
  "front-grilles": "grilles",
  headlights: "headlights",
  "truck-bed-mats": "bed mats",
  "running-boards-side-steps": "running boards",
  "floor-mats": "floor mats",
  "roof-racks-baskets": "roof racks",
  "chase-racks-sport-bars": "chase racks",
  "molle-panels": "MOLLE panels",
};

/**
 * Meta description for a vehicle or make page, naming the categories that
 * actually fit it (Bing flags the old one-line template as too short). Drops
 * categories until it fits in a SERP snippet.
 */
export function fittedCategoriesDescription(cats: Set<string>, subject: string): string {
  const labels = Object.keys(SHORT_LABEL)
    .filter((slug) => cats.has(slug))
    .map((slug) => SHORT_LABEL[slug]!);
  const tail = "Matched to your exact year before checkout. Free shipping, 30-day returns.";
  // Pages with one or two categories come out short; spend the room on a
  // fuller version of the same promise instead.
  const longTail =
    "Every part is matched to your exact year before checkout, with free shipping and 30-day free returns.";
  const withTail = (lead: string) => {
    const long = `${lead} ${longTail}`;
    return long.length <= 160 ? long : `${lead} ${tail}`;
  };
  for (let n = Math.min(labels.length, 4); n >= 1; n--) {
    const list = labels.slice(0, n);
    const joined =
      list.length > 1 ? `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}` : list[0]!;
    const text = withTail(`${joined[0]!.toUpperCase()}${joined.slice(1)} for ${subject}.`);
    if (text.length <= 160) return text;
  }
  return withTail(`Accessories for ${subject}.`);
}
