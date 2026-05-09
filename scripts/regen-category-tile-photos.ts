#!/usr/bin/env -S node --experimental-strip-types
/**
 * Cycle 14AP — generate Stehlen-brand tile photos for the SHOP BY CATEGORY
 * grid on the home page.
 *
 * Owner feedback: the existing /public/images/categories/*.jpg files are
 * warehouse-style product shots on near-white backgrounds. They look
 * generic / off-brand against the new warm-cream section ladder and
 * compete with — instead of complement — the matte-black tactical hero.
 *
 * This script generates a fresh set with the Stehlen visual language:
 *   - matte-black tactical product as hero subject
 *   - moody dark studio background (charcoal, not white)
 *   - amber LED accent where the product family supports it
 *   - hex-mesh visual signature where present in the SKU family
 *   - product-only (no truck context) so each tile reads as the part
 *
 * Output filenames match what /lib/catalog/index.ts CATEGORY_HERO_IMAGE
 * already references — we OVERWRITE the existing .jpg files so the home
 * grid + collection hero both pick the new asset up automatically.
 *
 * Auth: GEMINI_API_KEY (.env.local).
 *
 * Usage:
 *   node scripts/regen-category-tile-photos.ts
 *   node scripts/regen-category-tile-photos.ts --only=tonneau-covers
 */
import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "public", "images", "categories");
const BRAND_HERO = path.join(ROOT, "public", "images", "hero-stehlen.jpg");

const GAS_MODEL =
  process.env.GEMINI_IMAGE_MODEL || "gemini-3-pro-image-preview";
const GAS_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GAS_MODEL}:generateContent`;

// Each entry maps to the existing CATEGORY_HERO_IMAGE filename so the
// site picks up the new asset without code changes. The `subject` is the
// product-only hero. The `accent` line names the brand visual signature
// (hex mesh / amber LED / etc.) to anchor each shot to the same family.
const CATEGORIES: {
  filename: string;
  category: string;
  subject: string;
  accent: string;
}[] = [
  {
    filename: "TONNEAU COVER - LOCK & ROLL UP.jpg",
    category: "Tonneau Covers",
    subject:
      "a matte-black soft roll-up tonneau cover, partially unrolled across a truck-bed silhouette so the customer reads 'bed-mounted snap-on cover'. Tactical hex-pattern stitching visible on the underside flap. Lock latch on the rolled end has a subtle amber LED indicator.",
    accent: "matte-black vinyl with hex-bolt aluminum end caps; one amber LED indicator on the lock latch",
  },
  {
    filename: "HITCH STEPS.jpg",
    category: "Trailer Hitches",
    subject:
      "a matte-black Class IV trailer hitch receiver with a tactical hex-shape stamped into the receiver tube. Welds visible along the seam. Rear of a truck silhouette barely visible behind, dark and out of focus.",
    accent: "tactical-grade matte-black powder coat with hex-mesh detail on the safety chain anchors",
  },
  {
    filename: "BULL BAR - ADVANCE SERIES.jpg",
    category: "Bull Guards & Grille Guards",
    subject:
      "a matte-black tubular bull guard with skid plate and integrated 30-inch LED light bar across the top crossmember. Hex-mesh insert behind the front grille opening. Mounted to the front of an anonymous matte-black truck silhouette.",
    accent: "amber LED bezel on the LED bar housing; hex-mesh inserts in the guard openings",
  },
  {
    filename: "FRONT GRILLES.jpg",
    category: "Front Grilles",
    subject:
      "a matte-black aftermarket front grille with hex-mesh insert and a row of three tactical amber LED markers across the upper crossbar. Standalone product shot, slight three-quarter angle so the depth of the mesh is visible.",
    accent: "hex-mesh insert with amber LED markers across the top edge — match the brand hero's tactical visual language",
  },
  {
    filename: "FULL LED PROJECTOR HEADLIGHTS.jpg",
    category: "Headlights",
    subject:
      "a pair of matte-black housing LED projector headlights with a halo-DRL ring and a stacked-element projector inside. Powered on, casting a warm amber glow. Floating against a dark gradient background.",
    accent: "matte-black housing with amber DRL halo and projector lens; clean tactical bezel detailing",
  },
  {
    filename: "MUD FLAPS.jpg",
    category: "Truck Bed Mats (used as floor-mat / mud-flap fallback)",
    subject:
      "a matte-black heavy-duty rubber bed mat lying flat on a dark studio floor. Aggressive geometric channel pattern across the surface. Slight angled view so the texture and the cut-to-fit edge are both visible.",
    accent: "matte-black rubber with deep angular channel pattern; one corner curled up to show thickness",
  },
  {
    filename: "MODULAR STYLE RUNNING BOARDS.jpg",
    category: "Running Boards & Side Steps",
    subject:
      "a matte-black modular running board with hex-pattern non-slip step surface and integrated amber LED courtesy light underneath. Mounted along the rocker panel of an anonymous matte-black truck silhouette, dark side lighting.",
    accent: "amber LED underneath; hex-pattern non-slip tread surface",
  },
  {
    filename: "ROOF RACKS.jpg",
    category: "Roof Racks & Baskets",
    subject:
      "a matte-black low-profile roof rack with hex-mesh side rails and a 40-inch LED light bar mounted at the front edge, glowing warm amber. Mounted to the roof of an anonymous matte-black truck or SUV silhouette.",
    accent: "amber LED light bar; hex-mesh rail panels",
  },
  {
    filename: "CHASE RACKS.jpg",
    category: "Chase Racks & Sport Bars",
    subject:
      "the Stehlen brand-hero chase rack: a matte-black tactical bed-mounted structure with hex-mesh side panels, amber LED corner markers, and a roof-height LED light bar across the top. Mounted in the bed of an anonymous matte-black truck. Match the brand-hero reference image EXACTLY in geometry and finish.",
    accent: "EXACT match to the brand hero — hex mesh + amber LED + matte black",
  },
  {
    filename: "TRUCK BED MOLLE PANELS.jpg",
    category: "MOLLE Panels (also reused for truck-bed-mats)",
    subject:
      "a matte-black MOLLE panel kit mounted to the inside wall of a truck bed. PALS webbing slots cleanly cut in a regular grid, with two amber LED indicators glowing low on the panel. Dark moody bed environment behind, shallow depth of field.",
    accent: "PALS webbing grid; amber LED indicators integrated low",
  },
  {
    filename: "CONSOLE ORGANIZER.jpg",
    category: "Under Seat Storage",
    subject:
      "a matte-black lockable under-seat storage organizer, three-quarter angle, lid open showing molded compartments inside. Tactical hex-pattern texture on the lid surface. One amber LED inside the open compartment lighting up the contents subtly.",
    accent: "hex-pattern lid texture; amber LED interior accent",
  },
  {
    filename: "RUBBER FLOOR MATS.jpg",
    category: "Floor Mats",
    subject:
      "a matte-black heavy-duty molded rubber floor mat (driver-side), three-quarter angle, raised channel ridges to capture water and dirt. Tactical hex-pattern detail along the heel pad. Dark studio floor.",
    accent: "deep channel ridges; hex-pattern heel pad",
  },
];

const SYSTEM_PROMPT = `You are a senior automotive product photographer creating PREMIUM TILE PHOTOS for the SHOP BY CATEGORY grid on Stehlen Auto's home page. Stehlen is a premium-tactical truck-accessories brand — think Yeti / Filson / Tactical Distributors, NOT country-music or lifted-bro.

