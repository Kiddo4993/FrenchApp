import { create } from "zustand";
import type { ExerciseKind, ExerciseOutcome, ExercisePrompt } from "@/types/exercise";

export interface CompletedExerciseRecord {
  prompt: ExercisePrompt;
  outcome: ExerciseOutcome;
  isRetry: boolean;
}

interface LessonSessionState {
  lessonId: string | null;
  crownLevel: number;
  queue: ExercisePrompt[];
  totalExercises: number;
  seenFirstAttempt: Set<string>;
  firstAttemptResults: { kind: ExerciseKind; correct: boolean }[];
  history: CompletedExerciseRecord[];
  startedAt: number;
  isComplete: boolean;

  start: (lessonId: string, crownLevel: number, prompts: ExercisePrompt[]) => void;
  recordOutcome: (outcome: ExerciseOutcome) => void;
  reset: () => void;
}

/** PLAN.md §2: never show the same word twice in a row — skip ahead one slot if the next queued
 * prompt would repeat the card just answered. */
function dedupeAdjacent(queue: ExercisePrompt[], justAnsweredCardId: string | undefined): ExercisePrompt[] {
  if (!justAnsweredCardId || queue.length < 2) return queue;
  if (queue[0]?.cardId !== justAnsweredCardId) return queue;
  const [first, ...rest] = queue;
  return [rest[0], first, ...rest.slice(1)].filter(Boolean) as ExercisePrompt[];
}

export const useLessonSessionStore = create<LessonSessionState>((set, get) => ({
  lessonId: null,
  crownLevel: 1,
  queue: [],
  totalExercises: 0,
  seenFirstAttempt: new Set(),
  firstAttemptResults: [],
  history: [],
  startedAt: 0,
  isComplete: false,

  start: (lessonId, crownLevel, prompts) => {
    set({
      lessonId,
      crownLevel,
      queue: prompts,
      totalExercises: prompts.length,
      seenFirstAttempt: new Set(),
      firstAttemptResults: [],
      history: [],
      startedAt: Date.now(),
      isComplete: false,
    });
  },

  recordOutcome: (outcome) => {
    const state = get();
    const [current, ...rest] = state.queue;
    if (!current) return;

    const isRetry = state.seenFirstAttempt.has(current.id);
    const seenFirstAttempt = new Set(state.seenFirstAttempt);
    const firstAttemptResults = [...state.firstAttemptResults];
    if (!isRetry) {
      seenFirstAttempt.add(current.id);
      firstAttemptResults.push({ kind: current.kind, correct: outcome.correct });
    }

    let nextQueue = rest;
    if (!outcome.correct) {
      nextQueue = dedupeAdjacent([...rest, current], current.cardId);
    } else {
      nextQueue = dedupeAdjacent(rest, undefined);
    }

    set({
      queue: nextQueue,
      seenFirstAttempt,
      firstAttemptResults,
      history: [...state.history, { prompt: current, outcome, isRetry }],
      isComplete: nextQueue.length === 0,
    });
  },

  reset: () =>
    set({
      lessonId: null,
      crownLevel: 1,
      queue: [],
      totalExercises: 0,
      seenFirstAttempt: new Set(),
      firstAttemptResults: [],
      history: [],
      startedAt: 0,
      isComplete: false,
    }),
}));
