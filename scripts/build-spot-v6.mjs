/**
 * Stehlen Tacoma Tonneau Spot v6 — Build Script
 * Carter Voss direction: replace beat 4 with v6 latch clip (tab-fix + motion-verified).
 *
 * Changes from v5:
 *   Beat 4 ONLY: replace clip-latch-v5.mp4 (had AI pull-tab defect at ~7 o'clock)
 *   with clip-latch-v6.mp4 (tight-crop seed, dangling tab gone, motion verified clean).
 *   All other beats are byte-identical sources from v5.
 *
 * Fix approach: B — recomposed tighter via seed crop, not re-generated terminus geometry.
 * Selected: latch-v6-attempt-1 (slow push-in, physically weighted, no material drift).
 *
 * Final beat order:
 *   hero → rain → cover-macro → LATCH-V6 → security → fold-open → LED → value-line → end card
 *
 * Grade/grain/encoding: identical to v5 (same functions, same params).
 * Output: stehlen-tacoma-tonneau-spot-v6.mp4 (~31s, 1920x1080, 24fps)
 * Frames: frames-v6/ (all beats, plus frames-v6/latch-motion/ already extracted)
 *
 * All shell calls use execFileSync (no shell interpolation). API keys never logged.
 */

import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

// Paths
const ROOT = '/Users/ricky/Library/CloudStorage/OneDrive-Personal/Documents/Robome/Client/JL Concepts/Project/stehlenauto-vercel';
const CLIPS_DIR = path.join(ROOT, 'public/videos/spot-clips');
const FRAMES_V6 = path.join(CLIPS_DIR, 'frames-v6');
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
    '-frames:v', '1', '-q:v', '2', '-update', '1', outPath
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

// Standard grade + grain pass (teal-orange lift, film grain, vignette) — same as v5
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

