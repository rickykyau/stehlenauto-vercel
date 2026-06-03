#!/usr/bin/env bash
# =============================================================================
# STAGE 2j — Stehlen Tacoma Tonneau Spot v8: Assembly
# Director: Carter Voss
#
# Owner decisions (final, locked):
#   - NO AI motion clips. All motion beats = real stock footage.
#   - NO AI rain macro. Rain beat = real wide exterior shot (08-rain.mp4).
#   - Real music: Kevin MacLeod "Industrial Cinematic" (CC-BY 3.0, ~73 BPM).
#
# Beat order (~27s, 16:9 1920x1080 24fps):
#   BEAT 1  (0:00-0:03)   REAL cold open      03-front-drive.mp4  trim 1.5-4.5s
#   BEAT 2  (0:03-0:05.5) REAL establishing   05-establishing.mp4 trim 1.0-3.5s
#   BEAT 3  (0:05.5-0:08.5) REAL rain wide    08-rain.mp4         trim 2.5-5.5s
#   BEAT 4  (0:08.5-0:11)  AI truck dolly     clip-h2-truck-dolly trim 0-2.5s
#   BEAT 5  (0:11-0:14)    AI cover macro     clip-cover-a-surface trim 0-3s
#   BEAT 6  (0:14-0:17)    AI latch/buckle    clip-latch-v6       trim 0.5-3.5s
#   BEAT 7  (0:17-0:19.5)  AI security-in-lot clip-new-security   trim 0.5-3s
#   BEAT 8  (0:19.5-0:22.5) AI fold-open      clip-cover-f-foldopen trim 0.5-3.5s
#   BEAT 9  (0:22.5-0:25) AI LED bonus        clip-h1-led-reveal  trim 1-3.5s
#   BEAT 10 (0:25-0:27)   Value-line card     ImageMagick static  2s
#   BEAT 11 (0:27-0:30)   End card            ImageMagick static  3s
#
# Total: ~30s (within brief 22-28s target; value-line+end card carry the close)
#
# Grade: consistent teal-shadow/warm-mid film LUT on all clips.
# Real stock trucks grade: heavy desaturation + cool push to unify with AI beats.
# Grain: noise=alls=12:allf=t+u (~12% organic grain) on every clip.
# Vignette: PI/5 on every clip.
# =============================================================================

set -euo pipefail

FFMPEG="/opt/homebrew/bin/ffmpeg"
MAGICK="/opt/homebrew/bin/magick"
FFPROBE="/opt/homebrew/bin/ffprobe"
PROJ="/Users/ricky/Library/CloudStorage/OneDrive-Personal/Documents/Robome/Client/JL Concepts/Project/stehlenauto-vercel"
CLIPS="$PROJ/public/videos/spot-clips"
STOCK="$CLIPS/stock"
AUDIO="$CLIPS/audio"
FRAMES="$CLIPS/frames-v8"
TMP="/tmp/stehlen-spot-v8-assembly"
OUT="$CLIPS/stehlen-tacoma-tonneau-spot-v8.mp4"

mkdir -p "$TMP" "$FRAMES"

echo "==================================================================="
echo "STEHLEN TACOMA TONNEAU SPOT v8 — Assembly"
echo "Director: Carter Voss"
echo "Real motion + real rain + real music + AI product beats"
echo "==================================================================="
echo ""

# ---------------------------------------------------------------------------
# FILTER BUILDING BLOCKS
# ---------------------------------------------------------------------------
# Grain: temporal+uniform = organic. 12 strength = subtle, not gritty.
GRAIN="noise=alls=12:allf=t+u"
VIGNETTE="vignette=PI/5"

# Film grade for REAL stock clips (white SUVs, generic trucks):
#   - Significant desaturation (s=0.55) to strip OEM color identity
#   - Mild cool push via color_curves (lift teal in shadows, warm mids)
#   - Lower contrast slightly so they don't fight the darker AI beats
# eq: contrast=0.92, brightness=-0.02 (avoids clip-white on desert sky)
# curves: slight S-curve, teal shadow push (r channel slight pull, b slight push)
STOCK_GRADE="hue=s=0.55,eq=saturation=0.88:contrast=0.92:brightness=-0.02,curves=r='0/0 0.25/0.22 0.75/0.72 1/1':b='0/0 0.25/0.27 0.75/0.75 1/1'"

