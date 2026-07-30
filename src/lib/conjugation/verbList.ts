import { IRREGULAR_VERBS } from "./irregulars";
import { STEM_CHANGING_ER_VERBS } from "./regular";
import type { Auxiliary, VerbGroup } from "./types";

export interface VerbListEntry {
  infinitive: string;
  group: VerbGroup;
  auxiliary: Auxiliary;
  frequencyRank: number;
}

const REGULAR_ER_AVOIR = [
  "parler", "aimer", "regarder", "écouter", "travailler", "habiter", "chercher", "trouver",
  "donner", "demander", "montrer", "jouer", "aider", "penser", "continuer", "danser",
  "dessiner", "fermer", "gagner", "garder", "laisser", "marcher", "oublier", "porter",
  "poser", "pousser", "quitter", "raconter", "retrouver", "tourner", "visiter", "adorer",
  "chanter", "cuisiner", "décider", "dépenser", "désirer", "détester", "discuter",
  "embrasser", "expliquer", "fumer", "imaginer", "inviter", "livrer",
];

const REGULAR_ER_ETRE = ["arriver", "entrer", "rester", "tomber", "retourner", "monter", "rentrer"];

const REGULAR_IR_AVOIR = [
  "finir", "choisir", "réussir", "remplir", "réfléchir", "grandir", "grossir", "maigrir",
  "obéir", "punir", "rougir", "vieillir", "agir", "guérir", "ralentir",
];

const REGULAR_RE_AVOIR = [
  "vendre", "attendre", "entendre", "répondre", "perdre", "rendre", "défendre", "confondre",
  "correspondre",
];

const REGULAR_RE_ETRE = ["descendre"];

let rank = 1;
const nextRank = () => rank++;

export const VERB_LIST: VerbListEntry[] = [
  ...IRREGULAR_VERBS.map((v) => ({
    infinitive: v.infinitive,
    group: "irregular" as VerbGroup,
    auxiliary: v.auxiliary,
    frequencyRank: nextRank(),
  })),
  ...Object.keys(STEM_CHANGING_ER_VERBS).map((infinitive) => ({
    infinitive,
    group: "er" as VerbGroup,
    auxiliary: "avoir" as Auxiliary,
    frequencyRank: nextRank(),
  })),
  ...REGULAR_ER_AVOIR.map((infinitive) => ({
    infinitive,
    group: "er" as VerbGroup,
    auxiliary: "avoir" as Auxiliary,
    frequencyRank: nextRank(),
  })),
  ...REGULAR_IR_AVOIR.map((infinitive) => ({
    infinitive,
    group: "ir" as VerbGroup,
    auxiliary: "avoir" as Auxiliary,
    frequencyRank: nextRank(),
  })),
  ...REGULAR_RE_AVOIR.map((infinitive) => ({
    infinitive,
    group: "re" as VerbGroup,
    auxiliary: "avoir" as Auxiliary,
    frequencyRank: nextRank(),
  })),
  ...REGULAR_ER_ETRE.map((infinitive) => ({
    infinitive,
    group: "er" as VerbGroup,
    auxiliary: "etre" as Auxiliary,
    frequencyRank: nextRank(),
  })),
  ...REGULAR_RE_ETRE.map((infinitive) => ({
    infinitive,
    group: "re" as VerbGroup,
    auxiliary: "etre" as Auxiliary,
    frequencyRank: nextRank(),
  })),
];
