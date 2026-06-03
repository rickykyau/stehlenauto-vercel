#!/usr/bin/env bash
# =============================================================================
# STAGE 2M — Stehlen Tacoma Tonneau Spot v11: Assembly
# Director: Carter Voss
#
# THE FIX (v11 vs v10): one-directional energy arc, no sandwiching.
#
# v10 FLAW: opened with Veo (parked 0.9s + drive 5.6s joined), then descended
# into product beats — but the parked driveway moment at the TOP created a
# "still → moving → still" perception because the product beats that followed
# were all parked/static. Viewer felt: parked → desert → parked = bounce.
#
# v11 FIX: lead with MOTION ONLY, then a SINGLE deliberate parked reveal,
# then the product block descends and never returns to a full vehicle shot.
# The energy arc is strictly one-directional: motion → settle → product detail.
#
# VEO SEGMENT (drive-only, no parked):
#   Raw Veo clip: 8s, 1280x720, 24fps
#   Kill zone (blur): 0.0s-2.4s (parked driveway + camera-swing blur)
#   Clean drive: 2.5s-7.8s (desert highway, mesas, matte cover, motion blur)
#   v11 uses: 2.5s-6.0s = 3.5s ONLY (punchy cold-open motion hook)
#   No parked Veo frame appears in this spot at all.
#
# PARKED REVEAL (h2-truck-dolly):
#   clip-h2-truck-dolly.mp4: 5s, 1948x1064, 24fps
#   Golden-hour suburban driveway, Tacoma rear 3/4, tri-fold cover flat.
#   Beautiful product-on-truck identity shot. Trim: 0.5s-3.0s = 2.5s.
#   This is the ONE parked/settle moment. It follows the desert drive —
#   motion → arrive → here's the product. After this: pure product detail.
#
# CROSSFADE: 3-frame dissolve between desert-drive and parked-reveal
#   (desert heat → suburban driveway — contrast is intentional, crossfade
#    softens the location jump and reads as "arrived home")
#
# Beat order (~27s, 1920x1080, 24fps, grain+vignette, music throughout):
#   BEAT 1  (0:00-0:03.5)  DESERT DRIVE      veo drive-only (2.5-6.0s)   3.5s
#   BEAT 2  (0:03.5-0:06.0) PARKED REVEAL    clip-h2-truck-dolly (0.5-3.0s) 2.5s
#   BEAT 3  (0:06.0-0:08.5) Cover macro      clip-cover-a-surface (0.2-2.7s) 2.5s
#   BEAT 4  (0:08.5-0:11.5) Latch/buckle     clip-latch-v6 (0.5-3.5s)    3.0s
#   BEAT 5  (0:11.5-0:14.5) Fold-open        clip-cover-f-foldopen (0.5-3.5s) 3.0s
#   BEAT 6  (0:14.5-0:17.0) LED bed          clip-h1-led-reveal (1.0-3.5s) 2.5s
#   BEAT 7  (0:17.0-0:19.5) Security lot     clip-new-security (0-2.5s)   2.5s
#   BEAT 8  (0:19.5-0:22.0) Value-line card  ImageMagick static           2.5s [WHITE ONLY]
#   BEAT 9  (0:22.0-0:25.0) End card         ImageMagick static           3.0s [yellow CTA only]
#   BEAT 10 (0:25.0-0:27.0) Logo close       ImageMagick static           2.0s [Armordillo-style]
#
# Total: ~27s
#
# Grade: teal-shadow/warm-mid film chain on all video clips.
# Grain: noise=alls=12:allf=t+u on every clip.
# Vignette: PI/5 on every clip.
# Music: Kevin MacLeod "Industrial Cinematic" (CC-BY 3.0, ~73 BPM)
#         full spot -14 dBFS | fade-out last 4s over value-line → logo close
#
# v10 left intact. Never log secrets.
# =============================================================================

set -euo pipefail

