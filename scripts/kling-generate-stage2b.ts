#!/usr/bin/env -S node --experimental-strip-types
/**
 * STAGE 2b — Stehlen Tacoma Tonneau Spot: Cover-Centric Clip Generation
 *
 * Director: Carter Voss
 * Brief: Generate the remaining 3 cover-focused clips from landscape seeds.
 *        These fill beats 2, 3, and 4 in the final assembled spot.
 *
 * Clips to generate:
 *   COVER-A  Cover surface macro — from seed-a.jpg (landscape, 1376x768)
 *   COVER-D  Latch/rail/seal detail — from seed-d.jpg (landscape, 1376x768)
 *   NIGHT-E  Night hero near-static — from seed-e.jpg (landscape, 1376x768)
 *
 * All seeds are 16:9 landscape — no portrait conversion needed.
 *
 * Usage:
 *   node scripts/kling-generate-stage2b.ts                 # generate all 3
 *   node scripts/kling-generate-stage2b.ts --only=cover-a
 *   node scripts/kling-generate-stage2b.ts --only=cover-d
 *   node scripts/kling-generate-stage2b.ts --only=night-e
 *   node scripts/kling-generate-stage2b.ts --dry-run
 *
 * Outputs:
 *   public/videos/spot-clips/clip-cover-a-surface.mp4
 *   public/videos/spot-clips/clip-cover-d-latch.mp4
 *   public/videos/spot-clips/clip-night-e-hero.mp4
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
  // COVER-A — Cover surface macro
  // Seed: seed-a.jpg — 1376x768 landscape, raking tungsten on matte surface
  // Goal: slow lateral creep across the leatherette grain + groove seam.
  // -------------------------------------------------------------------------
  {
    id: "cover-a",
    label: "Cover surface macro — slow lateral creep, leatherette grain",
    seedFile: path.join(SEEDS_DIR, "seed-a.jpg"),
    prompt: `The camera moves in a very slow lateral creep from left to right across the surface of a matte black hard tonneau cover panel. The motion is approximately 2 inches of camera travel over 5 seconds — barely perceptible but continuous. The frame fills entirely with the cover surface — no sky, no vehicle body. In the center of the frame, a raised groove line runs diagonally from lower-left to upper-right. The raking tungsten light comes from the left side at a shallow grazing angle, creating hard shadows in the groove and revealing fine leatherette grain texture on the matte surface. Depth of field is shallow — the groove seam is in sharp focus at center, the right edge softens. On the far left: a sliver of matte aluminum side rail profile where the panel meets the rail, barely entering the frame. No reflection, no gloss. The surface is completely matte — light is absorbed, not bounced. The groove shadows shift very slightly as the camera moves laterally.`,
    negativePrompt: `glossy surface, mirror reflection, chrome, shiny plastic, smooth surface, gloss paint, sparkling, vehicle body, truck body, background, sky, people, hands, LED strip, text, watermark, fast movement, zoom, tilt, vertical pan, jittery motion, blurred focus throughout`,
    duration: "5",
    mode: "pro",
    outputFile: path.join(OUT_DIR, "clip-cover-a-surface.mp4"),
  },

  // -------------------------------------------------------------------------
  // COVER-D — Latch / rail / seal detail
  // Seed: seed-d.jpg — 1376x768 landscape, shows latch hardware + rail + seal
  // Goal: slow tilt up the side rail from rail to latch seam.
  // -------------------------------------------------------------------------
  {
    id: "cover-d",
    label: "Latch and rail detail — slow tilt up side rail to latch and seam",
    seedFile: path.join(SEEDS_DIR, "seed-d.jpg"),
    prompt: `The camera starts aimed at the aluminum side rail running horizontally in the lower portion of the frame and slowly tilts upward over 5 seconds until the latch hardware and panel seam fill the upper half of the frame. Camera tilt is very slow — approximately 15 degrees of total arc over the full 5 seconds. The scene is a close detail shot of a matte black hard tonneau cover on a truck bed. The aluminum rail extrusion is in sharp focus in the first 2 seconds. As the tilt completes, the matte black panel latch mechanism and compressed rubber weather-seal gasket between the cover panel and truck bed rail come into sharp focus. All hardware is matte black. No gloss. The rubber seal is dark gray. Blue-hour ambient cool light from the right side creates subtle specular highlights on the aluminum rail extrusion edges only — the matte cover surface absorbs the light. Panel stays rigid and flat. No movement in the panel itself.`,
    negativePrompt: `chrome hardware, glossy cover panel, mirror surface, gloss latch, shiny, fast motion, pan left, pan right, truck body wide shot, person touching latch, hands, LED strip, daylight, golden hour, harsh sun, soft cover, fabric cover, rolling cover, bending panel, warping panel, wobble, jitter, text, watermark`,
    duration: "5",
    mode: "pro",
    outputFile: path.join(OUT_DIR, "clip-cover-d-latch.mp4"),
  },

  // -------------------------------------------------------------------------
  // NIGHT-E — Night hero near-static
  // Seed: seed-e.jpg — 1376x768 landscape, parking structure blue hour
  // Goal: near-static ~3 degree drift, tail lamps unlit, matte cover.
  // -------------------------------------------------------------------------
  {
    id: "night-e",
    label: "Night hero — parking structure, near-static 3-degree drift, tail lamps off",
    seedFile: path.join(SEEDS_DIR, "seed-e.jpg"),
    prompt: `Nearly static camera with a very slow drift — approximately 3 degrees of leftward rotation over 5 seconds, barely perceptible. The scene shows a Toyota Tacoma Double Cab pickup truck parked in a concrete parking structure at night. Camera is at the driver-side rear corner, low angle, 3/4 rear view. The matte black hard tri-fold tonneau cover is closed flat across the bed — it is rigid and does not move. The cover surface is matte black, absorbing the sodium-vapor key light from above. The truck tail lamps are completely off — dark, unlit housing. No red glow from tail lamps anywhere in the frame. The parking structure has a warm sodium-vapor ceiling lamp above-rear that creates a warm key on the top surface of the cover panels. Blue-hour ambient light from the left (parking structure entrance) creates a cool fill on the tailgate and truck sides. The TACOMA tailgate lettering is barely readable in shadow. The concrete floor reflects a subtle warm pool under the truck. No camera movement other than the very slow 3-degree drift.`,
    negativePrompt: `tail lamps glowing red, lit tail lamps, red glow, brake lights on, running lights, glossy cover, mirror cover, cover flexing, panel moving, soft cover, convertible cover, open tonneau, people, pedestrians, headlights, other cars, fast camera move, big pan, dramatic sweep, zoom, daytime, golden hour, sun, outdoor nature, desert, mountains, lifted suspension, oversized wheels, mud tires, chrome accents, LED strip on cover, text, watermark`,
    duration: "5",
    mode: "pro",
    outputFile: path.join(OUT_DIR, "clip-night-e-hero.mp4"),
  },
];

// ---------------------------------------------------------------------------
// Kling API helpers (same as kling-generate.ts)
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
      console.log();
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

  console.log(`[kling] Stage 2b — Cover-centric clip generation`);
  console.log(`[kling] Model: ${KLING_MODEL}`);
  console.log(`[kling] Base URL: ${KLING_BASE}`);
  console.log(`[kling] Generating ${queue.length} clip(s)…`);
  if (dryRun) console.log("[kling] DRY RUN MODE — no API calls will be submitted\n");
  console.log();

  let failed = 0;
  for (const spec of queue) {
    console.log(`[kling] → ${spec.id.toUpperCase()}: ${spec.label}`);
    console.log(`[kling]   seed: ${spec.seedFile}`);
    console.log(`[kling]   output: ${spec.outputFile}`);

    try {
      const imageBuffer = await fs.readFile(spec.seedFile);
      const imageBase64 = imageBuffer.toString("base64");
      console.log(`[kling]   seed size: ${(imageBuffer.length / 1024).toFixed(0)} KB`);

      const jwt = signJwt(accessKey, secretKey);
      console.log(`[kling]   JWT signed (iss=<ACCESS_KEY_REDACTED>, exp=now+1800)`);

      const taskId = await submitTask(jwt, spec, imageBase64, dryRun);
      console.log(`[kling]   task_id: ${taskId}`);

      if (dryRun) {
        console.log(`[kling]   DRY RUN — skipping poll + download\n`);
        continue;
      }

      const task = await pollTask(jwt, taskId, spec.id.toUpperCase());

      const videoUrl = task.task_result?.videos?.[0]?.url;
      if (!videoUrl) {
        throw new Error("Task succeeded but no video URL in result");
      }
      console.log(`[kling]   video URL: ${videoUrl.slice(0, 80)}…`);

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
