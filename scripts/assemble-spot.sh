#!/usr/bin/env bash
# =============================================================================
# STAGE 2b — Stehlen Tacoma Tonneau Spot: Assembly
# Director: Carter Voss
#
# Beat order (cover-first):
#   BEAT 1 (0:00-0:03)  Cold open — clip-h2-truck-dolly    trim 0-3s
#   BEAT 2 (0:03-0:08)  Cover macro — clip-cover-a-surface full 5s
#   BEAT 3 (0:08-0:12)  Latch/rail — clip-cover-d-latch    trim 0-4s
#   BEAT 4 (0:12-0:16)  Night hero — clip-night-e-hero     trim 0.5s-4.5s (4s)
#   BEAT 5 (0:16-0:18.5) LED bonus — clip-h1-led-reveal   crop 16:9, trim 1-3.5s (2.5s)
#   BEAT 6 (0:18.5-0:21.5) End card — ImageMagick static, 3s
#
# Total target: ~21.5s
# =============================================================================

set -euo pipefail

FFMPEG="/opt/homebrew/bin/ffmpeg"
MAGICK="/opt/homebrew/bin/magick"
FFPROBE="/opt/homebrew/bin/ffprobe"
PROJ="/Users/ricky/Library/CloudStorage/OneDrive-Personal/Documents/Robome/Client/JL Concepts/Project/stehlenauto-vercel"
CLIPS="$PROJ/public/videos/spot-clips"
FRAMES="$CLIPS/frames"
TMP="/tmp/stehlen-spot-assembly"

mkdir -p "$TMP" "$FRAMES"

echo "==================================================================="
echo "STEHLEN TACOMA TONNEAU SPOT — Assembly"
echo "Director: Carter Voss"
echo "==================================================================="
echo ""

# Realism filter blocks (appended to all video clips)
GRAIN="noise=alls=12:allf=t+u"
VIGNETTE="vignette=PI/5"

# ---------------------------------------------------------------------------
# STEP 1: Process each clip to normalized intermediate (1920x1080, yuv420p, 24fps)
# ---------------------------------------------------------------------------
echo "[STEP 1] Processing clip segments..."
echo ""

# BEAT 1: H2 — cold open truck dolly, trim 0-3s, mild red desaturation
echo "  [beat1] H2 truck dolly (0-3s, s=0.65 desaturate)..."
$FFMPEG -y \
  -ss 0 -t 3.0 \
  -i "$CLIPS/clip-h2-truck-dolly.mp4" \
  -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=24,hue=s=0.65,eq=saturation=0.92,$GRAIN,$VIGNETTE" \
  -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p \
  -an "$TMP/beat1_h2.mp4" 2>&1 | tail -2
echo "  [beat1] done."

# BEAT 2: Cover-A macro — full 5s, slight amber desaturation
echo "  [beat2] Cover-A surface macro (0-5s, s=0.75 desaturate amber)..."
$FFMPEG -y \
  -ss 0 -t 5.0 \
  -i "$CLIPS/clip-cover-a-surface.mp4" \
  -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=24,hue=s=0.75,eq=saturation=0.88,$GRAIN,$VIGNETTE" \
  -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p \
  -an "$TMP/beat2_cover_a.mp4" 2>&1 | tail -2
echo "  [beat2] done."

# BEAT 3: Cover-D latch/rail — trim 0-4s, no color work (cool blue-hour is correct)
echo "  [beat3] Cover-D latch/rail (0-4s, blue-hour grade preserved)..."
$FFMPEG -y \
  -ss 0 -t 4.0 \
  -i "$CLIPS/clip-cover-d-latch.mp4" \
  -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=24,$GRAIN,$VIGNETTE" \
  -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p \
  -an "$TMP/beat3_cover_d.mp4" 2>&1 | tail -2
echo "  [beat3] done."

# BEAT 4: Night-E — trim 0.5-4.5s (4s), red suppression for tail lamps
echo "  [beat4] Night-E hero (0.5-4.5s, s=0.60 red suppress)..."
$FFMPEG -y \
  -ss 0.5 -t 4.0 \
  -i "$CLIPS/clip-night-e-hero.mp4" \
  -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=24,hue=s=0.60,eq=saturation=0.90,$GRAIN,$VIGNETTE" \
  -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p \
  -an "$TMP/beat4_night_e.mp4" 2>&1 | tail -2
echo "  [beat4] done."

# BEAT 5: LED H1 — center-crop portrait 1076x1924 to 16:9 letterbox, trim 1-3.5s
# 16:9 crop from 1076px wide: height = 1076*(9/16) = 605px
# crop=w:h:x:y => crop=1076:605:0:((1924-605)/2) = crop=1076:605:0:659
echo "  [beat5] LED bonus (crop portrait->16:9, trim 1-3.5s)..."
$FFMPEG -y \
  -ss 1.0 -t 2.5 \
  -i "$CLIPS/clip-h1-led-reveal.mp4" \
  -vf "crop=1076:605:0:659,scale=1920:1080,setsar=1,fps=24,$GRAIN,$VIGNETTE" \
  -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p \
  -an "$TMP/beat5_led.mp4" 2>&1 | tail -2
echo "  [beat5] done."

# ---------------------------------------------------------------------------
# STEP 2: Generate End Card frame with ImageMagick, encode as 3s video
# ---------------------------------------------------------------------------
echo ""
echo "[STEP 2] Generating end card (ImageMagick + ffmpeg)..."

