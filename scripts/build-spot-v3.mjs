/**
 * Stehlen Tacoma Tonneau Spot v3 — Build Script
 * Carter Voss direction: Rain + Security new beats, rebuilt end card, full assembly
 *
 * Uses:
 * - Gemini Imagen (text + ref image -> seed)
 * - Kling v2.1 Master image-to-video (pro mode)
 * - ImageMagick (end card)
 * - ffmpeg (assembly)
 *
 * All shell calls use execFileSync (not exec/shell interpolation).
 * API keys are loaded from .env.local and never logged.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execFileSync } from 'child_process';

// Paths
const ROOT = '/Users/ricky/Library/CloudStorage/OneDrive-Personal/Documents/Robome/Client/JL Concepts/Project/stehlenauto-vercel';
const CLIPS_DIR = path.join(ROOT, 'public/videos/spot-clips');
const SEEDS_DIR = path.join(ROOT, 'public/images/spot-seeds');
const FRAMES_V3 = path.join(CLIPS_DIR, 'frames-v3');
const FFMPEG = '/opt/homebrew/bin/ffmpeg';
const FFPROBE = '/opt/homebrew/bin/ffprobe';

// Load env (never log the values)
const ENV_RAW = fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8');
function envGet(key) {
  const m = ENV_RAW.match(new RegExp(`^${key}="?([^"\n]+)"?`, 'm'));
  if (!m) throw new Error(`Missing env: ${key}`);
  return m[1];
}
const GEMINI_KEY = envGet('GEMINI_API_KEY');
const KLING_ACCESS = envGet('KLING_AI_ACCESS_KEY');
const KLING_SECRET = envGet('KLING_AI_SECRET_KEY');

// Kling JWT (HS256, no external deps)
function makeKlingJWT() {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({
    iss: KLING_ACCESS,
    exp: now + 1800,
    nbf: now - 5,
  })).toString('base64url');
  const sig = crypto
    .createHmac('sha256', KLING_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');
  return `${header}.${payload}.${sig}`;
}

// Gemini Imagen 3: text + optional ref image -> saved image file
async function geminiImagen(prompt, outputPath, refImagePath = null, label = '') {
  console.log(`\n[Gemini${label}] ${path.basename(outputPath)}`);

  const parts = [{ text: prompt }];
  if (refImagePath && fs.existsSync(refImagePath)) {
    const imgBytes = fs.readFileSync(refImagePath);
    const ext = path.extname(refImagePath).slice(1).toLowerCase();
    const mimeMap = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png' };
    parts.push({ inlineData: { mimeType: mimeMap[ext] || 'image/jpeg', data: imgBytes.toString('base64') } });
  }

  const body = {
    contents: [{ parts }],
    generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
  };

  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_KEY}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
  );

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Gemini ${resp.status}: ${txt.slice(0, 400)}`);
  }

  const data = await resp.json();
  for (const cand of (data.candidates || [])) {
    for (const part of (cand.content?.parts || [])) {
      if (part.inlineData?.mimeType?.startsWith('image/')) {
        const buf = Buffer.from(part.inlineData.data, 'base64');
        fs.writeFileSync(outputPath, buf);
        console.log(`  Saved ${path.basename(outputPath)} (${(buf.length/1024).toFixed(0)}KB)`);
        return outputPath;
      }
    }
  }
  throw new Error(`Gemini: no image in response — keys: ${Object.keys(data).join(', ')}`);
}

// Kling: submit i2v task
async function klingSubmit({ imageBase64, prompt, negativePrompt, duration }) {
  const jwt = makeKlingJWT();
  // image field: raw base64 (no data URI prefix) — verified against kling-generate.ts
  const body = {
    model_name: 'kling-v2-1-master',
    mode: 'pro',
    image: imageBase64,
    prompt,
    negative_prompt: negativePrompt,
    duration: String(duration),
    sound: 'off',
  };
  const resp = await fetch('https://api-singapore.klingai.com/v1/videos/image2video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Kling submit ${resp.status}: ${txt.slice(0, 500)}`);
  }
  const data = await resp.json();
  if (data.code !== 0) throw new Error(`Kling submit failed code=${data.code}: ${JSON.stringify(data)}`);
  const taskId = data.data?.task_id;
  if (!taskId) throw new Error(`Kling: no task_id in: ${JSON.stringify(data)}`);
  console.log(`  [Kling] Task submitted: ${taskId}`);
  return taskId;
}

// Kling: poll until done (15s interval)
async function klingPoll(taskId, maxWaitMs = 660000) {
  const start = Date.now();
  let dots = 0;
  while (Date.now() - start < maxWaitMs) {
    await new Promise(r => setTimeout(r, 15000));
    const jwt = makeKlingJWT();
    let data;
    try {
      const resp = await fetch(`https://api-singapore.klingai.com/v1/videos/image2video/${taskId}`, {
        headers: { Authorization: `Bearer ${jwt}` }
      });
      if (!resp.ok) { process.stdout.write('?'); continue; }
      data = await resp.json();
    } catch { process.stdout.write('!'); continue; }

    const status = data.data?.task_status;
    process.stdout.write(++dots % 4 === 0 ? `\n  [${taskId}] ${status} ` : '.');

    if (status === 'succeed') {
      const url = data.data?.task_result?.videos?.[0]?.url;
      if (!url) throw new Error(`Kling succeed but no URL: ${JSON.stringify(data.data)}`);
      console.log(`\n  [Kling] Done: ${taskId}`);
      return url;
    }
    if (status === 'failed') throw new Error(`Kling failed: ${JSON.stringify(data.data)}`);
  }
  throw new Error(`Kling timeout after ${maxWaitMs/1000}s for ${taskId}`);
}

// Download a URL to file
async function dlFile(url, outPath) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Download failed ${resp.status}: ${url}`);
  const buf = Buffer.from(await resp.arrayBuffer());
  fs.writeFileSync(outPath, buf);
  console.log(`  [DL] ${path.basename(outPath)} (${(buf.length/1024/1024).toFixed(1)}MB)`);
}

// Full Kling generate: seed image -> video file
async function klingGen({ seedPath, prompt, negativePrompt, outPath, duration = 5 }) {
  console.log(`\n[Kling] Generating: ${path.basename(outPath)}`);
  const imgBytes = fs.readFileSync(seedPath);
  const taskId = await klingSubmit({
    imageBase64: imgBytes.toString('base64'),
    prompt, negativePrompt, duration,
  });
  const videoUrl = await klingPoll(taskId);
  await dlFile(videoUrl, outPath);
  return outPath;
}

// Extract a single frame from a video
function extractFrame(clipPath, outPath, timeS = 2.0) {
  execFileSync(FFMPEG, [
    '-y', '-ss', String(timeS), '-i', clipPath,
    '-frames:v', '1', '-q:v', '2', outPath
  ], { stdio: 'pipe' });
  console.log(`  [Frame] ${path.basename(outPath)}`);
}

// Normalize clip: scale to 1920x1080, 24fps, trim if needed
function normalizeClip(inPath, outPath, opts = {}) {
  const { startS = 0, durationS = null, isVertical = false } = opts;
  const args = ['-y'];
  if (startS > 0) args.push('-ss', String(startS));
  if (durationS != null) args.push('-t', String(durationS));
  args.push('-i', inPath);

  const vf = isVertical
    // 9:16 portrait: crop to 16:9 landscape by taking full width and cutting height to iw*9/16
    // Center the crop vertically (default). Then scale to 1920x1080.
    ? 'crop=iw:iw*9/16,scale=1920:1080'
    : 'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2';
  args.push('-vf', vf, '-c:v', 'libx264', '-preset', 'slow', '-crf', '16',
    '-pix_fmt', 'yuv420p', '-r', '24', '-an', outPath);
  execFileSync(FFMPEG, args, { stdio: 'pipe' });
  console.log(`  [Norm] ${path.basename(outPath)}`);
}

// Grade + grain pass (teal-orange lift, film grain, vignette)
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

// Build end card PNG via Python/Pillow
function buildEndCardPng(outPng) {
  console.log('\n[EndCard] Building end card PNG...');

  const logoPath = path.join(ROOT, 'public/images/stehlen-logo.png');

  // Logo is white on black - reads directly on dark card.
  // Use Pillow for clean Unicode (middot U+00B7, en-dash U+2013).

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
    # center horizontally at y=90
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
sub = 'fits 2016–2023 Tacoma 5 ft bed  ·  Access or Double Cab  ·  wrong fit, full refund'
font_sub = load_font(font_paths, 30)
bbox2 = draw.textbbox((0, 0), sub, font=font_sub)
tw2 = bbox2[2] - bbox2[0]
draw.text(((W - tw2) // 2, 530), sub, font=font_sub, fill=(153, 153, 153))

# CTA
cta = 'SHOP THE TONNEAU COVER'
font_cta = load_font(font_paths, 56)
bbox3 = draw.textbbox((0, 0), cta, font=font_cta)
tw3 = bbox3[2] - bbox3[0]
draw.text(((W - tw3) // 2, 655), cta, font=font_cta, fill=(245, 168, 35))

img.save(r'${outPng}', quality=97)
print("DONE")
`;

  const pyFile = '/tmp/stehlen_endcard_v3.py';
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
  // ImageMagick fallback — uses pango for proper unicode if available, else magick label
  const W = 1920, H = 1080;
  const headline = 'HARD COVER. LED BED LIGHTING. ONE INSTALL.';
  const cta = 'SHOP THE TONNEAU COVER';
  // middot and en-dash via UTF-8 literal in file
  const subLine = 'fits 2016–2023 Tacoma 5 ft bed  ·  Access or Double Cab  ·  wrong fit, full refund';

  // Write subline as labeled image (pango handles unicode)
  const subPng = '/tmp/stehlen_sub_v3.png';
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
    // Logo
    '(', logoPath, '-resize', '520x', ')',
    '-gravity', 'North', '-geometry', '+0+90', '-composite',
    // Headline
    '-font', '/System/Library/Fonts/HelveticaNeue.ttc',
    '-pointsize', '66',
    '-fill', 'white',
    '-gravity', 'Center',
    '-annotate', '+0-95',
    headline,
    // Sub-line from pre-rendered label
    '(', subPng, ')',
    '-gravity', 'Center', '-geometry', '+0+5', '-composite',
    // CTA
    '-pointsize', '56',
    '-fill', '#f5a823',
    '-gravity', 'Center',
    '-annotate', '+0+120',
    cta,
    outPng,
  ], { stdio: 'pipe', encoding: 'utf8' });
}

// Convert end card PNG to a 3s 24fps video
function endCardToVideo(imgPath, outMp4) {
  execFileSync(FFMPEG, [
    '-y', '-loop', '1', '-i', imgPath, '-t', '3',
    '-vf', 'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '16',
    '-pix_fmt', 'yuv420p', '-r', '24', outMp4,
  ], { stdio: 'pipe' });
  console.log(`  [EndCard] Video: ${path.basename(outMp4)}`);
}

// Build concat list and assemble master
function assembleSpot(gradedPaths, outMp4) {
  const listFile = '/tmp/stehlen_concat_v3.txt';
  fs.writeFileSync(listFile, gradedPaths.map(p => `file '${p}'`).join('\n'), 'utf8');
  execFileSync(FFMPEG, [
    '-y', '-f', 'concat', '-safe', '0', '-i', listFile,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '15',
    '-pix_fmt', 'yuv420p', '-r', '24', '-an', outMp4,
  ], { stdio: 'pipe' });
  console.log(`\n[Assemble] Master: ${outMp4}`);
}

// ffprobe a file -> video stream object
function probeVideo(filePath) {
  const out = execFileSync(FFPROBE, [
    '-v', 'quiet', '-print_format', 'json', '-show_streams', filePath
  ], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
  const data = JSON.parse(out);
  return data.streams.find(s => s.codec_type === 'video');
}


// ── MAIN ──────────────────────────────────────────────────────────────────
async function main() {
  console.log('=== Stehlen Tacoma Tonneau Spot v3 ===');
  console.log(`Started: ${new Date().toISOString()}\n`);

  fs.mkdirSync(FRAMES_V3, { recursive: true });
  const WORK = '/tmp/spot-v3-work';
  const normDir = path.join(WORK, 'norm');
  const gradeDir = path.join(WORK, 'graded');
  fs.mkdirSync(normDir, { recursive: true });
  fs.mkdirSync(gradeDir, { recursive: true });

  // ── 1. Gemini seeds ───────────────────────────────────────────────────

  // RAIN seeds (3 attempts)
  const rainSeedPaths = [];
  const rainPrompt = [
    'Extreme close-up macro photo of a matte black hard composite tonneau cover panel.',
    'Several spherical water droplets bead up on the textured matte hard surface,',
    'a few droplets slowly rolling toward a raised panel seam.',
    'The surface is clearly MATTE and HARD — rigid, not glossy, not a tarp, not fabric soft cover.',
    'Dark moody overcast diffuse lighting, key from above.',
    'The rigid black panel fills the entire frame edge to edge.',
    'Shallow depth of field, dark background.',
    '16:9 landscape orientation, product photography quality.',
    'NO background rain. NO puddles. NO chrome. NO people.',
  ].join(' ');

  for (let i = 1; i <= 3; i++) {
    const p = path.join(SEEDS_DIR, `seed-rain-attempt-${i}.jpg`);
    rainSeedPaths.push(p);
    if (fs.existsSync(p)) { console.log(`[Skip] seed-rain-${i} exists`); continue; }
    try {
      await geminiImagen(rainPrompt, p, path.join(SEEDS_DIR, 'seed-a.jpg'), ` rain-${i}`);
    } catch (e) {
      console.error(`  [Gemini] rain-${i} failed: ${e.message}`);
      rainSeedPaths.pop();
    }
    if (i < 3) await new Promise(r => setTimeout(r, 2500));
  }

  // SECURITY seeds (2 attempts)
  const secSeedPaths = [];
  const secPrompt = [
    'Photorealistic photo: silver 2016-2023 Toyota Tacoma Double Cab pickup truck',
    'parked in an ordinary big-box retail parking lot.',
    'The truck has a MATTE BLACK hard tri-fold tonneau cover, CLOSED and flush with the bed rails.',
    'Background: flat asphalt with painted white parking lines,',
    'a few ordinary parked cars at distance, a cart corral, standard parking lot light poles.',
    'Late afternoon or dusk light, slightly overcast sky.',
    'Correct Tacoma boomerang-shape tail lamps clearly visible.',
    'Stock ride height — no lift, no oversized wheels.',
    'No people in foreground, no hands visible anywhere.',
    'Reads as everyday errand: cargo locked and protected.',
    '16:9 landscape orientation.',
  ].join(' ');

  for (let i = 1; i <= 2; i++) {
    const p = path.join(SEEDS_DIR, `seed-security-attempt-${i}.jpg`);
    secSeedPaths.push(p);
    if (fs.existsSync(p)) { console.log(`[Skip] seed-security-${i} exists`); continue; }
    try {
      await geminiImagen(secPrompt, p, path.join(SEEDS_DIR, 'seed-b-attempt-2.jpg'), ` security-${i}`);
    } catch (e) {
      console.error(`  [Gemini] security-${i} failed: ${e.message}`);
      secSeedPaths.pop();
    }
    if (i < 2) await new Promise(r => setTimeout(r, 2500));
  }

  const goodRain = rainSeedPaths.filter(p => fs.existsSync(p));
  const goodSec = secSeedPaths.filter(p => fs.existsSync(p));

  if (goodRain.length === 0) throw new Error('BLOCKER: No rain seeds generated');
  if (goodSec.length === 0) throw new Error('BLOCKER: No security seeds generated');

  console.log(`\n[Seeds] Rain: ${goodRain.length}/3 | Security: ${goodSec.length}/2`);

  // Rain: attempt-3 has best droplet distribution + clearest seam. Use it if available.
  // Security: attempt-2 has wider 16:9 framing, clearest panel lines, best lot context.
  const bestRain = goodRain.find(p => p.includes('attempt-3')) || goodRain[goodRain.length - 1];
  const bestSec = goodSec.find(p => p.includes('attempt-2')) || goodSec[goodSec.length - 1];
  console.log(`  Best rain seed: ${path.basename(bestRain)}`);
  console.log(`  Best security seed: ${path.basename(bestSec)}`);

  // ── 2. Kling i2v ──────────────────────────────────────────────────────

  const clipRain = path.join(CLIPS_DIR, 'clip-new-rain.mp4');
  const clipSec = path.join(CLIPS_DIR, 'clip-new-security.mp4');

  if (fs.existsSync(clipRain)) {
    console.log(`\n[Skip] Rain clip exists: ${clipRain}`);
  } else {
    await klingGen({
      seedPath: bestRain,
      prompt: [
        'Extreme macro close-up of matte black hard composite tri-fold tonneau cover panel.',
        'Several water droplets bead on the textured matte rigid surface.',
        'Camera creeps very slowly forward 2 inches over 4 seconds.',
        'Two droplets slowly merge and roll toward the raised panel seam.',
        'Water beads up clearly — does not soak in.',
        'Moody overcast diffuse lighting.',
        'The hard rigid panel fills the frame.',
        'No rain in background. No background precipitation.',
      ].join(' '),
      negativePrompt: 'streaming rain, background rain, puddle, wet road, glossy surface, mirror finish, tarp, soft cover, fabric, chrome, people, hands, showroom, lifted suspension, oversized wheels, studio backdrop',
      outPath: clipRain,
      duration: 5,
    });
  }

  if (fs.existsSync(clipSec)) {
    console.log(`\n[Skip] Security clip exists: ${clipSec}`);
  } else {
    await klingGen({
      seedPath: bestSec,
      prompt: [
        'Silver 2016-2023 Toyota Tacoma Double Cab with matte black hard tonneau cover closed flush,',
        'parked in ordinary retail parking lot.',
        'Camera very slowly pushes in toward the closed latched cover over 4 seconds.',
        'Truck is completely static and parked.',
        'Late afternoon dusk light.',
        'No people in foreground. No movement except the camera.',
        'Reads as everyday errand, cargo secured and hidden.',
      ].join(' '),
      negativePrompt: 'people in foreground, hands on product, moving vehicle, driving, lifted suspension, oversized wheels, chrome, glossy finish, desert, mountains, campfire, glamour studio, showroom, dramatic lighting, sports car, foreign car brand',
      outPath: clipSec,
      duration: 5,
    });
  }

  // ── 3. End card ───────────────────────────────────────────────────────
  const endCardPng = path.join(WORK, 'endcard-v3.png');
  const endCardMp4 = path.join(WORK, 'endcard-v3.mp4');

  buildEndCardPng(endCardPng);
  endCardToVideo(endCardPng, endCardMp4);

  // ── 4. Normalize clips ─────────────────────────────────────────────────
  console.log('\n[Normalize] All clips to 1920x1080 24fps...');

  const norm = {
    b1: path.join(normDir, 'b1-coldopen.mp4'),
    b2: path.join(normDir, 'b2-rain.mp4'),
    b3: path.join(normDir, 'b3-covermacro.mp4'),
    b4: path.join(normDir, 'b4-latch.mp4'),
    b5: path.join(normDir, 'b5-security.mp4'),
    b6: path.join(normDir, 'b6-foldopen.mp4'),
    b7: path.join(normDir, 'b7-led.mp4'),
    b8: path.join(normDir, 'b8-endcard.mp4'),
  };

  normalizeClip(path.join(CLIPS_DIR, 'clip-h2-truck-dolly.mp4'), norm.b1, { durationS: 3 });
  normalizeClip(clipRain, norm.b2, { durationS: 4 });
  normalizeClip(path.join(CLIPS_DIR, 'clip-cover-a-surface.mp4'), norm.b3, { durationS: 4 });
  normalizeClip(path.join(CLIPS_DIR, 'clip-cover-d-latch.mp4'), norm.b4, { startS: 1.5, durationS: 3 });
  normalizeClip(clipSec, norm.b5, { durationS: 4 });
  normalizeClip(path.join(CLIPS_DIR, 'clip-cover-f-foldopen.mp4'), norm.b6, { durationS: 4 });
  normalizeClip(path.join(CLIPS_DIR, 'clip-h1-led-reveal.mp4'), norm.b7, { durationS: 2.5, isVertical: true });
  normalizeClip(endCardMp4, norm.b8);

  // ── 5. Grade + grain ───────────────────────────────────────────────────
  console.log('\n[Grade] Film grain + teal-orange grade...');

  const graded = {
    b1: path.join(gradeDir, 'b1.mp4'),
    b2: path.join(gradeDir, 'b2.mp4'),
    b3: path.join(gradeDir, 'b3.mp4'),
    b4: path.join(gradeDir, 'b4.mp4'),
    b5: path.join(gradeDir, 'b5.mp4'),
    b6: path.join(gradeDir, 'b6.mp4'),
    b7: path.join(gradeDir, 'b7.mp4'),
    b8: path.join(gradeDir, 'b8.mp4'),  // end card: no grain
  };

  gradeAndGrain(norm.b1, graded.b1);
  gradeAndGrain(norm.b2, graded.b2);
  gradeAndGrain(norm.b3, graded.b3);
  gradeAndGrain(norm.b4, graded.b4);
  gradeAndGrain(norm.b5, graded.b5);
  gradeAndGrain(norm.b6, graded.b6);
  gradeAndGrain(norm.b7, graded.b7);
  // End card: straight copy, no grain
  normalizeClip(norm.b8, graded.b8);

  // ── 6. Assemble ────────────────────────────────────────────────────────
  const masterOut = path.join(CLIPS_DIR, 'stehlen-tacoma-tonneau-spot-v3.mp4');
  const orderedBeats = [graded.b1, graded.b2, graded.b3, graded.b4, graded.b5, graded.b6, graded.b7, graded.b8];
  assembleSpot(orderedBeats, masterOut);

  // Verify
  const vs = probeVideo(masterOut);
  const durTotal = parseFloat(vs.duration).toFixed(2);
  console.log(`  ${vs.width}x${vs.height} @ ${vs.r_frame_rate}fps — ${durTotal}s`);

  // ── 7. Review frames ───────────────────────────────────────────────────
  console.log('\n[Frames] Extracting beat review frames...');

  // Timecodes: b1 0-3, b2 3-7, b3 7-11, b4 11-14, b5 14-18, b6 18-22, b7 22-24.5, b8 24.5-27.5
  const frameSpec = [
    { name: 'beat1-coldopen',    t: 1.5 },
    { name: 'beat2-rain',        t: 5.0 },
    { name: 'beat3-covermacro',  t: 9.0 },
    { name: 'beat4-latch',       t: 12.5 },
    { name: 'beat5-security',    t: 16.0 },
    { name: 'beat6-foldopen',    t: 20.0 },
    { name: 'beat7-led',         t: 23.25 },
    { name: 'beat8-endcard',     t: 25.5 },
  ];

  for (const fs2 of frameSpec) {
    const fp = path.join(FRAMES_V3, `${fs2.name}.jpg`);
    extractFrame(masterOut, fp, fs2.t);
  }

  // Also save end card PNG as JPG for direct review
  const endCardReview = path.join(FRAMES_V3, 'endcard-full.jpg');
  execFileSync('magick', [endCardPng, '-quality', '95', endCardReview], { stdio: 'pipe' });
  console.log(`  [Frame] endcard-full.jpg`);

  // ── 8. Report ──────────────────────────────────────────────────────────
  console.log('\n=== BUILD COMPLETE ===');
  console.log(`\nSeed paths:`);
  goodRain.forEach(p => console.log(`  Rain: ${p}`));
  goodSec.forEach(p => console.log(`  Security: ${p}`));
  console.log(`\nNew clips:`);
  console.log(`  ${clipRain}`);
  console.log(`  ${clipSec}`);
  console.log(`\nEnd card:`);
  console.log(`  PNG: ${endCardPng}`);
  console.log(`  Review JPG: ${endCardReview}`);
  console.log(`\nMaster v3: ${masterOut}`);
  console.log(`  Duration: ${durTotal}s | ${vs.width}x${vs.height} | 24fps`);
  console.log(`\nBeat order / timecodes:`);
  console.log(`  0:00-0:03   Beat 1  Cold-open hero (h2 dolly)`);
  console.log(`  0:03-0:07   Beat 2  RAIN proof (NEW Kling)`);
  console.log(`  0:07-0:11   Beat 3  Cover macro surface`);
  console.log(`  0:11-0:14   Beat 4  Latch/rail (trimmed 1.5-4.5s)`);
  console.log(`  0:14-0:18   Beat 5  SECURITY locked-in-lot (NEW Kling)`);
  console.log(`  0:18-0:22   Beat 6  Fold-open / bed access`);
  console.log(`  0:22-0:24.5 Beat 7  LED bonus`);
  console.log(`  0:24.5-0:27.5 Beat 8 End card`);
  console.log(`\nFrames-v3: ${FRAMES_V3}/`);
  console.log(`Finished: ${new Date().toISOString()}`);
}

main().catch(e => {
  console.error('\n[FATAL]', e.message);
  console.error(e.stack);
  process.exit(1);
});
