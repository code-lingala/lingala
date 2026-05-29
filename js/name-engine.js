// Lingala name engine — pure data + rules, no API/backend (fits the static
// GitHub-Pages hard cap). Congolese naming isn't a math formula; this follows
// real cultural structures:
//   1. Birth circumstance (twins, after-twins, born in the rains) → a FIXED
//      traditional name, given by the birth itself, not chosen.
//   2. Otherwise a life Theme (+ optional Action) selects a name: a standalone
//      concept name, or a sentence/verb-object name (e.g. Alingami = "deeply
//      loved", Apesami = "given as a gift").
//
// ⚠️ Lingala names/meanings/phonetics are a first pass — native-speaker review
// pending (see todo.md), like all Lingala content here.

// Field 1 — birth circumstance. If chosen (≠ standard), it overrides everything.
export const CIRCUMSTANCE = {
  twin1:     { name: 'Mbuyi',    meaning: 'The first to arrive (first-born twin)', phonetic: 'MBOO-yi',
    note: 'Twins are received as a blessing with their own fixed names. The first to arrive is Mbuyi — given by the birth itself, never chosen.' },
  twin2:     { name: 'Mwanza',   meaning: 'The one who wraps the birth (second-born twin)', phonetic: 'MWAN-za',
    note: 'The second twin is Mwanza. Twin names are honoured and unchangeable — to carry one is to carry a story the whole family already knows.' },
  afterTwins:{ name: 'Kamwanya', meaning: 'The follower of twins', phonetic: 'ka-MWA-nya',
    note: 'The child born right after twins has a name of their own — Kamwanya — marking their place in the family the twins announced.' },
  storm:     { name: 'Mvula',    meaning: 'Rain — a blessing from the sky', phonetic: 'MVOO-la',
    note: 'A child born in heavy rain may be called Mvula. The weather of the day a child arrives can name them for life.' },
};

// Field 2 — theme labels (for the dropdown + connection line).
export const THEME_LABELS = {
  joy:      { en: 'Joy', fr: 'Joie', ln: 'Esengo' },
  peace:    { en: 'Peace', fr: 'Paix', ln: 'Kimia' },
  hope:     { en: 'Hope', fr: 'Espoir', ln: 'Elikya' },
  divine:   { en: 'Divine blessing', fr: 'Bénédiction divine', ln: 'Lipamboli' },
  love:     { en: 'Love & kindness', fr: 'Amour & bonté', ln: 'Bolingo' },
  glory:    { en: 'Glory & honour', fr: 'Gloire & honneur', ln: 'Kembo' },
};

// Standalone concept names (standard birth, used when no sentence rule matches).
const CONCEPTS = {
  joy:    { name: 'Esengo',   meaning: 'Pure joy', phonetic: 'e-SEN-go',
    note: 'Esengo is joy — the loud, shared, dancing kind that fills a Congolese gathering. To name a child Esengo is to wish them that warmth for life.' },
  peace:  { name: 'Kimia',    meaning: 'Calmness and peace', phonetic: 'ki-MI-a',
    note: 'Kimia is stillness and peace — a hope laid over a child that they will carry quiet and bring it to others.' },
  hope:   { name: 'Elikya',   meaning: 'Trust in the future', phonetic: 'e-LI-kya',
    note: 'Elikya is hope, held onto through hard seasons. A child given this name is given as a promise that tomorrow can be better.' },
  divine: { name: 'Matondo',  meaning: 'Thankfulness to God', phonetic: 'ma-TON-do',
    note: 'Faith runs through Congolese naming. Matondo is thanks — a child received as an answer to prayer.' },
  love:   { name: 'Bolingo',  meaning: 'Love', phonetic: 'bo-LIN-go',
    note: 'Bolingo is love itself — the word that floods Congolese rumba and gospel. A child named Bolingo is named for what holds a family together.' },
  glory:  { name: 'Kembo',    meaning: 'Splendour and honour', phonetic: 'KEM-bo',
    note: 'Kembo is glory and honour — often short for Kembo na Nzambe, glory to God. To carry it is to be a living thank-you.' },
};

