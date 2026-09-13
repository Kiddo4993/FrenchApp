# Walking through Maîtrise

This is the app explained the way you'd explain it to a friend looking over your shoulder — what
you actually see and click, and then, in the second half, what's happening underneath it. If you
want the data model or the file-by-file architecture, that's [PLAN.md](./PLAN.md) and the
[README](./README.md#architecture). This doc is the "okay but what does it *do*" version.

## Opening it for the first time

You land on a mostly empty home screen with one card on it: *"Prêt à commencer ?"* — take a
placement test, or just start at A1. The placement test is 20 adaptive multiple-choice questions;
get a few right in a row and it pushes you toward harder words, miss a few and it backs off, and
wherever you land maps to a starting unit — you don't have to sit through "le/la/les" if you
already speak conversational French. Skip it and you start at unit one like everybody else.

Either way, the very first thing that happens behind the scenes is that unit one and its first
lesson get unlocked for you automatically. That sounds too obvious to mention, but it wasn't
always reliable — see [DECISIONS.md](./DECISIONS.md) for the saga of a race condition that made
this flaky on a cold database about a third of the time, and why the fix is "unlock it during
seeding" rather than "unlock it on first page load."

## The home screen

This is a skill tree, Duolingo-shaped but not Duolingo-colored: units stack vertically, each one a
row of circular lesson nodes connected by a line. A unit is a chunk of curriculum — "Premiers pas,"
"Chez moi," "À table" — and covers a handful of vocab topics plus a grammar point or two. There are
44 of them, spanning A1 through C1.

Locked units show up as a dim, collapsed row — you can see the title and level but not the lessons
inside. A unit unlocks once you've cleared every lesson in the one before it (crown level 1 or
higher on each) and passed that unit's boss test at 85% or better. Once a unit's fully mastered —
gold crowns across the board — its badge gets a little shimmer. If you stop practicing and your
recall on that unit's words genuinely decays (this is measured, not guessed — more on that below),
the gold crown visibly "cracks." Nothing punitive happens, it's just an honest signal that says
"you used to know this cold, go touch it up."

If you've got cards due for review, a banner appears above the skill tree: *"Réviser — N mots à
revoir."* That's not decorative — reviews are genuinely spaced-repetition-scheduled, so it only
shows up when something's actually due.

## Taking a lesson

Tap an unlocked node and you land in a full-screen exercise runner — no nav chrome, no sidebar,
just a progress bar at the top and an exit button. Each lesson is a sequence of short exercises
drawn from that lesson's vocab pool, and they rotate through different formats so it doesn't feel
like the same flashcard fourteen times in a row:

- **Recognition MCQ** — see a French word, pick the English meaning.
- **Production MCQ** — see the English, pick the French.
- **Listening** — hear it spoken (Web Speech API), pick or type what you heard.
- **Dictation** — hear a full sentence, type exactly what was said.
- **Word bank** — tap word tiles into the right order to build a sentence.
- **Free translation** — type a full translation yourself, no tiles to lean on.
- **Cloze** — fill in the blank in a sentence.
- **Gender drill** — le/la/l'/les for a noun. French gender is genuinely hard for English
  speakers and gets its own dedicated drill rather than being buried inside vocab MCQs.
- **Conjugation drill** — type the correct verb form for a given subject and tense.
- **Matching pairs** — a timed grid, match French to English before the clock runs out.
- **Speaking** — read a sentence aloud; recorded/scored, not just exposure.
- **Sentence ordering** — same idea as word bank but built around whole sentences.
- **Reading comprehension** — a short passage, then questions about it.
- **Odd one out** — spot the word that doesn't belong.
- **Register swap** — rephrase something casual (*familier*) into formal (*soutenu*) French.

Not every lesson node uses all fourteen from the start. Each node has five internal "crown"
levels, and the exercise kinds get harder as you re-run a node at a higher crown: crown 1 is just
multiple choice and gender drills, crown 4 adds dictation, and crown 5 drops multiple choice
entirely — it's free translation and speaking only, because by then you're supposed to be
producing French, not recognizing it.

Get something wrong and you're shown the correct answer plus a one-line explanation, not just a
red X. Hints only exist on the free-response kinds where you can actually get stuck typing an
answer — free translation, cloze, dictation, conjugation drill, register swap — not on multiple
choice, where you're already looking at the answer among four options. Using one is tracked,
because it feeds into how the spaced-repetition system grades your recall (see below). Wrong answers earn nothing; there's no partial credit, and
XP only rewards demonstrated recall. Correct answers earn 10 XP, or 15 for the harder production-
style kinds (dictation, free translation, speaking, register swap, sentence ordering). Finish a
lesson without a single miss and the whole thing doubles.

Levels aren't arbitrary either — the XP needed to reach the next one scales up smoothly
(`100 × level^1.5`, rounded), so early levels come fast and later ones take real practice.

## Reviewing (the spaced-repetition part)

