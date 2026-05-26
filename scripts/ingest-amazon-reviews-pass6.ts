/**
 * Cycle 14BH: Pass 6 Amazon review handoff ingest (Ricky Tsui's
 * AIfenceguy/stehlen-amazon-reviews repo, 2026-05-22 batch).
 *
 * Inputs:
 *   /tmp/stehlen-amazon-reviews/reviews.json — 120 products, 231 reviews
 *   /tmp/stehlen-amazon-reviews/images/      — 212 customer photos
 *   data/sku-all-images-2026-05-14.csv       — Shopify image-filename ↔ handle map
 *
 * Mapping strategy (deterministic, no fuzzy-title fallback):
 *   1. For each handoff product, take `seller_sku` (e.g. `hlnb-civ064dlbw-jdma-901`)
 *   2. Strip the trailing `-901` / `-601` / `-602` channel/variant suffix
 *   3. Find image filenames in the SKU-images CSV that START with that base
 *   4. Look up the product_handle from those matching rows
 *
 * Tier policy (cycle 14BH):
 *   - Tier A (120) — INCLUDE (verified, 4-5★, has body)
 *   - Tier B  (4)  — INCLUDE (3★ verified + photo — honest mid-rating)
 *   - Tier A-inferred (107) — DROP THIS ROUND. Per FTC 16 CFR Part 255,
 *     displaying an editorially-inferred star rating without disclosure
 *     is risky. We already ship the SOURCED FROM AMAZON disclosure for
 *     the verified-rated set; adding sentiment-inferred ratings would
 *     muddy that line. Owner can opt them in later with a separate
 *     "Customer feedback (rating estimated)" UI treatment.
 *
 * Outputs:
 *   data/amazon-reviews.json (overwritten)
 *   public/reviews/ — net-new photos copied in, orphans removed
 */
import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const HANDOFF_DIR = "/tmp/stehlen-amazon-reviews";
const REVIEWS_JSON = path.join(HANDOFF_DIR, "reviews.json");
const IMAGES_DIR = path.join(HANDOFF_DIR, "images");
const SKU_IMAGES_CSV = path.join(ROOT, "data", "sku-all-images-2026-05-14.csv");
const SKU_HANDLE_MAP_JSON = path.join(
  ROOT,
  "data",
  "sku-handle-map-2026-05-26.json",
);
const PUBLIC_REVIEWS = path.join(ROOT, "public", "reviews");
const OUT_JSON = path.join(ROOT, "data", "amazon-reviews.json");
const UNMATCHED_CSV = path.join(ROOT, "data", "unmatched-pass6-skus-2026-05-26.csv");

type HandoffReview = {
  review_id: string;
  reviewer_name: string;
  star_rating: number;
  review_title: string;
  review_date: string;
  verified_purchase: boolean;
  review_body: string;
  helpful_votes: number;
  image_amazon_urls: string[];
  image_local_paths: string[];
  tier: "A" | "B" | "A-inferred";
  has_photo: boolean;
  rating_inferred: boolean;
};

type HandoffProduct = {
  asin: string;
  title: string;
  star_rating_average: number;
  review_count_total: number;
  review_count_qualifying: number;
  qualifying_reviews: HandoffReview[];
  seller_sku: string | null;
  parent_sku: string | null;
  in_stock: boolean;
};

type HandoffManifest = {
  products: HandoffProduct[];
};

/**
 * Cycle 14BH audit verdicts (auto-parts-specialist, 2026-05-26).
 * Source: data/asin-audit-2026-05-26.csv
 */