// An extra kindness name love can resolve to.
const LOVE_KINDNESS = { name: 'Boboto', meaning: 'Goodness of heart', phonetic: 'bo-BO-to',
  note: 'Boboto is gentleness and goodness — the soft strength that keeps a community whole.' };

// Field 3 — sentence/verb-object names by theme + action.
const SENTENCE = {
  'divine|received': [
    { name: 'Apesami', meaning: 'Given as a gift', phonetic: 'a-pe-SA-mi',
      note: 'From kopesa, to give: Apesami means a child given as a gift. The name reads the birth as something received, not earned.' },
    { name: 'Kiponi', meaning: 'The chosen one', phonetic: 'ki-PO-ni',
      note: 'From kopona, to choose: Kiponi marks a child as chosen — set apart from the first breath.' },
  ],
  'divine|thanks': [
    { name: 'Matondo', meaning: 'Thankfulness', phonetic: 'ma-TON-do',
      note: 'Matondo is the family’s gratitude made into a name — a child received as an answer to prayer.' },
    { name: 'Netonami', meaning: 'Lifted high, exalted', phonetic: 'ne-to-NA-mi',
      note: 'A theocentric name that lifts the child’s whole life as praise.' },
    { name: 'Kembo na Nzambe', meaning: 'Glory to God', phonetic: 'KEM-bo na NZAM-be',
      note: 'Some names are whole declarations: Kembo na Nzambe gives the glory of a new life straight back to God.' },
  ],
  'love|received': [
    { name: 'Alingami', meaning: 'Deeply loved', phonetic: 'a-lin-GA-mi',
      note: 'From kolinga, to love: Alingami declares a loved child — not a description but a statement the family makes out loud.' },
    { name: 'Molimi', meaning: 'Protected spirit', phonetic: 'mo-LI-mi',
      note: 'Molimi carries the sense of a spirit watched over — a child held safe.' },
  ],
};

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

// —— Word-blending (elision) ————————————————————————————————————————————————
// Assemble a flowing name from a verb root + a theme noun. Rule: if word 1 ends
// in a vowel and word 2 starts with a vowel, drop word 1's final vowel; the
// connector "na" compresses to "n". (Pesa + Elikya → Peselikya; Kola + Esengo
// → Kolesengo; Zala + Kimia → Zalakimia; Kembo + na + Nzambe → Kembonzambe.)
const VOWELS = 'aeiou';
const VERBS = {
  give:   { root: 'Pesa',  g: { en: 'Bringer of', fr: 'Porteur de' } },
  grow:   { root: 'Kola',  g: { en: 'Growing in', fr: 'Grandir dans' } },
  be:     { root: 'Zala',  g: { en: 'Living in', fr: 'Vivre dans' } },
  love:   { root: 'Linga', g: { en: 'Loving', fr: 'Aimer' } },
  praise: { root: 'Kuma',  g: { en: 'Praise through', fr: 'Louange par' } },
};
const THEME_NOUN = {
  joy:    { word: 'Esengo',  g: { en: 'joy', fr: 'joie' } },
  peace:  { word: 'Kimia',   g: { en: 'peace', fr: 'paix' } },
  hope:   { word: 'Elikya',  g: { en: 'hope', fr: 'espoir' } },
  love:   { word: 'Bolingo', g: { en: 'love', fr: 'amour' } },
  glory:  { word: 'Kembo',   g: { en: 'glory', fr: 'gloire' } },
  divine: { word: 'Nzambe',  g: { en: 'God', fr: 'Dieu' } },
};
const THEME_VERBS = {
  joy: ['give', 'grow', 'be'], peace: ['be', 'grow'], hope: ['give', 'grow'],
  love: ['give', 'love'], glory: ['praise', 'give'], divine: ['praise', 'give'],
};

function blend(parts) {
  let out = '';
  for (let p of parts) {
    if (p.toLowerCase() === 'na') { out += 'n'; continue; } // connector → n
    p = p.toLowerCase();
    if (out && VOWELS.includes(out[out.length - 1]) && VOWELS.includes(p[0])) out = out.slice(0, -1);
    out += p;
  }
  return out.charAt(0).toUpperCase() + out.slice(1);
}

