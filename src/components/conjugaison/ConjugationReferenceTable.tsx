import { PERSONS, TENSES } from "@/lib/conjugation";
import { PERSON_LABELS, TENSE_LABELS } from "@/lib/conjugation-labels";
import type { TrainerVerb } from "./types";

/** Full 8-tense × 6-person conjugation grid for one verb — pulled from the DB (getVerbWithConjugations upstream), not the conjugation engine directly. */
export function ConjugationReferenceTable({ verb }: { verb: TrainerVerb }) {
  const formByTensePerson = new Map(verb.rows.map((r) => [`${r.tense}:${r.person}`, r.form]));

  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <caption className="sr-only">
          Tableau de conjugaison complet pour {verb.infinitive}
        </caption>
        <thead>
          <tr className="bg-muted">
            <th scope="col" className="sticky left-0 bg-muted px-3 py-2 text-left font-medium">
              Temps
            </th>
            {PERSONS.map((p) => (
              <th key={p} scope="col" className="fr-text px-3 py-2 text-left font-medium whitespace-nowrap">
                {PERSON_LABELS[p]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {TENSES.map((t) => (
            <tr key={t}>
              <th
                scope="row"
                className="sticky left-0 bg-card px-3 py-2 text-left font-normal whitespace-nowrap text-foreground/90"
              >
                {TENSE_LABELS[t]}
              </th>
              {PERSONS.map((p) => {
                const form = formByTensePerson.get(`${t}:${p}`);
                return (
                  <td key={p} className="fr-text px-3 py-2 whitespace-nowrap">
                    {form ?? <span className="text-muted-foreground">—</span>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