Visual language (non-negotiable across the entire 12-tile set):
- Matte-black powder-coated finish on every aftermarket part
- Hex-mesh / hex-pattern visual signature where the part allows
- Amber LED accent on parts that can carry one — small, restrained, ONE per tile max
- Angular, structural geometry — never curvy, never chrome
- Dark moody studio environment — charcoal/near-black background with subtle gradient or rim light, NEVER pure white, NEVER bright outdoor scenes
- Cinematic key light from camera-left, soft fill from camera-right, gentle rim light separating product from background
- Each tile must clearly show ONE product type — the customer needs to instantly read the category from the silhouette

Composition:
- Square-ish 4:3 ratio (these are tiles in a grid)
- Product takes 70-80% of frame
- Slight three-quarter angle unless otherwise specified
- Shallow depth of field — background falls off
- No text, no captions, no logos in the frame, no watermarks
- Reference image attached: Stehlen's signature chase rack (hex mesh + amber LED + matte black) — use it as the visual anchor for finish and tactical detailing

Output a single landscape product photograph, photorealistic, magazine-ad quality.`;

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
  const prompt = `${SYSTEM_PROMPT}

Category: ${spec.category}
Subject (product-only hero): ${spec.subject}
Brand-anchor accent: ${spec.accent}

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
  const outPath = path.join(OUT_DIR, spec.filename);
  await fs.writeFile(outPath, bytes);
  console.log(
    `✓ ${spec.filename.padEnd(46)} → ${outPath.replace(ROOT + "/", "")}`,
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
  const list = only
    ? CATEGORIES.filter((c) => c.filename.toLowerCase().includes(only.toLowerCase()))
    : CATEGORIES;
  if (list.length === 0) {
    console.error(`No category matches --only=${only}`);
    return 1;
  }

  console.log(
    `Generating ${list.length} category-tile photo(s) via ${GAS_MODEL}…\n`,
  );
  let failed = 0;
  for (const spec of list) {
    try {
      await generateOne(apiKey, spec, brandReferenceBytes);
    } catch (err) {
      console.error(
        `✗ ${spec.filename.padEnd(46)} ${err instanceof Error ? err.message : err}`,
      );
      failed++;
    }
    await new Promise((r) => setTimeout(r, 1200));
  }

  console.log(`\nDone. ${list.length - failed} succeeded, ${failed} failed.`);
  return failed > 0 ? 1 : 0;
}

main().then((code) => process.exit(code));
