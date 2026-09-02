# Decisions Log

Judgment calls made while building, newest first.

---

### 2026-09-02 — Animation pass + three more real bugs, all caught by actually running things
Did a full `/animation-design`-guided pass: spring-based exercise transitions and a restrained
grading "flash" in `ExerciseShell`, real press/hover/reveal physics on `OptionButton` (replacing
plain CSS transitions), an XP count-up (`CountUp`) and staggered entrances on the results screens,
a breathing "start here" ring on the next skill-tree node plus per-node entrance stagger, and a
`layoutId`-based sliding active-tab indicator in the nav (extracted into a shared `NavLink` while at
it, incidentally fixing the sidebar/tab-bar duplication code review had flagged). All gated behind
`useReducedMotion()`.

Three more real bugs surfaced only by actually running the app repeatedly, not by typecheck/tests/
build succeeding:

1. **Tried a lazy `Proxy`-wrapped `db` client** (to also dodge `next build`'s parallel
   "collecting page data" workers each importing `src/db/client.ts` and racing to open the same
   PGlite directory — a rare, non-fatal WASM abort message seen once during a build). It made
   `db.transaction(...)` hang indefinitely — almost certainly Drizzle's internals losing correct
   `this` identity when a method is invoked through a Proxy. **Reverted.** A guaranteed hang on
   every write path is a far worse trade than an occasional cosmetic warning on a local build with
   no `DATABASE_URL` (production always sets it and uses postgres-js, which has no single-writer
   constraint at all).
2. **`scripts/seed.ts` and `scripts/migrate.ts` never exited** after finishing successfully —
   PGlite/postgres-js can leave a handle open that keeps Node's event loop alive, so both scripts
   hung forever after printing their final "complete" line until killed manually (twice this
   produced genuinely deadlocked orphan processes across turns, later blocking a *new* seed attempt
   on the same file lock). Added explicit `process.exit(0)` on the success path, matching the
   pattern `seed-demo.ts` already used.
3. **A brand-new install's very first page load** could show every unit locked (skill tree) —
   `ensureBootstrapProgress()` did a non-atomic check-then-insert, and something (observed only on
   a genuinely cold `data/maitrise-pg`, never on a warm reload) invoked it concurrently with itself
   often enough to race: both branches read "nothing unlocked yet" before either insert committed.
   Fixed with `.onConflictDoNothing()` on both inserts — cheap, and correct regardless of the exact
   mechanism, since `unitProgress.unitId`/`lessonProgress.lessonId` are already unique.

---

### 2026-08-23 — Migrated SQLite → Postgres for real deployment, without losing zero-config local dev
The user asked for a real, always-on Vercel deployment rather than just a working build. SQLite's
file-based storage is fundamentally incompatible with that: serverless functions have no persistent
disk, so progress wouldn't survive between requests. The schema had been kept Postgres-compatible
from day one specifically for this (see the original "Postgres-compatible SQLite schema" entry
below) — this pass cashed that in.

Rejected the obvious-seeming shortcut of maintaining two schema files (one `sqlite-core`, one
`pg-core`) switched by environment — that's a permanent maintenance burden (every future column
change has to be applied twice, and the two *will* drift). Instead: **one schema, one dialect
(`drizzle-orm/pg-core`), everywhere.** `src/db/client.ts` picks the driver at runtime:
- `DATABASE_URL` set → `drizzle-orm/postgres-js` against a real hosted Postgres (Vercel
  Storage/Neon, Supabase, etc.) — what a deployment needs.
- `DATABASE_URL` unset → `drizzle-orm/pglite` against an embedded, file-backed Postgres at
  `data/maitrise-pg/` — real Postgres compiled to WASM, not an emulation, so it's the *same*
  dialect/schema as production, not a third thing to keep in sync. This is what keeps `npm run dev`
  zero-config the way the original SQLite setup was, without needing a local Postgres install or
  Docker.

Column-type mapping SQLite → Postgres: `integer(mode:"boolean")` → `boolean`;
`integer(mode:"timestamp_ms")` → `timestamp`; `text(mode:"json")` → `jsonb`; `real` → `doublePrecision`
(matches SQLite's always-8-byte REAL more closely than Postgres's 4-byte `real`). Enums stayed
`text(..., {enum:[...]})` rather than native Postgres `CREATE TYPE` enums — avoids `ALTER TYPE`
migration pain when a value set grows later, at the cost of DB-level enforcement (still fully
enforced at the Zod/TypeScript layer).

