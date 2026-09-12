/**
 * Loads /content/*.json into Postgres (hosted, or the local embedded PGlite — see src/db/client.ts).
 * Safe to re-run: content tables are upserted by their stable, content-derived ids (never random),
 * so re-seeding after the learner has progress updates content in place instead of cascading
 * deletes through their cards/progress rows.
 *
 * Inserts are batched (see `chunk`/`buildConflictUpdateSet` below) rather than one row per round
 * trip. That's not just a speed optimization: against a real hosted Postgres (Neon), one-row-at-a-
 * time inserts for ~10k content rows took 20+ minutes and the connection was closed by the pooler
 * partway through — and because the *entire* seed used to run as a single `db.transaction(...)`,
 * that one dropped connection rolled back everything, including work several minutes old. Batching
 * cuts ~10k round trips down to ~25, comfortably inside any reasonable session/statement timeout.
 * There's no longer an outer transaction wrapping the whole seed either: each batch commits on its
 * own, so a connection hiccup partway through only loses the in-flight batch, not everything before
 * it — re-running the script picks up exactly where it left off via the same idempotent upserts.
 */
import fs from "node:fs";
import path from "node:path";
import { sql, getTableColumns, type AnyColumn, type Table } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";
import { db } from "../src/db/client";
import * as schema from "../src/db/schema";
import { UNITS, UNITS_SORTED, LESSONS } from "../src/content/curriculum";
import { TOPICS } from "../src/content/topics";
import { ACHIEVEMENTS } from "../src/content/achievements";
import {
  grammarUnitFileSchema,
  readingFileSchema,
  verbFileSchema,
  vocabFileSchema,
} from "../src/content/schema";

const CONTENT_ROOT = path.join(__dirname, "..", "content");
const LEVEL_TITLES: Record<string, string> = {
  A1: "Débutant",
  A2: "Élémentaire",
  B1: "Intermédiaire",
  B2: "Avancé",
  C1: "Maîtrise",
};
const LEVEL_ORDER: Record<string, number> = { A1: 0, A2: 1, B1: 2, B2: 3, C1: 4 };

// Rows per batch insert. Comfortably under Postgres's ~65k bound-parameter limit even for our
// widest table (vocabEntries, ~18 columns: 500 * 18 = 9,000 params), while cutting the vocab
// table's round trips from 4,406 to ~9.
const BATCH_SIZE = 500;

