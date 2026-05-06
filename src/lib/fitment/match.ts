import type { CatalogProduct } from "@/lib/catalog/types";

type Vehicle = {
  year: string | number;
  make: string;
  model: string;
};

type SubModelAnswer = {
  group: "bed_length" | "cab_type" | "trim" | "doors" | string;
  value: string;
};

/**
 * Cycle 12 (Mike F-5 BLOCKER): if the customer answered the bed-length or
 * cab-type sub-model question for this vehicle, the product title (e.g.
 * "2015-2024 Ford F-150 6.5 ft Bed Soft Roll-Up Tonneau Cover") must agree.
 * A 5.5ft-bed F-150 garage looking at a 6.5ft-bed tonneau used to get green
 * "CONFIRMED FITMENT" — direct brand-promise failure.
 *
 * Returns:
 *   true        — answer is unset OR product mentions a matching value
 *   false       — product mentions a DIFFERENT value (e.g. customer 5.5, product 6.5)
 *   "unknown"   — product mentions no bed-length/cab-type token at all
 *                 (universal-fit / silent-on-attribute → don't flip a positive
 *                 fit to false)
 */
function subModelGateAllows(
  product: { title: string; fitTitle?: string; vehicleTags?: string[] },
  answers: SubModelAnswer[] | null | undefined,
): true | false | "unknown" {
  if (!answers || answers.length === 0) return true;
  const text = [product.title, product.fitTitle ?? "", ...(product.vehicleTags ?? [])]
    .join(" ")
    .toLowerCase();

  // Bed-length: detect "5.5 ft", "5'5\"", "65 inch", etc. Normalize to "5.5".
  // Cycle 14i (Mike-9 BLOCKER F-17): the chip vocab is 5'/5.5'/6.5'/8' but
  // catalog product titles use the as-built dimension (5.8 ft, 6.6 ft). Strict
  // equality flipped collection-green Sierra products to RED on PDP. Bucket
  // the comparison so 5.5' chip accepts 5.5–5.9 ft products ("short bed"),
  // 6.5' chip accepts 6.0–6.9 ft ("standard bed"), 8' chip accepts ≥7.5 ft
  // ("long bed"), 5' chip accepts 4.5–5.4 ft ("compact short bed").
  const bedAns = answers.find((a) => a.group === "bed_length");
  if (bedAns) {
    const wantBucket = bedLengthBucket(normalizeBedLength(bedAns.value));
    const found = extractBedLengths(text);
    if (found.length === 0) {
      // product silent on bed length — universal candidate, don't fail
    } else if (!found.some((f) => bedLengthBucket(f) === wantBucket)) {
      return false;
    }
  }

  // Cab-type: detect "supercrew", "crew cab", "supercab", "regular cab", etc.
  const cabAns = answers.find((a) => a.group === "cab_type");
  if (cabAns) {
    const want = normalizeCab(cabAns.value);
    const found = extractCabs(text);
    if (found.length === 0) {
      // silent → universal candidate
    } else if (!found.some((f) => f === want)) {
      return false;
    }
  }

  return true;
}

function normalizeBedLength(s: string): string {
  // "5.5 ft" / "5'5"" / "5.5'" → "5.5"
  const m = s.toLowerCase().match(/(\d+(?:\.\d+)?)/);
  return m ? m[1] : s.toLowerCase();
}

/**
 * Cycle 14i (Mike-9 F-17): industry-standard bed-length buckets. Customer
 * picks a chip that maps to a bucket; product's actual ft figure is bucketed
 * the same way. Equal buckets = same family of bed.
 *   compact:  4.5 – 5.4 ft   (chip "5'")
 *   short:    5.5 – 5.9 ft   (chip "5.5'") — covers 5.5/5.7/5.8 catalog labels
 *   standard: 6.0 – 6.9 ft   (chip "6.5'") — covers 6.4/6.5/6.6/6.8
 *   long:     ≥ 7.5 ft       (chip "8'")
 */
function bedLengthBucket(value: string): string {
  const ft = parseFloat(value);
  if (!Number.isFinite(ft)) return value;
  if (ft >= 7.5) return "long";
  if (ft >= 6.0) return "standard";
  if (ft >= 5.5) return "short";
  if (ft >= 4.5) return "compact";
  return value;
}

