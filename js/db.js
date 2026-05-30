// Lingala — local storage layer. Everything the app remembers lives here, on
// the device, in IndexedDB. Three stores: streak (one row), settings (one row),
// and archive (one row per day the user has viewed a card). Nothing is ever
// sent anywhere — this file makes no network calls and never will.

import { dateKey } from './data/phrases.js';

const DB_NAME = 'losako';
const DB_VERSION = 1;

let _dbPromise = null;

function open() {
  if (_dbPromise) return _dbPromise;
  _dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      // Singleton stores keyed by a fixed string; archive keyed by date.
      if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
      if (!db.objectStoreNames.contains('archive')) {
        db.createObjectStore('archive', { keyPath: 'date' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return _dbPromise;
}

function tx(store, mode, fn) {
  return open().then(
    (db) =>
      new Promise((resolve, reject) => {
        const t = db.transaction(store, mode);
        const s = t.objectStore(store);
        const result = fn(s);
        t.oncomplete = () => resolve(result.value);
        t.onerror = () => reject(t.error);
        // result is a request whose .result we surface on complete.
        result.onsuccess = () => (result.value = result.result);
      })
  );
}

// --- Settings ---------------------------------------------------------------

const DEFAULT_SETTINGS = {
  lang: 'en', // interface language: 'en' | 'fr'
  theme: 'green', // card palette: 'green' | 'blue' | 'yellow' | 'red'
  format: 'square', // default download: 'square' | 'story'
  notify: false, // daily browser notification opt-in
};

export async function getSettings() {
  const saved = await tx('kv', 'readonly', (s) => s.get('settings'));
  return { ...DEFAULT_SETTINGS, ...(saved || {}) };
}

export async function saveSettings(patch) {
  const current = await getSettings();
  const next = { ...current, ...patch };
  await tx('kv', 'readwrite', (s) => s.put(next, 'settings'));
  return next;
}

// --- Streak -----------------------------------------------------------------
// A streak counts consecutive calendar days the user has engaged (opened and
// downloaded/copied/shared today's card). We only advance it on a real action,
// not a passive open, so the number means something.

const DEFAULT_STREAK = { current: 0, longest: 0, lastDate: null };

export async function getStreak() {
  const saved = await tx('kv', 'readonly', (s) => s.get('streak'));
  return { ...DEFAULT_STREAK, ...(saved || {}) };
}

// Call when the user takes the daily action. Idempotent within a single day.
export async function markEngaged(today = new Date()) {
  const streak = await getStreak();
  const todayKey = dateKey(today);
  if (streak.lastDate === todayKey) return streak; // already counted today

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const continued = streak.lastDate === dateKey(yesterday);

  const current = continued ? streak.current + 1 : 1;
  const next = {
    current,
    longest: Math.max(current, streak.longest),
    lastDate: todayKey,
  };
  await tx('kv', 'readwrite', (s) => s.put(next, 'streak'));
  return next;
}

// Reconcile the displayed streak on open: if more than a day has passed since
// the last action, the streak is broken (shows 0) without erasing `longest`.
export async function reconcileStreak(today = new Date()) {
  const streak = await getStreak();
  if (!streak.lastDate) return streak;
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const fresh = streak.lastDate === dateKey(today) || streak.lastDate === dateKey(yesterday);
  if (fresh) return streak;
  const next = { ...streak, current: 0 };
  await tx('kv', 'readwrite', (s) => s.put(next, 'streak'));
  return next;
}

// --- Archive ----------------------------------------------------------------
// One record per day the user has actually seen, so the grid reflects their
// own history. The full phrase DB is bundled, so any past card can still be
// rebuilt for display even if it was never recorded here.

export async function recordView(date, phraseId) {
  const rec = { date: dateKey(date), phraseId, viewedAt: Date.now() };
  await tx('archive', 'readwrite', (s) => s.put(rec));
  return rec;
}

export async function getArchive() {
  const all = await tx('archive', 'readonly', (s) => s.getAll());
  return (all || []).sort((a, b) => (a.date < b.date ? 1 : -1)); // newest first
}

export async function wipeAll() {
  const db = await open();
  await Promise.all(
    ['kv', 'archive'].map(
      (name) =>
        new Promise((res, rej) => {
          const t = db.transaction(name, 'readwrite');
          t.objectStore(name).clear();
          t.oncomplete = res;
          t.onerror = () => rej(t.error);
        })
    )
  );
}
