/**
 * build-spot-v14.mjs
 *
 * Assembles v14 — reference-driven feature storytelling spot.
 *
 * Structure (30s, 7 beats + end card):
 *   1 (0:00-4)  Install — "NO DRILLING · NO TOOLS"
 *   2 (0:04-8)  Sturdy aluminum — "ALUMINUM FRAME · IMPACT CORE"
 *   3 (0:08-12) Bolt latch — "BOLT-ACTION LATCH · STAYS SECURE"
 *   4 (0:12-16) Water drain — "WATER DRAINS · BED STAYS DRY"
 *   5 (0:16-20) Load capacity — "HOLDS YOUR LOAD"
 *   6 (0:20-25) Opens easy — "OPENS IN SECONDS"
 *   7 (0:25-28) Hero — (no overlay, slow drift)
 *   END (0:28-30) Stehlen end card with yellow CTA (reused from v12)
 *
 * Music: public/audio/v14-ambient-pad.mp3 (sparse cinematic pad,
 *        profile-verified against reference video).
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, "..");
const STOCK = path.join(REPO, "public/videos/spot-clips/stock");
const FRAMES_V12 = path.join(REPO, "public/videos/spot-clips/frames-v12");
const TMP = path.join(REPO, "public/videos/spot-clips/.v14-tmp");
const OUT_DIR = path.join(REPO, "public/videos/spot-clips");
const MUSIC = path.join(REPO, "public/audio/v14-ambient-pad.mp3");

fs.mkdirSync(TMP, { recursive: true });

const sh = (cmd) => {
  console.log(`+ ${cmd.length > 200 ? cmd.slice(0, 200) + "..." : cmd}`);
  execSync(cmd, { stdio: "inherit" });
};

const W = 1920;
const H = 1080;
const FPS = 24;

// macOS ffmpeg from homebrew often lacks drawtext (no libfreetype). Use
// ImageMagick to pre-render text PNGs with transparency, then ffmpeg overlay.
const NORMALIZE = `scale=${W}:${H}:flags=lanczos,setsar=1,fps=${FPS},format=yuv420p`;

function renderOverlayPng(text, outPath, fontPt = 56) {
  // Wide auto-sized box: padding + measured text. ImageMagick caption sizing
  // is finicky, so we lock width and let height auto. Black semi-transparent
  // backdrop, white uppercase text, Menlo-Bold font.
  const escaped = text.replace(/"/g, '\\"').replace(/'/g, "'\\''");
  // -background "rgba(0,0,0,0.6)" -fill white -font Menlo-Bold -pointsize NN
  //   label:'TEXT' -bordercolor "rgba(0,0,0,0.6)" -border WxH
  // ImageMagick on this Mac has no font aliases registered; use full TTC path.
  sh(
    `magick -background "rgba(0,0,0,0.65)" -fill white ` +
    `-font "/System/Library/Fonts/Menlo.ttc" -pointsize ${fontPt} ` +
    `-gravity Center label:'${escaped}' ` +
    `-bordercolor "rgba(0,0,0,0.65)" -border 36x20 ` +
    `"${outPath}"`,
  );
}

// Per beat: use the full 5s Runway output. Owner cleared duration to 37s total
// (closer to the reference's 39.8s breathing room). Text overlay sits in the
// middle 3.5s with 0.6s fade in/out at each edge.
const BEATS = [
  { name: "v14-beat1-install", trim: { ss: 0, t: 5 }, text: "NO DRILLING · NO TOOLS", textRange: [0.8, 4.4] },
  { name: "v14-beat2-aluminum", trim: { ss: 0, t: 5 }, text: "ALUMINUM FRAME · IMPACT CORE", textRange: [0.8, 4.4] },
  { name: "v14-beat3-latch", trim: { ss: 0, t: 5 }, text: "BOLT-ACTION LATCH", textRange: [0.8, 4.4] },
  { name: "v14-beat4-water", trim: { ss: 0, t: 5 }, text: "WATER DRAINS · BED STAYS DRY", textRange: [0.8, 4.4] },
  { name: "v14-beat5-load", trim: { ss: 0, t: 5 }, text: "BUILT STURDY", textRange: [0.8, 4.4] },
  { name: "v14-beat6-foldopen", trim: { ss: 0, t: 5 }, text: "OPENS IN SECONDS", textRange: [0.8, 4.4] },
  { name: "v14-beat7-hero", trim: { ss: 0, t: 5 }, text: null },
];
// 7 × 5s = 35s + 2s end card = 37s total runtime

// v16: new story-driven seeds for Beats 1, 4, 5, 6 — composition correct,
// no crops needed except the macro on Beat 2. Beat 6 reverse stays — Runway
// still tends to close the cover rather than open it, even with the right
// motion seed; reversing produces the opening motion the title needs.
const CROPS = {
  // Beat 2 — crop further into the bottom 40% to skip the seed-diptych
  // boundary that was creating a visible gradient line at the top of v17.
  "v14-beat2-aluminum": "crop=iw:ih*0.4:0:ih*0.6",
};
// v18: Kling Beat 6 motion goes open→closed. Reverse so it plays as the
// fold-open story (flat → hand grips at mid → panel rises). Hand geometry
// is correct at 2.5s/4.5s (fingers on outside edge, no clipping).
const REVERSED = new Set(["v14-beat6-foldopen"]);

for (const b of BEATS) {
  const src = path.join(STOCK, `runway-${b.name}.mp4`);
  if (!fs.existsSync(src)) {
    console.error(`MISSING: ${src} — skipping`);
    continue;
  }
  const cropFilter = CROPS[b.name] ? `${CROPS[b.name]},` : "";
  const reverseFilter = REVERSED.has(b.name) ? "reverse," : "";
  const out = path.join(TMP, `${b.name}.mp4`);

  if (b.text) {
    // Pre-render text overlay PNG with ImageMagick
    const pngPath = path.join(TMP, `overlay-${b.name}.png`);
    renderOverlayPng(b.text, pngPath);

    // ffmpeg: crop+normalize base video, fade overlay PNG in/out, composite
    const [inT, outT] = b.textRange;
    const fadeOutStart = outT - 0.3;
    const filter =
      `[0:v]${reverseFilter}${cropFilter}${NORMALIZE}[bg];` +
      `[1:v]format=rgba,fade=t=in:st=${inT}:d=0.3:alpha=1,` +
      `fade=t=out:st=${fadeOutStart}:d=0.3:alpha=1[txt];` +
      `[bg][txt]overlay=x=(W-w)/2:y=H-220:shortest=1[v]`;
    sh(
      `ffmpeg -y -ss ${b.trim.ss} -t ${b.trim.t} -i "${src}" -loop 1 -t ${b.trim.t} -i "${pngPath}" ` +
      `-filter_complex "${filter}" -map "[v]" -an -c:v libx264 -crf 17 -preset slow "${out}"`,
    );
  } else {
    sh(
      `ffmpeg -y -ss ${b.trim.ss} -t ${b.trim.t} -i "${src}" -an -vf "${reverseFilter}${cropFilter}${NORMALIZE}" ` +
      `-c:v libx264 -crf 17 -preset slow "${out}"`,
    );
  }
}

// End card from v12 — 2s. (reused asset, owner said brand bookends light.)
sh(
  `ffmpeg -y -loop 1 -t 2 -i "${FRAMES_V12}/v12-endcard-full.jpg" -an -vf "${NORMALIZE}" -c:v libx264 -crf 17 -preset slow "${TMP}/endcard.mp4"`,
);

// Concat list (only beats that exist)
const segments = [];
for (const b of BEATS) {
  const p = path.join(TMP, `${b.name}.mp4`);
  if (fs.existsSync(p)) segments.push(p);
}
segments.push(path.join(TMP, "endcard.mp4"));

const concatList = path.join(TMP, "concat.txt");
fs.writeFileSync(concatList, segments.map((p) => `file '${p}'`).join("\n"));

const concatRaw = path.join(TMP, "v14-concat-raw.mp4");
sh(`ffmpeg -y -f concat -safe 0 -i "${concatList}" -c copy "${concatRaw}"`);

// Determine total duration so music fades match exactly
const totalDur = parseFloat(
  execSync(
    `ffprobe -v error -show_entries format=duration -of csv=p=0 "${concatRaw}"`,
    { encoding: "utf8" },
  ).trim(),
);
console.log(`[v14] total duration: ${totalDur.toFixed(2)}s`);

// Final grade: subtle film texture + grain (light, since the seeds are already photographic)
//   eq:           slight contrast + saturation
//   colorbalance: very slight teal-bias to shadows
//   noise:        light 35mm grain
const GRADE =
  "eq=contrast=1.04:saturation=0.95," +
  "colorbalance=rs=-0.03:bs=0.03," +
  "noise=alls=5:allf=t+u";

// Build silent master with grade
const silent = path.join(OUT_DIR, "stehlen-tacoma-tonneau-spot-v18-silent.mp4");
sh(
  `ffmpeg -y -i "${concatRaw}" -vf "${GRADE}" -c:v libx264 -crf 17 -preset slow -pix_fmt yuv420p -movflags +faststart -r ${FPS} "${silent}"`,
);

// Layer music with arc:
//   - fade-in 0-1s
//   - hold full through 0:25
//   - fade out 25-30
const VOL =
  `volume='if(lt(t,1),t,if(lt(t,${totalDur - 4}),1,1-(t-(${totalDur - 4}))/4))':eval=frame`;
const final = path.join(OUT_DIR, "stehlen-tacoma-tonneau-spot-v18.mp4");
sh(
  `ffmpeg -y -i "${silent}" -stream_loop -1 -i "${MUSIC}" -map 0:v -map 1:a -af "${VOL},aformat=channel_layouts=stereo" -c:v copy -c:a aac -b:a 192k -shortest "${final}"`,
);

// Re-encode shareable
const share = path.join(OUT_DIR, "stehlen-tacoma-tonneau-spot-v18-share.mp4");
sh(
  `ffmpeg -y -i "${final}" -c:v libx264 -crf 23 -preset slow -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 192k "${share}"`,
);

console.log(`\n✓ v14 final:  ${path.relative(REPO, final)}`);
console.log(`✓ v14 share:  ${path.relative(REPO, share)}`);
console.log(`✓ v14 silent: ${path.relative(REPO, silent)}`);