This is the part that's not just a re-skin of a flashcard app. Every word you learn is tracked on
**four separate memory tracks**, not one: can you recognize it, can you produce it, can you
understand it spoken, can you spell it. You can "know" a word's meaning cold and still trip on
spelling it from dictation — those are genuinely different skills, and the app schedules reviews
for each one independently using [FSRS](https://github.com/open-spaced-repetition/free-spaced-repetition-scheduler)
(stability/difficulty/retrievability, not a fixed "review every N days" interval).

You're never asked to self-grade ("did you know that? yes/no"). The grade FSRS actually uses is
inferred — whether you got it right, how long you took, and whether you used a hint — which is a
more honest signal than trusting a tired brain to self-assess. Miss the same card enough times
running and it gets flagged as a "leech" internally, which is mostly a bookkeeping signal for
surfacing your weakest words on the dashboard rather than something you'll notice directly.

The `/reviser` page assembles whatever's actually due right now — due cards first, then new ones
up to your daily new-card cap (default 15, adjustable in settings) — and runs the same exercise
formats as a lesson. If nothing's due, it just tells you so and points you back to the skill tree
instead of manufacturing busywork.

## Grammar reference

`/grammaire` is a flat, searchable list of every grammar point across all 44 units — not gated by
your progress, so you can look up the subjunctive on day one if you want to. Each point has 6–10
worked examples, common mistakes, and a note on specifically *why* it trips up English speakers
(not just "here's the rule"). Search matches titles and tags, so typing "subjonctif" or "passé
composé" gets you there without knowing which unit it lives in.

## Conjugation trainer

`/conjugaison` covers roughly 120 verbs — infinitive, group, auxiliary, every tense, every person.
Pick a verb and tense and it runs a timed practice drill, or just browse the full 8×6 reference
grid per verb. This one's deliberately *not* spaced-repetition-tracked — it's a reference tool and
a warm-up, not another queue competing with your review deck. (There's a separate conjugation
exercise kind that *does* show up inside real lessons and reviews, and that one is card-backed.)

## Progress dashboard

`/progres` is seven honest panels, no vanity metrics:

1. **Mots connus** — words known, broken down by topic and by CEFR level.
2. **Courbe de rétention** — your retention curve over time.
3. **Précision par type d'exercice** — accuracy, split by exercise kind, so you can see "I'm great
   at MCQs and terrible at dictation" instead of one blended number hiding that.
4. **Précision par notion de grammaire** — same idea, but by grammar point.
5. **Assiduité** — a streak/attendance calendar.
6. **20 mots les plus fragiles** — your twenty shakiest words right now, ranked by the SRS's own
   confidence, not a guess.
7. **Vocabulaire projeté** — a simple forward projection of vocabulary growth at your current
   pace. It says exactly that on the page — "a simple projection, not a real predictive model" —
   because it isn't one, and pretending otherwise would be worse than not showing it.

## Achievements

`/succes` is a gallery of 41 achievements across four tiers (bronze/silver/gold/platinum) —
vocabulary milestones (10 words, then 100, 500, 1,000, 2,500, 4,000), conjugation-drill milestones,
streak milestones, and a handful of others. They're checked against real counters computed from
your actual history, not flags flipped by the UI.

## Settings

`/reglages` covers the things worth tuning for a single-learner app: your daily XP goal, target
retention percentage (higher means the SRS reviews things more often — there's a plain-language
note explaining the tradeoff right on the page), how many new cards per day, theme (light / dark /
system), and a reduce-motion toggle that actually turns off the spring animations, not just a
label. There's also a streak-freeze/repair section — you earn one freeze every 7-day streak (cap
2), a "weekend amulet" can protect a streak across a Saturday–Sunday gap once earned, and there's a
24-hour window to repair a streak you just broke, all shown with a real countdown, not "contact
support."

One honestly-unfinished corner: there's an "Énergie (cœurs)" toggle here — a lives/hearts mode,
off by default — and the data model has the fields for it, but nothing in the lesson flow actually
spends a heart on a wrong answer yet. It's wired up as a preference, not (yet) as a mechanic. Worth
knowing if you go looking for it and wonder why missing a question doesn't cost you anything.

## How it's actually built

The short version lives in the [README](./README.md#architecture); this is the slightly longer
version of the same story.

**Content is data, not code.** Every word, grammar point, verb, and reading passage lives in a JSON
file under `/content`, validated against Zod schemas before anything touches the database
(`scripts/validate-content.ts` — it'll fail loudly if a topic has too few entries, a lemma is
duplicated, or the whole thing falls under the 4,000-word floor). `npm run seed` is the only thing
that turns those files into rows. This means adding a new topic or fixing a typo in a translation
never requires touching a line of app code — see the README's "Content-authoring guide" if that's
what you're here for.

**One schema, one database engine, two drivers.** Everything runs on Postgres via Drizzle ORM.
Locally, with no `DATABASE_URL` set, that's an embedded WASM build of real Postgres
([PGlite](https://pglite.dev)) writing to a folder on your disk — zero setup, no Docker, no
"install Postgres first." Deployed, it's the same schema against a real hosted Postgres (Neon,
Supabase, whatever), because a serverless function's local disk doesn't persist between requests
and can't be written to at all in some environments — a lesson learned the hard way once, and
written up honestly in DECISIONS.md rather than swept under the rug.

**Reads and writes are deliberately separate.** Server Components call plain query functions
directly (`src/server/queries.ts` and friends) — there's no API layer to round-trip through for a
page that's rendering on the server anyway. Mutations go through `"use server"` Server Actions
(`src/server/actions.ts`), called from the client components that actually need to write
something (submitting an exercise answer, changing a setting, repairing a streak).

**The exercise engine and the SRS engine are separate concerns on purpose.** `src/lib/exercises/`
knows how to *generate* a prompt of a given kind from a vocab entry and a distractor pool; it
doesn't know anything about scheduling. `src/lib/srs/` knows how to grade an outcome and compute
the next due date on the right track; it doesn't know anything about what an exercise looks like
on screen. `lesson-composer.ts` and `review-composer.ts` are the glue that decides *which* cards
and prompts go into a given session.

**Nothing is graded by the user.** Every SRS grade is inferred from correctness, response latency,
and hint usage — the app watches what actually happened rather than asking you to rate your own
memory, which is both more accurate and one less button to tap.

If you want the reasoning behind specific choices — why Postgres instead of SQLite, why the
lazy-DB-client idea got tried and reverted, why the cold-start unlock bug took three attempts to
actually fix — that's all in [DECISIONS.md](./DECISIONS.md), written as it happened rather than
cleaned up after the fact.
