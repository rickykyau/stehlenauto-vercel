/**
 * v21 — Beat 6 end-state seed.
 *   Show the cover FULLY tri-folded and stacked at the cab end.
 *   Bed completely exposed. No hand. Camera dolly will animate it in LTX.
 *   Matches the owner's reference (Tundra ad), adapted to black F-150.
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
  "Product photograph of a black Ford F-150 truck from a 3/4 rear angle, tailgate DOWN. " +
  "The matte black hard tri-fold tonneau cover is in its FULLY OPENED end state: all three rigid panels have been folded forward and are STACKED vertically against the cab side of the bed. The folded stack sits tight against the cab, taking up only about 12-16 inches of the bed length closest to the cab. " +
  "The rest of the truck bed is COMPLETELY EXPOSED and open — empty bed visible from tailgate to the folded stack. The bed liner is matte black ribbed plastic, visible across the full open area. " +
  "Bed rails on both left and right are clean and parallel — NO gaps, no half-closed panels, no panels left mid-fold. The folded cover stack is uniform and symmetric across the full bed width — left edge and right edge of the stack both flush against the bed rails. " +
  "A small yellow safety strap/buckle is visible cinching the folded stack to the cab. " +
  "NO hand, NO person, NO tools. Clean product reveal shot. " +
  "Outdoor overcast natural daylight. " +
  "Photoreal commercial product photography, slight wide-angle perspective into the open bed showing the depth and usable space. " +
  "16:9 aspect ratio.";

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
const out = path.join(OUT_DIR, "v21-beat6-fully-folded-endstate.jpg");
fs.writeFileSync(out, buf);
console.log(`✓ ${(buf.length / 1024).toFixed(0)} KB → ${path.relative(REPO, out)}`);
