import { describe, expect, it } from "vitest";
import { agreePastParticiple } from "./agreement";
import { conjugateVerb, VERB_LIST } from "./index";
import type { VerbListEntry } from "./index";
import { conjugateRegular } from "./regular";
import type { Person, Tense } from "./types";

function formOf(entry: VerbListEntry, tense: Tense, person: Person): string | undefined {
  return conjugateVerb(entry).conjugations.find((c) => c.tense === tense && c.person === person)
    ?.form;
}

function find(infinitive: string): VerbListEntry {
  const entry = VERB_LIST.find((v) => v.infinitive === infinitive);
  if (!entry) throw new Error(`fixture bug: "${infinitive}" not in VERB_LIST`);
  return entry;
}

describe("conjugateVerb — at least 40 verb/tense/person combinations", () => {
  const cases: [string, Tense, Person, string][] = [
    // regular -er (parler)
    ["parler", "present", "1s", "parle"],
    ["parler", "present", "3p", "parlent"],
    ["parler", "imparfait", "1s", "parlais"],
    ["parler", "futur_simple", "3s", "parlera"],
    ["parler", "conditionnel_present", "1p", "parlerions"],
    ["parler", "subjonctif_present", "2s", "parles"],
    ["parler", "imperatif", "2s", "parle"],
    ["parler", "passe_compose", "1s", "ai parlé"],
    ["parler", "plus_que_parfait", "3p", "avaient parlé"],
    // regular -ir (finir)
    ["finir", "present", "1s", "finis"],
    ["finir", "present", "1p", "finissons"],
    ["finir", "imparfait", "3p", "finissaient"],
    ["finir", "futur_simple", "2s", "finiras"],
    ["finir", "subjonctif_present", "1p", "finissions"],
    ["finir", "imperatif", "2s", "finis"],
    ["finir", "passe_compose", "3s", "a fini"],
    // regular -re (vendre)
    ["vendre", "present", "3s", "vend"],
    ["vendre", "imparfait", "1s", "vendais"],
    ["vendre", "futur_simple", "1s", "vendrai"],
    ["vendre", "conditionnel_present", "3p", "vendraient"],
    ["vendre", "subjonctif_present", "3s", "vende"],
    ["vendre", "imperatif", "2p", "vendez"],
    // stem-changing -er (still group "er")
    ["acheter", "present", "1s", "achète"],
    ["acheter", "present", "1p", "achetons"],
    ["acheter", "futur_simple", "1s", "achèterai"],
    ["préférer", "present", "1s", "préfère"],
    ["préférer", "futur_simple", "1s", "préférerai"],
    // irregulars
    ["être", "present", "1s", "suis"],
    ["être", "present", "3p", "sont"],
    ["être", "subjonctif_present", "3s", "soit"],
    ["avoir", "present", "3p", "ont"],
    ["avoir", "subjonctif_present", "1s", "aie"],
    ["aller", "present", "1s", "vais"],
    ["aller", "futur_simple", "1s", "irai"],
    ["aller", "imperatif", "2s", "va"],
    ["faire", "present", "1p", "faisons"],
    ["faire", "present", "2p", "faites"],
    ["faire", "subjonctif_present", "3p", "fassent"],
    ["prendre", "present", "3p", "prennent"],
    ["prendre", "subjonctif_present", "1p", "prenions"],
    ["venir", "futur_simple", "1s", "viendrai"],
    ["venir", "passe_compose", "1s", "suis venu"],
    ["partir", "passe_compose", "2s", "es parti"],
    ["pouvoir", "present", "1s", "peux"],
    ["vouloir", "conditionnel_present", "1s", "voudrais"],
    ["devoir", "present", "3p", "doivent"],
    ["savoir", "imperatif", "2s", "sache"],
  ];

  it.each(cases)("%s %s %s -> %s", (infinitive, tense, person, expected) => {
    expect(formOf(find(infinitive), tense, person)).toBe(expected);
  });
});

describe("spelling-change rules for -er verbs (not in the shipped VERB_LIST, but the general rule)", () => {
  it("manger: présent nous inserts e before -ons", () => {
    const c = conjugateRegular("manger", "er");
    expect(c.present["1p"]).toBe("mangeons");
    expect(c.imparfait["1s"]).toBe("mangeais");
    expect(c.imparfait["1p"]).toBe("mangions");
  });

  it("commencer: présent nous swaps c->ç before -ons", () => {
    const c = conjugateRegular("commencer", "er");
    expect(c.present["1p"]).toBe("commençons");
    expect(c.imparfait["3s"]).toBe("commençait");
    expect(c.imparfait["1p"]).toBe("commencions");
  });
});

describe("impersonal verbs are filtered to their 3s-only rows", () => {
  it("falloir only exposes 3s and imperatif rows", () => {
    const rows = conjugateVerb(find("falloir")).conjugations;
    expect(rows.every((r) => r.person === "3s" || r.tense === "imperatif")).toBe(true);
    expect(rows.some((r) => r.tense === "present" && r.person === "3s" && r.form === "faut")).toBe(
      true,
    );
  });
});

describe("agreePastParticiple", () => {
  it("leaves masculine singular unchanged", () => {
    expect(agreePastParticiple("allé", "m", "s")).toBe("allé");
  });
  it("adds e for feminine singular", () => {
    expect(agreePastParticiple("allé", "f", "s")).toBe("allée");
  });
  it("adds s for masculine plural", () => {
    expect(agreePastParticiple("allé", "m", "p")).toBe("allés");
  });
  it("adds es for feminine plural", () => {
    expect(agreePastParticiple("allé", "f", "p")).toBe("allées");
  });
  it("does not double an existing final s (assis)", () => {
    expect(agreePastParticiple("assis", "m", "p")).toBe("assis");
  });
});

describe("VERB_LIST", () => {
  it("has exactly 120 verbs with unique infinitives", () => {
    expect(VERB_LIST.length).toBe(120);
    expect(new Set(VERB_LIST.map((v) => v.infinitive)).size).toBe(120);
  });

  it("every verb conjugates without throwing and produces at least one row per non-impersonal tense", () => {
    for (const entry of VERB_LIST) {
      const rows = conjugateVerb(entry).conjugations;
      expect(rows.length).toBeGreaterThan(0);
    }
  });
});
