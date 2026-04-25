import type { LocalizedString } from '../lib/schema';

export const STRINGS: Record<string, LocalizedString> = {
  // Common
  'common.back': { en: 'Back to start', sl: 'Nazaj na začetek' },
  'common.exit': { en: 'Exit', sl: 'Izhod' },
  'common.start': { en: 'Start', sl: 'Začni' },
  'common.next': { en: 'Next', sl: 'Naprej' },
  'common.previous': { en: 'Previous', sl: 'Nazaj' },
  'common.questions': { en: 'questions', sl: 'vprašanj' },

  // Home
  'home.eyebrow': { en: 'Scrum.org · Practice', sl: 'Scrum.org · Vadba' },
  'home.title': { en: 'The', sl: 'Vadbeni' },
  'home.italic': { en: 'practice', sl: 'izpit' },
  'home.pickCert': { en: 'Pick your certification', sl: 'Izberite certifikat' },
  'home.pickMode': { en: 'Pick your mode', sl: 'Izberite način' },
  'home.howItWorks': { en: 'How it works', sl: 'Kako deluje' },
  'home.how1': {
    en: 'Questions mirror the three real exam formats: single-choice, multi-select, and true/false.',
    sl: 'Vprašanja zrcalijo tri formate pravega izpita: en odgovor, več odgovorov in drži/ne drži.',
  },
  'home.how2': {
    en: 'In Practice, Drill, and Infinite you get an explanation after each answer — the why matters more than the score.',
    sl: 'V Vadbi, Vadbi teme in Neskončnem dobiš razlago po vsakem odgovoru — zakaj je pomembnejše od ocene.',
  },
  'home.how3': {
    en: 'Mock exam mirrors the real thing: timer, no feedback mid-exam, flag and review before submitting.',
    sl: 'Vadbeni izpit zrcali pravega: štoparica, brez razlag med izpitom, označevanje in pregled pred oddajo.',
  },
  'home.how4': {
    en: 'Multi-select is scored all-or-nothing, same as Scrum.org.',
    sl: 'Več-izbirna vprašanja se ocenjujejo vse-ali-nič, enako kot na Scrum.org.',
  },
  'home.how5': {
    en: 'Keyboard shortcuts work on desktop. Results always show your weak topics so you know where to re-read.',
    sl: 'Bližnjice tipkovnice delujejo na namizju. Rezultati vedno pokažejo šibke teme.',
  },

  // Length picker
  'length.pick': { en: 'Pick your length', sl: 'Izberite dolžino' },
  'length.warmup': { en: 'Warm-up', sl: 'Ogrevanje' },
  'length.warmup.sub': { en: 'Quick pulse-check', sl: 'Hiter pregled' },
  'length.standard': { en: 'Standard', sl: 'Standardno' },
  'length.standard.sub': { en: 'Balanced practice', sl: 'Uravnotežena vadba' },
  'length.full': { en: 'Full exam', sl: 'Celoten izpit' },
  'length.full.sub': { en: 'mirrors the real test', sl: 'kot pravi izpit' },

  // Topic picker
  'topic.pick': { en: 'Pick a topic', sl: 'Izberite temo' },
  'topic.drillIt': { en: 'Drill it', sl: 'Vadi' },

  // Quiz card
  'quiz.chooseOne': { en: 'Choose one', sl: 'Izberi enega' },
  'quiz.selectAll': { en: 'Select all that apply', sl: 'Izberi vse, kar velja' },
  'quiz.tf': { en: 'True or False', sl: 'Drži ali ne drži' },
  'quiz.submit': { en: 'Submit answer', sl: 'Oddaj odgovor' },
  'quiz.seeResults': { en: 'See results', sl: 'Poglej rezultate' },
  'quiz.correct': { en: 'Correct.', sl: 'Pravilno.' },
  'quiz.notQuite': { en: 'Not quite.', sl: 'Ni čisto.' },
  'quiz.selected': { en: 'selected', sl: 'izbranih' },

  // Mock
  'mock.flag': { en: 'Flag', sl: 'Označi' },
  'mock.flagged': { en: 'Flagged', sl: 'Označeno' },
  'mock.reviewSubmit': { en: 'Review & submit', sl: 'Pregled in oddaja' },
  'mock.flaggedCount': { en: 'flagged', sl: 'označenih' },
  'mock.answered': { en: 'answered', sl: 'odgovorjenih' },
  'mock.questionNavigator': { en: 'Question navigator', sl: 'Krmar vprašanj' },
  'mock.unanswered': { en: 'Unanswered', sl: 'Neodgovorjeno' },
  'mock.answeredLegend': { en: 'Answered', sl: 'Odgovorjeno' },
  'mock.flaggedLegend': { en: 'Flagged', sl: 'Označeno' },
  'mock.reviewBefore': { en: 'Review before submit', sl: 'Pregled pred oddajo' },
  'mock.areYouSure': { en: "Are you sure you're", sl: 'Ali ste prepričani, da ste' },
  'mock.done': { en: 'done?', sl: 'končali?' },
  'mock.submitExam': { en: 'Submit exam', sl: 'Oddaj izpit' },
  'mock.timeRemaining': { en: 'Time remaining', sl: 'Preostali čas' },
  'mock.youAnswered': { en: "You've answered", sl: 'Odgovorili ste na' },
  'mock.outOf': { en: 'of', sl: 'od' },
  'mock.questionsPeriod': { en: 'questions.', sl: 'vprašanj.' },
  'mock.flaggedReview': { en: 'flagged for review.', sl: 'označenih za pregled.' },
  'mock.keepGoing': { en: 'Keep going', sl: 'Nadaljuj' },
  'mock.results': { en: 'Mock exam results', sl: 'Rezultati vadbenega izpita' },

  // Exit modal
  'exit.title': { en: 'Exit this quiz?', sl: 'Izhod iz vadbe?' },
  'exit.body1': { en: "You've answered", sl: 'Odgovorili ste na' },
  'exit.body2': { en: 'questions. Your progress will be lost.', sl: 'vprašanj. Napredek bo izgubljen.' },
  'exit.bodyOf': { en: 'of', sl: 'od' },
  'exit.keepGoing': { en: 'Keep going', sl: 'Nadaljuj' },
  'exit.exitAnyway': { en: 'Exit anyway', sl: 'Vseeno izhod' },

  // Results
  'results.eyebrowOn': { en: 'On track', sl: 'Na pravi poti' },
  'results.eyebrowKeep': { en: 'Keep studying', sl: 'Še vadi naprej' },
  'results.correctOf': { en: 'correct out of', sl: 'pravilnih od' },
  'results.aboveThreshold': {
    en: "That's at or above the 85% threshold.",
    sl: 'To je nad pragom 85 %.',
  },
  'results.youNeed': { en: 'You need', sl: 'Potrebujete' },
  'results.moreCorrect': { en: 'more correct to reach 85%.', sl: 'več pravilnih za doseg 85 %.' },
  'results.newRound': { en: 'New round — same', sl: 'Nov krog — isti' },
  'results.changeConfig': { en: 'Change certification / length', sl: 'Spremeni certifikat / dolžino' },
  'results.byTopic': { en: 'By topic — weakest first', sl: 'Po temah — najšibkejše prvo' },
  'results.review': { en: 'Review your answers', sl: 'Pregled odgovorov' },
  'results.missed': { en: 'Missed', sl: 'Zgrešeni' },
  'results.all': { en: 'All', sl: 'Vsi' },
  'results.cleanSweep': {
    en: 'No missed questions. Clean sweep.',
    sl: 'Brez napak. Čisti zadetek.',
  },
  'results.correctLabel': { en: 'Correct', sl: 'Pravilno' },
  'results.missedLabel': { en: 'Missed', sl: 'Zgrešeno' },
  'results.correctAnswer': { en: 'Correct answer', sl: 'Pravilen odgovor' },
  'results.yourResults': { en: 'Your results', sl: 'Vaši rezultati' },
  'results.infiniteSession': { en: 'Infinite session', sl: 'Neskončna seja' },

  // Modes
  'mode.practice.title': { en: 'Practice', sl: 'Vadba' },
  'mode.practice.italic': { en: 'learn as you go', sl: 'uči se sproti' },
  'mode.practice.desc': {
    en: 'Answer at your own pace. See the why after every question. Pick 10, 30, or the full 80.',
    sl: 'Odgovarjaj v svojem tempu. Po vsakem vprašanju vidiš zakaj. Izberi 10, 30 ali vseh 80.',
  },
  'mode.mock.title': { en: 'Mock exam', sl: 'Vadbeni izpit' },
  'mode.mock.italic': { en: 'the real thing', sl: 'kot pravi izpit' },
  'mode.mock.desc': {
    en: 'Exam-faithful: 80 questions · 60 minutes · 85% to pass · no feedback until the end. Flag and review before submitting.',
    sl: 'Kot pravi izpit: 80 vprašanj · 60 minut · 85 % za prehod · brez razlag do konca. Označuj in preglej pred oddajo.',
  },
  'mode.drill.title': { en: 'Topic drill', sl: 'Vadba teme' },
  'mode.drill.italic': { en: 'one area at a time', sl: 'eno področje naenkrat' },
  'mode.drill.desc': {
    en: 'Pick a topic — Accountabilities, Events, Artifacts, Scenarios — and grind it until you own it.',
    sl: 'Izberi temo — odgovornosti, dogodki, artefakti, scenariji — in vadi do obvladovanja.',
  },
  'mode.infinite.title': { en: 'Infinite', sl: 'Neskončno' },
  'mode.infinite.italic': { en: 'until you stop', sl: 'dokler ne ustaviš' },
  'mode.infinite.desc': {
    en: 'Endless shuffled stream. Running accuracy counter. Walk away whenever you want.',
    sl: 'Neskončen mešan tok vprašanj. Tekoč števec točnosti. Ustavi se, ko hočeš.',
  },
  'mode.hardcore.title': { en: 'Hardcore', sl: 'Hardcore' },
  'mode.hardcore.italic': { en: 'ten questions that hurt', sl: 'deset bolečih vprašanj' },
  'mode.hardcore.desc': {
    en: 'Ten scenario-heavy questions where three of four options sound right. Tests judgment under competing Scrum principles, not memorization. For when you think you really know it.',
    sl: 'Deset scenarijev, kjer tri od štirih možnosti zveni pravilno. Preizkuša presojo med tekmujočimi Scrum načeli, ne pomnjenja. Za ko misliš, da res znaš.',
  },

  // Tracks
  'track.psm1.short': { en: 'Scrum Master', sl: 'Scrum Master' },
  'track.psm1.tagline': {
    en: 'Built from the Scrum Guide 2020. Calibrated to how the real test reads.',
    sl: 'Zgrajeno iz Scrum vodnika 2020. Usklajeno z besedilom pravega izpita.',
  },
  'track.pspo1.short': { en: 'Product Owner', sl: 'Lastnik produkta' },
  'track.pspo1.tagline': {
    en: 'Built from the Scrum Guide 2020. Focused on the Product Owner accountability.',
    sl: 'Zgrajeno iz Scrum vodnika 2020. Osredotočeno na odgovornost lastnika produkta.',
  },

  // Practice page
  'practice.eyebrowSuffix': { en: 'Practice', sl: 'Vadba' },
  'practice.title': { en: 'Practice', sl: 'Vadba' },
  'practice.italic': { en: 'at your pace', sl: 'v svojem tempu' },
  'practice.tagline': {
    en: 'Answer, see the why, move on. Pick a length.',
    sl: 'Odgovori, poglej zakaj, naprej. Izberi dolžino.',
  },

  // Drill page
  'drill.eyebrowSuffix': { en: 'Drill', sl: 'Vadba teme' },
  'drill.title': { en: 'Drill', sl: 'Vadba' },
  'drill.italic': { en: 'one area', sl: 'enega področja' },
  'drill.tagline': {
    en: 'Pick a topic and grind it until it clicks.',
    sl: 'Izberi temo in vadi, dokler ne klikne.',
  },

  // Mock page
  'mock.modeLabel': { en: 'Mock', sl: 'Vadbeni' },
  'mock.exitConfirm': { en: 'Exit', sl: 'Izhod' },

  // Footer
  'footer.examRef': {
    en: 'Real exam reference: 80 questions · 60 minutes · 85% to pass · based on the Scrum Guide 2020.',
    sl: 'Referenca pravega izpita: 80 vprašanj · 60 minut · 85 % za prehod · po Scrum vodniku 2020.',
  },
  'footer.shortcuts': {
    en: 'select · submit / next · navigate · exit · real exam: 80 Q · 60 min · 85% to pass',
    sl: 'izberi · oddaj / naprej · navigacija · izhod · pravi izpit: 80 V · 60 min · 85 % za prehod',
  },

  // 404
  '404.eyebrow': { en: '404 — not found', sl: '404 — ni najdeno' },
  '404.titleStart': { en: 'That page', sl: 'Te strani' },
  '404.italic': { en: "doesn't", sl: 'ni' },
  '404.titleEnd': { en: 'exist.', sl: '.' },
  '404.tagline': {
    en: 'But the practice exam is always waiting.',
    sl: 'Vadbeni izpit pa te vedno čaka.',
  },
  '404.back': { en: 'Back to start', sl: 'Nazaj na začetek' },

  // Stop label for infinite mode
  'infinite.stop': { en: 'Stop', sl: 'Ustavi' },
};

export type StringKey = keyof typeof STRINGS;
