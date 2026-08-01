"use client";

const ACCENT_CHARS = ["é", "è", "ê", "à", "ç", "ù", "û", "î", "ï", "ô", "œ"];

export function AccentBar({ onInsert }: { onInsert: (char: string) => void }) {
  return (
    <div
      role="toolbar"
      aria-label="Caractères accentués"
      className="flex flex-wrap gap-1.5 py-2"
    >
      {ACCENT_CHARS.map((char) => (
        <button
          key={char}
          type="button"
          tabIndex={-1}
          onClick={() => onInsert(char)}
          className="fr-text flex size-8 items-center justify-center rounded-md border border-border bg-secondary text-sm text-secondary-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          {char}
        </button>
      ))}
    </div>
  );
}
