#!/usr/bin/env -S node --experimental-strip-types
/**
 * Cycle 14BG / 14BF-fix3: AI-generated install hero illustrations for
 * the 12 Stehlen categories. Each renders as a clean photographic-
 * style "part installed on truck" hero that anchors the install guide
 * on the PDP. Owner approved Gemini multimedia.
 *
 * Outputs: public/images/install-heroes/<slug>.jpg
 *
 * Usage:
 *   node scripts/gen-install-heroes.ts
 *   node scripts/gen-install-heroes.ts --only=tonneau-covers
 */
import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "public", "images", "install-heroes");
const BRAND_HERO = path.join(ROOT, "public", "images", "hero-stehlen.jpg");

const GAS_MODEL =
  process.env.GEMINI_IMAGE_MODEL || "gemini-3-pro-image-preview";
const GAS_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GAS_MODEL}:generateContent`;

const CATEGORIES: { slug: string; brief: string }[] = [
  {
    slug: "tonneau-covers",
    brief:
      "A matte-black soft roll-up tonneau cover installed on a Ford F-150 bed, rolled half-open showing the cargo area, golden-hour side light, clean garage backdrop, three-quarter rear angle, no text",
  },
  {
    slug: "trailer-hitches",
    brief:
      "A matte-black Class 3 receiver hitch bolted under the rear bumper of a Ram 1500, close-up at hitch-tube level showing the safety-chain loops and 2-inch receiver opening, neutral garage light, three-quarter angle, no text",
  },
  {
    slug: "bull-guards-grille-guards",
    brief:
      "A matte-black bull bar with hex-mesh insert mounted on the front of a Toyota Tundra, hero angle from front-low, garage light raking from side, the truck's silver grille visible through the bull bar, no text",
  },
  {
    slug: "front-grilles",
    brief:
      "A matte-black honeycomb-mesh front grille installed on a Chevy Silverado, head-on shot showing the grille fully seated between the headlights, neutral garage lighting, no text",
  },
  {
    slug: "headlights",
    brief:
      "A pair of black-housing LED projector headlights with amber DRL strips installed on a Ford F-150, low-angle front shot with the lights illuminated against a dim garage interior, dramatic blue-hour mood, no text",
  },
  {
    slug: "truck-bed-mats",
    brief:
      "A diamond-tread heavy-rubber bed mat laid flat in the bed of a Ram 1500, top-down shot showing the full mat fit between wheel wells, clean garage backdrop, no text",
  },
  {
    slug: "running-boards-side-steps",
    brief:
      "Oval matte-black running boards installed along the rocker panel of a GMC Sierra Crew Cab, side-profile shot at running-board height showing both rocker mounts and the boards extending the full cab length, neutral garage lighting, no text",
  },
  {
    slug: "floor-mats",
    brief:
      "A black heavy-duty rubber floor mat installed in the driver-side footwell of a pickup truck, overhead-angled shot showing the mat seated around the pedals and retention post, no text",
  },
  {
    slug: "roof-racks-baskets",
    brief:
      "A matte-black low-profile roof rack with crossbars installed on the cab of a Toyota Tacoma, three-quarter elevated angle showing the rack feet clamped to the roof rails, golden-hour exterior light, no text",
  },
  {
    slug: "chase-racks-sport-bars",
    brief:
      "A matte-black tactical chase rack with hex-mesh side panels and amber LED markers, mounted in the bed of a Ford F-150 Crew Cab, three-quarter rear-low angle, golden-hour exterior backdrop, no text",
  },
  {
    slug: "molle-panels",
    brief:
      "A matte-black MOLLE panel attached to the side of a chase rack in a truck bed, close-up showing the MIL-STD MOLLE webbing grid pattern with a recovery board strapped to it, no text",
  },
  {
    slug: "under-seat-storage",
    brief:
      "A black storage organizer slid into the rear underseat area of a Ford F-150 SuperCrew, interior shot with the rear door open showing the organizer in place and the rear seat folded back down on top, neutral interior lighting, no text",
  },
];

const SYSTEM_PROMPT = `You are a senior automotive photographer creating clean install-confidence hero images for Stehlen Auto's product detail pages. Each image shows a single Stehlen-brand truck accessory FRESHLY INSTALLED on a vehicle, framed so a customer can immediately understand what the part looks like once it's on their truck.

Brand visual language (anchor every image to this):
- Matte-black powder-coated finish
- Premium tactical aesthetic — Yeti / Filson / Tactical Distributors, NOT country-music or lifted-bro
- Hex-mesh inserts on chase racks and bull guards
- Amber LED markers (subtle) on bed-mounted pieces
- Angular structural geometry — never curvy, never chrome

Composition rules:
- Photorealistic, not illustrated
- Focus the frame on the part being installed (the part takes 50-70% of the frame)
- The vehicle is the context, not the subject — frame so the part is dominant
- Cinematic lighting — golden hour for exterior, clean garage practicals for interior
- Output a single landscape 16:9 photograph
- NO text, watermarks, captions, logos, or call-outs in the frame
- The brand reference image attached shows Stehlen's signature aesthetic — match material finish + hex-mesh language exactly`;

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
  spec: (typeof CATEGORIES)[number],
  brandReferenceBytes: Buffer | null,
): Promise<void> {
  const prompt = `${SYSTEM_PROMPT}\n\nGenerate now: ${spec.brief}.`;
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
  if (!out?.inlineData) {
    throw new Error("No inline image in Gemini response");
  }
  const ext = out.inlineData.mimeType === "image/png" ? "png" : "jpg";
  const outPath = path.join(OUT_DIR, `${spec.slug}.${ext}`);
  await fs.writeFile(outPath, Buffer.from(out.inlineData.data, "base64"));
  console.log(`[install-heroes] wrote ${outPath}`);
}

async function main() {
  await loadEnvLocal();
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not set");
  }
  await fs.mkdir(OUT_DIR, { recursive: true });
  let brandReferenceBytes: Buffer | null = null;
  try {
    brandReferenceBytes = await fs.readFile(BRAND_HERO);
  } catch {
    console.warn(`[install-heroes] brand reference missing at ${BRAND_HERO} — proceeding without it`);
  }

  const onlyArg = process.argv.find((a) => a.startsWith("--only="));
  const onlySlug = onlyArg?.slice("--only=".length);
  const queue = onlySlug
    ? CATEGORIES.filter((c) => c.slug === onlySlug)
    : CATEGORIES;
  if (queue.length === 0) {
    throw new Error(`No category matched --only=${onlySlug}`);
  }

  for (const spec of queue) {
    console.log(`[install-heroes] generating ${spec.slug}…`);
    try {
      await generateOne(apiKey, spec, brandReferenceBytes);
    } catch (err) {
      console.error(`[install-heroes] ${spec.slug} FAILED:`, err);
    }
    // Stay below Gemini's 2 req/sec rate limit.
    await new Promise((r) => setTimeout(r, 1200));
  }
  console.log("[install-heroes] done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
