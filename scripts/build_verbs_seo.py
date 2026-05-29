"""
Build per-verb OG cards (1200x630) and patch each /verbs/<slug>.html with
stronger SEO: keyword-rich title, richer description, Twitter Card meta,
BreadcrumbList JSON-LD, and per-verb og:image.

Run from repo root:
    python3 scripts/build_verbs_seo.py
"""
from __future__ import annotations

import json
import os
import re
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORDBANK = os.path.join(ROOT, "lingala-wordbank-2.json")
VERBS_DIR = os.path.join(ROOT, "verbs")
OG_DIR = os.path.join(ROOT, "og", "verbs")
SITE = "https://lingala.artivicolab.com"

# DRC-rooted palette (same as PWA icon).
BG       = (8, 24, 46)
INK      = (245, 240, 232)
INK_SOFT = (200, 210, 225)
ACCENT   = (224, 175, 30)   # DRC gold
CRIMSON  = (224, 85, 43)    # laterite

# -- font discovery -----------------------------------------------------------
def find_font(size, bold=False):
    bold_paths = [
        "/System/Library/Fonts/Supplemental/Arial Black.ttf",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
    ]
    paths = [
        "/System/Library/Fonts/Supplemental/Helvetica.ttc",
        "/System/Library/Fonts/Helvetica.ttc",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
    ]
    candidates = bold_paths if bold else paths
    for p in candidates:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                pass
    return ImageFont.load_default()

# -- conjugation engine (mirrors js/conjugate.js) -----------------------------
def stem(inf):
    inf = (inf or "").strip().lower()
    return inf[2:] if inf.startswith("ko") else inf

def present_1sg(s):
    return "na-" + s

def present_cont_1sg(s):
    return "na-zo-" + s

def past_1sg(s):
    return "na-" + (s + "ki" if s.endswith("a") else s + "i")

def future_1sg(s):
    return "na-ko-" + s

def habitual_1sg(s):
    return "na-" + (s + "ka" if s.endswith("a") else s + "aka")

def negative_1sg(s):
    return "na-" + s + " te"

# Build the headline English verb from the gloss.
# "to paint / to coat" -> "paint";  "to be at / to live" -> "be at"
def bare_en(gloss):
    if not gloss:
        return "do something"
    g = gloss.strip()
    # take the first slash-separated alternative
    g = re.split(r"\s*[/,;]\s*", g)[0].strip()
    # drop a leading "to "
    if g.lower().startswith("to "):
        g = g[3:]
    return g.strip() or "do something"

# Subject metadata: pronoun, English subject text, 3sg flag, "to be" form.
SUBJECTS = [
    {"code": "1sg", "i18n": "vp.subj.1sg", "pronoun": "ngai",  "en": "I",       "fr": "Je",         "label": "I",          "is_3sg": False, "be": "am"},
    {"code": "2sg", "i18n": "vp.subj.2sg", "pronoun": "yo",    "en": "You",     "fr": "Tu",         "label": "you",        "is_3sg": False, "be": "are"},
    {"code": "3sg", "i18n": "vp.subj.3sg", "pronoun": "ye",    "en": "He/she",  "fr": "Il/elle",    "label": "he / she",   "is_3sg": True,  "be": "is"},
    {"code": "1pl", "i18n": "vp.subj.1pl", "pronoun": "biso",  "en": "We",      "fr": "Nous",       "label": "we",         "is_3sg": False, "be": "are"},
    {"code": "2pl", "i18n": "vp.subj.2pl", "pronoun": "bino",  "en": "You all", "fr": "Vous",       "label": "you (pl.)",  "is_3sg": False, "be": "are"},
    {"code": "3pl", "i18n": "vp.subj.3pl", "pronoun": "bango", "en": "They",    "fr": "Ils/elles",  "label": "they",       "is_3sg": False, "be": "are"},
]

IRREGULAR_3SG = {
    "be": "is", "have": "has", "do": "does", "go": "goes", "say": "says",
}

def present_3sg_en(base):
    head = base.split(" ")[0].lower()
    if head in IRREGULAR_3SG:
        return base.replace(head, IRREGULAR_3SG[head], 1)
    if head.endswith(("s", "x", "z")) or head.endswith(("ch", "sh")):
        return base.replace(head, head + "es", 1)
    if len(head) > 1 and head.endswith("y") and head[-2] not in "aeiou":
        return base.replace(head, head[:-1] + "ies", 1)
    return base.replace(head, head + "s", 1)

IRREGULAR_PAST = {
    "be": "was", "do": "did", "have": "had", "go": "went", "say": "said",
    "see": "saw", "come": "came", "take": "took", "make": "made", "get": "got",
    "give": "gave", "find": "found", "think": "thought", "know": "knew",
    "want": "wanted", "tell": "told", "feel": "felt", "leave": "left",
    "put": "put", "let": "let", "begin": "began", "show": "showed",
    "hear": "heard", "speak": "spoke", "buy": "bought", "bring": "brought",
    "build": "built", "sit": "sat", "stand": "stood", "lie": "lay",
    "sleep": "slept", "eat": "ate", "drink": "drank", "drive": "drove",
    "fall": "fell", "fly": "flew", "hold": "held", "lose": "lost",
    "meet": "met", "pay": "paid", "read": "read", "ride": "rode",
    "run": "ran", "sell": "sold", "send": "sent", "sing": "sang",
    "swim": "swam", "teach": "taught", "throw": "threw", "wake": "woke",
    "wear": "wore", "win": "won", "write": "wrote", "cut": "cut",
    "hit": "hit", "shut": "shut", "spread": "spread", "cost": "cost",
    "spend": "spent", "fight": "fought", "catch": "caught",
}

def past_en(base):
    head = base.split(" ")[0].lower()
    if head in IRREGULAR_PAST:
        return base.replace(head, IRREGULAR_PAST[head], 1)
    if head.endswith("e"):
        return base.replace(head, head + "d", 1)
    # consonant + y -> -ied
    if len(head) > 1 and head.endswith("y") and head[-2] not in "aeiou":
        return base.replace(head, head[:-1] + "ied", 1)
    return base.replace(head, head + "ed", 1)

def ing_en(base):
    head = base.split(" ")[0].lower()
    if head.endswith("ie"):
        return base.replace(head, head[:-2] + "ying", 1)
    if head.endswith("e") and len(head) > 2:
        return base.replace(head, head[:-1] + "ing", 1)
    return base.replace(head, head + "ing", 1)

