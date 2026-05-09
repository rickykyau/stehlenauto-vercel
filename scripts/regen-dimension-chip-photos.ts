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
  // ─── BED LENGTH (6 options) ─────────────────────────────────────────
  // Cycle 14AP-fix6 (owner): the prior pass produced mixed orientations
  // (some left-facing, some right-facing), mixed truck models, mixed
  // backgrounds, and AI artifacts (2 heads / 2 tails). Locking down:
  //
  //   * Vehicle: ONE anonymous matte-black American pickup, no badges,
  //     no manufacturer logos, no light bars, completely stock.
  //   * Orientation: ALL chips face LEFT (cab on the left edge of the
  //     frame, bed extends to the RIGHT). Customer's eye learns to read
  //     bed length on the right half of every card.
  //   * Camera: pure side profile, dead-level, eye-line height, single
  //     focal length (~85mm equivalent — no wide-angle distortion),
  //     identical distance from vehicle.
  //   * Background: PURE WHITE seamless studio cyclorama, no horizon,
  //     no ground plane shadow other than a soft contact shadow under
  //     the tires.
  //   * Lighting: single soft top-down key light, no rim lights, no
  //     amber accents, no environmental light. Flat product-photography
  //     style — the BED RATIO is the only thing that should vary.
  //   * Crop: vehicle takes 80% of frame width, 8% padding top/bottom,
  //     5% padding left/right.
  //
  // The bed-vs-cab ratio is the only visual differentiator. Each chip
  // also gets an SVG measurement overlay applied client-side in the
  // picker UI, so even if Gemini's photo is approximate the dimension
  // is reinforced numerically.
  {
    slug: "bed-length-4-6-bed",
    subject:
      "ONE anonymous matte-black American pickup truck, no badges, no logos, regular cab (2-door), with a 4.6-foot truck bed — clearly the SHORTEST configuration. Cab + 2-door area takes ~60% of the side profile width, bed takes ~40%. Stock factory wheels. No light bars, no roof racks, no aftermarket parts.",
    framing: "PURE LEFT SIDE PROFILE — vehicle FACING LEFT (cab on LEFT edge of frame, bed extends to the RIGHT). Dead-level camera at vehicle eye-line. Pure white seamless cyclorama background, soft top-down studio key light only. Vehicle 80% of frame width. Soft contact shadow under tires.",
    intent: "Shortest bed — bed takes ~40% of side profile. The right-half of the chip is the bed; the left-half is the cab + door. Same truck silhouette as the other 5 chips.",
  },
  {
    slug: "bed-length-5-bed",
    subject:
      "EXACT SAME anonymous matte-black American pickup truck as the other bed-length chips, no badges, no logos, regular cab (2-door), now with a 5-foot truck bed. Cab + 2-door area takes ~58% of side profile, bed takes ~42%. Same wheels, same colour, same trim — only the bed length has changed.",
    framing: "IDENTICAL framing to the other bed-length chips: PURE LEFT SIDE PROFILE, vehicle facing LEFT, cab on LEFT edge, bed extends RIGHT. Pure white seamless cyclorama, same lighting, same camera distance, same eye-line.",
    intent: "Slightly longer bed than 4.6'. Bed-to-cab ratio shifts ~2% bigger. Same truck.",
  },
  {
    slug: "bed-length-5-5-bed",
    subject:
      "EXACT SAME anonymous matte-black American pickup truck silhouette, regular cab (2-door), now with a 5.5-foot truck bed. Cab takes ~55% of profile, bed takes ~45%. Same vehicle, same wheels, same paint — only the bed dimension changes.",
    framing: "IDENTICAL framing — pure left side profile, vehicle facing LEFT, white cyclorama, same lighting and camera as all other bed-length chips.",
    intent: "Most-common short-bed option. Bed reads as a meaningful step longer than 5'.",
  },
  {
    slug: "bed-length-6-bed",
    subject:
      "EXACT SAME anonymous matte-black American pickup truck silhouette, regular cab (2-door), now with a 6-foot truck bed. Cab takes ~52% of profile, bed takes ~48%. Same everything else.",
    framing: "IDENTICAL framing — pure left side profile, vehicle facing LEFT, white cyclorama.",
    intent: "Mid-length bed. Customer reads it as roughly bed = cab.",
  },
  {
    slug: "bed-length-6-5-bed",
    subject:
      "EXACT SAME anonymous matte-black American pickup truck silhouette, regular cab (2-door), now with a 6.5-foot truck bed. Cab takes ~48% of profile, bed takes ~52% — bed slightly LONGER than cab now. Same vehicle, same wheels, same paint.",
    framing: "IDENTICAL framing — pure left side profile, vehicle facing LEFT, white cyclorama.",
    intent: "Standard half-ton bed. Bed becomes the visually larger half — the tipping point in the comparison strip.",
  },
  {
    slug: "bed-length-8-bed",
    subject:
      "EXACT SAME anonymous matte-black American pickup truck silhouette, regular cab (2-door), now with a noticeably LONG 8-foot truck bed. Cab takes ~38% of profile, bed takes ~62% — bed clearly DOMINATES the side profile. Same vehicle.",
    framing: "IDENTICAL framing — pure left side profile, vehicle facing LEFT, white cyclorama, same lighting.",
    intent: "Longest bed. Bed is visually almost twice the width of the cab — customer immediately reads it as the LONGEST option in the strip.",
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

  // ─── FRONT-GRILLE POC (Cycle 14AP-fix6 — owner round 2) ─────────────
  // Round 1 came back with mixed orientations (BASE faced right, MID
  // faced left), mixed truck models (HEAVY-DUTY rendered a CHASE RACK
  // not a truck — Gemini got confused by "Raptor-style"), and a
  // STEHLEN wordmark on the grille that owner specifically didn't want
  // ("our actual products do not have it").
  //
  // Locked-down round 2:
  //   * Vehicle: 2024 Ford F-150 SuperCrew 4-door — IDENTICAL silhouette
  //     across all 6 photos. NO mention of "Raptor" / "Trail Boss" /
  //     "TRD Pro" / "Rebel" — those words trip Gemini into rendering
  //     completely different vehicles.
  //   * Angle: 3/4 front-side, FACING LEFT — vehicle is angled so the
  //     grille is visible on the LEFT side of the frame, body extends
  //     to the RIGHT. ALL 6 use this same angle, same camera height,
  //     same camera distance.
  //   * Background: pure white seamless studio cyclorama, soft top-
  //     down key light, soft contact shadow under tires only. NO
  //     environment, NO mountains, NO desert.
  //   * Trim diff: paint colour + bumper finish + wheel style ONLY.
  //     Body shape, stance, ride height, and camera framing all
  //     identical so the only thing that changes between trim levels
  //     is the colour story and the trim-package surface treatment.
  //   * Grille (Stehlen view): matte-black hex-mesh aftermarket grille
  //     replacing the factory chrome surround. NO Stehlen wordmark.
  //     NO embossed branding. Just a matte-black hex-mesh face — what
  //     the actual product looks like.
  //   * Within each trim pair (base-stock + base-stehlen), the camera
  //     position, lighting, paint, wheels, and bumper are IDENTICAL.
  //     The ONLY visual difference is the grille area. Customer toggles
  //     and sees a true 1:1 swap.
  {
    slug: "front-grille-trim-base-stock",
    subject:
      "2024 Ford F-150 SuperCrew 4-door pickup truck in BASE / XL work-truck trim. Oxford white paint. Factory chrome front bumper. Factory chrome-surround grille with horizontal silver bars. Factory 17-inch steel wheels with hub caps. Standard ride height (no lift). NO aftermarket parts of any kind. NO chase rack, NO bed accessories, NO roof rack, NO light bar.",
    framing: "Three-quarter front-side view, vehicle FACING LEFT — grille on the LEFT half of the frame, body extending to the RIGHT. Eye-level camera, ~85mm focal length (no wide-angle distortion). VEHICLE TAKES EXACTLY 75% OF THE FRAME WIDTH — centered horizontally, with 12.5% empty padding on the LEFT and 12.5% on the RIGHT. Vertical: vehicle takes 65% of frame height, centered vertically, with 17.5% padding above the roof and 17.5% below the tires. Pure flat white background — NO cyclorama curve visible, NO wall-to-floor joint, NO horizon line, NO environment, NO ceiling, NO shadows other than a soft contact shadow directly under the tires. Single soft top-down studio key light. The frame must look like a clean catalog product shot floating on white, not a studio room.",
    intent: "Same Ford F-150 silhouette as the other two trims; only paint + bumper + wheels differ. Customer reads 'BASE / WORK trim — chrome bumper, steel wheels, white paint'.",
  },
  {
    slug: "front-grille-trim-base-stehlen",
    subject:
      "EXACT SAME 2024 Ford F-150 SuperCrew 4-door in BASE / XL trim — oxford white paint, chrome bumper, factory steel wheels — BUT with a matte-black hex-mesh aftermarket front grille installed in place of the factory chrome-surround grille. Hex-mesh has a clean honeycomb pattern, no badging, no wordmark, no LED markers, no decoration. Just a matte-black hex grille face. Everything else about the vehicle is byte-for-byte identical to the BASE stock photo: same angle, same paint, same bumper, same wheels, same lighting.",
    framing: "IDENTICAL framing, camera position, lighting, vehicle position, paint, bumper, and wheels to front-grille-trim-base-stock. The customer must be able to flip back and forth between the two photos and see ONLY the grille change.",
    intent: "Customer toggles from STOCK and sees what their white work-trim F-150 looks like with a matte-black hex-mesh grille bolted on. The chrome-to-black grille swap is the only visible change.",
  },
  {
    slug: "front-grille-trim-mid-stock",
    subject:
      "2024 Ford F-150 SuperCrew 4-door pickup truck in MID-TIER / XLT trim. Atlas blue metallic paint. Factory body-color (blue) front bumper. Factory body-color grille with chrome horizontal bars. Factory 18-inch alloy wheels. Standard ride height. NO aftermarket parts.",
    framing: "IDENTICAL framing to front-grille-trim-base-stock — three-quarter front-side view, vehicle facing LEFT, grille on LEFT half of frame, eye-level camera, same focal length. VEHICLE TAKES EXACTLY 75% OF THE FRAME WIDTH, centered horizontally with 12.5% padding left and right. Same vertical centering. Pure flat white background — NO cyclorama curve, NO wall-to-floor joint, NO horizon, NO environment, NO ceiling. Soft contact shadow under tires only.",
    intent: "Same F-150 silhouette as BASE; only paint colour + bumper finish + wheel style change. Customer reads 'XLT / MID trim — blue paint, body-color bumper, alloy wheels'. CRITICAL: vehicle must occupy the EXACT SAME 75% frame width as the BASE chip — the white BASE truck appeared smaller in the previous round because it had more empty padding around it. Match the BASE chip zoom level pixel-precisely.",
  },
  {
    slug: "front-grille-trim-mid-stehlen",
    subject:
      "EXACT SAME 2024 Ford F-150 SuperCrew XLT — atlas blue metallic, body-color bumper, alloy wheels — BUT with the SAME matte-black hex-mesh aftermarket grille from the BASE stehlen photo installed in place of the factory grille. Hex-mesh face, no badging, no wordmark, no LEDs. Same grille design as base-stehlen so the toggle reads consistently.",
    framing: "IDENTICAL framing, camera position, lighting, paint, bumper, and wheels to front-grille-trim-mid-stock. Only the grille has been swapped to matte-black hex-mesh.",
    intent: "Mid-trim customer sees their blue XLT F-150 with the matte-black hex grille bolted on.",
  },
  {
    slug: "front-grille-trim-heavy-duty-stock",
    subject:
      "2024 Ford F-150 SuperCrew 4-door pickup truck in HEAVY-DUTY / OFF-ROAD trim package (Lariat / Tremor styling — NOT Raptor, NOT Trail Boss, NOT Rebel). Agate black metallic paint. Blacked-out front bumper. Factory matte-black grille with chrome horizontal bars and Ford blue-oval badge. Factory 18-inch matte-black off-road wheels with all-terrain tires. Slight 2-inch factory lift. NO chase rack, NO bed accessories, NO roof rack — this is JUST the truck.",
    framing: "IDENTICAL framing to front-grille-trim-base-stock — three-quarter front-side view, vehicle facing LEFT, grille on LEFT half of frame, eye-level camera, pure white seamless studio cyclorama, same lighting. Vehicle takes the same 80% of frame width as the other trims.",
    intent: "Same F-150 silhouette as BASE and MID; only paint + bumper + wheels change. Customer reads 'HEAVY-DUTY / off-road trim — black-on-black, off-road wheels, slightly lifted'. The truck must be RECOGNIZABLY THE SAME F-150, not a different vehicle. CRITICAL: vehicle must occupy the EXACT SAME 75% frame width as the BASE and MID chips. All three trim chips MUST share the same zoom level so the customer sees one truck silhouette in three colour stories, not three different truck sizes.",
  },
  {
    slug: "front-grille-trim-heavy-duty-stehlen",
    subject:
      "EXACT SAME 2024 Ford F-150 SuperCrew heavy-duty trim — agate black, blacked-out bumper, matte-black off-road wheels, slight factory lift — BUT with the SAME matte-black hex-mesh aftermarket grille from the BASE and MID stehlen photos installed. Hex-mesh face, no badging, no wordmark, no LEDs. Same grille design across all 3 stehlen photos for visual consistency. The black-on-black aesthetic blends the new grille seamlessly with the truck.",
    framing: "IDENTICAL framing, camera position, lighting, paint, bumper, and wheels to front-grille-trim-heavy-duty-stock. Only the grille has been swapped to matte-black hex-mesh.",
    intent: "Premium-trim customer sees their black F-150 with the matte-black hex grille bolted on — the all-black look is the strongest visual sell.",
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
  // Cycle 14AP-fix8 (owner): for "-stehlen" front-grille variants, use
  // image-EDIT mode — read the corresponding "-stock" photo from disk
  // and ask Gemini to ONLY swap the grille, keeping the rest of the
  // photo byte-identical. Two text-to-image calls cannot produce
  // identical output (Gemini is stochastic); image-edit is the only
  // way to get a true 1:1 toggle pair.
  const isStehlenVariant = spec.slug.endsWith("-stehlen");
  let editBaseBytes: Buffer | null = null;
  if (isStehlenVariant) {
    const stockSlug = spec.slug.replace(/-stehlen$/, "-stock");
    const stockPath = path.join(OUT_DIR, `${stockSlug}.jpg`);
    try {
      editBaseBytes = await fs.readFile(stockPath);
    } catch {
      throw new Error(
        `image-edit base photo not found at ${stockPath} — generate the -stock variant first`,
      );
    }
  }

  // Cycle 14AP-fix9 (owner): for the front-grille MID and HEAVY-DUTY stock
  // variants, lock the camera framing to whatever the BASE stock photo
  // produced — pass BASE as a "framing reference" so Gemini matches the
  // zoom level / camera position / background crop instead of drifting.
  // This addresses owner's complaint that the white BASE truck looked
  // smaller than the other two trims.
  let framingReferenceBytes: Buffer | null = null;
  const NEEDS_BASE_FRAMING = new Set([
    "front-grille-trim-mid-stock",
    "front-grille-trim-heavy-duty-stock",
  ]);
  if (NEEDS_BASE_FRAMING.has(spec.slug)) {
    const basePath = path.join(OUT_DIR, "front-grille-trim-base-stock.jpg");
    try {
      framingReferenceBytes = await fs.readFile(basePath);
    } catch {
      // No base yet — generate without framing reference. Caller should
      // generate base FIRST so this branch can attach the reference.
      framingReferenceBytes = null;
    }
  }

  const prompt = isStehlenVariant
    ? `EDIT MODE: this photo is the BASE. You are editing it. Replace the factory front grille on the truck with a matte-black hex-mesh aftermarket grille (clean honeycomb pattern, no badging, no wordmark, no LED markers, no decoration — just a matte-black hex grille face).

ABSOLUTE REQUIREMENTS — keep these IDENTICAL to the input photo:
- The vehicle (same Ford F-150, same trim, same paint colour)
- The bumper (same finish, same shape, same position)
- The wheels and tires (same exact wheels, same exact tires)
- The camera angle, position, and focal length
- The lighting (same key light direction, same intensity, same shadows)
- The background (pure white seamless cyclorama — same)
- The vehicle's position in the frame (same composition, same crop)
- Every other body panel, badge, mirror, headlight, fender — UNCHANGED

The ONLY pixels that should change are inside the front grille opening. The customer must be able to flip back and forth between this output and the input and see ONLY the grille difference.

Output: the edited photo as a 3:2 landscape image.`
    : framingReferenceBytes
      ? `${SYSTEM_PROMPT}

You are generating a NEW photo, but you must MATCH the framing of the attached reference image PIXEL-PRECISELY. The reference image is a Ford F-150 in BASE trim shot for a comparison-chip set; this photo will sit next to it in a 3-chip row, and the customer's eye must read all 3 chips as ONE truck silhouette in three colour stories — NOT three different truck sizes.

MATCH FROM REFERENCE — these MUST be identical:
- Camera angle (three-quarter front-side, vehicle facing LEFT)
- Camera height (eye-level)
- Focal length and distance from vehicle
- Vehicle position in frame (centered horizontally and vertically)
- Vehicle size — the truck must occupy the EXACT SAME percentage of the frame width as in the reference (~75%)
- Background — pure flat white, no cyclorama curve, no environment
- Lighting direction and intensity

DIFFER FROM REFERENCE — these are the trim-specific changes:
${spec.subject}

Framing: ${spec.framing}
Intent: ${spec.intent}

Generate the photo now, matching the reference's framing exactly but with the trim-specific paint / bumper / wheels described above.`
      : `${SYSTEM_PROMPT}

Subject: ${spec.subject}
Framing: ${spec.framing}
Intent (what the customer must instantly read): ${spec.intent}

Generate the photo now.`;

  const parts: GeminiPart[] = [{ text: prompt }];
  if (isStehlenVariant && editBaseBytes) {
    // For edit mode the input photo is the primary content — pass it
    // BEFORE the brand reference so Gemini treats it as the subject.
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: editBaseBytes.toString("base64"),
      },
    });
  }
  if (framingReferenceBytes) {
    // Framing-anchor reference for MID/HEAVY-DUTY stocks — Gemini must
    // match this image's composition, zoom, and lighting.
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: framingReferenceBytes.toString("base64"),
      },
    });
  }
  if (brandReferenceBytes && !isStehlenVariant && !framingReferenceBytes) {
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
