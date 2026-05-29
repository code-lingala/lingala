// Lingala — card renderer. Draws a phrase card to a Canvas at post-ready
// resolution (1080×1080 square, 1080×1920 story) entirely in the browser.
// The downloaded image must look like a designer made it, not like a
// screenshot of a webpage — so the layout, spacing and typographic hierarchy
// here are deliberate, and every element on the card earns its place.

import { CATEGORIES } from './data/phrases.js';

// Four DRC-flag themes — green, blue, yellow, red — matching the rest of the
// site. Each carries gradient variants; the day index picks one so the daily
// feed is cohesive-but-varied. Yellow is a light field, so its text/accent
// flip to dark to stay readable on the exported image.
const THEMES = {
  green: {
    accent: '#D4A017',
    text: '#FFFFFF',
    muted: 'rgba(255,255,255,0.74)',
    soft: 'rgba(255,255,255,0.14)',
    variants: [
      ['#0B2620', '#1F5640'], // equatorial forest canopy
      ['#0E2B23', '#236046'],
      ['#08231C', '#1A4E38'],
    ],
  },
  blue: {
    accent: '#E1A92C',
    text: '#FFFFFF',
    muted: 'rgba(255,255,255,0.74)',
    soft: 'rgba(255,255,255,0.14)',
    variants: [
      ['#0A2A4C', '#1462B0'], // Congo-river / flag blue
      ['#08233F', '#155EA6'],
      ['#0C2E55', '#1A6BC4'],
    ],
  },
  yellow: {
    accent: '#9A3B12',
    text: '#1A1305',
    muted: 'rgba(26,19,5,0.74)',
    soft: 'rgba(0,0,0,0.10)',
    variants: [
      ['#F4C81E', '#E0A800'], // flag gold — light field, dark ink
      ['#F2C200', '#D99E00'],
      ['#F7D02E', '#E8B400'],
    ],
  },
  red: {
    accent: '#E6B23A',
    text: '#FFF4F2',
    muted: 'rgba(255,244,242,0.74)',
    soft: 'rgba(255,255,255,0.12)',
    variants: [
      ['#5E1414', '#A52121'], // flag red
      ['#52100F', '#9A1F1F'],
      ['#681818', '#B62828'],
    ],
  },
};

function pickVariant(theme, dayIndex) {
  const t = THEMES[theme] || THEMES.green;
  const pair = t.variants[((dayIndex % t.variants.length) + t.variants.length) % t.variants.length];
  return { ...t, gradient: pair };
}

// Shared so the on-screen preview matches the downloaded image exactly.
export function gradientFor(theme, dayIndex) {
  const v = pickVariant(theme, dayIndex);
  return { from: v.gradient[0], to: v.gradient[1], accent: v.accent, text: v.text, muted: v.muted };
}

// Word-wrap `text` into lines that fit `maxWidth` at the current ctx font.
function wrapLines(ctx, text, maxWidth) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// Shrink font size until `text` fits in at most `maxLines` lines of `maxWidth`.
// Returns { size, lines }. weight/family describe the face.
function fitText(ctx, text, { maxWidth, maxLines, start, min, weight, family }) {
  let size = start;
  while (size > min) {
    ctx.font = `${weight} ${size}px ${family}`;
    const lines = wrapLines(ctx, text, maxWidth);
    if (lines.length <= maxLines) return { size, lines };
    size -= 4;
  }
  ctx.font = `${weight} ${min}px ${family}`;
  return { size: min, lines: wrapLines(ctx, text, maxWidth) };
}