# Conjugation for all 6 subjects across each tense (mirrors js/conjugate.js).
def conjugate_all(s):
    out = {"Present": [], "Present continuous": [], "Past": [], "Future": [],
           "Habitual": [], "Negative (present)": []}
    for subj in SUBJECTS:
        p = subj["pronoun"]
        # Subject prefix (na/o/a/to/bo/ba)
        sp = {"ngai": "na", "yo": "o", "ye": "a", "biso": "to", "bino": "bo", "bango": "ba"}[p]
        past_body = (s + "ki") if s.endswith("a") else (s + "i")
        habit_body = (s + "ka") if s.endswith("a") else (s + "aka")
        out["Present"].append(f"{sp}-{s}")
        out["Present continuous"].append(f"{sp}-zo-{s}")
        out["Past"].append(f"{sp}-{past_body}")
        out["Future"].append(f"{sp}-ko-{s}")
        out["Habitual"].append(f"{sp}-{habit_body}")
        out["Negative (present)"].append(f"{sp}-{s} te")
    return out

def en_example(tense, subj, base, pred=""):
    # English sentence per subject + tense — handles 3sg agreement & "be".
    # `pred` is the object/complement carried over from the wordbank example
    # (e.g. "the wall white"), so sentences read as full thoughts.
    pron = subj["en"]
    tail = f" {pred}" if pred else ""
    if tense == "Present":
        verb = present_3sg_en(base) if subj["is_3sg"] else base
        return f"{pron} {verb}{tail}."
    if tense == "Present continuous":
        return f"{pron} {subj['be']} {ing_en(base)}{tail}."
    if tense == "Past":
        return f"{pron} {past_en(base)}{tail}."
    if tense == "Future":
        return f"{pron} will {base}{tail}."
    if tense == "Habitual":
        verb = present_3sg_en(base) if subj["is_3sg"] else base
        return f"{pron} usually {verb}{tail}."
    if tense == "Negative (present)":
        aux = "does" if subj["is_3sg"] else "do"
        return f"{pron} {aux} not {base}{tail}."
    return ""

# Pull the predicate (everything after the target verb) from the wordbank's
# authored example so every conjugation reads as a full sentence with real
# context. The parser searches for the actual target verb (infinitive, stem,
# or a known conjugated form) rather than assuming it's the first word —
# handles auxiliary-verb examples like "Nalingi kobakisa mwa sukali." where
# the target verb sits in the middle.
EN_VERB_SUFFIXES = ("s", "es", "ed", "ied", "ing", "d")

def parse_predicates(verb, s):
    examples = verb.get("examples") or []
    inf = (verb.get("lingala") or "").lower()
    base_en = bare_en(verb.get("english", ""))
    base_head_en = base_en.split(" ")[0].lower() if base_en else ""

    def find_ln_verb_idx(words):
        # Scan for a token that's the infinitive, the bare stem, or starts
        # with the stem followed by a known tense-shaped tail (zo-/ko-/-ki/-aka).
        for i, w in enumerate(words):
            wl = w.lower().rstrip(",.!?;:")
            if wl == inf or wl == s:
                return i
            # Conjugated form like "na-X", "o-X", "a-X", "to-X", "bo-X", "ba-X"
            # with X containing the stem.
            for sp in ("na", "o", "a", "to", "bo", "ba"):
                if wl.startswith(sp + "-") and s in wl[len(sp)+1:]:
                    return i
        return -1

    def find_en_verb_idx(words):
        if not base_head_en:
            return -1
        for i, w in enumerate(words):
            wl = w.lower().rstrip(",.!?'\";:")
            if wl == base_head_en:
                return i
            for suf in EN_VERB_SUFFIXES:
                if wl == base_head_en + suf:
                    return i
            # Handle "ied" form for verbs ending in 'y' (try → tried).
            if base_head_en.endswith("y") and wl == base_head_en[:-1] + "ied":
                return i
        return -1

    fr_inf = (verb.get("french") or "").strip().split(",")[0].split(" / ")[0].strip().lower()
    # First word of the FR infinitive — used to find it in the sentence.
    fr_head = fr_inf.split(" ")[0] if fr_inf else ""

    def find_fr_verb_idx(words):
        if not fr_head:
            return -1
        for i, w in enumerate(words):
            wl = w.lower().rstrip(",.!?'\";:")
            if wl == fr_head:
                return i
            # Crude conjugation hints: drop common endings and compare stems.
            for end in ("ent", "ons", "ais", "ait", "ez", "es", "e", "s"):
                if wl.endswith(end) and wl[:-len(end)] == fr_head.rstrip("er").rstrip("ir").rstrip("re"):
                    return i
        return -1

    for ex in examples:
        if not ex or not ex.get("lingala") or not ex.get("english"):
            continue
        ln = ex["lingala"].strip().rstrip(".!?")
        en = ex["english"].strip().rstrip(".!?")
        fr = (ex.get("french") or "").strip().rstrip(".!?")
        ln_words = ln.split()
        en_words = en.split()
        fr_words = fr.split() if fr else []
        if not ln_words or not en_words:
            continue
        ln_idx = find_ln_verb_idx(ln_words)
        en_idx = find_en_verb_idx(en_words)
        if ln_idx < 0 or en_idx < 0:
            continue
        ln_pred = " ".join(ln_words[ln_idx+1:])
        en_pred = " ".join(en_words[en_idx+1:])
        # FR predicate: find the FR verb in the sentence, else drop first word.
        fr_pred = ""
        if fr_words:
            fr_idx = find_fr_verb_idx(fr_words)
            if fr_idx < 0:
                fr_idx = 0  # fallback: drop first word
            fr_pred = " ".join(fr_words[fr_idx+1:])
            if fr_pred and fr_pred[0].isalpha():
                fr_pred = fr_pred[0].lower() + fr_pred[1:]
        if en_pred and en_pred[0].isalpha() and not en_pred.startswith(("I ", "I'")):
            en_pred = en_pred[0].lower() + en_pred[1:]
        return ln_pred, en_pred, fr_pred
    return "", "", ""

# Map of tense → URL-safe slug for anchor links.
TENSE_SLUG = {
    "Present": "present",
    "Present continuous": "present-continuous",
    "Past": "past",
    "Future": "future",
    "Habitual": "habitual",
    "Negative (present)": "negative",
}

