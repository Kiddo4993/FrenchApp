"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import * as schema from "@/db/schema";
import { ACHIEVEMENTS } from "@/content/achievements";
import { UNITS_SORTED, unitGlobalOrder } from "@/content/curriculum";
import { findNewlyUnlocked } from "@/lib/achievements/evaluate";
import { trackForKind } from "@/lib/exercises/grading";
import { xpForLesson, levelForTotalXp } from "@/lib/progression/xp";
import { recordActivity, type StreakState } from "@/lib/progression/streaks";
import { inferGrade, newCardSnapshot, scheduleReview } from "@/lib/srs";
import type { CardSnapshot } from "@/lib/srs/types";
import type { ExerciseKind } from "@/types/exercise";
import { computeAchievementStats } from "./achievement-stats";
import { PROFILE_ID } from "./queries";

function todayStr(now: Date): string {
  return now.toISOString().slice(0, 10);
}

function rowToSnapshot(row: typeof schema.cards.$inferSelect): CardSnapshot {
  return {
    state: row.state,
    stability: row.stability,
    difficulty: row.difficulty,
    retrievability: row.retrievability,
    reps: row.reps,
    lapses: row.lapses,
    lastReview: row.lastReview,
    dueDate: row.dueDate,
    isLeech: row.isLeech,
  };
}

/**
 * Grades one exercise: logs it (for achievements/dashboard) and, for kinds that map to an SRS
 * track, updates the FSRS card. Called once per exercise as the learner finishes it — XP/streak/
 * progress are settled once at lesson end by `finalizeLessonSession`, not per exercise.
 */
export async function submitExerciseResult(input: {
  lessonId: string;
  cardId?: string;
  kind: ExerciseKind;
  correct: boolean;
  latencyMs: number;
  hintUsed: boolean;
}): Promise<{ becameLeech: boolean }> {
  const now = new Date();

  await db.insert(schema.exerciseEvents).values({
    kind: input.kind,
    correct: input.correct,
    vocabId: input.cardId ?? null,
    lessonId: input.lessonId,
  });

  const track = trackForKind(input.kind);
  if (!track || !input.cardId) return { becameLeech: false };

  const [settingsRow] = await db
    .select()
    .from(schema.settings)
    .where(eq(schema.settings.profileId, PROFILE_ID));
  const targetRetention = settingsRow?.targetRetention ?? 0.9;

  const [existing] = await db
    .select()
    .from(schema.cards)
    .where(and(eq(schema.cards.vocabId, input.cardId), eq(schema.cards.track, track)));

  const snapshot = existing ? rowToSnapshot(existing) : newCardSnapshot(now);
  const grade = inferGrade({ correct: input.correct, latencyMs: input.latencyMs, hintUsed: input.hintUsed });
  const result = scheduleReview(snapshot, grade, now, { targetRetention });

  if (existing) {
    await db
      .update(schema.cards)
      .set({ ...result.card })
      .where(eq(schema.cards.id, existing.id));
    await db.insert(schema.reviewLogs).values({
      cardId: existing.id,
      grade,
      correct: input.correct,
      latencyMs: input.latencyMs,
      hintUsed: input.hintUsed,
      stabilityBefore: snapshot.stability,
      stabilityAfter: result.card.stability,
    });
  } else {
    const [inserted] = await db
      .insert(schema.cards)
      .values({ vocabId: input.cardId, track, ...result.card })
      .returning();
    await db.insert(schema.reviewLogs).values({
      cardId: inserted.id,
      grade,
      correct: input.correct,
      latencyMs: input.latencyMs,
      hintUsed: input.hintUsed,
      stabilityBefore: snapshot.stability,
      stabilityAfter: result.card.stability,
    });
  }

  return { becameLeech: result.becameLeech };
}

export interface LessonSessionSummary {
  xpEarned: number;
  accuracy: number;
  correctCount: number;
  totalCount: number;
  leveledUp: boolean;
  newLevel: number;
  crownLevel: number;
  currentStreak: number;
  unitUnlocked: boolean;
  newlyUnlockedAchievements: { slug: string; title: string; description: string; icon: string; tier: string }[];
}

