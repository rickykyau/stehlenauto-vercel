/**
 * Re-fire Beats 6 + 7 with cleaner seeds + tighter prompts.
 * - Beat 6: image (5).jpeg seed (F-150 Half Open / Fully Open product photos)
 * - Beat 7: image (1).jpeg seed (Tundra ARMORDILLO COVEREX TFX brand hero)
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
    const k = t.slice(0, eq).trim(); const v = t.slice(eq + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!process.env[k]) process.env[k] = v;
  }
}
loadEnv(path.join(REPO, ".env.local"));
const API_KEY = process.env.RUNWAY_ML_API_KEY;
const BASE = "https://api.dev.runwayml.com";
const OUT_DIR = path.join(REPO, "public/videos/spot-clips/stock");

const BEATS = [
  {
    name: "v14-beat6-foldopen",
    seed: "public/images/spot-seeds/v14/seed-beat6-fold-open.jpg",
    prompt:
      "The seed image shows two views of a black Ford F-150 truck bed with a matte black hard tri-fold tonneau cover — top half shows the cover closed, bottom half shows the cover fully folded forward in a 3-panel stack at the cab. Focus the camera on the BOTTOM HALF of the seed showing the cover in the fully-folded-open state with the bed accessible. The camera holds static for the entire 5 seconds — no motion of the truck or the cover. A very subtle slow drift of the camera to the right reveals the open bed interior beside the folded panel stack. The folded 3-panel cover stack at the cab does NOT move or unfold — it stays in the folded-open position throughout. Truck body and bed liner stay clean and consistent. No people. Soft natural daylight. Photoreal, 24fps, cinematic.",
  },
  {
    name: "v14-beat7-hero",
    seed: "public/images/spot-seeds/v14/seed-beat7-hero.jpg",
    prompt:
      "Hero product shot of the silver Toyota Tundra TRD 4x4 OFF ROAD shown in the seed image with the matte black hard tri-fold tonneau cover closed flush across the bed. The truck is stationary on a clean white studio surface with soft seamless lighting. The camera makes a very slow, smooth dolly orbit moving slightly from the rear corner toward the side of the truck over 5 seconds — a confident, restrained product reveal motion, not fast. The cover stays perfectly flat and rigid. The Tundra body finish stays glossy silver throughout. The 'TUNDRA' tailgate badge stays legible and consistent. The tires stay stationary. Nothing morphs. No people. No mud. No off-road. No chrome morph. Photoreal high-fidelity commercial product photography, 24fps, cinematic, shallow depth of field.",
  },
];

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

async function runBeat(beat) {
  if (beat.prompt.length > 1000) throw new Error(`${beat.name} prompt ${beat.prompt.length}`);
  const buf = fs.readFileSync(path.join(REPO, beat.seed));
  const promptImage = `data:image/jpeg;base64,${buf.toString("base64")}`;
  const body = JSON.stringify({
    model: "gen4_turbo", promptImage, promptText: beat.prompt,
    ratio: "1280:720", duration: 5,
  });
  console.log(`[${beat.name}] prompt=${beat.prompt.length}chars`);
  const create = await req(`${BASE}/v1/image_to_video`, { method: "POST", headers: headers(), body });
  const cp = JSON.parse(create.body);
  if (create.status !== 200 && create.status !== 201) throw new Error(`create HTTP ${create.status}: ${JSON.stringify(cp).slice(0, 400)}`);
  const taskId = cp.id; console.log(`[${beat.name}] task=${taskId}`);
  let n = 0; const deadline = Date.now() + 20 * 60 * 1000;
  while (Date.now() < deadline) {
    n++;
    const p = await req(`${BASE}/v1/tasks/${taskId}`, { headers: headers() });
    const pp = JSON.parse(p.body);
    console.log(`[${beat.name}] poll ${n} ${pp.status} ${pp.progress != null ? Math.round(pp.progress * 100) + "%" : ""}`);
    if (pp.status === "SUCCEEDED") {
      const out = path.join(OUT_DIR, `runway-${beat.name}.mp4`);
      await download(pp.output[0], out);
      console.log(`[${beat.name}] ✓ ${path.relative(REPO, out)}`);
      return;
    }
    if (pp.status === "FAILED") throw new Error(`FAILED: ${JSON.stringify(pp.error ?? pp).slice(0, 400)}`);
    await sleep(n < 5 ? 12000 : 20000);
  }
  throw new Error("timeout");
}

(async () => {
  const promises = BEATS.map(async (b, i) => {
    await sleep(i * 2000);
    try { return await runBeat(b); }
    catch (e) { console.error(`[${b.name}] FAIL:`, e.message); }
  });
  await Promise.all(promises);
})();
