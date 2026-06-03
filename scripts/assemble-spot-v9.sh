#!/usr/bin/env bash
# =============================================================================
# STAGE 2k — Stehlen Tacoma Tonneau Spot v9: Assembly
# Director: Carter Voss
#
# Owner changes from v8:
#   CHANGE 1: First 9s MUST be the Tacoma. v8 opened on non-Tacoma real stock
#             (Navara cold-open, aerial pickup, Range Rover rain). REMOVED.
#             First 9s = clip-h2-truck-dolly + clip-new-security + clip-cover-a-surface.
#   CHANGE 2: Spot ends on a PROMINENT STEHLEN LOGO close (Armordillo-style).
#             New beat 12: matte black frame, logo large+centered, ~2s hold.
#
# OPENART CHECK: No new moving-Tacoma/openart clip found in stock/ — proceeding
#   without it. Tacoma open uses existing AI beats.
#
# Beat order (~27s, 16:9 1920x1080 24fps):
#   BEAT 1  (0:00-0:03)   AI Tacoma hero dolly    clip-h2-truck-dolly    trim 0-3s
#   BEAT 2  (0:03-0:06)   AI Tacoma security-lot  clip-new-security      trim 0-3s
#   BEAT 3  (0:06-0:09)   AI cover macro          clip-cover-a-surface   trim 0-3s
#   --- 9s mark: all Tacoma open DONE ---
#   BEAT 4  (0:09-0:11)   REAL adventure wide     03-front-drive.mp4     trim 2.0-4.0s (kept: reads as atmospheric b-roll, does not jar after Tacoma)
#   BEAT 5  (0:11-0:14)   AI latch/buckle         clip-latch-v6          trim 0.5-3.5s
#   BEAT 6  (0:14-0:17)   AI fold-open            clip-cover-f-foldopen  trim 0.5-3.5s
#   BEAT 7  (0:17-0:19.5) AI LED reveal           clip-h1-led-reveal     trim 1.0-3.5s
#   BEAT 8  (0:19.5-0:22) Value-line card         ImageMagick static     2.5s  [WHITE ONLY — no yellow]
#   BEAT 9  (0:22-0:25)   End card                ImageMagick static     3s    [yellow CTA only]
#   BEAT 10 (0:25-0:27)   Stehlen logo close      ImageMagick static     2s    [Armordillo-style centered logo]
#
# Total: ~27s
#
# Grade: consistent teal-shadow/warm-mid film LUT on all clips.
# Real stock grade: heavy desaturation + cool push to unify with AI beats.
# Grain: noise=alls=12:allf=t+u (~12% organic grain) on every clip.
# Vignette: PI/5 on every clip.
# Music: Kevin MacLeod "Industrial Cinematic" — fade-out last 4s (over value-line → logo close).
# =============================================================================

set -euo pipefail

FFMPEG="/opt/homebrew/bin/ffmpeg"
MAGICK="/opt/homebrew/bin/magick"
FFPROBE="/opt/homebrew/bin/ffprobe"
PROJ="/Users/ricky/Library/CloudStorage/OneDrive-Personal/Documents/Robome/Client/JL Concepts/Project/stehlenauto-vercel"
CLIPS="$PROJ/public/videos/spot-clips"
STOCK="$CLIPS/stock"
AUDIO="$CLIPS/audio"
FRAMES="$CLIPS/frames-v9"
LOGO="$PROJ/public/images/stehlen-logo.png"
TMP="/tmp/stehlen-spot-v9-assembly"
OUT="$CLIPS/stehlen-tacoma-tonneau-spot-v9.mp4"

mkdir -p "$TMP" "$FRAMES"

echo "==================================================================="
echo "STEHLEN TACOMA TONNEAU SPOT v9 — Assembly"
echo "Director: Carter Voss"
echo ""
echo "CHANGE 1: First 9s = ALL TACOMA (dolly + security + cover macro)"
echo "CHANGE 2: Prominent Stehlen logo close at end (~2s)"
echo "Value card: WHITE ONLY (no yellow on RAIN·ICE·DUST line)"
echo "OpenArt Tacoma clip: NOT FOUND — using existing AI Tacoma beats"
echo "==================================================================="
echo ""

# ---------------------------------------------------------------------------
# FILTER BUILDING BLOCKS (identical to v8)
# ---------------------------------------------------------------------------
GRAIN="noise=alls=12:allf=t+u"
VIGNETTE="vignette=PI/5"

