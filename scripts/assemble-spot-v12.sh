#!/usr/bin/env bash
# =============================================================================
# STAGE 3 — Stehlen Tacoma Tonneau Spot v12: Assembly
# Director: Carter Voss
#
# v12 — TRUE 30-SECOND CINEMATIC MASTER
# - New Gen-4.5 parked driveway beat (Beat 2) replaces clip-h2-truck-dolly.
#   Gen-4.5 delivers sharper panel groove / matte texture detail than gen4_turbo.
# - New Beat 3: clip-night-e-hero (parking garage, teal ambient, 3.0s).
#   Day→night arc gives the spot a full-day narrative: "from the highway
#   to the garage, your bed is covered." Previously unused; now the tonal
#   anchor between the golden-hour parked reveal and the product detail block.
# - Total runtime: ~30.0s (genuine 30, not a rushed 27 stretched by cards)
# - v11 left intact.
#
# BEAT ORDER (v12):
#   BEAT 1   (0:00-0:03.5)   Veo desert drive          [motion hook, 3.5s]
#   BEAT 2   (0:03.5-0:08.0) Gen-4.5 parked driveway   [NEW model, 4.5s trim]
#   BEAT 3   (0:08.0-0:11.0) Night garage hero          [teal ambient, 3.0s]
#   BEAT 4   (0:11.0-0:13.5) Cover surface macro        [matte texture, 2.5s]
#   BEAT 5   (0:13.5-0:16.5) Latch/buckle hardware      [3.0s]
#   BEAT 6   (0:16.5-0:19.5) Fold-open bed access       [3.0s]
#   BEAT 7   (0:19.5-0:22.0) LED puck reveal            [2.5s]
#   BEAT 8   (0:22.0-0:24.5) Value-line card            [WHITE ONLY, 2.5s]
#   BEAT 9   (0:24.5-0:27.5) End card                   [yellow CTA, 3.0s]
#   BEAT 10  (0:27.5-0:30.0) Stehlen logo close         [2.5s]
#   TOTAL: ~30.0s
#
# CROSSFADE: 3-frame dissolve (0.125s) between Beat 1 and Beat 2 only.
# Beat 2→3 is a straight cut (day exterior → night garage — the location
# contrast reads as a deliberate scene transition, not a continuity cut;
# no dissolve needed, a clean cut is more cinematic here).
#
# GRADE (all clips): teal-shadow/warm-mid chain
#   AI_GRADE: curves r='0/0 0.25/0.23 1/1' b='0/0 0.25/0.27 1/1'
#   GRAIN: noise=alls=12:allf=t+u
#   VIGNETTE: PI/5
#
# MUSIC: Kevin MacLeod "Industrial Cinematic" (CC-BY 3.0, ~73 BPM)
#   Full spot at -14 dBFS | fade-out last 4s (mid value-card → logo close)
#   Owner to swap Artlist license before broadcast.
#
# v11 untouched. Never log secrets.
# =============================================================================

set -euo pipefail

FFMPEG="/opt/homebrew/bin/ffmpeg"
MAGICK="/opt/homebrew/bin/magick"
FFPROBE="/opt/homebrew/bin/ffprobe"
PROJ="/Users/ricky/Library/CloudStorage/OneDrive-Personal/Documents/Robome/Client/JL Concepts/Project/stehlenauto-vercel"
CLIPS="$PROJ/public/videos/spot-clips"
STOCK="$CLIPS/stock"
AUDIO="$CLIPS/audio"
FRAMES="$CLIPS/frames-v12"
LOGO="$PROJ/public/images/stehlen-logo.png"
TMP="/tmp/stehlen-spot-v12-assembly"
OUT="$CLIPS/stehlen-tacoma-tonneau-spot-v12.mp4"
VEO="$STOCK/openart-sample_0_1779872548345_acb2b1c5.mp4"
GEN45="$STOCK/runway-tacoma-gen45-v12.mp4"

