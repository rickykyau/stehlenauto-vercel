/**
 * Generate the v15 install-demo seed:
 *   seed-beat1-install-clamp.jpg — a side rail underside view showing
 *   the C-clamp mechanism tightening onto the F-150 bed rail edge,
 *   a small wrench engaging the clamp bolt. Owner wants the "no drilling"
 *   story SHOWN, not just labeled.
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
const OUT = path.join(REPO, "public/images/spot-seeds/v14/seed-beat1-install-clamp.jpg");

// Reference: the same matte tonneau rail family + black F-150 used in Beat 4
const REFERENCE = path.join(REPO, "public/images/spot-seeds/v14/seed-beat4-water-drainage.jpg");
const refB64 = fs.readFileSync(REFERENCE).toString("base64");

const PROMPT =
  "A close-up commercial product photograph showing the underside view of a matte black hard tonneau cover side rail being installed onto the bed rail of a black Ford F-150 truck. " +
  "A black metal C-clamp mechanism is visible at the rail's edge, gripping the inner lip of the truck's bed rail. The clamp has a hex-head bolt at its base. " +
  "A worker's hand is visible holding a small hex/ratchet wrench engaged on the clamp's bolt, mid-turn — the install moment. " +
  "The angle is close, slightly low, looking at the clamp from underneath the rail edge so the viewer sees the clamp grabbing the truck's bed rail lip. " +
  "Outdoor overcast daylight, soft natural lighting from above. " +
  "The matte black cover is partially visible at the top of the frame. The black F-150 body panel is partially visible at the left. The truck's black bed liner is partially visible to the right. " +
  "NO drilling, NO drilled holes, NO power drill. NO logos. " +
  "Photoreal high-fidelity commercial product / install photography, shallow depth of field with the clamp + wrench in sharp focus. 16:9 aspect ratio.";

console.log(`prompt: ${PROMPT.length} chars`);

const body = {
  contents: [
    {
      role: "user",
      parts: [
        { text: PROMPT },
        { inlineData: { mimeType: "image/jpeg", data: refB64 } },
      ],
    },
  ],
  generationConfig: { responseModalities: ["IMAGE"] },
};

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
if (!imgPart) throw new Error(`no image: ${JSON.stringify(data).slice(0, 400)}`);
const buf = Buffer.from(imgPart.inlineData.data, "base64");
fs.writeFileSync(OUT, buf);
console.log(`✓ ${(buf.length / 1024).toFixed(0)} KB → ${path.relative(REPO, OUT)}`);
