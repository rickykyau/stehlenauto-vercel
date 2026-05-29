/**
 * v15 Beats 4 + 5 + 6 re-fires with motion-context seeds.
 * Strong action verbs in prompts so Runway extrapolates motion forward.
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
const OUT_DIR = path.join(REPO, "public/videos/spot-clips/stock");

const BEATS = [
  {
    name: "v14-beat4-water",
    seed: "public/images/spot-seeds/v14/seed-beat4-water-flowing.jpg",
    prompt:
      "Close-up of a black Ford F-150 side bed rail with a matte black hard tonneau cover. The seed shows water already running through the rail's drainage channel with a drop falling at the bottom edge. Over 5 seconds: water continuously flows along the rail's drainage channel from upper right toward lower left, additional water droplets gather and stream off the bottom edge of the rail outlet, falling as visible drops onto the truck body below. The water motion is realistic, gravity-driven, continuous flow — not a static pose. The camera stays mostly still with a very subtle slow drift to the right. Outdoor overcast natural lighting. No people, no rain falling from above, just water draining through the rail system. Photoreal, 24fps, shallow depth of field.",
  },
  {
    name: "v14-beat5-load",
    seed: "public/images/spot-seeds/v14/seed-beat5-boot-stepping.jpg",
    prompt:
      "Close-up of brown leather hiking boots with red laces on top of a closed matte black hard tonneau cover on a black Ford F-150. Over 5 seconds: the rearmost boot LIFTS off the cover, swings forward through the air, and PLANTS firmly back down on the cover ahead of the planted boot — a single full walking step on top of the cover. The cover surface stays perfectly flat and rigid during the step — zero flex, zero sag. The denim jeans cuffs sway slightly with the leg motion. The Ford F-150 cab and forest background stay still. Outdoor natural overcast daylight. Photoreal, 24fps, shallow depth of field with the moving boot in sharp focus.",
  },
  {
    name: "v14-beat6-foldopen",
    seed: "public/images/spot-seeds/v14/seed-beat6-panel-midfold.jpg",
    prompt:
      "Side-rear view of a black Ford F-150 truck bed with a matte black hard tri-fold tonneau cover. The seed shows the rear panel lifted to about 60-degree angle with a gloved hand supporting it. Over 5 seconds: the lifted rear panel CONTINUES folding forward — rotating smoothly along its hinge through approximately 120 degrees of additional rotation — until it comes to rest folded flat on top of the middle panel. The middle and front panels stay flat and motionless on the bed rails. The gloved hand follows the panel's motion, supporting and guiding the fold. The aluminum side rails stay in place. Bed liner visible underneath. Outdoor natural daylight. Photoreal, 24fps, cinematic, shallow depth of field with the moving panel in sharp focus.",
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

async function runBeat(b) {
  if (b.prompt.length > 1000) throw new Error(`${b.name} prompt ${b.prompt.length}`);
  const buf = fs.readFileSync(path.join(REPO, b.seed));
  const promptImage = `data:image/jpeg;base64,${buf.toString("base64")}`;
  const body = JSON.stringify({ model: "gen4_turbo", promptImage, promptText: b.prompt, ratio: "1280:720", duration: 5 });
  console.log(`[${b.name}] prompt=${b.prompt.length} seed=${path.basename(b.seed)}`);
  const create = await req(`${BASE}/v1/image_to_video`, { method: "POST", headers: headers(), body });
  const cp = JSON.parse(create.body);
  if (create.status !== 200 && create.status !== 201) throw new Error(`HTTP ${create.status}`);
  const taskId = cp.id; console.log(`[${b.name}] task=${taskId}`);
  let n = 0; const deadline = Date.now() + 20 * 60 * 1000;
  while (Date.now() < deadline) {
    n++;
    const p = await req(`${BASE}/v1/tasks/${taskId}`, { headers: headers() });
    const pp = JSON.parse(p.body);
    console.log(`[${b.name}] poll ${n} ${pp.status} ${pp.progress != null ? Math.round(pp.progress * 100) + "%" : ""}`);
    if (pp.status === "SUCCEEDED") {
      const out = path.join(OUT_DIR, `runway-${b.name}.mp4`);
      if (fs.existsSync(out)) fs.renameSync(out, out.replace(".mp4", "-prev.mp4"));
      await download(pp.output[0], out);
      console.log(`[${b.name}] ✓ ${path.relative(REPO, out)}`); return;
    }
    if (pp.status === "FAILED") throw new Error(`FAILED: ${JSON.stringify(pp.error ?? pp).slice(0, 300)}`);
    await sleep(n < 5 ? 12000 : 20000);
  }
  throw new Error("timeout");
}

const promises = BEATS.map(async (b, i) => {
  await sleep(i * 2000);
  try { return await runBeat(b); }
  catch (e) { console.error(`[${b.name}] FAIL:`, e.message); }
});
await Promise.all(promises);
console.log("done");
