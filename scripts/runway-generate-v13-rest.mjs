/**
 * runway-generate-v13-rest.mjs
 *
 * v13 Beats 1, 2, 3, 4, 6 — fired in parallel after Beat 5 (LED hero) locked.
 * Each beat has its own seed + prompt + duration. All under Runway's 1000-char
 * prompt cap. Anti-porthole lesson applied: reference seeds as already-shown,
 * don't describe features as new additions.
 *
 * Output:
 *   public/videos/spot-clips/stock/runway-v13-beat{1,2,3,4,6}.mp4
 */
import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import http from "node:http";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

function loadEnv(envFile) {
  if (!fs.existsSync(envFile)) return;
  const lines = fs.readFileSync(envFile, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
}
loadEnv(path.join(REPO_ROOT, ".env.local"));

const API_KEY = process.env.RUNWAY_ML_API_KEY;
if (!API_KEY) throw new Error("RUNWAY_ML_API_KEY missing");

const BASE_URL = "https://api.dev.runwayml.com";
const VERSION_HEADER = "2024-11-06";
const OUTPUT_DIR = path.join(REPO_ROOT, "public/videos/spot-clips/stock");
const MODEL = "gen4_turbo";
const RATIO = "1280:720";

const BEATS = [
  {
    name: "beat1",
    seed: "public/images/spot-seeds/seed-b-attempt-2.jpg",
    duration: 5,
    prompt:
      "Silver Toyota Tacoma Double Cab parked on a clean residential concrete driveway at blue hour. Matte black hard tri-fold tonneau cover lies flat across the 5-foot bed — three rigid matte black panels separated by raised aluminum side rails, pebble-grain textured surface. Camera performs a slow lateral drift from left to right at bumper height, 40mm equivalent, very slight upward tilt. The Tacoma is stationary and still — no vehicle motion. Cool blue-grey ambient daylight, single warm porch light from camera left casting a subtle orange rim on the driver-side quarter panel. Shallow depth of field. Foreground driveway concrete slightly soft. No chrome wheels. No lifted suspension. No oversized tires. No mud. No rural setting. Photoreal, 24fps, cinematic with subtle film grain.",
  },
  {
    name: "beat2",
    seed: "public/images/spot-seeds/seed-c-attempt-6.jpg",
    duration: 5,
    prompt:
      "Extreme close-up macro of a matte black hard tonneau cover panel surface, shot at near-vertical overhead angle, 100mm macro equivalent. The pebble-grain ABS texture fills the frame — micro-relief catching raking warm tungsten side light from a single narrow source at frame right. A raised aluminum divider groove runs diagonally across the frame from lower left to upper right, the groove walls casting a thin shadow line. The camera makes a slow physically-weighted lateral dolly slide moving right at 2 inches per second over 5 seconds — no zoom. No gloss, no reflection hotspots — the surface is matte throughout. No motion blur. No human hands. No vehicle body visible. No LED lights. Lighting is cool, high-contrast, industrial. Photoreal, 24fps, cinematic high fidelity, subtle film grain.",
  },
  {
    name: "beat3",
    seed: "public/images/spot-seeds/seed-latch-v6-tight.jpg",
    duration: 5,
    prompt:
      "Tight close-up of a matte black bolt-action style tonneau latch mechanism at the leading edge of a hard tri-fold cover panel. The latch body is rounded composite plastic, matte black. Beside it sits a nylon webbing strap attached to a hard plastic quick-release safety buckle with a squared body. 85mm equivalent lens, very shallow depth of field — latch in sharp focus, the silver-grey Tacoma bed rail edge soft in the background. Camera is static for the first 3 seconds then makes a slow push inward toward the buckle. At second 4 the buckle snaps closed — a precise small physical motion with real mechanical weight. The latch hardware does not flex or morph between frames. No chrome. No LED lights. No human hands visible. Raking side light from camera left, warm tungsten suggesting a residential garage interior. Photoreal, 24fps, shallow focus.",
  },
  {
    name: "beat4",
    seed: "public/images/spot-seeds/seed-security-attempt-2.jpg",
    duration: 5,
    prompt:
      "Silver Toyota Tacoma Double Cab parked in a clean residential driveway at dusk, viewed from the driver-side rear at a low angle — camera approximately knee height, 35mm equivalent. The matte black hard tri-fold tonneau cover is closed and flat across the 5-foot bed. The camera drifts slowly rightward at a constant rate, maintaining the low angle, revealing the full length of the cover from forward panel to tailgate. The cover panels do not flex or ripple — they remain rigid throughout. The TACOMA tailgate badge is visible and legible. No chrome accents. No lifted suspension. No oversized wheels. Suburban neighborhood softly out of focus in the background — green hedging, concrete driveway edge. Warm dusk light from camera right. Photoreal, 24fps, cinematic film grain.",
  },
  {
    name: "beat6",
    seed: "public/images/spot-seeds/seed-f-foldopen-attempt-2.jpg",
    duration: 8,
    prompt:
      "Silver Toyota Tacoma Double Cab parked on a residential driveway in late-afternoon light. Camera positioned high on the driver side, looking down and forward at roughly 45 degrees, 35mm equivalent, full length of truck bed in frame. Shot begins with the matte black tonneau cover closed — three rigid hard panels lying flat across the 5-foot bed. Over the next 6 seconds the cover panels fold forward in mechanical sequence: the rear panel lifts first, folding up and forward onto the middle panel, which then folds forward onto the forward panel. Fold motion is smooth and mechanically precise — no flex or ripple in the panels, they remain rigid throughout. The bed floor is revealed progressively from tailgate forward, showing a textured black bedliner. The TACOMA tailgate badge stays visible. Natural afternoon side light from camera right. No chrome. No lifted suspension. Photoreal, 24fps, cinematic.",
  },
];

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function fetchJson(urlStr, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const lib = url.protocol === "https:" ? https : http;
    const req = lib.request(url, { method: options.method || "GET", headers: options.headers || {} }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => resolve({ status: res.statusCode, body: data, headers: res.headers }));
    });
    req.on("error", reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

function downloadFile(urlStr, destPath) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const lib = url.protocol === "https:" ? https : http;
    const file = fs.createWriteStream(destPath);
    const request = lib.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close();
        fs.unlinkSync(destPath);
        downloadFile(res.headers.location, destPath).then(resolve).catch(reject);
        return;
      }
      res.pipe(file);
      file.on("finish", () => file.close(resolve));
    });
    request.on("error", (err) => { fs.unlink(destPath, () => {}); reject(err); });
  });
}