// Rough CV-syllable phonetic with penultimate stress (Lingala-ish), for the
// dynamically blended names. Curated names carry their own exact phonetics.
function syllabify(word) {
  const syl = word.toLowerCase().match(/[^aeiou]*[aeiou]+(?:[^aeiou](?![aeiou]))?/g) || [word.toLowerCase()];
  const s = Math.max(0, syl.length - 2);
  syl[s] = syl[s].toUpperCase();
  return syl.join('-');
}

// Keep blended names punchy for mobile: max 3 syllables / 8 letters.
function capName(name) {
  let syl = name.toLowerCase().match(/[^aeiou]*[aeiou]+(?:[^aeiou](?![aeiou]))?/g) || [name.toLowerCase()];
  if (syl.length > 3) syl = syl.slice(0, 3);
  let out = syl.join('');
  if (out.length > 8) out = out.slice(0, 8);
  return out.charAt(0).toUpperCase() + out.slice(1);
}

// —— Curated names database ————————————————————————————————————————————————
// Pre-blended/shortened names, tagged by gender ('f'/'m'/'u'), theme (a key in
// THEME_LABELS), and style ('traditional' pure-Lingala blend | 'hybrid' modern
// French–Lingala portmanteau). meaning + note are bilingual {en, fr}; the
// "connection" line is composed per-language at generation time.
//
// Gender mirrors how these names trend in Congo today, NOT grammar — most
// Lingala names are naturally unisex. The 'u' set is the abstract-noun /
// sentence names that fit any child; 'f'/'m' carry gendered usage trends.
//
// ⚠️ Names, meanings, phonetics AND the French are a first pass — native-speaker
// review pending (see todo.md), like all Lingala content here.
const NAMES = [
  // ♀ Feminine ————————————————————————————————————————————————————————————
  { name: 'Pesengo', gender: 'f', theme: 'joy', style: 'traditional', phonetic: 'pe-SEN-go',
    meaning: { en: 'She brings joy', fr: 'Elle apporte la joie' },
    note: { en: 'Pesengo folds pesa, to give, into esengo, joy: a girl who hands joy to everyone around her. A Congolese house is never quiet once joy walks in.',
            fr: 'Pesengo fond pesa, donner, dans esengo, la joie : une fille qui offre la joie à tout son entourage. Une maison congolaise n’est jamais silencieuse quand la joie y entre.' } },
  { name: 'Kolesengo', gender: 'f', theme: 'joy', style: 'traditional', phonetic: 'ko-le-SEN-go',
    meaning: { en: 'Growing in joy', fr: 'Grandir dans la joie' },
    note: { en: 'From kola, to grow, and esengo, joy — a wish that she grows up rooted in joy, the way a tree grows toward the light.',
            fr: 'De kola, grandir, et esengo, la joie — le souhait qu’elle grandisse enracinée dans la joie, comme un arbre pousse vers la lumière.' } },
  { name: 'Zalmia', gender: 'f', theme: 'peace', style: 'traditional', phonetic: 'zal-MI-a',
    meaning: { en: 'Peaceful presence', fr: 'Présence paisible' },
    note: { en: 'Zala, to be, blended with kimia, peace: a peaceful presence. To name a girl Zalmia is to ask that calm follow her wherever she goes.',
            fr: 'Zala, être, mêlé à kimia, la paix : une présence paisible. Nommer une fille Zalmia, c’est demander que le calme la suive partout.' } },
  { name: 'Merdi', gender: 'f', theme: 'divine', style: 'hybrid', phonetic: 'MER-di',
    meaning: { en: 'Wonder of God', fr: 'Merveille de Dieu' },
    note: { en: 'A modern French–Lingala blend of merveille, wonder, and Dieu, God — a wonder of God, the kind of sleek hybrid name Kinshasa loves today.',
            fr: 'Un mélange moderne franco-lingala de merveille et Dieu — une merveille de Dieu, le genre de nom hybride élégant que Kinshasa adore aujourd’hui.' } },
  { name: 'Glodina', gender: 'f', theme: 'glory', style: 'hybrid', phonetic: 'glo-DI-na',
    meaning: { en: 'Glory to God', fr: 'Gloire à Dieu' },
    note: { en: 'Glo (gloire) + di (Dieu) + na, the Lingala “of”: a sleek modern name that gives glory to God.',
            fr: 'Glo (gloire) + di (Dieu) + na, le « de » lingala : un nom moderne et élégant qui rend gloire à Dieu.' } },
  { name: 'Granza', gender: 'f', theme: 'divine', style: 'hybrid', phonetic: 'GRAN-za',
    meaning: { en: 'Grace of God', fr: 'Grâce de Dieu' },
    note: { en: 'Grâce + na + Nzambe — grace of God — blended the way modern Kinshasa names are made.',
            fr: 'Grâce + na + Nzambe — la grâce de Dieu — composé à la manière des noms modernes de Kinshasa.' } },
  { name: 'Elikyam', gender: 'f', theme: 'hope', style: 'traditional', phonetic: 'e-LI-kyam',
    meaning: { en: 'My hope', fr: 'Mon espoir' },
    note: { en: 'Elikya, hope, with na nga, “of mine”: my hope. A girl carried as the family’s own hope made visible.',
            fr: 'Elikya, l’espoir, avec na nga, « le mien » : mon espoir. Une fille portée comme l’espoir même de la famille, rendu visible.' } },

  // ♂ Masculine ———————————————————————————————————————————————————————————
  { name: 'Peselikya', gender: 'm', theme: 'hope', style: 'traditional', phonetic: 'pe-se-LI-kya',
    meaning: { en: 'Bringer of hope', fr: 'Porteur d’espoir' },
    note: { en: 'Pesa, to give, fused with elikya, hope: a bringer of hope. A boy named for what he hands the people around him.',
            fr: 'Pesa, donner, fondu avec elikya, l’espoir : un porteur d’espoir. Un garçon nommé pour ce qu’il offre à son entourage.' } },
  { name: 'Kuminza', gender: 'm', theme: 'divine', style: 'traditional', phonetic: 'ku-MIN-za',
    meaning: { en: 'Praiser of God', fr: 'Celui qui loue Dieu' },
    note: { en: 'From kumisa, to praise, and Nzambe, God: a praiser of God. His whole life is meant to be a song of praise.',
            fr: 'De kumisa, louer, et Nzambe, Dieu : celui qui loue Dieu. Sa vie entière est faite pour être un chant de louange.' } },
  { name: 'Tatelikya', gender: 'm', theme: 'hope', style: 'traditional', phonetic: 'ta-te-LI-kya',
    meaning: { en: 'He holds onto hope', fr: 'Il s’accroche à l’espoir' },
    note: { en: 'Tatama, to hold fast, joined to elikya, hope: one who holds onto hope. A name for a boy who will not let go when the seasons turn hard.',
            fr: 'Tatama, tenir bon, joint à elikya, l’espoir : celui qui s’accroche à l’espoir. Un nom pour un garçon qui ne lâche pas quand les saisons deviennent dures.' } },
  { name: 'Dondieu', gender: 'm', theme: 'divine', style: 'hybrid', phonetic: 'don-DYE',
    meaning: { en: 'Gift of God', fr: 'Don de Dieu' },
    note: { en: 'Don de Dieu — gift of God — compressed into a short, globally easy name. A boy received as a gift from above.',
            fr: 'Don de Dieu — comprimé en un nom court et facile partout. Un garçon reçu comme un don d’en haut.' } },
  { name: 'Mernza', gender: 'm', theme: 'divine', style: 'hybrid', phonetic: 'MER-nza',
    meaning: { en: 'Thanks be to God', fr: 'Merci à Dieu' },
    note: { en: 'Merci + na + Nzambe — thank you, God — a French–Lingala thank-you turned into a name.',
            fr: 'Merci + na + Nzambe — merci, Dieu — un remerciement franco-lingala devenu un nom.' } },
  { name: 'Netonza', gender: 'm', theme: 'glory', style: 'traditional', phonetic: 'ne-TON-za',
    meaning: { en: 'God is exalted', fr: 'Dieu est exalté' },
    note: { en: 'From netolama, exalted, and Nzambe, God: God is exalted. A theocentric name that lifts the boy’s whole life as praise.',
            fr: 'De netolama, exalté, et Nzambe, Dieu : Dieu est exalté. Un nom théocentrique qui élève toute la vie du garçon comme une louange.' } },

  // ⚧ Unisex — abstract nouns + sentence names that fit any child ————————————
  { name: 'Plamedi', gender: 'u', theme: 'divine', style: 'hybrid', phonetic: 'pla-ME-di',
    meaning: { en: 'God’s plan', fr: 'Le plan de Dieu' },
    note: { en: 'A modern French–Lingala blend — Plan de Dieu, the plan of God — the kind of hybrid name Congolese parents love today.',
            fr: 'Un mélange moderne franco-lingala — Plan de Dieu — le genre de nom hybride que les parents congolais adorent aujourd’hui.' } },
  { name: 'Kembonza', gender: 'u', theme: 'glory', style: 'traditional', phonetic: 'kem-BON-za',
    meaning: { en: 'Glory of God', fr: 'Gloire de Dieu' },
    note: { en: 'Kembo, glory, with na Nzambe: glory of God. A child whose very name returns the glory of a new life to its source.',
            fr: 'Kembo, la gloire, avec na Nzambe : la gloire de Dieu. Un enfant dont le nom même rend la gloire d’une vie nouvelle à sa source.' } },
  { name: 'Apesami', gender: 'u', theme: 'divine', style: 'traditional', phonetic: 'a-pe-SA-mi',
    meaning: { en: 'Given as a gift', fr: 'Donné comme un cadeau' },
    note: { en: 'From kopesa, to give: Apesami means a child given as a gift. The name reads the birth as something received, not earned.',
            fr: 'De kopesa, donner : Apesami, un enfant donné comme un cadeau. Le nom lit la naissance comme quelque chose de reçu, non de mérité.' } },
  { name: 'Alingami', gender: 'u', theme: 'love', style: 'traditional', phonetic: 'a-lin-GA-mi',
    meaning: { en: 'The beloved one', fr: 'Le bien-aimé' },
    note: { en: 'From kolinga, to love: Alingami declares a loved child — not a description but a statement the family makes out loud.',
            fr: 'De kolinga, aimer : Alingami déclare un enfant aimé — non une description mais une affirmation que la famille prononce à voix haute.' } },
  { name: 'Kiponi', gender: 'u', theme: 'divine', style: 'traditional', phonetic: 'ki-PO-ni',
    meaning: { en: 'The chosen one', fr: 'L’élu' },
    note: { en: 'From kopona, to choose: Kiponi marks a child as chosen — set apart from the very first breath.',
            fr: 'De kopona, choisir : Kiponi marque un enfant comme choisi — mis à part dès le premier souffle.' } },
  { name: 'Matondo', gender: 'u', theme: 'divine', style: 'traditional', phonetic: 'ma-TON-do',
    meaning: { en: 'Gratitude', fr: 'Gratitude' },
    note: { en: 'Short for matondo na Nzambe, thanks to God: gratitude itself. A child received as an answer to prayer.',
            fr: 'Abréviation de matondo na Nzambe, merci à Dieu : la gratitude même. Un enfant reçu comme une réponse à la prière.' } },
  { name: 'Keto', gender: 'u', theme: 'glory', style: 'traditional', phonetic: 'KE-to',
    meaning: { en: 'Our glory', fr: 'Notre gloire' },
    note: { en: 'Kembo, glory, with to, “our”: our glory. A small bright name for a child the whole family counts as their pride.',
            fr: 'Kembo, la gloire, avec to, « notre » : notre gloire. Un petit nom lumineux pour un enfant qui fait la fierté de toute la famille.' } },
];

