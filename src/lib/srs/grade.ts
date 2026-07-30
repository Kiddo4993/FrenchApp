import type { Grade, GradeInput } from "./types";

const DEFAULT_MEDIAN_LATENCY_MS = 4000;
const HARD_LATENCY_MULTIPLIER = 2.5;
const EASY_LATENCY_MULTIPLIER = 0.6;

/**
 * The learner never self-grades (PLAN.md §5) — grade is inferred from correctness, response
 * latency relative to this card's own rolling-median latency, and whether a hint was used.
 */
export function inferGrade(input: GradeInput): Grade {
  if (!input.correct) return "again";

  const median = input.medianLatencyMs ?? DEFAULT_MEDIAN_LATENCY_MS;
  if (input.hintUsed || input.latencyMs >= median * HARD_LATENCY_MULTIPLIER) return "hard";
  if (!input.hintUsed && input.latencyMs < median * EASY_LATENCY_MULTIPLIER) return "easy";
  return "good";
}
