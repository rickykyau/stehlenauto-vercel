#!/usr/bin/env -S node --experimental-strip-types
/**
 * STAGE 1 — Stehlen Tacoma Tonneau + LED Spot: Seed Still Generation
 *
 * Director: Carter Voss
 * Brief: Generate 5 photoreal seed frames for Kling Omni 3 image-to-video.
 * Lock accuracy on the 3rd-gen Tacoma body BEFORE spending Kling budget.
 *
 * Seeds:
 *   SEED-A  Macro cover surface + groove seam, raking tungsten
 *   SEED-B  Hero: 3/4 rear Tacoma Double Cab, matte cover closed, driveway
 *   SEED-C  Interior bed shot: 8 discrete white LED puck modules lit
 *   SEED-D  Low side-rail angle: aluminum rail + latch hardware + rubber seal
 *   SEED-E  SEED-B variant: blue-hour parking structure, sodium key light
 *
 * Vehicle color choice: Cement Gray (lower saturation, resists Kling
 * over-saturation, reads premium not bro — Carter's call, consistent B+E).
 *
 * Usage:
 *   node scripts/gen-spot-seeds.ts
 *   node scripts/gen-spot-seeds.ts --only=seed-b
 *   node scripts/gen-spot-seeds.ts --only=seed-b --attempt=2
 *
 * Outputs: public/images/spot-seeds/seed-{a,b,c,d,e}[-attempt-N].{jpg,png}
 */
import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "public", "images", "spot-seeds");
const REFS_DIR = "/tmp/tacoma-tonneau-refs";

const GAS_MODEL =
  process.env.GEMINI_IMAGE_MODEL || "gemini-3-pro-image-preview";
const GAS_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GAS_MODEL}:generateContent`;

// ---------------------------------------------------------------------------
// Vehicle accuracy briefing injected into every prompt that shows the body.
// The 3rd-gen (N300) tail lamp identification is the single most important
// accuracy item. Written in declarative language Gemini can follow.
// ---------------------------------------------------------------------------
const TACOMA_BODY_BRIEF = `
VEHICLE ACCURACY (READ CAREFULLY — THIS OVERRIDES EVERYTHING ELSE):
The truck is a 2016-2023 Toyota Tacoma 3rd generation (N300 platform), Double Cab (4-door, NOT Access Cab), short 5-foot bed. Stock ride height. Factory-style alloy wheels, NOT oversized, NOT lifted.

TAIL LAMP — THE SINGLE MOST CRITICAL DETAIL:
The 3rd-gen Tacoma tail lamp is a compact, angular cluster with a distinctive boomerang/C-shaped lower element. The housing wraps the outer corner. There is a lower horizontal C-element that curves around the bottom. The lamp is relatively compact and angular. It is NOT a vertical rectangle bar. It is NOT a wide horizontal stack (not F-150 style). It is NOT a tall Tundra-style lamp. It is specifically the angular boomerang-C cluster from the 2016-2023 Tacoma.

TACOMA NAME/BADGE: The tailgate reads "TACOMA" in raised block letters across the center of the gate. The Toyota oval badge is on the tailgate. The bed sides show "Tacoma" script in small lettering.

SHORT BED: The 5-foot short bed is compact — shorter than the cab length. The ratio of cab to bed is roughly 1:0.75. Do NOT make the bed long like a full-size truck.

DOUBLE CAB: Four full-size doors. NOT a pickup with tiny rear doors.

COLOR: Cement Gray — a flat, low-saturation warm-gray paint. NOT silver metallic, NOT bright. Muted, almost concrete-colored.

DO NOT put this cover on an F-150, Tundra, Silverado, or any vehicle other than a 3rd-gen Tacoma Double Cab.
`.trim();

// ---------------------------------------------------------------------------
// Product accuracy briefing for the tonneau cover — injected into all shots
// that show the cover surface.
// ---------------------------------------------------------------------------
const COVER_BRIEF = `
TONNEAU COVER ACCURACY:
The cover is a 3-panel hard tri-fold tonneau cover in matte black.
- Surface finish: matte black with a fine leatherette/granular texture. NOT glossy. NOT smooth plastic. NOT mirror-like. The texture is fine grain like leather-grain vinyl.
- Panel count: exactly 3 panels. Each panel is rigid (hard composite).
- Groove lines: 4 parallel raised groove lines run across each panel width (perpendicular to bed length), creating a structured grid appearance.
- Side rails: low-profile aluminum extrusions, near-flush at the bed rail height, running the length of the bed on both sides. Matte black finish matching the panels.
- Panel seams: where two panels meet there is a rubber weather-seal strip. Seams are tight and precise.
- Latch: manual latch hardware at the rear panel, near the tailgate. Simple matte black lever or pull mechanism.
- When closed: the cover sits flush or slightly above the bed rail. It is flat when closed — NOT domed, NOT tent-shaped.
`.trim();

// ---------------------------------------------------------------------------
// LED accuracy briefing — injected into SEED-C and any other LED shots.
// ---------------------------------------------------------------------------
const LED_BRIEF = `
LED LIGHT ACCURACY — CRITICAL:
The LED kit has exactly 8 discrete rectangular puck modules. Each module is a small black rectangle approximately 2 inches wide x 1.5 inches tall x 0.5 inches deep, with a white LED lens face.

