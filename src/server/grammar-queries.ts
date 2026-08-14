import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import * as schema from "@/db/schema";

/**
 * New query helpers for the grammar reference + conjugation trainer (PLAN.md §6). Kept separate
 * from src/server/queries.ts per project convention — that file's existing helpers
 * (getGrammarPointsForUnit, getAllGrammarPoints, getVerbs, getVerbWithConjugations) are left
 * untouched.
 */

export interface GrammarPointWithUnit {
  grammarPoint: typeof schema.grammarPoints.$inferSelect;
  unit: typeof schema.units.$inferSelect;
}

/** All grammar points joined with their parent unit (for level/title context) — powers the searchable reference index. */
export async function getAllGrammarPointsWithUnits(): Promise<GrammarPointWithUnit[]> {
  return db
    .select({ grammarPoint: schema.grammarPoints, unit: schema.units })
    .from(schema.grammarPoints)
    .innerJoin(schema.units, eq(schema.grammarPoints.unitId, schema.units.id));
}

/** Single grammar point by its content slug, joined with its unit — powers the detail page. */
export async function getGrammarPointBySlug(slug: string): Promise<GrammarPointWithUnit | null> {
  const [row] = await db
    .select({ grammarPoint: schema.grammarPoints, unit: schema.units })
    .from(schema.grammarPoints)
    .innerJoin(schema.units, eq(schema.grammarPoints.unitId, schema.units.id))
    .where(eq(schema.grammarPoints.slug, slug));
  return row ?? null;
}

/**
 * Every verb with its full conjugation table, for the conjugation trainer (picker + reference
 * grid). Two bulk queries instead of N+1 calls to getVerbWithConjugations (one per verb) since
 * the trainer preloads all ~120 verbs up front so verb/tense switching stays fully
 * client-interactive with no further server round trips.
 */
export async function getAllVerbsWithConjugations() {
  const [verbs, conjugations] = await Promise.all([
    db.select().from(schema.verbs).orderBy(asc(schema.verbs.frequencyRank)),
    db.select().from(schema.verbConjugations),
  ]);
  const byVerb = new Map<string, (typeof conjugations)>();
  for (const c of conjugations) {
    const arr = byVerb.get(c.verbId) ?? [];
    arr.push(c);
    byVerb.set(c.verbId, arr);
  }
  return verbs.map((verb) => ({ verb, conjugations: byVerb.get(verb.id) ?? [] }));
}
