/**
 * automate-v13-ship.mjs
 *
 * Fully hands-off v13 finishing pipeline:
 *   1. Procure music (use Pixabay mp3 if owner dropped it in, else synthesize
 *      a dark-ambient pulse bed with ffmpeg — same vibe as the Pixabay pick).
 *   2. Build the final cut with music + grade + grain + value/end cards.
 *   3. Re-encode to a shareable mp4 (CRF 23, ~10 MB).
 *   4. Git-commit the spot artifacts.
 *   5. Push to main (Vercel auto-deploys).
 *
 * No prompts, no decisions, no waiting. End-to-end.
 *
 * Run:   node scripts/automate-v13-ship.mjs
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, "..");

const sh = (cmd, opts = {}) => {
  console.log(`+ ${cmd.length > 200 ? cmd.slice(0, 200) + "..." : cmd}`);
  return execSync(cmd, { stdio: opts.silent ? "pipe" : "inherit", encoding: "utf8" });
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. PROCURE MUSIC
// ─────────────────────────────────────────────────────────────────────────────
const AUDIO_DIR = path.join(REPO, "public/audio");
fs.mkdirSync(AUDIO_DIR, { recursive: true });

const PIXABAY_MP3 = path.join(AUDIO_DIR, "v13-pixabay-454726.mp3");
const SYNTH_MP3 = path.join(AUDIO_DIR, "v13-synth-bed.mp3");

let MUSIC_PATH;
let MUSIC_SOURCE;

if (fs.existsSync(PIXABAY_MP3) && fs.statSync(PIXABAY_MP3).size > 100_000) {
  MUSIC_PATH = PIXABAY_MP3;
  MUSIC_SOURCE = "Pixabay #454726 (owner-supplied)";
  console.log(`[music] using Pixabay mp3: ${path.relative(REPO, PIXABAY_MP3)}`);
} else {
  // Synthesize a dark-ambient pulse bed — 30s, 84 BPM, D minor, sparse.
  // Layers:
  //   - sub drone: 73.42 Hz (D2) sine at low level
  //   - mid drone: 146.83 Hz (D3) sine, slight detune via LFO
  //   - high air: 587.33 Hz (D5) sine, very low, tremolo
  //   - pulse: 2.857 Hz (84 BPM / 60 = 1.4 Hz, doubled for 168 = pulse every half-beat),
  //     gated low rumble for industrial feel
  //   - noise wash: filtered pink noise, very low
  console.log("[music] no Pixabay mp3 found — synthesizing dark-ambient bed (84 BPM, D minor)");
  const filter =
    // Sub D2
    "sine=frequency=73.42:sample_rate=44100:duration=30[sub];" +
    // Mid D3 with slight pitch wobble (vibrato simulated via sin source)
    "sine=frequency=146.83:sample_rate=44100:duration=30[mid];" +
    // High D5 — slow tremolo
    "sine=frequency=587.33:sample_rate=44100:duration=30,tremolo=f=0.5:d=0.5[high];" +
    // Pulse — low-frequency click at 84 BPM (1.4 Hz beat → use 0.7 Hz at half-time)
    "sine=frequency=55:sample_rate=44100:duration=30,tremolo=f=1.4:d=0.95[pulse];" +
    // Pink-noise wash (high-cut to take edge off)
    "anoisesrc=duration=30:color=pink:sample_rate=44100,lowpass=f=800,highpass=f=200[wash];" +
    // Mix down with restrained levels
    "[sub]volume=0.18[sub2];" +
    "[mid]volume=0.10[mid2];" +
    "[high]volume=0.04[high2];" +
    "[pulse]volume=0.08[pulse2];" +
    "[wash]volume=0.04[wash2];" +
    "[sub2][mid2][high2][pulse2][wash2]amix=inputs=5:duration=longest:normalize=0[mix];" +
    // Slow fade-in 0–1s, fade-out 27–30s
    "[mix]afade=t=in:st=0:d=1,afade=t=out:st=27:d=3";

  sh(
    `ffmpeg -y -filter_complex "${filter}" -t 30 -ar 44100 -ac 2 -c:a libmp3lame -b:a 192k "${SYNTH_MP3}"`,
  );
  MUSIC_PATH = SYNTH_MP3;
  MUSIC_SOURCE = "Synthesized ffmpeg dark-ambient pad (placeholder — swap for Pixabay #454726 anytime)";
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. BUILD FINAL CUT WITH MUSIC
// ─────────────────────────────────────────────────────────────────────────────
const FINAL_FULL = path.join(REPO, "public/videos/spot-clips/stehlen-tacoma-tonneau-spot-v13.mp4");
sh(`MUSIC_PATH="${path.relative(REPO, MUSIC_PATH)}" node scripts/build-spot-v13.mjs`);

// ─────────────────────────────────────────────────────────────────────────────
// 3. RE-ENCODE SHAREABLE COPY
// ─────────────────────────────────────────────────────────────────────────────
const FINAL_SHARE = path.join(REPO, "public/videos/spot-clips/stehlen-tacoma-tonneau-spot-v13-share.mp4");
sh(
  `ffmpeg -y -i "${FINAL_FULL}" -c:v libx264 -crf 23 -preset slow -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 192k "${FINAL_SHARE}"`,
);
const shareKb = Math.round(fs.statSync(FINAL_SHARE).size / 1024);
console.log(`\n[share] ${path.relative(REPO, FINAL_SHARE)} — ${(shareKb / 1024).toFixed(2)} MB`);

// ─────────────────────────────────────────────────────────────────────────────
// 4. GIT COMMIT
// ─────────────────────────────────────────────────────────────────────────────
const ARTIFACTS = [
  "public/videos/spot-clips/stehlen-tacoma-tonneau-spot-v13.mp4",
  "public/videos/spot-clips/stehlen-tacoma-tonneau-spot-v13-share.mp4",
  "public/videos/spot-clips/stehlen-tacoma-tonneau-spot-v13-silent.mp4",
  "public/videos/spot-clips/stehlen-tacoma-tonneau-spot-v13-silent-share.mp4",
  "public/videos/spot-clips/stock/runway-v13-beat1.mp4",
  "public/videos/spot-clips/stock/runway-v13-beat2.mp4",
  "public/videos/spot-clips/stock/runway-v13-beat3.mp4",
  "public/videos/spot-clips/stock/runway-v13-beat4.mp4",
  "public/videos/spot-clips/stock/runway-v13-beat5-2.mp4",
  "public/videos/spot-clips/stock/runway-v13-beat6.mp4",
  "public/videos/spot-clips/frames-v13/",
  "public/audio/",
  "scripts/runway-generate-v13-beat5.mjs",
  "scripts/runway-generate-v13-rest.mjs",
  "scripts/runway-generate-v13-beat2-refire.mjs",
  "scripts/build-spot-v13.mjs",
  "scripts/automate-v13-ship.mjs",
];

// Stage only files that actually exist (some may be missing if first run)
const existing = ARTIFACTS.filter((p) => {
  const abs = path.join(REPO, p);
  return fs.existsSync(abs);
});
sh(`git add ${existing.map((p) => `"${p}"`).join(" ")}`);

const msg = `Cycle 14BJ: ship v13 Tacoma tonneau spot — product-first rebuild

v13 replaces v12's cinematic desert opener with a product-first structure
covering surface texture, latch, security, LED ignition, and fold-open.
Rendered with Runway gen4_turbo (5 prompt iterations to nail the LED beat,
porthole artifact caught + fixed in the audit), assembled with ffmpeg grade
+ grain pipeline, 30s 1920x1080 24fps.

Music: ${MUSIC_SOURCE}.

Total render cost: ~$4.65 / $6.50 budget.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>`;

try {
  sh(
    `git -c user.name="Ricky Yau" -c user.email="ricky@Rickys-MacBook-Pro.local" commit -m "$(cat <<'COMMITMSG'
${msg}
COMMITMSG
)"`,
  );
} catch (err) {
  // Nothing to commit is fine (re-run safety)
  console.log("[git] nothing to commit OR commit failed:", err.message.slice(0, 200));
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. PUSH TO MAIN
// ─────────────────────────────────────────────────────────────────────────────
sh(`git push origin main`);

console.log("\n══════════════════════════════════════════════════════════════");
console.log("✓ v13 shipped end-to-end");
console.log(`  music: ${MUSIC_SOURCE}`);
console.log(`  final: ${path.relative(REPO, FINAL_FULL)}`);
console.log(`  share: ${path.relative(REPO, FINAL_SHARE)}`);
console.log("══════════════════════════════════════════════════════════════");
