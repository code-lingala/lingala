# Losako (codename: lingala)

A browser-based tool that surfaces **one Lingala phrase every day**, wraps it in a beautifully designed culture card, and lets the user download that card as an image to share — with zero login, zero server, and zero friction. Built for the Congolese diaspora to express pride in where their family is from.

> The language is the packaging. The identity is the gift.

## Stack

- Vanilla JS (ES modules), no framework, no bundler, no dependencies.
- Static files only — serve from any web host. No build step.
- Mobile-first; designed for one-thumb use on a phone.
- The phrase database is bundled into the app — no API, no loading state.
- `Canvas` renders the downloadable image (1080×1080 + 1080×1920) entirely in the browser.
- `IndexedDB` stores streak, settings, and the view archive — on the device only.

## Project layout

```
index.html         the app (today's card, archive, settings)
about.html         what Losako is
privacy.html       data handling
manifest.json      PWA manifest
sw.js              service worker (network-first, offline-ready)
css/style.css      mobile-first styles; on-screen card mirrors the export
js/
  app.js           UI orchestration + view switching (no router)
  card.js          Canvas card renderer + shared palette
  db.js            IndexedDB: streak, settings, archive
  data/phrases.js  the phrase database + deterministic daily engine
```

## How "today's card" works

Deterministic, no server: `daysSince(EPOCH) % PHRASES.length` selects the day's
phrase, so **every user worldwide sees the same card on the same date**. `EPOCH`
is set to **2026-06-30** (Congolese Independence Day — the planned launch date).

⚠️ **Append-only database.** The engine keys off array order, so the archive's
day→phrase mapping is stable only if you never reorder or delete past entries.
Add new phrases by appending to the array.

## ⚠️ Content needs native-speaker review before launch

`js/data/phrases.js` ships a **seed set (~30 entries)** written to prove out the
engine, the design and the experience. Every Lingala phrase, French
translation, phonetic guide and cultural note must be **reviewed and corrected
by native speakers** before any public launch. The cultural notes are the soul
of the product — they should read like a Congolese elder talking about their
language with warmth and pride, not like a textbook. Launch target is **90
entries** (three months before any repeat); the year goal is 365.

## Suggest-a-phrase form

The only external touch. The form (built in `app.js`, `suggestForm()`) opens the
visitor's email app via a `mailto:` pre-addressed to `artivicolab@gmail.com`, with
the phrase/meaning/context pre-filled. No backend — it works on static hosting
like GitHub Pages, and each suggestion arrives as an email (a push notification on
the maintainer's phone).

## Run locally

```bash
cd lingala
python3 -m http.server 8000
# open http://localhost:8000
```

(A static server is required — ES modules and the service worker don't load
over `file://`.)

## Still to do before launch

- [ ] Expand + native-review the phrase database to 90 entries.
- [ ] Real Sunday "phrase of the week" thematic sets (currently single-phrase).
- [ ] App icons (`icon-192/512/512-maskable.png`, `icon-180.png`) + `og-image.png`.
- [x] Suggest form mails to artivicolab@gmail.com via `mailto:` (static-host friendly).
- [ ] Premium card packs, print-on-demand, institutional licensing (post-launch layers).
```
