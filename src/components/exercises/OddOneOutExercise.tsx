"use client";

import { useEffect, useState } from "react";
import type { OddOneOutPrompt } from "@/types/exercise";
import { useExercise } from "./ExerciseContext";
import { OptionButton } from "./shared/OptionButton";

export function OddOneOutExercise({ prompt }: { prompt: OddOneOutPrompt }) {
  const { phase, submitAnswer, setChecker, setOptionActivators } = useExercise();
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    setSelected(null);
  }, [prompt.id]);

  const choose = (i: number) => {
    setSelected(i);
    submitAnswer({ correct: i === prompt.oddIndex, userAnswer: prompt.options[i] });
  };

  useEffect(() => {
    if (phase !== "answering") {
      setChecker(null);
      setOptionActivators(null);
      return;
    }
    setChecker(null);
    setOptionActivators(prompt.options.map((_, i) => () => choose(i)));
    return () => setOptionActivators(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, prompt.id]);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        Quel mot n&apos;appartient pas au groupe ?
        {prompt.categoryHint && <span> ({prompt.categoryHint})</span>}
      </p>
      <div className="grid grid-cols-2 gap-3">
        {prompt.options.map((opt, i) => (
          <OptionButton
            key={opt}
            index={i}
            label={opt}
            selected={selected === i}
            correct={i === prompt.oddIndex}
            revealCorrect={phase !== "answering"}
            disabled={phase !== "answering"}
            onClick={() => choose(i)}
          />
        ))}
      </div>
    </div>
  );
}
