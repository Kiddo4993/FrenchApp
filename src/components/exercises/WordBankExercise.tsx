"use client";

import type { WordBankPrompt } from "@/types/exercise";
import { SpeakerButton } from "./shared/SpeakerButton";
import { TileOrderer } from "./shared/TileOrderer";

export function WordBankExercise({ prompt }: { prompt: WordBankPrompt }) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <p className="text-sm text-muted-foreground">Assemblez la traduction en français</p>
      <div className="flex items-center gap-2">
        <p className="text-2xl">{prompt.promptText}</p>
        {prompt.promptAudioText && <SpeakerButton text={prompt.promptAudioText} />}
      </div>
      <TileOrderer promptId={prompt.id} tiles={prompt.tiles} correctOrder={prompt.correctOrder} />
    </div>
  );
}
