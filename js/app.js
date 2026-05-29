// Lingala — app orchestration. Builds the UI, switches between the three
// screens (Today / Archive / Settings), and wires every action. No router, no
// framework: view switching is one function and the rest is direct DOM work.

import {
  PHRASES, CATEGORIES, phraseForDate, indexForDate, isSpotlight, dateKey,
} from './data/phrases.js';
import { renderCard, canvasToBlob, gradientFor } from './card.js';
import {
  getSettings, saveSettings, reconcileStreak, markEngaged, getStreak,
  recordView, getArchive, wipeAll,
} from './db.js';

// --- tiny DOM helper --------------------------------------------------------
function el(tag, attrs = {}, kids = []) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') n.className = v;
    else if (k === 'html') n.innerHTML = v;
    else if (k === 'text') n.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2), v);
    else if (v !== null && v !== undefined) n.setAttribute(k, v);
  }
  for (const kid of [].concat(kids)) {
    if (kid == null) continue;
    n.appendChild(typeof kid === 'string' ? document.createTextNode(kid) : kid);
  }
  return n;
}

const T = {
  // interface strings, keyed by language
  en: {
    today: 'Today', archive: 'Archive', settings: 'Settings',
    download: 'Download card', copy: 'Copy phrase', caption: 'Copy caption',
    story: 'Story format', whatsapp: 'For WhatsApp', readMore: 'Read more',
    readLess: 'Show less', yesterday: 'Yesterday’s card', sayIt: 'How to say it',
    spotlight: 'Phrase of the week', share: 'Share', copied: 'Copied!',
    saved: 'Saved!', streakOne: 'day streak', streakDoneToday: 'shared today',
    suggestTitle: 'Know a phrase we’re missing?',
    suggestBody: 'Share a word, proverb or expression from your family. We review every one by hand.',
    suggestPhrase: 'The phrase (in Lingala)', suggestMeaning: 'What it means',
    suggestName: 'Your name or handle (optional)', suggestContext: 'Cultural context (optional)',
    suggestSend: 'Send it in', suggestThanks: 'Your email is ready — just tap send. Matondi!',
    suggestOffline: 'You’re offline. Try again once you’re connected.',
    langLabel: 'Interface language', themeLabel: 'Card colour', formatLabel: 'Default download',
    notifyLabel: 'Daily reminder', wipe: 'Clear all data on this device',
    sq: 'Square', st: 'Story', green: 'Green', blue: 'Blue', yellow: 'Yellow', red: 'Red',
    pronGuide: 'CAPITALS show the stressed syllable. A hyphen splits syllables; say them evenly and let the vowels ring — Lingala vowels are pure and never swallowed.',
    flip: 'Flip direction',
    slideHint: 'Slide to explore more words',
    emptyArchive: 'Your archive fills as the days pass. Come back tomorrow for a new card.',
  },
  fr: {
    today: 'Aujourd’hui', archive: 'Archives', settings: 'Réglages',
    download: 'Télécharger', copy: 'Copier la phrase', caption: 'Copier la légende',
    story: 'Format story', whatsapp: 'Pour WhatsApp', readMore: 'Lire plus',
    readLess: 'Réduire', yesterday: 'Carte d’hier', sayIt: 'Comment le dire',
    spotlight: 'Phrase de la semaine', share: 'Partager', copied: 'Copié !',
    saved: 'Enregistré !', streakOne: 'jours de suite', streakDoneToday: 'partagé aujourd’hui',
    suggestTitle: 'Une phrase qui nous manque ?',
    suggestBody: 'Partagez un mot, un proverbe ou une expression de votre famille. Nous lisons chaque proposition.',
    suggestPhrase: 'La phrase (en lingala)', suggestMeaning: 'Sa signification',
    suggestName: 'Votre nom ou pseudo (facultatif)', suggestContext: 'Contexte culturel (facultatif)',
    suggestSend: 'Envoyer', suggestThanks: 'Votre e-mail est prêt — appuyez sur envoyer. Matondi !',
    suggestOffline: 'Vous êtes hors ligne. Réessayez une fois connecté.',
    langLabel: 'Langue de l’interface', themeLabel: 'Couleur de la carte', formatLabel: 'Téléchargement par défaut',
    notifyLabel: 'Rappel quotidien', wipe: 'Effacer toutes les données de cet appareil',
    sq: 'Carré', st: 'Story', green: 'Vert', blue: 'Bleu', yellow: 'Jaune', red: 'Rouge',
    pronGuide: 'Les MAJUSCULES indiquent la syllabe accentuée. Le tiret sépare les syllabes ; prononcez-les régulièrement et faites sonner les voyelles — en lingala elles sont pures.',
    flip: 'Inverser le sens',
    slideHint: 'Glissez pour découvrir d’autres mots',
    emptyArchive: 'Vos archives se remplissent au fil des jours. Revenez demain pour une nouvelle carte.',
  },
};

