/**
 * Placement test (PLAN.md §3): a 20-question adaptive MCQ test that starts at A2 and branches the
 * running difficulty up/down based on the last two answers, then maps the level it settles on to a
 * recommended starting unit. This module is the pure branching logic — no DB/React here, see
 * src/components/placement/PlacementRunner.tsx for the interactive flow and
 * src/server/placement-queries.ts for the vocab pools it draws questions from.
 */

export const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1"] as const;
export type Cefr = (typeof CEFR_LEVELS)[number];

/** Index into CEFR_LEVELS the test starts at — A2, per PLAN.md §3. */
export const PLACEMENT_START_LEVEL_INDEX = 1;
export const PLACEMENT_QUESTION_COUNT = 20;
const BUMP_THRESHOLD = 2;

export interface AdaptiveState {
  levelIndex: number;
  streakCorrect: number;
  streakIncorrect: number;
}

export const INITIAL_ADAPTIVE_STATE: AdaptiveState = {
  levelIndex: PLACEMENT_START_LEVEL_INDEX,
  streakCorrect: 0,
  streakIncorrect: 0,
};

/**
 * Two consecutive correct answers bump the difficulty up a CEFR level (max C1); two consecutive
 * incorrect answers bump it down (min A1). A bump resets both streak counters so the next bump
 * requires two more consecutive answers, not a single leftover streak.
 */
export function nextAdaptiveState(prev: AdaptiveState, correct: boolean): AdaptiveState {
  if (correct) {
    const streakCorrect = prev.streakCorrect + 1;
    if (streakCorrect >= BUMP_THRESHOLD) {
      return {
        levelIndex: Math.min(CEFR_LEVELS.length - 1, prev.levelIndex + 1),
        streakCorrect: 0,
        streakIncorrect: 0,
      };
    }
    return { ...prev, streakCorrect, streakIncorrect: 0 };
  }
  const streakIncorrect = prev.streakIncorrect + 1;
  if (streakIncorrect >= BUMP_THRESHOLD) {
    return {
      levelIndex: Math.max(0, prev.levelIndex - 1),
      streakCorrect: 0,
      streakIncorrect: 0,
    };
  }
  return { ...prev, streakIncorrect, streakCorrect: 0 };
}

export function levelIndexToCefr(levelIndex: number): Cefr {
  return CEFR_LEVELS[Math.min(CEFR_LEVELS.length - 1, Math.max(0, levelIndex))];
}
