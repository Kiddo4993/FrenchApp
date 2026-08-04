import { describe, expect, it } from "vitest";
import { evaluateCriteria, findNewlyUnlocked, type AchievementStats } from "./evaluate";

function stats(overrides: Partial<AchievementStats> = {}): AchievementStats {
  return {
    wordsKnown: 0,
    verbDrillsCompleted: 0,
    perfectLessons: 0,
    currentStreak: 0,
    studiedAfterMidnight: false,
    studiedBeforeDawn: false,
    passedBossTests: [],
    unitsMastered: 0,
    reviewsCompleted: 0,
    leechesCleared: 0,
    level: 1,
    speakingExercises: 0,
    dictationExercises: 0,
    registerSwaps: 0,
    consecutiveWeekendSessions: 0,
    placementTestDone: false,
    ...overrides,
  };
}

describe("evaluateCriteria", () => {
  it("words_known passes at or above the threshold", () => {
    expect(evaluateCriteria({ type: "words_known", count: 500 }, stats({ wordsKnown: 500 }))).toBe(true);
    expect(evaluateCriteria({ type: "words_known", count: 500 }, stats({ wordsKnown: 499 }))).toBe(false);
  });

  it("boss_passed requires matching unit slug and minimum score", () => {
    const criteria = { type: "boss_passed" as const, unitSlug: "il-faut-que", minScore: 0.9 };
    expect(
      evaluateCriteria(criteria, stats({ passedBossTests: [{ unitSlug: "il-faut-que", score: 0.92 }] })),
    ).toBe(true);
    expect(
      evaluateCriteria(criteria, stats({ passedBossTests: [{ unitSlug: "il-faut-que", score: 0.8 }] })),
    ).toBe(false);
    expect(
      evaluateCriteria(criteria, stats({ passedBossTests: [{ unitSlug: "hier", score: 0.95 }] })),
    ).toBe(false);
  });

  it("boolean criteria read straight off the stats flags", () => {
    expect(evaluateCriteria({ type: "studied_after_midnight" }, stats({ studiedAfterMidnight: true }))).toBe(true);
    expect(evaluateCriteria({ type: "studied_after_midnight" }, stats())).toBe(false);
    expect(evaluateCriteria({ type: "placement_test_done" }, stats({ placementTestDone: true }))).toBe(true);
  });

  it("topics_at_full_recall is reserved and always false for now", () => {
    expect(evaluateCriteria({ type: "topics_at_full_recall", count: 1 }, stats({ wordsKnown: 99999 }))).toBe(false);
  });
});

describe("findNewlyUnlocked", () => {
  const achievements = [
    { slug: "a", criteria: { type: "words_known" as const, count: 10 } },
    { slug: "b", criteria: { type: "streak_days" as const, count: 7 } },
  ];

  it("returns only newly-met achievements not already unlocked", () => {
    const result = findNewlyUnlocked(achievements, stats({ wordsKnown: 20, currentStreak: 7 }), new Set(["a"]));
    expect(result).toEqual(["b"]);
  });

  it("returns an empty list when nothing new is met", () => {
    const result = findNewlyUnlocked(achievements, stats(), new Set());
    expect(result).toEqual([]);
  });
});
