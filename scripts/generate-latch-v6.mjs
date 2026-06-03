/**
 * generate-latch-v6.mjs
 * Generates 3 latch clip attempts for Stehlen Tacoma Tonneau Spot v6.
 *
 * Fix: Approach B — tight-crop seed (seed-latch-v6-tight.jpg) reframes hero
 * on paddle face + buckle housing, removing lower frame where the AI-generated
 * dangling pull-tab geometry lived in v5. Prompt explicitly forbids any
 * dangling tab / free-hanging plastic / strap-end that tapers into nothing.
 *
 * Tool: Kling AI v2.1 Master, image-to-video, pro mode, 5s
 * Endpoint: api-singapore.klingai.com (matches working v5 script pattern)
 * Image: raw base64 (no data URI prefix) — per v5 script confirmed pattern
 *
 * Keys: KLING_AI_ACCESS_KEY / KLING_AI_SECRET_KEY from .env.local (never logged)
 */

import fs from 'fs';
import path from 'path';
import { createHmac } from 'crypto';

const ROOT = '/Users/ricky/Library/CloudStorage/OneDrive-Personal/Documents/Robome/Client/JL Concepts/Project/stehlenauto-vercel';
const ENV_FILE = path.join(ROOT, '.env.local');
const SEEDS_DIR = path.join(ROOT, 'public/images/spot-seeds');
const CLIPS_DIR = path.join(ROOT, 'public/videos/spot-clips');
const ATTEMPTS_DIR = path.join(CLIPS_DIR, 'latch-v6-attempts');

const KLING_BASE = 'https://api-singapore.klingai.com';
const KLING_MODEL = 'kling-v2-1-master';
const POLL_INTERVAL_MS = 10000;
const POLL_TIMEOUT_MS = 15 * 60 * 1000;

// ── Read env ─────────────────────────────────────────────────────────────────
function loadEnv(file) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  const env = {};
  for (const line of lines) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  return env;
}

const envVars = loadEnv(ENV_FILE);
const ACCESS_KEY = envVars['KLING_AI_ACCESS_KEY'];
const SECRET_KEY = envVars['KLING_AI_SECRET_KEY'];
if (!ACCESS_KEY || !SECRET_KEY) throw new Error('BLOCKER: KLING_AI_ACCESS_KEY / KLING_AI_SECRET_KEY not found in .env.local');

// ── Kling JWT (matches v5 script exactly) ─────────────────────────────────────
function base64UrlEncode(buf) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function signJwt(accessKey, secretKey) {
  const nowSec = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const payload = base64UrlEncode(
    Buffer.from(JSON.stringify({ iss: accessKey, exp: nowSec + 1800, nbf: nowSec - 5 }))
  );
  const signingInput = `${header}.${payload}`;
  const sig = createHmac('sha256', secretKey).update(signingInput).digest();
  return `${signingInput}.${base64UrlEncode(sig)}`;
}

// ── Submit image-to-video task ────────────────────────────────────────────────
async function submitTask(jwt, imageBase64, promptText, negativePrompt, label) {
  console.log(`  [Submit] ${label}`);

  const body = {
    model_name: KLING_MODEL,
    image: imageBase64,          // raw base64, no data URI prefix — matches v5 pattern
    prompt: promptText,
    negative_prompt: negativePrompt,
    duration: '5',
    mode: 'pro',
    sound: 'off',
  };

  const res = await fetch(`${KLING_BASE}/v1/videos/image2video`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jwt}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  if (!res.ok) {
    console.error(`  [Submit HTTP ERROR] ${label}: ${res.status} ${text.slice(0, 400)}`);
    return null;
  }

  let json;
  try { json = JSON.parse(text); } catch {
    console.error(`  [Submit PARSE ERROR] ${label}: ${text.slice(0, 200)}`);
    return null;
  }

  if (json.code !== 0) {
    console.error(`  [Submit API ERROR] ${label}: code=${json.code} message=${json.message}`);
    return null;
  }

  const taskId = json.data?.task_id;
  console.log(`  [Submitted] ${label} → task_id: ${taskId}`);
  return taskId;
}

