"use client";

import { useEffect, useState } from "react";
import { Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSpeak } from "@/hooks/useSpeak";
import type { ListeningPrompt } from "@/types/exercise";
import { useExercise } from "./ExerciseContext";
import { OptionButton } from "./shared/OptionButton";
import { TypedAnswerField } from "./shared/TypedAnswerField";
import { useTypedAnswer } from "./shared/useTypedAnswer";

function ListenButton({ audioText }: { audioText: string }) {
  const { speak, speaking, supported } = useSpeak();
  useEffect(() => {
    if (supported) void speak(audioText);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioText]);
  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      onClick={() => speak(audioText)}
      disabled={speaking || !supported}
      className="gap-2"
    >
      <Volume2 className={speaking ? "animate-pulse" : undefined} />
      Réécouter
    </Button>
  );
}

function ListeningChoice({ prompt }: { prompt: ListeningPrompt & { mode: "choice" } }) {
  const { phase, submitAnswer, setChecker, setOptionActivators } = useExercise();
  const [selected, setSelected] = useState<number | null>(null);
  const options = prompt.options ?? [];

  useEffect(() => setSelected(null), [prompt.id]);

  const choose = (i: number) => {
    setSelected(i);
    submitAnswer({ correct: i === prompt.correctIndex, userAnswer: options[i] });
  };

  useEffect(() => {
    if (phase !== "answering") {
      setChecker(null);
      setOptionActivators(null);
      return;
    }
    setChecker(null);
    setOptionActivators(options.map((_, i) => () => choose(i)));
    return () => setOptionActivators(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, prompt.id]);

  return (
    <div className="flex flex-col gap-2">
      {options.map((opt, i) => (
        <OptionButton
          key={opt}
          index={i}
          label={opt}
          selected={selected === i}
          correct={i === prompt.correctIndex}
          revealCorrect={phase !== "answering"}
          disabled={phase !== "answering"}
          onClick={() => choose(i)}
        />
      ))}
    </div>
  );
}

function ListeningType({ prompt }: { prompt: ListeningPrompt & { mode: "type" } }) {
  const { ref, value, setValue, insert, disabled } = useTypedAnswer(
    prompt.id,
    prompt.acceptedAnswers ?? [],
  );
  return (
    <TypedAnswerField
      inputRef={ref}
      value={value}
      onChange={setValue}
      onInsertAccent={insert}
      placeholder="Ce que vous avez entendu"
      disabled={disabled}
    />
  );
}

export function ListeningExercise({ prompt }: { prompt: ListeningPrompt }) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <p className="text-sm text-muted-foreground">Écoutez et répondez</p>
      <div className="flex justify-center">
        <ListenButton audioText={prompt.audioText} />
      </div>
      {prompt.mode === "choice" ? (
        <ListeningChoice prompt={prompt as ListeningPrompt & { mode: "choice" }} />
      ) : (
        <ListeningType prompt={prompt as ListeningPrompt & { mode: "type" }} />
      )}
    </div>
  );
}
