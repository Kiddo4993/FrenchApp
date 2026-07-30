export const TENSES = [
  "present",
  "passe_compose",
  "imparfait",
  "futur_simple",
  "conditionnel_present",
  "subjonctif_present",
  "plus_que_parfait",
  "imperatif",
] as const;
export type Tense = (typeof TENSES)[number];

export const PERSONS = ["1s", "2s", "3s", "1p", "2p", "3p"] as const;
export type Person = (typeof PERSONS)[number];

export type VerbGroup = "er" | "ir" | "re" | "irregular";
export type Auxiliary = "avoir" | "etre" | "both";

export interface ConjugationRow {
  tense: Tense;
  person: Person;
  form: string;
  isIrregular: boolean;
}

export interface ConjugatedVerb {
  infinitive: string;
  group: VerbGroup;
  auxiliary: Auxiliary;
  pastParticiple: string;
  conjugations: ConjugationRow[];
}
