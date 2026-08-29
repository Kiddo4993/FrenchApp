"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TypedAnswerField } from "@/components/exercises/shared/TypedAnswerField";
import { useAccentInput } from "@/hooks/useAccentInput";
import { isPassing, matchAnswer } from "@/lib/answer-matching";
import { PERSON_LABELS, TENSE_LABELS } from "@/lib/conjugation-labels";
import { TENSES, type Person, type Tense } from "@/lib/conjugation";
import { shuffle } from "@/lib/exercises/generate";
import { cn } from "@/lib/utils";
import type { TrainerVerb } from "./types";

type Phase = "answering" | "correct" | "incorrect";
type AccuracyMatrix = Record<Tense, { correct: number; total: number }>;

function emptyAccuracy(): AccuracyMatrix {
  return Object.fromEntries(TENSES.map((t) => [t, { correct: 0, total: 0 }])) as AccuracyMatrix;
}

/**
 * Verb+tense picker that drills the learner one person at a time: infinitive + subject + tense
 * shown, they type the form, graded via the same accent-tolerant matchAnswer/isPassing pattern
 * (and the same TypedAnswerField/AccentBar UI) as ConjugationDrillExercise inside real lessons —
 * but standalone, practice-only, and not persisted to the SRS (see PLAN.md §6).
 */
export function ConjugationDrill({ verb }: { verb: TrainerVerb }) {
  const [tense, setTense] = useState<Tense>("present");
  const [queue, setQueue] = useState<Person[]>([]);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("answering");
  const [accuracy, setAccuracy] = useState<AccuracyMatrix>(emptyAccuracy);
  const { ref, value, setValue, insert } = useAccentInput("");

  const rowsForTense = useMemo(() => verb.rows.filter((r) => r.tense === tense), [verb.rows, tense]);
  const rowByPerson = useMemo(
    () => new Map(rowsForTense.map((r) => [r.person, r.form])),
    [rowsForTense],
  );

  // New verb or tense: reshuffle the person queue and reset the current question.
  useEffect(() => {
    setQueue(shuffle(rowsForTense.map((r) => r.person)));
    setIndex(0);
    setPhase("answering");
    setValue("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verb.infinitive, tense]);

  const currentPerson = queue[index] ?? null;
  const currentForm = currentPerson ? (rowByPerson.get(currentPerson) ?? null) : null;

  function check() {
    if (!currentForm || value.trim().length === 0) return;
    const result = matchAnswer(value, [currentForm]);
    const correct = isPassing(result.status);
    setAccuracy((prev) => ({
      ...prev,
      [tense]: { correct: prev[tense].correct + (correct ? 1 : 0), total: prev[tense].total + 1 },
    }));
    setPhase(correct ? "correct" : "incorrect");
  }

  function advance() {
    const nextIndex = index + 1;
    if (nextIndex >= queue.length) {
      setQueue(shuffle(rowsForTense.map((r) => r.person)));
      setIndex(0);
    } else {
      setIndex(nextIndex);
    }
    setPhase("answering");
    setValue("");
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (phase === "answering") check();
    else advance();
  }

  return (
    <div className="flex flex-col gap-4">
      <Select value={tense} onValueChange={(v) => setTense(v as Tense)}>
        <SelectTrigger className="h-10 w-full" aria-label="Choisir un temps">
          <SelectValue placeholder="Choisir un temps" />
        </SelectTrigger>
        <SelectContent>
          {TENSES.map((t) => (
            <SelectItem key={t} value={t}>
              {TENSE_LABELS[t]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {!currentPerson || !currentForm ? (
        <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          <span className="fr-text">{verb.infinitive}</span> n&apos;a pas de forme à ce temps.
        </p>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="flex flex-col items-center gap-5 rounded-xl border bg-card px-6 py-8 text-center"
        >
          <p className="text-sm text-muted-foreground">
            Conjuguez au {TENSE_LABELS[tense].toLowerCase()}
          </p>
          <div className="fr-text flex items-baseline gap-3 text-3xl">
            <span className="text-muted-foreground">{PERSON_LABELS[currentPerson]}</span>
            <span className="font-medium">{verb.infinitive}</span>
          </div>

          <div className="w-full max-w-xs">
            <TypedAnswerField
              inputRef={ref}
              value={value}
              onChange={setValue}
              onInsertAccent={insert}
              placeholder="Forme conjuguée"
              disabled={phase !== "answering"}
            />
          </div>

          {phase !== "answering" && (
            <p
              className={cn(
                "flex items-center gap-1.5 text-sm font-medium",
                phase === "correct" ? "text-[var(--chart-3)]" : "text-destructive",
              )}
              role="status"
            >
              {phase === "correct" ? (
                <CheckCircle2 className="size-4 shrink-0" aria-hidden />
              ) : (
                <XCircle className="size-4 shrink-0" aria-hidden />
              )}
              {phase === "correct" ? (
                "Correct !"
              ) : (
                <span>
                  Réponse : <span className="fr-text">{currentForm}</span>
                </span>
              )}
            </p>
          )}

          <Button type="submit" disabled={phase === "answering" && value.trim().length === 0}>
            {phase === "answering" ? "Vérifier" : "Continuer"}
          </Button>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <caption className="sr-only">Précision par temps</caption>
          <tbody className="divide-y divide-border">
            {TENSES.map((t) => {
              const stats = accuracy[t];
              const pct = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : null;
              return (
                <tr key={t} className={cn(t === tense && "bg-accent")}>
                  <th scope="row" className="px-3 py-1.5 text-left font-normal text-foreground/90">
                    {TENSE_LABELS[t]}
                  </th>
                  <td className="px-3 py-1.5 text-right tabular-nums text-muted-foreground">
                    {pct === null ? "—" : `${pct}% (${stats.correct}/${stats.total})`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