/** Unlocks the next lesson node within a unit's sequence, or the next unit's first node on boss pass. */
async function unlockNext(unitId: string, lessonOrder: number, lessonKind: string, accuracy: number) {
  const unitLessons = await db
    .select()
    .from(schema.lessons)
    .where(eq(schema.lessons.unitId, unitId));
  const sorted = [...unitLessons].sort((a, b) => a.order - b.order);
  const next = sorted.find((l) => l.order === lessonOrder + 1);

  if (next) {
    const [existing] = await db
      .select()
      .from(schema.lessonProgress)
      .where(eq(schema.lessonProgress.lessonId, next.id));
    if (!existing) {
      await db.insert(schema.lessonProgress).values({ lessonId: next.id, status: "available" });
    } else if (existing.status === "locked") {
      await db.update(schema.lessonProgress).set({ status: "available" }).where(eq(schema.lessonProgress.id, existing.id));
    }
  }

  if (lessonKind === "boss" && accuracy >= 0.85) {
    const [unitProgRow] = await db.select().from(schema.unitProgress).where(eq(schema.unitProgress.unitId, unitId));
    const bestScore = Math.max(unitProgRow?.bossScore ?? 0, accuracy);
    if (unitProgRow) {
      await db
        .update(schema.unitProgress)
        .set({ status: "gold", bossScore: bestScore, masteredAt: new Date() })
        .where(eq(schema.unitProgress.id, unitProgRow.id));
    } else {
      await db
        .insert(schema.unitProgress)
        .values({ unitId, status: "gold", bossScore: bestScore, masteredAt: new Date() });
    }

    const unitDef = UNITS_SORTED.find((u) => u.slug === unitId);
    if (unitDef) {
      const nextUnitDef = UNITS_SORTED.find((u) => unitGlobalOrder(u) === unitGlobalOrder(unitDef) + 1);
      if (nextUnitDef) {
        const [nextUnitProg] = await db
          .select()
          .from(schema.unitProgress)
          .where(eq(schema.unitProgress.unitId, nextUnitDef.slug));
        if (!nextUnitProg) {
          await db.insert(schema.unitProgress).values({ unitId: nextUnitDef.slug, status: "available" });
        } else if (nextUnitProg.status === "locked") {
          await db.update(schema.unitProgress).set({ status: "available" }).where(eq(schema.unitProgress.id, nextUnitProg.id));
        }
        const nextUnitLessons = await db.select().from(schema.lessons).where(eq(schema.lessons.unitId, nextUnitDef.slug));
        const firstLesson = [...nextUnitLessons].sort((a, b) => a.order - b.order)[0];
        if (firstLesson) {
          const [flProg] = await db.select().from(schema.lessonProgress).where(eq(schema.lessonProgress.lessonId, firstLesson.id));
          if (!flProg) {
            await db.insert(schema.lessonProgress).values({ lessonId: firstLesson.id, status: "available" });
          }
        }
        return true;
      }
    }
  } else if (lessonKind !== "boss") {
    const [unitProgRow] = await db.select().from(schema.unitProgress).where(eq(schema.unitProgress.unitId, unitId));
    if (!unitProgRow) {
      await db.insert(schema.unitProgress).values({ unitId, status: "in_progress" });
    } else if (unitProgRow.status === "available" || unitProgRow.status === "locked") {
      await db.update(schema.unitProgress).set({ status: "in_progress" }).where(eq(schema.unitProgress.id, unitProgRow.id));
    }
  }
  return false;
}

