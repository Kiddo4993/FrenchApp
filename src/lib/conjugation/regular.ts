import { IRREGULAR_VERBS } from "./irregulars";
import type { Auxiliary, ConjugationRow, Person, VerbGroup } from "./types";

const PERSON_ORDER: Person[] = ["1s", "2s", "3s", "1p", "2p", "3p"];

const AVOIR = IRREGULAR_VERBS.find((v) => v.infinitive === "avoir")!;
const ETRE = IRREGULAR_VERBS.find((v) => v.infinitive === "être")!;

function auxTable(auxiliary: "avoir" | "etre", tense: "present" | "imparfait") {
  const def = auxiliary === "avoir" ? AVOIR : ETRE;
  return tense === "present" ? def.present : def.imparfait;
}

/** je/tu/il/nous/vous/ils, in that order, zipped with PERSON_ORDER */
function zip(forms: [string, string, string, string, string, string]): Record<Person, string> {
  const out = {} as Record<Person, string>;
  PERSON_ORDER.forEach((p, i) => {
    out[p] = forms[i];
  });
  return out;
}

/**
 * -er/-cer/-ger present + imparfait need a spelling tweak so the "soft" c/g sound is
 * preserved before endings starting with a or o (mangeons, commençons, mangeais...).
 * Only présent-nous and the je/tu/il/ils imparfait rows are affected — see DECISIONS.md
 * for the derivation showing every other row is naturally unaffected.
 */
function softenStem(stem: string, endingStartsWithAorO: boolean): string {
  if (!endingStartsWithAorO) return stem;
  if (stem.endsWith("g")) return `${stem}e`;
  if (stem.endsWith("c")) return `${stem.slice(0, -1)}ç`;
  return stem;
}

interface RegularConjugation {
  present: Record<Person, string>;
  imparfait: Record<Person, string>;
  futurSimple: Record<Person, string>;
  conditionnelPresent: Record<Person, string>;
  subjonctifPresent: Record<Person, string>;
  imperatif: { "2s": string; "1p": string; "2p": string };
  pastParticiple: string;
}

function conjugateEr(infinitive: string): RegularConjugation {
  const stem = infinitive.slice(0, -2); // drop "er"
  const present = zip([
    `${stem}e`,
    `${stem}es`,
    `${stem}e`,
    `${softenStem(stem, true)}ons`,
    `${stem}ez`,
    `${stem}ent`,
  ]);
  const imparfait = zip([
    `${softenStem(stem, true)}ais`,
    `${softenStem(stem, true)}ais`,
    `${softenStem(stem, true)}ait`,
    `${stem}ions`,
    `${stem}iez`,
    `${softenStem(stem, true)}aient`,
  ]);
  const futurSimple = zip([
    `${infinitive}ai`,
    `${infinitive}as`,
    `${infinitive}a`,
    `${infinitive}ons`,
    `${infinitive}ez`,
    `${infinitive}ont`,
  ]);
  const conditionnelPresent = zip([
    `${infinitive}ais`,
    `${infinitive}ais`,
    `${infinitive}ait`,
    `${infinitive}ions`,
    `${infinitive}iez`,
    `${infinitive}aient`,
  ]);
  const subjonctifPresent = zip([
    `${stem}e`,
    `${stem}es`,
    `${stem}e`,
    `${stem}ions`,
    `${stem}iez`,
    `${stem}ent`,
  ]);
  return {
    present,
    imparfait,
    futurSimple,
    conditionnelPresent,
    subjonctifPresent,
    imperatif: { "2s": `${stem}e`, "1p": `${softenStem(stem, true)}ons`, "2p": `${stem}ez` },
    pastParticiple: `${stem}é`,
  };
}

function conjugateIr(infinitive: string): RegularConjugation {
  const stem = infinitive.slice(0, -2); // drop "ir"
  const present = zip([
    `${stem}is`,
    `${stem}is`,
    `${stem}it`,
    `${stem}issons`,
    `${stem}issez`,
    `${stem}issent`,
  ]);
  const issStem = `${stem}iss`;
  const imparfait = zip([
    `${issStem}ais`,
    `${issStem}ais`,
    `${issStem}ait`,
    `${issStem}ions`,
    `${issStem}iez`,
    `${issStem}aient`,
  ]);
  const futurSimple = zip([
    `${infinitive}ai`,
    `${infinitive}as`,
    `${infinitive}a`,
    `${infinitive}ons`,
    `${infinitive}ez`,
    `${infinitive}ont`,
  ]);
  const conditionnelPresent = zip([
    `${infinitive}ais`,
    `${infinitive}ais`,
    `${infinitive}ait`,
    `${infinitive}ions`,
    `${infinitive}iez`,
    `${infinitive}aient`,
  ]);
  const subjonctifPresent = zip([
    `${issStem}e`,
    `${issStem}es`,
    `${issStem}e`,
    `${issStem}ions`,
    `${issStem}iez`,
    `${issStem}ent`,
  ]);
  return {
    present,
    imparfait,
    futurSimple,
    conditionnelPresent,
    subjonctifPresent,
    imperatif: { "2s": `${stem}is`, "1p": `${issStem}ons`, "2p": `${issStem}ez` },
    pastParticiple: `${stem}i`,
  };
}

