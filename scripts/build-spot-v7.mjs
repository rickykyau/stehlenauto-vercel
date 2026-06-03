/**
 * Stehlen Tacoma Tonneau Spot v7 — Build Script
 *
 * Carter Voss direction — Stage 2i v7 fixes:
 *   Beat 2 (Rain):     clip-rain-shed-attempt-3.mp4 (Approach B water-shed)
 *   Beat 1 (Hero):     NEW moving car IF it passes realism check, else static h2-truck-dolly
 *   Music:             Industrial Cinematic — Kevin MacLeod, CC-BY 3.0
 *
 * Beat order:
 *   [hero] → [rain-shed] → cover-macro → latch → security → fold-open → LED → value-line → end card
 *
 * Usage: node scripts/build-spot-v7.mjs [--hero=car|--hero=static] [--rain=3|2]
 *   --hero=car     Use the moving car clip (whichever attempt passed inspection)
 *   --hero=static  Use the v6 static driveway hero (default fallback)
 *   --rain=N       Use rain-shed attempt N (default: 3)
 *   --car-attempt=N Which moving car attempt clip to use (default: 1)
 *
 * Audio: Industrial Cinematic baked in.
 *   - Latch click at beat 4 (12.0s): audio ducks -6dB for 1s around it.
 *   - Normalize to -14 LUFS.
 *   - Fade out last 4s.
 *
 * Output: stehlen-tacoma-tonneau-spot-v7.mp4 (16:9 1920x1080 24fps)
 * Frames: frames-v7/
 *
 * All shell calls use execFileSync (no shell interpolation). API keys never logged.
 */

import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

const ROOT = '/Users/ricky/Library/CloudStorage/OneDrive-Personal/Documents/Robome/Client/JL Concepts/Project/stehlenauto-vercel';
const CLIPS_DIR = path.join(ROOT, 'public/videos/spot-clips');
const FRAMES_V7 = path.join(CLIPS_DIR, 'frames-v7');
const FFMPEG = '/opt/homebrew/bin/ffmpeg';
const FFPROBE = '/opt/homebrew/bin/ffprobe';
const AUDIO_DIR = path.join(CLIPS_DIR, 'audio');

// Parse args
const heroArg = process.argv.find(a => a.startsWith('--hero='));
const heroMode = heroArg ? heroArg.slice('--hero='.length) : 'auto'; // auto = try car first
const rainArg = process.argv.find(a => a.startsWith('--rain='));
const rainAttempt = rainArg ? parseInt(rainArg.slice('--rain='.length)) : 3;
const carArg = process.argv.find(a => a.startsWith('--car-attempt='));
const carAttempt = carArg ? parseInt(carArg.slice('--car-attempt='.length)) : 1;

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

// Normalize clip: scale to 1920x1080, 24fps
function normalizeClip(inPath, outPath, opts = {}) {
  const { startS = 0, durationS = null, isVertical = false, isCrop = false } = opts;
  const args = ['-y'];
  if (startS > 0) args.push('-ss', String(startS));
  if (durationS != null) args.push('-t', String(durationS));
  args.push('-i', inPath);

  let vf;
  if (isVertical) {
    // 9:16 vertical: crop top center strip to 16:9
    vf = 'crop=iw:iw*9/16,scale=1920:1080';
  } else if (isCrop) {
    // Square (1440x1440): crop full width, center-crop height to 9/16 of width → 1440x810 → scale to 1920x1080
    vf = 'crop=iw:iw*9/16:0:(ih-iw*9/16)/2,scale=1920:1080';
  } else {
    // Standard: pad to fit 16:9
    vf = 'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2';
  }
  args.push('-vf', vf, '-c:v', 'libx264', '-preset', 'slow', '-crf', '16',
    '-pix_fmt', 'yuv420p', '-r', '24', '-an', outPath);
  execFileSync(FFMPEG, args, { stdio: 'pipe' });
  console.log(`  [Norm] ${path.basename(outPath)}`);
}

// Standard grade + grain (teal-orange, film grain, vignette)
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

// Cover-macro COOLER re-grade (beat 3 — unchanged)
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

