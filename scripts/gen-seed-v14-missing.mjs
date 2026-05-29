/**
 * gen-seed-v14-missing.mjs
 *
 * Generates the 2 v14 seeds that aren't covered by the 10 Downloads photos:
 *   - seed-beat4-water-drainage.jpg — water beading on cover + drainage rail
 *   - seed-beat5-load-capacity.jpg — work boots standing on closed cover
 *
 * Both seeds use the F-150 black + matte tri-fold cover already shown
 * in the reference and the owner's Downloads photos #2, #4, #5.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, "..");

function loadEnv(envFile) {
  if (!fs.existsSync(envFile)) return;
  for (const line of fs.readFileSync(envFile, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    const v = t.slice(eq + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!process.env[k]) process.env[k] = v;
  }
}
loadEnv(path.join(REPO, ".env.local"));

const KEY = process.env.GEMINI_API_KEY;
if (!KEY) throw new Error("GEMINI_API_KEY missing");

const MODEL = "gemini-3-pro-image-preview";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const OUT_DIR = path.join(REPO, "public/images/spot-seeds/v14");
fs.mkdirSync(OUT_DIR, { recursive: true });

const REFERENCE_SEED = path.join(REPO, "public/images/spot-seeds/v14/seed-beat2-aluminum-rail.jpg");
const referenceBase64 = fs.readFileSync(REFERENCE_SEED).toString("base64");

const SEEDS = [
  {
    name: "seed-beat4-water-drainage",
    prompt:
      "A close-up commercial product photograph showing the side rail of a matte black hard tri-fold tonneau cover on a black Ford F-150 truck bed. The view is at an oblique angle along the side rail. Beads of water sit on the textured matte black panel surface — large droplets like after a light rain, NOT a downpour. A small water drainage channel runs along the inside of the aluminum side rail; a few drops are visibly flowing through the channel toward the front. Outdoor overcast natural lighting, no harsh sun, no chrome reflections. Photoreal high-fidelity product photography, shallow depth of field, focus on the water beads on the panel surface. The truck body is clean glossy black with no mud, no dust. Background is soft-focus trees / overcast sky. 16:9 aspect ratio. NO people, NO hands, NO logos visible.",
  },
  {
    name: "seed-beat5-load-capacity",
    prompt:
      "A close-up commercial product photograph showing a pair of brown leather work boots — rugged Danner-style hiking boots with red laces — standing on top of a CLOSED matte black hard tri-fold tonneau cover. The cover is on a black Ford F-150 truck bed. The viewer sees the boots from a low angle, mid-shin level — denim jeans cuffed slightly above the boot tops. The cover surface beneath the boots shows the pebble-grain textured matte black finish; the cover is rigid, fully flat, panels show no flex or sag under the weight. The aluminum side rails are visible on either side of the boots running front to back. Outdoor natural overcast lighting, slightly cool color temperature. Background is soft-focus suburban / forest edge. Photoreal high-fidelity, shallow depth of field. 16:9 aspect ratio. NO logos, NO water, NO chrome, NO mud on the boots.",
  },
];

async function generate(seed) {
  const body = {
    contents: [
      {
        role: "user",
        parts: [
          { text: seed.prompt },
          { inlineData: { mimeType: "image/jpeg", data: referenceBase64 } },
        ],
      },
    ],
    generationConfig: { responseModalities: ["IMAGE"] },
  };

  console.log(`[${seed.name}] requesting...`);
  const res = await fetch(`${ENDPOINT}?key=${KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`HTTP ${res.status}: ${txt.slice(0, 400)}`);
  }
  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  const imgPart = parts.find((p) => p.inlineData?.data);
  if (!imgPart) throw new Error(`no image in response: ${JSON.stringify(data).slice(0, 400)}`);
  const buf = Buffer.from(imgPart.inlineData.data, "base64");
  const outPath = path.join(OUT_DIR, `${seed.name}.jpg`);
  fs.writeFileSync(outPath, buf);
  console.log(`[${seed.name}] ✓ ${(buf.length / 1024).toFixed(0)} KB → ${path.relative(REPO, outPath)}`);
}

(async () => {
  for (const s of SEEDS) {
    try {
      await generate(s);
    } catch (err) {
      console.error(`[${s.name}] FAIL: ${err.message}`);
    }
  }
})();
