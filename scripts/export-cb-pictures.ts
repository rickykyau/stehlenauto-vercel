/**
 * Export per-CB-Item-Name picture roster in long format.
 *
 * Owner-requested schema:
 *   CB Item Name   — Shopify variant SKU (= ChannelAdvisor Item Name)
 *   Picture Name   — uploaded filename (basename of CDN URL, resize
 *                    suffix stripped)
 *   Picture URL    — full Shopify CDN URL with cache-buster
 *   Is Profile     — TRUE on the product's featured image (exactly one
 *                    row per CB Item Name has TRUE), FALSE on others
 *
 * Long format: one row per (SKU × image). A product with 9 gallery
 * images and 1 variant SKU produces 9 rows; with 3 variant SKUs it
 * produces 27 rows. Image order matches Shopify's gallery order (the
 * same sequence shown on the PDP and surfaced via Storefront API).
 *
 * Run with:  pnpm tsx scripts/export-cb-pictures.ts
 *
 * Writes:
 *   data/cb-pictures-YYYY-MM-DD.csv
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
  featuredImage: Image | null;
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
        featuredImage { url }
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

/**
 * Strip Shopify's resize transforms + query string so the filename
 * matches what merch uploaded.
 */
function extractFilename(url: string): string {
  try {
    const u = new URL(url);
    const last = u.pathname.split("/").filter(Boolean).pop() ?? "";
    return last.replace(/_(\d+x\d*|x\d+)(?=\.[a-z]+$)/i, "");
  } catch {
    return "";
  }
}

/**
 * Canonicalize a Shopify CDN URL for equality comparison: drop the
 * query string (the `?v=` cache-buster differs between featuredImage
 * and images.nodes refs to the same asset).
 */
function canonicalUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.origin}${u.pathname}`;
  } catch {
    return url;
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

  const lines: string[] = [
    ["CB Item Name", "Picture Name", "Picture URL", "Is Profile"].join(","),
  ];

  let totalRows = 0;
  const skusSeen = new Set<string>();
  let profilePerSkuOk = 0;
  let profilePerSkuFallback = 0;
  let profilePerSkuMissing = 0;

  for (const p of products) {
    const gallery = p.images.nodes ?? [];
    const featuredCanonical = p.featuredImage
      ? canonicalUrl(p.featuredImage.url)
      : null;

    // Resolve which gallery index is the profile image. Prefer URL match
    // against featuredImage; fall back to index 0 if featuredImage isn't
    // in the gallery (rare data inconsistency).
    let profileIdx = -1;
    if (featuredCanonical) {
      profileIdx = gallery.findIndex(
        (img) => canonicalUrl(img.url) === featuredCanonical,
      );
    }
    if (profileIdx === -1 && gallery.length > 0) {
      profileIdx = 0;
    }

    const skus = (p.variants.nodes ?? [])
      .map((v) => (v.sku ?? "").trim())
      .filter((s) => s.length > 0);
    if (skus.length === 0) continue;

    for (const sku of skus) {
      skusSeen.add(sku);
      if (profileIdx === -1) {
        profilePerSkuMissing += 1;
      } else if (
        featuredCanonical &&
        canonicalUrl(gallery[profileIdx]!.url) === featuredCanonical
      ) {
        profilePerSkuOk += 1;
      } else {
        profilePerSkuFallback += 1;
      }

      gallery.forEach((img, idx) => {
        const isProfile = idx === profileIdx ? "TRUE" : "FALSE";
        lines.push(
          [
            csvEscape(sku),
            csvEscape(extractFilename(img.url)),
            csvEscape(img.url),
            isProfile,
          ].join(","),
        );
        totalRows += 1;
      });
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const outPath = path.resolve(
    process.cwd(),
    "data",
    `cb-pictures-${today}.csv`,
  );
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, lines.join("\n") + "\n", "utf8");

  console.log(`[export] wrote ${totalRows} picture rows → ${outPath}`);
  console.log(`[export] unique CB Item Names: ${skusSeen.size}`);
  console.log(
    `[export] Is Profile resolution: ${profilePerSkuOk} matched featuredImage / ${profilePerSkuFallback} fell back to gallery index 0 / ${profilePerSkuMissing} no gallery`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