// ── Poll until done ───────────────────────────────────────────────────────────
async function pollTask(jwt, taskId, label) {
  const start = Date.now();
  while (Date.now() - start < POLL_TIMEOUT_MS) {
    await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));

    const freshJwt = signJwt(ACCESS_KEY, SECRET_KEY); // refresh JWT each poll
    const res = await fetch(`${KLING_BASE}/v1/videos/image2video/${taskId}`, {
      headers: { 'Authorization': `Bearer ${freshJwt}`, 'Content-Type': 'application/json' },
    });

    const text = await res.text();
    if (!res.ok) {
      console.error(`  [Poll HTTP ERROR] ${label}: ${res.status}`);
      continue;
    }

    let json;
    try { json = JSON.parse(text); } catch { continue; }

    if (json.code !== 0) {
      console.error(`  [Poll API ERROR] ${label}: code=${json.code}`);
      return null;
    }

    const task = json.data;
    const status = task?.task_status;
    const elapsed = Math.round((Date.now() - start) / 1000);
    process.stdout.write(`\r  [Poll] ${label} → ${status} (${elapsed}s)   `);

    if (status === 'succeed') {
      console.log();
      return task.task_result?.videos?.[0]?.url || null;
    }
    if (status === 'failed') {
      console.log();
      console.error(`  [FAILED] ${label}: ${task.task_status_msg}`);
      return null;
    }
  }
  console.log();
  console.error(`  [TIMEOUT] ${label}`);
  return null;
}

