import { describe, expect, it } from "vitest";
import {
  levelForTotalXp,
  xpForExercise,
  xpForLesson,
  xpForLevel,
  xpProgress,
} from "./xp";

describe("xpForExercise", () => {
  it("awards 0 XP for a wrong answer regardless of type", () => {
    expect(xpForExercise("mcq_recognition", false)).toBe(0);
    expect(xpForExercise("dictation", false)).toBe(0);
  });

  it("awards base XP for a correct easy-type exercise", () => {
    expect(xpForExercise("mcq_recognition", true)).toBe(10);
  });

  it("awards more XP for a correct hard-type exercise", () => {
    expect(xpForExercise("dictation", true)).toBe(15);
    expect(xpForExercise("free_translation", true)).toBe(15);
    expect(xpForExercise("speaking", true)).toBe(15);
  });
});

describe("xpForLesson", () => {
  it("sums per-exercise XP for a non-perfect lesson", () => {
    const results = [
      { kind: "mcq_recognition" as const, correct: true },
      { kind: "mcq_recognition" as const, correct: false },
      { kind: "dictation" as const, correct: true },
    ];
    expect(xpForLesson(results)).toBe(10 + 0 + 15);
  });

  it("doubles the total when every exercise in the lesson is correct", () => {
    const results = [
      { kind: "mcq_recognition" as const, correct: true },
      { kind: "dictation" as const, correct: true },
    ];
    expect(xpForLesson(results)).toBe((10 + 15) * 2);
  });

  it("returns 0 for an empty lesson", () => {
    expect(xpForLesson([])).toBe(0);
  });
});

describe("xpForLevel / levelForTotalXp", () => {
  it("matches the PLAN.md formula xpForLevel(n) = 100 * n^1.5", () => {
    expect(xpForLevel(1)).toBe(100);
    expect(xpForLevel(4)).toBe(800);
  });

  it("is monotonically increasing", () => {
    for (let n = 1; n < 50; n++) {
      expect(xpForLevel(n + 1)).toBeGreaterThan(xpForLevel(n));
    }
  });

  it("a learner with 0 XP is level 1", () => {
    expect(levelForTotalXp(0)).toBe(1);
  });

  it("crossing xpForLevel(n) advances exactly one level", () => {
    const threshold = xpForLevel(1);
    expect(levelForTotalXp(threshold - 1)).toBe(1);
    expect(levelForTotalXp(threshold)).toBe(2);
  });
});

describe("xpProgress", () => {
  it("reports progress within the current level band", () => {
    const progress = xpProgress(150);
    expect(progress.level).toBe(2);
    expect(progress.xpIntoLevel).toBe(150 - xpForLevel(1));
    expect(progress.xpNeededForLevel).toBe(xpForLevel(2) - xpForLevel(1));
  });

  it("starts at 0/100 for a brand-new learner", () => {
    const progress = xpProgress(0);
    expect(progress).toMatchObject({ level: 1, xpIntoLevel: 0, xpNeededForLevel: 100 });
  });
});
