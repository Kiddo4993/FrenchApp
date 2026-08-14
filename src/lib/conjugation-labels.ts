import type { Person, Tense } from "@/lib/conjugation";

/**
 * Display labels for the conjugation reference table + trainer. Mirrors the private
 * PERSON_LABELS/TENSE_LABELS maps inside src/lib/exercises/generate.ts (used to phrase a single
 * randomly-drilled conjugation_drill prompt inside real lessons) — that module doesn't export
 * them, and this is a separate, standalone-practice UI, so the small duplication is kept local
 * here rather than exporting internals of an unrelated module for one shared constant.
 */
export const PERSON_LABELS: Record<Person, string> = {
  "1s": "je",
  "2s": "tu",
  "3s": "il / elle / on",
  "1p": "nous",
  "2p": "vous",
  "3p": "ils / elles",
};

export const TENSE_LABELS: Record<Tense, string> = {
  present: "Présent",
  passe_compose: "Passé composé",
  imparfait: "Imparfait",
  futur_simple: "Futur simple",
  conditionnel_present: "Conditionnel présent",
  subjonctif_present: "Subjonctif présent",
  plus_que_parfait: "Plus-que-parfait",
  imperatif: "Impératif",
};
