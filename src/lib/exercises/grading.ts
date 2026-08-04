import type { Track } from "@/lib/srs";
import type { ExerciseKind } from "@/types/exercise";

/**
 * Maps each exercise kind to the SRS track it exercises. Kinds mapped to `null` are batch or
 * curated-content exercises (matching_pairs, reading_comprehension, odd_one_out, register_swap,
 * conjugation_drill) that don't tie back to a single vocab card — they still earn XP but don't
 * feed the FSRS scheduler. See DECISIONS.md.
 */
export const KIND_TO_TRACK: Record<ExerciseKind, Track | null> = {
  mcq_recognition: "recognition",
  mcq_production: "production",
  listening: "listening",
  dictation: "spelling",
  word_bank: "production",
  free_translation: "production",
  cloze: "production",
  gender_drill: "recognition",
  conjugation_drill: null,
  matching_pairs: null,
  speaking: "production",
  sentence_ordering: "production",
  reading_comprehension: null,
  odd_one_out: null,
  register_swap: null,
};

export function trackForKind(kind: ExerciseKind): Track | null {
  return KIND_TO_TRACK[kind];
}
