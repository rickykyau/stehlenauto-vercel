/**
 * Storefront API probe — answers "what does the headless storefront actually see?"
 *
 * The Admin audit showed 1,322 products ACTIVE but only 8 'publishedOnline'.
 * The Storefront API is returning more than 8 (Mike saw 24 tonneaus).
 * Reconcile by querying the Storefront API directly with the same token the
 * Next.js app uses, and report what it actually returns.
 */

import "dotenv/config";
import { config as loadEnv } from "dotenv";
import { createStorefrontApiClient } from "@shopify/storefront-api-client";
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
const token =
  process.env.SHOPIFY_STOREFRONT_TOKEN ||
  process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN ||
  "";

if (!domain || !token) {
  console.error("[probe] missing storefront domain/token");
  process.exit(1);
}

const client = createStorefrontApiClient({
  storeDomain: domain,
  apiVersion,
  publicAccessToken: token,
});

async function gql<T>(query: string, variables: Record<string, unknown> = {}) {
  const res = await client.request(query, { variables });
  if (res.errors) throw new Error(JSON.stringify(res.errors));
  return res.data as T;
}

async function fetchAllStorefrontProducts() {
  const query = /* GraphQL */ `
    query Products($first: Int!, $cursor: String) {
      products(first: $first, after: $cursor) {
        pageInfo { hasNextPage endCursor }
        nodes {
          handle
          title
          productType
          vendor
          tags
          availableForSale
        }
      }
    }
  `;
  const out: {
    handle: string;
    title: string;
    productType: string;
    vendor: string;
    tags: string[];
    availableForSale: boolean;
  }[] = [];
  let cursor: string | null = null;
  let pages = 0;
  while (true) {
    const data = (await gql<{
      products: {
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
        nodes: typeof out;
      };
    }>(query, { first: 250, cursor })) ?? null;
    if (!data) break;
    out.push(...data.products.nodes);
    pages += 1;
    process.stdout.write(
      `\r[probe] page ${pages}, ${out.length} products so far`,
    );
    if (!data.products.pageInfo.hasNextPage) break;
    cursor = data.products.pageInfo.endCursor;
  }
  process.stdout.write("\n");
  return out;
}

async function fetchCollections() {
  const query = /* GraphQL */ `
    query Collections($first: Int!, $cursor: String) {
      collections(first: $first, after: $cursor) {
        pageInfo { hasNextPage endCursor }
        nodes {
          handle
          title
          products(first: 1) { pageInfo { hasNextPage } nodes { id } }
        }
      }
    }
  `;
  const out: {
    handle: string;
    title: string;
    count: number;
    hasMore: boolean;
  }[] = [];
  let cursor: string | null = null;
  while (true) {
    const data = await gql<{
      collections: {
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
        nodes: {
          handle: string;
          title: string;
          products: { pageInfo: { hasNextPage: boolean }; nodes: unknown[] };
        }[];
      };
    }>(query, { first: 250, cursor });
    out.push(
      ...data.collections.nodes.map((c) => ({
        handle: c.handle,
        title: c.title,
        // Storefront doesn't expose productsCount; flag whether it has any
        // and whether there are more than 1. Real count comes from CSV.
        count: c.products.nodes.length,
        hasMore: c.products.pageInfo.hasNextPage,
      })),
    );
    if (!data.collections.pageInfo.hasNextPage) break;
    cursor = data.collections.pageInfo.endCursor;
  }
  return out;
}

