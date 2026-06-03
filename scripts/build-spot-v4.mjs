/**
 * Stehlen Tacoma Tonneau Spot v4 — Build Script
 * Carter Voss direction: value-line statement card + cover-macro re-grade (cooler)
 *
 * Changes from v3:
 *   1. Beat 3 (cover-macro) re-graded cooler — warm amber midtones pulled down,
 *      blue channel lifted in midtones to match rain + security tonal register.
 *   2. New value-line statement card (~2.5s) inserted before end card:
 *      "RAIN · ICE · DUST — OUT." / "YOUR GEAR — LOCKED IN." (white only, no yellow)
 *   3. Final beat order: hero→rain→cover-macro→latch→security→fold-open→LED→VALUE-LINE→end card
 *   4. Output: stehlen-tacoma-tonneau-spot-v4.mp4 (~30s, 1920x1080, 24fps)
 *
 * NO new Kling generation. Grade-only + card build + re-concat.
 * Uses the same encoding/grain/grade pipeline as v3.
 *
 * All shell calls use execFileSync (no shell interpolation).
 * API keys are never logged.
 */

import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

// Paths
const ROOT = '/Users/ricky/Library/CloudStorage/OneDrive-Personal/Documents/Robome/Client/JL Concepts/Project/stehlenauto-vercel';
const CLIPS_DIR = path.join(ROOT, 'public/videos/spot-clips');
const FRAMES_V4 = path.join(CLIPS_DIR, 'frames-v4');
const FFMPEG = '/opt/homebrew/bin/ffmpeg';
const FFPROBE = '/opt/homebrew/bin/ffprobe';

