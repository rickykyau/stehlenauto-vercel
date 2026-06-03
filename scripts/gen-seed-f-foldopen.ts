#!/usr/bin/env -S node --experimental-strip-types
/**
 * STAGE 2c — seed-f-foldopen generator
 *
 * Director: Carter Voss
 * Brief: Generate 3 attempts of a Tacoma bed-access "already folded" seed.
 *
 * CRITICAL DIRECTION:
 *   Do NOT animate the fold. Show the cover ALREADY in the folded-open position:
 *   3 hard panels stacked forward against the cab, tailgate down, bed open.
 *   Consistent silver 2016-2023 Tacoma Double Cab, 5ft bed, driveway, golden-hour.
 *
 * Reference inputs:
 *   seed-b-attempt-2.jpg  — vehicle + golden-hour driveway + cover look (Tacoma body anchor)
 *   /tmp/tacoma-shopify-full/img-09.jpg — folded-stack geometry + safety-buckle look
 *                                          (F-150 body — use for cover/hardware only)
 *
 * Outputs:
 *   public/images/spot-seeds/seed-f-foldopen.jpg          (attempt 1)
 *   public/images/spot-seeds/seed-f-foldopen-attempt-2.jpg
 *   public/images/spot-seeds/seed-f-foldopen-attempt-3.jpg
 *
 * Usage:
 *   node scripts/gen-seed-f-foldopen.ts
 *   node scripts/gen-seed-f-foldopen.ts --only=1     # single attempt
 *   node scripts/gen-seed-f-foldopen.ts --dry-run
 */

import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SEEDS_DIR = path.join(ROOT, "public", "images", "spot-seeds");

const GAS_MODEL =
  process.env.GEMINI_IMAGE_MODEL || "gemini-3-pro-image-preview";
const GAS_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GAS_MODEL}:generateContent`;

// ---------------------------------------------------------------------------
// Shared accuracy briefs
// ---------------------------------------------------------------------------
const TACOMA_BODY_BRIEF = `
VEHICLE ACCURACY (READ CAREFULLY — THIS OVERRIDES EVERYTHING ELSE):
The truck is a 2016-2023 Toyota Tacoma 3rd generation (N300 platform), Double Cab (4-door), short 5-foot bed. Stock ride height. Factory-style alloy wheels, NOT oversized, NOT lifted.
Vehicle color: silver or light cement gray — a clean, muted metallic. NOT white, NOT black.
TAIL LAMP: The 3rd-gen Tacoma tail lamp is a compact angular cluster with a distinctive boomerang/C-shaped lower element. NOT a vertical rectangle. NOT a wide horizontal stack.
TAILGATE: Reads "TACOMA" in raised block letters. Down / open for this shot.
SHORT BED: Compact 5-foot bed — visibly shorter than the cab. Ratio of cab to bed roughly 1:0.75.
DO NOT use an F-150, Tundra, Silverado, or any body other than a 3rd-gen Tacoma Double Cab.
`.trim();

const COVER_FOLDED_BRIEF = `
TONNEAU COVER — FOLDED OPEN STATE (CRITICAL):
The cover is a 3-panel hard tri-fold tonneau cover in matte black. It is currently in the FOLDED-OPEN position:
- All 3 rigid panels are folded forward and stacked against the cab rear wall, creating a compact 3-panel stack approximately 8-10 inches thick sitting at the front of the bed near the cab.
- The panels are horizontal, stacked flat on top of each other, NOT fanned or spread.
- The safety retention straps (small nylon buckle straps) hold the stack together at the sides.
- The aluminum side rails remain in place running the length of the bed walls on both sides. They are empty — no panel resting on them in the middle or rear sections.
- The entire bed interior is open and accessible from the tailgate all the way to the stacked panels at the cab.
- Tailgate is DOWN and open. The bed liner floor is visible — dark charcoal textured spray-in liner.
- The folded panel stack sits forward against the cab window and cab rear, standing perhaps 10-12 inches above the bed rail level because of the 3-panel thickness.
- Panel surface finish: matte black leatherette grain texture on the top of the stack. NOT glossy.
`.trim();

const MAIN_PROMPT = `
You are a senior automotive commercial photographer shooting a TV advertisement still.

${TACOMA_BODY_BRIEF}

${COVER_FOLDED_BRIEF}

