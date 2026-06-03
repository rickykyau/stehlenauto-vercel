/**
 * Export ALL image URLs per SKU in WIDE format (one row per SKU).
 *
 * Long-format (one row per image) was already available via
 * scripts/export-sku-all-images.ts, but the owner wants the file
 * pivoted: one SKU per row, every image URL in its own column in
 * gallery order. Columns auto-size to the widest gallery in the
 * catalog; SKUs with fewer images leave the trailing columns empty.
 *
 * Run with:  pnpm tsx scripts/export-sku-images-wide.ts
 *
 * Writes:
 *   data/sku-images-wide-YYYY-MM-DD.csv
 *
 * CSV columns:
 *   sku, product_handle, product_title, status, image_count,
 *   image_1_url, image_2_url, image_3_url, ... image_N_url
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

type Image = { url: string };
type Variant = { sku: string | null };

type ProductNode = {
  id: string;
  handle: string;
  title: string;
  status: "ACTIVE" | "ARCHIVED" | "DRAFT";
  images: { nodes: Image[] };
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
        images(first: 50) { nodes { url } }
        variants(first: 100) { nodes { sku } }
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

function csvEscape(value: string | null | undefined): string {
  const s = (value ?? "").toString();
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

async function main() {
  console.log(`[export] store: ${domain}, API ${apiVersion}`);
  const products = await fetchAllProducts();
  console.log(`[export] fetched ${products.length} products total`);

  // First pass: build per-SKU image lists + find the max image count.
  type Row = {
    sku: string;
    handle: string;
    title: string;
    status: string;
    images: string[];
  };
  const rows: Row[] = [];
  let maxImages = 0;
  let totalImagesEmitted = 0;

  for (const p of products) {
    const galleryUrls = (p.images.nodes ?? []).map((n) => n.url);
    const skus = (p.variants.nodes ?? [])
      .map((v) => (v.sku ?? "").trim())
      .filter((s) => s.length > 0);
    const skuList = skus.length > 0 ? skus : [""];
    for (const sku of skuList) {
      rows.push({
        sku,
        handle: p.handle,
        title: p.title,
        status: p.status,
        images: galleryUrls,
      });
      if (galleryUrls.length > maxImages) maxImages = galleryUrls.length;
      totalImagesEmitted += galleryUrls.length;
    }
  }

  // Build header with image_1_url ... image_N_url.
  const header: string[] = [
    "sku",
    "product_handle",
    "product_title",
    "status",
    "image_count",
  ];
  for (let i = 1; i <= maxImages; i += 1) header.push(`image_${i}_url`);

  const lines: string[] = [header.join(",")];
  for (const r of rows) {
    const fields: string[] = [
      csvEscape(r.sku),
      csvEscape(r.handle),
      csvEscape(r.title),
      csvEscape(r.status),
      String(r.images.length),
    ];
    for (let i = 0; i < maxImages; i += 1) {
      fields.push(csvEscape(r.images[i] ?? ""));
    }
    lines.push(fields.join(","));
  }

  const today = new Date().toISOString().slice(0, 10);
  const outPath = path.resolve(
    process.cwd(),
    "data",
    `sku-images-wide-${today}.csv`,
  );
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, lines.join("\n") + "\n", "utf8");

  console.log(`[export] wrote ${rows.length} SKU rows → ${outPath}`);
  console.log(`[export] widest gallery: ${maxImages} images`);
  console.log(`[export] total image URLs emitted: ${totalImagesEmitted}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
