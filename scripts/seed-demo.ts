/**
 * Seeds a realistic ~12-month demo history so the app doesn't look empty on first run.
 * Simulates day-by-day usage with the SAME algorithms production uses (FSRS scheduleReview,
 * xpForExercise, recordActivity) — just with historical timestamps instead of `new Date()`, since
 * those pure functions already take an explicit date rather than reading the clock themselves.
 * Only `newCardSnapshot`/`scheduleReview`/`inferGrade`/`recordActivity`/`xpForExercise`/
 * `levelForTotalXp`/`findNewlyUnlocked` are reused directly; lesson/unit progression and daily
 * pacing are a simplified simulation, not a replay of real lesson sessions — see DECISIONS.md.
 *
 * Safe to re-run: clears prior demo/user-state rows first (content tables are untouched).
 * Run `npm run seed` first if you haven't seeded content yet.
 */
import { db } from "../src/db/client";
import * as schema from "../src/db/schema";
import { UNITS_SORTED, LESSONS } from "../src/content/curriculum";
import { ACHIEVEMENTS } from "../src/content/achievements";
import { findNewlyUnlocked, type AchievementStats } from "../src/lib/achievements/evaluate";
import { xpForExercise, levelForTotalXp } from "../src/lib/progression/xp";
import { recordActivity, type StreakState } from "../src/lib/progression/streaks";
import { inferGrade, newCardSnapshot, scheduleReview } from "../src/lib/srs";
import type { CardSnapshot, Grade } from "../src/lib/srs/types";
import type { ExerciseKind } from "../src/types/exercise";
import { eq } from "drizzle-orm";

const NUM_DAYS = 365;
const STUDY_PROBABILITY = 0.86;
const FORCED_GAP_START_DAY = 40; // a deliberate multi-day gap to exercise streak-freeze/repair
const FORCED_GAP_LEN = 3;
// Tuned so a year of simulated daily use lands around the "Intense" 200 XP/day preset
// (PLAN.md §3) rather than a token amount — see DECISIONS.md for the reasoning.
const NEW_WORDS_PER_ACTIVE_DAY = 10;
const REVIEWS_PER_ACTIVE_DAY = 18;
const MS_PER_DAY = 86_400_000;

/** Small seeded PRNG (mulberry32) so re-runs produce a consistent-looking demo. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(20260810);

function dateAt(dayOffset: number, hour: number): Date {
  const d = new Date(Date.now() - (NUM_DAYS - dayOffset) * MS_PER_DAY);
  d.setHours(hour, 15 + Math.floor(rng() * 30), 0, 0);
  return d;
}
function dateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function weightedGrade(pAgain: number, pHard: number, pEasy: number): Grade {
  const r = rng();
  if (r < pAgain) return "again";
  if (r < pAgain + pHard) return "hard";
  if (r < 1 - pEasy) return "good";
  return "easy";
}

interface SimCard {
  /** Generated up front so review-log rows (inserted incrementally through the simulation) can
   * reference the real `cards.id` FK — the DB only assigns that UUID when the row is actually
   * inserted, which here happens once at the very end. See DECISIONS.md. */
  id: string;
  vocabId: string;
  snapshot: CardSnapshot;
}