FFMPEG="/opt/homebrew/bin/ffmpeg"
MAGICK="/opt/homebrew/bin/magick"
FFPROBE="/opt/homebrew/bin/ffprobe"
PROJ="/Users/ricky/Library/CloudStorage/OneDrive-Personal/Documents/Robome/Client/JL Concepts/Project/stehlenauto-vercel"
CLIPS="$PROJ/public/videos/spot-clips"
STOCK="$CLIPS/stock"
AUDIO="$CLIPS/audio"
FRAMES="$CLIPS/frames-v11"
LOGO="$PROJ/public/images/stehlen-logo.png"
TMP="/tmp/stehlen-spot-v11-assembly"
OUT="$CLIPS/stehlen-tacoma-tonneau-spot-v11.mp4"
VEO="$STOCK/openart-sample_0_1779872548345_acb2b1c5.mp4"

mkdir -p "$TMP" "$FRAMES"

echo "==================================================================="
echo "STEHLEN TACOMA TONNEAU SPOT v11 — Assembly"
echo "Director: Carter Voss"
echo ""
echo "FIX: one-directional energy arc — motion leads once, single parked"
echo "reveal, product block descends. No bounce back to motion."
echo ""
echo "BEAT 1:  Veo desert drive ONLY (2.5-6.0s trim, 3.5s) — motion hook"
echo "BEAT 2:  h2-truck-dolly parked reveal (0.5-3.0s, 2.5s) — settle"
echo "BEATS 3-7: product feature block, no vehicle motion shots"
echo "BEATS 8-10: cards + logo"
echo "v10 left intact."
echo "==================================================================="
echo ""

# ---------------------------------------------------------------------------
# FILTER BUILDING BLOCKS (identical to v10)
# ---------------------------------------------------------------------------
GRAIN="noise=alls=12:allf=t+u"
VIGNETTE="vignette=PI/5"
AI_GRADE="curves=r='0/0 0.25/0.23 1/1':b='0/0 0.25/0.27 1/1'"
SCALE="scale=1920:1080:flags=lanczos,setsar=1"

# ---------------------------------------------------------------------------
# STEP 1: Process Veo drive-only segment (Beat 1)
# Trim 2.5s-6.0s = 3.5s of clean desert highway motion.
# No parked moment. Starts directly in motion.
# Upscale 720→1080 (lanczos) + AI_GRADE + GRAIN + VIGNETTE + no audio.
# ---------------------------------------------------------------------------
echo "[STEP 1] Processing Veo desert drive (trim 2.5-6.0s, 3.5s)..."

$FFMPEG -y \
  -ss 2.5 -t 3.5 \
  -i "$VEO" \
  -vf "${SCALE},fps=24,${AI_GRADE},${GRAIN},${VIGNETTE}" \
  -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p \
  -an "$TMP/beat1_veo_drive.mp4" 2>&1 | tail -2

DUR1=$($FFPROBE -v error -show_entries format=duration -of csv=p=0 "$TMP/beat1_veo_drive.mp4" 2>/dev/null || echo "?")
echo "  Beat 1 done — Veo drive: ${DUR1}s"
echo ""

# ---------------------------------------------------------------------------
# STEP 2: Process parked reveal — clip-h2-truck-dolly (Beat 2)
# Trim 0.5-3.0s = 2.5s. Golden-hour suburban driveway, Tacoma rear 3/4.
# Native 1948x1064 — scale down to 1920x1080 (already near 1080p, clean).
# Same grade chain as all other clips for visual world unity.
# ---------------------------------------------------------------------------
echo "[STEP 2] Processing parked reveal — h2-truck-dolly (trim 0.5-3.0s, 2.5s)..."

$FFMPEG -y \
  -ss 0.5 -t 2.5 \
  -i "$CLIPS/clip-h2-truck-dolly.mp4" \
  -vf "${SCALE},fps=24,${AI_GRADE},${GRAIN},${VIGNETTE}" \
  -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p \
  -an "$TMP/beat2_parked_reveal.mp4" 2>&1 | tail -2

