"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Lightbulb, XCircle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { ExerciseOutcome, ExercisePrompt } from "@/types/exercise";
import { ExerciseContext, type ExercisePhase } from "./ExerciseContext";

export interface ExerciseShellProps {
  prompt: ExercisePrompt;
  /** 1-based position and total, drives the top progress bar */
  progress: { current: number; total: number };
  onComplete: (outcome: ExerciseOutcome) => void;
  children: React.ReactNode;
  /** whether a hint affordance should be offered at all for this prompt */
  hintAvailable?: boolean;
  /** rendered before the progress bar in the same row, e.g. a "quit lesson" close button */
  headerLeft?: React.ReactNode;
}

export function ExerciseShell({
  prompt,
  progress,
  onComplete,
  children,
  hintAvailable = false,
  headerLeft,
}: ExerciseShellProps) {
  const [phase, setPhase] = useState<ExercisePhase>("answering");
  const [hintUsed, setHintUsed] = useState(false);
  const [, setPendingOutcome] = useState<Omit<
    ExerciseOutcome,
    "latencyMs" | "hintUsed"
  > | null>(null);
  const [checker, setCheckerState] = useState<(() => void) | null>(null);
  const startRef = useRef<number>(Date.now());
  const optionActivatorsRef = useRef<Array<() => void> | null>(null);

  useEffect(() => {
    // Deliberately does NOT reset checker/optionActivators here: child effects (which also key
    // off prompt.id) run before this parent effect and register the new prompt's handlers —
    // clobbering them here would race and leave 1-4 shortcuts dead. See DECISIONS.md.
    setPhase("answering");
    setHintUsed(false);
    setPendingOutcome(null);
    startRef.current = Date.now();
  }, [prompt.id]);

  const submitAnswer = useCallback((outcome: Omit<ExerciseOutcome, "latencyMs" | "hintUsed">) => {
    setPendingOutcome(outcome);
    setPhase(outcome.correct ? "correct" : "incorrect");
  }, []);

  const advance = useCallback(() => {
    setPendingOutcome((current) => {
      if (current) {
        onComplete({ ...current, latencyMs: Date.now() - startRef.current, hintUsed });
      }
      return current;
    });
  }, [hintUsed, onComplete]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Enter") {
        e.preventDefault();
        if (phase === "answering") checker?.();
        else advance();
        return;
      }
      if (phase === "answering" && ["1", "2", "3", "4"].includes(e.key)) {
        const idx = Number(e.key) - 1;
        optionActivatorsRef.current?.[idx]?.();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [phase, advance, checker]);

  const contextValue = {
    phase,
    hintUsed,
    submitAnswer,
    setChecker: useCallback((fn: (() => void) | null) => {
      setCheckerState(() => fn);
    }, []),
    setOptionActivators: useCallback((fns: Array<() => void> | null) => {
      optionActivatorsRef.current = fns;
    }, []),
    requestHint: useCallback(() => setHintUsed(true), []),
  };

  const pct = Math.round((progress.current / Math.max(1, progress.total)) * 100);

  return (
    <ExerciseContext.Provider value={contextValue}>
      <div className="flex min-h-full flex-col">
        <div className="flex items-center gap-3 px-4 py-3">
          {headerLeft}
          <Progress value={pct} className="flex-1" aria-label="Progression de la leçon" />
          {hintAvailable && phase === "answering" && (
            <button
              type="button"
              onClick={() => setHintUsed(true)}
              aria-label="Indice"
              className="text-muted-foreground hover:text-accent-foreground transition-colors"
            >
              <Lightbulb className={cn("size-5", hintUsed && "fill-gold text-gold")} />
            </button>
          )}
        </div>

        <div className="flex flex-1 flex-col justify-center px-4 py-6">{children}</div>

        <AnimatePresence>
          {phase === "answering" ? (
            <motion.div
              key="check"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: "spring", duration: 0.2, bounce: 0.1 }}
              className="sticky bottom-0 border-t bg-background px-4 py-4"
            >
              <div className="mx-auto flex max-w-xl justify-end">
                <Button onClick={() => checker?.()} disabled={!checker}>
                  Vérifier
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="feedback"
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ type: "spring", duration: 0.25, bounce: 0.15 }}
              className={cn(
                "sticky bottom-0 border-t px-4 py-4",
                phase === "correct"
                  ? "bg-[color-mix(in_oklch,var(--chart-3),transparent_85%)] border-[color-mix(in_oklch,var(--chart-3),transparent_50%)]"
                  : "bg-destructive/10 border-destructive/30",
              )}
            >
              <div className="mx-auto flex max-w-xl items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  {phase === "correct" ? (
                    <CheckCircle2 className="size-6 shrink-0 text-[var(--chart-3)]" />
                  ) : (
                    <XCircle className="size-6 shrink-0 text-destructive" />
                  )}
                  <div>
                    <p className="font-medium">
                      {phase === "correct" ? "Correct !" : "Pas tout à fait"}
                    </p>
                    {prompt.explanation && phase === "incorrect" && (
                      <p className="text-sm text-muted-foreground">{prompt.explanation}</p>
                    )}
                  </div>
                </div>
                <Button onClick={advance} autoFocus>
                  Continuer
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ExerciseContext.Provider>
  );
}
