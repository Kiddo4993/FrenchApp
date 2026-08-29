"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ExerciseRenderer } from "@/components/exercises/ExerciseRenderer";
import { ExerciseShell } from "@/components/exercises/ExerciseShell";
import { HINT_ELIGIBLE_KINDS } from "@/lib/exercises/grading";
import { useLessonSessionStore } from "@/stores/lesson-session";
import { finalizeLessonSession, submitExerciseResult, type LessonSessionSummary } from "@/server/actions";
import type { ExerciseOutcome, ExercisePrompt } from "@/types/exercise";
import { LessonResults } from "./LessonResults";

export function LessonRunner({
  lessonId,
  crownLevelAttempted,
  initialPrompts,
}: {
  lessonId: string;
  crownLevelAttempted: number;
  initialPrompts: ExercisePrompt[];
}) {
  const { queue, totalExercises, isComplete, firstAttemptResults, recordOutcome, start, reset } =
    useLessonSessionStore();
  const [summary, setSummary] = useState<LessonSessionSummary | null>(null);
  const finalizing = useRef(false);

  useEffect(() => {
    start(lessonId, crownLevelAttempted, initialPrompts);
    return () => reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  useEffect(() => {
    if (!isComplete || finalizing.current || summary) return;
    finalizing.current = true;
    finalizeLessonSession(lessonId, crownLevelAttempted, firstAttemptResults)
      .then(setSummary)
      .catch(() => {
        toast.error("Impossible d'enregistrer les résultats de la leçon.");
        finalizing.current = false;
      });
  }, [isComplete, lessonId, crownLevelAttempted, firstAttemptResults, summary]);

  if (summary) return <LessonResults summary={summary} lessonId={lessonId} />;

  const current = queue[0];
  if (!current) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-10 text-center text-muted-foreground">
        Enregistrement de la leçon…
      </div>
    );
  }

  const completedCount = totalExercises - queue.length;

  const handleComplete = (outcome: ExerciseOutcome) => {
    if (current.cardId) {
      submitExerciseResult({
        lessonId,
        cardId: current.cardId,
        kind: current.kind,
        correct: outcome.correct,
        latencyMs: outcome.latencyMs,
        hintUsed: outcome.hintUsed,
      }).catch(() => toast.error("Un mot n'a pas pu être enregistré."));
    } else {
      submitExerciseResult({
        lessonId,
        kind: current.kind,
        correct: outcome.correct,
        latencyMs: outcome.latencyMs,
        hintUsed: outcome.hintUsed,
      }).catch(() => {
        /* batch/curated kinds are XP-only; a logging failure here isn't user-visible */
      });
    }
    recordOutcome(outcome);
  };

  return (
    <ExerciseShell
      key={current.id}
      prompt={current}
      progress={{ current: completedCount + 1, total: totalExercises }}
      onComplete={handleComplete}
      hintAvailable={HINT_ELIGIBLE_KINDS.has(current.kind)}
      headerLeft={
        <Link href="/" aria-label="Quitter la leçon" className="text-muted-foreground hover:text-foreground">
          <X className="size-6" />
        </Link>
      }
    >
      <ExerciseRenderer prompt={current} />
    </ExerciseShell>
  );
}