// A row of small diamonds — a restrained nod to Congolese geometric weaving,
// used as a divider/border accent rather than surface decoration.
function diamondStrip(ctx, x, y, width, color, count = 9) {
  const gap = width / count;
  const r = Math.min(gap * 0.22, 11);
  ctx.save();
  ctx.fillStyle = color;
  for (let i = 0; i < count; i++) {
    const cx = x + gap * (i + 0.5);
    ctx.beginPath();
    ctx.moveTo(cx, y - r);
    ctx.lineTo(cx + r, y);
    ctx.lineTo(cx, y + r);
    ctx.lineTo(cx - r, y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

const DISPLAY = `'Arial Black', 'Helvetica Neue', Helvetica, Arial, sans-serif`;
const BODY = `'Helvetica Neue', Helvetica, Arial, sans-serif`;

/**
 * Render one phrase card.
 * @param {object} phrase  entry from PHRASES
 * @param {object} opts    { format:'square'|'story', theme, lang:'en'|'fr', dayIndex }
 * @returns {HTMLCanvasElement}
 */
export function renderCard(phrase, opts = {}) {
  const { format = 'square', theme = 'green', lang = 'en', dayIndex = 0, direction } = opts;
  const W = 1080;
  const H = format === 'story' ? 1920 : 1080;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const pal = pickVariant(theme, dayIndex);

  // Background gradient.
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, pal.gradient[0]);
  g.addColorStop(1, pal.gradient[1]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Inset frame.
  const M = 84;
  ctx.strokeStyle = pal.soft;
  ctx.lineWidth = 3;
  ctx.strokeRect(M * 0.55, M * 0.55, W - M * 1.1, H - M * 1.1);

  // The foreign gloss follows the learning direction (which pair the user
  // picked) when given; otherwise the interface language.
  const foreign = direction
    ? (direction.split('-').find((s) => s !== 'ln') || 'en')
    : (lang === 'fr' ? 'fr' : 'en');
  const translation = foreign === 'fr' ? phrase.fr : phrase.en;
  const cat = CATEGORIES[phrase.category];
  const catLabel = ((cat && (lang === 'fr' ? cat.fr : cat.en)) || phrase.category).toUpperCase();

  // Vertical layout. Story format gets more breathing room top and bottom.
  const cx = W / 2;
  let y = format === 'story' ? 430 : 250;

  // Category label.
  ctx.textAlign = 'center';
  ctx.fillStyle = pal.accent;
  ctx.font = `bold 30px ${BODY}`;
  ctx.save();
  // letter-spaced uppercase, drawn char by char for tracking.
  drawTracked(ctx, catLabel, cx, y, 30, 8);
  ctx.restore();
  y += 40;
  diamondStrip(ctx, cx - 110, y, 220, pal.accent, 7);
  y += format === 'story' ? 90 : 70;

  // Lingala phrase — the hero.
  const phraseFit = fitText(ctx, phrase.lingala, {
    maxWidth: W - M * 2,
    maxLines: 3,
    start: 150,
    min: 64,
    weight: '900',
    family: DISPLAY,
  });
  ctx.fillStyle = pal.text;
  ctx.font = `900 ${phraseFit.size}px ${DISPLAY}`;
  const phraseLH = phraseFit.size * 1.06;
  for (const line of phraseFit.lines) {
    ctx.fillText(line, cx, y + phraseFit.size * 0.8);
    y += phraseLH;
  }
  y += 28;

  // English / French translation.
  const transFit = fitText(ctx, translation, {
    maxWidth: W - M * 2,
    maxLines: 2,
    start: 56,
    min: 34,
    weight: '600',
    family: BODY,
  });
  ctx.fillStyle = pal.text;
  ctx.font = `600 ${transFit.size}px ${BODY}`;
  for (const line of transFit.lines) {
    ctx.fillText(line, cx, y + transFit.size * 0.8);
    y += transFit.size * 1.18;
  }
  y += 14;

  // Phonetic pronunciation — muted tertiary treatment.
  ctx.fillStyle = pal.muted;
  ctx.font = `italic 40px ${BODY}`;
  ctx.fillText(phrase.phonetic, cx, y + 30);
  y += 70;

  // Cultural note. Anchor it to the lower region for a stable composition.
  const noteTop = format === 'story' ? H - 560 : H - 360;
  y = Math.max(y + 20, noteTop);
  diamondStrip(ctx, cx - 150, y, 300, pal.soft, 11);
  y += 56;

  ctx.fillStyle = pal.muted;
  ctx.font = `400 34px ${BODY}`;
  // Pick the cultural note in the active interface language with EN fallback.
  const lang = opts.lang;
  const noteText = (lang === 'fr' && phrase.noteFr) ? phrase.noteFr
                 : (lang === 'ln' && phrase.noteLn) ? phrase.noteLn
                 : phrase.note;
  const noteLines = wrapLines(ctx, noteText, W - M * 2);
  for (const line of noteLines.slice(0, 5)) {
    ctx.fillText(line, cx, y);
    y += 46;
  }

  // Watermark wordmark — passive marketing, bottom of the card.
  ctx.fillStyle = pal.text;
  ctx.font = `800 38px ${DISPLAY}`;
  const wmY = H - (format === 'story' ? 150 : 96);
  drawTracked(ctx, 'LINGALA', cx, wmY, 38, 6);
  ctx.fillStyle = pal.muted;
  ctx.font = `500 24px ${BODY}`;
  drawTracked(ctx, 'lingala.artivicolab.com', cx, wmY + 38, 24, 4);

  // Risograph-style grain over the whole card — the thing that makes the export
  // feel like a printed artifact rather than a website screenshot. Applied last,
  // so it sits over the type the way real ink texture does. Mirrored in CSS
  // (.card::after) so the on-screen preview matches.
  applyGrain(ctx, W, H, 0.05);

  return canvas;
}

// Composite low-opacity monochrome noise across the canvas. Uses a small tiled
// noise canvas + pattern fill (cheap) and the 'overlay' blend for a riso tooth.
function applyGrain(ctx, W, H, alpha) {
  const tile = 220;
  const noise = document.createElement('canvas');
  noise.width = noise.height = tile;
  const nctx = noise.getContext('2d');
  const img = nctx.createImageData(tile, tile);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const v = (Math.random() * 255) | 0;
    d[i] = d[i + 1] = d[i + 2] = v;
    d[i + 3] = 255;
  }
  nctx.putImageData(img, 0, 0);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = ctx.createPattern(noise, 'repeat');
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

// Draw centered text with manual letter-spacing (canvas has no native tracking
// in all engines we target).
function drawTracked(ctx, text, cx, y, size, tracking) {
  const chars = [...text];
  let total = 0;
  for (const ch of chars) total += ctx.measureText(ch).width + tracking;
  total -= tracking;
  let x = cx - total / 2;
  const prevAlign = ctx.textAlign;
  ctx.textAlign = 'left';
  for (const ch of chars) {
    ctx.fillText(ch, x, y);
    x += ctx.measureText(ch).width + tracking;
  }
  ctx.textAlign = prevAlign;
}

// Convert a rendered canvas to a PNG Blob for download/share.
export function canvasToBlob(canvas) {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}