LAYOUT: Modules mount to the underside of the tonneau cover rails in a perimeter pattern — approximately 3 across the front (cab-side) rail, 2 on each side rail, and 3 across the rear (tailgate-side) rail. Connected by thin black wire.

LIGHT OUTPUT: Each puck emits a bright, cool-white light (approximately 5500K). The light is DIRECTIONAL — it casts a distinct cone downward onto the bed liner below each puck.

LIGHT SCATTER: On the rough charcoal bed liner, each puck creates a separate circular hotspot with a natural falloff. The 8 hotspots are SEPARATE — they do NOT blend into one continuous band of light. There are visible dark gaps between the hotspot cones.

DO NOT GENERATE: a continuous LED strip. Do NOT generate a light bar. Do NOT generate amber/yellow/blue LEDs. Do NOT generate even/uniform lighting across the whole bed floor. The whole point is 8 separate light pools.
`.trim();

// ---------------------------------------------------------------------------
// Seed definitions
// ---------------------------------------------------------------------------
type RefKey =
  | "hero-cover"
  | "led-bar-1"
  | "led-bar-2"
  | "combo"
  | "cover-detail-3"
  | "cover-detail-4"
  | "tacoma-body-rear"    // Toyota press photo — body shape anchor
  | "tacoma-body-side"    // Toyota press photo — proportions anchor
  | "tacoma-bed-anchor";  // 3rd-gen Tacoma short bed interior, tailgate-open, showing prominent inner-fender wheel-well humps — body-accuracy anchor for SEED-C

interface SeedSpec {
  id: string;
  label: string;
  refs: RefKey[];
  prompt: string;
  negativePrompt: string;
}

const SEEDS: SeedSpec[] = [
  // -------------------------------------------------------------------------
  // SEED-A: Extreme macro of the matte leatherette cover surface + groove seam
  // -------------------------------------------------------------------------
  {
    id: "seed-a",
    label: "Macro — cover surface + groove seam, raking tungsten",
    refs: ["hero-cover", "combo"],
    prompt: `
You are a commercial product photographer. Generate a single photorealistic macro photograph for a truck accessory TV advertisement.

SUBJECT:
Close-up extreme macro of a matte black hard tonneau cover surface. The frame fills entirely with the cover panel surface — no vehicle body visible, no background, no sky. The cover panel takes 100% of the frame.

${COVER_BRIEF}

CAMERA:
Macro lens, 100mm equivalent, very shallow depth of field. Focus point is at the center-left of the frame where a raised groove line crosses the panel. The far right third of the frame softly defocuses. Camera is positioned at a low grazing angle — approximately 20 degrees above the surface plane, so you see the panel surface texture in detail with the groove running diagonally through the frame.

LIGHTING:
Single warm tungsten key light raking from the LEFT at a shallow angle (approximately 15 degrees above the surface). The raking light reveals the fine leatherette grain texture of the matte surface. The raised groove lines cast short hard shadows toward the right side, creating strong tactile definition. No fill light. Deep shadow on the right half of the frame. This is dramatic product photography — not showroom lighting.

MATERIALS IN FRAME:
1. The matte black leatherette-textured hard panel surface. Fine grain is visible under the raking light. NOT smooth. NOT glossy.
2. One or two raised groove lines crossing the panel — the grooves are parallel, approximately 3mm raised, creating a subtle ridge with a hard shadow on one side.
3. At the far left edge: the beginning of an aluminum side rail extrusion in matte black, where the panel meets the rail. A rubber weather-seal strip is visible at this seam, slightly compressed.

MOOD: Precision. Materials. Craftsmanship. Like a watch macro shot but for a truck product. Tactile, dark, premium.

