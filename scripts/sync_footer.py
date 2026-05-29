"""Replace the <footer class='site-footer'>...</footer> block on every HTML
page with one canonical version, so every page (top-level + verbs/* +
dictionary/*) ships the same footer with the same i18n attributes and the
same version chip.

The version chip text is read from the canonical footer below — bump it
here when shipping a release.
"""
from __future__ import annotations
import os, re, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

CANONICAL_FOOTER = """<footer class="site-footer">
  <p class="footer-tagline" data-i18n="footer.tagline">Keep Lingala alive — for Congolese everywhere · 🇨🇩</p>
  <div class="footer-links">
    <a href="/about.html" data-i18n="footer.about">About</a><span class="sep">·</span>
    <a href="/privacy.html" data-i18n="footer.privacy">Privacy</a><span class="sep">·</span>
    <a href="/name.html" data-i18n="nav.name">Find your name</a><span class="sep">·</span>
    <a href="/count.html" data-i18n="nav.count">Count</a><span class="sep">·</span>
    <a href="/verbs.html" data-i18n="nav.verbs">Verbs</a><span class="sep">·</span>
    <a href="/dictionary.html" data-i18n="nav.dictionary">Dictionary</a><span class="sep">·</span>
    <a href="mailto:artivicolab@gmail.com" data-i18n="footer.contact">Contact</a>
  </div>
  <div class="footer-copyright">© <span id="year">2026</span> · <span data-i18n="footer.made">Made by a Congolese, for Congolese everywhere</span> <span class="pulse-heart" aria-hidden="true">♥</span> · <span class="footer-version">v2.62</span><br><span class="footer-rights">All rights reserved · <a href="https://artivicolab.com" target="_blank" rel="noopener">artivicolab.com</a> · by Gradi Kayamba</span></div>
</footer>"""

FOOTER_RE = re.compile(r'<footer class="site-footer">.*?</footer>', re.DOTALL)

def collect_html_files():
    paths = []
    # Top-level html files.
    for p in glob.glob(os.path.join(ROOT, "*.html")):
        paths.append(p)
    # Per-verb pages.
    for p in glob.glob(os.path.join(ROOT, "verbs", "*.html")):
        paths.append(p)
    # Per-word dictionary pages.
    for p in glob.glob(os.path.join(ROOT, "dictionary", "*.html")):
        paths.append(p)
    return paths

def main():
    paths = collect_html_files()
    swapped = unchanged = nofooter = 0
    for path in paths:
        with open(path, "r", encoding="utf-8") as f:
            src = f.read()
        if "<footer class=\"site-footer\">" not in src:
            nofooter += 1
            continue
        new_src = FOOTER_RE.sub(CANONICAL_FOOTER, src, count=1)
        if new_src == src:
            unchanged += 1
            continue
        with open(path, "w", encoding="utf-8") as f:
            f.write(new_src)
        swapped += 1
    print(f"Files scanned:  {len(paths)}")
    print(f"Footer swapped: {swapped}")
    print(f"Unchanged:      {unchanged}")
    print(f"No footer:      {nofooter}")

if __name__ == "__main__":
    main()
