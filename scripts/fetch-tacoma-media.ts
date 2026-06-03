/**
 * One-off: pull the full Shopify media set for the Tacoma tonneau+LED product
 * so we can use REAL product photography as Kling image-to-video seeds.
 * Read-only. Downloads to /tmp/tacoma-shopify-full/. Prints a manifest.
 */
import { config as loadEnv } from "dotenv";
import { createAdminApiClient } from "@shopify/admin-api-client";
import { promises as fs } from "node:fs";

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
  console.error("missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_TOKEN");
  process.exit(1);
}

const HANDLE = "2016-2023-toyota-tacoma-5ft-bed-hard-tri-fold-tonneau-cover-led";
const OUT = "/tmp/tacoma-shopify-full";

const client = createAdminApiClient({ storeDomain: domain, apiVersion, accessToken: token });

const QUERY = /* GraphQL */ `
  query ProductMedia($q: String!) {
    products(first: 1, query: $q) {
      nodes {
        title
        handle
        media(first: 50) {
          nodes {
            mediaContentType
            ... on MediaImage { alt image { url width height } }
          }
        }
      }
    }
  }
`;

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  const res = await client.request(QUERY, { variables: { q: `handle:${HANDLE}` } });
  const product = res.data?.products?.nodes?.[0];
  if (!product) {
    console.error("product not found for handle:", HANDLE);
    process.exit(1);
  }
  const images = (product.media?.nodes ?? [])
    .filter((m: any) => m.mediaContentType === "IMAGE" && m.image?.url)
    .map((m: any) => ({ url: m.image.url, w: m.image.width, h: m.image.height, alt: m.alt || "" }));

  console.log(`PRODUCT: ${product.title}`);
  console.log(`IMAGE COUNT: ${images.length}\n`);

  let i = 0;
  for (const img of images) {
    i++;
    const ext = (img.url.split("?")[0].split(".").pop() || "jpg").toLowerCase();
    const fname = `${OUT}/img-${String(i).padStart(2, "0")}.${ext}`;
    const r = await fetch(img.url);
    const buf = Buffer.from(await r.arrayBuffer());
    await fs.writeFile(fname, buf);
    console.log(`${String(i).padStart(2, "0")}  ${img.w}x${img.h}  ${img.alt ? `[${img.alt}] ` : ""}-> ${fname}`);
  }
  console.log(`\nDownloaded ${i} images to ${OUT}`);
}

main().catch((e) => {
  console.error("FATAL:", e?.message || e);
  process.exit(1);
});
