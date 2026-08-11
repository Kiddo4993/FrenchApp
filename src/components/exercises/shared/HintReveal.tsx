import { Lightbulb } from "lucide-react";

/** Shown when the learner taps the shell's hint bulb — reveals the first letter only, so the
 * FSRS grade inference (hint usage ⇒ at best "hard") reflects a real, not cosmetic, assist. */
export function HintReveal({ hintUsed, acceptedAnswers }: { hintUsed: boolean; acceptedAnswers: string[] }) {
  if (!hintUsed || acceptedAnswers.length === 0) return null;
  const firstLetter = acceptedAnswers[0].trim().charAt(0).toUpperCase();
  return (
    <p className="flex items-center gap-1.5 text-sm text-gold">
      <Lightbulb className="size-4 fill-gold" aria-hidden />
      Indice : commence par « {firstLetter} »
    </p>
  );
}