# Map of tense → i18n key (camelCase must be preserved to match js/i18n-site.js).
TENSE_H2_KEY = {
    "Present":            "vp.t.present",
    "Present continuous": "vp.t.presentContinuous",
    "Past":               "vp.t.past",
    "Future":             "vp.t.future",
    "Habitual":           "vp.t.habitual",
    "Negative (present)": "vp.t.negativePresent",
}
TENSE_NAV_KEY = {
    "Present":            "vp.t.present",
    "Present continuous": "vp.t.presentContinuous",
    "Past":               "vp.t.past",
    "Future":             "vp.t.future",
    "Habitual":           "vp.t.habitual",
    "Negative (present)": "vp.t.negative",  # chip drops the "(present)" tag
}

# Wrap each morphological piece of a form in a colored span. The pieces are:
#   m-sp  subject prefix (na/o/a/to/bo/ba)
#   m-tp  tense prefix (zo/ko)
#   m-st  stem
#   m-suf inflection suffix (ki/i/ka/aka)
#   m-neg negation marker "te"
def colorize_form(form, tense_label, subj_prefix, stm):
    if not form:
        return ""
    # Negation: form ends with " te"
    neg_html = ""
    body = form
    if body.endswith(" te"):
        body = body[:-3]
        neg_html = ' <span class="m-neg">te</span>'
    # Split body on "-" to find subject + (optional tense prefix) + stem-or-stemSuffix
    parts = body.split("-")
    if not parts or parts[0] != subj_prefix:
        # Fallback — should not happen for our generated forms.
        return esc(form)
    sp = parts[0]
    rest = parts[1:]
    tp = ""
    stem_part = ""
    if len(rest) == 2 and rest[0] in ("zo", "ko"):
        tp = rest[0]
        stem_part = rest[1]
    else:
        stem_part = "-".join(rest)
    # Split stem_part into (displayed stem, suffix).
    # Past:     stem ending in 'a' → "{stem}ki"  (e.g. ba → baki)
    #           stem ending in cons → "{stem}i"
    # Habitual: stem ending in 'a' → "{stem}ka"  (e.g. ba → baka)
    #           stem ending in cons → "{stem}aka"
    displayed_stem = stm
    suffix = ""
    if stem_part == stm:
        suffix = ""
    elif stem_part.endswith("ki") and stem_part[:-2] == stm:
        suffix = "ki"
    elif stem_part.endswith("i") and stem_part[:-1] == stm:
        suffix = "i"
    elif stem_part.endswith("ka") and stem_part[:-2] == stm:
        suffix = "ka"
    elif stem_part.endswith("aka") and stem_part[:-3] == stm:
        suffix = "aka"
    else:
        return esc(form)
    sp_html = f'<span class="m-sp">{esc(sp)}</span>'
    tp_html = f'-<span class="m-tp">{esc(tp)}</span>' if tp else ''
    st_html = f'-<span class="m-st">{esc(displayed_stem)}</span>'
    suf_html = f'<span class="m-suf">{esc(suffix)}</span>' if suffix else ''
    return sp_html + tp_html + st_html + suf_html + neg_html

    # Per-row complements so all 36 conjugations on the page read differently.
    # Position 0 (ngai) carries the wordbank's authored predicate (the
    # richest, verb-specific sentence). Positions 1–5 rotate through generic
    # adverbs/phrases that work with any verb.
    # (ln_extra, en_extra, fr_extra)
ROW_DECOR_DEFAULT = [
    ("",                "",           ""              ),  # ngai — wordbank predicate (handled below)
    ("",                "",           ""              ),  # yo — bare form
    ("elongo na ngai",  "with me",    "avec moi"      ),  # ye
    ("lelo",            "today",      "aujourd'hui"   ),  # biso
    ("malamu",          "well",       "bien"          ),  # bino
    ("noki",            "quickly",    "vite"          ),  # bango
]
ROW_DECOR_HABIT = [
    ("",                "",            ""             ),
    ("",                "",            ""             ),
    ("elongo na ngai",  "with me",     "avec moi"     ),
    ("mikolo nyonso",   "every day",   "tous les jours"),
    ("malamu",          "well",        "bien"         ),
    ("noki",            "quickly",     "vite"         ),
]

def build_tense_html(label, forms, base, ln_pred="", en_pred="", fr_pred="", fr_inf="", stm=""):
    rows = []
    slug_id = TENSE_SLUG.get(label, label.lower().replace(" ", "-"))
    decor = ROW_DECOR_HABIT if label == "Habitual" else ROW_DECOR_DEFAULT
    for i, subj in enumerate(SUBJECTS):
        form = forms[i]
        # Row 0 (ngai) gets the verb-specific predicate; others rotate decor.
        if i == 0 and (ln_pred or en_pred or fr_pred):
            ln_extra, en_extra, fr_extra = ln_pred, en_pred, fr_pred
        else:
            ln_extra, en_extra, fr_extra = decor[i]
        ln_tail = f" {ln_extra}" if ln_extra else ""
        ln_ex = f"{subj['pronoun'].capitalize()} {form}{ln_tail}."
        en_ex = en_example(label, subj, base, en_extra)
        # French sentence: the verb is shown as its bracketed infinitive,
        # honest signal that we don't have a per-row FR conjugator.
        if fr_inf:
            fr_tail = f" {fr_extra}" if fr_extra else ""
            fr_ex = f"{subj['fr']} [{fr_inf}]{fr_tail}."
        else:
            fr_ex = ""
        sp_prefix = {"ngai":"na","yo":"o","ye":"a","biso":"to","bino":"bo","bango":"ba"}[subj["pronoun"]]
        colored = colorize_form(form, label, sp_prefix, stm) or esc(form)
        fr_block = (
            f'<span class="fx-fr"><span class="lang-tag">FR</span> {esc(fr_ex)}</span>'
            if fr_ex else ""
        )
        rows.append(
            '<div class="t-row">'
            f'<div class="t-pron"><b>{subj["pronoun"]}</b> <span class="subj-label" data-i18n="{subj["i18n"]}">{esc(subj["label"])}</span></div>'
            f'<div class="t-form">{colored}'
            f'<button class="t-speak" type="button" data-speak="{esc(form)}" aria-label="Hear {esc(form)}">🔊</button>'
            '</div>'
            '<div class="t-ex">'
            f'<span class="fx-ln"><span class="lang-tag">LN</span> {esc(ln_ex)}'
            f'<button class="t-speak-ex" type="button" data-speak="{esc(ln_ex)}" aria-label="Hear sentence">🔊</button>'
            '</span>'
            f'<span class="fx-en"><span class="lang-tag">EN</span> {esc(en_ex)}</span>'
            f'{fr_block}'
            '</div>'
            '</div>'
        )
    h2_key = TENSE_H2_KEY.get(label, "vp.t.present")
    return f'<section class="tense" id="t-{slug_id}"><h2 data-i18n="{h2_key}">{esc(label)}</h2><div class="t-grid">{"".join(rows)}</div></section>'

