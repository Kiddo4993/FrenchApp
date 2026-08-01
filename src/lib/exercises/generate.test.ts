import { describe, expect, it } from "vitest";
import type { VocabEntry } from "@/content/schema";
import {
  assembleLesson,
  buildClozePrompt,
  buildDictationPrompt,
  buildFreeTranslationPrompt,
  buildGenderDrillPrompt,
  buildMcqPrompt,
  buildOddOneOutPrompt,
  buildWordBankPrompt,
  shuffle,
} from "./generate";

function entry(overrides: Partial<VocabEntry> & Pick<VocabEntry, "id" | "fr" | "en" | "lemma">): VocabEntry {
  return {
    pos: "noun",
    gender: "f",
    ipa: "/test/",
    cefr: "A1",
    topic: "salutations",
    register: "neutre",
    exampleFr: `${overrides.fr} est ici.`,
    exampleEn: `${overrides.en} is here.`,
    audioText: overrides.fr,
    ...overrides,
  };
}

const bibliotheque = entry({
  id: "v1",
  fr: "la bibliothèque",
  en: "library",
  lemma: "bibliothèque",
  exampleFr: "Je vais à la bibliothèque.",
  exampleEn: "I am going to the library.",
});
const pain = entry({
  id: "v2",
  fr: "le pain",
  en: "bread",
  lemma: "pain",
  gender: "m",
  exampleFr: "Le pain est frais.",
  exampleEn: "The bread is fresh.",
});
const eau = entry({
  id: "v3",
  fr: "l'eau",
  en: "water",
  lemma: "eau",
  gender: "f",
  exampleFr: "L'eau est froide.",
  exampleEn: "The water is cold.",
});
const chat = entry({
  id: "v4",
  fr: "le chat",
  en: "cat",
  lemma: "chat",
  gender: "m",
});
const table = entry({ id: "v5", fr: "la table", en: "table", lemma: "table", gender: "f" });
const chaise = entry({ id: "v6", fr: "la chaise", en: "chair", lemma: "chaise", gender: "f" });
const voiture = entry({
  id: "v7",
  fr: "la voiture",
  en: "car",
  lemma: "voiture",
  gender: "f",
  topic: "transport-directions",
});

const POOL = [bibliotheque, pain, eau, chat, table, chaise, voiture];

describe("shuffle", () => {
  it("returns a permutation of the same elements", () => {
    const input = [1, 2, 3, 4, 5];
    const result = shuffle(input);
    expect(result.length).toBe(input.length);
    expect([...result].sort()).toEqual([...input].sort());
  });

  it("does not mutate the input array", () => {
    const input = [1, 2, 3];
    shuffle(input);
    expect(input).toEqual([1, 2, 3]);
  });
});

describe("buildMcqPrompt", () => {
  it("mcq_recognition shows the French word and asks for the English meaning", () => {
    const prompt = buildMcqPrompt(POOL, bibliotheque, "mcq_recognition");
    expect(prompt.promptText).toBe(bibliotheque.fr);
    expect(prompt.options[prompt.correctIndex]).toBe(bibliotheque.en);
    expect(prompt.options.length).toBe(4);
    expect(new Set(prompt.options).size).toBe(4);
  });

  it("mcq_production shows the English word and asks for the French meaning", () => {
    const prompt = buildMcqPrompt(POOL, pain, "mcq_production");
    expect(prompt.promptText).toBe(pain.en);
    expect(prompt.options[prompt.correctIndex]).toBe(pain.fr);
  });

  it("never includes the target itself among the distractors", () => {
    const prompt = buildMcqPrompt(POOL, chat, "mcq_recognition");
    const nonCorrect = prompt.options.filter((_, i) => i !== prompt.correctIndex);
    expect(nonCorrect).not.toContain(chat.en);
  });
});

describe("buildWordBankPrompt", () => {
  it("scrambled tiles are a permutation of the example sentence's words", () => {
    const prompt = buildWordBankPrompt(bibliotheque);
    expect([...prompt.tiles].sort()).toEqual([...prompt.correctOrder].sort());
    expect(prompt.correctOrder.join(" ")).toBe(bibliotheque.exampleFr);
  });
});

