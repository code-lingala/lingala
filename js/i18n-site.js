// Lingala — static-site i18n (marketing homepage + about + privacy).
//
// Detects French browsers on first visit, otherwise English; a nav toggle
// overrides and the choice is remembered in localStorage. Elements opt in with
// data-i18n="key" (innerHTML is swapped, so values may contain markup). The
// page <body> may carry data-title-i18n="key" to translate the document title.
//
// NOTE: the in-APP strings live in the `T` object in js/app.js and phrase copy
// in js/data/phrases.js — this file is ONLY the static marketing/legal pages.
// Every key below must have both an `en` and an `fr` value. See CLAUDE.md.

(function () {
  const STRINGS = {
    en: {
      'title.home': 'Lingala — Keep the language alive for Congolese everywhere',
      'title.about': 'About — Lingala',
      'title.privacy': 'Privacy — Lingala',

      // nav
      'nav.about': 'About',
      'nav.how': 'How it works',
      'nav.community': 'Community',
      'nav.cta': "Open today's card",
      'nav.name': 'Find your name',
      'nav.dictionary': 'Dictionary',
      'nav.count': 'Count',
      'nav.verbs': 'Verbs',
      'nav.memory': 'Memory',
      'nav.map': 'Map',

      // 404 page
      'title.notFound': 'Page not found — Lingala',
      'title.map': 'Map of the Congo — Lingala',
      'nf.eyebrow':     'Page not found',
      'nf.title':       "This path doesn't exist.",
      'nf.sub':         'The page you are looking for may have moved, been renamed, or never existed. The good news is the rest of Lingala is still right here.',
      'nf.quote':       '« Nzela ya solo ezali penepene — the real path is close by. »',
      'nf.cta':         '← Back home',
      'nf.cta2':        "Today's card",
      'hero.scroll': 'Scroll to explore',
      'aria.theme': 'Colour theme',
      'aria.lang': 'Language',
      'aria.green': 'Green',
      'aria.blue': 'Blue',
      'aria.yellow': 'Yellow',
      'aria.red': 'Red',

      // hero
      'hero.eyebrow': 'Lingala · DRC · Everywhere',
      'hero.headline': 'Your language.<br><em>Your identity.</em><br>One phrase a day.',
      'hero.sub': 'Free. Beautiful. Yours to share.',
      'hero.body': 'Lingala gives Congolese everywhere a daily phrase from home, wrapped in a beautifully designed culture card — ready to download and post on Instagram, TikTok, or WhatsApp in under thirty seconds.',
      'hero.btnPrimary': "See today's card →",
      'hero.btnGhost': 'Learn more',

      // hero card
      'card.dateTag': 'Today',
      'card.category': 'Greetings',
      'card.translation': 'A respectful greeting',
      'card.note': 'Losako is the warm, respectful way to announce yourself and greet — the gesture of someone genuinely glad to be in front of you.',

      // statement strip
      'strip.nologin': 'No login',
      'strip.noads': 'No ads',
      'strip.nodata': 'No data collected',
      'strip.free': 'Free forever',
      'strip.offline': 'Works offline',
      'strip.made': 'Congolese-made',

      // about
      'about.eyebrow': 'What Lingala is',
      'about.title': 'Not a language app.<br><em>A cultural object.</em>',
      'about.body1': 'The person who uses Lingala is not trying to learn the language. They are trying to express <strong>something about who they are.</strong>',
      'about.body2': "A second-generation Congolese person in Brussels, London, Montreal, or Atlanta doesn't open an app to study vocabulary. They open it because they are proud of where their family is from — and they have never had a beautiful, ready-made object to express that pride with.",
      'about.body3': '<strong>Lingala gives them that object.</strong> The language is the packaging. The identity is the gift.',
      'stat.phrases': 'Lingala phrases so far · growing to 365',
      'stat.categories': 'Cultural categories',
      'stat.cost': 'Cost to use, forever',
      'stat.speed': 'From open to shared',
      'about.quote': '“When someone in my family says this word, it carries thirty years of history. Now I can share that.”',

      // story (Where Lingala comes from)
      'story.eyebrow': 'Where Lingala comes from',
      'story.title': 'A language born on the river.<br><em>Carried by the people.</em>',
      'story.body1': 'The <strong>Bangala</strong> — <em>“the river people”</em> — live along the great northern bends of the Congo River, the world\'s second-largest river by volume. The Bobangi, Boloki, Mabale and other riverine communities were the merchants of the upper Congo: traders of palm oil, fish, salt, and pottery, moving goods up and down a 4,700-kilometer water highway.',
      'story.body2': 'Out of that trade, a shared language emerged. Built on Bobangi roots and tuned for commerce between many tongues, it became the speech of the riverbanks. The prefix <em>Li-</em> marks a language; <em>ngala</em> names the people. So: <strong>Lingala — the language of the river people.</strong>',
      'story.body3': 'When Kinshasa grew into one of the world\'s great megacities — straddling the river, facing the Bakongo lands to the south — it was Congolese rumba, sung in Lingala by river musicians, that carried the language into the heart of the capital and onto the radios of Africa. Today Lingala is the sound of Kinshasa, of the music, and of every Congolese household in the diaspora that still hums <em>esengo nayoki na ngai.</em>',
      'story.stat1': 'Lingala speakers across DRC, Republic of Congo, Angola &amp; CAR',
      'story.stat2': 'Congolese babies born today · live count, in DRC',
      'story.stat3': 'Kinshasa metro — the largest Francophone city in the world',
      'story.stat4': 'The Congo River — the language\'s first highway',
      'story.caption': 'Four river provinces — Équateur, Mongala, Nord-Ubangi, Sud-Ubangi — are the Bangala heartland. From there, Lingala flowed downstream into Kinshasa, into the music, and into the diaspora.',

      // how it works
      'how.eyebrow': 'How it works',
      'how.title': 'Open. Download. <em>Share your roots.</em>',
      'how.s1title': "Today's card appears",
      'how.s1body': 'No loading. No login. No onboarding. The card is there the moment you open the app — a new Lingala phrase every day, the same one for every Congolese person worldwide.',
      'how.s2title': 'Read the culture',
      'how.s2body': 'Every phrase comes with a cultural note written with warmth and depth — not a dictionary definition. Where it comes from, when elders use it, what it carries emotionally.',
      'how.s3title': 'Download &amp; post',
      'how.s3body': 'One tap renders a professional 1080×1080 image to your camera roll. Post it on Instagram, TikTok, or send it in your family WhatsApp group. No watermark that embarrasses. No screenshot required.',

      // culture
      'demo.label': 'Cultural context',
      'demo.translation': 'Hello',
      'demo.noteTitle': 'Cultural note',
      'demo.noteText': 'Mbote is the first word most people learn in Lingala, and the one you will use most. It works morning, noon and night, to one person or a crowd. Say “Mbote” with a small nod and you are already speaking the language of home.',
      'demo.readMore': 'Read more about this phrase →',
      'culture.eyebrow': 'The cultural notes',
      'culture.title': 'The soul of <em>the product.</em>',
      'culture.body1': 'Every other language tool tells you what a word means. Lingala tells you <strong>what a word carries.</strong>',
      'culture.body2': 'The cultural notes are written not as textbook definitions but as a Congolese elder talking to you about their language — with pride, warmth, and humor. They connect phrases to history, to music, to the specific social contexts that give language its meaning.',
      'culture.quote': "This is what separates a phrase from a piece of culture — and a piece of culture is what's worth sharing.",
      'culture.body3': 'Each card has a short note for the card itself, and a deeper expanded note for anyone who wants to go further. One is for Instagram. The other is for the person who remembers their grandmother saying it.',

      // community
      'comm.eyebrow': 'Community',
      'comm.title': 'Built by Congolese.<br><em>For Congolese.</em>',
      'comm.body': 'The phrase database grows with contributions from Congolese communities worldwide. Know a proverb your grandmother uses? A phrase from your neighborhood in Kinshasa that no textbook has ever captured? Submit it. Every addition that makes it into the rotation is credited to the person who shared it.',
      'comm.btn': 'Suggest a phrase',
      'comm.from1': 'Submitted from Brussels',
      'comm.from2': 'Submitted from Montreal',
      'comm.from3': 'Submitted from Atlanta',
      'comm.t1': 'Nalingi yo <span>· I love you</span>',
      'comm.t2': "Tokomonana <span>· We'll meet again</span>",
      'comm.t3': 'Bolingo <span>· Love</span>',

      // promise / CTA
      'promise.eyebrow': 'No catch. No paywall. No account.',
      'promise.title': 'Keep Lingala alive<br><em>for Congolese everywhere.</em>',
      'promise.body': "Open it now. See today's phrase. Download the card. Share it with someone who knows where that language comes from.",
      'pill1': '🌍 Works in any browser',
      'pill2': '📱 Installs as an app',
      'pill3': '✈️ Works offline',
      'pill4': '🔒 Zero data collected',
      'pill5': '🆓 Free forever',
      'promise.cta': 'Open Lingala →',

      // footer (homepage)
      'footer.tagline': 'Keep Lingala alive — for Congolese everywhere · 🇨🇩',
      'footer.about': 'About',
      'footer.privacy': 'Privacy',
      'footer.install': 'Install app',
      'footer.contact': 'Contact',
      'footer.made': 'Made by a Congolese, for Congolese everywhere',

      // about page
      'ab.h1': 'About Lingala',
      'ab.p1': 'Lingala surfaces one phrase every day, wraps it in a culture card made to be beautiful, and lets you download it to share on Instagram, TikTok, WhatsApp or wherever your people are.',
      'ab.p2': "It's for the second-generation Congolese person in Brussels, London, Montreal or Atlanta who is proud of where their family is from and wants a way to say so. The language is the packaging. The identity is the gift.",
      'ab.p3': 'Everyone, everywhere, sees the same phrase on the same day — so when you post today’s card, others recognise it, and a small community moment happens. The cultural notes are written to sound less like a textbook and more like an elder telling you about their language, with warmth and pride.',
      'ab.p4': "It's free, it works offline after the first visit, and it asks for no login. If you know a phrase, proverb or expression your family uses that we're missing, there's a form on the home screen — every suggestion is read by hand.",
      'ab.made': 'Made by <a href="https://artivicolab.com" target="_blank" rel="noopener" style="color:var(--accent)">Artivicolab</a> · <a href="mailto:artivicolab@gmail.com" style="color:var(--accent)">Contact us</a>',

      // privacy page
      'pr.h1': 'Privacy',
      'pr.intro': 'Lingala is built to stay out of your business. Here is exactly what that means.',
      'pr.h2a': 'What stays on your device',
      'pr.pa': 'Your streak, your settings (language, card colour, download format), and the record of which cards you have viewed live in your browser’s storage (IndexedDB) on this device only. They are never uploaded, never synced to a server, and never tied to an account — there is no account. Clearing your browser data, or using <em>“Clear all data”</em> in Settings, removes them completely.',
      'pr.h2b': 'The one thing you can choose to send',
      'pr.pb': 'If you use the <em>“Suggest a phrase”</em> form, it simply opens your own email app with the phrase pre-filled and addressed to us — nothing is sent until you send that email yourself, and it passes through no third party. Don’t put anything in there you wouldn’t want us to read.',
      'pr.h2c': 'The cards and images',
      'pr.pc': 'Daily cards and the images you download are generated entirely in your browser. Downloading or sharing a card does not tell us anything.',
      'pr.h2d': 'Analytics',
      'pr.pd': 'We may use standard, privacy-respecting web analytics to understand how many people use Lingala and which features matter, so we can make it better. This is about aggregate usage of the site, never the contents of your personal data above. We do not sell your data to anyone.',
      'pr.questions': 'Questions? <a href="mailto:artivicolab@gmail.com" style="color:var(--accent)">Contact us</a>.',

      // shared static-page footer links
      'foot.home': 'Home',
      'foot.about': 'About',
      'foot.privacy': 'Privacy',
      'foot.contact': 'Contact us',

      // count page
      'count.eyebrow': 'Numbers · Motango',
      'count.title': 'Count in Lingala. <em>From moko to nkoto.</em>',
      'count.sub': 'Four ways to learn: walk through the numbers, quiz yourself in either direction, or let the app count out loud to you.',
      'count.mode.count': 'Count up',
      'count.mode.type': 'Type a number',
      'count.mode.quizLn': 'LN → digit',
      'count.mode.quizDigit': 'Digit → LN',
      'count.mode.quizListen': 'Listen → type',
      'count.mode.auto': 'Auto count',
      'count.replay': 'Play again',
      'count.mastery': 'Mastery',
      'count.group.learn': 'Learn',
      'count.group.practice': 'Practice',
      'count.more': 'More options',
      'count.firstHint': 'Five ways to learn — try <strong>Auto count</strong> to hear them all aloud, or <strong>Listen → type</strong> to test yourself.',
      'count.kbdTitle': 'Keyboard shortcuts',
      'count.kbdNav': 'Previous / Next number',
      'count.kbdPlay': 'Start / Pause auto count',
      'count.kbdEnter': 'Submit quiz answer',
      'count.kbdHelp': 'Toggle this overlay',
      'count.kbdEsc': 'Close overlays',
      'count.howFormed': 'How is this formed?',
      'count.save': 'Save',
      'count.saved': 'Saved',
      'count.printRules': 'Print rules',
      'count.challengeGo': 'Start',
      'count.challenge.0': "Today's challenge — count from 0 to <strong>10</strong> in count-up.",
      'count.challenge.1': "Today's challenge — walk from <strong>50</strong> to <strong>100</strong>.",
      'count.challenge.2': "Today's challenge — auto-count by tens to <strong>100</strong>.",
      'count.challenge.3': "Today's challenge — a <strong>listening</strong> round, 0–100.",
      'count.challenge.4': "Today's challenge — an <strong>LN → digit</strong> round, 0–100.",
      'count.challenge.5': "Today's challenge — try typing your <strong>birth year</strong> in Lingala.",
      'count.mode.compose': 'Build it',
      'count.mode.quizRule': 'Which rule?',
      'count.composeTarget': 'Build this:',
      'count.composeNew': 'New',
      'count.composeBack': '↶ Undo',
      'count.composeCheck': 'Check',
      'count.range': 'Range',
      'count.step': 'Step',
      'count.streak': 'Streak',
      'count.best': 'Best',
      'count.typePlaceholder': 'Type any number from 0 to 999,999,999…',
      'count.speed': 'Speed',
      'count.speedFast': 'Fast (0.7s)',
      'count.speedSteady': 'Steady (1.1s)',
      'count.speedSlow': 'Slow (1.7s)',
      'count.voiceOff': 'Voice off',
      'count.voiceOn': 'Voice on',
      'count.voiceNA': 'Voice not available',
      'count.voiceNote': "Approximation using your system's Italian or Spanish voice — closer to Lingala's vowel sounds than French. Not a native Lingala speaker.",
      'count.prev': '← Previous',
      'count.next': 'Next →',
      'count.start': 'Start',
      'count.pause': 'Pause',
      'count.reset': 'Reset',
      'count.skip': 'Skip',

      // verbs hub
      'title.verbs': 'Lingala verbs — conjugation reference',
      'meta.verbs.desc': 'Browse Lingala verbs with full conjugations — present, past, future, habitual, and negative forms. Free, offline, made for the Congolese diaspora.',
      'verbs.eyebrow': 'Verbs · Maverbe',
      'verbs.title': 'Lingala verbs, <em>fully conjugated.</em>',
      'verbs.sub': 'Every verb shown with its imperative, all six subject prefixes (ngai, yo, ye, biso, bino, bango), and the present, past, future, habitual, and negative forms. Tap any verb for the full table.',
      'verbs.count': '{n} verbs · all conjugations included',
      'verbs.searchPh': 'Search a verb, an English meaning, or a stem…',
      'verbs.empty': 'No verbs match your search yet.',
      'verbs.viewMore': 'View {n} more',
      'verbs.viewAll': 'Showing all {n} verbs',
      'verbs.loadErr': 'Could not load verbs.',
      'verbs.imperative': '(imperative)',
      'verbs.showForms': 'Show forms',
      'verbs.hideForms': 'Hide forms',
      'verbs.fullTable': 'Full table · all 6 subjects →',
      'verbs.ariaSpeak': 'Hear {w}',
      // hero
      'verbs.hero.eyebrow': 'Verb of the day',
      'verbs.hero.cta': 'See full table →',
      'verbs.hero.hear': '🔊 Hear it',
      'verbs.hero.shuffle': '🎲 Random verb',
      // tense labels (used on cards + hero)
      'verbs.t.present':  'Present',
      'verbs.t.past':     'Past',
      'verbs.t.future':   'Future',
      'verbs.t.habitual': 'Habitual',
      'verbs.t.negative': 'Negative',
      'verbs.t.presentN':  'Present (ngai)',
      'verbs.t.pastN':     'Past (ngai)',
      'verbs.t.futureN':   'Future (ngai)',
      'verbs.t.habitualN': 'Habitual (ngai)',

      // per-verb page chrome
      'vp.imp.sg':  'Imperative (singular):',
      'vp.imp.pl':  'plural:',
      'vp.t.present':           'Present',
      'vp.t.presentContinuous': 'Present continuous',
      'vp.t.past':              'Past',
      'vp.t.future':            'Future',
      'vp.t.habitual':          'Habitual',
      'vp.t.negativePresent':   'Negative (present)',
      'vp.t.negative':          'Negative',
      'vp.subj.1sg': 'I',
      'vp.subj.2sg': 'you',
      'vp.subj.3sg': 'he / she',
      'vp.subj.1pl': 'we',
      'vp.subj.2pl': 'you (pl.)',
      'vp.subj.3pl': 'they',
      'vp.disclaimer': 'Conjugation generated from regular Bantu morphology rules — accurate for most verbs in diaspora Lingala. Irregular verbs and regional variants may differ. Verified entries from our dictionary.',
      'vp.eyebrow.verbs': 'Verbs',
    },

    fr: {
      'title.home': 'Lingala — Gardez la langue vivante pour les Congolais partout',
      'title.about': 'À propos — Lingala',
      'title.privacy': 'Confidentialité — Lingala',

      'nav.about': 'À propos',
      'nav.how': 'Comment ça marche',
      'nav.community': 'Communauté',
      'nav.cta': 'Voir la carte du jour',
      'nav.name': 'Trouvez votre nom',
      'nav.dictionary': 'Dictionnaire',
      'nav.count': 'Compter',
      'nav.verbs': 'Verbes',
      'nav.memory': 'Mémoire',
      'nav.map': 'Carte',

      'title.notFound': 'Page introuvable — Lingala',
      'title.map': 'Carte du Congo — Lingala',
      'nf.eyebrow':     'Page introuvable',
      'nf.title':       "Ce chemin n'existe pas.",
      'nf.sub':         'La page que vous cherchez a peut-être été déplacée, renommée, ou n\'a jamais existé. La bonne nouvelle : le reste de Lingala est toujours ici.',
      'nf.quote':       '« Nzela ya solo ezali penepene — le vrai chemin est tout près. »',
      'nf.cta':         "← Retour à l'accueil",
      'nf.cta2':        "Carte du jour",
      'hero.scroll': 'Faites défiler pour explorer',
      'aria.theme': 'Thème de couleur',
      'aria.lang': 'Langue',
      'aria.green': 'Vert',
      'aria.blue': 'Bleu',
      'aria.yellow': 'Jaune',
      'aria.red': 'Rouge',

      'hero.eyebrow': 'Lingala · RDC · Partout',
      'hero.headline': 'Votre langue.<br><em>Votre identité.</em><br>Une phrase par jour.',
      'hero.sub': 'Gratuit. Beau. À partager.',
      'hero.body': 'Lingala offre chaque jour aux Congolais du monde entier une phrase, présentée dans une carte culturelle au design soigné — prête à télécharger et à publier sur Instagram, TikTok ou WhatsApp en moins de trente secondes.',
      'hero.btnPrimary': 'Voir la carte du jour →',
      'hero.btnGhost': 'En savoir plus',

      'card.dateTag': 'Aujourd’hui',
      'card.category': 'Salutations',
      'card.translation': 'Une salutation respectueuse',
      'card.note': 'Losako est la manière chaleureuse et respectueuse de se présenter et de saluer — le geste de quelqu’un sincèrement heureux d’être devant vous.',

      'strip.nologin': 'Sans compte',
      'strip.noads': 'Sans publicité',
      'strip.nodata': 'Aucune donnée collectée',
      'strip.free': 'Gratuit pour toujours',
      'strip.offline': 'Fonctionne hors ligne',
      'strip.made': 'Fait par des Congolais',

      'about.eyebrow': 'Ce qu’est Lingala',
      'about.title': 'Pas une appli de langue.<br><em>Un objet culturel.</em>',
      'about.body1': 'Celui qui utilise Lingala ne cherche pas à apprendre la langue. Il cherche à exprimer <strong>quelque chose sur qui il est.</strong>',
      'about.body2': 'Un Congolais de deuxième génération à Bruxelles, Londres, Montréal ou Atlanta n’ouvre pas une appli pour étudier du vocabulaire. Il l’ouvre parce qu’il est fier des origines de sa famille — et il n’a jamais eu d’objet beau et prêt à l’emploi pour exprimer cette fierté.',
      'about.body3': '<strong>Lingala lui offre cet objet.</strong> La langue est l’emballage. L’identité est le cadeau.',
      'stat.phrases': 'phrases lingala à ce jour · objectif 365',
      'stat.categories': 'Catégories culturelles',
      'stat.cost': 'Coût d’utilisation, à jamais',
      'stat.speed': 'De l’ouverture au partage',
      'about.quote': '« Quand quelqu’un de ma famille dit ce mot, il porte trente ans d’histoire. Maintenant, je peux partager ça. »',

      // story
      'story.eyebrow': 'D’où vient le Lingala',
      'story.title': 'Une langue née sur le fleuve.<br><em>Portée par le peuple.</em>',
      'story.body1': 'Les <strong>Bangala</strong> — <em>« le peuple du fleuve »</em> — vivent le long des grands méandres septentrionaux du fleuve Congo, le deuxième fleuve du monde par son débit. Les Bobangi, Boloki, Mabale et d’autres communautés riveraines étaient les marchands du Haut-Congo : commerçants d’huile de palme, de poisson, de sel et de poterie, déplaçant les marchandises sur une voie d’eau de 4 700 kilomètres.',
      'story.body2': 'De ce commerce est née une langue commune. Construite sur des racines bobangi et façonnée pour le commerce entre de nombreuses langues, elle est devenue la parole des berges. Le préfixe <em>Li-</em> désigne une langue ; <em>ngala</em> nomme le peuple. Donc : <strong>Lingala — la langue du peuple du fleuve.</strong>',
      'story.body3': 'Quand Kinshasa est devenue l’une des grandes mégapoles du monde — à cheval sur le fleuve, face aux terres bakongo au sud — c’est la rumba congolaise, chantée en lingala par les musiciens du fleuve, qui a porté la langue au cœur de la capitale et sur les ondes d’Afrique. Aujourd’hui le lingala est le son de Kinshasa, de la musique, et de chaque foyer congolais de la diaspora qui fredonne encore <em>esengo nayoki na ngai.</em>',
      'story.stat1': 'Locuteurs du lingala — RDC, Congo-Brazzaville, Angola, RCA',
      'story.stat2': 'Bébés congolais nés aujourd’hui · compteur en direct, RDC',
      'story.stat3': 'Kinshasa métropole — la plus grande ville francophone du monde',
      'story.stat4': 'Le fleuve Congo — la première autoroute de la langue',
      'story.caption': 'Quatre provinces fluviales — Équateur, Mongala, Nord-Ubangi, Sud-Ubangi — forment le cœur du pays bangala. De là, le lingala a coulé vers Kinshasa, vers la musique, et vers la diaspora.',

      'how.eyebrow': 'Comment ça marche',
      'how.title': 'Ouvrez. Téléchargez. <em>Partagez vos racines.</em>',
      'how.s1title': 'La carte du jour apparaît',
      'how.s1body': 'Aucun chargement. Aucun compte. Aucune inscription. La carte est là dès que vous ouvrez l’appli — une nouvelle phrase lingala chaque jour, la même pour chaque Congolais du monde entier.',
      'how.s2title': 'Découvrez la culture',
      'how.s2body': 'Chaque phrase s’accompagne d’une note culturelle écrite avec chaleur et profondeur — pas une définition de dictionnaire. D’où elle vient, quand les anciens l’emploient, ce qu’elle porte émotionnellement.',
      'how.s3title': 'Téléchargez &amp; partagez',
      'how.s3body': 'Un seul geste génère une image professionnelle 1080×1080 dans votre pellicule. Publiez-la sur Instagram, TikTok, ou envoyez-la dans le groupe WhatsApp familial. Aucun filigrane gênant. Aucune capture d’écran nécessaire.',

      'demo.label': 'Contexte culturel',
      'demo.translation': 'Bonjour',
      'demo.noteTitle': 'Note culturelle',
      'demo.noteText': 'Mbote est le premier mot que la plupart des gens apprennent en lingala, et celui que vous utiliserez le plus. Il marche matin, midi et soir, à une personne comme à une foule. Dites « Mbote » avec un léger signe de tête et vous parlez déjà la langue de la maison.',
      'demo.readMore': 'En savoir plus sur cette phrase →',
      'culture.eyebrow': 'Les notes culturelles',
      'culture.title': 'L’âme <em>du produit.</em>',
      'culture.body1': 'Tous les autres outils de langue vous disent ce qu’un mot signifie. Lingala vous dit <strong>ce qu’un mot porte.</strong>',
      'culture.body2': 'Les notes culturelles ne sont pas écrites comme des définitions de manuel, mais comme un aîné congolais qui vous parle de sa langue — avec fierté, chaleur et humour. Elles relient les phrases à l’histoire, à la musique, aux contextes sociaux précis qui donnent son sens à la langue.',
      'culture.quote': 'C’est ce qui distingue une phrase d’un morceau de culture — et c’est un morceau de culture qui mérite d’être partagé.',
      'culture.body3': 'Chaque carte a une note courte pour la carte elle-même, et une note approfondie pour qui veut aller plus loin. L’une est pour Instagram. L’autre est pour celui qui se souvient de sa grand-mère le disant.',

      'comm.eyebrow': 'Communauté',
      'comm.title': 'Construit par des Congolais.<br><em>Pour les Congolais.</em>',
      'comm.body': 'La base de phrases grandit grâce aux contributions des communautés congolaises du monde entier. Vous connaissez un proverbe de votre grand-mère ? Une phrase de votre quartier de Kinshasa qu’aucun manuel n’a jamais captée ? Proposez-la. Chaque ajout retenu dans la rotation est crédité à la personne qui l’a partagée.',
      'comm.btn': 'Proposer une phrase',
      'comm.from1': 'Proposé depuis Bruxelles',
      'comm.from2': 'Proposé depuis Montréal',
      'comm.from3': 'Proposé depuis Atlanta',
      'comm.t1': 'Nalingi yo <span>· Je t’aime</span>',
      'comm.t2': 'Tokomonana <span>· On se reverra</span>',
      'comm.t3': 'Bolingo <span>· L’amour</span>',

      'promise.eyebrow': 'Sans piège. Sans abonnement. Sans compte.',
      'promise.title': 'Gardez le lingala vivant<br><em>pour les Congolais partout.</em>',
      'promise.body': 'Ouvrez-le maintenant. Voyez la phrase du jour. Téléchargez la carte. Partagez-la avec quelqu’un qui sait d’où vient cette langue.',
      'pill1': '🌍 Marche dans tout navigateur',
      'pill2': '📱 S’installe comme une appli',
      'pill3': '✈️ Fonctionne hors ligne',
      'pill4': '🔒 Aucune donnée collectée',
      'pill5': '🆓 Gratuit pour toujours',
      'promise.cta': 'Ouvrir Lingala →',

      'footer.tagline': 'Gardez le lingala vivant — pour les Congolais partout · 🇨🇩',
      'footer.about': 'À propos',
      'footer.privacy': 'Confidentialité',
      'footer.install': 'Installer l’app',
      'footer.contact': 'Contact',
      'footer.made': 'Fait par un Congolais, pour les Congolais partout',

      'ab.h1': 'À propos de Lingala',
      'ab.p1': 'Lingala met en avant une phrase chaque jour, l’habille d’une carte culturelle pensée pour être belle, et vous permet de la télécharger pour la partager sur Instagram, TikTok, WhatsApp ou partout où sont les vôtres.',
      'ab.p2': 'Elle est faite pour le Congolais de deuxième génération à Bruxelles, Londres, Montréal ou Atlanta, fier des origines de sa famille et qui cherche une façon de le dire. La langue est l’emballage. L’identité est le cadeau.',
      'ab.p3': 'Tout le monde, partout, voit la même phrase le même jour — alors quand vous publiez la carte du jour, d’autres la reconnaissent, et un petit moment de communauté se crée. Les notes culturelles sont écrites pour sonner moins comme un manuel et plus comme un aîné qui vous parle de sa langue, avec chaleur et fierté.',
      'ab.p4': 'C’est gratuit, ça fonctionne hors ligne après la première visite, et ça ne demande aucun compte. Si vous connaissez une phrase, un proverbe ou une expression de votre famille qui nous manque, un formulaire se trouve sur l’écran d’accueil — chaque suggestion est lue à la main.',
      'ab.made': 'Réalisé par <a href="https://artivicolab.com" target="_blank" rel="noopener" style="color:var(--accent)">Artivicolab</a> · <a href="mailto:artivicolab@gmail.com" style="color:var(--accent)">Nous contacter</a>',

      'pr.h1': 'Confidentialité',
      'pr.intro': 'Lingala est conçu pour ne pas se mêler de vos affaires. Voici précisément ce que cela signifie.',
      'pr.h2a': 'Ce qui reste sur votre appareil',
      'pr.pa': 'Votre série, vos réglages (langue, couleur de la carte, format de téléchargement) et l’historique des cartes que vous avez vues vivent dans le stockage de votre navigateur (IndexedDB), sur cet appareil uniquement. Ils ne sont jamais téléversés, jamais synchronisés sur un serveur, et jamais liés à un compte — il n’y a pas de compte. Effacer les données de votre navigateur, ou utiliser <em>« Effacer toutes les données »</em> dans les Réglages, les supprime complètement.',
      'pr.h2b': 'La seule chose que vous pouvez choisir d’envoyer',
      'pr.pb': 'Si vous utilisez le formulaire <em>« Proposer une phrase »</em>, il ouvre simplement votre propre application e-mail avec la phrase pré-remplie et adressée à nous — rien n’est envoyé tant que vous n’envoyez pas vous-même cet e-mail, et cela ne passe par aucun tiers. N’y mettez rien que vous ne voudriez pas nous voir lire.',
      'pr.h2c': 'Les cartes et les images',
      'pr.pc': 'Les cartes quotidiennes et les images que vous téléchargez sont générées entièrement dans votre navigateur. Télécharger ou partager une carte ne nous apprend rien.',
      'pr.h2d': 'Statistiques',
      'pr.pd': 'Nous pouvons utiliser des statistiques web standard et respectueuses de la vie privée pour comprendre combien de personnes utilisent Lingala et quelles fonctions comptent, afin de l’améliorer. Il s’agit de l’usage global du site, jamais du contenu de vos données personnelles ci-dessus. Nous ne vendons vos données à personne.',
      'pr.questions': 'Des questions ? <a href="mailto:artivicolab@gmail.com" style="color:var(--accent)">Nous contacter</a>.',

      'foot.home': 'Accueil',
      'foot.about': 'À propos',
      'foot.privacy': 'Confidentialité',
      'foot.contact': 'Nous contacter',

      // count page
      'count.eyebrow': 'Nombres · Motango',
      'count.title': 'Compter en lingala. <em>De moko à nkoto.</em>',
      'count.sub': "Quatre façons d'apprendre : parcourir les nombres, vous tester dans les deux sens, ou laisser l'application compter à voix haute.",
      'count.mode.count': 'Compter',
      'count.mode.type': 'Tape un nombre',
      'count.mode.quizLn': 'LN → chiffre',
      'count.mode.quizDigit': 'Chiffre → LN',
      'count.mode.quizListen': 'Écouter → taper',
      'count.mode.auto': 'Auto',
      'count.replay': 'Rejouer',
      'count.mastery': 'Maîtrise',
      'count.group.learn': 'Apprendre',
      'count.group.practice': 'S\'exercer',
      'count.more': 'Plus d\'options',
      'count.firstHint': 'Cinq façons d\'apprendre — essayez <strong>Auto</strong> pour tout entendre, ou <strong>Écouter → taper</strong> pour vous tester.',
      'count.kbdTitle': 'Raccourcis clavier',
      'count.kbdNav': 'Précédent / Suivant',
      'count.kbdPlay': 'Démarrer / Pause (auto)',
      'count.kbdEnter': 'Valider la réponse',
      'count.kbdHelp': 'Afficher cette fenêtre',
      'count.kbdEsc': 'Fermer les fenêtres',
      'count.howFormed': 'Comment ce nombre se forme-t-il ?',
      'count.save': 'Garder',
      'count.saved': 'Gardés',
      'count.printRules': 'Imprimer les règles',
      'count.challengeGo': 'Commencer',
      'count.challenge.0': "Défi du jour — compte de 0 à <strong>10</strong>.",
      'count.challenge.1': "Défi du jour — passe de <strong>50</strong> à <strong>100</strong>.",
      'count.challenge.2': "Défi du jour — compte automatique par dizaines jusqu'à <strong>100</strong>.",
      'count.challenge.3': "Défi du jour — une session d'<strong>écoute</strong>, 0–100.",
      'count.challenge.4': "Défi du jour — une session <strong>LN → chiffre</strong>, 0–100.",
      'count.challenge.5': "Défi du jour — essaie de taper ton <strong>année de naissance</strong> en lingala.",
      'count.mode.compose': 'Construire',
      'count.mode.quizRule': 'Quelle règle ?',
      'count.composeTarget': 'Construis ce nombre :',
      'count.composeNew': 'Nouveau',
      'count.composeBack': '↶ Annuler',
      'count.composeCheck': 'Vérifier',
      'count.range': 'Plage',
      'count.step': 'Pas',
      'count.streak': 'Série',
      'count.best': 'Record',
      'count.typePlaceholder': 'Tape un nombre de 0 à 999 999 999…',
      'count.speed': 'Vitesse',
      'count.speedFast': 'Rapide (0,7 s)',
      'count.speedSteady': 'Normal (1,1 s)',
      'count.speedSlow': 'Lent (1,7 s)',
      'count.voiceOff': 'Voix désactivée',
      'count.voiceOn': 'Voix activée',
      'count.voiceNA': 'Voix indisponible',
      'count.voiceNote': "Approximation avec la voix italienne ou espagnole de votre système — plus proche des voyelles lingala que le français. Pas une voix native.",
      'count.prev': '← Précédent',
      'count.next': 'Suivant →',
      'count.start': 'Démarrer',
      'count.pause': 'Arrêter',
      'count.reset': 'Réinitialiser',
      'count.skip': 'Passer',

      // verbs hub
      'title.verbs': 'Verbes lingala — référence de conjugaison',
      'meta.verbs.desc': 'Parcourez les verbes lingala avec conjugaisons complètes — présent, passé, futur, habituel et formes négatives. Gratuit, hors ligne, fait pour la diaspora congolaise.',
      'verbs.eyebrow': 'Verbes · Maverbe',
      'verbs.title': 'Les verbes lingala, <em>entièrement conjugués.</em>',
      'verbs.sub': "Chaque verbe avec son impératif, les six préfixes sujets (ngai, yo, ye, biso, bino, bango), et le présent, passé, futur, habituel, et les formes négatives. Touchez un verbe pour voir le tableau complet.",
      'verbs.count': '{n} verbes · toutes conjugaisons incluses',
      'verbs.searchPh': 'Cherchez un verbe, un sens français, ou un radical…',
      'verbs.empty': 'Aucun verbe ne correspond à votre recherche.',
      'verbs.viewMore': 'Voir {n} de plus',
      'verbs.viewAll': '{n} verbes affichés',
      'verbs.loadErr': 'Impossible de charger les verbes.',
      'verbs.imperative': '(impératif)',
      'verbs.showForms': 'Voir les formes',
      'verbs.hideForms': 'Masquer les formes',
      'verbs.fullTable': 'Tableau complet · les 6 sujets →',
      'verbs.ariaSpeak': 'Écouter {w}',
      'verbs.hero.eyebrow': 'Verbe du jour',
      'verbs.hero.cta': 'Voir le tableau complet →',
      'verbs.hero.hear': '🔊 Écouter',
      'verbs.hero.shuffle': '🎲 Verbe au hasard',
      'verbs.t.present':  'Présent',
      'verbs.t.past':     'Passé',
      'verbs.t.future':   'Futur',
      'verbs.t.habitual': 'Habituel',
      'verbs.t.negative': 'Négatif',
      'verbs.t.presentN':  'Présent (ngai)',
      'verbs.t.pastN':     'Passé (ngai)',
      'verbs.t.futureN':   'Futur (ngai)',
      'verbs.t.habitualN': 'Habituel (ngai)',

      'vp.imp.sg':  'Impératif (singulier) :',
      'vp.imp.pl':  'pluriel :',
      'vp.t.present':           'Présent',
      'vp.t.presentContinuous': 'Présent continu',
      'vp.t.past':              'Passé',
      'vp.t.future':            'Futur',
      'vp.t.habitual':          'Habituel',
      'vp.t.negativePresent':   'Négatif (présent)',
      'vp.t.negative':          'Négatif',
      'vp.subj.1sg': 'je',
      'vp.subj.2sg': 'tu',
      'vp.subj.3sg': 'il / elle',
      'vp.subj.1pl': 'nous',
      'vp.subj.2pl': 'vous',
      'vp.subj.3pl': 'ils / elles',
      'vp.disclaimer': 'Conjugaison générée à partir des règles morphologiques bantoues régulières — exacte pour la plupart des verbes en lingala de la diaspora. Les verbes irréguliers et les variantes régionales peuvent différer. Entrées vérifiées de notre dictionnaire.',
      'vp.eyebrow.verbs': 'Verbes',
    },

    // ⚠️ LINGALA — DRAFT translations, need native-speaker review. Diaspora
    // Lingala mixes in French loanwords for modern/technical terms. See todo.md.
    ln: {
      'title.home': 'Lingala — Tobatela monoko na biso mpo na bato ya Congo bipai nyonso',
      'title.about': 'Na ntina ya Lingala',
      'title.privacy': 'Bobateli ya makambo na yo',

      'nav.about': 'Na ntina',
      'nav.how': 'Ndenge esalaka',
      'nav.community': 'Lisanga',
      'nav.cta': 'Fungola karte ya lelo',
      'nav.name': 'Luka nkombo na yo',
      'nav.dictionary': 'Buku ya maloba',
      'nav.count': 'Tanga',
      'nav.verbs': 'Maverbe',
      'nav.memory': 'Mwango',
      'nav.map': 'Karte ya mboka',

      'title.notFound': 'Lokasa ezangi — Lingala',
      'title.map': 'Karte ya Congo — Lingala',
      'nf.eyebrow':     'Lokasa ezangi',
      'nf.title':       'Nzela oyo ezali te.',
      'nf.sub':         'Lokasa oyo ozali koluka mbala mosusu elongwaki, ebongolami nkombo, to ezalaki ata moko te. Likambo ya malamu: oyo etikali ya Lingala ezali kaka awa.',
      'nf.quote':       '« Nzela ya solo ezali penepene. »',
      'nf.cta':         '← Zonga na ndako',
      'nf.cta2':        "Karte ya mokolo",
      'hero.scroll': 'Kitisa mpo na kotala',
      'aria.theme': 'Langi',
      'aria.lang': 'Monoko',
      'aria.green': 'Vert',
      'aria.blue': 'Bleu',
      'aria.yellow': 'Jaune',
      'aria.red': 'Motane',

      'hero.eyebrow': 'Lingala · RDC · Partout',
      'hero.headline': 'Monoko na yo.<br><em>Bomoto na yo.</em><br>Liloba moko mokolo na mokolo.',
      'hero.sub': 'Ofele. Kitoko. Ya yo mpo na kokabola.',
      'hero.body': 'Lingala epesaka bato ya Congo bipai nyonso liloba ya Lingala mokolo na mokolo, na kati ya karte ya kitoko — ya kobongama mpo na kotinda na Instagram, TikTok to WhatsApp na mwa basegonde.',
      'hero.btnPrimary': 'Tala karte ya lelo →',
      'hero.btnGhost': 'Yeba mingi',

      'card.dateTag': 'Lelo',
      'card.category': 'Mbote',
      'card.translation': 'Mbote ya limemia',
      'card.note': 'Losako ezali lolenge ya kitoko mpe ya limemia ya komilakisa mpe kopesa mbote — elembo ya moto oyo asepeli mpenza kozala liboso na yo.',

      'strip.nologin': 'Kokota te',
      'strip.noads': 'Piblisite te',
      'strip.nodata': 'Bansango ekamatami te',
      'strip.free': 'Ofele mpo na libela',
      'strip.offline': 'Esalaka ata na enternet te',
      'strip.made': 'Esalemi na bana-Congo',

      'about.eyebrow': 'Lingala ezali nini',
      'about.title': 'Ezali aplikasyo ya kelasi te.<br><em>Ezali eloko ya mimeseno.</em>',
      'about.body1': 'Moto oyo asalelaka Lingala azali koluka koyekola monoko te. Azali koluka komonisa <strong>eloko moko na ntina ya nani azali.</strong>',
      'about.body2': 'Mwana ya molongo ya mibale ya Congo na Brussels, Londres, Montréal to Atlanta afungolaka aplikasyo te mpo na koyekola maloba. Afungolaka yango mpo azali na lolendo ya esika libota na ye euti — mpe azalaki naino na eloko ya kitoko mpe ya kobongama te mpo na komonisa lolendo wana.',
      'about.body3': '<strong>Lingala epesi ye eloko wana.</strong> Monoko ezali emballage. Bomoto ezali likabo.',
      'stat.phrases': 'maloba ya Lingala tii sikoyo · tozali kokende na 365',
      'stat.categories': 'Bituluku ya mimeseno',
      'stat.cost': 'Talo ya kosalela, mpo na libela',
      'stat.speed': 'Banda kofungola tii kokabola',
      'about.quote': '« Tango moto ya libota na ngai alobaka liloba oyo, ememaka mibu tuku misato ya lisolo. Sikoyo nakoki kokabola yango. »',

      // story (Esika Lingala euti)
      'story.eyebrow': 'Esika Lingala euti',
      'story.title': 'Monoko ebotami na ebale.<br><em>Ememami na bato.</em>',
      'story.body1': 'Ba-<strong>Bangala</strong> — <em>« bato ya ebale »</em> — bavandaka pembeni ya mabongo monene ya ebale Kongo na nord, ebale ya mibale na monene na mokili mobimba. Bobangi, Boloki, Mabale na bituluku mosusu ya ebale bazalaki bato ya mombongo ya Kongo ya likolo : batekaka mafuta ya mbila, mbisi, mongwa, na mbeki, bamemaka biloko na nzela ya mai ya kilomɛtɛlɛ 4 700.',
      'story.body2': 'Na mombongo wana, monoko moko ya kosangana ebimaki. Etongami na misisa ya Bobangi mpe ebongisamaki mpo na mombongo kati na minoko ebele, ekomaki monoko ya bisika ya ebale. Liyokeli <em>Li-</em> elakisi monoko ; <em>ngala</em> elakisi bato. Yango wana : <strong>Lingala — monoko ya bato ya ebale.</strong>',
      'story.body3': 'Tango Kinshasa ekomaki engumba moko ya minene ya mokili — etɛlɛmi likoló ya ebale, etalami na mabele ya Bakongo na sud — ezalaki rumba ya Kongo, oyo bayembi ya ebale bayembaka na Lingala, nde ememaki monoko na kati ya mboka-mokonzi mpe na radio ya Afrika mobimba. Lelo Lingala ezali mongongo ya Kinshasa, ya miziki, mpe ya ndako nyonso ya bato ya Kongo na diaspora oyo bayembaka kaka <em>esengo nayoki na ngai.</em>',
      'story.stat1': 'Bato bayebi Lingala — RDC, Congo-Brazzaville, Angola, RCA',
      'story.stat2': 'Bana ya Kongo babotami lelo · motango ezali kotambola, na RDC',
      'story.stat3': 'Kinshasa — engumba ya monene ya bafrancophones na mokili',
      'story.stat4': 'Ebale Kongo — nzela ya liboso ya monoko',
      'story.caption': 'Bitúká minei ya ebale — Équateur, Mongala, Nord-Ubangi, Sud-Ubangi — ezali motema ya mboka ya Bangala. Banda kuna, Lingala etiyolaki na Kinshasa, na miziki, mpe na diaspora.',

      'how.eyebrow': 'Ndenge esalaka',
      'how.title': 'Fungola. Télécharger. <em>Kabola misisa na yo.</em>',
      'how.s1title': 'Karte ya lelo ebimi',
      'how.s1body': 'Kozela te. Kokota te. Mibateli te. Karte ezali wana tango kaka ofungoli aplikasyo — liloba ya sika ya Lingala mokolo na mokolo, kaka yango moko mpo na bana-Congo nyonso ya mokili mobimba.',
      'how.s2title': 'Tanga mimeseno',
      'how.s2body': 'Liloba nyonso eyaka na mwa makomi ya mimeseno oyo ekomami na bolingo mpe na bozindo — definisyo ya diksionere te. Esika euti, tango bambuta basalelaka yango, eloko nini ememaka na motema.',
      'how.s3title': 'Télécharger mpe kotinda',
      'how.s3body': 'Fini moko esalaka elilí ya kitoko 1080×1080 na téléphone na yo. Tinda yango na Instagram, TikTok, to na groupe WhatsApp ya libota. Filigrane ya nsoni te. Screenshot te.',

      'demo.label': 'Mimeseno',
      'demo.translation': 'Mbote',
      'demo.noteTitle': 'Makomi ya mimeseno',
      'demo.noteText': 'Mbote ezali liloba ya liboso oyo bato mingi bayekolaka na Lingala, mpe oyo okosalela mingi koleka. Esalaka na ntongo, na midi mpe na butu, epai ya moto moko to ebele. Loba « Mbote » na mwa kotcombola motó mpe ozali kosi koloba monoko ya ndako.',
      'demo.readMore': 'Yeba mingi na ntina ya liloba oyo →',
      'culture.eyebrow': 'Makomi ya mimeseno',
      'culture.title': 'Molimo ya <em>eloko yango.</em>',
      'culture.body1': 'Bisaleli mosusu nyonso ya monoko eyebisaka yo ndimbola ya liloba. Lingala eyebisaka yo <strong>eloko nini liloba ememaka.</strong>',
      'culture.body2': 'Makomi ya mimeseno ekomami lokola definisyo ya buku te, kasi lokola mobange ya Congo azali kolobela yo monoko na ye — na lolendo, bolingo mpe esengo. Ekangisaka maloba na lisolo, na miziki, na bisika ya bomoi oyo epesaka monoko ndimbola na yango.',
      'culture.quote': 'Yango nde ekesenisaka liloba na eteni ya mimeseno — mpe eteni ya mimeseno nde ebongi mpo na kokabola.',
      'culture.body3': 'Karte nyonso ezali na makomi ya mokuse mpo na karte yango moko, mpe makomi ya molai mpo na moto oyo alingi koleka mosika. Moko ezali mpo na Instagram. Mosusu ezali mpo na moto oyo akundoli koko na ye azalaki koloba yango.',

      'comm.eyebrow': 'Lisanga',
      'comm.title': 'Esalemi na bato ya Congo.<br><em>Mpo na bato ya Congo.</em>',
      'comm.body': 'Ebombelo ya maloba ekoli na makabo ya bisanga ya bana-Congo ya mokili mobimba. Oyebi lisese oyo koko na yo asalelaka? Liloba ya kartye na yo ya Kinshasa oyo buku moko te ekanga naino? Tinda yango. Bakisi nyonso oyo ekoti na rotation epesami na nkombo ya moto oyo akabolaki yango.',
      'comm.btn': 'Pesa liloba',
      'comm.from1': 'Eutaki na Brussels',
      'comm.from2': 'Eutaki na Montréal',
      'comm.from3': 'Eutaki na Atlanta',
      'comm.t1': 'Nalingi yo',
      'comm.t2': 'Tokomonana',
      'comm.t3': 'Bolingo',

      'promise.eyebrow': 'Motambo te. Lifuti te. Kónti te.',
      'promise.title': 'Tobatela Lingala<br><em>mpo na bato ya Congo bipai nyonso.</em>',
      'promise.body': 'Fungola yango sikoyo. Tala liloba ya lelo. Télécharger karte. Kabola yango na moto oyo ayebi esika monoko yango euti.',
      'pill1': '🌍 Esalaka na navigateur nyonso',
      'pill2': '📱 Ekoki kotyama lokola aplikasyo',
      'pill3': '✈️ Esalaka ata na enternet te',
      'pill4': '🔒 Bansango ekamatami te',
      'pill5': '🆓 Ofele mpo na libela',
      'promise.cta': 'Fungola Lingala →',

      'footer.tagline': 'Tobatela Lingala mpo na bato ya Congo bipai nyonso · 🇨🇩',
      'footer.about': 'Na ntina',
      'footer.privacy': 'Bobateli',
      'footer.install': 'Tia app',
      'footer.contact': 'Benga biso',
      'footer.made': 'Esalemi na bolingo na moto ya Congo, mpo na bato ya Congo nyonso',

      'ab.h1': 'Na ntina ya Lingala',
      'ab.p1': 'Lingala emonisaka liloba moko ya Lingala mokolo na mokolo, ekanga yango na karte ya kitoko, mpe epesi yo nzela ya ko-télécharger mpo na kokabola na Instagram, TikTok, WhatsApp to esika nyonso bato na yo bazali.',
      'ab.p2': 'Ezali mpo na mwana ya molongo ya mibale ya Congo na Brussels, Londres, Montréal to Atlanta oyo azali na lolendo ya esika libota na ye euti mpe alingi nzela ya koloba yango. Monoko ezali emballage. Bomoto ezali likabo.',
      'ab.p3': 'Bato nyonso, bipai nyonso, bamonaka liloba kaka moko na mokolo kaka moko — yango wana tango otindi karte ya lelo, basusu bayebi yango, mpe mwa ntango ya lisanga esalemi. Makomi ya mimeseno ekomami mpo eyokana lokola mobange azali kolobela yo monoko na ye, na bolingo mpe lolendo, kasi lokola buku ya kelasi te.',
      'ab.p4': 'Ezali ofele, esalaka ata na enternet te nsima ya kotala ya liboso, mpe esengaka kokota te. Soki oyebi liloba, lisese to maloba oyo libota na yo esalelaka oyo ezangi epai na biso, formulaire ezali na ekran ya karte — likanisi nyonso etangami na loboko.',
      'ab.made': 'Esalemi na <a href="https://artivicolab.com" target="_blank" rel="noopener">Artivicolab</a> · <a href="mailto:artivicolab@gmail.com">Benga biso</a>',

      'pr.h1': 'Bobateli ya makambo na yo',
      'pr.intro': 'Lingala esalemi mpo etika makambo na yo. Talá ndenge nini yango ezali.',
      'pr.h2a': 'Oyo etikalaka na apareyi na yo',
      'pr.pa': 'Série na yo, mibateli na yo (monoko, langi ya karte, lolenge ya télécharger), mpe makomi ya bakarte oyo otali ezali na ebombelo ya navigateur na yo (IndexedDB) kaka na apareyi oyo. Etindamaka na esika mosusu te, esangisamaka na serveur te, mpe ekangisami na kónti te — kónti ezali te. Kolongola ba-données ya navigateur, to kosalela « Longola ba-données nyonso » na Mibateli, elongolaka yango nyonso.',
      'pr.h2b': 'Eloko se moko oyo okoki kotinda',
      'pr.pb': 'Soki osaleli formulaire « Pesa liloba », efungolaka kaka aplikasyo na yo ya e-mail na liloba esili kokomama mpe na adresi na biso — eloko etindami te tii yo moko okotinda e-mail yango, mpe eleki na moto mosusu te. Kotya eloko te oyo olingi te tótanga.',
      'pr.h2c': 'Bakarte mpe bililingi',
      'pr.pc': 'Bakarte ya mokolo na mokolo mpe bililí oyo otélécharger esalemaka mobimba na navigateur na yo. Ko-télécharger to kokabola karte eyebisaka biso eloko te.',
      'pr.h2d': 'Statistiques',
      'pr.pd': 'Tokoki kosalela statistiques ya web ya komemya bomoi ya nkuku mpo na koyeba bato boni basalelaka Lingala mpe basaleli nini ezali na ntina, mpo tókoka kobongisa yango. Ezali na ntina ya kosalela ya lisanga ya site, kasi ata moke te makambo na yo ya nkuku ya likolo. Totekaka ba-données na yo na moto te.',
      'pr.questions': 'Mituna? <a href="mailto:artivicolab@gmail.com">Benga biso</a>.',

      'foot.home': 'Ndako',
      'foot.about': 'Na ntina',
      'foot.privacy': 'Bobateli',
      'foot.contact': 'Benga biso',

      // count page (draft — needs native review)
      'count.eyebrow': 'Motango · Numero',
      'count.title': 'Tanga na Lingala. <em>Banda moko ti nkoto.</em>',
      'count.sub': 'Nzela minei ya koyekola : tanga numero moko na moko, meka yo moko, to tika app etanga na mongongo.',
      'count.mode.count': 'Tanga',
      'count.mode.type': 'Koma numero',
      'count.mode.quizLn': 'LN → numero',
      'count.mode.quizDigit': 'Numero → LN',
      'count.mode.quizListen': 'Yoka → koma',
      'count.mode.auto': 'Auto',
      'count.replay': 'Banda lisusu',
      'count.mastery': 'Boyebi',
      'count.group.learn': 'Koyekola',
      'count.group.practice': 'Komeka',
      'count.more': 'Maye masusu',
      'count.firstHint': 'Nzela mitano ya koyekola — meka <strong>Auto</strong> mpo na koyoka, to <strong>Yoka → koma</strong> mpo na komeka.',
      'count.kbdTitle': 'Bilembo ya clavier',
      'count.kbdNav': 'Liboso / Sima',
      'count.kbdPlay': 'Banda / Pemiso (auto)',
      'count.kbdEnter': 'Tinda eyano',
      'count.kbdHelp': 'Lakisa fenêtre oyo',
      'count.kbdEsc': 'Kanga ba-fenêtre',
      'count.howFormed': 'Motángó oyo etongami ndenge nini?',
      'count.save': 'Bomba',
      'count.saved': 'Eboma',
      'count.printRules': 'Print ba-règle',
      'count.challengeGo': 'Banda',
      'count.challenge.0': "Défi ya lelo — tanga banda 0 ti <strong>10</strong>.",
      'count.challenge.1': "Défi ya lelo — tambola banda <strong>50</strong> ti <strong>100</strong>.",
      'count.challenge.2': "Défi ya lelo — tanga auto na dizaines ti <strong>100</strong>.",
      'count.challenge.3': "Défi ya lelo — session ya <strong>koyoka</strong>, 0–100.",
      'count.challenge.4': "Défi ya lelo — session <strong>LN → numero</strong>, 0–100.",
      'count.challenge.5': "Défi ya lelo — meka koma <strong>mobu na yo ya kobotama</strong> na Lingala.",
      'count.mode.compose': 'Tonga',
      'count.mode.quizRule': 'Règle nini?',
      'count.composeTarget': 'Tonga oyo:',
      'count.composeNew': 'Sika',
      'count.composeBack': '↶ Bongisa',
      'count.composeCheck': 'Tala',
      'count.range': 'Bondelo',
      'count.step': 'Etape',
      'count.streak': 'Etamboli',
      'count.best': 'Eleki',
      'count.typePlaceholder': 'Koma numero banda 0 ti 999 999 999…',
      'count.speed': 'Mbangu',
      'count.speedFast': 'Mbangu (0,7 s)',
      'count.speedSteady': 'Pene-pene (1,1 s)',
      'count.speedSlow': 'Malembe (1,7 s)',
      'count.voiceOff': 'Mongongo te',
      'count.voiceOn': 'Mongongo iyo',
      'count.voiceNA': 'Mongongo ezali te',
      'count.voiceNote': 'Mongongo ya italien to espagnol ya systeme na yo — pene na Lingala koleka ya français. Ezali mongongo ya muto wa Kongo te.',
      'count.prev': '← Liboso',
      'count.next': 'Sima →',
      'count.start': 'Banda',
      'count.pause': 'Pemiso',
      'count.reset': 'Bandela sika',
      'count.skip': 'Leka',

      // verbs hub
      'title.verbs': 'Maverbe ya Lingala — ndimbola ya kosalela verbe',
      'meta.verbs.desc': 'Tala maverbe ya Lingala na ndimbola mobimba — ya sika, ya kala, ya sima, ya momesano, mpe ya te. Ya ofele, ezali ata sans internet, esalemi mpo na bana ya Congo bipai nyonso.',
      'verbs.eyebrow': 'Maverbe',
      'verbs.title': 'Maverbe ya Lingala, <em>ndimbola mobimba.</em>',
      'verbs.sub': 'Verbe moko na moko na ndimbola na yango ya komandi, na bakitano nyonso motoba (ngai, yo, ye, biso, bino, bango), mpe na ntango ya sika, ya kala, ya sima, ya momesano, mpe ya te. Finá verbe mpo na komona tableau mobimba.',
      'verbs.count': 'Maverbe {n} · ndimbola nyonso ekoti',
      'verbs.searchPh': 'Luka verbe, ndimbola na anglais, to motó ya verbe…',
      'verbs.empty': 'Verbe moko te ekokani na boluki na yo.',
      'verbs.viewMore': 'Tala {n} mosusu',
      'verbs.viewAll': 'Maverbe nyonso {n} ezali komonana',
      'verbs.loadErr': 'Tokoki kotanga maverbe te.',
      'verbs.imperative': '(komandi)',
      'verbs.showForms': 'Tala bandimbola',
      'verbs.hideForms': 'Bomba bandimbola',
      'verbs.fullTable': 'Tableau mobimba · bakitano motoba →',
      'verbs.ariaSpeak': 'Yoka {w}',
      'verbs.hero.eyebrow': 'Verbe ya mokolo',
      'verbs.hero.cta': 'Tala tableau mobimba →',
      'verbs.hero.hear': '🔊 Yoka',
      'verbs.hero.shuffle': '🎲 Verbe na bobwakami',
      'verbs.t.present':  'Ya sika',
      'verbs.t.past':     'Ya kala',
      'verbs.t.future':   'Ya sima',
      'verbs.t.habitual': 'Ya momesano',
      'verbs.t.negative': 'Ya te',
      'verbs.t.presentN':  'Ya sika (ngai)',
      'verbs.t.pastN':     'Ya kala (ngai)',
      'verbs.t.futureN':   'Ya sima (ngai)',
      'verbs.t.habitualN': 'Ya momesano (ngai)',

      'vp.imp.sg':  'Komandi (moko) :',
      'vp.imp.pl':  'ya bingi :',
      'vp.t.present':           'Ya sika',
      'vp.t.presentContinuous': 'Ya kosala',
      'vp.t.past':              'Ya kala',
      'vp.t.future':            'Ya sima',
      'vp.t.habitual':          'Ya momesano',
      'vp.t.negativePresent':   'Ya te (ya sika)',
      'vp.t.negative':          'Ya te',
      'vp.subj.1sg': '',
      'vp.subj.2sg': '',
      'vp.subj.3sg': '',
      'vp.subj.1pl': '',
      'vp.subj.2pl': '',
      'vp.subj.3pl': '',
      'vp.disclaimer': 'Ndimbola esalemi na mibeko ya morphologie ya Bantou — ezali bosolo mpo na maverbe mingi ya Lingala ya diaspora. Maverbe ya makakola mpe ya bisika misusu ekoki kokesana. Maloba elobiama uta na dictionnaire na biso.',
      'vp.eyebrow.verbs': 'Maverbe',
    },
  };

  const KEY = 'lingala.sitelang';
  const LANGS = ['en', 'fr', 'ln'];

  // Detect language with this priority order:
  //   1. URL ?lang=fr   → critical for SEO (each language has its own URL)
  //   2. saved localStorage
  //   3. navigator.language
  //   4. fallback 'en'
  function detectFromUrl() {
    try {
      const p = new URLSearchParams(window.location.search).get('lang');
      if (p && LANGS.indexOf(p) >= 0) return p;
    } catch (e) {}
    return null;
  }
  function detect() {
    const fromUrl = detectFromUrl();
    if (fromUrl) return fromUrl;
    const saved = localStorage.getItem(KEY);
    if (LANGS.indexOf(saved) >= 0) return saved;
    const nav = (navigator.language || 'en').toLowerCase();
    if (nav.startsWith('fr')) return 'fr';
    if (nav.startsWith('ln')) return 'ln';
    return 'en';
  }

  function apply(lang) {
    const dict = STRINGS[lang] || STRINGS.en;
    // Fall back to English for any key not yet translated in this language,
    // so a partial translation never leaves blank/broken text.
    const get = (key) => (dict[key] != null ? dict[key] : STRINGS.en[key]);
    document.documentElement.lang = lang;

    const titleKey = document.body.getAttribute('data-title-i18n');
    if (titleKey && get(titleKey) != null) document.title = get(titleKey);

    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const v = get(el.getAttribute('data-i18n'));
      if (v != null) el.innerHTML = v;
    });

    // Translate attributes too (e.g. aria-label): data-i18n-attr="aria-label:key"
    // (semicolon-separate multiple attr:key pairs).
    document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
      el.getAttribute('data-i18n-attr').split(';').forEach((pair) => {
        const [attr, key] = pair.split(':').map((s) => s.trim());
        const v = key ? get(key) : null;
        if (attr && v != null) el.setAttribute(attr, v);
      });
    });

    document.querySelectorAll('[data-lang-btn]').forEach((b) => {
      const on = b.getAttribute('data-lang-btn') === lang;
      b.setAttribute('aria-pressed', String(on));
      b.style.opacity = on ? '1' : '0.5';
      b.style.fontWeight = on ? '700' : '400';
    });

    // Let page widgets (e.g. the hero carousel) react to a language change.
    try { window.dispatchEvent(new CustomEvent('lingala:lang', { detail: lang })); } catch (e) {}
  }

  function set(lang) {
    localStorage.setItem(KEY, lang);
    // URL must be updated BEFORE apply() — apply dispatches the
    // 'lingala:lang' event, which triggers downstream re-renders (e.g. the
    // count page's dynamic buttons) that call t() → detect() and read the
    // language from the URL param. Updating the URL after apply causes those
    // buttons to render in the previous language (the "FR button shows
    // Lingala / LN button shows French" bug).
    try {
      const url = new URL(window.location.href);
      if (lang === 'en') url.searchParams.delete('lang');
      else url.searchParams.set('lang', lang);
      window.history.replaceState({}, '', url.toString());
    } catch (e) {}
    apply(lang);
  }

  function init() {
    apply(detect());
    document.querySelectorAll('[data-lang-btn]').forEach((b) => {
      b.addEventListener('click', () => set(b.getAttribute('data-lang-btn')));
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  // Expose a translation lookup for scripts that build labels dynamically
  // (e.g. count.html's Prev/Next/Start buttons). Falls back to English.
  function t(key) {
    const lang = detect();
    const dict = STRINGS[lang] || STRINGS.en;
    return dict[key] != null ? dict[key] : (STRINGS.en[key] != null ? STRINGS.en[key] : key);
  }

  window.LingalaI18n = { set, detect, t };
})();
