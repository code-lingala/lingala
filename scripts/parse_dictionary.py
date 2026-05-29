#!/usr/bin/env python3
#
# SOURCE / CREDIT: the dictionary (lingala.txt / Lingala_DICTIONARY.pdf) was
# compiled by Faith Mbudo. Our word bank is built on her work, with gratitude.
# https://www.academia.edu/37101214/Lingala_DICTIONARY
"""Parse the English->Lingala half of lingala.txt (an OCR'd dictionary) into
structured entries and emit two letter-grouped JSON indexes.

Source format per entry (may wrap across physical lines):
    headword  [sense-no.]  POS.  lingala-translation  [lingala-phonetic]  ...
We capture, per entry: en (headword), lingala (first translation), phonetic
(first bracketed group). The text is noisy OCR — this is best-effort.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "lingala.txt"

# English->Lingala section spans these 1-based line numbers (found by inspection).
EN_LIN_START, EN_LIN_END = 1128, 2859

POS = r"(?:n|v|adj|adv|prep|pron|conj|interj|num|art|abbr)"
# A physical line STARTS a new entry when: headword token(s), optional sense
# number, then a part-of-speech marker.
HEADWORD_RE = re.compile(rf"^([A-Za-z][A-Za-z'’.\- ]*?)\s+(?:\d+\.\s*)?{POS}\.\s", re.UNICODE)
PAGE_HDR_RE = re.compile(r"\d+\s*ENGLISH\s*[-–]\s*LINGALA\s*/\s*LINGALA\s*ENGLISH")
FIRST_POS_RE = re.compile(rf"(?:\d+\.\s*)?{POS}\.\s*")
BRACKET_RE = re.compile(r"\[([^\]]*)\]")


def clean_line(line: str) -> str:
    line = PAGE_HDR_RE.sub(" ", line)
    return line.strip()


def load_entries() -> list[str]:
    """Return raw per-entry strings (headword line + wrapped continuations)."""
    lines = SRC.read_text(encoding="utf-8").splitlines()
    section = [clean_line(l) for l in lines[EN_LIN_START - 1 : EN_LIN_END]]
    entries: list[str] = []
    buf = ""
    for ln in section:
        if not ln:
            continue
        if re.fullmatch(r"[A-Z]", ln):  # a lone letter divider
            continue
        if HEADWORD_RE.match(ln):
            if buf:
                entries.append(buf)
            buf = ln
        else:
            buf = f"{buf} {ln}".strip() if buf else ln
    if buf:
        entries.append(buf)
    return entries


def norm(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip(" \t-–—:;,/")


def parse_entry(raw: str) -> dict | None:
    m = HEADWORD_RE.match(raw)
    if not m:
        return None
    en = norm(m.group(1)).lower()
    rest = raw[m.end():]  # text after the first POS marker
    # Lingala translation = text up to the first bracket.
    bracket = BRACKET_RE.search(rest)
    phonetic = norm(bracket.group(1)) if bracket else ""
    lingala_raw = rest[: bracket.start()] if bracket else rest
    # Trim trailing example/sense fragments; keep the first translation chunk.
    lingala = norm(re.split(r"[:/]|\s\d+\.", lingala_raw)[0])
    # Drop parenthetical qualifiers like "(approximately)".
    lingala = norm(re.sub(r"\([^)]*\)", "", lingala))
    # Strip a leading sense number ("1. mabele" -> "mabele").
    lingala = norm(re.sub(r"^\d+\.\s*", "", lingala))
    if not en or not lingala or len(en) > 40:
        return None
    return {"en": en, "lingala": lingala, "phonetic": phonetic}


def group_by(entries: list[dict], key: str) -> dict:
    out: dict[str, list[dict]] = {}
    for e in entries:
        val = e.get(key, "")
        first = next((c for c in val.upper() if c.isalpha()), "#")
        out.setdefault(first, []).append(e)
    for letter in out:
        out[letter].sort(key=lambda e: e[key].lower())
    return dict(sorted(out.items()))


def main() -> None:
    raw_entries = load_entries()
    parsed = [p for r in raw_entries if (p := parse_entry(r))]
    # De-duplicate identical (en, lingala) pairs.
    seen, entries = set(), []
    for e in parsed:
        k = (e["en"], e["lingala"])
        if k not in seen:
            seen.add(k)
            entries.append(e)

    out_dir = ROOT / "dictionary"
    out_dir.mkdir(exist_ok=True)
    by_en = group_by(entries, "en")
    by_lin = group_by(entries, "lingala")
    (out_dir / "by-english.json").write_text(
        json.dumps(by_en, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    (out_dir / "by-lingala.json").write_text(
        json.dumps(by_lin, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    print(f"raw entry blocks : {len(raw_entries)}")
    print(f"parsed entries   : {len(parsed)}")
    print(f"unique entries   : {len(entries)}")
    print(f"by-english letters: {len(by_en)}  by-lingala letters: {len(by_lin)}")
    print("\nsample (by-english 'A'):")
    for e in by_en.get("A", [])[:6]:
        print("  ", e)


if __name__ == "__main__":
    main()
