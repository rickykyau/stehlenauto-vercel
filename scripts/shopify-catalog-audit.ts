/**
 * Shopify catalog audit — answers Sam's cycle-3 question #1:
 * how many products are actually in the live store, what status are they in,
 * how are they categorized, and how are tags distributed.
 *
 * Run with:  pnpm tsx scripts/shopify-catalog-audit.ts
 *   (or)    pnpm dotenv -e .env.local -- pnpm tsx scripts/shopify-catalog-audit.ts
 *
 * Writes:
 *   - docs/iterations/2026-05-03-cycle-1/shopify-catalog-audit.md  (human report)
 *   - docs/iterations/2026-05-03-cycle-1/shopify-catalog-products.csv  (full dump)
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
    "[audit] missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_TOKEN — abort.",
  );
  process.exit(1);
}

const client = createAdminApiClient({
  storeDomain: domain,
  apiVersion,
  accessToken: token,
});

type ProductNode = {
  id: string;
  handle: string;
  title: string;
  status: "ACTIVE" | "ARCHIVED" | "DRAFT";
  productType: string;
  vendor: string;
  tags: string[];
  totalInventory: number | null;
  hasOnlyDefaultVariant: boolean;
  variantsCount?: { count: number };
  featuredImage: { url: string } | null;
  publishedAt: string | null;
  updatedAt: string;
};

type CountQuery = {
  productsCount: { count: number };
};

type ListQuery = {
  products: {
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
    nodes: ProductNode[];
  };
};

const COUNT_QUERY = /* GraphQL */ `
  query CountAll {
    all: productsCount { count }
    active: productsCount(query: "status:ACTIVE") { count }
    draft: productsCount(query: "status:DRAFT") { count }
    archived: productsCount(query: "status:ARCHIVED") { count }
    publishedOnline: productsCount(query: "status:ACTIVE published_status:online_store:visible") { count }
  }
`;

const LIST_QUERY = /* GraphQL */ `
  query ListProducts($first: Int!, $cursor: String) {
    products(first: $first, after: $cursor, sortKey: UPDATED_AT, reverse: true) {
      pageInfo { hasNextPage endCursor }
      nodes {
        id
        handle
        title
        status
        productType
        vendor
        tags
        totalInventory
        hasOnlyDefaultVariant
        variantsCount { count }
        featuredImage { url }
        publishedAt
        updatedAt
      }
    }
  }
`;

async function fetchCounts() {
  const res = await client.request(COUNT_QUERY);
  if (res.errors) throw new Error(JSON.stringify(res.errors));
  const counts = res.data as unknown as Record<string, { count: number }>;
  return {
    all: counts.all.count,
    active: counts.active.count,
    draft: counts.draft.count,
    archived: counts.archived.count,
    publishedOnline: counts.publishedOnline.count,
  };
}

async function fetchAllProducts(): Promise<ProductNode[]> {
  const out: ProductNode[] = [];
  let cursor: string | null = null;
  let pages = 0;
  while (true) {
    const res = await client.request(LIST_QUERY, {
      variables: { first: 250, cursor },
    });
    if (res.errors) throw new Error(JSON.stringify(res.errors));
    const data = res.data as unknown as ListQuery;
    out.push(...data.products.nodes);
    pages += 1;
    process.stdout.write(
      `\r[audit] paged through ${pages} pages, ${out.length} products so far`,
    );
    if (!data.products.pageInfo.hasNextPage) break;
    cursor = data.products.pageInfo.endCursor;
  }
  process.stdout.write("\n");
  return out;
}

const KNOWN_MAKES = [
  "Ford",
  "Chevrolet",
  "GMC",
  "Ram",
  "Dodge",
  "Toyota",
  "Jeep",
  "Nissan",
  "Honda",
  "Hyundai",
  "Mazda",
  "Subaru",
  "Mitsubishi",
  "Volkswagen",
  "Audi",
  "BMW",
  "Mercedes",
  "Mercedes-Benz",
  "Lexus",
  "Acura",
  "Infiniti",
  "Buick",
  "Cadillac",
  "Lincoln",
  "Volvo",
  "Land Rover",
  "Mini",
  "Suzuki",
  "Tesla",
  "Rivian",
  "Genesis",
  "Geo",
  "Plymouth",
  "Saturn",
  "Mercury",
  "Pontiac",
  "Oldsmobile",
];

function detectMake(tags: string[], title: string): string | null {
  const haystack = [...tags, title].join(" ").toLowerCase();
  for (const make of KNOWN_MAKES) {
    const re = new RegExp(`\\b${make.toLowerCase()}\\b`);
    if (re.test(haystack)) return make;
  }
  return null;
}

