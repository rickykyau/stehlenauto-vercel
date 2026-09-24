#!/usr/bin/env node
/**
 * Normalize product brand data.
 *
 *   custom.brand  had 150+ values — SKU prefixes (BGHD, FGGG), product types
 *                 ("Bull Guard"), placeholders ("?", "Generic"), vehicle names
 *                 ("Nissan Titan Accessories"), JL house labels (TLAPS, Topline).
 *   vendor        (what the Google & YouTube feed sends as brand) is mostly clean
 *                 but had casing/spelling variants.
 *
 * Rules
 *   vendor "Stehlen Auto"  -> custom.brand = "Stehlen Auto"
 *   third-party vendor     -> vendor + custom.brand = canonical brand name
 *   HOLD: vendor "Stehlen Auto" whose custom.brand names a real third-party
 *   brand (TruXedo, CURT, Tonno Pro...) — one of the two is wrong and needs the
 *   owner's call; these are listed and left untouched.
 *
 * Usage: node --env-file=.env.local scripts/fix-brands.mjs [--apply]
 */
import { createAdminApiClient } from "@shopify/admin-api-client";
import { appendFileSync, writeFileSync } from "node:fs";

const APPLY = process.argv.includes("--apply");
const LOG = "data/fix-brands-log.jsonl";
const domain = (process.env.SHOPIFY_STORE_DOMAIN || process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || "")
  .replace(/^https?:\/\//, "").replace(/\/+$/, "");
const client = createAdminApiClient({ storeDomain: domain, apiVersion: "2026-01", accessToken: process.env.SHOPIFY_ADMIN_TOKEN });
async function gql(query, variables) {
  const { data, errors } = await client.request(query, { variables });
  if (errors) throw new Error(JSON.stringify(errors));
  return data;
}

const HOUSE = "Stehlen Auto";
// Canonical third-party brand names, keyed by lowercase variant.
const CANON = {
  curt: "CURT",
  "spec-d": "Spec-D Tuning", "spec-d tuning": "Spec-D Tuning",
  anzo: "ANZO",
  "ajp distributors": "AJP Distributors",
  "broadfeet motorsport equipment": "Broadfeet Motorsport Equipment",
  "broadfeet motorsports equipment": "Broadfeet Motorsport Equipment",
  torklift: "Torklift", "torklift central": "Torklift",
  topline: "Topline Autopart", "topline autopart": "Topline Autopart",
};
const canon = (b) => CANON[(b || "").trim().toLowerCase()] ?? (b || "").trim();

// Real third-party brands: on a "Stehlen Auto" product these conflict with the vendor.
const THIRD_PARTY = new Set([
  "curt", "truxedo", "tonno pro", "tyger auto", "trident", "torxx", "aa products", "pegasus",
  "spec-d", "spec-d tuning", "armordillo", "armordillo usa", "black horse off road", "grizzly",
  "feberg", "spyder auto", "viewpoint", "lund", "westin", "draw-tite", "torklift", "anzo",
]);

const products = [];
for (let after = null; ;) {
  const d = await gql(
    `query($a:String){products(first:250,after:$a){pageInfo{hasNextPage endCursor}
      nodes{id handle title vendor brand:metafield(namespace:"custom",key:"brand"){value}
        pn:metafield(namespace:"custom",key:"part_number"){value}
        item:metafield(namespace:"cb_integration",key:"item_name"){value}}}}`,
    { a: after },
  );
  products.push(...d.products.nodes);
  if (!d.products.pageInfo.hasNextPage) break;
  after = d.products.pageInfo.endCursor;
}

const plan = [], held = [];
for (const p of products) {
  const brand = p.brand?.value ?? null;
  let wantVendor = p.vendor, wantBrand;
  if (p.vendor === HOUSE) {
    if (brand && THIRD_PARTY.has(brand.trim().toLowerCase())) {
      held.push({ handle: p.handle, item: p.item?.value, vendor: p.vendor, brand, part_number: p.pn?.value ?? "", title: p.title });
      continue;
    }
    wantBrand = HOUSE;
  } else {
    wantVendor = canon(p.vendor);
    wantBrand = wantVendor;
  }
  if (wantVendor !== p.vendor || wantBrand !== brand)
    plan.push({ p, from: { vendor: p.vendor, brand }, to: { vendor: wantVendor, brand: wantBrand } });
}

const summary = {};
for (const x of plan) {
  const k = `${x.from.vendor} / ${x.from.brand} -> ${x.to.vendor} / ${x.to.brand}`;
  summary[k] = (summary[k] ?? 0) + 1;
}
writeFileSync("data/fix-brands-held-for-owner.json", JSON.stringify(held, null, 2));
console.log(`${APPLY ? "UPDATING" : "WOULD UPDATE"} ${plan.length} products | held for owner: ${held.length}`);
if (!APPLY) {
  for (const [k, n] of Object.entries(summary).sort((a, b) => b[1] - a[1]).slice(0, 25)) console.log(`  ${n}  ${k}`);
  process.exit(0);
}

for (const x of plan) {
  if (x.to.vendor !== x.from.vendor) {
    const d = await gql(`mutation($p:ProductUpdateInput!){productUpdate(product:$p){userErrors{message}}}`,
      { p: { id: x.p.id, vendor: x.to.vendor } });
    if (d.productUpdate.userErrors.length) throw new Error(`${x.p.handle}: ${JSON.stringify(d.productUpdate.userErrors)}`);
  }
  if (x.to.brand !== x.from.brand) {
    const d = await gql(`mutation($m:[MetafieldsSetInput!]!){metafieldsSet(metafields:$m){userErrors{message}}}`,
      { m: [{ ownerId: x.p.id, namespace: "custom", key: "brand", type: "single_line_text_field", value: x.to.brand }] });
    if (d.metafieldsSet.userErrors.length) throw new Error(`${x.p.handle}: ${JSON.stringify(d.metafieldsSet.userErrors)}`);
  }
  appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), id: x.p.id, handle: x.p.handle, from: x.from, to: x.to }) + "\n");
}
console.log("done");