SCENE:
A 2016-2023 Toyota Tacoma Double Cab in silver/cement gray is parked in a clean residential suburban driveway. Clean concrete surface, slightly weathered. Soft suburban background — trimmed hedge, garage edge — all out of focus. NO mountains, NO desert, NO off-road. The truck is photographed in the same setting and lighting as reference image 1 (seed-b-attempt-2.jpg).

CAMERA POSITION:
Three-quarter rear angle, camera low at approximately 18-24 inches off the ground, positioned at the driver-side rear corner. The camera looks toward the front-passenger side of the truck. This angle clearly shows:
1. The tailgate DOWN and open (primary story element — the bed is accessible)
2. The full open bed interior from the open tailgate forward to the stacked panels at the cab
3. The 3-panel matte black cover stack sitting against the cab at the forward end of the bed
4. The driver-side tail lamp (correct 3rd-gen boomerang-C shape, unlit)
5. The aluminum side rails running empty along both bed walls
6. The dark textured bed liner floor

This composition answers the question "how do I access my bed" — the viewer immediately sees: tailgate down, bed open, cover neatly stacked at the front.

LENS: 50mm equivalent. Slight anamorphic horizontal character.

LIGHTING:
Late afternoon, approximately 5:30 PM. Same golden-hour warm light as reference image 1. The sun is at approximately 45 degrees to camera-right, low, creating directional key light that rakes across the bed walls and the top of the stacked panels. The matte black cover stack picks up warm light on its top panel surface but absorbs light on its side faces. The open bed liner floor shows warm-toned light from the low sun. Tail lamp unlit.

KEY COMPOSITIONAL REQUIREMENT:
The folded stack of 3 panels at the front of the bed must be clearly readable as:
- 3 rigid hard panels stacked flat on top of each other
- Located at the forward end of the bed against the cab
- Compact and organized — not splayed, not messy
- The side rails are visible and empty for the full bed length
- The open bed space between the stack and the tailgate is clearly visible

MOOD: Clean, functional, premium. "Easy access" without any fuss. This is a product demonstration shot.

OUTPUT: Single 16:9 landscape photograph. Photorealistic, shot on Canon EOS R with 50mm prime. No text, no logos except factory Toyota/Tacoma badges. No watermarks.

