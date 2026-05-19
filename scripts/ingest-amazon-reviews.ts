/**
 * Cycle 14BD: ingest Amazon review handoff into the storefront.
 *
 * Reads:
 *   /tmp/stehlen-amazon-reviews/handoff_manifest.json   (61 reviews)
 *   data/review-fuzzy-matches-{date}.csv                (ASIN→handle map)
 *
 * Writes:
 *   data/amazon-reviews.json
 *     {
 *       "generated_at": "2026-05-19",
 *       "by_handle": {
 *         "<shopify-handle>": {
 *           "handle": "...",
 *           "asin": "...",
 *           "avg_rating": 4.7,
 *           "review_count": 3,
 *           "reviews": [
 *             { id, stars, title, body, reviewer, date, verified,
 *               helpful_votes, images: ["/reviews/{ASIN}_{rid}_{n}.jpg", ...] },
 *             ...
 *           ]
 *         }
 *       }
 *     }
 *
 * Owner-locked decisions (per "ship it" reply):
 *   - Keep B07PH2HQYQ Ford F-150 Underseat (medium-confidence match)
 *   - Drop B07M5J6QT6 Camaro/Firebird side markers (no real match)
 */
import { promises as fs } from "node:fs";
import path from "node:path";

type ReviewRecord = {
  asin: string;
  mpn: string | null;
  amazon_mpn: string | null;
  stehlen_part_number: string | null;
  product_title: string;
  product_avg_stars: number;
  review_id: string;
  reviewer: string;
  stars: number;
  title: string;
  body: string;
  date: string;
  verified: boolean;
  helpful_votes: number;
  images: string[];
};

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

const DROP_ASINS = new Set<string>([
  // No Shopify equivalent — Camaro/Firebird side markers not in catalog.
  "B07M5J6QT6",
  // Cycle 14BD R1 audit (auto-parts-specialist asin-audit-2026-05-19.csv):
  // confirmed cross-product mismatches. Shipping these reviews would be an
  // FTC compliance failure (16 CFR Part 255) — different product, sometimes
  // different vehicle, sometimes incompatible hitch class.
  "B07MDF528K", // Tundra bull guard handle → Camry window visor ASIN
  "B071SDM6H5", // Tacoma grille handle → Yaris sedan grille ASIN
  "B087L29BNF", // F-150 roll-up tonneau handle → hard tri-fold aluminum ASIN
  "B07JKLQPGL", // Highlander/Lexus RX Class 3 hitch handle → Prius Class 1 (1.25") hitch ASIN
  // NEEDS_REMAP set — same risk, no clean re-source available this round.
  // Drop until a verified ASIN→handle mapping is sourced.
  "B07L8T474C", // Impala matte-black grille handle → Chrome upper+lower combo ASIN (+ cross-ASIN photo paths)
  "B01N7FTO2D", // Pilot/MDX hitch — handle year range overstates ASIN coverage
  "B01FTGD6JQ", // S10/Sonoma tonneau LED combo claim not in ASIN (standalone tonneau)
  "B07D6XZ6KF", // 2019-2024 Ram tonneau LED combo claim + truncated year range
  "B0832K18QL", // F-Super Duty step bars — 4" oval ASIN vs 5" handle + cross-ASIN photo bleed
  "B07D6YHSNV", // Lincoln Mark LT — handle says tri-fold; ASIN is roll-up
  // Secondary ASINs also routed to the same already-dropped handles (the
  // fuzzy matcher mapped two ASINs to one handle in these cases). Drop
  // both so the handle is fully cleared.
  "B01FTGE16I", // Second ASIN mapped to Impala handle (cross-ASIN photo bleed)
  "B07JR9DQS5", // Second ASIN (5" oval) mapped to Super Duty 4"-vs-5" step handle
]);

