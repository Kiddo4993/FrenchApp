import type { ExerciseKind } from "@/types/exercise";

/** All 14 exercise kinds, in the order they're drawn on the accuracy radar. */
export const EXERCISE_KINDS: readonly ExerciseKind[] = [
  "mcq_recognition",
  "mcq_production",
  "listening",
  "dictation",
  "word_bank",
  "free_translation",
  "cloze",
  "gender_drill",
  "conjugation_drill",
  "matching_pairs",
  "speaking",
  "sentence_ordering",
  "reading_comprehension",
  "odd_one_out",
  "register_swap",
];

/** Short French labels for radar-axis / legend display. */
export const EXERCISE_KIND_LABELS: Record<ExerciseKind, string> = {
  mcq_recognition: "QCM reconnaissance",
  mcq_production: "QCM production",
  listening: "Écoute",
  dictation: "Dictée",
  word_bank: "Banque de mots",
  free_translation: "Traduction libre",
  cloze: "Texte à trous",
  gender_drill: "Genre (le/la)",
  conjugation_drill: "Conjugaison",
  matching_pairs: "Association",
  speaking: "Expression orale",
  sentence_ordering: "Ordre des mots",
  reading_comprehension: "Compréhension écrite",
  odd_one_out: "Intrus",
  register_swap: "Registre",
};

export const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1"] as const;
export type CefrLevel = (typeof CEFR_LEVELS)[number];

/** Fixed hue order for CEFR levels — reuses the app's existing chart-1..5 tokens (see globals.css). */
export const CEFR_COLORS: Record<CefrLevel, string> = {
  A1: "var(--chart-1)",
  A2: "var(--chart-2)",
  B1: "var(--chart-3)",
  B2: "var(--chart-4)",
  C1: "var(--chart-5)",
};