NEGATIVE (do NOT include any of these):
panels mid-fold, panels at 45 degree angle, panels partially open, soft tonneau cover, rolling cover, cover in motion, animated fold, cover closed on bed, cover flat on bed, people, hands touching cover, feet, lifted suspension, oversized wheels, mud tires, chrome accents, F-150, Tundra, Silverado, Ram, 4th-gen 2024+ Tacoma, glossy cover panels, LED strip on cover, desert, mountains, off-road, country setting, watermark, illustration, digital rendering artifact, AI plastic sheen, extra fingers, melted shapes, morphing hardware.
`.trim();

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
      if (key === "GEMINI_API_KEY") {
        process.env[key] = valueRaw.replace(/^["']|["']$/g, "");
      } else if (!process.env[key]) {
        process.env[key] = valueRaw.replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    // No .env.local — key must be in shell environment
  }
}

// ---------------------------------------------------------------------------
// Gemini request
// ---------------------------------------------------------------------------
type GeminiPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

async function generateSeedF(
  apiKey: string,
  attempt: number,
  dryRun: boolean,
): Promise<string> {
  // Load reference images
  const ref1Path = path.join(SEEDS_DIR, "seed-b-attempt-2.jpg");
  const ref2Path = "/tmp/tacoma-shopify-full/img-09.jpg";

  let ref1Buf: Buffer | null = null;
  let ref2Buf: Buffer | null = null;

  try {
    ref1Buf = await fs.readFile(ref1Path);
    console.log(`  ref1 (seed-b-attempt-2): ${(ref1Buf.length / 1024).toFixed(0)} KB`);
  } catch {
    console.warn(`  WARNING: ref1 not found at ${ref1Path}`);
  }

  try {
    ref2Buf = await fs.readFile(ref2Path);
    console.log(`  ref2 (img-09 folded-stack): ${(ref2Buf.length / 1024).toFixed(0)} KB`);
  } catch {
    console.warn(`  WARNING: ref2 not found at ${ref2Path}`);
  }

  const parts: GeminiPart[] = [];

  if (ref1Buf) {
    parts.push({
      text: "REFERENCE IMAGE 1 — VEHICLE BODY + DRIVEWAY SETTING ANCHOR: This is the real Toyota Tacoma 3rd-gen Double Cab in silver/cement gray on a suburban driveway with golden-hour light. Use this for: vehicle body shape, tail lamp cluster (boomerang-C shape — CRITICAL), wheel style, driveway surface, lighting direction and quality, suburban background treatment, and the side rail profile. In this reference the cover is CLOSED. In the target image the cover will be FOLDED OPEN at the front of the bed. The vehicle body, setting, and lighting should match this reference closely.",
    });
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: ref1Buf.toString("base64"),
      },
    });
  }

  if (ref2Buf) {
    parts.push({
      text: "REFERENCE IMAGE 2 — FOLDED COVER STACK GEOMETRY + HARDWARE (F-150 body — ignore the vehicle, use the cover only): This shows the hard tri-fold cover in the folded-open position — 3 panels stacked forward against the cab. Use this ONLY for: (1) the compact 3-panel stack geometry — how the panels fold and stack flat on top of each other, (2) the matte black cover panel surface and side edge profile, (3) the safety retention strap/buckle hardware at the side of the folded stack, (4) how the aluminum side rails remain in place while the panels are stacked at the front. The F-150 body in this reference must NOT appear in the output — use only the cover hardware and fold geometry as reference. The target vehicle is a silver Tacoma as shown in Reference Image 1.",
    });
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: ref2Buf.toString("base64"),
      },
    });
  }

  parts.push({
    text: `${MAIN_PROMPT}\n\nAttempt ${attempt} of 3. Generate the photograph now. Output a single photorealistic image in 16:9 landscape format. No text overlays, no watermarks, no callouts.`,
  });

  if (dryRun) {
    console.log(`  [DRY RUN] Would POST to Gemini with ${parts.length} parts`);
    console.log(`  [DRY RUN] Prompt (first 200 chars): ${MAIN_PROMPT.slice(0, 200)}`);
    const suffix = attempt > 1 ? `-attempt-${attempt}` : "";
    return path.join(SEEDS_DIR, `seed-f-foldopen${suffix}.jpg`);
  }

  const body = {
    contents: [{ parts }],
    generationConfig: {
      responseModalities: ["IMAGE"],
    },
  };

  const res = await fetch(`${GAS_ENDPOINT}?key=${apiKey}`, {
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
  const imgPart = data.candidates?.[0]?.content?.parts?.find(
    (p) => p.inlineData,
  );
  if (!imgPart?.inlineData) {
    throw new Error("Gemini returned no image in response");
  }

  const ext = imgPart.inlineData.mimeType.includes("png") ? "png" : "jpg";
  const suffix = attempt > 1 ? `-attempt-${attempt}` : "";
  const outPath = path.join(SEEDS_DIR, `seed-f-foldopen${suffix}.${ext}`);
  await fs.writeFile(outPath, Buffer.from(imgPart.inlineData.data, "base64"));
  return outPath;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main(): Promise<number> {
  await loadEnvLocal();

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error(
      "FATAL: GEMINI_API_KEY not set.\n" +
        `Looked in: ${path.join(ROOT, ".env.local")} and shell environment.`,
    );
    return 1;
  }

  const dryRun = process.argv.includes("--dry-run");
  const onlyArg = process.argv.find((a) => a.startsWith("--only="));
  const onlyAttempt = onlyArg ? parseInt(onlyArg.slice("--only=".length), 10) : null;

  const attempts = onlyAttempt ? [onlyAttempt] : [1, 2, 3];

  await fs.mkdir(SEEDS_DIR, { recursive: true });

  console.log(`[seed-f] Generating seed-f-foldopen (fold-open bed access beat)`);
  console.log(`[seed-f] Model: ${GAS_MODEL}`);
  console.log(`[seed-f] Attempts: ${attempts.join(", ")}`);
  if (dryRun) console.log("[seed-f] DRY RUN — no API calls\n");
  console.log();

  let failed = 0;
  for (const attempt of attempts) {
    console.log(`[seed-f] → Attempt ${attempt}...`);
    try {
      const outPath = await generateSeedF(apiKey, attempt, dryRun);
      console.log(`[seed-f]   DONE: ${outPath}\n`);
    } catch (err) {
      console.error(
        `[seed-f]   FAILED: ${err instanceof Error ? err.message : String(err)}\n`,
      );
      failed++;
    }
    // Rate limit buffer between attempts
    if (attempt < attempts[attempts.length - 1]) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  console.log(`[seed-f] Done. ${attempts.length - failed} succeeded, ${failed} failed.`);
  return failed > 0 ? 1 : 0;
}

main().then((code) => process.exit(code));
