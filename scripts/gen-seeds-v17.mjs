/**
 * v17 — re-target stories per owner's specific feedback.
 *   Beat 1: bare hand LOWERING cover onto bed rail (placement moment, no tool)
 *   Beat 4: cover ajar showing DRY bed interior while rain hits top of cover
 *   Beat 5: bare hand PRESSING DOWN hard on cover surface, cover unflexed
 *   Beat 6: bare hand gripping rear panel mid-lift (no gloves)
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
    name: "v17-beat1-cover-placement",
    ref: "public/images/spot-seeds/v14/v16-beat1-clamp-on-rail.jpg",
    prompt:
      "Close-up product/install photograph showing a man's BARE hands (no gloves, no tool) LOWERING the matte black hard tonneau cover assembly down onto the top of a black Ford F-150 bed rail. " +
      "The cover edge is in the air about 4 inches above the bed rail — captured mid-placement, just before touchdown. " +
      "Both bare hands grip the cover edge — one on each side. The hands are clean, healthy male hands. NO gloves at all. NO clamp tool. NO wrench. NO drill. " +
      "The cover's BUILT-IN side rail (with its own integrated clamp mechanism visible underneath) is positioned to land flush onto the truck's bed rail top. " +
      "Side angle along the rail edge. Outdoor overcast natural daylight. Photoreal, shallow depth of field, the cover edge and hands in sharp focus. " +
      "NO drilled holes, NO chrome, NO logos, NO tools at all. 16:9 aspect ratio.",
  },
  {
    name: "v17-beat4-dry-bed-interior",
    ref: "public/images/spot-seeds/v14/v16-beat4-water-wide.jpg",
    prompt:
      "Product photograph from a low side angle showing a black Ford F-150 truck bed. The matte black hard tri-fold tonneau cover is partially open — the rear panel is folded forward revealing the rear half of the bed underneath. " +
      "Water droplets are scattered across the CLOSED portion of the cover (front + middle panels) on top. Light rain is visibly falling onto the cover from above. " +
      "The OPEN bed interior visible underneath is PERFECTLY DRY — black textured spray-in bed liner, no water, no moisture, no damp spots. Inside the bed sits a leather work bag or cardboard box that is also dry. " +
      "The contrast is the story: wet cover top vs dry interior. " +
      "Outdoor overcast post-rain daylight. Photoreal commercial product photography, shallow depth of field, the wet cover top and dry interior both readable. " +
      "NO people, NO logos, NO mud. 16:9 aspect ratio.",
  },
  {
    name: "v17-beat5-sturdiness-press",
    ref: "public/images/spot-seeds/v14/v16-beat5-weight-on-cover.jpg",
    prompt:
      "Close-up product/use photograph showing a man's BARE hand (no glove) PRESSING DOWN HARD on the top surface of a matte black hard tri-fold tonneau cover on a black Ford F-150. " +
      "The hand applies firm downward pressure — visibly leaning into the cover, fingers slightly compressed against the surface, knuckles white from the effort. " +
      "The cover surface beneath the hand is PERFECTLY FLAT — does not flex, does not dent, does not bow. The story is RIGID STURDINESS — even under direct hand pressure the cover holds firm. " +
      "Side angle along the cover surface showing both the pressing hand and the cover's flatness. Outdoor overcast daylight. " +
      "NO glove on the hand. NO water, NO logos. Photoreal high-fidelity, shallow depth of field with the hand and the cover surface in sharp focus. 16:9 aspect ratio.",
  },
  {
    name: "v17-beat6-bare-hand-lift",
    ref: "public/images/spot-seeds/v14/v16-beat6-hands-lift.jpg",
    prompt:
      "Product/use photograph from a side angle showing a man's BARE hand (no glove) firmly gripping the rear panel of a matte black hard tri-fold tonneau cover on a black Ford F-150. " +
      "The panel is being LIFTED OPEN — currently tilted up at about 30 degrees, mid-lift. The bare hand is the visible motion driver — fingers wrapped around the edge of the panel, wrist active. " +
      "Just one bare hand visible in frame, doing the lifting work. The front and middle cover panels stay flat on the bed rails. " +
      "Outdoor natural overcast daylight. Photoreal commercial use photography, shallow depth of field with the panel edge and the bare hand in sharp focus. " +
      "NO glove. NO logos, NO tools. 16:9 aspect ratio.",
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