DUR2=$($FFPROBE -v error -show_entries format=duration -of csv=p=0 "$TMP/beat2_parked_reveal.mp4" 2>/dev/null || echo "?")
echo "  Beat 2 done — parked reveal: ${DUR2}s"
echo ""

# ---------------------------------------------------------------------------
# STEP 3: Build crossfade between Beat 1 and Beat 2
# 3-frame dissolve (at 24fps = 0.125s) between desert-drive and parked-reveal.
# Method: xfade filter in ffmpeg — dissolve over 0.125s offset at end of beat1.
# ---------------------------------------------------------------------------
echo "[STEP 3] Building crossfade (3-frame dissolve) between drive and parked reveal..."

# Get beat1 duration for xfade offset calculation
B1_DUR=$($FFPROBE -v error -show_entries format=duration -of csv=p=0 "$TMP/beat1_veo_drive.mp4" 2>/dev/null)
# xfade offset = beat1_duration - crossfade_duration
# crossfade = 3 frames at 24fps = 3/24 = 0.125s
XFADE_DUR="0.125"
XFADE_OFFSET=$(echo "$B1_DUR - $XFADE_DUR" | bc)
echo "  Beat1 duration: ${B1_DUR}s | xfade offset: ${XFADE_OFFSET}s | xfade duration: ${XFADE_DUR}s"

$FFMPEG -y \
  -i "$TMP/beat1_veo_drive.mp4" \
  -i "$TMP/beat2_parked_reveal.mp4" \
  -filter_complex \
    "[0:v][1:v]xfade=transition=dissolve:duration=${XFADE_DUR}:offset=${XFADE_OFFSET}[v]" \
  -map "[v]" \
  -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p \
  -an "$TMP/beat1_2_xfade.mp4" 2>&1 | tail -2

DUR12=$($FFPROBE -v error -show_entries format=duration -of csv=p=0 "$TMP/beat1_2_xfade.mp4" 2>/dev/null || echo "?")
echo "  Beat 1+2 crossfaded: ${DUR12}s (expect ~5.875s = 3.5+2.5-0.125)"
echo ""

# ---------------------------------------------------------------------------
# STEP 4: Process AI product feature beats (Beats 3-7)
# All parameters identical to v10 grade chain.
# Beat order: cover macro → latch → fold-open → LED → security
# No vehicle motion shots in this block. Product descends and stays there.
# ---------------------------------------------------------------------------
echo "[STEP 4] Processing AI product feature beats (3-7)..."
echo ""

# BEAT 3: Cover macro — clip-cover-a-surface
# trim 0.2-2.7s = 2.5s — brighter first window, better light
echo "  [beat3] Cover macro — clip-cover-a-surface 0.2-2.7s (2.5s)..."
$FFMPEG -y \
  -ss 0.2 -t 2.5 \
  -i "$CLIPS/clip-cover-a-surface.mp4" \
  -vf "${SCALE},fps=24,hue=s=0.75,eq=saturation=0.88,${AI_GRADE},${GRAIN},${VIGNETTE}" \
  -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p \
  -an "$TMP/beat3_cover_macro.mp4" 2>&1 | tail -2
echo "  [beat3] done."

# BEAT 4: Latch/buckle — clip-latch-v6
# trim 0.5-3.5s = 3.0s — hardware close, latch engagement
echo "  [beat4] AI latch — clip-latch-v6 0.5-3.5s (3.0s)..."
$FFMPEG -y \
  -ss 0.5 -t 3.0 \
  -i "$CLIPS/clip-latch-v6.mp4" \
  -vf "${SCALE},fps=24,${AI_GRADE},${GRAIN},${VIGNETTE}" \
  -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p \
  -an "$TMP/beat4_ai_latch.mp4" 2>&1 | tail -2
echo "  [beat4] done."

