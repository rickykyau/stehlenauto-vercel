#!/usr/bin/env bash
# =============================================================================
# STAGE 2L — Stehlen Tacoma Tonneau Spot v10: Assembly
# Director: Carter Voss
#
# The single change from v9: replace the AI Tacoma open (beats 1-2 of v9)
# with the REAL-LOOKING Veo 3.1 moving Tacoma clip from OpenArt.
# All other product beats, cards, grade, grain, music are inherited from v9.
# v9 is left intact.
#
# VEO HERO CLIP ANALYSIS (8s, 1280x720, 24fps, AAC audio):
#   0.0s-0.9s  — Parked silver Tacoma, suburban driveway, golden-hour rear 3/4
#                Cover panels clearly visible. Clean identity-lock frame.
#   1.0s-2.2s  — Camera swing / blur transition (editorial kill zone)
#   2.2s-8.0s  — Desert highway, TACOMA badge, matte tri-fold cover, wheels
#                rolling with road motion blur, mesa background. Strong.
#
# TRIM DECISION: Two-segment join to keep parked+driving arc, kill blur:
#   Segment A: 0.0s-0.9s  (0.9s parked identity)
#   Segment B: 2.2s-7.8s  (5.6s desert drive)
#   Total hero: ~6.5s — lands inside the 5-6s brief target with richer arc.
#
# PROCESSING:
#   - Strip audio (-an) — Veo native audio is off; music only.
#   - Upscale 1280x720 → 1920x1080 (scale lanczos). Motion blur hides softness.
#   - Apply AI_GRADE (teal-shadow/warm-mid) + GRAIN + VIGNETTE.
#   - Same grade chain as the AI product beats for visual world unity.
#
# Beat order (~27s, 16:9 1920x1080 24fps):
#   BEAT 1  (0:00-0:06.5)  VEO TACOMA HERO    veo-hero-a + veo-hero-b    ~6.5s
#   BEAT 2  (0:06.5-0:09.5) Cover macro        clip-cover-a-surface       trim 0.2-3.2s (3s)
#   BEAT 3  (0:09.5-0:12.5) Latch/buckle       clip-latch-v6              trim 0.5-3.5s (3s)
#   BEAT 4  (0:12.5-0:15.5) Fold-open          clip-cover-f-foldopen      trim 0.5-3.5s (3s)
#   BEAT 5  (0:15.5-0:18.0) Security lot       clip-new-security          trim 0-2.5s   (2.5s)
#   BEAT 6  (0:18.0-0:20.5) LED bed            clip-h1-led-reveal         trim 1.0-3.5s (2.5s, portrait crop)
#   BEAT 7  (0:20.5-0:23.0) Value-line card    ImageMagick static         2.5s  [WHITE ONLY — no yellow]
#   BEAT 8  (0:23.0-0:26.0) End card           ImageMagick static         3.0s  [yellow CTA only]
#   BEAT 9  (0:26.0-0:28.0) Stehlen logo close ImageMagick static         2.0s  [Armordillo-style centered]
#
# Total: ~28s
#
# Grade: identical teal-shadow/warm-mid film chain on all clips.
# Grain: noise=alls=12:allf=t+u (~12% organic grain) on every clip.
# Vignette: PI/5 on every clip.
# Music: Kevin MacLeod "Industrial Cinematic" (CC-BY 3.0, ~73 BPM)
#         full spot -14 dBFS | fade-out last 4s over value-line → logo close
# =============================================================================

set -euo pipefail

FFMPEG="/opt/homebrew/bin/ffmpeg"
MAGICK="/opt/homebrew/bin/magick"
FFPROBE="/opt/homebrew/bin/ffprobe"
PROJ="/Users/ricky/Library/CloudStorage/OneDrive-Personal/Documents/Robome/Client/JL Concepts/Project/stehlenauto-vercel"
CLIPS="$PROJ/public/videos/spot-clips"
STOCK="$CLIPS/stock"
AUDIO="$CLIPS/audio"
FRAMES="$CLIPS/frames-v10"
LOGO="$PROJ/public/images/stehlen-logo.png"
TMP="/tmp/stehlen-spot-v10-assembly"
OUT="$CLIPS/stehlen-tacoma-tonneau-spot-v10.mp4"
VEO="$STOCK/openart-sample_0_1779872548345_acb2b1c5.mp4"

mkdir -p "$TMP" "$FRAMES"

echo "==================================================================="
echo "STEHLEN TACOMA TONNEAU SPOT v10 — Assembly"
echo "Director: Carter Voss"
echo ""
echo "HERO: Veo 3.1 real-looking Tacoma (openart clip)"
echo "  Strip audio | upscale 720p→1080p | grade+grain+vignette"
echo "  Parked identity (0.0-0.9s) + desert drive (2.2-7.8s) = ~6.5s"
echo "ALL AI product beats + cards reused from v9 pipeline unchanged."
echo "v9 left intact."
echo "==================================================================="
echo ""