export async function finalizeLessonSession(
  lessonId: string,
  crownLevelAttempted: number,
  results: { kind: ExerciseKind; correct: boolean }[],
): Promise<LessonSessionSummary> {
  const now = new Date();
  const [lesson] = await db.select().from(schema.lessons).where(eq(schema.lessons.id, lessonId));
  if (!lesson) throw new Error(`Unknown lesson "${lessonId}"`);

  const xpEarned = xpForLesson(results);
  const correctCount = results.filter((r) => r.correct).length;
  const totalCount = results.length;
  const accuracy = totalCount > 0 ? correctCount / totalCount : 0;
  const isPerfect = totalCount > 0 && correctCount === totalCount;

  const [statsRow] = await db.select().from(schema.userStats).where(eq(schema.userStats.id, PROFILE_ID));
  const oldLevel = statsRow?.level ?? 1;
  const newTotalXp = (statsRow?.totalXp ?? 0) + xpEarned;
  const newLevel = levelForTotalXp(newTotalXp);

  await db.insert(schema.xpEvents).values({
    amount: xpEarned,
    source: lesson.kind === "boss" ? "boss" : isPerfect ? "perfect_lesson" : "exercise",
  });

  const streakState: StreakState = {
    currentStreak: statsRow?.currentStreak ?? 0,
    longestStreak: statsRow?.longestStreak ?? 0,
    freezesAvailable: statsRow?.freezesAvailable ?? 0,
    lastActiveDate: statsRow?.lastActiveDate ?? null,
    weekendAmuletActive: statsRow?.weekendAmuletActive ?? false,
  };
  const nextStreak = recordActivity(streakState, todayStr(now));

  await db
    .update(schema.userStats)
    .set({
      totalXp: newTotalXp,
      level: newLevel,
      currentStreak: nextStreak.currentStreak,
      longestStreak: nextStreak.longestStreak,
      freezesAvailable: nextStreak.freezesAvailable,
      lastActiveDate: nextStreak.lastActiveDate,
    })
    .where(eq(schema.userStats.id, PROFILE_ID));

  const today = todayStr(now);
  const [existingLog] = await db.select().from(schema.sessionLogs).where(eq(schema.sessionLogs.date, today));
  const minutesEstimate = totalCount * 0.25;
  if (existingLog) {
    await db
      .update(schema.sessionLogs)
      .set({
        exercisesCompleted: existingLog.exercisesCompleted + totalCount,
        minutesStudied: existingLog.minutesStudied + minutesEstimate,
      })
      .where(eq(schema.sessionLogs.id, existingLog.id));
  } else {
    await db.insert(schema.sessionLogs).values({ date: today, exercisesCompleted: totalCount, minutesStudied: minutesEstimate });
  }

  const [existingLessonProgress] = await db
    .select()
    .from(schema.lessonProgress)
    .where(eq(schema.lessonProgress.lessonId, lessonId));
  const bestAccuracy = Math.max(existingLessonProgress?.bestAccuracy ?? 0, accuracy);
  const crownLevel =
    accuracy >= 0.8 ? Math.max(existingLessonProgress?.crownLevel ?? 0, crownLevelAttempted) : existingLessonProgress?.crownLevel ?? 0;
  if (existingLessonProgress) {
    await db
      .update(schema.lessonProgress)
      .set({ status: "complete", crownLevel, bestAccuracy, lastCompletedAt: now })
      .where(eq(schema.lessonProgress.id, existingLessonProgress.id));
  } else {
    await db
      .insert(schema.lessonProgress)
      .values({ lessonId, status: "complete", crownLevel, bestAccuracy, lastCompletedAt: now });
  }

  const unitUnlocked = await unlockNext(lesson.unitId, lesson.order, lesson.kind, accuracy);

  const alreadyUnlocked = new Set((await db.select().from(schema.userAchievements)).map((a) => a.achievementId));
  const stats = await computeAchievementStats();
  const newSlugs = findNewlyUnlocked(ACHIEVEMENTS, stats, alreadyUnlocked);
  const newlyUnlockedAchievements = ACHIEVEMENTS.filter((a) => newSlugs.includes(a.slug));
  if (newSlugs.length > 0) {
    await db.insert(schema.userAchievements).values(newSlugs.map((slug) => ({ achievementId: slug })));
  }

  return {
    xpEarned,
    accuracy,
    correctCount,
    totalCount,
    leveledUp: newLevel > oldLevel,
    newLevel,
    crownLevel,
    currentStreak: nextStreak.currentStreak,
    unitUnlocked,
    newlyUnlockedAchievements: newlyUnlockedAchievements.map((a) => ({
      slug: a.slug,
      title: a.title,
      description: a.description,
      icon: a.icon,
      tier: a.tier,
    })),
  };
}