// Pick a curated name by gender, preferring a theme match, then a style match
// within that theme — gender is the hard filter, theme/style only narrow.
function pickName(gender, theme, style) {
  let pool = NAMES.filter((n) => n.gender === gender);
  if (!pool.length) return null;
  const themed = pool.filter((n) => n.theme === theme);
  if (themed.length) pool = themed;
  if (style) { const s = pool.filter((n) => n.style === style); if (s.length) pool = s; }
  return rand(pool);
}

// Flatten a curated entry's bilingual {en,fr} fields to the requested language.
function localize(entry, lang) {
  const L = (v) => (v && typeof v === 'object' ? (v[lang] || v.en) : v);
  return { name: entry.name, phonetic: entry.phonetic, meaning: L(entry.meaning), note: L(entry.note), style: entry.style };
}

function generateHybrid(given, lang, gender) {
  let pool = NAMES.filter((n) => n.style === 'hybrid');
  if (gender === 'f' || gender === 'm') { const g = pool.filter((n) => n.gender === gender); if (g.length) pool = g; }
  const h = localize(rand(pool), lang);
  return {
    ...h, kind: 'hybrid',
    connection: lang === 'fr'
      ? `Un nom hybride moderne franco-lingala${given ? ', pour ' + given : ''}.`
      : `A modern French–Lingala hybrid name${given ? ', for ' + given : ''}.`,
  };
}

