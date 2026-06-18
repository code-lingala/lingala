"""One-shot sync across all 1,342 pages:

1. Hook up the new favicon set (apple-touch-icon sizes 57→180, png favicons
   16/32/96, android 192, ms-tile meta) — replaces the old single-line
   `<link rel="apple-touch-icon" href="/icon-180.png">` references.
2. Ensure <link rel="manifest" href="/manifest.json"> is present.
3. Swap the now-retired nkoyi theme dot button to the new paper theme
   button (so the third swatch in the nav actually maps to a real theme).

Idempotent: a "REAL-FAVICONS" marker is inserted alongside the block so
the script can recognise + skip pages that already carry it.
"""
from __future__ import annotations
import os, re, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

MARKER = "<!-- favicons:start -->"
FAVICON_BLOCK = MARKER + """
<link rel="apple-touch-icon" sizes="57x57" href="/apple-icon-57x57.png">
<link rel="apple-touch-icon" sizes="60x60" href="/apple-icon-60x60.png">
<link rel="apple-touch-icon" sizes="72x72" href="/apple-icon-72x72.png">
<link rel="apple-touch-icon" sizes="76x76" href="/apple-icon-76x76.png">
<link rel="apple-touch-icon" sizes="114x114" href="/apple-icon-114x114.png">
<link rel="apple-touch-icon" sizes="120x120" href="/apple-icon-120x120.png">
<link rel="apple-touch-icon" sizes="144x144" href="/apple-icon-144x144.png">
<link rel="apple-touch-icon" sizes="152x152" href="/apple-icon-152x152.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-icon-180x180.png">
<link rel="icon" type="image/png" sizes="192x192" href="/android-icon-192x192.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="shortcut icon" href="/favicon.ico">
<link rel="manifest" href="/manifest.json">
<meta name="msapplication-TileColor" content="#08182E">
<meta name="msapplication-TileImage" content="/ms-icon-144x144.png">
<meta name="msapplication-config" content="/browserconfig.xml">
<!-- favicons:end -->"""

# Old singletons to delete site-wide if found (they'll be replaced by the block above).
OLD_LINES = [
    re.compile(r'\s*<link rel="apple-touch-icon" href="[^"]+">\n?'),
    re.compile(r'\s*<link rel="manifest" href="[^"]+">\n?'),
    re.compile(r'\s*<link rel="icon" type="image/png" sizes="[^"]*" href="/icon-\d+\.png">\n?'),
    re.compile(r'\s*<link rel="shortcut icon" href="/favicon\.ico">\n?'),
]

NKOYI_BTN_RE = re.compile(
    r'<button class="theme-dot t-nkoyi"[^>]*></button>'
)
PAPER_BTN = (
    '<button class="theme-dot t-paper" data-theme-btn="paper" type="button" '
    'aria-label="Paper — DRC flag accents"></button>'
)

def collect():
    paths = []
    for p in glob.glob(os.path.join(ROOT, "*.html")):
        paths.append(p)
    for p in glob.glob(os.path.join(ROOT, "verbs", "*.html")):
        paths.append(p)
    for p in glob.glob(os.path.join(ROOT, "dictionary", "*.html")):
        paths.append(p)
    return paths

def patch_favicons(src):
    # If we've already inserted the marker, refresh the block in case it
    # changed; if not, strip the legacy lines then insert before </head>.
    if MARKER in src:
        return re.sub(
            re.escape(MARKER) + r".*?<!-- favicons:end -->",
            FAVICON_BLOCK, src, count=1, flags=re.DOTALL
        )
    cleaned = src
    for pat in OLD_LINES:
        cleaned = pat.sub("", cleaned)
    return cleaned.replace("</head>", FAVICON_BLOCK + "\n</head>", 1)

def patch_theme_btn(src):
    return NKOYI_BTN_RE.sub(PAPER_BTN, src)

def main():
    paths = collect()
    fav_added = theme_swapped = 0
    for path in paths:
        with open(path, "r", encoding="utf-8") as f:
            src = f.read()
        had_marker = MARKER in src
        had_nkoyi = "t-nkoyi" in src
        new_src = patch_favicons(src)
        new_src = patch_theme_btn(new_src)
        if new_src == src:
            continue
        if not had_marker:
            fav_added += 1
        if had_nkoyi:
            theme_swapped += 1
        with open(path, "w", encoding="utf-8") as f:
            f.write(new_src)
    print(f"Scanned:           {len(paths)}")
    print(f"Favicon installed: {fav_added}")
    print(f"Theme btn swapped: {theme_swapped}")
    from _run_sync_dates import run
    run()

if __name__ == "__main__":
    main()
