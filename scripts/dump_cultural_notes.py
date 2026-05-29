"""Dump all verb cultural notes (EN / FR / LN) to a single review file."""
import json, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BANK = os.path.join(ROOT, "lingala-wordbank-2.json")
OUT  = os.path.join(ROOT, "VERB_CULTURAL_NOTES_REVIEW.md")

def main():
    with open(BANK, "r", encoding="utf-8") as f:
        d = json.load(f)
    verbs = [w for w in d["words"] if (
        w.get("partOfSpeech") == "verb" and w.get("verified")
        and w.get("lingala", "").startswith("ko") and " " not in w.get("lingala", "")
    )]
    # Dedupe by lingala headword.
    seen, unique = set(), []
    for v in verbs:
        if v["lingala"] in seen: continue
        seen.add(v["lingala"]); unique.append(v)
    unique.sort(key=lambda v: v["lingala"])

    lines = [
        "# Verb cultural notes — review checklist",
        "",
        f"Total verbs: **{len(unique)}**",
        "",
        "For each verb, three notes (EN / FR / LN). Tick the language column when",
        "verified by a native or trusted source. Edit the text in-place if needed,",
        "then re-import via a merge script.",
        "",
        "| | EN | FR | LN |",
        "|---|---|---|---|",
        "| Author | seed (existing) | Claude draft | Claude draft (needs verification) |",
        "",
        "---",
        "",
    ]
    for i, v in enumerate(unique, 1):
        inf = v["lingala"]
        en  = (v.get("culturalNote") or "").strip()
        fr  = (v.get("culturalNoteFr") or "").strip()
        ln  = (v.get("culturalNoteLn") or "").strip()
        gloss_en = v.get("english", "")
        gloss_fr = v.get("french", "")
        lines += [
            f"## {i}. {inf}",
            f"_{gloss_en}_  ·  _{gloss_fr}_",
            "",
            "**EN** ☐",
            "",
            "```",
            en,
            "```",
            "",
            "**FR** ☐",
            "",
            "```",
            fr,
            "```",
            "",
            "**LN** ☐",
            "",
            "```",
            ln,
            "```",
            "",
            "---",
            "",
        ]
    with open(OUT, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"Wrote {OUT}  ({len(unique)} verbs)")

if __name__ == "__main__":
    main()
