/**
 * Fuzzy-match Amazon review records to Shopify products using
 * normalized title tokens. The MPN metafield is empty across the
 * catalog, so this is the only auto-mapping path.
 *
 * Algorithm:
 * 1. Tokenize both titles to lowercase words, drop stopwords
 *    ("for", "with", "compatible", "the", etc.) and short tokens.
 * 2. Extract structured signals: year ranges (e.g. 2015-2024), bed
 *    length (5.5 ft), part type bucket (hitch, mat, grille, etc.).
 * 3. Score = Jaccard(tokens) * 0.5 + year-overlap-bonus + part-type-bonus.
 * 4. Best score per Amazon product; flag low-confidence matches for
 *    owner review.
 *
 * Output:
 *   data/review-fuzzy-matches-YYYY-MM-DD.csv
 *
 * CSV: asin, amazon_title, top_match_handle, top_match_title,
 *      top_match_sku, score, confidence, runner_up_handle,
 *      runner_up_title, runner_up_score
 *
 * `confidence` = "high" (≥0.45), "medium" (0.30-0.45), "low" (<0.30)
 */
import "dotenv/config";
import { config as loadEnv } from "dotenv";
import { createAdminApiClient } from "@shopify/admin-api-client";
import { promises as fs } from "node:fs";
import path from "node:path";

loadEnv({ path: ".env.local" });

const STOPWORDS = new Set([
  "for", "with", "compatible", "the", "and", "a", "an", "of", "to",
  "in", "on", "at", "from", "by", "or", "is", "be", "this", "that",
  "fits", "fit", "kit", "set", "pcs", "piece", "pieces", "pack",
  "stehlen", "amazon",
]);

const PART_TYPE_BUCKETS: Record<string, string[]> = {
  hitch: ["hitch", "receiver", "tow", "towing", "trailer"],
  grille: ["grille", "grill", "mesh"],
  guard: ["guard", "bull", "brush", "bumper-guard"],
  headlight: ["headlight", "headlights", "headlamp"],
  taillight: ["taillight", "taillights", "taillamp"],
  mirror: ["mirror", "mirrors"],
  fender: ["fender", "flare", "flares"],
  visor: ["visor", "visors", "deflector", "vent"],
  bedmat: ["bed", "mat", "liner"],
  tonneau: ["tonneau", "cover"],
  step: ["step", "running-board", "running", "board", "side-step", "nerf"],
  rack: ["rack", "basket", "carrier"],
  mudflap: ["mud", "flap", "flaps", "splash"],
};

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9 \-/.]/g, " ")
    .split(/[\s/]+/)
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t));
}

function extractYears(s: string): Set<number> {
  // Match "2015-2024", "07-18", "2015 to 2024", individual "2018"
  const years = new Set<number>();
  const fullRange = s.matchAll(/\b(19[89]\d|20[0-3]\d)\s*[-–]\s*(19[89]\d|20[0-3]\d)\b/g);
  for (const m of fullRange) {
    const start = parseInt(m[1]!);
    const end = parseInt(m[2]!);
    for (let y = start; y <= end; y++) years.add(y);
  }
  const shortRange = s.matchAll(/\b(\d{2})\s*[-–]\s*(\d{2})\b/g);
  for (const m of shortRange) {
    const a = parseInt(m[1]!);
    const b = parseInt(m[2]!);
    const expand = (yy: number) => (yy >= 50 ? 1900 + yy : 2000 + yy);
    const start = expand(a);
    const end = expand(b);
    if (end - start <= 30) for (let y = start; y <= end; y++) years.add(y);
  }
  const single = s.matchAll(/\b(19[89]\d|20[0-3]\d)\b/g);
  for (const m of single) years.add(parseInt(m[1]!));
  return years;
}

function partType(s: string): string | null {
  const lc = s.toLowerCase();
  for (const [bucket, kws] of Object.entries(PART_TYPE_BUCKETS)) {
    for (const k of kws) {
      const re = new RegExp(`\\b${k}\\b`, "i");
      if (re.test(lc)) return bucket;
    }
  }
  return null;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersect = 0;
  for (const t of a) if (b.has(t)) intersect += 1;
  return intersect / (a.size + b.size - intersect);
}

function yearOverlap(a: Set<number>, b: Set<number>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let n = 0;
  for (const y of a) if (b.has(y)) n += 1;
  return n / Math.min(a.size, b.size);
}