const HASHTAGS = '#Lingala #Congo #RDC #CongoleseEverywhere #Kinshasa';

const state = {
  settings: null,
  view: 'today',
  now: new Date(),
  direction: 'fr-ln',
};

const t = (k) => (T[state.settings?.lang] || T.en)[k] || k;

// --- learning direction (pair picker) ---------------------------------------
// The product teaches both ways for two pairs: Lingala↔French and Lingala↔
// English. `direction` is "from-to"; the non-Lingala side is the foreign gloss
// shown on the card. Interface language (chrome/note) is a separate setting.
const DIR_NAMES = { ln: 'Lingala', fr: 'Français', en: 'English' };
const DEFAULT_DIR = { en: 'en-ln', fr: 'fr-ln', ln: 'ln-fr' };

const foreignOf = (direction) => {
  const [from, to] = direction.split('-');
  return from === 'ln' ? to : from;
};
const foreignText = (phrase, direction) => (foreignOf(direction) === 'fr' ? phrase.fr : phrase.en);
const dirLabel = (direction) => {
  const [from, to] = direction.split('-');
  return `${DIR_NAMES[from]} → ${DIR_NAMES[to]}`;
};

function setDirection(direction) {
  state.direction = direction;
  localStorage.setItem('lingala.direction', direction);
  render();
}

// Control: pick the foreign language (FR/EN) + flip the practice direction.
function directionBar() {
  const foreign = foreignOf(state.direction);
  const learningLn = state.direction.endsWith('-ln');
  const seg = el('div', { class: 'dir-seg' },
    ['fr', 'en'].map((f) => el('button', {
      class: 'dir-segbtn' + (foreign === f ? ' active' : ''), type: 'button', text: DIR_NAMES[f],
      onclick: () => setDirection(learningLn ? `${f}-ln` : `ln-${f}`),
    })));
  const now = el('div', { class: 'dir-now' }, [
    el('span', { class: 'dir-label', text: dirLabel(state.direction) }),
    el('button', {
      class: 'dir-flip', type: 'button', 'aria-label': t('flip'), title: t('flip'), text: '⇄',
      onclick: () => { const [a, b] = state.direction.split('-'); setDirection(`${b}-${a}`); },
    }),
  ]);
  return el('div', { class: 'dirbar' }, [seg, now]);
}

// --- toast ------------------------------------------------------------------
let toastTimer;
function toast(msg) {
  let n = document.getElementById('toast');
  if (!n) {
    n = el('div', { id: 'toast', class: 'toast' });
    document.body.appendChild(n);
  }
  n.textContent = msg;
  n.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => n.classList.remove('show'), 1800);
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast(t('copied'));
  } catch {
    // Fallback for browsers without clipboard permission.
    const ta = el('textarea', { value: text, style: 'position:fixed;opacity:0' });
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); toast(t('copied')); } catch {}
    ta.remove();
  }
}

// --- card image: download or native share -----------------------------------
// Render the current card to a PNG File (shared by download + share).
async function cardFile(phrase, dayIndex, format) {
  const canvas = renderCard(phrase, {
    format, theme: state.settings.theme, lang: state.settings.lang, dayIndex,
    direction: state.direction,
  });
  const blob = await canvasToBlob(canvas);
  return new File([blob], `lingala-${phrase.id}-${format}.png`, { type: 'image/png' });
}

