"use client";

import { Input } from "@/components/ui/input";
import { AccentBar } from "./AccentBar";

export function TypedAnswerField({
  inputRef,
  value,
  onChange,
  onInsertAccent,
  placeholder,
  disabled,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  value: string;
  onChange: (value: string) => void;
  onInsertAccent: (char: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1">
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        className="fr-text h-12 text-lg"
      />
      <AccentBar onInsert={onInsertAccent} />
    </div>
  );
}