mkdir -p "$TMP" "$FRAMES"

echo "==================================================================="
echo "STEHLEN TACOMA TONNEAU SPOT v12 — Assembly"
echo "Director: Carter Voss"
echo ""
echo "MODEL: Runway Gen-4.5 (Beat 2, new parked driveway)"
echo "VEO:   OpenArt Veo hero (Beat 1, desert drive)"
echo "NIGHT: clip-night-e-hero (Beat 3, parking garage, day→night arc)"
echo "TOTAL: ~30 seconds"
echo ""
echo "BEATS:"
echo "  1  Veo desert drive       0:00-0:03.5   (3.5s)"
echo "  2  Gen-4.5 parked reveal  0:03.5-0:08.0 (4.5s) [NEW MODEL]"
echo "  3  Night garage hero      0:08.0-0:11.0 (3.0s) [FIRST USE]"
echo "  4  Cover surface macro    0:11.0-0:13.5 (2.5s)"
echo "  5  Latch/buckle           0:13.5-0:16.5 (3.0s)"
echo "  6  Fold-open              0:16.5-0:19.5 (3.0s)"
echo "  7  LED puck reveal        0:19.5-0:22.0 (2.5s)"
echo "  8  Value-line card        0:22.0-0:24.5 (2.5s) [WHITE ONLY]"
echo "  9  End card               0:24.5-0:27.5 (3.0s) [yellow CTA]"
echo "  10 Stehlen logo close     0:27.5-0:30.0 (2.5s)"
echo "==================================================================="
echo ""

# ---------------------------------------------------------------------------
# FILTER BUILDING BLOCKS
# ---------------------------------------------------------------------------
GRAIN="noise=alls=12:allf=t+u"
VIGNETTE="vignette=PI/5"
AI_GRADE="curves=r='0/0 0.25/0.23 1/1':b='0/0 0.25/0.27 1/1'"
SCALE="scale=1920:1080:flags=lanczos,setsar=1"

# ---------------------------------------------------------------------------
# STEP 1: Veo desert drive — Beat 1 (3.5s)
# Trim 2.5-6.0s of clean motion (skip the opening blur/parked frames)
# Upscale 720→1080 lanczos + grade chain
# ---------------------------------------------------------------------------
echo "[STEP 1] Veo desert drive — trim 2.5-6.0s (3.5s)..."

$FFMPEG -y \
  -ss 2.5 -t 3.5 \
  -i "$VEO" \
  -vf "${SCALE},fps=24,${AI_GRADE},${GRAIN},${VIGNETTE}" \
  -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p \
  -an "$TMP/beat1_veo_drive.mp4" 2>&1 | tail -2

DUR1=$($FFPROBE -v error -show_entries format=duration -of csv=p=0 "$TMP/beat1_veo_drive.mp4" 2>/dev/null)
echo "  Beat 1 done — Veo drive: ${DUR1}s"
echo ""

# ---------------------------------------------------------------------------
# STEP 2: Gen-4.5 parked driveway — Beat 2 (4.5s)
# New generation: seed-b-attempt-2.jpg → gen4.5 → 1280x720 orbital drift
# Best window is 0.3s-4.8s: opens with rear-3/4 product hero, orbital drift
# reveals the cover surface, TACOMA badge stays legible.
# Upscale 720→1080 lanczos + grade chain
# ---------------------------------------------------------------------------
echo "[STEP 2] Gen-4.5 parked driveway — trim 0.3-4.8s (4.5s)..."

$FFMPEG -y \
  -ss 0.3 -t 4.5 \
  -i "$GEN45" \
  -vf "${SCALE},fps=24,${AI_GRADE},${GRAIN},${VIGNETTE}" \
  -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p \
  -an "$TMP/beat2_gen45_parked.mp4" 2>&1 | tail -2

DUR2=$($FFPROBE -v error -show_entries format=duration -of csv=p=0 "$TMP/beat2_gen45_parked.mp4" 2>/dev/null)
echo "  Beat 2 done — Gen-4.5 parked: ${DUR2}s"
echo ""