export async function ensureBootstrapProgress(): Promise<void> {
  const anyUnitProgress = await db.select({ id: schema.unitProgress.id }).from(schema.unitProgress).limit(1);
  if (anyUnitProgress.length > 0) return;

  const firstUnit = UNITS_SORTED[0];
  if (!firstUnit) return;
  await db.insert(schema.unitProgress).values({ unitId: firstUnit.slug, status: "available" });

  const firstUnitLessons = await db.select().from(schema.lessons).where(eq(schema.lessons.unitId, firstUnit.slug));
  const firstLesson = [...firstUnitLessons].sort((a, b) => a.order - b.order)[0];
  if (firstLesson) {
    await db.insert(schema.lessonProgress).values({ lessonId: firstLesson.id, status: "available" });
  }
}

export async function updateSettings(partial: Partial<typeof schema.settings.$inferInsert>): Promise<void> {
  await db.update(schema.settings).set(partial).where(eq(schema.settings.profileId, PROFILE_ID));
}

export async function repairStreakAction(): Promise<void> {
  const { repairStreak, canRepairStreak } = await import("@/lib/progression/streaks");
  const [statsRow] = await db.select().from(schema.userStats).where(eq(schema.userStats.id, PROFILE_ID));
  if (!statsRow) return;
  const state: StreakState = {
    currentStreak: statsRow.currentStreak,
    longestStreak: statsRow.longestStreak,
    freezesAvailable: statsRow.freezesAvailable,
    lastActiveDate: statsRow.lastActiveDate,
    weekendAmuletActive: statsRow.weekendAmuletActive,
  };
  const today = todayStr(new Date());
  if (!canRepairStreak(state, today)) return;
  const repaired = repairStreak(state, today);
  await db
    .update(schema.userStats)
    .set({
      currentStreak: repaired.currentStreak,
      longestStreak: repaired.longestStreak,
      lastActiveDate: repaired.lastActiveDate,
    })
    .where(eq(schema.userStats.id, PROFILE_ID));
}

export async function submitPlacementTest(
  score: number,
  recommendedUnitId: string,
  answers: { questionId: string; correct: boolean }[],
): Promise<void> {
  await db
    .insert(schema.placementResult)
    .values({ id: "singleton", score, recommendedUnitId, answers })
    .onConflictDoUpdate({
      target: schema.placementResult.id,
      set: { score, recommendedUnitId, answers, completedAt: new Date() },
    });
  await db
    .update(schema.profile)
    .set({ placementDone: true, currentUnitId: recommendedUnitId })
    .where(eq(schema.profile.id, PROFILE_ID));

  await ensureBootstrapProgress();
  const targetUnit = UNITS_SORTED.find((u) => u.slug === recommendedUnitId);
  if (!targetUnit) return;
  for (const unitDef of UNITS_SORTED) {
    if (unitGlobalOrder(unitDef) > unitGlobalOrder(targetUnit)) continue;
    const [existing] = await db.select().from(schema.unitProgress).where(eq(schema.unitProgress.unitId, unitDef.slug));
    const status = unitGlobalOrder(unitDef) < unitGlobalOrder(targetUnit) ? "complete" : "available";
    if (!existing) {
      await db.insert(schema.unitProgress).values({ unitId: unitDef.slug, status });
    } else if (existing.status === "locked") {
      await db.update(schema.unitProgress).set({ status }).where(eq(schema.unitProgress.id, existing.id));
    }
    if (status === "available") {
      const lessons = await db.select().from(schema.lessons).where(eq(schema.lessons.unitId, unitDef.slug));
      const first = [...lessons].sort((a, b) => a.order - b.order)[0];
      if (first) {
        const [flProg] = await db.select().from(schema.lessonProgress).where(eq(schema.lessonProgress.lessonId, first.id));
        if (!flProg) await db.insert(schema.lessonProgress).values({ lessonId: first.id, status: "available" });
      }
    }
  }
}
