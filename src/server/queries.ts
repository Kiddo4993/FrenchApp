import "server-only";
import { and, asc, eq, inArray, isNotNull, lte, ne } from "drizzle-orm";
import { db } from "@/db/client";
import * as schema from "@/db/schema";
import { UNITS_SORTED, unitGlobalOrder } from "@/content/curriculum";

const PROFILE_ID = "singleton";

export async function getProfileBundle() {
  const [profile] = await db.select().from(schema.profile).where(eq(schema.profile.id, PROFILE_ID));
  const [settings] = await db
    .select()
    .from(schema.settings)
    .where(eq(schema.settings.profileId, PROFILE_ID));
  const [userStats] = await db.select().from(schema.userStats).where(eq(schema.userStats.id, PROFILE_ID));
  return { profile, settings, userStats };
}

export async function getDueCardCount(now: Date = new Date()) {
  const due = await db
    .select({ id: schema.cards.id })
    .from(schema.cards)
    .where(and(ne(schema.cards.state, "new"), lte(schema.cards.dueDate, now)));
  return due.length;
}

/** Skill tree data: every unit (curriculum order) with its lessons, joined to this profile's progress. */
export async function getSkillTree() {
  const [units, lessons, unitProgressRows, lessonProgressRows] = await Promise.all([
    db.select().from(schema.units),
    db.select().from(schema.lessons),
    db.select().from(schema.unitProgress),
    db.select().from(schema.lessonProgress),
  ]);

  const unitProgressByUnit = new Map(unitProgressRows.map((p) => [p.unitId, p]));
  const lessonProgressByLesson = new Map(lessonProgressRows.map((p) => [p.lessonId, p]));
  const lessonsByUnit = new Map<string, typeof lessons>();
  for (const l of lessons) {
    const arr = lessonsByUnit.get(l.unitId) ?? [];
    arr.push(l);
    lessonsByUnit.set(l.unitId, arr);
  }

  const unitsById = new Map(units.map((u) => [u.id, u]));
  const orderedUnits = UNITS_SORTED.map((def) => unitsById.get(def.slug)).filter(
    (u): u is NonNullable<typeof u> => Boolean(u),
  );

  return orderedUnits.map((unit) => ({
    unit,
    progress: unitProgressByUnit.get(unit.id) ?? null,
    lessons: (lessonsByUnit.get(unit.id) ?? [])
      .sort((a, b) => a.order - b.order)
      .map((lesson) => ({ lesson, progress: lessonProgressByLesson.get(lesson.id) ?? null })),
  }));
}

export async function getUnitBySlug(slug: string) {
  const [unit] = await db.select().from(schema.units).where(eq(schema.units.slug, slug));
  return unit ?? null;
}

export async function getLessonBySlug(slug: string) {
  const [lesson] = await db.select().from(schema.lessons).where(eq(schema.lessons.id, slug));
  if (!lesson) return null;
  const unit = await getUnitBySlug(lesson.unitId);
  return { lesson, unit };
}

export async function getVocabForTopics(topics: string[], maxCefr?: string) {
  const CEFR_ORDER = ["A1", "A2", "B1", "B2", "C1"];
  const rows = await db
    .select()
    .from(schema.vocabEntries)
    .where(inArray(schema.vocabEntries.topic, topics));
  if (!maxCefr) return rows;
  const ceiling = CEFR_ORDER.indexOf(maxCefr);
  return rows.filter((r) => CEFR_ORDER.indexOf(r.cefr) <= ceiling);
}

export async function getRecognitionCardsForVocab(vocabIds: string[]) {
  if (vocabIds.length === 0) return [];
  return db
    .select()
    .from(schema.cards)
    .where(and(inArray(schema.cards.vocabId, vocabIds), eq(schema.cards.track, "recognition")));
}

export async function getVerbs() {
  return db.select().from(schema.verbs).orderBy(asc(schema.verbs.frequencyRank));
}

export async function getVerbWithConjugations(infinitive: string) {
  const [verb] = await db.select().from(schema.verbs).where(eq(schema.verbs.infinitive, infinitive));
  if (!verb) return null;
  const conjugations = await db
    .select()
    .from(schema.verbConjugations)
    .where(eq(schema.verbConjugations.verbId, verb.id));
  return { verb, conjugations };
}

export async function getReadingPassageForTopic(topic: string) {
  const rows = await db
    .select()
    .from(schema.readingPassages)
    .where(eq(schema.readingPassages.topic, topic));
  return rows[0] ?? null;
}

export async function getGrammarPointsForUnit(unitId: string) {
  return db.select().from(schema.grammarPoints).where(eq(schema.grammarPoints.unitId, unitId));
}

export async function getAllGrammarPoints() {
  return db.select().from(schema.grammarPoints);
}

export async function getAllUnitsFlat() {
  return db.select().from(schema.units);
}

export async function getAchievementsWithStatus() {
  const [all, unlocked] = await Promise.all([
    db.select().from(schema.achievements),
    db.select().from(schema.userAchievements),
  ]);
  const unlockedByAchievement = new Map(unlocked.map((u) => [u.achievementId, u]));
  return all.map((a) => ({ achievement: a, unlockedAt: unlockedByAchievement.get(a.id)?.unlockedAt ?? null }));
}

export async function getWeakestCards(limit = 20) {
  const rows = await db
    .select()
    .from(schema.cards)
    .where(and(isNotNull(schema.cards.vocabId), ne(schema.cards.state, "new")))
    .orderBy(asc(schema.cards.retrievability))
    .limit(limit);
  const vocabIds = rows.map((r) => r.vocabId).filter((v): v is string => Boolean(v));
  const vocab = vocabIds.length
    ? await db.select().from(schema.vocabEntries).where(inArray(schema.vocabEntries.id, vocabIds))
    : [];
  const vocabById = new Map(vocab.map((v) => [v.id, v]));
  return rows.map((card) => ({ card, vocab: card.vocabId ? vocabById.get(card.vocabId) ?? null : null }));
}

export async function getLeechCards() {
  const rows = await db.select().from(schema.cards).where(eq(schema.cards.isLeech, true));
  const vocabIds = rows.map((r) => r.vocabId).filter((v): v is string => Boolean(v));
  const vocab = vocabIds.length
    ? await db.select().from(schema.vocabEntries).where(inArray(schema.vocabEntries.id, vocabIds))
    : [];
  const vocabById = new Map(vocab.map((v) => [v.id, v]));
  return rows.map((card) => ({ card, vocab: card.vocabId ? vocabById.get(card.vocabId) ?? null : null }));
}

export async function getAllCards() {
  return db.select().from(schema.cards);
}

export async function getAllVocab() {
  return db.select().from(schema.vocabEntries);
}

export async function getAllReviewLogs() {
  return db.select().from(schema.reviewLogs);
}

export async function getSessionLogs() {
  return db.select().from(schema.sessionLogs);
}

export async function getXpEvents() {
  return db.select().from(schema.xpEvents);
}

export { PROFILE_ID, unitGlobalOrder };
