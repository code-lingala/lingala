"""Rewrite the meta descriptions across dictionary/*.html.

The legacy generator built each description as
    "{lingala} means '{en}'. In French: {fr}. {culturalNote}"
and hard-truncated at ~250 raw chars, leaving snippets cut mid-word
("at the maquis (sma") and littered with em-dashes (banned in AI-written
copy per CLAUDE.md).

This rewrite, per page:
  * pulls the gloss / French / full cultural note from the page body
    (single source of truth, no risk of wordbank drift)
  * strips the redundant "Headword - Gloss." lead-in
  * replaces em / en dashes with commas
  * caps at 158 chars on a word boundary (never on punctuation)
  * writes the same string into all four locations: <meta description>,
    og:description, twitter:description, and the JSON-LD Article.description

Run from repo root:
    python3 scripts/fix_dictionary_descriptions.py
"""
from __future__ import annotations

import html
import json
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DICT_DIR = ROOT / "dictionary"
MAX_LEN = 158

WORD_HEAD_RE = re.compile(r'<h1 class="word-head">([^<]+)</h1>')
WORD_GLOSS_RE = re.compile(r'<p class="word-gloss">([^<]+)</p>')
WORD_FR_RE = re.compile(r'<p class="word-fr"><b>French:</b>\s*([^<]+)</p>')
WORD_NOTE_RE = re.compile(r'<p class="word-note">(.*?)</p>', re.DOTALL)

META_DESC_RE = re.compile(r'(<meta\s+name="description"\s+content=")([^"]*)(")')
OG_DESC_RE = re.compile(r'(<meta\s+property="og:description"\s+content=")([^"]*)(")')
TW_DESC_RE = re.compile(r'(<meta\s+name="twitter:description"\s+content=")([^"]*)(")')
JSONLD_RE = re.compile(r'(<script type="application/ld\+json">)(.*?)(</script>)', re.DOTALL)


def unescape(s: str) -> str:
    return html.unescape(s).strip()


def strip_tags(s: str) -> str:
    return re.sub(r'<[^>]+>', '', s)


def build_description(headword: str, gloss: str, french: str, note: str) -> str:
    note = strip_tags(note)
    note = unescape(note).replace('\n', ' ')
    # Strip the redundant "Madesu - beans." lead-in if present.
    lead = re.compile(
        rf'^\s*{re.escape(headword)}\s*[—–-]\s*{re.escape(gloss)}\s*[.:]?\s*',
        re.IGNORECASE,
    )
    note = lead.sub('', note)
    # Em / en dashes -> commas in AI-written copy.
    note = re.sub(r'\s*[—–]\s*', ', ', note)
    note = re.sub(r'\s+', ' ', note).strip()

    head_cap = headword[:1].upper() + headword[1:]
    head = f"{head_cap}: {gloss}"
    if french:
        head += f" (FR: {french})"
    head += " in Lingala."

    if not note:
        return head

    # Greedy assembly on sentence boundaries: include head, then add full
    # sentences while we still fit. A snippet that ends on a complete sentence
    # ("...at the maquis (small restaurant).") reads finished; one that ends on
    # "...is a national." reads truncated.
    sentences = re.findall(r'[^.!?]+[.!?]+', note)
    out = head
    for s in sentences:
        s = s.strip()
        if not s:
            continue
        candidate = out + ' ' + s
        if len(candidate) <= MAX_LEN:
            out = candidate
        else:
            break

    if out != head:
        return out

    # Even the first sentence overflows. Word-safe trim of just that sentence,
    # appended to the head, ending on "..." so the cut is honest.
    first = sentences[0].strip().rstrip('.!?')
    budget = MAX_LEN - len(head) - 5  # space + "..." + safety
    if budget < 20:
        return head
    trimmed = first[:budget].rsplit(' ', 1)[0].rstrip(' .,;:—–-')
    return f"{head} {trimmed}..."


def patch_file(path: Path) -> tuple[bool, str]:
    src = path.read_text(encoding='utf-8')

    h = WORD_HEAD_RE.search(src)
    g = WORD_GLOSS_RE.search(src)
    n = WORD_NOTE_RE.search(src)
    if not (h and g and n):
        return False, 'missing-body-fields'

    headword = unescape(h.group(1))
    gloss = unescape(g.group(1))
    fr_match = WORD_FR_RE.search(src)
    french = unescape(fr_match.group(1)) if fr_match else ''
    note = n.group(1)

    desc = build_description(headword, gloss, french, note)
    desc_attr = html.escape(desc, quote=True)

    new_src = src
    for pat in (META_DESC_RE, OG_DESC_RE, TW_DESC_RE):
        new_src, _ = pat.subn(lambda m: m.group(1) + desc_attr + m.group(3), new_src)

    def patch_jsonld(m: re.Match) -> str:
        body = m.group(2)
        try:
            data = json.loads(body)
        except json.JSONDecodeError:
            return m.group(0)
        graph = data.get('@graph', [data]) if isinstance(data, dict) else data
        for node in graph if isinstance(graph, list) else [graph]:
            if isinstance(node, dict) and node.get('@type') == 'Article' and 'description' in node:
                node['description'] = desc
        return m.group(1) + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + m.group(3)

    new_src = JSONLD_RE.sub(patch_jsonld, new_src)

    if new_src == src:
        return False, 'no-change'

    path.write_text(new_src, encoding='utf-8')
    return True, desc


def main(argv: list[str]) -> int:
    only = set(argv[1:])
    files = sorted(DICT_DIR.glob('*.html'))
    if only:
        files = [f for f in files if f.name in only or f.stem in only]
    if not files:
        print('No dictionary pages found.')
        return 1

    changed = 0
    skipped: dict[str, int] = {}
    samples: list[tuple[str, str]] = []
    for f in files:
        ok, info = patch_file(f)
        if ok:
            changed += 1
            if len(samples) < 5:
                samples.append((f.name, info))
        else:
            skipped[info] = skipped.get(info, 0) + 1

    print(f'Patched {changed} / {len(files)} dictionary pages.')
    for reason, count in skipped.items():
        print(f'  skipped ({reason}): {count}')
    if samples:
        print('\nSamples:')
        for name, desc in samples:
            print(f'  {name}: ({len(desc)}c) {desc}')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv))
