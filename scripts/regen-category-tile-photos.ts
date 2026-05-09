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
      "a matte-black soft roll-up tonneau cover, partially unrolled across a truck-bed silhouette so the customer reads 'bed-mounted snap-on cover'. Tactical hex-pattern stitching visible on the underside flap. Lock latch on the rolled end has a subtle amber LED indicator. The aluminum end cap has a STEHLEN wordmark heat-stamped into it (matching the brand-hero reference) — small but legible.",
    accent: "matte-black vinyl with hex-bolt aluminum end caps; one amber LED indicator on the lock latch; STEHLEN wordmark on aluminum end cap",
  },
  {
    filename: "HITCH STEPS.jpg",
    category: "Trailer Hitches",
    subject:
      "a matte-black Class IV trailer hitch receiver with a tactical hex-shape stamped into the receiver tube. Welds visible along the seam. STEHLEN wordmark laser-etched on the side of the receiver tube facing camera. Rear of a truck silhouette barely visible behind, dark and out of focus.",
    accent: "tactical-grade matte-black powder coat; STEHLEN wordmark laser-etched on receiver tube",
  },
  {
    filename: "BULL BAR - ADVANCE SERIES.jpg",
    category: "Bull Guards & Grille Guards",
    subject:
      "a matte-black tubular bull guard with skid plate and integrated 30-inch LED light bar across the top crossmember. Hex-mesh insert behind the front grille opening. STEHLEN wordmark laser-etched into the lower skid plate, white/silver text on matte black. Mounted to the front of an anonymous matte-black truck silhouette.",
    accent: "amber LED bezel on the LED bar housing; hex-mesh inserts in the guard openings; STEHLEN on skid plate",
  },
  {
    filename: "FRONT GRILLES.jpg",
    category: "Front Grilles",
    subject:
      "a matte-black aftermarket front grille with hex-mesh insert and a row of three tactical amber LED markers across the upper crossbar. STEHLEN wordmark embossed in the lower-center of the grille mesh. Standalone product shot, slight three-quarter angle so the depth of the mesh is visible.",
    accent: "hex-mesh insert with amber LED markers across the top edge; STEHLEN wordmark embossed in lower-center mesh",
  },
  {
    filename: "FULL LED PROJECTOR HEADLIGHTS.jpg",
    category: "Headlights",
    subject:
      "a pair of matte-black housing LED projector headlights with a halo-DRL ring and a stacked-element projector inside. Powered on, casting a warm amber glow. STEHLEN wordmark molded into the lower bezel of each housing. Floating against a dark gradient background.",
    accent: "matte-black housing with amber DRL halo and projector lens; STEHLEN molded into lower bezel",
  },
  {
    filename: "TRUCK BED MAT.jpg",
    category: "Truck Bed Mats — DISTINCT from MOLLE PANELS",
    subject:
      "a matte-black heavy-duty rubber bed mat fitted across the FLOOR of a pickup truck bed, viewed from the open tailgate end. Aggressive geometric channel pattern molded across the surface. The bed walls are visible left and right but in shadow — the mat itself is the hero. STEHLEN wordmark molded into the front edge of the mat near the cab wall, embossed into the rubber so it reads as part of the molding. NO MOLLE panels visible — this is purely the bed-floor mat product.",
    accent: "molded rubber channel pattern; STEHLEN embossed in front edge of mat",
  },
  {
    filename: "MODULAR STYLE RUNNING BOARDS.jpg",
    category: "Running Boards & Side Steps",
    subject:
      "a matte-black modular running board with hex-pattern non-slip step surface and integrated amber LED courtesy light underneath. STEHLEN wordmark laser-etched into the step pad surface, silver-on-matte-black. Mounted along the rocker panel of an anonymous matte-black truck silhouette, dark side lighting.",
    accent: "amber LED underneath; hex-pattern non-slip tread; STEHLEN laser-etched in step pad",
  },
  {
    filename: "ROOF RACKS.jpg",
    category: "Roof Racks & Baskets",
    subject:
      "a matte-black low-profile roof rack with hex-mesh side rails and a 40-inch LED light bar mounted at the front edge, glowing warm amber. STEHLEN wordmark laser-etched on the side rail facing camera. Mounted to the roof of an anonymous matte-black truck or SUV silhouette.",
    accent: "amber LED light bar; hex-mesh rail panels; STEHLEN on side rail",
  },
  {
    filename: "CHASE RACKS.jpg",
    category: "Chase Racks & Sport Bars",
    subject:
      "the Stehlen brand-hero chase rack: a matte-black tactical bed-mounted structure with hex-mesh side panels, amber LED corner markers, and a roof-height LED light bar across the top. STEHLEN wordmark prominently displayed on the hex-mesh side panel facing camera (matching the brand hero EXACTLY — this is the showcase product for the brand mark). Mounted in the bed of an anonymous matte-black truck.",
    accent: "EXACT match to the brand hero — hex mesh + amber LED + matte black + STEHLEN wordmark on hex panel",
  },
  {
    filename: "TRUCK BED MOLLE PANELS.jpg",
    category: "MOLLE Panels — DISTINCT from bed mats",
    subject:
      "a matte-black MOLLE panel kit mounted to the inside WALL of a truck bed (the vertical bed-side panel, NOT the floor). PALS webbing slots cleanly cut in a regular grid, with two amber LED indicators glowing low on the panel. STEHLEN wordmark laser-etched into the corner mounting plate of the panel. Dark moody bed environment behind, shallow depth of field. NO floor mat visible.",
    accent: "PALS webbing grid; amber LED indicators; STEHLEN on corner mounting plate",
  },
  {
    filename: "ACCESSORIES.jpg",
    category: "Accessories — multi-item vignette (replaces under-seat-storage)",
    subject:
      "a curated tactical vignette of multiple Stehlen cab accessories arranged on a dark studio surface: a matte-black lockable under-seat organizer (lid open showing molded compartments), a matte-black phone/tablet dash mount, a USB charging port plate with amber LED, and a small console-tray insert. Items grouped tightly together so the customer reads 'collection of cab accessories'. STEHLEN wordmark visible on at least two items (heat-stamped on organizer lid + laser-etched on the dash mount). Single warm key light from upper-left.",
    accent: "matte-black multi-item collection with amber LED on charging port; STEHLEN wordmark on organizer lid and dash mount",
  },
  {
    filename: "RUBBER FLOOR MATS.jpg",
    category: "Floor Mats",
    subject:
      "a matte-black heavy-duty molded rubber floor mat (driver-side), three-quarter angle, raised channel ridges to capture water and dirt. STEHLEN wordmark molded into the heel pad — embossed into the rubber so it reads as part of the molding. Dark studio floor.",
    accent: "deep channel ridges; STEHLEN embossed in heel pad",
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
