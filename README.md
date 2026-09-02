# Maîtrise

A French learning app, A1 → C1. Single learner, no auth. Runs entirely locally with zero setup, or
deploys as a real always-on app (Vercel + a hosted Postgres) — same code, same schema, either way.
See [PLAN.md](./PLAN.md) for the full data model, curriculum map, and build status, and
[DECISIONS.md](./DECISIONS.md) for judgment calls made while building.

## Setup (local)

```bash
npm install
npm run seed    # runs migrations, validates content, seeds the DB from /content
npm run dev     # http://localhost:3000
```

No database to install or configure. With `DATABASE_URL` unset, the app runs against an embedded,
file-backed Postgres ([PGlite](https://pglite.dev) — real Postgres compiled to WASM) at
`data/maitrise-pg/`.

## Deploying (Vercel + hosted Postgres)

1. Push this repo to GitHub and import it into Vercel.
2. In the Vercel project → **Storage** → **Create Database** → **Postgres** (Neon-backed). Vercel
   wires up `DATABASE_URL` (and a few aliases) as project environment variables automatically.
3. Run the migration + seed once against that database — either via `vercel env pull .env.local`
   and running `npm run seed` locally with that `.env.local` loaded, or from any machine with
   `DATABASE_URL` set to the same connection string.
4. Deploy. Every request now reads/writes the real hosted Postgres instead of the local embedded
   one — progress persists across deploys and cold starts, unlike a serverless function's local disk.

Any other Postgres host (Neon, Supabase, Railway, RDS…) works the same way — just set
`DATABASE_URL` to its connection string. See `.env.example`.

## Scripts

| Script | Does |
|---|---|
| `npm run dev` / `build` / `start` | Next.js dev server / production build / start |
| `npm run typecheck` | `tsc --noEmit`, strict mode |
| `npm run lint` | ESLint (Next.js core-web-vitals + TypeScript) |
| `npm run test` / `test:watch` | Vitest unit tests |
| `npm run e2e` | Playwright E2E (needs `npx playwright install` once) |
| `npm run db:generate` | Regenerate Drizzle migration SQL from `src/db/schema.ts` |
| `npm run db:migrate` | Apply migrations — to `DATABASE_URL` if set, else to the local embedded Postgres |
| `npm run validate-content` | Fail loudly if `/content` is incomplete or malformed |
| `npm run seed` | migrate → validate-content → load `/content` into the DB |
| `npm run seed:demo` | Overlay a realistic demo profile (week 1 / 12 / 52 of use) |

## Architecture

- **Next.js 15 App Router + TypeScript strict.** No `any`.
- **Postgres via Drizzle ORM** (`src/db/schema.ts`, `drizzle-orm/pg-core`) — one schema, one dialect,
  everywhere. `src/db/client.ts` picks the driver at runtime: `drizzle-orm/postgres-js` against
  `DATABASE_URL` when it's set (a real deployment), otherwise `drizzle-orm/pglite` against an
  embedded, file-backed Postgres at `data/maitrise-pg/` (gitignored — derived from `/content` +
  your local progress, not something to version) so local dev stays zero-config. The client is
  cached on `globalThis` in development so Next's hot-module-reloading reuses the same PGlite
  connection instead of racing a second one against it — PGlite is single-writer, like SQLite.
- **Content is data, not code.** `/content/vocab/{topic}.json`, `/content/grammar/{unit}.json`,
  `/content/sentences/{topic}.json`, `/content/verbs/verbs.json` are the source of truth; `npm run
  seed` loads them into SQLite. `scripts/validate-content.ts` is the gate — it fails the build if a
  topic has fewer than 80 entries, a schema field is missing, a lemma is duplicated within a topic,
  or the 4,000-entry total floor isn't met.
- **`src/content/`** holds the schemas (Zod) and structural data that content authoring depends on:
  `topics.ts` (the 40 canonical topics), `curriculum.ts` (the 44 CEFR units and their lesson nodes),
  `schema.ts` (Zod schemas mirroring the DB shape, used by both the validator and any authoring
  tooling).
- **FSRS spaced-repetition engine** (`src/lib/srs/`) — stability/difficulty/retrievability, four
  independent tracks (recognition/production/listening/spelling), leech detection, grade inferred
  from correctness + latency + hint usage (never self-graded). See PLAN.md §4.
- **Exercise engine** (`src/lib/exercises/generate.ts` + `src/components/exercises/`) — all 14
  exercise kinds, crown-level gating (`CROWN_KIND_TIERS`), shared `<ExerciseShell>` contract.
- **Server layer** (`src/server/`) — `queries.ts`/`*-queries.ts` for reads (Server Components call
  these directly, no API routes), `actions.ts` for mutations (`"use server"`, called from Client
  Components). `lesson-composer.ts` and `review-composer.ts` assemble a lesson/review session's
  exercise list from due + new cards; `achievement-stats.ts` aggregates the counters the 41
  achievements (`src/content/achievements.ts`) check against.
- **Routes**: `/` (skill tree home), `/lecon/[lessonId]` and `/reviser` (focused, no nav chrome —
  the actual exercise-taking sessions), `/placement` (first-launch adaptive test), `/grammaire` +
  `/grammaire/[slug]` (reference), `/conjugaison` (trainer), `/progres` (dashboard), `/reglages`
  (settings), `/succes` (achievements gallery).
- **Audio/TTS** (`src/lib/audio/`) — Web Speech API behind a small interface so a paid provider can
  be swapped in later without touching call sites.

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
