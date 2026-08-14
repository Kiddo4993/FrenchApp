# Decisions Log

Judgment calls made while building, newest first.

---

### 2026-07-26 — Isolated git repo
`frenchapp/` was created inside a git repo rooted at the user's home directory (`~`), which also had
a real `origin` remote pointing at an unrelated GitHub repo. Flagged to the user; they chose to
`git init` a fresh, self-contained repo scoped to `frenchapp/` only. No changes made to the
home-directory repo.

### 2026-07-26 — Curriculum unit count vs. exact prompt table
Prompt table specifies 10/10/10/8/6 units for A1/A2/B1/B2/C1 (44 total). Used that exactly; assigned
concrete titles/grammar focus per unit in PLAN.md §2 since the prompt only gave level-level focus, not
per-unit breakdown.

### 2026-08-14 — `npm run build` caught pages statically prerendered at build time (real bug)
Neither `tsc --noEmit` nor `next dev` (which always renders on-demand) surfaced this — only the
actual production build did. Next's App Router defaults a route to **static** prerendering unless it
uses a dynamic API (cookies/headers/searchParams) or `dynamic = "force-dynamic"`. None of this app's
Server Components use those APIs — they just call async DB query functions — so `next build` had
silently prerendered `/`, `/progres`, `/reglages`, `/succes`, `/grammaire`, `/conjugaison`, `/reviser`
as static HTML frozen at build time. Under `npm run build && npm start` (not `next dev`, which this
never affects) the learner would see whatever DB state existed *at build time* forever — XP, streak,
skill tree, everything — never their actual live progress. Fixed by adding
`export const dynamic = "force-dynamic"` to `src/app/(app)/layout.tsx` (cascades to every page under
the app shell) and explicitly to `/reviser`, `/placement`, `/lecon/[lessonId]` too, since every route
here reads mutable per-user state and none of it should ever be build-time-frozen.
**Lesson: `next build` output is worth reading, not just a pass/fail signal — the route table
(○ Static vs ƒ Dynamic) told the real story here.**

### 2026-08-13 — Demo seed script: two more FK/uniqueness bugs caught by actually running it
`scripts/seed-demo.ts` (simulates ~1 year of usage with the real FSRS/XP/streak algorithms, backdated)
hit two bugs only visible at runtime, both the same category as the exerciseEvents fix above:
1. `reviewLogs.cardId` is a real FK to `cards.id` (a UUID the DB only assigns on insert) — the
   script was passing `vocabId` there. Fixed by generating each simulated card's UUID up front
   (`SimCard.id`) so review-log rows created throughout the year-long loop can reference it before
   the `cards` row itself is bulk-inserted at the end.
2. `session_logs.date` is UNIQUE, but `dateAt()`'s local `setHours()` combined with UTC-day
   arithmetic can map two different simulated days to the same ISO date string around very
   early/late simulated hours. Fixed by keying session-log accumulation in a `Map<date, …>` and
   merging same-date entries instead of assuming one push per simulated day is always a distinct row.
Also retuned daily new-word/review volume downward after the first successful run produced an
unrealistic level ~150 (100·xp^1.5 curve) — landed on ~level 90 after a year, closer to a very
dedicated "Intense" (200 XP/day) user than a numerically-absurd one.

