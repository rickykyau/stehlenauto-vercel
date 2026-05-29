/**
 * v18 — Beats 1 (install) + 6 (fold-open) via Kling kling-v2-1-master.
 *
 * Owner v17 feedback: Runway gen4_turbo has geometry/clipping issues —
 * Beat 1 cover edge doesn't make contact with the truck rail, Beat 6 finger
 * clips through the panel. Kling's strength is material/physics rendering.
 *
 * Cost: ~$1.40 per 5s clip × 2 beats = ~$2.80.
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
    } else if (!process.env[k]) {
      process.env[k] = v;
    }
  }
}
loadEnv(path.join(REPO, ".env.local"));

const ACCESS = process.env.KLING_AI_ACCESS_KEY;
const SECRET = process.env.KLING_AI_SECRET_KEY;
if (!ACCESS || !SECRET) throw new Error("KLING_AI_ACCESS_KEY or KLING_AI_SECRET_KEY missing");

const BASE = "https://api-singapore.klingai.com";
const MODEL = "kling-v2-1-master";
const OUT_DIR = path.join(REPO, "public/videos/spot-clips/stock");

function b64url(buf) {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
function jwt() {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const payload = b64url(Buffer.from(JSON.stringify({ iss: ACCESS, exp: now + 1800, nbf: now - 5 })));
  const sig = createHmac("sha256", SECRET).update(`${header}.${payload}`).digest();
  return `${header}.${payload}.${b64url(sig)}`;
}

const BEATS = [
  {
    name: "v14-beat1-install",
    seed: "public/images/spot-seeds/v14/v17-beat1-cover-placement.jpg",
    prompt:
      "Bare hands slowly lower the matte black tonneau cover edge down onto the black Ford F-150 bed rail. The cover edge descends straight down approximately 4 inches and comes to rest flush on top of the bed rail — visible contact between the cover's underside rail and the truck's bed rail. The hands stay firmly gripped on the cover edge throughout. No tools. Confident, deliberate placement motion. Outdoor overcast daylight. Photoreal cinematic.",
    negativePrompt:
      "tools, wrench, clamp pliers, drill, gloves, floating cover, cover hovering above rail without contact, missing rail contact, blurry, distorted hands, extra fingers, melted plastic, AI artifacts",
  },
  {
    name: "v14-beat6-foldopen",
    seed: "public/images/spot-seeds/v14/v17-beat6-bare-hand-lift.jpg",
    prompt:
      "A bare male hand firmly grips the rear panel of a matte black tri-fold tonneau cover at its edge and LIFTS THE PANEL UP — the panel rises smoothly from a 45-degree angle through 75 degrees toward vertical. The fingers stay wrapped around the outside of the panel edge throughout — the hand never penetrates or clips through the panel. The front and middle panels stay flat on the bed rails. Outdoor overcast daylight. Photoreal cinematic.",
    negativePrompt:
      "glove, gloved hand, finger inside the panel, finger clipping through panel, finger penetrating cover, distorted hand geometry, extra fingers, melted plastic panel, AI artifacts, floating panel without hand contact",
  },
];

function postJson(url, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const data = JSON.stringify(body);
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname,
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt()}`,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data),
      },
    }, (res) => {
      let chunks = "";
      res.on("data", (c) => (chunks += c));
      res.on("end", () => resolve({ status: res.statusCode, body: chunks }));
    });
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}
function getJson(url) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    https.request({
      hostname: u.hostname, path: u.pathname, method: "GET",
      headers: { Authorization: `Bearer ${jwt()}` },
    }, (res) => {
      let chunks = "";
      res.on("data", (c) => (chunks += c));
      res.on("end", () => resolve({ status: res.statusCode, body: chunks }));
    }).on("error", reject).end();
  });
}
function download(url, dest) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const f = fs.createWriteStream(dest);
    https.get(u, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        f.close(); fs.unlinkSync(dest);
        download(res.headers.location, dest).then(resolve).catch(reject); return;
      }
      res.pipe(f); f.on("finish", () => f.close(resolve));
    }).on("error", reject);
  });
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function runBeat(b) {
  // Kling expects raw base64 (NO data: prefix) per memory note
  const seedB64 = fs.readFileSync(path.join(REPO, b.seed)).toString("base64");
  console.log(`[${b.name}] submitting to Kling ${MODEL}...`);
  const create = await postJson(`${BASE}/v1/videos/image2video`, {
    model_name: MODEL,
    mode: "pro",
    duration: "5",
    image: seedB64,
    prompt: b.prompt,
    negative_prompt: b.negativePrompt,
    cfg_scale: 0.5,
  });
  if (create.status !== 200) throw new Error(`create HTTP ${create.status}: ${create.body.slice(0, 400)}`);
  const cp = JSON.parse(create.body);
  if (cp.code !== 0) throw new Error(`create error ${cp.code}: ${cp.message}`);
  const taskId = cp.data?.task_id;
  if (!taskId) throw new Error(`no task_id: ${JSON.stringify(cp).slice(0, 300)}`);
  console.log(`[${b.name}] task_id=${taskId}`);

  let n = 0;
  const deadline = Date.now() + 15 * 60 * 1000;
  while (Date.now() < deadline) {
    n++;
    await sleep(8000);
    const p = await getJson(`${BASE}/v1/videos/image2video/${taskId}`);
    if (p.status !== 200) { console.warn(`[${b.name}] poll ${n} HTTP ${p.status} — retrying`); continue; }
    const pp = JSON.parse(p.body);
    const status = pp.data?.task_status;
    console.log(`[${b.name}] poll ${n} status=${status}`);
    if (status === "succeed") {
      const videoUrl = pp.data?.task_result?.videos?.[0]?.url;
      if (!videoUrl) throw new Error(`no video URL: ${JSON.stringify(pp).slice(0, 400)}`);
      const out = path.join(OUT_DIR, `runway-${b.name}.mp4`);
      if (fs.existsSync(out)) fs.renameSync(out, out.replace(".mp4", "-v17.mp4"));
      await download(videoUrl, out);
      console.log(`[${b.name}] ✓ ${path.relative(REPO, out)}`); return;
    }
    if (status === "failed") throw new Error(`task failed: ${JSON.stringify(pp.data).slice(0, 300)}`);
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
