"use client";

import { createContext, useContext } from "react";
import type { ExerciseOutcome } from "@/types/exercise";

export type ExercisePhase = "answering" | "correct" | "incorrect";

export interface ExerciseContextValue {
  phase: ExercisePhase;
  hintUsed: boolean;
  /** child calls this once the learner has produced an answer to grade */
  submitAnswer: (outcome: Omit<ExerciseOutcome, "latencyMs" | "hintUsed">) => void;
  /** child registers a function the shell's shared "Check" button/Enter key will call, or null when not ready */
  setChecker: (fn: (() => void) | null) => void;
  /** child registers up to 4 functions for the 1-4 number-key shortcuts (MCQ-style types), or null */
  setOptionActivators: (fns: Array<() => void> | null) => void;
  requestHint: () => void;
}

export const ExerciseContext = createContext<ExerciseContextValue | null>(null);

export function useExercise(): ExerciseContextValue {
  const ctx = useContext(ExerciseContext);
  if (!ctx) throw new Error("useExercise must be used within an <ExerciseShell>");
  return ctx;
}
