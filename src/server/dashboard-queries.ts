import "server-only";
import { db } from "@/db/client";
import * as schema from "@/db/schema";
import { retrievability } from "@/lib/srs";
import { CEFR_LEVELS, EXERCISE_KINDS, type CefrLevel } from "@/lib/dashboard/labels";
import { TOPICS } from "@/content/topics";
import type { ExerciseKind } from "@/types/exercise";
import { getAllCards, getAllReviewLogs, getAllVocab } from "./queries";

const DAY_MS = 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/** A word is "known" once any of its SRS cards (any track) has left the `new` state. */
function computeKnownVocabIds(cards: Awaited<ReturnType<typeof getAllCards>>): Set<string> {
  const ids = new Set<string>();
  for (const c of cards) {
    if (c.vocabId && c.state !== "new") ids.add(c.vocabId);
  }
  return ids;
}

// ---------------------------------------------------------------------------
// 1. Words known by level/topic
// ---------------------------------------------------------------------------

export interface WordsKnownByTopic {
  topic: string;
  label: string;
  A1: number;
  A2: number;
  B1: number;
  B2: number;
  C1: number;
  total: number;
}

function computeWordsKnownByTopic(
  vocab: Awaited<ReturnType<typeof getAllVocab>>,
  knownVocabIds: Set<string>,
): WordsKnownByTopic[] {
  const byTopic = new Map<string, WordsKnownByTopic>();
  for (const topic of TOPICS) {
    byTopic.set(topic.slug, {
      topic: topic.slug,
      label: topic.label,
      A1: 0,
      A2: 0,
      B1: 0,
      B2: 0,
      C1: 0,
      total: 0,
    });
  }

  for (const v of vocab) {
    if (!knownVocabIds.has(v.id)) continue;
    const row = byTopic.get(v.topic);
    if (!row) continue; // defensive — every vocab topic should be in TOPICS
    row[v.cefr as CefrLevel] += 1;
    row.total += 1;
  }

  return Array.from(byTopic.values());
}

// ---------------------------------------------------------------------------
// 2. Retention curve over time
// ---------------------------------------------------------------------------

export interface RetentionPoint {
  /** ISO timestamp of the sample date */
  date: string;
  /** Mean FSRS retrievability (0-1) across cards under review as of this date, or null if none yet. */
  meanRetrievability: number | null;
  sampleSize: number;
}

const RETENTION_WINDOW_DAYS = 30;
const RETENTION_SAMPLE_POINTS = 10;

/**
 * Approximates a retention-over-time curve without storing historical per-card FSRS state:
 * for each sample date in the recent window, take each card's *latest reviewLog as of that
 * date* (its `stabilityAfter` + `ts` are a real historical snapshot) and compute
 * `retrievability(elapsedDays, stabilityAfter)` from there. Averaging that across every card
 * that had already been reviewed by that date gives an honest, if approximate, retrospective
 * retention curve built entirely from real review history — see DECISIONS.md.
 */
function computeRetentionCurve(
  logs: Awaited<ReturnType<typeof getAllReviewLogs>>,
  now: Date,
): RetentionPoint[] {
  if (logs.length === 0) return [];

  const sorted = [...logs].sort((a, b) => a.ts.getTime() - b.ts.getTime());
  const earliest = sorted[0].ts.getTime();
  const start = Math.max(earliest, now.getTime() - RETENTION_WINDOW_DAYS * DAY_MS);
  const end = now.getTime();

  const logsByCard = new Map<string, typeof sorted>();
  for (const log of sorted) {
    const arr = logsByCard.get(log.cardId);
    if (arr) arr.push(log);
    else logsByCard.set(log.cardId, [log]);
  }

  const n = Math.max(2, RETENTION_SAMPLE_POINTS);
  const points: RetentionPoint[] = [];
  for (let i = 0; i < n; i++) {
    const t = start + (i / (n - 1)) * (end - start);
    let sum = 0;
    let count = 0;
    for (const cardLogs of logsByCard.values()) {
      let last: (typeof cardLogs)[number] | null = null;
      for (const log of cardLogs) {
        if (log.ts.getTime() <= t) last = log;
        else break;
      }
      if (!last) continue;
      const elapsedDays = Math.max(0, (t - last.ts.getTime()) / DAY_MS);
      sum += retrievability(elapsedDays, last.stabilityAfter);
      count += 1;
    }
    points.push({
      date: new Date(t).toISOString(),
      meanRetrievability: count > 0 ? sum / count : null,
      sampleSize: count,
    });
  }
  return points;
}

// ---------------------------------------------------------------------------
// 3. Accuracy by exercise type (kind), from exerciseEvents
// ---------------------------------------------------------------------------

export interface KindAccuracy {
  kind: ExerciseKind;
  correct: number;
  total: number;
  /** null when the kind has never been attempted — distinct from a real 0%. */
  accuracyPct: number | null;
}

