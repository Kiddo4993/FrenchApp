import type { AchievementCriteria } from "@/content/achievements";

/** Aggregate counters the evaluator checks criteria against. Callers assemble this from the DB. */
export interface AchievementStats {
  wordsKnown: number;
  verbDrillsCompleted: number;
  perfectLessons: number;
  currentStreak: number;
  studiedAfterMidnight: boolean;
  studiedBeforeDawn: boolean;
  passedBossTests: { unitSlug: string; score: number }[];
  unitsMastered: number;
  reviewsCompleted: number;
  leechesCleared: number;
  level: number;
  speakingExercises: number;
  dictationExercises: number;
  registerSwaps: number;
  consecutiveWeekendSessions: number;
  placementTestDone: boolean;
}

export function evaluateCriteria(criteria: AchievementCriteria, stats: AchievementStats): boolean {
  switch (criteria.type) {
    case "words_known":
      return stats.wordsKnown >= criteria.count;
    case "verb_drills":
      return stats.verbDrillsCompleted >= criteria.count;
    case "perfect_lessons":
      return stats.perfectLessons >= criteria.count;
    case "streak_days":
      return stats.currentStreak >= criteria.count;
    case "studied_after_midnight":
      return stats.studiedAfterMidnight;
    case "studied_before_dawn":
      return stats.studiedBeforeDawn;
    case "boss_passed":
      return stats.passedBossTests.some(
        (b) => b.unitSlug === criteria.unitSlug && b.score >= criteria.minScore,
      );
    case "units_mastered":
      return stats.unitsMastered >= criteria.count;
    case "reviews_completed":
      return stats.reviewsCompleted >= criteria.count;
    case "leeches_cleared":
      return stats.leechesCleared >= criteria.count;
    case "levels_reached":
      return stats.level >= criteria.level;
    case "topics_at_full_recall":
      return false; // requires per-topic recall aggregation not yet tracked; reserved for a future pass
    case "speaking_exercises":
      return stats.speakingExercises >= criteria.count;
    case "dictation_exercises":
      return stats.dictationExercises >= criteria.count;
    case "register_swaps":
      return stats.registerSwaps >= criteria.count;
    case "weekend_sessions":
      return stats.consecutiveWeekendSessions >= criteria.count;
    case "placement_test_done":
      return stats.placementTestDone;
  }
}

/** Returns the slugs of achievements whose criteria are met now but weren't in `alreadyUnlocked`. */
export function findNewlyUnlocked(
  achievements: { slug: string; criteria: AchievementCriteria }[],
  stats: AchievementStats,
  alreadyUnlocked: ReadonlySet<string>,
): string[] {
  return achievements
    .filter((a) => !alreadyUnlocked.has(a.slug) && evaluateCriteria(a.criteria, stats))
    .map((a) => a.slug);
}
