// Lingala verb conjugation engine.
//
// Lingala is a Bantu language with agglutinative verb morphology. A finite
// verb is built by stacking morphemes onto a stem:
//
//   [subject prefix] - [tense marker] - STEM [- aspect suffix] [- te (negation)]
//
// SUBJECT PREFIXES (kept simple — these are the diaspora-common forms)
//   1sg  na-   I
//   2sg  o-    you (singular)
//   3sg  a-    he / she
//   1pl  to-   we
//   2pl  bo-   you (plural)
//   3pl  ba-   they
//
// TENSE MARKERS
//   present       (zero)        → na-stem-a            "I X"
//   present-cont. zo-           → na-zo-stem-a         "I am X-ing"
//   past         (-ki suffix)   → na-stem-ki           "I X-ed"
//   future        ko-           → na-ko-stem-a         "I will X"
//   habitual     (-aka suffix)  → na-stem-aka          "I usually X"
//
// NEGATION
//   negative present:    na-stem-a te
//   negative imperative: ko-stem-a te   (the infinitive form + te)
//
// IMPERATIVE
//   singular: STEM (drop the ko- from the infinitive, keep the final -a)
//   plural:   bo-STEM-a (informal: just bo- + stem)
//
// CAVEATS
//   This is a regular-pattern engine. Real Lingala has irregular verbs and
//   regional variation. The output is "diaspora-correct" — what most
//   second-generation speakers would recognize. Each per-verb page makes that
//   disclaimer explicit.

(function () {
  const SUBJECTS = [
    { code: '1sg', pronoun: 'ngai',  glossEn: 'I',           glossFr: 'je',         prefix: 'na' },
    { code: '2sg', pronoun: 'yo',    glossEn: 'you',         glossFr: 'tu',         prefix: 'o'  },
    { code: '3sg', pronoun: 'ye',    glossEn: 'he / she',    glossFr: 'il / elle',  prefix: 'a'  },
    { code: '1pl', pronoun: 'biso',  glossEn: 'we',          glossFr: 'nous',       prefix: 'to' },
    { code: '2pl', pronoun: 'bino',  glossEn: 'you (pl.)',   glossFr: 'vous',       prefix: 'bo' },
    { code: '3pl', pronoun: 'bango', glossEn: 'they',        glossFr: 'ils / elles', prefix: 'ba' },
  ];

  // Drop the ko- prefix and isolate the bare stem.
  function stem(infinitive) {
    const inf = (infinitive || '').trim().toLowerCase();
    return inf.startsWith('ko') ? inf.slice(2) : inf;
  }

  // Build a conjugated form: <subject-prefix>-[tense-prefix-]<stem>[-suffix][ te]
  function build(stemWord, subjPrefix, opts) {
    opts = opts || {};
    const parts = [];
    parts.push(subjPrefix);
    if (opts.tensePrefix) parts.push(opts.tensePrefix);
    let body = stemWord;
    if (opts.suffix) {
      // Past tense -ki: replace terminal -a with -aki (more natural) OR add -ki
      // Most verbs: stem ending in -a → -aki. Stem ending in consonant → -i.
      if (opts.suffix === 'ki') {
        body = stemWord.endsWith('a') ? (stemWord + 'ki') : (stemWord + 'i');
      } else if (opts.suffix === 'aka') {
        // Habitual: append -aka. If stem already ends in -a, just -ka.
        body = stemWord.endsWith('a') ? (stemWord + 'ka') : (stemWord + 'aka');
      }
    }
    parts.push(body);
    let out = parts.join('-');
    if (opts.negate) out += ' te';
    return out;
  }

  // Produce a full conjugation table for one infinitive.
  function conjugate(infinitive) {
    const s = stem(infinitive);
    const out = {
      infinitive: infinitive,
      stem: s,
      imperative: { sg: s, pl: 'bo-' + s },
      negativeImperative: infinitive + ' te',
      tenses: {
        present: {},
        presentContinuous: {},
        past: {},
        future: {},
        habitual: {},
        negativePresent: {},
      },
    };
    SUBJECTS.forEach((subj) => {
      out.tenses.present[subj.code]            = build(s, subj.prefix);
      out.tenses.presentContinuous[subj.code]  = build(s, subj.prefix, { tensePrefix: 'zo' });
      out.tenses.past[subj.code]               = build(s, subj.prefix, { suffix: 'ki' });
      out.tenses.future[subj.code]             = build(s, subj.prefix, { tensePrefix: 'ko' });
      out.tenses.habitual[subj.code]           = build(s, subj.prefix, { suffix: 'aka' });
      out.tenses.negativePresent[subj.code]    = build(s, subj.prefix, { negate: true });
    });
    return out;
  }

  // Tense labels for the UI — English / French / Lingala.
  const TENSE_LABELS = {
    present:           { en: 'Present',            fr: 'Présent',             ln: 'Ya sika' },
    presentContinuous: { en: 'Present continuous', fr: 'Présent continu',     ln: 'Ya kosala' },
    past:              { en: 'Past',               fr: 'Passé',               ln: 'Ya kala' },
    future:            { en: 'Future',             fr: 'Futur',               ln: 'Ya sima' },
    habitual:          { en: 'Habitual',           fr: 'Habituel',            ln: 'Ya momesano' },
    negativePresent:   { en: 'Negative (present)', fr: 'Négatif (présent)',   ln: 'Ya te' },
  };

  window.LingalaConjugate = {
    SUBJECTS, TENSE_LABELS,
    stem, conjugate,
  };
})();
