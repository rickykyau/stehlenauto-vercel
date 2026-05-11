import type {
  FitmentApplication,
  FitmentSubattributes,
  FitmentTable,
} from "@/lib/catalog/types";
import type {
  ProductNode,
  ShopifyMetafieldNode,
} from "@/lib/shopify/types";

/**
 * Cycle 14X (owner): convert the raw Shopify metafield bag on a Product
 * into a structured FitmentTable. Returns null when none of the metafields
 * are populated so the consumer can fall back to title-derived rows.
 *
 * Shopify list-type metafields (list.single_line_text_field) serialize as
 * a JSON-encoded array string in metafield.value (e.g. '["Ford","Chevy"]').
 * Single-line and multi-line text fields are returned as plain strings.
 * JSON fields are returned as a JSON-encoded string and must be parsed.
 */
export function parseFitmentTable(p: ProductNode): FitmentTable | null {
  const years = parseStringList(p.fitmentYears);
  const makes = parseStringList(p.fitmentMakes);
  const models = parseStringList(p.fitmentModels);
  const notesHtml = (p.fitmentNotes?.value ?? "").trim() || null;
  const subattributes = parseSubattributes(p.fitmentSubattributes);
  // Cycle 14AS: per-application records — the schema-correct fitment data.
  const applications = parseApplications(p.fitmentApplications);

  // If absolutely everything is empty, treat as "merch hasn't filled this in
  // yet" and let the PDP fall back to its title-derived row.
  const hasAny =
    applications.length > 0 ||
    years.length > 0 ||
    makes.length > 0 ||
    models.length > 0 ||
    !!notesHtml ||
    Object.keys(subattributes).length > 0;
  if (!hasAny) return null;

  return { applications, years, makes, models, notesHtml, subattributes };
}

/**
 * Cycle 14AS: parse the custom.fitment_applications JSON metafield.
 * Returns [] when missing or malformed (caller falls back to flat lists
 * during the migration window).
 */
function parseApplications(
  node: ShopifyMetafieldNode | null | undefined,
): FitmentApplication[] {
  const value = node?.value;
  if (!value) return [];
  const trimmed = value.trim();
  if (!trimmed) return [];
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (!Array.isArray(parsed)) return [];
    const out: FitmentApplication[] = [];
    for (const entry of parsed) {
      if (
        entry &&
        typeof entry === "object" &&
        "year" in entry &&
        "make" in entry &&
        "model" in entry
      ) {
        const e = entry as { year: unknown; make: unknown; model: unknown; submodel?: unknown };
        if (
          typeof e.year === "string" &&
          typeof e.make === "string" &&
          typeof e.model === "string"
        ) {
          out.push({
            year: e.year,
            make: e.make,
            model: e.model,
            ...(typeof e.submodel === "string" && e.submodel
              ? { submodel: e.submodel }
              : {}),
          });
        }
      }
    }
    return out;
  } catch {
    return [];
  }
}

/**
 * Cycle 14AR-fix31 (owner): pair a model name to its likely make when the
 * metafield lists multiple makes (e.g. makes=["Chevrolet","GMC"],
 * models=["Silverado 1500","Sierra 1500"]). Without this, fitmentTableToRows
 * picked makes[0] and rendered "Chevrolet Sierra 1500" — Mike R13 caught it
 * for a customer who owns a GMC, not a Chevrolet. The model→make mapping is
 * deterministic for sister-vehicle pairs in our catalog.
 */
const MODEL_MAKE_HINTS: Array<{ model: RegExp; make: string }> = [
  { model: /\bsierra\b/i, make: "GMC" },
  { model: /\bsilverado\b/i, make: "Chevrolet" },
  { model: /\bcanyon\b/i, make: "GMC" },
  { model: /\bcolorado\b/i, make: "Chevrolet" },
  { model: /\b(?:f-?150|f-?250|f-?350|expedition|bronco|ranger|maverick)\b/i, make: "Ford" },
  { model: /\b(?:silverado|tahoe|suburban|colorado)\b/i, make: "Chevrolet" },
  { model: /\b(?:tundra|tacoma|4runner|sequoia|highlander)\b/i, make: "Toyota" },
  { model: /\b(?:wrangler|gladiator|grand cherokee|cherokee|compass|renegade)\b/i, make: "Jeep" },
  { model: /\b(?:1500|2500|3500)\s*(classic|tradesman|laramie|big horn|rebel)?\b/i, make: "Ram" },
];

function pickMakeForModel(modelName: string, availableMakes: string[]): string {
  if (availableMakes.length === 1) return availableMakes[0]!;
  for (const { model, make } of MODEL_MAKE_HINTS) {
    if (model.test(modelName) && availableMakes.some((m) => m.toLowerCase() === make.toLowerCase())) {
      return make;
    }
  }
  return availableMakes[0]!;
}

/**
 * Project a FitmentTable into the legacy per-row shape the existing PDP
 * renderer already understands. We zip years × models (1-to-1 by index when
 * lengths match, otherwise we cross-product the shorter axis with the
 * longest, which is the convention the merch team confirmed in their CSV
 * imports). When the metafield carries multiple makes, pair each model to
 * its likely make so a Sierra row says "GMC Sierra 1500" not
 * "Chevrolet Sierra 1500" (cycle 14AR-fix31).
 */