function extractBedLengths(text: string): string[] {
  const out = new Set<string>();
  // Patterns like "5.5 ft", "5.5ft", "5.5'", "5.5 foot", "65 inch" (60→5, 66→5.5, 78→6.5, 96→8)
  const ftRe = /(\d+(?:\.\d+)?)\s*(?:ft|'|foot|feet)\s*bed/gi;
  let m;
  while ((m = ftRe.exec(text)) !== null) out.add(m[1]);
  // bare ft numbers near "bed"
  const ftRe2 = /(\d+(?:\.\d+)?)\s*ft\b/gi;
  while ((m = ftRe2.exec(text)) !== null) out.add(m[1]);
  return Array.from(out);
}

function normalizeCab(s: string): string {
  return s.toLowerCase().replace(/[\s-]+/g, "");
}

function extractCabs(text: string): string[] {
  const out = new Set<string>();
  const patterns = [
    /super\s?crew/gi,
    /super\s?cab/gi,
    /crew\s?cab/gi,
    /quad\s?cab/gi,
    /extended\s?cab/gi,
    /double\s?cab/gi,
    /regular\s?cab/gi,
    /mega\s?cab/gi,
    /access\s?cab/gi,
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(text)) !== null) out.add(normalizeCab(m[0]));
  }
  return Array.from(out);
}

const STOP = new Set([
  "the",
  "and",
  "for",
  "with",
  "of",
  "by",
  "to",
  "fits",
  "fit",
  "all",
  "new",
  "oem",
  "led",
  "hd",
  "duty",
  "heavy",
  "1500",
  "2500",
  "3500",
]);

const MAKE_ALIASES: Record<string, string[]> = {
  ford: ["ford"],
  chevrolet: ["chevrolet", "chevy", "silverado"],
  chevy: ["chevrolet", "chevy", "silverado"],
  gmc: ["gmc", "sierra"],
  ram: ["ram", "dodge"],
  dodge: ["ram", "dodge"],
  toyota: ["toyota"],
  jeep: ["jeep"],
  honda: ["honda"],
  nissan: ["nissan"],
  hyundai: ["hyundai"],
  kia: ["kia"],
  tesla: ["tesla"],
  lexus: ["lexus", "toyota"],
  mazda: ["mazda"],
};

function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s\-]/g, " ")
    .split(/[\s\-]+/)
    .filter((t) => t.length > 0 && !STOP.has(t));
}

function expandYears(text: string): Set<string> {
  const years = new Set<string>();
  const rangeRe = /\b(19|20)(\d{2})\s*[–\-]\s*(19|20)?(\d{2})\b/g;
  let m: RegExpExecArray | null;
  while ((m = rangeRe.exec(text)) !== null) {
    const a = parseInt(`${m[1]}${m[2]}`, 10);
    const tail = m[4];
    const cenB = m[3] ?? m[1];
    const b = parseInt(`${cenB}${tail}`, 10);
    if (Number.isFinite(a) && Number.isFinite(b) && b >= a && b - a < 30) {
      for (let y = a; y <= b; y++) years.add(String(y));
    }
  }
  const singleRe = /\b(19|20)\d{2}\b/g;
  while ((m = singleRe.exec(text)) !== null) {
    years.add(m[0]);
  }
  return years;
}

/**
 * Fitment check used everywhere we render a product card / cart line /
 * similar-products rail.
 *
 *   true       — structured make/model/year tags match (or title-string fallback)
 *   false      — title or tags name a different make/model with no overlap
 *   undefined  — can't tell (the safe default; UI shows neutral "CHECK FITMENT")
 */