function readJson(filePath: string): unknown {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/** `set: { col: excluded.col }` for every column except `id` — generic upsert-all-columns. */
function buildConflictUpdateSet<T extends Table>(table: T) {
  const columns = getTableColumns(table) as Record<string, AnyColumn>;
  return Object.fromEntries(
    Object.entries(columns)
      .filter(([name]) => name !== "id")
      .map(([name, col]) => [name, sql.raw(`excluded.${col.name}`)]),
  );
}

/**
 * Insert `rows` in batches of BATCH_SIZE, upserting every non-id column on conflict.
 *
 * Drizzle's insert/onConflictDoUpdate types are fully inferred per-table, which is great at every
 * normal call site but makes a single helper that accepts *any* table impossible to satisfy without
 * `any` somewhere — there's no type that both means "some PgTable" and lines up with the exact
 * per-table insert shape Drizzle expects. The escape hatch is contained here; every call site above
 * still gets full type checking on the row objects it builds from the actual content schemas, so
 * the data going in is exactly as type-safe as before — this only relaxes the shared plumbing.
 */
async function upsertBatched<T extends PgTable & { id: PgColumn }>(table: T, rows: Record<string, unknown>[]) {
  if (rows.length === 0) return;
  const set = buildConflictUpdateSet(table);
  for (const batch of chunk(rows, BATCH_SIZE)) {
    await db
      .insert(table)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .values(batch as any)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .onConflictDoUpdate({ target: table.id, set: set as any });
  }
}

async function seedLevels() {
  const rows = (["A1", "A2", "B1", "B2", "C1"] as const).map((id) => ({
    id,
    title: LEVEL_TITLES[id],
    order: LEVEL_ORDER[id],
  }));
  await upsertBatched(schema.levels, rows);
  console.log(`Seeded ${rows.length} levels`);
}

async function seedUnitsAndLessons() {
  const unitRows = UNITS.map((unit) => ({
    id: unit.slug,
    levelId: unit.level,
    order: unit.order,
    slug: unit.slug,
    title: unit.title,
    focus: unit.focus,
    topics: unit.topics,
  }));
  await upsertBatched(schema.units, unitRows);

  const lessonRows = LESSONS.map((lesson) => ({
    id: lesson.slug,
    unitId: lesson.unitSlug,
    order: lesson.order,
    kind: lesson.kind,
    title: lesson.title,
    skillFocus: lesson.skillFocus,
    topicSlug: lesson.topicSlug,
  }));
  await upsertBatched(schema.lessons, lessonRows);
  console.log(`Seeded ${unitRows.length} units, ${lessonRows.length} lessons`);
}

async function seedVocab() {
  const rows: Record<string, unknown>[] = [];
  for (const topic of TOPICS) {
    const file = path.join(CONTENT_ROOT, "vocab", `${topic.slug}.json`);
    if (!fs.existsSync(file)) continue;
    const entries = vocabFileSchema.parse(readJson(file));
    for (const entry of entries) {
      rows.push({
        id: entry.id,
        fr: entry.fr,
        en: entry.en,
        lemma: entry.lemma,
        pos: entry.pos,
        gender: entry.gender,
        plural: entry.plural,
        ipa: entry.ipa,
        cefr: entry.cefr,
        topic: entry.topic,
        register: entry.register,
        exampleFr: entry.exampleFr,
        exampleEn: entry.exampleEn,
        collocations: entry.collocations,
        fauxAmi: entry.fauxAmi,
        mnemonic: entry.mnemonic,
        audioText: entry.audioText,
      });
    }
  }
  await upsertBatched(schema.vocabEntries, rows);
  console.log(`Seeded ${rows.length} vocab entries`);
}

async function seedVerbs() {
  const file = path.join(CONTENT_ROOT, "verbs", "verbs.json");
  if (!fs.existsSync(file)) return;
  const verbs = verbFileSchema.parse(readJson(file));

  const verbRows = verbs.map((verb) => ({
    id: verb.infinitive,
    infinitive: verb.infinitive,
    group: verb.group,
    auxiliary: verb.auxiliary,
    pastParticiple: verb.pastParticiple,
    frequencyRank: verb.frequencyRank,
  }));
  await upsertBatched(schema.verbs, verbRows);

  const conjRows = verbs.flatMap((verb) =>
    verb.conjugations.map((c) => ({
      id: `${verb.infinitive}-${c.tense}-${c.person}`,
      verbId: verb.infinitive,
      tense: c.tense,
      person: c.person,
      form: c.form,
      isIrregular: c.isIrregular,
    })),
  );
  await upsertBatched(schema.verbConjugations, conjRows);
  console.log(`Seeded ${verbRows.length} verbs, ${conjRows.length} conjugations`);
}

async function seedGrammar() {
  const rows: Record<string, unknown>[] = [];
  for (const unit of UNITS) {
    const file = path.join(CONTENT_ROOT, "grammar", `${unit.slug}.json`);
    if (!fs.existsSync(file)) continue;
    const parsed = grammarUnitFileSchema.parse(readJson(file));
    for (const point of parsed.points) {
      rows.push({
        id: point.slug,
        unitId: unit.slug,
        slug: point.slug,
        title: point.title,
        explanationEn: point.explanationEn,
        examples: point.examples,
        commonMistakes: point.commonMistakes,
        whyItTrips: point.whyItTrips,
        searchTags: point.searchTags,
      });
    }
  }
  await upsertBatched(schema.grammarPoints, rows);
  console.log(`Seeded ${rows.length} grammar points`);
}

async function seedReadings() {
  const rows: Record<string, unknown>[] = [];
  for (const topic of TOPICS) {
    const file = path.join(CONTENT_ROOT, "readings", `${topic.slug}.json`);
    if (!fs.existsSync(file)) continue;
    const passages = readingFileSchema.parse(readJson(file));
    for (const passage of passages) {
      rows.push({
        id: passage.id,
        cefr: passage.cefr,
        topic: passage.topic,
        title: passage.title,
        bodyFr: passage.bodyFr,
        questions: passage.questions,
      });
    }
  }
  await upsertBatched(schema.readingPassages, rows);
  console.log(`Seeded ${rows.length} reading passages`);
}

async function seedAchievements() {
  const rows = ACHIEVEMENTS.map((a) => ({
    id: a.slug,
    slug: a.slug,
    title: a.title,
    description: a.description,
    icon: a.icon,
    criteria: a.criteria,
    tier: a.tier,
  }));
  await upsertBatched(schema.achievements, rows);
  console.log(`Seeded ${rows.length} achievements`);
}

/**
 * Unlocking the very first unit/lesson used to happen lazily, on the app's first real request
 * (`ensureBootstrapProgress()` in src/server/actions.ts, still called there too as a defensive
 * fallback for profiles that predate this — e.g. after a `db push`/manual reset without a reseed).
 * That was racy: a genuinely cold `data/maitrise-pg` reproducibly showed every unit locked on the
 * very first page load about 2 times out of 3 in testing, self-resolving on reload — the
 * "layout awaits before children render" ordering it relied on isn't actually guaranteed by
 * Next's App Router (a layout's `{children}` can start resolving concurrently with the layout's
 * own preceding awaits, not strictly after). Doing it here instead — once, synchronously, as part
 * of the deterministic seed step that already has to run before `npm run dev` — makes the race
 * structurally impossible: the row exists before the app ever serves a single request.
 */
async function seedFirstUnitUnlock() {
  const firstUnit = UNITS_SORTED[0];
  if (!firstUnit) return;
  await db
    .insert(schema.unitProgress)
    .values({ unitId: firstUnit.slug, status: "available" })
    .onConflictDoNothing();

  const firstUnitLessons = LESSONS.filter((l) => l.unitSlug === firstUnit.slug).sort((a, b) => a.order - b.order);
  const firstLesson = firstUnitLessons[0];
  if (firstLesson) {
    await db
      .insert(schema.lessonProgress)
      .values({ lessonId: firstLesson.slug, status: "available" })
      .onConflictDoNothing();
  }
  console.log(`Unlocked first unit (${firstUnit.slug}) and its first lesson`);
}

async function seedProfileBootstrap() {
  await db
    .insert(schema.profile)
    .values({ id: "singleton", name: "Apprenant", placementDone: false })
    .onConflictDoNothing();
  await db.insert(schema.settings).values({ profileId: "singleton" }).onConflictDoNothing();
  await db.insert(schema.userStats).values({ id: "singleton" }).onConflictDoNothing();
  await seedFirstUnitUnlock();
  console.log("Ensured profile/settings/userStats bootstrap rows exist");
}

async function main() {
  await seedLevels();
  await seedUnitsAndLessons();
  await seedVocab();
  await seedVerbs();
  await seedGrammar();
  await seedReadings();
  await seedAchievements();
  await seedProfileBootstrap();
}

// PGlite/postgres-js can leave a handle open (a WASM worker, a pooled socket) that keeps Node's
// event loop alive after all work is done — explicit exit rather than relying on natural
// event-loop-empty exit, matching seed-demo.ts. Without this the script hangs forever after
// printing "Seed complete." until killed manually. Caught by actually running it, not typechecking.
main()
  .then(() => {
    console.log("Seed complete.");
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