# -- card rendering -----------------------------------------------------------
def truncate(text, font, max_px, draw):
    if not text:
        return ""
    if draw.textlength(text, font=font) <= max_px:
        return text
    ell = "…"
    lo, hi = 1, len(text)
    while lo < hi:
        mid = (lo + hi) // 2
        if draw.textlength(text[:mid] + ell, font=font) <= max_px:
            lo = mid + 1
        else:
            hi = mid
    return text[: max(1, lo - 1)] + ell

def render_card(verb_inf, gloss_en, gloss_fr, out_path):
    W, H = 1200, 630
    img = Image.new("RGBA", (W, H), BG + (255,))
    d = ImageDraw.Draw(img)

    # Crimson accent bar — left edge.
    d.rectangle([0, 0, 12, H], fill=CRIMSON + (255,))

    # Gold dot — top right (matches PWA icon).
    dot_r = 14
    d.ellipse([W - 84 - dot_r, 64 - dot_r, W - 84 + dot_r, 64 + dot_r], fill=ACCENT + (255,))

    pad_x = 80
    inner_w = W - pad_x - 100

    # Eyebrow — small all-caps.
    eyebrow = "LINGALA VERB · CONJUGATION REFERENCE"
    f_eye = find_font(22, bold=True)
    d.text((pad_x, 86), eyebrow, fill=ACCENT + (255,), font=f_eye)

    # Headword — large display.
    f_head = find_font(180, bold=True)
    headw = d.textlength(verb_inf, font=f_head)
    if headw > inner_w:
        # Shrink for very long infinitives.
        size = int(180 * inner_w / headw)
        f_head = find_font(max(110, size), bold=True)
    d.text((pad_x, 130), verb_inf, fill=INK + (255,), font=f_head)

    # Gloss — English (and French if present).
    f_gloss = find_font(40)
    gy = 340
    gloss = truncate(gloss_en or gloss_fr or "", f_gloss, inner_w, d)
    if gloss:
        d.text((pad_x, gy), gloss, fill=INK + (255,), font=f_gloss)
    if gloss_en and gloss_fr:
        f_gloss_fr = find_font(28)
        fr_t = truncate("FR · " + gloss_fr, f_gloss_fr, inner_w, d)
        d.text((pad_x, gy + 56), fr_t, fill=ACCENT + (255,), font=f_gloss_fr)

    # Conjugation teaser row.
    s = stem(verb_inf)
    forms = [
        ("PRESENT",  present_1sg(s)),
        ("PAST",     past_1sg(s)),
        ("FUTURE",   future_1sg(s)),
    ]
    f_lab = find_font(20, bold=True)
    f_form = find_font(38, bold=True)
    col_w = inner_w // 3
    fy = 470
    for i, (label, form) in enumerate(forms):
        x = pad_x + i * col_w
        d.text((x, fy), label, fill=ACCENT + (255,), font=f_lab)
        form_t = truncate(form, f_form, col_w - 24, d)
        d.text((x, fy + 34), form_t, fill=INK + (255,), font=f_form)

    # Footer — site name.
    f_foot = find_font(22)
    foot = "lingala.artivicolab.com"
    fw = d.textlength(foot, font=f_foot)
    d.text((W - fw - pad_x, H - 56), foot, fill=INK_SOFT + (255,), font=f_foot)

    img.save(out_path, "PNG", optimize=True)

# -- HTML patching ------------------------------------------------------------
def slug(s):
    s = (s or "").lower().strip()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = re.sub(r"-+", "-", s).strip("-")
    return s or "unknown"

def esc(s):
    return (s or "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")

def build_head_block(verb):
    inf = verb["lingala"]
    en  = verb.get("english", "") or ""
    fr  = verb.get("french",  "") or ""
    s   = stem(inf)
    url = f"{SITE}/verbs/{slug(inf)}.html"
    og  = f"{SITE}/og/verbs/{slug(inf)}.png"

    title = f"{inf} — {en} · Lingala verb conjugation"
    if not en and fr:
        title = f"{inf} — {fr} · Lingala verb conjugation"

    # Description weaves the concrete forms a user might search for.
    desc_bits = [
        f"Conjugate {inf} in Lingala — {en or fr}.",
        f"Present {present_1sg(s)}, past {past_1sg(s)}, future {future_1sg(s)}.",
        "All six subject prefixes (ngai, yo, ye, biso, bino, bango) across every tense.",
    ]
    if fr and en:
        desc_bits.append(f"En français : {fr}.")
    desc = " ".join(desc_bits)
    if len(desc) > 320:
        desc = desc[:317] + "…"

    og_title = f"{inf} — {en or fr} · Lingala"
    og_desc  = f"Full conjugation of {inf} ({en or fr}) — present, past, future, habitual, negative across all six subject prefixes."

    # JSON-LD graph — DefinedTerm + LearningResource + BreadcrumbList.
    defined_term = {
        "@type": "DefinedTerm",
        "@id": f"{url}#term",
        "name": inf,
        "description": f"{en or fr} — Lingala verb (infinitive).",
        "inLanguage": "ln",
        "inDefinedTermSet": {
            "@type": "DefinedTermSet",
            "name": "Lingala verbs",
            "url": f"{SITE}/verbs.html"
        }
    }
    if fr:
        defined_term["alternateName"] = fr
    if en and fr:
        defined_term["description"] = f"{en} — Lingala verb (infinitive). French: {fr}."

    learning = {
        "@type": "LearningResource",
        "name": f"Conjugating {inf} in Lingala",
        "description": og_desc,
        "inLanguage": "en",
        "teaches": "Lingala verb conjugation",
        "learningResourceType": "Reference",
        "isAccessibleForFree": True,
        "about": {"@id": f"{url}#term"},
        "mainEntityOfPage": url
    }

    breadcrumbs = {
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Lingala",  "item": f"{SITE}/"},
            {"@type": "ListItem", "position": 2, "name": "Verbs",    "item": f"{SITE}/verbs.html"},
            {"@type": "ListItem", "position": 3, "name": inf,        "item": url},
        ]
    }

    ld = {"@context": "https://schema.org", "@graph": [defined_term, learning, breadcrumbs]}
    ld_json = json.dumps(ld, ensure_ascii=False, separators=(",", ":"))

    return {
        "title": title,
        "desc": desc,
        "og_title": og_title,
        "og_desc": og_desc,
        "og_image": og,
        "url": url,
        "ld_json": ld_json,
    }

