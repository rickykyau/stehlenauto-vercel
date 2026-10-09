/**
 * publish-descriptions.mjs — publish rewritten product descriptions from a
 * batch folder (NN_source.json + NN_new.html pairs) to Shopify.
 *
 * Every write logs the LIVE description it replaced to
 * data/logs/description-rewrite-log/<batch>.jsonl, so rollback restores exactly
 * what was on the site (not a stale export).
 *
 * Usage:
 *   node scripts/catalog/publish-descriptions.mjs --dir <batch_dir> [--apply] [--skip NN,NN]
 *   node scripts/catalog/publish-descriptions.mjs --rollback data/logs/description-rewrite-log/<batch>.jsonl
 *
 * Validate first (python3 validate.py <batch_dir>) — this script does not
 * judge content, it only refuses empty files and skips listed NNs.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
for (const line of fs.readFileSync(path.join(REPO, ".env.local"), "utf8").split("\n")) {
  const i = line.indexOf("=");
  if (i > 0 && !line.trim().startsWith("#"))
    process.env[line.slice(0, i).trim()] ??= line.slice(i + 1).trim().replace(/^['"]|['"]$/g, "");
}
const DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN.replace(/^https?:\/\//, "").replace(/\/+$/, "");
const args = process.argv.slice(2);
const argVal = (f) => (args.includes(f) ? args[args.indexOf(f) + 1] : null);
const APPLY = args.includes("--apply");
const SKIP = new Set((argVal("--skip") || "").split(",").filter(Boolean));
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

async function setDescription(id, html) {
  const d = await gql(
    `mutation($p:ProductUpdateInput!){productUpdate(product:$p){userErrors{message}}}`,
    { p: { id, descriptionHtml: html } },
  );
  if (d.productUpdate.userErrors.length) throw new Error(JSON.stringify(d.productUpdate.userErrors));
}

async function main() {
  if (argVal("--rollback")) {
    for (const l of fs.readFileSync(argVal("--rollback"), "utf8").trim().split("\n")) {
      const e = JSON.parse(l);
      if (e.status !== "applied") continue;
      await setDescription(e.id, e.old_desc);
      console.log("restored", e.handle);
    }
    return;
  }
  const dir = argVal("--dir");
  if (!dir) throw new Error("--dir required");
  const logDir = path.join(REPO, "data/logs/description-rewrite-log");
  fs.mkdirSync(logDir, { recursive: true });
  const log = path.join(logDir, `${path.basename(dir)}.jsonl`);
  const done = new Set(
    fs.existsSync(log)
      ? fs.readFileSync(log, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l)).filter((e) => e.status === "applied").map((e) => e.handle)
      : [],
  );
  const stats = { applied: 0, skipped: 0, errors: 0 };
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith("_source.json")).sort()) {
    const nn = f.slice(0, 2);
    const src = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    const htmlFile = path.join(dir, `${nn}_new.html`);
    if (SKIP.has(nn) || done.has(src.handle) || !fs.existsSync(htmlFile)) { stats.skipped++; continue; }
    const html = fs.readFileSync(htmlFile, "utf8").trim();
    if (html.length < 200) { console.log("SKIP (too short)", src.handle); stats.skipped++; continue; }
    const live = (await gql(`query($h:String!){productByHandle(handle:$h){id descriptionHtml}}`, { h: src.handle })).productByHandle;
    if (!live) { console.log("SKIP (not found)", src.handle); stats.skipped++; continue; }
    if (!APPLY) { console.log("DRY", src.handle); continue; }
    try {
      await setDescription(live.id, html);
      fs.appendFileSync(log, JSON.stringify({ handle: src.handle, id: live.id, old_desc: live.descriptionHtml, status: "applied" }) + "\n");
      stats.applied++;
    } catch (e) {
      fs.appendFileSync(log, JSON.stringify({ handle: src.handle, id: live.id, error: String(e), status: "error" }) + "\n");
      console.log("ERR", src.handle, String(e));
      stats.errors++;
    }
    await sleep(250);
  }
  console.log(path.basename(dir), stats);
}
main().catch((e) => { console.error(e); process.exit(1); });
