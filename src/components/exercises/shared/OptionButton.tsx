"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function OptionButton({
  index,
  label,
  selected,
  correct,
  revealCorrect,
  disabled,
  onClick,
  frText = true,
}: {
  index: number;
  label: string;
  selected: boolean;
  correct: boolean;
  /** true once feedback phase has started — shows correct/incorrect styling */
  revealCorrect: boolean;
  disabled: boolean;
  onClick: () => void;
  frText?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const justRevealedWrong = revealCorrect && selected && !correct;

  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={onClick}
      whileHover={!disabled && !reduceMotion ? { scale: 1.015 } : undefined}
      whileTap={!disabled && !reduceMotion ? { scale: 0.98 } : undefined}
      animate={
        justRevealedWrong && !reduceMotion
          ? { x: [0, -6, 6, -4, 4, 0] }
          : revealCorrect && correct && !reduceMotion
            ? { scale: [1, 1.03, 1] }
            : { scale: 1, x: 0 }
      }
      transition={
        justRevealedWrong
          ? { duration: 0.4, ease: "easeInOut" }
          : { type: "spring", stiffness: 400, damping: 20 }
      }
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-colors",
        "hover:border-primary/50 disabled:cursor-default",
        frText && "fr-text",
        !revealCorrect && !selected && "border-border bg-card",
        !revealCorrect && selected && "border-primary bg-accent",
        revealCorrect && correct && "border-[var(--chart-3)] bg-[color-mix(in_oklch,var(--chart-3),transparent_88%)]",
        revealCorrect && selected && !correct && "border-destructive bg-destructive/10",
        revealCorrect && !selected && !correct && "border-border bg-card opacity-60",
      )}
    >
      <span
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-md border text-xs font-medium transition-colors",
          revealCorrect && correct
            ? "border-[var(--chart-3)] bg-[var(--chart-3)] text-white"
            : revealCorrect && selected && !correct
              ? "border-destructive bg-destructive text-white"
              : "border-border text-muted-foreground",
        )}
      >
        {revealCorrect && correct ? (
          <Check className="size-3.5" strokeWidth={3} />
        ) : revealCorrect && selected && !correct ? (
          <X className="size-3.5" strokeWidth={3} />
        ) : (
          index + 1
        )}
      </span>
      <span className="text-base">{label}</span>
    </motion.button>
  );
}
