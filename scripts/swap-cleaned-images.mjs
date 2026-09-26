/**
 * swap-cleaned-images.mjs — put watermark/decal-cleaned images (already
 * uploaded to Shopify Files) onto the products that use the original.
 *
 * Plan: data/image-cleanup-swap-plan-2026-09-26.json, entries:
 *   { handle, key, newId, origPos, readd, featured, detachKeys[] }
 *   - original still attached  → attach cleaned at its position, detach original
 *   - readd (original was detached by fix-listing-photos for the watermark)
 *                              → attach cleaned at min(origPos, end)
 *   - featured                 → cleaned image becomes position 0
 *   - detachKeys               → also detach these image keys (wrong vehicle)
 *
 * Detach never deletes (fileUpdate referencesToRemove), so rollback =
 * `--rollback <log>`: re-attach detached ids, detach the cleaned id, restore
 * the logged original order.
 *
 * Usage: node scripts/swap-cleaned-images.mjs [--apply] [--handle H] [--rollback LOG]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
for (const line of fs.readFileSync(path.join(REPO, ".env.local"), "utf8").split("\n")) {
  const i = line.indexOf("=");
  if (i > 0 && !line.trim().startsWith("#"))
    process.env[line.slice(0, i).trim()] ??= line.slice(i + 1).trim().replace(/^['"]|['"]$/g, "");
}
const DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN.replace(/^https?:\/\//, "").replace(/\/+$/, "");
const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const argVal = (f) => (args.includes(f) ? args[args.indexOf(f) + 1] : null);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function gql(query, variables = {}) {
  for (let a = 0; a < 6; a++) {
    const r = await fetch(`https://${DOMAIN}/admin/api/2026-04/graphql.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": process.env.SHOPIFY_ADMIN_TOKEN },
      body: JSON.stringify({ query, variables }),
    });
    const j = await r.json();
    if (j.errors && JSON.stringify(j.errors).includes("THROTTLED")) { await sleep(2000 * (a + 1)); continue; }
    if (j.errors) throw new Error(JSON.stringify(j.errors));
    return j.data;
  }
  throw new Error("throttled");
}

const keyOf = (url) =>
  url.split("?")[0].split("/").pop().replace(/\.(jpe?g|png|webp)$/i, "").replace(/_[0-9a-f]{8}-[0-9a-f-]{27,}/, "").toLowerCase();

const getMedia = async (handle) =>
  (await gql(`query($h:String!){productByHandle(handle:$h){id media(first:50){nodes{id ... on MediaImage{image{url}}}}}}`, { h: handle })).productByHandle;

async function refs(productId, ids, dir) {
  if (!ids.length) return;
  const d = await gql(`mutation($f:[FileUpdateInput!]!){fileUpdate(files:$f){userErrors{message code}}}`, {
    f: ids.map((id) => ({ id, [dir === "add" ? "referencesToAdd" : "referencesToRemove"]: [productId] })),
  });
  if (d.fileUpdate.userErrors.length) throw new Error(dir + ": " + JSON.stringify(d.fileUpdate.userErrors));
}

async function reorder(productId, ids) {
  const d = await gql(`mutation($id:ID!,$m:[MoveInput!]!){productReorderMedia(id:$id,moves:$m){mediaUserErrors{message}}}`, {
    id: productId, m: ids.map((id, i) => ({ id, newPosition: String(i) })),
  });
  if (d.productReorderMedia.mediaUserErrors.length) throw new Error("reorder: " + JSON.stringify(d.productReorderMedia.mediaUserErrors));
}

// Attaching is async on Shopify's side; wait until the new media shows up.
async function waitFor(handle, id) {
  for (let i = 0; i < 20; i++) {
    const p = await getMedia(handle);
    if (p.media.nodes.some((n) => n.id === id)) return p;
    await sleep(1500);
  }
  throw new Error("attached media never appeared: " + id);
}

async function rollback(logFile) {
  for (const l of fs.readFileSync(logFile, "utf8").trim().split("\n")) {
    const e = JSON.parse(l);
    if (e.status !== "applied") continue;
    await refs(e.productId, e.detachedIds, "add");
    await refs(e.productId, [e.newId], "remove");
    await sleep(2000);
    await reorder(e.productId, e.originalOrder);
    console.log("rolled back", e.handle);
  }
}

async function main() {
  if (argVal("--rollback")) return rollback(argVal("--rollback"));
  let plan = JSON.parse(fs.readFileSync(path.join(REPO, "data/image-cleanup-swap-plan-2026-09-26.json"), "utf8"));
  if (argVal("--handle")) plan = plan.filter((j) => j.handle === argVal("--handle"));
  const log = path.join(REPO, `data/image-cleanup-swap-log-${new Date().toISOString().replace(/[:.]/g, "-")}.jsonl`);

  for (const j of plan) {
    const p = await getMedia(j.handle);
    const originalOrder = p.media.nodes.map((n) => n.id);
    const byKey = (k) => p.media.nodes.filter((n) => n.image && keyOf(n.image.url) === k).map((n) => n.id);
    if (originalOrder.includes(j.newId)) { console.log("already done", j.handle); continue; }
    const oldIds = byKey(j.key);
    const extraIds = j.detachKeys.flatMap(byKey);
    const detachIds = [...oldIds, ...extraIds];
    const keep = originalOrder.filter((id) => !detachIds.includes(id));
    const at = j.featured ? 0 : oldIds.length ? originalOrder.indexOf(oldIds[0]) - originalOrder.slice(0, originalOrder.indexOf(oldIds[0])).filter((id) => detachIds.includes(id)).length : Math.min(j.origPos, keep.length);
    if (!oldIds.length && !j.readd) { console.log("skip (original not attached, not a re-add)", j.handle); continue; }
    const newOrder = [...keep.slice(0, at), j.newId, ...keep.slice(at)];
    if (!APPLY) { console.log(`DRY ${j.handle} ${j.key}: pos ${at}, detach ${detachIds.length}`); continue; }
    try {
      await refs(p.id, [j.newId], "add");
      await waitFor(j.handle, j.newId);
      await refs(p.id, detachIds, "remove");
      await reorder(p.id, newOrder);
      fs.appendFileSync(log, JSON.stringify({ handle: j.handle, productId: p.id, key: j.key, newId: j.newId, detachedIds: detachIds, originalOrder, newOrder, status: "applied" }) + "\n");
      console.log(`OK ${j.handle} ${j.key} → pos ${at}`);
    } catch (e) {
      fs.appendFileSync(log, JSON.stringify({ handle: j.handle, error: String(e), status: "error" }) + "\n");
      console.log("ERR", j.handle, String(e));
    }
  }
  if (APPLY) console.log("log:", log);
}
main().catch((e) => { console.error(e); process.exit(1); });
