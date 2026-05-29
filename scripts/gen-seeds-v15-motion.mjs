/**
 * v15 motion seeds — frozen mid-action frames so Runway extrapolates real
 * motion forward instead of zooming on a static composition.
 *
 *   seed-beat4-water-flowing.jpg  — water drop mid-flow through rail channel
 *   seed-beat5-boot-stepping.jpg  — one boot lifted mid-step onto the cover
 *   seed-beat6-panel-midfold.jpg  — front panel lifted to 45°, mid-fold
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, "..");

function loadEnv(envFile) {
  if (!fs.existsSync(envFile)) return;
  for (const line of fs.readFileSync(envFile, "utf8").split("\n")) {
    const t = line.trim(); if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("="); if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    const v = t.slice(eq + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!process.env[k]) process.env[k] = v;
  }
}
loadEnv(path.join(REPO, ".env.local"));

const KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-3-pro-image-preview";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const OUT_DIR = path.join(REPO, "public/images/spot-seeds/v14");

const SEEDS = [
  {
    name: "seed-beat4-water-flowing",
    ref: "public/images/spot-seeds/v14/seed-beat4-water-drainage.jpg",
    prompt:
      "Close-up product photograph of a black Ford F-150 side bed rail with a matte black hard tonneau cover edge visible at top, exactly the same scene/lighting as the reference image. " +
      "Mid-action capture: a single water droplet is FROZEN MID-FALL — captured with motion blur — flowing OUT of the rail's drainage outlet onto the side of the truck body below. " +
      "The drop is elongated, vertical streak shape, clearly in motion, photographed at 1/125 sec shutter so it has visible motion blur but is recognizable as a falling drop. " +
      "More water droplets sit on the matte black panel surface above. The drainage channel along the rail shows a glossy trail of running water. " +
      "Outdoor overcast natural lighting. Photoreal, very shallow depth of field with the falling drop in sharpest focus. 16:9 aspect ratio. NO people, NO logos, NO chrome.",
  },
  {
    name: "seed-beat5-boot-stepping",
    ref: "public/images/spot-seeds/v14/seed-beat5-load-capacity.jpg",
    prompt:
      "Close-up commercial product photograph from a low side angle showing a single brown leather Danner-style hiking boot with red laces FROZEN MID-STEP — the boot is in the air about 4 inches above a matte black closed hard tri-fold tonneau cover on a black Ford F-150 bed. " +
      "The boot is angled as if just landing — sole tilted, heel about to touch down on the cover. Slight motion blur on the boot to convey movement. " +
      "Denim cuffed jeans visible above the boot. The second leg/boot is barely visible standing planted on the cover further back. " +
      "Outdoor natural overcast daylight, slightly cool. Forest / suburban background soft focus. " +
      "The cover surface is flat and rigid — no flex anticipated. Black F-150 cab visible to left. " +
      "Photoreal high-fidelity, shallow depth of field with the airborne boot in sharpest focus. 16:9 aspect ratio. NO logos, NO water.",
  },
  {
    name: "seed-beat6-panel-midfold",
    ref: "public/images/spot-seeds/v14/seed-beat7-hero.jpg",
    prompt:
      "Product photograph of a black Ford F-150 truck bed from a low side-rear angle, with the matte black hard tri-fold tonneau cover CAUGHT MID-FOLD — the rearmost panel is lifted to a 45-degree angle, mid-motion, hinged along its forward edge. " +
      "The middle and front panels remain flat against the bed rails. Slight motion blur on the lifted panel's edge to convey movement. " +
      "A gloved hand may be visible at the bottom edge of the lifted panel, supporting it during the fold. " +
      "The aluminum side rails are clearly visible running the length of the bed. The bed liner is visible underneath the area where the panel has lifted off. " +
      "Black F-150 body panel, glossy clean finish. Tailgate down. Outdoor natural overcast lighting. " +
      "Photoreal commercial product photography, shallow depth of field, the lifted panel and its hinge in sharp focus. 16:9 aspect ratio. NO logos.",
  },
];

async function generate(seed) {
  const refB64 = fs.readFileSync(path.join(REPO, seed.ref)).toString("base64");
  console.log(`[${seed.name}] requesting (prompt=${seed.prompt.length}chars)`);
  const res = await fetch(`${ENDPOINT}?key=${KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [
        { text: seed.prompt },
        { inlineData: { mimeType: "image/jpeg", data: refB64 } },
      ] }],
      generationConfig: { responseModalities: ["IMAGE"] },
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    console.error(`[${seed.name}] HTTP ${res.status}: ${txt.slice(0, 300)}`);
    return;
  }
  const data = await res.json();
  const part = data?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
  if (!part) { console.error(`[${seed.name}] no image in response`); return; }
  const buf = Buffer.from(part.inlineData.data, "base64");
  const outPath = path.join(OUT_DIR, `${seed.name}.jpg`);
  fs.writeFileSync(outPath, buf);
  console.log(`[${seed.name}] ✓ ${(buf.length / 1024).toFixed(0)} KB → ${path.relative(REPO, outPath)}`);
}

for (const s of SEEDS) await generate(s);