STOCK_GRADE="hue=s=0.55,eq=saturation=0.88:contrast=0.92:brightness=-0.02,curves=r='0/0 0.25/0.22 0.75/0.72 1/1':b='0/0 0.25/0.27 0.75/0.75 1/1'"
AI_GRADE="curves=r='0/0 0.25/0.23 1/1':b='0/0 0.25/0.27 1/1'"
SCALE="scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1"

# ---------------------------------------------------------------------------
# STEP 1: Process Tacoma-first open beats (beats 1-3, all AI Tacoma clips)
# ---------------------------------------------------------------------------
echo "[STEP 1] Processing Tacoma open beats (first 9 seconds)..."
echo ""

# BEAT 1: Tacoma hero dolly — clip-h2-truck-dolly
# trim: 0-3s — silver Tacoma + cover, slow dolly, golden hour
# This is the strongest Tacoma read; leads the spot.
echo "  [beat1] Tacoma hero dolly — clip-h2-truck-dolly 0-3.0s..."
$FFMPEG -y \
  -ss 0 -t 3.0 \
  -i "$CLIPS/clip-h2-truck-dolly.mp4" \
  -vf "${SCALE},fps=24,hue=s=0.65,eq=saturation=0.92,${AI_GRADE},${GRAIN},${VIGNETTE}" \
  -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p \
  -an "$TMP/beat1_tacoma_dolly.mp4" 2>&1 | tail -2
echo "  [beat1] done."

# BEAT 2: Tacoma security-in-lot — clip-new-security
# trim: 0-3s — cover closed/locked, parking lot dusk
# Reads Tacoma + cover identity; reinforces product in urban context.
echo "  [beat2] Tacoma security lot — clip-new-security 0-3.0s..."
$FFMPEG -y \
  -ss 0 -t 3.0 \
  -i "$CLIPS/clip-new-security.mp4" \
  -vf "${SCALE},fps=24,${AI_GRADE},${GRAIN},${VIGNETTE}" \
  -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p \
  -an "$TMP/beat2_tacoma_security.mp4" 2>&1 | tail -2
echo "  [beat2] done."

# BEAT 3: Cover macro — clip-cover-a-surface
# trim: 0-3s — matte cover texture close-up
# Still on the Tacoma cover; material detail. Completes 9s Tacoma open.
echo "  [beat3] Cover macro — clip-cover-a-surface 0-3.0s..."
$FFMPEG -y \
  -ss 0 -t 3.0 \
  -i "$CLIPS/clip-cover-a-surface.mp4" \
  -vf "${SCALE},fps=24,hue=s=0.75,eq=saturation=0.88,${AI_GRADE},${GRAIN},${VIGNETTE}" \
  -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p \
  -an "$TMP/beat3_cover_macro.mp4" 2>&1 | tail -2
echo "  [beat3] done."

echo "  --- 9-second Tacoma open COMPLETE ---"
echo ""

# ---------------------------------------------------------------------------
# STEP 2: Optional real adventure beat (beat 4, 2s) — KEPT
# 03-front-drive: 1920x1080 truck approaching camera, rocky trail, dust.
# Decision: KEEP — comes AFTER 9s Tacoma open so it reads as adventure b-roll
# context, not a brand ID anchor. 2s is short enough to not jar.
# trim: 2.0-4.0s — truck mid-approach, most dynamic 2s window.
# ---------------------------------------------------------------------------
echo "[STEP 2] Processing optional real adventure beat (kept — reads as b-roll)..."
echo ""

echo "  [beat4] REAL adventure wide — 03-front-drive 2.0-4.0s (2s, KEPT)..."
$FFMPEG -y \
  -ss 2.0 -t 2.0 \
  -i "$STOCK/03-front-drive.mp4" \
  -vf "${SCALE},fps=24,${STOCK_GRADE},${GRAIN},${VIGNETTE}" \
  -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p \
  -an "$TMP/beat4_real_adventure.mp4" 2>&1 | tail -2
echo "  [beat4] done."

# ---------------------------------------------------------------------------
# STEP 3: AI product feature beats (beats 5-7)
# ---------------------------------------------------------------------------
echo ""
echo "[STEP 3] Processing AI product feature beats..."
echo ""

