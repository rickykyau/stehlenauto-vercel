#!/usr/bin/env -S node --experimental-strip-types
/**
 * Cycle 14AL — composite Stehlen-branded parts onto popular-vehicle
 * photos using Gemini 2.5 Flash Image.
 *
 * Auth: prefers GEMINI_API_KEY (direct call to Google AI Studio, free
 * tier covers this 8-image batch). Falls back to VERCEL_OIDC_TOKEN
 * via the Vercel AI Gateway when GEMINI_API_KEY is unset. Note:
 * Vercel AI Gateway free credits are temporarily rate-limited
 * sitewide (Vercel notice, May 2026) — direct path is the
 * recommended option.
 *
 * Get a free Gemini API key:
 *   https://aistudio.google.com/app/apikey
 *
 * Then add to .env.local:
 *   GEMINI_API_KEY=AIza...
 *
 * Usage:
 *   node scripts/regen-popular-vehicle-photos.ts
 *   node scripts/regen-popular-vehicle-photos.ts --only=ford-f-150
 *
 * Outputs: public/images/vehicle-gens-modded/<slug>.{jpg,png}
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { generateText } from "ai";

const ROOT = process.cwd();
const SOURCE_DIR = path.join(ROOT, "public", "images", "vehicle-gens");
const OUT_DIR = path.join(ROOT, "public", "images", "vehicle-gens-modded");

// AI Gateway routes "provider/model" identifiers; the OIDC token in
// VERCEL_OIDC_TOKEN auths transparently. Image-output model — same one
// the AI SDK docs reference as "Nano Banana." If this preview slug
// retires, swap to the GA version: google/gemini-2.5-flash-image
const MODEL = "google/gemini-2.5-flash-image-preview";

const VEHICLES: {
  slug: string;
  sourceFile: string;
  part: string;
  detail: string;
}[] = [
  {
    slug: "ford-f-150",
    sourceFile: "ford-f-150-p702.jpg",
    // Source photo already has factory running boards visible — switched
    // the part to something the F-150 source DOESN'T already have so the
    // edit is actually visible. Tonneau covers the bed which is empty.
    part: "matte-black hard tri-fold tonneau cover over the truck bed",
    detail:
      "covering the empty truck bed flush with the bedrails, low-profile, segmented panels visible from this angle",
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

// Cycle 14AL retry: previous prompt was too conservative — the
// "preserve existing geometry" line caused the model to return the
// input image unmodified. Direct imperative tone works better with
// Gemini 2.5 Flash Image edits.
const SYSTEM_PROMPT = `Modify the input photograph by visibly installing the specified aftermarket auto part on the vehicle. The added part MUST be clearly visible in the output. Match the original photo's lighting, shadows, and perspective so the part looks factory-installed. Output only the edited photograph — no text, no watermarks, no captions.`;

async function loadEnvLocal(): Promise<void> {
  // Tiny dotenv: read .env.local and inject into process.env. We avoid
  // adding a dotenv dep for a one-shot script.
  const envPath = path.join(ROOT, ".env.local");
  try {
    const raw = await fs.readFile(envPath, "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
      if (!m) continue;
      const [, key, valueRaw] = m;
      if (process.env[key]) continue; // don't override shell-set values
      const value = valueRaw.replace(/^["']|["']$/g, "");
      process.env[key] = value;
    }
  } catch {
    /* no .env.local — fine if shell env covers it */
  }
}

// Direct Google AI Studio path. Free tier handles 8 image edits easily
// (15 RPM rate limit). Image-out model name confirmed via
// https://ai.google.dev/gemini-api/docs/image-generation
// Cycle 14AL: latest image-edit model on the API. Mapping:
//   gemini-3.1-flash-image-preview = "Nano Banana 2" (newest, what we use)
//   gemini-3-pro-image-preview     = "Nano Banana Pro" (higher tier)
//   gemini-2.5-flash-image         = "Nano Banana" (older stable)
// Override via GEMINI_IMAGE_MODEL env var if a specific quality tier is needed.
const GAS_MODEL =
  process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image-preview";