# BEAT 5: Fold-open — clip-cover-f-foldopen
# trim 0.5-3.5s = 3.0s — panels folding, bed access reveal
echo "  [beat5] AI fold-open — clip-cover-f-foldopen 0.5-3.5s (3.0s)..."
$FFMPEG -y \
  -ss 0.5 -t 3.0 \
  -i "$CLIPS/clip-cover-f-foldopen.mp4" \
  -vf "${SCALE},fps=24,hue=s=0.80,eq=saturation=0.90,${AI_GRADE},${GRAIN},${VIGNETTE}" \
  -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p \
  -an "$TMP/beat5_ai_foldopen.mp4" 2>&1 | tail -2
echo "  [beat5] done."

# BEAT 6: LED reveal — clip-h1-led-reveal (portrait, center-cropped)
# trim 1.0-3.5s = 2.5s — LED glow, premium bed lighting
echo "  [beat6] AI LED — clip-h1-led-reveal 1.0-3.5s (2.5s, portrait crop)..."
$FFMPEG -y \
  -ss 1.0 -t 2.5 \
  -i "$CLIPS/clip-h1-led-reveal.mp4" \
  -vf "crop=1076:605:0:659,scale=1920:1080,setsar=1,fps=24,${AI_GRADE},${GRAIN},${VIGNETTE}" \
  -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p \
  -an "$TMP/beat6_ai_led.mp4" 2>&1 | tail -2
echo "  [beat6] done."

# BEAT 7: Security lot — clip-new-security
# trim 0-2.5s = 2.5s — cover closed/locked, parking lot context
echo "  [beat7] Tacoma security lot — clip-new-security 0-2.5s (2.5s)..."
$FFMPEG -y \
  -ss 0 -t 2.5 \
  -i "$CLIPS/clip-new-security.mp4" \
  -vf "${SCALE},fps=24,${AI_GRADE},${GRAIN},${VIGNETTE}" \
  -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p \
  -an "$TMP/beat7_ai_security.mp4" 2>&1 | tail -2
echo "  [beat7] done."
echo ""

# ---------------------------------------------------------------------------
# STEP 5: Generate Value-Line Card (Beat 8, 2.5s)
# WHITE ONLY — no yellow. Yellow reserved for end card CTA only.
# ---------------------------------------------------------------------------
echo "[STEP 5] Generating value-line card (WHITE ONLY — no yellow)..."

$MAGICK \
  -size 1920x1080 xc:'#0a0a0a' \
  -font '/System/Library/Fonts/HelveticaNeue.ttc' \
  -pointsize 34 \
  -fill 'white' \
  -gravity Center \
  -annotate +0-80 'RAIN  ·  ICE  ·  DUST' \
  -pointsize 64 \
  -fill white \
  -annotate +0+20 'YOUR BED IS COVERED.' \
  -quality 95 \
  "$TMP/valueline.jpg" 2>/dev/null

$FFMPEG -y \
  -loop 1 -i "$TMP/valueline.jpg" \
  -t 2.5 \
  -vf "fps=24,scale=1920:1080,setsar=1" \
  -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p \
  -an "$TMP/beat8_valueline.mp4" 2>&1 | tail -2
echo "  Value-line card done (white-only, 2.5s)."

# ---------------------------------------------------------------------------
# STEP 6: Generate End Card (Beat 9, 3s)
# Yellow CTA is the ONLY yellow in the entire spot.
# ---------------------------------------------------------------------------
echo ""
echo "[STEP 6] Generating end card (fitment + yellow CTA — only yellow)..."

$MAGICK \
  -size 1920x1080 xc:'#0a0a0a' \
  -font '/System/Library/Fonts/HelveticaNeue.ttc' \
  -pointsize 52 \
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
  -an "$TMP/beat9_endcard.mp4" 2>&1 | tail -2
echo "  End card done (3s, #f5a823 CTA)."

# ---------------------------------------------------------------------------
# STEP 7: Generate Stehlen Logo Close (Beat 10, 2s)
# Armordillo-style: matte black (#0a0a0a) frame, wordmark large+centered.
# ---------------------------------------------------------------------------
echo ""
echo "[STEP 7] Generating Stehlen logo close (Armordillo-style, 2s)..."

