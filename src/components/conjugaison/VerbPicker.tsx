"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TrainerVerb } from "./types";

const GROUP_LABELS: Record<TrainerVerb["group"], string> = {
  er: "-er",
  ir: "-ir",
  re: "-re",
  irregular: "irrégulier",
};

export function VerbPicker({
  verbs,
  value,
  onChange,
}: {
  verbs: TrainerVerb[];
  value: string;
  onChange: (infinitive: string) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as string)}>
      <SelectTrigger className="fr-text h-11 w-full text-base" aria-label="Choisir un verbe">
        <SelectValue placeholder="Choisir un verbe" />
      </SelectTrigger>
      <SelectContent>
        {verbs.map((verb) => (
          <SelectItem key={verb.infinitive} value={verb.infinitive} className="fr-text">
            {verb.infinitive}
            <span className="text-xs text-muted-foreground">
              {" "}
              ({GROUP_LABELS[verb.group]})
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
