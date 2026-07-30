import { IMPERSONAL_VERBS, IRREGULAR_VERBS, irregularVerbToRows } from "./irregulars";
import {
  buildCompoundRows,
  conjugateRegular,
  regularConjugationToRows,
} from "./regular";
import type { ConjugatedVerb, ConjugationRow } from "./types";
import type { VerbListEntry } from "./verbList";

export * from "./types";
export { agreePastParticiple } from "./agreement";
export { VERB_LIST } from "./verbList";
export type { VerbListEntry } from "./verbList";

function filterImpersonal(infinitive: string, rows: ConjugationRow[]): ConjugationRow[] {
  if (!IMPERSONAL_VERBS.has(infinitive)) return rows;
  return rows.filter((r) => r.person === "3s" || r.tense === "imperatif");
}

export function conjugateVerb(entry: VerbListEntry): ConjugatedVerb {
  let pastParticiple: string;
  let baseRows: ConjugationRow[];

  if (entry.group === "irregular") {
    const def = IRREGULAR_VERBS.find((v) => v.infinitive === entry.infinitive);
    if (!def) {
      throw new Error(`No irregular definition found for "${entry.infinitive}"`);
    }
    pastParticiple = def.pastParticiple;
    baseRows = irregularVerbToRows(def);
  } else {
    const conjugation = conjugateRegular(entry.infinitive, entry.group);
    pastParticiple = conjugation.pastParticiple;
    baseRows = regularConjugationToRows(conjugation);
  }

  const compoundRows = [
    ...buildCompoundRows("passe_compose", entry.auxiliary, pastParticiple),
    ...buildCompoundRows("plus_que_parfait", entry.auxiliary, pastParticiple),
  ];

  const allRows = filterImpersonal(entry.infinitive, [...baseRows, ...compoundRows]);

  return {
    infinitive: entry.infinitive,
    group: entry.group,
    auxiliary: entry.auxiliary,
    pastParticiple,
    conjugations: allRows,
  };
}