`scripts/seed.ts` and `scripts/seed-demo.ts` needed a real rewrite, not just a search-and-replace:
better-sqlite3's Drizzle adapter is synchronous (`.insert(...).run()`, a synchronous
`db.transaction((tx) => {...})` callback); both Postgres drivers are async (`await
.insert(...)`, `async (tx) => {...}`). Converted every call site.

**Bug caught by actually running the seed, not just typechecking**: `next.config.ts`'s
`serverExternalPackages` still listed `better-sqlite3` after it was removed as a dependency — updated
to `@electric-sql/pglite` instead (it ships a WASM binary + on-disk data files that need the same
"don't bundle this into the server chunk" treatment, and it's only ever imported when `DATABASE_URL`
is unset, so this has zero effect on a production deployment).

**Second bug caught only by loading the app in a real browser, not by the seed script succeeding**:
on a cold `next dev` start, the skill tree home page transiently rendered every unit as locked
(including the first one, which `ensureBootstrapProgress()` unconditionally unlocks) even though a
direct DB query moments later showed the correct row already present. Root cause: `src/db/client.ts`
created its `PGlite` instance at module scope (`export const db = createDb()`), and Next's
hot-module-reloading can re-evaluate a module more than once per process without tearing down the
previous instance — PGlite is single-writer/file-locking like SQLite, so a second instance opened
against the same directory transiently contends with the first. Fixed with the standard Next-dev
pattern for this class of bug (the same one Prisma's own docs recommend): cache the client on
`globalThis`, keyed so HMR reuses the live instance instead of racing a new one against it. Also
found and killed two genuinely deadlocked stale `tsx scripts/seed.ts` processes left over from
earlier interrupted runs, both blocked on the same PGlite file lock — a reminder that this
single-writer property means local dev must never run two DB-touching processes (dev server +
migrate/seed script) against the same `data/maitrise-pg/` directory concurrently.

Old SQLite migration history (`drizzle/0000_white_veda.sql`, `0001_furry_nextwave.sql`) was deleted
and regenerated fresh as Postgres SQL — there's no production data anywhere yet to preserve a
migration path from.

---

### 2026-08-23 — `/code-review hard`: multi-agent orchestration stuck on a relay bug, took over manually
The multi-agent code-review orchestrator dispatched ~9 "finder" sub-agents across several rounds. Every
finder that finished tried to relay its findings back to the orchestrator via `SendMessage` to
`"general-purpose"` — an agent *type* name, not a resolvable address in this environment — so every
relay failed, and the orchestrator sat "waiting for finder agents" for 9+ hours with nothing able to
reach it. Each finder's actual findings were still fully visible in this session's own transcript
(agents fall back to printing results in their final response when a relay fails), so nothing was
lost — but the orchestrator itself would never terminate on its own. Stopped the orchestrator and all
remaining agents manually, compiled every finding directly from the transcript, verified the highest-
severity ones against the real code before fixing anything, and fixed what was confirmed real. Real,
verified bugs fixed this pass:
- `getWeakestCards` (queries.ts) ordered by `cards.retrievability`, a column FSRS always writes as
  exactly `1` at save time — the dashboard's "20 weakest words" panel was effectively random. Fixed to
  rank by live `currentRetrievability(card, now)`, matching the pattern `getSkillTree`'s unit-mastery
  calc already used.
- `submitPlacementTest` only created a `lessonProgress` row for the recommended unit's first lesson —
  every unit placement marked "complete" (skipped) had zero unlocked lessons, so the skill tree
  rendered those units as open sections full of individually-locked, unclickable nodes. Fixed to grant
  every lesson in a "complete" unit as complete too.
- The home page's "Prêt à commencer ?" placement-test CTA had a guard (`sections.every(locked)`) that
  could never be true, because `ensureBootstrapProgress()` always unlocks the first unit before the
  page renders — the CTA was structurally dead code on every fresh install. Fixed to key off
  `!profile.placementDone && no real progress yet` instead.
- `src/stores/lesson-session.ts`'s anti-repeat check (`dedupeAdjacent`) passed `undefined` instead of
  the just-answered card's id on the *correct*-answer branch, silently disabling the "never repeat a
  word twice in a row" guarantee on that path. Not currently reachable (today's prompt generation
  guarantees at most one prompt per card per session) but a live footgun for any future composer that
  doesn't hold that invariant — fixed defensively.
