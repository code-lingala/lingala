# CLAUDE.md

Guidance for AI assistants (and humans) working in this repo.

## What this is

**Lingala** is a zero-backend Progressive Web App for the Congolese diaspora.
It surfaces **one Lingala phrase per day**, renders it as a downloadable
"culture card" image to share, and tracks a streak — with no login, no server,
and no build step.

> The language is the packaging. The identity is the gift.

Launch target: **2026-06-30** (Congolese Independence Day), which is also the
deterministic `EPOCH` the daily engine counts from.

## Hard rules (read before editing)

1. **The phrase database is append-only.** `js/data/phrases.js` `PHRASES` is an
   array; the daily engine selects by `daysSince(EPOCH) % PHRASES.length`.
   Reordering or deleting any entry that has appeared shifts every user's entire
   archive history. **Only ever append new entries to the end.**
2. **Never move `EPOCH`** (`'2026-06-30'` in `js/data/phrases.js`). The whole
   "everyone sees the same card today" promise depends on it being constant
   forever.
3. **No backend, no dependencies, no build step, no framework.** Vanilla JS ES
   modules, static files served as-is. No backend: the suggest-a-phrase form
   opens a `mailto:` to artivicolab@gmail.com (host-agnostic — target host is
   GitHub Pages). Keep it that way unless the user explicitly decides otherwise.
4. **Nothing leaves the device.** `js/db.js` makes zero network calls and must
   stay that way — streak, settings, and archive live only in IndexedDB.
5. **Phrase content is unverified seed data.** The ~30 entries are
   right-*shape* placeholders. Do NOT treat the Lingala/French/phonetic/notes as
   final. They need native-speaker review before launch (see below).

## Project layout

```
index.html         the app shell (Today / Archive / Settings live in one page)
about.html         what Lingala is
privacy.html       data handling
manifest.json      PWA manifest (icons referenced here don't exist yet)
sw.js              service worker (offline support)
robots.txt
css/style.css      mobile-first styles; the on-screen card mirrors the export
js/
  app.js           UI orchestration, view switching, all actions (no router)
  card.js          Canvas card renderer + the DRC-rooted color palette
  db.js            IndexedDB: settings, streak, archive
  data/phrases.js  the phrase database + deterministic daily engine + EPOCH
```

## How the daily engine works (`js/data/phrases.js`)

- `dayNumber(date)` = whole days between `EPOCH` and `date`, using **local**
  date-only math (so "today" is the user's today, and time zones never split a
  day).
- `indexForDate(date)` = `dayNumber` mod `PHRASES.length`, wrapped so
  pre-launch (negative) days still resolve to a real phrase.
- `phraseForDate` / `isSpotlight` (Sundays) / `dateKey` (YYYY-MM-DD) build on
  these. The Archive screen rebuilds the last 90 days from these functions, so
  it's always populated regardless of what the user has actually viewed.

## Card rendering (`js/card.js`)

- `renderCard(phrase, { format, theme, lang, dayIndex })` draws to a Canvas at
  **1080×1080** (`square`) or **1080×1920** (`story`) and returns the canvas.
- Three DRC-rooted themes — `river` (Congo cerulean), `forest` (canopy green),
  `clay` (laterite soil) — each with gradient variants chosen by `dayIndex` so
  the feed looks cohesive-but-varied day to day. **Laterite (`#E0552B`) is the
  shared accent**; DRC flag gold (`--drc-gold`) is rationed to the spotlight tag
  only. See the `losako-card-palette-direction` design note (memory) for the why.
- A risograph **grain** pass (`applyGrain` in card.js) is composited over the
  whole card so the export reads as a printed artifact, mirrored in CSS via
  `.card::after` — change one, change the other.
- `gradientFor(theme, dayIndex)` is shared with `app.js` so the **on-screen DOM
  preview must stay visually in sync with the exported image**. If you change a
  color, spacing, or layout decision in one, check the other.
- Fonts are system stacks (`Arial Black` / `Helvetica Neue`) — no web fonts, to
  keep it offline and dependency-free.

## Data layer (`js/db.js`)

- IndexedDB `losako` v1, two object stores: `kv` (singleton rows: `settings`,
  `streak`) and `archive` (one row per viewed day, keyed by date).
- **Streak only advances on a real action** (`markEngaged`) — download, copy,
  share — not a passive open. `reconcileStreak` zeroes a broken streak on open
  without erasing `longest`.
- Settings: `lang` (en/fr), `theme` (river/forest/clay), `format` (square/story),
  `notify` (bool). Defaults in `DEFAULT_SETTINGS`.

## Conventions

- **Everything is bilingual EN/FR** — the diaspora in Europe is largely
  Francophone, so *all* user-facing text must exist in French too, including the
  marketing pages, not just the app. App UI strings live in the `T` object in
  `js/app.js` (add both `en` and `fr` keys for any new string); card translations
  use `phrase.en` / `phrase.fr`. ⚠️ `index.html`, `about.html`, `privacy.html`
  are currently English-only and still need French.
- DOM is built with the tiny `el(tag, attrs, kids)` helper in `app.js` — no
  innerHTML templating for app UI. Follow that pattern.
- Mobile-first, one-thumb use. Test at phone widths.
- Cultural notes are the soul of the product: warm, like a Congolese elder
  speaking with pride, never textbook-dry.
- **No em-dashes (—) in any text the AI writes.** Use commas, parentheses,
  colons, or split into two sentences instead. This applies to titles, meta
  descriptions, cultural notes, UI copy, commit messages, and chat replies.
  Existing em-dashes in seed data (phrase entries, dictionary headwords like
  "madesu — beans") are content already shipped, leave them alone, but do not
  introduce new ones.

## Adding a phrase (the common task)

Append an object to `PHRASES` in `js/data/phrases.js` with all eight content
fields + `id`: `lingala`, `en`, `fr`, `phonetic` (syllables joined by `-`,
stress in CAPS, `'` for a glottal/vowel separation), `category` (must be a key
in `CATEGORIES`), `note` (1–3 sentences, shown on card), `long` (3–8 sentences,
"read more"), `level` (`beginner`/`intermediate`/`advanced`). Append only.

## Run locally

```bash
cd lingala
python3 -m http.server 8000   # then open http://localhost:8000
```

A static server is required — ES modules and the service worker won't load over
`file://`.

## Open items before launch

- [ ] Expand + **native-review** the phrase DB to 90 entries (now **56**; year goal: 365). A 24-entry batch (greetings, days/holidays, the 12 traditional season-month names, month-relatives) was added 2026-05-22 from an OCR'd dictionary and is **wholly unverified** — prioritize reviewing those, especially the traditional month names.
- [ ] Real Sunday "phrase of the week" thematic sets (currently single-phrase).
- [ ] Create the missing icons: `icon-192/512/512-maskable.png`, `icon-180.png`,
      `og-image.png` (referenced in `manifest.json` / `index.html` but absent).
- [x] Suggest form mails to artivicolab@gmail.com via `mailto:` (GitHub Pages-friendly).
- [ ] Nothing is committed yet — the working tree is all untracked on `master`.

## Working agreement

When you make a change that affects any of the above (especially the phrase DB,
the engine, or launch-blocking items), update the relevant section here so the
next person/AI stays oriented.
