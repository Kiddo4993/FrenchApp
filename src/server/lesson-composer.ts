import "server-only";
import registerSwapRaw from "../../content/register-swap.json";
import {
  assembleLesson,
  buildConjugationDrillPrompt,
  buildMatchingPairsPrompt,
  buildReadingComprehensionPrompt,
  buildRegisterSwapPrompt,
  CROWN_KIND_TIERS,
} from "@/lib/exercises/generate";
import { currentRetrievability } from "@/lib/srs";
import type { CardSnapshot } from "@/lib/srs/types";
import { registerSwapFileSchema, type VocabEntry } from "@/content/schema";
import type { ExercisePrompt } from "@/types/exercise";
import { normalizeVocabEntry } from "./normalize-vocab";
import {
  getLessonBySlug,
  getReadingPassageForTopic,
  getRecognitionCardsForVocab,
  getVerbs,
  getVocabForTopics,
} from "./queries";

const REGISTER_SWAP_ENTRIES = registerSwapFileSchema.parse(registerSwapRaw);
const CEFR_ORDER = ["A1", "A2", "B1", "B2", "C1"];

const MIN_TARGETS = 12;
const MAX_TARGETS = 18;

export interface LessonComposition {
  lesson: NonNullable<Awaited<ReturnType<typeof getLessonBySlug>>>["lesson"];
  unit: NonNullable<Awaited<ReturnType<typeof getLessonBySlug>>>["unit"];
  crownLevelAttempted: number;
  prompts: ExercisePrompt[];
}

export async function composeLessonSession(
  lessonId: string,
  currentCrownLevel: number,
): Promise<LessonComposition | null> {
  const found = await getLessonBySlug(lessonId);
  if (!found?.lesson || !found.unit) return null;
  const { lesson, unit } = found;

  const crownLevelAttempted = Math.min(5, Math.max(1, currentCrownLevel + 1)) as 1 | 2 | 3 | 4 | 5;
  const allowedKinds = CROWN_KIND_TIERS[crownLevelAttempted];

  const topics = unit.topics.length > 0 ? unit.topics : lesson.topicSlug ? [lesson.topicSlug] : [];
  const rawPool = topics.length > 0 ? await getVocabForTopics(topics, unit.levelId) : [];
  const pool: VocabEntry[] = rawPool.map(normalizeVocabEntry);

  const bonusBudget = crownLevelAttempted === 5 ? 0 : 2;
  const targetCount = Math.min(MAX_TARGETS, Math.max(MIN_TARGETS, pool.length));
  const wantTargets = Math.max(1, targetCount - bonusBudget);

  const existingCards = await getRecognitionCardsForVocab(pool.map((v) => v.id));
  const cardByVocabId = new Map(existingCards.map((c) => [c.vocabId, c]));
  const now = new Date();

  const weighted = pool.map((v) => {
    const card = cardByVocabId.get(v.id);
    const weight = card ? currentRetrievability(card as unknown as CardSnapshot, now) : 0.5;
    return { v, weight };
  });
  weighted.sort((a, b) => a.weight - b.weight);
  const targets = weighted.slice(0, Math.min(wantTargets, weighted.length)).map((w) => w.v);

  const prompts: ExercisePrompt[] = targets.length > 0 ? assembleLesson(targets, pool, Math.random, allowedKinds) : [];

  if (crownLevelAttempted !== 5) {
    const focus = lesson.skillFocus;

    if ((focus.includes("grammar-intro") || focus.includes("grammar-practice")) && bonusBudget > 0) {
      const verbs = await getVerbs();
      const levelCeiling = CEFR_ORDER.indexOf(unit.levelId);
      const suitable = verbs.filter((_, i) => i <= (levelCeiling + 1) * 30);
      const pick = suitable[Math.floor(Math.random() * Math.max(1, suitable.length))];
      if (pick) {
        const conjugations = await import("./queries").then((m) => m.getVerbWithConjugations(pick.infinitive));
        if (conjugations) {
          const p = buildConjugationDrillPrompt({ ...pick, conjugations: conjugations.conjugations });
          if (p) prompts.push(p);
        }
      }
    }

    if (focus.includes("mixed-review")) {
      const matching = buildMatchingPairsPrompt(pool, 6);
      if (matching) prompts.push(matching);
      const passage = topics.length > 0 ? await getReadingPassageForTopic(topics[0]) : null;
      if (passage) prompts.push(buildReadingComprehensionPrompt(passage));
    }

    if ((focus.includes("free-translation") || focus.includes("production")) && CEFR_ORDER.indexOf(unit.levelId) >= 2) {
      const eligible = REGISTER_SWAP_ENTRIES.filter((e) => CEFR_ORDER.indexOf(e.cefr) <= CEFR_ORDER.indexOf(unit.levelId));
      const pick = eligible[Math.floor(Math.random() * Math.max(1, eligible.length))];
      if (pick) prompts.push(buildRegisterSwapPrompt(pick));
    }
  }

  return { lesson, unit, crownLevelAttempted, prompts };
}
