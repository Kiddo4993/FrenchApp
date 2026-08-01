"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { ReadingComprehensionPrompt } from "@/types/exercise";
import { useExercise } from "./ExerciseContext";

export function ReadingComprehensionExercise({ prompt }: { prompt: ReadingComprehensionPrompt }) {
  const { phase, submitAnswer, setChecker } = useExercise();
  const [answers, setAnswers] = useState<(number | null)[]>(prompt.questions.map(() => null));

  useEffect(() => {
    setAnswers(prompt.questions.map(() => null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt.id]);

  useEffect(() => {
    if (phase !== "answering" || answers.some((a) => a === null)) {
      setChecker(null);
      return;
    }
    setChecker(() => {
      const correctCount = answers.filter((a, i) => a === prompt.questions[i].answer).length;
      submitAnswer({
        correct: correctCount === prompt.questions.length,
        userAnswer: `${correctCount}/${prompt.questions.length} bonnes réponses`,
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, answers]);

  const revealed = phase !== "answering";

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="mb-2 text-sm font-medium text-muted-foreground">{prompt.title}</h3>
        <p className="fr-text max-h-64 overflow-y-auto text-lg leading-relaxed">{prompt.passage}</p>
      </div>
      <div className="flex flex-col gap-5">
        {prompt.questions.map((q, qi) => (
          <div key={q.q} className="flex flex-col gap-2">
            <p className="font-medium">{q.q}</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {q.options.map((opt, oi) => {
                const isSelected = answers[qi] === oi;
                const isCorrect = oi === q.answer;
                return (
                  <button
                    key={opt}
                    type="button"
                    disabled={revealed}
                    onClick={() =>
                      setAnswers((prev) => prev.map((a, i) => (i === qi ? oi : a)))
                    }
                    className={cn(
                      "rounded-lg border-2 px-3 py-2 text-left text-sm transition-colors",
                      "hover:border-primary/50 disabled:cursor-default",
                      !revealed && !isSelected && "border-border bg-card",
                      !revealed && isSelected && "border-primary bg-accent",
                      revealed && isCorrect && "border-[var(--chart-3)] bg-[color-mix(in_oklch,var(--chart-3),transparent_88%)]",
                      revealed && isSelected && !isCorrect && "border-destructive bg-destructive/10",
                      revealed && !isSelected && !isCorrect && "border-border bg-card opacity-60",
                    )}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
