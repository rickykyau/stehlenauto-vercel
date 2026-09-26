/**
 * fix-listing-photos.mjs — apply the listing photo audit plan
 * (data/listing-photo-fix-plan-2026-09-26.json): detach wrong-vehicle /
 * third-party-watermarked images from each product and reorder the gallery
 * so a verified product shot is the featured (first) image.
 *
 * Plan entries: { handle, remove:[{key,reason}], final_order:[key...] }
 * where `key` is the image filename normalized (Shopify's _<uuid> suffix and
 * extension stripped, lowercased) — the same image re-uploaded to many
 * products shares a key.
 *
 * Detach, don't delete: fileUpdate(referencesToRemove) unlinks the media from
 * the product but keeps the file in Shopify Files, so rollback is
 * fileUpdate(referencesToAdd) + reorder to the logged original order.
 *
 * Modes:
 *   (default)          dry run — resolve keys → media ids, print actions
 *   --apply            perform detaches + reorders
 *   --limit N          at most N products
 *   --handle H         single product
 *   --plan FILE        use a different plan file (same shape)
 *   --rollback LOG     re-attach detached media and restore original order
 *
 * Log: data/listing-photo-fix-log-<ts>.jsonl (one line per product, with the
 * full original media id order).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, "..");
const planArg = process.argv.includes("--plan") ? process.argv[process.argv.indexOf("--plan") + 1] : null;
const PLAN = planArg ? path.resolve(planArg) : path.join(REPO, "data/listing-photo-fix-plan-2026-09-26.json");

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

const DOMAIN = (process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || "")
  .replace(/^https?:\/\//, "")
  .replace(/\/+$/, "");
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
const API = "2026-04";

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const argVal = (f) => (args.includes(f) ? args[args.indexOf(f) + 1] : null);
const LIMIT = argVal("--limit") ? Number(argVal("--limit")) : Infinity;
const ONLY = argVal("--handle");
const ROLLBACK = argVal("--rollback");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function gql(query, variables = {}) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const r = await fetch(`https://${DOMAIN}/admin/api/${API}/graphql.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": TOKEN },
      body: JSON.stringify({ query, variables }),
    });
    const j = await r.json();
    if (j.errors && JSON.stringify(j.errors).includes("THROTTLED")) {
      await sleep(2000 * (attempt + 1));
      continue;
    }
    if (j.errors) throw new Error(JSON.stringify(j.errors));
    return j.data;
  }
  throw new Error("throttled too many times");
}

const keyOf = (url) =>
  url
    .split("?")[0]
    .split("/")
    .pop()
    .replace(/\.(jpe?g|png|webp)$/i, "")
    .replace(/_[0-9a-f]{8}-[0-9a-f-]{27,}/, "")
    .toLowerCase();

async function getProduct(handle) {
  const d = await gql(
    `query($h:String!){ productByHandle(handle:$h){ id media(first:50){ nodes{ id mediaContentType ... on MediaImage{ image{ url } } } } } }`,
    { h: handle },
  );
  return d.productByHandle;
}

async function detach(productId, mediaIds) {
  if (!mediaIds.length) return;
  const d = await gql(
    `mutation($f:[FileUpdateInput!]!){ fileUpdate(files:$f){ userErrors{ field message code } } }`,
    { f: mediaIds.map((id) => ({ id, referencesToRemove: [productId] })) },
  );
  const errs = d.fileUpdate.userErrors;
  if (errs.length) throw new Error("detach: " + JSON.stringify(errs));
}

async function attach(productId, mediaIds) {
  if (!mediaIds.length) return;
  const d = await gql(
    `mutation($f:[FileUpdateInput!]!){ fileUpdate(files:$f){ userErrors{ field message code } } }`,
    { f: mediaIds.map((id) => ({ id, referencesToAdd: [productId] })) },
  );
  const errs = d.fileUpdate.userErrors;
  if (errs.length) throw new Error("attach: " + JSON.stringify(errs));
}

async function reorder(productId, orderedIds) {
  const moves = orderedIds.map((id, i) => ({ id, newPosition: String(i) }));
  const d = await gql(
    `mutation($id:ID!,$m:[MoveInput!]!){ productReorderMedia(id:$id, moves:$m){ mediaUserErrors{ field message } } }`,
    { id: productId, m: moves },
  );
  const errs = d.productReorderMedia.mediaUserErrors;
  if (errs.length) throw new Error("reorder: " + JSON.stringify(errs));
}

async function rollback(logFile) {
  const lines = fs.readFileSync(logFile, "utf8").trim().split("\n").map((l) => JSON.parse(l));
  for (const e of lines) {
    if (e.status !== "applied") continue;
    await attach(e.productId, e.detachedIds);
    await sleep(1500); // attach is async; give Shopify a moment before reordering
    await reorder(e.productId, e.originalOrder);
    console.log("rolled back", e.handle);
  }
}

async function main() {
  if (!DOMAIN || !TOKEN) throw new Error("missing Shopify env");
  if (ROLLBACK) return rollback(ROLLBACK);

  let plan = JSON.parse(fs.readFileSync(PLAN, "utf8"));
  if (ONLY) plan = plan.filter((p) => p.handle === ONLY);
  plan = plan.slice(0, LIMIT);

  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const logFile = path.join(REPO, `data/listing-photo-fix-log-${ts}.jsonl`);
  const stats = { products: 0, detached: 0, reordered: 0, skipped: 0, errors: 0 };

  for (const entry of plan) {
    const p = await getProduct(entry.handle);
    if (!p) {
      console.log("SKIP (not found)", entry.handle);
      stats.skipped++;
      continue;
    }
    const images = p.media.nodes.filter((m) => m.image);
    const originalOrder = p.media.nodes.map((m) => m.id);
    const byKey = new Map();
    for (const m of images) {
      const k = keyOf(m.image.url);
      if (!byKey.has(k)) byKey.set(k, []);
      byKey.get(k).push(m.id);
    }
    const removeKeys = new Set(entry.remove.map((r) => r.key));
    const detachIds = [...removeKeys].flatMap((k) => byKey.get(k) || []);
    const planned = entry.final_order.flatMap((k) => byKey.get(k) || []);
    // Anything still attached that the plan didn't mention (e.g. uploaded
    // since the audit, or videos) keeps its relative order after planned ones.
    const rest = originalOrder.filter((id) => !planned.includes(id) && !detachIds.includes(id));
    const newOrder = [...planned, ...rest];

    if (newOrder.length < 3 && images.length >= 3) {
      console.log("SKIP (would leave <3 images)", entry.handle);
      stats.skipped++;
      continue;
    }
    const changed =
      detachIds.length > 0 || newOrder.some((id, i) => id !== originalOrder.filter((x) => !detachIds.includes(x))[i]);
    if (!changed) {
      stats.skipped++;
      continue;
    }

    const line = {
      handle: entry.handle,
      productId: p.id,
      originalOrder,
      detachedIds: detachIds,
      newOrder,
      reasons: entry.remove,
    };
    if (!APPLY) {
      console.log(`DRY ${entry.handle}: detach ${detachIds.length}, featured ${originalOrder[0] === newOrder[0] ? "unchanged" : "→ " + entry.final_order[0]}`);
      stats.products++;
      continue;
    }
    try {
      await detach(p.id, detachIds);
      await reorder(p.id, newOrder);
      fs.appendFileSync(logFile, JSON.stringify({ ...line, status: "applied" }) + "\n");
      stats.products++;
      stats.detached += detachIds.length;
      stats.reordered++;
      console.log(`OK ${entry.handle}: detached ${detachIds.length}`);
    } catch (e) {
      fs.appendFileSync(logFile, JSON.stringify({ ...line, status: "error", error: String(e) }) + "\n");
      stats.errors++;
      console.log(`ERR ${entry.handle}: ${e}`);
    }
    await sleep(300);
  }
  console.log(stats, APPLY ? `log: ${logFile}` : "(dry run)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
