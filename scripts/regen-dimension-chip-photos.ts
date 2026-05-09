#!/usr/bin/env -S node --experimental-strip-types
/**
 * Cycle 14AP — generate visual chip photos for the gated dimension picker
 * on collection pages (bed length / cab type / trim).
 *
 * Owner asked for photos (not SVGs) using Gemini Nano Banana Pro 3. The
 * picker reads /public/images/dimensions/<group>-<slug>.jpg via the
 * dimensionChipSlug helper in src/lib/fitment/sub-model.ts — make sure the
 * file naming convention here stays in sync.
 *
 * Auth: GEMINI_API_KEY (.env.local).
 *
 * Usage:
 *   node scripts/regen-dimension-chip-photos.ts
 *   node scripts/regen-dimension-chip-photos.ts --only=bed-length-5-5
 *
 * Outputs: public/images/dimensions/<slug>.{jpg,png}
 */
import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "public", "images", "dimensions");
const BRAND_HERO = path.join(ROOT, "public", "images", "hero-stehlen.jpg");

// gemini-3-pro-image-preview = Nano Banana Pro (highest fidelity)
const GAS_MODEL =
  process.env.GEMINI_IMAGE_MODEL || "gemini-3-pro-image-preview";
const GAS_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GAS_MODEL}:generateContent`;

// Each chip is a 3:2 photo (small — 480x320 is plenty at the rendered size).
// Camera angle and framing are fixed across the full set so the chip row
// reads as a coherent comparison strip, not a random gallery.
const CHIPS: { slug: string; subject: string; framing: string; intent: string }[] = [
  // ─── BED LENGTH (6 options) ───────────────────────────────────────────
  // Pure side profile of a generic modern American pickup, varying only
  // the bed length. Camera position, distance, lighting, paint colour
  // identical across all 6 so the customer's eye reads the BED size as
  // the only variable. White seamless studio background.
  {
    slug: "bed-length-4-6-bed",
    subject:
      "modern matte-black American pickup truck (anonymous styling — no badges, no manufacturer logo) with a noticeably SHORT 4.6-foot truck bed (compact / utility-bed length, common on Nissan Frontier D40)",
    framing: "pure side profile, dead-level camera, full vehicle in frame with 10% padding above and below, white seamless studio background, soft top-down studio lighting, tires on flat ground",
    intent: "Customer should immediately read 'this is the SHORTEST bed option'. The bed length is the visual subject — exaggerate the front cab to bed ratio so the bed reads as compact.",
  },
  {
    slug: "bed-length-5-bed",
    subject:
      "modern matte-black American pickup truck (anonymous styling) with a 5-foot truck bed (compact, often paired with crew-cab configurations on mid-size trucks)",
    framing: "pure side profile, dead-level camera, full vehicle in frame, white seamless studio background, identical lighting and angle to the other bed-length chips",
    intent: "Slightly longer bed than 4.6'. Customer reads it as 'short bed, crew cab'.",
  },
  {
    slug: "bed-length-5-5-bed",
    subject:
      "modern matte-black American pickup truck (anonymous styling) with a 5.5-foot truck bed (the classic SHORT bed on a half-ton crew cab — Ford F-150 SuperCrew 5.5-ft, Silverado 1500 5.8-ft)",
    framing: "pure side profile, dead-level camera, full vehicle in frame, white seamless studio background, identical lighting and angle to the other bed-length chips",
    intent: "Most popular short-bed option. Customer reads 'this is my F-150 SuperCrew bed'.",
  },
  {
    slug: "bed-length-6-bed",
    subject:
      "modern matte-black American pickup truck (anonymous styling) with a 6-foot truck bed (Toyota Tacoma long bed, mid-size standard)",
    framing: "pure side profile, dead-level camera, full vehicle in frame, white seamless studio background, identical lighting and angle to the other bed-length chips",
    intent: "Mid-length. Customer reads 'between short and standard'.",
  },
  {
    slug: "bed-length-6-5-bed",
    subject:
      "modern matte-black American pickup truck (anonymous styling) with a 6.5-foot truck bed (the classic STANDARD bed on a half-ton — Ford F-150 6.5-ft, Silverado 1500 6.6-ft)",
    framing: "pure side profile, dead-level camera, full vehicle in frame, white seamless studio background, identical lighting and angle to the other bed-length chips",
    intent: "Standard bed. Customer reads 'this is the regular F-150 / Silverado bed'.",
  },
  {
    slug: "bed-length-8-bed",
    subject:
      "modern matte-black American pickup truck (anonymous styling) with a noticeably LONG 8-foot truck bed (full work-truck bed, common on F-250/F-350 single cab and 3500-class)",
    framing: "pure side profile, dead-level camera, full vehicle in frame with 10% padding above and below, white seamless studio background, identical lighting and angle to the other bed-length chips",
    intent: "Customer reads 'this is the LONGEST bed' — the bed should clearly dominate the side profile and visually overshadow the cab.",
  },

  // ─── CAB TYPE (3 options) ─────────────────────────────────────────────
  // Same pickup, same colour, same camera, same studio bg. Vary the cab
  // configuration. The visual hook is the door count + rear-door size.
  {
    slug: "cab-type-crew-cab",
    subject:
      "modern matte-black American pickup truck (anonymous styling, Ford F-150 silhouette) with a CREW CAB configuration: four full-size doors, four full passenger windows, all four doors equal in size and front-hinged",
    framing: "pure side profile, dead-level camera, full vehicle in frame, white seamless studio background, soft top-down studio lighting — match the camera position used for the bed-length chips",
    intent: "Customer instantly sees 'four full doors, family truck'. The full rear door is the visual signature.",
  },
  {
    slug: "cab-type-supercab",
    subject:
      "modern matte-black American pickup truck (anonymous styling, Ford F-150 silhouette) with a SUPERCAB / EXTENDED CAB configuration: two full front doors PLUS two SHORTER rear-hinged 'suicide' doors that open backward to access a small jump-seat area; the rear doors are clearly half-size relative to the front doors",
    framing: "pure side profile, dead-level camera, full vehicle in frame, white seamless studio background, identical lighting to the crew-cab chip — the only visible difference must be the cab/door configuration",
    intent: "Customer reads 'half doors that open backward — that's my SuperCab'. Critical: rear-hinged short doors must be obvious and distinct from a Crew Cab.",
  },
  {
    slug: "cab-type-regular-cab",
    subject:
      "modern matte-black American pickup truck (anonymous styling, Ford F-150 silhouette) with a REGULAR CAB / SINGLE CAB configuration: ONLY two doors, no rear seats, work-truck profile with a long bed",
    framing: "pure side profile, dead-level camera, full vehicle in frame, white seamless studio background, identical lighting to the other cab chips",
    intent: "Customer immediately reads 'two doors only — work truck'. The absence of rear doors must be obvious.",
  },

  // ─── TRIM (3 options) ─────────────────────────────────────────────────
  // Trim is harder to render visually since it's about packages not
  // structure. We lean on EXTERIOR cues that customers actually
  // recognize: chrome vs blackout, wheels, lift, bumpers.
  {
    slug: "trim-base",
    subject:
      "modern American pickup truck in BASE / WORK-TRUCK trim: white paint, steel wheels, chrome front bumper, no side steps, no light bars, factory-stock unmodified appearance, fleet/utility look",
    framing: "three-quarter front-side angle, eye-level camera, full vehicle in frame, plain white seamless studio background, soft even lighting",
    intent: "Customer reads 'base / fleet / work truck'. Steel wheels and white paint are the visual shorthand.",
  },
  {
    slug: "trim-mid",
    subject:
      "modern American pickup truck in MID-TIER trim (XLT / LT / SR5 level): metallic grey paint, factory aluminum wheels, color-matched bumpers, basic side steps, no off-road package, mainstream consumer look",
    framing: "three-quarter front-side angle, eye-level camera, full vehicle in frame, plain white seamless studio background, identical lighting to the base trim",
    intent: "Customer reads 'regular consumer trim — what most people buy'.",
  },
  {
    slug: "trim-heavy-duty",
    subject:
      "modern American pickup truck in HEAVY-DUTY / OFF-ROAD / PREMIUM trim (Raptor / TRD Pro / Trail Boss / Rebel level): matte black paint, blacked-out grille and badges, aggressive off-road wheels with all-terrain tires, factory lift kit, skid plates, integrated fender flares, premium aggressive stance",
    framing: "three-quarter front-side angle, eye-level camera, full vehicle in frame, plain white seamless studio background, identical lighting to the other trim chips",
    intent: "Customer reads 'aggressive premium / off-road package — that's my Raptor / TRD Pro'.",
  },
];

const SYSTEM_PROMPT = `You are a senior automotive product photographer creating COMPARISON CHIP photos for a truck-parts e-commerce filter UI. Each photo is a small chip the customer clicks to identify their vehicle's bed length / cab type / trim.