GEN_CSS_START = "/* gen-verb-css-start */"
GEN_CSS_END   = "/* gen-verb-css-end */"

PER_ROW_EX_CSS = (
    GEN_CSS_START +
    # Widen the verb page on bigger screens so the row layout has space.
    "@media (min-width: 1080px) { .verb-page { max-width: 1280px !important; } }"
    "@media (min-width: 1400px) { .verb-page { max-width: 1380px !important; } }"
    # Single-column list — each row spans the full width so the example
    # sentence can occupy the right side instead of stacking under the form.
    ".tense .t-grid { display: block; }"
    # 3-column row: pronoun | form | example sentence (LN + EN).
    ".tense .t-row { display: grid; grid-template-columns: 96px minmax(120px, 1fr) 3fr; gap: 14px 28px; align-items: baseline; padding: 11px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }"
    ".tense .t-row:last-child { border-bottom: 0; }"
    "@media (max-width: 720px) { .tense .t-row { grid-template-columns: 86px 1fr; row-gap: 4px; } .tense .t-ex { grid-column: 2 / 3; } }"
    ".tense .t-pron { font-family: var(--body); color: var(--ink); opacity: 0.65; font-size: 0.86rem; white-space: nowrap; }"
    ".tense .t-pron b { color: var(--ink); opacity: 1; font-weight: 600; }"
    # Form keeps italic display weight — short, easy to read.
    ".tense .t-form { font-family: var(--serif); font-style: italic; color: var(--ink); font-size: 1.08rem; font-weight: 600; opacity: 1; }"
    # Example sentences: upright, near-full brightness for both languages.
    ".tense .t-ex { font-family: var(--body); line-height: 1.55; display: flex; flex-direction: column; gap: 4px; }"
    ".tense .t-ex .fx-ln, .tense .t-ex .fx-en, .tense .t-ex .fx-fr { font-style: normal; display: flex; align-items: baseline; gap: 8px; }"
    ".tense .t-ex .fx-ln { font-weight: 500; color: var(--ink); opacity: 0.98; font-size: 0.96rem; }"
    ".tense .t-ex .fx-en, .tense .t-ex .fx-fr { font-weight: 400; color: var(--ink); opacity: 0.82; font-size: 0.9rem; }"
    # Lang label chip (matches the verbs hub styling).
    ".tense .t-ex .lang-tag { flex: 0 0 auto; font-family: var(--body); font-size: 0.6rem; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; padding: 2px 6px; border-radius: 4px; background: rgba(255,255,255,0.06); color: var(--accent); }"
    # Language switching — html[lang] is set by js/i18n-site.js. Defaults:
    #   en  → LN + EN visible, FR hidden
    #   fr  → LN + FR visible, EN hidden
    #   ln  → all three visible
    "html[lang='en'] .tense .t-ex .fx-fr { display: none; }"
    "html[lang='fr'] .tense .t-ex .fx-en { display: none; }"
    "html[lang='ln'] .tense .t-ex .fx-en, html[lang='ln'] .tense .t-ex .fx-fr { display: flex; }"

    # Tense nav chip strip
    ".tense-nav { display: flex; flex-wrap: wrap; gap: 8px; margin: 0 0 22px; padding: 12px 0; border-bottom: 1px solid var(--line); position: sticky; top: 0; background: var(--bg, #08182E); z-index: 5; }"
    ".tense-nav a { padding: 7px 14px; background: transparent; border: 1px solid var(--line); border-radius: 999px; color: var(--ink); font-family: var(--body); font-size: 0.74rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; text-decoration: none; transition: all 0.15s; }"
    ".tense-nav a:hover { border-color: var(--accent); color: var(--accent); }"

    # Morphology coloring on conjugated forms.
    ".tense .t-form .m-sp { color: #6BA8D6; }"
    ".tense .t-form .m-tp { color: #E0AF1E; }"
    ".tense .t-form .m-st { color: var(--ink); }"
    ".tense .t-form .m-suf { color: #E0552B; }"
    ".tense .t-form .m-neg { color: #C8202A; font-weight: 700; }"

    # Speak buttons.
    ".tense .t-form .t-speak { margin-left: 8px; background: transparent; border: 0; padding: 2px 6px; cursor: pointer; opacity: 0.5; font-size: 0.85rem; transition: opacity 0.15s; }"
    ".tense .t-form .t-speak:hover { opacity: 1; }"
    ".tense .t-ex .t-speak-ex { margin-left: 6px; background: transparent; border: 0; padding: 1px 4px; cursor: pointer; opacity: 0.4; font-size: 0.7rem; transition: opacity 0.15s; }"
    ".tense .t-ex .t-speak-ex:hover { opacity: 1; }"

    # Cultural note pulled into a hero pull-quote slot.
    ".verb-hero-note { font-family: var(--serif); font-size: 1.04rem; line-height: 1.7; color: var(--ink); margin: 4px 0 30px; padding: 16px 20px; background: var(--surface); border-left: 3px solid var(--accent); border-radius: 0 10px 10px 0; white-space: pre-line; }"

    # Subject-label CSS-driven parens. When the i18n key is empty (Lingala
    # mode — the pronoun ngai/yo/etc. already IS Lingala) the parens vanish.
    ".tense .t-pron .subj-label::before { content: '('; opacity: 0.75; }"
    ".tense .t-pron .subj-label::after { content: ')'; opacity: 0.75; }"
    ".tense .t-pron .subj-label:empty::before, .tense .t-pron .subj-label:empty::after { content: ''; }"

    # Per-language inline spans (eyebrow gloss, verb-gloss line, etc.).
    "html[lang='en'] .lang-fr, html[lang='en'] .lang-ln { display: none; }"
    "html[lang='fr'] .lang-en, html[lang='fr'] .lang-ln { display: none; }"
    "html[lang='ln'] .lang-en, html[lang='ln'] .lang-fr { display: none; }"
    # Verb-gloss line / eyebrow gloss hidden in LN (the headword IS Lingala).
    "html[lang='ln'] .verb-eyebrow .vp-gloss-wrap, html[lang='ln'] .verb-gloss { display: none; }"
    # Cultural note blocks. EN/FR mode show only their own; LN mode shows
    # all three (LN + EN + FR) with labeled chips, since LN learners benefit
    # from seeing both English and French alongside.
    ".verb-hero-note .note-en, .verb-hero-note .note-fr, .verb-hero-note .note-ln { display: none; white-space: pre-line; }"
    ".verb-hero-note .note-en + .note-fr, .verb-hero-note .note-fr + .note-ln, .verb-hero-note .note-en + .note-ln { margin-top: 18px; padding-top: 18px; border-top: 1px dashed var(--line); }"
    # Inline chips with a real margin — keeps copy-paste readable
    # ('EN Kosomba …' not 'ENKosomba …') and works on narrow screens.
    ".verb-hero-note .note-en .lang-tag, .verb-hero-note .note-fr .lang-tag, .verb-hero-note .note-ln .lang-tag { display: inline-block; margin-right: 10px; vertical-align: 0.12em; }"
    "html[lang='en'] .verb-hero-note .note-en { display: block; }"
    "html[lang='fr'] .verb-hero-note .note-fr { display: block; }"
    "html[lang='ln'] .verb-hero-note .note-ln, html[lang='ln'] .verb-hero-note .note-en, html[lang='ln'] .verb-hero-note .note-fr { display: block; }"

    # Prev / next verb navigation strip.
    ".verb-prevnext { display: flex; justify-content: space-between; gap: 12px; margin: 0 0 24px; }"
    ".verb-prevnext .vpn-prev, .verb-prevnext .vpn-next { padding: 9px 16px; background: var(--surface); border: 1px solid var(--line); border-radius: 999px; color: var(--ink); text-decoration: none; font-family: var(--display); font-weight: 600; font-size: 0.92rem; transition: all 0.15s; max-width: 48%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }"
    ".verb-prevnext .vpn-prev:hover, .verb-prevnext .vpn-next:hover { border-color: var(--accent); color: var(--accent); }"
    ".verb-prevnext .vpn-spacer { display: block; flex: 1; }"
    ".verb-prevnext .vpn-pos { display: inline-flex; align-items: center; padding: 9px 14px; font-family: var(--body); font-size: 0.78rem; font-weight: 600; letter-spacing: 0.1em; color: var(--ink); opacity: 0.6; text-decoration: none; transition: opacity 0.15s; }"
    ".verb-prevnext .vpn-pos:hover { opacity: 1; color: var(--accent); }"
    + GEN_CSS_END
)