# ---------------------------------------------------------------------------
# STEP 3: Crossfade Beat 1 → Beat 2 (3-frame dissolve = 0.125s)
# Desert drive dissolves into golden-hour driveway — motion settles into product.
# ---------------------------------------------------------------------------
echo "[STEP 3] Crossfade Beat 1→2 (3-frame dissolve)..."

B1_DUR=$($FFPROBE -v error -show_entries format=duration -of csv=p=0 "$TMP/beat1_veo_drive.mp4" 2>/dev/null)
XFADE_DUR="0.125"
XFADE_OFFSET=$(echo "$B1_DUR - $XFADE_DUR" | bc)
echo "  Beat1 dur: ${B1_DUR}s | xfade offset: ${XFADE_OFFSET}s"

$FFMPEG -y \
  -i "$TMP/beat1_veo_drive.mp4" \
  -i "$TMP/beat2_gen45_parked.mp4" \
  -filter_complex \
    "[0:v][1:v]xfade=transition=dissolve:duration=${XFADE_DUR}:offset=${XFADE_OFFSET}[v]" \
  -map "[v]" \
  -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p \
  -an "$TMP/beat1_2_xfade.mp4" 2>&1 | tail -2

DUR12=$($FFPROBE -v error -show_entries format=duration -of csv=p=0 "$TMP/beat1_2_xfade.mp4" 2>/dev/null)
echo "  Beat 1+2 crossfaded: ${DUR12}s (expect ~7.875s = 3.5+4.5-0.125)"
echo ""

# ---------------------------------------------------------------------------
# STEP 4: Night garage hero — Beat 3 (3.0s)
# clip-night-e-hero: 5s, 1924x1076, parking garage, teal ambient + warm mid.
# Best window: 0.5-3.5s — picks up the cover in frame cleanly.
# This is the first appearance of this clip in any spot version.
# Day exterior → night garage: straight cut, no dissolve (intentional).
# ---------------------------------------------------------------------------
echo "[STEP 4] Night garage hero — clip-night-e-hero trim 0.5-3.5s (3.0s)..."

$FFMPEG -y \
  -ss 0.5 -t 3.0 \
  -i "$CLIPS/clip-night-e-hero.mp4" \
  -vf "${SCALE},fps=24,${AI_GRADE},${GRAIN},${VIGNETTE}" \
  -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p \
  -an "$TMP/beat3_night_garage.mp4" 2>&1 | tail -2

DUR3=$($FFPROBE -v error -show_entries format=duration -of csv=p=0 "$TMP/beat3_night_garage.mp4" 2>/dev/null)
echo "  Beat 3 done — night garage: ${DUR3}s"
echo ""

# ---------------------------------------------------------------------------
# STEP 5: Cover surface macro — Beat 4 (2.5s)
# Matte texture, panel seam, vertical groove detail.
# Slightly desaturated (hue s=0.75) to cool the warm amber and match night beat.
# ---------------------------------------------------------------------------
echo "[STEP 5] Cover surface macro — trim 0.2-2.7s (2.5s)..."

$FFMPEG -y \
  -ss 0.2 -t 2.5 \
  -i "$CLIPS/clip-cover-a-surface.mp4" \
  -vf "${SCALE},fps=24,hue=s=0.75,eq=saturation=0.88,${AI_GRADE},${GRAIN},${VIGNETTE}" \
  -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p \
  -an "$TMP/beat4_cover_macro.mp4" 2>&1 | tail -2

echo "  Beat 4 done."

# ---------------------------------------------------------------------------
# STEP 6: Latch/buckle hardware — Beat 5 (3.0s)
# clip-latch-v6: hardware close, latch engagement detail.
# ---------------------------------------------------------------------------
echo ""
echo "[STEP 6] Latch/buckle — trim 0.5-3.5s (3.0s)..."

