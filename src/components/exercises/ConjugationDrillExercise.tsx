"use client";

import type { ConjugationDrillPrompt } from "@/types/exercise";
import { TypedAnswerField } from "./shared/TypedAnswerField";
import { useTypedAnswer } from "./shared/useTypedAnswer";

export function ConjugationDrillExercise({ prompt }: { prompt: ConjugationDrillPrompt }) {
  const { ref, value, setValue, insert, disabled } = useTypedAnswer(
    prompt.id,
    prompt.acceptedAnswers,
  );

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-6 text-center">
      <p className="text-sm text-muted-foreground">Conjuguez au {prompt.tenseLabel}</p>
      <div className="fr-text flex items-baseline gap-3 text-3xl">
        <span className="text-muted-foreground">{prompt.subjectLabel}</span>
        <span className="font-medium">{prompt.infinitive}</span>
      </div>
      <div className="w-full max-w-xs">
        <TypedAnswerField
          inputRef={ref}
          value={value}
          onChange={setValue}
          onInsertAccent={insert}
          placeholder="Forme conjuguée"
          disabled={disabled}
        />
      </div>
    </div>
  );
}