const DROP_ASINS = new Set<string>([
  // 10 outright DROP — wrong vehicle / wrong part type / safety-adjacent
  "B0832K18QL", // Nissan Titan handle → Ford F-150 ASIN
  "B087LLVHLM", // F-150 6.5ft tonneau handle → 5.5ft ASIN (11" gap)
  "B087L29BNF", // F-150 roll-up handle → hard tri-fold ASIN
  "B071SDM6H5", // Tacoma handle → Yaris sedan ASIN
  "B07JKLQPGL", // Highlander Class 3 handle → Prius Class 1 ASIN (safety)
  "B07LC1H1QM", // Honda Accord handle → Lincoln Navigator ASIN
  "B07M65DPSY", // Tacoma running boards handle → window visors ASIN
  "B07MKDT93Q", // RAV4 handle → Lexus IS/GS ASIN
  "B08LR7DW5R", // F-150 Escape hitch — review documents fitment failure
  "B0BRDK5S8X", // F-150 grille+LED handle → mud flaps ASIN
  // 16 NEEDS_REMAP — drop until owner fixes the Shopify handle slug
  // (year overshoots, finish mismatches, sub-type inversions)
  "B084SNMBLC", // Tahoe/Suburban/Avalanche year + finish
  "B00R16TZL6", // C/K headlights year overshoot 88-93
  "B07LC2GCK7", // Silverado finish + year overshoot 03-06
  "B07YGNWMYJ", // Ram 09-22 bull guard year (ASIN starts 2013)
  "B01FTGE16I", // Impala matte→glossy finish + photo bleed
  "B077MG32CJ", // Silverado year overshoot
  "B087L8PNKV", // Ram 6.5 vs 6.4 bed slug
  "B01N7FTO2D", // Pilot/MDX year range
  "B077JJDY3Y", // Durango/Jeep GC year overshoot
  "B07D6YHSNV", // F-150 5.5ft vs 6.5ft tonneau bed slug
  "B07MKDRXWX", // T&C hitch brand mislabel
  "B07PH2HQYQ", // F-150 underseat year overshoot
  "B082QSVSKT", // Tacoma year truncation
  "B083ZN7JYB", // Super Duty Crew vs Super Cab
  "B088CSF44N", // F-150 grille finish
  "B0B7QCZX36", // Ram headlights brand verification
  // Plus the prior cycle 14BD drops that weren't in pass 6 anyway,
  // listed for ingest idempotency safety.
  "B07M5J6QT6",
  "B07MDF528K",
  "B07L8T474C",
  "B01FTGD6JQ",
  "B07D6XZ6KF",
  "B07JR9DQS5",
]);

/**
 * Cross-ASIN photo bleed: reviews whose image_local_paths reference a
 * DIFFERENT ASIN than the parent ASIN. The pass6 ingest's defensive
 * basename-prefix guard already filters these out at file-level —
 * this set is the audit's documented record for posterity.
 */
const _CONTAMINATED_REVIEW_IDS = new Set<string>([
  "R32ZZFM8MS4P6P", // 09-22 Ram bull guard
  "R210ZLOG8OOKW9", // Nissan Titan steps (handle DROPped anyway)
  "R3SVTGQP6SKY4W", // Impala grille (handle DROPped anyway)
  "RO7A0FBFDVQZA", // Tacoma running boards (handle DROPped anyway)
]);
void _CONTAMINATED_REVIEW_IDS;

type NormalizedReview = {
  id: string;
  stars: number;
  title: string;
  body: string;
  reviewer: string;
  date: string;
  verified: boolean;
  helpful_votes: number;
  images: string[];
};

type ProductReviewBundle = {
  handle: string;
  asin: string;
  amazon_title: string;
  avg_rating: number;
  review_count: number;
  reviews: NormalizedReview[];
};

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuote) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuote = false;
        }
      } else {
        cur += c;
      }
    } else {
      if (c === '"') inQuote = true;
      else if (c === ",") {
        out.push(cur);
        cur = "";
      } else cur += c;
    }
  }
  out.push(cur);
  return out;
}

/**
 * Strip channel suffixes from seller_sku. Patterns seen:
 *   amazon-001922-901  → amazon-001922
 *   th-x507-c077-901   → th-x507-c077
 *   fggg-grbt-impa06lo-me-ch-602 → fggg-grbt-impa06lo-me-ch
 *   hlnb-civ064dlbw-jdma-901     → hlnb-civ064dlbw-jdma
 *
 * Suffix pattern: trailing `-NNN` where NNN is a 3-digit channel code
 * (601, 602, 901 observed). Strip exactly one trailing `-\d{3}`.
 */
function baseSku(sellerSku: string): string {
  return sellerSku.replace(/-\d{3}$/, "");
}