$MAGICK \
  -size 1920x1080 xc:'#0a0a0a' \
  \( "$LOGO" -resize 1056x \) \
  -gravity Center \
  -composite \
  -quality 95 \
  "$TMP/logoclose.jpg" 2>/dev/null

$FFMPEG -y \
  -loop 1 -i "$TMP/logoclose.jpg" \
  -t 2.0 \
  -vf "fps=24,scale=1920:1080,setsar=1" \
  -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p \
  -an "$TMP/beat10_logoclose.mp4" 2>&1 | tail -2
echo "  Stehlen logo close done (2s, 1056px centered on black)."

# ---------------------------------------------------------------------------
# STEP 8: Verify all beat intermediates
# ---------------------------------------------------------------------------
echo ""
echo "[STEP 8] Verifying intermediates..."

ALL_OK=true
TOTAL_DUR=0
# Note: beat1_2_xfade replaces beat1 + beat2 separately in the concat
BEATS=(beat1_2_xfade beat3_cover_macro beat4_ai_latch beat5_ai_foldopen beat6_ai_led beat7_ai_security beat8_valueline beat9_endcard beat10_logoclose)

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
# STEP 9: Concatenate all beats (silent master)
# ---------------------------------------------------------------------------
echo ""
echo "[STEP 9] Concatenating to silent v11 master..."

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
  "$TMP/v11_silent.mp4" 2>&1 | tail -4

echo "  Silent master complete."

# ---------------------------------------------------------------------------
# STEP 10: Mix real music under the spot
# Kevin MacLeod "Industrial Cinematic" (CC-BY 3.0, ~73 BPM)
# Full spot at -14 dBFS | fade-out last 4s over value-line → logo close
# ---------------------------------------------------------------------------
echo ""
echo "[STEP 10] Mixing music track..."

VID_DUR=$($FFPROBE -v error -show_entries format=duration -of csv=p=0 "$TMP/v11_silent.mp4" 2>/dev/null)
echo "  Video duration: ${VID_DUR}s"
echo "  Music file: industrial-cinematic-kevin-macleod.mp3"

FADE_START=$(echo "$VID_DUR - 4" | bc 2>/dev/null || echo "23")
echo "  Music fade-out start: ${FADE_START}s (lasts 4s)"

$FFMPEG -y \
  -i "$TMP/v11_silent.mp4" \
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
# STEP 11: Final verification
# ---------------------------------------------------------------------------
echo ""
echo "[STEP 11] Final output verification..."

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
# STEP 12: Extract review frames from final cut
# frames-v11/ — verify the energy arc is visible in stills
# Beat midpoints calculated from v11 timecodes:
#   beat1+2 xfade block: 0:00-0:05.875  — drive mid ~1.75s, parked mid ~4.7s
#   beat3  cover macro:  0:05.875-0:08.375  mid = 7.1s
#   beat4  latch:        0:08.375-0:11.375  mid = 9.9s
#   beat5  fold-open:    0:11.375-0:14.375  mid = 12.9s
#   beat6  LED:          0:14.375-0:16.875  mid = 15.6s
#   beat7  security:     0:16.875-0:19.375  mid = 18.1s
#   beat8  value-line:   0:19.375-0:21.875  mid = 20.6s
#   beat9  end card:     0:21.875-0:24.875  mid = 23.4s
#   beat10 logo close:   0:24.875-0:26.875  mid = 25.9s
# ---------------------------------------------------------------------------
echo ""
echo "[STEP 12] Extracting review frames..."

mkdir -p "$FRAMES"

