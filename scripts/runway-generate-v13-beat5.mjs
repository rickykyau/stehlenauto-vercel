/**
 * runway-generate-v13-beat5.mjs
 *
 * v13 Beat 5 (LED HERO) — 3 parallel Runway Gen-4.5 image-to-video attempts.
 * Fail-fast: render the hardest beat first. If the model can deliver
 * 4 discrete oval LED pucks (not a strip), the rest of the queue fires.
 *
 * Seed: public/videos/spot-clips/frames-v12/v12-beat7-led-pucks.jpg
 *   (Tacoma bed interior, dark, pucks-already-lit reference frame from v12)
 *
 * Output:
 *   public/videos/spot-clips/stock/runway-v13-beat5-1.mp4
 *   public/videos/spot-clips/stock/runway-v13-beat5-2.mp4
 *   public/videos/spot-clips/stock/runway-v13-beat5-3.mp4
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
loadEnv(path.join(REPO_ROOT, ".env"));

const API_KEY = process.env.RUNWAY_ML_API_KEY;
if (!API_KEY) throw new Error("RUNWAY_ML_API_KEY not found in .env.local — aborting.");

const BASE_URL = "https://api.dev.runwayml.com";
const VERSION_HEADER = "2024-11-06";
const SEED_IMAGE = path.join(
  REPO_ROOT,
  "public/videos/spot-clips/frames-v12/v12-beat7-led-pucks.jpg",
);
const OUTPUT_DIR = path.join(REPO_ROOT, "public/videos/spot-clips/stock");

// Runway gen4_turbo is the API's current top tier on this account.
// (gen4.5 is rejected as an invalid model on /v1/image_to_video as of 2026-05-28.)
const MODEL_PRIMARY = "gen4_turbo";
const MODEL_FALLBACK = "gen4_turbo";

const RATIO = "1280:720";
const DURATION = 10; // gen4_turbo max per clip
const N_ATTEMPTS = 2;

// Lesson from attempt-1: describing "four discrete oval pucks" makes the model
// render extra oval portholes on the cab wall. Reference the seed image's
// existing pucks instead — don't describe them as new features.
const PROMPT =
  "Toyota Tacoma truck bed interior at night, viewed from the open tailgate looking forward. Empty bed. " +
  "The small LED puck lights already shown on the overhead forward rail are the ONLY light source in this scene. " +
  "Shot opens with the rail pucks OFF — bed interior dim, lit only by faint exterior light from the open tailgate. " +
  "At second 2, the rail pucks turn on simultaneously with a sharp instant-on transition — no fade, no ramp. " +
  "Cool white 5500K light floods the bed interior, casting individual circular pools onto the textured black bedliner floor. " +
  "Camera makes a slow physically-weighted forward dolly push from tailgate toward mid-bed over the next 8 seconds. " +
  "The cab wall at the far end of the bed is a SOLID matte black metal panel with NO openings, NO portholes, NO oval cutouts, NO wall-mounted lights. " +
  "Bed sidewalls are textured black bedliner, smooth, no extra lights. " +
  "Photoreal, 24fps, cinematic high fidelity. Only the small overhead rail pucks emit light.";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fetchJson(urlStr, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const lib = url.protocol === "https:" ? https : http;
    const req = lib.request(
      url,
      { method: options.method || "GET", headers: options.headers || {} },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve({ status: res.statusCode, body: data, headers: res.headers }));
      },
    );
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
    request.on("error", (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

function authHeaders() {
  return {
    Authorization: `Bearer ${API_KEY}`,
    "X-Runway-Version": VERSION_HEADER,
    "Content-Type": "application/json",
  };
}

function encodeSeedImage() {
  const buf = fs.readFileSync(SEED_IMAGE);
  return `data:image/jpeg;base64,${buf.toString("base64")}`;
}

async function createTask(model, promptImage, attempt) {
  const body = JSON.stringify({
    model,
    promptImage,
    promptText: PROMPT,
    ratio: RATIO,
    duration: DURATION,
  });

  console.log(`[v13-beat5 #${attempt}] Creating task — model=${model} duration=${DURATION}s`);

  const res = await fetchJson(`${BASE_URL}/v1/image_to_video`, {
    method: "POST",
    headers: authHeaders(),
    body,
  });

  let parsed;
  try {
    parsed = JSON.parse(res.body);
  } catch {
    throw new Error(`Non-JSON response: ${res.body.slice(0, 400)}`);
  }

  if (res.status !== 200 && res.status !== 201) {
    throw new Error(
      `Task creation failed HTTP ${res.status}: ${JSON.stringify(parsed).slice(0, 600)}`,
    );
  }

  const taskId = parsed.id;
  if (!taskId) throw new Error(`No task id in response: ${JSON.stringify(parsed)}`);
  console.log(`[v13-beat5 #${attempt}] Task created — id=${taskId}`);
  return taskId;
}

async function pollTask(taskId, attempt, maxMinutes = 20) {
  const deadline = Date.now() + maxMinutes * 60 * 1000;
  let pollNum = 0;

  while (Date.now() < deadline) {
    pollNum++;
    const res = await fetchJson(`${BASE_URL}/v1/tasks/${taskId}`, { headers: authHeaders() });

    let parsed;
    try {
      parsed = JSON.parse(res.body);
    } catch {
      throw new Error(`Non-JSON poll response: ${res.body.slice(0, 400)}`);
    }

    if (res.status !== 200) {
      throw new Error(`Poll failed HTTP ${res.status}: ${JSON.stringify(parsed).slice(0, 400)}`);
    }

    const status = parsed.status;
    const progress = parsed.progress != null ? `${Math.round(parsed.progress * 100)}%` : "?";
    console.log(`[v13-beat5 #${attempt}] Poll ${pollNum} — status=${status} progress=${progress}`);

    if (status === "SUCCEEDED") {
      const outputUrl = parsed.output?.[0];
      if (!outputUrl) throw new Error(`SUCCEEDED but no output[0]`);
      return outputUrl;
    }
    if (status === "FAILED") {
      throw new Error(`Task FAILED: ${JSON.stringify(parsed.error ?? parsed).slice(0, 600)}`);
    }

    const waitMs = pollNum < 5 ? 12_000 : pollNum < 15 ? 20_000 : 30_000;
    await sleep(waitMs);
  }
  throw new Error(`Task ${taskId} did not complete within ${maxMinutes} minutes.`);
}

async function generateOneAttempt(attempt, promptImage) {
  const outPath = path.join(OUTPUT_DIR, `runway-v13-beat5-${attempt}.mp4`);
  let model = MODEL_PRIMARY;

  let taskId;
  try {
    taskId = await createTask(model, promptImage, attempt);
  } catch (err) {
    if (err.message.includes("422") || err.message.includes("400") || err.message.includes("model")) {
      console.warn(`[v13-beat5 #${attempt}] ${model} rejected, falling back to ${MODEL_FALLBACK}`);
      model = MODEL_FALLBACK;
      taskId = await createTask(model, promptImage, attempt);
    } else {
      throw err;
    }
  }

  const videoUrl = await pollTask(taskId, attempt);
  console.log(`[v13-beat5 #${attempt}] Downloading → ${outPath}`);
  await downloadFile(videoUrl, outPath);

  const stat = fs.statSync(outPath);
  console.log(
    `[v13-beat5 #${attempt}] ✓ saved — ${(stat.size / 1024 / 1024).toFixed(2)} MB (model=${model})`,
  );
  return { attempt, outPath, model, taskId };
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  if (!fs.existsSync(SEED_IMAGE)) {
    throw new Error(`Seed image not found: ${SEED_IMAGE}`);
  }

  console.log(`[v13-beat5] Seed: ${path.relative(REPO_ROOT, SEED_IMAGE)}`);
  console.log(`[v13-beat5] Encoding...`);
  const promptImage = encodeSeedImage();
  console.log(`[v13-beat5] Encoded — ${(promptImage.length / 1024).toFixed(0)} KB data URI`);
  console.log(`[v13-beat5] Submitting ${N_ATTEMPTS} parallel attempts...\n`);

  const tasks = [];
  for (let i = 1; i <= N_ATTEMPTS; i++) {
    tasks.push(
      generateOneAttempt(i, promptImage).catch((err) => ({
        attempt: i,
        error: err.message,
      })),
    );
    // Stagger task creation by 2s to avoid rate-limit on concurrent POSTs
    if (i < N_ATTEMPTS) await sleep(2_000);
  }

  const results = await Promise.all(tasks);

  console.log("\n=== v13 BEAT 5 SUMMARY ===");
  for (const r of results) {
    if (r.error) {
      console.log(`Attempt ${r.attempt}: FAILED — ${r.error}`);
    } else {
      console.log(
        `Attempt ${r.attempt}: ✓ ${path.relative(REPO_ROOT, r.outPath)} (model=${r.model}, taskId=${r.taskId})`,
      );
    }
  }

  const failed = results.filter((r) => r.error);
  if (failed.length === results.length) process.exit(1);
}

main().catch((err) => {
  console.error("[v13-beat5] FATAL:", err.message);
  process.exit(1);
});
