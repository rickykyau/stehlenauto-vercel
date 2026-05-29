/**
 * v16 story-first seeds — each shot tells a clear install / weather / load /
 * open story with hands actually doing something. Replaces v15 seeds that
 * showed motion-for-its-own-sake.
 *
 *   v16-beat1-clamp-on-rail  — hand pressing clamp shut on bed rail edge
 *   v16-beat4-water-wide     — wider angle of cover w/ water + drainage rail
 *   v16-beat5-weight-on-cover — heavy duffle bag dropped on cover, cover flat
 *   v16-beat6-hands-lift     — two gloved hands lifting rear panel mid-fold
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
    name: "v16-beat1-clamp-on-rail",
    ref: "public/images/spot-seeds/v14/seed-beat1-install-clamp.jpg",
    prompt:
      "Close-up product/install photograph. View along the side of a black Ford F-150 bed rail. " +
      "A worker's TWO gloved hands are visible — one hand HOLDS the edge of the matte black hard tonneau cover in place against the truck's bed rail top, while the other hand PRESSES the C-clamp closed onto the inner lip of the truck's bed rail underneath. " +
      "The clamp is shown in the moment of CLAMPING — its jaws are gripping the bed rail lip securely. The cover edge sits flush on top. No drill. No power tool. The clamp engages purely through hand pressure. " +
      "Slightly low angle along the rail edge. Outdoor overcast natural lighting. The cover and rail are in sharp focus, the hands and gloves slightly soft. " +
      "NO drilled holes, NO logos, NO chrome. Photoreal high-fidelity commercial install photography, 16:9 aspect ratio.",
  },
  {
    name: "v16-beat4-water-wide",
    ref: "public/images/spot-seeds/v14/seed-beat4-water-drainage.jpg",
    prompt:
      "WIDER product photograph (zoom out from the previous seed) showing a black Ford F-150 bed with the matte black hard tri-fold tonneau cover INSTALLED and CLOSED across the full bed. " +
      "The view is a 3/4 high-side angle so the ENTIRE top of the cover is visible across the frame — all three panels, both side rails, the tailgate edge. " +
      "Water droplets are scattered across the cover surface — fresh rain pattern, not heavy puddles. A trail of water visibly streams down through the drainage channel along the side rail and out the rail's outlet at the back, dripping toward the ground. " +
      "Outdoor overcast natural daylight, post-rain look. Truck body is clean glossy black. " +
      "Photoreal, high fidelity. NO people, NO chrome wheels, NO mud, NO logos. 16:9 aspect ratio.",
  },
  {
    name: "v16-beat5-weight-on-cover",
    ref: "public/images/spot-seeds/v14/seed-beat5-load-capacity.jpg",
    prompt:
      "Product photograph showing a heavy black tactical duffle bag (large, well-used, full and bulging) sitting on top of a CLOSED matte black hard tri-fold tonneau cover on a black Ford F-150 bed. " +
      "The bag is heavy enough to look like it weighs 50+ pounds — the camera angle is a low side-rear so the viewer can clearly see the cover surface beneath the bag is COMPLETELY FLAT — zero flex, zero sag, zero deformation under the heavy load. " +
      "A pair of brown leather Danner-style boots sits next to the bag for scale. " +
      "Overcast outdoor daylight. Suburban driveway background out of focus. The F-150 tailgate visible to the right. " +
      "Photoreal commercial product photography, shallow depth of field with the bag and cover surface in sharp focus. NO people, NO logos, NO water. 16:9 aspect ratio.",
  },
  {
    name: "v16-beat6-hands-lift",
    ref: "public/images/spot-seeds/v14/seed-beat6-panel-midfold.jpg",
    prompt:
      "Close product/use photograph showing TWO gloved hands actively LIFTING the rearmost panel of a matte black hard tri-fold tonneau cover open on a black Ford F-150 bed. " +
      "Each hand is firmly gripping the panel — one hand on each side of the panel edge. The panel is tilted up to about 45 degrees mid-lift. The viewer clearly sees the hands ENGAGED with the panel, doing the lifting work. " +
      "The front and middle cover panels remain flat across the bed rails. The aluminum side rails are visible underneath where the rear panel has lifted off. The tailgate is down. " +
      "Outdoor natural overcast daylight. Side angle from the rear corner of the bed. " +
      "Photoreal commercial product use photography, shallow depth of field with the panel and the hands in sharp focus. NO logos. 16:9 aspect ratio.",
  },
];

async function generate(s) {
  const refB64 = fs.readFileSync(path.join(REPO, s.ref)).toString("base64");
  console.log(`[${s.name}] ${s.prompt.length} chars`);
  const res = await fetch(`${ENDPOINT}?key=${KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [
        { text: s.prompt }, { inlineData: { mimeType: "image/jpeg", data: refB64 } },
      ] }],
      generationConfig: { responseModalities: ["IMAGE"] },
    }),
  });
  if (!res.ok) { console.error(`[${s.name}] HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`); return; }
  const data = await res.json();
  const part = data?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
  if (!part) { console.error(`[${s.name}] no image in response`); return; }
  const buf = Buffer.from(part.inlineData.data, "base64");
  const out = path.join(OUT_DIR, `${s.name}.jpg`);
  fs.writeFileSync(out, buf);
  console.log(`[${s.name}] ✓ ${(buf.length / 1024).toFixed(0)} KB`);
}

for (const s of SEEDS) await generate(s);
