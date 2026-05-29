/**
 * v19 — Kling on Beat 5 (step-onto-cover) + Beat 6 (fingers-under panel-lift).
 * Beat 1 reuses existing v18 Kling clip but will be reversed in build.
 */
import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import { createHmac } from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, "..");
function loadEnv(envFile) {
  if (!fs.existsSync(envFile)) return;
  for (const line of fs.readFileSync(envFile, "utf8").split("\n")) {
    const t = line.trim(); if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("="); if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    const v = t.slice(eq + 1).trim().replace(/^['"]|['"]$/g, "");
    if (k === "KLING_AI_ACCESS_KEY" || k === "KLING_AI_SECRET_KEY") {
      process.env[k] = v;
    } else if (!process.env[k]) process.env[k] = v;
  }
}
loadEnv(path.join(REPO, ".env.local"));

const ACCESS = process.env.KLING_AI_ACCESS_KEY;
const SECRET = process.env.KLING_AI_SECRET_KEY;
const BASE = "https://api-singapore.klingai.com";
const MODEL = "kling-v2-1-master";
const OUT_DIR = path.join(REPO, "public/videos/spot-clips/stock");

function b64url(buf) { return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, ""); }
function jwt() {
  const now = Math.floor(Date.now() / 1000);
  const h = b64url(Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const p = b64url(Buffer.from(JSON.stringify({ iss: ACCESS, exp: now + 1800, nbf: now - 5 })));
  const sig = createHmac("sha256", SECRET).update(`${h}.${p}`).digest();
  return `${h}.${p}.${b64url(sig)}`;
}

const BEATS = [
  {
    name: "v14-beat5-load",
    seed: "public/images/spot-seeds/v14/v19-beat5-stepping-on-cover.jpg",
    prompt:
      "A worker WALKS forward across the top of the matte black tonneau cover on the black Ford F-150 bed. " +
      "Right boot already PLANTED firmly on the cover. Left boot LIFTS off the cover, swings forward through the air, and PLANTS firmly back down on the cover ahead. " +
      "Full adult body weight transfers from one foot to the other. The cover surface stays PERFECTLY FLAT throughout — zero flex, zero sag, no dimpling, no compression. " +
      "Denim jeans cuffs sway slightly with the walking motion. " +
      "Outdoor overcast daylight. Photoreal cinematic.",
    negativePrompt:
      "cover flexing, cover sagging, cover denting, cover compressing under weight, soft cover, cover surface deforming, glove, water, AI artifacts, melted plastic, distorted boots, extra legs, slipping boots",
  },
  {
    name: "v14-beat6-foldopen",
    seed: "public/images/spot-seeds/v14/v19-beat6-fingers-under-panel.jpg",
    prompt:
      "A bare hand with thumb on top of the panel edge and four fingers UNDER the panel from below lifts the rear panel of the matte black tri-fold tonneau cover UPWARD. " +
      "The hand maintains the prying grip — thumb visible on top surface, four fingers hidden underneath the panel edge pushing up. " +
      "Over 5 seconds the panel rises smoothly from 45 degrees through 75 degrees toward 90 degrees vertical. " +
      "The wrist actively drives the upward lifting motion. " +
      "Front and middle panels stay flat on the bed rails. Outdoor overcast daylight. Photoreal cinematic.",
    negativePrompt:
      "glove, fingers above panel, fingers pinching top edge, fingers clipping through panel, fingers inside panel, finger penetrating cover, hand floating without grip, AI artifacts, melted plastic, distorted hand geometry",
  },
];

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
function postJson(url, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url); const data = JSON.stringify(body);
    const req = https.request({
      hostname: u.hostname, path: u.pathname, method: "POST",
      headers: { Authorization: `Bearer ${jwt()}`, "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) },
    }, (res) => {
      let c = ""; res.on("data", (x) => (c += x));
      res.on("end", () => resolve({ status: res.statusCode, body: c }));
    });
    req.on("error", reject); req.write(data); req.end();
  });
}
function getJson(url) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    https.request({ hostname: u.hostname, path: u.pathname, method: "GET", headers: { Authorization: `Bearer ${jwt()}` } }, (res) => {
      let c = ""; res.on("data", (x) => (c += x));
      res.on("end", () => resolve({ status: res.statusCode, body: c }));
    }).on("error", reject).end();
  });
}
function download(url, dest) {
  return new Promise((resolve, reject) => {
    const u = new URL(url); const f = fs.createWriteStream(dest);
    https.get(u, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        f.close(); fs.unlinkSync(dest);
        download(res.headers.location, dest).then(resolve).catch(reject); return;
      }
      res.pipe(f); f.on("finish", () => f.close(resolve));
    }).on("error", reject);
  });
}

async function runBeat(b) {
  const seedB64 = fs.readFileSync(path.join(REPO, b.seed)).toString("base64");
  console.log(`[${b.name}] submitting...`);
  const create = await postJson(`${BASE}/v1/videos/image2video`, {
    model_name: MODEL, mode: "pro", duration: "5", image: seedB64,
    prompt: b.prompt, negative_prompt: b.negativePrompt, cfg_scale: 0.5,
  });
  if (create.status !== 200) throw new Error(`create HTTP ${create.status}: ${create.body.slice(0, 300)}`);
  const cp = JSON.parse(create.body);
  if (cp.code !== 0) throw new Error(`code ${cp.code}: ${cp.message}`);
  const taskId = cp.data.task_id;
  console.log(`[${b.name}] task_id=${taskId}`);
  let n = 0; const deadline = Date.now() + 15 * 60 * 1000;
  while (Date.now() < deadline) {
    n++; await sleep(8000);
    const p = await getJson(`${BASE}/v1/videos/image2video/${taskId}`);
    if (p.status !== 200) { console.warn(`[${b.name}] HTTP ${p.status} retry`); continue; }
    const pp = JSON.parse(p.body);
    const s = pp.data?.task_status;
    console.log(`[${b.name}] poll ${n} ${s}`);
    if (s === "succeed") {
      const u = pp.data.task_result.videos[0].url;
      const out = path.join(OUT_DIR, `runway-${b.name}.mp4`);
      if (fs.existsSync(out)) fs.renameSync(out, out.replace(".mp4", "-v18.mp4"));
      await download(u, out);
      console.log(`[${b.name}] ✓`); return;
    }
    if (s === "failed") throw new Error(`failed: ${JSON.stringify(pp.data).slice(0, 300)}`);
  }
  throw new Error("timeout");
}

const promises = BEATS.map(async (b, i) => {
  await sleep(i * 3000);
  try { return await runBeat(b); }
  catch (e) { console.error(`[${b.name}] FAIL:`, e.message); }
});
await Promise.all(promises);
console.log("done");