// ffprobe a file -> video stream object
function probeVideo(filePath) {
  const out = execFileSync(FFPROBE, [
    '-v', 'quiet', '-print_format', 'json', '-show_streams', filePath
  ], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
  const data = JSON.parse(out);
  return data.streams.find(s => s.codec_type === 'video');
}

// Extract a single frame from a video
function extractFrame(clipPath, outPath, timeS = 2.0) {
  execFileSync(FFMPEG, [
    '-y', '-ss', String(timeS), '-i', clipPath,
    '-frames:v', '1', '-q:v', '2', outPath
  ], { stdio: 'pipe' });
  console.log(`  [Frame] ${path.basename(outPath)} @ ${timeS}s`);
}

// Normalize clip: scale to 1920x1080, 24fps, trim if needed
function normalizeClip(inPath, outPath, opts = {}) {
  const { startS = 0, durationS = null, isVertical = false } = opts;
  const args = ['-y'];
  if (startS > 0) args.push('-ss', String(startS));
  if (durationS != null) args.push('-t', String(durationS));
  args.push('-i', inPath);

  const vf = isVertical
    ? 'crop=iw:iw*9/16,scale=1920:1080'
    : 'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2';
  args.push('-vf', vf, '-c:v', 'libx264', '-preset', 'slow', '-crf', '16',
    '-pix_fmt', 'yuv420p', '-r', '24', '-an', outPath);
  execFileSync(FFMPEG, args, { stdio: 'pipe' });
  console.log(`  [Norm] ${path.basename(outPath)}`);
}

// Standard grade + grain pass (teal-orange lift, film grain, vignette) — matches v3
function gradeAndGrain(inPath, outPath) {
  const vf = [
    'curves=r=\'0/0 0.1/0.08 1/0.95\':g=\'0/0 0.1/0.10 1/0.95\':b=\'0/0 0.1/0.12 1/0.85\'',
    'noise=alls=8:allf=t+u',
    'vignette=PI/5',
  ].join(',');
  execFileSync(FFMPEG, [
    '-y', '-i', inPath, '-vf', vf,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '15',
    '-pix_fmt', 'yuv420p', '-r', '24', outPath
  ], { stdio: 'pipe' });
  console.log(`  [Grade] ${path.basename(outPath)}`);
}

// Cover-macro COOLER re-grade:
//   Pulls R channel down in shadows/mids (removes amber warmth),
//   pushes B channel up in shadows/mids (adds cool-neutral cast),
//   leaves G channel neutral to keep the matte-black material read.
//   Then standard grain + vignette.
function gradeAndGrainCooler(inPath, outPath) {
  const vf = [
    // Cool correction: R down in shadows/midtones, B up in shadows/midtones
    'curves=r=\'0/0 0.08/0.05 0.5/0.44 1/0.93\':g=\'0/0 0.1/0.10 1/0.95\':b=\'0/0 0.08/0.11 0.5/0.56 1/0.88\'',
    'noise=alls=8:allf=t+u',
    'vignette=PI/5',
  ].join(',');
  execFileSync(FFMPEG, [
    '-y', '-i', inPath, '-vf', vf,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '15',
    '-pix_fmt', 'yuv420p', '-r', '24', outPath
  ], { stdio: 'pipe' });
  console.log(`  [Grade-Cool] ${path.basename(outPath)}`);
}

// Build value-line statement card PNG via Python/Pillow
// Two-line: "RAIN · ICE · DUST — OUT." / "YOUR GEAR — LOCKED IN."
// White only on #0a0a0a. No yellow. Matches end-card typographic register.
function buildValueLinePng(outPng) {
  console.log('\n[ValueLine] Building statement card PNG...');

  const pyScript = `
import sys
try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("PILLOW_MISSING", file=sys.stderr)
    sys.exit(1)

W, H = 1920, 1080
img = Image.new('RGB', (W, H), (10, 10, 10))
draw = ImageDraw.Draw(img)

def load_font(path_candidates, size):
    import os
    for fp in path_candidates:
        if os.path.exists(fp):
            try:
                if fp.endswith('.ttc'):
                    return ImageFont.truetype(fp, size, index=0)
                return ImageFont.truetype(fp, size)
            except Exception:
                continue
    return ImageFont.load_default()

font_paths = [
    '/System/Library/Fonts/HelveticaNeue.ttc',
    '/System/Library/Fonts/Helvetica.ttc',
    '/Library/Fonts/Arial.ttf',
    '/System/Library/Fonts/Supplemental/Arial.ttf',
]

# Line 1: larger display weight — matches headline weight of end card
# Using same 66pt as end card headline
line1 = 'RAIN \\u00b7 ICE \\u00b7 DUST \\u2014 OUT.'
font1 = load_font(font_paths, 74)
bbox1 = draw.textbbox((0, 0), line1, font=font1)
tw1 = bbox1[2] - bbox1[0]
th1 = bbox1[3] - bbox1[1]

# Line 2: slightly smaller — subordinate read
line2 = 'YOUR GEAR \\u2014 LOCKED IN.'
font2 = load_font(font_paths, 52)
bbox2 = draw.textbbox((0, 0), line2, font=font2)
tw2 = bbox2[2] - bbox2[0]
th2 = bbox2[3] - bbox2[1]

# Vertical center the block: gap between lines = 28px
gap = 28
block_h = th1 + gap + th2
block_y = (H - block_h) // 2

# Draw line 1 — white
draw.text(((W - tw1) // 2, block_y), line1, font=font1, fill=(255, 255, 255))

# Draw line 2 — white, same brightness (NOT grey — this is a statement, not a sub-line)
draw.text(((W - tw2) // 2, block_y + th1 + gap), line2, font=font2, fill=(255, 255, 255))

img.save(r'${outPng}', quality=97)
print("DONE")
print(f"Line1 tw={tw1} th={th1} y={block_y}", file=sys.stderr)
print(f"Line2 tw={tw2} th={th2} y={block_y + th1 + gap}", file=sys.stderr)
`;

  const pyFile = '/tmp/stehlen_valueline_v4.py';
  fs.writeFileSync(pyFile, pyScript, 'utf8');

  let pillow = true;
  let result;
  try {
    result = execFileSync('python3', [pyFile], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
  } catch (e) {
    if (e.stderr && e.stderr.includes('PILLOW_MISSING')) {
      pillow = false;
    } else {
      console.error('  [ValueLine] Python error:', e.stderr);
      throw e;
    }
  }

  if (!pillow) {
    console.log('  [ValueLine] Pillow not available — falling back to ImageMagick label...');
    buildValueLineMagick(outPng);
    return;
  }

  if (result) console.log(`  [ValueLine] Python: ${result.trim()}`);
  console.log(`  [ValueLine] Saved: ${outPng}`);
}

// ImageMagick fallback for value-line card (uses label: for proper unicode)
function buildValueLineMagick(outPng) {
  const W = 1920, H = 1080;

  // Build each line as a labeled PNG, then composite onto black canvas
  const line1Png = '/tmp/stehlen_vl1_v4.png';
  const line2Png = '/tmp/stehlen_vl2_v4.png';

  // Line 1 — middot (U+00B7) and em-dash (U+2014) via UTF-8 literal
  const line1 = 'RAIN · ICE · DUST — OUT.';
  const line2 = 'YOUR GEAR — LOCKED IN.';

  execFileSync('magick', [
    '-background', '#0a0a0a', '-fill', 'white',
    '-font', '/System/Library/Fonts/HelveticaNeue.ttc',
    '-pointsize', '74',
    `label:${line1}`, line1Png,
  ], { stdio: 'pipe', encoding: 'utf8' });

  execFileSync('magick', [
    '-background', '#0a0a0a', '-fill', 'white',
    '-font', '/System/Library/Fonts/HelveticaNeue.ttc',
    '-pointsize', '52',
    `label:${line2}`, line2Png,
  ], { stdio: 'pipe', encoding: 'utf8' });

  // Composite both onto canvas centered vertically
  execFileSync('magick', [
    '-size', `${W}x${H}`, 'xc:#0a0a0a',
    '(', line1Png, ')',
    '-gravity', 'Center', '-geometry', '+0-50', '-composite',
    '(', line2Png, ')',
    '-gravity', 'Center', '-geometry', '+0+50', '-composite',
    outPng,
  ], { stdio: 'pipe', encoding: 'utf8' });
}

// Grain + vignette pass for a static card PNG rendered to video
// No teal-orange curve (card is flat black + white — don't color-grade the card)
function cardGrainVignette(inPath, outPath) {
  const vf = [
    'noise=alls=7:allf=t+u',
    'vignette=PI/5',
  ].join(',');
  execFileSync(FFMPEG, [
    '-y', '-i', inPath, '-vf', vf,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '15',
    '-pix_fmt', 'yuv420p', '-r', '24', outPath
  ], { stdio: 'pipe' });
  console.log(`  [CardGrain] ${path.basename(outPath)}`);
}

// Convert a PNG to a video of specified duration at 24fps
function pngToVideo(imgPath, outMp4, durationS) {
  execFileSync(FFMPEG, [
    '-y', '-loop', '1', '-i', imgPath,
    '-t', String(durationS),
    '-vf', 'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '16',
    '-pix_fmt', 'yuv420p', '-r', '24', outMp4,
  ], { stdio: 'pipe' });
  console.log(`  [PngToVid] ${path.basename(outMp4)} (${durationS}s)`);
}

// Build concat list and assemble master
function assembleSpot(gradedPaths, outMp4) {
  const listFile = '/tmp/stehlen_concat_v4.txt';
  fs.writeFileSync(listFile, gradedPaths.map(p => `file '${p}'`).join('\n'), 'utf8');
  execFileSync(FFMPEG, [
    '-y', '-f', 'concat', '-safe', '0', '-i', listFile,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '15',
    '-pix_fmt', 'yuv420p', '-r', '24', '-an', outMp4,
  ], { stdio: 'pipe' });
  console.log(`\n[Assemble] Master: ${outMp4}`);
}


// ── MAIN ──────────────────────────────────────────────────────────────────
async function main() {
  console.log('=== Stehlen Tacoma Tonneau Spot v4 ===');
  console.log(`Started: ${new Date().toISOString()}\n`);

  fs.mkdirSync(FRAMES_V4, { recursive: true });

  const WORK = '/tmp/spot-v4-work';
  const normDir = path.join(WORK, 'norm');
  const gradeDir = path.join(WORK, 'graded');
  fs.mkdirSync(normDir, { recursive: true });
  fs.mkdirSync(gradeDir, { recursive: true });

  // Source clip paths (all from v3 — no new Kling generation)
  const src = {
    hero:      path.join(CLIPS_DIR, 'clip-h2-truck-dolly.mp4'),
    rain:      path.join(CLIPS_DIR, 'clip-new-rain.mp4'),
    coverMacro: path.join(CLIPS_DIR, 'clip-cover-a-surface.mp4'),
    latch:     path.join(CLIPS_DIR, 'clip-cover-d-latch.mp4'),
    security:  path.join(CLIPS_DIR, 'clip-new-security.mp4'),
    foldOpen:  path.join(CLIPS_DIR, 'clip-cover-f-foldopen.mp4'),
    led:       path.join(CLIPS_DIR, 'clip-h1-led-reveal.mp4'),
  };

  // Verify all source clips exist
  for (const [key, p] of Object.entries(src)) {
    if (!fs.existsSync(p)) throw new Error(`BLOCKER: Missing source clip [${key}]: ${p}`);
    console.log(`  [OK] ${key}: ${path.basename(p)}`);
  }

  // ── 1. Value-line statement card ─────────────────────────────────────────
  const valueLinePng = path.join(WORK, 'valueline-v4.png');
  const valueLineRaw = path.join(WORK, 'valueline-raw.mp4');     // before grain
  const valueLineGrained = path.join(WORK, 'valueline-grained.mp4'); // after grain+vignette

  buildValueLinePng(valueLinePng);
  // Convert to 2.5s video first, then apply grain+vignette pass
  pngToVideo(valueLinePng, valueLineRaw, 2.5);
  cardGrainVignette(valueLineRaw, valueLineGrained);

  // ── 2. Re-use v3 end card (already built — reconstruct from v3 work dir,
  //    or rebuild it fresh. We rebuild fresh for clean pipeline.)
  // End card PNG rebuilt with same Python/Pillow method as v3.
  const endCardPng = path.join(WORK, 'endcard-v4.png');
  const endCardRaw = path.join(WORK, 'endcard-raw.mp4');
  const endCardFinal = path.join(WORK, 'endcard-final.mp4'); // no grain (same as v3)

  buildEndCardPng(endCardPng);
  pngToVideo(endCardPng, endCardRaw, 3.0);
  // End card: straight pass, no grain (same as v3 treatment)
  normalizeClip(endCardRaw, endCardFinal);

  // ── 3. Normalize all video beats ─────────────────────────────────────────
  console.log('\n[Normalize] All clips to 1920x1080 24fps...');

  const norm = {
    b1: path.join(normDir, 'b1-hero.mp4'),
    b2: path.join(normDir, 'b2-rain.mp4'),
    b3: path.join(normDir, 'b3-covermacro.mp4'),
    b4: path.join(normDir, 'b4-latch.mp4'),
    b5: path.join(normDir, 'b5-security.mp4'),
    b6: path.join(normDir, 'b6-foldopen.mp4'),
    b7: path.join(normDir, 'b7-led.mp4'),
  };

  normalizeClip(src.hero,       norm.b1, { durationS: 3 });
  normalizeClip(src.rain,       norm.b2, { durationS: 4 });
  normalizeClip(src.coverMacro, norm.b3, { durationS: 4 });
  normalizeClip(src.latch,      norm.b4, { startS: 1.5, durationS: 3 });
  normalizeClip(src.security,   norm.b5, { durationS: 4 });
  normalizeClip(src.foldOpen,   norm.b6, { durationS: 4 });
  normalizeClip(src.led,        norm.b7, { durationS: 2.5, isVertical: true });

  // ── 4. Grade + grain ──────────────────────────────────────────────────────
  console.log('\n[Grade] Film grain + color grade...');

  const graded = {
    b1: path.join(gradeDir, 'b1.mp4'),
    b2: path.join(gradeDir, 'b2.mp4'),
    b3: path.join(gradeDir, 'b3-cool.mp4'),  // COOLER re-grade
    b4: path.join(gradeDir, 'b4.mp4'),
    b5: path.join(gradeDir, 'b5.mp4'),
    b6: path.join(gradeDir, 'b6.mp4'),
    b7: path.join(gradeDir, 'b7.mp4'),
    b8: valueLineGrained,                     // value-line card (already grained)
    b9: endCardFinal,                         // end card (no grain, same as v3)
  };

  gradeAndGrain(norm.b1, graded.b1);
  gradeAndGrain(norm.b2, graded.b2);
  gradeAndGrainCooler(norm.b3, graded.b3);   // CHANGE 2: cooler cover-macro
  gradeAndGrain(norm.b4, graded.b4);
  gradeAndGrain(norm.b5, graded.b5);
  gradeAndGrain(norm.b6, graded.b6);
  gradeAndGrain(norm.b7, graded.b7);
  // b8 and b9 already built above

  // ── 5. Assemble v4 master ─────────────────────────────────────────────────
  const masterOut = path.join(CLIPS_DIR, 'stehlen-tacoma-tonneau-spot-v4.mp4');
  const beatOrder = [
    graded.b1, // hero (3s)
    graded.b2, // rain (4s)
    graded.b3, // cover-macro re-graded cooler (4s)
    graded.b4, // latch (3s)
    graded.b5, // security (4s)
    graded.b6, // fold-open (4s)
    graded.b7, // LED (2.5s)
    graded.b8, // VALUE-LINE card (2.5s) — NEW
    graded.b9, // end card (3s)
  ];
  assembleSpot(beatOrder, masterOut);

  // Verify
  const vs = probeVideo(masterOut);
  const durTotal = parseFloat(vs.duration).toFixed(2);
  console.log(`  ${vs.width}x${vs.height} @ ${vs.r_frame_rate}fps — ${durTotal}s`);

  // ── 6. Extract review frames ───────────────────────────────────────────────
  console.log('\n[Frames] Extracting beat review frames to frames-v4/...');

  // Timecodes (cumulative):
  // b1 hero:       0:00 - 0:03  → sample @ 1.5s
  // b2 rain:       0:03 - 0:07  → sample @ 5.0s
  // b3 covermacro: 0:07 - 0:11  → sample @ 9.0s
  // b4 latch:      0:11 - 0:14  → sample @ 12.5s
  // b5 security:   0:14 - 0:18  → sample @ 16.0s
  // b6 foldopen:   0:18 - 0:22  → sample @ 20.0s
  // b7 LED:        0:22 - 0:24.5 → sample @ 23.25s
  // b8 value-line: 0:24.5 - 0:27 → sample @ 25.75s
  // b9 end card:   0:27 - 0:30  → sample @ 28.5s

  const frameSpec = [
    { name: 'beat1-hero',          t: 1.5 },
    { name: 'beat2-rain',          t: 5.0 },
    { name: 'beat3-covermacro',    t: 9.0 },
    { name: 'beat4-latch',         t: 12.5 },
    { name: 'beat5-security',      t: 16.0 },
    { name: 'beat6-foldopen',      t: 20.0 },
    { name: 'beat7-led',           t: 23.25 },
    { name: 'beat8-valueline',     t: 25.75 },
    { name: 'beat9-endcard',       t: 28.5 },
  ];

  for (const spec of frameSpec) {
    const fp = path.join(FRAMES_V4, `${spec.name}.jpg`);
    extractFrame(masterOut, fp, spec.t);
  }

  // Also save value-line PNG as JPG for direct review
  const valueLineReview = path.join(FRAMES_V4, 'valueline-card-full.jpg');
  execFileSync('magick', [valueLinePng, '-quality', '95', valueLineReview], { stdio: 'pipe' });
  console.log(`  [Frame] valueline-card-full.jpg`);

  // Also save end card PNG as JPG for direct review
  const endCardReview = path.join(FRAMES_V4, 'endcard-full.jpg');
  execFileSync('magick', [endCardPng, '-quality', '95', endCardReview], { stdio: 'pipe' });
  console.log(`  [Frame] endcard-full.jpg`);

  // ── 7. Report ──────────────────────────────────────────────────────────────
  console.log('\n=== BUILD COMPLETE ===');
  console.log(`\nMaster v4: ${masterOut}`);
  console.log(`  Duration: ${durTotal}s | ${vs.width}x${vs.height} | 24fps`);
  console.log(`\nBeat order / timecodes:`);
  console.log(`  0:00.0-0:03.0   Beat 1  Hero cold-open (h2 truck dolly)`);
  console.log(`  0:03.0-0:07.0   Beat 2  Rain proof (beading water)`);
  console.log(`  0:07.0-0:11.0   Beat 3  Cover macro surface (COOLER re-grade)`);
  console.log(`  0:11.0-0:14.0   Beat 4  Latch/rail detail`);
  console.log(`  0:14.0-0:18.0   Beat 5  Security locked-in-lot`);
  console.log(`  0:18.0-0:22.0   Beat 6  Fold-open / bed access`);
  console.log(`  0:22.0-0:24.5   Beat 7  LED bonus`);
  console.log(`  0:24.5-0:27.0   Beat 8  VALUE-LINE statement card (NEW)`);
  console.log(`  0:27.0-0:30.0   Beat 9  End card`);
  console.log(`\nFrames-v4: ${FRAMES_V4}/`);
  console.log(`Finished: ${new Date().toISOString()}`);
}

// ── End card builder (identical to v3 Pillow path) ────────────────────────
function buildEndCardPng(outPng) {
  console.log('\n[EndCard] Building end card PNG...');

  const logoPath = path.join(ROOT, 'public/images/stehlen-logo.png');

  const pyScript = `
import sys
try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("PILLOW_MISSING", file=sys.stderr)
    sys.exit(1)

W, H = 1920, 1080
img = Image.new('RGB', (W, H), (10, 10, 10))
draw = ImageDraw.Draw(img)

def load_font(path_candidates, size):
    import os
    for fp in path_candidates:
        if os.path.exists(fp):
            try:
                if fp.endswith('.ttc'):
                    return ImageFont.truetype(fp, size, index=0)
                return ImageFont.truetype(fp, size)
            except Exception:
                continue
    return ImageFont.load_default()

font_paths = [
    '/System/Library/Fonts/HelveticaNeue.ttc',
    '/System/Library/Fonts/Helvetica.ttc',
    '/Library/Fonts/Arial.ttf',
    '/System/Library/Fonts/Supplemental/Arial.ttf',
]

# Logo composite
try:
    logo = Image.open(r'${logoPath}').convert('RGBA')
    ratio = 520 / logo.width
    nw = 520
    nh = int(logo.height * ratio)
    logo = logo.resize((nw, nh), Image.LANCZOS)
    lx = (W - nw) // 2
    img.paste(logo, (lx, 90), logo)
    print(f"Logo composited at ({lx}, 90) size {nw}x{nh}", file=sys.stderr)
except Exception as e:
    print(f"Logo error: {e}", file=sys.stderr)

# Headline
hl = 'HARD COVER. LED BED LIGHTING. ONE INSTALL.'
font_hl = load_font(font_paths, 66)
bbox = draw.textbbox((0, 0), hl, font=font_hl)
tw = bbox[2] - bbox[0]
draw.text(((W - tw) // 2, 410), hl, font=font_hl, fill=(255, 255, 255))

# Sub-line: proper Unicode en-dash and middot
sub = 'fits 2016\\u20132023 Tacoma 5 ft bed  \\u00b7  Access or Double Cab  \\u00b7  wrong fit, full refund'
font_sub = load_font(font_paths, 30)
bbox2 = draw.textbbox((0, 0), sub, font=font_sub)
tw2 = bbox2[2] - bbox2[0]
draw.text(((W - tw2) // 2, 530), sub, font=font_sub, fill=(153, 153, 153))

# CTA — yellow #f5a823 (ONLY yellow element in the spot)
cta = 'SHOP THE TONNEAU COVER'
font_cta = load_font(font_paths, 56)
bbox3 = draw.textbbox((0, 0), cta, font=font_cta)
tw3 = bbox3[2] - bbox3[0]
draw.text(((W - tw3) // 2, 655), cta, font=font_cta, fill=(245, 168, 35))

img.save(r'${outPng}', quality=97)
print("DONE")
`;

  const pyFile = '/tmp/stehlen_endcard_v4.py';
  fs.writeFileSync(pyFile, pyScript, 'utf8');

  let pillow = true;
  let result;
  try {
    result = execFileSync('python3', [pyFile], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
  } catch (e) {
    if (e.stderr && e.stderr.includes('PILLOW_MISSING')) {
      pillow = false;
    } else {
      console.error('  [EndCard] Python error:', e.stderr);
      throw e;
    }
  }

  if (!pillow) {
    console.log('  [EndCard] Pillow not available, falling back to ImageMagick...');
    buildEndCardMagick(outPng, logoPath);
    return;
  }

  if (result) console.log(`  [EndCard] Python: ${result.trim()}`);
  console.log(`  [EndCard] Saved: ${outPng}`);
}

function buildEndCardMagick(outPng, logoPath) {
  const W = 1920, H = 1080;
  const headline = 'HARD COVER. LED BED LIGHTING. ONE INSTALL.';
  const cta = 'SHOP THE TONNEAU COVER';
  const subLine = 'fits 2016–2023 Tacoma 5 ft bed  ·  Access or Double Cab  ·  wrong fit, full refund';

  const subPng = '/tmp/stehlen_sub_v4.png';
  execFileSync('magick', [
    '-background', '#0a0a0a',
    '-fill', '#999999',
    '-font', '/System/Library/Fonts/HelveticaNeue.ttc',
    '-pointsize', '28',
    `label:${subLine}`,
    subPng,
  ], { stdio: 'pipe', encoding: 'utf8' });

  execFileSync('magick', [
    '-size', `${W}x${H}`, 'xc:#0a0a0a',
    '(', logoPath, '-resize', '520x', ')',
    '-gravity', 'North', '-geometry', '+0+90', '-composite',
    '-font', '/System/Library/Fonts/HelveticaNeue.ttc',
    '-pointsize', '66',
    '-fill', 'white',
    '-gravity', 'Center',
    '-annotate', '+0-95',
    headline,
    '(', subPng, ')',
    '-gravity', 'Center', '-geometry', '+0+5', '-composite',
    '-pointsize', '56',
    '-fill', '#f5a823',
    '-gravity', 'Center',
    '-annotate', '+0+120',
    cta,
    outPng,
  ], { stdio: 'pipe', encoding: 'utf8' });
}

main().catch(e => {
  console.error('\n[FATAL]', e.message);
  console.error(e.stack);
  process.exit(1);
});
