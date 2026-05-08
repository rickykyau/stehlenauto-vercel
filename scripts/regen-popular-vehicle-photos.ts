#!/usr/bin/env -S node --experimental-strip-types
/**
 * Cycle 14AL final — generate hero-quality "Stehlen build" photos for the
 * SHOP BY POPULAR VEHICLE tiles on the home page.
 *
 * Earlier passes were image-EDIT (compositing parts onto stock vehicle
 * photos). Owner feedback: the tan/red workhorse stock photos are not
 * "sexy" — generate fresh hero shots from scratch, anchored to the
 * Stehlen brand hero (matte-black tactical chase rack with hex mesh and
 * amber LEDs). This pass uses TEXT-TO-IMAGE with the brand hero as a
 * single style-reference image.
 *
 * Auth: GEMINI_API_KEY (free tier covers this 8-image batch easily).
 *
 * Usage:
 *   node scripts/regen-popular-vehicle-photos.ts
 *   node scripts/regen-popular-vehicle-photos.ts --only=ford-f-150
 *
 * Outputs: public/images/vehicle-gens-modded/<slug>.{jpg,png}
 */
import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "public", "images", "vehicle-gens-modded");
const BRAND_HERO = path.join(ROOT, "public", "images", "hero-stehlen.jpg");

// gemini-3-pro-image-preview = Nano Banana Pro (highest fidelity)
// gemini-3.1-flash-image-preview = Nano Banana 2 (faster/cheaper)
const GAS_MODEL =
  process.env.GEMINI_IMAGE_MODEL || "gemini-3-pro-image-preview";
const GAS_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GAS_MODEL}:generateContent`;

// Each entry is a full creative brief — vehicle, color/trim, setting,
// lighting, parts. Every truck shares the same matte-black tactical
// visual language so the row of 8 tiles reads as ONE brand build.
const VEHICLES: {
  slug: string;
  vehicle: string;
  setting: string;
  parts: string;
}[] = [
  {
    slug: "ford-f-150",
    vehicle:
      "current-generation Ford F-150 SuperCrew (P702 body, ~2024 model year), matte gunmetal grey paint, blacked-out grille and badges, factory aluminum wheels swapped for matte-black off-road wheels with 35-inch all-terrain tires, slight 2-inch leveling lift",
    setting:
      "golden-hour pullout off a forest service road, wet asphalt with reflections, scattered pine trees, Sierra Nevada or Rocky Mountain backdrop softly out of focus, warm sunset light raking across the truck from camera-left, three-quarter front-side angle low-camera",
    parts:
      "(1) a matte-black tactical chase rack mounted in the truck bed with hex-mesh side panels, amber LED markers, and a roof-height LED light bar across the top — match the brand hero reference exactly; (2) a matte-black tubular bull guard wrapping the grille with hex-mesh inserts; (3) tubular black rock sliders along the rocker panel; (4) wide-pocket matte-black fender flares with hex-bolt accents",
  },
  {
    slug: "chevrolet-silverado",
    vehicle:
      "current-generation Chevrolet Silverado 1500 LT Trail Boss (T1XX body, ~2024 model year), Shadow Grey Metallic paint, blacked-out grille and badges, factory 18-inch black wheels with 33-inch all-terrain tires",
    setting:
      "high-desert pullout at golden hour, hard-packed dirt and red rock formations in the distance, warm low sun raking from camera-left, three-quarter front-side angle, slight low-camera looking up to emphasize stance",
    parts:
      "(1) a matte-black tactical chase rack in the truck bed with hex-mesh panels, amber LED markers, and a roof-height LED light bar — match the brand hero reference; (2) a matte-black low-profile front bull bar with integrated 30-inch LED light bar; (3) tubular black rock sliders along the rocker panel; (4) wide-pocket matte-black fender flares",
  },
  {
    slug: "ram-1500",
    vehicle:
      "current-generation Ram 1500 Rebel Crew Cab (DT body, ~2024 model year), Diamond Black Crystal Pearl paint, factory 18-inch matte-black off-road wheels with 33-inch all-terrain tires, factory air-suspension lift",
    setting:
      "industrial concrete lot at blue-hour twilight, overhead clouds catching last warm light, single warm sodium lamp behind camera, wet concrete with shallow puddles reflecting the truck, three-quarter front-side angle",
    parts:
      "(1) a matte-black tactical chase rack in the truck bed with hex-mesh panels, amber LED markers, and a roof-height LED light bar — match the brand hero reference; (2) a matte-black grille guard with hex-mesh inserts and full-wrap headlight protection; (3) tubular black rock sliders along the rocker panel",
  },
  {
    slug: "toyota-tacoma",
    vehicle:
      "current-generation Toyota Tacoma TRD Pro Double Cab (N400 body, ~2024 model year), Solar Octane orange paint OR Lunar Rock grey (pick whichever reads more cinematically), factory bronze TRD Pro wheels with 33-inch all-terrain tires, factory 1-inch front lift",
    setting:
      "Pacific Northwest forest fire road at dawn, mist and pine trees, soft cool morning light from camera-right, three-quarter rear-side angle to emphasize the bed and chase rack — this is the hero angle that should most closely echo the brand reference",
    parts:
      "(1) a matte-black tactical chase rack in the truck bed with hex-mesh side panels, amber LED markers, and a roof-height LED light bar across the top — this is the focal point, match the brand hero reference EXACTLY; (2) wide-pocket matte-black fender flares; (3) tubular black rock sliders along the rocker panel",
  },
  {
    slug: "jeep-wrangler",
    vehicle:
      "current-generation Jeep Wrangler Rubicon Unlimited 4-door (JL body, ~2024 model year), Granite Crystal Metallic dark grey paint, hardtop on, factory 17-inch black beadlock-style wheels with 35-inch mud-terrain tires",
    setting:
      "sandstone desert canyon trail at late afternoon, warm rim light from low sun behind, wide rocky road bed in foreground, three-quarter front-side angle low-camera",
    parts:
      "(1) a matte-black stubby front bumper with integrated winch and dual flush-mount round LED fog lamps; (2) a matte-black low-profile roof rack with hex-mesh side rails and a 40-inch LED light bar at the front edge — match the brand hero's tactical metalwork; (3) wide-pocket matte-black fender flares over all four wheel wells; (4) tubular black rock sliders along the rocker panel",
  },
  {
    slug: "toyota-tundra",
    vehicle:
      "current-generation Toyota Tundra 1794 Edition CrewMax (~2024 model year), Magnetic Grey Metallic paint, factory 20-inch black wheels swapped for 18-inch matte-black off-road wheels with 33-inch all-terrain tires, factory 1-inch front lift",
    setting:
      "alpine reservoir overlook at sunrise, glassy water and snow-dusted peaks far behind, cool dawn light, three-quarter rear-side angle to feature the bed and chase rack",
    parts:
      "(1) a matte-black tactical chase rack in the truck bed with hex-mesh panels, amber LED markers, and a roof-height LED light bar — match the brand hero reference EXACTLY; (2) wide-pocket matte-black fender flares with hex-bolt accents; (3) tubular black rock sliders along the rocker panel",
  },
  {
    slug: "gmc-sierra",
    vehicle:
      "current-generation GMC Sierra 1500 AT4 Crew Cab (T1XX body, ~2024 model year), Onyx Black paint, factory 20-inch dark-finish wheels with 33-inch all-terrain tires, factory 2-inch lift",
    setting:
      "abandoned high-plains airstrip at golden hour, wide-open flat horizon with low scrub grass, warm side light raking from camera-left, three-quarter front-side angle",
    parts:
      "(1) a matte-black tactical chase rack in the truck bed with hex-mesh panels, amber LED markers, and a roof-height LED light bar visible above the cab — match the brand hero reference; (2) a matte-black grille guard with hex-mesh inserts; (3) wide-pocket matte-black fender flares; (4) oval matte-black side-step running boards along the rocker panel",
  },
  {
    slug: "nissan-frontier",
    vehicle:
      "current-generation Nissan Frontier PRO-4X Crew Cab (D41 body, ~2024 model year), Tactical Green or Boulder Grey paint (pick whichever reads more cinematically), factory 17-inch black wheels with 33-inch all-terrain tires, factory 1-inch lift",
    setting:
      "coastal cliff overlook at golden hour, ocean horizon far behind, scattered tall grass in foreground, warm side light, three-quarter front-side angle low-camera",
    parts:
      "(1) a matte-black tactical chase rack in the truck bed with hex-mesh side panels, amber LED markers, and a roof-height LED light bar — match the brand hero reference; (2) tubular black rock sliders with kickout step along the rocker panel; (3) wide-pocket matte-black fender flares; (4) a matte-black front bull bar",
  },
];

const SYSTEM_PROMPT = `You are a senior automotive photographer creating hero-quality marketing images for Stehlen Auto, a premium-tactical truck-accessories brand. Generate a photorealistic hero shot of the specified vehicle build.