### 2026-08-06 — Grammar section + conjugation trainer (delegated build)
Built by a background agent against the same conventions as the rest of the app (Server Components
for data, Base UI's `render` prop, null→undefined normalization at DB boundaries). Notable calls:
query helpers for both the grammar reference and the conjugation trainer live in one new
`src/server/grammar-queries.ts` (task scope was the whole vertical slice, not two files); the
conjugation trainer bulk-loads all ~120 verbs' conjugations (2 queries) once server-side rather than
per-verb fetches, since the data volume is trivial for a local single-user app; verb/tense pickers use
`<Select>` for both (not `<Tabs>`, which fought the accuracy-matrix layout at 390px); the
accuracy-per-tense matrix persists across verb switches (keyed by tense only, matching PLAN.md's
literal wording); "timed drilling" was interpreted as continuous rapid-fire flashcards rather than a
countdown-timer UI, consistent with the app's "restrained celebration" design direction (PLAN.md §8).

### 2026-08-06 — Normalize DB rows to `VocabEntry` at the query/composition boundary
Drizzle's SQLite select type marks nullable columns `T | null` (e.g. `vocabEntries.gender`), while
the Zod-derived `VocabEntry` type the exercise-generation layer (`generate.ts`) is built against uses
`T | undefined` for optional fields (`z.optional()`). Rather than loosening `VocabEntry` (which is
also the content-authoring/validation type — loosening it would let `null` slip into seed JSON
unnoticed) or loosening Drizzle's inferred type, `lesson-composer.ts` normalizes `null → undefined`
once, right after the DB fetch. Any future code pulling `vocabEntries` rows into a function typed
against `VocabEntry` will hit the same mismatch — normalize at that boundary rather than widening
either type.

### 2026-08-04 — Base UI polymorphism is `render={<X/>}`, not `asChild`
Since shadcn's `button.tsx` etc. are generated on `@base-ui/react` (see the earlier Radix-vs-Base-UI
decision), the polymorphic-render pattern is Base UI's `render` prop (`<Button render={<Link .../>}>`),
not Radix's `asChild` + child-element pattern most shadcn examples/docs assume. Using `asChild` here
type-errors (`ButtonProps` has no such field). Worth remembering for every future page that wants a
link styled as a button, tab, or menu item.

### 2026-08-02 — `exerciseEvents` references `vocabEntries`, not `cards` (bug caught by smoke test)
Wrote a throwaway script (`scripts/_smoke-test.ts`, deleted after use — not committed) that actually
calls `submitExerciseResult`/`finalizeLessonSession` against the seeded DB instead of trusting
typecheck alone. It immediately hit `FOREIGN KEY constraint failed`: `exerciseEvents.cardId` was
declared as a FK to `cards.id`, but `ExercisePrompt.cardId` (src/types/exercise.ts, set by
`generate.ts` as `target.id`) is actually the **vocab entry's id** — the matching `cards` row may not
exist yet the first time a word is drilled. Renamed the column to `vocabId` referencing
`vocabEntries.id` instead. Left `ExercisePrompt.cardId`'s name alone (out of scope, used consistently
across the whole exercise engine as "id of the content item this prompt targets") — fixed the
schema to match reality rather than renaming a widely-used, already-tested field.
**Lesson: typecheck passing is not evidence a DB-touching action works — run it.**

### 2026-08-02 — Exercise generation split: per-word cycle vs. curated/batch builders
`assembleLesson` (src/lib/exercises/generate.ts) originally only cycled through 7 of the 14 exercise
kinds — the other 7 (listening, speaking, sentence_ordering, matching_pairs, conjugation_drill,
register_swap, reading_comprehension) had UI components but no prompt generator wiring them up.
Fixed by splitting them: `listening`/`speaking`/`sentence_ordering` are derivable from a single
`VocabEntry` exactly like the existing 7, so they were appended (not interleaved, to preserve
`KIND_CYCLE[5] === "gender_drill"` that a test already depends on) to `KIND_CYCLE` and wired into
`assembleLesson`'s switch. The remaining 4 don't fit the "one prompt per target word" model —
`matching_pairs` needs a batch of ~6 words, `conjugation_drill` needs verb-conjugation data (not a
vocab entry), and `register_swap`/`reading_comprehension` need curated content that doesn't exist per
word (familier→soutenu pairs, reading passages). Their builders (`buildMatchingPairsPrompt`,
`buildConjugationDrillPrompt`, `buildRegisterSwapPrompt`, `buildReadingComprehensionPrompt`) are
exported standalone; the lesson-runner page (Phase 5) composes them in based on lesson type
(`skillFocus`) rather than `assembleLesson` trying to do it uniformly.

