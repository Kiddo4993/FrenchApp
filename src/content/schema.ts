import { z } from "zod";
import { TOPIC_SLUGS } from "./topics";

export const cefrLevel = z.enum(["A1", "A2", "B1", "B2", "C1"]);

export const vocabEntrySchema = z.object({
  id: z.string().min(1),
  fr: z.string().min(1),
  en: z.string().min(1),
  lemma: z.string().min(1),
  pos: z.enum(["noun", "verb", "adj", "adv", "prep", "conj", "phrase", "pronoun"]),
  gender: z.enum(["m", "f", "both"]).optional(),
  plural: z.string().optional(),
  ipa: z.string().min(1),
  cefr: cefrLevel,
  topic: z.enum(TOPIC_SLUGS as [string, ...string[]]),
  register: z.enum(["neutre", "familier", "soutenu", "argot"]),
  exampleFr: z.string().min(1),
  exampleEn: z.string().min(1),
  collocations: z.array(z.string()).optional(),
  fauxAmi: z.string().optional(),
  mnemonic: z.string().optional(),
  audioText: z.string().min(1),
});
export type VocabEntry = z.infer<typeof vocabEntrySchema>;

export const vocabFileSchema = z.array(vocabEntrySchema);

export const PERSONS = ["1s", "2s", "3s", "1p", "2p", "3p"] as const;
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

export const verbConjugationSchema = z.object({
  tense: z.enum(TENSES),
  person: z.enum(PERSONS),
  form: z.string().min(1),
  isIrregular: z.boolean().default(false),
});

export const verbSchema = z.object({
  infinitive: z.string().min(1),
  group: z.enum(["er", "ir", "re", "irregular"]),
  auxiliary: z.enum(["avoir", "etre", "both"]),
  pastParticiple: z.string().min(1),
  frequencyRank: z.number().int().positive(),
  conjugations: z.array(verbConjugationSchema).min(1),
});
export type Verb = z.infer<typeof verbSchema>;

export const verbFileSchema = z.array(verbSchema);

export const grammarExampleSchema = z.object({
  fr: z.string().min(1),
  en: z.string().min(1),
  note: z.string().optional(),
});

export const grammarPointSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  explanationEn: z.string().min(1),
  examples: z.array(grammarExampleSchema).min(6).max(10),
  commonMistakes: z.array(z.string()).min(1),
  whyItTrips: z.array(z.string()).min(1),
  searchTags: z.array(z.string()).min(1),
});
export type GrammarPoint = z.infer<typeof grammarPointSchema>;

export const grammarUnitFileSchema = z.object({
  unitSlug: z.string().min(1),
  points: z.array(grammarPointSchema).min(1),
});

export const sentenceSchema = z.object({
  id: z.string().min(1),
  topic: z.enum(TOPIC_SLUGS as [string, ...string[]]),
  cefr: cefrLevel,
  fr: z.string().min(1),
  en: z.string().min(1),
  audioText: z.string().min(1),
  usedFor: z.enum(["reading", "dictation", "ordering", "cloze"]),
});
export type Sentence = z.infer<typeof sentenceSchema>;

export const sentenceFileSchema = z.array(sentenceSchema);

export const readingQuestionSchema = z.object({
  q: z.string().min(1),
  options: z.array(z.string()).min(2),
  answer: z.number().int().nonnegative(),
});

export const readingPassageSchema = z.object({
  id: z.string().min(1),
  cefr: cefrLevel,
  topic: z.enum(TOPIC_SLUGS as [string, ...string[]]),
  title: z.string().min(1),
  bodyFr: z.string().min(1),
  questions: z.array(readingQuestionSchema).min(1),
});
export type ReadingPassage = z.infer<typeof readingPassageSchema>;

export const readingFileSchema = z.array(readingPassageSchema);
