"use client";

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
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
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
      <span className="flex size-6 shrink-0 items-center justify-center rounded-md border border-border text-xs font-medium text-muted-foreground">
        {index + 1}
      </span>
      <span className="text-base">{label}</span>
    </button>
  );
}
