import "server-only";
import type * as schema from "@/db/schema";
import type { VocabEntry } from "@/content/schema";

/**
 * Drizzle's SQLite select type marks nullable columns `T | null`; the exercise-generation layer
 * (generate.ts) is typed against the Zod-derived `VocabEntry`, whose optional fields are
 * `T | undefined`. Normalize once here rather than loosening either type — see DECISIONS.md.
 * Previously re-inlined at every call site (lesson-composer, review-composer ×2, placement-queries);
 * consolidated after code review flagged the duplication as a real risk (a future optional field
 * added to `VocabEntry` only needs updating here, not hunted down across N call sites).
 */
export function normalizeVocabEntry(row: typeof schema.vocabEntries.$inferSelect): VocabEntry {
  return {
    ...row,
    gender: row.gender ?? undefined,
    plural: row.plural ?? undefined,
    collocations: row.collocations ?? undefined,
    fauxAmi: row.fauxAmi ?? undefined,
    mnemonic: row.mnemonic ?? undefined,
  };
}
