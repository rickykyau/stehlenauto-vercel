#!/usr/bin/env bash
# =============================================================================
# STAGE 2c — Stehlen Tacoma Tonneau Spot v2: Assembly
# Director: Carter Voss
#
# Changes from v1:
#   1. NEW Beat 3.5: Fold-open / bed-access (clip-cover-f-foldopen, ~4s)
#      inserted between beat 3 (latch) and beat 4 (night).
#   2. Beat 3 (latch) trimmed from 0-4s to 1.5-4.5s (3s) — eliminates
#      the wavy-gasket frames from the first 1.5s.
#   3. End card sub-line updated to:
#      "fits 2016–2023 Tacoma 5 ft bed — wrong fit, full refund"
#
# Beat order (~25s total):
#   BEAT 1  (0:00-0:03)    Cold open       — clip-h2-truck-dolly      trim 0-3s
#   BEAT 2  (0:03-0:08)    Cover macro     — clip-cover-a-surface      trim 0-5s
#   BEAT 3  (0:08-0:11)    Latch/rail      — clip-cover-d-latch        trim 1.5-4.5s (3s)
#   BEAT 3.5(0:11-0:15)    Fold-open/bed   — clip-cover-f-foldopen     trim 0.5-4.5s (4s)
#   BEAT 4  (0:15-0:19)    Night hero      — clip-night-e-hero         trim 0.5-4.5s (4s)
#   BEAT 5  (0:19-0:21.5)  LED bonus       — clip-h1-led-reveal        crop 16:9, trim 1-3.5s (2.5s)
#   BEAT 6  (0:21.5-0:24.5) End card        — ImageMagick static, 3s
#
# Total target: ~24.5s
# =============================================================================

set -euo pipefail

FFMPEG="/opt/homebrew/bin/ffmpeg"
MAGICK="/opt/homebrew/bin/magick"
FFPROBE="/opt/homebrew/bin/ffprobe"
PROJ="/Users/ricky/Library/CloudStorage/OneDrive-Personal/Documents/Robome/Client/JL Concepts/Project/stehlenauto-vercel"
CLIPS="$PROJ/public/videos/spot-clips"
FRAMES="$CLIPS/frames-v2"
TMP="/tmp/stehlen-spot-v2-assembly"

mkdir -p "$TMP" "$FRAMES"

echo "==================================================================="
echo "STEHLEN TACOMA TONNEAU SPOT v2 — Assembly"
echo "Director: Carter Voss"
echo "==================================================================="
echo ""
echo "Changes from v1:"
echo "  + Beat 3.5: Fold-open bed access (new clip-cover-f-foldopen, 4s)"
echo "  + Beat 3 (latch) trimmed 1.5-4.5s — eliminates wavy-gasket frames"
echo "  + End card sub-line: 'fits 2016-2023 Tacoma 5 ft bed — wrong fit, full refund'"
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
echo "  [beat1] H2 truck dolly (0-3s)..."
$FFMPEG -y \
  -ss 0 -t 3.0 \
  -i "$CLIPS/clip-h2-truck-dolly.mp4" \
  -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=24,hue=s=0.65,eq=saturation=0.92,$GRAIN,$VIGNETTE" \
  -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p \
  -an "$TMP/beat1_h2.mp4" 2>&1 | tail -2
echo "  [beat1] done."

# BEAT 2: Cover-A macro — full 5s, slight amber desaturation
echo "  [beat2] Cover-A surface macro (0-5s)..."
$FFMPEG -y \
  -ss 0 -t 5.0 \
  -i "$CLIPS/clip-cover-a-surface.mp4" \
  -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=24,hue=s=0.75,eq=saturation=0.88,$GRAIN,$VIGNETTE" \
  -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p \
  -an "$TMP/beat2_cover_a.mp4" 2>&1 | tail -2
echo "  [beat2] done."

# BEAT 3: Cover-D latch/rail — TRIMMED 1.5-4.5s (3s) — skips wavy-gasket frames
# Polish item 3: start at 1.5s cuts the worst gasket frames, keeps latch hardware
echo "  [beat3] Cover-D latch/rail (1.5-4.5s, 3s trimmed, gasket fix applied)..."
$FFMPEG -y \
  -ss 1.5 -t 3.0 \
  -i "$CLIPS/clip-cover-d-latch.mp4" \
  -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=24,$GRAIN,$VIGNETTE" \
  -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p \
  -an "$TMP/beat3_cover_d.mp4" 2>&1 | tail -2
echo "  [beat3] done."

# BEAT 3.5: Cover-F fold-open / bed access — NEW beat
# trim 0.5-4.5s (4s): skip the first 0.5s static frame, use the push-in motion
# Golden-hour driveway to match beats 1-2 tonality — slight amber pull
echo "  [beat3.5] Fold-open bed access (0.5-4.5s, 4s, new beat 3.5)..."
$FFMPEG -y \
  -ss 0.5 -t 4.0 \
  -i "$CLIPS/clip-cover-f-foldopen.mp4" \
  -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=24,hue=s=0.80,eq=saturation=0.90,$GRAIN,$VIGNETTE" \
  -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p \
  -an "$TMP/beat35_fold_open.mp4" 2>&1 | tail -2
