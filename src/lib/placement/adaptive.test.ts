import { describe, expect, it } from "vitest";
import {
  CEFR_LEVELS,
  INITIAL_ADAPTIVE_STATE,
  levelIndexToCefr,
  nextAdaptiveState,
  PLACEMENT_START_LEVEL_INDEX,
} from "./adaptive";

describe("nextAdaptiveState", () => {
  it("does not bump on a single correct answer", () => {
    const next = nextAdaptiveState(INITIAL_ADAPTIVE_STATE, true);
    expect(next.levelIndex).toBe(PLACEMENT_START_LEVEL_INDEX);
    expect(next.streakCorrect).toBe(1);
  });

  it("bumps up a level after two consecutive correct answers", () => {
    const s1 = nextAdaptiveState(INITIAL_ADAPTIVE_STATE, true);
    const s2 = nextAdaptiveState(s1, true);
    expect(s2.levelIndex).toBe(PLACEMENT_START_LEVEL_INDEX + 1);
    expect(s2.streakCorrect).toBe(0);
    expect(s2.streakIncorrect).toBe(0);
  });

  it("bumps down a level after two consecutive incorrect answers", () => {
    const s1 = nextAdaptiveState(INITIAL_ADAPTIVE_STATE, false);
    const s2 = nextAdaptiveState(s1, false);
    expect(s2.levelIndex).toBe(PLACEMENT_START_LEVEL_INDEX - 1);
  });

  it("never goes above the top level (C1, index 4)", () => {
    let state = { levelIndex: CEFR_LEVELS.length - 1, streakCorrect: 0, streakIncorrect: 0 };
    state = nextAdaptiveState(state, true);
    state = nextAdaptiveState(state, true);
    expect(state.levelIndex).toBe(CEFR_LEVELS.length - 1);
  });

  it("never goes below the bottom level (A1, index 0)", () => {
    let state = { levelIndex: 0, streakCorrect: 0, streakIncorrect: 0 };
    state = nextAdaptiveState(state, false);
    state = nextAdaptiveState(state, false);
    expect(state.levelIndex).toBe(0);
  });

  it("an incorrect answer resets a correct streak without bumping", () => {
    const s1 = nextAdaptiveState(INITIAL_ADAPTIVE_STATE, true);
    const s2 = nextAdaptiveState(s1, false);
    expect(s2.levelIndex).toBe(PLACEMENT_START_LEVEL_INDEX);
    expect(s2.streakCorrect).toBe(0);
    expect(s2.streakIncorrect).toBe(1);
  });

  it("a correct answer resets an incorrect streak without bumping", () => {
    const s1 = nextAdaptiveState(INITIAL_ADAPTIVE_STATE, false);
    const s2 = nextAdaptiveState(s1, true);
    expect(s2.levelIndex).toBe(PLACEMENT_START_LEVEL_INDEX);
    expect(s2.streakIncorrect).toBe(0);
    expect(s2.streakCorrect).toBe(1);
  });
});

describe("levelIndexToCefr", () => {
  it("maps in-range indices to the matching CEFR level", () => {
    expect(levelIndexToCefr(0)).toBe("A1");
    expect(levelIndexToCefr(4)).toBe("C1");
    expect(levelIndexToCefr(2)).toBe("B1");
  });

  it("clamps out-of-range indices", () => {
    expect(levelIndexToCefr(-1)).toBe("A1");
    expect(levelIndexToCefr(99)).toBe("C1");
  });
});
