import { describe, expect, it } from "vitest";
import {
  canRepairStreak,
  daysBetween,
  isStreakBroken,
  recordActivity,
  repairStreak,
  type StreakState,
} from "./streaks";

function freshState(overrides: Partial<StreakState> = {}): StreakState {
  return {
    currentStreak: 0,
    longestStreak: 0,
    freezesAvailable: 0,
    lastActiveDate: null,
    weekendAmuletActive: false,
    ...overrides,
  };
}

describe("daysBetween", () => {
  it("counts whole days between two YYYY-MM-DD dates", () => {
    expect(daysBetween("2026-01-01", "2026-01-02")).toBe(1);
    expect(daysBetween("2026-01-01", "2026-01-08")).toBe(7);
    expect(daysBetween("2026-01-01", "2026-01-01")).toBe(0);
  });
});

describe("recordActivity", () => {
  it("first-ever activity starts a streak of 1", () => {
    const result = recordActivity(freshState(), "2026-01-01");
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(1);
  });

  it("is a no-op if called again for the same day", () => {
    const day1 = recordActivity(freshState(), "2026-01-01");
    const sameDay = recordActivity(day1, "2026-01-01");
    expect(sameDay).toEqual(day1);
  });

  it("consecutive days increment the streak", () => {
    let state = recordActivity(freshState(), "2026-01-01");
    state = recordActivity(state, "2026-01-02");
    state = recordActivity(state, "2026-01-03");
    expect(state.currentStreak).toBe(3);
    expect(state.longestStreak).toBe(3);
  });

  it("a gap of 2+ days with no freeze and no weekend amulet resets the streak to 1", () => {
    let state = recordActivity(freshState(), "2026-01-01");
    state = recordActivity(state, "2026-01-05");
    expect(state.currentStreak).toBe(1);
  });

  it("a single missed day is auto-protected by a freeze, which gets consumed", () => {
    let state = recordActivity(freshState({ freezesAvailable: 1 }), "2026-01-01");
    // 2026-01-01 is a Thursday; skip Friday, come back Saturday (gap of 2, not a weekend-only gap)
    state = recordActivity(state, "2026-01-03");
    expect(state.currentStreak).toBe(2);
    expect(state.freezesAvailable).toBe(0);
  });

  it("earns a freeze every 7-day streak, capped at 2", () => {
    let state = recordActivity(freshState(), "2026-01-01");
    for (let i = 2; i <= 7; i++) {
      state = recordActivity(state, `2026-01-0${i}`);
    }
    expect(state.currentStreak).toBe(7);
    expect(state.freezesAvailable).toBe(1);
  });

  it("weekend amulet lets a Friday->Monday gap continue the streak", () => {
    // 2026-01-02 is a Friday.
    let state = recordActivity(freshState({ weekendAmuletActive: true }), "2026-01-02");
    state = recordActivity(state, "2026-01-05"); // Monday
    expect(state.currentStreak).toBe(2);
  });
});

describe("isStreakBroken / canRepairStreak / repairStreak", () => {
  it("is not broken the day after activity (gap of 1, still within the day)", () => {
    const state = recordActivity(freshState(), "2026-01-01");
    expect(isStreakBroken(state, "2026-01-02")).toBe(false);
  });

  it("is broken after a 2-day gap with no freeze and no weekend protection, and is repairable", () => {
    const state = recordActivity(freshState(), "2026-01-01");
    expect(isStreakBroken(state, "2026-01-03")).toBe(true);
    expect(canRepairStreak(state, "2026-01-03")).toBe(true);
  });

  it("is unrecoverably broken (not repairable) after a 3+ day gap", () => {
    const state = recordActivity(freshState(), "2026-01-01");
    expect(isStreakBroken(state, "2026-01-05")).toBe(true);
    expect(canRepairStreak(state, "2026-01-05")).toBe(false);
  });

  it("repairStreak restores the streak as if the missed day never happened", () => {
    let state = recordActivity(freshState(), "2026-01-01");
    state = recordActivity(state, "2026-01-02");
    // state.currentStreak === 2, then two days pass with no activity
    const repaired = repairStreak(state, "2026-01-04");
    expect(repaired.currentStreak).toBe(3);
    expect(repaired.lastActiveDate).toBe("2026-01-04");
  });

  it("repairStreak is a no-op outside the repair window", () => {
    const state = recordActivity(freshState(), "2026-01-01");
    const unchanged = repairStreak(state, "2026-01-01");
    expect(unchanged).toEqual(state);
  });
});
