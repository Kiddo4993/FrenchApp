"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { MatchingPairsPrompt } from "@/types/exercise";
import { useExercise } from "./ExerciseContext";

interface GridItem {
  id: string;
  pairId: number;
  lang: "fr" | "en";
  text: string;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function MatchingPairsExercise({ prompt }: { prompt: MatchingPairsPrompt }) {
  const { phase, submitAnswer, setChecker } = useExercise();
  const items = useMemo<GridItem[]>(() => {
    const fr = prompt.pairs.map((p, i) => ({ id: `fr-${i}`, pairId: i, lang: "fr" as const, text: p.fr }));
    const en = prompt.pairs.map((p, i) => ({ id: `en-${i}`, pairId: i, lang: "en" as const, text: p.en }));
    return shuffle([...fr, ...en]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt.id]);

  const [selected, setSelected] = useState<string[]>([]);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [wrong, setWrong] = useState<string[]>([]);
  const [secondsLeft, setSecondsLeft] = useState(prompt.timeLimitSeconds ?? 0);

  useEffect(() => {
    setSelected([]);
    setMatched(new Set());
    setWrong([]);
    setSecondsLeft(prompt.timeLimitSeconds ?? 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt.id]);

  useEffect(() => {
    if (phase !== "answering" || !prompt.timeLimitSeconds) return;
    if (secondsLeft <= 0) {
      submitAnswer({ correct: matched.size === prompt.pairs.length, userAnswer: `${matched.size}/${prompt.pairs.length} paires` });
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, phase]);

  useEffect(() => {
    setChecker(null);
  }, [setChecker]);

  const onSelect = (item: GridItem) => {
    if (phase !== "answering" || matched.has(item.pairId) || wrong.length > 0) return;
    if (selected.includes(item.id)) return;

    if (selected.length === 0) {
      setSelected([item.id]);
      return;
    }

    const firstId = selected[0];
    const first = items.find((i) => i.id === firstId)!;
    if (first.lang === item.lang) {
      setSelected([item.id]);
      return;
    }

    if (first.pairId === item.pairId) {
      const nextMatched = new Set(matched).add(item.pairId);
      setMatched(nextMatched);
      setSelected([]);
      if (nextMatched.size === prompt.pairs.length) {
        submitAnswer({ correct: true, userAnswer: `${nextMatched.size}/${prompt.pairs.length} paires` });
      }
    } else {
      setWrong([firstId, item.id]);
      setTimeout(() => {
        setWrong([]);
        setSelected([]);
      }, 600);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Associez les paires françaises et anglaises</p>
        {prompt.timeLimitSeconds ? (
          <span className="text-sm font-medium tabular-nums">{secondsLeft}s</span>
        ) : null}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {items.map((item) => {
          const isMatched = matched.has(item.pairId);
          const isSelected = selected.includes(item.id);
          const isWrong = wrong.includes(item.id);
          return (
            <button
              key={item.id}
              type="button"
              disabled={isMatched || phase !== "answering"}
              onClick={() => onSelect(item)}
              className={cn(
                "flex min-h-16 items-center justify-center rounded-lg border-2 px-2 py-3 text-center text-sm transition-colors",
                item.lang === "fr" && "fr-text",
                isMatched && "border-transparent bg-transparent opacity-0",
                !isMatched && !isSelected && !isWrong && "border-border bg-card hover:border-primary/50",
                isSelected && !isWrong && "border-primary bg-accent",
                isWrong && "border-destructive bg-destructive/10",
              )}
            >
              {item.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}