### 2026-08-02 — register-swap content is a single flat file, not per-topic
Unlike vocab/grammar/sentences (one file per topic/unit), `content/register-swap.json` is one file
of ~40 familier→soutenu sentence pairs spanning B1–C1 (register swap is B1+ only per PLAN.md §4). It
isn't tied to any single topic, so a `content/vocab/{topic}.json`-style split would be artificial.
Not run through `validate-content.ts`'s hard-fail gate (no minimum count was specified for it) — it's
schema-validated (`registerSwapFileSchema`) but treated as supplementary content, same tier as
sentences/readings.

### 2026-08-02 — Reading passages seeded for 10 of 40 topics, not all 40
`content/readings/{topic}.json` (readingComprehension exercise) has one passage each for 10 topics
spanning A1→C1 (salutations, routine-quotidienne, voyages-vacances, travail-metiers,
technologie-internet, livres-litterature, politique-societe, environnement-climat,
philosophie-idees-abstraites, histoire-culture) rather than all 40 — PLAN.md's hard 80-entry/4000-total
requirement is scoped to vocab only; reading passages have no specified minimum. This gives every CEFR
level real reading-comprehension content to exercise the feature end-to-end; expanding topic coverage
is pure content work with no architecture change, left as a documented gap (see final report) rather
than manufacturing dozens more passages this pass.

### 2026-08-01 — A content subagent ran an unprompted `git commit` ("Initial commit", 4683b48)
One of the background vocab-generation agents (with Bash access in this same working tree) ran
`git add -A && git commit -m "Initial commit"` on its own initiative — not instructed to by me, and
not something any agent was asked to do. Investigated immediately: the commit only contains legitimate
files (its own vocab JSON, my in-progress `src/lib/progression/*` files, and an auto-appended
Bash-permission-allowlist entry in `.claude/settings.json` from the harness's normal permission-caching
— not a manual/malicious settings edit). No data loss, no destructive history rewrite, nothing pushed
anywhere (repo is local-only). Left the commit as-is rather than rebasing to fix the message — not
worth rewriting history over a cosmetic issue. Noting here so future sessions aren't surprised by an
"Initial commit" in the log that didn't come from the usual per-phase commit flow.

### 2026-07-30 — Fixed a real bug: ExerciseShell's reset effect clobbered child-registered keyboard shortcuts
`ExerciseShell`'s prompt-change effect used to unconditionally null out `checker`/`optionActivators`
refs. Because React runs child effects before parent effects on the same commit, `McqExercise` (child)
would register its 1-4 option activators, and then `ExerciseShell`'s own effect (parent, same commit)
would immediately wipe them back to `null` — silently breaking the 1-4 keyboard shortcuts on every
exercise, every time. Caught by a component test (`exercise-shell.test.tsx`) asserting the number-key
shortcut actually selects an option. Fix: removed the clobbering lines; each exercise component's own
effect (keyed on `prompt.id`) is solely responsible for registering/clearing its handlers, which is
sufficient since those effects already re-run on prompt change. Also removed `AnimatePresence
mode="wait"` between the Check-button bar and the feedback bar — it delayed the feedback bar behind a
full exit-animation cycle, which both hurt perceived responsiveness and made the transition
untestable under jsdom (no real animation frames).