// Rain beat: cool-blue grade with slight desaturation — matches "wet/cold" feel
function gradeAndGrainRain(inPath, outPath) {
  const vf = [
    // Slight cool push: lift blues, pull reds, slight desaturate mid tones
    'curves=r=\'0/0 0.07/0.05 0.5/0.46 1/0.92\':g=\'0/0 0.1/0.10 1/0.93\':b=\'0/0 0.1/0.12 0.5/0.54 1/0.97\'',
    'noise=alls=7:allf=t+u',
    'vignette=PI/4',
  ].join(',');
  execFileSync(FFMPEG, [
    '-y', '-i', inPath, '-vf', vf,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '15',
    '-pix_fmt', 'yuv420p', '-r', '24', outPath
  ], { stdio: 'pipe' });
  console.log(`  [Grade-Rain] ${path.basename(outPath)}`);
}

// Grain + vignette for static card PNG rendered to video
function cardGrainVignette(inPath, outPath) {
  const vf = ['noise=alls=7:allf=t+u', 'vignette=PI/5'].join(',');
  execFileSync(FFMPEG, [
    '-y', '-i', inPath, '-vf', vf,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '15',
    '-pix_fmt', 'yuv420p', '-r', '24', outPath
  ], { stdio: 'pipe' });
  console.log(`  [CardGrain] ${path.basename(outPath)}`);
}

// Convert PNG to video at 24fps
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

// Assemble silent master from graded clips
function assembleSilentMaster(gradedPaths, outMp4) {
  const listFile = '/tmp/stehlen_concat_v7_silent.txt';
  fs.writeFileSync(listFile, gradedPaths.map(p => `file '${p}'`).join('\n'), 'utf8');
  execFileSync(FFMPEG, [
    '-y', '-f', 'concat', '-safe', '0', '-i', listFile,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '15',
    '-pix_fmt', 'yuv420p', '-r', '24', '-an', outMp4,
  ], { stdio: 'pipe' });
  console.log(`\n[Assemble] Silent master: ${outMp4}`);
}

// Mix audio onto the silent master
// - Music: Industrial Cinematic, starts from t=0
// - Latch click recorded audio (if available): fires at t=12.0s (latch beat center)
// - Music ducked -6dB at latch click for 1s
// - Normalize output to -14 LUFS
// - Fade music out over last 4s
function mixAudio(silentMp4, musicPath, totalDurS, outMp4) {
  console.log('\n[Audio] Mixing music onto silent master...');

  const fadeStartS = totalDurS - 4.0;

  // Check if we have a recorded latch click
  const latchClickPath = path.join(AUDIO_DIR, 'latch-click.wav');
  const hasLatchClick = fs.existsSync(latchClickPath);

  if (hasLatchClick) {
    console.log('  [Audio] Using recorded latch click audio');
  } else {
    console.log('  [Audio] No recorded latch click found — music-only mix');
  }

  // Music filter: fade out last 4s, normalize to -14 LUFS approx via volume
  // afade: fade out type=out start=fadeStartS duration=4s
  // loudnorm: normalize to -14 LUFS
  const musicFilter = `[1:a]afade=type=out:start_time=${fadeStartS}:duration=4,volume=0.65,loudnorm=I=-14:TP=-1.5:LRA=11[music_normed]`;

  if (!hasLatchClick) {
    // Simple music-only mix
    execFileSync(FFMPEG, [
      '-y',
      '-i', silentMp4,         // [0:v]
      '-i', musicPath,          // [1:a]
      '-filter_complex', `${musicFilter};[music_normed]anull[aout]`,
      '-map', '0:v',
      '-map', '[aout]',
      '-c:v', 'copy',
      '-c:a', 'aac', '-b:a', '192k',
      '-t', String(totalDurS),
      outMp4,
    ], { stdio: 'pipe' });
  } else {
    // Music + latch click with ducking at t=12s
    // Duck music by -6dB from t=11.5s to t=13.0s around latch click
    const duckFilter = [
      `[1:a]afade=type=out:start_time=${fadeStartS}:duration=4,volume=0.65[music_faded]`,
      // Volume envelope: duck at latch beat (t=11.5-13.0s)
      `[music_faded]volume=enable='between(t,11.5,13.0)':volume=0.5[music_ducked]`,
      `[music_ducked]loudnorm=I=-14:TP=-1.5:LRA=11[music_normed]`,
      `[2:a]adelay=12000|12000,volume=1.8[click]`,   // delay click to 12s
      `[music_normed][click]amix=inputs=2:duration=first:normalize=0[aout]`,
    ].join(';');

    execFileSync(FFMPEG, [
      '-y',
      '-i', silentMp4,
      '-i', musicPath,
      '-i', latchClickPath,
      '-filter_complex', duckFilter,
      '-map', '0:v',
      '-map', '[aout]',
      '-c:v', 'copy',
      '-c:a', 'aac', '-b:a', '192k',
      '-t', String(totalDurS),
      outMp4,
    ], { stdio: 'pipe' });
  }

  console.log(`  [Audio] Mixed: ${outMp4}`);
}

