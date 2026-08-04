/**
 * Loads /content/*.json into SQLite. Safe to re-run: content tables are upserted by their
 * stable, content-derived ids (never random), so re-seeding after the learner has progress
 * updates content in place instead of cascading deletes through their cards/progress rows.
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

function seedLevels(db: Tx) {
  for (const id of ["A1", "A2", "B1", "B2", "C1"] as const) {
    db.insert(schema.levels)
      .values({ id, title: LEVEL_TITLES[id], order: LEVEL_ORDER[id] })
      .onConflictDoUpdate({
        target: schema.levels.id,
        set: { title: LEVEL_TITLES[id], order: LEVEL_ORDER[id] },
      })
      .run();
  }
  console.log(`Seeded ${5} levels`);
}

function seedUnitsAndLessons(db: Tx) {
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
    db.insert(schema.units)
      .values(row)
      .onConflictDoUpdate({ target: schema.units.id, set: row })
      .run();
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
    db.insert(schema.lessons)
      .values(row)
      .onConflictDoUpdate({ target: schema.lessons.id, set: row })
      .run();
  }
  console.log(`Seeded ${UNITS.length} units, ${LESSONS.length} lessons`);
}

function seedVocab(db: Tx) {
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
      db.insert(schema.vocabEntries)
        .values(row)
        .onConflictDoUpdate({ target: schema.vocabEntries.id, set: row })
        .run();
      total++;
    }
  }
  console.log(`Seeded ${total} vocab entries`);
}

function seedVerbs(db: Tx) {
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
    db.insert(schema.verbs)
      .values(verbRow)
      .onConflictDoUpdate({ target: schema.verbs.id, set: verbRow })
      .run();

    for (const c of verb.conjugations) {
      const conjRow = {
        id: `${verb.infinitive}-${c.tense}-${c.person}`,
        verbId: verb.infinitive,
        tense: c.tense,
        person: c.person,
        form: c.form,
        isIrregular: c.isIrregular,
      };
      db.insert(schema.verbConjugations)
        .values(conjRow)
        .onConflictDoUpdate({ target: schema.verbConjugations.id, set: conjRow })
        .run();
    }
  }
  console.log(`Seeded ${verbs.length} verbs`);
}

function seedGrammar(db: Tx) {
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
      db.insert(schema.grammarPoints)
        .values(row)
        .onConflictDoUpdate({ target: schema.grammarPoints.id, set: row })
        .run();
      total++;
    }
  }
  console.log(`Seeded ${total} grammar points`);
}

function seedReadings(db: Tx) {
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
      db.insert(schema.readingPassages)
        .values(row)
        .onConflictDoUpdate({ target: schema.readingPassages.id, set: row })
        .run();
      total++;
    }
  }
  console.log(`Seeded ${total} reading passages`);
}

function seedAchievements(db: Tx) {
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
    db.insert(schema.achievements)
      .values(row)
      .onConflictDoUpdate({ target: schema.achievements.id, set: row })
      .run();
  }
  console.log(`Seeded ${ACHIEVEMENTS.length} achievements`);
}

function seedProfileBootstrap(db: Tx) {
  db.insert(schema.profile)
    .values({ id: "singleton", name: "Apprenant", placementDone: false })
    .onConflictDoNothing()
    .run();
  db.insert(schema.settings).values({ profileId: "singleton" }).onConflictDoNothing().run();
  db.insert(schema.userStats).values({ id: "singleton" }).onConflictDoNothing().run();
  console.log("Ensured profile/settings/userStats bootstrap rows exist");
}

function main() {
  db.transaction((tx) => {
    seedLevels(tx);
    seedUnitsAndLessons(tx);
    seedVocab(tx);
    seedVerbs(tx);
    seedGrammar(tx);
    seedReadings(tx);
    seedAchievements(tx);
    seedProfileBootstrap(tx);
  });
  console.log("Seed complete.");
}

main();