Critical: these photos sit side-by-side in a grid of 3 chips per row. Across each set (bed length × 6, cab type × 3, trim × 3), every chip MUST share the same camera angle, distance, lighting, background, and (where possible) the same base vehicle silhouette. The customer's eye should isolate the ONE dimensional difference between chips — not be confused by varying lighting, paint, or framing.

Output rules:
- 3:2 landscape ratio. Photo only — no text, no labels, no callouts, no annotations.
- White seamless studio background unless otherwise specified.
- Soft, even, top-down studio lighting. No dramatic golden-hour. No outdoor environments.
- The single dimensional attribute named in the prompt (bed length / cab type / trim) MUST be the visually dominant difference vs other chips in the same set.
- Photorealistic. Modern (2020+) American pickup trucks. No badges, no manufacturer logos visible.
- Center the vehicle. 10% padding around the silhouette.

You are NOT generating a hero shot. You are generating a clean reference image — think product-catalog accuracy, not editorial drama.`;

type GeminiPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

async function loadEnvLocal(): Promise<void> {
  try {
    const raw = await fs.readFile(path.join(ROOT, ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
      if (!m) continue;
      const [, key, valueRaw] = m;
      if (process.env[key]) continue;
      process.env[key] = valueRaw.replace(/^["']|["']$/g, "");
    }
  } catch {
    /* no .env.local */
  }
}

async function generateOne(
  apiKey: string,
  spec: (typeof CHIPS)[number],
  brandReferenceBytes: Buffer | null,
): Promise<void> {
  const prompt = `${SYSTEM_PROMPT}

