"""Keep article:modified_time, JSON-LD dateModified, and sitemap <lastmod> in
sync with the real last-modified time of every page referenced in sitemap.xml.

Source of truth, per file (in priority order):
  1. If the working tree has uncommitted changes to it -> today (UTC).
  2. If the file is untracked -> today (UTC).
  3. Otherwise -> the timestamp of the last commit that touched it.

Three locations are kept in sync per page:
  * <meta property="article:modified_time" content="...">    (ISO8601, e.g. 2026-06-17T12:30:00+00:00)
  * JSON-LD Article.dateModified                              (same ISO8601)
  * sitemap.xml <lastmod> for the matching <loc>              (YYYY-MM-DD)

Idempotent: pages that already have the correct timestamps are skipped.

Run from repo root, after any batch edit:
    python3 scripts/sync_dates.py
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent.parent
SITEMAP = ROOT / "sitemap.xml"

AMT_RE = re.compile(r'(<meta\s+property="article:modified_time"\s+content=")([^"]*)(")')
JSONLD_RE = re.compile(r'(<script type="application/ld\+json">)(.*?)(</script>)', re.DOTALL)


def today_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def today_date() -> str:
    return datetime.now(timezone.utc).strftime('%Y-%m-%d')


def git_last_commit_times() -> dict[str, str]:
    """Return {repo-relative-path: ISO8601 timestamp of last commit touching it}."""
    proc = subprocess.run(
        ['git', 'log', '--name-only', '--format=COMMIT:%cI', '--no-merges'],
        cwd=ROOT, capture_output=True, text=True, check=True,
    )
    times: dict[str, str] = {}
    current = None
    for line in proc.stdout.splitlines():
        if line.startswith('COMMIT:'):
            current = line[len('COMMIT:'):]
        elif line and current and line not in times:
            times[line] = current
    return times


def git_dirty_paths() -> set[str]:
    """Return repo-relative paths that are modified, added, or untracked."""
    proc = subprocess.run(
        ['git', 'status', '--porcelain'],
        cwd=ROOT, capture_output=True, text=True, check=True,
    )
    dirty: set[str] = set()
    for line in proc.stdout.splitlines():
        # status format: "XY path" or "XY orig -> new"
        if len(line) < 4:
            continue
        path = line[3:]
        if ' -> ' in path:
            path = path.split(' -> ', 1)[1]
        dirty.add(path)
    return dirty


def resolve_local_path(url: str) -> Path | None:
    """Map a <loc> URL to a local file under ROOT, or None if outside."""
    parsed = urlparse(url)
    path = parsed.path or '/'
    if path.endswith('/'):
        path += 'index.html'
    rel = path.lstrip('/')
    candidate = ROOT / rel
    if candidate.is_file():
        return candidate
    return None


def patch_html(path: Path, iso_ts: str) -> bool:
    src = path.read_text(encoding='utf-8')
    new = src

    def amt_sub(m: re.Match) -> str:
        return m.group(1) + iso_ts + m.group(3)
    new = AMT_RE.sub(amt_sub, new)

    def jsonld_sub(m: re.Match) -> str:
        body = m.group(2)
        try:
            data = json.loads(body)
        except json.JSONDecodeError:
            return m.group(0)
        graph = data.get('@graph', [data]) if isinstance(data, dict) else data
        nodes = graph if isinstance(graph, list) else [graph]
        touched = False
        for node in nodes:
            if not isinstance(node, dict):
                continue
            if 'dateModified' in node:
                if node['dateModified'] != iso_ts:
                    node['dateModified'] = iso_ts
                    touched = True
        if not touched:
            return m.group(0)
        return m.group(1) + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + m.group(3)
    new = JSONLD_RE.sub(jsonld_sub, new)

    if new == src:
        return False
    path.write_text(new, encoding='utf-8')
    return True


def main() -> int:
    if not SITEMAP.is_file():
        print(f'No sitemap at {SITEMAP}', file=sys.stderr)
        return 1

    commit_times = git_last_commit_times()
    dirty = git_dirty_paths()
    today_t = today_iso()
    today_d = today_date()

    sitemap_src = SITEMAP.read_text(encoding='utf-8')

    # Iterate every <url> block so we can update its <lastmod> in place.
    url_block_re = re.compile(r'(<url>)(.*?)(</url>)', re.DOTALL)
    loc_re = re.compile(r'<loc>([^<]+)</loc>')
    lastmod_re = re.compile(r'(<lastmod>)([^<]+)(</lastmod>)')

    pages_changed = 0
    pages_seen = 0
    sitemap_changed = 0
    missing_files = 0

    def block_sub(m: re.Match) -> str:
        nonlocal pages_changed, pages_seen, sitemap_changed, missing_files
        block = m.group(2)
        loc_m = loc_re.search(block)
        if not loc_m:
            return m.group(0)
        url = loc_m.group(1).strip()
        local = resolve_local_path(url)
        if not local:
            missing_files += 1
            return m.group(0)
        pages_seen += 1

        rel = str(local.relative_to(ROOT))
        if rel in dirty:
            iso_ts = today_t
            date_only = today_d
        elif rel in commit_times:
            iso_ts = commit_times[rel]
            date_only = iso_ts[:10]
        else:
            iso_ts = today_t
            date_only = today_d

        if patch_html(local, iso_ts):
            pages_changed += 1

        # Update <lastmod> in this <url> block.
        new_block, n = lastmod_re.subn(
            lambda lm: lm.group(1) + date_only + lm.group(3) if lm.group(2) != date_only else lm.group(0),
            block,
        )
        if new_block != block:
            sitemap_changed += 1
        return m.group(1) + new_block + m.group(3)

    new_sitemap = url_block_re.sub(block_sub, sitemap_src)
    if new_sitemap != sitemap_src:
        SITEMAP.write_text(new_sitemap, encoding='utf-8')

    print(f'Sitemap URLs scanned: {pages_seen}  (missing local file: {missing_files})')
    print(f'HTML pages with bumped dates: {pages_changed}')
    print(f'Sitemap <lastmod> entries bumped: {sitemap_changed}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
