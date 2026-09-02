/**
 * Loads /content/*.json into Postgres (hosted, or the local embedded PGlite — see src/db/client.ts).
 * Safe to re-run: content tables are upserted by their stable, content-derived ids (never random),
 * so re-seeding after the learner has progress updates content in place instead of cascading
 * deletes through their cards/progress rows.
 */
import fs from "node:fs";
import path from "node:path";
import { db } from "../src/db/client";
import * as schema from "../src/db/schema";
import { UNITS, LESSONS } from "../src/content/curriculum";
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

function readJson(filePath: string): unknown {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function seedLevels(db: Tx) {
  for (const id of ["A1", "A2", "B1", "B2", "C1"] as const) {
    await db
      .insert(schema.levels)
      .values({ id, title: LEVEL_TITLES[id], order: LEVEL_ORDER[id] })
      .onConflictDoUpdate({
        target: schema.levels.id,
        set: { title: LEVEL_TITLES[id], order: LEVEL_ORDER[id] },
      });
  }
  console.log(`Seeded ${5} levels`);
}

async function seedUnitsAndLessons(db: Tx) {
  for (const unit of UNITS) {
    const row = {
      id: unit.slug,
      levelId: unit.level,
      order: unit.order,
      slug: unit.slug,
      title: unit.title,
      focus: unit.focus,
      topics: unit.topics,
    };
    await db.insert(schema.units).values(row).onConflictDoUpdate({ target: schema.units.id, set: row });
  }
  for (const lesson of LESSONS) {
    const row = {
      id: lesson.slug,
      unitId: lesson.unitSlug,
      order: lesson.order,
      kind: lesson.kind,
      title: lesson.title,
      skillFocus: lesson.skillFocus,
      topicSlug: lesson.topicSlug,
    };
    await db.insert(schema.lessons).values(row).onConflictDoUpdate({ target: schema.lessons.id, set: row });
  }
  console.log(`Seeded ${UNITS.length} units, ${LESSONS.length} lessons`);
}

async function seedVocab(db: Tx) {
  let total = 0;
  for (const topic of TOPICS) {
    const file = path.join(CONTENT_ROOT, "vocab", `${topic.slug}.json`);
    if (!fs.existsSync(file)) continue;
    const entries = vocabFileSchema.parse(readJson(file));
    for (const entry of entries) {
      const row = {
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
      };
      await db
        .insert(schema.vocabEntries)
        .values(row)
        .onConflictDoUpdate({ target: schema.vocabEntries.id, set: row });
      total++;
    }
  }
  console.log(`Seeded ${total} vocab entries`);
}

async function seedVerbs(db: Tx) {
  const file = path.join(CONTENT_ROOT, "verbs", "verbs.json");
  if (!fs.existsSync(file)) return;
  const verbs = verbFileSchema.parse(readJson(file));
  for (const verb of verbs) {
    const verbRow = {
      id: verb.infinitive,
      infinitive: verb.infinitive,
      group: verb.group,
      auxiliary: verb.auxiliary,
      pastParticiple: verb.pastParticiple,
      frequencyRank: verb.frequencyRank,
    };
    await db.insert(schema.verbs).values(verbRow).onConflictDoUpdate({ target: schema.verbs.id, set: verbRow });

    for (const c of verb.conjugations) {
      const conjRow = {
        id: `${verb.infinitive}-${c.tense}-${c.person}`,
        verbId: verb.infinitive,
        tense: c.tense,
        person: c.person,
        form: c.form,
        isIrregular: c.isIrregular,
      };
      await db
        .insert(schema.verbConjugations)
        .values(conjRow)
        .onConflictDoUpdate({ target: schema.verbConjugations.id, set: conjRow });
    }
  }
  console.log(`Seeded ${verbs.length} verbs`);
}

async function seedGrammar(db: Tx) {
  let total = 0;
  for (const unit of UNITS) {
    const file = path.join(CONTENT_ROOT, "grammar", `${unit.slug}.json`);
    if (!fs.existsSync(file)) continue;
    const parsed = grammarUnitFileSchema.parse(readJson(file));
    for (const point of parsed.points) {
      const row = {
        id: point.slug,
        unitId: unit.slug,
        slug: point.slug,
        title: point.title,
        explanationEn: point.explanationEn,
        examples: point.examples,
        commonMistakes: point.commonMistakes,
        whyItTrips: point.whyItTrips,
        searchTags: point.searchTags,
      };
      await db
        .insert(schema.grammarPoints)
        .values(row)
        .onConflictDoUpdate({ target: schema.grammarPoints.id, set: row });
      total++;
    }
  }
  console.log(`Seeded ${total} grammar points`);
}

async function seedReadings(db: Tx) {
  let total = 0;
  for (const topic of TOPICS) {
    const file = path.join(CONTENT_ROOT, "readings", `${topic.slug}.json`);
    if (!fs.existsSync(file)) continue;
    const passages = readingFileSchema.parse(readJson(file));
    for (const passage of passages) {
      const row = {
        id: passage.id,
        cefr: passage.cefr,
        topic: passage.topic,
        title: passage.title,
        bodyFr: passage.bodyFr,
        questions: passage.questions,
      };
      await db
        .insert(schema.readingPassages)
        .values(row)
        .onConflictDoUpdate({ target: schema.readingPassages.id, set: row });
      total++;
    }
  }
  console.log(`Seeded ${total} reading passages`);
}

async function seedAchievements(db: Tx) {
  for (const a of ACHIEVEMENTS) {
    const row = {
      id: a.slug,
      slug: a.slug,
      title: a.title,
      description: a.description,
      icon: a.icon,
      criteria: a.criteria,
      tier: a.tier,
    };
    await db
      .insert(schema.achievements)
      .values(row)
      .onConflictDoUpdate({ target: schema.achievements.id, set: row });
  }
  console.log(`Seeded ${ACHIEVEMENTS.length} achievements`);
}

async function seedProfileBootstrap(db: Tx) {
  await db
    .insert(schema.profile)
    .values({ id: "singleton", name: "Apprenant", placementDone: false })
    .onConflictDoNothing();
  await db.insert(schema.settings).values({ profileId: "singleton" }).onConflictDoNothing();
  await db.insert(schema.userStats).values({ id: "singleton" }).onConflictDoNothing();
  console.log("Ensured profile/settings/userStats bootstrap rows exist");
}

async function main() {
  await db.transaction(async (tx) => {
    await seedLevels(tx);
    await seedUnitsAndLessons(tx);
    await seedVocab(tx);
    await seedVerbs(tx);
    await seedGrammar(tx);
    await seedReadings(tx);
    await seedAchievements(tx);
    await seedProfileBootstrap(tx);
  });
  console.log("Seed complete.");
}

// PGlite/postgres-js can leave a handle open (a WASM worker, a pooled socket) that keeps Node's
// event loop alive after all work is done — explicit exit rather than relying on natural
// event-loop-empty exit, matching seed-demo.ts. Without this the script hangs forever after
// printing "Seed complete." until killed manually. Caught by actually running it, not typechecking.
main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