const GAS_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GAS_MODEL}:generateContent`;

async function editViaGoogleDirect(
  apiKey: string,
  spec: (typeof VEHICLES)[number],
  prompt: string,
  sourceBytes: Buffer,
): Promise<{ bytes: Buffer; mediaType: string }> {
  const body = {
    contents: [
      {
        parts: [
          { text: `${SYSTEM_PROMPT}\n\n${prompt}` },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: sourceBytes.toString("base64"),
            },
          },
        ],
      },
    ],
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
  const part = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
  if (!part?.inlineData) {
    throw new Error("Google AI returned no image");
  }
  return {
    bytes: Buffer.from(part.inlineData.data, "base64"),
    mediaType: part.inlineData.mimeType,
  };
}

async function editViaGateway(
  spec: (typeof VEHICLES)[number],
  prompt: string,
  sourceBytes: Buffer,
): Promise<{ bytes: Buffer; mediaType: string }> {
  const result = await generateText({
    model: MODEL,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image", image: sourceBytes },
        ],
      },
    ],
    providerOptions: {
      google: {
        responseModalities: ["IMAGE"],
      },
    },
  });
  type FileLike = { mediaType?: string; uint8Array?: Uint8Array; base64?: string };
  const files: FileLike[] = (result as unknown as { files?: FileLike[] }).files ?? [];
  let imageFile = files.find((f) => f.mediaType?.startsWith("image/"));
  if (!imageFile) {
    const contentArr = (result as unknown as {
      content?: { type: string; mediaType?: string; data?: Uint8Array | string }[];
    }).content;
    const fromContent = contentArr?.find(
      (c) => c.type === "file" && c.mediaType?.startsWith("image/"),
    );
    if (fromContent) {
      imageFile = {
        mediaType: fromContent.mediaType,
        uint8Array:
          fromContent.data instanceof Uint8Array
            ? fromContent.data
            : typeof fromContent.data === "string"
              ? new Uint8Array(Buffer.from(fromContent.data, "base64"))
              : undefined,
      };
    }
  }
  if (!imageFile) {
    throw new Error(
      `No image returned. Text said: ${result.text?.slice(0, 200) ?? "<empty>"}`,
    );
  }
  const bytes =
    imageFile.uint8Array ??
    (imageFile.base64 ? Buffer.from(imageFile.base64, "base64") : null);
  if (!bytes) throw new Error("Image found but no bytes");
  return {
    bytes: Buffer.from(bytes),
    mediaType: imageFile.mediaType ?? "image/jpeg",
  };
}

async function editOne(spec: (typeof VEHICLES)[number]): Promise<void> {
  const sourcePath = path.join(SOURCE_DIR, spec.sourceFile);
  const sourceBytes = await fs.readFile(sourcePath);

  const prompt = `Install ${spec.part} on this vehicle. ${spec.detail}. The part must be clearly visible in the output image — running boards extending below the doors, tonneau covers spanning the truck bed, rock sliders along the rocker panel. Show the part as if a customer just had it installed at the dealership.`;

  const apiKey = process.env.GEMINI_API_KEY;
  const out = apiKey
    ? await editViaGoogleDirect(apiKey, spec, prompt, sourceBytes)
    : await editViaGateway(spec, prompt, sourceBytes);

  const ext = out.mediaType.includes("png") ? "png" : "jpg";
  const outPath = path.join(OUT_DIR, `${spec.slug}.${ext}`);
  await fs.writeFile(outPath, out.bytes);
  console.log(
    `✓ ${spec.slug.padEnd(22)} ${spec.part.slice(0, 50).padEnd(50)} → ${outPath.replace(ROOT + "/", "")}`,
  );
}

async function main(): Promise<number> {
  await loadEnvLocal();

  if (!process.env.VERCEL_OIDC_TOKEN && !process.env.AI_GATEWAY_API_KEY) {
    console.error(
      "FATAL: need VERCEL_OIDC_TOKEN (auto-set on Vercel + via `vercel env pull`) or AI_GATEWAY_API_KEY",
    );
    return 1;
  }

  await fs.mkdir(OUT_DIR, { recursive: true });

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
      await editOne(spec);
    } catch (err) {
      console.error(
        `✗ ${spec.slug.padEnd(22)} ${err instanceof Error ? err.message : err}`,
      );
      failed++;
    }
    await new Promise((r) => setTimeout(r, 800));
  }

  console.log(`\nDone. ${list.length - failed} succeeded, ${failed} failed.`);
  console.log(`Output: ${OUT_DIR.replace(ROOT + "/", "")}/`);
  return failed > 0 ? 1 : 0;
}

main().then((code) => process.exit(code));
