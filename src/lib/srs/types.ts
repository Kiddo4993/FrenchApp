export type CardState = "new" | "learning" | "review" | "relearning";
export type Grade = "again" | "hard" | "good" | "easy";
export type Track = "recognition" | "production" | "listening" | "spelling";

export interface CardSnapshot {
  state: CardState;
  stability: number;
  difficulty: number;
  retrievability: number;
  reps: number;
  lapses: number;
  lastReview: Date | null;
  dueDate: Date;
  isLeech: boolean;
}

export interface ReviewResult {
  card: CardSnapshot;
  grade: Grade;
  /** true the moment lapses crosses the leech threshold on this review */
  becameLeech: boolean;
}

export interface GradeInput {
  correct: boolean;
  latencyMs: number;
  hintUsed: boolean;
  /** rolling median latency for this card/exercise-type, used as the hard/easy threshold */
  medianLatencyMs?: number;
}
