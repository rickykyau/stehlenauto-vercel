import VEHICLE_WORDS from "./vehicle-words.json";

/**
 * <title> for a PDP. Catalog titles lead with the vehicles
 * ("2011-2015 Chevrolet Cruze & 2012-2017 Buick Verano 1.25" Trailer Hitch - Class 1"),
 * so end-truncation dropped the product name — the main ranking keyword — on
 * ~70% of listings. When the title is too long, move the product phrase to the
 * front: "1.25" Trailer Hitch for 2011-2015 Chevrolet Cruze & 2012-2017 Buick…".
 *
 * The " | Stehlen Auto" suffix is added by the root title template.
 */

// Google shows ~60 chars but ranks on the whole <title>; allow a little more
// so the first vehicle always survives.
const MAX = 70;

// Product nouns that end the "what is it" phrase. Longest first so
// "Tonneau Cover" wins over "Cover".
const PRODUCT_NOUNS = [
  "tonneau cover", "bed cover", "trailer hitch", "hitch receiver", "receiver hitch",
  "ball mount", "hitch step", "cargo carrier", "bike rack", "wiring harness",
  "t-connector", "bull guard", "grille guard", "bull bar", "front grille", "grille",
  "running boards", "running board", "side steps", "side step bars", "step bars",
  "nerf bars", "rock sliders", "rock slider", "bed mat", "floor mats", "floor mat",
  "floor liners", "trunk mat", "cargo mat", "bed liner", "headlights", "headlight",
  "tail lights", "taillights", "tail light", "fog lights", "light bar", "bed light",
  "roof rack", "roof basket", "chase rack", "sport bar", "molle panels", "molle panel",
  "storage box", "organizer box", "underseat storage", "bumper", "skid plate",
  "mud flaps", "fender flares", "tow hooks", "hitch", "cover",
];
const NOUN_RE = new RegExp(
  `\\b(${PRODUCT_NOUNS.map((n) => n.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")).join("|")})\\b`,
  "i",
);
const WORDS = new Set<string>(VEHICLE_WORDS as string[]);
const YEAR_RE = /^\(?(19|20)\d{2}(\s*[-–]\s*((19|20)?\d{2}))?\+?\)?,?$/;

function isVehicleToken(tok: string): boolean {
  if (/[()]/.test(tok)) return true; // "(+ 2019-2024 Ram 1500 Classic)"
  const t = tok.toLowerCase().replace(/[,;:]$/, "");
  if (!t) return true;
  if (YEAR_RE.test(t)) return true;
  if (/^\d{3,4}(-\d{3,4})?$/.test(t)) return true; // 1500, 2500-5500, 300
  if (/^[&/|+]$/.test(t) || t.includes("/")) return true;
  return WORDS.has(t);
}

export function productMetaTitle(rawTitle: string): string {
  const title = rawTitle.replace(/^stehlen\s+/i, "").replace(/\s+/g, " ").trim();
  if (title.length <= MAX) return title;

  const m = NOUN_RE.exec(title);
  if (m) {
    // Walk left from the noun over modifier words ("5.8 ft Bed Hard Tri-Fold")
    // until we hit a vehicle token (year, make, model, "&", "/").
    const before = title.slice(0, m.index).trim().split(" ").filter(Boolean);
    let i = before.length;
    while (i > 0 && !isVehicleToken(before[i - 1])) i--;
    const vehicles = before.slice(0, i).join(" ").replace(/[\s,&/|+(–-]+$/, "");
    const modifiers = before.slice(i);
    // Variant detail after the noun, up to the " - Color" style suffix:
    // " w/ LED Light Bar", " Combo w/ LED Lights".
    const detail = title.slice(m.index + m[0].length).split(/\s[-–—|]\s/)[0].trim();
    if (vehicles && /\d/.test(vehicles)) {
      const first = vehicles.split(/\s*(?:,|&|\s\/\s|\(\+)\s*/)[0];
      const noun = [...modifiers, m[0]].join(" ");
      const full = detail ? `${noun} ${detail}` : noun;
      const candidates = [
        `${full} for ${vehicles}`,
        `${noun} for ${vehicles}`,
        `${full} for ${first}`,
        `${noun} for ${first}`,
      ];
      // Drop leading modifiers ("5.5 Ft Bed Hidden Snap …") before ever
      // dropping the vehicle.
      // Never start on a dangling unit ("ft Bed …").
      for (let k = 1; k < modifiers.length; k++)
        if (!/^(ft|in|inch|bed)\b/i.test(modifiers[k]))
          candidates.push(`${[...modifiers.slice(k), m[0]].join(" ")} for ${first}`);
      const hit = candidates.find((c) => c.length <= MAX);
      if (hit) return hit;
      return fit(`${m[0]} for ${vehicles}`);
    }
  }
  return fit(title);
}

function fit(s: string): string {
  if (s.length <= MAX) return s;
  return s.slice(0, MAX - 1).replace(/[\s\-,&/]+\S*$/, "") + "…";
}