function conjugateRe(infinitive: string): RegularConjugation {
  const stem = infinitive.slice(0, -2); // drop "re"
  const futurStem = infinitive.slice(0, -1); // drop final "e" -> "...r"
  const present = zip([
    `${stem}s`,
    `${stem}s`,
    stem,
    `${stem}ons`,
    `${stem}ez`,
    `${stem}ent`,
  ]);
  const imparfait = zip([
    `${stem}ais`,
    `${stem}ais`,
    `${stem}ait`,
    `${stem}ions`,
    `${stem}iez`,
    `${stem}aient`,
  ]);
  const futurSimple = zip([
    `${futurStem}ai`,
    `${futurStem}as`,
    `${futurStem}a`,
    `${futurStem}ons`,
    `${futurStem}ez`,
    `${futurStem}ont`,
  ]);
  const conditionnelPresent = zip([
    `${futurStem}ais`,
    `${futurStem}ais`,
    `${futurStem}ait`,
    `${futurStem}ions`,
    `${futurStem}iez`,
    `${futurStem}aient`,
  ]);
  const subjonctifPresent = zip([
    `${stem}e`,
    `${stem}es`,
    `${stem}e`,
    `${stem}ions`,
    `${stem}iez`,
    `${stem}ent`,
  ]);
  return {
    present,
    imparfait,
    futurSimple,
    conditionnelPresent,
    subjonctifPresent,
    imperatif: { "2s": `${stem}s`, "1p": `${stem}ons`, "2p": `${stem}ez` },
    pastParticiple: `${stem}u`,
  };
}

/**
 * Common -er verbs with a present-tense stem change (e/é + single consonant + er) or a
 * y->i shift before a silent-e ending. These are still pedagogically "-er verbs" (group
 * stays "er") but the spelling-change rule isn't the generic softenStem() rule above, so
 * they're hand-verified rather than derived. See DECISIONS.md.
 */