OUTPUT: Single 16:9 landscape photograph. Photorealistic. No text. No logos. No vehicle body. No background.
    `.trim(),
    negativePrompt:
      "glossy surface, mirror finish, chrome, plastic sheen, AI glow, vehicle body visible, sky, background, logo text, continuous LED strip, watermark, illustration, rendering artifact, extra grain at ISO 3200, overexposed highlights",
  },

  // -------------------------------------------------------------------------
  // SEED-B: HERO — 3/4 rear exterior, Cement Tacoma, suburban driveway
  // -------------------------------------------------------------------------
  {
    id: "seed-b",
    label: "Hero: 3/4 rear Cement Tacoma Double Cab, matte cover, driveway, late afternoon",
    refs: ["tacoma-body-rear", "tacoma-body-side", "hero-cover"],
    prompt: `
You are a senior automotive commercial photographer shooting a TV advertisement hero still.

${TACOMA_BODY_BRIEF}

${COVER_BRIEF}

SCENE:
A 2016-2023 Toyota Tacoma Double Cab in Cement Gray is parked in a clean residential suburban driveway. The driveway is light concrete with a slight weathering pattern. There is a low-trimmed hedge and the edge of a garage door at the far left edge of the frame, blurred. The background is a soft suburban environment — trees, a fence line — all out of focus. NO mountains. NO desert. NO off-road. Clean neutral suburban setting that lets the truck and cover be the story.

CAMERA POSITION:
Three-quarter rear angle. Camera is low — approximately bumper height (18 inches off the ground), positioned at the driver-side rear corner. The camera is looking toward the front-passenger side of the truck. This angle shows: the full tailgate and TACOMA lettering, the tonneau cover surface running away from camera toward the cab, the driver-side tail lamp, and the rear quarter of the Double Cab body.

LENS: 50mm equivalent. Slight anamorphic characteristic — subtle horizontal lens flare from the late sun.

LIGHTING:
Late afternoon, approximately 5:30 PM. The sun is 45 degrees camera-right (passenger side), low in the sky, creating a directional key light that rakes across the cover panels from right to left. The cover surface catches this light at a grazing angle, making the groove lines cast shadows and revealing the matte texture. The truck's Cement Gray paint picks up a slight warm tone from the late sun. No harsh shadows. The underside of the truck is in soft shadow. No fill bounce — keep it natural.

TAIL LAMP: The driver-side 3rd-gen Tacoma boomerang-C tail lamp is clearly visible in the lower left of the frame. It is unlit (daytime). The housing is dark. The shape must be correct: compact angular cluster with a C-element at the bottom corner.

COVER: The matte tri-fold cover is CLOSED and flat on the bed. Three panels visible. Four groove lines per panel. Matte black leatherette texture. The cover is flush with the bed rail on the sides.

MOOD: Premium, clean, functional. Not aggressive. Not lifted-bro. This is a Yeti-cooler customer's truck — thoughtful, quality-minded, suburban professional.

OUTPUT: Single 16:9 landscape photograph. Photorealistic, photoreal, shot on Canon EOS R with 50mm prime. No text. No logos except factory Toyota/Tacoma badges on the truck. No watermarks.
    `.trim(),
    negativePrompt:
      "F-150 tail lamp, Tundra tail lamp, vertical rectangle tail lamp, horizontal stacked tail lamp, lifted suspension, oversized wheels, mud tires, F-150, Ram, Silverado, Tundra, Access Cab, 4th generation Tacoma 2024+, chrome accents, glossy cover, LED strip on cover, desert setting, mountains, off-road trail, illustration, watermark, extra text, blurry subject, country vibe, bro truck",
  },

  // -------------------------------------------------------------------------
  // SEED-C v3: Interior bed — Toyota Tacoma 5ft SHORT bed, 8 discrete white
  // LED puck modules in TRUE PERIMETER layout. v3 fixes from auto-parts
  // specialist: (1) force explicit compact midsize short bed geometry with
  // dominant inner-fender humps; (2) describe LED geometry so the ENTIRE bed
  // is lit including side rails AND tailgate end — no dark rear half.
  // -------------------------------------------------------------------------
  {
    id: "seed-c",
    label: "Tacoma SHORT bed interior: 8 discrete white LED pucks, TRUE perimeter, WHOLE bed lit including tailgate end",
    refs: ["tacoma-bed-anchor", "led-bar-2", "led-bar-1"],
    prompt: `
You are a commercial product photographer. Generate a single photorealistic photograph for a truck accessory TV advertisement. This photograph will be used to sell an 8-puck LED bed lighting kit for the Toyota Tacoma.

CAMERA POSITION AND ORIENTATION:
The camera is positioned at the open tailgate, approximately 18 inches above the tailgate lip, looking INTO the bed toward the cab wall (bulkhead). The frame is 9:16 vertical portrait.

