import "server-only";
import { assembleLesson } from "@/lib/exercises/generate";
import { buildDailyQueue, type QueueCard } from "@/lib/srs";
import type { VocabEntry } from "@/content/schema";
import type { ExercisePrompt } from "@/types/exercise";
import { db } from "@/db/client";
import * as schema from "@/db/schema";
import { getProfileBundle } from "./queries";

/**
 * Cross-topic review session (the "Réviser" tab): due cards first, then a capped number of
 * brand-new words, interleaved via the same `buildDailyQueue` the SRS spec calls for — unlike a
 * curriculum lesson, this isn't scoped to one unit's topic(s) or bound to 12–18 exercises.
 */
export async function composeReviewSession(): Promise<{ prompts: ExercisePrompt[]; wordCount: number }> {
  const { settings } = await getProfileBundle();
  const newCardsPerDay = settings?.newCardsPerDay ?? 15;
  const now = new Date();

  const [allCards, allVocab] = await Promise.all([
    db.select().from(schema.cards),
    db.select().from(schema.vocabEntries),
  ]);

  const earliestDueByVocab = new Map<string, { state: (typeof schema.cards.$inferSelect)["state"]; dueDate: Date }>();
  for (const c of allCards) {
    if (!c.vocabId || c.state === "new") continue;
    const existing = earliestDueByVocab.get(c.vocabId);
    if (!existing || c.dueDate.getTime() < existing.dueDate.getTime()) {
      earliestDueByVocab.set(c.vocabId, { state: c.state, dueDate: c.dueDate });
    }
  }
  const vocabIdsWithAnyCard = new Set(allCards.map((c) => c.vocabId).filter((v): v is string => Boolean(v)));

  const queueCards: QueueCard[] = [];
  for (const [vocabId, info] of earliestDueByVocab) {
    queueCards.push({ id: vocabId, state: info.state, dueDate: info.dueDate });
  }
  for (const v of allVocab) {
    if (!vocabIdsWithAnyCard.has(v.id)) {
      queueCards.push({ id: v.id, state: "new", dueDate: now });
    }
  }

  const queue = buildDailyQueue(queueCards, now, newCardsPerDay);
  // Due reviews aren't capped the way new cards are, but keep a session to a sane size.
  const selected = queue.slice(0, 40);

  const vocabById = new Map(allVocab.map((v) => [v.id, v]));
  const targets: VocabEntry[] = selected
    .map((c) => vocabById.get(c.id))
    .filter((v): v is typeof allVocab[number] => Boolean(v))
    .map((v) => ({
      ...v,
      gender: v.gender ?? undefined,
      plural: v.plural ?? undefined,
      collocations: v.collocations ?? undefined,
      fauxAmi: v.fauxAmi ?? undefined,
      mnemonic: v.mnemonic ?? undefined,
    }));

  if (targets.length === 0) return { prompts: [], wordCount: 0 };

  const distractorPool: VocabEntry[] = allVocab.map((v) => ({
    ...v,
    gender: v.gender ?? undefined,
    plural: v.plural ?? undefined,
    collocations: v.collocations ?? undefined,
    fauxAmi: v.fauxAmi ?? undefined,
    mnemonic: v.mnemonic ?? undefined,
  }));

  return { prompts: assembleLesson(targets, distractorPool), wordCount: targets.length };
}