// The Download button: save the image straight to the device — NO share sheet.
// (Desktop Safari supports file-sharing, so the old code opened the OS share
// bar instead of downloading.)
async function downloadCard(phrase, dayIndex, format) {
  const file = await cardFile(phrase, dayIndex, format);
  const url = URL.createObjectURL(file);
  const a = el('a', { href: url, download: file.name });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  toast(t('saved'));
  await engage();
}

// The Share button (shown only where the OS share sheet handles files — mainly
// mobile): post straight to Instagram/WhatsApp or save to the camera roll.
async function shareCard(phrase, dayIndex, format) {
  const file = await cardFile(phrase, dayIndex, format);
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Lingala', text: phrase.lingala });
      await engage();
    } catch { /* user cancelled — leave it */ }
    return;
  }
  return downloadCard(phrase, dayIndex, format);
}

function captionFor(phrase) {
  const lines = [
    `${phrase.lingala} — ${phrase.en}`,
    state.settings.lang === 'fr' ? `🇫🇷 ${phrase.fr}` : null,
    `🗣️ ${phrase.phonetic}`,
    '',
    phrase.note,
    '',
    'Share this with someone who speaks Lingala 🇨🇩',
    'Daily Lingala phrase from lingala.artivicolab.com',
    '',
    HASHTAGS,
  ].filter((l) => l !== null);
  return lines.join('\n');
}

function whatsappFor(phrase) {
  return `*${phrase.lingala}*\n${foreignText(phrase, state.direction)}\n_${phrase.phonetic}_\n\n${phrase.note}\n\n— lingala.artivicolab.com`;
}

// Advance the streak on a real action and refresh the badge.
async function engage() {
  const s = await markEngaged(state.now);
  const badge = document.getElementById('streakBadge');
  if (badge) badge.textContent = streakLabel(s);
}

function streakLabel(s) {
  if (!s.current) return '';
  return `🔥 ${s.current} ${t('streakOne')}`;
}

// --- preview card (DOM, mirrors the canvas design) --------------------------
function previewCard(phrase, dayIndex) {
  const g = gradientFor(state.settings.theme, dayIndex);
  const cat = CATEGORIES[phrase.category];
  const catLabel = (cat && (state.settings.lang === 'fr' ? cat.fr : cat.en)) || phrase.category;
  const translation = foreignText(phrase, state.direction);

  const card = el('div', { class: 'card', style:
    `--from:${g.from};--to:${g.to};--accent:${g.accent};--muted:${g.muted}` });

  card.appendChild(el('div', { class: 'card-cat', text: catLabel.toUpperCase() }));
  card.appendChild(el('div', { class: 'card-strip' }));
  card.appendChild(el('div', { class: 'card-phrase', text: phrase.lingala }));
  card.appendChild(el('div', { class: 'card-trans', text: translation }));

  // Phonetic — tap to expand the pronunciation guide.
  const pron = el('button', { class: 'card-pron', type: 'button', 'aria-expanded': 'false' },
    [el('span', { text: phrase.phonetic }), el('span', { class: 'pron-hint', text: '  ◌' })]);
  const pronPanel = pronunciationPanel(phrase);
  pron.addEventListener('click', () => {
    const open = pronPanel.classList.toggle('open');
    pron.setAttribute('aria-expanded', String(open));
  });
  card.appendChild(pron);
  card.appendChild(pronPanel);

  // Cultural note + read-more expansion.
  const note = el('p', { class: 'card-note', text: phrase.note });
  card.appendChild(note);
  if (phrase.long && phrase.long !== phrase.note) {
    const long = el('p', { class: 'card-long', text: phrase.long });
    const more = el('button', { class: 'read-more', type: 'button', text: t('readMore') });
    more.addEventListener('click', () => {
      const open = long.classList.toggle('open');
      more.textContent = open ? t('readLess') : t('readMore');
    });
    card.appendChild(long);
    card.appendChild(more);
  }

  card.appendChild(el('div', { class: 'card-mark', text: 'LINGALA' }));
  return card;
}

