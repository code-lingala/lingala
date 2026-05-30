#!/bin/bash
# Generate every icon/favicon size from a single master PNG.
#
# Usage: from the repo root, after saving the master logo to icon-512.png:
#   ./tools/gen-icons.sh
#
# Uses macOS's built-in `sips` — no install required.

set -e
cd "$(dirname "$0")/.."

MASTER="icon-512.png"
if [ ! -f "$MASTER" ]; then
  echo "Error: $MASTER not found. Save the master logo there first."
  exit 1
fi

echo "→ Generating PWA icons from $MASTER"
sips -z 192 192 "$MASTER" --out icon-192.png > /dev/null
sips -z 512 512 "$MASTER" --out icon-512.png > /dev/null
# Maskable: 512 with no padding (the badge already has built-in margin).
sips -z 512 512 "$MASTER" --out icon-512-maskable.png > /dev/null

echo "→ Generating favicons"
sips -z 16  16  "$MASTER" --out favicon-16x16.png > /dev/null
sips -z 32  32  "$MASTER" --out favicon-32x32.png > /dev/null
sips -z 96  96  "$MASTER" --out favicon-96x96.png > /dev/null

echo "→ Generating Apple touch icons"
for s in 57 60 72 76 114 120 144 152 180; do
  sips -z $s $s "$MASTER" --out "apple-icon-${s}x${s}.png" > /dev/null
done
sips -z 180 180 "$MASTER" --out apple-icon.png > /dev/null
sips -z 180 180 "$MASTER" --out apple-icon-precomposed.png > /dev/null
sips -z 180 180 "$MASTER" --out icon-180.png > /dev/null

echo "→ Generating Android icons"
for s in 36 48 72 96 144 192; do
  sips -z $s $s "$MASTER" --out "android-icon-${s}x${s}.png" > /dev/null
done

echo "→ Generating Windows tiles"
for s in 70 144 150 310; do
  sips -z $s $s "$MASTER" --out "ms-icon-${s}x${s}.png" > /dev/null
done

# OG image: 1200×630 with the logo centered on a navy field. sips can't
# compose, so we do this in two steps: scale logo to 600px, then use a
# Python one-liner to paste it onto a 1200×630 background.
echo "→ Generating Open Graph image (1200×630)"
sips -z 600 600 "$MASTER" --out og-logo-tmp.png > /dev/null
python3 - <<'PY' || echo "  (skipped — install Pillow for og-image: pip3 install Pillow)"
try:
    from PIL import Image
    bg = Image.new('RGB', (1200, 630), '#08182E')
    fg = Image.open('og-logo-tmp.png').convert('RGBA')
    x = (1200 - fg.width) // 2
    y = (630 - fg.height) // 2
    bg.paste(fg, (x, y), fg)
    bg.save('og-image.png', 'PNG')
    bg.save('og-image.jpg', 'JPEG', quality=92)
    print('  og-image.png + og-image.jpg ✓')
except ImportError:
    raise SystemExit(1)
PY
rm -f og-logo-tmp.png

echo "✓ All icons generated."
