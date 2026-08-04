import type { ReadingPassage, RegisterSwapEntry, Verb, VocabEntry } from "@/content/schema";
import type {
  ClozePrompt,
  ConjugationDrillPrompt,
  DictationPrompt,
  ExerciseKind,
  ExercisePrompt,
  FreeTranslationPrompt,
  GenderDrillPrompt,
  ListeningPrompt,
  MatchingPairsPrompt,
  McqPrompt,
  OddOneOutPrompt,
  ReadingComprehensionPrompt,
  RegisterSwapPrompt,
  SentenceOrderingPrompt,
  SpeakingPrompt,
  WordBankPrompt,
} from "@/types/exercise";

export function shuffle<T>(items: T[], rng: () => number = Math.random): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const VOWEL_START = /^[aeiouàâéèêëîïôùûüh]/i;

function pickDistractors(
  pool: VocabEntry[],
  target: VocabEntry,
  count: number,
  lang: "fr" | "en",
  rng: () => number,
): string[] {
  const correctAnswer = (lang === "fr" ? target.fr : target.en).toLowerCase();
  const candidates = pool.filter(
    (e) =>
      e.id !== target.id &&
      e.pos === target.pos &&
      (lang === "fr" ? e.fr : e.en).toLowerCase() !== correctAnswer,
  );
  return shuffle(candidates, rng)
    .slice(0, count)
    .map((e) => (lang === "fr" ? e.fr : e.en));
}

export function buildMcqPrompt(
  pool: VocabEntry[],
  target: VocabEntry,
  kind: "mcq_recognition" | "mcq_production",
  rng: () => number = Math.random,
): McqPrompt {
  const isRecognition = kind === "mcq_recognition";
  const correctAnswer = isRecognition ? target.en : target.fr;
  const distractors = pickDistractors(pool, target, 3, isRecognition ? "en" : "fr", rng);
  const options = shuffle([correctAnswer, ...distractors], rng);
  return {
    id: `${target.id}-${kind}`,
    kind,
    cardId: target.id,
    promptText: isRecognition ? target.fr : target.en,
    promptAudioText: isRecognition ? target.audioText : undefined,
    options,
    correctIndex: options.indexOf(correctAnswer),
    explanation: `« ${target.fr} » = « ${target.en} »`,
  };
}

export function buildWordBankPrompt(target: VocabEntry, rng: () => number = Math.random): WordBankPrompt {
  const words = target.exampleFr.split(" ");
  return {
    id: `${target.id}-word-bank`,
    kind: "word_bank",
    cardId: target.id,
    promptText: target.exampleEn,
    promptAudioText: undefined,
    tiles: shuffle(words, rng),
    correctOrder: words,
    explanation: `« ${target.exampleFr} »`,
  };
}

export function buildFreeTranslationPrompt(target: VocabEntry): FreeTranslationPrompt {
  return {
    id: `${target.id}-free-translation`,
    kind: "free_translation",
    cardId: target.id,
    promptText: target.exampleEn,
    acceptedAnswers: [target.exampleFr],
    explanation: `Réponse : « ${target.exampleFr} »`,
  };
}

export function buildClozePrompt(target: VocabEntry): ClozePrompt | null {
  const sentence = target.exampleFr;
  const idx = sentence.toLowerCase().indexOf(target.lemma.toLowerCase());
  if (idx === -1) return null;
  const before = sentence.slice(0, idx);
  const matched = sentence.slice(idx, idx + target.lemma.length);
  const after = sentence.slice(idx + target.lemma.length);
  const acceptedAnswers = [matched, target.lemma].filter(
    (v, i, arr) => arr.indexOf(v) === i,
  );
  return {
    id: `${target.id}-cloze`,
    kind: "cloze",
    cardId: target.id,
    before,
    after,
    acceptedAnswers,
    hint: target.en,
    explanation: `« ${sentence} »`,
  };
}

export function buildDictationPrompt(target: VocabEntry): DictationPrompt {
  return {
    id: `${target.id}-dictation`,
    kind: "dictation",
    cardId: target.id,
    audioText: target.exampleFr,
    acceptedAnswers: [target.exampleFr],
    explanation: `« ${target.exampleFr} »`,
  };
}

