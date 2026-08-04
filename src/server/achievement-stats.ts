import "server-only";
import { and, desc, eq, ne } from "drizzle-orm";
import { db } from "@/db/client";
import * as schema from "@/db/schema";
import type { AchievementStats } from "@/lib/achievements/evaluate";
import { PROFILE_ID } from "./queries";

const LATE_NIGHT_HOURS = new Set([0, 1, 2, 3]);
const DAWN_HOURS = new Set([4, 5]);

async function countExerciseEvents(kind: string, correctOnly: boolean): Promise<number> {
  const rows = await db
    .select({ id: schema.exerciseEvents.id, correct: schema.exerciseEvents.correct })
    .from(schema.exerciseEvents)
    .where(eq(schema.exerciseEvents.kind, kind as never));
  return correctOnly ? rows.filter((r) => r.correct).length : rows.length;
}

async function getLeechClearedCount(): Promise<number> {
  const leechCards = await db.select().from(schema.cards).where(eq(schema.cards.isLeech, true));
  let cleared = 0;
  for (const card of leechCards) {
    const [latest] = await db
      .select()
      .from(schema.reviewLogs)
      .where(eq(schema.reviewLogs.cardId, card.id))
      .orderBy(desc(schema.reviewLogs.ts))
      .limit(1);
    if (latest && (latest.grade === "good" || latest.grade === "easy")) cleared++;
  }
  return cleared;
}

async function getConsecutiveWeekendSessions(): Promise<number> {
  const logs = await db
    .select()
    .from(schema.sessionLogs)
    .orderBy(desc(schema.sessionLogs.date));
  let count = 0;
  for (const log of logs) {
    if (log.exercisesCompleted <= 0) break;
    const day = new Date(`${log.date}T00:00:00Z`).getUTCDay();
    if (day !== 0 && day !== 6) break;
    count++;
  }
  return count;
}

export async function computeAchievementStats(): Promise<AchievementStats> {
  const [userStats, profile, unitProgressRows, lessonProgressRows, cardRows, exerciseEventRows, placement] =
    await Promise.all([
      db.select().from(schema.userStats).where(eq(schema.userStats.id, PROFILE_ID)),
      db.select().from(schema.profile).where(eq(schema.profile.id, PROFILE_ID)),
      db.select().from(schema.unitProgress),
      db.select().from(schema.lessonProgress),
      db.select().from(schema.cards).where(ne(schema.cards.state, "new")),
      db.select().from(schema.exerciseEvents),
      db.select().from(schema.placementResult),
    ]);

  const stats = userStats[0];
  const prof = profile[0];

  const wordsKnown = new Set(cardRows.map((c) => c.vocabId).filter(Boolean)).size;
  const unitsMastered = unitProgressRows.filter((u) => u.status === "gold").length;
  const perfectLessons = lessonProgressRows.filter((l) => l.bestAccuracy === 1).length;

  const hours = exerciseEventRows.map((e) => new Date(e.ts).getUTCHours());
  const studiedAfterMidnight = hours.some((h) => LATE_NIGHT_HOURS.has(h));
  const studiedBeforeDawn = hours.some((h) => DAWN_HOURS.has(h));

  const passedBossTests = unitProgressRows
    .filter((u) => u.bossScore !== null && u.bossScore !== undefined)
    .map((u) => ({ unitSlug: u.unitId, score: u.bossScore as number }));

  const [verbDrillsCompleted, speakingExercises, dictationExercises, registerSwaps, leechesCleared, consecutiveWeekendSessions] =
    await Promise.all([
      countExerciseEvents("conjugation_drill", true),
      countExerciseEvents("speaking", true),
      countExerciseEvents("dictation", true),
      countExerciseEvents("register_swap", true),
      getLeechClearedCount(),
      getConsecutiveWeekendSessions(),
    ]);

  return {
    wordsKnown,
    verbDrillsCompleted,
    perfectLessons,
    currentStreak: stats?.currentStreak ?? 0,
    studiedAfterMidnight,
    studiedBeforeDawn,
    passedBossTests,
    unitsMastered,
    reviewsCompleted: exerciseEventRows.length,
    leechesCleared,
    level: stats?.level ?? 1,
    speakingExercises,
    dictationExercises,
    registerSwaps,
    consecutiveWeekendSessions,
    placementTestDone: Boolean(prof?.placementDone) || placement.length > 0,
  };
}
