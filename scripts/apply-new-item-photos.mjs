#!/usr/bin/env node
/**
 * Attach the team-approved photo sets to the 426 new-item DRAFT products.
 *
 * Inputs
 *   --slots  SLOT_ASSIGNMENT.csv  (sku = cb_integration.item_name, position,
 *            filename, role, source_folder, set_type, shared_with_n_skus)
 *   --photos local dir holding the full-size files as <set>/<filename>
 *            (downloaded from the image-review gallery's /files/<set>/<file>)
 *   --map    item_imgs.json  { SKU: [[/files/<set>/<file>, pos, caption], ...] }
 *            — resolves each (sku, filename) to its gallery set folder.
 *
 * Mechanism
 *   Each unique file is uploaded ONCE (stagedUploadsCreate → fileCreate), then
 *   attached to every product that uses it via fileUpdate.referencesToAdd
 *   (shared line sets reuse one File across up to ~30 products). Finally each
 *   product's media is reordered to the CSV's position order — position 1
 *   (HERO) becomes the featured image.
 *
 * Idempotent: progress is logged to --log (jsonl); re-runs skip uploaded files
 * and products already in the right order.
 *
 * Usage
 *   node --env-file=.env.local scripts/apply-new-item-photos.mjs \
 *     --slots ~/Downloads/SLOT_ASSIGNMENT.csv --photos <dir> --map <json> \
 *     --log data/new-item-photos-apply-log.jsonl [--sku FG-XXX] [--apply]
 *   Without --apply: dry run (plan only).
 */
import { createAdminApiClient } from "@shopify/admin-api-client";
import { readFileSync, existsSync, appendFileSync, statSync } from "node:fs";
import path from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).map((a, i, all) =>
    a.startsWith("--") ? [a.slice(2), all[i + 1]?.startsWith("--") || all[i + 1] === undefined ? true : all[i + 1]] : null,
  ).filter(Boolean),
);
const APPLY = args.apply === true;
const ONLY = typeof args.sku === "string" ? args.sku.toUpperCase() : null;

const domain = (process.env.SHOPIFY_STORE_DOMAIN || process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || "")
  .replace(/^https?:\/\//, "").replace(/\/+$/, "");
const client = createAdminApiClient({
  storeDomain: domain,
  apiVersion: "2026-01",
  accessToken: process.env.SHOPIFY_ADMIN_TOKEN,
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function gql(query, variables) {
  for (let attempt = 0; ; attempt++) {
    const { data, errors } = await client.request(query, { variables });
    if (!errors) return data;
    const msg = JSON.stringify(errors);
    if (attempt < 5 && /THROTTLED|Throttled|timeout|502|503/.test(msg)) {
      await sleep(2000 * (attempt + 1));
      continue;
    }
    throw new Error(msg);
  }
}

// ---------- CSV ----------
function parseCsv(text) {
  const rows = [];
  let row = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') q = false;
      else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((c) => c !== "")) rows.push(row);
      row = [];
    } else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [head, ...body] = rows;
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h.replace(/^﻿/, ""), r[i] ?? ""])));
}

const slots = parseCsv(readFileSync(args.slots, "utf8"));
const galleryMap = JSON.parse(readFileSync(args.map, "utf8"));

// sku -> ordered [{key (= /files/<set>/<file>), role}]
const plan = new Map();
for (const r of slots) {
  const sku = r.sku.toUpperCase();
  if (ONLY && sku !== ONLY) continue;
  const hit = (galleryMap[sku] || []).find(([u]) => path.basename(u) === r.filename);
  if (!hit) throw new Error(`no gallery file for ${sku} ${r.filename}`);
  if (!plan.has(sku)) plan.set(sku, []);
  plan.get(sku).push({ pos: Number(r.position), key: hit[0], role: r.role, file: r.filename });
}
for (const list of plan.values()) list.sort((a, b) => a.pos - b.pos);