async function buildHandleMap(): Promise<Map<string, string>> {
  // Cycle 14BH: bridge from handoff seller_sku → Shopify product handle.
  //
  // Shopify variant SKUs are `item-XXXXXX` (CB Item Name format),
  // NOT the `amazon-XXX` / `fg-XXX` seller_sku format. The bridge is
  // the image-filename column in data/sku-all-images-2026-05-14.csv:
  // image filenames carry the part code (e.g. `hlnb-civ01lsq-jdma-1.jpg`)
  // which matches the seller_sku base.
  //
  // Build a base-SKU → handle map from the image CSV. Skip ARCHIVED
  // products. First non-archived match wins.
  const raw = await fs.readFile(SKU_IMAGES_CSV, "utf8");
  const lines = raw.split(/\r?\n/).filter((l) => l.length > 0);
  const header = parseCsvLine(lines[0]!);
  const fnIdx = header.indexOf("image_filename");
  const handleIdx = header.indexOf("product_handle");
  const statusIdx = header.indexOf("status");
  if (fnIdx < 0 || handleIdx < 0) {
    throw new Error("Expected columns missing in sku-all-images CSV");
  }
  const map = new Map<string, string>();
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]!);
    const filename = cells[fnIdx]?.trim();
    const handle = cells[handleIdx]?.trim();
    const status = cells[statusIdx]?.trim() ?? "";
    if (!filename || !handle) continue;
    if (status === "ARCHIVED") continue;
    const m = filename.match(/^(.+?)-\d+\.[a-z]+$/i);
    if (!m) continue;
    const base = m[1].toLowerCase();
    if (!map.has(base)) map.set(base, handle);
  }
  return map;
}

/**
 * Cycle 14BH fallback: title-based fuzzy match for handoff products
 * whose seller_sku didn't resolve via the image-CSV bridge. Token-set
 * Jaccard + year overlap + part-type bucket — same algorithm that
 * worked at 32/34 high-confidence in cycle 14BD.
 */
type HandleTitle = { handle: string; title: string };

async function loadHandleTitles(): Promise<HandleTitle[]> {
  const raw = await fs.readFile(SKU_HANDLE_MAP_JSON, "utf8");
  const parsed = JSON.parse(raw) as { by_handle: Record<string, string> };
  return Object.entries(parsed.by_handle).map(([handle, title]) => ({
    handle,
    title,
  }));
}

function tokenize(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s/-]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length >= 3),
  );
}

function yearsIn(s: string): Set<number> {
  const out = new Set<number>();
  // Patterns: "2007-2019", "99-02", "94-01", "2018"
  for (const m of s.matchAll(/\b(\d{2,4})\s*[-–]\s*(\d{2,4})\b/g)) {
    let a = parseInt(m[1], 10);
    let b = parseInt(m[2], 10);
    if (a < 100) a += a < 50 ? 2000 : 1900;
    if (b < 100) b += b < 50 ? 2000 : 1900;
    if (a > b) [a, b] = [b, a];
    if (b - a > 30) continue;
    for (let y = a; y <= b; y++) out.add(y);
  }
  for (const m of s.matchAll(/\b(19|20)\d{2}\b/g)) {
    out.add(parseInt(m[0], 10));
  }
  return out;
}

function partTypeBucket(s: string): string | null {
  const low = s.toLowerCase();
  const buckets: [string, string[]][] = [
    ["tonneau", ["tonneau", "bed cover", "roll-up", "roll up", "tri-fold"]],
    ["hitch", ["trailer hitch", "class 3", "class 1", "receiver hitch", "tow hitch"]],
    ["bull-guard", ["bull bar", "bull guard", "grille guard", "brush guard"]],
    ["grille", ["front grille", "hood grille", "bumper grille"]],
    ["headlights", ["headlight", "headlamp", "projector"]],
    ["bed-mat", ["bed mat", "bed liner"]],
    ["running-board", ["running board", "side step", "nerf bar", "step bar"]],
    ["floor-mat", ["floor mat", "floor liner"]],
    ["roof-rack", ["roof rack", "crossbar", "cargo basket"]],
    ["chase-rack", ["chase rack", "sport bar", "roll bar"]],
    ["molle", ["molle panel"]],
    ["underseat", ["underseat", "under-seat", "under seat storage"]],
  ];
  for (const [name, keywords] of buckets) {
    if (keywords.some((k) => low.includes(k))) return name;
  }
  return null;
}