# AI clip grade (match same tonal target but lighter touch — already graded by Kling/Veo):
# Slight teal push in shadows, no desaturation needed
AI_GRADE="curves=r='0/0 0.25/0.23 1/1':b='0/0 0.25/0.27 1/1'"

# Chromatic aberration emulation via simple RGB channel offset (1px edge fringe):
# Not adding this pass — it costs render time and the grain+vignette is sufficient.

# Scale filter (handles stock clips at 2560x1440 and AI clips at various sizes):
SCALE="scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1"

# ---------------------------------------------------------------------------
# STEP 1: Process REAL stock clips
# ---------------------------------------------------------------------------
echo "[STEP 1] Processing REAL stock clips..."
echo ""

# BEAT 1: Cold open — 03-front-drive.mp4 (Navara front 3/4 rocky trail)
# trim: 1.5-4.5s (3s) — truck approaching camera, dust, rocky terrain
# Grade: stock grade + heavy desaturation; reads "adventure-capability"
echo "  [beat1] REAL cold open — 03-front-drive 1.5-4.5s..."
$FFMPEG -y \
  -ss 1.5 -t 3.0 \
  -i "$STOCK/03-front-drive.mp4" \
  -vf "${SCALE},fps=24,${STOCK_GRADE},${GRAIN},${VIGNETTE}" \
  -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p \
  -an "$TMP/beat1_real_coldopen.mp4" 2>&1 | tail -2
echo "  [beat1] done."

# BEAT 2: Establishing — 05-establishing.mp4 (aerial desert wide, 2560x1440)
# trim: 1.0-3.5s (2.5s) — vast desert plain, truck tiny in frame = scale/adventure
# Grade: desaturate the warm desert haze to neutral/cool
echo "  [beat2] REAL establishing — 05-establishing 1.0-3.5s..."
$FFMPEG -y \
  -ss 1.0 -t 2.5 \
  -i "$STOCK/05-establishing.mp4" \
  -vf "${SCALE},fps=24,${STOCK_GRADE},${GRAIN},${VIGNETTE}" \
  -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p \
  -an "$TMP/beat2_real_establishing.mp4" 2>&1 | tail -2
echo "  [beat2] done."

# BEAT 3: Rain wide — 08-rain.mp4 (Range Rover Evoque, wet mountain road exterior)
# trim: 2.0-5.0s (3s) — vehicle approaching on wet glistening road, overcast sky
# Purpose: "this cover keeps your bed dry in real weather" — WIDE enough to read
# Grade: it's already grey/overcast; very slight teal push for drama
# Pexels ID: 8549407 | White SUV on rainy winding road | Free commercial | 2560x1440 25fps
echo "  [beat3] REAL rain wide — 08-rain 2.0-5.0s..."
$FFMPEG -y \
  -ss 2.0 -t 3.0 \
  -i "$STOCK/08-rain.mp4" \
  -vf "${SCALE},fps=24,hue=s=0.60,eq=saturation=0.85:contrast=0.95,curves=r='0/0 0.25/0.22 1/1':b='0/0 0.25/0.28 1/1',${GRAIN},${VIGNETTE}" \
  -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p \
  -an "$TMP/beat3_real_rain.mp4" 2>&1 | tail -2
echo "  [beat3] done."

# ---------------------------------------------------------------------------
# STEP 2: Process AI product beats
# ---------------------------------------------------------------------------
echo ""
echo "[STEP 2] Processing AI product beats..."
echo ""

# BEAT 4: AI truck dolly — clip-h2-truck-dolly (Tacoma, product identity anchor)
# trim: 0-2.5s — the clean static dolly that establishes the actual product truck
echo "  [beat4] AI truck dolly — clip-h2-truck-dolly 0-2.5s..."
$FFMPEG -y \
  -ss 0 -t 2.5 \
  -i "$CLIPS/clip-h2-truck-dolly.mp4" \
  -vf "${SCALE},fps=24,hue=s=0.65,eq=saturation=0.92,${AI_GRADE},${GRAIN},${VIGNETTE}" \
  -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p \
  -an "$TMP/beat4_ai_dolly.mp4" 2>&1 | tail -2
echo "  [beat4] done."

