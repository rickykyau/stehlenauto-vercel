/**
 * Pass 7: build a jl_sku -> product_handle map from LIVE Shopify.
 * jl_sku (JL Concepts internal SKU, e.g. "fg-ram06-me-mb") does NOT match the
 * Shopify variant SKU (which is "item-XXXXXX" / CB Item Name). The JL SKU DOES
 * appear in product image filenames (e.g. "fg-ram06-me-mb-1.jpg"), so we crawl
 * every product's media filenames + variant SKUs and index by JL-SKU stem.
 *
 * Output: data/jlsku-handle-map-YYYY-MM-DD.json { by_stem, by_sku }
 */
import { config as loadEnv } from "dotenv";
import { createAdminApiClient } from "@shopify/admin-api-client";
import { promises as fs } from "node:fs";

loadEnv({ path: ".env.local" });
const apiVersion = process.env.NEXT_PUBLIC_SHOPIFY_API_VERSION || "2026-04";
const domain = (process.env.SHOPIFY_STORE_DOMAIN || process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || "")
  .replace(/^https?:\/\//, "").replace(/\/+$/, "").trim();
const token = process.env.SHOPIFY_ADMIN_TOKEN ?? "";
if (!domain || !token) { console.error("missing SHOPIFY_STORE_DOMAIN / SHOPIFY_ADMIN_TOKEN"); process.exit(1); }
const client = createAdminApiClient({ storeDomain: domain, apiVersion, accessToken: token });

const Q = /* GraphQL */ `
  query P($cursor: String) {
    products(first: 100, after: $cursor) {
      pageInfo { hasNextPage endCursor }
      nodes {
        handle
        variants(first: 25) { nodes { sku } }
        media(first: 30) { nodes { ... on MediaImage { image { url } } } }
      }
    }
  }`;

function stem(fn: string): string {
  let s = fn.trim().toLowerCase();
  s = s.replace(/\.(jpg|jpeg|png|webp|gif)$/i, "");
  s = s.replace(/^listing[_-]/, "");
  s = s.replace(/_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, ""); // shopify uuid suffix
  s = s.replace(/-ws-?\d+$/i, "");
  s = s.replace(/-\d+$/i, "");
  return s;
}
function fnameFromUrl(u: string): string {
  try { return decodeURIComponent(new URL(u).pathname.split("/").pop() || ""); } catch { return ""; }
}

async function main() {
  const byStem: Record<string, string> = {};
  const bySku: Record<string, string> = {};
  let cursor: string | null = null, pages = 0, prods = 0;
  do {
    const res: any = await client.request(Q, { variables: { cursor } });
    const c = res.data.products;
    for (const p of c.nodes) {
      prods++;
      for (const v of p.variants.nodes) if (v.sku) bySku[v.sku.toLowerCase()] ??= p.handle;
      for (const m of p.media.nodes) {
        const url = m?.image?.url; if (!url) continue;
        const st = stem(fnameFromUrl(url));
        if (st && st.length > 2) byStem[st] ??= p.handle;
      }
    }
    cursor = c.pageInfo.hasNextPage ? c.pageInfo.endCursor : null;
    pages++;
  } while (cursor);
  const date = new Date().toISOString().slice(0, 10);
  const out = `data/jlsku-handle-map-${date}.json`;
  await fs.writeFile(out, JSON.stringify({ generated_at: date, product_count: prods, by_stem: byStem, by_sku: bySku }, null, 2));
  console.log(`crawled ${prods} products across ${pages} pages -> ${Object.keys(byStem).length} image stems, ${Object.keys(bySku).length} variant SKUs`);
  console.log(`wrote ${out}`);
}
main().catch((e) => { console.error("FATAL:", e?.message || e); process.exit(1); });
