/**
 * scripts/sync-ca-fitment.ts
 *
 * One-shot sync that pulls per-product fitment data from ChannelAdvisor
 * and writes it back to Shopify metafields under the `custom` namespace.
 *
 * Workflow (full algorithm in
 * ~/.claude/projects/<repo>/memory/skill_ca_fitment_lookup.md):
 *
 *   1. List every Shopify product that has a `cb_integration.item_name`
 *      metafield (the canonical CB Item Name, e.g. "FG-ACC084D-ME-BK").
 *   2. For each, query CA profile #1 with
 *      `$filter=startswith(Sku, '<cbItemName>-')`.
 *   3. From returned products, sort by 3-digit suffix ascending, drop
 *      any ending in -601 / -801, return the first whose `Fitment`
 *      custom-attribute is non-empty.
 *   4. If nothing in profile #1, fall through to #2, #3, ...
 *   5. Parse the raw Fitment string (one application per line:
 *      YEAR|MAKE|MODEL|SUBMODEL::NOTE) into structured years / makes /
 *      models / notes / subattributes (cab type, bed length, trim, doors).
 *   6. Write 6 metafields back via Admin metafieldsSet:
 *      custom.fitment_years/makes/models/notes/subattributes/raw
 *   7. Throttle 200ms between Shopify products to stay under CA's
 *      ~5 req/sec limit (account-wide).
 *
 * Usage:
 *   DOTENV_CONFIG_PATH=.env.local pnpm tsx -r dotenv/config \
 *     scripts/sync-ca-fitment.ts
 *
 * Flags:
 *   --limit=N        process only first N matching products (default: all)
 *   --handle=foo     process only the product with this Shopify handle
 *   --dry-run        parse + log, do NOT write to Shopify
 *   --verbose        log every CA query
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { createAdminApiClient } from "@shopify/admin-api-client";

// ---------- env + flags ----------
const SHOPIFY_DOMAIN = (
  process.env.SHOPIFY_STORE_DOMAIN ||
  process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN ||
  ""
)
  .replace(/^https?:\/\//, "")
  .replace(/\/+$/, "")
  .trim();
const SHOPIFY_ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN ?? "";
const SHOPIFY_API_VERSION =
  process.env.NEXT_PUBLIC_SHOPIFY_API_VERSION || "2026-01";

const CA_APP_ID = process.env.CA_FITMENT_APPLICATION_ID ?? "";
const CA_SHARED_SECRET = process.env.CA_FITMENT_SHARED_SECRET ?? "";
const CA_REFRESH_TOKEN = process.env.CA_FITMENT_REFRESH_TOKEN ?? "";
const CA_PROFILE_IDS = (process.env.CA_FITMENT_PROFILE_ID ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const args = new Map<string, string>();
for (const a of process.argv.slice(2)) {
  const m = a.match(/^--([\w-]+)(?:=(.*))?$/);
  if (m) args.set(m[1], m[2] ?? "true");
}
const LIMIT = args.has("limit") ? parseInt(args.get("limit") ?? "0", 10) : 0;
const ONLY_HANDLE = args.get("handle") ?? null;
const DRY_RUN = args.get("dry-run") === "true";
const VERBOSE = args.get("verbose") === "true";

if (
  !SHOPIFY_DOMAIN ||
  !SHOPIFY_ADMIN_TOKEN ||
  !CA_APP_ID ||
  !CA_SHARED_SECRET ||
  !CA_REFRESH_TOKEN ||
  CA_PROFILE_IDS.length === 0
) {
  console.error(
    "Missing env. Need SHOPIFY_STORE_DOMAIN, SHOPIFY_ADMIN_TOKEN, " +
      "CA_FITMENT_APPLICATION_ID, CA_FITMENT_SHARED_SECRET, " +
      "CA_FITMENT_REFRESH_TOKEN, CA_FITMENT_PROFILE_ID.",
  );
  process.exit(1);
}

// ---------- Shopify Admin client ----------
const adminClient = createAdminApiClient({
  storeDomain: SHOPIFY_DOMAIN,
  apiVersion: SHOPIFY_API_VERSION,
  accessToken: SHOPIFY_ADMIN_TOKEN,
});

async function shopifyAdmin<T>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  const { data, errors } = await adminClient.request(query, { variables });
  if (errors) {
    const msg =
      typeof errors === "string"
        ? errors
        : (errors.message ?? JSON.stringify(errors));
    throw new Error(`Shopify Admin error: ${msg}`);
  }
  if (!data) throw new Error("Shopify Admin returned no data");
  return data as T;
}

// ---------- ChannelAdvisor OAuth + REST ----------
const CA_BASE = "https://api.channeladvisor.com";
let cachedCAToken: { token: string; expiresAt: number } | null = null;

async function getCAAccessToken(): Promise<string> {
  if (cachedCAToken && cachedCAToken.expiresAt - Date.now() > 60_000) {
    return cachedCAToken.token;
  }
  const basicAuth = Buffer.from(
    `${CA_APP_ID}:${CA_SHARED_SECRET}`,
    "utf-8",
  ).toString("base64");
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: CA_REFRESH_TOKEN,
  });
  const res = await fetch(`${CA_BASE}/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`CA OAuth failed: ${res.status} ${text}`);
  }
  const json = (await res.json()) as { access_token: string; expires_in: number };
  cachedCAToken = {
    token: json.access_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  };
  return cachedCAToken.token;
}

type CAProduct = {
  ID: number;
  ProfileID: number;
  Sku: string;
  Attributes?: { Name: string; Value: string | null }[];
};

async function caGet<T>(pathAndQuery: string): Promise<T> {
  let token = await getCAAccessToken();
  const doFetch = async () =>
    fetch(`${CA_BASE}${pathAndQuery}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  let res = await doFetch();
  if (res.status === 401) {
    cachedCAToken = null;
    token = await getCAAccessToken();
    res = await doFetch();
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`CA GET ${pathAndQuery} failed: ${res.status} ${text}`);
  }
  return (await res.json()) as T;
}

async function searchCABySkuPrefix(
  profileId: string,
  prefix: string,
): Promise<CAProduct[]> {
  // Escape single quotes in OData filters per spec.
  const safe = prefix.replace(/'/g, "''");
  const filter = encodeURIComponent(`startswith(Sku,'${safe}-')`);
  const expand = encodeURIComponent("Attributes");
  const url = `/v1/Products?profileid=${profileId}&$filter=${filter}&$expand=${expand}&$top=20`;
  const json = await caGet<{ value: CAProduct[] }>(url);
  return json.value ?? [];
}

function suffixOf(sku: string): number | null {
  const m = sku.match(/-(\d{3})$/);
  return m ? parseInt(m[1], 10) : null;
}

function pickCandidate(products: CAProduct[]): CAProduct | null {
  const candidates = products
    .filter((p) => suffixOf(p.Sku) !== null)
    .filter((p) => !p.Sku.endsWith("-601") && !p.Sku.endsWith("-801"))
    .sort((a, b) => (suffixOf(a.Sku)! - suffixOf(b.Sku)!));
  for (const p of candidates) {
    const fitment = p.Attributes?.find(
      (a) => a.Name?.toLowerCase() === "fitment",
    )?.Value;
    if (fitment && fitment.trim()) return p;
  }
  return null;
}

async function lookupFitmentForCbItemName(
  cbItemName: string,
): Promise<{
  profileId: string;
  matchedSku: string;
  fitmentRaw: string;
} | null> {
  for (const profileId of CA_PROFILE_IDS) {
    if (VERBOSE) console.log(`  ↳ try profile ${profileId}`);
    const products = await searchCABySkuPrefix(profileId, cbItemName);
    if (VERBOSE) console.log(`    returned ${products.length} SKUs`);
    const match = pickCandidate(products);
    if (match) {
      const fitment = match.Attributes!.find(
        (a) => a.Name?.toLowerCase() === "fitment",
      )!.Value!;
      return { profileId, matchedSku: match.Sku, fitmentRaw: fitment };
    }
  }
  return null;
}

// ---------- Fitment string parser ----------
type FitmentApplication = {
  year: string;
  make: string;
  model: string;
  submodel?: string;
};

type ParsedFitment = {
  years: string[];
  makes: string[];
  models: string[];
  notes: string[];
  subattributes: Record<string, string[]>;
  // Cycle 14AS: per-application records (the truth — preserves cross-product
  // validity that flat year/make/model lists lose). Source for storefront
  // checkFitment + Google Shopping/eBay Motors/Amazon channel feeds.
  applications: FitmentApplication[];
};

const CAB_RE =
  /(SuperCrew|SuperCab|CrewMax|Mega Cab|Quad Cab|Crew Cab|Extended Cab|Single Cab|Double Cab|Regular Cab|Access Cab|King Cab|Standard Cab)/i;
const DOOR_RE = /(\d)-Door\b/i;
const BED_RE = /(\d+(?:\.\d+)?)\s*['′]?\s*(?:ft|foot)?\s*Bed\b/i;
const SHORT_BED_RE = /\b(Short|Standard|Long|Extra Long)\s*Bed\b/i;

// Cycle 14X+ post-sync (Specialist 1A): bed length lives in the
// `::NOTE` field for tonneaus, not in the 4th SUBMODEL field.
// CA vocabulary: "Will Fit 6.5 Ft (78.9") Bed", "Will Fit 6 Ft Bed",
// "Will Fit 5.8 Ft Bed". Anchored on "Will Fit" so we don't pull
// bed length from a "Will Not Fit" exclusion line.
const BED_NOTE_RE = /Will\s+Fit\s+(\d+(?:\.\d+)?)\s*[Ff]t/g;

// Cycle 14X+ post-sync (Specialist 1B + 1D): brand-friendly cab names
// appear ONLY in the `::NOTE` section, not the 4th field. The pattern
// "Will Fit BRAND ( ACES ) Cab Models" tells us the brand alias for the
// canonical ACES cab type. Examples (live in catalog):
//   "Will Fit SuperCrew (Crew) Cab Models"   → SuperCrew = Crew Cab
//   "Will Fit Access ( Extended ) Cab"       → Access Cab = Extended Cab
//   "Will Fit CrewMax ( Crew ) Cab Models"   → CrewMax = Crew Cab
//   "Will Fit Quad ( Crew ) Cab"             → Quad Cab = Crew Cab
//   "Will Fit Super ( Extended ) Cab Models" → SuperCab = Extended Cab
const CAB_BRAND_NOTE_RE =
  /Will\s+Fit\s+([A-Z][A-Za-z]+)\s*\(\s*(Crew|Extended|Standard|Regular)\s*\)\s*Cab/gi;

// Cycle 14X+ post-sync (Mike's Product 3 / Specialist taxonomy P1):
// Engine exclusions live in notes like "Will Not Fit Models With EcoBoost
// Engine". Capture them so the PDP can surface a callout instead of
// silently leaving the buyer with a contradictory green ribbon + warning.
const ENGINE_EXCL_RE =
  /Will\s+Not\s+Fit\s+(?:Models\s+With\s+)?(.*?)\s+Engine/gi;

// Cycle 14X+ post-sync (Specialist taxonomy P0): Ram 1500 RamBox.
// 15-20% return-rate driver on Ram bed mats — a standard mat overlaps
// the RamBox cargo bins.
const RAMBOX_FIT_RE = /Will\s+Fit\s+(?:Models\s+With\s+)?Rambox/i;
const RAMBOX_EXCL_RE = /Will\s+Not\s+Fit\s+(?:Models\s+With\s+)?Rambox/i;

// Cycle 14X+ post-sync (Specialist taxonomy P1): Ford F-150 Lightning EV
// is mechanically a different platform — appears in 442 exclusion lines.
const LIGHTNING_EXCL_RE = /Will\s+Not\s+Fit\s+(?:Ford\s+)?F[-‑]?150\s+Lightning/i;

// Cycle 14X+ post-sync (Specialist 1F): 2024 Tacoma 4th field reads
// "HEV Crew Cab Pickup 4-Door". Strip the powertrain prefix so it
// doesn't get emitted as trim "HEV".
const POWERTRAIN_PREFIX_RE = /^(HEV|EV|PHEV|BEV|MHEV)\s+/i;

// Cycle 14X+ post-sync (Specialist 1G): F-450/F-550 Cab & Chassis fleet
// rows leak "Base Cab & Chassis -" as a trim. Drop those.
const CAB_CHASSIS_RE = /Cab\s*&\s*Chassis/i;

// Cycle 14X+ post-sync (Specialist trim-noise rule): functional trims
// that genuinely change physical fitment (different fender flares,
// different mounting points, different fascia geometry). When ALL trims
// in a fitment list collapse to the same cab+door bucket AND none of
// these functional trims are present, the trim list is cosmetic-only and
// gets suppressed from the PDP.
const FUNCTIONAL_TRIMS = new Set([
  "raptor",
  "raptor r",
  "tremor",
  "trx",
  "rubicon",
  "denali",
  "denali ultimate",
  "limited",
  "king ranch",
  "trd pro",
  "wildtrak",
  "platinum reserve",
]);

function parseFitmentString(raw: string): ParsedFitment {
  const years = new Set<string>();
  const makes = new Set<string>();
  const models = new Set<string>();
  const notes = new Set<string>();
  const cabTypes = new Set<string>();
  const bedLengths = new Set<string>();
  const trims = new Set<string>();
  const doors = new Set<string>();
  const submodelsRaw = new Set<string>();
  const engineExclusions = new Set<string>();
  const boxOptions = new Set<string>();
  const excludedSubmodels = new Set<string>();
  // Per-line cab→brand alias map; applied after the loop to upgrade
  // ACES cab labels in `cabTypes` to brand-friendly labels.
  const cabBrandMap = new Map<string, string>();
  // (cab, doors) → trims bucket; used after the loop for the
  // cosmetic-trim collapse rule.
  const trimsByCabDoor = new Map<string, Set<string>>();
  // Cycle 14AS: per-application records — preserves the YxMxM coupling that
  // flat lists destroy. Deduped via a key Set since CA can repeat lines.
  const apps: FitmentApplication[] = [];
  const appsKey = new Set<string>();

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Cycle 14X+ post-sync (Specialist 1A): the `::NOTE` separator can
    // live inside ANY field, not just after the 4th pipe. CA writes
    // `2015|Ford|F-150::Will Fit 6.5 Ft Bed` for tonneaus that don't
    // need a 4th submodel field. Split on the first `::` first, THEN
    // pipe-split the prefix.
    const noteSplit = trimmed.indexOf("::");
    const beforeNote = noteSplit >= 0 ? trimmed.slice(0, noteSplit) : trimmed;
    const note = noteSplit >= 0 ? trimmed.slice(noteSplit + 2).trim() : "";

    const parts = beforeNote.split("|");
    if (parts.length < 3) continue;

    const year = parts[0]?.trim() ?? "";
    const make = parts[1]?.trim() ?? "";
    const model = parts[2]?.trim() ?? "";
    const submodel = parts.slice(3).join("|").trim();

    if (/^\d{4}$/.test(year)) years.add(year);
    if (make) makes.add(make);
    if (model) models.add(model);
    // Cycle 14AS: per-application record (year × make × model required, submodel optional).
    if (/^\d{4}$/.test(year) && make && model) {
      const key = `${year}|${make}|${model}|${submodel ?? ""}`;
      if (!appsKey.has(key)) {
        appsKey.add(key);
        apps.push({
          year,
          make,
          model,
          ...(submodel ? { submodel } : {}),
        });
      }
    }
    if (note) {
      notes.add(note);
      // Bed length from notes (Specialist 1A).
      for (const m of note.matchAll(BED_NOTE_RE)) {
        bedLengths.add(`${normalizeBed(m[1])}' Bed`);
      }
      // Cab brand map from notes (Specialist 1B/1D).
      for (const m of note.matchAll(CAB_BRAND_NOTE_RE)) {
        const brand = (m[1] ?? "").trim();
        const aces = (m[2] ?? "").trim();
        if (!brand || !aces) continue;
        if (brand.toLowerCase() === aces.toLowerCase()) continue;
        const acesFull = `${toTitleCase(aces)} Cab`;
        const brandFull = brand.toLowerCase().includes("cab")
          ? toTitleCase(brand)
          : `${toTitleCase(brand)} Cab`;
        cabBrandMap.set(acesFull, brandFull);
      }
      // Engine exclusions (Mike Product 3).
      for (const m of note.matchAll(ENGINE_EXCL_RE)) {
        const eng = (m[1] ?? "").trim();
        if (
          eng &&
          !/lightning|electric|hybrid model/i.test(eng) &&
          eng.length < 60
        ) {
          engineExclusions.add(eng);
        }
      }
      // RamBox (Specialist P0).
      if (RAMBOX_FIT_RE.test(note)) boxOptions.add("RamBox");
      else if (RAMBOX_EXCL_RE.test(note)) boxOptions.add("Standard");
      // Lightning exclusion (Specialist P1).
      if (LIGHTNING_EXCL_RE.test(note)) excludedSubmodels.add("F-150 Lightning");
    }
    if (!submodel) continue;
    submodelsRaw.add(submodel);

    const cabMatch = submodel.match(CAB_RE);
    let lineCab = "";
    if (cabMatch) {
      lineCab = toTitleCase(cabMatch[1]);
      cabTypes.add(lineCab);
    }

    const doorMatch = submodel.match(DOOR_RE);
    let lineDoor = "";
    if (doorMatch) {
      lineDoor = `${doorMatch[1]}-Door`;
      doors.add(lineDoor);
    }

    const bedMatch = submodel.match(BED_RE);
    if (bedMatch) bedLengths.add(`${normalizeBed(bedMatch[1])}' Bed`);
    else {
      const shortBedMatch = submodel.match(SHORT_BED_RE);
      if (shortBedMatch) bedLengths.add(`${shortBedMatch[1]} Bed`);
    }

    // Trim = words BEFORE the first body/cab anchor. Handles both
    // pickups ("Base Crew Cab Pickup 4-Door" → trim "Base") and SUVs
    // ("EX Sport Utility 4-Door" → trim "EX"). Falls back gracefully
    // when no anchor is found.
    const trimAnchor = submodel.match(
      /\b(SuperCrew|SuperCab|CrewMax|Mega Cab|Quad Cab|Crew Cab|Extended Cab|Single Cab|Double Cab|Regular Cab|Access Cab|King Cab|Standard Cab|Sport Utility|Pickup|Wagon|Sedan|Coupe|Hatchback|Convertible|Van|Minivan)\b/i,
    );
    let lineTrim = "";
    if (trimAnchor && trimAnchor.index !== undefined) {
      let before = submodel.slice(0, trimAnchor.index).trim();
      // Strip leading powertrain prefix (Specialist 1F).
      before = before.replace(POWERTRAIN_PREFIX_RE, "").trim();
      // Drop Cab & Chassis fleet rows (Specialist 1G).
      if (before && !CAB_CHASSIS_RE.test(before)) {
        // Scrub trailing cab tokens (Specialist 1C — "STX Standard Cab"
        // leaks because "Standard" precedes the " Cab" anchor).
        before = before
          .replace(
            /\s+(Standard|Crew|Extended|Regular|Single|Double|Quad|Mega|Access|King)\s*$/i,
            "",
          )
          .trim();
        if (before) {
          trims.add(before);
          lineTrim = before;
        }
      }
    }

    if (lineTrim) {
      const key = `${lineCab}|${lineDoor}`;
      if (!trimsByCabDoor.has(key)) trimsByCabDoor.set(key, new Set());
      trimsByCabDoor.get(key)!.add(lineTrim);
    }
  }

  // Upgrade ACES cab labels to brand-friendly names (Specialist 1B/1D).
  if (cabBrandMap.size > 0) {
    const upgraded = new Set<string>();
    for (const c of cabTypes) {
      upgraded.add(cabBrandMap.get(c) ?? c);
    }
    cabTypes.clear();
    upgraded.forEach((c) => cabTypes.add(c));
  }

  // Collapse cosmetic-only trims (Specialist trim-noise rule). When every
  // trim in the catalog maps to the same (cab,doors) bucket AND none are
  // functional trims (Raptor, Tremor, Denali, Limited, …), suppress the
  // trim list entirely so the PDP doesn't render 13 chips that all mean
  // the same thing.
  let trimFiltered = false;
  if (trims.size > 0 && trimsByCabDoor.size === 1) {
    const hasFunctionalTrim = Array.from(trims).some((t) =>
      FUNCTIONAL_TRIMS.has(t.toLowerCase()),
    );
    if (!hasFunctionalTrim) {
      trims.clear();
      trimFiltered = true;
    }
  }

  const subattributes: Record<string, string[]> = {};
  if (cabTypes.size) subattributes.cabTypes = sortedUnique(cabTypes);
  if (bedLengths.size) subattributes.bedLengths = sortedUnique(bedLengths);
  if (trims.size) subattributes.trims = sortedUnique(trims);
  if (doors.size) subattributes.doors = sortedUnique(doors);
  if (submodelsRaw.size) subattributes.submodels = sortedUnique(submodelsRaw);
  if (engineExclusions.size)
    subattributes.engineExclusions = sortedUnique(engineExclusions);
  if (boxOptions.size) subattributes.boxOptions = sortedUnique(boxOptions);
  if (excludedSubmodels.size)
    subattributes.excludedSubmodels = sortedUnique(excludedSubmodels);
  // trimFiltered intentionally not stored — the consumer infers
  // "fits all standard trims" when `submodels` exists and `trims` doesn't.
  // Suppresses the warning we would otherwise need to track:
  // void trimFiltered;
  if (trimFiltered) {
    /* logged above; downstream infers from trims absence */
  }

  return {
    years: sortedUnique(years),
    makes: sortedUnique(makes),
    models: sortedUnique(models),
    notes: Array.from(notes),
    subattributes,
    applications: apps.sort((a, b) => {
      if (a.make !== b.make) return a.make.localeCompare(b.make);
      if (a.model !== b.model) return a.model.localeCompare(b.model);
      if (a.year !== b.year) return parseInt(a.year, 10) - parseInt(b.year, 10);
      return (a.submodel ?? "").localeCompare(b.submodel ?? "");
    }),
  };
}

