/**
 * Probe Shopify product/variant metafield definitions to find where
 * MPN (manufacturer part number) is stored. Needed to map Amazon
 * review records (keyed by MPN) to Shopify products.
 *
 * Run with: pnpm tsx scripts/probe-mpn-metafield.ts
 */
import "dotenv/config";
import { config as loadEnv } from "dotenv";
import { createAdminApiClient } from "@shopify/admin-api-client";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env.local", override: true });

const Q = /* GraphQL */ `
  query Probe {
    productDefs: metafieldDefinitions(first: 100, ownerType: PRODUCT) {
      nodes { namespace key name type { name } }
    }
    variantDefs: metafieldDefinitions(first: 100, ownerType: PRODUCTVARIANT) {
      nodes { namespace key name type { name } }
    }
    sample: products(first: 3, query: "tag:trailer-hitch") {
      nodes {
        handle
        title
        productType
        vendor
        tags
        variants(first: 5) {
          nodes { sku barcode title }
        }
      }
    }
  }
`;

(async () => {
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
  const r = await client.request(Q);
  if (r.errors) {
    console.error(JSON.stringify(r.errors, null, 2));
    process.exit(1);
  }
  const d = r.data as {
    productDefs: { nodes: { namespace: string; key: string; name: string; type: { name: string } }[] };
    variantDefs: { nodes: { namespace: string; key: string; name: string; type: { name: string } }[] };
    sample: { nodes: { handle: string; title: string; productType: string; vendor: string; tags: string[]; variants: { nodes: { sku: string; barcode: string | null; title: string }[] } }[] };
  };

  console.log("=== PRODUCT METAFIELD DEFS ===");
  for (const n of d.productDefs.nodes) {
    console.log(`  ${n.namespace}.${n.key.padEnd(30)} ${n.name} (${n.type.name})`);
  }

  console.log("\n=== VARIANT METAFIELD DEFS ===");
  for (const n of d.variantDefs.nodes) {
    console.log(`  ${n.namespace}.${n.key.padEnd(30)} ${n.name} (${n.type.name})`);
  }

  console.log("\n=== SAMPLE PRODUCTS (3 trailer hitches — variant.barcode is the standard MPN home) ===");
  for (const p of d.sample.nodes) {
    console.log(`\n  ${p.handle}`);
    console.log(`    title: ${p.title}`);
    console.log(`    productType: ${p.productType}  vendor: ${p.vendor}`);
    console.log(`    tags: [${p.tags.slice(0, 8).join(", ")}${p.tags.length > 8 ? ", ..." : ""}]`);
    for (const v of p.variants.nodes) {
      console.log(`    sku=${v.sku ?? "—"}  barcode=${v.barcode ?? "—"}  variant=${v.title}`);
    }
  }
})();