BED BODY — TOYOTA TACOMA COMPACT MIDSIZE SHORT BED (THE SINGLE MOST CRITICAL REQUIREMENT):
This is a 2016-2023 Toyota Tacoma 3rd-generation SHORT 5-foot bed. The reference image I have provided shows the exact correct bed — study it carefully and reproduce its compact proportions.

EXACT BED PROPORTIONS — READ CAREFULLY:
- This is a compact midsize SHORT bed, approximately 60-inch floor length. It is STUBBY and SHALLOW from tailgate to bulkhead. The bed looks SHORT when viewed from the tailgate — you can clearly see the cab wall/bulkhead at the far end without it feeling distant.
- LOW sidewall height relative to floor width. The walls rise only about 19 inches from the floor — these are SHORT walls.
- The bed floor is NARROW. Between the two wheel-well humps the usable floor width is roughly 41 inches — about the width of a large suitcase. This is clearly NOT a full-size truck.
- Fewer than 8 floor ribs visible running from tailgate to bulkhead. The rib spacing appears coarse because the floor is SHORT.
- Overall impression: cozy, compact, stubby. Someone standing at the tailgate can almost reach the cab wall without stepping in.

INNER-FENDER WHEEL-WELL HUMPS — THE TACOMA'S DEFINING BED FEATURE:
On BOTH the driver side (left from the tailgate view) AND the passenger side (right from the tailgate view), there are LARGE BLACK COMPOSITE inner-fender humps. These are prominent geometric protrusions — NOT subtle bumps:
- Each hump occupies roughly one-third of the total floor width at its widest point.
- Each hump rises approximately 8-10 inches above the bed floor surface.
- The humps begin approximately 25 inches from the tailgate and extend toward the cab.
- They create a pronounced "narrowed waist" in the bed — the floor is noticeably narrower in the mid-bed section than at the tailgate opening or near the cab wall.
- The humps are covered in the same dark textured spray-in liner material as the floor.
- DO NOT make these subtle. They are the DOMINANT visual feature of the Tacoma bed interior that makes it unmistakably different from a full-size truck.

BED FLOOR:
Charcoal/dark gray textured spray-in bed liner (rough, granular texture — like coarse sandpaper, not smooth rubber). The floor and lower side walls are lined. Factory longitudinal ribs run from tailgate toward the cab.

TONNEAU COVER ABOVE (THE "CEILING"):
A matte black hard tri-fold tonneau cover is CLOSED above the bed. The underside of this closed cover forms the ceiling of the enclosed bed space. It is mostly dark matte black composite — NOT glossy. The aluminum side rails of the cover run the length of both sides at the top of the bed walls. The cover creates an enclosed tunnel-like space that is dark except for the LED pucks.

LED PUCK MODULES — 8 DISCRETE MODULES, PERIMETER LAYOUT, WHOLE BED LIT:
Eight small rectangular black LED puck modules (each approximately 2 inches wide, 1.5 inches tall) are mounted to the underside of the tonneau cover in a PERIMETER RECTANGLE. The layout is CRITICAL:

REAR RAIL (tailgate-side, CLOSEST TO CAMERA — MOST IMPORTANT FOR THIS SHOT):
THREE pucks evenly spaced across the width of the rear aluminum rail, mounted on the underside of the cover, directly above the bed floor near the tailgate. These pucks are the CLOSEST puck modules to the camera — they should appear in the upper portion of the frame, near the camera, large and clearly visible. Each one glows cool white and casts a bright downward pool of light onto the bed liner NEAR THE TAILGATE — illuminating the tailgate-end of the floor clearly. THIS IS CRITICAL: the near/tailgate portion of the bed floor must be well-lit by these 3 rear pucks.

DRIVER-SIDE RAIL (left side, mid-length):
ONE puck on the left side rail underside at approximately mid-bed length. It casts a downward pool onto the left inner-fender hump and surrounding floor.

PASSENGER-SIDE RAIL (right side, mid-length):
ONE puck on the right side rail underside at approximately mid-bed length. It casts a downward pool onto the right inner-fender hump and surrounding floor.

FRONT RAIL (cab-wall side, FARTHEST FROM CAMERA):
THREE pucks evenly spaced across the width of the front aluminum rail, at the far end of the bed nearest the cab wall. They cast downward pools of cool white light onto the floor near the bulkhead.

Total: 3 rear (near camera) + 1 left side + 1 right side + 3 front (far) = 8 pucks.

