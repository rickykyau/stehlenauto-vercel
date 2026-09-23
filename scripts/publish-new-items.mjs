#!/usr/bin/env node
/**
 * Publish the new-item DRAFT products: status ACTIVE + publish to the same
 * sales channels every live product is on (Online Store, Point of Sale,
 * Lovable, Google & YouTube, Stehlen Next.js Storefront).
 *
 * Guard: a draft is only published if its media count equals its approved
 * slot count in SLOT_ASSIGNMENT.csv (i.e. apply-new-item-photos.mjs finished
 * for it). Anything else is reported and left as a draft.
 *
 * Usage:
 *   node --env-file=.env.local scripts/publish-new-items.mjs --slots <SLOT_ASSIGNMENT.csv> [--apply]
 */
import { createAdminApiClient } from "@shopify/admin-api-client";
import { readFileSync, appendFileSync } from "node:fs";

const argv = process.argv.slice(2);
const APPLY = argv.includes("--apply");
const slotsPath = argv[argv.indexOf("--slots") + 1];
const CHANNELS = ["Online Store", "Point of Sale", "Lovable", "Google & YouTube", "Stehlen Next.js Storefront"];
const LOG = "data/new-items-publish-log.jsonl";

const domain = (process.env.SHOPIFY_STORE_DOMAIN || process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || "")
  .replace(/^https?:\/\//, "").replace(/\/+$/, "");
const client = createAdminApiClient({ storeDomain: domain, apiVersion: "2026-01", accessToken: process.env.SHOPIFY_ADMIN_TOKEN });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function gql(query, variables) {
  for (let attempt = 0; ; attempt++) {
    const { data, errors } = await client.request(query, { variables });
    if (!errors) return data;
    if (attempt < 5 && /THROTTLED|Throttled|timeout|502|503/.test(JSON.stringify(errors))) { await sleep(2000 * (attempt + 1)); continue; }
    throw new Error(JSON.stringify(errors));
  }
}

// expected slot count per SKU (simple CSV: no quoted commas in sku/position columns)
const expected = new Map();
for (const line of readFileSync(slotsPath, "utf8").split(/\r?\n/).slice(1).filter(Boolean)) {
  const sku = line.split(",")[0].toUpperCase();
  expected.set(sku, (expected.get(sku) ?? 0) + 1);
}

const pubs = (await gql(`{publications(first:50){nodes{id name}}}`)).publications.nodes;
const pubIds = CHANNELS.map((n) => {
  const p = pubs.find((x) => x.name === n);
  if (!p) throw new Error(`publication not found: ${n}`);
  return p.id;
});

const drafts = [];
for (let after = null; ;) {
  const d = await gql(
    `query($a:String){products(first:250,after:$a,query:"status:draft"){pageInfo{hasNextPage endCursor}
      nodes{id handle mediaCount{count} mf:metafield(namespace:"cb_integration",key:"item_name"){value}}}}`,
    { a: after },
  );
  drafts.push(...d.products.nodes);
  if (!d.products.pageInfo.hasNextPage) break;
  after = d.products.pageInfo.endCursor;
}

const ready = [], held = [];
for (const p of drafts) {
  const sku = p.mf?.value?.toUpperCase();
  if (!sku || !expected.has(sku)) continue; // not part of this batch
  (p.mediaCount.count === expected.get(sku) ? ready : held).push({ ...p, sku });
}
console.log(`batch drafts: ${ready.length + held.length} | ready: ${ready.length} | held (media count off): ${held.length}`);
for (const h of held) console.log(`  HELD ${h.sku} media ${h.mediaCount.count}/${expected.get(h.sku)}`);
if (!APPLY) { console.log("dry run — pass --apply to publish"); process.exit(0); }

let n = 0;
for (const p of ready) {
  const u = await gql(
    `mutation($p:ProductUpdateInput!){productUpdate(product:$p){product{status} userErrors{message}}}`,
    { p: { id: p.id, status: "ACTIVE" } },
  );
  if (u.productUpdate.userErrors.length) throw new Error(`${p.sku}: ${JSON.stringify(u.productUpdate.userErrors)}`);
  const pb = await gql(
    `mutation($id:ID!,$i:[PublicationInput!]!){publishablePublish(id:$id,input:$i){userErrors{message}}}`,
    { id: p.id, i: pubIds.map((publicationId) => ({ publicationId })) },
  );
  if (pb.publishablePublish.userErrors.length) throw new Error(`${p.sku}: ${JSON.stringify(pb.publishablePublish.userErrors)}`);
  appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), sku: p.sku, id: p.id, handle: p.handle }) + "\n");
  if (++n % 50 === 0) console.log(`published ${n}/${ready.length}`);
}
console.log(`DONE: published ${n}`);
