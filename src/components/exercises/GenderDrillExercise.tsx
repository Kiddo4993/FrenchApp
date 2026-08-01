"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { GenderDrillPrompt } from "@/types/exercise";
import { useExercise } from "./ExerciseContext";

export function GenderDrillExercise({ prompt }: { prompt: GenderDrillPrompt }) {
  const { phase, submitAnswer, setChecker, setOptionActivators } = useExercise();
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    setSelected(null);
  }, [prompt.id]);

  const choose = (article: string) => {
    setSelected(article);
    submitAnswer({ correct: article === prompt.correctArticle, userAnswer: article });
  };

  useEffect(() => {
    if (phase !== "answering") {
      setChecker(null);
      setOptionActivators(null);
      return;
    }
    setChecker(null);
    setOptionActivators(prompt.options.map((article) => () => choose(article)));
    return () => setOptionActivators(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, prompt.id]);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-8 text-center">
      <p className="text-sm text-muted-foreground">Quel est le bon article ?</p>
      <p className="fr-text text-4xl font-medium">{prompt.noun}</p>
      <div className="grid w-full grid-cols-2 gap-3">
        {prompt.options.map((article, i) => {
          const isSelected = selected === article;
          const isCorrect = article === prompt.correctArticle;
          const revealed = phase !== "answering";
          return (
            <button
              key={article}
              type="button"
              disabled={revealed}
              onClick={() => choose(article)}
              className={cn(
                "fr-text flex items-center justify-center gap-2 rounded-xl border-2 py-4 text-xl transition-colors",
                "hover:border-primary/50 disabled:cursor-default",
                !revealed && !isSelected && "border-border bg-card",
                !revealed && isSelected && "border-primary bg-accent",
                revealed && isCorrect && "border-[var(--chart-3)] bg-[color-mix(in_oklch,var(--chart-3),transparent_88%)]",
                revealed && isSelected && !isCorrect && "border-destructive bg-destructive/10",
                revealed && !isSelected && !isCorrect && "border-border bg-card opacity-60",
              )}
            >
              <span className="text-xs text-muted-foreground">{i + 1}</span>
              {article}
            </button>
          );
        })}
      </div>
    </div>
  );
}