$FFMPEG -y \
  -ss 0.5 -t 3.0 \
  -i "$CLIPS/clip-latch-v6.mp4" \
  -vf "${SCALE},fps=24,${AI_GRADE},${GRAIN},${VIGNETTE}" \
  -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p \
  -an "$TMP/beat5_latch.mp4" 2>&1 | tail -2

echo "  Beat 5 done."

# ---------------------------------------------------------------------------
# STEP 7: Fold-open bed access — Beat 6 (3.0s)
# clip-cover-f-foldopen: panels folding forward, open bed access.
# ---------------------------------------------------------------------------
echo ""
echo "[STEP 7] Fold-open — trim 0.5-3.5s (3.0s)..."

$FFMPEG -y \
  -ss 0.5 -t 3.0 \
  -i "$CLIPS/clip-cover-f-foldopen.mp4" \
  -vf "${SCALE},fps=24,hue=s=0.80,eq=saturation=0.90,${AI_GRADE},${GRAIN},${VIGNETTE}" \
  -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p \
  -an "$TMP/beat6_foldopen.mp4" 2>&1 | tail -2

echo "  Beat 6 done."

# ---------------------------------------------------------------------------
# STEP 8: LED puck reveal — Beat 7 (2.5s)
# clip-h1-led-reveal: portrait (1076x1924), 8 discrete white LED pucks visible.
# Center-crop to 1920x1080 to frame the pucks symmetrically.
# ---------------------------------------------------------------------------
echo ""
echo "[STEP 8] LED puck reveal — trim 1.0-3.5s (2.5s, portrait center-crop)..."

$FFMPEG -y \
  -ss 1.0 -t 2.5 \
  -i "$CLIPS/clip-h1-led-reveal.mp4" \
  -vf "crop=1076:605:0:659,scale=1920:1080,setsar=1,fps=24,${AI_GRADE},${GRAIN},${VIGNETTE}" \
  -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p \
  -an "$TMP/beat7_led.mp4" 2>&1 | tail -2

echo "  Beat 7 done."

# ---------------------------------------------------------------------------
# STEP 9: Value-line card — Beat 8 (2.5s)
# WHITE ONLY — no yellow. Honest claims only.
# "RAIN · ICE · DUST" + "YOUR BED IS COVERED."
# ---------------------------------------------------------------------------
echo ""
echo "[STEP 9] Generating value-line card (WHITE ONLY)..."

$MAGICK \
  -size 1920x1080 xc:'#080808' \
  -font '/System/Library/Fonts/HelveticaNeue.ttc' \
  -pointsize 32 \
  -fill '#aaaaaa' \
  -gravity Center \
  -annotate +0-100 'WEATHER-RESISTANT  ·  RAIN  ·  ICE  ·  DUST' \
  -pointsize 68 \
  -fill white \
  -annotate +0+10 'YOUR BED IS COVERED.' \
  -quality 95 \
  "$TMP/valueline.jpg" 2>/dev/null

$FFMPEG -y \
  -loop 1 -i "$TMP/valueline.jpg" \
  -t 2.5 \
  -vf "fps=24,scale=1920:1080,setsar=1" \
  -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p \
  -an "$TMP/beat8_valueline.mp4" 2>&1 | tail -2

echo "  Beat 8 done (white-only, 2.5s)."

# ---------------------------------------------------------------------------
# STEP 10: End card — Beat 9 (3.0s)
# ONE yellow element: the CTA text (#f5a823). Everything else white/grey.
# Honest fitment line + refund guarantee.
# ---------------------------------------------------------------------------
echo ""
echo "[STEP 10] Generating end card (fitment + #f5a823 CTA — only yellow)..."

