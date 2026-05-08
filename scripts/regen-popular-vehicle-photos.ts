#!/usr/bin/env -S node --experimental-strip-types
/**
 * Cycle 14AL — composite Stehlen-branded parts onto popular-vehicle
 * photos using Gemini 2.5 Flash Image (the editing model formerly
 * known as Nano Banana).
 *
 * The "SHOP BY POPULAR VEHICLE" tiles on the home page currently use
 * stock photos of unmodified trucks. The owner wants each tile to
 * show the same vehicle WITH a representative Stehlen part on it
 * (running boards on the F-150, tonneau cover on the Silverado, rock
 * sliders on the Wrangler, etc.) so the customer immediately sees
 * "this site is for trucks like mine, customized."
 *
 * Usage:
 *   GEMINI_API_KEY=sk-... node scripts/regen-popular-vehicle-photos.ts
 *
 * Get an API key:
 *   https://aistudio.google.com/app/apikey
 *
 * Outputs:
 *   public/images/vehicle-gens-modded/<slug>.jpg  — composited photos
 *
 * After it finishes, update src/app/page.tsx POPULAR_VEHICLE_PHOTOS
 * to point at the new paths (script prints the diff to copy).
 *
 * Notes / gotchas:
 *   - Gemini 2.5 Flash Image edits an INPUT image based on a text
 *     prompt. We feed the source vehicle photo and a prompt that names
 *     the part. We do NOT pass a reference photo of the Stehlen
 *     product — the model interprets the part description. If output
 *     looks generic, paste a real product photo URL into the prompt
 *     for that vehicle in PART_BY_VEHICLE below.
 *   - Image-editing models can hallucinate fender lines, wheel arches,
 *     or paint. Spot-check every output before committing. If a
 *     vehicle's output looks wrong, re-run just that one with
 *     `--only=ford-f-150` (or any slug).
 *   - Cost: ~$0.04 per output image at 2025 pricing. 8 images = ~$0.32.
 */
import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SOURCE_DIR = path.join(ROOT, "public", "images", "vehicle-gens");
const OUT_DIR = path.join(ROOT, "public", "images", "vehicle-gens-modded");

// One representative Stehlen part per popular vehicle. Each entry:
//   sourceFile  — current generation photo to start from
//   slug        — the home-page slug; output is <slug>.jpg
//   part        — what the model should add (one short noun phrase)
//   detail      — extra qualifiers (color, style) to keep it on-brand
const VEHICLES: {
  slug: string;
  sourceFile: string;
  part: string;
  detail: string;
}[] = [
  {
    slug: "ford-f-150",
    sourceFile: "ford-f-150-p702.jpg",
    part: "matte-black aluminum running boards",
    detail:
      "factory-OEM fitment along the rocker panel, mounted with no exposed brackets",
  },
  {
    slug: "chevrolet-silverado",
    sourceFile: "chevrolet-silverado-t1xx.jpg",
    part: "matte-black hard tri-fold tonneau cover",
    detail:
      "covering the truck bed flush with the bedrails, low-profile, no visible hinges",
  },
  {
    slug: "ram-1500",
    sourceFile: "ram-1500-dt.jpg",
    part: "soft roll-up tonneau cover in matte black vinyl",
    detail: "secured along the bed rails with a clean rear edge",
  },
  {
    slug: "toyota-tacoma",
    sourceFile: "toyota-tacoma-n400.jpg",
    part: "tubular black powder-coated nerf-bar running boards",
    detail: "bolted along the rocker panels, no body modifications",
  },
  {
    slug: "jeep-wrangler",
    sourceFile: "jeep-wrangler-jl.jpg",
    part: "tubular rock sliders in textured matte black",
    detail:
      "mounted to the frame between the wheel wells, hugging the rocker panel",
  },
  {
    slug: "toyota-tundra",
    sourceFile: "toyota-tundra-3rd-gen.jpg",
    part: "matte-black hard tri-fold tonneau cover",
    detail: "covering the truck bed flush with the bedrails, low-profile",
  },
  {
    slug: "gmc-sierra",
    sourceFile: "gmc-sierra-t1xx.jpg",
    part: "oval matte-black side-step running boards",
    detail: "factory-OEM fitment along the rocker panel",
  },
  {
    slug: "nissan-frontier",
    sourceFile: "nissan-frontier-d41.jpg",
    part: "tubular black powder-coated nerf-bar running boards",
    detail: "bolted along the rocker panels, no body modifications",
  },
];

