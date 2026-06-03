/**
 * apply-cb-pictures.mjs — promote each product's "new Profile" image to the
 * featured (first) media slot in Shopify, per the confirmed picture CSV.
 *
 * Source: data/confirm-cb-pictures-2026-05-16.csv
 *   columns: CB Item Name(=variant SKU, ITEM-xxxxxx), Picture Name,
 *            Picture URL, Is Profile(current featured), new Profile(target
 *            featured), sku(=cb_integration.item_name), position(current
 *            order), sub cat, category
 *
 * What it does: for each product (matched by variant SKU), find the media
 * whose URL matches the row flagged `new Profile=TRUE` and, if it isn't
 * already first, call productReorderMedia to move it to position 0. Shopify's
 * featuredImage == first media, so this changes the listing picture. All
 * other images keep their relative order. The storefront reads live Shopify,
 * so PDP gallery / cards / JSON-LD follow automatically after ISR.
 *
 * Modes:
 *   (default)        dry run — CSV analysis + small live sample, NO writes
 *   --apply          perform the live reorders
 *   --verify         re-check live featured image == new Profile target
 *   --limit N        process at most N products (stage the rollout)
 *   --sku ITEM-xxxx  operate on a single product (testing)
 *
 * Safety: idempotent (skips products already correct), logs every action to
 * data/cb-pictures-apply-log-<ts>.jsonl recording the PREVIOUS first-media id
 * (rollback = re-promote that id). Retries on Shopify THROTTLED.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, "..");
const CSV_PATH = path.join(REPO, "data/confirm-cb-pictures-2026-05-16.csv");

// ---- env ----
function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    const k = t.slice(0, i).trim();
    const v = t.slice(i + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!process.env[k]) process.env[k] = v;
  }
}
loadEnv(path.join(REPO, ".env.local"));

const DOMAIN = (
  process.env.SHOPIFY_STORE_DOMAIN ||
  process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN ||
  ""
)
  .replace(/^https?:\/\//, "")
  .replace(/\/+$/, "");
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
const API = process.env.NEXT_PUBLIC_SHOPIFY_API_VERSION || "2026-01";
if (!DOMAIN || !TOKEN) {
  console.error("Missing SHOPIFY domain or admin token in .env.local");
  process.exit(1);
}

// ---- args ----
const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const VERIFY = args.includes("--verify");
const limitArg = args.indexOf("--limit");
const LIMIT = limitArg >= 0 ? parseInt(args[limitArg + 1], 10) : Infinity;
const skuArg = args.indexOf("--sku");
const ONLY_SKU = skuArg >= 0 ? args[skuArg + 1] : null;

// ---- helpers ----
const stripVersion = (u) => (u || "").split("?")[0];
const basename = (u) => stripVersion(u).split("/").pop();

function parseCsv(file) {
  const lines = fs.readFileSync(file, "utf8").split("\n").filter(Boolean);
  lines.shift(); // header
  // by-SKU map: { variantSku -> { cbItemName, rows:[{name,url,isProfile,newProfile,position}] } }
  const bySku = new Map();
  for (const line of lines) {
    const f = line.split(",");
    if (f.length < 7) continue;
    const variantSku = f[0].trim();
    const row = {
      name: f[1].trim(),
      url: f[2].trim(),
      isProfile: f[3].trim().toUpperCase() === "TRUE",
      newProfile: f[4].trim().toUpperCase() === "TRUE",
      cbItemName: f[5].trim(),
      position: parseInt(f[6].trim(), 10),
    };
    if (!bySku.has(variantSku))
      bySku.set(variantSku, { cbItemName: row.cbItemName, rows: [] });
    bySku.get(variantSku).rows.push(row);
  }
  return bySku;
}

async function adminFetch(query, variables = {}, attempt = 0) {
  const res = await fetch(
    `https://${DOMAIN}/admin/api/${API}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": TOKEN,
      },
      body: JSON.stringify({ query, variables }),
    },
  );
  const json = await res.json();
  const throttled =
    json.errors &&
    JSON.stringify(json.errors).toUpperCase().includes("THROTTLED");
  if ((res.status === 429 || throttled) && attempt < 6) {
    const wait = 1000 * Math.pow(2, attempt);
    await new Promise((r) => setTimeout(r, wait));
    return adminFetch(query, variables, attempt + 1);
  }
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

const PRODUCT_Q = `query($q:String!){
  products(first:1, query:$q){ edges{ node{
    id title handle
    media(first:50){ edges{ node{ ... on MediaImage { id image{ url } } } } }
  } } }
}`;

const REORDER_M = `mutation($id:ID!, $moves:[MoveInput!]!){
  productReorderMedia(id:$id, moves:$moves){
    job{ id } mediaUserErrors{ field message }
  }
}`;

async function fetchProduct(variantSku) {
  const d = await adminFetch(PRODUCT_Q, { q: `sku:${variantSku}` });
  const node = d?.products?.edges?.[0]?.node;
  if (!node) return null;
  const media = node.media.edges
    .map((e) => e.node)
    .filter((n) => n && n.id && n.image)
    .map((n) => ({ id: n.id, url: n.image.url }));
  return { id: node.id, title: node.title, handle: node.handle, media };
}

// find the media on the product that corresponds to the new-profile row
function matchMedia(media, targetRow) {
  const tUrl = stripVersion(targetRow.url);
  const tBase = basename(targetRow.url);
  return (
    media.find((m) => stripVersion(m.url) === tUrl) ||
    media.find((m) => basename(m.url) === tBase) ||
    null
  );
}

// ---- main ----
const bySku = parseCsv(CSV_PATH);
let entries = [...bySku.entries()];
if (ONLY_SKU) entries = entries.filter(([sku]) => sku === ONLY_SKU);

// CSV-only analysis (instant, no network)
let csvChange = 0;
let csvNoop = 0;
let csvMissingTarget = 0;
for (const [, data] of entries) {
  const target = data.rows.find((r) => r.newProfile);
  if (!target) {
    csvMissingTarget++;
    continue;
  }
  if (target.position === 1) csvNoop++;
  else csvChange++;
}

console.log(`\n=== CB pictures: new-profile → featured ===`);
console.log(`store: ${DOMAIN}  api: ${API}`);
console.log(`mode:  ${APPLY ? "APPLY (LIVE WRITES)" : VERIFY ? "VERIFY" : "DRY RUN (no writes)"}`);
console.log(`products in CSV: ${entries.length}`);
console.log(`  already featured (new Profile at pos 1, no-op): ${csvNoop}`);
console.log(`  need reorder (new Profile not at pos 1):        ${csvChange}`);
if (csvMissingTarget) console.log(`  ⚠ no new-Profile flag:                          ${csvMissingTarget}`);

if (!APPLY && !VERIFY) {
  // live spot-check on a small sample of the products that should change
  const sample = entries
    .filter(([, d]) => {
      const t = d.rows.find((r) => r.newProfile);
      return t && t.position !== 1;
    })
    .slice(0, 12);
  console.log(`\n--- live spot-check (${sample.length} sample products that should change) ---`);
  let matched = 0;
  let unmatched = 0;
  for (const [sku, data] of sample) {
    const target = data.rows.find((r) => r.newProfile);
    try {
      const p = await fetchProduct(sku);
      if (!p) {
        console.log(`  ✗ ${sku}: product NOT FOUND`);
        unmatched++;
        continue;
      }
      const m = matchMedia(p.media, target);
      const curFirst = basename(p.media[0]?.url);
      if (!m) {
        console.log(`  ✗ ${sku} (${p.title.slice(0, 40)}): target image NOT on product → ${target.name}`);
        unmatched++;
      } else {
        const idx = p.media.findIndex((x) => x.id === m.id);
        console.log(`  ✓ ${sku}: cur[1]=${curFirst}  →  promote ${basename(m.url)} (currently media[${idx + 1}])`);
        matched++;
      }
    } catch (e) {
      console.log(`  ! ${sku}: error ${String(e).slice(0, 80)}`);
      unmatched++;
    }
  }
  console.log(`\nspot-check: ${matched} matched cleanly, ${unmatched} need attention`);
  console.log(`\nNothing was written. Re-run with --apply to perform the reorders.`);
  console.log(`(stage with --limit N, or test one with --sku ITEM-xxxxxx --apply)`);
  process.exit(0);
}

// APPLY or VERIFY over the full set
const tsStamp = args.indexOf("--ts") >= 0 ? args[args.indexOf("--ts") + 1] : "run";
const logPath = path.join(REPO, `data/cb-pictures-apply-log-${tsStamp}.jsonl`);
const logFh = APPLY ? fs.createWriteStream(logPath, { flags: "a" }) : null;

let done = 0,
  changed = 0,
  skipped = 0,
  notFound = 0,
  noTarget = 0,
  errors = 0;

for (const [sku, data] of entries) {
  // --limit caps the number of ACTUAL reorders (no-ops don't count) so
  // staging "10" yields 10 real featured-image changes to verify.
  if (changed >= LIMIT) break;
  done++;
  const target = data.rows.find((r) => r.newProfile);
  if (!target) {
    noTarget++;
    continue;
  }
  try {
    const p = await fetchProduct(sku);
    if (!p) {
      notFound++;
      console.log(`✗ ${sku}: NOT FOUND`);
      continue;
    }
    const m = matchMedia(p.media, target);
    if (!m) {
      errors++;
      console.log(`✗ ${sku} (${p.title.slice(0, 36)}): target image not on product (${target.name})`);
      continue;
    }
    const idx = p.media.findIndex((x) => x.id === m.id);
    const prevFirstId = p.media[0]?.id ?? null;

    if (idx === 0) {
      skipped++;
      if (VERIFY) console.log(`✓ ${sku}: already featured (${basename(m.url)})`);
      continue;
    }
    if (VERIFY) {
      console.log(`✗ ${sku}: featured is ${basename(p.media[0]?.url)} but should be ${basename(m.url)}`);
      changed++; // count as "would-change" in verify
      continue;
    }

    const r = await adminFetch(REORDER_M, {
      id: p.id,
      moves: [{ id: m.id, newPosition: "0" }],
    });
    const ue = r?.productReorderMedia?.mediaUserErrors ?? [];
    if (ue.length) {
      errors++;
      console.log(`✗ ${sku}: reorder error ${JSON.stringify(ue)}`);
      continue;
    }
    changed++;
    logFh.write(
      JSON.stringify({
        sku,
        cbItemName: data.cbItemName,
        productId: p.id,
        handle: p.handle,
        promotedMediaId: m.id,
        promotedFile: basename(m.url),
        fromIndex: idx,
        prevFirstId, // rollback target
        jobId: r?.productReorderMedia?.job?.id ?? null,
      }) + "\n",
    );
    if (changed % 25 === 0)
      console.log(`  … ${changed} reordered (at ${sku})`);
  } catch (e) {
    errors++;
    console.log(`! ${sku}: ${String(e).slice(0, 100)}`);
  }
}

if (logFh) logFh.end();
console.log(`\n=== ${VERIFY ? "VERIFY" : "APPLY"} complete ===`);
console.log(`processed:  ${done}`);
console.log(`${VERIFY ? "would change" : "reordered"}: ${changed}`);
console.log(`already ok:  ${skipped}`);
console.log(`not found:   ${notFound}`);
console.log(`no target:   ${noTarget}`);
console.log(`errors:      ${errors}`);
if (APPLY) console.log(`log → ${path.relative(REPO, logPath)}  (rollback data inside)`);