// Cover-macro COOLER re-grade (identical to v5 — beat 3 unchanged)
function gradeAndGrainCooler(inPath, outPath) {
  const vf = [
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

// Grain + vignette pass for static card PNG rendered to video
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
  const listFile = '/tmp/stehlen_concat_v6.txt';
  fs.writeFileSync(listFile, gradedPaths.map(p => `file '${p}'`).join('\n'), 'utf8');
  execFileSync(FFMPEG, [
    '-y', '-f', 'concat', '-safe', '0', '-i', listFile,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '15',
    '-pix_fmt', 'yuv420p', '-r', '24', '-an', outMp4,
  ], { stdio: 'pipe' });
  console.log(`\n[Assemble] Master: ${outMp4}`);
}

// Value-line card (identical to v5)
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

line1 = 'RAIN \\u00b7 ICE \\u00b7 DUST \\u2014 OUT.'
font1 = load_font(font_paths, 74)
bbox1 = draw.textbbox((0, 0), line1, font=font1)
tw1 = bbox1[2] - bbox1[0]
th1 = bbox1[3] - bbox1[1]

line2 = 'YOUR GEAR \\u2014 LOCKED IN.'
font2 = load_font(font_paths, 52)
bbox2 = draw.textbbox((0, 0), line2, font=font2)
tw2 = bbox2[2] - bbox2[0]
th2 = bbox2[3] - bbox2[1]

gap = 28
block_h = th1 + gap + th2
block_y = (H - block_h) // 2

draw.text(((W - tw1) // 2, block_y), line1, font=font1, fill=(255, 255, 255))
draw.text(((W - tw2) // 2, block_y + th1 + gap), line2, font=font2, fill=(255, 255, 255))

img.save(r'${outPng}', quality=97)
print("DONE")
`;

  const pyFile = '/tmp/stehlen_valueline_v6.py';
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
    console.log('  [ValueLine] Pillow not available — falling back to ImageMagick...');
    buildValueLineMagick(outPng);
    return;
  }

  if (result) console.log(`  [ValueLine] Python: ${result.trim()}`);
  console.log(`  [ValueLine] Saved: ${outPng}`);
}

function buildValueLineMagick(outPng) {
  const W = 1920, H = 1080;
  const line1Png = '/tmp/stehlen_vl1_v6.png';
  const line2Png = '/tmp/stehlen_vl2_v6.png';
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

  execFileSync('magick', [
    '-size', `${W}x${H}`, 'xc:#0a0a0a',
    '(', line1Png, ')',
    '-gravity', 'Center', '-geometry', '+0-50', '-composite',
    '(', line2Png, ')',
    '-gravity', 'Center', '-geometry', '+0+50', '-composite',
    outPng,
  ], { stdio: 'pipe', encoding: 'utf8' });
}

// End card builder (identical to v5)
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

try:
    logo = Image.open(r'${logoPath}').convert('RGBA')
    ratio = 520 / logo.width
    nw = 520
    nh = int(logo.height * ratio)
    logo = logo.resize((nw, nh), Image.LANCZOS)
    lx = (W - nw) // 2
    img.paste(logo, (lx, 90), logo)
except Exception as e:
    print(f"Logo error: {e}", file=sys.stderr)

hl = 'HARD COVER. LED BED LIGHTING. ONE INSTALL.'
font_hl = load_font(font_paths, 66)
bbox = draw.textbbox((0, 0), hl, font=font_hl)
tw = bbox[2] - bbox[0]
draw.text(((W - tw) // 2, 410), hl, font=font_hl, fill=(255, 255, 255))

sub = 'fits 2016\\u20132023 Tacoma 5 ft bed  \\u00b7  Access or Double Cab  \\u00b7  wrong fit, full refund'
font_sub = load_font(font_paths, 30)
bbox2 = draw.textbbox((0, 0), sub, font=font_sub)
tw2 = bbox2[2] - bbox2[0]
draw.text(((W - tw2) // 2, 530), sub, font=font_sub, fill=(153, 153, 153))

cta = 'SHOP THE TONNEAU COVER'
font_cta = load_font(font_paths, 56)
bbox3 = draw.textbbox((0, 0), cta, font=font_cta)
tw3 = bbox3[2] - bbox3[0]
draw.text(((W - tw3) // 2, 655), cta, font=font_cta, fill=(245, 168, 35))

img.save(r'${outPng}', quality=97)
print("DONE")
`;

  const pyFile = '/tmp/stehlen_endcard_v6.py';
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

  const subPng = '/tmp/stehlen_sub_v6.png';
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


// ── MAIN ──────────────────────────────────────────────────────────────────
async function main() {
  console.log('=== Stehlen Tacoma Tonneau Spot v6 ===');
  console.log(`Started: ${new Date().toISOString()}\n`);
  console.log('Change from v5: Beat 4 only — new latch hero clip (clip-latch-v6.mp4).');
  console.log('Fix: Approach B (tight-crop seed), dangling pull-tab eliminated, motion verified.');
  console.log('All other beats: unchanged sources from v5.\n');

  fs.mkdirSync(FRAMES_V6, { recursive: true });

  const WORK = '/tmp/spot-v6-work';
  const normDir = path.join(WORK, 'norm');
  const gradeDir = path.join(WORK, 'graded');
  fs.mkdirSync(normDir, { recursive: true });
  fs.mkdirSync(gradeDir, { recursive: true });

  // Source clip paths — beat 4 is the v6 clip, everything else from v5 sources
  const src = {
    hero:      path.join(CLIPS_DIR, 'clip-h2-truck-dolly.mp4'),
    rain:      path.join(CLIPS_DIR, 'clip-new-rain.mp4'),
    coverMacro: path.join(CLIPS_DIR, 'clip-cover-a-surface.mp4'),
    latch:     path.join(CLIPS_DIR, 'clip-latch-v6.mp4'),    // NEW v6 — replaces clip-latch-v5.mp4
    security:  path.join(CLIPS_DIR, 'clip-new-security.mp4'),
    foldOpen:  path.join(CLIPS_DIR, 'clip-cover-f-foldopen.mp4'),
    led:       path.join(CLIPS_DIR, 'clip-h1-led-reveal.mp4'),
  };

  // Verify all source clips exist
  console.log('[Verify] Source clips:');
  for (const [key, p] of Object.entries(src)) {
    if (!fs.existsSync(p)) throw new Error(`BLOCKER: Missing source clip [${key}]: ${p}`);
    const stat = fs.statSync(p);
    const flag = key === 'latch' ? ' ← NEW v6 latch beat (tab-fix)' : '';
    console.log(`  [OK] ${key}: ${path.basename(p)} (${(stat.size / 1024 / 1024).toFixed(2)} MB)${flag}`);
  }

  // ── 1. Value-line statement card (identical to v5) ───────────────────────
  const valueLinePng = path.join(WORK, 'valueline-v6.png');
  const valueLineRaw = path.join(WORK, 'valueline-raw.mp4');
  const valueLineGrained = path.join(WORK, 'valueline-grained.mp4');

  buildValueLinePng(valueLinePng);
  pngToVideo(valueLinePng, valueLineRaw, 2.5);
  cardGrainVignette(valueLineRaw, valueLineGrained);

  // ── 2. End card (identical to v5) ────────────────────────────────────────
  const endCardPng = path.join(WORK, 'endcard-v6.png');
  const endCardRaw = path.join(WORK, 'endcard-raw.mp4');
  const endCardFinal = path.join(WORK, 'endcard-final.mp4');

  buildEndCardPng(endCardPng);
  pngToVideo(endCardPng, endCardRaw, 3.0);
  normalizeClip(endCardRaw, endCardFinal);

  // ── 3. Normalize all video beats ─────────────────────────────────────────
  console.log('\n[Normalize] All clips to 1920x1080 24fps...');

  const norm = {
    b1: path.join(normDir, 'b1-hero.mp4'),
    b2: path.join(normDir, 'b2-rain.mp4'),
    b3: path.join(normDir, 'b3-covermacro.mp4'),
    b4: path.join(normDir, 'b4-latch-v6.mp4'),    // NEW — 4s trim from 5s Kling clip
    b5: path.join(normDir, 'b5-security.mp4'),
    b6: path.join(normDir, 'b6-foldopen.mp4'),
    b7: path.join(normDir, 'b7-led.mp4'),
  };

  normalizeClip(src.hero,       norm.b1, { durationS: 3 });
  normalizeClip(src.rain,       norm.b2, { durationS: 4 });
  normalizeClip(src.coverMacro, norm.b3, { durationS: 4 });
  // Beat 4: NEW v6 latch clip — trim to 4s starting at 0.5s
  // (clip is 5s total; 0.5s skip lets the initial hold settle before the push starts)
  normalizeClip(src.latch,      norm.b4, { startS: 0.5, durationS: 4 });
  normalizeClip(src.security,   norm.b5, { durationS: 4 });
  normalizeClip(src.foldOpen,   norm.b6, { durationS: 4 });
  normalizeClip(src.led,        norm.b7, { durationS: 2.5, isVertical: true });

  // ── 4. Grade + grain ──────────────────────────────────────────────────────
  console.log('\n[Grade] Film grain + color grade...');

  const graded = {
    b1: path.join(gradeDir, 'b1.mp4'),
    b2: path.join(gradeDir, 'b2.mp4'),
    b3: path.join(gradeDir, 'b3-cool.mp4'),
    b4: path.join(gradeDir, 'b4-latch-v6.mp4'),   // standard grade — dark key-lit
    b5: path.join(gradeDir, 'b5.mp4'),
    b6: path.join(gradeDir, 'b6.mp4'),
    b7: path.join(gradeDir, 'b7.mp4'),
    b8: valueLineGrained,
    b9: endCardFinal,
  };

  gradeAndGrain(norm.b1, graded.b1);
  gradeAndGrain(norm.b2, graded.b2);
  gradeAndGrainCooler(norm.b3, graded.b3);
  gradeAndGrain(norm.b4, graded.b4);   // standard teal-orange + grain for latch close-up
  gradeAndGrain(norm.b5, graded.b5);
  gradeAndGrain(norm.b6, graded.b6);
  gradeAndGrain(norm.b7, graded.b7);
  // b8 and b9 already processed above

  // ── 5. Assemble v6 master ─────────────────────────────────────────────────
  const masterOut = path.join(CLIPS_DIR, 'stehlen-tacoma-tonneau-spot-v6.mp4');
  const beatOrder = [
    graded.b1, // hero (3s)
    graded.b2, // rain (4s)
    graded.b3, // cover-macro cooler (4s) — unchanged from v5
    graded.b4, // LATCH-V6 — tight macro, slow push-in, no pull-tab (4s) — NEW
    graded.b5, // security locked-in-lot (4s)
    graded.b6, // fold-open / bed access (4s)
    graded.b7, // LED bonus (2.5s)
    graded.b8, // value-line statement card (2.5s)
    graded.b9, // end card (3s)
  ];
  assembleSpot(beatOrder, masterOut);

  // Verify
  const vs = probeVideo(masterOut);
  const durTotal = parseFloat(vs.duration).toFixed(2);
  console.log(`  ${vs.width}x${vs.height} @ ${vs.r_frame_rate}fps — ${durTotal}s`);

  // ── 6. Extract review frames ───────────────────────────────────────────────
  console.log('\n[Frames] Extracting beat review frames to frames-v6/...');

  // Timecodes (cumulative):
  // b1 hero:       0:00 - 0:03  → sample @ 1.5s
  // b2 rain:       0:03 - 0:07  → sample @ 5.0s
  // b3 covermacro: 0:07 - 0:11  → sample @ 9.0s
  // b4 latch-v6:   0:11 - 0:15  → sample @ 13.0s  (NEW — 4s beat, center of push)
  // b5 security:   0:15 - 0:19  → sample @ 17.0s
  // b6 foldopen:   0:19 - 0:23  → sample @ 21.0s
  // b7 LED:        0:23 - 0:25.5 → sample @ 24.25s
  // b8 value-line: 0:25.5 - 0:28 → sample @ 26.75s
  // b9 end card:   0:28 - 0:31  → sample @ 29.5s

  const frameSpec = [
    { name: 'beat1-hero',          t: 1.5 },
    { name: 'beat2-rain',          t: 5.0 },
    { name: 'beat3-covermacro',    t: 9.0 },
    { name: 'beat4-latch-v6',      t: 13.0 },   // v6 latch beat — inspect first
    { name: 'beat5-security',      t: 17.0 },
    { name: 'beat6-foldopen',      t: 21.0 },
    { name: 'beat7-led',           t: 24.25 },
    { name: 'beat8-valueline',     t: 26.75 },
    { name: 'beat9-endcard',       t: 29.5 },
  ];

  for (const spec of frameSpec) {
    const fp = path.join(FRAMES_V6, `${spec.name}.jpg`);
    extractFrame(masterOut, fp, spec.t);
  }

  // Also save value-line + end card PNGs as JPGs for direct review
  const valueLineReview = path.join(FRAMES_V6, 'valueline-card-full.jpg');
  execFileSync('magick', [valueLinePng, '-quality', '95', valueLineReview], { stdio: 'pipe' });
  console.log(`  [Frame] valueline-card-full.jpg`);

  const endCardReview = path.join(FRAMES_V6, 'endcard-full.jpg');
  execFileSync('magick', [endCardPng, '-quality', '95', endCardReview], { stdio: 'pipe' });
  console.log(`  [Frame] endcard-full.jpg`);

  // ── 7. Report ──────────────────────────────────────────────────────────────
  console.log('\n=== BUILD COMPLETE ===');
  console.log(`\nMaster v6: ${masterOut}`);
  console.log(`  Duration: ${durTotal}s | ${vs.width}x${vs.height} | 24fps`);
  console.log(`\nBeat order / timecodes:`);
  console.log(`  0:00.0-0:03.0   Beat 1  Hero cold-open (h2 truck dolly)          [unchanged from v5]`);
  console.log(`  0:03.0-0:07.0   Beat 2  Rain proof (beading water)                [unchanged from v5]`);
  console.log(`  0:07.0-0:11.0   Beat 3  Cover macro surface (cooler grade)         [unchanged from v5]`);
  console.log(`  0:11.0-0:15.0   Beat 4  LATCH HERO v6 — slow push-in, no tab      [NEW v6]`);
  console.log(`  0:15.0-0:19.0   Beat 5  Security locked-in-lot                    [unchanged from v5]`);
  console.log(`  0:19.0-0:23.0   Beat 6  Fold-open / bed access                    [unchanged from v5]`);
  console.log(`  0:23.0-0:25.5   Beat 7  LED bonus                                 [unchanged from v5]`);
  console.log(`  0:25.5-0:28.0   Beat 8  VALUE-LINE statement card                 [unchanged from v5]`);
  console.log(`  0:28.0-0:31.0   Beat 9  End card                                  [unchanged from v5]`);
  console.log(`\nFrames-v6: ${FRAMES_V6}/`);
  console.log(`Finished: ${new Date().toISOString()}`);
}

main().catch(e => {
  console.error('\n[FATAL]', e.message);
  console.error(e.stack);
  process.exit(1);
});