declare -a TS=(1.75 4.7 7.1 9.9 12.9 15.6 18.1 20.6 23.4 25.9)
declare -a NAMES=(
  "beat1-veo-DRIVE-only"
  "beat2-h2-PARKED-reveal"
  "beat3-cover-macro"
  "beat4-ai-latch"
  "beat5-ai-foldopen"
  "beat6-ai-led"
  "beat7-ai-security"
  "beat8-valueline-whiteonly"
  "beat9-endcard-yellowCTA"
  "beat10-logoclose-stehlen"
)

for i in "${!TS[@]}"; do
  TS_VAL="${TS[$i]}"
  NAME="${NAMES[$i]}"
  OUTF="$FRAMES/${NAME}.jpg"
  $FFMPEG -y -ss "$TS_VAL" -i "$OUT" -vframes 1 -q:v 2 "$OUTF" 2>/dev/null \
    && echo "  frame @ ${TS_VAL}s -> ${NAME}.jpg" \
    || echo "  WARNING: could not extract frame @ ${TS_VAL}s"
done

# Save static card references
cp "$TMP/valueline.jpg" "$FRAMES/valueline-card-full.jpg" 2>/dev/null && echo "  valueline-card saved."
cp "$TMP/endcard.jpg" "$FRAMES/endcard-full.jpg" 2>/dev/null && echo "  endcard saved."
cp "$TMP/logoclose.jpg" "$FRAMES/logoclose-full.jpg" 2>/dev/null && echo "  logo-close card saved."

echo ""
echo "==================================================================="
echo "V11 ASSEMBLY COMPLETE — Director: Carter Voss"
echo ""
echo "Output: $OUT"
echo "Frames: $FRAMES/"
echo ""
echo "ENERGY ARC FIX APPLIED:"
echo "  v10 (broken): parked driveway (0.9s) → desert drive (5.6s) → product static shots"
echo "                Reader felt: still → moving → still = BOUNCE"
echo "  v11 (fixed):  desert drive ONLY (3.5s) → parked reveal (2.5s) → product details"
echo "                Reader feels: motion → settle → descend = ONE DIRECTION"
echo ""
echo "Beat order / timecodes (v11):"
echo "  0:00-0:03.5   Beat 1   VEO DESERT DRIVE   (drive-only trim 2.5-6.0s, no parked)"
echo "  0:03.5-0:06.0 Beat 2   PARKED REVEAL      (h2-truck-dolly golden-hour driveway)"
echo "  [3-frame dissolve between beats 1 and 2]"
echo "  0:06.0-0:08.5 Beat 3   Cover macro        (clip-cover-a-surface, trim 0.2-2.7s)"
echo "  0:08.5-0:11.5 Beat 4   AI latch/buckle    (clip-latch-v6, hardware close)"
echo "  0:11.5-0:14.5 Beat 5   AI fold-open       (clip-cover-f-foldopen, bed access)"
echo "  0:14.5-0:17.0 Beat 6   AI LED reveal      (clip-h1-led-reveal, portrait crop)"
echo "  0:17.0-0:19.5 Beat 7   AI security lot    (clip-new-security, locked cover)"
echo "  0:19.5-0:22.0 Beat 8   Value-line card    [WHITE ONLY — no yellow]"
echo "  0:22.0-0:25.0 Beat 9   End card           [fitment + #f5a823 yellow CTA — only yellow]"
echo "  0:25.0-0:27.0 Beat 10  STEHLEN LOGO CLOSE [Armordillo-style, centered, 2s]"
echo ""
echo "Veo: audio stripped | 720p→1080p lanczos | AI_GRADE+GRAIN+VIGNETTE"
echo "H2 dolly: scaled 1948→1920 lanczos | same grade chain"
echo "Music: Kevin MacLeod 'Industrial Cinematic' (CC-BY 3.0)"
echo "  Full spot at -14 dBFS | fade-out last 4s (mid-value-line through logo close)"
echo ""
echo "Grade: teal-shadow/warm-mid | grain+vignette all beats | 24fps | 1920x1080"
echo "v10 untouched: $CLIPS/stehlen-tacoma-tonneau-spot-v10.mp4"
echo "==================================================================="
