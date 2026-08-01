import type { MatchStatus } from "@/lib/answer-matching";

export type ExerciseKind =
  | "mcq_recognition"
  | "mcq_production"
  | "listening"
  | "dictation"
  | "word_bank"
  | "free_translation"
  | "cloze"
  | "gender_drill"
  | "conjugation_drill"
  | "matching_pairs"
  | "speaking"
  | "sentence_ordering"
  | "reading_comprehension"
  | "odd_one_out"
  | "register_swap";

export interface ExerciseOutcome {
  correct: boolean;
  userAnswer: string;
  hintUsed: boolean;
  latencyMs: number;
  matchStatus?: MatchStatus;
}

interface BasePrompt {
  id: string;
  /** links back to the SRS card this exercise drills, when it maps to exactly one word/point */
  cardId?: string;
  /** one-line rule explanation shown on an incorrect answer */
  explanation?: string;
}

export interface McqPrompt extends BasePrompt {
  kind: "mcq_recognition" | "mcq_production";
  promptText: string;
  promptAudioText?: string;
  options: string[];
  correctIndex: number;
}

export interface ListeningPrompt extends BasePrompt {
  kind: "listening";
  audioText: string;
  mode: "choice" | "type";
  options?: string[];
  correctIndex?: number;
  acceptedAnswers?: string[];
}

export interface DictationPrompt extends BasePrompt {
  kind: "dictation";
  audioText: string;
  acceptedAnswers: string[];
}

export interface WordBankPrompt extends BasePrompt {
  kind: "word_bank";
  promptText: string;
  promptAudioText?: string;
  tiles: string[];
  correctOrder: string[];
}

export interface FreeTranslationPrompt extends BasePrompt {
  kind: "free_translation";
  promptText: string;
  promptAudioText?: string;
  acceptedAnswers: string[];
}

export interface ClozePrompt extends BasePrompt {
  kind: "cloze";
  before: string;
  after: string;
  acceptedAnswers: string[];
  hint?: string;
}

export interface GenderDrillPrompt extends BasePrompt {
  kind: "gender_drill";
  noun: string;
  correctArticle: "le" | "la" | "l'" | "les";
  options: ("le" | "la" | "l'" | "les")[];
}

export interface ConjugationDrillPrompt extends BasePrompt {
  kind: "conjugation_drill";
  infinitive: string;
  subjectLabel: string;
  tenseLabel: string;
  acceptedAnswers: string[];
}

export interface MatchingPairsPrompt extends BasePrompt {
  kind: "matching_pairs";
  pairs: { fr: string; en: string }[];
  timeLimitSeconds?: number;
}

export interface SpeakingPrompt extends BasePrompt {
  kind: "speaking";
  targetText: string;
  translationHint: string;
}

export interface SentenceOrderingPrompt extends BasePrompt {
  kind: "sentence_ordering";
  tiles: string[];
  correctOrder: string[];
  translation: string;
}

export interface ReadingComprehensionPrompt extends BasePrompt {
  kind: "reading_comprehension";
  title: string;
  passage: string;
  questions: { q: string; options: string[]; answer: number }[];
}

export interface OddOneOutPrompt extends BasePrompt {
  kind: "odd_one_out";
  options: string[];
  oddIndex: number;
  categoryHint?: string;
}

export interface RegisterSwapPrompt extends BasePrompt {
  kind: "register_swap";
  familierText: string;
  acceptedSoutenuAnswers: string[];
}

export type ExercisePrompt =
  | McqPrompt
  | ListeningPrompt
  | DictationPrompt
  | WordBankPrompt
  | FreeTranslationPrompt
  | ClozePrompt
  | GenderDrillPrompt
  | ConjugationDrillPrompt
  | MatchingPairsPrompt
  | SpeakingPrompt
  | SentenceOrderingPrompt
  | ReadingComprehensionPrompt
  | OddOneOutPrompt
  | RegisterSwapPrompt;

/** XP base value per PLAN.md §5 — hard types earn 15, the rest 10. */
export const HARD_EXERCISE_KINDS: ReadonlySet<ExerciseKind> = new Set([
  "dictation",
  "free_translation",
  "speaking",
  "register_swap",
  "sentence_ordering",
]);
