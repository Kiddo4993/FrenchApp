"use client";

import type { RegisterSwapPrompt } from "@/types/exercise";
import { HintReveal } from "./shared/HintReveal";
import { TypedAnswerField } from "./shared/TypedAnswerField";
import { useTypedAnswer } from "./shared/useTypedAnswer";

export function RegisterSwapExercise({ prompt }: { prompt: RegisterSwapPrompt }) {
  const { ref, value, setValue, insert, disabled, hintUsed } = useTypedAnswer(
    prompt.id,
    prompt.acceptedSoutenuAnswers,
  );

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <p className="text-sm text-muted-foreground">Réécrivez en registre soutenu</p>
      <p className="fr-text rounded-xl border border-border bg-muted px-4 py-3 text-xl">
        {prompt.familierText}
      </p>
      <TypedAnswerField
        inputRef={ref}
        value={value}
        onChange={setValue}
        onInsertAccent={insert}
        placeholder="Version soutenue"
        disabled={disabled}
      />
      <HintReveal hintUsed={hintUsed} acceptedAnswers={prompt.acceptedSoutenuAnswers} />
    </div>
  );
}