function pronunciationPanel(phrase) {
  const panel = el('div', { class: 'pron-panel' });
  const syl = el('div', { class: 'pron-syllables' });
  for (const part of phrase.phonetic.split(/[-\s]+/)) {
    const stressed = /[A-Z]{2,}/.test(part); // a fully-capitalised chunk = stress
    syl.appendChild(el('span', { class: 'syl' + (stressed ? ' syl-stress' : ''), text: part }));
  }
  panel.appendChild(syl);
  panel.appendChild(el('p', { class: 'pron-guide', text: t('pronGuide') }));
  return panel;
}

// --- screens ----------------------------------------------------------------
function screenToday() {
  const wrap = el('div', { class: 'screen' });
  const idx = indexForDate(state.now);
  const phrase = phraseForDate(state.now);

  if (isSpotlight(state.now)) {
    wrap.appendChild(el('div', { class: 'spotlight-tag', text: '★ ' + t('spotlight') }));
  }

  wrap.appendChild(directionBar());
  wrap.appendChild(previewCard(phrase, idx));

  // Primary actions.
  const actions = el('div', { class: 'actions' });
  actions.appendChild(el('button', {
    class: 'btn btn-primary', type: 'button', text: '⬇  ' + t('download'),
    onclick: () => downloadCard(phrase, idx, state.settings.format),
  }));
  actions.appendChild(el('button', {
    class: 'btn', type: 'button', text: t('caption'),
    onclick: () => { copyText(captionFor(phrase)); engage(); },
  }));
  wrap.appendChild(actions);

  // Secondary sharing tools.
  const tools = el('div', { class: 'tools' });
  if (navigator.share) {
    tools.appendChild(el('button', {
      class: 'chip', type: 'button', text: t('share'),
      onclick: () => shareCard(phrase, idx, state.settings.format),
    }));
  }
  tools.appendChild(el('button', {
    class: 'chip', type: 'button', text: t('story'),
    onclick: () => downloadCard(phrase, idx, 'story'),
  }));
  tools.appendChild(el('button', {
    class: 'chip', type: 'button', text: t('copy'),
    onclick: () => { copyText(`${phrase.lingala} — ${foreignText(phrase, state.direction)} (${phrase.phonetic})`); engage(); },
  }));
  tools.appendChild(el('button', {
    class: 'chip', type: 'button', text: t('whatsapp'),
    onclick: () => { copyText(whatsappFor(phrase)); engage(); },
  }));
  wrap.appendChild(tools);

  wrap.appendChild(suggestForm());
  return wrap;
}

function screenArchive() {
  const wrap = el('div', { class: 'screen' });
  const grid = el('div', { class: 'archive-grid' });
  // Build the last 90 days back from today; every day maps deterministically
  // to a phrase, so the grid is always populated and browsable.
  for (let back = 0; back < 90; back++) {
    const d = new Date(state.now);
    d.setDate(d.getDate() - back);
    const idx = indexForDate(d);
    const phrase = PHRASES[idx];
    const g = gradientFor(state.settings.theme, idx);
    const cell = el('button', {
      class: 'archive-cell', type: 'button',
      style: `--from:${g.from};--to:${g.to};--accent:${g.accent}`,
      onclick: () => openCardOverlay(phrase, idx, d),
    }, [
      el('span', { class: 'ac-phrase', text: phrase.lingala }),
      el('span', { class: 'ac-date', text: dateKey(d).slice(5) }),
    ]);
    grid.appendChild(cell);
  }
  wrap.appendChild(grid);
  return wrap;
}

