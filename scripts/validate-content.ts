/**
 * Fails (non-zero exit) if:
 *  - any topic's vocab file has fewer than MIN_ENTRIES_PER_TOPIC entries
 *  - any vocab/verb/grammar/sentence entry is missing a required field or fails its schema
 *  - a duplicate lemma exists within a topic
 *  - the total vocab count across all topics is below MIN_TOTAL_ENTRIES
 *  - fewer than 120 verbs are defined, or a required irregular verb is missing
 *  - any of the 44 curriculum units is missing its grammar file
 */
import fs from "node:fs";
import path from "node:path";
import {
  grammarUnitFileSchema,
  sentenceFileSchema,
  verbFileSchema,
  vocabFileSchema,
} from "../src/content/schema";
import { MIN_ENTRIES_PER_TOPIC, MIN_TOTAL_ENTRIES, TOPICS } from "../src/content/topics";
import { UNITS } from "../src/content/curriculum";

const ROOT = path.join(__dirname, "..", "content");
const REQUIRED_IRREGULAR_VERBS = [
  "être", "avoir", "aller", "faire", "pouvoir", "vouloir", "devoir", "savoir",
  "voir", "venir", "prendre", "mettre", "dire", "partir", "sortir",
];

let errors = 0;
let warnings = 0;

function fail(msg: string): void {
  console.error(`✗ ${msg}`);
  errors++;
}

function warn(msg: string): void {
  console.warn(`! ${msg}`);
  warnings++;
}

function readJson(filePath: string): unknown {
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}

function validateVocab(): number {
  let total = 0;
  for (const topic of TOPICS) {
    const file = path.join(ROOT, "vocab", `${topic.slug}.json`);
    if (!fs.existsSync(file)) {
      fail(`Missing vocab file for topic "${topic.slug}" (${file})`);
      continue;
    }
    let json: unknown;
    try {
      json = readJson(file);
    } catch (e) {
      fail(`${topic.slug}.json is not valid JSON: ${(e as Error).message}`);
      continue;
    }
    const parsed = vocabFileSchema.safeParse(json);
    if (!parsed.success) {
      fail(`${topic.slug}.json failed schema validation:\n${parsed.error.issues
        .slice(0, 10)
        .map((i) => `    ${i.path.join(".")}: ${i.message}`)
        .join("\n")}`);
      continue;
    }
    const entries = parsed.data;
    if (entries.length < MIN_ENTRIES_PER_TOPIC) {
      fail(
        `${topic.slug}: only ${entries.length} entries, needs >= ${MIN_ENTRIES_PER_TOPIC}`,
      );
    }
    const lemmaSeen = new Map<string, number>();
    for (const [i, entry] of entries.entries()) {
      if (entry.topic !== topic.slug) {
        fail(`${topic.slug}.json[${i}] has topic "${entry.topic}", expected "${topic.slug}"`);
      }
      const key = entry.lemma.trim().toLowerCase();
      if (lemmaSeen.has(key)) {
        fail(
          `${topic.slug}: duplicate lemma "${entry.lemma}" at index ${i} (first seen at ${lemmaSeen.get(key)})`,
        );
      } else {
        lemmaSeen.set(key, i);
      }
    }
    total += entries.length;
  }
  return total;
}

function validateVerbs(): void {
  const file = path.join(ROOT, "verbs", "verbs.json");
  if (!fs.existsSync(file)) {
    fail(`Missing verb file (${file})`);
    return;
  }
  const parsed = verbFileSchema.safeParse(readJson(file));
  if (!parsed.success) {
    fail(
      `verbs.json failed schema validation:\n${parsed.error.issues
        .slice(0, 10)
        .map((i) => `    ${i.path.join(".")}: ${i.message}`)
        .join("\n")}`,
    );
    return;
  }
  const verbs = parsed.data;
  if (verbs.length < 120) {
    fail(`verbs.json: only ${verbs.length} verbs, needs >= 120`);
  }
  const infinitives = new Set(verbs.map((v) => v.infinitive));
  for (const req of REQUIRED_IRREGULAR_VERBS) {
    if (!infinitives.has(req)) {
      fail(`verbs.json: missing required irregular verb "${req}"`);
    }
  }
  const dupes = new Map<string, number>();
  verbs.forEach((v, i) => {
    if (dupes.has(v.infinitive)) {
      fail(`verbs.json: duplicate infinitive "${v.infinitive}" at index ${i}`);
    }
    dupes.set(v.infinitive, i);
  });
}

function validateGrammar(): void {
  for (const unit of UNITS) {
    const file = path.join(ROOT, "grammar", `${unit.slug}.json`);
    if (!fs.existsSync(file)) {
      fail(`Missing grammar file for unit "${unit.slug}" (${file})`);
      continue;
    }
    const parsed = grammarUnitFileSchema.safeParse(readJson(file));
    if (!parsed.success) {
      fail(
        `${unit.slug}.json (grammar) failed schema validation:\n${parsed.error.issues
          .slice(0, 10)
          .map((i) => `    ${i.path.join(".")}: ${i.message}`)
          .join("\n")}`,
      );
    }
  }
}

function validateSentences(): void {
  for (const topic of TOPICS) {
    const file = path.join(ROOT, "sentences", `${topic.slug}.json`);
    if (!fs.existsSync(file)) {
      warn(`No sentence file for topic "${topic.slug}" (${file}) — optional but recommended`);
      continue;
    }
    const parsed = sentenceFileSchema.safeParse(readJson(file));
    if (!parsed.success) {
      fail(
        `${topic.slug}.json (sentences) failed schema validation:\n${parsed.error.issues
          .slice(0, 10)
          .map((i) => `    ${i.path.join(".")}: ${i.message}`)
          .join("\n")}`,
      );
    }
  }
}

function main(): void {
  console.log("Validating content...\n");

  const total = validateVocab();
  validateVerbs();
  validateGrammar();
  validateSentences();

  console.log(`\nTotal vocab entries: ${total} (target >= ${MIN_TOTAL_ENTRIES})`);
  if (total < MIN_TOTAL_ENTRIES) {
    fail(`Total vocab entries ${total} is below the ${MIN_TOTAL_ENTRIES} minimum`);
  }

  console.log(`\n${errors} error(s), ${warnings} warning(s).`);
  if (errors > 0) {
    process.exit(1);
  }
  console.log("Content OK.");
}

main();
