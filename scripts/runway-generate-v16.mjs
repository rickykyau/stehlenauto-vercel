/**
 * v16 — re-fire Beats 1, 4, 5, 6 with story-driven seeds + motion prompts.
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
    name: "v14-beat1-install",
    seed: "public/images/spot-seeds/v14/v16-beat1-clamp-on-rail.jpg",
    prompt:
      "The seed shows a worker's two gloved hands installing the matte black tonneau cover onto a black Ford F-150 bed rail — one hand holds the cover edge, the other squeezes a C-clamp shut on the bed rail lip. Over 5 seconds, the second hand SQUEEZES the clamp handle further closed with a confident downward pressure — the clamp jaws lock tighter onto the bed rail. The first hand stays firmly planted on the cover edge throughout, holding it in place. The clamp body does not morph. The cover and rail stay consistent. No power tools, no drill. Outdoor overcast daylight. Photoreal, 24fps, cinematic, very shallow depth of field with the clamp and the squeezing hand in sharpest focus.",
  },
  {
    name: "v14-beat4-water",
    seed: "public/images/spot-seeds/v14/v16-beat4-water-wide.jpg",
    prompt:
      "Wide 3/4 high-side product view of a black Ford F-150 bed with a matte black hard tri-fold tonneau cover closed across the full bed. Water droplets are scattered across the cover surface. A small stream of water visibly flows continuously OUT of the drainage outlet at the back of the side rail and drips down onto the truck body and the ground over the 5 seconds. Camera holds nearly still with a very slow drift left. The cover panels stay perfectly flat and rigid — zero motion of the cover itself. F-150 body and Ford tailgate badge stay clean and consistent. Outdoor overcast daylight. No people. Photoreal, 24fps, shallow depth of field.",
  },
  {
    name: "v14-beat5-load",
    seed: "public/images/spot-seeds/v14/v16-beat5-weight-on-cover.jpg",
    prompt:
      "Low side-rear view of a black Ford F-150 bed. A heavy black tactical duffle bag sits on top of the matte black closed tonneau cover, brown leather boots beside it. Camera holds static for 5 seconds. The cover surface beneath the bag stays PERFECTLY FLAT throughout — zero flex, zero sag, no deformation under the heavy load. A very subtle slow camera push toward the bag emphasizes the cover's flatness. The bag and boots stay still on the cover. The F-150 body and badge stay consistent. Suburban driveway background out of focus. Outdoor overcast daylight. Photoreal, 24fps, cinematic, shallow depth of field on the bag and cover surface.",
  },
  {
    name: "v14-beat6-foldopen",
    seed: "public/images/spot-seeds/v14/v16-beat6-hands-lift.jpg",
    prompt:
      "Side product view of a black Ford F-150 bed with the matte black tri-fold tonneau cover's rear panel being LIFTED OPEN by two gloved hands — one hand on each side of the panel edge. Over 5 seconds, the hands LIFT the panel further upward — the panel continues rising from its 45-degree position to about 90 degrees vertical, hinged at its forward edge. The hands stay GRIPPED on the panel throughout the motion, clearly doing the lifting work. The front and middle cover panels stay flat on the bed rails. The truck body stays consistent. No tools, no drill. Outdoor overcast daylight. Photoreal, 24fps, cinematic, shallow depth of field with the panel and the hands in sharp focus.",
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
  const c = await req(`${BASE}/v1/image_to_video`, { method: "POST", headers: headers(), body });
  const cp = JSON.parse(c.body);
  if (c.status !== 200 && c.status !== 201) throw new Error(`HTTP ${c.status}: ${JSON.stringify(cp).slice(0, 300)}`);
  console.log(`[${b.name}] task=${cp.id}`);
  let n = 0; const deadline = Date.now() + 20 * 60 * 1000;
  while (Date.now() < deadline) {
    n++;
    const p = await req(`${BASE}/v1/tasks/${cp.id}`, { headers: headers() });
    const pp = JSON.parse(p.body);
    console.log(`[${b.name}] poll ${n} ${pp.status} ${pp.progress != null ? Math.round(pp.progress * 100) + "%" : ""}`);
    if (pp.status === "SUCCEEDED") {
      const out = path.join(OUT_DIR, `runway-${b.name}.mp4`);
      if (fs.existsSync(out)) fs.renameSync(out, out.replace(".mp4", "-v15.mp4"));
      await download(pp.output[0], out);
      console.log(`[${b.name}] ✓`); return;
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