- Dashboard date displays (`StudyHeatmap`, `RetentionCurveChart`) used date-fns's local-timezone-aware
  `format()`/`startOfWeek`/`addDays` against UTC calendar-day strings (`sessionLogs.date`, from
  `actions.ts`'s `todayStr()`). For non-UTC users this could misplace a session by a day or hide it as
  "future." Rewrote both to do grid math and labeling in UTC explicitly (native `Date.UTC` arithmetic +
  `Intl.DateTimeFormat(..., {timeZone: "UTC"})`), matching the server's own day-bucketing convention
  instead of fighting it.
- `/reviser`'s new-word queue was built from the *entire* ~4,400-word vocab bank in raw DB scan order,
  which could hand an absolute beginner review words from unlocked-yet topics up to C1. Fixed to walk
  only unlocked units' topics, in curriculum order — mirroring how `lesson-composer.ts` already scopes
  a single lesson's word pool.
- Minor: a pluralization check comparing the *unrounded* value while displaying the *rounded* one
  (`StudyHeatmap`) could render "2 minute" instead of "2 minutes".

Also cleaned up what the review correctly flagged as duplication risk (not bugs, but real
maintenance hazards): consolidated the 4x-copied `VocabEntry` null→undefined normalization into
`src/server/normalize-vocab.ts`; the 4x-copied Fisher-Yates shuffle down to the one export in
`generate.ts`; the 3x-copied `CEFR_LEVELS` literal into one export from `src/content/curriculum.ts`
(the others now re-export it); the 2x-copied `HINT_ELIGIBLE_KINDS` into `grading.ts`; and the
2x-copied `StatTile` component into `src/components/lesson/StatTile.tsx`. Removed one dead code
branch (`UnitSection`'s unreachable `locked` styling). Fixed the dashboard's redundant full-table
scans (vocab/cards/reviewLogs were each fetched twice per `/progres` load) and an N+1 query in
`getLeechClearedCount` (one query per leech card instead of one batched query).

Left alone (lower severity, or bigger scope than this pass): `submitPlacementTest`'s sequential
per-unit loop and a couple of serial-instead-of-parallel query pairs (real but `better-sqlite3` is
synchronous/in-process, so these cost microtask overhead, not network latency); `SettingsForm`'s
optimistic-update rollback gap; `AppShell`'s duplicated desktop/mobile nav-item rendering.

### 2026-07-26 — Isolated git repo
`frenchapp/` was created inside a git repo rooted at the user's home directory (`~`), which also had
a real `origin` remote pointing at an unrelated GitHub repo. Flagged to the user; they chose to
`git init` a fresh, self-contained repo scoped to `frenchapp/` only. No changes made to the
home-directory repo.

### 2026-07-26 — Curriculum unit count vs. exact prompt table
Prompt table specifies 10/10/10/8/6 units for A1/A2/B1/B2/C1 (44 total). Used that exactly; assigned
concrete titles/grammar focus per unit in PLAN.md §2 since the prompt only gave level-level focus, not
per-unit breakdown.

### 2026-08-14 — Settings, achievements gallery, placement test (delegated build)
Built by a background agent, verified live (not just typecheck) per the standing "run it, don't just
typecheck it" lesson above. Notable calls: `reglages` extends `AppShell`/`(app)/layout.tsx` to apply
the persisted `reducedMotion` setting as `html[data-reduced-motion]` with a matching CSS rule
mirroring the existing `prefers-reduced-motion` block — this hook only applies within the `(app)`
route group, so `/placement` doesn't respect it yet (minor, cosmetic, noted rather than fixed).
Placement `score` is the plain fraction correct (not difficulty-weighted) and is kept orthogonal to
the unit recommendation, which is driven entirely by the final sustained CEFR level via
`UNITS_SORTED.find(u => u.level === finalCefr)` — verified live that a mostly-wrong run ends at A1 →
recommends "Premiers pas", and a stronger run lands higher. Placement questions are MCQ-only (reusing
`buildMcqPrompt` exactly, per instruction) — no listening/typed placement items. The agent also
independently noticed this session's own concurrent commit mid-task, diffed its files against it, and
confirmed nothing of its work was lost — flagged for transparency; no actual conflict occurred.

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
link styled as a button, tab, or menu item. **Also pass `nativeButton={false}`** on every
`<Button render={<Link .../>}>` — without it Base UI logs a console warning every render ("expected a
native `<button>`... Rendering a non-`<button>` removes native button semantics"), caught by an actual
browser walkthrough, not typecheck. All 8 existing occurrences (`(app)/page.tsx`, `SettingsForm`,
`WeakestWordsPanel`, `LessonResults` ×2, `ReviewResults` ×2, `PlacementResults`) were fixed together.

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