export function fitmentTableToRows(t: FitmentTable): {
  years: string;
  cab: string;
  fits: boolean;
  make?: string;
  model?: string;
}[] {
  if (!t) return [];
  const allMakes = t.makes.map((m) => m.trim()).filter(Boolean);
  const fallbackMake = allMakes[0];

  const models = t.models.length > 0 ? t.models : [""];
  const yearsArr = t.years.length > 0 ? t.years : [""];

  const rows: {
    years: string;
    cab: string;
    fits: boolean;
    make?: string;
    model?: string;
  }[] = [];

  // 1-to-1 zip when both lists are the same length and >1; otherwise emit
  // every (year × model) combination so the table covers the full set.
  const oneToOne =
    yearsArr.length > 1 &&
    yearsArr.length === models.length;

  if (oneToOne) {
    for (let i = 0; i < yearsArr.length; i++) {
      const m = models[i] ?? "";
      const make = m && allMakes.length > 0 ? pickMakeForModel(m, allMakes) : fallbackMake;
      // Cycle 14AF (Mike-O14AF NF-6): industry-standard order is
      // Make-then-Model ("Toyota Tundra"), not Model-then-Make.
      const cab = [make ?? "", m].filter(Boolean).join(" ").trim();
      rows.push({
        years: yearsArr[i] ?? "",
        cab: cab || (make ?? ""),
        fits: true,
        make: make ?? undefined,
        model: m || undefined,
      });
    }
    return rows;
  }

  for (const y of yearsArr) {
    for (const m of models) {
      const make = m && allMakes.length > 0 ? pickMakeForModel(m, allMakes) : fallbackMake;
      // Make-then-Model order — see oneToOne branch above.
      const cab = [make ?? "", m].filter(Boolean).join(" ").trim();
      rows.push({
        years: y,
        cab: cab || (make ?? ""),
        fits: true,
        make: make ?? undefined,
        model: m || undefined,
      });
    }
  }
  return rows;
}

function parseStringList(node: ShopifyMetafieldNode | null | undefined): string[] {
  const value = node?.value;
  if (!value) return [];
  // List-type metafields ship as JSON-encoded arrays in `value`.
  // Single-line text comes through as plain strings.
  const trimmed = value.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (Array.isArray(parsed)) {
        return parsed
          .filter((v): v is string => typeof v === "string")
          .map((s) => s.trim())
          .filter(Boolean);
      }
    } catch {
      // fall through to comma-split
    }
  }
  // Tolerant fallback: warehouse staff who pasted comma-separated values
  // directly into a single-line field shouldn't produce a 500 — just split.
  return trimmed
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseSubattributes(
  node: ShopifyMetafieldNode | null | undefined,
): FitmentSubattributes {
  const value = node?.value;
  if (!value) return {};
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    const out: FitmentSubattributes = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (Array.isArray(v)) {
        const cleaned = v
          .filter((x): x is string => typeof x === "string")
          .map((s) => s.trim())
          .filter(Boolean);
        if (cleaned.length > 0) out[normalizeSubKey(k)] = cleaned;
      }
    }
    return out;
  } catch {
    return {};
  }
}

/** Map common merch-team key spellings to the canonical UI keys. */
function normalizeSubKey(k: string): string {
  const lower = k.toLowerCase().trim();
  const aliases: Record<string, string> = {
    bed_length: "bedLengths",
    bedlength: "bedLengths",
    bed_lengths: "bedLengths",
    bedlengths: "bedLengths",
    cab: "cabTypes",
    cab_type: "cabTypes",
    cabtype: "cabTypes",
    cab_types: "cabTypes",
    cabtypes: "cabTypes",
    trim: "trims",
    trims: "trims",
    door: "doors",
    doors: "doors",
    door_count: "doors",
    drive: "drives",
    drives: "drives",
    drivetrain: "drives",
    drive_type: "drives",
    // Cycle 14X+ post-sync: keys our own sync script writes in camelCase.
    // The lowercased forms must alias back to the canonical UI key, else
    // the consumer never sees them (engineexclusions → engineExclusions,
    // boxoptions → boxOptions, excludedsubmodels → excludedSubmodels,
    // submodels stays the same).
    submodel: "submodels",
    submodels: "submodels",
    engine_exclusion: "engineExclusions",
    engineexclusion: "engineExclusions",
    engine_exclusions: "engineExclusions",
    engineexclusions: "engineExclusions",
    box: "boxOptions",
    box_option: "boxOptions",
    box_options: "boxOptions",
    boxoption: "boxOptions",
    boxoptions: "boxOptions",
    excluded_submodel: "excludedSubmodels",
    excluded_submodels: "excludedSubmodels",
    excludedsubmodel: "excludedSubmodels",
    excludedsubmodels: "excludedSubmodels",
  };
  return aliases[lower] ?? lower;
}