// ---------- products ----------
const products = new Map(); // SKU -> {id, title, status}
{
  let after = null;
  for (;;) {
    const d = await gql(
      `query($a:String){products(first:250,after:$a,query:"status:draft"){pageInfo{hasNextPage endCursor}
        nodes{id title status mf:metafield(namespace:"cb_integration",key:"item_name"){value}}}}`,
      { a: after },
    );
    for (const n of d.products.nodes) if (n.mf?.value) products.set(n.mf.value.toUpperCase(), n);
    if (!d.products.pageInfo.hasNextPage) break;
    after = d.products.pageInfo.endCursor;
  }
}
const missing = [...plan.keys()].filter((s) => !products.has(s));
if (missing.length) throw new Error(`SKUs not found as drafts: ${missing.join(", ")}`);

// file key -> product SKUs using it
const users = new Map();
for (const [sku, list] of plan) for (const s of list) {
  if (!users.has(s.key)) users.set(s.key, { role: s.role, skus: [] });
  users.get(s.key).skus.push(sku);
}

// Alt text: per-SKU files use the product title; shared files use the words
// common to the end of every sharing product's title (the line name), since one
// File carries one alt across all its products.
function altFor(key) {
  const { role, skus } = users.get(key);
  const titles = skus.map((s) => products.get(s).title);
  let base = titles[0];
  if (titles.length > 1) {
    const split = titles.map((t) => t.split(/\s+/));
    const common = [];
    for (let i = 1; split.every((w) => w.length >= i && w[w.length - i] === split[0][split[0].length - i]); i++)
      common.unshift(split[0][split[0].length - i]);
    base = common.join(" ").replace(/^[-–—|,\s]+/, "") || titles[0].replace(/^\d{4}(-\d{4})?\s+/, "");
  }
  const suffix = { "HERO / og:image": "", "Product on white (WS)": " — product view", "Cutout (last)": " — cutout",
    "Detail card": " — detail", "Installed on vehicle": " — installed", Feature: " — feature" }[role] ?? "";
  return (base + suffix).slice(0, 510);
}

// ---------- log (idempotency) ----------
const LOG = args.log;
const uploaded = new Map(); // key -> fileId
if (LOG && existsSync(LOG)) {
  for (const line of readFileSync(LOG, "utf8").split("\n").filter(Boolean)) {
    const e = JSON.parse(line);
    if (e.type === "file") uploaded.set(e.key, e.fileId);
  }
}
const log = (e) => LOG && appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), ...e }) + "\n");

console.log(`plan: ${plan.size} products, ${users.size} unique files, ${[...plan.values()].reduce((a, l) => a + l.length, 0)} slots; already uploaded: ${uploaded.size}`);
if (!APPLY) {
  const [sku, list] = [...plan][0];
  console.log("sample:", sku, products.get(sku).title);
  for (const s of list) console.log("  ", s.pos, s.file, "|", altFor(s.key));
  console.log("dry run — pass --apply to write");
  process.exit(0);
}