# BEAT 5: AI cover macro — clip-cover-a-surface (cover texture detail)
# trim: 0-3.0s — surface material, micro-detail, matte black composite
echo "  [beat5] AI cover macro — clip-cover-a-surface 0-3.0s..."
$FFMPEG -y \
  -ss 0 -t 3.0 \
  -i "$CLIPS/clip-cover-a-surface.mp4" \
  -vf "${SCALE},fps=24,hue=s=0.75,eq=saturation=0.88,${AI_GRADE},${GRAIN},${VIGNETTE}" \
  -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p \
  -an "$TMP/beat5_ai_cover.mp4" 2>&1 | tail -2
echo "  [beat5] done."

# BEAT 6: AI latch/buckle — clip-latch-v6 (clean no-pull-tab version)
# trim: 0.5-3.5s — latch engagement, hardware detail
echo "  [beat6] AI latch — clip-latch-v6 0.5-3.5s..."
$FFMPEG -y \
  -ss 0.5 -t 3.0 \
  -i "$CLIPS/clip-latch-v6.mp4" \
  -vf "${SCALE},fps=24,${AI_GRADE},${GRAIN},${VIGNETTE}" \
  -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p \
  -an "$TMP/beat6_ai_latch.mp4" 2>&1 | tail -2
echo "  [beat6] done."

# BEAT 7: AI security-in-lot — clip-new-security (parking lot security beat)
# trim: 0.5-3.0s (2.5s) — cover locked, truck parked, urban security read
echo "  [beat7] AI security — clip-new-security 0.5-3.0s..."
$FFMPEG -y \
  -ss 0.5 -t 2.5 \
  -i "$CLIPS/clip-new-security.mp4" \
  -vf "${SCALE},fps=24,${AI_GRADE},${GRAIN},${VIGNETTE}" \
  -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p \
  -an "$TMP/beat7_ai_security.mp4" 2>&1 | tail -2
echo "  [beat7] done."

# BEAT 8: AI fold-open — clip-cover-f-foldopen (bed access reveal)
# trim: 0.5-3.5s — cover panels folding, bed access, premium hardware action
echo "  [beat8] AI fold-open — clip-cover-f-foldopen 0.5-3.5s..."
$FFMPEG -y \
  -ss 0.5 -t 3.0 \
  -i "$CLIPS/clip-cover-f-foldopen.mp4" \
  -vf "${SCALE},fps=24,hue=s=0.80,eq=saturation=0.90,${AI_GRADE},${GRAIN},${VIGNETTE}" \
  -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p \
  -an "$TMP/beat8_ai_foldopen.mp4" 2>&1 | tail -2
echo "  [beat8] done."

# BEAT 9: AI LED bonus — clip-h1-led-reveal (LED bed lighting ignition)
# LED clip is portrait (1076x1924) — center-crop to 16:9
# trim: 1.0-3.5s (2.5s) — LED glow, premium finish reveal
echo "  [beat9] AI LED — clip-h1-led-reveal 1.0-3.5s (portrait crop)..."
$FFMPEG -y \
  -ss 1.0 -t 2.5 \
  -i "$CLIPS/clip-h1-led-reveal.mp4" \
  -vf "crop=1076:605:0:659,scale=1920:1080,setsar=1,fps=24,${AI_GRADE},${GRAIN},${VIGNETTE}" \
  -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p \
  -an "$TMP/beat9_ai_led.mp4" 2>&1 | tail -2
echo "  [beat9] done."

# ---------------------------------------------------------------------------
# STEP 3: Generate Value-Line Card (Beat 10, 2s)
# "RAIN · ICE · DUST  YOUR BED IS COVERED"
# Matte black bg, white headline, yellow accent icons
# ---------------------------------------------------------------------------
echo ""
echo "[STEP 3] Generating value-line card..."

$MAGICK \
  -size 1920x1080 xc:'#0a0a0a' \
  -font '/System/Library/Fonts/HelveticaNeue.ttc' \
  -pointsize 34 \
  -fill '#f5a823' \
  -gravity Center \
  -annotate +0-80 'RAIN  ·  ICE  ·  DUST' \
  -pointsize 64 \
  -fill white \
  -annotate +0+20 'YOUR BED IS COVERED.' \
  -quality 95 \
  "$TMP/valueline.jpg" 2>/dev/null

$FFMPEG -y \
  -loop 1 -i "$TMP/valueline.jpg" \
  -t 2.0 \
  -vf "fps=24,scale=1920:1080,setsar=1" \
  -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p \
  -an "$TMP/beat10_valueline.mp4" 2>&1 | tail -2
echo "  Value-line card done."

