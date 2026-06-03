/**
 * v20 — correct Beat 6 seed showing real tri-fold mechanic.
 *   Rear panel lifted from tailgate edge, folded FORWARD onto middle panel,
 *   hinging at the rear-middle seam (not at the cab side).
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

const PROMPT =
  "Product photograph of a black Ford F-150 truck bed viewed from a 3/4 rear angle near the tailgate. The matte black hard tri-fold tonneau cover is in the middle of being opened, mid-fold action. " +
  "The cover has THREE distinct rigid panels with two visible seam lines running across the width of the bed. " +
  "The REAR panel (closest to the tailgate) has been LIFTED from the tailgate edge and is being FOLDED FORWARD toward the cab — currently raised at about 60 degrees, hinged at its forward seam with the middle panel. The underside of the rear panel is visible, showing matte black ribbing/structure. " +
  "The MIDDLE and FRONT panels remain flat and locked across the bed, unfolded. " +
  "A man's bare hand (no glove) grips the tailgate-side edge of the lifted rear panel from underneath — thumb on top of the panel surface, four fingers wrapped UNDER the panel edge. The hand is actively driving the upward and forward folding motion. " +
  "The bed interior is visible below the lifted rear panel — textured black bedliner. " +
  "Tailgate is DOWN. Outdoor overcast natural daylight. " +
  "Photoreal commercial product photography, shallow depth of field with the lifted panel + hand in sharp focus. " +
  "NO logos, NO tools, NO glove. 16:9 aspect ratio.";

console.log(`prompt: ${PROMPT.length} chars`);

const refB64 = fs.readFileSync(REF).toString("base64");
const res = await fetch(`${ENDPOINT}?key=${KEY}`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    contents: [{ role: "user", parts: [
      { text: PROMPT }, { inlineData: { mimeType: "image/jpeg", data: refB64 } },
    ] }],
    generationConfig: { responseModalities: ["IMAGE"] },
  }),
});
if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 400)}`);
const data = await res.json();
const part = data?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
if (!part) throw new Error("no image");
const buf = Buffer.from(part.inlineData.data, "base64");
const out = path.join(OUT_DIR, "v20-beat6-tri-fold-correct.jpg");
fs.writeFileSync(out, buf);
console.log(`✓ ${(buf.length / 1024).toFixed(0)} KB → ${path.relative(REPO, out)}`);