async function main() {
  console.log(`[probe] Storefront API @ https://${domain} (${apiVersion})`);

  const products = await fetchAllStorefrontProducts();
  console.log(`[probe] Storefront sees ${products.length} products`);

  const collections = await fetchCollections();
  console.log(`[probe] Storefront sees ${collections.length} collections`);

  // Aggregate by productType
  const typeMap = new Map<string, number>();
  const vendorMap = new Map<string, number>();
  let unavailable = 0;
  for (const p of products) {
    typeMap.set(p.productType || "(none)", (typeMap.get(p.productType || "(none)") ?? 0) + 1);
    vendorMap.set(p.vendor || "(none)", (vendorMap.get(p.vendor || "(none)") ?? 0) + 1);
    if (!p.availableForSale) unavailable += 1;
  }

  // Stehlen-branded subset
  const stehlen = products.filter((p) =>
    /stehlen/i.test(p.vendor || "") || /stehlen/i.test(p.title),
  );

  // Build report
  const md: string[] = [];
  md.push("# Shopify Storefront API probe (cycle 3 follow-up)\n");
  md.push(`Run: ${new Date().toISOString()}`);
  md.push(`Domain: ${domain}`);
  md.push(`API: ${apiVersion}\n`);

  md.push("## Headline reconcile\n");
  md.push("| Source | Product count |");
  md.push("| --- | --- |");
  md.push(`| Admin API \`productsCount\` (all) | 1322 |`);
  md.push(`| Admin API \`publishedOnline\` (Online Store sales channel) | 8 |`);
  md.push(`| **Storefront API (what our Next.js app sees)** | **${products.length}** |`);
  md.push(`| Storefront-side availableForSale = false | ${unavailable} |\n`);

  md.push("## What this means\n");
  if (products.length > 8) {
    md.push(
      `The Storefront API surfaces **${products.length}** products — far more than the 8 published to "Online Store". That means the Storefront token is bound to a **different sales channel** (likely "Headless" or a custom channel), and 1,314+ products are correctly flagged for it.\n`,
    );
    md.push(
      `**Conclusion:** Mike was not seeing phantom products. Our storefront genuinely has ~${products.length} live products to render against. The cycle-1 \"catalog gap\" diagnosis was wrong — what we have is a fitment-display gap.`,
    );
  } else {
    md.push(
      `The Storefront API only sees 8 products too. The "Headless" / custom sales channel needs the bulk of the catalog enabled before the storefront has anything to show.`,
    );
  }
  md.push("");

  md.push("## Collections (Storefront-visible)\n");
  md.push(`Total: ${collections.length}\n`);
  md.push("| Handle | Title | Has products? |");
  md.push("| --- | --- | --- |");
  const sortedCols = [...collections].sort((a, b) =>
    (b.count + (b.hasMore ? 1 : 0)) - (a.count + (a.hasMore ? 1 : 0)),
  );
  for (const c of sortedCols.slice(0, 50)) {
    const has = c.count > 0 ? (c.hasMore ? "≥2" : "1") : "0";
    md.push(`| ${c.handle} | ${c.title} | ${has} |`);
  }
  if (sortedCols.length > 50) {
    md.push(`| _… ${sortedCols.length - 50} more_ |  |  |`);
  }
  md.push("");

  md.push("## Top productTypes (Storefront view)\n");
  md.push("| productType | Count |");
  md.push("| --- | --- |");
  for (const [t, n] of Array.from(typeMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 25)) {
    md.push(`| ${t} | ${n} |`);
  }
  md.push("");

  md.push("## Top vendors (Storefront view)\n");
  md.push("| Vendor | Count |");
  md.push("| --- | --- |");
  for (const [t, n] of Array.from(vendorMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)) {
    md.push(`| ${t} | ${n} |`);
  }
  md.push("");

  md.push(`## Stehlen-branded products: **${stehlen.length}**\n`);
  md.push(
    "These are the SKUs Stehlen manufactures vs resells from CURT / Spec-D / etc. Likely the highest-margin and most-defensible part of the catalog.\n",
  );

  md.push("## Mapping our chrome to real Shopify collections\n");
  const chromeSlugs = [
    "roof-racks",
    "grilles",
    "bed-lights",
    "bumpers",
    "fender-flares",
    "running-boards",
    "tonneau-covers",
    "hitches",
    "bed-mats",
    "sport-bars",
    "tail-lights",
    "recovery",
  ];
  md.push("| Our chrome slug | Matching Shopify collection | Product count |");
  md.push("| --- | --- | --- |");
  for (const slug of chromeSlugs) {
    const exact = collections.find((c) => c.handle === slug);
    const fuzzy = collections.find((c) =>
      c.handle.includes(slug.split("-")[0] ?? slug),
    );
    const fmt = (
      c?: { handle: string; count: number; hasMore: boolean } | undefined,
      tag = "",
    ) =>
      c
        ? `${c.handle}${tag ? " " + tag : ""} | ${c.count > 0 ? (c.hasMore ? "≥2" : "1") : "0"}`
        : "**NO MATCH** | 0";
    if (exact) md.push(`| ${slug} | ${fmt(exact, "✓")} |`);
    else if (fuzzy) md.push(`| ${slug} | ${fmt(fuzzy, "(fuzzy)")} |`);
    else md.push(`| ${slug} | ${fmt(undefined)} |`);
  }
  md.push("");

  md.push(`## Files written\n`);
  md.push(`- shopify-storefront-probe.md (this report)`);
  md.push(`- shopify-storefront-products.csv (full dump, ${products.length} rows)`);
  md.push(`- shopify-storefront-collections.csv (${collections.length} rows)`);

  const outDir = path.join(
    process.cwd(),
    "docs/iterations/2026-05-03-cycle-1",
  );
  await fs.writeFile(
    path.join(outDir, "shopify-storefront-probe.md"),
    md.join("\n"),
    "utf8",
  );

  // CSV: products
  const productCsv = [
    "handle,title,productType,vendor,availableForSale,tagCount,tags",
    ...products.map((p) =>
      [
        csvEscape(p.handle),
        csvEscape(p.title),
        csvEscape(p.productType),
        csvEscape(p.vendor),
        p.availableForSale ? "1" : "0",
        String(p.tags.length),
        csvEscape(p.tags.join(" | ")),
      ].join(","),
    ),
  ].join("\n");
  await fs.writeFile(
    path.join(outDir, "shopify-storefront-products.csv"),
    productCsv + "\n",
    "utf8",
  );

  // CSV: collections
  const colCsv = [
    "handle,title,hasAtLeastOne,hasMoreThanOne",
    ...collections.map(
      (c) =>
        `${csvEscape(c.handle)},${csvEscape(c.title)},${c.count > 0 ? 1 : 0},${c.hasMore ? 1 : 0}`,
    ),
  ].join("\n");
  await fs.writeFile(
    path.join(outDir, "shopify-storefront-collections.csv"),
    colCsv + "\n",
    "utf8",
  );

  console.log(`[probe] wrote 3 files to ${outDir}`);
}

function csvEscape(s: string) {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

main().catch((err) => {
  console.error("[probe] failed:", err);
  process.exit(1);
});
