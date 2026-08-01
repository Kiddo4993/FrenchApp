"use client";

import { useEffect, useState } from "react";
import { Mic, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { recognitionService } from "@/lib/audio";
import { matchAnswer, isPassing } from "@/lib/answer-matching";
import type { SpeakingPrompt } from "@/types/exercise";
import { useExercise } from "./ExerciseContext";
import { SpeakerButton } from "./shared/SpeakerButton";

type ListenState = "idle" | "listening" | "error";

export function SpeakingExercise({ prompt }: { prompt: SpeakingPrompt }) {
  const { phase, submitAnswer, setChecker } = useExercise();
  const [state, setState] = useState<ListenState>("idle");
  const [heard, setHeard] = useState<string | null>(null);
  const supported = recognitionService.isSupported();

  useEffect(() => {
    setState("idle");
    setHeard(null);
  }, [prompt.id]);

  useEffect(() => {
    setChecker(null);
  }, [setChecker]);

  const startListening = async () => {
    setState("listening");
    try {
      const result = await recognitionService.listen({ lang: "fr-FR" });
      setHeard(result.transcript);
      const match = matchAnswer(result.transcript, [prompt.targetText]);
      submitAnswer({ correct: isPassing(match.status), userAnswer: result.transcript });
      setState("idle");
    } catch {
      setState("error");
    }
  };

  const skip = () => {
    submitAnswer({ correct: true, userAnswer: "(passé)" });
  };

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-6 text-center">
      <p className="text-sm text-muted-foreground">Prononcez la phrase suivante</p>
      <div className="flex items-center gap-2">
        <p className="fr-text text-2xl">{prompt.targetText}</p>
        <SpeakerButton text={prompt.targetText} />
      </div>
      <p className="text-muted-foreground">{prompt.translationHint}</p>

      {phase === "answering" && (
        <div className="flex flex-col items-center gap-3">
          {supported ? (
            <Button
              type="button"
              size="lg"
              onClick={startListening}
              disabled={state === "listening"}
              className="gap-2"
            >
              <Mic className={state === "listening" ? "animate-pulse" : undefined} />
              {state === "listening" ? "Écoute en cours..." : "Parler"}
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">
              La reconnaissance vocale n&apos;est pas disponible sur cet appareil.
            </p>
          )}
          {state === "error" && (
            <p className="text-sm text-destructive">Je n&apos;ai rien entendu. Réessayez.</p>
          )}
          <Button type="button" variant="ghost" size="sm" onClick={skip} className="gap-1.5">
            <SkipForward className="size-4" />
            Passer
          </Button>
        </div>
      )}

      {phase !== "answering" && heard && (
        <p className="text-sm text-muted-foreground">
          Vous avez dit : <span className="fr-text">&laquo;&nbsp;{heard}&nbsp;&raquo;</span>
        </p>
      )}
    </div>
  );
}