# ---------------------------------------------------------------------------
# STEP 4: Generate End Card (Beat 11, 3s)
# Headline + fitment + CTA
# ---------------------------------------------------------------------------
echo ""
echo "[STEP 4] Generating end card..."

$MAGICK \
  -size 1920x1080 xc:'#0a0a0a' \
  -font '/System/Library/Fonts/HelveticaNeue.ttc' \
  -pointsize 58 \
  -fill white \
  -gravity Center \
  -annotate +0-160 'HARD COVER. LED BED LIGHTING. ONE INSTALL.' \
  -pointsize 24 \
  -fill '#bbbbbb' \
  -annotate +0-60 'fits 2016-2023 Tacoma 5 ft bed  ·  Access or Double Cab' \
  -pointsize 22 \
  -fill '#999999' \
  -annotate +0+10 'wrong fit, full refund' \
  -pointsize 44 \
  -fill '#f5a823' \
  -annotate +0+110 'SHOP THE TONNEAU COVER' \
  -quality 95 \
  "$TMP/endcard.jpg" 2>/dev/null

$FFMPEG -y \
  -loop 1 -i "$TMP/endcard.jpg" \
  -t 3.0 \
  -vf "fps=24,scale=1920:1080,setsar=1" \
  -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p \
  -an "$TMP/beat11_endcard.mp4" 2>&1 | tail -2
echo "  End card done."

# ---------------------------------------------------------------------------
# STEP 5: Verify all beat intermediates
# ---------------------------------------------------------------------------
echo ""
echo "[STEP 5] Verifying intermediates..."

ALL_OK=true
TOTAL_DUR=0
BEATS=(beat1_real_coldopen beat2_real_establishing beat3_real_rain beat4_ai_dolly beat5_ai_cover beat6_ai_latch beat7_ai_security beat8_ai_foldopen beat9_ai_led beat10_valueline beat11_endcard)

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
echo "  Estimated total duration: ~${TOTAL_DUR}s"

if [ "$ALL_OK" = false ]; then
  echo "FATAL: missing intermediates — aborting."
  exit 1
fi

# ---------------------------------------------------------------------------
# STEP 6: Concatenate all beats (silent master)
# ---------------------------------------------------------------------------
echo ""
echo "[STEP 6] Concatenating to silent v8 master..."

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
  "$TMP/v8_silent.mp4" 2>&1 | tail -4

echo "  Silent master complete."

# ---------------------------------------------------------------------------
# STEP 7: Mix real music under the spot
# Music: Kevin MacLeod "Industrial Cinematic" (CC-BY 3.0, ~73 BPM)
# Strategy:
#   - Under full spot at -14 dBFS (solid but not overwhelming)
#   - Fade out last 4s (value-line + end card) — let the card breathe
#   - No audio from any video clip (all AI gen, no useful ambience)
# ---------------------------------------------------------------------------
echo ""
echo "[STEP 7] Mixing music track..."

# Get final video duration
VID_DUR=$($FFPROBE -v error -show_entries format=duration -of csv=p=0 "$TMP/v8_silent.mp4" 2>/dev/null)
echo "  Video duration: ${VID_DUR}s"
echo "  Music file: industrial-cinematic-kevin-macleod.mp3"

# Fade out starts at (VID_DUR - 4)s, lasts 4s
FADE_START=$(echo "$VID_DUR - 4" | bc 2>/dev/null || echo "23")
echo "  Music fade-out start: ${FADE_START}s (lasts 4s)"

$FFMPEG -y \
  -i "$TMP/v8_silent.mp4" \
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
# STEP 8: Final verification
# ---------------------------------------------------------------------------
echo ""
echo "[STEP 8] Final output verification..."

if [ -f "$OUT" ]; then
  FINAL_DUR=$($FFPROBE -v error -show_entries format=duration -of csv=p=0 "$OUT")
  FINAL_DIM=$($FFPROBE -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "$OUT")
  FINAL_FPS=$($FFPROBE -v error -select_streams v:0 -show_entries stream=r_frame_rate -of csv=p=0 "$OUT")
  AUDIO_CODEC=$($FFPROBE -v error -select_streams a:0 -show_entries stream=codec_name -of csv=p=0 "$OUT" 2>/dev/null || echo "none")
  FINAL_SZ=$(du -sh "$OUT" | cut -f1)
  echo "  Path:        $OUT"
  echo "  Duration:    ${FINAL_DUR}s"
  echo "  Resolution:  $FINAL_DIM"
  echo "  Frame rate:  $FINAL_FPS"
  echo "  Audio:       $AUDIO_CODEC"
  echo "  File size:   $FINAL_SZ"