describe("buildFreeTranslationPrompt", () => {
  it("prompts with the English sentence and accepts the French original", () => {
    const prompt = buildFreeTranslationPrompt(pain);
    expect(prompt.promptText).toBe(pain.exampleEn);
    expect(prompt.acceptedAnswers).toContain(pain.exampleFr);
  });
});

describe("buildClozePrompt", () => {
  it("blanks out the lemma within the example sentence", () => {
    const prompt = buildClozePrompt(pain);
    expect(prompt).not.toBeNull();
    expect(`${prompt!.before}___${prompt!.after}`).toContain("___");
    expect(prompt!.before + "pain" + prompt!.after).toBe(pain.exampleFr);
  });

  it("returns null when the lemma cannot be found in the example sentence", () => {
    const weird = entry({
      id: "v9",
      fr: "le mot",
      en: "word",
      lemma: "zzzznotfound",
      exampleFr: "Ceci est une phrase.",
    });
    expect(buildClozePrompt(weird)).toBeNull();
  });
});

describe("buildDictationPrompt", () => {
  it("uses the example sentence as both audio text and accepted answer", () => {
    const prompt = buildDictationPrompt(eau);
    expect(prompt.audioText).toBe(eau.exampleFr);
    expect(prompt.acceptedAnswers).toContain(eau.exampleFr);
  });
});

describe("buildGenderDrillPrompt", () => {
  it("picks 'le' for a masculine consonant-initial noun", () => {
    const prompt = buildGenderDrillPrompt(pain);
    expect(prompt?.correctArticle).toBe("le");
  });

  it("picks 'la' for a feminine consonant-initial noun", () => {
    const prompt = buildGenderDrillPrompt(table);
    expect(prompt?.correctArticle).toBe("la");
  });

  it("picks l' for a vowel-initial noun regardless of gender", () => {
    const prompt = buildGenderDrillPrompt(eau);
    expect(prompt?.correctArticle).toBe("l'");
  });

  it("returns null for non-nouns or ungendered/both-gender entries", () => {
    const verb = entry({ id: "v10", fr: "manger", en: "to eat", lemma: "manger", pos: "verb", gender: undefined });
    expect(buildGenderDrillPrompt(verb)).toBeNull();
    const both = entry({ id: "v11", fr: "un/une élève", en: "student", lemma: "élève", gender: "both" });
    expect(buildGenderDrillPrompt(both)).toBeNull();
  });
});

describe("buildOddOneOutPrompt", () => {
  it("the odd word out comes from the odd pool, the other three from the same-group pool", () => {
    const sameGroup = [pain, eau, chat, table, chaise];
    const oddPool = [voiture];
    const prompt = buildOddOneOutPrompt(sameGroup, oddPool);
    expect(prompt).not.toBeNull();
    expect(prompt!.options[prompt!.oddIndex]).toBe(voiture.fr);
  });

  it("returns null when there aren't enough words to build a group", () => {
    expect(buildOddOneOutPrompt([pain], [voiture])).toBeNull();
    expect(buildOddOneOutPrompt([pain, eau, chat], [])).toBeNull();
  });
});

describe("assembleLesson", () => {
  it("produces exactly one exercise per target word", () => {
    const lesson = assembleLesson(POOL, POOL);
    expect(lesson.length).toBe(POOL.length);
  });

  it("every exercise maps back to a real target word via cardId (where applicable)", () => {
    const lesson = assembleLesson(POOL, POOL);
    const targetIds = new Set(POOL.map((p) => p.id));
    for (const ex of lesson) {
      if ("cardId" in ex && ex.cardId) expect(targetIds.has(ex.cardId)).toBe(true);
    }
  });

  it("falls back away from gender_drill for a non-noun target", () => {
    const verb = entry({ id: "v20", fr: "manger", en: "to eat", lemma: "manger", pos: "verb", gender: undefined });
    // KIND_CYCLE[5] is "gender_drill" — put the verb at that position.
    const targets = [pain, eau, chat, table, chaise, verb];
    const lesson = assembleLesson(targets, POOL);
    expect(lesson[5].kind).not.toBe("gender_drill");
  });
});
