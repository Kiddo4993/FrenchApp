import { describe, expect, it } from "vitest";
import { calendarDay } from "./dates";
import { recordActivity, type StreakState } from "./progression/streaks";

describe("calendarDay", () => {
  it("uses the given time zone, not UTC", () => {
    // 7 PM on Oct 2 in Vancouver is already Oct 3 in UTC.
    expect(calendarDay(new Date("2026-10-03T02:00:00Z"), "America/Vancouver")).toBe("2026-10-02");
    expect(calendarDay(new Date("2026-10-03T02:00:00Z"), "UTC")).toBe("2026-10-03");
  });

  it("falls back to UTC for an unknown time zone instead of crashing", () => {
    expect(calendarDay(new Date("2026-10-03T02:00:00Z"), "Not/AZone")).toBe("2026-10-03");
  });

  it("keeps a streak for someone who studies every evening in Vancouver", () => {
    let state: StreakState = { currentStreak: 0, longestStreak: 0, freezesAvailable: 0, lastActiveDate: null, weekendAmuletActive: false };
    for (const instant of ["2026-09-29T01:00:00Z", "2026-09-29T22:00:00Z", "2026-10-01T03:00:00Z"]) {
      // Mon 6 PM, Tue 3 PM, Wed 8 PM Pacific
      state = recordActivity(state, calendarDay(new Date(instant), "America/Vancouver"));
    }
    expect(state.currentStreak).toBe(3);
  });
});