export function buildGenderDrillPrompt(
  target: VocabEntry,
  rng: () => number = Math.random,
): GenderDrillPrompt | null {
  if (target.pos !== "noun" || !target.gender || target.gender === "both") return null;
  const correctArticle: GenderDrillPrompt["correctArticle"] = VOWEL_START.test(target.lemma)
    ? "l'"
    : target.gender === "m"
      ? "le"
      : "la";
  return {
    id: `${target.id}-gender-drill`,
    kind: "gender_drill",
    cardId: target.id,
    noun: target.lemma,
    correctArticle,
    options: shuffle(["le", "la", "l'", "les"], rng),
    explanation: `${correctArticle} ${target.lemma}`,
  };
}

export function buildOddOneOutPrompt(
  sameGroupPool: VocabEntry[],
  oddPool: VocabEntry[],
  rng: () => number = Math.random,
): OddOneOutPrompt | null {
  if (sameGroupPool.length < 3 || oddPool.length < 1) return null;
  const three = shuffle(sameGroupPool, rng).slice(0, 3);
  const odd = shuffle(oddPool, rng)[0];
  const options = shuffle([...three.map((e) => e.fr), odd.fr], rng);
  return {
    id: `odd-${odd.id}-${three.map((e) => e.id).join("-")}`,
    kind: "odd_one_out",
    options,
    oddIndex: options.indexOf(odd.fr),
    categoryHint: sameGroupPool[0]?.topic,
  };
}

export function buildListeningPrompt(
  pool: VocabEntry[],
  target: VocabEntry,
  rng: () => number = Math.random,
): ListeningPrompt {
  const mode: ListeningPrompt["mode"] = rng() < 0.5 ? "choice" : "type";
  if (mode === "choice") {
    const distractors = pickDistractors(pool, target, 3, "fr", rng);
    const options = shuffle([target.fr, ...distractors], rng);
    return {
      id: `${target.id}-listening`,
      kind: "listening",
      cardId: target.id,
      audioText: target.audioText,
      mode,
      options,
      correctIndex: options.indexOf(target.fr),
      explanation: `« ${target.fr} » = « ${target.en} »`,
    };
  }
  return {
    id: `${target.id}-listening`,
    kind: "listening",
    cardId: target.id,
    audioText: target.audioText,
    mode,
    acceptedAnswers: [target.fr, target.lemma],
    explanation: `« ${target.fr} » = « ${target.en} »`,
  };
}

export function buildSpeakingPrompt(target: VocabEntry): SpeakingPrompt {
  return {
    id: `${target.id}-speaking`,
    kind: "speaking",
    cardId: target.id,
    targetText: target.exampleFr,
    translationHint: target.exampleEn,
  };
}

export function buildSentenceOrderingPrompt(
  target: VocabEntry,
  rng: () => number = Math.random,
): SentenceOrderingPrompt {
  const words = target.exampleFr.split(" ");
  return {
    id: `${target.id}-sentence-ordering`,
    kind: "sentence_ordering",
    cardId: target.id,
    tiles: shuffle(words, rng),
    correctOrder: words,
    translation: target.exampleEn,
    explanation: `« ${target.exampleFr} »`,
  };
}

/** Batch exercise (not tied to a single card) — picks `count` distinct words from `pool`. */
export function buildMatchingPairsPrompt(
  pool: VocabEntry[],
  count = 6,
  rng: () => number = Math.random,
): MatchingPairsPrompt | null {
  if (pool.length < count) return null;
  const chosen = shuffle(pool, rng).slice(0, count);
  return {
    id: `matching-${chosen.map((e) => e.id).join("-")}`,
    kind: "matching_pairs",
    pairs: chosen.map((e) => ({ fr: e.fr, en: e.en })),
    timeLimitSeconds: 60,
  };
}

const PERSON_LABELS: Record<string, string> = {
  "1s": "je",
  "2s": "tu",
  "3s": "il / elle / on",
  "1p": "nous",
  "2p": "vous",
  "3p": "ils / elles",
};

const TENSE_LABELS: Record<string, string> = {
  present: "présent",
  passe_compose: "passé composé",
  imparfait: "imparfait",
  futur_simple: "futur simple",
  conditionnel_present: "conditionnel présent",
  subjonctif_present: "subjonctif présent",
  plus_que_parfait: "plus-que-parfait",
  imperatif: "impératif",
};

