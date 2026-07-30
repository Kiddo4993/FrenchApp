import { describe, expect, it } from "vitest";
import { matchAnswer, normalize, stripAccents } from "./index";

describe("normalize", () => {
  it("trims, lowercases, collapses whitespace, and drops trailing punctuation", () => {
    expect(normalize("  Bonjour   le monde !  ")).toBe("bonjour le monde");
  });
});

describe("stripAccents", () => {
  it("removes French diacritics", () => {
    expect(stripAccents("élève à la bibliothèque")).toBe("eleve a la bibliotheque");
  });
});

describe("matchAnswer", () => {
  it("exact match against a single accepted answer -> correct", () => {
    expect(matchAnswer("Je vais à la bibliothèque.", ["Je vais à la bibliothèque"]).status).toBe(
      "correct",
    );
  });

  it("matches any one of several accepted phrasings", () => {
    const accepted = ["Je m'appelle Marie", "Mon nom est Marie"];
    expect(matchAnswer("mon nom est marie", accepted).status).toBe("correct");
  });

  it("flags a missing-accent answer as accent_warning, not incorrect", () => {
    const result = matchAnswer("je vais a la bibliotheque", ["je vais à la bibliothèque"]);
    expect(result.status).toBe("accent_warning");
  });

  it("flags a small typo as minor_typo", () => {
    const result = matchAnswer("je voudrias un café", ["je voudrais un café"]);
    expect(result.status).toBe("minor_typo");
  });

  it("rejects a genuinely wrong answer", () => {
    expect(matchAnswer("je déteste le café", ["je voudrais un café"]).status).toBe("incorrect");
  });

  it("is case-insensitive", () => {
    expect(matchAnswer("BONJOUR", ["bonjour"]).status).toBe("correct");
  });
});