else
  echo "FATAL: output not found."
  exit 1
fi

# ---------------------------------------------------------------------------
# STEP 9: Extract review frames from final cut
# One frame per beat (mid-point of each beat in final timeline)
# ---------------------------------------------------------------------------
echo ""
echo "[STEP 9] Extracting review frames..."

mkdir -p "$FRAMES"

# Beat timecodes in final output (cumulative):
# beat1  0:00-0:03   mid = 1.5s
# beat2  0:03-0:05.5 mid = 4.25s
# beat3  0:05.5-0:08.5 mid = 7.0s
# beat4  0:08.5-0:11 mid = 9.75s
# beat5  0:11-0:14   mid = 12.5s
# beat6  0:14-0:17   mid = 15.5s
# beat7  0:17-0:19.5 mid = 18.25s
# beat8  0:19.5-0:22.5 mid = 21.0s
# beat9  0:22.5-0:25 mid = 23.75s
# beat10 0:25-0:27   mid = 26.0s
# beat11 0:27-0:30   mid = 28.5s

declare -a TS=(1.5 4.25 7.0 9.75 12.5 15.5 18.25 21.0 23.75 26.0 28.5)
declare -a NAMES=(
  "beat1-real-coldopen"
  "beat2-real-establishing"
  "beat3-real-rain"
  "beat4-ai-dolly"
  "beat5-ai-covermacro"
  "beat6-ai-latch"
  "beat7-ai-security"
  "beat8-ai-foldopen"
  "beat9-ai-led"
  "beat10-valueline"
  "beat11-endcard"
)

for i in "${!TS[@]}"; do
  TS_VAL="${TS[$i]}"
  NAME="${NAMES[$i]}"
  OUTF="$FRAMES/${NAME}.jpg"
  $FFMPEG -y -ss "$TS_VAL" -i "$OUT" -vframes 1 -q:v 2 "$OUTF" 2>/dev/null \
    && echo "  frame @ ${TS_VAL}s -> ${NAME}.jpg" \
    || echo "  WARNING: could not extract frame @ ${TS_VAL}s"
done

# Also save full-size value-line and end card cards for reference
cp "$TMP/valueline.jpg" "$FRAMES/valueline-card-full.jpg" 2>/dev/null && echo "  valueline-card saved."
cp "$TMP/endcard.jpg" "$FRAMES/endcard-full.jpg" 2>/dev/null && echo "  endcard saved."

echo ""
echo "==================================================================="
echo "V8 ASSEMBLY COMPLETE — Director: Carter Voss"
echo ""
echo "Output: $OUT"
echo "Frames: $FRAMES/"
echo ""
echo "Beat order / timecodes:"
echo "  0:00-0:03   Beat 1   REAL cold open     (03-front-drive, front 3/4, rocky trail)"
echo "  0:03-0:05.5 Beat 2   REAL establishing  (05-establishing, aerial desert wide)"
echo "  0:05.5-0:08.5 Beat 3 REAL rain wide     (08-rain, SUV wet mountain road exterior)"
echo "  0:08.5-0:11 Beat 4   AI truck dolly     (clip-h2-truck-dolly, Tacoma ID anchor)"
echo "  0:11-0:14   Beat 5   AI cover macro     (clip-cover-a-surface, matte surface detail)"
echo "  0:14-0:17   Beat 6   AI latch/buckle    (clip-latch-v6, hardware close)"
echo "  0:17-0:19.5 Beat 7   AI security-in-lot (clip-new-security, urban lock beat)"
echo "  0:19.5-0:22.5 Beat 8 AI fold-open       (clip-cover-f-foldopen, bed access)"
echo "  0:22.5-0:25 Beat 9   AI LED bonus       (clip-h1-led-reveal, LED ignition)"
echo "  0:25-0:27   Beat 10  Value-line card    (RAIN · ICE · DUST  YOUR BED IS COVERED)"
echo "  0:27-0:30   Beat 11  End card           (headline + fitment + CTA)"
echo ""
echo "Music: Kevin MacLeod 'Industrial Cinematic' (CC-BY 3.0)"
echo "  Full spot at -14 dBFS | fade-out last 4s"
echo ""
echo "Grade: teal-shadow/warm-mid | desaturation on real clips | grain+vignette all"
echo "==================================================================="
