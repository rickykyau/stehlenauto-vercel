# Tacoma Tonneau Spot — Finishing & Launch Runbook

Final **visual** master: `public/videos/spot-clips/stehlen-tacoma-tonneau-spot-v6.mp4`
(31s · 1920×1080 · 24fps · silent by design). Temp-audio preview:
`...-v6-tempaudio.mp4` (royalty-free placeholder — **swap for licensed audio before launch**).

Customer-verified at **9.8/10** (Mike). The last 0.2 to a literal 10 is the audio layer below.
100% AI-generated (Gemini seeds → Kling Omni 3 `kling-v2-1-master`). Cover-hero direction; LED is a bonus beat.

## Beat order + timecodes (v6)

| # | Time | Beat |
|---|------|------|
| 1 | 0:00–0:03 | Hero cold-open — 2016–2023 Tacoma, 3/4 rear, driveway |
| 2 | 0:03–0:07 | Rain proof — water beading on the matte cover |
| 3 | 0:07–0:11 | Cover surface macro (cool grade) |
| 4 | 0:11–0:15 | Latch + safety-buckle hero (the lock), slow push-in |
| 5 | 0:15–0:19 | Security — cover locked in an everyday retail lot |
| 6 | 0:19–0:23 | Fold-open — bed access |
| 7 | 0:23–0:25.5 | LED bonus — white pucks lit in the bed |
| 8 | 0:25.5–0:28 | Value line — "RAIN · ICE · DUST — OUT. YOUR GEAR — LOCKED IN." |
| 9 | 0:28–0:31 | End card — Stehlen logo + fitment + yellow "SHOP THE TONNEAU COVER" |

## 1. Music bed (your Artlist / Epidemic license)
- **Tempo:** 72–80 BPM. **Key:** D minor or A minor.
- **Mood:** minimal industrial-ambient, premium-not-bro (Yeti/Filson register). NOT country, NOT EDM/drop, NOT hip-hop.
- **Search terms:** Artlist "dark cinematic automotive" / "minimal industrial"; Epidemic "dark cinematic instrumental".
- **Arc:** enter at 0:00, hold under beats 1–7, **fade out starting 0:25.5** (value-line card) to near-silence at the end card.

## 2. Foley (record on iPhone Voice Memos, or license Freesound/Soundsnap)
- **Buckle/latch seat CLICK @ ~0:13** (beat 4) — the single highest-impact sound. Sharp, mechanical, confident.
- **Light rain patter** under beat 2 (0:03–0:07) — gentle, not a storm.
- **Subtle outdoor wind/room ambiance** bed under the exterior beats (1, 5, 6).
- (Optional) tailgate/panel movement under beat 6.

## 3. Ducking cues
- Music full 0:00–0:12 → duck **−6 dB at 0:13** when the buckle click fires → restore by 0:15.
- Music fade to silence 0:25.5 → 0:28; end card plays near-silent (single low reverb tail optional).

## 4. Captions / SRT (required for YouTube; Meta auto-captions are wrong on "tri-fold")
Generate a clean SRT from the on-screen text (value-line card + end card). 30-min task before first media dollar.

## 5. CTA landing + UTM
"SHOP THE TONNEAU COVER" → the PDP, **not** a collection page:
`/products/2016-2023-toyota-tacoma-5ft-bed-hard-tri-fold-tonneau-cover-led?utm_source=youtube&utm_medium=video&utm_campaign=tacoma-tonneau&utm_content=spot-v6`
(Swap `utm_source` per channel.) Consider passing `?bed=5ft` to pre-select the sub-model chip.

## 6. Placement (Marcus)
- **Ready as-is (16:9):** YouTube pre-roll, CTV, PDP-embed (muted autoplay).
- **Needs a 9:16 recut** for Meta Reels / TikTok — do NOT run 16:9 letterboxed. Lead the vertical cut with beat 4 (latch) or beat 2 (rain), then beat 1.
- Primary KPI: YouTube VTR 35%+. Secondary: PDP CVR on video-touched sessions (target 1.4–1.8× baseline).

## 7. PDP fixes BEFORE driving ad traffic (auto-parts findings — trust/return risk)
The ad drives to the Tacoma PDP, which currently:
- Shows **non-Tacoma hero photos** (Frontier/F-150/Tundra) — replace with Tacoma imagery (or the spot's frames).
- Has a **wrong cab filter** ("4-Door only") — the 5 ft bed fits **Access Cab AND Double Cab**; cab type is irrelevant for a bed-rail-clamped cover.
- Claims **"all-weather (snow/rain/wind)"** — qualify: weather-resistant in rain/wind; **not snow-load rated** (add warranty exclusion).
- Missing a **"does not fit 2024+ Tacoma (4th gen)"** exclusion — add it.

## Locked copy (do not change)
- End-card fitment: `fits 2016–2023 Tacoma 5 ft bed · Access or Double Cab · wrong fit, full refund`
- CTA: `SHOP THE TONNEAU COVER` (the only yellow #f5a823 element in the spot)
- Headline: `HARD COVER. LED BED LIGHTING. ONE INSTALL.`
- Do NOT say "2016+", "waterproof", "snow-load", or "Tacoma-specific" (it's a universal clamp-on).

## Build scripts (for re-renders)
`scripts/gen-spot-seeds.ts` (Gemini seeds) · `scripts/kling-generate*.ts` (Kling clips) · `scripts/build-spot-v6.mjs` (assembly: trim/grade/grain/end-card/concat).
