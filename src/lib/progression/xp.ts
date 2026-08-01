import { HARD_EXERCISE_KINDS, type ExerciseKind } from "@/types/exercise";

const BASE_XP = 10;
const HARD_XP = 15;
const PERFECT_LESSON_MULTIPLIER = 2;

/** No XP for a wrong answer — XP rewards demonstrated recall, not just exposure. */
export function xpForExercise(kind: ExerciseKind, correct: boolean): number {
  if (!correct) return 0;
  return HARD_EXERCISE_KINDS.has(kind) ? HARD_XP : BASE_XP;
}

export function xpForLesson(results: { kind: ExerciseKind; correct: boolean }[]): number {
  const raw = results.reduce((sum, r) => sum + xpForExercise(r.kind, r.correct), 0);
  const isPerfect = results.length > 0 && results.every((r) => r.correct);
  return isPerfect ? raw * PERFECT_LESSON_MULTIPLIER : raw;
}

/** PLAN.md §5: cumulative XP required to reach level n+1. */
export function xpForLevel(n: number): number {
  return Math.round(100 * n ** 1.5);
}

export function levelForTotalXp(totalXp: number): number {
  let level = 1;
  while (totalXp >= xpForLevel(level)) level++;
  return level;
}

export interface XpProgress {
  level: number;
  xpIntoLevel: number;
  xpNeededForLevel: number;
  totalXp: number;
}

export function xpProgress(totalXp: number): XpProgress {
  const level = levelForTotalXp(totalXp);
  const floor = level === 1 ? 0 : xpForLevel(level - 1);
  const ceiling = xpForLevel(level);
  return { level, xpIntoLevel: totalXp - floor, xpNeededForLevel: ceiling - floor, totalXp };
}

export const DAILY_GOAL_PRESETS = {
  casual: 20,
  regular: 50,
  serious: 100,
  intense: 200,
} as const;