function generateBlended(theme, given, lang) {
  const noun = THEME_NOUN[theme];
  const v = VERBS[rand(THEME_VERBS[theme] || ['give'])];
  if (!noun || !v) return null;
  const name = capName(blend([v.root, noun.word]));
  const ng = noun.g[lang] || noun.g.en;
  const vg = v.g[lang] || v.g.en;
  return {
    name,
    meaning: `${vg} ${ng}`,
    phonetic: syllabify(name),
    note: lang === 'fr'
      ? `Un nom composé : la racine du verbe « ${v.root.toLowerCase()} » fondue avec « ${noun.word} » (${ng}) — comme le lingala fait couler les mots ensemble.`
      : `A blended name: the verb root “${v.root.toLowerCase()}” fused with “${noun.word}” (${ng}), the way Lingala lets words flow into one.`,
    connection: connectionFor(theme, '', given, lang),
    kind: 'blended',
  };
}

function connectionFor(theme, action, given, lang) {
  const tl = ((THEME_LABELS[theme] || {})[lang] || (THEME_LABELS[theme] || {}).en || '').toLowerCase();
  const who = given || (lang === 'fr' ? 'vous' : 'you');
  return lang === 'fr'
    ? `Choisi pour ${who} autour du thème : ${tl}.`
    : `Chosen for ${who} around the theme of ${tl}.`;
}