# ---------------------------------------------------------------------------
# FILTER BUILDING BLOCKS (inherited from v9, unchanged)
# ---------------------------------------------------------------------------
GRAIN="noise=alls=12:allf=t+u"
VIGNETTE="vignette=PI/5"

# AI_GRADE: teal-shadow/warm-mid — used on all AI beats AND veo hero for unity
AI_GRADE="curves=r='0/0 0.25/0.23 1/1':b='0/0 0.25/0.27 1/1'"
SCALE="scale=1920:1080:flags=lanczos,setsar=1"

# ---------------------------------------------------------------------------
# STEP 1: Process Veo hero — two segments, joined, graded
# Segment A: 0.0s-0.9s (parked Tacoma identity, suburban golden-hour)
# Segment B: 2.2s-7.8s (desert highway, TACOMA badge, matte cover, motion)
# Both get: upscale 720→1080 (lanczos) + AI_GRADE + GRAIN + VIGNETTE + no audio
# ---------------------------------------------------------------------------
echo "[STEP 1] Processing Veo hero — segment A (parked, 0.0-0.9s)..."

$FFMPEG -y \
  -ss 0.0 -t 0.9 \
  -i "$VEO" \
  -vf "${SCALE},fps=24,${AI_GRADE},${GRAIN},${VIGNETTE}" \
  -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p \
  -an "$TMP/veo_seg_a.mp4" 2>&1 | tail -2
echo "  Veo seg-A done (parked 0.9s)."

echo "[STEP 1b] Processing Veo hero — segment B (desert drive, 2.2-7.8s)..."

$FFMPEG -y \
  -ss 2.2 -t 5.6 \
  -i "$VEO" \
  -vf "${SCALE},fps=24,${AI_GRADE},${GRAIN},${VIGNETTE}" \
  -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p \
  -an "$TMP/veo_seg_b.mp4" 2>&1 | tail -2
echo "  Veo seg-B done (drive 5.6s)."

echo "[STEP 1c] Joining Veo segments into hero beat..."

printf "file '%s'\n" "$TMP/veo_seg_a.mp4" > "$TMP/veo_concat.txt"
printf "file '%s'\n" "$TMP/veo_seg_b.mp4" >> "$TMP/veo_concat.txt"

$FFMPEG -y \
  -f concat -safe 0 -i "$TMP/veo_concat.txt" \
  -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p \
  -an "$TMP/beat1_veo_hero.mp4" 2>&1 | tail -2

VEO_DUR=$($FFPROBE -v error -show_entries format=duration -of csv=p=0 "$TMP/beat1_veo_hero.mp4" 2>/dev/null || echo "?")
echo "  Veo hero joined: ${VEO_DUR}s"
echo ""

# ---------------------------------------------------------------------------
# STEP 2: Process AI product beats (identical parameters to v9)
# ---------------------------------------------------------------------------
echo "[STEP 2] Processing AI product feature beats..."
echo ""

# BEAT 2: Cover macro — clip-cover-a-surface
# trim 0.2-3.2s — brighter first window, better light per brief direction
echo "  [beat2] Cover macro — clip-cover-a-surface 0.2-3.2s..."
$FFMPEG -y \
  -ss 0.2 -t 3.0 \
  -i "$CLIPS/clip-cover-a-surface.mp4" \
  -vf "${SCALE},fps=24,hue=s=0.75,eq=saturation=0.88,${AI_GRADE},${GRAIN},${VIGNETTE}" \
  -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p \
  -an "$TMP/beat2_cover_macro.mp4" 2>&1 | tail -2
echo "  [beat2] done."

# BEAT 3: Latch/buckle — clip-latch-v6
# trim 0.5-3.5s — hardware close, latch engagement
echo "  [beat3] AI latch — clip-latch-v6 0.5-3.5s..."
$FFMPEG -y \
  -ss 0.5 -t 3.0 \
  -i "$CLIPS/clip-latch-v6.mp4" \
  -vf "${SCALE},fps=24,${AI_GRADE},${GRAIN},${VIGNETTE}" \
  -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p \
  -an "$TMP/beat3_ai_latch.mp4" 2>&1 | tail -2
echo "  [beat3] done."

# BEAT 4: Fold-open — clip-cover-f-foldopen
# trim 0.5-3.5s — panels folding, bed access reveal
echo "  [beat4] AI fold-open — clip-cover-f-foldopen 0.5-3.5s..."
$FFMPEG -y \
  -ss 0.5 -t 3.0 \
  -i "$CLIPS/clip-cover-f-foldopen.mp4" \
  -vf "${SCALE},fps=24,hue=s=0.80,eq=saturation=0.90,${AI_GRADE},${GRAIN},${VIGNETTE}" \
  -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p \
  -an "$TMP/beat4_ai_foldopen.mp4" 2>&1 | tail -2
