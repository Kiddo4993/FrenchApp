"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { McqPrompt } from "@/types/exercise";
import { useExercise } from "./ExerciseContext";
import { OptionButton } from "./shared/OptionButton";
import { SpeakerButton } from "./shared/SpeakerButton";

export function McqExercise({ prompt }: { prompt: McqPrompt }) {
  const { phase, submitAnswer, setChecker, setOptionActivators } = useExercise();
  const [selected, setSelected] = useState<number | null>(null);
  const promptIsFrench = prompt.kind === "mcq_recognition";

  useEffect(() => {
    setSelected(null);
  }, [prompt.id]);

  const choose = (i: number) => {
    setSelected(i);
    submitAnswer({ correct: i === prompt.correctIndex, userAnswer: prompt.options[i] });
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
        {prompt.kind === "mcq_recognition" ? "Que veut dire ce mot ?" : "Comment dit-on ceci en français ?"}
      </p>
      <div className="flex items-center gap-2">
        <p className={cn("text-2xl", promptIsFrench && "fr-text")}>{prompt.promptText}</p>
        {prompt.promptAudioText && <SpeakerButton text={prompt.promptAudioText} />}
      </div>
      <div className="flex flex-col gap-2">
        {prompt.options.map((opt, i) => (
          <OptionButton
            key={opt}
            index={i}
            label={opt}
            frText={!promptIsFrench}
            selected={selected === i}
            correct={i === prompt.correctIndex}
            revealCorrect={phase !== "answering"}
            disabled={phase !== "answering"}
            onClick={() => choose(i)}
          />
        ))}
      </div>
    </div>
  );
}
