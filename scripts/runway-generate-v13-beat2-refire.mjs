/**
 * Beat 2 re-fire — first pass used the wrong seed (LED bed interior).
 * Correct seed: the pebble-grain texture closeup from owner's Downloads.
 */
import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

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
loadEnv(path.join(REPO_ROOT, ".env.local"));

const API_KEY = process.env.RUNWAY_ML_API_KEY;
const BASE_URL = "https://api.dev.runwayml.com";
const VERSION = "2024-11-06";
const SEED = "/Users/ricky/Downloads/image (8).jpeg";
const OUT = path.join(REPO_ROOT, "public/videos/spot-clips/stock/runway-v13-beat2.mp4");
const PROMPT =
  "Extreme close-up macro of a matte black hard tonneau cover panel surface — the pebble-grain ABS micro-texture shown in this seed image fills the frame. Camera makes a slow physically-weighted lateral dolly slide moving right at 2 inches per second over 5 seconds — no zoom, no shake. Raking warm tungsten side light from camera right reveals the micro-relief of the pebble texture, creating subtle three-dimensional shadows in the grain. A raised aluminum divider rail / panel seam is visible across the frame. No gloss, no reflection hotspots — the surface is matte throughout. No human hands. No vehicle body. No LED lights. No bed interior. Only the cover panel surface — keep this exact same texture and material throughout the 5-second shot. Photoreal, 24fps, cinematic high fidelity, subtle film grain.";

function req(url, options = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const r = https.request(u, { method: options.method || "GET", headers: options.headers || {} }, (res) => {
      let d = "";
      res.on("data", (c) => (d += c));
      res.on("end", () => resolve({ status: res.statusCode, body: d, headers: res.headers }));
    });
    r.on("error", reject);
    if (options.body) r.write(options.body);
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

async function main() {
  if (PROMPT.length > 1000) throw new Error(`prompt too long: ${PROMPT.length}`);
  console.log(`prompt: ${PROMPT.length} chars`);
  console.log(`seed: ${SEED}`);

  const buf = fs.readFileSync(SEED);
  const promptImage = `data:image/jpeg;base64,${buf.toString("base64")}`;
  const headers = {
    Authorization: `Bearer ${API_KEY}`,
    "X-Runway-Version": VERSION,
    "Content-Type": "application/json",
  };

  const create = await req(`${BASE_URL}/v1/image_to_video`, {
    method: "POST",
    headers,
    body: JSON.stringify({ model: "gen4_turbo", promptImage, promptText: PROMPT, ratio: "1280:720", duration: 5 }),
  });
  const cp = JSON.parse(create.body);
  if (create.status !== 200 && create.status !== 201) throw new Error(`create HTTP ${create.status}: ${JSON.stringify(cp).slice(0, 400)}`);
  const taskId = cp.id;
  console.log(`task=${taskId}`);

  let n = 0;
  const deadline = Date.now() + 20 * 60 * 1000;
  while (Date.now() < deadline) {
    n++;
    const p = await req(`${BASE_URL}/v1/tasks/${taskId}`, { headers });
    const pp = JSON.parse(p.body);
    const prog = pp.progress != null ? `${Math.round(pp.progress * 100)}%` : "?";
    console.log(`poll ${n} status=${pp.status} ${prog}`);
    if (pp.status === "SUCCEEDED") {
      await download(pp.output[0], OUT);
      const mb = (fs.statSync(OUT).size / 1024 / 1024).toFixed(2);
      console.log(`✓ ${OUT} (${mb} MB)`);
      return;
    }
    if (pp.status === "FAILED") throw new Error(`FAILED: ${JSON.stringify(pp.error ?? pp).slice(0, 400)}`);
    await new Promise((r) => setTimeout(r, n < 5 ? 12000 : 20000));
  }
  throw new Error("timeout");
}

main().catch((e) => { console.error("FATAL:", e.message); process.exit(1); });