# BEAT 5: Latch/buckle — clip-latch-v6 (clean no-pull-tab version)
# trim: 0.5-3.5s (3s) — hardware close, latch engagement
echo "  [beat5] AI latch — clip-latch-v6 0.5-3.5s..."
$FFMPEG -y \
  -ss 0.5 -t 3.0 \
  -i "$CLIPS/clip-latch-v6.mp4" \
  -vf "${SCALE},fps=24,${AI_GRADE},${GRAIN},${VIGNETTE}" \
  -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p \
  -an "$TMP/beat5_ai_latch.mp4" 2>&1 | tail -2
echo "  [beat5] done."

# BEAT 6: Fold-open — clip-cover-f-foldopen (bed access reveal)
# trim: 0.5-3.5s (3s) — panels folding, premium hardware action
echo "  [beat6] AI fold-open — clip-cover-f-foldopen 0.5-3.5s..."
$FFMPEG -y \
  -ss 0.5 -t 3.0 \
  -i "$CLIPS/clip-cover-f-foldopen.mp4" \
  -vf "${SCALE},fps=24,hue=s=0.80,eq=saturation=0.90,${AI_GRADE},${GRAIN},${VIGNETTE}" \
  -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p \
  -an "$TMP/beat6_ai_foldopen.mp4" 2>&1 | tail -2
echo "  [beat6] done."

# BEAT 7: LED reveal — clip-h1-led-reveal (portrait, center-cropped to 16:9)
# trim: 1.0-3.5s (2.5s) — LED glow, premium bed lighting
echo "  [beat7] AI LED — clip-h1-led-reveal 1.0-3.5s (portrait crop)..."
$FFMPEG -y \
  -ss 1.0 -t 2.5 \
  -i "$CLIPS/clip-h1-led-reveal.mp4" \
  -vf "crop=1076:605:0:659,scale=1920:1080,setsar=1,fps=24,${AI_GRADE},${GRAIN},${VIGNETTE}" \
  -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p \
  -an "$TMP/beat7_ai_led.mp4" 2>&1 | tail -2
echo "  [beat7] done."

# ---------------------------------------------------------------------------
# STEP 4: Generate Value-Line Card (Beat 8, 2.5s)
# CHANGE from v8: WHITE ONLY. "RAIN · ICE · DUST" reverted from yellow to white.
# No yellow on this card — yellow CTA lives only in the end card.
# ---------------------------------------------------------------------------
echo ""
echo "[STEP 4] Generating value-line card (WHITE ONLY — no yellow)..."

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
# STEP 5: Generate End Card (Beat 9, 3s)
# Same as v8: headline + fitment copy + yellow CTA (ONLY yellow in spot).
# ---------------------------------------------------------------------------
echo ""
echo "[STEP 5] Generating end card (fitment + yellow CTA)..."

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
echo "  End card done (3s)."

# ---------------------------------------------------------------------------
# STEP 6: Generate Stehlen Logo Close (Beat 10, 2s) — NEW IN v9
# Armordillo-style: matte black (#0a0a0a) frame, logo large and centered.
# Logo: public/images/stehlen-logo.png (600x113, RGBA white wordmark + orange S)
# Scale logo to ~55% of frame width (1056px wide) for prominent read.
# No text. No CTA. Clean exit.
# ---------------------------------------------------------------------------
echo ""
echo "[STEP 6] Generating Stehlen logo close (Armordillo-style, 2s)..."

# Composite: matte black canvas + logo centered, scaled to 1056px wide
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
echo "  Stehlen logo close done (2s, 1056px wide centered on black)."

# ---------------------------------------------------------------------------
# STEP 7: Verify all beat intermediates
# ---------------------------------------------------------------------------
echo ""
echo "[STEP 7] Verifying intermediates..."

ALL_OK=true
TOTAL_DUR=0
BEATS=(beat1_tacoma_dolly beat2_tacoma_security beat3_cover_macro beat4_real_adventure beat5_ai_latch beat6_ai_foldopen beat7_ai_led beat8_valueline beat9_endcard beat10_logoclose)

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
# STEP 8: Concatenate all beats (silent master)
# ---------------------------------------------------------------------------
echo ""
echo "[STEP 8] Concatenating to silent v9 master..."

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
  "$TMP/v9_silent.mp4" 2>&1 | tail -4

echo "  Silent master complete."