// ── Download video ─────────────────────────────────────────────────────────────
async function downloadVideo(url, outPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const buf = await res.arrayBuffer();
  fs.writeFileSync(outPath, Buffer.from(buf));
  const sizeMB = (fs.statSync(outPath).size / 1024 / 1024).toFixed(2);
  console.log(`  [Download] ${path.basename(outPath)} (${sizeMB} MB)`);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('=== Latch v6 — Attempt Generation ===');
  console.log(`Started: ${new Date().toISOString()}\n`);

  fs.mkdirSync(ATTEMPTS_DIR, { recursive: true });

  const seedTight = path.join(SEEDS_DIR, 'seed-latch-v6-tight.jpg');
  if (!fs.existsSync(seedTight)) throw new Error(`BLOCKER: seed not found: ${seedTight}`);

  const imageBase64 = fs.readFileSync(seedTight).toString('base64');
  console.log(`[Seed] ${path.basename(seedTight)} — ${(imageBase64.length / 1024).toFixed(0)} KB base64\n`);

  // Shared negative prompt — tight on the tab problem
  const NEG = 'dangling pull-tab, tapering plastic tab, strap end that tapers into nothing, free-hanging plastic flap, ambiguous cut-off geometry at bottom of frame, chrome, gloss surface, mirror shine, hands, fingers, bright studio background, showroom white, lifted suspension, mud, warping webbing, morphing buckle, AI glow, smeared plastic';

  // Three attempt variants
  const attempts = [
    {
      label: 'latch-v6-attempt-1',
      // Restrained: very slow push-in toward buckle face, frame stays high
      prompt:
        'Extreme close-up macro of a matte black tonneau cover latch mechanism: flat oval paddle latch on left, rectangular quick-release safety buckle clip on right, mounted on extruded matte black aluminum side rail. ' +
        'Camera: very slow forward push, already at extreme close range, ending with the buckle clip face filling right half of frame. 50mm macro equivalent. Very shallow depth of field — paddle and buckle sharp. ' +
        'Lighting: single tungsten key from top-right, deep shadow below, sharp highlight on paddle top face and buckle housing. Background is near-black. ' +
        'Nylon webbing strap exits frame to the right — strap is taut and fully resolves into the buckle housing. ' +
        'The bottom edge of frame shows only the flat textured surface of the tonneau panel — no dangling geometry below the buckle. ' +
        'Motion: physically weighted slow push, no float, no AI ease-curve. Hold 2 seconds, push 2 seconds, hold 1 second. No hands, no people.',
    },
    {
      label: 'latch-v6-attempt-2',
      // Lateral arc: slow left-to-right pan keeps frame centered on paddle + buckle face
      prompt:
        'Tight macro shot of a matte black truck tonneau cover latch and safety buckle clip. ' +
        'The paddle latch is a smooth rectangular matte black plastic housing, seated on the extruded black aluminum side rail. ' +
        'The quick-release buckle clip is to the right of the paddle — matte black hard plastic housing, rectangular, with nylon webbing strap threading through and exiting frame to the right. ' +
        'Camera: slow lateral dolly from just left of center to just right of center, 50mm macro equivalent, shallow depth of field. ' +
        'Frame stays tight: top is the anodized rail, bottom is the flat tonneau panel surface. No space below the buckle clip in frame. ' +
        'Lighting: interior studio, tungsten raking from upper left, micro-texture on matte surfaces visible. ' +
        'Strap is taut where it enters buckle. Bottom of frame has no dangling elements. Smooth, weighted motion. 5 seconds. No hands.',
    },
    {
      label: 'latch-v6-attempt-3',
      // Near-static rack focus: locked off camera, only focus shifts. Safest motion option.
      prompt:
        'Static locked-off macro of tonneau cover hardware on a black aluminum rail. ' +
        'Left: matte black oval paddle latch, seated flat, micro-texture on surface. ' +
        'Right: matte black quick-release safety buckle clip, with tightly woven nylon webbing strap running off to the right edge. ' +
        'Camera: completely static, 85mm macro equivalent, deep vignette, rack focus slowly shifts from paddle body to buckle clip housing at second 2, returns to neutral at second 4. ' +
        'Lighting: single tungsten practical directly above, raking shadows. Background: pure black. ' +
        'The frame is composed so the buckle is never below center of frame — the bottom half of frame is only the flat tonneau panel. ' +
        'The nylon strap terminates cleanly inside the buckle housing — no free end, no dangling tab. ' +
        'Physically real: no warping, no floating, no morphing. No hands. 5 seconds.',
    },
  ];

  // Submit all 3 in parallel
  const jwt = signJwt(ACCESS_KEY, SECRET_KEY);
  console.log('[Submit] Submitting 3 attempts in parallel...\n');

  const taskIds = await Promise.all(
    attempts.map(a => submitTask(jwt, imageBase64, a.prompt, NEG, a.label))
  );

  console.log('\n[Poll] Polling all 3 tasks...\n');

  // Poll sequentially to keep output readable (parallel polling with process.stdout.write gets messy)
  const results = [];
  for (let i = 0; i < attempts.length; i++) {
    const tid = taskIds[i];
    if (!tid) {
      console.warn(`  [Skip] ${attempts[i].label} — no task_id`);
      results.push(null);
      continue;
    }
    const url = await pollTask(signJwt(ACCESS_KEY, SECRET_KEY), tid, attempts[i].label);
    results.push(url);
  }

  // Download whatever succeeded
  console.log('\n[Download] Saving clips...\n');
  const downloaded = [];
  for (let i = 0; i < attempts.length; i++) {
    const url = results[i];
    const label = attempts[i].label;
    if (!url) { console.warn(`  [Skip] ${label} — no URL`); continue; }
    const outPath = path.join(ATTEMPTS_DIR, `${label}.mp4`);
    await downloadVideo(url, outPath);
    downloaded.push({ label, path: outPath });
  }

  console.log('\n=== Generation Complete ===');
  console.log(`Attempts directory: ${ATTEMPTS_DIR}`);
  console.log('Downloaded clips:');
  for (const d of downloaded) console.log(`  ${d.label}: ${d.path}`);
  console.log(`\nFinished: ${new Date().toISOString()}`);
}

main().catch(e => {
  console.error('\n[FATAL]', e.message);
  console.error(e.stack);
  process.exit(1);
});
