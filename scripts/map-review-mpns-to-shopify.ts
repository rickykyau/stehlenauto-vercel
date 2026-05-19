/**
 * Map every MPN in the Amazon review handoff to its Shopify product
 * + variant SKU + handle. MPN lives in the variant metafield
 * `mm-google-shopping.mpn` (used to power Stehlen's Google Shopping
 * feed — same identifier we want for review attribution).
 *
 * Reads:
 *   /tmp/stehlen-amazon-reviews/handoff_manifest.json
 *
 * Writes:
 *   data/review-mpn-to-shopify-YYYY-MM-DD.csv
 *
 * CSV columns: mpn, asin, product_title_amazon, matched_handle,
 *              matched_sku, matched_title_shopify, status, source
 *
 * `source` = "metafield" | "title" | "tag" | "unmatched"
 *   metafield — best, primary mapping
 *   title     — product title contains "MPN <value>" (Curt-style)
 *   tag       — product has a tag equal to the MPN value
 *   unmatched — owner needs to add the metafield or supply mapping
 */
import "dotenv/config";
import { config as loadEnv } from "dotenv";
import { createAdminApiClient } from "@shopify/admin-api-client";
import { promises as fs } from "node:fs";
import path from "node:path";

loadEnv({ path: ".env.local" });

type ReviewRecord = {
  asin: string;
  mpn: string | null;
  amazon_mpn: string | null;
  stehlen_part_number: string | null;
  product_title: string;
};

type Match = {
  source: "metafield" | "title" | "tag" | "unmatched";
  handle: string | null;
  sku: string | null;
  shopify_title: string | null;
};

async function main() {
  const handoffPath = "/tmp/stehlen-amazon-reviews/handoff_manifest.json";
  const raw = await fs.readFile(handoffPath, "utf8");
  const manifest = JSON.parse(raw) as { reviews: ReviewRecord[] };
  console.log(`[map] loaded ${manifest.reviews.length} reviews`);

  // Collect unique MPN candidates (some reviews share an MPN).
  const seen = new Map<
    string,
    { asin: string; amazon_mpn: string | null; amazon_title: string }
  >();
  for (const r of manifest.reviews) {
    const mpn = (r.mpn || r.amazon_mpn || "").trim().toLowerCase();
    if (!mpn) continue;
    if (!seen.has(mpn)) {
      seen.set(mpn, {
        asin: r.asin,
        amazon_mpn: r.amazon_mpn,
        amazon_title: r.product_title,
      });
    }
  }
  console.log(`[map] ${seen.size} unique MPNs`);

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

  // Single query strategy: fetch all products with their variants +
  // mm-google-shopping.mpn metafield, then in-memory match. Faster
  // than 34 round-trips of admin search.
  type Variant = {
    sku: string | null;
    mpnMetafield: { value: string | null } | null;
  };
  type Product = {
    handle: string;
    title: string;
    tags: string[];
    variants: { nodes: Variant[] };
  };
  type ListQuery = {
    products: {
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
      nodes: Product[];
    };
  };

  const Q = /* GraphQL */ `
    query ListAll($first: Int!, $cursor: String) {
      products(first: $first, after: $cursor) {
        pageInfo { hasNextPage endCursor }
        nodes {
          handle
          title
          tags
          variants(first: 50) {
            nodes {
              sku
              mpnMetafield: metafield(namespace: "mm-google-shopping", key: "mpn") { value }
            }
          }
        }
      }
    }
  `;

  const products: Product[] = [];
  let cursor: string | null = null;
  let page = 0;
  while (true) {
    const r = await client.request(Q, { variables: { first: 100, cursor } });
    if (r.errors) throw new Error(JSON.stringify(r.errors));
    const d = r.data as unknown as ListQuery;
    products.push(...d.products.nodes);
    page += 1;
    process.stdout.write(
      `\r[map] fetched page ${page}, ${products.length} products`,
    );
    if (!d.products.pageInfo.hasNextPage) break;
    cursor = d.products.pageInfo.endCursor;
  }
  process.stdout.write("\n");

  // Build lookup indices
  const mpnIndex = new Map<string, { product: Product; variant: Variant }>();
  const tagIndex = new Map<string, Product[]>();
  for (const p of products) {
    for (const v of p.variants.nodes) {
      const m = (v.mpnMetafield?.value || "").trim().toLowerCase();
      if (m && !mpnIndex.has(m)) mpnIndex.set(m, { product: p, variant: v });
    }
    for (const t of p.tags) {
      const k = t.trim().toLowerCase();
      if (!tagIndex.has(k)) tagIndex.set(k, []);
      tagIndex.get(k)!.push(p);
    }
  }
  console.log(`[map] indexed ${mpnIndex.size} MPN-metafield values`);

  function findMatch(mpn: string): Match {
    const key = mpn.toLowerCase();
    // 1. Variant metafield
    const direct = mpnIndex.get(key);
    if (direct) {
      return {
        source: "metafield",
        handle: direct.product.handle,
        sku: direct.variant.sku,
        shopify_title: direct.product.title,
      };
    }
    // 2. Tag match
    const tagged = tagIndex.get(key);
    if (tagged && tagged.length > 0) {
      const p = tagged[0]!;
      return {
        source: "tag",
        handle: p.handle,
        sku: p.variants.nodes[0]?.sku ?? null,
        shopify_title: p.title,
      };
    }
    // 3. Title scan (any product whose title contains the MPN string)
    const titleHit = products.find((p) =>
      p.title.toLowerCase().includes(key),
    );
    if (titleHit) {
      return {
        source: "title",
        handle: titleHit.handle,
        sku: titleHit.variants.nodes[0]?.sku ?? null,
        shopify_title: titleHit.title,
      };
    }
    return { source: "unmatched", handle: null, sku: null, shopify_title: null };
  }

  const csvEsc = (s: string | null | undefined) => {
    const x = (s ?? "").toString();
    return /[",\n\r]/.test(x) ? `"${x.replace(/"/g, '""')}"` : x;
  };

  const lines: string[] = [
    [
      "mpn",
      "asin",
      "product_title_amazon",
      "matched_handle",
      "matched_sku",
      "matched_title_shopify",
      "source",
    ].join(","),
  ];

  let matched = 0;
  let unmatched = 0;
  const counts = { metafield: 0, tag: 0, title: 0, unmatched: 0 };
  for (const [mpn, info] of seen.entries()) {
    const m = findMatch(mpn);
    counts[m.source] += 1;
    if (m.source !== "unmatched") matched += 1;
    else unmatched += 1;
    lines.push(
      [
        csvEsc(mpn),
        csvEsc(info.asin),
        csvEsc(info.amazon_title),
        csvEsc(m.handle),
        csvEsc(m.sku),
        csvEsc(m.shopify_title),
        m.source,
      ].join(","),
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const outPath = path.resolve(
    process.cwd(),
    "data",
    `review-mpn-to-shopify-${today}.csv`,
  );
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, lines.join("\n") + "\n", "utf8");

  console.log(`\n[map] wrote ${lines.length - 1} rows → ${outPath}`);
  console.log(`[map] matched: ${matched} / unmatched: ${unmatched}`);
  console.log(`[map] by source — metafield: ${counts.metafield}, tag: ${counts.tag}, title: ${counts.title}, unmatched: ${counts.unmatched}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
