"use client";

import { useEffect } from "react";
import { Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSpeak } from "@/hooks/useSpeak";
import type { DictationPrompt } from "@/types/exercise";
import { HintReveal } from "./shared/HintReveal";
import { TypedAnswerField } from "./shared/TypedAnswerField";
import { useTypedAnswer } from "./shared/useTypedAnswer";

export function DictationExercise({ prompt }: { prompt: DictationPrompt }) {
  const { ref, value, setValue, insert, disabled, hintUsed } = useTypedAnswer(
    prompt.id,
    prompt.acceptedAnswers,
  );
  const { speak, speaking, supported } = useSpeak();

  useEffect(() => {
    if (supported) void speak(prompt.audioText);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt.id]);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <p className="text-sm text-muted-foreground">Écrivez exactement ce que vous entendez</p>
      <div className="flex justify-center">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => speak(prompt.audioText)}
          disabled={speaking || !supported}
          className="gap-2"
        >
          <Volume2 className={speaking ? "animate-pulse" : undefined} />
          Écouter
        </Button>
      </div>
      <TypedAnswerField
        inputRef={ref}
        value={value}
        onChange={setValue}
        onInsertAccent={insert}
        placeholder="Ce que vous avez entendu"
        disabled={disabled}
      />
      <HintReveal hintUsed={hintUsed} acceptedAnswers={prompt.acceptedAnswers} />
    </div>
  );
}