TENSE_ORDER = ["Present", "Present continuous", "Past", "Future", "Habitual", "Negative (present)"]

def inject_tense_examples(src, verb):
    inf = verb["lingala"]
    s = stem(inf)
    base = bare_en(verb.get("english", ""))
    ln_pred, en_pred, fr_pred = parse_predicates(verb, s)
    # First French gloss only — the one shown bracketed inside FR templates.
    fr_inf = (verb.get("french") or "").split(",")[0].split(" / ")[0].strip()
    forms_by_tense = conjugate_all(s)
    # Build the tense-nav chip strip; chip text uses data-i18n so it can swap
    # to FR / LN when the user toggles language.
    nav_chips = '<nav class="tense-nav">' + "".join(
        f'<a href="#t-{TENSE_SLUG[label]}" data-i18n="{TENSE_NAV_KEY[label]}">{esc(label.replace(" (present)", ""))}</a>'
        for label in TENSE_ORDER
    ) + '</nav>'
    new_sections = nav_chips + "".join(
        build_tense_html(label, forms_by_tense[label], base, ln_pred, en_pred, fr_pred, fr_inf, s)
        for label in TENSE_ORDER
    )
    # Remove any prior per-tense single example (from the previous generator).
    src = re.sub(r'<p class="tense-ex">.*?</p>', '', src, flags=re.DOTALL)
    # Replace all six tense sections (plus any existing nav-chip strip) at once.
    # Matches every emitted variant: legacy <table>, current <div class="t-grid">,
    # and with or without the id="t-..." attribute added in recent versions.
    # Also sweeps a previously-installed <nav class="tense-nav"> so we don't
    # double-stack chip bars on re-runs.
    src = re.sub(r'<nav class="tense-nav">.*?</nav>', '', src, flags=re.DOTALL)
    src = re.sub(
        r'(<section class="tense"(?:\s+id="[^"]*")?><h2(?:\s+data-i18n="[^"]*")?>[^<]+</h2>(?:<table>.*?</table>|<div class="t-grid">.*?</div>)</section>)+',
        lambda m: new_sections, src, count=1, flags=re.DOTALL
    )
    # 1. Strip every prior generator-inserted block — both the marked block
    #    and the accumulated legacy fragments from earlier script versions.
    src = re.sub(re.escape(GEN_CSS_START) + r'.*?' + re.escape(GEN_CSS_END),
                 '', src, flags=re.DOTALL)

    # Sweep every CSS rule whose selector belongs to the generator. Match a
    # bare rule (no nested braces) selector-by-selector.
    MANAGED_SELECTORS = [
        r'\.tense\s+\.t-form',
        r'\.tense\s+\.t-ex(?:\s+\.fx-(?:ln|en)(?:::before)?)?',
        r'\.tense\s+\.t-pron(?:\s+b)?',
        r'\.tense\s+\.t-row(?::last-child)?',
        r'\.tense\s+\.t-grid',
        r'\.tense\s+\.form-main',
        r'\.tense\s+\.form-ex(?:\s+\.fx-(?:ln|en))?',
        r'\.tense-ex(?:\s+\.tx-(?:ln|en))?',
        r'\.tense\s+td\.form',
    ]
    for sel in MANAGED_SELECTORS:
        # Bare rule: `selector { ... }` with no nested braces.
        src = re.sub(r'(?<![\w-])' + sel + r'\s*\{[^{}]*\}', '', src)

    # Strip @media blocks that target our managed selectors or .verb-page.
    def media_strip(m):
        body = m.group(0)
        if (
            '.t-grid' in body or '.t-row' in body or '.t-ex' in body
            or '.t-pron' in body or '.t-form' in body or '.verb-page' in body
        ):
            return ''
        return body
    src = re.sub(r'@media[^{]+\{(?:[^{}]|\{[^{}]*\})*\}', media_strip, src)

    # 2. Drop italic from the base template's full-sentence elements.
    src = re.sub(r'(\.verb-ex-(?:ln|fr|en)\s*\{[^}]*?)\s*font-style:\s*italic;', r'\1', src)

    # 3. Install fresh marked block AT THE END of <style> so it wins the
    #    cascade over any rule we may have missed.
    if PER_ROW_EX_CSS not in src:
        src = src.replace("</style>", PER_ROW_EX_CSS + "\n</style>", 1)
    return src

BACK_BTN_HTML = '<a class="verb-back verb-back-top" id="verb-back-link" href="/verbs.html">← Back to verbs</a>'

