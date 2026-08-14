"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { OptionButton } from "@/components/exercises/shared/OptionButton";
import { SpeakerButton } from "@/components/exercises/shared/SpeakerButton";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { VocabEntry } from "@/content/schema";
import { UNITS_SORTED } from "@/content/curriculum";
import { buildMcqPrompt } from "@/lib/exercises/generate";
import {
  CEFR_LEVELS,
  INITIAL_ADAPTIVE_STATE,
  levelIndexToCefr,
  nextAdaptiveState,
  PLACEMENT_QUESTION_COUNT,
  type AdaptiveState,
  type Cefr,
} from "@/lib/placement/adaptive";
import { submitPlacementTest } from "@/server/actions";
import type { McqPrompt } from "@/types/exercise";
import { PlacementResults } from "./PlacementResults";

interface AnswerRecord {
  questionId: string;
  correct: boolean;
}

/** Picks the next question at `levelIndex`, falling back to the nearest level with unused words
 * left if that level's (capped) pool has been exhausted — a safety net, not the common case. */
function pickNextQuestion(
  pools: Record<Cefr, VocabEntry[]>,
  levelIndex: number,
  usedIds: ReadonlySet<string>,
): McqPrompt | null {
  const order = [levelIndex];
  for (let d = 1; d < CEFR_LEVELS.length; d++) {
    if (levelIndex + d <= CEFR_LEVELS.length - 1) order.push(levelIndex + d);
    if (levelIndex - d >= 0) order.push(levelIndex - d);
  }
  for (const idx of order) {
    const level = CEFR_LEVELS[idx];
    const pool = pools[level];
    const candidates = pool.filter((v) => !usedIds.has(v.id));
    if (candidates.length > 0) {
      const target = candidates[Math.floor(Math.random() * candidates.length)];
      return buildMcqPrompt(pool, target, "mcq_recognition");
    }
  }
  return null;
}

export function PlacementRunner({ pools }: { pools: Record<Cefr, VocabEntry[]> }) {
  const [adaptive, setAdaptive] = useState<AdaptiveState>(INITIAL_ADAPTIVE_STATE);
  const [usedIds, setUsedIds] = useState<Set<string>>(() => new Set());
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [current, setCurrent] = useState<McqPrompt | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [phase, setPhase] = useState<"answering" | "feedback">("answering");
  const [finished, setFinished] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  useEffect(() => {
    setCurrent(pickNextQuestion(pools, INITIAL_ADAPTIVE_STATE.levelIndex, new Set()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finalLevel = useMemo(() => levelIndexToCefr(adaptive.levelIndex), [adaptive.levelIndex]);

  function choose(index: number) {
    if (!current || phase !== "answering") return;
    const correct = index === current.correctIndex;
    setSelected(index);
    setPhase("feedback");
    setAnswers((prev) => [...prev, { questionId: current.id, correct }]);
    const targetId = current.cardId;
    if (targetId) setUsedIds((prev) => new Set(prev).add(targetId));
    setAdaptive((prev) => nextAdaptiveState(prev, correct));
  }

  async function finish(finalAnswers: AnswerRecord[]) {
    const correctCount = finalAnswers.filter((a) => a.correct).length;
    const score = finalAnswers.length > 0 ? correctCount / finalAnswers.length : 0;
    const recommendedUnit =
      UNITS_SORTED.find((u) => u.level === finalLevel) ?? UNITS_SORTED[0];
    setFinished(true);
    try {
      await submitPlacementTest(score, recommendedUnit.slug, finalAnswers);
    } catch {
      setSaveFailed(true);
      toast.error("Le résultat du test n'a pas pu être enregistré.");
    }
  }

  function handleContinue() {
    if (!current) return;
    if (answers.length >= PLACEMENT_QUESTION_COUNT) {
      void finish(answers);
      return;
    }
    const next = pickNextQuestion(pools, adaptive.levelIndex, usedIds);
    setCurrent(next);
    setSelected(null);
    setPhase("answering");
    if (!next) void finish(answers);
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (finished || !current) return;
      if (phase === "answering" && ["1", "2", "3", "4"].includes(e.key)) {
        const idx = Number(e.key) - 1;
        if (idx < current.options.length) choose(idx);
      } else if (phase === "feedback" && e.key === "Enter") {
        e.preventDefault();
        handleContinue();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  if (finished) {
    const correctCount = answers.filter((a) => a.correct).length;
    const recommendedUnit = UNITS_SORTED.find((u) => u.level === finalLevel) ?? UNITS_SORTED[0];
    return (
      <PlacementResults
        correctCount={correctCount}
        totalCount={answers.length}
        finalLevel={finalLevel}
        recommendedUnitTitle={recommendedUnit.title}
        saveFailed={saveFailed}
      />
    );
  }

  if (!current) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-10 text-center text-muted-foreground">
        Préparation du test…
      </div>
    );
  }

  const questionNumber = Math.min(answers.length + 1, PLACEMENT_QUESTION_COUNT);
  const pct = Math.round(((questionNumber - 1) / PLACEMENT_QUESTION_COUNT) * 100);

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex items-center gap-3 px-4 py-3">
        <Link href="/" aria-label="Quitter le test" className="text-muted-foreground hover:text-foreground">
          <X className="size-6" />
        </Link>
        <Progress value={pct} className="flex-1" aria-label="Progression du test de positionnement" />
        <span className="text-xs tabular-nums text-muted-foreground">
          {questionNumber} / {PLACEMENT_QUESTION_COUNT}
        </span>
      </div>

      <div className="flex flex-1 flex-col justify-center px-4 py-6">
        <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
          <p className="text-sm text-muted-foreground">Que veut dire ce mot ?</p>
          <div className="flex items-center gap-2">
            <p className="fr-text text-2xl">{current.promptText}</p>
            {current.promptAudioText && <SpeakerButton text={current.promptAudioText} />}
          </div>
          <div className="flex flex-col gap-2">
            {current.options.map((opt, i) => (
              <OptionButton
                key={opt}
                index={i}
                label={opt}
                frText={false}
                selected={selected === i}
                correct={i === current.correctIndex}
                revealCorrect={phase !== "answering"}
                disabled={phase !== "answering"}
                onClick={() => choose(i)}
              />
            ))}
          </div>
        </div>
      </div>

      {phase === "feedback" && (
        <div
          className={
            selected === current.correctIndex
              ? "sticky bottom-0 border-t border-[color-mix(in_oklch,var(--chart-3),transparent_50%)] bg-[color-mix(in_oklch,var(--chart-3),transparent_85%)] px-4 py-4"
              : "sticky bottom-0 border-t border-destructive/30 bg-destructive/10 px-4 py-4"
          }
        >
          <div className="mx-auto flex max-w-xl items-center justify-between gap-4">
            <p className="font-medium">
              {selected === current.correctIndex ? "Correct !" : "Pas tout à fait"}
            </p>
            <Button onClick={handleContinue} autoFocus>
              {answers.length >= PLACEMENT_QUESTION_COUNT ? "Voir mes résultats" : "Continuer"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
