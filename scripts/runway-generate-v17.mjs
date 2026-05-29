/**
 * v17 — re-fire 4 beats with story-correct seeds + bare hands + motion prompts
 * that match what the seeds actually need to extrapolate.
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
    seed: "public/images/spot-seeds/v14/v17-beat1-cover-placement.jpg",
    prompt:
      "The seed shows a man's bare hands holding the edge of a matte black tonneau cover hovering just above a black Ford F-150 bed rail. Over 5 seconds, the hands SLOWLY LOWER the cover edge straight down until it touches and sits flush on the truck's bed rail top. The downward motion is steady, controlled, and gentle — about 4 inches of vertical travel total. The cover's integrated side rail mechanism lands cleanly onto the truck bed rail. No tools, no clamps, no drilling. The hands remain bare throughout — no gloves appear. Outdoor overcast natural daylight. The truck body stays consistent. Photoreal, 24fps, cinematic, shallow depth of field on the hands and cover edge.",
  },
  {
    name: "v14-beat4-water",
    seed: "public/images/spot-seeds/v14/v17-beat4-dry-bed-interior.jpg",
    prompt:
      "The seed shows a black Ford F-150 bed with the matte black tri-fold tonneau cover partially open, revealing a leather bag sitting dry inside the bed. Light rain falls from above. Over 5 seconds, rain continues to fall onto the closed portion of the cover — water beads up and rolls off the surface. The OPEN portion of the bed underneath the lifted panel stays COMPLETELY DRY throughout — the leather bag does not get wet, no water enters the bed interior. Camera holds nearly static with a very subtle slow drift. The cover panels and bag stay still. Truck body stays consistent. Outdoor overcast rain. Photoreal, 24fps, shallow depth of field.",
  },
  {
    name: "v14-beat5-load",
    seed: "public/images/spot-seeds/v14/v17-beat5-sturdiness-press.jpg",
    prompt:
      "The seed shows a bare male hand pressing down on the surface of a matte black hard tonneau cover on a black Ford F-150. Over 5 seconds, the hand PRESSES DOWNWARD with increasing force — the forearm visibly tenses, knuckles whiten, the wrist drives weight into the cover. The cover surface beneath the fist stays PERFECTLY FLAT — does not flex, does not dent, does not bow downward at all. The story is rigid sturdiness. No glove on the hand throughout. Camera holds static. The truck body and cover panels stay consistent. Outdoor overcast natural daylight. Photoreal, 24fps, cinematic, shallow depth of field with the pressing hand and the flat cover surface in sharp focus.",
  },
  {
    name: "v14-beat6-foldopen",
    seed: "public/images/spot-seeds/v14/v17-beat6-bare-hand-lift.jpg",
    prompt:
      "The seed shows a man's bare hand gripping the rear panel of a matte black tonneau cover on a black Ford F-150, panel already tilted up at about 45 degrees mid-lift. Over 5 seconds, the bare hand CONTINUES LIFTING the panel upward — the panel rises further, from 45 degrees through about 75 degrees toward 90 degrees vertical. The hand stays firmly GRIPPED on the panel edge throughout the motion. The wrist actively drives the upward motion. The front and middle cover panels stay flat on the bed rails. The truck body stays consistent. No glove on the hand. Outdoor overcast natural daylight. Photoreal, 24fps, cinematic, shallow depth of field with the panel and the bare hand in sharp focus.",
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
      if (fs.existsSync(out)) fs.renameSync(out, out.replace(".mp4", "-v16.mp4"));
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