function topN<T extends string>(map: Map<T, number>, n: number) {
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);
}

function csvEscape(s: string) {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

async function main() {
  console.log(
    `[audit] connecting to https://${domain} (Admin API ${apiVersion})…`,
  );

  const counts = await fetchCounts();
  console.log("[audit] product counts:");
  console.log(`  all:        ${counts.all}`);
  console.log(`  ACTIVE:     ${counts.active}`);
  console.log(`  DRAFT:      ${counts.draft}`);
  console.log(`  ARCHIVED:   ${counts.archived}`);
  console.log(`  publishedOnline (visible to storefront): ${counts.publishedOnline}`);

  const all = await fetchAllProducts();
  console.log(`[audit] dumped ${all.length} products`);

  // Aggregate stats
  const byProductType = new Map<string, number>();
  const byVendor = new Map<string, number>();
  const byMake = new Map<string, number>();
  const byTagCardinality = new Map<number, number>();
  let untyped = 0;
  let zeroTags = 0;
  let zeroImage = 0;
  let zeroInventory = 0;
  let multivariant = 0;

  for (const p of all) {
    const type = p.productType || "(none)";
    byProductType.set(type, (byProductType.get(type) ?? 0) + 1);
    if (!p.productType) untyped += 1;
    if (p.tags.length === 0) zeroTags += 1;
    byVendor.set(p.vendor || "(none)", (byVendor.get(p.vendor || "(none)") ?? 0) + 1);

    const tagBin = Math.min(p.tags.length, 50);
    byTagCardinality.set(tagBin, (byTagCardinality.get(tagBin) ?? 0) + 1);

    const make = detectMake(p.tags, p.title);
    if (make) byMake.set(make, (byMake.get(make) ?? 0) + 1);

    if (!p.featuredImage) zeroImage += 1;
    if ((p.totalInventory ?? 0) <= 0) zeroInventory += 1;
    if (p.variantsCount && p.variantsCount.count > 1) multivariant += 1;
  }

  // Cross-tag detection: products whose tags mention >1 make
  const crossTagged: { handle: string; title: string; makes: string[] }[] = [];
  for (const p of all) {
    const found = new Set<string>();
    for (const make of KNOWN_MAKES) {
      const re = new RegExp(`\\b${make.toLowerCase()}\\b`);
      const hay = [...p.tags, p.title].join(" ").toLowerCase();
      if (re.test(hay)) found.add(make);
    }
    if (found.size > 1) {
      crossTagged.push({
        handle: p.handle,
        title: p.title,
        makes: [...found].sort(),
      });
    }
  }

  // Likely fitment-mismatch: title mentions make A, tags don't contain make A
  const titleVsTagMismatch: {
    handle: string;
    title: string;
    titleMake: string;
    tags: string[];
  }[] = [];
  for (const p of all) {
    const titleLower = p.title.toLowerCase();
    const tagsLower = p.tags.map((t) => t.toLowerCase());
    for (const make of KNOWN_MAKES) {
      if (
        new RegExp(`\\b${make.toLowerCase()}\\b`).test(titleLower) &&
        !tagsLower.some((t) =>
          new RegExp(`\\b${make.toLowerCase()}\\b`).test(t),
        )
      ) {
        titleVsTagMismatch.push({
          handle: p.handle,
          title: p.title,
          titleMake: make,
          tags: p.tags,
        });
        break;
      }
    }
  }

  // Write CSV dump
  const outDir = path.join(
    process.cwd(),
    "docs/iterations/2026-05-03-cycle-1",
  );
  await fs.mkdir(outDir, { recursive: true });

  const csvHeader =
    "handle,title,status,productType,vendor,tagCount,totalInventory,hasFeaturedImage,publishedAt,updatedAt,tags\n";
  const csvRows = all
    .map((p) =>
      [
        csvEscape(p.handle),
        csvEscape(p.title),
        p.status,
        csvEscape(p.productType ?? ""),
        csvEscape(p.vendor ?? ""),
        String(p.tags.length),
        String(p.totalInventory ?? 0),
        p.featuredImage ? "1" : "0",
        p.publishedAt ?? "",
        p.updatedAt,
        csvEscape(p.tags.join(" | ")),
      ].join(","),
    )
    .join("\n");
  await fs.writeFile(
    path.join(outDir, "shopify-catalog-products.csv"),
    csvHeader + csvRows + "\n",
    "utf8",
  );

  // Write Markdown report
  const md: string[] = [];
  md.push("# Shopify catalog audit (cycle 3, item #1)\n");
  md.push(`Run at: ${new Date().toISOString()}`);
  md.push(`Domain: ${domain}`);
  md.push(`Admin API: ${apiVersion}\n`);

  md.push("## Counts (server-side)\n");
  md.push("| Status | Count |");
  md.push("| --- | --- |");
  md.push(`| All | **${counts.all}** |`);
  md.push(`| ACTIVE | ${counts.active} |`);
  md.push(`| DRAFT | ${counts.draft} |`);
  md.push(`| ARCHIVED | ${counts.archived} |`);
  md.push(
    `| Published & visible on Online Store | **${counts.publishedOnline}** |\n`,
  );

  md.push("## Storefront-facing total\n");
  md.push(
    `**${counts.publishedOnline}** products are currently visible to the storefront. The other ${counts.all - counts.publishedOnline} are hidden (draft, archived, or unpublished from Online Store).\n`,
  );

  md.push("## Coverage stats (over all products)\n");
  md.push(`- Products without productType: **${untyped}** / ${all.length}`);
  md.push(`- Products with zero tags: **${zeroTags}** / ${all.length}`);
  md.push(`- Products without a featured image: **${zeroImage}** / ${all.length}`);
  md.push(`- Products with totalInventory ≤ 0: ${zeroInventory} / ${all.length}`);
  md.push(`- Products with >1 variant: ${multivariant} / ${all.length}\n`);

  md.push("## Top 20 productTypes\n");
  md.push("| productType | Count |");
  md.push("| --- | --- |");
  for (const [t, n] of topN(byProductType, 20)) md.push(`| ${t} | ${n} |`);
  md.push("");

  md.push("## Top 15 vendors\n");
  md.push("| Vendor | Count |");
  md.push("| --- | --- |");
  for (const [t, n] of topN(byVendor, 15)) md.push(`| ${t} | ${n} |`);
  md.push("");

  md.push("## Detected makes (from tags + title)\n");
  md.push("| Make | Products |");
  md.push("| --- | --- |");
  for (const [t, n] of topN(byMake, 30)) md.push(`| ${t} | ${n} |`);
  md.push("");

  md.push("## Tag-cardinality distribution\n");
  md.push("| Tags per product | Products |");
  md.push("| --- | --- |");
  for (const [bin, n] of Array.from(byTagCardinality.entries()).sort(
    (a, b) => a[0] - b[0],
  )) {
    md.push(`| ${bin === 50 ? "50+" : bin} | ${n} |`);
  }
  md.push("");

  md.push(
    `## Cross-make tags (products whose title+tags reference >1 make) — **${crossTagged.length} products**\n`,
  );
  if (crossTagged.length === 0) {
    md.push("None found. ✓\n");
  } else {
    md.push(
      "These need parts-specialist review — a product tagged for Ford+Toyota usually means a tagging mistake or a universal-fit listing miscategorized.\n",
    );
    md.push("| Handle | Title | Makes detected |");
    md.push("| --- | --- | --- |");
    for (const x of crossTagged.slice(0, 50))
      md.push(`| ${x.handle} | ${x.title} | ${x.makes.join(", ")} |`);
    if (crossTagged.length > 50)
      md.push(`| _… ${crossTagged.length - 50} more in CSV_ |  |  |`);
    md.push("");
  }

  md.push(
    `## Title-mentions-make-not-in-tags — **${titleVsTagMismatch.length} products**\n`,
  );
  if (titleVsTagMismatch.length === 0) {
    md.push("None found. ✓\n");
  } else {
    md.push(
      "Higher-confidence mistag candidates: title says one make but tags don't include it. Likely the kind of listing Mike caught (Tundra in Ford F-150 collection).\n",
    );
    md.push("| Handle | Title | Make in title | Tags |");
    md.push("| --- | --- | --- | --- |");
    for (const x of titleVsTagMismatch.slice(0, 50))
      md.push(
        `| ${x.handle} | ${x.title} | ${x.titleMake} | ${x.tags.slice(0, 6).join(", ")}${x.tags.length > 6 ? "…" : ""} |`,
      );
    if (titleVsTagMismatch.length > 50)
      md.push(
        `| _… ${titleVsTagMismatch.length - 50} more in CSV_ |  |  |  |`,
      );
    md.push("");
  }

  md.push("## Files written\n");
  md.push(`- shopify-catalog-products.csv (full dump, ${all.length} rows)`);
  md.push("- shopify-catalog-audit.md (this report)\n");

  await fs.writeFile(
    path.join(outDir, "shopify-catalog-audit.md"),
    md.join("\n"),
    "utf8",
  );

  console.log(`[audit] wrote ${outDir}/shopify-catalog-audit.md`);
  console.log(`[audit] wrote ${outDir}/shopify-catalog-products.csv`);
}

main().catch((err) => {
  console.error("[audit] failed:", err);
  process.exit(1);
});
