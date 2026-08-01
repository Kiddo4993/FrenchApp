"use client";

import type { SentenceOrderingPrompt } from "@/types/exercise";
import { TileOrderer } from "./shared/TileOrderer";

export function SentenceOrderingExercise({ prompt }: { prompt: SentenceOrderingPrompt }) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <p className="text-sm text-muted-foreground">Remettez les mots dans le bon ordre</p>
      <p className="text-lg text-muted-foreground">{prompt.translation}</p>
      <TileOrderer promptId={prompt.id} tiles={prompt.tiles} correctOrder={prompt.correctOrder} />
    </div>
  );
}
