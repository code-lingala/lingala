"""Insert the Google Analytics gtag (G-4C44NPN87W) on every HTML page, right
after the opening <head> tag. Idempotent: skips files that already carry the
measurement ID.
"""
from __future__ import annotations
import os, re, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GA_ID = "G-4C44NPN87W"
GA_SNIPPET = (
    "\n<!-- Google tag (gtag.js) -->\n"
    f'<script async src="https://www.googletagmanager.com/gtag/js?id={GA_ID}"></script>\n'
    "<script>\n"
    "  window.dataLayer = window.dataLayer || [];\n"
    "  function gtag(){dataLayer.push(arguments);}\n"
    "  gtag('js', new Date());\n"
    f"  gtag('config', '{GA_ID}');\n"
    "</script>"
)

HEAD_RE = re.compile(r'<head>')

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
    added = already = skipped = 0
    for path in paths:
        with open(path, "r", encoding="utf-8") as f:
            src = f.read()
        if GA_ID in src:
            already += 1
            continue
        if "<head>" not in src:
            skipped += 1
            continue
        new_src = HEAD_RE.sub("<head>" + GA_SNIPPET, src, count=1)
        with open(path, "w", encoding="utf-8") as f:
            f.write(new_src)
        added += 1
    print(f"Scanned: {len(paths)}")
    print(f"Added:   {added}")
    print(f"Already: {already}")
    print(f"Skipped: {skipped}")

if __name__ == "__main__":
    main()
