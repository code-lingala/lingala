"""Add the nkoyi (leopard) theme swatch button to every page's nav, after
the blue+red pair. Idempotent: skips files that already carry the button.
"""
from __future__ import annotations
import os, re, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

NKOYI_BTN = (
    '<button class="theme-dot t-nkoyi" data-theme-btn="nkoyi" type="button" '
    'aria-label="Nkoyi — Leopard"></button>'
)

# Match the red theme button and append the nkoyi button right after it.
RED_RE = re.compile(
    r'(<button class="theme-dot t-red"[^>]*></button>)(?!\s*<button class="theme-dot t-nkoyi")'
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

def main():
    paths = collect()
    swapped = unchanged = nored = 0
    for path in paths:
        with open(path, "r", encoding="utf-8") as f:
            src = f.read()
        if 't-nkoyi' in src:
            unchanged += 1
            continue
        if 't-red' not in src:
            nored += 1
            continue
        new_src = RED_RE.sub(r'\1\n      ' + NKOYI_BTN, src, count=1)
        if new_src == src:
            unchanged += 1
            continue
        with open(path, "w", encoding="utf-8") as f:
            f.write(new_src)
        swapped += 1
    print(f"Scanned:   {len(paths)}")
    print(f"Added:     {swapped}")
    print(f"Unchanged: {unchanged}")
    print(f"No red btn: {nored}")
    from _run_sync_dates import run
    run()

if __name__ == "__main__":
    main()
