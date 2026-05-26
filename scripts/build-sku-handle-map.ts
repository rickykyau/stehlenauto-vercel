/**
 * Cycle 14BH: build a complete variant-SKU → product-handle map from
 * Shopify Admin. Cached so subsequent ingest runs don't hit the API.
 *
 * Output: data/sku-handle-map-YYYY-MM-DD.json
 *   {
 *     "generated_at": "2026-05-26",
 *     "by_sku": { "<sku>": "<handle>", ... }
 *   }
 *
 * Used by scripts/ingest-amazon-reviews-pass6.ts to resolve handoff
 * seller_skus to Shopify product handles. The CSV-image approach
 * (cycle 14BD) only matched 31/120 because image-filename bases
 * don't carry variant suffixes. Querying variants directly catches
 * those mismatches.
 */
import "dotenv/config";
import { config as loadEnv } from "dotenv";
import { createAdminApiClient } from "@shopify/admin-api-client";
import { promises as fs } from "node:fs";
import path from "node:path";

loadEnv({ path: ".env.local" });

const apiVersion =
  process.env.NEXT_PUBLIC_SHOPIFY_API_VERSION || "2026-04";
const domain = (
  process.env.SHOPIFY_STORE_DOMAIN ||
  process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN ||
  ""
)
  .replace(/^https?:\/\//, "")
  .replace(/\/+$/, "")
  .trim();
const token = process.env.SHOPIFY_ADMIN_TOKEN ?? "";

if (!domain || !token) {
  console.error("missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_TOKEN");
  process.exit(1);
}

const client = createAdminApiClient({
  storeDomain: domain,
  apiVersion,
  accessToken: token,
});

const QUERY = /* GraphQL */ `
  query ProductsWithVariantSkus($cursor: String) {
    products(first: 100, after: $cursor) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        handle
        title
        status
        variants(first: 50) {
          nodes {
            sku
          }
        }
      }
    }
  }
`;

type Resp = {
  data?: {
    products?: {
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
      nodes: Array<{
        handle: string;
        title: string;
        status: "ACTIVE" | "ARCHIVED" | "DRAFT";
        variants: { nodes: Array<{ sku: string | null }> };
      }>;
    };
  };
  errors?: unknown;
};

async function main() {
  const bySku: Record<string, string> = {};
  const byHandle: Record<string, string> = {}; // handle → title
  let cursor: string | null = null;
  let pages = 0;
  let total = 0;
  do {
    const res = (await client.request(QUERY, {
      variables: { cursor },
    })) as Resp;
    if (res.errors) {
      console.error(JSON.stringify(res.errors, null, 2));
      process.exit(1);
    }
    const conn = res.data?.products;
    if (!conn) break;
    for (const p of conn.nodes) {
      if (p.status === "ARCHIVED") continue;
      byHandle[p.handle] = p.title;
      for (const v of p.variants.nodes) {
        if (!v.sku) continue;
        const key = v.sku.trim().toLowerCase();
        if (!key) continue;
        if (!bySku[key]) bySku[key] = p.handle;
        total++;
      }
    }
    pages++;
    cursor = conn.pageInfo.hasNextPage ? conn.pageInfo.endCursor : null;
    console.log(
      `[sku-map] page ${pages}: ${conn.nodes.length} products, running total ${Object.keys(bySku).length} SKUs`,
    );
  } while (cursor);

  const today = new Date().toISOString().slice(0, 10);
  const outPath = path.resolve(
    process.cwd(),
    "data",
    `sku-handle-map-${today}.json`,
  );
  const out = {
    generated_at: today,
    total_skus_seen: total,
    unique_skus: Object.keys(bySku).length,
    by_sku: bySku,
    by_handle: byHandle,
  };
  await fs.writeFile(outPath, JSON.stringify(out, null, 2) + "\n", "utf8");
  console.log(
    `[sku-map] wrote ${out.unique_skus} unique SKUs + ${Object.keys(byHandle).length} handle titles → ${outPath}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