const headers = () => ({
  Authorization: `Bearer ${API_KEY}`,
  "X-Runway-Version": VERSION_HEADER,
  "Content-Type": "application/json",
});

function encodeSeed(seedPath) {
  const buf = fs.readFileSync(path.join(REPO_ROOT, seedPath));
  return `data:image/jpeg;base64,${buf.toString("base64")}`;
}

async function runBeat(beat) {
  const seedExists = fs.existsSync(path.join(REPO_ROOT, beat.seed));
  if (!seedExists) throw new Error(`seed missing: ${beat.seed}`);
  if (beat.prompt.length > 1000) throw new Error(`${beat.name} prompt too long: ${beat.prompt.length}`);

  console.log(`[${beat.name}] prompt=${beat.prompt.length}chars duration=${beat.duration}s seed=${beat.seed}`);
  const promptImage = encodeSeed(beat.seed);

  const body = JSON.stringify({
    model: MODEL,
    promptImage,
    promptText: beat.prompt,
    ratio: RATIO,
    duration: beat.duration,
  });

  const createRes = await fetchJson(`${BASE_URL}/v1/image_to_video`, { method: "POST", headers: headers(), body });
  let parsed;
  try { parsed = JSON.parse(createRes.body); } catch { throw new Error(`Non-JSON: ${createRes.body.slice(0, 300)}`); }
  if (createRes.status !== 200 && createRes.status !== 201) {
    throw new Error(`Create failed HTTP ${createRes.status}: ${JSON.stringify(parsed).slice(0, 500)}`);
  }
  const taskId = parsed.id;
  if (!taskId) throw new Error("no task id");
  console.log(`[${beat.name}] task=${taskId}`);

  const deadline = Date.now() + 20 * 60 * 1000;
  let pollNum = 0;
  while (Date.now() < deadline) {
    pollNum++;
    const pollRes = await fetchJson(`${BASE_URL}/v1/tasks/${taskId}`, { headers: headers() });
    let p;
    try { p = JSON.parse(pollRes.body); } catch { throw new Error("non-JSON poll"); }
    if (pollRes.status !== 200) throw new Error(`Poll failed HTTP ${pollRes.status}`);
    const status = p.status;
    const progress = p.progress != null ? `${Math.round(p.progress * 100)}%` : "?";
    console.log(`[${beat.name}] poll ${pollNum} status=${status} ${progress}`);
    if (status === "SUCCEEDED") {
      const outPath = path.join(OUTPUT_DIR, `runway-v13-${beat.name}.mp4`);
      await downloadFile(p.output[0], outPath);
      const size = (fs.statSync(outPath).size / 1024 / 1024).toFixed(2);
      console.log(`[${beat.name}] ✓ ${path.relative(REPO_ROOT, outPath)} (${size} MB)`);
      return { beat: beat.name, outPath, taskId };
    }
    if (status === "FAILED") {
      throw new Error(`Task FAILED: ${JSON.stringify(p.error ?? p).slice(0, 400)}`);
    }
    await sleep(pollNum < 5 ? 12_000 : 20_000);
  }
  throw new Error(`${beat.name} timed out`);
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`[v13-rest] firing ${BEATS.length} beats in parallel...\n`);

  const promises = BEATS.map(async (beat, i) => {
    await sleep(i * 2_000); // stagger submission by 2s each
    try { return await runBeat(beat); }
    catch (err) { return { beat: beat.name, error: err.message }; }
  });

  const results = await Promise.all(promises);
  console.log("\n=== v13 REST SUMMARY ===");
  for (const r of results) {
    if (r.error) console.log(`${r.beat}: FAILED — ${r.error}`);
    else console.log(`${r.beat}: ✓ ${path.relative(REPO_ROOT, r.outPath)}`);
  }
  const failed = results.filter((r) => r.error);
  process.exit(failed.length === results.length ? 1 : 0);
}

main().catch((err) => { console.error("FATAL:", err.message); process.exit(1); });