echo "  [beat4] done."

# BEAT 5: Security lot — clip-new-security
# trim 0-2.5s — cover closed/locked, parking lot context
echo "  [beat5] Tacoma security lot — clip-new-security 0-2.5s..."
$FFMPEG -y \
  -ss 0 -t 2.5 \
  -i "$CLIPS/clip-new-security.mp4" \
  -vf "${SCALE},fps=24,${AI_GRADE},${GRAIN},${VIGNETTE}" \
  -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p \
  -an "$TMP/beat5_ai_security.mp4" 2>&1 | tail -2
echo "  [beat5] done."

# BEAT 6: LED reveal — clip-h1-led-reveal (portrait, center-cropped)
# trim 1.0-3.5s (2.5s) — LED glow, premium bed lighting
echo "  [beat6] AI LED — clip-h1-led-reveal 1.0-3.5s (portrait crop)..."
$FFMPEG -y \
  -ss 1.0 -t 2.5 \
  -i "$CLIPS/clip-h1-led-reveal.mp4" \
  -vf "crop=1076:605:0:659,scale=1920:1080,setsar=1,fps=24,${AI_GRADE},${GRAIN},${VIGNETTE}" \
  -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p \
  -an "$TMP/beat6_ai_led.mp4" 2>&1 | tail -2
echo "  [beat6] done."

# ---------------------------------------------------------------------------
# STEP 3: Generate Value-Line Card (Beat 7, 2.5s)
# WHITE ONLY — no yellow. Yellow is reserved for end card CTA only.
# ---------------------------------------------------------------------------
echo ""
echo "[STEP 3] Generating value-line card (WHITE ONLY — no yellow)..."

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
  -an "$TMP/beat7_valueline.mp4" 2>&1 | tail -2
echo "  Value-line card done (white-only, 2.5s)."

# ---------------------------------------------------------------------------
# STEP 4: Generate End Card (Beat 8, 3s)
# Yellow CTA is the ONLY yellow in the entire spot.
# ---------------------------------------------------------------------------
echo ""
echo "[STEP 4] Generating end card (fitment + yellow CTA — only yellow)..."

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
  -an "$TMP/beat8_endcard.mp4" 2>&1 | tail -2
echo "  End card done (3s, #f5a823 CTA)."

# ---------------------------------------------------------------------------
# STEP 5: Generate Stehlen Logo Close (Beat 9, 2s)
# Armordillo-style: matte black (#0a0a0a) frame, wordmark large+centered.
# Logo: public/images/stehlen-logo.png (600x113, RGBA white wordmark)
# Scale to ~55% frame width (1056px) for prominent read.
# ---------------------------------------------------------------------------
echo ""
echo "[STEP 5] Generating Stehlen logo close (Armordillo-style, 2s)..."

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
  -an "$TMP/beat9_logoclose.mp4" 2>&1 | tail -2
echo "  Stehlen logo close done (2s, 1056px centered on black)."

# ---------------------------------------------------------------------------
# STEP 6: Verify all beat intermediates
# ---------------------------------------------------------------------------
echo ""
echo "[STEP 6] Verifying intermediates..."

ALL_OK=true
TOTAL_DUR=0
BEATS=(beat1_veo_hero beat2_cover_macro beat3_ai_latch beat4_ai_foldopen beat5_ai_security beat6_ai_led beat7_valueline beat8_endcard beat9_logoclose)

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
# STEP 7: Concatenate all beats (silent master)
# ---------------------------------------------------------------------------
echo ""
echo "[STEP 7] Concatenating to silent v10 master..."

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
  "$TMP/v10_silent.mp4" 2>&1 | tail -4

echo "  Silent master complete."

# ---------------------------------------------------------------------------
# STEP 8: Mix real music under the spot
# Kevin MacLeod "Industrial Cinematic" (CC-BY 3.0, ~73 BPM)
# Full spot at -14 dBFS | fade-out last 4s over value-line → logo close
# ---------------------------------------------------------------------------
echo ""
echo "[STEP 8] Mixing music track..."

VID_DUR=$($FFPROBE -v error -show_entries format=duration -of csv=p=0 "$TMP/v10_silent.mp4" 2>/dev/null)
echo "  Video duration: ${VID_DUR}s"
echo "  Music file: industrial-cinematic-kevin-macleod.mp3"

FADE_START=$(echo "$VID_DUR - 4" | bc 2>/dev/null || echo "24")
echo "  Music fade-out start: ${FADE_START}s (lasts 4s)"