async function main() {
  console.log("Clearing prior demo/user-state data...");
  await db.transaction((tx) => {
    for (const table of [
      schema.reviewLogs,
      schema.exerciseEvents,
      schema.cards,
      schema.lessonProgress,
      schema.unitProgress,
      schema.xpEvents,
      schema.userAchievements,
      schema.sessionLogs,
      schema.placementResult,
    ]) {
      tx.delete(table).run();
    }
    tx.delete(schema.userStats).run();
    tx.delete(schema.profile).run();
    tx.delete(schema.settings).run();
  });

  const allVocab = await db.select().from(schema.vocabEntries);
  const vocabByTopic = new Map<string, string[]>();
  for (const v of allVocab) {
    const arr = vocabByTopic.get(v.topic) ?? [];
    arr.push(v.id);
    vocabByTopic.set(v.topic, arr);
  }

  // Curriculum-ordered word introduction queue: walk units in order, pull each unit's topics'
  // words (deduped globally), so new-word pacing roughly follows the skill tree's own sequence.
  const introduced = new Set<string>();
  const wordQueue: string[] = [];
  for (const unit of UNITS_SORTED) {
    for (const topic of unit.topics) {
      for (const vocabId of vocabByTopic.get(topic) ?? []) {
        if (!introduced.has(vocabId)) {
          introduced.add(vocabId);
          wordQueue.push(vocabId);
        }
      }
    }
  }
  for (const v of allVocab) {
    if (!introduced.has(v.id)) {
      introduced.add(v.id);
      wordQueue.push(v.id);
    }
  }

  const lessonsFlat = [...LESSONS].sort((a, b) => {
    const ua = UNITS_SORTED.findIndex((u) => u.slug === a.unitSlug);
    const ub = UNITS_SORTED.findIndex((u) => u.slug === b.unitSlug);
    return ua !== ub ? ua - ub : a.order - b.order;
  });

  const cards = new Map<string, SimCard>();
  const leechCandidates = new Set<string>();
  let wordQueuePtr = 0;
  let lessonPtr = 0;
  let totalXp = 0;
  let streak: StreakState = {
    currentStreak: 0,
    longestStreak: 0,
    freezesAvailable: 0,
    lastActiveDate: null,
    weekendAmuletActive: true,
  };
  const unlockedAchievements = new Set<string>();
  let studiedAfterMidnight = false;
  let studiedBeforeDawn = false;
  let weekendStreak = 0;
  let dictationCount = 0;
  let speakingCount = 0;
  let registerSwapCount = 0;
  let verbDrillCount = 0;
  let activeDaysSinceLastLessonAdvance = 0;

  // Keyed by date (not pushed per simulated day) because `dateAt`'s local setHours + UTC-day-math
  // combo can occasionally map two different simulated days to the same ISO date string around
  // very early/late hours — merge rather than assume uniqueness (session_logs.date is UNIQUE).
  const sessionLogsByDate = new Map<string, { exercisesCompleted: number; minutesStudied: number }>();
  const dailyXpEvents: { ts: Date; amount: number; source: "exercise" | "perfect_lesson" | "boss" }[] = [];
  const reviewLogRows: (typeof schema.reviewLogs.$inferInsert)[] = [];
  const exerciseEventRows: (typeof schema.exerciseEvents.$inferInsert)[] = [];
  const unitProgressState = new Map<string, { status: string; bossScore: number | null; masteredAt: Date | null }>();
  const lessonProgressState = new Map<string, { status: string; crownLevel: number; bestAccuracy: number; lastCompletedAt: Date }>();
  const unlockedUnitAchievementEvents: { ts: Date; slugs: string[] }[] = [];

  for (let day = 0; day < NUM_DAYS; day++) {
    const inForcedGap = day >= FORCED_GAP_START_DAY && day < FORCED_GAP_START_DAY + FORCED_GAP_LEN;
    const isFirstOrLast = day === 0 || day === NUM_DAYS - 1;
    const active = !inForcedGap && (isFirstOrLast || rng() < STUDY_PROBABILITY);
    if (!active) continue;

    // Occasionally study very late or very early to exercise the Noctambule/Lève-tôt achievements.
    let hour = 18 + Math.floor(rng() * 4);
    if (day === 12) hour = 1;
    if (day === 55) hour = 5;
    const now = dateAt(day, hour);
    if (hour <= 3) studiedAfterMidnight = true;
    if (hour >= 4 && hour <= 5) studiedBeforeDawn = true;

    const dow = now.getUTCDay();
    if (dow === 0 || dow === 6) weekendStreak++;
    else weekendStreak = 0;

    let exercisesToday = 0;
    let correctToday = 0;

    // Introduce new words.
    for (let i = 0; i < NEW_WORDS_PER_ACTIVE_DAY && wordQueuePtr < wordQueue.length; i++, wordQueuePtr++) {
      const vocabId = wordQueue[wordQueuePtr];
      const id = crypto.randomUUID();
      const snapshot = newCardSnapshot(now);
      const grade = weightedGrade(0.08, 0.17, 0.15);
      const result = scheduleReview(snapshot, grade, now, { targetRetention: 0.9 });
      cards.set(vocabId, { id, vocabId, snapshot: result.card });
      const correct = grade !== "again";
      reviewLogRows.push({
        cardId: id,
        ts: now,
        grade,
        correct,
        latencyMs: 1500 + Math.floor(rng() * 3000),
        hintUsed: rng() < 0.1,
        stabilityBefore: snapshot.stability,
        stabilityAfter: result.card.stability,
      });
      exerciseEventRows.push({ ts: now, kind: "mcq_recognition", correct, vocabId, lessonId: null });
      exercisesToday++;
      if (correct) correctToday++;
    }

    // Process due reviews.
    let reviewsProcessed = 0;
    for (const [vocabId, card] of cards) {
      if (reviewsProcessed >= REVIEWS_PER_ACTIVE_DAY) break;
      if (card.snapshot.state === "new") continue;
      if (card.snapshot.dueDate.getTime() > now.getTime()) continue;
      reviewsProcessed++;

      const isLeechTarget = leechCandidates.has(vocabId);
      const grade = isLeechTarget && card.snapshot.lapses < 6 ? weightedGrade(0.55, 0.15, 0.03) : weightedGrade(0.06, 0.12, 0.25);
      const result = scheduleReview(card.snapshot, grade, now, { targetRetention: 0.9 });
      const correct = grade !== "again";
      reviewLogRows.push({
        cardId: card.id,
        ts: now,
        grade,
        correct,
        latencyMs: 1200 + Math.floor(rng() * 2500),
        hintUsed: rng() < 0.05,
        stabilityBefore: card.snapshot.stability,
        stabilityAfter: result.card.stability,
      });
      const kind: ExerciseKind = (["mcq_recognition", "mcq_production", "listening", "cloze"] as const)[Math.floor(rng() * 4)];
      exerciseEventRows.push({ ts: now, kind, correct, vocabId, lessonId: null });
      cards.set(vocabId, { id: card.id, vocabId, snapshot: result.card });
      exercisesToday++;
      if (correct) correctToday++;
    }

    // Deliberately seed a couple of leech words early so "mots difficiles" has real content.
    if (day === 20 && cards.size > 10) {
      let n = 0;
      for (const vocabId of cards.keys()) {
        leechCandidates.add(vocabId);
        if (++n >= 3) break;
      }
    }

    // A little non-SRS practice (conjugation drills, dictation, speaking, register swap) for
    // achievement/dashboard variety.
    const bonusRolls = 1 + Math.floor(rng() * 4);
    for (let i = 0; i < bonusRolls; i++) {
      const r = rng();
      const correct = rng() < 0.75;
      let kind: ExerciseKind;
      if (r < 0.4) {
        kind = "conjugation_drill";
        verbDrillCount += correct ? 1 : 0;
      } else if (r < 0.65) {
        kind = "dictation";
        dictationCount += correct ? 1 : 0;
      } else if (r < 0.85) {
        kind = "speaking";
        speakingCount += correct ? 1 : 0;
      } else {
        kind = "register_swap";
        registerSwapCount += correct ? 1 : 0;
      }
      exerciseEventRows.push({ ts: now, kind, correct, vocabId: null, lessonId: null });
      exercisesToday++;
      if (correct) correctToday++;
    }

    if (exercisesToday === 0) continue;

    const xpToday = exerciseEventRows
      .slice(-exercisesToday)
      .reduce((sum, e) => sum + xpForExercise(e.kind as ExerciseKind, e.correct), 0);
    totalXp += xpToday;
    dailyXpEvents.push({ ts: now, amount: xpToday, source: "exercise" });

    streak = recordActivity(streak, dateStr(now));
    {
      const key = dateStr(now);
      const existing = sessionLogsByDate.get(key);
      const minutes = Math.round(exercisesToday * 0.6 * 10) / 10;
      if (existing) {
        existing.exercisesCompleted += exercisesToday;
        existing.minutesStudied += minutes;
      } else {
        sessionLogsByDate.set(key, { exercisesCompleted: exercisesToday, minutesStudied: minutes });
      }
    }

    // Lesson/unit progression: roughly one lesson node advances every ~4 active days.
    activeDaysSinceLastLessonAdvance++;
    if (activeDaysSinceLastLessonAdvance >= 4 && lessonPtr < lessonsFlat.length) {
      activeDaysSinceLastLessonAdvance = 0;
      const lesson = lessonsFlat[lessonPtr];
      const accuracy = 0.8 + rng() * 0.2;
      lessonProgressState.set(lesson.slug, {
        status: "complete",
        crownLevel: Math.min(5, 1 + Math.floor(rng() * 3)),
        bestAccuracy: accuracy,
        lastCompletedAt: now,
      });
      const unitDef = UNITS_SORTED.find((u) => u.slug === lesson.unitSlug)!;
      if (lesson.kind === "boss" && accuracy >= 0.85) {
        unitProgressState.set(unitDef.slug, { status: "gold", bossScore: accuracy, masteredAt: now });
        const nextIdx = UNITS_SORTED.indexOf(unitDef) + 1;
        if (nextIdx < UNITS_SORTED.length) {
          const next = UNITS_SORTED[nextIdx];
          if (!unitProgressState.has(next.slug)) unitProgressState.set(next.slug, { status: "available", bossScore: null, masteredAt: null });
        }
      } else if (!unitProgressState.has(unitDef.slug)) {
        unitProgressState.set(unitDef.slug, { status: "in_progress", bossScore: null, masteredAt: null });
      }
      lessonPtr++;
    }

    // Achievement check (lightweight in-memory snapshot, same evaluator as production).
    const level = levelForTotalXp(totalXp);
    const stats: AchievementStats = {
      wordsKnown: cards.size,
      verbDrillsCompleted: verbDrillCount,
      perfectLessons: [...lessonProgressState.values()].filter((l) => l.bestAccuracy === 1).length,
      currentStreak: streak.currentStreak,
      studiedAfterMidnight,
      studiedBeforeDawn,
      passedBossTests: [...unitProgressState.entries()]
        .filter(([, v]) => v.bossScore !== null)
        .map(([unitSlug, v]) => ({ unitSlug, score: v.bossScore as number })),
      unitsMastered: [...unitProgressState.values()].filter((v) => v.status === "gold").length,
      reviewsCompleted: reviewLogRows.length,
      leechesCleared: [...cards.values()].filter((c) => leechCandidates.has(c.vocabId) && c.snapshot.lapses >= 6 && c.snapshot.state === "review").length,
      level,
      speakingExercises: speakingCount,
      dictationExercises: dictationCount,
      registerSwaps: registerSwapCount,
      consecutiveWeekendSessions: weekendStreak,
      placementTestDone: true,
    };
    const newSlugs = findNewlyUnlocked(ACHIEVEMENTS, stats, unlockedAchievements);
    if (newSlugs.length > 0) {
      for (const s of newSlugs) unlockedAchievements.add(s);
      unlockedUnitAchievementEvents.push({ ts: now, slugs: newSlugs });
    }

    const checkpoint = day === 6 ? "  ← week 1" : day === 83 ? "  ← week 12" : day === NUM_DAYS - 1 ? "  ← week 52" : "";
    if (day % 30 === 0 || checkpoint) {
      console.log(
        `day ${day}: words=${cards.size} xp=${totalXp} level=${level} streak=${streak.currentStreak} unitsGold=${stats.unitsMastered} achievements=${unlockedAchievements.size}${checkpoint}`,
      );
    }
  }

  console.log("\nWriting to database...");
  const finalNow = new Date();

  await db.transaction((tx) => {
    tx.insert(schema.profile).values({ id: "singleton", name: "Alex", createdAt: dateAt(0, 9), placementDone: true }).run();
    tx.insert(schema.settings).values({ profileId: "singleton" }).run();
    tx.insert(schema.userStats)
      .values({
        id: "singleton",
        totalXp,
        level: levelForTotalXp(totalXp),
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        freezesAvailable: streak.freezesAvailable,
        lastActiveDate: streak.lastActiveDate,
        weekendAmuletActive: true,
      })
      .run();

    for (const [vocabId, card] of cards) {
      tx.insert(schema.cards)
        .values({ id: card.id, vocabId, track: "recognition", ...card.snapshot })
        .run();
    }
    console.log(`  ${cards.size} cards`);

    const CHUNK = 500;
    for (let i = 0; i < reviewLogRows.length; i += CHUNK) {
      tx.insert(schema.reviewLogs).values(reviewLogRows.slice(i, i + CHUNK)).run();
    }
    console.log(`  ${reviewLogRows.length} review logs`);
    for (let i = 0; i < exerciseEventRows.length; i += CHUNK) {
      tx.insert(schema.exerciseEvents).values(exerciseEventRows.slice(i, i + CHUNK)).run();
    }
    console.log(`  ${exerciseEventRows.length} exercise events`);
    const sessionLogRows = [...sessionLogsByDate.entries()].map(([date, v]) => ({ date, ...v }));
    for (let i = 0; i < sessionLogRows.length; i += CHUNK) {
      tx.insert(schema.sessionLogs).values(sessionLogRows.slice(i, i + CHUNK)).run();
    }
    console.log(`  ${sessionLogRows.length} session log days`);
    for (let i = 0; i < dailyXpEvents.length; i += CHUNK) {
      tx.insert(schema.xpEvents).values(dailyXpEvents.slice(i, i + CHUNK)).run();
    }
    console.log(`  ${dailyXpEvents.length} xp events`);

    for (const [lessonId, lp] of lessonProgressState) {
      tx.insert(schema.lessonProgress)
        .values({ lessonId, status: lp.status as "complete", crownLevel: lp.crownLevel, bestAccuracy: lp.bestAccuracy, lastCompletedAt: lp.lastCompletedAt })
        .run();
    }
    console.log(`  ${lessonProgressState.size} lesson progress rows`);
    for (const [unitId, up] of unitProgressState) {
      tx.insert(schema.unitProgress)
        .values({ unitId, status: up.status as "gold", bossScore: up.bossScore, masteredAt: up.masteredAt })
        .run();
    }
    console.log(`  ${unitProgressState.size} unit progress rows`);

    for (const event of unlockedUnitAchievementEvents) {
      for (const slug of event.slugs) {
        tx.insert(schema.userAchievements).values({ achievementId: slug, unlockedAt: event.ts }).run();
      }
    }
    console.log(`  ${unlockedAchievements.size} achievements unlocked`);
  });

  console.log(`\nDemo profile seeded: ${cards.size} words known, ${totalXp} XP, level ${levelForTotalXp(totalXp)}, ${streak.currentStreak}-day streak, ${[...unitProgressState.values()].filter((v) => v.status === "gold").length} units mastered.`);
  console.log(`(finished at ${finalNow.toISOString()})`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
