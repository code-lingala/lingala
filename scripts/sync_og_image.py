"""Swap the global og-image.png reference to og-image.jpg site-wide.

Per-verb OG cards under /og/verbs/<slug>.png are left untouched — the regex
only matches the root-level og-image.png that was the default share preview.
"""
from __future__ import annotations
import os, re, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Only the root-level og-image.png — '/og-image.png' or full URL ending in it.
NEEDLE_RE = re.compile(r'(/og-image)\.png')

def collect():
    paths = []
    for p in glob.glob(os.path.join(ROOT, "*.html")):
        paths.append(p)
    for p in glob.glob(os.path.join(ROOT, "verbs", "*.html")):
        paths.append(p)
    for p in glob.glob(os.path.join(ROOT, "dictionary", "*.html")):
        paths.append(p)
    return paths

def main():
    paths = collect()
    updated = 0
    for path in paths:
        with open(path, "r", encoding="utf-8") as f:
            src = f.read()
        new = NEEDLE_RE.sub(r'\1.jpg', src)
        if new != src:
            with open(path, "w", encoding="utf-8") as f:
                f.write(new)
            updated += 1
    print(f"Scanned: {len(paths)}")
    print(f"Updated: {updated}")
    from _run_sync_dates import run
    run()

if __name__ == "__main__":
    main()
