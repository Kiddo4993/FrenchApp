import "server-only";
import { db } from "@/db/client";
import * as schema from "@/db/schema";
import type { VocabEntry } from "@/content/schema";
import { shuffle } from "@/lib/exercises/generate";
import { CEFR_LEVELS, type Cefr } from "@/lib/placement/adaptive";
import { normalizeVocabEntry } from "./normalize-vocab";

/** Cap per level so the pools handed to the client component stay a reasonable payload size —
 * still comfortably enough entries (and POS diversity) to build 20 distinct MCQ questions with
 * real distractors at any single level. */
const MAX_ENTRIES_PER_LEVEL = 200;

/** One vocab pool per CEFR level, for the placement test's adaptive MCQ question generator
 * (src/lib/exercises/generate.ts's buildMcqPrompt, run client-side in PlacementRunner). */
export async function getPlacementVocabPools(): Promise<Record<Cefr, VocabEntry[]>> {
  const rows = await db.select().from(schema.vocabEntries);
  const byLevel = new Map<Cefr, VocabEntry[]>(CEFR_LEVELS.map((l) => [l, []]));
  for (const row of rows) {
    byLevel.get(row.cefr)?.push(normalizeVocabEntry(row));
  }
  const pools = {} as Record<Cefr, VocabEntry[]>;
  for (const level of CEFR_LEVELS) {
    pools[level] = shuffle(byLevel.get(level) ?? []).slice(0, MAX_ENTRIES_PER_LEVEL);
  }
  return pools;
}
