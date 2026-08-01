"use client";

import { useEffect } from "react";
import { isPassing, matchAnswer } from "@/lib/answer-matching";
import { useAccentInput } from "@/hooks/useAccentInput";
import { useExercise } from "../ExerciseContext";

/**
 * Shared submit logic for every typed-answer exercise type (dictation, free translation,
 * cloze, conjugation drill, register swap): accent-aware input + fuzzy/accent-tolerant
 * grading via matchAnswer, wired into the shell's Check button / Enter key.
 */
export function useTypedAnswer(promptId: string, acceptedAnswers: string[]) {
  const { phase, submitAnswer, setChecker } = useExercise();
  const { ref, value, setValue, insert } = useAccentInput("");

  useEffect(() => {
    setValue("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [promptId]);

  useEffect(() => {
    if (phase !== "answering" || value.trim().length === 0) {
      setChecker(null);
      return;
    }
    setChecker(() => {
      const result = matchAnswer(value, acceptedAnswers);
      submitAnswer({ correct: isPassing(result.status), userAnswer: value, matchStatus: result.status });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, value, acceptedAnswers]);

  return { ref, value, setValue, insert, disabled: phase !== "answering" };
}