echo "  [beat3.5] done."

# BEAT 4: Night-E — trim 0.5-4.5s (4s), red suppression for tail lamps
echo "  [beat4] Night-E hero (0.5-4.5s)..."
$FFMPEG -y \
  -ss 0.5 -t 4.0 \
  -i "$CLIPS/clip-night-e-hero.mp4" \
  -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=24,hue=s=0.60,eq=saturation=0.90,$GRAIN,$VIGNETTE" \
  -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p \
  -an "$TMP/beat4_night_e.mp4" 2>&1 | tail -2
echo "  [beat4] done."

# BEAT 5: LED H1 — center-crop portrait 1076x1924 to 16:9 letterbox, trim 1-3.5s
echo "  [beat5] LED bonus (crop portrait->16:9, trim 1-3.5s)..."
$FFMPEG -y \
  -ss 1.0 -t 2.5 \
  -i "$CLIPS/clip-h1-led-reveal.mp4" \
  -vf "crop=1076:605:0:659,scale=1920:1080,setsar=1,fps=24,$GRAIN,$VIGNETTE" \
  -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p \
  -an "$TMP/beat5_led.mp4" 2>&1 | tail -2
echo "  [beat5] done."

# ---------------------------------------------------------------------------
# STEP 2: Generate End Card — UPDATED sub-line (Polish item 2)
# Headline: "HARD COVER. LED BED LIGHTING. ONE INSTALL."
# Sub-line: "fits 2016–2023 Tacoma 5 ft bed — wrong fit, full refund"
# CTA: "SHOP THE COVER" (yellow)
# No price — owner's call.
# ---------------------------------------------------------------------------
echo ""
echo "[STEP 2] Generating end card (updated sub-line)..."

$MAGICK \
  -size 1920x1080 xc:'#0a0a0a' \
  -font '/System/Library/Fonts/HelveticaNeue.ttc' \
  -pointsize 62 \
  -fill white \
  -gravity Center \
  -annotate +0-150 'HARD COVER. LED BED LIGHTING. ONE INSTALL.' \
  -pointsize 26 \
  -fill '#bbbbbb' \
  -annotate +0-50 'fits 2016-2023 Tacoma 5 ft bed  --  wrong fit, full refund' \
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
for f in beat1_h2 beat2_cover_a beat3_cover_d beat35_fold_open beat4_night_e beat5_led beat6_endcard; do
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
# STEP 4: Concatenate beats into final v2 master
# ---------------------------------------------------------------------------
echo ""
echo "[STEP 4] Concatenating to final v2 master..."

printf "file '%s'\n" \
  "$TMP/beat1_h2.mp4" \
  "$TMP/beat2_cover_a.mp4" \
  "$TMP/beat3_cover_d.mp4" \
  "$TMP/beat35_fold_open.mp4" \
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
  "$CLIPS/stehlen-tacoma-tonneau-spot-v2.mp4" 2>&1 | tail -6

echo ""
echo "[STEP 4] Concat complete."

# ---------------------------------------------------------------------------
# STEP 5: Final verification
# ---------------------------------------------------------------------------
echo ""
echo "[STEP 5] Final output verification..."
OUT="$CLIPS/stehlen-tacoma-tonneau-spot-v2.mp4"

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
# v2 beat timecodes:
#   beat1  cold-open:    1.5s (mid-beat)
#   beat2  cover-macro:  5.5s
#   beat3  latch-rail:   9.5s  (mid of trimmed 3s beat @ 8-11s)
#   beat3.5 fold-open:  13.0s  (mid of 4s beat @ 11-15s)
#   beat4  night-hero:  17.0s  (mid of 4s beat @ 15-19s)
#   beat5  led-bonus:   20.25s (mid of 2.5s beat @ 19-21.5s)
#   beat6  end-card:    23.0s  (mid of 3s beat @ 21.5-24.5s)
# ---------------------------------------------------------------------------
echo ""
echo "[STEP 6] Extracting review frames..."

declare -a TS=(1.5 5.5 9.5 13.0 17.0 20.25 23.0)
declare -a NAMES=(beat1-coldopen beat2-cover-macro beat3-latch-rail beat35-foldopen beat4-night-hero beat5-led-bonus beat6-endcard)

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
echo "V2 ASSEMBLY COMPLETE"
echo "  Master: $OUT"
echo "  Review frames: $FRAMES/final-*.jpg"
echo ""
echo "Beat order:"
echo "  0:00-0:03  Beat 1  Cold open (truck dolly)"
echo "  0:03-0:08  Beat 2  Cover macro (surface detail)"
echo "  0:08-0:11  Beat 3  Latch/rail (trimmed 1.5-4.5s, gasket fix)"
echo "  0:11-0:15  Beat 3.5 FOLD-OPEN / bed access (NEW)"
echo "  0:15-0:19  Beat 4  Night hero"
echo "  0:19-0:21.5 Beat 5 LED bonus"
echo "  0:21.5-0:24.5 Beat 6 End card (updated fitment + refund line)"
echo "==================================================================="
