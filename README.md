# Maîtrise

A French learning app, A1 → C1. Single learner, fully local (SQLite file, no auth, no cloud).
See [PLAN.md](./PLAN.md) for the full data model, curriculum map, and build status, and
[DECISIONS.md](./DECISIONS.md) for judgment calls made while building.

## Setup

```bash
npm install
npm run seed    # runs migrations, validates content, seeds the SQLite DB from /content
npm run dev     # http://localhost:3000
```

## Scripts

| Script | Does |
|---|---|
| `npm run dev` / `build` / `start` | Next.js dev server / production build / start |
| `npm run typecheck` | `tsc --noEmit`, strict mode |
| `npm run lint` | ESLint (Next.js core-web-vitals + TypeScript) |
| `npm run test` / `test:watch` | Vitest unit tests |
| `npm run e2e` | Playwright E2E (needs `npx playwright install` once) |
| `npm run db:generate` | Regenerate Drizzle migration SQL from `src/db/schema.ts` |
| `npm run db:migrate` | Apply migrations to `data/maitrise.db` |
| `npm run validate-content` | Fail loudly if `/content` is incomplete or malformed |
| `npm run seed` | migrate → validate-content → load `/content` into the DB |
| `npm run seed:demo` | Overlay a realistic demo profile (week 1 / 12 / 52 of use) |

## Architecture

- **Next.js 15 App Router + TypeScript strict.** No `any`.
- **SQLite via Drizzle ORM** (`src/db/schema.ts`), written Postgres-compatible (text-enum unions,
  integer-ms timestamps, explicit FKs) so a future move to `drizzle-orm/pg-core` is a driver swap.
  The DB file lives at `data/maitrise.db` (gitignored — it's derived from `/content` + your local
  progress, not something to version).
- **Content is data, not code.** `/content/vocab/{topic}.json`, `/content/grammar/{unit}.json`,
  `/content/sentences/{topic}.json`, `/content/verbs/verbs.json` are the source of truth; `npm run
  seed` loads them into SQLite. `scripts/validate-content.ts` is the gate — it fails the build if a
  topic has fewer than 80 entries, a schema field is missing, a lemma is duplicated within a topic,
  or the 4,000-entry total floor isn't met.
- **`src/content/`** holds the schemas (Zod) and structural data that content authoring depends on:
  `topics.ts` (the 40 canonical topics), `curriculum.ts` (the 44 CEFR units and their lesson nodes),
  `schema.ts` (Zod schemas mirroring the DB shape, used by both the validator and any authoring
  tooling).
- **FSRS spaced-repetition engine**, **exercise engine**, **skill tree/XP/streaks**, **grammar
  system**, **dashboard**, and **audio/TTS layer** are documented in PLAN.md §§4–7 and land in later
  build phases — check PLAN.md's checkboxes for current status.

## Content-authoring guide

### Adding vocabulary to an existing topic

Append entries to `/content/vocab/{topic-slug}.json` (topic slugs are in `src/content/topics.ts`).
Each entry must match `vocabEntrySchema` in `src/content/schema.ts`:

```ts
{
  id: string;                 // unique within the topic file
  fr: string;                 // "la bibliothèque"
  en: string;                 // "library"
  lemma: string;               // "bibliothèque" — must be unique within the topic
  pos: "noun"|"verb"|"adj"|"adv"|"prep"|"conj"|"phrase"|"pronoun";
  gender?: "m"|"f"|"both";
  plural?: string;
  ipa: string;                // "/bi.bli.jɔ.tɛk/"
  cefr: "A1"|"A2"|"B1"|"B2"|"C1";
  topic: string;               // must equal the filename slug
  register: "neutre"|"familier"|"soutenu"|"argot";
  exampleFr: string;
  exampleEn: string;
  collocations?: string[];
  fauxAmi?: string;
  mnemonic?: string;
  audioText: string;          // what the TTS layer speaks
}
```

Run `npm run validate-content` after editing — it checks schema conformance, the 80-entries-per-topic
floor, duplicate lemmas, and the 4,000-entry total.

### Adding a brand-new topic

1. Add `{ slug, label }` to `TOPICS` in `src/content/topics.ts`.
2. Create `/content/vocab/{slug}.json` with ≥80 entries spanning CEFR levels.
3. Optionally add `/content/sentences/{slug}.json` (schema: `sentenceSchema`).
4. Reference the new topic slug from a unit's `topics` array in `src/content/curriculum.ts` if it
   should back a specific lesson.
5. `npm run validate-content`, then `npm run seed`.

### Adding grammar content

Each of the 44 units needs `/content/grammar/{unit-slug}.json` (unit slugs are in
`UNITS` in `src/content/curriculum.ts`), matching `grammarUnitFileSchema`: an array of grammar points,
each with 6–10 annotated examples, common mistakes, and a "why this trips up English speakers" note.

### Adding verbs

All verbs live in one file, `/content/verbs/verbs.json`, matching `verbFileSchema` — infinitive,
group, auxiliary, past participle, frequency rank, and a full conjugation table (tense × person).
`validate-content` requires ≥120 verbs and checks that the core irregular verbs (être, avoir, aller,
faire, pouvoir, vouloir, devoir, savoir, voir, venir, prendre, mettre, dire, partir, sortir) are all
present.