/**
 * @param {object} opts {circumstance, theme, action, given, lang}
 * @returns {{name,meaning,phonetic,note,connection,kind}}
 */
export function generateName(opts = {}) {
  const { circumstance = 'standard', theme = 'joy', action = '', given = '', lang = 'en', style = 'traditional', gender = 'any' } = opts;

  // 1. Birth circumstance wins outright (twin / after-twin / storm names are
  //    given by the birth itself, regardless of gender or chosen meaning).
  if (circumstance && circumstance !== 'standard' && CIRCUMSTANCE[circumstance]) {
    const c = CIRCUMSTANCE[circumstance];
    return {
      ...c, kind: 'circumstance',
      connection: lang === 'fr'
        ? 'Dans la tradition lingala, ce nom est donné par la naissance elle-même — il ne se choisit pas.'
        : 'In Lingala tradition this name is given by the birth itself — it is not chosen.',
    };
  }

  // 2. A chosen gender (girl/boy) draws from the curated names that carry that
  //    gendered usage trend in Congo, honouring theme + style where possible.
  if (gender === 'f' || gender === 'm') {
    const picked = pickName(gender, theme, style);
    if (picked) {
      const l = localize(picked, lang);
      return { ...l, kind: l.style === 'hybrid' ? 'hybrid' : 'curated', connection: connectionFor(theme, action, given, lang) };
    }
  }

  // 3. Modern French–Lingala hybrid style (overrides the traditional engine).
  if (style === 'hybrid') return generateHybrid(given, lang, gender);

  // 4. Sentence/verb-object name when a theme+action rule exists.
  const key = `${theme}|${action}`;
  if (SENTENCE[key]) {
    return { ...rand(SENTENCE[key]), kind: 'sentence', connection: connectionFor(theme, action, given, lang) };
  }

  // 5. Unisex / any: mostly the dynamic blender + standalone concepts (the
  //    engine's soul), with the curated unisex names folded into the rotation.
  if (Math.random() < 0.35) {
    const u = pickName('u', theme, style);
    if (u) {
      const l = localize(u, lang);
      return { ...l, kind: l.style === 'hybrid' ? 'hybrid' : 'curated', connection: connectionFor(theme, action, given, lang) };
    }
  }
  if (Math.random() < 0.6) {
    const b = generateBlended(theme, given, lang);
    if (b) return b;
  }
  let pick = CONCEPTS[theme] || CONCEPTS.joy;
  if (theme === 'love' && Math.random() < 0.5) pick = LOVE_KINDNESS;
  return { ...pick, kind: 'theme', connection: connectionFor(theme, action, given, lang) };
}

