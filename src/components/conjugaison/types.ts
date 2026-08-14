import type { Auxiliary, Person, Tense, VerbGroup } from "@/lib/conjugation";

export interface TrainerConjugationRow {
  tense: Tense;
  person: Person;
  form: string;
}

export interface TrainerVerb {
  infinitive: string;
  group: VerbGroup;
  auxiliary: Auxiliary;
  frequencyRank: number;
  rows: TrainerConjugationRow[];
}
