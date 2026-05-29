"""Generate the Lingala brand logo set.

Outputs (into /assets/logo/):
  - icon.svg              square icon mark (the navy block with "L" + gold dot + laterite bar)
  - wordmark.svg          horizontal "LINGALA" wordmark (transparent background)
  - logo.svg              icon + wordmark side-by-side (transparent background)
  - logo-stacked.svg      icon above wordmark
  - icon-512.png          512x512 PNG raster of icon.svg
  - icon-1024.png         1024x1024 PNG raster
  - wordmark-1024.png     transparent wordmark, 1024 wide
  - logo-1024.png         icon + wordmark combo, 1024 wide

The wordmark is drawn from a system font (Outfit Black if available, else
Helvetica/Arial heavy). For pixel-perfect web use prefer the SVG outputs.
"""
from __future__ import annotations
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "logo")
os.makedirs(OUT, exist_ok=True)

# DRC-rooted palette — matches site.css and the PWA icons.
NAVY    = "#08182E"
INK     = "#F0F4FA"
GOLD    = "#E0AF1E"
CRIMSON = "#C8202A"

# --------- SVG outputs ---------
def write(path, content):
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("wrote", os.path.relpath(path, ROOT))

ICON_SVG = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="Lingala">
  <rect width="512" height="512" rx="96" fill="{NAVY}"/>
  <!-- The bold L -->
  <path d="M150 110 L150 360 L362 360 L362 320 L194 320 L194 110 Z" fill="{INK}"/>
  <!-- DRC-gold accent dot, top right -->
  <circle cx="396" cy="118" r="22" fill="{GOLD}"/>
  <!-- Laterite/crimson grounding bar beneath the L -->
  <rect x="186" y="395" width="140" height="14" rx="7" fill="{CRIMSON}"/>
</svg>
'''

# Wordmark: "LINGALA" letter by letter in tracked uppercase, vector-style.
# We approximate the Outfit Black weight using stroked text in SVG; for true
# fidelity the SVG references the Outfit web font that's already on the page.
WORDMARK_W, WORDMARK_H = 1280, 320
WORDMARK_SVG = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {WORDMARK_W} {WORDMARK_H}" role="img" aria-label="LINGALA">
  <defs>
    <style>
      .word {{ font-family: 'Outfit', 'Helvetica Neue', Arial, sans-serif; font-weight: 900; letter-spacing: 0.18em; }}
    </style>
  </defs>
  <text class="word" x="{WORDMARK_W/2}" y="{WORDMARK_H/2 + 60}" text-anchor="middle" font-size="200" fill="{INK}">LINGALA</text>
</svg>
'''

LOGO_W, LOGO_H = 1600, 400
LOGO_SVG = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {LOGO_W} {LOGO_H}" role="img" aria-label="Lingala">
  <defs>
    <style>
      .word {{ font-family: 'Outfit', 'Helvetica Neue', Arial, sans-serif; font-weight: 900; letter-spacing: 0.18em; }}
    </style>
  </defs>
  <!-- Icon block on the left -->
  <g transform="translate(40 60) scale(0.55)">
    <rect width="512" height="512" rx="96" fill="{NAVY}"/>
    <path d="M150 110 L150 360 L362 360 L362 320 L194 320 L194 110 Z" fill="{INK}"/>
    <circle cx="396" cy="118" r="22" fill="{GOLD}"/>
    <rect x="186" y="395" width="140" height="14" rx="7" fill="{CRIMSON}"/>
  </g>
  <!-- Wordmark on the right -->
  <text class="word" x="370" y="265" font-size="200" fill="{NAVY}">LINGALA</text>
</svg>
'''

STACK_W, STACK_H = 600, 800
LOGO_STACKED_SVG = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {STACK_W} {STACK_H}" role="img" aria-label="Lingala">
  <defs>
    <style>
      .word {{ font-family: 'Outfit', 'Helvetica Neue', Arial, sans-serif; font-weight: 900; letter-spacing: 0.18em; }}
    </style>
  </defs>
  <!-- Icon centred top -->
  <g transform="translate(140 80) scale(0.625)">
    <rect width="512" height="512" rx="96" fill="{NAVY}"/>
    <path d="M150 110 L150 360 L362 360 L362 320 L194 320 L194 110 Z" fill="{INK}"/>
    <circle cx="396" cy="118" r="22" fill="{GOLD}"/>
    <rect x="186" y="395" width="140" height="14" rx="7" fill="{CRIMSON}"/>
  </g>
  <!-- Wordmark below -->
  <text class="word" x="{STACK_W/2}" y="700" text-anchor="middle" font-size="110" fill="{NAVY}">LINGALA</text>
</svg>
'''

