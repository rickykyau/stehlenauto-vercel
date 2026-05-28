/**
 * Export ALL product image URLs in order, per product (keyed by CB Item Name).
 *
 * Long-format CSV: one row per image, keyed by the CB Item Name (the
 * `cb_integration.item_name` metafield, e.g. `HLNB-CIV01LSQ-JDMA`) rather
 * than the Shopify variant SKU (`ITEM-030272`). CB Item Name is the
 * channel-side identifier the owner works with, and it's product-level
 * (all variants share it) so the output collapses cleanly to one set of
 * gallery rows per product instead of duplicating per variant.
 *
 * Variant-specific image overrides (when a variant has its own dedicated
 * PDP image) are emitted at position 0 — preserved so the override info
 * isn't lost, but still keyed by the product's CB Item Name.
 *
 * Falls back to variant SKU when a product has no CB Item Name metafield.
 *
 * Run with:  pnpm tsx scripts/export-sku-all-images.ts
 *   (or)    pnpm dotenv -e .env.local -- pnpm tsx scripts/export-sku-all-images.ts
 *
 * Writes:
 *   data/sku-all-images-YYYY-MM-DD.csv
 *
 * CSV columns: sku, position, image_filename, image_url, alt_text,
 *              product_handle, product_title, category, status
 *   - sku       = CB Item Name (cb_integration.item_name), fallback variant SKU
 *   - category  = custom.category metafield, fallback Shopify native taxonomy
 *                 (category.name), fallback productType
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

type Image = { url: string; altText: string | null };
type Variant = {
  sku: string | null;
  image: Image | null;
};

type ProductNode = {
  id: string;
  handle: string;
  title: string;
  status: "ACTIVE" | "ARCHIVED" | "DRAFT";
  productType: string | null;
  /** Shopify native taxonomy (the standard Google product category). */
  category: { name: string } | null;
  /** custom.category metafield — internal curated taxonomy. */
  categoryMf: { value: string | null } | null;
  /** cb_integration.item_name metafield — CB / channel-side identifier. */
  cbItemName: { value: string | null } | null;
  /**
   * `images.nodes` is in product gallery order — the same order shown
   * on the PDP gallery + the order Shopify hands out via Storefront API.
   */
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
        productType
        category { name }
        categoryMf: metafield(namespace: "custom", key: "category") { value }
        cbItemName: metafield(namespace: "cb_integration", key: "item_name") { value }
        images(first: 50) {
          nodes { url altText }
        }
        variants(first: 100) {
          nodes {
            sku
            image { url altText }
          }
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

function extractFilename(url: string): string {
  try {
    const u = new URL(url);
    const last = u.pathname.split("/").filter(Boolean).pop() ?? "";
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

function pickCategory(p: ProductNode): string {
  const mf = (p.categoryMf?.value ?? "").trim();
  if (mf) return mf;
  const std = (p.category?.name ?? "").trim();
  if (std) return std;
  return (p.productType ?? "").trim();
}

function pickSku(p: ProductNode): string {
  const cb = (p.cbItemName?.value ?? "").trim();
  if (cb) return cb;
  // Fallback to first non-blank variant SKU
  for (const v of p.variants.nodes ?? []) {
    const s = (v.sku ?? "").trim();
    if (s) return s;
  }
  return "";
}

async function main() {
  console.log(`[export] store: ${domain}, API ${apiVersion}`);
  const products = await fetchAllProducts();
  console.log(`[export] fetched ${products.length} products total`);

  const rows: string[] = [
    [
      "sku",
      "position",
      "image_filename",
      "image_url",
      "alt_text",
      "product_handle",
      "product_title",
      "category",
      "status",
    ].join(","),
  ];

  let totalRows = 0;
  let productsWithoutImages = 0;
  let productsWithoutCbName = 0;
  let productsWithoutCategory = 0;
  let variantsWithOverride = 0;
  const skusSeen = new Set<string>();

  for (const p of products) {
    const galleryImages = p.images.nodes ?? [];
    const variants = p.variants.nodes ?? [];

    if (galleryImages.length === 0) productsWithoutImages += 1;

    const sku = pickSku(p);
    const category = pickCategory(p);
    if (!(p.cbItemName?.value ?? "").trim()) productsWithoutCbName += 1;
    if (!category) productsWithoutCategory += 1;
    if (sku) skusSeen.add(sku);

    // Variant-specific image overrides go at position 0 (PDP shows them
    // first when that variant is selected). All keyed by the product's
    // CB Item Name — overrides preserved without duplicating the gallery.
    for (const variant of variants) {
      if (variant?.image?.url) {
        variantsWithOverride += 1;
        rows.push(
          [
            csvEscape(sku),
            "0",
            csvEscape(extractFilename(variant.image.url)),
            csvEscape(variant.image.url),
            csvEscape(variant.image.altText),
            csvEscape(p.handle),
            csvEscape(p.title),
            csvEscape(category),
            csvEscape(p.status),
          ].join(","),
        );
        totalRows += 1;
      }
    }

    galleryImages.forEach((img, idx) => {
      rows.push(
        [
          csvEscape(sku),
          String(idx + 1),
          csvEscape(extractFilename(img.url)),
          csvEscape(img.url),
          csvEscape(img.altText),
          csvEscape(p.handle),
          csvEscape(p.title),
          csvEscape(category),
          csvEscape(p.status),
        ].join(","),
      );
      totalRows += 1;
    });
  }

  const today = new Date().toISOString().slice(0, 10);
  const outPath = path.resolve(
    process.cwd(),
    "data",
    `sku-all-images-${today}.csv`,
  );
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, rows.join("\n") + "\n", "utf8");

  console.log(`[export] wrote ${totalRows} image rows → ${outPath}`);
  console.log(`[export] unique CB Item Names seen:           ${skusSeen.size}`);
  console.log(`[export] products with zero gallery images:   ${productsWithoutImages}`);
  console.log(`[export] products missing CB Item Name:       ${productsWithoutCbName}`);
  console.log(`[export] products missing category:           ${productsWithoutCategory}`);
  console.log(`[export] variants with own image override:    ${variantsWithOverride}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
