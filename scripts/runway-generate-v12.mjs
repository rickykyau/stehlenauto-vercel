/**
 * runway-generate-v12.mjs
 * Generates ONE new Runway Gen-4.5 clip for v12 spot Beat 2:
 * parked driveway rear-3/4 hero with slow orbital drift.
 *
 * Model: gen4.5 (verified live 2026-05-27)
 * Seed: seed-b-attempt-2.jpg (golden-hour driveway, sharp TACOMA badge)
 * Output: public/videos/spot-clips/stock/runway-tacoma-gen45-v12.mp4
 *
 * Reads API key from .env.local — never logs it.
 * Duration: 5s (longest available, best product moment)
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
if (!API_KEY) throw new Error("RUNWAY_ML_API_KEY not found — aborting.");

const BASE_URL = "https://api.dev.runwayml.com";
const VERSION_HEADER = "2024-11-06";
const SEED_IMAGE = path.join(REPO_ROOT, "public/images/spot-seeds/seed-b-attempt-2.jpg");
const OUTPUT_DIR = path.join(REPO_ROOT, "public/videos/spot-clips/stock");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "runway-tacoma-gen45-v12.mp4");

// gen4.5 — verified model string (2026-05-27)
const MODEL = "gen4.5";
const RATIO = "1280:720";
const DURATION = 5;

// Beat 2 prompt — v12 parked driveway hero
// Declarative, product-accurate, no flowery jargon.
// Seed image: silver 2019 Tacoma Double Cab, rear 3/4, matte black tri-fold hard cover,
//             golden-hour suburban driveway, sharp TACOMA tailgate badge.
const PROMPT =
  "Silver Toyota Tacoma Double Cab parked on a concrete driveway at golden hour. " +
  "Camera performs a slow rightward drift, starting at rear 3/4 angle. " +
  "The matte black hard tri-fold tonneau cover lies flat across the 5-foot bed, " +
  "three rigid panels visible with vertical grooves along each panel surface. " +
  "TACOMA badge on the tailgate stays legible throughout. " +
  "Late-afternoon side light rakes across the cover surface revealing the matte texture. " +
  "Shallow depth of field. Camera stays low, roughly bumper height. " +
  "No vehicle motion — Tacoma is stationary. Natural suburban greenery background. " +
  "Photoreal, 35mm equivalent lens, no motion blur on the vehicle.";

// Negatives embedded in prompt for Gen-4.5
// (Gen-4.5 doesn't have a separate negative field — fold into the positive prompt)
// "NOT: continuous LED strip, lifted suspension, chrome accents, mud, AI-glossy plastic"

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log("[runway-v12] Encoding seed image — seed-b-attempt-2.jpg...");
  const buf = fs.readFileSync(SEED_IMAGE);
  const promptImage = `data:image/jpeg;base64,${buf.toString("base64")}`;
  console.log(`[runway-v12] Seed encoded — ${(promptImage.length / 1024).toFixed(0)} KB`);

  console.log(`[runway-v12] Creating Gen-4.5 task — model=${MODEL} ratio=${RATIO} duration=${DURATION}s`);
  console.log(`[runway-v12] Prompt: ${PROMPT.slice(0, 120)}...`);

  const createBody = JSON.stringify({
    model: MODEL,
    promptImage,
    promptText: PROMPT,
    ratio: RATIO,
    duration: DURATION,
  });

  const createRes = await fetchJson(`${BASE_URL}/v1/image_to_video`, {
    method: "POST",
    headers: authHeaders(),
    body: createBody,
  });

  console.log(`[runway-v12] POST → HTTP ${createRes.status}`);

  let parsed;
  try {
    parsed = JSON.parse(createRes.body);
  } catch {
    throw new Error(`Non-JSON response: ${createRes.body.slice(0, 400)}`);
  }

  if (createRes.status !== 200 && createRes.status !== 201) {
    // Fallback to gen4_turbo if gen4.5 rejected
    if (createRes.status === 422 || createRes.status === 400) {
      console.warn(`[runway-v12] gen4.5 rejected (${createRes.status}), falling back to gen4_turbo`);
      const fallbackBody = JSON.stringify({
        model: "gen4_turbo",
        promptImage,
        promptText: PROMPT,
        ratio: RATIO,
        duration: DURATION,
      });
      const fbRes = await fetchJson(`${BASE_URL}/v1/image_to_video`, {
        method: "POST",
        headers: authHeaders(),
        body: fallbackBody,
      });
      console.log(`[runway-v12] Fallback POST → HTTP ${fbRes.status}`);
      try { parsed = JSON.parse(fbRes.body); } catch { throw new Error(`Non-JSON fallback: ${fbRes.body.slice(0, 400)}`); }
      if (fbRes.status !== 200 && fbRes.status !== 201) {
        throw new Error(`Fallback also failed HTTP ${fbRes.status}: ${JSON.stringify(parsed).slice(0, 600)}`);
      }
      console.log("[runway-v12] Fallback model: gen4_turbo");
    } else {
      throw new Error(`Task creation failed HTTP ${createRes.status}: ${JSON.stringify(parsed).slice(0, 600)}`);
    }
  }

  const taskId = parsed.id;
  if (!taskId) throw new Error(`No task id: ${JSON.stringify(parsed)}`);
  console.log(`[runway-v12] Task created — id=${taskId}`);

  // Poll until SUCCEEDED or FAILED
  const deadline = Date.now() + 20 * 60 * 1000; // 20 min max
  let attempt = 0;

  while (Date.now() < deadline) {
    attempt++;
    const pollRes = await fetchJson(`${BASE_URL}/v1/tasks/${taskId}`, { headers: authHeaders() });
    let pollParsed;
    try { pollParsed = JSON.parse(pollRes.body); } catch { throw new Error(`Non-JSON poll: ${pollRes.body.slice(0, 400)}`); }
    if (pollRes.status !== 200) throw new Error(`Poll HTTP ${pollRes.status}: ${JSON.stringify(pollParsed).slice(0, 400)}`);

    const status = pollParsed.status;
    const progress = pollParsed.progress != null ? `${Math.round(pollParsed.progress * 100)}%` : "?";
    console.log(`[runway-v12] Poll #${attempt} — status=${status} progress=${progress}`);

    if (status === "SUCCEEDED") {
      const outputUrl = pollParsed.output?.[0];
      if (!outputUrl) throw new Error(`SUCCEEDED but no output[0]: ${JSON.stringify(pollParsed)}`);
      console.log(`[runway-v12] SUCCEEDED — downloading...`);
      await downloadFile(outputUrl, OUTPUT_FILE);
      const stat = fs.statSync(OUTPUT_FILE);
      console.log(`[runway-v12] Saved: ${OUTPUT_FILE} (${(stat.size / 1024 / 1024).toFixed(2)} MB)`);
      return;
    }

    if (status === "FAILED") {
      throw new Error(`Task FAILED: ${JSON.stringify(pollParsed.error ?? pollParsed).slice(0, 600)}`);
    }

    const waitMs = attempt < 5 ? 12_000 : attempt < 15 ? 20_000 : 30_000;
    await sleep(waitMs);
  }

  throw new Error(`Task ${taskId} timed out after 20 minutes.`);
}

main().catch((err) => {
  console.error("[runway-v12] Fatal:", err.message);
  process.exit(1);
});
