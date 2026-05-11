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
  const notesHtml = (p.fitmentNotes?.value ?? "").trim() || null;
  const subattributes = parseSubattributes(p.fitmentSubattributes);
  // Cycle 14AS Step E: per-application records are the schema-correct
  // fitment data. Flat-list metafields (years/makes/models) are deleted
  // from Shopify and no longer parsed.
  const applications = parseApplications(p.fitmentApplications);

  const hasAny =
    applications.length > 0 ||
    !!notesHtml ||
    Object.keys(subattributes).length > 0;
  if (!hasAny) return null;

  return { applications, notesHtml, subattributes };
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

// Cycle 14AS Step E: fitmentTableToRows() removed. The function projected
// flat-list metafields (years/makes/models) into per-row shape via Sierra-
// to-GMC make pairing heuristics. Per-application records (applications[])
// already carry the correct make per row natively — no projection needed.
// PDP renders via applicationsToRows() in src/components/commerce/pdp-tabs.tsx.

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