LIGHT OUTPUT — ENTIRE BED FLOOR IS LIT, NO DARK SECTIONS:
Each of the 8 pucks emits cool white (5500K) light downward. EVERY SECTION OF THE BED FLOOR IS ILLUMINATED:
- REAR/TAILGATE SECTION (near camera): THREE bright cool-white pools on the liner floor, from the 3 rear-rail pucks above. THIS SECTION IS BRIGHTLY LIT. No dark rear half.
- SIDE/MID SECTIONS: The left and right side pucks each cast a pool on/around the inner-fender humps and the adjacent floor, illuminating the side walls too.
- FRONT/BULKHEAD SECTION (far from camera): THREE pools near the cab wall from the front pucks.

ALL EIGHT LIGHT POOLS ARE VISIBLE. The pools are separate — each has a distinct bright hotspot with natural falloff, visible darker gaps between pools. NOT a continuous glow strip. NOT one undifferentiated bright flood. Eight separate discrete pools, each with a visible source puck above it.

WHAT THE CAMERA SEES (front to back in the frame):
- NEAR (lower portion of frame): The open tailgate edge, and the near bed floor brightly lit by the 3 REAR PUCKS above. Three distinct cool-white light pools on the liner near the camera. The 3 rear-rail puck modules are visible in the upper-near part of the ceiling, glowing white, wires running to them.
- MID-BED: The two prominent inner-fender humps on left and right narrow the floor. The left and right side-pucks cast pools here, partially illuminating the humps and the side walls.
- FAR (upper portion of frame): Three light pools near the cab wall from the front pucks. The cab wall/bulkhead is visible. The 3 front-rail puck modules glow on the far ceiling rail.
- The entire bed is lit — no dark rear half. The enclosed space is evenly covered by the 8 pools in their perimeter rectangle.

MOOD:
Dark tunnel-like enclosed space. The pucks are the ONLY light source. The overall scene is very dark except for the 8 cool-white pools. Premium automotive product photography. The compact Tacoma bed proportions should feel obvious — stubby narrow tunnel, not a long wide cavern.

ASPECT RATIO: 9:16 vertical portrait.

OUTPUT: Single 9:16 vertical photograph. Photorealistic. No text. No logos. No watermarks.
    `.trim(),
    negativePrompt:
      "full-size truck bed, F-150 bed, Silverado bed, Tundra bed, wide bed, long bed, large truck bed, 6-foot bed, 8-foot bed, tiny wheel wells, barely visible wheel wells, small wheel well bumps, front-only pucks, all pucks on bulkhead wall, cluster of pucks on one end, dark tailgate area, dark rear floor, unlit near section, dark half of bed, stadium uniform lighting, spotlight from above, flat even illumination, continuous LED strip, LED light bar, LED rope, amber LED, yellow LED, blue LED, red LED, purple LED, smooth rubber floor mat, carpet, factory carpet liner, overhead daylight, open tonneau, sunlight through gaps, white studio background, showroom overhead lighting, illustration, digital art, watermark, text labels, faces, people, hands",
  },

  // -------------------------------------------------------------------------
  // SEED-D: Low side-rail angle — aluminum rail, latch, rubber seal, blue-hour
  // -------------------------------------------------------------------------
  {
    id: "seed-d",
    label: "Side-rail: aluminum rail + latch hardware + rubber seal, blue-hour ambient",
    refs: ["hero-cover", "combo"],
    prompt: `
You are a commercial product photographer. Generate a single photorealistic photograph for a truck accessory TV advertisement.

${COVER_BRIEF}

SCENE:
A very low camera angle positioned at the rear-corner of a truck bed, approximately 6 inches off the ground. The camera is shooting upward at approximately 10 degrees, aimed at the intersection where the tonneau cover's rear panel meets the truck's tailgate top rail.

WHAT IS IN FRAME (approximately):
- FOREGROUND (lower half of frame): The aluminum side rail extrusion running horizontally. Matte black anodized aluminum, approximately 1.5 inches wide, sits along the top of the bed wall. The surface shows the aluminum extrusion profile — slightly rounded top edge, flat face, visible mounting hardware.
- CENTER OF FRAME: The latch mechanism where the rear cover panel meets the tailgate. A matte black lever-style latch. The latch hardware is visible in close detail. The rubber weather-seal gasket is compressed between the cover panel and the top of the tailgate rail.
- UPPER HALF OF FRAME: The matte black leatherette tonneau cover panel surface extends into the frame from the left. The panel seam rubber seal is visible — a dark rubber strip approximately 0.5 inches wide running along the edge.
- RIGHT EDGE: The truck body paint (Cement Gray) visible as context — showing the bed side wall and tailgate corner.