# The back button always returns to the verbs hub (not the user's previous
# page) — clicking a verb card from anywhere should still let the user
# explore the verb index on its own terms. The script only re-translates
# the label on language switch.
BACK_BTN_SCRIPT = (
    '<script id="verb-back-script">'
    '(function(){var l=document.getElementById("verb-back-link");if(!l)return;'
    'var LABELS={'
    'en:"\\u2190 Back to verbs",'
    'fr:"\\u2190 Retour aux verbes",'
    'ln:"\\u2190 Zonga na maverbe"'
    '};'
    'function paint(){var lang=document.documentElement.lang||"en";l.textContent=LABELS[lang]||LABELS.en;}'
    'paint();window.addEventListener("lingala:lang",paint);'
    '})();'
    '</script>'
)

def move_back_button(src):
    # Strip any existing back link (top or bottom variant) and any prior script.
    src = re.sub(r'\s*<a class="verb-back(?: verb-back-top)?"[^>]*>[^<]*</a>', '', src)
    src = re.sub(r'<script id="verb-back-script">.*?</script>', '', src, flags=re.DOTALL)
    # Insert a fresh button as the first child of <main class="verb-page">.
    src = re.sub(
        r'(<main class="verb-page">)',
        r'\1\n  ' + BACK_BTN_HTML,
        src, count=1
    )
    # Install the referrer-aware script before </body>.
    src = src.replace("</body>", BACK_BTN_SCRIPT + "\n</body>", 1)
    # Top-positioned variant margin.
    top_css = ".verb-back-top { margin: 0 0 18px; }"
    if top_css not in src:
        src = src.replace("</style>", top_css + "\n</style>", 1)
    return src

SPEECH_LOAD = '\n<script src="/js/speech.js"></script>'
SPEAK_HANDLER = (
    '\n<script id="verb-speak-handler">'
    'document.addEventListener("click",function(e){var t=e.target.closest("[data-speak]");'
    'if(!t)return;e.preventDefault();var s=t.getAttribute("data-speak");'
    'window.LingalaSpeech&&window.LingalaSpeech.speak&&window.LingalaSpeech.speak(s);});'
    '</script>'
)

def ensure_speech_loaded(src):
    if 'src="/js/speech.js"' not in src:
        src = src.replace("</body>", SPEECH_LOAD + "\n</body>", 1)
    if 'id="verb-speak-handler"' not in src:
        src = src.replace("</body>", SPEAK_HANDLER + "\n</body>", 1)
    return src

def move_cultural_note_up(src, verb):
    # The base template emits the EN cultural note BELOW the tense tables.
    # Pull it up into a hero pull-quote right after the imperative, and wrap
    # it (plus optional FR / LN translations from the wordbank) in per-lang
    # spans so the active language picks the right one.
    m = re.search(r'<div class="verb-note">(.*?)</div>', src, flags=re.DOTALL)
    note_en = (verb.get("culturalNote") or (m.group(1) if m else "")).strip()
    note_fr = (verb.get("culturalNoteFr") or "").strip()
    note_ln = (verb.get("culturalNoteLn") or "").strip()
    if not note_en and not note_fr and not note_ln:
        return src

    # Strip both the original note and any prior hero-note we installed.
    src = re.sub(r'<div class="verb-note">.*?</div>\s*', '', src, count=1, flags=re.DOTALL)
    src = re.sub(r'<div class="verb-hero-note">.*?</div>\s*', '', src, count=1, flags=re.DOTALL)

    # Each note block has a small lang tag. Note spans do NOT carry the
    # generic .lang-en/.lang-fr/.lang-ln classes — visibility is controlled
    # by note-specific CSS so LN mode can show all three at once.
    def tag_block(klass, tag, body):
        # A real space sits between the chip and the body so copy-paste keeps
        # them readable ("EN Kosomba …" not "ENKosomba …").
        return (
            f'<span class="{klass}">'
            f'<span class="lang-tag">{tag}</span> '
            f'{esc(body)}'
            '</span>'
        )
    inner = []
    if note_en:
        inner.append(tag_block("note-en", "EN", note_en))
    # FR falls back to EN when no translation exists.
    inner.append(tag_block("note-fr", "FR", note_fr or note_en))
    # LN falls back to EN.
    inner.append(tag_block("note-ln", "LN", note_ln or note_en))
    hero_note = '<div class="verb-hero-note">' + "".join(inner) + '</div>'

    src = re.sub(
        r'(<p class="verb-imp">.*?</p>)',
        r'\1\n  ' + hero_note,
        src, count=1, flags=re.DOTALL
    )
    return src

def patch_eyebrow_and_gloss(src, verb):
    en = (verb.get("english") or "").strip()
    fr = (verb.get("french")  or "").strip()
    # Eyebrow line: "<a>Verbs</a> · {gloss}". Replace the gloss portion with
    # per-language spans + wrap the · separator so it disappears in LN mode.
    eyebrow_inner = (
        '<a href="/verbs.html" data-i18n="vp.eyebrow.verbs">Verbs</a>'
        '<span class="vp-gloss-wrap"> · '
        f'<span class="lang-en">{esc(en)}</span>'
        f'<span class="lang-fr">{esc(fr)}</span>'
        '</span>'
    )
    src = re.sub(
        r'<p class="verb-eyebrow">.*?</p>',
        f'<p class="verb-eyebrow">{eyebrow_inner}</p>',
        src, count=1, flags=re.DOTALL
    )
    # Verb gloss (big line under headword): replace text with per-lang spans.
    gloss_inner = (
        f'<span class="lang-en">{esc(en)}</span>'
        f'<span class="lang-fr">{esc(fr)}</span>'
    )
    src = re.sub(
        r'<p class="verb-gloss">.*?</p>',
        f'<p class="verb-gloss">{gloss_inner}</p>',
        src, count=1, flags=re.DOTALL
    )
    return src

def patch_imperative_line(src):
    # Wrap "Imperative (singular):" / "plural:" in data-i18n spans so they
    # translate alongside the rest of the chrome.
    src = re.sub(
        r'<p class="verb-imp">[^<]*Imperative \(singular\):',
        '<p class="verb-imp"><span data-i18n="vp.imp.sg">Imperative (singular):</span>',
        src, count=1
    )
    src = re.sub(
        r'· plural:',
        '· <span data-i18n="vp.imp.pl">plural:</span>',
        src, count=1
    )
    return src

