export type Gender = "m" | "f";
export type Number_ = "s" | "p";

/**
 * Past-participle agreement for être-auxiliary verbs (the subject always agrees) and for
 * avoir-auxiliary verbs when a preceding direct object forces agreement — this helper only
 * produces the spelling change; deciding *whether* agreement applies to a given sentence
 * (the avoir+preceding-COD rule) is a sentence-level concern left to the exercise engine.
 */
export function agreePastParticiple(participle: string, gender: Gender, number: Number_): string {
  if (gender === "m" && number === "s") return participle;
  if (gender === "m" && number === "p") {
    return participle.endsWith("s") || participle.endsWith("x") ? participle : `${participle}s`;
  }
  if (gender === "f" && number === "s") {
    return participle.endsWith("e") ? participle : `${participle}e`;
  }
  // f/p
  const feminine = participle.endsWith("e") ? participle : `${participle}e`;
  return feminine.endsWith("s") ? feminine : `${feminine}s`;
}