LIGHTING:
Blue hour exterior. The sky has the deep blue of 20 minutes after sunset. There is a single cool ambient light source from the right — could be a distant streetlamp or garage light. The aluminum side rail catches this cool light, showing the extrusion profile. The latch hardware has subtle specular highlights. The matte cover surface absorbs the light — very little reflection. The rubber seal is dark and detail-visible.

MOOD: Precision engineering close-up. Like a luxury car detail shot. Focus on the craftsmanship of the hardware fit.

OUTPUT: Single 16:9 landscape photograph. Photorealistic. No text. No logos. No watermarks. Sharp focus on the latch and rail hardware, soft background.
    `.trim(),
    negativePrompt:
      "chrome latch, glossy cover panel, mirror surface, LED strip visible, interior bed lit, daylight, golden hour, excessive brightness, lifted truck, muddy environment, F-150 body panels, illustration, watermark, blurry foreground",
  },

  // -------------------------------------------------------------------------
  // SEED-E: SEED-B variant — same Tacoma, blue-hour parking structure
  // -------------------------------------------------------------------------
  {
    id: "seed-e",
    label: "Hero variant: Cement Tacoma, blue-hour parking structure, sodium key, tail lamps off",
    refs: ["tacoma-body-rear", "tacoma-body-side", "hero-cover"],
    prompt: `
You are a senior automotive commercial photographer shooting a TV advertisement hero still.

${TACOMA_BODY_BRIEF}

${COVER_BRIEF}

SCENE:
A 2016-2023 Toyota Tacoma Double Cab in Cement Gray is parked in a clean concrete parking structure. The structure is modern — flat concrete ceiling, concrete columns visible in the deep background (blurred). The floor is smooth concrete, slightly reflective under the sodium-vapor lights. This is a premium parking structure — not a dirty garage. Think high-end urban parking.

CAMERA POSITION:
Three-quarter rear angle, same as a hero exterior shot. Camera is low — approximately 18 inches off the ground, positioned at the driver-side rear corner. The camera is looking toward the front-passenger side of the truck. Shows: full tailgate with TACOMA lettering, cover surface running toward cab, driver-side tail lamp, rear quarter of Double Cab.

LENS: 50mm equivalent, slight anamorphic character.

LIGHTING:
Blue hour exterior light bleeds in from the parking structure entrance at camera-right. One warm sodium-vapor overhead lamp is positioned above and slightly behind the truck, creating a warm key from above-rear. This creates a dramatic split: the top of the cover panels catches warm sodium light, while the side panels and tailgate are in cooler shadow from the blue-hour bounce. There is a subtle golden warm reflection on the smooth concrete floor under the truck. The tail lamps are OFF — unlit dark housing. The parking structure columns in the background are barely visible, dark, bokeh-soft.

TAIL LAMP: Same critical requirement — the driver-side 3rd-gen Tacoma boomerang-C tail lamp must be visible and correct. UNLIT.

COVER: Same as SEED-B — matte tri-fold closed flat, groove lines visible catching the warm sodium light from above-rear, matte texture absorbing the light (not glossy).

MOOD: Cinematic. Moody. Night product shot. Premium urban energy. Like a luxury car advertisement but for a tactical truck accessory. The two-tone warm/cool lighting split creates visual drama.