Subject: ${spec.subject}
Framing: ${spec.framing}
Intent (what the customer must instantly read): ${spec.intent}

Generate the photo now.`;

  const parts: GeminiPart[] = [{ text: prompt }];
  if (brandReferenceBytes) {
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: brandReferenceBytes.toString("base64"),
      },
    });
  }

  const body = {
    contents: [{ parts }],
    generationConfig: { responseModalities: ["IMAGE"] },
  };
  const res = await fetch(`${GAS_ENDPOINT}?key=${apiKey}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google AI ${res.status}: ${text.slice(0, 400)}`);
  }
  type Resp = {
    candidates?: {
      content?: {
        parts?: { inlineData?: { mimeType: string; data: string } }[];
      };
    }[];
  };
  const data = (await res.json()) as Resp;
  const out = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
  if (!out?.inlineData) throw new Error("Google AI returned no image");

  const bytes = Buffer.from(out.inlineData.data, "base64");
  // Always write as .jpg even when Google returns PNG — the picker
  // hardcodes .jpg in its <Image src> path. Browsers don't care about the
  // extension; Next/Image content-type sniffs.
  const outPath = path.join(OUT_DIR, `${spec.slug}.jpg`);
  await fs.writeFile(outPath, bytes);
  console.log(
    `✓ ${spec.slug.padEnd(22)} → ${outPath.replace(ROOT + "/", "")}`,
  );
}

async function main(): Promise<number> {
  await loadEnvLocal();

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("FATAL: set GEMINI_API_KEY (https://aistudio.google.com/app/apikey)");
    return 1;
  }

  await fs.mkdir(OUT_DIR, { recursive: true });

  let brandReferenceBytes: Buffer | null = null;
  try {
    brandReferenceBytes = await fs.readFile(BRAND_HERO);
  } catch {
    console.warn("(brand hero image not found — proceeding without style reference)");
  }

  const onlyArg = process.argv.find((a) => a.startsWith("--only="));
  const only = onlyArg?.split("=")[1] ?? null;
  const list = only ? CHIPS.filter((c) => c.slug === only) : CHIPS;
  if (list.length === 0) {
    console.error(`No chip matches --only=${only}`);
    return 1;
  }

  console.log(
    `Generating ${list.length} dimension-chip photo(s) via ${GAS_MODEL}…\n`,
  );
  let failed = 0;
  for (const spec of list) {
    try {
      await generateOne(apiKey, spec, brandReferenceBytes);
    } catch (err) {
      console.error(
        `✗ ${spec.slug.padEnd(22)} ${err instanceof Error ? err.message : err}`,
      );
      failed++;
    }
    await new Promise((r) => setTimeout(r, 1200));
  }

  console.log(`\nDone. ${list.length - failed} succeeded, ${failed} failed.`);
  return failed > 0 ? 1 : 0;
}

main().then((code) => process.exit(code));