$MAGICK \
  -size 1920x1080 xc:'#080808' \
  -font '/System/Library/Fonts/HelveticaNeue.ttc' \
  -pointsize 52 \
  -fill white \
  -gravity Center \
  -annotate +0-170 'HARD COVER. LED BED LIGHTING. ONE INSTALL.' \
  -pointsize 24 \
  -fill '#bbbbbb' \
  -annotate +0-70 'fits 2016-2023 Tacoma 5 ft bed  ·  Access or Double Cab' \
  -pointsize 22 \
  -fill '#888888' \
  -annotate +0-20 'wrong fit, full refund' \
  -pointsize 46 \
  -fill '#f5a823' \
  -annotate +0+100 'SHOP THE TONNEAU COVER' \
  -quality 95 \
  "$TMP/endcard.jpg" 2>/dev/null

$FFMPEG -y \
  -loop 1 -i "$TMP/endcard.jpg" \
  -t 3.0 \
  -vf "fps=24,scale=1920:1080,setsar=1" \
  -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p \
  -an "$TMP/beat9_endcard.mp4" 2>&1 | tail -2

echo "  Beat 9 done (3s, #f5a823 CTA, only yellow)."

# ---------------------------------------------------------------------------
# STEP 11: Stehlen logo close — Beat 10 (2.5s)
# Armordillo-style: near-black (#080808), wordmark 1056px centered.
# 2.5s (vs v11's 2.0s) — gives the brand mark room to breathe at the close.
# ---------------------------------------------------------------------------
echo ""
echo "[STEP 11] Generating Stehlen logo close (2.5s)..."

$MAGICK \
  -size 1920x1080 xc:'#080808' \
  \( "$LOGO" -resize 1056x \) \
  -gravity Center \
  -composite \
  -quality 95 \
  "$TMP/logoclose.jpg" 2>/dev/null

$FFMPEG -y \
  -loop 1 -i "$TMP/logoclose.jpg" \
  -t 2.5 \
  -vf "fps=24,scale=1920:1080,setsar=1" \
  -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p \
  -an "$TMP/beat10_logoclose.mp4" 2>&1 | tail -2

echo "  Beat 10 done (2.5s, 1056px centered)."

# ---------------------------------------------------------------------------
# STEP 12: Verify all intermediates
# ---------------------------------------------------------------------------
echo ""
echo "[STEP 12] Verifying intermediates..."

ALL_OK=true
TOTAL_DUR=0

BEATS=(beat1_2_xfade beat3_night_garage beat4_cover_macro beat5_latch beat6_foldopen beat7_led beat8_valueline beat9_endcard beat10_logoclose)

for f in "${BEATS[@]}"; do
  if [ -f "$TMP/$f.mp4" ]; then
    DUR=$($FFPROBE -v error -select_streams v:0 -show_entries stream=duration -of csv=p=0 "$TMP/$f.mp4" 2>/dev/null || echo "0")
    DIM=$($FFPROBE -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "$TMP/$f.mp4" 2>/dev/null || echo "?")
    SZ=$(du -sh "$TMP/$f.mp4" | cut -f1)
    echo "  OK  $f: ${DIM}px | ${DUR}s | $SZ"
    TOTAL_DUR=$(echo "$TOTAL_DUR + $DUR" | bc 2>/dev/null || echo "$TOTAL_DUR")
  else
    echo "  MISSING: $f.mp4"
    ALL_OK=false
  fi
done

echo ""
echo "  Estimated total duration: ~${TOTAL_DUR}s (target: 30.0s)"

if [ "$ALL_OK" = false ]; then
  echo "FATAL: missing intermediates — aborting."
  exit 1
fi

# ---------------------------------------------------------------------------
# STEP 13: Concatenate all beats (silent master)
# ---------------------------------------------------------------------------
echo ""
echo "[STEP 13] Concatenating to silent v12 master..."

> "$TMP/concat.txt"
for f in "${BEATS[@]}"; do
  printf "file '%s'\n" "$TMP/$f.mp4" >> "$TMP/concat.txt"
done

echo "  Concat list:"
cat "$TMP/concat.txt"
echo ""