export const STEM_CHANGING_ER_VERBS: Record<string, RegularConjugation> = {
  acheter: {
    present: zip(["achète", "achètes", "achète", "achetons", "achetez", "achètent"]),
    imparfait: zip(["achetais", "achetais", "achetait", "achetions", "achetiez", "achetaient"]),
    futurSimple: zip(["achèterai", "achèteras", "achètera", "achèterons", "achèterez", "achèteront"]),
    conditionnelPresent: zip([
      "achèterais", "achèterais", "achèterait", "achèterions", "achèteriez", "achèteraient",
    ]),
    subjonctifPresent: zip(["achète", "achètes", "achète", "achetions", "achetiez", "achètent"]),
    imperatif: { "2s": "achète", "1p": "achetons", "2p": "achetez" },
    pastParticiple: "acheté",
  },
  appeler: {
    present: zip(["appelle", "appelles", "appelle", "appelons", "appelez", "appellent"]),
    imparfait: zip(["appelais", "appelais", "appelait", "appelions", "appeliez", "appelaient"]),
    futurSimple: zip([
      "appellerai", "appelleras", "appellera", "appellerons", "appellerez", "appelleront",
    ]),
    conditionnelPresent: zip([
      "appellerais", "appellerais", "appellerait", "appellerions", "appelleriez", "appelleraient",
    ]),
    subjonctifPresent: zip(["appelle", "appelles", "appelle", "appelions", "appeliez", "appellent"]),
    imperatif: { "2s": "appelle", "1p": "appelons", "2p": "appelez" },
    pastParticiple: "appelé",
  },
  jeter: {
    present: zip(["jette", "jettes", "jette", "jetons", "jetez", "jettent"]),
    imparfait: zip(["jetais", "jetais", "jetait", "jetions", "jetiez", "jetaient"]),
    futurSimple: zip(["jetterai", "jetteras", "jettera", "jetterons", "jetterez", "jetteront"]),
    conditionnelPresent: zip([
      "jetterais", "jetterais", "jetterait", "jetterions", "jetteriez", "jetteraient",
    ]),
    subjonctifPresent: zip(["jette", "jettes", "jette", "jetions", "jetiez", "jettent"]),
    imperatif: { "2s": "jette", "1p": "jetons", "2p": "jetez" },
    pastParticiple: "jeté",
  },
  préférer: {
    present: zip(["préfère", "préfères", "préfère", "préférons", "préférez", "préfèrent"]),
    imparfait: zip([
      "préférais", "préférais", "préférait", "préférions", "préfériez", "préféraient",
    ]),
    // é does not lower to è in the future/conditional under modern spelling conventions.
    futurSimple: zip([
      "préférerai", "préféreras", "préférera", "préférerons", "préférerez", "préféreront",
    ]),
    conditionnelPresent: zip([
      "préférerais", "préférerais", "préférerait", "préférerions", "préféreriez", "préféreraient",
    ]),
    subjonctifPresent: zip([
      "préfère", "préfères", "préfère", "préférions", "préfériez", "préfèrent",
    ]),
    imperatif: { "2s": "préfère", "1p": "préférons", "2p": "préférez" },
    pastParticiple: "préféré",
  },
  payer: {
    present: zip(["paie", "paies", "paie", "payons", "payez", "paient"]),
    imparfait: zip(["payais", "payais", "payait", "payions", "payiez", "payaient"]),
    futurSimple: zip(["paierai", "paieras", "paiera", "paierons", "paierez", "paieront"]),
    conditionnelPresent: zip([
      "paierais", "paierais", "paierait", "paierions", "paieriez", "paieraient",
    ]),
    subjonctifPresent: zip(["paie", "paies", "paie", "payions", "payiez", "paient"]),
    imperatif: { "2s": "paie", "1p": "payons", "2p": "payez" },
    pastParticiple: "payé",
  },
  employer: {
    present: zip(["emploie", "emploies", "emploie", "employons", "employez", "emploient"]),
    imparfait: zip([
      "employais", "employais", "employait", "employions", "employiez", "employaient",
    ]),
    futurSimple: zip([
      "emploierai", "emploieras", "emploiera", "emploierons", "emploierez", "emploieront",
    ]),
    conditionnelPresent: zip([
      "emploierais", "emploierais", "emploierait", "emploierions", "emploieriez", "emploieraient",
    ]),
    subjonctifPresent: zip([
      "emploie", "emploies", "emploie", "employions", "employiez", "emploient",
    ]),
    imperatif: { "2s": "emploie", "1p": "employons", "2p": "employez" },
    pastParticiple: "employé",
  },
  lever: {
    present: zip(["lève", "lèves", "lève", "levons", "levez", "lèvent"]),
    imparfait: zip(["levais", "levais", "levait", "levions", "leviez", "levaient"]),
    futurSimple: zip(["lèverai", "lèveras", "lèvera", "lèverons", "lèverez", "lèveront"]),
    conditionnelPresent: zip([
      "lèverais", "lèverais", "lèverait", "lèverions", "lèveriez", "lèveraient",
    ]),
    subjonctifPresent: zip(["lève", "lèves", "lève", "levions", "leviez", "lèvent"]),
    imperatif: { "2s": "lève", "1p": "levons", "2p": "levez" },
    pastParticiple: "levé",
  },
  espérer: {
    present: zip(["espère", "espères", "espère", "espérons", "espérez", "espèrent"]),
    imparfait: zip([
      "espérais", "espérais", "espérait", "espérions", "espériez", "espéraient",
    ]),
    futurSimple: zip([
      "espérerai", "espéreras", "espérera", "espérerons", "espérerez", "espéreront",
    ]),
    conditionnelPresent: zip([
      "espérerais", "espérerais", "espérerait", "espérerions", "espéreriez", "espéreraient",
    ]),
    subjonctifPresent: zip([
      "espère", "espères", "espère", "espérions", "espériez", "espèrent",
    ]),
    imperatif: { "2s": "espère", "1p": "espérons", "2p": "espérez" },
    pastParticiple: "espéré",
  },
};

export function conjugateRegular(infinitive: string, group: VerbGroup): RegularConjugation {
  if (group === "er" && infinitive in STEM_CHANGING_ER_VERBS) {
    return STEM_CHANGING_ER_VERBS[infinitive];
  }
  if (group === "er") return conjugateEr(infinitive);
  if (group === "ir") return conjugateIr(infinitive);
  if (group === "re") return conjugateRe(infinitive);
  throw new Error(`conjugateRegular called with non-regular group "${group}" for "${infinitive}"`);
}

export function buildCompoundRows(
  tense: "passe_compose" | "plus_que_parfait",
  auxiliary: Auxiliary,
  pastParticiple: string,
): ConjugationRow[] {
  const auxKind = auxiliary === "etre" ? "etre" : "avoir";
  const table = auxTable(auxKind, tense === "passe_compose" ? "present" : "imparfait");
  return PERSON_ORDER.map((person) => ({
    tense,
    person,
    form: `${table[person]} ${pastParticiple}`,
    isIrregular: false,
  }));
}

export function regularConjugationToRows(c: RegularConjugation): ConjugationRow[] {
  const rows: ConjugationRow[] = [];
  const tables: [ConjugationRow["tense"], Record<Person, string>][] = [
    ["present", c.present],
    ["imparfait", c.imparfait],
    ["futur_simple", c.futurSimple],
    ["conditionnel_present", c.conditionnelPresent],
    ["subjonctif_present", c.subjonctifPresent],
  ];
  for (const [tense, table] of tables) {
    for (const person of PERSON_ORDER) {
      rows.push({ tense, person, form: table[person], isIrregular: false });
    }
  }
  (["2s", "1p", "2p"] as const).forEach((person) => {
    rows.push({ tense: "imperatif", person, form: c.imperatif[person], isIrregular: false });
  });
  return rows;
}
