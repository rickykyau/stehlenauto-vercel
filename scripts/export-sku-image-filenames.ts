/**
 * Export per-SKU featured image filenames from Shopify.
 *
 * Owner asked for a CSV mapping each variant SKU (the CB / ChannelAdvisor
 * Item Name) to the listing picture filename merch uploaded to Shopify.
 * The "listing picture" = the product's featured image (the one Shopify
 * surfaces on collection cards + as the first PDP slot). We pull the
 * raw CDN URL and extract the basename so the CSV column carries the
 * file the merchant uploaded, not the resized variant URL.
 *
 * Run with:  pnpm tsx scripts/export-sku-image-filenames.ts
 *   (or)    pnpm dotenv -e .env.local -- pnpm tsx scripts/export-sku-image-filenames.ts
 *
 * Writes:
 *   data/sku-image-filenames-YYYY-MM-DD.csv
 *
 * CSV columns: sku, image_filename, product_handle, product_title, image_url, status
 */

import "dotenv/config";
import { config as loadEnv } from "dotenv";
import { createAdminApiClient } from "@shopify/admin-api-client";
import { promises as fs } from "node:fs";
import path from "node:path";

loadEnv({ path: ".env.local" });

const apiVersion = process.env.NEXT_PUBLIC_SHOPIFY_API_VERSION || "2026-04";
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
  console.error(
    "[export] missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_TOKEN — abort.",
  );
  process.exit(1);
}

const client = createAdminApiClient({
  storeDomain: domain,
  apiVersion,
  accessToken: token,
});

type Variant = {
  sku: string | null;
};

type ProductNode = {
  id: string;
  handle: string;
  title: string;
  status: "ACTIVE" | "ARCHIVED" | "DRAFT";
  featuredImage: { url: string; altText: string | null } | null;
  variants: { nodes: Variant[] };
};

type ListQuery = {
  products: {
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
    nodes: ProductNode[];
  };
};

const LIST_QUERY = /* GraphQL */ `
  query ListProducts($first: Int!, $cursor: String) {
    products(first: $first, after: $cursor, sortKey: TITLE) {
      pageInfo { hasNextPage endCursor }
      nodes {
        id
        handle
        title
        status
        featuredImage { url altText }
        variants(first: 100) {
          nodes { sku }
        }
      }
    }
  }
`;

async function fetchAllProducts(): Promise<ProductNode[]> {
  const out: ProductNode[] = [];
  let cursor: string | null = null;
  let pages = 0;
  while (true) {
    const res = await client.request(LIST_QUERY, {
      variables: { first: 100, cursor },
    });
    if (res.errors) throw new Error(JSON.stringify(res.errors));
    const data = res.data as unknown as ListQuery;
    out.push(...data.products.nodes);
    pages += 1;
    process.stdout.write(
      `\r[export] paged through ${pages} pages, ${out.length} products so far`,
    );
    if (!data.products.pageInfo.hasNextPage) break;
    cursor = data.products.pageInfo.endCursor;
  }
  process.stdout.write("\n");
  return out;
}

/**
 * Shopify CDN URL example:
 *   https://cdn.shopify.com/s/files/1/0123/4567/8901/files/tonneau-cover-front.jpg?v=1234567890
 * The bit between the last slash and the query string is what merch uploaded.
 */
function extractFilename(url: string): string {
  try {
    const u = new URL(url);
    const last = u.pathname.split("/").filter(Boolean).pop() ?? "";
    // Strip Shopify's resize suffix patterns (e.g. _500x500, _1024x) so the
    // filename matches what was uploaded. Resize suffixes only appear when
    // the URL was minted with a transform; the raw featured-image URL we
    // request shouldn't have them, but strip defensively.
    return last.replace(/_(\d+x\d*|x\d+)(?=\.[a-z]+$)/i, "");
  } catch {
    return "";
  }
}

function csvEscape(value: string | null | undefined): string {
  const s = (value ?? "").toString();
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

async function main() {
  console.log(`[export] store: ${domain}, API ${apiVersion}`);
  const products = await fetchAllProducts();
  console.log(`[export] fetched ${products.length} products total`);

  const rows: string[] = [
    [
      "sku",
      "image_filename",
      "product_handle",
      "product_title",
      "image_url",
      "status",
    ].join(","),
  ];

  let skuCount = 0;
  let missingImage = 0;
  let missingSku = 0;

  for (const p of products) {
    const url = p.featuredImage?.url ?? "";
    const filename = url ? extractFilename(url) : "";
    if (!url) missingImage += 1;
    const variants = p.variants.nodes ?? [];
    if (variants.length === 0) {
      // Product with no variants — emit one row with empty SKU so the
      // owner can see the product exists but has no SKU to map.
      missingSku += 1;
      rows.push(
        [
          "",
          csvEscape(filename),
          csvEscape(p.handle),
          csvEscape(p.title),
          csvEscape(url),
          csvEscape(p.status),
        ].join(","),
      );
      continue;
    }
    for (const v of variants) {
      const sku = (v.sku ?? "").trim();
      if (!sku) missingSku += 1;
      rows.push(
        [
          csvEscape(sku),
          csvEscape(filename),
          csvEscape(p.handle),
          csvEscape(p.title),
          csvEscape(url),
          csvEscape(p.status),
        ].join(","),
      );
      skuCount += 1;
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const outPath = path.resolve(
    process.cwd(),
    "data",
    `sku-image-filenames-${today}.csv`,
  );
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, rows.join("\n") + "\n", "utf8");

  console.log(`[export] wrote ${rows.length - 1} SKU rows → ${outPath}`);
  console.log(`[export] products without featured image: ${missingImage}`);
  console.log(`[export] variant rows with missing SKU:   ${missingSku}`);
  console.log(`[export] SKUs covered (non-blank):        ${skuCount - missingSku}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