export async function getAccuracyByExerciseKind(): Promise<KindAccuracy[]> {
  const events = await db.select().from(schema.exerciseEvents);
  const byKind = new Map<ExerciseKind, { correct: number; total: number }>();
  for (const kind of EXERCISE_KINDS) byKind.set(kind, { correct: 0, total: 0 });

  for (const e of events) {
    const bucket = byKind.get(e.kind);
    if (!bucket) continue;
    bucket.total += 1;
    if (e.correct) bucket.correct += 1;
  }

  return EXERCISE_KINDS.map((kind) => {
    const b = byKind.get(kind) ?? { correct: 0, total: 0 };
    return {
      kind,
      correct: b.correct,
      total: b.total,
      accuracyPct: b.total > 0 ? (b.correct / b.total) * 100 : null,
    };
  });
}

// ---------------------------------------------------------------------------
// 7. Projected vocabulary size at 30/90/365 days
// ---------------------------------------------------------------------------

export interface VocabProjection {
  currentKnown: number;
  totalVocab: number;
  /** words newly learned per day, averaged over the recent pace window */
  pacePerDay: number;
  hasHistory: boolean;
  historyDays: number;
  projections: { days: number; projected: number }[];
}

const PACE_WINDOW_DAYS = 14;

/**
 * Simple, honestly-labeled linear projection: words learned per day over the last
 * `PACE_WINDOW_DAYS` (a word's "learned" date = the earliest reviewLog timestamp across any of
 * its cards), extrapolated forward and clamped to the total curriculum size. Not a real forecast
 * model — just current pace × days, which is what the UI caption says.
 */
function computeVocabProjection(
  vocab: Awaited<ReturnType<typeof getAllVocab>>,
  cards: Awaited<ReturnType<typeof getAllCards>>,
  logs: Awaited<ReturnType<typeof getAllReviewLogs>>,
  knownVocabIds: Set<string>,
  now: Date,
): VocabProjection {
  const currentKnown = knownVocabIds.size;
  const totalVocab = vocab.length;

  const cardVocabMap = new Map<string, string>();
  for (const c of cards) {
    if (c.vocabId) cardVocabMap.set(c.id, c.vocabId);
  }

  const firstSeenByVocab = new Map<string, number>();
  for (const log of logs) {
    const vocabId = cardVocabMap.get(log.cardId);
    if (!vocabId) continue;
    const ts = log.ts.getTime();
    const cur = firstSeenByVocab.get(vocabId);
    if (cur === undefined || ts < cur) firstSeenByVocab.set(vocabId, ts);
  }

  const windowStart = now.getTime() - PACE_WINDOW_DAYS * DAY_MS;
  const learnedInWindow = Array.from(firstSeenByVocab.values()).filter((ts) => ts >= windowStart).length;
  const earliestLogTs = logs.length > 0 ? Math.min(...logs.map((l) => l.ts.getTime())) : now.getTime();
  const historyDays = Math.min(PACE_WINDOW_DAYS, Math.max(0, (now.getTime() - earliestLogTs) / DAY_MS));
  const effectiveDays = Math.max(1, historyDays);
  const pacePerDay = logs.length > 0 ? learnedInWindow / effectiveDays : 0;
  const hasHistory = logs.length > 0 && historyDays >= 1;

  const projections = [30, 90, 365].map((days) => ({
    days,
    projected: Math.min(totalVocab, Math.round(currentKnown + pacePerDay * days)),
  }));

  return {
    currentKnown,
    totalVocab,
    pacePerDay,
    hasHistory,
    historyDays: Math.round(historyDays),
    projections,
  };
}

// ---------------------------------------------------------------------------
// Aggregator — fetches vocab/cards/reviewLogs exactly once and feeds all three pure computers
// above. `progres/page.tsx` originally called getWordsKnownByTopic/getRetentionCurve/
// getVocabProjection independently inside one Promise.all, which fetched each of those three
// tables twice per dashboard load (each function pulled its own copy). Caught by code review.
// ---------------------------------------------------------------------------

export interface DashboardData {
  wordsKnown: WordsKnownByTopic[];
  retention: RetentionPoint[];
  projection: VocabProjection;
}

export async function getDashboardData(now: Date = new Date()): Promise<DashboardData> {
  const [vocab, cards, logs] = await Promise.all([getAllVocab(), getAllCards(), getAllReviewLogs()]);
  const knownVocabIds = computeKnownVocabIds(cards);
  return {
    wordsKnown: computeWordsKnownByTopic(vocab, knownVocabIds),
    retention: computeRetentionCurve(logs, now),
    projection: computeVocabProjection(vocab, cards, logs, knownVocabIds, now),
  };
}

export { CEFR_LEVELS };