# ---------------------------------------------------------------------------
# STEP 9: Mix real music under the spot
# Kevin MacLeod "Industrial Cinematic" (CC-BY 3.0, ~73 BPM)
# Strategy:
#   - Full spot at -14 dBFS
#   - Fade out last 4s: starts mid-value-line card, fades through logo close
#   - No audio from any video clip
# ---------------------------------------------------------------------------
echo ""
echo "[STEP 9] Mixing music track..."

VID_DUR=$($FFPROBE -v error -show_entries format=duration -of csv=p=0 "$TMP/v9_silent.mp4" 2>/dev/null)
echo "  Video duration: ${VID_DUR}s"
echo "  Music file: industrial-cinematic-kevin-macleod.mp3"

FADE_START=$(echo "$VID_DUR - 4" | bc 2>/dev/null || echo "23")
echo "  Music fade-out start: ${FADE_START}s (lasts 4s)"

$FFMPEG -y \
  -i "$TMP/v9_silent.mp4" \
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
# STEP 10: Final verification
# ---------------------------------------------------------------------------
echo ""
echo "[STEP 10] Final output verification..."

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
# STEP 11: Extract review frames from final cut
# One frame per beat (mid-point of each beat in final timeline)
# ---------------------------------------------------------------------------
echo ""
echo "[STEP 11] Extracting review frames..."

mkdir -p "$FRAMES"

# Beat timecodes in final output (cumulative):
# beat1  Tacoma dolly      0:00-0:03     mid = 1.5s
# beat2  Tacoma security   0:03-0:06     mid = 4.5s
# beat3  cover macro       0:06-0:09     mid = 7.5s
# beat4  real adventure    0:09-0:11     mid = 10.0s
# beat5  latch             0:11-0:14     mid = 12.5s
# beat6  fold-open         0:14-0:17     mid = 15.5s
# beat7  LED               0:17-0:19.5   mid = 18.25s
# beat8  value-line card   0:19.5-0:22   mid = 20.75s
# beat9  end card          0:22-0:25     mid = 23.5s
# beat10 logo close        0:25-0:27     mid = 26.0s

declare -a TS=(1.5 4.5 7.5 10.0 12.5 15.5 18.25 20.75 23.5 26.0)
declare -a NAMES=(
  "beat1-tacoma-dolly"
  "beat2-tacoma-security"
  "beat3-cover-macro"
  "beat4-real-adventure"
  "beat5-ai-latch"
  "beat6-ai-foldopen"
  "beat7-ai-led"
  "beat8-valueline-whiteonly"
  "beat9-endcard"
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
echo "V9 ASSEMBLY COMPLETE — Director: Carter Voss"
echo ""
echo "Output: $OUT"
echo "Frames: $FRAMES/"
echo ""
echo "Beat order / timecodes (v9):"
echo "  0:00-0:03     Beat 1   TACOMA hero dolly      (clip-h2-truck-dolly, golden hour)"
echo "  0:03-0:06     Beat 2   TACOMA security lot    (clip-new-security, dusk parking)"
echo "  0:06-0:09     Beat 3   Cover macro            (clip-cover-a-surface, matte texture)"
echo "  --- 9s: All-Tacoma open complete ---"
echo "  0:09-0:11     Beat 4   REAL adventure b-roll  (03-front-drive, 2s, KEPT)"
echo "  0:11-0:14     Beat 5   AI latch/buckle        (clip-latch-v6, hardware close)"
echo "  0:14-0:17     Beat 6   AI fold-open           (clip-cover-f-foldopen, bed access)"
echo "  0:17-0:19.5   Beat 7   AI LED reveal          (clip-h1-led-reveal, portrait crop)"
echo "  0:19.5-0:22   Beat 8   Value-line card        [WHITE ONLY — no yellow]"
echo "  0:22-0:25     Beat 9   End card               (fitment + yellow CTA)"
echo "  0:25-0:27     Beat 10  STEHLEN LOGO CLOSE     [Armordillo-style, centered, 2s]"
echo ""
echo "Music: Kevin MacLeod 'Industrial Cinematic' (CC-BY 3.0)"
echo "  Full spot at -14 dBFS | fade-out last 4s (mid-value-line through logo close)"
echo ""
echo "Grade: teal-shadow/warm-mid | desaturation on real clips | grain+vignette all"
echo "==================================================================="
