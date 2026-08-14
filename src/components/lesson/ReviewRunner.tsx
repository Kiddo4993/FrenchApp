"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ExerciseRenderer } from "@/components/exercises/ExerciseRenderer";
import { ExerciseShell } from "@/components/exercises/ExerciseShell";
import { useLessonSessionStore } from "@/stores/lesson-session";
import { finalizeReviewSession, submitExerciseResult, type ReviewSessionSummary } from "@/server/actions";
import type { ExerciseKind, ExerciseOutcome, ExercisePrompt } from "@/types/exercise";
import { ReviewResults } from "./ReviewResults";

const HINT_ELIGIBLE_KINDS: ReadonlySet<ExerciseKind> = new Set([
  "free_translation",
  "cloze",
  "dictation",
  "conjugation_drill",
  "register_swap",
]);

const REVIEW_SESSION_ID = "__review__";

export function ReviewRunner({ initialPrompts }: { initialPrompts: ExercisePrompt[] }) {
  const { queue, totalExercises, isComplete, firstAttemptResults, recordOutcome, start, reset } =
    useLessonSessionStore();
  const [summary, setSummary] = useState<ReviewSessionSummary | null>(null);
  const finalizing = useRef(false);

  useEffect(() => {
    start(REVIEW_SESSION_ID, 0, initialPrompts);
    return () => reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isComplete || finalizing.current || summary) return;
    finalizing.current = true;
    finalizeReviewSession(firstAttemptResults)
      .then(setSummary)
      .catch(() => {
        toast.error("Impossible d'enregistrer les résultats de la révision.");
        finalizing.current = false;
      });
  }, [isComplete, firstAttemptResults, summary]);

  if (summary) return <ReviewResults summary={summary} />;

  const current = queue[0];
  if (!current) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-10 text-center text-muted-foreground">
        Enregistrement de la révision…
      </div>
    );
  }

  const completedCount = totalExercises - queue.length;

  const handleComplete = (outcome: ExerciseOutcome) => {
    submitExerciseResult({
      cardId: current.cardId,
      kind: current.kind,
      correct: outcome.correct,
      latencyMs: outcome.latencyMs,
      hintUsed: outcome.hintUsed,
    }).catch(() => {
      if (current.cardId) toast.error("Un mot n'a pas pu être enregistré.");
    });
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
        <Link href="/" aria-label="Quitter la révision" className="text-muted-foreground hover:text-foreground">
          <X className="size-6" />
        </Link>
      }
    >
      <ExerciseRenderer prompt={current} />
    </ExerciseShell>
  );
}