export function checkFitment(
  product: Pick<CatalogProduct, "title" | "fitTitle" | "vehicleTags">,
  vehicle: Vehicle | null | undefined,
  subModelAnswers?: SubModelAnswer[] | null,
): boolean | undefined {
  if (!vehicle) return undefined;
  // Cycle 12 (Mike F-5 BLOCKER): if year+make+model would say true but the
  // sub-model gate finds a contradicting bed-length / cab-type token in the
  // product title, that's a confirmed misfit — flip to false BEFORE the
  // positive return below.
  const subGate = subModelGateAllows(
    { title: product.title, fitTitle: product.fitTitle ?? undefined, vehicleTags: product.vehicleTags },
    subModelAnswers,
  );
  if (subGate === false) return false;

  // Structured tags (Shopify cycle-3 schema: `make:Jeep`, `model:Wrangler`,
  // `year:2014`) — ~49% of catalog. When present they're authoritative.
  const tags = product.vehicleTags ?? [];
  const tagSet = new Set(tags.map((t) => t.toLowerCase().trim()));
  if (tagSet.size > 0) {
    const wantMake = `make:${vehicle.make}`.toLowerCase();
    const wantModel = `model:${vehicle.model}`.toLowerCase();
    const wantYear = `year:${vehicle.year}`.toLowerCase();
    const hasAnyMake = [...tagSet].some((t) => t.startsWith("make:"));
    const hasAnyModel = [...tagSet].some((t) => t.startsWith("model:"));
    const hasAnyYear = [...tagSet].some((t) => t.startsWith("year:"));
    if (hasAnyMake && hasAnyModel && hasAnyYear) {
      if (tagSet.has(wantMake) && tagSet.has(wantModel) && tagSet.has(wantYear)) {
        return true;
      }
      // Structured tags exist but disagree → confident NO.
      return false;
    }
    // Partial tags — fall through to title parsing.
  }

  const haystack = [
    product.title ?? "",
    product.fitTitle ?? "",
    ...tags,
  ]
    .join(" | ")
    .toLowerCase();

  if (!haystack.trim()) return undefined;

  const makeKey = vehicle.make.toLowerCase();
  const makeAliases = MAKE_ALIASES[makeKey] ?? [makeKey];
  const modelToks = tokens(vehicle.model);
  const yearStr = String(vehicle.year);

  const hasMake = makeAliases.some((a) => haystack.includes(a));
  const hasModel = modelToks.every((t) => haystack.includes(t));
  const years = expandYears(haystack);
  const hasYear =
    years.size === 0 // listing didn't specify years -> treat as universal candidate
      ? true
      : years.has(yearStr);

  // Cycle 14c (Mike-3 F-7): "Universal" / "fits all" listings explicitly
  // claim broad compatibility — treat as positive fit regardless of model.
  // Earlier the Razor 1000/3000 universal chase rack flagged DOES NOT FIT
  // on a Tacoma garage despite "Universal" in the title.
  const isUniversal = /\b(universal[- ]fit|universal\s+fits?|fits?\s+all|fits?\s+most)\b/i.test(haystack);
  if (hasMake && hasModel && hasYear) return true;
  if (isUniversal && hasYear) return true;

  // Negative match: listing names a competing make+model that contains no
  // overlap with the customer's vehicle. Be conservative so we don't gate a
  // real fit; flip to false only when sure.
  const competingMakes = Object.keys(MAKE_ALIASES).filter(
    (k) => !makeAliases.includes(k) && haystack.includes(k),
  );
  if (competingMakes.length > 0 && !hasMake) return false;

  // Cycle 14c (Mike-3 F-3): same-make wrong-model is a confirmed misfit, not
  // an unknown. A Toyota Tundra tonneau on a Toyota Tacoma garage used to
  // show yellow CHECK FITMENT. Year doesn't have to match for this — the
  // model token alone proves it's a sibling product, not a universal one.
  if (hasMake && !hasModel) {
    // Per-make sibling model lists. If the title contains ANY of the listed
    // sibling model tokens for our customer's make, this is a confirmed
    // sibling-product mismatch, not silent-on-model.
    const siblingsByMake: Record<string, RegExp> = {
      toyota: /\b(tundra|tacoma|4runner|sequoia|fj cruiser|land cruiser|highlander|rav4|camry|corolla)\b/i,
      ford: /\b(f-150|f-250|f-350|f-450|ranger|bronco|maverick|escape|edge|explorer|expedition)\b/i,
      chevrolet: /\b(silverado|colorado|tahoe|suburban|equinox|traverse|blazer|trailblazer)\b/i,
      chevy: /\b(silverado|colorado|tahoe|suburban|equinox|traverse|blazer|trailblazer)\b/i,
      gmc: /\b(sierra|canyon|yukon|terrain|acadia)\b/i,
      ram: /\b(1500|2500|3500|promaster|dakota)\b/i,
      dodge: /\b(ram|durango|charger|challenger|journey)\b/i,
      jeep: /\b(wrangler|gladiator|cherokee|grand cherokee|compass|renegade|wagoneer)\b/i,
      honda: /\b(cr-v|crv|civic|accord|pilot|ridgeline|odyssey|hr-v)\b/i,
      nissan: /\b(frontier|titan|murano|pathfinder|rogue|sentra|altima)\b/i,
      tesla: /\b(model y|model 3|model s|model x|cybertruck)\b/i,
    };
    const re = siblingsByMake[makeKey];
    if (re && re.test(haystack)) return false;
  }

  return undefined;
}

/**
 * Convenience: re-paint a product list with `fits` resolved against a vehicle.
 * Returns a shallow copy; never mutates input.
 */
export function withFitment<
  T extends Pick<CatalogProduct, "title" | "fitTitle" | "vehicleTags" | "fits">,
>(products: T[], vehicle: Vehicle | null | undefined): T[] {
  if (!vehicle) return products;
  return products.map((p) => ({ ...p, fits: checkFitment(p, vehicle) }));
}