// ---------- 1. upload each unique file once ----------
async function upload(key) {
  const local = path.join(args.photos, key.replace(/^\/files\//, ""));
  const size = statSync(local).size;
  const filename = path.basename(key).replace(/^LISTING_/, "");
  const st = await gql(
    `mutation($i:[StagedUploadInput!]!){stagedUploadsCreate(input:$i){stagedTargets{url resourceUrl parameters{name value}} userErrors{message}}}`,
    { i: [{ resource: "IMAGE", filename, mimeType: "image/jpeg", httpMethod: "POST", fileSize: String(size) }] },
  );
  const t = st.stagedUploadsCreate.stagedTargets[0];
  const form = new FormData();
  for (const p of t.parameters) form.append(p.name, p.value);
  form.append("file", new Blob([readFileSync(local)], { type: "image/jpeg" }), filename);
  const res = await fetch(t.url, { method: "POST", body: form });
  if (!res.ok) throw new Error(`staged upload ${res.status} ${await res.text()}`);
  const fc = await gql(
    `mutation($f:[FileCreateInput!]!){fileCreate(files:$f){files{id} userErrors{field message}}}`,
    { f: [{ originalSource: t.resourceUrl, contentType: "IMAGE", alt: altFor(key), filename }] },
  );
  if (fc.fileCreate.userErrors.length) throw new Error(JSON.stringify(fc.fileCreate.userErrors));
  return fc.fileCreate.files[0].id;
}

let n = 0;
const pending = [...users.keys()].filter((k) => !uploaded.has(k));
const CONC = 4;
for (let i = 0; i < pending.length; i += CONC) {
  await Promise.all(pending.slice(i, i + CONC).map(async (key) => {
    const id = await upload(key);
    uploaded.set(key, id);
    log({ type: "file", key, fileId: id });
    n++;
  }));
  if (n % 40 < CONC) console.log(`uploaded ${uploaded.size}/${users.size}`);
}

// wait until every file is READY (fileUpdate refuses to attach PROCESSING files)
for (;;) {
  const ids = [...new Set([...users.keys()].map((k) => uploaded.get(k)))];
  let notReady = [];
  for (let i = 0; i < ids.length; i += 100) {
    const d = await gql(`query($ids:[ID!]!){nodes(ids:$ids){... on MediaImage{id fileStatus}}}`, { ids: ids.slice(i, i + 100) });
    notReady.push(...d.nodes.filter((x) => x.fileStatus !== "READY"));
  }
  const failed = notReady.filter((x) => x.fileStatus === "FAILED");
  if (failed.length) throw new Error(`files FAILED processing: ${JSON.stringify(failed)}`);
  if (!notReady.length) break;
  console.log(`waiting for ${notReady.length} files to process…`);
  await sleep(5000);
}

// ---------- 2 + 3. attach + order, per product ----------
async function productMedia(id) {
  const d = await gql(`query($id:ID!){product(id:$id){media(first:50){nodes{id}}}}`, { id });
  return d.product.media.nodes.map((m) => m.id);
}

let done = 0;
for (const [sku, list] of plan) {
  const p = products.get(sku);
  const want = list.map((s) => uploaded.get(s.key));
  let have = await productMedia(p.id);
  const toAdd = want.filter((id) => !have.includes(id));
  if (toAdd.length) {
    const d = await gql(
      `mutation($f:[FileUpdateInput!]!){fileUpdate(files:$f){files{id} userErrors{field message code}}}`,
      { f: toAdd.map((id) => ({ id, referencesToAdd: [p.id] })) },
    );
    if (d.fileUpdate.userErrors.length) throw new Error(`${sku}: ${JSON.stringify(d.fileUpdate.userErrors)}`);
    for (let tries = 0; tries < 10; tries++) {
      have = await productMedia(p.id);
      if (want.every((id) => have.includes(id))) break;
      await sleep(1500);
    }
  }
  if (!want.every((id) => have.includes(id))) throw new Error(`${sku}: media not attached after wait`);
  const extra = have.filter((id) => !want.includes(id));
  if (extra.length) console.warn(`  ${sku}: ${extra.length} pre-existing media left in place (after the approved set)`);
  const target = [...want, ...extra];
  if (target.some((id, i) => have[i] !== id)) {
    const moves = target.map((id, i) => ({ id, newPosition: String(i) })).filter((m, i) => have[i] !== m.id);
    const d = await gql(
      `mutation($id:ID!,$m:[MoveInput!]!){productReorderMedia(id:$id,moves:$m){job{id} mediaUserErrors{message}}}`,
      { id: p.id, m: moves },
    );
    if (d.productReorderMedia.mediaUserErrors.length) throw new Error(`${sku}: ${JSON.stringify(d.productReorderMedia.mediaUserErrors)}`);
  }
  log({ type: "product", sku, productId: p.id, media: want });
  if (++done % 25 === 0) console.log(`products ${done}/${plan.size}`);
}
console.log(`DONE: ${done} products, ${uploaded.size} files`);