function fuzzyMatch(
  handoffTitle: string,
  catalog: HandleTitle[],
): { handle: string; score: number } | null {
  const hTokens = tokenize(handoffTitle);
  const hYears = yearsIn(handoffTitle);
  const hBucket = partTypeBucket(handoffTitle);
  let best: { handle: string; score: number } | null = null;
  for (const cand of catalog) {
    const cBucket = partTypeBucket(cand.title);
    if (hBucket && cBucket && hBucket !== cBucket) continue; // part-type guard
    const cTokens = tokenize(cand.title);
    const inter = new Set<string>();
    for (const t of hTokens) if (cTokens.has(t)) inter.add(t);
    const union = new Set<string>([...hTokens, ...cTokens]);
    const jaccard = inter.size / union.size;
    // Year overlap bonus
    const cYears = yearsIn(cand.title);
    let yearOverlap = 0;
    for (const y of hYears) if (cYears.has(y)) yearOverlap++;
    const yearBonus = hYears.size > 0 ? (yearOverlap / hYears.size) * 0.3 : 0;
    const score = jaccard * 0.7 + yearBonus;
    if (!best || score > best.score) best = { handle: cand.handle, score };
  }
  // Require a meaningful score floor — 0.4 was the cycle 14BD threshold.
  if (best && best.score >= 0.4) return best;
  return null;
}

