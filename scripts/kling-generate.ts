#!/usr/bin/env -S node --experimental-strip-types
/**
 * STAGE 2a — Stehlen Tacoma Tonneau + LED Spot: Kling Image-to-Video Generation
 *
 * Director: Carter Voss
 * Brief: Submit image-to-video tasks to Kling API, poll until done, download MP4.
 *
 * API: https://api-singapore.klingai.com
 * Endpoint: POST /v1/videos/image2video
 * Model: kling-v2-1-master (latest master tier per official docs as of 2026-05)
 * Auth: JWT HS256 — header: {alg:"HS256",typ:"JWT"}, payload: {iss:<ACCESS_KEY>, exp:now+1800, nbf:now-5}
 *
 * Usage:
 *   node scripts/kling-generate.ts                    # generate both hero clips
 *   node scripts/kling-generate.ts --only=h1          # LED reveal only
 *   node scripts/kling-generate.ts --only=h2          # truck dolly only
 *   node scripts/kling-generate.ts --dry-run          # auth test only, no submission
 *
 * Outputs: public/videos/spot-clips/clip-h1-led-reveal.mp4
 *          public/videos/spot-clips/clip-h2-truck-dolly.mp4
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { createHmac } from "node:crypto";

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------
const ROOT = process.cwd();
const SEEDS_DIR = path.join(ROOT, "public", "images", "spot-seeds");
const OUT_DIR = path.join(ROOT, "public", "videos", "spot-clips");

// ---------------------------------------------------------------------------
// Kling API config
// ---------------------------------------------------------------------------
const KLING_BASE = "https://api-singapore.klingai.com";
const KLING_MODEL = "kling-v2-1-master";
const POLL_INTERVAL_MS = 8000;
const POLL_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes max

// ---------------------------------------------------------------------------
// .env.local loader — explicit, no silent fallback
// ---------------------------------------------------------------------------
async function loadEnvLocal(): Promise<void> {
  const envLocalPath = path.join(ROOT, ".env.local");
  try {
    const raw = await fs.readFile(envLocalPath, "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
      if (!m) continue;
      const [, key, valueRaw] = m;
      // .env.local wins for Kling keys
      if (key === "KLING_AI_ACCESS_KEY" || key === "KLING_AI_SECRET_KEY") {
        process.env[key] = valueRaw.replace(/^["']|["']$/g, "");
      } else if (!process.env[key]) {
        process.env[key] = valueRaw.replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    // No .env.local — keys must be in shell environment
  }
}

// ---------------------------------------------------------------------------
// JWT signer (HS256, no external deps)
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
// Clip definitions
// ---------------------------------------------------------------------------
interface ClipSpec {
  id: string;
  label: string;
  seedFile: string;
  prompt: string;
  negativePrompt: string;
  duration: "5" | "10";
  mode: "std" | "pro";
  outputFile: string;
}

const CLIPS: ClipSpec[] = [
  // -------------------------------------------------------------------------
  // H1 — LED reveal (highest accuracy risk, seed-c.jpg, 9:16 vertical)
  // seed-c.jpg dimensions: 768x1376 (≈9:16)
  // mode: "pro" = 1080P, duration: "5"
  // -------------------------------------------------------------------------
  {
    id: "h1",
    label: "H1 — LED reveal inside Tacoma bed",
    seedFile: path.join(SEEDS_DIR, "seed-c.jpg"),
    prompt: `Static camera inside a pickup truck bed looking toward the cab, viewed from the open tailgate. The scene starts dark. Over the first 1.5 seconds, eight discrete rectangular LED puck modules illuminate, each emitting a separate pool of cool-white light onto the textured bed liner — front rail pucks, side-rail pucks, and tailgate-end pucks light up so the entire bed floor is illuminated. After ignition the lights hold steady. No camera movement. The puck modules stay as eight separate fixtures.`,
    negativePrompt: `continuous LED strip, light bar, merging into one strip, amber glow, warm yellow, blue glow, red glow, flicker, camera movement, vehicle movement, people, hands, morphing fixtures, full-size truck bed, gloss`,
    duration: "5",
    mode: "pro",
    outputFile: path.join(OUT_DIR, "clip-h1-led-reveal.mp4"),
  },

  // -------------------------------------------------------------------------
  // H2 — Hero truck dolly (seed-b-attempt-2.jpg, 16:9 landscape)
  // seed-b-attempt-2.jpg dimensions: 1408x768 (16:9)
  // Note: image2video inherits aspect ratio from source image.
  // seed-b is 16:9 (exterior hero shot — correct for this angle).
  // Brief says 9:16 but a 3/4-rear exterior truck shot in 9:16 would
  // severely crop the vehicle body. Generating at 16:9 per source image;
  // document in output. Re-crop to 9:16 in post if IG Reels is the final
  // delivery format (center-crop, use upper 9:16 of frame).
  // mode: "pro" = 1080P, duration: "5"
  // -------------------------------------------------------------------------
  {
    id: "h2",
    label: "H2 — Hero truck dolly (3/4 rear Tacoma, late afternoon)",
    seedFile: path.join(SEEDS_DIR, "seed-b-attempt-2.jpg"),
    prompt: `Extremely slow forward dolly toward the rear three-quarter of a parked Toyota Tacoma Double Cab in a driveway at late afternoon, about 1 foot of apparent camera travel over 5 seconds. The vehicle is parked and does not move. Tail lamps stay off. The matte black hard tri-fold tonneau cover stays flat, rigid, and matte — it is a 3-panel cover and must not flex or change. The Toyota and Tacoma badges stay legible and do not morph. Tire tread stays consistent. Constant daylight.`,
    negativePrompt: `vehicle moving, tail lamp morphing, warped tail lamps, F-150 lamps, lifted suspension, oversized wheels, soft cover flutter, cover flexing, 4-panel cover, gloss paint, chrome, people, morphing badges, fast camera, melted shapes, extra wheels`,
    duration: "5",
    mode: "pro",
    outputFile: path.join(OUT_DIR, "clip-h2-truck-dolly.mp4"),
  },
];

// ---------------------------------------------------------------------------
// Kling API helpers
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

async function submitTask(
  jwt: string,
  spec: ClipSpec,
  imageBase64: string,
  dryRun: boolean
): Promise<string> {
  // Kling API accepts raw base64 string (no data URI prefix)
  const imageData = imageBase64;

  const body = {
    model_name: KLING_MODEL,
    image: imageData,
    prompt: spec.prompt,
    negative_prompt: spec.negativePrompt,
    duration: spec.duration,
    mode: spec.mode,
    sound: "off",
  };

  if (dryRun) {
    console.log(`[kling] DRY RUN — would POST to ${KLING_BASE}/v1/videos/image2video`);
    console.log(`[kling] model_name: ${KLING_MODEL}`);
    console.log(`[kling] image: data:image/jpeg;base64,<${imageBase64.length} chars>`);
    console.log(`[kling] prompt (first 120 chars): ${spec.prompt.slice(0, 120)}`);
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
    throw new Error(`Kling submit: no task_id in response: ${JSON.stringify(data).slice(0, 400)}`);
  }

  return data.data.task_id;
}

async function pollTask(
  jwt: string,
  taskId: string,
  label: string
): Promise<KlingTask> {
  const start = Date.now();
  let dots = 0;

  while (Date.now() - start < POLL_TIMEOUT_MS) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

    // Refresh JWT if we're past 1700s (28 min) — our initial expiry is 30 min
    // For a 15-min max poll this won't be needed, but defensive is correct.
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
    process.stdout.write(`\r[kling] ${label} — ${task.task_status} (${elapsed}s) ${"·".repeat(dots % 5 + 1)}   `);

    if (task.task_status === "succeed") {
      console.log(); // newline after progress dots
      return task;
    }
    if (task.task_status === "failed") {
      console.log();
      throw new Error(
        `Kling task failed: ${task.task_status_msg ?? "no message"}`
      );
    }
  }

  throw new Error(`Kling poll timeout after ${POLL_TIMEOUT_MS / 60000} minutes`);
}

async function downloadVideo(url: string, outputPath: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Download HTTP ${res.status} from ${url}`);
  }
  const buf = await res.arrayBuffer();
  await fs.writeFile(outputPath, Buffer.from(buf));
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main(): Promise<number> {
  await loadEnvLocal();

  const accessKey = process.env.KLING_AI_ACCESS_KEY;
  const secretKey = process.env.KLING_AI_SECRET_KEY;

  if (!accessKey || !secretKey) {
    console.error(
      "FATAL: KLING_AI_ACCESS_KEY and/or KLING_AI_SECRET_KEY not set.\n" +
        `Looked in: ${path.join(ROOT, ".env.local")} and shell environment.\n` +
        "Add both keys to this repo's .env.local and retry."
    );
    return 1;
  }

  const dryRun = process.argv.includes("--dry-run");
  const onlyArg = process.argv.find((a) => a.startsWith("--only="));
  const onlyId = onlyArg?.slice("--only=".length).toLowerCase();

  const queue = onlyId
    ? CLIPS.filter((c) => c.id === onlyId)
    : CLIPS;

  if (queue.length === 0) {
    console.error(
      `No clip matched --only=${onlyId}. Valid IDs: ${CLIPS.map((c) => c.id).join(", ")}`
    );
    return 1;
  }

  await fs.mkdir(OUT_DIR, { recursive: true });

  console.log(`[kling] Model: ${KLING_MODEL}`);
  console.log(`[kling] Base URL: ${KLING_BASE}`);
  console.log(`[kling] Endpoint: POST /v1/videos/image2video`);
  console.log(`[kling] Generating ${queue.length} clip(s)…`);
  if (dryRun) console.log("[kling] DRY RUN MODE — no API calls will be submitted\n");
  console.log();

  let failed = 0;
  for (const spec of queue) {
    console.log(`[kling] → ${spec.id.toUpperCase()}: ${spec.label}`);
    console.log(`[kling]   seed: ${spec.seedFile}`);
    console.log(`[kling]   output: ${spec.outputFile}`);

    try {
      // Read seed image
      const imageBuffer = await fs.readFile(spec.seedFile);
      const imageBase64 = imageBuffer.toString("base64");
      console.log(`[kling]   seed size: ${(imageBuffer.length / 1024).toFixed(0)} KB`);

      // Sign fresh JWT for each clip (tokens expire in 30 min; a fresh one per task is safer)
      const jwt = signJwt(accessKey, secretKey);
      console.log(`[kling]   JWT signed (iss=<ACCESS_KEY_REDACTED>, exp=now+1800)`);

      // Submit
      const taskId = await submitTask(jwt, spec, imageBase64, dryRun);
      console.log(`[kling]   task_id: ${taskId}`);

      if (dryRun) {
        console.log(`[kling]   DRY RUN — skipping poll + download\n`);
        continue;
      }

      // Poll
      const task = await pollTask(jwt, taskId, spec.id.toUpperCase());

      // Get video URL
      const videoUrl = task.task_result?.videos?.[0]?.url;
      if (!videoUrl) {
        throw new Error("Task succeeded but no video URL in result");
      }
      console.log(`[kling]   video URL: ${videoUrl.slice(0, 80)}…`);

      // Download
      console.log(`[kling]   downloading…`);
      await downloadVideo(videoUrl, spec.outputFile);
      const stat = await fs.stat(spec.outputFile);
      console.log(`[kling]   DONE: ${spec.outputFile} (${(stat.size / 1024 / 1024).toFixed(2)} MB)\n`);
    } catch (err) {
      console.error(
        `[kling]   FAILED: ${err instanceof Error ? err.message : String(err)}\n`
      );
      failed++;
    }
  }

  console.log(
    `[kling] Done. ${queue.length - failed} succeeded, ${failed} failed.`
  );
  return failed > 0 ? 1 : 0;
}

main().then((code) => process.exit(code));
