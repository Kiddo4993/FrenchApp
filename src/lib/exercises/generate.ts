import type { VocabEntry } from "@/content/schema";
import type {
  ClozePrompt,
  DictationPrompt,
  ExerciseKind,
  ExercisePrompt,
  FreeTranslationPrompt,
  GenderDrillPrompt,
  McqPrompt,
  OddOneOutPrompt,
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
];

export function assembleLesson(
  targets: VocabEntry[],
  distractorPool: VocabEntry[],
  rng: () => number = Math.random,
): ExercisePrompt[] {
  return targets.map((target, i) => {
    const cycled = KIND_CYCLE[i % KIND_CYCLE.length];

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
      default:
        return buildMcqPrompt(distractorPool, target, "mcq_recognition", rng);
    }
  });
}