OUTPUT: Single 16:9 landscape photograph. Photorealistic, photoreal, shot on Canon EOS R, 50mm prime. No text. No logos except factory Toyota/Tacoma badges. No watermarks.
    `.trim(),
    negativePrompt:
      "F-150 tail lamp, Tundra tail lamp, vertical rectangle tail lamp, horizontal stacked lamp, tail lamps lit, lifted suspension, oversized wheels, mud tires, F-150, Ram, Silverado, Tundra, Access Cab, 2024+ 4th gen Tacoma, chrome accents, glossy cover, LED strip on cover, desert, mountains, outdoor nature setting, illustration, watermark, extra text, daytime, golden hour sunset, country vibe, bro truck",
  },
];

// ---------------------------------------------------------------------------
// Ref file loading
// ---------------------------------------------------------------------------
type RefFiles = Partial<Record<RefKey, Buffer>>;

async function loadRefs(): Promise<RefFiles> {
  const refPaths: Record<RefKey, string> = {
    "hero-cover":         path.join(REFS_DIR, "hero-cover.jpg"),
    "led-bar-1":          path.join(REFS_DIR, "led-bar-1.jpg"),
    "led-bar-2":          path.join(REFS_DIR, "led-bar-2.jpg"),
    "combo":              path.join(REFS_DIR, "combo.jpg"),
    "cover-detail-3":     path.join(REFS_DIR, "cover-detail-3.jpg"),
    "cover-detail-4":     path.join(REFS_DIR, "cover-detail-4.jpg"),
    "tacoma-body-rear":   "/tmp/tacoma-cement-8.jpg",  // Toyota press: straight rear
    "tacoma-body-side":   "/tmp/tacoma-cement-9.jpg",  // Toyota press: low 3/4 rear
    "tacoma-bed-anchor":  "/tmp/tacoma-short-bed-anchor.jpg",  // 3rd-gen Tacoma short bed interior with prominent inner-fender wheel-well humps
  };

  const loaded: RefFiles = {};
  for (const [key, filePath] of Object.entries(refPaths) as [RefKey, string][]) {
    try {
      loaded[key] = await fs.readFile(filePath);
    } catch {
      console.warn(`[seed-gen] WARNING: ref "${key}" not found at ${filePath} — skipping`);
    }
  }
  return loaded;
}

// ---------------------------------------------------------------------------
// Gemini request
// ---------------------------------------------------------------------------
type GeminiPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

async function generateSeed(
  apiKey: string,
  spec: SeedSpec,
  refs: RefFiles,
  attempt: number,
): Promise<string> {
  const parts: GeminiPart[] = [];

  // Attach reference images first (Gemini reads multimodal left-to-right)
  const refNotes: string[] = [];
  for (const refKey of spec.refs) {
    const buf = refs[refKey];
    if (!buf) {
      console.warn(`[seed-gen] ${spec.id} — ref "${refKey}" missing, skipping`);
      continue;
    }
    // Critical instruction per ref to prevent the model from copying
    // the wrong vehicle body from product refs
    let refInstruction = "";
    if (refKey === "tacoma-body-rear" || refKey === "tacoma-body-side") {
      refInstruction = "REFERENCE IMAGE (VEHICLE BODY ONLY): Use this ONLY for the Toyota Tacoma 3rd-gen body shape, tail lamp cluster shape, bed proportions, and Double Cab roofline. Do NOT use this for the setting — it is on rocks/desert which is NOT what we want.";
    } else if (refKey === "tacoma-bed-anchor") {
      refInstruction = "REFERENCE IMAGE (TACOMA SHORT BED INTERIOR — HIGHEST PRIORITY ACCURACY ANCHOR): This is a real photo of a 3rd-gen Toyota Tacoma short 5-foot bed interior, shot from the open tailgate looking toward the cab wall. USE THIS as the ground truth for: (1) bed proportions — it is clearly a compact, narrow, shallow midsize short bed, NOT a full-size truck bed; (2) the PROMINENT black composite inner-fender wheel-well humps that intrude significantly on BOTH sides of the bed interior — these are unmistakable Tacoma signature features; (3) the factory deck-rail system and tie-down cleats along the top bed rails; (4) the cab wall (front bulkhead) shape. DO reproduce the narrow compact proportions, the prominent wheel-well intrusions, and the bed wall height. IGNORE the specific liner material (carpet) — the target image uses a spray-in bed liner instead.";
    } else if (refKey === "hero-cover" || refKey === "cover-detail-3" || refKey === "cover-detail-4") {
      refInstruction = "REFERENCE IMAGE (COVER PRODUCT ONLY): Use this ONLY for the tonneau cover surface texture, groove pattern, panel count, and side rail shape. IGNORE the vehicle body in this image — it is NOT a Tacoma.";
    } else if (refKey === "led-bar-1") {
      refInstruction = "REFERENCE IMAGE (LED PUCK LIGHT QUALITY ONLY): Use this ONLY for the individual LED puck module light emission quality — the point-source cool-white glow, the intensity, and how each discrete puck creates its own bright spot. IGNORE the vehicle body (it is an F-150, NOT a Tacoma). IGNORE that this image shows an open tonneau — the target image has a closed tonneau above.";
    } else if (refKey === "led-bar-2") {
      refInstruction = "REFERENCE IMAGE (LED PERIMETER WIRING DIAGRAM — CRITICAL FOR LAYOUT): This diagram shows the 8-puck PERIMETER layout: 3 pucks across the front (bulkhead/cab-wall) rail, 1 puck on each far side rail (so 1 left + 1 right), and 3 pucks across the rear (tailgate-side) rail. The wiring runs in a rectangle around the perimeter. This is the ground truth for module COUNT (8 total) and PERIMETER PLACEMENT. DO NOT place all pucks on one wall. IGNORE the '8 ft' bed dimension label — the target is a Tacoma 5-foot SHORT bed which is narrower and shorter than the diagram bed.";
    } else if (refKey === "combo") {
      refInstruction = "REFERENCE IMAGE (LED MODULE LAYOUT ONLY): Use this ONLY for the LED puck module shape, count, wiring layout, and light quality. IGNORE the vehicle body — it is NOT a Tacoma.";
    }
    parts.push({ text: refInstruction });
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: buf.toString("base64"),
      },
    });
    refNotes.push(refKey);
  }

  // Final prompt text
  const fullPrompt = `