Stehlen brand visual language (this is non-negotiable — anchor every part to it):
- Matte black powder-coated finish across all aftermarket parts
- Hex-mesh inserts (honeycomb pattern) on tactical bed-mounted pieces
- Amber LED markers on the chase rack
- Angular, structural geometry — never curvy, never chrome
- Premium tactical aesthetic — Yeti / Filson / Tactical Distributors, NOT country-music or lifted-bro

Composition rules:
- Cinematic golden-hour or blue-hour lighting unless otherwise specified
- Truck takes 60-70% of the frame, fills it with attitude
- Shallow background depth-of-field, never busy
- Wet asphalt or hard-packed dirt under the wheels for visual richness
- Camera angle as specified per vehicle — usually low, three-quarter
- Output a single landscape-orientation photograph (16:9 or wider)
- No text, no watermarks, no captions, no logos in the frame
- The reference image attached shows Stehlen's signature chase rack — replicate the exact hex-mesh + amber LED + matte-black geometry on the truck's bed-mounted rack`;

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
  spec: (typeof VEHICLES)[number],
  brandReferenceBytes: Buffer | null,
): Promise<void> {
  const prompt = `${SYSTEM_PROMPT}

Vehicle: ${spec.vehicle}
Setting: ${spec.setting}
Stehlen parts to feature on the truck: ${spec.parts}

Generate the photograph now.`;

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
  const ext = out.inlineData.mimeType.includes("png") ? "png" : "jpg";
  const outPath = path.join(OUT_DIR, `${spec.slug}.${ext}`);
  await fs.writeFile(outPath, bytes);
  console.log(
    `✓ ${spec.slug.padEnd(22)} ${spec.vehicle.slice(0, 60).padEnd(60)} → ${outPath.replace(ROOT + "/", "")}`,
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
  const list = only ? VEHICLES.filter((v) => v.slug === only) : VEHICLES;
  if (list.length === 0) {
    console.error(`No vehicles match --only=${only}`);
    return 1;
  }

  console.log(`Generating ${list.length} hero photo(s) via ${GAS_MODEL}…\n`);
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