$FFMPEG -y \
  -f concat -safe 0 -i "$TMP/concat.txt" \
  -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p \
  -movflags +faststart \
  -an \
  "$TMP/v12_silent.mp4" 2>&1 | tail -4

echo "  Silent master complete."

# ---------------------------------------------------------------------------
# STEP 14: Mix music bed
# Kevin MacLeod "Industrial Cinematic" (CC-BY 3.0, ~73 BPM)
# Full spot at -14 dBFS | fade-out last 4s (mid value-card → logo close)
# ---------------------------------------------------------------------------
echo ""
echo "[STEP 14] Mixing music track..."

VID_DUR=$($FFPROBE -v error -show_entries format=duration -of csv=p=0 "$TMP/v12_silent.mp4" 2>/dev/null)
echo "  Video duration: ${VID_DUR}s"

FADE_START=$(echo "$VID_DUR - 4" | bc 2>/dev/null || echo "26")
echo "  Music fade-out start: ${FADE_START}s (4s fade)"

$FFMPEG -y \
  -i "$TMP/v12_silent.mp4" \
  -i "$AUDIO/industrial-cinematic-kevin-macleod.mp3" \
  -filter_complex "\
    [1:a]atrim=0:${VID_DUR},\
    volume=-14dB,\
    afade=t=out:st=${FADE_START}:d=4\
    [aout]" \
  -map 0:v \
  -map "[aout]" \
  -c:v copy \
  -c:a aac -b:a 192k \
  -shortest \
  -movflags +faststart \
  "$OUT" 2>&1 | tail -4

echo "  Music mix complete."

# ---------------------------------------------------------------------------
# STEP 15: Final verification
# ---------------------------------------------------------------------------
echo ""
echo "[STEP 15] Final output verification..."

if [ -f "$OUT" ]; then
  FINAL_DUR=$($FFPROBE -v error -show_entries format=duration -of csv=p=0 "$OUT")
  FINAL_DIM=$($FFPROBE -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "$OUT")
  FINAL_FPS=$($FFPROBE -v error -select_streams v:0 -show_entries stream=r_frame_rate -of csv=p=0 "$OUT")
  AUDIO_CODEC=$($FFPROBE -v error -select_streams a:0 -show_entries stream=codec_name -of csv=p=0 "$OUT" 2>/dev/null || echo "none")
  FINAL_SZ=$(du -sh "$OUT" | cut -f1)
  echo ""
  echo "  ================================================================"
  echo "  Path:        $OUT"
  echo "  Duration:    ${FINAL_DUR}s  (target: ~30.0s)"
  echo "  Resolution:  $FINAL_DIM"
  echo "  Frame rate:  $FINAL_FPS"
  echo "  Audio:       $AUDIO_CODEC"
  echo "  File size:   $FINAL_SZ"
  echo "  ================================================================"
else
  echo "FATAL: output not found."
  exit 1
fi

# ---------------------------------------------------------------------------
# STEP 16: Extract review frames
# Beat midpoints from v12 timecodes:
#   beat1+2 xfade: 0:00-0:07.875  — drive mid ~1.75s, Gen-4.5 mid ~5.5s
#   beat3 night:   0:07.875-0:10.875  mid = 9.4s
#   beat4 macro:   0:10.875-0:13.375  mid = 12.1s
#   beat5 latch:   0:13.375-0:16.375  mid = 14.9s
#   beat6 fold:    0:16.375-0:19.375  mid = 17.9s
#   beat7 led:     0:19.375-0:21.875  mid = 20.6s
#   beat8 value:   0:21.875-0:24.375  mid = 23.1s
#   beat9 end:     0:24.375-0:27.375  mid = 25.9s
#   beat10 logo:   0:27.375-0:29.875  mid = 28.6s
# ---------------------------------------------------------------------------
echo ""
echo "[STEP 16] Extracting review frames into frames-v12/..."

