/**
 * build-spot-v13.mjs
 *
 * Assembles v13 — the product-first Tacoma tonneau spot.
 * 7 beats, 30s total, 1920x1080 @ 24fps, h264.
 *
 * Beats (all Runway Gen-4 turbo image-to-video):
 *   1 (0:00–0:04) — driveway arrival
 *   2 (0:04–0:07) — pebble-grain surface macro (CROP bottom half of source)
 *   3 (0:07–0:10) — bolt-action latch + safety buckle (CROP top 15% to hide hand)
 *   4 (0:10–0:12) — security drift past closed cover
 *   5 (0:12–0:21) — LED HERO: 4 puck ignition (skip first 1s dim phase)
 *   6 (0:21–0:26) — fold-open accordion (trim from 8s)
 *   7 (0:26–0:30) — value card + Stehlen end card (reused from v12)
 *
 * Audio: silent master if MUSIC_PATH unset. Else mixes the music under the cut
 *        with the standard ducking arc (fade-in 0:00, full at 0:01, hold,
 *        fade to near-silence 0:27, silent under end card).
 *
 * Run:
 *   node scripts/build-spot-v13.mjs                       # silent master
 *   MUSIC_PATH=public/audio/foo.mp3 node scripts/build-spot-v13.mjs
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const STOCK = path.join(REPO_ROOT, "public/videos/spot-clips/stock");
const FRAMES_V12 = path.join(REPO_ROOT, "public/videos/spot-clips/frames-v12");
const TMP = path.join(REPO_ROOT, "public/videos/spot-clips/.v13-tmp");
const OUT_DIR = path.join(REPO_ROOT, "public/videos/spot-clips");
const OUT_SILENT = path.join(OUT_DIR, "stehlen-tacoma-tonneau-spot-v13-silent.mp4");
const OUT_FINAL = path.join(OUT_DIR, "stehlen-tacoma-tonneau-spot-v13.mp4");

fs.mkdirSync(TMP, { recursive: true });

const sh = (cmd) => {
  console.log(`+ ${cmd.slice(0, 180)}${cmd.length > 180 ? "..." : ""}`);
  execSync(cmd, { stdio: "inherit" });
};

const FPS = 24;
const W = 1920;
const H = 1080;

// Common preprocess: scale to 1920x1080, force 24fps, h264 yuv420p
const NORMALIZE = `scale=${W}:${H}:flags=lanczos,setsar=1,fps=${FPS},format=yuv420p`;

// Beat 1 — driveway arrival. Trim to 4s, normalize.
sh(
  `ffmpeg -y -ss 0 -t 4 -i "${STOCK}/runway-v13-beat1.mp4" -an -vf "${NORMALIZE}" -c:v libx264 -crf 16 -preset slow "${TMP}/b1.mp4"`,
);

// Beat 2 — pebble-grain. Source is a diptych: crop bottom half (texture), then trim 3s.
//   crop=W:H/2:0:H/2 picks the bottom half of frame.
sh(
  `ffmpeg -y -ss 0.5 -t 3 -i "${STOCK}/runway-v13-beat2.mp4" -an -vf "crop=iw:ih/2:0:ih/2,${NORMALIZE}" -c:v libx264 -crf 16 -preset slow "${TMP}/b2.mp4"`,
);

// Beat 3 — latch. Crop top 15% of frame to hide the hand at the top edge.
//   crop=W:H*0.85:0:H*0.15 keeps bottom 85% of frame, then scale back up.
sh(
  `ffmpeg -y -ss 0 -t 3 -i "${STOCK}/runway-v13-beat3.mp4" -an -vf "crop=iw:ih*0.82:0:ih*0.18,${NORMALIZE}" -c:v libx264 -crf 16 -preset slow "${TMP}/b3.mp4"`,
);

// Beat 4 — security drift. Trim to 2s.
sh(
  `ffmpeg -y -ss 0.5 -t 2 -i "${STOCK}/runway-v13-beat4.mp4" -an -vf "${NORMALIZE}" -c:v libx264 -crf 16 -preset slow "${TMP}/b4.mp4"`,
);

// Beat 5 — LED HERO. Skip first 1s (dim startup), use 9s from t=1 to t=10.
sh(
  `ffmpeg -y -ss 1 -t 9 -i "${STOCK}/runway-v13-beat5-2.mp4" -an -vf "${NORMALIZE}" -c:v libx264 -crf 16 -preset slow "${TMP}/b5.mp4"`,
);

// Beat 6 — fold-open. Trim to 5s.
sh(
  `ffmpeg -y -ss 0.5 -t 5 -i "${STOCK}/runway-v13-beat6.mp4" -an -vf "${NORMALIZE}" -c:v libx264 -crf 16 -preset slow "${TMP}/b6.mp4"`,
);

// Beat 7 — value card (2s) + end card (2s) from v12 still frames.
sh(
  `ffmpeg -y -loop 1 -t 2 -i "${FRAMES_V12}/v12-valueline-card-full.jpg" -an -vf "${NORMALIZE}" -c:v libx264 -crf 16 -preset slow "${TMP}/b7a.mp4"`,
);
sh(
  `ffmpeg -y -loop 1 -t 2 -i "${FRAMES_V12}/v12-endcard-full.jpg" -an -vf "${NORMALIZE}" -c:v libx264 -crf 16 -preset slow "${TMP}/b7b.mp4"`,
);

// Concat all beats
const concatList = path.join(TMP, "concat.txt");
fs.writeFileSync(
  concatList,
  [
    `file '${TMP}/b1.mp4'`,
    `file '${TMP}/b2.mp4'`,
    `file '${TMP}/b3.mp4'`,
    `file '${TMP}/b4.mp4'`,
    `file '${TMP}/b5.mp4'`,
    `file '${TMP}/b6.mp4'`,
    `file '${TMP}/b7a.mp4'`,
    `file '${TMP}/b7b.mp4'`,
  ].join("\n"),
);

// Build the silent master. Add grain + slight vignette + teal-bias grade.
//   eq: minor contrast / saturation bump
//   colorbalance: shadow teal lift, mid warm
//   noise: 35mm-ish grain
const GRADE =
  "eq=contrast=1.05:saturation=0.88," +
  "colorbalance=rs=-0.05:bs=0.06:gs=0.02:rm=0.02:gm=0:bm=-0.02," +
  "vignette=PI/5," +
  "noise=alls=8:allf=t+u";

sh(
  `ffmpeg -y -f concat -safe 0 -i "${concatList}" -vf "${GRADE}" -c:v libx264 -crf 17 -preset slow -pix_fmt yuv420p -movflags +faststart -r ${FPS} "${OUT_SILENT}"`,
);

console.log(`\n✓ silent master: ${path.relative(REPO_ROOT, OUT_SILENT)}`);

// If MUSIC_PATH given, mix audio under the cut.
const MUSIC = process.env.MUSIC_PATH
  ? path.resolve(REPO_ROOT, process.env.MUSIC_PATH)
  : null;
if (MUSIC && fs.existsSync(MUSIC)) {
  // Volume arc: full at 0, slight duck under buckle click at 0:09, restore,
  // hold under LED, fade to silence over 0:27-0:30.
  // Using a simpler model: full -> small duck -> full -> fade out tail.
  //   volume(0.0)=0.5, volume(0.5)=1.0, volume(8.5)=1.0, volume(9)=0.5,
  //   volume(10)=1.0, volume(27)=1.0, volume(30)=0.0
  const VOL_FILTER =
    "volume='if(lt(t,0.5),t*2,if(lt(t,8.5),1,if(lt(t,9.0),1-(t-8.5)*1,if(lt(t,10),0.5+(t-9)*1,if(lt(t,27),1,1-(t-27)/3)))))':eval=frame";
  sh(
    `ffmpeg -y -i "${OUT_SILENT}" -stream_loop -1 -i "${MUSIC}" -map 0:v -map 1:a -af "${VOL_FILTER},aformat=channel_layouts=stereo" -c:v copy -c:a aac -b:a 192k -shortest "${OUT_FINAL}"`,
  );
  console.log(`✓ final with music: ${path.relative(REPO_ROOT, OUT_FINAL)}`);
} else {
  console.log(`\n(no music — silent master only. To layer music:`);
  console.log(`   MUSIC_PATH=public/audio/v13-pixabay-454726.mp3 node scripts/build-spot-v13.mjs )`);
}