async function main() {
  const manifest = JSON.parse(
    await fs.readFile("/tmp/stehlen-amazon-reviews/handoff_manifest.json", "utf8"),
  ) as { reviews: ReviewRecord[] };

  // Load the latest fuzzy-match CSV
  const dataDir = path.resolve(process.cwd(), "data");
  const matchFiles = (await fs.readdir(dataDir))
    .filter((f) => f.startsWith("review-fuzzy-matches-") && f.endsWith(".csv"))
    .sort();
  if (matchFiles.length === 0) {
    throw new Error("No review-fuzzy-matches-*.csv found in data/");
  }
  const matchPath = path.join(dataDir, matchFiles[matchFiles.length - 1]!);
  console.log(`[ingest] using match file: ${matchPath}`);
  const matchCsv = await fs.readFile(matchPath, "utf8");

  // Parse CSV → asin → handle
  const asinToHandle = new Map<string, string>();
  const lines = matchCsv.split(/\r?\n/).filter((l) => l.length > 0);
  const header = lines[0]!.split(",");
  const asinCol = header.indexOf("asin");
  const handleCol = header.indexOf("top_match_handle");
  for (let i = 1; i < lines.length; i++) {
    // naive CSV parse — values may contain quoted commas
    const cells = parseCsvLine(lines[i]!);
    const asin = cells[asinCol]?.trim();
    const handle = cells[handleCol]?.trim();
    if (asin && handle) asinToHandle.set(asin, handle);
  }
  console.log(`[ingest] loaded ${asinToHandle.size} ASIN→handle mappings`);

  // Group reviews by ASIN
  const byAsin = new Map<string, ReviewRecord[]>();
  for (const r of manifest.reviews) {
    if (!byAsin.has(r.asin)) byAsin.set(r.asin, []);
    byAsin.get(r.asin)!.push(r);
  }

  // Build per-handle bundles
  const byHandle: Record<string, ProductReviewBundle> = {};
  let droppedCount = 0;
  let unmappedCount = 0;
  let keptReviews = 0;
  let keptImages = 0;

  for (const [asin, reviews] of byAsin.entries()) {
    if (DROP_ASINS.has(asin)) {
      droppedCount += reviews.length;
      continue;
    }
    const handle = asinToHandle.get(asin);
    if (!handle) {
      unmappedCount += reviews.length;
      continue;
    }
    const normalized: NormalizedReview[] = reviews.map((r) => {
      // Cycle 14BD R1 (Ren BUG-14BD-002): defensive guard against
      // cross-ASIN photo bleed. Some review records reference image files
      // whose basename starts with a DIFFERENT ASIN — those photos belong
      // to a different product and must be filtered out. Compare each
      // basename's prefix to the bundle's ASIN before keeping the path.
      const imgs = r.images
        .map((p) => p.split("/").pop()!)
        .filter((basename) => basename.startsWith(`${asin}_`))
        .map((basename) => `/reviews/${basename}`);
      keptImages += imgs.length;
      return {
        id: r.review_id,
        stars: r.stars,
        title: r.title,
        body: r.body,
        reviewer: r.reviewer,
        date: r.date,
        verified: r.verified,
        helpful_votes: r.helpful_votes,
        images: imgs,
      };
    });
    keptReviews += normalized.length;

    // Merge if multiple ASINs map to the same Shopify handle (e.g. the
    // hitch + the hitch-with-ball-mount-combo SKUs sometimes collapse
    // onto the same product page on the Stehlen side).
    const existing = byHandle[handle];
    const mergedReviews = existing
      ? [...existing.reviews, ...normalized]
      : normalized;

    // Sort by helpful_votes desc, then date desc
    mergedReviews.sort(
      (a, b) =>
        b.helpful_votes - a.helpful_votes ||
        b.date.localeCompare(a.date),
    );

    const avg =
      mergedReviews.reduce((s, r) => s + r.stars, 0) / mergedReviews.length;

    byHandle[handle] = {
      handle,
      asin: existing?.asin ?? asin,
      amazon_title: existing?.amazon_title ?? reviews[0]!.product_title,
      avg_rating: Math.round(avg * 10) / 10,
      review_count: mergedReviews.length,
      reviews: mergedReviews,
    };
  }

  const out = {
    generated_at: new Date().toISOString().slice(0, 10),
    source:
      "Amazon storefront (https://www.amazon.com/s?me=A2DIKPO9NVQVB9), 4-5★ verified purchases with customer photos",
    by_handle: byHandle,
  };

  const outPath = path.resolve(dataDir, "amazon-reviews.json");
  await fs.writeFile(outPath, JSON.stringify(out, null, 2) + "\n", "utf8");

  console.log(`[ingest] wrote ${Object.keys(byHandle).length} product bundles → ${outPath}`);
  console.log(`[ingest] reviews kept: ${keptReviews}`);
  console.log(`[ingest] images referenced: ${keptImages}`);
  if (droppedCount) console.log(`[ingest] reviews dropped (DROP_ASINS): ${droppedCount}`);
  if (unmappedCount) console.log(`[ingest] reviews unmapped (no handle): ${unmappedCount}`);
}

/** Minimal CSV-line parser that respects quoted fields. */
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

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
