/**
 * v19 — story-correct seeds for Beat 5 (stepping-on-cover) and Beat 6
 * (fingers-under-panel). Beat 1 doesn't need a new seed (existing v17 Gemini
 * seed is fine — just reverse the Kling output in post).
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
    name: "v19-beat5-stepping-on-cover",
    ref: "public/images/spot-seeds/v14/v16-beat5-weight-on-cover.jpg",
    prompt:
      "Low side-rear angle product photograph showing a worker standing on top of the matte black tri-fold tonneau cover on a black Ford F-150 bed. " +
      "Visible: brown leather work boots, denim jeans cuffed at the ankle, lower legs/calves. " +
      "Pose is MID-STEP: the rear foot is PLANTED firmly on the cover (full sole contact), the front foot is LIFTED about 4 inches off the cover, mid-stride forward, sole tilted slightly. Subtle motion blur on the lifted boot to suggest movement. " +
      "The cover surface beneath the planted foot stays PERFECTLY FLAT — zero flex, zero sag, no deformation under adult body weight. " +
      "F-150 tailgate visible in lower right corner with Ford badge. Bed liner visible to the side. " +
      "Outdoor overcast natural daylight. Photoreal commercial use photography, shallow depth of field with the boots and cover surface in sharp focus. " +
      "NO logos, NO water, NO chrome, NO glove. 16:9 aspect ratio.",
  },
  {
    name: "v19-beat6-fingers-under-panel",
    ref: "public/images/spot-seeds/v14/v17-beat6-bare-hand-lift.jpg",
    prompt:
      "Side product/use photograph showing a man's BARE hand lifting the rear panel of a matte black hard tri-fold tonneau cover on a black Ford F-150. " +
      "The hand's FOUR FINGERS are wrapped UNDERNEATH the panel's bottom edge — fingers hidden beneath, pressing UP against the underside of the panel. The THUMB rests on the top surface of the panel. This is how you actually lift a tonneau cover panel — fingers below the edge, thumb above, like prying open a car hood. " +
      "The panel is tilted up at about 45 degrees, mid-lift. " +
      "Side view from the rear corner of the bed. The wrist actively drives upward lifting motion. Only the back of the hand, the thumb, and wrist/forearm are visible from above — the four fingers are out of sight under the panel. " +
      "Front and middle cover panels stay flat on the bed rails. Outdoor natural overcast daylight. " +
      "Photoreal commercial use photography, shallow depth of field with the panel and the hand in sharp focus. " +
      "NO glove on the hand. NO logos. NO tools. 16:9 aspect ratio.",
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
