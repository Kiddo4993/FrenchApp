"use client";

import { useMemo, useState } from "react";
import { ConjugationDrill } from "./ConjugationDrill";
import { ConjugationReferenceTable } from "./ConjugationReferenceTable";
import { VerbPicker } from "./VerbPicker";
import type { TrainerVerb } from "./types";

/** One shared verb picker drives both the timed drill and the full reference grid below it. */
export function ConjugationTrainer({ verbs }: { verbs: TrainerVerb[] }) {
  const [infinitive, setInfinitive] = useState(verbs[0]?.infinitive ?? "");
  const verb = useMemo(
    () => verbs.find((v) => v.infinitive === infinitive) ?? verbs[0] ?? null,
    [verbs, infinitive],
  );

  if (!verb) {
    return <p className="text-sm text-muted-foreground">Aucun verbe disponible.</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      <VerbPicker verbs={verbs} value={verb.infinitive} onChange={setInfinitive} />

      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Entraînement
        </h2>
        <ConjugationDrill verb={verb} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Tableau de référence
        </h2>
        <ConjugationReferenceTable verb={verb} />
      </section>
    </div>
  );
}