async function main() {
  const manifest = JSON.parse(
    await fs.readFile("/tmp/stehlen-amazon-reviews/handoff_manifest.json", "utf8"),
  ) as { reviews: { asin: string; mpn: string | null; product_title: string }[] };

  // Unique by ASIN
  const amazonProducts = new Map<string, { title: string; mpn: string | null }>();
  for (const r of manifest.reviews) {
    if (!amazonProducts.has(r.asin)) {
      amazonProducts.set(r.asin, { title: r.product_title, mpn: r.mpn });
    }
  }
  console.log(`[fuzzy] ${amazonProducts.size} unique Amazon products`);

  const client = createAdminApiClient({
    storeDomain: (
      process.env.SHOPIFY_STORE_DOMAIN ||
      process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN ||
      ""
    )
      .replace(/^https?:\/\//, "")
      .replace(/\/+$/, "")
      .trim(),
    apiVersion: process.env.NEXT_PUBLIC_SHOPIFY_API_VERSION || "2026-04",
    accessToken: process.env.SHOPIFY_ADMIN_TOKEN || "",
  });

  type Shop = {
    handle: string;
    title: string;
    variants: { nodes: { sku: string | null }[] };
  };
  const Q = /* GraphQL */ `
    query All($first: Int!, $cursor: String) {
      products(first: $first, after: $cursor) {
        pageInfo { hasNextPage endCursor }
        nodes {
          handle
          title
          variants(first: 1) { nodes { sku } }
        }
      }
    }
  `;
  const shop: Shop[] = [];
  let cursor: string | null = null;
  let pg = 0;
  while (true) {
    const r = await client.request(Q, { variables: { first: 250, cursor } });
    if (r.errors) throw new Error(JSON.stringify(r.errors));
    const d = r.data as { products: { pageInfo: { hasNextPage: boolean; endCursor: string | null }; nodes: Shop[] } };
    shop.push(...d.products.nodes);
    pg += 1;
    process.stdout.write(`\r[fuzzy] paged ${pg}, ${shop.length} products`);
    if (!d.products.pageInfo.hasNextPage) break;
    cursor = d.products.pageInfo.endCursor;
  }
  process.stdout.write("\n");

  // Pre-tokenize Shopify catalog
  const shopFeatures = shop.map((p) => ({
    p,
    tokens: new Set(tokenize(p.title)),
    years: extractYears(p.title),
    part: partType(p.title),
  }));

  const csvEsc = (s: string | null | undefined) => {
    const x = (s ?? "").toString();
    return /[",\n\r]/.test(x) ? `"${x.replace(/"/g, '""')}"` : x;
  };
  const lines = [
    "asin,mpn,amazon_title,top_match_handle,top_match_sku,top_match_title,score,confidence,runner_up_handle,runner_up_title,runner_up_score",
  ];

  let high = 0, med = 0, low = 0;
  for (const [asin, info] of amazonProducts.entries()) {
    const aTokens = new Set(tokenize(info.title));
    const aYears = extractYears(info.title);
    const aPart = partType(info.title);

    const scored = shopFeatures
      .map((f) => {
        const tk = jaccard(aTokens, f.tokens);
        const yr = yearOverlap(aYears, f.years);
        const pt = aPart && f.part === aPart ? 0.25 : 0;
        const score = tk * 0.5 + yr * 0.25 + pt;
        return { f, score };
      })
      .sort((a, b) => b.score - a.score);

    const top = scored[0]!;
    const runner = scored[1]!;
    const confidence =
      top.score >= 0.45 ? "high" : top.score >= 0.3 ? "medium" : "low";
    if (confidence === "high") high += 1;
    else if (confidence === "medium") med += 1;
    else low += 1;

    lines.push(
      [
        csvEsc(asin),
        csvEsc(info.mpn),
        csvEsc(info.title),
        csvEsc(top.f.p.handle),
        csvEsc(top.f.p.variants.nodes[0]?.sku ?? ""),
        csvEsc(top.f.p.title),
        top.score.toFixed(3),
        confidence,
        csvEsc(runner.f.p.handle),
        csvEsc(runner.f.p.title),
        runner.score.toFixed(3),
      ].join(","),
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const outPath = path.resolve(
    process.cwd(),
    "data",
    `review-fuzzy-matches-${today}.csv`,
  );
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, lines.join("\n") + "\n", "utf8");

  console.log(`\n[fuzzy] wrote ${lines.length - 1} rows → ${outPath}`);
  console.log(`[fuzzy] confidence: high=${high}, medium=${med}, low=${low}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
