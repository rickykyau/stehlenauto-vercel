/**
 * runway-generate.mjs
 * Generates 2x Runway Gen-4 image-to-video clips of the moving Tacoma hero.
 * Loads RUNWAY_ML_API_KEY from .env.local — never logs it.
 *
 * Usage:
 *   node scripts/runway-generate.mjs
 *
 * Output:
 *   public/videos/spot-clips/stock/runway-tacoma-1.mp4
 *   public/videos/spot-clips/stock/runway-tacoma-2.mp4
 */

import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import http from "node:http";
import { fileURLToPath } from "node:url";

// ── resolve paths ──────────────────────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

// ── load .env.local manually (no dotenv dep needed) ───────────────────────────
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

// ── config ─────────────────────────────────────────────────────────────────────
const BASE_URL = "https://api.dev.runwayml.com";
const VERSION_HEADER = "2024-11-06";
const SEED_IMAGE = path.join(REPO_ROOT, "public/images/spot-seeds/seed-b-attempt-2.jpg");
const OUTPUT_DIR = path.join(REPO_ROOT, "public/videos/spot-clips/stock");

// Model preference: try gen4.5 first, fall back to gen4_turbo on 422
const MODEL_PRIMARY = "gen4_turbo";
const MODEL_FALLBACK = "gen4_turbo";

const RATIO = "1280:720";
const DURATION = 5;

const PROMPT =
  "The silver Toyota Tacoma drives forward along an open desert highway. " +
  "Camera tracks alongside at matching speed, low angle, road and desert scenery " +
  "streaking past with natural motion blur, wheels rotating smoothly, late-afternoon sun. " +
  "The matte black hard tri-fold tonneau cover stays flat and rigid; TACOMA tailgate badge " +
  "stays legible. Cinematic, photoreal, 35mm, shallow depth of field.";

// ── helpers ────────────────────────────────────────────────────────────────────
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fetchJson(urlStr, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const lib = url.protocol === "https:" ? https : http;
    const req = lib.request(
      url,
      {
        method: options.method || "GET",
        headers: options.headers || {},
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          resolve({ status: res.statusCode, body: data, headers: res.headers });
        });
      }
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

// ── encode seed image ──────────────────────────────────────────────────────────
function encodeSeedImage() {
  const buf = fs.readFileSync(SEED_IMAGE);
  return `data:image/jpeg;base64,${buf.toString("base64")}`;
}

// ── create task ────────────────────────────────────────────────────────────────
async function createTask(model, promptImage) {
  const body = JSON.stringify({
    model,
    promptImage,
    promptText: PROMPT,
    ratio: RATIO,
    duration: DURATION,
  });

  console.log(`[runway] Creating task — model=${model} ratio=${RATIO} duration=${DURATION}s`);

  const res = await fetchJson(`${BASE_URL}/v1/image_to_video`, {
    method: "POST",
    headers: authHeaders(),
    body,
  });

  console.log(`[runway] POST /v1/image_to_video → HTTP ${res.status}`);

  let parsed;
  try {
    parsed = JSON.parse(res.body);
  } catch {
    throw new Error(`Non-JSON response: ${res.body.slice(0, 400)}`);
  }

  if (res.status !== 200 && res.status !== 201) {
    throw new Error(
      `Task creation failed HTTP ${res.status}: ${JSON.stringify(parsed).slice(0, 600)}`
    );
  }

  const taskId = parsed.id;
  if (!taskId) throw new Error(`No task id in response: ${JSON.stringify(parsed)}`);
  console.log(`[runway] Task created — id=${taskId}`);
  return taskId;
}

// ── poll task ──────────────────────────────────────────────────────────────────
async function pollTask(taskId, maxMinutes = 15) {
  const deadline = Date.now() + maxMinutes * 60 * 1000;
  let attempt = 0;

  while (Date.now() < deadline) {
    attempt++;
    const res = await fetchJson(`${BASE_URL}/v1/tasks/${taskId}`, {
      headers: authHeaders(),
    });

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
    console.log(`[runway] Poll #${attempt} — status=${status} progress=${progress}`);

    if (status === "SUCCEEDED") {
      const outputUrl = parsed.output?.[0];
      if (!outputUrl) throw new Error(`SUCCEEDED but no output[0]: ${JSON.stringify(parsed)}`);
      return outputUrl;
    }

    if (status === "FAILED") {
      throw new Error(`Task FAILED: ${JSON.stringify(parsed.error ?? parsed).slice(0, 600)}`);
    }

    // PENDING / RUNNING — back off gradually
    const waitMs = attempt < 5 ? 10_000 : attempt < 15 ? 20_000 : 30_000;
    await sleep(waitMs);
  }

  throw new Error(`Task ${taskId} did not complete within ${maxMinutes} minutes.`);
}

// ── generate one clip ──────────────────────────────────────────────────────────
async function generateClip(index, promptImage) {
  const outPath = path.join(OUTPUT_DIR, `runway-tacoma-${index}.mp4`);
  let model = MODEL_PRIMARY;

  let taskId;
  try {
    taskId = await createTask(model, promptImage);
  } catch (err) {
    if (err.message.includes("422") || err.message.includes("model")) {
      console.warn(`[runway] Primary model rejected, falling back to ${MODEL_FALLBACK}`);
      model = MODEL_FALLBACK;
      taskId = await createTask(model, promptImage);
    } else {
      throw err;
    }
  }

  const videoUrl = await pollTask(taskId);
  console.log(`[runway] Downloading clip ${index} → ${outPath}`);
  await downloadFile(videoUrl, outPath);

  const stat = fs.statSync(outPath);
  console.log(`[runway] Clip ${index} saved — ${(stat.size / 1024 / 1024).toFixed(2)} MB — model=${model}`);
  return { outPath, model, taskId, videoUrl };
}

// ── main ──────────────────────────────────────────────────────────────────────
async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log("[runway] Encoding seed image...");
  const promptImage = encodeSeedImage();
  console.log(`[runway] Seed image encoded — ${(promptImage.length / 1024).toFixed(0)} KB data URI`);

  const results = [];

  // Generate attempt 1
  console.log("\n=== ATTEMPT 1 ===");
  try {
    const r1 = await generateClip(1, promptImage);
    results.push({ attempt: 1, ...r1, error: null });
  } catch (err) {
    console.error(`[runway] Attempt 1 FAILED: ${err.message}`);
    results.push({ attempt: 1, error: err.message });
  }

  // Brief pause before attempt 2 to avoid rate limiting
  console.log("\n[runway] Waiting 5s before attempt 2...");
  await sleep(5_000);

  // Generate attempt 2
  console.log("\n=== ATTEMPT 2 ===");
  try {
    const r2 = await generateClip(2, promptImage);
    results.push({ attempt: 2, ...r2, error: null });
  } catch (err) {
    console.error(`[runway] Attempt 2 FAILED: ${err.message}`);
    results.push({ attempt: 2, error: err.message });
  }

  // Summary — never print the API key
  console.log("\n=== SUMMARY ===");
  for (const r of results) {
    if (r.error) {
      console.log(`Attempt ${r.attempt}: FAILED — ${r.error}`);
    } else {
      console.log(`Attempt ${r.attempt}: SUCCESS — ${r.outPath} (model=${r.model}, taskId=${r.taskId})`);
    }
  }

  const failed = results.filter((r) => r.error);
  if (failed.length === results.length) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("[runway] Fatal:", err.message);
  process.exit(1);
});
