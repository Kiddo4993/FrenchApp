"use client";

import type { ClozePrompt } from "@/types/exercise";
import { Input } from "@/components/ui/input";
import { AccentBar } from "./shared/AccentBar";
import { useTypedAnswer } from "./shared/useTypedAnswer";

export function ClozeExercise({ prompt }: { prompt: ClozePrompt }) {
  const { ref, value, setValue, insert, disabled } = useTypedAnswer(
    prompt.id,
    prompt.acceptedAnswers,
  );

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        Complétez la phrase{prompt.hint ? ` — indice : ${prompt.hint}` : ""}
      </p>
      <p className="fr-text flex flex-wrap items-center gap-2 text-2xl leading-relaxed">
        <span>{prompt.before}</span>
        <Input
          ref={ref}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={disabled}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className="fr-text inline-flex h-10 w-40 text-xl"
        />
        <span>{prompt.after}</span>
      </p>
      <AccentBar onInsert={insert} />
    </div>
  );
}