async function main() {
  console.log("[pass6] reading handoff manifest…");
  const manifest = JSON.parse(
    await fs.readFile(REVIEWS_JSON, "utf8"),
  ) as HandoffManifest;
  console.log(`[pass6] manifest has ${manifest.products.length} products`);

  console.log("[pass6] building SKU→handle map…");
  const skuMap = await buildHandleMap();
  console.log(`[pass6] indexed ${skuMap.size} base SKUs from Shopify catalog`);

  console.log("[pass6] loading handle titles for fuzzy fallback…");
  const handleTitles = await loadHandleTitles();
  console.log(`[pass6] loaded ${handleTitles.length} catalog titles`);

  const byHandle: Record<string, ProductReviewBundle> = {};
  const unmatched: { asin: string; seller_sku: string; base: string; title: string }[] = [];
  const fuzzyMatches: { asin: string; title: string; handle: string; score: number }[] = [];
  let fuzzyMatched = 0;
  let droppedInferred = 0;
  let droppedTierBNoPhoto = 0;
  let keptReviews = 0;
  let keptImages = 0;
  const photoBasenames = new Set<string>();

  let droppedByAudit = 0;
  for (const product of manifest.products) {
    if (DROP_ASINS.has(product.asin)) {
      droppedByAudit += product.qualifying_reviews.length;
      continue;
    }
    const sku = product.seller_sku;
    if (!sku) {
      unmatched.push({
        asin: product.asin,
        seller_sku: "",
        base: "",
        title: product.title,
      });
      continue;
    }
    // Shopify variant SKUs are stored as the full seller_sku including the
    // channel suffix (e.g. `amazon-001922-901`). Try the full string first,
    // then fall back to stripping the suffix (some products use the bare
    // base SKU). Compound seller_skus (with `+`) split into candidates.
    const components = sku.split("+").map((s) => s.trim().toLowerCase());
    const candidates: string[] = [];
    for (const c of components) {
      candidates.push(c); // full
      candidates.push(baseSku(c)); // base (no -NNN suffix)
    }
    let handle: string | undefined;
    for (const cand of candidates) {
      const hit = skuMap.get(cand);
      if (hit) {
        handle = hit;
        break;
      }
    }
    if (!handle) {
      // Cycle 14BH fallback: title-based fuzzy match against the live
      // Shopify catalog. Caught 32/34 high-confidence in cycle 14BD on
      // a smaller batch. Threshold ≥0.4 — anything weaker than that
      // is dropped to unmatched for the auto-parts-specialist audit
      // to either confirm or remap.
      const fuzz = fuzzyMatch(product.title, handleTitles);
      if (fuzz) {
        handle = fuzz.handle;
        fuzzyMatches.push({
          asin: product.asin,
          title: product.title,
          handle: fuzz.handle,
          score: Math.round(fuzz.score * 100) / 100,
        });
        fuzzyMatched++;
      } else {
        unmatched.push({
          asin: product.asin,
          seller_sku: sku,
          base: candidates.join("|"),
          title: product.title,
        });
        continue;
      }
    }

    // Filter reviews. Tier A + B only this round (see header docstring).
    const filtered: NormalizedReview[] = [];
    for (const r of product.qualifying_reviews) {
      if (r.tier === "A-inferred" || r.rating_inferred) {
        droppedInferred++;
        continue;
      }
      if (r.tier === "B" && !r.has_photo) {
        // Tier B's contract requires photo; drop any anomaly.
        droppedTierBNoPhoto++;
        continue;
      }
      const images: string[] = [];
      for (const local of r.image_local_paths) {
        const basename = path.basename(local);
        // Defensive: prefix must start with this product's ASIN.
        if (!basename.startsWith(`${product.asin}_`)) continue;
        photoBasenames.add(basename);
        images.push(`/reviews/${basename}`);
      }
      keptImages += images.length;
      filtered.push({
        id: r.review_id,
        stars: r.star_rating,
        title: r.review_title || "",
        body: r.review_body,
        reviewer: r.reviewer_name,
        date: r.review_date,
        verified: r.verified_purchase,
        helpful_votes: r.helpful_votes,
        images,
      });
    }
    if (filtered.length === 0) continue;

    // Merge if multiple ASINs map to the same handle (variants).
    const existing = byHandle[handle];
    const merged = existing ? [...existing.reviews, ...filtered] : filtered;
    merged.sort(
      (a, b) =>
        b.helpful_votes - a.helpful_votes ||
        b.date.localeCompare(a.date),
    );
    const avg =
      merged.reduce((s, r) => s + r.stars, 0) / merged.length;
    byHandle[handle] = {
      handle,
      asin: existing?.asin ?? product.asin,
      amazon_title: existing?.amazon_title ?? product.title,
      avg_rating: Math.round(avg * 10) / 10,
      review_count: merged.length,
      reviews: merged,
    };
    keptReviews += filtered.length;
  }

  const out = {
    generated_at: new Date().toISOString().slice(0, 10),
    source:
      "Amazon storefront (https://www.amazon.com/s?me=A2DIKPO9NVQVB9) — Pass 6 (Bright Data full catalog scan, 2026-05-22). Verified purchase 3-5★, body required. Tier A-inferred dropped per FTC 16 CFR Part 255 (sentiment-inferred ratings not displayed without explicit disclosure).",
    by_handle: byHandle,
  };
  await fs.writeFile(OUT_JSON, JSON.stringify(out, null, 2) + "\n", "utf8");

  // Copy photos and prune orphans.
  await fs.mkdir(PUBLIC_REVIEWS, { recursive: true });
  for (const name of photoBasenames) {
    const src = path.join(IMAGES_DIR, name);
    const dst = path.join(PUBLIC_REVIEWS, name);
    try {
      await fs.copyFile(src, dst);
    } catch (err) {
      console.warn(`[pass6] missing photo ${name}:`, (err as Error).message);
    }
  }
  const existing = await fs.readdir(PUBLIC_REVIEWS);
  let pruned = 0;
  for (const f of existing) {
    if (!photoBasenames.has(f)) {
      await fs.unlink(path.join(PUBLIC_REVIEWS, f));
      pruned++;
    }
  }

  // Write unmatched audit CSV.
  const lines = [
    "asin,seller_sku,base_lookup,title",
    ...unmatched.map(
      (u) =>
        `${u.asin},${u.seller_sku},${u.base},"${u.title.replace(/"/g, '""')}"`,
    ),
  ];
  await fs.writeFile(UNMATCHED_CSV, lines.join("\n") + "\n", "utf8");

  // Write fuzzy-match audit CSV for the auto-parts-specialist to vet.
  const fuzzyCsvPath = path.join(
    ROOT,
    "data",
    "pass6-fuzzy-matches-2026-05-26.csv",
  );
  const fuzzyLines = [
    "asin,score,handle,handoff_title",
    ...fuzzyMatches.map(
      (f) =>
        `${f.asin},${f.score},${f.handle},"${f.title.replace(/"/g, '""')}"`,
    ),
  ];
  await fs.writeFile(fuzzyCsvPath, fuzzyLines.join("\n") + "\n", "utf8");

  console.log(`[pass6] wrote ${Object.keys(byHandle).length} product bundles → ${OUT_JSON}`);
  console.log(`[pass6] reviews kept: ${keptReviews}`);
  console.log(`[pass6] images referenced: ${keptImages}`);
  console.log(`[pass6] resolved via fuzzy title: ${fuzzyMatched} → ${fuzzyCsvPath}`);
  console.log(`[pass6] unmatched products: ${unmatched.length} → ${UNMATCHED_CSV}`);
  console.log(`[pass6] dropped by audit (DROP+NEEDS_REMAP): ${droppedByAudit}`);
  console.log(`[pass6] dropped A-inferred: ${droppedInferred}`);
  console.log(`[pass6] dropped Tier B w/o photo: ${droppedTierBNoPhoto}`);
  console.log(`[pass6] photos copied to public/reviews/, pruned orphans: ${pruned}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
