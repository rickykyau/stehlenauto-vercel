import type {
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

  // If absolutely everything is empty, treat as "merch hasn't filled this in
  // yet" and let the PDP fall back to its title-derived row.
  const hasAny =
    years.length > 0 ||
    makes.length > 0 ||
    models.length > 0 ||
    !!notesHtml ||
    Object.keys(subattributes).length > 0;
  if (!hasAny) return null;

  return { years, makes, models, notesHtml, subattributes };
}

/**
 * Project a FitmentTable into the legacy per-row shape the existing PDP
 * renderer already understands. We zip years × models (1-to-1 by index when
 * lengths match, otherwise we cross-product the shorter axis with the
 * longest, which is the convention the merch team confirmed in their CSV
 * imports). Make is taken from the first entry — vehicles are make-scoped.
 */
export function fitmentTableToRows(t: FitmentTable): {
  years: string;
  cab: string;
  fits: boolean;
  make?: string;
  model?: string;
}[] {
  if (!t) return [];
  const make = t.makes[0]?.trim();

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
      const cab = [models[i] ?? "", make ?? ""]
        .filter(Boolean)
        .join(" ")
        .trim();
      rows.push({
        years: yearsArr[i] ?? "",
        cab: cab || (make ?? ""),
        fits: true,
        make: make ?? undefined,
        model: models[i] || undefined,
      });
    }
    return rows;
  }

  for (const y of yearsArr) {
    for (const m of models) {
      const cab = [m, make ?? ""].filter(Boolean).join(" ").trim();
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