function openCardOverlay(phrase, idx, date) {
  const overlay = el('div', { class: 'overlay', onclick: (e) => {
    if (e.target === overlay) overlay.remove();
  } });
  const inner = el('div', { class: 'overlay-inner' });
  inner.appendChild(el('button', { class: 'overlay-close', type: 'button', text: '✕',
    'aria-label': 'close', onclick: () => overlay.remove() }));
  inner.appendChild(previewCard(phrase, idx));
  inner.appendChild(el('button', {
    class: 'btn btn-primary', type: 'button', text: '⬇  ' + t('download'),
    onclick: () => downloadCard(phrase, idx, state.settings.format),
  }));
  overlay.appendChild(inner);
  document.body.appendChild(overlay);
}

function screenSettings() {
  const wrap = el('div', { class: 'screen settings' });

  const group = (labelKey, control) =>
    el('div', { class: 'set-group' }, [el('label', { class: 'set-label', text: t(labelKey) }), control]);

  // Interface language.
  const langSel = el('select', { class: 'set-control', onchange: async (e) => {
    state.settings = await saveSettings({ lang: e.target.value });
    render();
  } }, [
    el('option', { value: 'en', text: 'English', ...(state.settings.lang === 'en' ? { selected: '' } : {}) }),
    el('option', { value: 'fr', text: 'Français', ...(state.settings.lang === 'fr' ? { selected: '' } : {}) }),
  ]);
  wrap.appendChild(group('langLabel', langSel));

  // Card colour theme.
  const themes = [['green', 'green'], ['blue', 'blue'], ['yellow', 'yellow'], ['red', 'red']];
  const themeRow = el('div', { class: 'theme-row' },
    themes.map(([val, key]) => {
      const g = gradientFor(val, indexForDate(state.now));
      return el('button', {
        class: 'theme-swatch' + (state.settings.theme === val ? ' active' : ''),
        type: 'button', style: `background:linear-gradient(135deg,${g.from},${g.to})`,
        title: t(key), 'aria-label': t(key),
        onclick: async () => { localStorage.setItem('lingala.theme', val); state.settings = await saveSettings({ theme: val }); render(); },
      }, [el('span', { text: t(key) })]);
    }));
  wrap.appendChild(group('themeLabel', themeRow));

  // Default download format.
  const fmtRow = el('div', { class: 'seg' }, [['square', 'sq'], ['story', 'st']].map(([val, key]) =>
    el('button', {
      class: 'seg-btn' + (state.settings.format === val ? ' active' : ''), type: 'button', text: t(key),
      onclick: async () => { state.settings = await saveSettings({ format: val }); render(); },
    })));
  wrap.appendChild(group('formatLabel', fmtRow));

  // Daily reminder toggle (best-effort; uses the Notification API, no server).
  const notifyBtn = el('button', {
    class: 'toggle' + (state.settings.notify ? ' on' : ''), type: 'button',
    role: 'switch', 'aria-checked': String(!!state.settings.notify),
    onclick: async () => {
      let on = !state.settings.notify;
      if (on && 'Notification' in window && Notification.permission !== 'granted') {
        const perm = await Notification.requestPermission();
        if (perm !== 'granted') on = false;
      }
      state.settings = await saveSettings({ notify: on });
      render();
    },
  }, [el('span', { class: 'knob' })]);
  wrap.appendChild(group('notifyLabel', notifyBtn));

  // Data control.
  wrap.appendChild(el('button', {
    class: 'btn btn-danger', type: 'button', text: t('wipe'),
    onclick: async () => { await wipeAll(); state.settings = await getSettings(); render(); toast(t('saved')); },
  }));

  return wrap;
}