$FFMPEG -y \
  -i "$TMP/v10_silent.mp4" \
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
# STEP 9: Final verification
# ---------------------------------------------------------------------------
echo ""
echo "[STEP 9] Final output verification..."

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
# STEP 10: Extract review frames from final cut
# frames-v10/ — includes frames FROM the Veo hero so upscale+grade is verifiable
# ---------------------------------------------------------------------------
echo ""
echo "[STEP 10] Extracting review frames..."

mkdir -p "$FRAMES"

# v10 beat midpoints in final output:
# beat1  Veo hero         0:00-0:06.5    mid-parked  = 0.45s  (in parked segment)
# beat1b Veo hero drive   0:00-0:06.5    mid-drive   = 3.75s  (in driving segment)
# beat2  cover macro      0:06.5-0:09.5  mid = 8.0s
# beat3  latch            0:09.5-0:12.5  mid = 11.0s
# beat4  fold-open        0:12.5-0:15.5  mid = 14.0s
# beat5  security         0:15.5-0:18.0  mid = 16.75s
# beat6  LED              0:18.0-0:20.5  mid = 19.25s
# beat7  value-line card  0:20.5-0:23.0  mid = 21.75s
# beat8  end card         0:23.0-0:26.0  mid = 24.5s
# beat9  logo close       0:26.0-0:28.0  mid = 27.0s

declare -a TS=(0.45 3.75 8.0 11.0 14.0 16.75 19.25 21.75 24.5 27.0)
declare -a NAMES=(
  "beat1-veo-hero-PARKED"
  "beat1-veo-hero-DRIVE"
  "beat2-cover-macro"
  "beat3-ai-latch"
  "beat4-ai-foldopen"
  "beat5-ai-security"
  "beat6-ai-led"
  "beat7-valueline-whiteonly"
  "beat8-endcard-yellowCTA"
  "beat9-logoclose-stehlen"
)

for i in "${!TS[@]}"; do
  TS_VAL="${TS[$i]}"
  NAME="${NAMES[$i]}"
  OUTF="$FRAMES/${NAME}.jpg"
  $FFMPEG -y -ss "$TS_VAL" -i "$OUT" -vframes 1 -q:v 2 "$OUTF" 2>/dev/null \
    && echo "  frame @ ${TS_VAL}s -> ${NAME}.jpg" \
    || echo "  WARNING: could not extract frame @ ${TS_VAL}s"
done

# Save static card references for layout/copy verification
cp "$TMP/valueline.jpg" "$FRAMES/valueline-card-full.jpg" 2>/dev/null && echo "  valueline-card saved."
cp "$TMP/endcard.jpg" "$FRAMES/endcard-full.jpg" 2>/dev/null && echo "  endcard saved."
cp "$TMP/logoclose.jpg" "$FRAMES/logoclose-full.jpg" 2>/dev/null && echo "  logo-close card saved."

echo ""
echo "==================================================================="
echo "V10 ASSEMBLY COMPLETE — Director: Carter Voss"
echo ""
echo "Output: $OUT"
echo "Frames: $FRAMES/"
echo ""
echo "Beat order / timecodes (v10):"
echo "  0:00-0:06.5   Beat 1   VEO TACOMA HERO   (openart Veo 3.1: parked+drive, upscaled, graded)"
echo "  0:06.5-0:09.5 Beat 2   Cover macro       (clip-cover-a-surface, brighter trim 0.2-3.2s)"
echo "  0:09.5-0:12.5 Beat 3   AI latch/buckle   (clip-latch-v6, hardware close)"
echo "  0:12.5-0:15.5 Beat 4   AI fold-open      (clip-cover-f-foldopen, bed access)"
echo "  0:15.5-0:18.0 Beat 5   AI security lot   (clip-new-security, locked cover)"
echo "  0:18.0-0:20.5 Beat 6   AI LED reveal     (clip-h1-led-reveal, portrait crop)"
echo "  0:20.5-0:23.0 Beat 7   Value-line card   [WHITE ONLY — no yellow]"
echo "  0:23.0-0:26.0 Beat 8   End card          [fitment + #f5a823 yellow CTA — only yellow]"
echo "  0:26.0-0:28.0 Beat 9   STEHLEN LOGO CLOSE [Armordillo-style, centered, 2s]"
echo ""
echo "Veo hero: audio stripped | 720p→1080p lanczos | AI_GRADE+GRAIN+VIGNETTE"
echo "Music: Kevin MacLeod 'Industrial Cinematic' (CC-BY 3.0)"
echo "  Full spot at -14 dBFS | fade-out last 4s (mid-value-line through logo close)"
echo ""
echo "Grade: teal-shadow/warm-mid | grain+vignette all beats"
echo "v9 untouched: $PROJ/public/videos/spot-clips/stehlen-tacoma-tonneau-spot-v9.mp4"
echo "==================================================================="
