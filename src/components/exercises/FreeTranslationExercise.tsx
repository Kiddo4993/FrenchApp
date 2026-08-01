"use client";

import type { FreeTranslationPrompt } from "@/types/exercise";
import { SpeakerButton } from "./shared/SpeakerButton";
import { TypedAnswerField } from "./shared/TypedAnswerField";
import { useTypedAnswer } from "./shared/useTypedAnswer";

export function FreeTranslationExercise({ prompt }: { prompt: FreeTranslationPrompt }) {
  const { ref, value, setValue, insert, disabled } = useTypedAnswer(
    prompt.id,
    prompt.acceptedAnswers,
  );

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <p className="text-sm text-muted-foreground">Traduisez en français</p>
      <div className="flex items-center gap-2">
        <p className="text-2xl">{prompt.promptText}</p>
        {prompt.promptAudioText && <SpeakerButton text={prompt.promptAudioText} />}
      </div>
      <TypedAnswerField
        inputRef={ref}
        value={value}
        onChange={setValue}
        onInsertAccent={insert}
        placeholder="Votre réponse en français"
        disabled={disabled}
      />
    </div>
  );
}