def patch_disclaimer(src):
    # Replace the verb-disclaimer paragraph contents with an i18n span so
    # the whole sentence translates. Leaves the dictionary link as-is.
    src = re.sub(
        r'<p class="verb-disclaimer">[^<]*<a',
        '<p class="verb-disclaimer"><span data-i18n="vp.disclaimer">Conjugation generated from regular Bantu morphology rules — accurate for most verbs in diaspora Lingala. Irregular verbs and regional variants may differ. Verified entries from our dictionary.</span> <a',
        src, count=1
    )
    return src

def inject_prev_next(src, prev_verb, next_verb, position=None, total=None):
    # Strip any prior pair (and any prior position-indicator), then insert a
    # fresh strip right after the top back button.
    src = re.sub(r'<div class="verb-prevnext">.*?</div>', '', src, flags=re.DOTALL)
    pieces = ['<div class="verb-prevnext">']
    if prev_verb:
        href = f'/verbs/{slug(prev_verb["lingala"])}.html'
        pieces.append(f'<a class="vpn-prev" href="{href}">← {esc(prev_verb["lingala"])}</a>')
    else:
        pieces.append('<span class="vpn-spacer"></span>')
    if position is not None and total is not None:
        pieces.append(
            f'<a class="vpn-pos" href="/verbs.html" title="Back to all verbs">'
            f'{position} / {total}</a>'
        )
    if next_verb:
        href = f'/verbs/{slug(next_verb["lingala"])}.html'
        pieces.append(f'<a class="vpn-next" href="{href}">{esc(next_verb["lingala"])} →</a>')
    else:
        pieces.append('<span class="vpn-spacer"></span>')
    pieces.append('</div>')
    strip_html = "".join(pieces)
    src = re.sub(
        r'(<a class="verb-back verb-back-top"[^>]*>[^<]*</a>)',
        r'\1\n  ' + strip_html,
        src, count=1
    )
    return src

def patch_html(path, head, verb, prev_verb=None, next_verb=None, position=None, total=None):
    with open(path, "r", encoding="utf-8") as f:
        src = f.read()
    src = move_back_button(src)
    src = inject_prev_next(src, prev_verb, next_verb, position, total)
    src = move_cultural_note_up(src, verb)
    src = ensure_speech_loaded(src)
    src = patch_eyebrow_and_gloss(src, verb)
    src = patch_imperative_line(src)
    src = patch_disclaimer(src)
    src = inject_tense_examples(src, verb)

    src = re.sub(r"<title>.*?</title>",
                 f"<title>{esc(head['title'])}</title>", src, count=1)
    src = re.sub(r'<meta name="description" content="[^"]*">',
                 f'<meta name="description" content="{esc(head["desc"])}">', src, count=1)
    src = re.sub(r'<meta property="og:title" content="[^"]*">',
                 f'<meta property="og:title" content="{esc(head["og_title"])}">', src, count=1)
    src = re.sub(r'<meta property="og:description" content="[^"]*">',
                 f'<meta property="og:description" content="{esc(head["og_desc"])}">', src, count=1)
    src = re.sub(r'<meta property="og:image" content="[^"]*">',
                 f'<meta property="og:image" content="{head["og_image"]}">', src, count=1)
    src = re.sub(r'<script type="application/ld\+json">.*?</script>',
                 f'<script type="application/ld+json">{head["ld_json"]}</script>',
                 src, count=1, flags=re.DOTALL)

    # Inject Twitter Card + extra OG tags before </head>, idempotently.
    twitter_block = (
        f'<meta property="og:url" content="{head["url"]}">\n'
        f'<meta property="og:site_name" content="Lingala">\n'
        f'<meta property="og:image:width" content="1200">\n'
        f'<meta property="og:image:height" content="630">\n'
        f'<meta property="og:image:alt" content="{esc(head["og_title"])}">\n'
        f'<meta name="twitter:card" content="summary_large_image">\n'
        f'<meta name="twitter:title" content="{esc(head["og_title"])}">\n'
        f'<meta name="twitter:description" content="{esc(head["og_desc"])}">\n'
        f'<meta name="twitter:image" content="{head["og_image"]}">\n'
    )
    # Remove any prior block we inserted, then add fresh — keeps the script idempotent.
    src = re.sub(r'(<meta property="og:url"[^>]*>\n?)?(<meta property="og:site_name"[^>]*>\n?)?(<meta property="og:image:width"[^>]*>\n?)?(<meta property="og:image:height"[^>]*>\n?)?(<meta property="og:image:alt"[^>]*>\n?)?(<meta name="twitter:card"[^>]*>\n?)?(<meta name="twitter:title"[^>]*>\n?)?(<meta name="twitter:description"[^>]*>\n?)?(<meta name="twitter:image"[^>]*>\n?)?', '', src, count=1)
    src = src.replace("</head>", twitter_block + "</head>", 1)

    with open(path, "w", encoding="utf-8") as f:
        f.write(src)

# -- main --------------------------------------------------------------------
def main():
    with open(WORDBANK, "r", encoding="utf-8") as f:
        bank = json.load(f)

    verbs = [w for w in bank.get("words", []) if (
        w.get("partOfSpeech") == "verb"
        and w.get("verified")
        and w.get("lingala", "").startswith("ko")
        and " " not in w.get("lingala", "")
    )]

    # Dedupe by slug — multiple wordbank entries may share a slug; we want
    # exactly one canonical entry per page for prev/next adjacency to work.
    seen = set()
    unique = []
    for v in verbs:
        sl = slug(v["lingala"])
        if sl in seen:
            continue
        seen.add(sl)
        unique.append(v)

    built = 0
    patched = 0
    missing = 0
    for idx, v in enumerate(unique):
        inf = v["lingala"]
        s = slug(inf)
        prev_verb = unique[idx - 1] if idx > 0 else None
        next_verb = unique[idx + 1] if idx + 1 < len(unique) else None
        html_path = os.path.join(VERBS_DIR, f"{s}.html")
        png_path  = os.path.join(OG_DIR, f"{s}.png")
        try:
            render_card(inf, v.get("english", ""), v.get("french", ""), png_path)
            built += 1
        except Exception as e:
            print(f"  card fail {inf}: {e}")
        if not os.path.exists(html_path):
            missing += 1
            continue
        head = build_head_block(v)
        try:
            patch_html(html_path, head, v, prev_verb, next_verb, idx + 1, len(unique))
            patched += 1
        except Exception as e:
            print(f"  html fail {inf}: {e}")

    print(f"OG cards built:  {built}")
    print(f"HTML patched:    {patched}")
    print(f"HTML missing:    {missing}")
    print(f"Total verbs:     {len(verbs)}")

if __name__ == "__main__":
    main()
