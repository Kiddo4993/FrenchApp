"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useExercise } from "../ExerciseContext";

interface TileInstance {
  id: string;
  text: string;
}

export function TileOrderer({
  promptId,
  tiles,
  correctOrder,
}: {
  promptId: string;
  tiles: string[];
  correctOrder: string[];
}) {
  const { phase, submitAnswer, setChecker } = useExercise();
  const [pool, setPool] = useState<TileInstance[]>([]);
  const [selected, setSelected] = useState<TileInstance[]>([]);

  useEffect(() => {
    setPool(tiles.map((text, i) => ({ id: `${promptId}-${i}`, text })));
    setSelected([]);
  }, [promptId, tiles]);

  const selectTile = (tile: TileInstance) => {
    setPool((p) => p.filter((t) => t.id !== tile.id));
    setSelected((s) => [...s, tile]);
  };

  const deselectTile = (tile: TileInstance) => {
    setSelected((s) => s.filter((t) => t.id !== tile.id));
    setPool((p) => [...p, tile]);
  };

  useEffect(() => {
    if (phase !== "answering") {
      setChecker(null);
      return;
    }
    if (selected.length !== tiles.length) {
      setChecker(null);
      return;
    }
    setChecker(() => {
      const userAnswer = selected.map((t) => t.text).join(" ");
      const correct = userAnswer === correctOrder.join(" ");
      submitAnswer({ correct, userAnswer });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, selected, tiles.length, correctOrder]);

  const revealed = phase !== "answering";

  return (
    <div className="flex flex-col gap-4">
      <div
        className={cn(
          "fr-text flex min-h-14 flex-wrap items-center gap-2 rounded-xl border-2 border-dashed border-border p-3",
          selected.length === 0 && "items-center justify-center text-muted-foreground",
        )}
      >
        {selected.length === 0 && <span className="text-sm">Touchez les mots ci-dessous</span>}
        {selected.map((tile) => (
          <button
            key={tile.id}
            type="button"
            disabled={revealed}
            onClick={() => deselectTile(tile)}
            className="rounded-lg border border-primary bg-accent px-3 py-1.5 text-lg text-accent-foreground transition-transform hover:scale-[1.03] disabled:cursor-default"
          >
            {tile.text}
          </button>
        ))}
      </div>
      <div className="fr-text flex flex-wrap gap-2">
        {pool.map((tile) => (
          <button
            key={tile.id}
            type="button"
            disabled={revealed}
            onClick={() => selectTile(tile)}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-lg transition-transform hover:scale-[1.03] disabled:cursor-default disabled:opacity-40"
          >
            {tile.text}
          </button>
        ))}
      </div>
    </div>
  );
}