write(os.path.join(OUT, "icon.svg"), ICON_SVG)
write(os.path.join(OUT, "wordmark.svg"), WORDMARK_SVG)
write(os.path.join(OUT, "logo.svg"), LOGO_SVG)
write(os.path.join(OUT, "logo-stacked.svg"), LOGO_STACKED_SVG)

# --------- PNG outputs via PIL ---------
def find_font(size, bold=True):
    paths = [
        "/System/Library/Fonts/Supplemental/Arial Black.ttf",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "/Library/Fonts/Outfit-Black.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/System/Library/Fonts/Supplemental/Helvetica.ttc",
    ]
    for p in paths:
        if os.path.exists(p):
            try: return ImageFont.truetype(p, size)
            except Exception: pass
    return ImageFont.load_default()

def hex_to_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

def render_icon_png(size):
    img = Image.new("RGBA", (size, size), hex_to_rgb(NAVY) + (255,))
    d = ImageDraw.Draw(img)
    # Rounded corners — round-clip via mask.
    radius = int(size * 96 / 512)
    mask = Image.new("L", (size, size), 0)
    md = ImageDraw.Draw(mask)
    md.rounded_rectangle([0, 0, size, size], radius=radius, fill=255)
    img.putalpha(mask)

    # L shape — approximated as two rects.
    L = lambda v: int(v * size / 512)
    d.rectangle([L(150), L(110), L(194), L(360)], fill=hex_to_rgb(INK) + (255,))
    d.rectangle([L(150), L(320), L(362), L(360)], fill=hex_to_rgb(INK) + (255,))

    # Gold dot top-right.
    cx, cy, rr = L(396), L(118), L(22)
    d.ellipse([cx-rr, cy-rr, cx+rr, cy+rr], fill=hex_to_rgb(GOLD) + (255,))

    # Crimson bar under L.
    d.rounded_rectangle([L(186), L(395), L(326), L(409)], radius=L(7), fill=hex_to_rgb(CRIMSON) + (255,))
    return img

def render_wordmark_png(width, color=INK, bg=None):
    h = int(width * WORDMARK_H / WORDMARK_W)
    img = Image.new("RGBA", (width, h), (0,0,0,0) if bg is None else hex_to_rgb(bg)+(255,))
    d = ImageDraw.Draw(img)
    # Tracked uppercase by drawing char-by-char.
    text = "LINGALA"
    font_size = int(h * 0.55)
    f = find_font(font_size, bold=True)
    # measure with tracking
    track = int(font_size * 0.18)
    char_widths = [d.textbbox((0, 0), c, font=f)[2] for c in text]
    total = sum(char_widths) + track * (len(text) - 1)
    x = (width - total) // 2
    y = (h - font_size) // 2 - int(font_size * 0.05)
    for i, c in enumerate(text):
        d.text((x, y), c, fill=hex_to_rgb(color) + (255,), font=f)
        x += char_widths[i] + track
    return img

def render_combo_png(width=1024, color=NAVY):
    h = int(width * 250 / 1024)
    icon_size = int(h * 0.95)
    img = Image.new("RGBA", (width, h), (0,0,0,0))
    icon = render_icon_png(icon_size)
    pad = int(width * 0.025)
    img.paste(icon, (pad, (h - icon_size) // 2), icon)
    # Wordmark on the right
    word_w = width - icon_size - pad * 3
    wm = render_wordmark_png(word_w, color=color)
    wm_h = wm.size[1]
    img.paste(wm, (icon_size + pad * 2, (h - wm_h) // 2), wm)
    return img

def save(img, path):
    img.save(path, "PNG", optimize=True)
    print("wrote", os.path.relpath(path, ROOT))

save(render_icon_png(512),  os.path.join(OUT, "icon-512.png"))
save(render_icon_png(1024), os.path.join(OUT, "icon-1024.png"))
save(render_wordmark_png(1024, color=INK),          os.path.join(OUT, "wordmark-1024.png"))
save(render_wordmark_png(1024, color=NAVY),         os.path.join(OUT, "wordmark-1024-dark.png"))
save(render_combo_png(1024, color=NAVY),            os.path.join(OUT, "logo-1024.png"))
save(render_combo_png(1024, color=INK),             os.path.join(OUT, "logo-1024-onnavy.png"))

print()
print("All logo assets written to", os.path.relpath(OUT, ROOT))
