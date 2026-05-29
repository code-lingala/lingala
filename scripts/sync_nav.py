"""Replace every <div class="nav-links">...</div> block with a single
canonical nav block, so every page (top-level + verbs/* + dictionary/*)
ships the same ordered, fully data-i18n-tagged nav.

Order: Dictionary · Verbs · Count · Find your name · About.
"""
from __future__ import annotations
import os, re, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

CANONICAL_NAV = (
    '<div class="nav-links">'
    '<a href="/dictionary.html" data-i18n="nav.dictionary">Dictionary</a>'
    '<a href="/verbs.html" data-i18n="nav.verbs">Verbs</a>'
    '<a href="/count.html" data-i18n="nav.count">Count</a>'
    '<a href="/name.html" data-i18n="nav.name">Find your name</a>'
    '<a href="/about.html" data-i18n="nav.about">About</a>'
    '</div>'
)

NAV_RE = re.compile(r'<div class="nav-links">.*?</div>', re.DOTALL)

def collect_html_files():
    paths = []
    for p in glob.glob(os.path.join(ROOT, "*.html")):
        paths.append(p)
    for p in glob.glob(os.path.join(ROOT, "verbs", "*.html")):
        paths.append(p)
    for p in glob.glob(os.path.join(ROOT, "dictionary", "*.html")):
        paths.append(p)
    return paths

def main():
    paths = collect_html_files()
    swapped = unchanged = nonav = 0
    for path in paths:
        with open(path, "r", encoding="utf-8") as f:
            src = f.read()
        if '<div class="nav-links">' not in src:
            nonav += 1
            continue
        new_src = NAV_RE.sub(CANONICAL_NAV, src, count=1)
        if new_src == src:
            unchanged += 1
            continue
        with open(path, "w", encoding="utf-8") as f:
            f.write(new_src)
        swapped += 1
    print(f"Files scanned: {len(paths)}")
    print(f"Nav swapped:   {swapped}")
    print(f"Unchanged:     {unchanged}")
    print(f"No nav-links:  {nonav}")

if __name__ == "__main__":
    main()
