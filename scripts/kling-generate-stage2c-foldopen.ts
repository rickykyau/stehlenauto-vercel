#!/usr/bin/env -S node --experimental-strip-types
/**
 * STAGE 2c — Beat 3.5: Fold-Open / Bed Access clip
 *
 * Director: Carter Voss
 *
 * Brief:
 *   Generate clip-cover-f-foldopen.mp4 from seed-f-foldopen-attempt-2.jpg.
 *   The seed shows the 3rd-gen Tacoma Double Cab with the hard tri-fold cover
 *   already stacked at the forward end of the open bed.
 *   Motion: slow, near-static push-in toward the open bed — camera moves
 *   approximately 2 feet forward over 5 seconds toward the open tailgate.
 *   This communicates "bed is open and accessible" without any folding animation.
 *
 * Usage:
 *   node scripts/kling-generate-stage2c-foldopen.ts
 *   node scripts/kling-generate-stage2c-foldopen.ts --dry-run
 *
 * Output:
 *   public/videos/spot-clips/clip-cover-f-foldopen.mp4
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { createHmac } from "node:crypto";

const ROOT = process.cwd();
const SEEDS_DIR = path.join(ROOT, "public", "images", "spot-seeds");
const OUT_DIR = path.join(ROOT, "public", "videos", "spot-clips");

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
    // No .env.local — keys must be in shell environment
  }
}

// ---------------------------------------------------------------------------
// JWT signer
// ---------------------------------------------------------------------------
function base64UrlEncode(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function signJwt(accessKey: string, secretKey: string): string {
  const nowSec = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const payload = base64UrlEncode(
    Buffer.from(JSON.stringify({ iss: accessKey, exp: nowSec + 1800, nbf: nowSec - 5 })),
  );
  const signingInput = `${header}.${payload}`;
  const sig = createHmac("sha256", secretKey).update(signingInput).digest();
  return `${signingInput}.${base64UrlEncode(sig)}`;
}

// ---------------------------------------------------------------------------
// Clip spec
// ---------------------------------------------------------------------------
const CLIP = {
  id: "cover-f-foldopen",
  label: "Fold-open / bed access — slow push-in toward open bed, static cover stack",
  seedFile: path.join(SEEDS_DIR, "seed-f-foldopen-attempt-2.jpg"),
  prompt: `
The camera performs a very slow forward push-in toward the open tailgate of a silver Toyota Tacoma Double Cab. Camera starts at approximately 10 feet behind the truck at bumper height (18 inches off the ground) and moves forward roughly 2 feet over 5 seconds — a barely perceptible creep. Camera angle is the driver-side rear 3/4 angle, low.

The truck bed is fully open. The tailgate is down. The hard tri-fold tonneau cover panels are folded and stacked flat in a compact 3-panel stack at the forward end of the bed, against the cab wall. The cover stack is rigid and does not move. The panels remain flat and static in their stacked position throughout the entire clip. The aluminum side rails are empty and visible running the length of both bed walls.

The bed interior is fully open and accessible from the tailgate to the stacked panels. The dark charcoal textured bed liner floor is visible. Late afternoon golden sunlight rakes across the open bed from the right side, lighting the bed floor and the interior bed walls. The truck tail lamps are off.

The 3-panel cover stack at the front of the bed catches warm afternoon light on its top face. Stack is compact, clean, organized. It does not move, flex, unfold, or shift during the clip.

Slow, smooth forward dolly motion only. Camera stays at low angle throughout. No tilt, no pan, no rotation. The motion gives the viewer a sense of "approaching the open bed to look inside."
  `.trim(),
  negativePrompt: `
cover folding, panels in motion, panel hinge animating, panels at 45 degree angle, panels mid-fold, cover partially open from closed, panels swinging open, animated fold, panels flexing, soft tonneau cover, rolling cover, cover closed on bed, people, hands, feet, pedestrians, lifted suspension, oversized wheels, mud tires, chrome accents, F-150, Tundra, Silverado, Ram, 2024 4th gen Tacoma, glossy panels, LED strip, AI glow, showroom, fast camera move, zoom, dramatic sweep, wide pan, daytime studio, desert, mountains, off-road, country setting, watermark, text labels, extra fingers, melted shapes, morphing badges, floating objects, jittery motion, mismatched shadows
  `.trim(),
  duration: "5" as const,
  mode: "pro" as const,
  outputFile: path.join(OUT_DIR, "clip-cover-f-foldopen.mp4"),
};

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
  imageBase64: string,
  dryRun: boolean,
): Promise<string> {
  const body = {
    model_name: KLING_MODEL,
    image: imageBase64,
    prompt: CLIP.prompt,
    negative_prompt: CLIP.negativePrompt,
    duration: CLIP.duration,
    mode: CLIP.mode,
    sound: "off",
  };

  if (dryRun) {
    console.log(`[kling] DRY RUN — would POST to ${KLING_BASE}/v1/videos/image2video`);
    console.log(`[kling] model_name: ${KLING_MODEL}`);
    console.log(`[kling] image: base64 <${imageBase64.length} chars>`);
    console.log(`[kling] prompt (first 120 chars): ${CLIP.prompt.slice(0, 120)}`);
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
      `\r[kling] ${CLIP.id.toUpperCase()} — ${task.task_status} (${elapsed}s) ${"·".repeat(dots % 5 + 1)}   `,
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
        `Looked in: ${path.join(ROOT, ".env.local")} and shell environment.`,
    );
    return 1;
  }

  const dryRun = process.argv.includes("--dry-run");

  await fs.mkdir(OUT_DIR, { recursive: true });

  console.log(`[kling] Stage 2c — Beat 3.5: Fold-open / bed access clip`);
  console.log(`[kling] Model: ${KLING_MODEL}`);
  console.log(`[kling] Base URL: ${KLING_BASE}`);
  console.log(`[kling] Seed: ${CLIP.seedFile}`);
  console.log(`[kling] Output: ${CLIP.outputFile}`);
  if (dryRun) console.log("[kling] DRY RUN MODE — no API calls\n");
  console.log();

  try {
    const imageBuffer = await fs.readFile(CLIP.seedFile);
    const imageBase64 = imageBuffer.toString("base64");
    console.log(`[kling] Seed size: ${(imageBuffer.length / 1024).toFixed(0)} KB`);

    const jwt = signJwt(accessKey, secretKey);
    console.log(`[kling] JWT signed (iss=<ACCESS_KEY_REDACTED>, exp=now+1800)`);

    const taskId = await submitTask(jwt, imageBase64, dryRun);
    console.log(`[kling] task_id: ${taskId}`);

    if (dryRun) {
      console.log(`[kling] DRY RUN — skipping poll + download`);
      return 0;
    }

    const task = await pollTask(jwt, taskId);

    const videoUrl = task.task_result?.videos?.[0]?.url;
    if (!videoUrl) {
      throw new Error("Task succeeded but no video URL in result");
    }
    console.log(`[kling] video URL: ${videoUrl.slice(0, 80)}…`);

    console.log(`[kling] Downloading…`);
    await downloadVideo(videoUrl, CLIP.outputFile);
    const stat = await fs.stat(CLIP.outputFile);
    console.log(
      `[kling] DONE: ${CLIP.outputFile} (${(stat.size / 1024 / 1024).toFixed(2)} MB)`,
    );
  } catch (err) {
    console.error(`[kling] FAILED: ${err instanceof Error ? err.message : String(err)}`);
    return 1;
  }

  return 0;
}

main().then((code) => process.exit(code));
