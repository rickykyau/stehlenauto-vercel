#!/usr/bin/env -S node --experimental-strip-types
/**
 * STAGE 2i v7 — Generate new seeds + Kling clips for three owner notes:
 *   NOTE 1: Rain beat — 3 attempts at water-shed concept (approach B).
 *           Pour/sheet water flowing off the closed matte cover. CUT if none pass.
 *   NOTE 2: Moving car — 3 attempts, rear-follow framing (wheels occluded by body).
 *           Check motion frames t0/t1.5/t3 before committing as hero.
 *   NOTE 3: Real music handled in build script (Industrial Cinematic, CC-BY 3.0).
 *
 * Director: Carter Voss
 * Model: kling-v2-1-master, image2video, mode pro
 * Gemini model: gemini-2.5-flash-image (NOT 2.0-preview, that 404s)
 *
 * Run:
 *   node scripts/gen-v7-seeds-and-clips.ts
 *   node scripts/gen-v7-seeds-and-clips.ts --dry-run      # validate config only
 *   node scripts/gen-v7-seeds-and-clips.ts --only=rain    # just rain attempts
 *   node scripts/gen-v7-seeds-and-clips.ts --only=car     # just moving car attempts
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
const CLIPS_DIR = path.join(ROOT, "public", "videos", "spot-clips");

// ---------------------------------------------------------------------------
// Kling API config
// ---------------------------------------------------------------------------
const KLING_BASE = "https://api-singapore.klingai.com";
const KLING_MODEL = "kling-v2-1-master";
const POLL_INTERVAL_MS = 10000;
const POLL_TIMEOUT_MS = 18 * 60 * 1000; // 18 min — pro mode is slow

// ---------------------------------------------------------------------------
// Gemini config
// ---------------------------------------------------------------------------
const GEMINI_MODEL = "gemini-2.5-flash-image";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

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
      if (
        key === "KLING_AI_ACCESS_KEY" ||
        key === "KLING_AI_SECRET_KEY" ||
        key === "GEMINI_API_KEY"
      ) {
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
  const sigInput = `${header}.${payload}`;
  const sig = createHmac("sha256", secretKey).update(sigInput).digest();
  return `${sigInput}.${base64UrlEncode(sig)}`;
}

// ---------------------------------------------------------------------------
// Gemini image generation
// ---------------------------------------------------------------------------
async function generateSeedImage(
  apiKey: string,
  prompt: string,
  negativePrompt: string,
  refImages: { mimeType: string; data: string; instruction: string }[],
  outPath: string,
  label: string,
): Promise<void> {
  console.log(`\n[Gemini] Generating seed: ${label}`);

  type GeminiPart =
    | { text: string }
    | { inlineData: { mimeType: string; data: string } };

  const parts: GeminiPart[] = [];

  for (const ref of refImages) {
    parts.push({ text: ref.instruction });
    parts.push({ inlineData: { mimeType: ref.mimeType, data: ref.data } });
  }

  parts.push({
    text: `${prompt}\n\nNEGATIVE (do NOT include any of these):\n${negativePrompt}\n\nGenerate the photograph now. Output a single photorealistic image. No text overlays, no watermarks.`,
  });

  const body = {
    contents: [{ parts }],
    generationConfig: { responseModalities: ["IMAGE"] },
  };

  const res = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API ${res.status}: ${errText.slice(0, 600)}`);
  }

  type Resp = {
    candidates?: {
      content?: {
        parts?: { inlineData?: { mimeType: string; data: string } }[];
      };
    }[];
  };
  const data = (await res.json()) as Resp;
  const imgPart = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
  if (!imgPart?.inlineData) {
    throw new Error("Gemini returned no image in response");
  }

  const ext = imgPart.inlineData.mimeType.includes("png") ? "png" : "jpg";
  const finalPath = outPath.replace(/\.(jpg|png)$/, `.${ext}`);
  await fs.writeFile(finalPath, Buffer.from(imgPart.inlineData.data, "base64"));
  console.log(`[Gemini] Saved: ${finalPath}`);
}

// ---------------------------------------------------------------------------
// Kling image-to-video
// ---------------------------------------------------------------------------
interface KlingTask {
  task_id: string;
  task_status: "submitted" | "processing" | "succeed" | "failed";
  task_status_msg?: string;
  task_result?: {
    videos?: { id: string; url: string; duration: string }[];
  };
}

async function submitKlingTask(
  jwt: string,
  imageBase64: string,
  prompt: string,
  negativePrompt: string,
  duration: "5" | "10",
  mode: "std" | "pro",
  label: string,
  dryRun: boolean,
): Promise<string> {
  const body = {
    model_name: KLING_MODEL,
    image: imageBase64,
    prompt,
    negative_prompt: negativePrompt,
    duration,
    mode,
    sound: "off",
  };

  if (dryRun) {
    console.log(`[Kling] DRY RUN — ${label}: would POST image2video`);
    console.log(`[Kling]   prompt (200 chars): ${prompt.slice(0, 200)}`);
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
  if (!res.ok) throw new Error(`Kling submit HTTP ${res.status}: ${text.slice(0, 800)}`);

  type SubmitResp = { code: number; message: string; data?: KlingTask };
  const data = JSON.parse(text) as SubmitResp;
  if (data.code !== 0) throw new Error(`Kling submit code ${data.code}: ${data.message}`);
  if (!data.data?.task_id) throw new Error(`Kling submit: no task_id`);

  return data.data.task_id;
}

async function pollKlingTask(jwt: string, taskId: string, label: string): Promise<KlingTask> {
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
    if (!res.ok) throw new Error(`Kling poll HTTP ${res.status}: ${text.slice(0, 400)}`);

    type PollResp = { code: number; message: string; data?: KlingTask };
    const data = JSON.parse(text) as PollResp;
    if (data.code !== 0) throw new Error(`Kling poll code ${data.code}: ${data.message}`);

    const task = data.data;
    if (!task) throw new Error("Kling poll: no data in response");

    dots++;
    const elapsed = Math.round((Date.now() - start) / 1000);
    process.stdout.write(
      `\r[Kling] ${label} — ${task.task_status} (${elapsed}s) ${"·".repeat(dots % 5 + 1)}   `
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
  if (!res.ok) throw new Error(`Download HTTP ${res.status}`);
  const buf = await res.arrayBuffer();
  await fs.writeFile(outputPath, Buffer.from(buf));
}

// ---------------------------------------------------------------------------
// NOTE 1 — RAIN seeds (3 attempts, water-shed concept — approach B)
// ---------------------------------------------------------------------------
// Approach B: water sheeting across the CLOSED matte cover and running off the
// side rail. This reads far more real than static beads because:
//   (a) the motion physics of sheeting water are harder for Kling to fake than
//       static drops
//   (b) the varied-speed flow and edge-drip is a different AI failure mode
//       than the symmetric-bead tell
//   (c) it PROVES the product function ("water sheds") better than beads do.
//
// Seed strategy: varied water density + pour angle in each seed so attempts
// don't all fail the same way.
// ---------------------------------------------------------------------------

const RAIN_SHED_PROMPT_BASE = `
PRODUCT ACCURACY — TONNEAU COVER SURFACE (READ FIRST):
The surface is a matte black hard tri-fold tonneau cover panel. The finish is a fine leatherette/granular matte texture — NOT glossy, NOT smooth plastic, NOT mirror-like. The groove lines are 4 parallel raised ridges running across the panel width. The aluminum side rail runs along the long edge of the panel — it is a narrow matte black extrusion with a slightly rounded top edge.

COVER BRIEF — WHAT YOU ARE PHOTOGRAPHING IS ACCURATE (details matter):
- Matte black granular surface — like fine-grained leather
- Raised groove ridges cast short hard shadows
- Side rail aluminum extrusion at the lower-right edge of frame
- Rubber weather seal where panel meets rail
`.trim();

const RAIN_NEGATIVE = [
  "perfectly round uniform droplets",
  "identical-sized beads",
  "symmetrical bead spacing",
  "CGI bubbles",
  "plastic sheen",
  "glossy cover surface",
  "mirror reflection",
  "chrome",
  "showroom background",
  "daylight outdoor scene",
  "people",
  "hands",
  "watermark",
  "continuous LED strip",
  "lifted truck",
  "illustration",
  "AI glow",
  "static frozen water",
  "dry surface",
].join(", ");

// Three seed prompts with varied water behavior
const rainSeeds = [
  {
    attempt: 1,
    label: "Rain seed 1 — angled pour, heavy sheet, running to rail",
    prompt: `
${RAIN_SHED_PROMPT_BASE}

SCENE — WATER SHED TEST:
You are photographing a water shed test. Someone has poured a cup of water onto a closed matte black tonneau cover from above. The water is mid-flow: a thin sheet of water moves across the matte leatherette surface from upper-left to lower-right, flowing toward the aluminum side rail at the lower edge.

WATER BEHAVIOR (physically accurate — this is NOT CGI):
The water forms a thin irregular sheet on the matte surface — NOT a perfect uniform film. The surface texture breaks the water into irregular rivulets and micro-channels. At the leading edge of the flow, the water has fragmented into uneven tendrils following the surface microtexture. One or two slightly thicker rivulets run along the groove ridges. At the right edge where the panel meets the aluminum rail, a thin stream runs off the edge and falls as a few disconnected drips. There are a few residual splash marks — tiny irregular blotches where drops landed moments ago. The water beads in 2-3 places at the edges where it paused — but these are IRREGULAR drops of varied sizes (1mm to 8mm), NOT uniform spheres, with contact-angle flattening showing the hydrophobic surface (the drop is wider than tall, with a visible contact shadow).

LIGHTING:
A single overhead work light — slightly warm tungsten, 45 degrees from above. The moving water sheet catches the light as a dull specular band (NOT a mirror reflection — this is a MATTE surface). The water refracts slightly where it pools in the groove shadows.

CAMERA:
Low grazing angle, 60mm macro equivalent, shallow depth of field. Center focus on the flowing water sheet and the most prominent irregular rivulet. Slight camera tilt — the panel edge is not perfectly horizontal in frame.

MOOD: Real product test photo. Functional, documentary feel. Not stylized. Water behavior must be physically convincing.

OUTPUT: Single 16:9 landscape photograph. Photorealistic. No text. No logos. No background — just the cover surface with the water flowing across it.
    `.trim(),
  },
  {
    attempt: 2,
    label: "Rain seed 2 — slower drain, multiple rivulets, detail on seam",
    prompt: `
${RAIN_SHED_PROMPT_BASE}

SCENE — WATER RUNNING OFF COVER SEAM:
The tonneau cover has been rained on. The shot is macro close-up at the intersection of a panel seam and the side rail. Water is in the process of draining.

WATER BEHAVIOR (physically accurate):
On the cover panel surface, water has formed multiple thin irregular rivulets — winding paths of water flowing slowly toward the seam. These rivulets are thin (1-3mm wide), irregular in width, and follow the path of least resistance along the surface microtexture. They are NOT perfectly straight lines. At the rubber weather seal seam between two panels, the water pools slightly then crosses and continues down. At the aluminum side rail, the water reaches the edge and forms a slow drip — the water is just at the point of falling, stretched into a thin vertical droplet at the rail edge. On the rest of the surface there are residual scattered drops of varied sizes — flat-contact-angle hydrophobic beads: small flat ovals (2-5mm), larger irregular puddles (8-15mm) that caught in the grooves, and areas of near-dry surface with just a fine water film. None of the drops are identical. Some are elongated in the flow direction.

LIGHTING:
Cool overcast light from directly above. The flat diffuse light reveals the water's presence through texture and slight sheen rather than highlights. The aluminum rail has a dull metallic sheen at the drip point. The wet surface areas are slightly darker than the dry areas of matte cover.

CAMERA:
High-angle macro, 90mm equivalent, looking straight down at approximately 70 degrees from horizontal. Frame is mostly cover surface with the seam and rail edge running diagonally through lower third.

MOOD: Post-rain surface study. Honest, material-focused, NOT advertising pretty. The cover shed the water.

OUTPUT: Single 16:9 landscape photograph. Photorealistic. No text. No logos.
    `.trim(),
  },
  {
    attempt: 3,
    label: "Rain seed 3 — active rain hitting surface, streaks and drips at rail",
    prompt: `
${RAIN_SHED_PROMPT_BASE}

SCENE — ACTIVE RAIN, WATER STREAMING OFF RAIL:
The truck is parked outside in light rain. The tonneau cover is CLOSED. This is a close-up shot of the cover surface mid-rain.

WATER BEHAVIOR (physically accurate):
Light rain is actively hitting the matte black cover surface. The surface shows:
1. Several small fresh drops that just landed — irregular splash rings with broken edges, NOT perfect circles. Some have rebounded into tiny secondary micro-drops.
2. A thin sheen of water on the surface — the matte texture shows through but the surface is wet and slightly darker.
3. Two or three STREAKS — elongated thin trails of water flowing toward the rail edge, left by drops that have already moved. These streaks have the typical appearance of water flowing on a slightly-angled hydrophobic surface: they start narrow and widen as more water joins them.
4. At the aluminum side rail edge: water is actively running off — a continuous thin stream that breaks into 3-4 individual drips. One drip is at full extension (largest), others are shorter. This is the MONEY SHOT of this seed — the stream-to-drip transition proves the cover sheds water.

LIGHTING:
Diffuse overcast day light. No direct sun. The aluminum rail has a dull wet sheen. The wet cover surface is darker than when dry. The drips at the edge are backlit slightly by the overcast sky behind them, giving them slight edge translucency.

CAMERA:
Low-angle macro, approximately 15 degrees above the cover surface, looking across the surface toward the rail. Camera is approximately 30cm from the rail edge. 85mm equivalent, shallow DOF. The rail and drip-off point are in sharp focus. The cover surface texture recedes softly into bokeh behind.

MOOD: Functional proof-shot. Water is going OVER the cover and off the side. Matte black cover surface is clearly showing real water behavior — the product works.

OUTPUT: Single 16:9 landscape photograph. Photorealistic. No text. No logos.
    `.trim(),
  },
];

// ---------------------------------------------------------------------------
// NOTE 2 — MOVING CAR seeds (3 attempts, rear-follow / occluded wheels)
// ---------------------------------------------------------------------------
// Framing: rear-follow shot. Camera is BEHIND and above the Tacoma, looking
// forward as it drives away. This framing keeps:
//   - Wheels behind/under the body (mostly occluded)
//   - Motion conveyed by: receding road, background blur, slight camera sway
//   - Cover clearly visible on top of bed throughout
//
// Three variants: straight road, gentle turn (shows side more), close follow.
// ---------------------------------------------------------------------------

const TACOMA_BODY_BRIEF = `
VEHICLE ACCURACY:
The truck is a 2016-2023 Toyota Tacoma 3rd generation Double Cab, short 5-foot bed.
Stock ride height — NOT lifted. Factory alloy wheels (mostly hidden in this framing).
Color: Cement Gray — low-saturation flat warm gray. NOT silver metallic. NOT bright.
Tonneau cover: closed matte black tri-fold hard cover on the bed. Flat, groove lines visible.
The TACOMA badge is on the tailgate in raised letters. Toyota oval badge visible.
3rd-gen boomerang-C tail lamps — compact angular cluster, NOT a rectangle bar.
`.trim();

const MOVING_CAR_NEGATIVE = [
  "tire warp",
  "tire morphing",
  "distorted wheel",
  "spinning wheel",
  "visible wheel rotation artifacts",
  "body morph",
  "melted body panels",
  "floaty motion",
  "slidey ease curves",
  "lifted suspension",
  "oversized wheels",
  "mud tires",
  "F-150",
  "Silverado",
  "Tundra",
  "Ram",
  "chrome accents",
  "glossy cover",
  "people visible",
  "faces",
  "country setting",
  "off-road trail",
  "illustration",
  "watermark",
  "text overlay",
].join(", ");

const movingCarSeeds = [
  {
    attempt: 1,
    label: "Moving car seed 1 — rear-follow, straight road, close camera",
    prompt: `
${TACOMA_BODY_BRIEF}

SCENE — REAR-FOLLOW DRIVING SHOT:
A 2016-2023 Toyota Tacoma Double Cab in Cement Gray is driving away from the camera on a clean 2-lane road. The camera is positioned at about 15 feet behind the truck, mounted low at tailgate height (approximately 3.5 feet off the ground), following the truck as it drives straight away.

WHAT IS IN FRAME:
The full rear of the Tacoma fills most of the center of the frame: tailgate with TACOMA lettering, tail lamps (unlit, daylight), the rear bumper, and most importantly the CLOSED matte black tonneau cover visible above the bed rails — the cover surface stretches from the tailgate toward the cab. The cover's groove lines are visible running parallel across it.

THE WHEELS ARE MOSTLY HIDDEN: The rear wheels are behind the truck body and only the very bottom edge of the tires and wheel faces are visible below the bumper — they are partially occluded by the body. This is intentional. DO NOT show the full wheel. The partial occlusion prevents motion artifacts.

ROAD AND MOTION:
The road ahead of the truck extends in a straight line. The road surface shows movement — a white dashed centerline passes quickly. The background (trees, generic suburban/semi-rural road edge) is in motion blur — slight horizontal and vertical motion blur on background elements indicates speed. The truck is moving at approximately 35 mph. The camera has a very slight sway motion (subtle, 1-2 degrees) suggesting a chase vehicle following.

LIGHTING:
Mid-morning, sun from camera-left (driver side) at about 30 degrees above horizon. The cover surface catches warm light, the groove lines are visible. The tail lamps are unlit. Natural shadows under the bumper.

MOOD: Premium following shot. Functional, forward-motion energy. Clean road environment — NOT a racetrack, NOT off-road. Think weekend errand run, urban-adjacent suburban road.

OUTPUT: Single 16:9 landscape photograph. Photorealistic. Motion blur on background and road markings. No text. No logos except factory badges.
    `.trim(),
  },
  {
    attempt: 2,
    label: "Moving car seed 2 — rear-follow, gentle right curve, cover dominant",
    prompt: `
${TACOMA_BODY_BRIEF}

SCENE — REAR-FOLLOW, GENTLE CURVE:
A 2016-2023 Toyota Tacoma Double Cab in Cement Gray is driving away from the camera on a smooth asphalt road that curves gently to the right. The camera follows from behind at about 20 feet, slightly to the left of center, at bumper height (3 feet off the ground).

FRAMING AND KEY ELEMENTS:
The camera is positioned slightly to the LEFT of the truck's centerline, so the driver side of the truck is more visible. Because of the gentle right curve, the driver side of the truck — including the driver-side tonneau panel, the driver-side tail lamp, and the bed side — is slightly visible in a three-quarter rear angle. This is the KEY advantage of this seed: you see more of the cover surface (driver panel + top panels), not just the dead-center rear.

COVER: The matte black tonneau cover is clearly visible running the length of the bed from the tailgate to the cab. Three panels of the tri-fold cover are visible. The groove lines catch the daylight.

WHEELS: The wheels are almost entirely hidden. The rear wheel faces are behind the body. Only the very bottom of the tires shows below the bumper. DO NOT show full wheels.

ROAD / MOTION:
The road ahead curves to the right. Road surface motion blur on the lane markings and edge line. Background trees on the right side are in motion blur. The environment is a clean two-lane road with a grassy shoulder — suburban-to-rural transition, clean and uncluttered.

LIGHTING:
Late morning, overcast but bright — soft diffuse light with no harsh shadows. The Cement Gray paint looks clean and uniform. The matte cover surface shows its texture in the flat light.

MOOD: Effortless driving. Quality product in motion. Clean, not aggressive. Premium-not-bro.

OUTPUT: Single 16:9 landscape photograph. Photorealistic. Background motion blur indicates truck is moving at ~30 mph. No text. No logos except factory badges.
    `.trim(),
  },
  {
    attempt: 3,
    label: "Moving car seed 3 — cover-foreground locked, world moving behind",
    prompt: `
${TACOMA_BODY_BRIEF}

SCENE — COVER-LOCKED TRACKING SHOT:
This is a locked-camera tracking shot: the camera appears to be mounted ON THE TRUCK, looking rearward-ish from just above the cover surface. The tonneau cover FILLS the lower half of the frame and is SHARP AND STATIONARY while the WORLD BEHIND the truck is in motion.

WHAT IS IN FRAME:
FOREGROUND (sharp): The rear two-thirds of the matte black tonneau cover surface — the grove lines across it, the side rails on left and right, the cover panel seams. The tonneau cover is in perfect sharp focus. The tailgate edge with TACOMA lettering is just visible at the bottom of the frame.

BACKGROUND (in motion blur): The road that the truck has just driven past — receding behind the truck. Lane markings as white streaks. The background (trees, buildings, roadside — generic suburban or industrial-light) are HEAVILY motion-blurred horizontally, indicating the truck is moving at 40+ mph. The sky is visible at the top of the frame, slightly motion-blurred in the peripheral areas.

NO WHEELS VISIBLE: The camera angle (camera on the cover, looking behind) means no wheels are in frame at all. This is the safest approach for avoiding tire-warp artifacts.

LIGHTING:
Mid-afternoon sun from above-right, warm but not golden. The cover catches it cleanly. The tail lamps are at the bottom of frame — unlit.

MOOD: Sense of speed and purpose. The cover is stationary and solid while the world moves behind it. Conveys "this truck goes places." Premium brand energy.

OUTPUT: Single 16:9 landscape photograph. Photorealistic. Strong horizontal motion blur in background. Cover surface is sharp and detailed. No text. No logos except TACOMA tailgate lettering and Toyota badge.
    `.trim(),
  },
];

// ---------------------------------------------------------------------------
// Kling prompts for rain clips (seed-first)
// ---------------------------------------------------------------------------
const rainKlingPrompt = [
  "Extreme close-up macro of a matte black hard tonneau cover panel surface.",
  "Water is actively sheeting across the cover from upper left, flowing across the matte leatherette-textured surface toward the aluminum side rail at the lower right edge.",
  "The water forms irregular rivulets and thin channels on the surface — NOT uniform beads.",
  "The rivulets follow the microtexture of the surface, forming uneven winding paths.",
  "At the rail edge, a thin continuous stream runs off and falls as slow separate drips.",
  "Any beads present are IRREGULAR — varying sizes from 2mm to 12mm, flattened contact angle (wider than tall), non-uniform spacing.",
  "Some beads are elongated in the flow direction.",
  "The matte surface is darker where wet.",
  "Single overhead tungsten key light raking across the surface at a shallow angle, revealing the grain texture.",
  "Camera is at low grazing angle, 70mm macro, shallow DOF.",
  "Motion is slow and deliberate — water flowing at natural gravity-speed, not sped up.",
  "The shot is 5 seconds: water flows from t=0 through t=3, then a slow drip continues at the rail edge for the last 2 seconds.",
  "No hands. No truck cab visible. Only cover surface and water.",
].join(" ");

const rainKlingNegative = [
  "uniform round droplets",
  "identical spherical beads",
  "perfectly spaced drops",
  "CGI water bubbles",
  "computer-generated look",
  "glossy cover surface",
  "mirror reflection",
  "fast moving water",
  "waterfall",
  "fast splash",
  "dry surface",
  "no water visible",
  "people",
  "hands",
  "LED strip",
  "chrome",
  "bright studio background",
  "illustration",
  "watermark",
  "smeared motion",
].join(", ");

// ---------------------------------------------------------------------------
// Kling prompts for moving car clips
// ---------------------------------------------------------------------------

// Attempt 1: tight rear-follow, straight road
const movingCarKlingPrompt1 = [
  "Rear-follow tracking shot of a 2016-2023 Toyota Tacoma Double Cab in Cement Gray driving straight away from the camera on a clean two-lane road.",
  "Camera is at tailgate height, 15 feet behind the truck.",
  "The tonneau cover — closed matte black tri-fold — is clearly visible on top of the bed, groove lines showing.",
  "TACOMA badge visible on tailgate. Boomerang-C tail lamps. Toyota oval badge.",
  "Rear wheels are mostly occluded behind the bumper and body panels — only the bottom of the tires visible below the bumper.",
  "The road behind the truck has white dashed centerline markings streaming past.",
  "Background trees and road edge are in soft motion blur from the truck's 35 mph speed.",
  "Camera has a very subtle sway: 1 degree of natural camera-mount vibration.",
  "Lighting: mid-morning, warm sun from driver side, clean shadows.",
  "Motion feels physical and weighted — like a real chase vehicle follow.",
  "3 seconds duration. Truck moves steadily forward, no abrupt acceleration.",
].join(" ");

const movingCarKlingNegative1 = [
  "visible spinning wheel rotation artifacts",
  "tire warping",
  "tire morphing",
  "body panel distortion",
  "floaty AI motion curves",
  "smooth ease-in-ease-out sliding",
  "lifted suspension",
  "oversized wheels",
  "mud tires",
  "people visible",
  "faces",
  "hands",
  "F-150",
  "Silverado",
  "illustration",
  "watermark",
  "speed lines",
  "neon",
  "dramatic smoke",
  "glowing tyres",
].join(", ");

// Attempt 2: gentle curve, driver side more visible
const movingCarKlingPrompt2 = [
  "Rear-follow tracking shot of a 2016-2023 Toyota Tacoma Double Cab in Cement Gray driving away on a road that curves gently to the right.",
  "Camera positioned 20 feet behind and slightly to the left, at bumper height.",
  "The driver side of the truck is partially visible — driver-side tonneau panel, driver-side tail lamp, bed side rail.",
  "Matte black tri-fold tonneau cover is prominent on top of the bed.",
  "Rear wheels are behind the body and mostly hidden — only tire bottom visible below bumper.",
  "Road curves gently. Motion blur on lane markings. Background trees blurred by movement.",
  "Lighting: soft overcast morning. Even diffuse light on the Cement Gray paint and cover.",
  "Camera slight sway, physical weight to the motion.",
  "3 seconds. Smooth forward travel at 30 mph.",
].join(" ");

// Attempt 3: cover-locked world-moving (safest for anti-tell)
const movingCarKlingPrompt3 = [
  "Camera mounted on the truck bed, looking rearward at approximately 20 degrees downward. The matte black tonneau cover surface fills the lower-center of the frame and is SHARP AND STATIONARY.",
  "The cover panels, groove lines, and side rails are in perfect sharp focus.",
  "TACOMA tailgate lettering visible at the very bottom of the frame.",
  "Behind and above the truck: the road is receding rapidly — lane markings appear as white streaks rushing toward the camera, indicating 40 mph forward motion.",
  "Background (trees, road edge) is heavily motion-blurred horizontally.",
  "Sky at top of frame, slightly motion blurred at edges.",
  "NO wheels in frame at any point — the camera angle prevents any wheel visibility.",
  "Lighting: mid-afternoon, direct sun from above-right, clean light on cover surface.",
  "3 seconds. The cover stays stationary while the world moves behind it.",
  "Physical motion weight — streaking road lines have natural speed consistency.",
].join(" ");

const movingCarKlingNegative3 = [
  "wheels in frame",
  "tire visible",
  "people",
  "faces",
  "chrome",
  "glossy cover",
  "floaty motion",
  "AI ease curves",
  "illustration",
  "watermark",
  "body morph",
].join(", ");

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main(): Promise<number> {
  console.log("=== Stage 2i v7 — Seed + Clip Generation ===");
  console.log(`Started: ${new Date().toISOString()}\n`);

  await loadEnvLocal();

  const geminiKey = process.env.GEMINI_API_KEY;
  const klingAccess = process.env.KLING_AI_ACCESS_KEY;
  const klingSecret = process.env.KLING_AI_SECRET_KEY;

  if (!geminiKey) { console.error("FATAL: GEMINI_API_KEY not set"); return 1; }
  if (!klingAccess || !klingSecret) { console.error("FATAL: Kling keys not set"); return 1; }

  const dryRun = process.argv.includes("--dry-run");
  const onlyArg = process.argv.find((a) => a.startsWith("--only="));
  const onlyFilter = onlyArg?.slice("--only=".length).toLowerCase();

  if (dryRun) console.log("[DRY RUN] Seeds will be generated, Kling calls skipped.\n");

  await fs.mkdir(SEEDS_DIR, { recursive: true });
  await fs.mkdir(CLIPS_DIR, { recursive: true });

  const doRain = !onlyFilter || onlyFilter === "rain";
  const doCar = !onlyFilter || onlyFilter === "car";

  // Existing seed-b (solid Tacoma driveway) — reuse as moving car seed base
  const seedBPath = path.join(SEEDS_DIR, "seed-b.jpg");
  let seedBBuffer: Buffer | null = null;
  try {
    seedBBuffer = await fs.readFile(seedBPath);
    console.log(`[refs] Loaded seed-b.jpg (${(seedBBuffer.length / 1024).toFixed(0)} KB) — using as Tacoma anchor for moving car`);
  } catch {
    console.warn("[refs] seed-b.jpg not found — moving car seeds will have no Tacoma anchor");
  }

  // -------------------------------------------------------------------------
  // NOTE 1: Rain seeds + clips
  // -------------------------------------------------------------------------
  if (doRain) {
    console.log("\n=== NOTE 1: Rain beat — generating water-shed seeds (Approach B) ===\n");

    for (const seed of rainSeeds) {
      const seedOut = path.join(SEEDS_DIR, `seed-rain-shed-attempt-${seed.attempt}.jpg`);

      // Generate seed
      try {
        await generateSeedImage(
          geminiKey,
          seed.prompt,
          RAIN_NEGATIVE,
          [], // no ref images for rain — texture/water physics must come from the model
          seedOut,
          seed.label,
        );
        // Brief pause for Gemini rate limit
        await new Promise((r) => setTimeout(r, 2000));
      } catch (err) {
        console.error(`[Gemini] Rain seed ${seed.attempt} FAILED: ${err instanceof Error ? err.message : err}`);
        continue;
      }

      // Submit Kling i2v
      const clipOut = path.join(CLIPS_DIR, `clip-rain-shed-attempt-${seed.attempt}.mp4`);
      console.log(`\n[Kling] Submitting rain clip attempt ${seed.attempt}...`);

      let seedBuf: Buffer;
      try {
        const seedPath = seedOut.replace(/\.(jpg|png)$/, ".jpg");
        try {
          seedBuf = await fs.readFile(seedPath);
        } catch {
          seedBuf = await fs.readFile(seedOut.replace(/\.(jpg|png)$/, ".png"));
        }
      } catch {
        console.error(`[Kling] Could not load rain seed ${seed.attempt} — skipping Kling`);
        continue;
      }

      try {
        const jwt = signJwt(klingAccess, klingSecret);
        const taskId = await submitKlingTask(
          jwt,
          seedBuf.toString("base64"),
          rainKlingPrompt,
          rainKlingNegative,
          "5",
          "pro",
          `rain-shed-${seed.attempt}`,
          dryRun,
        );

        if (!dryRun) {
          console.log(`[Kling] rain-shed-${seed.attempt} task_id: ${taskId}`);
          const newJwt = signJwt(klingAccess, klingSecret);
          const task = await pollKlingTask(newJwt, taskId, `rain-shed-${seed.attempt}`);
          const videoUrl = task.task_result?.videos?.[0]?.url;
          if (!videoUrl) throw new Error("No video URL in result");
          console.log(`[Kling] Downloading rain-shed-${seed.attempt}...`);
          await downloadVideo(videoUrl, clipOut);
          const stat = await fs.stat(clipOut);
          console.log(`[Kling] DONE: ${clipOut} (${(stat.size / 1024 / 1024).toFixed(2)} MB)`);
        }
      } catch (err) {
        console.error(`[Kling] Rain clip ${seed.attempt} FAILED: ${err instanceof Error ? err.message : err}`);
      }
    }
  }

  // -------------------------------------------------------------------------
  // NOTE 2: Moving car seeds + clips
  // -------------------------------------------------------------------------
  if (doCar) {
    console.log("\n=== NOTE 2: Moving car — generating rear-follow seeds ===\n");

    const refImages: { mimeType: string; data: string; instruction: string }[] =
      seedBBuffer
        ? [
            {
              mimeType: "image/jpeg",
              data: seedBBuffer.toString("base64"),
              instruction:
                "REFERENCE IMAGE (TACOMA BODY ANCHOR): Use this ONLY for the 2016-2023 Toyota Tacoma 3rd-gen Double Cab body shape, proportions, tail lamp cluster shape (boomerang-C), and the matte tonneau cover appearance. This is a parked static shot — the TARGET image is a moving rear-follow shot with motion blur in the background, not a static parked truck.",
            },
          ]
        : [];

    const movingCarSpecs = [
      {
        attempt: 1,
        seed: movingCarSeeds[0],
        klingPrompt: movingCarKlingPrompt1,
        klingNeg: movingCarKlingNegative1,
      },
      {
        attempt: 2,
        seed: movingCarSeeds[1],
        klingPrompt: movingCarKlingPrompt2,
        klingNeg: movingCarKlingNegative1, // same negative for attempt 2
      },
      {
        attempt: 3,
        seed: movingCarSeeds[2],
        klingPrompt: movingCarKlingPrompt3,
        klingNeg: movingCarKlingNegative3,
      },
    ];

    for (const spec of movingCarSpecs) {
      const seedOut = path.join(SEEDS_DIR, `seed-moving-car-attempt-${spec.attempt}.jpg`);

      try {
        await generateSeedImage(
          geminiKey,
          spec.seed.prompt,
          MOVING_CAR_NEGATIVE,
          refImages,
          seedOut,
          spec.seed.label,
        );
        await new Promise((r) => setTimeout(r, 2000));
      } catch (err) {
        console.error(`[Gemini] Moving car seed ${spec.attempt} FAILED: ${err instanceof Error ? err.message : err}`);
        continue;
      }

      const clipOut = path.join(CLIPS_DIR, `clip-moving-car-attempt-${spec.attempt}.mp4`);
      console.log(`\n[Kling] Submitting moving car clip attempt ${spec.attempt}...`);

      let seedBuf: Buffer;
      try {
        const seedPath = seedOut.replace(/\.(jpg|png)$/, ".jpg");
        try {
          seedBuf = await fs.readFile(seedPath);
        } catch {
          seedBuf = await fs.readFile(seedOut.replace(/\.(jpg|png)$/, ".png"));
        }
      } catch {
        console.error(`[Kling] Could not load car seed ${spec.attempt} — skipping Kling`);
        continue;
      }

      try {
        const jwt = signJwt(klingAccess, klingSecret);
        const taskId = await submitKlingTask(
          jwt,
          seedBuf.toString("base64"),
          spec.klingPrompt,
          spec.klingNeg,
          "5",
          "pro",
          `moving-car-${spec.attempt}`,
          dryRun,
        );

        if (!dryRun) {
          console.log(`[Kling] moving-car-${spec.attempt} task_id: ${taskId}`);
          const newJwt = signJwt(klingAccess, klingSecret);
          const task = await pollKlingTask(newJwt, taskId, `moving-car-${spec.attempt}`);
          const videoUrl = task.task_result?.videos?.[0]?.url;
          if (!videoUrl) throw new Error("No video URL in result");
          console.log(`[Kling] Downloading moving-car-${spec.attempt}...`);
          await downloadVideo(videoUrl, clipOut);
          const stat = await fs.stat(clipOut);
          console.log(`[Kling] DONE: ${clipOut} (${(stat.size / 1024 / 1024).toFixed(2)} MB)`);
        }
      } catch (err) {
        console.error(`[Kling] Moving car clip ${spec.attempt} FAILED: ${err instanceof Error ? err.message : err}`);
      }
    }
  }

  console.log("\n=== Generation complete ===");
  console.log(`Finished: ${new Date().toISOString()}`);
  console.log("\nNext step: run inspect-v7-clips.mjs to read all generated clips,");
  console.log("then run build-spot-v7.mjs to assemble with real music.");
  return 0;
}

main().then((code) => process.exit(code));