${spec.prompt}

NEGATIVE (do NOT include any of these):
${spec.negativePrompt}

Attempt ${attempt} of 3. Generate the photograph now. Output a single photorealistic image. No text overlays, no watermarks, no callouts.
`.trim();

  parts.push({ text: fullPrompt });

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
  const outPath = path.join(OUT_DIR, `${spec.id}${suffix}.${ext}`);
  await fs.writeFile(outPath, Buffer.from(imgPart.inlineData.data, "base64"));
  return outPath;
}

// ---------------------------------------------------------------------------
// .env.local loader — explicit about key source, no silent fallback
// ---------------------------------------------------------------------------
async function loadEnvLocal(): Promise<{ keySource: string }> {
  const envLocalPath = path.join(ROOT, ".env.local");
  let loadedFromFile = false;

  try {
    const raw = await fs.readFile(envLocalPath, "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
      if (!m) continue;
      const [, key, valueRaw] = m;
      // Only set if NOT already in process.env — this is intentional:
      // if somehow a shell env var exists we want the .env.local value to win
      // for GEMINI_API_KEY specifically, so we override it.
      if (key === "GEMINI_API_KEY") {
        // Always prefer .env.local over any inherited env for this key
        process.env[key] = valueRaw.replace(/^["']|["']$/g, "");
        loadedFromFile = true;
      } else if (!process.env[key]) {
        process.env[key] = valueRaw.replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    // No .env.local file — GEMINI_API_KEY must be in the shell environment
  }

  const keySource = loadedFromFile
    ? `${envLocalPath} (GEMINI_API_KEY loaded from this repo's .env.local)`
    : process.env.GEMINI_API_KEY
    ? "shell environment (GEMINI_API_KEY not found in .env.local)"
    : "NONE — key is missing";

  return { keySource };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main(): Promise<number> {
  const { keySource } = await loadEnvLocal();
  console.log(`[seed-gen] KEY SOURCE: ${keySource}`);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error(
      "FATAL: GEMINI_API_KEY not set.\n" +
      `Looked in: ${path.join(ROOT, ".env.local")} and shell environment.\n` +
      "Add GEMINI_API_KEY=<your-key> to this repo's .env.local and retry.",
    );
    return 1;
  }

  await fs.mkdir(OUT_DIR, { recursive: true });

  const onlyArg = process.argv.find((a) => a.startsWith("--only="));
  const onlyId = onlyArg?.slice("--only=".length);
  const attemptArg = process.argv.find((a) => a.startsWith("--attempt="));
  const attempt = attemptArg ? parseInt(attemptArg.slice("--attempt=".length), 10) : 1;

  const queue = onlyId
    ? SEEDS.filter((s) => s.id === onlyId || s.id === `seed-${onlyId}`)
    : SEEDS;

  if (queue.length === 0) {
    console.error(`No seed matched --only=${onlyId}. Valid IDs: ${SEEDS.map((s) => s.id).join(", ")}`);
    return 1;
  }

  console.log(`[seed-gen] Loading reference images…`);
  const refs = await loadRefs();
  const loadedRefs = Object.keys(refs);
  console.log(`[seed-gen] Loaded refs: ${loadedRefs.join(", ")}`);
  console.log();

  console.log(`[seed-gen] Generating ${queue.length} seed(s) via ${GAS_MODEL} (attempt ${attempt})…\n`);

  let failed = 0;
  for (const spec of queue) {
    console.log(`[seed-gen] → ${spec.id}: ${spec.label}`);
    try {
      const outPath = await generateSeed(apiKey, spec, refs, attempt);
      console.log(`[seed-gen]   DONE: ${outPath}\n`);
    } catch (err) {
      console.error(`[seed-gen]   FAILED: ${err instanceof Error ? err.message : err}\n`);
      failed++;
    }
    // Stay below Gemini rate limit (2 req/s)
    if (queue.indexOf(spec) < queue.length - 1) {
      await new Promise((r) => setTimeout(r, 1500));
    }
  }

  console.log(`[seed-gen] Done. ${queue.length - failed} succeeded, ${failed} failed.`);
  return failed > 0 ? 1 : 0;
}

main().then((code) => process.exit(code));