function sortedUnique(s: Set<string>): string[] {
  return Array.from(s).sort((a, b) => a.localeCompare(b));
}

function toTitleCase(s: string): string {
  return s
    .toLowerCase()
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

// Cycle 14X+ post-sync: normalize "6", "6.0", "6.5", "5.8" to a single
// canonical bed-length representation. CA mixes "6 Ft" and "6.0 Ft"
// inconsistently — without normalization the chip set fragments to
// {"6.0' Bed", "6' Bed"} for the same physical bed.
function normalizeBed(raw: string): string {
  const n = parseFloat(raw);
  if (Number.isNaN(n)) return raw;
  // Whole-foot beds drop the trailing zero ("6' Bed" not "6.0' Bed").
  if (n === Math.floor(n)) return String(n);
  return n.toFixed(1);
}

// ---------- Shopify queries / mutations ----------
const LIST_PRODUCTS_QUERY = /* GraphQL */ `
  query ListProducts($first: Int!, $cursor: String) {
    products(first: $first, after: $cursor) {
      pageInfo { hasNextPage endCursor }
      nodes {
        id
        handle
        title
        cbItemName: metafield(namespace: "cb_integration", key: "item_name") {
          value
        }
      }
    }
  }
`;

const METAFIELDS_SET_MUTATION = /* GraphQL */ `
  mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields { id namespace key }
      userErrors { field message code }
    }
  }
`;

type ShopifyProduct = {
  id: string;
  handle: string;
  title: string;
  cbItemName?: { value: string | null } | null;
};

async function listAllProducts(): Promise<ShopifyProduct[]> {
  const all: ShopifyProduct[] = [];
  let cursor: string | null = null;
  for (;;) {
    const data = await shopifyAdmin<{
      products: {
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
        nodes: ShopifyProduct[];
      };
    }>(LIST_PRODUCTS_QUERY, { first: 250, cursor });
    all.push(...data.products.nodes);
    if (!data.products.pageInfo.hasNextPage) break;
    cursor = data.products.pageInfo.endCursor;
  }
  return all;
}

async function writeFitmentMetafields(
  productGid: string,
  parsed: ParsedFitment,
  raw: string,
): Promise<void> {
  // Shopify rejects empty list/text/json metafields ("INVALID_VALUE: Value
  // can't be blank"). Build the payload conditionally so each metafield is
  // included only when it has content. Raw is always written when present.
  const metafields: {
    ownerId: string;
    namespace: string;
    key: string;
    type: string;
    value: string;
  }[] = [];
  const push = (key: string, type: string, value: string) =>
    metafields.push({
      ownerId: productGid,
      namespace: "custom",
      key,
      type,
      value,
    });

  if (parsed.years.length > 0)
    push("fitment_years", "list.single_line_text_field", JSON.stringify(parsed.years));
  if (parsed.makes.length > 0)
    push("fitment_makes", "list.single_line_text_field", JSON.stringify(parsed.makes));
  if (parsed.models.length > 0)
    push("fitment_models", "list.single_line_text_field", JSON.stringify(parsed.models));
  if (parsed.notes.length > 0)
    push("fitment_notes", "multi_line_text_field", parsed.notes.join("<br>"));
  if (Object.keys(parsed.subattributes).length > 0)
    push("fitment_subattributes", "json", JSON.stringify(parsed.subattributes));
  // Cycle 14AS: per-application records — the schema-correct fitment source.
  // Replaces the broken flat year/make/model lists for verdict purposes.
  if (parsed.applications.length > 0)
    push("fitment_applications", "json", JSON.stringify(parsed.applications));
  if (raw && raw.trim())
    push("fitment_raw", "multi_line_text_field", raw);

  if (metafields.length === 0) return; // nothing to write
  const data = await shopifyAdmin<{
    metafieldsSet: {
      metafields: { id: string; namespace: string; key: string }[];
      userErrors: { field: string[] | null; message: string; code: string | null }[];
    };
  }>(METAFIELDS_SET_MUTATION, { metafields });
  const errs = data.metafieldsSet.userErrors;
  if (errs.length > 0) {
    throw new Error(
      `metafieldsSet errors: ${errs.map((e) => `${e.code ?? "ERR"}: ${e.message}`).join("; ")}`,
    );
  }
}

// ---------- main ----------
function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log(
    `CA fitment sync — domain=${SHOPIFY_DOMAIN}, profiles=[${CA_PROFILE_IDS.join(",")}]${
      DRY_RUN ? ", DRY-RUN" : ""
    }${ONLY_HANDLE ? `, handle=${ONLY_HANDLE}` : ""}${LIMIT ? `, limit=${LIMIT}` : ""}`,
  );

  console.log("Listing Shopify products…");
  const allProducts = await listAllProducts();
  console.log(`  → ${allProducts.length} products in catalog`);

  let queue = allProducts.filter(
    (p) => p.cbItemName?.value && p.cbItemName.value.trim(),
  );
  if (ONLY_HANDLE) queue = queue.filter((p) => p.handle === ONLY_HANDLE);
  if (LIMIT > 0) queue = queue.slice(0, LIMIT);
  console.log(`  → ${queue.length} products in sync queue`);

  let synced = 0;
  let notFound = 0;
  let errored = 0;
  const snapshot: Record<string, unknown> = {};

  for (let i = 0; i < queue.length; i++) {
    const p = queue[i];
    const cb = p.cbItemName!.value!.trim();
    const tag = `[${i + 1}/${queue.length}] ${p.handle} (${cb})`;
    try {
      const result = await lookupFitmentForCbItemName(cb);
      if (!result) {
        notFound++;
        snapshot[p.handle] = { cbItemName: cb, status: "not-found" };
        console.log(`${tag} → NOT FOUND in any profile`);
      } else {
        const parsed = parseFitmentString(result.fitmentRaw);
        snapshot[p.handle] = {
          cbItemName: cb,
          status: "synced",
          ...result,
          parsed,
        };
        const summary = `${parsed.years.length}y/${parsed.makes.length}mk/${parsed.models.length}md/${Object.keys(parsed.subattributes).length}sub`;
        if (!DRY_RUN) {
          await writeFitmentMetafields(p.id, parsed, result.fitmentRaw);
        }
        synced++;
        console.log(
          `${tag} → profile ${result.profileId}, sku ${result.matchedSku}, ${summary}${
            DRY_RUN ? " (dry-run, not written)" : ""
          }`,
        );
      }
    } catch (err) {
      errored++;
      snapshot[p.handle] = {
        cbItemName: cb,
        status: "error",
        error: (err as Error).message,
      };
      console.error(`${tag} → ERROR: ${(err as Error).message}`);
    }
    // Throttle so we stay under CA's ~5 req/sec account limit.
    await sleep(200);
  }

  const snapshotPath = path.join(
    process.cwd(),
    "data",
    "ca_fitment_snapshot.json",
  );
  await fs.mkdir(path.dirname(snapshotPath), { recursive: true });
  await fs.writeFile(snapshotPath, JSON.stringify(snapshot, null, 2));

  console.log(
    `\nDone. synced=${synced}, not-found=${notFound}, errored=${errored}. Snapshot: ${snapshotPath}`,
  );
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
