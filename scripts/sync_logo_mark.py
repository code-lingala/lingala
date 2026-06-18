"""Drop the brand logo image next to the wordmark in the site-nav, and
above the tagline in the footer, on every page. Idempotent: skips files
that already carry the mark.

Uses /android-icon-192x192.png as the source — it's high-res so the
browser can scale it down cleanly to the nav (28px) and footer (52px).
"""
from __future__ import annotations
import os, re, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOGO_SRC = "/android-icon-192x192.png"

# Nav: add <img> as first child of <a class="site-logo">.
NAV_NEEDLE = '<a class="site-logo" href="/">Lingala</a>'
NAV_REPL   = (
    f'<a class="site-logo" href="/"><img src="{LOGO_SRC}" '
    'alt="" class="site-logo-mark" width="28" height="28">Lingala</a>'
)

# Footer: insert <img> right after <footer class="site-footer"> opening tag.
FOOTER_OPEN_RE = re.compile(r'<footer class="site-footer">\s*\n(\s*)<p class="footer-tagline"')
FOOTER_OPEN_REPL = (
    r'<footer class="site-footer">\n'
    rf'  <img src="{LOGO_SRC}" alt="Lingala" class="footer-logo" width="52" height="52">\n'
    r'\1<p class="footer-tagline"'
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
    nav_added = footer_added = 0
    for path in paths:
        with open(path, "r", encoding="utf-8") as f:
            src = f.read()
        new = src

        if 'class="site-logo-mark"' not in new:
            new2 = new.replace(NAV_NEEDLE, NAV_REPL, 1)
            if new2 != new:
                nav_added += 1
            new = new2

        if 'class="footer-logo"' not in new:
            new2 = FOOTER_OPEN_RE.sub(FOOTER_OPEN_REPL, new, count=1)
            if new2 != new:
                footer_added += 1
            new = new2

        if new != src:
            with open(path, "w", encoding="utf-8") as f:
                f.write(new)
    print(f"Scanned:        {len(paths)}")
    print(f"Nav logos:      {nav_added}")
    print(f"Footer logos:   {footer_added}")
    from _run_sync_dates import run
    run()

if __name__ == "__main__":
    main()