/** Drills a random conjugated form of `verb`; not tied to a vocab card. */
export function buildConjugationDrillPrompt(
  verb: Verb,
  rng: () => number = Math.random,
): ConjugationDrillPrompt | null {
  if (verb.conjugations.length === 0) return null;
  const row = shuffle(verb.conjugations, rng)[0];
  return {
    id: `${verb.infinitive}-${row.tense}-${row.person}-conjugation`,
    kind: "conjugation_drill",
    infinitive: verb.infinitive,
    subjectLabel: PERSON_LABELS[row.person] ?? row.person,
    tenseLabel: TENSE_LABELS[row.tense] ?? row.tense,
    acceptedAnswers: [row.form],
    explanation: `${PERSON_LABELS[row.person] ?? row.person} ${row.form}`,
  };
}

export function buildRegisterSwapPrompt(entry: RegisterSwapEntry): RegisterSwapPrompt {
  return {
    id: `${entry.id}-register-swap`,
    kind: "register_swap",
    familierText: entry.familierText,
    acceptedSoutenuAnswers: entry.soutenuAnswers,
    explanation: `Registre soutenu : « ${entry.soutenuAnswers[0]} »`,
  };
}

export function buildReadingComprehensionPrompt(passage: ReadingPassage): ReadingComprehensionPrompt {
  return {
    id: `${passage.id}-reading`,
    kind: "reading_comprehension",
    title: passage.title,
    passage: passage.bodyFr,
    questions: passage.questions,
  };
}

/**
 * One exercise per target word, cycling through exercise kinds for variety and falling back to
 * a simpler kind when a word doesn't support the one the cycle landed on (e.g. gender_drill only
 * applies to nouns with a definite gender, cloze only when the lemma is findable in its example
 * sentence). `distractorPool` should be a broader set (same topic ideally) used for MCQ options.
 */
const KIND_CYCLE: ExerciseKind[] = [
  "mcq_recognition",
  "word_bank",
  "mcq_production",
  "cloze",
  "free_translation",
  "gender_drill",
  "dictation",
  // Appended rather than interleaved above so existing KIND_CYCLE[n] assumptions
  // (e.g. index 5 === "gender_drill") keep holding for callers and tests.
  "listening",
  "speaking",
  "sentence_ordering",
];

/**
 * PLAN.md §3 crown levels: each lesson node has 5 crown levels, increasingly demanding, with
 * level 5 restricted to free translation + speaking only.
 */
export const CROWN_KIND_TIERS: Record<1 | 2 | 3 | 4 | 5, ExerciseKind[]> = {
  1: ["mcq_recognition", "mcq_production", "gender_drill"],
  2: ["mcq_recognition", "mcq_production", "gender_drill", "word_bank", "cloze", "listening"],
  3: [
    "mcq_recognition",
    "mcq_production",
    "gender_drill",
    "word_bank",
    "cloze",
    "listening",
    "sentence_ordering",
  ],
  4: [
    "mcq_recognition",
    "mcq_production",
    "gender_drill",
    "word_bank",
    "cloze",
    "listening",
    "sentence_ordering",
    "dictation",
  ],
  5: ["free_translation", "speaking"],
};

export function assembleLesson(
  targets: VocabEntry[],
  distractorPool: VocabEntry[],
  rng: () => number = Math.random,
  allowedKinds?: ExerciseKind[],
): ExercisePrompt[] {
  const cycle =
    allowedKinds && allowedKinds.length > 0
      ? KIND_CYCLE.filter((k) => allowedKinds.includes(k))
      : KIND_CYCLE;
  const effectiveCycle = cycle.length > 0 ? cycle : KIND_CYCLE;
  return targets.map((target, i) => {
    const cycled = effectiveCycle[i % effectiveCycle.length];

    if (cycled === "gender_drill") {
      const p = buildGenderDrillPrompt(target, rng);
      if (p) return p;
    }
    if (cycled === "cloze") {
      const p = buildClozePrompt(target);
      if (p) return p;
    }

    switch (cycled) {
      case "mcq_production":
        return buildMcqPrompt(distractorPool, target, "mcq_production", rng);
      case "word_bank":
        return buildWordBankPrompt(target, rng);
      case "free_translation":
        return buildFreeTranslationPrompt(target);
      case "dictation":
        return buildDictationPrompt(target);
      case "listening":
        return buildListeningPrompt(distractorPool, target, rng);
      case "speaking":
        return buildSpeakingPrompt(target);
      case "sentence_ordering":
        return buildSentenceOrderingPrompt(target, rng);
      default:
        return buildMcqPrompt(distractorPool, target, "mcq_recognition", rng);
    }
  });
}