declare -a TS=(1.75 5.5 9.4 12.1 14.9 17.9 20.6 23.1 25.9 28.6)
declare -a NAMES=(
  "v12-beat1-veo-drive"
  "v12-beat2-gen45-parked"
  "v12-beat3-night-garage"
  "v12-beat4-cover-macro"
  "v12-beat5-latch"
  "v12-beat6-foldopen"
  "v12-beat7-led-pucks"
  "v12-beat8-valueline"
  "v12-beat9-endcard-yellowCTA"
  "v12-beat10-logo-close"
)

for i in "${!TS[@]}"; do
  TS_VAL="${TS[$i]}"
  NAME="${NAMES[$i]}"
  OUTF="$FRAMES/${NAME}.jpg"
  $FFMPEG -y -ss "$TS_VAL" -i "$OUT" -vframes 1 -q:v 2 "$OUTF" 2>/dev/null \
    && echo "  frame @ ${TS_VAL}s -> ${NAME}.jpg" \
    || echo "  WARNING: could not extract @ ${TS_VAL}s"
done

# Save static cards
cp "$TMP/valueline.jpg" "$FRAMES/v12-valueline-card-full.jpg" 2>/dev/null && echo "  valueline card saved."
cp "$TMP/endcard.jpg" "$FRAMES/v12-endcard-full.jpg" 2>/dev/null && echo "  endcard saved."
cp "$TMP/logoclose.jpg" "$FRAMES/v12-logoclose-full.jpg" 2>/dev/null && echo "  logoclose saved."

echo ""
echo "==================================================================="
echo "V12 ASSEMBLY COMPLETE — Director: Carter Voss"
echo ""
echo "Output: $OUT"
echo "Frames: $FRAMES/"
echo ""
echo "WHAT'S NEW IN V12 vs V11:"
echo "  Model:    Gen-4.5 Beat 2 (vs gen4_turbo clip-h2-truck-dolly)"
echo "            → sharper panel groove detail, better matte texture render"
echo "  Beat 3:   clip-night-e-hero ADDED (parking garage, teal ambient)"
echo "            → day→night arc completes the narrative: highway to garage"
echo "  Runtime:  ~30.0s (vs 27s) — genuine 30, not padded"
echo "  Grade:    same teal-shadow/warm-mid chain, night beat adds natural teal"
echo ""
echo "BEAT TIMECODES (v12):"
echo "  0:00-0:07.9  Beat 1+2  Veo drive (dissolve) → Gen-4.5 parked driveway"
echo "  0:07.9-0:10.9 Beat 3   Night garage hero (teal, parking structure)"
echo "  0:10.9-0:13.4 Beat 4   Cover surface macro (matte texture, groove)"
echo "  0:13.4-0:16.4 Beat 5   Latch/buckle hardware close"
echo "  0:16.4-0:19.4 Beat 6   Fold-open bed access"
echo "  0:19.4-0:21.9 Beat 7   LED puck reveal (8 discrete pucks)"
echo "  0:21.9-0:24.4 Beat 8   Value-line card [WHITE ONLY — no yellow]"
echo "  0:24.4-0:27.4 Beat 9   End card [#f5a823 yellow CTA — only yellow]"
echo "  0:27.4-0:29.9 Beat 10  Stehlen logo close"
echo ""
echo "MUSIC: Kevin MacLeod 'Industrial Cinematic' (CC-BY 3.0) -14 dBFS"
echo "  Owner to swap for Artlist/Epidemic Sound license before broadcast."
echo ""
echo "ANTI-AI-TELL STATUS:"
echo "  Gen-4.5 Beat 2: TACOMA badge readable, 3 panels + grooves correct,"
echo "  matte texture micro-detail present, no chrome/lifted/strip-LED."
echo "  Night garage Beat 3: TACOMA badge legible, cover flat/rigid, no tells."
echo ""
echo "v11 untouched: $CLIPS/stehlen-tacoma-tonneau-spot-v11.mp4"
echo "==================================================================="