// --- suggest a phrase (opens the visitor's email app to artivicolab@gmail.com) ---
function suggestForm() {
  const box = el('section', { class: 'suggest' });
  box.appendChild(el('h2', { class: 'suggest-title', text: t('suggestTitle') }));
  box.appendChild(el('p', { class: 'suggest-body', text: t('suggestBody') }));

  const f = el('form', { class: 'suggest-form', name: 'suggest' });
  const field = (name, labelKey, type = 'input') => {
    const id = 'sf-' + name;
    const ctrl = type === 'textarea'
      ? el('textarea', { id, name, rows: '2' })
      : el('input', { id, name, type: 'text' });
    return el('div', { class: 'field' }, [el('label', { for: id, text: t(labelKey) }), ctrl]);
  };
  f.appendChild(field('phrase', 'suggestPhrase'));
  f.appendChild(field('meaning', 'suggestMeaning'));
  f.appendChild(field('context', 'suggestContext', 'textarea'));
  f.appendChild(field('contributor', 'suggestName'));
  f.appendChild(el('button', { class: 'btn btn-primary', type: 'submit', text: t('suggestSend') }));

  f.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(f);
    const get = (k) => (fd.get(k) || '').toString().trim();
    const phrase = get('phrase');
    if (!phrase) { const pf = f.querySelector('[name="phrase"]'); if (pf) pf.focus(); return; }
    // No backend on a static host — open the visitor's email app, pre-filled
    // and addressed to us. We receive each suggestion as an email.
    const lines = [
      `Phrase (Lingala): ${phrase}`,
      `Meaning: ${get('meaning')}`,
      get('context') ? `Cultural context: ${get('context')}` : null,
      get('contributor') ? `From: ${get('contributor')}` : null,
      '',
      'Sent from lingala.artivicolab.com',
    ].filter((l) => l !== null);
    const href = `mailto:artivicolab@gmail.com?subject=${encodeURIComponent('Lingala phrase suggestion: ' + phrase)}&body=${encodeURIComponent(lines.join('\n'))}`;
    window.location.href = href;
    f.reset();
    box.replaceChildren(el('p', { class: 'suggest-thanks', text: t('suggestThanks') }));
  });
  box.appendChild(f);
  return box;
}

// --- shell + view switching -------------------------------------------------
function render() {
  document.documentElement.setAttribute('data-theme', state.settings.theme);
  document.documentElement.lang = state.settings.lang;

  const nav = document.getElementById('nav');
  nav.replaceChildren(...['today', 'archive', 'settings'].map((v) =>
    el('button', {
      class: 'nav-btn' + (state.view === v ? ' active' : ''), type: 'button', text: t(v),
      onclick: () => { state.view = v; render(); window.scrollTo(0, 0); },
    })));

  const main = document.getElementById('screen');
  const view = state.view === 'archive' ? screenArchive()
    : state.view === 'settings' ? screenSettings()
    : screenToday();
  main.replaceChildren(view);
}

// --- daily reminder (best effort, opportunistic) ----------------------------
function maybeNotify() {
  if (!state.settings.notify || !('Notification' in window) || Notification.permission !== 'granted') return;
  const today = dateKey(state.now);
  if (localStorage.getItem('lingala.notified') === today) return;
  localStorage.setItem('lingala.notified', today);
  const phrase = phraseForDate(state.now);
  try { new Notification('Lingala', { body: `${t('today')}: ${phrase.lingala} — ${phrase.en}` }); } catch {}
}

async function init() {
  state.settings = await getSettings();
  // Theme is shared site-wide via localStorage so the homepage, app, and the
  // other pages all stay on the same colour.
  const savedTheme = localStorage.getItem('lingala.theme');
  if (savedTheme) state.settings.theme = savedTheme;
  else localStorage.setItem('lingala.theme', state.settings.theme);
  state.direction = localStorage.getItem('lingala.direction') || DEFAULT_DIR[state.settings.lang] || 'fr-ln';
  const streak = await reconcileStreak(state.now);

  render();

  // Streak badge in the header.
  const badge = document.getElementById('streakBadge');
  if (badge) badge.textContent = streakLabel(streak);

  // Record today's view in the archive (passive — does not advance the streak).
  recordView(state.now, phraseForDate(state.now).id);
  maybeNotify();

  // Service worker disabled during active development — it was caching stale
  // files and hiding changes. The /sw.js kill-switch unregisters any existing
  // worker on next load. Re-enable before launch (see todo.md).
  // if ('serviceWorker' in navigator) {
  //   navigator.serviceWorker.register('/sw.js').catch(() => {});
  // }
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister()));
  }
}

init();
