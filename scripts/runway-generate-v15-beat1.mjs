/**
 * v15 Beat 1 (install demo) — re-fire with new install-clamp seed.
 * Replaces the static v14 Beat 1. Shows the wrench turning the clamp bolt.
 */
import fs from "node:fs";
import path from "node:path";
import https from "node:https";
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
    if (!process.env[k]) process.env[k] = v;
  }
}
loadEnv(path.join(REPO, ".env.local"));

const API_KEY = process.env.RUNWAY_ML_API_KEY;
const BASE = "https://api.dev.runwayml.com";
const SEED = path.join(REPO, "public/images/spot-seeds/v14/seed-beat1-install-clamp.jpg");
const OUT = path.join(REPO, "public/videos/spot-clips/stock/runway-v14-beat1-install.mp4");

const PROMPT =
  "The seed shows a black C-clamp installed onto the inner lip of a black Ford F-150 bed rail, with a worker's gloved hand holding an L-shaped hex wrench engaged on the clamp's hex bolt. Camera is static for the full 5 seconds. Over the 5 seconds, the worker's hand SLOWLY rotates the wrench clockwise — a confident, controlled tightening motion. The clamp's bolt rotates slightly with each wrench turn. The clamp body stays engaged on the bed rail edge — no slipping, no morphing. The hand stays on the wrench the entire time. The tonneau cover edge at the top of frame stays still. The black F-150 body panel and bed liner stay clean and consistent. No power drill, no drilled holes, no logos. Outdoor overcast natural lighting. Photoreal, 24fps, cinematic, shallow depth of field with the clamp and wrench in sharp focus.";

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
function req(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const r = https.request(u, { method: opts.method || "GET", headers: opts.headers || {} }, (res) => {
      let d = ""; res.on("data", (c) => (d += c));
      res.on("end", () => resolve({ status: res.statusCode, body: d, headers: res.headers }));
    });
    r.on("error", reject); if (opts.body) r.write(opts.body); r.end();
  });
}
function download(url, dest) {
  return new Promise((resolve, reject) => {
    const f = fs.createWriteStream(dest);
    https.get(new URL(url), (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        f.close(); fs.unlinkSync(dest);
        download(res.headers.location, dest).then(resolve).catch(reject); return;
      }
      res.pipe(f); f.on("finish", () => f.close(resolve));
    }).on("error", reject);
  });
}
const headers = () => ({
  Authorization: `Bearer ${API_KEY}`,
  "X-Runway-Version": "2024-11-06",
  "Content-Type": "application/json",
});

console.log(`prompt: ${PROMPT.length} chars`);
if (PROMPT.length > 1000) throw new Error("prompt too long");

const buf = fs.readFileSync(SEED);
const promptImage = `data:image/jpeg;base64,${buf.toString("base64")}`;
const body = JSON.stringify({
  model: "gen4_turbo", promptImage, promptText: PROMPT,
  ratio: "1280:720", duration: 5,
});
const create = await req(`${BASE}/v1/image_to_video`, { method: "POST", headers: headers(), body });
const cp = JSON.parse(create.body);
if (create.status !== 200 && create.status !== 201) throw new Error(`HTTP ${create.status}: ${JSON.stringify(cp).slice(0, 400)}`);
const taskId = cp.id;
console.log(`task=${taskId}`);

let n = 0;
const deadline = Date.now() + 20 * 60 * 1000;
while (Date.now() < deadline) {
  n++;
  const p = await req(`${BASE}/v1/tasks/${taskId}`, { headers: headers() });
  const pp = JSON.parse(p.body);
  console.log(`poll ${n} ${pp.status} ${pp.progress != null ? Math.round(pp.progress * 100) + "%" : ""}`);
  if (pp.status === "SUCCEEDED") {
    if (fs.existsSync(OUT)) fs.renameSync(OUT, OUT.replace(".mp4", "-static.mp4"));
    await download(pp.output[0], OUT);
    console.log(`✓ ${path.relative(REPO, OUT)}`);
    process.exit(0);
  }
  if (pp.status === "FAILED") throw new Error(`FAILED: ${JSON.stringify(pp.error ?? pp).slice(0, 400)}`);
  await sleep(n < 5 ? 12000 : 20000);
}
throw new Error("timeout");
