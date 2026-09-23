#!/usr/bin/env node
/**
 * Standardize vehicle make/model spellings across the Shopify catalog so the
 * same vehicle is never shown two ways ("TITAN" vs "Titan", "Sierra 2500HD" vs
 * "Sierra 2500 HD").
 *
 * Canonical forms (same rules as scripts/build-ymm-index.py canonicalize_*):
 *   INFINITI        -> Infiniti
 *   TITAN / TITAN XD -> Titan / Titan XD
 *   2500HD / 3500HD -> 2500 HD / 3500 HD
 *   Transit 150     -> Transit-150   (Ford's / ACES spelling; also 250, 350)
 *
 * Fields: title, tags, SEO title/description, descriptionHtml, and every
 * custom.* metafield except custom.brand. Handles are never changed.
 *
 * Usage: node --env-file=.env.local scripts/standardize-vehicle-names.mjs [--apply]
 */
import { createAdminApiClient } from "@shopify/admin-api-client";
import { appendFileSync } from "node:fs";

const APPLY = process.argv.includes("--apply");
const LOG = "data/standardize-vehicle-names-log.jsonl";
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

const RULES = [
  [/\bINFINITI\b/g, "Infiniti"],
  [/\bTITAN XD\b/g, "Titan XD"],
  [/\bTITAN\b/g, "Titan"],
  [/\b(\d{4})HD\b/g, "$1 HD"],
  [/\bTransit (\d{3})\b/g, "Transit-$1"],
];
const fix = (s) => (s == null ? s : RULES.reduce((acc, [re, to]) => acc.replace(re, to), s));

const products = [];
for (let after = null; ;) {
  const d = await gql(
    `query($a:String){products(first:100,after:$a){pageInfo{hasNextPage endCursor}
      nodes{id handle title tags descriptionHtml seo{title description}
        metafields(first:50,namespace:"custom"){nodes{key type value}}}}}`,
    { a: after },
  );
  products.push(...d.products.nodes);
  if (!d.products.pageInfo.hasNextPage) break;
  after = d.products.pageInfo.endCursor;
}

let changedProducts = 0, fieldCount = {};
for (const p of products) {
  const update = { id: p.id };
  const bump = (f) => (fieldCount[f] = (fieldCount[f] ?? 0) + 1);
  if (fix(p.title) !== p.title) { update.title = fix(p.title); bump("title"); }
  const tags = p.tags.map(fix);
  if (tags.some((t, i) => t !== p.tags[i])) { update.tags = [...new Set(tags)]; bump("tags"); }
  if (fix(p.descriptionHtml) !== p.descriptionHtml) { update.descriptionHtml = fix(p.descriptionHtml); bump("descriptionHtml"); }
  const seo = { title: fix(p.seo.title), description: fix(p.seo.description) };
  if (seo.title !== p.seo.title || seo.description !== p.seo.description) { update.seo = seo; bump("seo"); }
  const mfs = p.metafields.nodes
    .filter((m) => m.key !== "brand" && fix(m.value) !== m.value)
    .map((m) => { bump(`mf:${m.key}`); return { ownerId: p.id, namespace: "custom", key: m.key, type: m.type, value: fix(m.value) }; });

  if (Object.keys(update).length === 1 && !mfs.length) continue;
  changedProducts++;
  if (!APPLY) {
    if (changedProducts <= 5) console.log(p.handle, Object.keys(update).slice(1), mfs.map((m) => m.key), update.title ? `→ "${update.title}"` : "");
    continue;
  }
  if (Object.keys(update).length > 1) {
    const d = await gql(`mutation($p:ProductUpdateInput!){productUpdate(product:$p){userErrors{message}}}`, { p: update });
    if (d.productUpdate.userErrors.length) throw new Error(`${p.handle}: ${JSON.stringify(d.productUpdate.userErrors)}`);
  }
  for (let i = 0; i < mfs.length; i += 25) {
    const d = await gql(`mutation($m:[MetafieldsSetInput!]!){metafieldsSet(metafields:$m){userErrors{message}}}`, { m: mfs.slice(i, i + 25) });
    if (d.metafieldsSet.userErrors.length) throw new Error(`${p.handle}: ${JSON.stringify(d.metafieldsSet.userErrors)}`);
  }
  // Keep the prior values so any change can be reverted.
  appendFileSync(LOG, JSON.stringify({
    ts: new Date().toISOString(), id: p.id, handle: p.handle,
    before: { title: p.title, tags: p.tags, seo: p.seo, descriptionHtml: update.descriptionHtml ? p.descriptionHtml : undefined,
      metafields: p.metafields.nodes.filter((m) => mfs.some((x) => x.key === m.key)) },
  }) + "\n");
}
console.log(`${APPLY ? "UPDATED" : "WOULD UPDATE"} ${changedProducts} products | fields:`, fieldCount);
