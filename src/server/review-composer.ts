import "server-only";
import { assembleLesson } from "@/lib/exercises/generate";
import { buildDailyQueue, type QueueCard } from "@/lib/srs";
import type { VocabEntry } from "@/content/schema";
import type { ExercisePrompt } from "@/types/exercise";
import { UNITS_SORTED } from "@/content/curriculum";
import * as schema from "@/db/schema";
import { normalizeVocabEntry } from "./normalize-vocab";
import { db } from "@/db/client";
import { getAllCards, getAllVocab, getProfileBundle } from "./queries";

/**
 * Cross-topic review session (the "Réviser" tab): due cards first, then a capped number of
 * brand-new words, interleaved via the same `buildDailyQueue` the SRS spec calls for — unlike a
 * curriculum lesson, this isn't scoped to one unit's topic(s) or bound to 12–18 exercises.
 */
export async function composeReviewSession(): Promise<{ prompts: ExercisePrompt[]; wordCount: number }> {
  const { settings } = await getProfileBundle();
  const newCardsPerDay = settings?.newCardsPerDay ?? 15;
  const now = new Date();

  const [allCards, allVocab, unitProgressRows] = await Promise.all([
    getAllCards(),
    getAllVocab(),
    db.select().from(schema.unitProgress),
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

  // New-word candidates are scoped to unlocked units' topics, walked in curriculum order — the
  // same pacing lesson-composer.ts and the demo-seed simulation already use. Previously this
  // pulled from the *entire* ~4,400-word bank in raw DB scan order, which could hand an absolute
  // beginner review-queue words from topics/levels they haven't unlocked yet, up to C1. Caught by
  // code review.
  const unlockedUnitIds = new Set(
    unitProgressRows.filter((u) => u.status !== "locked").map((u) => u.unitId),
  );
  const vocabByTopic = new Map<string, typeof allVocab>();
  for (const v of allVocab) {
    const arr = vocabByTopic.get(v.topic) ?? [];
    arr.push(v);
    vocabByTopic.set(v.topic, arr);
  }
  const orderedNewCandidates: (typeof allVocab)[number][] = [];
  const seenTopics = new Set<string>();
  for (const unit of UNITS_SORTED) {
    if (!unlockedUnitIds.has(unit.slug)) continue;
    for (const topic of unit.topics) {
      if (seenTopics.has(topic)) continue;
      seenTopics.add(topic);
      for (const v of vocabByTopic.get(topic) ?? []) {
        if (!vocabIdsWithAnyCard.has(v.id)) orderedNewCandidates.push(v);
      }
    }
  }

  const queueCards: QueueCard[] = [];
  for (const [vocabId, info] of earliestDueByVocab) {
    queueCards.push({ id: vocabId, state: info.state, dueDate: info.dueDate });
  }
  for (const v of orderedNewCandidates) {
    queueCards.push({ id: v.id, state: "new", dueDate: now });
  }

  const queue = buildDailyQueue(queueCards, now, newCardsPerDay);
  // Due reviews aren't capped the way new cards are, but keep a session to a sane size.
  const selected = queue.slice(0, 40);

  const vocabById = new Map(allVocab.map((v) => [v.id, v]));
  const targets: VocabEntry[] = selected
    .map((c) => vocabById.get(c.id))
    .filter((v): v is typeof allVocab[number] => Boolean(v))
    .map(normalizeVocabEntry);

  if (targets.length === 0) return { prompts: [], wordCount: 0 };

  const distractorPool: VocabEntry[] = allVocab.map(normalizeVocabEntry);

  return { prompts: assembleLesson(targets, distractorPool), wordCount: targets.length };
}
