export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  freezesAvailable: number;
  /** YYYY-MM-DD, null before the learner's first-ever activity */
  lastActiveDate: string | null;
  weekendAmuletActive: boolean;
}

const MAX_FREEZES = 2;
const FREEZE_EARN_INTERVAL = 7;
const MS_PER_DAY = 86_400_000;

function parseDate(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00Z`);
}

export function daysBetween(a: string, b: string): number {
  return Math.round((parseDate(b).getTime() - parseDate(a).getTime()) / MS_PER_DAY);
}

/** true if every date strictly between `from` and `to` (exclusive both ends) is Sat/Sun */
function gapIsAllWeekend(from: string, to: string): boolean {
  const start = parseDate(from).getTime();
  const end = parseDate(to).getTime();
  for (let t = start + MS_PER_DAY; t < end; t += MS_PER_DAY) {
    const day = new Date(t).getUTCDay();
    if (day !== 0 && day !== 6) return false;
  }
  return true;
}

/**
 * Call once per day the learner earns any XP. Idempotent for repeat calls on the same day.
 * Handles same-day no-op, consecutive-day increment, weekend-amulet-protected gaps, and
 * freeze-protected single-day misses; anything else resets the streak to 1.
 */
export function recordActivity(state: StreakState, today: string): StreakState {
  if (state.lastActiveDate === today) return state;

  let currentStreak: number;
  let freezesAvailable = state.freezesAvailable;

  if (!state.lastActiveDate) {
    currentStreak = 1;
  } else {
    const gap = daysBetween(state.lastActiveDate, today);
    if (gap === 1) {
      currentStreak = state.currentStreak + 1;
    } else if (gap > 1 && state.weekendAmuletActive && gapIsAllWeekend(state.lastActiveDate, today)) {
      currentStreak = state.currentStreak + 1;
    } else if (gap === 2 && freezesAvailable > 0) {
      freezesAvailable -= 1;
      currentStreak = state.currentStreak + 1;
    } else {
      currentStreak = 1;
    }
  }

  if (currentStreak % FREEZE_EARN_INTERVAL === 0 && freezesAvailable < MAX_FREEZES) {
    freezesAvailable += 1;
  }

  return {
    currentStreak,
    longestStreak: Math.max(state.longestStreak, currentStreak),
    freezesAvailable,
    lastActiveDate: today,
    weekendAmuletActive: state.weekendAmuletActive,
  };
}

/** True if, without today's activity being recorded, the streak is unrecoverably lost. */
export function isStreakBroken(state: StreakState, today: string): boolean {
  if (!state.lastActiveDate) return false;
  const gap = daysBetween(state.lastActiveDate, today);
  if (gap <= 1) return false;
  if (gap > 2) return true;
  const weekendProtected = state.weekendAmuletActive && gapIsAllWeekend(state.lastActiveDate, today);
  return state.freezesAvailable === 0 && !weekendProtected;
}

/** True during the 24h window after exactly one missed day, before it's permanently lost. */
export function canRepairStreak(state: StreakState, today: string): boolean {
  if (!state.lastActiveDate) return false;
  return daysBetween(state.lastActiveDate, today) === 2 && isStreakBroken(state, today);
}

export function repairStreak(state: StreakState, today: string): StreakState {
  if (!canRepairStreak(state, today)) return state;
  const restored = state.currentStreak + 1;
  return {
    ...state,
    currentStreak: restored,
    longestStreak: Math.max(state.longestStreak, restored),
    lastActiveDate: today,
  };
}