const MODEL = "gemini-2.5-flash-image-preview";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const SYSTEM_PROMPT = `You are a photo retoucher specializing in automotive aftermarket accessories. You will receive a stock photograph of a vehicle and a description of one Stehlen Auto part to add. Composite the part onto the vehicle photo-realistically:
- Match the lighting, shadow direction, and color temperature of the original photo.
- Match the perspective so the part sits on the vehicle naturally.
- Preserve the vehicle's existing geometry — do NOT redraw the body, wheels, or background.
- The part should look factory-fitted, not bolted on as an afterthought.
- Keep the modification subtle and tasteful — Stehlen sells premium parts to professional vehicle owners, not lifted-bro stickers.
- Output a single edited photograph, no text or watermarks.`;

type GeminiPart = {
  text?: string;
  inlineData?: { mimeType: string; data: string };
};
type GeminiResponse = {
  candidates?: { content?: { parts?: GeminiPart[] } }[];
  error?: { message: string };
};

async function editOne(
  apiKey: string,
  spec: (typeof VEHICLES)[number],
): Promise<void> {
  const sourcePath = path.join(SOURCE_DIR, spec.sourceFile);
  const sourceBytes = await fs.readFile(sourcePath);
  const sourceB64 = sourceBytes.toString("base64");

  const prompt = `${SYSTEM_PROMPT}

Add to this vehicle: ${spec.part}.
Detail: ${spec.detail}.

Brand context: Stehlen Auto. The part should look like a Stehlen-branded aftermarket accessory — clean lines, matte finish, no garish logos visible.`;

  const body = {
    contents: [
      {
        parts: [
          { text: prompt },
          { inlineData: { mimeType: "image/jpeg", data: sourceB64 } },
        ],
      },
    ],
    generationConfig: {
      responseModalities: ["IMAGE"],
    },
  };

  const res = await fetch(`${ENDPOINT}?key=${apiKey}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini ${res.status}: ${text.slice(0, 400)}`);
  }
  const data = (await res.json()) as GeminiResponse;
  if (data.error) throw new Error(`Gemini error: ${data.error.message}`);
  const image = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
  if (!image?.inlineData) {
    throw new Error("Gemini returned no image data");
  }
  const outBytes = Buffer.from(image.inlineData.data, "base64");
  const outPath = path.join(OUT_DIR, `${spec.slug}.jpg`);
  await fs.writeFile(outPath, outBytes);
  console.log(
    `✓ ${spec.slug.padEnd(22)} ${spec.part.padEnd(60)} → ${outPath.replace(ROOT + "/", "")}`,
  );
}

async function main(): Promise<number> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error(
      "FATAL: set GEMINI_API_KEY (https://aistudio.google.com/app/apikey)",
    );
    return 1;
  }

  await fs.mkdir(OUT_DIR, { recursive: true });

  // CLI: --only=<slug> filters to one vehicle
  const onlyArg = process.argv.find((a) => a.startsWith("--only="));
  const only = onlyArg?.split("=")[1] ?? null;
  const list = only ? VEHICLES.filter((v) => v.slug === only) : VEHICLES;
  if (list.length === 0) {
    console.error(`No vehicles match --only=${only}`);
    return 1;
  }

  console.log(`Editing ${list.length} vehicle photo(s) via ${MODEL}…\n`);
  let failed = 0;
  for (const spec of list) {
    try {
      await editOne(apiKey, spec);
    } catch (err) {
      console.error(
        `✗ ${spec.slug.padEnd(22)} ${err instanceof Error ? err.message : err}`,
      );
      failed++;
    }
    // Throttle: 1 RPS is plenty for 8 images and keeps us off the rate limit.
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log(`\nDone. ${list.length - failed} succeeded, ${failed} failed.`);
  console.log(`Output: ${OUT_DIR.replace(ROOT + "/", "")}/`);
  console.log(`\nTo wire the new images, update src/app/page.tsx:`);
  console.log(`  POPULAR_VEHICLE_PHOTOS map → "/images/vehicle-gens-modded/<slug>.jpg"`);
  console.log(`(The original /vehicle-gens/ files stay in place for the vehicle hub.)`);
  return failed > 0 ? 1 : 0;
}

main().then((code) => process.exit(code));
