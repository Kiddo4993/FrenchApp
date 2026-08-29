import "server-only";
import { desc, eq, ne } from "drizzle-orm";
import { db } from "@/db/client";
import * as schema from "@/db/schema";
import type { AchievementStats } from "@/lib/achievements/evaluate";
import { PROFILE_ID } from "./queries";

const LATE_NIGHT_HOURS = new Set([0, 1, 2, 3]);
const DAWN_HOURS = new Set([4, 5]);

/**
 * Was one query per leech card (`WHERE cardId = ? ORDER BY ts DESC LIMIT 1`, N+1) inside a loop —
 * this runs after every lesson/review finalize plus on every /succes load. Fetch every leech
 * card's logs in one batched query, reduce to "latest per card" in memory instead. Caught by
 * code review.
 */
async function getLeechClearedCount(leechCards: (typeof schema.cards.$inferSelect)[]): Promise<number> {
  if (leechCards.length === 0) return 0;
  const leechCardIds = new Set(leechCards.map((c) => c.id));
  const allLogs = await db.select().from(schema.reviewLogs).orderBy(desc(schema.reviewLogs.ts));
  const latestByCard = new Map<string, (typeof allLogs)[number]>();
  for (const log of allLogs) {
    if (!leechCardIds.has(log.cardId) || latestByCard.has(log.cardId)) continue;
    latestByCard.set(log.cardId, log); // first hit per card = latest, since allLogs is DESC by ts
  }
  let cleared = 0;
  for (const latest of latestByCard.values()) {
    if (latest.grade === "good" || latest.grade === "easy") cleared++;
  }
  return cleared;
}

function getConsecutiveWeekendSessions(logsDesc: (typeof schema.sessionLogs.$inferSelect)[]): number {
  let count = 0;
  for (const log of logsDesc) {
    if (log.exercisesCompleted <= 0) break;
    const day = new Date(`${log.date}T00:00:00Z`).getUTCDay();
    if (day !== 0 && day !== 6) break;
    count++;
  }
  return count;
}

export async function computeAchievementStats(): Promise<AchievementStats> {
  const [userStats, profile, unitProgressRows, lessonProgressRows, cardRows, exerciseEventRows, placement, leechCards, sessionLogsDesc] =
    await Promise.all([
      db.select().from(schema.userStats).where(eq(schema.userStats.id, PROFILE_ID)),
      db.select().from(schema.profile).where(eq(schema.profile.id, PROFILE_ID)),
      db.select().from(schema.unitProgress),
      db.select().from(schema.lessonProgress),
      db.select().from(schema.cards).where(ne(schema.cards.state, "new")),
      db.select().from(schema.exerciseEvents),
      db.select().from(schema.placementResult),
      db.select().from(schema.cards).where(eq(schema.cards.isLeech, true)),
      db.select().from(schema.sessionLogs).orderBy(desc(schema.sessionLogs.date)),
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

  // exerciseEventRows is already the full table — count kinds in memory instead of one more
  // `WHERE kind = ?` query per kind (was 4 extra full-table queries on top of the one above).
  const countCorrectByKind = (kind: string) =>
    exerciseEventRows.filter((e) => e.kind === kind && e.correct).length;

  const leechesCleared = await getLeechClearedCount(leechCards);

  return {
    wordsKnown,
    verbDrillsCompleted: countCorrectByKind("conjugation_drill"),
    perfectLessons,
    currentStreak: stats?.currentStreak ?? 0,
    studiedAfterMidnight,
    studiedBeforeDawn,
    passedBossTests,
    unitsMastered,
    reviewsCompleted: exerciseEventRows.length,
    leechesCleared,
    level: stats?.level ?? 1,
    speakingExercises: countCorrectByKind("speaking"),
    dictationExercises: countCorrectByKind("dictation"),
    registerSwaps: countCorrectByKind("register_swap"),
    consecutiveWeekendSessions: getConsecutiveWeekendSessions(sessionLogsDesc),
    placementTestDone: Boolean(prof?.placementDone) || placement.length > 0,
  };
}
