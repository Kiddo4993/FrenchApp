import "server-only";
import { db } from "@/db/client";
import * as schema from "@/db/schema";
import type { VocabEntry } from "@/content/schema";
import { CEFR_LEVELS, type Cefr } from "@/lib/placement/adaptive";

/** Drizzle marks nullable columns `T | null`; VocabEntry (content/schema.ts, `z.optional()`)
 * uses `T | undefined`. Normalize at this query boundary — see DECISIONS.md. */
function normalize(row: typeof schema.vocabEntries.$inferSelect): VocabEntry {
  return {
    ...row,
    gender: row.gender ?? undefined,
    plural: row.plural ?? undefined,
    collocations: row.collocations ?? undefined,
    fauxAmi: row.fauxAmi ?? undefined,
    mnemonic: row.mnemonic ?? undefined,
  };
}

/** Cap per level so the pools handed to the client component stay a reasonable payload size —
 * still comfortably enough entries (and POS diversity) to build 20 distinct MCQ questions with
 * real distractors at any single level. */
const MAX_ENTRIES_PER_LEVEL = 200;

function sample<T>(items: T[], count: number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}

/** One vocab pool per CEFR level, for the placement test's adaptive MCQ question generator
 * (src/lib/exercises/generate.ts's buildMcqPrompt, run client-side in PlacementRunner). */
export async function getPlacementVocabPools(): Promise<Record<Cefr, VocabEntry[]>> {
  const rows = await db.select().from(schema.vocabEntries);
  const byLevel = new Map<Cefr, VocabEntry[]>(CEFR_LEVELS.map((l) => [l, []]));
  for (const row of rows) {
    byLevel.get(row.cefr)?.push(normalize(row));
  }
  const pools = {} as Record<Cefr, VocabEntry[]>;
  for (const level of CEFR_LEVELS) {
    pools[level] = sample(byLevel.get(level) ?? [], MAX_ENTRIES_PER_LEVEL);
  }
  return pools;
}
