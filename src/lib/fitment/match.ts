import type { CatalogProduct, FitmentTable } from "@/lib/catalog/types";

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
 * Cycle 14AA (Mike-O14AA F-2 MAJOR): also returns "needs_pick" when the
 * product mentions a sub-model attribute (bed length or cab type) but the
 * customer hasn't answered that question yet. Without this, a 6.5'-bed
 * tonneau showed green "FITS YOUR 2021 FORD F-150" before the customer
 * picked their bed length — a false-positive that read as deceptive.
 *
 * Returns:
 *   true          — answer + product agree, OR product silent on all subs
 *   false         — product mentions a DIFFERENT value than customer answer
 *   "needs_pick"  — product mentions a sub-model attr but customer hasn't
 *                   answered yet (caller surfaces "Likely fit — confirm X")
 */
function subModelGateAllows(
  product: { title: string; fitTitle?: string; vehicleTags?: string[] },
  answers: SubModelAnswer[] | null | undefined,
): true | false | "needs_pick" {
  const text = [product.title, product.fitTitle ?? "", ...(product.vehicleTags ?? [])]
    .join(" ")
    .toLowerCase();

  const bedAns = answers?.find((a) => a.group === "bed_length");
  const cabAns = answers?.find((a) => a.group === "cab_type");
  const trimAns = answers?.find((a) => a.group === "trim");
  const productBeds = extractBedLengths(text);
  const productCabs = extractCabs(text);
  const productTrims = extractTrims(text);

  // Bed-length gate
  if (bedAns) {
    const wantBucket = bedLengthBucket(normalizeBedLength(bedAns.value));
    if (productBeds.length === 0) {
      // product silent on bed length — universal candidate, don't fail
    } else if (!productBeds.some((f) => bedLengthBucket(f) === wantBucket)) {
      return false;
    }
  } else if (productBeds.length > 0) {
    // Product is bed-length-specific (e.g. "6.5 ft Bed Tonneau Cover") but
    // the customer hasn't picked a bed length yet — surface as "likely fit,
    // confirm bed length" rather than green "fits your truck."
    return "needs_pick";
  }

  // Cab-type gate
  if (cabAns) {
    const want = normalizeCab(cabAns.value);
    if (productCabs.length === 0) {
      // silent → universal candidate
    } else if (!productCabs.some((f) => f === want)) {
      return false;
    }
  } else if (productCabs.length > 0) {
    return "needs_pick";
  }

  // Cycle 14AO-fix2 (Sam gap 3): trim gate. Identical structure to bed/
  // cab — silent-on-trim products survive as universal candidates;
  // products that name a competing trim bucket fail; products that
  // mention any trim while the customer hasn't picked one promote to
  // needs_pick. Buckets: base / mid / heavy (see extractTrims).
  if (trimAns) {
    const wantBucket = trimBucket(trimAns.value);
    if (productTrims.length === 0) {
      // silent → universal
    } else if (!productTrims.some((f) => f === wantBucket)) {
      return false;
    }
  } else if (productTrims.length > 0) {
    return "needs_pick";
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

/**
 * Cycle 14AO-fix2 (Sam audit gap 3): bull-guards-grille-guards and
 * front-grilles use "trim" as the gating sub-model with chip vocab
 * "BASE / MID / HEAVY-DUTY". Without this parser, products that don't
 * carry a populated `custom.fitment_subattributes.trims` metafield
 * sailed through the gate as universal candidates regardless of trim
 * answer — making the trim DimensionPicker visually functional but
 * the underlying filter a silent no-op for most of the catalog.
 *
 * Bucket vocabulary mirrors how the merch team labels SKUs in titles:
 *   base      — words like "base", "standard", "OE", "stock", "factory"
 *   mid       — "mid", "midline", "trail", "off-road" (mid-tier trim
 *               packages that share a mounting pattern)
 *   heavy     — "heavy duty", "hd", "advance series", "max", "pro",
 *               "platinum", "limited", "denali", "rebel", "raptor",
 *               "trd pro", "trail boss" (heavy/premium trim packages)
 *
 * If the title contains no trim vocabulary, returns []; the gate then
 * treats the product as silent-on-trim (universal candidate). Same
 * "needs_pick" logic as bed_length / cab_type applies.
 */
function normalizeTrim(s: string): string {
  return s.toLowerCase().trim().replace(/[\s-]+/g, "-");
}

function extractTrims(text: string): string[] {
  const out = new Set<string>();
  const patterns: { re: RegExp; bucket: "base" | "mid" | "heavy" }[] = [
    // Heavy / premium trim packages (most specific first to win in
    // alternation; "advance series" before bare "advance" etc.)
    { re: /\b(heavy[\s-]?duty|hd)\b/gi, bucket: "heavy" },
    { re: /\badvance[\s-]series\b/gi, bucket: "heavy" },
    { re: /\b(max|pro|platinum|limited|denali|rebel|raptor)\b/gi, bucket: "heavy" },
    { re: /\btrd[\s-]pro\b/gi, bucket: "heavy" },
    { re: /\btrail[\s-]boss\b/gi, bucket: "heavy" },
    // Mid trim packages
    { re: /\b(midline|mid[\s-]tier|mid)\b/gi, bucket: "mid" },
    { re: /\b(trail|off[\s-]road|offroad)\b/gi, bucket: "mid" },
    // Base / OE
    { re: /\b(base|standard|oe|stock|factory)\b/gi, bucket: "base" },
  ];
  for (const { re, bucket } of patterns) {
    if (re.test(text)) out.add(bucket);
  }
  return Array.from(out);
}

function trimBucket(value: string): string {
  const v = value.toLowerCase().trim();
  if (/heavy|hd|advance|max|pro|platinum|limited|denali|rebel|raptor|trd|boss/.test(v)) {
    return "heavy";
  }
  if (/mid|trail|off[\s-]?road/.test(v)) return "mid";
  if (/base|standard|oe|stock|factory/.test(v)) return "base";
  return normalizeTrim(value);
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

// Cycle 14AP-fix5 (owner-found, prod): owner saw 2 Volkswagen Touareg
// grilles in the F-150 grid on /collections/front-grilles. Root cause:
// Volkswagen wasn't in MAKE_ALIASES, so the "competing make" check at
// line ~530 returned an empty list; checkFitment fell through to
// undefined (universal candidate) instead of false (confirmed
// mismatch). The Shopify front-grilles collection contains plenty of
// non-truck makes (VW, Audi, BMW, Mercedes, Subaru, Land Rover) — they
// MUST be detectable so checkFitment can drop them from a Ford F-150
// customer's grid.
//
// Added the European/luxury/non-truck makes most likely to appear in a
// truck-accessories catalog. Each maps to its own brand string so the
// detection is symmetric — e.g., a Volkswagen customer searching with
// vehicle=Volkswagen would still match VW products.
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
  volkswagen: ["volkswagen", "vw"],
  vw: ["volkswagen", "vw"],
  bmw: ["bmw"],
  "mercedes-benz": ["mercedes", "mercedes-benz", "benz"],
  mercedes: ["mercedes", "mercedes-benz", "benz"],
  audi: ["audi"],
  subaru: ["subaru"],
  porsche: ["porsche"],
  "land rover": ["land rover", "range rover", "landrover"],
  "range rover": ["land rover", "range rover"],
  volvo: ["volvo"],
  lincoln: ["lincoln"],
  cadillac: ["cadillac", "caddy"],
  buick: ["buick"],
  acura: ["acura"],
  infiniti: ["infiniti", "infinity"],
  mitsubishi: ["mitsubishi"],
  fiat: ["fiat"],
  mini: ["mini cooper", "mini"],
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
 * Cycle 14X+ post-sync: when the product carries a populated FitmentTable
 * (from CA via metafields), use it as the AUTHORITATIVE answer for
 * subattribute matching. The metafield list is curated; the title parser
 * is best-effort. Returns:
 *   true       — every customer-answered subattribute matches a value in the list
 *   false      — at least one answered subattribute is missing from the list
 *   "unknown"  — the product is silent on the customer's answered dimensions
 *                (universal candidate)
 */
function metafieldSubGateAllows(
  table: FitmentTable | null | undefined,
  answers: SubModelAnswer[] | null | undefined,
): true | false | "unknown" {
  if (!table || !answers || answers.length === 0) return "unknown";
  let touched = false;
  for (const ans of answers) {
    if (ans.group === "bed_length") {
      const list = table.subattributes.bedLengths;
      if (!list || list.length === 0) continue;
      touched = true;
      const wantBucket = bedLengthBucket(normalizeBedLength(ans.value));
      const ok = list.some(
        (l) => bedLengthBucket(normalizeBedLength(l)) === wantBucket,
      );
      if (!ok) return false;
    } else if (ans.group === "cab_type") {
      const list = table.subattributes.cabTypes;
      if (!list || list.length === 0) continue;
      touched = true;
      const want = normalizeCab(ans.value);
      const ok = list.some((l) => normalizeCab(l) === want);
      if (!ok) return false;
    } else if (ans.group === "trim") {
      const list = table.subattributes.trims;
      if (!list || list.length === 0) continue;
      touched = true;
      const want = ans.value.toLowerCase().trim();
      const ok = list.some((l) => l.toLowerCase().trim() === want);
      if (!ok) return false;
    }
  }
  return touched ? true : "unknown";
}

/**
 * Cycle 14X+ post-sync: explicit submodel exclusions (e.g. F-150 Lightning
 * EV). When the customer's vehicle matches the excluded submodel by model
 * substring, this product does not fit even if year+make+model tags match.
 */
function isVehicleExcluded(
  table: FitmentTable | null | undefined,
  vehicle: Vehicle,
): boolean {
  if (!table?.subattributes.excludedSubmodels?.length) return false;
  const vehicleStr = `${vehicle.make} ${vehicle.model}`.toLowerCase();
  return table.subattributes.excludedSubmodels.some((ex) =>
    vehicleStr.includes(ex.toLowerCase()),
  );
}

/**
 * Cycle 14X+ post-sync: when the metafield-driven fitment check fails,
 * compute a structured reason so the PDP can render specific copy:
 * "This product fits 6.5' bed; your garage has 5.5' bed."
 */
export type FitmentFailureReason =
  | { kind: "year"; productYears: string[]; customerYear: string }
  | { kind: "make"; productMakes: string[]; customerMake: string }
  | { kind: "model"; productModels: string[]; customerModel: string }
  | { kind: "excluded"; excluded: string }
  | { kind: "subattribute"; group: string; productValues: string[]; customerValue: string }
  | { kind: "unknown" };

export function getFitmentReason(
  table: FitmentTable | null | undefined,
  vehicle: Vehicle | null | undefined,
  answers: SubModelAnswer[] | null | undefined,
): FitmentFailureReason {
  if (!vehicle) return { kind: "unknown" };
  if (table) {
    // Cycle 14AF (Mike-O14AF NF-2 reason text): order matters for the
    // human-readable reason. Make is the most fundamental mismatch — a
    // Tundra tonneau on a Silverado garage should say "engineered for
    // Toyota — not Chevrolet," NOT "fits 2007-2016; your 2019 is
    // outside that range." Customer doesn't care about year coverage
    // when the make's wrong. Check: make → model → excluded → year →
    // sub-attribute. Year drops to last because year-only mismatches
    // are rare for products that pass make+model.
    if (
      table.makes.length > 0 &&
      !table.makes.some((m) => m.toLowerCase() === vehicle.make.toLowerCase())
    ) {
      return { kind: "make", productMakes: table.makes, customerMake: vehicle.make };
    }
    if (table.subattributes.excludedSubmodels?.length) {
      const vehicleStr = `${vehicle.make} ${vehicle.model}`.toLowerCase();
      const hit = table.subattributes.excludedSubmodels.find((ex) =>
        vehicleStr.includes(ex.toLowerCase()),
      );
      if (hit) return { kind: "excluded", excluded: hit };
    }
    if (
      table.models.length > 0 &&
      !table.models.some((m) => m.toLowerCase().includes(vehicle.model.toLowerCase()))
    ) {
      return { kind: "model", productModels: table.models, customerModel: vehicle.model };
    }
    const yearStr = String(vehicle.year);
    if (table.years.length > 0 && !table.years.includes(yearStr)) {
      return { kind: "year", productYears: table.years, customerYear: yearStr };
    }
    for (const ans of answers ?? []) {
      const groupMap: Record<string, string[] | undefined> = {
        bed_length: table.subattributes.bedLengths,
        cab_type: table.subattributes.cabTypes,
        trim: table.subattributes.trims,
      };
      const list = groupMap[ans.group];
      if (!list || list.length === 0) continue;
      const want = ans.value.toLowerCase().trim();
      let matched = false;
      if (ans.group === "bed_length") {
        const wantBucket = bedLengthBucket(normalizeBedLength(ans.value));
        matched = list.some(
          (l) => bedLengthBucket(normalizeBedLength(l)) === wantBucket,
        );
      } else if (ans.group === "cab_type") {
        const w = normalizeCab(ans.value);
        matched = list.some((l) => normalizeCab(l) === w);
      } else {
        matched = list.some((l) => l.toLowerCase().trim() === want);
      }
      if (!matched) {
        return {
          kind: "subattribute",
          group: ans.group,
          productValues: list,
          customerValue: ans.value,
        };
      }
    }
  }
  return { kind: "unknown" };
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
  product: Pick<CatalogProduct, "title" | "fitTitle" | "vehicleTags"> & {
    fitmentTable?: FitmentTable;
  },
  vehicle: Vehicle | null | undefined,
  subModelAnswers?: SubModelAnswer[] | null,
): boolean | undefined {
  if (!vehicle) return undefined;
  // Cycle 14X+ post-sync (Specialist + Mike): when the product has a
  // populated FitmentTable, use the metafield-driven check FIRST. The
  // metafield list is curated by the warehouse; the title parser is
  // best-effort. The metafield wins when present.
  const metafieldGate = metafieldSubGateAllows(
    product.fitmentTable,
    subModelAnswers,
  );
  if (metafieldGate === false) return false;
  if (product.fitmentTable && isVehicleExcluded(product.fitmentTable, vehicle)) {
    return false;
  }
  // Cycle 12 (Mike F-5 BLOCKER): if year+make+model would say true but the
  // sub-model gate finds a contradicting bed-length / cab-type token in the
  // product title, that's a confirmed misfit — flip to false BEFORE the
  // positive return below.
  const subGate = subModelGateAllows(
    { title: product.title, fitTitle: product.fitTitle ?? undefined, vehicleTags: product.vehicleTags },
    subModelAnswers,
  );
  if (subGate === false) return false;
  // Cycle 14AE (Mike-O14AE NF-2 MAJOR): if the make/model already
  // disqualifies the product (Tundra tonneau on Silverado garage), we
  // must NOT short-circuit to "needs_pick" yellow — it's a confirmed
  // DOES NOT FIT regardless of bed length. Hold the needs_pick decision
  // until the end; if make/model proves a hard mismatch first, return
  // false. Cycle 14AA was returning undefined eagerly here.
  const needsPick = subGate === "needs_pick";

  // Cycle 14AR-fix13 (regression from 14AR-fix4): tighten the needsPick
  // signal to bed-length only. fix4 added `if (needsPick) return undefined`
  // inside the metafield-first branch to fix the Tacoma 5.5'/6.5' tonneau
  // false-positive (P3-1). Worked for bed-length, but `subModelGateAllows`
  // also raises needs_pick for trim/cab when productTrims/productCabs
  // extracts non-empty arrays from the title — and those extractors are
  // unreliable: "Mark LT" in a Lincoln Navigator product title trips the
  // trim regex (LT) even though it's part of a model name, not a Ford
  // trim restriction. Result: Lincoln Navigator/F-150 product (CA covers
  // 2003-2026 F-150) returned undefined → "CHECK FITMENT" yellow instead
  // of green "✓ FITS YOUR 2021 FORD F-150". Owner caught.
  //
  // Solution: only treat needsPick as "actually need to pick" when the
  // product title carries a CONCRETE bed-length reference (e.g. "5.5 ft
  // Bed", "6' Bed") AND the customer hasn't supplied one. Bed length is
  // the only sub-model where the title-string regex is dependable —
  // numbers + "ft Bed" tokens don't appear coincidentally. Trim and cab
  // gating fall through to the metafield gate above (which compares the
  // customer's pick to the metafield's allowed-values list).
  const haystackForNeedsPick = [product.title ?? "", product.fitTitle ?? ""]
    .join(" ");
  const titleHasBedLength = extractBedLengths(haystackForNeedsPick).length > 0;
  const noBedAnswer = !subModelAnswers?.some((a) => a.group === "bed_length");
  const reliableNeedsPick = needsPick && titleHasBedLength && noBedAnswer;

  // Cycle 14AR-fix1 (QA-found BUG-14AR-1 P0 BLOCKER): the metafield-driven
  // fitment table (built from CA ACES data via sync-ca-fitment.ts) is the
  // AUTHORITATIVE source of truth. Shopify vehicleTags are populated from
  // the product's slug-encoded year range (e.g., "2003-2014-lincoln...") —
  // which is often NARROWER than the actual coverage in CA fitment data
  // (which can extend to 2026). The previous implementation trusted
  // Shopify tags as authoritative, causing false-negative "DOES NOT FIT"
  // verdicts for products whose CA data clearly says they fit the
  // customer's vehicle.
  //
  // Owner directive (cycle 14AR): the fitment data wins over Shopify tags.
  // When the metafield has a complete YMM picture (years + makes + models
  // all populated), use it as the sole source for the make/model/year
  // verdict. Tags become a fallback for products with sparse/missing
  // metafield only.
  const table = product.fitmentTable;
  const hasCompleteMetafield =
    !!table &&
    table.years.length > 0 &&
    table.makes.length > 0 &&
    table.models.length > 0;
  if (hasCompleteMetafield) {
    const yearStr = String(vehicle.year);
    const makeKey = vehicle.make.toLowerCase();
    const aliases = MAKE_ALIASES[makeKey] ?? [makeKey];
    const makeMatch = table!.makes.some((m) =>
      aliases.includes(m.toLowerCase()),
    );
    const modelMatch = table!.models.some((m) => {
      const a = m.toLowerCase();
      const b = vehicle.model.toLowerCase();
      return a === b || a.includes(b) || b.includes(a);
    });
    const yearMatch = table!.years.includes(yearStr);
    if (makeMatch && modelMatch && yearMatch) {
      // Cycle 14AR-fix13: use the tightened reliableNeedsPick (bed-length
      // only) instead of the broad needsPick. See its definition above
      // for the full reasoning — title-derived trim/cab heuristics are
      // unreliable and were turning legitimate FITS into "CHECK FITMENT"
      // for products like Lincoln Navigator (Mark LT triggered the trim
      // regex). Bed length is the only dimension where title-string
      // detection is dependable enough to gate on.
      if (reliableNeedsPick) return undefined;
      return true;
    }
    // Metafield is complete and disagrees → confident NO. Owner-directed:
    // CA data is the single source of truth.
    return false;
  }

  // Structured Shopify tags (cycle-3 schema: `make:Jeep`, `model:Wrangler`,
  // `year:2014`) — fallback when metafield is sparse. ~49% of catalog
  // historically had structured tags but no metafield.
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

  // Cycle 14AE (Mike-O14AE NF-2): all hard-mismatch paths above returned
  // false. If the only ambiguity is an unanswered sub-model question on
  // a product the customer's vehicle COULD plausibly match, surface as
  // yellow "verify" — not silently green.
  if (needsPick) return undefined;

  return undefined;
}

/**
 * Cycle 14AO (owner): public, vehicle-independent variant of the sub-model
 * gate. Used by the new DimensionPicker / collection filter pipeline so that
 * a customer who has *not* set a vehicle can still narrow a category by
 * "5.5' BED" — we keep products that mention that bed length OR are silent on
 * bed length (universal candidates), and we hide products that name a
 * conflicting bed length (e.g. 6.5'). Returns the same tri-state as the
 * private gate: true / false / "needs_pick" (no contradicting evidence,
 * caller decides whether to keep silent products).
 */
export function checkSubModelMatch(
  product: Pick<CatalogProduct, "title" | "fitTitle" | "vehicleTags"> & {
    fitmentTable?: FitmentTable;
  },
  answers: SubModelAnswer[] | null | undefined,
): true | false | "needs_pick" {
  if (!answers || answers.length === 0) return true;
  const metafieldGate = metafieldSubGateAllows(product.fitmentTable, answers);
  if (metafieldGate === false) return false;
  return subModelGateAllows(
    {
      title: product.title,
      fitTitle: product.fitTitle ?? undefined,
      vehicleTags: product.vehicleTags,
    },
    answers,
  );
}

/**
 * Cycle 14AO (owner): drop products that conflict with the customer's
 * dimension answers. Universal candidates (silent on the dimension) are kept
 * — better to show "may fit, verify" than to vanish them from the grid.
 */
export function filterByDimensionAnswers<
  T extends Pick<CatalogProduct, "title" | "fitTitle" | "vehicleTags"> & {
    fitmentTable?: FitmentTable;
  },
>(products: T[], answers: SubModelAnswer[] | null | undefined): T[] {
  if (!answers || answers.length === 0) return products;
  return products.filter((p) => checkSubModelMatch(p, answers) !== false);
}

/**
 * Convenience: re-paint a product list with `fits` resolved against a vehicle.
 * Returns a shallow copy; never mutates input.
 */
export function withFitment<
  T extends Pick<
    CatalogProduct,
    "title" | "fitTitle" | "vehicleTags" | "fits" | "fitmentTable"
  >,
>(
  products: T[],
  vehicle: Vehicle | null | undefined,
  // Cycle 14X+ post-sync (Mike-O15 NEW MAJOR): without sub-model answers
  // here, every ProductCard rendered through this helper (collection,
  // related, vehicle-hub, search) computed fitment as YMM-only — so a
  // 5.5'-bed customer saw a green "✓ FITS" badge on a 6.5' tonneau in
  // the related-products rail right under the buy box that just said
  // "DOES NOT FIT." Pass the saved answers so the sub-model gate fires
  // on cards too.
  subModelAnswers?: SubModelAnswer[] | null,
): T[] {
  if (!vehicle) return products;
  return products.map((p) => ({
    ...p,
    fits: checkFitment(p, vehicle, subModelAnswers),
  }));
}