$MAGICK \
  -size 1920x1080 xc:'#0a0a0a' \
  -font '/System/Library/Fonts/HelveticaNeue.ttc' \
  -pointsize 62 \
  -fill white \
  -gravity Center \
  -annotate +0-150 'HARD COVER. LED BED LIGHTING. ONE INSTALL.' \
  -pointsize 26 \
  -fill '#bbbbbb' \
  -annotate +0-50 'fits 2016-2023 Tacoma 5 ft bed  |  guaranteed or your money back' \
  -pointsize 46 \
  -fill '#f5a823' \
  -annotate +0+80 'SHOP THE COVER' \
  -quality 95 \
  "$TMP/endcard.jpg"

echo "  End card image generated."

# Encode end card JPG as 3-second video
$FFMPEG -y \
  -loop 1 -i "$TMP/endcard.jpg" \
  -t 3.0 \
  -vf "fps=24,scale=1920:1080,setsar=1" \
  -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p \
  -an "$TMP/beat6_endcard.mp4" 2>&1 | tail -2
echo "  End card video encoded."

# ---------------------------------------------------------------------------
# STEP 3: Verify all intermediates
# ---------------------------------------------------------------------------
echo ""
echo "[STEP 3] Verifying intermediates..."
ALL_OK=true
TOTAL_DUR=0
for f in beat1_h2 beat2_cover_a beat3_cover_d beat4_night_e beat5_led beat6_endcard; do
  if [ -f "$TMP/$f.mp4" ]; then
    DUR=$($FFPROBE -v error -select_streams v:0 -show_entries stream=duration -of csv=p=0 "$TMP/$f.mp4" 2>/dev/null || echo "0")
    DIM=$($FFPROBE -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "$TMP/$f.mp4" 2>/dev/null || echo "?")
    SZ=$(du -sh "$TMP/$f.mp4" | cut -f1)
    echo "  $f: ${DIM}px | ${DUR}s | $SZ"
  else
    echo "  MISSING: $f.mp4"
    ALL_OK=false
  fi
done

if [ "$ALL_OK" = false ]; then
  echo "FATAL: missing intermediates — aborting."
  exit 1
fi

# ---------------------------------------------------------------------------
# STEP 4: Concatenate beats into final master
# ---------------------------------------------------------------------------
echo ""
echo "[STEP 4] Concatenating to final master..."

cat > "$TMP/concat.txt" << 'CONCATEOF'
CONCATEOF

# Write the concat file (using actual paths)
printf "file '%s'\n" \
  "$TMP/beat1_h2.mp4" \
  "$TMP/beat2_cover_a.mp4" \
  "$TMP/beat3_cover_d.mp4" \
  "$TMP/beat4_night_e.mp4" \
  "$TMP/beat5_led.mp4" \
  "$TMP/beat6_endcard.mp4" > "$TMP/concat.txt"

echo "  Concat list:"
cat "$TMP/concat.txt"
echo ""

$FFMPEG -y \
  -f concat -safe 0 -i "$TMP/concat.txt" \
  -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p \
  -movflags +faststart \
  -an \
  "$CLIPS/stehlen-tacoma-tonneau-spot-v1.mp4" 2>&1 | tail -6

echo ""
echo "[STEP 4] Concat complete."

# ---------------------------------------------------------------------------
# STEP 5: Final verification
# ---------------------------------------------------------------------------
echo ""
echo "[STEP 5] Final output verification..."
OUT="$CLIPS/stehlen-tacoma-tonneau-spot-v1.mp4"

if [ -f "$OUT" ]; then
  FINAL_DUR=$($FFPROBE -v error -show_entries format=duration -of csv=p=0 "$OUT")
  FINAL_DIM=$($FFPROBE -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "$OUT")
  FINAL_FPS=$($FFPROBE -v error -select_streams v:0 -show_entries stream=r_frame_rate -of csv=p=0 "$OUT")
  FINAL_SZ=$(du -sh "$OUT" | cut -f1)
  echo "  Path:        $OUT"
  echo "  Duration:    ${FINAL_DUR}s"
  echo "  Resolution:  $FINAL_DIM (px)"
  echo "  Frame rate:  $FINAL_FPS"
  echo "  File size:   $FINAL_SZ"
else
  echo "FATAL: output not found."
  exit 1
fi

# ---------------------------------------------------------------------------
# STEP 6: Extract representative review frames from final cut
# Timestamps: mid-beat for each of the 6 beats
# beat1: 1.5s | beat2: 5.5s | beat3: 10s | beat4: 14s | beat5: 17.75s | beat6: 20s
# ---------------------------------------------------------------------------
echo ""
echo "[STEP 6] Extracting review frames..."

declare -a TS=(1.5 5.5 10.0 14.0 17.75 20.0)
declare -a NAMES=(beat1-coldopen beat2-cover-macro beat3-latch-rail beat4-night-hero beat5-led-bonus beat6-endcard)

for i in "${!TS[@]}"; do
  TS_VAL="${TS[$i]}"
  NAME="${NAMES[$i]}"
  OUTF="$FRAMES/final-${NAME}.jpg"
  $FFMPEG -y -ss "$TS_VAL" -vframes 1 -i "$OUT" -vf "scale=1920:-1" "$OUTF" 2>/dev/null \
    || $FFMPEG -y -ss "$TS_VAL" -vframes 1 -i "$OUT" "$OUTF" 2>/dev/null \
    || echo "  WARNING: could not extract frame at ${TS_VAL}s"
  [ -f "$OUTF" ] && echo "  frame @ ${TS_VAL}s -> final-${NAME}.jpg" || true
done

echo ""
echo "==================================================================="
echo "ASSEMBLY COMPLETE"
echo "  Master: $OUT"
echo "  Review frames: $FRAMES/final-*.jpg"
echo "==================================================================="
