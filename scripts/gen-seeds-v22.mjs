/**
 * v22 — Beat 6 split into two micro-clips that together show the full
 * tri-fold opening action.
 *   6a: cover fully closed, hand on tailgate-side edge of rear panel,
 *       ready to lift. Motion = rear panel folds forward onto middle.
 *   6b: rear panel already folded onto middle (2-panel stack at middle
 *       position), hand on back edge of stack, ready to push forward.
 *       Motion = 2-panel stack folds onto front panel = fully stacked at cab.
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
const REF = path.join(REPO, "public/images/spot-seeds/v14/v16-beat4-water-wide.jpg");

const SEEDS = [
  {
    name: "v22-beat6a-start-state",
    prompt:
      "Product photograph of a black Ford F-150 truck bed viewed from a 3/4 rear angle near the tailgate. The matte black hard tri-fold tonneau cover is FULLY CLOSED and FLAT across the bed — all three rigid panels visible with two parallel seam lines running across the bed width. " +
      "A man's BARE hand (no glove) is positioned at the TAILGATE-side edge of the rearmost panel. The thumb rests on the top surface of the panel; the four fingers are curled UNDERNEATH the rear edge, gripping the bottom lip of the panel from below. The hand is poised, READY to lift — the panel has not started moving yet. " +
      "Tailgate is DOWN. " +
      "Outdoor overcast natural daylight. Photoreal commercial product photography, shallow depth of field with the hand and rear panel edge in sharp focus. " +
      "NO logos on the cover, NO tools, NO glove. 16:9 aspect ratio.",
  },
  {
    name: "v22-beat6b-mid-state",
    prompt:
      "Product photograph of a black Ford F-150 truck bed viewed from a 3/4 rear angle near the tailgate. The matte black hard tri-fold tonneau cover is PARTIALLY OPEN: the REAR panel has already been folded forward onto the MIDDLE panel and is now resting flat ON TOP of the middle panel — forming a stacked 2-panel slab in the middle position of the bed. The FRONT panel (closest to the cab) is still flat on the bed rails. " +
      "The rear half of the truck bed (between the tailgate and the 2-panel stack) is now EXPOSED — bed liner visible, empty. " +
      "A man's BARE hand (no glove) grips the back edge of the 2-panel stack — thumb on top, four fingers curled under the back edge from below. The hand is poised, READY to push the 2-panel stack forward onto the front panel. " +
      "Tailgate is DOWN. " +
      "Outdoor overcast natural daylight. Photoreal commercial product photography, shallow depth of field with the stacked panels and hand in sharp focus. " +
      "NO logos, NO tools, NO glove. 16:9 aspect ratio.",
  },
];

async function generate(s) {
  const refB64 = fs.readFileSync(REF).toString("base64");
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