// Value-line card (identical to v6)
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

gap = 28
block_h = th1 + gap + (bbox2[3]-bbox2[1])
block_y = (H - block_h) // 2

draw.text(((W - tw1) // 2, block_y), line1, font=font1, fill=(255, 255, 255))
draw.text(((W - tw2) // 2, block_y + th1 + gap), line2, font=font2, fill=(255, 255, 255))

img.save(r'${outPng}', quality=97)
print("DONE")
`;

  const pyFile = '/tmp/stehlen_valueline_v7.py';
  fs.writeFileSync(pyFile, pyScript, 'utf8');

  let result;
  try {
    result = execFileSync('python3', [pyFile], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
  } catch (e) {
    if (e.stderr && e.stderr.includes('PILLOW_MISSING')) {
      console.log('  [ValueLine] Pillow missing — ImageMagick fallback');
      buildValueLineMagick(outPng);
      return;
    }
    throw e;
  }
  if (result) console.log(`  [ValueLine] ${result.trim()}`);
}

function buildValueLineMagick(outPng) {
  execFileSync('magick', [
    '-size', '1920x1080', 'xc:#0a0a0a',
    '-font', '/System/Library/Fonts/HelveticaNeue.ttc',
    '-pointsize', '74', '-fill', 'white',
    '-gravity', 'Center', '-annotate', '+0-50', 'RAIN · ICE · DUST — OUT.',
    '-pointsize', '52',
    '-gravity', 'Center', '-annotate', '+0+50', 'YOUR GEAR — LOCKED IN.',
    outPng,
  ], { stdio: 'pipe' });
}

// End card (identical to v6)
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
    nw = 520; nh = int(logo.height * ratio)
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

  const pyFile = '/tmp/stehlen_endcard_v7.py';
  fs.writeFileSync(pyFile, pyScript, 'utf8');

  let result;
  try {
    result = execFileSync('python3', [pyFile], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
  } catch (e) {
    if (e.stderr && e.stderr.includes('PILLOW_MISSING')) {
      console.log('  [EndCard] Pillow missing — ImageMagick fallback');
      buildEndCardMagick(outPng, logoPath);
      return;
    }
    throw e;
  }
  if (result) console.log(`  [EndCard] ${result.trim()}`);
}

function buildEndCardMagick(outPng, logoPath) {
  execFileSync('magick', [
    '-size', '1920x1080', 'xc:#0a0a0a',
    '(', logoPath, '-resize', '520x', ')',
    '-gravity', 'North', '-geometry', '+0+90', '-composite',
    '-font', '/System/Library/Fonts/HelveticaNeue.ttc',
    '-pointsize', '66', '-fill', 'white', '-gravity', 'Center',
    '-annotate', '+0-95', 'HARD COVER. LED BED LIGHTING. ONE INSTALL.',
    '-pointsize', '30', '-fill', '#999999',
    '-annotate', '+0+5', 'fits 2016–2023 Tacoma 5 ft bed  ·  Access or Double Cab  ·  wrong fit, full refund',
    '-pointsize', '56', '-fill', '#f5a823',
    '-annotate', '+0+120', 'SHOP THE TONNEAU COVER',
    outPng,
  ], { stdio: 'pipe' });
}

// ── MAIN ──────────────────────────────────────────────────────────────────
async function main() {
  console.log('=== Stehlen Tacoma Tonneau Spot v7 ===');
  console.log(`Started: ${new Date().toISOString()}\n`);
  console.log(`Hero mode: ${heroMode} | Rain attempt: ${rainAttempt} | Car attempt: ${carAttempt}`);

  fs.mkdirSync(FRAMES_V7, { recursive: true });

  const WORK = '/tmp/spot-v7-work';
  const normDir = path.join(WORK, 'norm');
  const gradeDir = path.join(WORK, 'graded');
  fs.mkdirSync(normDir, { recursive: true });
  fs.mkdirSync(gradeDir, { recursive: true });

  // ── Determine hero clip
  const movingCarClip = path.join(CLIPS_DIR, `clip-moving-car-attempt-${carAttempt}.mp4`);
  const staticHeroClip = path.join(CLIPS_DIR, 'clip-h2-truck-dolly.mp4');
  const useMovingCar =
    heroMode === 'car' ||
    (heroMode === 'auto' && fs.existsSync(movingCarClip));

  const heroClip = useMovingCar ? movingCarClip : staticHeroClip;
  console.log(`\n[Hero] ${useMovingCar ? 'MOVING CAR' : 'STATIC DRIVEWAY'}: ${path.basename(heroClip)}`);

  if (useMovingCar && !fs.existsSync(movingCarClip)) {
    throw new Error(`BLOCKER: Moving car clip not found: ${movingCarClip}`);
  }
  if (!fs.existsSync(staticHeroClip)) {
    throw new Error(`BLOCKER: Static hero clip not found: ${staticHeroClip}`);
  }

  // ── Determine rain clip
  const rainClip = path.join(CLIPS_DIR, `clip-rain-shed-attempt-${rainAttempt}.mp4`);
  if (!fs.existsSync(rainClip)) {
    throw new Error(`BLOCKER: Rain clip not found: ${rainClip}`);
  }
  console.log(`[Rain] Attempt ${rainAttempt}: ${path.basename(rainClip)}`);

  // ── Music
  const musicPath = path.join(AUDIO_DIR, 'industrial-cinematic-kevin-macleod.mp3');
  if (!fs.existsSync(musicPath)) {
    throw new Error(`BLOCKER: Music file not found: ${musicPath}\nDownload Industrial Cinematic by Kevin MacLeod and place it there.`);
  }
  console.log(`[Music] Industrial Cinematic — Kevin MacLeod, CC-BY 3.0`);

  const src = {
    hero:       heroClip,
    rain:       rainClip,
    coverMacro: path.join(CLIPS_DIR, 'clip-cover-a-surface.mp4'),
    latch:      path.join(CLIPS_DIR, 'clip-latch-v6.mp4'),
    security:   path.join(CLIPS_DIR, 'clip-new-security.mp4'),
    foldOpen:   path.join(CLIPS_DIR, 'clip-cover-f-foldopen.mp4'),
    led:        path.join(CLIPS_DIR, 'clip-h1-led-reveal.mp4'),
  };

  console.log('\n[Verify] Source clips:');
  for (const [key, p] of Object.entries(src)) {
    if (!fs.existsSync(p)) throw new Error(`BLOCKER: Missing source clip [${key}]: ${p}`);
    const stat = fs.statSync(p);
    const tag = key === 'hero' ? (useMovingCar ? ' ← NEW moving car hero' : ' ← static fallback') :
                key === 'rain' ? ` ← NEW rain-shed attempt ${rainAttempt}` : '';
    console.log(`  [OK] ${key}: ${path.basename(p)} (${(stat.size / 1024 / 1024).toFixed(2)} MB)${tag}`);
  }

  // ── 1. Value-line + end card
  const valueLinePng = path.join(WORK, 'valueline-v7.png');
  const valueLineRaw = path.join(WORK, 'valueline-raw.mp4');
  const valueLineGrained = path.join(WORK, 'valueline-grained.mp4');

  buildValueLinePng(valueLinePng);
  pngToVideo(valueLinePng, valueLineRaw, 2.5);
  cardGrainVignette(valueLineRaw, valueLineGrained);

  const endCardPng = path.join(WORK, 'endcard-v7.png');
  const endCardRaw = path.join(WORK, 'endcard-raw.mp4');
  const endCardFinal = path.join(WORK, 'endcard-final.mp4');

  buildEndCardPng(endCardPng);
  pngToVideo(endCardPng, endCardRaw, 3.0);
  normalizeClip(endCardRaw, endCardFinal);

  // ── 2. Normalize all video beats
  console.log('\n[Normalize] All clips to 1920x1080 24fps...');

  const norm = {
    b1: path.join(normDir, 'b1-hero.mp4'),
    b2: path.join(normDir, 'b2-rain-shed.mp4'),
    b3: path.join(normDir, 'b3-covermacro.mp4'),
    b4: path.join(normDir, 'b4-latch-v6.mp4'),
    b5: path.join(normDir, 'b5-security.mp4'),
    b6: path.join(normDir, 'b6-foldopen.mp4'),
    b7: path.join(normDir, 'b7-led.mp4'),
  };

  // Hero: moving car is 5s total, trim to 3s from 1s in (let motion establish before cut)
  //       static hero: trim to 3s from 0s
  if (useMovingCar) {
    normalizeClip(src.hero, norm.b1, { startS: 1.0, durationS: 3 });
  } else {
    normalizeClip(src.hero, norm.b1, { durationS: 3 });
  }

  normalizeClip(src.rain,       norm.b2, { durationS: 4, isCrop: true }); // 1440x1440 — crop to 16:9
  normalizeClip(src.coverMacro, norm.b3, { durationS: 4 });
  normalizeClip(src.latch,      norm.b4, { startS: 0.5, durationS: 4 });
  normalizeClip(src.security,   norm.b5, { durationS: 4 });
  normalizeClip(src.foldOpen,   norm.b6, { durationS: 4 });
  normalizeClip(src.led,        norm.b7, { durationS: 2.5, isVertical: true });

  // ── 3. Grade + grain
  console.log('\n[Grade] Film grain + color grade...');

  const graded = {
    b1: path.join(gradeDir, 'b1.mp4'),
    b2: path.join(gradeDir, 'b2-rain-shed.mp4'),
    b3: path.join(gradeDir, 'b3-cool.mp4'),
    b4: path.join(gradeDir, 'b4-latch.mp4'),
    b5: path.join(gradeDir, 'b5.mp4'),
    b6: path.join(gradeDir, 'b6.mp4'),
    b7: path.join(gradeDir, 'b7.mp4'),
    b8: valueLineGrained,
    b9: endCardFinal,
  };

  gradeAndGrain(norm.b1, graded.b1);
  gradeAndGrainRain(norm.b2, graded.b2);   // cool-blue grade for wet beat
  gradeAndGrainCooler(norm.b3, graded.b3);
  gradeAndGrain(norm.b4, graded.b4);
  gradeAndGrain(norm.b5, graded.b5);
  gradeAndGrain(norm.b6, graded.b6);
  gradeAndGrain(norm.b7, graded.b7);

  // ── 4. Assemble silent master
  const silentMaster = path.join(CLIPS_DIR, 'stehlen-tacoma-tonneau-spot-v7-silent.mp4');
  const beatOrder = [
    graded.b1, graded.b2, graded.b3, graded.b4,
    graded.b5, graded.b6, graded.b7, graded.b8, graded.b9,
  ];
  assembleSilentMaster(beatOrder, silentMaster);

  const vsSilent = probeVideo(silentMaster);
  const totalDurS = parseFloat(vsSilent.duration);
  console.log(`  Silent master: ${vsSilent.width}x${vsSilent.height} @ ${vsSilent.r_frame_rate}fps — ${totalDurS.toFixed(2)}s`);

  // ── 5. Mix audio
  const masterOut = path.join(CLIPS_DIR, 'stehlen-tacoma-tonneau-spot-v7.mp4');
  mixAudio(silentMaster, musicPath, totalDurS, masterOut);

  // Verify final
  const vsFinal = probeVideo(masterOut);
  const durFinal = parseFloat(vsFinal.duration).toFixed(2);
  console.log(`\n[Verify] Final v7: ${vsFinal.width}x${vsFinal.height} @ ${vsFinal.r_frame_rate}fps — ${durFinal}s`);

  // ── 6. Extract review frames
  console.log('\n[Frames] Extracting beat review frames to frames-v7/...');

  // Timecodes (cumulative):
  // b1 hero:       0:00-0:03    → sample @ 1.5s
  // b2 rain-shed:  0:03-0:07    → sample @ 5.0s
  // b3 covermacro: 0:07-0:11    → sample @ 9.0s
  // b4 latch:      0:11-0:15    → sample @ 13.0s
  // b5 security:   0:15-0:19    → sample @ 17.0s
  // b6 foldopen:   0:19-0:23    → sample @ 21.0s
  // b7 LED:        0:23-0:25.5  → sample @ 24.25s
  // b8 value-line: 0:25.5-0:28  → sample @ 26.75s
  // b9 end card:   0:28-0:31    → sample @ 29.5s

  const frameSpec = [
    { name: 'beat1-hero',           t: 1.5 },
    { name: 'beat2-rain-shed',      t: 5.0 },
    { name: 'beat3-covermacro',     t: 9.0 },
    { name: 'beat4-latch',          t: 13.0 },
    { name: 'beat5-security',       t: 17.0 },
    { name: 'beat6-foldopen',       t: 21.0 },
    { name: 'beat7-led',            t: 24.25 },
    { name: 'beat8-valueline',      t: 26.75 },
    { name: 'beat9-endcard',        t: 29.5 },
  ];

  for (const spec of frameSpec) {
    const fp = path.join(FRAMES_V7, `${spec.name}.jpg`);
    extractFrame(masterOut, fp, spec.t);
  }

  // Moving car motion frames (t0, t1.5, t3 from the moving car clip directly)
  if (useMovingCar && fs.existsSync(movingCarClip)) {
    const motionDir = path.join(FRAMES_V7, 'moving-car-motion');
    fs.mkdirSync(motionDir, { recursive: true });
    for (const t of [0, 1.5, 3]) {
      extractFrame(movingCarClip, path.join(motionDir, `motion-t${t}.jpg`), t);
    }
    console.log('  [Frame] Moving car motion frames: t0, t1.5, t3');
  }

  // Value-line + end card full PNGs for review
  execFileSync('magick', [valueLinePng, '-quality', '95', path.join(FRAMES_V7, 'valueline-card-full.jpg')], { stdio: 'pipe' });
  execFileSync('magick', [endCardPng, '-quality', '95', path.join(FRAMES_V7, 'endcard-full.jpg')], { stdio: 'pipe' });
  console.log('  [Frame] valueline-card-full.jpg, endcard-full.jpg');

  // ── 7. Report
  const heroLabel = useMovingCar
    ? `MOVING CAR (attempt ${carAttempt}, rear-follow framing)`
    : `STATIC DRIVEWAY (h2-truck-dolly — fallback)`;

  console.log('\n=== BUILD COMPLETE ===');
  console.log(`\nMaster v7: ${masterOut}`);
  console.log(`  Duration: ${durFinal}s | ${vsFinal.width}x${vsFinal.height} | 24fps`);
  console.log(`\nHero: ${heroLabel}`);
  console.log(`Rain: Approach B water-shed, attempt ${rainAttempt} (clip-rain-shed-attempt-${rainAttempt}.mp4)`);
  console.log(`Music: Industrial Cinematic — Kevin MacLeod (CC-BY 3.0, incompetech.com)`);
  console.log(`\nBeat order / timecodes:`);
  console.log(`  0:00.0-0:03.0   Beat 1  ${heroLabel}`);
  console.log(`  0:03.0-0:07.0   Beat 2  Rain-shed (water sheeting off cover, drips at rail)`);
  console.log(`  0:07.0-0:11.0   Beat 3  Cover macro surface (cooler grade)`);
  console.log(`  0:11.0-0:15.0   Beat 4  Latch hero v6 (slow push-in, no pull-tab)`);
  console.log(`  0:15.0-0:19.0   Beat 5  Security locked-in-lot`);
  console.log(`  0:19.0-0:23.0   Beat 6  Fold-open / bed access`);
  console.log(`  0:23.0-0:25.5   Beat 7  LED bonus`);
  console.log(`  0:25.5-0:28.0   Beat 8  VALUE-LINE statement card`);
  console.log(`  0:28.0-0:31.0   Beat 9  End card`);
  console.log(`\nFrames-v7: ${FRAMES_V7}/`);
  console.log(`Silent master: ${silentMaster}`);
  console.log(`Finished: ${new Date().toISOString()}`);
}

main().catch(e => {
  console.error('\n[FATAL]', e.message);
  console.error(e.stack);
  process.exit(1);
});
