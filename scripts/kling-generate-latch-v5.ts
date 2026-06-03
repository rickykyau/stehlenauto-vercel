#!/usr/bin/env -S node --experimental-strip-types
/**
 * STAGE 2f v5 — New latch beat: Kling Image-to-Video
 *
 * Director: Carter Voss
 * Beat: Beat 4 replacement — deliberate "it LOCKS, securely + simply" hero beat.
 * Brief:
 *   - Tight macro of the tonneau cover's rear latch paddle + safety buckle strap.
 *   - Slow, deliberate mechanical motion: latch paddle seating down /
 *     buckle strap pulling taut and locking.
 *   - Near-static with a 2-inch push-in if Kling can't do clean mechanical motion.
 *   - Pace must let the viewer REGISTER "that's the lock."
 *   - ~5 seconds at Kling duration (source clip will be trimmed to 4s in build).
 *   - No hands, no people, no fast motion.
 *
 * Model: kling-v2-1-master, image2video, mode pro
 * Seed: public/images/spot-seeds/seed-latch-attempt-2.jpg
 * Output: public/videos/spot-clips/clip-latch-v5.mp4
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { createHmac } from "node:crypto";

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------
const ROOT =
  "/Users/ricky/Library/CloudStorage/OneDrive-Personal/Documents/Robome/Client/JL Concepts/Project/stehlenauto-vercel";
const SEEDS_DIR = path.join(ROOT, "public", "images", "spot-seeds");
const OUT_DIR = path.join(ROOT, "public", "videos", "spot-clips");

// ---------------------------------------------------------------------------
// Kling API config
// ---------------------------------------------------------------------------
const KLING_BASE = "https://api-singapore.klingai.com";
const KLING_MODEL = "kling-v2-1-master";
const POLL_INTERVAL_MS = 8000;
const POLL_TIMEOUT_MS = 15 * 60 * 1000;

// ---------------------------------------------------------------------------
// .env.local loader
// ---------------------------------------------------------------------------
async function loadEnvLocal(): Promise<void> {
  const envLocalPath = path.join(ROOT, ".env.local");
  try {
    const raw = await fs.readFile(envLocalPath, "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
      if (!m) continue;
      const [, key, valueRaw] = m;
      if (key === "KLING_AI_ACCESS_KEY" || key === "KLING_AI_SECRET_KEY") {
        process.env[key] = valueRaw.replace(/^["']|["']$/g, "");
      } else if (!process.env[key]) {
        process.env[key] = valueRaw.replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    // keys must be in shell env
  }
}

// ---------------------------------------------------------------------------
// JWT (HS256)
// ---------------------------------------------------------------------------
function base64UrlEncode(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function signJwt(accessKey: string, secretKey: string): string {
  const nowSec = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const payload = base64UrlEncode(
    Buffer.from(JSON.stringify({ iss: accessKey, exp: nowSec + 1800, nbf: nowSec - 5 }))
  );
  const signingInput = `${header}.${payload}`;
  const sig = createHmac("sha256", secretKey).update(signingInput).digest();
  return `${signingInput}.${base64UrlEncode(sig)}`;
}

// ---------------------------------------------------------------------------
// Clip spec
// ---------------------------------------------------------------------------
const LATCH_CLIP = {
  id: "latch-v5",
  label: "Beat 4 replacement — latch / safety buckle lock hero (v5)",
  seedFile: path.join(SEEDS_DIR, "seed-latch-attempt-2.jpg"),
  // Prompt: declarative, plain language, Kling syntax.
  // Goal: slow mechanical seating of latch paddle down onto the rail,
  //       buckle strap pulling taut, locked position held.
  //       Tiny push-in (2 inches of apparent camera travel) so shot has motion
  //       without obscuring hardware detail.
  prompt:
    "Extreme close-up of a matte black hard tonneau cover rear latch mechanism at the tailgate edge. " +
    "The flat matte black paddle-style latch lever slowly seats down onto the aluminum side rail, " +
    "settling into its locked position. " +
    "Simultaneously the nylon safety buckle strap pulls slightly taut, the rectangular plastic quick-release buckle " +
    "clip seats firmly against the underside of the rail — the motion is deliberate and slow, like a quality lock engaging. " +
    "After the latch seats (around second 2), the camera holds for 3 seconds on the locked hardware — " +
    "a very slow 2-inch push-in toward the buckle clip keeps the shot alive without obscuring detail. " +
    "Lighting: single key from camera left, raking across the matte surface, sharp highlight on the top face of the latch paddle and buckle. " +
    "Background is near-black. " +
    "Shallow depth of field — latch and buckle are in sharp focus. " +
    "The shot reads as solid, precision hardware. No hands. No people.",
  negativePrompt:
    "hands, fingers, people, arms, fast motion, motion blur, gloss surface, mirror reflection, chrome, " +
    "soft cover flutter, soft cover bending, morphing hardware, melted shapes, " +
    "continuous LED strip, warm amber lighting, bright studio background, " +
    "wide angle, full truck visible, lifted suspension, oversized wheels",
  duration: "5" as "5" | "10",
  mode: "pro" as "std" | "pro",
  outputFile: path.join(OUT_DIR, "clip-latch-v5.mp4"),
};

// ---------------------------------------------------------------------------
// API helpers (same as kling-generate.ts pattern)
// ---------------------------------------------------------------------------
interface KlingTask {
  task_id: string;
  task_status: "submitted" | "processing" | "succeed" | "failed";
  task_status_msg?: string;
  task_result?: {
    videos?: { id: string; url: string; duration: string }[];
  };
}

interface KlingSubmitResponse {
  code: number;
  message: string;
  request_id?: string;
  data?: KlingTask;
}

interface KlingPollResponse {
  code: number;
  message: string;
  request_id?: string;
  data?: KlingTask;
}

async function submitTask(jwt: string, imageBase64: string, dryRun: boolean): Promise<string> {
  const spec = LATCH_CLIP;

  const body = {
    model_name: KLING_MODEL,
    image: imageBase64,
    prompt: spec.prompt,
    negative_prompt: spec.negativePrompt,
    duration: spec.duration,
    mode: spec.mode,
    sound: "off",
  };

  if (dryRun) {
    console.log(`[kling] DRY RUN — would POST to ${KLING_BASE}/v1/videos/image2video`);
    console.log(`[kling] model_name: ${KLING_MODEL}`);
    console.log(`[kling] image: base64 <${imageBase64.length} chars>`);
    console.log(`[kling] prompt (first 200 chars): ${spec.prompt.slice(0, 200)}`);
    return "dry-run-task-id";
  }

  const res = await fetch(`${KLING_BASE}/v1/videos/image2video`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${jwt}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Kling submit HTTP ${res.status}: ${text.slice(0, 800)}`);
  }

  const data = JSON.parse(text) as KlingSubmitResponse;
  if (data.code !== 0) {
    throw new Error(`Kling submit error code ${data.code}: ${data.message}`);
  }
  if (!data.data?.task_id) {
    throw new Error(`Kling submit: no task_id: ${JSON.stringify(data).slice(0, 400)}`);
  }

  return data.data.task_id;
}

async function pollTask(jwt: string, taskId: string): Promise<KlingTask> {
  const start = Date.now();
  let dots = 0;

  while (Date.now() - start < POLL_TIMEOUT_MS) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

    const res = await fetch(`${KLING_BASE}/v1/videos/image2video/${taskId}`, {
      headers: {
        Authorization: `Bearer ${jwt}`,
        "Content-Type": "application/json",
      },
    });

    const text = await res.text();
    if (!res.ok) {
      throw new Error(`Kling poll HTTP ${res.status}: ${text.slice(0, 400)}`);
    }

    const data = JSON.parse(text) as KlingPollResponse;
    if (data.code !== 0) {
      throw new Error(`Kling poll error code ${data.code}: ${data.message}`);
    }

    const task = data.data;
    if (!task) throw new Error("Kling poll: no data in response");

    dots++;
    const elapsed = Math.round((Date.now() - start) / 1000);
    process.stdout.write(
      `\r[kling] latch-v5 — ${task.task_status} (${elapsed}s) ${"·".repeat(dots % 5 + 1)}   `
    );

    if (task.task_status === "succeed") {
      console.log();
      return task;
    }
    if (task.task_status === "failed") {
      console.log();
      throw new Error(`Kling task failed: ${task.task_status_msg ?? "no message"}`);
    }
  }

  throw new Error(`Kling poll timeout after ${POLL_TIMEOUT_MS / 60000} minutes`);
}

async function downloadVideo(url: string, outputPath: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Download HTTP ${res.status}`);
  }
  const buf = await res.arrayBuffer();
  await fs.writeFile(outputPath, Buffer.from(buf));
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main(): Promise<number> {
  console.log("=== Kling latch-v5 generation ===");
  await loadEnvLocal();

  const accessKey = process.env.KLING_AI_ACCESS_KEY;
  const secretKey = process.env.KLING_AI_SECRET_KEY;

  if (!accessKey || !secretKey) {
    console.error("FATAL: KLING_AI_ACCESS_KEY and/or KLING_AI_SECRET_KEY not set.");
    return 1;
  }

  const dryRun = process.argv.includes("--dry-run");

  await fs.mkdir(OUT_DIR, { recursive: true });

  const spec = LATCH_CLIP;
  console.log(`[kling] seed: ${spec.seedFile}`);
  console.log(`[kling] output: ${spec.outputFile}`);
  console.log(`[kling] model: ${KLING_MODEL}, mode: ${spec.mode}, duration: ${spec.duration}s`);

  // Verify seed exists
  try {
    await fs.access(spec.seedFile);
  } catch {
    console.error(`FATAL: seed image not found: ${spec.seedFile}`);
    return 1;
  }

  const imageBuffer = await fs.readFile(spec.seedFile);
  const imageBase64 = imageBuffer.toString("base64");
  console.log(`[kling] seed size: ${(imageBuffer.length / 1024).toFixed(0)} KB`);

  const jwt = signJwt(accessKey, secretKey);
  console.log(`[kling] JWT signed`);

  const taskId = await submitTask(jwt, imageBase64, dryRun);
  console.log(`[kling] task_id: ${taskId}`);

  if (dryRun) {
    console.log("[kling] DRY RUN complete.");
    return 0;
  }

  const task = await pollTask(jwt, taskId);

  const videoUrl = task.task_result?.videos?.[0]?.url;
  if (!videoUrl) {
    throw new Error("Task succeeded but no video URL in result");
  }
  console.log(`[kling] video URL: ${videoUrl.slice(0, 80)}…`);

  console.log(`[kling] downloading…`);
  await downloadVideo(videoUrl, spec.outputFile);

  const stat = await fs.stat(spec.outputFile);
  console.log(`[kling] DONE: ${spec.outputFile} (${(stat.size / 1024 / 1024).toFixed(2)} MB)`);

  return 0;
}

main().then((code) => process.exit(code));
