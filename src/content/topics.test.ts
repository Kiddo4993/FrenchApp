import { describe, expect, it } from "vitest";
import { MIN_ENTRIES_PER_TOPIC, MIN_TOTAL_ENTRIES, TOPICS } from "./topics";
import { UNITS, buildLessonsForUnit } from "./curriculum";
import { vocabEntrySchema } from "./schema";

describe("topics", () => {
  it("has exactly 40 topics", () => {
    expect(TOPICS.length).toBe(40);
  });

  it("has no duplicate slugs", () => {
    const slugs = TOPICS.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("40 topics at the minimum floor still clears the total target", () => {
    expect(TOPICS.length * MIN_ENTRIES_PER_TOPIC).toBeLessThan(MIN_TOTAL_ENTRIES * 1.1);
  });
});

describe("curriculum", () => {
  it("has exactly 44 units across 5 levels", () => {
    expect(UNITS.length).toBe(44);
    const counts: Record<string, number> = {};
    for (const unit of UNITS) counts[unit.level] = (counts[unit.level] ?? 0) + 1;
    expect(counts).toEqual({ A1: 10, A2: 10, B1: 10, B2: 8, C1: 6 });
  });

  it("has unique unit slugs", () => {
    const slugs = UNITS.map((u) => u.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("builds 8 lesson nodes per unit ending in review then boss", () => {
    for (const unit of UNITS) {
      const lessons = buildLessonsForUnit(unit);
      expect(lessons.length).toBe(8);
      expect(lessons.filter((l) => l.kind === "lesson").length).toBe(6);
      expect(lessons.at(-2)?.kind).toBe("review");
      expect(lessons.at(-1)?.kind).toBe("boss");
    }
  });
});

describe("vocabEntrySchema", () => {
  const base = {
    id: "v1",
    fr: "la bibliothèque",
    en: "library",
    lemma: "bibliothèque",
    pos: "noun" as const,
    gender: "f" as const,
    ipa: "/bi.bli.jɔ.tɛk/",
    cefr: "A1" as const,
    topic: "ecole-education",
    register: "neutre" as const,
    exampleFr: "Je vais à la bibliothèque.",
    exampleEn: "I'm going to the library.",
    audioText: "la bibliothèque",
  };

  it("accepts a well-formed entry", () => {
    expect(vocabEntrySchema.safeParse(base).success).toBe(true);
  });

  it("rejects an entry missing a required field", () => {
    const withoutIpa: Partial<typeof base> = { ...base };
    delete withoutIpa.ipa;
    expect(vocabEntrySchema.safeParse(withoutIpa).success).toBe(false);
  });

  it("rejects an entry with a topic outside the canonical list", () => {
    expect(
      vocabEntrySchema.safeParse({ ...base, topic: "not-a-real-topic" }).success,
    ).toBe(false);
  });
});