### 2026-07-29 — Standalone sentence banks and reading passages deferred out of Phase 2
`validate-content.ts` treats `/content/sentences/{topic}.json` as optional (warns, doesn't fail) and
doesn't check `/content/readings/*` at all — the hard requirements are the vocab floor, the verb
table, and per-unit grammar. Every vocab entry already carries a natural `exampleFr`/`exampleEn`
sentence pair, which covers a meaningful chunk of exercise needs (cloze, translation, dictation)
without a separate bank. Deferring dedicated sentence banks and reading passages to Phase 4 (exercise
engine) / Phase 8 (grammar+reading), once it's clear exactly what shapes the exercise components need,
rather than generating them speculatively now.

### 2026-07-29 — Vocab content generated via parallel subagents, verb tables generated by code
40 topics × 100+ entries each is ~4,000+ hand-quality entries — too much to author serially in this
conversation without either truncating quality or burning the whole session on typing JSON. Split
into 10 batches (grouped by CEFR-difficulty profile: beginner/mixed/intermediate-advanced/advanced
topics get different level-distribution targets) and 5 grammar batches (one per CEFR level), each run
as an independent background agent writing directly to its own `/content/*.json` files — fully
parallel-safe since no two agents touch the same file. Verb conjugations are the opposite case:
correctness matters more than volume, and an LLM freely generating irregular conjugations is exactly
where hallucination risk is highest. Built `src/lib/conjugation/` (rules engine for regular -er/-ir/-re
+ a hand-verified irregular table) as real app code instead, then generated `verbs.json` from it
deterministically — the conjugation engine also satisfies PLAN.md §1's "verb handling" requirement
directly, not just as a content-generation shortcut.

### 2026-07-28 — eslint-config-next@15.5.22 ships legacy-shape config; bridged with FlatCompat
`create-next-app`'s generated `eslint.config.mjs` assumes `eslint-config-next` exports flat-config
arrays (`import nextVitals from "eslint-config-next/core-web-vitals"`), but the version resolved by
`^15.4.0` (15.5.22, matching the installed `next` release) still ships the legacy `.eslintrc`
`{ extends: [...] }` shape with no `exports` map, no `.mjs`/flat variant. Rewrote `eslint.config.mjs`
to bridge it via `@eslint/eslintrc`'s `FlatCompat` (transitively available through `eslint@9`), which
is the documented pattern for consuming legacy shareable configs under ESLint 9 flat config. Lint now
passes cleanly.

### 2026-07-27 — Lesson titles templated, not hand-authored per node
44 units × 8 skill-tree nodes (6 lessons + review + boss) = 352 lesson nodes. Hand-authoring a unique
creative title for all 352 would burn enormous effort for no functional gain over a template driven
by each unit's own title/focus/topics (`buildLessonsForUnit` in `src/content/curriculum.ts`). Titles
still differ per unit and the pattern (vocab×2, grammar×2, mixed, production, review, boss) matches
PLAN.md §5's exercise-type progression (crown 5 = free translation + speaking only maps to the
"Production" node). Revisit only if the learner wants bespoke lesson framing later.

### 2026-07-27 — Topic count corrected 39 → 40
PLAN.md initially said "39 topics" in the §3 heading; recounting the prompt's topic bullet list gives
40 (Salutations ... Formal writing & correspondence). Fixed the heading; `src/content/topics.ts` has
the authoritative 40-entry `TOPICS` array. At 80 min/topic that's a 3,200 floor, comfortably under the
4,000+ total target since most topics will carry 100+.

### 2026-07-26 — shadcn/ui now defaults to Base UI, not Radix
`shadcn init` (latest CLI, style `base-nova`) generates components on top of `@base-ui/react`, not
`@radix-ui/*`, and ships its own `shadcn/tailwind.css` base layer. I had pre-installed
`@radix-ui/react-*` packages anticipating the older Radix-based shadcn convention; removed them once
confirmed unused (`grep` found zero imports) rather than fighting the CLI's current default. Matching
what the tool actually generates beats forcing an older convention it no longer uses.

### 2026-07-26 — npm audit: postcss/sharp high-severity, left unresolved
`npm audit --omit=dev` flags transitive `postcss`/`sharp` vulnerabilities inside `next`'s optional
image-optimization dependency chain. The only automated fix (`npm audit fix --force`) downgrades
`next` to `9.3.3`, which is not viable. This is a local-only, single-user app with no untrusted image
uploads, so the risk surface is minimal; left as a known gap rather than downgrading Next.js. Revisit
when Next.js ships an updated `sharp`.

### 2026-07-26 — Postgres-compatible SQLite schema
Drizzle's SQLite dialect used for actual storage (file-based, zero-config per spec), but schema avoids
SQLite-only patterns (e.g. no `WITHOUT ROWID`, timestamps as integer-ms not SQLite `julianday`, enums
as `text` with app-level union types) so a future move to `drizzle-orm/pg-core` is a driver swap, not a
schema rewrite.
