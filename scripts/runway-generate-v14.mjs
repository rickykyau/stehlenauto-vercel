/**
 * runway-generate-v14.mjs
 *
 * v14 — reference-driven feature storytelling.
 * 7 beats, 1 attempt each, fired in parallel. All seeds come from owner's
 * Downloads photos or freshly Gemini-generated. Black F-150 throughout.
 *
 * Lesson applied (anti-porthole): reference seed content in prompts as
 * "what is already shown", never as new features to add.
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
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    const v = t.slice(eq + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!process.env[k]) process.env[k] = v;
  }
}
loadEnv(path.join(REPO, ".env.local"));

const API_KEY = process.env.RUNWAY_ML_API_KEY;
if (!API_KEY) throw new Error("RUNWAY_ML_API_KEY missing");

const BASE = "https://api.dev.runwayml.com";
const VERSION = "2024-11-06";
const OUT_DIR = path.join(REPO, "public/videos/spot-clips/stock");
fs.mkdirSync(OUT_DIR, { recursive: true });

const BEATS = [
  {
    name: "v14-beat1-install",
    seed: "public/images/spot-seeds/v14/seed-beat1-install-latch.jpg",
    duration: 5,
    prompt:
      "Close-up of the hard tonneau cover hardware shown in the seed image — the strap-mounted bracket and the bolt-action slide latch. Camera is static, very slight slow push toward the bracket over 5 seconds. The hardware does not move; only the camera advances slowly. Subtle ambient outdoor light from upper left. The matte black aluminum rail and textured cover surface stay sharp throughout. No human hands enter the frame. No morphing. No chrome. No water. Photoreal, 24fps, cinematic, shallow depth of field.",
  },
  {
    name: "v14-beat2-aluminum",
    seed: "public/images/spot-seeds/v14/seed-beat2-aluminum-rail.jpg",
    duration: 5,
    prompt:
      "Two-frame product detail shown in the seed image. Camera makes a very slow lateral slide moving right at 1 inch per second over 5 seconds. The aluminum rail edge and the matte black cover panel with raised seam stay in clear focus. The pebble-grain texture on the cover panel surface is the visual hero. Raking soft daylight. No vehicle body should drift into the frame. No human hands. No chrome reflections. No water. Photoreal, 24fps, cinematic, shallow depth of field.",
  },
  {
    name: "v14-beat3-latch",
    seed: "public/images/spot-seeds/v14/seed-beat3-bolt-latch.jpg",
    duration: 5,
    prompt:
      "Macro close-up of the bolt-action latch and nylon safety buckle shown in the seed image. Camera is static for 3 seconds, then slowly pushes 4 inches closer over the next 2 seconds — a very slight forward dolly, not a zoom. The latch hardware geometry stays consistent throughout — no morphing of the slide bar or the buckle. Soft warm tungsten side light from the left. No human hands enter the frame. No chrome. No LED. Photoreal, 24fps, very shallow depth of field, latch in sharp focus.",
  },
  {
    name: "v14-beat4-water",
    seed: "public/images/spot-seeds/v14/seed-beat4-water-drainage.jpg",
    duration: 5,
    prompt:
      "The seed shows water beads sitting on the matte black tonneau cover surface and in the drainage channel along the side rail of a black F-150 truck bed. Camera makes a slow forward dolly push along the rail length over 5 seconds. A couple of additional water droplets slowly travel through the drainage channel toward the back of the bed during the shot — a gentle realistic water motion. No splash, no rain, no animal motion. Overcast natural outdoor lighting. The F-150 black body panel stays smooth and consistent — no morphing. Photoreal, 24fps, cinematic, shallow depth of field.",
  },
  {
    name: "v14-beat5-load",
    seed: "public/images/spot-seeds/v14/seed-beat5-load-capacity.jpg",
    duration: 5,
    prompt:
      "The seed shows brown leather hiking boots with red laces standing on a closed matte black tonneau cover on a black F-150. Camera holds for 2 seconds, then performs a slow controlled tilt-up motion over the next 3 seconds — starting at the boots and ending looking forward across the closed cover toward the cab. The boots remain in the frame the entire time. The cover surface beneath the boots stays perfectly flat and rigid — zero flex or sag under the weight. No legs walking, no boot movement, no morphing of the boot leather. Soft natural outdoor light from above. Photoreal, 24fps, cinematic, shallow focus, brown leather boots in sharp focus.",
  },
  {
    name: "v14-beat6-foldopen",
    seed: "public/images/spot-seeds/v14/seed-beat6-fold-open.jpg",
    duration: 5,
    prompt:
      "Side-rear view of a black Ford F-150 truck bed, exactly as shown in the seed image, with the matte black tri-fold cover in the partially-open state shown. Camera holds static. Over the 5 seconds, the three folded cover panels at the front of the bed remain stacked in their folded-open position — they do NOT animate or move. A very slow camera drift to the right reveals the open bed interior. The cover panels stay rigid. The truck body stays consistent and clean glossy black throughout — no morphing. No people. Soft natural daylight. Photoreal, 24fps, cinematic, shallow depth of field.",
  },
  {
    name: "v14-beat7-hero",
    seed: "public/images/spot-seeds/v14/seed-beat7-hero.jpg",
    duration: 5,
    prompt:
      "Side three-quarter view of a black Ford F-150 truck with the matte black hard tri-fold tonneau cover closed and flush across the bed, exactly as shown in the seed image. Camera makes a slow drift from the rear corner toward the side mid-bed over 5 seconds, holding the cover and the F-150 quarter panel both in frame. The truck is stationary — no driving, no wheel rotation. The cover panels stay flat and rigid; the textured aluminum side rail is visible along the bed top. No people. Clean overcast daylight. The black truck body has subtle metallic flake. No chrome wheels. No mud. No off-road. Photoreal, 24fps, cinematic, shallow depth of field.",
  },
];

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
function req(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const r = https.request(u, { method: opts.method || "GET", headers: opts.headers || {} }, (res) => {
      let d = "";
      res.on("data", (c) => (d += c));
      res.on("end", () => resolve({ status: res.statusCode, body: d, headers: res.headers }));
    });
    r.on("error", reject);
    if (opts.body) r.write(opts.body);
    r.end();
  });
}
function download(url, dest) {
  return new Promise((resolve, reject) => {
    const f = fs.createWriteStream(dest);
    https.get(new URL(url), (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        f.close(); fs.unlinkSync(dest);
        download(res.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      res.pipe(f);
      f.on("finish", () => f.close(resolve));
    }).on("error", reject);
  });
}
const headers = () => ({
  Authorization: `Bearer ${API_KEY}`,
  "X-Runway-Version": VERSION,
  "Content-Type": "application/json",
});

async function runBeat(beat) {
  const seedPath = path.join(REPO, beat.seed);
  if (!fs.existsSync(seedPath)) throw new Error(`seed missing: ${beat.seed}`);
  if (beat.prompt.length > 1000) throw new Error(`${beat.name} prompt too long: ${beat.prompt.length}`);

  console.log(`[${beat.name}] prompt=${beat.prompt.length}chars seed=${path.basename(beat.seed)}`);
  const buf = fs.readFileSync(seedPath);
  const promptImage = `data:image/jpeg;base64,${buf.toString("base64")}`;

  const body = JSON.stringify({
    model: "gen4_turbo",
    promptImage,
    promptText: beat.prompt,
    ratio: "1280:720",
    duration: beat.duration,
  });

  const create = await req(`${BASE}/v1/image_to_video`, { method: "POST", headers: headers(), body });
  const cp = JSON.parse(create.body);
  if (create.status !== 200 && create.status !== 201) {
    throw new Error(`${beat.name} create HTTP ${create.status}: ${JSON.stringify(cp).slice(0, 400)}`);
  }
  const taskId = cp.id;
  console.log(`[${beat.name}] task=${taskId}`);

  let n = 0;
  const deadline = Date.now() + 20 * 60 * 1000;
  while (Date.now() < deadline) {
    n++;
    const p = await req(`${BASE}/v1/tasks/${taskId}`, { headers: headers() });
    const pp = JSON.parse(p.body);
    const prog = pp.progress != null ? `${Math.round(pp.progress * 100)}%` : "?";
    console.log(`[${beat.name}] poll ${n} ${pp.status} ${prog}`);
    if (pp.status === "SUCCEEDED") {
      const out = path.join(OUT_DIR, `runway-${beat.name}.mp4`);
      await download(pp.output[0], out);
      console.log(`[${beat.name}] ✓ ${path.relative(REPO, out)}`);
      return { beat: beat.name, outPath: out };
    }
    if (pp.status === "FAILED") throw new Error(`${beat.name} FAILED: ${JSON.stringify(pp.error ?? pp).slice(0, 400)}`);
    await sleep(n < 5 ? 12000 : 20000);
  }
  throw new Error(`${beat.name} timeout`);
}

async function main() {
  console.log(`[v14] firing ${BEATS.length} beats in parallel...\n`);
  const promises = BEATS.map(async (b, i) => {
    await sleep(i * 2000);
    try { return await runBeat(b); }
    catch (err) { return { beat: b.name, error: err.message }; }
  });
  const results = await Promise.all(promises);
  console.log("\n=== v14 SUMMARY ===");
  for (const r of results) {
    if (r.error) console.log(`${r.beat}: FAIL — ${r.error}`);
    else console.log(`${r.beat}: ✓`);
  }
  const ok = results.filter((r) => !r.error).length;
  console.log(`\n${ok}/${results.length} beats succeeded`);
  process.exit(ok > 0 ? 0 : 1);
}

main().catch((e) => { console.error("FATAL:", e.message); process.exit(1); });
