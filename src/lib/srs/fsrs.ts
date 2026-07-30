import type { CardSnapshot, Grade, ReviewResult } from "./types";

/**
 * FSRS (Free Spaced Repetition Scheduler) v4 core formulas, with default weights from the
 * open-source FSRS reference implementation. w0-w3: initial stability per grade. w4,w5: initial
 * difficulty. w6: difficulty delta per grade. w7: mean-reversion toward "easy" difficulty.
 * w8-w10: post-success stability growth. w11-w14: post-lapse stability. w15/w16: hard/easy
 * multipliers on the growth formula.
 */
const W = [
  0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61,
] as const;

const GRADE_VALUE: Record<Grade, number> = { again: 1, hard: 2, good: 3, easy: 4 };
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const LEARNING_STEP_MS = 10 * 60 * 1000;
export const DEFAULT_LEECH_THRESHOLD = 6;
export const DEFAULT_TARGET_RETENTION = 0.9;

function clampDifficulty(d: number): number {
  return Math.min(10, Math.max(1, d));
}

function initialStability(grade: Grade): number {
  return W[GRADE_VALUE[grade] - 1];
}

function initialDifficulty(grade: Grade): number {
  return clampDifficulty(W[4] - (GRADE_VALUE[grade] - 3) * W[5]);
}

function nextDifficulty(difficulty: number, grade: Grade): number {
  const shifted = difficulty - W[6] * (GRADE_VALUE[grade] - 3);
  const reverted = W[7] * initialDifficulty("easy") + (1 - W[7]) * shifted;
  return clampDifficulty(reverted);
}

/** Predicted probability of recall after `elapsedDays` at the given stability. */
export function retrievability(elapsedDays: number, stability: number): number {
  if (stability <= 0) return 0;
  return (1 + elapsedDays / (9 * stability)) ** -1;
}

function nextStabilityOnSuccess(
  difficulty: number,
  stability: number,
  r: number,
  grade: Grade,
): number {
  const hardPenalty = grade === "hard" ? W[15] : 1;
  const easyBonus = grade === "easy" ? W[16] : 1;
  const growth =
    Math.exp(W[8]) *
    (11 - difficulty) *
    stability ** -W[9] *
    (Math.exp(W[10] * (1 - r)) - 1) *
    hardPenalty *
    easyBonus;
  return stability * (1 + growth);
}

function nextStabilityOnLapse(difficulty: number, stability: number, r: number): number {
  return W[11] * difficulty ** -W[12] * ((stability + 1) ** W[13] - 1) * Math.exp(W[14] * (1 - r));
}

/** Days until predicted recall drops to `requestedRetention`, at minimum 1 day. */
function intervalDays(stability: number, requestedRetention: number): number {
  return Math.max(1, Math.round(9 * stability * (1 / requestedRetention - 1)));
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

function addLearningStep(date: Date): Date {
  return new Date(date.getTime() + LEARNING_STEP_MS);
}

export function currentRetrievability(card: CardSnapshot, now: Date): number {
  if (card.state === "new" || !card.lastReview) return 1;
  const elapsedDays = (now.getTime() - card.lastReview.getTime()) / MS_PER_DAY;
  return retrievability(Math.max(0, elapsedDays), card.stability);
}

export function scheduleReview(
  card: CardSnapshot,
  grade: Grade,
  now: Date,
  options: { targetRetention?: number; leechThreshold?: number } = {},
): ReviewResult {
  const targetRetention = options.targetRetention ?? DEFAULT_TARGET_RETENTION;
  const leechThreshold = options.leechThreshold ?? DEFAULT_LEECH_THRESHOLD;
  const wasLeech = card.isLeech;

  let { difficulty, stability, lapses } = card;
  let state = card.state;
  let dueDate: Date;

  if (card.state === "new") {
    difficulty = initialDifficulty(grade);
    stability = initialStability(grade);
    if (grade === "again") {
      state = "learning";
      dueDate = addLearningStep(now);
    } else {
      state = "review";
      dueDate = addDays(now, intervalDays(stability, targetRetention));
    }
  } else if (card.state === "learning" || card.state === "relearning") {
    const r = currentRetrievability(card, now);
    if (grade === "again") {
      stability = nextStabilityOnLapse(difficulty, stability, r);
      dueDate = addLearningStep(now);
      // state stays learning/relearning
    } else {
      difficulty = nextDifficulty(difficulty, grade);
      stability = nextStabilityOnSuccess(difficulty, stability, r, grade);
      state = "review";
      dueDate = addDays(now, intervalDays(stability, targetRetention));
    }
  } else {
    // state === "review"
    const r = currentRetrievability(card, now);
    if (grade === "again") {
      lapses += 1;
      difficulty = nextDifficulty(difficulty, grade);
      stability = nextStabilityOnLapse(difficulty, stability, r);
      state = "relearning";
      dueDate = addLearningStep(now);
    } else {
      difficulty = nextDifficulty(difficulty, grade);
      stability = nextStabilityOnSuccess(difficulty, stability, r, grade);
      state = "review";
      dueDate = addDays(now, intervalDays(stability, targetRetention));
    }
  }

  const isLeech = lapses >= leechThreshold;
  const nextCard: CardSnapshot = {
    state,
    stability,
    difficulty,
    retrievability: retrievability(0, stability),
    reps: card.reps + 1,
    lapses,
    lastReview: now,
    dueDate,
    isLeech,
  };

  return { card: nextCard, grade, becameLeech: isLeech && !wasLeech };
}

export function newCardSnapshot(now: Date): CardSnapshot {
  return {
    state: "new",
    stability: 0,
    difficulty: 0,
    retrievability: 1,
    reps: 0,
    lapses: 0,
    lastReview: null,
    dueDate: now,
    isLeech: false,
  };
}