// —— Novel two-word fusion ————————————————————————————————————————————————
// Smash ANY two Lingala words into one new name:
//   • Base (Word A): keep its first two syllables only.
//   • Modifier (Word B): drop a leading vowel, THEN keep only its first two
//     syllables too — so two long words still fuse into a short, novel coinage
//     rather than reading as "WordA + whole WordB".
//   • Sound glue: if the base ends in a vowel and the modifier opens on a hard
//     consonant, bridge with a nasal — 'm' before b/p (labials), 'n' before
//     k/t/d — for that melodic Lingala flow.
//   • Both halves are capped at 2 syllables up front, so the name lands at ~3–4
//     syllables naturally; a trailing syllable is only dropped past 12 letters.
//     (The spec's 8-letter trim butchered the intended names — Mayisengo,
//     Motonkembo — so the cap moved to a safety net, not a routine cut.)
//   • Capitalise the first letter only.
// Each word input is reduced to its first whitespace token, so "Kobina (dance)"
// fuses on "kobina". Returns { name, phonetic } or null if either word is empty.
const sylsOf = (w) =>
  w.toLowerCase().match(/[^aeiou]*[aeiou]+(?:[^aeiou](?![aeiou]))?/g) || [w.toLowerCase()];

export function fuseWords(wordA, wordB) {
  const clean = (w) => String(w || '').trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z]/g, '');
  const a = clean(wordA), b = clean(wordB);
  if (!a || !b) return null;

  // Rule 1 — base: the first two syllables of Word A.
  const base = sylsOf(a).slice(0, 2).join('');

  // Rule 2 — modifier: drop a leading vowel from Word B, then keep only its
  // first two syllables so long words contribute a fragment, not a whole word.
  const bCore = (VOWELS.includes(b[0]) && b.length > 1) ? b.slice(1) : b;
  let mod = sylsOf(bCore).slice(0, 2).join('');

  // Rule 3 — seam: a nasal glue for melodic flow when the base ends in a vowel
  // and the modifier opens hard ('m' before b/p, 'n' before k/t/d); otherwise
  // collapse a doubled consonant where the two fragments meet.
  let glue = '';
  const last = base[base.length - 1], first = mod[0];
  if (VOWELS.includes(last)) {
    if (first === 'b' || first === 'p') glue = 'm';
    else if (first === 'k' || first === 't' || first === 'd') glue = 'n';
  } else if (last === first && mod.length > 1) {
    mod = mod.slice(1); // e.g. Koyem + moli → Koyemoli, not Koyemmoli
  }

  // Rule 4 — assemble. Both halves are already ≤2 syllables, so the name is at
  // most ~4 syllables; only an unusually long pair needs a trailing-syllable cut.
  const syl = sylsOf(base + glue + mod);
  if (syl.join('').length > 12 && syl.length > 1) syl.pop();
  const out = syl.join('');

  return { name: out.charAt(0).toUpperCase() + out.slice(1), phonetic: syllabify(out) };
}
